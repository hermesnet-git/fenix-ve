/*
 * Raio-X · INT01 Consulta de Massiva / Manutenção programada
 * BPMN (referência) × fontes. Formato documentado em ../README.md.
 * A página usa só US, DFT e DM; OAS, CURL, PM e TELA ficam guardados para consulta.
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 */
RAIOX.registrar({
  "id": "INT01",
  "ordem": 1,
  "nome": "Consulta de Massiva",
  "nomeLongo": "Consulta de Massiva / Manutenção programada",
  "rota": "Elastic Journey → Customer Problem Management v1 → SIGITM + SIGMA Fibra",
  "endpoint": "GET ${FENIX_VE_CPM_BASE_URL}/incidents?serviceDesignator={designador}",
  "nos": "startEvent · Node_ConsultaMassiva · Node_TrataMassiva · Node_DecMassivaOk · Node_AvaliaImpedimentos",
  "resumo": "Primeira consulta da jornada: verifica se há massiva ou manutenção programada no serviço antes do troubleshooting.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US02 Consulta Massiva/Manutenção · US03 BDs, Massivas e Faturas",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 2 (passo a passo INT01/INT02) e slide 13 (inventário)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.1",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Consulta de Massivas v2.1 · abas VE x Camunda Request, Camunda x MS Request, Camunda x MS Response",
      "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx"
    },
    {
      "id": "OAS",
      "nome": "OpenAPI CPM",
      "curto": "OAS",
      "contrato": true,
      "detalhe": "customer-problem-management v1 (preprod) · GET /incidents",
      "arquivo": "customer-problem-management-v1.preprod.openapi.yaml"
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "detalhe": "Só a requisição; o arquivo não traz resposta.",
      "arquivo": "postman/curls/INT01.sh"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "detalhe": "Request INT01 da pasta 04 (sem resposta salva; usei descrição e teste).",
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json"
    },
    {
      "id": "TELA",
      "nome": "Telas SDUI",
      "curto": "TELA",
      "contrato": false,
      "detalhe": "Massiva · Massiva + atraso · Massiva + visita · Não conseguimos verificar",
      "arquivo": "fenix-ve-abertura-bd-v1/screens.json"
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT01' em ESPECIFICACOES (montar/avaliar), headersBase + comCorrelacao; repetição de GET em executar(). Evidência: rodada-completa/int-01-INT01.json"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → CPM"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "CPM → Camunda"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_ConsultaMassiva · DM exemplo · OpenAPI paths",
      "bpmn": "GET ${FENIX_VE_CPM_BASE_URL}/incidents?serviceDesignator=…",
      "fontes": {
        "DFT": {
          "v": "POST https://cssp.redecorp.br/customer-problem-management/v1 (Internal API, síncrona)",
          "r": "diverge"
        },
        "DM": {
          "v": "GET https://cssp-preprod.redecorp.br/customer-problem-management/v1/incidents?serviceDesignator=…",
          "r": "igual"
        },
        "OAS": {
          "v": "GET /incidents (getIncidents)",
          "r": "igual"
        },
        "CURL": {
          "v": "GET https://cssp-preprod.redecorp.br/…/incidents?serviceDesignator=SPO-SF897657-013",
          "r": "igual"
        },
        "PM": {
          "v": "GET {{cpm_base_url}}/incidents?serviceDesignator={{designador}}",
          "r": "igual"
        },
        "QA": {
          "v": "GET {cpm}/incidents?serviceDesignator={designador} (preprod cssp-preprod…/customer-problem-management/v1)",
          "r": "igual"
        }
      },
      "leitura": "Todas as fontes técnicas batem com o BPMN. Só o DFT ainda registra POST na raiz, que responde 405.",
      "acao": "fonte",
      "acaoTexto": "Atualizar o DFT para GET /incidents.",
      "valor": {
        "t": "config",
        "de": "FENIX_VE_CPM_BASE_URL (ambiente) + rota /incidents fixa"
      }
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM · OpenAPI",
      "bpmn": "Bearer do usuário guardado no /advance (_authorizationHeader). Omitido se ausente.",
      "fontes": {
        "DM": {
          "v": "Obrigatório · Bearer Token",
          "r": "parcial"
        },
        "OAS": {
          "v": "required: true · JWT pass-through validado no Istio",
          "r": "parcial"
        },
        "CURL": {
          "v": "Authorization: Bearer <token>",
          "r": "igual"
        },
        "PM": {
          "v": "Bearer da collection (token VE, password grant)",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela (headersBase); sem token a integração não executa",
          "r": "igual"
        }
      },
      "leitura": "O contrato exige o header; o BPMN só envia se o token chegou no /advance da primeira tela. Sem ele, a chamada volta 401.",
      "acao": "decidir",
      "acaoTexto": "Definir token do usuário ou sistêmico no runtime.",
      "valor": {
        "t": "config",
        "de": "Bearer recebido no /advance → _authorizationHeader"
      }
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "DM Camunda x MS Request (header)",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Não obrigatório · \"gerado pelo MS\" · TID_ELJY_FTAT933INT002_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "so-fonte"
        },
        "CURL": {
          "v": "Não envia",
          "r": "igual"
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
      "leitura": "Opcional. As demais integrações do BPMN geram esse TID; a INT01 não. A máscara do DM cita INT002.",
      "acao": "bpmn",
      "acaoTexto": "Gerar TID_ELJY_FTAT933INT001_<ISO> na jornada, sem pedir ao canal.",
      "valor": {
        "t": "nenhum",
        "de": "não enviado"
      }
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "data_correlationId (vem do START), enviado se existir.",
      "fontes": {
        "CURL": {
          "v": "X-Vivo-Correlation-Id: 12345",
          "r": "igual"
        },
        "PM": {
          "v": "{{correlationId}} · fallback CID_VE_FTAT933_QA_<ts>",
          "r": "igual"
        },
        "QA": {
          "v": "correlationId do formulário; vazio, gera CID_VE_FTAT933_QA_<timestamp> a cada execução",
          "r": "igual"
        }
      },
      "leitura": "O BPMN envia, mas nem o DM Camunda x MS nem o OpenAPI declaram o header.",
      "acao": "fonte",
      "acaoTexto": "Pedir ao CPM para incluir no DM/OpenAPI.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      }
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "Accept",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "application/json",
      "fontes": {
        "CURL": {
          "v": "application/json",
          "r": "igual"
        },
        "PM": {
          "v": "application/json",
          "r": "igual"
        },
        "QA": {
          "v": "Accept: application/json (headersBase)",
          "r": "igual"
        }
      },
      "leitura": "Constante técnica. O contrato não declara, mas também não restringe.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      }
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "serviceDesignator",
      "tipo": "query",
      "linha": "BPMN path · DM Camunda x MS Request · OpenAPI",
      "bpmn": "data_designador, URL-encoded. Lança erro se vazio.",
      "fontes": {
        "US": {
          "v": "\"ID DO DESIGNADOR\" como TAG a confirmar",
          "r": "parcial"
        },
        "DFT": {
          "v": "idDesignador final 013 (serviço)",
          "r": "igual"
        },
        "DM": {
          "v": "Obrigatório · \"Designador do serviço (final 013)\"",
          "r": "igual"
        },
        "OAS": {
          "v": "required: true",
          "r": "igual"
        },
        "CURL": {
          "v": "SPO-SF897657-013",
          "r": "igual"
        },
        "PM": {
          "v": "{{designador}} ← Asset, item productFamily=Internet",
          "r": "igual"
        },
        "QA": {
          "v": "Campo designador do formulário (padrão SPO-SF703229-069, final 069); sem ele a integração é pulada. URL-encoded",
          "r": "parcial"
        }
      },
      "leitura": "O valor está certo para esta integração. O problema é que a mesma variável alimenta a INT03, que pede o designador de acesso (069). Designador vazio vira incidente técnico no Camunda, sem chegar à tela de falha. A tela de QA usa um só designador para INT01, INT03 e INT06, com padrão de final 069 (acesso).",
      "acao": "bpmn",
      "acaoTexto": "Ler de uma variável exclusiva do designador de serviço (013) e tratar o vazio.",
      "valor": {
        "t": "start",
        "de": "START designador → data_designador"
      }
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "status",
      "tipo": "query",
      "linha": "DM Camunda x MS Request · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Opcional · ACTIVE, CLOSED, SCHEDULED, SUSPECTED",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Opcional",
          "r": "so-fonte"
        },
        "CURL": {
          "v": "Não envia",
          "r": "igual"
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
      "leitura": "O DM tem a mais. Fixar ACTIVE excluiria a manutenção programada (SCHEDULED), que a US02 quer mostrar.",
      "acao": "nada",
      "acaoTexto": "Não enviar.",
      "valor": {
        "t": "nenhum",
        "de": "não enviado (padrão do MS)"
      }
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "startDate",
      "tipo": "query",
      "linha": "DM Camunda x MS Request · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Opcional · padrão: hoje − 180 dias",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Opcional · mesmo padrão",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "CURL": {
          "v": "Não envia",
          "r": "igual"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "leitura": "O padrão do MS atende.",
      "acao": "nada",
      "acaoTexto": "Não enviar.",
      "valor": {
        "t": "nenhum",
        "de": "não enviado (padrão do MS)"
      }
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "endDate",
      "tipo": "query",
      "linha": "DM Camunda x MS Request · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Opcional · padrão: data/hora atual",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Opcional · mesmo padrão",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "CURL": {
          "v": "Não envia",
          "r": "igual"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "leitura": "Se a janela filtra por data de abertura, uma manutenção agendada para amanhã fica fora da consulta.",
      "acao": "decidir",
      "acaoTexto": "Perguntar ao CPM; se preciso, fixar endDate na jornada.",
      "valor": {
        "t": "nenhum",
        "de": "não enviado (padrão do MS)"
      }
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN inputParameters",
      "bpmn": "connect 3000 ms · resposta 20000 ms · 1 tentativa",
      "fontes": {
        "DFT": {
          "v": "Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout total de 20000 ms (sem connect separado); GET com erro de rede ou timeout repete 1 vez",
          "r": "parcial"
        }
      },
      "leitura": "O DFT não dá número. O timeout subiu de 10 s para 20 s depois de um timeout em preprod.",
      "acao": "decidir",
      "acaoTexto": "Validar com o SLA do CPM.",
      "valor": {
        "t": "fixo",
        "de": "inputParameters do BPMN"
      }
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200",
      "tipo": "status",
      "linha": "BPMN Node_TrataMassiva · OpenAPI responses",
      "bpmn": "Consulta OK (data_consultaMassivaOk = true). Lista vazia = sem massiva.",
      "fontes": {
        "OAS": {
          "v": "200 → ListIncidentsDTO",
          "r": "igual"
        },
        "PM": {
          "v": "Teste aceita só 200. Descrição: massiva aberta se algum incidente tiver status ≠ CLOSED.",
          "r": "igual"
        },
        "QA": {
          "v": "Só 200 é esperado; exige lista \"incidents\". Massiva aberta = algum status ≠ CLOSED",
          "r": "igual"
        }
      },
      "leitura": "Bate. O DM não lista códigos HTTP.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "resposta",
        "de": "status HTTP → data_consultaMassivaOk"
      }
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "HTTP 404",
      "tipo": "status",
      "linha": "BPMN Node_TrataMassiva · OpenAPI responses",
      "bpmn": "Falha → tela \"Não conseguimos verificar\".",
      "fontes": {
        "OAS": {
          "v": "404 \"Object not found\" (ProblemDetailsDto)",
          "r": "igual"
        },
        "PM": {
          "v": "Descrição: qualquer status além de 200 (inclusive 404) leva a Node_FalhaConsulta.",
          "r": "igual"
        },
        "QA": {
          "v": "404 fica fora do esperado (só 200): marca alerta \"HTTP 404 fora do contrato\"",
          "r": "igual"
        }
      },
      "leitura": "Bate com o OpenAPI. Atenção: na INT03 o 404 significa \"sem BD\", aqui não.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "resposta",
        "de": "404 → data_consultaMassivaOk = false"
      }
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "HTTP 5XX / timeout",
      "tipo": "status",
      "linha": "BPMN boundary Falha técnica · OpenAPI",
      "bpmn": "Boundary \"Falha técnica\" → Node_TrataMassiva → tela \"Não conseguimos verificar\".",
      "fontes": {
        "US": {
          "v": "US02 Obs. 2: informar o VE para direcionar a outro atendimento ou tentar mais tarde",
          "r": "igual"
        },
        "OAS": {
          "v": "5XX → ProblemDetailsDto",
          "r": "igual"
        },
        "TELA": {
          "v": "Tela \"Não conseguimos verificar\"",
          "r": "igual"
        },
        "PM": {
          "v": "Descrição: qualquer status além de 200 leva a Node_FalhaConsulta.",
          "r": "igual"
        },
        "QA": {
          "v": "5XX = falha; timeout de 20 s, com 1 repetição automática antes de marcar falha",
          "r": "parcial"
        }
      },
      "leitura": "O BPMN atende a US02. O dossiê, por outro lado, decidiu não criar tela de erro: vale registrar a decisão final.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "resposta",
        "de": "boundary Falha técnica → data_consultaMassivaOk = false"
      }
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "totalResults",
      "tipo": "string",
      "linha": "DM Camunda x MS Response · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Opcional · inteiro em texto (\"3\")",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "string",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Evidência 19/11: totalResults \"0\" (texto) com incidents []. A tela não lê o campo",
          "r": "so-fonte"
        }
      },
      "leitura": "O BPMN ignora o total e decide pelos incidentes da lista.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "nenhum",
        "de": "ignorado"
      }
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "incidents[].incidentId",
      "tipo": "string",
      "linha": "BPMN Node_TrataMassiva · DM · OpenAPI",
      "bpmn": "Primeiro incidente aberto → data_massivaProtocolo (protocolo exibido).",
      "fontes": {
        "US": {
          "v": "US02: mostrar \"dia, hora e protocolo\"",
          "r": "parcial"
        },
        "DM": {
          "v": "Opcional · \"Identificador único do incidente\" (SIG-2026-00456)",
          "r": "parcial"
        },
        "OAS": {
          "v": "string",
          "r": "parcial"
        },
        "TELA": {
          "v": "\"Protocolo {{data.massivaProtocolo}}\" em 3 telas",
          "r": "igual"
        },
        "QA": {
          "v": "Resumo mostra o incidentId da 1ª massiva aberta (ou \"s/ id\")",
          "r": "igual"
        }
      },
      "leitura": "Nenhuma fonte diz que incidentId é o protocolo que o cliente reconhece. Com vários incidentes, o BPMN mostra o primeiro, sem critério.",
      "acao": "decidir",
      "acaoTexto": "Confirmar o campo de protocolo com o CPM e a regra para vários incidentes.",
      "valor": {
        "t": "resposta",
        "de": "primeiro incidente aberto → data_massivaProtocolo"
      }
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "incidents[].status",
      "tipo": "string",
      "linha": "BPMN Node_TrataMassiva · DM · OpenAPI",
      "bpmn": "Massiva aberta = status diferente de CLOSED.",
      "fontes": {
        "DM": {
          "v": "Opcional · \"Ex: ACTIVE\"",
          "r": "parcial"
        },
        "OAS": {
          "v": "enum ACTIVE, CLOSED, SCHEDULED, SUSPECTED, CONFIRMED, PENDING",
          "r": "parcial"
        },
        "PM": {
          "v": "Descrição: massiva aberta = algum incidente com status ≠ CLOSED.",
          "r": "igual"
        },
        "QA": {
          "v": "Aberta = status ≠ CLOSED, sem diferenciar maiúsculas",
          "r": "igual"
        }
      },
      "leitura": "Pelo BPMN, SUSPECTED e PENDING também bloqueiam a abertura de BD. Nenhuma fonte define quais status contam.",
      "acao": "decidir",
      "acaoTexto": "Definir com o negócio quais status impedem a abertura.",
      "valor": {
        "t": "resposta",
        "de": "status ≠ CLOSED → data_temMassiva"
      }
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "incidents[].type",
      "tipo": "string",
      "linha": "DM Camunda x MS Response",
      "bpmn": null,
      "fontes": {
        "US": {
          "v": "US02 trata \"Massiva e/ou Manutenção Programada\"",
          "r": "so-fonte"
        },
        "DM": {
          "v": "Opcional · CONFIRMED | SCHEDULED",
          "r": "so-fonte"
        },
        "TELA": {
          "v": "Texto único: \"Instabilidade na região\"",
          "r": "igual"
        }
      },
      "leitura": "O campo distingue massiva de manutenção programada. O BPMN ignora, e a tela é sempre \"Instabilidade na região\".",
      "acao": "decidir",
      "acaoTexto": "Validar com UX se manutenção programada precisa de outro texto.",
      "valor": {
        "t": "nenhum",
        "de": "ignorado"
      }
    },
    {
      "id": "S08",
      "grupo": "response",
      "nome": "incidents[].expectedResolutionDate",
      "tipo": "string (ISO UTC)",
      "linha": "BPMN Node_TrataMassiva · DM · OpenAPI",
      "bpmn": "Formata \"dd/MM às HHhmm\" (São Paulo) → data_massivaPrevisaoConclusao.",
      "fontes": {
        "US": {
          "v": "\"dia, hora\" (não diz se é abertura ou previsão)",
          "r": "parcial"
        },
        "DM": {
          "v": "Opcional · ISO 8601 UTC",
          "r": "igual"
        },
        "OAS": {
          "v": "string",
          "r": "igual"
        },
        "TELA": {
          "v": "\"Os serviços devem voltar a funcionar em {{…}}\"",
          "r": "parcial"
        }
      },
      "leitura": "Bate, mas o campo é opcional: sem previsão, a frase da tela fica incompleta.",
      "acao": "decidir",
      "acaoTexto": "Definir o texto para previsão ausente.",
      "valor": {
        "t": "resposta",
        "de": "formatado → data_massivaPrevisaoConclusao"
      }
    },
    {
      "id": "S09",
      "grupo": "response",
      "nome": "Demais campos do incidente",
      "tipo": "string",
      "linha": "DM Camunda x MS Response · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "source, openDate, description, affectedServices (String), serviceDesignator",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Mesmos campos; affectedServices é array",
          "r": "so-fonte"
        }
      },
      "leitura": "Informativos, a jornada não precisa. O tipo de affectedServices diverge entre DM e OpenAPI.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "nenhum",
        "de": "ignorados"
      }
    }
  ]
});
