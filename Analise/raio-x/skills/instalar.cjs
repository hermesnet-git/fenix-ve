/*
 * Copia as skills do Raio-X para as pastas que cada ferramenta lê na raiz do repositório.
 *   .claude/skills  → Claude Code (o GitHub Copilot e o Cursor também leem)
 *   .agents/skills  → Codex (o GitHub Copilot e o Cursor também leem)
 * A fonte da verdade é esta pasta (Analise/raio-x/skills): edite aqui e rode de novo.
 * Uso (na raiz do repositório): node Analise/raio-x/skills/instalar.cjs [pasta ...]   ex.: .github/skills .cursor/skills
 *                               node Analise/raio-x/skills/instalar.cjs --remover   (apaga as cópias)
 */
const fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '../../..'), args = process.argv.slice(2), remover = args.includes('--remover');
const destinos = args.filter(a => a !== '--remover');
const alvos = destinos.length ? destinos : ['.claude/skills', '.agents/skills'];
const skills = fs.readdirSync(__dirname).filter(d => fs.existsSync(path.join(__dirname, d, 'SKILL.md')));
for (const a of alvos) for (const s of skills) {
  const dst = path.join(raiz, a, s);
  fs.rmSync(dst, { recursive: true, force: true });
  if (!remover) fs.cpSync(path.join(__dirname, s), dst, { recursive: true });
  console.log(remover ? 'removida' : 'instalada', path.relative(raiz, dst).replace(/\\/g, '/'));
}
