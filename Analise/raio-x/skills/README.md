# Skills do Raio-X

Duas skills para o trabalho de análise feito no Raio-X (`../comparativo.html`), no formato aberto de Agent Skills (`SKILL.md` com `name` e `description`). Funcionam no Claude Code, no GitHub Copilot, no Codex e no Cursor.

| Skill | Para quê |
|---|---|
| [raio-x-analise](raio-x-analise/SKILL.md) | Criar ou atualizar a planilha de uma integração: BPMN × DM × US × Postman × curl × QA em `../dados/*.js`. Traz os briefs para dividir o trabalho entre agentes em segundo plano: integração inteira, coluna US e ligação com o DM. |
| [raio-x-lote](raio-x-lote/SKILL.md) | Aplicar o lote de ajustes revisados (`../dados/saidas/lote-ajustes-*.md`) no BPMN e na collection e marcar os itens como `aplicado` em `../dados/revisao.js`. |

As duas usam `../validar.cjs` para conferir os dados (ids, grupos, valores, referências ao DM, revisão órfã e dado sensível) e `../gerar-dm.cjs` para o índice dos DMs.

## Instalar

As ferramentas só procuram skills em pastas próprias, na raiz do repositório. Esta pasta é a fonte da verdade; o instalador copia as skills para lá:

```
node Analise/raio-x/skills/instalar.cjs
```

| Pasta | Quem lê |
|---|---|
| `.claude/skills/` | Claude Code, GitHub Copilot, Cursor |
| `.agents/skills/` | Codex, GitHub Copilot, Cursor |

- Copilot e Cursor leem as duas pastas e podem listar cada skill duas vezes. As duas cópias são iguais.
- Para incluir outras pastas, passe-as como argumento: `node Analise/raio-x/skills/instalar.cjs .github/skills .cursor/skills`.
- `--remover` apaga as cópias.
- Depois de editar uma skill aqui, rode o instalador de novo. As cópias não se atualizam sozinhas.
- Para o Copilot cloud agent (que roda no GitHub), as cópias precisam estar commitadas.

## Usar

- Peça em linguagem natural ("analise a INT16 no Raio-X", "aplique o lote de hoje"): a ferramenta escolhe a skill pela `description`.
- Também dá para chamar pelo nome: `/raio-x-analise` no Claude Code, `$raio-x-analise` no Codex, ou `/` no chat do Copilot e do Cursor.
- **Agentes em segundo plano:** os briefs em [raio-x-analise/referencias](raio-x-analise/referencias/) são autocontidos. Preencha os marcadores (`<INT>`, `<ARQUIVO>`, `<ARQUIVOS>`) e entregue a um subagente ou agente em segundo plano da ferramenta. A tabela "Trabalho em paralelo" da skill diz como em cada uma. Regra: um agente por arquivo de dados, nunca dois no mesmo.
