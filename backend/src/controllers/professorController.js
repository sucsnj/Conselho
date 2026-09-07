const { db } = require('../config/database');

const professorController = {
  getAll: (req, res) => {
    try {
      const professors = db.prepare(`
        SELECT id, name, subject, is_preset, created_at
        FROM professors
        WHERE is_active = 1
        ORDER BY name ASC
      `).all();

      return res.json({
        total: professors.length,
        professors
      });
    } catch (error) {
      console.error('Erro ao listar mestres:', error);
      return res.status(500).json({ error: 'Erro ao consultar o Conselho dos Mestres.' });
    }
  },

  create: (req, res) => {
    try {
      const { name, subject } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome do mestre/professor é obrigatório!' });
      }

      const cleanName = name.trim();
      const cleanSubject = subject && subject.trim() ? subject.trim() : 'Disciplina da Corte';

      const existing = db.prepare('SELECT * FROM professors WHERE name = ? COLLATE NOCASE').get(cleanName);
      if (existing) {
        if (!existing.is_active) {
          db.prepare('UPDATE professors SET is_active = 1, subject = ? WHERE id = ?').run(cleanSubject, existing.id);
        }
        return res.json({
          message: 'Mestre já registrado no Conselho!',
          professor: existing
        });
      }

      const result = db.prepare('INSERT INTO professors (name, subject, is_active, is_preset) VALUES (?, ?, 1, 0)')
        .run(cleanName, cleanSubject);

      const newProf = db.prepare('SELECT * FROM professors WHERE id = ?').get(result.lastInsertRowid);

      return res.status(201).json({
        message: 'Mestre consagrado perante o Conselho!',
        professor: newProf
      });
    } catch (error) {
      console.error('Erro ao cadastrar mestre:', error);
      return res.status(500).json({ error: 'Falha ao incluir mestre no Conselho.' });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('UPDATE professors SET is_active = 0 WHERE id = ?').run(id);
      return res.json({ message: 'Mestre removido do Conselho ativo.' });
    } catch (error) {
      console.error('Erro ao remover mestre:', error);
      return res.status(500).json({ error: 'Erro ao remover mestre.' });
    }
  }
};

module.exports = professorController;
