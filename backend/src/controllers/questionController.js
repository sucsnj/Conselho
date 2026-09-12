const { db } = require('../config/database');

const questionController = {
  getAll: (req, res) => {
    try {
      const { category_id } = req.query;

      let query = `
        SELECT q.id, q.category_id, q.number, q.title, q.subtitle, q.target_type, q.is_active,
               c.name as category_name, c.emoji as category_emoji
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.is_active = 1
      `;
      const params = [];

      if (category_id) {
        query += ' AND q.category_id = ?';
        params.push(Number(category_id));
      }

      query += ' ORDER BY q.category_id ASC, q.number ASC, q.id ASC';

      const questions = db.prepare(query).all(...params);
      const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();

      return res.json({
        total: questions.length,
        categories,
        questions
      });
    } catch (error) {
      console.error('Erro ao listar perguntas:', error);
      return res.status(500).json({ error: 'Erro ao resgatar os decretos da Corte.' });
    }
  },

  getCategories: (req, res) => {
    try {
      const categories = db.prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM questions q WHERE q.category_id = c.id AND q.is_active = 1) as questionCount
        FROM categories c
        ORDER BY c.id ASC
      `).all();

      return res.json({ categories });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ error: 'Erro ao consultar os tomos da Corte.' });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const question = db.prepare(`
        SELECT q.*, c.name as category_name, c.emoji as category_emoji
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = ? AND q.is_active = 1
      `).get(id);

      if (!question) {
        return res.status(404).json({ error: 'Decreto real não encontrado.' });
      }

      return res.json({ question });
    } catch (error) {
      console.error('Erro ao buscar pergunta:', error);
      return res.status(500).json({ error: 'Erro ao consultar decreto.' });
    }
  }
};

module.exports = questionController;
