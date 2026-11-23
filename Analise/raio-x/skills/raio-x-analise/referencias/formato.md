# Formato dos arquivos de dados do Raio-X

Um arquivo por integração em `Analise/raio-x/dados/`, com o nome `intNN-nome-curto.js` (ou `start-iniciar-jornada.js`). Cada arquivo tem um comentário no topo e uma chamada só:

```js
/*
 * Raio-X · INT03 Consulta de BD (bilhete de defeito) aberto
 * BPMN (referência) × fontes. Formato documentado em ../README.md.
 * valor.t = de onde o BPMN tira o valor: start | tela | integracao | gerado | fixo | config | resposta | nenhum
 */
RAIOX.registrar({ id, secao?, ordem, nome, nomeLongo, rota, endpoint, nos, resumo, fontes, grupos, campos });
```

Para a página carregar uma integração nova, acrescente `<script src="dados/ARQUIVO.js"></script>` em `comparativo.html`, junto dos outros `dados/*.js`, na ordem da barra lateral. O `validar.cjs` acusa o arquivo que faltar.

## Cabeçalho

| Campo | O que é |
|---|---|
| `id` | `INT03`, `START`… Chave da revisão: nunca mude depois de revisado. |
| `secao` | `jornada` (padrão) ou `fora` (INT00: o canal consulta antes do START). |
| `ordem` | Posição na barra lateral. |
| `nome` / `nomeLongo` | Nome curto da barra e nome completo do título. |
| `rota` | Caminho da chamada (ex.: `Elastic Journey → Trouble Ticket Management v1 → API Gateway → ServiceNow`). |
| `endpoint` | Método e URL **como o BPMN monta**, com as variáveis de ambiente (`${FENIX_VE_TT_BASE_URL}`). |
| `nos` | Nós do BPMN envolvidos, separados por ` · ` (`Node_ConsultaBD · Node_TrataBD · …`). |
| `resumo` | Uma ou duas frases: para que serve a chamada na jornada. |

## `fontes`: as golden sources lidas nesta integração

```js
{ id: 'DM', nome: 'Datamapping v2.0', curto: 'DM', contrato: true,
  arquivo: 'PreDataMapping FTAT-933 - Consulta de BD - v2.0.xlsx',   // caminho a partir da raiz do repo
  detalhe: 'abas Camunda x MS Request/Response …',
  outros: [{ arquivo: '…xlsx', detalhe: '…' }] }                   // opcional: outros arquivos da mesma fonte
```

- ids usados: `US`, `DFT`, `DM`, `OAS`, `CURL`, `PM`, `TELA`, `QA`. Colunas da tabela: `BPMN DM US PM CURL QA`. `DFT`, `OAS` e `TELA` só aparecem nas abas do painel.
- Uma fonte que **não está** em `fontes` aparece como "Não analisado" em todas as linhas. Só inclua a fonte depois de lê-la.
- `arquivo` da US é o nome da pasta como ele deve ser (com acento correto), terminado em `/`. Copie de um arquivo existente (por exemplo `int01-consulta-massiva.js`).

## `grupos`

`{ id, nome, sub }`. Os ids são livres, mas siga os já usados: `request` (Requisição), `response` (Resposta) e `us` (`Regras das histórias (US)`, sub `regras declaradas nas US sem linha própria`), sempre por último. Grupos próprios da chamada também valem: `gatilho`, `espera`, `callback`, `regra`/`fluxo` (decisões), `escolha`/`tela`, `retentativa`. O START agrupa as variáveis por assunto (`envelope`, `controle`, `rede`, `cliente`, `pedido`, `endereco`, `produto`, `resposta`).

## `campos`: uma linha por item da chamada

```js
{
  id: 'R01',                 // letra do grupo + número: R requisição, S resposta, U regra de US; outros grupos usam letra própria (D decisão, T tela, E espera…). NUNCA renumere.
  grupo: 'request',
  nome: 'Método e endpoint',
  tipo: 'HTTP',              // HTTP, header, query, body, status, campo, regra…
  linha: 'BPMN Node_ConsultaBD · DM Camunda x MS Request · OpenAPI',   // de onde a linha saiu
  bpmn: 'GET … com parâmetros no formato do ServiceNow',             // o que o BPMN faz; null = não implementado
  valor: { t: 'config', de: 'FENIX_VE_TT_BASE_URL (ambiente) + parâmetros fixos' },
  valores: '…',              // só no START: valores possíveis da variável
  fontes: {
    DM:   { v: 'Obrigatório · GET /troubleTicket?filter=…', r: 'diverge' },
    US:   { v: 'US01 Req01: "…"', r: 'parcial' },
    PM:   { v: '…', r: 'igual' },
    CURL: { v: '…', r: 'igual' },
    QA:   { v: '…', r: 'igual' }
  },
  dm: [ { aba: 'Camunda x MS Trouble Ticket Req', linha: 13 },
        { arquivo: 'outro DM.xlsx', aba: '…', linha: 18 } ],   // linha real no Excel; arquivo só se não for o DM da fonte
  leitura: 'Análise em linguagem simples: o que bate, o que não bate e o risco.',
  acao: 'decidir',           // nada | decidir | fonte | bpmn
  acaoTexto: 'O que fazer, em uma frase.'
}
```

### `valor.t`: de onde o BPMN tira o valor

`start` (variável de entrada), `tela` (resposta do usuário numa tela SDUI), `integracao` (resposta de outra INT), `gerado` (script, UUID, data), `fixo` (literal no BPMN), `config` (variável de ambiente), `resposta` (campo lido da resposta desta INT), `nenhum`. Em `de`, diga a origem exata (`INT03 S07 · result[0].number`, `Node_Start.designador`…).

### `fontes.X.r`: comparação com o BPMN

| `r` | Quando | Cor da célula |
|---|---|---|
| `igual` | A fonte diz o mesmo que o BPMN faz. | normal |
| `parcial` | Bate em parte: outro nome, formato, obrigatoriedade ou valor de exemplo. | amarela "Bate em parte" |
| `diverge` | A fonte contradiz o BPMN. | amarela "Diverge" |
| `so-fonte` | A fonte pede e o BPMN não tem. Use com `bpmn: null` ou, na US, quando a regra não existe no BPMN. | amarela (US: "BPMN não tem") |
| sem a chave | A fonte não traz o item. | vermelha "Não consta" (US: cinza "Sem menção") |

- `v` que começa com `Não envia` ou `Não lê` fica cinza itálico: a fonte também não usa o item, igual ao BPMN.
- No DM, comece `v` com `Obrigatório ·`, `Não obrigatório ·` ou `Opcional ·` quando a planilha disser. A página destaca o prefixo.
- US: `USxx ReqNN/CA00N: "frase-chave"`. Para várias US, separe com ` · `.

### `acao`: a cor do código da linha

| `acao` | Cor | Quando |
|---|---|---|
| `nada` | verde | O BPMN atende e as fontes não deixam dúvida. |
| `decidir` | amarela | Precisa de decisão da área ou do dono da API. Escreva a pergunta em `acaoTexto`. |
| `fonte` | amarela | O BPMN está certo e a documentação (DM, collection, US) precisa de ajuste. |
| `bpmn` | vermelha | O BPMN precisa mudar. |

Não suba para `bpmn` o que é decisão em aberto. Não rebaixe um `bpmn` sem que a causa tenha sido resolvida.

## `revisao.js`: não é da análise

Quem revisa grava pela página. A chave é `"INT14:R10"`. O agente só toca nesse arquivo ao aplicar um lote: veja a skill `raio-x-lote`.
