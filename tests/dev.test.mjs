import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMaps } from '../src/world/maps.js';
import { SOLID } from '../src/art/tiles.js';
import { findFree, devPlaces, spotOf } from '../src/world/devmap.js';

// Mundo mínimo con los mapas hechos a mano (sin dibujar nada): lo justo que usa findFree.
const defs = buildMaps();
function mini(def) {
  return { ...def, at(x, y) { return x < 0 || y < 0 || x >= def.w || y >= def.h ? undefined : def.tiles[y][x]; },
    warpAt(x, y) { return def.warps.find(w => w.x === x && w.y === y); },
    blocked(x, y, st) {
      const t = this.at(x, y); if (t === undefined || SOLID.has(t) || 'TYJO'.includes(t)) return true;
      const o = def.objects.find(o => (!o.when || o.when(st)) && o.kind !== 'deco' && x >= o.x && y >= o.y && x < o.x + (o.w || 1) && y < o.y + (o.h || 1));
      return !!(o && o.solid !== false && !(o.door && o.door[0] === x && o.door[1] === y) && !(o.doors || []).some(d => d[0] === x && d[1] === y));
    } };
}
const maps = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, mini(d)]));
const world = {
  base: Object.values(maps).filter(m => m.outdoor),
  get(id) { return maps[id]; },
  outdoorAt(gx, gy) { return this.base.find(m => gx >= m.origin[0] && gy >= m.origin[1] && gx < m.origin[0] + m.w && gy < m.origin[1] + m.h); }
};

test('findFree: lands on a walkable tile that is not water, a door, a person or an event', () => {
  const st = { flags: {}, badges: [] };
  for (const m of world.base) {
    const s = findFree(world, st, m.origin[0] + Math.floor(m.w / 2), m.origin[1] + Math.floor(m.h / 2), 30);
    assert.ok(s, `${m.id}: hay dónde pararse`);
    const t = maps[s.map];
    assert.ok(!t.blocked(s.x, s.y, st) && t.at(s.x, s.y) !== 'w' && !t.warpAt(s.x, s.y), `${m.id}: (${s.x}, ${s.y}) se puede pisar`);
    assert.ok(!t.npcs.some(n => n.x === s.x && n.y === s.y), `${m.id}: nadie parado ahí`);
  }
  // Lejos de todo mapa no hay dónde pararse.
  assert.equal(findFree(world, st, 1000, 1000, 10), null);
});

test('developer places: the south (towns, gym, cave, motels, lots and partners) and every Alborada map', () => {
  const st = { flags: {}, badges: [] }, { sur, al } = devPlaces(world);
  const names = sur.map(p => p.name).join(' | ');
  for (const n of ['Pueblo Ribera', 'Ciudad Cascada', 'Caleta Sol', 'Caño de los Colores', 'Gimnasio extra', 'Cueva Guácharo', 'Motel', 'Lote en venta', 'Valentina']) assert.ok(names.includes(n), n);
  assert.equal(al.length, world.base.length);
  for (const p of [...sur, ...al]) {
    const s = spotOf(world, st, p);
    assert.ok(s, `${p.name}: hay dónde pararse`);
    const m = maps[s.map];
    assert.ok(m && !m.blocked(s.x, s.y, st), `${p.name}: (${s.map} ${s.x}, ${s.y}) se puede pisar`);
  }
});
