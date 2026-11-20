---
name: skill-dossie
description: "Analisa histórias de usuário, Figma, arquitetura, contratos API e documentação de uma jornada; cria ou atualiza um único dossiê HTML com comportamento funcional, pendências e respostas, fluxograma resumido e matriz de cenários para acompanhar criação, publicação e testes incrementais. Use quando pedirem dossiê de jornada, análise de jornada, levantar dúvidas/incoerências, organizar respostas ou validar a jornada a cada publicação."
argument-hint: "jornada ou feature para analisar"
user-invocable: true
---

# Skill Dossiê

## Objetivo

Produzir um dossiê HTML único para analisar uma jornada e acompanhar sua evolução até a validação. O HTML é a fonte de verdade de trabalho: não criar um Markdown paralelo nem dividir perguntas, respostas ou resultados de testes em outros documentos, a menos que o usuário peça explicitamente.

O processo é incremental. Não exigir que todas as dúvidas estejam respondidas para começar: respostas confirmadas liberam uma parte da jornada; cada publicação e teste atualiza o mesmo HTML e pode abrir novas perguntas.

## Quando usar

- Analisar histórias de usuário para construir uma jornada nova ou alterar uma existente.
- Cruzar histórias com Figma, arquitetura, APIs, eventos, data mappings e documentação do projeto.
- Registrar incoerências, dúvidas, respostas e decisões aprovadas.
- Acompanhar ciclos de implementação, publicação e teste de jornada.
- Montar ou atualizar o dossiê HTML de uma jornada.

## Procedimento

### 1. Identificar a jornada e as fontes

1. Confirme o repositório, a feature/jornada e o canal em escopo. Se estiverem explícitos no pedido, não interrompa para perguntar novamente.
2. Inspecione as pastas indicadas e liste as fontes disponíveis: histórias, Figma/exportações, arquitetura/DAS/DATI, OpenAPI/Swagger, data mappings, contratos Kafka, código/script de jornada, requisitos e documentação do admin.
3. Leia todas as histórias do escopo, incluindo critérios de aceite, pré-condições, exceções e premissas. Não baseie a análise só nos títulos ou no resumo.
4. Inspecione os formatos de Figma disponíveis. Prefira export com hierarquia de documento, estrutura/ordem de telas e resumo legível; identifique versão/data. Registre se o protótipo remoto não está acessível.
5. Consulte referências externas de arquitetura e data mapping quando houver URL e acesso. Registre o nome, versão/data e link direto; não trate texto de outra jornada como contrato desta.
6. Inspecione os contratos API com parser ou ferramenta apropriada. Extraia operação, URL base, headers, parâmetros, campos requeridos, responses e erros relevantes. Para Kafka, procure tópico, schema, chave de correlação, credencial e comportamento de timeout.
7. Leia a skill/script existente de criação/publicação de jornada e as convenções do Journey Admin. Trate scripts de laboratório e mocks como exemplos, não como contratos produtivos.
8. Se uma fonte estiver ausente ou inacessível, marque a lacuna e continue a análise sem inventar seu conteúdo.

### Fronteira do runtime Journey neste workspace

- Para integrações de canal/BFF com a jornada, use como referência pública a fachada `ms-journey-v1` e seus contratos. Não proponha chamada direta do canal a `wf-journey-motor-v1` quando a fachada estiver disponível.
- O Journey Admin é a ferramenta de autoria/POC usada para criar o modelo no formato conhecido, validar, transformar e publicar BPMN base em Camunda sem customizações. Para execução de desenvolvimento, considerar o `wf-journey-motor-v1` customizado e a fachada `ms-journey-v1`.
- Analise e documente explicitamente o caminho do artefato: snapshot da jornada → BPMN produzido pelo admin/POC → export/deployment no motor customizado → alinhamento do registry SDUI usado pela fachada.
- Confirme `processDefinitionKey`, `versionTag`, identidade do deployment e snapshot/telas SDUI da mesma versão. Não declarar integração liberada apenas porque o BPMN publicado na POC funciona.
- Separe o contrato local da fachada (`/journey/v1`) do prefixo interno do motor (`/journey-motor/v1`) e da URL externa/API Gateway. Não assumir que os paths locais são os paths publicados ao canal.
- Para início de jornada publicada pelo portal, inspecione as declarações do nó START e os campos de fachada (`businessKey`, `processDefinitionKey`, `assignee`, `variables`, `channelType`). Não invente o body real do BFF: registre um shape esquemático como hipótese até encontrar contrato ou exemplo confirmado.

### 2. Cruzar comportamento e contratos

Organize a análise para permitir comparar cada requisito com a tela e a integração correspondente:

- requisito/história e item/critério;
- tela, texto, campo, CTA e sequência do Figma;
- sistema chamado, operação, request, response e erro;
- variável de entrada/saída necessária no Journey;
- comportamento observado no script existente, distinguindo mock de arquitetura aprovada.

Registre explicitamente conflitos como tela/CTA diferente, regra de combinação ausente, terminologia divergente, endpoint sem contrato, retry ambíguo, efeito colateral contraditório ou dado de saída sem origem. Para cada conclusão, cite a fonte por nome e seção/ID de tela/operação quando possível.

Separe sempre:

- **Confirmado:** fonte explícita e compatível com as demais.
- **Inferido:** hipótese útil para propor o fluxo, ainda não aprovada.
- **Pendente:** pergunta que requer resposta de produto, arquitetura, integração, canal ou operação.
- **Mock/laboratório:** comportamento presente apenas em massa de teste ou script mockado.

Não transforme inferência em requisito. Não invente URLs, tópicos, IDs de credencial, payloads, política de retry, prazo de timeout ou regra de precedência.

### 3. Criar/atualizar o HTML único

1. Salve um único arquivo em `Analise/dossie-<jornada-ou-feature>.html`, preservando o nome do dossiê existente quando for uma atualização.
2. Para uma análise inicial, inclua: síntese do comportamento, fontes/versões, fluxo funcional resumido, crosswalk de histórias, Figma e divergências, arquitetura/integradores, contratos e variáveis, implicações para Journey Admin, pendências e próximos passos.
3. Inclua o acompanhamento no mesmo HTML:
   - perguntas com IDs estáveis (`Q01`, `Q02`...), prioridade, estado, resposta/decisão e fonte da resposta;
   - estados simples: `Aguardando resposta`, `Respondida`, `Aprovada`, `Implementada` ou `Fechada`;
   - uma tabela de rodadas `RUN-001`, `RUN-002`... com mudança, versão publicada, cenários executados, resultado/evidência e próximo passo;
   - matriz de cenários com IDs estáveis, condição, resultado esperado, fonte e estado (`A validar`, `Passou`, `Falhou`, `Bloqueado` ou `Regra pendente`).
4. Inclua um fluxograma funcional resumido. Use início/fim, processos, decisões em losango, setas e saídas rotuladas. O desenho deve comunicar um caminho principal e seus ramos, não apenas empilhar painéis ou repetir a prosa do dossiê.
5. Coloque os cenários detalhados no fim do documento. Marque visualmente os ramos ainda não decididos e relacione-os aos IDs das perguntas.
6. Preserve a análise já validada ao acrescentar respostas. Atualize o status e o resumo; mantenha o histórico de rodadas, não sobrescreva resultados anteriores.
7. Mantenha o HTML autônomo, responsivo e legível. Se a paleta Vivo já estiver adotada no dossiê, preserve-a; mantenha os temas claro/escuro existentes e valide ambos. Para diagramas largos, evite texto comprimido e garanta uma navegação utilizável em telas estreitas.
8. Não implementar controles de status que pareçam persistir sem realmente salvar. O registro persistente é o próprio HTML versionado; quando o usuário trouxer uma resposta, atualize-o diretamente.

### 4. Conduzir cada ciclo incremental

1. Ao receber uma resposta, identifique o ID da pergunta, registre a resposta, decisão aprovada, fonte/data e impacto no fluxo/cenários. Altere o estado da pergunta.
2. Identifique a menor fatia da jornada liberada por essa resposta. Não espere o fechamento de perguntas sem dependência para começar uma fatia testável.
3. Quando o usuário pedir para construir/publicar, use a skill existente [criar_jornada_publicada](../../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/SKILL.md) e os helpers do Journey Admin. Não duplique suas instruções de implementação.
4. Antes de publicar, confira a origem dos dados, conectores reais versus mockados, IDs de variável, credenciais e impacto de substituir o fluxo vigente. Nunca publique automaticamente em ambiente real sem pedido/contexto explícito e confirmação necessária.
5. Após cada publicação, registre `RUN`, versão/status, alterações, cenários testados e evidências no HTML.
6. Marque cenários como `Passou` ou `Falhou` somente com resultado observado. Se houver diferença entre esperado e observado, mantenha a pergunta/cenário aberto, registre a evidência e crie uma nova pergunta se necessário.
7. Feche uma pergunta/cenário apenas quando a decisão estiver aprovada e a implementação correspondente tiver sido verificada, conforme a natureza do item.
8. Ao republicar, acrescente uma nova rodada; não remova rodadas anteriores nem reescreva a história do resultado.

### 5. Validar e entregar

- Abra o HTML no navegador e verifique visualmente índice, fluxo, tabelas e última seção.
- Verifique que IDs de perguntas/cenários são únicos, links internos funcionam, as fontes citadas existem e o fluxograma precede a matriz final de cenários.
- Teste desktop e celular; confirme que texto não fica cortado e que tabelas/diagramas largos têm tratamento intencional.
- Se o HTML tiver claro/escuro, teste ambos e a persistência da escolha.
- Rode o detector Impeccable se disponível e registre limitações da validação caso esteja degradado.
- Informe o caminho do HTML, o que foi analisado, principais pendências e limites de fonte/acesso. Não afirmar teste/publicação se não executados.

## Estrutura recomendada do dossiê

1. Parecer e estado atual.
2. Acompanhamento: itens abertos, bloqueadores e estado da jornada.
3. Fontes, versões e limitações de acesso.
4. Fluxo funcional de referência e fluxograma resumido.
5. Crosswalk das histórias.
6. Figma: sequência, conteúdo e divergências.
7. Arquitetura e responsabilidades dos componentes.
8. Contratos REST, eventos, correlação e variáveis.
9. Implicações para Journey Admin e diferença entre mocks/real.
10. Pendências/respostas com IDs estáveis.
11. Publicações e testes por RUN.
12. Cenários de validação como última seção.

## Índice local

Para análises e implementação existentes, consulte [README de skills](../README.md), a skill [criar_jornada_publicada](../../../journey/workspace/journey-admin/.claude/skills/criar_jornada_publicada/SKILL.md), os contratos e documentos da própria jornada. Não altere skills existentes como efeito colateral.