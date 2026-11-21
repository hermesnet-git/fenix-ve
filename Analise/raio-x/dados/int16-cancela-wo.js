/*
 * Raio-X · INT16 Cancela WO
 * Comparação: BPMN (o que roda) × fontes. Levantamento de 20/11/2026.
 * Mesmas regras de int01-consulta-massiva.js (lista de campos, `linha`, `r`, `acao`).
 * Dois nós idênticos: Node_CancelaWOAgendamento (US09, falha da INT14) e Node_CancelaWO (US10, BD não criado).
 */
RAIOX.registrar({
  "id": "INT16",
  "ordem": 8,
  "nome": "Cancela WO",
  "nomeLongo": "Cancelamento da Work Order e do agendamento no WFM",
  "rota": "Elastic Journey → WFM Orchestration (wfm-journey-orchestration-v1) → TMF697 (INT17)",
  "endpoint": "DELETE ${FENIX_VE_WFM_BASE_URL}/workOrder/{idWorkOrder}?reason=PROBLEMAS SISTEMICOS&context=SISTEMICO",
  "nos": "Node_DecWOIdentificadaFalha · Node_CancelaWOAgendamento · Node_DecWOIdentificadaBD · Node_CancelaWO",
  "resumo": "Cancela a WO quando a INT14 falha (US09) ou quando o BD não é criado (US10). O único dado variável é o id da WO, gravado pela INT14; motivo e contexto são fixos.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US09 Visita não agendada · US10 BD não criado (3ª falha ou recusa)",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 8 (passo a passo INT16–INT17) e slide 14 (inventário INT16/INT17)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v1.1",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Abas Camunda x WFM Journey - Request · Resp OK · Res ERRO",
      "arquivo": "PreDataMapping FTAT-933 - Cancelamento  de WO e agendamento - v1.1.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Pasta 04, request \"INT16 - Cancela WO (WFM DELETE /workOrder/{id})\" (sem resposta salva; usei descrição, pré-script e teste)"
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "postman/curls/INT016.json",
      "detalhe": "Só a requisição DELETE (WO de teste SFTESTE2832006A); o arquivo não traz resposta."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT16' em ESPECIFICACOES; padrões em contextoDaIntegracao(); validações DELETE/headers/URL em montarRequest(). Evidência: rodada-completa/int-07-INT16.json"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → WFM Orchestration"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "WFM Orchestration → Camunda"
    },
    {
      "id": "fluxo",
      "nome": "Quando cancela",
      "sub": "Gateways que levam ao DELETE"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_CancelaWO* · DM Request · DFT inventário",
      "bpmn": "DELETE ${FENIX_VE_WFM_BASE_URL}/workOrder/{id}?reason=…&context=…",
      "valor": {
        "t": "config",
        "de": "env FENIX_VE_WFM_BASE_URL + path montado no script"
      },
      "fontes": {
        "US": {
          "v": "US10: camada wfm-journey-orchestration-v1 solicitando o cancelamento",
          "r": "igual"
        },
        "DFT": {
          "v": "INT16 DELETE /workOrder · endpoint TBD. INT17 (WFM Orchestration → TMF697) DELETE /workOrder/{workorder_id}",
          "r": "parcial"
        },
        "DM": {
          "v": "DELETE /workOrder/{idWorkOrder}?reason={REASON}&context={CONTEXT}",
          "r": "igual"
        },
        "PM": {
          "v": "DELETE {{wfm_base_url}}/workOrder/{{woNumero}}?reason=…&context=… · preprod workforceManagementJourney/v1",
          "r": "igual"
        },
        "CURL": {
          "v": "DELETE http://preprod.oss.vivo.com.br/tlf-api/workforceManagementJourney/v1/workOrder/{id}?reason=…&context=…",
          "r": "igual"
        },
        "QA": {
          "v": "DELETE {wfm}/workOrder/{id}?reason=…&context=…; bloqueia outro método e URL sem id real",
          "r": "igual"
        }
      },
      "leitura": "Alinhado com o DM. O DFT ainda não tem o endpoint da INT16.",
      "acao": "fonte",
      "acaoTexto": "Preencher o endpoint da INT16 no inventário do DFT."
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Request",
      "bpmn": "Bearer do usuário (_authorizationHeader), só se existir. sendToken = false.",
      "valor": {
        "t": "config",
        "de": "Bearer do /advance (Node_Inicio) → _authorizationHeader"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Baerer {{token}}\". Erro de exemplo: 401 Jwt is expired",
          "r": "parcial"
        },
        "PM": {
          "v": "Bearer da collection (token VE, password grant)",
          "r": "igual"
        },
        "CURL": {
          "v": "Authorization: Bearer <token> (vazio no arquivo)",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer obrigatório: sem ele a validação bloqueia o envio",
          "r": "igual"
        }
      },
      "leitura": "O cancelamento roda logo após falhas, às vezes minutos depois do último /advance. Um Bearer expirado faz o DELETE falhar com 401 sem ninguém saber.",
      "acao": "decidir",
      "acaoTexto": "Usar token sistêmico no cancelamento."
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "flow",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Request",
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
          "v": "B2B_MASSIVO",
          "r": "igual"
        },
        "CURL": {
          "v": "B2B_MASSIVO",
          "r": "igual"
        },
        "QA": {
          "v": "flow: B2B_MASSIVO (WFM_HEADERS); outro valor bloqueia o envio",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "requestSystem",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Request",
      "bpmn": "MVE (fixo)",
      "valor": {
        "t": "fixo",
        "de": "'MVE'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · MVE",
          "r": "igual"
        },
        "PM": {
          "v": "MVE",
          "r": "igual"
        },
        "CURL": {
          "v": "MVE",
          "r": "igual"
        },
        "QA": {
          "v": "requestSystem: MVE (WFM_HEADERS); outro valor bloqueia o envio",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Request",
      "bpmn": "TID_ELJY_FTAT933INT008_<ISO agora, UTC>",
      "valor": {
        "t": "gerado",
        "de": "TID_ELJY_FTAT933INT008_ + data/hora UTC"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT008_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "igual"
        },
        "PM": {
          "v": "TID_ELJY_FTAT933INT008_{{$isoTimestamp}}",
          "r": "igual"
        },
        "CURL": {
          "v": "X-Vivo-Transaction-Id: 111 (fictício, sem a máscara)",
          "r": "parcial"
        },
        "QA": {
          "v": "tid('INT008') = TID_ELJY_FTAT933INT008_<ISO>; sem esse prefixo bloqueia o envio",
          "r": "igual"
        }
      },
      "leitura": "Igual ao DM.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM Request",
      "bpmn": "data_correlationId, enviado se existir.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      },
      "fontes": {
        "DM": {
          "v": "Opcional · máscara CID_ELJY_FTAT933INT002_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "parcial"
        },
        "PM": {
          "v": "{{correlationId}} · fallback CID_VE_FTAT933_QA_<ts>",
          "r": "igual"
        },
        "CURL": {
          "v": "X-Vivo-Correlation-Id: 222",
          "r": "igual"
        },
        "QA": {
          "v": "correlationId do formulário; vazio, gera CID_VE_FTAT933_QA_<timestamp>",
          "r": "igual"
        }
      },
      "leitura": "O BPMN repassa o correlationId do canal (CID_VE_…). A máscara do DM diz ELJY e INT002, que não batem com a jornada.",
      "acao": "fonte",
      "acaoTexto": "Corrigir a máscara do correlationId no DM."
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "Accept",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "application/json (fixo). Sem Content-Type, porque não há body.",
      "valor": {
        "t": "fixo",
        "de": "'application/json'"
      },
      "fontes": {
        "PM": {
          "v": "Accept: application/json; sem Content-Type",
          "r": "igual"
        },
        "CURL": {
          "v": "Sem Accept; envia Content-Type: application/json mesmo sem body",
          "r": "parcial"
        },
        "QA": {
          "v": "Accept: application/json; sem Content-Type",
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
      "nome": "idWorkOrder (path)",
      "tipo": "path",
      "linha": "BPMN path · DM Request",
      "bpmn": "data_woNumero, com URL-encode.",
      "valor": {
        "t": "integracao",
        "de": "INT14 → idWorkOrder (ou id gerado data_woIdJornada) → data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US09/US10: cancelar \"a WO criada\"",
          "r": "igual"
        },
        "DM": {
          "v": "Obrigatório · {idWorkOrder}",
          "r": "igual"
        },
        "PM": {
          "v": "{{woNumero}} obrigatório, informado à mão, com encodeURIComponent",
          "r": "igual"
        },
        "CURL": {
          "v": "SFTESTE2832006A (id no formato do WFM, não VE+UUID)",
          "r": "igual"
        },
        "QA": {
          "v": "idWorkOrder da resposta da INT14 ou campo woNumero; encodeURIComponent. Bloqueia vazio ou {placeholder}",
          "r": "igual"
        }
      },
      "leitura": "Usa o id devolvido pela INT14; se não veio, usa o VE+UUID enviado. Só funciona se o WFM aceitar o id da jornada (ver INT14 S02).",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM que o DELETE aceita o VE+UUID."
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "reason (query)",
      "tipo": "query",
      "linha": "BPMN path · DM Request",
      "bpmn": "PROBLEMAS SISTEMICOS (fixo, enviado como PROBLEMAS+SISTEMICOS). Igual nos dois nós.",
      "valor": {
        "t": "fixo",
        "de": "'PROBLEMAS SISTEMICOS'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · PROBLEMAS SISTEMICOS",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmCancelReason}} · fallback PROBLEMAS SISTEMICOS (enviado como %20). A variável cita exemplo do WFM: CHUVA",
          "r": "igual"
        },
        "CURL": {
          "v": "CANCELADO SISTEMICO",
          "r": "diverge"
        },
        "QA": {
          "v": "wfmCancelReason do formulário, padrão PROBLEMAS SISTEMICOS (enviado como %20); vazio bloqueia",
          "r": "igual"
        }
      },
      "leitura": "Valor igual. Na US10 com recusa do cliente o motivo real não é sistêmico, mas o DM só prevê um valor. O curl do WFM usa reason=CANCELADO SISTEMICO, diferente do DM e do BPMN.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se a recusa do cliente (US10) pede outro reason."
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "context (query)",
      "tipo": "query",
      "linha": "BPMN path · DM Request",
      "bpmn": "SISTEMICO (fixo).",
      "valor": {
        "t": "fixo",
        "de": "'SISTEMICO'"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · SISTEMICO",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmCancelContext}} · fallback SISTEMICO",
          "r": "igual"
        },
        "CURL": {
          "v": "SISTEMICO",
          "r": "igual"
        },
        "QA": {
          "v": "wfmCancelContext do formulário, padrão SISTEMICO; vazio bloqueia",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "Body",
      "tipo": "objeto",
      "linha": "BPMN Node_CancelaWO* · DM Request",
      "bpmn": "Sem body.",
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "Body vazio {} (0..0)",
          "r": "igual"
        },
        "PM": {
          "v": "Sem body",
          "r": "igual"
        },
        "CURL": {
          "v": "Sem body (não há --data)",
          "r": "igual"
        },
        "QA": {
          "v": "Sem body; corpo preenchido bloqueia o envio",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN Node_CancelaWO*",
      "bpmn": "Conexão 3 s, resposta 10 s, 1 tentativa. Timeout cai no evento de falha técnica.",
      "valor": {
        "t": "fixo",
        "de": "connectTimeoutMs 3000 · responseTimeoutMs 10000 · maxAttempts 1"
      },
      "fontes": {
        "DFT": {
          "v": "Coluna Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "DELETE usa 30000 ms: o timeoutMs 10000 da spec só vale para GET. Sem repetição (escrita)",
          "r": "diverge"
        }
      },
      "leitura": "Sem retentativa. Uma falha deixa a WO e o agendamento ativos no WFM. Na tela de QA o timeout padrão do DELETE é 30 s.",
      "acao": "decidir",
      "acaoTexto": "Definir retentativa ou fila de compensação para o cancelamento."
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "Sucesso (HTTP 200, body vazio)",
      "tipo": "regra",
      "linha": "BPMN Node_CancelaWO* · DM Resp OK",
      "bpmn": "Não lê o resultado. Status e resposta ficam em Node_CancelaWO*-status/-response, que nada usa. Segue para a tela final.",
      "valor": {
        "t": "resposta",
        "de": "Node_CancelaWO-status / Node_CancelaWOAgendamento-status (sem uso)"
      },
      "fontes": {
        "DFT": {
          "v": "Slide 8: WFM Orchestration devolve o status para atualizar a jornada",
          "r": "parcial"
        },
        "DM": {
          "v": "HTTP 200 · body {}",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste exige 200; 202/204 só gera aviso de que a conclusão ainda requer homologação",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência 19/11: HTTP 200 com corpo vazio. A tela aceita 200/202/204 e só mostra \"WO cancelada\"",
          "r": "parcial"
        }
      },
      "leitura": "O DFT diz que o status atualiza a jornada. O BPMN ignora: sucesso e erro dão no mesmo. O Postman admite 202/204 como possíveis retornos, que o DM não lista.",
      "acao": "decidir",
      "acaoTexto": "Decidir se o resultado do cancelamento precisa ser registrado ou alertado."
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "Erro 400–599 (origin, code, reason, message)",
      "tipo": "objeto",
      "linha": "BPMN Node_CancelaWO* · DM Res ERRO",
      "bpmn": "Não trata. Vai para a mesma tela final.",
      "valor": {
        "t": "resposta",
        "de": "Node_CancelaWO*-response (sem uso)"
      },
      "fontes": {
        "DM": {
          "v": "origin TMF-697-v2 · code 401 · \"Jwt is expired\"",
          "r": "parcial"
        },
        "PM": {
          "v": "Qualquer status ≠ 200 reprova o teste; o corpo de erro não é lido",
          "r": "parcial"
        },
        "QA": {
          "v": "Status fora de 200/202/204 marca alerta (5XX = falha); o corpo de erro não é lido",
          "r": "parcial"
        }
      },
      "leitura": "Uma WO que não foi cancelada fica com técnico agendado. Nada avisa.",
      "acao": "decidir",
      "acaoTexto": "Ver S01."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "Timeout ou falha de conexão",
      "tipo": "regra",
      "linha": "BPMN eventos Node_CancelaWOAgendamento_FalhaTecnica e Node_CancelaWO_FalhaTecnica",
      "bpmn": "Evento de erro leva direto à tela final (Agendamento não realizado ou BD não criado).",
      "valor": {
        "t": "resposta",
        "de": "Node_CancelaWO*-status = java.io.IOException"
      },
      "fontes": {
        "QA": {
          "v": "Timeout de 30 s ou falha de rede = falha, sem repetição",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte trata. Mesmo efeito de S02.",
      "acao": "decidir",
      "acaoTexto": "Ver R12."
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "Headers da resposta",
      "tipo": "header",
      "linha": "DM Resp OK / Res ERRO",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "DM": {
          "v": "X-Vivo-Transaction-Id (INT008) obrigatório · X-Vivo-Correlation-Id opcional",
          "r": "so-fonte"
        }
      },
      "leitura": "Só rastreabilidade.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D01",
      "grupo": "fluxo",
      "nome": "Falha na INT14 (US09)",
      "tipo": "gateway",
      "linha": "BPMN Node_DecWOCriada → Node_DecWOIdentificadaFalha · US09",
      "bpmn": "data_woCriada != true e data_woNumero != null → Node_CancelaWOAgendamento → tela Agendamento não realizado.",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woCriada, data_woNumero"
      },
      "fontes": {
        "US": {
          "v": "US09: WFM não cria a WO; informa ao VE; \"posteriormente\" cancela a WO criada",
          "r": "parcial"
        },
        "DFT": {
          "v": "Slide 8: Elastic Journey solicita o cancelamento com os parâmetros necessários",
          "r": "igual"
        }
      },
      "leitura": "A US informa o cliente antes; o BPMN cancela antes. E cancela mesmo quando a WO talvez nem exista (ver D03).",
      "acao": "decidir",
      "acaoTexto": "Ver INT14 D04."
    },
    {
      "id": "D02",
      "grupo": "fluxo",
      "nome": "BD não criado na 3ª tentativa (US10)",
      "tipo": "gateway",
      "linha": "BPMN Node_DecBDCriado (padrão) → Node_DecWOIdentificadaBD · US10",
      "bpmn": "data_bdCriado != true e data_tentativasBD >= 3 → Node_CancelaWO → tela BD não criado.",
      "valor": {
        "t": "integracao",
        "de": "INT18 → data_bdCriado, data_tentativasBD"
      },
      "fontes": {
        "US": {
          "v": "US10: retentar 3 vezes ao todo; na 3ª falha, cancelar a WO",
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
      "nome": "Cliente não quer tentar de novo (US10)",
      "tipo": "gateway",
      "linha": "BPMN Node_DecRetentarBD (padrão) → Node_DecWOIdentificadaBD · US10",
      "bpmn": "form_retentarBD != 'sim' → Node_CancelaWO → tela BD não criado.",
      "valor": {
        "t": "tela",
        "de": "form_retentarBD (tela Tentar abrir o BD de novo?)"
      },
      "fontes": {
        "US": {
          "v": "US10: NÃO → Elastic Journey manda encerrar; \"posteriormente\" cancela a WO",
          "r": "parcial"
        }
      },
      "leitura": "Mesma regra. A ordem difere: a US encerra a tela primeiro, o BPMN cancela antes de mostrar a tela.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "D04",
      "grupo": "fluxo",
      "nome": "Condição \"Há WO para cancelar?\"",
      "tipo": "gateway",
      "linha": "BPMN Node_DecWOIdentificadaFalha · Node_DecWOIdentificadaBD",
      "bpmn": "data_woNumero != null. A INT14 sempre grava data_woNumero (resposta ou id gerado), então a condição é sempre verdadeira.",
      "valor": {
        "t": "integracao",
        "de": "INT14 → data_woNumero"
      },
      "fontes": {
        "PM": {
          "v": "Pré-script bloqueia o envio sem woNumero. Descrição: não cancelar WO ligada a BD sem autorização",
          "r": "igual"
        },
        "QA": {
          "v": "Pula a INT16 sem woNumero, que vem só do idWorkOrder da INT14 ou do campo manual; não usa id gerado",
          "r": "diverge"
        }
      },
      "leitura": "Os caminhos \"Não\" dos dois gateways nunca rodam. Após 401 ou timeout na INT14, o DELETE vai para uma WO que talvez não exista. A tela de QA só cancela com o idWorkOrder devolvido pela INT14 (ou digitado).",
      "acao": "decidir",
      "acaoTexto": "Aceitar o DELETE sempre (e tolerar 404) ou só cancelar quando o WFM confirmou a WO."
    }
  ]
});
