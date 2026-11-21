/*
 * Raio-X · INT06 Solicita diagnóstico HPSD
 * Comparação: BPMN (o que roda) × US, DFT e DM. Levantamento de 20/11/2026.
 * Mesmas regras de int01-consulta-massiva.js (lista de campos, `linha`, `r`, `acao`, `valor`).
 * O resultado (callback Kafka + GET /serviceTest/{id}) está em int10-resultado-diagnostico.js.
 */
RAIOX.registrar({
  "id": "INT06",
  "ordem": 3,
  "nome": "Solicita diagnóstico HPSD",
  "nomeLongo": "Solicitação do diagnóstico automático ao HPSD (TMF653 POST /serviceTest)",
  "rota": "Elastic Journey → API Gateway TMF653 → HPSD",
  "endpoint": "POST ${FENIX_VE_HPSD_BASE_URL}/serviceTest",
  "nos": "Node_DecTeste · Node_SolicitaDiagnostico · Node_TrataSolicitacaoDiagnostico · Node_DecDiagnosticoAceito",
  "resumo": "Depois das perguntas de pré-diagnóstico, a jornada pede ao HPSD um teste automático do FTTH. Se o HPSD aceitar, a jornada guarda o id do teste e espera o resultado (INT10).",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US05 Não consegue reiniciar · US06 Problema persiste · US12 Diagnóstico resolvido (Req. 01)",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 5 (passo a passo INT06–INT10) e slide 13 (inventário)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.0",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Diagnóstico Automático v2.0 · abas Camunda x HPSD - Request e Camunda x HPSD - Response",
      "arquivo": "PreDataMapping FTAT-933 - Diagnóstico Automático - v2.0.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Item \"INT06 - Solicita diagnóstico (HPSD POST /serviceTest)\" da pasta 04 (sem resposta salva; usei descrição e teste). G01 vem da tela Node_TesteConexao (pasta 03)."
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "postman/curls/INT06.json",
      "detalhe": "Só a requisição (texto de curl, apesar da extensão .json); o arquivo não traz resposta."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT06' em ESPECIFICACOES (montar/avaliar, nota Kafka); timeoutPadrao() em montarRequest(). Evidência: rodada-completa/int-03-INT06.json"
    }
  ],
  "grupos": [
    {
      "id": "gatilho",
      "nome": "Gatilho",
      "sub": "Quando a jornada chama o HPSD"
    },
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → API Gateway TMF653 → HPSD"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "HPSD → Camunda (aceite síncrono)"
    }
  ],
  "campos": [
    {
      "id": "G01",
      "grupo": "gatilho",
      "nome": "Cliente segue para o teste",
      "tipo": "regra",
      "linha": "BPMN Node_DecReinicio · Node_DecVoltouReinicio · Node_DecTeste · US05/06/12",
      "bpmn": "Chega em \"Vamos testar a sua conexão\" se o cliente não consegue reiniciar (form_acaoReinicio = nao_consigo) ou se reiniciou e não voltou. form_acaoTeste = inicio encerra; qualquer outro valor chama a INT06.",
      "valor": {
        "t": "tela",
        "de": "form_acaoReinicio, form_acaoTeste (respostas das telas)"
      },
      "fontes": {
        "US": {
          "v": "US05: não consegue reiniciar → aciona HPSD. US06: reiniciou e persiste → aciona HPSD. US12 CA001: cliente informa que está pronto",
          "r": "igual"
        },
        "DFT": {
          "v": "Slide 5: o Elastic Journey solicita o diagnóstico (sem pré-condição)",
          "r": "parcial"
        },
        "PM": {
          "v": "Tela Node_TesteConexao: \"Continuar\" solicita o diagnóstico ao HPSD e aguarda o retorno",
          "r": "igual"
        }
      },
      "leitura": "Os dois caminhos das US levam ao teste. O BPMN acrescenta a tela de confirmação, que a US12 descreve como \"cliente pronto para o diagnóstico\".",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_SolicitaDiagnostico · DM aba Request (exemplo) · DFT slide 13",
      "bpmn": "POST ${FENIX_VE_HPSD_BASE_URL}/serviceTest",
      "valor": {
        "t": "config",
        "de": "FENIX_VE_HPSD_BASE_URL (ambiente) + rota /serviceTest fixa"
      },
      "fontes": {
        "US": {
          "v": "US12: chamar o HPSD via API GTW \"TMF 653\"",
          "r": "igual"
        },
        "DFT": {
          "v": "INT06 POST https://api.telefonica.com.br/gtw-redes/serviceTestManagement/v1 · rota API Gateway",
          "r": "parcial"
        },
        "DM": {
          "v": "Exemplo: POST /serviceTest",
          "r": "igual"
        },
        "PM": {
          "v": "POST {{hpsd_base_url}}/serviceTest (hml: api-hml.telefonica.com.br/gtw-redes/serviceTestManagement/v1)",
          "r": "igual"
        },
        "CURL": {
          "v": "POST https://api-hml.telefonica.com.br/gtw-redes/serviceTestManagement/v1/serviceTest",
          "r": "igual"
        },
        "QA": {
          "v": "POST {hpsd}/serviceTest (preprod: api-hml…/gtw-redes/serviceTestManagement/v1)",
          "r": "igual"
        }
      },
      "leitura": "Todos batem no método. O DFT traz só a base do gateway; o recurso /serviceTest vem do DM.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM aba Request",
      "bpmn": "Bearer do usuário (_authorizationHeader), só se existir. sendToken = false.",
      "valor": {
        "t": "config",
        "de": "Bearer recebido no /advance → _authorizationHeader"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"OAM Token (MS Service Test Management)\" · Bearer Token",
          "r": "parcial"
        },
        "PM": {
          "v": "Bearer da collection (token VE do usuário, password grant no OAM)",
          "r": "igual"
        },
        "CURL": {
          "v": "Authorization: Bearer <token> (token de usuário, domínio VivoCustomerDomain, escopo Customer.Profile)",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela; sem token a integração não executa",
          "r": "igual"
        }
      },
      "leitura": "O DM pede um token OAM do Service Test Management, que parece sistêmico. O BPMN repassa o token do usuário VE e aceita ausência. Postman e curl usam o token VE do usuário, sem resposta salva: não provam que o gateway aceita esse token.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se o gateway TMF653 aceita o token do usuário ou exige token sistêmico."
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM aba Request",
      "bpmn": "UUID aleatório a cada chamada.",
      "valor": {
        "t": "gerado",
        "de": "UUID.randomUUID()"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · gerado pelo Camunda · TID_ELJY_FTAT933INT004_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "diverge"
        },
        "PM": {
          "v": "{{$guid}} (UUID aleatório)",
          "r": "igual"
        },
        "CURL": {
          "v": "UUID aleatório (4e6a1e91-…)",
          "r": "igual"
        },
        "QA": {
          "v": "uuid() aleatório a cada chamada",
          "r": "igual"
        }
      },
      "leitura": "O formato não segue a máscara do DM (as INT01/INT03 seguem). A máscara do DM usa INT004, mas no inventário do DFT esta integração é a INT06.",
      "acao": "bpmn",
      "acaoTexto": "Gerar TID_ELJY_FTAT933INT00x_<ISO UTC>; confirmar com o dono do DM se o sufixo é INT004 ou INT006."
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM aba Request e aba Callback",
      "bpmn": "UUID aleatório a cada chamada. Não usa data_correlationId.",
      "valor": {
        "t": "gerado",
        "de": "UUID.randomUUID() (o START já traz correlationId → data_correlationId, não usado aqui)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · gerado pelo VE · CID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ. O callback devolve o mesmo CID \"gerado pelo VE no início da jornada\"",
          "r": "diverge"
        },
        "PM": {
          "v": "{{$guid}} (UUID aleatório). O prerequest cria correlationId, mas o header não usa",
          "r": "igual"
        },
        "CURL": {
          "v": "UUID aleatório (c2f11b7c-…)",
          "r": "igual"
        },
        "QA": {
          "v": "uuid() aleatório a cada chamada; não usa o correlationId do formulário",
          "r": "igual"
        }
      },
      "leitura": "O DM quer o CID que o VE criou no início, para rastrear a jornada até o callback. O BPMN cria outro, então o rastreio entre VE, HPSD e Kafka se perde.",
      "acao": "bpmn",
      "acaoTexto": "Enviar data_correlationId (START), como nas INT01/INT03."
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "Accept / Content-Type",
      "tipo": "header",
      "linha": "BPMN script de headers · DM aba Response",
      "bpmn": "application/json (fixo) nos dois.",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      },
      "fontes": {
        "DM": {
          "v": "Aba Request não lista. Aba Response lista Content-Type application/json",
          "r": "parcial"
        },
        "PM": {
          "v": "Accept e Content-Type application/json",
          "r": "igual"
        },
        "CURL": {
          "v": "Accept e Content-Type application/json",
          "r": "igual"
        },
        "QA": {
          "v": "Accept e Content-Type application/json (fixos)",
          "r": "igual"
        }
      },
      "leitura": "Padrão de API JSON. Falta só a linha na aba Request.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "name",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM aba Request",
      "bpmn": "Diagnostic-FTTH-Automatic (fixo, com hífen comum).",
      "valor": {
        "t": "fixo",
        "de": "Diagnostic-FTTH-Automatic"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · sem domínio na tabela · exemplos \"Diagnostic-FTTH–Automatic\" (com travessão –) nas 3 abas",
          "r": "diverge"
        },
        "PM": {
          "v": "Diagnostic-FTTH-Automatic (hífen comum)",
          "r": "igual"
        },
        "CURL": {
          "v": "Diagnostic-FTTH-Automatic (hífen comum)",
          "r": "igual"
        },
        "QA": {
          "v": "Diagnostic-FTTH-Automatic (fixo, hífen comum)",
          "r": "igual"
        }
      },
      "leitura": "O texto difere em um caractere: o DM usa travessão (U+2013) antes de \"Automatic\"; o BPMN, hífen. Se o HPSD validar o nome, a chamada falha.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o HPSD o valor exato do name (o travessão do DM parece erro de digitação)."
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "mode",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM aba Request",
      "bpmn": "ONDEMAND (fixo)",
      "valor": {
        "t": "fixo",
        "de": "ONDEMAND"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ONDEMAND ou PROACTIVE · exemplo ONDEMAND",
          "r": "igual"
        },
        "PM": {
          "v": "ONDEMAND",
          "r": "igual"
        },
        "CURL": {
          "v": "ONDEMAND",
          "r": "igual"
        },
        "QA": {
          "v": "ONDEMAND (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "relatedParty AccessDesignator",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM aba Request e Response · US · DFT slide 5",
      "bpmn": "{role: AccessDesignator, id: data_designador}. Mesma variável das INT01/INT03.",
      "valor": {
        "t": "start",
        "de": "START designador → data_designador"
      },
      "fontes": {
        "US": {
          "v": "\"ID DO DESIGNADOR\" na lista de TAGs a confirmar",
          "r": "parcial"
        },
        "DFT": {
          "v": "Envia \"os dados de identificação do serviço e do circuito\"",
          "r": "parcial"
        },
        "DM": {
          "v": "role e id obrigatórios · exemplo SPO-SF123456-069 · aba Response: \"Designador de acesso\"",
          "r": "diverge"
        },
        "PM": {
          "v": "{role: AccessDesignator, id: {{designador}}} ← Asset, item Internet; obrigatório",
          "r": "igual"
        },
        "CURL": {
          "v": "{role: AccessDesignator, id: SPO-SF897657-013} (designador de serviço, final 013)",
          "r": "igual"
        },
        "QA": {
          "v": "{role: AccessDesignator, id: designador}. Campo designador do formulário (padrão SPO-SF703229-069, final 069); sem ele a integração é pulada",
          "r": "parcial"
        }
      },
      "leitura": "O DM pede o designador de acesso (069). O BPMN envia data_designador, que na INT01 é o designador de serviço (013). É o mesmo problema da INT03.",
      "acao": "bpmn",
      "acaoTexto": "Enviar o designador de acesso (069), de uma variável própria no START."
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "relatedParty SistemaOrigem",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM abas Request, Response e Callback",
      "bpmn": "{role: SistemaOrigem, id: ServiceNow, @referredType: Organization} (fixo)",
      "valor": {
        "t": "fixo",
        "de": "ServiceNow"
      },
      "fontes": {
        "DM": {
          "v": "Request (exemplo): ServiceNow + href. Response (exemplo): SalesForce. Callback (tabela): \"SalesForce // Fixo\", mas a descrição diz \"para este caso ServiceNow\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{role: SistemaOrigem, id: ServiceNow, @referredType: Organization}",
          "r": "igual"
        },
        "CURL": {
          "v": "{role: SistemaOrigem, id: ServiceNow, @referredType: Organization}",
          "r": "igual"
        },
        "QA": {
          "v": "{role: SistemaOrigem, id: ServiceNow, @referredType: Organization} (fixo)",
          "r": "igual"
        }
      },
      "leitura": "O BPMN segue o exemplo da Request. O próprio DM se contradiz entre abas (ServiceNow × SalesForce).",
      "acao": "fonte",
      "acaoTexto": "Corrigir no DM o sistema de origem (ServiceNow) nas abas Response e Callback."
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "relatedParty ExternalId",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM abas Request, Response e Callback",
      "bpmn": "{role: ExternalId, id: processInstanceId}. É a chave de correlação do retorno Kafka.",
      "valor": {
        "t": "gerado",
        "de": "execution.getProcessInstanceId()"
      },
      "fontes": {
        "DM": {
          "v": "Domínio do role na tabela: só AccessDesignator | SistemaOrigem. id: \"usar correlatedId do Camunda\". Exemplo: {role: ExternalId, id: {{\"correlationId}}}. Aba Response escreve externalId (minúsculo)",
          "r": "parcial"
        },
        "PM": {
          "v": "{role: ExternalId, id: {{hpsdExternalId}}} = processInstanceId; sem instância, qa-<timestamp>",
          "r": "parcial"
        },
        "CURL": {
          "v": "{role: ExternalId, id: qa-1795007905378} (id de teste, não um processInstanceId)",
          "r": "parcial"
        },
        "QA": {
          "v": "{role: ExternalId, id: processInstanceId do formulário}; vazio = qa-<timestamp>",
          "r": "parcial"
        }
      },
      "leitura": "O DM não fecha nem o valor (correlationId × id do Camunda) nem a grafia do role. Como a correlação do Kafka depende deste campo, os dois lados precisam usar o mesmo valor e a mesma grafia.",
      "acao": "decidir",
      "acaoTexto": "Fechar com o HPSD: id = processInstanceId e role = ExternalId; incluir o role no domínio do DM."
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "relatedService.id",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM aba Request e Response",
      "bpmn": "data_hpsdRelatedServiceId; se vazio, data_designador.",
      "valor": {
        "t": "start",
        "de": "START hpsdRelatedServiceId (opcional) → data_hpsdRelatedServiceId; senão START designador → data_designador"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Identificador do serviço testado\" · exemplo SPO-SF123456-069 (igual ao AccessDesignator) · aba Response: \"Designador de serviço\"",
          "r": "parcial"
        },
        "PM": {
          "v": "{{hpsdRelatedServiceId}}; vazio = {{designador}} (como o BPMN)",
          "r": "igual"
        },
        "CURL": {
          "v": "SPO-SF703229-069 (designador de acesso, de outro circuito que o AccessDesignator)",
          "r": "parcial"
        },
        "QA": {
          "v": "hpsdRelatedServiceId do formulário; vazio = designador",
          "r": "igual"
        }
      },
      "leitura": "O DM não deixa claro se vai o designador de acesso (069, como no exemplo) ou o de serviço (como diz a aba Response). O BPMN depende de um campo opcional do START. No curl, relatedService.id (SPO-SF703229-069) e AccessDesignator (SPO-SF897657-013) são de circuitos diferentes.",
      "acao": "decidir",
      "acaoTexto": "Definir qual designador vai aqui e tornar a variável do START obrigatória."
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "relatedService.name / @referredType",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM aba Request",
      "bpmn": "Internet / Service (fixos)",
      "valor": {
        "t": "fixo",
        "de": "Internet · Service"
      },
      "fontes": {
        "DM": {
          "v": "name obrigatório, exemplo Internet · @referredType opcional, exemplo Service",
          "r": "igual"
        },
        "PM": {
          "v": "Internet / Service",
          "r": "igual"
        },
        "CURL": {
          "v": "Internet / Service",
          "r": "igual"
        },
        "QA": {
          "v": "Internet / Service (fixos)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado com o exemplo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R13",
      "grupo": "request",
      "nome": "testSpecification",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM aba Request",
      "bpmn": "{id: spec-ftth-gpon-basico, @referredType: ServiceTestSpecification} (fixo)",
      "valor": {
        "t": "fixo",
        "de": "spec-ftth-gpon-basico"
      },
      "fontes": {
        "US": {
          "v": "Diagnóstico \"junto ao FTTH do cliente\"",
          "r": "parcial"
        },
        "DM": {
          "v": "id obrigatório, sem domínio na tabela; spec-ftth-gpon-basico só no exemplo",
          "r": "parcial"
        },
        "PM": {
          "v": "spec-ftth-gpon-basico fixo no corpo (a variável hpsdTestSpecificationId existe e não é usada)",
          "r": "igual"
        },
        "CURL": {
          "v": "spec-ftth-gpon-basico",
          "r": "igual"
        },
        "QA": {
          "v": "spec-ftth-gpon-basico fixo; o campo hpsdTestSpecificationId do formulário não entra no corpo",
          "r": "igual"
        }
      },
      "leitura": "O valor veio do exemplo do DM. Nenhuma fonte diz se há outras specs (outra tecnologia, outro perfil).",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o HPSD se a spec é única para todo FTTH B2B."
    },
    {
      "id": "R14",
      "grupo": "request",
      "nome": "characteristic executionMode",
      "tipo": "lista",
      "linha": "BPMN bodyTemplate · DM aba Request",
      "bpmn": "[{name: executionMode, value: AUTOMATIC}] (fixo)",
      "valor": {
        "t": "fixo",
        "de": "executionMode = AUTOMATIC"
      },
      "fontes": {
        "DM": {
          "v": "Lista opcional · \"No modo automático: executionMode=AUTOMATIC\"",
          "r": "igual"
        },
        "PM": {
          "v": "[{name: executionMode, value: AUTOMATIC}]",
          "r": "igual"
        },
        "CURL": {
          "v": "[{name: executionMode, value: AUTOMATIC}]",
          "r": "igual"
        },
        "QA": {
          "v": "[{name: executionMode, value: AUTOMATIC}] (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R15",
      "grupo": "request",
      "nome": "Demais campos opcionais",
      "tipo": "string",
      "linha": "DM aba Request",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "relatedParty[].href (opcional; o exemplo traz href no SistemaOrigem)",
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
      "leitura": "Opcional. Não faz falta.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R16",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN inputParameters · DFT slide 13",
      "bpmn": "connect 3000 ms · resposta 15000 ms · 1 tentativa. Sem boundary \"Falha técnica\".",
      "valor": {
        "t": "fixo",
        "de": "inputParameters do Node_SolicitaDiagnostico"
      },
      "fontes": {
        "DFT": {
          "v": "INT06 Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "POST usa 30000 ms: o timeoutMs 15000 da spec só vale para GET. Sem repetição",
          "r": "diverge"
        }
      },
      "leitura": "As INT01/INT03 têm boundary de timeout/conexão que leva à tela de falha. Aqui não há: um timeout não chega ao Node_FalhaConsulta. Na tela de QA o timeout padrão do POST é 30 s, o dobro do BPMN.",
      "acao": "bpmn",
      "acaoTexto": "Adicionar boundary \"Falha técnica\" → Node_TrataSolicitacaoDiagnostico."
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 / 201 / 202",
      "tipo": "status",
      "linha": "BPMN Node_TrataSolicitacaoDiagnostico · DFT slide 5",
      "bpmn": "Aceite → data_diagnosticoSolicitado = true → Node_AguardaDiagnostico.",
      "valor": {
        "t": "resposta",
        "de": "Node_SolicitaDiagnostico-status → data_diagnosticoSolicitado"
      },
      "fontes": {
        "DFT": {
          "v": "INT07: o HPSD valida e \"devolve o aceite inicial do processamento\"",
          "r": "igual"
        },
        "DM": {
          "v": "Não informa o código HTTP; o exemplo traz state acknowledged",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste aceita 200/201/202. Descrição: aceite não é o resultado final do diagnóstico",
          "r": "igual"
        },
        "QA": {
          "v": "Aceita 200/201/202; corpo deve ser objeto JSON. Avisa que o resultado final vem pelo Kafka",
          "r": "igual"
        }
      },
      "leitura": "O BPMN aceita qualquer 2XX comum. O DM não fixa o código.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "Outro status (4XX / 5XX)",
      "tipo": "status",
      "linha": "BPMN Node_DecDiagnosticoAceito",
      "bpmn": "data_diagnosticoSolicitado = false → Node_FalhaConsulta (\"Não conseguimos verificar\").",
      "valor": {
        "t": "resposta",
        "de": "Node_SolicitaDiagnostico-status → data_diagnosticoSolicitado"
      },
      "fontes": {
        "PM": {
          "v": "Teste reprova status fora de 200/201/202; não diz o que a jornada faz",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência 19/11: HTTP 500 em 49 ms, corpo ecoa o request. A tela marca falha \"fora do contrato\"",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte define o erro do HPSD. Note a diferença: sem resposta no Kafka (timeout), o BPMN agenda visita; com erro na solicitação, encerra na tela de falha.",
      "acao": "decidir",
      "acaoTexto": "Definir se erro do HPSD vai para a tela de falha ou direto para o agendamento."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "body.id",
      "tipo": "string",
      "linha": "BPMN Node_TrataSolicitacaoDiagnostico · DM aba Response",
      "bpmn": "→ data_diagnosticoServiceTestId (só se 2XX). Usado no GET da INT10.",
      "valor": {
        "t": "resposta",
        "de": "body.id → data_diagnosticoServiceTestId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · UUID, ex.: 3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "r": "igual"
        },
        "PM": {
          "v": "Guarda body.id em serviceTestId, só com 200/201/202",
          "r": "igual"
        },
        "QA": {
          "v": "Guarda body.id em serviceTestId, opcional (ausente não reprova). Nenhuma chamada usa depois",
          "r": "igual"
        }
      },
      "leitura": "Único campo lido. Se vier 2XX sem id, o GET da INT10 sai como /serviceTest/sem-id.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "body.state",
      "tipo": "string",
      "linha": "DM aba Response",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · ex.: acknowledged",
          "r": "so-fonte"
        }
      },
      "leitura": "O BPMN decide só pelo status HTTP. Um state de rejeição com 2XX passaria como aceite.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "Headers da resposta",
      "tipo": "header",
      "linha": "DM aba Response",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Content-Type, Authorization (Token JWT), X-Vivo-Transaction-Id (TID…INT004), X-Vivo-Correlation-Id (CID…INT001)",
          "r": "so-fonte"
        }
      },
      "leitura": "Authorization numa resposta não faz sentido; a lista parece copiada da Request.",
      "acao": "fonte",
      "acaoTexto": "Revisar os headers da aba Response no DM."
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "Demais campos do ServiceTest",
      "tipo": "string",
      "linha": "DM aba Response",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "href, name, description, mode, startDateTime, @type, @baseType, @schemaLocation, validFor, characteristic[], relatedParty[], relatedService, testSpecification (com version), testMeasure[]",
          "r": "so-fonte"
        }
      },
      "leitura": "Eco da requisição e metadados. A jornada não precisa.",
      "acao": "nada",
      "acaoTexto": ""
    }
  ]
});
