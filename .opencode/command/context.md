---
description: Carrega o contexto profundo do projeto (arquitetura, regras e lógicas) sem varrer o código. Escopos: all, backend, frontend, db, rules, env, workflow.
agent: build
---

# ⚔️ Contexto da Corte de ADS

Você está operando em **modo contexto**. Você recebeu a profundidade completa do
projeto abaixo — use-a como fonte de verdade para a tarefa e NÃO reexplore o
código para descobrir o que já está documentado aqui (nem faça leituras
desnecessárias do repo).

## Escopo solicitado

`$ARGUMENTS` informa o foco. (Valores válidos: `all`, `backend`, `frontend`,
`db`, `rules`, `env`, `workflow`. Vazio equivale a `all`.)

Se `$ARGUMENTS` for `all`/vazio: leia **todos** os arquivos da seção "Documentos".
Caso contrário, leia APENAS os documentos marcados para o escopo:

| Escopo                    | Documentos a ler |
|---------------------------|------------------|
| `backend` / `api`         | `01-architecture.md`, `02-database.md`, `03-logic-rules.md`, `05-environment-deploy.md` |
| `frontend` / `ui`         | `01-architecture.md`, `03-logic-rules.md`, `04-frontend.md` |
| `db` / `banco` / `database` | `02-database.md`, `03-logic-rules.md` |
| `rules` / `regras` / `logic` | `03-logic-rules.md` |
| `env` / `deploy` / `ambiente` | `05-environment-deploy.md` |
| `workflow` / `fluxo` / `convencoes` | `06-workflow.md` |

## Documentos

Todos os caminhos relativos à raiz do repositório:

- `.opencode/context/_INDEX.md` — mapa e índices do contexto (leia SEMPRE, primeiro)
- `.opencode/context/00-overview.md` — visão geral do produto e fluxos
- `.opencode/context/01-architecture.md` — arquitetura backend e frontend
- `.opencode/context/02-database.md` — schema, invariantes e migrações SQLite
- `.opencode/context/03-logic-rules.md` — regras de negócio e lógicas sagradas
- `.opencode/context/04-frontend.md` — frontend em profundidade (estado, polling, UI, tema)
- `.opencode/context/05-environment-deploy.md` — env vars, portas, deploy independente
- `.opencode/context/06-workflow.md` — convenções de trabalho e manutenção

## Núcleo inegociável (já carregado aqui — nunca violar)

1. **Regra de Ouro**: opções de voto para decretos de aluno (`target_type: 'student'`)
   saem **só** dos participantes que fizeram check-in na festa. Nada de lista fixa
   para alunos.
2. **Voto = nome texto** (`voted_for_name`), não id. Renomear ⇒ reescrever votos
   recebidos; excluir ⇒ expurgar votos.
3. **Um voto por (votante, decreto)** via upsert SQLite. Re-votar re-sela, não duplica.
4. **Sessão**: `session_token` SHA-256 liga navegador ↔ participante (403 sem token,
   409 se nome agarrado por outro navegador).
5. **Admin** protegido por PIN (`x-admin-pin`, `ADMIN_PIN`).
6. `target_type` define a fonte de candidatos: `student` → participantes,
   `professor` → professores ativos.
7. Professor desativa com **delete lógico** (`is_active = 0`); participante tem delete
   físico + limpeza de votos.

## Instruções finais

1. Leia `_INDEX.md` e os documentos do escopo (use a ferramenta de leitura).
2. Cite decisões/problemas mapeando ao tópico do doc quando ajudar.
3. Ao final da tarefa, se qualquer fato de arquitetura, regra ou lógica mudou,
   **atualize os arquivos em `.opencode/context/`** (e `AGENTS.md` se preciso) para
   que o contexto nunca fique obsoleto.