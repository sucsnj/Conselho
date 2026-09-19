# 05 — Ambiente, Configuração e Deploy

## Variáveis de ambiente

### Backend (`backend/.env` → copiar de `backend/.env.example`)
| Var | Default | Usado em |
|---|---|---|
| `PORT` | `5000` | `server.js` listen |
| `ADMIN_PIN` | `1234` | `authMiddleware` |
| `CORS_ORIGIN` | `*` | `server.js` CORS (aceita lista separada por vírgula) |
| `DB_PATH` | `backend/data/court.db` | `database.js` |
| `NODE_ENV` | — | convencional (deploy) |

### Frontend (`frontend/.env` → copiar de `frontend/.env.example`)
| Var | Uso |
|---|---|
| `VITE_API_URL` | base da API no `services/api.js` (default `http://localhost:5000`) |

**`.env` real nunca é commitado** (bloqueado no `.gitignore`, junto de `*.db`,
`node_modules`, builds e `.vscode/`). Apenas `*.env.example` sobem.

## Portas e execução local

| App | Dev | Produção | Porta padrão |
|---|---|---|---|
| backend | `npm run dev` (`node --watch`) | `npm start` (`node src/server.js`) | 5000 |
| frontend | `npm run dev` (Vite, `host: true`) | `npm run build` + `npm run preview` | 5173 |

Ordem típica: subir o backend, depois `npm run dev` do front (ou setar `VITE_API_URL`).

## CORS

`server.js` aceita `CORS_ORIGIN` como `*` ou lista de origens separadas por vírgula.
Roda com `credentials: true`. Métodos: GET, POST, PUT, DELETE, OPTIONS.
Headers liberados: `Content-Type`, `Authorization`, `x-admin-pin`.
**Atenção**: ao colocar deploy independente, o front precisa do backend acessível com
CORS liberado para a origem da Vercel/Netlify.

## Deploy independente

- **Backend**: Render / Railway (conforme `backend/README.md`). Subir `src/server.js`,
  definir `ADMIN_PIN`, `CORS_ORIGIN` e garantir persistência/`DB_PATH` se quiser
  manter dados (a festa usa banco recriado via seeds).
- **Frontend**: Vercel / Netlify (conforme `frontend/README.md`). `vercel.json` já
  faz **rewrite SPA** (`/(.*)` → `/index.html`) — obrigatório para rotas client-side.
  Definir `VITE_API_URL` apontando para o backend publicado.

## Verificação manual (sem testes/linter)

Não há suíte de testes nem linter (**por design**). Valide assim:

1. `cd backend && npm run dev` — veja os banners de inicialização
   ("Banco inicializado", seeded 48 decretos).
2. `cd frontend && npm run dev` — abra `http://localhost:5173`.
3. Roteiro rápido:
   - Check-in cria nome; repetir no 2º navegador → 409.
   - Votar, recarregar → voto mantido (upsert / `myVotes`).
   - Renomear/expurgar via Cofre → votos acompanham (nome continua correto na apuração).
   - Hard reset (`reset-all`) → tela volta ao "zero".
4. Confira mensagens de erro (tp médico: 400/401/403/404/409/500) em pt-BR medieval.

## Armadilhas comuns de ambiente

- `VITE_API_URL` sem barra final → URL dupla (`...api.com/api`); manter `/api` certo.
- Backend numa rede diferente (ex.: WSL/docker) → `localhost` não resolve; usar URL exposta.
- `better-sqlite3` precisa de toolchain para compilar no destino (deploy) — usar build
  compatível (glibc/node da plataforma).
- Banco em `backend/data/` é ignorado pelo git: qualquer teste com dados não sobe
  para o repositório (recriado por seeds no primeiro boot).