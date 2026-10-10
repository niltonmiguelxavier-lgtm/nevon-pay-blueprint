<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Server-only code lives in `src/lib/*.server.ts`; env is read inside handlers via `readEnv()` so Workers request-time env works and secrets never reach the client.
- DB access goes through `withDb()` (per-request client, Hyperdrive binding preferred) because Workers can't reuse sockets across requests.
- Schema changes are forward-only SQL files in `migrations/NNNN_name.sql` applied by `scripts/migrate.ts`; destructive SQL is blocked to protect production data.
- HTTP endpoints wrap handlers in `handle()` for consistent logging, CORS and error shape.
- Payments are sandbox-only, enforced in env validation and a DB CHECK, until live payments are explicitly authorized.
