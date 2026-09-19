# 02 — Banco de Dados (SQLite)

## Conexão

`backend/src/config/database.js` cria `better-sqlite3` no arquivo
`DB_PATH` (env) ou `backend/data/court.db`. Habilita **WAL** e `foreign_keys = ON`.
`*.db` e derivados (`-wal`, `-shm`, `-journal`) estão no `.gitignore` — o banco é
recriado via seeds, nunca commitado.

## Tabelas

### `participants`
Formandos que fizeram check-in. **Opções de voto dos decretos de aluno.**

| coluna | tipo | observações |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL UNIQUE COLLATE NOCASE | nome é identidade; case-insensitive |
| title | TEXT DEFAULT 'Guerreiro(a) da Corte' | título medieval |
| session_token_hash | TEXT | hash SHA-256 do token do navegador (nullable p/ bancos antigos) |
| created_at | TEXT DEFAULT datetime('now','localtime') | |

Índice único parcial: `idx_participants_session_token` sobre
`session_token_hash WHERE session_token_hash IS NOT NULL`.

### `professors`
Mestres do Conselho. **Opções de voto dos decretos de professor.** Delete é lógico.

| coluna | tipo | observações |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | |
| subject | TEXT | disciplina |
| is_active | INTEGER DEFAULT 1 | **soft delete** |
| is_preset | INTEGER DEFAULT 0 | 1 = seed padrão ("Prof. Sem Nome") |
| created_at | TEXT | |

### `votes`
O voto em si. **Guarda o NOME do votado, não o id.**

| coluna | tipo | observações |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| voter_id | INTEGER NOT NULL | FK `participants(id)` ON DELETE CASCADE |
| question_id | INTEGER NOT NULL | FK `questions(id)` (sem ON DELETE — expurgo manual) |
| voted_for_name | TEXT NOT NULL | **criticidade alta** (ver "Invariantes") |
| created_at | TEXT | atualizado no upsert |

Constraint: `UNIQUE(voter_id, question_id)`. Um voto por (votante, decreto).

### `categories`
5 categorias fixas (id 1–5). Seedada, editável apenas via banco.

| coluna | tipo |
|---|---|
| id | INTEGER PK |
| name | TEXT NOT NULL |
| emoji | TEXT |
| description | TEXT |

### `questions`
Os 48 decretos. Seedada; CRUD via admin cria/edita/exclui (physical delete).

| coluna | tipo | observações |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| category_id | INTEGER NOT NULL | FK `categories(id)` |
| number | INTEGER | ordenação dentro da categoria (seed = 1..n) |
| title | TEXT NOT NULL | |
| subtitle | TEXT NOT NULL | (etiqueta do decreto) |
| target_type | TEXT DEFAULT 'student' | `'student'` \| `'professor'` |
| is_active | INTEGER DEFAULT 1 | `getAll`/`getById` filtram ativos |
| created_at | TEXT | |

### `session_config`
Chave-valor de configuração de sessão. Hoje só `session_active` (default '1').

## Seeds

Feitos em `initializeDatabase()` **somente quando a tabela está vazia**:

- `data/questionsData.js`: `CATEGORIES` (5) e `QUESTIONS` (48, com `target_type`).
- `data/defaultProfessors.js`: 3 presets `is_preset = 1` (`Prof. Sem Nome 1..3`),
  condicionado a `COUNT(is_preset = 1) == 0`.

## Migrações (padrão obrigatório)

Mudanças de schema entram em `initializeDatabase()` e devem ser **idempotentes**:

1. Adicione a nova coluna na `CREATE TABLE IF NOT EXISTS` (para bancos novos).
2. Para bancos antigos, confira com `PRAGMA table_info(<tabela>)` e rode
   `ALTER TABLE ... ADD COLUMN ...`.
3. Caso necessário, crie índices com `CREATE [UNIQUE] INDEX IF NOT EXISTS`.
4. Não existe ferramenta de migration externa; tudo manual aqui.

Exemplo real implementado (`session_token_hash`):

```js
const cols = db.prepare('PRAGMA table_info(participants)').all();
if (!cols.some(c => c.name === 'session_token_hash')) {
  db.exec('ALTER TABLE participants ADD COLUMN session_token_hash TEXT');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_token ON participants(session_token_hash) WHERE session_token_hash IS NOT NULL');
```

## Padrões de consulta

- **Upsert de voto**:
  ```sql
  INSERT INTO votes (voter_id, question_id, voted_for_name, created_at)
  VALUES (?, ?, ?, datetime('now','localtime'))
  ON CONFLICT(voter_id, question_id)
  DO UPDATE SET voted_for_name = excluded.voted_for_name,
                created_at = datetime('now','localtime')
  ```
- **Nomes case-insensitive**: `WHERE name = ? COLLATE NOCASE`.
- **Agregação de apuração**:
  ```sql
  SELECT question_id, voted_for_name, COUNT(*) as vote_count
  FROM votes GROUP BY question_id, voted_for_name
  ```
- **Transações**: `db.transaction(() => { ... })()` para operações multi-statement
  (renomear+corrigir votos, expurgar, deletar decreto).

## Invariantes de integridade (regras de dados)

1. `voted_for_name` é livre-texto, **não é FK**. Nomes podem ser digitados e depois
   renomeados → manter sempre os votos sincronizados (no controller da ação).
2. Renomear participante/mestre **deve** fazer `UPDATE votes SET voted_for_name = ? WHERE voted_for_name = ?`.
3. Excluir participante obriga expurgar votos em que ele é `voter_id` **e** em que ele
   aparece como `voted_for_name` (senão sobram "dados fantasmas").
4. Excluir mestre = expurgar `voted_for_name` dele + soft delete (`is_active = 0`).
5. Excluir decreto obriga expurgar `votes.question_id` dele.
6. Delete físico de professor **não** existe; delete físico de participante é a regra.
7. Banco recriado por seeds → nunca depender de dados gravados para o deploy.