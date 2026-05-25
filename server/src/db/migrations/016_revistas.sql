-- Migration 016: Revistas do Síndico (wizard simplificado)

CREATE TABLE IF NOT EXISTS revistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL DEFAULT 'Revista do Condomínio',
  subtitulo VARCHAR(255),
  capa_url TEXT,
  cor_capa VARCHAR(20) DEFAULT '#1E88E5',
  efeitos JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de strings com efeitos ativos
  publicada BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_revistas_condo ON revistas(condominio_id);

CREATE TABLE IF NOT EXISTS revista_paginas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revista_id UUID NOT NULL REFERENCES revistas(id) ON DELETE CASCADE,
  categoria VARCHAR(80) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  titulo VARCHAR(255),
  texto TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revista_paginas_revista ON revista_paginas(revista_id, ordem);
