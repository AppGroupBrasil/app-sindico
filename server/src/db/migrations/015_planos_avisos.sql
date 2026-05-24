-- ╔══════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 015: Avisos por e-mail nos planos de manutenção   ║
-- ╚══════════════════════════════════════════════════════════════╝

ALTER TABLE planos_manutencao
  ADD COLUMN IF NOT EXISTS email_aviso_1   TEXT,
  ADD COLUMN IF NOT EXISTS email_aviso_2   TEXT,
  ADD COLUMN IF NOT EXISTS dias_aviso      INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS aviso_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vencimento_1    DATE,
  ADD COLUMN IF NOT EXISTS vencimento_2    DATE,
  ADD COLUMN IF NOT EXISTS vencimento_3    DATE,
  ADD COLUMN IF NOT EXISTS imagem          TEXT;

CREATE INDEX IF NOT EXISTS idx_planos_proxima_aviso
  ON planos_manutencao (proxima_execucao)
  WHERE (email_aviso_1 IS NOT NULL OR email_aviso_2 IS NOT NULL);
