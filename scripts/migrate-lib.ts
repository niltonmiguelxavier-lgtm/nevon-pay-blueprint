// Pure helpers for the migration runner (unit-tested).
const DESTRUCTIVE = /\b(DROP\s+(TABLE|SCHEMA|DATABASE|COLUMN)|TRUNCATE|DELETE\s+FROM)\b/i;

export function stripComments(sql: string): string {
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

export function isDestructive(sql: string): boolean {
  return DESTRUCTIVE.test(stripComments(sql));
}

export function isValidMigrationName(name: string): boolean {
  return /^\d{4}_[a-z0-9_]+\.sql$/.test(name);
}

export async function checksum(sql: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sql));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
