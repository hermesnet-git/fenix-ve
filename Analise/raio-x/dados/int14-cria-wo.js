/*
 * Raio-X · INT14 Cria WO e agendamento
 * Comparação: BPMN (o que roda) × fontes. Levantamento de 20/11/2026.
 * Mesmas regras de int01-consulta-massiva.js (lista de campos, `linha`, `r`, `acao`).
 * `valor` diz de onde o BPMN tira cada dado. data_* sem setVariable no BPMN = START (lista no startEvent).
 * DM: a tabela da aba REQUEST só detalha 25 linhas; o resto do body aparece apenas no exemplo da mesma aba.
 */
RAIOX.registrar({
  "id": "INT14",
  "ordem": 7,
  "nome": "Cria WO e agendamento",
  "nomeLongo": "Criação da Work Order e agendamento da visita técnica no WFM",
  "rota": "Elastic Journey → WFM Orchestration (wfm-journey-orchestration-v1) → TMF697 (WO) + TMF646 (Appointment)",
  "endpoint": "POST ${FENIX_VE_WFM_BASE_URL}/workOrder/appointment",
  "nos": "Node_RegistraHorario · Node_CriaWO · Node_TrataWO · Node_DecWOCriada · Node_DecWOIdentificadaFalha · Node_AgendamentoNaoRealizado",
  "resumo": "Depois que o cliente escolhe o horário, a jornada gera o ID da WO (VE+UUID) e pede ao WFM a WO e o agendamento numa chamada só. Quase todo o body vem do START (data_wo_*, data_wfm*); o horário vem do slot da INT11.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias (US)",
      "curto": "US",
      "contrato": false,
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/",
      "detalhe": "US08 Geração e criação de WO (ID da WO, slot escolhido, sucesso) · US09 Visita não agendada (falha, tela e cancelamento) · US10/US11 Req01 (agendamento ok → abrir BD) · US07 (escolha do dia e horário)"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 7 (passo a passo INT13–INT15) e slide 14 (inventário INT13–INT15)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.2",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Abas VE x Camunda - Request/Response · Camunda x WFM Journey REQUEST · RESP OK · RESP ERRO v1/v2 (Request_OLD só como histórico)",
      "arquivo": "PreDataMapping FTAT-933 - Abertura de WO e agendamento - v2.2.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Pasta 04, item \"INT14 - Cria WO e agendamento (WFM POST /workOrder/appointment)\", sem resposta salva (usei descrição, pré-script e teste). Tela: pasta 03, item \"11 - Node_EscolheHorario | Confirmar agendamento\"."
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "postman/curls/INT14.sh",
      "detalhe": "Só a requisição, sem resposta. Host esteira2.oss.vivo.com.br. O body copia o exemplo do DM, não o BPMN (sourceSystem, Attendant, CRM_NOTES, produtos). INT08.sh é o mesmo POST, idêntico byte a byte exceto pelo Bearer vazio."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT14' (montar/avaliar), PADROES_INT14, horarioParaInt14/padroesHorarioSimulado, atualizarCampoCorpoInt14, contextoDaIntegracao e campos do grupo int14"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → WFM Orchestration: endpoint, headers e WorkOrder_Create"
    },
    {
      "id": "agendamento",
      "nome": "Agendamento",
      "sub": "Camunda → WFM Orchestration: Appointment_Create"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "WFM Orchestration → Camunda (200 e erro)"
    },
    {
      "id": "fluxo",
      "nome": "Decisões",
      "sub": "Horário válido, WO criada, cancelar, tela de falha"
    },
    {
      "id": "tela",
      "nome": "Tela de horário",
      "sub": "VE → Camunda: /advance da escolha do horário (aba VE x Camunda)"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_CriaWO · DM REQUEST · DFT inventário · US08",
      "bpmn": "POST ${FENIX_VE_WFM_BASE_URL}/workOrder/appointment",
      "valor": {
        "t": "config",
        "de": "env FENIX_VE_WFM_BASE_URL + path fixo"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01, US10 Req01 e US11: chamar o WFM \"via camada de Integração 'wfm-journey-orchestration-v1'\" (DM \"Abertura de WO e agendamento\") · US09 Req01 Ações escreve \"'ms- wfm-journey-orchestration-v1'\"",
          "r": "parcial"
        },
        "DFT": {
          "v": "INT14 POST /createWorkOrder · endpoint TBD · rota WFM Orchestration",
          "r": "diverge"
        },
        "DM": {
          "v": "Aba REQUEST: POST /workOrder/appointment. Abas de resposta: POST /createWorkOrderAndAppointment",
          "r": "parcial"
        },
        "PM": {
          "v": "POST {{wfm_base_url}}/workOrder/appointment · host http://preprod.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1",
          "r": "igual"
        },
        "CURL": {
          "v": "POST http://esteira2.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1/workOrder/appointment",
          "r": "igual"
        },
        "QA": {
          "v": "POST {wfmBaseUrl}/workOrder/appointment",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 12
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 12
        }
      ],
      "leitura": "O BPMN segue a aba REQUEST do DM. O DFT e as abas de resposta do DM usam outros nomes de rota. O Postman aponta para preprod.oss.vivo.com.br e o curl (INT14 e INT08) para esteira2.oss.vivo.com.br, ambos em http.",
      "acao": "fonte",
      "acaoTexto": "Unificar o nome da rota no DFT e nas abas de resposta do DM."
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQUEST",
      "bpmn": "Bearer do usuário (_authorizationHeader), só se existir. sendToken = false.",
      "valor": {
        "t": "config",
        "de": "Bearer do /advance (Node_Inicio) → _authorizationHeader"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Baerer {{token}}\" (JWT). Erro de exemplo: 401 Jwt is expired",
          "r": "parcial"
        },
        "PM": {
          "v": "Bearer da collection (token VE, password grant), renovado no pré-script da collection",
          "r": "igual"
        },
        "CURL": {
          "v": "Authorization: Bearer <token> (espaço duplo após Bearer). No INT08.sh o Bearer vem vazio",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela; sem token a chamada é pulada",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 5
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O DM exige o token. O BPMN usa o Bearer do usuário e segue sem ele se faltar. O erro 401 de exemplo mostra que o WFM valida o JWT. O INT08.sh repete o mesmo POST com o Bearer vazio.",
      "acao": "decidir",
      "acaoTexto": "Definir se o token é do usuário ou sistêmico e tornar obrigatório."
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "flow",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQUEST",
      "bpmn": "B2B_MASSIVO (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'B2B_MASSIVO'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · B2B_MASSIVO",
          "r": "igual"
        },
        "PM": {
          "v": "flow: B2B_MASSIVO",
          "r": "igual"
        },
        "CURL": {
          "v": "flow: B2B_MASSIVO",
          "r": "igual"
        },
        "QA": {
          "v": "B2B_MASSIVO (fixo, WFM_HEADERS)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 6
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "requestSystem",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQUEST",
      "bpmn": "MVE (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'MVE'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · MVE / APPVIVO",
          "r": "igual"
        },
        "PM": {
          "v": "requestSystem: MVE",
          "r": "igual"
        },
        "CURL": {
          "v": "requestSystem: MVE",
          "r": "igual"
        },
        "QA": {
          "v": "MVE (fixo, WFM_HEADERS)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 7
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado. APPVIVO seria outro canal.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQUEST",
      "bpmn": "TID_ELJY_FTAT933INT007_<ISO agora, UTC>",
      "valor": {
        "t": "gerado",
        "de": "TID_ELJY_FTAT933INT007_ + data/hora UTC"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT007_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "igual"
        },
        "PM": {
          "v": "TID_ELJY_FTAT933INT007_{{$isoTimestamp}}",
          "r": "igual"
        },
        "CURL": {
          "v": "X-Vivo-Transaction-Id: 111 (valor de teste, fora do formato)",
          "r": "parcial"
        },
        "QA": {
          "v": "TID_ELJY_FTAT933INT007_<ISO agora, UTC> (helper tid)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 8
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Igual ao DM. O número INT007 não bate com a numeração do DFT (INT14), mas é o que o DM pede.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "data_correlationId, enviado se existir.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      },
      "fontes": {
        "DM": {
          "v": "Não consta na aba REQUEST (só na aba VE x Camunda: CID_VE_FTAT933INT008_…)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{correlationId}}; se vazio, o pré-script gera CID_VE_FTAT933_QA_<epoch>",
          "r": "igual"
        },
        "CURL": {
          "v": "X-Vivo-Correlation-Id: 222 (valor de teste)",
          "r": "parcial"
        },
        "QA": {
          "v": "correlationId do formulário; se vazio, CID_VE_FTAT933_QA_<epoch>",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 15
        }
      ],
      "leitura": "O BPMN repassa o correlationId da jornada. O contrato do WFM não lista esse header.",
      "acao": "fonte",
      "acaoTexto": "Incluir o X-Vivo-Correlation-Id na aba REQUEST do DM."
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "Accept e Content-Type",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "application/json (fixos)",
      "valor": {
        "t": "fixo",
        "de": "'application/json'"
      },
      "fontes": {
        "PM": {
          "v": "Accept e Content-Type: application/json",
          "r": "igual"
        },
        "CURL": {
          "v": "Só Content-Type: application/json; sem Accept",
          "r": "parcial"
        },
        "QA": {
          "v": "Accept e Content-Type: application/json",
          "r": "igual"
        }
      },
      "leitura": "Padrão HTTP. Nenhuma fonte cita.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "Conexão 3 s, resposta 10 s, 1 tentativa. Timeout/conexão cai no evento de falha técnica.",
      "valor": {
        "t": "fixo",
        "de": "connectTimeoutMs 3000 · responseTimeoutMs 10000 · maxAttempts 1"
      },
      "fontes": {
        "US": {
          "v": "US09 Req01: WO não criada → \"SDUI Elastic Journey informa ao BFF/VE ... que a criação da WO não foi bem-sucedida\" → cancelar → \"Fim do processo para o Elastic Journey\". Nenhuma US pede retentativa da WO nem define tempo",
          "r": "igual"
        },
        "DFT": {
          "v": "Coluna Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout de POST 30 s (os 10 s da spec só valem para GET); sem retentativa por ser escrita",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte define SLA. Sem retentativa: um timeout vira falha e dispara o cancelamento. A tela de QA espera até 30 s.",
      "acao": "decidir",
      "acaoTexto": "Confirmar SLA do WFM Orchestration (criar WO + agendamento pode passar de 10 s)."
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "WorkOrder_Create.@type",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "WorkOrder (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'WorkOrder'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · WorkOrder",
          "r": "igual"
        },
        "PM": {
          "v": "\"WorkOrder\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"WorkOrder\"",
          "r": "igual"
        },
        "QA": {
          "v": "\"WorkOrder\" (fixo)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 10
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "sourceSystem",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "MVE (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'MVE'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · SERVICENOWB2BMASSIVO (tabela e exemplo)",
          "r": "diverge"
        },
        "PM": {
          "v": "\"MVE\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"SERVICENOWB2BMASSIVO\"",
          "r": "diverge"
        },
        "QA": {
          "v": "SERVICENOWB2BMASSIVO (fixo, como DM e curl; conferido no teste int14-simulacao)",
          "r": "diverge"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 11
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O DM pede SERVICENOWB2BMASSIVO. O BPMN manda MVE, igual ao requestSystem. A tela de QA manda SERVICENOWB2BMASSIVO e a WO de 19/11 foi aceita com esse valor.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM qual sourceSystem vale para a jornada VE."
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "id da WO",
      "tipo": "string",
      "linha": "BPMN Node_RegistraHorario · US08 · DM REQUEST (observação)",
      "bpmn": "'VE' + UUID (38 caracteres), gerado ao registrar o horário válido → data_woIdJornada.",
      "valor": {
        "t": "gerado",
        "de": "Node_RegistraHorario: 'VE' + UUID → data_woIdJornada"
      },
      "fontes": {
        "US": {
          "v": "US08 Workflow e Req01 Ações: \"Elastic Journey deve gerar o ID do WO para usar a frente no fluxo sistêmico\" · repetido em US09 Pré-condições e no Workflow da US10/US11",
          "r": "igual"
        },
        "DM": {
          "v": "Obrigatório · ex.: SFTWO24583286 · obs.: \"JOUNEY GERA VE+UUID. AVALIAR SENAO ULTRAPASSA 50 CARACTERES\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{woIdJornada}}; se vazio, o pré-script gera 'VE' + {{$guid}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"AL_WO20261021_1100\" (id de teste, fora do formato VE+UUID)",
          "r": "parcial"
        },
        "QA": {
          "v": "\"VE\" + UUID gerado na montagem; o corpo inteiro pode ser substituído por wfmCorpoInt14",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 12
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Segue a observação do DM. VE + UUID tem 38 caracteres, dentro do limite de 50. O exemplo do DM ainda mostra o formato antigo (SFTWO…).",
      "acao": "fonte",
      "acaoTexto": "Trocar o exemplo do DM por VE+UUID e registrar o tamanho máximo."
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "relatedParty (lista)",
      "tipo": "lista",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "Sempre 3 itens: CustomerValue, CustomerOrderValue, WorkOrderPendency.",
      "valor": {
        "t": "fixo",
        "de": "estrutura fixa no bodyTemplate"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório 1..N · CustomerValue; CustomerOrderValue; WorkOrderPendency",
          "r": "igual"
        },
        "PM": {
          "v": "3 itens: CustomerValue, CustomerOrderValue, WorkOrderPendency",
          "r": "igual"
        },
        "CURL": {
          "v": "3 itens: CustomerValue, CustomerOrderValue, WorkOrderPendency",
          "r": "igual"
        },
        "QA": {
          "v": "3 itens: CustomerValue, CustomerOrderValue, WorkOrderPendency",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 13
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Estrutura alinhada. Os filhos só aparecem no exemplo do DM, sem obrigatoriedade.",
      "acao": "fonte",
      "acaoTexto": "Detalhar no DM os filhos de relatedParty (obrigatoriedade e domínio)."
    },
    {
      "id": "R13",
      "grupo": "request",
      "nome": "CustomerValue.category",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('customerCategory')",
      "valor": {
        "t": "start",
        "de": "START wo_customerCategory → data_wo_customerCategory"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"ONE\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woCustomerCategory}} (vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"ONE\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_customerCategory; vazio → PADROES_INT14 \"ONE\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. Documentação do Node_CriaWO marca a categoria como pendente de origem. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir de onde sai a categoria do cliente (Asset? CRM?)."
    },
    {
      "id": "R14",
      "grupo": "request",
      "nome": "CustomerValue.documentNumber",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo · US08",
      "bpmn": "wo('documentNumber')",
      "valor": {
        "t": "start",
        "de": "START wo_documentNumber → data_wo_documentNumber"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"CNPJ\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Só no exemplo: 00000000000000 (CNPJ, só dígitos)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woDocumentNumber}} (vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "<documento> (CNPJ, 14 dígitos, sem máscara)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_documentNumber do formulário ou da Asset (INT00, partyCharacteristic documentNumber); null se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. Nenhuma fonte fixa a máscara; o exemplo usa só dígitos. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "fonte",
      "acaoTexto": "Registrar no DM a máscara do CNPJ."
    },
    {
      "id": "R15",
      "grupo": "request",
      "nome": "CustomerValue.id",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('customerId')",
      "valor": {
        "t": "start",
        "de": "START wo_customerId → data_wo_customerId"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: 001Ot000t6ChyIAEFG (id Salesforce)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woCustomerId}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"001Ot000t6ChyIAEFG\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_customerId do formulário ou da Asset (INT00, partyOrPartyRole.id); null se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. O exemplo é um id de conta Salesforce. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R16",
      "grupo": "request",
      "nome": "CustomerValue.name",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('customerName')",
      "valor": {
        "t": "start",
        "de": "START wo_customerName → data_wo_customerName"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"PANIFICADORA SUPERPAO\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woCustomerName}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"PANIFICADORA SUPERPAO\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_customerName do formulário ou da Asset (INT00, partyOrPartyRole.name); null se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R17",
      "grupo": "request",
      "nome": "contactMedium.name",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('contactName')",
      "valor": {
        "t": "start",
        "de": "START wo_contactName → data_wo_contactName"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"João da Silva\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woContactName}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"João da Silva\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_contactName; vazio → PADROES_INT14 (<nome> do curl)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A documentação do Node_CriaWO marca o contato como pendente de origem. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir quem fornece o contato (canal ou Asset)."
    },
    {
      "id": "R18",
      "grupo": "request",
      "nome": "contactMedium: emailAddress, mobileNumber, phoneNumber, workNumber",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('emailAddress'), wo('mobileNumber'), wo('phoneNumber'), wo('workNumber')",
      "valor": {
        "t": "start",
        "de": "START wo_emailAddress, wo_mobileNumber, wo_phoneNumber, wo_workNumber → data_wo_*"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: e-mail, 11920001000, 1120001000, 1130002000 (DDD + número, sem máscara)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woEmailAddress}}, {{woMobileNumber}}, {{woPhoneNumber}}, {{woWorkNumber}}",
          "r": "igual"
        },
        "CURL": {
          "v": "<email>, <telefone> ×3 (DDD + número, sem máscara)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_emailAddress e os 3 telefones; vazios → PADROES_INT14 (<email> e <telefone> do curl)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Quatro entradas do START, sem obrigatoriedade definida. Vazio vai como \"\". A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir quais contatos são obrigatórios para o WFM."
    },
    {
      "id": "R19",
      "grupo": "request",
      "nome": "CustomerOrderValue.dateOfSale",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('dateOfSale')",
      "valor": {
        "t": "start",
        "de": "START wo_dateOfSale → data_wo_dateOfSale"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: 2025-10-30T23:35:14.000Z",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woDateOfSale}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"2025-10-30T23:35:14.000Z\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_dateOfSale; vazio → PADROES_INT14 2025-10-30T23:35:14.000Z",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O bloco de pedido vem de um fluxo de venda. Num BD de defeito não há venda; o BPMN marca o pedido como pendente. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se CustomerOrderValue é exigido em defeito e de onde sai."
    },
    {
      "id": "R20",
      "grupo": "request",
      "nome": "CustomerOrderValue.id",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('orderId')",
      "valor": {
        "t": "start",
        "de": "START wo_orderId → data_wo_orderId"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: 500W400000lPdj3IAC",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woOrderId}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"500W400000lPdj3IAC\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_orderId; vazio → PADROES_INT14 500W400000lPdj3IAC",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Mesma dúvida de R19. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Ver R19."
    },
    {
      "id": "R21",
      "grupo": "request",
      "nome": "CustomerOrderValue.orderProtocol",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('orderProtocol')",
      "valor": {
        "t": "start",
        "de": "START wo_orderProtocol → data_wo_orderProtocol"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: 31072026-8572624",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woOrderProtocol}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"31072026-8572624\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_orderProtocol; vazio → PADROES_INT14 31072026-8572624",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Mesma dúvida de R19. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Ver R19."
    },
    {
      "id": "R22",
      "grupo": "request",
      "nome": "CustomerOrderValue.characteristic Detail",
      "tipo": "Characteristic",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "Detail = wo('orderDetail'). Sai da lista só se nulo; vazio vai como \"\".",
      "valor": {
        "t": "start",
        "de": "START wo_orderDetail → data_wo_orderDetail"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"REDE SATURADA;SA-1004\"",
          "r": "parcial"
        },
        "PM": {
          "v": "Detail = {{woOrderDetail}}; sempre na lista (vazio vai \"\")",
          "r": "igual"
        },
        "CURL": {
          "v": "Detail = \"REDE SATURADA;SA-1004\"",
          "r": "igual"
        },
        "QA": {
          "v": "Detail = wo_orderDetail; vazio → PADROES_INT14 \"REDE SATURADA;SA-1004\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O exemplo parece de pendência de rede, não de defeito. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Ver R19."
    },
    {
      "id": "R23",
      "grupo": "request",
      "nome": "WorkOrderPendency.context",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "TRIAGEM (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'TRIAGEM'"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"TRIAGEM\"",
          "r": "igual"
        },
        "PM": {
          "v": "\"TRIAGEM\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"TRIAGEM\"",
          "r": "igual"
        },
        "QA": {
          "v": "\"TRIAGEM\" (fixo)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Copiado do exemplo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R24",
      "grupo": "request",
      "nome": "workOrderItem.id",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "id da WO + ':1' (ex.: VE<uuid>:1). Lista com 1 item, @type WorkOrderItem.",
      "valor": {
        "t": "gerado",
        "de": "data_woIdJornada + ':1'"
      },
      "fontes": {
        "DM": {
          "v": "Item obrigatório 1..N. Exemplo: SFTWO24583286:SFTWOI24583286",
          "r": "parcial"
        },
        "PM": {
          "v": "\"{{woIdJornada}}:1\", 1 item WorkOrderItem",
          "r": "igual"
        },
        "CURL": {
          "v": "\"AL_WO20261021_1100:1\" (formato WO:1)",
          "r": "igual"
        },
        "QA": {
          "v": "id da WO + \":1\", 1 item WorkOrderItem",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 14
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Mesmo padrão WO:item, mas o sufixo do BPMN é \":1\" e o do exemplo é \"SFTWOI\" + número.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM o formato do id do item."
    },
    {
      "id": "R25",
      "grupo": "request",
      "nome": "place.cnl",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "data_wfmCnl (o mesmo da INT11)",
      "valor": {
        "t": "start",
        "de": "START wfmCnl → data_wfmCnl"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"41000\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmCnl}} (a mesma variável da INT11)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"41000\"",
          "r": "igual"
        },
        "QA": {
          "v": "wfmCnl (o mesmo da INT11); null se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START, compartilhado com a consulta de slots.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R26",
      "grupo": "request",
      "nome": "place.cnlAcronym",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('cnlAcronym')",
      "valor": {
        "t": "start",
        "de": "START wo_cnlAcronym → data_wo_cnlAcronym"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"CTA\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woCnlAcronym}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"CTA\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_cnlAcronym; vazio → PADROES_INT14 \"CTA\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA completa com PADROES_INT14 (\"CTA\", de Curitiba); em 19/11 foi junto com cidade São Paulo vinda da Asset.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R27",
      "grupo": "request",
      "nome": "place.city",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo · US08",
      "bpmn": "wo('city')",
      "valor": {
        "t": "start",
        "de": "START wo_city → data_wo_city"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"ENDEREÇO\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Só no exemplo: \"Curitiba\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woCity}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"Curitiba\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_city do formulário ou da Asset (INT00, place.city)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R28",
      "grupo": "request",
      "nome": "place.neighborhood",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('neighborhood')",
      "valor": {
        "t": "start",
        "de": "START wo_neighborhood → data_wo_neighborhood"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"Portão\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woNeighborhood}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"Portão\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_neighborhood do formulário ou da Asset (INT00, place.locality)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R29",
      "grupo": "request",
      "nome": "place.postcode",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "data_wfmPostcode (o mesmo da INT11)",
      "valor": {
        "t": "start",
        "de": "START wfmPostcode → data_wfmPostcode"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"81070360\" (8 dígitos)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmPostcode}} (a mesma variável da INT11)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"81070360\"",
          "r": "igual"
        },
        "QA": {
          "v": "wfmPostcode do formulário ou da Asset (INT00, place.postcode)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START, compartilhado com a consulta de slots. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R30",
      "grupo": "request",
      "nome": "place.stateOrProvince",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('stateOrProvince')",
      "valor": {
        "t": "start",
        "de": "START wo_stateOrProvince → data_wo_stateOrProvince"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"PR\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woStateOrProvince}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"PR\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_stateOrProvince da Asset convertido para sigla (siglaUf: \"São Paulo\" → SP); o corpo gerado editável não converte",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA converte o estado da Asset para sigla; o BPMN não. Evidência 19/11: o corpo gerado levou \"São Paulo\".",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R31",
      "grupo": "request",
      "nome": "place.streetCode",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('streetCode')",
      "valor": {
        "t": "start",
        "de": "START wo_streetCode → data_wo_streetCode"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"27421\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woStreetCode}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"27421\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_streetCode; vazio → PADROES_INT14 \"27421\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R32",
      "grupo": "request",
      "nome": "place.streetName",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('streetName')",
      "valor": {
        "t": "start",
        "de": "START wo_streetName → data_wo_streetName"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"Rua Constantino de Sousa\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woStreetName}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"Rua Constantino de Sousa\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_streetName do formulário ou da Asset (INT00, place.streetName)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R33",
      "grupo": "request",
      "nome": "place.streetNr",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('streetNr')",
      "valor": {
        "t": "start",
        "de": "START wo_streetNr → data_wo_streetNr"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"3215\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woStreetNr}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"3215\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_streetNr do formulário ou da Asset (INT00, place.streetNr)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R34",
      "grupo": "request",
      "nome": "place.networkOwner",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "data_wfmNetworkOwner; se vazio, VIVO1.",
      "valor": {
        "t": "start",
        "de": "START wfmNetworkOwner → data_wfmNetworkOwner (padrão 'VIVO1')"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ex.: VIVO2",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmNetworkOwner}} (padrão da collection: VIVO1)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"VIVO2\"",
          "r": "igual"
        },
        "QA": {
          "v": "wfmNetworkOwner; fallback VIVO1",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 15
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Campo obrigatório. O BPMN tem padrão VIVO1; o exemplo do DM é VIVO2.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R35",
      "grupo": "request",
      "nome": "place.accessTechnology",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "data_wfmMediaType; se vazio, GPON.",
      "valor": {
        "t": "start",
        "de": "START wfmMediaType → data_wfmMediaType (padrão 'GPON')"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01 Pré-condições: \"Cliente com FTTH solicitou suporte técnico no VE\" (não cita a tecnologia; combina com o fallback GPON)",
          "r": "parcial"
        },
        "DM": {
          "v": "Obrigatório · GPON",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmMediaType}} (padrão da collection: GPON)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"GPON\"",
          "r": "igual"
        },
        "QA": {
          "v": "wfmMediaType; fallback GPON",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 16
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R36",
      "grupo": "request",
      "nome": "place.centralOffice",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "data_wfmCentralOffice; se vazio, \"\".",
      "valor": {
        "t": "start",
        "de": "START wfmCentralOffice → data_wfmCentralOffice"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"VM\" (junto com networkOwner VIVO2)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmCentralOffice}} (vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"\" (vazio, com networkOwner VIVO2)",
          "r": "igual"
        },
        "QA": {
          "v": "wfmCentralOffice; \"\" se vazio (vai também em VIVO2)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O START diz que fica vazio em VIVO2. O exemplo do DM preenche VM mesmo em VIVO2.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se centralOffice é exigido em VIVO2."
    },
    {
      "id": "R37",
      "grupo": "request",
      "nome": "place.telephonicArea",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "data_wfmTelephonicArea; se vazio, \"\".",
      "valor": {
        "t": "start",
        "de": "START wfmTelephonicArea → data_wfmTelephonicArea"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"CB\" (junto com networkOwner VIVO2)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmTelephonicArea}} (vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"\" (vazio, com networkOwner VIVO2)",
          "r": "igual"
        },
        "QA": {
          "v": "wfmTelephonicArea; \"\" se vazio (vai também em VIVO2)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Mesmo caso de R36.",
      "acao": "decidir",
      "acaoTexto": "Ver R36."
    },
    {
      "id": "R38",
      "grupo": "request",
      "nome": "place.geographicLocation.bbox",
      "tipo": "lista",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "[wo('longitude'), wo('latitude')], como texto.",
      "valor": {
        "t": "start",
        "de": "START wo_longitude, wo_latitude → data_wo_*"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: [\"-49.32869\", \"-25.44258\"] (longitude, latitude)",
          "r": "igual"
        },
        "PM": {
          "v": "[\"{{woLongitude}}\", \"{{woLatitude}}\"]",
          "r": "igual"
        },
        "CURL": {
          "v": "[\"-49.32869\", \"-25.44258\"] (longitude, latitude)",
          "r": "igual"
        },
        "QA": {
          "v": "[wo_longitude, wo_latitude]; vazios → PADROES_INT14 -49.32869 / -25.44258 (Curitiba)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Ordem e tipo iguais ao exemplo. Coordenadas estão marcadas como pendentes de origem. A tela de QA usa as coordenadas de Curitiba de PADROES_INT14; em 19/11 foram com endereço de São Paulo vindo da Asset.",
      "acao": "decidir",
      "acaoTexto": "Definir de onde vêm as coordenadas."
    },
    {
      "id": "R39",
      "grupo": "request",
      "nome": "place.geographicSite (Cabinet).id",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "@type Cabinet fixo; id = data_wfmGeographicSiteId (pode ir nulo ou vazio).",
      "valor": {
        "t": "start",
        "de": "START wfmGeographicSiteId → data_wfmGeographicSiteId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · @type Cabinet · id ex.: PRCTA_G1D23",
          "r": "parcial"
        },
        "PM": {
          "v": "@type Cabinet · id {{wfmGeographicSiteId}} (vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "@type Cabinet · id \"PRCTA_G1D23\"",
          "r": "igual"
        },
        "QA": {
          "v": "@type Cabinet · id wfmGeographicSiteId; vazio → PADROES_INT14 PRCTA_G1D23 (na INT11 vai \"\")",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 17
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 18
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Obrigatório no DM. O BPMN não valida e manda vazio se o START vier vazio. A tela de QA completa com PADROES_INT14 (PRCTA_G1D23), mas na INT11 manda \"\": o armário diverge entre as chamadas.",
      "acao": "bpmn",
      "acaoTexto": "Validar antes de chamar (ou tornar wfmGeographicSiteId não vazio no START)."
    },
    {
      "id": "R40",
      "grupo": "request",
      "nome": "place.geographicSubAddress.name",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('complement')",
      "valor": {
        "t": "start",
        "de": "START wo_complement → data_wo_complement"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"AP 401 AND 4\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{woComplement}}",
          "r": "igual"
        },
        "CURL": {
          "v": "\"AP 401 AND 4\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_complement; vazio → PADROES_INT14 \"AP 401 AND 4\" (a Asset não fornece)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Vem do START. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R41",
      "grupo": "request",
      "nome": "relatedEntity pronto (wo_relatedEntity)",
      "tipo": "JSON",
      "linha": "BPMN body",
      "bpmn": "Se existir, substitui toda a lista de produtos (JSON vindo do START).",
      "valor": {
        "t": "start",
        "de": "START wo_relatedEntity (opcional) → data_wo_relatedEntity"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo traz 5 produtos: Banda Larga, ACESSO, VEL 500 Mbps, IP Fixo, Roteador HGU",
          "r": "parcial"
        },
        "PM": {
          "v": "Não há variável para lista pronta; a lista de produtos é fixa no body",
          "r": "parcial"
        },
        "CURL": {
          "v": "Lista pronta com 5 produtos: Banda Larga, ACESSO, VEL, IP Fixo, Roteador",
          "r": "igual"
        },
        "QA": {
          "v": "Sem wo_relatedEntity: lista sempre montada (Banda Larga, ACESSO, VEL, IP Fixo, Roteador). Corpo todo editável em wfmCorpoInt14",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Válvula de escape para mandar todos os produtos do exemplo. Sem ela, só vão Banda Larga e ACESSO.",
      "acao": "decidir",
      "acaoTexto": "Definir quais produtos o WFM exige e de onde vêm (Asset)."
    },
    {
      "id": "R42",
      "grupo": "request",
      "nome": "Produto Banda Larga (id, name, action, status)",
      "tipo": "ProductEntity",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "id = wo('productId'); name \"Banda Larga\", action e status \"Ativo\" fixos.",
      "valor": {
        "t": "start",
        "de": "START wo_productId → data_wo_productId (resto fixo)"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: id 0QLOt000003UxfGOAS, name Banda Larga, Ativo/Ativo",
          "r": "igual"
        },
        "PM": {
          "v": "id {{woProductId}} · name \"Banda Larga\" · action e status \"Ativo\"",
          "r": "igual"
        },
        "CURL": {
          "v": "id \"0QLOt000003UxfGOAS\" · name \"Banda Larga\" · action e status \"Ativo\"",
          "r": "igual"
        },
        "QA": {
          "v": "id wo_productId (Asset, asset.id) · name \"Banda Larga\" · action e status \"Ativo\" fixos",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Estrutura igual ao exemplo. Nome e status fixos, sem ler o status real do produto. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R43",
      "grupo": "request",
      "nome": "Banda Larga · característica Designator",
      "tipo": "Characteristic",
      "linha": "BPMN body · DM exemplo · US08",
      "bpmn": "data_designador (o mesmo da INT01/INT03).",
      "valor": {
        "t": "start",
        "de": "START designador → data_designador"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"ID DO DESIGNADOR\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Só no exemplo: CTA-WFM116145-013 (serviço)",
          "r": "igual"
        },
        "PM": {
          "v": "Designator = {{designador}}",
          "r": "igual"
        },
        "CURL": {
          "v": "Designator = \"CTA-WFM116145-013\"",
          "r": "igual"
        },
        "QA": {
          "v": "Designator = designador do formulário (obrigatório) ou da Asset (idDesignador)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Aqui o designador de serviço (013) é o certo, igual ao exemplo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R44",
      "grupo": "request",
      "nome": "Banda Larga · característica Technology",
      "tipo": "Characteristic",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "data_wfmMediaType; se vazio, GPON.",
      "valor": {
        "t": "start",
        "de": "START wfmMediaType → data_wfmMediaType (padrão 'GPON')"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01 Pré-condições: \"Cliente com FTTH solicitou suporte técnico no VE\" (não cita a tecnologia; combina com o fallback GPON)",
          "r": "parcial"
        },
        "DM": {
          "v": "Só no exemplo: GPON",
          "r": "igual"
        },
        "PM": {
          "v": "Technology = {{wfmMediaType}}",
          "r": "igual"
        },
        "CURL": {
          "v": "Technology = \"GPON\"",
          "r": "igual"
        },
        "QA": {
          "v": "Technology = wfmMediaType; fallback GPON",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R45",
      "grupo": "request",
      "nome": "Banda Larga · característica Code",
      "tipo": "Characteristic",
      "linha": "DM exemplo",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: Code = \"21000\"",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "CURL": {
          "v": "Code = \"21000\" (primeira característica do produto)",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Code = wo_productCode; vazio → PADROES_INT14 \"21000\"",
          "r": "so-fonte"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O exemplo manda um código de produto que o BPMN não envia (só via wo_relatedEntity). A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se Code é necessário."
    },
    {
      "id": "R46",
      "grupo": "request",
      "nome": "Produto ACESSO (id e Designator)",
      "tipo": "ProductEntity",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "Só se wo_acessoId vier preenchido: id = wo('acessoId'), Designator = wo('acessoDesignador').",
      "valor": {
        "t": "start",
        "de": "START wo_acessoId, wo_acessoDesignador → data_wo_*"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: id 0QLOt000003UxfHOAS, Designator CTA-WFMTT116146-069 (acesso)",
          "r": "igual"
        },
        "PM": {
          "v": "Não envia o produto ACESSO; não há variáveis de acesso",
          "r": "parcial"
        },
        "CURL": {
          "v": "id \"0QLOt000003UxfHOAS\" · Designator \"CTA-WFMTT1161001-069\" (o DM traz …116146-069)",
          "r": "igual"
        },
        "QA": {
          "v": "Só se houver wo_acessoId ou wo_acessoDesignador (Asset, item productFamily Acesso); id null se só houver designador",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Igual ao exemplo quando preenchido. Se wo_acessoId vier vazio, o produto some sem aviso. A tela de QA tira o valor da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R47",
      "grupo": "request",
      "nome": "Produtos VEL, IP Fixo e Roteador",
      "tipo": "ProductEntity",
      "linha": "DM exemplo",
      "bpmn": "Só vão se vierem dentro de wo_relatedEntity.",
      "valor": {
        "t": "start",
        "de": "START wo_relatedEntity (opcional)"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: Banda Larga-VEL \"500 Mbps\", Banda Larga-IPFIXO \"IP Fixo\", Roteador \"HGU\"",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia VEL, IP Fixo nem Roteador",
          "r": "parcial"
        },
        "CURL": {
          "v": "VEL \"500 Mbps\", IPFIXO \"IP Fixo\", Roteador \"HGU\" (sem características)",
          "r": "igual"
        },
        "QA": {
          "v": "Sempre enviados com wo_velocidade, wo_ipFixo e wo_roteador; vazios → PADROES_INT14 (500 Mbps, IP Fixo, HGU)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Sem wo_relatedEntity, o WFM recebe menos produtos que no exemplo. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Ver R41."
    },
    {
      "id": "R48",
      "grupo": "request",
      "nome": "specification.acronym e type",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "TT_B e TROUBLETICKET (fixos)",
      "valor": {
        "t": "fixo",
        "de": "'TT_B' · 'TROUBLETICKET'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatórios · TT_B · TROUBLETICKET",
          "r": "igual"
        },
        "PM": {
          "v": "\"TT_B\" · \"TROUBLETICKET\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"TT_B\" · \"TROUBLETICKET\"",
          "r": "igual"
        },
        "QA": {
          "v": "\"TT_B\" · \"TROUBLETICKET\" (fixos)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 19
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 20
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R49",
      "grupo": "request",
      "nome": "specificationDescription PRODUTO, TIPO, SEQUENCIA",
      "tipo": "lista",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "PRODUTO \"Banda\", TIPO \"Defeito\", SEQUENCIA \"1/1\" (fixos)",
      "valor": {
        "t": "fixo",
        "de": "'Banda' · 'Defeito' · '1/1'"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: Banda · Defeito · 1/1",
          "r": "igual"
        },
        "PM": {
          "v": "PRODUTO \"Banda\" · TIPO \"Defeito\" · SEQUENCIA \"1/1\"",
          "r": "igual"
        },
        "CURL": {
          "v": "PRODUTO \"Banda\" · TIPO \"Defeito\" · SEQUENCIA \"1/1\"",
          "r": "igual"
        },
        "QA": {
          "v": "PRODUTO \"Banda\" · TIPO \"Defeito\" · SEQUENCIA \"1/1\" (fixos)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Copiado do exemplo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R50",
      "grupo": "request",
      "nome": "specificationDescription DETALHE",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "wo('detail')",
      "valor": {
        "t": "start",
        "de": "START wo_detail → data_wo_detail"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo: \"Autenticação\"",
          "r": "parcial"
        },
        "PM": {
          "v": "DETALHE = {{woDetail}}",
          "r": "igual"
        },
        "CURL": {
          "v": "DETALHE = \"Autenticação\"",
          "r": "igual"
        },
        "QA": {
          "v": "DETALHE = wo_detail; vazio → PADROES_INT14 \"Autenticação\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O detalhe do defeito poderia vir do diagnóstico (HPSD), mas hoje vem do START. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem do DETALHE (diagnóstico ou canal) e o domínio."
    },
    {
      "id": "A01",
      "grupo": "agendamento",
      "nome": "description",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "\"Agendamento da atividade\" (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'Agendamento da atividade'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Agendamento da atividade\"",
          "r": "igual"
        },
        "PM": {
          "v": "\"Agendamento da atividade\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"Agendamento da atividade\"",
          "r": "igual"
        },
        "QA": {
          "v": "\"Agendamento da atividade\" (fixo)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 22
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A02",
      "grupo": "agendamento",
      "nome": "category",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "CORPORATE (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'CORPORATE'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · CORPORATE",
          "r": "igual"
        },
        "PM": {
          "v": "\"CORPORATE\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"CORPORATE\"",
          "r": "igual"
        },
        "QA": {
          "v": "\"CORPORATE\" (fixo)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 23
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A03",
      "grupo": "agendamento",
      "nome": "canBeAntecipated",
      "tipo": "boolean",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "Booleano: checkbox \"Aceito que a Vivo me avise se surgir um horário mais cedo\".",
      "valor": {
        "t": "tela",
        "de": "form_avisarHorarioMaisCedo → data_avisarHorarioMaisCedo"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · tipo String \"true\" na tabela; booleano true no exemplo",
          "r": "parcial"
        },
        "PM": {
          "v": "{{avisarHorarioMaisCedo}} sem aspas (booleano); padrão false; pré-script aceita só true ou false",
          "r": "igual"
        },
        "CURL": {
          "v": "true (booleano)",
          "r": "igual"
        },
        "QA": {
          "v": "Checkbox wo_canBeAntecipated, marcado por padrão: manda true salvo se desmarcado",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 24
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O BPMN manda booleano, como o exemplo. A tabela da aba REQUEST diz String. A tela de QA manda true por padrão.",
      "acao": "fonte",
      "acaoTexto": "Corrigir o tipo na tabela do DM para boolean."
    },
    {
      "id": "A04",
      "grupo": "agendamento",
      "nome": "externalId",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "Igual ao workOrderItem.id (VE<uuid>:1).",
      "valor": {
        "t": "gerado",
        "de": "data_woIdJornada + ':1'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ex.: SFOWO1566GU190:WFMOI061650PA (formato WO:item)",
          "r": "parcial"
        },
        "PM": {
          "v": "\"{{woIdJornada}}:1\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"AL_WO20261021_1100:1\" (igual ao workOrderItem.id)",
          "r": "igual"
        },
        "QA": {
          "v": "Igual ao workOrderItem.id (VE<uuid>:1)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 25
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "O DM não diz que externalId é o id do item. O BPMN assume isso pelo formato.",
      "acao": "fonte",
      "acaoTexto": "Registrar no DM que externalId = workOrderItem.id."
    },
    {
      "id": "A05",
      "grupo": "agendamento",
      "nome": "scheduleDate",
      "tipo": "string (date)",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "Data local (America/Sao_Paulo) do início do slot, YYYY-MM-DD.",
      "valor": {
        "t": "integracao",
        "de": "INT11 slot.start → data_slotEscolhido → data local"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001: \"o Elastic Journey deve chamar o WFM informando o dia e horário que o cliente escolheu\" (o dia)",
          "r": "igual"
        },
        "DM": {
          "v": "Obrigatório · tabela mostra 46217 (serial do Excel) · exemplo \"2026-07-14\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{slotScheduleDate}}; se vazio, data de slotInicio em America/Sao_Paulo",
          "r": "igual"
        },
        "CURL": {
          "v": "\"2026-11-22\" (mesma data do startDateTime)",
          "r": "igual"
        },
        "QA": {
          "v": "Data local (America/Sao_Paulo) do início do slot, YYYY-MM-DD",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 26
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Formato igual ao exemplo. O 46217 da tabela é a data 14/07/2026 formatada como número pelo Excel.",
      "acao": "fonte",
      "acaoTexto": "Corrigir a célula do DM para o texto YYYY-MM-DD."
    },
    {
      "id": "A06",
      "grupo": "agendamento",
      "nome": "relatedParty Attendant (id, role)",
      "tipo": "objeto",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "id = data_wfmAttendantId (ou \"\"), role \"Cliente via Vivo Empresas\" (fixo).",
      "valor": {
        "t": "start",
        "de": "START wfmAttendantId → data_wfmAttendantId; role fixo"
      },
      "fontes": {
        "DM": {
          "v": "Aba REQUEST: exemplo com id \"Cliente via Vivo Empresa\" e role \"\". Aba VE x Camunda: id \"\" e role \"Cliente via Vivo Empresas\"",
          "r": "diverge"
        },
        "PM": {
          "v": "id {{wfmAttendantId}} · role \"Cliente via Vivo Empresas\"",
          "r": "igual"
        },
        "CURL": {
          "v": "id \"Cliente via Vivo Empresa\" · role \"\" (texto no id, como a aba REQUEST)",
          "r": "diverge"
        },
        "QA": {
          "v": "Fixo { id: \"Cliente via Vivo Empresa\", role: \"\" }, como o curl; ignora wfmAttendantId",
          "r": "diverge"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 27
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 23
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 24
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O próprio DM se contradiz: uma aba põe o texto no id, a outra no role. O BPMN segue a aba VE x Camunda e ainda põe um id vindo do START. O Postman segue o BPMN; o curl segue a aba REQUEST. A tela de QA segue o curl, ignora wfmAttendantId, e a WO de 19/11 foi aceita assim.",
      "acao": "decidir",
      "acaoTexto": "Fechar com o WFM onde vai \"Cliente via Vivo Empresas\" e se o Attendant tem id."
    },
    {
      "id": "A07",
      "grupo": "agendamento",
      "nome": "TimeSlot.id",
      "tipo": "string",
      "linha": "BPMN body · DM exemplo",
      "bpmn": "slot.timeslot (validFor.timeslot ou id do slot da INT11).",
      "valor": {
        "t": "integracao",
        "de": "INT11 → data_slotsWfm → form_horarioVisita → data_slotEscolhido.timeslot"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01 Resultado esperado: \"WFM executa a geração/criação do WO com o slot escolhido pelo cliente\"",
          "r": "igual"
        },
        "DM": {
          "v": "Só no exemplo: \"15:30-17:30\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{slotTimeslot}} (obrigatória no pré-script)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"15:30-17:30\"",
          "r": "igual"
        },
        "QA": {
          "v": "slot.timeslot da INT11 (primeiro horário) ou horário manual \"12:00-14:00\" (wfmSimuladoPeriodo)",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Repassa o identificador do slot devolvido pelo WFM.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A08",
      "grupo": "agendamento",
      "nome": "TimeSlot.resourceId",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "slot.resourceId (INT11).",
      "valor": {
        "t": "integracao",
        "de": "INT11 → data_slotEscolhido.resourceId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · bucket, ex.: BKT_CURITIBA_VIVO_FB",
          "r": "igual"
        },
        "PM": {
          "v": "{{slotResourceId}} (obrigatória no pré-script)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"BKT_GRUPO_02_NV_FB\"",
          "r": "igual"
        },
        "QA": {
          "v": "slot.resourceId da INT11 ou manual (padrão BKT_GRUPO_02_NV_FB); obrigatório no horário manual",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 28
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado. Se a INT11 não devolver resourceId, vai nulo sem validação.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A09",
      "grupo": "agendamento",
      "nome": "TimeSlot.resourceName",
      "tipo": "string",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "slot.resourceName (INT11).",
      "valor": {
        "t": "integracao",
        "de": "INT11 → data_slotEscolhido.resourceName"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ex.: \"Bucket - Bucket_Curitiba Vivo\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{slotResourceName}} (opcional no pré-script; vazio por padrão)",
          "r": "igual"
        },
        "CURL": {
          "v": "\"Bucket - Bucket_Curitiba Vivo\" (não bate com o resourceId BKT_GRUPO_02_NV_FB)",
          "r": "igual"
        },
        "QA": {
          "v": "slot.resourceName da INT11 (null se ausente) ou manual (padrão \"Bucket - Bucket_Curitiba Vivo\")",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 29
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Mesmo caso de A08.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A10",
      "grupo": "agendamento",
      "nome": "TimeSlot.validFor (startDateTime, endDateTime)",
      "tipo": "string (date-time)",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "slot.start e slot.end, como vieram da INT11.",
      "valor": {
        "t": "integracao",
        "de": "INT11 → data_slotEscolhido.start / .end"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001: chamar o WFM \"informando o dia e horário que o cliente escolheu\" · Req01: \"com o slot escolhido pelo cliente\"",
          "r": "igual"
        },
        "DM": {
          "v": "Obrigatórios · ISO com offset, ex.: 2026-07-14T15:30:00.000-03:00",
          "r": "igual"
        },
        "PM": {
          "v": "{{slotInicio}} / {{slotFim}}, obrigatórias; pré-script exige fim > início",
          "r": "igual"
        },
        "CURL": {
          "v": "2026-11-22T15:30:00.000-03:00 / 2026-11-22T17:30:00.000-03:00",
          "r": "igual"
        },
        "QA": {
          "v": "slot.inicio/fim da INT11 ou manual (amanhã 12h–14h, -03:00); o manual exige fuso, fim > início e data futura",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 30
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 31
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "A11",
      "grupo": "agendamento",
      "nome": "note CRM_NOTES",
      "tipo": "Note",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "\"Agendamento realizado pelo cliente no fluxo de suporte técnico no Vivo Empresas\" (fixo)",
      "valor": {
        "t": "fixo",
        "de": "texto fixo"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório 1..N. Exemplo da aba REQUEST: \"…fluxo de aceite de proposta…\". Aba VE x Camunda: \"…fluxo de suporte técnico…\"",
          "r": "parcial"
        },
        "PM": {
          "v": "\"Agendamento realizado pelo cliente no fluxo de suporte técnico no Vivo Empresas\"",
          "r": "igual"
        },
        "CURL": {
          "v": "\"…no fluxo de aceite de proposta no Vivo Empresas\" (texto do exemplo da aba REQUEST)",
          "r": "diverge"
        },
        "QA": {
          "v": "Texto próprio: \"…na jornada Fenix - Abertura de BD (VE)\"; com horário manual, \"TESTE QA: horario simulado…\"",
          "r": "diverge"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 32
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 31
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 32
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O BPMN usa o texto de suporte técnico. O exemplo da aba REQUEST foi copiado de outro fluxo. Evidência 19/11: a tela de QA mandou \"horario simulado\" com slot real da INT11, porque o corpo editável foi gerado no exemplo simulado.",
      "acao": "fonte",
      "acaoTexto": "Corrigir o texto do exemplo na aba REQUEST."
    },
    {
      "id": "A12",
      "grupo": "agendamento",
      "nome": "note ADDRESS_REFERENCE",
      "tipo": "Note",
      "linha": "BPMN body · DM REQUEST",
      "bpmn": "Só se wo_addressReference vier preenchido.",
      "valor": {
        "t": "start",
        "de": "START wo_addressReference → data_wo_addressReference"
      },
      "fontes": {
        "DM": {
          "v": "Domínio CRM_NOTES; ADDRESS_REFERENCE · ex.: \"PROXIMO ESCOLA PORTUGA\"",
          "r": "igual"
        },
        "PM": {
          "v": "Sempre enviada, com {{woAddressReference}} (vazio por padrão)",
          "r": "parcial"
        },
        "CURL": {
          "v": "\"PROXIMO ESCOLA PORTUGA\"",
          "r": "igual"
        },
        "QA": {
          "v": "Sempre enviada com wo_addressReference; vazio → PADROES_INT14 \"PROXIMO ESCOLA PORTUGA\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 32
        },
        {
          "aba": "Camunda x WFM Journey REQUEST",
          "linha": 36
        }
      ],
      "leitura": "Alinhado. É obrigatório no START, mas pode vir vazio. O Postman manda a nota mesmo vazia; o BPMN a omite. A tela de QA completa com PADROES_INT14 (valor do curl) porque a jornada não tem origem.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "Critério de sucesso",
      "tipo": "regra",
      "linha": "BPMN Node_TrataWO · DM RESP OK",
      "bpmn": "HTTP 200 com idWorkOrder e idWorkOrderItem → data_woCriada = true. 200 sem um deles é falha.",
      "valor": {
        "t": "resposta",
        "de": "Node_CriaWO-status + body → data_woCriada"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01 Resultado esperado: \"WFM informa ao Elastic Journey via camada de Integração que o WO foi criado com sucesso com o slot escolhido pelo cliente\" · US10/US11 Postman: PRÉ REQ 6 \"slot criado com sucesso no WFM\" e PRÉ REQ 7 \"agendamento criado com sucesso no WFM\"",
          "r": "igual"
        },
        "DM": {
          "v": "HTTP 200 · idWorkOrder, idWorkOrderItem e idWork obrigatórios",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste aceita só 200 e exige idWorkOrder e idWorkOrderItem não vazios",
          "r": "igual"
        },
        "QA": {
          "v": "Aceita só 200; exige idWorkOrder e idWorkOrderItem e confere idWorkOrder com o id enviado",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 6
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        }
      ],
      "leitura": "O BPMN não exige idWork, que o DM marca como obrigatório. Aceita só 200 (201 seria falha).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "idWorkOrder",
      "tipo": "string",
      "linha": "BPMN Node_TrataWO · DM RESP OK",
      "bpmn": "data_woNumero. Se não vier, usa o id enviado (data_woIdJornada).",
      "valor": {
        "t": "resposta",
        "de": "idWorkOrder (ou data_woIdJornada) → data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US08 Req01 Ações: \"Elastic Journey deve gerar o ID do WO para usar a frente no fluxo sistêmico\" (o id gerado é o que segue no fluxo)",
          "r": "parcial"
        },
        "DM": {
          "v": "Obrigatório · ex.: SFTWO24583177 (diferente do id do exemplo de request, SFTWO24583286)",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste grava woNumero = idWorkOrder, só se vier. Não usa woIdJornada como reserva",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência 19/11: idWorkOrder = id enviado (VE+UUID). A tela grava woNumero só se vier, sem reserva",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 7
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        }
      ],
      "leitura": "O BPMN supõe que o WFM devolve o mesmo id enviado. Os exemplos do DM mostram ids diferentes. data_woNumero vai para a INT18 e para o cancelamento (INT16). Evidência 19/11: o WFM devolveu o mesmo id enviado, como o BPMN supõe. A US08 sugere que o id que segue no fluxo é o gerado pela jornada; o BPMN prefere o idWorkOrder devolvido e usa o gerado só como reserva.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se idWorkOrder é o id enviado (VE+UUID)."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "idWorkOrderItem",
      "tipo": "string",
      "linha": "BPMN Node_TrataWO · DM RESP OK",
      "bpmn": "data_woItemId (usado na INT18).",
      "valor": {
        "t": "resposta",
        "de": "idWorkOrderItem → data_woItemId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ex.: SFTWO24583177:SFTWOI24583177",
          "r": "igual"
        },
        "PM": {
          "v": "Teste grava woItemId = idWorkOrderItem",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: idWorkOrderItem = id enviado + \":1\". A tela grava woItemId e usa no BD (INT18 WorkOrderItem)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 8
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "idWork",
      "tipo": "string",
      "linha": "BPMN Node_TrataWO · DM RESP OK",
      "bpmn": "Grava data_woIdWork, que nada usa depois.",
      "valor": {
        "t": "resposta",
        "de": "idWork → data_woIdWork"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ordem operacional, ex.: 311441770",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste grava woIdWork se vier; não valida. A INT18 avisa para não tirar idAppointment de idWork",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: idWork numérico (9 dígitos). A tela guarda em woIdWork e não valida",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 9
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        }
      ],
      "leitura": "Guardado sem uso. Pode ser o número que o técnico vê.",
      "acao": "decidir",
      "acaoTexto": "Decidir se idWork vai para o BD (INT18) ou para a tela."
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "Corpo de erro (origin, code, reason, message)",
      "tipo": "objeto",
      "linha": "BPMN Node_TrataWO · DM RESP ERRO v1/v2",
      "bpmn": "Junta code | reason | message | origin em data_woErro. Nenhuma tela ou log lê.",
      "valor": {
        "t": "resposta",
        "de": "body de erro → data_woErro"
      },
      "fontes": {
        "US": {
          "v": "US09 Req01 Resultado esperado: WFM informa \"que o WO não foi criado (por exemplo, algum erro sistêmico qualquer)\"; não separa erro da WO e do agendamento",
          "r": "igual"
        },
        "DM": {
          "v": "HTTP 401 · origin TMF-646-v1 (v1) ou TMF-697-v2 (v2) · \"Jwt is expired\"",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê os campos: mostra o corpo bruto; 401/403 vira \"Token recusado\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 6
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 7
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 8
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 9
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 10
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 12
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 6
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 7
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 8
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 9
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 10
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 12
        }
      ],
      "leitura": "Os campos batem. O origin diz se falhou o agendamento (646) ou a WO (697), mas o BPMN trata tudo igual.",
      "acao": "decidir",
      "acaoTexto": "Decidir se erro 646 (WO criada, agendamento não) tem tratamento próprio."
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "Timeout ou falha de conexão",
      "tipo": "regra",
      "linha": "BPMN evento Node_CriaWO_FalhaTecnica",
      "bpmn": "Evento de erro leva ao Node_TrataWO; vira falha com erro \"HTTP java.io.IOException\".",
      "valor": {
        "t": "resposta",
        "de": "Node_CriaWO-status = java.io.IOException"
      },
      "fontes": {
        "US": {
          "v": "US09 Req01 Resultado esperado: \"o WO não foi criado (por exemplo, algum erro sistêmico qualquer)\" · CA001: \"o WFM não consegue criar a WO por um motivo sistêmico\"",
          "r": "igual"
        },
        "PM": {
          "v": "Descrição: em timeout ou 500, reconciliar woIdJornada antes de repetir (a WO pode ter sido criada)",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout de 30 s vira falha \"Sem resposta\"; sem retentativa e sem cancelamento automático",
          "r": "parcial"
        }
      },
      "leitura": "Timeout segue o caminho de falha e dispara o cancelamento, mesmo sem saber se a WO foi criada.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "X-Vivo-Transaction-Id da resposta",
      "tipo": "header",
      "linha": "DM RESP OK/ERRO",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT007_…",
          "r": "so-fonte"
        },
        "PM": {
          "v": "O teste não lê o header da resposta",
          "r": "igual"
        },
        "QA": {
          "v": "Não lê; o header só aparece no resultado",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 5
        },
        {
          "aba": "CAMUNDA X WFM Journey RESP OK",
          "linha": 20
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v1",
          "linha": 5
        },
        {
          "aba": "CAMUNDAX WFM Jour. RESP ERRO v2",
          "linha": 5
        }
      ],
      "leitura": "Só rastreabilidade. O BPMN não lê.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D01",
      "grupo": "fluxo",
      "nome": "Horário válido?",
      "tipo": "gateway",
      "linha": "BPMN Node_RegistraHorario · Node_DecHorarioValido",
      "bpmn": "Procura form_horarioVisita na lista de slots. Achou: grava o slot e gera o id da WO. Não achou: volta para a escolha.",
      "valor": {
        "t": "tela",
        "de": "form_horarioVisita × data_slotsWfm → data_horarioValido"
      },
      "fontes": {
        "US": {
          "v": "US08 CA001: \"o cliente escolhe um dia e horário no VE\" e \"o VE informa ao Elastic Journey o dia e horário que cliente escolheu\". A US não fala em validar a escolha",
          "r": "igual"
        },
        "PM": {
          "v": "Não confere com a lista da INT11 (descrição: \"Não chama INT11\"); só exige slotInicio < slotFim",
          "r": "parcial"
        },
        "QA": {
          "v": "Não há escolha nem conferência: usa o primeiro horário da INT11 ou o manual validado",
          "r": "parcial"
        }
      },
      "leitura": "Regra só do BPMN. Garante que o horário enviado é um dos slots da INT11.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D02",
      "grupo": "fluxo",
      "nome": "WO criada?",
      "tipo": "gateway",
      "linha": "BPMN Node_DecWOCriada",
      "bpmn": "data_woCriada = true → abre o BD (INT18), com data_tentativasBD zerado. Senão, vai para \"Há WO para cancelar?\".",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woCriada"
      },
      "fontes": {
        "US": {
          "v": "US10 Req01 e US11 Req01: \"WFM informa ao Elastic Journey via camada de Integração que o agendamento foi concluído com sucesso\" e então \"Elastic Journey deve chamar o Service Now/Salesforce ... para a criação de BD\"",
          "r": "igual"
        },
        "DFT": {
          "v": "Slide 7: Elastic Journey atualiza a jornada e devolve ao VE protocolo e visita, ou erro",
          "r": "igual"
        },
        "QA": {
          "v": "INT18 só roda com slot e woNumero confirmado pela INT14",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D03",
      "grupo": "fluxo",
      "nome": "Há WO para cancelar?",
      "tipo": "gateway",
      "linha": "BPMN Node_DecWOIdentificadaFalha · US09",
      "bpmn": "data_woNumero != null → cancela (INT16). Como data_woNumero recebe o id gerado quando a resposta não traz um, a condição é sempre verdadeira.",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woNumero (ou data_woIdJornada)"
      },
      "fontes": {
        "US": {
          "v": "US09 Workflow e Req01 Resultado esperado: \"Posteriormente Elastic Journey deve chamar o WFM para cancelar a WO criada\", mesmo com a WO \"não criada\" · CA001 omite o cancelamento: \"o Elastic Journey encerra o processo\"",
          "r": "igual"
        },
        "PM": {
          "v": "INT16 exige woNumero informado à mão; a INT14 só grava woNumero quando o 200 traz idWorkOrder",
          "r": "parcial"
        },
        "QA": {
          "v": "INT16 roda sempre que a INT14 devolve idWorkOrder (limpeza do teste, mesmo com sucesso); sem idWorkOrder não cancela",
          "r": "diverge"
        }
      },
      "leitura": "Toda falha da INT14 dispara um DELETE, inclusive 401 ou timeout em que a WO nem existe. O caminho direto para a tela nunca é usado. A tela de QA faz o oposto: cancela toda WO criada no teste e não cancela sem idWorkOrder. A US09 pede o cancelamento mesmo quando a WO \"não foi criada\", o que apoia cancelar sempre; o CA001 não cita o cancelamento.",
      "acao": "decidir",
      "acaoTexto": "Decidir se cancela sempre (seguro, pode dar 404) ou só quando há sinal de WO criada."
    },
    {
      "id": "D04",
      "grupo": "fluxo",
      "nome": "Tela \"Agendamento não realizado\"",
      "tipo": "userTask",
      "linha": "BPMN Node_AgendamentoNaoRealizado · US09",
      "bpmn": "Mostra a tela depois do cancelamento (ou da falha técnica dele). Fim do processo.",
      "valor": {
        "t": "fixo",
        "de": "texto fixo da tela"
      },
      "fontes": {
        "US": {
          "v": "US09 Workflow: \"Elastic Journey informa ao VE que o agendamento não foi bem-sucedido\" e depois \"chamar o WFM para cancelar a WO criada\" · Req01: \"SDUI Elastic Journey informa ao BFF/VE (via pooling na fila do Redis) que a criação da WO não foi bem-sucedida ... Posteriormente ... cancelar a WO\" · CA001: \"o agendamento no dia e horário que o cliente escolheu não foi feito\"",
          "r": "parcial"
        }
      },
      "leitura": "A US informa o cliente antes de cancelar. O BPMN cancela antes e só então mostra a tela, o que soma até 13 s de espera.",
      "acao": "decidir",
      "acaoTexto": "Definir a ordem: tela primeiro e cancelamento depois (como a US) ou o atual."
    },
    {
      "id": "T01",
      "grupo": "tela",
      "nome": "Endpoint /advance",
      "tipo": "HTTP",
      "linha": "DM VE x Camunda - Request · DFT INT13",
      "bpmn": "userTask Node_EscolheHorario, concluída pelo /advance do canal.",
      "valor": {
        "t": "tela",
        "de": "POST /process-instance/{processInstanceId}/advance"
      },
      "fontes": {
        "DFT": {
          "v": "INT13 VE x Elastic Journey · wf-journey-v1 · POST",
          "r": "igual"
        },
        "DM": {
          "v": "POST /process-instance/{processInstanceId}/advance · processInstanceId obrigatório",
          "r": "igual"
        },
        "PM": {
          "v": "POST {{journey_base_url}}/process-instance/{{processInstanceId}}/advance (pasta 03, item 11)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 6
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 7
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmo mecanismo. A aba Request_OLD (histórica) ainda trazia o start da massiva (state raised, externalIdentifier).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T02",
      "grupo": "tela",
      "nome": "trigger",
      "tipo": "string",
      "linha": "DM VE x Camunda - Request",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · exemplo \"user-action\"",
          "r": "so-fonte"
        },
        "PM": {
          "v": "\"user-action\"",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 9
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Tratado pela fachada, não pelo BPMN.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T03",
      "grupo": "tela",
      "nome": "X-Vivo-Transaction-Id do /advance",
      "tipo": "header",
      "linha": "DM VE x Camunda - Request",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Header: TID_VE_FTAT933INT006_… · answers.header: TID_VE_FTAT933INT008_…",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 5
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 14
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O DM traz dois números na mesma chamada (INT006 e INT008). INT008 é o número do cancelamento no BPMN.",
      "acao": "fonte",
      "acaoTexto": "Corrigir a numeração do transactionId do /advance no DM."
    },
    {
      "id": "T04",
      "grupo": "tela",
      "nome": "answers.header flow e requestSystem",
      "tipo": "string",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. A INT14 manda flow e requestSystem fixos.",
      "valor": {
        "t": "fixo",
        "de": "'B2B_MASSIVO' · 'MVE' no Node_CriaWO"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatórios · B2B_MASSIVO · MVE",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia answers.header; só Accept e Content-Type",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 12
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 13
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Valores iguais, origem diferente: o DM espera que o canal mande; o BPMN fixa.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T05",
      "grupo": "tela",
      "nome": "answers.header X-Vivo-Correlation-Id",
      "tipo": "string",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. A INT14 usa data_correlationId do START.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · CID_VE_FTAT933INT008_…",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia answers.header",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 15
        }
      ],
      "leitura": "O canal manda um correlationId por chamada; o BPMN usa um só, o do START.",
      "acao": "decidir",
      "acaoTexto": "Definir se o correlationId é por jornada (START) ou por chamada."
    },
    {
      "id": "T06",
      "grupo": "tela",
      "nome": "Escolha do slot (form_horarioVisita)",
      "tipo": "string",
      "linha": "BPMN Node_RegistraHorario · tela Escolha do horário",
      "bpmn": "Lê só o índice do slot escolhido (\"0\" a \"19\") e monta o Appointment_Create a partir do slot da INT11.",
      "valor": {
        "t": "tela",
        "de": "form_horarioVisita → data_slotEscolhido"
      },
      "fontes": {
        "US": {
          "v": "US07/US08 CA001: \"o VE informa ao Elastic Journey o dia e horário que cliente escolheu\" (não define o formato: índice do slot ou Appointment_Create)",
          "r": "igual"
        },
        "DM": {
          "v": "Não existe. O DM espera Appointment_Create completo em answers",
          "r": "diverge"
        },
        "PM": {
          "v": "answers.horarioVisita = {{horarioVisita}} (padrão \"0\", value da lista eh_horarios) e dataVisita",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 16
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Contrato do canal diferente do BPMN. Se o VE seguir o DM, o BPMN não acha form_horarioVisita e volta para a escolha. O datePicker da tela (form_dataVisita) também é ignorado.",
      "acao": "decidir",
      "acaoTexto": "Fechar com o VE: mandar só o índice (BPMN) ou o Appointment_Create (DM)."
    },
    {
      "id": "T07",
      "grupo": "tela",
      "nome": "Appointment_Create.description e category",
      "tipo": "string",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Fixos no BPMN (\"Agendamento da atividade\", CORPORATE).",
      "valor": {
        "t": "fixo",
        "de": "bodyTemplate do Node_CriaWO"
      },
      "fontes": {
        "DM": {
          "v": "description opcional · category obrigatório CORPORATE",
          "r": "igual"
        },
        "PM": {
          "v": "Não envia Appointment_Create em answers",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 17
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmos valores. O BPMN não depende do canal.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T08",
      "grupo": "tela",
      "nome": "Appointment_Create.canBeAntecipated",
      "tipo": "boolean",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Lê form_avisarHorarioMaisCedo (checkbox), não este campo.",
      "valor": {
        "t": "tela",
        "de": "form_avisarHorarioMaisCedo → data_avisarHorarioMaisCedo"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · boolean · true",
          "r": "parcial"
        },
        "PM": {
          "v": "answers.avisarHorarioMaisCedo = \"{{avisarHorarioMaisCedo}}\" (texto, padrão \"false\")",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 19
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmo dado, outro nome de campo.",
      "acao": "decidir",
      "acaoTexto": "Ver T06."
    },
    {
      "id": "T09",
      "grupo": "tela",
      "nome": "Appointment_Create.scheduleDate",
      "tipo": "string (date)",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. Calcula a data a partir do slot (A05).",
      "valor": {
        "t": "integracao",
        "de": "INT11 slot.start → data local"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · YYYY-MM-DD (tabela 46217, exemplo 2026-07-14)",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia scheduleDate (manda dataVisita, que o BPMN não usa para a data)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 20
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmo valor final, calculado no BPMN.",
      "acao": "decidir",
      "acaoTexto": "Ver T06."
    },
    {
      "id": "T10",
      "grupo": "tela",
      "nome": "Appointment_Create.relatedParty Attendant",
      "tipo": "objeto",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. Monta com data_wfmAttendantId (START) e role fixo (A06).",
      "valor": {
        "t": "start",
        "de": "START wfmAttendantId → data_wfmAttendantId"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo: id \"\", role \"Cliente via Vivo Empresas\" (opcionais)",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia Attendant em answers",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 23
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 24
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O DM manda id vazio; o BPMN tenta preencher com o START.",
      "acao": "decidir",
      "acaoTexto": "Ver A06."
    },
    {
      "id": "T11",
      "grupo": "tela",
      "nome": "Appointment_Create.relatedParty TimeSlot (id, resourceId, resourceName, validFor)",
      "tipo": "objeto",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. Usa o slot guardado da INT11 (A07–A10).",
      "valor": {
        "t": "integracao",
        "de": "INT11 → data_slotEscolhido"
      },
      "fontes": {
        "DM": {
          "v": "Opcionais no canal · ex.: 15:30-17:30, BKT_CURITIBA_VIVO_FB, 2026-07-14T15:30:00.000-03:00",
          "r": "parcial"
        },
        "PM": {
          "v": "Não envia TimeSlot em answers; o slot vem pelo índice horarioVisita",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 22
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 23
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 25
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 26
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 27
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 28
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 29
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O BPMN é mais seguro: o canal não consegue mandar um slot que o WFM não ofereceu.",
      "acao": "fonte",
      "acaoTexto": "Ajustar o DM ao modelo do BPMN (canal manda só a escolha)."
    },
    {
      "id": "T12",
      "grupo": "tela",
      "nome": "Appointment_Create.note",
      "tipo": "lista",
      "linha": "DM VE x Camunda - Request",
      "bpmn": "Não lê. CRM_NOTES fixo no BPMN (A11).",
      "valor": {
        "t": "fixo",
        "de": "texto fixo no Node_CriaWO"
      },
      "fontes": {
        "DM": {
          "v": "CRM_NOTES · \"Agendamento realizado pelo cliente no fluxo de suporte técnico no Vivo Empresas\"",
          "r": "igual"
        },
        "PM": {
          "v": "Não envia note em answers",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 30
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 31
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 32
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmo texto.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T13",
      "grupo": "tela",
      "nome": "Resposta do /advance",
      "tipo": "objeto",
      "linha": "DM VE x Camunda - Response",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "processInstanceId, businessKey, activityId, taskId, variables, status, suspended, created…",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Teste da collection lê processInstanceId, taskId, activityType, form.name e form.sdui.uiStepId",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não lê; a tela não chama o /advance",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Response",
          "linha": 6
        },
        {
          "aba": "VE x Camunda - Response",
          "linha": 29
        }
      ],
      "leitura": "Resposta padrão da fachada, fora do BPMN.",
      "acao": "nada",
      "acaoTexto": ""
    }
  ]
});
