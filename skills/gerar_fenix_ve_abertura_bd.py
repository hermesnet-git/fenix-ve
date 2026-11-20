#!/usr/bin/env python3
"""Gera a jornada FTAT-933 "Abertura de BD pelo VE" para o wf-journey-motor-v1 + ms-journey-v1.

Saídas:
  - fenix-ve-abertura-bd.bpmn (raiz do Fenix-VE e src/main/resources/process do motor)
  - R__fenix_ve_abertura_bd_telas.sql (Flyway do ms-journey-v1, schema espec_registry: chave do processo, snapshot
    e telas)
  - fenix-ve-abertura-bd-v1/ (manifest, snapshot e screens no formato do importador do ms-journey-v1)

As telas reaproveitam o export do Journey Admin (fenix-abertura-de-bd-v1/screens.json), mas a jornada é própria
(journey_id e versão próprios); só as telas que o fluxo das US exige e que não existem no export são criadas aqui.

Uso: python3 skills/gerar_fenix_ve_abertura_bd.py
"""
import hashlib
import json
import subprocess
import uuid
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

ROOT = Path(__file__).resolve().parents[1]
REPOS = Path('/Users/hermes/desenv/elastic-journey/comp-workspace-journey/Journey/repos')
EXPORT = ROOT / 'fenix-abertura-de-bd-v1'
BPMN_TARGETS = [ROOT / 'fenix-ve-abertura-bd.bpmn',
                REPOS / 'wf-journey-motor-v1/src/main/resources/process/fenix-ve-abertura-bd.bpmn']
FLYWAY_SQL = REPOS / 'ms-journey-v1/src/main/resources/db/specregistry/R__fenix_ve_abertura_bd_telas.sql'

JOURNEY_ID = 'a33acd94-31d3-401e-b8cd-f50506e45667'
JOURNEY_NAME = 'Fenix - Abertura de BD'
VERSION = 1
VERSION_TAG = f'v{VERSION}'
# Fora da convenção Journey_<uuid>: a fachada acha a jornada por espec_registry.process_key.
PROCESS_KEY = 'fenix-ve-abertura-bd'
PACKAGE = ROOT / f'{PROCESS_KEY}-v{VERSION}'
PUBLISHED_AT = '2026-11-09T12:00:00Z'
HPSD_TOPIC = 'telco.service.servicetestmanagement.servicetestresult'
NS = uuid.UUID(JOURNEY_ID)

# ------------------------------------------------------------------------------------------------
# Trechos Groovy
# ------------------------------------------------------------------------------------------------
TID = ("java.time.format.DateTimeFormatter.ofPattern(\"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'\")"
       ".withZone(java.time.ZoneOffset.UTC).format(java.time.Instant.now())")


def headers_script(extra_lines=(), content_type=False, tid=None, correlation=True, uuid_ids=False):
    lines = ['import groovy.json.JsonOutput', "def h = ['Accept': 'application/json']"]
    if content_type:
        lines.append("h['Content-Type'] = 'application/json'")
    lines.extend(extra_lines)
    if uuid_ids:
        # TMF653 (OpenAPI GTW Redes) exige UUID v4 nos dois headers.
        lines.append("h['X-Vivo-Transaction-Id'] = UUID.randomUUID().toString()")
        lines.append("h['X-Vivo-Correlation-Id'] = UUID.randomUUID().toString()")
    else:
        if tid:
            lines.append(f"h['X-Vivo-Transaction-Id'] = 'TID_ELJY_FTAT933{tid}_' + {TID}")
        if correlation:
            lines.append("def cid = execution.getVariable('data_correlationId')")
            lines.append("if (cid) { h['X-Vivo-Correlation-Id'] = cid.toString() }")
    lines.append("def auth = execution.getVariable('_authorizationHeader')")
    lines.append("if (auth) { h['Authorization'] = auth.toString() }")
    lines.append('JsonOutput.toJson(h)')
    return '\n'.join(lines)


LER_JSON = '''import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import java.time.*
import java.time.format.DateTimeFormatter

def lerJson(Object texto) {
    if (texto == null || texto.toString().trim().isEmpty()) { return null }
    try { return new JsonSlurper().parseText(texto.toString()) } catch (Exception e) { return null }
}
'''

TRATA_MASSIVA = LER_JSON + '''
def formatarData(Object valor) {
    if (valor == null || valor.toString().trim().isEmpty()) { return null }
    def texto = valor.toString().trim()
    def fmt = DateTimeFormatter.ofPattern("dd/MM 'às' HH'h'mm")
    try { return OffsetDateTime.parse(texto).atZoneSameInstant(ZoneId.of('America/Sao_Paulo')).format(fmt) } catch (Exception ignored) { }
    try { return LocalDateTime.parse(texto).format(fmt) } catch (Exception ignored) { }
    return texto
}

def status = execution.getVariable('Node_ConsultaMassiva-status')
def ok = false
def abertas = []
if (status == 200) {
    ok = true
    def json = lerJson(execution.getVariable('Node_ConsultaMassiva-response'))
    def incidentes = (json instanceof Map && json.incidents instanceof List) ? json.incidents : []
    abertas = incidentes.findAll { it instanceof Map && !'CLOSED'.equalsIgnoreCase(String.valueOf(it.status)) }
}
def massiva = abertas ? abertas[0] : null
execution.setVariable('data_consultaMassivaOk', ok)
execution.setVariable('data_temMassiva', massiva != null)
execution.setVariable('data_massivaProtocolo', massiva?.incidentId?.toString())
execution.setVariable('data_massivaPrevisaoConclusao', formatarData(massiva?.expectedResolutionDate))
'''

TRATA_BD = LER_JSON + '''
def caracteristica(Object ticket, String nome) {
    def lista = (ticket instanceof Map && ticket.relatedEntity instanceof List) ? ticket.relatedEntity : []
    for (item in lista) {
        if (!(item instanceof Map)) { continue }
        def alvo = item.entity instanceof Map ? item.entity : item
        if (nome.equalsIgnoreCase(String.valueOf(alvo.name))) { return alvo.id?.toString() }
    }
    return null
}

def status = execution.getVariable('Node_ConsultaBD-status')
def json = lerJson(execution.getVariable('Node_ConsultaBD-response'))
def ok = false
def ticket = null
if (status == 200 || status == 206) {
    ok = true
    def lista = json instanceof List ? json : []
    ticket = lista.find { it instanceof Map && !(String.valueOf(it.status).toLowerCase() in ['closed', 'cancelled', 'canceled', 'resolved']) }
} else if (status == 404 && json instanceof Map && String.valueOf(json.code) == '60') {
    // 404 com code 60 ("No Record found for given filter criteria") = nenhum BD aberto para o designador.
    ok = true
}
execution.setVariable('data_consultaBDOk', ok)
execution.setVariable('data_temBD', ticket != null)
execution.setVariable('data_bdNumero', ticket?.id?.toString())
execution.setVariable('data_bdProtocoloAtendimento', caracteristica(ticket, 'number') ?: ticket?.externalIdentifier?.id?.toString())
execution.setVariable('data_bdPrevisaoConclusao', caracteristica(ticket, 'ets'))
'''

AVALIA_IMPEDIMENTOS = '''def productStatus = execution.getVariable('data_productStatus')
if (productStatus == null || productStatus.toString().trim().isEmpty()) { throw new IllegalArgumentException('productStatus deve ser informado para execução da task Avalia impedimentos') }
def massiva = execution.getVariable('data_temMassiva') == true
def bd = execution.getVariable('data_temBD') == true
def fatura = 'bloqueio'.equalsIgnoreCase(productStatus.toString().trim())
def impedimento = 'NENHUM'
if (massiva && fatura) {
    impedimento = 'MASSIVA_ATRASO'
} else if (massiva && bd) {
    impedimento = 'MASSIVA_VISITA'
} else if (massiva) {
    impedimento = 'MASSIVA'
} else if (fatura) {
    impedimento = 'ATRASO'
} else if (bd) {
    impedimento = 'VISITA'
}
execution.setVariable('data_bloqueioFinanceiro', fatura)
execution.setVariable('data_impedimento', impedimento)
'''

BODY_HPSD = '''import groovy.json.JsonOutput
// Valores fixos do exemplo da aba Camunda x HPSD - Request (PreDataMapping Diagnóstico Automático v2.0).
def designador = execution.getVariable('data_designador')?.toString()
def servico = (execution.getVariable('data_hpsdRelatedServiceId') ?: designador)?.toString()
def body = [
    name: 'Diagnostic-FTTH-Automatic',
    mode: 'ONDEMAND',
    relatedParty: [
        [role: 'AccessDesignator', id: designador],
        [role: 'SistemaOrigem', id: 'ServiceNow', '@referredType': 'Organization'],
        [role: 'ExternalId', id: execution.getProcessInstanceId()]
    ],
    relatedService: [id: servico, name: 'Internet', '@referredType': 'Service'],
    testSpecification: [id: 'spec-ftth-gpon-basico', '@referredType': 'ServiceTestSpecification'],
    characteristic: [[name: 'executionMode', value: 'AUTOMATIC']]
]
JsonOutput.toJson(body)'''

TRATA_SOLICITACAO_DIAGNOSTICO = LER_JSON + '''
def status = execution.getVariable('Node_SolicitaDiagnostico-status')
def json = lerJson(execution.getVariable('Node_SolicitaDiagnostico-response'))
def ok = status in [200, 201, 202]
execution.setVariable('data_diagnosticoSolicitado', ok)
execution.setVariable('data_diagnosticoServiceTestId', (ok && json instanceof Map) ? json.id?.toString() : null)
'''

PATH_RESULTADO = ("'/serviceTest/' + java.net.URLEncoder.encode("
                  "(execution.getVariable('data_diagnosticoServiceTestId') ?: 'sem-id').toString(), 'UTF-8')")

TRATA_RESULTADO_DIAGNOSTICO = LER_JSON + '''
def extrairId(Object valor) {
    if (valor == null) { return null }
    def m = (valor.toString() =~ /(?i)\\bID\\s*[:\\-]?\\s*0*(\\d{1,2})\\b/)
    return m.find() ? String.format('%02d', Integer.parseInt(m.group(1))) : null
}

def status = execution.getVariable('Node_ConsultaResultadoDiagnostico-status')
def json = lerJson(execution.getVariable('Node_ConsultaResultadoDiagnostico-response'))
def id = null
if (status == 200 && json instanceof Map) {
    def caracteristicas = json.characteristic instanceof List ? json.characteristic : []
    id = extrairId(caracteristicas.find { it instanceof Map && 'RESULTADO_DIAGNOSTICO'.equalsIgnoreCase(String.valueOf(it.name)) }?.value)
    if (!id && json.testMeasure instanceof List) {
        for (medida in json.testMeasure) {
            def valor = (medida instanceof Map && medida.value instanceof Map) ? medida.value.value : null
            if (valor instanceof Map) {
                id = extrairId(valor.resultado_diagnostico)
                if (id) { break }
            }
        }
    }
}
def resultado = id in ['06', '07', '10'] ? 'RESOLVIDO' : (id == '09' ? 'SEM_ENERGIA' : 'PERSISTE')
execution.setVariable('data_idRetorno', id)
execution.setVariable('data_resultadoDiagnostico', resultado)
// Resumo (e não o payload inteiro): variável String do Camunda tem limite de 4000 caracteres.
execution.setVariable('data_resumoDiagnostico', JsonOutput.toJson([
    serviceTestId: execution.getVariable('data_diagnosticoServiceTestId'),
    httpStatus: status,
    state: json instanceof Map ? json.state?.toString() : null,
    resultadoDiagnostico: id ? 'ID' + id : null
]))
'''

BODY_SLOTS = '''import groovy.json.JsonOutput
// Estrutura do exemplo WFM de 12/11/2026; origem de postcode, microArea e dados de rede pendente (P08).
def v = { String nome -> def x = execution.getVariable(nome); x == null ? null : x.toString() }
def zona = java.time.ZoneId.of('America/Sao_Paulo')
def hoje = java.time.LocalDate.now(zona)
def iso = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
def dono = v('data_wfmNetworkOwner') ?: 'VIVO1'
def endereco = [country: 'BR', postcode: v('data_wfmPostcode'), cnl: v('data_wfmCnl'), networkOwner: dono]
if (dono == 'VIVO1') {
    endereco.telephonicArea = v('data_wfmTelephonicArea')
    endereco.centralOffice = v('data_wfmCentralOffice')
    endereco.microArea = v('data_wfmMicroArea')
}
endereco.placePhysicalResourceAssoc = [resourceSpecificationCharacteristic: [[name: 'mediaType', value: v('data_wfmMediaType') ?: 'GPON']]]
endereco.geographicSite = ['@type': 'Cabinet']
if (v('data_wfmGeographicSiteId')) { endereco.geographicSite.id = v('data_wfmGeographicSiteId') }
def atendente = v('data_wfmAttendantId')
def body = [
    relatedEntity: atendente ? [[role: 'Ouvidoria', id: atendente, '@type': 'Attendant']] : [],
    relatedParty: [name: 'TT_B', role: 'acronym'],
    relatedPlace: [geographicAddress: endereco],
    requestedTimeSlot: [[validFor: [
        startDateTime: iso.format(hoje.plusDays(1).atStartOfDay(zona)),
        endDateTime: iso.format(hoje.plusDays(8).atStartOfDay(zona))]]]
]
JsonOutput.toJson(body)'''

TRATA_SLOTS = LER_JSON + '''
def zona = ZoneId.of('America/Sao_Paulo')
def dia = DateTimeFormatter.ofPattern('EEEE, dd/MM/yyyy', new Locale('pt', 'BR'))
def hora = DateTimeFormatter.ofPattern("HH'h'mm")
def status = execution.getVariable('Node_ConsultaSlots-status')
def json = lerJson(execution.getVariable('Node_ConsultaSlots-response'))
def slots = (status == 200 && json instanceof Map && json.availableTimeSlot instanceof List) ? json.availableTimeSlot : []
def resumo = []
def itens = []
slots.findAll { it instanceof Map && it.validFor instanceof Map && it.validFor.startDateTime }
     .sort { it.validFor.startDateTime.toString() }
     .each { s ->
         if (itens.size() >= 20) { return }
         try {
             def inicio = OffsetDateTime.parse(s.validFor.startDateTime.toString()).atZoneSameInstant(zona)
             def fim = s.validFor.endDateTime ? OffsetDateTime.parse(s.validFor.endDateTime.toString()).atZoneSameInstant(zona) : null
             def valor = itens.size().toString()
             def periodo = fim ? hora.format(inicio) + ' às ' + hora.format(fim) : (s.validFor.timeslot ?: s.id)?.toString()
             resumo << [value: valor, start: s.validFor.startDateTime.toString(), end: s.validFor.endDateTime?.toString(),
                        timeslot: (s.validFor.timeslot ?: s.id)?.toString(), resourceId: s.resourceId?.toString(),
                        resourceName: s.resourceName?.toString(),
                        data: inicio.format(DateTimeFormatter.ofPattern('dd/MM/yyyy')),
                        periodo: fim ? 'Entre ' + hora.format(inicio) + ' e ' + hora.format(fim) : periodo]
             itens << [value: valor, label: dia.format(inicio).capitalize() + ' - ' + periodo]
         } catch (Exception ignored) { }
     }
def resultado = 'FALHA'
if (status == 200) {
    resultado = itens ? 'DISPONIVEL' : 'SEM_SLOT'
} else if (status == 204) {
    resultado = 'SEM_SLOT'
}
execution.setVariable('data_resultadoSlots', resultado)
// JSON (Spin) em vez de String: com 20 horários passa de 4000 caracteres.
execution.setVariable('data_slotsWfm', org.camunda.spin.Spin.JSON(JsonOutput.toJson(resumo)))
execution.setVariable('data_horariosVisita', JsonOutput.toJson(itens))
'''

REGISTRA_HORARIO = LER_JSON + '''
def slots = lerJson(execution.getVariable('data_slotsWfm')) ?: []
def escolhido = execution.getVariable('form_horarioVisita')?.toString()
def slot = slots.find { it instanceof Map && it.value == escolhido }
execution.setVariable('data_horarioValido', slot != null)
if (slot) {
    execution.setVariable('data_slotEscolhido', JsonOutput.toJson(slot))
    execution.setVariable('data_dataVisita', slot.data)
    execution.setVariable('data_woHorario', slot.periodo)
    execution.setVariable('data_visitaInicio', slot.start)
    execution.setVariable('data_visitaFim', slot.end)
    execution.setVariable('data_avisarHorarioMaisCedo', 'true'.equalsIgnoreCase(String.valueOf(execution.getVariable('form_avisarHorarioMaisCedo'))))
    // US-08: a jornada gera o ID da WO usado no fluxo sistêmico.
    execution.setVariable('data_woIdJornada', 'VE' + UUID.randomUUID().toString())
}
'''

BODY_WO = '''import groovy.json.JsonOutput
import groovy.json.JsonSlurper
// Estrutura do exemplo WFM de 12/11/2026. Dados sem origem definida (P08) vêm de entradas opcionais
// wo_<campo> (data_wo_<campo> no motor) ou ficam nulos; produtos podem vir prontos em wo_relatedEntity (JSON).
def v = { String nome -> def x = execution.getVariable(nome); x == null ? null : x.toString() }
def wo = { String campo -> v('data_wo_' + campo) }
def caracteristica = { String nome, Object valor -> valor == null ? null : ['@type': 'Characteristic', name: nome, value: valor] }
def slot = new JsonSlurper().parseText(v('data_slotEscolhido'))
def woId = v('data_woIdJornada')
def itemId = woId + ':1'
def zona = java.time.ZoneId.of('America/Sao_Paulo')
def dataVisita = java.time.OffsetDateTime.parse(slot.start.toString()).atZoneSameInstant(zona).toLocalDate().toString()
def produtos = wo('relatedEntity') ? new JsonSlurper().parseText(wo('relatedEntity')) : [[
    '@type': 'ProductEntity', id: wo('productId'), name: 'Banda Larga', action: 'Ativo', status: 'Ativo',
    characteristic: [caracteristica('Designator', v('data_designador')),
                     caracteristica('Technology', v('data_wfmMediaType') ?: 'GPON')].findAll { it }]]
if (!wo('relatedEntity') && wo('acessoId')) {
    produtos << ['@type': 'ProductEntity', id: wo('acessoId'), name: 'ACESSO', action: 'Ativo', status: 'Ativo',
                 characteristic: [caracteristica('Designator', wo('acessoDesignador'))].findAll { it }]
}
def notas = [[id: 'CRM_NOTES', text: 'Agendamento realizado pelo cliente no fluxo de suporte técnico no Vivo Empresas']]
if (wo('addressReference')) { notas << [id: 'ADDRESS_REFERENCE', text: wo('addressReference')] }
def body = [
    WorkOrder_Create: [
        '@type': 'WorkOrder',
        sourceSystem: 'MVE',
        id: woId,
        relatedParty: [
            ['@type': 'CustomerValue', category: wo('customerCategory'), documentNumber: wo('documentNumber'),
             id: wo('customerId'), name: wo('customerName'),
             contactMedium: [['@type': 'ContactMediumValue', name: wo('contactName'), characteristic: [[
                 '@type': 'ContactMediumValueCharacteristic', emailAddress: wo('emailAddress'),
                 mobileNumber: wo('mobileNumber'), phoneNumber: wo('phoneNumber'), workNumber: wo('workNumber')]]]]],
            ['@type': 'CustomerOrderValue', dateOfSale: wo('dateOfSale'), id: wo('orderId'), orderProtocol: wo('orderProtocol'),
             characteristic: [caracteristica('Detail', wo('orderDetail'))].findAll { it }],
            ['@type': 'WorkOrderPendency', context: 'TRIAGEM']
        ],
        workOrderItem: [[
            '@type': 'WorkOrderItem',
            id: itemId,
            place: ['@type': 'GeographicAddress', cnl: v('data_wfmCnl'), cnlAcronym: wo('cnlAcronym'), city: wo('city'),
                    neighborhood: wo('neighborhood'), postcode: v('data_wfmPostcode'), stateOrProvince: wo('stateOrProvince'),
                    streetCode: wo('streetCode'), streetName: wo('streetName'), streetNr: wo('streetNr'),
                    networkOwner: v('data_wfmNetworkOwner') ?: 'VIVO1', accessTechnology: v('data_wfmMediaType') ?: 'GPON',
                    centralOffice: v('data_wfmCentralOffice') ?: '', telephonicArea: v('data_wfmTelephonicArea') ?: '',
                    geographicLocation: ['@type': 'GeographicLocation', bbox: [wo('longitude'), wo('latitude')]],
                    geographicSite: ['@type': 'Cabinet', id: v('data_wfmGeographicSiteId')],
                    geographicSubAddress: ['@type': 'GeographicSubAddress', name: wo('complement')]],
            relatedEntity: produtos,
            specification: [acronym: 'TT_B', type: 'TROUBLETICKET', specificationDescription: [
                [name: 'PRODUTO', value: 'Banda'], [name: 'TIPO', value: 'Defeito'],
                [name: 'DETALHE', value: wo('detail')], [name: 'SEQUENCIA', value: '1/1']]]
        ]]
    ],
    Appointment_Create: [
        description: 'Agendamento da atividade',
        category: 'CORPORATE',
        canBeAntecipated: execution.getVariable('data_avisarHorarioMaisCedo') == true,
        externalId: itemId,
        scheduleDate: dataVisita,
        relatedParty: [
            ['@type': 'Attendant', id: v('data_wfmAttendantId') ?: '', role: 'Cliente via Vivo Empresas'],
            ['@type': 'TimeSlot', id: slot.timeslot, resourceId: slot.resourceId, resourceName: slot.resourceName,
             validFor: [startDateTime: slot.start, endDateTime: slot.end]]
        ],
        note: notas
    ]
]
JsonOutput.toJson(body)'''

TRATA_WO = LER_JSON + '''
def status = execution.getVariable('Node_CriaWO-status')
def json = lerJson(execution.getVariable('Node_CriaWO-response'))
// PreDataMapping v2.2: sucesso = HTTP 200 com {idWorkOrder, idWorkOrderItem, idWork}; erro = {origin, code, reason, message}.
def corpo = json instanceof Map ? json : [:]
def woId = corpo.idWorkOrder?.toString()?.trim()
def itemId = corpo.idWorkOrderItem?.toString()?.trim()
def ok = status == 200 && woId && itemId
def erro = null
if (status == 200 && !ok) {
    erro = 'HTTP 200 sem ' + [woId ? null : 'idWorkOrder', itemId ? null : 'idWorkOrderItem'].findAll { it }.join(' e ')
} else if (!ok) {
    erro = [corpo.code, corpo.reason, corpo.message, corpo.origin].findAll { it }.join(' | ') ?: ('HTTP ' + status)
}
execution.setVariable('data_woCriada', ok)
// O idWorkOrder do WFM é o WorkOrder_Create.id enviado: em falha, permite cancelar uma WO criada parcialmente.
execution.setVariable('data_woNumero', woId ?: execution.getVariable('data_woIdJornada')?.toString())
execution.setVariable('data_woItemId', itemId)
execution.setVariable('data_woIdWork', corpo.idWork?.toString())
execution.setVariable('data_woErro', erro)
execution.setVariable('data_tentativasBD', 0)
'''

BODY_BD = '''import groovy.json.JsonOutput
import groovy.json.JsonSlurper
// Tabela da aba Camunda x MS Trouble Ticket Req (PreDataMapping Abertura de BD v2.1); bd_<campo> sobrescreve o padrão.
def v = { String nome -> def x = execution.getVariable(nome); x == null ? null : x.toString() }
def bd = { String campo -> v('data_bd_' + campo) }
def wo = { String campo -> v('data_wo_' + campo) }
def slot = new JsonSlurper().parseText(v('data_slotEscolhido'))
def zona = java.time.ZoneId.of('America/Sao_Paulo')
def hora = java.time.format.DateTimeFormatter.ofPattern('HH:mm')
def inicio = java.time.OffsetDateTime.parse(slot.start.toString()).atZoneSameInstant(zona)
def fim = slot.end ? java.time.OffsetDateTime.parse(slot.end.toString()).atZoneSameInstant(zona) : null
def calculadas = [
    designadorAcesso: v('data_designador'), WorkOrder: v('data_woNumero'), WorkOrderItem: v('data_woItemId'),
    previsaoAtendimento: inicio.format(java.time.format.DateTimeFormatter.ofPattern('dd/MM/yyyy')) + ' ' + hora.format(inicio) + (fim ? '-' + hora.format(fim) : ''),
    payloadDiagnostico: v('data_resumoDiagnostico')
]
def padrao = [
    estadoDescricao: wo('stateOrProvince'), city: wo('city'), endBairro: wo('neighborhood'), postcode: v('data_wfmPostcode'),
    telephonicArea: v('data_wfmTelephonicArea'), streetName: wo('streetName'), streetNr: wo('streetNr'), complement: wo('complement'),
    reclamanteNome: wo('contactName'), documentNumber: wo('documentNumber'),
    telefoneContatoLocal1: wo('mobileNumber') ?: wo('phoneNumber'), telefoneContatoLocal2: wo('workNumber'), etapa: 'TRIAGEM'
]
// Nome obrigatório nas 36 características; valor opcional (vazio quando não houver).
def caracteristicas = ['estadoDescricao', 'city', 'endBairro', 'postcode', 'telephonicArea', 'streetName', 'streetNr', 'complement',
 'reclamanteNome', 'documentNumber', 'clienteClassificacao', 'contatoLocal', 'telefoneContatoLocal1',
 'telefoneContatoLocal2', 'motivo', 'submotivo', 'SLA', 'tipoDescricao', 'tipoOferta', 'designadorAcesso',
 'velocidade', 'servicoCpccNome', 'WorkOrder', 'WorkOrderItem', 'etapa', 'telefoneTitular1', 'telefoneTitular2',
 'telefoneReclamante1', 'telefoneReclamante2', 'horarioFuncionamento', 'preferenciaContato', 'palitagemFinal',
 'previsaoAtendimento', 'caseOrigin', 'payloadDiagnostico', 'idAppointment'].collect { nome ->
    [name: nome, value: calculadas[nome] ?: bd(nome) ?: padrao[nome] ?: '']
}
def relatedEntity = []
[['Product', 'ServiceTest', 'ProductInventory', bd('productInventoryId')],
 ['Service', 'ServiceTest', 'testSpecification', 'spec-ftth-gpon-basico'],
 ['Service', 'Service', 'relatedServiceSpecification', bd('relatedServiceSpecificationId')],
 ['Service', 'Service', 'relatedService', bd('relatedServiceId')],
 ['Service', 'Service', 'mode', 'Proactive']].each { item ->
    if (item[3]) { relatedEntity << ['@type': item[0], entity: ['@type': item[1], name: item[2], id: item[3]]] }
}
// wo_customerId é o ID Salesforce do cliente exigido em partyOrPartyRole.id.
def clienteId = bd('customerId') ?: wo('customerId')
def relatedParty = []
if (clienteId) {
    relatedParty << ['@type': 'Customer', role: 'Digital', partyOrPartyRole: [
        '@type': 'Customer', id: clienteId, name: bd('customerName') ?: wo('customerName'), '@referredType': 'CustomerContact',
        characteristic: [['EmailContactMedium', bd('email') ?: wo('emailAddress')],
                         ['PhoneContactMedium', bd('phone') ?: wo('phoneNumber') ?: wo('mobileNumber')],
                         ['idCustomer', bd('serviceNowCustomerId')]]
            .findAll { it[1] }.collect { [name: it[0], value: it[1]] }]]
}
def body = [
    '@type': 'TroubleTicket',
    ticketType: 'Case',
    description: bd('description') ?: 'Abertura de BD pelo VE (FTAT-933): diagnóstico automático não resolveu o problema',
    severity: bd('severity') ?: '3',
    name: bd('name') ?: 'Queda de Conexão',
    requestedResolutionDate: slot.start,
    expectedResolutionDate: slot.end,
    channel: ['@type': 'ServiceProblemCase', name: bd('channel') ?: 'Alert'],
    relatedEntity: relatedEntity,
    relatedParty: relatedParty,
    troubleTicketCharacteristic: caracteristicas
].findAll { it.value != null }
JsonOutput.toJson(body)'''

TRATA_BD_CRIADO = LER_JSON + '''
def status = execution.getVariable('Node_CriaBD-status')
def json = lerJson(execution.getVariable('Node_CriaBD-response'))
def tentativas = ((execution.getVariable('data_tentativasBD') ?: 0) as Integer) + 1
def ok = status in [200, 201]
execution.setVariable('data_tentativasBD', tentativas)
execution.setVariable('data_bdCriado', ok)
if (ok && json instanceof Map) {
    execution.setVariable('data_bdCriadoId', json.id?.toString())
    execution.setVariable('data_bdCriadoNumero', (json.externalIdentifier instanceof Map ? json.externalIdentifier.id : null)?.toString())
}
if (ok) {
    // A tela de sucesso lê form.dataVisita; a resposta original some no próximo /advance (retentativas).
    execution.setVariable('form_dataVisita', execution.getVariable('data_dataVisita'))
}
'''

PATH_CANCELA = ("'/workOrder/' + java.net.URLEncoder.encode(execution.getVariable('data_woNumero').toString(), 'UTF-8')"
                " + '?reason=PROBLEMAS+SISTEMICOS&context=SISTEMICO'")
WFM_HEADERS = ["h['flow'] = 'B2B_MASSIVO'", "h['requestSystem'] = 'MVE'"]
DOC_CANCELA = ('INT16 DELETE /workOrder/{idWorkOrder}?reason=PROBLEMAS SISTEMICOS&context=SISTEMICO (PreDataMapping '
               'Cancelamento de WO v1.1; valores fixos, sem body). Sucesso = 200 com body vazio; erro 400-599 = '
               '{origin, code, reason, message}. O resultado fica nas variáveis -status/-response desta tarefa.')
def exige_designador(task):
    return ("def designador = execution.getVariable('data_designador')\n"
            "if (designador == null || designador.toString().trim().isEmpty()) { throw new IllegalArgumentException("
            f"'designador deve ser informado para execução da task {task}') }}\n")


PATH_MASSIVA = (exige_designador('Consulta Massiva/Manutenção (INT01)')
                + "'/incidents?serviceDesignator=' + java.net.URLEncoder.encode(designador.toString(), 'UTF-8')")
PATH_BD = (exige_designador('Consulta BD aberto (INT03)')
           + "'/troubleTicket?ticketType=Case&sys_class_name=sn_sprb_mgmt_case&active=true&correlation_display='"
           " + java.net.URLEncoder.encode(designador.toString(), 'UTF-8')")

# Campos obrigatórios dos data mappings que não são fixos nem resolvidos durante a jornada (ausência = 400 na fachada).
START_OBRIGATORIAS = (
    'designador', 'productStatus', 'correlationId', 'requestTimestamp', 'issServiceNow',
    'wfmNetworkOwner', 'wfmMediaType', 'wfmCnl', 'wfmTelephonicArea', 'wfmCentralOffice', 'wfmGeographicSiteId',
    'wfmAttendantId', 'wfmPostcode',
    'wo_customerId', 'wo_customerName', 'wo_documentNumber', 'wo_customerCategory',
    'wo_contactName', 'wo_emailAddress', 'wo_mobileNumber', 'wo_phoneNumber', 'wo_workNumber',
    'wo_orderId', 'wo_orderProtocol', 'wo_dateOfSale', 'wo_orderDetail',
    'wo_cnlAcronym', 'wo_city', 'wo_neighborhood', 'wo_stateOrProvince', 'wo_streetCode', 'wo_streetName',
    'wo_streetNr', 'wo_complement', 'wo_latitude', 'wo_longitude', 'wo_addressReference',
    'wo_productId', 'wo_acessoId', 'wo_acessoDesignador', 'wo_detail',
    'bd_productInventoryId', 'bd_relatedServiceSpecificationId', 'bd_relatedServiceId',
)


def env(name):
    return "${environment.getProperty('" + name + "')}"


# ------------------------------------------------------------------------------------------------
# Modelo do processo
# ------------------------------------------------------------------------------------------------
nodes = []          # dicts: id, kind, name, ...
flows = []          # dicts: id, source, target, name, condition
gateway_default = {}


def node(kind, node_id, name, **kw):
    nodes.append(dict(kind=kind, id=node_id, name=name, **kw))


def flow(source, target, name=None, condition=None, default=False):
    fid = f'Flow_{source.replace("Node_", "")}_{target.replace("Node_", "")}'
    flows.append(dict(id=fid, source=source, target=target, name=name, condition=condition))
    if default:
        gateway_default[source] = fid


def var_eq(name, value):
    return "${execution.getVariable('" + name + "') == '" + value + "'}"


def var_true(name):
    return "${execution.getVariable('" + name + "') == true}"


def http(node_id, name, doc, method, base_env, path, headers, body=None, timeout=10000, async_before=False):
    inputs = [('method', method, False), ('baseUrl', env(base_env), False)]
    inputs.append(('path', path, not path.startswith('/')))
    inputs.append(('headers', headers, True))
    if body:
        inputs.append(('bodyTemplate', body, True))
    inputs += [('connectTimeoutMs', '3000', False), ('responseTimeoutMs', str(timeout), False),
               ('maxAttempts', '1', False), ('sendToken', '${false}', False)]
    node('serviceTask', node_id, name, doc=doc, inputs=inputs, async_before=async_before)


def script(node_id, name, code, doc=None):
    node('scriptTask', node_id, name, script=code, doc=doc)


def screen(node_id, name, doc=None):
    node('userTask', node_id, name, doc=doc)


def gateway(node_id, name):
    node('exclusiveGateway', node_id, name)


def end(node_id, name):
    node('endEvent', node_id, name)


ERRO_HTTP = 'Error_FalhaTecnicaHttp'


def falha_tecnica(task_id, target):
    # Timeout/conexão do httpTask lança IOException: limpa -status (código nulo), guarda a mensagem em -response e segue o caminho de falha.
    nid = task_id + '_FalhaTecnica'
    node('boundaryError', nid, 'Falha técnica', attached=task_id)
    flow(nid, target, 'Timeout/conexão')


node('startEvent', 'Node_Start', 'Início',
    doc='Entradas obrigatórias (START, via ms-journey-v1; data_* no motor; chave ausente = 400 na fachada; enviar como '
        'string, vazia quando não se aplicar, ex.: wfmTelephonicArea/wfmCentralOffice em VIVO2): '
        + ', '.join(START_OBRIGATORIAS) + '. Opcionais: hpsdRelatedServiceId, wfmMicroArea, wo_relatedEntity, '
        'bd_<campo> (valores das características e contato do BD).')

# Consultas e impedimentos (US-01, US-02, US-03)
screen('Node_Inicio', 'Vamos verificar seu serviço',
       doc='Figma "Validação de status". Também garante o Bearer do usuário (/advance) antes das consultas.')
http('Node_ConsultaMassiva', 'Consulta Massiva/Manutenção (INT01)',
     'INT01 Customer Problem Management v1: GET /incidents?serviceDesignator. Incidente com status != CLOSED = massiva aberta; '
     'demais status (inclusive 404) = falha. Pendente: campo oficial de protocolo (usado incidentId).',
     'GET', 'FENIX_VE_CPM_BASE_URL', PATH_MASSIVA, headers_script(),
     timeout=20000)
script('Node_TrataMassiva', 'Interpreta Massiva', TRATA_MASSIVA)
gateway('Node_DecMassivaOk', 'Consulta de Massiva respondeu?')
http('Node_ConsultaBD', 'Consulta BD aberto (INT03)',
    'INT03 ServiceNow Trouble Ticket v1: GET /troubleTicket?ticketType=Case&sys_class_name=sn_sprb_mgmt_case&active=true&correlation_display=<designador>. '
     '200/206 = lista de tickets ativos do designador; 404 com code 60 (No Record found) = nenhum BD aberto; demais status (inclusive outros 404) = falha.',
    'GET', 'FENIX_VE_TT_BASE_URL', PATH_BD, headers_script(
        extra_lines=("def issServiceNow = execution.getVariable('data_issServiceNow')",
                  "if (issServiceNow == null || issServiceNow.toString().trim().isEmpty()) { throw new IllegalArgumentException('issServiceNow deve ser informado para execução da task Consulta BD aberto (INT03)') }",
                  "h['iss'] = issServiceNow.toString()"), tid='INT003'))
script('Node_TrataBD', 'Interpreta BD', TRATA_BD)
gateway('Node_DecBDOk', 'Consulta de BD respondeu?')
script('Node_AvaliaImpedimentos', 'Avalia impedimentos', AVALIA_IMPEDIMENTOS,
       doc='US-03: Massiva+fatura, Massiva+BD, Massiva, fatura, BD. Combinações não especificadas '
           '(BD+fatura sem Massiva; as três) seguem a precedência fatura > BD.')
gateway('Node_DecImpedimento', 'Cliente tem impedimento?')
for sid, sname in [('Node_StatusMassivaAtraso', 'Massiva + atraso em pagamentos'),
                   ('Node_StatusMassivaVisita', 'Massiva + visita técnica'),
                   ('Node_StatusMassiva', 'Massiva'),
                   ('Node_StatusAtraso', 'Atraso em pagamentos'),
                   ('Node_StatusVisita', 'Visita técnica agendada')]:
    screen(sid, sname)
end('Node_End_Impedimento', 'Fim — impedimento')

# Troubleshooting (US-04, US-05, US-06)
screen('Node_Reinicie', 'Reinicie o modem')
gateway('Node_DecReinicio', 'Conseguiu reiniciar?')
screen('Node_VoltouReinicio', 'A internet voltou?')
gateway('Node_DecVoltouReinicio', 'Voltou após reiniciar?')
screen('Node_InternetVoltou', 'Sua internet voltou')
end('Node_End_Resolvido', 'Fim — problema resolvido')
screen('Node_TesteConexao', 'Vamos testar a sua conexão')
gateway('Node_DecTeste', 'Cliente quer testar?')
end('Node_End_Desistiu', 'Fim — cliente voltou ao início')

# Diagnóstico automático (US-12, US-13)
http('Node_SolicitaDiagnostico', 'Solicita diagnóstico HPSD (INT06)',
     'INT06 TMF653 POST /serviceTest (PreDataMapping Diagnóstico Automático v2.0). testSpecification fixo spec-ftth-gpon-basico; '
     'relatedParty ExternalId = processInstanceId (correlação do retorno Kafka).',
     'POST', 'FENIX_VE_HPSD_BASE_URL', '/serviceTest', headers_script(content_type=True, uuid_ids=True), BODY_HPSD,
     timeout=15000)
script('Node_TrataSolicitacaoDiagnostico', 'Interpreta aceite do diagnóstico', TRATA_SOLICITACAO_DIAGNOSTICO)
gateway('Node_DecDiagnosticoAceito', 'Diagnóstico aceito?')
node('eventBasedGateway', 'Node_AguardaDiagnostico', 'Aguarda resultado do diagnóstico')
node('messageCatch', 'Node_RetornoDiagnostico', 'Retorno do diagnóstico (INT10)', message='Message_RetornoDiagnosticoHPSD',
     topic=HPSD_TOPIC,
     doc='INT10 Kafka. O ms-journey-event-consumer-v1 entrega o evento ao motor, que localiza a instância pelo '
         'JSONPath de inbound_correlation_config e dispara esta espera pelo correlationTopic. O payload não vira variável.')
node('timerCatch', 'Node_TimeoutDiagnostico', 'Sem resposta do diagnóstico',
     duration="${environment.getProperty('FENIX_VE_HPSD_TIMEOUT', 'PT3M')}",
     doc='Figma: "ID 01, 02, 08 ou sem resposta" segue para a abertura de BD.')
http('Node_ConsultaResultadoDiagnostico', 'Consulta resultado do diagnóstico (TMF653)',
     'GET /serviceTest/{id}: o evento Kafka só retoma a instância; o resultado (RESULTADO_DIAGNOSTICO) é lido aqui. '
     'Executa em segundo plano (asyncBefore): não há Bearer do usuário nesta transação.',
     'GET', 'FENIX_VE_HPSD_BASE_URL', PATH_RESULTADO, headers_script(uuid_ids=True), async_before=True)
script('Node_TrataResultadoDiagnostico', 'Interpreta resultado do diagnóstico', TRATA_RESULTADO_DIAGNOSTICO,
       doc='ID06/07/10 = resolvido; ID09 = sem energia; outros ou sem resultado = problema persiste.')
gateway('Node_DecResultadoDiagnostico', 'Resultado do diagnóstico')
screen('Node_ReinicieNovamente', 'Reinicie de novo')
screen('Node_VoltouNovamente', 'A internet voltou?')
gateway('Node_DecVoltouNovamente', 'Voltou após o ajuste?')
screen('Node_SemEnergia', 'Modem sem energia')
gateway('Node_DecEnergia', 'Conseguiu verificar?')
screen('Node_VoltouEnergia', 'A internet voltou?')
gateway('Node_DecVoltouEnergia', 'Voltou após verificar?')
screen('Node_TemEnergia', 'Tem energia no endereço?')
gateway('Node_DecTemEnergia', 'Há energia no endereço?')
screen('Node_RedeEletrica', 'Problema na rede elétrica')
end('Node_End_RedeEletrica', 'Fim — rede elétrica')

# Agendamento, WO e BD (US-07 a US-11)
screen('Node_AgendarVisita', 'Vamos agendar uma visita técnica')
gateway('Node_DecAgendar', 'Cliente quer agendar?')
end('Node_End_SemAgendar', 'Fim — sem agendamento')
http('Node_ConsultaSlots', 'Consulta horários WFM (INT11)',
     'INT11 WFM Journey POST /searchTimeSlot (exemplo do WFM de 12/11/2026; PreDataMapping v2.2, VIVO1/VIVO2). '
     '200 com slots; 204 = sem slot. Endereço e dados de rede vêm da consulta de asset do VE (wfm*). Pendente: swagger (P09).',
     'POST', 'FENIX_VE_WFM_BASE_URL', '/searchTimeSlot',
     headers_script(WFM_HEADERS, content_type=True, tid='INT005'),
     BODY_SLOTS)
script('Node_TrataSlots', 'Interpreta horários', TRATA_SLOTS)
gateway('Node_DecSlots', 'Há horários disponíveis?')
screen('Node_SemHorarios', 'Sem horários disponíveis')
end('Node_End_SemHorarios', 'Fim — sem horários')
screen('Node_EscolheHorario', 'Escolha do horário')
script('Node_RegistraHorario', 'Registra horário escolhido', REGISTRA_HORARIO)
gateway('Node_DecHorarioValido', 'Horário válido?')
http('Node_CriaWO', 'Cria WO e agendamento (INT14)',
     'INT14 WFM Journey POST /workOrder/appointment (PreDataMapping Abertura de WO e agendamento v2.2): WorkOrder_Create + '
     'Appointment_Create; sucesso = HTTP 200 com idWorkOrder (= WorkOrder_Create.id enviado) e idWorkOrderItem, além de idWork. Appointment_Create vem da tela Escolha do '
     'horário (form_horarioVisita = slot do WFM, form_avisarHorarioMaisCedo = canBeAntecipated) e dos fixos da aba '
     'VE x Camunda. Cliente, endereço e produtos vêm da consulta '
     'de asset do VE. Pendente: contato do cliente, pedido (CustomerOrderValue), categoria, coordenadas, DETALHE e '
     'referência do endereço (entradas opcionais wo_<campo>).',
     'POST', 'FENIX_VE_WFM_BASE_URL', '/workOrder/appointment',
     headers_script(WFM_HEADERS, content_type=True, tid='INT007'), BODY_WO)
script('Node_TrataWO', 'Interpreta criação da WO', TRATA_WO)
gateway('Node_DecWOCriada', 'WO criada?')
gateway('Node_DecWOIdentificadaFalha', 'Há WO para cancelar?')
http('Node_CancelaWOAgendamento', 'Cancela WO (INT16)',
     'US-09: falha no agendamento (WO não confirmada pela INT14) cancela a WO pelo ID enviado. ' + DOC_CANCELA,
     'DELETE', 'FENIX_VE_WFM_BASE_URL', PATH_CANCELA, headers_script(WFM_HEADERS, tid='INT008'))
screen('Node_AgendamentoNaoRealizado', 'Agendamento não realizado')
end('Node_End_AgendamentoNaoRealizado', 'Fim — visita não agendada')
http('Node_CriaBD', 'Abre BD (INT18)',
     'INT18 Trouble Ticket Management v1 POST /troubleTicket (PreDataMapping Abertura BD v2.1); o MS orquestra '
     'TMF629/TMF621. Número do BD = externalIdentifier.id.',
     'POST', 'FENIX_VE_TT_BASE_URL', '/troubleTicket', headers_script(content_type=True, tid='INT009'), BODY_BD,
     timeout=20000)
script('Node_TrataBDCriado', 'Interpreta abertura do BD', TRATA_BD_CRIADO)
gateway('Node_DecBDCriado', 'BD criado?')
screen('Node_RetentarBD', 'Tentar abrir o BD de novo?', doc='US-10: até 3 tentativas no total, com decisão do cliente.')
gateway('Node_DecRetentarBD', 'Cliente quer tentar de novo?')
gateway('Node_DecWOIdentificadaBD', 'Há WO para cancelar?')
http('Node_CancelaWO', 'Cancela WO (INT16)',
     'US-10: BD não criado (recusa ou 3ª falha) cancela a WO. ' + DOC_CANCELA,
     'DELETE', 'FENIX_VE_WFM_BASE_URL', PATH_CANCELA, headers_script(WFM_HEADERS, tid='INT008'))
screen('Node_BDNaoCriado', 'BD não criado')
end('Node_End_BDNaoCriado', 'Fim — BD não criado')
screen('Node_VisitaAgendada', 'Você agendou a visita técnica')
end('Node_End_Agendado', 'Fim — visita agendada e BD criado')

screen('Node_FalhaConsulta', 'Não conseguimos verificar',
       doc='US-01/02 Obs. 2: falha de integração orienta outro atendimento ou nova tentativa mais tarde.')
end('Node_End_Falha', 'Fim — falha de integração')

# Ligações
flow('Node_Start', 'Node_Inicio')
flow('Node_Inicio', 'Node_ConsultaMassiva')
flow('Node_ConsultaMassiva', 'Node_TrataMassiva')
flow('Node_TrataMassiva', 'Node_DecMassivaOk')
flow('Node_DecMassivaOk', 'Node_ConsultaBD', 'Sim', var_true('data_consultaMassivaOk'))
flow('Node_DecMassivaOk', 'Node_FalhaConsulta', 'Falha', default=True)
flow('Node_ConsultaBD', 'Node_TrataBD')
flow('Node_TrataBD', 'Node_DecBDOk')
flow('Node_DecBDOk', 'Node_AvaliaImpedimentos', 'Sim', var_true('data_consultaBDOk'))
flow('Node_DecBDOk', 'Node_FalhaConsulta', 'Falha', default=True)
flow('Node_AvaliaImpedimentos', 'Node_DecImpedimento')
for value, target, label in [('MASSIVA_ATRASO', 'Node_StatusMassivaAtraso', 'Massiva + fatura'),
                             ('MASSIVA_VISITA', 'Node_StatusMassivaVisita', 'Massiva + BD'),
                             ('MASSIVA', 'Node_StatusMassiva', 'Massiva'),
                             ('ATRASO', 'Node_StatusAtraso', 'Fatura em aberto'),
                             ('VISITA', 'Node_StatusVisita', 'BD aberto')]:
    flow('Node_DecImpedimento', target, label, var_eq('data_impedimento', value))
    flow(target, 'Node_End_Impedimento')
flow('Node_DecImpedimento', 'Node_Reinicie', 'Sem impedimentos', default=True)

flow('Node_Reinicie', 'Node_DecReinicio')
flow('Node_DecReinicio', 'Node_TesteConexao', 'Não consigo reiniciar', var_eq('form_acaoReinicio', 'nao_consigo'))
flow('Node_DecReinicio', 'Node_VoltouReinicio', 'Já reiniciei', default=True)
flow('Node_VoltouReinicio', 'Node_DecVoltouReinicio')
flow('Node_DecVoltouReinicio', 'Node_InternetVoltou', 'Sim', var_eq('form_voltouReinicio', 'sim'))
flow('Node_DecVoltouReinicio', 'Node_TesteConexao', 'Não', default=True)
flow('Node_InternetVoltou', 'Node_End_Resolvido')
flow('Node_TesteConexao', 'Node_DecTeste')
flow('Node_DecTeste', 'Node_End_Desistiu', 'Ir para o início', var_eq('form_acaoTeste', 'inicio'))
flow('Node_DecTeste', 'Node_SolicitaDiagnostico', 'Continuar', default=True)

flow('Node_SolicitaDiagnostico', 'Node_TrataSolicitacaoDiagnostico')
flow('Node_TrataSolicitacaoDiagnostico', 'Node_DecDiagnosticoAceito')
flow('Node_DecDiagnosticoAceito', 'Node_AguardaDiagnostico', 'Sim', var_true('data_diagnosticoSolicitado'))
flow('Node_DecDiagnosticoAceito', 'Node_FalhaConsulta', 'Falha', default=True)
flow('Node_AguardaDiagnostico', 'Node_RetornoDiagnostico')
flow('Node_AguardaDiagnostico', 'Node_TimeoutDiagnostico')
flow('Node_RetornoDiagnostico', 'Node_ConsultaResultadoDiagnostico')
flow('Node_TimeoutDiagnostico', 'Node_AgendarVisita', 'Sem resposta')
flow('Node_ConsultaResultadoDiagnostico', 'Node_TrataResultadoDiagnostico')
flow('Node_TrataResultadoDiagnostico', 'Node_DecResultadoDiagnostico')
flow('Node_DecResultadoDiagnostico', 'Node_ReinicieNovamente', 'ID 06, 07 ou 10', var_eq('data_resultadoDiagnostico', 'RESOLVIDO'))
flow('Node_DecResultadoDiagnostico', 'Node_SemEnergia', 'ID 09', var_eq('data_resultadoDiagnostico', 'SEM_ENERGIA'))
flow('Node_DecResultadoDiagnostico', 'Node_AgendarVisita', 'Outros IDs', default=True)

flow('Node_ReinicieNovamente', 'Node_VoltouNovamente')
flow('Node_VoltouNovamente', 'Node_DecVoltouNovamente')
flow('Node_DecVoltouNovamente', 'Node_InternetVoltou', 'Sim', var_eq('form_voltouNovamente', 'sim'))
flow('Node_DecVoltouNovamente', 'Node_AgendarVisita', 'Não', default=True)

flow('Node_SemEnergia', 'Node_DecEnergia')
flow('Node_DecEnergia', 'Node_AgendarVisita', 'Não consigo verificar', var_eq('form_acaoEnergia', 'nao_consigo'))
flow('Node_DecEnergia', 'Node_VoltouEnergia', 'Já verifiquei', default=True)
flow('Node_VoltouEnergia', 'Node_DecVoltouEnergia')
flow('Node_DecVoltouEnergia', 'Node_InternetVoltou', 'Sim', var_eq('form_voltouEnergia', 'sim'))
flow('Node_DecVoltouEnergia', 'Node_TemEnergia', 'Não', default=True)
flow('Node_TemEnergia', 'Node_DecTemEnergia')
flow('Node_DecTemEnergia', 'Node_AgendarVisita', 'Sim', var_eq('form_temEnergia', 'sim'))
flow('Node_DecTemEnergia', 'Node_RedeEletrica', 'Não', default=True)
flow('Node_RedeEletrica', 'Node_End_RedeEletrica')

flow('Node_AgendarVisita', 'Node_DecAgendar')
flow('Node_DecAgendar', 'Node_End_SemAgendar', 'Ir para o início', var_eq('form_acaoAgendar', 'inicio'))
flow('Node_DecAgendar', 'Node_ConsultaSlots', 'Agendar visita', default=True)
flow('Node_ConsultaSlots', 'Node_TrataSlots')
flow('Node_TrataSlots', 'Node_DecSlots')
flow('Node_DecSlots', 'Node_EscolheHorario', 'Sim', var_eq('data_resultadoSlots', 'DISPONIVEL'))
flow('Node_DecSlots', 'Node_SemHorarios', 'Sem horários', var_eq('data_resultadoSlots', 'SEM_SLOT'))
flow('Node_DecSlots', 'Node_FalhaConsulta', 'Falha', default=True)
flow('Node_SemHorarios', 'Node_End_SemHorarios')
flow('Node_EscolheHorario', 'Node_RegistraHorario')
flow('Node_RegistraHorario', 'Node_DecHorarioValido')
flow('Node_DecHorarioValido', 'Node_CriaWO', 'Sim', var_true('data_horarioValido'))
flow('Node_DecHorarioValido', 'Node_EscolheHorario', 'Não', default=True)
flow('Node_CriaWO', 'Node_TrataWO')
flow('Node_TrataWO', 'Node_DecWOCriada')
flow('Node_DecWOCriada', 'Node_CriaBD', 'Sim', var_true('data_woCriada'))
flow('Node_DecWOCriada', 'Node_DecWOIdentificadaFalha', 'Não', default=True)
flow('Node_DecWOIdentificadaFalha', 'Node_CancelaWOAgendamento', 'Sim', "${execution.getVariable('data_woNumero') != null}")
flow('Node_DecWOIdentificadaFalha', 'Node_AgendamentoNaoRealizado', 'Não', default=True)
flow('Node_CancelaWOAgendamento', 'Node_AgendamentoNaoRealizado')
flow('Node_AgendamentoNaoRealizado', 'Node_End_AgendamentoNaoRealizado')
flow('Node_CriaBD', 'Node_TrataBDCriado')
flow('Node_TrataBDCriado', 'Node_DecBDCriado')
flow('Node_DecBDCriado', 'Node_VisitaAgendada', 'Sim', var_true('data_bdCriado'))
flow('Node_DecBDCriado', 'Node_RetentarBD', 'Falhou (< 3 tentativas)',
     "${execution.getVariable('data_bdCriado') != true && execution.getVariable('data_tentativasBD') < 3}")
flow('Node_DecBDCriado', 'Node_DecWOIdentificadaBD', '3ª falha', default=True)
flow('Node_RetentarBD', 'Node_DecRetentarBD')
flow('Node_DecRetentarBD', 'Node_CriaBD', 'Sim', var_eq('form_retentarBD', 'sim'))
flow('Node_DecRetentarBD', 'Node_DecWOIdentificadaBD', 'Não', default=True)
flow('Node_DecWOIdentificadaBD', 'Node_CancelaWO', 'Sim', "${execution.getVariable('data_woNumero') != null}")
flow('Node_DecWOIdentificadaBD', 'Node_BDNaoCriado', 'Não', default=True)

# US-01/02/03 Obs. 2, US-09 e US-10: falha técnica (sem resposta HTTP) segue o mesmo caminho de falha de um 5xx.
# INT06, INT10 e INT11 ficam sem tratamento até o PO definir o caminho de falha.
for task_id, target in [('Node_ConsultaMassiva', 'Node_TrataMassiva'), ('Node_ConsultaBD', 'Node_TrataBD'),
                        ('Node_CriaWO', 'Node_TrataWO'), ('Node_CriaBD', 'Node_TrataBDCriado'),
                        ('Node_CancelaWOAgendamento', 'Node_AgendamentoNaoRealizado'),
                        ('Node_CancelaWO', 'Node_BDNaoCriado')]:
    falha_tecnica(task_id, target)
flow('Node_CancelaWO', 'Node_BDNaoCriado')
flow('Node_BDNaoCriado', 'Node_End_BDNaoCriado')
flow('Node_VisitaAgendada', 'Node_End_Agendado')
flow('Node_FalhaConsulta', 'Node_End_Falha')

# ------------------------------------------------------------------------------------------------
# Telas SDUI
# ------------------------------------------------------------------------------------------------
REUSED = ['Node_StatusMassivaAtraso', 'Node_StatusMassivaVisita', 'Node_StatusMassiva', 'Node_StatusAtraso',
          'Node_StatusVisita', 'Node_Reinicie', 'Node_VoltouReinicio', 'Node_InternetVoltou', 'Node_TesteConexao',
          'Node_ReinicieNovamente', 'Node_VoltouNovamente', 'Node_SemEnergia', 'Node_VoltouEnergia', 'Node_TemEnergia',
          'Node_RedeEletrica', 'Node_AgendarVisita', 'Node_EscolheHorario', 'Node_VisitaAgendada', 'Node_BDNaoCriado',
          'Node_FalhaConsulta']


def t_screen(sid, title, children):
    return ['ui.screen', {'id': sid, 'title': title, 'version': '1.0.0', 'scrollable': True,
                          'paddingToken': 'spacing.md', 'backgroundToken': 'color.background.primary'},
            [['ui.stack', {'id': 'stack_' + sid[len('screen_'):], 'version': '1.0.0', 'alignment': 'stretch',
                           'direction': 'vertical', 'spacingToken': 'spacing.md'}, children]]]


def t_text(tid, text, variant='body'):
    return ['ui.text', {'id': tid, 'text': text, 'align': 'start', 'variant': variant, 'version': '1.0.0',
                        'maxLines': 2, 'colorToken': 'color.text.primary'}]


def t_alert(aid, title, message):
    return ['ui.alert', {'id': aid, 'title': title, 'message': message, 'version': '1.0.0', 'severity': 'warning',
                         'dismissible': False}]


def t_button(bid, label, path=None, value=None, variant='primary'):
    params = {'path': path, 'value': value} if path else {}
    return ['ui.button', {'id': bid, 'size': 'medium', 'label': label,
                          '$events': {'onPress': {'action': 'action.submit', 'params': params}},
                          'loading': False, 'variant': variant, 'version': '1.0.0', 'disabled': False,
                          'fullWidth': True}]


NEW_SCREENS = {
    'Node_Inicio': t_screen('screen_inicio', 'Suporte técnico', [
        t_text('in_titulo', 'Agora, vamos verificar o que pode estar acontecendo com sua internet', 'title'),
        t_text('in_sub', 'Antes dos testes, vamos conferir o seu serviço para identificar possíveis problemas'),
        t_button('in_continuar', 'Continuar'),
    ]),
    'Node_RetentarBD': t_screen('screen_retentarbd', 'Agendar visita técnica', [
        t_alert('rb_alerta', 'Não conseguimos registrar a sua solicitação',
                'Tivemos uma falha ao registrar o atendimento da visita técnica. Você quer tentar de novo?'),
        t_button('rb_sim', 'Tentar de novo', 'form.retentarBD', 'sim'),
        t_button('rb_nao', 'Não, encerrar', 'form.retentarBD', 'nao', 'secondary'),
    ]),
    'Node_SemHorarios': t_screen('screen_semhorarios', 'Agendar visita técnica', [
        t_alert('sh_alerta', 'Sem horários disponíveis',
                'No momento não há horários para a visita técnica no seu endereço. Tente de novo mais tarde ou fale com o atendimento Vivo.'),
        t_button('sh_btn', 'Ir para o início'),
    ]),
    'Node_AgendamentoNaoRealizado': t_screen('screen_agendamentonaorealizado', 'Agendar visita técnica', [
        t_alert('an_alerta', 'Não foi possível agendar',
                'Não conseguimos agendar a visita técnica no horário escolhido. Tente de novo mais tarde ou fale com o atendimento Vivo.'),
        t_button('an_btn', 'Ir para o início'),
    ]),
}


def compact(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def build_screens():
    exported = {e['uiStepId']: e for e in json.loads((EXPORT / 'screens.json').read_text('utf-8'))}
    screens = []
    for n in nodes:
        if n['kind'] != 'userTask':
            continue
        if n['id'] in REUSED:
            base = exported[n['id']]
            envelope = dict(base, journeyId=JOURNEY_ID, journeyVersion=VERSION, publishedAt=PUBLISHED_AT,
                            status='published')
        else:
            envelope = {'schemaVersion': '1.0.0', 'catalogVersion': '1.0.0', 'journeyId': JOURNEY_ID,
                        'journeyVersion': VERSION, 'uiStepId': n['id'], 'status': 'published',
                        'publishedAt': PUBLISHED_AT, 'supportedTargets': ['react.mobile', 'flutter.mobile'],
                        'minRendererVersion': {'react.mobile': '1.0.0', 'flutter.mobile': '1.0.0'},
                        'dataSources': {}, 'data': NEW_SCREENS[n['id']]}
        screens.append(envelope)
    return screens


# ------------------------------------------------------------------------------------------------
# Layout (camadas por caminho mais longo; laços desenhados por baixo)
# ------------------------------------------------------------------------------------------------
SIZES = {'startEvent': (36, 36), 'endEvent': (36, 36), 'messageCatch': (36, 36), 'timerCatch': (36, 36),
         'exclusiveGateway': (50, 50), 'eventBasedGateway': (50, 50)}
COL_W, ROW_H, X0, Y0 = 170, 130, 160, 100


def layout():
    by_id = {n['id']: n for n in nodes}
    out = defaultdict(list)
    for f in flows:
        out[f['source']].append(f)
    back, state = set(), {}

    def dfs(v):
        state[v] = 1
        for f in out[v]:
            w = f['target']
            if state.get(w) == 1:
                back.add(f['id'])
            elif w not in state:
                dfs(w)
        state[v] = 2

    dfs('Node_Start')
    layer = {'Node_Start': 0}
    order = [n['id'] for n in nodes]
    changed = True
    while changed:
        changed = False
        for f in flows:
            if f['id'] in back or f['source'] not in layer:
                continue
            if layer.get(f['target'], -1) < layer[f['source']] + 1:
                layer[f['target']] = layer[f['source']] + 1
                changed = True
    rows = defaultdict(list)
    for nid in order:
        if by_id[nid]['kind'] == 'boundaryError':
            continue
        rows[layer[nid]].append(nid)
    pos = {}
    for lay, ids in rows.items():
        for i, nid in enumerate(ids):
            w, h = SIZES.get(by_id[nid]['kind'], (100, 80))
            cx, cy = X0 + lay * COL_W, Y0 + i * ROW_H
            pos[nid] = (cx - w / 2, cy - h / 2, w, h)
    for n in nodes:
        if n['kind'] == 'boundaryError':
            ax, ay, aw, ah = pos[n['attached']]
            pos[n['id']] = (ax + aw - 26, ay + ah - 18, 36, 36)
    return pos, back


def waypoints(f, pos, back, bottom):
    sx, sy, sw, sh = pos[f['source']]
    tx, ty, tw, th = pos[f['target']]
    if f['source'].endswith('_FalhaTecnica'):
        y = sy + sh + 20
        return [(sx + sw / 2, sy + sh), (sx + sw / 2, y), (tx + tw / 2, y), (tx + tw / 2, ty + th)]
    if f['id'] in back:
        y = bottom + 40
        return [(sx + sw / 2, sy + sh), (sx + sw / 2, y), (tx + tw / 2, y), (tx + tw / 2, ty + th)]
    a = (sx + sw, sy + sh / 2)
    b = (tx, ty + th / 2)
    if abs(a[1] - b[1]) < 1:
        return [a, b]
    mid = a[0] + 25
    return [a, (mid, a[1]), (mid, b[1]), b]


# ------------------------------------------------------------------------------------------------
# BPMN XML
# ------------------------------------------------------------------------------------------------
def cdata(text):
    assert ']]>' not in text
    return '<![CDATA[' + text + ']]>'


def build_bpmn():
    incoming, outgoing = defaultdict(list), defaultdict(list)
    for f in flows:
        outgoing[f['source']].append(f['id'])
        incoming[f['target']].append(f['id'])
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" '
         'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" '
         'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
         'xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" '
         'id="Definitions_fenix_ve_abertura_bd" targetNamespace="http://bpmn.io/schema/bpmn" '
         'modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.24.0">',
         f'  <bpmn:process id="{PROCESS_KEY}" name="{JOURNEY_NAME}" isExecutable="true" '
         f'camunda:versionTag="{VERSION_TAG}" camunda:historyTimeToLive="P180D">',
         '    <bpmn:documentation>FTAT-933 Abertura de BD pelo VE (APP). O ms-journey-v1 acha a jornada '
         f'{JOURNEY_ID} desta chave em espec_registry.process_key para resolver as telas SDUI. Gerado por '
         'Fenix-VE/skills/gerar_fenix_ve_abertura_bd.py.</bpmn:documentation>']

    def flow_refs(nid, ind):
        return [f'{ind}<bpmn:incoming>{i}</bpmn:incoming>' for i in incoming[nid]] + \
               [f'{ind}<bpmn:outgoing>{o}</bpmn:outgoing>' for o in outgoing[nid]]

    for n in nodes:
        k, nid, name = n['kind'], n['id'], quoteattr(n['name'])
        doc = f'      <bpmn:documentation>{escape(n["doc"])}</bpmn:documentation>' if n.get('doc') else None
        if k in ('startEvent', 'endEvent'):
            x.append(f'    <bpmn:{k} id="{nid}" name={name}>')
            x += [doc] if doc else []
            x += flow_refs(nid, '      ')
            x.append(f'    </bpmn:{k}>')
        elif k == 'userTask':
            x.append(f'    <bpmn:userTask id="{nid}" name={name} camunda:assignee="${{assignee}}">')
            x += [doc] if doc else []
            x += flow_refs(nid, '      ')
            x.append('    </bpmn:userTask>')
        elif k == 'serviceTask':
            async_attr = ' camunda:asyncBefore="true"' if n['async_before'] else ''
            x.append(f'    <bpmn:serviceTask id="{nid}" name={name} camunda:delegateExpression="${{httpTask}}"{async_attr}>')
            x += [doc] if doc else []
            x.append('      <bpmn:extensionElements>')
            if n['async_before']:
                x.append('        <camunda:failedJobRetryTimeCycle>R3/PT10S</camunda:failedJobRetryTimeCycle>')
            x.append('        <camunda:inputOutput>')
            for pname, value, is_script in n['inputs']:
                if is_script:
                    x.append(f'          <camunda:inputParameter name="{pname}">'
                             f'<camunda:script scriptFormat="groovy">{cdata(value)}</camunda:script>'
                             '</camunda:inputParameter>')
                else:
                    x.append(f'          <camunda:inputParameter name="{pname}">{escape(value)}</camunda:inputParameter>')
            x.append('        </camunda:inputOutput>')
            x.append('      </bpmn:extensionElements>')
            x += flow_refs(nid, '      ')
            x.append('    </bpmn:serviceTask>')
        elif k == 'scriptTask':
            x.append(f'    <bpmn:scriptTask id="{nid}" name={name} scriptFormat="groovy">')
            x += [doc] if doc else []
            x += flow_refs(nid, '      ')
            x.append(f'      <bpmn:script>{cdata(n["script"])}</bpmn:script>')
            x.append('    </bpmn:scriptTask>')
        elif k in ('exclusiveGateway', 'eventBasedGateway'):
            default = f' default="{gateway_default[nid]}"' if nid in gateway_default else ''
            x.append(f'    <bpmn:{k} id="{nid}" name={name}{default}>')
            x += flow_refs(nid, '      ')
            x.append(f'    </bpmn:{k}>')
        elif k == 'messageCatch':
            x.append(f'    <bpmn:intermediateCatchEvent id="{nid}" name={name}>')
            x += [doc] if doc else []
            x.append('      <bpmn:extensionElements>')
            x.append('        <camunda:properties>')
            x.append(f'          <camunda:property name="correlationTopic" value="{n["topic"]}" />')
            x.append('        </camunda:properties>')
            x.append('      </bpmn:extensionElements>')
            x += flow_refs(nid, '      ')
            x.append(f'      <bpmn:messageEventDefinition id="{nid}_Def" messageRef="{n["message"]}" />')
            x.append('    </bpmn:intermediateCatchEvent>')
        elif k == 'timerCatch':
            x.append(f'    <bpmn:intermediateCatchEvent id="{nid}" name={name}>')
            x += [doc] if doc else []
            x += flow_refs(nid, '      ')
            x.append(f'      <bpmn:timerEventDefinition id="{nid}_Def">')
            x.append(f'        <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">{escape(n["duration"])}</bpmn:timeDuration>')
            x.append('      </bpmn:timerEventDefinition>')
            x.append('    </bpmn:intermediateCatchEvent>')
        elif k == 'boundaryError':
            task = n['attached']
            x.append(f'    <bpmn:boundaryEvent id="{nid}" name={name} attachedToRef="{task}">')
            x += flow_refs(nid, '      ')
            x.append(f'      <bpmn:errorEventDefinition id="{nid}_Def" errorRef="{ERRO_HTTP}" '
                     f'camunda:errorCodeVariable="{task}-status" camunda:errorMessageVariable="{task}-response" />')
            x.append('    </bpmn:boundaryEvent>')
        else:
            raise ValueError(k)
    for f in flows:
        name = f' name={quoteattr(f["name"])}' if f['name'] else ''
        head = f'    <bpmn:sequenceFlow id="{f["id"]}" sourceRef="{f["source"]}" targetRef="{f["target"]}"{name}'
        if f['condition']:
            x.append(head + '>')
            x.append(f'      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">{escape(f["condition"])}</bpmn:conditionExpression>')
            x.append('    </bpmn:sequenceFlow>')
        else:
            x.append(head + ' />')
    x.append('  </bpmn:process>')
    x.append('  <bpmn:message id="Message_RetornoDiagnosticoHPSD" name="RetornoDiagnosticoHPSD" />')
    x.append(f'  <bpmn:error id="{ERRO_HTTP}" name="Falha técnica HTTP (timeout/conexão)" errorCode="java.io.IOException" />')

    pos, back = layout()
    bottom = max(y + h for _, y, _, h in pos.values())
    x.append('  <bpmndi:BPMNDiagram id="BPMNDiagram_1">')
    x.append(f'    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="{PROCESS_KEY}">')
    kinds = {n['id']: n['kind'] for n in nodes}
    for nid, (px, py, w, h) in pos.items():
        marker = ' isMarkerVisible="true"' if kinds[nid] == 'exclusiveGateway' else ''
        x.append(f'      <bpmndi:BPMNShape id="{nid}_di" bpmnElement="{nid}"{marker}>')
        x.append(f'        <dc:Bounds x="{px:.0f}" y="{py:.0f}" width="{w}" height="{h}" />')
        if w < 100:
            x.append(f'        <bpmndi:BPMNLabel><dc:Bounds x="{px - 30:.0f}" y="{py + h + 4:.0f}" width="{w + 60}" height="27" /></bpmndi:BPMNLabel>')
        x.append('      </bpmndi:BPMNShape>')
    for f in flows:
        x.append(f'      <bpmndi:BPMNEdge id="{f["id"]}_di" bpmnElement="{f["id"]}">')
        for wx, wy in waypoints(f, pos, back, bottom):
            x.append(f'        <di:waypoint x="{wx:.0f}" y="{wy:.0f}" />')
        x.append('      </bpmndi:BPMNEdge>')
    x.append('    </bpmndi:BPMNPlane>')
    x.append('  </bpmndi:BPMNDiagram>')
    x.append('</bpmn:definitions>')
    return '\n'.join(x) + '\n'


# ------------------------------------------------------------------------------------------------
# Snapshot do portal (o que o ms-journey-v1 lê: START, nós com tela e ligações)
# ------------------------------------------------------------------------------------------------
SNAPSHOT_TYPES = {'startEvent': 'START', 'endEvent': 'END', 'userTask': 'USER_TASK', 'serviceTask': 'SERVICE_TASK',
                  'scriptTask': 'SCRIPT_TASK', 'exclusiveGateway': 'GATEWAY', 'eventBasedGateway': 'EVENT_GATEWAY',
                  'messageCatch': 'RECEIVE_TASK', 'timerCatch': 'TIMER_EVENT'}


def build_snapshot(screens):
    export = json.loads((EXPORT / 'snapshot.json').read_text('utf-8'))
    screen_by_node = {s['uiStepId']: s for s in screens}
    bordas = {n['id'] for n in nodes if n['kind'] == 'boundaryError'}
    flow_nodes = []
    for n in nodes:
        if n['id'] in bordas:
            continue
        fn = {'id': n['id'], 'type': SNAPSHOT_TYPES[n['kind']], 'name': n['name'], 'description': n.get('doc'),
              'connectorConfig': None, 'startVariables': None, 'embeddedScreenRoot': None}
        if n['kind'] == 'startEvent':
            fn['startVariables'] = [{'name': v, 'type': 'string'} for v in START_OBRIGATORIAS]
        if n['kind'] == 'serviceTask':
            fn['connectorConfig'] = {'connectorType': 'REST', 'config': {'background': n['async_before']}}
        if n['kind'] == 'userTask':
            fn['embeddedScreenRoot'] = screen_by_node[n['id']]['data']
        flow_nodes.append(fn)
    return {'journeyId': JOURNEY_ID, 'journeyName': JOURNEY_NAME,
            'journeyDescription': 'FTAT-933 Abertura de BD pelo VE (APP) — BPMN fenix-ve-abertura-bd.bpmn',
            'productId': export.get('productId'), 'productName': export.get('productName'),
            'channelTypes': ['MOBILE'], 'versionNumber': VERSION, 'flowNodes': flow_nodes,
            'flowConnections': [{'id': f['id'], 'sourceNodeId': f['source'], 'targetNodeId': f['target']}
                                for f in flows if f['source'] not in bordas],
            'sections': []}


# ------------------------------------------------------------------------------------------------
# SQL
# ------------------------------------------------------------------------------------------------
def sql_text(value):
    return "'" + value.replace("'", "''") + "'"


def build_flyway_sql(screens, snapshot):
    rows, ids = [], []
    for s in screens:
        data = compact(s['data'])
        integrity = hashlib.sha256(data.encode('utf-8')).hexdigest()
        screen_id = str(uuid.uuid5(NS, f'{VERSION}/{s["uiStepId"]}/{integrity}'))
        ids.append(screen_id)
        rows.append(f"({sql_text(screen_id)}, {sql_text(JOURNEY_ID)}, {VERSION}, {sql_text(s['uiStepId'])}, "
                    f"'published', {sql_text(integrity)}, CURRENT_TIMESTAMP,\n {sql_text(compact(s))})")
    id_list = ', '.join(sql_text(i) for i in ids)
    return f'''-- Jornada FTAT-933 "Abertura de BD pelo VE" (fenix-ve-abertura-bd.bpmn) publicada na fachada: chave do
-- processo, snapshot e telas SDUI.
-- Processo {PROCESS_KEY}, versionTag {VERSION_TAG}: a fachada acha a jornada {JOURNEY_ID} pela chave em
-- espec_registry.process_key, lê o snapshot em espec_registry.published_snapshot e resolve a tela por
-- (journey_id, journey_version, ui_step_id = id da User Task).
-- Gerado por Fenix-VE/skills/gerar_fenix_ve_abertura_bd.py — não editar à mão.
-- Repetível: reexecuta quando o conteúdo muda; revisões anteriores das telas ficam como 'deprecated'.

DELETE FROM espec_registry.process_key WHERE process_definition_key = {sql_text(PROCESS_KEY)};
INSERT INTO espec_registry.process_key (process_definition_key, journey_id)
VALUES ({sql_text(PROCESS_KEY)}, {sql_text(JOURNEY_ID)});

UPDATE espec_registry.published_snapshot SET active = FALSE WHERE journey_id = {sql_text(JOURNEY_ID)};
DELETE FROM espec_registry.published_snapshot WHERE journey_id = {sql_text(JOURNEY_ID)} AND version_number = {VERSION};
INSERT INTO espec_registry.published_snapshot (journey_id, version_number, active, snapshot)
VALUES ({sql_text(JOURNEY_ID)}, {VERSION}, TRUE,
 {sql_text(compact(snapshot))});

UPDATE espec_registry.published_screen
   SET status = 'deprecated'
 WHERE journey_id = {sql_text(JOURNEY_ID)}
   AND journey_version = {VERSION}
   AND status = 'published'
   AND screen_id NOT IN ({id_list});

DELETE FROM espec_registry.published_screen WHERE screen_id IN ({id_list});

INSERT INTO espec_registry.published_screen
    (screen_id, journey_id, journey_version, ui_step_id, status, integrity_hash, published_at, envelope)
VALUES
''' + ',\n'.join(rows) + ';\n'


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ids = [n['id'] for n in nodes]
    assert len(ids) == len(set(ids)), 'ids duplicados'
    for f in flows:
        assert f['source'] in ids and f['target'] in ids, f
    assert len({f['id'] for f in flows}) == len(flows), 'ligações duplicadas'

    screens = build_screens()
    snapshot = build_snapshot(screens)
    BPMN_TARGETS[0].write_text(build_bpmn(), 'utf-8')
    # Desenho final pela skill de organização (ELK); o motor ignora o BPMN DI.
    subprocess.run(['node', str(Path(__file__).with_name('organizar_bpmn.mjs')), str(BPMN_TARGETS[0])], check=True)
    bpmn = BPMN_TARGETS[0].read_text('utf-8')
    for target in BPMN_TARGETS[1:]:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(bpmn, 'utf-8')
    FLYWAY_SQL.write_text(build_flyway_sql(screens, snapshot), 'utf-8')

    PACKAGE.mkdir(exist_ok=True)
    version_id = str(uuid.uuid5(NS, f'version/{VERSION}'))
    (PACKAGE / 'screens.json').write_text(json.dumps(screens, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    (PACKAGE / 'snapshot.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    (PACKAGE / 'fenix-ve-abertura-bd.bpmn').write_text(bpmn, 'utf-8')
    files = ['fenix-ve-abertura-bd.bpmn', 'screens.json', 'snapshot.json']
    manifest = {'formatVersion': 1, 'journeyId': JOURNEY_ID, 'journeyName': JOURNEY_NAME, 'versionId': version_id,
                'versionNumber': VERSION, 'versionTag': VERSION_TAG, 'processDefinitionKey': PROCESS_KEY,
                'createdBy': '00000000-0000-0000-0000-000000000001', 'publishedAt': PUBLISHED_AT,
                'bpmnFile': 'fenix-ve-abertura-bd.bpmn',
                'files': [{'name': f, 'sha256': sha256(PACKAGE / f), 'bytes': (PACKAGE / f).stat().st_size}
                          for f in files]}
    (PACKAGE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print(f'{len(nodes)} nós, {len(flows)} ligações, {len(screens)} telas')
    for target in BPMN_TARGETS + [FLYWAY_SQL, PACKAGE]:
        print('  ->', target)


if __name__ == '__main__':
    main()
