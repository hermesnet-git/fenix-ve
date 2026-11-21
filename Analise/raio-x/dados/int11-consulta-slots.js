/*
 * Raio-X · INT11 Consulta de horários WFM (searchTimeSlot)
 * BPMN (referência) × fontes US, DFT e DM. Levantamento de 20/11/2026.
 * Mesmas regras de int01/int03 (lista de campos, linha, r, acao).
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 * Grupo "escolha": tela Escolha do horário e validação, porque a US07 pede revalidar o slot no WFM.
 */
RAIOX.registrar({
  "id": "INT11",
  "ordem": 6,
  "nome": "Consulta de horários WFM",
  "nomeLongo": "Consulta de slots para visita técnica no WFM (searchTimeSlot) e escolha do horário",
  "rota": "Elastic Journey → WFM Journey Orchestration → WFM (TMF646 searchTimeSlot)",
  "endpoint": "POST ${FENIX_VE_WFM_BASE_URL}/searchTimeSlot",
  "nos": "Node_ConsultaSlots · Node_TrataSlots · Node_DecSlots · Node_EscolheHorario · Node_RegistraHorario · Node_DecHorarioValido",
  "resumo": "Depois do diagnóstico sem solução, busca horários de visita para os próximos 7 dias e mostra até 20 ao cliente. A escolha é conferida só contra a lista já recebida, sem nova chamada ao WFM.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias",
      "curto": "US",
      "contrato": false,
      "detalhe": "US07 Consulta de Slot no WFM (inclui a revalidação) · US08 Geração de WO (ID da WO e slot escolhido)",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 6 (passo a passo INT11/INT12), slide 7 (slot selecionado na INT14) e slide 13 (inventário)",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping v2.2",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Abas Camunda x WFM Journey REQ Vivo1 e REQ Vivo2 · RESP com Slot · RESP sem Slot · RESP ERRO",
      "arquivo": "PreDataMapping FTAT-933 - Consulta de Slot WFM (Revalidação) - v2.2.xlsx"
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Pasta 04, request \"INT11 - Consulta horários (WFM POST /searchTimeSlot)\" (sem resposta salva; usei descrição, pré-script e teste) · pasta 03, tela \"11 - Node_EscolheHorario\" para a escolha"
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "postman/curls/INT11.json",
      "detalhe": "O arquivo não é um curl de /searchTimeSlot: é uma lista JSON com 3 troubleTickets do ServiceNow (sn_ind_tsm_sdwan). Nenhum campo desta integração tem CURL."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT11' (montar/avaliar), periodoConsultaWfm, headersBase/comCorrelacao/tid/WFM_HEADERS, executarTodos (horário manual sem slot) e campos do grupo wfm"
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Camunda → WFM Journey Orchestration"
    },
    {
      "id": "response",
      "nome": "Resposta",
      "sub": "WFM Journey Orchestration → Camunda"
    },
    {
      "id": "escolha",
      "nome": "Escolha do horário",
      "sub": "Tela → Camunda"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "BPMN Node_ConsultaSlots · DM REQ Vivo1/Vivo2 · DFT inventário",
      "bpmn": "POST ${FENIX_VE_WFM_BASE_URL}/searchTimeSlot",
      "valor": {
        "t": "config",
        "de": "environment FENIX_VE_WFM_BASE_URL + /searchTimeSlot"
      },
      "fontes": {
        "US": {
          "v": "Via camada de integração wfm-journey-orchestration-v1",
          "r": "parcial"
        },
        "DFT": {
          "v": "INT11 POST · endpoint TBD · rota MS WFM Orchestration. INT12: oss.vivo.com.br/tmf-api/appointment/v1/searchTimeSlot",
          "r": "parcial"
        },
        "DM": {
          "v": "POST /searchTimeSlot",
          "r": "igual"
        },
        "PM": {
          "v": "POST {{wfm_base_url}}/searchTimeSlot · preprod oss.vivo.com.br/tlf-api/workforceManagementJourney/v1",
          "r": "igual"
        },
        "QA": {
          "v": "POST {wfmBaseUrl}/searchTimeSlot · URL base obrigatória no formulário",
          "r": "igual"
        }
      },
      "leitura": "Método e path batem com o DM. O DFT ainda tem o endpoint da INT11 como TBD.",
      "acao": "fonte",
      "acaoTexto": "Atualizar o inventário do DFT com o endpoint da WFM Orchestration."
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQ Vivo1/Vivo2",
      "bpmn": "Bearer do usuário (_authorizationHeader), enviado só se existir. sendToken = false.",
      "valor": {
        "t": "config",
        "de": "_authorizationHeader (garantido no Node_Inicio)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Baerer {{token}}\" (grafia errada no DM)",
          "r": "parcial"
        },
        "PM": {
          "v": "Bearer da collection (token VE, password grant)",
          "r": "igual"
        },
        "QA": {
          "v": "Bearer do token informado na tela; sem token a chamada é pulada",
          "r": "igual"
        }
      },
      "leitura": "O DM exige o header; o BPMN aceita ausência. O único erro documentado no DM é 401 \"Jwt is expired\", então o token é JWT.",
      "acao": "decidir",
      "acaoTexto": "Confirmar se o WFM aceita o Bearer do usuário ou exige token sistêmico. Corrigir \"Baerer\" no DM."
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "flow",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQ Vivo1/Vivo2",
      "bpmn": "B2B_MASSIVO (fixo)",
      "valor": {
        "t": "fixo",
        "de": "B2B_MASSIVO"
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
        "QA": {
          "v": "B2B_MASSIVO (fixo, WFM_HEADERS)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado. O mesmo valor vai nas outras chamadas ao WFM (INT14 e cancelamentos).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "requestSystem",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQ Vivo1/Vivo2",
      "bpmn": "MVE (fixo)",
      "valor": {
        "t": "fixo",
        "de": "MVE"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · MVE · \"Sistema solicitante da consulta de slot\"",
          "r": "igual"
        },
        "PM": {
          "v": "MVE",
          "r": "igual"
        },
        "QA": {
          "v": "MVE (fixo, WFM_HEADERS)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado com o DM.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQ Vivo1/Vivo2",
      "bpmn": "TID_ELJY_FTAT933INT005_<ISO agora, UTC>",
      "valor": {
        "t": "gerado",
        "de": "TID_ELJY_FTAT933INT005_ + agora (UTC)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · TID_ELJY_FTAT933INT005_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "igual"
        },
        "PM": {
          "v": "TID_ELJY_FTAT933INT005_{{$isoTimestamp}}",
          "r": "igual"
        },
        "QA": {
          "v": "TID_ELJY_FTAT933INT005_<ISO agora, UTC> (helper tid)",
          "r": "igual"
        }
      },
      "leitura": "Igual ao DM. O código INT005 segue a numeração do DM, não a do DFT (INT11).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN script de headers · DM REQ Vivo1/Vivo2",
      "bpmn": "data_correlationId, enviado só se existir.",
      "valor": {
        "t": "start",
        "de": "START correlationId → data_correlationId"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · CID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "parcial"
        },
        "PM": {
          "v": "{{correlationId}} · fallback CID_VE_FTAT933_QA_<ts>",
          "r": "igual"
        },
        "QA": {
          "v": "correlationId do formulário; se vazio, gera CID_VE_FTAT933_QA_<epoch> por execução",
          "r": "igual"
        }
      },
      "leitura": "O DM exige e fixa uma máscara com INT001 e data. O BPMN repassa o que vier do START e aceita ausência.",
      "acao": "decidir",
      "acaoTexto": "Fechar a máscara do correlationId com o VE (mesma pendência da INT03)."
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "Accept / Content-Type",
      "tipo": "header",
      "linha": "BPMN script de headers",
      "bpmn": "application/json nos dois (fixo)",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      },
      "fontes": {
        "PM": {
          "v": "application/json nos dois",
          "r": "igual"
        },
        "QA": {
          "v": "application/json nos dois",
          "r": "igual"
        }
      },
      "leitura": "Padrão HTTP. O DM não lista, sem impacto.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "relatedParty (TT_B)",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1/Vivo2 ordens 6–8",
      "bpmn": "Objeto { name: TT_B, role: acronym } (fixo)",
      "valor": {
        "t": "fixo",
        "de": "name TT_B · role acronym"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · objeto (não lista) · role acronym · name TT_B",
          "r": "igual"
        },
        "PM": {
          "v": "Objeto { name: TT_B, role: acronym }",
          "r": "igual"
        },
        "QA": {
          "v": "Objeto { name: TT_B, role: acronym } (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado, inclusive o formato de objeto. O DM não explica o que é a sigla TT_B.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "relatedEntity (Attendant)",
      "tipo": "lista",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1/Vivo2 ordens 9–12",
      "bpmn": "[{ role: Ouvidoria, id: data_wfmAttendantId, @type: Attendant }]. Sem id, manda lista vazia [].",
      "valor": {
        "t": "start",
        "de": "START wfmAttendantId → data_wfmAttendantId (role e @type fixos)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · lista 1..N · role Ouvidoria · id 80620689 · @type Attendant",
          "r": "parcial"
        },
        "PM": {
          "v": "Sempre lista vazia []; a variável wfmAttendantId existe na collection, mas o INT11 não a usa",
          "r": "parcial"
        },
        "QA": {
          "v": "[{ role: Ouvidoria, id: wfmAttendantId, @type: Attendant }] se preenchido; senão []. Campo sem padrão",
          "r": "igual"
        }
      },
      "leitura": "O DM exige ao menos um item; sem o id o BPMN manda []. Nenhuma fonte diz o que é o id nem quem o fornece. Na INT14 o mesmo id vai com role \"Cliente via Vivo Empresas\".",
      "acao": "decidir",
      "acaoTexto": "Definir a origem do attendantId (fixo do canal ou dado do VE). Se for fixo, levar para configuração e tirar do START."
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "requestedTimeSlot (janela de busca)",
      "tipo": "lista",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1/Vivo2 ordens 13–16 · DFT slide 6",
      "bpmn": "1 janela: início = hoje+1 00:00 e fim = hoje+8 00:00 (America/Sao_Paulo), formato yyyy-MM-ddTHH:mm:ss.SSS-03:00 (29 caracteres).",
      "valor": {
        "t": "gerado",
        "de": "data atual (America/Sao_Paulo) +1 e +8 dias"
      },
      "fontes": {
        "DFT": {
          "v": "INT11 envia \"janela desejada\"",
          "r": "parcial"
        },
        "DM": {
          "v": "Obrigatório · lista 1..N · String 24 · exemplo 2026-07-30T21:00:00.000Z a 2026-08-06T21:00:00.000Z (UTC, 7 dias)",
          "r": "parcial"
        },
        "PM": {
          "v": "1 janela: hoje 00:00 até hoje+7 00:00, com -03:00. O BPMN começa em D+1 e termina em D+8",
          "r": "parcial"
        },
        "QA": {
          "v": "wfmSlotInicio/wfmSlotFim; padrão hoje 00:00 a hoje+7 00:00 (SP, -03:00). Valida fuso e fim > início",
          "r": "parcial"
        }
      },
      "leitura": "A largura bate (7 dias), o formato não: o DM usa UTC com Z (24 caracteres) e o BPMN manda offset -03:00 (29). Nenhuma fonte define a regra da janela; a tela não pede janela ao cliente. O Postman usa hoje até hoje+7, sem o D+1 do BPMN. Na tela de QA a janela começa hoje (sem o D+1) e o valor salvo no navegador é reaproveitado: em 19/11 foi enviada 18/11 a 25/11.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM o formato aceito (Z ou offset) e a regra da janela (início em D+1? quantos dias?)."
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "geographicAddress.networkOwner",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1 ordem 24 / Vivo2 ordem 23",
      "bpmn": "data_wfmNetworkOwner; vazio ou nulo → VIVO1. Só quando = \"VIVO1\" (exato) manda telephonicArea, centralOffice e microArea.",
      "valor": {
        "t": "start",
        "de": "START wfmNetworkOwner → data_wfmNetworkOwner (fallback fixo VIVO1)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · VIVO1 ou VIVO2 (uma aba de request para cada)",
          "r": "parcial"
        },
        "PM": {
          "v": "{{wfmNetworkOwner}} · fallback VIVO1; em VIVO2 remove telephonicArea, centralOffice e microArea",
          "r": "igual"
        },
        "QA": {
          "v": "Select VIVO1/VIVO2, fallback VIVO1; área, central e microárea só em VIVO1",
          "r": "igual"
        }
      },
      "leitura": "A regra VIVO1 × VIVO2 segue o DM. O fallback VIVO1 esconde a falta do dado: com START vazio, a jornada manda um request VIVO1 com área e central vazias. Nenhuma fonte diz de onde vem o dono da rede.",
      "acao": "decidir",
      "acaoTexto": "Definir a origem do networkOwner no START e trocar o fallback por erro."
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "geographicAddress.cnl",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1 ordem 25 / Vivo2 ordem 24",
      "bpmn": "data_wfmCnl, sem fallback (nulo se ausente).",
      "valor": {
        "t": "start",
        "de": "START wfmCnl → data_wfmCnl"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · String 5 · exemplo 11000 · VIVO1 e VIVO2",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmCnl}} · \"\" se não preenchido",
          "r": "igual"
        },
        "QA": {
          "v": "wfmCnl do formulário; \"\" se vazio (o BPMN manda nulo)",
          "r": "igual"
        }
      },
      "leitura": "Alinhado. Também vai para a INT14 (place.cnl). A documentação do nó diz que vem da consulta de asset do VE, mas a origem segue pendente (P08).",
      "acao": "decidir",
      "acaoTexto": "Confirmar quem fornece o CNL no START."
    },
    {
      "id": "R13",
      "grupo": "request",
      "nome": "geographicAddress.postcode",
      "tipo": "string",
      "linha": "BPMN bodyTemplate (exemplo WFM de 12/11/2026)",
      "bpmn": "data_wfmPostcode, sem fallback (nulo se ausente).",
      "valor": {
        "t": "start",
        "de": "START wfmPostcode → data_wfmPostcode"
      },
      "fontes": {
        "US": {
          "v": "US07: tag \"ENDEREÇO\" a confirmar",
          "r": "parcial"
        },
        "DM": {
          "v": "Não declarado nas abas VIVO1 nem VIVO2",
          "r": "diverge"
        },
        "PM": {
          "v": "{{wfmPostcode}} · \"\" se não preenchido",
          "r": "igual"
        },
        "QA": {
          "v": "wfmPostcode do formulário ou da Asset (INT00, place.postcode); \"\" se vazio",
          "r": "igual"
        }
      },
      "leitura": "Vem do exemplo do WFM de 12/11, não do DM. O CEP também alimenta a INT14 e a abertura de BD, então segue necessário no START de qualquer forma. A tela de QA tira o CEP da Consulta de Asset (INT00), uma origem possível para o START.",
      "acao": "fonte",
      "acaoTexto": "Incluir postcode no DM (ou confirmar que o WFM ignora o campo)."
    },
    {
      "id": "R14",
      "grupo": "request",
      "nome": "geographicAddress.country",
      "tipo": "string",
      "linha": "BPMN bodyTemplate",
      "bpmn": "BR (fixo)",
      "valor": {
        "t": "fixo",
        "de": "BR"
      },
      "fontes": {
        "DM": {
          "v": "Não declarado",
          "r": "diverge"
        },
        "PM": {
          "v": "BR (fixo)",
          "r": "igual"
        },
        "QA": {
          "v": "BR (fixo)",
          "r": "igual"
        }
      },
      "leitura": "Campo a mais em relação ao DM. Valor fixo, não depende do START.",
      "acao": "fonte",
      "acaoTexto": "Incluir no DM ou remover do BPMN, conforme o WFM."
    },
    {
      "id": "R15",
      "grupo": "request",
      "nome": "geographicAddress.telephonicArea",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1 ordem 23",
      "bpmn": "Só em VIVO1: data_wfmTelephonicArea, sem fallback (nulo ou \"\" se ausente).",
      "valor": {
        "t": "start",
        "de": "START wfmTelephonicArea → data_wfmTelephonicArea (vazio em VIVO2)"
      },
      "fontes": {
        "DM": {
          "v": "Só VIVO1 · obrigatório · exemplo CB. Ausente em VIVO2",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmTelephonicArea}} só fora de VIVO2 · \"\" se não preenchido",
          "r": "igual"
        },
        "QA": {
          "v": "wfmTelephonicArea só em VIVO1; \"\" se vazio",
          "r": "igual"
        }
      },
      "leitura": "Regra VIVO1/VIVO2 igual ao DM. Em VIVO1 o DM exige; o BPMN manda vazio sem erro. Também vai para a INT14 e a abertura de BD.",
      "acao": "decidir",
      "acaoTexto": "Confirmar quem fornece a área telefônica no START."
    },
    {
      "id": "R16",
      "grupo": "request",
      "nome": "geographicAddress.centralOffice",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1 ordem 26",
      "bpmn": "Só em VIVO1: data_wfmCentralOffice, sem fallback.",
      "valor": {
        "t": "start",
        "de": "START wfmCentralOffice → data_wfmCentralOffice (vazio em VIVO2)"
      },
      "fontes": {
        "DM": {
          "v": "Só VIVO1 · obrigatório · exemplo VM. Ausente em VIVO2",
          "r": "igual"
        },
        "PM": {
          "v": "{{wfmCentralOffice}} só fora de VIVO2 · \"\" se não preenchido",
          "r": "igual"
        },
        "QA": {
          "v": "wfmCentralOffice só em VIVO1; \"\" se vazio",
          "r": "igual"
        }
      },
      "leitura": "Regra VIVO1/VIVO2 igual ao DM. Em VIVO1, START vazio vira central vazia no request.",
      "acao": "decidir",
      "acaoTexto": "Confirmar quem fornece a central no START."
    },
    {
      "id": "R17",
      "grupo": "request",
      "nome": "geographicAddress.microArea",
      "tipo": "string",
      "linha": "BPMN bodyTemplate (exemplo WFM de 12/11/2026)",
      "bpmn": "Só em VIVO1: data_wfmMicroArea (opcional no START; nulo se ausente).",
      "valor": {
        "t": "start",
        "de": "START wfmMicroArea (opcional) → data_wfmMicroArea"
      },
      "fontes": {
        "DM": {
          "v": "Não declarado em VIVO1 nem VIVO2",
          "r": "diverge"
        },
        "PM": {
          "v": "{{wfmMicroArea}} só fora de VIVO2 · \"\" se não preenchido",
          "r": "igual"
        },
        "QA": {
          "v": "wfmMicroArea só em VIVO1; \"\" se vazio (o BPMN manda null)",
          "r": "igual"
        }
      },
      "leitura": "O DM não tem microArea. O BPMN manda \"microArea\": null quando o START não traz o campo.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se microArea faz parte do contrato. Se não, tirar do BPMN e do START."
    },
    {
      "id": "R18",
      "grupo": "request",
      "nome": "mediaType (placePhysicalResourceAssoc)",
      "tipo": "string",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1/Vivo2 ordens 19–22",
      "bpmn": "placePhysicalResourceAssoc { resourceSpecificationCharacteristic: [{ name: mediaType, value: data_wfmMediaType }] }; vazio → GPON.",
      "valor": {
        "t": "start",
        "de": "START wfmMediaType → data_wfmMediaType (fallback fixo GPON)"
      },
      "fontes": {
        "US": {
          "v": "Pré-condição: cliente com FTTH",
          "r": "parcial"
        },
        "DM": {
          "v": "Obrigatório · objeto com lista 1..N · name mediaType · exemplo GPON, sem domínio",
          "r": "igual"
        },
        "PM": {
          "v": "placePhysicalResourceAssoc com mediaType = {{wfmMediaType}} · fallback GPON",
          "r": "igual"
        },
        "QA": {
          "v": "wfmMediaType (formulário já vem com GPON) · fallback GPON",
          "r": "igual"
        }
      },
      "leitura": "Estrutura igual ao DM. O fallback GPON cobre a falta do dado e combina com o escopo FTTH. O mesmo valor vai como Technology/accessTechnology na INT14.",
      "acao": "decidir",
      "acaoTexto": "Definir se mediaType é sempre GPON (vira fixo e sai do START) ou qual a origem e o domínio."
    },
    {
      "id": "R19",
      "grupo": "request",
      "nome": "geographicSite (armário)",
      "tipo": "objeto",
      "linha": "BPMN bodyTemplate · DM REQ Vivo1 ordens 27–29 / Vivo2 ordens 25–27",
      "bpmn": "@type Cabinet (fixo); id = data_wfmGeographicSiteId, omitido se vazio.",
      "valor": {
        "t": "start",
        "de": "START wfmGeographicSiteId → data_wfmGeographicSiteId (@type fixo Cabinet)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · @type Cabinet · id exemplo PRCTA_G1D23 · VIVO1 e VIVO2",
          "r": "parcial"
        },
        "PM": {
          "v": "@type Cabinet · id {{wfmGeographicSiteId}} sempre enviado (\"\" se vazio); o BPMN omite o id",
          "r": "parcial"
        },
        "QA": {
          "v": "@type Cabinet · id wfmGeographicSiteId sempre enviado (\"\" se vazio); o BPMN omite o id",
          "r": "parcial"
        }
      },
      "leitura": "O DM exige o id do armário; o BPMN manda só o @type quando falta. O armário é dado de rede, nenhuma fonte diz quem fornece. A tela de QA manda id \"\" aqui, mas na INT14 usa PRCTA_G1D23 de PADROES_INT14: o armário pode diferir entre as duas chamadas.",
      "acao": "decidir",
      "acaoTexto": "Confirmar a origem do id do armário no START."
    },
    {
      "id": "R20",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "BPMN inputParameters · DFT inventário",
      "bpmn": "connect 3000 ms · resposta 10000 ms · 1 tentativa",
      "valor": {
        "t": "fixo",
        "de": "inputParameters do Node_ConsultaSlots"
      },
      "fontes": {
        "DFT": {
          "v": "INT11 Retry: AS-IS",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout de POST 30 s (o timeoutMs 10000 da spec só vale para GET), ajustável até 30 s; sem retentativa",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte define SLA. Sem retentativa, uma lentidão do WFM leva direto à tela de falha. A tela de QA espera até 30 s, não os 10 s da própria spec.",
      "acao": "decidir",
      "acaoTexto": "Validar timeout com o SLA da WFM Orchestration."
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 com slots",
      "tipo": "status",
      "linha": "BPMN Node_TrataSlots/Node_DecSlots · DM RESP com Slot",
      "bpmn": "200 com ao menos 1 slot válido → data_resultadoSlots = DISPONIVEL → Node_EscolheHorario.",
      "valor": {
        "t": "resposta",
        "de": "Node_ConsultaSlots-status → data_resultadoSlots"
      },
      "fontes": {
        "US": {
          "v": "WFM informa ao EJ opções de slot",
          "r": "igual"
        },
        "DFT": {
          "v": "WFM retorna slots disponíveis",
          "r": "igual"
        },
        "DM": {
          "v": "httpcode 200 · body availableTimeSlot[]",
          "r": "igual"
        },
        "PM": {
          "v": "Teste aceita 200 e confere que availableTimeSlot é lista",
          "r": "igual"
        },
        "QA": {
          "v": "Aceita 200/204; confere availableTimeSlot como lista e conta os horários",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "Sem slot (204 ou lista vazia)",
      "tipo": "status",
      "linha": "BPMN Node_TrataSlots/Node_DecSlots · DM RESP sem Slot",
      "bpmn": "204, ou 200 sem slot válido → SEM_SLOT → tela \"Sem horários disponíveis\" → fim, sem BD.",
      "valor": {
        "t": "resposta",
        "de": "Node_ConsultaSlots-status → data_resultadoSlots"
      },
      "fontes": {
        "DFT": {
          "v": "Sucesso sem slot",
          "r": "igual"
        },
        "DM": {
          "v": "HTTP 204 No Content · body {} · headers de rastreio mantidos",
          "r": "igual"
        },
        "PM": {
          "v": "Teste aceita 204 como resposta válida; lista vazia com 200 não é tratada",
          "r": "igual"
        },
        "QA": {
          "v": "204 aceito como \"sem horário\"; 200 vazio passa. Sem horário, segue com horário manual (amanhã 12h–14h) na INT14",
          "r": "parcial"
        }
      },
      "leitura": "Bate com DM e DFT. A US07 não descreve esse caminho: a jornada encerra sem abrir BD, mesmo com o problema persistindo. Sem horário, a tela de QA segue com um horário manual para testar a INT14; a jornada encerra.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o negócio o que fazer sem horário (encerrar ou abrir BD sem visita)."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "HTTP de erro (401 e outros)",
      "tipo": "status",
      "linha": "BPMN Node_TrataSlots/Node_DecSlots · DM RESP ERRO",
      "bpmn": "Qualquer status fora de 200/204 → FALHA → tela \"Não conseguimos verificar\" → fim. O corpo de erro não é lido.",
      "valor": {
        "t": "resposta",
        "de": "Node_ConsultaSlots-status → data_resultadoSlots = FALHA"
      },
      "fontes": {
        "DFT": {
          "v": "Erro técnico/funcional",
          "r": "igual"
        },
        "DM": {
          "v": "Só 401: { origin: TMF-646-v1, code: \"401\", reason/message: \"Jwt is expired\" }",
          "r": "parcial"
        },
        "PM": {
          "v": "Teste reprova qualquer status fora de 200/204; corpo de erro não é lido",
          "r": "igual"
        },
        "QA": {
          "v": "Fora de 200/204 vira alerta ou falha; 401/403 = \"Token recusado\". Corpo exibido, não lido. Segue com horário manual",
          "r": "parcial"
        }
      },
      "leitura": "O DM documenta só o 401 de token expirado. O BPMN não renova o token nem tenta de novo; o cliente vê a tela de falha.",
      "acao": "decidir",
      "acaoTexto": "Pedir ao WFM os demais códigos (400, 5XX) e decidir se o 401 deve renovar o token."
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "Falha técnica (timeout, conexão)",
      "tipo": "status",
      "linha": "BPMN Node_ConsultaSlots (sem boundary) · DFT slide 6",
      "bpmn": "Sem boundary \"Falha técnica\" (INT01, INT03 e INT14 têm). Se o httpTask lançar erro no timeout, a instância para em incidente.",
      "valor": {
        "t": "nenhum",
        "de": "sem tratamento"
      },
      "fontes": {
        "DFT": {
          "v": "WFM retorna erro técnico/funcional",
          "r": "parcial"
        },
        "QA": {
          "v": "Timeout de 30 s vira falha \"Sem resposta\"; sem retentativa (POST). Segue com horário manual",
          "r": "parcial"
        }
      },
      "leitura": "A INT01, a INT03, a INT14 e a abertura de BD têm boundary; esta não. Um timeout pode deixar o cliente sem resposta.",
      "acao": "bpmn",
      "acaoTexto": "Adicionar boundary \"Falha técnica\" → Node_FalhaConsulta, como nas outras integrações."
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "Headers da resposta (TID / CID)",
      "tipo": "header",
      "linha": "DM RESP com Slot, sem Slot e ERRO",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "não lidos"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatórios nas três respostas · mesmas máscaras do request",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não lê; os headers só aparecem no resultado",
          "r": "igual"
        }
      },
      "leitura": "Só rastreio. O BPMN não precisa ler.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "availableTimeSlot[]",
      "tipo": "lista",
      "linha": "BPMN Node_TrataSlots · DM RESP com Slot ordem 3",
      "bpmn": "Lido só com status 200. Descarta itens sem validFor.startDateTime ou com data inválida, ordena por startDateTime.",
      "valor": {
        "t": "resposta",
        "de": "Node_ConsultaSlots-response → data_slotsWfm"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · lista 1..N",
          "r": "igual"
        },
        "PM": {
          "v": "Confere Array.isArray(availableTimeSlot) e registra a quantidade no console",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: 60 horários fora de ordem. A tela descarta itens sem validFor.startDateTime e ordena por startDateTime",
          "r": "igual"
        }
      },
      "leitura": "Alinhado. Itens descartados somem sem log. Evidência 19/11: o WFM devolveu os horários fora de ordem, o que confirma a necessidade de ordenar.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "availableTimeSlot[].id",
      "tipo": "string",
      "linha": "BPMN Node_TrataSlots · DM RESP com Slot ordem 4",
      "bpmn": "Reserva de validFor.timeslot (timeslot ?: id).",
      "valor": {
        "t": "resposta",
        "de": "availableTimeSlot[].id → data_slotsWfm[].timeslot (reserva)"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Faixa do slot\" · exemplo 15:30-17:30",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: id igual a validFor.timeslot nos 60 horários. A tela usa timeslot ?: id",
          "r": "igual"
        }
      },
      "leitura": "Não é identificador único: o exemplo do DM traz dois slots com o mesmo id em dias diferentes. Por isso o BPMN usa o índice da lista como value.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S08",
      "grupo": "response",
      "nome": "resourceId / resourceName (bucket)",
      "tipo": "string",
      "linha": "BPMN Node_TrataSlots · DM RESP com Slot ordens 5–6",
      "bpmn": "Guardados no slot e repassados à INT14 (relatedParty TimeSlot).",
      "valor": {
        "t": "resposta",
        "de": "availableTimeSlot[].resourceId/resourceName → data_slotsWfm → data_slotEscolhido"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatórios · exemplos BKT_CURITIBA_VIVO_FB e \"Bucket - Bucket_Curitiba Vivo\"",
          "r": "igual"
        },
        "QA": {
          "v": "Guarda resourceId (\"\" se ausente) e resourceName (null se ausente) no slot e repassa à INT14",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S09",
      "grupo": "response",
      "nome": "validFor.timeslot",
      "tipo": "string",
      "linha": "BPMN Node_TrataSlots · DM RESP com Slot ordem 8",
      "bpmn": "Guardado como timeslot; vai para a INT14 como TimeSlot.id. Rótulo usa a hora se não houver endDateTime.",
      "valor": {
        "t": "resposta",
        "de": "validFor.timeslot → data_slotsWfm[].timeslot"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatório · \"Janela\" · exemplo 15:30-17:30",
          "r": "igual"
        },
        "QA": {
          "v": "Guardado como slot.timeslot → INT14 TimeSlot.id",
          "r": "igual"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S10",
      "grupo": "response",
      "nome": "validFor.startDateTime / endDateTime",
      "tipo": "string",
      "linha": "BPMN Node_TrataSlots · DM RESP com Slot ordens 9–10",
      "bpmn": "Lidos como OffsetDateTime e convertidos para America/Sao_Paulo. Gera rótulo \"Sábado, 21/11/2026 - 15h30 às 17h30\", data dd/MM/yyyy e período \"Entre 15h30 e 17h30\". Guarda os originais em start/end.",
      "valor": {
        "t": "resposta",
        "de": "validFor.start/endDateTime → data_slotsWfm[].start/end"
      },
      "fontes": {
        "DM": {
          "v": "Obrigatórios · exemplo 2026-07-21T15:30:00.000-03:00 / 2026-07-21T17:30:00.000-03:00",
          "r": "igual"
        },
        "QA": {
          "v": "Guarda start/end como vieram, sem converter fuso nem gerar rótulos; vão à INT14 e à previsão do BD (INT18)",
          "r": "parcial"
        }
      },
      "leitura": "Alinhado. A resposta usa offset -03:00, enquanto o request do DM usa Z.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S11",
      "grupo": "response",
      "nome": "Limite de 20 horários",
      "tipo": "regra",
      "linha": "BPMN Node_TrataSlots",
      "bpmn": "Mantém os 20 primeiros por data; o resto é descartado.",
      "valor": {
        "t": "fixo",
        "de": "20 (no script)"
      },
      "fontes": {
        "DM": {
          "v": "Lista 1..N, sem limite",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência 19/11: 60 horários em 6 dias. A tela não limita: ordena e usa só o primeiro",
          "r": "parcial"
        }
      },
      "leitura": "Regra só do BPMN; nenhuma fonte define quantos horários mostrar. A lista da tela aceita até 50. Evidência 19/11: a consulta trouxe 60 horários, três vezes o limite.",
      "acao": "decidir",
      "acaoTexto": "Validar com negócio/UX quantos horários exibir."
    },
    {
      "id": "S12",
      "grupo": "response",
      "nome": "Opções enviadas ao VE",
      "tipo": "variáveis",
      "linha": "BPMN Node_TrataSlots · US07",
      "bpmn": "data_resultadoSlots (DISPONIVEL | SEM_SLOT | FALHA) · data_horariosVisita (texto JSON [{value, label}]) · data_slotsWfm (Spin JSON com start, end, timeslot, resourceId, resourceName, data, periodo).",
      "valor": {
        "t": "resposta",
        "de": "availableTimeSlot[] → data_horariosVisita / data_slotsWfm"
      },
      "fontes": {
        "US": {
          "v": "EJ informa ao BFF/VE (pooling Redis) as opções de slot",
          "r": "igual"
        }
      },
      "leitura": "Alinhado com a US07. data_slotsWfm é Spin JSON porque 20 horários passam de 4000 caracteres.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T01",
      "grupo": "escolha",
      "nome": "Horário escolhido (form_horarioVisita)",
      "tipo": "string",
      "linha": "BPMN Node_EscolheHorario/Node_RegistraHorario · US07",
      "bpmn": "Índice do item escolhido (\"0\" a \"19\") na lista data_horariosVisita. A tela também tem um seletor de data (form_dataVisita) que o BPMN não lê aqui.",
      "valor": {
        "t": "tela",
        "de": "Tela Escolha do horário → form_horarioVisita"
      },
      "fontes": {
        "US": {
          "v": "Cliente escolhe dia e horário no VE; VE informa ao EJ",
          "r": "igual"
        },
        "PM": {
          "v": "Tela 11: answers.horarioVisita = value do item de eh_horarios (padrão \"0\"); também envia dataVisita",
          "r": "igual"
        },
        "QA": {
          "v": "Sem escolha do cliente: usa o primeiro horário por data (slots[0]) ou o horário manual",
          "r": "parcial"
        }
      },
      "leitura": "Bate com a US07. O DM desta integração não tem campo para o slot escolhido.",
      "acao": "bpmn",
      "acaoTexto": "Tirar o seletor de data da tela ou usá-lo para filtrar a lista."
    },
    {
      "id": "T02",
      "grupo": "escolha",
      "nome": "Avisar horário mais cedo (form_avisarHorarioMaisCedo)",
      "tipo": "boolean",
      "linha": "BPMN Node_EscolheHorario/Node_RegistraHorario",
      "bpmn": "Checkbox opcional → data_avisarHorarioMaisCedo (true só se o texto for \"true\") → INT14 canBeAntecipated.",
      "valor": {
        "t": "tela",
        "de": "Tela Escolha do horário → form_avisarHorarioMaisCedo → data_avisarHorarioMaisCedo"
      },
      "fontes": {
        "PM": {
          "v": "Tela 11: answers.avisarHorarioMaisCedo = {{avisarHorarioMaisCedo}} (padrão \"false\", texto)",
          "r": "igual"
        },
        "QA": {
          "v": "Checkbox wo_canBeAntecipated (\"Permitir antecipar agendamento\"), marcado por padrão → canBeAntecipated",
          "r": "parcial"
        }
      },
      "leitura": "Nenhuma fonte desta etapa cita o campo. O destino está no DM de Abertura de WO (canBeAntecipated). A tela de QA marca a antecipação por padrão; o BPMN só manda true se o cliente marcar.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T03",
      "grupo": "escolha",
      "nome": "Revalidação do slot escolhido",
      "tipo": "regra",
      "linha": "BPMN Node_RegistraHorario/Node_DecHorarioValido · US07 Resultado esperado · DFT slide 7",
      "bpmn": "Só confere se o índice escolhido existe em data_slotsWfm → data_horarioValido. Não chama o WFM de novo.",
      "valor": {
        "t": "gerado",
        "de": "form_horarioVisita × data_slotsWfm → data_horarioValido"
      },
      "fontes": {
        "US": {
          "v": "US07: após a escolha, o EJ deve chamar o WFM via wfm-journey-orchestration-v1 (DM Consulta de Slot - Revalidação) informando dia e horário",
          "r": "diverge"
        },
        "DFT": {
          "v": "Slide 7: EJ valida os dados da jornada e aciona a INT14 com o slot selecionado; sem passo de revalidação",
          "r": "igual"
        },
        "DM": {
          "v": "O nome diz \"Revalidação\", mas as abas só têm a busca por janela; nenhum campo para o slot escolhido",
          "r": "parcial"
        },
        "PM": {
          "v": "Não há request de revalidação; só uma chamada /searchTimeSlot. Descrição: não seleciona slot",
          "r": "igual"
        },
        "QA": {
          "v": "Não revalida nem confere índice: usa o slot guardado da INT11 direto na INT14",
          "r": "parcial"
        }
      },
      "leitura": "A US07 pede uma segunda chamada ao WFM para confirmar o slot; o BPMN não faz. Entre a consulta e a INT14 o slot pode ter sido ocupado, e o erro só aparece na criação da WO.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM se a revalidação é nova /searchTimeSlot com a janela do slot escolhido ou se a INT14 já recusa slot ocupado. Se for nova chamada, incluir no BPMN."
    },
    {
      "id": "T04",
      "grupo": "escolha",
      "nome": "Horário inválido",
      "tipo": "regra",
      "linha": "BPMN Node_DecHorarioValido",
      "bpmn": "data_horarioValido = false → volta para Node_EscolheHorario com a mesma lista, sem mensagem e sem limite de tentativas.",
      "valor": {
        "t": "gerado",
        "de": "data_horarioValido"
      },
      "fontes": {},
      "leitura": "Nenhuma fonte trata. Hoje só acontece se o VE mandar valor fora da lista.",
      "acao": "bpmn",
      "acaoTexto": "Mostrar aviso ao voltar à tela; com revalidação, reconsultar o WFM."
    },
    {
      "id": "T05",
      "grupo": "escolha",
      "nome": "Dados do slot escolhido",
      "tipo": "variáveis",
      "linha": "BPMN Node_RegistraHorario · US08 · DFT slide 7",
      "bpmn": "data_slotEscolhido (JSON) · data_dataVisita (dd/MM/yyyy) · data_woHorario (\"Entre 15h30 e 17h30\") · data_visitaInicio / data_visitaFim. Usados na INT14 (scheduleDate, TimeSlot) e nas telas seguintes.",
      "valor": {
        "t": "resposta",
        "de": "data_slotsWfm[form_horarioVisita] → data_slotEscolhido e derivados"
      },
      "fontes": {
        "US": {
          "v": "US08: EJ chama o WFM informando dia e horário escolhidos",
          "r": "igual"
        },
        "DFT": {
          "v": "Slide 7: INT14 com o slot selecionado",
          "r": "igual"
        },
        "PM": {
          "v": "Na pasta 04 o slot vai à mão para a INT14 (slotInicio, slotFim, slotTimeslot, slotResourceId); a INT11 não o guarda",
          "r": "parcial"
        },
        "QA": {
          "v": "saidas.slot { inicio, fim, timeslot, resourceId, resourceName } → INT14 e INT18 (previsão \"dd/MM/yyyy HH:mm-HH:mm\")",
          "r": "parcial"
        }
      },
      "leitura": "Alinhado.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "T06",
      "grupo": "escolha",
      "nome": "ID da WO da jornada",
      "tipo": "string",
      "linha": "BPMN Node_RegistraHorario · US08",
      "bpmn": "data_woIdJornada = \"VE\" + UUID (38 caracteres), gerado só quando o horário é válido.",
      "valor": {
        "t": "gerado",
        "de": "VE + UUID aleatório → data_woIdJornada"
      },
      "fontes": {
        "US": {
          "v": "US08: EJ deve gerar o ID da WO para usar no fluxo sistêmico",
          "r": "igual"
        },
        "PM": {
          "v": "INT14 do Postman: woIdJornada com fallback \"VE\" + {{$guid}}",
          "r": "igual"
        },
        "QA": {
          "v": "\"VE\" + UUID gerado a cada montagem da INT14, não ao escolher o horário",
          "r": "igual"
        }
      },
      "leitura": "Atende a US08. Nenhuma fonte define formato nem tamanho do id.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM o formato e o tamanho aceitos para o id externo da WO."
    }
  ]
});
