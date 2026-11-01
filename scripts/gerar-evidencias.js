const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const newman = require('newman');

const raiz = path.resolve(__dirname, '..');
const caminhoColecao = path.join(raiz, 'postman', 'api-pedidos.postman_collection.json');
const pastaEvidencias = path.join(raiz, 'evidencias');
const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

function localizarEdge() {
  const candidatos = [
    process.env.EDGE_PATH,
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);

  const edge = candidatos.find((candidato) => fs.existsSync(candidato));
  if (!edge) {
    throw new Error('Microsoft Edge não encontrado. Instale o Edge ou defina EDGE_PATH para gerar as capturas PNG.');
  }

  return edge;
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatarJson(texto) {
  try {
    return JSON.stringify(JSON.parse(texto), null, 2);
  } catch {
    return texto || '(sem corpo)';
  }
}

function criarPagina(execution) {
  const request = execution.request;
  const response = execution.response;
  const corpoRequisicao = request.body && request.body.raw
    ? request.body.raw
    : '(sem corpo)';
  const corpoResposta = response.stream
    ? response.stream.toString('utf8')
    : '';
  const url = request.url.toString();
  const status = `${response.code} ${response.status}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escaparHtml(execution.item.name)} - Newman</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: #f3f5f8; color: #17212b; font: 16px "Segoe UI", Arial, sans-serif; }
  main { width: 100%; max-width: 1320px; margin: auto; padding: 34px 40px; background: #fff; border: 1px solid #dfe4ea; border-radius: 14px; }
  .brand { margin: 0 0 24px; color: #536273; font-size: 15px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0 0 26px; font-size: 30px; }
  .request { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
  .method { min-width: 82px; padding: 8px 12px; border-radius: 6px; background: #e7f2ff; color: #0756a5; font-weight: 700; text-align: center; }
  .url { overflow-wrap: anywhere; padding-top: 7px; font: 16px Consolas, monospace; }
  .status { display: inline-block; margin-bottom: 18px; padding: 8px 12px; border-radius: 6px; background: #e8f7ed; color: #146b32; font-weight: 700; }
  h2 { margin: 22px 0 8px; font-size: 17px; }
  pre { margin: 0; padding: 16px; overflow-wrap: anywhere; white-space: pre-wrap; border-radius: 8px; background: #f5f7fa; border: 1px solid #e3e7ed; color: #263445; font: 15px/1.5 Consolas, monospace; }
  footer { margin-top: 24px; color: #5a6877; font-size: 13px; }
</style>
</head>
<body>
<main>
  <p class="brand">API de Gerenciamento de Pedidos · Execução Newman</p>
  <h1>${escaparHtml(execution.item.name)}</h1>
  <div class="request"><span class="method">${escaparHtml(request.method)}</span><span class="url">${escaparHtml(url)}</span></div>
  <div class="status">HTTP ${escaparHtml(status)}</div>
  <h2>Corpo enviado</h2>
  <pre>${escaparHtml(formatarJson(corpoRequisicao))}</pre>
  <h2>Resposta real da API</h2>
  <pre>${escaparHtml(formatarJson(corpoResposta))}</pre>
  <footer>Captura renderizada a partir da requisição e resposta desta execução real do Newman.</footer>
</main>
</body>
</html>`;
}

async function executarColecao() {
  const collection = JSON.parse(fs.readFileSync(caminhoColecao, 'utf8'));
  const variavelBase = collection.variable.find((variavel) => variavel.key === 'baseUrl');
  variavelBase.value = baseUrl;

  return new Promise((resolve, reject) => {
    newman.run({ collection, reporters: ['cli'] }, (erro, summary) => {
      if (erro) {
        reject(erro);
        return;
      }

      if (summary.run.failures.length > 0) {
        reject(new Error(`${summary.run.failures.length} verificação(ões) Newman falharam; confira a saída acima.`));
        return;
      }

      resolve(summary.run.executions);
    });
  });
}

async function main() {
  const edge = localizarEdge();
  const executions = await executarColecao();
  if (executions.length !== 5) {
    throw new Error(`Esperadas 5 requisições Newman; foram executadas ${executions.length}.`);
  }

  fs.mkdirSync(pastaEvidencias, { recursive: true });
  const pastaTemporaria = fs.mkdtempSync(path.join(os.tmpdir(), 'evidencias-newman-'));

  try {
    for (const [indice, execution] of executions.entries()) {
      const nome = `${String(indice + 1).padStart(2, '0')}-${execution.item.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}.png`;
      const htmlPath = path.join(pastaTemporaria, `${indice + 1}.html`);
      const pngPath = path.join(pastaEvidencias, nome);

      fs.writeFileSync(htmlPath, criarPagina(execution), 'utf8');
      execFileSync(edge, [
        '--headless',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--hide-scrollbars',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=1000',
        '--window-size=1440,1200',
        `--user-data-dir=${path.join(pastaTemporaria, 'edge-profile')}`,
        `--screenshot=${pngPath}`,
        pathToFileURL(htmlPath).href,
      ], { stdio: 'ignore', timeout: 45000 });

      if (!fs.existsSync(pngPath) || fs.statSync(pngPath).size === 0) {
        throw new Error(`O Edge não gerou a captura esperada: ${pngPath}`);
      }

      console.log(`Captura Newman salva: evidencias/${nome}`);
    }
  } finally {
    fs.rmSync(pastaTemporaria, { recursive: true, force: true });
  }
}

main().catch((erro) => {
  console.error(`Falha ao gerar evidências Newman: ${erro.message}`);
  process.exitCode = 1;
});
