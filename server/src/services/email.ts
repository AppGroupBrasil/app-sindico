import nodemailer from 'nodemailer';
import { query, queryOne } from '../db/database.js';
import { renderEmail } from './emailLayout.js';

// ════════════════════════════════════════════════════════════════
//  Email service multi-provider
//  Suporta: 'resend' (HTTPS API) e 'gmail' (SMTP)
//  Configuração lida do banco (tabela configuracoes_gerais) em
//  tempo real — não precisa reiniciar para trocar de provider.
// ════════════════════════════════════════════════════════════════

export type EmailProvider = 'resend' | 'gmail' | 'disabled';

interface EmailConfig {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  resendApiKey: string;
  gmailUser: string;
  gmailAppPassword: string;
}

interface EmailStats {
  date: string;       // YYYY-MM-DD
  sent: number;
  failed: number;
}

const KEYS = {
  PROVIDER: 'email_provider',
  FROM_NAME: 'email_from_name',
  FROM_ADDRESS: 'email_from_address',
  RESEND_KEY: 'email_resend_api_key',
  GMAIL_USER: 'email_gmail_user',
  GMAIL_PASS: 'email_gmail_app_password',
  STATS_RESEND: 'email_stats_resend',
  STATS_GMAIL: 'email_stats_gmail',
};

let configCache: EmailConfig | null = null;
let configCacheAt = 0;
const CACHE_TTL_MS = 30_000; // recarrega config a cada 30s

async function loadConfig(): Promise<EmailConfig> {
  if (configCache && Date.now() - configCacheAt < CACHE_TTL_MS) return configCache;

  const rows = await query<{ chave: string; valor: string }>(
    `SELECT chave, valor FROM configuracoes_gerais WHERE chave LIKE 'email_%'`
  );
  const map = new Map(rows.map(r => [r.chave, r.valor]));

  configCache = {
    provider: (map.get(KEYS.PROVIDER) as EmailProvider) || 'disabled',
    fromName: map.get(KEYS.FROM_NAME) || 'App Síndico',
    fromAddress: map.get(KEYS.FROM_ADDRESS) || 'noreply@appsindico.com.br',
    resendApiKey: map.get(KEYS.RESEND_KEY) || process.env.RESEND_API_KEY || '',
    gmailUser: map.get(KEYS.GMAIL_USER) || '',
    gmailAppPassword: map.get(KEYS.GMAIL_PASS) || '',
  };
  configCacheAt = Date.now();
  return configCache;
}

export function invalidateEmailConfigCache() { configCache = null; }

export async function getEmailConfig(): Promise<EmailConfig> { return loadConfig(); }

export async function saveEmailConfig(patch: Partial<EmailConfig>): Promise<void> {
  const entries: Array<[string, string | undefined]> = [
    [KEYS.PROVIDER, patch.provider],
    [KEYS.FROM_NAME, patch.fromName],
    [KEYS.FROM_ADDRESS, patch.fromAddress],
    [KEYS.RESEND_KEY, patch.resendApiKey],
    [KEYS.GMAIL_USER, patch.gmailUser],
    [KEYS.GMAIL_PASS, patch.gmailAppPassword],
  ];
  for (const [chave, valor] of entries) {
    if (valor === undefined) continue;
    await query(
      `INSERT INTO configuracoes_gerais (chave, valor) VALUES ($1, $2)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
      [chave, valor]
    );
  }
  invalidateEmailConfigCache();
}

// ── Estatísticas diárias por provider ──
async function getStats(provider: 'resend' | 'gmail'): Promise<EmailStats> {
  const key = provider === 'resend' ? KEYS.STATS_RESEND : KEYS.STATS_GMAIL;
  const row = await queryOne<{ valor: string }>(
    `SELECT valor FROM configuracoes_gerais WHERE chave = $1`, [key]
  );
  const today = new Date().toISOString().slice(0, 10);
  if (!row?.valor) return { date: today, sent: 0, failed: 0 };
  try {
    const parsed = JSON.parse(row.valor) as EmailStats;
    if (parsed.date !== today) return { date: today, sent: 0, failed: 0 };
    return parsed;
  } catch {
    return { date: today, sent: 0, failed: 0 };
  }
}

async function bumpStats(provider: 'resend' | 'gmail', ok: boolean): Promise<void> {
  const key = provider === 'resend' ? KEYS.STATS_RESEND : KEYS.STATS_GMAIL;
  const cur = await getStats(provider);
  const next: EmailStats = {
    date: cur.date,
    sent: cur.sent + (ok ? 1 : 0),
    failed: cur.failed + (ok ? 0 : 1),
  };
  await query(
    `INSERT INTO configuracoes_gerais (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [key, JSON.stringify(next)]
  );
}

export async function getEmailUsage() {
  const [resend, gmail] = await Promise.all([getStats('resend'), getStats('gmail')]);
  return {
    resend: { ...resend, limit: 100 },         // free tier
    gmail:  { ...gmail,  limit: 500 },         // Gmail SMTP daily soft limit
  };
}

// ── Envio via provider selecionado ──
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function sendResend(cfg: EmailConfig, opt: EmailOptions): Promise<boolean> {
  if (!cfg.resendApiKey) throw new Error('Resend API key não configurada');
  const to = Array.isArray(opt.to) ? opt.to : [opt.to];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${cfg.fromName} <${cfg.fromAddress}>`,
      to,
      subject: opt.subject,
      html: opt.html,
      text: opt.text,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return true;
}

let gmailTransporter: nodemailer.Transporter | null = null;
let gmailTransporterFor = '';

function getGmailTransporter(cfg: EmailConfig): nodemailer.Transporter {
  const fp = `${cfg.gmailUser}|${cfg.gmailAppPassword}`;
  if (gmailTransporter && gmailTransporterFor === fp) return gmailTransporter;
  gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: cfg.gmailUser, pass: cfg.gmailAppPassword },
  });
  gmailTransporterFor = fp;
  return gmailTransporter;
}

async function sendGmail(cfg: EmailConfig, opt: EmailOptions): Promise<boolean> {
  if (!cfg.gmailUser || !cfg.gmailAppPassword) throw new Error('Gmail não configurado (user/app password)');
  const t = getGmailTransporter(cfg);
  await t.sendMail({
    from: `${cfg.fromName} <${cfg.fromAddress}>`,
    to: Array.isArray(opt.to) ? opt.to.join(', ') : opt.to,
    subject: opt.subject,
    html: opt.html,
    text: opt.text,
  });
  return true;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const cfg = await loadConfig();
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  if (cfg.provider === 'disabled') {
    console.log(`[Email][DEV] Para: ${to} | Assunto: ${options.subject}`);
    return true;
  }

  try {
    if (cfg.provider === 'resend') {
      await sendResend(cfg, options);
      await bumpStats('resend', true);
      console.log(`[Email][resend] Enviado para ${to}: ${options.subject}`);
      return true;
    }
    if (cfg.provider === 'gmail') {
      await sendGmail(cfg, options);
      await bumpStats('gmail', true);
      console.log(`[Email][gmail] Enviado para ${to}: ${options.subject}`);
      return true;
    }
    return false;
  } catch (err: any) {
    if (cfg.provider === 'resend') await bumpStats('resend', false).catch(() => {});
    if (cfg.provider === 'gmail') await bumpStats('gmail', false).catch(() => {});
    console.error(`[Email][${cfg.provider}] Erro:`, err.message);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
//  Templates
// ════════════════════════════════════════════════════════════════

export async function emailResetSenha(nome: string, token: string, resetUrl: string): Promise<EmailOptions> {
  const link = `${resetUrl}?token=${token}`;
  const html = await renderEmail({
    preheader: 'Redefina sua senha do App Síndico (link válido por 1 hora).',
    cta: { label: 'Redefinir minha senha', url: link },
    contentHtml: `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Redefinição de senha</h2>
      <p style="margin:0 0 12px;">Olá <strong>${escape(nome)}</strong>,</p>
      <p style="margin:0 0 12px;">Recebemos uma solicitação para redefinir a sua senha de acesso ao <strong>App Síndico</strong>.</p>
      <p style="margin:0 0 12px;">Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Se você não solicitou essa redefinição, pode ignorar este e-mail — sua senha atual continua segura.</p>
    `,
  });
  return {
    to: '',
    subject: 'Redefinição de senha — App Síndico',
    html,
    text: `Olá ${nome}, acesse o link para redefinir sua senha: ${link} (expira em 1 hora)`,
  };
}

export async function emailVencimentoAlerta(
  docTitulo: string, diasRestantes: number, condominioNome: string, dataVencimento: string
): Promise<EmailOptions> {
  const cor = diasRestantes <= 3 ? '#dc2626' : diasRestantes <= 7 ? '#d97706' : '#2563eb';
  const html = await renderEmail({
    primaryColor: cor,
    preheader: `${docTitulo} vence em ${diasRestantes} dia(s) — ${condominioNome}.`,
    cta: { label: 'Ver no painel', url: 'https://appsindico.com.br/vencimentos' },
    contentHtml: `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Alerta de vencimento</h2>
      <p style="margin:0 0 14px;">O documento <strong>${escape(docTitulo)}</strong> do condomínio <strong>${escape(condominioNome)}</strong> está próximo do vencimento.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Dias restantes</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:700;color:${cor};">${diasRestantes} dia(s)</td></tr>
        <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Vence em</td>
            <td style="padding:12px 16px;font-weight:600;">${escape(dataVencimento)}</td></tr>
      </table>
      <p style="margin:0;">Providencie a renovação o mais breve possível para evitar interrupções.</p>
    `,
  });
  return {
    to: '',
    subject: `⚠️ Vencimento em ${diasRestantes} dia(s): ${docTitulo}`,
    html,
    text: `Alerta: ${docTitulo} (${condominioNome}) vence em ${diasRestantes} dias (${dataVencimento}).`,
  };
}

export async function emailOSCriada(
  protocolo: string, titulo: string, condominioNome: string, prioridade: string
): Promise<EmailOptions> {
  const corPrio: Record<string, string> = { urgente: '#dc2626', alta: '#ea580c', media: '#2563eb', baixa: '#16a34a' };
  const cor = corPrio[prioridade.toLowerCase()] || '#2563eb';
  const html = await renderEmail({
    preheader: `Nova OS ${protocolo}: ${titulo}`,
    cta: { label: 'Abrir ordem de serviço', url: 'https://appsindico.com.br/ordens-servico' },
    contentHtml: `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Nova ordem de serviço</h2>
      <p style="margin:0 0 14px;">Uma nova OS foi registrada no sistema:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 8px;border:1px solid #e5e7eb;border-radius:10px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:40%;">Protocolo</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:700;font-family:'Courier New',monospace;">${escape(protocolo)}</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Título</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escape(titulo)}</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Condomínio</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${escape(condominioNome)}</td></tr>
        <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Prioridade</td>
            <td style="padding:12px 16px;">
              <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${cor};color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">${escape(prioridade)}</span>
            </td></tr>
      </table>
    `,
  });
  return {
    to: '',
    subject: `Nova OS ${protocolo} — ${titulo}`,
    html,
    text: `Nova OS ${protocolo}: ${titulo} (${condominioNome}) - Prioridade: ${prioridade}`,
  };
}

function escape(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  }[c]!));
}
