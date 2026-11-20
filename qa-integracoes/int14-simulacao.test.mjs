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
    + 'globalThis.qa={ESPECIFICACOES,contextoDaIntegracao,novoContexto,montarRequest,atualizarCampoCorpoInt14,ajusteDe,confirmarHorarioManual,padroesHorarioSimulado};})();', sandbox);
  const qa = sandbox.qa;
  const spec = qa.ESPECIFICACOES.find(item => item.id === 'INT14');
  const ctx = qa.contextoDaIntegracao(spec, qa.novoContexto('preprod', {}, 'TEST_ONLY'));
  return { qa, spec, ctx };
}

test('simulacao exige opt-in e nao altera resultado da INT11', () => {
  const { qa, spec, ctx } = carregar();
  assert.ok(spec.depende(ctx));
  ctx.params.wfmUsarHorarioSimulado = true;
  assert.equal(spec.depende(ctx), null);
  const req = qa.montarRequest(spec, ctx);
  const appointment = req.body.Appointment_Create;
  assert.equal(appointment.externalId, req.body.WorkOrder_Create.workOrderItem[0].id);
  assert.ok(req.body.WorkOrder_Create.id.startsWith('VE'));
  assert.equal(appointment.relatedParty[1].id, '12:00-14:00');
  assert.equal(appointment.relatedParty[1].resourceId, 'BKT_GRUPO_02_NV_FB');
  assert.match(appointment.note[0].text, /simulado/);
  assert.equal(ctx.saidas.slot, undefined);
});

test('horario simulado invalido e bloqueado; body manual tem prioridade', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmUsarHorarioSimulado = true;
  ctx.params.wfmSimuladoFim = 'invalido';
  assert.ok(spec.depende(ctx));
  ctx.params.wfmCorpoInt14 = JSON.stringify({ WorkOrder_Create: { id: 'MANUAL' }, Appointment_Create: {} });
  assert.equal(spec.depende(ctx), null);
  assert.equal(qa.montarRequest(spec, ctx).body.WorkOrder_Create.id, 'MANUAL');
});

test('fluxo real continua usando o slot da INT11', () => {
  const { qa, spec, ctx } = carregar();
  ctx.saidas.slot = { inicio: '2026-12-01T10:00:00-03:00', fim: '2026-12-01T12:00:00-03:00', timeslot: 'REAL', resourceId: 'REAL_ID' };
  assert.equal(spec.depende(ctx), null);
  assert.equal(qa.montarRequest(spec, ctx).body.Appointment_Create.relatedParty[1].resourceId, 'REAL_ID');
});

test('parametros de horario e cliente atualizam o JSON sem recriar IDs', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmUsarHorarioSimulado = true;
  const body = qa.montarRequest(spec, ctx).body;
  const id = body.WorkOrder_Create.id;
  body.campoPersonalizado = 'PRESERVAR';
  for (const [nome, valor] of Object.entries({
    wfmSimuladoInicio: '2026-12-01T10:00:00-03:00', wfmSimuladoFim: '2026-12-01T12:00:00-03:00',
    wfmSimuladoPeriodo: '10:00-12:00', wfmSimuladoRecursoId: 'RECURSO_TESTE', wfmSimuladoRecursoNome: 'NOME_TESTE',
    wo_customerName: 'CLIENTE_TESTE', wo_emailAddress: 'teste@example.invalid', wo_streetName: 'RUA TESTE', wo_detail: 'DEFEITO TESTE',
  })) qa.atualizarCampoCorpoInt14(body, nome, valor);
  const horario = body.Appointment_Create.relatedParty[1];
  assert.equal(horario.id, '10:00-12:00');
  assert.equal(horario.validFor.startDateTime, '2026-12-01T10:00:00-03:00');
  assert.equal(horario.validFor.endDateTime, '2026-12-01T12:00:00-03:00');
  assert.equal(horario.resourceId, 'RECURSO_TESTE');
  assert.equal(horario.resourceName, 'NOME_TESTE');
  assert.equal(body.Appointment_Create.scheduleDate, '2026-12-01');
  assert.equal(body.WorkOrder_Create.id, id);
  assert.equal(body.campoPersonalizado, 'PRESERVAR');
  assert.equal(body.WorkOrder_Create.relatedParty[0].name, 'CLIENTE_TESTE');
  assert.equal(body.WorkOrder_Create.relatedParty[0].contactMedium[0].characteristic[0].emailAddress, 'teste@example.invalid');
  assert.equal(body.WorkOrder_Create.workOrderItem[0].place.streetName, 'RUA TESTE');
});

test('Asset e horario recebidos depois completam corpo gerado sem apagar edicao explicita', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmUsarHorarioSimulado = true;
  const body = qa.montarRequest(spec, ctx).body;
  const id = body.WorkOrder_Create.id;
  const ajuste = qa.ajusteDe('INT14');
  ajuste.corpoInt14Gerado = true;
  ajuste.params.wfmCorpoInt14 = JSON.stringify(body);
  ajuste.params.wo_customerName = 'NOME MANUAL';
  qa.atualizarCampoCorpoInt14(body, 'wo_customerName', 'NOME MANUAL');
  ajuste.params.wfmCorpoInt14 = JSON.stringify(body);
  const fresh = qa.novoContexto('preprod', {}, 'TEST_ONLY');
  fresh.saidas.entradasAsset = { wo_customerName: 'NOME ASSET', wo_customerId: 'ID ASSET', wo_city: 'CIDADE ASSET' };
  fresh.saidas.slot = { inicio: '2026-12-01T10:00:00-03:00', fim: '2026-12-01T12:00:00-03:00', timeslot: 'REAL', resourceId: 'REAL_ID' };
  const local = qa.contextoDaIntegracao(spec, fresh);
  const atualizado = JSON.parse(local.params.wfmCorpoInt14);
  const campos = qa.atualizarCampoCorpoInt14(atualizado);
  assert.equal(campos.wo_customerName, 'NOME MANUAL');
  assert.equal(campos.wo_customerId, 'ID ASSET');
  assert.equal(campos.wo_city, 'CIDADE ASSET');
  assert.equal(campos.wfmSimuladoPeriodo, 'REAL');
  assert.equal(campos.wfmSimuladoRecursoId, 'REAL_ID');
  assert.equal(atualizado.WorkOrder_Create.id, id);
  ajuste.corpoInt14Gerado = false;
  fresh.saidas.entradasAsset.wo_city = 'OUTRA CIDADE';
  assert.equal(JSON.parse(qa.contextoDaIntegracao(spec, fresh).params.wfmCorpoInt14).WorkOrder_Create.workOrderItem[0].place.city, 'CIDADE ASSET');
});

test('corpo gerado segue a estrutura do curl do WFM (18/11) e usa padroes sem origem', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmUsarHorarioSimulado = true;
  Object.assign(ctx.params, {
    designador: 'SPO-SF910004-013', wo_acessoId: 'ACESSO_ID', wo_acessoDesignador: 'SPO-SF910004-069',
    wo_customerId: 'CLI', wo_customerName: 'CLIENTE', wo_documentNumber: '78392757000165', wo_productId: 'PROD',
    wo_city: 'São Paulo', wo_neighborhood: 'Vila Cordeiro', wo_stateOrProvince: 'São Paulo', wo_streetName: 'Rua X', wo_streetNr: '1',
    wfmCnl: '11000', wfmPostcode: '04582030',
  });
  const body = qa.montarRequest(spec, ctx).body;
  const curl = readFileSync(new URL('../postman/curls/INT14.json', import.meta.url), 'utf8');
  const referencia = JSON.parse(curl.slice(curl.indexOf("--data '") + 8, curl.lastIndexOf("'")));
  const caminhos = (o, p = '') => o && typeof o === 'object'
    ? Object.entries(o).flatMap(([k, v]) => caminhos(v, p + (Array.isArray(o) ? '[]' : '.' + k))) : [p];
  assert.deepEqual([...new Set(caminhos(body))].sort(), [...new Set(caminhos(referencia))].sort());
  const wo = body.WorkOrder_Create, item = wo.workOrderItem[0];
  assert.equal(wo.sourceSystem, 'SERVICENOWB2BMASSIVO');
  assert.equal(JSON.stringify(body.Appointment_Create.relatedParty[0]), JSON.stringify({ '@type': 'Attendant', id: 'Cliente via Vivo Empresa', role: '' }));
  assert.equal(body.Appointment_Create.canBeAntecipated, true);
  assert.equal(item.place.stateOrProvince, 'SP');
  assert.equal(item.place.geographicSite.id, 'PRCTA_G1D23');
  assert.deepEqual([...item.relatedEntity.map(e => e.name)], ['Banda Larga', 'ACESSO', '500 Mbps', 'IP Fixo', 'HGU']);
  assert.deepEqual([...item.relatedEntity[0].characteristic.map(c => c.name + '=' + c.value)], ['Code=21000', 'Designator=SPO-SF910004-013', 'Technology=GPON']);
  assert.equal(item.relatedEntity[1].characteristic[0].value, 'SPO-SF910004-069');
  assert.deepEqual([...body.Appointment_Create.note.map(n => n.id)], ['CRM_NOTES', 'ADDRESS_REFERENCE']);
  assert.equal(JSON.stringify(body).includes('null'), false, 'sem null quando Asset e padroes preenchem o corpo');
});

test('corpo gerado antes da Asset recebe o ACESSO depois, sem travar a execucao', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.wfmUsarHorarioSimulado = true;
  const body = qa.montarRequest(spec, ctx).body;
  assert.equal(body.WorkOrder_Create.workOrderItem[0].relatedEntity.some(e => e.name === 'ACESSO'), false);
  const ajuste = qa.ajusteDe('INT14');
  ajuste.corpoInt14Gerado = true;
  ajuste.params.wfmCorpoInt14 = JSON.stringify(body);
  const fresh = qa.novoContexto('preprod', {}, 'TEST_ONLY');
  fresh.saidas.entradasAsset = { wo_acessoId: 'ACESSO_ID', wo_acessoDesignador: 'SPO-SF910004-069' };
  const atualizado = JSON.parse(qa.contextoDaIntegracao(spec, fresh).params.wfmCorpoInt14);
  const entidades = atualizado.WorkOrder_Create.workOrderItem[0].relatedEntity;
  assert.deepEqual([...entidades.map(e => e.name)], ['Banda Larga', 'ACESSO', '500 Mbps', 'IP Fixo', 'HGU']);
  assert.equal(entidades[1].id, 'ACESSO_ID');
  assert.equal(entidades[1].characteristic[0].value, 'SPO-SF910004-069');
});

test('escolha manual sugere amanha ao meio dia e prepara INT14 e INT18 sem aprovar INT11', () => {
  const { qa, spec, ctx } = carregar();
  const padroes = qa.padroesHorarioSimulado();
  assert.match(padroes.wfmSimuladoInicio, /T12:00:00\.000-03:00$/);
  ctx.saidas.slot = qa.confirmarHorarioManual(padroes);
  assert.equal(ctx.saidas.slot.origem, 'manual');
  assert.equal(ctx.saidas.slot.simulado, true);
  assert.equal(spec.depende(ctx), null);
  const int18 = qa.ESPECIFICACOES.find(item => item.id === 'INT18');
  assert.match(int18.depende(ctx), /WO confirmada/);
  ctx.saidas.woNumero = 'WO_CONFIRMADA_TESTE';
  assert.equal(int18.depende(ctx), null);
  assert.equal(qa.montarRequest(spec, ctx).body.Appointment_Create.relatedParty[1].id, '12:00-14:00');
  assert.throws(() => qa.confirmarHorarioManual({ ...padroes, wfmSimuladoInicio: '2000-01-01T12:00:00-03:00', wfmSimuladoFim: '2000-01-01T14:00:00-03:00' }), /futuro/);
});