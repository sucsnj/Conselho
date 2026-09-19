# 06 — Fluxo de Trabalho e Manutenção

## Como um agente deve atuar neste repo

1. **Leia antes de tocar**: `AGENTS.md` raiz (sempre carregado). Para tarefas de
   código, use `/context` com o escopo certo — não varra o projeto à toa.
2. **Respeite as regras sagradas** (`03-logic-rules.md`). Se uma mudança conflita
   com alguma delas, pare e sinalize ao usuário.
3. **Validação manual**: não há testes nem linter. Depois da mudança, rode
   `npm run dev` (backend) e `npm run dev` (frontend) e faça o roteiro do
   `05-environment-deploy.md`.
4. **Só commita o que o usuário pedir.** Nunca commite `.env`, `*.db`, segredos.

## Padrões de código por camada

- **Backend (CommonJS)**:
  - Novas rotas → `server.js` inline, delegando ao controller.
  - Controllers: objeto de handlers com try/catch e `res.status(...).json({ error })`.
  - Schema → migração idempotente em `initializeDatabase()`;
    operações multi-statement → `db.transaction()`.
  - Nomear variáveis em inglês (código técnico); mensagens ao usuário em pt-BR medieval.
- **Frontend (ESM)**:
  - Estado do app → `CourtContext` (`useCourt()`); nada de prop-drilling crítico.
  - Chamadas HTTP → `courtApi` (`services/api.js`); nada de `fetch` solto.
  - UI → padrão medieval existente; ícones `lucide-react`; toasts via `showToast`.
  - Componentes novos seguem a assinatura dos modais existentes.

## Manutenção deste contexto (regra de ouro da documentação)

Toda alteração de **arquitetura**, **regra de negócio** ou **lógica** exige atualizar:

1. `.opencode/context/` — doc(s) afetado(s) (`01`, `02`, `03`, `04`, ...).
2. `AGENTS.md` — se o resumo parou de refletir a realidade.
3. `_INDEX.md` — se entrou/saiu arquivo ou a "quando ler" mudou.

Sinais de que a doc está defasada:
- O código implementa algo que os docs **proíbem**;
- Um doc descreve tabela/coluna/rota/estado que não existe mais;
- Uma regra nova passou a reger votos/check-in/admin e não foi documentada.

## Fluxos que mudam o contrato (sempre documente)

| Ação | Onde atualizar |
|---|---|
| Nova rota/endpoint | `01` (mapa de rotas) + `server.js` |
| Coluna/tabela nova | `02` (schema/migração) |
| Regra de votos/sessão | `03` (checklist) |
| Novo componente/tela | `04` (componentes) |
| Env var / deploy | `05` |
| Convenções | `06` + `AGENTS.md` se necessário |

## Padrão de respostas

- Seja breve e direto (CLI).
- Cite `arquivo:linha` quando referenciar código.
- Confirme impacto nas regras sagradas ao final (ex.: "Regra de Ouro preservada").