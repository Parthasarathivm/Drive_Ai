import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    max: 10,
  });

pool.on("error", (err) => {
  // Prevent unhandled error events from crashing the Node process
  console.warn("[Database Pool Warning]:", err.message);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

/**
 * Diagnostic utility to verify if PostgreSQL is actively reachable
 */
export async function checkDbConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { connected: true };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: msg };
  }
}
