// Versioned, forward-only migration runner. Usage: DATABASE_URL=... bun scripts/migrate.ts [--dry-run]
// Refuses destructive statements unless ALLOW_DESTRUCTIVE=1 (never set in this project's phase).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { checksum, isDestructive, isValidMigrationName } from "./migrate-lib";

const dryRun = process.argv.includes("--dry-run");
const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const dir = join(import.meta.dir, "..", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = postgres(url, { max: 1 });

try {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  const applied = new Map((await sql<{ name: string; checksum: string }[]>`SELECT name, checksum FROM schema_migrations`).map((r) => [r.name, r.checksum]));

  for (const file of files) {
    if (!isValidMigrationName(file)) throw new Error(`Bad migration filename: ${file}`);
    const body = readFileSync(join(dir, file), "utf8");
    const sum = await checksum(body);
    if (applied.has(file)) {
      if (applied.get(file) !== sum) throw new Error(`Checksum mismatch for applied migration ${file} — never edit applied migrations`);
      continue;
    }
    if (isDestructive(body) && process.env["ALLOW_DESTRUCTIVE"] !== "1") throw new Error(`Destructive statement in ${file} — blocked`);
    console.log(`${dryRun ? "[dry-run] would apply" : "applying"} ${file}`);
    if (dryRun) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name, checksum) VALUES (${file}, ${sum})`;
    });
  }
  console.log("migrations up to date");
} finally {
  await sql.end();
}
