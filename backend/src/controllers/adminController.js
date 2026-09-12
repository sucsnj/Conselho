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
  },

  updateParticipant: (req, res) => {
    try {
      const { id } = req.params;
      const { name, title } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'O nome do combatente não pode ser vazio!' });
      }

      const cleanName = name.trim();
      const cleanTitle = title && title.trim() ? title.trim() : 'Guerreiro(a) da Corte';

      const existing = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Combatente não encontrado nos anais da Corte.' });
      }

      // Checar se já existe outro participante com o novo nome
      const duplicate = db.prepare('SELECT id FROM participants WHERE name = ? COLLATE NOCASE AND id != ?').get(cleanName, id);
      if (duplicate) {
        return res.status(400).json({ error: 'Já existe outro combatente com este nome na Corte!' });
      }

      const oldName = existing.name;

      // Atualização atômica do participante e dos votos recebidos
      const updateTransaction = db.transaction(() => {
        db.prepare('UPDATE participants SET name = ?, title = ? WHERE id = ?').run(cleanName, cleanTitle, id);
        if (oldName !== cleanName) {
          db.prepare('UPDATE votes SET voted_for_name = ? WHERE voted_for_name = ?').run(cleanName, oldName);
        }
      });

      updateTransaction();

      const updated = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);

      return res.json({
        message: `Combatente renomeado com sucesso para ${cleanName}!`,
        participant: updated
      });
    } catch (error) {
      console.error('Erro ao renomear combatente:', error);
      return res.status(500).json({ error: 'Erro ao renomear combatente no Cofre Real.' });
    }
  },

  deleteParticipant: (req, res) => {
    try {
      const { id } = req.params;

      const existing = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Combatente não encontrado nos anais da Corte.' });
      }

      const participantName = existing.name;

      // Expurgo atômico: votos emitidos por ele, votos recebidos por ele e o próprio participante
      const expungeTransaction = db.transaction(() => {
        db.prepare('DELETE FROM votes WHERE voted_for_name = ?').run(participantName);
        db.prepare('DELETE FROM votes WHERE voter_id = ?').run(id);
        db.prepare('DELETE FROM participants WHERE id = ?').run(id);
      });

      expungeTransaction();

      return res.json({
        message: `Combatente ${participantName} foi expurgado da Corte e seus votos foram removidos!`,
        id: Number(id)
      });
    } catch (error) {
      console.error('Erro ao expurgar combatente:', error);
      return res.status(500).json({ error: 'Erro ao expurgar combatente no Cofre Real.' });
    }
  },

  updateProfessor: (req, res) => {
    try {
      const { id } = req.params;
      const { name, subject } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'O nome do mestre não pode ser vazio!' });
      }

      const cleanName = name.trim();
      const cleanSubject = subject && subject.trim() ? subject.trim() : 'Disciplina da Corte';

      const existing = db.prepare('SELECT * FROM professors WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mestre não encontrado no Conselho.' });
      }

      const oldName = existing.name;

      const updateTransaction = db.transaction(() => {
        db.prepare('UPDATE professors SET name = ?, subject = ? WHERE id = ?').run(cleanName, cleanSubject, id);
        if (oldName !== cleanName) {
          db.prepare('UPDATE votes SET voted_for_name = ? WHERE voted_for_name = ?').run(cleanName, oldName);
        }
      });

      updateTransaction();

      const updated = db.prepare('SELECT * FROM professors WHERE id = ?').get(id);

      return res.json({
        message: `Mestre renomeado para ${cleanName}!`,
        professor: updated
      });
    } catch (error) {
      console.error('Erro ao atualizar mestre:', error);
      return res.status(500).json({ error: 'Erro ao atualizar mestre no Conselho.' });
    }
  },

  deleteProfessor: (req, res) => {
    try {
      const { id } = req.params;

      const existing = db.prepare('SELECT * FROM professors WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mestre não encontrado no Conselho.' });
      }

      const profName = existing.name;

      const expungeTransaction = db.transaction(() => {
        db.prepare('DELETE FROM votes WHERE voted_for_name = ?').run(profName);
        db.prepare('UPDATE professors SET is_active = 0 WHERE id = ?').run(id);
      });

      expungeTransaction();

      return res.json({
        message: `Mestre ${profName} foi expurgado do Conselho ativo!`,
        id: Number(id)
      });
    } catch (error) {
      console.error('Erro ao expurgar mestre:', error);
      return res.status(500).json({ error: 'Erro ao expurgar mestre.' });
    }
  }
};

module.exports = adminController;
