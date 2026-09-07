const { db } = require('../config/database');
const { QUESTIONS, CATEGORIES } = require('../data/questionsData');

const adminController = {
  verifyPin: (req, res) => {
    // Se passou pelo authMiddleware, o PIN é válido
    return res.json({ success: true, message: 'Acesso concedido ao Cofre Real!' });
  },

  getResults: (req, res) => {
    try {
      // 1. Obter todos os votos agrupados por questão e por candidato
      const voteAggregates = db.prepare(`
        SELECT question_id, voted_for_name, COUNT(*) as vote_count
        FROM votes
        GROUP BY question_id, voted_for_name
        ORDER BY question_id ASC, vote_count DESC
      `).all();

      // Total de votantes que participaram
      const totalParticipants = db.prepare('SELECT COUNT(*) as c FROM participants').get().c;
      const totalVotesCast = db.prepare('SELECT COUNT(*) as c FROM votes').get().c;

      // Montar mapa de resultados por question_id
      const resultsByQuestion = {};

      QUESTIONS.forEach(q => {
        resultsByQuestion[q.id] = {
          question: q,
          total_votes: 0,
          ranking: []
        };
      });

      voteAggregates.forEach(row => {
        if (resultsByQuestion[row.question_id]) {
          resultsByQuestion[row.question_id].total_votes += row.vote_count;
          resultsByQuestion[row.question_id].ranking.push({
            name: row.voted_for_name,
            votes: row.vote_count,
            percentage: 0 // será calculado abaixo
          });
        }
      });

      // Calcular porcentagens e pódio para cada questão
      Object.values(resultsByQuestion).forEach(item => {
        const total = item.total_votes;
        item.ranking.forEach((candidate, index) => {
          candidate.percentage = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
          candidate.position = index + 1;
        });

        // Vencedor(es) (pode haver empate)
        if (item.ranking.length > 0) {
          const maxVotes = item.ranking[0].votes;
          item.winners = item.ranking.filter(c => c.votes === maxVotes);
        } else {
          item.winners = [];
        }
      });

      // Agrupar resultados por categoria
      const resultsByCategory = CATEGORIES.map(category => {
        const categoryQuestions = QUESTIONS
          .filter(q => q.category_id === category.id)
          .map(q => resultsByQuestion[q.id]);

        return {
          category,
          questions: categoryQuestions
        };
      });

      return res.json({
        summary: {
          totalParticipants,
          totalVotesCast,
          totalQuestions: QUESTIONS.length
        },
        resultsByCategory,
        resultsByQuestion
      });
    } catch (error) {
      console.error('Erro ao calcular apuração da Corte:', error);
      return res.status(500).json({ error: 'Erro ao abrir os cofres de apuração real.' });
    }
  },

  resetVotes: (req, res) => {
    try {
      db.prepare('DELETE FROM votes').run();
      return res.json({ message: 'Todos os votos foram expurgados dos registros reais!' });
    } catch (error) {
      console.error('Erro ao resetar votos:', error);
      return res.status(500).json({ error: 'Erro ao limpar votos.' });
    }
  },

  resetAll: (req, res) => {
    try {
      db.prepare('DELETE FROM votes').run();
      db.prepare('DELETE FROM participants').run();
      return res.json({ message: 'Corte reiniciada por completo! Nova sessão pronta.' });
    } catch (error) {
      console.error('Erro ao reiniciar corte:', error);
      return res.status(500).json({ error: 'Erro ao reiniciar o Reino.' });
    }
  }
};

module.exports = adminController;
