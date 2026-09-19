# 03 — Regras de Negócio e Lógicas Sagradas

Este arquivo é a fonte de verdade das regras **não-negociáveis**. Violar qualquer
uma quebra o comportamento da festa.

---

## 1. Regra de Ouro (alunos)

Para qualquer decreto com `target_type: 'student'` (categorias 1–4), a lista de
opções de voto é **exclusivamente preenchida pelos participantes que fizeram
check-in** na festa. Não existe lista fixa de alunos em lugar nenhum.

- Implementação: `QuestionCard.jsx` monta `candidateOptions` com
  `participants.map(p => ({ name, detail: title }))` — e `participants` vem do
  polling do contexto.
- Quem não compareceu simplesmente não existe na votação.
- **Nunca** criar tabela/seed de alunos, nem lista dura no frontend.

## 2. Voto por NOME (não por id)

`votes.voted_for_name` é um texto livre digitado/selecionado. Consequências:

- **Renomear** um participante ou professor **obriga** a reescrever os votos
  recebidos com o nome antigo (`UPDATE votes SET voted_for_name = new WHERE voted_for_name = old`),
  dentro de transação, como já faz `adminController.updateParticipant/updateProfessor`.
- **Excluir** um participante/mestre obriga a remover os votos recebidos com aquele
  nome (expurgo), para não gerar votos órfãos na apuração.
- Se novos tipos de candidato forem criados, repita o mesmo contrato.

## 3. Um voto por (votante, decreto) — re-votar re-sela

- Constraint `UNIQUE(voter_id, question_id)` + upsert com `ON CONFLICT ... DO UPDATE`.
- Votar de novo na mesma pergunta **altera** o voto (re-sela), nunca duplica.
- O frontend faz atualização otimista: clicar em um candidato já `myVotes[qid]`
  substitui direto.

## 4. Vínculo navegador ↔ participante (sessão)

- O check-in cria/recupera um `session_token` **cru** (hex) entregue ao navegador;
  o banco guarda apenas o hash SHA-256.
- Para votar ou consultar votos, o backend valida `session_token` contra o hash do
  participante:
  - sem token/correspondência → **403** (`'Este navegador não está autorizado...'`);
  - `getMyVotes` exige o token no header **`x-participant-token`** (não no body).
- Check-in de nome já vinculado a **outro** navegador → **409**
  (`'Este nome já está vinculado a outro navegador...'`). O navegador original
  revisita o mesmo nome sem problema (com o token antigo).
- `localStorage` do front: `corte_combatente` (participante+token), `corte_identidade`
  (nome+token p/ re-alistamento), `corte_admin_pin` (PIN admin lembrado).

## 5. Acesso admin (Cofre da Coroa) por PIN

- Todas as rotas `/api/admin/*` passam por `authMiddleware`.
- PIN lido de: header `x-admin-pin`, query `?pin=` ou body `{ pin }`.
- Comparação com `process.env.ADMIN_PIN` (fallback `'1234'`). 401 + mensagem medieval.
- O front envia `x-admin-pin` e guarda o PIN no `localStorage`.

## 6. `target_type` decide os candidatos

| `target_type` | Fonte de opções |
|---|---|
| `'student'` | `participants` ativos (check-in) |
| `'professor'` | `professors` com `is_active = 1` |

- O campo é definido no seed e editável no CRUD admin. Seeds aluno/professor
  estão corretos (cat 1–4 student, cat 5 professor).
- Ao criar decreto pelo admin, `target_type` é normalizado: só `'professor'` ou `'student'`.

## 7. Semântica de exclusão é diferente por entidade

- **Professor**: **delete lógico** — `UPDATE professors SET is_active = 0`.
  O registro permanece (para reativar, basta recriar pelo POST que detecta e reativa).
  Votos recebidos são expurgados.
- **Participante**: **delete físico** com transação de expurgo:
  votos que ele **deu** (`voter_id`) + votos que ele **recebeu** (`voted_for_name`) +
  o registro.
- **Decreto**: delete físico + expurgo dos seus `votes`.
- **Reset global**: `reset-votes` zera `votes`; `reset-all` zera `votes` e `participants`.

## 8. Atraso dramático do check-in

`participantController.waitForRoyalVerification()` = `setTimeout(..., 5000)`.
É uma camada de "verificação real" para UX da festa (o lock screen aparece e pede
paciência). Não é bug e não deve ser encurtado sem comunicar.

## 9. Título do participante

- No check-in, se não vier título, sorteia de `TITLES` (lista em `participantController.js`).
- Re-checkin do mesmo navegador com novo título **atualiza** o título (mantém token).
- Título pode ser customizado pelo admin ao renomear.

## 10. Apuração (admin results)

- Conta votos por `(question_id, voted_for_name)`, ordena por contagem desc.
- **Porcentagem = arredondada** (`Math.round(votos/total*100)`) — soma pode não dar
  exatamente 100%.
- `position = índice no ranking + 1`.
- `winners` = todos os empatados no topo (empate é tratado — cerimônia mostra o 1º).
- Retorna `summary`, `resultsByCategory` e `resultsByQuestion`.

## 11. Contagem considerada no frontend

- `myVotes` conta por `Object.keys` (uma entrada por `question_id`).
- Progresso global usa `totalQuestions = questions.length` (fallback 48 reativo ao
  load). Categorias ativas mostram `X/Y votos`.

---

## Checklist antes de implementar algo que toca votos

- [ ] Respeita a Regra de Ouro? (opções de aluno só de quem fez check-in)
- [ ] Votos por nome continuam íntegros ao renomear/excluir?
- [ ] Upsert mantido (re-votar re-sela)?
- [ ] Token de sessão validado no backend (403/409)?
- [ ] Admin protegido por PIN?
- [ ] Textos em pt-BR medieval?