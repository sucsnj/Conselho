# AGENTS.md — A Corte de ADS

Contexto de orientação permanente para qualquer agente trabalhando neste repositório.
Este arquivo é **sempre carregado** e deve permanecer curto. A profundidade completa
vive em `.opencode/context/` e é entregue pelo comando `/context`.

## O que é este projeto

Aplicação web de votação da turma ("amigo de merda" / "votação da turma") com
temática medieval, usada na festa de encerramento do curso de ADS. Público votante:
formandos presentes na festa (via check-in) + professores.

- **Backend**: Node.js + Express 4 + SQLite (`better-sqlite3`), CommonJS.
- **Frontend**: React 18 + Vite 6 + Tailwind 3, ESM, pt-BR, tema medieval.
- **Monorepo simples**: `backend/` e `frontend/`, deploy independente.

## Regras e lógicas sagradas (não quebrar)

1. **Regra de Ouro**: para decretos de alunos (`target_type: 'student'`), as opções de
   voto vêm **exclusivamente** dos participantes que fizeram check-in. Quem não foi à
   festa não aparece nas votações. Nunca modele opções de aluno como lista fixa.
2. **Votos são gravados por NOME texto** (`voted_for_name`), não por id. Renomear um
   participante/professor exige atualizar os votos recebidos; excluir exige expurgá-los.
3. **Um voto por (votante, decreto)**: upsert em SQLite (`ON CONFLICT(voter_id, question_id)`).
   Votar de novo re-sela (altera) o voto, não duplica.
4. **Vínculo navegador ↔ participante**: `session_token` (hash SHA-256 armazenado).
   Sem token correto o voto é negado (403); reusar nome de outro navegador dá 409.
5. **Acesso admin** (Cofre da Coroa) é protegido por PIN (`x-admin-pin`, env `ADMIN_PIN`).
6. `target_type` decide a lista de opções: `student` → participantes alistados,
   `professor` → professores ativos.
7. Professores usam delete **lógico** (`is_active = 0`); participantes usam delete físico
   com limpeza de votos.

Detalhamento completo em `.opencode/context/` (use `/context` para carregar).

## Estrutura de pastas (mapa rápido)

```
backend/src/
  server.js                 # entrypoint + TODAS as rotas definidas aqui
  config/database.js        # conexão SQLite + schema + migrações + seeds
  controllers/              # 1 arquivo por domínio (participant, vote, question, professor, admin)
  middlewares/authMiddleware.js  # proteção por PIN
  data/                     # seeds (48 decretos, categorias, professores padrão)
frontend/src/
  context/CourtContext.jsx  # estado global (participante, votos, polling)
  services/api.js           # cliente fetch (courtApi)
  pages/VotingArena.jsx     # página principal de votação
  components/               # UI: QuestionCard, CategoryTabs, CeremonyMode, modais...
```

## Comandos

- Backend: `cd backend && npm run dev` (porta 5000) · `npm start` (produção)
- Frontend: `cd frontend && npm run dev` (porta 5173) · `npm run build` · `npm run preview`
- **Não há testes nem linter** configurados; verique manualmente via `npm run dev`.

## Convenções e armadilhas

- Backend usa **CommonJS** (`require`/`module.exports`); frontend usa **ESM** (`import`).
- Novas rotas **obrigatoriamente** são registradas inline em `backend/src/server.js`.
- Mudanças de schema vão em `initializeDatabase()` de forma **idempotente**
  (padrão: `PRAGMA table_info` + `ALTER TABLE`).
- Strings de UI e mensagens da API devem ser sempre em **pt-BR com tom medieval**.
- Nunca commitar: `.env`, `*.db`, `node_modules/`, segredos. Banco é recriado via seeds.
- Ícones vêm de `lucide-react`; alertas via `showToast`; modificais seguem o padrão dos existentes.

## Manutenção deste contexto

- Sempre que mudar arquitetura, regras de negócio ou lógica, **atualize os arquivos em
  `.opencode/context/`** e este `AGENTS.md` se necessário.
- Contexto profundo nunca é "decorado" no AGENTS.md — fica nos docs separados.