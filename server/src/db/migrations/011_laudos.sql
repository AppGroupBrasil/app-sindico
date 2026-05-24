-- Migration 011: Laudos obrigatórios
-- AVCB, SPDA, Elevador, Potabilidade, PMOC, etc.

CREATE TABLE IF NOT EXISTS laudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,

  -- Tipo de laudo (chave do catálogo). Mantemos como VARCHAR pra permitir
  -- novos tipos sem alterar enum no banco.
  tipo VARCHAR(50) NOT NULL,
  -- Nome do laudo (ex: "AVCB Bloco A") quando precisa diferenciar
  titulo VARCHAR(255),

  numero VARCHAR(100),
  emissor VARCHAR(255),           -- órgão / empresa que emitiu
  responsavel_tecnico VARCHAR(255),
  crea_cau VARCHAR(50),

  data_emissao DATE,
  data_vencimento DATE NOT NULL,
  prazo_alerta_dias INT NOT NULL DEFAULT 30,  -- quantos dias antes de vencer começa o alerta

  arquivo_url TEXT,
  observacoes TEXT,

  -- Status calculado em runtime, mas armazenamos pra histórico e queries rápidas
  status VARCHAR(20) NOT NULL DEFAULT 'vigente'
    CHECK (status IN ('vigente','proximo_vencimento','vencido','renovado','cancelado')),

  -- Renovação encadeada
  laudo_anterior_id UUID REFERENCES laudos(id) ON DELETE SET NULL,

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_laudos_condominio ON laudos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_laudos_vencimento ON laudos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_laudos_status     ON laudos(status);
CREATE INDEX IF NOT EXISTS idx_laudos_tipo       ON laudos(tipo);

-- Trigger pra manter atualizado_em
CREATE OR REPLACE FUNCTION laudos_set_atualizado_em() RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_laudos_atualizado ON laudos;
CREATE TRIGGER trg_laudos_atualizado
  BEFORE UPDATE ON laudos
  FOR EACH ROW EXECUTE FUNCTION laudos_set_atualizado_em();

-- Registro de envio de alertas (não spammar e-mails)
CREATE TABLE IF NOT EXISTS laudos_alertas_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id UUID NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  dias_restantes INT NOT NULL,
  destinatarios TEXT[],
  enviado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laudos_alertas_laudo ON laudos_alertas_log(laudo_id);
