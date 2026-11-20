import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

function carregar() {
  const html = readFileSync(new URL('./fenix-ve-integracoes.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const sandbox = { URLSearchParams, URL, crypto: webcrypto };
  vm.createContext(sandbox);
  vm.runInContext(script.slice(0, script.indexOf('function redigir('))
    + 'globalThis.qa={ESPECIFICACOES,contextoDaIntegracao,novoContexto,montarRequest,ajusteDe};})();', sandbox);
  const qa = sandbox.qa;
  const spec = qa.ESPECIFICACOES.find(item => item.id === 'INT16');
  const base = qa.novoContexto('preprod', { correlationId: 'CID_TESTE' }, 'TEST_ONLY');
  base.saidas.woNumero = 'WO TESTE/1';
  const ctx = qa.contextoDaIntegracao(spec, base);
  return { qa, spec, ctx, base };
}

test('INT16 usa DELETE, path codificado, queries e headers da primeira aba', () => {
  const { qa, spec, ctx } = carregar();
  const req = qa.montarRequest(spec, ctx);
  assert.equal(req.method, 'DELETE');
  assert.ok(req.url.endsWith('/workOrder/WO%20TESTE%2F1?reason=PROBLEMAS%20SISTEMICOS&context=SISTEMICO'));
  assert.equal(req.body, undefined);
  assert.equal(req.bodyTexto, undefined);
  assert.equal(req.headers.Authorization, 'Bearer TEST_ONLY');
  assert.equal(req.headers.flow, 'B2B_MASSIVO');
  assert.equal(req.headers.requestSystem, 'MVE');
  assert.equal(req.headers['X-Vivo-Correlation-Id'], 'CID_TESTE');
  assert.match(req.headers['X-Vivo-Transaction-Id'], /^TID_ELJY_FTAT933INT008_/);
});

test('INT16 bloqueia ID ausente, placeholder e queries vazias', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmCancelReason = '';
  assert.throws(() => qa.montarRequest(spec, ctx), /obrigatórios/);
  ctx.params.wfmCancelReason = 'MOTIVO';
  ctx.saidas.woNumero = '{woNumero}';
  assert.throws(() => qa.montarRequest(spec, ctx), /idWorkOrder/);
  ctx.saidas.woNumero = '';
  assert.throws(() => qa.montarRequest(spec, ctx), /idWorkOrder/);
});

test('INT16 depende so da WO da INT14, mesmo com BD criado ou com falha', () => {
  const { qa, spec, base } = carregar();
  qa.ajusteDe('INT16').params.woNumero = 'WO_MANUAL';
  let local = qa.contextoDaIntegracao(spec, base);
  assert.equal(local.saidas.woNumero, 'WO_MANUAL');
  assert.equal(spec.depende(local), null);
  base.saidas.bdCriado = true;
  local = qa.contextoDaIntegracao(spec, base);
  assert.equal(spec.depende(local), null);
});

test('INT16 valida edicoes avancadas de headers, metodo, corpo e URL', () => {
  const { qa, spec, ctx } = carregar();
  const request = qa.ajusteDe('INT16').request;
  request.headers = '{}';
  assert.throws(() => qa.montarRequest(spec, ctx), /Headers INT16/);
  delete request.headers;
  request.body = '{}';
  assert.throws(() => qa.montarRequest(spec, ctx), /não envia corpo/);
  request.body = '';
  request.method = 'POST';
  assert.throws(() => qa.montarRequest(spec, ctx), /DELETE/);
  delete request.method;
  request.url = 'http://example.invalid/workOrder/WO_TESTE';
  assert.throws(() => qa.montarRequest(spec, ctx), /reason\/context/);
});