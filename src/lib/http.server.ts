import { z } from "zod";

type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Structured JSON logger. Never pass secrets or full card/PII data. */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const min = (process.env["LOG_LEVEL"] as Level) ?? "info";
  if (ORDER[level] < (ORDER[min] ?? 20)) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  (level === "error" ? console.error : console.log)(line);
}

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = parseCorsOrigins(process.env["CORS_ALLOWED_ORIGINS"]);
  if (!origin || !allowed.includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,Idempotency-Key",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(request),
      ...extra,
    },
  });
}

/** Validate a JSON body against a schema; throws a 400 AppError on failure. */
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError(400, "invalid_json", "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError(400, "validation_error", "Invalid request", result.error.flatten().fieldErrors);
  }
  return result.data;
}

/** Wrap a handler with request id, logging, CORS preflight and centralized error handling. */
export function handle(fn: (ctx: { request: Request; requestId: string }) => Promise<Response>) {
  return async ({ request }: { request: Request }) => {
    const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const started = Date.now();
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
      const res = await fn({ request, requestId });
      res.headers.set("X-Request-Id", requestId);
      log("info", "request", { requestId, method: request.method, path: url.pathname, status: res.status, ms: Date.now() - started });
      return res;
    } catch (err) {
      if (err instanceof AppError) {
        log("warn", "request_failed", { requestId, path: url.pathname, code: err.code, status: err.status });
        return json(request, { error: { code: err.code, message: err.message, details: err.details }, requestId }, err.status);
      }
      log("error", "unhandled_error", { requestId, path: url.pathname, error: err instanceof Error ? err.message : String(err) });
      return json(request, { error: { code: "internal_error", message: "Internal server error" }, requestId }, 500);
    }
  };
}
