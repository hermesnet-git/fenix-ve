/*
 * Raio-X · INT10 Resultado do diagnóstico
 * Comparação: BPMN (o que roda) × US, DFT e DM. Levantamento de 20/11/2026.
 * Mesmas regras de int01-consulta-massiva.js (lista de campos, `linha`, `r`, `acao`, `valor`).
 * Cobre a espera (event gateway + timer), o callback Kafka (INT10) e o GET /serviceTest/{id},
 * que nenhuma fonte documenta. Sem aba própria para o GET, a resposta é comparada com a aba Callback do DM.
 */
RAIOX.registrar({
  "id": "INT10",
  "ordem": 4,
  "nome": "Resultado do diagnóstico",
  "nomeLongo": "Resultado do diagnóstico HPSD: callback Kafka (INT10) + consulta GET /serviceTest/{id}",
  "rota": "HPSD → Service Test Result → Kafka (INT08–INT10) → Elastic Journey → API Gateway TMF653 (GET)",
  "endpoint": "Kafka telco.service.servicetestmanagement.servicetestresult · GET ${FENIX_VE_HPSD_BASE_URL}/serviceTest/{data_diagnosticoServiceTestId}",
  "nos": "Node_AguardaDiagnostico · Node_RetornoDiagnostico · Node_TimeoutDiagnostico · Node_ConsultaResultadoDiagnostico · Node_TrataResultadoDiagnostico · Node_DecResultadoDiagnostico",
  "resumo": "A jornada espera o evento do HPSD no Kafka ou o timeout. O evento só acorda a instância: o resultado é lido num GET /serviceTest/{id} e vira resolvido, sem energia ou problema persiste.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US07 Persiste → slot WFM · US12 Resolvido (ID06/07/10) · US13 Sem energia (ID09)",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 5 (passo a passo INT06–INT10) e slide 13 (inventário INT08–INT10)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.0",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Diagnóstico Automático v2.0 · aba Camunda x Kafka - HPSD Callback (tabela e exemplo)",
      "arquivo": "PreDataMapping FTAT-933 - Diagnóstico Automático - v2.0.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Não há item para INT10 nem para o GET /serviceTest/{id} (a versão 12/11 tinha \"INT10 (apoio) - Simula retorno\"). Usei a descrição da pasta 04 e da tela Node_TesteConexao."
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
      "detalhe": "Sem spec INT10. Só a nota da INT06 cita o tópico Kafka (HPSD_TOPIC); a tela não consome Kafka nem faz GET /serviceTest/{id}"
    }
  ],
  "grupos": [
    {
      "id": "espera",
      "nome": "Espera",
      "sub": "Evento ou timeout, o que vier primeiro"
    },
    {
      "id": "callback",
      "nome": "Callback",
      "sub": "Kafka → Camunda (INT10)"
    },
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → HPSD (GET /serviceTest/{id})"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "HPSD → Camunda (GET)"
    },
    {
      "id": "regra",
      "nome": "Decisão",
      "sub": "ID de retorno → próximo passo"
    }
  ],
  "campos": [
    {
      "id": "E01",
      "grupo": "espera",
      "nome": "Espera assíncrona",
      "tipo": "regra",
      "linha": "BPMN Node_AguardaDiagnostico · US12 · DFT slide 5",
      "bpmn": "Event gateway: mensagem RetornoDiagnosticoHPSD ou timer.",
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "US": {
          "v": "US12/US07: HPSD informa via API GTW / MS Service Test Result / Kafka, modo assíncrono",
          "r": "igual"
        },
        "DFT": {
          "v": "INT10 assíncrono: o Kafka envia o resultado ao Elastic Journey",
          "r": "igual"
        },
        "PM": {
          "v": "Tela Node_TesteConexao: \"solicita o diagnóstico ao HPSD e aguarda o retorno\"",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "E02",
      "grupo": "espera",
      "nome": "Timeout do diagnóstico",
      "tipo": "config",
      "linha": "BPMN Node_TimeoutDiagnostico",
      "bpmn": "FENIX_VE_HPSD_TIMEOUT, padrão PT3M → Node_AgendarVisita (\"sem resposta\" = abre BD).",
      "valor": {
        "t": "config",
        "de": "FENIX_VE_HPSD_TIMEOUT (ambiente), padrão PT3M"
      },
      "fontes": {
        "PM": {
          "v": "Descrição de Node_TesteConexao: timeout padrão de 3 min",
          "r": "igual"
        }
      },
      "leitura": "Nenhuma fonte define o tempo. O validFor do exemplo do DM dá 30 min de janela ao teste. Evento que chegar depois do timer não encontra mais a espera.",
      "acao": "decidir",
      "acaoTexto": "Fechar com o HPSD o tempo máximo do diagnóstico e ajustar o timer."
    },
    {
      "id": "K01",
      "grupo": "callback",
      "nome": "Tópico",
      "tipo": "Kafka",
      "linha": "BPMN Node_RetornoDiagnostico (correlationTopic) · DFT slide 13",
      "bpmn": "correlationTopic = telco.service.servicetestmanagement.servicetestresult",
      "valor": {
        "t": "fixo",
        "de": "telco.service.servicetestmanagement.servicetestresult"
      },
      "fontes": {
        "US": {
          "v": "EVENT BROKER/Kafka, sem nome de tópico",
          "r": "parcial"
        },
        "DFT": {
          "v": "INT10 Tópico: telco.service.servicetestmanagement.servicetestresult · Event · Retry N/A",
          "r": "igual"
        },
        "PM": {
          "v": "Pasta 04: o retorno se valida no Kafka, tópico telco.service.servicetestmanagement.servicetestresult (variável hpsdTopic)",
          "r": "igual"
        },
        "QA": {
          "v": "Não consome; a nota da INT06 manda validar no Kafka o tópico telco.service.servicetestmanagement.servicetestresult",
          "r": "igual"
        }
      },
      "leitura": "Igual ao inventário do DFT. O DM não cita o tópico.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "K02",
      "grupo": "callback",
      "nome": "Correlação com a instância",
      "tipo": "regra",
      "linha": "BPMN Node_RetornoDiagnostico (documentation) · INT06 R10 · DM aba Callback",
      "bpmn": "O consumer localiza a instância pelo JSONPath de inbound_correlation_config (fora do BPMN). A INT06 envia relatedParty ExternalId = processInstanceId.",
      "valor": {
        "t": "gerado",
        "de": "processInstanceId, enviado na INT06 como relatedParty ExternalId"
      },
      "fontes": {
        "DM": {
          "v": "relatedParty: \"externalId com o Id do sistema de origem\". Exemplo: role ExternalId, id = correlationId raiz do evento (b3f1c2a0-…); a tabela escreve externalId e não lista correlationId",
          "r": "parcial"
        }
      },
      "leitura": "O DM indica que o evento devolve o ExternalId enviado, mas oscila na grafia do role e mostra um correlationId na raiz que não está na tabela. A regra de correlação não aparece no BPMN.",
      "acao": "decidir",
      "acaoTexto": "Fixar o JSONPath (relatedParty[role=ExternalId].id) e documentá-lo no DM."
    },
    {
      "id": "K03",
      "grupo": "callback",
      "nome": "Headers do evento",
      "tipo": "header",
      "linha": "DM aba Callback",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "X-Vivo-Transaction-Id gerado pelo HPSD · X-Vivo-Correlation-Id CID_VE_FTAT933INT001_… \"gerado pelo VE no início da jornada\"",
          "r": "so-fonte"
        }
      },
      "leitura": "O HPSD só pode devolver o CID do VE se a INT06 enviar. Hoje a INT06 manda um UUID novo (ver INT06 R04).",
      "acao": "bpmn",
      "acaoTexto": "Enviar data_correlationId na INT06."
    },
    {
      "id": "K04",
      "grupo": "callback",
      "nome": "Uso do payload do evento",
      "tipo": "regra",
      "linha": "BPMN Node_RetornoDiagnostico · DFT slide 5 · DM aba Callback",
      "bpmn": "O payload não vira variável. O evento só retoma a instância; o resultado é lido no GET.",
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "US": {
          "v": "US12: HPSD informa pelo Kafka que o problema foi solucionado",
          "r": "parcial"
        },
        "DFT": {
          "v": "O Kafka envia \"o resultado do diagnóstico\" ao Elastic Journey",
          "r": "parcial"
        },
        "DM": {
          "v": "O evento traz o serviceTest completo, com RESULTADO_DIAGNOSTICO e testMeasure",
          "r": "parcial"
        }
      },
      "leitura": "As fontes esperam ler o resultado no próprio evento. O BPMN faz uma chamada a mais (GET), que não está em nenhuma fonte.",
      "acao": "decidir",
      "acaoTexto": "Escolher: ler o resultado do evento, ou documentar o GET /serviceTest/{id} no DFT e no DM."
    },
    {
      "id": "K05",
      "grupo": "callback",
      "nome": "eventType / state final",
      "tipo": "string",
      "linha": "DM aba Callback",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "eventType ServiceTestAttributeValueChangeEvent · fieldPath state,characteristic,testMeasure · state \"completed\" (estado final)",
          "r": "so-fonte"
        }
      },
      "leitura": "O BPMN não filtra tipo nem state: o primeiro evento correlacionado retoma a instância. Um evento intermediário levaria a um GET sem resultado final, que vira \"problema persiste\".",
      "acao": "decidir",
      "acaoTexto": "Confirmar se o HPSD publica só o evento final; senão, filtrar state = completed."
    },
    {
      "id": "K06",
      "grupo": "callback",
      "nome": "Demais campos do evento",
      "tipo": "string",
      "linha": "DM aba Callback (tabela e exemplo)",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "eventId, eventTime, serviceTest.id/href/name/description/mode/startDateTime/endDateTime/validFor/relatedService/testSpecification/testMeasure[].ruleViolation/log_teste. Tabela × exemplo: ABRE_BD string \"true\" × boolean true; log_teste.networkCommandResult × networkCommandResults; metricName IdResult × VLD_BRID_OLT; SistemaOrigem SalesForce × ServiceNow",
          "r": "so-fonte"
        }
      },
      "leitura": "Informativos para a jornada. A tabela e o exemplo do DM se contradizem em vários pontos.",
      "acao": "fonte",
      "acaoTexto": "Alinhar tabela e exemplo da aba Callback."
    },
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_ConsultaResultadoDiagnostico",
      "bpmn": "GET ${FENIX_VE_HPSD_BASE_URL}/serviceTest/{id}; id = data_diagnosticoServiceTestId (URL-encoded) ou \"sem-id\".",
      "valor": {
        "t": "integracao",
        "de": "INT06 → data_diagnosticoServiceTestId"
      },
      "fontes": {},
      "leitura": "Nenhuma fonte documenta este GET: o DFT para na INT10 (Kafka) e o DM não tem aba para ele.",
      "acao": "fonte",
      "acaoTexto": "Incluir o GET /serviceTest/{id} no inventário do DFT e no DM (ou removê-lo, ver K04)."
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM aba Request (INT06)",
      "bpmn": "_authorizationHeader se existir. Roda em asyncBefore: pela documentação do nó, não há Bearer do usuário nesta transação. sendToken = false.",
      "valor": {
        "t": "config",
        "de": "_authorizationHeader (em geral ausente aqui)"
      },
      "fontes": {
        "DM": {
          "v": "Sem aba para o GET. Na INT06 o DM exige Bearer (OAM Token)",
          "r": "parcial"
        }
      },
      "leitura": "Na prática o GET sai sem token. Se o gateway exigir o mesmo token da INT06, a consulta falha e o resultado vira \"persiste\".",
      "acao": "decidir",
      "acaoTexto": "Definir a autenticação do GET (token sistêmico)."
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id / X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "Dois UUIDs aleatórios.",
      "valor": {
        "t": "gerado",
        "de": "UUID.randomUUID()"
      },
      "fontes": {},
      "leitura": "Sem contrato para o GET. Na INT06 o DM pede TID_ELJY_… e CID_VE_… (ver INT06 R03/R04).",
      "acao": "bpmn",
      "acaoTexto": "Usar as mesmas máscaras da INT06 e o data_correlationId."
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN inputParameters · failedJobRetryTimeCycle",
      "bpmn": "connect 3000 ms · resposta 10000 ms · 1 tentativa por job · job async com R3/PT10S. Sem boundary \"Falha técnica\".",
      "valor": {
        "t": "fixo",
        "de": "inputParameters + R3/PT10S"
      },
      "fontes": {},
      "leitura": "Falha técnica repetida esgota as retentativas do job e a instância para em incidente, com o cliente esperando.",
      "acao": "decidir",
      "acaoTexto": "Definir o destino da falha do GET (ex.: agendar visita, como no timeout)."
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 / outros",
      "tipo": "status",
      "linha": "BPMN Node_TrataResultadoDiagnostico",
      "bpmn": "Só 200 é lido. Qualquer outro status → sem ID → PERSISTE → agendar visita.",
      "valor": {
        "t": "resposta",
        "de": "Node_ConsultaResultadoDiagnostico-status"
      },
      "fontes": {},
      "leitura": "Erro no GET vira \"problema persiste\" sem aviso e a jornada abre BD. Nenhuma fonte define isso.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se erro na consulta deve abrir BD."
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "characteristic RESULTADO_DIAGNOSTICO",
      "tipo": "string",
      "linha": "BPMN Node_TrataResultadoDiagnostico · DM aba Callback · US12/13",
      "bpmn": "Lê value e extrai o número (regex ID\\s*[:-]?\\s*0*NN, sem caixa) → data_idRetorno com 2 dígitos.",
      "valor": {
        "t": "resposta",
        "de": "characteristic[RESULTADO_DIAGNOSTICO].value → data_idRetorno"
      },
      "fontes": {
        "US": {
          "v": "US12/US13: \"IDs de Retorno HPSD > Elastic Journey\" (ID06, ID07, ID09, ID10)",
          "r": "igual"
        },
        "DM": {
          "v": "No evento: {name: RESULTADO_DIAGNOSTICO, valueType: string, value: \"ID01\"}",
          "r": "parcial"
        }
      },
      "leitura": "Formato ID01 compatível com o regex. O DM documenta o campo no evento, não no GET; o BPMN supõe que o GET devolve o mesmo serviceTest. data_idRetorno não é usado depois.",
      "acao": "decidir",
      "acaoTexto": "Confirmar que o GET devolve o mesmo characteristic do evento."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "testMeasure[].value.value.resultado_diagnostico",
      "tipo": "string",
      "linha": "BPMN Node_TrataResultadoDiagnostico (reserva) · DM aba Callback",
      "bpmn": "Só se não houver RESULTADO_DIAGNOSTICO: usa o primeiro testMeasure com ID reconhecido.",
      "valor": {
        "t": "resposta",
        "de": "testMeasure[i].value.value.resultado_diagnostico → data_idRetorno"
      },
      "fontes": {
        "DM": {
          "v": "Um resultado por teste. Exemplo: consolidado ID01, testes ID06, ID06, ID02, ID06, ID06",
          "r": "diverge"
        }
      },
      "leitura": "No exemplo do DM, a reserva pegaria ID06 (resolvido) num diagnóstico cujo resultado final é ID01 (abre BD). O resultado por teste não é o consolidado.",
      "acao": "bpmn",
      "acaoTexto": "Remover a reserva por testMeasure; sem RESULTADO_DIAGNOSTICO, tratar como sem resultado."
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "state",
      "tipo": "string",
      "linha": "BPMN Node_TrataResultadoDiagnostico · DM aba Callback",
      "bpmn": "Só registrado em data_resumoDiagnostico. Não entra na decisão.",
      "valor": {
        "t": "resposta",
        "de": "state → data_resumoDiagnostico.state"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Estado final: completed\"",
          "r": "parcial"
        }
      },
      "leitura": "Se o GET vier com o teste ainda em andamento, não há ID e o BPMN agenda visita.",
      "acao": "decidir",
      "acaoTexto": "Tratar state diferente de completed (esperar mais ou tratar como sem resposta)."
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "ABRE_BD / FILA_BD / MENSAGEM_TECNICO / ID_TESTE_GERADOR_RESULTADO",
      "tipo": "string",
      "linha": "DM aba Callback (characteristic)",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Exemplo: ABRE_BD true · FILA_BD ACESSO_N2 · MENSAGEM_TECNICO \"Potência óptica fora dos padrões…\" · ID_TESTE_GERADOR_RESULTADO VLD_POT_OLT",
          "r": "so-fonte"
        }
      },
      "leitura": "O HPSD já diz se deve abrir BD, a fila e a mensagem para o técnico. O BPMN decide só pelo ID e não repassa nada disso ao BD.",
      "acao": "decidir",
      "acaoTexto": "Avaliar usar ABRE_BD/FILA_BD na decisão e MENSAGEM_TECNICO na abertura do BD (INT18)."
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "Resumo do diagnóstico",
      "tipo": "json",
      "linha": "BPMN Node_TrataResultadoDiagnostico · Node_CriaBD",
      "bpmn": "data_resumoDiagnostico = {serviceTestId, httpStatus, state, resultadoDiagnostico}. Vai para payloadDiagnostico na abertura do BD (INT18).",
      "valor": {
        "t": "resposta",
        "de": "GET → data_resumoDiagnostico"
      },
      "fontes": {},
      "leitura": "Resumo em vez do payload inteiro, por causa do limite de 4000 caracteres da variável String. Fora do escopo do DM de diagnóstico.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D01",
      "grupo": "regra",
      "nome": "ID06 / ID07 / ID10 = resolvido",
      "tipo": "regra",
      "linha": "BPMN Node_DecResultadoDiagnostico · US12",
      "bpmn": "RESOLVIDO → Node_ReinicieNovamente (\"Reinicie de novo\" e \"A internet voltou?\").",
      "valor": {
        "t": "resposta",
        "de": "data_idRetorno → data_resultadoDiagnostico"
      },
      "fontes": {
        "US": {
          "v": "US12: ID06 falha corrigida, ID07 sem falha técnica, ID10 reset do modem; VE pede para resetar o modem e checar",
          "r": "igual"
        }
      },
      "leitura": "Igual à US12.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D02",
      "grupo": "regra",
      "nome": "ID09 = sem energia",
      "tipo": "regra",
      "linha": "BPMN Node_DecResultadoDiagnostico · US13",
      "bpmn": "SEM_ENERGIA → Node_SemEnergia (\"Modem sem energia\").",
      "valor": {
        "t": "resposta",
        "de": "data_idRetorno → data_resultadoDiagnostico"
      },
      "fontes": {
        "US": {
          "v": "US13: ID09 = possível falta de energia → tela \"modem sem energia\"",
          "r": "igual"
        }
      },
      "leitura": "Igual à US13.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D03",
      "grupo": "regra",
      "nome": "Outros IDs ou sem resultado = persiste",
      "tipo": "regra",
      "linha": "BPMN Node_DecResultadoDiagnostico · US07/12",
      "bpmn": "PERSISTE → Node_AgendarVisita (consulta de slot e abertura de BD).",
      "valor": {
        "t": "resposta",
        "de": "data_idRetorno → data_resultadoDiagnostico"
      },
      "fontes": {
        "US": {
          "v": "US12: qualquer outro ID = não resolveu. US07: problema persiste → consulta de slot no WFM",
          "r": "igual"
        }
      },
      "leitura": "Igual às US. Sem resultado (ID ausente ou erro no GET) também cai aqui.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D04",
      "grupo": "regra",
      "nome": "Domínio dos IDs",
      "tipo": "regra",
      "linha": "BPMN Node_TrataResultadoDiagnostico · DM aba Callback · US",
      "bpmn": "Aceita ID com 1 ou 2 dígitos; normaliza para 2 (ID6 → 06).",
      "valor": {
        "t": "resposta",
        "de": "regex sobre RESULTADO_DIAGNOSTICO"
      },
      "fontes": {
        "US": {
          "v": "Cita só ID06, ID07, ID09 e ID10",
          "r": "parcial"
        },
        "DM": {
          "v": "Sem lista de domínio; exemplos ID01, ID02, ID06",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte traz a tabela completa de IDs. O BPMN cita ID01, 02 e 08 (Figma) como abertura de BD.",
      "acao": "fonte",
      "acaoTexto": "Pedir ao HPSD a tabela completa de IDs e incluí-la no DM."
    }
  ]
});
