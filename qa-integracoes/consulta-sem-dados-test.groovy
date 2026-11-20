import javax.xml.parsers.DocumentBuilderFactory
import groovy.json.JsonOutput

def document = DocumentBuilderFactory.newInstance().newDocumentBuilder()
    .parse(new File('fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn'))
def elements = document.getElementsByTagName('*')
def elementById = { String id ->
    (0..<elements.length).collect { elements.item(it) }.find { it.getAttribute('id') == id }
}
def scriptFor = { String id ->
    elementById(id).getElementsByTagName('bpmn:script').item(0).textContent
}
def evaluate = { String script, Map variables ->
    def execution = [
        getVariable: { String name -> variables[name] },
        setVariable: { String name, Object value -> variables[name] = value }
    ]
    new GroovyShell(new Binding([execution: execution])).evaluate(script)
}
def generator = new File('skills/gerar_fenix_ve_abertura_bd.py').getText('UTF-8')
def configurations = [
    [task: 'Massiva', suffix: 'Massiva', constant: 'TRATA_MASSIVA', okStatuses: [200],
     start: 'def formatarData', fields: ['data_massivaProtocolo', 'data_massivaPrevisaoConclusao'],
     active: [incidents: [[status: 'OPEN', incidentId: 'MASSIVA-1']]],
     closed: [incidents: [[status: 'CLOSED', incidentId: 'MASSIVA-1']]],
     empty: [incidents: []], flow: 'Flow_DecMassivaOk_ConsultaBD', target: 'Node_ConsultaBD'],
    [task: 'BD', suffix: 'BD', constant: 'TRATA_BD', okStatuses: [200, 206],
     start: 'def caracteristica', fields: ['data_bdNumero', 'data_bdProtocoloAtendimento', 'data_bdPrevisaoConclusao'],
     active: [[status: 'Active', id: 'BD-1']], closed: [[status: 'closed', id: 'BD-1']],
     empty: [], flow: 'Flow_DecBDOk_AvaliaImpedimentos', target: 'Node_AvaliaImpedimentos']
]
def scenarios = 0
configurations.each { configuration ->
    def script = scriptFor('Node_Trata' + configuration.task)
    def generated = generator.split(configuration.constant + " = LER_JSON \\+ '''", 2)[1].split("'''", 2)[0]
    assert script.substring(script.indexOf(configuration.start)).trim() == generated.trim()
    def flow = elementById(configuration.flow)
    assert flow.getAttribute('targetRef') == configuration.target
    def condition = flow.getElementsByTagName('bpmn:conditionExpression').item(0).textContent.trim()
    [200, 206, 400, 404, 401, 403, 500, 502, 503].each { status ->
        [null, '', ' \t\r\n ', '[]', '{}', 'null', '{"error":"invalid request"}'].each { body ->
            def variables = [
                ('Node_Consulta' + configuration.task + '-status'): status,
                ('Node_Consulta' + configuration.task + '-response'): body,
                ('data_tem' + configuration.suffix): true
            ]
            configuration.fields.each { variables[it] = 'STALE' }
            evaluate(script, variables)
            def expectedOk = status in configuration.okStatuses
            assert variables['data_consulta' + configuration.task + 'Ok'] == expectedOk
            assert variables['data_tem' + configuration.suffix] == false
            configuration.fields.each { assert variables[it] == null }
            def routeVariables = new Binding([execution: [getVariable: { String name -> variables[name] }]])
            assert new GroovyShell(routeVariables).evaluate(condition.substring(2, condition.length() - 1)) == expectedOk
            scenarios++
        }
    }
    def listaStatus = configuration.okStatuses
    [listaStatus, [[configuration.active, true], [configuration.closed, false], [configuration.empty, false]]].combinations().each { sampleStatus, sample ->
        def variables = [
            ('Node_Consulta' + configuration.task + '-status'): sampleStatus,
            ('Node_Consulta' + configuration.task + '-response'): JsonOutput.toJson(sample[0])
        ]
        evaluate(script, variables)
        assert variables['data_consulta' + configuration.task + 'Ok'] == true
        assert variables['data_tem' + configuration.suffix] == sample[1]
        if (sample[1]) {
            assert variables[configuration.fields[0]] == (configuration.task == 'BD' ? 'BD-1' : 'MASSIVA-1')
        }
        scenarios++
    }
}
def variables = [data_productStatus: 'ativo']
configurations.each { configuration ->
    variables['Node_Consulta' + configuration.task + '-status'] = 200
    variables['Node_Consulta' + configuration.task + '-response'] = ''
    evaluate(scriptFor('Node_Trata' + configuration.task), variables)
}
evaluate(scriptFor('Node_AvaliaImpedimentos'), variables)
assert variables.data_impedimento == 'NENHUM'
assert variables.data_bloqueioFinanceiro == false
def parameters = elementById('Node_ConsultaBD').getElementsByTagName('camunda:inputParameter')
def pathParameter = (0..<parameters.length).collect { parameters.item(it) }.find { it.getAttribute('name') == 'path' }
def pathScript = pathParameter.getElementsByTagName('camunda:script').item(0).textContent
def pathBinding = new Binding([execution: [getVariable: { String name ->
    assert name == 'data_designador'
    'SPO-SF703229-069'
}]])
def path = new GroovyShell(pathBinding).evaluate(pathScript)
assert 'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1' + path ==
    'https://api-hml.telefonica.com.br/serviceNowTroubleTicket/v1/troubleTicket?ticketType=Case&sys_class_name=sn_sprb_mgmt_case&active=true&correlation_display=SPO-SF703229-069'
[
    [corpo: '{"code":60,"reason":"Resource not found","message":"No Record found for given filter criteria"}', ok: true],
    [corpo: '{"code":"60","reason":"Resource not found"}', ok: true],
    [corpo: '{"code":61,"reason":"Resource not found"}', ok: false],
    [corpo: '<html>Not Found</html>', ok: false],
].each { caso ->
    def vars = ['Node_ConsultaBD-status': 404, 'Node_ConsultaBD-response': caso.corpo, data_temBD: true]
    evaluate(scriptFor('Node_TrataBD'), vars)
    assert vars.data_consultaBDOk == caso.ok: caso.corpo
    assert vars.data_temBD == false
    scenarios++
}
def pathScriptFor = { String id ->
    def params = elementById(id).getElementsByTagName('camunda:inputParameter')
    (0..<params.length).collect { params.item(it) }.find { it.getAttribute('name') == 'path' }
        .getElementsByTagName('camunda:script').item(0).textContent
}
def obrigatorias = [
    [script: pathScriptFor('Node_ConsultaMassiva'), variable: 'data_designador', task: 'Consulta Massiva/Manutenção (INT01)', label: 'designador'],
    [script: pathScriptFor('Node_ConsultaBD'), variable: 'data_designador', task: 'Consulta BD aberto (INT03)', label: 'designador'],
    [script: scriptFor('Node_AvaliaImpedimentos'), variable: 'data_productStatus', task: 'Avalia impedimentos', label: 'productStatus']
]
obrigatorias.each { caso ->
    [null, '', '   '].each { valor ->
        try {
            evaluate(caso.script, [(caso.variable): valor])
            assert false: "${caso.task} deveria rejeitar ${caso.variable}=${valor}"
        } catch (IllegalArgumentException e) {
            assert e.message == "${caso.label} deve ser informado para execução da task ${caso.task}"
        }
        scenarios++
    }
}
def hpsdParams = elementById('Node_SolicitaDiagnostico').getElementsByTagName('camunda:inputParameter')
def hpsdBodyScript = (0..<hpsdParams.length).collect { hpsdParams.item(it) }.find { it.getAttribute('name') == 'bodyTemplate' }
    .getElementsByTagName('camunda:script').item(0).textContent
def hpsdBody = new groovy.json.JsonSlurper().parseText(new GroovyShell(new Binding([execution: [
    getVariable: { String name -> [data_designador: 'SPO-SF703229-069'][name] },
    getProcessInstanceId: { 'PI-1' }
]])).evaluate(hpsdBodyScript))
assert hpsdBody.name == 'Diagnostic-FTTH-Automatic' && hpsdBody.mode == 'ONDEMAND'
assert hpsdBody.testSpecification == [id: 'spec-ftth-gpon-basico', '@referredType': 'ServiceTestSpecification']
assert hpsdBody.relatedService == [id: 'SPO-SF703229-069', name: 'Internet', '@referredType': 'Service']
assert hpsdBody.relatedParty*.role == ['AccessDesignator', 'SistemaOrigem', 'ExternalId']
assert hpsdBody.relatedParty*.id == ['SPO-SF703229-069', 'ServiceNow', 'PI-1']
assert hpsdBody.characteristic == [[name: 'executionMode', value: 'AUTOMATIC']]
scenarios++
def condicao = { String flowId ->
    def c = elementById(flowId).getElementsByTagName('bpmn:conditionExpression').item(0).textContent.trim()
    c.substring(2, c.length() - 1)
}
def woCasos = [
    [200, [idWorkOrder: 'VE-1', idWorkOrderItem: 'VE-1:1', idWork: '311'], true, 'VE-1', null],
    [200, [idWorkOrderItem: 'VE-1:1'], false, 'VE-JORNADA', 'HTTP 200 sem idWorkOrder'],
    [200, [idWorkOrder: 'VE-1'], false, 'VE-1', 'HTTP 200 sem idWorkOrderItem'],
    [200, [:], false, 'VE-JORNADA', 'HTTP 200 sem idWorkOrder e idWorkOrderItem'],
    [201, [idWorkOrder: 'VE-1', idWorkOrderItem: 'VE-1:1'], false, 'VE-1', 'HTTP 201'],
    [500, [origin: 'TMF-697-v2', code: '500', reason: 'Erro não mapeado'], false, 'VE-JORNADA', '500 | Erro não mapeado | TMF-697-v2'],
]
woCasos.each { status, corpo, criada, numero, erro ->
    def woVars = ['Node_CriaWO-status': status, 'Node_CriaWO-response': JsonOutput.toJson(corpo), data_woIdJornada: 'VE-JORNADA']
    evaluate(scriptFor('Node_TrataWO'), woVars)
    assert woVars.data_woCriada == criada
    assert woVars.data_woNumero == numero
    assert woVars.data_woErro == erro
    def rota = new GroovyShell(new Binding([execution: [getVariable: { String n -> woVars[n] }]]))
    assert rota.evaluate(condicao('Flow_DecWOCriada_CriaBD')) == criada
    if (!criada) { assert rota.evaluate(condicao('Flow_DecWOIdentificadaFalha_CancelaWOAgendamento')) == true }
    scenarios++
}
def bdParams = elementById('Node_CriaBD').getElementsByTagName('camunda:inputParameter')
def bdBodyScript = (0..<bdParams.length).collect { bdParams.item(it) }.find { it.getAttribute('name') == 'bodyTemplate' }
    .getElementsByTagName('camunda:script').item(0).textContent
def bdVars = [data_slotEscolhido: JsonOutput.toJson([start: '2026-12-01T13:30:00.000-03:00', end: '2026-12-01T15:30:00.000-03:00']),
              data_designador: 'SPO-SF703229-069', data_woNumero: 'VE-1', data_woItemId: 'VE-1:1', data_resumoDiagnostico: '{"httpStatus":200}',
              data_wo_customerId: '001W40000177WzdIAE', data_wo_customerName: 'CLIENTE', data_wo_emailAddress: 'a@b.invalid',
              data_wo_mobileNumber: '11900000000', data_wo_city: 'São Paulo', data_wo_stateOrProvince: 'SP', data_wfmPostcode: '04582030',
              data_bd_city: 'SOBRESCRITA', data_bd_productInventoryId: 'PI', data_bd_relatedServiceId: 'RS', data_bd_relatedServiceSpecificationId: 'RSS']
def bdBody = new groovy.json.JsonSlurper().parseText(new GroovyShell(new Binding([execution: [getVariable: { String n -> bdVars[n] }]])).evaluate(bdBodyScript))
assert bdBody['@type'] == 'TroubleTicket' && bdBody.channel == ['@type': 'ServiceProblemCase', name: 'Alert']
assert bdBody.troubleTicketCharacteristic.size() == 36
def bdCarac = bdBody.troubleTicketCharacteristic.collectEntries { [it.name, it.value] }
assert bdCarac.city == 'SOBRESCRITA' && bdCarac.estadoDescricao == 'SP' && bdCarac.postcode == '04582030'
assert bdCarac.WorkOrder == 'VE-1' && bdCarac.WorkOrderItem == 'VE-1:1' && bdCarac.etapa == 'TRIAGEM'
assert bdCarac.previsaoAtendimento == '01/12/2026 13:30-15:30' && bdCarac.telefoneContatoLocal1 == '11900000000'
assert bdCarac.SLA == '' && bdCarac.idAppointment == ''
assert bdBody.relatedParty[0].partyOrPartyRole.id == '001W40000177WzdIAE' && bdBody.relatedParty[0].role == 'Digital'
assert bdBody.relatedParty[0].partyOrPartyRole.characteristic*.name == ['EmailContactMedium', 'PhoneContactMedium']
assert bdBody.relatedEntity*.entity*.name == ['ProductInventory', 'testSpecification', 'relatedServiceSpecification', 'relatedService', 'mode']
scenarios++
['Node_CancelaWOAgendamento', 'Node_CancelaWO'].each { cancela ->
    def params = elementById(cancela).getElementsByTagName('camunda:inputParameter')
    def script = { String nome -> (0..<params.length).collect { params.item(it) }.find { it.getAttribute('name') == nome }
        .getElementsByTagName('camunda:script').item(0).textContent }
    def cancelVars = [data_woNumero: 'VE-1/2', data_wo_cancelReason: 'IGNORADO', data_correlationId: 'CID-1', _authorizationHeader: 'Bearer X']
    def shell = new GroovyShell(new Binding([execution: [getVariable: { String n -> cancelVars[n] }]]))
    assert shell.evaluate(script('path')) == '/workOrder/VE-1%2F2?reason=PROBLEMAS+SISTEMICOS&context=SISTEMICO'
    def headers = new groovy.json.JsonSlurper().parseText(shell.evaluate(script('headers')))
    assert !headers.containsKey('Content-Type') && headers.flow == 'B2B_MASSIVO' && headers.requestSystem == 'MVE'
    assert headers['X-Vivo-Transaction-Id'].startsWith('TID_ELJY_FTAT933INT008_') && headers['X-Vivo-Correlation-Id'] == 'CID-1'
    scenarios++
}
println "OK: ${scenarios + 2} cenarios; BD, massiva, gateways, URL, entradas obrigatórias, corpo INT06, resposta INT14, corpo INT18, cancelamento INT16, limpeza de dados e gerador validados."