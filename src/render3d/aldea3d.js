// Aldea Puchamon en 3D: la cuadrícula de 24 × 24 con tus edificios (o los de la aldea rival en un ataque),
// obras con andamios, el fantasma del edificio que vas a poner y la zona roja donde no se puede soltar.
// Hereda de la vista del Duelo de Torres: criaturas, disparos, efectos, cámara y toques funcionan igual.
import * as T from 'three';
import { ArenaView } from './arena3d.js';
import { building } from './models.js';
import { B, GRID } from '../games/aldea/sim.js';

const ENEMY_ROOF = '#7a4ad8';
export class AldeaView extends ArenaView {
  constructor(engine, opts = {}) {
    super(engine, { biome: opts.biome || 'meadow', w: GRID, h: GRID });
    this.models = new Map(); this.enemy = !!opts.enemy;
  }
  build() { this.buildVillageGround(); this.buildDecor(); this.buildVillageOverlay(); }
  fitPoints() { const h = GRID / 2 + .6; return [[-h, 0, -h], [h, 0, -h], [-h, 0, h], [h, 0, h], [-h + 3, 4, -h + 3], [h - 3, 4, -h + 3]]; }
  wideRotation() { return false; }
  buildVillageGround() {
    const r = this.r, env = this.e.environment, P = this.P, g = new T.Group(); this.root.add(g);
    const tiles = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const edge = x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1;
      tiles.push({ p: [this.X(x + .5), -.04, this.Z(y + .5)], s: [1, .08, 1], c: new T.Color(edge ? P.path : P.ground).multiplyScalar(edge ? 1 : (x + y) % 2 ? .95 : 1.02) });
    }
    const m = new T.InstancedMesh(r.geometries.box, env.grassMat, tiles.length); const d = new T.Object3D();
    tiles.forEach((t, i) => { d.position.set(...t.p); d.scale.set(...t.s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, t.c); });
    m.receiveShadow = true; g.add(m);
    const outer = new T.InstancedMesh(r.geometries.box, env.grassMat, 1); d.position.set(0, -.13, 0); d.scale.set(120, .1, 120); d.updateMatrix(); outer.setMatrixAt(0, d.matrix); outer.setColorAt(0, new T.Color(P.floor).multiplyScalar(.9)); outer.receiveShadow = true; g.add(outer);
    // Cerca baja alrededor de la aldea.
    const fence = new T.Group(), h = GRID / 2 + .15;
    for (let i = 0; i <= GRID; i += 2) for (const [x, z] of [[-h + i, -h], [-h + i, h], [-h, -h + i], [h, -h + i]]) r.box(fence, '#9a6a42', x, .28, z, .14, .56, .14, true);
    for (const s of [-1, 1]) { r.box(fence, '#b58552', 0, .42, s * h, GRID + .3, .08, .06, true); r.box(fence, '#b58552', s * h, .42, 0, .06, .08, GRID + .3, true); }
    r.batch(fence); this.root.add(fence);
  }
  buildVillageOverlay() {
    const plane = new T.PlaneGeometry(1, 1); this.owned.push(plane);
    this.plane1 = plane;
    this.red = this.mat('#ff4a4a', { transparent: true, opacity: .2, depthWrite: false });
    this.okMat = this.mat('#5ce08a', { transparent: true, opacity: .45, depthWrite: false });
    this.badMat = this.mat('#ff6a6a', { transparent: true, opacity: .5, depthWrite: false });
    this.selMat = this.mat('#ffd25c', { transparent: true, opacity: .55, depthWrite: false });
    this.foot = new T.Mesh(plane, this.okMat); this.foot.rotation.x = -Math.PI / 2; this.foot.position.y = .07; this.foot.renderOrder = 6; this.foot.visible = false; this.root.add(this.foot);
    this.selFoot = new T.Mesh(plane, this.selMat); this.selFoot.rotation.x = -Math.PI / 2; this.selFoot.position.y = .065; this.selFoot.renderOrder = 6; this.selFoot.visible = false; this.root.add(this.selFoot);
    this.redZone = null; this.ghost = null; this.ghostKey = '';
    // Cursor para soltar Puchamon en un ataque (anillo verde o rojo).
    this.cursor = new T.Group(); this.root.add(this.cursor); this.cursor.visible = false;
    this.cursorOk = this.mat('#5ce08a', { transparent: true, opacity: .95, depthWrite: false }); this.cursorBad = this.mat('#ff6a6a', { transparent: true, opacity: .95, depthWrite: false });
    this.cursorRing = new T.Mesh(this.ringGeo, this.cursorOk); this.cursorRing.rotation.x = -Math.PI / 2; this.cursorRing.position.y = .08; this.cursorRing.renderOrder = 7; this.cursor.add(this.cursorRing);
  }
  // ---------- Modelos de los edificios ----------
  model(kind, level, built = true) {
    const r = this.r, g = new T.Group(), s = B[kind].size, c = s / 2, L = Math.max(1, level), team = this.enemy ? '#e8484e' : '#3f7fe8';
    const stone = '#d6ccb6', stone2 = '#b9ad96', wood = '#9a6a42', wood2 = '#7d5432';
    if (kind === 'casa') {
      const h = building(r, { kind: 'house', w: 4, h: 4, opt: { roof: this.enemy ? ENEMY_ROOF : '#d8504a', wall: '#f8e8cc', floors: L >= 3 ? 2 : 1, doorCol: 1 } });
      g.add(h);
      const top = L >= 3 ? 5.4 : 3.5; r.mesh(g, 'cylinder', '#6b4a2e', [3.4, top, .9], [.04, .9, .04]); r.box(g, team, 3.66, top + .3, .9, .5, .32, .03);
      for (let i = 0; i < L; i++) r.mesh(g, 'ball', '#f2c230', [.5 + i * .35, .25, 3.85], [.12, .12, .12]);
    } else if (kind === 'mina') {
      r.box(g, '#8f8576', c, .12, c, s - .4, .24, s - .4, true);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; r.ball(g, i % 2 ? '#8a8478' : '#9d968a', c + Math.cos(a) * .8, .45, c + Math.sin(a) * .7, .7, .55, .65); }
      for (let i = 0; i < 2 + L; i++) { const a = i * 1.9 + .4, k = r.mesh(g, 'cone24', r.mat('#dbe6f2', { emissive: '#9fb8d0', emissiveIntensity: .35, roughness: .2 }), [c + Math.cos(a) * .55, .95 + (i % 2) * .15, c + Math.sin(a) * .5], [.16, .55 + (i % 3) * .12, .16]); k.rotation.z = (i % 2 ? .3 : -.25); }
      r.box(g, wood2, c + .9, .38, c + 1.05, .7, .3, .45, true); for (const dx of [-.25, .25]) r.mesh(g, 'cylinder', '#4a4a52', [c + .9 + dx, .2, c + 1.3], [.12, .04, .12]).rotation.x = Math.PI / 2;
      r.mesh(g, 'ball', '#e8eef6', [c + .9, .6, c + 1.05], [.2, .12, .15]);
    } else if (kind === 'huerto') {
      r.box(g, '#7a5236', c, .1, c, s - .3, .2, s - .3, true);
      const berry = ['#e8484e', '#8a5ae8', '#3f7fe8', '#f2a03a'];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = .55 + i * .95, z = .55 + j * .95; r.ball(g, '#4f9a4a', x, .45, z, .62, .5, .62); for (let k = 0; k < Math.min(5, 1 + L); k++) r.ball(g, berry[(i + j + k) % 4], x + Math.cos(k * 1.3) * .25, .55 + (k % 2) * .12, z + Math.sin(k * 1.3) * .25, .1); }
      for (let i = 0; i <= 6; i++) r.box(g, wood, i * s / 6, .25, 0, .08, .4, .08, true);
      r.box(g, wood, c, .32, 0, s, .06, .05, true);
    } else if (kind === 'granero') {
      const H = 1.5 + L * .18;
      r.box(g, stone2, c, .1, c, s - .2, .2, s - .2, true);
      r.box(g, '#c8483e', c, H / 2 + .2, c, s - .6, H, s - .6, true);
      for (const x of [.35, s - .35]) r.box(g, '#f4ead8', x, H / 2 + .2, s - .3, .12, H, .1, true);
      const roof = new T.Group(); roof.position.set(c, H + .2, c); g.add(roof);
      for (const sd of [-1, 1]) { const p = r.box(roof, '#7d3a32', sd * .62, .38, 0, 1.45, .12, s - .3, true); p.rotation.z = -sd * .62; }
      r.box(g, '#5a3c26', c, .75, s - .29, .9, 1.1, .05); for (const d of [-1, 1]) { const x = r.box(g, '#f4ead8', c, .75, s - .26, 1.25, .07, .02); x.rotation.z = d * .9; }
    } else if (kind === 'corral') {
      r.box(g, '#8cc06a', c, .02, c, s - .2, .04, s - .2, true);
      for (let i = 0; i <= 8; i++) for (const [x, z] of [[i * s / 8, .1], [i * s / 8, s - .1], [.1, i * s / 8], [s - .1, i * s / 8]]) r.box(g, wood, x, .35, z, .1, .7, .1, true);
      for (const y of [.3, .55]) { r.box(g, '#b58552', c, y, .1, s, .06, .05, true); r.box(g, '#b58552', c, y, s - .1, s, .06, .05, true); r.box(g, '#b58552', .1, y, c, .05, .06, s, true); r.box(g, '#b58552', s - .1, y, c, .05, .06, s, true); }
      r.box(g, '#e8dcc0', 1, .6, 1, 1.2, 1.2, 1.1, true); r.box(g, '#c8483e', 1, 1.3, 1, 1.4, .2, 1.3, true);
      r.box(g, wood2, s - 1, .2, s - 1, 1, .3, .45, true); r.box(g, '#6fb8e8', s - 1, .34, s - 1, .85, .04, .32);
      r.box(g, team, c, .36, .05, .9, .45, .04);
    } else if (kind === 'torre') {
      const H = 2.2 + L * .25;
      r.box(g, stone2, c, .15, c, s - .5, .3, s - .5, true);
      for (const [x, z] of [[.75, .75], [s - .75, .75], [.75, s - .75], [s - .75, s - .75]]) r.mesh(g, 'cylinder', wood2, [x, H / 2 + .2, z], [.1, H, .1]);
      for (let k = 1; k < 3; k++) { const y = .2 + H * k / 3; r.box(g, wood, c, y, .75, s - 1.3, .06, .06, true); r.box(g, wood, c, y, s - .75, s - 1.3, .06, .06, true); }
      r.box(g, wood, c, H + .25, c, s - .9, .16, s - .9, true);
      for (const [x, z, w, d] of [[c, .55, s - .9, .1], [c, s - .55, s - .9, .1], [.55, c, .1, s - .9], [s - .55, c, .1, s - .9]]) r.box(g, wood2, x, H + .5, z, w, .35, d, true);
      r.mesh(g, 'cone24', team, [c, H + 1.25, c], [1.25, .8, 1.25]);
      r.mesh(g, 'cylinder', '#6b4a2e', [c, H + 1.95, c], [.035, .6, .035]); r.box(g, team, c + .22, H + 2.1, c, .4, .26, .03);
    } else if (kind === 'lanza') {
      r.box(g, stone2, c, .15, c, s - .3, .3, s - .3, true); r.box(g, stone, c, .45, c, s - .9, .3, s - .9, true);
      for (const x of [c - .5, c + .5]) { const a = r.box(g, wood2, x, 1.05, c, .14, 1.2, .14, true); a.rotation.z = x < c ? -.2 : .2; }
      r.box(g, wood, c, 1.6, c, 1.3, .14, .16, true);
      const arm = r.box(g, wood2, c, 1.2, c + .2, .14, .12, 2.2, true); arm.rotation.x = -.55;
      r.mesh(g, 'ball', '#8a8478', [c, 1.85, c + 1.05], [.3, .3, .3]);
      for (let i = 0; i < L; i++) r.mesh(g, 'ball', '#f2c230', [.4 + i * .3, .65, s - .4], [.09, .09, .09]);
      r.box(g, team, c, .5, s - .45, .6, .3, .04);
    } else if (kind === 'muro') {
      const col = ['#b58552', '#cfc6b4', '#a8a0b8', '#8a8a96', '#e6d39a'][L - 1];
      r.box(g, col, .5, .42, .5, .9, .84, .9, true); r.box(g, '#ffffff', .5, .88, .5, .94, .08, .94, true).material = r.mat(col);
    }
    if (!built) {
      // Andamio de obra: palos de madera y una lona.
      for (const [x, z] of [[.15, .15], [s - .15, .15], [.15, s - .15], [s - .15, s - .15]]) r.mesh(g, 'cylinder', '#c99a5a', [x, 1.2, z], [.05, 2.4, .05]);
      for (const y of [.9, 1.9]) { r.box(g, '#c99a5a', c, y, .15, s, .05, .05, true); r.box(g, '#c99a5a', c, y, s - .15, s, .05, .05, true); }
      r.box(g, '#f2c230', c, 2.45, c, s * .6, .06, s * .6, true);
    }
    r.batch(g); return g;
  }
  // ---------- Aldea propia ----------
  syncVillage(A, opts = {}) {
    const now = opts.now || Date.now(), seen = new Set();
    for (const b of A.buildings) {
      seen.add(b.id);
      const built = b.level >= 1 && !(b.upg && b.upg.to === 1), key = b.kind + b.level + ':' + built + ':' + (b.upg ? 1 : 0) + (opts.moving === b.id ? ':m' : '');
      let v = this.models.get(b.id);
      if (!v || v.key !== key) { if (v) this.r.release(v.root); const root = this.model(b.kind, Math.max(1, b.level), built && !b.upg); this.root.add(root); v = { root, key }; this.models.set(b.id, v); }
      v.root.position.set(this.X(b.x), 0, this.Z(b.y)); v.root.visible = opts.moving !== b.id;
    }
    for (const [id, v] of this.models) if (!seen.has(id)) { this.r.release(v.root); this.models.delete(id); }
    const sel = A.buildings.find(b => b.id === opts.sel);
    this.selFoot.visible = !!sel && !opts.ghost;
    if (sel) { const s = B[sel.kind].size; this.selFoot.position.set(this.X(sel.x + s / 2), .065, this.Z(sel.y + s / 2)); this.selFoot.scale.set(s + .2, s + .2, 1); }
    this.setGhost(opts.ghost);
  }
  // Fantasma del edificio que se está poniendo o moviendo: el modelo medio transparente y el piso verde o rojo.
  setGhost(gh) {
    this.foot.visible = !!gh;
    if (!gh) { if (this.ghost) { this.r.release(this.ghost); this.ghost = null; this.ghostKey = ''; } return; }
    const key = gh.kind + gh.level;
    if (this.ghostKey !== key) {
      if (this.ghost) this.r.release(this.ghost);
      this.ghost = this.model(gh.kind, gh.level || 1, true); this.ghostKey = key;
      this.ghost.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .72; o.userData.ownedMaterial = true; } });
      this.root.add(this.ghost);
    }
    const s = B[gh.kind].size;
    this.ghost.position.set(this.X(gh.x), .05, this.Z(gh.y));
    this.foot.material = gh.ok ? this.okMat : this.badMat; this.foot.position.set(this.X(gh.x + s / 2), .07, this.Z(gh.y + s / 2)); this.foot.scale.set(s, s, 1);
  }
  // ---------- Ataque ----------
  startRaid(sim) {
    for (const v of this.models.values()) this.r.release(v.root);
    this.models.clear(); this.raidBars = new Map();
    for (const b of sim.buildings) {
      const root = this.model(b.kind, b.level, true); root.position.set(this.X(b.x), 0, this.Z(b.y)); this.root.add(root);
      const bar = new T.Group(); bar.position.set(this.X(b.cx), b.wall ? 1.3 : 3.6, this.Z(b.cy)); this.root.add(bar);
      const bg = new T.Sprite(this.barBg); bg.scale.set(b.wall ? .8 : 1.6, .16, 1); bg.renderOrder = 20;
      const fill = new T.Sprite(this.barFill[1]); fill.center.set(0, .5); const w = b.wall ? .74 : 1.52; fill.position.x = -w / 2; fill.scale.set(w, .1, 1); fill.renderOrder = 21;
      bar.add(bg, fill); bar.visible = false;
      this.models.set(b.id, { root, key: 'raid', bar, fill, w, down: false });
    }
    // Zona roja: casillas donde no se puede soltar.
    const cells = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!sim.canDeploy(x + .5, y + .5)) cells.push([x, y]);
    if (this.redZone) { this.redZone.removeFromParent(); this.redZone.dispose?.(); }
    const m = new T.InstancedMesh(this.plane1, this.red, cells.length || 1), d = new T.Object3D();
    cells.forEach(([x, y], i) => { d.position.set(this.X(x + .5), .055, this.Z(y + .5)); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.count = cells.length; m.renderOrder = 5; m.visible = false; this.root.add(m); this.redZone = m; this.redCells = cells.length;
  }
  shotMat(kind) {
    if (kind === 'torre' || kind === 'lanza') { if (!this.shotMats.has(kind)) this.shotMats.set(kind, this.mat(kind === 'lanza' ? '#7d766c' : '#8a5a32')); return this.shotMats.get(kind); }
    return super.shotMat(kind);
  }
  syncRaid(sim, events, dt, t, cursor) {
    this.time = t;
    const seen = new Set();
    for (const u of sim.units) { seen.add(u.id); const v = this.units.get(u.id) || this.addUnit(u); this.updateUnit(v, u, dt, t); }
    for (const [id, v] of this.units) if (!seen.has(id)) { this.removeUnit(v); this.units.delete(id); }
    // Disparos: los de las defensas van como piedras o flechas (sin brillo).
    for (const p of sim.projectiles) p.tower = p.foe;
    this.syncShots(sim);
    for (const b of sim.buildings) {
      const v = this.models.get(b.id); if (!v) continue;
      const f = Math.max(0, b.hp / b.max); v.bar.visible = f < .999 && f > 0; v.fill.scale.x = v.w * f;
      if (!v.down && b.hp > 0 && b.hitT > 0) v.root.scale.set(1, 1 - b.hitT * .25, 1); else if (!v.down) v.root.scale.set(1, 1, 1);
      if (!v.down && b.hp <= 0) {
        v.down = true; v.root.visible = false; v.bar.visible = false;
        if (!b.wall) { const rb = this.rubble(1, b.s >= 4 ? 'king' : 'side'); rb.position.set(this.X(b.cx), 0, this.Z(b.cy)); this.root.add(rb); this.puff(b.cx, b.cy, 1.6, '#e8e0d0'); }
        else this.puff(b.cx, b.cy, .6, '#d8d0c0');
      }
    }
    for (const ev of events) {
      if (ev.type === 'deploy') this.ringPulse(ev.x, ev.y, '#3f7fe8');
      else if (ev.type === 'hit') this.burst(ev.x, ev.y, .8, '#ffffff', .9);
      else if (ev.type === 'impact') this.burst(ev.x, ev.y, .8, ev.foe ? '#ffd8a0' : '#ffffff', .8);
      else if (ev.type === 'boom') { this.burst(ev.x, ev.y, .5, '#ffd27a', 2.2, .4); this.puff(ev.x, ev.y, .7, '#cfc4b0'); }
      else if (ev.type === 'die') this.puff(ev.x, ev.y, .8);
    }
    this.stepFx(dt);
    if (this.redZone) this.redZone.visible = !!cursor;
    this.cursor.visible = !!(cursor && cursor.show);
    if (cursor?.show) { this.cursor.position.set(this.X(cursor.x), 0, this.Z(cursor.y)); this.cursorRing.material = cursor.ok ? this.cursorOk : this.cursorBad; this.cursorRing.scale.setScalar(.75 * (1 + Math.sin(t * 6) * .05)); }
  }
  sync() { this.stepFx(0); }
  frame(dt, aspect, safe) {
    const cam = super.frame(dt, aspect, safe);
    this.e.styleOpts = { ...this.e.styleOpts, tilt: .06 };
    return cam;
  }
  dispose() { if (this.ghost) { this.r.release(this.ghost); this.ghost = null; } for (const v of this.models.values()) { v.bar?.removeFromParent(); } super.dispose(); }
}
