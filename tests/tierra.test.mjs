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
  for (const c of CITIES.filter(c => c.kind !== 'motel')) for (const kind of ['posada', 'tienda']) {
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

test('las 40 especies nuevas salen en Tierra Grande (o evolucionan de una que sale) y tienen modelo y sprite', async () => {
  const NEW = ['chiguirin', 'chiguiron', 'garcilla', 'garzon', 'becerrin', 'torazo', 'lechucin', 'lechuzon', 'cucarrin', 'cucarron', 'guacarin', 'guacamaron', 'anguilin', 'temblon', 'alacrin', 'alacranzo', 'cactin', 'espinon', 'llamita', 'llamaron', 'frailin', 'frailejon', 'careyin', 'careyon', 'bufeito', 'bufeon', 'semaforin', 'semaforton', 'caimancito', 'caimanazo', 'pintin', 'tigrillo', 'jaguaron', 'lagartijin', 'iguanon', 'draguana', 'mohan', 'madremonte', 'tunjo', 'esmeraldon'];
  assert.equal(new Set(NEW).size, 40);
  const tg = Object.entries(ENCOUNTERS).filter(([k]) => k.startsWith('tg')).flatMap(([, t]) => t.list.map(e => e[0]));
  const wild = new Set(tg);
  for (const id of NEW) {
    assert.ok(SPECIES[id], id);
    const from = Object.keys(SPECIES).find(k => SPECIES[k].evo?.[0] === id);
    assert.ok(wild.has(id) || (from && wild.has(from)), `${id} no sale en Tierra Grande`);
  }
  const { ALL_SPECIES } = await import('../src/render3d/creatures3d.js');
  const { ATLAS_SPECIES } = await import('../src/art/bruma-sprites.js');
  for (const id of NEW) { assert.ok(ALL_SPECIES.includes(id), `${id}: modelo 3D`); assert.ok(ATLAS_SPECIES.includes(id), `${id}: sprite`); }
  // Los parques de las ciudades tienen pasto alto y su propia tabla.
  const c = CITIES.find(c => c.id === 'bahia');
  let grass = 0;
  for (let y = c.y0; y < c.y1; y += 2) for (let x = c.x0; x < c.x1; x += 2) if (tileAt(x, y) === 'g') grass++;
  assert.ok(grass > 0 && ENCOUNTERS.tgCiudad, 'pasto alto en los parques de Bahía Dorada');
});

test('moteles junto a la vía: recepción, camas y la puerta que vuelve al frente del motel', async () => {
  const { MOTEL_PRICE } = await import('../src/world/hogar.js');
  const motels = CITIES.filter(c => c.kind === 'motel');
  assert.ok(motels.length >= 5 && MOTEL_PRICE > 0);
  for (const c of motels) {
    const inner = tgInterior('tgi_motel_' + c.id);
    assert.ok(inner && inner.npcs.some(n => n.talk === 'motel' && n.arg === c.id), `${c.name}: recepcionista`);
    assert.ok(inner.objects.filter(o => o.script === 'motelCama').length === 2, `${c.name}: dos camas`);
    const back = inner.warps.find(w => w.to.startsWith('tg_')), out = tgDef(back.to);
    assert.ok(walkTile(out.tiles[back.ty][back.tx]), `${c.name}: sale a una casilla caminable`);
    const warp = out.warps.find(w => w.x === back.tx && w.y === back.ty - 1);
    assert.ok(warp && warp.to === 'tgi_motel_' + c.id, `${c.name}: la puerta entra al motel`);
  }
});

test('lotes en venta: letrero, casa de cualquier modelo con la puerta en el mismo sitio, e interior amoblable', async () => {
  const { HOUSE_MODELS, FURNITURE, LOT_DOOR } = await import('../src/world/hogar.js');
  const { GameMap } = await import('../src/world/world.js').catch(() => ({}));
  let lots = 0;
  for (const c of CITIES.filter(c => c.kind === 'pueblo' || c.kind === 'grande')) {
    let n = 0;
    for (let by = c.y0 / 24; by * 24 < c.y1 - 4; by++) for (let bx = c.x0 / 24; bx * 24 < c.x1 - 4; bx++) if (blockPlan(c, bx, by).type === 'lote') n++;
    assert.ok(n >= 1, `${c.name} tiene al menos un lote (tiene ${n})`);
    lots += n;
  }
  assert.ok(lots >= 15, `lotes en total: ${lots}`);
  // Un lote de Bahía Dorada: sin casa se ve el letrero; con casa, la casa y su puerta (para los tres modelos).
  const c = CITIES.find(c => c.id === 'bahia');
  let bx, by;
  outer: for (by = c.y0 / 24; by * 24 < c.y1 - 4; by++) for (bx = c.x0 / 24; bx * 24 < c.x1 - 4; bx++) if (blockPlan(c, bx, by).type === 'lote') break outer;
  const lot = `bahia_${bx}_${by}`, gx = bx * 24 + 4, gy = by * 24 + 4, [i, j] = tgCell(TG.X + gx, TG.Y + gy), m = tgMap(i, j);
  const sign = m.objects.find(o => o.lot === lot && o.sale), house = m.objects.find(o => o.lot === lot && o.kind === 'house');
  const door = m.warps.find(w => w.to === `tgi_casa_${lot}`);
  assert.ok(sign && house && door && sign.script === 'lote');
  const empty = {}, built = model => ({ houses: { [lot]: { model, wall: '#f6eedc', roof: '#d8504a', furniture: [] } } });
  assert.ok(sign.when(empty) && !house.when(empty) && !door.when(empty), 'sin construir: sólo el letrero');
  for (const model of Object.keys(HOUSE_MODELS)) {
    const st = built(model), shape = house.dyn(st);
    assert.ok(!sign.when(st) && house.when(st) && door.when(st), `${model}: casa y puerta`);
    assert.deepEqual([shape.x + shape.opt.doorCol, shape.y + shape.h - 1], [door.x, door.y], `${model}: la puerta cae en la puerta del lote`);
    assert.deepEqual([door.x - (gx - i * TG.S), door.y - (gy - j * TG.S)], LOT_DOOR);
    assert.ok(walkTile(m.tiles[door.y + 1][door.x]), `${model}: frente a la puerta se puede caminar`);
  }
  // Interior: cama, computador con el catálogo y cada mueble en su sitio, sin tapar el camino a la cama.
  const inner = tgInterior(`tgi_casa_${lot}`);
  assert.ok(inner.objects.some(o => o.script === 'camaCasa') && inner.objects.some(o => o.script === 'catalogo'));
  const back = inner.warps[0];
  assert.equal(back.to, tgId(i, j)); assert.deepEqual([back.tx, back.ty], [door.x, door.y + 1]);
  const all = { houses: { [lot]: { model: 'casona', furniture: FURNITURE.map(f => f.id) } } };
  const solid = new Set();
  for (const o of inner.objects) if (o.kind === 'furniture' && (!o.when || o.when(all)) && o.solid !== false) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
    assert.ok(!solid.has(x + ',' + y), `dos muebles en (${x},${y})`); solid.add(x + ',' + y);
  }
  for (const f of FURNITURE) assert.ok(inner.objects.some(o => o.when && o.when(all) && !o.when({ houses: { [lot]: { furniture: [] } } })), f.id);
  const seen = new Set(), q = [[6, 8]];
  while (q.length) { const [x, y] = q.pop(), k = x + ',' + y; if (seen.has(k) || x < 0 || y < 2 || x >= inner.w || y > 8 || solid.has(k)) continue; seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  assert.ok(seen.has('1,3') || seen.has('0,4'), 'con todos los muebles se llega a la cama');
  assert.ok(seen.has('2,3') || seen.has('3,3'), 'y al computador');
  void GameMap;
});

test('las personas con las que se sale viven en su ciudad, son de los looks del juego y hay regalos a la venta', async () => {
  const { CANDIDATES, GIFTS, candidateSpot } = await import('../src/world/hogar.js');
  const { LOOKS } = await import('../src/art/characters.js').catch(() => ({ LOOKS: null }));
  assert.equal(Object.keys(CANDIDATES).length, 6);
  for (const [id, P] of Object.entries(CANDIDATES)) {
    const c = CITIES.find(c => c.id === P.city), [gx, gy] = candidateSpot(c), m = tgMap(...tgCell(TG.X + gx, TG.Y + gy));
    const n = m.npcs.find(n => n.cand === id);
    assert.ok(n && n.talk === 'cita' && cityAt(gx, gy) === c, `${P.name} está en ${c.name}`);
    assert.ok(walkTile(m.tiles[n.y][n.x]) && !m.objects.some(o => n.x >= o.x && n.y >= o.y && n.x < o.x + (o.w || 1) && n.y < o.y + (o.h || 1) && o.solid !== false), `${P.name} no está encima de nada`);
    assert.ok(n.when({}) && !n.when({ pareja: { id, follow: true } }), `${P.name} se va contigo cuando te acompaña`);
    if (LOOKS) assert.ok(LOOKS[P.look], `${P.name}: look`);
    for (const g of [...P.loves, ...P.likes]) assert.ok(GIFTS.includes(g), `${P.name}: ${g}`);
  }
  for (const g of GIFTS) { assert.ok(ITEMS[g]?.gift && ITEMS[g].pocket === 'regalos', g); assert.ok(Object.values(SPECIAL).some(s => s.items.includes(g)), `${g} se vende`); }
});
