# FTAT-933: variaveis e origens da abertura de BD

Analise realizada em 2026-11-19. Artefato principal: [fenix-ve-mapa-variaveis.xlsx](fenix-ve-mapa-variaveis.xlsx).

## Objetivo e orientacao do solicitante

Mapear os dados necessarios ao processo de abertura de BD, sua origem, momento de obtencao, obrigatoriedade de integracao e transformacoes. Determinar o que precisa chegar ao iniciar uma instancia, o que vem de integracao anterior, o que depende de interacao de tela e o que deve ser gerado, calculado ou configurado no Journey.

**Nao usar as entradas atuais da jornada como requisitos.** O solicitante refinou o pedido: manter uma segunda aba exclusivamente para comparar as entradas atuais com o contrato necessario, indicando manter, ajustar, criar, dispensar ou confirmar. O estado atual e evidencia de implementacao, nao de origem aprovada.

## Como ler o Excel

| Aba | Conteudo |
| --- | --- |
| 01_Mapa_variaveis | Catalogo logico, origem, status, inicio, momento, regra, possibilidade de fixo, caminho upstream quando documentado, alias atual e fontes. |
| 02_Comparacao_atual | Comparacao solicitada: START documentado no BPMN local, consumo e acao recomendada. Nao representa consulta ao registry publicado. |
| 03_Entradas_inicio | Recorte de entradas confirmadas e candidatas pendentes. **Nao e uma lista aprovada de campos obrigatorios.** |
| 04_Campos_datamapping | Linhas tabulares das 35 abas, inclusive respostas, downstream e OLD, preservando H obrigatoriedade, K dominio/mascara e notas adicionais. |
| 05_Payloads_exemplos | Payloads documentais extensos com arquivo, aba e celula. Valores ilustrativos nao sao defaults produtivos. |
| 06_BPMN_leituras_escritas | Leituras, escritas, acessos dinamicos resolvidos, configuracao e bindings SDUI observados. |
| 07_Regras_pendencias | Regras fundamentadas, conflitos e decisoes necessarias. |
| 08_Contratos_OpenAPI | Parametros e required dos tres contratos locais; obrigatoriedade do schema nao determina origem VE. |
| 09_Historias_DFT_PDF | Texto extraido com paragrafo original, slide ou pagina. |
| 10_Fontes_cobertura | Fontes, cobertura, limitacoes, links e SHA-256 dos documentos locais. |
| 11_Leia_me | Orientacoes resumidas de leitura. |
| 12_Asset_origem_caminhos | Caminhos provedor->canonico do mapping remoto de assets e ressalvas. |

Filtros e cabecalhos congelados foram configurados. Links relativos pressupõem manter esta pasta dentro de Fenix-VE, junto aos documentos originais. A abertura diretamente em aba/celula depende do suporte do aplicativo Excel; a localizacao textual permanece disponivel.

## Criterios de evidencia

- IDENTIFICADA: ha produtor ou responsabilidade de origem explicita. Nao implica que todo formato ou campo seja homologado.
- PARCIAL: familia/origem conhecida, mas falta caminho exato, selecao, equivalencia, regra ou envelope.
- NAO IDENTIFICADA: nao ha evidencia suficiente de onde obter o valor ou qual regra o determina.
- CONFLITO: fontes divergem; nao escolher silenciosamente uma delas.
- Cabecalho, metadado de inicio, configuracao, dado de negocio e resposta humana sao categorias distintas.
- Obrigatoriedade do downstream nao deve ser transferida automaticamente ao VE. Pode exigir enriquecimento no MS ou revisao do contrato.
- Filhos obrigatorios de objeto opcional nao sao obrigatorios incondicionalmente. Min/max conflitantes ficam pendentes.
- Campo estrutural, agrupador ou nome de caracteristica nao e uma nova entrada humana.
- Exemplo, dominio enumerado, mascara de formato e regra fixa sao conceitos diferentes. So fixar quando houver regra explicita no contexto correto.
- Catalogo inclui reuso e aliases: **nao somar linhas como entradas independentes**. Os 36 campos BD podem reutilizar contexto e retornos ja catalogados.

## Resultados principais

1. As US01/02/03 estabelecem que o VE envia contexto de assets. O DATI coloca a consulta antes da jornada. Falta fechar o envelope VE->Journey e a selecao dos produtos/papeis corretos.
2. Massiva usa designador do servico 013; BD usa acesso 069. O BPMN atual concentra usos em designador. Nao ha regra que permita converter um no outro por troca de sufixo.
3. O mapping remoto de assets identifica caminhos canonicos para nome/ID/documento do cliente, endereco, complemento estruturado, tecnologia e designador. Sao campos em grande parte opcionais na resposta, nao garantia de disponibilidade para todo CRM/cliente.
4. Status do asset tem DE/PARA Ativo->Active, Suspenso->Suspended, Cancelado->Cancelled e Pendente->Pending. Isso nao comprova o literal bloqueio usado pelo BPMN nem que suspensao equivalha a inadimplencia. US atribui interpretacao ao EJ; DFT slide 4 ao VE.
5. networkOwnerId do asset tem exemplo numerico; falta DE/PARA para VIVO1/VIVO2. CNL, central, area telefonica, armario e atendente ainda precisam de origem/condicao fechadas. telephonicArea e centralOffice sao especificos da variante VIVO1 nas tabelas de slots.
6. Horario/data/recursos da visita surgem da consulta WFM e da escolha do cliente. Nao sao entradas de inicio. US07 exige revalidacao apos escolha; BPMN so verifica pertencimento a lista armazenada.
7. Mapping WO orienta gerar VE+UUID em L12 e avaliar limite de 50 caracteres. ID WO nao deve ser pedido ao canal. Regra do item, idempotencia e reconciliacao de timeout precisam ser aprovadas.
8. WorkOrder e WorkOrderItem do BD podem vir da resposta INT14. Nao foi comprovado que idWork seja idAppointment.
9. Os 36 nomes de caracteristicas BD sao estruturais; seus valores estao opcionais na entrada Camunda->MS. Nao criar 36 obrigacoes de START. Algumas estruturas opcionais tem filhos required e exigencias internas divergentes.
10. Request WO documenta sourceSystem SERVICENOWB2BMASSIVO; BPMN usa MVE. Datas, tipos boolean/string, Attendant e certas cardinalidades tambem divergem entre tabela, exemplo e implementacao.
11. Correlacao HPSD exige UUID v4 no OpenAPI e eco no callback; mappings usam mascaras CID/TID por timestamp. ID do teste e resultado sao retornos, nao entradas. Resumo enviado ao BD nao e automaticamente equivalente ao evento exemplificado.
12. Contatos, pedido comercial, categoria, certas caracteristicas de produto, detalhes e referencias ainda nao tem fonte fechada. Nao preencher com dados dos curls de teste nem simplesmente exigir do VE.
13. requestTimestamp consta no START documentado, mas nao possui leitor executavel identificado. Nao ha necessidade comprovada para mante-lo como entrada.
14. PDF de 80 paginas trata venda/aceite/instalacao FTTH. Regras getProposal, minLeadDays/maxDaysAhead, assinatura e contato futuro nao foram promovidas a requisitos FTAT-933.

## Fontes e limites

Foram extraidos os sete XLSX completos (35 abas), 13 historias DOCX, 17 slides DFT e 80 paginas PDF; confrontados com os tres contratos OpenAPI locais, corpo funcional do BPMN, telas SDUI, export/resumo Figma, workflow PNG e dois dossies existentes.

Paginas corporativas efetivamente consultadas:

- [DATI 2.0](https://wikicorp.telefonica.com.br/spaces/ADS/pages/784061401): jornadas 4/5.2, descricao funcional e fronteiras de integracao.
- [DM Customer Asset Information V2](https://wikicorp.telefonica.com.br/spaces/ADS/pages/870859882): secoes 2.1.1 e 2.1.3, caminhos de request/response. Apenas regras pertinentes foram transcritas; curl remoto com credencial nao foi copiado.

O LeanIX e o DAS foram identificados como referencias; o desenho interativo LeanIX nao foi validado. Links remotos e suas secoes estao registrados, mas nao foi produzido snapshot integral versionado dessas paginas.

Extracao textual de DOCX/PPTX/PDF **nao cobre imagens embutidas**. O PNG workflow foi visualizado; nao houve revisao visual pagina a pagina das 80 paginas PDF. Comentarios, desenhos e objetos embutidos em Excel nao sao cobertos pelo extrator. Abas ocultas e historicas sao preservadas com identificacao, nao tratadas como contrato vigente por padrao.

Collections Postman, curls e scripts existentes sao artefatos auxiliares de implementacao/teste, nao fontes normativas de obrigatoriedade/origem. Nao foi feita auditoria completa desses artefatos nesta entrega, nem de BPMNs de backup/reagendamento. A planilha registra as divergencias de exemplos oficiais citadas nos dossies, sem reexecutar chamadas. Arquivo de token e valores de Authorization de collections foram excluidos. O material pode conter dados pessoais ilustrativos dos documentos originais; uso interno.

Nao foram alterados BPMN, telas originais, documentos-fonte, configuracao publicada ou codigo dos repositorios de runtime. Nao houve criacao/cancelamento de WO nem chamadas mutaveis a ambientes.

## Validacao

O gerador escreve e reabre o XLSX, verifica segunda aba, cobertura de 7/35/13/80, unicidade de linhas documentais, referencias locais, limite de caracteres do Excel e ausencia de formulas. O resumo com contagens atuais esta em [resultado-validacao.json](resultado-validacao.json). Os dois scripts foram verificados por diagnosticos do editor.

Essa validacao comprova integridade estrutural e rastreabilidade local; nao e homologacao dos contratos nem revisao visual no Microsoft Excel. Campos NAO IDENTIFICADA/PARCIAL/CONFLITO requerem decisao dos donos VE/WFM/HPSD/ServiceNow/arquitetura.

## Atualizar sem perder contexto

1. Ler este README e as abas 01, 02 e 07. Preservar decisoes manuais e solicitar sua conciliacao antes de regenerar um Excel editado pelo usuario.
2. Identificar exatamente quais documentos/versoes mudaram. Comparar hashes e nao substituir silenciosamente uma fonte vigente por aba OLD ou exemplo de outro fluxo.
3. Atualizar fontes, executar extracao, revisar regras curadas do gerador e atualizar os caminhos/origens com referencia precisa. Nao inferir origem a partir de alias atual.
4. Registrar evidencia, condicao, impacto na entrada e pendencia/responsavel. Promover status apenas quando a nova evidencia fechar a lacuna.
5. Gerar novamente, validar e atualizar este resumo. Conferir manualmente as linhas afetadas e evitar alteracoes de runtime sem autorizacao explicita.

Ferramentas Node instaladas fora dos projetos, em diretorio temporario. Comandos a executar a partir da raiz Fenix-VE:

```sh
npm install --prefix /tmp/fenix-mapeamento-tools exceljs fast-xml-parser pdf-parse yaml
node Analise/mapeamento-variaveis/extrair-fontes.cjs
node Analise/mapeamento-variaveis/gerar-planilha.cjs
```

[extrair-fontes.cjs](extrair-fontes.cjs) usa unzip para Office, ExcelJS para XLSX e pdf-parse para PDF. Produz [fontes-extraidas.json](fontes-extraidas.json). [gerar-planilha.cjs](gerar-planilha.cjs) combina extracao e regras curadas; nomes de versao/abas estao ancorados nas fontes desta analise, logo versoes novas exigem revisar o seletor e as referencias de celula. Dependencias temporarias nao estao travadas em lockfile deste diretorio; instalar versoes futuras pode exigir ajuste do extrator.

## Prompt para futuras solicitacoes

> Atualize Analise/mapeamento-variaveis/fenix-ve-mapa-variaveis.xlsx para a FTAT-933. Leia primeiro este README, o gerador e o resultado de validacao. Analise o BPMN como inventario de produtores/consumidores, mas NAO considere suas entradas START atuais como requisitos. Descubra requisitos pelas historias, data mappings, DFT, arquitetura, contratos e telas. Mantenha a SEGUNDA aba para comparar entradas atuais com as necessarias, indicando manter, ajustar, criar ou dispensar, com motivo e evidencia. Para cada dado registre origem VE/contexto anterior, integracao, tela, calculo, configuracao ou origem nao identificada; momento de obtencao; obrigatoriedade da fronteira correta; dominio/mascara; exemplo versus constante; transformacao e destino; documento/link, aba e celula/paragrafo/slide/pagina; status de confirmacao. Nao transforme campo required de integracao em obrigacao automatica do canal; nao use valores de teste como constantes; nao preencha lacunas por suposicao. Separe servico 013 de acesso 069, IDs de negocio/tecnicos e retorno WFM de escolha humana. Nao importe regras de venda do PDF sem evidencia de aplicabilidade a defeito. Preserve edicoes manuais da planilha, documentos e runtime. Atualize regras/README, regenere somente apos conciliar decisoes, valide integridade e explique o que mudou e o que permanece pendente. Pergunte quando uma decisao de negocio ou contrato nao puder ser estabelecida documentalmente.