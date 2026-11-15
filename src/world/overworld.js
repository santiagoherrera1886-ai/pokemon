// Escena de exploración: movimiento por casillas, giros, correr, colisiones, puertas, mundo exterior continuo,
// NPC, entrenadores con línea de visión, interacción, y dibujo con profundidad, sombras, nubes y partículas.
import { input } from '../core/input.js';
import { canvas, ellipse } from '../core/pixel.js';
import { TS, drawTile, drawTallGrassOverlay, VOID } from '../art/tiles.js';
import { tree } from '../art/objects.js';
import { sheet, LOOKS } from '../art/characters.js';
import { driveCar, planeShadow } from '../art/vehicles.js';
import { ui } from '../ui/ui.js';
import { TG, tgCell, tgId } from './tierra.js';
import { markSeen } from './flightmap.js';
import { Flight, renderFlight2D } from './flight.js';
import { Traffic, dir4 } from './traffic.js';
import { CANDIDATES } from './hogar.js';

const DIRS = { down: 0, up: 1, left: 2, right: 3 };
const DXY = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const WALK = 16, RUN = 8, NPC_WALK = 18, DRIVE = 4, TURBO = 2;

export const NAMES = {
  mom: 'Mamá', rival: 'Nico', prof: 'Prof. Ceiba', nurse: 'Enfermera Malva', clerk: 'Dependiente', vendor: 'Vendedora', rivalMom: 'Mamá de Nico', aide: 'Ayudante',
  hiedra: 'Hiedra', basalto: 'Basalto', coral: 'Coral', centella: 'Centella', velia: 'Velia', tinto: 'Don Tinto', nevada: 'Nevada', sabino: 'Maestro Sabino', grunt: 'Recluta Eclipse', bruma: 'Bruma', umbra: 'Umbra', aurora: 'Campeona Aurora', courier: 'Mensajera', guard: 'Guardia'
};

class Actor {
  constructor(o) {
    Object.assign(this, { dir: 0, step: 0, moving: null, frame: 0 }, o);
    this.px = this.x * TS; this.py = this.y * TS;
    this.wanderTimer = 60 + Math.floor(Math.random() * 120);
    this.home = [this.x, this.y];
  }
  startMove(dir, dur) {
    const [dx, dy] = DXY[dir];
    this.dir = dir;
    this.moving = { fx: this.x, fy: this.y, tx: this.x + dx, ty: this.y + dy, t: 0, dur };
    this.step ^= 1;
  }
  tick() {
    const m = this.moving; if (!m) return false;
    m.t++;
    const k = Math.min(1, m.t / m.dur);
    this.px = (m.fx + (m.tx - m.fx) * k) * TS; this.py = (m.fy + (m.ty - m.fy) * k) * TS;
    this.frame = (k > 0.2 && k < 0.8) ? 1 + this.step : 0;
    if (m.t >= m.dur) { this.x = m.tx; this.y = m.ty; this.px = this.x * TS; this.py = this.y * TS; this.moving = null; this.frame = 0; return true; }
    return false;
  }
}

// Nubes: sombras suaves que cruzan el mapa exterior.
let CLOUD = null;
function cloudSprite() {
  if (CLOUD) return CLOUD;
  const [c, g] = canvas(96, 48);
  g.fillStyle = 'rgba(20,30,50,0.06)';
  for (const [x, y, r] of [[30, 26, 18], [52, 20, 20], [70, 28, 16], [44, 32, 16]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  CLOUD = c; return c;
}

export class Overworld {
  constructor(game) {
    this.game = game;
    this.world = game.world;
    this.frame = 0;
    this.turnTimer = 0;
    this.scripts = 0;
    this.particles = [];
    this.emotes = [];
    this.player = new Actor({ id: 'player', look: 'player', x: 0, y: 0 });
    [this.grassTile] = canvas(16, 16);
    this.vehicle = null;          // 'car' mientras maneja
    this.flight = null;           // vuelo en curso (ver flight.js)
    this.traffic = new Traffic();
    this.follower = null;         // la pareja, cuando te acompaña (camina detrás de ti)
  }
  get st() { return this.game.state; }
  get locked() { return this.scripts > 0 || ui.busy || this.game.fading; }
  // Posición del jugador en casillas de Tierra Grande (o null si no está en Tierra Grande).
  tgPos() {
    const m = this.map;
    if (!m || !m.outdoor || m.region !== 'tierra') return null;
    return [m.origin[0] + this.player.px / TS - TG.X, m.origin[1] + this.player.py / TS - TG.Y];
  }

  // ---------- Carga de mapas ----------
  load(mapId, x, y, dir = 0, banner = true) {
    const prev = this.map;
    this.map = this.world.get(mapId);
    // En Tierra Grande los mapas son pedazos de 48 × 48: el cartel sólo sale cuando cambia el nombre de la zona.
    if (prev && prev.outdoor && this.map.outdoor && prev.name === this.map.name) banner = false;
    if (this.map.tg || prev?.tg) this.world.trim(this.map.outdoor ? this.map.origin[0] + x : 0, this.map.outdoor ? this.map.origin[1] + y : 0, this.map.tg ? 3 : -1);
    Object.assign(this.player, { x, y, px: x * TS, py: y * TS, dir, moving: null, frame: 0 });
    this.particles = []; this.emotes = [];
    this.refreshNpcs();
    Object.assign(this.st, { map: mapId, x, y, dir });
    this.st.visited = this.st.visited || {};
    // Los pedazos de Tierra Grande van en un mapa de bits aparte (son miles): así la partida no se infla.
    if (this.map.tg) markSeen(this.st, this.map.origin[0] - TG.X + x, this.map.origin[1] - TG.Y + y, 1);
    else this.st.visited[mapId] = true;
    this.flight = null;
    if (this.vehicle && (!this.map.outdoor || this.map.region !== 'tierra')) this.vehicle = null;
    if (!prev || prev.region !== this.map.region || !this.map.outdoor) this.traffic.clear();
    if (banner) ui.banner(this.map.name, this.map.dark ? 'cave' : !this.map.outdoor ? 'inside' : this.map.encounters ? 'route' : 'town');
    this.game.refreshHome?.();
    if (!this.vehicle) this.game.requestAutosave?.();
    this.vehicleUI();
    this.setFollower();
  }
  // ---------- Pareja ----------
  // Si tu pareja te acompaña, aparece una casilla detrás de ti (o encima, si atrás hay pared) y te sigue paso a paso.
  setFollower() {
    const st = this.st, P = st?.pareja?.follow && CANDIDATES[st.pareja.id];
    if (!P || !this.map) { this.follower = null; return; }
    const p = this.player, [dx, dy] = DXY[p.dir], bx = p.x - dx, by = p.y - dy;
    const ok = this.map.inside(bx, by) && !this.blocked(bx, by, p);
    this.follower = new Actor({ id: 'pareja_' + st.pareja.id, look: P.look, x: ok ? bx : p.x, y: ok ? by : p.y, dir: p.dir, map: this.map.id, name: P.name });
  }
  updateFollower() {
    const f = this.follower, p = this.player;
    if (!f || this.vehicle) return;
    if (f.moving) f.tick();
    if (f.moving || !p.moving) return;
    const tx = p.moving.fx, ty = p.moving.fy, dx = tx - f.x, dy = ty - f.y;
    if (!dx && !dy) return;
    if (Math.abs(dx) + Math.abs(dy) === 1) f.startMove(dx > 0 ? 3 : dx < 0 ? 2 : dy > 0 ? 0 : 1, p.moving.dur);
    else Object.assign(f, { x: tx, y: ty, px: tx * TS, py: ty * TS, moving: null });
  }
  refreshNpcs() {
    const keep = new Map((this.npcs || []).map(n => [n.id, n]));
    this.npcs = this.map.npcs.filter(n => !n.when || n.when(this.st)).map(n => {
      const old = keep.get(n.id);
      return old && old.map === this.map.id ? old : new Actor({ ...n, map: this.map.id });
    });
  }
  npc(id) { return this.npcs.find(n => n.id === id); }

  resolve(x, y) {
    if (this.map.inside(x, y) || !this.map.outdoor) return [this.map, x, y];
    const gx = x + this.map.origin[0], gy = y + this.map.origin[1];
    const m = this.world.outdoorAt(gx, gy);
    return m ? [m, gx - m.origin[0], gy - m.origin[1]] : [null, x, y];
  }
  blocked(x, y, ignore) {
    const [m, lx, ly] = this.resolve(x, y);
    if (!m || m.blocked(lx, ly, this.st)) return true;
    const occupied = a => a !== ignore && a.map === m.id && ((a.x === lx && a.y === ly) || (a.moving && a.moving.tx === lx && a.moving.ty === ly));
    if (m === this.map && this.npcs.some(occupied)) return true;
    if (ignore !== this.player && m === this.map && (this.player.x === x && this.player.y === y || (this.player.moving && this.player.moving.tx === x && this.player.moving.ty === y))) return true;
    return false;
  }
  facing(actor = this.player) { const [dx, dy] = DXY[actor.dir]; return [actor.x + dx, actor.y + dy]; }

  // ---------- Actualización ----------
  update() {
    this.frame++;
    const p = this.player;
    if (this.flight) { this.updateParticles(); this.updateFlight(); return; }
    if (p.moving && p.tick()) {
      if (this.scripts === 0) this.arrive();
      else Object.assign(this.st, { x: p.x, y: p.y });
    }
    for (const n of this.npcs) {
      if (n.moving) n.tick();
      else if (n.wander && !this.locked) this.wander(n);
    }
    this.updateFollower();
    this.updateParticles();
    const tp = this.tgPos();
    if (tp) this.traffic.update(tp[0], tp[1]);
    if (p.moving || this.locked) return;

    if (input.hit('start')) { this.game.openMenu(); return; }
    if (input.hit('c')) { this.toggleCar(); return; }
    if (this.vehicle === 'car') { if (input.hit('a')) this.toggleCar(); else this.drive(); return; }
    if (input.hit('a')) { this.interact(); return; }
    const d = input.dir();
    if (!d) { this.turnTimer = 0; this.wasWalking = false; return; }
    const dir = DIRS[d];
    // Toque corto = solo girar; mantener = caminar.
    if (dir !== p.dir && !this.wasWalking) { p.dir = dir; this.turnTimer = 5; return; }
    if (this.turnTimer > 0) { this.turnTimer--; return; }
    const [dx, dy] = DXY[dir];
    const tx = p.x + dx, ty = p.y + dy;
    p.dir = dir;
    if (this.blocked(tx, ty, p)) {
      this.wasWalking = false;
      p.frame = (this.frame >> 3) % 2 ? 1 + p.step : 0;
      return;
    }
    const run = input.held('b') && this.st.shoes;
    p.startMove(dir, run ? RUN : WALK);
    if (run && this.frame % 2 === 0) this.dust(p);
    this.wasWalking = true;
  }

  wander(n) {
    if (--n.wanderTimer > 0) return;
    n.wanderTimer = 80 + Math.floor(Math.random() * 160);
    const dir = Math.floor(Math.random() * 4);
    const [dx, dy] = DXY[dir];
    const tx = n.x + dx, ty = n.y + dy;
    n.dir = dir;
    if (Math.abs(tx - n.home[0]) > n.wander || Math.abs(ty - n.home[1]) > n.wander) return;
    if (!this.blocked(tx, ty, n) && this.map.inside(tx, ty) && !this.map.warpAt(tx, ty)) n.startMove(dir, NPC_WALK);
  }

  // ---------- Carro ----------
  // C (o el botón CARRO): subirse o bajarse. Sólo afuera en Tierra Grande y con las llaves de Doña Rueda.
  toggleCar() {
    if (this.vehicle === 'car') {
      this.vehicle = null; this.wasWalking = false;
      this.vehicleUI(); this.game.requestAutosave?.(); this.setFollower();
      return true;
    }
    if (!this.st.bag?.llavesCarro) return false;
    if (!this.map.outdoor || this.map.region !== 'tierra') { this.game.toast?.('Tu carro te espera en Tierra Grande'); return false; }
    if (this.player.moving) return false;
    this.vehicle = 'car'; this.turnTimer = 0;
    this.vehicleUI();
    return true;
  }
  drive() {
    const p = this.player, d = input.dir();
    if (!d) { this.wasWalking = false; return; }
    const dir = DIRS[d], [dx, dy] = DXY[dir], tx = p.x + dx, ty = p.y + dy;
    p.dir = dir;
    const [m] = this.resolve(tx, ty);
    if (m && m.region !== 'tierra') {
      if (this.frame - (this.carWarn ?? -999) > 150) { this.game.toast?.('El carro no sale de Tierra Grande: bájate con A para seguir a pie'); this.carWarn = this.frame; }
      return;
    }
    if (this.blocked(tx, ty, p)) return;
    p.startMove(dir, input.held('b') ? TURBO : DRIVE);
    this.wasWalking = true;
  }

  // ---------- Avioneta ----------
  async takeoff(ap) {
    this.scripts++;
    try {
      await this.game.fadeOut();
      this.vehicle = null; this.player.moving = null; this.traffic.clear();
      this.flight = new Flight(ap, this.st.planeColor || '#f6f2ea');
      this.vehicleUI();
      await this.game.fadeIn();
    } finally { this.scripts--; }
    ui.banner('¡A volar!', 'route');
    this.game.toast?.('Cruceta: hacia dónde ir · B: turbo · A encima de una pista: aterrizar');
  }
  updateFlight() {
    const f = this.flight;
    if (this.locked) return;
    if (input.hit('start')) { this.game.openMenu(); return; }
    if (input.hit('a')) {
      const ap = f.tryLand();
      if (ap) ui.banner('Aterrizando en ' + ap.name, 'town');
      else if (f.flying) this.game.toast?.('Para aterrizar, vuela encima de una pista y oprime A (la flecha te dice dónde queda la más cercana)');
    }
    const res = f.update({ up: input.held('up'), down: input.held('down'), left: input.held('left'), right: input.held('right') }, input.held('b'));
    f.mark(this.st);
    if (f.edgeWarned === 1) { f.edgeWarned = 2; this.game.toast?.('Ahí se acaba Tierra Grande: la avioneta da la vuelta sola'); }
    if (res === 'landed') this.land(f.landAt);
    else if (this.frame % 6 === 0) this.flightHud();
  }
  async land(ap) {
    this.scripts++;
    try {
      await this.game.fadeOut();
      const [ax, ay] = ap.arrive, [i, j] = tgCell(TG.X + ax, TG.Y + ay);
      this.flight = null;
      this.load(tgId(i, j), ax - i * TG.S, ay - j * TG.S, 0, true);
      await this.game.fadeIn();
    } finally { this.scripts--; }
    this.game.toast?.('¡Aterrizaste en ' + ap.name + '!');
  }
  // Indicador de vuelo (HTML, sirve igual en pixel y en 3D): pista más cercana con flecha y distancia.
  flightHud() {
    let el = document.getElementById('flightHud');
    if (!this.flight) { if (el) el.classList.add('hidden'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'flightHud'; document.getElementById('ui').appendChild(el); }
    const [ap, d, ang] = this.flight.nearest(), km = (d * 1.5 / 1000).toFixed(1).replace('.', ',');
    const deg = Math.round((ang * 180 / Math.PI + 360) % 360), turbo = this.flight.speed > .7;
    el.innerHTML = `<i class="fh-arrow" style="transform:rotate(${deg}deg)">➤</i><span><b>${ap.name}</b><small>${d < 30 ? 'Debajo de ti: ¡oprime A!' : km + ' km'} · ${turbo ? 'TURBO' : 'B: turbo'}</small></span>`;
    el.classList.remove('hidden');
  }
  // Botón flotante del carro (para pantallas táctiles y ratón) y el indicador de vuelo.
  vehicleUI() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('vehBtn');
    if (btn) {
      const show = !this.flight && this.game.scene === 'overworld' && !!this.st.bag?.llavesCarro && this.map?.outdoor && this.map.region === 'tierra';
      btn.classList.toggle('hidden', !show);
      btn.innerHTML = this.vehicle === 'car' ? '🚶 <span>BAJAR</span>' : '🚗 <span>CARRO</span>';
    }
    this.flightHud();
  }

  arrive() {
    const p = this.player;
    if (!this.map.inside(p.x, p.y)) {
      const [m, lx, ly] = this.resolve(p.x, p.y);
      this.load(m.id, lx, ly, p.dir, true);
      this.wasWalking = true;
    }
    Object.assign(this.st, { x: p.x, y: p.y, dir: p.dir });
    if (this.map.at(p.x, p.y) === 'g') this.rustle(p);
    this.afterStep(true);
  }

  async afterStep(stepped) {
    const p = this.player, m = this.map;
    if (this.vehicle) return;   // en carro no se entra a las casas ni salen criaturas ni entrenadores
    const w = m.warpAt(p.x, p.y);
    if (w && (w.needDir === undefined || w.needDir === p.dir) && (!w.when || w.when(this.st))) { await this.warp(w.to, w.tx, w.ty, w.face); return; }
    if (await this.checkTriggers()) return;
    if (await this.checkTrainers()) return;
    if (stepped && this.st.repel > 0) await this.game.repelStep();
    const t = m.at(p.x, p.y);
    if (stepped && m.encounters && (t === 'g' || (m.allEncounter && (t === 'c')))) await this.game.maybeEncounter(m.encounters, m.battleBg);
  }

  async checkTriggers() {
    const p = this.player;
    const t = this.map.triggers.find(t => p.x >= t.x && p.y >= t.y && p.x < t.x + t.w && p.y < t.y + t.h && (!t.when || t.when(this.st)));
    if (!t) return false;
    await this.run(t.script, t.arg);
    return true;
  }

  // Entrenadores: si el jugador entra en su línea de visión, lo ven, se acercan y lo retan.
  async checkTrainers() {
    const p = this.player;
    for (const n of this.npcs) {
      if (!n.trainer || this.st.flags['t_' + n.id] || n.moving) continue;
      const [dx, dy] = DXY[n.dir];
      for (let i = 1; i <= (n.sight || 4); i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (x === p.x && y === p.y) { await this.trainerSpot(n, i - 1); return true; }
        if (this.map.blocked(x, y, this.st) || this.npcs.some(o => o !== n && o.x === x && o.y === y)) break;
      }
    }
    return false;
  }
  async trainerSpot(n, steps) {
    this.scripts++;
    try {
      this.emote(n, '!');
      await this.game.frames(40);
      for (let i = 0; i < steps; i++) await this.walk(n, [n.dir]);
      this.player.dir = [1, 0, 3, 2][n.dir];
      await this.trainerBattle(n);
    } finally { this.scripts--; }
  }
  async trainerBattle(n) {
    const t = n.trainer;
    await ui.say(t.intro, { name: t.name });
    const res = await this.game.trainerBattle(t, this.map.battleBg);
    if (res === 'win') {
      this.st.flags['t_' + n.id] = true;
      if (t.defeat) await ui.say(t.defeat, { name: t.name });
      if (n.badge) await this.game.scripts.run('medalla', this, n);
    }
  }

  async warp(to, x, y, face = 0) {
    this.scripts++;
    this.wasWalking = false;
    await this.game.fadeOut();
    this.load(to, x, y, face);
    await this.game.fadeIn();
    this.scripts--;
    await this.afterStep(false);
  }

  async run(name, arg) {
    this.scripts++;
    try { await this.game.scripts.run(name, this, arg); }
    finally { this.scripts--; input.clear(); this.refreshNpcs(); this.game.refreshHome?.(); }
  }

  async interact() {
    const p = this.player;
    let [fx, fy] = this.facing();
    const f = this.follower;
    if (f && !this.vehicle && f.x === fx && f.y === fy && !f.moving) { f.dir = [1, 0, 3, 2][p.dir]; await this.run('pareja'); return; }
    let target = this.npcs.find(n => n.x === fx && n.y === fy);
    const [m, lx, ly] = this.resolve(fx, fy);
    const obj = m && m.objectAt(lx, ly, this.st);
    if (!target && obj && obj.counter) {
      const [dx, dy] = DXY[p.dir];
      target = this.npcs.find(n => n.x === fx + dx && n.y === fy + dy);
    }
    if (target) {
      if (!target.counter) target.dir = [1, 0, 3, 2][p.dir];
      if (target.trainer && !this.st.flags['t_' + target.id]) { this.scripts++; try { await this.trainerBattle(target); } finally { this.scripts--; } return; }
      if (target.trainer && target.trainer.after) { this.scripts++; await ui.say(target.trainer.after, { name: target.trainer.name }); this.scripts--; return; }
      if (typeof target.talk === 'string') await this.run(target.talk, target);
      else if (target.talk) { this.scripts++; await ui.say(target.talk, { name: target.name || NAMES[target.look] }); this.scripts--; }
      return;
    }
    if (obj && obj.script) { await this.run(obj.script, obj); return; }
    if (obj && obj.text) { this.scripts++; await ui.say(obj.text); this.scripts--; }
  }

  // ---------- Utilidades para guiones ----------
  async walk(actor, dirs, dur = WALK) {
    for (const d of dirs) {
      const dir = typeof d === 'number' ? d : DIRS[d];
      actor.startMove(dir, dur);
      while (actor.moving) await this.game.nextFrame();
    }
  }
  async stepBack() {
    const p = this.player;
    const back = [1, 0, 3, 2][p.dir];
    const [dx, dy] = DXY[back];
    if (!this.blocked(p.x + dx, p.y + dy, p)) { const keep = p.dir; await this.walk(p, [back]); p.dir = keep; }
  }
  // Lleva a un NPC hasta quedar al lado del jugador (primero en x, luego en y) y lo pone de frente.
  async approach(n, dur = 10) {
    const p = this.player;
    for (let i = 0; i < 30; i++) {
      const dx = p.x - n.x, dy = p.y - n.y;
      if (Math.abs(dx) + Math.abs(dy) <= 1) break;
      const opts = [];
      if (dx) opts.push(dx > 0 ? 3 : 2);
      if (dy) opts.push(dy > 0 ? 0 : 1);
      const dir = opts.find(d => { const [ax, ay] = DXY[d]; return !this.blocked(n.x + ax, n.y + ay, n); });
      if (dir === undefined) break;
      await this.walk(n, [dir], dur);
    }
    const dx = p.x - n.x, dy = p.y - n.y;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 0 : 1);
    p.dir = [1, 0, 3, 2][n.dir];
  }
  emote(actor, text) { this.emotes.push({ actor, text, t: 50 }); }

  // ---------- Partículas ----------
  rustle(a) { for (let i = 0; i < 5; i++) this.particles.push({ x: a.px + 4 + Math.random() * 8, y: a.py + 10, vx: (Math.random() - 0.5) * 0.8, vy: -0.6 - Math.random() * 0.6, life: 18, color: i % 2 ? '#4f9e3c' : '#7cc85a', s: 2 }); }
  dust(a) { for (let i = 0; i < 2; i++) this.particles.push({ x: a.px + 6 + Math.random() * 4, y: a.py + 14, vx: (Math.random() - 0.5) * 0.4, vy: -0.2, life: 14, color: 'rgba(230,220,190,0.8)', s: 2 }); }
  updateParticles() {
    if (this.map && this.map.outdoor && Math.random() < 0.04) {
      const p = this.player;
      this.particles.push({ x: p.px + (Math.random() - 0.5) * 260, y: p.py - 120, vx: 0.25 + Math.random() * 0.3, vy: 0.35 + Math.random() * 0.2, life: 400, color: ['#f8c8d8', '#f8e070', '#a8e080'][Math.floor(Math.random() * 3)], s: 1, leaf: true, ph: Math.random() * 6 });
    }
    for (const q of this.particles) { q.x += q.vx + (q.leaf ? Math.sin((this.frame + q.ph * 30) / 20) * 0.3 : 0); q.y += q.vy; if (!q.leaf) q.vy += 0.06; q.life--; }
    this.particles = this.particles.filter(q => q.life > 0);
    for (const e of this.emotes) e.t--;
    this.emotes = this.emotes.filter(e => e.t > 0);
  }

  // ---------- Dibujo ----------
  render(r) {
    if (this.flight) return renderFlight2D(r, this.flight, this.frame, this.game.hour());
    const p = this.player, m = this.map, BW = r.bw, BH = r.bh;
    let camX = Math.round(p.px) + 8, camY = Math.round(p.py) + 8;
    if (!m.outdoor) {
      const W = m.w * TS, H = m.h * TS, vw = r.w - 32, vh = r.h - 40;
      camX = W <= vw ? W / 2 : Math.max(vw / 2, Math.min(W - vw / 2, camX));
      camY = H <= vh ? H / 2 + 6 : Math.max(vh / 2, Math.min(H - vh / 2 + 24, camY));
    }
    const ox = r.anchorX() - camX, oy = r.anchorY() - camY;
    const g = r.bg;
    r.clear(m.outdoor ? '#3f8f3a' : (m.voidColor || VOID));
    const wf = Math.floor(this.frame / 24);
    const sprites = [];
    const view = { x0: Math.floor(-ox / TS) - 2, y0: Math.floor(-oy / TS) - 2, x1: Math.ceil((BW - ox) / TS) + 2, y1: Math.ceil((BH - oy) / TS) + 3 };

    const lights = [];
    if (m.outdoor && (m.tg || m.region === 'tierra')) this.world.around(m.origin[0] + p.x, m.origin[1] + p.y, 26);
    const maps = m.outdoor ? this.world.outdoor : [m];
    for (const mm of maps) {
      const dx = m.outdoor ? (mm.origin[0] - m.origin[0]) * TS : 0, dy = m.outdoor ? (mm.origin[1] - m.origin[1]) * TS : 0;
      const X = ox + dx, Y = oy + dy;
      if (X > BW || Y > BH || X + mm.w * TS < 0 || Y + mm.h * TS < -64) continue;
      g.drawImage(mm.ground(wf), X, Y);
      for (const s of mm.sprites(this.st)) {
        if (s.img) { const sx = s.x + X, sy = s.y + Y; if (sx > BW || sy > BH || sx + s.img.width < 0 || sy + s.img.height < 0) continue; }
        if (s.shadow) sprites.push({ shadow: [s.shadow[0] + dx, s.shadow[1] + dy, s.shadow[2], s.shadow[3]], base: -2000 });
        else if (s.shadowRect) sprites.push({ shadowRect: [s.shadowRect[0] + dx, s.shadowRect[1] + dy, s.shadowRect[2], s.shadowRect[3]], base: -2000 });
        else if (s.light) lights.push([s.light[0] + dx, s.light[1] + dy, s.light[2]]);
        else sprites.push({ img: s.img, x: s.x + dx, y: s.y + dy, base: s.base === -1000 ? -1000 : s.base + dy });
      }
    }
    if (m.outdoor) {
      if (!this.grassReady) { drawTile(this.grassTile.getContext('2d'), '.', 0, 0, { at: () => '.' }, 0, 0, 0); this.grassReady = true; }
      for (let ty = view.y0; ty < view.y1; ty++) for (let tx = view.x0; tx < view.x1; tx++) {
        const gx = tx + m.origin[0], gy = ty + m.origin[1];
        if (this.world.outdoorAt(gx, gy)) continue;
        g.drawImage(this.grassTile, ox + tx * TS, oy + ty * TS);
        sprites.push({ img: tree((((gx * 3 + gy * 7) % 3) + 3) % 3), x: tx * TS - 3, y: ty * TS - 16, base: ty * TS + 16 });
      }
    }
    for (const a of [...this.npcs, p, ...(this.follower && !this.vehicle ? [this.follower] : [])]) sprites.push({ actor: a, base: a.py + 16 + (a === p ? 0.5 : 0) });
    // Tráfico de Tierra Grande (de adorno) y sombras de avionetas que pasan.
    if (m.region === 'tierra' && m.outdoor) {
      const tx = (TG.X - m.origin[0]) * TS, ty = (TG.Y - m.origin[1]) * TS;
      for (const c of this.traffic.cars) {
        const img = driveCar(c.color, dir4(c.h)), X = tx + c.x * TS, Y = ty + c.y * TS;
        if (X + ox < -40 || Y + oy < -40 || X + ox > BW + 40 || Y + oy > BH + 40) continue;
        sprites.push({ shadowRect: [X - img.width / 2 + 2, Y - img.height / 2 + 4, img.width - 4, img.height - 4], base: -2000 });
        sprites.push({ img, x: X - img.width / 2, y: Y - img.height / 2 - 2, base: Y + 8 });
      }
      for (const s of this.traffic.shadows) sprites.push({ plane: s, x: tx + s.x * TS, y: ty + s.y * TS, base: 1e9 });
    }
    sprites.sort((a, b) => a.base - b.base);
    g.fillStyle = 'rgba(16,24,40,0.22)';
    for (const s of sprites) {
      if (s.shadow) { const [cx, cy, rx, ry] = s.shadow; g.beginPath(); g.ellipse(Math.round(cx + ox), Math.round(cy + oy), rx, ry, 0, 0, Math.PI * 2); g.fill(); }
      else if (s.shadowRect) { const [x, y, w, h] = s.shadowRect; g.fillRect(Math.round(x + ox), Math.round(y + oy), w, h); }
    }
    for (const s of sprites) {
      if (s.shadow || s.shadowRect) continue;
      if (s.actor) this.drawActor(g, s.actor, ox, oy);
      else if (s.plane) { const sh = planeShadow(); g.save(); g.translate(Math.round(s.x + ox), Math.round(s.y + oy)); g.rotate(s.plane.h + Math.PI / 2); g.scale(1.6, 1.6); g.drawImage(sh, -sh.width / 2, -sh.height / 2); g.restore(); }
      else g.drawImage(s.img, Math.round(s.x + ox), Math.round(s.y + oy));
    }
    const hr = this.game.hour();
    if (m.outdoor && (hr >= 18 || hr < 6) && lights.length) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [lx, ly, rr] of lights) {
        const X = lx + ox, Y = ly + oy; if (X < -rr || Y < -rr || X > BW + rr || Y > BH + rr) continue;
        const gr = g.createRadialGradient(X, Y, 2, X, Y, rr);
        gr.addColorStop(0, 'rgba(255,210,120,0.55)'); gr.addColorStop(1, 'rgba(255,180,80,0)');
        g.fillStyle = gr; g.fillRect(X - rr, Y - rr, rr * 2, rr * 2);
      }
      g.restore();
    }
    for (const q of this.particles) { g.fillStyle = q.color; g.fillRect(Math.round(q.x + ox), Math.round(q.y + oy), q.s, q.s); }
    if (m.outdoor) {
      const cl = cloudSprite(), t = this.frame * 0.15;
      const sx = ox + m.origin[0] * TS, sy = oy + m.origin[1] * TS;
      const mod = (a, n) => ((a % n) + n) % n;
      for (let i = 0; i < 4; i++) {
        g.drawImage(cl, Math.round(mod(i * 310 + t + sx, BW + 220) - 110), Math.round(mod(i * 173 + sy, BH + 90) - 45));
      }
    }
    for (const e of this.emotes) {
      const X = Math.round(e.actor.px + ox) + 4, Y = Math.round(e.actor.py + oy) - 22 - (e.t > 40 ? (50 - e.t) : 10) * 0.4;
      if (e.text === '♥') {   // corazón de pixel que sube
        const H = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
        H.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') { g.fillStyle = j < 1 && (i === 1 || i === 4) ? '#ff9ab0' : '#e84860'; g.fillRect(X - 1 + i, Y + j - (50 - e.t) * .3, 1, 1); } }));
        continue;
      }
      g.fillStyle = '#26222e'; g.fillRect(X - 1, Y - 1, 10, 12);
      g.fillStyle = '#ffffff'; g.fillRect(X, Y, 8, 10);
      g.fillStyle = '#e04848'; g.fillRect(X + 3, Y + 1, 2, 5); g.fillRect(X + 3, Y + 7, 2, 2);
    }
    r.present();
    r.post({ outdoor: m.outdoor, hour: this.game.hour(), dark: m.dark });
  }

  drawActor(g, a, ox, oy) {
    const X = Math.round(a.px + ox), Y = Math.round(a.py + oy);
    if (a === this.player && this.vehicle === 'car') {
      const look = LOOKS.player || {}, img = driveCar(this.st.carColor || '#e2603f', a.dir, { hat: look.hat, hair: look.hair });
      g.fillStyle = 'rgba(16,20,32,.28)'; g.fillRect(X + 8 - img.width / 2 + 2, Y + 8 - img.height / 2 + 4, img.width - 4, img.height - 4);
      g.drawImage(img, X + 8 - img.width / 2, Y + 6 - img.height / 2);
      return;
    }
    g.fillStyle = 'rgba(16,20,32,.28)';
    g.beginPath(); g.ellipse(X + 8, Y + 14, 5.5, 2.5, 0, 0, Math.PI * 2); g.fill();
    const f = sheet(a.look)[a.dir][a.frame];
    g.drawImage(f, X, Y - 9);
    const [mm, lx, ly] = this.resolve(Math.round(a.px / TS), Math.round(a.py / TS));
    if (mm && mm.at(lx, ly) === 'g' && (!a.moving || a.moving.t / a.moving.dur > 0.5)) drawTallGrassOverlay(g, X, Y);
  }
}
