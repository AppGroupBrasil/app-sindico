import { Router, Response } from 'express';
import { query } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/calendario — eventos consolidados (OS, planos, vencimentos, escalas)
router.get('/', async (req: AuthRequest, res: Response) => {
  const ids: string[] = (req as any).condominioIds;
  if (ids.length === 0) { res.json({ os: [], planos: [], vencimentos: [], escalas: [] }); return; }

  const mes = req.query.mes as string; // formato YYYY-MM
  let inicioMes: string, fimMes: string;

  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    inicioMes = `${mes}-01`;
    const [y, m] = mes.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    fimMes = `${mes}-${String(lastDay).padStart(2, '0')}`;
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    inicioMes = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    fimMes = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  const [os, planos, vencimentos, escalas] = await Promise.all([
    query(
      `SELECT id, protocolo as titulo, status, prioridade, data_abertura as data, 'os' as tipo,
              condominio_id
       FROM ordens_servico
       WHERE condominio_id = ANY($1) AND data_abertura::date BETWEEN $2 AND $3
       ORDER BY data_abertura`,
      [ids, inicioMes, fimMes]
    ),
    query(
      `SELECT id, titulo, frequencia, proxima_execucao as data, status, 'plano' as tipo,
              condominio_id
       FROM planos_manutencao
       WHERE condominio_id = ANY($1) AND status = 'ativo'
         AND proxima_execucao IS NOT NULL AND proxima_execucao::date BETWEEN $2 AND $3
       ORDER BY proxima_execucao`,
      [ids, inicioMes, fimMes]
    ),
    query(
      `SELECT id, titulo, data_validade as data, tipo_documento as tipo_doc, status, 'vencimento' as tipo,
              condominio_id
       FROM vencimentos
       WHERE condominio_id = ANY($1) AND data_validade::date BETWEEN $2 AND $3
       ORDER BY data_validade`,
      [ids, inicioMes, fimMes]
    ).catch(() => []), // tabela pode não ter todos os campos
    query(
      `SELECT id, titulo, data_inicio as data, tipo, 'escala' as tipo_evento,
              condominio_id
       FROM escalas
       WHERE condominio_id = ANY($1) AND data_inicio::date BETWEEN $2 AND $3
       ORDER BY data_inicio`,
      [ids, inicioMes, fimMes]
    ).catch(() => []),
  ]);

  res.json({ os, planos, vencimentos, escalas });
});

export default router;
