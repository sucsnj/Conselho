# ⚔️ A Corte de ADS - Votação da Turma Medieval 👑

Aplicação web completa estilo "Amigo de Merda / Votação da Turma" com temática medieval imersiva, desenvolvida especialmente para a festa de encerramento do curso de Análise e Desenvolvimento de Sistemas (ADS).

---

## 🌟 Funcionalidades Principais

1. **👥 Alistamento Dinâmico (Check-in Real)**:
   - Quando os formandos chegam à festa, acessam o link e digitam seu nome e título medieval.
   - **Regra de Ouro Implementada:** As opções de voto para todos os decretos de alunos (Categorias 1 a 4) são formadas **exclusivamente pelos participantes que fizeram check-in**. Quem não for à festa simplesmente não aparece nas votações!
   - Polling suave automático atualiza a lista de opções conforme novos participantes chegam e se alistam.

2. **📜 48 Decretos Reais em 5 Categorias**:
   - **👑 Categoria 1: Perguntas Gerais da Corte (Alunos)** (10 perguntas)
   - **💻 Categoria 2: O Caos do Código e Desenvolvimento** (11 perguntas)
   - **🎤 Categoria 3: Apresentações e Lábias Acadêmicas** (8 perguntas)
   - **🛡️ Categoria 4: Dinâmicas de Turma e Sobrevivência** (7 perguntas)
   - **🧙 Categoria 5: Conselho dos Mestres (Professores)** (12 perguntas)

3. **🏛️ Cofre da Coroa & Modo Cerimônia (Telão da Festa)**:
   - Painel de apuração protegido por PIN (padrão: `1234`).
   - Apuração em tempo real com pódio (1º, 2º e 3º lugares) e porcentagens.
   - **Modo Cerimônia / Apresentação**: Tela cheia especial pensada para o projetor/TV da festa! O apresentador clica em "Revelar Escolhido da Corte" e os vencedores surgem com suspense, animação e chuva de confetes dourados. Suporte a setas do teclado (← e →) para passar as perguntas.

---

## 📁 Estrutura do Projeto

```
ads/
├── backend/                  # Servidor Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middlewares/
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── README.md             # Instruções de Deploy (Render / Railway)
│
├── frontend/                 # Aplicação React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   ├── context/CourtContext.jsx
│   │   ├── pages/VotingArena.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vercel.json
│   ├── package.json
│   └── README.md             # Instruções de Deploy (Vercel / Netlify)
│
└── README.md
```

---

## ⚡ Como Rodar Localmente

### 1. Iniciar o Backend:
```bash
cd backend
npm install
npm start
```
O servidor iniciará em `http://localhost:5000`.

### 2. Iniciar o Frontend:
Abra outro terminal:
```bash
cd frontend
npm install
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.

---

## 🚀 Instruções de Deploy Independente

- **Backend no Render**: Consulte o [backend/README.md](backend/README.md) para o passo a passo com variáveis de ambiente.
- **Frontend na Vercel ou Netlify**: Consulte o [frontend/README.md](frontend/README.md) com as configurações de SPA e URL de API.
