# RUN-003: cenários iniciais em pré-produção

Rodada de 19/11/2026, conduzida pela fachada como BFF de teste. A massa veio da consulta de Asset da collection de 18/11: HTTP 200, com itens Internet e Acesso. O status do produto selecionado era `Ativo`; dados pessoais e identificadores do asset foram suprimidos das evidências.

- Processo: `fenix-ve-abertura-bd`, tag `v1`, versão técnica 19.
- Instância do caminho "Sim": `7a75ede6-e463-11f1-8248-06dfec022e82`.
- Instância do caminho "Não": `79693bfa-e467-11f1-8248-06dfec022e82`.
- A consulta de Massiva retornou 200; a consulta de BD retornou 404 com `code=60` nas duas instâncias. O motor registrou consultas bem-sucedidas, sem Massiva e sem BD. O código foi verificado no retorno bruto em memória; o corpo foi suprimido no JSON salvo.
- A INT03 estava configurada para a URL temporária do ServiceNow. Decisão funcional confirmada em 19/11: HTTP 404 com `code=60` é consulta concluída sem BD aberto; outros 404 não recebem automaticamente esse tratamento. O [PreDataMapping Consulta BD v2.0](../../../../PreDataMapping%20FTAT-933%20-%20Consulta%20de%20BD%20-%20v2.0.xlsx), aba `MS T T x ServiceNow - Resp ERRO`, apresenta HTTP 404 em K8, a mensagem "No Record found for given filter criteria" em K16 e o exemplo com `code: 60` em B22. A planilha registra o retorno downstream; a regra funcional foi confirmada pelo responsável. Esta rodada não homologa a consulta pelo MS Trouble Ticket.

## Resultados

| Cenário | Resultado observado | Evidência |
| --- | --- | --- |
| E-01 | A fachada criou as duas instâncias com HTTP 201 e retornou `Node_Inicio` com SDUI; as consultas iniciaram após o primeiro avanço. Não foi testado o BFF real do VE. | [Início](01-inicio-response.sanitizado.json), [tela](01-inicio-render.png) |
| B-01 | Sem Massiva e sem BD segundo as variáveis retornadas; produto `Ativo`; a jornada avançou para `Node_Reinicie`. A conclusão depende da ressalva sobre a INT03. | [Após consultas](02-continuar_inicio-response.sanitizado.json), [tela](02-reinicie-render.png) |
| T-06 | Tela exibiu retirar da tomada, aguardar 30 segundos, religar, "Já reiniciei" e "Não consigo reiniciar". O ramo "Não consigo reiniciar" não foi executado. | [Tela](02-reinicie-render.png), [resposta](02-continuar_inicio-response.sanitizado.json) |
| T-01 | "Já reiniciei" e "Sim" levaram à tela de sucesso; um avanço adicional com respostas vazias concluiu a instância. A interação real do CTA de navegação ainda não foi comprovada. | [Pergunta](03-voltou-reinicio-render.png), [sucesso](04-internet-voltou-render.png), [conclusão](05-encerrar_sucesso-response.sanitizado.json) |
| T-02 | "Já reiniciei" e "Não" levaram à tela de preparo, com botão "Continuar". Não se acionou esse botão. | [Resposta](09-voltou_nao-response.sanitizado.json), [tela](05-preparo-diagnostico-render.png) |
| T-05 | Um avanço explícito com `acaoTeste=inicio` retornou `COMPLETED`; não há variáveis da tarefa INT06 na resposta. Porém o SDUI do botão "Ir para o início" descreve `action.navigate` para `TECH_SUPPORT`, e não o envio dessa resposta. O comportamento real do BFF e a ausência de chamada devem ser confirmados no histórico de execução. | [Tela e ação SDUI](09-voltou_nao-response.sanitizado.json), [conclusão](10-sair_preparo-response.sanitizado.json) |

## Evidências e limites

Os dez arquivos `*-response.sanitizado.json` contêm código HTTP, horário UTC e resposta da fachada por etapa. São cópias sanitizadas, não os corpos originais completos: variáveis e contexto pessoais foram suprimidos, inclusive as respostas brutas das integrações. Os cinco PNGs mostram o painel do renderizador SDUI v3 a partir das respostas sanitizadas, não uma captura do aplicativo VE.

Na tela final de sucesso, o CTA também é `action.navigate` (`HOME_APP`); o encerramento desta rodada foi produzido por um avanço explícito de teste. Os validadores auxiliares do renderizador podem apontar campos ausentes devido à sanitização e à business key de laboratório. Não foram executadas chamadas deliberadas à INT06, INT14 ou INT18 nesta rodada; a ausência efetiva de chamadas downstream não foi auditada em logs ou histórico de execução.