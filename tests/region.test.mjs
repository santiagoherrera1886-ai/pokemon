// La región completa: ocho gimnasios, rutas conectadas sin cortes, puertas de ida y vuelta, entrenadores
// y encuentros válidos, y la Liga cerrada hasta tener las ocho medallas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMaps } from '../src/world/maps.js';
import { SOLID } from '../src/art/tiles.js';
import { SPECIES, ENCOUNTERS, makeCreature } from '../src/data/creatures.js';
import { LOOKS } from '../src/art/characters.js';
import { ITEMS, SPECIAL } from '../src/data/items.js';
import { GYMS, EXTRA_GYMS, BADGE_IDS, LEAGUE_BADGES, leagueOpen, nextGym, badgeCount, gymOf } from '../src/data/gyms.js';
import { LOTS, MOTEL_DOORS } from '../src/world/maps7.js';
import { CANDIDATES } from '../src/world/hogar.js';

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
const atAll = at;

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
      const gx = m.origin[0] + x + dx, gy = m.origin[1] + y + dy, n = atAll(gx, gy);
      assert.ok(n, `${m.id} (${x},${y}) sale a la nada`);
      assert.ok(walkable(n, gx - n.origin[0], gy - n.origin[1]), `${m.id} (${x},${y}) choca con ${n.id}`);
    }
  }
});

test('desde Pueblo Brisal se llega caminando a todo el mapa salvo la isla (que es en barco)', () => {
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
  // La Isla Totuma y sus interiores sólo se alcanzan en el barco de Cabo Faro.
  const barco = ['isla', 'posadaIsla', 'tiendaIsla', 'casaIsla'];
  assert.deepEqual(Object.keys(maps).filter(id => !reached.has(id)), barco);
  assert.equal(reached.size + barco.length, Object.keys(maps).length);
  for (const id of ['ruta26', 'ribera', 'ruta27', 'cano', 'ruta29', 'cascada', 'ruta28', 'caleta', 'guacharo', 'gym9']) assert.ok(reached.has(id), `se llega caminando a ${id}`);
  assert.ok(!Object.keys(maps).some(id => /^tg|autopista/i.test(id)), 'ya no queda nada del mapa gigante');
  assert.ok(maps.cabo.npcs.some(n => n.talk === 'barcoIsla'), 'el capitán de Cabo Faro lleva a la isla');
  assert.ok(maps.isla.npcs.some(n => n.talk === 'barcoVuelta'), 'y trae de vuelta');
});

test('cada puerta lleva a un piso caminable y el regreso cae frente a la puerta', () => {
  for (const m of Object.values(maps)) for (const w of m.warps) {
    const t = maps[w.to];
    assert.ok(t, `${m.id} → ${w.to}`);
    assert.ok(!SOLID.has(t.tiles[w.ty][w.tx]), `${m.id} → ${w.to} (${w.tx},${w.ty}) cae en una pared`);
    if (t.outdoor && !m.outdoor && !m.dark) {   // de las cuevas se sale a la boca, no a una puerta
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
  const gymMaps = Object.values(maps).filter(m => m.npcs.some(n => BADGE_IDS.includes(n.badge)));
  assert.equal(gymMaps.length, 8, 'ocho interiores con líder de la Liga');
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

test('gimnasio extra del sur: Medalla Arcoíris, no cuenta para la Liga y despierta cuatro leyendas', () => {
  assert.equal(EXTRA_GYMS.length, 1);
  const g = EXTRA_GYMS[0], city = maps[g.map], inside = maps[g.inside];
  assert.ok(city.objects.some(o => o.kind === 'gym' && o.theme === 'hada'), 'edificio de Hada en Ciudad Cascada');
  const leader = inside.npcs.find(n => n.badge === g.badge);
  assert.ok(leader && leader.trainer.name.includes(g.leader) && LOOKS[leader.look], 'Amaranta, con su apariencia');
  assert.equal(gymOf('arcoiris'), g);
  assert.ok(!BADGE_IDS.includes('arcoiris'), 'no es medalla de la Liga');
  assert.equal(badgeCount({ badges: ['arcoiris'] }), 0);
  assert.ok(ITEMS[g.gift[0]] && g.gift[1] > 0, 'regalo válido');
  const legends = Object.values(maps).flatMap(m => m.objects.filter(o => o.legend && ['mohan', 'madremonte', 'tunjo', 'esmeraldon'].includes(o.legend)).map(o => [m.id, o]));
  assert.deepEqual(legends.map(([, o]) => o.legend).sort(), ['esmeraldon', 'madremonte', 'mohan', 'tunjo']);
  const day = { flags: {}, badges: [], options: { forceHour: 12 } }, night = { flags: {}, badges: ['arcoiris'], options: { forceHour: 22 } };
  for (const [, o] of legends) assert.ok(!o.when(day), `${o.legend} no sale sin la Medalla Arcoíris`);
  for (const [, o] of legends) assert.ok(o.when(night), `${o.legend} sale con la medalla`);
});

test('el sur trae casas, moteles y parejas a pueblos hechos a mano', () => {
  assert.equal(Object.keys(LOTS).length, 8, 'ocho lotes en venta');
  for (const [id, L] of Object.entries(LOTS)) {
    const m = maps[L.map], sign = m.objects.find(o => o.lot === id && o.sale), house = m.objects.find(o => o.lot === id && o.kind === 'house');
    assert.ok(sign && house, `${id}: letrero y casa`);
    assert.deepEqual(house.door, L.door);
    assert.ok(m.warps.some(w => w.x === L.door[0] && w.y === L.door[1] && w.to === 'casa_' + id && w.when), `${id}: la puerta sólo abre con la casa construida`);
    assert.ok(maps['casa_' + id], `${id}: interior`);
    // Con cualquier modelo la puerta queda en el mismo sitio.
    for (const model of ['sencilla', 'dospisos', 'casona']) {
      Object.assign(house, house.dyn({ houses: { [id]: { model } } }));
      assert.deepEqual([house.x + house.opt.doorCol, house.y + house.h - 1], L.door, `${id}: puerta de la ${model}`);
    }
  }
  assert.equal(Object.keys(MOTEL_DOORS).length, 3, 'tres moteles');
  for (const [id, [map, x, y]] of Object.entries(MOTEL_DOORS)) {
    const inside = maps['motel_' + id];
    assert.ok(inside && inside.npcs.some(n => n.talk === 'motel' && n.arg === id), `${id}: recepción`);
    assert.ok(maps[map].warps.some(w => w.x === x && w.y === y - 1 && w.to === 'motel_' + id), `${id}: puerta`);
  }
  for (const [id, P] of Object.entries(CANDIDATES)) {
    const m = maps[P.home.map];
    assert.ok(m && ['ribera', 'cascada', 'caleta'].includes(m.id), `${P.name} vive en el sur`);
    assert.ok(m.npcs.some(n => n.cand === id && n.x === P.home.x && n.y === P.home.y && n.talk === 'cita'), `${P.name} está en su pueblo`);
    assert.ok(LOOKS[P.look], `${P.name} tiene apariencia`);
  }
  for (const town of ['ribera', 'cascada', 'caleta']) assert.ok(['ramoFlores', 'chocolates', 'peluche', 'cafe', 'mochila'].every(i => SPECIAL[town].items.includes(i)), `${town} vende los regalos`);
});

test('las 40 especies del sur salen en las rutas nuevas (o evolucionan de una que sale) y las leyendas tienen su sitio', () => {
  const NEW = 'chiguirin chiguiron garcilla garzon becerrin torazo lechucin lechuzon cucarrin cucarron guacarin guacamaron anguilin temblon alacrin alacranzo cactin espinon llamita llamaron frailin frailejon careyin careyon bufeito bufeon semaforin semaforton caimancito caimanazo pintin tigrillo jaguaron lagartijin iguanon draguana'.split(' ');
  const wild = new Set(Object.values(ENCOUNTERS).flatMap(t => t.list.map(e => e[0])));
  const from = {}; for (const [id, s] of Object.entries(SPECIES)) if (s.evo) from[s.evo[0]] = id;
  for (const sp of NEW) {
    let k = sp, ok = wild.has(k);
    while (!ok && from[k]) { k = from[k]; ok = wild.has(k); }
    assert.ok(ok, `${sp} se puede conseguir`);
  }
  for (const key of ['ruta26', 'ruta27', 'ruta28', 'ruta29', 'cano', 'guacharo', 'cascadaParque', 'caleta']) assert.ok(ENCOUNTERS[key], key);
});
