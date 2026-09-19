# AGENTS.md — Backend da Corte

Suplemento do `AGENTS.md` raiz, específico do `backend/`.

## Stack e paradigmas

- Node.js + **Express 4** + **SQLite** via `better-sqlite3` (síncrono).
- **CommonJS**: `require`/`module.exports`. Sem ESM, sem TS, sem ORM.
- Três dependências de runtime: `express`, `cors`, `dotenv`, `better-sqlite3`.

## Arquitetura obrigatória

- `src/server.js` é o entrypoint **e detém TODAS as rotas** (inline). Exceção não
  discutida — novas rotas entram aqui, chamando a função do controller.
- `src/controllers/<dominio>Controller.js` agrupa os handlers por domínio.
- `src/config/database.js` exporta `{ db, initializeDatabase }`. O `db` é singleton
  e os controllers o importam diretamente.
- `src/middlewares/authMiddleware.js` protege as rotas `/api/admin/*`.
- `src/data/` contém os seeds (decretos, categorias, professores padrão).

## Comandos

- `npm run dev` → `node --watch src/server.js` (porta 5000)
- `npm start` → `node src/server.js` (produção)
- Sem testes e sem linter; validação é manual (`npm run dev` + chamadas HTTP).

## Regras de dados (críticas)

1. `votes.voted_for_name` guarda o **nome** do votado, não o id → toda
   renomeação/remoção deve cascatear nos votos (ver `adminController`).
2. Upsert de voto: `ON CONFLICT(voter_id, question_id) DO UPDATE`.
3. Migração idempotente obrigatória (`PRAGMA table_info` + `ALTER TABLE`) em
   `initializeDatabase()`.
4. Check-in tem atraso proposital de 5s (`waitForRoyalVerification`) — não remover
   sem avisar (é efeito dramático do fluxo).
5. Nomes de participante são únicos com `COLLATE NOCASE`; token de sessão é hash
   SHA-256 (nunca devolver o hash, só o token cru ao cliente).

## Tom das mensagens

Toda mensagem de erro/sucesso da API em pt-BR medieval, ex.: `'Voto selado pela Coroa com sucesso!'`.
Não troque por texto neutro sem necessidade.