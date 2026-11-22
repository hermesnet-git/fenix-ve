# Lote de ajustes · 2026-11-22

Arquivos:
- BPMN: `fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn`

Instruções para o agente:
- Cada item tem a anotação de quem revisou (o que fazer) e o contexto da linha, copiado da análise do Raio-X.
- Aplique só onde o item pede (BPMN e/ou collection) e só o que a anotação diz. Não altere mais nada.
- Se a anotação faltar ou estiver ambígua, ou se o contexto não bater com o arquivo, não aplique: liste o item no fim, com o motivo.
- Não copie tokens, o valor do header iss, senhas nem dados pessoais para nenhum arquivo.
- Ao terminar, em `Analise/raio-x/dados/revisao.js`, mude o status de cada item aplicado para "aplicado" e preencha "aplicadoEm" (ISO) e "commit".
- Ajustes de documentação não entram aqui: saem na lista de pendências de documentação, para o time responsável.

1 item(ns).

### INT00:S01 · HTTP 200 / 206 (status) · INT00 Consulta Asset
- **Ajustar em:** BPMN
- **O que fazer (anotação):** (sem anotação: não aplicar)
- Hoje no BPMN: não implementado
- Origem do valor no BPMN: o BPMN não vê o status; recebe só o START
- PM (postman/fenix-ve-jornada-preprod-2026-11-18.postman_collection.json): Teste aceita 200 e 206 e exige lista content [igual]
- CURL (postman/curls/INT00.sh): Resposta exemplo sem status HTTP; corpo com content[] de 2 itens [parcial]
- QA (qa-integracoes/fenix-ve-integracoes.html): esperado [200, 206]. Evidência 19/11: 200, 2 itens (Internet e Acesso), ambos "Ativo" [igual]
- Análise: Postman e QA aceitam 206, mas nenhuma fonte explica o que ele significa. Se for resposta paginada, um cliente com muitos produtos pode ficar sem o item certo na lista.
- Ação sugerida na análise: Confirmar com o dono do Asset o significado do 206 e se há paginação.
- De onde saiu a linha: Postman teste · QA esperado · evidência 19/11
- Revisado em: 2026-11-22
