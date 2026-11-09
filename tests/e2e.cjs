/**
 * Prueba de punta a punta en Chromium real (Playwright): juega TODA la historia con teclas reales.
 * Camina con una ruta calculada sobre las colisiones reales del juego (sin teletransportes),
 * pelea los combates desde el menú, usa puertas, escaleras, viaje rápido, tienda y posada,
 * guarda y continúa, y revisa los controles táctiles en un celular. Guarda capturas en tests/screenshots/.
 *
 * Nota: para que la prueba sea rápida y determinista, después de elegir inicial se sube su nivel
 * (con __game) para ganar los combates sin depender del azar. Todo lo demás se hace con entrada real.
 *
 *   npm install && npx playwright install chromium && npm test
 */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GRAPHICS_MODE=process.env.GRAPHICS_MODE||'premium';
const SHOTS = path.join(__dirname, 'screenshots',GRAPHICS_MODE);
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
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

const st = () => page.evaluate(() => { const g = __game, s = g.state; return { map: s.map, x: s.x, y: s.y, dir: g.ow.player.dir, story: s.story, scene: g.scene, money: s.money, badges: [...(s.badges || [])], bag: { ...s.bag }, party: s.party.map(c => ({ sp: c.sp, hp: c.hp, max: c.stats.hp, level: c.level })), dialog: !!__ui.dialog, keep: !!(__ui.dialog && __ui.dialog.keep), modal: !!(__ui.panel && __ui.panel.modal), locked: g.ow.locked, moving: !!g.ow.player.moving, flags: { ...s.flags } }; });
async function shot(name) { await sleep(150); await page.screenshot({ path: path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`) }); }
// Wait for the simulation to observe input; SwiftShader may render slower than a short key tap.
async function face(key) {
  const dir={ArrowDown:0,ArrowUp:1,ArrowLeft:2,ArrowRight:3}[key];
  await page.keyboard.down(key);
  try { await page.waitForFunction(dir=>__game.ow.player.dir===dir,dir,{timeout:5000}); }
  finally { await page.keyboard.up(key); }
}
async function tap(key, hold = 60) {
  if(key.startsWith('Arrow')) return face(key);
  await page.keyboard.down(key);
  try { const frame=await page.evaluate(()=>__game.frame); await page.waitForFunction(frame=>__game.frame>frame,frame,{timeout:5000}); await sleep(hold); }
  finally { await page.keyboard.up(key); }
  await sleep(30);
}

// Resuelve lo que esté pendiente: diálogos, preguntas (elige la primera opción), combates y créditos.
async function settle(maxMs = 120000, { answer = 0 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await st();
    if (s.scene === 'overworld' && !s.locked && !s.moving && !s.dialog && !s.modal) return s;
    if (await page.$('#credits')) { await page.click('#credits'); await sleep(200); continue; }
    if (s.scene === 'overworld' && await page.$('#panel .starters, #panel .ilist')) return s;   // decisiones que toma la prueba
    if (s.scene === 'battle') {
      // Escoge el ataque que más daño haría (potencia × efectividad × mismo tipo), como haría un jugador.
      const pickMove = async () => {
        const best = await page.evaluate(async () => {
          const b = __game.battleObj; if (!b || !b.ally || !b.foe) return null;
          const { MOVES, SPECIES, effectiveness } = await import('/src/data/creatures.js');
          let bi = null, bv = -1;
          b.ally.moves.forEach((m, i) => { const M = MOVES[m.id]; if (m.pp <= 0) return; const v = M.power ? M.power * (M.hits ? 3 : 1) * effectiveness(M.type, SPECIES[b.foe.sp].types) * (SPECIES[b.ally.sp].types.includes(M.type) ? 1.5 : 1) * M.acc / 100 : 1; if (v > bv) { bv = v; bi = i; } });
          return bi;
        });
        const el = (best !== null && await page.$(`#panel .mv[data-act="${best}"]:not([disabled])`)) || await page.$('#panel .mv:not([disabled])');
        if (el) await el.click();
        return !!el;
      };
      if (await page.$('#panel .mv:not([disabled])')) { await pickMove(); await sleep(200); continue; }
      if (await page.$('#panel .bt-fight')) { await page.click('#panel .bt-fight'); await sleep(80); await pickMove(); await sleep(200); continue; }
      const sw = await page.$$('#panel .bt-list.party button:not(.cur)');
      if (sw.length) { for (const b of sw) { await b.click(); await sleep(100); if (!(await page.$('#panel .bt-list.party'))) break; } continue; }
    }
    if (await page.$('#panel .choice')) { await page.click(`#panel [data-act="${answer}"]`); await sleep(150); continue; }
    if (s.dialog && !s.keep) { await tap('z', 30); continue; }
    if (s.modal && !s.dialog && s.scene === 'overworld') { const back = await page.$('#panel [data-back]'); if (back) { await back.click(); await sleep(100); continue; } }
    if (s.scene !== 'overworld' || s.locked) { await tap('z', 30); await sleep(60); continue; }
    await sleep(80);
  }
  throw new Error('settle: tiempo agotado ' + JSON.stringify(await st()));
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
          if (prev.has(k) || Math.abs(nx - sx) > 90 || Math.abs(ny - sy) > 90) continue;
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
  const a = await st();
  await page.keyboard.down(key);
  const t = Date.now();
  while (Date.now() - t < 2500) {   // margen amplio: con render por software el juego puede ir a pocos cuadros por segundo
    const b = await st();
    if (b.moving || b.x !== a.x || b.y !== a.y || b.map !== a.map || b.dialog || b.locked) break;
    await sleep(10);
  }
  await page.keyboard.up(key);
  await settle();
}
const expect = (s, key) => ({ ArrowUp: [s.x, s.y - 1], ArrowDown: [s.x, s.y + 1], ArrowLeft: [s.x - 1, s.y], ArrowRight: [s.x + 1, s.y] })[key];
async function walkTo(x, y, mapId, opts = {}) {
  mapId = mapId || (await st()).map;
  for (let leg = 0; leg < 40; leg++) {
    const r = await pathTo(x, y, mapId, opts);
    assert.ok(r, `no hay ruta hacia ${mapId} (${x},${y}) desde ${JSON.stringify(await st())}`);
    let replan = false;
    for (const key of r.steps) {
      const before = await st();
      await step(key);
      const after = await st();
      if (after.map !== before.map) {
        const outdoor = await page.evaluate(([a, b]) => __game.world.get(a).outdoor && __game.world.get(b).outdoor, [before.map, after.map]);
        if (outdoor) { replan = true; break; }
        return after;                                                     // puerta, escalera o evento
      }
      const [ex, ey] = expect(before, key);
      if (after.x !== ex || after.y !== ey) { replan = true; break; }    // un evento nos movió: recalcular
    }
    if (!replan) { if (r.face) { await tap(r.face, 40); await sleep(80); } return st(); }
    const now = await st();
    if (now.map === mapId && now.x === x && now.y === y && !opts.adjacent) return now;
  }
  assert.fail('No se llegó al destino: '+JSON.stringify(await st()));
}
async function refill() { await page.evaluate(() => { for (const c of __game.state.party) { c.hp = c.stats.hp; for (const m of c.moves) m.pp = 99; } }); }
async function talk() { await tap('z'); await sleep(250); }
async function choose(i) { await page.waitForSelector(`#panel [data-act="${i}"]`); await sleep(150); await page.click(`#panel [data-act="${i}"]`); await sleep(150); }
async function talkTo(x, y, mapId) { await walkTo(x, y, mapId, { adjacent: true }); await talk(); }

async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  try {
    page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(url);
    await page.evaluate(mode=>{localStorage.clear();localStorage.setItem('alborada-graphics-v1',JSON.stringify({mode,quality:'low'}));},GRAPHICS_MODE);
    await page.reload(); await sleep(700);
    await shot('titulo');
    await page.click('#panel [data-act="new"]');
    await page.fill('#pname', 'Santi');
    await page.click('#panel [data-act="ok"]');
    // Creador de personaje: chica con cola de caballo, chaqueta morada y sin gorra
    await page.waitForSelector('#panel.avatar-panel');
    for (const act of ['body:chica', 'hairStyle:tail', 'top:4', 'hat:0']) { await page.click(`#panel [data-act="${act}"]`); await sleep(120); }
    await shot('avatar');
    await page.click('#panel [data-act="start"]');
    await sleep(900);
    await page.evaluate(() => { __game.state.options.forceHour = 12; });
    await shot('cuarto-intro');
    await settle();
    if(GRAPHICS_MODE==='premium'){await page.waitForFunction(()=>__game.graphics.status==='ready');assert.ok(await page.locator('#premium').isVisible());}
    let s = await st();
    assert.equal(s.map, 'cuarto'); assert.equal(s.story, 0);
    const av = await page.evaluate(() => ({ ...__game.state.avatar, slot: __game.state.slot }));
    assert.deepEqual([av.body, av.hairStyle, av.top, av.hat, av.slot], ['chica', 'tail', 4, 0, 1]);

    // ------------------------------------------------ Etapa 1
    await walkTo(1, 3); await step('ArrowLeft');
    s = await st(); assert.deepEqual([s.x, s.y], [1, 3], 'no debe atravesar la cama');
    await step('ArrowUp'); await step('ArrowUp');
    s = await st(); assert.deepEqual([s.x, s.y], [1, 2], 'no debe atravesar la pared');
    await walkTo(2, 3); await tap('ArrowUp'); await talk();
    assert.ok((await st()).dialog, 'la computadora debe mostrar texto');
    await settle();
    log('colisiones e interacción en el cuarto OK');

    await walkTo(8, 2); await settle();
    s = await st(); assert.equal(s.map, 'casa1'); assert.equal(s.story, 1);
    await walkTo(5, 7); s = await st(); assert.equal(s.map, 'brisal');
    await shot('pueblo-brisal');
    await walkTo(11, 2); await step('ArrowUp');
    s = await st(); assert.ok(s.y >= 2, 'el niño debe bloquear la salida norte');
    await walkTo(18, 7); s = await st(); assert.equal(s.map, 'casa2');
    await walkTo(1, 2); s = await st(); assert.equal(s.map, 'casa2f2');
    await talkTo(4, 3); await settle();
    s = await st(); assert.equal(s.story, 2);
    await walkTo(0, 2); await walkTo(5, 7);
    await walkTo(19, 13, 'sendero1');
    s = await st(); assert.equal(s.map, 'sendero1');
    await shot('sendero-1');
    log('pueblo, casa de Nico y sendero OK');

    await walkTo(17, 11, 'lago'); await settle();
    await walkTo(12, 12, 'lago');
    for (let i = 0; i < 40 && !(await page.$('#panel [data-act="charquin"]')); i++) { await tap('z', 40); await sleep(150); }
    await shot('eleccion-inicial');
    await choose('charquin');
    for (let i = 0; i < 12 && !(await page.$('#panel .choice')); i++) { await tap('z', 40); await sleep(120); }
    await choose(0);
    for (let i = 0; i < 60 && (await st()).scene !== 'battle'; i++) { await tap('z', 40); await sleep(100); }
    await sleep(2600);
    await shot('combate-pipiu');
    await settle();
    s = await st(); assert.equal(s.story, 3); assert.equal(s.party[0].sp, 'charquin');
    log('inicial y primer combate OK');

    // Acelerador de la prueba: sube el nivel del inicial para ganar sin depender del azar.
    await page.evaluate(() => { const c = __game.state.party[0]; c.level = 70; c.exp = 70 ** 3; c.stats = { hp: 220, atk: 190, def: 170, spe: 160 }; c.hp = 220; c.moves = [{ id: 'oleaje', pp: 99 }, { id: 'rayo', pp: 99 }, { id: 'psicorayo', pp: 99 }, { id: 'derribo', pp: 99 }]; });

    await walkTo(5, 7, 'brisal'); await settle();
    s = await st(); assert.equal(s.story, 4, 'mamá debe dar las zapatillas');
    await walkTo(5, 7);
    await page.keyboard.down('Shift');
    await walkTo(7, 7, 'arenal');
    await page.keyboard.up('Shift');
    await settle();
    s = await st(); assert.equal(s.map, 'lab'); assert.equal(s.story, 5);
    await shot('laboratorio');
    log('regreso a casa, correr y laboratorio OK');
    await walkTo(7, 10);

    // Posada y tienda (Villa Arenal)
    await page.evaluate(() => { __game.state.party[0].hp = 5; });
    await walkTo(18, 7, 'arenal');
    await walkTo(6, 4); await tap('ArrowUp'); await talk(); await choose(0); await settle();
    s = await st(); assert.equal(s.party[0].hp, s.party[0].max, 'la posada debe curar');
    await walkTo(6, 8);
    const before = await st();
    await walkTo(17, 19, 'arenal');
    await walkTo(2, 4); await tap('ArrowUp'); await talk();
    await choose(0); await shot('tienda');
    assert.ok(await page.$$eval('#panel .shop-list [data-act]', b => b.length) >= 8, 'el mostrador general debe tener al menos 8 productos');
    await choose('capsula'); await choose('plus'); await shot('tienda-cantidad');
    await choose('buy');
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    await page.click('#panel [data-back]');
    await choose(1);                                                     // Vender: una Cápsula a mitad de precio
    await choose('capsula'); await choose('buy');
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    await page.click('#panel [data-back]');
    await choose(2); await settle();                                     // Nada, gracias
    s = await st();
    assert.equal(s.money, before.money - 400 + 100); assert.equal(s.bag.capsula, before.bag.capsula + 1);
    // Mostrador especial de la vendedora y máquina de bebidas
    await walkTo(4, 4); await tap('ArrowUp'); await talk(); await choose(0);
    await choose('miel'); await choose('buy');
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    await page.click('#panel [data-back]'); await choose(1); await settle();
    await walkTo(9, 2); await tap('ArrowRight'); await talk();
    await choose('jugoLulo'); await choose('buy');
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    await shot('maquina');
    await page.click('#panel [data-back]'); await settle();
    s = await st();
    assert.equal(s.bag.miel, 1); assert.equal(s.bag.jugoLulo, 1); assert.equal(s.money, before.money - 300 - 300 - 300);
    log('posada, tienda (comprar, vender, especial y máquina) OK');
    await walkTo(5, 7);

    // ------------------------------------------------ Ruta 2 y Corola
    await walkTo(14, 23, 'corola'); await settle();
    s = await st(); assert.ok(s.flags.nicoR2, 'combate con Nico en la Ruta 2'); assert.equal(s.story, 6);
    await shot('ciudad-corola');
    await walkTo(22, 7, 'corola');
    s = await st(); assert.equal(s.map, 'gym1');
    await shot('gimnasio-corola');
    await talkTo(6, 3); await settle();
    s = await st(); assert.ok(s.badges.includes('hoja')); assert.equal(s.story, 7);
    log('Ruta 2, Nico, Corola y Medalla Hoja OK');
    await walkTo(6, 15);

    // ------------------------------------------------ Ruta 3, Cueva Eco y Cobre
    await refill();
    await walkTo(25, 6, 'ruta3');
    s = await st(); assert.equal(s.map, 'cueva');
    await shot('cueva-eco');
    await walkTo(27, 8);
    s = await st(); assert.equal(s.map, 'cobre');
    await walkTo(13, 7, 'cobre');
    await talkTo(6, 3); await settle();
    s = await st(); assert.ok(s.badges.includes('roca')); assert.equal(s.story, 8);
    await shot('medalla-roca');
    log('Cueva Eco, Pueblo Cobre y Medalla Roca OK');
    await walkTo(6, 15);

    // ------------------------------------------------ Ruta 4 y Marea
    await refill();
    await walkTo(16, 2, 'marea'); await settle();
    s = await st(); assert.ok(s.flags.nicoR4, 'combate con Nico en la Ruta 4');
    await shot('ciudad-marea');
    await walkTo(8, 8, 'marea');
    await talkTo(6, 3); await settle();
    s = await st(); assert.ok(s.badges.includes('marea')); assert.equal(s.story, 9);
    log('Ruta 4, Nico, Ciudad Marea y Medalla Marea OK');
    await walkTo(6, 15);
    await walkTo(26, 16, 'marea');
    s = await st(); assert.equal(s.map, 'bodega');
    await talkTo(8, 3); await settle();
    s = await st(); assert.equal(s.story, 10);
    await shot('bodega-eclipse');
    log('Bodega del Equipo Eclipse OK');
    await walkTo(8, 12);

    // Viaje rápido a Pueblo Brisal y evento del lago
    await refill();
    await walkTo(22, 7, 'marea');
    await talkTo(10, 5);
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    await page.click('#panel .ilist [data-act="0"]');
    await settle();
    s = await st(); assert.equal(s.map, 'brisal', 'el viaje rápido debe llevar a Brisal');
    log('viaje rápido OK');
    await walkTo(17, 11, 'lago'); await settle(180000);
    s = await st(); assert.equal(s.story, 11);
    await shot('lago-final');
    log('evento del Lago Espejo y Espejalba OK');

    // Guardar y continuar
    await tap('Escape'); await sleep(200);
    await page.click('#panel [data-act="save"]'); await choose(0); await settle();
    const saved = await st();
    await page.reload(); await sleep(700);
    await page.click('#panel [data-act="continue"]'); await sleep(900); await settle();
    s = await st();
    assert.deepEqual([s.map, s.x, s.y, s.story, s.money, s.party.length, s.badges.length], [saved.map, saved.x, saved.y, saved.story, saved.money, saved.party.length, saved.badges.length]);
    log('guardar y continuar OK');
    await page.evaluate(() => { __game.state.options.forceHour = 12; });

    // ------------------------------------------------ Liga
    await refill();
    await walkTo(18, 7, 'arenal');
    await talkTo(10, 5);
    for (let i = 0; i < 20 && !(await page.$('#panel .ilist')); i++) { await tap('z', 40); await sleep(120); }
    const opts = await page.$$eval('#panel .ilist button', bs => bs.map(b => b.textContent));
    await page.click(`#panel .ilist [data-act="${opts.indexOf('Ciudad Corola')}"]`);
    await settle();
    s = await st(); assert.equal(s.map, 'corola');
    await walkTo(7, 6, 'ruta5');
    s = await st(); assert.equal(s.map, 'liga');
    await shot('liga');
    await walkTo(7, 11); await settle();
    s = await st(); assert.ok(s.flags.nicoLiga, 'combate final con Nico');
    await walkTo(7, 5); await settle(240000);
    s = await st(); assert.equal(s.story, 12, 'debe ser campeón');
    assert.equal(s.map, 'casa1');
    await shot('campeon-en-casa');
    log('Liga Alborada, campeona y créditos OK');

    // Opción de perspectiva y hora del día
    await tap('Escape'); await page.click('#panel [data-act="options"]'); await page.click('#panel [data-act="persp"]'); await sleep(300);
    await page.click('#panel [data-act="hour"]'); await page.click('#panel [data-act="hour"]'); await sleep(200);
    await page.click('#panel [data-back]'); await page.click('#panel [data-back]'); await settle();
    await walkTo(5, 7); await sleep(300);
    await shot('noche-sin-perspectiva');

    // ------------------------------------------------ Celular (táctil)
    const storageState = await page.context().storageState();
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, storageState });
    const m = await ctx.newPage();
    m.on('pageerror', e => errors.push('móvil: ' + e.message));
    await m.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await m.goto(url); await sleep(700);
    await m.tap('#panel [data-act="continue"]'); await sleep(900);
    await m.evaluate(() => { __game.state.options.forceHour = 12; __game.state.options.perspective = true; __game.applyOptions(); });
    const pos0 = await m.evaluate(() => [__game.state.map, __game.state.x, __game.state.y]);
    let moved = false;
    for (const d of ['down', 'right', 'left', 'up']) {
      await m.dispatchEvent(`[data-btn="${d}"]`, 'pointerdown'); await sleep(450);
      await m.dispatchEvent(`[data-btn="${d}"]`, 'pointerup'); await sleep(300);
      const p = await m.evaluate(() => [__game.state.map, __game.state.x, __game.state.y]);
      if (p.join() !== pos0.join()) { moved = true; break; }
    }
    assert.ok(moved, 'la cruceta táctil debe mover al personaje');
    await m.tap('#menuBtn'); await sleep(200);
    await m.tap('#panel [data-act="bag"]'); await sleep(200);
    assert.ok(await m.$('#panel .ilist'), 'el menú táctil debe abrir la mochila');
    await m.screenshot({ path: path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-movil.png`) });
    log('controles táctiles OK');
    await ctx.close();

    // ------------------------------------------------ Ranuras y respaldo en GitHub (API simulada)
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 720 }, storageState: await page.context().storageState() });
    const q = await ctx2.newPage();
    q.on('pageerror', e => errors.push('ranuras: ' + e.message));
    const gist = { content: null, patches: 0 };
    await q.route('https://api.github.com/**', async r => {
      const u = new URL(r.request().url()), method = r.request().method();
      const json = (body, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
      if (u.pathname === '/user') return json({ login: 'santi-prueba' });
      if (u.pathname === '/gists' && method === 'GET') return json([]);
      if (u.pathname === '/gists' && method === 'POST') { gist.content = JSON.parse(r.request().postData()).files['alborada-partidas.json'].content; return json({ id: 'g123' }, 201); }
      if (u.pathname === '/gists/g123' && method === 'PATCH') { gist.patches++; gist.content = JSON.parse(r.request().postData()).files['alborada-partidas.json'].content; return json({ id: 'g123' }); }
      if (u.pathname === '/gists/g123') return json({ id: 'g123', files: { 'alborada-partidas.json': { content: gist.content } } });
      return json({ message: 'no' }, 404);
    });
    await q.goto(url); await sleep(700);
    // Nueva partida en la ranura 2 sin tocar la 1
    await q.click('#panel [data-act="new"]'); await q.waitForSelector('#panel.slot-panel');
    await q.click('#panel [data-act="slot:2"]');
    await q.fill('#pname', 'Vale'); await q.click('#panel [data-act="ok"]');
    await q.waitForSelector('#panel.avatar-panel'); await q.click('#panel [data-act="random"]'); await q.click('#panel [data-act="start"]'); await sleep(900);
    assert.deepEqual(await q.evaluate(() => [__game.state.slot, __game.state.name]), [2, 'Vale']);
    for (let i = 0; i < 8 && await q.evaluate(() => !!__ui.dialog); i++) { await q.keyboard.press('z'); await sleep(120); }
    // Conectar GitHub desde Opciones
    await q.keyboard.press('Escape'); await sleep(200);
    await q.click('#panel [data-act="options"]'); await sleep(150);
    await q.click('#panel [data-act="files"]'); await sleep(150);
    await q.fill('#ghToken', 'ghp_' + 'a'.repeat(36));
    await q.click('#panel [data-act="link"]');
    await q.waitForFunction(() => __ui.dialog && /santi-prueba/.test(document.getElementById('msgText').textContent), {}, { timeout: 10000 });
    for (let i = 0; i < 6 && await q.evaluate(() => !!__ui.dialog); i++) { await q.keyboard.press('z'); await sleep(150); }
    const backup = JSON.parse(gist.content);
    assert.deepEqual(Object.keys(backup.slots).sort(), ['1', '2']);
    assert.equal(backup.slots['2'].name, 'Vale');
    // Volver al título: con dos partidas, CONTINUAR deja escoger; se elige la de Santi
    await q.reload(); await sleep(700);
    await q.click('#panel [data-act="continue"]'); await q.waitForSelector('#panel.slot-panel');
    await q.click('#panel [data-act="slot:1"]'); await sleep(900);
    assert.deepEqual(await q.evaluate(() => [__game.state.slot, __game.state.name, __game.state.avatar.body]), [1, 'Santi', 'chica']);
    await q.screenshot({ path: path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-ranuras.png`) });
    await ctx2.close();
    log('ranuras, avatar y respaldo en GitHub OK');

    assert.deepEqual(errors, [], 'no debe haber errores de JavaScript');
    console.log('\nTODAS LAS PRUEBAS PASARON: historia completa jugada de principio a fin');
  } catch (e) {
    try { await page.screenshot({ path: path.join(SHOTS, 'zz-fallo.png') }); console.log('ESTADO', JSON.stringify(await st()), await page.evaluate(() => document.getElementById('panel').innerHTML.slice(0, 600))); } catch { }
    throw e;
  } finally { await browser.close(); server.close(); }
}

run().catch(async e => { console.error('\nFALLÓ:', e.message, '\nErrores JS:', errors); try { await page.screenshot({ path: path.join(SHOTS, 'zz-fallo.png') }); } catch { } process.exit(1); });
