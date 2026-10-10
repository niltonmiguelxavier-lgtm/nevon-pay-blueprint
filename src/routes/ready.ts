import { createFileRoute } from "@tanstack/react-router";
import { handle, json } from "@/lib/http.server";
import { readEnv, secretStatus } from "@/lib/env.server";
import { withDb } from "@/lib/db.server";

// Readiness: config valid + database reachable + migrations applied.
export const Route = createFileRoute("/ready")({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        const checks: Record<string, string> = {};
        try {
          readEnv();
          checks.config = "ok";
        } catch {
          checks.config = "invalid";
        }
        const secrets = secretStatus();
        checks.secrets = secrets.DATABASE_URL ? "ok" : "missing:DATABASE_URL";
        if (secrets.DATABASE_URL) {
          try {
            const rows = await withDb((sql) => sql<{ n: number }[]>`select count(*)::int as n from schema_migrations`);
            checks.database = "ok";
            checks.migrations = `${rows[0]?.n ?? 0} applied`;
          } catch (e) {
            checks.database = e instanceof Error && /schema_migrations/.test(e.message) ? "ok" : "unreachable";
            if (checks.database === "ok") checks.migrations = "not_applied";
          }
        } else checks.database = "skipped";
        const ready = Object.values(checks).every((v) => v === "ok" || v.endsWith("applied")) && !checks.migrations?.startsWith("not");
        return json(request, { status: ready ? "ready" : "not_ready", checks }, ready ? 200 : 503);
      }),
    },
  },
});
