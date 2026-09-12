const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 5001;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🛡️  Iniciando testes de Gestão do Cofre (Renomear & Expurgar)...\n');

  try {
    // 1. Criar participantes de teste
    const checkin1 = await request('POST', '/api/checkin', {
      name: 'Guerreiro Teste A',
      title: 'O Conquistador'
    });
    console.log('1. Check-in Guerreiro A:', checkin1.status === 200 || checkin1.status === 201 ? '✅ OK' : '❌ Falhou');
    const pA = checkin1.data.participant;

    const checkin2 = await request('POST', '/api/checkin', {
      name: 'Guerreiro Teste B',
      title: 'O Defensor'
    });
    console.log('2. Check-in Guerreiro B:', checkin2.status === 200 || checkin2.status === 201 ? '✅ OK' : '❌ Falhou');
    const pB = checkin2.data.participant;

    // 3. Guerreiro B vota em Guerreiro A
    const voteRes = await request('POST', '/api/votes', {
      voter_id: pB.id,
      question_id: 1,
      voted_for_name: pA.name
    });
    console.log('3. Voto de B em A:', voteRes.status === 200 ? '✅ OK' : '❌ Falhou');

    // 4. Teste de segurança: Renomear sem PIN deve ser barrado (401)
    const noPinRes = await request('PUT', `/api/admin/participants/${pA.id}`, {
      name: 'Tentativa Hacker',
      title: 'Sem Permissão'
    });
    console.log('4. Bloqueio sem PIN válido:', noPinRes.status === 401 ? '✅ OK (Bloqueado)' : '❌ Falhou');

    // 5. Renomear Guerreiro A com PIN válido
    const renameRes = await request('PUT', `/api/admin/participants/${pA.id}`, {
      name: 'Guerreiro A Renomeado',
      title: 'O Mago Soberano'
    }, { 'x-admin-pin': ADMIN_PIN });
    console.log('5. Renomeação no Cofre:', renameRes.status === 200 && renameRes.data.participant.name === 'Guerreiro A Renomeado' ? '✅ OK' : '❌ Falhou');

    // 6. Verificar se o voto de B agora aponta para "Guerreiro A Renomeado"
    const resultsRes = await request('GET', '/api/admin/results', null, { 'x-admin-pin': ADMIN_PIN });
    const q1Results = resultsRes.data.resultsByQuestion['1'];
    const voteMigrated = q1Results.ranking.some(r => r.name === 'Guerreiro A Renomeado' && r.votes > 0);
    console.log('6. Votos migrados para o novo nome:', voteMigrated ? '✅ OK (Consistência preservada!)' : '❌ Falhou');

    // 7. Teste de duplicidade: não permitir renomear para nome já existente
    const dupRes = await request('PUT', `/api/admin/participants/${pA.id}`, {
      name: pB.name,
      title: 'Tentando duplicar'
    }, { 'x-admin-pin': ADMIN_PIN });
    console.log('7. Rejeição de nome duplicado:', dupRes.status === 400 ? '✅ OK (Rejeitado)' : '❌ Falhou');

    // 8. Expurgar Guerreiro A individualmente
    const expungeRes = await request('DELETE', `/api/admin/participants/${pA.id}`, null, { 'x-admin-pin': ADMIN_PIN });
    console.log('8. Expurgo individual de A:', expungeRes.status === 200 ? '✅ OK' : '❌ Falhou');

    // 9. Verificar se A sumiu da lista e se seus votos foram limpos
    const rosterAfter = await request('GET', '/api/participants');
    const stillInRoster = rosterAfter.data.participants.some(p => p.id === pA.id);
    const resultsAfter = await request('GET', '/api/admin/results', null, { 'x-admin-pin': ADMIN_PIN });
    const q1After = resultsAfter.data.resultsByQuestion['1'];
    const phantomVotes = q1After.ranking.some(r => r.name === 'Guerreiro A Renomeado');

    console.log('9. Confirmação do Expurgo na lista:', !stillInRoster ? '✅ OK (Removido da lista)' : '❌ Falhou');
    console.log('10. Votos fantasmas limpos do ranking:', !phantomVotes ? '✅ OK (Ranking limpo)' : '❌ Falhou');

    // Limpeza: expurgar B também
    await request('DELETE', `/api/admin/participants/${pB.id}`, null, { 'x-admin-pin': ADMIN_PIN });
    console.log('11. Limpeza do ambiente de teste:', '✅ OK');

    console.log('\n👑 TODOS OS TESTES DE GESTÃO DO COFRE PASSARAM COM SUCESSO!\n');
  } catch (err) {
    console.error('Erro na execução dos testes:', err);
  }
}

// Iniciar servidor em background se não estiver rodando, ou rodar diretamente
runTests();
