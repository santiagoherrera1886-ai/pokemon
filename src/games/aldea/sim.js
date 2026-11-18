// Aldea Puchamon: lógica pura (sin dibujo, se prueba en Node). Tu aldea en una cuadrícula de 24 × 24: edificios
// que producen plata (la misma de Puchamon) y bayas, mejoras con constructores y tiempo real, y un ejército de
// tus Puchamon (se entrenan con bayas) para atacar aldeas rivales y llevarte su plata.
import { makeCard, ownedBest, rng } from '../arena/sim.js';

export const GRID = 24, RAID_TIME = 150, MAX_LEVEL = 5;
// Catálogo de edificios. Los arreglos van por nivel (índice 0 = nivel 1). limit = cuántos deja tener cada nivel
// de la Casa Grande; time = segundos para construir (índice 0) o para subir de ese nivel al siguiente.
export const B = {
  casa: { name: 'Casa Grande', size: 4, hp: [6000, 8200, 11000, 14500, 19000], cost: [0, 2500, 7000, 16000, 36000], time: [0, 60, 240, 900, 2400], limit: [1, 1, 1, 1, 1], desc: 'El corazón de la aldea: al subirla puedes tener más edificios y mejorarlos más.' },
  mina: { name: 'Mina de plata', size: 3, hp: [1600, 2100, 2700, 3400, 4200], cost: [400, 1100, 2800, 6500, 15000], time: [10, 45, 180, 600, 1500], prod: [18, 30, 46, 66, 90], cap: [1000, 2000, 3800, 6800, 11000], limit: [1, 2, 3, 3, 4], desc: 'Saca plata con el tiempo. Tócala para recogerla: es la misma plata de Puchamon.' },
  huerto: { name: 'Huerto de bayas', size: 3, hp: [1600, 2100, 2700, 3400, 4200], cost: [350, 1000, 2600, 6000, 14000], time: [10, 45, 180, 600, 1500], prod: [16, 28, 44, 64, 88], cap: [900, 1800, 3500, 6200, 10000], limit: [1, 2, 3, 3, 4], desc: 'Da bayas con el tiempo. Las bayas sirven para entrenar a tus Puchamon.' },
  granero: { name: 'Granero', size: 3, hp: [2000, 2600, 3300, 4100, 5000], cost: [500, 1400, 3500, 8000, 18000], time: [15, 60, 240, 720, 1800], store: [1500, 3500, 7000, 14000, 28000], limit: [1, 1, 2, 2, 3], desc: 'Guarda bayas: cuantos más graneros y más altos, más bayas caben.' },
  corral: { name: 'Corral', size: 4, hp: [2200, 2800, 3500, 4300, 5200], cost: [600, 1800, 4500, 10000, 22000], time: [20, 90, 300, 900, 2100], space: [20, 30, 42, 56, 72], limit: [1, 1, 1, 2, 2], desc: 'Donde esperan tus Puchamon entrenados. Más nivel, más espacio para el ataque.' },
  torre: { name: 'Torre vigía', size: 3, hp: [2800, 3600, 4600, 5800, 7200], cost: [700, 1800, 4400, 9500, 21000], time: [20, 90, 300, 900, 2100], range: 7, dmg: [40, 52, 68, 88, 112], rate: .9, air: true, limit: [1, 2, 2, 3, 4], desc: 'Defensa: dispara a lo que se acerque, por tierra o por aire.' },
  lanza: { name: 'Lanzapiedras', size: 3, hp: [3200, 4100, 5200, 6500, 8000], cost: [1600, 3600, 7500, 15000, 30000], time: [40, 150, 450, 1200, 2700], range: 6.2, dmg: [95, 125, 162, 210, 270], rate: 1.9, air: false, splash: 1.3, limit: [0, 1, 2, 2, 3], desc: 'Defensa: piedras que golpean a varios de una vez, sólo por tierra.' },
  muro: { name: 'Muro', size: 1, hp: [600, 1000, 1600, 2400, 3500], cost: [60, 180, 450, 1000, 2200], time: [0, 0, 0, 0, 0], limit: [0, 20, 36, 52, 70], desc: 'Bloque de piedra: los Puchamon de tierra tienen que tumbarlo para pasar.' }
};
export const KINDS = Object.keys(B);
export const DEFENSES = new Set(['torre', 'lanza']);
export const TRAIN_COST = 30;   // bayas por punto de espacio (un Puchamon de costo 4 vale 120 bayas)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function newAldea(now = Date.now()) {
  return { v: 1, bayas: 600, army: {}, raids: 0, wins: 0, stars: 0, next: 7, builders: 2,
    buildings: [
      { id: 1, kind: 'casa', x: 10, y: 10, level: 1 },
      { id: 2, kind: 'mina', x: 4, y: 4, level: 1, store: 0, last: now },
      { id: 3, kind: 'huerto', x: 17, y: 4, level: 1, store: 0, last: now },
      { id: 4, kind: 'granero', x: 17, y: 17, level: 1 },
      { id: 5, kind: 'corral', x: 3, y: 16, level: 1 },
      { id: 6, kind: 'torre', x: 10, y: 4, level: 1 }
    ] };
}
// Lee lo guardado y lo deja válido (también sirve para partidas viejas sin aldea).
export function aldeaState(st, now = Date.now()) {
  const A = st.aldea && st.aldea.v === 1 && Array.isArray(st.aldea.buildings) ? st.aldea : newAldea(now);
  A.buildings = A.buildings.filter(b => B[b.kind] && Number.isFinite(b.x) && Number.isFinite(b.y));
  if (!A.buildings.some(b => b.kind === 'casa')) A.buildings.unshift({ id: 1, kind: 'casa', x: 10, y: 10, level: 1 });
  A.army = A.army && typeof A.army === 'object' ? A.army : {};
  A.next = Math.max(A.next || 1, ...A.buildings.map(b => b.id + 1));
  st.aldea = A; return A;
}
export const casaLevel = A => A.buildings.find(b => b.kind === 'casa')?.level || 1;
export const countOf = (A, kind) => A.buildings.filter(b => b.kind === kind).length;
export const limitOf = (A, kind) => B[kind].limit[casaLevel(A) - 1] || 0;
export const maxLevel = (A, kind) => kind === 'casa' ? MAX_LEVEL : Math.max(1, casaLevel(A));
export const busyBuilders = (A, now = Date.now()) => A.buildings.filter(b => b.upg && b.upg.done > now).length;
export const bayasCap = A => 500 + A.buildings.filter(b => b.kind === 'granero' && b.level > 0).reduce((a, b) => a + B.granero.store[b.level - 1], 0);
export const armySpace = A => A.buildings.filter(b => b.kind === 'corral' && b.level > 0).reduce((a, b) => a + B.corral.space[b.level - 1], 0);
export function armyUsed(A, cards) { return Object.entries(A.army).reduce((a, [sp, n]) => a + (cards[sp]?.cost || 0) * n, 0); }

// Pasa el tiempo: terminan las obras y las minas y huertos producen (no producen mientras se mejoran).
export function tick(A, now = Date.now()) {
  for (const b of A.buildings) {
    if (b.upg && now >= b.upg.done) { b.level = b.upg.to; delete b.upg; if (B[b.kind].prod) b.last = now; }
    const D = B[b.kind];
    if (!D.prod) continue;
    if (b.upg || b.level < 1) { b.last = now; continue; }
    const mins = Math.max(0, (now - (b.last || now)) / 60000);
    b.store = Math.min(D.cap[b.level - 1], (b.store || 0) + D.prod[b.level - 1] * mins); b.last = now;
  }
}
// Recoger lo producido: la plata va directo a la partida de Puchamon; las bayas hasta donde quepan.
export function collect(A, b, st, now = Date.now()) {
  tick(A, now);
  const got = Math.floor(b.store || 0); if (got <= 0) return 0;
  if (b.kind === 'mina') { st.money += got; b.store -= got; return got; }
  const room = Math.max(0, bayasCap(A) - A.bayas), take = Math.min(room, got);
  A.bayas += take; b.store -= take; return take;
}
export function fits(A, kind, x, y, ignoreId = null) {
  const s = B[kind].size;
  if (x < 1 || y < 1 || x + s > GRID - 1 || y + s > GRID - 1) return false;
  return !A.buildings.some(b => b.id !== ignoreId && x < b.x + B[b.kind].size && x + s > b.x && y < b.y + B[b.kind].size && y + s > b.y);
}
// ¿Por qué no se puede construir? null si sí se puede.
export function buildBlock(A, kind, st, now = Date.now()) {
  if (countOf(A, kind) >= limitOf(A, kind)) return limitOf(A, kind) ? 'Ya tienes todos los que deja tu Casa Grande' : 'Sube la Casa Grande para construir esto';
  if (st.money < B[kind].cost[0]) return 'Te falta plata';
  if (B[kind].time[0] > 0 && busyBuilders(A, now) >= A.builders) return 'Los constructores están ocupados';
  return null;
}
export function build(A, kind, x, y, st, now = Date.now()) {
  if (buildBlock(A, kind, st, now) || !fits(A, kind, x, y)) return null;
  st.money -= B[kind].cost[0];
  const t = B[kind].time[0], b = { id: A.next++, kind, x, y, level: t > 0 ? 0 : 1 };
  if (t > 0) b.upg = { to: 1, done: now + t * 1000 };
  if (B[kind].prod) { b.store = 0; b.last = now; }
  A.buildings.push(b); return b;
}
export function upgradeBlock(A, b, st, now = Date.now()) {
  if (b.upg) return 'Ya se está mejorando';
  if (b.level >= maxLevel(A, b.kind)) return b.kind === 'casa' ? 'Está al máximo' : 'Sube la Casa Grande primero';
  if (st.money < B[b.kind].cost[b.level]) return 'Te falta plata';
  if (B[b.kind].time[b.level] > 0 && busyBuilders(A, now) >= A.builders) return 'Los constructores están ocupados';
  return null;
}
export function upgrade(A, b, st, now = Date.now()) {
  if (upgradeBlock(A, b, st, now)) return false;
  st.money -= B[b.kind].cost[b.level];
  const t = B[b.kind].time[b.level];
  if (t > 0) { tick(A, now); b.upg = { to: b.level + 1, done: now + t * 1000 }; } else b.level++;
  return true;
}
// Terminar ya: cuesta plata según lo que falte (5 por segundo, mínimo 50).
export const rushCost = (b, now = Date.now()) => b.upg ? Math.max(50, Math.ceil((b.upg.done - now) / 1000) * 5) : 0;
export function rush(A, b, st, now = Date.now()) { const c = rushCost(b, now); if (!c || st.money < c) return false; st.money -= c; b.upg.done = now; tick(A, now); return true; }
export function move(A, b, x, y) { if (!fits(A, b.kind, x, y, b.id)) return false; b.x = x; b.y = y; return true; }
// Cartas del ejército: tus Puchamon (la más fuerte de cada especie) con las mismas reglas del Duelo de Torres.
export function troopCards(st) { const best = ownedBest(st), out = {}; for (const [sp, c] of Object.entries(best)) out[sp] = makeCard(sp, c.level); return out; }
export function trainBlock(A, card) {
  if (!card) return 'No tienes ese Puchamon';
  if (A.bayas < card.cost * TRAIN_COST) return 'Te faltan bayas';
  return null;
}
export function train(A, card, cards) {
  if (trainBlock(A, card)) return false;
  if (armyUsed(A, cards) + card.cost > armySpace(A)) return false;
  A.bayas -= card.cost * TRAIN_COST; A.army[card.sp] = (A.army[card.sp] || 0) + 1; return true;
}
export function untrain(A, card) { if (!A.army[card.sp]) return false; A.army[card.sp]--; if (!A.army[card.sp]) delete A.army[card.sp]; A.bayas += Math.floor(card.cost * TRAIN_COST * .5); return true; }

// ---------- Aldea rival ----------
// Casa Grande al centro, defensas alrededor, muros en anillo y minas, huertos y graneros afuera.
export function enemyVillage(level, avgLevel = 20, rnd = Math.random) {
  level = clamp(level, 1, MAX_LEVEL);
  const L = () => clamp(level + (rnd() < .3 ? -1 : 0), 1, MAX_LEVEL), list = []; let id = 1;
  const add = (kind, x, y, lv = L()) => list.push({ id: id++, kind, x, y, level: lv });
  add('casa', 10, 10, level);
  const defs = [[6, 6], [15, 6], [6, 15], [15, 15], [10, 5], [10, 16], [5, 10], [16, 10]];
  // Un poco menos defendida que lo máximo que deja su Casa Grande: así un ejército de tu mismo nivel puede ganar.
  const nTorre = Math.max(1, B.torre.limit[level - 1] - (level >= 2 ? 1 : 0)), nLanza = Math.max(0, B.lanza.limit[level - 1] - (level >= 3 ? 1 : 0));
  const spots = defs.slice().sort(() => rnd() - .5);
  for (let i = 0; i < nTorre && spots.length; i++) { const [x, y] = spots.shift(); add('torre', x, y); }
  for (let i = 0; i < nLanza && spots.length; i++) { const [x, y] = spots.shift(); add('lanza', x, y); }
  const outer = [[1, 1], [20, 1], [1, 20], [20, 20], [1, 10], [20, 10], [10, 1], [10, 20]].sort(() => rnd() - .5);
  const eco = ['mina', 'huerto', 'granero', 'mina', 'corral', 'huerto', 'granero', 'mina'];
  for (let i = 0; i < Math.min(outer.length, 3 + level); i++) { const [x, y] = outer[i], kind = eco[i]; if (B[kind].size === 4 && (x > 19 || y > 19)) add(kind, Math.min(x, 19), Math.min(y, 19)); else add(kind, x, y); }
  // Muro: anillo alrededor del centro (con más nivel, más completo).
  if (level >= 2) {
    const r0 = 4, r1 = 19, gaps = Math.max(1.5, 7 - level * 1.1);
    for (let i = r0; i <= r1; i++) for (const [x, y] of [[i, r0], [i, r1], [r0, i], [r1, i]]) {
      if (rnd() < gaps / 16) continue;
      if (list.some(b => x >= b.x && x < b.x + B[b.kind].size && y >= b.y && y < b.y + B[b.kind].size)) continue;
      if (!list.some(b => b.kind === 'muro' && b.x === x && b.y === y)) add('muro', x, y, Math.max(1, level - 1));
    }
  }
  // Sin choques (por si algún edificio grande se montó sobre otro).
  const ok = [];
  for (const b of list) { const s = B[b.kind].size; if (!ok.some(o => b.x < o.x + B[o.kind].size && b.x + s > o.x && b.y < o.y + B[o.kind].size && b.y + s > o.y)) ok.push(b); }
  const f = .55 + avgLevel / 50;
  return { buildings: ok, f, level, loot: { plata: Math.round((700 + level * 900 + rnd() * 600) * f), bayas: Math.round((600 + level * 700 + rnd() * 500) * f) } };
}

// ---------- Ataque ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Distancia de un punto al borde de un edificio (rectángulo).
function edge(b, x, y) { const dx = Math.max(b.x - x, 0, x - (b.x + b.s)), dy = Math.max(b.y - y, 0, y - (b.y + b.s)); return Math.hypot(dx, dy); }
export class RaidSim {
  // village: enemyVillage(); army: [{ card, count }]
  constructor({ village, army, seed = 1 }) {
    this.rnd = rng(seed); this.time = 0; this.phase = 'play'; this.events = []; this.nextId = 1;
    this.f = village.f || 1; this.loot = village.loot;
    this.buildings = village.buildings.map(b => { const D = B[b.kind], hp = Math.round(D.hp[b.level - 1] * this.f); return { ...b, s: D.size, cx: b.x + D.size / 2, cy: b.y + D.size / 2, hp, max: hp, def: DEFENSES.has(b.kind), cd: 0, target: null, wall: b.kind === 'muro', hitT: 0 }; });
    this.walls = new Map(this.buildings.filter(b => b.wall).map(b => [b.x + ',' + b.y, b]));
    this.total = this.buildings.filter(b => !b.wall).length;
    this.army = army.map(a => ({ card: a.card, count: a.count }));
    this.units = []; this.projectiles = []; this.deployed = 0; this.lastDeploy = 0;
  }
  alive() { return this.buildings.filter(b => !b.wall && b.hp > 0); }
  pct() { return this.total ? Math.round((1 - this.alive().length / this.total) * 100) : 100; }
  stars() { const p = this.pct(), casa = this.buildings.find(b => b.kind === 'casa'); return (p >= 50 ? 1 : 0) + (casa && casa.hp <= 0 ? 1 : 0) + (p >= 100 ? 1 : 0); }
  left() { return Math.max(0, RAID_TIME - this.time); }
  // Se suelta afuera de la zona roja: a más de una casilla de cualquier edificio (los muros no cuentan).
  canDeploy(x, y) {
    if (x < .3 || y < .3 || x > GRID - .3 || y > GRID - .3) return false;
    return !this.buildings.some(b => !b.wall && b.hp > 0 && x > b.x - 1 && x < b.x + b.s + 1 && y > b.y - 1 && y < b.y + b.s + 1) && !this.walls.get(Math.floor(x) + ',' + Math.floor(y))?.hp;
  }
  deploy(i, x, y) {
    const a = this.army[i]; if (this.phase !== 'play' || !a || a.count <= 0 || !this.canDeploy(x, y)) return false;
    a.count--; this.deployed++; this.lastDeploy = this.time;
    for (let k = 0; k < a.card.count; k++) this.spawn(a.card, x + (a.card.count > 1 ? Math.cos(k * 2.1) * .45 : 0), y + (a.card.count > 1 ? Math.sin(k * 2.1) * .45 : 0));
    this.events.push({ type: 'deploy', sp: a.card.sp, x, y });
    return true;
  }
  spawn(card, x, y) {
    const u = { id: this.nextId++, sp: card.sp, card, x: clamp(x, .3, GRID - .3), y: clamp(y, .3, GRID - .3), hp: card.hp, max: card.hp, dmg: card.dmg, speed: card.speed, rate: card.rate, range: card.range, r: card.r, flying: card.flying, ranged: card.ranged, tank: card.tank, types: card.types, cd: .4, deploy: .6, target: null, retarget: 0, moving: false, dir: [0, -1], attackT: 0, hitT: 0, side: 0 };
    this.units.push(u); return u;
  }
  pick(u) {
    const list = this.alive(); if (!list.length) return null;
    const pool = u.tank && list.some(b => b.def) ? list.filter(b => b.def) : list;
    let best = null, bd = Infinity; for (const b of pool) { const d = edge(b, u.x, u.y); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  step(dt) {
    if (this.phase === 'done') return;
    this.time += dt;
    for (const u of this.units) this.unitStep(u, dt);
    this.separate();
    for (const b of this.buildings) if (b.def && b.hp > 0) this.defStep(b, dt);
    this.projStep(dt);
    this.units = this.units.filter(u => u.hp > 0);
    const left = this.army.reduce((a, x) => a + x.count, 0);
    if (this.pct() >= 100 || this.time >= RAID_TIME || (this.deployed > 0 && left === 0 && !this.units.length && this.time - this.lastDeploy > 1.5)) this.finish();
  }
  unitStep(u, dt) {
    u.attackT = Math.max(0, u.attackT - dt); u.hitT = Math.max(0, u.hitT - dt);
    if (u.deploy > 0) { u.deploy -= dt; return; }
    u.cd = Math.max(0, u.cd - dt); u.retarget -= dt;
    if (!u.target || u.target.hp <= 0 || (u.retarget <= 0 && !u.target.wall)) { u.target = this.pick(u); u.retarget = 1; }
    const t = u.target; if (!t) { u.moving = false; return; }
    const d = edge(t, u.x, u.y);
    if (d <= u.range + u.r * .5) {
      u.moving = false; u.dir = [(t.cx - u.x) / (dist(u, { x: t.cx, y: t.cy }) || 1), (t.cy - u.y) / (dist(u, { x: t.cx, y: t.cy }) || 1)];
      if (u.cd <= 0) { u.cd = u.rate; u.attackT = .3; if (u.ranged) this.projectiles.push({ id: this.nextId++, x: u.x, y: u.y, h: u.flying ? 1.6 : .8, target: t, dmg: u.dmg, speed: 10, type: u.types[0], foe: false }); else { this.hit(t, u.dmg); this.events.push({ type: 'hit', x: t.cx, y: t.cy, kind: u.types[0] }); } }
      return;
    }
    const dx = t.cx - u.x, dy = t.cy - u.y, l = Math.hypot(dx, dy) || 1, s = u.speed * dt, nx = u.x + dx / l * s, ny = u.y + dy / l * s;
    if (!u.flying) { const w = this.walls.get(Math.floor(nx) + ',' + Math.floor(ny)); if (w && w.hp > 0 && w !== t) { u.target = w; u.retarget = 1.5; return; } }
    u.x = nx; u.y = ny; u.moving = true; u.dir = [dx / l, dy / l];
  }
  // Los de tierra no atraviesan edificios: se corren hasta el borde y siguen.
  separate() {
    const U = this.units;
    for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) {
      const a = U[i], b = U[j]; if (a.flying !== b.flying) continue;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); const min = a.r + b.r; if (d >= min) continue;
      if (d < 1e-4) { dx = this.rnd() - .5; dy = this.rnd() - .5; d = Math.hypot(dx, dy); }
      const p = (min - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p;
    }
    for (const u of U) {
      if (!u.flying) for (const b of this.buildings) {
        if (b.hp <= 0 || b.wall) continue;
        if (u.x > b.x - u.r * .6 && u.x < b.x + b.s + u.r * .6 && u.y > b.y - u.r * .6 && u.y < b.y + b.s + u.r * .6) {
          const out = [[b.x - u.r * .6 - u.x, 0], [b.x + b.s + u.r * .6 - u.x, 0], [0, b.y - u.r * .6 - u.y], [0, b.y + b.s + u.r * .6 - u.y]].sort((p, q) => Math.hypot(...p) - Math.hypot(...q))[0];
          u.x += out[0]; u.y += out[1];
        }
      }
      u.x = clamp(u.x, .3, GRID - .3); u.y = clamp(u.y, .3, GRID - .3);
    }
  }
  defStep(b, dt) {
    const D = B[b.kind]; b.cd = Math.max(0, b.cd - dt); b.hitT = Math.max(0, b.hitT - dt);
    if (!b.target || b.target.hp <= 0 || dist({ x: b.cx, y: b.cy }, b.target) > D.range + b.s / 2) {
      b.target = null; let bd = Infinity;
      for (const u of this.units) { if (u.hp <= 0 || u.deploy > 0 || (u.flying && !D.air)) continue; const d = dist({ x: b.cx, y: b.cy }, u); if (d <= D.range + b.s / 2 && d < bd) { bd = d; b.target = u; } }
    }
    if (b.target && b.cd <= 0) { b.cd = D.rate; this.projectiles.push({ id: this.nextId++, x: b.cx, y: b.cy, h: 2.6, target: b.target, tx: b.target.x, ty: b.target.y, dmg: Math.round(D.dmg[b.level - 1] * this.f), speed: D.splash ? 8 : 13, type: b.kind, foe: true, splash: D.splash || 0 }); this.events.push({ type: 'shoot', id: b.id }); }
  }
  projStep(dt) {
    for (const p of this.projectiles) {
      const t = p.target, alive = t && t.hp > 0;
      const tx = p.splash ? p.tx : alive ? (t.cx ?? t.x) : null, ty = p.splash ? p.ty : alive ? (t.cy ?? t.y) : null;
      if (tx === null) { p.done = true; continue; }
      const dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy), s = p.speed * dt;
      if (l <= s + .3) {
        p.done = true;
        if (p.splash) { for (const u of this.units) if (!u.flying && u.hp > 0 && dist(u, { x: tx, y: ty }) <= p.splash) this.hit(u, p.dmg); this.events.push({ type: 'boom', x: tx, y: ty }); }
        else if (alive) { this.hit(t, p.dmg); this.events.push({ type: 'impact', x: tx, y: ty, kind: p.type, foe: p.foe }); }
        continue;
      }
      p.x += dx / l * s; p.y += dy / l * s;
    }
    this.projectiles = this.projectiles.filter(p => !p.done);
  }
  hit(t, dmg) {
    if (t.hp <= 0) return;
    t.hp -= dmg; t.hitT = .15; if (t.hp > 0) return; t.hp = 0;
    if (t.kind) { this.events.push({ type: 'down', id: t.id, x: t.cx, y: t.cy, kind: t.kind, wall: t.wall }); }
    else this.events.push({ type: 'die', id: t.id, x: t.x, y: t.y });
  }
  finish() { if (this.phase === 'done') return; this.phase = 'done'; this.events.push({ type: 'end' }); }
  // Botín: la parte de la plata y las bayas del rival según lo destruido.
  spoils() { const k = this.pct() / 100; return { plata: Math.round(this.loot.plata * k), bayas: Math.round(this.loot.bayas * k), stars: this.stars(), pct: this.pct() }; }
}
