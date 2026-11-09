// Genera los sprites del modo clásico de todas las especies a partir de sus modelos 3D esculpidos.
// Uso: node scripts/sprites.cjs   (necesita Playwright; escribe src/art/bruma-sprites.png y src/art/bruma-sprites.js)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p === '/') p = '/tools/sprites.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
(async () => {
  await new Promise(res => server.listen(0, res));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/sprites.html`);
  await page.waitForFunction(() => window.__atlas || null, null, { timeout: 180000 });
  const atlas = await page.evaluate(() => window.__atlas);
  if (errors.length) throw new Error(errors.join('\n'));
  fs.writeFileSync(path.join(root, 'src/art/bruma-sprites.png'), Buffer.from(atlas.url.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(root, 'src/art/bruma-sprites.js'), `// Generado por scripts/sprites.cjs a partir de los modelos 3D: no editar a mano.\n// Cada especie ocupa dos celdas seguidas del atlas (frente y espalda), ${atlas.cols} celdas por fila de ${atlas.size} px.\nexport const ATLAS = { url: new URL('./bruma-sprites.png', import.meta.url).href, cols: ${atlas.cols}, size: ${atlas.size} };\nexport const ATLAS_SPECIES = ${JSON.stringify(atlas.list)};\n`);
  console.log(`Sprites: ${atlas.list.length} especies en src/art/bruma-sprites.png`);
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
