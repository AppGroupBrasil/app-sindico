-- Migration 018: Central do Morador (solicitações públicas + chat)

-- Slug público em condominios
ALTER TABLE condominios ADD COLUMN IF NOT EXISTS slug VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_condominios_slug ON condominios(slug);

-- Colunas para identificar a origem morador
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS categoria VARCHAR(40);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS nome_morador VARCHAR(255);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS bloco_morador VARCHAR(40);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS apto_morador VARCHAR(40);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS whatsapp_morador VARCHAR(40);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS email_morador VARCHAR(255);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS canal_resposta VARCHAR(20) DEFAULT 'ambos'; -- whatsapp | email | ambos
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS token_publico VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_reportes_token ON reportes(token_publico);

-- Chat (mensagens)
CREATE TABLE IF NOT EXISTS solicitacao_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  autor_tipo VARCHAR(10) NOT NULL CHECK (autor_tipo IN ('morador','sindico')),
  autor_nome VARCHAR(255),
  texto TEXT NOT NULL,
  foto_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitacao_msg_reporte ON solicitacao_mensagens(reporte_id, criado_em);
