# Raio-X · BPMN × DM × Postman × curl (FTAT-933)

Abra `comparativo.html` direto no navegador. Não precisa de servidor.

Uma planilha por integração (INT01 a INT18). A coluna BPMN (`fenix-ve-abertura-bd-v1/fenix-ve-abertura-bd.bpmn`) é a referência; DM, Postman (coleção de 18/11), curl (`postman/curls/`) e a tela de QA (`qa-integracoes/fenix-ve-integracoes.html`) são comparados contra ela. Clique numa célula ou use as setas: o texto completo, a análise e a nota aparecem na faixa de baixo. O endereço guarda o campo (`#int=INT14&campo=R10`).

## Cores

Coluna do código (R01, S01…), a partir de `acao` na análise:

| Cor | Significado | `acao` |
|---|---|---|
| Verde | Tudo certo: o BPMN atende | `nada` |
| Amarelo | Confirmar ou validar com a área, ou ajustar a documentação | `decidir`, `fonte` |
| Vermelho | Ajustar no BPMN | `bpmn` |

Células: vermelho = não consta na fonte ou não implementado no BPMN; amarelo = bate em parte (`r` parcial ou diverge); cinza itálico = "Não envia" (a fonte também não manda, igual ao BPMN).

## Dados

`dados/intNN-*.js` chamam `RAIOX.registrar({ id, nome, endpoint, fontes, grupos, campos })`. Cada campo tem `bpmn` (null = não implementado), `valor`, `fontes: { DM, PM, CURL, QA: { v, r } }` (`r`: igual | parcial | diverge | so-fonte; sem chave = não consta), `leitura`, `acao`, `acaoTexto`. Os arquivos também guardam US, DFT, OAS e TELA, que a página não mostra.

Sem curl: INT10 e INT18. `curls/INT11.json` não é curl: é uma resposta de consulta de troubleTicket (INT03). `curls/INT08.json` é igual ao INT14.json, com o Bearer vazio.

Os ids dos campos são a chave das notas. Não renomeie ids já anotados. Nunca copie tokens, `iss`, senhas ou dados pessoais dos curls para cá.

## Notas

Ficam no `localStorage` (chave `raiox.ftat933.v3`). Use **Exportar notas** para guardar um .json.
