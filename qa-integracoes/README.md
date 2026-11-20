# QA das integracoes Fenix VE

## Executar no navegador

Na raiz do Fenix-VE, com Node.js 22 ou superior:

```sh
node qa-integracoes/servidor-qa.mjs
```

Abra http://127.0.0.1:8765/fenix-ve-integracoes.html.

Informe o token, selecione a integracao e execute somente a consulta desejada.
VPN e acesso aos servicos de preprod continuam necessarios.

Nesse endereco, o navegador chama o servidor local, que encaminha a requisicao
para a API com os headers e o corpo montados na pagina. Nao e necessario
desabilitar a seguranca do navegador. O status, os headers e o corpo recebidos
da API sao preservados: 206 com tickets e exibido como resposta parcial;
204 continua vazio. Erros do transporte local sao identificados separadamente.

O servidor escuta apenas em 127.0.0.1, aceita somente os destinos conhecidos
das integracoes e nao grava tokens nem corpos das requisicoes em arquivos ou logs.
URLs personalizadas fora dessa lista sao recusadas pelo servidor local.
INT14, INT18 e INT16 continuam sendo operacoes de escrita real; nao as execute
apenas para verificar conectividade.

Abrir o HTML por `file://` mantem o modo antigo, com chamadas diretas do navegador
sujeitas a CORS. Para o transporte local, use o endereco HTTP acima.

Para encerrar o servidor, pressione Ctrl+C no terminal em que foi iniciado.

## Testes

```sh
node --test qa-integracoes/servidor-qa.test.mjs
```