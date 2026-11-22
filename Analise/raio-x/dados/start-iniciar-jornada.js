/*
 * Raio-X · START Iniciar Jornada (POST /process-instance na fachada ms-journey-v1)
 * Entrada da jornada fenix-ve-abertura-bd: o VE manda o envelope e as variáveis de início.
 * BPMN (referência) × fontes. Formato em ../README.md.
 * bpmn = onde o BPMN declara e lê a variável (data_<nome> no motor); null = o BPMN não declara nem lê.
 * valor.t = origem do valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 *   integracao = vem da Consulta de Asset (INT00) feita pelo VE antes do START; nenhum = sem origem definida.
 * valores = domínio, formato e exemplo fictício. Nunca copie aqui tokens, o valor do iss nem dados pessoais.
 */
RAIOX.registrar({
  "id": "START",
  "secao": "jornada",
  "ordem": 0,
  "nome": "Iniciar Jornada",
  "nomeLongo": "Início da jornada Abertura de BD pelo VE (variáveis do START)",
  "rota": "Canal VE / BFF → fachada ms-journey-v1 → motor wf-journey-motor-v1 (Camunda 7) → Node_Start",
  "endpoint": "POST {journey}/process-instance  { processDefinitionKey, businessKey, assignee, channelType, variables{44 chaves} }",
  "nos": "Node_Start (44 chaves obrigatórias + opcionais) · Node_Inicio (1ª tela) · leitores: Node_ConsultaMassiva, Node_ConsultaBD, Node_AvaliaImpedimentos, Node_SolicitaDiagnostico, Node_ConsultaSlots, Node_CriaWO, Node_CancelaWOAgendamento, Node_CriaBD, Node_CancelaWO",
  "resumo": "O VE cria a instância e manda as variáveis de início. A fachada exige as 44 chaves do Node_Start (400 se faltar alguma), grava cada uma como data_<nome> e devolve a tela Node_Inicio. O Asset preenche 14 chaves, o VE gera 2 e a configuração do canal dá o issServiceNow. As outras 27 não têm origem definida. Dos dois DMs com aba VE x Camunda, só o de Massivas descreve o START (5 variáveis, com outros nomes); o de WO descreve o /advance da escolha de horário.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias (US)",
      "curto": "US",
      "contrato": false,
      "detalhe": "US01 a US03 Premissa 3 (bloqueio financeiro no status do produto FTTH; o VE passa ao EJ o payload da consulta de assets e o EJ o interpreta) e Req01 (telas 'Agora, vamos verificar…' e 'Analisando e fazendo ajustes'); US03 Req01 a Req03 e CA001 a CA003 (combinações com fatura em aberto); US01 a US03 Observação 2 (falha de consulta vira SDUI); todas, menos a US12: 'VE inicia o workflow \"feature FTAT-933\" (com ID único por workflow)'; todas: TAGs de entrada a confirmar (CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC); Premissas 1 e 2 (formato SDUI task_encontrou_cliente.v1.0.0); US07 e US09 a US12: SDUI 'através de pooling em fila do Redis'.",
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/"
    },
    {
      "id": "DFT",
      "nome": "DFT v1.2",
      "curto": "DFT",
      "contrato": false,
      "detalhe": "Slide 4 (Consulta de Assets: a decisão de bloqueio é do VE/APP), slides 2 e 3 (designador 013 na Massiva, 069 no BD), slide 12 (EJ × VE).",
      "arquivo": "DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx"
    },
    {
      "id": "DM",
      "nome": "Datamapping WO v2.2",
      "curto": "DM",
      "contrato": true,
      "detalhe": "Só dois DMs têm aba VE x Camunda. WO v2.2: abas VE x Camunda - Request (linhas 4 a 32, exemplo B34), VE x Camunda - Response (linhas 4 a 27) e VE x Camunda - Request_OLD (oculta, só histórico). A aba Request do WO descreve o POST /process-instance/{id}/advance da escolha de horário (detalhada na INT14, grupo Tela de horário), não o START. Massivas v2.1 (em outros): VE x Camunda - Request (linhas 5 a 16, exemplo A18) é o único lugar que documenta o START. As duas abas Response são idênticas. Nenhum dos dois DMs documenta issServiceNow (uma versão posterior, fora do repositório, documenta).",
      "arquivo": "PreDataMapping FTAT-933 - Abertura de WO e agendamento - v2.2.xlsx",
      "outros": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "detalhe": "Abas VE x Camunda - Request/Response"
        }
      ]
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "detalhe": "Request '01 - Jornada / 01 - Iniciar jornada' (body, pre-request e teste; sem resposta salva), o teste de '00 - Consulta de Asset (preenche entradas)', que grava 14 chaves, e as variáveis da collection. O pre-request gera businessKey, correlationId e requestTimestamp, completa com '' as chaves sem valor e bloqueia o envio se faltar designador, productStatus ou issServiceNow.",
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json"
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "",
      "detalhe": "Não há curl para o START em postman/curls/."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "A tela não chama o START: executa as integrações direto. Quem faz o papel das variáveis do START é o formulário (CAMPOS.jornada, wfm, int14, int18), mais a saída entradasAsset da INT00, os padrões PADROES_INT14 (curl do WFM) e a constante ISS_SERVICENOW. Evidências da fachada: evidencias/2026-11-19-rodada-inicial/01-inicio-response.sanitizado.json (201) e evidencias/2026-11-19-rodada-complementar/01-start_sem_designador.json (400)."
    }
  ],
  "grupos": [
    {
      "id": "envelope",
      "nome": "Envelope e headers",
      "sub": "VE → fachada: corpo de POST /process-instance fora de variables"
    },
    {
      "id": "controle",
      "nome": "Identificação e controle",
      "sub": "variables: serviço, status, correlação e configuração"
    },
    {
      "id": "rede",
      "nome": "Rede e agendamento (WFM)",
      "sub": "variables wfm*: dados de rede para INT11 e INT14 (P08)"
    },
    {
      "id": "cliente",
      "nome": "Cliente e contato",
      "sub": "variables wo_*: cliente, documento e contato (INT14, INT18)"
    },
    {
      "id": "pedido",
      "nome": "Pedido e detalhe da WO",
      "sub": "variables wo_*: pedido comercial e detalhe do defeito (INT14)"
    },
    {
      "id": "endereco",
      "nome": "Endereço de instalação",
      "sub": "variables wfmPostcode e wo_*: endereço (INT11, INT14, INT18)"
    },
    {
      "id": "produto",
      "nome": "Produto, Asset e BD",
      "sub": "variables wo_*, bd_* e opcionais: produtos e ids de serviço"
    },
    {
      "id": "resposta",
      "nome": "Resposta",
      "sub": "fachada → VE: instância criada (201) ou chave ausente (400)"
    },
    {
      "id": "us",
      "nome": "Regras das histórias (US)",
      "sub": "regras declaradas nas US sem linha própria"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "envelope",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "DM Massivas VE x Camunda - Request A18 · DM WO VE x Camunda - Request B34 · Postman 01/01 · dossiê (fachada ms-journey-v1)",
      "bpmn": "A fachada cria a instância de fenix-ve-abertura-bd e roda Node_Start → Node_Inicio. O BPMN não vê o endpoint.",
      "valor": {
        "t": "config",
        "de": "URL da fachada por ambiente (journey/v1)"
      },
      "valores": "POST {journey}/process-instance; preprod em …/journey/v1",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request (exemplo A18): POST /journey/v1/process-instance | WO v2.2 · Request e Request_OLD: POST /process-instance/{processInstanceId}/advance (o /advance da escolha de horário, não o START)",
          "r": "parcial"
        },
        "PM": {
          "v": "POST {{journey_base_url}}/process-instance",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 19
        }
      ],
      "leitura": "Só o DM de Massivas descreve o START, e bate com o Postman. A aba VE x Camunda - Request do DM de WO tem o mesmo nome, mas descreve o /advance da escolha de horário (INT14): quem a ler como contrato do START vai montar a chamada errada. A tela de QA não inicia a jornada.",
      "acao": "fonte",
      "acaoTexto": "Deixar claro nos DMs que a aba VE x Camunda do WO é o /advance da escolha de horário (INT14) e que o START está só no DM de Massivas."
    },
    {
      "id": "R02",
      "grupo": "envelope",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "DM VE x Camunda D5 · Postman auth da collection",
      "bpmn": "O START não lê o token. O Bearer do usuário fica em _authorizationHeader no /advance da Node_Inicio e segue nas INTs.",
      "valor": {
        "t": "config",
        "de": "token do usuário VE (OAM, password grant na collection)"
      },
      "valores": "Bearer <JWT do usuário>",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · String · Bearer Token | WO v2.2: não consta (nem no /advance)",
          "r": "igual"
        },
        "PM": {
          "v": "Bearer {{fenix_access_token}} (auth da collection, renovado no pre-request)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 5
        }
      ],
      "leitura": "Bate. A estratégia de token para o restante da jornada (usuário ou sistêmico) é tratada na INT01 R02.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R03",
      "grupo": "envelope",
      "nome": "X-Vivo-Transaction-Id",
      "tipo": "header",
      "linha": "DM Massivas VE x Camunda - Request D6 e A18 · DM WO VE x Camunda - Request D5 e D14",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "não enviado"
      },
      "valores": "Massivas (START): TID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ. WO (/advance): TID_VE_FTAT933INT006_… no header e TID_VE_FTAT933INT008_… em answers.header",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · String · TID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ; o exemplo A18 o repete em variables | WO v2.2 · Request (/advance): header TID_VE_FTAT933INT006_… e answers.header TID_VE_FTAT933INT008_…",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 6
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
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
      "leitura": "O DM de Massivas o declara obrigatório no START, mas a collection inicia a jornada sem ele (201). O exemplo do DM o repete em variables, onde o BPMN não lê. Cada DM usa uma numeração própria: INT001 no START, INT006 e INT008 no /advance do WO.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com a fachada se o header é exigido e para onde vai; fechar uma numeração de TID por chamada do VE e corrigir o exemplo do DM de Massivas (header, não variável)."
    },
    {
      "id": "R04",
      "grupo": "envelope",
      "nome": "Content-Type e Accept",
      "tipo": "header",
      "linha": "Postman 01/01 headers",
      "bpmn": "Não se aplica: header da chamada à fachada; o BPMN não vê.",
      "valor": {
        "t": "fixo",
        "de": "application/json"
      },
      "valores": "application/json",
      "fontes": {
        "PM": {
          "v": "Accept e Content-Type: application/json",
          "r": "igual"
        }
      },
      "leitura": "Constante técnica da chamada à fachada.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R05",
      "grupo": "envelope",
      "nome": "processDefinitionKey",
      "tipo": "body",
      "linha": "DM Massivas VE x Camunda - Request D9 e A18 · DM WO Request_OLD D12 · Postman 01/01 · BPMN process id",
      "bpmn": "bpmn:process id=fenix-ve-abertura-bd (versionTag v1); a fachada acha a jornada pelo espec_registry.process_key.",
      "valor": {
        "t": "config",
        "de": "chave publicada do processo"
      },
      "valores": "fenix-ve-abertura-bd",
      "fontes": {
        "US": {
          "v": "Todas as US (Workflow): 'VE inicia o workflow \"feature FTAT-933\"' (US01 'para Consulta BD'; US04 a US13 'para Consulta BD e Consulta Massiva e Manutenção Programada')",
          "r": "parcial"
        },
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · string · ex. jornada-venda-v1 (tabela) e jornada-autoatendimento-bd-v1 (A18) | WO v2.2 · Request_OLD (histórico): ex. jornada-venda-v1 | WO v2.2 · Request: não consta",
          "r": "diverge"
        },
        "PM": {
          "v": "{{processDefinitionKey}} = fenix-ve-abertura-bd",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 9
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 12
        }
      ],
      "leitura": "Todos os exemplos dos DMs trazem chaves que não existem. O Postman usa a chave publicada. As US chamam o processo pelo nome da feature (\"feature FTAT-933\"), não pela chave publicada.",
      "acao": "fonte",
      "acaoTexto": "Trocar no DM o exemplo pela chave fenix-ve-abertura-bd."
    },
    {
      "id": "R06",
      "grupo": "envelope",
      "nome": "businessKey",
      "tipo": "body",
      "linha": "DM Massivas VE x Camunda - Request D8 e A18 · DM WO Request_OLD D11 · Postman pre-request · US01/US08 ('ID único por workflow')",
      "bpmn": "Não lê. Vira o businessKey da instância (eco na resposta).",
      "valor": {
        "t": "gerado",
        "de": "VE gera a cada início"
      },
      "valores": "Massivas: CANAL;CNPJ;DESIGNADOR, sem espaços e CNPJ só dígitos (ex.: VE;<CNPJ 14 dígitos>;<designador>); coluna domínio: JRN-2026-001. WO Request_OLD (histórico): número do pedido ou CPF+oferta. Postman: FTAT933-<epoch ms>",
      "fontes": {
        "US": {
          "v": "US01 a US11 e US13 (Req01, Ações ou Pré-condições): 'VE inicia o workflow \"feature FTAT-933\" (com ID único por workflow)'. A US não diz quem gera o ID nem o formato.",
          "r": "parcial"
        },
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · string · padrão CANAL;CNPJ;DESIGNADOR; domínio JRN-2026-001 | WO v2.2 · Request_OLD (histórico): 'ex. número do pedido, CPF+oferta' · JRN-2026-001 | WO v2.2 · Request: não consta",
          "r": "parcial"
        },
        "PM": {
          "v": "FTAT933-<epoch ms> gerado no pre-request",
          "r": "diverge"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 8
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 11
        }
      ],
      "leitura": "Quatro formatos diferentes, contando o histórico do DM de WO. O padrão do DM de Massivas tem um designador, mas não diz se é o 013 ou o 069, nem o que fazer quando o mesmo cliente reinicia a jornada (unicidade).",
      "acao": "decidir",
      "acaoTexto": "Fechar o formato do businessKey (designador 013 ou 069) e a regra de unicidade e reabertura."
    },
    {
      "id": "R07",
      "grupo": "envelope",
      "nome": "assignee",
      "tipo": "body",
      "linha": "DM Massivas VE x Camunda - Request D10 e A18 · DM WO Request_OLD D13 · Postman 01/01 · BPMN userTasks",
      "bpmn": "Todas as userTasks: camunda:assignee=${assignee}. A fachada grava a variável assignee (evidência 201).",
      "valor": {
        "t": "config",
        "de": "valor técnico do canal (Postman: ve-app)"
      },
      "valores": "Postman: ve-app. DMs: 'agente/usuário responsável', exemplo agente-01; o exemplo A18 de Massivas usa o CNPJ",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · string · 'agente/usuário responsável' · ex. agente-01; A18: {{CNPJ}} | WO v2.2 · Request_OLD (histórico): ex. agente-01 | WO v2.2 · Request: não consta",
          "r": "diverge"
        },
        "PM": {
          "v": "{{assignee}} = ve-app",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 10
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 13
        }
      ],
      "leitura": "O BPMN depende do assignee para todas as telas. O DM se contradiz (agente ou CNPJ) e o Postman usa um valor técnico fixo.",
      "acao": "decidir",
      "acaoTexto": "Definir se o assignee é um valor técnico do canal (ve-app) ou a identidade do usuário/CNPJ."
    },
    {
      "id": "R08",
      "grupo": "envelope",
      "nome": "channelType",
      "tipo": "body",
      "linha": "Postman 01/01 · evidência 201 (variável channel) · dossiê",
      "bpmn": "Nenhum nó lê. A fachada grava a variável channel (evidência 201).",
      "valor": {
        "t": "config",
        "de": "canal do VE"
      },
      "valores": "MOBILE (único valor visto); a fachada grava como variável channel",
      "fontes": {
        "PM": {
          "v": "{{channelType}} = MOBILE",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Evidência 201: variables.channel = MOBILE",
          "r": "so-fonte"
        }
      },
      "leitura": "A fachada usa e devolve channel. O BPMN não lê. O DM não documenta.",
      "acao": "fonte",
      "acaoTexto": "Documentar channelType (e o domínio) no DM VE x Camunda."
    },
    {
      "id": "R09",
      "grupo": "envelope",
      "nome": "variables (contrato de entrada)",
      "tipo": "objeto",
      "linha": "BPMN Node_Start documentation · snapshot.json startVariables · DM Massivas VE x Camunda - Request D11 a D16 · DM WO Request e Request_OLD · Postman pre-request",
      "bpmn": "Node_Start: 44 chaves obrigatórias, todas string (vazia quando não se aplica). Opcionais: hpsdRelatedServiceId, wfmMicroArea, wo_relatedEntity e bd_<campo>. Chave ausente = 400 na fachada.",
      "valor": {
        "t": "start",
        "de": "VE monta o objeto"
      },
      "valores": "44 chaves string (lista em snapshot.json, flowNodes[0].startVariables)",
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'O status do produto FTTH do cliente estará com um \"bloqueio\" referente a fatura em aberto' e 'Quando o VE acionar o Elastic Journey, ele vai passar o payload retornado na consulta de assets e o Elastic Journey vai \"interpretar\" o payload' · US03 Req01 a Req03: 'VE fez a Consulta de Asset e informou resposta ao EJ' · US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'",
          "r": "diverge"
        },
        "DM": {
          "v": "Massivas v2.1 · Request: 5 variáveis (requestSystem, externalIdentifier, productType, X-Vivo-Correlation-Id, documentNumber) | WO v2.2 · Request: não tem variables (o /advance manda answers.header e Appointment_Create); Request_OLD (histórico): state fixo 'raised' e externalIdentifier",
          "r": "diverge"
        },
        "PM": {
          "v": "As 44 chaves; o pre-request põe '' nas que não têm valor",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 11
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 12
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 13
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 14
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 15
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 16
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 10
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 14
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 15
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 16
        }
      ],
      "leitura": "Nenhum DM documenta as 44 chaves. Quem seguir o DM de Massivas manda 5 variáveis com outros nomes e recebe 400. Só 3 se casam por significado (designador, correlationId, wo_documentNumber); requestSystem e productType não existem no BPMN. O DM de WO não tem START: a aba Request é o /advance e a Request_OLD (histórica) trazia o START de uma massiva (state raised). As US ainda listam as TAGs como 'a confirmar'. As US dizem que o VE passa ao EJ o payload da consulta de assets e que o EJ o interpreta; o Node_Start espera as 44 chaves já extraídas, sem o payload.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o VE se ele manda o payload do Asset (como dizem as US) ou as 44 chaves já extraídas (como exige o Node_Start). Depois, atualizar o DM de Massivas (aba VE x Camunda - Request) com as chaves do Node_Start (nomes do BPMN), tipo, obrigatoriedade, origem e domínio."
    },
    {
      "id": "R61",
      "grupo": "envelope",
      "nome": "trigger e pathParams.processInstanceId (DM WO)",
      "tipo": "body",
      "linha": "DM WO VE x Camunda - Request D7, D9 e B34",
      "bpmn": "Não é entrada do START: são do /advance que conclui a Node_EscolheHorario (INT14 T01 e T02).",
      "valor": {
        "t": "tela",
        "de": "canal no /advance"
      },
      "valores": "trigger: exemplo 'user-action'; processInstanceId: o devolvido pelo START",
      "fontes": {
        "DM": {
          "v": "WO v2.2 · Request: pathParams.processInstanceId · Obrigatório · string | body.trigger · Obrigatório · string · ex. 'user-action' | Massivas v2.1: não consta",
          "r": "so-fonte"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 7
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 9
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Só aparecem porque a aba VE x Camunda - Request do WO é o /advance. A INT14 já analisa os dois. Não pesam no START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R10",
      "grupo": "controle",
      "nome": "designador",
      "tipo": "string",
      "linha": "Node_Start · DM Massivas D13 (externalIdentifier) · DM WO Request_OLD D16 · Postman 00 e 01/01 · QA CAMPOS.jornada",
      "bpmn": "data_designador: Node_ConsultaMassiva (serviceDesignator; erro se vazio), Node_ConsultaBD (correlation_display; erro se vazio), Node_SolicitaDiagnostico (AccessDesignator e relatedService), Node_CriaWO (Designator da Banda Larga), Node_CriaBD (designadorAcesso).",
      "valor": {
        "t": "integracao",
        "de": "Asset item Internet → productCharacteristic idDesignador"
      },
      "valores": "<CNL>-<circuito>-<sufixo>; 013 = serviço (Massiva, WO), 069 = acesso (BD, HPSD). Ex.: XXX-SF000000-013. Qual vai em cada INT: em aberto",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não diz qual designador (013 ou 069).",
          "r": "igual"
        },
        "DFT": {
          "v": "Slide 2: INT01 com idDesignador final 013; slide 3: INT03 com final 069"
        },
        "DM": {
          "v": "Massivas v2.1 · Request: externalIdentifier · Obrigatório · string · 'id designador' · {{id designador}} | WO v2.2 · Request_OLD (histórico): externalIdentifier, igual | WO v2.2 · Request: não consta",
          "r": "diverge"
        },
        "PM": {
          "v": "{{designador}} ← idDesignador do item productFamily=Internet (013)",
          "r": "igual"
        },
        "QA": {
          "v": "Campo Designador, padrão de teste com final 069; o Asset sobrescreve com o idDesignador do item content[assetIndice]",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 13
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        },
        {
          "aba": "VE x Camunda - Request_OLD",
          "linha": 16
        }
      ],
      "leitura": "Bem definida e com origem no Asset, mas o BPMN usa uma única variável para serviço e acesso. O Postman manda o 013 e o padrão da tela de QA é um 069, de modo que cada ferramenta testa um designador diferente. O DM chama a variável de externalIdentifier.",
      "acao": "decidir",
      "acaoTexto": "Fechar 013 × 069 por integração (QA-BPMN-10) e alinhar o nome da chave no DM."
    },
    {
      "id": "R11",
      "grupo": "controle",
      "nome": "productStatus",
      "tipo": "string",
      "linha": "Node_Start · Node_AvaliaImpedimentos · Postman 00 e variável · US premissa 3 · DFT slide 4",
      "bpmn": "data_productStatus: Node_AvaliaImpedimentos; 'bloqueio' (sem diferenciar maiúsculas) = fatura em atraso; vazio = IllegalArgumentException.",
      "valor": {
        "t": "integracao",
        "de": "Asset item Internet → status"
      },
      "valores": "Asset: Ativo | Suspenso (filtro da consulta). BPMN só reage a 'bloqueio'. DE/PARA status × bloqueio: em aberto",
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'O status do produto FTTH do cliente estará com um \"bloqueio\" referente a fatura em aberto' e 'Quando o VE acionar o Elastic Journey, ele vai passar o payload retornado na consulta de assets e o Elastic Journey vai \"interpretar\" o payload'; 'Se o cliente tiver pendências financeiras com a Vivo (fatura em aberto) é o suficiente para não abrir um novo BD' · US03 Req01 e Req03 (CA001, CA003): 'a interpretação final é que sim, o cliente tem fatura em aberto' → 'não é possível seguir com a abertura de BD' · US03 Req02 (CA002): 'o cliente não tem fatura em aberto'",
          "r": "parcial"
        },
        "DFT": {
          "v": "Slide 4: a decisão de bloquear é do VE/APP, não da TMF637"
        },
        "PM": {
          "v": "{{productStatus}} ← status do item Internet; padrão 'ativo'; a descrição manda usar 'bloqueio' para simular fatura",
          "r": "diverge"
        },
        "QA": {
          "v": "entradasAsset.productStatus ← status do item; sem campo manual. Evidência 19/11: 'Ativo'; para testar a fatura, o BFF de teste mandou 'bloqueio'",
          "r": "diverge"
        }
      },
      "leitura": "A variável existe, mas o valor que o Asset entrega (Ativo/Suspenso) nunca vale 'bloqueio'. Repassado cru, o ramo de fatura não acontece. US e DFT divergem sobre quem interpreta o bloqueio. O DM não tem a variável. O BPMN faz a interpretação que a US pede, mas só sobre o status recebido no START (literal 'bloqueio'), e não sobre o payload. A letra da US ('estará com um \"bloqueio\"') bate com o BPMN, não com o Asset de exemplo.",
      "acao": "decidir",
      "acaoTexto": "Definir quem traduz o status em bloqueio financeiro (VE ou jornada), a partir de qual campo e com qual DE/PARA (dossiê Q02)."
    },
    {
      "id": "R12",
      "grupo": "controle",
      "nome": "correlationId",
      "tipo": "string",
      "linha": "Node_Start · DM Massivas VE x Camunda - Request D15 · DM WO VE x Camunda - Request D15 · Postman pre-request · QA",
      "bpmn": "data_correlationId vira o header X-Vivo-Correlation-Id (se houver valor) em Node_ConsultaMassiva, Node_ConsultaBD, Node_ConsultaSlots, Node_CriaWO, Node_CancelaWOAgendamento, Node_CriaBD e Node_CancelaWO. A INT06 gera UUID próprio.",
      "valor": {
        "t": "gerado",
        "de": "VE gera no início da jornada"
      },
      "valores": "Massivas (START): sem máscara. WO (/advance): CID_VE_FTAT933INT008_YYYY-MM-DDTHH24:MI:SS.FFFZ. Postman: CID_VE_FTAT933_<epoch ms>. HPSD exige UUID v4",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: X-Vivo-Correlation-Id em variables · Obrigatório · string · 'gerado pelo VE no início da jornada' · sem máscara | WO v2.2 · Request (/advance): answers.header.X-Vivo-Correlation-Id · Obrigatório · string · CID_VE_FTAT933INT008_YYYY-MM-DDTHH24:MI:SS.FFFZ",
          "r": "diverge"
        },
        "PM": {
          "v": "CID_VE_FTAT933_<epoch ms> gerado no pre-request",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo Correlation ID; vazio, gera CID_VE_FTAT933_QA_<epoch ms>",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 15
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 15
        }
      ],
      "leitura": "Origem clara (o VE gera). O DM de Massivas não dá máscara e usa outro nome de chave (X-Vivo-Correlation-Id). O DM de WO pede um correlationId novo, com máscara INT008, a cada /advance, mas o BPMN usa sempre o do START (INT14 T05). A fachada aceita qualquer texto.",
      "acao": "decidir",
      "acaoTexto": "Fechar se o correlationId é um só (o do START) ou um por chamada, a máscara e o nome da chave nos DMs."
    },
    {
      "id": "R13",
      "grupo": "controle",
      "nome": "requestTimestamp",
      "tipo": "string",
      "linha": "Node_Start · Postman pre-request · planilha de variáveis VAR-016",
      "bpmn": "Declarada no Node_Start (obrigatória), mas nenhum nó lê data_requestTimestamp.",
      "valor": {
        "t": "gerado",
        "de": "VE: instante da chamada"
      },
      "valores": "ISO 8601 UTC, ex.: 2026-01-01T12:00:00.000Z",
      "fontes": {
        "PM": {
          "v": "new Date().toISOString() no pre-request",
          "r": "igual"
        }
      },
      "leitura": "O VE gera e o Postman manda, mas o BPMN não usa. O DM não documenta. Pode servir ao motor ou à auditoria fora do BPMN; nenhuma fonte diz.",
      "acao": "decidir",
      "acaoTexto": "Perguntar ao time do motor/fachada se requestTimestamp tem uso fora do BPMN (log, auditoria) antes de decidir se fica obrigatório."
    },
    {
      "id": "R14",
      "grupo": "controle",
      "nome": "issServiceNow",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaBD headers · Postman pre-request · QA ISS_SERVICENOW",
      "bpmn": "data_issServiceNow: Node_ConsultaBD, header iss da INT03; erro se vazio.",
      "valor": {
        "t": "config",
        "de": "configuração do canal VE; o motor põe no header iss da INT03"
      },
      "valores": "Identificador hexadecimal de 32 caracteres, fixo por ambiente (valor omitido)",
      "fontes": {
        "PM": {
          "v": "A collection não declara a variável; o pre-request usa um valor fixo quando ela falta (omitido)",
          "r": "igual"
        },
        "QA": {
          "v": "Não usa variável: header iss com a constante ISS_SERVICENOW (omitida) na INT03",
          "r": "parcial"
        }
      },
      "leitura": "Entrada legítima do START: o motor a usa no header iss da INT03. Postman e QA usam o mesmo valor fixo. Falta só documentar: nenhum dos DMs com aba VE x Camunda (Massivas v2.1, WO v2.2) cita a chave; a versão posterior do DM documenta.",
      "acao": "fonte",
      "acaoTexto": "Trazer para o repositório a versão do DM que documenta issServiceNow e incluí-la no DM de Massivas (aba VE x Camunda - Request)."
    },
    {
      "id": "R15",
      "grupo": "controle",
      "nome": "requestSystem",
      "tipo": "string",
      "linha": "DM Massivas VE x Camunda - Request D12 e A18 · DM WO VE x Camunda - Request D13 e B34",
      "bpmn": null,
      "valor": {
        "t": "fixo",
        "de": "DM: parâmetro fixo VE"
      },
      "valores": "VE (Massivas, no START) | MVE (WO, em answers.header do /advance; o BPMN fixa MVE nos headers do WFM)",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: variables.requestSystem · Obrigatório · string · fixo VE (descrição 'status da massiva buscada') | WO v2.2 · Request (/advance): answers.header.requestSystem · Obrigatório · string · MVE",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 12
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
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
      "leitura": "Os dois DMs pedem requestSystem ao canal, com valores diferentes: VE no START (com a descrição trocada) e MVE no /advance. O BPMN não declara a variável e fixa MVE nos headers da INT11 e da INT14. A fachada aceita o START sem ela.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com os donos dos DMs se requestSystem tem uso na jornada e qual valor vale (VE ou MVE); se não tiver uso, tirar das abas VE x Camunda."
    },
    {
      "id": "R16",
      "grupo": "controle",
      "nome": "productType",
      "tipo": "string",
      "linha": "DM Massivas VE x Camunda - Request D14 e A18",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "sem origem nem domínio"
      },
      "valores": "Não documentado. O exemplo A18 preenche com {{Correlation id}}",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Request: Obrigatório · string · 'Tipo do produto' · sem domínio; exemplo A18 com {{Correlation id}} | WO v2.2: não consta",
          "r": "so-fonte"
        },
        "PM": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 14
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        }
      ],
      "leitura": "Só o DM de Massivas pede, sem domínio e com um exemplo que não faz sentido. O BPMN não declara nem lê.",
      "acao": "decidir",
      "acaoTexto": "Perguntar ao dono do DM para que serve productType e qual o domínio; se a jornada não usa, tirar do DM."
    },
    {
      "id": "R62",
      "grupo": "controle",
      "nome": "flow (answers.header, DM WO)",
      "tipo": "string",
      "linha": "DM WO VE x Camunda - Request D12 e B34 · BPMN headers de Node_ConsultaSlots e Node_CriaWO",
      "bpmn": "Não é entrada do START: Node_ConsultaSlots e Node_CriaWO fixam o header flow = B2B_MASSIVO.",
      "valor": {
        "t": "fixo",
        "de": "B2B_MASSIVO no BPMN"
      },
      "valores": "B2B_MASSIVO (fixo)",
      "fontes": {
        "DM": {
          "v": "WO v2.2 · Request (/advance): answers.header.flow · Obrigatório · string · B2B_MASSIVO | Massivas v2.1: não consta",
          "r": "so-fonte"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 12
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "Mesmo valor nos dois lados, mas o DM de WO espera que o canal mande, enquanto o BPMN fixa (INT14 T04). O VE não precisa mandar no START.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R17",
      "grupo": "rede",
      "nome": "wfmNetworkOwner",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · Postman variável · QA CAMPOS.wfm",
      "bpmn": "data_wfmNetworkOwner: Node_ConsultaSlots escolhe a variante VIVO1/VIVO2 (vazio = VIVO1); Node_CriaWO place.networkOwner (vazio = VIVO1).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidatos no Asset: networkOwnerId ou serviceInventory.inventory.networkOwner"
      },
      "valores": "VIVO1 | VIVO2. Vazio vira VIVO1 no BPMN; 'N/A' (visto no Asset) não cai no padrão",
      "fontes": {
        "PM": {
          "v": "VIVO1 fixo na collection",
          "r": "parcial"
        },
        "QA": {
          "v": "Seleção manual VIVO1/VIVO2",
          "r": "parcial"
        }
      },
      "leitura": "Domínio claro (o DM de slots tem uma aba para cada rede), mas ninguém diz de onde vem. Postman e QA preenchem à mão.",
      "acao": "decidir",
      "acaoTexto": "P08: definir o campo de origem (Asset ou outro) e o DE/PARA para VIVO1/VIVO2."
    },
    {
      "id": "R18",
      "grupo": "rede",
      "nome": "wfmMediaType",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · Postman variável · QA CAMPOS.wfm",
      "bpmn": "data_wfmMediaType: Node_ConsultaSlots mediaType; Node_CriaWO accessTechnology e característica Technology. Vazio = GPON.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidatos no Asset: type, technology, serviceInventory.tecnologia"
      },
      "valores": "GPON nos exemplos; sem domínio documentado. Vazio vira GPON",
      "fontes": {
        "PM": {
          "v": "GPON fixo na collection",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo Mídia, padrão GPON",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem e sem domínio. O Asset traz três candidatos com valores diferentes (FIBRA, Óptico GPON, GPON).",
      "acao": "decidir",
      "acaoTexto": "P08: escolher o campo do Asset e o DE/PARA para o mediaType do WFM."
    },
    {
      "id": "R19",
      "grupo": "rede",
      "nome": "wfmCnl",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · QA CAMPOS.wfm",
      "bpmn": "data_wfmCnl: Node_ConsultaSlots address.cnl; Node_CriaWO place.cnl.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.cnl"
      },
      "valores": "Código CNL, string de 5 dígitos (preservar zeros), ex.: 00000",
      "fontes": {
        "PM": {
          "v": "'' (variável da collection vazia)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual CNL",
          "r": "parcial"
        }
      },
      "leitura": "Obrigatório nas duas variantes do DM de slots, mas sem origem. A collection manda vazio.",
      "acao": "decidir",
      "acaoTexto": "P08: confirmar se o serviceInventory do Asset é contrato e mapear cnl → wfmCnl."
    },
    {
      "id": "R20",
      "grupo": "rede",
      "nome": "wfmTelephonicArea",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · Node_CriaBD · QA CAMPOS.wfm",
      "bpmn": "data_wfmTelephonicArea: Node_ConsultaSlots só em VIVO1; Node_CriaWO place.telephonicArea (vazio = ''); Node_CriaBD característica telephonicArea.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.telephonicArea"
      },
      "valores": "Sigla de 2 letras, ex.: XX; só em VIVO1 (vazio em VIVO2)",
      "fontes": {
        "PM": {
          "v": "'' (variável da collection vazia)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'Área telefônica (VIVO1)'",
          "r": "parcial"
        }
      },
      "leitura": "Condicional à rede, e o BPMN trata isso. Falta a origem.",
      "acao": "decidir",
      "acaoTexto": "P08: mapear telephonicArea → wfmTelephonicArea, se o serviceInventory for contrato."
    },
    {
      "id": "R21",
      "grupo": "rede",
      "nome": "wfmCentralOffice",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · QA CAMPOS.wfm",
      "bpmn": "data_wfmCentralOffice: Node_ConsultaSlots só em VIVO1; Node_CriaWO place.centralOffice (vazio = '').",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.centralOffice"
      },
      "valores": "Sigla da estação (2 letras no exemplo), ex.: XX; só em VIVO1",
      "fontes": {
        "PM": {
          "v": "'' (variável da collection vazia)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'Estação (VIVO1)'",
          "r": "parcial"
        }
      },
      "leitura": "Mesmo caso do wfmTelephonicArea.",
      "acao": "decidir",
      "acaoTexto": "P08: mapear centralOffice → wfmCentralOffice, se o serviceInventory for contrato."
    },
    {
      "id": "R22",
      "grupo": "rede",
      "nome": "wfmGeographicSiteId",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · QA CAMPOS.wfm e PADROES_INT14",
      "bpmn": "data_wfmGeographicSiteId: Node_ConsultaSlots geographicSite.id (omitido se vazio); Node_CriaWO geographicSite Cabinet.id.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); nenhum candidato no Asset"
      },
      "valores": "ID do armário (Cabinet), ex.: XXXXX_X0X00; obrigatório no DM do WFM",
      "fontes": {
        "PM": {
          "v": "'' (variável da collection vazia)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual; na INT14 usa o padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Obrigatório no WFM e sem nenhuma origem identificada. O campo idArmario do Asset veio vazio e ninguém o liga a este.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM de onde vem o id do armário."
    },
    {
      "id": "R23",
      "grupo": "rede",
      "nome": "wfmAttendantId",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · DM WO VE x Camunda - Request D22 a D24 e B34 · QA CAMPOS.wfm",
      "bpmn": "data_wfmAttendantId: Node_ConsultaSlots relatedEntity Attendant, role Ouvidoria (lista vazia se vazio); Node_CriaWO Appointment Attendant.id (vazio = '').",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "DM de WO (/advance): Attendant id vazio, role 'Cliente via Vivo Empresas'. DM de slots (INT11): id numérico de 8 dígitos, role Ouvidoria",
      "fontes": {
        "PM": {
          "v": "'' (variável da collection vazia)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'Atendente (Attendant.id)'",
          "r": "parcial"
        },
        "DM": {
          "v": "WO v2.2 · Request (/advance): Appointment_Create.relatedParty @type Attendant · id opcional (exemplo vazio) · role opcional 'Cliente via Vivo Empresas' | Massivas v2.1: não consta",
          "r": "parcial"
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
          "linha": 24
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 34
        }
      ],
      "leitura": "O DM de WO manda o Attendant com id vazio, o que basta para a INT14 (o BPMN já usa '' como padrão). A INT11 continua exigindo um atendente de Ouvidoria, e no autoatendimento não há atendente. A origem segue indefinida.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM se o Attendant da INT11 aceita vazio (como no DM de WO) ou que valor técnico usar."
    },
    {
      "id": "R24",
      "grupo": "rede",
      "nome": "wfmMicroArea (opcional)",
      "tipo": "string",
      "linha": "Node_Start (opcionais) · Node_ConsultaSlots · QA CAMPOS.wfm",
      "bpmn": "Opcional. data_wfmMicroArea: Node_ConsultaSlots address.microArea, só em VIVO1.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.microArea"
      },
      "valores": "Código de microárea (formato não documentado); só em VIVO1",
      "fontes": {
        "PM": {
          "v": "Variável existe vazia, mas não vai no body do START",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'Microárea (VIVO1)'",
          "r": "parcial"
        }
      },
      "leitura": "Opcional no START e ausente das tabelas do DM de slots, mas o Asset de exemplo traz o valor.",
      "acao": "decidir",
      "acaoTexto": "P08: confirmar com o WFM se microArea é necessária e mapear do Asset."
    },
    {
      "id": "R63",
      "grupo": "rede",
      "nome": "Appointment_Create (DM WO, /advance da escolha de horário)",
      "tipo": "objeto",
      "linha": "DM WO VE x Camunda - Request D16 a D32 e B34 · BPMN Node_EscolheHorario, Node_RegistraHorario, Node_CriaWO",
      "bpmn": "Não é entrada do START. O BPMN monta o Appointment_Create no Node_CriaWO: description, category e note fixos; canBeAntecipated vem da tela (data_avisarHorarioMaisCedo); scheduleDate e TimeSlot vêm do slot da INT11 escolhido na tela (data_slotEscolhido); Attendant vem de wfmAttendantId (R23).",
      "valor": {
        "t": "tela",
        "de": "escolha do horário na Node_EscolheHorario + slot da INT11"
      },
      "valores": "description 'Agendamento da atividade' (opcional) · category CORPORATE (obrigatório) · canBeAntecipated boolean, ex. true · scheduleDate YYYY-MM-DD (a coluna domínio traz o número de série 46217 do Excel) · TimeSlot id 'HH:MM-HH:MM', resourceId/resourceName do bucket, validFor ISO 8601 com fuso · note id CRM_NOTES e texto fixo",
      "fontes": {
        "DM": {
          "v": "WO v2.2 · Request (/advance): Appointment_Create · Obrigatório · Objeto; description opcional; category, canBeAntecipated, scheduleDate e relatedParty (Attendant e TimeSlot) obrigatórios; em relatedParty só @type é obrigatório; note opcional, com id (CRM_NOTES) e text obrigatórios | Massivas v2.1: não consta",
          "r": "so-fonte"
        }
      },
      "dm": [
        {
          "aba": "VE x Camunda - Request",
          "linha": 16
        },
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
          "linha": 19
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 20
        },
        {
          "aba": "VE x Camunda - Request",
          "linha": 21
        },
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
          "linha": 24
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
      "leitura": "O DM de WO espera que o canal mande o agendamento completo no /advance. O BPMN lê só o índice do slot e o checkbox da tela e monta o resto (INT14 T06 a T12). Nada disso entra no START. Na coluna domínio, a data aparece como número de série do Excel.",
      "acao": "decidir",
      "acaoTexto": "Alinhar com o VE o contrato do /advance da escolha de horário (DM de WO × BPMN, ver INT14 T06); nada a incluir no START."
    },
    {
      "id": "R25",
      "grupo": "cliente",
      "nome": "wo_customerId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_customerId: Node_CriaWO CustomerValue.id; Node_CriaBD partyOrPartyRole.id (se não houver bd_customerId).",
      "valor": {
        "t": "integracao",
        "de": "Asset item Internet → relatedParty[].partyOrPartyRole.id"
      },
      "valores": "ID de conta Salesforce, 18 caracteres alfanuméricos, ex.: 001XXXXXXXXXXXXXXX",
      "fontes": {
        "PM": {
          "v": "← primeiro partyOrPartyRole do item Internet",
          "r": "igual"
        },
        "QA": {
          "v": "← relatedParty[0].partyOrPartyRole.id do item selecionado",
          "r": "igual"
        }
      },
      "leitura": "Origem definida e igual no Postman e no QA. Falta confirmar que é o id esperado pela INT14 e pela INT18 (INT00 S09).",
      "acao": "decidir",
      "acaoTexto": "Confirmar com WFM e ServiceNow que o id de conta do Asset é o id de cliente esperado."
    },
    {
      "id": "R26",
      "grupo": "cliente",
      "nome": "wo_customerName",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_customerName: Node_CriaWO CustomerValue.name; Node_CriaBD partyOrPartyRole.name.",
      "valor": {
        "t": "integracao",
        "de": "Asset → relatedParty[].partyOrPartyRole.name"
      },
      "valores": "Razão social da empresa (texto livre); não é o nome do contato",
      "fontes": {
        "PM": {
          "v": "← partyOrPartyRole.name",
          "r": "igual"
        },
        "QA": {
          "v": "← relatedParty[0].partyOrPartyRole.name",
          "r": "igual"
        }
      },
      "leitura": "Bate nas fontes.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R27",
      "grupo": "cliente",
      "nome": "wo_documentNumber",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · DM Massivas D16 (documentNumber) · Postman 00 · QA",
      "bpmn": "data_wo_documentNumber: Node_CriaWO CustomerValue.documentNumber; Node_CriaBD característica documentNumber.",
      "valor": {
        "t": "integracao",
        "de": "Asset → partyOrPartyRole.partyCharacteristic[documentNumber]"
      },
      "valores": "CNPJ, 14 dígitos sem máscara (string, preservar zeros), ex.: 00000000000000",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC' (o CNPJ é o documento do cliente).",
          "r": "igual"
        },
        "DM": {
          "v": "Massivas v2.1 · Request: variables.documentNumber · Obrigatório · string · 'Número do documento' (A18: {{CNPJ}}) | WO v2.2: não consta",
          "r": "diverge"
        },
        "PM": {
          "v": "← partyCharacteristic documentNumber",
          "r": "igual"
        },
        "QA": {
          "v": "← partyCharacteristic documentNumber do relatedParty[0]",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 16
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Request",
          "linha": 18
        }
      ],
      "leitura": "Origem e formato batem. O DM usa outro nome (documentNumber).",
      "acao": "fonte",
      "acaoTexto": "Renomear no DM de Massivas para wo_documentNumber (nome do START)."
    },
    {
      "id": "R28",
      "grupo": "cliente",
      "nome": "wo_customerCategory",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_customerCategory: Node_CriaWO CustomerValue.category.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Só o exemplo do WFM: ONE; domínio não documentado",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woCustomerCategory; o START lê wo_customerCategory)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem e sem domínio.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM a categoria do cliente e de onde vem."
    },
    {
      "id": "R29",
      "grupo": "cliente",
      "nome": "wo_contactName",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_contactName: Node_CriaWO contactMedium.name; Node_CriaBD reclamanteNome.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); não está no Asset nem nas telas"
      },
      "valores": "Nome do contato ou reclamante (texto livre); não é a razão social",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woContactName)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. As telas da jornada não pedem contato.",
      "acao": "decidir",
      "acaoTexto": "P08: definir se o contato vem do cadastro do usuário VE, do Asset ou de uma tela nova."
    },
    {
      "id": "R30",
      "grupo": "cliente",
      "nome": "wo_emailAddress",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_emailAddress: Node_CriaWO contactMedium emailAddress; Node_CriaBD EmailContactMedium (se não houver bd_email).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "E-mail, ex.: contato@exemplo.com",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woEmailAddress)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. Na INT18 o contato é exigido internamente pela TMF629.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem do e-mail de contato."
    },
    {
      "id": "R31",
      "grupo": "cliente",
      "nome": "wo_mobileNumber",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_mobileNumber: Node_CriaWO mobileNumber; Node_CriaBD telefoneContatoLocal1 (1º) e PhoneContactMedium (2º).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "DDD + celular, 11 dígitos sem máscara, ex.: 11900000000",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woMobileNumber)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem do celular de contato."
    },
    {
      "id": "R32",
      "grupo": "cliente",
      "nome": "wo_phoneNumber",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_phoneNumber: Node_CriaWO phoneNumber; Node_CriaBD PhoneContactMedium (1º) e telefoneContatoLocal1 (2º).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "DDD + telefone fixo, 10 dígitos sem máscara, ex.: 1100000000",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woPhoneNumber)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. A INT18 inverte a prioridade entre celular e fixo conforme o campo.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem do telefone de contato."
    },
    {
      "id": "R33",
      "grupo": "cliente",
      "nome": "wo_workNumber",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_workNumber: Node_CriaWO workNumber; Node_CriaBD telefoneContatoLocal2.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "DDD + telefone comercial, 10 dígitos sem máscara",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woWorkNumber)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem do telefone comercial."
    },
    {
      "id": "R34",
      "grupo": "pedido",
      "nome": "wo_orderId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_orderId: Node_CriaWO CustomerOrderValue.id.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Só o exemplo do WFM: id Salesforce de pedido, 18 caracteres",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woOrderId)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Pedido comercial numa jornada de defeito: nenhuma fonte diz qual pedido usar.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM se o pedido é obrigatório no defeito e de onde vem."
    },
    {
      "id": "R35",
      "grupo": "pedido",
      "nome": "wo_orderProtocol",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_orderProtocol: Node_CriaWO CustomerOrderValue.orderProtocol.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Só o exemplo do WFM: DDMMAAAA-NNNNNNN",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woOrderProtocol)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Mesmo caso do wo_orderId.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem do protocolo do pedido."
    },
    {
      "id": "R36",
      "grupo": "pedido",
      "nome": "wo_dateOfSale",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_dateOfSale: Node_CriaWO CustomerOrderValue.dateOfSale.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "ISO 8601 UTC, ex.: 2025-01-01T00:00:00.000Z; não é a data de hoje",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woDateOfSale)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Mesmo caso do wo_orderId.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem da data da venda."
    },
    {
      "id": "R37",
      "grupo": "pedido",
      "nome": "wo_orderDetail",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_orderDetail: Node_CriaWO característica Detail do CustomerOrderValue (omitida se vazia).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Texto livre; o exemplo do WFM usa 'motivo;código'",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woOrderDetail)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem nem regra.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM o conteúdo do detalhe do pedido."
    },
    {
      "id": "R38",
      "grupo": "pedido",
      "nome": "wo_detail",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_detail: Node_CriaWO specificationDescription DETALHE.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Texto livre do defeito; exemplo do WFM: 'Autenticação'",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woDetail)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Poderia sair do resultado do diagnóstico, que a jornada já tem, mas nenhuma fonte define a regra. Hoje é exigido no START.",
      "acao": "decidir",
      "acaoTexto": "P08: definir se o DETALHE vem do VE ou é calculado pela jornada (ex.: a partir do diagnóstico)."
    },
    {
      "id": "R39",
      "grupo": "endereco",
      "nome": "wfmPostcode",
      "tipo": "string",
      "linha": "Node_Start · Node_ConsultaSlots · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wfmPostcode: Node_ConsultaSlots address.postcode; Node_CriaWO place.postcode; Node_CriaBD característica postcode.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[role=installationAddress].place.postcode"
      },
      "valores": "CEP, 8 dígitos sem máscara (string, preservar zero à esquerda), ex.: 00000000",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place com role installationAddress (ou place[0])",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0].place.postcode (não olha o role)",
          "r": "parcial"
        }
      },
      "leitura": "Origem definida. A tela de QA pega o primeiro place, que só coincide com o de instalação no exemplo.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R40",
      "grupo": "endereco",
      "nome": "wo_cnlAcronym",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_cnlAcronym: Node_CriaWO place.cnlAcronym.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.cnlAcronym"
      },
      "valores": "Sigla do CNL, 3 letras, ex.: XXX",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woCnlAcronym)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem, mas o Asset de exemplo traz o valor dentro do serviceInventory.",
      "acao": "decidir",
      "acaoTexto": "P08: mapear cnlAcronym → wo_cnlAcronym, se o serviceInventory for contrato."
    },
    {
      "id": "R41",
      "grupo": "endereco",
      "nome": "wo_city",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_city: Node_CriaWO place.city; Node_CriaBD característica city.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[installationAddress].place.city"
      },
      "valores": "Município por extenso, com acento",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place.city",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0].place.city",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R42",
      "grupo": "endereco",
      "nome": "wo_neighborhood",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_neighborhood: Node_CriaWO place.neighborhood; Node_CriaBD endBairro.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[installationAddress].place.locality"
      },
      "valores": "Bairro por extenso (no Asset, locality é o bairro, não a cidade)",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place.locality",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0].place.locality",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R43",
      "grupo": "endereco",
      "nome": "wo_stateOrProvince",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA siglaUf",
      "bpmn": "data_wo_stateOrProvince, sem conversão: Node_CriaWO place.stateOrProvince; Node_CriaBD estadoDescricao.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[installationAddress].place.stateOrProvince"
      },
      "valores": "Asset: nome por extenso (ex.: São Paulo). Exemplo do WFM: sigla UF (ex.: SP). DM do BD: por extenso",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place.stateOrProvince, sem conversão",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0]; na INT14 converte para sigla (siglaUf)",
          "r": "diverge"
        }
      },
      "leitura": "Origem definida, mas o formato muda por destino: a WO espera sigla e o BD, nome por extenso. A tela de QA converte; o BPMN não.",
      "acao": "decidir",
      "acaoTexto": "Definir o formato por destino (sigla na INT14?) e quem converte: o VE no START ou o BPMN."
    },
    {
      "id": "R44",
      "grupo": "endereco",
      "nome": "wo_streetCode",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_streetCode: Node_CriaWO place.streetCode.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08); candidato serviceInventory.inventory.streetCode"
      },
      "valores": "Código numérico do logradouro (5 dígitos no exemplo do WFM)",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "'' (a collection guarda woStreetCode)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Mesmo caso do wo_cnlAcronym.",
      "acao": "decidir",
      "acaoTexto": "P08: mapear streetCode → wo_streetCode, se o serviceInventory for contrato."
    },
    {
      "id": "R45",
      "grupo": "endereco",
      "nome": "wo_streetName",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_streetName: Node_CriaWO place.streetName; Node_CriaBD streetName.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[installationAddress].place.streetName"
      },
      "valores": "Tipo e nome do logradouro, texto com acento",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place.streetName",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0].place.streetName",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R46",
      "grupo": "endereco",
      "nome": "wo_streetNr",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_streetNr: Node_CriaWO place.streetNr; Node_CriaBD streetNr.",
      "valor": {
        "t": "integracao",
        "de": "Asset → place[installationAddress].place.streetNr"
      },
      "valores": "Número do imóvel (string)",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "← place.streetNr",
          "r": "igual"
        },
        "QA": {
          "v": "← place[0].place.streetNr",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R47",
      "grupo": "endereco",
      "nome": "wo_complement",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Node_CriaBD · QA PADROES_INT14",
      "bpmn": "data_wo_complement: Node_CriaWO geographicSubAddress.name; Node_CriaBD complement.",
      "valor": {
        "t": "nenhum",
        "de": "candidato: Asset geographicSubAddress[].subUnit[] (regra de concatenação em aberto)"
      },
      "valores": "Texto livre, ex.: AP 00 BL 0; vazio quando não houver",
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "'' (o teste do Asset não lê; a collection guarda woComplement)",
          "r": "parcial"
        },
        "QA": {
          "v": "Na INT14 usa o padrão de laboratório do curl do WFM",
          "r": "parcial"
        }
      },
      "leitura": "O Asset tem a estrutura, mas a regra para juntar tipo e número numa string não está fechada.",
      "acao": "decidir",
      "acaoTexto": "Definir com o VE a regra de concatenação do complemento."
    },
    {
      "id": "R48",
      "grupo": "endereco",
      "nome": "wo_latitude",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_latitude: Node_CriaWO geographicLocation.bbox[1].",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Decimal com sinal, em string, ex.: -23.00000",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woLatitude)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. Nenhuma fonte prevê geocodificação.",
      "acao": "decidir",
      "acaoTexto": "P08: definir com o WFM se as coordenadas são obrigatórias e de onde vêm."
    },
    {
      "id": "R49",
      "grupo": "endereco",
      "nome": "wo_longitude",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_longitude: Node_CriaWO geographicLocation.bbox[0] (ordem longitude, latitude).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Decimal com sinal, em string, ex.: -46.00000",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woLongitude)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Mesmo caso da wo_latitude.",
      "acao": "decidir",
      "acaoTexto": "P08: definir a origem das coordenadas."
    },
    {
      "id": "R50",
      "grupo": "endereco",
      "nome": "wo_addressReference",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · QA PADROES_INT14",
      "bpmn": "data_wo_addressReference: Node_CriaWO note ADDRESS_REFERENCE (só se houver valor).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida (P08)"
      },
      "valores": "Texto livre (ponto de referência); a nota só vai se tiver valor",
      "fontes": {
        "PM": {
          "v": "'' (a collection guarda woAddressReference)",
          "r": "parcial"
        },
        "QA": {
          "v": "Padrão de laboratório do curl do WFM, marcado como pendência",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem, mas o BPMN tolera vazio.",
      "acao": "decidir",
      "acaoTexto": "P08: definir se o VE tem a referência do endereço."
    },
    {
      "id": "R51",
      "grupo": "produto",
      "nome": "wo_productId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_productId: Node_CriaWO ProductEntity 'Banda Larga'.id (se não houver wo_relatedEntity).",
      "valor": {
        "t": "integracao",
        "de": "Asset item Internet → id"
      },
      "valores": "ID Salesforce do item Internet, 18 caracteres",
      "fontes": {
        "PM": {
          "v": "← id do item Internet",
          "r": "igual"
        },
        "QA": {
          "v": "← id do item selecionado",
          "r": "igual"
        }
      },
      "leitura": "Origem definida. Falta o WFM confirmar que espera o id do Asset (o exemplo do DM traz outro prefixo; INT00 S06).",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM que ProductEntity.id é o content[].id do Asset."
    },
    {
      "id": "R52",
      "grupo": "produto",
      "nome": "wo_acessoId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_acessoId: Node_CriaWO cria o produto 'ACESSO' só quando há valor.",
      "valor": {
        "t": "integracao",
        "de": "Asset item Acesso → id"
      },
      "valores": "ID Salesforce do item Acesso, 18 caracteres; vazio = sem produto ACESSO",
      "fontes": {
        "PM": {
          "v": "← id do item productFamily=Acesso",
          "r": "igual"
        },
        "QA": {
          "v": "← id do item productFamily=Acesso",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R53",
      "grupo": "produto",
      "nome": "wo_acessoDesignador",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaWO · Postman 00 · QA entradasAsset",
      "bpmn": "data_wo_acessoDesignador: só Node_CriaWO, Designator do produto 'ACESSO'. INT03, INT06 e INT18 usam data_designador.",
      "valor": {
        "t": "integracao",
        "de": "Asset item Acesso → productCharacteristic idDesignador"
      },
      "valores": "Designador de acesso, final 069, ex.: XXX-SF000000-069 (o número do circuito difere do 013)",
      "fontes": {
        "PM": {
          "v": "← idDesignador do item productFamily=Acesso",
          "r": "igual"
        },
        "QA": {
          "v": "← idDesignador do item productFamily=Acesso",
          "r": "igual"
        }
      },
      "leitura": "O START já recebe o 069 que os DMs da INT03, INT06 e INT18 pedem, mas o BPMN só o usa na WO.",
      "acao": "decidir",
      "acaoTexto": "Depois da decisão 013 × 069, apontar INT03, INT06 e INT18 para esta variável, se for o caso."
    },
    {
      "id": "R54",
      "grupo": "produto",
      "nome": "bd_productInventoryId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaBD · QA CAMPOS.int18",
      "bpmn": "data_bd_productInventoryId: Node_CriaBD relatedEntity ProductInventory.id (item omitido se vazio).",
      "valor": {
        "t": "nenhum",
        "de": "candidato: Asset productCharacteristic productInventorySom"
      },
      "valores": "DM do BD: '0001 / GUID'; candidato no Asset: hash de 32 caracteres",
      "fontes": {
        "PM": {
          "v": "'' (sem variável na collection)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'ID ProductInventory (confirmar origem)'",
          "r": "parcial"
        }
      },
      "leitura": "Obrigatório na chave, mas o BPMN tolera vazio (omite o item). A origem não está provada.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o ServiceNow se ProductInventory.id é o productInventorySom do Asset."
    },
    {
      "id": "R55",
      "grupo": "produto",
      "nome": "bd_relatedServiceSpecificationId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaBD · QA CAMPOS.int18",
      "bpmn": "data_bd_relatedServiceSpecificationId: Node_CriaBD relatedEntity relatedServiceSpecification.id (omitido se vazio).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida"
      },
      "valores": "GUID (DM do BD), ex.: 00000000-0000-0000-0000-000000000000",
      "fontes": {
        "PM": {
          "v": "'' (sem variável na collection)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'ID relatedServiceSpecification'",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. Parece id de catálogo, talvez fixo por produto, mas nenhuma fonte confirma.",
      "acao": "decidir",
      "acaoTexto": "Definir com o ServiceNow se o id é fixo por produto (configuração) ou vem do Asset."
    },
    {
      "id": "R56",
      "grupo": "produto",
      "nome": "bd_relatedServiceId",
      "tipo": "string",
      "linha": "Node_Start · Node_CriaBD · QA CAMPOS.int18",
      "bpmn": "data_bd_relatedServiceId: Node_CriaBD relatedEntity relatedService.id (omitido se vazio).",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida"
      },
      "valores": "GUID (DM do BD)",
      "fontes": {
        "PM": {
          "v": "'' (sem variável na collection)",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo manual 'ID relatedService'",
          "r": "parcial"
        }
      },
      "leitura": "Sem origem. Pode ser o mesmo serviço da INT06 (hpsdRelatedServiceId), mas nenhuma fonte liga os dois.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o ServiceNow a origem e se corresponde ao relatedService do HPSD."
    },
    {
      "id": "R57",
      "grupo": "produto",
      "nome": "hpsdRelatedServiceId (opcional)",
      "tipo": "string",
      "linha": "Node_Start (opcionais) · Node_SolicitaDiagnostico · QA CAMPOS.jornada",
      "bpmn": "Opcional. data_hpsdRelatedServiceId: Node_SolicitaDiagnostico relatedService.id; se vazio, usa data_designador.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida; o padrão é o designador"
      },
      "valores": "Id do serviço testado; o exemplo do DM do HPSD usa um designador 069",
      "fontes": {
        "PM": {
          "v": "Variável existe vazia, mas não vai no body do START",
          "r": "parcial"
        },
        "QA": {
          "v": "Campo 'HPSD relatedService.id', padrão: designador",
          "r": "igual"
        }
      },
      "leitura": "Opcional e com padrão, mas o padrão depende da decisão 013 × 069.",
      "acao": "decidir",
      "acaoTexto": "Junto com 013 × 069, definir se o VE manda este id ou se vale o designador de acesso."
    },
    {
      "id": "R58",
      "grupo": "produto",
      "nome": "wo_relatedEntity (opcional)",
      "tipo": "JSON",
      "linha": "Node_Start (opcionais) · Node_CriaWO",
      "bpmn": "Opcional. data_wo_relatedEntity (JSON): substitui os produtos Banda Larga e ACESSO montados no Node_CriaWO.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida"
      },
      "valores": "Lista JSON de ProductEntity; o exemplo do WFM tem 5 produtos (Banda Larga, ACESSO, VEL, IP Fixo, Roteador)",
      "fontes": {
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "QA": {
          "v": "Não usa: tem o corpo manual da INT14 (wfmCorpoInt14) e campos próprios dos produtos",
          "r": "parcial"
        }
      },
      "leitura": "Válvula de escape para os produtos que o BPMN não monta (VEL, IP Fixo, Roteador). Ninguém manda hoje, e pedir JSON livre ao canal não tem contrato.",
      "acao": "decidir",
      "acaoTexto": "Definir com o WFM se VEL, IP Fixo e Roteador são obrigatórios e, se forem, de onde vêm (Asset?)."
    },
    {
      "id": "R59",
      "grupo": "produto",
      "nome": "bd_<campo> (opcionais)",
      "tipo": "string",
      "linha": "Node_Start (opcionais) · Node_CriaBD · QA CAMPOS.int18 e parametrosBd",
      "bpmn": "Opcionais. data_bd_<campo> tem precedência no Node_CriaBD: 36 características, customerId, customerName, email, phone, serviceNowCustomerId, description, severity, name e channel.",
      "valor": {
        "t": "nenhum",
        "de": "sem origem definida; padrões do BPMN e wo_* cobrem parte"
      },
      "valores": "Por característica (ver INT18); description, severity 3, name e channel Alert têm padrão no BPMN",
      "fontes": {
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "QA": {
          "v": "Campos bd_* do formulário; parametrosBd deriva de wo_* e do slot",
          "r": "parcial"
        }
      },
      "leitura": "Não pesam no 400 (opcionais). A INT18 analisa cada característica.",
      "acao": "decidir",
      "acaoTexto": "Definir quais bd_* o VE deve mandar; hoje nenhum vai no START."
    },
    {
      "id": "R60",
      "grupo": "produto",
      "nome": "Campos só do QA (wo_productCode, wo_velocidade, wo_ipFixo, wo_roteador, wo_canBeAntecipated)",
      "tipo": "string",
      "linha": "QA CAMPOS.int14 e PADROES_INT14",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "não existem no START"
      },
      "valores": "Padrões de laboratório do curl do WFM (código do produto, velocidade, IP fixo, roteador); antecipação = checkbox",
      "fontes": {
        "QA": {
          "v": "Campos do formulário da INT14; não existem no Node_Start",
          "r": "so-fonte"
        }
      },
      "leitura": "A tela de QA manda produtos e características que o BPMN só aceita via wo_relatedEntity. A antecipação vem da tela no BPMN (data_avisarHorarioMaisCedo).",
      "acao": "decidir",
      "acaoTexto": "Junto com R58, decidir se viram chaves do START ou se ficam no wo_relatedEntity."
    },
    {
      "id": "S01",
      "grupo": "resposta",
      "nome": "HTTP 201 Created",
      "tipo": "status",
      "linha": "Postman teste 01/01 · evidência 19/11 (rodada inicial 01, 201)",
      "bpmn": "Instância criada; o fluxo para em Node_Inicio (userTask). Nenhuma integração roda antes do /advance.",
      "valor": {
        "t": "resposta",
        "de": "fachada"
      },
      "valores": "201 com corpo da instância",
      "fontes": {
        "PM": {
          "v": "Teste aceita 2xx e exige processInstanceId",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 19/11: HTTP 201",
          "r": "igual"
        }
      },
      "leitura": "O DM não diz o código de sucesso; a fachada devolve 201.",
      "acao": "fonte",
      "acaoTexto": "Registrar 201 como sucesso nas abas VE x Camunda - Response."
    },
    {
      "id": "S02",
      "grupo": "resposta",
      "nome": "Identificação da instância",
      "tipo": "body",
      "linha": "DM Massivas e WO VE x Camunda - Response C7 a C12, C16 e C19 · evidência 201",
      "bpmn": "processInstanceId, businessKey, processDefinitionKey (fenix-ve-abertura-bd), versionTag v1, processDefinitionId, processDefinitionVersion, executionId, tenantId (null), activeProcessInstanceId.",
      "valor": {
        "t": "resposta",
        "de": "fachada / motor"
      },
      "valores": "processInstanceId UUID; processDefinitionId '<chave>:<versão>:<uuid>'; tenantId null",
      "fontes": {
        "US": {
          "v": "US01 a US11 e US13 (Req01, Ações ou Pré-condições): 'VE inicia o workflow \"feature FTAT-933\" (com ID único por workflow)'. O motor gera um processInstanceId único por instância; o businessKey (R06) fica com o VE.",
          "r": "igual"
        },
        "DM": {
          "v": "Massivas v2.1 e WO v2.2 · Response (abas idênticas): processInstanceId, businessKey, processDefinitionKey, processDefinitionVersionTag, processDefinitionId, processDefinitionVersion, executionId, tenantId · todos Obrigatório · String (versão Integer)",
          "r": "parcial"
        },
        "PM": {
          "v": "Grava processInstanceId para os próximos requests",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 201: todos presentes; tenantId null; mais activeProcessInstanceId",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 7
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 8
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 9
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 10
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 11
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 12
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 16
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 19
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 29
        }
      ],
      "leitura": "Bate no essencial. O DM marca tenantId como obrigatório, mas ele vem null, e activeProcessInstanceId não está no DM.",
      "acao": "fonte",
      "acaoTexto": "Ajustar o DM: tenantId pode ser null; incluir activeProcessInstanceId."
    },
    {
      "id": "S03",
      "grupo": "resposta",
      "nome": "Atividade atual (Node_Inicio)",
      "tipo": "body",
      "linha": "DM Massivas e WO VE x Camunda - Response C13 a C18 · evidência 201 · Postman teste da collection",
      "bpmn": "activityId e taskId Node_Inicio, activityType userTask, activityName 'Vamos verificar seu serviço', assignee do envelope.",
      "valor": {
        "t": "resposta",
        "de": "fachada / motor"
      },
      "valores": "activityId = taskId = Node_Inicio; activityType userTask",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 e WO v2.2 · Response (abas idênticas): activityId, activityType, activityName, taskId, assignee · Obrigatório · String",
          "r": "igual"
        },
        "PM": {
          "v": "Grava taskId e activityType; confere que a tela SDUI veio para o taskId",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 201: Node_Inicio / userTask",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 13
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 14
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 15
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 17
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 18
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 29
        }
      ],
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S04",
      "grupo": "resposta",
      "nome": "form (tela SDUI Node_Inicio)",
      "tipo": "body",
      "linha": "Postman descrição e teste · evidência 201",
      "bpmn": "A fachada anexa a tela publicada da userTask (screens.json, uiStepId Node_Inicio).",
      "valor": {
        "t": "resposta",
        "de": "fachada (telas da jornada a33acd94…)"
      },
      "valores": "form.name, form.sdui {schemaVersion, journeyId, uiStepId, data…}",
      "fontes": {
        "US": {
          "v": "US01 Req01, US02 Req01 e US03 Req01 (Ações): 'SDUI Elastic Journey informa ao BFF/VE (API+tela/figma): Título: Agora, vamos verificar o que pode estar acontecendo com sua internet · Subtítulo: Antes dos testes, vamos conferir o seu serviço para identificar possíveis problemas · CTA: Continuar'",
          "r": "igual"
        },
        "PM": {
          "v": "Descrição: 'devolve a tela Node_Inicio no campo form'; teste exige form.sdui.uiStepId = taskId",
          "r": "igual"
        },
        "QA": {
          "v": "Evidência 201: form.sdui.uiStepId Node_Inicio",
          "r": "igual"
        }
      },
      "leitura": "É o principal retorno para o canal e o DM não o documenta.",
      "acao": "fonte",
      "acaoTexto": "Incluir form (SDUI) nas abas VE x Camunda - Response."
    },
    {
      "id": "S05",
      "grupo": "resposta",
      "nome": "variables (eco das entradas)",
      "tipo": "body",
      "linha": "DM Massivas e WO VE x Camunda - Response C20 e C21 · evidência 201",
      "bpmn": "Devolve as variáveis da instância: as 44 data_* do START, channel e assignee (46 na evidência).",
      "valor": {
        "t": "resposta",
        "de": "fachada: variáveis da instância"
      },
      "valores": "Mapa data_<nome> → string",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 e WO v2.2 · Response (abas idênticas): variables · Obrigatório · Objeto { additionalProp1: {} }, sem detalhe",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência 201: 46 variáveis, incluindo contato, documento e endereço (sanitizados no arquivo)",
          "r": "igual"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 20
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 21
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 29
        }
      ],
      "leitura": "A resposta devolve ao canal tudo o que ele mandou, inclusive dados pessoais. O DM não diz o que deve voltar.",
      "acao": "decidir",
      "acaoTexto": "Definir com a fachada se a resposta do START precisa ecoar as data_* (dados pessoais) ou só o necessário para a tela."
    },
    {
      "id": "S06",
      "grupo": "resposta",
      "nome": "Estado e datas da instância",
      "tipo": "body",
      "linha": "DM Massivas e WO VE x Camunda - Response C22 a C27 · evidência 201",
      "bpmn": "status ACTIVE, suspended false, wasJustCreated true; outcome, created, endTime e removalTime null.",
      "valor": {
        "t": "resposta",
        "de": "fachada / motor"
      },
      "valores": "status ACTIVE (DM: 'active'); created null na criação",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 e WO v2.2 · Response (abas idênticas): status (ex. active), suspended (true/false), outcome, created, endTime, removalTime (YYYY-MM-DDThh:mm:ss.sTZD) · todos Obrigatório",
          "r": "diverge"
        },
        "QA": {
          "v": "Evidência 201: status ACTIVE; created/endTime/removalTime null; mais wasJustCreated",
          "r": "parcial"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 22
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 23
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 24
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 25
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 26
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 27
        },
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 29
        }
      ],
      "leitura": "O DM marca as datas como obrigatórias, mas elas vêm null; o status vem em maiúsculas, e wasJustCreated não está no DM.",
      "acao": "fonte",
      "acaoTexto": "Ajustar o DM: datas podem ser null, status em maiúsculas, incluir wasJustCreated."
    },
    {
      "id": "S07",
      "grupo": "resposta",
      "nome": "HTTP 400 · chave obrigatória ausente",
      "tipo": "status",
      "linha": "BPMN Node_Start documentation · evidência 19/11 (rodada complementar 01, E-02) · Postman pre-request",
      "bpmn": "Node_Start: chave ausente = 400 na fachada, sem criar instância.",
      "valor": {
        "t": "resposta",
        "de": "fachada valida as 44 chaves do snapshot"
      },
      "valores": "{ _errorCode: 400, _message: 'Unable to process request', _details: 'Variáveis de entrada obrigatórias não informadas: [<chaves>]', _timestamp, _traceId, _errors: [] }",
      "fontes": {
        "PM": {
          "v": "Não chega a receber: o pre-request põe '' nas chaves ausentes e não envia se faltar designador, productStatus ou issServiceNow",
          "r": "parcial"
        },
        "QA": {
          "v": "Evidência E-02: start sem designador → 400, _details lista [designador], sem processInstanceId",
          "r": "igual"
        }
      },
      "leitura": "Funciona como o BPMN documenta. O DM não descreve o erro, e quem seguir o DM (5 variáveis) cai aqui.",
      "acao": "fonte",
      "acaoTexto": "Documentar o 400 e o formato do erro na aba VE x Camunda - Response do DM de Massivas."
    },
    {
      "id": "S08",
      "grupo": "resposta",
      "nome": "Chave presente com valor vazio",
      "tipo": "regra",
      "linha": "BPMN Node_ConsultaMassiva, Node_ConsultaBD, Node_AvaliaImpedimentos · Postman pre-request · INT00 S02",
      "bpmn": "A fachada aceita ''. designador vazio → IllegalArgumentException na INT01/INT03; issServiceNow vazio → erro na INT03; productStatus vazio → erro em Node_AvaliaImpedimentos. Vira incidente técnico depois do /advance, sem tela de falha.",
      "valor": {
        "t": "start",
        "de": "START com '' nas chaves críticas"
      },
      "valores": "Críticas: designador, productStatus, issServiceNow. As demais vazias seguem e chegam vazias às INTs",
      "fontes": {
        "US": {
          "v": "US01 Observação 2: 'Se o Elastic Journey não conseguir consultar BD (por exemplo, indisponibilidade de API), informar ao VE via SDUI para direcionar o cliente para outro tipo de atendimento Vivo, ou direcionar o cliente para tentar mais tarde' · US02 e US03 Observação 2: o mesmo para Massiva/Manutenção",
          "r": "diverge"
        },
        "PM": {
          "v": "O pre-request bloqueia o envio se designador, productStatus ou issServiceNow estiverem vazios; o resto vai ''",
          "r": "parcial"
        }
      },
      "leitura": "O 400 só pega chave ausente. Com chave vazia, a instância nasce, o cliente vê a primeira tela e a jornada quebra na primeira integração. O dossiê (E-02) pede para não iniciar conectores com dados incompletos. As US pedem tela SDUI quando a consulta de BD ou Massiva não acontece; com designador ou issServiceNow vazio, o BPMN gera incidente em vez dessa tela.",
      "acao": "bpmn",
      "acaoTexto": "Validar designador, productStatus e issServiceNow logo após o START (ou na fachada) e levar à tela de falha em vez de incidente."
    },
    {
      "id": "S09",
      "grupo": "resposta",
      "nome": "X-Vivo-Transaction-Id (header da resposta)",
      "tipo": "header",
      "linha": "DM Massivas e WO VE x Camunda - Response D5",
      "bpmn": null,
      "valor": {
        "t": "resposta",
        "de": "fachada"
      },
      "valores": "Massivas: TID_VE_FTAT933INT001_YYYY-MM-DDTHH24:MI:SS.FFFZ. WO: TID_VE_FTAT933INT006_…",
      "fontes": {
        "DM": {
          "v": "Massivas v2.1 · Response: Obrigatório · String · TID_VE_FTAT933INT001_… | WO v2.2 · Response: Obrigatório · String · TID_VE_FTAT933INT006_…",
          "r": "so-fonte"
        }
      },
      "dm": [
        {
          "arquivo": "PreDataMapping FTAT-933 - Consulta de Massivas - v2.1.xlsx",
          "aba": "VE x Camunda - Response",
          "linha": 5
        },
        {
          "aba": "VE x Camunda - Response",
          "linha": 5
        }
      ],
      "leitura": "As duas abas de resposta são iguais, exceto a numeração do TID. Nenhuma evidência mostra os headers devolvidos pela fachada, e o BPMN não gera esse header.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com a fachada se ela devolve X-Vivo-Transaction-Id e com qual numeração."
    },
    {
      "id": "U01",
      "grupo": "us",
      "nome": "Tela de espera 'Analisando e fazendo ajustes'",
      "tipo": "tela",
      "linha": "US",
      "bpmn": null,
      "valor": {
        "t": "tela",
        "de": "US: SDUI do EJ logo após a primeira tela"
      },
      "valores": "Título 'Analisando e fazendo ajustes' · Subtítulo 'Por favor, aguarde' · CTA N/A",
      "fontes": {
        "US": {
          "v": "US01 Req01, US02 Req01 e US03 Req01 (Ações), depois da tela inicial: 'TÍTULO: Analisando e fazendo ajustes · SUBTÍTULO: Por favor, aguarde · CTA: N/A'",
          "r": "so-fonte"
        }
      },
      "leitura": "O BPMN não tem essa tela: depois do Continuar da Node_Inicio, o motor roda INT01 e INT03 e devolve direto a tela de impedimento, de reinício ou de falha. O screens.json também não tem esse texto.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o VE se 'Analisando e fazendo ajustes' é um loader do próprio canal enquanto o /advance da Node_Inicio processa ou se precisa de tela SDUI publicada."
    },
    {
      "id": "U02",
      "grupo": "us",
      "nome": "Fatura em aberto basta para não abrir BD",
      "tipo": "regra",
      "linha": "US",
      "bpmn": "Node_AvaliaImpedimentos: productStatus 'bloqueio' (sem Massiva) = ATRASO → Node_StatusAtraso ('Faturas em atraso', 'Identificamos um bloqueio financeiro. Consulte as faturas na Central de faturas.', CTA 'Ir pra Central de faturas') → Node_End_Impedimento. Só avalia depois que INT01 e INT03 respondem; se uma falhar, vai para Node_FalhaConsulta.",
      "valor": {
        "t": "start",
        "de": "productStatus do START (R11)"
      },
      "valores": "CTA da US: 'Ir para a central de faturas'; na tela: 'Ir pra Central de faturas'",
      "fontes": {
        "US": {
          "v": "US01 a US03 Premissa 3: 'Se o cliente tiver pendências financeiras com a Vivo (fatura em aberto) é o suficiente para não abrir um novo BD' e 'O Elastic Journey não vai precisar consultar nenhum sistema' · US03 Req03 (CA003): SN e Sigitm sem BD nem Massiva, fatura em aberto → 'SDUI … informa ao BFF/VE que cliente tem fatura(s) em aberto, e também informar um botão (CTA) ‘Ir para a central de faturas’' e 'não é possível seguir com a abertura de BD'",
          "r": "parcial"
        }
      },
      "leitura": "Tela e fim batem com a US03 Req03, e a ordem (consultar BD e Massiva antes) também. A US não cobre a falha de INT01 ou INT03 com bloqueio já conhecido pelo Asset: hoje o cliente vê 'Não conseguimos verificar agora', e não a tela de fatura. O CTA difere só na grafia ('Ir pra' × 'Ir para a').",
      "acao": "decidir",
      "acaoTexto": "Definir se, com bloqueio financeiro no START, a falha da INT01 ou da INT03 deve levar à tela de fatura (Node_StatusAtraso) em vez da tela de falha."
    },
    {
      "id": "U03",
      "grupo": "us",
      "nome": "Combinações com fatura e precedência",
      "tipo": "decisor",
      "linha": "US",
      "bpmn": "Node_AvaliaImpedimentos, em ordem: Massiva + fatura (MASSIVA_ATRASO) > Massiva + BD (MASSIVA_VISITA) > Massiva > fatura (ATRASO) > BD (VISITA). Node_StatusMassivaAtraso mostra previsão e protocolo da Massiva, 'Faturas em atraso' e CTA 'Ir pra Central de faturas'. BD + fatura sem Massiva e as três juntas caem em fatura (documentação do nó: precedência fatura > BD).",
      "valor": {
        "t": "start",
        "de": "productStatus (R11) + respostas da INT01 e da INT03"
      },
      "valores": "MASSIVA_ATRASO, MASSIVA_VISITA, MASSIVA, ATRASO, VISITA, NENHUM",
      "fontes": {
        "US": {
          "v": "US03 Req01 (CA001): Massiva aberta + 'a interpretação final é que sim, o cliente tem fatura em aberto' → 'informar os dados do Massiva … (dia, hora e protocolo), e também informar que o cliente tem fatura em aberto', CTA 'Ir para a central de faturas' · US03 Req02 (CA002): Massiva + BD e 'o cliente não tem fatura em aberto' → CTA 'Ir para a central de visitas' · US03 Req03 (CA003): só fatura",
          "r": "parcial"
        }
      },
      "leitura": "As três combinações da US03 batem com o BPMN. A US não diz o que fazer com BD + fatura sem Massiva nem com as três juntas; o BPMN escolheu fatura. Os dados da Massiva na tela (dia, hora e protocolo na US, previsão e protocolo no BPMN) são da INT01.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o negócio a precedência fatura > BD nas combinações que a US03 não cobre (BD + fatura sem Massiva; Massiva + BD + fatura)."
    },
    {
      "id": "U04",
      "grupo": "us",
      "nome": "Entrega das telas SDUI por polling no Redis",
      "tipo": "regra",
      "linha": "US",
      "bpmn": "Não está no BPMN: as telas são userTasks e a fachada devolve o form da próxima userTask na resposta do START e de cada /advance (S04).",
      "valor": {
        "t": "config",
        "de": "fachada ms-journey-v1"
      },
      "valores": null,
      "fontes": {
        "US": {
          "v": "US07 Req01, US09 Req01, US10 Req02 a Req04, US11 Req01 e US12 Req01: 'SDUI Elastic Journey informa (através de pooling em fila do Redis) ao BFF/VE' (slots, falha da WO, falha do BD, visita agendada, problema solucionado)",
          "r": "parcial"
        }
      },
      "leitura": "As US preveem que o canal busque as telas dos passos assíncronos numa fila Redis. O BPMN não trata do transporte, e a evidência do START mostra o form na resposta síncrona. Nenhuma fonte descreve como o VE recebe a tela que vem depois de um passo assíncrono (diagnóstico, WO, BD).",
      "acao": "decidir",
      "acaoTexto": "Confirmar com a fachada (ms-journey-v1) e o VE como o canal recebe as telas depois dos passos assíncronos: na resposta do /advance, como hoje, ou por polling numa fila Redis, como dizem as US."
    },
    {
      "id": "U05",
      "grupo": "us",
      "nome": "Contrato SDUI task_encontrou_cliente.v1.0.0",
      "tipo": "regra",
      "linha": "US",
      "bpmn": "As telas estão em fenix-ve-abertura-bd-v1/screens.json (schemaVersion 1.0.0, journeyId a33acd94…), resolvidas pela fachada por uiStepId.",
      "valor": {
        "t": "config",
        "de": "telas publicadas da jornada"
      },
      "valores": null,
      "fontes": {
        "US": {
          "v": "Todas as US, Premissa 1: 'Mensagem SDUI entre Elastic Journey e VE deve ser definida até 1 dia antes do início do DEV do Elastic Journey' · Premissa 2: 'Formato do SDUI entre VE e Elastic Journey Json anexado no Jira (“task_encontrou_cliente.v1.0.0”)'",
          "r": "parcial"
        }
      },
      "leitura": "O JSON citado está no Jira, fora do repositório; não dá para conferir se o screens.json segue esse formato.",
      "acao": "fonte",
      "acaoTexto": "Trazer ao repositório o JSON task_encontrou_cliente.v1.0.0 do Jira e conferir o screens.json contra ele."
    },
    {
      "id": "U06",
      "grupo": "us",
      "nome": "Pré-condição: cliente com FTTH",
      "tipo": "regra",
      "linha": "US",
      "bpmn": "Não valida: o Node_Start não recebe tipo de produto nem tecnologia como condição (wfmMediaType só alimenta a WFM, vazio = GPON; productType não existe no BPMN, R16).",
      "valor": {
        "t": "nenhum",
        "de": "VE decide antes de iniciar"
      },
      "valores": null,
      "fontes": {
        "US": {
          "v": "US01 a US13 (Pré-condições e CAs): 'Cliente com FTTH solicitou suporte técnico no VE' · Premissa 3: 'O status do produto FTTH do cliente'",
          "r": "so-fonte"
        }
      },
      "leitura": "A jornada vale só para FTTH, mas nada no BPMN garante isso. Se o filtro for do VE, basta registrar; se o EJ precisar validar, falta a variável (o productType do DM, R16, seria candidato).",
      "acao": "decidir",
      "acaoTexto": "Confirmar que o VE só inicia a jornada para clientes FTTH, ou definir a variável e a tela de recusa se o EJ tiver de validar."
    }
  ]
});
