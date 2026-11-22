/*
 * Raio-X · INT00 Consulta de Asset (inventário de produto do cliente)
 * Fora da jornada: o canal VE chama a Customer Asset Information v2 antes do START.
 * Nesta INT a coluna BPMN diz COMO o dado entra na jornada: qual variável do START recebe o valor
 * e onde o BPMN a usa. bpmn = null quando o BPMN não consome o campo. Formato em ../README.md.
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 */
RAIOX.registrar({
  "id": "INT00",
  "secao": "fora",
  "ordem": 0,
  "nome": "Consulta Asset",
  "nomeLongo": "Consulta de Asset (inventário de produto) pelo canal VE, antes do START",
  "rota": "Canal VE (fora da jornada) → Customer Asset Information v2 → variáveis do START",
  "endpoint": "GET {asset}/customers/{documento}/assets?typeId=documentNumber&fields=status=Ativo,Suspenso;productCode=INTERNET_BASICA,ACESSO;consumer=VE",
  "nos": "Fora do BPMN · alimenta Node_Start (44 chaves obrigatórias; o Asset preenche 14)",
  "resumo": "O VE consulta os produtos do cliente (itens Internet e Acesso) e repassa ao START designador, status, cliente, endereço e ids de produto. O BPMN não chama o Asset.",
  "fontes": [
    {
      "id": "US",
      "nome": "Histórias (US)",
      "curto": "US",
      "contrato": false,
      "arquivo": "Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/",
      "detalhe": "US01, US02 e US03 Premissa 3: o VE já consultou o sistema legado (consulta de asset), o status do produto FTTH traz o 'bloqueio' de fatura e o VE passa ao EJ o payload retornado; US03 Req01 a Req03: 'VE fez a Consulta de Asset e informou resposta ao EJ'; todas as US: TAGs de entrada a confirmar (CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC). Nenhuma US descreve a requisição do Asset."
    },
    {
      "id": "PM",
      "nome": "Postman 18/11",
      "curto": "PM",
      "contrato": false,
      "arquivo": "postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json",
      "detalhe": "Dois requests: \"01 - Jornada / 00 - Consulta de Asset (preenche entradas)\", cujo teste grava 14 variáveis lidas do item productFamily=Internet (e do item Acesso) usadas em \"01 - Iniciar jornada\"; e \"04 / 00 - Consulta Asset\", teste direto que não grava nada. Nenhum tem resposta salva."
    },
    {
      "id": "CURL",
      "nome": "curl",
      "curto": "CURL",
      "contrato": false,
      "arquivo": "postman/curls/INT00.sh",
      "detalhe": "Só a requisição: GET da Customer Asset Information v2 em preprod (csin-preprod…), com o documento no path (CNPJ de teste) e os headers Accept, X-Vivo-Origin, X-Vivo-Referer, X-Vivo-System e X-Vivo-TraceId; sem Authorization. Nas linhas de resposta, \"Resposta exemplo\" é postman/curls/INT00-response.jsonc, um retorno de Asset com dois itens (Internet Básica e Acesso). O campo serviceInventoryFormatado desse arquivo não faz parte do contrato (o próprio arquivo avisa)."
    },
    {
      "id": "QA",
      "nome": "Tela QA",
      "curto": "QA",
      "contrato": false,
      "arquivo": "qa-integracoes/fenix-ve-integracoes.html",
      "detalhe": "Spec id 'INT00' em ESPECIFICACOES (montar/avaliar), base AMBIENTES.preprod.asset, campos CAMPOS.asset; padrões em contextoDaIntegracao(). Evidência: evidencias/2026-11-19-rodada-completa/int-00-INT00.json (HTTP 200, 2 itens, 1871 ms)."
    }
  ],
  "grupos": [
    {
      "id": "request",
      "nome": "Requisição",
      "sub": "Canal VE → Customer Asset Information (fora da jornada)"
    },
    {
      "id": "response",
      "nome": "Resposta → START",
      "sub": "Asset → variáveis de entrada da jornada"
    }
  ],
  "campos": [
    {
      "id": "R01",
      "grupo": "request",
      "nome": "Método e endpoint",
      "tipo": "HTTP",
      "linha": "Postman 01/00 e 04/00 · QA montar() · curl INT00.sh",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'VE sabe se o cliente tem bloqueio financeiro (fatura(s) em aberto) pois já consultou em um sistema legado (consulta de asset)' e 'O Elastic Journey não vai precisar consultar nenhum sistema' · US03 Req01 a Req03: 'VE fez a Consulta de Asset e informou resposta ao EJ'",
          "r": "igual"
        },
        "PM": {
          "v": "GET {{asset_base_url}}/customers/{{assetDocumentNumber}}/assets?typeId=documentNumber&fields=…",
          "r": "igual"
        },
        "CURL": {
          "v": "GET https://csin-preprod…/customerAssetInformation/v2/customers/<documento>/assets?typeId=documentNumber&fields=…",
          "r": "igual"
        },
        "QA": {
          "v": "GET {asset}/customers/{assetDocumentNumber}/assets?typeId=documentNumber&fields=…",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R02",
      "grupo": "request",
      "nome": "{documento} (customers/{id})",
      "tipo": "path",
      "linha": "Postman assetDocumentNumber · QA CAMPOS.asset",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "{{assetDocumentNumber}}",
          "r": "igual"
        },
        "CURL": {
          "v": "CNPJ de teste (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "assetDocumentNumber",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R03",
      "grupo": "request",
      "nome": "typeId",
      "tipo": "query",
      "linha": "Postman · QA montar()",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "documentNumber",
          "r": "igual"
        },
        "CURL": {
          "v": "documentNumber",
          "r": "igual"
        },
        "QA": {
          "v": "documentNumber",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R04",
      "grupo": "request",
      "nome": "fields (filtro)",
      "tipo": "query",
      "linha": "Postman · QA montar()",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "status=Ativo,Suspenso;productCode=INTERNET_BASICA,ACESSO;consumer=VE (URL-encoded)",
          "r": "igual"
        },
        "CURL": {
          "v": "status=Ativo,Suspenso;productCode=INTERNET_BASICA,ACESSO;consumer=VE (URL-encoded)",
          "r": "igual"
        },
        "QA": {
          "v": "status=Ativo,Suspenso;productCode=INTERNET_BASICA,ACESSO;consumer=VE (URL-encoded)",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R05",
      "grupo": "request",
      "nome": "Authorization",
      "tipo": "header",
      "linha": "Postman auth da collection · QA headersBase",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "Bearer <token VE>",
          "r": "igual"
        },
        "CURL": {
          "v": "Não envia"
        },
        "QA": {
          "v": "Bearer <token VE>",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R06",
      "grupo": "request",
      "nome": "X-Vivo-Origin",
      "tipo": "header",
      "linha": "Postman · QA montar()",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "VE",
          "r": "igual"
        },
        "CURL": {
          "v": "VE",
          "r": "igual"
        },
        "QA": {
          "v": "VE",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R07",
      "grupo": "request",
      "nome": "X-Vivo-Referer",
      "tipo": "header",
      "linha": "Postman · QA montar()",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "coop.vivo.com.br",
          "r": "igual"
        },
        "CURL": {
          "v": "coop.vivo.com.br",
          "r": "igual"
        },
        "QA": {
          "v": "coop.vivo.com.br",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R08",
      "grupo": "request",
      "nome": "X-Vivo-System",
      "tipo": "header",
      "linha": "Postman · QA montar() · dossiê (DATI §6)",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "B2B",
          "r": "igual"
        },
        "CURL": {
          "v": "B2B",
          "r": "igual"
        },
        "QA": {
          "v": "B2B",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R09",
      "grupo": "request",
      "nome": "X-Vivo-TraceId",
      "tipo": "header",
      "linha": "Postman · QA montar() · curl",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "TID_VE_MULE000048_{{$isoTimestamp}}",
          "r": "igual"
        },
        "CURL": {
          "v": "TID_VE_MULE000048_<ISO>",
          "r": "igual"
        },
        "QA": {
          "v": "'TID_VE_MULE000048_' + ISO",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R10",
      "grupo": "request",
      "nome": "X-Vivo-Correlation-Id",
      "tipo": "header",
      "linha": "BPMN START correlationId · Postman · QA",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "Não envia",
          "r": "igual"
        },
        "CURL": {
          "v": "Não envia"
        },
        "QA": {
          "v": "Não envia",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R11",
      "grupo": "request",
      "nome": "Accept",
      "tipo": "header",
      "linha": "Postman · QA headersBase · curl",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "application/json",
          "r": "igual"
        },
        "CURL": {
          "v": "application/json",
          "r": "igual"
        },
        "QA": {
          "v": "application/json",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "R12",
      "grupo": "request",
      "nome": "Timeout e retentativa",
      "tipo": "config",
      "linha": "QA timeoutPadrao/executar · evidência 19/11",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": ""
      },
      "fontes": {
        "PM": {
          "v": "Não envia"
        },
        "CURL": {
          "v": "Não envia"
        },
        "QA": {
          "v": "Limite de 30000 ms; GET com erro de rede repete 1 vez",
          "r": "igual"
        }
      },
      "leitura": "",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S01",
      "grupo": "response",
      "nome": "HTTP 200 / 206",
      "tipo": "status",
      "linha": "Postman teste · QA esperado · evidência 19/11",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "o BPMN não vê o status; recebe só o START"
      },
      "fontes": {
        "PM": {
          "v": "Teste aceita 200 e 206 e exige lista content",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo sem status HTTP; corpo com content[] de 2 itens",
          "r": "parcial"
        },
        "QA": {
          "v": "esperado [200, 206]. Evidência 19/11: 200, 2 itens (Internet e Acesso), ambos \"Ativo\"",
          "r": "igual"
        }
      },
      "leitura": "Postman e QA aceitam 206, mas nenhuma fonte explica o que ele significa. Se for resposta paginada, um cliente com muitos produtos pode ficar sem o item certo na lista.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o dono do Asset o significado do 206 e se há paginação."
    },
    {
      "id": "S02",
      "grupo": "response",
      "nome": "Falha ou content vazio",
      "tipo": "status",
      "linha": "Postman descrição 01/00 · QA avaliar() · BPMN Node_ConsultaMassiva, Node_AvaliaImpedimentos",
      "bpmn": "Sem Asset não há designador nem productStatus. Chave ausente no START = 400 na fachada; valor vazio = IllegalArgumentException na INT01/INT03 e em Node_AvaliaImpedimentos (incidente técnico, sem tela de falha).",
      "valor": {
        "t": "start",
        "de": "START designador/productStatus vazios"
      },
      "fontes": {
        "PM": {
          "v": "Descrição: \"Se a consulta falhar, nada é alterado e o início da jornada segue com as variáveis atuais\" (valores de uma execução anterior ou vazios)",
          "r": "diverge"
        },
        "QA": {
          "v": "Check \"Asset selecionado\" falha e entradasAsset não é gravado; as INTs seguintes usam os campos do formulário",
          "r": "parcial"
        }
      },
      "leitura": "Ninguém define o que o VE faz se o Asset falhar. No Postman a jornada começa assim mesmo, com dados velhos. Na jornada real, o designador vazio vira incidente técnico na primeira consulta (mesmo achado da INT01 R06). O dossiê (E-02) já pede para não iniciar conectores com dados incompletos.",
      "acao": "bpmn",
      "acaoTexto": "Validar designador e productStatus logo após o START e levar à tela de falha; combinar com o VE não iniciar sem Asset."
    },
    {
      "id": "S03",
      "grupo": "response",
      "nome": "Seleção do item em content[]",
      "tipo": "array",
      "linha": "Postman teste 01/00 · QA avaliar() · resposta exemplo",
      "bpmn": "O START recebe escalares soltos, não a lista. O BPMN supõe um único serviço (designador) e um acesso (wo_acesso*).",
      "valor": {
        "t": "start",
        "de": "item escolhido pelo VE → escalares do START"
      },
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'O status do produto FTTH do cliente'. A US fala de um produto FTTH e não diz como escolher entre vários itens.",
          "r": "parcial"
        },
        "PM": {
          "v": "Serviço = item com productFamily=Internet; acesso = item com productFamily=Acesso",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: content[0] \"Internet Básica\" (productFamily Internet) e content[1] \"Acesso\" (productFamily Acesso), mesmo rootItemId",
          "r": "igual"
        },
        "QA": {
          "v": "Serviço = content[assetIndice] (padrão 0), sem olhar productFamily; acesso = item com productFamily=Acesso",
          "r": "diverge"
        }
      },
      "leitura": "A tela de QA só acerta porque o item Internet vem primeiro no exemplo. Com vários circuitos no mesmo CNPJ, nenhuma fonte diz como escolher (o DATI diz que o cliente seleciona o asset antes do início). O dossiê pede para não misturar cliente, produto e rede de itens diferentes, e o par Internet/Acesso pode ser casado pelo rootItemId, mas nenhuma fonte define essa regra.",
      "acao": "decidir",
      "acaoTexto": "Definir com o VE a regra de seleção (escolha do cliente + productFamily + rootItemId)."
    },
    {
      "id": "S04",
      "grupo": "response",
      "nome": "idDesignador do item Internet",
      "tipo": "string",
      "linha": "BPMN Node_ConsultaMassiva, Node_ConsultaBD, Node_SolicitaDiagnostico, Node_CriaWO, Node_CriaBD",
      "bpmn": "START designador → data_designador: INT01 serviceDesignator, INT03 correlation_display, INT06 AccessDesignator e relatedService (se faltar hpsdRelatedServiceId), INT14 Banda Larga · Designator, INT18 designadorAcesso.",
      "valor": {
        "t": "start",
        "de": "content[Internet].productCharacteristic[name=idDesignador].value → designador"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não diz qual designador (013 ou 069).",
          "r": "igual"
        },
        "PM": {
          "v": "designador ← idDesignador do item productFamily=Internet",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: SPO-SF897657-013 (final 013, serviço)",
          "r": "igual"
        },
        "QA": {
          "v": "designador ← idDesignador do item content[assetIndice]",
          "r": "parcial"
        }
      },
      "leitura": "O caminho bate. O problema é o uso: o designador de serviço (013) alimenta também INT03, INT06 e INT18, cujos DMs pedem o de acesso (069). DM remoto: asset[i].logicalResource.id → content[i].productCharacteristic[idDesignador]. A planilha de variáveis proíbe trocar o sufixo de um para chegar ao outro.",
      "acao": "decidir",
      "acaoTexto": "Fechar 013 × 069 por integração com CPM, ServiceNow e HPSD (dossiê QA-BPMN-10)."
    },
    {
      "id": "S05",
      "grupo": "response",
      "nome": "status do item",
      "tipo": "string",
      "linha": "BPMN Node_AvaliaImpedimentos · Postman · QA · dossiê Q02",
      "bpmn": "START productStatus → data_productStatus. Node_AvaliaImpedimentos: 'bloqueio' (sem diferenciar maiúsculas) = fatura em atraso; vazio = erro.",
      "valor": {
        "t": "start",
        "de": "content[i].status → productStatus"
      },
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'O status do produto FTTH do cliente estará com um \"bloqueio\" referente a fatura em aberto' e 'Quando o VE acionar o Elastic Journey, ele vai passar o payload retornado na consulta de assets e o Elastic Journey vai \"interpretar\" o payload'; 'Se o cliente tiver pendências financeiras … é o suficiente para não abrir um novo BD' · US03 Req01 a Req03: 'a interpretação final é que sim (ou não), o cliente tem fatura em aberto'",
          "r": "parcial"
        },
        "PM": {
          "v": "productStatus ← status do item Internet. A variável vem com \"ativo\" e a descrição manda usar \"bloqueio\" para simular fatura",
          "r": "diverge"
        },
        "CURL": {
          "v": "Resposta exemplo: \"Ativo\" nos dois itens",
          "r": "diverge"
        },
        "QA": {
          "v": "productStatus ← status do item selecionado. Evidência 19/11: \"Ativo\"",
          "r": "diverge"
        }
      },
      "leitura": "O Asset devolve \"Ativo\" ou \"Suspenso\" (o filtro R04 corta o resto), e o BPMN procura \"bloqueio\". Repassado cru, o status nunca aciona a regra de fatura. O DM remoto lista DE/PARA Ativo→Active, Suspenso→Suspended…, sem \"bloqueio\" e sem bater com o \"Ativo\" do exemplo. A US manda a jornada interpretar o bloqueio; o DFT (slide 4) manda o VE. Não está provado que Suspenso = inadimplência. A letra da US (o status 'estará com um \"bloqueio\"') bate com o BPMN, mas não com os valores do Asset (Ativo/Suspenso). O BPMN interpreta só o status repassado no START, não o payload.",
      "acao": "decidir",
      "acaoTexto": "Definir quem traduz o status em bloqueio financeiro e a partir de qual campo (dossiê Q02)."
    },
    {
      "id": "S06",
      "grupo": "response",
      "nome": "id do item Internet",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "START wo_productId → data_wo_productId: INT14 relatedEntity 'Banda Larga'.id.",
      "valor": {
        "t": "start",
        "de": "content[Internet].id → wo_productId"
      },
      "fontes": {
        "PM": {
          "v": "wo_productId ← id do item Internet",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: id Salesforce de 18 caracteres (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_productId ← id do item selecionado",
          "r": "igual"
        }
      },
      "leitura": "Postman, QA e BPMN fazem o mesmo caminho. Nenhuma fonte confirma que o WFM espera o id do asset: o exemplo do DM de WO traz um id com outro prefixo.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o WFM que ProductEntity.id é o content[].id do Asset."
    },
    {
      "id": "S07",
      "grupo": "response",
      "nome": "idDesignador do item Acesso",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "START wo_acessoDesignador → data_wo_acessoDesignador: só INT14, característica Designator do produto 'ACESSO' (se houver wo_acessoId). INT03, INT06 e INT18 não usam.",
      "valor": {
        "t": "start",
        "de": "content[Acesso].productCharacteristic[name=idDesignador].value → wo_acessoDesignador"
      },
      "fontes": {
        "PM": {
          "v": "wo_acessoDesignador ← idDesignador do item productFamily=Acesso",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: SPO-SF897658-069 (final 069; o número do circuito também difere do 013)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_acessoDesignador ← idDesignador do item productFamily=Acesso",
          "r": "igual"
        }
      },
      "leitura": "O Asset já traz o designador de acesso que os DMs de INT03, INT06 e INT18 pedem, mas o BPMN o usa só na WO. O exemplo também mostra que trocar o sufixo de 013 para 069 não dá o valor certo: o número do circuito muda.",
      "acao": "decidir",
      "acaoTexto": "Depois da decisão 013 × 069, apontar INT03, INT06 e INT18 para esta variável se for o caso."
    },
    {
      "id": "S08",
      "grupo": "response",
      "nome": "id do item Acesso",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "START wo_acessoId → data_wo_acessoId: INT14 cria o produto 'ACESSO' só quando há valor.",
      "valor": {
        "t": "start",
        "de": "content[Acesso].id → wo_acessoId"
      },
      "fontes": {
        "PM": {
          "v": "wo_acessoId ← id do item Acesso",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: id Salesforce de 18 caracteres (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_acessoId ← id do item Acesso",
          "r": "igual"
        }
      },
      "leitura": "Bate nas três fontes.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S09",
      "grupo": "response",
      "nome": "relatedParty[].partyOrPartyRole.id",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_customerId → data_wo_customerId: INT14 CustomerValue.id; INT18 relatedParty.partyOrPartyRole.id (quando não há bd_customerId).",
      "valor": {
        "t": "start",
        "de": "content[i].relatedParty[].partyOrPartyRole.id → wo_customerId"
      },
      "fontes": {
        "PM": {
          "v": "wo_customerId ← primeiro partyOrPartyRole não nulo do item Internet",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: id de conta Salesforce, 18 caracteres (<omitido>), @type Organization",
          "r": "igual"
        },
        "QA": {
          "v": "wo_customerId ← relatedParty[0].partyOrPartyRole.id",
          "r": "igual"
        }
      },
      "leitura": "O caminho bate. O DM remoto o descreve como \"id cliente SFA\" e pede para escolher o papel certo de relatedParty. O BPMN comenta que a INT18 exige o ID Salesforce, mas o dossiê alerta para não presumir que é o mesmo id aceito pela INT18.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com ServiceNow/WFM que o id do Asset é o id de cliente esperado na INT14 e na INT18."
    },
    {
      "id": "S10",
      "grupo": "response",
      "nome": "relatedParty[].partyOrPartyRole.name",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_customerName → data_wo_customerName: INT14 CustomerValue.name; INT18 partyOrPartyRole.name.",
      "valor": {
        "t": "start",
        "de": "content[i].relatedParty[].partyOrPartyRole.name → wo_customerName"
      },
      "fontes": {
        "PM": {
          "v": "wo_customerName ← partyOrPartyRole.name",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: nome da organização (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_customerName ← relatedParty[0].partyOrPartyRole.name",
          "r": "igual"
        }
      },
      "leitura": "Bate. O DM remoto lembra que é o nome da empresa, e não o do contato ou reclamante (wo_contactName, sem origem no Asset).",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S11",
      "grupo": "response",
      "nome": "partyCharacteristic[name=documentNumber]",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_documentNumber → data_wo_documentNumber: INT14 CustomerValue.documentNumber; INT18 característica documentNumber.",
      "valor": {
        "t": "start",
        "de": "partyOrPartyRole.partyCharacteristic[documentNumber].value → wo_documentNumber"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC' (o CNPJ é o documento do cliente).",
          "r": "igual"
        },
        "PM": {
          "v": "wo_documentNumber ← partyCharacteristic documentNumber",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: CNPJ, 14 dígitos (<omitido>), com documentType \"CNPJ\"",
          "r": "igual"
        },
        "QA": {
          "v": "wo_documentNumber ← partyCharacteristic documentNumber do relatedParty[0]",
          "r": "igual"
        }
      },
      "leitura": "Bate. Tem de ser string para não perder zeros à esquerda. O documentType (CNPJ ou CPF) não é lido por ninguém.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S12",
      "grupo": "response",
      "nome": "place.postcode",
      "tipo": "string",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO, Node_CriaBD",
      "bpmn": "START wfmPostcode → data_wfmPostcode: INT11 address.postcode, INT14 place.postcode, INT18 característica postcode.",
      "valor": {
        "t": "start",
        "de": "content[i].place[role=installationAddress].place.postcode → wfmPostcode"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wfmPostcode ← place com role installationAddress (ou place[0])",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: CEP de 8 dígitos (<omitido>), role installationAddress",
          "r": "igual"
        },
        "QA": {
          "v": "wfmPostcode ← place[0].place.postcode (não olha o role)",
          "r": "parcial"
        }
      },
      "leitura": "Bate. A tela de QA pega o primeiro place, que só coincide com o endereço de instalação neste exemplo. DM remoto: content[i].place[role=installationAddress].place.postcode.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S13",
      "grupo": "response",
      "nome": "place.streetNr",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_streetNr → data_wo_streetNr: INT14 place.streetNr, INT18 streetNr.",
      "valor": {
        "t": "start",
        "de": "place[installationAddress].place.streetNr → wo_streetNr"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wo_streetNr ← place.streetNr",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: número do imóvel (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_streetNr ← place[0].place.streetNr",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S14",
      "grupo": "response",
      "nome": "place.streetName",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_streetName → data_wo_streetName: INT14 place.streetName, INT18 streetName.",
      "valor": {
        "t": "start",
        "de": "place[installationAddress].place.streetName → wo_streetName"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wo_streetName ← place.streetName",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: logradouro com acento e caixa mista; o serviceInventory traz o mesmo em maiúsculas, sem acento e sem o tipo",
          "r": "igual"
        },
        "QA": {
          "v": "wo_streetName ← place[0].place.streetName",
          "r": "igual"
        }
      },
      "leitura": "Bate. O exemplo traz o logradouro em dois formatos (place e serviceInventory), e todos usam o do place.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S15",
      "grupo": "response",
      "nome": "place.locality",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_neighborhood → data_wo_neighborhood: INT14 place.neighborhood, INT18 endBairro.",
      "valor": {
        "t": "start",
        "de": "place[installationAddress].place.locality → wo_neighborhood"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wo_neighborhood ← place.locality",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: bairro por extenso (<omitido>)",
          "r": "igual"
        },
        "QA": {
          "v": "wo_neighborhood ← place[0].place.locality",
          "r": "igual"
        }
      },
      "leitura": "Bate. Pelo DM remoto, locality é o bairro (vem de municipalityname), e não a cidade.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S16",
      "grupo": "response",
      "nome": "place.stateOrProvince",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD · QA siglaUf",
      "bpmn": "START wo_stateOrProvince → data_wo_stateOrProvince, repassado sem conversão: INT14 place.stateOrProvince, INT18 estadoDescricao.",
      "valor": {
        "t": "start",
        "de": "place[installationAddress].place.stateOrProvince → wo_stateOrProvince"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wo_stateOrProvince ← place.stateOrProvince, sem conversão",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: \"São Paulo\" por extenso (o serviceInventory traz \"SP\")",
          "r": "parcial"
        },
        "QA": {
          "v": "wo_stateOrProvince ← place[0]; na INT14 converte para sigla (siglaUf: \"São Paulo\" → SP)",
          "r": "diverge"
        }
      },
      "leitura": "O Asset devolve o estado por extenso, e o exemplo do WFM usa a sigla. A tela de QA converte, o BPMN não. Para a INT18 (estadoDescricao), a planilha de variáveis deixa a normalização sigla × nome pendente. Nenhuma fonte diz quem converte.",
      "acao": "decidir",
      "acaoTexto": "Definir o formato por destino (sigla na INT14?) e quem converte: VE no START ou BPMN."
    },
    {
      "id": "S17",
      "grupo": "response",
      "nome": "place.city",
      "tipo": "string",
      "linha": "BPMN Node_CriaWO, Node_CriaBD",
      "bpmn": "START wo_city → data_wo_city: INT14 place.city, INT18 city.",
      "valor": {
        "t": "start",
        "de": "place[installationAddress].place.city → wo_city"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "wo_city ← place.city",
          "r": "igual"
        },
        "CURL": {
          "v": "Resposta exemplo: cidade por extenso, com acento",
          "r": "igual"
        },
        "QA": {
          "v": "wo_city ← place[0].place.city",
          "r": "igual"
        }
      },
      "leitura": "Bate.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S18",
      "grupo": "response",
      "nome": "place.geographicSubAddress[]",
      "tipo": "array",
      "linha": "BPMN Node_CriaWO, Node_CriaBD · DM remoto",
      "bpmn": "START wo_complement → data_wo_complement: INT14 geographicSubAddress.name, INT18 complement. Hoje o VE não tem origem para essa chave.",
      "valor": {
        "t": "start",
        "de": "candidato: geographicSubAddress[].subUnit[] → wo_complement"
      },
      "fontes": {
        "US": {
          "v": "US01 a US13 (Postman, 'INPUT VE/BFF > Elastic Journey'): 'TAGs a serem preenchidas: (confirmar quais TAGs precisam) CNPJ, ENDEREÇO, ID DO DESIGNADOR, ETC'. A US não detalha os campos do endereço.",
          "r": "igual"
        },
        "PM": {
          "v": "Não lê. O START leva wo_complement vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: [] vazio (complemento \"\" também no serviceInventory)",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Na INT14 usa o complemento de laboratório (PADROES_INT14)"
        }
      },
      "leitura": "O DM remoto aponta geographicSubAddress[].subUnit[] (subUnitType/subUnitNumber) como a fonte do complemento, mas a regra para juntar tudo numa string não está fechada. O exemplo veio sem complemento.",
      "acao": "decidir",
      "acaoTexto": "Definir com o VE a regra de concatenação do complemento."
    },
    {
      "id": "S19",
      "grupo": "response",
      "nome": "Tecnologia (technology · type · serviceInventory.tecnologia)",
      "tipo": "string",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO",
      "bpmn": "START wfmMediaType → data_wfmMediaType (vazio vira 'GPON'): INT11 mediaType, INT14 accessTechnology e característica Technology.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidatos no Asset"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva a variável da collection: \"GPON\""
        },
        "CURL": {
          "v": "Resposta exemplo: technology \"FIBRA\" nos dois itens; type \"Óptico GPON\" só no Acesso; serviceInventory.tecnologia \"GPON\"",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"Mídia\" (padrão GPON)"
        }
      },
      "leitura": "Há três candidatos com valores diferentes. O DM remoto liga accessTechnology a productCharacteristic[type] e avisa que technology é outro campo. Repassar \"FIBRA\" mandaria ao WFM um valor fora do exemplo. Hoje o GPON vem fixo, não do Asset.",
      "acao": "decidir",
      "acaoTexto": "Escolher o campo do Asset e o DE/PARA para o mediaType do WFM."
    },
    {
      "id": "S20",
      "grupo": "response",
      "nome": "Dono da rede (networkOwnerId · inventory.networkOwner)",
      "tipo": "string",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO",
      "bpmn": "START wfmNetworkOwner → data_wfmNetworkOwner (vazio vira 'VIVO1'): escolhe a variante VIVO1/VIVO2 da INT11 e vai em INT14 place.networkOwner.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidatos no Asset"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva a variável da collection: \"VIVO1\""
        },
        "CURL": {
          "v": "Resposta exemplo: networkOwnerId \"N/A\" (só no item Internet); serviceInventory.inventory.networkOwner \"VIVO1\"",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"Dono da rede\" (VIVO1/VIVO2)"
        }
      },
      "leitura": "O DM remoto mapeia networkOwnerId, mas com exemplo numérico e sem DE/PARA para VIVO1/VIVO2. No exemplo, networkOwnerId é \"N/A\" e o valor útil está dentro do serviceInventory. Se o VE repassar \"N/A\", o BPMN não cai no padrão VIVO1 (o padrão só cobre vazio).",
      "acao": "decidir",
      "acaoTexto": "Definir o campo de origem e o DE/PARA VIVO1/VIVO2."
    },
    {
      "id": "S21",
      "grupo": "response",
      "nome": "serviceInventory → inventory.cnl",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO",
      "bpmn": "START wfmCnl → data_wfmCnl: INT11 address.cnl, INT14 place.cnl.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.cnl"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva wfmCnl vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: \"11000\" dentro de serviceInventory (string JSON, precisa de parse)",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"CNL\""
        }
      },
      "leitura": "O exemplo do Asset traz o CNL, mas ninguém o mapeia. Os valores que o dossiê chama de \"massa de laboratório\" do QA (11000/CB/VM) são os mesmos deste serviceInventory. O DM remoto transcrito não cita o serviceInventory.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com o dono do Asset se o serviceInventory é contrato e mapear cnl → wfmCnl."
    },
    {
      "id": "S22",
      "grupo": "response",
      "nome": "serviceInventory → inventory.telephonicArea",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO, Node_CriaBD",
      "bpmn": "START wfmTelephonicArea → data_wfmTelephonicArea: INT11 (só VIVO1), INT14 place.telephonicArea, INT18 característica telephonicArea.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.telephonicArea"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva wfmTelephonicArea vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: \"CB\" dentro de serviceInventory",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"Área telefônica (VIVO1)\""
        }
      },
      "leitura": "Mesmo caso do CNL: o dado existe no exemplo, mas não chega ao START.",
      "acao": "decidir",
      "acaoTexto": "Mapear telephonicArea → wfmTelephonicArea se o serviceInventory for contrato."
    },
    {
      "id": "S23",
      "grupo": "response",
      "nome": "serviceInventory → inventory.centralOffice",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_ConsultaSlots, Node_CriaWO",
      "bpmn": "START wfmCentralOffice → data_wfmCentralOffice: INT11 (só VIVO1), INT14 place.centralOffice.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.centralOffice"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva wfmCentralOffice vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: \"VM\" dentro de serviceInventory",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"Estação (VIVO1)\""
        }
      },
      "leitura": "Mesmo caso do CNL.",
      "acao": "decidir",
      "acaoTexto": "Mapear centralOffice → wfmCentralOffice se o serviceInventory for contrato."
    },
    {
      "id": "S24",
      "grupo": "response",
      "nome": "serviceInventory → inventory.microArea",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_ConsultaSlots",
      "bpmn": "Entrada opcional wfmMicroArea → data_wfmMicroArea: INT11 address.microArea (só VIVO1).",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.microArea"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. wfmMicroArea não vai no START da collection"
        },
        "CURL": {
          "v": "Resposta exemplo: código de microárea dentro de serviceInventory",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Campo manual \"Microárea (VIVO1)\""
        }
      },
      "leitura": "Opcional no START, mas o Asset do exemplo traz o valor.",
      "acao": "decidir",
      "acaoTexto": "Mapear microArea → wfmMicroArea se o serviceInventory for contrato."
    },
    {
      "id": "S25",
      "grupo": "response",
      "nome": "serviceInventory → inventory.cnlAcronym",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "START wo_cnlAcronym → data_wo_cnlAcronym: INT14 place.cnlAcronym.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.cnlAcronym"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva wo_cnlAcronym vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: \"SPO\" dentro de serviceInventory",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Na INT14 usa a sigla de laboratório (PADROES_INT14)"
        }
      },
      "leitura": "Chave obrigatória do START sem origem definida, mas presente no exemplo do Asset.",
      "acao": "decidir",
      "acaoTexto": "Mapear cnlAcronym → wo_cnlAcronym se o serviceInventory for contrato."
    },
    {
      "id": "S26",
      "grupo": "response",
      "nome": "serviceInventory → inventory.streetCode",
      "tipo": "string (JSON em texto)",
      "linha": "BPMN Node_CriaWO",
      "bpmn": "START wo_streetCode → data_wo_streetCode: INT14 place.streetCode.",
      "valor": {
        "t": "start",
        "de": "sem mapeamento; candidato serviceInventory.inventory.streetCode"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva wo_streetCode vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: código de logradouro dentro de serviceInventory",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. Na INT14 usa o código de laboratório (PADROES_INT14)"
        }
      },
      "leitura": "Mesmo caso do cnlAcronym.",
      "acao": "decidir",
      "acaoTexto": "Mapear streetCode → wo_streetCode se o serviceInventory for contrato."
    },
    {
      "id": "S27",
      "grupo": "response",
      "nome": "productCharacteristic[name=productInventorySom]",
      "tipo": "string",
      "linha": "BPMN Node_CriaBD · DM remoto",
      "bpmn": "START bd_productInventoryId → data_bd_productInventoryId: INT18 relatedEntity ProductInventory.id (omitido se vazio).",
      "valor": {
        "t": "start",
        "de": "candidato: productInventorySom → bd_productInventoryId"
      },
      "fontes": {
        "PM": {
          "v": "Não lê. O START leva bd_productInventoryId vazio"
        },
        "CURL": {
          "v": "Resposta exemplo: hash de 32 caracteres (<omitido>), igual nos itens Internet e Acesso",
          "r": "parcial"
        },
        "QA": {
          "v": "Não lê. A INT18 usa o campo bd_productInventoryId do formulário"
        }
      },
      "leitura": "O DM remoto aponta productInventorySom (\"ID produto SOM\") como candidato, sem provar que é o ProductInventory que a INT18 espera.",
      "acao": "decidir",
      "acaoTexto": "Confirmar com ServiceNow se ProductInventory.id é o productInventorySom."
    },
    {
      "id": "S28",
      "grupo": "response",
      "nome": "Demais campos do Asset",
      "tipo": "diversos",
      "linha": "Resposta exemplo",
      "bpmn": null,
      "valor": {
        "t": "nenhum",
        "de": "ignorados"
      },
      "fontes": {
        "US": {
          "v": "US01, US02 e US03 Premissa 3: 'Quando o VE acionar o Elastic Journey, ele vai passar o payload retornado na consulta de assets e o Elastic Journey vai \"interpretar\" o payload' · US03 Req01 a Req03: 'BFF/VE informa ao Elastic Journey resposta da Consulta de Asset'",
          "r": "diverge"
        },
        "PM": {
          "v": "Não lê"
        },
        "CURL": {
          "v": "Resposta exemplo: name, productOffering (id/name), rootItemId, systemOrigin (Salesforce), parentIdBRM, productFamily, documentType, idClienteSom, place.country, serviceInventory (velocidade_maxima, endCompleto, idArmario vazio, tecnologiaQualificada, double_coverage…)",
          "r": "so-fonte"
        },
        "QA": {
          "v": "Não lê"
        }
      },
      "leitura": "Nenhuma fonte usa estes campos. Só servem para seleção (productFamily, rootItemId) ou como candidatos ainda sem mapa: idArmario, vazio no exemplo, tem nome que lembra o geographicSite Cabinet da INT14, mas nenhuma fonte liga os dois. O exemplo também é incoerente: oferta \"Banda Larga 500MB\" com velocidade_maxima \"400Mb\". As US mandam o payload inteiro ao EJ; o START recebe só as chaves extraídas e nada destes campos chega à jornada. A decisão está no START R09.",
      "acao": "nada",
      "acaoTexto": ""
    },
    {
      "id": "S29",
      "grupo": "response",
      "nome": "Chaves do START sem origem no Asset (21 de 44)",
      "tipo": "START",
      "linha": "BPMN Node_Start (documentação) · Postman 01/01 · dossiê",
      "bpmn": "Obrigatórias no START, sem candidato na resposta: correlationId, requestTimestamp, issServiceNow, wfmGeographicSiteId, wfmAttendantId, wo_customerCategory, wo_contactName, wo_emailAddress, wo_mobileNumber, wo_phoneNumber, wo_workNumber, wo_orderId, wo_orderProtocol, wo_dateOfSale, wo_orderDetail, wo_latitude, wo_longitude, wo_addressReference, wo_detail, bd_relatedServiceSpecificationId, bd_relatedServiceId.",
      "valor": {
        "t": "start",
        "de": "sem origem identificada (3 são metadado ou configuração do chamador)"
      },
      "fontes": {
        "PM": {
          "v": "O Asset preenche 14 das 44 chaves. As outras saem de variáveis da collection; as wo_* vão vazias, porque a collection guarda woContactName, woOrderId… em camelCase e o START lê wo_contactName…",
          "r": "parcial"
        },
        "QA": {
          "v": "Asset preenche as mesmas 14; o resto vem do formulário ou dos padrões de laboratório (PADROES_INT14, iss fixo)",
          "r": "parcial"
        }
      },
      "leitura": "O START exige 44 chaves. Postman e QA tiram 14 do Asset. Outras 9 têm candidato na resposta, mas ninguém mapeia (S18 a S27, sem S24, que é opcional). Sobram 21 sem origem: contato, pedido, coordenadas, armário, atendente, classificação e ids de serviço do BD, além de 3 metadados que o próprio VE gera ou configura e que não dependem do Asset (correlationId, requestTimestamp e issServiceNow, que o motor põe no header iss da INT03). A planilha de variáveis registra que requestTimestamp não tem leitor no BPMN.",
      "acao": "decidir",
      "acaoTexto": "Fechar com VE, WFM e ServiceNow a origem das chaves de contato, pedido, coordenadas, armário, atendente e serviço do BD."
    }
  ]
});
