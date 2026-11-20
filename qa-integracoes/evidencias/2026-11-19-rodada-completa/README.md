# RUN-005: reexecução completa dos cenários (19/11/2026)

Reexecução dos 49 cenários do [dossiê funcional](../../../Analise/dossie-abertura-bd-ve.html#cenarios) com três tipos de evidência:

- **Real pela jornada**: a fachada `ms-journey-v1` de pré-produção, chamada como BFF de teste; processo `fenix-ve-abertura-bd` v1 (versão técnica 19). Arquivos `fachada-*.json` e prints `tela-*.png`.
- **Real fora da jornada**: chamadas diretas às integrações pela página de QA, sem alterá-la ("Percorrer a jornada", 23:18 UTC). Arquivos `int-*.json` e print `00-mapa-integracoes-real.png`. A INT14 criou a WO `VE226f3fc6-a02f-4323-82ca-99188fc51698`, cancelada pela INT16 (HTTP 200).
- **Simulado**: scripts e gateways do próprio BPMN executados localmente com respostas reais desta rodada (INT11, INT14, INT06=500, INT18=500) ou simuladas quando o serviço está fora ou falta massa: [hibrida.groovy](hibrida.groovy) → [hibrida-resultados.json](hibrida-resultados.json) (18/18) e a bateria anterior [simulacao.groovy](../../../Analise/evidencias/2026-11-19-simulacao/simulacao.groovy) → [resultados.json](../../../Analise/evidencias/2026-11-19-simulacao/resultados.json) (42/42). Simulação não passa por Camunda, fachada, Kafka nem telas.

Massa: Asset da collection de 18/11 (HTTP 200, itens Internet e Acesso); designadores informados pelo usuário para "sem BD" e "com BD". Nenhum designador dos documentos (collection, curls, dossiês, mappings) tinha Massiva aberta no CPM. Dados pessoais, designadores e tokens foram suprimidos dos arquivos.

## Status das integrações nesta rodada

| INT | Resultado real | Uso |
| --- | --- | --- |
| INT00 Asset | 200 (2 itens) | Entradas da jornada |
| INT01 Massiva | 200 sem incidentes; pelo motor, 1 timeout em 6 consultas | Real |
| INT03 Consulta BD | 404 `code=60` (sem BD) e 200 com BD aberto | Real (URL temporária ServiceNow) |
| INT06 Diagnóstico | **500** | Real falhou; aceite e resultados simulados |
| INT10/INT08 callback Kafka | não executável sem INT06 | Simulado no BPMN |
| INT11 Horários | 200 (60 horários) | Real fora da jornada |
| INT14 Cria WO | 200 (WO criada) | Real fora da jornada |
| INT18 Abre BD | **500** | Real falhou; sucesso simulado |
| INT16 Cancela WO | 200 | Real fora da jornada |

## Resultado por cenário

Legenda: **Passou** (real pela jornada) · **Passou fora da jornada** (integração real + lógica do BPMN) · **Passou simulado** (não passou com valores reais; foi necessário simular) · **Falhou** · **Não testado**.

| Cenário | Resultado | Evidência e observação |
| --- | --- | --- |
| E-01 | Passou | [start](fachada-05-R1-start.json): 201 e tela inicial. A 1ª tentativa teve timeout do CPM ([evidência](fachada-03-R1-continuar.json)). |
| E-02 | Passou com ressalva | [400](fachada-01-E02-start.json) "Variáveis de entrada obrigatórias não informadas: [designador]", sem instância. Regra Q01 ainda pendente. |
| B-01 | Passou | [R1](fachada-06-R1-continuar.json): CPM 200, BD 404/code 60, tela de reinício. |
| B-02 | Passou simulado | Sem massa com Massiva. BPMN → `MASSIVA_ATRASO`. |
| B-03 | Passou simulado | Sem massa. BPMN → `MASSIVA_VISITA`. |
| B-04 | Passou simulado | Sem massa. BPMN → `MASSIVA`. |
| B-05 | Passou | [R4](fachada-21-R4-continuar.json): status `bloqueio` enviado pelo BFF de teste; tela de faturas, CTA `INVOICES`. [print](tela-07-atraso-pagamentos.png) |
| B-06 | Passou | [R5](fachada-24-R5-continuar.json): BD aberto, tela de visita com data/protocolo, CTA `TECH_VISIT`. [print](tela-08-visita-agendada.png) |
| B-07 | Não conclusivo | Mesmo resultado de B-06; não há como comprovar que o BD é preventivo. Regra/UX Q09 pendente. |
| B-08 | Passou simulado | Sem massa. BPMN → `MASSIVA_VISITA`; layout combinado a validar. |
| B-09 | Passou | Mesmo ramo de B-05 (R4). |
| B-10 | Não testado | Fora do escopo descrito. |
| B-11 | Divergente (simulado) | INT03 500 → BPMN mostra a tela "Não conseguimos verificar"; o dossiê diz para não criar tela de exceção. 404/code 60 continua sendo "sem BD" (conferido com resposta real). |
| B-12 | Divergente (real) | Timeout real do CPM pelo motor → "Não conseguimos verificar" ([evidência](fachada-03-R1-continuar.json)); o dossiê diz para não criar tela de exceção. |
| B-13 | Divergente (parcial) | Mesma tela de falha na 1ª consulta; dados parciais não exercitados. |
| T-01 | Passou | [R1](fachada-08-R1-voltou_sim.json) → "Sua internet voltou" → `COMPLETED`. [print](tela-04-internet-voltou.png) |
| T-02 | Passou | [R2](fachada-13-R2-voltou_nao.json) → preparo do diagnóstico. [print](tela-05-teste-conexao.png) |
| T-03 | Passou com ressalva | [R3](fachada-17-R3-nao_consigo.json) → preparo; regra Q05 (chamar HPSD já ou após "Continuar") pendente. |
| T-04 | Falhou (real) / Passou simulado | [R3](fachada-18-R3-continuar_diagnostico.json): INT06 500 → tela de falha ([print](tela-06-falha-int06.png)). Com aceite 201 simulado, BPMN → aguarda resultado. |
| T-05 | Passou com ressalva | [R2](fachada-14-R2-ir_inicio.json) `acaoTeste=inicio` → `COMPLETED`, sem INT06. O CTA da tela é `action.navigate`; o BFF real precisa enviar essa resposta. |
| T-06 | Passou | Textos e CTAs da tela de reinício. [print](tela-02-reinicie.png) |
| H-01 | Falhou (real) / Passou simulado | INT06 500. Aceite simulado leva à espera; callback/correlação Kafka não exercitados. |
| H-02 | Passou simulado | ID06 → `RESOLVIDO` → reinicie novamente. |
| H-03 | Passou simulado | ID07 → `RESOLVIDO`. |
| H-04 | Passou simulado | ID10 → `RESOLVIDO`. |
| H-05 | Passou simulado | Voltou = sim → sucesso. |
| H-06 | Passou simulado | Voltou = não → agendar visita. |
| H-07 | Passou simulado | ID09 → `SEM_ENERGIA`. |
| H-08 | Passou simulado | "Não consigo verificar" → agendar visita. |
| H-09 | Passou simulado | Voltou após verificar → sucesso. |
| H-10 | Passou simulado | Não voltou → pergunta de energia. |
| H-11 | Passou simulado | Sem energia → orientação de rede elétrica. |
| H-12 | Passou simulado | Com energia → agendar visita. |
| H-13 | Passou simulado | Outro ID → `PERSISTE` → agendar visita. |
| H-14 | Não testado | Depende de Kafka e de regra pendente (Q07). |
| W-01 | Passou fora da jornada | [INT11](int-04-INT11.json) 200 com 60 horários; BPMN → `DISPONIVEL` → escolha de horário. |
| W-02 | Passou fora da jornada | [INT14](int-05-INT14.json) 200 com WO; BPMN → WO criada → abre BD. WO cancelada ([INT16](int-07-INT16.json)). |
| W-03 | Não testado | Exige slot que se torna indisponível; regra Q04/Q09 pendente. |
| W-04 | Passou simulado | INT11 500 → tela de falha. |
| W-05 | Simulado, divergente | INT14 500 → o BPMN **tenta cancelar a WO** com o ID gerado pela jornada, embora a criação tenha falhado. Q05 pede cancelar só com ID válido. |
| W-06 | Passou simulado | HTTP 204 → `SEM_SLOT` → tela sem horários. O 204 foi visto em execução do usuário; nesta rodada a INT11 devolveu 200. UX pendente. |
| BD-01 | Passou simulado | INT18 real 500; com 201 simulado → visita agendada. Protocolo Q08 pendente. |
| BD-02 | Passou fora da jornada | [INT18](int-06-INT18.json) 500 real → BPMN → "Tentar abrir o BD de novo?". |
| BD-03 | Passou simulado | 500 real + 201 simulado → visita agendada. |
| BD-04 | Passou simulado | 500, 500, 201 → visita agendada. Regra Q06 pendente. |
| BD-05 | Passou simulado | 3 falhas → cancela WO; cancelamento real feito pela INT16 (200). |
| BD-06 | Passou simulado | Recusa após falha → cancela WO; INT16 real 200. |
| BD-07 | Não testado | Idempotência/reconciliação não definida (Q06). |
| BD-08 | Não testado | Falha do cancelamento não foi provocada; regra pendente. |

## Totais (49 cenários, uma categoria cada)

| Resultado | Qtd. | Cenários |
| --- | --- | --- |
| Passou com valores reais pela jornada | 11 | E-01, E-02, B-01, B-05, B-06, B-09, T-01, T-02, T-03, T-05, T-06 (E-02, T-03 e T-05 com ressalva) |
| Passou com integração real fora da jornada | 3 | W-01, W-02, BD-02 |
| Passou só com simulação | 23 | B-02, B-03, B-04, B-08, H-02 a H-13, W-04, W-06, BD-01, BD-03, BD-04, BD-05, BD-06 |
| Falhou com valores reais (passou simulado) | 2 | T-04, H-01 (INT06 500) |
| Divergente ou não conclusivo | 5 | B-07, B-11, B-12, B-13, W-05 |
| Não testado | 5 | B-10, H-14, W-03, BD-07, BD-08 |

## Limites

- Os encerramentos foram enviados pelo BFF de teste com avanço explícito; os CTAs das telas finais são `action.navigate`.
- A INT03 usa a URL temporária ServiceNow (QA-BPMN-11); não homologa o MS Trouble Ticket.
- Os prints são do renderizador local a partir das respostas sanitizadas, não do app VE.
- Não foi publicado evento no Kafka nem alterada configuração do ambiente, página de QA, collections ou código.
