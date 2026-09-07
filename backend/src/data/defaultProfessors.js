const DEFAULT_PROFESSORS = [
  { name: 'Prof. Sem Nome 1', subject: 'A definir', is_preset: 1 },
  { name: 'Prof. Sem Nome 2', subject: 'A definir', is_preset: 1 },
  { name: 'Prof. Sem Nome 3', subject: 'A definir', is_preset: 1 },
];

function insertDefaultProfessors(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM professors WHERE is_preset = 1').get();
  if (count.c === 0) {
    const insert = db.prepare('INSERT INTO professors (name, subject, is_active, is_preset) VALUES (?, ?, 1, 1)');
    for (const prof of DEFAULT_PROFESSORS) {
      insert.run(prof.name, prof.subject);
    }
    console.log('👨‍🏫 Professores padrão inseridos. Edite-os via API ou pelo arquivo defaultProfessors.js.');
  }
}

module.exports = { DEFAULT_PROFESSORS, insertDefaultProfessors };
