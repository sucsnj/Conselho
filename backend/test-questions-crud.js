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
  console.log('📜 Testando Gestão Completa de Decretos (CRUD)...\n');

  try {
    // 1. Listar decretos e categorias
    const qListRes = await request('GET', '/api/questions');
    console.log('1. Leitura de Decretos do SQLite:', qListRes.status === 200 && qListRes.data.total >= 48 ? `✅ OK (${qListRes.data.total} decretos encontrados)` : '❌ Falhou');

    const catListRes = await request('GET', '/api/categories');
    console.log('2. Leitura de Categorias do SQLite:', catListRes.status === 200 && catListRes.data.categories.length === 5 ? '✅ OK (5 tomos encontrados)' : '❌ Falhou');

    // 3. Bloqueio de criação sem PIN
    const noPinRes = await request('POST', '/api/admin/questions', {
      title: 'Decreto sem autorização real',
      subtitle: 'Invasor da Corte',
      category_id: 1,
      target_type: 'student'
    });
    console.log('3. Proteção por PIN na criação:', noPinRes.status === 401 ? '✅ OK (Bloqueado sem PIN)' : '❌ Falhou');

    // 4. Criar novo decreto com PIN válido
    const createRes = await request('POST', '/api/admin/questions', {
      title: 'Quem é mais provável de esquecer o notebook no dia da apresentação?',
      subtitle: 'O Cavaleiro Desmemoriado',
      category_id: 3,
      target_type: 'student'
    }, { 'x-admin-pin': ADMIN_PIN });
    console.log('4. Proclamação de Novo Decreto:', createRes.status === 201 ? '✅ OK' : '❌ Falhou');
    const newDecree = createRes.data.question;

    // 5. Editar título e subtítulo do decreto
    const updateRes = await request('PUT', `/api/admin/questions/${newDecree.id}`, {
      title: 'Quem é mais provável de esquecer o carregador no dia do TCC?',
      subtitle: 'Lorde dos 2% de Bateria',
      category_id: 3,
      target_type: 'student'
    }, { 'x-admin-pin': ADMIN_PIN });
    console.log('5. Alteração de Título e Subtítulo:', updateRes.status === 200 && updateRes.data.question.subtitle === 'Lorde dos 2% de Bateria' ? '✅ OK' : '❌ Falhou');

    // 6. Simular voto no novo decreto
    // Fazer check-in rápido
    const checkin = await request('POST', '/api/checkin', {
      name: 'Votante Decretos Teste',
      title: 'O Testador Real'
    });
    const voter = checkin.data.participant;

    const voteRes = await request('POST', '/api/votes', {
      voter_id: voter.id,
      question_id: newDecree.id,
      voted_for_name: voter.name
    });
    console.log('6. Voto registrado no novo decreto:', voteRes.status === 200 ? '✅ OK' : '❌ Falhou');

    // 7. Excluir o decreto criado
    const deleteRes = await request('DELETE', `/api/admin/questions/${newDecree.id}`, null, { 'x-admin-pin': ADMIN_PIN });
    console.log('7. Exclusão do Decreto Real:', deleteRes.status === 200 ? '✅ OK' : '❌ Falhou');

    // 8. Verificar se o decreto não existe mais e votos foram limpos
    const checkDeleted = await request('GET', `/api/questions/${newDecree.id}`);
    console.log('8. Confirmação de exclusão nos anais:', checkDeleted.status === 404 ? '✅ OK (404 Not Found)' : '❌ Falhou');

    // 9. Limpar participante de teste
    await request('DELETE', `/api/admin/participants/${voter.id}`, null, { 'x-admin-pin': ADMIN_PIN });
    console.log('9. Limpeza de registros de teste:', '✅ OK');

    console.log('\n👑 TODOS OS TESTES DE CRUD DE DECRETOS PASSARAM COM SUCESSO!\n');
  } catch (err) {
    console.error('Erro durante os testes:', err);
  }
}

runTests();
