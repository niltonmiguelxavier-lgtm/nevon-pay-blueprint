import { describe, expect, it } from "vitest";
import { isDestructive, isValidMigrationName } from "../../scripts/migrate-lib";
import { readEnv, secretStatus } from "@/lib/env.server";
import { parseCorsOrigins } from "@/lib/http.server";
import { readFileSync, readdirSync } from "node:fs";

describe("migrations", () => {
  it("blocks DROP TABLE", () => expect(isDestructive("DROP TABLE users;")).toBe(true));
  it("blocks TRUNCATE", () => expect(isDestructive("truncate payments")).toBe(true));
  it("allows additive SQL", () => expect(isDestructive("CREATE TABLE IF NOT EXISTS x (id int);")).toBe(false));
  it("ignores keywords in comments", () => expect(isDestructive("-- no DROP TABLE here\nSELECT 1;")).toBe(false));
  it("rejects bad filenames", () => expect(isValidMigrationName("init.sql")).toBe(false));
  it("all shipped migrations are non-destructive", () => {
    for (const f of readdirSync("migrations")) {
      expect(isDestructive(readFileSync(`migrations/${f}`, "utf8"))).toBe(false);
    }
  });
});

describe("env", () => {
  it("payments mode only allows sandbox", () => {
    expect(() => readEnv({ PAYMENTS_MODE: "live" })).toThrow();
    expect(readEnv({}).PAYMENTS_MODE).toBe("sandbox");
  });
  it("secret status never returns the value", () => {
    expect(secretStatus({ DATABASE_URL: "postgres://u:p@h/db" })).toEqual({ DATABASE_URL: true });
  });
});

describe("cors", () => {
  it("parses allowed origins", () =>
    expect(parseCorsOrigins(" https://a.com, https://b.com ,")).toEqual(["https://a.com", "https://b.com"]));
});
