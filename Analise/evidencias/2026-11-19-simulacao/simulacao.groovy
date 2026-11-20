import javax.xml.parsers.DocumentBuilderFactory
import groovy.json.JsonOutput

def document = DocumentBuilderFactory.newInstance().newDocumentBuilder()
    .parse(new File('fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn'))
def elements = document.getElementsByTagName('*')
def element = { String id ->
    (0..<elements.length).collect { elements.item(it) }.find { it.getAttribute('id') == id }
}
def runScript = { String id, Map variables ->
    def script = element(id).getElementsByTagName('bpmn:script').item(0).textContent
    if (id == 'Node_TrataSlots') {
        script = script.replace('org.camunda.spin.Spin.JSON(JsonOutput.toJson(resumo))', 'JsonOutput.toJson(resumo)')
    }
    def execution = [getVariable: { String name -> variables[name] },
                     setVariable: { String name, Object value -> variables[name] = value }]
    new GroovyShell(new Binding([execution: execution])).evaluate(script)
}
def results = []
def record = { String scenario, Object input, Object expected, Object actual ->
    results << [cenario: scenario, entrada: input, esperado: expected, observado: actual, passou: actual == expected]
}
def route = { String gatewayId, Map variables ->
    def gateway = element(gatewayId)
    def outgoing = gateway.getElementsByTagName('bpmn:outgoing')
    def execution = [getVariable: { String name -> variables[name] }]
    def shell = new GroovyShell(new Binding([execution: execution]))
    def selected = null
    (0..<outgoing.length).each { index ->
        def flow = element(outgoing.item(index).textContent)
        def conditions = flow.getElementsByTagName('bpmn:conditionExpression')
        if (conditions.length > 0) {
            def expression = conditions.item(0).textContent.trim()
            if (shell.evaluate(expression.substring(2, expression.length() - 1))) selected = flow
        }
    }
    (selected ?: element(gateway.getAttribute('default'))).getAttribute('targetRef')
}
[
    ['B-01', false, false, 'Ativo', 'NENHUM'],
    ['B-02', true, false, 'bloqueio', 'MASSIVA_ATRASO'],
    ['B-03', true, true, 'Ativo', 'MASSIVA_VISITA'],
    ['B-04', true, false, 'Ativo', 'MASSIVA'],
    ['B-05', false, false, 'bloqueio', 'ATRASO'],
    ['B-06', false, true, 'Ativo', 'VISITA'],
    ['B-08', true, true, 'Ativo', 'MASSIVA_VISITA'],
    ['B-09', false, false, 'bloqueio', 'ATRASO']
].each { scenario, massiva, bd, status, expected ->
    def variables = [data_temMassiva: massiva, data_temBD: bd, data_productStatus: status]
    runScript('Node_AvaliaImpedimentos', variables)
    record(scenario, [massiva: massiva, bd: bd, productStatus: status], expected, variables.data_impedimento)
}
[['H-02', 'ID06', 'RESOLVIDO'], ['H-03', 'ID07', 'RESOLVIDO'],
 ['H-04', 'ID10', 'RESOLVIDO'], ['H-07', 'ID09', 'SEM_ENERGIA'],
 ['H-13', 'ID01', 'PERSISTE']].each { scenario, code, expected ->
    def variables = ['Node_ConsultaResultadoDiagnostico-status': 200,
                     'Node_ConsultaResultadoDiagnostico-response': JsonOutput.toJson([
                         characteristic: [[name: 'RESULTADO_DIAGNOSTICO', value: code]]])]
    runScript('Node_TrataResultadoDiagnostico', variables)
    record(scenario, code, expected, variables.data_resultadoDiagnostico)
    def target = expected == 'RESOLVIDO' ? 'Node_ReinicieNovamente' :
        (expected == 'SEM_ENERGIA' ? 'Node_SemEnergia' : 'Node_AgendarVisita')
    record(scenario + '-rota', code, target, route('Node_DecResultadoDiagnostico', variables))
}
[
    ['H-05', 'Node_DecVoltouNovamente', [form_voltouNovamente: 'sim'], 'Node_InternetVoltou'],
    ['H-06', 'Node_DecVoltouNovamente', [form_voltouNovamente: 'nao'], 'Node_AgendarVisita'],
    ['H-08', 'Node_DecEnergia', [form_acaoEnergia: 'nao_consigo'], 'Node_AgendarVisita'],
    ['H-09', 'Node_DecVoltouEnergia', [form_voltouEnergia: 'sim'], 'Node_InternetVoltou'],
    ['H-10', 'Node_DecVoltouEnergia', [form_voltouEnergia: 'nao'], 'Node_TemEnergia'],
    ['H-11', 'Node_DecTemEnergia', [form_temEnergia: 'nao'], 'Node_RedeEletrica'],
    ['H-12', 'Node_DecTemEnergia', [form_temEnergia: 'sim'], 'Node_AgendarVisita']
].each { scenario, gateway, input, target -> record(scenario, input, target, route(gateway, input)) }
def sampleSlot = [availableTimeSlot: [[id: 'TURNO', resourceId: 'RECURSO',
    validFor: [startDateTime: '2026-12-01T10:00:00-03:00', endDateTime: '2026-12-01T12:00:00-03:00']]]]
[['W-01', 200, JsonOutput.toJson(sampleSlot), 'DISPONIVEL'],
 ['W-06', 204, '', 'SEM_SLOT'], ['W-04', 500, '{}', 'FALHA']].each { scenario, status, body, expected ->
    def variables = ['Node_ConsultaSlots-status': status, 'Node_ConsultaSlots-response': body]
    runScript('Node_TrataSlots', variables)
    record(scenario, [http: status], expected, variables.data_resultadoSlots)
}
[['W-02', 200, [idWorkOrder: 'WO-TESTE', idWorkOrderItem: 'WO-TESTE:1'], true],
 ['W-05', 500, [code: '500', reason: 'Falha simulada'], false]].each { scenario, status, body, expected ->
    def variables = ['Node_CriaWO-status': status, 'Node_CriaWO-response': JsonOutput.toJson(body), data_woIdJornada: 'WO-TESTE']
    runScript('Node_TrataWO', variables)
    record(scenario, [http: status], expected, !!variables.data_woCriada)
}
[['BD-01', [201]], ['BD-02', [500]], ['BD-03', [500, 201]],
 ['BD-04', [500, 500, 201]], ['BD-05', [500, 500, 500]], ['BD-06', [500]]].each { scenario, statuses ->
    def variables = [data_tentativasBD: 0, data_dataVisita: '01/12/2026']
    statuses.each { status ->
        variables['Node_CriaBD-status'] = status
        variables['Node_CriaBD-response'] = JsonOutput.toJson(status == 201 ? [id: 'BD-TESTE', externalIdentifier: [id: 'PROTOCOLO-TESTE']] : [error: 'simulado'])
        runScript('Node_TrataBDCriado', variables)
    }
    def expected = [tentativas: statuses.size(), criado: statuses.last() == 201]
    def actual = [tentativas: variables.data_tentativasBD, criado: variables.data_bdCriado]
    record(scenario, [status: statuses], expected, actual)
    def target = expected.criado ? 'Node_VisitaAgendada' :
        (expected.tentativas < 3 ? 'Node_RetentarBD' : 'Node_DecWOIdentificadaBD')
    record(scenario + '-rota', [status: statuses], target, route('Node_DecBDCriado', variables))
}
def output = JsonOutput.prettyPrint(JsonOutput.toJson([
    modalidade: 'offline_simulado', bpmn: 'fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn',
    limites: 'Scripts isolados; sem Camunda, fachada, Kafka, WFM ou telas. Spin de slots substituído por string JSON.',
    resultados: results
]))
new File('Analise/evidencias/2026-11-19-simulacao/resultados.json').text = output + '\n'
println output
if (results.any { !it.passou }) System.exit(1)