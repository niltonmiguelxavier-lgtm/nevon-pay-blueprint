import postgres from "postgres";

/**
 * Per-request Postgres client (Workers cannot share sockets across requests).
 * Connection string priority: Hyperdrive binding (self-managed Wrangler deploy) -> DATABASE_URL.
 */
export function getConnectionString(hyperdrive?: { connectionString: string }): string | null {
  return hyperdrive?.connectionString ?? process.env["DATABASE_URL"] ?? null;
}

export async function withDb<T>(fn: (sql: postgres.Sql) => Promise<T>, hyperdrive?: { connectionString: string }): Promise<T> {
  const url = getConnectionString(hyperdrive);
  if (!url) throw new Error("DATABASE_URL not configured");
  const sql = postgres(url, { max: 1, prepare: false, fetch_types: false, connect_timeout: 5, idle_timeout: 5 });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 2 }).catch(() => {});
  }
}
