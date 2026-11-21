/*
 * Raio-X · INT03 Consulta de BD (bilhete de defeito) aberto
 * BPMN (referência) × fontes. Formato documentado em ../README.md.
 * A página usa só US, DFT e DM; OAS, CURL, PM e TELA ficam guardados para consulta.
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 */
RAIOX.registrar({
  "id": "INT03",
  "ordem": 2,
  "nome": "Consulta de BD aberto",
  "nomeLongo": "Consulta de BD (bilhete de defeito) aberto",
  "rota": "Elastic Journey → Trouble Ticket Management v1 → API Gateway → ServiceNow",
  "endpoint": "GET ${FENIX_VE_TT_BASE_URL}/troubleTicket?ticketType=Case&sys_class_name=sn_sprb_mgmt_case&active=true&correlation_display={designador}",
  "nos": "Node_ConsultaBD · Node_TrataBD · Node_DecBDOk · Node_AvaliaImpedimentos",
  "resumo": "Segunda consulta: verifica se já existe BD aberto para o designador. Se existir, a jornada não abre outro e mostra a visita agendada.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US01 Consulta Bilhete de Defeito aberto · US03 BDs, Massivas e Faturas",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 3 (passo a passo INT03–INT05) e slide 13 (inventário)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.0",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Consulta de BD v2.0 · abas Camunda x MS Request/Response e MS x ServiceNow Request/Resp ERRO",
      "arquivo": "PreDataMapping FTAT-933 - Consulta de BD - v2.0.xlsx"
    },
    {
      "id": "OAS",
      "nome": "OpenAPI Trouble Ticket",
      "curto": "OAS",
      "contrato": true,
      "detalhe": "Trouble Ticket Management 1.1.0 · GET /troubleTicket (filter, offset, limit)",
      "arquivo": "Trouble Ticket Management-V1.1.0.json"
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "detalhe": "postman/curls/INT03.sh (versão antiga + \"URL CORRETA\"). A resposta de exemplo do ServiceNow está, por engano, em INT11.json",
      "arquivo": "postman/curls/INT03.sh"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "detalhe": "3 requests: \"INT03 - Consulta BD aberto\" (formato ServiceNow) e duas variações \"Direto\" (designatorId=…)",
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json"
    },
    {
      "id": "TELA",
      "nome": "Telas SDUI",
      "curto": "TELA",
      "contrato": false,
      "detalhe": "Visita técnica agendada · Massiva + visita técnica",
      "arquivo": "fenix-ve-abertura-bd-v1/screens.json"
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT03' em ESPECIFICACOES; iss reimposto em montarRequest(); repetição de GET em executar(). Evidência: rodada-completa/int-02-INT03.json"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → Trouble Ticket (hoje: gateway ServiceNow)"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "Trouble Ticket → Camunda"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_ConsultaBD · DM Camunda x MS Request · OpenAPI",
      "bpmn": "GET ${FENIX_VE_TT_BASE_URL}/troubleTicket com parâmetros no formato do ServiceNow",
      "fontes": {
        "DFT": {
          "v": "INT03 POST · endpoint TBD · Internal API",
          "r": "diverge"
        },
        "DM": {
          "v": "GET /troubleTicket?filter=designatorId:…;status:Active;ticketType:Case (MS Trouble Ticket)",
          "r": "diverge"
        },
        "OAS": {
          "v": "GET /troubleTicket (filter, offset, limit) · spmg-*.redecorp.azr/troubleTicketManagement/v1",
          "r": "diverge"
        },
        "CURL": {
          "v": "\"URL CORRETA\": api-hml…/serviceNowTroubleTicket/v1/troubleTicket?ticketType=Case&sys_class_name=…&active=true&correlation_display=…",
          "r": "igual"
        },
        "PM": {
          "v": "Igual ao curl correto; mais duas variações \"Direto\" com designatorId=&status=Active",
          "r": "parcial"
        },
        "QA": {
          "v": "GET {ttConsulta}/troubleTicket?ticketType=Case&sys_class_name=…&active=true&correlation_display=… (preprod: serviceNowTroubleTicket/v1)",
          "r": "igual"
        }
      },
      "leitura": "O BPMN segue o gateway do ServiceNow (endpoint temporário). O DM e o OpenAPI descrevem o MS Trouble Ticket, com outro formato de busca (filter=). Quando o endpoint mudar para o MS, a query e o tratamento do 404 quebram.",
      "acao": "decidir",
      "acaoTexto": "Decidir qual endpoint vai para produção e alinhar o BPMN a ele.",
      "valor": {
        "t": "config",
        "de": "FENIX_VE_TT_BASE_URL (ambiente) + parâmetros fixos"
      }
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM · OpenAPI security",
      "bpmn": "Bearer do usuário (_authorizationHeader), se existir.",
      "fontes": {
        "DM": {
          "v": "Obrigatório · Bearer Token",
          "r": "parcial"
        },
        "OAS": {
          "v": "security BearerAuth (JWT)",
          "r": "parcial"
        },
        "CURL": {
          "v": "Versão antiga com Bearer; \"URL CORRETA\" sem Authorization, só iss",
          "r": "diverge"
        },
        "PM": {
          "v": "Bearer da collection",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela; sem token a integração não executa",
          "r": "igual"
        }
      },
      "leitura": "O contrato exige; o BPMN envia só se houver token. O curl validado chama o gateway sem Bearer, o que sugere que o iss substitui o token nesse endpoint.",
      "acao": "decidir",
      "acaoTexto": "Confirmar a autenticação do endpoint final (Bearer ou iss).",
      "valor": {
        "t": "config",
        "de": "Bearer recebido no /advance → _authorizationHeader"
      }
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "iss",
      "tipo": "header",
      "linha": "BPMN script de headers (obrigatório)",
      "bpmn": "data_issServiceNow, obrigatório (vem do START issServiceNow). Erro se vazio.",
      "fontes": {
        "CURL": {
          "v": "iss: <valor fixo>",
          "r": "igual"
        },
        "PM": {
          "v": "iss: <mesmo valor fixo> no header",
          "r": "igual"
        },
        "QA": {
          "v": "iss: ISS_SERVICENOW (constante da tela), reimposto mesmo se o header for editado à mão",
          "r": "igual"
        }
      },
      "leitura": "Entrada do START por desenho: o canal envia issServiceNow e o motor incorpora no header iss da chamada ao gateway do ServiceNow. O BPMN está correto. A lacuna é só de documentação: o DM v2.0 (o que está no repositório) e o OpenAPI não citam o campo; a versão posterior do DM já documenta.",
      "acao": "fonte",
      "acaoTexto": "Trazer para o repositório a versão do DM que documenta o iss (posterior à v2.0) e manter issServiceNow no contrato do START.",
      "valor": {
        "t": "start",
        "de": "START issServiceNow → data_issServiceNow"
      }
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM · OpenAPI",
      "bpmn": "TID_ELJY_FTAT933INT003_<ISO agora, UTC>",
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT003_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "igual"
        },
        "OAS": {
          "v": "required: true",
          "r": "igual"
        },
        "CURL": {
          "v": "TID_ELJY_FTAT933INT003_2026-11-18T15:22:20.348Z",
          "r": "igual"
        },
        "PM": {
          "v": "TID_ELJY_FTAT933INT003_{{$isoTimestamp}}",
          "r": "igual"
        },
        "QA": {
          "v": "tid('INT003') = TID_ELJY_FTAT933INT003_<ISO agora>",
          "r": "igual"
        }
      },
      "leitura": "Tudo alinhado.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "gerado",
        "de": "TID_ELJY_FTAT933INT003_ + hora atual"
      }
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM",
      "bpmn": "data_correlationId (START), enviado se existir.",
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"gerado pelo VE\" · CID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "parcial"
        },
        "CURL": {
          "v": "CID_VE_FTAT933_1795010982907",
          "r": "igual"
        },
        "PM": {
          "v": "{{correlationId}}",
          "r": "igual"
        },
        "QA": {
          "v": "correlationId do formulário; vazio, gera CID_VE_FTAT933_QA_<timestamp>",
          "r": "igual"
        }
      },
      "leitura": "O DM exige e define uma máscara com INT001 e data; os testes usam CID_VE_FTAT933_<ts>. O BPMN aceita ausência.",
      "acao": "decidir",
      "acaoTexto": "Fechar a máscara do correlationId com o VE.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      }
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "Designador (correlation_display)",
      "tipo": "query",
      "linha": "BPMN path · DM filter designatorId · DFT",
      "bpmn": "data_designador, o mesmo da INT01. Na prática, o designador de serviço (013) vindo do Asset.",
      "fontes": {
        "US": {
          "v": "\"ID DO DESIGNADOR\" a confirmar",
          "r": "parcial"
        },
        "DFT": {
          "v": "idDesignador final 069 (acesso)",
          "r": "diverge"
        },
        "DM": {
          "v": "filter designatorId:SPO-SF703229-069 (acesso)",
          "r": "diverge"
        },
        "CURL": {
          "v": "\"URL CORRETA\" usa SPO-SF910004-069; versão antiga usava -013",
          "r": "diverge"
        },
        "PM": {
          "v": "{{designador}} (Asset, item Internet → 013)",
          "r": "igual"
        },
        "QA": {
          "v": "Campo designador do formulário (padrão SPO-SF703229-069, final 069); sem ele a integração é pulada. Mesmo valor da INT01",
          "r": "parcial"
        }
      },
      "leitura": "DFT, DM e o curl validado pedem o designador de acesso (069). O BPMN envia o de serviço (013), porque usa a mesma variável da INT01.",
      "acao": "bpmn",
      "acaoTexto": "Usar o designador de acesso (069), vindo de uma variável própria.",
      "valor": {
        "t": "start",
        "de": "START designador → data_designador (o mesmo da INT01)"
      }
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "ticketType",
      "tipo": "query",
      "linha": "BPMN path · DM (filter e aba MS x ServiceNow)",
      "bpmn": "Case (fixo)",
      "fontes": {
        "DM": {
          "v": "ticketType:Case dentro do filter; \"Case\" na aba MS x ServiceNow",
          "r": "igual"
        },
        "OAS": {
          "v": "Dentro de filter",
          "r": "parcial"
        },
        "CURL": {
          "v": "ticketType=Case",
          "r": "igual"
        },
        "PM": {
          "v": "ticketType=Case",
          "r": "igual"
        },
        "QA": {
          "v": "ticketType=Case (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Valor alinhado; muda apenas o formato (parâmetro solto × dentro do filter).",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "fixo",
        "de": "Case"
      }
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "sys_class_name",
      "tipo": "query",
      "linha": "BPMN path · DM aba MS x ServiceNow",
      "bpmn": "sn_sprb_mgmt_case (fixo)",
      "fontes": {
        "DM": {
          "v": "Só na aba MS x ServiceNow (sysClassName, preenchido pelo MS)",
          "r": "parcial"
        },
        "CURL": {
          "v": "sys_class_name=sn_sprb_mgmt_case",
          "r": "igual"
        },
        "PM": {
          "v": "sys_class_name=sn_sprb_mgmt_case",
          "r": "igual"
        },
        "QA": {
          "v": "sys_class_name=sn_sprb_mgmt_case (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Pelo DM, quem preenche é o MS ao chamar o ServiceNow. O BPMN preenche porque fala direto com o gateway.",
      "acao": "decidir",
      "acaoTexto": "Some do BPMN se o endpoint final for o MS.",
      "valor": {
        "t": "fixo",
        "de": "sn_sprb_mgmt_case"
      }
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "active / status",
      "tipo": "query",
      "linha": "BPMN path · DM filter",
      "bpmn": "active=true (fixo)",
      "fontes": {
        "DM": {
          "v": "status:Active dentro do filter",
          "r": "parcial"
        },
        "CURL": {
          "v": "active=true",
          "r": "igual"
        },
        "PM": {
          "v": "active=true (variações \"Direto\": status=Active)",
          "r": "parcial"
        },
        "QA": {
          "v": "active=true (fixo); não envia status",
          "r": "igual"
        }
      },
      "leitura": "Mesmo filtro com nomes diferentes. O BPMN ainda filtra o status de novo na resposta.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "fixo",
        "de": "active=true"
      }
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "offset / limit",
      "tipo": "query",
      "linha": "DM Camunda x MS Request · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "Opcionais · exemplo 0",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Opcionais",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Variações \"Direto\": offset=0&limit=5",
          "r": "so-fonte"
        },
        "CURL": {
          "v": "Versão antiga: offset=0&limit=5; \"URL CORRETA\" não envia",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "leitura": "O DM tem a mais. Sem limit, a lista vem completa, e o BPMN usa só o primeiro ticket aberto.",
      "acao": "nada",
      "acaoTexto": "Não enviar.",
      "valor": {
        "t": "nenhum",
        "de": "não enviado"
      }
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN inputParameters",
      "bpmn": "connect 3000 ms · resposta 10000 ms · 1 tentativa",
      "fontes": {
        "DFT": {
          "v": "Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout total de 10000 ms (sem connect separado); GET com erro de rede ou timeout repete 1 vez",
          "r": "parcial"
        }
      },
      "leitura": "A INT03 tem metade do timeout da INT01 (20 s).",
      "acao": "decidir",
      "acaoTexto": "Validar com o SLA do Trouble Ticket/ServiceNow.",
      "valor": {
        "t": "fixo",
        "de": "inputParameters do BPMN"
      }
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 / 206",
      "tipo": "status",
      "linha": "BPMN Node_TrataBD · OpenAPI responses",
      "bpmn": "200 ou 206 = consulta OK; corpo é uma lista de tickets.",
      "fontes": {
        "DM": {
          "v": "Body: lista de tickets",
          "r": "igual"
        },
        "OAS": {
          "v": "200 → TroubleTicketList (206 não declarado)",
          "r": "parcial"
        },
        "PM": {
          "v": "Aceita 200, 206 e 404",
          "r": "igual"
        },
        "QA": {
          "v": "Aceita 200, 206 e 404; 200/206 lê o corpo como lista de tickets (206 avisa \"nesta página\")",
          "r": "igual"
        }
      },
      "leitura": "O gateway do ServiceNow devolve 206 com resultados parciais; o contrato do MS não prevê esse código.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "resposta",
        "de": "200/206 → data_consultaBDOk"
      }
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "HTTP 404 sem registro",
      "tipo": "status",
      "linha": "BPMN Node_TrataBD · DM aba Resp ERRO · OpenAPI",
      "bpmn": "404 com corpo code = \"60\" → \"sem BD aberto\". Outro 404 = falha.",
      "fontes": {
        "DM": {
          "v": "Resposta do MS: {code: 404, …, response: {code: \"60\", message: \"No Record found…\"}}. O exemplo põe code 60 na raiz.",
          "r": "diverge"
        },
        "OAS": {
          "v": "404 → ErrorTemplate {_errorCode: 4040, _message, _errors[]}",
          "r": "diverge"
        },
        "PM": {
          "v": "Teste: body.code == \"60\"",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: 404 com code 60 numérico. A tela compara como texto (\"60\") = sem BD; outro 404 reprova",
          "r": "igual"
        }
      },
      "leitura": "O BPMN lê code na raiz, como no gateway do ServiceNow. No formato do MS, o 60 fica em response.code (DM) ou nem aparece (OpenAPI): a ausência de BD viraria falha.",
      "acao": "decidir",
      "acaoTexto": "Ajustar a regra do 404 junto com a escolha do endpoint.",
      "valor": {
        "t": "resposta",
        "de": "404 + code 60 → data_consultaBDOk = true, data_temBD = false"
      }
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "HTTP 5XX / timeout",
      "tipo": "status",
      "linha": "BPMN boundary Falha técnica · OpenAPI",
      "bpmn": "Boundary \"Falha técnica\" → Node_TrataBD → tela \"Não conseguimos verificar\".",
      "fontes": {
        "US": {
          "v": "US01 Obs. 2: direcionar a outro atendimento ou tentar mais tarde",
          "r": "igual"
        },
        "OAS": {
          "v": "500, 501, 503 → ErrorTemplate",
          "r": "igual"
        },
        "TELA": {
          "v": "Tela \"Não conseguimos verificar\"",
          "r": "igual"
        },
        "QA": {
          "v": "5XX = falha; timeout de 10 s, com 1 repetição automática antes de marcar falha",
          "r": "parcial"
        }
      },
      "leitura": "Bate com a US01.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "resposta",
        "de": "boundary Falha técnica → data_consultaBDOk = false"
      }
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "body[].id",
      "tipo": "string",
      "linha": "BPMN Node_TrataBD · OpenAPI",
      "bpmn": "→ data_bdNumero",
      "fontes": {
        "DM": {
          "v": "Só no exemplo; a tabela começa em href",
          "r": "parcial"
        },
        "OAS": {
          "v": "id",
          "r": "igual"
        },
        "QA": {
          "v": "Resumo \"BD ativo: <id>\" do ticket aberto",
          "r": "igual"
        }
      },
      "leitura": "Usado internamente. Falta a linha na tabela do DM.",
      "acao": "fonte",
      "acaoTexto": "Incluir id na tabela do DM.",
      "valor": {
        "t": "resposta",
        "de": "→ data_bdNumero"
      }
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "body[].status",
      "tipo": "string",
      "linha": "BPMN Node_TrataBD · DM · OpenAPI",
      "bpmn": "Aberto = status fora de closed, cancelled, canceled, resolved.",
      "fontes": {
        "DM": {
          "v": "\"Estado atual do ticket\", sem domínio",
          "r": "parcial"
        },
        "OAS": {
          "v": "string · exemplo \"Closed\"",
          "r": "parcial"
        },
        "CURL": {
          "v": "Amostra real (INT11.json): \"Awaiting Info\" e tickets sem status",
          "r": "parcial"
        },
        "QA": {
          "v": "Aberto = status fora de closed, cancelled, canceled, resolved (sem diferenciar maiúsculas)",
          "r": "igual"
        }
      },
      "leitura": "A consulta já pede active=true, então o filtro do BPMN é redundante. Ticket sem status conta como aberto.",
      "acao": "decidir",
      "acaoTexto": "Pedir ao dono do DM a lista de status.",
      "valor": {
        "t": "resposta",
        "de": "status fora de closed/cancelled/resolved → data_temBD"
      }
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "Protocolo (relatedEntity \"number\")",
      "tipo": "string",
      "linha": "BPMN Node_TrataBD · amostra ServiceNow",
      "bpmn": "relatedEntity com name \"number\" → entity.id; senão externalIdentifier.id → data_bdProtocoloAtendimento.",
      "fontes": {
        "US": {
          "v": "US01: mostrar \"dia, hora e protocolo\"",
          "r": "igual"
        },
        "DM": {
          "v": "relatedEntity[] genérico (role, entity.id, name); não cita \"number\"",
          "r": "parcial"
        },
        "OAS": {
          "v": "externalIdentifier.id = \"BD number in ServiceNow\" (SPC0001432)",
          "r": "parcial"
        },
        "CURL": {
          "v": "Amostra: entity name \"number\" = SPC0001123",
          "r": "igual"
        },
        "TELA": {
          "v": "\"Protocolo {{data.bdProtocoloAtendimento}}\"",
          "r": "igual"
        }
      },
      "leitura": "Funciona com o retorno real. O contrato do MS sugere externalIdentifier.id, que o BPMN só usa como reserva.",
      "acao": "fonte",
      "acaoTexto": "Documentar no DM qual campo é o protocolo.",
      "valor": {
        "t": "resposta",
        "de": "→ data_bdProtocoloAtendimento"
      }
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "Data da visita (relatedEntity \"ets\")",
      "tipo": "string",
      "linha": "BPMN Node_TrataBD",
      "bpmn": "relatedEntity \"ets\" → data_bdPrevisaoConclusao (sem formatação).",
      "fontes": {
        "US": {
          "v": "US01: mostrar \"dia, hora\"",
          "r": "parcial"
        },
        "CURL": {
          "v": "Amostra: \"ets\" presente, mas sem valor nos 3 tickets",
          "r": "parcial"
        },
        "TELA": {
          "v": "\"Agendada para {{data.bdPrevisaoConclusao}}\"",
          "r": "parcial"
        }
      },
      "leitura": "Nenhum contrato cita \"ets\". Na amostra ele vem vazio, então a tela mostraria \"Agendada para \" sem data.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o ServiceNow qual campo traz a data/hora da visita.",
      "valor": {
        "t": "resposta",
        "de": "→ data_bdPrevisaoConclusao"
      }
    },
    {
      "id": "S08",
      "grupo": "response",
      "nome": "Tipo do BD (preventivo / pró-ativo)",
      "tipo": "string",
      "linha": "US01 · amostra ServiceNow",
      "bpmn": null,
      "fontes": {
        "US": {
          "v": "US01: verificar BD Preventivo e/ou Pró-Ativo",
          "r": "so-fonte"
        },
        "CURL": {
          "v": "Amostra: relatedEntity \"tipoBD\" = reativo",
          "r": "so-fonte"
        }
      },
      "leitura": "A US fala só de BD preventivo/pró-ativo. O BPMN considera qualquer BD ativo, inclusive reativo.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o negócio se BD reativo também impede abrir outro.",
      "valor": {
        "t": "nenhum",
        "de": "não lido"
      }
    },
    {
      "id": "S09",
      "grupo": "response",
      "nome": "Vários tickets abertos",
      "tipo": "regra",
      "linha": "BPMN Node_TrataBD",
      "bpmn": "Usa o primeiro aberto, na ordem da API.",
      "fontes": {
        "QA": {
          "v": "Usa o primeiro aberto (find), na ordem da API",
          "r": "igual"
        }
      },
      "leitura": "Nenhuma fonte define a regra.",
      "acao": "decidir",
      "acaoTexto": "Definir qual BD exibir (mais recente? com visita?).",
      "valor": {
        "t": "resposta",
        "de": "primeiro ticket aberto"
      }
    },
    {
      "id": "S10",
      "grupo": "response",
      "nome": "Demais campos do ticket",
      "tipo": "string",
      "linha": "DM Camunda x MS Response · OpenAPI",
      "bpmn": null,
      "fontes": {
        "DM": {
          "v": "href, creationDate, lastUpdate, description, name, severity, ticketType, channel, note[], relatedParty[]",
          "r": "so-fonte"
        },
        "OAS": {
          "v": "Mesmos campos",
          "r": "so-fonte"
        }
      },
      "leitura": "Informativos, a jornada não precisa.",
      "acao": "nada",
      "acaoTexto": "",
      "valor": {
        "t": "nenhum",
        "de": "ignorados"
      }
    }
  ]
});
