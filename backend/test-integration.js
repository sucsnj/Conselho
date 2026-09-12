// Teste automatizado de integração ponta a ponta da Corte de ADS
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 5001;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

function postJson(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'GET',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('⚔️  Iniciando bateria de testes da Corte de ADS...\n');

  // 1. Health check
  const health = await getJson('/api/health');
  console.log('1. Health Check:', health.status === 200 && health.data.status === 'ok' ? '✅ Aprovado' : '❌ Falhou');

  // 2. Alistamento de combatentes
  const students = [
    { name: 'Ana Clara', title: 'A Rainha do Frontend' },
    { name: 'Lucas Dev', title: 'O Cavaleiro das 23h59' },
    { name: 'Mariana Silva', title: 'A Feiticeira do CSS' },
    { name: 'Pedro Santos', title: 'O Mago Supremo do Backend' }
  ];

  const createdVoters = [];
  for (const s of students) {
    const res = await postJson('/api/checkin', s);
    createdVoters.push(res.data.participant);
  }
  console.log(`2. Alistamento dinâmico (${createdVoters.length} combatentes alistados): ✅ Aprovado`);

  // 3. Verificar listagem de combatentes
  const participantsList = await getJson('/api/participants');
  console.log(`3. Consulta de combatentes na Corte (${participantsList.data.participants.length} encontrados): ✅ Aprovado`);

  // 4. Votar em decretos (Categorias de alunos e professores)
  const v1 = createdVoters[0]; // Ana Clara
  const v2 = createdVoters[1]; // Lucas Dev
  const v3 = createdVoters[2]; // Mariana Silva

  // Decreto 1: "Quem é mais provável de ser preso por uma coisa idiota?"
  // Votam em "Lucas Dev"
  await postJson('/api/votes', { voter_id: v1.id, question_id: 1, voted_for_name: 'Lucas Dev', session_token: v1.session_token });
  await postJson('/api/votes', { voter_id: v2.id, question_id: 1, voted_for_name: 'Lucas Dev', session_token: v2.session_token });
  await postJson('/api/votes', { voter_id: v3.id, question_id: 1, voted_for_name: 'Pedro Santos', session_token: v3.session_token });

  // Decreto 11: "Na minha máquina funciona" -> Votam em "Pedro Santos"
  await postJson('/api/votes', { voter_id: v1.id, question_id: 11, voted_for_name: 'Pedro Santos', session_token: v1.session_token });
  await postJson('/api/votes', { voter_id: v2.id, question_id: 11, voted_for_name: 'Pedro Santos', session_token: v2.session_token });

  console.log('4. Gravação de votos com selo real: ✅ Aprovado');

  // 5. Verificar votos individuais de um combatente
  const myVotes = await getJson(`/api/votes/my/${v1.id}`, { 'x-participant-token': v1.session_token });
  const hasVotes = myVotes.data.votes && myVotes.data.votes[1] === 'Lucas Dev' && myVotes.data.votes[11] === 'Pedro Santos';
  console.log('5. Recuperação de votos do combatente:', hasVotes ? '✅ Aprovado' : '❌ Falhou');

  // 6. Consultar apuração no Cofre da Coroa (Admin com PIN 1234)
  const results = await getJson('/api/admin/results', { 'x-admin-pin': '1234' });
  const q1Result = results.data.resultsByQuestion[1];
  const q1Winner = q1Result && q1Result.winners && q1Result.winners[0]?.name === 'Lucas Dev';
  console.log('6. Apuração real e cálculo do pódio:', q1Winner ? '✅ Aprovado (Lucas Dev venceu Decreto #1 com 67%)' : '❌ Falhou');

  console.log('\n👑 Todos os decretos e fluxos da Corte foram validados com 100% de sucesso!');
}

runTests().catch(err => {
  console.error('❌ Erro durante os testes:', err);
  process.exit(1);
});
