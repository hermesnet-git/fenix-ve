// Jornada "Fenix - Abertura de BD" (Fênix, FTAT-933) do produto "Vivo empresas - VE", canal App.
// Derivada de jornada_abertura_bd_ve_integracoes.mjs (que fica intacto). Mesmas telas, decisões,
// seções e integrações PREPROD; muda o nome, as variáveis de entrada e a configuração do Kafka.
//
// - Entradas (START): somente designador, productStatus, correlationId e requestTimestamp
//   (no motor: data_designador, data_productStatus, data_correlationId, data_requestTimestamp).
// - Campos que dependiam de outras entradas (IDs do TMF653, wfm_*, bd_*) seguem no body com valor
//   vazio até a origem ser definida; pendências nas notas do canvas e no dossiê de integrações.
// - BPMN organizado gerado como fenix-ve-abertura-bd.bpmn, com o id de processo "fenix-ve-abertura-bd".
//
// Rode com: node jornada_fenix_abertura_bd.mjs

import { createRequire } from 'node:module';
import {
  api, login, ensureJourney,
  startNode, endNode, userTaskNode, gatewayNode, serviceTaskNode, receiveTaskNode, connection,
  text, checkbox, datePicker, submitButton, alert, card, stack,
} from '../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/scripts/sdui_helpers.mjs';

const require = createRequire(import.meta.url);
const ELK = require('../../journey/workspace/journey-admin/front/node_modules/elkjs/lib/elk.bundled.js');

const JOURNEY_NAME = 'Fenix - Abertura de BD';
const DFT_RESULT_TOPIC = 'telco.service.servicetestmanagement.servicetestresult';
const VE_PRODUCT_ID = '66896bd3-f42d-4549-af38-df2c1c0e34df';
// Mesma configuração de mensageria usada na publicação da v3 de "Abertura de BD pelo VE" (cluster local de laboratório).
const KAFKA_CLUSTER_ID = '6590dbdc-6ab8-433f-9baf-0c271486157b';
const KAFKA_CREDENTIAL = 'teste';

// Endpoints PREPROD: OpenAPI PREPROD do Customer Problem (INT01) e servidores spmg-preprod do Trouble Ticket V1.1.0 (INT03/INT18).
// HPSD (INT06): o OpenAPI GTW Redes não lista "preprod"; api-hml usado como PREPROD até confirmação.
const CPM_INCIDENTS_URL = 'https://cssp-preprod.redecorp.br/customer-problem-management/v1/incidents';
const TT_URL = 'https://spmg-preprod.redecorp.azr/troubleTicketManagement/v1/troubleTicket';
const HPSD_URL = 'https://api-hml.telefonica.com.br/gtw-redes/serviceTestManagement/v1/serviceTest';

const ACCEPT = { Accept: 'application/json' };
const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' };
// Prefixos TID dos PreDataMappings: Consulta BD v2.0 (INT003), Slot WFM v2.2 (INT005), Abertura BD v2.1 (INT009).
const tid = (intCode) => `TID_ELJY_FTAT933${intCode}_{{data_requestTimestamp}}`;
const correlacao = { 'X-Vivo-Correlation-Id': '{{data_correlationId}}' };
const rastreio = (intCode) => ({ 'X-Vivo-Transaction-Id': tid(intCode), ...correlacao });

const START_VARIABLES = ['designador', 'productStatus', 'correlationId', 'requestTimestamp']
  .map((name) => ({ name, type: 'string' }));

// --- Bodies dos PreDataMappings (valores sem origem definida ficam vazios) ----------------------
const PENDENTE = '';
const SLOT_BODY = {
  relatedParty: { role: 'acronym', name: 'TT_B' },
  relatedEntity: [{ role: 'Ouvidoria', id: PENDENTE, '@type': 'Attendant' }],
  requestedTimeSlot: [{ validFor: { startDateTime: PENDENTE, endDateTime: PENDENTE } }],
  relatedPlace: {
    geographicAddress: {
      placePhysicalResourceAssoc: { resourceSpecificationCharacteristic: [{ name: 'mediaType', value: 'GPON' }] },
      telephonicArea: PENDENTE,
      networkOwner: PENDENTE,
      cnl: PENDENTE,
      centralOffice: PENDENTE,
      geographicSite: { '@type': 'Cabinet', id: PENDENTE },
    },
  },
};

const entity = (outerType, type, name, id) => ({ '@type': outerType, entity: { '@type': type, name, id } });
const characteristic = (name, value) => ({ name, value });
const pendente = (name) => characteristic(name, PENDENTE);
const ABRIR_BD_BODY = {
  '@type': 'TroubleTicket',
  ticketType: 'Case',
  description: PENDENTE,
  severity: PENDENTE,
  requestedResolutionDate: PENDENTE,
  expectedResolutionDate: PENDENTE,
  name: PENDENTE,
  channel: { name: PENDENTE, '@type': 'ServiceProblemCase' },
  relatedEntity: [
    entity('Product', 'ServiceTest', 'ProductInventory', PENDENTE),
    entity('Service', 'ServiceTest', 'testSpecification', PENDENTE),
    entity('Service', 'Service', 'relatedServiceSpecification', PENDENTE),
    entity('Service', 'Service', 'relatedService', PENDENTE),
    entity('Service', 'Service', 'mode', 'Proactive'),
  ],
  relatedParty: [{
    '@type': 'Customer',
    role: 'Digital',
    partyOrPartyRole: {
      '@type': 'Customer',
      id: PENDENTE,
      name: PENDENTE,
      '@referredType': 'CustomerContact',
      characteristic: [pendente('EmailContactMedium'), pendente('PhoneContactMedium'), pendente('idCustomer')],
    },
  }],
  troubleTicketCharacteristic: [
    ...['estadoDescricao', 'city', 'endBairro', 'postcode', 'telephonicArea', 'streetName', 'streetNr',
      'complement', 'reclamanteNome', 'documentNumber', 'clienteClassificacao', 'contatoLocal',
      'telefoneContatoLocal1', 'telefoneContatoLocal2', 'motivo', 'submotivo', 'SLA', 'tipoDescricao',
      'tipoOferta'].map(pendente),
    characteristic('designadorAcesso', '{{data_designador}}'),
    ...['velocidade', 'servicoCpccNome'].map(pendente),
    characteristic('WorkOrder', '{{data_woNumero}}'),
    pendente('WorkOrderItem'),
    ...['etapa', 'telefoneTitular1', 'telefoneTitular2', 'telefoneReclamante1', 'telefoneReclamante2',
      'horarioFuncionamento', 'preferenciaContato', 'palitagemFinal'].map(pendente),
    characteristic('previsaoAtendimento', '{{form_dataVisita}} {{data_woHorario}}'),
    pendente('caseOrigin'),
    pendente('payloadDiagnostico'),
    pendente('idAppointment'),
  ],
};

const out = (name, jsonPath, type = 'string') => ({ name, jsonPath, type });
const list = (name, jsonPath, keepFields) => ({ name, jsonPath, type: 'list', keepFields });
const body = (id, value) => text(id, value, 'body');
const caption = (id, value) => text(id, value, 'caption');
const heading = (id, value) => text(id, value, 'heading');
const actionButton = (id, label, varName, value, opts = {}) => ({
  id, type: 'ui.button', version: '1.0.0',
  props: { size: 'medium', label, loading: false, variant: opts.variant ?? 'primary', disabled: false, fullWidth: true },
  bindings: null, events: { onPress: { action: 'action.submit', params: { path: `form.${varName}`, value } } },
  visibility: null, active: null, children: null,
});
const selectList = (id, label, source, varName, opts = {}) => ({
  id, type: 'ui.selectList', version: '1.0.0',
  props: {
    label, itemValue: opts.itemValue, itemTitle: opts.itemTitle,
    itemDescription: opts.itemDescription ?? null, itemHint: opts.itemHint ?? null,
    emptyMessage: opts.emptyMessage ?? null, maxItems: 50, actions: opts.actions ?? [], required: opts.required ?? true,
  },
  bindings: {
    items: { path: source.startsWith('data.') ? source : `data.${source}`, mode: 'oneWay' },
    value: { path: `form.${varName}`, mode: 'twoWay' },
  },
  events: { onAction: { action: 'action.submit', params: {} } }, visibility: null, active: null, children: null,
});
const secondary = (id, label, varName, value) => actionButton(id, label, varName, value, { variant: 'secondary' });
const passos = (p) => [body(`${p}_1`, '1. Retire o modem da tomada'), body(`${p}_2`, '2. Aguarde 30 segundos'), body(`${p}_3`, '3. Ligue o modem de novo')];

// Nós nascem em (0, 0): o layout (ELK) preenche as posições depois.
const tela = (id, name, desc, title, children) => userTaskNode(id, name, desc, 0, 0, id.replace('Node_', '').toLowerCase(), title, children);
const rest = (id, name, desc, config) => serviceTaskNode(id, name, desc, 0, 0, 'REST', config);

// --- Blocos de tela reaproveitados ------------------------------------------------------------
const TITULO_IMPEDIMENTO = 'Identificamos o que pode estar afetando seu serviço';
const cardMassiva = (p) => card(`card_${p}_massiva`, [stack(`stack_${p}_massiva`, [
  heading(`${p}_massiva_titulo`, 'Instabilidade na região'),
  body(`${p}_massiva_prev`, 'Os serviços devem voltar a funcionar em {{data.massivaPrevisaoConclusao}}'),
  caption(`${p}_massiva_prot`, 'Protocolo {{data.massivaProtocolo}}'),
])]);
const cardFaturas = (p) => card(`card_${p}_faturas`, [stack(`stack_${p}_faturas`, [
  heading(`${p}_fat_titulo`, 'Faturas em atraso'),
  caption(`${p}_fat_sub`, 'Identificamos um bloqueio financeiro. Consulte as faturas na Central de faturas.'),
])]);
const cardVisita = (p) => card(`card_${p}_visita`, [stack(`stack_${p}_visita`, [
  heading(`${p}_vis_titulo`, 'Visita técnica agendada'),
  caption(`${p}_vis_sub`, 'Abaixo mais informações sobre a visita técnica agendada'),
  body(`${p}_vis_data`, 'Agendada para {{data.bdPrevisaoConclusao}}'),
  caption(`${p}_vis_prot`, 'Protocolo {{data.bdProtocoloAtendimento}}'),
])]);
const statusTela = (id, name, cards, botao) => tela(id, name, 'Tela de impedimento do Figma (Status de bloqueio - Cenários possíveis).', TITULO_IMPEDIMENTO, [
  text(`${id}_titulo`, TITULO_IMPEDIMENTO, 'title'), ...cards, submitButton(`${id}_btn`, botao),
]);
const voltou = (id, name, pergunta, dica, varName) => tela(id, name, 'Pergunta do Figma: Sim encerra como resolvido, Não segue.', 'Suporte técnico', [
  text(`${id}_titulo`, pergunta, 'title'), caption(`${id}_dica`, dica),
  actionButton(`${id}_sim`, 'Sim', varName, 'sim', { variant: 'secondary' }), secondary(`${id}_nao`, 'Não', varName, 'nao'),
]);

// --- Etapas -------------------------------------------------------------------------------------
const nodes = [
  startNode('Node_Start', 'Início', 0, 0, 'O VE inicia a jornada com designador, productStatus, correlationId e requestTimestamp. O token OAM vai no header Authorization, não como variável.', START_VARIABLES),

  // Consultas e impedimentos
  rest('Node_ConsultaMassiva', 'Consulta Massiva/Manutenção', 'INT01: GET /incidents?serviceDesignator (decisão P03). Campo protocolo pendente.', {
    method: 'GET', url: `${CPM_INCIDENTS_URL}?serviceDesignator={{data_designador}}`,
    headers: ACCEPT,
    outputMapping: [
      out('massivaHttpStatus', '$httpStatus', 'number'),
      out('massivaTotal', '$.totalResults', 'number'),
      out('massivaPrevisaoConclusao', '$.incidents[0].expectedResolutionDate'),
      out('massivaProtocolo', '$.protocoloManutencao'),
    ],
  }),
  rest('Node_ConsultaBD', 'Consulta BD aberto', 'INT03: GET /troubleTicket no MS Trouble Ticket (decisão P04/A). 404 = nenhum BD ativo.', {
    method: 'GET', url: `${TT_URL}?filter=designatorId:{{data_designador}};status:Active;ticketType:Case`,
    headers: { ...ACCEPT, ...rastreio('INT003') },
    outputMapping: [
      out('bdHttpStatus', '$httpStatus', 'number'), out('bdNumero', '$[0].id'),
      out('bdProtocoloAtendimento', '$.protocoloAtendimento'), out('bdPrevisaoConclusao', '$.previsaoConclusao'),
    ],
  }),
  gatewayNode('Node_DecImpedimento', 'Cliente tem algum ponto de impedimento do serviço?', 0, 0, 'Losango do Figma; vale a primeira condição verdadeira.'),
  gatewayNode('Node_DecComMassiva', 'Há bloqueio financeiro?', 0, 0),
  gatewayNode('Node_DecMassivaSemFatura', 'Há BD aberto?', 0, 0),
  gatewayNode('Node_DecSemMassiva', 'Há bloqueio financeiro?', 0, 0),
  gatewayNode('Node_DecSemMassivaSemFatura', 'Há BD aberto?', 0, 0),
  statusTela('Node_StatusMassivaAtraso', 'Massiva + atraso em pagamentos', [cardMassiva('sma'), cardFaturas('sma')], 'Ir pra Central de faturas'),
  statusTela('Node_StatusMassivaVisita', 'Massiva + visita técnica', [cardMassiva('smv'), cardVisita('smv')], 'Ir pra Central de visitas'),
  tela('Node_StatusMassiva', 'Massiva', 'Tela de impedimento do Figma (Cenário Massiva).', 'Instabilidade na região', [
    text('sm_titulo', 'Identificamos uma instabilidade na sua região', 'title'),
    body('sm_prev', 'Os serviços devem voltar a funcionar em {{data.massivaPrevisaoConclusao}}'),
    caption('sm_prot', 'Protocolo {{data.massivaProtocolo}}'),
    submitButton('sm_btn', 'Ir para o início'),
  ]),
  statusTela('Node_StatusAtraso', 'Atraso em pagamentos', [cardFaturas('sa')], 'Ir pra Central de faturas'),
  statusTela('Node_StatusVisita', 'Visita técnica agendada', [cardVisita('sv')], 'Ir pra Central de visitas'),
  endNode('Node_End_Impedimento', 'Fim — impedimento', 0, 0),

  // Reinício do modem (Troubleshooting)
  tela('Node_Reinicie', 'Reinicie o modem', 'Troubleshooting do Figma.', 'Suporte técnico', [
    text('re_titulo', 'Até aqui, não identificamos o que está afetando sua internet', 'title'),
    body('re_sub', 'Agora, vamos reiniciar o modem para tentar resolver o problema. Siga as etapas:'),
    ...passos('re_passo'),
    actionButton('re_ok', 'Já reiniciei', 'acaoReinicio', 'reiniciei'),
    secondary('re_nao', 'Não consigo reiniciar', 'acaoReinicio', 'nao_consigo'),
  ]),
  gatewayNode('Node_DecReinicio', 'Conseguiu reiniciar?', 0, 0),
  voltou('Node_VoltouReinicio', 'A internet voltou?', 'Depois de reiniciar o modem, a internet voltou a funcionar?', 'Aguarde as luzes pararem de piscar antes de testar', 'voltouReinicio'),
  gatewayNode('Node_DecVoltouReinicio', 'Voltou após reiniciar?', 0, 0),
  tela('Node_InternetVoltou', 'Sua internet voltou', 'Final de fluxo do Figma (problema resolvido).', 'Suporte técnico', [
    text('iv_titulo', 'Sua internet voltou a funcionar', 'title'),
    body('iv_sub', 'A gente está por aqui se você precisar de ajuda'),
    submitButton('iv_btn', 'Ir para o início'),
  ]),
  endNode('Node_End_Resolvido', 'Fim — problema resolvido', 0, 0),

  // Diagnóstico automático
  tela('Node_TesteConexao', 'Vamos testar a sua conexão', 'Diagnóstico automático do Figma: Continuar equivale a "cliente pronto".', 'Suporte técnico', [
    text('tc_titulo', 'Agora, vamos testar a sua conexão', 'title'),
    body('tc_sub', 'Como o problema continua, a gente vai tentar identificar o que está acontecendo'),
    heading('tc_1t', 'Isso pode levar alguns minutos'), caption('tc_1d', 'Aguarde enquanto verificamos sua conexão'),
    heading('tc_2t', 'Você pode ficar sem internet'), caption('tc_2d', 'Isso pode acontecer durante os testes'),
    heading('tc_3t', 'Use outra conexão'), caption('tc_3d', 'Se possível, use os dados móveis do seu celular'),
    actionButton('tc_ok', 'Continuar', 'acaoTeste', 'continuar'),
    secondary('tc_inicio', 'Ir para o início', 'acaoTeste', 'inicio'),
  ]),
  gatewayNode('Node_DecTeste', 'Cliente quer testar?', 0, 0),
  endNode('Node_End_Desistiu', 'Fim — cliente voltou ao início', 0, 0),
  rest('Node_SolicitaDiagnostico', 'Solicita diagnóstico (HPSD)', 'INT06: TMF653 POST /serviceTest. Headers UUID v4 e IDs de serviço/especificação sem origem definida (P06).', {
    method: 'POST', url: HPSD_URL,
    headers: { ...JSON_HEADERS, 'X-Vivo-Transaction-Id': PENDENTE, 'X-Vivo-Correlation-Id': PENDENTE },
    body: {
      name: 'Diagnóstico automático FTTH',
      relatedService: { id: PENDENTE },
      testSpecification: { id: PENDENTE },
      relatedParty: [{ id: PENDENTE, role: 'ExternalId' }],
    },
    outputMapping: [out('diagnosticoServiceTestId', '$.id')],
  }),
  receiveTaskNode('Node_AguardaDiagnostico', 'Aguarda resultado do diagnóstico', `DFT INT10: aguarda evento no tópico ${DFT_RESULT_TOPIC}; cluster local de laboratório, schema do callback pendente.`, 0, 0, 'KAFKA', {
    operation: 'CONSUME', topic: DFT_RESULT_TOPIC, clusterId: KAFKA_CLUSTER_ID, payloadMode: 'GENERIC_DUMP', waitTimeoutMs: 180000,
    outputMapping: [out('idRetorno', '$.payload.data.idRetorno')],
  }, KAFKA_CREDENTIAL),
  gatewayNode('Node_DecIdDiagnostico', 'IDs de respostas do diagnóstico', 0, 0, 'Losango do Figma.'),

  // Reiniciar novamente (ID 06, 07 ou 10)
  tela('Node_ReinicieNovamente', 'Reinicie de novo', 'Cenário "Reiniciar novamente" do Figma.', 'Suporte técnico', [
    text('rn_titulo', 'Vamos reiniciar o modem de novo', 'title'),
    body('rn_sub', 'Algumas mudanças precisam que você desligue e ligue o modem. Siga as etapas:'),
    ...passos('rn_passo'),
    submitButton('rn_ok', 'Já reiniciei'),
  ]),
  voltou('Node_VoltouNovamente', 'A internet voltou?', 'Depois de reiniciar o modem, a internet voltou a funcionar?', 'Aguarde as luzes pararem de piscar antes de testar', 'voltouNovamente'),
  gatewayNode('Node_DecVoltouNovamente', 'Voltou após o ajuste?', 0, 0),

  // Sem energia (ID 09)
  tela('Node_SemEnergia', 'Modem sem energia', 'Cenário "Sem sinal de energia elétrica" do Figma.', 'Suporte técnico', [
    text('se_titulo', 'O modem não está recebendo energia', 'title'),
    body('se_sub', 'Vamos verificar o que pode estar acontecendo'),
    heading('se_1t', 'A tomada está funcionando?'), caption('se_1d', 'Você pode testar o modem em outro ponto de energia que esteja funcionando'),
    heading('se_2t', 'O cabo de energia está conectado?'), caption('se_2d', 'Verifique se o modem está bem encaixado'),
    actionButton('se_ok', 'Já verifiquei', 'acaoEnergia', 'verifiquei'),
    secondary('se_nao', 'Não consigo verificar', 'acaoEnergia', 'nao_consigo'),
  ]),
  gatewayNode('Node_DecEnergia', 'Conseguiu verificar?', 0, 0),
  voltou('Node_VoltouEnergia', 'A internet voltou?', 'Depois de testar a tomada e o cabo, sua internet voltou a funcionar?', 'Aguarde as luzes do modem pararem de piscar antes de testar a conexão', 'voltouEnergia'),
  gatewayNode('Node_DecVoltouEnergia', 'Voltou após verificar?', 0, 0),
  tela('Node_TemEnergia', 'Tem energia no endereço?', 'Cenário "Sem sinal de energia elétrica" do Figma.', 'Suporte técnico', [
    text('te_titulo', 'Tem energia elétrica no seu endereço?', 'title'),
    body('te_sub', 'Pode ser que o problema esteja na rede elétrica. As luzes e outros aparelhos estão funcionando normalmente?'),
    actionButton('te_sim', 'Sim', 'temEnergia', 'sim', { variant: 'secondary' }), secondary('te_nao', 'Não', 'temEnergia', 'nao'),
  ]),
  gatewayNode('Node_DecTemEnergia', 'Há energia no endereço?', 0, 0),
  tela('Node_RedeEletrica', 'Problema na rede elétrica', 'Final de fluxo do Figma (sem energia no endereço).', 'Suporte técnico', [
    text('rl_titulo', 'O problema pode estar na rede elétrica', 'title'),
    body('rl_sub', 'Pode ser que algo não esteja funcionando bem na rede elétrica. Assim que tudo estiver normalizado, você pode fazer um novo teste'),
    submitButton('rl_btn', 'Ir para o início'),
  ]),
  endNode('Node_End_RedeEletrica', 'Fim — rede elétrica', 0, 0),

  // Abertura de BD
  tela('Node_AgendarVisita', 'Vamos agendar uma visita técnica', 'Abertura de BD do Figma.', 'Suporte técnico', [
    text('av_titulo', 'Vamos agendar uma visita técnica', 'title'),
    body('av_sub', 'Os testes não resolveram o problema com a sua internet. A nossa equipe técnica vai até o endereço para avaliar o que está acontecendo'),
    actionButton('av_ok', 'Agendar visita', 'acaoAgendar', 'agendar'),
    secondary('av_inicio', 'Ir para o início', 'acaoAgendar', 'inicio'),
  ]),
  gatewayNode('Node_DecAgendar', 'Cliente quer agendar?', 0, 0),
  endNode('Node_End_SemAgendar', 'Fim — sem agendamento', 0, 0),
  rest('Node_ConsultaSlots', 'Consulta horários (WFM)', 'INT11: POST à WFM Orchestration com headers e body do PreDataMapping WFM v2.2 (VIVO1). URL interna aguarda P05.', {
    method: 'POST', url: 'TBD',
    headers: { ...JSON_HEADERS, flow: 'B2B_MASSIVO', requestSystem: 'MVE', ...rastreio('INT005') },
    body: SLOT_BODY,
    outputMapping: [list('horariosVisita', '$.horarios', ['value', 'label'])],
  }),
  tela('Node_EscolheHorario', 'Escolha do horário', 'Layout do Figma: data, períodos e aceite de aviso.', 'Agendar visita técnica', [
    text('eh_titulo', 'Selecione a melhor data para agendar sua visita técnica', 'title'),
    datePicker('eh_data', 'Data da visita técnica', 'dataVisita'),
    selectList('eh_horarios', 'Horários', 'data.horariosVisita', 'horarioVisita', {
      itemValue: 'value', itemTitle: '{{item.label}}', emptyMessage: 'Não há horários disponíveis.', actions: [],
    }),
    checkbox('eh_aviso', 'Aceito que a Vivo me avise se surgir um horário mais cedo', 'avisarHorarioMaisCedo'),
    submitButton('eh_ok', 'Confirmar agendamento'),
  ]),
  rest('Node_CriaWO', 'Cria WO (WFM)', 'INT14: POST /createWorkOrder na WFM Orchestration; base interna e mapping aguardam P05.', {
    method: 'POST', url: 'TBD', headers: { ...JSON_HEADERS, ...correlacao },
    outputMapping: [out('woNumero', '$.protocolo'), out('woStatus', '$.status'), out('woHorario', '$.horario')],
  }),
  gatewayNode('Node_DecAgendado', 'Agendado com sucesso?', 0, 0),
  tela('Node_HorarioOcupado', 'Horário ocupado', 'Tela criada aqui (US 7): o horário foi usado por outro atendimento.', 'Agendar visita técnica', [
    alert('ho_alerta', 'warning', 'O horário escolhido acabou de ser ocupado por outro atendimento. Escolha outro horário.', { title: 'Não conseguimos agendar' }),
    submitButton('ho_btn', 'Escolher outro horário'),
  ]),
  rest('Node_CriaBD', 'Cria BD', 'INT18: POST /troubleTicket no MS Trouble Ticket (decisão P04) com a estrutura do PreDataMapping Abertura BD v2.1. O MS orquestra TMF629/TMF621.', {
    method: 'POST', url: TT_URL,
    headers: { ...JSON_HEADERS, ...rastreio('INT009') },
    body: ABRIR_BD_BODY,
    outputMapping: [
      out('bdCriadoHttpStatus', '$httpStatus', 'number'),
      out('bdCriadoId', '$.id'),
      out('bdCriadoNumero', '$.externalIdentifier.id'),
    ],
  }),
  gatewayNode('Node_DecBDCriado', 'BD criado?', 0, 0),
  tela('Node_VisitaAgendada', 'Você agendou a visita técnica', 'Abertura de BD do Figma (sucesso).', 'Visita agendada', [
    text('va_titulo', 'Você agendou a visita técnica', 'title'),
    card('va_card', [stack('va_stack', [
      caption('va_data_l', 'Data da visita'), body('va_data', '{{form.dataVisita}}'),
      caption('va_per_l', 'Período'), body('va_per', '{{data.woHorario}}'),
    ])]),
    caption('va_aviso', 'É preciso ter uma pessoa maior de 18 anos presente no dia da visita'),
    actionButton('va_agenda', 'Salvar na agenda', 'acaoFinal', 'salvar_agenda'),
    secondary('va_inicio', 'Ir para o início', 'acaoFinal', 'inicio'),
  ]),
  endNode('Node_End_Agendado', 'Fim — visita agendada e BD criado', 0, 0),
  rest('Node_CancelaWO', 'Cancela WO (WFM)', 'INT16: DELETE /workOrder na WFM Orchestration; base, parâmetros e mapping aguardam P05.', {
    method: 'DELETE', url: 'TBD', headers: { ...JSON_HEADERS, ...correlacao },
  }),
  tela('Node_BDNaoCriado', 'BD não criado', 'Tela criada aqui (US 8): falha na criação do BD.', 'Suporte técnico', [
    alert('bn_alerta', 'warning', 'Não conseguimos registrar a sua solicitação e a visita foi cancelada. Tente de novo mais tarde ou fale com o atendimento Vivo.', { title: 'Não foi possível concluir' }),
    submitButton('bn_btn', 'Ir para o início'),
  ]),
  endNode('Node_End_BDNaoCriado', 'Fim — BD não criado', 0, 0),

  // Falha de integração (sugestão)
  tela('Node_FalhaConsulta', 'Não conseguimos verificar', 'Sugestão: usada quando uma integração falha de vez.', 'Suporte técnico', [
    alert('fc_alerta', 'warning', 'Tivemos um problema para consultar as informações do seu serviço. Fale com o atendimento Vivo.', { title: 'Não conseguimos verificar agora' }),
    submitButton('fc_btn', 'Ir para o início'),
  ]),
  endNode('Node_End_Falha', 'Fim — falha de integração', 0, 0),
];

// --- Ligações -----------------------------------------------------------------------------------
// GET /incidents responde 200 também sem massiva (lista vazia): decide por totalResults, não pelo status.
const M = '{{data_massivaTotal}} > 0';
const F = '{{data_productStatus}} == "bloqueio"';
const B = '{{data_bdHttpStatus}} == 200';
const ID = '{{data_idRetorno}}';
const eq = (v, val) => `${v} == "${val}"`;
const c = (from, to, opts = {}) => ({
  ...connection(`Flow_${from}_${to}${opts.onError ? '_Falha' : ''}`, `Node_${from}`, `Node_${to}`, opts),
  onError: opts.onError ?? false,
  label: opts.label ?? null,
});
const connections = [
  c('Start', 'ConsultaMassiva'),
  c('ConsultaMassiva', 'ConsultaBD'),
  c('ConsultaBD', 'DecImpedimento'),
  c('DecImpedimento', 'DecComMassiva', { condition: M, label: 'Sim' }),
  c('DecImpedimento', 'DecSemMassiva', { isDefault: true, label: 'Não' }),
  c('DecComMassiva', 'StatusMassivaAtraso', { condition: F, label: 'Bloqueio financeiro' }),
  c('DecComMassiva', 'DecMassivaSemFatura', { isDefault: true, label: 'Sem bloqueio financeiro' }),
  c('DecMassivaSemFatura', 'StatusMassivaVisita', { condition: B, label: 'BD aberto' }),
  c('DecMassivaSemFatura', 'StatusMassiva', { isDefault: true, label: 'Sem BD aberto' }),
  c('DecSemMassiva', 'StatusAtraso', { condition: F, label: 'Bloqueio financeiro' }),
  c('DecSemMassiva', 'DecSemMassivaSemFatura', { isDefault: true, label: 'Sem bloqueio financeiro' }),
  c('DecSemMassivaSemFatura', 'StatusVisita', { condition: B, label: 'BD aberto' }),
  c('DecSemMassivaSemFatura', 'Reinicie', { isDefault: true, label: 'Sem impedimentos' }),
  ...['StatusMassivaAtraso', 'StatusMassivaVisita', 'StatusMassiva', 'StatusAtraso', 'StatusVisita'].map((s) => c(s, 'End_Impedimento')),

  c('Reinicie', 'DecReinicio'),
  c('DecReinicio', 'TesteConexao', { condition: eq('{{form_acaoReinicio}}', 'nao_consigo'), label: 'Não consigo reiniciar' }),
  c('DecReinicio', 'VoltouReinicio', { isDefault: true, label: 'Já reiniciei' }),
  c('VoltouReinicio', 'DecVoltouReinicio'),
  c('DecVoltouReinicio', 'InternetVoltou', { condition: eq('{{form_voltouReinicio}}', 'sim'), label: 'Sim' }),
  c('DecVoltouReinicio', 'TesteConexao', { isDefault: true, label: 'Não' }),
  c('InternetVoltou', 'End_Resolvido'),

  c('TesteConexao', 'DecTeste'),
  c('DecTeste', 'End_Desistiu', { condition: eq('{{form_acaoTeste}}', 'inicio'), label: 'Ir para o início' }),
  c('DecTeste', 'SolicitaDiagnostico', { isDefault: true, label: 'Continuar' }),
  c('SolicitaDiagnostico', 'AguardaDiagnostico'), c('SolicitaDiagnostico', 'FalhaConsulta', { onError: true }),
  c('AguardaDiagnostico', 'DecIdDiagnostico'), c('AguardaDiagnostico', 'AgendarVisita', { onError: true, label: 'Sem resposta em 3 min' }),
  c('DecIdDiagnostico', 'ReinicieNovamente', { condition: `${eq(ID, '06')} || ${eq(ID, '07')} || ${eq(ID, '10')}`, label: 'IDs 06, 07 ou 10' }),
  c('DecIdDiagnostico', 'SemEnergia', { condition: eq(ID, '09'), label: 'ID 09' }),
  c('DecIdDiagnostico', 'AgendarVisita', { isDefault: true, label: 'IDs 01, 02, 08 ou outro' }),

  c('ReinicieNovamente', 'VoltouNovamente'),
  c('VoltouNovamente', 'DecVoltouNovamente'),
  c('DecVoltouNovamente', 'InternetVoltou', { condition: eq('{{form_voltouNovamente}}', 'sim'), label: 'Sim' }),
  c('DecVoltouNovamente', 'AgendarVisita', { isDefault: true, label: 'Não' }),

  c('SemEnergia', 'DecEnergia'),
  c('DecEnergia', 'AgendarVisita', { condition: eq('{{form_acaoEnergia}}', 'nao_consigo'), label: 'Não consigo verificar' }),
  c('DecEnergia', 'VoltouEnergia', { isDefault: true, label: 'Já verifiquei' }),
  c('VoltouEnergia', 'DecVoltouEnergia'),
  c('DecVoltouEnergia', 'InternetVoltou', { condition: eq('{{form_voltouEnergia}}', 'sim'), label: 'Sim' }),
  c('DecVoltouEnergia', 'TemEnergia', { isDefault: true, label: 'Não' }),
  c('TemEnergia', 'DecTemEnergia'),
  c('DecTemEnergia', 'AgendarVisita', { condition: eq('{{form_temEnergia}}', 'sim'), label: 'Sim' }),
  c('DecTemEnergia', 'RedeEletrica', { isDefault: true, label: 'Não' }),
  c('RedeEletrica', 'End_RedeEletrica'),

  c('AgendarVisita', 'DecAgendar'),
  c('DecAgendar', 'End_SemAgendar', { condition: eq('{{form_acaoAgendar}}', 'inicio'), label: 'Ir para o início' }),
  c('DecAgendar', 'ConsultaSlots', { isDefault: true, label: 'Agendar visita' }),
  c('ConsultaSlots', 'EscolheHorario'), c('ConsultaSlots', 'FalhaConsulta', { onError: true }),
  c('EscolheHorario', 'CriaWO'),
  c('CriaWO', 'DecAgendado'), c('CriaWO', 'FalhaConsulta', { onError: true }),
  c('DecAgendado', 'CriaBD', { condition: eq('{{data_woStatus}}', 'AGENDADO'), label: 'Sim' }),
  c('DecAgendado', 'HorarioOcupado', { isDefault: true, label: 'Não (horário ocupado)' }),
  c('HorarioOcupado', 'ConsultaSlots'),
  c('CriaBD', 'DecBDCriado'), c('CriaBD', 'CancelaWO', { onError: true }),
  c('DecBDCriado', 'VisitaAgendada', { condition: '{{data_bdCriadoHttpStatus}} == 200 || {{data_bdCriadoHttpStatus}} == 201', label: 'Sim' }),
  c('DecBDCriado', 'CancelaWO', { isDefault: true, label: 'Não' }),
  c('VisitaAgendada', 'End_Agendado'),
  c('CancelaWO', 'BDNaoCriado'),
  c('BDNaoCriado', 'End_BDNaoCriado'),
  c('FalhaConsulta', 'End_Falha'),
];

// --- Seções -------------------------------------------------------------------------------------
const ids = (...names) => names.map((n) => `Node_${n}`);
const sections = [
  { id: 'Sec_Consultas', name: 'Consultas e impedimentos', nodeIds: ids('ConsultaMassiva', 'ConsultaBD', 'DecImpedimento', 'DecComMassiva', 'DecMassivaSemFatura', 'DecSemMassiva', 'DecSemMassivaSemFatura', 'StatusMassivaAtraso', 'StatusMassivaVisita', 'StatusMassiva', 'StatusAtraso', 'StatusVisita', 'End_Impedimento') },
  // "Sua internet voltou" fica fora das seções: é o final de três caminhos (reinício, reinício de novo, sem energia).
  { id: 'Sec_Reinicio', name: 'Reinício do modem', nodeIds: ids('Reinicie', 'DecReinicio', 'VoltouReinicio', 'DecVoltouReinicio') },
  { id: 'Sec_Diagnostico', name: 'Diagnóstico automático', nodeIds: ids('TesteConexao', 'DecTeste', 'End_Desistiu', 'SolicitaDiagnostico', 'AguardaDiagnostico', 'DecIdDiagnostico') },
  { id: 'Sec_ReinicieNovamente', name: 'Reiniciar novamente (ID 06, 07 ou 10)', nodeIds: ids('ReinicieNovamente', 'VoltouNovamente', 'DecVoltouNovamente') },
  { id: 'Sec_SemEnergia', name: 'Sem energia (ID 09)', nodeIds: ids('SemEnergia', 'DecEnergia', 'VoltouEnergia', 'DecVoltouEnergia', 'TemEnergia', 'DecTemEnergia', 'RedeEletrica', 'End_RedeEletrica') },
  { id: 'Sec_AberturaBD', name: 'Abertura de BD', nodeIds: ids('AgendarVisita', 'DecAgendar', 'End_SemAgendar', 'ConsultaSlots', 'EscolheHorario', 'CriaWO', 'DecAgendado', 'HorarioOcupado', 'CriaBD', 'DecBDCriado', 'VisitaAgendada', 'End_Agendado', 'CancelaWO', 'BDNaoCriado', 'End_BDNaoCriado') },
];

// --- Notas no canvas (origem de cada decisão e pendências por etapa) ------------------------------
// Cada etapa com integração tem uma nota "PENDÊNCIAS"; espelhadas em Analise/dossie-integracoes-bd-ve.html.
const notes = [
  [['Start'], 'Entradas da jornada (decisão de 08/11/2026): designador, productStatus, correlationId (formato CID_VE_FTAT933INT…) e requestTimestamp (compõe os TIDs). No motor: data_designador, data_productStatus, data_correlationId, data_requestTimestamp. PENDÊNCIAS: origem dos demais dados exigidos pelos mappings (IDs do TMF653, dados WFM e dados do BD) — esses campos estão vazios nos bodies.'],
  [['ConsultaMassiva', 'ConsultaBD', 'SolicitaDiagnostico', 'ConsultaSlots', 'CriaWO', 'CriaBD', 'CancelaWO'], 'Autenticação (P01/B): o token OAM é enviado no header Authorization da chamada pelo runtime; não há variável de token na jornada. Rastreio (P02): X-Vivo-Transaction-Id = TID_ELJY_FTAT933<INT do mapping>_<requestTimestamp> e X-Vivo-Correlation-Id = correlationId do VE. URLs de PREPROD.'],
  [['ConsultaMassiva'], 'INT01 — decisão P03: GET /incidents?serviceDesignator (contrato publicado; o POST na raiz do DFT retorna 405). A API responde 200 também sem massiva, por isso a decisão usa totalResults > 0. PENDÊNCIAS: (1) qual campo é o protocolo da US-02 — massivaProtocolo segue com jsonPath provisório; (2) massivaPrevisaoConclusao lê incidents[0].expectedResolutionDate e falha quando a lista vem vazia; ajustar antes de executar.'],
  [['ConsultaBD'], 'INT03 — decisão P04/A: GET /troubleTicket?filter=designatorId:…;status:Active;ticketType:Case no MS Trouble Ticket (POST, como no DFT, cria ticket). 404 = nenhum BD ativo. Headers TID INT003 + CID (mapping Consulta BD v2.0). PENDÊNCIAS: a resposta é uma lista e não traz previsão; bdProtocoloAtendimento e bdPrevisaoConclusao seguem com jsonPath provisório até definir o protocolo (Q08) e a origem da data da visita.'],
  [['StatusMassivaAtraso', 'StatusMassivaVisita', 'StatusMassiva', 'StatusVisita'], 'Telas mantidas como no Figma (decisão C). PENDÊNCIAS: previsão e protocolo exibidos dependem dos campos pendentes das consultas Massiva (P03) e BD (Q08); até a definição, podem aparecer vazios.'],
  [['DecImpedimento'], 'A matriz implementa os casos explicitados nas US-01/02/03 com decisões binárias sequenciais. Combinações não especificadas, inclusive BD + bloqueio financeiro sem Massiva e as três condições simultâneas, seguem a ordem técnica desta POC e precisam de decisão de Produto antes da integração real.'],
  [['SolicitaDiagnostico'], 'INT06 — TMF653 POST /serviceTest (OpenAPI GTW Redes; host api-hml a confirmar como PREPROD). PENDÊNCIAS: X-Vivo-Transaction-Id e X-Vivo-Correlation-Id (UUID v4) e relatedService.id, testSpecification.id e ExternalId estão vazios — origem não definida (P06).'],
  [['AguardaDiagnostico', 'DecIdDiagnostico'], `INT10 — tópico ${DFT_RESULT_TOPIC} no cluster local de laboratório (mesma configuração da v3 de "Abertura de BD pelo VE"), não é o broker de PREPROD. PENDÊNCIAS: cluster/credencial de PREPROD, schema do callback e correlação (Q07); o outputMapping idRetorno é provisório. IDs funcionais: 06/07/10 → reiniciar de novo; 09 → sem energia; outros → abertura de BD (US-12/13).`],
  [['ConsultaSlots'], 'INT11 — headers (flow B2B_MASSIVO, requestSystem MVE, TID INT005, CID) e estrutura do body VIVO1 do PreDataMapping WFM v2.2. PENDÊNCIAS: URL interna da WFM Orchestration (P05); attendant, janela de datas e dados de rede/endereço estão vazios até definir a origem; variante VIVO2; response mapping de horários provisório.'],
  [['CriaWO', 'CancelaWO'], 'INT14/INT16 — WFM Orchestration POST /createWorkOrder e DELETE /workOrder. PENDÊNCIAS: base URL, mapping de request/response e prefixo TID (sem mapping, só o CID é enviado) — P05. outputMapping de WO provisório.'],
  [['CriaBD'], 'INT18 — decisão P04: POST /troubleTicket no MS Trouble Ticket com a estrutura do PreDataMapping Abertura BD v2.1 e headers TID INT009 + CID. Resposta: id e externalIdentifier.id (número do BD no ServiceNow). Preenchidos: designadorAcesso (designador), WorkOrder (woNumero) e previsaoAtendimento (data + período escolhidos, inferido). PENDÊNCIAS: demais campos do ticket, cliente, contato e características estão vazios até definir a origem; WorkOrderItem, idAppointment e payloadDiagnostico dependem dos mappings do INT14 (P05) e do callback (Q07); protocolo exibido (Q08).'],
  [['AgendarVisita', 'HorarioOcupado', 'CriaBD', 'CancelaWO', 'BDNaoCriado'], 'Abertura de BD — origem: US 5 (consulta de horários no WFM), US 6 (criação da WO), US 7 (horário ocupado → volta para a consulta de horários), US 8 (BD não criado → informar falha e cancelar a WO sem aguardar resposta), US 9 (BD criado). "Horário ocupado" e "BD não criado" são telas criadas aqui, não existem no Figma. Falha técnica na criação do BD também cancela a WO (não definido nas USs).'],
  [['EscolheHorario'], 'Layout do Figma mantido: data, lista de períodos e aceite de aviso. A lista vem da consulta ao WFM uma vez só; trocar a data não refaz a lista. O aceite "horário mais cedo" não existe nas USs nem no contrato do WFM; fica em form.avisarHorarioMaisCedo.'],
  [['StatusMassivaAtraso', 'StatusMassivaVisita', 'StatusMassiva', 'StatusAtraso', 'StatusVisita', 'InternetVoltou', 'RedeEletrica', 'VisitaAgendada'], 'Botões "Ir pra Central de faturas", "Ir pra Central de visitas", "Salvar na agenda" e "Ir para o início" levam a áreas do app fora deste fluxo. Por isso concluem a etapa e a jornada termina; quem leva o cliente ao destino é o VE.'],
  [['InternetVoltou', 'VisitaAgendada'], 'O Figma mostra "Protocolo" em "Sua internet voltou" e as USs pedem que o VE informe o ID do BD e da WO ao cliente, mas a tela de sucesso do Figma só mostra data e período. Ficou como no Figma; o número do BD está em data.bdCriadoNumero e o da WO em data.woNumero.'],
];

// --- Layout (ELK) -----------------------------------------------------------------------------
const SIZE = { START: 52, END: 52, GATEWAY: 50, USER_TASK: 78, SERVICE_TASK: 78, RECEIVE_TASK: 78 };

async function layout() {
  const sectionOf = new Map(sections.flatMap((s) => s.nodeIds.map((id) => [id, s.id])));
  const leaf = (n) => ({ id: n.nodeId, width: SIZE[n.nodeType], height: SIZE[n.nodeType] });
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '70', 'elk.spacing.nodeNode': '50', 'elk.padding': '[top=60,left=40,bottom=40,right=40]',
    },
    children: [
      ...nodes.filter((n) => !sectionOf.has(n.nodeId)).map(leaf),
      ...sections.map((s) => ({ id: s.id, layoutOptions: { 'elk.padding': '[top=50,left=30,bottom=30,right=30]' }, children: nodes.filter((n) => sectionOf.get(n.nodeId) === s.id).map(leaf) })),
    ],
    edges: connections.map((e) => ({ id: e.connectionId, sources: [e.sourceNodeId], targets: [e.targetNodeId] })),
  };
  const res = await new ELK().layout(graph);
  const abs = new Map();
  const walk = (g, ox, oy) => (g.children ?? []).forEach((ch) => { abs.set(ch.id, [ox + ch.x, oy + ch.y]); walk(ch, ox + ch.x, oy + ch.y); });
  walk(res, 0, 400);
  for (const n of nodes) [n.positionX, n.positionY] = abs.get(n.nodeId).map(Math.round);
  // Notas numa faixa acima do fluxo, na altura de cada primeira etapa ligada.
  return notes.map(([linked, value], i) => {
    const first = abs.get(`Node_${linked[0]}`);
    return { id: `Annotation_${i + 1}`, text: value, positionX: Math.round(first[0]), positionY: 40 + (i % 2) * 170, linkedNodeIds: linked.map((l) => `Node_${l}`) };
  });
}

async function main() {
  const annotations = await layout();
  const token = await login();
  const product = await api('GET', `/products/${VE_PRODUCT_ID}`, token);
  const journey = await ensureJourney(token, {
    productId: product.productId, channelTypes: ['MOBILE'], name: JOURNEY_NAME,
    description: 'Jornada FTAT-933 de autoatendimento FTTH B2B (Abertura de BD pelo VE) com integrações PREPROD. BPMN: fenix-ve-abertura-bd.bpmn. WFM e dados de entrada adicionais pendentes.',
  });
  console.log('journeyId:', journey.journeyId);
  await api('PUT', `/journeys/${journey.journeyId}/flow`, token, {
    name: 'Fluxo Fenix - Abertura de BD', nodes, connections, annotations, sections,
  });
  const version = await api('POST', `/journeys/${journey.journeyId}/versions`, token, {
    description: 'V1 — integrações PREPROD; entradas designador, productStatus, correlationId e requestTimestamp',
  });
  try {
    const published = await api('POST', `/journeys/${journey.journeyId}/versions/${version.versionId}/publish`, token);
    console.log('Publicado:', published.status, 'v' + published.versionNumber, '| etapas:', nodes.length, '| ligações:', connections.length);
  } catch (error) {
    console.error(`Versão v${version.versionNumber} salva como DRAFT; publicação recusada: ${error.message}`);
  }
}

main().catch((err) => { console.error('FALHOU:', err.message); process.exit(1); });
