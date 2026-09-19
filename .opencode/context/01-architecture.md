# 01 — Arquitetura

Monorepo simples com dois apps independentes: `backend/` (API) e `frontend/` (SPA).
Não há workspace compartilhado nem build unificado.

```
backend/                        frontend/
  src/server.js                   src/main.jsx
  src/config/database.js          src/App.jsx
  src/controllers/*.js            src/context/CourtContext.jsx
  src/middlewares/authMiddleware.js  src/services/api.js
  src/data/*.js                   src/pages/VotingArena.jsx
  package.json                    src/components/*.jsx
```

## Backend — Express + SQLite (CommonJS)

### Entrypoint: `backend/src/server.js`

- Carrega `dotenv`, monta `express`, aplica `cors()` e `express.json()`.
- **Define TODAS as rotas inline.** Convenção inegociável: rota nova entra aqui e
  delega o trabalho ao controller. Não existe registro de rota em outro lugar.
- Chamada `initializeDatabase()` antes de `app.listen(PORT)` (padrão `5000`).

### Camada de controllers: `backend/src/controllers/`

Cada arquivo exporta um objeto com handlers. Padrão de handler:

```js
handler: (req, res) => {
  try {
    // lógica usando o db singleton
    return res.status(200).json({ ... });
  } catch (error) {
    console.error('...', error);
    return res.status(500).json({ error: 'Mensagem medieval...' });
  }
}
```

| Arquivo | Responsabilidade |
|---|---|
| `participantController.js` | check-in, listar/listar por id, títulos, token de sessão |
| `questionController.js` | decretos (com join de categorias) e categorias |
| `professorController.js` | CRUD público de mestres (nome+disciplina) |
| `voteController.js` | votar (upsert), meus votos, estatísticas |
| `adminController.js` | apuração, resets e **todo** o CRUD protegido (participantes, mestres, decretos) |

### Banco: `backend/src/config/database.js`

- `better-sqlite3` **síncrono**, singleton `db` importado direto pelos controllers.
- `initializeDatabase()`: cria tabelas (`CREATE TABLE IF NOT EXISTS`), roda migrações
  idempotentes e insere seeds quando vazio.
- WAL habilitado e `foreign_keys = ON`.

### Middleware: `backend/src/middlewares/authMiddleware.js`

- Protege `/api/admin/*`. Aceita o PIN via header `x-admin-pin`, query `?pin=` ou
  body `{ pin }`. Compara com `ADMIN_PIN` (fallback `'1234'`). 401 se inválido.

### Mapa de rotas

| Método | Rota | Acesso | Controller |
|---|---|---|---|
| GET | `/api/health` | público | inline |
| POST | `/api/checkin` | público | participant.checkIn |
| GET | `/api/participants`, `/api/participants/:id`, `/api/titles` | público | participant |
| GET | `/api/questions`, `/api/questions/:id`, `/api/categories` | público | question |
| GET/POST/DELETE | `/api/professors`, `/api/professors/:id` | público | professor |
| POST | `/api/votes` | público (valida token na hora) | vote.submitVote |
| GET | `/api/votes/my/:voterId` | público (valida `x-participant-token`) | vote.getMyVotes |
| GET | `/api/votes/stats` | público | vote.getStats |
| POST | `/api/admin/verify` | PIN | admin.verifyPin |
| GET | `/api/admin/results` | PIN | admin.getResults |
| POST | `/api/admin/reset-votes` / `reset-all` | PIN | admin |
| PUT/DELETE | `/api/admin/participants/:id` | PIN | admin |
| PUT/DELETE | `/api/admin/professors/:id` | PIN | admin |
| POST/PUT/DELETE | `/api/admin/questions/:id` | PIN | admin |

### Dependências (runtime)

`express` 4, `cors`, `dotenv`, `better-sqlite3`. Sem ORM, sem TS, sem migrações externas.

## Frontend — React 18 + Vite (ESM)

### Boot: `main.jsx` → `App.jsx`

- `main.jsx` renderiza `<App />` com `StrictMode`.
- `App.jsx` envolve tudo em `<CourtProvider>`, decide a composição: Navbar fixo,
  `VotingArena`, footer, `CheckInModal`, `AdminModal` e `AdminDashboard` (condicional).

### Cliente de API: `frontend/src/services/api.js`

- Exporta `courtApi` (objeto de funções). Base = `VITE_API_URL || http://localhost:5000`.
- Um `request(endpoint, options)` genérico faz fetch, parseia JSON, e lança
  `Error` com a mensagem (`data.error`) e `error.status` quando a resposta não é `ok`.
- Sempre `Content-Type: application/json`; headers auxiliares: `x-participant-token`
  (sessão do votante) e `x-admin-pin` (admin).

### Estado global: `frontend/src/context/CourtContext.jsx`

Provedor central com estado e ações:

- `currentParticipant` — restaurado do `localStorage` (`corte_combatente`).
- `participants` — polled a cada **6s** (`fetchParticipants(true)` silencioso).
- `professors`, `questions`, `categories` — carregados no boot (`refresh*` p/ recarregar).
- `myVotes` — `{ [question_id]: voted_for_name }`, carregado no check-in.
- `votingStatus` — estados de salvamento por questão.
- `activeCategory` (default 1), `loading`, `apiOnline`, `toastMessage`.
- Ações: `checkIn`, `leaveCourt`, `castVote` (otimista), `addProfessor`,
  `refreshParticipants/Professors/Questions`.

Qualquer componente consome via `useCourt()`.

### Página principal: `frontend/src/pages/VotingArena.jsx`

- Toast flutuante, banner de boas-vindas, alerta de "não alistado", `ProgressBar`,
  `CategoryTabs`, cards de perguntas da categoria ativa e navegação
  anterior/próxima categoria. Prop `onOpenCheckIn` abre o modal.

### Componentes (`frontend/src/components/`)

| Componente | Papel |
|---|---|
| `Navbar` | Sticky, status online, contador de combatentes, botões Alistar/Cofre |
| `CheckInModal` | Alistamento: nome + título (sorteio/custom), overlay de verificação, aviso 409 |
| `AdminModal` | Entrada de PIN do Cofre |
| `AdminDashboard` | Painel: apuração por categoria, gestão (combatentes/mestres/decretos), zona de perigo, lança `CeremonyMode` |
| `CeremonyMode` | Telão fullscreen: revelação com confete, navegação por setas |
| `QuestionCard` | Um decreto: dropdown de candidatos (dinâmico por `target_type`), estado selado |
| `CategoryTabs` | Abas com progresso por categoria |
| `ProgressBar` | Progresso global |
| `AddProfessorModal` | Cadastro rápido de mestre |

## Fluxo de dados (end-to-end)

1. **Check-in**: modal → `CourtContext.checkIn` → `courtApi.checkIn` → `POST /api/checkin`
   → token + participante gravados no `localStorage` → `myVotes` recarregados.
2. **Novo colega chega**: polling 6s atualiza `participants` → `QuestionCard` re-renderiza
   com o nome novo no dropdown (Regra de Ouro garantida no render).
3. **Voto**: `castVote` otimista → `POST /api/votes` → upsert → status `saved`.
4. **Apuração**: `AdminDashboard.fetchResults` → `GET /api/admin/results` (PIN) → pódios.
5. **Cerimônia**: `CeremonyMode` consome `results.resultsByCategory` achatado.

## Regras atômicas da API

- Respostas sempre JSON com `error` em mensagem medieval pt-BR nos erros.
- `console.error` no backend em todo catch.
- Operações multi-statement usam `db.transaction(...)`.