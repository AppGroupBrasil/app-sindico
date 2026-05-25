import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/database.js';

const router = Router();

function gerarToken(n: number) {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

async function garantirSlugCondominio(condId: string): Promise<string> {
  const c = await queryOne<any>(`SELECT slug FROM condominios WHERE id = $1`, [condId]);
  if (c?.slug) return c.slug;
  for (let i = 0; i < 5; i++) {
    const slug = gerarToken(6);
    try {
      const u = await queryOne<any>(`UPDATE condominios SET slug = $2 WHERE id = $1 AND slug IS NULL RETURNING slug`, [condId, slug]);
      if (u?.slug) return u.slug;
    } catch {}
  }
  return '';
}

// GET /api/m/:slug → dados do condomínio para Central
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const c = await queryOne<any>(`SELECT id, nome, sindico FROM condominios WHERE slug = $1 AND ativo = true`, [req.params.slug]);
    if (!c) return res.status(404).json({ error: 'Condomínio não encontrado' });
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/m/:slug/solicitacao → cria solicitação pública
router.post('/:slug/solicitacao', async (req: Request, res: Response) => {
  try {
    const c = await queryOne<any>(`SELECT id FROM condominios WHERE slug = $1 AND ativo = true`, [req.params.slug]);
    if (!c) return res.status(404).json({ error: 'Condomínio não encontrado' });

    const { categoria, descricao, fotoUrl, nome, bloco, apto, whatsapp, email, canal } = req.body || {};
    if (!descricao || !whatsapp) return res.status(400).json({ error: 'WhatsApp e descrição são obrigatórios' });

    const protocolo = gerarToken(6);
    const token = gerarToken(12);

    const r = await queryOne<any>(
      `INSERT INTO reportes
        (protocolo, descricao, status, prioridade, condominio_id, imagens,
         categoria, nome_morador, bloco_morador, apto_morador, whatsapp_morador, email_morador, canal_resposta, token_publico)
       VALUES ($1,$2,'aberto','media',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        protocolo, descricao, c.id,
        fotoUrl ? [fotoUrl] : [],
        categoria || 'outros',
        nome || null, bloco || null, apto || null,
        whatsapp, email || null,
        canal || 'ambos',
        token,
      ]
    );

    res.json({ protocolo: r.protocolo, token: r.token_publico, id: r.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/m/protocolo/:token → consulta solicitação (sem auth)
router.get('/protocolo/:token', async (req: Request, res: Response) => {
  try {
    const r = await queryOne<any>(
      `SELECT id, protocolo, descricao, status, categoria, nome_morador, bloco_morador, apto_morador,
              whatsapp_morador, email_morador, canal_resposta, imagens, data
       FROM reportes WHERE token_publico = $1`,
      [req.params.token]
    );
    if (!r) return res.status(404).json({ error: 'Solicitação não encontrada' });
    const mensagens = await query<any>(
      `SELECT id, autor_tipo, autor_nome, texto, foto_url, criado_em
       FROM solicitacao_mensagens WHERE reporte_id = $1 ORDER BY criado_em ASC`,
      [r.id]
    );
    res.json({ ...r, mensagens });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/m/protocolo/:token/mensagem → morador envia resposta
router.post('/protocolo/:token/mensagem', async (req: Request, res: Response) => {
  try {
    const { texto, fotoUrl, nome } = req.body || {};
    if (!texto) return res.status(400).json({ error: 'Texto obrigatório' });
    const r = await queryOne<any>(`SELECT id, status FROM reportes WHERE token_publico = $1`, [req.params.token]);
    if (!r) return res.status(404).json({ error: 'Solicitação não encontrada' });
    // reabre se estava finalizado
    if (r.status === 'resolvido') {
      await query(`UPDATE reportes SET status = 'aberto' WHERE id = $1`, [r.id]);
    }
    const m = await queryOne<any>(
      `INSERT INTO solicitacao_mensagens (reporte_id, autor_tipo, autor_nome, texto, foto_url)
       VALUES ($1,'morador',$2,$3,$4) RETURNING *`,
      [r.id, nome || 'Morador', texto, fotoUrl || null]
    );
    res.json(m);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/m/protocolo/:token/encerrar → morador encerra
router.post('/protocolo/:token/encerrar', async (req: Request, res: Response) => {
  try {
    const r = await queryOne<any>(`UPDATE reportes SET status = 'resolvido' WHERE token_publico = $1 RETURNING id`, [req.params.token]);
    if (!r) return res.status(404).json({ error: 'Solicitação não encontrada' });
    await query(
      `INSERT INTO solicitacao_mensagens (reporte_id, autor_tipo, autor_nome, texto) VALUES ($1,'morador','Morador','✓ Solicitação encerrada pelo morador.')`,
      [r.id]
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
export { garantirSlugCondominio };
