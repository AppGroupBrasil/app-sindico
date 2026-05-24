import { Router, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

function scope(req: AuthRequest) {
  const ids: string[] = (req as any).condominioIds || [];
  return ids;
}

// GET /api/checklist-templates — lista modelos visíveis ao usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  const isMaster = req.user!.role === 'master';
  const ids = scope(req);
  if (!isMaster && ids.length === 0) { res.json([]); return; }
  const rows = await query(
    isMaster
      ? `SELECT t.*, c.nome AS condominio_nome, u.nome AS criado_por_nome
           FROM checklist_templates t
           LEFT JOIN condominios c ON c.id = t.condominio_id
           LEFT JOIN usuarios u ON u.id = t.criado_por
           ORDER BY t.criado_em DESC`
      : `SELECT t.*, c.nome AS condominio_nome, u.nome AS criado_por_nome
           FROM checklist_templates t
           LEFT JOIN condominios c ON c.id = t.condominio_id
           LEFT JOIN usuarios u ON u.id = t.criado_por
           WHERE t.condominio_id = ANY($1) OR t.condominio_id IS NULL
           ORDER BY t.criado_em DESC`,
    isMaster ? [] : [ids]
  );
  res.json(rows);
});

// POST /api/checklist-templates
router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, condominioId, local, tipo, itens } = req.body || {};
  if (!nome || !nome.trim()) { res.status(400).json({ error: 'Nome do modelo é obrigatório' }); return; }
  const row = await queryOne(
    `INSERT INTO checklist_templates (nome, condominio_id, local, tipo, itens, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nome.trim(), condominioId || null, local || null, tipo || 'diaria', JSON.stringify(itens || []), req.user!.id]
  );
  res.status(201).json(row);
});

// PUT /api/checklist-templates/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, condominioId, local, tipo, itens } = req.body || {};
  const row = await queryOne(
    `UPDATE checklist_templates SET
        nome = COALESCE($1, nome),
        condominio_id = $2,
        local = $3,
        tipo = COALESCE($4, tipo),
        itens = COALESCE($5, itens)
     WHERE id = $6 RETURNING *`,
    [nome, condominioId || null, local || null, tipo, itens ? JSON.stringify(itens) : null, req.params.id]
  );
  if (!row) { res.status(404).json({ error: 'Modelo não encontrado' }); return; }
  res.json(row);
});

// DELETE /api/checklist-templates/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await query(`DELETE FROM checklist_templates WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// POST /api/checklist-templates/:id/usar — cria uma execução nova a partir do modelo
router.post('/:id/usar', async (req: AuthRequest, res: Response) => {
  const { condominioId, local, data } = req.body || {};
  const ids = scope(req);
  const isMaster = req.user!.role === 'master';

  const tpl = await queryOne<any>(`SELECT * FROM checklist_templates WHERE id = $1`, [req.params.id]);
  if (!tpl) { res.status(404).json({ error: 'Modelo não encontrado' }); return; }

  const condFinal = condominioId || tpl.condominio_id;
  if (!condFinal) { res.status(400).json({ error: 'Informe o condomínio para esta execução.' }); return; }
  if (!isMaster && !ids.includes(condFinal)) {
    res.status(403).json({ error: 'Sem acesso a este condomínio' }); return;
  }

  const itens = Array.isArray(tpl.itens) ? tpl.itens : [];
  const itensZerados = itens.map((it: any, idx: number) => ({
    id: String(idx + 1),
    descricao: it.descricao || it.text || '',
    concluido: false,
  }));

  const execucao = await queryOne(
    `INSERT INTO checklists (condominio_id, local, tipo, itens, responsavel_id, data, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      condFinal,
      local || tpl.local || '',
      tpl.tipo || 'diaria',
      JSON.stringify(itensZerados),
      req.user!.id,
      data || new Date().toISOString().slice(0, 10),
      req.user!.id,
    ]
  );

  await query(`UPDATE checklist_templates SET vezes_usado = vezes_usado + 1 WHERE id = $1`, [req.params.id]);

  res.status(201).json(execucao);
});

export default router;
