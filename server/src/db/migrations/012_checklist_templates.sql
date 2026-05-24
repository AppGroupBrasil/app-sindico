-- Migration 012: Modelos reutilizáveis de checklist

CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  local VARCHAR(255),
  tipo VARCHAR(50) DEFAULT 'diaria',
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  vezes_usado INT NOT NULL DEFAULT 0,
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chk_tpl_condominio ON checklist_templates(condominio_id);
CREATE INDEX IF NOT EXISTS idx_chk_tpl_criado_por ON checklist_templates(criado_por);

CREATE OR REPLACE FUNCTION chk_tpl_atualizado() RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chk_tpl_atualizado ON checklist_templates;
CREATE TRIGGER trg_chk_tpl_atualizado
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION chk_tpl_atualizado();
