import { Router, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Garante 1 revista por condomínio (cria se não existir)
async function ensureRevista(condominioId: string, userId?: string) {
  let r = await queryOne<any>(
    `SELECT * FROM revistas WHERE condominio_id = $1 ORDER BY criado_em ASC LIMIT 1`,
    [condominioId]
  );
  if (!r) {
    r = await queryOne<any>(
      `INSERT INTO revistas (condominio_id, criado_por) VALUES ($1, $2) RETURNING *`,
      [condominioId, userId || null]
    );
  }
  return r;
}

// GET /api/revistas/:condominioId  → revista + páginas
router.get('/:condominioId', async (req: AuthRequest, res: Response) => {
  try {
    const r = await ensureRevista(req.params.condominioId, req.user?.id);
    const paginas = await query<any>(
      `SELECT * FROM revista_paginas WHERE revista_id = $1 ORDER BY ordem ASC, criado_em ASC`,
      [r.id]
    );
    res.json({ ...r, paginas });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/revistas/:id  → atualiza dados da capa
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, subtitulo, capa_url, cor_capa, efeitos, publicada } = req.body;
    const r = await queryOne<any>(
      `UPDATE revistas SET
        titulo = COALESCE($2, titulo),
        subtitulo = COALESCE($3, subtitulo),
        capa_url = COALESCE($4, capa_url),
        cor_capa = COALESCE($5, cor_capa),
        efeitos = COALESCE($6::jsonb, efeitos),
        publicada = COALESCE($7, publicada),
        atualizado_em = NOW()
      WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        titulo ?? null,
        subtitulo ?? null,
        capa_url ?? null,
        cor_capa ?? null,
        efeitos ? JSON.stringify(efeitos) : null,
        typeof publicada === 'boolean' ? publicada : null,
      ]
    );
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/revistas/:id/paginas  → cria nova página
router.post('/:id/paginas', async (req: AuthRequest, res: Response) => {
  try {
    const { categoria, titulo, texto, fotos } = req.body;
    if (!categoria) return res.status(400).json({ error: 'categoria é obrigatória' });
    const max = await queryOne<{ max: number }>(
      `SELECT COALESCE(MAX(ordem), 0) as max FROM revista_paginas WHERE revista_id = $1`,
      [req.params.id]
    );
    const p = await queryOne<any>(
      `INSERT INTO revista_paginas (revista_id, categoria, ordem, titulo, texto, fotos)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
      [
        req.params.id,
        categoria,
        (max?.max || 0) + 1,
        titulo || '',
        texto || '',
        JSON.stringify(fotos || []),
      ]
    );
    res.json(p);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/revistas/paginas/:paginaId  → atualiza página
router.put('/paginas/:paginaId', async (req: AuthRequest, res: Response) => {
  try {
    const { categoria, titulo, texto, fotos, ordem } = req.body;
    const p = await queryOne<any>(
      `UPDATE revista_paginas SET
        categoria = COALESCE($2, categoria),
        titulo = COALESCE($3, titulo),
        texto = COALESCE($4, texto),
        fotos = COALESCE($5::jsonb, fotos),
        ordem = COALESCE($6, ordem),
        atualizado_em = NOW()
      WHERE id = $1 RETURNING *`,
      [
        req.params.paginaId,
        categoria ?? null,
        titulo ?? null,
        texto ?? null,
        fotos ? JSON.stringify(fotos) : null,
        typeof ordem === 'number' ? ordem : null,
      ]
    );
    res.json(p);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/revistas/paginas/:paginaId
router.delete('/paginas/:paginaId', async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM revista_paginas WHERE id = $1`, [req.params.paginaId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
