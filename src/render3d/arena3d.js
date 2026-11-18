// Duelo de Torres en 3D: el campo con río y puentes, las torres de cada lado, tus Puchamon y los del rival
// caminando por los carriles, los disparos y los golpes. Usa los mismos materiales, luces y acabado del mundo.
// Coordenadas: el campo de la simulación (18 × 32, y hacia abajo) se centra en el origen (x → X, y → Z).
import * as T from 'three';
import { creatureModel, animateCreature } from './creatures3d.js';
import { smallProp } from './models.js';
import { BIOMES } from './environment.js';
import { TYPES } from '../data/creatures.js';
import { FIELD } from '../games/arena/sim.js';

export const TEAM = ['#3f7fe8', '#e8484e'];
const TEAM_DARK = ['#2a56a8', '#a8303c'];
const SKY = { meadow: '#bfe3f2', jungle: '#b8e0d0', desert: '#f2dcb4', snow: '#dfeaf4', volcano: '#4a3a3e' };
const PITCH = 54 * Math.PI / 180, FOV = 30;
const HEIGHT = new Map();   // alto natural de cada modelo, para que todos queden de un tamaño parecido
// Torres de cada lado (las mismas posiciones e id que la simulación).
export const TOWER_LAYOUT = [[0, 'king', 9, 29], [0, 'side', 3.5, 25.5], [0, 'side', 14.5, 25.5], [1, 'king', 9, 3], [1, 'side', 3.5, 6.5], [1, 'side', 14.5, 6.5]];
const towerId = (side, kind, x) => 't' + side + kind + x;
const dummy = new T.Object3D();
function inst(parent, geometry, material, items, shadow = false) {
  if (!items.length) return null;
  const m = new T.InstancedMesh(geometry, material, items.length);
  items.forEach((it, i) => { dummy.position.set(...it.p); dummy.scale.set(...it.s); dummy.rotation.set(...(it.r || [0, 0, 0])); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (it.c) m.setColorAt(i, new T.Color(it.c)); });
  m.castShadow = shadow; m.receiveShadow = true; m.computeBoundingSphere(); parent.add(m); return m;
}
const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

export class ArenaView {
  // w × h: tamaño del campo en casillas (se centra en el origen). Las subclases cambian build(), sync() y fitPoints().
  constructor(engine, { biome = 'meadow', w = FIELD.w, h = FIELD.h } = {}) {
    this.e = engine; this.r = engine.r; this.biome = biome; this.P = BIOMES[biome] || BIOMES.meadow;
    this.cw = w; this.ch = h; this.X = x => x - this.cw / 2; this.Z = y => y - this.ch / 2;
    this.root = new T.Group(); this.root.name = 'arena'; engine.scene.add(this.root);
    this.camera = new T.PerspectiveCamera(FOV, 1, .5, 260);
    this.dir = new T.Vector3(0, Math.sin(PITCH), Math.cos(PITCH));
    this.focus = new T.Vector3(); this.dist = 50; this.fitKey = '';
    this.units = new Map(); this.shots = new Map(); this.fx = []; this.towers = new Map(); this.time = 0;
    this.raycaster = new T.Raycaster(); this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.owned = [];   // materiales y geometrías propios de esta vista (se liberan al salir)
    const own = x => (this.owned.push(x), x);
    this.ringGeo = own(new T.RingGeometry(.8, 1, 36));
    this.discGeo = own(new T.CircleGeometry(1, 36));
    this.teamMat = TEAM.map(c => own(new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .9, depthWrite: false })));
    this.barBg = own(new T.SpriteMaterial({ color: '#1c2036', depthTest: false, transparent: true, opacity: .85 }));
    this.barFill = TEAM.map(c => own(new T.SpriteMaterial({ color: c, depthTest: false })));
    const glow = document.createElement('canvas'); glow.width = glow.height = 64;
    const g = glow.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.glowTex = own(new T.CanvasTexture(glow)); this.glowTex.colorSpace = T.SRGBColorSpace;
    this.shotMats = new Map();
    this.build();
  }
  build() { this.buildGround(); this.buildTowers(); this.buildDecor(); this.buildOverlay(); }
  // Puntos (en coordenadas del campo, ya centradas) que tienen que caber en pantalla.
  fitPoints() { return [[-9.7, 0, -16.7], [9.7, 0, -16.7], [-9.7, 0, 16.7], [9.7, 0, 16.7], [0, 4.6, -13], [-5.5, 4, -9.5], [5.5, 4, -9.5], [0, 4.6, 13], [-5.5, 4, 9.5], [5.5, 4, 9.5]]; }
  wideRotation(aspect) { return aspect > 1.15; }
  mat(color, opts = {}) { const m = new T.MeshBasicMaterial({ color, ...opts }); this.owned.push(m); return m; }
  // ---------- Campo ----------
  buildGround() {
    const r = this.r, env = this.e.environment, P = this.P, g = new T.Group(); this.root.add(g);
    const tiles = [], paths = [];
    const lane = (x, y) => ((x === 3 || x === 4 || x === 13 || x === 14) && ((y >= 7 && y < FIELD.riverTop) || (y >= FIELD.riverBottom && y < 25))) || ((y === 3 || y === 28) && x >= 4 && x <= 13);
    for (let y = 0; y < FIELD.h; y++) for (let x = 0; x < FIELD.w; x++) {
      if (y >= FIELD.riverTop && y < FIELD.riverBottom) continue;
      const p = [this.X(x + .5), -.04, this.Z(y + .5)];
      if (lane(x, y)) paths.push({ p, s: [1, .08, 1], c: new T.Color(P.path).multiplyScalar(.98 + ((x * 7 + y * 3) % 5) * .01) });
      else tiles.push({ p, s: [1, .08, 1], c: new T.Color(P.ground).multiplyScalar((x + y) % 2 ? .93 : 1.03) });
    }
    inst(g, r.geometries.box, env.grassMat, tiles); inst(g, r.geometries.box, env.dirtMat, paths);
    // Afuera: pasto más oscuro hasta donde alcanza la vista.
    inst(g, r.geometries.box, env.grassMat, [{ p: [0, -.13, 0], s: [120, .1, 120], c: new T.Color(P.floor).multiplyScalar(.9) }]);
    // Río con la misma agua del mundo, orillas y espuma.
    const water = new T.Mesh(r.geometries.box, env.water); water.position.set(0, -.07, this.Z(16)); water.scale.set(FIELD.w + 1.6, .06, 2); water.receiveShadow = true; g.add(water);
    const shore = [], foam = [];
    for (const yy of [FIELD.riverTop, FIELD.riverBottom]) { shore.push({ p: [0, -.02, this.Z(yy)], s: [FIELD.w + 1.6, .1, .16] }); foam.push({ p: [0, .01, this.Z(yy) + (yy === FIELD.riverTop ? .14 : -.14)], s: [FIELD.w + 1.4, .01, .05] }); }
    inst(g, r.geometries.box, r.mat(P.shore), shore); inst(g, r.geometries.box, r.mat(P.foam), foam);
    for (const bx of FIELD.bridges) { const b = smallProp(r, { kind: 'bridge', w: 2.3, h: 2.8 }); b.position.set(this.X(bx), 0, this.Z(16)); g.add(b); }
    // Muro bajo alrededor del campo, con postes en las esquinas.
    const walls = new T.Group(), stone = this.biome === 'volcano' ? '#6e625e' : '#d2c8b2', top = this.biome === 'volcano' ? '#8a7c76' : '#e8dfcb';
    for (const s of [-1, 1]) {
      r.box(walls, stone, s * (FIELD.w / 2 + .35), .28, 0, .5, .56, FIELD.h + 1.2, true); r.box(walls, top, s * (FIELD.w / 2 + .35), .6, 0, .62, .1, FIELD.h + 1.3, true);
      r.box(walls, stone, 0, .28, s * (FIELD.h / 2 + .35), FIELD.w + 1.2, .56, .5, true); r.box(walls, top, 0, .6, s * (FIELD.h / 2 + .35), FIELD.w + 1.3, .1, .62, true);
      for (const t of [-1, 1]) { r.box(walls, top, s * (FIELD.w / 2 + .35), .55, t * (FIELD.h / 2 + .35), .9, 1.1, .9, true); r.mesh(walls, 'ball', TEAM[t > 0 ? 0 : 1], [s * (FIELD.w / 2 + .35), 1.25, t * (FIELD.h / 2 + .35)], [.24, .24, .24]); }
    }
    r.batch(walls); this.root.add(walls);
  }
  // ---------- Torres ----------
  towerModel(side, kind) {
    const r = this.r, g = new T.Group(), col = TEAM[side], dark = TEAM_DARK[side];
    const stone = this.biome === 'volcano' ? '#8a7f78' : '#ddd3bf', stone2 = this.biome === 'volcano' ? '#6a605a' : '#bdb19a', wood = '#9a6a42', gold = '#f2c230';
    r.mesh(g, 'cyl32', col, [0, .02, 0], [kind === 'king' ? 2.25 : 1.6, .03, kind === 'king' ? 2.25 : 1.6]);
    if (kind === 'side') {
      r.box(g, stone2, 0, .15, 0, 2.2, .3, 2.2, true);
      r.mesh(g, 'cyl32', stone, [0, 1.05, 0], [.98, 1.6, .98]);
      for (let i = 0; i < 4; i++) r.box(g, stone2, Math.cos(i * 1.57 + .4) * .9, .9 + (i % 2) * .4, Math.sin(i * 1.57 + .4) * .9, .3, .18, .2, true);   // piedras sueltas
      r.mesh(g, 'cyl32', col, [0, 1.9, 0], [1.06, .2, 1.06]);
      r.mesh(g, 'cyl32', wood, [0, 2.1, 0], [1.16, .22, 1.16]);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; r.box(g, stone, Math.cos(a) * 1.0, 2.36, Math.sin(a) * 1.0, .3, .32, .3, true); }
      r.mesh(g, 'cone24', col, [0, 3.0, 0], [.95, .95, .95]); r.mesh(g, 'cone24', dark, [0, 2.55, 0], [1.02, .08, 1.02]);
      r.mesh(g, 'cylinder', '#6b4a2e', [0, 3.75, 0], [.04, .75, .04]); r.box(g, col, .27, 3.95, 0, .5, .32, .03);
    } else {
      r.box(g, stone2, 0, .18, 0, 3.6, .36, 3.6, true);
      r.box(g, stone, 0, 1.3, 0, 2.9, 2.0, 2.9, true);
      r.box(g, '#5a3c26', 0, .75, side ? -1.47 : 1.47, .9, 1.2, .06);   // puerta (mira hacia su lado)
      r.box(g, col, 0, 2.38, 0, 3.05, .22, 3.05, true);
      for (const x of [-1.25, 1.25]) for (const z of [-1.25, 1.25]) { r.box(g, stone, x, 2.85, z, .62, .7, .62, true); r.mesh(g, 'cone24', col, [x, 3.45, z], [.42, .55, .42]); }
      r.mesh(g, 'cone24', col, [0, 3.55, 0], [1.45, 1.25, 1.45]); r.mesh(g, 'cone24', dark, [0, 2.98, 0], [1.52, .08, 1.52]);
      r.mesh(g, 'cyl32', gold, [0, 4.32, 0], [.42, .16, .42]);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; r.mesh(g, 'cone24', gold, [Math.cos(a) * .34, 4.55, Math.sin(a) * .34], [.1, .3, .1]); }
      r.mesh(g, 'ball', '#e8484e', [0, 4.5, side ? -.42 : .42], [.08, .08, .08]);
    }
    r.batch(g); return g;
  }
  rubble(side, kind) {
    const r = this.r, g = new T.Group(), n = kind === 'king' ? 14 : 9, R = kind === 'king' ? 1.5 : 1;
    for (let i = 0; i < n; i++) { const a = i * 2.4, d = (i % 3) * .35 * R; r.box(g, i % 2 ? '#bdb19a' : '#9a8f7c', Math.cos(a) * d, .12 + (i % 4) * .06, Math.sin(a) * d, .35 + (i % 3) * .12, .22 + (i % 2) * .1, .3 + (i % 4) * .08, true); }
    r.mesh(g, 'cyl32', '#6c6458', [0, .01, 0], [R * 1.4, .02, R * 1.4]); r.mesh(g, 'cyl32', TEAM_DARK[side], [0, .05, 0], [.2, .1, .2]);
    r.batch(g); return g;
  }
  buildTowers() {
    for (const [side, kind, x, y] of TOWER_LAYOUT) {
      const model = this.towerModel(side, kind); model.position.set(this.X(x), 0, this.Z(y)); this.root.add(model);
      const shadow = this.r.shadow(this.root, this.X(x), this.Z(y), kind === 'king' ? 4.4 : 3, kind === 'king' ? 4.4 : 3, .28);
      this.towers.set(towerId(side, kind, x), { model, shadow, side, kind, x, y, down: false, hit: 0 });
    }
  }
  // Árboles, rocas y flores afuera del muro (instancias: pocas llamadas de dibujo).
  buildDecor() {
    const r = this.r, P = this.P, g = new T.Group(); this.root.add(g);
    const trunks = [], leaves = [], rocks = [], flowers = [];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const snow = this.biome === 'snow', volc = this.biome === 'volcano', desert = this.biome === 'desert';
    for (let i = 0; i < 150; i++) {
      const side = i % 2 ? 1 : -1, x = side * (this.cw / 2 + 1.6 + rnd() * 14), z = -this.ch / 2 - 8 + rnd() * (this.ch + 14);
      if (desert && rnd() < .6) { rocks.push({ p: [x, .25, z], s: [.5 + rnd() * .5, .35 + rnd() * .4, .5 + rnd() * .4], c: P.cliff }); continue; }
      const h = 1.6 + rnd() * .7, k = .85 + rnd() * .35, base = new T.Color(P.leaves[i % 3]);
      trunks.push({ p: [x, .65, z], s: [.15, 1.3, .15] });
      for (const [dx, dy, dz, s, f] of [[0, .2, 0, .8, 1], [-.35, -.04, .05, .5, .86], [.35, -.05, .04, .5, .86], [0, -.1, .3, .5, .93], [.06, .6, -.05, .5, 1.1]]) leaves.push({ p: [x + dx * k, h + dy * k, z + dz * k], s: [s * k, s * .9 * k, s * k], c: '#' + base.clone().multiplyScalar(f).getHexString() });
    }
    for (let i = 0; i < 60; i++) { const side = i % 2 ? 1 : -1; flowers.push({ p: [side * (this.cw / 2 + 1 + rnd() * 8), .06, -this.ch / 2 + rnd() * this.ch], s: [.06, .045, .06], c: ['#ffffff', '#ffe27a', '#f7a8c4', '#c9b6ff'][i % 4] }); }
    inst(g, r.geometries.cylinder, r.mat('#7d5f40'), trunks, true);
    inst(g, r.geometries.leaf, r.mat('#ffffff'), leaves, true);
    inst(g, r.geometries.leaf, r.mat('#ffffff'), rocks, true);
    if (!snow && !volc) inst(g, r.geometries.ball, r.mat('#ffffff'), flowers);
  }
  // Zona donde se puede soltar la carta y el cursor (verde si se puede, rojo si no).
  buildOverlay() {
    const zoneMat = this.mat(TEAM[0], { transparent: true, opacity: .16, depthWrite: false });
    const plane = new T.PlaneGeometry(1, 1); this.owned.push(plane);
    const own = new T.Mesh(plane, zoneMat); own.rotation.x = -Math.PI / 2; const y0 = FIELD.riverBottom + .6, y1 = FIELD.h - .8;
    own.position.set(0, .06, this.Z((y0 + y1) / 2)); own.scale.set(FIELD.w - 1.2, y1 - y0, 1); own.renderOrder = 5;
    this.zone = new T.Group(); this.zone.add(own); this.root.add(this.zone); this.zone.visible = false;
    this.pockets = [0, 1].map(i => { const m = new T.Mesh(plane, zoneMat); m.rotation.x = -Math.PI / 2; m.position.set(i ? this.X(13.5) : this.X(4.5), .06, this.Z((9.5 + FIELD.riverTop - .4) / 2)); m.scale.set(FIELD.w / 2 - 1.2, FIELD.riverTop - .4 - 9.5, 1); m.renderOrder = 5; m.visible = false; this.zone.add(m); return m; });
    this.cursor = new T.Group(); this.root.add(this.cursor); this.cursor.visible = false;
    this.cursorOk = this.mat('#5ce08a', { transparent: true, opacity: .95, depthWrite: false }); this.cursorBad = this.mat('#ff6a6a', { transparent: true, opacity: .95, depthWrite: false });
    this.cursorRing = new T.Mesh(this.ringGeo, this.cursorOk); this.cursorRing.rotation.x = -Math.PI / 2; this.cursorRing.position.y = .08; this.cursorRing.renderOrder = 6;
    this.cursorDisc = new T.Mesh(this.discGeo, this.mat('#ffffff', { transparent: true, opacity: .22, depthWrite: false })); this.cursorDisc.rotation.x = -Math.PI / 2; this.cursorDisc.position.y = .07; this.cursorDisc.renderOrder = 6;
    this.cursor.add(this.cursorRing, this.cursorDisc);
  }
  // ---------- Criaturas ----------
  addUnit(u) {
    const r = this.r, root = new T.Group(); this.root.add(root);
    const model = creatureModel(r, u.sp);
    let h = HEIGHT.get(u.sp);
    if (!h) { model.updateMatrixWorld(true); const box = new T.Box3().setFromObject(model); h = Math.max(.3, box.max.y - box.min.y); HEIGHT.set(u.sp, h); }
    const want = u.r >= .55 ? 2.05 : u.r <= .33 ? 1.1 : 1.55;
    model.scale.multiplyScalar(want / h);
    const body = new T.Group(); body.add(model); root.add(body);
    const ring = new T.Mesh(this.ringGeo, this.teamMat[u.side]); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; ring.scale.setScalar(u.r + .14); ring.renderOrder = 4; root.add(ring);
    r.shadow(root, 0, 0, u.r * 2.6, u.r * 2.2, .3);
    const bar = new T.Group(); bar.position.y = want + (u.flying ? 1.75 : .35); root.add(bar);
    const bg = new T.Sprite(this.barBg); bg.scale.set(1.0, .16, 1); bg.renderOrder = 20;
    const fill = new T.Sprite(this.barFill[u.side]); fill.center.set(0, .5); fill.position.x = -.46; fill.scale.set(.92, .1, 1); fill.renderOrder = 21;
    bar.add(bg, fill); bar.visible = false;
    const v = { root, body, model, bar, fill, want, born: this.time, side: u.side, flying: u.flying, face: u.side ? 0 : Math.PI };
    body.rotation.y = v.face; body.scale.setScalar(.01);
    this.units.set(u.id, v); return v;
  }
  updateUnit(v, u, dt, t) {
    v.root.position.set(this.X(u.x), 0, this.Z(u.y));
    const [dx, dz] = u.dir; v.face = lerpAngle(v.face, Math.atan2(dx, dz), Math.min(1, dt * 10)); v.body.rotation.y = v.face;
    const born = Math.min(1, (t - v.born) / .35), walk = u.moving ? Math.abs(Math.sin(t * 9 + u.id)) * .09 : 0;
    const lunge = u.attackT > 0 ? Math.sin(u.attackT / .3 * Math.PI) * (u.ranged ? .08 : .3) : 0;
    v.body.position.set(dx * lunge, (u.flying ? 1.45 + Math.sin(t * 3 + u.id) * .1 : 0) + walk, dz * lunge);
    const squash = u.hitT > 0 ? 1 - u.hitT * 1.2 : 1;
    v.body.scale.set(born, born * squash * (u.deploy > 0 ? .92 : 1), born);
    animateCreature(v.model, t, dt);
    const f = Math.max(0, u.hp / u.max); v.bar.visible = f < .999 && u.deploy <= 0; v.fill.scale.x = .92 * f;
  }
  removeUnit(v) { this.r.release(v.root); }
  // ---------- Disparos ----------
  shotMat(kind) {
    if (!this.shotMats.has(kind)) this.shotMats.set(kind, this.mat(kind === 'tower' ? '#4a4a58' : TYPES[kind]?.color || '#ffffff'));
    return this.shotMats.get(kind);
  }
  syncShots(sim) {
    const seen = new Set();
    for (const p of sim.projectiles) {
      seen.add(p.id); let m = this.shots.get(p.id);
      if (!m) {
        m = new T.Group(); const ball = new T.Mesh(this.r.geometries.ball, this.shotMat(p.type)); ball.scale.setScalar(p.tower ? .2 : .17); m.add(ball);
        if (!p.tower) { const glow = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: TYPES[p.type]?.color || '#ffffff', blending: T.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.setScalar(.8); m.add(glow); m.userData.glow = glow; }
        this.root.add(m); this.shots.set(p.id, m);
      }
      m.position.set(this.X(p.x), p.h, this.Z(p.y));
    }
    for (const [id, m] of this.shots) if (!seen.has(id)) { m.userData.glow?.material.dispose(); m.removeFromParent(); this.shots.delete(id); }
  }
  // ---------- Efectos ----------
  burst(x, y, h, color, size = 1, life = .28) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(this.X(x), h, this.Z(y)); s.scale.setScalar(.2); this.root.add(s);
    this.fx.push({ o: s, t: 0, life, size, kind: 'burst' });
  }
  puff(x, y, size = 1, color = '#ffffff') {
    for (let i = 0; i < 7; i++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color, transparent: true, depthWrite: false, opacity: .9 }));
      const a = i / 7 * Math.PI * 2; s.position.set(this.X(x), .4, this.Z(y)); this.root.add(s);
      this.fx.push({ o: s, t: 0, life: .55, size: size * (.9 + (i % 3) * .2), kind: 'puff', vx: Math.cos(a) * 1.6 * size, vz: Math.sin(a) * 1.6 * size, vy: 1.2 + (i % 2) * .6 });
    }
  }
  ringPulse(x, y, color) {
    const m = new T.Mesh(this.ringGeo, new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(this.X(x), .07, this.Z(y)); this.root.add(m);
    this.fx.push({ o: m, t: 0, life: .45, size: 1.4, kind: 'ring' });
  }
  event(ev, sim) {
    if (ev.type === 'play') this.ringPulse(ev.x, ev.y, TEAM[ev.side]);
    else if (ev.type === 'hit') this.burst(ev.x, ev.y, .7, ev.eff > 1 ? '#fff2a0' : '#ffffff', ev.eff > 1 ? 1.25 : .85);
    else if (ev.type === 'impact') this.burst(ev.x, ev.y, ev.tower ? .8 : .9, ev.tower ? '#ffd8a0' : TYPES[ev.kind]?.color || '#ffffff', ev.tower ? .8 : 1);
    else if (ev.type === 'die') this.puff(ev.x, ev.y, .8);
    else if (ev.type === 'tower') {
      const tw = this.towers.get(ev.id); if (!tw || tw.down) return;
      tw.down = true; tw.model.visible = false; tw.shadow.visible = false;
      const rb = this.rubble(tw.side, tw.kind); rb.position.set(this.X(tw.x), 0, this.Z(tw.y)); this.root.add(rb);
      this.puff(tw.x, tw.y, 2.2, '#e8e0d0'); this.burst(tw.x, tw.y, 1.5, '#ffd27a', 4, .5);
    }
    for (const t of sim?.towers || []) { const tw = this.towers.get(t.id); if (tw) tw.hit = t.hitT || 0; }
  }
  stepFx(dt) {
    for (const f of this.fx) {
      f.t += dt; const k = Math.min(1, f.t / f.life);
      if (f.kind === 'burst') { f.o.scale.setScalar(.25 + k * f.size); f.o.material.opacity = 1 - k; }
      else if (f.kind === 'puff') { f.o.position.x += f.vx * dt; f.o.position.z += f.vz * dt; f.o.position.y += f.vy * dt; f.o.scale.setScalar(.35 + k * .7 * f.size); f.o.material.opacity = .85 * (1 - k); }
      else if (f.kind === 'ring') { f.o.scale.setScalar(.3 + k * f.size); f.o.material.opacity = 1 - k; }
      if (k >= 1) { f.o.removeFromParent(); f.o.material.dispose(); f.done = true; }
    }
    this.fx = this.fx.filter(f => !f.done);
  }
  // ---------- Cada cuadro ----------
  // cursor: { x, y, ok, pocket: [izq, der] } mientras hay una carta escogida.
  sync(sim, events, dt, t, cursor) {
    this.time = t;
    if (sim) {
      const seen = new Set();
      for (const u of sim.units) { seen.add(u.id); const v = this.units.get(u.id) || this.addUnit(u); this.updateUnit(v, u, dt, t); }
      for (const [id, v] of this.units) if (!seen.has(id)) { this.removeUnit(v); this.units.delete(id); }
      this.syncShots(sim);
      for (const ev of events) this.event(ev, sim);
      for (const tw of sim.towers) { const v = this.towers.get(tw.id); if (v && !v.down) { const k = tw.hitT > 0 ? 1 + tw.hitT * .25 : 1; v.model.scale.set(1, 1 / k, 1); } if (v && !v.down && tw.hp <= 0) this.event({ type: 'tower', id: tw.id }, sim); }
    }
    this.stepFx(dt);
    this.zone.visible = !!cursor; this.cursor.visible = !!(cursor && cursor.show);
    if (cursor) {
      this.pockets.forEach((m, i) => { m.visible = !!cursor.pocket?.[i]; });
      if (cursor.show) { this.cursor.position.set(this.X(cursor.x), 0, this.Z(cursor.y)); this.cursorRing.material = cursor.ok ? this.cursorOk : this.cursorBad; const s = (cursor.r || .45) + .25; this.cursorRing.scale.setScalar(s * (1 + Math.sin(t * 6) * .05)); this.cursorDisc.scale.setScalar(s * .95); }
    }
  }
  // Encaja todo el campo (con las torres) en la parte de la pantalla que no tapan los botones. En pantallas
  // anchas (iPad acostado, computador) el campo se acuesta: tu lado a la izquierda y el rival a la derecha.
  fit(aspect, safe) {
    const wide = this.wideRotation(aspect);
    const key = aspect.toFixed(3) + ':' + wide + ':' + Object.values(safe).join(',');
    if (key === this.fitKey) return; this.fitKey = key;
    this.wide = wide; this.root.rotation.y = wide ? -Math.PI / 2 : 0; this.root.updateMatrixWorld(true);
    const cam = this.camera; cam.fov = FOV; cam.aspect = aspect; cam.updateProjectionMatrix();
    const pts = this.fitPoints().map(p => this.root.localToWorld(new T.Vector3(...p)));
    const box = { l: -1 + 2 * safe.left, r: 1 - 2 * safe.right, b: -1 + 2 * safe.bottom, t: 1 - 2 * safe.top };
    const place = (tz, d) => { this.focus.set(0, 0, tz); cam.position.copy(this.focus).addScaledVector(this.dir, d); cam.lookAt(this.focus); cam.updateMatrixWorld(true); };
    const proj = (tz, d) => { place(tz, d); return pts.map(p => p.clone().project(cam)); };
    const fits = (tz, d) => proj(tz, d).every(v => v.x >= box.l && v.x <= box.r && v.y >= box.b && v.y <= box.t && v.z < 1);
    const centerY = (tz, d) => { const ys = proj(tz, d).map(v => v.y); return (Math.min(...ys) + Math.max(...ys)) / 2; };
    let tz = 0, d = 60;
    for (let pass = 0; pass < 3; pass++) {
      let lo = 8, hi = 200; for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (fits(tz, m)) hi = m; else lo = m; } d = hi;
      const want = (box.b + box.t) / 2; let a = -14, b = 14;
      const fa = centerY(a, d) - want;
      for (let i = 0; i < 28; i++) { const m = (a + b) / 2, fm = centerY(m, d) - want; if ((fm > 0) === (fa > 0)) a = m; else b = m; }
      tz = (a + b) / 2;
    }
    let lo = 8, hi = 200; for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (fits(tz, m)) hi = m; else lo = m; }
    this.dist = hi; place(tz, hi);
  }
  frame(dt, aspect, safe) {
    this.fit(aspect, safe);
    const e = this.e;
    if (!e.scene.background?.isColor) e.scene.background = new T.Color();
    const sky = SKY[this.biome] || SKY.meadow;
    e.scene.background.set(sky); e.scene.fog.color.set(sky); e.scene.fog.near = this.dist + 8; e.scene.fog.far = this.dist + 70;
    e.lights.update(this.focus, false, this.biome === 'volcano' ? 18 : 12);
    e.styleOpts = { focusY: .5, tilt: .1, night: 0, bloom: this.biome === 'volcano' ? .5 : .3, lift: .1, grade: this.biome === 'volcano' ? [1.1, .97, .9] : this.biome === 'desert' ? [1.08, 1.02, .9] : [1.05, 1.01, .95], sat: 1.14 };
    return this.camera;
  }
  // Toque en pantalla (px) → punto del campo; y al revés, para poner etiquetas encima de las torres.
  screenToField(px, py) {
    const ndc = new T.Vector2(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera); const hit = new T.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plane, hit)) return null;
    this.root.worldToLocal(hit);
    return { x: hit.x + this.cw / 2, y: hit.z + this.ch / 2 };
  }
  fieldToScreen(x, y, h = 0) { const v = this.root.localToWorld(new T.Vector3(this.X(x), h, this.Z(y))).project(this.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }
  dispose() {
    for (const f of this.fx) f.o.material?.dispose();
    for (const m of this.shots.values()) m.userData.glow?.material.dispose();
    this.r.release(this.root);
    for (const x of this.owned) x.dispose();
  }
}
