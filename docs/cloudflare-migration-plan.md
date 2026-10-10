# Nevon Pay — Plano de Migração para Cloudflare (Fase 0: Análise)

Data da análise: 2026-10-10. Nenhum código foi alterado, nenhuma migration executada.

## 1. Estado real do repositório

O repositório **não contém código do Nevon Pay**. É um template vazio:

- Framework: TanStack Start v1 (React 19, Vite), já orientado a Cloudflare Workers (workerd).
- Rotas: apenas `/` (placeholder) e `__root`.
- UI: componentes shadcn/Radix genéricos, Tailwind v4.
- Sem backend, sem base de dados, sem autenticação, sem testes de negócio.

## 2. Dependências procuradas

| Tecnologia | Encontrada? |
|---|---|
| Neon (`@neondatabase/serverless`) | Não |
| Prisma (`prisma`, `@prisma/client`, `schema.prisma`) | Não |
| PostgreSQL (`pg`, `postgres`, SQL, migrations) | Não |
| Next.js (`next`, `app/`, `pages/`) | Não |
| `wrangler.toml`, R2, Queues, Hyperdrive | Não |

## 3. Compatibilidade com Workers

O template actual é compatível (SSR e server functions correm em workerd). Não há código Node-only a migrar.

## 4. Funcionalidades

| Módulo | Estado |
|---|---|
| Autenticação | Inexistente |
| API | Inexistente |
| Comerciantes (merchants) | Inexistente |
| Pagamentos | Inexistente |
| Checkout | Inexistente |
| Wallet | Inexistente |
| Ledger | Inexistente |

## 5. Vulnerabilidades e erros

Nenhum código de negócio para auditar. Pendentes: scan de dependências e metadados SEO genéricos ("Lovable App") no `__root`.

## 6. Estratégia de migrations e backups (para quando existir BD)

- Migrations só aditivas (expand → migrate → contract); nunca `DROP` sem backup verificado e aprovação.
- Cada migration versionada e reversível; testar primeiro numa branch/staging.
- Backups: PITR do Postgres + dump lógico diário (`pg_dump`) guardado em R2 com retenção (ex.: 30 dias), restauro testado mensalmente.
- Ledger imutável: apenas INSERT; correcções via lançamentos de estorno.

## 7. Arquitectura proposta

```text
Browser ── Cloudflare Worker (TanStack Start: SSR + server functions + /api/public/*)
               │
               ├── Hyperdrive ── PostgreSQL (fonte de verdade: merchants, wallets, ledger)
               ├── R2 (KYC docs, recibos, backups)
               └── Queues (webhooks de saída, reconciliação, notificações)
                        └── Consumer Worker (retries + dead-letter queue)
```

Princípios: ledger de dupla entrada; idempotency keys em todas as operações de pagamento; webhooks de entrada com verificação de assinatura; segredos só no servidor.

## 8. Custos e dependências externas

- Cloudflare Workers Paid (~5 USD/mês base + uso) — necessário para Queues e Hyperdrive.
- R2: por GB armazenado e operações (sem custo de egress).
- Queues: por milhão de operações.
- PostgreSQL: fornecedor a decidir (gerido). Custo depende do plano.
- Gateway de pagamentos (M-Pesa, e-Mola, cartões, etc.): **por definir pelo utilizador** — não foi assumida nenhuma integração.

## 9. Decisões em aberto (bloqueiam a Fase 1)

1. O código Nevon Pay existe noutro repositório? Se sim, precisa de ser importado.
2. Fornecedor de PostgreSQL e se já existe uma base de dados com dados.
3. Fornecedores de pagamento reais a integrar (apenas em modo sandbox).
4. Moeda(s) e países suportados.

## 10. Ordem de implementação proposta

1. Fase 1 — Fundação: design system, schema Postgres (merchants, users, wallets, ledger_entries, payments), autenticação, migrations aditivas.
2. Fase 2 — Merchants + API keys + dashboard.
3. Fase 3 — Wallet + ledger de dupla entrada + testes de saldo.
4. Fase 4 — Checkout + pagamentos em modo sandbox + idempotência.
5. Fase 5 — Queues (webhooks, reconciliação), R2 (documentos, backups).
6. Fase 6 — Auditoria de segurança, observabilidade, go-live (pagamentos reais só com autorização explícita).
