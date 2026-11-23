---
name: raio-x-lote
description: Aplica o lote de ajustes revisados no Raio-X da jornada fenix-ve-abertura-bd (FTAT-933) — o arquivo Analise/raio-x/dados/saidas/lote-ajustes-AAAA-MM-DD.md gerado pela página — no BPMN e/ou na collection Postman, e marca cada item como aplicado em Analise/raio-x/dados/revisao.js. Use quando pedirem para aplicar o lote, aplicar as revisões do Raio-X ou ajustar o BPMN/collection conforme a revisão. Não trata as pendências de documentação, que são só informativas.
---

# Raio-X: aplicar o lote de ajustes

Quem revisa marca cada linha no Raio-X (status `revisado` + onde ajustar + anotação) e clica em **Lote de ajustes**. A página grava `Analise/raio-x/dados/saidas/lote-ajustes-AAAA-MM-DD.md`, com as instruções e, por item, a anotação e o contexto da linha. Esta skill aplica esse lote.

## Passos

1. **Pegue o lote.** Use o arquivo que o usuário indicar, ou o mais recente em `Analise/raio-x/dados/saidas/lote-ajustes-*.md`. Siga as "Instruções para o agente" do topo: elas valem acima desta skill se forem diferentes.
2. **Confira se o item ainda está pendente.** Em `Analise/raio-x/dados/revisao.js`, o item (`"INT14:R10"`) precisa estar com `status: "revisado"`, e o destino precisa incluir `bpmn` ou `postman`. Se estiver `aplicado`, pule.
3. **Para cada item:**
   - Sem anotação, anotação ambígua, ou contexto que não bate com o arquivo atual (o BPMN já mudou)? **Não aplique.** Anote o item e o motivo.
   - **BPMN** (`fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn`): ache o nó citado no contexto (`Node_*`) e faça **só** o que a anotação pede. Preserve ids de elementos, indentação e o restante do XML. Não toque no `- backup.bpmn`.
   - **Collection** (`postman/fenix-ve-jornada-preprod-<data mais recente>.postman_collection.json`): altere o request da INT citada. Se a mudança pedir valor de variável de ambiente, use `{{variavel}}` e nunca o valor real.
4. **Valide o que mudou:**
   - BPMN bem formado: `xmllint --noout <bpmn>` ou, no Windows, `powershell -c "[xml](Get-Content -Raw '<bpmn>') > $null"`.
   - Collection: `node -e "JSON.parse(require('fs').readFileSync('<arquivo>','utf8'))"`.
   - Mostre ao usuário o `git diff` dos arquivos ajustados.
5. **Commit dos ajustes** (o usuário já pediu o lote; se tiver dito para não commitar, pare aqui e diga o que falta): uma mensagem que liste os itens, por exemplo `BPMN: lote Raio-X 2026-11-22 (INT03:R04, INT14:R10)`.
6. **Marque os aplicados** em `Analise/raio-x/dados/revisao.js`, só nos itens que você aplicou:
   ```json
   "INT14:R10": { ...o que já existia..., "status": "aplicado", "aplicadoEm": "<ISO agora>", "em": "<o mesmo ISO>", "commit": "<hash curto do passo 5>" }
   ```
   - **Atualize `em`:** a página guarda o registro de `em` mais recente. Sem isso, uma aba aberta com a revisão antiga desfaz o `aplicado`.
   - Preserve o comentário do topo e o formato `RAIOX.revisao({...});`. Não mexa em outros itens.
   - Confira: `node Analise/raio-x/validar.cjs`. Depois faça um segundo commit (`Raio-X: marca aplicados do lote 2026-11-22`).
7. **Responda** com: itens aplicados (id, arquivo e o que mudou, em uma linha), itens não aplicados com o motivo, e os commits.

## Regras

- Faça só o que a anotação pede. Achados novos vão para a resposta, não para o arquivo.
- Nunca copie tokens, o valor do header `iss`, senhas nem dados pessoais para nenhum arquivo.
- Não altere os arquivos de dados da análise (`dados/int*.js`, `start-*.js`): depois de aplicar, o usuário decide se reanalisa a linha (skill `raio-x-analise`).
- Itens com destino `doc` não entram aqui: eles saem em `pendencias-documentacao-*.md`, para o time que mantém a documentação.
- Trabalhe na branch atual. Nunca dê push sem o usuário pedir.

## Em segundo plano

O lote cabe num único agente, porque todos os itens de BPMN mexem no mesmo arquivo. Para rodar fora da sessão, entregue a um agente o prompt "Use a skill raio-x-lote para aplicar `Analise/raio-x/dados/saidas/<lote>.md`" (subagente no Claude Code, `codex exec`, Background Agent no Cursor, ou issue atribuída ao Copilot cloud agent depois do push do lote e da revisão). Não rode dois agentes de lote ao mesmo tempo.
