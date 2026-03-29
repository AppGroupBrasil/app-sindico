import { Pool } from 'pg';

if (!process.env.DB_PASSWORD && process.env.NODE_ENV === 'production') {
  console.error('[DB] ❌ DB_PASSWORD não definido em produção! Encerrando.');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gestao',
  user: process.env.DB_USER || 'gestao',
  password: process.env.DB_PASSWORD || 'manutencao_secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Pool idle client error:', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const { rows } = await pool.query(text, params);
  return rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const { rows } = await pool.query(text, params);
  return (rows[0] as T) ?? null;
}

export async function execute(text: string, params?: any[]): Promise<number> {
  const { rowCount } = await pool.query(text, params);
  return rowCount ?? 0;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function paginate<T = any>(
  baseQuery: string,
  params: any[],
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResult<T>> {
  const p = Math.max(1, page);
  const ps = Math.min(100, Math.max(1, pageSize));
  const offset = (p - 1) * ps;

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) _cnt`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || '0');

  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await pool.query(dataQuery, [...params, ps, offset]);

  return {
    data: rows as T[],
    total,
    page: p,
    pageSize: ps,
    totalPages: Math.ceil(total / ps),
  };
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
