require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

const participantController = require('./controllers/participantController');
const questionController = require('./controllers/questionController');
const professorController = require('./controllers/professorController');
const voteController = require('./controllers/voteController');
const adminController = require('./controllers/adminController');
const { authMiddleware } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração de CORS permissiva para desenvolvimento e deploy
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : (origin, callback) => {
    // Permitir requisições sem origin (como mobile apps ou curl) ou se bater com a permitida
    if (!origin || allowedOrigin.split(',').map(o => o.trim()).includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback amigável para evitar bloqueios em testes
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-pin']
}));

app.use(express.json());

// ─── ROTAS DA CORTE ────────────────────────────────────────────────────────────

// Status da corte / health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', realm: 'Corte de ADS', timestamp: new Date().toISOString() });
});

// Alistamento / Participantes
app.post('/api/checkin', participantController.checkIn);
app.get('/api/participants', participantController.getAll);
app.get('/api/participants/:id', participantController.getById);
app.get('/api/titles', participantController.getTitles);

// Perguntas e Categorias
app.get('/api/questions', questionController.getAll);
app.get('/api/categories', questionController.getCategories);
app.get('/api/questions/:id', questionController.getById);

// Conselho dos Mestres (Professores)
app.get('/api/professors', professorController.getAll);
app.post('/api/professors', professorController.create);
app.delete('/api/professors/:id', professorController.delete);

// Votação
app.post('/api/votes', voteController.submitVote);
app.get('/api/votes/my/:voterId', voteController.getMyVotes);
app.get('/api/votes/stats', voteController.getStats);

// Cofre da Coroa (Administração)
app.post('/api/admin/verify', authMiddleware, adminController.verifyPin);
app.get('/api/admin/results', authMiddleware, adminController.getResults);
app.post('/api/admin/reset-votes', authMiddleware, adminController.resetVotes);
app.post('/api/admin/reset-all', authMiddleware, adminController.resetAll);

// Inicializar banco de dados e subir servidor
try {
  initializeDatabase();
  app.listen(PORT, () => {
    console.log(`⚔️ 👑 A Corte de ADS ergueu seus estandartes na porta ${PORT}!`);
    console.log(`🛡️  URL do Backend: http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('❌ Falha ao iniciar a Corte Real:', err);
  process.exit(1);
}
