// Escena de exploración: movimiento por casillas, giros, correr, colisiones, puertas,
// transición continua entre mapas exteriores, NPC, interacción y dibujo con orden de profundidad.
import { input } from '../core/input.js';
import { canvas } from '../core/pixel.js';
import { TS, drawTile, drawTallGrassOverlay, VOID } from '../art/tiles.js';
import { tree } from '../art/objects.js';
import { sheet } from '../art/characters.js';
import { ui } from '../ui/ui.js';

const DIRS = { down: 0, up: 1, left: 2, right: 3 };
const DXY = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const WALK = 16, RUN = 8, NPC_WALK = 18;

export const NAMES = { mom: 'Mamá', rival: 'Nico', prof: 'Prof. Ceiba', nurse: 'Enfermera Malva', clerk: 'Dependiente', rivalMom: 'Mamá de Nico', aide: 'Ayudante' };

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

export class Overworld {
  constructor(game) {
    this.game = game;
    this.world = game.world;
    this.frame = 0;
    this.turnTimer = 0;
    this.scripts = 0;
    this.player = new Actor({ id: 'player', look: 'player', x: 0, y: 0 });
    [this.grassTile] = canvas(16, 16);
    this.voidTiles = new Map();
  }
  get st() { return this.game.state; }
  get locked() { return this.scripts > 0 || ui.busy || this.game.fading; }

  // ---------- Carga de mapas ----------
  load(mapId, x, y, dir = 0, banner = true) {
    const prevOutdoor = this.map && this.map.outdoor;
    this.map = this.world.get(mapId);
    Object.assign(this.player, { x, y, px: x * TS, py: y * TS, dir, moving: null, frame: 0 });
    this.refreshNpcs();
    Object.assign(this.st, { map: mapId, x, y, dir });
    if (banner && (this.map.outdoor || !prevOutdoor || true)) ui.banner(this.map.name);
    this.game.refreshHome?.();
  }
  refreshNpcs() {
    const keep = new Map((this.npcs || []).map(n => [n.id, n]));
    this.npcs = this.map.npcs.filter(n => !n.when || n.when(this.st)).map(n => {
      const old = keep.get(n.id);
      return old && old.map === this.map.id ? old : new Actor({ ...n, map: this.map.id });
    });
  }
  npc(id) { return this.npcs.find(n => n.id === id); }

  // Convierte coordenadas locales del mapa actual en (mapa, x, y) reales, cruzando a mapas vecinos.
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
    if (p.moving && p.tick()) {
      if (this.scripts === 0) this.arrive();
      else Object.assign(this.st, { x: p.x, y: p.y });
    }
    for (const n of this.npcs) {
      if (n.moving) n.tick();
      else if (n.wander && !this.locked) this.wander(n);
    }
    if (p.moving || this.locked) return;

    if (input.hit('start')) { this.game.openMenu(); return; }
    if (input.hit('a')) { this.interact(); return; }
    const d = input.dir();
    if (!d) { this.turnTimer = 0; return; }
    const dir = DIRS[d];
    // Toque corto = solo girar (como en las portátiles); mantener = caminar.
    if (dir !== p.dir && !this.wasWalking) { p.dir = dir; this.turnTimer = 5; return; }
    if (this.turnTimer > 0) { this.turnTimer--; return; }
    const [dx, dy] = DXY[dir];
    const tx = p.x + dx, ty = p.y + dy;
    p.dir = dir;
    if (this.blocked(tx, ty, p)) {
      this.wasWalking = false;
      // pequeño "tropiezo" visual
      p.frame = (this.frame >> 3) % 2 ? 1 + p.step : 0;
      return;
    }
    const run = input.held('b') && this.st.shoes;
    p.startMove(dir, run ? RUN : WALK);
    p.running = run;
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

  arrive() {
    const p = this.player;
    // ¿Cruzamos a otro mapa exterior?
    if (!this.map.inside(p.x, p.y)) {
      const [m, lx, ly] = this.resolve(p.x, p.y);
      const keepDir = p.dir;
      this.load(m.id, lx, ly, keepDir, true);
      this.wasWalking = true;
    }
    Object.assign(this.st, { x: p.x, y: p.y, dir: p.dir });
    if (!input.dir()) this.wasWalking = false;
    this.afterStep(true);
  }

  async afterStep(stepped) {
    const p = this.player, m = this.map;
    const w = m.warpAt(p.x, p.y);
    if (w && (w.needDir === undefined || w.needDir === p.dir)) { await this.warp(w.to, w.tx, w.ty, w.face); return; }
    if (await this.checkTriggers()) return;
    if (stepped && m.at(p.x, p.y) === 'g' && m.encounters) await this.game.maybeEncounter(m.encounters);
  }

  async checkTriggers() {
    const p = this.player;
    const t = this.map.triggers.find(t => p.x >= t.x && p.y >= t.y && p.x < t.x + t.w && p.y < t.y + t.h && (!t.when || t.when(this.st)));
    if (!t) return false;
    await this.run(t.script);
    return true;
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
    let target = this.npcs.find(n => n.x === fx && n.y === fy);
    const [m, lx, ly] = this.resolve(fx, fy);
    const obj = m && m.objectAt(lx, ly, this.st);
    if (!target && obj && obj.counter) {
      const [dx, dy] = DXY[p.dir];
      target = this.npcs.find(n => n.x === fx + dx && n.y === fy + dy);
    }
    if (target) {
      if (!target.counter) target.dir = [1, 0, 3, 2][p.dir];
      if (typeof target.talk === 'string') await this.run(target.talk, target);
      else if (target.talk) { this.scripts++; await ui.say(target.talk, { name: NAMES[target.look] }); this.scripts--; }
      return;
    }
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

  // ---------- Dibujo ----------
  render(r) {
    const p = this.player, m = this.map;
    let camX = Math.round(p.px) + 8, camY = Math.round(p.py) + 8;
    // Interiores pequeños: cámara centrada en la habitación, como en las portátiles.
    if (!m.outdoor) {
      const W = m.w * TS, H = m.h * TS;
      camX = W <= 240 ? W / 2 : Math.max(120, Math.min(W - 120, camX));
      camY = H <= 176 ? H / 2 + 6 : Math.max(88, Math.min(H - 80, camY));
    }
    const ox = r.anchorX() - camX, oy = r.anchorY() - camY;
    const g = r.bg;
    r.clear(m.outdoor ? '#3f8f3a' : VOID);
    const wf = Math.floor(this.frame / 24);
    const sprites = [];
    const view = { x0: Math.floor(-ox / TS) - 2, y0: Math.floor(-oy / TS) - 2, x1: Math.ceil((320 - ox) / TS) + 2, y1: Math.ceil((232 - oy) / TS) + 3 };

    const maps = m.outdoor ? this.world.outdoor : [m];
    for (const mm of maps) {
      const dx = m.outdoor ? (mm.origin[0] - m.origin[0]) * TS : 0, dy = m.outdoor ? (mm.origin[1] - m.origin[1]) * TS : 0;
      const X = ox + dx, Y = oy + dy;
      if (X > 320 || Y > 232 || X + mm.w * TS < 0 || Y + mm.h * TS < -64) continue;
      g.drawImage(mm.ground(wf), X, Y);
      for (const s of mm.sprites(this.st)) sprites.push({ ...s, x: s.x + dx, y: s.y + dy, base: s.base === -1000 ? -1000 : s.base + dy });
    }
    // Bosque fuera de los mapas: el mundo nunca se ve "vacío" en exteriores.
    if (m.outdoor) {
      if (!this.grassReady) { drawTile(this.grassTile.getContext('2d'), '.', 0, 0, { at: () => '.' }, 0, 0, 0); this.grassReady = true; }
      for (let ty = view.y0; ty < view.y1; ty++) for (let tx = view.x0; tx < view.x1; tx++) {
        const gx = tx + m.origin[0], gy = ty + m.origin[1];
        if (this.world.outdoorAt(gx, gy)) continue;
        g.drawImage(this.grassTile, ox + tx * TS, oy + ty * TS);
        sprites.push({ img: tree((((gx * 3 + gy * 7) % 3) + 3) % 3), x: tx * TS - 3, y: ty * TS - 16, base: ty * TS + 16 });
      }
    }
    // Personajes
    for (const a of [...this.npcs, p]) sprites.push({ actor: a, base: a.py + 16 + (a === p ? 0.5 : 0) });
    sprites.sort((a, b) => a.base - b.base);
    for (const s of sprites) {
      if (s.actor) this.drawActor(g, s.actor, ox, oy);
      else g.drawImage(s.img, Math.round(s.x + ox), Math.round(s.y + oy));
    }
    r.present();
  }

  drawActor(g, a, ox, oy) {
    const X = Math.round(a.px + ox), Y = Math.round(a.py + oy);
    g.fillStyle = 'rgba(20,20,30,.28)';
    g.fillRect(X + 3, Y + 13, 10, 3); g.fillRect(X + 4, Y + 12, 8, 5);
    const f = sheet(a.look)[a.dir][a.frame];
    g.drawImage(f, X, Y - 9);
    // Pasto alto encima de los pies
    const [mm, lx, ly] = this.resolve(Math.round(a.px / TS), Math.round(a.py / TS));
    if (mm && mm.at(lx, ly) === 'g' && (!a.moving || a.moving.t / a.moving.dur > 0.5)) drawTallGrassOverlay(g, X, Y);
  }
}
