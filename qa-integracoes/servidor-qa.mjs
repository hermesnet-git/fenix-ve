import http from 'node:http';
import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const DESTINOS = new Set([
  'https://api-hml.telefonica.com.br',
  'https://api-dev.telefonica.com.br',
  'https://cssp-preprod.redecorp.br',
  'https://csin-preprod.redecorp.br',
  'https://spmg-preprod.redecorp.azr',
  'https://spmg-dev.redecorp.azr',
  'https://eljy-preprod.redecorp.azr',
  'https://eljy-dev.redecorp.azr',
  'http://preprod.oss.vivo.com.br',
]);
const METODOS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const HEADERS_IGNORADOS = new Set([
  'host', 'connection', 'content-length', 'transfer-encoding', 'content-encoding',
  'cookie', 'set-cookie', 'origin', 'referer', 'upgrade', 'te', 'trailer',
]);

export function criarServidorQa({ enviar = fetch, log = process.env.QA_LOG } = {}) {
  // Sem headers: o Authorization carrega o token do usuário.
  const registrar = registro => log && appendFile(log, JSON.stringify({ quando: new Date().toISOString(), ...registro }) + '\n').catch(() => {});
  return http.createServer(async (req, res) => {
    const responderErro = (status, mensagem) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-QA-Proxy-Error': 'true' });
      res.end(JSON.stringify({ erro: mensagem }));
    };
    const origem = 'http://' + req.headers.host;
    if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origem)
      || (req.headers.origin && req.headers.origin !== origem)
      || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site']))) {
      responderErro(403, 'Acesso permitido somente pela pagina local de QA.');
      return;
    }
    if (req.method === 'GET' && ['/', '/fenix-ve-integracoes.html'].includes(req.url)) {
      const pagina = await readFile(new URL('./fenix-ve-integracoes.html', import.meta.url));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(pagina);
      return;
    }
    if (req.method !== 'POST' || req.url !== '/qa-proxy') {
      responderErro(404, 'Recurso nao encontrado.');
      return;
    }
    let dados;
    try {
      const partes = [];
      let tamanho = 0;
      for await (const parte of req) {
        tamanho += parte.length;
        if (tamanho > 1024 * 1024) {
          responderErro(413, 'Request maior que 1 MB.');
          return;
        }
        partes.push(parte);
      }
      dados = JSON.parse(Buffer.concat(partes).toString('utf8'));
      const destino = new URL(dados.url);
      if (!DESTINOS.has(destino.origin) || destino.username || destino.password || destino.hash
        || !METODOS.has(dados.method)) {
        responderErro(400, 'Destino ou metodo nao permitido.');
        return;
      }
      if (!dados.headers || typeof dados.headers !== 'object' || Array.isArray(dados.headers)
        || Object.values(dados.headers).some(valor => typeof valor !== 'string')
        || (dados.body !== undefined && typeof dados.body !== 'string')
        || (['GET', 'HEAD'].includes(dados.method) && dados.body !== undefined)
        || !Number.isInteger(dados.timeoutMs) || dados.timeoutMs < 1 || dados.timeoutMs > 30000) {
        responderErro(400, 'Headers, corpo ou timeout invalidos.');
        return;
      }
    } catch {
      responderErro(400, 'Request JSON invalido.');
      return;
    }
    const headers = Object.fromEntries(Object.entries(dados.headers).filter(([nome]) =>
      !HEADERS_IGNORADOS.has(nome.toLowerCase()) && !/^(proxy-|sec-)/i.test(nome)));
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), dados.timeoutMs);
    const inicio = Date.now();
    const base = { method: dados.method, url: dados.url, headers: Object.keys(headers), requestBody: dados.body?.slice(0, 20000) };
    res.on('close', () => { if (!res.writableEnded) controlador.abort(); });
    try {
      const resposta = await enviar(dados.url, {
        method: dados.method, headers, body: dados.body, redirect: 'manual', signal: controlador.signal,
      });
      const corpo = Buffer.from(await resposta.arrayBuffer());
      const headersResposta = Object.fromEntries([...resposta.headers].filter(([nome]) =>
        !HEADERS_IGNORADOS.has(nome.toLowerCase()) && !nome.toLowerCase().startsWith('access-control-')));
      res.writeHead(resposta.status, { ...headersResposta, 'Cache-Control': 'no-store', 'X-QA-Transport': 'local' });
      res.end(corpo);
      registrar({ ...base, status: resposta.status, ms: Date.now() - inicio, responseBody: corpo.toString('utf8').slice(0, 20000) });
    } catch (erro) {
      registrar({ ...base, status: controlador.signal.aborted ? 504 : 502, ms: Date.now() - inicio, erro: String(erro?.cause?.code || erro?.message || erro) });
      if (!res.destroyed) responderErro(controlador.signal.aborted ? 504 : 502,
        controlador.signal.aborted ? 'Timeout ao consultar a API.' : 'Falha de rede ou TLS ao consultar a API. Verifique a VPN.');
    } finally {
      clearTimeout(timer);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  criarServidorQa().listen(8765, '127.0.0.1', () => {
    console.log('QA Fenix: http://127.0.0.1:8765/fenix-ve-integracoes.html');
  });
}