import { Router, Response } from 'express';
import { query } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

// Helpers de escopo: master vê todos os condomínios; administradora vê só os dela.
function condosScope(user: AuthRequest['user']) {
  if (user!.role === 'master') return { sql: 'TRUE', params: [] };
  return {
    sql: 'c.criado_por = $1',
    params: [user!.id],
  };
}

// GET /api/dashboard-consolidado
// Visão consolidada para master e administradora.
router.get('/', requireMinRole('administrador'), async (req: AuthRequest, res: Response) => {
  const scope = condosScope(req.user);

  // Lista de condomínios com KPIs por linha
  const condominios = await query<any>(
    `SELECT
        c.id, c.nome, c.endereco, c.cidade, c.estado AS uf,
        (SELECT COUNT(*) FROM ordens_servico o
           WHERE o.condominio_id = c.id AND o.status NOT IN ('concluida','cancelada'))         AS os_abertas,
        (SELECT COUNT(*) FROM ordens_servico o
           WHERE o.condominio_id = c.id AND o.status NOT IN ('concluida','cancelada')
             AND o.prioridade IN ('alta','urgente'))                                            AS os_urgentes,
        (SELECT COUNT(*) FROM laudos l
           WHERE l.condominio_id = c.id AND l.data_vencimento < CURRENT_DATE
             AND l.status NOT IN ('renovado','cancelado'))                                      AS laudos_vencidos,
        (SELECT COUNT(*) FROM laudos l
           WHERE l.condominio_id = c.id
             AND l.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
             AND l.status NOT IN ('renovado','cancelado'))                                      AS laudos_30,
        (SELECT COUNT(*) FROM vencimentos v
           WHERE v.condominio_id = c.id
             AND v.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')  AS vencimentos_30,
        (SELECT COUNT(*) FROM moradores m WHERE m.condominio_id = c.id)                          AS moradores,
        (SELECT COUNT(*) FROM usuarios u WHERE u.condominio_id = c.id AND u.ativo = true)       AS usuarios,
        (SELECT MAX(data_abertura) FROM ordens_servico o WHERE o.condominio_id = c.id)          AS ultima_os
     FROM condominios c
     WHERE ${scope.sql}
     ORDER BY c.nome ASC`,
    scope.params
  );

  // Totais agregados (somando as linhas do resultado por condomínio)
  const totais = {
    condominios:      condominios.length,
    os_abertas:       condominios.reduce((s, c) => s + Number(c.os_abertas || 0), 0),
    os_urgentes:      condominios.reduce((s, c) => s + Number(c.os_urgentes || 0), 0),
    laudos_vencidos:  condominios.reduce((s, c) => s + Number(c.laudos_vencidos || 0), 0),
    laudos_30:        condominios.reduce((s, c) => s + Number(c.laudos_30 || 0), 0),
    moradores:        condominios.reduce((s, c) => s + Number(c.moradores || 0), 0),
    funcionarios:     condominios.reduce((s, c) => s + Number(c.usuarios || 0), 0),
  };

  // Top 5 alertas críticos (laudos vencidos ou OS urgentes mais antigas)
  const alertasCriticos = await query<any>(
    `(SELECT 'laudo_vencido' AS tipo, l.id, l.titulo AS descricao, l.tipo AS subtipo,
             c.id AS condominio_id, c.nome AS condominio_nome,
             (CURRENT_DATE - l.data_vencimento) AS dias, l.data_vencimento AS data_ref
        FROM laudos l JOIN condominios c ON c.id = l.condominio_id
       WHERE (${scope.sql})
         AND l.data_vencimento < CURRENT_DATE
         AND l.status NOT IN ('renovado','cancelado')
       ORDER BY l.data_vencimento ASC LIMIT 5)
     UNION ALL
     (SELECT 'os_urgente' AS tipo, o.id, o.titulo AS descricao, o.prioridade::text AS subtipo,
             c.id, c.nome, EXTRACT(DAY FROM (NOW() - o.data_abertura))::int AS dias, o.data_abertura::date
        FROM ordens_servico o JOIN condominios c ON c.id = o.condominio_id
       WHERE (${scope.sql})
         AND o.status NOT IN ('concluida','cancelada')
         AND o.prioridade IN ('alta','urgente')
       ORDER BY o.data_abertura ASC LIMIT 5)`,
    [...scope.params, ...scope.params]
  );

  res.json({
    totais: totais || {},
    condominios,
    alertasCriticos,
  });
});

export default router;
