// Cria uma jornada separada para visualizar integracoes de laboratorio no canvas.
// Salva fluxo e cria/atualiza uma versao DRAFT; nunca chama endpoint de publicacao.

import { createRequire } from 'node:module';
import {
  api, login, startNode, endNode, userTaskNode, gatewayNode, serviceTaskNode, receiveTaskNode,
  connection, text, datePicker, selectList, submitButton,
} from '../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/scripts/sdui_helpers.mjs';

const require = createRequire(import.meta.url);
const ELK = require('../../journey/workspace/journey-admin/front/node_modules/elkjs/lib/elk.bundled.js');

const PRODUCT_ID = '66896bd3-f42d-4549-af38-df2c1c0e34df';
const JOURNEY_NAME = 'Abertura de BD pelo VE - Rascunho 5.2 com Fallbacks';
const CHANNEL_TYPES = ['MOBILE'];
const MOCK = 'http://localhost:8084/v1';
const KAFKA_CLUSTER_ID = '6590dbdc-6ab8-433f-9baf-0c271486157b';
const KAFKA_TOPIC = 'eljy.eventos.entrada';
const KAFKA_CREDENTIAL = 'teste';
const MOCK_CNPJ = '45537128000127';
const MOCK_CEP = '01310000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const out = (name, jsonPath, type = 'string') => ({ name, jsonPath, type });
const list = (name, jsonPath, keepFields) => ({ name, jsonPath, type: 'list', keepFields });

const actionButton = (id, label, variable, value, variant = 'primary') => ({
  id, type: 'ui.button', version: '1.0.0',
  props: { size: 'medium', label, loading: false, variant, disabled: false, fullWidth: true },
  bindings: null,
  events: { onPress: { action: 'action.submit', params: { path: `form.${variable}`, value } } },
  visibility: null, active: null, children: null,
});
const screen = (nodeId, name, description, title, children) => userTaskNode(
  nodeId, name, description, 0, 0, nodeId.replace('Node_', '').toLowerCase(), title, children,
);
const rest = (nodeId, name, description, config) => serviceTaskNode(
  nodeId, name, description, 0, 0, 'REST', config,
);

const nodes = [
  startNode('Node_Start', 'Início', 0, 0,
    'Entradas de negócio preservadas; integrações usam fixtures locais somente nesta cópia.', [
      { name: 'designador', type: 'string' },
      { name: 'productStatus', type: 'string' },
    ]),
  rest('Node_ConsultaMassiva', 'Consulta Massiva / Manutenção', 'Mock REST: fixture local do SIGITM.', {
    method: 'GET',
    url: `${MOCK}/clientes/${MOCK_CNPJ}/manutencoes-massivas`,
    headers: { Accept: 'application/json' },
    outputMapping: [
      out('massivaHttpStatus', '$httpStatus', 'number'),
      out('massivaProtocolo', '$.protocoloManutencao'),
      out('massivaStatus', '$.statusManutencao'),
      out('massivaPrevisaoConclusao', '$.previsaoConclusao'),
    ],
  }),
  rest('Node_ConsultaBD', 'Consulta BD preventivo / pró-ativo', 'Mock REST: fixture local de bilhete aberto.', {
    method: 'GET',
    url: `${MOCK}/clientes/${MOCK_CNPJ}/bilhetes-defeito`,
    headers: { Accept: 'application/json' },
    outputMapping: [
      out('bdHttpStatus', '$httpStatus', 'number'),
      out('bdNumero', '$.numeroBilhete'),
      out('bdStatus', '$.status'),
      out('bdProtocoloAtendimento', '$.protocoloAtendimento'),
      out('bdPrevisaoConclusao', '$.previsaoConclusao'),
    ],
  }),
  gatewayNode('Node_DecImpedimentos', 'Resultado das consultas de impedimento?', 0, 0),
  screen('Node_StatusMassivaFatura', 'Massiva + fatura em aberto', 'Cenário previsto pela US-03.',
    'Identificamos o que pode estar afetando seu serviço', [
      text('mf_massiva', 'Instabilidade na região — protocolo {{data.massivaProtocolo}}'),
      text('mf_fatura', 'Seu produto está com bloqueio por fatura em aberto.', 'body'),
      submitButton('mf_cta', 'Ir para a Central de faturas'),
    ]),
  screen('Node_StatusMassivaBD', 'Massiva + BD aberto', 'Cenário previsto pela US-03.',
    'Identificamos o que pode estar afetando seu serviço', [
      text('mb_massiva', 'Instabilidade na região — previsão {{data.massivaPrevisaoConclusao}}'),
      text('mb_bd', 'Você já tem o BD {{data.bdNumero}} — protocolo {{data.bdProtocoloAtendimento}}', 'body'),
      submitButton('mb_cta', 'Ir para a Central de visitas'),
    ]),
  screen('Node_StatusMassiva', 'Massiva / Manutenção ativa', 'Estado isolado da US-02/Figma.',
    'Há uma manutenção na sua região', [
      text('m_status', '{{data.massivaStatus}} — protocolo {{data.massivaProtocolo}}'),
      text('m_previsao', 'Previsão: {{data.massivaPrevisaoConclusao}}', 'body'),
      submitButton('m_cta', 'Ir para o início'),
    ]),
  screen('Node_StatusFatura', 'Fatura em aberto', 'Estado isolado da US-03/Figma.',
    'Identificamos um bloqueio no seu serviço', [
      text('f_status', 'O produto está com status de bloqueio por fatura em aberto.', 'body'),
      submitButton('f_cta', 'Ir para a Central de faturas'),
    ]),
  endNode('Node_EndBDIsolado', 'Fim - BD isolado sem layout definido', 0, 0,
    'US-01 descreve BD isolado; o Figma nao tem tela dedicada.'),
  endNode('Node_EndCombinacaoPendente', 'Fim - combinação não especificada', 0, 0,
    'Sem resultado ou tela inventados para combinacoes fora das USs/Figma.'),
  endNode('Node_EndImpedimento', 'Fim - impedimento informado'),
  screen('Node_Troubleshooting', 'Reinício e preparação do diagnóstico', 'Continuação do fluxo FTAT-933.',
    'Vamos tentar resolver o problema da sua internet', [
      text('troubleshooting_copy', 'Reinicie o modem. Se o problema continuar, podemos testar sua conexão.', 'body'),
      actionButton('troubleshooting_restart', 'Já reiniciei', 'acaoReinicio', 'reiniciei'),
      actionButton('troubleshooting_skip', 'Não consigo reiniciar', 'acaoReinicio', 'nao_consigo', 'secondary'),
    ]),
  screen('Node_PreparaDiagnostico', 'Preparação do diagnóstico', 'Passo visual baseado no Figma.',
    'Agora, vamos testar a sua conexão', [
      text('diagnostico_wait', 'Isso pode levar alguns minutos. Aguarde enquanto verificamos sua conexão.', 'body'),
      actionButton('diagnostico_continue', 'Continuar', 'acaoDiagnostico', 'continuar'),
      actionButton('diagnostico_home', 'Ir para o início', 'acaoDiagnostico', 'inicio', 'secondary'),
    ]),
  gatewayNode('Node_DecDiagnostico', 'Cliente quer iniciar o diagnóstico?', 0, 0),
  endNode('Node_EndInicio', 'Fim - cliente voltou ao início'),
  rest('Node_SolicitaHPSD', 'Solicita diagnóstico (HPSD)', 'Mock REST: confirma a solicitação; não simula o callback.', {
    method: 'POST',
    url: `${MOCK}/diagnosticos/solicitacoes`,
    headers: JSON_HEADERS,
    body: { cnpj: MOCK_CNPJ, tipoAvaliacao: 'CONECTIVIDADE_E_SINAL', designador: '{{data_designador}}' },
    outputMapping: [
      out('diagnosticoProtocolo', '$.protocolo'),
      out('diagnosticoStatus', '$.status'),
      out('diagnosticoPrevisaoRetorno', '$.previsaoRetorno'),
    ],
  }),
  receiveTaskNode('Node_AguardaHPSD', 'Aguarda callback HPSD (Kafka Local)', 'Kafka Local com tópico e credencial existentes; o mock REST não produz o evento.', 0, 0, 'KAFKA', {
    operation: 'CONSUME', topic: KAFKA_TOPIC, clusterId: KAFKA_CLUSTER_ID,
    outputMapping: [
      out('idRetornoDiagnostico', '$.payload.data.idRetorno'),
      out('diagnosticoConclusao', '$.payload.data.conclusao'),
      out('diagnosticoStatusConexao', '$.payload.data.statusConexao'),
    ],
  }, KAFKA_CREDENTIAL),
  gatewayNode('Node_DecResultadoHPSD', 'Resultado do diagnóstico?', 0, 0),
  screen('Node_SemEnergia', 'Orientação - energia elétrica', 'Caminho do ID 09 conforme US-13/Figma.',
    'O modem não está recebendo energia', [
      text('energia_copy', 'Verifique a tomada e o cabo de energia.', 'body'),
      submitButton('energia_ok', 'Já verifiquei'),
    ]),
  screen('Node_ConsultaHorariosIntro', 'Agendar visita técnica', 'Entrada para a consulta do mock WFM.',
    'Vamos agendar uma visita técnica', [
      text('agenda_intro', 'Os testes não resolveram o problema. Escolha um horário para a visita técnica.', 'body'),
      submitButton('agenda_start', 'Agendar visita'),
    ]),
  rest('Node_ConsultaSlotsWFM', 'Consulta horários no WFM (Mock)', 'Mock REST: retorna slots fixos relativos à data corrente.', {
    method: 'GET',
    url: `${MOCK}/instalacoes/horarios-disponiveis?cep=${MOCK_CEP}`,
    headers: { Accept: 'application/json' },
    outputMapping: [list('horariosVisita', '$.horarios', ['value', 'label'])],
  }),
  screen('Node_EscolheHorario', 'Escolha do horário', 'Tela baseada no Figma; lista servida pelo mock WFM.',
    'Selecione a melhor data para sua visita técnica', [
      datePicker('agenda_data', 'Data da visita técnica', 'dataVisita'),
      selectList('agenda_slots', 'Horário disponível', 'data.horariosVisita', 'horarioVisita', {
        itemValue: 'value', itemTitle: '{{item.label}}', required: true,
      }),
      submitButton('agenda_confirm', 'Confirmar agendamento'),
    ]),
  screen('Node_FalhaConsultaSlots', 'Consulta de horários indisponível', 'Fallback da US-07; copy de erro não está desenhada no Figma (UX pendente Q09).',
    'Não conseguimos consultar horários agora', [
      text('slots_fail_copy', 'Não foi possível consultar os horários da visita. Tente novamente mais tarde ou procure o atendimento Vivo.', 'body'),
      submitButton('slots_fail_home', 'Ir para o início'),
    ]),
  endNode('Node_EndFalhaConsultaSlots', 'Fim - consulta de horários indisponível'),
  rest('Node_CriaWOWFM', 'Cria Work Order (Mock)', 'Mock REST: cria agendamento de laboratório.', {
    method: 'POST',
    url: `${MOCK}/instalacoes/agendamentos`,
    headers: JSON_HEADERS,
    body: { designador: '{{data_designador}}', data: '{{form_dataVisita}}', horario: '{{form_horarioVisita}}' },
    outputMapping: [
      out('woProtocolo', '$.protocolo'),
      out('woStatus', '$.status'),
      out('woHorario', '$.horario'),
    ],
  }),
  screen('Node_FalhaAgendamentoWO', 'Agendamento não concluído', 'Fallback da US-09: informar o VE e encerrar; não cancelar sem ID de WO confirmado (Q05).',
    'Não foi possível agendar a visita', [
      text('wo_fail_copy', 'O horário escolhido não pôde ser agendado. Procure o atendimento Vivo.', 'body'),
      submitButton('wo_fail_home', 'Ir para o início'),
    ]),
  endNode('Node_EndFalhaAgendamentoWO', 'Fim - WO não agendada'),
  rest('Node_CriaBD1', 'Cria BD - tentativa 1 (Mock)', 'Mock REST genérico de chamados; resposta não representa contrato Trouble Ticket aprovado.', {
    method: 'POST',
    url: `${MOCK}/suporte/chamados`,
    headers: JSON_HEADERS,
    body: { designador: '{{data_designador}}', numeroWO: '{{data_woProtocolo}}', protocoloDiagnostico: '{{data_diagnosticoProtocolo}}' },
  }),
  screen('Node_RetryBD1', 'Falha ao criar BD - tentar novamente?', 'Decisão de nova tentativa prevista na US-10; layout/copy ainda não aprovado no Figma (Q09).',
    'Não foi possível criar o Bilhete de Defeito', [
      text('retry1_copy', 'Não conseguimos registrar o chamado. Deseja tentar novamente?', 'body'),
      actionButton('retry1_yes', 'Tentar novamente', 'retryBD1', 'sim'),
      actionButton('retry1_no', 'Cancelar visita e encerrar', 'retryBD1', 'nao', 'secondary'),
    ]),
  gatewayNode('Node_DecRetryBD1', 'Cliente aceita nova tentativa?', 0, 0),
  rest('Node_CriaBD2', 'Cria BD - tentativa 2 (Mock)', 'Segunda chamada mock de criação do BD.', {
    method: 'POST', url: `${MOCK}/suporte/chamados`, headers: JSON_HEADERS,
    body: { designador: '{{data_designador}}', numeroWO: '{{data_woProtocolo}}', protocoloDiagnostico: '{{data_diagnosticoProtocolo}}' },
  }),
  screen('Node_RetryBD2', 'Falha ao criar BD - última tentativa?', 'Decisão de nova tentativa prevista na US-10; o total de três chamadas depende de confirmação Q06.',
    'Não foi possível criar o Bilhete de Defeito', [
      text('retry2_copy', 'Não conseguimos registrar o chamado. Deseja fazer a última tentativa?', 'body'),
      actionButton('retry2_yes', 'Tentar novamente', 'retryBD2', 'sim'),
      actionButton('retry2_no', 'Cancelar visita e encerrar', 'retryBD2', 'nao', 'secondary'),
    ]),
  gatewayNode('Node_DecRetryBD2', 'Cliente aceita última tentativa?', 0, 0),
  rest('Node_CriaBD3', 'Cria BD - tentativa 3 (Mock)', 'Terceira chamada mock de criação do BD; limite de três chamadas é hipótese sujeita a Q06.', {
    method: 'POST', url: `${MOCK}/suporte/chamados`, headers: JSON_HEADERS,
    body: { designador: '{{data_designador}}', numeroWO: '{{data_woProtocolo}}', protocoloDiagnostico: '{{data_diagnosticoProtocolo}}' },
  }),
  rest('Node_CancelaWO', 'Cancela WO (Mock)', 'Cancela WO quando cliente recusa retry ou BD falha no limite modelado.', {
    method: 'POST',
    url: `${MOCK}/ordens-servico/{{data_woProtocolo}}/encerramento`,
    headers: JSON_HEADERS,
    body: { motivo: 'BD não criado' },
    outputMapping: [out('woCancelamentoStatus', '$.status')],
  }),
  screen('Node_BDNaoCriado', 'BD não criado', 'Fallback da US-10; texto/tela precisa de aprovação UX (Q09).',
    'Não foi possível concluir', [
      text('bd_fail_copy', 'Não conseguimos registrar o chamado. A visita será cancelada. Procure o atendimento Vivo.', 'body'),
      submitButton('bd_fail_home', 'Ir para o início'),
    ]),
  endNode('Node_EndBDNaoCriado', 'Fim - BD não criado'),
  endNode('Node_EndCancelWOFalhou', 'Fim técnico - cancelamento da WO sem confirmação', 0, 0,
    'Cancelamento sem resposta confirmada; política operacional pendente Q04/Q06.'),
  screen('Node_Sucesso', 'Visita agendada', 'Resultado demonstrativo com retorno do mock WFM.',
    'Você agendou a visita técnica', [
      text('success_date', 'Data: {{form_dataVisita}}', 'body'),
      text('success_slot', 'Período: {{data.woHorario}} — protocolo mock: {{data.woProtocolo}}', 'body'),
      submitButton('success_home', 'Ir para o início'),
    ]),
  endNode('Node_EndSucesso', 'Fim - visita agendada'),
  screen('Node_ReinicieNovamente', 'Reiniciar novamente', 'Ramo dos IDs 06/07/10 conforme US-12.',
    'Vamos reiniciar o modem de novo', [
      text('restart_again_copy', 'Algumas mudanças precisam que você desligue e ligue o modem.', 'body'),
      submitButton('restart_again_done', 'Já reiniciei'),
    ]),
  screen('Node_ConfirmaConexao', 'Confirmação após reinício', 'Pergunta de recuperação conforme US-12/Figma.',
    'Depois de reiniciar, a internet voltou?', [
      actionButton('connection_yes', 'Sim', 'conexaoRestabelecida', 'sim'),
      actionButton('connection_no', 'Não', 'conexaoRestabelecida', 'nao', 'secondary'),
    ]),
  gatewayNode('Node_DecConexao', 'Internet voltou?', 0, 0),
  screen('Node_SucessoResolvido', 'Problema resolvido', 'Fim de fluxo conforme US-12/Figma.',
    'Sua internet voltou a funcionar', [text('resolved_copy', 'A gente está por aqui se você precisar de ajuda.', 'body'), submitButton('resolved_home', 'Ir para o início')]),
  endNode('Node_EndResolvido', 'Fim - problema resolvido'),
];

const links = [
  ['Start', 'ConsultaMassiva'],
  ['ConsultaMassiva', 'ConsultaBD'],
  ['ConsultaBD', 'DecImpedimentos'],
  ['DecImpedimentos', 'StatusMassivaFatura', '{{data_massivaHttpStatus}} == 200 && {{data_productStatus}} == "bloqueio" && {{data_bdHttpStatus}} != 200'],
  ['DecImpedimentos', 'StatusMassivaBD', '{{data_massivaHttpStatus}} == 200 && {{data_bdHttpStatus}} == 200 && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'StatusMassiva', '{{data_massivaHttpStatus}} == 200 && {{data_bdHttpStatus}} != 200 && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'StatusFatura', '{{data_massivaHttpStatus}} != 200 && {{data_bdHttpStatus}} != 200 && {{data_productStatus}} == "bloqueio"'],
  ['DecImpedimentos', 'EndBDIsolado', '{{data_massivaHttpStatus}} != 200 && {{data_bdHttpStatus}} == 200 && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'Troubleshooting', '{{data_massivaHttpStatus}} != 200 && {{data_bdHttpStatus}} != 200 && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'EndCombinacaoPendente', null, true],
  ['StatusMassivaFatura', 'EndImpedimento'],
  ['StatusMassivaBD', 'EndImpedimento'],
  ['StatusMassiva', 'EndImpedimento'],
  ['StatusFatura', 'EndImpedimento'],
  ['Troubleshooting', 'PreparaDiagnostico'],
  ['PreparaDiagnostico', 'DecDiagnostico'],
  ['DecDiagnostico', 'EndInicio', '{{form_acaoDiagnostico}} == "inicio"'],
  ['DecDiagnostico', 'SolicitaHPSD', null, true],
  ['SolicitaHPSD', 'AguardaHPSD'],
  ['AguardaHPSD', 'DecResultadoHPSD'],
  ['DecResultadoHPSD', 'SemEnergia', '{{data_idRetornoDiagnostico}} == "09"'],
  ['DecResultadoHPSD', 'ReinicieNovamente', '{{data_idRetornoDiagnostico}} == "06" || {{data_idRetornoDiagnostico}} == "07" || {{data_idRetornoDiagnostico}} == "10"'],
  ['DecResultadoHPSD', 'ConsultaHorariosIntro', null, true],
  ['ReinicieNovamente', 'ConfirmaConexao'],
  ['ConfirmaConexao', 'DecConexao'],
  ['DecConexao', 'SucessoResolvido', '{{form_conexaoRestabelecida}} == "sim"'],
  ['DecConexao', 'ConsultaHorariosIntro', null, true],
  ['SucessoResolvido', 'EndResolvido'],
  ['SemEnergia', 'ConsultaHorariosIntro'],
  ['ConsultaHorariosIntro', 'ConsultaSlotsWFM'],
  ['ConsultaSlotsWFM', 'EscolheHorario'],
  ['ConsultaSlotsWFM', 'FalhaConsultaSlots', null, false, true],
  ['FalhaConsultaSlots', 'EndFalhaConsultaSlots'],
  ['EscolheHorario', 'CriaWOWFM'],
  ['CriaWOWFM', 'CriaBD1'],
  ['CriaWOWFM', 'FalhaAgendamentoWO', null, false, true],
  ['FalhaAgendamentoWO', 'EndFalhaAgendamentoWO'],
  ['CriaBD1', 'Sucesso'],
  ['CriaBD1', 'RetryBD1', null, false, true],
  ['RetryBD1', 'DecRetryBD1'],
  ['DecRetryBD1', 'CriaBD2', '{{form_retryBD1}} == "sim"'],
  ['DecRetryBD1', 'CancelaWO', null, true],
  ['CriaBD2', 'Sucesso'],
  ['CriaBD2', 'RetryBD2', null, false, true],
  ['RetryBD2', 'DecRetryBD2'],
  ['DecRetryBD2', 'CriaBD3', '{{form_retryBD2}} == "sim"'],
  ['DecRetryBD2', 'CancelaWO', null, true],
  ['CriaBD3', 'Sucesso'],
  ['CriaBD3', 'CancelaWO', null, false, true],
  ['CancelaWO', 'BDNaoCriado'],
  ['CancelaWO', 'EndCancelWOFalhou', null, false, true],
  ['BDNaoCriado', 'EndBDNaoCriado'],
  ['Sucesso', 'EndSucesso'],
];

const connections = links.map(([from, to, condition, isDefault = false, onError = false]) => ({
  ...connection(`Flow_${from}_${to}`, `Node_${from}`, `Node_${to}`, { condition, isDefault }),
  label: null,
  onError,
}));

const annotations = [
  { id: 'Annotation_Start', text: 'Entradas START: designador:string e productStatus:string. Os valores do asset são fornecidos em runtime.', linkedNodeIds: ['Node_Start'] },
  { id: 'Annotation_MockFixtures', text: `FIXTURE DE LAB: as consultas Massiva/BD e as chamadas HPSD/WFM usam APIs locais com CNPJ ${MOCK_CNPJ} e CEP ${MOCK_CEP}. Não são integrações produtivas nem usam o designador recebido. As consultas iniciais ficam sem fallback/tela de erro conforme decisão registrada no dossiê.`, linkedNodeIds: ['Node_ConsultaMassiva', 'Node_ConsultaBD'] },
  { id: 'Annotation_Finance', text: 'Bloqueio financeiro lido de productStatus no START; a premissa define o valor bloqueio. Não há GET financeiro neste fluxo mock.', linkedNodeIds: ['Node_DecImpedimentos'] },
  { id: 'Annotation_HPSDMock', text: 'O POST mock apenas retorna protocolo/status de recebimento. As USs não definem fallback específico para erro HTTP desse POST; não foi criada rota de erro. O resultado segue por Kafka Local e precisa ser publicado separadamente no tópico para a instância avançar.', linkedNodeIds: ['Node_SolicitaHPSD', 'Node_AguardaHPSD'] },
  { id: 'Annotation_Kafka', text: `Kafka de laboratório confirmado no catálogo: cluster Kafka Local ${KAFKA_CLUSTER_ID}, tópico ${KAFKA_TOPIC}, credentialRef ${KAFKA_CREDENTIAL}. O payload do callback continua sendo uma fixture de laboratório. Sem timeout/fallback configurado enquanto Q07 não define SLA e tratamento de ausência do evento.`, linkedNodeIds: ['Node_AguardaHPSD'] },
  { id: 'Annotation_SlotsFallback', text: 'Fallback W-04/US-07: se a consulta de slots falhar, informar indisponibilidade ao VE e encerrar; texto de tela provisório, Q09 pendente de UX.', linkedNodeIds: ['Node_ConsultaSlotsWFM', 'Node_FalhaConsultaSlots'] },
  { id: 'Annotation_WOFallback', text: 'Fallback US-09: se WFM não criar a WO, informar falha e encerrar. A US também menciona cancelar WO criada, mas sem ID confirmado não cancelar; resolver a contradição Q05.', linkedNodeIds: ['Node_CriaWOWFM', 'Node_FalhaAgendamentoWO'] },
  { id: 'Annotation_BDFallback', text: 'Fallback US-10: em falha do POST BD, pedir decisão do cliente; recusa ou limite de tentativas leva a cancelamento da WO. Este rascunho modela 3 chamadas no total (1 inicial + 2 retries); confirmar a contagem em Q06. Telas são provisórias, UX Q09 pendente.', linkedNodeIds: ['Node_CriaBD1', 'Node_RetryBD1', 'Node_CriaBD2', 'Node_RetryBD2', 'Node_CriaBD3', 'Node_CancelaWO']},
  { id: 'Annotation_WFM', text: 'WFM é substituído pelos mocks locais de consulta/criação. O POST de BD usa endpoint genérico de chamados, não o contrato TMF621 aprovado. Falha de cancelamento da WO termina em estado técnico sem tela; retry/escalonamento ainda não especificado.', linkedNodeIds: ['Node_ConsultaSlotsWFM', 'Node_CriaWOWFM', 'Node_CriaBD1', 'Node_CancelaWO']},
];

async function applyLayout() {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90', 'elk.spacing.nodeNode': '60',
      'elk.padding': '[top=100,left=80,bottom=80,right=80]',
    },
    children: nodes.map((node) => ({
      id: node.nodeId,
      width: node.nodeType === 'START' || node.nodeType === 'END' ? 52 : node.nodeType === 'GATEWAY' ? 50 : 78,
      height: node.nodeType === 'START' || node.nodeType === 'END' ? 52 : node.nodeType === 'GATEWAY' ? 50 : 78,
    })),
    edges: connections.map((edge) => ({ id: edge.connectionId, sources: [edge.sourceNodeId], targets: [edge.targetNodeId] })),
  };
  const result = await new ELK().layout(graph);
  const positions = new Map((result.children ?? []).map((node) => [node.id, node]));
  for (const node of nodes) {
    const position = positions.get(node.nodeId);
    node.positionX = Math.round(position.x);
    node.positionY = Math.round(position.y);
  }
  const nodeById = new Map(nodes.map((node) => [node.nodeId, node]));
  annotations.forEach((annotation, index) => {
    const linkedNode = nodeById.get(annotation.linkedNodeIds[0]);
    annotation.positionX = linkedNode.positionX;
    annotation.positionY = Math.max(0, linkedNode.positionY - 110 - (index % 2) * 70);
  });
}

async function main() {
  await applyLayout();
  const token = await login();
  const existing = (await api('GET', `/journeys?productId=${PRODUCT_ID}`, token)).find((item) => item.name === JOURNEY_NAME);
  if (existing && ['INACTIVE', 'PUBLISHED'].includes(existing.status)) {
    throw new Error(`Jornada mock existente nao pode ser alterada com status ${existing.status}: ${existing.journeyId}`);
  }
  const journey = existing ?? await api('POST', '/journeys', token, {
    productId: PRODUCT_ID,
    channelTypes: CHANNEL_TYPES,
    name: JOURNEY_NAME,
    description: 'Copia de visualizacao com conectores de laboratorio. Mantida em DRAFT; nao publicada.',
    templateId: null,
  });
  const flow = {
    name: 'Fluxo Abertura de BD pelo VE - Integrações Mock', nodes, connections, annotations, sections: [],
  };
  await api('POST', `/journeys/${journey.journeyId}/flow/validate`, token, flow);
  await api('PUT', `/journeys/${journey.journeyId}/flow`, token, flow);
  const version = await api('POST', `/journeys/${journey.journeyId}/versions`, token, {
    description: 'Rascunho visual com APIs REST mockadas e Kafka Local; nao publicar.',
  });
  const current = await api('GET', `/journeys/${journey.journeyId}/versions`, token);
  console.log(JSON.stringify({
    journeyId: journey.journeyId,
    name: journey.name,
    versionId: version.versionId,
    versionNumber: version.versionNumber,
    versionStatus: current.find((item) => item.versionId === version.versionId)?.status,
    nodes: nodes.length,
    connections: connections.length,
    annotations: annotations.length,
    published: false,
  }, null, 2));
}

main().catch((error) => { console.error('FALHOU:', error.message); process.exit(1); });
