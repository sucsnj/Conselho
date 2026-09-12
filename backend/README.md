# 🏰 Backend - A Corte de ADS (API Medieval)

Servidor Node.js + Express com banco de dados SQLite persistente para o aplicativo de votação da turma de ADS.

---

## ⚙️ Variáveis de Ambiente (`.env`)

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo Padrão |
|----------|-----------|----------------|
| `PORT` | Porta do servidor HTTP | `5000` |
| `ADMIN_PIN` | PIN secreto para o Cofre da Coroa (Admin) | `1234` |
| `CORS_ORIGIN` | URL permitida do frontend (ou `*` para todas) | `http://localhost:5173` |
| `DB_PATH` | (Opcional) Caminho customizado para o arquivo SQLite | `./data/court.db` |

---

## 🚀 Como Rodar Localmente

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   # ou para desenvolvimento com live-reload:
   npm run dev
   ```
4. A API estará pronta em `http://localhost:5000`.

---

## 🌐 Deploy no Render / Railway

### Opção 1: Deploy no Render (Web Service Gratuito)
1. Crie uma nova conta em [render.com](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte seu repositório Git.
4. Defina as configurações do serviço:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Em **Environment Variables**, adicione:
   - `ADMIN_PIN`: Escolha um PIN seguro (ex: `corteADS2024`)
   - `CORS_ORIGIN`: `*` (ou a URL do seu frontend na Vercel/Netlify)
   - `NODE_ENV`: `production`
6. (Opcional mas recomendado para persistência permanente entre reinicializações de instâncias gratuitas): Adicione um **Disk** montado em `/opt/render/project/src/backend/data` ou configure `DB_PATH`.
7. Clique em **Deploy Web Service** e copie a URL gerada (ex: `https://corte-ads-backend.onrender.com`).

---

## 📜 Endpoints da API

- `POST /api/checkin`: Realiza o alistamento do combatente (`{ name, title, session_token? }`). O primeiro check-in vincula o nome ao navegador; para retornar com o mesmo nome, envie o `session_token` salvo pelo cliente. Outro navegador recebe `409`.
- `GET /api/participants`: Lista todos os participantes que já fizeram check-in.
- `GET /api/questions`: Lista todas as 48 perguntas separadas por categoria.
- `GET /api/categories`: Lista as 5 categorias e quantidade de perguntas.
- `GET /api/professors`: Lista mestres pré-cadastrados ou criados.
- `POST /api/professors`: Cadastra novo mestre.
- `POST /api/votes`: Registra ou atualiza um voto (`{ voter_id, question_id, voted_for_name, session_token }`).
- `GET /api/votes/my/:voterId`: Retorna os votos daquele participante usando o header `x-participant-token`.
- `GET /api/admin/results`: Apuração consolidada de votos com pódio e porcentagens (requer header `x-admin-pin`).
- `POST /api/admin/reset-votes`: Limpa todos os votos (requer header `x-admin-pin`).
- `POST /api/admin/reset-all`: Reinicia todos os dados (requer header `x-admin-pin`).
