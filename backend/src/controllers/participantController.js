const { db } = require('../config/database');

const TITLES = [
  'O Cavaleiro das 23h59',
  'A Feiticeira do CSS',
  'O Mago Supremo do Backend',
  'O Arauto do Commit Forçado',
  'O Paladino do StackOverflow',
  'A Arquimaga do Banco de Dados',
  'O Caçador de Red Flags',
  'O Bobo Oficial da Corte',
  'O Destruidor de Ambientes',
  'O Menestrel do PowerPoint',
  'A Guardiã dos Pull Requests',
  'O Alquimista de Bugs',
  'O Lorde do Na Minha Máquina Funciona'
];

function getRandomTitle() {
  return TITLES[Math.floor(Math.random() * TITLES.length)];
}

const participantController = {
  checkIn: (req, res) => {
    try {
      const { name, title } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'O nome de combatente é obrigatório para alistar-se!' });
      }

      const cleanName = name.trim();
      const assignedTitle = (title && title.trim()) ? title.trim() : getRandomTitle();

      // Verificar se o combatente já existe
      const existing = db.prepare('SELECT * FROM participants WHERE name = ? COLLATE NOCASE').get(cleanName);

      if (existing) {
        // Se já existe, atualiza o título caso tenha sido passado um novo
        if (title && title.trim()) {
          db.prepare('UPDATE participants SET title = ? WHERE id = ?').run(assignedTitle, existing.id);
          existing.title = assignedTitle;
        }
        return res.json({
          message: 'Combatente reconvocado à Corte Real!',
          participant: existing,
          isNew: false
        });
      }

      // Inserir novo participante
      const result = db.prepare('INSERT INTO participants (name, title) VALUES (?, ?)').run(cleanName, assignedTitle);
      const newParticipant = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid);

      return res.status(201).json({
        message: 'Alistamento real realizado com honras!',
        participant: newParticipant,
        isNew: true
      });
    } catch (error) {
      console.error('Erro no check-in:', error);
      return res.status(500).json({ error: 'Erro nos pergaminhos da Corte ao alistar combatente.' });
    }
  },

  getAll: (req, res) => {
    try {
      const participants = db.prepare(`
        SELECT p.id, p.name, p.title, p.created_at,
          (SELECT COUNT(*) FROM votes WHERE voter_id = p.id) as total_votes_cast
        FROM participants p
        ORDER BY p.name ASC
      `).all();

      return res.json({
        total: participants.length,
        participants
      });
    } catch (error) {
      console.error('Erro ao listar participantes:', error);
      return res.status(500).json({ error: 'Falha ao consultar os registros da Corte.' });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);

      if (!participant) {
        return res.status(404).json({ error: 'Combatente não encontrado nos anais da Corte.' });
      }

      return res.json({ participant });
    } catch (error) {
      console.error('Erro ao buscar participante:', error);
      return res.status(500).json({ error: 'Erro ao consultar combatente.' });
    }
  },

  getTitles: (req, res) => {
    return res.json({ titles: TITLES });
  }
};

module.exports = participantController;
