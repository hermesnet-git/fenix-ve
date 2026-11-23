---
name: raio-x-analise
description: Analisa uma integração da jornada fenix-ve-abertura-bd (FTAT-933, Abertura de BD pelo VE) no Raio-X, comparando o BPMN Camunda com DM (PreDataMapping), histórias de usuário, collection Postman, curl e tela de QA, e grava o resultado em Analise/raio-x/dados. Use para criar ou atualizar a planilha de uma integração (START, INT00 a INT18), revisar a análise quando o BPMN ou uma fonte mudar (DM novo, US nova, collection nova), preencher a coluna US ou ligar linhas ao DM, inclusive dividindo o trabalho entre agentes em segundo plano.
---

# Raio-X: análise de integração

O Raio-X (`Analise/raio-x/comparativo.html`) mostra, por integração, cada item da chamada (header, parâmetro, campo, status, regra) com o que o **BPMN** faz e o que cada fonte diz. Esta skill produz e mantém os arquivos `Analise/raio-x/dados/*.js` que alimentam a página.

## Antes de começar

1. Leia `Analise/raio-x/README.md`, [referencias/formato.md](referencias/formato.md) e [referencias/fontes.md](referencias/fontes.md).
2. Descubra o escopo: qual integração e o que mudou. Se um `PreDataMapping*.xlsx` for mais novo que `Analise/raio-x/dados/dm.js`, rode `node Analise/raio-x/gerar-dm.cjs` antes.
3. Rode `node Analise/raio-x/validar.cjs` para saber o estado de partida.

## Escolha o fluxo

| Pedido | Brief | Arquivos |
|---|---|---|
| Integração nova, ou refazer uma | [tarefa-integracao.md](referencias/tarefa-integracao.md) | o `dados/intNN-*.js` e a linha `<script>` no `comparativo.html` |
| Coluna US (história nova ou revisada) | [tarefa-us.md](referencias/tarefa-us.md) | os arquivos afetados |
| Ligar linhas ao DM, ou DM com versão nova | [tarefa-dm.md](referencias/tarefa-dm.md) | os arquivos que usam aquele DM |
| Uma ou poucas linhas (ex.: "revise o R10 da INT14") | os passos de `tarefa-integracao.md`, só nessas linhas | o arquivo da INT |

Cada brief é autocontido. Execute-o você mesmo ou entregue-o a um agente em segundo plano (veja abaixo).

## Regras que valem para tudo

- **O BPMN é a referência.** Leia primeiro o que ele faz; depois compare cada fonte contra ele. Sempre use a collection Postman mais recente.
- **Ids são a chave da revisão** (`INT14:R10` em `dados/revisao.js`): nunca renomeie, renumere ou reordene. Linha nova vai no fim do grupo, com o próximo número.
- **Não altere** BPMN, collection, DMs, US nem `revisao.js` durante a análise. Ajustes viram `acao` + `acaoTexto`; quem revisa decide pela página, e o lote é aplicado depois pela skill `raio-x-lote`.
- **Dados sensíveis:** nunca copie tokens, `Authorization`, o valor do header `iss`, senhas, CPF, telefone, e-mail ou nome real. Os CNPJs dos exemplos (DMs, curls, collection) são fictícios e podem ser citados. O `validar.cjs` procura padrões de CPF, telefone, e-mail e token, mas não substitui o cuidado.
- **Não feche decisões por suposição.** As decisões em aberto estão em `fontes.md`.
- **Escreva para quem revisa:** `leitura` explica o risco concreto em linguagem simples; `acaoTexto` é uma ação ou pergunta objetiva.

## Trabalho em paralelo: agentes em segundo plano

Quando houver vários arquivos (ex.: a coluna US em 9 integrações), divida o trabalho: um agente por grupo de arquivos, **sem dois agentes no mesmo arquivo**. Cada agente recebe o brief com `<ARQUIVOS>`/`<INT>` preenchidos e mais nada, porque o brief já tem o contexto.

| Ferramenta | Como disparar |
|---|---|
| Claude Code | Ferramenta de subagente (`Agent`, tipo `general-purpose`), um por grupo, todos na mesma mensagem para rodarem juntos em segundo plano. |
| GitHub Copilot | No modo agente do VS Code, delegue a um subagente (ferramenta de subagente / `#runSubagent`). Para rodar fora da máquina, crie uma issue com o brief e atribua ao Copilot: o cloud agent trabalha num branch e abre um PR. O cloud agent só vê o que já está no GitHub: dê push antes. |
| Codex | Em outro terminal, `codex exec "$(cat Analise/raio-x/skills/raio-x-analise/referencias/tarefa-us.md)"`, com os marcadores trocados (ou um arquivo de brief preenchido); ou uma tarefa na nuvem do Codex. |
| Cursor | Background Agent (nuvem) ou subagente no chat do agente, com o brief preenchido como prompt. |
| Sem suporte a agentes | Execute os briefs um depois do outro, na mesma sessão. |

Quando cada agente terminar:
1. Leia o resumo que ele devolveu (cada brief pede um formato curto).
2. Rode `node Analise/raio-x/validar.cjs` com todos os arquivos.
3. Confira com `git diff --stat` que nenhum arquivo fora da lista mudou.
4. Abra `comparativo.html` (ou peça ao usuário) e veja uma ou duas linhas de cada arquivo.

Não aceite o resultado sem esse conferir: o agente pode ter entendido errado com a mesma confiança com que acertou.

## Para fechar

- `node Analise/raio-x/validar.cjs` sem erro.
- Atualize `Analise/raio-x/README.md` se algo mudou para quem usa a página (fonte nova, regra nova de cor ou de coluna).
- Resuma ao usuário: o que mudou por integração, contagem de cores, as divergências principais e o que ficou para decisão.
- Commit só quando o usuário pedir. A branch de trabalho não é a `main`.
