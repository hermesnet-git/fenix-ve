/*
 * Raio-X · índice dos DMs (PreDataMapping*.xlsx da raiz do repositório) para o painel de detalhe.
 * Gera dados/dm.js com, por arquivo e aba: a linha do cabeçalho ("Nome do Campo"), as colunas (letra → título)
 * e cada linha abaixo dele com o número real no Excel e as células não vazias.
 * Exemplos com cara de dado pessoal (CPF, telefone, e-mail) são mascarados. CNPJ fica: os dos exemplos são fictícios.
 * Uso (na raiz do repositório): node Analise/raio-x/gerar-dm.cjs   · requer `unzip` no PATH (Git Bash tem)
 */
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '../..'), saida = path.join(__dirname, 'dados', 'dm.js');
const unzip = (f, p) => { try { return execFileSync('unzip', ['-p', f, p], { maxBuffer: 1 << 28 }).toString('utf8'); } catch { return ''; } };
const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&amp;/g, '&');
const txt = x => dec([...x.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1]).join(''));
const mascara = s => s
  .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, 'email@exemplo')
  .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, m => m.replace(/\d/g, '0'))          // CPF
  .replace(/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, m => m.replace(/\d/g, '0'));          // telefone

const out = {};
for (const nome of fs.readdirSync(raiz).filter(f => /^PreDataMapping.*\.xlsx$/i.test(f) && !f.startsWith('~$'))) {
  const f = path.join(raiz, nome);
  const ss = [...unzip(f, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => txt(m[1]));
  const wb = unzip(f, 'xl/workbook.xml'), rels = unzip(f, 'xl/_rels/workbook.xml.rels'), abas = {};
  for (const m of wb.matchAll(/<sheet ([^>]*)\/?>/g)) {
    const at = k => (m[1].match(new RegExp(k + '="([^"]*)"')) || [])[1];
    const aba = dec(at('name')), rid = at('r:id');
    const tgt = (rels.match(new RegExp('Id="' + rid + '"[^>]*Target="([^"]+)"')) || rels.match(new RegExp('Target="([^"]+)"[^>]*Id="' + rid + '"')))[1];
    const xml = unzip(f, 'xl/' + tgt.replace(/^\/?xl\//, '')), linhas = [];
    for (const r of xml.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const cel = {};
      for (const c of r[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const b = c[3] || ''; let v = '';
        if (/t="s"/.test(c[2])) { const i = b.match(/<v>(\d+)<\/v>/); v = i ? ss[+i[1]] : ''; }
        else if (/t="inlineStr"/.test(c[2])) v = txt(b);
        else { const i = b.match(/<v>([\s\S]*?)<\/v>/); v = i ? dec(i[1]) : ''; }
        v = v.trim(); if (v) cel[c[1]] = mascara(v);
      }
      if (Object.keys(cel).length) linhas.push([+r[1], cel]);
    }
    const ih = linhas.findIndex(([, c]) => Object.values(c).some(v => /^Nome do Campo$/i.test(v)));
    if (ih < 0) continue;  /* aba sem tabela de campos (capa, controle de versão…) */
    abas[aba] = { oculta: at('state') === 'hidden' || undefined, cab: linhas[ih][1], linhaCab: linhas[ih][0], linhas: linhas.slice(ih + 1) };
  }
  /* a chave é o nome correto: no disco os acentos estão gravados como "╠ü", "╠â", "╠º" (marcas NFD lidas em cp437) */
  out[nome.replace(/╠ü/g, '\u0301').replace(/╠â/g, '\u0303').replace(/╠º/g, '\u0327').normalize('NFC')] = abas;
}
fs.writeFileSync(saida, '/* gerado por ../gerar-dm.cjs a partir dos PreDataMapping*.xlsx; não edite à mão */\nRAIOX.dm(' + JSON.stringify(out) + ');\n');
console.log('dm.js:', Object.entries(out).map(([n, a]) => `${n.slice(29, 70)} (${Object.keys(a).length} abas, ${Object.values(a).reduce((s, x) => s + x.linhas.length, 0)} linhas)`).join('\n'), '\n', (fs.statSync(saida).size / 1024).toFixed(0) + ' KB');
