const { db } = require('../config/database');

const voteController = {
  submitVote: (req, res) => {
    try {
      const { voter_id, question_id, voted_for_name } = req.body;

      if (!voter_id || !question_id || !voted_for_name) {
        return res.status(400).json({ error: 'Combatente, questão e voto são obrigatórios!' });
      }

      // Validar existência do participante votante
      const voter = db.prepare('SELECT * FROM participants WHERE id = ?').get(voter_id);
      if (!voter) {
        return res.status(404).json({ error: 'Combatente votante não identificado nos registros.' });
      }

      // Validar questão no banco dinâmico
      const question = db.prepare('SELECT * FROM questions WHERE id = ? AND is_active = 1').get(Number(question_id));
      if (!question) {
        return res.status(404).json({ error: 'Decreto/pergunta inexistente.' });
      }

      const cleanVotedFor = voted_for_name.trim();

      // Inserir ou atualizar voto (Upsert no SQLite)
      const upsert = db.prepare(`
        INSERT INTO votes (voter_id, question_id, voted_for_name, created_at)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT(voter_id, question_id)
        DO UPDATE SET voted_for_name = excluded.voted_for_name,
                      created_at = datetime('now', 'localtime')
      `);

      upsert.run(voter_id, Number(question_id), cleanVotedFor);

      // Obter total de votos já realizados por esse combatente
      const progress = db.prepare('SELECT COUNT(*) as voted_count FROM votes WHERE voter_id = ?').get(voter_id);
      const totalQuestions = db.prepare('SELECT COUNT(*) as c FROM questions WHERE is_active = 1').get().c;

      return res.json({
        message: 'Voto selado pela Coroa com sucesso!',
        voter_id,
        question_id: Number(question_id),
        voted_for_name: cleanVotedFor,
        voted_count: progress.voted_count,
        total_questions: totalQuestions
      });
    } catch (error) {
      console.error('Erro ao registrar voto:', error);
      return res.status(500).json({ error: 'Falha ao registrar seu selo nos anais da Corte.' });
    }
  },

  getMyVotes: (req, res) => {
    try {
      const { voterId } = req.params;

      const votes = db.prepare(`
        SELECT question_id, voted_for_name, created_at
        FROM votes
        WHERE voter_id = ?
      `).all(voterId);

      // Mapear { [question_id]: voted_for_name }
      const voteMap = {};
      votes.forEach(v => {
        voteMap[v.question_id] = v.voted_for_name;
      });

      return res.json({
        voter_id: Number(voterId),
        total_voted: votes.length,
        votes: voteMap
      });
    } catch (error) {
      console.error('Erro ao buscar votos do combatente:', error);
      return res.status(500).json({ error: 'Erro ao resgatar pergaminhos de voto.' });
    }
  },

  getStats: (req, res) => {
    try {
      const totalParticipants = db.prepare('SELECT COUNT(*) as c FROM participants').get().c;
      const totalVotes = db.prepare('SELECT COUNT(*) as c FROM votes').get().c;
      const activeVoters = db.prepare('SELECT COUNT(DISTINCT voter_id) as c FROM votes').get().c;
      const totalQuestions = db.prepare('SELECT COUNT(*) as c FROM questions WHERE is_active = 1').get().c;

      return res.json({
        totalParticipants,
        totalVotes,
        activeVoters,
        totalQuestions,
        potentialVotes: totalParticipants * totalQuestions
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao consultar o censo do Reino.' });
    }
  }
};

module.exports = voteController;
