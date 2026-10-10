# Nevon Pay — Infraestrutura base (Fase 1)

## Componentes
- `src/routes/health.ts` — `GET /health` (liveness, sem dependências).
- `src/routes/ready.ts` — `GET /ready` (config, secrets, ligação à BD, migrations). 503 se não pronto.
- `src/lib/env.server.ts` — validação de variáveis (zod). `PAYMENTS_MODE` só aceita `sandbox`.
- `src/lib/http.server.ts` — logging JSON, `AppError`, tratamento central de erros, CORS por allowlist, `parseBody` com zod.
- `src/lib/db.server.ts` — cliente Postgres por pedido; usa binding Hyperdrive se existir, senão `DATABASE_URL`.
- `migrations/` — SQL versionado `NNNN_nome.sql`, apenas aditivo.
- `scripts/migrate.ts` — runner com tabela `schema_migrations`, checksums, bloqueio de DROP/TRUNCATE/DELETE.
- `infra/wrangler.example.jsonc` — bindings Hyperdrive, R2 (`PRIVATE_FILES`), Queues (`JOBS` + DLQ).

## Instalação local
```bash
bun install
cp .env.example .env.local   # preencher DATABASE_URL local
bun run dev                  # http://localhost:8080
curl localhost:8080/health
curl localhost:8080/ready
```

## Migrations
```bash
DATABASE_URL=... bun scripts/migrate.ts --dry-run   # ver o que seria aplicado
DATABASE_URL=... bun scripts/migrate.ts             # aplicar
```
Regras: nunca editar uma migration aplicada (checksum falha); correcções = nova migration; backup (`pg_dump`) antes de aplicar em produção; testar em staging primeiro.

## Deployment
- **Lovable (por defeito):** Publicar. `DATABASE_URL` configurado como secret do projecto. Hyperdrive/R2/Queues não estão disponíveis neste alojamento; a BD é ligada directamente.
- **Wrangler próprio (opcional):** copiar `infra/wrangler.example.jsonc` para `wrangler.jsonc`, criar recursos (`wrangler hyperdrive create`, `wrangler r2 bucket create`, `wrangler queues create`), `wrangler secret put DATABASE_URL`, `wrangler deploy`. Custos: plano Workers Paid necessário para Queues/Hyperdrive.

## Segurança
- Nenhuma credencial no código; `DATABASE_URL` só no servidor (sem prefixo `VITE_`).
- `audit_logs` é append-only (trigger bloqueia UPDATE/DELETE).
- Pagamentos: tabela com `mode='sandbox'` forçado por CHECK. Sem integrações reais.
