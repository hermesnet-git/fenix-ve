// Salva apenas o rascunho estrutural da Jornada 5.2 no Journey Admin.
// Nao cria versao nem publica. Integracoes sem contrato ficam como tarefas sem connectorConfig,
// com anotacoes no canvas para orientar o preenchimento posterior.

import { createRequire } from 'node:module';
import {
  api, login, startNode, endNode, userTaskNode, gatewayNode, connection,
  text, submitButton,
} from '../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/scripts/sdui_helpers.mjs';

const require = createRequire(import.meta.url);
const ELK = require('../../journey/workspace/journey-admin/front/node_modules/elkjs/lib/elk.bundled.js');

const PRODUCT_ID = '66896bd3-f42d-4549-af38-df2c1c0e34df';
const JOURNEY_NAME = 'Abertura de BD pelo VE - Rascunho 5.2';
const CHANNEL_TYPES = ['MOBILE'];

const serviceTask = (nodeId, name, description) => ({
  nodeId, nodeType: 'SERVICE_TASK', name, description, positionX: 0, positionY: 0,
  userTaskConfig: null, connectorConfig: null, startVariables: null,
});

const receiveTask = (nodeId, name, description) => ({
  nodeId, nodeType: 'RECEIVE_TASK', name, description, positionX: 0, positionY: 0,
  userTaskConfig: null, connectorConfig: null, startVariables: null,
});

const screen = (nodeId, name, description, title, copy, button) => userTaskNode(
  nodeId, name, description, 0, 0, nodeId.replace('Node_', '').toLowerCase(), title,
  [text(`${nodeId}_title`, title), text(`${nodeId}_copy`, copy, 'body'), submitButton(`${nodeId}_continue`, button)],
);

const nodes = [
  startNode('Node_Start', 'Início', 0, 0, 'O VE seleciona o asset antes da jornada e fornece os valores em runtime.', [
    { name: 'designador', type: 'string' },
    { name: 'productStatus', type: 'string' },
  ]),
  serviceTask('Node_ConsultaMassiva', 'Consulta Massiva / Manutenção', 'Pendente: Customer Problem Management v1 / SIGITM.'),
  serviceTask('Node_ConsultaBD', 'Consulta BD preventivo / pró-ativo', 'Pendente: Trouble Ticket Management v1.'),
  gatewayNode('Node_DecImpedimentos', 'Resultado das consultas de impedimento?', 0, 0),
  screen('Node_StatusMassivaFatura', 'Massiva + fatura em aberto', 'Cenário previsto pela US-03.', 'Identificamos o que pode estar afetando seu serviço', 'Massiva/Manutenção ativa e status FTTH de bloqueio. Exibir os dados disponíveis e direcionar à Central de faturas.', 'Ir para a Central de faturas'),
  screen('Node_StatusMassivaBD', 'Massiva + BD aberto', 'Cenário previsto pela US-03, sem bloqueio financeiro.', 'Identificamos o que pode estar afetando seu serviço', 'Massiva/Manutenção e BD ativos. Exibir os dados disponíveis e direcionar à Central de visitas.', 'Ir para a Central de visitas'),
  screen('Node_StatusMassiva', 'Massiva / Manutenção ativa', 'Estado isolado descrito na US-02 e no Figma.', 'Identificamos uma instabilidade na sua região', 'Exibir previsão e protocolo retornados pelo SIGITM.', 'Ir para o início'),
  screen('Node_StatusFatura', 'Fatura em aberto', 'Estado descrito na US-03 e no Figma.', 'Identificamos um bloqueio no seu serviço', 'O produto FTTH veio com status de bloqueio. Direcionar à Central de faturas.', 'Ir para a Central de faturas'),
  endNode('Node_EndBDIsolado', 'Fim - BD isolado sem layout definido', 0, 0, 'US-01 descreve BD isolado, mas o Figma nao tem tela dedicada; UX pendente.'),
  endNode('Node_EndCombinacaoPendente', 'Fim - combinação não especificada', 0, 0, 'Sem resultado ou tela inventados para combinacoes fora das USs/Figma.'),
  endNode('Node_EndImpedimento', 'Fim - impedimento informado'),
  screen('Node_Troubleshooting', 'Reinício e preparação do diagnóstico', 'Continuação do fluxo funcional conforme US-04/05/06 e Figma.', 'Vamos tentar resolver o problema da sua internet', 'Orientar o reinício do modem e confirmar se a conexão voltou antes de solicitar o diagnóstico.', 'Continuar'),
  serviceTask('Node_SolicitaHPSD', 'Solicita diagnóstico automático', 'Pendente: contrato TMF653, URL, autenticação, request e output mapping.'),
  receiveTask('Node_AguardaHPSD', 'Aguarda retorno do HPSD', 'Pendente: tópico Kafka, cluster, credencial, schema do evento e correlação.'),
  gatewayNode('Node_DecHPSD', 'Resultado do diagnóstico', 0, 0),
  serviceTask('Node_ConsultaSlotsWFM', 'Consulta horários no WFM', 'Pendente: contrato e mapping do ms-ooap-tlf-wfm-journey-v1.'),
  screen('Node_EscolheHorario', 'Escolha do horário', 'Tela baseada no Figma; fonte de slots e campos de retorno dependem do contrato WFM.', 'Selecione a melhor data para sua visita técnica', 'A lista de datas e horários será vinculada ao retorno do WFM quando o contrato estiver disponível.', 'Confirmar agendamento'),
  serviceTask('Node_CriaWOWFM', 'Cria Work Order', 'Pendente: request/response do WFM, identificador da WO e regra de reserva.'),
  serviceTask('Node_CriaBD', 'Cria Bilhete de Defeito', 'Pendente: completar mapping de criação do Trouble Ticket com os dados do WFM/HPSD.'),
  screen('Node_Sucesso', 'Visita agendada', 'Conteúdo final sujeito ao contrato e à definição do protocolo.', 'Você agendou a visita técnica', 'Exibir data e período confirmados pelo WFM.', 'Ir para o início'),
  endNode('Node_EndSucesso', 'Fim - visita agendada'),
  endNode('Node_EndSemDiagnostico', 'Fim - resultado HPSD sem ramo detalhado', 0, 0, 'Resultado/UX deve seguir US-12/13 e mapping aprovado.'),
];

const links = [
  ['Start', 'ConsultaMassiva'],
  ['ConsultaMassiva', 'ConsultaBD'],
  ['ConsultaBD', 'DecImpedimentos'],
  ['DecImpedimentos', 'StatusMassivaFatura', '{{data_massivaEncontrada}} == true && {{data_productStatus}} == "bloqueio" && {{data_bdEncontrado}} == false'],
  ['DecImpedimentos', 'StatusMassivaBD', '{{data_massivaEncontrada}} == true && {{data_bdEncontrado}} == true && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'StatusMassiva', '{{data_massivaEncontrada}} == true && {{data_bdEncontrado}} == false && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'StatusFatura', '{{data_massivaEncontrada}} == false && {{data_bdEncontrado}} == false && {{data_productStatus}} == "bloqueio"'],
  ['DecImpedimentos', 'EndBDIsolado', '{{data_massivaEncontrada}} == false && {{data_bdEncontrado}} == true && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'Troubleshooting', '{{data_massivaEncontrada}} == false && {{data_bdEncontrado}} == false && {{data_productStatus}} != "bloqueio"'],
  ['DecImpedimentos', 'EndCombinacaoPendente', null, true],
  ['StatusMassivaFatura', 'EndImpedimento'],
  ['StatusMassivaBD', 'EndImpedimento'],
  ['StatusMassiva', 'EndImpedimento'],
  ['StatusFatura', 'EndImpedimento'],
  ['Troubleshooting', 'SolicitaHPSD'],
  ['SolicitaHPSD', 'AguardaHPSD'],
  ['AguardaHPSD', 'DecHPSD'],
  ['DecHPSD', 'ConsultaSlotsWFM', '{{data_idRetornoDiagnostico}} != "09"'],
  ['DecHPSD', 'EndSemDiagnostico', null, true],
  ['ConsultaSlotsWFM', 'EscolheHorario'],
  ['EscolheHorario', 'CriaWOWFM'],
  ['CriaWOWFM', 'CriaBD'],
  ['CriaBD', 'Sucesso'],
  ['Sucesso', 'EndSucesso'],
];

const connections = links.map(([from, to, condition, isDefault = false]) => ({
  ...connection(`Flow_${from}_${to}`, `Node_${from}`, `Node_${to}`, { condition, isDefault }),
  label: null,
  onError: false,
}));

const annotations = [
  { id: 'Annotation_Start', text: 'START declarado para autoria: designador:string e productStatus:string. Valores reais chegam do BFF em runtime.', linkedNodeIds: ['Node_Start'] },
  { id: 'Annotation_SigItm', text: 'PENDENTE: URL/path, método, ambiente, auth, filtros e response mapping do Customer Problem Management v1 / SIGITM. A US-02 espera dia, hora e protocolo. Não há endpoint inventado neste rascunho.', linkedNodeIds: ['Node_ConsultaMassiva'] },
  { id: 'Annotation_BD', text: 'PENDENTE: confirmar mapping do GET no Trouble Ticket Management v1, filtros/status de BD ativo e campos de protocolo/data. Sem endpoint mockado neste rascunho.', linkedNodeIds: ['Node_ConsultaBD'] },
  { id: 'Annotation_Matriz', text: 'Saídas massivaEncontrada e bdEncontrado são nomes provisórios para estruturar as decisões, não contrato de response aprovado. Combinações não especificadas terminam sem tela de negócio.', linkedNodeIds: ['Node_DecImpedimentos'] },
  { id: 'Annotation_HPSD', text: 'PENDENTE: TMF653 request/response, testSpecification/relatedService IDs, URL e auth.', linkedNodeIds: ['Node_SolicitaHPSD'] },
  { id: 'Annotation_Kafka', text: 'PENDENTE: tópico existente, cluster/credencial, schema do callback, correlação e timeout. Não configurar tópico fictício.', linkedNodeIds: ['Node_AguardaHPSD'] },
  { id: 'Annotation_WFM', text: 'PENDENTE: contrato e mappings para consulta de slots, reserva/criação de WO, retorno de IDs e cancelamento.', linkedNodeIds: ['Node_ConsultaSlotsWFM', 'Node_CriaWOWFM'] },
  { id: 'Annotation_TT', text: 'PENDENTE: mapping de criação do BD e dados requeridos do resultado HPSD/WO.', linkedNodeIds: ['Node_CriaBD'] },
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
  return result;
}

async function main() {
  await applyLayout();
  const token = await login();
  const existing = (await api('GET', `/journeys?productId=${PRODUCT_ID}`, token)).find((item) => item.name === JOURNEY_NAME);
  let journey = existing;
  if (journey && ['INACTIVE', 'PUBLISHED'].includes(journey.status)) {
    throw new Error(`Rascunho existente nao pode ser alterado com status ${journey.status}: ${journey.journeyId}`);
  }
  if (!journey) {
    journey = await api('POST', '/journeys', token, {
      productId: PRODUCT_ID,
      channelTypes: CHANNEL_TYPES,
      name: JOURNEY_NAME,
      description: 'Rascunho estrutural FTAT-933 com tarefas e pendencias de integracao anotadas no canvas. Nao publicar ate completar contratos.',
      templateId: null,
    });
  }
  await api('PUT', `/journeys/${journey.journeyId}/flow`, token, {
    name: 'Fluxo Abertura de BD pelo VE - Rascunho',
    nodes,
    connections,
    annotations,
    sections: [],
  });
  const saved = await api('GET', `/journeys/${journey.journeyId}`, token);
  console.log(JSON.stringify({ journeyId: saved.journeyId, name: saved.name, status: saved.status, nodes: nodes.length, connections: connections.length, annotations: annotations.length, published: false }, null, 2));
}

main().catch((error) => { console.error('FALHOU:', error.message); process.exit(1); });
