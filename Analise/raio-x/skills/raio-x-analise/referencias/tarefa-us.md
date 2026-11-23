# Tarefa: coluna "Histórias (US)" no Raio-X

> Brief autocontido para um agente (subagente ou agente em segundo plano). Quem delega troca `<ARQUIVOS>` pela lista de arquivos de dados. Para paralelizar, dê a cada agente arquivos diferentes.

Repositório: raiz do `fenix-ve` (Bash ou Node). Escreva em português do Brasil. Arquivos da sua lista: **<ARQUIVOS>** (em `Analise/raio-x/dados/`).

Preencha o que as 13 histórias de usuário dizem sobre **cada linha** desses arquivos: menção ou regra sobre o comportamento da variável ou campo, valores fixos, decisores (condições, ramos), campos e textos de tela, mensagens SDUI, timeouts, tentativas, ordem das chamadas, ou qualquer coisa que influencie a jornada.

## Material
- As US: pasta `Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/` na raiz. No disco os acentos aparecem trocados ("Histo╠ürias…"); use `ls Hist*/`.
- Texto de cada .docx: `unzip -p "<arquivo>.docx" word/document.xml | sed -e 's/<\/w:p>/\n/g' -e 's/<[^>]*>//g'`. Tabelas e critérios de aceite estão no mesmo XML.
- Formato dos dados: `Analise/raio-x/skills/raio-x-analise/referencias/formato.md`. O BPMN (`fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn`) serve para comparar o comportamento que a US descreve.

## O que gravar
- `fontes.US = { v, r }` quando alguma US menciona ou regra o item, direta ou indiretamente (a regra de decisão que usa o campo, o texto de tela que ele alimenta).
  - `v`: qual US e onde, com a frase-chave entre aspas. Ex.: `US05 Req02 CA003: "se o cliente não conseguir reiniciar, acionar o HPSD" · US06 Req01: …`.
  - `r` contra o BPMN: `igual`, `parcial`, `diverge` ou `so-fonte` (a US pede e o BPMN não tem).
- Sem menção: **não crie** `fontes.US`. A página mostra "Sem menção" em cinza, e isso não é falha.
- Se a US contradiz o BPMN ou pede algo que ele não faz, acrescente uma frase em `leitura`. Mude `acao` de `nada` para `decidir`, com a pergunta em `acaoTexto`, só quando a divergência for real. Não rebaixe `acao` que já é `bpmn`.
- **Regras sem linha própria** (um decisor, um texto de tela, um timeout, uma condição de ramo) viram linhas novas no grupo `{ id: 'us', nome: 'Regras das histórias (US)', sub: 'regras declaradas nas US sem linha própria' }`, com ids `U01`, `U02`…, `linha: 'US'`, `bpmn` com o que o BPMN faz (ou null), `fontes: { US: {v, r} }` e só as outras fontes que de fato citem a regra. Em cada INT entram só as regras ligadas a ela (o decisor que usa a resposta dela, a tela antes ou depois, a condição para chamá-la). Regras gerais de início de jornada vão para o START.
- No array `fontes` do arquivo, garanta `{ id: 'US', nome: 'Histórias (US)', curto: 'US', contrato: false, arquivo: 'Histórias de usuário V2 04-11-2026 Elastic Journey FTAT-933/', detalhe: '<quais US tratam desta integração>' }`.

## Regras
- Altere **só** os arquivos da sua lista.
- Não renumere nem renomeie ids existentes, porque são a chave da revisão. Linhas novas vão no fim.
- Nunca copie tokens, `iss`, senhas nem dados pessoais. As US podem ter exemplos reais: descreva o formato.
- Decisões em aberto (ver `referencias/fontes.md`) continuam `decidir`.
- Preserve o formato: comentário do topo + `RAIOX.registrar({...});`.
- Valide cada arquivo: `node Analise/raio-x/validar.cjs <arquivo>`.

## Resposta final (até ~15 linhas por arquivo)
Linhas com US (antes → depois), linhas `U##` novas, divergências US × BPMN relevantes, cores que mudaram e trechos de US que você não conseguiu interpretar.
