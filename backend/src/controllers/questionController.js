const { QUESTIONS, CATEGORIES } = require('../data/questionsData');

const questionController = {
  getAll: (req, res) => {
    try {
      const { category_id } = req.query;

      let filtered = QUESTIONS;
      if (category_id) {
        filtered = QUESTIONS.filter(q => q.category_id === Number(category_id));
      }

      return res.json({
        total: filtered.length,
        categories: CATEGORIES,
        questions: filtered
      });
    } catch (error) {
      console.error('Erro ao listar perguntas:', error);
      return res.status(500).json({ error: 'Erro ao resgatar os decretos da Corte.' });
    }
  },

  getCategories: (req, res) => {
    try {
      const categoriesWithCount = CATEGORIES.map(cat => ({
        ...cat,
        questionCount: QUESTIONS.filter(q => q.category_id === cat.id).length
      }));

      return res.json({ categories: categoriesWithCount });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ error: 'Erro ao consultar os tomos da Corte.' });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const question = QUESTIONS.find(q => q.id === Number(id));

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
