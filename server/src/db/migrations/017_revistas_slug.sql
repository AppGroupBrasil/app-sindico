-- Migration 017: slug público para revistas (compartilhamento)
ALTER TABLE revistas ADD COLUMN IF NOT EXISTS slug VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_revistas_slug ON revistas(slug);
