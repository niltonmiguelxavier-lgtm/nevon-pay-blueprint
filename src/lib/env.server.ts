import { z } from "zod";

/**
 * Server-only environment. Read inside handlers only (Workers inject env per request).
 * DATABASE_URL is never exposed to the browser (no VITE_ prefix).
 */
const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PAYMENTS_MODE: z.literal("sandbox").default("sandbox"),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

export function readEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server configuration: ${fields}`);
  }
  return parsed.data;
}

/** Reports which required secrets are present, never their values. */
export function secretStatus(source: Record<string, string | undefined> = process.env) {
  return { DATABASE_URL: Boolean(source["DATABASE_URL"]) };
}
