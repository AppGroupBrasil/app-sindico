import { Router, Response } from 'express';
import { queryOne } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { getEmailConfig, saveEmailConfig, getEmailUsage, sendEmail } from '../services/email.js';
import { renderEmail } from '../services/emailLayout.js';

const router = Router();

// ── Tema ──

// GET /api/configuracoes/tema
router.get('/tema', async (_req: AuthRequest, res: Response) => {
  const row = await queryOne('SELECT * FROM tema_config WHERE id = $1', ['global']);
  res.json(row || {});
});

// PUT /api/configuracoes/tema
router.put('/tema', requireMinRole('administrador'), async (req: AuthRequest, res: Response) => {
  const { corPrimaria, corSecundaria, corMenu, corBotao, corFundo, modoEscuro, logoUrl, loginTitulo, loginSubtitulo } = req.body;
  const row = await queryOne(
    `INSERT INTO tema_config (id, cor_primaria, cor_secundaria, cor_menu, cor_botao, cor_fundo, modo_escuro, logo_url, login_titulo, login_subtitulo)
     VALUES ('global', $1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET cor_primaria=$1, cor_secundaria=$2, cor_menu=$3, cor_botao=$4, cor_fundo=$5, modo_escuro=$6, logo_url=$7, login_titulo=$8, login_subtitulo=$9
     RETURNING *`,
    [corPrimaria, corSecundaria, corMenu, corBotao, corFundo, modoEscuro || false, logoUrl, loginTitulo, loginSubtitulo]
  );
  res.json(row);
});

// ── Permissões do Quadro ──

// GET /api/configuracoes/quadro-permissoes
router.get('/quadro-permissoes', async (_req: AuthRequest, res: Response) => {
  const row = await queryOne('SELECT * FROM quadro_permissoes WHERE id = $1', ['global']);
  res.json(row || {});
});

// PUT /api/configuracoes/quadro-permissoes
router.put('/quadro-permissoes', requireMinRole('administrador'), async (req: AuthRequest, res: Response) => {
  const { cadastrar, editar, excluir } = req.body;
  const row = await queryOne(
    `INSERT INTO quadro_permissoes (id, cadastrar, editar, excluir)
     VALUES ('global', $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET cadastrar=$1, editar=$2, excluir=$3
     RETURNING *`,
    [JSON.stringify(cadastrar), JSON.stringify(editar), JSON.stringify(excluir)]
  );
  res.json(row);
});

// ── Configuração de E-mail (Resend / Gmail) ──
// Apenas master pode mexer nesses dados (chaves de API sensíveis).

function maskSecret(s: string): string {
  if (!s) return '';
  if (s.length <= 8) return '••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

// GET /api/configuracoes/email
router.get('/email', requireMinRole('master'), async (_req: AuthRequest, res: Response) => {
  const cfg = await getEmailConfig();
  const usage = await getEmailUsage();
  res.json({
    provider: cfg.provider,
    fromName: cfg.fromName,
    fromAddress: cfg.fromAddress,
    resendApiKeyMask: maskSecret(cfg.resendApiKey),
    resendConfigured: !!cfg.resendApiKey,
    gmailUser: cfg.gmailUser,
    gmailConfigured: !!cfg.gmailUser && !!cfg.gmailAppPassword,
    usage,
  });
});

// PUT /api/configuracoes/email
router.put('/email', requireMinRole('master'), async (req: AuthRequest, res: Response) => {
  const { provider, fromName, fromAddress, resendApiKey, gmailUser, gmailAppPassword } = req.body || {};
  if (provider && !['resend', 'gmail', 'disabled'].includes(provider)) {
    res.status(400).json({ error: 'provider inválido' });
    return;
  }
  await saveEmailConfig({
    provider,
    fromName,
    fromAddress,
    // só sobrescreve segredos se vier valor não vazio (evita apagar ao editar)
    resendApiKey: resendApiKey || undefined,
    gmailUser,
    gmailAppPassword: gmailAppPassword || undefined,
  });
  res.json({ ok: true });
});

// POST /api/configuracoes/email/teste
router.post('/email/teste', requireMinRole('master'), async (req: AuthRequest, res: Response) => {
  const destino = req.body?.to || req.user!.email;
  const agora = new Date().toLocaleString('pt-BR');
  const html = await renderEmail({
    preheader: 'Confirmação de que o envio de e-mails está funcionando.',
    contentHtml: `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Tudo certo! ✅</h2>
      <p style="margin:0 0 12px;">Este é um e-mail de teste enviado pelo painel de configurações do <strong>App Síndico</strong>.</p>
      <p style="margin:0 0 12px;">Se você está lendo isto, significa que o provedor está configurado corretamente e os e-mails do sistema (resets de senha, alertas de vencimento, ordens de serviço, etc.) chegarão normalmente.</p>
      <p style="margin:0;font-size:13px;color:#6b7280;">Enviado em: ${agora}</p>
    `,
  });
  const ok = await sendEmail({
    to: destino,
    subject: 'Teste de envio — App Síndico',
    html,
    text: `Teste de envio às ${agora}.`,
  });
  if (ok) res.json({ ok: true, to: destino });
  else res.status(500).json({ ok: false, error: 'Falha ao enviar — confira a configuração no log do servidor' });
});

export default router;
