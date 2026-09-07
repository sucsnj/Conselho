# 🛡️ Frontend - A Corte de ADS (Aplicação Web Medieval)

Interface web interativa, responsiva e com temática medieval para a festa de formatura de ADS.

---

## ⚙️ Variáveis de Ambiente (`.env`)

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL base do servidor backend | `http://localhost:5000` (local) ou `https://seu-backend.onrender.com` (produção) |

---

## 🚀 Como Rodar Localmente

1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor Vite:
   ```bash
   npm run dev
   ```
4. Acesse pelo navegador em `http://localhost:5173`.

---

## 🌐 Deploy no Vercel (Recomendado)

1. Acesse [vercel.com](https://vercel.com) e conecte seu repositório Git.
2. Ao importar o projeto, configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: URL do seu backend no Render (ex: `https://corte-ads-backend.onrender.com`)
4. Clique em **Deploy**! O arquivo `vercel.json` já está configurado para roteamento SPA sem erros de 404.

---

## 🌐 Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com) e clique em **Add new site** -> **Import an existing project**.
2. Conecte seu repositório e configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Em **Environment variables**, adicione:
   - `VITE_API_URL`: URL do seu backend no Render.
4. Clique em **Deploy site**! O arquivo `_redirects` já está configurado na pasta `public/`.
