// Jornada "Abertura de BD pelo VE" (Fênix, FTAT-933) do produto "Vivo empresas - VE", canal App.
// Telas: Figma [B2B] Suporte Técnico, página "Abertura de BD - App" (extração em admin/fenix/figma/).
// Regras: as 9 USs em admin/fenix/ + decisões combinadas com o usuário em 03/11/2026 (anotadas no canvas).
//
// Pontos de integração seguem o DFT FTAT-933 v1.2. Endpoints DFT marcados TBD permanecem
// explicitamente não configurados até o time responsável fornecer a URL/base real; nunca apontar
// esses nós para o ms-mock-api-rest nem para downstream de outro microserviço.
//
// Rode com: node jornada_abertura_bd_ve.mjs

import { createRequire } from 'node:module';
import {
  api, login, ensureJourney,
  startNode, endNode, userTaskNode, gatewayNode, serviceTaskNode, receiveTaskNode, connection,
  text, checkbox, datePicker, submitButton, alert, card, stack,
} from '../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/scripts/sdui_helpers.mjs';

const require = createRequire(import.meta.url);
const ELK = require('../../journey/workspace/journey-admin/front/node_modules/elkjs/lib/elk.bundled.js');

const DFT_RESULT_TOPIC = 'telco.service.servicetestmanagement.servicetestresult';
const VE_PRODUCT_ID = '66896bd3-f42d-4549-af38-df2c1c0e34df';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

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
  startNode('Node_Start', 'Início', 0, 0, 'O VE inicia a jornada com o designador e o status de produto selecionado.', [
    { name: 'designador', type: 'string' }, { name: 'productStatus', type: 'string' },
    { name: 'relatedServiceId', type: 'string' }, { name: 'testSpecificationId', type: 'string' },
    { name: 'serviceTestExternalId', type: 'string' }, { name: 'transactionId', type: 'string' },
    { name: 'correlationId', type: 'string' },
  ]),

  // Consultas e impedimentos
  rest('Node_ConsultaMassiva', 'Consulta Massiva/Manutenção', 'Primeira consulta sequencial via Customer Problem Management v1 (DFT INT01); chamada downstream ao SIGITM/TMF724 pertence ao MS.', {
    method: 'POST', url: 'https://cssp.redecorp.br/customer-problem-management/v1',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { idDesignador: '{{data_designador}}' },
    outputMapping: [out('massivaHttpStatus', '$httpStatus', 'number'), out('massivaProtocolo', '$.protocoloManutencao'), out('massivaPrevisaoConclusao', '$.previsaoConclusao')],
  }),
  rest('Node_ConsultaBD', 'Consulta BD aberto', 'DFT INT03: consulta via Trouble Ticket Management; endpoint interno TBD. Não chamar ServiceNow diretamente.', {
    method: 'POST', url: 'TBD', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { idDesignador: '{{data_designador}}' },
    outputMapping: [
      out('bdHttpStatus', '$httpStatus', 'number'), out('bdNumero', '$.numeroBilhete'),
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
  rest('Node_SolicitaDiagnostico', 'Solicita diagnóstico (HPSD)', 'DFT INT06: TMF653 POST /serviceTest. IDs de serviço/especificação e auth dependem de configuração do BFF/ambiente.', {
    method: 'POST', url: 'https://api.telefonica.com.br/gtw-redes/serviceTestManagement/v1/serviceTest',
    headers: {
      ...JSON_HEADERS,
      'X-Vivo-Transaction-Id': '{{data_transactionId}}',
      'X-Vivo-Correlation-Id': '{{data_correlationId}}',
    },
    body: {
      name: 'Diagnóstico automático FTTH',
      relatedService: { id: '{{data_relatedServiceId}}' },
      testSpecification: { id: '{{data_testSpecificationId}}' },
      relatedParty: [{ id: '{{data_serviceTestExternalId}}', role: 'ExternalId' }],
    },
    outputMapping: [out('diagnosticoServiceTestId', '$.id')],
  }),
  receiveTaskNode('Node_AguardaDiagnostico', 'Aguarda resultado do diagnóstico', `DFT INT10: aguarda evento no tópico ${DFT_RESULT_TOPIC}; broker, credencial e schema do callback ainda não configurados.`, 0, 0, 'KAFKA', {
    operation: 'CONSUME', topic: DFT_RESULT_TOPIC, waitTimeoutMs: 180000,
    outputMapping: [out('idRetorno', '$.payload.data.idRetorno')],
  }),
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
  rest('Node_ConsultaSlots', 'Consulta horários (WFM)', 'DFT INT11: POST à WFM Orchestration; endpoint interno TBD. Não chamar TMF646 diretamente.', {
    method: 'POST', url: 'TBD', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
  rest('Node_CriaWO', 'Cria WO (WFM)', 'DFT INT14: POST /createWorkOrder na WFM Orchestration; base/endpoint interno TBD.', {
    method: 'POST', url: 'TBD', headers: JSON_HEADERS,
    outputMapping: [out('woNumero', '$.protocolo'), out('woStatus', '$.status'), out('woHorario', '$.horario')],
  }),
  gatewayNode('Node_DecAgendado', 'Agendado com sucesso?', 0, 0),
  tela('Node_HorarioOcupado', 'Horário ocupado', 'Tela criada aqui (US 7): o horário foi usado por outro atendimento.', 'Agendar visita técnica', [
    alert('ho_alerta', 'warning', 'O horário escolhido acabou de ser ocupado por outro atendimento. Escolha outro horário.', { title: 'Não conseguimos agendar' }),
    submitButton('ho_btn', 'Escolher outro horário'),
  ]),
  rest('Node_CriaBD', 'Cria BD', 'DFT INT18: POST ao Trouble Ticket Management; endpoint interno TBD. O MS orquestra TMF629/TMF621 downstream.', {
    method: 'POST', url: 'TBD', headers: JSON_HEADERS,
    outputMapping: [out('bdCriadoHttpStatus', '$httpStatus', 'number'), out('bdCriadoNumero', '$.numeroChamado')],
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
  rest('Node_CancelaWO', 'Cancela WO (WFM)', 'DFT INT16: DELETE /workOrder na WFM Orchestration; base/endpoint interno TBD.', {
    method: 'DELETE', url: 'TBD', headers: JSON_HEADERS,
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
const M = '{{data_massivaHttpStatus}} == 200';
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

// --- Notas no canvas (origem de cada decisão) -------------------------------------------------
const notes = [
  [['Start'], 'Entrada de negócio conforme US-01/02/03: designador e productStatus do asset selecionado. TMF653 requer também IDs de relatedService/testSpecification e valores de correlação/transação; a origem desses dados no BFF ainda precisa ser confirmada.'],
  [['ConsultaMassiva', 'ConsultaBD', 'SolicitaDiagnostico', 'AguardaDiagnostico', 'ConsultaSlots', 'CriaWO', 'CriaBD', 'CancelaWO'], 'Conectores simulados removidos. Os pontos seguem DFT v1.2: INT01 e INT06 têm endpoints de referência; INT03/11/14/16/18 permanecem sem URL interna (TBD). INT10 define o tópico, mas broker e credencial do ambiente não estão configurados.'],
  [['ConsultaMassiva'], 'DFT v1.2 INT01: POST Customer Problem Management v1 em https://cssp.redecorp.br/customer-problem-management/v1, síncrono, rota Internal API. idDesignador é citado no DFT; falta o identificador do cliente e o schema exato do body. INT02/TMF724 é chamada downstream do MS ao SIGITM, nunca chamar esse endpoint diretamente daqui. Os jsonPaths de protocolo/previsão ainda dependem do response mapping aprovado.'],
  [['ConsultaBD', 'ConsultaSlots', 'CriaWO', 'CriaBD', 'CancelaWO'], 'Pontos do DFT: INT03 POST Trouble Ticket Management, INT11 POST WFM Orchestration, INT14 POST /createWorkOrder, INT16 DELETE /workOrder e INT18 POST Trouble Ticket Management. Os endpoints internos estão TBD; os nós usam explicitamente URL TBD e não apontam para APIs downstream ou simuladores. Schemas de entrada/saída ainda não aprovados.'],
  [['DecImpedimento'], 'A matriz implementa os casos explicitados nas US-01/02/03 com decisões binárias sequenciais. Combinações não especificadas, inclusive BD + bloqueio financeiro sem Massiva e as três condições simultâneas, seguem a ordem técnica desta POC e precisam de decisão de Produto antes da integração real. "Visita técnica agendada" representa BD aberto; a consulta não fornece horário da visita.'],
  [['FalhaConsulta'], 'Tela de falha ligada somente a integrações com caminho de erro definido no fluxo. Consultas iniciais Massiva/BD seguem a decisão de não criar tela de exceção detalhada.'],
  [['AguardaDiagnostico', 'DecIdDiagnostico'], `DFT INT10 define o tópico ${DFT_RESULT_TOPIC}; broker/credencial e schema do callback para a jornada ainda não foram fornecidos. O outputMapping idRetorno é provisório e precisa ser substituído pelo contrato aprovado antes de ligar o consumer. IDs funcionais: 06/07/10 → reiniciar de novo; 09 → sem energia; outros → abertura de BD, conforme US-12/13.`],
  [['AgendarVisita', 'HorarioOcupado', 'CriaBD', 'CancelaWO', 'BDNaoCriado'], 'Abertura de BD — origem: US 5 (consulta de horários no WFM), US 6 (criação da WO), US 7 (horário ocupado → volta para a consulta de horários), US 8 (BD não criado → informar falha e cancelar a WO sem aguardar resposta), US 9 (BD criado). "Horário ocupado" e "BD não criado" são telas criadas aqui, não existem no Figma. Falha técnica na criação do BD também cancela a WO (não definido nas USs).'],
  [['EscolheHorario'], 'Layout do Figma mantido: data, lista de períodos e aceite de aviso. A lista vem da consulta ao WFM uma vez só; trocar a data não refaz a lista (o catálogo não filtra uma lista por outro campo da mesma tela). O endereço que o Figma mostra no topo não está nos dados da jornada. O aceite "horário mais cedo" não existe nas USs nem no contrato do WFM; fica em form.avisarHorarioMaisCedo.'],
  [['StatusMassivaAtraso', 'StatusMassivaVisita', 'StatusMassiva', 'StatusAtraso', 'StatusVisita', 'InternetVoltou', 'RedeEletrica', 'VisitaAgendada'], 'Botões "Ir pra Central de faturas", "Ir pra Central de visitas", "Salvar na agenda" e "Ir para o início" levam a áreas do app fora deste fluxo. Por isso concluem a etapa e a jornada termina; quem leva o cliente ao destino é o VE.'],
  [['InternetVoltou', 'VisitaAgendada'], 'O Figma mostra "Protocolo" em "Sua internet voltou" e as USs pedem que o VE informe o ID do BD e da WO ao cliente, mas a tela de sucesso do Figma só mostra data e período. Ficou como no Figma; o número do BD está em data.bdCriadoNumero e o da WO em data.woNumero.'],
];

// --- Layout (ELK) -----------------------------------------------------------------------------
const SIZE = { START: 52, END: 52, GATEWAY: 50, USER_TASK: 78, SERVICE_TASK: 78, RECEIVE_TASK: 78 };
const NOTE_WIDTH = 190;

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
    productId: product.productId, channelTypes: ['MOBILE'], name: 'Abertura de BD pelo VE',
    description: 'Jornada FTAT-933 de autoatendimento FTTH B2B com pontos de integração do DFT v1.2. Integrações marcadas TBD e configuração de broker/credenciais permanecem pendentes.',
  });
  console.log('journeyId:', journey.journeyId);
  await api('PUT', `/journeys/${journey.journeyId}/flow`, token, {
    name: 'Fluxo Abertura de BD pelo VE', nodes, connections, annotations, sections,
  });
  const previousVersions = await api('GET', `/journeys/${journey.journeyId}/versions`, token);
  const version = await api('POST', `/journeys/${journey.journeyId}/versions`, token, {
    description: 'Fluxo FTAT-933 alinhado ao DFT v1.2; pontos TBD sem destino simulado',
  });
  let published;
  try {
    published = await api('POST', `/journeys/${journey.journeyId}/versions/${version.versionId}/publish`, token);
  } catch (error) {
    for (const previous of previousVersions.filter((item) => item.status === 'PUBLISHED')) {
      await api('POST', `/journeys/${journey.journeyId}/versions/${previous.versionId}/unpublish`, token);
    }
    console.error(`Versão v${version.versionNumber} salva como DRAFT; publicação bloqueada pela configuração DFT pendente: ${error.message}`);
    console.error('As versões anteriores foram despublicadas para não manter conectores simulados ativos.');
    return;
  }
  for (const previous of previousVersions.filter((item) => item.status === 'PUBLISHED' && item.versionNumber < published.versionNumber)) {
    await api('POST', `/journeys/${journey.journeyId}/versions/${previous.versionId}/unpublish`, token);
  }
  console.log('Publicado:', published.status, 'v' + published.versionNumber, '| etapas:', nodes.length, '| ligações:', connections.length);
}

main().catch((err) => { console.error('FALHOU:', err.message); process.exit(1); });
