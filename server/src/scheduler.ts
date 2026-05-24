import cron from 'node-cron';
import { query, queryOne } from './db/database.js';
import { sendEmail, emailVencimentoAlerta } from './services/email.js';

function gerarProtocolo(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `OS-${y}${m}${d}-${r}`;
}

function calcularProximaExecucao(frequencia: string, base: Date, diaExecucao: number): Date {
  const result = new Date(base);
  switch (frequencia) {
    case 'semanal': result.setDate(result.getDate() + 7); break;
    case 'quinzenal': result.setDate(result.getDate() + 15); break;
    case 'mensal': result.setMonth(result.getMonth() + 1); break;
    case 'bimestral': result.setMonth(result.getMonth() + 2); break;
    case 'trimestral': result.setMonth(result.getMonth() + 3); break;
    case 'semestral': result.setMonth(result.getMonth() + 6); break;
    case 'anual': result.setFullYear(result.getFullYear() + 1); break;
  }
  if (['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(frequencia) && diaExecucao) {
    result.setDate(Math.min(diaExecucao, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
  }
  return result;
}

/** Gerar OS automáticas a partir de planos preventivos com auto_gerar_os = true */
async function processarPlanos() {
  console.log('[Scheduler] Verificando planos preventivos...');
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  const planos = await query(
    `SELECT p.*, e.nome as equipamento_nome, e.codigo as equipamento_codigo
     FROM planos_manutencao p
     LEFT JOIN equipamentos e ON e.id = p.equipamento_id
     WHERE p.status = 'ativo' AND p.auto_gerar_os = true
       AND p.proxima_execucao IS NOT NULL AND p.proxima_execucao <= $1`,
    [hoje]
  );

  let geradas = 0;

  for (const plano of planos) {
    try {
      const protocolo = gerarProtocolo();
      const titulo = `[Preventiva] ${plano.titulo}`;
      const descricao = plano.descricao
        ? `Manutenção preventiva automática.\n\n${plano.descricao}`
        : 'Manutenção preventiva gerada automaticamente pelo scheduler.';

      const os = await queryOne(
        `INSERT INTO ordens_servico (protocolo, condominio_id, titulo, descricao, tipo, prioridade, status,
          responsavel_id, equipamento_id, plano_id, criado_por)
         VALUES ($1, $2, $3, $4, 'preventiva', 'media', 'aberta', $5, $6, $7, $5)
         RETURNING id`,
        [
          protocolo, plano.condominio_id, titulo, descricao,
          plano.responsavel_id || plano.criado_por,
          plano.equipamento_id, plano.id,
        ]
      );

      // Atualizar próxima execução
      const proxima = calcularProximaExecucao(plano.frequencia, new Date(plano.proxima_execucao), plano.dia_execucao || 1);
      await query(
        `UPDATE planos_manutencao SET ultima_execucao = $1, proxima_execucao = $2, atualizado_em = NOW() WHERE id = $3`,
        [new Date(), proxima, plano.id]
      );

      // Registrar execução do scheduler
      await query(
        `INSERT INTO scheduler_execucoes (tipo, plano_id, os_gerada_id, status, detalhes)
         VALUES ('plano_preventivo', $1, $2, 'sucesso', $3)`,
        [plano.id, os?.id, `OS ${protocolo} gerada para plano "${plano.titulo}"`]
      );

      geradas++;
    } catch (err: any) {
      console.error(`[Scheduler] Erro ao processar plano ${plano.id}:`, err.message);
      await query(
        `INSERT INTO scheduler_execucoes (tipo, plano_id, status, detalhes)
         VALUES ('plano_preventivo', $1, 'erro', $2)`,
        [plano.id, err.message]
      ).catch(() => {});
    }
  }

  if (geradas > 0) console.log(`[Scheduler] ${geradas} OS preventivas geradas.`);
}

/** Atualizar status SLA de ordens de serviço */
async function atualizarSLA() {
  console.log('[Scheduler] Atualizando status SLA...');
  const now = new Date();

  // Violados: limite de resolução passou
  const violadas = await query(
    `UPDATE ordens_servico SET sla_status = 'violado'
     WHERE status NOT IN ('concluida','cancelada')
       AND sla_resolucao_limite IS NOT NULL AND sla_resolucao_limite < $1
       AND sla_status != 'violado'
     RETURNING id`,
    [now]
  );

  // Em risco: menos de 25% do tempo restante
  const emRisco = await query(
    `UPDATE ordens_servico SET sla_status = 'em_risco'
     WHERE status NOT IN ('concluida','cancelada')
       AND sla_resolucao_limite IS NOT NULL
       AND sla_status = 'dentro_prazo'
       AND sla_resolucao_limite < $1::timestamptz + (sla_resolucao_limite - data_abertura) * 0.25
     RETURNING id`,
    [now.toISOString()]
  );

  if (violadas.length > 0 || emRisco.length > 0) {
    console.log(`[Scheduler] SLA: ${violadas.length} violadas, ${emRisco.length} em risco.`);
  }
}

/** Verificar vencimentos próximos */
async function verificarVencimentos() {
  console.log('[Scheduler] Verificando vencimentos...');
  const em30dias = new Date();
  em30dias.setDate(em30dias.getDate() + 30);

  const docs = await query(
    `SELECT id, titulo, data_validade, condominio_id FROM documentos_tecnicos
     WHERE status = 'vigente' AND data_validade IS NOT NULL
       AND data_validade <= $1 AND data_validade >= CURRENT_DATE`,
    [em30dias]
  );

  for (const doc of docs) {
    const dias = Math.ceil((new Date(doc.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias <= 7 || dias === 15 || dias === 30) {
      // Criar notificação para admins do condomínio
      const admins = await query(
        `SELECT id FROM usuarios WHERE role IN ('master','administrador')
         AND (condominio_id = $1 OR role = 'master') AND ativo = true`,
        [doc.condominio_id]
      );
      for (const admin of admins) {
        await query(
          `INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
           SELECT $1, $2, $3, 'alerta', '/documentos'
           WHERE NOT EXISTS (
             SELECT 1 FROM notificacoes WHERE user_id = $1 AND link = '/documentos'
               AND titulo = $2 AND criado_em > NOW() - INTERVAL '1 day'
           )`,
          [admin.id, `Documento vence em ${dias} dias`, `"${doc.titulo}" vence em ${dias} dias.`]
        ).catch(() => {});
      }
    }
  }
}

/** Verificar contratos de fornecedores prestes a vencer */
async function verificarContratos() {
  console.log('[Scheduler] Verificando contratos de fornecedores...');

  const contratos = await query(
    `SELECT fc.id, fc.numero_contrato, fc.data_fim, fc.alerta_dias_antes, fc.renovacao_automatica,
            f.nome as fornecedor_nome, fc.condominio_id
     FROM fornecedores_contratos fc
     JOIN fornecedores f ON f.id = fc.fornecedor_id
     WHERE fc.status = 'vigente' AND fc.data_fim IS NOT NULL
       AND fc.data_fim <= CURRENT_DATE + fc.alerta_dias_antes * INTERVAL '1 day'
       AND fc.data_fim >= CURRENT_DATE`,
    []
  );

  for (const c of contratos) {
    const dias = Math.ceil((new Date(c.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const admins = await query(
      `SELECT id FROM usuarios WHERE role IN ('master','administrador')
       AND (condominio_id = $1 OR role = 'master') AND ativo = true`,
      [c.condominio_id]
    );
    for (const admin of admins) {
      await query(
        `INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
         SELECT $1, $2, $3, 'alerta', '/fornecedores'
         WHERE NOT EXISTS (
           SELECT 1 FROM notificacoes WHERE user_id = $1
             AND titulo = $2 AND criado_em > NOW() - INTERVAL '1 day'
         )`,
        [
          admin.id,
          `Contrato vence em ${dias} dias`,
          `Contrato ${c.numero_contrato || ''} do fornecedor "${c.fornecedor_nome}" vence em ${dias} dias.`
        ]
      ).catch(() => {});
    }
  }

  if (contratos.length > 0) console.log(`[Scheduler] ${contratos.length} contratos próximos do vencimento.`);
}

/**
 * Atualiza status dos laudos e envia e-mails de alerta nos marcos
 * (30, 15, 7, 3, 1 dias antes do vencimento e no dia do vencimento).
 * Cada combinação (laudo, marco) é enviada no máximo uma vez (laudos_alertas_log).
 */
async function processarLaudos() {
  console.log('[Scheduler] Verificando laudos obrigatórios...');

  // Atualizar status calculado
  await query(`
    UPDATE laudos SET status = CASE
      WHEN status IN ('renovado','cancelado') THEN status
      WHEN data_vencimento <  CURRENT_DATE THEN 'vencido'
      WHEN data_vencimento <= CURRENT_DATE + (prazo_alerta_dias || ' days')::interval THEN 'proximo_vencimento'
      ELSE 'vigente'
    END
    WHERE status NOT IN ('renovado','cancelado')
  `);

  // Marcos de alerta
  const MARCOS = [30, 15, 7, 3, 1, 0];

  for (const marco of MARCOS) {
    const laudos = await query<any>(
      `SELECT l.*, c.nome AS condominio_nome, c.criado_por AS condo_responsavel
         FROM laudos l
         LEFT JOIN condominios c ON c.id = l.condominio_id
        WHERE l.status NOT IN ('renovado','cancelado')
          AND (l.data_vencimento - CURRENT_DATE) = $1
          AND l.prazo_alerta_dias >= $1
          AND NOT EXISTS (
            SELECT 1 FROM laudos_alertas_log al
            WHERE al.laudo_id = l.id AND al.dias_restantes = $1
          )`,
      [marco]
    );

    for (const l of laudos) {
      // Descobrir destinatários: master + admin do condomínio + responsável + síndico
      const destinatarios = await query<{ email: string }>(
        `SELECT DISTINCT u.email
           FROM usuarios u
          WHERE u.ativo = true AND u.email IS NOT NULL AND (
            u.role = 'master'
            OR u.id = $1
            OR u.condominio_id = $2
            OR (u.role = 'administrador' AND u.id = (SELECT criado_por FROM condominios WHERE id = $2))
          )`,
        [l.condo_responsavel, l.condominio_id]
      ).catch(() => []);

      const emails = destinatarios.map(d => d.email);
      if (emails.length === 0) continue;

      const docTitulo = l.titulo || tipoLabelFallback(l.tipo);
      const dataFmt = new Date(l.data_vencimento).toLocaleDateString('pt-BR');
      const tpl = await emailVencimentoAlerta(docTitulo, marco, l.condominio_nome || '', dataFmt);
      tpl.to = emails;
      const ok = await sendEmail(tpl);

      if (ok) {
        await query(
          `INSERT INTO laudos_alertas_log (laudo_id, dias_restantes, destinatarios) VALUES ($1, $2, $3)`,
          [l.id, marco, emails]
        );
        console.log(`[Scheduler/Laudos] Alerta D-${marco} enviado para ${emails.length} destinatário(s) — laudo ${l.id}`);
      }
    }
  }
}

function tipoLabelFallback(tipo: string): string {
  const map: Record<string, string> = {
    avcb: 'AVCB', spda: 'SPDA / Para-raios', elevador: 'Inspeção de Elevador',
    potabilidade: 'Potabilidade da Água', pmoc: 'PMOC', gas: 'Estanqueidade de Gás',
    caldeira: 'Caldeira', piscina: 'Análise da Piscina', fachada: 'Inspeção de Fachada',
    estrutural: 'Inspeção Predial', desinsetizacao: 'Desinsetização',
    extintores: 'Extintores', outro: 'Laudo',
  };
  return map[tipo] || tipo;
}

// Avisa por e-mail planos de manutenção que se aproximam do vencimento (dias_aviso antes)
async function avisarManutencoes() {
  const rows = await query<any>(`
    SELECT p.id, p.titulo, p.proxima_execucao, p.email_aviso_1, p.email_aviso_2,
           p.dias_aviso, p.aviso_enviado_em, c.nome AS condominio_nome
    FROM planos_manutencao p
    LEFT JOIN condominios c ON c.id = p.condominio_id
    WHERE p.status = 'ativo'
      AND p.proxima_execucao IS NOT NULL
      AND (p.email_aviso_1 IS NOT NULL OR p.email_aviso_2 IS NOT NULL)
      AND p.proxima_execucao <= CURRENT_DATE + COALESCE(p.dias_aviso, 7) * INTERVAL '1 day'
      AND (p.aviso_enviado_em IS NULL OR p.aviso_enviado_em < p.proxima_execucao - COALESCE(p.dias_aviso, 7) * INTERVAL '1 day')
  `);
  for (const p of rows) {
    const destinatarios = [p.email_aviso_1, p.email_aviso_2].filter(Boolean) as string[];
    if (!destinatarios.length) continue;
    const data = new Date(p.proxima_execucao).toLocaleDateString('pt-BR');
    const assunto = `Manutenção próxima: ${p.titulo}`;
    const html = `
      <h2>Aviso de manutenção</h2>
      <p><strong>${p.titulo}</strong></p>
      <p>Condomínio: ${p.condominio_nome || '—'}</p>
      <p>Próxima execução: <strong>${data}</strong></p>
      <p>Você está sendo avisado(a) ${p.dias_aviso || 7} dia(s) antes da data prevista.</p>
    `;
    try {
      for (const to of destinatarios) {
        await sendEmail({ to, subject: assunto, html });
      }
      await queryOne(`UPDATE planos_manutencao SET aviso_enviado_em = NOW() WHERE id = $1 RETURNING id`, [p.id]);
      console.log(`[Scheduler] Aviso manutenção enviado: ${p.titulo} → ${destinatarios.join(', ')}`);
    } catch (e: any) {
      console.error(`[Scheduler] Falha aviso manutenção ${p.id}:`, e.message);
    }
  }
}

export function iniciarScheduler() {
  // A cada hora: verificar planos preventivos + SLA
  cron.schedule('0 * * * *', async () => {
    try { await processarPlanos(); } catch (e: any) { console.error('[Scheduler] Erro planos:', e.message); }
    try { await atualizarSLA(); } catch (e: any) { console.error('[Scheduler] Erro SLA:', e.message); }
  });

  // Diariamente às 7h: verificar vencimentos + laudos + avisos manutenção
  cron.schedule('0 7 * * *', async () => {
    try { await verificarVencimentos(); } catch (e: any) { console.error('[Scheduler] Erro vencimentos:', e.message); }
    try { await processarLaudos(); } catch (e: any) { console.error('[Scheduler] Erro laudos:', e.message); }
    try { await avisarManutencoes(); } catch (e: any) { console.error('[Scheduler] Erro avisos manutenção:', e.message); }
  });

  // Executar uma vez na inicialização
  setTimeout(async () => {
    try { await processarPlanos(); } catch (e: any) { console.error('[Scheduler] Erro planos init:', e.message); }
    try { await atualizarSLA(); } catch (e: any) { console.error('[Scheduler] Erro SLA init:', e.message); }
  }, 5000);

  // Diariamente às 8h: verificar contratos a vencer
  cron.schedule('0 8 * * *', async () => {
    try { await verificarContratos(); } catch (e: any) { console.error('[Scheduler] Erro contratos:', e.message); }
  });

  console.log('[Scheduler] Tarefas agendadas: planos (1h), SLA (1h), vencimentos+laudos (7h), contratos (8h)');
}
