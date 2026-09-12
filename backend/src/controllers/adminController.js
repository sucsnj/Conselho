const { db } = require('../config/database');

const adminController = {
  verifyPin: (req, res) => {
    // Se passou pelo authMiddleware, o PIN é válido
    return res.json({ success: true, message: 'Acesso concedido ao Cofre Real!' });
  },

  getResults: (req, res) => {
    try {
      // 1. Obter perguntas e categorias ativas do banco
      const activeQuestions = db.prepare(`
        SELECT q.id, q.category_id, q.number, q.title, q.subtitle, q.target_type, q.is_active,
               c.name as category_name, c.emoji as category_emoji
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.is_active = 1
        ORDER BY q.category_id ASC, q.number ASC, q.id ASC
      `).all();

      const activeCategories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();

      // 2. Obter todos os votos agrupados por questão e por candidato
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

      activeQuestions.forEach(q => {
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
      const resultsByCategory = activeCategories.map(category => {
        const categoryQuestions = activeQuestions
          .filter(q => q.category_id === category.id)
          .map(q => resultsByQuestion[q.id])
          .filter(Boolean);

        return {
          category,
          questions: categoryQuestions
        };
      });

      return res.json({
        summary: {
          totalParticipants,
          totalVotesCast,
          totalQuestions: activeQuestions.length
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
  },

  createQuestion: (req, res) => {
    try {
      const { title, subtitle, category_id, target_type } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'O título do decreto é obrigatório!' });
      }
      if (!subtitle || !subtitle.trim()) {
        return res.status(400).json({ error: 'O subtítulo do decreto é obrigatório!' });
      }
      if (!category_id) {
        return res.status(400).json({ error: 'A categoria do decreto é obrigatória!' });
      }

      const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
      if (!cat) {
        return res.status(400).json({ error: 'Categoria informada não existe.' });
      }

      // Próximo número do decreto para ordenação
      const maxNumRow = db.prepare('SELECT MAX(number) as m FROM questions WHERE category_id = ?').get(category_id);
      const nextNumber = (maxNumRow && maxNumRow.m) ? maxNumRow.m + 1 : 1;
      const cleanTarget = target_type === 'professor' ? 'professor' : 'student';

      const insert = db.prepare(`
        INSERT INTO questions (category_id, number, title, subtitle, target_type, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(category_id, nextNumber, title.trim(), subtitle.trim(), cleanTarget);

      const newQuestion = db.prepare(`
        SELECT q.*, c.name as category_name, c.emoji as category_emoji
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
      `).get(insert.lastInsertRowid);

      return res.status(201).json({
        message: 'Novo decreto proclamado com sucesso perante a Corte!',
        question: newQuestion
      });
    } catch (error) {
      console.error('Erro ao criar decreto:', error);
      return res.status(500).json({ error: 'Erro ao proclamar novo decreto real.' });
    }
  },

  updateQuestion: (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, category_id, target_type } = req.body;

      const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Decreto real não encontrado.' });
      }

      const cleanTitle = title && title.trim() ? title.trim() : existing.title;
      const cleanSubtitle = subtitle && subtitle.trim() ? subtitle.trim() : existing.subtitle;
      const cleanCategory = category_id ? Number(category_id) : existing.category_id;
      const cleanTarget = target_type ? (target_type === 'professor' ? 'professor' : 'student') : existing.target_type;

      db.prepare(`
        UPDATE questions
        SET title = ?, subtitle = ?, category_id = ?, target_type = ?
        WHERE id = ?
      `).run(cleanTitle, cleanSubtitle, cleanCategory, cleanTarget, id);

      const updated = db.prepare(`
        SELECT q.*, c.name as category_name, c.emoji as category_emoji
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
      `).get(id);

      return res.json({
        message: 'Decreto real atualizado com sucesso nos anais da Corte!',
        question: updated
      });
    } catch (error) {
      console.error('Erro ao atualizar decreto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar decreto real.' });
    }
  },

  deleteQuestion: (req, res) => {
    try {
      const { id } = req.params;

      const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Decreto real não encontrado.' });
      }

      // Transação para remover os votos vinculados a este decreto e o decreto em si
      const deleteTx = db.transaction(() => {
        db.prepare('DELETE FROM votes WHERE question_id = ?').run(id);
        db.prepare('DELETE FROM questions WHERE id = ?').run(id);
      });

      deleteTx();

      return res.json({
        message: `Decreto #${existing.number} (${existing.title}) foi expurgado da Corte e seus votos removidos!`,
        id: Number(id)
      });
    } catch (error) {
      console.error('Erro ao excluir decreto:', error);
      return res.status(500).json({ error: 'Erro ao excluir decreto real.' });
    }
  }
};

module.exports = adminController;
