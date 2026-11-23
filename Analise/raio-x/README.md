# Raio-X · BPMN × DM × Postman × curl (FTAT-933)

Abra `comparativo.html` direto no navegador. Não precisa de servidor.

Uma planilha por integração: START (Iniciar Jornada, o contrato de entrada do `Node_Start`) e INT01 a INT18. No START, cada variável traz também os **valores possíveis** (campo `valores`), que aparecem no painel e no lote. A coluna BPMN (`fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn`) é a referência; DM, Postman (coleção de 18/11), curl (`postman/curls/`) e a tela de QA (`qa-integracoes/fenix-ve-integracoes.html`) são comparados contra ela. Clique numa célula ou use as setas: o texto completo, a análise, os links para as fontes e a revisão aparecem no painel de detalhe. O painel fica embaixo ou na lateral (em telas com mais de 900px) e pode ser recolhido; a escolha fica salva no navegador. O endereço guarda o campo (`#int=INT14&campo=R10`).

Na aba **DM** do painel aparece o conteúdo das linhas do DM ligadas à linha selecionada (campo `dm: [{ aba, linha, arquivo? }]` nos dados): a aba, o número da linha no Excel e cada célula com endereço e título da coluna. Domínio/Máscara e Exemplo(s) aparecem sempre, em destaque. O conteúdo vem de `dados/dm.js`, gerado por `gerar-dm.cjs` a partir dos `PreDataMapping*.xlsx` da raiz (CPF, CNPJ, telefone e e-mail mascarados). Quando um DM mudar, rode `node Analise/raio-x/gerar-dm.cjs` na raiz do repositório.

No painel, as fontes (golden source) ficam em abas, uma por fonte com arquivo; a aba escolhida vale para todas as linhas (setas esquerda/direita trocam de aba). Os links das fontes são relativos à raiz do repositório (`../../`). Três nomes com acento estão gravados no disco com caracteres trocados ("Histo╠ürias", "Diagno╠üstico", "Revalidac╠ºa╠âo"). A função `disco()` da página refaz essa troca. Se os arquivos forem renomeados, apague a troca.

## Cores

Coluna do código (R01, S01…), a partir de `acao` na análise:

| Cor | Significado | `acao` |
|---|---|---|
| Verde | Tudo certo: o BPMN atende | `nada` |
| Amarelo | Confirmar ou validar com a área, ou ajustar a documentação | `decidir`, `fonte` |
| Vermelho | Ajustar no BPMN | `bpmn` |

Células: vermelho = não consta na fonte ou não implementado no BPMN; amarelo = bate em parte (`r` parcial ou diverge); cinza itálico = "Não envia" (a fonte também não manda, igual ao BPMN).

## Dados

`dados/intNN-*.js` chamam `RAIOX.registrar({ id, nome, endpoint, fontes, grupos, campos })`. Cada campo tem `bpmn` (null = não implementado), `valor`, `fontes: { DM, US, PM, CURL, QA: { v, r } }` (`r`: igual | parcial | diverge | so-fonte; sem chave = não consta), `leitura`, `acao`, `acaoTexto`. Os arquivos também guardam DFT, OAS e TELA, que só aparecem nos links do painel.

A coluna **Histórias (US)** diz o que as 13 histórias de usuário falam de cada linha: regra, valor fixo, decisor, texto de tela, ordem das chamadas. O formato é `USxx ReqNN/CA: "frase-chave"`. Sem menção, a célula fica cinza ("Sem menção"), porque as US não descrevem campo a campo e isso não é falha. Se a US pede algo que o BPMN não tem, a célula fica amarela com a etiqueta "BPMN não tem". Regras das US que não têm linha própria (decisores, telas, ordem das chamadas) ficam no grupo "Regras das histórias (US)", com ids U01, U02…

A barra lateral agrupa as integrações pelo campo `secao` do arquivo de dados. O valor padrão é `jornada`. A INT00 (Consulta Asset) usa `secao: 'fora'` e aparece em "VE - Fora da Jornada": é a consulta que o canal faz antes do START. Nela, a coluna BPMN diz como o dado entra na jornada (variável do START e onde é usada). Quando o dado não entra, a célula aparece em cinza ("Não usado na jornada"), e não em vermelho. A requisição do Asset é domínio do canal: toda linha de requisição é verde e, nela, a coluna DM mostra "Não se aplica". Da INT00 só se aproveita a resposta, para validar a documentação da jornada, como a primeira aba (entrada VE → Camunda) dos DMs de Consulta de BD e Consulta de Massivas. Enquanto essa comparação não for feita, a coluna DM da resposta fica "Não analisado".

Sem curl: INT10 e INT18. A resposta de exemplo do Asset está em `curls/INT00-response.jsonc`. `curls/INT11.json` não é curl: é uma resposta de consulta de troubleTicket (INT03). `curls/INT08.sh` é igual ao INT14.sh, com o Bearer vazio.

Os ids dos campos são a chave da revisão (`INT14:R10`). Não renomeie ids já revisados. Nunca copie tokens, `iss`, senhas ou dados pessoais dos curls para cá.

## Revisão

A coluna **Revisão** e o formulário do painel registram a decisão de quem revisa cada linha. Ela fica em `dados/revisao.js`, que vai para o git.

O formulário edita um rascunho: nada muda na tabela nem no arquivo até clicar em **Salvar**. **Cancelar** descarta o rascunho. Trocar de linha, de integração ou de filtro com alterações não salvas pede confirmação.

Depois de revisada, a cor do código da linha (R01, S01…) segue a revisão: verde para tudo certo ou já aplicado, amarelo para ajuste só na collection ou na documentação, vermelho para ajuste no BPMN ainda não aplicado. Uma linha verde que volta a pendente fica cinza. Sem revisão gravada, vale a cor da análise.

- **Status:**
  - `ok` (Tudo certo): padrão das linhas verdes, sem gravar nada no arquivo. No painel dá para voltar a `pendente` ou passar a `revisado`;
  - `pendente`: padrão das linhas amarelas e vermelhas;
  - `revisado`: revisada; se marcar onde ajustar, há alteração a fazer;
  - `aplicado`, marcado pelo agente depois de ajustar.
- **Ajustar em** (uma ou mais): **BPMN**, **Collection (Postman)** ou **Documentação**. BPMN e collection vão para o lote do agente; documentação é só informativo, para o time que a mantém.
- **Anotação:** o que o modelo deve fazer. Não precisa repetir o contexto: o lote copia da análise a linha inteira (valor no BPMN, origem do valor, as quatro fontes, análise, ação sugerida e de onde a linha saiu).
- **Gravação:**
  - Clique em **Conectar pasta para gravar** e escolha `Analise/raio-x/dados` (Chrome ou Edge). Se escolher `Analise/raio-x`, a página entra sozinha em `dados`. A partir daí, cada mudança é gravada direto no arquivo.
  - O navegador não deixa a página abrir o seletor num caminho escolhido por ela. Por isso, na primeira vez a página copia o caminho de `dados` para a área de transferência: na janela, cole na barra de endereço (Ctrl+L, Ctrl+V) e clique em Selecionar pasta. Nas próximas, o seletor já abre em `dados`.
  - Os três botões (conectar, lote e pendências) usam a mesma pasta. Sem pasta conectada, o lote e as pendências pedem a pasta antes de gravar.
  - Em outra sessão, o navegador pode pedir **Reativar gravação**.
  - Sem pasta conectada, as mudanças ficam pendentes no navegador e entram no arquivo ao conectar.
  - Antes de gravar, a página junta o arquivo com o que já está no disco, e prevalece o registro mais recente de cada linha. Por isso um agente pode marcar itens como `aplicado` sem perder nada.
- **Saídas:** os botões gravam em `dados/saidas/`. Só baixam o arquivo em navegador sem gravação direta.
  - **Lote de ajustes** gera `lote-ajustes-AAAA-MM-DD.md`, com os itens revisados para BPMN ou collection e ainda não aplicados: instruções para o agente, a anotação e o contexto de cada linha.
  - **Pendências de documentação** gera `pendencias-documentacao-AAAA-MM-DD.md`, com a anotação e o contexto de cada linha.
  - Nenhum dos dois aplica nada.
- **Notas antigas:** as que ficavam só no navegador (chave `raiox.ftat933.v3`) migram para a revisão na primeira abertura.

A barra lateral esquerda pode ser recolhida pelo botão ao lado do título.

## Busca

A caixa no topo da barra lateral (atalho `/` ou Ctrl+K) procura em todas as integrações ao mesmo tempo, sem diferenciar maiúsculas nem acentos. Ela olha id, nome, tipo, BPMN, valores das fontes, texto das células ("Não implementado", "Não consta"…), análise, ação, valores possíveis e a anotação da revisão. Com vários termos, a linha precisa ter todos.

- A tabela mostra só as linhas encontradas, com os termos destacados.
- Cada integração mostra quantas linhas achou; as sem resultado ficam apagadas. Se a INT aberta não tiver nada, a página vai para a primeira que tem.
- Enter seleciona a primeira linha (depois, as setas navegam). Esc limpa a busca.

Ao lado dos filtros há uma **busca só da integração aberta**, que funciona igual e se soma à global e aos filtros. Ela é limpa quando você troca de integração.

A **legenda** abre pelo botão "Legenda", ao lado do botão de tema, num painel flutuante que fecha ao clicar fora ou com Esc. Ela explica as cores do código da linha e das células, a coluna Revisão e os atalhos de teclado.

## Tema escuro

Inspirado no Dark+ do VS Code: fundo `#1E1E1E`, barra lateral e painel `#252526`, bordas `#454545`, texto `#D4D4D4` e acento azul `#3794FF` (no claro, o acento continua roxo Vivo).

## Skills e validação

`skills/` traz duas skills (Claude Code, GitHub Copilot, Codex e Cursor) para o trabalho com o Raio-X: `raio-x-analise` monta ou atualiza a planilha de uma integração e tem os briefs para dividir o trabalho entre agentes em segundo plano; `raio-x-lote` aplica o lote de ajustes no BPMN e na collection. Veja `skills/README.md` para instalar (`node Analise/raio-x/skills/instalar.cjs`).

Antes de commitar dados, rode `node Analise/raio-x/validar.cjs`. Ele confere ids, grupos, valores, referências ao DM, revisões que apontam para linhas inexistentes, scripts faltando na página e dados com cara de pessoais ou de token.
