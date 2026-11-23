# Tarefa: montar ou atualizar a planilha de uma integração no Raio-X

> Brief autocontido para um agente (subagente ou agente em segundo plano). Quem delega troca `<INT>` e `<ARQUIVO>` e acrescenta o que mudou (ex.: "o DM de WO subiu para v2.3").

Repositório: raiz do `fenix-ve` (Bash ou Node; no Windows, Git Bash). Escreva em português do Brasil.

A página `Analise/raio-x/comparativo.html` compara, linha a linha, o BPMN da jornada Camunda 7 `fenix-ve-abertura-bd` (FTAT-933, Abertura de BD pelo canal VE) com DM, US, Postman, curl e a tela de QA. Sua tarefa: **<INT>**, arquivo `Analise/raio-x/dados/<ARQUIVO>`.

## Leia antes
1. `Analise/raio-x/README.md`: o que a página mostra.
2. `Analise/raio-x/skills/raio-x-analise/referencias/formato.md`: o formato de cada campo e o significado de `r` e `acao`.
3. `Analise/raio-x/skills/raio-x-analise/referencias/fontes.md`: onde está cada fonte, qual DM é de qual INT e as armadilhas.
4. Um arquivo pronto parecido, como modelo de tom e detalhe (ex.: `dados/int03-consulta-bd.js`).

## Passos
1. **BPMN primeiro.** Ache os nós da integração. Anote exatamente o que o BPMN monta (método, URL, headers, query, body) e de onde vem cada valor (`valor.t`/`de`), como trata a resposta (status, campos lidos, variáveis gravadas) e o que decide depois (gateways, timers, retentativas).
2. **Liste as linhas.** Junte tudo o que o BPMN usa e tudo o que o DM documenta para a chamada: requisição (método e endpoint, cada header, parâmetro e campo do body), resposta (cada status e cada campo) e regras (timeout, retentativa, decisão). Linhas que só o DM tem entram com `bpmn: null`.
3. **Compare cada fonte** com o BPMN e preencha `fontes.X = { v, r }`. Se a fonte não traz o item, não crie a chave. Só inclua uma fonte em `fontes` do arquivo depois de lê-la.
4. **DM linha a linha:** para cada linha com `fontes.DM`, grave `dm: [{ aba, linha }]` com a linha real do Excel, tirada de `dados/dm.js`. Veja `tarefa-dm.md`.
5. **US:** siga `tarefa-us.md` para `fontes.US` e para as linhas `U##` do grupo `us`.
6. **Leitura e ação.** Em `leitura`, explique em linguagem simples o que bate, o que não bate e o risco concreto (o que quebra, para quem). Escolha `acao` (nada, decidir, fonte, bpmn) e escreva `acaoTexto` como uma ação ou pergunta objetiva.
7. **START:** cada variável tem também `valores` (os valores possíveis: domínio do DM, exemplos, o que o BPMN testa) e `valor.de` com a origem (canal, Asset/INT00, tela, configuração).
8. **Arquivo novo:** acrescente o `<script src="dados/<ARQUIVO>">` em `comparativo.html`, junto dos outros.

## Regras
- Altere **só** `<ARQUIVO>` (e, se for novo, a linha do `<script>`). Não toque em BPMN, collection, documentos, `dm.js`, `revisao.js` nem em outros arquivos de dados.
- Arquivo existente: não renomeie, não renumere e não reordene ids. Linhas novas vão no fim do seu grupo, com o próximo número livre.
- Nunca copie tokens, o valor do header `iss`, senhas nem dados pessoais. Descreva o formato ou use zeros.
- Decisões em aberto (ver `fontes.md`) continuam `decidir`.
- Valide: `node Analise/raio-x/validar.cjs <ARQUIVO>` precisa terminar com 0 erro.

## Resposta final (até ~20 linhas)
- Linhas por grupo e contagem de cores (verde, amarela, vermelha).
- As divergências mais importantes, uma por linha, com o id.
- Fontes que você não conseguiu ler e o motivo.
- O que ficou como pergunta para a área (`decidir`).
