# Tarefa: ligar cada linha do Raio-X à linha exata do DM

> Brief autocontido para um agente (subagente ou agente em segundo plano). Quem delega troca `<ARQUIVOS>` pela lista de arquivos de dados.

Repositório: raiz do `fenix-ve` (Bash ou Node). Escreva em português do Brasil. Arquivos da sua lista: **<ARQUIVOS>** (em `Analise/raio-x/dados/`).

Na aba DM do painel, a página mostra o conteúdo da linha do DM ligada a cada linha do Raio-X: aba, número da linha no Excel, colunas, Domínio/Máscara e Exemplo(s). Para isso, cada linha (`campos[]`) precisa de uma referência explícita.

## Índice dos DMs
`Analise/raio-x/dados/dm.js` é gerado por `node Analise/raio-x/gerar-dm.cjs` a partir dos `PreDataMapping*.xlsx` da raiz. Se algum xlsx for mais novo que o `dm.js`, rode o gerador antes. Formato: `RAIOX.dm({ "<arquivo.xlsx>": { "<aba>": { cab: {letra: título}, linhaCab, oculta?, linhas: [[linhaNoExcel, {letra: valor}]] } } })`.

Para listar uma aba:
```
node -e "global.RAIOX={dm(d){this.d=d}};require('./Analise/raio-x/dados/dm.js');const a=RAIOX.d['<arquivo>']['<aba>'];console.log(a.cab);for(const [n,c] of a.linhas)console.log(n,JSON.stringify(c))"
```
Para ver as abas: `Object.keys(RAIOX.d['<arquivo>'])`.

## O que gravar
Em cada linha que tem `fontes.DM` (e só nelas): `"dm": [ { "aba": "<nome exato da aba>", "linha": <linha no Excel> }, … ]`.

- `arquivo`: o padrão é o `arquivo` da fonte DM em `fontes`. Inclua `"arquivo"` só quando a referência for de outro DM (ex.: os `outros` da fonte DM no START).
- Referencie a linha do campo em cada aba relevante (Request/Response, OK/ERRO, versões v1/v2). Se o exemplo do campo estiver numa célula "Exemplos" de outra linha (um bloco JSON de exemplo), referencie essa linha também.
- Linhas agregadas ("Método e endpoint", "HTTP 200 / 206", "Demais campos…"): referencie a linha que traz o endpoint ou o status. Se nenhuma linha do DM representa a linha do Raio-X, não crie `dm`.
- Se o resumo em `fontes.DM.v` estiver errado (obrigatoriedade, domínio ou exemplo diferente da planilha), corrija o `v`, recalcule o `r` contra o BPMN e cite a mudança na resposta. Não mude `acao` sem divergência real.
- Toda aba `VE x Camunda…` de qualquer DM descreve a entrada do canal: confira exemplos, campos fixos e domínios contra as variáveis do START.

## Regras
- Altere **só** os arquivos da sua lista. Não toque em `dm.js`, `comparativo.html`, BPMN nem documentos.
- Não renomeie, não renumere e não reordene ids.
- Nada de tokens, `iss`, senhas ou dados pessoais nos `v` que você reescrever: o `dm.js` já vem mascarado, mas confira.
- Valide cada arquivo: `node Analise/raio-x/validar.cjs <arquivo>` (ele confere se toda referência existe no índice).

## Resposta final (até ~10 linhas por arquivo)
Linhas com DM e quantas ganharam `dm`, quais ficaram sem referência e por quê, e quais `fontes.DM.v` você corrigiu.
