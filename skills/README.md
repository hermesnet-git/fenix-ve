# Scripts da jornada "Abertura de BD pelo VE"

Dois scripts para recriar a jornada no Elastic Journey e gerar o BPMN organizado que está em
`fenix/abertura-bd-pelo-ve.bpmn`.

## Skill de análise de jornada

Use [`skill-dossie`](skill-dossie/SKILL.md) (`/skill-dossie`) para analisar histórias, Figma,
arquitetura, contratos e documentação de uma jornada e criar/atualizar um único dossiê HTML. O
dossiê mantém as pendências e respostas, o fluxograma funcional, os cenários de validação e o
histórico de cada publicação/teste. A matriz de cenários fica como a última seção do HTML; não é
criado um Markdown paralelo.

## Antes de rodar

- Node.js 18 ou mais novo.
- Admin (back) no ar em `http://localhost:8081`, com o usuário `admin` / `admin`.
- Motor de execução no ar em `http://localhost:8080` (só para o segundo script).
- Dependências instaladas (`npm install`) em `front/` e em `simulacoes/emulador-canais/`. Os scripts
  usam o `elkjs` e o `@xmldom/xmldom` dessas pastas e também os ajudantes da skill em
  `.claude/skills/criar_jornada_publicada/scripts/sdui_helpers.mjs`.
- O produto "Vivo empresas - VE" precisa existir no admin com o id
  `66896bd3-f42d-4549-af38-df2c1c0e34df` (fixo no script).

Rode os comandos a partir da raiz do repositório (`admin/`).

## 1. Criar e publicar a jornada

```
node ../../../fenix/skills/jornada_abertura_bd_ve.mjs
```

- Procura a jornada "Abertura de BD pelo VE" no produto "Vivo empresas - VE" (canal App) e a cria se
  ela ainda não existir.
- Grava o fluxo completo: telas do Figma, integrações, decisões, seções e as notas que explicam a
  origem de cada decisão.
- Gera uma nova versão e tenta publicar.
- Se publicada, despublica as versões anteriores. Se o Admin bloquear por endpoint/broker/credencial TBD,
  mantém a nova versão como `DRAFT` e despublica as versões antigas para não deixar conectores de
  laboratório ativos.
- Mostra o `journeyId` e o status/versão resultante.

Cada execução publica uma versão nova e **substitui o fluxo da jornada pelo que está no script**.
Alterações feitas à mão no editor se perdem; leve-as para o script antes de rodar de novo.

tópico e o cluster no script ou na própria jornada.
O script não usa mais endpoints do `ms-mock-api-rest` nem o tópico de laboratório. Os pontos seguem
o DFT FTAT-933 v1.2: INT01 e INT06 usam os endpoints de referência; INT03/11/14/16/18 permanecem
`TBD`; INT10 declara o tópico arquitetural, mas publicação/execução depende de cluster, broker e
credencial de ambiente. Não substituir os `TBD` por APIs downstream (SIGITM, ServiceNow, TMF646 ou
TMF697) sem contrato que autorize a chamada direta da Jornada.

A chamada Customer Problem Management e a TMF653 ainda precisam de autenticação e schemas/valores
confirmados. Enquanto o Admin não tiver configuração real de broker/credencial, o script pode salvar
a versão DFT como `DRAFT`; nesse estado não há versão publicada/ativa para execução.

## 2. Gerar o BPMN organizado

```
node ../../../fenix/skills/organizar_bpmn.mjs c4de98d7-8525-4ffd-8cde-ce66c0660830 ../../../fenix/abertura-bd-pelo-ve.bpmn
```

Parâmetros: o `journeyId` (o valor acima é o da jornada atual; use o que o primeiro script mostrar
se a jornada for recriada) e o arquivo de saída.

- Baixa do motor o BPMN da versão publicada e, do admin, os rótulos das ligações e as seções.
- Refaz só o desenho: ligações em ângulo reto com rótulo ("Sim", "Sem resposta em 3 min"...),
  eventos "Se falhar" na borda de baixo das etapas e as seções como grupos.
- A lógica do processo não muda.
- Sobrescreve o arquivo de saída.

Rode este script depois de cada publicação para o BPMN acompanhar a versão publicada.

## 3. Levar uma versão publicada para o ms-journey-v1 / wf-journey-motor-v1

1. No admin, em **Jornadas**, abra as versões da jornada e use **Exportar pacote (BPMN e telas)**
   numa versão publicada. É baixado um `<jornada>-v<n>.zip` com:
   - `<jornada>.bpmn`: o BPMN publicado, já organizado (mesmo desenho do passo 2). O id do processo
     continua `Journey_<uuid sem hífens>`, formato que o ms-journey-v1 reconhece; não altere.
   - `screens.json`: as telas SDUI da versão.
   - `snapshot.json`: o fluxo publicado (variáveis de início, nós e ligações).
   - `manifest.json`: jornada, versão, `versionTag` e SHA-256 de cada arquivo.
2. O desenvolvedor copia o `.bpmn` para `src/main/resources/process` do wf-journey-motor-v1. O motor
   inicia sempre a **última versão implantada** da chave, então implante o BPMN da mesma versão do
   pacote importado.
3. Na raiz do ms-journey-v1, importe o snapshot e as telas:

   ```
   node scripts/importar-pacote-jornada.mjs <jornada>-v<n>.zip \
     --api http://localhost:8080/journey/v1 \
     --db-url postgres://usuario:senha@host:5432/journey_registry
   ```

   - O snapshot vai por SQL para `journey_version`/`journey_publication` do schema do portal
     (`--portal-schema`, padrão `public`); não há API para isso.
   - As telas vão pela API `POST /espec-registry/api/v1/published-screens`. Use `--token`
     ou `IMPORT_API_TOKEN` se a API exigir token.
   - Reimportar a mesma versão atualiza os registros, sem duplicar.
   - Use `--dry-run` para só validar o pacote. Rode `--help` para ver todas as opções.

Importe antes de iniciar instâncias: sem o snapshot e as telas, o ms-journey-v1 não resolve as
variáveis de início nem as telas da jornada.
