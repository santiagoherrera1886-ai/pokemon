// Pelea Puchamon: lógica pura del juego de pelea en plataformas (sin dibujo, se prueba en Node).
// Vista de lado: x a la derecha, y hacia arriba. Cada peleador acumula daño (%); entre más daño, más lejos sale
// volando con cada golpe. Pierde una vida si sale de la zona (lados, abajo o muy arriba). Gana el último en pie.
import { SPECIES, effectiveness } from '../../data/creatures.js';
import { rng } from '../arena/sim.js';

export const G = 34, MAX_FALL = 15, FAST_FALL = 21, STOCKS = 3, TIME = 180;
// Escenarios: el piso grande (sólido) y plataformas que se cruzan desde abajo. blast = zona de salida.
export const STAGES = {
  // taper: la roca de abajo se angosta desde "from" de profundidad, "slope" de ancho por cada unidad (isla flotante).
  isla: { name: 'Isla Flotante', biome: 'meadow', main: [-8, 8], depth: 6, taper: { from: 1.1, slope: 1.25 }, plats: [[-5.8, -1.8, 3.2], [1.8, 5.8, 3.2], [-2, 2, 6.2]], blast: { x: 17, bottom: -11, top: 14 }, spawn: [[-5, 0], [5, 0], [-2, 0], [2, 0]] },
  volcan: { name: 'Cráter de Fragua', biome: 'volcano', main: [-9, 9], depth: 6.4, taper: { from: 1.2, slope: 1.15 }, plats: [[-7, -3, 2.8], [3, 7, 2.8]], blast: { x: 18, bottom: -11, top: 14 }, spawn: [[-6, 0], [6, 0], [-2.5, 0], [2.5, 0]] },
  templo: { name: 'Templo del Alba', biome: 'templo', main: [-9.5, 9.5], depth: 5.6, taper: { from: 1.6, slope: 1.35 }, plats: [], blast: { x: 18.5, bottom: -11, top: 15 }, spawn: [[-6, 0], [6, 0], [-2.5, 0], [2.5, 0]] }
};
// Ancho que le quita la roca angostada a cada lado a la altura y (0 arriba del piso).
export function taperCut(S, y) { const t = S.taper; return t && -y > t.from ? (-y - t.from) * t.slope : 0; }
const RANGED = new Set(['fuego', 'agua', 'electrico', 'hielo', 'psiquico', 'fantasma', 'hada', 'dragon']);
// Ataques: tiempos en segundos (arranque, activo, recuperación), golpe relativo al peleador mirando a la derecha.
export const MOVES = {
  jab: { start: .05, active: .08, rec: .12, dx: .8, dy: .62, r: .55, dmg: 3, kb: 3, grow: .45, ang: 35 },
  side: { start: .13, active: .1, rec: .26, dx: 1.0, dy: .6, r: .72, dmg: 10, kb: 5.5, grow: 1.15, ang: 38 },
  up: { start: .1, active: .14, rec: .22, dx: .1, dy: 1.45, r: .78, dmg: 8, kb: 5, grow: 1.05, ang: 86 },
  down: { start: .1, active: .1, rec: .25, dx: .75, dy: .18, r: .72, dmg: 7, kb: 4.6, grow: .9, ang: 22 },
  air: { start: .07, active: .2, rec: .15, dx: .55, dy: .6, r: .8, dmg: 6, kb: 4.2, grow: .85, ang: 42 },
  dash: { start: .08, active: .26, rec: .25, dx: .7, dy: .6, r: .75, dmg: 10, kb: 6, grow: 1.0, ang: 32 },
  recover: { start: .02, active: .3, rec: .1, dx: 0, dy: 1.0, r: .8, dmg: 5, kb: 4, grow: .6, ang: 80 },
  // Poder de su tipo (abajo + B): estalla alrededor y lanza hacia arriba a los que estén cerca.
  power: { start: .24, active: .16, rec: .36, dx: 0, dy: .75, r: 1.5, dmg: 12, kb: 6.2, grow: 1.05, ang: 72 }
};
export const POWER_CD = 4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Peleador a partir de una especie y nivel: peso (vida y defensa), fuerza (ataque), rapidez y su especial por tipo.
export function makeFighter(sp, level = 20, opts = {}) {
  const S = SPECIES[sp], b = S.base, t0 = S.types[0];
  return {
    sp, name: S.name, level, types: S.types, cpu: !!opts.cpu, team: opts.team ?? null, color: opts.color || '#3f7fe8', boss: !!opts.boss,
    // Jefe de la historia: más pesado (cuesta sacarlo) y pega más duro.
    weight: Math.round((30 + (b.hp + b.def) / 4) * (opts.boss ? 1.45 : 1)), power: +((.82 + b.atk / 160 + level / 400) * (opts.boss ? 1.12 : 1)).toFixed(3),
    speed: +(5.4 + b.spe / 45).toFixed(2), jump: +(12.6 + b.spe / 90).toFixed(2), special: RANGED.has(t0) ? 'shot' : 'dash',
    x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, face: 1, ground: false, jumps: 1, upB: true, damage: 0, stocks: STOCKS,
    state: 'idle', move: null, t: 0, stun: 0, inv: 0, shield: 1, shielding: false, broken: 0, cd: 0, hit: new Set(), out: false, respawn: 0, kos: 0, falls: 0, drop: 0,
    freeze: 0, charge: 0, charging: null, mul: 1, ledge: 0, ledgeT: 0, noLedge: 0, hopT: 0, flip: 0,
    dodge: 0, dodgeDir: 0, airDodge: false, prevX: 0, prevDown: false, prevShield: false, pcd: 1.5
  };
}

export class FightSim {
  // fighters: makeFighter(...) para cada uno (el 0 es el jugador si no es cpu). skill: 0..1 para la máquina.
  constructor({ fighters, stage = 'isla', seed = 1, skill = .5, time = TIME }) {
    this.rnd = rng(seed); this.stage = STAGES[stage] || STAGES.isla; this.stageId = STAGES[stage] ? stage : 'isla';
    this.f = fighters; this.time = 0; this.limit = time; this.phase = 'play'; this.events = []; this.shots = []; this.nextId = 1; this.winner = null; this.skill = skill;
    // Sin equipo dado, cada uno pelea solo (todos contra todos).
    this.f.forEach((p, i) => { p.id = i; if (p.team == null) p.team = i; const [x, y] = this.stage.spawn[i % this.stage.spawn.length]; p.x = x; p.y = y; p.face = x < 0 ? 1 : -1; p.ground = true; p.ai = p.cpu ? { wait: .5 + i * .2, intent: null } : null; });
    this.input = this.f.map(() => blankInput());
  }
  alive() { return this.f.filter(p => p.stocks > 0); }
  // ---------- Entrada (jugador o máquina) ----------
  // Cada cuadro: x (-1..1), down, up, pulsaciones de una vez (jump, attack, special) y sostenidos (shield,
  // attackHeld para cargar el golpe fuerte, jumpHeld: si se suelta rápido el salto queda corto).
  setInput(i, inp) { this.input[i] = { ...blankInput(), ...inp }; }
  step(dt) {
    if (this.phase === 'done') return;
    this.time += dt;
    for (const p of this.f) if (p.cpu && p.stocks > 0 && !p.out) this.input[p.id] = this.think(p, dt);
    for (const p of this.f) this.fighterStep(p, this.input[p.id], dt);
    this.attacks();
    this.shotStep(dt);
    for (const p of this.f) this.input[p.id] = { ...this.input[p.id], jump: false, attack: false, special: false };
    this.checkEnd();
  }
  platformUnder(p, prevY) {
    const S = this.stage;
    if (p.x >= S.main[0] && p.x <= S.main[1] && prevY >= -.01 && p.y <= 0) return 0;
    if (p.drop > 0) return null;
    for (const [a, b, h] of S.plats) if (p.x >= a && p.x <= b && prevY >= h - .01 && p.y <= h) return h;
    return null;
  }
  fighterStep(p, inp, dt) {
    if (p.stocks <= 0) return;
    if (p.out) { p.respawn -= dt; if (p.respawn <= 0) this.respawn(p); return; }
    // Pausa de impacto: el que pega y el que recibe se quedan quietos un instante (el golpe "pesa").
    if (p.freeze > 0) { p.freeze -= dt; return; }
    p.inv = Math.max(0, p.inv - dt); p.cd = Math.max(0, p.cd - dt); p.pcd = Math.max(0, p.pcd - dt); p.drop = Math.max(0, p.drop - dt); p.broken = Math.max(0, p.broken - dt); p.noLedge = Math.max(0, p.noLedge - dt);
    p.flip = Math.max(0, p.flip - dt);
    const prevY = p.y, S = this.stage;
    // Lo que se acaba de oprimir en este cuadro (para rodar y esquivar sin que se dispare solo al correr).
    const newX = !!inp.x && !p.prevX, newDown = inp.down && !p.prevDown, newShield = inp.shield && !p.prevShield;
    p.prevX = inp.x; p.prevDown = inp.down; p.prevShield = inp.shield;
    // Colgado del borde: arriba o saltar sube, abajo o hacia afuera suelta; a los 3 segundos se suelta solo.
    if (p.ledge) {
      p.ledgeT += dt; p.vx = p.vy = p.kx = p.ky = 0; p.state = 'ledge';
      const away = inp.x && Math.sign(inp.x) === p.ledge;
      if (inp.jump || inp.up || (inp.x && !away)) { const side = p.ledge, edge = side < 0 ? S.main[0] : S.main[1]; p.ledge = 0; p.x = edge - side * .6; p.y = 0; p.ground = true; p.inv = Math.max(p.inv, .35); this.events.push({ type: 'climb', id: p.id }); }
      else if (inp.down || away || p.ledgeT > 3) { p.ledge = 0; p.noLedge = .6; p.ground = false; p.vy = -2; this.events.push({ type: 'letgo', id: p.id }); }
      return;
    }
    // Golpeado: vuela con el empujón, que se va frenando; no puede actuar mientras dura el aturdimiento.
    if (p.stun > 0) { p.stun -= dt; p.state = 'hurt'; }
    // Esquiva en curso (rodar, en el sitio o en el aire): mientras dura no puede hacer nada más. Al rodar
    // termina mirando hacia atrás, como cuando uno pasa por detrás del rival.
    if (p.dodge > 0) {
      p.dodge -= dt;
      if (p.dodge <= 0) { if (p.dodgeDir) p.face = -p.dodgeDir; p.dodgeDir = 0; }
      else { p.state = p.dodgeDir ? 'roll' : 'dodge'; if (p.dodgeDir && p.ground) p.vx = p.dodge > .12 ? p.dodgeDir * 10 : p.vx * .5; }
    }
    let free = p.stun <= 0 && p.broken <= 0 && !p.move && p.dodge <= 0;
    // Escudo
    p.shielding = free && p.ground && inp.shield && p.shield > .15;
    // Con el escudo puesto: una dirección rueda hacia ese lado y abajo esquiva en el sitio (sin recibir golpes).
    if (p.shielding && (newX || newDown)) {
      p.shielding = false; p.dodgeDir = newX ? Math.sign(inp.x) : 0; p.dodge = p.dodgeDir ? .4 : .32; p.inv = Math.max(p.inv, p.dodgeDir ? .3 : .26);
      p.state = p.dodgeDir ? 'roll' : 'dodge'; free = false; if (p.dodgeDir) p.vx = p.dodgeDir * 10;
      this.events.push({ type: 'dodge', id: p.id, dir: p.dodgeDir });
    }
    // En el aire el escudo es una esquiva (una por salto) que deja moverse un poco hacia donde se apunte.
    else if (free && !p.ground && newShield && !p.airDodge) {
      p.airDodge = true; p.dodge = .34; p.dodgeDir = 0; p.inv = Math.max(p.inv, .28);
      p.vx = inp.x * 6; p.vy = inp.up ? 7 : inp.down ? -8 : Math.max(-1.5, p.vy * .25); p.state = 'dodge'; free = false;
      this.events.push({ type: 'dodge', id: p.id, air: true });
    }
    if (p.shielding) { p.shield = Math.max(0, p.shield - dt * .32); p.vx *= .7; p.state = 'shield'; }
    else p.shield = Math.min(1, p.shield + dt * .18);
    if (free && !p.shielding) {
      // Moverse
      const target = inp.x * p.speed, acc = p.ground ? 60 : 30;
      if (p.ground || inp.x) p.vx += clamp(target - p.vx, -acc * dt, acc * dt);
      if (inp.x) p.face = Math.sign(inp.x);
      // Saltar (uno en el piso y otro en el aire)
      if (inp.jump) {
        if (p.ground) { p.vy = p.jump; p.ground = false; p.hopT = .1; this.events.push({ type: 'jump', id: p.id }); }
        else if (p.jumps > 0) { p.jumps--; p.vy = p.jump * .9; p.flip = .38; this.events.push({ type: 'jump', id: p.id, air: true }); }
      }
      // Si se suelta el salto enseguida, queda corto (para pegar en el aire bajito).
      if (p.hopT > 0) { p.hopT -= dt; if (!inp.jumpHeld && p.vy > 0) { p.vy *= .58; p.hopT = 0; } }
      // Bajar de una plataforma o caer rápido
      if (inp.down && p.ground && p.y > .1) { p.drop = .25; p.ground = false; p.y -= .05; }
      if (inp.down && !p.ground && p.vy < 4) p.vy = Math.min(p.vy, -FAST_FALL * .8);
      // Ataques (los fuertes en el piso se pueden cargar sosteniendo A)
      if (inp.attack) {
        const m = !p.ground ? 'air' : inp.up ? 'up' : inp.down ? 'down' : inp.x ? 'side' : 'jab';
        if (m !== 'jab' && m !== 'air' && inp.attackHeld) { p.charging = m; p.charge = 0; p.move = 'hold'; this.events.push({ type: 'charge', id: p.id, move: m }); }
        else this.startMove(p, m);
      }
      else if (inp.special) {
        if (inp.up && p.upB) { this.startMove(p, 'recover'); p.upB = false; p.vy = 17; p.jumps = 0; this.events.push({ type: 'recover', id: p.id }); }
        else if (inp.down && p.pcd <= 0) { this.startMove(p, 'power', true); p.pcd = POWER_CD; if (!p.ground) p.vy = Math.max(p.vy, 3); this.events.push({ type: 'power', id: p.id, kind: p.types[0] }); }
        else if (inp.down) { /* poder recargándose: no hace nada */ }
        else if (p.cd <= 0) {
          if (p.special === 'shot') { this.shoot(p); p.cd = .55; this.startMove(p, 'jab', true); }
          else { this.startMove(p, 'dash'); p.vx = p.face * 10; p.cd = .8; }
        }
      }
      if (!p.move) p.state = p.ground ? (Math.abs(p.vx) > .5 ? 'run' : 'idle') : 'air';
    } else if (!p.ground && p.stun <= 0 && p.move) { /* en el aire durante un ataque: se mantiene la inercia */ }
    // Golpe fuerte cargado: mientras se sostiene A no avanza; al soltar (o a los 0,9 s) pega más duro.
    if (p.charging) {
      p.charge = Math.min(.9, p.charge + dt); p.vx *= .8; p.state = 'charge';
      if (!inp.attackHeld || p.charge >= .9 || p.stun > 0) { const m = p.charging; p.charging = null; p.move = null; p.mul = 1 + p.charge * .75; this.startMove(p, m); this.events.push({ type: 'release', id: p.id, move: m, level: p.charge / .9 }); }
    }
    // Movimiento en curso
    if (p.move && p.move !== 'hold') {
      p.t += dt; const M = MOVES[p.move];
      if (p.move === 'dash' && p.t < M.start + M.active) p.vx = p.face * 10; else if (p.ground) p.vx *= .82;
      if (p.move === 'power' && !p.ground) p.vy = Math.max(p.vy, -2);
      if (p.t >= M.start + M.active + M.rec) { p.move = null; p.hit.clear(); p.mul = 1; }
      p.state = 'attack';
    }
    // Física
    const support = p.dodge > 0 && p.dodgeDir && p.ground ? this.surface(p) : null;
    if (!p.ground) p.vy = Math.max(p.vy - G * dt, inp.down && p.stun <= 0 && p.dodge <= 0 ? -FAST_FALL : -MAX_FALL);
    else if (!inp.x && !p.move && !support) p.vx *= .78;
    // Empujón de un golpe (se suma y se va apagando)
    p.x += (p.vx + p.kx) * dt; p.y += (p.vy + p.ky) * dt;
    // Rodar no saca del piso: se frena en el borde.
    if (support) p.x = clamp(p.x, support[0] + .2, support[1] - .2);
    const decay = Math.pow(.022, dt);   // ~ .938 por cuadro a 60 por segundo
    p.kx *= decay; p.ky *= decay; if (Math.abs(p.kx) < .05) p.kx = 0; if (Math.abs(p.ky) < .05) p.ky = 0;
    // Piso y plataformas (sólo al caer)
    const under = (p.vy + p.ky) <= 0 ? this.platformUnder(p, prevY) : null;
    if (under !== null) {
      if (!p.ground) this.events.push({ type: 'land', id: p.id, hard: p.vy < -10 });
      p.y = under; p.vy = 0; p.ky = Math.max(0, p.ky); p.ground = true; p.jumps = 1; p.upB = true; p.airDodge = false;
      if (p.stun > 0 && p.ky === 0 && Math.abs(p.kx) > 6) p.kx *= .5;
    } else if (p.ground && !this.onSomething(p)) p.ground = false;
    // El piso grande es un bloque de roca: por los lados y por debajo no se atraviesa. Abajo se angosta como una
    // isla flotante, así que las paredes de abajo van en diagonal (empujan hacia afuera).
    const cut = taperCut(S, p.y), wl = S.main[0] - .45 + cut, wr = S.main[1] + .45 - cut;
    if (p.y < -.01 && p.y > -S.depth && p.x > wl && p.x < wr) {
      const dl = p.x - wl, dr = wr - p.x, db = p.y + S.depth;
      if (db < Math.min(dl, dr)) { p.y = -S.depth; p.vy = Math.min(0, p.vy); p.ky = Math.min(0, p.ky); }
      else if (dl < dr) { p.x = wl; p.vx = Math.min(0, p.vx); p.kx = Math.min(0, p.kx); }
      else { p.x = wr; p.vx = Math.max(0, p.vx); p.kx = Math.max(0, p.kx); }
    }
    // Agarrarse del borde del piso grande al caer cerca de la esquina (sólo de cara al escenario).
    if (!p.ground && !p.ledge && p.noLedge <= 0 && p.stun <= 0 && (p.vy + p.ky) <= 0 && p.y < -.15 && p.y > -1.6) {
      for (const side of [-1, 1]) {
        const edge = side < 0 ? S.main[0] : S.main[1], dx = (p.x - edge) * side;
        if (dx > -.1 && dx < .95 && !this.f.some(q => q !== p && q.ledge === side)) {
          p.ledge = side; p.ledgeT = 0; p.face = -side; p.x = edge + side * .42; p.y = -1.05; p.vx = p.vy = p.kx = p.ky = 0; p.jumps = 1; p.upB = true; p.move = null; p.charging = null; p.dodge = 0; p.dodgeDir = 0; p.airDodge = false; p.inv = Math.max(p.inv, .5);
          this.events.push({ type: 'ledge', id: p.id }); break;
        }
      }
    }
    // Fuera de la zona: pierde una vida
    const B = S.blast;
    if (p.x < -B.x || p.x > B.x || p.y < B.bottom || p.y > B.top) this.ko(p);
  }
  onSomething(p) {
    const S = this.stage;
    if (Math.abs(p.y) < .02 && p.x >= S.main[0] && p.x <= S.main[1]) return true;
    return S.plats.some(([a, b, h]) => Math.abs(p.y - h) < .02 && p.x >= a && p.x <= b);
  }
  // Piso donde está parado: [desde, hasta] del piso grande o de la plataforma.
  surface(p) {
    const S = this.stage;
    if (Math.abs(p.y) < .02 && p.x >= S.main[0] && p.x <= S.main[1]) return S.main;
    const pl = S.plats.find(([a, b, h]) => Math.abs(p.y - h) < .02 && p.x >= a && p.x <= b);
    return pl ? [pl[0], pl[1]] : null;
  }
  startMove(p, move, quiet = false) { if (p.move) return; p.move = move; p.t = 0; p.hit.clear(); if (move === 'air') p.flip = .3; if (!quiet) this.events.push({ type: 'swing', id: p.id, move, mul: p.mul }); }
  shoot(p) {
    this.shots.push({ id: this.nextId++, owner: p.id, x: p.x + p.face * .7, y: p.y + .65, vx: p.face * 12, life: 1.1, dmg: 6 * p.power, kb: 3, grow: .5, type: p.types[0] });
    this.events.push({ type: 'shoot', id: p.id });
  }
  // Golpes activos contra los demás (círculos).
  attacks() {
    for (const p of this.f) {
      if (!p.move || p.move === 'hold' || p.out || p.freeze > 0) continue;
      const M = MOVES[p.move]; if (p.t < M.start || p.t > M.start + M.active) continue;
      const hx = p.x + M.dx * p.face, hy = p.y + M.dy;
      for (const q of this.f) {
        if (q === p || q.team === p.team || q.out || q.stocks <= 0 || q.inv > 0 || p.hit.has(q.id)) continue;
        if (Math.hypot(q.x - hx, q.y + .6 - hy) > M.r + .55) continue;
        p.hit.add(q.id);
        const dir = p.move === 'power' ? Math.sign(q.x - p.x) || p.face : p.face;
        const strong = this.hitFighter(q, p, M.dmg * p.power * p.mul * typeBonus(p, q), M.kb * (1 + (p.mul - 1) * .6), M.grow * p.mul, M.ang, dir, p.move);
        p.freeze = Math.max(p.freeze, strong);
      }
    }
  }
  shotStep(dt) {
    for (const s of this.shots) {
      s.x += s.vx * dt; s.life -= dt;
      for (const q of this.f) {
        if (q.id === s.owner || q.team === this.f[s.owner].team || q.out || q.stocks <= 0 || q.inv > 0) continue;
        if (Math.hypot(q.x - s.x, q.y + .6 - s.y) > .75) continue;
        const owner = this.f[s.owner];
        this.hitFighter(q, owner, s.dmg * typeBonus(owner, q), s.kb, s.grow, 25, Math.sign(s.vx), 'shot'); s.life = 0; this.events.push({ type: 'pop', x: s.x, y: s.y, kind: s.type }); break;
      }
    }
    this.shots = this.shots.filter(s => s.life > 0);
  }
  // Daño y empujón: más daño acumulado y menos peso = sale más lejos.
  hitFighter(q, p, dmg, kb, grow, ang, dir, move = 'shot') {
    if (q.ledge) { q.ledge = 0; q.noLedge = .8; }
    if (q.shielding) {
      q.shield = Math.max(0, q.shield - dmg / 30); q.kx = dir * 2;
      this.events.push({ type: 'block', id: q.id, by: p.id, x: q.x, y: q.y + .6 });
      if (q.shield <= 0) { q.broken = 1.6; q.shielding = false; this.events.push({ type: 'break', id: q.id }); }
      return .04;
    }
    q.damage = Math.min(999, q.damage + dmg);
    const speed = (kb + grow * q.damage * .14) * (100 / (60 + q.weight)) * 2.1;
    const a = ang * Math.PI / 180;
    q.kx = Math.cos(a) * speed * dir; q.ky = Math.sin(a) * speed; q.vx = 0; q.vy = Math.max(0, q.vy);
    if (q.ky > 0) q.ground = false;
    q.stun = clamp(speed * .022, .12, 1.4); q.move = null; q.hit.clear();
    q.lastHit = p.id; q.charging = null;
    const freeze = clamp(.03 + dmg * .006 + speed * .002, .04, .2); q.freeze = freeze;
    this.events.push({ type: 'hit', id: q.id, by: p.id, x: q.x, y: q.y + .6, dmg, strong: speed > 14, speed, move, kind: p.types[0], freeze });
    return freeze;
  }
  ko(p) {
    p.out = true; p.stocks--; p.respawn = 1.6; p.falls++; p.ledge = 0; p.charging = null; p.move = null; p.freeze = 0; p.dodge = 0; p.dodgeDir = 0; p.airDodge = false;
    if (p.lastHit !== undefined && this.f[p.lastHit]) this.f[p.lastHit].kos++;
    this.events.push({ type: 'ko', id: p.id, x: clamp(p.x, -this.stage.blast.x, this.stage.blast.x), y: clamp(p.y, this.stage.blast.bottom, this.stage.blast.top), left: p.stocks });
  }
  respawn(p) {
    if (p.stocks <= 0) return;
    p.out = false; p.x = 0; p.y = 8.5; p.vx = p.vy = p.kx = p.ky = 0; p.damage = 0; p.inv = 2; p.stun = 0; p.move = null; p.jumps = 1; p.upB = true; p.ground = false; p.lastHit = undefined; p.shield = 1;
    this.events.push({ type: 'respawn', id: p.id });
  }
  checkEnd() {
    if (this.phase === 'done') return;
    const alive = this.alive();
    // Se acaba cuando sólo queda un equipo (en todos contra todos cada uno es su propio equipo).
    if (new Set(alive.map(p => p.team)).size <= 1) return this.finish(alive[0]?.id ?? -1);
    if (this.time >= this.limit) {
      const best = [...alive].sort((a, b) => b.stocks - a.stocks || a.damage - b.damage);
      this.finish(best.length > 1 && best[0].stocks === best[1].stocks && Math.abs(best[0].damage - best[1].damage) < 1 ? -1 : best[0].id);
    }
  }
  finish(w) { this.phase = 'done'; this.winner = w; this.events.push({ type: 'end', winner: w }); }
  // ---------- Máquina ----------
  think(p, dt) {
    const A = p.ai, S = this.stage, inp = blankInput();
    const foes = this.f.filter(q => q !== p && q.team !== p.team && q.stocks > 0 && !q.out);
    if (!foes.length) return inp;
    // Colgado del borde: sube después de un momento.
    if (p.ledge) { if (p.ledgeT > .2 + this.rnd() * .5) inp.up = true; return inp; }
    // Cargando un golpe fuerte: sostiene A un rato.
    if (p.charging) { inp.attackHeld = p.charge < (A.chargeFor || .4); return inp; }
    const t = foes.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    // Volver al escenario si quedó por fuera.
    const off = p.x < S.main[0] - .2 || p.x > S.main[1] + .2 || (p.y < -.3 && !p.ground);
    if (off && p.stun <= 0) {
      inp.x = p.x < 0 ? 1 : -1;
      if (p.vy < 0 && p.y < 1.5 && p.jumps > 0 && this.rnd() < .5 + this.skill * .5) { inp.jump = true; inp.jumpHeld = true; }
      else if (p.vy < 0 && p.y < -1 && p.jumps <= 0 && p.upB) { inp.special = true; inp.up = true; }
      return inp;
    }
    A.wait -= dt;
    if (A.wait > 0 && A.intent) return { ...A.intent, jump: false, attack: false, special: false };
    A.wait = (.32 - this.skill * .2) + this.rnd() * (.28 - this.skill * .14);
    const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
    inp.x = Math.abs(dx) > .9 ? Math.sign(dx) : 0;
    // No caerse por el borde persiguiendo a alguien que está afuera.
    if ((p.x < S.main[0] + 1 && inp.x < 0) || (p.x > S.main[1] - 1 && inp.x > 0)) { if (t.y > -1) inp.x = 0; }
    // Si el rival ataca cerca: escudo, rodar por detrás de él o esquivar en el sitio.
    if (t.move && d < 2.2 && p.ground && this.rnd() < this.skill * .55) {
      const r = this.rnd(); inp.shield = true; inp.x = 0;
      if (r < .22) inp.x = Math.sign(dx) || p.face; else if (r < .34) inp.down = true;
    }
    else if (d < 2 && p.pcd <= 0 && (foes.filter(q => Math.hypot(q.x - p.x, q.y - p.y) < 2.2).length > 1 || this.rnd() < .12 + this.skill * .25)) { inp.special = true; inp.down = true; inp.x = 0; }
    else if (d < 1.6) {
      inp.attack = true; const r = this.rnd();
      if (dy > .9) inp.up = true; else if (r < .45) inp.x = Math.sign(dx) || p.face; else if (r < .6) inp.down = true; else inp.x = 0;
      if (t.damage > 90 && this.rnd() < .5) { inp.x = Math.sign(dx) || p.face; inp.down = false; inp.up = dy > .9; }
      // Con el rival cansado (mucho daño), a veces carga el golpe fuerte.
      if (p.ground && (inp.x || inp.up) && t.damage > 60 && this.rnd() < .25 + this.skill * .35) { inp.attackHeld = true; A.chargeFor = .25 + this.rnd() * .55; }
    } else if (p.special === 'shot' && Math.abs(dy) < 1.2 && Math.abs(dx) > 3 && p.cd <= 0 && this.rnd() < .45) { inp.special = true; inp.x = 0; p.face = Math.sign(dx); }
    else if (p.special === 'dash' && Math.abs(dy) < 1 && Math.abs(dx) > 2.2 && Math.abs(dx) < 5 && p.cd <= 0 && this.rnd() < .25) { inp.special = true; p.face = Math.sign(dx); }
    if (dy > 1.4 && Math.abs(dx) < 3.5 && p.ground) { inp.jump = true; inp.jumpHeld = dy > 2.6; }
    if (dy < -1.2 && p.ground && p.y > .1 && Math.abs(dx) < 3) inp.down = true;
    A.intent = inp; return inp;
  }
}
export function blankInput() { return { x: 0, up: false, down: false, jump: false, attack: false, special: false, shield: false, attackHeld: false, jumpHeld: false }; }
function typeBonus(p, q) { return clamp(effectiveness(p.types[0], q.types), .75, 1.35); }
export function peleaState(st) {
  st.pelea = Object.assign({ wins: 0, losses: 0, kos: 0, best: 0, fighter: null, story: 0 }, st.pelea || {});
  return st.pelea;
}
// Premio: plata (la misma de Puchamon) según rivales, dificultad y vidas que te quedaron.
export function peleaReward(won, rivals, difficulty, stocksLeft, kos) {
  const d = [1, 1.6, 2.4][difficulty] || 1;
  if (!won) return { money: Math.round((20 + kos * 25) * d) };
  return { money: Math.round((140 + rivals * 70 + stocksLeft * 40 + kos * 25) * d) };
}
