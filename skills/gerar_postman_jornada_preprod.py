#!/usr/bin/env python3
"""Gera postman/fenix-ve-jornada-preprod-2026-11-12.postman_collection.json: a jornada fenix-ve-abertura-bd ponta a
ponta pela fachada (ms-journey-v1) em preprod, com o contrato WFM recebido em 12/11/2026. Reaproveita o fluxo de
token da collection fenix-ve.postman_collection.json. A versão anterior (sem data) fica como estava.

Uso: python3 skills/gerar_postman_jornada_preprod.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'postman' / 'fenix-ve.postman_collection.json'
VERSAO = '2026-11-12'
OUT = ROOT / 'postman' / f'fenix-ve-jornada-preprod-{VERSAO}.postman_collection.json'
WFM_PREPROD = 'http://preprod.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1'
TOKEN_REQUEST = '00 - Obter token VE'

base = json.loads(BASE.read_text('utf-8'))
token_item = base['item'][0]['item'][0]
base_vars = {v['key']: v for v in base['variable']}
token_item['request']['url'] = {'raw': '{{fenix_auth_token_url}}', 'host': ['{{fenix_auth_token_url}}']}

# O sandbox do Postman rejeita await fora de função (o script da collection Fenix - VE usa): callback no lugar.
token_prerequest = [
    "if (pm.info.requestName !== '" + TOKEN_REQUEST + "') {",
    "  const v = n => pm.variables.get(n);",
    "  const token = v('fenix_access_token');",
    "  const expiresAt = Number(v('fenix_token_expires_at') || 0);",
    "  if (!token || Date.now() >= expiresAt - 60000) {",
    "    const faltando = ['fenix_auth_token_url', 'fenix_auth_domain', 'fenix_auth_basic_credentials',",
    "      'fenix_auth_username', 'fenix_auth_password', 'fenix_auth_scope'].filter(n => !v(n));",
    "    if (faltando.length) {",
    "      pm.execution.skipRequest();",
    "      throw new Error('FENIX VE: preencha ' + faltando.join(', ') + ' nas variáveis da collection.');",
    "    }",
    "    pm.sendRequest({",
    "      url: v('fenix_auth_token_url'), method: 'POST',",
    "      header: { 'x-oauthidentity-domain-name': v('fenix_auth_domain'),",
    "        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',",
    "        Authorization: 'Basic ' + v('fenix_auth_basic_credentials') },",
    "      body: { mode: 'urlencoded', urlencoded: [",
    "        { key: 'grant_type', value: 'password' },",
    "        { key: 'username', value: v('fenix_auth_username') },",
    "        { key: 'password', value: v('fenix_auth_password') },",
    "        { key: 'scope', value: v('fenix_auth_scope') }] }",
    "    }, (err, res) => {",
    "      if (err || res.code !== 200) {",
    "        console.error('FENIX VE: token não obtido: ' + (err ? err.message : 'HTTP ' + res.code));",
    "        return;",
    "      }",
    "      const payload = res.json();",
    "      const ttl = Number(payload.expires_in);",
    "      const expiry = String(Date.now() + (Number.isFinite(ttl) ? ttl : 300) * 1000);",
    "      pm.collectionVariables.set('fenix_access_token', payload.access_token);",
    "      pm.collectionVariables.set('fenix_token_expires_at', expiry);",
    "      pm.request.headers.upsert({ key: 'Authorization', value: 'Bearer ' + payload.access_token });",
    "    });",
    "  }",
    "}",
]


def var(key, value='', description=''):
    return {'key': key, 'value': value, 'type': 'string', 'description': description}


def script(listen, lines):
    return {'listen': listen, 'script': {'type': 'text/javascript', 'exec': lines}}


def url_of(base_var, path, query=()):
    # O importador do Postman ignora url.raw quando url é objeto: host, path e query precisam vir separados.
    raw = '{{' + base_var + '}}' + path + ('?' + '&'.join(f'{k}={v}' for k, v in query) if query else '')
    url = {'raw': raw, 'host': ['{{' + base_var + '}}'], 'path': [p for p in path.split('/') if p]}
    if query:
        url['query'] = [{'key': k, 'value': v} for k, v in query]
    return url


def request(name, method, path, body=None, description='', events=(), base_var='journey_base_url', query=(),
            headers=()):
    req = {'method': method,
           'header': [{'key': 'Accept', 'value': 'application/json', 'type': 'text'}]
           + [{'key': k, 'value': v, 'type': 'text'} for k, v in headers],
           'url': url_of(base_var, path, query), 'description': description}
    if body is not None:
        req['header'].append({'key': 'Content-Type', 'value': 'application/json', 'type': 'text'})
        req['body'] = {'mode': 'raw', 'raw': json.dumps(body, ensure_ascii=False, indent=2),
                       'options': {'raw': {'language': 'json'}}}
    return {'name': name, 'event': list(events), 'request': req}


def expect_task(*tasks):
    """Avisa (sem bloquear) quando a instância não está na tela esperada."""
    allowed = json.dumps(list(tasks))
    return script('prerequest', [
        f"const esperadas = {allowed};",
        "const atual = pm.variables.get('taskId');",
        "if (!pm.variables.get('processInstanceId')) { pm.execution.skipRequest(); "
        "throw new Error('Inicie a jornada antes (01 - Iniciar jornada).'); }",
        "if (atual && !esperadas.includes(atual)) console.warn('Tela atual é ' + atual + "
        "'; esta resposta é para ' + esperadas.join(' ou ') + '.');",
    ])


def advance(name, answers, tasks, description=''):
    body = {'trigger': 'user-action', 'answers': answers}
    return request(name, 'POST', '/process-instance/{{processInstanceId}}/advance', body,
                   description or f"Tela {', '.join(tasks)}: envia {json.dumps(answers, ensure_ascii=False)}.",
                   [expect_task(*tasks)])


# Guarda instância e tela atual a partir de qualquer resposta da fachada.
journey_test = [
    "(() => {",
    "if (!pm.request.url.getPath().startsWith('/process-instance')) return;",
    "pm.test('Fachada respondeu 2xx', () => pm.expect(pm.response.code).to.be.within(200, 299));",
    "let body; try { body = pm.response.json(); } catch (e) { return; }",
    "if (!body || Array.isArray(body)) return;",
    "if (body.processInstanceId) pm.collectionVariables.set('processInstanceId', body.processInstanceId);",
    "pm.collectionVariables.set('taskId', body.taskId || '');",
    "pm.collectionVariables.set('activityType', body.activityType || '');",
    "const tela = body.form ? (body.form.name || '') : '';",
    "const sdui = body.form && body.form.sdui ? body.form.sdui.uiStepId : null;",
    "console.log('Instância ' + (body.processInstanceId || pm.variables.get('processInstanceId')) + "
    "' | status ' + (body.status || '-') + ' | atividade ' + (body.activityType || '-') + ' | tela ' + "
    "(body.taskId || '-') + (tela ? ' (' + tela + ')' : ''));",
    "if (body.activityType === 'userTask') pm.test('Tela SDUI veio no form', () => pm.expect(sdui).to.eql(body.taskId));",
    "const vars = body.variables || {};",
    "['data_impedimento', 'data_resultadoDiagnostico', 'data_resultadoSlots', 'data_bdCriadoNumero', 'data_woNumero']"
    ".forEach(k => { if (vars[k] !== undefined) console.log('  ' + k + ' = ' + JSON.stringify(vars[k])); });",
    "})();",
]

start_prerequest = [
    "const agora = new Date();",
    "pm.collectionVariables.set('businessKey', 'FTAT933-' + agora.getTime());",
    "pm.collectionVariables.set('correlationId', 'CID_VE_FTAT933_' + agora.getTime());",
    "pm.collectionVariables.set('requestTimestamp', agora.toISOString());",
    "pm.collectionVariables.set('processInstanceId', '');",
    "pm.collectionVariables.set('taskId', '');",
    "if (!pm.variables.get('designador')) { pm.execution.skipRequest(); "
    "throw new Error('Preencha a variável designador.'); }",
]

start = request('01 - Iniciar jornada', 'POST', '/process-instance', {
    'processDefinitionKey': '{{processDefinitionKey}}',
    'businessKey': '{{businessKey}}',
    'assignee': '{{assignee}}',
    'channelType': '{{channelType}}',
    'variables': {'designador': '{{designador}}', 'productStatus': '{{productStatus}}',
                  'correlationId': '{{correlationId}}', 'requestTimestamp': '{{requestTimestamp}}'},
}, 'Cria a instância de fenix-ve-abertura-bd. A fachada converte as variáveis para data_* e devolve a tela '
   'Node_Inicio no campo form. Gera businessKey, correlationId e requestTimestamp a cada execução.',
    [script('prerequest', start_prerequest)])

screens = [
    ('Node_Inicio', [('Continuar', {})],
     'Depois do Continuar a jornada consulta Massiva (CPM) e BD aberto (TT) e decide o impedimento.'),
    ('Node_Reinicie', [('Já reiniciei', {'acaoReinicio': 'reiniciei'}),
                       ('Não consigo reiniciar', {'acaoReinicio': 'nao_consigo'})], ''),
    ('Node_VoltouReinicio', [('Sim', {'voltouReinicio': 'sim'}), ('Não', {'voltouReinicio': 'nao'})], ''),
    ('Node_TesteConexao', [('Continuar', {'acaoTeste': 'continuar'}), ('Ir para o início', {'acaoTeste': 'inicio'})],
     'Continuar solicita o diagnóstico ao HPSD e aguarda o retorno (timeout padrão de 3 min).'),
    ('Node_ReinicieNovamente', [('Já reiniciei', {})], ''),
    ('Node_VoltouNovamente', [('Sim', {'voltouNovamente': 'sim'}), ('Não', {'voltouNovamente': 'nao'})], ''),
    ('Node_SemEnergia', [('Já verifiquei', {'acaoEnergia': 'verifiquei'}),
                         ('Não consigo verificar', {'acaoEnergia': 'nao_consigo'})], ''),
    ('Node_VoltouEnergia', [('Sim', {'voltouEnergia': 'sim'}), ('Não', {'voltouEnergia': 'nao'})], ''),
    ('Node_TemEnergia', [('Sim', {'temEnergia': 'sim'}), ('Não', {'temEnergia': 'nao'})], ''),
    ('Node_AgendarVisita', [('Agendar visita', {'acaoAgendar': 'agendar'}),
                            ('Ir para o início', {'acaoAgendar': 'inicio'})],
     'Agendar consulta horários no WFM (INT11) e, ao confirmar o horário, a jornada cria a WO (INT14).'),
    ('Node_EscolheHorario', [('Confirmar agendamento', {'dataVisita': '{{dataVisita}}',
                                                        'horarioVisita': '{{horarioVisita}}',
                                                        'avisarHorarioMaisCedo': '{{avisarHorarioMaisCedo}}'})],
     'horarioVisita é o value de um item da lista eh_horarios da tela; ajuste as variáveis antes de enviar.'),
    ('Node_RetentarBD', [('Tentar de novo', {'retentarBD': 'sim'}), ('Não, encerrar', {'retentarBD': 'nao'})], ''),
    ('Node_VisitaAgendada', [('Ir para o início', {'acaoFinal': 'inicio'})], ''),
]
finals = ['Node_StatusMassivaAtraso', 'Node_StatusMassivaVisita', 'Node_StatusMassiva', 'Node_StatusAtraso',
          'Node_StatusVisita', 'Node_InternetVoltou', 'Node_RedeEletrica', 'Node_SemHorarios',
          'Node_AgendamentoNaoRealizado', 'Node_BDNaoCriado', 'Node_FalhaConsulta']

answer_items = []
for i, (task, buttons, description) in enumerate(screens, start=1):
    for label, answers in buttons:
        answer_items.append(advance(f'{i:02d} - {task} | {label}', answers, [task], description))
answer_items.append(advance('99 - Telas finais | Ir para o início', {}, finals,
                            'Encerra a jornada a partir de qualquer tela final (status, falha ou resultado).'))

# ------------------------------------------------------------------------------------------------
# Integrações: mesmas chamadas (método, path, headers e corpo) que os httpTask do BPMN fazem.
# ------------------------------------------------------------------------------------------------
TID = 'TID_ELJY_FTAT933{}_{{{{$isoTimestamp}}}}'
COMMON_PREREQUEST = script('prerequest', [
    "if (!pm.variables.get('correlationId')) "
    "pm.collectionVariables.set('correlationId', 'CID_VE_FTAT933_' + Date.now());",
    "if (!pm.variables.get('designador')) { pm.execution.skipRequest(); "
    "throw new Error('Preencha a variável designador.'); }",
])


def require_vars(*names):
    lines = [f"const faltando = {json.dumps(list(names))}.filter(n => !pm.variables.get(n));",
             "if (faltando.length) { pm.execution.skipRequest(); "
             "throw new Error('Preencha antes: ' + faltando.join(', ')); }"]
    return script('prerequest', lines)


def check(lines):
    return script('test', ["(() => {", "let body = null; try { body = pm.response.json(); } catch (e) { }"]
                  + lines + ["})();"])


# Estrutura dos exemplos do WFM de 12/11/2026 (mesma do BPMN); dados sem origem definida são variáveis wo* (P08).
WFM_HEADERS = [('flow', 'B2B_MASSIVO'), ('requestSystem', 'MVE')]
slots_body = {
    'relatedEntity': [],
    'relatedParty': {'name': 'TT_B', 'role': 'acronym'},
    'relatedPlace': {'geographicAddress': {
        'country': 'BR', 'postcode': '{{wfmPostcode}}', 'cnl': '{{wfmCnl}}', 'networkOwner': '{{wfmNetworkOwner}}',
        'telephonicArea': '{{wfmTelephonicArea}}', 'centralOffice': '{{wfmCentralOffice}}',
        'microArea': '{{wfmMicroArea}}',
        'placePhysicalResourceAssoc': {'resourceSpecificationCharacteristic': [
            {'name': 'mediaType', 'value': '{{wfmMediaType}}'}]},
        'geographicSite': {'@type': 'Cabinet', 'id': '{{wfmGeographicSiteId}}'}}},
    'requestedTimeSlot': [{'validFor': {'startDateTime': '{{slotBuscaInicio}}', 'endDateTime': '{{slotBuscaFim}}'}}],
}
wo_body = {
    'WorkOrder_Create': {
        '@type': 'WorkOrder', 'sourceSystem': 'MVE', 'id': '{{woIdJornada}}',
        'relatedParty': [
            {'@type': 'CustomerValue', 'category': '{{woCustomerCategory}}', 'documentNumber': '{{woDocumentNumber}}',
             'id': '{{woCustomerId}}', 'name': '{{woCustomerName}}',
             'contactMedium': [{'@type': 'ContactMediumValue', 'name': '{{woContactName}}', 'characteristic': [{
                 '@type': 'ContactMediumValueCharacteristic', 'emailAddress': '{{woEmailAddress}}',
                 'mobileNumber': '{{woMobileNumber}}', 'phoneNumber': '{{woPhoneNumber}}',
                 'workNumber': '{{woWorkNumber}}'}]}]},
            {'@type': 'CustomerOrderValue', 'dateOfSale': '{{woDateOfSale}}', 'id': '{{woOrderId}}',
             'orderProtocol': '{{woOrderProtocol}}',
             'characteristic': [{'@type': 'Characteristic', 'name': 'Detail', 'value': '{{woOrderDetail}}'}]},
            {'@type': 'WorkOrderPendency', 'context': 'TRIAGEM'}],
        'workOrderItem': [{
            '@type': 'WorkOrderItem', 'id': '{{woIdJornada}}:1',
            'place': {'@type': 'GeographicAddress', 'cnl': '{{wfmCnl}}', 'cnlAcronym': '{{woCnlAcronym}}',
                      'city': '{{woCity}}', 'neighborhood': '{{woNeighborhood}}', 'postcode': '{{wfmPostcode}}',
                      'stateOrProvince': '{{woStateOrProvince}}', 'streetCode': '{{woStreetCode}}',
                      'streetName': '{{woStreetName}}', 'streetNr': '{{woStreetNr}}',
                      'networkOwner': '{{wfmNetworkOwner}}', 'accessTechnology': '{{wfmMediaType}}',
                      'centralOffice': '{{wfmCentralOffice}}', 'telephonicArea': '{{wfmTelephonicArea}}',
                      'geographicLocation': {'@type': 'GeographicLocation', 'bbox': ['{{woLongitude}}', '{{woLatitude}}']},
                      'geographicSite': {'@type': 'Cabinet', 'id': '{{wfmGeographicSiteId}}'},
                      'geographicSubAddress': {'@type': 'GeographicSubAddress', 'name': '{{woComplement}}'}},
            'relatedEntity': [{'@type': 'ProductEntity', 'id': '{{woProductId}}', 'name': 'Banda Larga', 'action': 'Ativo',
                               'status': 'Ativo', 'characteristic': [
                                   {'@type': 'Characteristic', 'name': 'Designator', 'value': '{{designador}}'},
                                   {'@type': 'Characteristic', 'name': 'Technology', 'value': '{{wfmMediaType}}'}]}],
            'specification': {'acronym': 'TT_B', 'type': 'TROUBLETICKET', 'specificationDescription': [
                {'name': 'PRODUTO', 'value': 'Banda'}, {'name': 'TIPO', 'value': 'Defeito'},
                {'name': 'DETALHE', 'value': '{{woDetail}}'}, {'name': 'SEQUENCIA', 'value': '1/1'}]}}]},
    'Appointment_Create': {
        'description': 'Agendamento da atividade', 'category': 'CORPORATE',
        'canBeAntecipated': '{{avisarHorarioMaisCedo}}', 'externalId': '{{woIdJornada}}:1',
        'scheduleDate': '{{slotScheduleDate}}',
        'relatedParty': [
            {'@type': 'Attendant', 'id': '{{wfmAttendantId}}', 'role': ''},
            {'@type': 'TimeSlot', 'id': '{{slotTimeslot}}', 'resourceId': '{{slotResourceId}}',
             'resourceName': '{{slotResourceName}}',
             'validFor': {'startDateTime': '{{slotInicio}}', 'endDateTime': '{{slotFim}}'}}],
        'note': [{'id': 'CRM_NOTES', 'text': 'Agendamento realizado pelo cliente na jornada Fenix - Abertura de BD (VE)'},
                 {'id': 'ADDRESS_REFERENCE', 'text': '{{woAddressReference}}'}]},
}
bd_body = {
    '@type': 'ServiceProblemCase', 'ticketType': 'Case',
    'description': 'Abertura de BD pelo VE (FTAT-933): diagnóstico automático não resolveu o problema',
    'severity': '3', 'name': 'Queda de Conexão',
    'requestedResolutionDate': '{{slotInicio}}', 'expectedResolutionDate': '{{slotFim}}',
    'channel': {'name': 'Alert'},
    'relatedEntity': [
        {'@type': 'Service', 'entity': {'@type': 'ServiceTest', 'name': 'testSpecification',
                                        'id': '{{hpsdTestSpecificationId}}'}},
        {'@type': 'Service', 'entity': {'@type': 'Service', 'name': 'mode', 'id': 'Proactive'}}],
    'relatedParty': [],
    'troubleTicketCharacteristic': [
        {'name': 'designadorAcesso', 'value': '{{designador}}'},
        {'name': 'WorkOrder', 'value': '{{woNumero}}'},
        {'name': 'previsaoAtendimento', 'value': '{{slotData}} {{slotTimeslot}}'},
        {'name': 'etapa', 'value': 'TRIAGEM'}],
}
inbound_body = {
    'eventId': '{{inboundEventId}}',
    'source': {'channel': 'KAFKA', 'topic': '{{hpsdTopic}}', 'partition': 0, 'offset': '{{inboundOffset}}'},
    'payload': {'eventId': '{{inboundEventId}}', 'eventType': 'ServiceTestAttributeValueChangeEvent',
                'event': {'serviceTest': {'id': '{{serviceTestId}}', 'state': 'completed', 'relatedParty': [
                    {'id': '{{processInstanceId}}', 'role': 'ExternalId'}]}}},
}

integration_items = [
    request('INT01 - Consulta Massiva/Manutenção (CPM)', 'GET', '/incidents', base_var='cpm_base_url',
            query=[('serviceDesignator', '{{designador}}')],
            headers=[('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_ConsultaMassiva. 200: massiva aberta se algum incidente tiver status != CLOSED; '
                        '404 = sem massiva. Qualquer outro status leva a jornada para Node_FalhaConsulta.',
            events=[COMMON_PREREQUEST, check([
                "pm.test('CPM respondeu 200 ou 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
                "if (![200, 404].includes(pm.response.code)) return console.warn('CPM: HTTP ' + pm.response.code + "
                "' (a jornada iria para Node_FalhaConsulta)');",
                "const abertas = (body && Array.isArray(body.incidents) ? body.incidents : [])"
                ".filter(i => String(i.status).toUpperCase() !== 'CLOSED');",
                "console.log('Massiva aberta: ' + (abertas.length ? 'sim, incidentId ' + abertas[0].incidentId + "
                "', previsão ' + abertas[0].expectedResolutionDate : 'não'));"])]),
    request('INT03 - Consulta BD aberto (Trouble Ticket)', 'GET', '/troubleTicket', base_var='tt_base_url',
            query=[('filter', 'designatorId:{{designador}};status:Active;ticketType:Case'), ('offset', '0'),
                   ('limit', '5')],
            headers=[('X-Vivo-Transaction-Id', TID.format('INT003')), ('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_ConsultaBD. 200 com lista: BD ativo = primeiro ticket fora de closed/cancelled/resolved; '
                        '404 = nenhum BD ativo.',
            events=[COMMON_PREREQUEST, check([
                "pm.test('TT respondeu 200 ou 404', () => pm.expect([200, 404]).to.include(pm.response.code));",
                "if (![200, 404].includes(pm.response.code)) return console.warn('TT: HTTP ' + pm.response.code + "
                "' (a jornada iria para Node_FalhaConsulta)');",
                "const ativo = (Array.isArray(body) ? body : []).find(t => !['closed', 'cancelled', 'canceled', "
                "'resolved'].includes(String(t.status).toLowerCase()));",
                "console.log('BD ativo: ' + (ativo ? 'sim, id ' + ativo.id : 'não'));"])]),
    request('INT06 - Solicita diagnóstico (HPSD POST /serviceTest)', 'POST', '/serviceTest',
            {'name': 'Diagnóstico automático FTTH', 'relatedService': {'id': '{{hpsdRelatedServiceId}}'},
             'testSpecification': {'id': '{{hpsdTestSpecificationId}}'},
             'relatedParty': [{'id': '{{hpsdExternalId}}', 'role': 'ExternalId'}]},
            base_var='hpsd_base_url',
            headers=[('X-Vivo-Transaction-Id', '{{$guid}}'), ('X-Vivo-Correlation-Id', '{{$guid}}')],
            description='Node_SolicitaDiagnostico. Aceite = 200/201/202; guarda o id em serviceTestId. '
                        'relatedParty ExternalId = processInstanceId da jornada (correlação do retorno Kafka); '
                        'sem jornada iniciada, usa um id de teste. Depois de um aceite, valide no Kafka a mensagem '
                        'no tópico telco.service.servicetestmanagement.servicetestresult.',
            events=[COMMON_PREREQUEST, script('prerequest', [
                "if (!pm.variables.get('hpsdRelatedServiceId')) "
                "pm.collectionVariables.set('hpsdRelatedServiceId', pm.variables.get('designador'));",
                "pm.collectionVariables.set('hpsdExternalId', pm.variables.get('processInstanceId') "
                "|| 'teste-postman-' + Date.now());",
                "if (!pm.variables.get('hpsdTestSpecificationId')) "
                "console.warn('hpsdTestSpecificationId vazio: o BPMN também envia vazio até a pendência P06 ser resolvida.');",
            ]), check([
                "pm.test('HPSD aceitou (200/201/202)', () => pm.expect([200, 201, 202]).to.include(pm.response.code));",
                "if (body && body.id) { pm.collectionVariables.set('serviceTestId', body.id); "
                "console.log('serviceTestId = ' + body.id); }"])]),
    request('TMF653 (apoio) - Consulta resultado do diagnóstico (HPSD GET /serviceTest/{id})', 'GET',
            '/serviceTest/{{serviceTestId}}', base_var='hpsd_base_url',
            headers=[('X-Vivo-Transaction-Id', '{{$guid}}'), ('X-Vivo-Correlation-Id', '{{$guid}}')],
            description='Node_ConsultaResultadoDiagnostico. Lê RESULTADO_DIAGNOSTICO em characteristic ou '
                        'testMeasure: ID06/07/10 = resolvido, ID09 = sem energia, outros = persiste. No motor esta '
                        'chamada roda sem token (asyncBefore); aqui vai com o token da collection.',
            events=[require_vars('serviceTestId'), check([
                "pm.test('HPSD respondeu 200', () => pm.response.to.have.status(200));",
                "const ext = v => { const m = /\\bID\\s*[:\\-]?\\s*0*(\\d{1,2})\\b/i.exec(String(v || '')); "
                "return m ? m[1].padStart(2, '0') : null; };",
                "let id = null;",
                "if (body) {",
                "  const c = (body.characteristic || []).find(x => String(x.name).toUpperCase() === 'RESULTADO_DIAGNOSTICO');",
                "  id = c ? ext(c.value) : null;",
                "  for (const m of (body.testMeasure || [])) { if (id) break; "
                "const v = m && m.value && m.value.value; if (v) id = ext(v.resultado_diagnostico); }",
                "}",
                "const r = ['06', '07', '10'].includes(id) ? 'RESOLVIDO' : (id === '09' ? 'SEM_ENERGIA' : 'PERSISTE');",
                "console.log('state ' + (body && body.state) + ' | ID ' + (id || '-') + ' -> ' + r);"])]),
    request('INT10 (apoio) - Simula retorno do diagnóstico (motor /internal/v1/inbound-events)', 'POST',
            '/internal/v1/inbound-events', inbound_body, base_var='motor_base_url',
            headers=[('X-Event-Id', '{{inboundEventId}}')],
            description='Entrega ao motor o evento que o ms-journey-event-consumer-v1 repassaria do Kafka. 200 '
                        'CORRELATED só quando a instância está em Node_AguardaDiagnostico; 409 NOT_CORRELATED = '
                        'nenhuma espera ativa. Em preprod o motor exige token válido no JWKS do OAM interno.',
            events=[require_vars('processInstanceId'), script('prerequest', [
                "const ts = Date.now();",
                "pm.collectionVariables.set('inboundOffset', String(ts));",
                "pm.collectionVariables.set('inboundEventId', pm.variables.get('hpsdTopic') + ':0:' + ts);",
                "if (!pm.variables.get('serviceTestId')) pm.collectionVariables.set('serviceTestId', 'st-teste');",
            ]), check([
                "console.log('Motor: HTTP ' + pm.response.code + ' ' + (body ? body.status + ' ' + (body.reason || '') : ''));",
                "pm.test('Motor correlacionou', () => pm.expect(body && body.status).to.eql('CORRELATED'));"])]),
    request('INT11 - Consulta horários (WFM POST /searchTimeSlot)', 'POST', '/searchTimeSlot', slots_body,
            base_var='wfm_base_url',
            headers=WFM_HEADERS + [('X-Vivo-Transaction-Id', TID.format('INT005')),
                                   ('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_ConsultaSlots. 200 com availableTimeSlot; 204 = sem horário. Busca de amanhã a +8 '
                        'dias, como o BPMN. Guarda o primeiro horário em slot* para INT14 e INT18.',
            events=[require_vars('wfm_base_url'), COMMON_PREREQUEST, script('prerequest', [
                "// Datas no fuso de Brasília (-03:00), como no exemplo do WFM.",
                "const dia = n => new Date(Date.now() - 3 * 3600000 + n * 86400000).toISOString().slice(0, 10) "
                "+ 'T00:00:00.000-03:00';",
                "pm.collectionVariables.set('slotBuscaInicio', dia(1));",
                "pm.collectionVariables.set('slotBuscaFim', dia(8));",
                "if (pm.variables.get('wfmNetworkOwner') === 'VIVO2') console.warn('VIVO2: o BPMN não envia "
                "telephonicArea, centralOffice nem microArea; limpe essas variáveis.');",
            ]), check([
                "pm.test('WFM respondeu 200 ou 204', () => pm.expect([200, 204]).to.include(pm.response.code));",
                "const slots = (body && Array.isArray(body.availableTimeSlot) ? body.availableTimeSlot : [])"
                ".filter(s => s.validFor && s.validFor.startDateTime)"
                ".sort((a, b) => String(a.validFor.startDateTime).localeCompare(String(b.validFor.startDateTime)));",
                "console.log(slots.length + ' horário(s)');",
                "if (slots.length) { const s = slots[0];",
                "  pm.collectionVariables.set('slotInicio', s.validFor.startDateTime);",
                "  pm.collectionVariables.set('slotFim', s.validFor.endDateTime || '');",
                "  pm.collectionVariables.set('slotTimeslot', String(s.validFor.timeslot || s.id || ''));",
                "  pm.collectionVariables.set('slotResourceId', String(s.resourceId || ''));",
                "  pm.collectionVariables.set('slotResourceName', String(s.resourceName || ''));",
                "  pm.collectionVariables.set('slotScheduleDate', new Date(s.validFor.startDateTime)"
                ".toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }));",
                "  pm.collectionVariables.set('slotData', new Date(s.validFor.startDateTime)"
                ".toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }));",
                "  console.log('Primeiro horário: ' + s.validFor.startDateTime + ' (' + (s.validFor.timeslot || s.id) + ')'); }"])]),
    request('INT14 - Cria WO e agendamento (WFM POST /workOrder/appointment)', 'POST', '/workOrder/appointment',
            wo_body, base_var='wfm_base_url',
            headers=WFM_HEADERS + [('X-Vivo-Transaction-Id', TID.format('INT014')),
                                   ('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_CriaWO, estrutura do exemplo do WFM de 12/11/2026 (WorkOrder_Create + '
                        'Appointment_Create). Preencha as variáveis wo* com a massa do caso de teste (origem na jornada '
                        'pendente, P08). Sucesso = 200/201; sem swagger da resposta (P09), woNumero = id devolvido ou o '
                        'woIdJornada enviado. CRIA uma WO real em preprod.',
            events=[require_vars('wfm_base_url', 'slotInicio'), COMMON_PREREQUEST, script('prerequest', [
                "pm.collectionVariables.set('woIdJornada', pm.variables.replaceIn('{{$guid}}'));",
            ]), check([
                "pm.test('WO criada (200/201)', () => pm.expect([200, 201]).to.include(pm.response.code));",
                "if (![200, 201].includes(pm.response.code)) return;",
                "const wo = (body && (body.id || body.workOrderId || (body.workOrder && body.workOrder.id))) "
                "|| pm.variables.get('woIdJornada');",
                "pm.collectionVariables.set('woNumero', String(wo)); console.log('woNumero = ' + wo);"])]),
    request('INT18 - Abre BD (Trouble Ticket POST /troubleTicket)', 'POST', '/troubleTicket', bd_body,
            base_var='tt_base_url',
            headers=[('X-Vivo-Transaction-Id', TID.format('INT009')), ('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_CriaBD com os campos que o BPMN preenche sem os opcionais bd_<campo>. Sucesso = 200/201; '
                        'número do BD = externalIdentifier.id. CRIA um BD real em preprod.',
            events=[require_vars('slotInicio'), COMMON_PREREQUEST, check([
                "pm.test('BD criado (200/201)', () => pm.expect([200, 201]).to.include(pm.response.code));",
                "if (body) console.log('BD id ' + body.id + ' | número ' + (body.externalIdentifier && "
                "body.externalIdentifier.id));"])]),
    request('INT16 - Cancela WO (WFM DELETE /workOrder/{id})', 'DELETE', '/workOrder/{{woNumero}}',
            base_var='wfm_base_url',
            query=[('reason', '{{wfmCancelReason}}'), ('context', '{{wfmCancelContext}}')],
            headers=[('Content-Type', 'application/json')] + WFM_HEADERS
            + [('X-Vivo-Transaction-Id', TID.format('INT016')), ('X-Vivo-Correlation-Id', '{{correlationId}}')],
            description='Node_CancelaWO / Node_CancelaWOAgendamento (exemplo do WFM de 12/11/2026). CANCELA a WO '
                        'informada em woNumero; valores de reason/context pendentes (P08).',
            events=[require_vars('wfm_base_url', 'woNumero'), COMMON_PREREQUEST, check([
                "pm.test('WFM cancelou (2xx)', () => pm.expect(pm.response.code).to.be.within(200, 299));"])]),
]
# offset e canBeAntecipated não são texto nos contratos.
for item in integration_items:
    body = item['request'].get('body')
    if body:
        body['raw'] = body['raw'].replace('"{{inboundOffset}}"', '{{inboundOffset}}')
        body['raw'] = body['raw'].replace('"{{avisarHorarioMaisCedo}}"', '{{avisarHorarioMaisCedo}}')

collection = {
    'info': {
        'name': f'Fenix - VE - Jornada fenix-ve-abertura-bd (preprod) - {VERSAO}',
        'description': (
            'Jornada FTAT-933 ponta a ponta pela fachada ms-journey-v1 em preprod (processDefinitionKey '
            'fenix-ve-abertura-bd, v1). Preencha usuário, senha e credencial Basic do OAM uma vez; o token é obtido '
            'e renovado automaticamente. Fluxo: 01 - Iniciar jornada e, a cada tela, o request de resposta da pasta '
            '"03 - Respostas por tela" correspondente ao taskId registrado no console. Requer rede interna (VPN).'),
        'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    'auth': base['auth'],
    'event': [script('prerequest', token_prerequest), script('test', journey_test)],
    'variable': [
        var('journey_base_url', 'https://eljy-preprod.redecorp.azr/journey/v1',
            'Fachada ms-journey-v1 em preprod (dev: https://eljy-dev.redecorp.azr/journey/v1).'),
        var('processDefinitionKey', 'fenix-ve-abertura-bd'),
        var('assignee', 've-app'),
        var('channelType', 'MOBILE'),
        var('designador', '', 'Designador do circuito a testar (obrigatório).'),
        var('productStatus', 'ativo', 'Use "bloqueio" para simular fatura em aberto.'),
        var('dataVisita', '', 'Data escolhida em Node_EscolheHorario (ex.: 2026-11-21).'),
        var('horarioVisita', '0', 'value do item escolhido na lista eh_horarios.'),
        var('avisarHorarioMaisCedo', 'false'),
        var('businessKey', '', 'Gerado em 01 - Iniciar jornada.'),
        var('correlationId', '', 'Gerado em 01 - Iniciar jornada.'),
        var('requestTimestamp', '', 'Gerado em 01 - Iniciar jornada.'),
        var('processInstanceId', '', 'Preenchido pela resposta da fachada.'),
        var('taskId', '', 'Tela atual (User Task), preenchida pela resposta da fachada.'),
        var('activityType', '', 'Preenchido pela resposta da fachada.'),
        var('cpm_base_url', 'https://cssp-preprod.redecorp.br/customer-problem-management/v1',
            'FENIX_VE_CPM_BASE_URL do motor em preprod.'),
        var('tt_base_url', 'https://spmg-preprod.redecorp.azr/troubleTicketManagement/v1',
            'FENIX_VE_TT_BASE_URL do motor em preprod.'),
        var('hpsd_base_url', 'https://api-hml.telefonica.com.br/gtw-redes/serviceTestManagement/v1',
            'FENIX_VE_HPSD_BASE_URL do motor em preprod (o contrato não publica preprod; hml).'),
        var('wfm_base_url', WFM_PREPROD, 'FENIX_VE_WFM_BASE_URL do motor em preprod (recebida do WFM em 12/11/2026).'),
        var('motor_base_url', 'https://eljy-preprod.redecorp.azr/journey-motor/v1', 'wf-journey-motor-v1 em preprod.'),
        var('hpsdTopic', 'telco.service.servicetestmanagement.servicetestresult'),
        var('hpsdRelatedServiceId', '', 'relatedService.id do INT06; vazio = designador (como o BPMN).'),
        var('hpsdTestSpecificationId', '', 'testSpecification.id do INT06 (pendência P06).'),
        var('serviceTestId', '', 'Preenchido pelo INT06.'),
        var('hpsdExternalId', '', 'Gerado pelo INT06: processInstanceId da jornada ou um id de teste.'),
        var('inboundEventId', '', 'Gerado pelo INT10.'),
        var('inboundOffset', '', 'Gerado pelo INT10.'),
        var('wfmNetworkOwner', 'VIVO1', 'VIVO1 ou VIVO2.'),
        var('wfmMediaType', 'GPON'),
        var('wfmTelephonicArea', '', 'Só VIVO1.'),
        var('wfmCnl', ''),
        var('wfmCentralOffice', '', 'Só VIVO1.'),
        var('wfmGeographicSiteId', ''),
        var('wfmAttendantId', '', 'Attendant.id do agendamento (INT14).'),
        var('wfmPostcode', '', 'CEP (INT11 e INT14).'),
        var('wfmMicroArea', '', 'Só VIVO1 (INT11).'),
        var('wfmCancelReason', '', 'reason do INT16 (ex. do WFM: CHUVA); valores pendentes (P08).'),
        var('wfmCancelContext', '', 'context do INT16 (ex. do WFM: CLIENTE); valores pendentes (P08).'),
        *[var(k, '', 'INT14: dado do caso de teste (origem na jornada pendente, P08).') for k in (
            'woCustomerCategory', 'woDocumentNumber', 'woCustomerId', 'woCustomerName', 'woContactName',
            'woEmailAddress', 'woMobileNumber', 'woPhoneNumber', 'woWorkNumber', 'woDateOfSale', 'woOrderId',
            'woOrderProtocol', 'woOrderDetail', 'woCnlAcronym', 'woCity', 'woNeighborhood', 'woStateOrProvince',
            'woStreetCode', 'woStreetName', 'woStreetNr', 'woLongitude', 'woLatitude', 'woComplement', 'woProductId',
            'woDetail', 'woAddressReference')],
        var('slotBuscaInicio', '', 'Gerado pelo INT11.'),
        var('slotBuscaFim', '', 'Gerado pelo INT11.'),
        var('slotInicio', '', 'Primeiro horário do INT11 (ou preencha à mão).'),
        var('slotFim', ''),
        var('slotTimeslot', ''),
        var('slotResourceId', ''),
        var('slotResourceName', ''),
        var('slotScheduleDate', '', 'Data do primeiro horário (aaaa-mm-dd), usada em scheduleDate do INT14.'),
        var('slotData', ''),
        var('woIdJornada', '', 'Gerado pelo INT14.'),
        var('woNumero', '', 'Id da WO devolvido pelo INT14 (usado no INT18 e no INT16).'),
        var('fenix_auth_token_url', base_vars['fenix_auth_token_url']['value'],
            'Mesmo token da collection Fenix - VE. A fachada e o motor validam com o JWKS do OAM interno '
            '(autenticainthml.redecorp.br); se a fachada responder 401, use o endpoint '
            'https://autenticainthml.redecorp.br/ms_oauth/oauth2/endpoints/vivooauthservice/tokens.'),
        var('fenix_auth_domain', base_vars['fenix_auth_domain']['value']),
        var('fenix_auth_basic_credentials', '', 'Copie o valor da collection Fenix - VE (client_id:secret em base64).'),
        var('fenix_auth_username', ''),
        var('fenix_auth_password', ''),
        var('fenix_auth_scope', base_vars['fenix_auth_scope']['value']),
        var('fenix_access_token', ''),
        var('fenix_token_expires_at', '0'),
    ],
    'item': [
        {'name': '00 - Autenticacao', 'item': [token_item]},
        {'name': '01 - Jornada', 'item': [
            start,
            request('02 - Consultar instância (tela atual)', 'GET', '/process-instance/{{processInstanceId}}',
                    description='Relê a instância e a tela atual. Útil depois da espera do diagnóstico.'),
            request('03 - Voltar uma tela', 'POST', '/process-instance/{{processInstanceId}}/return', {},
                    'Volta para a tela anterior (pilha de navegação do motor).'),
            request('04 - Variáveis da instância', 'GET', '/process-instance/{{processInstanceId}}/variables',
                    description='Variáveis data_* e form_* gravadas pelo fluxo.'),
            request('05 - Cancelar instância', 'POST', '/process-instance/{{processInstanceId}}/cancel',
                    {'reason': 'teste postman'}, 'Encerra a instância de teste.'),
        ]},
        {'name': '02 - Responder tela atual (genérico)', 'item': [
            request('Avançar com answers livres', 'POST', '/process-instance/{{processInstanceId}}/advance',
                    {'trigger': 'user-action', 'answers': {}},
                    'Edite answers com os campos da tela atual (sem o prefixo form_).'),
        ]},
        {'name': '03 - Respostas por tela', 'item': answer_items},
        {'name': '04 - Integrações da jornada (chamadas diretas)',
         'description': ('As mesmas chamadas que o motor faz em cada etapa (método, path, headers e corpo), com as URLs '
                         'de preprod e o token da collection. INT14, INT18 e INT16 criam ou cancelam registros reais. '
                         'Ordem sugerida: INT01, INT03, INT06, INT11, INT14, INT18, INT16. TMF653 e INT10 são de apoio: '
                         'o retorno do diagnóstico se valida no Kafka (tópico '
                         'telco.service.servicetestmanagement.servicetestresult).'),
         'item': integration_items},
    ],
}

OUT.write_text(json.dumps(collection, ensure_ascii=False, indent=2) + '\n', 'utf-8')
print(f'{OUT} | {len(answer_items)} respostas por tela')
