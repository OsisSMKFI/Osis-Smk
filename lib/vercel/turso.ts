/**
 * Turso Database (SQLite) Integration
 * Embedded replicas with ultra-low latency reads
 * 
 * Use for:
 * - Edge-compatible database operations
 * - Fast reads with embedded replicas
 * - SQLite-compatible queries
 * - Analytics and caching
 * 
 * @see https://docs.turso.tech
 */

import { createClient, type Client, type ResultSet, type InStatement, type InValue, type InArgs } from '@libsql/client';

// ==========================================
// Client Initialization
// ==========================================

let _client: Client | null = null;

/**
 * Get or create Turso database client
 */
export function getTursoClient(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }

  _client = createClient({
    url,
    authToken,
  });

  return _client;
}

// Export client for direct usage
export const turso = {
  get client() {
    return getTursoClient();
  },
};

// Type alias for query arguments
type QueryArgs = InArgs;

// ==========================================
// Query Helpers
// ==========================================

/**
 * Execute a single SQL query
 */
export async function execute(sql: string, args?: QueryArgs): Promise<ResultSet> {
  const client = getTursoClient();
  return client.execute({ sql, args });
}

/**
 * Execute multiple SQL queries in a batch
 */
export async function batch(statements: InStatement[]): Promise<ResultSet[]> {
  const client = getTursoClient();
  return client.batch(statements);
}

/**
 * Execute queries in a transaction
 */
export async function transaction<T>(
  callback: (tx: {
    execute: (sql: string, args?: QueryArgs) => Promise<ResultSet>;
  }) => Promise<T>
): Promise<T> {
  const client = getTursoClient();
  const tx = await client.transaction('write');
  
  try {
    const result = await callback({
      execute: (sql: string, args?: QueryArgs) => tx.execute({ sql, args }),
    });
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

// ==========================================
// CRUD Helpers
// ==========================================

/**
 * Select rows from a table
 */
export async function select<T = Record<string, unknown>>(
  table: string,
  options?: {
    columns?: string[];
    where?: string;
    args?: QueryArgs;
    orderBy?: string;
    limit?: number;
    offset?: number;
  }
): Promise<T[]> {
  const cols = options?.columns?.join(', ') || '*';
  let sql = `SELECT ${cols} FROM ${table}`;
  
  if (options?.where) {
    sql += ` WHERE ${options.where}`;
  }
  if (options?.orderBy) {
    sql += ` ORDER BY ${options.orderBy}`;
  }
  if (options?.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  if (options?.offset) {
    sql += ` OFFSET ${options.offset}`;
  }

  const result = await execute(sql, options?.args);
  return result.rows as unknown as T[];
}

/**
 * Select a single row
 */
export async function selectOne<T = Record<string, unknown>>(
  table: string,
  options?: {
    columns?: string[];
    where?: string;
    args?: QueryArgs;
  }
): Promise<T | null> {
  const rows = await select<T>(table, { ...options, limit: 1 });
  return rows[0] || null;
}

/**
 * Insert a row into a table
 */
export async function insert(
  table: string,
  data: Record<string, InValue>
): Promise<ResultSet> {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values: InValue[] = Object.values(data);

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  return execute(sql, values);
}

/**
 * Insert multiple rows
 */
export async function insertMany(
  table: string,
  rows: Record<string, InValue>[]
): Promise<ResultSet[]> {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');

  const statements: InStatement[] = rows.map(row => ({
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    args: Object.values(row) as InValue[],
  }));

  return batch(statements);
}

/**
 * Update rows in a table
 */
export async function update(
  table: string,
  data: Record<string, InValue>,
  where: string,
  whereArgs?: InValue[]
): Promise<ResultSet> {
  const columns = Object.keys(data);
  const setClause = columns.map(col => `${col} = ?`).join(', ');
  const values: InValue[] = [...Object.values(data), ...(whereArgs || [])];

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  return execute(sql, values);
}

/**
 * Delete rows from a table
 */
export async function remove(
  table: string,
  where: string,
  args?: QueryArgs
): Promise<ResultSet> {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  return execute(sql, args);
}

/**
 * Count rows in a table
 */
export async function count(
  table: string,
  where?: string,
  args?: QueryArgs
): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  if (where) {
    sql += ` WHERE ${where}`;
  }

  const result = await execute(sql, args);
  return Number(result.rows[0]?.count) || 0;
}

/**
 * Check if a row exists
 */
export async function exists(
  table: string,
  where: string,
  args?: QueryArgs
): Promise<boolean> {
  const c = await count(table, where, args);
  return c > 0;
}

// ==========================================
// Schema Helpers
// ==========================================

/**
 * Create a table if it doesn't exist
 */
export async function createTable(
  tableName: string,
  schema: string
): Promise<ResultSet> {
  const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
  return execute(sql);
}

/**
 * Drop a table
 */
export async function dropTable(tableName: string): Promise<ResultSet> {
  return execute(`DROP TABLE IF EXISTS ${tableName}`);
}

/**
 * Get table info
 */
export async function tableInfo(tableName: string): Promise<ResultSet> {
  return execute(`PRAGMA table_info(${tableName})`);
}

/**
 * List all tables
 */
export async function listTables(): Promise<string[]> {
  const result = await execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return result.rows.map(row => row.name as string);
}

// ==========================================
// Migration Helpers
// ==========================================

/**
 * Run a migration
 */
export async function migrate(migrations: { name: string; sql: string }[]): Promise<void> {
  // Create migrations table if not exists
  await execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const migration of migrations) {
    const existing = await selectOne('_migrations', {
      where: 'name = ?',
      args: [migration.name],
    });

    if (!existing) {
      console.log(`[Turso] Running migration: ${migration.name}`);
      await execute(migration.sql);
      await insert('_migrations', { name: migration.name });
    }
  }
}

// ==========================================
// Example Tables (Quick Setup)
// ==========================================

/**
 * Initialize example tables for the project
 */
export async function initExampleTables(): Promise<void> {
  await migrate([
    {
      name: '001_create_cache_table',
      sql: `
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT,
          expires_at INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: '002_create_analytics_table',
      sql: `
        CREATE TABLE IF NOT EXISTS analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event TEXT NOT NULL,
          page TEXT,
          user_id TEXT,
          data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: '003_create_sessions_table',
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data TEXT,
          expires_at INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
  ]);
}

// ==========================================
// Cache Helpers (using Turso)
// ==========================================

/**
 * Set a cache value
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  const valueStr = JSON.stringify(value);

  await execute(
    `INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)`,
    [key, valueStr, expiresAt]
  );
}

/**
 * Get a cache value
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  const row = await selectOne<{ value: string; expires_at: number | null }>('cache', {
    where: 'key = ?',
    args: [key],
  });

  if (!row) return null;
  if (row.expires_at && row.expires_at < Date.now()) {
    await remove('cache', 'key = ?', [key]);
    return null;
  }

  return JSON.parse(row.value) as T;
}

/**
 * Delete a cache value
 */
export async function deleteCache(key: string): Promise<void> {
  await remove('cache', 'key = ?', [key]);
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const result = await execute(
    'DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?',
    [Date.now()]
  );
  return result.rowsAffected;
}
