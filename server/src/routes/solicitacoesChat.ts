import { Router, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/solicitacoes-chat/:reporteId/mensagens
router.get('/:reporteId/mensagens', async (req: AuthRequest, res: Response) => {
  try {
    const ms = await query<any>(
      `SELECT id, autor_tipo, autor_nome, texto, foto_url, criado_em
       FROM solicitacao_mensagens WHERE reporte_id = $1 ORDER BY criado_em ASC`,
      [req.params.reporteId]
    );
    res.json(ms);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/solicitacoes-chat/:reporteId/responder → síndico envia mensagem
router.post('/:reporteId/responder', async (req: AuthRequest, res: Response) => {
  try {
    const { texto, fotoUrl } = req.body || {};
    if (!texto) return res.status(400).json({ error: 'Texto obrigatório' });
    const r = await queryOne<any>(`SELECT id, token_publico FROM reportes WHERE id = $1`, [req.params.reporteId]);
    if (!r) return res.status(404).json({ error: 'Solicitação não encontrada' });
    const autor = req.user?.nome || 'Síndico';
    const m = await queryOne<any>(
      `INSERT INTO solicitacao_mensagens (reporte_id, autor_tipo, autor_nome, texto, foto_url)
       VALUES ($1,'sindico',$2,$3,$4) RETURNING *`,
      [r.id, autor, texto, fotoUrl || null]
    );
    res.json({ ...m, token_publico: r.token_publico });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
