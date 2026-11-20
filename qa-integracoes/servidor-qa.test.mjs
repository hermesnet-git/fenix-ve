import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import test from 'node:test';
import { criarServidorQa } from './servidor-qa.mjs';

const url = 'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1/troubleTicket?designatorId=TEST';

async function comServidor(enviar, verificar) {
  const servidor = criarServidorQa({ enviar });
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  try {
    await verificar('http://127.0.0.1:' + servidor.address().port);
  } finally {
    await new Promise(resolve => servidor.close(resolve));
  }
}

function executar(base, dados, headers = {}) {
  return fetch(base + '/qa-proxy', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ url, method: 'GET', headers: { Authorization: 'Bearer TEST_ONLY', iss: 'test-issuer' }, timeoutMs: 1000, ...dados }),
  });
}

test('preserva HTTP 206, JSON e headers da API, sem encaminhar Origin do navegador', async () => {
  await comServidor(async (destino, opcoes) => {
    assert.equal(destino, url);
    assert.equal(opcoes.headers.Authorization, 'Bearer TEST_ONLY');
    assert.equal(opcoes.headers.iss, 'test-issuer');
    assert.equal(opcoes.headers.origin, undefined);
    assert.equal(opcoes.redirect, 'manual');
    return new Response('[{"id":"TEST_BD"}]', { status: 206, headers: { 'Content-Type': 'application/json', 'X-Vivo-Correlation-Id': 'TEST_CID' } });
  }, async base => {
    const resposta = await executar(base, {});
    assert.equal(resposta.status, 206);
    assert.equal(resposta.headers.get('x-vivo-correlation-id'), 'TEST_CID');
    assert.deepEqual(await resposta.json(), [{ id: 'TEST_BD' }]);
  });
});

test('preserva HTTP 204 vazio sem transforma-lo em sucesso com dados', async () => {
  await comServidor(async () => new Response(null, { status: 204 }), async base => {
    const resposta = await executar(base, {});
    assert.equal(resposta.status, 204);
    assert.equal(await resposta.text(), '');
  });
});

test('bloqueia destinos externos a lista e paginas de outras origens', async () => {
  await comServidor(async () => { throw new Error('Nao deve chamar API'); }, async base => {
    assert.equal((await executar(base, { url: 'http://169.254.169.254/' })).status, 400);
    assert.equal((await executar(base, {}, { Origin: 'https://external.example' })).status, 403);
    const status = await new Promise((resolve, reject) => {
      const req = request(base + '/qa-proxy', { method: 'POST', headers: { Host: 'external.example:8765' } }, res => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on('error', reject);
      req.end('{}');
    });
    assert.equal(status, 403);
  });
});

test('serve HTML atualizado sem cache', async () => {
  await comServidor(async () => { throw new Error('Nao deve chamar API'); }, async base => {
    const resposta = await fetch(base + '/fenix-ve-integracoes.html');
    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get('cache-control'), 'no-store');
    assert.match(await resposta.text(), /\/qa-proxy/);
  });
});