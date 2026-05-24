import { Router, Response, Request } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/qr-chat/:blocoId — Lista mensagens de um bloco de chat
router.get('/:blocoId', async (req: Request, res: Response) => {
  const rows = await query(
    'SELECT * FROM qr_chat_mensagens WHERE bloco_id = $1 ORDER BY criado_em ASC',
    [req.params.blocoId]
  );
  res.json(rows);
});

// POST /api/qr-chat/:blocoId — Envia uma mensagem
router.post('/:blocoId', async (req: AuthRequest, res: Response) => {
  const { remetente, remetenteNome, texto, imagem } = req.body || {};
  const r = remetente === 'sindico' || remetente === 'morador' ? remetente : 'morador';
  const nome = (remetenteNome || req.user?.nome || (r === 'sindico' ? 'Síndico' : 'Morador')).toString().slice(0, 200);
  if (!texto && !imagem) {
    res.status(400).json({ error: 'Mensagem vazia' });
    return;
  }
  const row = await queryOne(
    `INSERT INTO qr_chat_mensagens (bloco_id, remetente, remetente_nome, texto, imagem)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.blocoId, r, nome, texto || null, imagem || null]
  );
  res.status(201).json(row);
});

export default router;
