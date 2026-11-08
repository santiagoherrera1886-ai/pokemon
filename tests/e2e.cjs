/**
 * Prueba de punta a punta en Chromium real (Playwright).
 * Juega la Etapa 1 completa con entradas de teclado reales (sin teletransportes),
 * comprueba puertas, colisiones, diálogos, combate, captura, tienda, curación, guardado y controles táctiles,
 * y guarda capturas en tests/screenshots/.
 *
 *   npm install && npx playwright install chromium && npm test
 */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GRAPHICS_MODE = process.env.GRAPHICS_MODE || 'premium';
const SHOTS = path.join(__dirname, 'screenshots', GRAPHICS_MODE);
fs.mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('  ·', ...a);
let page, errors = [], shotN = 0;

const st = () => page.evaluate(() => { const g = __game, s = g.state; return { map: s.map, x: s.x, y: s.y, dir: s.dir, story: s.story, scene: g.scene, money: s.money, bag: { ...s.bag }, party: s.party.map(c => ({ sp: c.sp, hp: c.hp, max: c.stats.hp, level: c.level })), dialog: !!__ui.dialog, modal: !!(__ui.panel && __ui.panel.modal), locked: g.ow.locked, moving: !!g.ow.player.moving }; });
async function shot(name) { await sleep(120); await page.screenshot({ path: path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`) }); }
async function tap(key, hold = 70) { await page.keyboard.down(key); await sleep(hold); await page.keyboard.up(key); await sleep(40); }

// Avanza todos los diálogos pendientes (sin responder preguntas).
async function advance(max = 80) {
  for (let i = 0; i < max; i++) {
    const s = await st();
    if (s.dialog && !(await page.evaluate(() => __ui.dialog && __ui.dialog.keep))) { await tap('z', 40); continue; }
    if (s.locked || s.scene !== 'overworld') { await sleep(120); continue; }
    return;
  }
}
async function waitIdle(ms = 8000) {
  const t = Date.now();
  while (Date.now() - t < ms) { const s = await st(); if (!s.locked && !s.moving && s.scene === 'overworld') return; if (s.dialog) await tap('z', 40); await sleep(80); }
}

// Ruta BFS usando las colisiones reales del juego; la caminata se hace con teclas reales.
async function pathTo(tx, ty, mapId, opts = {}) {
  return page.evaluate(([tx, ty, mapId, avoidGrass, adjacent]) => {
    const ow = __game.ow, m = ow.map;
    if (mapId && mapId !== m.id) { const o = ow.world.get(mapId).origin; tx += o[0] - m.origin[0]; ty += o[1] - m.origin[1]; }
    const sx = ow.player.x, sy = ow.player.y, D = [[0, 1, 'ArrowDown'], [0, -1, 'ArrowUp'], [-1, 0, 'ArrowLeft'], [1, 0, 'ArrowRight']];
    const goal = (x, y) => adjacent ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : (x === tx && y === ty);
    const tileAt = (x, y) => { const [mm, lx, ly] = ow.resolve(x, y); return mm && mm.at(lx, ly); };
    for (const allowGrass of avoidGrass ? [false, true] : [true]) {
      const prev = new Map([[sx + ',' + sy, null]]); const q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.shift();
        if (goal(x, y)) { const out = []; let k = x + ',' + y; while (prev.get(k)) { const [pk, key] = prev.get(k); out.unshift(key); k = pk; } return { steps: out, face: adjacent ? D.find(d => x + d[0] === tx && y + d[1] === ty)[2] : null }; }
        for (const [dx, dy, key] of D) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (prev.has(k) || Math.abs(nx - sx) > 70 || Math.abs(ny - sy) > 70) continue;
          if (ow.blocked(nx, ny, ow.player) && !(goal(nx, ny) && !adjacent)) continue;
          if (!allowGrass && tileAt(nx, ny) === 'g') continue;
          prev.set(k, [x + ',' + y, key]); q.push([nx, ny]);
        }
      }
    }
    return null;
  }, [tx, ty, mapId, opts.avoidGrass !== false, !!opts.adjacent]);
}
async function step(key) {
  // Mantiene la tecla solo hasta que arranca el paso (evita pasos de más), luego espera a que termine.
  const a = await st();
  await page.keyboard.down(key);
  const t = Date.now();
  while (Date.now() - t < 700) {
    const b = await st();
    if (b.moving || b.x !== a.x || b.y !== a.y || b.map !== a.map || b.dialog || b.locked) break;
    await sleep(10);
  }
  await page.keyboard.up(key);
  await waitIdle();
}
async function face(key) {
  const dir={ArrowDown:0,ArrowUp:1,ArrowLeft:2,ArrowRight:3}[key];
  if((await st()).dir===dir)return;
  await page.keyboard.down(key);
  try { await page.waitForFunction(dir=>__game.ow.player.dir===dir,dir,{timeout:3000}); }
  finally { await page.keyboard.up(key); }
  await waitIdle();
}
async function walkTo(x, y, mapId, opts = {}) {
  mapId = mapId || (await st()).map;
  // Replan from the observed position after every real step. Wandering NPCs and
  // late key-up events can invalidate a precomputed sequence; never report an
  // arrival merely because that sequence was exhausted.
  for (let leg = 0; leg < 350; leg++) {
    const before=await st();
    if(before.scene!=='overworld')return before;
    const r = await pathTo(x, y, mapId, opts);
    assert.ok(r, `no hay ruta hacia ${mapId} (${x},${y})`);
    if(!r.steps.length){
      if(r.face){
        await face(r.face);
        const end=await st();
        if(end.map!==mapId || Math.abs(end.x-x)+Math.abs(end.y-y)!==1)continue;
      }
      return st();
    }
    await step(r.steps[0]);
    const after=await st();
    if(after.map!==before.map){
      const outdoor=await page.evaluate(([a,b])=>__game.world.get(a).outdoor&&__game.world.get(b).outdoor,[before.map,after.map]);
      if(!outdoor)return after; // puerta o escalera real
    }
    if(after.scene!=='overworld')return after;
  }
  assert.fail(`no se llegó a ${mapId} (${x},${y}): ${JSON.stringify(await st())}`);
}
async function talk() { await tap('z'); await sleep(250); }
async function choose(i) { await page.waitForSelector(`#botui [data-act="${i}"]`); await sleep(150); await page.click(`#botui [data-act="${i}"]`); await sleep(150); }
async function fightUntilOver(moveIdx = 0, maxTurns = 30) {
  for (let t = 0; t < maxTurns; t++) {
    const s = await st();
    if (s.scene !== 'battle' && s.scene !== 'flash') return;
    const fight = await page.$('#botui [data-act="fight"]');
    if (fight) { await fight.click(); await sleep(120); await page.click(`#botui [data-act="${moveIdx}"]`); }
    await sleep(400);
  }
}

async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    // ---------------------------------------------------------- Escritorio, teclado
    page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await page.addInitScript(()=>{let seed=78021;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(url);
    await page.evaluate(mode => { localStorage.clear(); localStorage.setItem('alborada-graphics-v1', JSON.stringify({mode, quality:'low'})); }, GRAPHICS_MODE);
    await page.reload(); await sleep(600);
    await shot('titulo');
    await page.click('#botui [data-act="new"]');
    await page.fill('#pname', 'Santi');
    await page.click('#botui [data-act="ok"]');
    await sleep(900);
    await shot('cuarto-intro');
    await advance();
    if (GRAPHICS_MODE === 'premium') { await page.waitForFunction(() => __game.graphics.status === 'ready'); assert.ok(await page.locator('#premium').isVisible()); }
    let s = await st();
    assert.equal(s.map, 'cuarto'); assert.equal(s.story, 0);
    log('arranque en el cuarto OK');

    // Colisión: la cama está a la izquierda del jugador (2,4)->(1,4) libre, (0,3) es cama
    await walkTo(1, 3);
    await step('ArrowLeft');
    s = await st(); assert.deepEqual([s.x, s.y], [1, 3], 'no debe atravesar la cama');
    await step('ArrowUp');
    s = await st(); assert.deepEqual([s.x, s.y], [1, 2], 'puede pararse frente a la pared');
    await step('ArrowUp');
    s = await st(); assert.deepEqual([s.x, s.y], [1, 2], 'no debe atravesar la pared');
    log('colisiones de muebles y paredes OK');

    // Interacción con objeto (computadora en (2..3,2))
    await walkTo(2, 3); await face('ArrowUp'); await talk();
    assert.ok((await st()).dialog, 'la computadora debe mostrar texto');
    await shot('cuarto-pc'); await advance();

    // Escaleras -> planta baja -> mamá
    await walkTo(8, 2);
    await sleep(600);
    s = await st(); assert.equal(s.map, 'casa1');
    await shot('casa-mama');
    await advance();
    s = await st(); assert.equal(s.story, 1, 'mamá debe pedir ir donde Nico');
    log('escaleras y escena de mamá OK');

    // Bloqueo norte antes de hablar con Nico
    await walkTo(5, 7);
    s = await st(); assert.equal(s.map, 'brisal'); assert.deepEqual([s.x, s.y], [5, 8]);
    await shot('pueblo-brisal');
    await walkTo(11, 2);
    await step('ArrowUp');
    await advance();
    s = await st(); assert.ok(s.y >= 2, 'el niño debe bloquear la salida norte');
    log('salida de casa y bloqueo norte OK');

    // Casa de Nico
    await walkTo(18, 7);
    await sleep(500); s = await st(); assert.equal(s.map, 'casa2');
    await shot('casa-nico');
    await walkTo(8, 4, null, { adjacent: true }); await talk(); await advance();
    await walkTo(1, 2); await sleep(500);
    s = await st(); assert.equal(s.map, 'casa2f2');
    await walkTo(4, 3, null, { adjacent: true }); await talk();
    await shot('cuarto-nico'); await advance();
    s = await st(); assert.equal(s.story, 2);
    log('Nico en su cuarto OK');
    await walkTo(0, 2); await sleep(400);
    await walkTo(5, 7); await sleep(400);
    s = await st(); assert.equal(s.map, 'brisal');

    // Sendero 1 (transición continua entre mapas exteriores)
    await walkTo(19, 13, 'sendero1');
    await advance();
    s = await st(); assert.equal(s.map, 'sendero1');
    await shot('sendero-1');
    log('transición continua Brisal -> Sendero 1 OK');
    // Sin criatura no se puede entrar al pasto alto
    await walkTo(10, 7);
    await step('ArrowUp'); await advance();
    s = await st(); assert.equal(s.y, 7, 'el pasto alto debe estar bloqueado sin criatura');

    // Lago Espejo, escena de la profesora, maletín, inicial y primer combate
    await walkTo(17, 11, 'lago'); await advance(200);
    await shot('lago-espejo');
    await walkTo(12, 12, 'lago');
    for (let i = 0; i < 40 && !(await page.$('#botui [data-act="charquin"]')); i++) { await tap('z', 40); await sleep(150); }
    await shot('eleccion-inicial');
    await choose('charquin');
    for (let i = 0; i < 10 && !(await page.$('#botui .choice')); i++) { await tap('z', 40); await sleep(120); }
    await choose(0);
    for (let i = 0; i < 60 && (await st()).scene !== 'battle'; i++) { await tap('z', 40); await sleep(100); }
    await sleep(2500);
    await shot('combate-pipiu');
    await fightUntilOver(0);
    await advance(200);
    s = await st();
    assert.equal(s.story, 3); assert.equal(s.party[0].sp, 'charquin');
    log('inicial elegido y primer combate ganado OK');

    // Regreso a casa
    await walkTo(5, 7, 'brisal'); await sleep(500);
    await advance(200);
    s = await st(); assert.equal(s.story, 4, 'mamá debe dar las zapatillas');
    log('regreso a casa OK');
    await walkTo(5, 7); await sleep(400);

    // Correr con B (Shift)
    await page.keyboard.down('Shift');
    await walkTo(11, 3);
    await page.keyboard.up('Shift');

    // Villa Arenal y laboratorio
    await walkTo(7, 12, 'arenal');
    await shot('villa-arenal');
    await walkTo(7, 7, 'arenal'); await sleep(600);
    await advance(200);
    s = await st(); assert.equal(s.map, 'lab'); assert.equal(s.story, 5); assert.ok(s.bag.capsula >= 5);
    await shot('laboratorio');
    log('laboratorio y entrega de cápsulas OK');
    await walkTo(7, 10); await sleep(400);

    // Posada: curación por el mostrador
    await page.evaluate(() => { __game.state.party[0].hp = 3; });
    await walkTo(18, 7, 'arenal'); await sleep(500);
    s = await st(); assert.equal(s.map, 'posada');
    await walkTo(6, 4); await face('ArrowUp'); await talk();
    await choose(0); await advance(200);
    s = await st(); assert.equal(s.party[0].hp, s.party[0].max, 'la posada debe curar');
    await shot('posada');
    log('curación en la posada OK');
    await walkTo(6, 8); await sleep(400);

    // Tienda: compra real
    await walkTo(17, 19, 'arenal'); await sleep(500);
    s = await st(); assert.equal(s.map, 'tienda');
    const before = await st();
    await walkTo(2, 4); await face('ArrowUp'); await talk();
    await choose(0);
    await choose('tonico'); await choose('plus'); await shot('tienda');
    await choose('buy'); await advance();
    await page.click('#botui [data-back]'); await advance();
    s = await st();
    assert.equal(s.money, before.money - 600); assert.equal(s.bag.tonico, before.bag.tonico + 2);
    log('compra en la tienda OK ($600, 2 tónicos)');
    await walkTo(5, 7); await sleep(400);

    // Encuentro salvaje y captura (azar fijado para que sea reproducible)
    await walkTo(30, 11, 'sendero1', { avoidGrass: false });
    await page.evaluate(() => { window.__rnd = Math.random; Math.random = () => 0.02; });
    for (let i = 0; i < 6 && (await st()).scene === 'overworld'; i++) { await step(i % 2 ? 'ArrowLeft' : 'ArrowRight'); }
    await page.waitForSelector('#botui .bt-fight',{timeout:30000});
    assert.equal((await st()).scene,'battle','la captura debe comenzar en un combate real');
    await shot('combate-salvaje');
    const partyBefore = (await st()).party.length;
    await page.click('#botui [data-act="bag"]'); await choose('capsula');
    await page.waitForFunction(n=>__game.scene==='overworld'&&__game.state.party.length===n+1,partyBefore,{timeout:45000});
    await page.evaluate(() => { Math.random = window.__rnd; });
    await advance();
    s = await st(); assert.equal(s.party.length, partyBefore + 1, 'la captura debe añadir la criatura al equipo');
    log('encuentro salvaje y captura OK');

    // Menú, equipo y guardado
    await tap('Escape'); await sleep(200);
    await page.click('#botui [data-act="party"]'); await sleep(150); await shot('menu-equipo');
    await page.click('#botui [data-back]'); await sleep(100);
    await page.click('#botui [data-act="save"]'); await choose(0); await advance();
    const saved = await st();
    await page.reload(); await sleep(700);
    await page.click('#botui [data-act="continue"]'); await sleep(900);
    s = await st();
    assert.deepEqual([s.map, s.x, s.y, s.story, s.money, s.party.length], [saved.map, saved.x, saved.y, saved.story, saved.money, saved.party.length]);
    log('guardar y continuar OK');
    await shot('continuar');

    // Opción de perspectiva
    await tap('Escape'); await page.click('#botui [data-act="options"]'); await page.click('#botui [data-act="persp"]'); await sleep(300);
    await shot('sin-perspectiva');
    await page.click('#botui [data-act="persp"]'); await page.click('#botui [data-back]'); await page.click('#botui [data-back]');

    // ---------------------------------------------------------- Móvil, táctil
    const storageState = await page.context().storageState();
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, storageState });
    const m = await ctx.newPage();
    m.on('pageerror', e => errors.push('móvil: ' + e.message));
    await m.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await m.goto(url); await sleep(600);
    await m.tap('#botui [data-act="continue"]'); await sleep(900);
    const pos0 = await m.evaluate(() => [__game.state.x, __game.state.y]);
    const dirs = [['right', 1, 0], ['left', -1, 0], ['down', 0, 1], ['up', 0, -1]];
    let moved = false;
    for (const [d] of dirs) {
      const box = await m.locator(`[data-btn="${d}"]`).boundingBox();
      await m.dispatchEvent(`[data-btn="${d}"]`, 'pointerdown');
      await sleep(500);
      await m.dispatchEvent(`[data-btn="${d}"]`, 'pointerup');
      await sleep(300);
      const p = await m.evaluate(() => [__game.state.x, __game.state.y]);
      if (p[0] !== pos0[0] || p[1] !== pos0[1]) { moved = true; break; }
      assert.ok(box.width > 30);
    }
    assert.ok(moved, 'la cruceta táctil debe mover al personaje');
    await m.tap('#botui [data-act="bag"]'); await sleep(200);
    assert.ok(await m.$('#botui .ilist'), 'el menú táctil debe abrir la mochila');
    await m.screenshot({ path: path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-movil.png`) });
    log('controles táctiles OK');
    await ctx.close();

    assert.deepEqual(errors, [], 'no debe haber errores de JavaScript');
    console.log('\nTODAS LAS PRUEBAS PASARON');
  } catch(error) {
    if(page){
      await page.screenshot({path:path.join(SHOTS,'failure.png')}).catch(()=>{});
      fs.writeFileSync(path.join(SHOTS,'failure.json'),JSON.stringify({message:error.message,state:await st().catch(()=>null),errors},null,2));
    }
    throw error;
  } finally { await browser.close(); server.close(); }
}

run().catch(e => { console.error('\nFALLÓ:', e.message, '\nErrores JS:', errors); process.exit(1); });
