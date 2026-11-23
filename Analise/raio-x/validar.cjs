/*
 * Raio-X · confere os arquivos de dados antes de commitar.
 * Uso (na raiz do repositório): node Analise/raio-x/validar.cjs [arquivo.js ...]   (sem argumentos: todos)
 * Verifica: ids únicos, grupos existentes, valores permitidos (r, acao, valor.t), referências ao DM
 * presentes em dados/dm.js, chaves da revisão que apontam para linhas inexistentes, scripts faltando no
 * comparativo.html e dado sensível (e-mail, CPF, telefone, Bearer/JWT). CNPJ não entra: os dos exemplos são fictícios. Sai com código 1 se houver erro.
 */
const fs = require('fs'), path = require('path'), D = path.join(__dirname, 'dados');
global.RAIOX = { ints: [], registrar(d) { this.ints.push(d); }, dm(x) { this.dmi = x; }, revisao(r) { this.rev = r; } };
require(path.join(D, 'dm.js')); require(path.join(D, 'revisao.js'));
const pedidos = process.argv.slice(2).map(f => path.basename(f));
const arqs = fs.readdirSync(D).filter(f => f.endsWith('.js') && !['dm.js', 'revisao.js'].includes(f));
const erros = [], avisos = [], de = {};
for (const f of arqs) { const n = RAIOX.ints.length; require(path.join(D, f)); de[RAIOX.ints[n].id] = f; }

const R = ['igual', 'parcial', 'diverge', 'so-fonte', undefined], A = ['nada', 'decidir', 'fonte', 'bpmn'];
const T = ['start', 'tela', 'integracao', 'gerado', 'fixo', 'config', 'resposta', 'nenhum'];
const SENS = [
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, m => /exemplo|email\.com$/i.test(m), 'e-mail'],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, m => !/[1-9]/.test(m), 'CPF'],
  [/\(\d{2}\)\s?9?\d{4}-?\d{4}/g, m => !/[1-9]/.test(m.slice(4)), 'telefone'],
  [/Bearer\s+[A-Za-z0-9._-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, () => false, 'token'],
];
const html = fs.readFileSync(path.join(__dirname, 'comparativo.html'), 'utf8');

for (const d of RAIOX.ints) {
  const f = de[d.id]; if (pedidos.length && !pedidos.includes(f)) continue;
  const e = m => erros.push(`${f} ${m}`), g = new Set(d.grupos.map(x => x.id)), vistos = new Set();
  const dmArq = d.fontes.find(x => x.id === 'DM')?.arquivo;
  if (!html.includes(`dados/${f}`)) e('não está nos <script> do comparativo.html');
  for (const c of d.campos) {
    const k = `${c.id}`;
    if (vistos.has(c.id)) e(`${k}: id repetido`); vistos.add(c.id);
    if (!g.has(c.grupo)) e(`${k}: grupo "${c.grupo}" não existe`);
    if (!A.includes(c.acao)) e(`${k}: acao "${c.acao}" inválida`);
    if (c.acao !== 'nada' && !c.acaoTexto) e(`${k}: acao ${c.acao} sem acaoTexto`);
    if (c.valor && !T.includes(c.valor.t)) e(`${k}: valor.t "${c.valor.t}" inválido`);
    for (const [F, v] of Object.entries(c.fontes || {})) if (!R.includes(v.r)) e(`${k}: fontes.${F}.r "${v.r}" inválido`);
    for (const r of c.dm || []) {
      const a = RAIOX.dmi[r.arquivo || dmArq]?.[r.aba];
      if (!a?.linhas.some(l => l[0] === r.linha)) e(`${k}: DM ${r.arquivo || ''} "${r.aba}" linha ${r.linha} não está em dm.js`);
    }
    if (c.dm && !c.fontes?.DM) avisos.push(`${f} ${k}: tem dm[] mas não tem fontes.DM`);
  }
  const txt = fs.readFileSync(path.join(D, f), 'utf8');
  for (const [re, ok, nome] of SENS) for (const m of txt.match(re) || []) if (!ok(m)) e(`possível ${nome}: ${m.slice(0, 6)}…`);
}
for (const k of Object.keys(RAIOX.rev?.itens || {})) {
  const [i, id] = k.split(':'), d = RAIOX.ints.find(x => x.id === i);
  if (!d?.campos.some(c => c.id === id)) erros.push(`revisao.js ${k}: linha não existe nos dados (id renomeado?)`);
}
avisos.forEach(a => console.log('aviso:', a));
erros.forEach(a => console.log('ERRO:', a));
console.log(`${RAIOX.ints.length} integrações, ${RAIOX.ints.reduce((s, d) => s + d.campos.length, 0)} linhas · ${erros.length} erro(s), ${avisos.length} aviso(s)`);
process.exit(erros.length ? 1 : 0);
