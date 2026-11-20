# RUN-004: cobertura complementar em pré-produção

Rodada de 19/11/2026 pela fachada, com a mesma jornada e versão técnica 19 da [RUN-003](../2026-11-19-rodada-inicial/README.md). O BFF foi exercido por chamadas de teste; a navegação no aplicativo VE não foi executada. As respostas JSON são sanitizadas e preservam HTTP, horários, estado, formulário e variáveis relevantes; dados pessoais, corpos de integração e credenciais foram suprimidos. Os PNGs são capturas do renderizador local, não do aplicativo.

O usuário forneceu designadores para os casos sem BD e com BD. As entradas restantes foram reaproveitadas da massa anterior; para testar o bloqueio financeiro, o BFF de teste enviou `productStatus=bloqueio`, sem afirmar que o Asset real estivesse bloqueado. A consulta de BD usou o endpoint temporário ServiceNow, não o MS Trouble Ticket. O 404 com `code=60` foi tratado como consulta concluída sem BD aberto; a origem documental está nos dossiês e no registro da RUN-003.

## Cobertura da matriz

| Cenário | Resultado ou bloqueio | Evidência / próximo passo |
| --- | --- | --- |
| E-01 | Observado: criação 201 e tela inicial; consultas após avançar. BFF real não exercitado. | [RUN-003](../2026-11-19-rodada-inicial/README.md) |
| E-02 | Observado: start sem designador recebeu 400, indicando variável obrigatória ausente, sem ID de instância. Não aprovar até fechar a regra de entrada. | [Resposta](01-start_sem_designador.json) |
| B-01 | Observado: sem Massiva/BD e status ativo chegou ao reinício; INT03 na URL temporária. | [RUN-003](../2026-11-19-rodada-inicial/README.md) |
| B-02 | Não executado: falta massa com Massiva ativa e sem BD. | Encontrar designador e estado financeiro apropriados. |
| B-03 | Não executado: falta massa com Massiva ativa e BD/visita. | Confirmar dados da visita e combinação. |
| B-04 | Não executado: falta massa com somente Massiva ativa. | Obter designador com incidente aberto. |
| B-05 | Ramo observado: `productStatus=bloqueio` enviado pelo BFF, sem Massiva e com 404/code 60 para BD; tela de faturas e CTA `INVOICES`. | [Resposta](13-verifica_bloqueio_retry.json), [print](b05-b09-atraso.png) |
| B-06 | Ramo observado: Massiva 200 sem ocorrência, consulta BD 200 com BD aberto e tela de visita com previsão/protocolo e CTA `TECH_VISIT`. | [Resposta](10-verifica_combd.json), [print](b06-visita-agendada.png) |
| B-07 | Não aprovado: houve BD aberto, mas não foi comprovado que a massa represente BD preventivo/pró-ativo; regra/UX continua pendente. | Confirmar classificação do BD e decisão Q09. |
| B-08 | Não executado: falta massa com BD e Massiva simultâneos. | Confirmar layout esperado e condições da massa. |
| B-09 | Mesmo ramo técnico de B-05 observado com status de bloqueio enviado pelo BFF. Não comprova origem real do status no Asset. | [Resposta](13-verifica_bloqueio_retry.json), [print](b05-b09-atraso.png) |
| B-10 | Não executado: combinações fora do escopo descrito. | Aguardar regra aprovada. |
| B-11 | Não executado: não ocorreu falha da consulta BD; não foi provocada indisponibilidade. 404/code 60 é consulta sem BD, não falha. | Observar falha autorizada ou natural. |
| B-12 | Divergência observada: duas consultas Massiva pelo motor expiraram e apresentaram tela de falha, embora a experiência não esteja especificada. | [Resposta](03-verifica_bloqueio.json), [print](b12-timeout-massiva.png) |
| B-13 | Parcial: timeout na primeira consulta foi observado; falha da segunda consulta e dados parciais não foram exercitados. | [Resposta](06-verifica_bloqueio_sembd.json) |
| T-01 | Tela de sucesso e conclusão por avanço explícito observadas; ausência de HPSD não auditada no histórico. | [RUN-003](../2026-11-19-rodada-inicial/README.md) |
| T-02 | Observado: resposta "Não" levou ao preparo de diagnóstico. | [RUN-003](../2026-11-19-rodada-inicial/README.md) |
| T-03 | Observado: "Não consigo reiniciar" levou ao preparo; ainda depende da decisão sobre chamada imediata ou após "Continuar". | [Resposta](17-nao_consigo_reiniciar.json) |
| T-04 | Falhou para a condição esperada: após "Continuar", a INT06 retornou 500 e a jornada exibiu falha em vez de espera Kafka. | [Resposta](18-solicita_diagnostico.json), [print](t04-falha-int06.png) |
| T-05 | Avanço explícito encerrou a instância, mas o CTA da tela é `action.navigate`; encerramento pelo BFF real e ausência de chamada HPSD seguem pendentes. | [RUN-003](../2026-11-19-rodada-inicial/README.md) |
| T-06 | Instruções e CTAs observados; ambos os ramos foram exercitados nas rodadas. | [Tela](../2026-11-19-rodada-inicial/02-reinicie-render.png), [T-03](17-nao_consigo_reiniciar.json) |
| H-01 | Bloqueado: INT06 retornou 500 antes da espera de callback. | Retestar aceite e correlação após correção. |
| H-02, H-03, H-04 | Não executados: faltam callback real e massa controlável para IDs 06, 07 e 10. | Restabelecer INT06 e combinar massa HPSD. |
| H-05, H-06 | Não executados: dependem de resultado resolvido e resposta do cliente. | Restabelecer caminho H-02/03/04. |
| H-07, H-08, H-09, H-10, H-11, H-12 | Não executados: dependem de callback ID09 e das respostas do cliente. | Obter massa de diagnóstico ID09. |
| H-13 | Não executado: depende de callback com outro ID de resultado. | Obter massa de problema persistente. |
| H-14 | Não executado: faltam condições controladas e definição de correlação, timeout e duplicidade. | Alinhar contrato e teste com responsáveis Kafka/HPSD. |
| W-01 | Não executado pela jornada: não alcançou WFM após a falha da INT06. | Restabelecer diagnóstico; consulta isolada histórica não homologa o fluxo. |
| W-02 | Não executado: diagnóstico impede alcançar agendamento; payload INT14 do BPMN diverge do WFM segundo o dossiê de integrações. | Alinhar integração e massa antes de criar WO. |
| W-03 | Não executado: depende de slot indisponível e regra/UX pendente. | Definir resultado e massa controlada. |
| W-04 | Não executado: jornada não alcançou consulta WFM e não foi provocada falha. | Testar com condição controlada autorizada. |
| W-05 | Não executado: jornada não alcançou criação de WO; regra de falha/cancelamento pendente. | Confirmar contrato e estado da WO. |
| W-06 | Não executado: jornada não alcançou consulta WFM nem houve resposta 204. | Obter massa sem horários e definição UX. |
| BD-01 | Não executado: jornada não alcançou criação de WO/BD; INT18 informada indisponível. Protocolo pendente. | Restabelecer integrações e homologar contrato. |
| BD-02, BD-03, BD-04 | Não executados: dependem de WO válida, INT18 e controle de falhas/sucesso. | Definir tentativas e massa segura. |
| BD-05, BD-06 | Não executados: dependem de WO válida, falhas de BD e cancelamento. | Planejar reconciliação e limpeza com WFM. |
| BD-07, BD-08 | Não executados: idempotência/reconciliação e falha do cancelamento não estão definidas. | Alinhar regras antes de simular timeout ou falha. |

## Observações da rodada

- E-02 foi um start inválido; a fachada retornou 400 sem ID de instância. Não há evidência independente do histórico do motor comprovando ausência de conectores.
- Dois avanços tiveram timeout no CPM e foram concluídos após a tela de falha. Uma consulta direta ao mesmo CPM para o designador sem BD respondeu 200, e os avanços posteriores também funcionaram. Não se pode concluir indisponibilidade geral nem a causa do timeout. [Resposta direta](08-consulta_cpm_direta.json).
- As quatro consultas diretas aos designadores de referência retornaram HTTP 200 sem Massiva aberta: [resumo](massa-massiva.json). Isso não controla o estado futuro das massas.
- A tela de visita exibiu previsão e protocolo; a classificação do BD como preventivo não foi comprovada. As telas de visita e faturas repetem o texto de cabeçalho, ponto visual para revisão.
- As cinco instâncias criadas nesta rodada terminaram `COMPLETED`. Os avanços para encerramento foram enviados explicitamente pelo BFF de teste, enquanto os CTAs das telas são de navegação; a integração real do canal permanece por validar.
- Não foram feitos POST de WO ou BD, nem publicação artificial de eventos Kafka. O histórico de execução não foi auditado para provar a ausência de todas as chamadas downstream.