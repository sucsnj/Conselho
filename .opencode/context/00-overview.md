# 00 — Visão Geral do Produto

## O que é

"A Corte de ADS" é uma votação da turma estilo *"amigo de merda"* / *"votação da turma"*,
cercada de temática medieval imersiva. É usada **ao vivo na festa de encerramento do
curso de Análise e Desenvolvimento de Sistemas (ADS)** para eleger "salas" da turma:
quem tem mais cara de X, quem faria Y, qual professor é Z, etc.

## Público e persona da festa

- **Formandos (combatentes)**: chegam à festa, fazem **check-in** (nome + título
  medieval) e votam. Só quem está presente (faz check-in) vira opção de voto.
- **Professores (mestres)**: são cadastrados pela organização (presets "Prof. Sem Nome"
  editáveis + criação manual) e são opção apenas nos decretos da Categoria 5.
- **Mestre de cerimônias / admin**: abre o **Cofre da Coroa** com PIN, acompanha a
  apuração em tempo real e projeta o **Modo Cerimônia** no telão.

## Os três momentos do fluxo

1. **Chegada / Check-in** — o formando abre o app, digita nome e título (ou sorteia),
   e a Corte guarda o vínculo navegador ↔ identidade (token). O nome passa a aparecer
   como opção em todos os decretos de alunos, em **todos** os dispositivos (polling 6s).

2. **Votação** — cada formando seleciona, para cada um dos 48 decretos, quem da turma
   (categorias 1–4) ou qual professor (categoria 5) vence. Pode re-votar à vontade;
   o último voto é o que vale (upsert).

3. **Apuração / Cerimônia** — no fim, o admin abre a apuração (pódio por decreto com
   %) e conduz o **Modo Cerimônia** no projetor: "Revelar Escolhido da Corte" com
   suspense e confetes.

## Estrutura de conteúdos das votações

| Categoria | Nome | Alvo | Qtde |
|---|---|---|---|
| 1 | Perguntas Gerais da Corte (👑) | student | 10 |
| 2 | O Caos do Código (💻) | student | 11 |
| 3 | Apresentações e Lábias (🎤) | student | 8 |
| 4 | Dinâmicas de Turma (🛡️) | student | 7 |
| 5 | Conselho dos Mestres (🧙) | professor | 12 |

Total: **48 decretos**, números contínuos por categoria.

## Características de produto que parecem bugs, mas são intenção

- **Check-in demora ~5s** (`waitForRoyalVerification`): efeito dramático de
  "verificação real". Não remover nem acelerar sem avisar.
- **Reusar nome de outro navegador → 409**: o nome é "inesgotável" por design;
  uma só pessoa por nome.
- **Professores são soft-deleted**; **participantes são deletados fisicamente** (com
  expurgo de votos). Semânticas diferentes de propósito.
- **Não há telas além de uma SPA única**: check-in (modal), arena de votação e painel
  admin/telão — tudo em `App.jsx` com modais/dashboards condicionais.

## Fontes de verdade deste doc

- `README.md` (raiz) — visão de marketing/deploy.
- `frontend/src/App.jsx` — composição das telas/modais.
- `backend/src/data/questionsData.js` — os 48 decretos e as 5 categorias.