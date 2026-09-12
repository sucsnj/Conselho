const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/court.db');

// Garantir que o diretório existe
const fs = require('fs');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Habilitar WAL mode para performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      title TEXT NOT NULL DEFAULT 'Guerreiro(a) da Corte',
      session_token_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS professors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_preset INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      voted_for_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (voter_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(voter_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      number INTEGER,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'student',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS session_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migração para bancos criados antes da identificação por navegador.
  const participantColumns = db.prepare('PRAGMA table_info(participants)').all();
  if (!participantColumns.some(column => column.name === 'session_token_hash')) {
    db.exec('ALTER TABLE participants ADD COLUMN session_token_hash TEXT');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_token ON participants(session_token_hash) WHERE session_token_hash IS NOT NULL');

  // Configuração padrão de sessão
  const sessionActive = db.prepare("SELECT value FROM session_config WHERE key = 'session_active'").get();
  if (!sessionActive) {
    db.prepare("INSERT INTO session_config (key, value) VALUES ('session_active', '1')").run();
  }

  // Inserir categorias e decretos pré-cadastrados se ainda não existem
  const categoriesCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (categoriesCount === 0) {
    const { CATEGORIES, QUESTIONS } = require('../data/questionsData');
    const insertCat = db.prepare('INSERT INTO categories (id, name, emoji, description) VALUES (?, ?, ?, ?)');
    const catTx = db.transaction(() => {
      CATEGORIES.forEach(cat => {
        insertCat.run(cat.id, cat.name, cat.emoji, cat.description);
      });
    });
    catTx();

    const insertQuestion = db.prepare('INSERT INTO questions (id, category_id, number, title, subtitle, target_type, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)');
    const qTx = db.transaction(() => {
      QUESTIONS.forEach(q => {
        insertQuestion.run(q.id, q.category_id, q.number, q.title, q.subtitle, q.target_type || 'student');
      });
    });
    qTx();
    console.log('📜 48 Decretos Reais e 5 Categorias inicializados no banco de dados!');
  }

  // Inserir professores pré-cadastrados se ainda não existem
  const { insertDefaultProfessors } = require('../data/defaultProfessors');
  insertDefaultProfessors(db);

  console.log('🏰 Banco de dados inicializado com sucesso!');
}

module.exports = { db, initializeDatabase };
