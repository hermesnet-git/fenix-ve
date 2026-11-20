const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const tools = createRequire('/tmp/fenix-mapeamento-tools/package.json');
const ExcelJS = tools('exceljs');
const { XMLParser } = tools('fast-xml-parser');
const { PDFParse } = tools('pdf-parse');
const root = path.resolve(__dirname, '../..');
const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: true });
const unzip = (file, entry) => execFileSync('unzip', ['-p', file, entry], { maxBuffer: 40 * 1024 * 1024 }).toString();
const textNodes = (value, key) => {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([name, child]) => name === key
    ? [Array.isArray(child) ? child.map(item => item['#text'] ?? '').join('') : String(child)]
    : textNodes(child, key));
};
const cellText = value => {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  if (value.richText) return value.richText.map(part => part.text).join('');
  return String(value.text ?? value.result ?? value.formula ?? JSON.stringify(value));
};
async function main() {
  const result = { generatedAt: new Date().toISOString(), workbooks: [], documents: [], pdf: [] };
  for (const name of fs.readdirSync(root).filter(name => name.endsWith('.xlsx') && !name.startsWith('~$'))) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(root, name));
    const sheets = workbook.worksheets.map(sheet => {
      const rows = [];
      sheet.eachRow((row, number) => {
        const cells = [];
        row.eachCell((cell, column) => {
          if (cell.isMerged && cell.address !== cell.master.address) return;
          const text = cellText(cell.value).trim();
          if (text) cells.push({ address: cell.address, column, text });
        });
        if (cells.length) rows.push({ number, cells });
      });
      return { name: sheet.name, state: sheet.state, rows };
    });
    result.workbooks.push({ file: name, sheets });
  }
  const storyDir = fs.readdirSync(root).find(name => name.startsWith('Hist'));
  for (const name of fs.readdirSync(path.join(root, storyDir)).filter(name => name.endsWith('.docx'))) {
    const xml = unzip(path.join(root, storyDir, name), 'word/document.xml');
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((match, index) => ({
      paragraph: index + 1, text: textNodes(parser.parse(match[0]), 'w:t').join(' ')
    })).filter(item => item.text);
    result.documents.push({ file: path.join(storyDir, name), paragraphs });
  }
  for (const name of fs.readdirSync(root).filter(name => name.endsWith('.pptx') && !name.startsWith('~$'))) {
    const entries = execFileSync('unzip', ['-Z1', path.join(root, name)]).toString().split('\n')
      .filter(entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry));
    const slides = entries.map(entry => ({ slide: Number(entry.match(/slide(\d+)/)[1]),
      text: textNodes(parser.parse(unzip(path.join(root, name), entry)), 'a:t').join('\n')
    })).sort((first, second) => first.slide - second.slide);
    result.documents.push({ file: name, slides });
  }
  for (const name of fs.readdirSync(root).filter(name => name.endsWith('.pdf'))) {
    const pdf = new PDFParse({ data: new Uint8Array(fs.readFileSync(path.join(root, name))) });
    const extracted = await pdf.getText();
    result.pdf.push({ file: name, pages: extracted.pages.map(page => ({ page: page.num, text: page.text })) });
    await pdf.destroy();
  }
  fs.writeFileSync(path.join(__dirname, 'fontes-extraidas.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ workbooks: result.workbooks.map(book => ({ file: book.file,
    sheets: book.sheets.map(sheet => ({ name: sheet.name, rows: sheet.rows.length })) })),
    documents: result.documents.map(doc => ({ file: doc.file, sections: (doc.paragraphs ?? doc.slides).length })),
    pdf: result.pdf.map(doc => ({ file: doc.file, pages: doc.pages.length })) }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });