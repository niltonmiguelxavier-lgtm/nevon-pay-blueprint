# Nevon Pay Blueprint

Analisa todo o repositório existente do Nevon Pay antes de alterar qualquer código.



OBJECTIVO:

Preparar o projecto para produção utilizando Cloudflare Workers, PostgreSQL, Hyperdrive, R2 e Queues.



TAREFAS:



1. Analisar a estrutura de pastas e as tecnologias existentes.

2. Identificar dependências de Neon, Prisma, PostgreSQL e Next.js.

3. Verificar a compatibilidade com Cloudflare Workers.

4. Identificar funcionalidades concluídas, incompletas e inexistentes.

5. Avaliar autenticação, API, comerciantes, pagamentos, checkout, wallet e ledger.

6. Identificar vulnerabilidades e erros.

7. Preparar uma estratégia de migrations e backups.

8. Definir a arquitectura final.

9. Identificar custos potenciais e dependências externas.

10. Criar docs/cloudflare-migration-plan.md.



REGRAS:



- Não apagar código existente.

- Não executar migrations destrutivas.

- Não eliminar a base de dados actual.

- Não activar pagamentos reais.

- Não inventar integrações.

- Não alterar ficheiros sem necessidade nesta fase.



RESULTADO:

Apresenta a arquitectura proposta, os problemas encontrados, as alterações necessárias e a ordem de implementação.



Pára e aguarda autorização para a Fase 1.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cf910b53-2192-41f4-9ae9-f273aeef4ada).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
