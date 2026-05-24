// ════════════════════════════════════════════════════════════════
//  Layout base ("papel timbrado") para os e-mails do App Síndico
// ════════════════════════════════════════════════════════════════
//
//  Usa HTML inline (clientes de e-mail ignoram <style> em muitos
//  casos), fonte system, e <table> em alguns pontos pra garantir
//  renderização no Outlook/Apple Mail/Gmail.
// ────────────────────────────────────────────────────────────────

import { queryOne } from '../db/database.js';

export interface BaseEmailOptions {
  /** Conteúdo principal em HTML (já formatado). */
  contentHtml: string;
  /** Texto curto que aparece no preview do inbox (preheader). */
  preheader?: string;
  /** Botão CTA opcional. */
  cta?: { label: string; url: string };
  /** Cor primária — se omitir, usa a do tema_config (fallback #2563eb). */
  primaryColor?: string;
  /** URL da logo — se omitir, usa tema_config.logo_url ou logo padrão. */
  logoUrl?: string;
  /** Nome de exibição no header — padrão "App Síndico". */
  brandName?: string;
}

const DEFAULT_LOGO = 'https://appsindico.com.br/logo-app-sindico.png';
const DEFAULT_PRIMARY = '#2563eb';
const DEFAULT_DARK = '#1e3a8a';

interface TemaRow { cor_primaria: string | null; logo_url: string | null; }

let temaCache: { primary: string; logo: string } | null = null;
let temaCacheAt = 0;
async function loadTema() {
  if (temaCache && Date.now() - temaCacheAt < 60_000) return temaCache;
  const row = await queryOne<TemaRow>(`SELECT cor_primaria, logo_url FROM tema_config WHERE id='global'`).catch(() => null);
  temaCache = {
    primary: row?.cor_primaria || DEFAULT_PRIMARY,
    logo: row?.logo_url || DEFAULT_LOGO,
  };
  temaCacheAt = Date.now();
  return temaCache;
}

export async function renderEmail(opts: BaseEmailOptions): Promise<string> {
  const tema = await loadTema();
  const primary = opts.primaryColor || tema.primary;
  const logo = opts.logoUrl || tema.logo;
  const brand = opts.brandName || 'App Síndico';
  const preheader = opts.preheader || '';
  const year = new Date().getFullYear();

  // gradiente derivado da cor primária (versão mais escura à esquerda)
  const gradient = `linear-gradient(135deg, ${DEFAULT_DARK} 0%, ${primary} 100%)`;

  const ctaHtml = opts.cta ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto;">
      <tr><td style="border-radius: 10px; background: ${primary};">
        <a href="${escapeAttr(opts.cta.url)}"
           style="display:inline-block;padding:14px 30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${escapeHtml(opts.cta.label)}
        </a>
      </td></tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(brand)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <!-- preheader (oculto, aparece só no preview do inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr><td align="center">

      <!-- container -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">

        <!-- HEADER (papel timbrado: faixa gradiente + logo) -->
        <tr>
          <td style="background:${gradient};padding:28px 32px;text-align:left;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${escapeAttr(logo)}" alt="${escapeAttr(brand)}" width="48" height="48"
                       style="display:block;border-radius:10px;background:#ffffff;padding:6px;" />
                </td>
                <td style="vertical-align:middle;padding-left:14px;">
                  <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">
                    ${escapeHtml(brand)}
                  </div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px;">
                    Gestão condominial para síndicos e administradoras
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- faixa fina decorativa -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#fbbf24 0%,${primary} 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- CORPO -->
        <tr>
          <td style="padding:32px;font-size:15px;line-height:1.6;color:#1f2937;">
            ${opts.contentHtml}
            ${ctaHtml}
          </td>
        </tr>

        <!-- divisor + assinatura -->
        <tr>
          <td style="padding:0 32px;">
            <div style="border-top:1px solid #e5e7eb;margin:8px 0 20px;"></div>
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Atenciosamente,</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">Equipe ${escapeHtml(brand)}</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 32px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
              Você está recebendo este e-mail porque é usuário do ${escapeHtml(brand)}.
            </p>
            <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;">
              © ${year} ${escapeHtml(brand)} · <a href="https://appsindico.com.br" style="color:${primary};text-decoration:none;">appsindico.com.br</a>
            </p>
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Em caso de dúvida, responda este e-mail.
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
function escapeAttr(s: string): string { return escapeHtml(s); }
