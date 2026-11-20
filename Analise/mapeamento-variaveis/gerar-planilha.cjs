const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const tools = createRequire('/tmp/fenix-mapeamento-tools/package.json');
const ExcelJS = tools('exceljs');
const { XMLParser } = tools('fast-xml-parser');
const YAML = tools('yaml');
const root = path.resolve(__dirname, '../..');
const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'fontes-extraidas.json')));
const bpmnFile = 'fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn';
const xml = fs.readFileSync(path.join(root, bpmnFile), 'utf8');
const clean = value => String(value ?? '').replace(/\r/g, '').trim();
const norm = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const books = evidence.workbooks;
const bookFor = part => books.find(book => norm(book.file).includes(norm(part)));
const codes = { BD: 'Abertura de BD', WO: 'Abertura de WO', SLOT: 'Consulta de Slot',
  MASSIVA: 'Consulta de Massivas', CONSULTA_BD: 'Consulta de BD', HPSD: 'Diagnostico Automatico', CANCELA: 'Cancelamento' };
const sourceFile = code => bookFor(codes[code]).file;
const source = (code, sheet, cell) => ({ file: sourceFile(code), sheet, cell });
const bdSource = row => source('BD', 'Camunda x MS Trouble Ticket Req', `D${row};H${row};K${row}`);
const woSource = row => source('WO', 'Camunda x WFM Journey REQUEST', `D${row};H${row};K${row}${row === 12 ? ';L12' : ''}`);
const slotSource = row => source('SLOT', 'Camunda x WFM Journey REQ Vivo1', `D${row};H${row};K${row}`);
const story = (number, paragraph) => ({ file: evidence.documents.find(doc => path.basename(doc.file).startsWith(`${number} `)).file,
  sheet: 'Documento Word', cell: `paragrafo ${paragraph}` });
const dft = slide => ({ file: 'DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx', sheet: 'DFT', cell: `slide ${slide}` });
const pdf = page => ({ file: 'VE_AGENDAMENTO_.pdf', sheet: 'Referencia correlata: venda/instalacao', cell: `pagina ${page}` });
const workflow = { file: 'Workflow FTAT-933.png', sheet: 'Workflow', cell: 'diagrama completo; notas junto as atividades' };
const referenceText = refs => refs.map(ref => `${ref.file} | ${ref.sheet} | ${ref.cell}`).join('\n');
const cellReference = (file, sheet, address) => `../../${file}#'${sheet.replaceAll("'", "''")}'!${address.split(';')[0]}`;
const link = (file, label = file, sheet, address) => ({ text: label,
  hyperlink: /^https?:/.test(file) ? file : sheet && address && file.endsWith('.xlsx')
    ? cellReference(file, sheet, address) : `../../${file}` });
const catalog = [];
function add(name, origin, status, start, rule, refs, aliases = [], destination = '', required = 'Ver detalhe no mapping', moment = '') {
  catalog.push({ id: `VAR-${String(catalog.length + 1).padStart(3, '0')}`, name, origin, status, start, rule,
    refs, aliases, destination, required, moment: moment || (start.startsWith('Sim') ? 'Inicio' : 'Durante o fluxo'),
    fixed: /Fixo/.test(origin) ? 'Sim, apenas no contexto indicado' : /Calcul|Gerad/.test(origin) ? 'Nao: gerado/derivado' : 'Nao comprovado' });
}
const massivaStart = row => source('MASSIVA', 'VE x Camunda - Request', `D${row};E${row};H${row};K${row}`);
add('assetSelecionado', 'VE / integracao anterior', 'PARCIAL', 'Sim: contexto; envelope pendente',
  'US01/02/03 mandam VE enviar payload de assets. Selecionar empresa, servico e instalacao; contrato do envelope e caminhos canonicos ainda nao fechados. Nao copiar toda resposta sem minimizar dados.',
  [story(1, 17), story(2, 17), dft(4)], [], 'Contexto de cliente/produto/endereco/rede', 'Contexto funcional exigido; campos dependem das integracoes');
add('designadorServico', 'VE / asset selecionado', 'PARCIAL', 'Sim: contexto do servico',
  'Usar designador de servico (final 013) na massiva. Nao converter acesso 069 em servico 013 por troca de sufixo. Caminho exato do asset pendente.',
  [source('MASSIVA', 'Camunda x MS Request', 'D8;E8;H8;K8'), dft(2), workflow], ['designador'], 'INT01 serviceDesignator', 'Sim no request da massiva');
add('designadorAcesso', 'VE / asset selecionado', 'PARCIAL', 'Sim: contexto do acesso',
  'Usar designador de acesso (final 069) para BD e identificar separadamente o servico testado. Uma variavel designador para ambos mistura identidades distintas.',
  [dft(3), workflow, source('CONSULTA_BD', 'Camunda x MS Trouble Ticket Req', 'D8;K8')], ['designador', 'wo_acessoDesignador'], 'Consulta BD / HPSD / caracteristica BD designadorAcesso', 'Exigido pela consulta; BD value opcional');
add('productStatus', 'VE / payload de assets', 'PARCIAL', 'Sim: dentro do contexto de assets',
  'EJ interpreta bloqueio conforme US01/02/03; DFT slide 4 atribui decisao ao VE. Literal bloqueio e conversao do status do asset nao estao aprovados nas fontes primarias.',
  [story(1, 17), story(3, 20), dft(4)], ['productStatus'], 'Decisao de bloqueio financeiro', 'Necessario avaliar bloqueio');
add('documentNumber', 'VE / contexto de cliente', 'IDENTIFICADA', 'Sim',
  'Numero do documento exigido no contrato VE. businessKey usa CNPJ sem pontuacao. Nao inferir que CPF autenticado e CNPJ selecionado sejam a mesma identidade.',
  [massivaStart(16), massivaStart(8), dft(4)], ['wo_documentNumber', 'bd_documentNumber'], 'Start / businessKey / cliente WO / BD');
add('productType', 'VE / contexto do produto', 'IDENTIFICADA', 'Sim', 'Tipo do produto exigido no contrato VE; dominio nao preenchido no mapping.',
  [massivaStart(14)], [], 'variables.productType', 'Sim');
add('externalIdentifier', 'VE / contexto de servico', 'PARCIAL', 'Sim: resolver identidade',
  'Mapping VE denomina id designador; downstream exige servico 013. Validar se e alias de designadorServico em vez de novo dado independente.',
  [massivaStart(13), source('MASSIVA', 'Camunda x MS Request', 'D8;K8')], [], 'variables.externalIdentifier', 'Sim');
add('correlationId', 'VE / geracao tecnica', 'CONFLITO', 'Sim: cabecalho/contexto tecnico',
  'Mapping atribui correlacao ao VE. HPSD OpenAPI exige UUID v4 e eco no callback; mapping usa CID_VE_<timestamp>. Manter correlacao original e definir correlacao especifica HPSD sem confundir com businessKey/processInstanceId.',
  [massivaStart(15), source('HPSD', 'Camunda x HPSD - Request', 'D7;E7;K7'),
    { file: 'Gtw Redes Service Test Management-V1.0.0-API.json', sheet: 'OpenAPI', cell: '/paths/~1serviceTest/post/parameters' }], ['correlationId'], 'X-Vivo-Correlation-Id / callback');
add('transactionId', 'Gerado / canal ou integracao por chamada', 'PARCIAL', 'Sim: header da chamada inicial',
  'Responsavel varia por fronteira: VE no start, Camunda no HPSD, MS no BD. Nao reutilizar timestamp ilustrativo. Mascaras INT divergentes e UUID HPSD exigem conciliacao.',
  [massivaStart(6), source('HPSD', 'Camunda x HPSD - Request', 'D6;E6;K6'), bdSource(7)], [], 'X-Vivo-Transaction-Id');
add('businessKey', 'Calculado / canal', 'IDENTIFICADA', 'Sim: metadado calculado',
  'CANAL;CNPJ;DESIGNADOR, sem espacos, CNPJ sem formatacao. Confirmar qual designador identifica instancia e politica de unicidade/reabertura. Exemplo JRN-2026-001 nao atende regra descrita.',
  [massivaStart(8)], [], 'Envelope de inicio', 'Sim');
add('processDefinitionKey', 'Configuracao / plataforma', 'PARCIAL', 'Sim: metadado',
  'Chave publicada da jornada; nao usar exemplo jornada-venda-v1. Alinhar registry e deployment; nao dado de negocio do cliente.', [massivaStart(9)], [], 'Envelope de inicio', 'Sim');
add('assignee', 'VE / identidade autenticada ou regra tecnica', 'PARCIAL', 'Sim: metadado; identidade pendente',
  'Campo exigido no contrato VE; exemplo agente-01 nao fecha identidade para autosservico.', [massivaStart(10)], ['assignee'], 'Envelope e user tasks', 'Sim');
add('requestSystem', 'Fixo / contexto por fronteira', 'CONFLITO', 'Sim: contexto tecnico',
  'VE no contrato inicial (descricao parametro fixo); MVE/APPVIVO nos headers WFM. Nao unificar com WorkOrder_Create.sourceSystem.',
  [massivaStart(12), woSource(7)], [], 'Start / headers WFM', 'Sim');
add('authorization', 'Seguranca / token do canal e token exchange', 'IDENTIFICADA', 'Sim: header; nao variavel de negocio',
  'Bearer por requisicao. Credenciais/segredos ficam fora da planilha. Continuacao assincrona precisa estrategia de autenticacao propria; nao persistir token como dado do cliente.',
  [massivaStart(5), dft(9)], ['_authorizationHeader'], 'Authorization');
add('issServiceNow', 'Configuracao / autenticacao', 'NAO IDENTIFICADA', 'Pendente; nao exigir como dado do cliente',
  'Leitura obrigatoria no BPMN atual nao comprova requisito do VE. Definir se issuer vem do token/configuracao e se Journey usa MS Trouble Ticket ou gateway direto.',
  [{ file: bpmnFile, sheet: 'Implementacao atual', cell: 'Node_ConsultaBD' }, dft(9)], ['issServiceNow'], 'Header iss na implementacao');
add('requestTimestamp', 'Sem necessidade comprovada', 'NAO IDENTIFICADA', 'Nao: sem consumidor atual',
  'Consta na documentacao START atual, mas nao e lido no corpo executavel. Data de transacao pode ser gerada no emissor; nao ha requisito para este alias.',
  [{ file: bpmnFile, sheet: 'Comparacao atual', cell: 'Node_Start versus leituras executaveis' }], ['requestTimestamp'], '', 'Nao comprovada');
const contextFields = [
  ['networkOwner', ['wfmNetworkOwner'], 'Proprietario da rede: VIVO1/VIVO2; nao fixar VIVO1.', 29],
  ['accessTechnology', ['wfmMediaType'], 'Tecnologia efetiva do asset; GPON e exemplo, nao default universal.', 27],
  ['cnl', ['wfmCnl'], 'CNL do local; preservar zeros, tamanho documental 5; nao fixar 11000.', 30],
  ['telephonicArea', ['wfmTelephonicArea'], 'Obrigatorio na variante VIVO1; ausente na variante VIVO2. Nao exigir para todas as redes.', 28],
  ['centralOffice', ['wfmCentralOffice'], 'Obrigatorio na variante VIVO1; ausente na variante VIVO2.', 31],
  ['geographicSiteId', ['wfmGeographicSiteId'], 'ID do armario/site obrigatorio nas tabelas VIVO1 e VIVO2; origem upstream nao identificada. Nao copiar PRCTA_G1D23.', 34],
  ['attendantId', ['wfmAttendantId'], 'Tabela slots exige ID de entidade Ouvidoria, mas contexto de autosservico nao esclarece origem. 80620689 e exemplo.', 16],
];
for (const [name, aliases, rule, row] of contextFields) add(name, 'VE / asset ou enriquecimento a definir',
  name === 'geographicSiteId' || name === 'attendantId' ? 'NAO IDENTIFICADA' : 'PARCIAL',
  'Pendente: contexto tecnico antes de consultar slots', `${rule} Documentacao estabelece consumo, nao caminho original do asset nem nova obrigacao de entrada.`,
  [slotSource(row), story(1, 17)], aliases, 'INT11 pesquisa / INT14 WO', 'Sim no request; condicao por rede quando indicada');
const woFields = {
  customerId: 'ID Salesforce do cliente; nao confundir com ServiceNow CustomerContact.',
  customerName: 'Nome do cliente/empresa selecionada.', customerCategory: 'Categoria do cliente sem origem fechada; CORPORATE nao implica categoria universal.',
  contactName: 'Nome de contato; nao e coletado nas telas desta jornada.', emailAddress: 'Email de contato; nao e coletado nas telas.',
  mobileNumber: 'Celular de contato.', phoneNumber: 'Telefone de contato.', workNumber: 'Telefone comercial de contato.',
  orderId: 'ID de pedido comercial: origem nao definida para abertura de defeito.', orderProtocol: 'Protocolo de pedido: origem nao definida.',
  dateOfSale: 'Data da venda: nao calcular pela data atual.', orderDetail: 'Detalhe do pedido: nao repetir texto de teste.',
  cnlAcronym: 'Sigla CNL: nao derivar de codigo sem tabela oficial.', city: 'Cidade do endereco de instalacao selecionado.',
  neighborhood: 'Bairro de instalacao.', stateOrProvince: 'UF: normalizacao nome extenso para sigla no WFM; manter representacao original para BD ate validacao.',
  streetCode: 'Codigo do logradouro: fonte nao identificada.', streetName: 'Logradouro de instalacao.', streetNr: 'Numero do imovel.',
  complement: 'Complemento: fonte exata e tratamento de ausencia pendentes.', latitude: 'Latitude: nao inventar geocodificacao.',
  longitude: 'Longitude: ordem bbox deve ser longitude,latitude.', addressReference: 'Referencia do endereco: fonte nao identificada.',
  productId: 'ID do produto Banda Larga selecionado.', acessoId: 'ID do produto de acesso, diferente de designador.',
  detail: 'DETALHE da especificacao WO: sem regra de preenchimento comprovada.', relatedEntity: 'Produtos e caracteristicas opcionais em override; nao exigir JSON livre do canal sem contrato.'
};
const partialWo = new Set(['customerId', 'customerName', 'city', 'neighborhood', 'stateOrProvince', 'streetName', 'streetNr', 'productId', 'acessoId']);
for (const [field, rule] of Object.entries(woFields)) add(`contexto.${field}`, partialWo.has(field) ? 'VE / contexto de assets' : 'Origem a definir',
  partialWo.has(field) ? 'PARCIAL' : 'NAO IDENTIFICADA', 'Pendente: nao promover exemplo a entrada obrigatoria',
  `${rule} Familia cliente/endereco/produto pode vir do contexto de assets, mas caminho e obrigatoriedade individual ainda nao confirmados. Campos que so aparecem no payload nao herdam required dos agrupadores.`,
  [story(1, 17), woSource(13), woSource(14), { file: 'Analise/dossie-integracoes-bd-ve.html', sheet: 'Analise secundaria P08', cell: '#pendencia-critica' }],
  [`wo_${field}`], 'INT14 WorkOrder_Create; reuso eventual INT18 BD', 'Nao especificada por folha no request WO; conferir payload');
add('postcode', 'VE / endereco do asset', 'PARCIAL', 'Pendente: no contexto de endereco',
  'CEP nao esta tabelado nos requests de slots, mas e usado no BPMN/WO. Preservar zeros; nao inventar mascara normativa.',
  [story(1, 17), bdSource(60), woSource(14)], ['wfmPostcode'], 'WO.place.postcode / BD postcode');
add('microArea', 'Origem a definir', 'NAO IDENTIFICADA', 'Nao exigir sem contrato',
  'Alias lido no BPMN; nao consta nas tabelas principais de slots. Confirmar aplicabilidade por rede e origem.',
  [slotSource(31), { file: bpmnFile, sheet: 'Implementacao', cell: 'Node_ConsultaSlots' }], ['wfmMicroArea'], 'INT11', 'Nao comprovada');
add('hpsdRelatedServiceId', 'VE / servico a testar', 'PARCIAL', 'Pendente: no contexto do servico',
  'HPSD exige relatedService.id. Nao assumir que ID do servico e designador sejam intercambiaveis. Definir caminho no asset.',
  [source('HPSD', 'Camunda x HPSD - Request', 'D17;E17;H17'), dft(5)], ['hpsdRelatedServiceId'], 'INT06 relatedService.id', 'Sim na API');
for (const [name, aliases, rule, ref] of [
  ['testSpecificationId', [], 'Selecionar especificacao de teste aprovada por produto/rede. spec-ftth-gpon-basico no payload nao comprova constante universal.', source('HPSD', 'Camunda x HPSD - Request', 'D21;H21')],
  ['diagnosticName', [], 'Nome do teste e obrigatorio; origem/configuracao do nome nao definida na tabela. Diagnostic-FTTH-Automatic e exemplo.', source('HPSD', 'Camunda x HPSD - Request', 'D9;H9')],
  ['diagnosticMode', [], 'ONDEMAND ou PROACTIVE; escolher regra FTAT-933. Nao equiparar ao mode enviado como entidade do BD.', source('HPSD', 'Camunda x HPSD - Request', 'D10;E10;H10')],
  ['executionMode', [], 'No modo automatico enviar characteristic executionMode=AUTOMATIC conforme descricao; constante condicional.', source('HPSD', 'Camunda x HPSD - Request', 'D25;E25')]
]) add(name, name === 'executionMode' ? 'Fixo / regra condicional' : 'Configuracao / regra a definir',
  name === 'executionMode' ? 'IDENTIFICADA' : 'PARCIAL', 'Nao: configuracao da jornada', rule, [ref], aliases, 'Request HPSD');
add('woIdJornada', 'Gerado / Journey', 'IDENTIFICADA', 'Nao',
  'Gerar VE+UUID conforme L12. Ressalva avaliar limite de 50 caracteres permanece pendente; definir estabilidade para retries.',
  [woSource(12), story(8, 49)], ['woIdJornada'], 'WorkOrder_Create.id');
add('workOrderItemIdEnviado', 'Calculado / Journey', 'PARCIAL', 'Nao',
  'Relacionar item a WO e externalId do appointment. Regra atual WO+:1 e apenas implementacao; confirmar regra contratual e idempotencia.',
  [woSource(14), woSource(25)], [], 'workOrderItem.id / Appointment_Create.externalId');
add('sourceSystemWO', 'Fixo / contrato WO', 'IDENTIFICADA', 'Nao',
  'Tabela K11 estabelece SERVICENOWB2BMASSIVO; BPMN usa MVE. Tratar como ajuste de montagem, nao nova entrada.', [woSource(11)], [], 'WorkOrder_Create.sourceSystem');
add('acronym', 'Fixo / atividade de defeito', 'IDENTIFICADA', 'Nao',
  'TT_B para consulta de slots e especificacao WO; workflow o identifica expressamente como fixo.', [woSource(19), slotSource(13), workflow], [], 'Slots relatedParty.name / WO specification.acronym');
add('janelaPesquisaSlots', 'Calculado / politica a definir', 'NAO IDENTIFICADA', 'Nao: definir politica/configuracao',
  'Tabelas exigem inicio/fim, mas so exemplificam datas. Hoje+1/hoje+8 no BPMN nao e requisito documental. PDF usa minLeadDays/maxDaysAhead em venda, sem prova de aplicacao a defeito.',
  [slotSource(20), slotSource(21), pdf(19)], [], 'requestedTimeSlot[].validFor', 'Sim no request slots');
const formFields = [
  ['acaoReinicio', 'reiniciei | nao_consigo', 'Node_Reinicie', 5, 46],
  ['voltouReinicio', 'sim | nao', 'Node_VoltouReinicio', 4, 39],
  ['acaoTeste', 'continuar | inicio', 'Node_TesteConexao', 6, 46],
  ['voltouNovamente', 'sim | nao', 'Node_VoltouNovamente', 12, 53],
  ['acaoEnergia', 'verifiquei | nao_consigo', 'Node_SemEnergia', 13, 50],
  ['voltouEnergia', 'sim | nao', 'Node_VoltouEnergia', 13, 50],
  ['temEnergia', 'sim | nao', 'Node_TemEnergia', 13, 98],
  ['acaoAgendar', 'agendar | inicio', 'Node_AgendarVisita', 7, 56],
  ['dataVisita', 'Data do slot escolhido', 'Node_EscolheHorario', 7, 56],
  ['horarioVisita', 'Escolha vinculada a slot WFM', 'Node_EscolheHorario', 7, 56],
  ['avisarHorarioMaisCedo', 'boolean; nao fixar true', 'Node_EscolheHorario', 7, 56],
  ['retentarBD', 'sim | nao', 'Node_RetentarBD', 10, 71],
  ['acaoFinal', 'salvar_agenda | inicio', 'Node_VisitaAgendada', 11, 62]
];
for (const [field, domain, node, number, paragraph] of formFields) add(`form.${field}`, 'Tela / usuario via VE', 'IDENTIFICADA', 'Nao: somente no advance da tela',
  `${domain}. Nome tecnico/enum observado nas telas atuais, nao imposto pela US. ${field === 'dataVisita' ? 'BPMN nao usa data digitada para escolher slot; conferir consistencia com horario selecionado.' : ''}${field === 'acaoFinal' ? 'Acao enviada pela tela sem consumidor no BPMN; nao inferir integracao de calendario.' : ''}${field === 'avisarHorarioMaisCedo' ? 'Escolha/consentimento do usuario; obrigatoriedade do campo nao obriga valor true.' : ''}`,
  [story(number, paragraph), { file: 'fenix-ve-abertura-bd-v1/screens.json', sheet: 'Tela SDUI', cell: node }], [`form_${field}`], node,
  'Conforme etapa; nao obrigatorio no inicio', 'Durante interacao com usuario');
const outputs = [
  ['consultaMassivaOk', 'Calculado / Journey', 'HTTP 200 e interpretacao da resposta; validacao de schema deve impedir JSON invalido virar ausencia.', 'Node_TrataMassiva'],
  ['temMassiva', 'Calculado / resposta INT01', 'Derivar de incidentes/status retornados; nao entrada VE.', 'Node_TrataMassiva'],
  ['massivaProtocolo', 'Integracao / INT01', 'BPMN usa incidentId; confirmar se representa protocolo pedido na US02.', 'Node_TrataMassiva'],
  ['massivaPrevisaoConclusao', 'Integracao + formatacao / INT01', 'expectedResolutionDate; formatar para exibicao sem perder valor original/fuso.', 'Node_TrataMassiva'],
  ['consultaBDOk', 'Calculado / Journey', 'Distinguir consulta vazia de erro; conciliar 404/code60 com contrato.', 'Node_TrataBD'],
  ['temBD', 'Calculado / resposta INT03', 'Identificar ticket ativo a partir da resposta, nao receber do canal como verdade externa.', 'Node_TrataBD'],
  ['bdNumero', 'Integracao / INT03', 'ID tecnico do BD consultado; nao confundir com numero externo/protocolo.', 'Node_TrataBD'],
  ['bdProtocoloAtendimento', 'Integracao / INT03', 'BPMN usa relatedEntity number ou externalIdentifier.id; equivalencia com protocolo de atendimento pendente.', 'Node_TrataBD'],
  ['bdPrevisaoConclusao', 'Integracao / INT03', 'BPMN procura ets; confirmar caminho no contrato retornado pelo MS.', 'Node_TrataBD'],
  ['bloqueioFinanceiro', 'Calculado / contexto de assets', 'Interpretar situacao financeira; literal e dono da decisao divergentes entre US e DFT.', 'Node_AvaliaImpedimentos'],
  ['impedimento', 'Calculado / Journey', 'Combinar BD, massiva e financeiro; definir precedencia de combinacoes nao cobertas.', 'Node_AvaliaImpedimentos'],
  ['diagnosticoSolicitado', 'Calculado / aceite HPSD', 'HTTP de aceite nao e resultado final do teste.', 'Node_TrataSolicitacaoDiagnostico'],
  ['diagnosticoServiceTestId', 'Integracao / INT06', 'ID devolvido por POST /serviceTest; necessario para GET posterior. Nao gerar nem aceitar aceite sem ID sem tratamento.', 'Node_TrataSolicitacaoDiagnostico'],
  ['idRetorno', 'Integracao / HPSD callback ou consulta', 'Codigo tecnico do resultado. US12 ID06/07/10; US13 ID09. Nao misturar com resposta do cliente.', 'Node_TrataResultadoDiagnostico'],
  ['resultadoDiagnostico', 'Calculado / retorno HPSD', 'Interpretar codigos; definir desconhecidos, ausencia de campo e falhas.', 'Node_TrataResultadoDiagnostico'],
  ['resumoDiagnostico', 'Calculado / retorno HPSD', 'BPMN produz resumo JSON; mapping BD exemplifica evento completo. Contrato do payloadDiagnostico precisa decisao.', 'Node_TrataResultadoDiagnostico'],
  ['resultadoSlots', 'Calculado / resposta WFM', 'Distinguir slots disponiveis, 204/sem slots e erro.', 'Node_TrataSlots'],
  ['slotsWfm', 'Integracao / INT11', 'Lista de slots com id/timeslot, resourceId/resourceName, inicio/fim; preservar retorno para validar escolha.', 'Node_TrataSlots'],
  ['horariosVisita', 'Calculado / lista WFM', 'Opcoes de exibicao derivadas da disponibilidade, nao grade fixa.', 'Node_TrataSlots'],
  ['horarioValido', 'Calculado / escolha + lista WFM', 'Verificar pertencimento e revalidar disponibilidade conforme US07; BPMN atual so valida lista local.', 'Node_RegistraHorario'],
  ['slotEscolhido', 'Tela + integracao / WFM', 'Usuario seleciona; detalhes tecnicos devem vir do retorno original e ser revalidados, nao texto livre.', 'Node_RegistraHorario'],
  ['dataVisita', 'Calculado / slot escolhido', 'Data para exibicao; separar de form.dataVisita e scheduleDate serializado.', 'Node_RegistraHorario'],
  ['woHorario', 'Calculado / slot escolhido', 'Periodo para exibicao, nao dado inicial.', 'Node_RegistraHorario'],
  ['visitaInicio', 'Integracao / slot escolhido', 'validFor.startDateTime original; politica de fuso pendente.', 'Node_RegistraHorario'],
  ['visitaFim', 'Integracao / slot escolhido', 'validFor.endDateTime original.', 'Node_RegistraHorario'],
  ['avisarHorarioMaisCedo', 'Tela / usuario', 'Boolean de consentimento, encaminhado a canBeAntecipated; nao calcular consentimento.', 'Node_RegistraHorario'],
  ['woCriada', 'Calculado / resposta INT14', 'Exigir contrato de sucesso e IDs retornados.', 'Node_TrataWO'],
  ['woNumero', 'Integracao / INT14', 'idWorkOrder; preservar ID enviado para reconciliar falha/timeout. Nao confundir numero WO com idWork.', 'Node_TrataWO'],
  ['woItemId', 'Integracao / INT14', 'idWorkOrderItem alimenta caracteristica WorkOrderItem do BD.', 'Node_TrataWO'],
  ['woIdWork', 'Integracao / INT14', 'idWork; relacao com idAppointment nao comprovada.', 'Node_TrataWO'],
  ['woErro', 'Integracao / INT14', 'code/reason/message/origin para tratamento e diagnostico sem dados sensiveis.', 'Node_TrataWO'],
  ['tentativasBD', 'Calculado / Journey', 'Contador interno: ate tres tentativas totais segundo US10, com decisao humana entre elas.', 'Node_TrataWO / Node_TrataBDCriado'],
  ['bdCriado', 'Calculado / resposta INT18', 'Confirmacao de criacao; nao confundir sucesso HTTP sem body com evidencia de identificacao.', 'Node_TrataBDCriado'],
  ['bdCriadoId', 'Integracao / INT18', 'ID tecnico retornado do Trouble Ticket.', 'Node_TrataBDCriado'],
  ['bdCriadoNumero', 'Integracao / INT18', 'externalIdentifier.id: numero do BD no SN; protocolo de atendimento pode ser outro.', 'Node_TrataBDCriado']
];
for (const [name, origin, rule, node] of outputs) add(name, origin,
  /Protocolo|Previsao|idRetorno|resumo|woIdWork/i.test(name) ? 'PARCIAL' : 'IDENTIFICADA', 'Nao', rule,
  [{ file: bpmnFile, sheet: 'Produtor observado; nao contrato-alvo', cell: node },
    /Massiva/.test(node) ? story(2, 45) : /Slots|Horario/.test(node) ? story(7, 52) : /WO/.test(node) ? story(8, 51) : /Diagnostico/.test(node) ? story(12, 45) : story(11, 59)],
  [name], node, 'Interna ou retorno; nao entrada do canal');
const bdBook = bookFor('Abertura de BD');
const bdSheet = bdBook.sheets[0];
const bdRow = number => Object.fromEntries(bdSheet.rows.find(row => row.number === number).cells.map(cell => [cell.column, cell.text]));
const bdReuse = {
  estadoDescricao: 'Endereco do asset; normalizacao UF/nome por destino pendente.', city: 'Reutilizar contexto de cidade.',
  endBairro: 'Reutilizar bairro.', postcode: 'Reutilizar CEP.', telephonicArea: 'Reutilizar contexto de rede quando aplicavel.',
  streetName: 'Reutilizar logradouro.', streetNr: 'Reutilizar numero.', complement: 'Reutilizar complemento se disponivel.',
  reclamanteNome: 'Contato do reclamante nao necessariamente nome da empresa; fonte exata pendente.', documentNumber: 'Reutilizar documento do contexto, distinguindo cliente/reclamante.',
  telefoneContatoLocal1: 'Contato local pode diferir do titular; nao assumir celular/telefone do cadastro sem regra.',
  telefoneContatoLocal2: 'Segundo contato local se houver fonte aprovada.', designadorAcesso: 'Designador acesso 069; separar do servico 013.',
  WorkOrder: 'Resposta idWorkOrder de INT14.', WorkOrderItem: 'Resposta idWorkOrderItem de INT14.',
  previsaoAtendimento: 'Derivar do slot confirmado; mascara dd/MM/yyyy HH:mm-HH:mm e apenas exemplo a validar.',
  payloadDiagnostico: 'Retorno/evento HPSD; decidir payload completo ou resumo, principalmente apos timeout.',
  idAppointment: 'Nao identificado no contrato de retorno WO; nao assumir igualdade com idWork.'
};
for (let row = 54; row <= 124; row += 2) {
  const name = bdRow(row)[11];
  const value = bdRow(row + 1);
  const produced = ['WorkOrder', 'WorkOrderItem', 'previsaoAtendimento', 'payloadDiagnostico'].includes(name);
  add(`BD.${name}`, produced ? 'Integracao anterior / derivacao' : bdReuse[name] && name !== 'idAppointment' ? 'Reuso de contexto; origem exata a confirmar' : 'Origem a definir',
    produced ? 'PARCIAL' : 'NAO IDENTIFICADA', 'Nao como nova entrada obrigatoria; value opcional',
    `${bdReuse[name] ?? 'Nao ha origem ou regra comprovada. Nao copiar valor do exemplo nem assumir constante.'} Nome da caracteristica obrigatorio se item enviado; value ${value[8] ?? 'nao informado'} na tabela. Omissao/valor vazio devem ser conciliados com validacao downstream.`,
    [source('BD', bdSheet.name, `K${row};H${row};D${row + 1};H${row + 1};K${row + 1}`)], [`bd_${name}`],
    `troubleTicketCharacteristic[name=${name}].value`, `Nome: Sim; value: ${value[8]}; grupo opcional`);
}
for (const [name, row, rule] of [
  ['productInventoryId', 25, 'ID do produto em inventario; nao assumir igualdade ao ID da WO nem ao designador.'],
  ['relatedServiceSpecificationId', 31, 'ID da especificacao do servico; origem no catalogo/asset precisa de caminho confirmado.'],
  ['relatedServiceId', 34, 'ID do servico; confirmar se corresponde ao relatedService HPSD.'],
  ['customerId', 43, 'ID Salesforce do cliente; reutilizar contexto se identidade confirmada.'],
  ['customerName', 44, 'Nome do cliente; origem individual upstream pendente.'],
  ['email', 48, 'Contato requerido internamente por TMF629, opcional na entrada Journey: definir enriquecimento no MS.'],
  ['phone', 50, 'Contato telefonico opcional na entrada e exigido internamente: nao promover automaticamente a START.'],
  ['serviceNowCustomerId', 52, 'Distinguir cliente ServiceNow de CustomerContact criado/atualizado pelo MS TMF629.'],
  ['description', 12, 'Obrigatorio no BD; regra de composicao deve ser definida. TESTE nao e valor produtivo.'],
  ['severity', 13, 'Obrigatorio no BD; 3 no exemplo nao comprova severidade fixa aprovada.'],
  ['name', 16, 'Titulo opcional na entrada; Queda de Conexao e exemplo.'],
  ['channel', 18, 'Canal/Alert e exemplo; nao equivale automaticamente ao canal VE.']
]) add(`BD.${name}`, 'Origem / regra a definir', 'NAO IDENTIFICADA', 'Pendente; nao exigir por alias atual', rule,
  [bdSource(row), dft(10)], [`bd_${name}`], `INT18 ${name}`);
add('produtos.Code_velocidade_IP_roteador', 'VE / catalogo / integracao a definir', 'NAO IDENTIFICADA', 'Pendente',
  'Payload WO exemplifica Code, Banda Larga-VEL, Banda Larga-IPFIXO e Roteador. Validar cardinalidade por oferta e origem de cada item; nao exigir produtos inexistentes para todo cliente.',
  [woSource(14), { file: sourceFile('WO'), sheet: 'Camunda x WFM Journey REQUEST', cell: 'B36 payload' }], [], 'WO.workOrderItem[].relatedEntity');
const assetUrl = 'https://wikicorp.telefonica.com.br/spaces/ADS/pages/870859882';
const assetMappings = [
  ['designadorServico', 'asset[i].logicalResource.id', 'content[i].productCharacteristic[name=idDesignador].value', 'Id designador de servico; selecionar produto correto para distinguir servico 013 de acesso 069.'],
  ['productStatus', 'asset[i].stsProduct.productStatus', 'content[i].status', 'Ativo->Active; Suspenso->Suspended; Cancelado->Cancelled; Pendente->Pending. Nao prova bloqueio financeiro nem literal bloqueio.'],
  ['accessTechnology', 'asset[i].address.equipment.typeEquipment', 'content[i].productCharacteristic[name=type].value', 'Tipo de conexao, exemplo GPON; caracteristica technology e outro campo, equipment.technologyEquipment.'],
  ['networkOwner', 'asset[i].address.network.networkType', 'content[i].productCharacteristic[name=networkOwnerId].value', 'Exemplo numerico 0; DE/PARA para VIVO1/VIVO2 nao definido nesta pagina.'],
  ['contexto.customerId', 'asset[i].customerAccount.id', 'content[i].relatedParty[].partyOrPartyRole.id', 'Descricao id cliente SFA; selecionar papel correto; verificar compatibilidade entre CRMs.'],
  ['contexto.customerName', 'asset[i].customer.organizationName.companyName', 'content[i].relatedParty[].partyOrPartyRole.name', 'Nome da organizacao; nao nome do contato/reclamante.'],
  ['documentNumber', 'asset[i].customer.organizationIdentification.documentNumber', 'content[i].relatedParty[].partyOrPartyRole.partyCharacteristic[name=documentNumber].value', 'Tipo CPF/CNPJ em documentType; empresa selecionada pode diferir do usuario autenticado.'],
  ['contexto.streetNr', 'asset[i].address.urbanAddress.streetNr', 'content[i].place[role=installationAddress].place.streetNr', 'Campo de resposta opcional; envelope VE->Journey ainda pendente.'],
  ['contexto.streetName', 'asset[i].address.urbanAddress.streetName', 'content[i].place[role=installationAddress].place.streetName', 'Campo de resposta opcional.'],
  ['contexto.stateOrProvince', 'asset[i].address.urbanAddress.nameState', 'content[i].place[role=installationAddress].place.stateOrProvince', 'Exemplo remoto usa RJ; dossie cita nome extenso em outra resposta. Normalizar por contrato real do CRM, sem assumir formato unico.'],
  ['postcode', 'asset[i].address.urbanAddress.postcode', 'content[i].place[role=installationAddress].place.postcode', 'Preservar zeros; opcional na resposta de asset.'],
  ['contexto.neighborhood', 'asset[i].address.urbanAddress.municipalityname', 'content[i].place[role=installationAddress].place.locality', 'Descricao Bairro apesar do nome municipalityname; nao confundir com city.'],
  ['contexto.city', 'asset[i].address.urbanAddress.nameCity', 'content[i].place[role=installationAddress].place.city', 'Cidade da instalacao selecionada.'],
  ['contexto.complement', 'asset[i].address.suffixType1..3.streetSuffix + suffixValue1..3.streetSuffix', 'content[i].place[].place.geographicSubAddress[].subUnit[].subUnitType/subUnitNumber', 'Fonte estruturada identificada; regra de concatenacao para string WO/BD nao fechada.'],
  ['BD.productInventoryId', 'asset[i].product.productSpecification.id', 'content[i].productCharacteristic[name=productInventorySom].value', 'Candidato: descricao ID produto SOM; nao comprova equivalencia com ProductInventory exigido no BD.'],
];
for (const [name, upstream, canonical, note] of assetMappings) {
  const item = catalog.find(entry => entry.name === name);
  item.rule += ` Mapping remoto assets: ${upstream} -> ${canonical}. ${note}`;
  item.upstream = canonical;
  item.refs.unshift({ file: assetUrl, sheet: '2.1.3 Response', cell: canonical });
  if (name === 'contexto.complement') item.status = 'PARCIAL';
  if (name === 'productStatus') item.status = 'CONFLITO';
}
const occurrences = [];
const blocks = [...xml.matchAll(/<bpmn:(serviceTask|scriptTask|userTask|sequenceFlow|intermediateCatchEvent|boundaryEvent)\b[\s\S]*?<\/bpmn:\1>/g)];
function occurrence(variable, operation, node, name, line, expression) {
  occurrences.push({ variable, operation, node, name, line, expression: clean(expression) });
}
for (const match of blocks) {
  const body = match[0].replace(/<bpmn:documentation>[\s\S]*?<\/bpmn:documentation>/g, '');
  const id = match[0].match(/\bid="([^"]+)"/)?.[1];
  const name = match[0].match(/\bname="([^"]+)"/)?.[1] ?? '';
  const line = xml.slice(0, match.index).split('\n').length;
  for (const found of body.matchAll(/execution\.(getVariable|setVariable)\(\s*['"]([^'"]+)['"]/g)) {
    if (['data_wo_', 'data_bd_'].includes(found[2])) continue;
    occurrence(found[2], found[1] === 'getVariable' ? 'Leitura' : 'Escrita', id, name, line, found[0]);
  }
  for (const found of body.matchAll(/\b(wo|bd)\('([^']+)'\)/g)) occurrence(`data_${found[1]}_${found[2]}`, 'Leitura dinamica resolvida', id, name, line, found[0]);
  for (const found of body.matchAll(/\b(data_[A-Za-z0-9_]+|form_[A-Za-z0-9_]+)\b/g)) {
    if (['data_wo_', 'data_bd_'].includes(found[1])) continue;
    if (!occurrences.some(item => item.variable === found[1] && item.node === id)) occurrence(found[1], 'Referencia', id, name, line, found[0]);
  }
  if (body.includes('${assignee}')) occurrence('assignee', 'Leitura expressao', id, name, line, '${assignee}');
  for (const found of body.matchAll(/environment\.getProperty\('([^']+)'/g)) occurrence(found[1], 'Configuracao', id, name, line, found[0]);
}
const bdNodeLine = xml.slice(0, xml.indexOf('<bpmn:serviceTask id="Node_CriaBD"')).split('\n').length;
for (let row = 54; row <= 124; row += 2) occurrence(`data_bd_${bdRow(row)[11]}`, 'Leitura dinamica em loop', 'Node_CriaBD', 'Cria BD (INT18)', bdNodeLine,
  'calculadas[nome] ?: bd(nome) ?: padrao[nome] ?: vazio; ler override apenas se calculada ausente');
const screenFile = 'fenix-ve-abertura-bd-v1/screens.json';
const screensText = fs.readFileSync(path.join(root, screenFile), 'utf8');
for (const found of screensText.matchAll(/\b(form|data)\.([A-Za-z][A-Za-z0-9_]*)\b/g)) {
  const variable = `${found[1]}_${found[2]}`;
  if (!occurrences.some(item => item.variable === variable && item.operation === 'Binding tela')) occurrence(variable, 'Binding tela', 'screens.json', 'Binding SDUI',
    screensText.slice(0, found.index).split('\n').length, found[0]);
}
for (const item of catalog) {
  item.aliases = [...new Set(item.aliases)];
  item.occurrences = occurrences.filter(occ => item.aliases.includes(occ.variable.replace(/^data_/, '')) || item.aliases.includes(occ.variable));
}
for (const name of [...new Set(occurrences.map(item => item.variable))]) {
  if (catalog.some(item => item.aliases.includes(name) || item.aliases.includes(name.replace(/^data_/, '')))) continue;
  const uses = occurrences.filter(item => item.variable === name);
  const writes = uses.some(item => item.operation === 'Escrita');
  const config = uses.some(item => item.operation === 'Configuracao');
  add(name, config ? 'Configuracao / ambiente' : writes ? 'Produzida na implementacao atual' : /-status$|-response$/.test(name) ? 'Integracao / delegate HTTP' : 'Nao identificada',
    config || writes || /-status$|-response$/.test(name) ? 'IDENTIFICADA' : 'NAO IDENTIFICADA', 'Nao promover a entrada sem requisito',
    'Inventario complementar de implementacao, nao requisito novo. Ver produtor/consumidor na aba BPMN. ' + (config ? 'Configurar por ambiente; nao pedir ao usuario.' : ''),
    [{ file: uses[0].node === 'screens.json' ? screenFile : bpmnFile, sheet: 'Implementacao observada', cell: `${uses[0].node}; linha ${uses[0].line}` }],
    [name], uses.map(item => item.node).join(', '), 'Tecnica; verificar contrato');
  catalog.at(-1).occurrences = uses;
}
const mappings = [];
const payloads = [];
let mappingSequence = 0;
for (const book of books) for (const sheet of book.sheets) {
  for (const row of sheet.rows) {
    const cells = Object.fromEntries(row.cells.map(cell => [cell.column, cell.text]));
    if (row.number > 3 && cells[4] && cells[4] !== 'Nome do Campo') {
      const direction = /callback/i.test(sheet.name) ? 'Callback' : /resp/i.test(sheet.name) ? 'Response' : 'Request';
      const scope = /OLD/.test(sheet.name) ? 'Historico OLD; nao vigente' : /^VE\s*x/i.test(sheet.name) ? 'Fronteira canal' : /^Camunda/i.test(sheet.name) ? 'Fronteira Journey' : 'Downstream do MS; nao chamada Journey';
      const field = cells[4];
      const group = cells[3] ?? '';
      const full = group.endsWith(field) ? group : `${group}.${field}`;
      const structural = /^(Agrupador|Objeto|Lista|Array)/i.test(cells[6] ?? '') || field === 'Body' || field === 'Header';
      const bdCharacteristic = book === bdBook && sheet === bdSheet && row.number >= 54 && row.number <= 125;
      const bdNameRow = bdCharacteristic ? row.number % 2 === 0 ? row.number : row.number - 1 : null;
      const logicalName = bdCharacteristic ? `BD.${bdRow(bdNameRow)[11]}` : '';
      const matched = logicalName ? catalog.find(item => item.name === logicalName) : catalog.find(item =>
        [item.name, ...item.aliases].some(alias => alias && norm(alias) === norm(field)));
      mappings.push({ id: `DM-${String(++mappingSequence).padStart(4, '0')}`, file: book.file, sheet: sheet.name,
        row: row.number, group, field, full, description: cells[5] ?? '', type: cells[6] ?? '', size: cells[7] ?? '',
        required: cells[8] ?? 'Nao informado', min: cells[9] ?? '', max: cells[10] ?? '', domain: cells[11] ?? '',
        notes: row.cells.filter(cell => cell.column > 11).map(cell => `${cell.address}: ${cell.text}`).join('\n'),
        direction, scope, classification: structural ? 'Agrupador; nao nova entrada' : bdCharacteristic && row.number % 2 === 0
          ? 'Nome estrutural da caracteristica' : matched?.origin ?? (direction !== 'Request' ? 'Retorno / nao entrada inicial' : 'Origem nao identificada; exemplo nao prova constante'),
        variable: matched?.name ?? '', start: matched?.start ?? 'Nao determinado por esta linha',
        status: matched?.status ?? (structural ? 'ESTRUTURAL' : direction !== 'Request' ? 'RETORNO' : 'NAO IDENTIFICADA') });
    }
    for (const cell of row.cells.filter(cell => cell.text.length > 700 && /\{|\[|POST|GET|DELETE/.test(cell.text))) {
      const parts = [];
      for (let offset = 0; offset < cell.text.length; offset += 24000) parts.push(cell.text.slice(offset, offset + 24000));
      parts.forEach((text, index) => payloads.push({ file: book.file, sheet: sheet.name, cell: cell.address,
        part: `${index + 1}/${parts.length}`, text, scope: /OLD/.test(sheet.name) ? 'Historico' : 'Exemplo documental; nao dado produtivo' }));
    }
  }
}
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false });
const process = parser.parse(xml).definitions.process;
const documentation = clean(process.startEvent.documentation);
const currentRequired = clean(documentation.split('Opcionais:')[0].split('):').at(-1)).replace(/\.$/, '').split(',').map(clean).filter(Boolean);
assert(currentRequired.includes('designador') && currentRequired.includes('bd_relatedServiceId'), 'Falha ao extrair START documentado');
const currentOptional = ['hpsdRelatedServiceId', 'wfmMicroArea', 'wo_relatedEntity', 'bd_<campo>'];
const comparisons = [];
for (const [name, obligation] of [...currentRequired.map(name => [name, 'Documentado obrigatorio no START']), ...currentOptional.map(name => [name, 'Documentado opcional no START'])]) {
  const matches = catalog.filter(item => item.aliases.includes(name));
  const used = occurrences.filter(item => item.variable === `data_${name}` || item.variable === name);
  let action = 'AJUSTAR / CONFIRMAR ORIGEM';
  let why = 'Exigencia atual nao prova origem VE. Nao manter como obrigatoria ate fechar fonte e contrato.';
  if (name === 'designador') { action = 'AJUSTAR / SEPARAR'; why = 'Separar designadorServico 013 e designadorAcesso 069; nao converter sufixo.'; }
  else if (name === 'requestTimestamp') { action = 'SEM NECESSIDADE COMPROVADA'; why = 'Sem leitura executavel; nao manter requisito START sem finalidade.'; }
  else if (name === 'correlationId') { action = 'MANTER CONCEITO / AJUSTAR CONTRATO'; why = 'Correlacao VE exigida; resolver UUID HPSD versus mascara CID.'; }
  else if (name === 'productStatus') { action = 'AJUSTAR / REUTILIZAR ASSET'; why = 'Origem VE confirmada em payload de assets, nao alias/literal bloqueio.'; }
  else if (/wfmTelephonicArea|wfmCentralOffice/.test(name)) { action = 'AJUSTAR / CONDICIONAL VIVO1'; why = 'Nao exigir incondicionalmente na variante VIVO2.'; }
  else if (name === 'bd_<campo>') { action = 'DISPENSAR EXIGENCIA GENERICA'; why = '36 values opcionais; reutilizar contexto e respostas; conferir necessidade por caracteristica.'; }
  else if (name === 'issServiceNow') { action = 'AJUSTAR / CONFIGURACAO'; why = 'Resolver issuer/autenticacao; nao dado de negocio do cliente.'; }
  comparisons.push({ name, obligation, evidence: 'BPMN Node_Start documentation; nao validacao real da fachada',
    consumed: used.length ? 'Sim' : name === 'bd_<campo>' ? 'Familia dinamica' : 'Nao identificado',
    target: matches.map(item => `${item.id} ${item.name}`).join('\n'), status: matches.map(item => item.status).join('; ') || 'PENDENTE',
    action, why, refs: matches.flatMap(item => item.refs), nodes: [...new Set(used.map(item => item.node))].join(', ') });
}
const createNames = ['assetSelecionado', 'designadorServico', 'designadorAcesso', 'documentNumber', 'productType', 'externalIdentifier',
  'businessKey', 'processDefinitionKey', 'assignee', 'requestSystem', 'transactionId', 'authorization'];
for (const name of createNames) {
  const item = catalog.find(item => item.name === name);
  comparisons.push({ name, obligation: 'Nao listado como variavel no START atual; pode existir como metadado/header',
    evidence: 'Contrato VE documental versus START BPMN, sem verificar registry publicado', consumed: 'Ver metadado/alias',
    target: `${item.id} ${name}`, status: item.status, action: /asset|designadorServico|designadorAcesso/.test(name) ? 'CRIAR / SEPARAR CONTRATO' : 'CONFERIR / CRIAR SE AUSENTE NO ENVELOPE',
    why: item.rule, refs: item.refs, nodes: item.destination });
}
for (const item of catalog.filter(item => item.name.startsWith('BD.') && item.aliases.some(alias => alias.startsWith('bd_')))) {
  if (comparisons.some(row => row.name === item.aliases[0])) continue;
  comparisons.push({ name: item.aliases[0], obligation: 'Coberto apenas pela familia opcional bd_<campo> ou alias dinamico',
    evidence: 'Leitura dinamica Node_CriaBD; tabela Abertura BD', consumed: 'Sim, com precedencia/fallback',
    target: `${item.id} ${item.name}`, status: item.status, action: item.name.includes('WorkOrder') || /previsaoAtendimento|payloadDiagnostico/.test(item.name)
      ? 'DERIVAR / NAO PEDIR NO START' : 'NAO EXIGIR / VALIDAR NECESSIDADE', why: item.rule, refs: item.refs, nodes: item.destination });
}
const rules = [
  ['R01', 'START independente', 'Lista atual de START nao define requisitos; usada exclusivamente na comparacao e inventario observado.', workflow, 'FECHADO'],
  ['R02', 'Duas identidades de designador', 'Servico 013 para massiva; acesso 069 para BD. Nenhum algoritmo de conversao documentado.', dft(2), 'AJUSTE NECESSARIO'],
  ['R03', 'Business key', 'CANAL;CNPJ;DESIGNADOR, CNPJ sem formatacao e sem espacos; resolver unicidade e designador apropriado.', massivaStart(8), 'PARCIAL'],
  ['R04', 'Geracao WO', 'VE+UUID orientado em L12; avaliar 50 caracteres. Gerar uma vez e preservar para retry/reconciliacao.', woSource(12), 'PARCIAL'],
  ['R05', 'Variantes de rede', 'telephonicArea/centralOffice VIVO1; nao unionar obrigatoriedade VIVO1 e VIVO2.', slotSource(28), 'DOCUMENTADO'],
  ['R06', 'Dominio nao e constante', 'Datas, IDs, documentos, contatos, tecnologias e valores de exemplo nao sao defaults universais.', woSource(15), 'CRITERIO'],
  ['R07', 'Janela slots', 'Inicio/fim requeridos sem algoritmo FTAT-933 fechado. PDF minLeadDays/maxDaysAhead pertence a venda.', pdf(19), 'PENDENTE'],
  ['R08', 'Consulta massiva datas', 'startDate omitido assume hoje-180 dias; endDate omitido assume agora, conforme mapping do MS.', source('MASSIVA', 'Camunda x MS Request', 'E10;E11'), 'DOCUMENTADO'],
  ['R09', 'Revalidar escolha', 'US07 exige revalidacao WFM apos escolha. BPMN valida apenas contra lista anterior e chama criacao.', story(7, 58), 'LACUNA BPMN'],
  ['R10', '36 caracteristicas BD', 'Nome Sim; value Nao. relatedEntity/relatedParty/characteristic opcionais com filhos obrigatorios quando presentes; cardinalidades conflitantes.', bdSource(53), 'CONFLITO'],
  ['R11', 'Obrigatoriedade downstream', 'Campos opcionais Camunda->MS podem ser exigidos internamente TMF629/TMF621. Definir enriquecimento no MS; nao transferir automaticamente ao VE.', source('BD', 'MS Trouble Ticket x SN(629) Req', 'D11;H11;D15;H15;D19;H19'), 'PENDENTE'],
  ['R12', 'Correlacao HPSD', 'OpenAPI UUID v4 obrigatorio no POST e eco no callback; mapping usa CID/TID por timestamp e papeis ambiguos.', source('HPSD', 'Camunda x HPSD - Request', 'E6;K6;E7;K7;E13'), 'CONFLITO'],
  ['R13', 'Resultado e percepcao', 'ID06/07/10 HPSD conduzem a reinicio e confirmacao humana; ID09 a energia. Nao encerrar apenas pelo aceite HTTP.', story(12, 45), 'DOCUMENTADO'],
  ['R14', 'IDs WFM', 'idWorkOrder, idWorkOrderItem e idWork retornados; equivalencia idWork=idAppointment nao comprovada.', source('WO', 'CAMUNDA X WFM Journey RESP OK', 'D7;D8;D9'), 'PENDENTE'],
  ['R15', 'Payload diagnostico', 'BD exemplifica evento; implementacao manda resumo. Definir formato, campos e ausencia por timeout.', source('BD', bdSheet.name, 'K122;K123'), 'CONFLITO'],
  ['R16', 'Dados estruturais', 'Agrupadores, nomes de caracteristicas, @type e referencias sao montagem de payload, nao novas perguntas ao usuario.', woSource(10), 'CRITERIO'],
  ['R17', 'SourceSystem WO', 'SERVICENOWB2BMASSIVO no mapping; MVE atual no BPMN deve ser conciliado.', woSource(11), 'DIVERGENCIA'],
  ['R18', 'Antecipacao', 'Boolean VE versus String WFM na tabela. Obrigatorio enviar flag nao significa consentimento true.', source('WO', 'VE x Camunda - Request', 'F19;H19;K19'), 'CONFLITO'],
  ['R19', 'Data agendamento', 'Descricao YYYY-MM-DD e exemplo timestamp no mesmo mapping. BPMN ignora form_dataVisita na selecao; alinhar data e slot.', source('WO', 'VE x Camunda - Request', 'E20;K20;B34'), 'CONFLITO'],
  ['R20', 'UF e contato WFM', 'Dossie de 18/11 registra UF sigla e Attendant divergente de PDF/VE mapping; conferir exemplos oficiais sem usar dados de teste como origem.', { file: 'Analise/dossie-integracoes-bd-ve.html', sheet: 'P08 / QA-BPMN-15', cell: '#pendencia-critica' }, 'PENDENTE'],
  ['R21', 'Retry BD', 'Ate tres tentativas totais e decisao do cliente; depois cancelar WO. Nao confundir com tres erros de agendamento do PDF venda.', story(10, 92), 'DOCUMENTADO'],
  ['R22', 'Nome/numero/protocolo BD', 'ID tecnico, externalIdentifier.id (numero SN) e protocolo de atendimento sao conceitos distintos ate equivalencia formal.', dft(10), 'PENDENTE'],
  ['R23', 'Escopo PDF', 'Referencia de venda/aceite/instalacao: nao importar getProposal, Clicksign, contato futuro e regras SFA para FTAT-933 sem confirmacao.', pdf(2), 'CRITERIO'],
  ['R24', 'Config e seguranca', 'URLs, timeouts e credenciais sao configuracao/seguranca. Sem chamadas mutaveis a ambientes nesta analise.', dft(9), 'CRITERIO'],
  ['R25', 'Especificacao HPSD', 'Nome do teste, ID da especificacao e sistema de origem requerem dominio aprovado; exemplos nao comprovam constancia.', source('HPSD', 'Camunda x HPSD - Request', 'D9;D13;D21;B28'), 'PENDENTE'],
];
const contracts = [];
for (const file of ['Trouble Ticket Management-V1.1.0.json', 'Gtw Redes Service Test Management-V1.0.0-API.json', 'customer-problem-management-v1.preprod.openapi.yaml']) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  const spec = file.endsWith('.yaml') ? YAML.parse(raw) : JSON.parse(raw);
  const deref = value => value?.$ref?.startsWith('#/') ? value.$ref.slice(2).split('/').reduce((result, part) => result?.[part.replaceAll('~1', '/').replaceAll('~0', '~')], spec) : value;
  for (const [route, methods] of Object.entries(spec.paths ?? {})) for (const [method, operation] of Object.entries(methods)) {
    if (!/^(get|post|patch|delete|put)$/.test(method)) continue;
    for (const entry of [...(methods.parameters ?? []), ...(operation.parameters ?? [])]) {
      const parameter = deref(entry);
      contracts.push({ file, location: `${method.toUpperCase()} ${route}`, field: parameter.name, kind: parameter.in,
        required: parameter.required ? 'Sim' : 'Nao declarado / opcional', type: JSON.stringify(parameter.schema ?? {}), description: parameter.description ?? '', pointer: `/paths/${route}/${method}/parameters` });
    }
  }
  function walk(value, pointer) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.required)) for (const name of value.required) contracts.push({ file, location: pointer, field: name,
      kind: 'required de schema; nao origem VE', required: 'Sim no objeto/schema', type: JSON.stringify(value.properties?.[name] ?? {}),
      description: value.properties?.[name]?.description ?? '', pointer: `${pointer}/required` });
    for (const [name, child] of Object.entries(value)) if (name !== 'example' && name !== 'examples') walk(child, `${pointer}/${name}`);
  }
  walk(spec.components ?? {}, '/components');
}
const workbook = new ExcelJS.Workbook();
workbook.creator = 'Analise FTAT-933';
workbook.created = new Date();
workbook.description = 'Variaveis e origens documentais; START atual somente para comparacao. Sem dados de credenciais.';
function sheet(name, headers, rows, widths = {}) {
  const tab = workbook.addWorksheet(name, { views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
    properties: { defaultRowHeight: 34 }, pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  tab.columns = headers.map(([key, title]) => ({ key, header: title, width: widths[key] ?? (/rule|why|description|text|refs/.test(key) ? 70 : 25) }));
  rows.forEach(row => {
    const excelRow = tab.addRow(row);
    const maxLength = Math.max(...headers.map(([key]) => clean(typeof row[key] === 'object' ? row[key]?.text : row[key]).length));
    excelRow.height = Math.min(180, Math.max(34, Math.ceil(maxLength / 70) * 15));
    excelRow.eachCell(cell => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { name: 'Calibri', size: 10, ...(cell.value?.hyperlink ? { color: { argb: 'FF0563C1' }, underline: true } : {}) };
      if (excelRow.number % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F6F5' } };
    });
    for (const cell of ['status', 'action']) {
      const index = headers.findIndex(([key]) => key === cell);
      if (index >= 0 && /NAO IDENTIFICADA|CONFLITO|PENDENTE|AJUSTAR/.test(clean(row[cell]))) excelRow.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE2BE' } };
    }
  });
  tab.getRow(1).height = 38;
  tab.getRow(1).eachCell(cell => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E48' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  tab.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(rows.length + 1, 1), column: headers.length } };
  return tab;
}
const mainHeaders = [['id','ID'],['name','Variavel / dado logico'],['origin','Origem proposta'],['status','Origem mapeada?'],['start','Informar no inicio?'],
  ['moment','Momento de obtencao'],['required','Obrigatoriedade / condicao'],['fixed','Pode ser fixo?'],['upstream','Caminho canonico asset documentado'],['rule','Regra / calculo / lacuna'],
  ['destination','Destino / consumidor'],['aliases','Alias atual (nao requisito)'],['nodes','Nos BPMN observados'],['file','Documento principal'],['tab','Aba / secao'],['location','Celula / pagina / paragrafo'],['hyperlink','Link fonte'],['refs','Demais evidencias']];
const catalogRows = catalog.map(item => ({ ...item, aliases: item.aliases.join(', '), nodes: [...new Set(item.occurrences?.map(occ => occ.node) ?? [])].join(', '),
  file: item.refs[0]?.file, tab: item.refs[0]?.sheet, location: item.refs[0]?.cell,
  hyperlink: link(item.refs[0].file, 'Abrir fonte principal', item.refs[0].sheet, item.refs[0].cell), refs: referenceText(item.refs) }));
sheet('01_Mapa_variaveis', mainHeaders, catalogRows, { id: 12, name: 35, rule: 90, refs: 90, start: 48, aliases: 38, file: 58, location: 36 });
sheet('02_Comparacao_atual', [['name','Entrada atual / proposta'],['obligation','Situacao atual documentada'],['consumed','Consumida no BPMN?'],['target','Dado-alvo / ID mapa'],
  ['status','Status de evidencia'],['action','Acao recomendada'],['why','Motivo / ajuste necessario'],['nodes','Consumidores'],['evidence','Limite da comparacao'],['refs','Fontes'],['hyperlink','Link']],
  comparisons.map(item => ({ ...item, refs: referenceText(item.refs), hyperlink: item.refs[0] ? link(item.refs[0].file, 'Abrir evidencia', item.refs[0].sheet, item.refs[0].cell) : '' })),
  { name: 35, obligation: 50, target: 45, action: 45, why: 95 });
const startRows = catalogRows.filter(item => item.start.startsWith('Sim') || /Pendente/.test(item.start));
sheet('03_Entradas_inicio', mainHeaders, startRows, { name: 35, start: 50, rule: 95, file: 55, refs: 90 });
sheet('04_Campos_datamapping', [['id','ID evidencia'],['scope','Fronteira / escopo'],['direction','Sentido'],['file','Documento'],['sheet','Aba'],['row','Linha'],
  ['group','Grupo'],['field','Campo'],['description','Descricao original'],['type','Tipo original'],['size','Tamanho'],['required','Obrigatoriedade original'],['min','Min'],['max','Max'],
  ['domain','Dominio / mascara original (nao constante)'],['notes','Notas / colunas adicionais'],['classification','Classificacao de origem'],['variable','Variavel relacionada'],['start','Inicio?'],['status','Status'],['hyperlink','Link documento e celula']],
  mappings.map(item => ({ ...item, hyperlink: link(item.file, `${item.sheet}!D${item.row}`, item.sheet, `D${item.row}`) })),
  { file: 55, sheet: 40, group: 65, field: 38, domain: 85, notes: 70, start: 45 });
sheet('05_Payloads_exemplos', [['file','Documento'],['sheet','Aba'],['cell','Celula original'],['part','Parte'],['scope','Uso da evidencia'],['text','Payload / exemplo original'],['hyperlink','Link']],
  payloads.map(item => ({ ...item, hyperlink: link(item.file, 'Abrir celula', item.sheet, item.cell) })), { file: 55, sheet: 42, text: 140 });
sheet('06_BPMN_leituras_escritas', [['variable','Variavel tecnica'],['operation','Operacao'],['node','No / produtor / consumidor'],['name','Nome no BPMN'],['line','Linha inicial do no / binding'],['expression','Expressao / acesso'],['hyperlink','Fonte']],
  occurrences.map(item => ({ ...item, hyperlink: link(item.node === 'screens.json' ? screenFile : bpmnFile, 'Abrir artefato') })), { variable: 46, node: 44, expression: 90, name: 50 });
sheet('07_Regras_pendencias', [['id','ID'],['name','Assunto'],['rule','Regra / decisao necessaria'],['status','Status'],['file','Fonte'],['location','Localizacao'],['hyperlink','Link']],
  rules.map(([id,name,rule,ref,status]) => ({ id,name,rule,status,file: ref.file,location: `${ref.sheet} | ${ref.cell}`,hyperlink: link(ref.file,'Abrir fonte',ref.sheet,ref.cell) })), { rule: 110, file: 60, location: 70 });
sheet('08_Contratos_OpenAPI', [['file','Contrato'],['location','Operacao / schema'],['field','Campo'],['kind','Posicao / natureza'],['required','Obrigatoriedade'],['type','Schema / formato'],['description','Descricao original'],['pointer','Localizador JSON'],['hyperlink','Link']],
  contracts.map(item => ({ ...item, hyperlink: link(item.file,'Abrir contrato') })), { file: 55, location: 75, description: 95, type: 70 });
const docsRows = [];
for (const doc of evidence.documents) for (const section of doc.paragraphs ?? doc.slides) docsRows.push({ file: doc.file,
  kind: doc.paragraphs ? 'Historia de usuario original' : 'DFT original', location: doc.paragraphs ? `Paragrafo ${section.paragraph}` : `Slide ${section.slide}`, text: section.text });
for (const doc of evidence.pdf) for (const page of doc.pages) docsRows.push({ file: doc.file, kind: 'Referencia correlata; venda/instalacao', location: `Pagina ${page.page}`, text: page.text });
sheet('09_Historias_DFT_PDF', [['file','Documento'],['kind','Natureza / escopo'],['location','Paragrafo / slide / pagina'],['text','Texto extraido; imagens embutidas nao abrangidas'],['hyperlink','Link']],
  docsRows.map(item => ({ ...item, text: item.text.slice(0,32000), hyperlink: link(item.file,'Abrir documento') })), { file: 75, text: 140, kind: 42, location: 32 });
const architecture = 'https://wikicorp.telefonica.com.br/spaces/ADS/pages/784061401';
const extraSources = [
  [assetUrl, 'DM remoto Customer Asset Information V2, acessado nesta analise', '2.1.1 Request e 2.1.3 Response', 'Caminhos provedor->canonico documentados; envelope VE->Journey, DE/PARA de rede e bloqueio financeiro ainda pendentes. Nao copiado curl com credencial.'],
  [architecture, 'DATI 2.0 v1.3, pagina acessada nesta analise', 'Jornada 4 / Jornada 5.2 / secao 6 / Data Mapping', 'Consulta assets pelo VE; MS Trouble Ticket orquestra TMF629+TMF621; Kafka HPSD. Nao comprova caminhos de todos os campos.'],
  ['https://wikicorp.telefonica.com.br/spaces/ADS/pages/740224312', 'DAS referenciado pelo DATI', 'Jornadas 4 e 5.2', 'Referencia arquitetural complementar; ver registro de acesso.'],
  ['https://br.leanix.net/TelefonicaBrasilProduction/diagrams/freedraw/c2ce3d0c-cd26-4bc1-9c4c-efcd58c55976', 'LeanIX APP referenciado pelo DATI', 'Diagrama Jornada 5.2', 'Link identificado; desenho interativo nao verificado.'],
  ['figma/resumo-telas.md', 'Export Figma local', 'IDs de nodes e textos', 'Telas de escolha/reinicio/energia/antecipacao; nao define dominio tecnico de API.'],
  ['Workflow FTAT-933.png', 'Workflow original visualizado', 'Notas e fluxo integral', 'Designadores distintos, TT_B fixo, ID WO pelo Journey, respostas usuario e retry.'],
  ['Analise/dossie-abertura-bd-ve.html', 'Analise secundaria preexistente', 'Fontes/contexto/contratos/questoes', 'Contem trechos historicamente desatualizados: conferir fontes primarias.'],
  ['Analise/dossie-integracoes-bd-ve.html', 'Analise secundaria preexistente', '#pendencia-critica; P08; QA-BPMN-15', 'Pendencias de origem e divergencias WO registradas em 18/11; evidencias de ambiente citadas, nao reexecutadas.'],
];
const inventory = [...books.map(book => ({ file: book.file, kind: 'Data mapping original', coverage: `${book.sheets.length} abas; todas extraidas inclusive OLD`, limit: 'Imagens/comentarios de celula nao extraidos; colunas e exemplos preservados', status:'LIDO' })),
  ...evidence.documents.map(doc => ({ file:doc.file,kind:doc.paragraphs?'Historia original':'DFT original',coverage: `${(doc.paragraphs ?? doc.slides).length} paragrafos nao vazios / slides`, limit:'Texto extraido; imagens embutidas nao abrangidas',status:'LIDO TEXTO' })),
  ...evidence.pdf.map(doc=>({file:doc.file,kind:'PDF correlato',coverage:`${doc.pages.length} paginas`,limit:'Venda/instalacao, nao contrato automaticamente aplicavel FTAT-933; imagens embutidas nao abrangidas',status:'LIDO TEXTO'})),
  ...extraSources.map(([file,kind,coverage,limit])=>({file,kind,coverage,limit,status:file.includes('leanix')?'LINK IDENTIFICADO':file.includes('740224312')?'REFERENCIADO':'LIDO'})),
  ...['Trouble Ticket Management-V1.1.0.json','Gtw Redes Service Test Management-V1.0.0-API.json','customer-problem-management-v1.preprod.openapi.yaml',bpmnFile,screenFile].map(file=>({file,kind:'Contrato / implementacao',coverage:'Campos / schemas / produtores e consumidores',limit:'Implementacao nao substitui requisito de origem',status:'LIDO'}))];
sheet('10_Fontes_cobertura', [['file','Fonte'],['kind','Tipo'],['status','Cobertura'],['coverage','Localizacao / escopo'],['limit','Limites e ressalvas'],['hash','SHA-256 local'],['hyperlink','Link']],
  inventory.map(item=>({...item,hash:/^http/.test(item.file)?'Pagina remota; sem snapshot integral':crypto.createHash('sha256').update(fs.readFileSync(path.join(root,item.file))).digest('hex'),hyperlink:link(item.file,'Abrir fonte')})),{file:80,coverage:70,limit:95,hash:70});
sheet('11_Leia_me', [['topic','Assunto'],['text','Orientacao']], [
  {topic:'Objetivo',text:'Descobrir entradas necessarias pelas fontes, nao pela configuracao START existente; distinguir origem, obrigatoriedade e momento.'},
  {topic:'Ordem das abas',text:'1 catalogo logico; 2 comparacao atual; 3 recorte inicio; 4 linhas originais mappings; 5 payloads; 6 ocorrencias BPMN; 7 regras; 8 OpenAPI; 9 historias/DFT/PDF; 10 fontes.'},
  {topic:'Entrada confirmada',text:'Sim com status IDENTIFICADA e fonte primaria. PARCIAL/CONFLITO/NAO IDENTIFICADA nao sao aprovacao de contrato. Cabecalho/metadado nao e variavel de negocio.'},
  {topic:'Linhas e contagens',text:'Uma linha do catalogo representa um dado logico ou alias tecnico. Nao somar todas como variaveis independentes: ha reuso entre contexto e campos BD. A aba 04 tem agrupadores e repeticoes por fronteira.'},
  {topic:'Comparacao atual',text:'Baseline extraida do documentation Node_Start no BPMN local, nao da configuracao publicada no registry. Nao houve consulta ou alteracao de ambiente.'},
  {topic:'PDF e OLD',text:'OLD e historico. PDF trata venda/instalacao. Nenhum dos dois prevalece automaticamente sobre contratos FTAT-933.'},
  {topic:'Links',text:'Links relativos partem desta pasta, mantendo xlsx e documentos dentro de Fenix-VE. Fragmentos de aba/celula dependem do aplicativo Excel. Colunas de localizacao permitem navegacao manual.'},
  {topic:'Seguranca',text:'Arquivo postman/token e valores de Authorization de collections/curls excluidos. Planilha contem exemplos documentais, nao valores produtivos nem credenciais.'},
  {topic:'Atualizacao',text:'Ler README.md desta pasta. Reextrair fontes, revisar regras curadas, gerar, validar; nao sobrescrever decisoes manuais sem conciliar.'},
  {topic:'Dados pessoais',text:'Exemplos originais podem conter nomes, documentos, telefones/endereco ilustrativos. Material interno; nao publicar externamente.'},
],{topic:32,text:140});
sheet('12_Asset_origem_caminhos', [['name','Dado logico'],['upstream','Caminho provedor'],['canonical','Caminho canonico documentado'],['note','Ressalva / transformacao pendente'],['hyperlink','Fonte primaria remota']],
  assetMappings.map(([name,upstream,canonical,note])=>({name,upstream,canonical,note,hyperlink:link(assetUrl,'DM Asset secao 2.1.3')})),
  {name:35,upstream:85,canonical:100,note:100});
async function main() {
  const output = path.join(__dirname,'fenix-ve-mapa-variaveis.xlsx');
  await workbook.xlsx.writeFile(output);
  const reread = new ExcelJS.Workbook();
  await reread.xlsx.readFile(output);
  assert.equal(reread.worksheets[1].name,'02_Comparacao_atual');
  assert.equal(books.length,7);
  assert.equal(books.reduce((total,book)=>total+book.sheets.length,0),35);
  assert.equal(evidence.documents.filter(doc=>doc.paragraphs).length,13);
  assert.equal(evidence.pdf[0].pages.length,80);
  assert.equal(mappings.length,new Set(mappings.map(item=>`${item.file}|${item.sheet}|${item.row}`)).size);
  for (const item of catalog) { assert(item.refs.length); assert(item.status); assert(item.start); }
  for (const tab of reread.worksheets) tab.eachRow(row=>row.eachCell(cell=>{
    assert(!cell.value?.formula,'Formulas nao esperadas');
    assert(clean(cell.value?.text ?? cell.value).length<=32767,`Celula longa ${tab.name}!${cell.address}`);
    if(cell.value?.hyperlink && !/^https?:/.test(cell.value.hyperlink)) {
      const target=cell.value.hyperlink.split('#')[0];
      assert(fs.existsSync(path.resolve(__dirname,target)),`Link quebrado ${target}`);
    }
  }));
  const summary={output:path.relative(root,output),generatedAt:new Date().toISOString(),catalog:catalog.length,comparison:comparisons.length,
    startCandidates:startRows.length,mappingRows:mappings.length,payloads:payloads.length,occurrences:occurrences.length,
    contracts:contracts.length,documentSections:docsRows.length,sheets:reread.worksheets.map(tab=>({name:tab.name,rows:tab.rowCount-1})),
    statusCounts:Object.fromEntries([...new Set(catalog.map(item=>item.status))].map(status=>[status,catalog.filter(item=>item.status===status).length])),
    validation:'PASS: roundtrip XLSX, segunda aba, cobertura fontes, unicidade de evidencias, links locais, ausencia formulas e limites Excel'};
  fs.writeFileSync(path.join(__dirname,'resultado-validacao.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}
main().catch(error=>{console.error(error);global.process.exitCode=1;});