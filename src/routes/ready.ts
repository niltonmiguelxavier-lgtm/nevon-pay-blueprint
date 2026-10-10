import { createFileRoute } from "@tanstack/react-router";
import { handle, json } from "@/lib/http.server";
import { readEnv, secretStatus } from "@/lib/env.server";
import { withDb } from "@/lib/db.server";

type Checks = { config: string; secrets: string; database: string; migrations: string };

// Readiness: config valid + secrets present + database reachable + migrations applied.
export const Route = createFileRoute("/ready")({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        const checks: Checks = { config: "ok", secrets: "ok", database: "skipped", migrations: "unknown" };
        try {
          readEnv();
        } catch {
          checks.config = "invalid";
        }
        if (!secretStatus().DATABASE_URL) checks.secrets = "missing:DATABASE_URL";
        else {
          try {
            const rows = await withDb((sql) => sql<{ n: number }[]>`select count(*)::int as n from schema_migrations`);
            checks.database = "ok";
            checks.migrations = (rows[0]?.n ?? 0) > 0 ? "ok" : "not_applied";
          } catch (e) {
            const missingTable = e instanceof Error && /schema_migrations/.test(e.message);
            checks.database = missingTable ? "ok" : "unreachable";
            checks.migrations = missingTable ? "not_applied" : "unknown";
          }
        }
        const ready = Object.values(checks).every((v) => v === "ok");
        return json(request, { status: ready ? "ready" : "not_ready", checks }, ready ? 200 : 503);
      }),
    },
  },
});
