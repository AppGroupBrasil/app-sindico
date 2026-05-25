import React from 'react';
import {
  Crown, LayoutDashboard, CalendarClock, Building2, Contact, Wrench,
  ClipboardCheck, Megaphone, CalendarCheck, Columns3, Calendar, Eye,
  MapPin, QrCode, BookOpen, BarChart3, Shield, FileWarning
} from 'lucide-react';
import styles from './DemoShowcasePage.module.css';

const Section: React.FC<{ icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }> = ({ icon, title, desc, children }) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <div className={styles.sectionIcon}>{icon}</div>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDesc}>{desc}</p>
      </div>
    </div>
    {children}
  </section>
);

const DemoShowcasePage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBanner}>
          👀 <strong>Tela apenas de demonstração</strong> — visual sem interação. Ao criar sua conta, tudo abaixo fica clicável.
          <a href="/cadastro" style={{ marginLeft: 12, background: '#422006', color: '#fbbf24', padding: '6px 14px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}>
            Criar conta grátis
          </a>
        </div>

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Conheça o sistema completo</h1>
          <p className={styles.heroSubtitle}>
            Veja como o APP Síndico organiza a gestão do seu condomínio — comunicados, ordens de serviço, vencimentos, moradores, vistorias, revista digital e muito mais.
          </p>
        </div>

        {/* PAINEL DO SÍNDICO */}
        <Section icon={<Crown size={22} />} title="Painel do Síndico" desc="Visão geral em tempo real">
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Condomínios</div><div className={styles.kpiValue}>4</div><div className={styles.kpiHint}>+1 este mês</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>OS Abertas</div><div className={styles.kpiValue}>12</div><div className={`${styles.kpiHint} ${styles.kpiHintBad}`}>3 atrasadas</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Concluídas (mês)</div><div className={styles.kpiValue}>47</div><div className={styles.kpiHint}>+18%</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>SLA Violadas</div><div className={styles.kpiValue}>2</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Solicitações</div><div className={styles.kpiValue}>8</div><div className={`${styles.kpiHint} ${styles.kpiHintBad}`}>5 pendentes</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Moradores ativos</div><div className={styles.kpiValue}>312</div></div>
          </div>
        </Section>

        {/* AGENDA DE VENCIMENTOS */}
        <Section icon={<CalendarClock size={22} />} title="Agenda de Vencimentos" desc="Contratos, contas e renovações">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Contrato — Elevadores Atlas</div><div className={styles.listSub}>Vence em 12 dias · R$ 3.450,00</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Próximo</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Conta de Luz — Eletropaulo</div><div className={styles.listSub}>Vence em 3 dias · R$ 8.890,00</div></div><span className={`${styles.badge} ${styles.badgeDanger}`}>Urgente</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>AVCB — Corpo de Bombeiros</div><div className={styles.listSub}>Vence em 45 dias</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Em dia</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Seguro Predial — Porto Seguro</div><div className={styles.listSub}>Vence em 28 dias · R$ 5.200,00</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Em dia</span></div>
        </Section>

        {/* CONDOMÍNIOS */}
        <Section icon={<Building2 size={22} />} title="Cadastro de Condomínios" desc="Múltiplos condomínios gerenciados">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Residencial Jardim das Flores</div><div className={styles.listSub}>4 blocos · 96 unidades · Rua das Flores, 123</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Master</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Edifício Solar Atlântico</div><div className={styles.listSub}>1 bloco · 32 unidades · Av. Beira-Mar, 4500</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Admin</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Condomínio Vila Verde</div><div className={styles.listSub}>2 blocos · 48 unidades · Rua dos Pinheiros, 89</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Admin</span></div>
        </Section>

        {/* MORADORES */}
        <Section icon={<Contact size={22} />} title="Cadastro de Moradores" desc="Diretório completo de moradores e contatos">
          <div className={styles.moradoresGrid}>
            {[
              { nome: 'Ana Souza', ap: 'Bloco A · 101' },
              { nome: 'Carlos Lima', ap: 'Bloco A · 203' },
              { nome: 'Mariana Reis', ap: 'Bloco B · 405' },
              { nome: 'João Pereira', ap: 'Bloco B · 502' },
              { nome: 'Beatriz Silva', ap: 'Bloco C · 304' },
              { nome: 'Roberto Alves', ap: 'Bloco C · 707' },
            ].map(m => (
              <div key={m.nome} className={styles.moradorCard}>
                <div className={styles.moradorAvatar}>{m.nome.charAt(0)}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{m.ap}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ORDENS DE SERVIÇO */}
        <Section icon={<Wrench size={22} />} title="Ordens de Serviço" desc="Manutenção corretiva, preventiva e emergencial">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>OS #047 — Vazamento no 7º andar</div><div className={styles.listSub}>Bloco B · Aberta há 2h · Atribuída ao zelador Marcos</div></div><span className={`${styles.badge} ${styles.badgeDanger}`}>Urgente</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>OS #046 — Lâmpada queimada hall</div><div className={styles.listSub}>Bloco A · Em andamento</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Em andamento</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>OS #045 — Limpeza caixa d'água</div><div className={styles.listSub}>Geral · Concluída ontem · R$ 1.800,00</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Concluída</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>OS #044 — Pintura corredores 4º andar</div><div className={styles.listSub}>Bloco C · Agendada para 15/03</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Agendada</span></div>
        </Section>

        {/* QUADRO DE ATIVIDADES */}
        <Section icon={<Columns3 size={22} />} title="Quadro de Atividades" desc="Kanban arrastável para o time">
          <div className={styles.kanban}>
            <div className={styles.kanbanCol}>
              <div className={styles.kanbanColTitle}>A fazer</div>
              <div className={styles.kanbanCard}>Trocar fechadura portão garagem</div>
              <div className={styles.kanbanCard}>Pintar guarita</div>
              <div className={styles.kanbanCard}>Revisar bomba d'água</div>
            </div>
            <div className={styles.kanbanCol}>
              <div className={styles.kanbanColTitle}>Em andamento</div>
              <div className={styles.kanbanCard}>Reparo elevador social</div>
              <div className={styles.kanbanCard}>Limpeza piscina</div>
            </div>
            <div className={styles.kanbanCol}>
              <div className={styles.kanbanColTitle}>Concluído</div>
              <div className={styles.kanbanCard}>Vistoria mensal hidrantes</div>
              <div className={styles.kanbanCard}>Poda da grama</div>
              <div className={styles.kanbanCard}>Manutenção interfone</div>
            </div>
          </div>
        </Section>

        {/* COMUNICADOS */}
        <Section icon={<Megaphone size={22} />} title="Comunicados / Avisos" desc="Envio para WhatsApp, e-mail e push">
          <div className={styles.comuCard}>
            <div className={styles.comuTit}>📢 Manutenção do elevador — 15 e 16/03</div>
            <div className={styles.comuTexto}>Nos dias 15 e 16, o elevador social ficará desligado das 8h às 17h para revisão obrigatória. Utilizem o de serviço.</div>
          </div>
          <div className={styles.comuCard}>
            <div className={styles.comuTit}>🎉 Festa Junina do condomínio — 22/06</div>
            <div className={styles.comuTexto}>Confirmem presença até 18/06 com a administração. Cada morador pode levar 2 convidados.</div>
          </div>
        </Section>

        {/* CHECKLISTS + TAREFAS */}
        <Section icon={<ClipboardCheck size={22} />} title="Checklists" desc="Modelos prontos para vistoria e ronda">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Checklist Diário — Portaria</div><div className={styles.listSub}>15 itens · Última execução hoje 06:00 por Carlos</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>OK</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Checklist Semanal — Áreas Comuns</div><div className={styles.listSub}>22 itens · 1 pendência registrada</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Pendente</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Checklist Mensal — Equipamentos</div><div className={styles.listSub}>30 itens · Próxima execução em 5 dias</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Agendado</span></div>
        </Section>

        {/* ESCALAS */}
        <Section icon={<Calendar size={22} />} title="Escalas de Trabalho" desc="Funcionários, turnos e folgas">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Marcos Silva — Porteiro diurno</div><div className={styles.listSub}>Seg–Sex · 06h–14h · Folga próxima: 16/03</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Ativo</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>José Oliveira — Porteiro noturno</div><div className={styles.listSub}>Seg–Sex · 22h–06h · Última folga: 10/03</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Ativo</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Pedro Santos — Zelador</div><div className={styles.listSub}>Ter–Sáb · 07h–16h</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Ativo</span></div>
        </Section>

        {/* VISTORIAS */}
        <Section icon={<Eye size={22} />} title="Vistorias e Inspeções" desc="Antes/depois com fotos georreferenciadas">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Vistoria Anual — Bloco A</div><div className={styles.listSub}>Concluída em 28/02 · 42 fotos · 3 itens pendentes</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Pendências</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Vistoria Mensal — Piscina</div><div className={styles.listSub}>Concluída em 05/03 · Tudo conforme</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>OK</span></div>
        </Section>

        {/* GEOLOCALIZAÇÃO */}
        <Section icon={<MapPin size={22} />} title="Geolocalização da Equipe" desc="Posição em tempo real (GPS)">
          <div className={styles.miniMap}>
            <div className={styles.mapPin} style={{ top: '30%', left: '40%' }} />
            <div className={styles.mapPin} style={{ top: '55%', left: '62%', background: '#16a34a' }} />
            <div className={styles.mapPin} style={{ top: '70%', left: '25%', background: '#f59e0b' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, color: '#1e3a8a', background: 'rgba(255,255,255,0.85)', padding: '4px 8px', borderRadius: 6 }}>3 funcionários online · atualizado há 12s</div>
          </div>
        </Section>

        {/* SOLICITAÇÕES DOS MORADORES */}
        <Section icon={<FileWarning size={22} />} title="Solicitações dos Moradores" desc="Reclamações e ocorrências via QR Code">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Apto 402 — Barulho excessivo no 5º</div><div className={styles.listSub}>Há 4h · Aguardando resposta do síndico</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Aberta</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Apto 805 — Sugestão de troca da câmera</div><div className={styles.listSub}>Há 2 dias · Em análise</div></div><span className={`${styles.badge} ${styles.badgeInfo}`}>Em análise</span></div>
        </Section>

        {/* QR CODE */}
        <Section icon={<QrCode size={22} />} title="QR Codes do Condomínio" desc="Acesso rápido sem login para moradores e visitantes">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['Solicitações', 'Revista', 'Reservas', 'Avisos'].map(t => (
              <div key={t} style={{ flex: '1 1 140px', background: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 80, height: 80, background: `repeating-conic-gradient(#0f172a 0 25%, #fff 0 50%) 50%/14px 14px`, borderRadius: 6, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* RELATÓRIOS */}
        <Section icon={<BarChart3 size={22} />} title="Relatórios" desc="Indicadores, gráficos e PDFs prontos">
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Tempo médio OS</div><div className={styles.kpiValue}>2.3<span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>d</span></div><div className={styles.kpiHint}>-12% vs mês passado</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Custo mensal médio</div><div className={styles.kpiValue}>R$ 71k</div><div className={styles.kpiHint}>Dentro do orçamento</div></div>
            <div className={styles.kpiCard}><div className={styles.kpiLabel}>Satisfação morador</div><div className={styles.kpiValue}>4.6<span style={{ fontSize: 14, color: '#64748b' }}>/5</span></div></div>
          </div>
        </Section>

        {/* SEGURANÇA / LAUDOS */}
        <Section icon={<Shield size={22} />} title="Laudos Obrigatórios" desc="AVCB, SPDA, Elevador, Potabilidade, PMOC e mais">
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>AVCB — Auto de Vistoria do Corpo de Bombeiros</div><div className={styles.listSub}>Vence em 8 meses</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Vigente</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>SPDA — Para-raios</div><div className={styles.listSub}>Vence em 22 dias</div></div><span className={`${styles.badge} ${styles.badgeWarn}`}>Próximo</span></div>
          <div className={styles.listRow}><div className={styles.listMain}><div className={styles.listTitle}>Elevador — Relatório de Inspeção Anual</div><div className={styles.listSub}>Vence em 4 meses</div></div><span className={`${styles.badge} ${styles.badgeOk}`}>Vigente</span></div>
        </Section>

        {/* REVISTA */}
        <Section icon={<BookOpen size={22} />} title="Revista do Síndico" desc="Comunicação digital com 19 categorias + 8 layouts de visualização">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: 160, height: 220, borderRadius: 12,
              background: 'url(https://picsum.photos/seed/capa-condo/800/1000) center/cover',
              display: 'flex', alignItems: 'flex-end', padding: 14, color: '#fff',
              boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>Revista do Condomínio</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Edição março · 2026</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '0 0 12px', color: '#475569', fontSize: 14 }}>22 páginas com recados do síndico, comunicados, antes/depois, financeiro, eventos, classificados, parceiros, sustentabilidade e muito mais.</p>
              <a href="/revista/visualizar?demo=1" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn} style={{ fontSize: 13, padding: '10px 18px' }}>
                Abrir revista demo →
              </a>
            </div>
          </div>
        </Section>

        {/* DASHBOARD ANALÍTICO */}
        <Section icon={<LayoutDashboard size={22} />} title="Painel Analítico" desc="Gráficos, evolução mensal e KPIs por condomínio">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { label: 'OS no mês', dados: [12, 18, 15, 22, 19, 25, 31] },
              { label: 'Custos (R$ mil)', dados: [42, 51, 48, 55, 49, 67, 71] },
              { label: 'Satisfação', dados: [4.1, 4.2, 4.3, 4.5, 4.4, 4.6, 4.6] },
            ].map(ch => {
              const max = Math.max(...ch.dados);
              return (
                <div key={ch.label} className={styles.kpiCard}>
                  <div className={styles.kpiLabel}>{ch.label}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginTop: 8 }}>
                    {ch.dados.map((v, i) => (
                      <div key={i} style={{
                        flex: 1, background: 'linear-gradient(180deg, #1E88E5, #0D47A1)',
                        height: `${(v / max) * 100}%`, borderRadius: 4,
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <CalendarCheck size={1} style={{ display: 'none' }} />{/* keep import used */}

        <div className={styles.ctaEnd}>
          <h2>Pronto para usar de verdade?</h2>
          <p>Tudo isso está disponível no plano gratuito. Cadastre-se em 1 minuto.</p>
          <a href="/cadastro" className={styles.ctaBtn}>✨ Criar minha conta grátis</a>
        </div>
      </div>
    </div>
  );
};

export default DemoShowcasePage;
