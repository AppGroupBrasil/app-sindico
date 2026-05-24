import { Router, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

// Catálogo dos tipos de laudo obrigatórios para condomínios brasileiros.
// O frontend usa essa mesma lista para o select.
export const TIPOS_LAUDO = [
  { key: 'avcb',           label: 'AVCB — Auto de Vistoria do Corpo de Bombeiros' },
  { key: 'spda',           label: 'SPDA — Para-raios (Sistema de Proteção contra Descargas Atmosféricas)' },
  { key: 'elevador',       label: 'RIA — Relatório de Inspeção Anual de Elevadores' },
  { key: 'potabilidade',   label: 'Potabilidade da Água' },
  { key: 'pmoc',           label: 'PMOC — Plano de Manutenção de Climatização' },
  { key: 'gas',            label: 'Estanqueidade de Gás' },
  { key: 'caldeira',       label: 'Inspeção de Caldeira (NR-13)' },
  { key: 'piscina',        label: 'Análise de Água da Piscina' },
  { key: 'fachada',        label: 'Inspeção de Fachada' },
  { key: 'estrutural',     label: 'Inspeção Predial / Estrutural' },
  { key: 'desinsetizacao', label: 'Desinsetização / Desratização' },
  { key: 'extintores',     label: 'Recarga de Extintores' },
  { key: 'outro',          label: 'Outro' },
];

// Cláusula de escopo por role (master vê tudo; admin vê seus condos; demais veem só o próprio)
function scopeWhere(req: AuthRequest, alias = 'l'): { sql: string; params: any[] } {
  const u = req.user!;
  if (u.role === 'master') return { sql: 'TRUE', params: [] };
  if (u.role === 'administrador') {
    return {
      sql: `${alias}.condominio_id IN (SELECT id FROM condominios WHERE criado_por = $1)`,
      params: [u.id],
    };
  }
  return { sql: `${alias}.condominio_id = $1`, params: [u.condominio_id] };
}

// GET /api/laudos/tipos — catálogo
router.get('/tipos', async (_req, res: Response) => { res.json(TIPOS_LAUDO); });

// GET /api/laudos
router.get('/', async (req: AuthRequest, res: Response) => {
  const { condominioId, status, tipo, vencendoEm } = req.query as Record<string, string>;
  const scope = scopeWhere(req);
  const where: string[] = [scope.sql];
  const params: any[] = [...scope.params];

  if (condominioId) { params.push(condominioId); where.push(`l.condominio_id = $${params.length}`); }
  if (status)       { params.push(status);       where.push(`l.status = $${params.length}`); }
  if (tipo)         { params.push(tipo);         where.push(`l.tipo = $${params.length}`); }
  if (vencendoEm)   {
    params.push(parseInt(vencendoEm, 10));
    where.push(`l.data_vencimento <= (CURRENT_DATE + ($${params.length} || ' days')::interval)`);
  }

  const rows = await query(
    `SELECT l.*, c.nome AS condominio_nome,
            (l.data_vencimento - CURRENT_DATE) AS dias_restantes
     FROM laudos l
     LEFT JOIN condominios c ON c.id = l.condominio_id
     WHERE ${where.join(' AND ')}
     ORDER BY l.data_vencimento ASC`,
    params
  );
  res.json(rows);
});

// GET /api/laudos/resumo — KPIs pra dashboard
router.get('/resumo', async (req: AuthRequest, res: Response) => {
  const scope = scopeWhere(req);
  const row = await queryOne<any>(
    `SELECT
        COUNT(*) FILTER (WHERE l.data_vencimento <  CURRENT_DATE)                                                AS vencidos,
        COUNT(*) FILTER (WHERE l.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')     AS proximos_30,
        COUNT(*) FILTER (WHERE l.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days')     AS proximos_90,
        COUNT(*) FILTER (WHERE l.data_vencimento >= CURRENT_DATE)                                                AS vigentes,
        COUNT(*)                                                                                                 AS total
     FROM laudos l WHERE ${scope.sql}`,
    scope.params
  );
  res.json(row || {});
});

// GET /api/laudos/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const scope = scopeWhere(req);
  const row = await queryOne(
    `SELECT l.*, c.nome AS condominio_nome
     FROM laudos l LEFT JOIN condominios c ON c.id = l.condominio_id
     WHERE l.id = $${scope.params.length + 1} AND (${scope.sql})`,
    [...scope.params, req.params.id]
  );
  if (!row) { res.status(404).json({ error: 'Laudo não encontrado' }); return; }
  res.json(row);
});

// POST /api/laudos
router.post('/', requireMinRole('supervisor'), async (req: AuthRequest, res: Response) => {
  const b = req.body || {};
  if (!b.condominioId || !b.tipo || !b.dataVencimento) {
    res.status(400).json({ error: 'condominioId, tipo e dataVencimento são obrigatórios' });
    return;
  }
  const row = await queryOne(
    `INSERT INTO laudos
       (condominio_id, tipo, titulo, numero, emissor, responsavel_tecnico, crea_cau,
        data_emissao, data_vencimento, prazo_alerta_dias, arquivo_url, observacoes,
        status, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,30),$11,$12,
             CASE WHEN $9::date < CURRENT_DATE THEN 'vencido'
                  WHEN $9::date <= CURRENT_DATE + INTERVAL '30 days' THEN 'proximo_vencimento'
                  ELSE 'vigente' END,
             $13)
     RETURNING *`,
    [
      b.condominioId, b.tipo, b.titulo || null, b.numero || null, b.emissor || null,
      b.responsavelTecnico || null, b.creaCau || null,
      b.dataEmissao || null, b.dataVencimento, b.prazoAlertaDias,
      b.arquivoUrl || null, b.observacoes || null,
      req.user!.id,
    ]
  );
  res.status(201).json(row);
});

// PUT /api/laudos/:id
router.put('/:id', requireMinRole('supervisor'), async (req: AuthRequest, res: Response) => {
  const b = req.body || {};
  const row = await queryOne(
    `UPDATE laudos SET
        tipo = COALESCE($1, tipo),
        titulo = $2,
        numero = $3,
        emissor = $4,
        responsavel_tecnico = $5,
        crea_cau = $6,
        data_emissao = $7,
        data_vencimento = COALESCE($8, data_vencimento),
        prazo_alerta_dias = COALESCE($9, prazo_alerta_dias),
        arquivo_url = $10,
        observacoes = $11,
        status = COALESCE($12, status)
     WHERE id = $13
     RETURNING *`,
    [
      b.tipo, b.titulo || null, b.numero || null, b.emissor || null,
      b.responsavelTecnico || null, b.creaCau || null,
      b.dataEmissao || null, b.dataVencimento || null, b.prazoAlertaDias,
      b.arquivoUrl || null, b.observacoes || null, b.status,
      req.params.id,
    ]
  );
  if (!row) { res.status(404).json({ error: 'Laudo não encontrado' }); return; }
  res.json(row);
});

// POST /api/laudos/:id/renovar — cria um novo laudo encadeado ao anterior
router.post('/:id/renovar', requireMinRole('supervisor'), async (req: AuthRequest, res: Response) => {
  const b = req.body || {};
  if (!b.dataVencimento) { res.status(400).json({ error: 'dataVencimento é obrigatória' }); return; }

  const ant = await queryOne<any>(`SELECT * FROM laudos WHERE id = $1`, [req.params.id]);
  if (!ant) { res.status(404).json({ error: 'Laudo anterior não encontrado' }); return; }

  const novo = await queryOne(
    `INSERT INTO laudos
       (condominio_id, tipo, titulo, numero, emissor, responsavel_tecnico, crea_cau,
        data_emissao, data_vencimento, prazo_alerta_dias, arquivo_url, observacoes,
        status, laudo_anterior_id, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'vigente',$13,$14)
     RETURNING *`,
    [
      ant.condominio_id, ant.tipo, b.titulo || ant.titulo, b.numero || null,
      b.emissor || ant.emissor, b.responsavelTecnico || ant.responsavel_tecnico, b.creaCau || ant.crea_cau,
      b.dataEmissao || new Date(), b.dataVencimento, b.prazoAlertaDias || ant.prazo_alerta_dias,
      b.arquivoUrl || null, b.observacoes || null,
      ant.id, req.user!.id,
    ]
  );
  await query(`UPDATE laudos SET status = 'renovado' WHERE id = $1`, [ant.id]);
  res.status(201).json(novo);
});

// DELETE /api/laudos/:id
router.delete('/:id', requireMinRole('administrador'), async (req: AuthRequest, res: Response) => {
  await query(`DELETE FROM laudos WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

export default router;
