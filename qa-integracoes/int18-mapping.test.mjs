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
    + 'globalThis.qa={ESPECIFICACOES,contextoDaIntegracao,novoContexto,montarRequest,CARACTERISTICAS_BD};})();', sandbox);
  const qa = sandbox.qa;
  const spec = qa.ESPECIFICACOES.find(item => item.id === 'INT18');
  const ctx = qa.novoContexto('preprod', { designador: 'DESIGNADOR_TESTE', hpsdTestSpecificationId: 'SPEC_TESTE', correlationId: 'CID_TESTE' }, 'TEST_ONLY');
  ctx.saidas = {
    slot: { inicio: '2026-12-01T10:00:00-03:00', fim: '2026-12-01T12:00:00-03:00', timeslot: '10:00-12:00' },
    woNumero: 'WO_CONFIRMADA', woItemId: 'ITEM_CONFIRMADO', woIdWork: 'NAO_E_ID_APPOINTMENT',
    entradasAsset: { wo_customerName: 'NOME_ASSET', wo_customerId: 'ID_SALESFORCE_ASSET', wo_productId: 'NAO_E_ID_SN',
      wo_documentNumber: 'DOCUMENTO_TESTE', wo_city: 'CIDADE_TESTE', wo_streetName: 'RUA TESTE', wfmPostcode: '01234000' },
  };
  return { qa, spec, ctx };
}

test('INT18 usa tipos da tabela do mapping e fontes comprovadas', () => {
  const { qa, spec, ctx } = carregar();
  const local = qa.contextoDaIntegracao(spec, ctx);
  const req = qa.montarRequest(spec, local);
  const body = req.body;
  assert.equal(body['@type'], 'TroubleTicket');
  assert.equal(body.ticketType, 'Case');
  assert.equal(body.channel['@type'], 'ServiceProblemCase');
  assert.equal(body.channel.name, 'Alert');
  assert.equal(body.relatedParty.length, 1);
  assert.equal(body.relatedParty[0].partyOrPartyRole.id, 'ID_SALESFORCE_ASSET');
  assert.equal(body.relatedEntity.some(item => item.entity.name === 'ProductInventory'), false);
  assert.equal(body.relatedEntity.find(item => item.entity.name === 'testSpecification').entity.id, 'spec-ftth-gpon-basico');
  assert.equal(body.troubleTicketCharacteristic.length, 36);
  const carac = Object.fromEntries(body.troubleTicketCharacteristic.map(item => [item.name, item.value]));
  assert.equal(carac.WorkOrder, 'WO_CONFIRMADA');
  assert.equal(carac.WorkOrderItem, 'ITEM_CONFIRMADO');
  assert.equal(carac.documentNumber, 'DOCUMENTO_TESTE');
  assert.equal(carac.postcode, '01234000');
  assert.equal(carac.previsaoAtendimento, '01/12/2026 10:00-12:00');
  assert.equal(carac.idAppointment, '');
  assert.equal(body.requestedResolutionDate, ctx.saidas.slot.inicio);
  assert.equal(req.headers.Authorization, 'Bearer TEST_ONLY');
  assert.equal(req.headers['X-Vivo-Correlation-Id'], 'CID_TESTE');
  assert.match(req.headers['X-Vivo-Transaction-Id'], /^TID_ELJY_FTAT933INT009_/);
});

test('INT18 suporta cliente, contatos, entidades e todas as caracteristicas da aba', () => {
  const { qa, spec, ctx } = carregar();
  Object.assign(ctx.params, {
    bd_customerId: 'SALESFORCE_TESTE', bd_serviceNowCustomerId: 'SN_TESTE',
    bd_email: 'teste@example.invalid', bd_phone: 'TELEFONE_TESTE', bd_productInventoryId: 'PRODUCT_INVENTORY_TESTE',
    bd_relatedServiceId: 'SERVICE_TESTE', bd_relatedServiceSpecificationId: 'SERVICE_SPEC_TESTE',
  });
  for (const nome of qa.CARACTERISTICAS_BD) ctx.params['bd_' + nome] = 'VALOR_' + nome;
  const body = qa.montarRequest(spec, qa.contextoDaIntegracao(spec, ctx)).body;
  const cliente = body.relatedParty[0];
  assert.equal(cliente.role, 'Digital');
  assert.equal(cliente.partyOrPartyRole.id, 'SALESFORCE_TESTE');
  assert.equal(cliente.partyOrPartyRole.characteristic.find(item => item.name === 'idCustomer').value, 'SN_TESTE');
  assert.equal(body.relatedEntity.length, 5);
  assert.equal(body.troubleTicketCharacteristic.length, 36);
  assert.equal(new Set(body.troubleTicketCharacteristic.map(item => item.name)).size, 36);
  assert.equal(body.troubleTicketCharacteristic.find(item => item.name === 'payloadDiagnostico').value, 'VALOR_payloadDiagnostico');
});

test('INT18 usa o padrao quando o campo vem vazio, como o BPMN', () => {
  const { qa, spec, ctx } = carregar();
  ctx.params.bd_city = '';
  ctx.params.bd_description = '';
  const body = qa.montarRequest(spec, qa.contextoDaIntegracao(spec, ctx)).body;
  assert.equal(body.troubleTicketCharacteristic.find(item => item.name === 'city').value, 'CIDADE_TESTE');
  assert.match(body.description, /^Abertura de BD pelo VE/);
});