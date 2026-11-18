// Duelo de Torres: lógica pura del juego de arena (sin dibujo ni pantalla, se prueba en Node).
// Dos lados: 0 = jugador (abajo) y 1 = rival (arriba). El campo mide 18 × 32 casillas; el río va de y=15 a
// y=17 y se cruza por dos puentes (x=3.5 y x=14.5). Cada lado tiene dos torres y una torre mayor.
// Las cartas son Puchamon: su costo sale de la especie y su fuerza del nivel de tu criatura.
import { SPECIES, effectiveness } from '../../data/creatures.js';

export const FIELD = { w: 18, h: 32, riverTop: 15, riverBottom: 17, bridges: [3.5, 14.5], bridgeHalf: 1.15 };
export const MATCH_TIME = 180, OVERTIME = 60, MAX_ENERGY = 10, ENERGY_EVERY = 2.8, SIGHT = 5.5;
export const TOWER = {
  side: { hp: 2000, range: 7, dmg: 50, rate: .8, r: 1.15 },
  king: { hp: 3200, range: 7.5, dmg: 62, rate: 1, r: 1.6 }
};
// Tipos que atacan a distancia (lanzan algo); los voladores pasan por encima del río.
const RANGED = new Set(['fuego', 'agua', 'electrico', 'hielo', 'psiquico', 'fantasma', 'hada', 'dragon']);
const TANK_TYPES = new Set(['roca', 'acero', 'tierra']);
export const LOANERS = ['brotelo', 'brasin', 'charquin', 'roedin', 'pipiu', 'chispaz', 'setin', 'garcilla', 'frailin', 'capullin'];
// Arenas por trofeos: cambian el paisaje y lo fuertes que son los rivales.
export const ARENAS = [
  { min: 0, name: 'Pradera Brisal', biome: 'meadow', maxTotal: 290 },
  { min: 300, name: 'Cafetal', biome: 'jungle', maxTotal: 340 },
  { min: 700, name: 'Desierto Tatacoa', biome: 'desert', maxTotal: 380 },
  { min: 1100, name: 'Nevado Escarcha', biome: 'snow', maxTotal: 420 },
  { min: 1600, name: 'Cerro Fragua', biome: 'volcano', maxTotal: 999 }
];
export const RIVAL_NAMES = ['Tomás', 'Lucía', 'Bruno', 'Celeste', 'Ramiro', 'Ximena', 'Gael', 'Paz', 'Julián', 'Renata', 'Iker', 'Salomé', 'Dante', 'Violeta', 'Emilio', 'Abril'];

export const arenaOf = trophies => [...ARENAS].reverse().find(a => trophies >= a.min) || ARENAS[0];
const total = sp => { const b = SPECIES[sp].base; return b.hp + b.atk + b.def + b.spe; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function rng(seed = 1) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(list, rnd) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }

export function speciesCost(sp) { return clamp(Math.round(total(sp) / 68 - .3) + (SPECIES[sp].legendary ? 1 : 0), 2, 7); }
// Carta de una especie al nivel dado. Los pequeñitos salen de a tres (enjambre); los de roca, acero o tierra
// grandes son tanques que van directo a las torres.
export function makeCard(sp, level, loan = false) {
  const S = SPECIES[sp], b = S.base, sum = total(sp), t0 = S.types[0];
  const f = .55 + level / 50, swarm = sum < 192 ? 3 : 1, k = swarm > 1 ? .42 : 1;
  const flying = S.types.includes('volador'), ranged = !flying && RANGED.has(t0);
  const tank = !ranged && !flying && sum >= 300 && S.types.some(t => TANK_TYPES.has(t));
  return {
    sp, name: S.name, level, loan, cost: speciesCost(sp), types: S.types, count: swarm,
    hp: Math.round((100 + b.hp * 5 + b.def * 3) * f * k * (tank ? 1.4 : 1)),
    dmg: Math.round((20 + b.atk) * f * k * (tank ? .8 : 1)),
    speed: +((.75 + b.spe / 110) * (tank ? .85 : 1)).toFixed(2),
    rate: ranged ? 1.25 : flying ? 1.05 : 1,
    range: ranged ? 4.2 : flying ? 1.3 : .6,
    flying, ranged, tank, air: ranged || flying,
    r: swarm > 1 ? .32 : sum >= 330 ? .55 : .42
  };
}
export function cardRole(c) {
  if (c.tank) return 'Tanque: va directo a las torres';
  if (c.count > 1) return `Enjambre: salen ${c.count}`;
  if (c.flying) return 'Vuela sobre el río';
  if (c.ranged) return 'Ataca a distancia';
  return 'Cuerpo a cuerpo';
}
// La criatura más fuerte de cada especie entre el equipo y la caja.
export function ownedBest(st) {
  const best = {};
  for (const c of [...(st.party || []), ...(st.box || [])]) if (c && SPECIES[c.sp] && (!best[c.sp] || c.level > best[c.sp].level)) best[c.sp] = c;
  return best;
}
// Mazo del jugador: las especies que escogió (máximo 8) y, si faltan, sus criaturas más fuertes; si aun así no
// llega a 8, se completa con Puchamon prestados de un nivel parecido.
export function playerDeck(st) {
  const best = ownedBest(st), chosen = (st.arena?.deck || []).filter(sp => best[sp]);
  const rest = Object.values(best).sort((a, b) => b.level - a.level).map(c => c.sp).filter(sp => !chosen.includes(sp));
  const list = [...new Set([...chosen, ...rest])].slice(0, 8);
  const cards = list.map(sp => makeCard(sp, best[sp].level));
  const avg = cards.length ? cards.reduce((a, c) => a + c.level, 0) / cards.length : 8;
  for (const sp of LOANERS) { if (cards.length >= 8) break; if (!list.includes(sp)) cards.push(makeCard(sp, clamp(Math.round(avg - 4), 5, 60), true)); }
  return cards;
}
// Nivel del rival: parecido al de tu mazo (un poco más bajo al empezar y más alto con muchos trofeos).
export function rivalLevel(trophies, playerAvg = null) {
  const base = playerAvg ? playerAvg * (.78 + Math.min(.42, trophies / 2500)) : 6 + trophies / 22;
  return clamp(Math.round(base), 5, 75);
}
// Mazo del rival: especies de la arena (más fuertes a más trofeos), con al menos un tirador o volador.
export function rivalDeck(trophies, rnd = Math.random, playerAvg = null) {
  const A = arenaOf(trophies), lvl = rivalLevel(trophies, playerAvg);
  const pool = shuffle(Object.keys(SPECIES).filter(sp => !SPECIES[sp].legendary && total(sp) <= A.maxTotal), rnd);
  const picks = pool.slice(0, 8);
  if (!picks.some(sp => makeCard(sp, 5).air)) { const air = pool.find(sp => makeCard(sp, 5).air && !picks.includes(sp)); if (air) picks[7] = air; }
  return picks.map(sp => makeCard(sp, clamp(lvl + Math.round((rnd() - .5) * 4), 5, 75)));
}

export function arenaState(st) {
  st.arena = Object.assign({ trophies: 0, best: 0, wins: 0, losses: 0, draws: 0, deck: [] }, st.arena || {});
  if (!Array.isArray(st.arena.deck)) st.arena.deck = [];
  return st.arena;
}
// Premio de una partida: trofeos y plata (compartida con Puchamon). Se calcula aparte para probarlo.
export function arenaReward(trophies, winner, crowns, foeCrowns) {
  const tier = ARENAS.indexOf(arenaOf(trophies));
  if (winner === 0) return { trophies: 26 + crowns * 2, money: 150 + crowns * 60 + tier * 50, capsules: crowns === 3 ? 2 : 0 };
  if (winner === -1) return { trophies: 0, money: 60 + tier * 20, capsules: 0 };
  return { trophies: -Math.min(trophies, 12 + foeCrowns * 2), money: 25 + crowns * 15, capsules: 0 };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const alive = e => e && e.hp > 0;

export class ArenaSim {
  // decks: [cartas del jugador, cartas del rival]. ai: lados que juega la máquina (por defecto el rival).
  // towerLevel: nivel de las torres de cada lado (crecen igual que las criaturas: .55 + nivel/50).
  constructor({ decks, seed = 1, skill = .4, ai = [1], towerLevel = null }) {
    this.rnd = rng(seed);
    this.time = 0; this.phase = 'play'; this.overtime = false; this.winner = null; this.crowns = [0, 0];
    this.energy = [5, 5]; this.units = []; this.projectiles = []; this.events = []; this.nextId = 1;
    this.decks = decks.map(d => d.slice(0, 8));
    this.hand = [[], []]; this.queue = [[], []];
    for (const s of [0, 1]) { const order = shuffle(this.decks[s].map((_, i) => i), this.rnd); this.hand[s] = order.slice(0, 4); this.queue[s] = order.slice(4); }
    const lv = towerLevel || this.decks.map(d => d.length ? d.reduce((a, c) => a + c.level, 0) / d.length : 20);
    this.towerLevel = lv.map(l => Math.round(l));
    const tw = (side, kind, x, y) => { const f = .55 + lv[side] / 50, T = TOWER[kind], hp = Math.round(T.hp * f); return { id: 't' + side + kind + x, side, kind, x, y, hp, max: hp, r: T.r, range: T.range, dmg: Math.round(T.dmg * f), rate: T.rate, cd: 0, target: null, active: kind === 'side', types: ['roca'] }; };
    this.towers = [tw(0, 'king', 9, 29), tw(0, 'side', 3.5, 25.5), tw(0, 'side', 14.5, 25.5), tw(1, 'king', 9, 3), tw(1, 'side', 3.5, 6.5), tw(1, 'side', 14.5, 6.5)];
    this.ais = ai.map(side => new RivalAI(this, side, skill));
    this.played = [0, 0];
  }
  left() { return Math.max(0, (this.overtime ? MATCH_TIME + OVERTIME : MATCH_TIME) - this.time); }
  doubleEnergy() { return this.overtime || this.time >= MATCH_TIME - 60; }
  card(side, slot) { const i = this.hand[side][slot]; return i === undefined ? null : this.decks[side][i]; }
  next(side) { const i = this.queue[side][0]; return i === undefined ? null : this.decks[side][i]; }
  king(side) { return this.towers.find(t => t.side === side && t.kind === 'king'); }
  // ¿Se puede soltar una carta ahí? En tu mitad; si tumbaste una torre de ese lado, también más adelante.
  canPlace(side, x, y) {
    if (x < .6 || x > FIELD.w - .6 || y < .8 || y > FIELD.h - .8) return false;
    if (y > FIELD.riverTop - .4 && y < FIELD.riverBottom + .4) return false;
    for (const t of this.towers) if (t.hp > 0 && dist(t, { x, y }) < t.r + .35) return false;
    const own = side === 0 ? y >= FIELD.riverBottom + .6 : y <= FIELD.riverTop - .6;
    if (own) return true;
    const foe = 1 - side, left = x < FIELD.w / 2;
    const down = this.towers.find(t => t.side === foe && t.kind === 'side' && (t.x < FIELD.w / 2) === left);
    if (!down || down.hp > 0) return false;
    return side === 0 ? y >= 9.5 : y <= FIELD.h - 9.5;
  }
  play(side, slot, x, y) {
    if (this.phase !== 'play') return false;
    const idx = this.hand[side][slot], card = this.decks[side][idx];
    if (!card || this.energy[side] < card.cost || !this.canPlace(side, x, y)) return false;
    this.energy[side] -= card.cost; this.played[side]++;
    for (let i = 0; i < card.count; i++) {
      const a = i * 2.1, off = card.count > 1 ? .55 : 0;
      this.spawn(card, side, clamp(x + Math.cos(a) * off, .6, FIELD.w - .6), clamp(y + Math.sin(a) * off, .8, FIELD.h - .8));
    }
    this.hand[side][slot] = this.queue[side].shift(); this.queue[side].push(idx);
    this.events.push({ type: 'play', side, sp: card.sp, x, y });
    return true;
  }
  spawn(card, side, x, y) {
    const u = { id: this.nextId++, side, sp: card.sp, card, x, y, hp: card.hp, max: card.hp, dmg: card.dmg, speed: card.speed, rate: card.rate, range: card.range, r: card.r, types: card.types, flying: card.flying, ranged: card.ranged, tank: card.tank, air: card.air, cd: .3, deploy: 1, retarget: 0, target: null, moving: false, dir: [0, side ? 1 : -1], hitT: 0, attackT: 0 };
    this.units.push(u); this.events.push({ type: 'spawn', id: u.id });
    return u;
  }
  step(dt) {
    if (this.phase === 'done') return;
    this.time += dt;
    const k = this.doubleEnergy() ? 2 : 1;
    for (const s of [0, 1]) this.energy[s] = Math.min(MAX_ENERGY, this.energy[s] + dt / ENERGY_EVERY * k);
    for (const ai of this.ais) ai.step(dt);
    for (const u of this.units) this.unitStep(u, dt);
    this.separate();
    for (const t of this.towers) this.towerStep(t, dt);
    this.projectileStep(dt);
    this.units = this.units.filter(u => u.hp > 0);
    this.checkEnd();
  }
  // Busca el enemigo más cercano a la vista (los tanques sólo miran torres); si no hay, la torre de su carril.
  findTarget(u) {
    const foe = 1 - u.side; let best = null, bd = Infinity;
    if (!u.tank) for (const e of this.units) {
      if (e.side !== foe || e.hp <= 0 || (e.flying && !u.air)) continue;
      const d = dist(u, e) - e.r; if (d < SIGHT && d < bd) { bd = d; best = e; }
    }
    for (const t of this.towers) { if (t.side !== foe || t.hp <= 0) continue; const d = dist(u, t) - t.r; if (d < SIGHT && d < bd) { bd = d; best = t; } }
    return best || this.laneTower(u);
  }
  laneTower(u) {
    const foe = 1 - u.side, left = u.x < FIELD.w / 2;
    return this.towers.find(t => t.side === foe && t.kind === 'side' && (t.x < FIELD.w / 2) === left && t.hp > 0) || this.towers.find(t => t.side === foe && t.kind === 'king' && t.hp > 0) || null;
  }
  // Por tierra hay que cruzar por un puente: primero a la entrada, luego derecho por el puente.
  waypoint(u, tx, ty) {
    if (u.flying) return [tx, ty];
    const mid = (FIELD.riverTop + FIELD.riverBottom) / 2, inRiver = u.y > FIELD.riverTop - .05 && u.y < FIELD.riverBottom + .05;
    const bx = Math.abs(u.x - FIELD.bridges[0]) < Math.abs(u.x - FIELD.bridges[1]) ? FIELD.bridges[0] : FIELD.bridges[1];
    if (inRiver) return [bx, ty < mid ? FIELD.riverTop - .3 : FIELD.riverBottom + .3];
    const across = (u.y > mid) !== (ty > mid);
    if (!across) return [tx, ty];
    const bank = u.y > mid ? FIELD.riverBottom + .3 : FIELD.riverTop - .3;
    if (Math.abs(u.x - bx) > .3) return [bx, bank];
    return [bx, u.y > mid ? FIELD.riverTop - .3 : FIELD.riverBottom + .3];
  }
  unitStep(u, dt) {
    u.hitT = Math.max(0, u.hitT - dt); u.attackT = Math.max(0, u.attackT - dt);
    if (u.deploy > 0) { u.deploy -= dt; return; }
    u.cd = Math.max(0, u.cd - dt); u.retarget -= dt;
    if (!alive(u.target) || u.retarget <= 0) { u.target = this.findTarget(u); u.retarget = .45; }
    const t = u.target; if (!t) { u.moving = false; return; }
    const d = dist(u, t), reach = u.range + u.r + t.r;
    if (d <= reach) {
      u.moving = false; u.dir = [(t.x - u.x) / (d || 1), (t.y - u.y) / (d || 1)];
      if (u.cd <= 0) { this.attack(u, t); u.cd = u.rate; u.attackT = .3; }
      return;
    }
    const [wx, wy] = this.waypoint(u, t.x, t.y);
    const dx = wx - u.x, dy = wy - u.y, l = Math.hypot(dx, dy) || 1, s = Math.min(u.speed * dt, l);
    u.x += dx / l * s; u.y += dy / l * s; u.moving = true; u.dir = [dx / l, dy / l];
  }
  attack(u, t) {
    const eff = t.kind ? 1 : clamp(effectiveness(u.types[0], t.types), .5, 2), dmg = u.dmg * eff;
    if (u.ranged) { this.projectiles.push({ id: this.nextId++, x: u.x, y: u.y, h: u.flying ? 1.6 : .8, target: t, dmg, side: u.side, type: u.types[0], speed: 10, tower: false }); this.events.push({ type: 'shoot', id: u.id }); }
    else { this.damage(t, dmg); this.events.push({ type: 'hit', id: u.id, target: t.id, eff, x: t.x, y: t.y, kind: u.types[0] }); }
  }
  damage(t, dmg) {
    if (t.hp <= 0) return;
    t.hp -= dmg; t.hitT = .15;
    if (t.kind === 'king') t.active = true;
    if (t.hp > 0) return;
    t.hp = 0;
    if (!t.kind) { this.events.push({ type: 'die', id: t.id, x: t.x, y: t.y, side: t.side }); return; }
    const foe = 1 - t.side;
    this.events.push({ type: 'tower', id: t.id, side: t.side, kind: t.kind, x: t.x, y: t.y });
    if (t.kind === 'king') { this.crowns[foe] = 3; this.finish(foe); return; }
    this.crowns[foe]++; this.king(t.side).active = true;
    if (this.overtime) this.finish(foe);
  }
  towerStep(t, dt) {
    if (t.hp <= 0) return;
    t.cd = Math.max(0, t.cd - dt); t.hitT = Math.max(0, (t.hitT || 0) - dt);
    if (t.kind === 'king' && !t.active) return;
    if (!alive(t.target) || dist(t, t.target) > t.range + t.target.r) {
      t.target = null; let bd = Infinity;
      for (const e of this.units) { if (e.side === t.side || e.hp <= 0 || e.deploy > 0) continue; const d = dist(t, e); if (d <= t.range + e.r && d < bd) { bd = d; t.target = e; } }
    }
    if (t.target && t.cd <= 0) { this.projectiles.push({ id: this.nextId++, x: t.x, y: t.y, h: t.kind === 'king' ? 3.2 : 2.6, target: t.target, dmg: t.dmg, side: t.side, type: 'tower', speed: 13, tower: true }); t.cd = t.rate; this.events.push({ type: 'shoot', id: t.id, tower: true }); }
  }
  projectileStep(dt) {
    for (const p of this.projectiles) {
      const t = p.target; if (!alive(t)) { p.done = true; continue; }
      const dx = t.x - p.x, dy = t.y - p.y, l = Math.hypot(dx, dy), s = p.speed * dt;
      if (l <= s + .3) { p.done = true; this.damage(t, p.dmg); this.events.push({ type: 'impact', x: t.x, y: t.y, kind: p.type, tower: p.tower, target: t.id }); continue; }
      p.x += dx / l * s; p.y += dy / l * s;
    }
    this.projectiles = this.projectiles.filter(p => !p.done);
  }
  // Empujones suaves entre criaturas, las torres estorban, los bordes y el río sólo se cruzan por los puentes.
  separate() {
    const U = this.units;
    for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) {
      const a = U[i], b = U[j]; if (a.flying !== b.flying) continue;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); const min = a.r + b.r;
      if (d >= min) continue;
      if (d < 1e-4) { dx = this.rnd() - .5; dy = this.rnd() - .5; d = Math.hypot(dx, dy); }
      const push = (min - d) / 2, nx = dx / d, ny = dy / d, wa = a.tank && !b.tank ? .35 : 1, wb = b.tank && !a.tank ? .35 : 1;
      a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * wb; b.y += ny * push * wb;
    }
    for (const u of U) {
      if (!u.flying) for (const t of this.towers) {
        if (t.hp <= 0) continue; const dx = u.x - t.x, dy = u.y - t.y, d = Math.hypot(dx, dy) || 1e-4, min = t.r + u.r;
        if (d < min) { u.x = t.x + dx / d * min; u.y = t.y + dy / d * min; }
      }
      u.x = clamp(u.x, .4, FIELD.w - .4); u.y = clamp(u.y, .5, FIELD.h - .5);
      if (!u.flying && u.y > FIELD.riverTop && u.y < FIELD.riverBottom) {
        const bx = Math.abs(u.x - FIELD.bridges[0]) < Math.abs(u.x - FIELD.bridges[1]) ? FIELD.bridges[0] : FIELD.bridges[1];
        const lim = FIELD.bridgeHalf - u.r * .6; u.x = clamp(u.x, bx - lim, bx + lim);
      }
    }
  }
  checkEnd() {
    if (this.phase === 'done') return;
    if (!this.overtime && this.time >= MATCH_TIME) {
      if (this.crowns[0] !== this.crowns[1]) return this.finish(this.crowns[0] > this.crowns[1] ? 0 : 1);
      this.overtime = true; this.events.push({ type: 'overtime' });
    }
    if (this.overtime && this.time >= MATCH_TIME + OVERTIME) {
      // Desempate: gana quien tenga sus torres con más vida (en proporción).
      const life = s => this.towers.filter(t => t.side === s).reduce((a, t) => a + t.hp / t.max, 0);
      const a = life(0), b = life(1);
      this.finish(Math.abs(a - b) < .02 ? -1 : a > b ? 0 : 1);
    }
  }
  finish(w) { if (this.phase === 'done') return; this.phase = 'done'; this.winner = w; this.events.push({ type: 'end', winner: w }); }
}

// Rival de la máquina: defiende lo que cruza a su mitad con la carta que mejor le gane por tipo y, cuando
// junta energía, arma un ataque por el carril donde tu torre está más débil (tanque atrás y tirador detrás).
export class RivalAI {
  constructor(sim, side, skill = .4) { this.sim = sim; this.side = side; this.skill = skill; this.wait = 2.2; this.saving = 7.5; this.support = 0; this.lane = null; }
  step(dt) {
    const s = this.sim; if (s.phase !== 'play') return;
    this.wait -= dt; if (this.wait > 0) return;
    this.wait = (1.15 - this.skill * .65) + s.rnd() * .6;
    const me = this.side, foe = 1 - me, E = s.energy[me];
    const hand = s.hand[me].map((idx, slot) => ({ slot, card: s.decks[me][idx] })).filter(h => h.card);
    const can = hand.filter(h => h.card.cost <= E);
    if (!can.length) return;
    const home = me === 1 ? y => y < FIELD.riverBottom + 1.5 : y => y > FIELD.riverTop - 1.5;
    const myKing = s.king(me);
    const threats = s.units.filter(u => u.side === foe && home(u.y)).sort((a, b) => dist(a, myKing) - dist(b, myKing));
    const ownNear = th => s.units.filter(u => u.side === me && dist(u, th) < 4).reduce((a, u) => a + u.hp, 0);
    const th = threats.find(t => ownNear(t) < t.hp * .8);
    if (th) {
      let best = null, bv = -Infinity;
      for (const h of can) {
        const c = h.card; if (th.flying && !c.air) continue;
        const eff = clamp(effectiveness(c.types[0], th.types), .5, 2);
        const v = eff * 2 + c.hp * c.dmg / 2e4 - c.cost * .25 + (c.tank ? -1.5 : 0) + s.rnd() * (1.2 - this.skill);
        if (v > bv) { bv = v; best = h; }
      }
      if (best) {
        const x = clamp(th.x + (s.rnd() - .5) * 2, 1, FIELD.w - 1);
        const y = me === 1 ? clamp(th.y - 3.2, 1.5, FIELD.riverTop - .8) : clamp(th.y + 3.2, FIELD.riverBottom + .8, FIELD.h - 1.5);
        if (s.play(me, best.slot, x, y)) return;
      }
    }
    if (this.support && s.time >= this.support && this.lane !== null) {
      const sh = can.find(h => h.card.ranged || h.card.flying) || can.find(h => !h.card.tank);
      this.support = 0;
      if (sh && s.play(me, sh.slot, this.lane + (s.rnd() - .5), me === 1 ? 11.5 : FIELD.h - 11.5)) return;
    }
    if (E >= this.saving || E >= MAX_ENERGY - .05) {
      const sides = s.towers.filter(t => t.side === foe && t.kind === 'side');
      const weak = sides.filter(t => t.hp > 0).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      const lane = weak && s.rnd() < .7 ? (weak.x < FIELD.w / 2 ? FIELD.bridges[0] : FIELD.bridges[1]) : FIELD.bridges[s.rnd() < .5 ? 0 : 1];
      const pick = can.find(h => h.card.tank) || [...can].sort((a, b) => b.card.hp - a.card.hp)[0];
      const back = pick.card.tank || pick.card.speed < 1.05;
      const y = me === 1 ? (back ? 3.6 : 13.4) : (back ? FIELD.h - 3.6 : FIELD.h - 13.4);
      const x = back ? clamp(lane + (lane < 9 ? 2.5 : -2.5), 2, 16) : lane + (s.rnd() - .5);
      if (s.play(me, pick.slot, x, y)) { this.saving = 6.5 + s.rnd() * 3; this.lane = lane; this.support = s.time + (back ? 3.5 : 1.2); }
    }
  }
}
