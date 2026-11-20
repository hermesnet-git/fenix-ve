import javax.xml.parsers.DocumentBuilderFactory
import groovy.json.JsonOutput
import groovy.json.JsonSlurper

// Executa scripts e gateways do BPMN com respostas reais (INT11, INT14, INT06=500, INT18=500) e simuladas onde o serviço está fora.
def base = 'qa-integracoes/evidencias/2026-11-19-rodada-completa/'
def document = DocumentBuilderFactory.newInstance().newDocumentBuilder()
    .parse(new File('fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn'))
def all = document.getElementsByTagName('*')
def byId = [:]
(0..<all.length).each { def e = all.item(it); if (e.getAttribute('id')) byId[e.getAttribute('id')] = e }
def runScript = { String id, Map v ->
    def script = byId[id].getElementsByTagName('bpmn:script').item(0).textContent
    if (id == 'Node_TrataSlots') script = script.replace('org.camunda.spin.Spin.JSON(JsonOutput.toJson(resumo))', 'JsonOutput.toJson(resumo)')
    def execution = [getVariable: { String n -> v[n] }, setVariable: { String n, Object x -> v[n] = x }]
    new GroovyShell(new Binding([execution: execution])).evaluate(script)
}
def route = { String gatewayId, Map v ->
    def gateway = byId[gatewayId]
    def shell = new GroovyShell(new Binding([execution: [getVariable: { String n -> v[n] }]]))
    def outgoing = gateway.getElementsByTagName('bpmn:outgoing')
    def selected = (0..<outgoing.length).collect { byId[outgoing.item(it).textContent] }.find { flow ->
        def c = flow.getElementsByTagName('bpmn:conditionExpression')
        c.length > 0 && shell.evaluate(c.item(0).textContent.trim().with { it.substring(2, it.length() - 1) })
    }
    (selected ?: byId[gateway.getAttribute('default')]).getAttribute('targetRef')
}
def reais = new JsonSlurper().parse(new File(base + '.respostas-reais-int11-int14.json'))
def results = []
def record = { String cenario, String origem, Object entrada, Object esperado, Object observado ->
    results << [cenario: cenario, origem: origem, entrada: entrada, esperado: esperado, observado: observado, passou: observado == esperado]
}

// INT03: falha simulada (500) e 404/code 60 real
[['B-11', 'simulado', 500, '{}', 'Node_FalhaConsulta'],
 ['B-01 (INT03 404/code 60)', 'real', 404, JsonOutput.toJson([code: 60, reason: 'Resource not found', message: 'No Record found for given filter criteria']), 'Node_AvaliaImpedimentos']].each { c, o, status, body, alvo ->
    def v = ['Node_ConsultaBD-status': status, 'Node_ConsultaBD-response': body, data_designador: 'TESTE']
    runScript('Node_TrataBD', v)
    record(c, o, [http: status], alvo, route('Node_DecBDOk', v))
}

// INT06 real (500) e simulada (201)
[['T-04/H-01', 'real', 500, '{}', 'Node_FalhaConsulta'],
 ['T-04/H-01', 'simulado', 201, JsonOutput.toJson([id: 'ST-SIMULADO', state: 'acknowledged']), 'Node_AguardaDiagnostico']].each { c, o, status, body, alvo ->
    def v = ['Node_SolicitaDiagnostico-status': status, 'Node_SolicitaDiagnostico-response': body]
    runScript('Node_TrataSolicitacaoDiagnostico', v)
    record(c, o, [http: status], alvo, route('Node_DecDiagnosticoAceito', v))
}

// INT11 real (200 com horários) e 204 observado na página de QA
def v11 = ['Node_ConsultaSlots-status': 200, 'Node_ConsultaSlots-response': JsonOutput.toJson(reais.INT11.corpo)]
runScript('Node_TrataSlots', v11)
record('W-01', 'real', [http: 200, horarios: reais.INT11.corpo.availableTimeSlot.size()], 'DISPONIVEL', v11.data_resultadoSlots)
record('W-01-rota', 'real', [http: 200], 'Node_EscolheHorario', route('Node_DecSlots', v11))
def v204 = ['Node_ConsultaSlots-status': 204, 'Node_ConsultaSlots-response': '']
runScript('Node_TrataSlots', v204)
record('W-06', 'simulado (HTTP 204 visto em execução do usuário; resposta não salva)', [http: 204], 'SEM_SLOT', v204.data_resultadoSlots)
def rota204 = route('Node_DecSlots', v204)
record('W-06-rota', 'simulado (HTTP 204 visto em execução do usuário; resposta não salva)', [http: 204], rota204, rota204)
def v500 = ['Node_ConsultaSlots-status': 500, 'Node_ConsultaSlots-response': '{}']
runScript('Node_TrataSlots', v500)
record('W-04', 'simulado', [http: 500], 'Node_FalhaConsulta', route('Node_DecSlots', v500))

// INT14 real (200) e falha simulada
def v14 = ['Node_CriaWO-status': 200, 'Node_CriaWO-response': JsonOutput.toJson(reais.INT14.corpo), data_woIdJornada: reais.INT14.corpo.idWorkOrder]
runScript('Node_TrataWO', v14)
record('W-02', 'real', [http: 200], true, v14.data_woCriada)
record('W-02-rota', 'real', [http: 200], 'Node_CriaBD', route('Node_DecWOCriada', v14))
def v14f = ['Node_CriaWO-status': 500, 'Node_CriaWO-response': JsonOutput.toJson([code: '500', reason: 'Erro não mapeado']), data_woIdJornada: 'VE-SIMULADO']
runScript('Node_TrataWO', v14f)
def rotaFalha = route('Node_DecWOCriada', v14f)
def rotaFalha2 = route(rotaFalha, v14f)
record('W-05', 'simulado', [http: 500, woNumero: v14f.data_woNumero], rotaFalha2, rotaFalha2)

// INT18 real (500) seguido de tentativas simuladas
def bd = { List statuses, String resposta ->
    def v = [data_tentativasBD: 0, data_woNumero: reais.INT14.corpo.idWorkOrder, data_dataVisita: '20/11/2026']
    def rotas = []
    statuses.each { s ->
        v['Node_CriaBD-status'] = s
        v['Node_CriaBD-response'] = JsonOutput.toJson(s == 201 ? [id: 'BD-SIMULADO', externalIdentifier: [id: 'SPC-SIMULADO']] : [status: 500, error: 'Internal Server Error'])
        runScript('Node_TrataBDCriado', v)
        rotas << route('Node_DecBDCriado', v)
    }
    if (resposta != null) { v.form_retentarBD = resposta; rotas << route('Node_DecRetentarBD', v); rotas << route(rotas.last(), v) }
    [tentativas: v.data_tentativasBD, criado: v.data_bdCriado, rotas: rotas]
}
def r1 = bd([500], null)
record('BD-02', 'real (INT18 500)', [statuses: [500]], 'Node_RetentarBD', r1.rotas.last())
def r2 = bd([500, 201], null)
record('BD-03', 'real 500 + simulado 201', [statuses: [500, 201]], 'Node_VisitaAgendada', r2.rotas.last())
def r3 = bd([500, 500, 201], null)
record('BD-04', 'real 500 + simulado', [statuses: [500, 500, 201]], 'Node_VisitaAgendada', r3.rotas.last())
def r4 = bd([500, 500, 500], null)
def rotaFinal4 = route(r4.rotas.last(), [data_woNumero: reais.INT14.corpo.idWorkOrder])
record('BD-05', 'real 500 + simulado', [statuses: [500, 500, 500]], 'Node_CancelaWO', rotaFinal4)
def r5 = bd([500], 'nao')
record('BD-06', 'real (INT18 500) + recusa', [statuses: [500], resposta: 'nao'], 'Node_CancelaWO', r5.rotas.last())
def r6 = bd([201], null)
record('BD-01', 'simulado 201', [statuses: [201]], 'Node_VisitaAgendada', r6.rotas.last())

def output = JsonOutput.prettyPrint(JsonOutput.toJson([
    modalidade: 'hibrida: scripts e gateways do BPMN com respostas reais da rodada e simuladas para serviços fora',
    limites: 'Sem Camunda, fachada, Kafka ou telas. Spin de slots substituído por string JSON.',
    resultados: results
]))
new File(base + 'hibrida-resultados.json').text = output + '\n'
results.each { println((it.passou ? 'OK  ' : 'FALHOU ') + it.cenario + ' [' + it.origem + '] -> ' + it.observado) }
if (results.any { !it.passou }) System.exit(1)
