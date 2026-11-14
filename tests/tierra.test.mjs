// Tierra Grande: el mundo grande que se genera solo. Siempre sale igual, se entra por la Autopista del Llano,
// las carreteras llevan a todas las ciudades y aeropuertos, y cada puerta, tienda, encuentro y entrenador es válido.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TG, SIZE, ENTRY_X, CITIES, AIRPORTS, ROADS, tileAt, tgMap, tgInterior, tgDef, tgId, tgCell, blockPlan, TG_TEAMS, TG_ENCOUNTER, buildAutopista, cityAt } from '../src/world/tierra.js';
import { SOLID } from '../src/art/tiles.js';
import { SPECIES, ENCOUNTERS } from '../src/data/creatures.js';
import { SPECIAL, ITEMS } from '../src/data/items.js';

const walkTile = c => c !== undefined && !SOLID.has(c) && !'TYJO'.includes(c);

test('el generador es determinista: el mismo mapa sale idéntico cada vez', () => {
  for (const [i, j] of [[40, 0], [30, 66], [60, 14], [0, 0], [83, 83]]) {
    const a = tgMap(i, j), b = tgMap(i, j);
    assert.deepEqual(a.tiles, b.tiles, `tg_${i}_${j}`);
    assert.deepEqual(a.npcs.map(n => [n.id, n.x, n.y]), b.npcs.map(n => [n.id, n.x, n.y]));
    assert.equal(a.w, TG.S); assert.equal(a.h, TG.S);
  }
  assert.equal(tgMap(-1, 0), null); assert.equal(tgMap(TG.N, 0), null);
  assert.equal(SIZE, 4032, 'son 4.032 casillas por lado (unos 6 × 6 km a escala de casa)');
});

test('todo el borde es mar salvo la entrada de la autopista, que empata con la Autopista del Llano', () => {
  const auto = buildAutopista();
  for (let x = 0; x < SIZE; x++) for (const y of [0, SIZE - 1]) {
    const open = walkTile(tileAt(x, y));
    if (y === 0 && x >= ENTRY_X - 5 && x <= ENTRY_X + 5) assert.ok(open, `la entrada (${x}) está abierta`);
    else assert.ok(!open, `borde abierto en (${x},${y})`);
  }
  for (let y = 0; y < SIZE; y++) for (const x of [0, SIZE - 1]) assert.ok(!walkTile(tileAt(x, y)), `borde abierto en (${x},${y})`);
  // La fila de abajo de la autopista toca la fila de arriba de Tierra Grande, casilla por casilla.
  for (let x = 0; x < auto.w; x++) {
    const gx = auto.origin[0] + x, tx = gx - TG.X;
    assert.equal(auto.origin[1] + auto.h, TG.Y);
    assert.equal(walkTile(auto.tiles[auto.h - 1][x]), walkTile(tileAt(tx, 0)), `costura en x global ${gx}`);
  }
});

test('desde la entrada se llega por carretera a todas las ciudades y a todos los aeropuertos', () => {
  const seen = new Uint8Array(SIZE * SIZE), q = new Int32Array(2_000_000);
  let head = 0, tail = 0;
  const push = (x, y) => { const k = y * SIZE + x; if (seen[k]) return; seen[k] = 1; if (tileAt(x, y) !== 'p') return; q[tail++] = k; };
  push(ENTRY_X, 0);
  while (head < tail) {
    const k = q[head++], x = k % SIZE, y = (k - x) / SIZE;
    if (x > 0) push(x - 1, y); if (x < SIZE - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < SIZE - 1) push(x, y + 1);
    assert.ok(tail < q.length, 'demasiadas casillas de asfalto');
  }
  const paved = k => seen[k] && tileAt(k % SIZE, Math.floor(k / SIZE)) === 'p';
  const reached = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (paved(y * SIZE + x)) return true; return false; };
  for (const c of CITIES) assert.ok(reached(c.x0, c.y0, c.x1, c.y1), `${c.name} queda aislada`);
  for (const a of AIRPORTS) assert.ok(reached(a.x0, a.y0, a.x1, a.y1), `${a.name} queda aislado`);
  assert.ok(CITIES.filter(c => c.kind === 'grande').length >= 3, 'tres ciudades grandes');
  assert.ok(ROADS.length >= 10 && AIRPORTS.length >= 4);
});

test('las puertas de posadas y tiendas llevan a su interior y el regreso cae frente a la puerta', () => {
  for (const c of CITIES) for (const kind of ['posada', 'tienda']) {
    const id = `tgi_${kind}_${c.id}`, inner = tgInterior(id);
    assert.ok(inner, `${c.name} tiene ${kind}`);
    const back = inner.warps.find(w => w.to.startsWith('tg_'));
    assert.ok(back, `${id} tiene salida`);
    const out = tgDef(back.to);
    assert.ok(walkTile(out.tiles[back.ty][back.tx]), `${id} sale a una casilla caminable`);
    const door = out.objects.find(o => o.door && o.door[0] === back.tx && o.door[1] === back.ty - 1);
    assert.ok(door, `al salir de ${id} se queda frente a la puerta`);
    const warp = out.warps.find(w => w.x === back.tx && w.y === back.ty - 1);
    assert.ok(warp && warp.to === id, `la puerta de ${c.name} entra a ${id}`);
    assert.ok(!SOLID.has(inner.tiles[warp.ty][warp.tx]), `${id}: se entra a un piso caminable`);
    if (kind === 'tienda') assert.ok(SPECIAL['tg_' + c.id]?.items.every(it => ITEMS[it]), `la tienda de ${c.name} vende objetos reales`);
  }
});

test('cada manzana deja libres las calles y nadie aparece encima de un edificio', () => {
  for (const c of CITIES.slice(0, 4)) {
    const cx = Math.floor((c.x0 + c.x1) / 2), cy = Math.floor((c.y0 + c.y1) / 2);
    const cell = tgCell(TG.X + cx, TG.Y + cy), m = tgMap(...cell), x0 = cell[0] * TG.S, y0 = cell[1] * TG.S;
    // Las calles son las franjas de 4 casillas entre manzanas (los parqueaderos y las bombas sí van sobre asfalto).
    const street = (x, y) => (x0 + x) % 24 < 4 || (y0 + y) % 24 < 4;
    for (const o of m.objects) if (o.solid !== false && o.kind !== 'deco') {
      for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) {
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        assert.ok(!street(x, y), `${c.name}: ${o.kind} encima de la calle (${x},${y})`);
      }
    }
    for (const n of m.npcs) {
      assert.ok(walkTile(m.tiles[n.y][n.x]), `${c.name}: ${n.id} parado en ${m.tiles[n.y][n.x]}`);
      const o = m.objects.find(o => o.solid !== false && o.kind !== 'deco' && n.x >= o.x && n.y >= o.y && n.x < o.x + (o.w || 1) && n.y < o.y + (o.h || 1));
      assert.ok(!o, `${c.name}: ${n.id} encima de ${o?.kind}`);
    }
    const plan = blockPlan(c, Math.floor(cx / 24), Math.floor(cy / 24));
    assert.ok(plan.objects.length > 0, `${c.name} tiene manzanas con algo`);
  }
});

test('los encuentros y los entrenadores de Tierra Grande usan especies reales y suben con las medallas', () => {
  for (const t of new Set(Object.values(TG_ENCOUNTER))) {
    const table = ENCOUNTERS[t];
    assert.ok(table && table.scale, `${t} existe y escala`);
    for (const e of table.grass || table.list || []) assert.ok(SPECIES[e.id || e[0]], `${t}: ${e.id || e[0]}`);
  }
  for (const [zone, team] of Object.entries(TG_TEAMS)) for (const [id] of team) assert.ok(SPECIES[id], `${zone}: ${id}`);
  let trainers = 0;
  for (let j = 0; j < TG.N; j += 7) for (let i = 0; i < TG.N; i += 5) {
    const m = tgMap(i, j);
    if (m.encounters) assert.ok(ENCOUNTERS[m.encounters], m.id);
    for (const n of m.npcs) if (n.trainer) { trainers++; assert.ok(n.trainer.scale && n.trainer.party.every(([id]) => SPECIES[id]), n.id); }
  }
  assert.ok(trainers > 0, 'hay entrenadores en las carreteras');
});

test('Doña Rueda da las llaves en el Parador y cada aeropuerto tiene su controladora', () => {
  const par = CITIES.find(c => c.id === 'parador');
  const cell = tgCell(TG.X + 1938, TG.Y + 248), m = tgMap(...cell);
  assert.ok(m.npcs.some(n => n.talk === 'llavesCarro'), 'Doña Rueda está en el Parador');
  assert.ok(cityAt(1938, 248) === par);
  for (const a of AIRPORTS) {
    const am = tgMap(...tgCell(TG.X + a.apron[0], TG.Y + a.apron[1]));
    assert.ok(am.npcs.some(n => n.talk === 'aeropuerto' && n.arg === a.id), `${a.name} tiene controladora`);
    for (let x = a.x0; x < a.x1; x += 16) assert.equal(tileAt(x, a.y0 + 4), 'p', `la pista de ${a.name} es de asfalto`);
  }
  assert.equal(tgId(3, 4), 'tg_3_4');
});
