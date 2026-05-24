-- Migration 013: Permitir nomes personalizados para blocos do condomínio

ALTER TABLE condominios ADD COLUMN IF NOT EXISTS blocos_nomes TEXT[] DEFAULT '{}';
