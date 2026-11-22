/*
 * Raio-X · INT18 Abre BD
 * BPMN (referência) × fontes. Levantamento de 20/11/2026.
 * Fronteira = aba "Camunda x MS Trouble Ticket Req/Resp" do DM. As abas MS x ServiceNow (629 e 621)
 * só entram para mostrar o que o MS exige por dentro.
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 * Precedência das 36 características no BPMN: calculadas → data_bd_<campo> → padrão → ''.
 */
RAIOX.registrar({
  "id": "INT18",
  "ordem": 9,
  "nome": "Abre BD",
  "nomeLongo": "Abertura de BD (bilhete de defeito) no ServiceNow",
  "rota": "Elastic Journey → Trouble Ticket Management → ServiceNow (TMF629 + TMF621)",
  "endpoint": "POST ${FENIX_VE_TT_BASE_URL}/troubleTicket",
  "nos": "Node_CriaBD · Node_TrataBDCriado · Node_DecBDCriado · Node_RetentarBD · Node_DecRetentarBD · Node_DecWOIdentificadaBD · Node_BDNaoCriado · Node_VisitaAgendada",
  "resumo": "Depois da WO criada, abre o BD com 36 características. Se falhar, o cliente pode tentar até 3 vezes; na recusa ou na 3ª falha, a WO é cancelada.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias (US)",
      "curto": "US",
      "contrato": false,
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/",
      "detalhe": "US10 Visita agendada - BD não criado (Req01–Req04: 3 tentativas, pergunta ao cliente, cancelamento da WO) · US11 Visita agendada - BD criado (sucesso e tela final) · US08 (ID da WO usado depois) · Escopo comum: \"informe o ID do BD ao cliente\" (US12/US13 não citam dados do BD)"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 10 (Abertura de BD, INT18–INT23) e slide 14 (inventário INT16–INT23)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.1",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Abas Camunda x MS Trouble Ticket Req/Resp (fronteira) · MS x SN(629) e 621-MS x SN Req/Resp (só referência interna)",
      "arquivo": "PreDataMapping FTAT-933 - Abertura de BD - v2.1.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Pasta 04, request \"INT18 - Abre BD (Trouble Ticket POST /troubleTicket)\" (sem resposta salva; usei descrição, pre-request e teste)."
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "",
      "detalhe": "Não há curl para esta integração."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT18' (montar/avaliar), parametrosBd, CARACTERISTICAS_BD e CAMPOS.int18; testes em int18-mapping.test.mjs; evidência 19/11 em evidencias/2026-11-19-rodada-completa/int-06-INT18.json"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Envelope do TroubleTicket (Camunda → Trouble Ticket Management)"
    },
    {
      "id": "caracteristicas",
      "nome": "Características",
      "sub": "troubleTicketCharacteristic[]: 36 nomes, valor opcional"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "Trouble Ticket Management → Camunda"
    },
    {
      "id": "retentativa",
      "nome": "Retentativa",
      "sub": "Até 3 tentativas e cancelamento da WO (INT16)"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_CriaBD · DFT slides 10/14 · US10/11",
      "bpmn": "POST ${FENIX_VE_TT_BASE_URL}/troubleTicket. Mesma base da INT03.",
      "valor": {
        "t": "config",
        "de": "Variável de ambiente FENIX_VE_TT_BASE_URL"
      },
      "fontes": {
        "US": {
          "v": "US10 Req01–Req03 e US11 Req01 Ações: \"chamar o Service Now/Salesforce via camada de integração 'Trouble Ticket Management v1' (ver data mapping “PreDataMapping FTAT-933 - Abertura de BD”)\"",
          "r": "igual"
        },
        "DFT": {
          "v": "INT18 POST · endpoint TBD · rota Trouble Ticket Mgmt; o MS chama TMF629 e depois TMF621",
          "r": "parcial"
        },
        "DM": {
          "v": "Aba Camunda sem URL. Aba 621 (MS → SN) usa /som/sys/som/troubleTicket/v1/troubleTicket-s",
          "r": "parcial"
        },
        "PM": {
          "v": "POST {{tt_base_url}}/troubleTicket · tt_base_url = MS troubleTicketManagement/v1 (spmg-preprod)",
          "r": "igual"
        },
        "QA": {
          "v": "POST <gateway serviceNowTroubleTicket>/troubleTicket, mesma URL da INT03 (exceção QA-BPMN-11); o MS só com url_tt",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "621-MS Trouble Ticke x SN- Req",
          "linha": 39
        }
      ],
      "leitura": "O corpo segue o formato do MS. Na INT03 a mesma base aponta para o gateway do ServiceNow, que não entende esse corpo. No Postman, tt_base_url aponta para o MS troubleTicketManagement; a INT03 usa outra URL (gateway serviceNowTroubleTicket). A tela de QA, na mesma URL da INT03, recebeu 500 em 19/11 vindo do token do ServiceNow; ela não manda o iss que a INT03 manda.",
      "acao": "decidir",
      "acaoTexto": "Confirmar que FENIX_VE_TT_BASE_URL aponta para o MS Trouble Ticket no POST."
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Content-Type",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Req",
      "bpmn": "application/json (fixo)",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · application/json",
          "r": "igual"
        },
        "PM": {
          "v": "Content-Type: application/json",
          "r": "igual"
        },
        "QA": {
          "v": "Content-Type: application/json",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 5
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "Accept",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "application/json (fixo)",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      },
      "fontes": {
        "PM": {
          "v": "Accept: application/json",
          "r": "igual"
        },
        "QA": {
          "v": "Accept: application/json (headersBase)",
          "r": "igual"
        }
      },
      "leitura": "Só o BPMN envia. Inofensivo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Req",
      "bpmn": "_authorizationHeader, se existir (sendToken = false).",
      "valor": {
        "t": "config",
        "de": "Bearer recebido no /advance → _authorizationHeader"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · Bearer Token (JWT)",
          "r": "parcial"
        },
        "PM": {
          "v": "Bearer da collection ({{fenix_access_token}}, token VE, password grant)",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela; sem token a chamada é pulada",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 6
        }
      ],
      "leitura": "O DM exige; o BPMN envia só se houver token na sessão.",
      "acao": "decidir",
      "acaoTexto": "Definir token do usuário ou sistêmico no runtime."
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Req",
      "bpmn": "TID_ELJY_FTAT933INT009_<ISO agora, UTC>",
      "valor": {
        "t": "gerado",
        "de": "TID_ELJY_FTAT933INT009_ + Instant.now()"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT009_YYYY-MM-DDTHH24:MI:SS.FFFZ (\"gerado pelo MS\")",
          "r": "igual"
        },
        "PM": {
          "v": "TID_ELJY_FTAT933INT009_{{$isoTimestamp}}",
          "r": "igual"
        },
        "QA": {
          "v": "tid('INT009') = TID_ELJY_FTAT933INT009_<ISO agora>",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 7
        }
      ],
      "leitura": "Máscara igual. O DM usa INT009 (numeração do DM), não INT18 (numeração do DFT).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Req",
      "bpmn": "data_correlationId, enviado se existir.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"gerado pelo VE no início da jornada\" · CID_VE_FTAT933INT002_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "parcial"
        },
        "PM": {
          "v": "{{correlationId}}; se vazio, gera CID_VE_FTAT933_QA_<epoch> e sempre envia",
          "r": "parcial"
        },
        "QA": {
          "v": "correlationId do formulário; se vazio, gera CID_VE_FTAT933_QA_<epoch> e sempre envia",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 8
        }
      ],
      "leitura": "O DM exige; o BPMN aceita ausência. A máscara traz INT002, diferente da INT03 (INT001).",
      "acao": "decidir",
      "acaoTexto": "Fechar a máscara do correlationId com o VE e torná-lo obrigatório no START."
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "@type",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req (tabela e exemplo)",
      "bpmn": "TroubleTicket (fixo)",
      "valor": {
        "t": "fixo",
        "de": "TroubleTicket"
      },
      "fontes": {
        "DM": {
          "v": "Tabela: obrigatório · TroubleTicket. Exemplo: \"ServiceProblemCase\"",
          "r": "parcial"
        },
        "PM": {
          "v": "\"TroubleTicket\" fixo",
          "r": "igual"
        },
        "QA": {
          "v": "\"TroubleTicket\" fixo",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 10
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O BPMN segue a tabela. O exemplo usa ServiceProblemCase, que é o @type que o MS manda ao ServiceNow (aba 621).",
      "acao": "fonte",
      "acaoTexto": "Corrigir o @type do exemplo do DM."
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "ticketType",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "Case (fixo)",
      "valor": {
        "t": "fixo",
        "de": "Case"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · Case",
          "r": "igual"
        },
        "PM": {
          "v": "\"Case\" fixo",
          "r": "igual"
        },
        "QA": {
          "v": "\"Case\" fixo",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 11
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "description",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · DFT slide 10",
      "bpmn": "data_bd_description ou texto fixo \"Abertura de BD pelo VE (FTAT-933): diagnóstico automático não resolveu o problema\".",
      "valor": {
        "t": "fixo",
        "de": "Texto fixo (sobrescrito por data_bd_description)"
      },
      "fontes": {
        "DFT": {
          "v": "Envia \"dados do cliente, serviço, diagnóstico e atendimento\"",
          "r": "parcial"
        },
        "DM": {
          "v": "Obrigatório · exemplo \"TESTE\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_description}}, padrão \"Abertura de BD pelo VE (FTAT-933): diagnóstico automático não resolveu o problema\"",
          "r": "igual"
        },
        "QA": {
          "v": "bd_description, padrão \"Abertura de BD pelo VE (FTAT-933): diagnóstico…\"; vazio barra a chamada",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 12
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM só dá um placeholder. O texto do BPMN é sempre o mesmo, sem o resultado do diagnóstico.",
      "acao": "decidir",
      "acaoTexto": "Definir com o negócio o texto da description (fixo ou com o resultado do diagnóstico)."
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "severity",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req/Resp",
      "bpmn": "data_bd_severity ou \"3\".",
      "valor": {
        "t": "fixo",
        "de": "'3' (sobrescrito por data_bd_severity)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"3\". Resposta devolve \"3 - Moderate\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_severity}}, padrão \"3\"",
          "r": "igual"
        },
        "QA": {
          "v": "bd_severity, padrão \"3\"; vazio barra a chamada",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 13
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 13
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "name",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "data_bd_name ou \"Queda de Conexão\".",
      "valor": {
        "t": "fixo",
        "de": "'Queda de Conexão' (sobrescrito por data_bd_name)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"Queda de Conexão\" (na aba 621 é obrigatório)",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_name}}, padrão \"Queda de Conexão\"",
          "r": "igual"
        },
        "QA": {
          "v": "bd_name, padrão \"Queda de Conexão\"; omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 16
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "621-MS Trouble Ticke x SN- Req",
          "linha": 37
        }
      ],
      "leitura": "Igual ao exemplo. Todo BD sai como \"Queda de Conexão\", mesmo quando o diagnóstico aponta outra causa.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se o título é fixo para toda a jornada."
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "requestedResolutionDate",
      "tipo": "ISO 8601",
      "linha": "BPMN bodyTemplate · DM Req · aba 621",
      "bpmn": "slot.start do horário escolhido, sem conversão.",
      "valor": {
        "t": "integracao",
        "de": "INT11 + tela → data_slotEscolhido.start"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"início da validade\" · tabela YYYY-MM-DDThh:mm:ss.sTZD; exemplo YYYY-MM-DDThh:mm:ss.SZ. Vira validFor.startDateTime na 621",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_requestedResolutionDate}}, padrão {{slotInicio}}; campo removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "bd_requestedResolutionDate, padrão slot.inicio (1º horário da INT11 ou horário manual); omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 14
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "621-MS Trouble Ticke x SN- Req",
          "linha": 32
        }
      ],
      "leitura": "Bate: início da janela da visita. Tabela e exemplo trazem máscaras diferentes.",
      "acao": "fonte",
      "acaoTexto": "Unificar a máscara da data no DM."
    },
    {
      "id": "R13",
      "grupo": "request",
      "nome": "expectedResolutionDate",
      "tipo": "ISO 8601",
      "linha": "BPMN bodyTemplate · DM Req · aba 621",
      "bpmn": "slot.end; o campo some se o slot não tiver fim.",
      "valor": {
        "t": "integracao",
        "de": "INT11 + tela → data_slotEscolhido.end"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"término da validade\" · vira validFor.endDateTime na 621",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_expectedResolutionDate}}, padrão {{slotFim}}; campo removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "bd_expectedResolutionDate, padrão slot.fim; omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 15
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "621-MS Trouble Ticke x SN- Req",
          "linha": 33
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R14",
      "grupo": "request",
      "nome": "channel.name",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req/Resp",
      "bpmn": "data_bd_channel ou \"Alert\".",
      "valor": {
        "t": "fixo",
        "de": "'Alert' (sobrescrito por data_bd_channel)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"Alert\" (ex.: Alert, Portal, CallCenter). Resposta de exemplo traz \"email\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_channel}}, padrão \"Alert\"",
          "r": "igual"
        },
        "QA": {
          "v": "bd_channel, padrão \"Alert\"",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 18
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 19
        }
      ],
      "leitura": "Igual ao DM. Note que caseOrigin (C34) tem exemplo \"Email\", outro conceito de canal.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R15",
      "grupo": "request",
      "nome": "channel.@type",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req (tabela e exemplo)",
      "bpmn": "ServiceProblemCase (fixo)",
      "valor": {
        "t": "fixo",
        "de": "ServiceProblemCase"
      },
      "fontes": {
        "DM": {
          "v": "Tabela: \"Sim\" com ocorrência 0..1 · ServiceProblemCase. Exemplo: channel sem @type",
          "r": "parcial"
        },
        "PM": {
          "v": "\"ServiceProblemCase\" fixo",
          "r": "igual"
        },
        "QA": {
          "v": "\"ServiceProblemCase\" fixo",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 17
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 19
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O BPMN segue a tabela. A tabela se contradiz (obrigatório com mínimo 0) e o exemplo omite.",
      "acao": "fonte",
      "acaoTexto": "Acertar obrigatoriedade e exemplo no DM."
    },
    {
      "id": "R16",
      "grupo": "request",
      "nome": "relatedEntity[] (lista)",
      "tipo": "list",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "Até 5 itens; cada um só entra se tiver id. Na prática vão 2 (testSpecification e mode), salvo data_bd_*.",
      "valor": {
        "t": "fixo",
        "de": "2 fixos + 3 dependentes de data_bd_*"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · ocorrência máx. 1, mas descreve 5 entidades, cada uma com id obrigatório",
          "r": "parcial"
        },
        "PM": {
          "v": "5 itens no modelo; o script remove os de id vazio. Fixos: testSpecification e mode",
          "r": "igual"
        },
        "QA": {
          "v": "5 itens no modelo; filtra os de id vazio. Fixos: testSpecification e mode",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 20
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "A cardinalidade do DM (máx. 1) não fecha com os 5 itens. Os 3 itens sem valor somem do body.",
      "acao": "fonte",
      "acaoTexto": "Corrigir a cardinalidade no DM (0..N)."
    },
    {
      "id": "R17",
      "grupo": "request",
      "nome": "relatedEntity ProductInventory",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req (tabela e exemplo)",
      "bpmn": "@type Product · entity @type ServiceTest, name ProductInventory, id data_bd_productInventoryId. Omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START bd_productInventoryId → data_bd_productInventoryId (opcional; senão o item some)"
      },
      "fontes": {
        "DM": {
          "v": "Tabela: @type \"Product, Service\" · entity ServiceTest/ProductInventory · id obrigatório \"0001 / GUID\". Exemplo: entity @type ProductInventory, name \"relatedEntity\", id 47d86eb5…",
          "r": "parcial"
        },
        "PM": {
          "v": "Product / ServiceTest / ProductInventory · id {{bd_productInventoryId}}; removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "Product / ServiceTest / ProductInventory · id bd_productInventoryId; omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 21
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 22
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 23
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 24
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 25
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O BPMN segue a tabela. O exemplo muda @type e name. O id é um GUID do ServiceNow que nenhuma integração anterior traz.",
      "acao": "decidir",
      "acaoTexto": "Definir de onde vem o id do ProductInventory e se é obrigatório."
    },
    {
      "id": "R18",
      "grupo": "request",
      "nome": "relatedEntity testSpecification",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req (tabela e exemplo)",
      "bpmn": "@type Service · entity @type ServiceTest, name testSpecification, id \"spec-ftth-gpon-basico\" (fixo).",
      "valor": {
        "t": "fixo",
        "de": "'spec-ftth-gpon-basico'"
      },
      "fontes": {
        "DM": {
          "v": "Tabela: entity ServiceTest/testSpecification · id obrigatório GUID. Exemplo: @type Product, entity @type ProductInventory, id cf3e865a87d0321454bd42230cbb35cf",
          "r": "diverge"
        },
        "PM": {
          "v": "Service / ServiceTest / testSpecification · id \"spec-ftth-gpon-basico\" fixo",
          "r": "igual"
        },
        "QA": {
          "v": "Service / ServiceTest / testSpecification · id \"spec-ftth-gpon-basico\" fixo (ignora hpsdTestSpecificationId)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 26
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 27
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 28
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM pede um GUID do ServiceNow; o BPMN manda um código legível. O @type externo também difere do exemplo.",
      "acao": "bpmn",
      "acaoTexto": "Trocar pelo GUID da especificação de teste (config de ambiente)."
    },
    {
      "id": "R19",
      "grupo": "request",
      "nome": "relatedEntity relatedServiceSpecification",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "@type Service · entity Service/relatedServiceSpecification, id data_bd_relatedServiceSpecificationId. Omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START bd_relatedServiceSpecificationId → data_bd_relatedServiceSpecificationId (opcional; senão o item some)"
      },
      "fontes": {
        "DM": {
          "v": "Service/Service/relatedServiceSpecification · id obrigatório GUID · exemplo 8bee3a14…",
          "r": "parcial"
        },
        "PM": {
          "v": "Service / Service / relatedServiceSpecification · id {{bd_relatedServiceSpecificationId}}; removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "Service / Service / relatedServiceSpecification · id bd_relatedServiceSpecificationId; omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 29
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 30
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 31
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Estrutura igual. Sem valor no START, o item não vai.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem do GUID (fixo por oferta ou consulta)."
    },
    {
      "id": "R20",
      "grupo": "request",
      "nome": "relatedEntity relatedService",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "@type Service · entity Service/relatedService, id data_bd_relatedServiceId. Omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START bd_relatedServiceId → data_bd_relatedServiceId (opcional; senão o item some)"
      },
      "fontes": {
        "DM": {
          "v": "Service/Service/relatedService · id obrigatório GUID · exemplo b4c85c26…",
          "r": "parcial"
        },
        "PM": {
          "v": "Service / Service / relatedService · id {{bd_relatedServiceId}}; removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "Service / Service / relatedService · id bd_relatedServiceId; omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 32
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 33
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 34
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Estrutura igual. Sem valor no START, o item não vai.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem do GUID do serviço no ServiceNow."
    },
    {
      "id": "R21",
      "grupo": "request",
      "nome": "relatedEntity mode",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req · aba 621",
      "bpmn": "@type Service · entity Service/mode, id \"Proactive\" (fixo).",
      "valor": {
        "t": "fixo",
        "de": "'Proactive'"
      },
      "fontes": {
        "DM": {
          "v": "Service/Service/mode · id Proactive",
          "r": "igual"
        },
        "PM": {
          "v": "Service / Service / mode · id \"Proactive\" fixo",
          "r": "igual"
        },
        "QA": {
          "v": "Service / Service / mode · id \"Proactive\" fixo",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 35
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 36
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 37
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R22",
      "grupo": "request",
      "nome": "relatedParty (Customer, role)",
      "tipo": "object",
      "linha": "BPMN bodyTemplate · DM Req (tabela e exemplo) · aba 629",
      "bpmn": "Um item @type Customer, role \"Digital\". Só vai se houver id do cliente.",
      "valor": {
        "t": "fixo",
        "de": "'Customer' / 'Digital'"
      },
      "fontes": {
        "DM": {
          "v": "Tabela: role \"Digital\". Exemplo e aba 629: role \"Fênix\"",
          "r": "parcial"
        },
        "PM": {
          "v": "@type Customer, role \"Digital\"; item removido se id vazio",
          "r": "igual"
        },
        "QA": {
          "v": "@type Customer, role \"Digital\"; relatedParty vazio se não houver bd_customerId",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 38
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 39
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 40
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 12
        }
      ],
      "leitura": "O BPMN segue a tabela. O exemplo e a TMF629 usam \"Fênix\".",
      "acao": "fonte",
      "acaoTexto": "Fechar o valor de role no DM."
    },
    {
      "id": "R23",
      "grupo": "request",
      "nome": "partyOrPartyRole.id (cliente Salesforce)",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · aba 629",
      "bpmn": "data_bd_customerId ou data_wo_customerId. Sem valor, todo o relatedParty some.",
      "valor": {
        "t": "start",
        "de": "START wo_customerId → data_wo_customerId (sobrescrito por data_bd_customerId)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"id do cliente do Salesforce\" · {{som_tmf629_gen_externalid}} (exemplo: {some_tmf629_externalId}). Na 629 é obrigatório",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_customerId}}, padrão wo_customerId (preenchida pela 00 Consulta de Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_customerId, padrão wo_customerId (INT00 Asset: relatedParty[0].partyOrPartyRole.id)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 43
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 10
        }
      ],
      "leitura": "O campo bate. Mas o BPMN aceita ausência: sem ele o MS não cria o contato na TMF629 e o BD falha.",
      "acao": "bpmn",
      "acaoTexto": "Exigir wo_customerId no START."
    },
    {
      "id": "R24",
      "grupo": "request",
      "nome": "partyOrPartyRole @type / @referredType",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req",
      "bpmn": "@type Customer · @referredType CustomerContact (fixos).",
      "valor": {
        "t": "fixo",
        "de": "'Customer' / 'CustomerContact'"
      },
      "fontes": {
        "DM": {
          "v": "@type Customer (obrigatório) · @referredType CustomerContact (opcional)",
          "r": "igual"
        },
        "PM": {
          "v": "@type Customer · @referredType CustomerContact (fixos)",
          "r": "igual"
        },
        "QA": {
          "v": "@type Customer · @referredType CustomerContact (fixos)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 42
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 45
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R25",
      "grupo": "request",
      "nome": "partyOrPartyRole.name",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · aba 629",
      "bpmn": "data_bd_customerName ou data_wo_customerName.",
      "valor": {
        "t": "start",
        "de": "START wo_customerName → data_wo_customerName (sobrescrito por data_bd_customerName)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"Cliente Teste\". Na 629, name e engagedParty.name são obrigatórios",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_customerName}}, padrão wo_customerName (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_customerName, padrão wo_customerName (INT00 Asset); omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 44
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 11
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 15
        }
      ],
      "leitura": "Opcional na fronteira, obrigatório por dentro do MS.",
      "acao": "decidir",
      "acaoTexto": "Tratar como obrigatório no START."
    },
    {
      "id": "R26",
      "grupo": "request",
      "nome": "characteristic EmailContactMedium",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · aba 629",
      "bpmn": "data_bd_email ou data_wo_emailAddress. Item omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START wo_emailAddress → data_wo_emailAddress (sobrescrito por data_bd_email)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · contato@email.com. Na 629, contactMedium Email é obrigatório",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_email}}, padrão wo_emailAddress, não declarada (a collection tem woEmailAddress). Item removido se vazio",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_email, padrão wo_emailAddress (só formulário; o Asset não traz e o padrão da INT14 não vale aqui); omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 47
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 48
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 18
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 19
        }
      ],
      "leitura": "Opcional na fronteira, obrigatório na TMF629. No Postman direto, o padrão lê wo_emailAddress/wo_phoneNumber, que a collection não declara (tem woEmailAddress): sem bd_*, os contatos somem. Na tela de QA os contatos (R26, R27, C08, C09, C13, C14) só vêm do formulário: os padrões que a INT14 aplica não chegam ao BD.",
      "acao": "decidir",
      "acaoTexto": "Tratar como obrigatório no START ou confirmar default no MS."
    },
    {
      "id": "R27",
      "grupo": "request",
      "nome": "characteristic PhoneContactMedium",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · aba 629",
      "bpmn": "data_bd_phone, senão data_wo_phoneNumber, senão data_wo_mobileNumber. Item omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START wo_phoneNumber / wo_mobileNumber → data_wo_* (sobrescrito por data_bd_phone)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · 11900000000. Na 629, contactMedium Phone é obrigatório",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_phone}}, padrão wo_phoneNumber → wo_mobileNumber, ambas não declaradas. Item removido se vazio",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_phone, padrão wo_phoneNumber → wo_mobileNumber (só formulário); omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 49
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 50
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 18
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 20
        }
      ],
      "leitura": "Aqui o fixo vem antes do celular; em telefoneContatoLocal1 (C13) é o contrário.",
      "acao": "decidir",
      "acaoTexto": "Definir qual telefone é o contato principal."
    },
    {
      "id": "R28",
      "grupo": "request",
      "nome": "characteristic idCustomer (cliente ServiceNow)",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM Req · aba 629",
      "bpmn": "Só data_bd_serviceNowCustomerId. Item omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START bd_serviceNowCustomerId → data_bd_serviceNowCustomerId (opcional)"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"id do cliente do ServiceNow\" · {{som_tmf629_id_account}}. Na 629, relatedParty[].id (ID Cliente ServiceNow) é obrigatório",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_serviceNowCustomerId}}; item removido se vazio",
          "r": "igual"
        },
        "QA": {
          "v": "bd_serviceNowCustomerId; item omitido se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 51
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 52
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        },
        {
          "aba": "MS Trouble Ticket x SN(629) Req",
          "linha": 23
        }
      ],
      "leitura": "Dois ids de cliente: Salesforce (R23) e ServiceNow (este). O BPMN normalmente não manda o do ServiceNow, que a 629 exige.",
      "acao": "decidir",
      "acaoTexto": "Definir quem resolve o id ServiceNow do cliente: VE no START ou o MS."
    },
    {
      "id": "R29",
      "grupo": "request",
      "nome": "Timeout",
      "tipo": "config",
      "linha": "BPMN inputParameters · DFT slide 14",
      "bpmn": "connect 3000 ms · resposta 20000 ms · maxAttempts 1",
      "valor": {
        "t": "fixo",
        "de": "3000 / 20000 / 1"
      },
      "fontes": {
        "DFT": {
          "v": "INT18 Síncrona · Retry AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "POST usa 30000 ms (o timeoutMs 20000 da spec só vale para GET); editável de 1 a 30000; sem repetição",
          "r": "diverge"
        }
      },
      "leitura": "O MS faz duas chamadas (629 e 621) em série; 20 s pode ser curto. A tela de QA usa 30 s no POST porque o timeout da spec só vale para GET.",
      "acao": "decidir",
      "acaoTexto": "Validar o timeout com o SLA do MS Trouble Ticket."
    },
    {
      "id": "C00",
      "grupo": "caracteristicas",
      "nome": "troubleTicketCharacteristic[] (lista)",
      "tipo": "list",
      "linha": "BPMN bodyTemplate · DM Req · aba 621",
      "bpmn": "Sempre as 36, na ordem da tabela. Valor = calculada → data_bd_<nome> → padrão → \"\".",
      "valor": {
        "t": "fixo",
        "de": "Lista fixa de 36 nomes"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · ocorrência máx. 1 · 36 pares name (obrigatório) / value (opcional)",
          "r": "parcial"
        },
        "PM": {
          "v": "36 nomes na mesma ordem do BPMN; todos enviados, mesmo com valor vazio",
          "r": "igual"
        },
        "QA": {
          "v": "CARACTERISTICAS_BD: 36 nomes na ordem do BPMN; todos enviados, value \"\" se vazio",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 53
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Nomes e ordem batem. A cardinalidade máx. 1 do DM não fecha com 36 itens. 18 das 36 vão vazias salvo data_bd_*.",
      "acao": "fonte",
      "acaoTexto": "Corrigir a cardinalidade no DM (0..N)."
    },
    {
      "id": "C01",
      "grupo": "caracteristicas",
      "nome": "estadoDescricao",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_stateOrProvince (o mesmo da INT14).",
      "valor": {
        "t": "start",
        "de": "START wo_stateOrProvince → data_wo_stateOrProvince (sobrescrito por data_bd_estadoDescricao)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"São Paulo\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_estadoDescricao}}, padrão wo_stateOrProvince (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_estadoDescricao, padrão wo_stateOrProvince (Asset, por extenso; sem a sigla que a INT14 usa)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 54
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 55
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM mostra o nome do estado; o BPMN reusa o stateOrProvince do endereço da WO. Formato a confirmar.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se vai a UF ou o nome por extenso."
    },
    {
      "id": "C02",
      "grupo": "caracteristicas",
      "nome": "city",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_city",
      "valor": {
        "t": "start",
        "de": "START wo_city → data_wo_city (sobrescrito por data_bd_city)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"São Paulo\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_city}}, padrão wo_city (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_city, padrão wo_city (INT00 Asset)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 56
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 57
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C03",
      "grupo": "caracteristicas",
      "nome": "endBairro",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_neighborhood",
      "valor": {
        "t": "start",
        "de": "START wo_neighborhood → data_wo_neighborhood (sobrescrito por data_bd_endBairro)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Campo Belo\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_endBairro}}, padrão wo_neighborhood (00 Asset: locality)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_endBairro, padrão wo_neighborhood (INT00 Asset: locality)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 58
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 59
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C04",
      "grupo": "caracteristicas",
      "nome": "postcode",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req (tabela e exemplo)",
      "bpmn": "data_wfmPostcode (o mesmo da INT11/INT14).",
      "valor": {
        "t": "start",
        "de": "START wfmPostcode → data_wfmPostcode (sobrescrito por data_bd_postcode)"
      },
      "fontes": {
        "US": {
          "v": "US10/US11 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"ENDEREÇO\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Tabela 4605003; exemplo \"04605003\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_postcode}}, padrão wfmPostcode",
          "r": "igual"
        },
        "QA": {
          "v": "bd_postcode, padrão wfmPostcode (INT00 Asset ou formulário)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 60
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 61
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "A tabela perdeu o zero à esquerda (efeito do Excel). O exemplo, com 8 dígitos, é o correto.",
      "acao": "fonte",
      "acaoTexto": "Corrigir o exemplo da tabela para 04605003."
    },
    {
      "id": "C05",
      "grupo": "caracteristicas",
      "nome": "telephonicArea",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wfmTelephonicArea",
      "valor": {
        "t": "start",
        "de": "START wfmTelephonicArea → data_wfmTelephonicArea (sobrescrito por data_bd_telephonicArea)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"CB\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_telephonicArea}}, padrão wfmTelephonicArea",
          "r": "igual"
        },
        "QA": {
          "v": "bd_telephonicArea, padrão wfmTelephonicArea (formulário; com VIVO1 preenche \"CB\")",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 62
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 63
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C06",
      "grupo": "caracteristicas",
      "nome": "streetName",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_streetName",
      "valor": {
        "t": "start",
        "de": "START wo_streetName → data_wo_streetName (sobrescrito por data_bd_streetName)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Rua Constantino de Sousa\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_streetName}}, padrão wo_streetName (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_streetName, padrão wo_streetName (INT00 Asset)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 64
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 65
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C07",
      "grupo": "caracteristicas",
      "nome": "streetNr",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_streetNr",
      "valor": {
        "t": "start",
        "de": "START wo_streetNr → data_wo_streetNr (sobrescrito por data_bd_streetNr)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"1437\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_streetNr}}, padrão wo_streetNr (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_streetNr, padrão wo_streetNr (INT00 Asset)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 66
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 67
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C08",
      "grupo": "caracteristicas",
      "nome": "complement",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req (tabela e exemplo)",
      "bpmn": "data_wo_complement",
      "valor": {
        "t": "start",
        "de": "START wo_complement → data_wo_complement (sobrescrito por data_bd_complement)"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"A\"; exemplo \"\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_complement}}, padrão wo_complement (não declarada nem preenchida pela 00 Asset)",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_complement, padrão wo_complement (só formulário; sem o padrão da INT14)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 68
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 69
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado. Tabela e exemplo diferem só no valor ilustrativo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C09",
      "grupo": "caracteristicas",
      "nome": "reclamanteNome",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_contactName",
      "valor": {
        "t": "start",
        "de": "START wo_contactName → data_wo_contactName (sobrescrito por data_bd_reclamanteNome)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"CONTATO TERÇA II\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_reclamanteNome}}, padrão wo_contactName (não declarada nem preenchida pela 00 Asset)",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_reclamanteNome, padrão wo_contactName (só formulário; sem o padrão da INT14)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 70
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 71
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C10",
      "grupo": "caracteristicas",
      "nome": "documentNumber",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_documentNumber",
      "valor": {
        "t": "start",
        "de": "START wo_documentNumber → data_wo_documentNumber (sobrescrito por data_bd_documentNumber)"
      },
      "fontes": {
        "US": {
          "v": "US10/US11 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"CNPJ\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Exemplo \"27212650000157\" (CNPJ sem máscara)",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_documentNumber}}, padrão wo_documentNumber (00 Asset)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_documentNumber, padrão wo_documentNumber (INT00 Asset)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 72
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 73
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C11",
      "grupo": "caracteristicas",
      "nome": "clienteClassificacao",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_clienteClassificacao.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_clienteClassificacao"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Varejo\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_clienteClassificacao}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_clienteClassificacao do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 74
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 75
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM mostra valor; o BPMN não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START ou deixar vazio)."
    },
    {
      "id": "C12",
      "grupo": "caracteristicas",
      "nome": "contatoLocal",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_contatoLocal.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_contatoLocal"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"CFB\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_contatoLocal}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_contatoLocal do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 76
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 77
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM mostra valor; o BPMN não tem origem. Poderia ser o mesmo contato de reclamanteNome.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START ou deixar vazio)."
    },
    {
      "id": "C13",
      "grupo": "caracteristicas",
      "nome": "telefoneContatoLocal1",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "data_wo_mobileNumber, senão data_wo_phoneNumber.",
      "valor": {
        "t": "start",
        "de": "START wo_mobileNumber / wo_phoneNumber → data_wo_* (sobrescrito por data_bd_telefoneContatoLocal1)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"11997899090\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_telefoneContatoLocal1}}, padrão wo_mobileNumber → wo_phoneNumber, ambas não declaradas",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_telefoneContatoLocal1, padrão wo_mobileNumber → wo_phoneNumber (só formulário)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 78
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 79
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C14",
      "grupo": "caracteristicas",
      "nome": "telefoneContatoLocal2",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req (tabela e exemplo)",
      "bpmn": "data_wo_workNumber",
      "valor": {
        "t": "start",
        "de": "START wo_workNumber → data_wo_workNumber (sobrescrito por data_bd_telefoneContatoLocal2)"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"11997899090\" (igual ao 1); exemplo \"11997988989\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_telefoneContatoLocal2}}, padrão wo_workNumber (não declarada nem preenchida pela 00 Asset)",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_telefoneContatoLocal2, padrão wo_workNumber (só formulário)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 80
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 81
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado. Tabela e exemplo diferem só no valor ilustrativo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C15",
      "grupo": "caracteristicas",
      "nome": "motivo",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_motivo.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_motivo"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Reparos banda larga - Fixa Básica\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_motivo}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_motivo do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 82
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 83
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Parece um domínio do ServiceNow (motivo de reparo). O BPMN não manda.",
      "acao": "decidir",
      "acaoTexto": "Pedir o domínio de motivo e definir um valor fixo para a jornada."
    },
    {
      "id": "C16",
      "grupo": "caracteristicas",
      "nome": "submotivo",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_submotivo.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_submotivo"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Teste Lucas\" (placeholder)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_submotivo}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_submotivo do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 84
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 85
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM não traz valor real.",
      "acao": "decidir",
      "acaoTexto": "Pedir o domínio de submotivo."
    },
    {
      "id": "C17",
      "grupo": "caracteristicas",
      "nome": "SLA",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_SLA.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_SLA"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo vazio \"\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_SLA}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_SLA do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 86
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 87
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Vazio nos dois.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C18",
      "grupo": "caracteristicas",
      "nome": "tipoDescricao",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_tipoDescricao.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_tipoDescricao"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Internet Básica\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_tipoDescricao}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_tipoDescricao do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 88
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 89
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Dado do produto; o BPMN não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START com dados do produto ou deixar vazio)."
    },
    {
      "id": "C19",
      "grupo": "caracteristicas",
      "nome": "tipoOferta",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_tipoOferta.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_tipoOferta"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"VIVO Fibra 500 Mega Empresas\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_tipoOferta}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_tipoOferta do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 90
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 91
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Dado do produto; o BPMN não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START com dados do produto ou deixar vazio)."
    },
    {
      "id": "C20",
      "grupo": "caracteristicas",
      "nome": "designadorAcesso",
      "tipo": "string",
      "linha": "BPMN calculadas · DM Req",
      "bpmn": "Calculada: data_designador (o mesmo da INT01/INT03). data_bd_designadorAcesso não sobrescreve.",
      "valor": {
        "t": "start",
        "de": "START designador → data_designador"
      },
      "fontes": {
        "US": {
          "v": "US10/US11 CA001 Postman/Observações: TAGs \"a serem preenchidas: (confirmar quais TAGs precisam)\" lista \"ID DO DESIGNADOR\", sem dizer de onde vem nem o formato",
          "r": "parcial"
        },
        "DM": {
          "v": "Exemplo \"SPO-SF703229-069\" (designador de acesso)",
          "r": "diverge"
        },
        "PM": {
          "v": "{{bd_designadorAcesso}}, padrão {{designador}}: bd_ vence, ao contrário do BPMN",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_designadorAcesso, padrão designador (Asset idDesignador ou formulário): bd_ vence, ao contrário do BPMN",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 92
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 93
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM pede o designador de acesso (069). data_designador, na prática, é o de serviço (013), como já visto na INT03. A tela de QA repete a precedência do Postman (bd_ vence o calculado).",
      "acao": "bpmn",
      "acaoTexto": "Usar uma variável própria com o designador de acesso (069)."
    },
    {
      "id": "C21",
      "grupo": "caracteristicas",
      "nome": "velocidade",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_velocidade.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_velocidade"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"500Mbps\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_velocidade}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_velocidade do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 94
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 95
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Dado do produto; o BPMN não tem origem.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START com dados do produto ou deixar vazio)."
    },
    {
      "id": "C22",
      "grupo": "caracteristicas",
      "nome": "servicoCpccNome",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_servicoCpccNome.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_servicoCpccNome"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Óptico GPON\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_servicoCpccNome}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_servicoCpccNome do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 96
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 97
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O BPMN já usa GPON como padrão de tecnologia na INT11/INT14, mas não aqui.",
      "acao": "decidir",
      "acaoTexto": "Definir se vai fixo (\"Óptico GPON\") ou pelo START."
    },
    {
      "id": "C23",
      "grupo": "caracteristicas",
      "nome": "WorkOrder",
      "tipo": "string",
      "linha": "BPMN calculadas · DM Req",
      "bpmn": "Calculada: data_woNumero (idWorkOrder da INT14; reserva: id gerado VE+UUID).",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US08, US10 e US11 Workflow: \"Elastic Journey deve gerar o ID do WO para usar a frente no fluxo sistêmico\"",
          "r": "parcial"
        },
        "DM": {
          "v": "Exemplo \"SFTWO40439651\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_WorkOrder}}, padrão {{woNumero}} (gravado pela INT14). bd_ vence; sem reserva VE+UUID",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_WorkOrder, padrão woNumero (INT14 ou digitado). bd_ vence; sem reserva VE+UUID",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 98
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 99
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Origem correta. O formato do exemplo (SFTWO…) difere do id que a jornada gera (VE+UUID). A tela de QA também deixa bd_ vencer.",
      "acao": "decidir",
      "acaoTexto": "Confirmar o formato do id da WO esperado pelo ServiceNow."
    },
    {
      "id": "C24",
      "grupo": "caracteristicas",
      "nome": "WorkOrderItem",
      "tipo": "string",
      "linha": "BPMN calculadas · DM Req",
      "bpmn": "Calculada: data_woItemId (idWorkOrderItem da INT14), sem composição.",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woItemId"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"SFTWO40439651:SFTWOI40439651\" (WO:item)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_WorkOrderItem}}, padrão {{woItemId}} (gravado pela INT14). bd_ vence",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_WorkOrderItem, padrão woItemId (INT14). bd_ vence",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 100
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 101
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O exemplo sugere o formato WO:item; o BPMN manda o item como veio da INT14. A tela de QA também deixa bd_ vencer.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se o valor é composto (WorkOrder:WorkOrderItem)."
    },
    {
      "id": "C25",
      "grupo": "caracteristicas",
      "nome": "etapa",
      "tipo": "string",
      "linha": "BPMN padrão · DM Req",
      "bpmn": "\"TRIAGEM\" (padrão).",
      "valor": {
        "t": "fixo",
        "de": "'TRIAGEM' (sobrescrito por data_bd_etapa)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"TRIAGEM\"",
          "r": "igual"
        },
        "PM": {
          "v": "{{bd_etapa}}, padrão \"TRIAGEM\"",
          "r": "igual"
        },
        "QA": {
          "v": "bd_etapa, padrão \"TRIAGEM\"",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 102
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 103
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C26",
      "grupo": "caracteristicas",
      "nome": "telefoneTitular1",
      "tipo": "string",
      "linha": "BPMN lista · DM Req (tabela e exemplo)",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_telefoneTitular1.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_telefoneTitular1"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"12000000000\"; exemplo \"11999999999\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_telefoneTitular1}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_telefoneTitular1 do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 104
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 105
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O BPMN tem telefones do contato (data_wo_*), mas não do titular.",
      "acao": "decidir",
      "acaoTexto": "Definir se reusa data_wo_phoneNumber ou vem do START."
    },
    {
      "id": "C27",
      "grupo": "caracteristicas",
      "nome": "telefoneTitular2",
      "tipo": "string",
      "linha": "BPMN lista · DM Req (tabela e exemplo)",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_telefoneTitular2.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_telefoneTitular2"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"12000000000\"; exemplo \"11999999999\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_telefoneTitular2}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_telefoneTitular2 do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 106
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 107
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Mesmo caso de telefoneTitular1.",
      "acao": "decidir",
      "acaoTexto": "Definir junto com telefoneTitular1."
    },
    {
      "id": "C28",
      "grupo": "caracteristicas",
      "nome": "telefoneReclamante1",
      "tipo": "string",
      "linha": "BPMN lista · DM Req (tabela e exemplo)",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_telefoneReclamante1.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_telefoneReclamante1"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"12000000000\"; exemplo \"11999999999\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_telefoneReclamante1}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_telefoneReclamante1 do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 108
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 109
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O reclamante (reclamanteNome) vem de data_wo_contactName, mas o telefone dele vai vazio.",
      "acao": "decidir",
      "acaoTexto": "Definir se reusa data_wo_mobileNumber."
    },
    {
      "id": "C29",
      "grupo": "caracteristicas",
      "nome": "telefoneReclamante2",
      "tipo": "string",
      "linha": "BPMN lista · DM Req (tabela e exemplo)",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_telefoneReclamante2.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_telefoneReclamante2"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"12000000000\"; exemplo \"11999999999\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_telefoneReclamante2}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_telefoneReclamante2 do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 110
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 111
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Mesmo caso de telefoneReclamante1.",
      "acao": "decidir",
      "acaoTexto": "Definir junto com telefoneReclamante1."
    },
    {
      "id": "C30",
      "grupo": "caracteristicas",
      "nome": "horarioFuncionamento",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_horarioFuncionamento.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_horarioFuncionamento"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"08:30 - 16:30\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_horarioFuncionamento}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_horarioFuncionamento do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 112
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 113
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Nenhuma tela coleta esse dado.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START ou deixar vazio)."
    },
    {
      "id": "C31",
      "grupo": "caracteristicas",
      "nome": "preferenciaContato",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_preferenciaContato.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_preferenciaContato"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Manhã (8h - 10h)\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_preferenciaContato}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_preferenciaContato do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 114
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 115
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Nenhuma tela coleta esse dado.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem (START ou deixar vazio)."
    },
    {
      "id": "C32",
      "grupo": "caracteristicas",
      "nome": "palitagemFinal",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_palitagemFinal.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_palitagemFinal"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Bilhete emitido\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_palitagemFinal}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_palitagemFinal do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 116
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 117
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Parece constante para a jornada, mas o BPMN não manda.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se é fixo (\"Bilhete emitido\")."
    },
    {
      "id": "C33",
      "grupo": "caracteristicas",
      "nome": "previsaoAtendimento",
      "tipo": "string",
      "linha": "BPMN calculadas · DM Req",
      "bpmn": "Calculada do slot: \"dd/MM/yyyy HH:mm-HH:mm\" no fuso America/Sao_Paulo; sem fim, só a hora de início.",
      "valor": {
        "t": "integracao",
        "de": "INT11 + tela → data_slotEscolhido (start/end)"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"12/01/2026 13:30-15:30\"",
          "r": "igual"
        },
        "PM": {
          "v": "Calcula \"dd/MM/yyyy HH:mm-HH:mm\" (São Paulo) de slotInicio/slotFim, mas só se bd_previsaoAtendimento vier vazio",
          "r": "parcial"
        },
        "QA": {
          "v": "Calcula \"dd/MM/yyyy HH:mm-HH:mm\" (São Paulo) do slot; sem fim, só o início. Só se bd_previsaoAtendimento vier vazio",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 118
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 119
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "Formato igual ao exemplo. Se data_slotEscolhido faltar ou vier sem fuso, o script do body quebra (incidente, não falha tratada). Na tela de QA e no Postman, bd_ vence o cálculo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "C34",
      "grupo": "caracteristicas",
      "nome": "caseOrigin",
      "tipo": "string",
      "linha": "BPMN lista · DM Req",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_caseOrigin.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_caseOrigin"
      },
      "fontes": {
        "DM": {
          "v": "Exemplo \"Email\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_caseOrigin}}, sem padrão (vazio)",
          "r": "igual"
        },
        "QA": {
          "v": "bd_caseOrigin do formulário, sem padrão (vazio)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 120
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 121
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O exemplo não combina com o canal da jornada (VE / Alert).",
      "acao": "decidir",
      "acaoTexto": "Definir o valor de caseOrigin para o VE."
    },
    {
      "id": "C35",
      "grupo": "caracteristicas",
      "nome": "payloadDiagnostico",
      "tipo": "string (JSON)",
      "linha": "BPMN calculadas · DM Req",
      "bpmn": "Calculada: data_resumoDiagnostico = JSON {serviceTestId, httpStatus, state, resultadoDiagnostico}.",
      "valor": {
        "t": "integracao",
        "de": "INT10 → data_resumoDiagnostico"
      },
      "fontes": {
        "DFT": {
          "v": "Envia os dados \"de diagnóstico\"",
          "r": "parcial"
        },
        "DM": {
          "v": "Exemplo: evento ServiceTestCreateEvent completo escapado (serviceTest, characteristic, testMeasure[] com logs)",
          "r": "diverge"
        },
        "PM": {
          "v": "{{bd_payloadDiagnostico}}, sem cálculo nem padrão: vai vazio salvo preenchimento manual",
          "r": "parcial"
        },
        "QA": {
          "v": "bd_payloadDiagnostico sem cálculo: a tela não consome a INT10 e manda vazio, salvo preenchimento manual",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 122
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 123
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O DM espera o evento inteiro do HPSD; o BPMN manda um resumo de 4 campos. O motivo é o limite de 4000 caracteres das variáveis String do Camunda. A tela de QA também manda vazio: não consome a INT10.",
      "acao": "decidir",
      "acaoTexto": "Aceitar o resumo ou guardar o evento como variável Json/Bytes para enviar completo."
    },
    {
      "id": "C36",
      "grupo": "caracteristicas",
      "nome": "idAppointment",
      "tipo": "string",
      "linha": "BPMN lista · DM Req (tabela e exemplo)",
      "bpmn": "Sem cálculo nem padrão. Vazio salvo data_bd_idAppointment. A INT14 grava data_woIdWork, que não é usado aqui.",
      "valor": {
        "t": "nenhum",
        "de": "vai vazio salvo data_bd_idAppointment"
      },
      "fontes": {
        "DM": {
          "v": "Tabela \"135000000\"; exemplo \"134567890\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{bd_idAppointment}}, sem padrão. Descrição: não inferir de idWork",
          "r": "igual"
        },
        "QA": {
          "v": "bd_idAppointment, sem padrão; o woIdWork da INT14 não é usado",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 124
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 125
        },
        {
          "aba": "Camunda x MS Trouble Ticket Req",
          "linha": 127
        }
      ],
      "leitura": "O agendamento já existe quando o BD é aberto. O id dele provavelmente é o idWork devolvido pela INT14.",
      "acao": "bpmn",
      "acaoTexto": "Confirmar que idAppointment = idWork e calcular de data_woIdWork."
    },
    {
      "id": "C37",
      "grupo": "caracteristicas",
      "nome": "clienteSegmento / nomeTitular",
      "tipo": "string",
      "linha": "DM aba 621 (exemplo MS → ServiceNow)",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "BPMN não envia"
      },
      "fontes": {
        "DM": {
          "v": "Só no exemplo da 621: clienteSegmento \"Joãozinho\" e nomeTitular \"CONTATO TERÇA II\" (38 características). Ausentes na aba Camunda",
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
          "aba": "621-MS Trouble Ticke x SN- Req",
          "linha": 39
        }
      ],
      "leitura": "O MS manda ao ServiceNow 2 características que não recebe do Camunda. Ou o MS preenche, ou falta na fronteira.",
      "acao": "fonte",
      "acaoTexto": "Confirmar com o dono do MS quem preenche essas duas."
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 / 201 = BD criado",
      "tipo": "status",
      "linha": "BPMN Node_TrataBDCriado · US11 · DM aba 629 Resp",
      "bpmn": "Status 200 ou 201 → data_bdCriado = true. Não confere o corpo.",
      "valor": {
        "t": "resposta",
        "de": "Node_CriaBD-status → data_bdCriado"
      },
      "fontes": {
        "US": {
          "v": "US11 Req01 Resultado esperado: \"Service Now/Salesforce informa ao Elastic Journey que o BD foi criado com sucesso\" · CA001: \"o BD foi criado com sucesso no Service Now/Salesforce\"",
          "r": "igual"
        },
        "DFT": {
          "v": "Passo 6: MS consolida 629/621 e devolve o resultado",
          "r": "igual"
        },
        "DM": {
          "v": "Aba Camunda Resp sem status HTTP. Aba 629 Resp: 201",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste aceita 200 ou 201",
          "r": "igual"
        },
        "QA": {
          "v": "Aceita 200/201, mas só marca bdCriado se o corpo trouxer id; sem id ou número fica \"fora do contrato\"",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "aba": "MS Trouble Ticke x SN(629) Resp",
          "linha": 42
        }
      ],
      "leitura": "Diferente da INT14, o sucesso não exige id no corpo. Um 200 sem externalIdentifier conta como BD criado. A tela de QA é mais rígida: sem id no corpo, não marca bdCriado.",
      "acao": "bpmn",
      "acaoTexto": "Exigir id ou externalIdentifier.id para considerar sucesso."
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "id",
      "tipo": "string",
      "linha": "BPMN Node_TrataBDCriado · DM Resp",
      "bpmn": "→ data_bdCriadoId",
      "valor": {
        "t": "resposta",
        "de": "body.id → data_bdCriadoId"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · \"id interno\" · de184581871ecb10f2bc0d860cbb354e",
          "r": "igual"
        },
        "PM": {
          "v": "Teste exige body.id string não vazia; não grava variável",
          "r": "igual"
        },
        "QA": {
          "v": "Check exige id; mostra no detalhe e usa para marcar bdCriado",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 8
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 43
        }
      ],
      "leitura": "Gravado, mas nada na jornada usa.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "externalIdentifier.id (número do BD)",
      "tipo": "string",
      "linha": "BPMN Node_TrataBDCriado · DM Resp · US11 · DFT",
      "bpmn": "→ data_bdCriadoNumero. A tela de sucesso não mostra.",
      "valor": {
        "t": "resposta",
        "de": "body.externalIdentifier.id → data_bdCriadoNumero"
      },
      "fontes": {
        "US": {
          "v": "Escopo de todas as US (US10 e US11 inclusive): \"PARA possibilitar que o cliente tenha um BD aberto (se necessário) e o VE (Vivo Empresas) informe o ID do BD ao cliente\" · US11 Workflow: \"Elastic Journey informa ao VE que o BD foi criado com sucesso\"",
          "r": "parcial"
        },
        "DFT": {
          "v": "Passo 5: ServiceNow retorna o número do BD",
          "r": "igual"
        },
        "DM": {
          "v": "Opcional · \"Número do BD no SN\" · SPC0001432",
          "r": "igual"
        },
        "PM": {
          "v": "Teste exige externalIdentifier.id string não vazia; não grava variável",
          "r": "igual"
        },
        "QA": {
          "v": "Check exige externalIdentifier.id; vira o resumo \"BD <número>\"",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 39
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 40
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 41
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 43
        }
      ],
      "leitura": "O número é gravado, mas Node_VisitaAgendada só mostra data e período da visita. A US pede que o cliente receba o ID do BD.",
      "acao": "bpmn",
      "acaoTexto": "Mostrar data_bdCriadoNumero na tela de sucesso."
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "status",
      "tipo": "string",
      "linha": "DM Resp · DFT slide 10",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "BPMN não lê"
      },
      "fontes": {
        "DFT": {
          "v": "Passo 5: retorna \"status inicial\"",
          "r": "so-fonte"
        },
        "DM": {
          "v": "Opcional · \"New\"",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não lê; só aparece no corpo bruto exibido",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 16
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 43
        }
      ],
      "leitura": "Informativo. O BPMN decide só pelo HTTP.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "Demais campos do ticket",
      "tipo": "object",
      "linha": "DM Resp (tabela e exemplo)",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "BPMN não lê"
      },
      "fontes": {
        "DM": {
          "v": "href, creationDate, lastUpdate, description, severity \"3 - Moderate\", ticketType, name, @type, channel.name, relatedParty[] (customer, customer_contact, assignment_group, assigned_to), note[]. Tabela traz datas como serial do Excel (46226.72…); exemplo traz \"2026-07-23 17:22:29\"",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não lê; só aparece no corpo bruto exibido",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 7
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 43
        }
      ],
      "leitura": "A jornada não precisa. A tabela tem as datas corrompidas pelo Excel.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "Headers da resposta",
      "tipo": "header",
      "linha": "DM Resp",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "BPMN não lê"
      },
      "fontes": {
        "DM": {
          "v": "X-Vivo-Transaction-Id e X-Vivo-Correlation-Id obrigatórios",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Exibe os headers da resposta; não valida",
          "r": "igual"
        }
      },
      "dm": [
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 5
        },
        {
          "aba": "Camunda x MS Trouble Ticke Resp",
          "linha": 6
        }
      ],
      "leitura": "Só rastreabilidade.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "Erro HTTP (4xx/5xx)",
      "tipo": "status",
      "linha": "BPMN Node_TrataBDCriado · US10 · DM Resp",
      "bpmn": "Qualquer status fora de 200/201 = BD não criado; conta 1 tentativa. Corpo do erro não é lido.",
      "valor": {
        "t": "resposta",
        "de": "Node_CriaBD-status → data_bdCriado = false"
      },
      "fontes": {
        "US": {
          "v": "US10 Req01–Req03: \"Service Now/Salesforce informa ao Elastic Journey que o BD não foi criado\" (sem códigos nem formato de erro)",
          "r": "igual"
        },
        "DM": {
          "v": "Sem formato de erro na aba Camunda Resp",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste falha fora de 200/201; corpo do erro não é lido",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: HTTP 500 em 106 ms (path /customtokensfa/servicenow/token). Fora de 200/201 = fora do contrato; corpo não lido",
          "r": "igual"
        }
      },
      "leitura": "Sem contrato de erro, o BPMN não distingue erro de dados (que não melhora na retentativa) de erro transitório.",
      "acao": "fonte",
      "acaoTexto": "Pedir ao dono do DM o formato e os códigos de erro."
    },
    {
      "id": "S08",
      "grupo": "response",
      "nome": "Falha técnica (timeout/conexão)",
      "tipo": "evento",
      "linha": "BPMN boundary Node_CriaBD_FalhaTecnica",
      "bpmn": "Boundary → Node_TrataBDCriado; conta como tentativa falha.",
      "valor": {
        "t": "resposta",
        "de": "errorCodeVariable → Node_CriaBD-status"
      },
      "fontes": {
        "US": {
          "v": "US10 trata só \"o BD não foi criado\", sem separar falha técnica (timeout) de recusa do ServiceNow",
          "r": "igual"
        },
        "QA": {
          "v": "Timeout ou rede = estado falha, sem repetir (POST); não há contador de tentativas",
          "r": "parcial"
        }
      },
      "leitura": "Coerente com a US. Risco: um timeout depois de o MS ter criado o BD gera BD duplicado na retentativa.",
      "acao": "decidir",
      "acaoTexto": "Avaliar consulta (INT03) antes de retentar após timeout."
    },
    {
      "id": "S09",
      "grupo": "response",
      "nome": "Tela de sucesso (Node_VisitaAgendada)",
      "tipo": "tela",
      "linha": "BPMN Node_TrataBDCriado · screens.json · US11",
      "bpmn": "Copia data_dataVisita para form_dataVisita; tela mostra form.dataVisita e data.woHorario.",
      "valor": {
        "t": "integracao",
        "de": "INT11 + tela → data_dataVisita → form_dataVisita"
      },
      "fontes": {
        "US": {
          "v": "US11 Req01 Resultado esperado: \"SDUI Elastic Journey informa (através de pooling em fila do Redis) BFF/VE (API+tela/figma) que a visita técnica foi agendada com sucesso\" · CA001 igual · Workflow também: \"informa ao VE que o BD foi criado com sucesso\"",
          "r": "igual"
        }
      },
      "leitura": "Bate com o requisito da US11. Falta só o número do BD (ver S03).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T01",
      "grupo": "retentativa",
      "nome": "Gatilho da abertura",
      "tipo": "regra",
      "linha": "BPMN Flow_DecWOCriada_CriaBD · US10/11",
      "bpmn": "Só com data_woCriada = true (INT14 OK).",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woCriada"
      },
      "fontes": {
        "US": {
          "v": "US10 Req01 e US11 Req01: depois que o \"WFM informa ... que o agendamento foi concluído com sucesso\", o \"Elastic Journey deve chamar o Service Now/Salesforce ... para a criação de BD\"",
          "r": "igual"
        },
        "DFT": {
          "v": "INT18 depois de INT14–INT17",
          "r": "igual"
        },
        "QA": {
          "v": "Só dispara com slot e woNumero (INT14 ou digitado); corpo manual completo ignora a dependência",
          "r": "parcial"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T02",
      "grupo": "retentativa",
      "nome": "Contador data_tentativasBD",
      "tipo": "regra",
      "linha": "BPMN Node_TrataWO / Node_TrataBDCriado · US10",
      "bpmn": "Zerado ao criar a WO; +1 a cada resposta ou falha técnica.",
      "valor": {
        "t": "gerado",
        "de": "Node_TrataWO = 0 → Node_TrataBDCriado + 1"
      },
      "fontes": {
        "US": {
          "v": "US10 Workflow: \"Elastic Journey deve retentar o processo 3 vezes ao todo. Retentativa maior que 3, criação do BD não foi bem-sucedido\" · Req01–Req03 numeram 1ª, 2ª e \"3º e última vez\"",
          "r": "igual"
        }
      },
      "leitura": "Alinhado: 3 tentativas no total.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T03",
      "grupo": "retentativa",
      "nome": "Pergunta ao cliente (Node_RetentarBD)",
      "tipo": "tela",
      "linha": "BPMN Flow_DecBDCriado_RetentarBD · Node_DecRetentarBD · US10",
      "bpmn": "Falha com menos de 3 tentativas → tela; form_retentarBD = \"sim\" volta ao Node_CriaBD; outro valor segue para cancelar.",
      "valor": {
        "t": "tela",
        "de": "form_retentarBD (sim / nao)"
      },
      "fontes": {
        "US": {
          "v": "US10 Req02/Req03 Ações: \"SDUI Elastic Journey informa (através de pooling em fila do Redis) ao BFF/VE que a criação do BD falhou, e cliente deve responder se deseja tentar novamente\" · Workflow: \"SIM: deseja retentar → Elastic Journey volta a acionar o Service Now\"",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T04",
      "grupo": "retentativa",
      "nome": "Retentativa automática",
      "tipo": "regra",
      "linha": "BPMN maxAttempts · US10 CA002/CA003 · DFT slide 14",
      "bpmn": "Não há: maxAttempts = 1; toda nova tentativa depende do cliente.",
      "valor": {
        "t": "fixo",
        "de": "maxAttempts = 1"
      },
      "fontes": {
        "US": {
          "v": "US10 Req02/Req03: nova tentativa só depois que o \"VE/BFF informa ao Elastic Journey que cliente optou por tentar novamente\" · CA002/CA003 chamam de \"retentativa automática (2º vez)\"",
          "r": "parcial"
        },
        "DFT": {
          "v": "Retry AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "Não há: só GET de leitura é repetido; nova tentativa é reexecução manual",
          "r": "igual"
        }
      },
      "leitura": "Os requisitos da US batem com o BPMN; o texto dos critérios de aceite é ambíguo.",
      "acao": "fonte",
      "acaoTexto": "Ajustar o texto dos CAs da US10."
    },
    {
      "id": "T05",
      "grupo": "retentativa",
      "nome": "3ª falha",
      "tipo": "regra",
      "linha": "BPMN Flow_DecBDCriado_DecWOIdentificadaBD · US10 Req. 03",
      "bpmn": "Sem pergunta: segue direto para cancelar a WO e mostra \"BD não criado\".",
      "valor": {
        "t": "gerado",
        "de": "data_tentativasBD >= 3"
      },
      "fontes": {
        "US": {
          "v": "US10 Req03 Resultado esperado: na 3ª falha, \"SDUI ... informa ... ao BFF/VE que a criação do BD falhou\" e \"Elastic Journey deve chamar o WFM ... solicitando o cancelamento da WO\" · CA003: \"informar ao BFF/VE que a criação do BD não foi concluída. E o Elastic Journey solicita o cancelamento da WO\"",
          "r": "parcial"
        }
      },
      "leitura": "Alinhado. A US10 Req03 informa o VE antes de cancelar; o BPMN cancela e só depois mostra a tela (mesma inversão da T06).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T06",
      "grupo": "retentativa",
      "nome": "Cliente recusa",
      "tipo": "regra",
      "linha": "BPMN Flow_DecRetentarBD_DecWOIdentificadaBD · US10 Req. 04",
      "bpmn": "Cancela a WO e depois mostra \"BD não criado\".",
      "valor": {
        "t": "tela",
        "de": "form_retentarBD != sim"
      },
      "fontes": {
        "US": {
          "v": "US10 Req04 e CA004: cliente diz NÃO → \"SDUI Elastic Journey informa ... ao BFF/VE encerrar a chamada junto ao cliente\" e depois \"chamar o WFM ... solicitando o cancelamento da WO\" · Workflow: \"Posteriormente Elastic Journey deve chamar o WFM para cancelar a WO criada\"",
          "r": "parcial"
        }
      },
      "leitura": "Mesma regra, ordem invertida: o BPMN espera o cancelamento antes de mostrar a tela final.",
      "acao": "nada",
      "acaoTexto": "Ordem aceitável; só confirmar com o negócio."
    },
    {
      "id": "T07",
      "grupo": "retentativa",
      "nome": "Há WO para cancelar?",
      "tipo": "regra",
      "linha": "BPMN Node_DecWOIdentificadaBD",
      "bpmn": "data_woNumero != null. Neste caminho é sempre verdadeiro (a WO foi criada).",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US10 Req03/Req04: \"solicitando o cancelamento da WO\" (a WO foi criada antes do BD)",
          "r": "igual"
        },
        "QA": {
          "v": "A INT16 só roda com woNumero (INT14 ou digitado)",
          "r": "igual"
        }
      },
      "leitura": "O gateway é redundante aqui, mas inofensivo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T08",
      "grupo": "retentativa",
      "nome": "Cancelamento da WO (INT16)",
      "tipo": "HTTP",
      "linha": "BPMN Node_CancelaWO · US10 · DFT slide 14",
      "bpmn": "DELETE /workOrder/{data_woNumero}?reason=PROBLEMAS SISTEMICOS&context=SISTEMICO. Resultado e falha técnica ignorados: sempre segue para \"BD não criado\".",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US10 Req03/Req04 Resultado esperado: \"Elastic Journey deve chamar o WFM via camada de Integração 'wfm-journey-orchestration-v1' solicitando o cancelamento da WO\" e \"Fim do processo para o Elastic Journey\"",
          "r": "igual"
        },
        "DFT": {
          "v": "INT16 DELETE /workOrder",
          "r": "igual"
        },
        "QA": {
          "v": "\"Percorrer a jornada\" roda a INT16 logo após a INT18, com BD criado ou não; mesmo DELETE com reason/context",
          "r": "parcial"
        }
      },
      "leitura": "Alinhado. Se o cancelamento falhar, a WO fica aberta sem BD e ninguém é avisado. Detalhes na INT16.",
      "acao": "decidir",
      "acaoTexto": "Definir tratamento quando o cancelamento falhar (log, alerta)."
    }
  ]
});
