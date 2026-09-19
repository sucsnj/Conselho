# ⚔️ Contexto da Corte — Índice

Mapa do contexto profundo do projeto. Leia este arquivo primeiro e, conforme o
escopo, os demais. Tudo aqui é **verdade sobre o estado atual do código** — se você
mudar arquitetura, regra ou lógica, atualize estes documentos.

## Documentos

| # | Arquivo | Assunto | Quando ler |
|---|---|---|---|
| 00 | `00-overview.md` | Visão do produto, personas, fluxos da festa | sempre que precisar do "porquê" |
| 01 | `01-architecture.md` | Arquitetura backend + frontend, fluxo de dados | qualquer tarefa de código |
| 02 | `02-database.md` | Schema SQLite, invariantes, migrações, seeds | qualquer toque no banco |
| 03 | `03-logic-rules.md` | Regras de negócio e lógicas sagradas | antes de alterar comportamento |
| 04 | `04-frontend.md` | Frontend em profundidade (estado, polling, UI, tema) | tarefas de `frontend/` |
| 05 | `05-environment-deploy.md` | Env vars, portas, deploy independente | config/indexação no ar |
| 06 | `06-workflow.md` | Convenções de trabalho e manutenção deste contexto | qualquer alteração em AGENTS/contexto |

## Árvore de arquivos-chave

```
AGENTS.md                         # contexto sempre-carregado (resumo)
backend/AGENTS.md                 # suplemento do backend
frontend/AGENTS.md                # suplemento do frontend
backend/src/server.js             # entrypoint + TODAS as rotas
backend/src/config/database.js    # schema + migrações + seeds
backend/src/middlewares/authMiddleware.js
backend/src/controllers/*.js      # participant, vote, question, professor, admin
backend/src/data/questionsData.js # 48 decretos + 5 categorias
backend/src/data/defaultProfessors.js
frontend/src/services/api.js      # courtApi (cliente fetch)
frontend/src/context/CourtContext.jsx
frontend/src/pages/VotingArena.jsx
frontend/src/components/*.jsx
frontend/tailwind.config.js       # tema medieval
frontend/vercel.json              # rewrite SPA
```

## Lógica de escolha de documento

- Mudou algo em **ações de admin** (renomear/expurgar/reset)? → `02` + `03`.
- Vai mexer em **voto** ou **check-in** (403/409/upsert)? → `02` + `03`.
- Vai criar **componente/tela**? → `04` (+ `01`).
- Vai adicionar **rota ou controller**? → `01` + `05`.
- Vai mudar **schema/seed**? → `02`.
- Vai validar mais de um ao mesmo tempo? → leia os relevantes, não tudo, para
  manter o custo baixo.

## Como manter este contexto vivo

1. Toda mudança de arquitetura, regra ou lógica exige atualização dos docs + do
   `AGENTS.md` quando o resumo ficar desatualizado.
2. `AGENTS.md` permanece enxuto; a profundidade mora aqui.
3. Nunca remover seção sem conferir se o comportamento foi realmente eliminado.