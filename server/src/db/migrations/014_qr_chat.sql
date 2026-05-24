-- ╔══════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 014: Chat morador ↔ síndico nos blocos de QR Code ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS qr_chat_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloco_id TEXT NOT NULL,
  remetente TEXT NOT NULL CHECK (remetente IN ('morador','sindico')),
  remetente_nome TEXT NOT NULL,
  texto TEXT,
  imagem TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_chat_bloco ON qr_chat_mensagens (bloco_id, criado_em);
