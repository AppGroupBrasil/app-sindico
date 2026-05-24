import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool, { execute, query } from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      nome TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function aplicadas(): Promise<Set<string>> {
  const rows = await query<{ nome: string }>('SELECT nome FROM _migrations');
  return new Set(rows.map(r => r.nome));
}

async function aplicar(nome: string, sql: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO _migrations (nome) VALUES ($1)', [nome]);
    await client.query('COMMIT');
    console.log(`[migrate] ✓ ${nome}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[migrate] ✗ ${nome} — ${(err as Error).message}`);
    throw err;
  } finally {
    client.release();
  }
}

async function run() {
  console.log('[migrate] Iniciando…');
  await ensureTable();
  const ja = await aplicadas();
  const arquivos = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  const pendentes = arquivos.filter(f => !ja.has(f));

  if (pendentes.length === 0) {
    console.log('[migrate] Nenhuma migração pendente.');
    return;
  }

  console.log(`[migrate] ${pendentes.length} pendente(s):`);
  pendentes.forEach(f => console.log(`  - ${f}`));

  for (const arquivo of pendentes) {
    const sql = readFileSync(join(MIGRATIONS_DIR, arquivo), 'utf8');
    await aplicar(arquivo, sql);
  }

  console.log('[migrate] Concluído.');
}

run()
  .then(() => pool.end())
  .catch(err => {
    console.error('[migrate] Falhou:', err.message);
    pool.end().finally(() => process.exit(1));
  });
