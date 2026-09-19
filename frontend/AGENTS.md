# AGENTS.md — Frontend da Corte

Suplemento do `AGENTS.md` raiz, específico do `frontend/`.

## Stack e paradigmas

- React 18 + Vite 6 + Tailwind 3. ESM puro (`import`/`export`).
- Cliente de API centralizado em `src/services/api.js` (`export const courtApi`).
- Estado global único em `src/context/CourtContext.jsx` via Context API + hooks
  (`CourtProvider`, `useCourt`). Sem Redux/Zustand/React Query.
- Ícones: `lucide-react`. Confete: `canvas-confetti` (Modo Cerimônia).

## Fluxo de dados

- `CourtContext` carrega tudo no boot (`fetchParticipants`, `fetchProfessors`,
  `fetchQuestionsAndCategories`, `fetchMyVotes`) e faz **polling do check-in a cada 6s**
  (lista de opções cresce conforme colegas chegam — Regra de Ouro).
- `currentParticipant` vive no `localStorage` (`corte_combatente`), junto com
  `corte_identidade` (token de sessão) e `corte_admin_pin`.
- Votar é **otimista**: atualiza `myVotes` na hora e mostra `votingStatus` (`idle|saving|saved|error`).
- Toasts: via `showToast` do contexto (exibir `toastMessage` já renderiza).

## Componentes-chave

| Componente | Papel |
|---|---|
| `CheckInModal` | Alistamento (nome + título), tela de confirmação, aviso 409 |
| `QuestionCard` | Um decreto por card; dropdown de opções dinâmico pelo `target_type` |
| `CategoryTabs` / `ProgressBar` | Progresso por categoria e global |
| `AdminDashboard` | Cofre da Coroa: apuração, gestão (combatentes/mestres/decretos) e zona de perigo |
| `CeremonyMode` | Telão fullscreen com revelação + confetes + setas do teclado |
| `AddProfessorModal` / `AdminModal` | Modais utilitários |

## Tema (Tailwind)

Cores custom em `tailwind.config.js`: `gold`, `royal`, `obsidian`, `parchment`.
Classes utilitárias custom em `src/index.css`: `medieval-border`, `medieval-title-glow`,
`wax-seal-animate`, `royal-float`. Fontes: `Cinzel Decorative` (medieval), `Cinzel`
(heading), `Outfit` (body). Mantenha o tom visual ao criar componentes (sombras
`shadow-gold-glow`, fundos `obsidian`, bordas `gold-600/xx`).

## Regras de texto

- UI 100% pt-BR com tom medieval ("sele os seus votos", "aliste-se na tenda").
- Nunca commit `.env` (VITE_API_URL vai em `.env.example`); `vercel.json` já cuida do
  rewrite SPA.