# 04 — Frontend em Profundidade

## Stack

React 18 (`createRoot`, `StrictMode`) + Vite 6 + Tailwind 3 + ESM.
Deps extras: `lucide-react` (ícones), `canvas-confetti` (CeremonyMode),
`clsx` + `tailwind-merge` (utilidades de classe, usadas pontualmente).

## Bootstrap e composição

- `src/main.jsx`: `createRoot(...).render(<StrictMode><App/></StrictMode>)`.
- `src/App.jsx`: `CourtProvider` → `AppContent`.
  - `AppContent` controla: `currentParticipant`, `loading`.
  - Abre `CheckInModal` de cara se não há participante (`showInitialCheckIn`).
  - Roda `AdminModal` quando sem PIN salvo; com PIN salvo, abre `AdminDashboard` direto.
  - `loading` mostra splash medieval (brasão com `Crown` + `royal-float`).

## Estado global — `context/CourtContext.jsx`

É o coração do front. **Tudo passa por `useCourt()`.**

### Estado
| state | tipo/formato | origem |
|---|---|---|
| `currentParticipant` | objeto `{id, name, title, session_token, ...}` | `localStorage('corte_combatente')` |
| `participants` | `[{id,name,title,total_votes_cast}]` | `GET /api/participants` (polling 6s) |
| `professors` | `[{id,name,subject,is_preset}]` | `GET /api/professors` |
| `questions` | com joins de categoria | `GET /api/questions` |
| `categories` | com `questionCount` | `GET /api/categories` |
| `activeCategory` | number (default 1) | local |
| `myVotes` | `{ [question_id]: name }` | `GET /api/votes/my/:id` |
| `votingStatus` | `{ [question_id]: 'idle'\|'saving'\|'saved'\|'error' }` | local |
| `loading`, `apiOnline`, `toastMessage` | — | local |

### Ações
- `checkIn(name, title)` → reusa token se identidade bate; salva `corte_combatente` e
  `corte_identidade`; recarrega participantes e votos; toast de boas-vindas.
  Re-lança erro (o modal trata 409 separadamente).
- `leaveCourt()` → preserva `corte_identidade`, limpa participante e votos, remove
  `corte_combatente`, toast "info".
- `castVote(questionId, name)` → **otimista**: grava em `myVotes` + status `saving`,
  chama `submitVote`, marca `saved` (some após 2s). Erro → `error` + toast.
- `addProfessor(name, subject)` → POST e recarrega `professors`.
- `refreshParticipants / refreshProfessors / refreshQuestions`.

### Efeitos
- Boot: carrega participantes, mestres, questões/categorias (e votos se logado).
- Polling: `setInterval(fetchParticipants(true), 6000)`.

### Computados
`totalQuestions` (fallback `48`), `votedCount`, `progressPercentage`.

## Cliente de API — `services/api.js`

- `courtApi` com 1 função por endpoint (ver mapa em `01-architecture.md`).
- Headers especiais: `x-participant-token` (votos) e `x-admin-pin` (admin).
- Erro: lança `Error(data.error || ...)`, atribui `.status` — callers decidem.

## Página — `pages/VotingArena.jsx`

- Toast flutuante fixo (renderizado se `toastMessage`).
- Banner "A Corte dos Formandos" (saudação ao alistado ou CTA "Alistar-se Agora").
- `ProgressBar`, `CategoryTabs`, descrição da categoria, lista de `QuestionCard`
  (filtradas por `activeCategory`), navegação anterior/próxima.

## Componentes críticos

### `QuestionCard.jsx` (a Regra de Ouro vive aqui)
- `isProfessorQuestion = question.target_type === 'professor'`.
- `candidateOptions`:
  - professor → `professors.map(p => ({ name, detail: subject }))`
  - student → `participants.map(p => ({ name, detail: title }))`
- Dropdown `<select>`; estado "SELADO" (badge wax-seal) quando `myVotes[q.id]` existe;
  status `saving/saved`; vazio → aviso medieval ("Aguardando combatentes..."); botão
  "+ Outro Mestre" só para questões de professor (abre `AddProfessorModal`).

### `CheckInModal.jsx`
- Form nome + título (select com sortear `Dices` + campo custom).
- Overlay de "Conferência Real" durante o check-in (drama dos 5s).
- Tratamento de **409** → aviso "Nome já protegido pela Corte".
- Fetch de títulos extras via `courtApi.getTitles`.

### `AdminDashboard.jsx`
- Vistas: `results` (apuração por categoria, ranking, winners, resumo) |
  `management` (combatentes / mestres / decretos, busca e CRUD) |
  dança de modais (renomear, expurgar, criar/editar decreto).
- Zona de perigo: `Expurgar Todos os Votos` (reset-votes) e `Reiniciar Tudo` (reset-all),
  ambos com `window.confirm`.
- Botão **Modo Telão** → `CeremonyMode` (recebe `results`).

### `CeremonyMode.jsx`
- Achata `results.resultsByCategory` em uma lista de perguntas.
- Botão "Revelar Escolhido da Corte" → revela `winners[0]` + confetes.
- Navegação por teclado: `ArrowRight`/`Space`=próximo, `ArrowLeft`=anterior, `Escape`=fechar.

### Demais
- `Navbar.jsx`: sticky, dot verde/vermelho (`apiOnline`), contador de combatentes
  (clicável para refresh), nome+título do alistado, botão Cofre.
- `CategoryTabs.jsx`: abas com `catVoted/catTotal` e checagem de categoria completa.
- `ProgressBar.jsx`: barra de progresso global + celebração a 100%.
- `AddProfessorModal.jsx` e `AdminModal.jsx`: modais padrão.

## Tema medieval (Tailwind + CSS)

- Cores em `tailwind.config.js`: `gold` (glow `#F59E0B`), `royal` (vinho `#14060B`→`#B8265B`),
  `obsidian` (quase-preto `#0B0A0D`→`#3A364B`), `parchment` (pergaminho `#FBF7EE`→`#CFBC84`).
- Fontes: `font-medieval` (Cinzel Decorative), `font-heading` (Cinzel), `font-body` (Outfit).
- Sombras: `shadow-gold-glow`, `shadow-gold-glow-lg`, `shadow-royal-glow`, `shadow-parchment-border`.
- `backgroundImage`: `royal-radial`, `gold-shimmer`.
- CSS custom (`src/index.css`): fundo do body com grade + gradient radial, scrollbar
  medieval, `.medieval-border`, `.medieval-title-glow`, animações `wax-seal-animate`
  (selo) e `royal-float` (brasão).

## Regras de UI

- **pt-BR com tom medieval** em qualquer texto novo ("sele os seus votos", "aliste-se",
  "Decreto #N"). Evite termos neutros quando já existe padrão medieval.
- Ícones via `lucide-react`; nunca emojis em código (só em dados de categorias/titles).
- Modais seguem o padrão `fixed inset-0 z-50 bg-obsidian-950/85 backdrop-blur ...` dos existentes.
- Toasts via `showToast` do contexto (não criar sistema paralelo).
- Não adicionar dependências sem necessidade real.