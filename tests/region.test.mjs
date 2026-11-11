// La región completa: ocho gimnasios, rutas conectadas sin cortes, puertas de ida y vuelta, entrenadores
// y encuentros válidos, y la Liga cerrada hasta tener las ocho medallas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMaps } from '../src/world/maps.js';
import { SOLID } from '../src/art/tiles.js';
import { SPECIES, ENCOUNTERS, makeCreature } from '../src/data/creatures.js';
import { LOOKS } from '../src/art/characters.js';
import { ITEMS, SPECIAL } from '../src/data/items.js';
import { GYMS, BADGE_IDS, LEAGUE_BADGES, leagueOpen, nextGym, badgeCount, gymOf } from '../src/data/gyms.js';

const maps = buildMaps();
const outdoor = Object.values(maps).filter(m => m.outdoor);
const objAt = (m, x, y) => m.objects.find(o => o.kind !== 'deco' && x >= o.x && y >= o.y && x < o.x + (o.w || 1) && y < o.y + (o.h || 1));
const isDoor = (o, x, y) => (o.doors || (o.door ? [o.door] : [])).some(d => d[0] === x && d[1] === y);
const walkable = (m, x, y) => {
  const c = m.tiles[y]?.[x];
  if (c === undefined || SOLID.has(c) || 'TYJO'.includes(c)) return false;
  const o = objAt(m, x, y);
  return !o || o.solid === false || isDoor(o, x, y);
};
const at = (gx, gy) => outdoor.find(m => gx >= m.origin[0] && gy >= m.origin[1] && gx < m.origin[0] + m.w && gy < m.origin[1] + m.h);

test('los mapas exteriores no se montan y cada borde abierto empata con el mapa vecino', () => {
  for (let i = 0; i < outdoor.length; i++) for (let j = i + 1; j < outdoor.length; j++) {
    const a = outdoor[i], b = outdoor[j];
    const overlap = a.origin[0] < b.origin[0] + b.w && b.origin[0] < a.origin[0] + a.w && a.origin[1] < b.origin[1] + b.h && b.origin[1] < a.origin[1] + a.h;
    assert.ok(!overlap, `${a.id} se monta sobre ${b.id}`);
  }
  for (const m of outdoor) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!(x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) || !walkable(m, x, y)) continue;
    const out = [];
    if (x === 0) out.push([-1, 0]); if (x === m.w - 1) out.push([1, 0]); if (y === 0) out.push([0, -1]); if (y === m.h - 1) out.push([0, 1]);
    for (const [dx, dy] of out) {
      const gx = m.origin[0] + x + dx, gy = m.origin[1] + y + dy, n = at(gx, gy);
      assert.ok(n, `${m.id} (${x},${y}) sale a la nada`);
      assert.ok(walkable(n, gx - n.origin[0], gy - n.origin[1]), `${m.id} (${x},${y}) choca con ${n.id}`);
    }
  }
});

test('desde Pueblo Brisal se llega caminando a los 83 mapas', () => {
  const seen = new Set(), q = [['brisal', 5, 10]];
  while (q.length) {
    const [id, x, y] = q.pop(), k = `${id}:${x},${y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const m = maps[id], w = m.warps.find(w => w.x === x && w.y === y);
    if (w) q.push([w.to, w.tx, w.ty]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nid = id, nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
        if (!m.outdoor) continue;
        const n = at(m.origin[0] + nx, m.origin[1] + ny);
        if (!n) continue;
        nid = n.id; nx = m.origin[0] + nx - n.origin[0]; ny = m.origin[1] + ny - n.origin[1];
      }
      if (walkable(maps[nid], nx, ny) || maps[nid].warps.some(w => w.x === nx && w.y === ny)) q.push([nid, nx, ny]);
    }
  }
  const reached = new Set([...seen].map(k => k.split(':')[0]));
  assert.deepEqual(Object.keys(maps).filter(id => !reached.has(id)), []);
  assert.equal(reached.size, 83);
});

test('cada puerta lleva a un piso caminable y el regreso cae frente a la puerta', () => {
  for (const m of Object.values(maps)) for (const w of m.warps) {
    const t = maps[w.to];
    assert.ok(t, `${m.id} → ${w.to}`);
    assert.ok(!SOLID.has(t.tiles[w.ty][w.tx]), `${m.id} → ${w.to} (${w.tx},${w.ty}) cae en una pared`);
    if (t.outdoor && !m.outdoor && w.to !== 'cobre' && w.to !== 'ruta3') {
      const front = t.objects.some(o => isDoor(o, w.tx, w.ty - 1));
      assert.ok(front, `al salir de ${m.id} se queda frente a una puerta de ${w.to}`);
    }
  }
  for (const m of outdoor) for (const o of m.objects) for (const [x, y] of (o.doors || (o.door ? [o.door] : []))) {
    assert.ok(m.warps.some(w => w.x === x && w.y === y), `${m.id}: la puerta (${x},${y}) de ${o.kind} no lleva a ningún lado`);
    assert.ok(walkable(m, x, y + 1), `${m.id}: la puerta (${x},${y}) está tapada`);
  }
});

test('nadie está parado encima de un árbol, una pared o un edificio', () => {
  const skip = new Set(['guardiaEste']);   // el guardia de Corola vigila desde el borde del bosque
  for (const m of Object.values(maps)) for (const n of m.npcs) {
    if (skip.has(n.id)) continue;
    const c = m.tiles[n.y]?.[n.x], o = objAt(m, n.x, n.y);
    assert.ok(c !== undefined && !SOLID.has(c) && !'TYJO'.includes(c) && !(o && o.solid !== false), `${m.id}: ${n.id} en (${n.x},${n.y}) sobre '${c}' ${o ? o.kind : ''}`);
  }
});

test('ocho gimnasios con su edificio, su líder, su medalla y su regalo', () => {
  assert.equal(GYMS.length, 8);
  assert.equal(LEAGUE_BADGES, 8);
  assert.equal(new Set(BADGE_IDS).size, 8);
  const gymMaps = Object.values(maps).filter(m => m.npcs.some(n => n.badge));
  assert.equal(gymMaps.length, 8, 'ocho interiores con líder');
  for (const g of GYMS) {
    const city = maps[g.map];
    assert.ok(city && city.outdoor, g.map);
    const building = city.objects.filter(o => o.kind === 'gym');
    assert.equal(building.length, 1, `${g.city} tiene un gimnasio`);
    const w = city.warps.find(w => isDoor(building[0], w.x, w.y));
    const inside = maps[w.to];
    const leader = inside.npcs.find(n => n.badge === g.badge);
    assert.ok(leader, `${g.city}: líder con la Medalla ${g.name}`);
    assert.ok(leader.trainer.name.includes(g.leader), `${leader.trainer.name} es ${g.leader}`);
    assert.ok(LOOKS[leader.look], `${g.leader} tiene apariencia propia`);
    assert.ok(ITEMS[g.gift[0]] && g.gift[1] > 0, `${g.name}: regalo válido`);
    assert.ok(g.who && g.next, g.badge);
    assert.ok(inside.warps.every(b => b.to === g.map), `${inside.id} vuelve a ${g.city}`);
  }
  // Cada líder es más fuerte que el anterior.
  const aces = GYMS.map(g => Math.max(...Object.values(maps).flatMap(m => m.npcs).find(n => n.badge === g.badge).trainer.party.map(([, lv]) => lv)));
  for (let i = 1; i < aces.length; i++) assert.ok(aces[i] > aces[i - 1], `el líder ${i + 1} (${aces[i]}) supera al ${i} (${aces[i - 1]})`);
});

test('la Liga pide las ocho medallas; el campeón de antes la conserva', () => {
  const all = { story: 11, badges: [...BADGE_IDS] };
  assert.equal(leagueOpen({ story: 11, badges: ['hoja', 'roca', 'marea'] }), false);
  assert.equal(leagueOpen({ story: 11, badges: BADGE_IDS.slice(0, 7) }), false);
  assert.equal(leagueOpen(all), true);
  assert.equal(leagueOpen({ story: 10, badges: [...BADGE_IDS] }), false, 'primero el Lago Espejo');
  assert.equal(leagueOpen({ story: 12, badges: ['hoja', 'roca', 'marea'] }), true, 'partidas viejas que ya ganaron la Liga');
  assert.equal(nextGym({ badges: ['hoja', 'roca', 'marea'] }).badge, 'chispa');
  assert.equal(nextGym(all), null);
  assert.equal(badgeCount({ badges: ['hoja', 'nada', 'roca'] }), 2);
  assert.equal(gymOf('escama').leader, 'Sabino');
});

test('las salidas vigiladas frenan sin la medalla y sólo en el sentido de ida', () => {
  const gates = { voltio: 'chispa', niebla: 'sombra', cafetal: 'puno', escarcha: 'escarcha', albor: 'escama' };
  for (const [id, badge] of Object.entries(gates)) {
    const t = maps[id].triggers.find(t => /^bloqueo/.test(t.script));
    assert.ok(t, `${id} tiene salida vigilada`);
    const dirs = [0, 1, 2, 3].filter(dir => t.when({ dir, badges: [], story: 11 }));
    assert.equal(dirs.length, 1, `${id}: frena en un solo sentido`);
    assert.equal(t.when({ dir: dirs[0], badges: [badge], story: 11 }), false, `${id}: con la medalla se pasa`);
    assert.ok(maps[id].npcs.some(n => n.talk === 'guardia' + id[0].toUpperCase() + id.slice(1)), `${id}: hay un guardia que explica`);
  }
  const marea = maps.marea.triggers.find(t => t.script === 'bloqueoMareaEste');
  assert.equal(marea.when({ dir: 3, story: 10 }), true);
  assert.equal(marea.when({ dir: 3, story: 11 }), false);
  const liga = maps.corola.triggers.find(t => t.script === 'bloqueoLiga');
  assert.equal(liga.when({ dir: 1, story: 11, badges: ['hoja', 'roca', 'marea'] }), true);
  assert.equal(liga.when({ dir: 1, story: 11, badges: [...BADGE_IDS] }), false);
  assert.equal(liga.when({ dir: 0, story: 11, badges: [] }), false, 'bajar de la Ruta 5 a Corola siempre se puede');
});

test('entrenadores y encuentros usan criaturas reales a niveles que van subiendo', () => {
  for (const m of Object.values(maps)) for (const n of m.npcs) if (n.trainer) {
    assert.ok(LOOKS[n.trainer.look] || LOOKS[n.look], `${m.id}: apariencia de ${n.trainer.name}`);
    assert.ok(n.trainer.party.length >= 1 && n.trainer.party.length <= 6, n.trainer.name);
    for (const [sp, lv] of n.trainer.party) {
      assert.ok(SPECIES[sp], `${n.trainer.name}: ${sp}`);
      assert.ok(lv >= 2 && lv <= 100, `${n.trainer.name}: nivel ${lv}`);
      const c = makeCreature(sp, lv);
      assert.ok(c.moves.length >= 1 && c.stats.hp > 0);
      // Nada de criaturas sin evolucionar muy por encima de su nivel de evolución.
      const evo = SPECIES[sp].evo;
      assert.ok(!evo || lv < evo[1] + 6, `${m.id}: ${n.trainer.name} lleva ${sp} Nv${lv} (evoluciona al ${evo && evo[1]})`);
    }
  }
  const used = new Set(Object.values(maps).map(m => m.encounters).filter(Boolean));
  for (const key of used) assert.ok(ENCOUNTERS[key], `encuentros de ${key}`);
  for (const [key, t] of Object.entries(ENCOUNTERS)) for (const [sp, lo, hi] of t.list) {
    assert.ok(SPECIES[sp] && lo <= hi, `${key}: ${sp}`);
  }
  const top = key => Math.max(...ENCOUNTERS[key].list.map(e => e[2]));
  const order = ['ruta4', 'ruta6', 'ruta7', 'ruta8', 'ruta9', 'ruta10', 'ruta11', 'ruta5'];
  for (let i = 1; i < order.length; i++) assert.ok(top(order[i]) >= top(order[i - 1]), `${order[i]} es más difícil que ${order[i - 1]}`);
});

test('cada ciudad nueva tiene posada, tienda con mostrador especial y casa', () => {
  for (const town of ['voltio', 'niebla', 'cafetal', 'escarcha', 'albor']) {
    const id = town[0].toUpperCase() + town.slice(1);
    assert.ok(maps['posada' + id] && maps['tienda' + id] && maps['casa' + id], town);
    assert.ok(SPECIAL[town] && SPECIAL[town].items.every(i => ITEMS[i]), `especial de ${town}`);
    assert.ok(maps['posada' + id].npcs.some(n => n.talk === 'viaje'), `${town}: la Mensajera`);
  }
});

test('en cada gimnasio nuevo los entrenadores alcanzan a ver el pasillo central', () => {
  for (const id of ['gym4', 'gym5', 'gym6', 'gym7', 'gym8']) {
    const m = maps[id];
    for (const n of m.npcs.filter(n => n.trainer && !n.badge)) {
      const [dx, dy] = [[0, 1], [0, -1], [-1, 0], [1, 0]][n.dir];
      let seesCenter = false;
      for (let i = 1; i <= (n.sight || 4); i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (!walkable(m, x, y)) break;
        if (x === 6) { seesCenter = true; break; }
      }
      assert.ok(seesCenter, `${id}: ${n.trainer.name} en (${n.x},${n.y}) no ve el pasillo`);
    }
  }
});
