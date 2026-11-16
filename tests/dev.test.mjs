import test from 'node:test';
import assert from 'node:assert/strict';
import { TG, CITIES, AIRPORTS, tgDef, tgCell, tgId } from '../src/world/tierra.js';
import { findFree, devPlaces, spotOf, PARADOR } from '../src/world/devmap.js';

// Mundo mínimo con los mapas generados de Tierra Grande (sin dibujar nada): lo justo que usa findFree.
const SOLID = new Set(['T', 'w', 'W', 'x', ' ', 'f', 'B', 'C', 'R', 'K']);
function mini(def) {
  const objects = def.objects || [];
  return { ...def, at(x, y) { return x < 0 || y < 0 || x >= def.w || y >= def.h ? undefined : def.tiles[y][x]; }, inside(x, y) { return x >= 0 && y >= 0 && x < def.w && y < def.h; },
    warpAt(x, y) { return def.warps.find(w => w.x === x && w.y === y); },
    blocked(x, y, st) {
      const t = this.at(x, y); if (t === undefined || SOLID.has(t)) return true;
      const o = objects.find(o => (!o.when || o.when(st)) && o.kind !== 'deco' && x >= o.x && y >= o.y && x < o.x + (o.w || 1) && y < o.y + (o.h || 1));
      return !!(o && o.solid !== false && !(o.door && o.door[0] === x && o.door[1] === y));
    } };
}
const cache = new Map();
const world = {
  base: [],
  get(id) { if (!cache.has(id)) { const d = tgDef(id); cache.set(id, d && mini(d)); } return cache.get(id); },
  outdoorAt(gx, gy) { const c = tgCell(gx, gy); return c ? this.get(tgId(c[0], c[1])) : undefined; }
};

test('findFree: lands on a walkable tile that is not water, a door, a person or an event', () => {
  const st = {};
  for (const c of CITIES) {
    const s = findFree(world, st, TG.X + Math.floor((c.x0 + c.x1) / 2), TG.Y + Math.floor((c.y0 + c.y1) / 2));
    assert.ok(s, `${c.name}: hay dónde pararse`);
    const m = world.get(s.map);
    assert.ok(!m.blocked(s.x, s.y, st) && m.at(s.x, s.y) !== 'w' && !m.warpAt(s.x, s.y), `${c.name}: (${s.x}, ${s.y}) se puede pisar`);
    assert.ok(!m.npcs.some(n => n.x === s.x && n.y === s.y), `${c.name}: nadie parado ahí`);
  }
  // Mar abierto lejos de la costa: no hay dónde pararse.
  assert.equal(findFree(world, st, TG.X + 20, TG.Y + 20, 10), null);
});

test('developer places: every Tierra Grande place resolves to a free spot close to where it should be', () => {
  const st = {}, { tg } = devPlaces(world);
  const names = tg.map(p => p.name);
  for (const c of CITIES.filter(c => c.kind === 'grande' || c.kind === 'pueblo')) assert.ok(names.includes(c.name), c.name);
  for (const a of AIRPORTS) assert.ok(names.some(n => n.startsWith(a.name)), a.name);
  for (const c of CITIES.filter(c => c.kind === 'motel')) assert.ok(names.includes(c.name), c.name);
  assert.ok(names.some(n => n.startsWith('Lote en venta')), 'hay lotes en la lista');
  assert.equal(tg[0], PARADOR);
  for (const p of tg) {
    const s = spotOf(world, st, p);
    assert.ok(s, `${p.name}: hay dónde pararse`);
    const m = world.get(s.map);
    assert.ok(m && !m.blocked(s.x, s.y, st), `${p.name}: (${s.map} ${s.x}, ${s.y}) se puede pisar`);
    if (p.tg) {
      const gx = m.origin[0] + s.x - TG.X, gy = m.origin[1] + s.y - TG.Y;
      assert.ok(Math.hypot(gx - p.tg[0], gy - p.tg[1]) <= 8, `${p.name}: queda cerca (${gx}, ${gy}) de (${p.tg})`);
    }
  }
});
