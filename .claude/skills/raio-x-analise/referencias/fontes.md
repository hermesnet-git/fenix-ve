# Fontes da análise (FTAT-933, Abertura de BD pelo VE)

Caminhos a partir da raiz do repositório. O BPMN é a **referência**: as outras fontes são comparadas contra ele.

| Fonte | Onde | Como ler |
|---|---|---|
| **BPMN** | `fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn` | XML do Camunda 7. Procure o `Node_*` da integração: `camunda:connector` / `camunda:inputOutput` (url, method, headers, payload), scripts Groovy/JS de montagem e tratamento, `conditionExpression` dos gateways seguintes e timers (`timeDuration`). Ignore o `- backup.bpmn`. |
| Telas SDUI (TELA) | `fenix-ve-abertura-bd-v1/screens.json` | Textos e botões das telas que vêm antes ou depois da chamada. |
| **DM** | `PreDataMapping FTAT-933 - *.xlsx` (raiz) | Não abra o xlsx linha a linha: use o índice `Analise/raio-x/dados/dm.js`, gerado por `node Analise/raio-x/gerar-dm.cjs`. Se um xlsx mudou, rode o gerador antes. A linha do índice é a mesma do Excel. |
| **US** | `Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/` (13 .docx) | `unzip -p "<arquivo>.docx" word/document.xml` e tire as tags. Leia critérios de aceite, observações e premissas, não só o título. |
| **PM** | `postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json` | Sempre a collection **mais recente** (hoje, a de 18/11); as outras na pasta são antigas. Veja request, pre-request e testes (`pm.test`). |
| **CURL** | `postman/curls/INTnn.sh` | Particularidades: sem curl para INT10 e INT18; `INT00-response.jsonc` é a resposta de exemplo do Asset; `INT11.json` não é curl, é uma resposta de troubleTicket (INT03); `INT08.sh` é igual ao `INT14.sh`; o de INT16 se chama `INT016.sh`. |
| **QA** | `qa-integracoes/fenix-ve-integracoes.html` | Objeto `ESPECIFICACOES` (uma spec por id de INT): método, URL, headers, body e status esperado. Evidências reais em `qa-integracoes/evidencias/2026-11-19-*` (`int-NN-INTxx.json`, `fachada-*.json`). |
| DFT | `DFT_FTAT933_Jornada_EndToEnd_v1.2.pptx` | Visão de arquitetura: passo a passo e inventário de integrações. `unzip -p` em `ppt/slides/slideN.xml`. |
| OAS | `Trouble Ticket Management-V1.1.0.json`, `Gtw Redes Service Test Management-V1.0.0-API.json`, `customer-problem-management-v1.preprod.openapi.yaml` | Contrato da API de destino, quando existir. |

## Qual DM descreve cada integração

| INT | DM | Observação |
|---|---|---|
| START | `Abertura de WO e agendamento - v2.2` (fonte DM do arquivo) + `Consulta de Massivas - v2.1` (em `outros`; refs com `arquivo`) | Só o DM de Massivas (abas `VE x Camunda - Request/Response`) descreve o START. A aba de mesmo nome do DM de WO descreve o `/advance` da escolha de horário (INT14). |
| INT00 | — | Fora da jornada. A requisição é do canal (DM "Não se aplica"); só a resposta interessa, comparada com a entrada VE → Camunda dos DMs. |
| INT01 | `Consulta de Massivas - v2.1` | |
| INT03 | `Consulta de BD - v2.0` | O BPMN chama o gateway do ServiceNow; o DM descreve o MS Trouble Ticket. |
| INT06 / INT10 | `Diagnóstico Automático - v2.0` | |
| INT11 | `Consulta de Slot WFM (Revalidação) - v2.2` | |
| INT14 | `Abertura de WO e agendamento - v2.2` | |
| INT16 | `Cancelamento  de WO e agendamento - v1.1` (dois espaços no nome) | |
| INT18 | `Abertura de BD - v2.1` | |

Qualquer DM com aba `VE x Camunda…` descreve a entrada do canal na jornada: confira exemplos, campos fixos e domínios contra o START.

## Armadilhas

- **Nomes com acento trocado no disco:** "Histo╠ürias", "Diagno╠üstico", "Revalidac╠ºa╠âo" (marcas NFD lidas em cp437). Use `ls` com curinga para achar o arquivo. Nos dados, grave o nome **correto**: a página e o `gerar-dm.cjs` fazem a conversão.
- **Arquivos temporários do Office** (`~$*.xlsx`, `~$*.pptx`) não são fontes.
- **Nunca leia nem copie** `postman/token`, valores de `Authorization`/Bearer, o valor do header `iss` (constante `ISS_SERVICENOW`), senhas, nem dados pessoais (CPF, CNPJ, telefone, e-mail, nome) que aparecem em curls, collection, evidências, US e DMs. Descreva o formato ("CNPJ, 14 dígitos sem máscara") ou use zeros.
- `issServiceNow` é entrada legítima do START: o motor a usa no header `iss` da INT03. Não recomende remover variáveis de configuração do START sem perguntar como o motor as usa.
- **Decisões em aberto** continuam `acao: 'decidir'` até a área responder: P08 (origem dos dados do WFM), designador 013 vs 069, `productStatus` "bloqueio" vs status do Asset. Cite o trecho que ajuda, sem fechar a decisão por suposição.
