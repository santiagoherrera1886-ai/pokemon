// Pelea Puchamon en 3D: escenario flotante visto de lado, tus Puchamon peleando con sus modelos esculpidos,
// cámara que se acerca o se aleja para que siempre quepan todos, disparos, golpes, escudos y salidas.
import * as T from 'three';
import { creatureModel, animateCreature } from './creatures3d.js';
import { BIOMES } from './environment.js';
import { TYPES } from '../data/creatures.js';
import { STAGES } from '../games/pelea/sim.js';

export const COLORS = ['#3f7fe8', '#e8484e', '#3fbf6a', '#f2b62c'];
const HEIGHT = new Map();
const FOV = 32, TAN = Math.tan(FOV * Math.PI / 360);

export class PeleaView {
  constructor(engine, { stage = 'isla' } = {}) {
    this.e = engine; this.r = engine.r; this.stageId = STAGES[stage] ? stage : 'isla'; this.S = STAGES[this.stageId];
    this.P = BIOMES[this.S.biome] || BIOMES.meadow; this.volcano = this.S.biome === 'volcano';
    this.root = new T.Group(); this.root.name = 'pelea'; engine.scene.add(this.root);
    this.camera = new T.PerspectiveCamera(FOV, 1, .5, 300);
    this.cam = { x: 0, y: 2, d: 24 }; this.fighters = new Map(); this.shots = new Map(); this.fx = []; this.owned = [];
    const glow = document.createElement('canvas'); glow.width = glow.height = 64;
    const g = glow.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.glowTex = this.own(new T.CanvasTexture(glow)); this.glowTex.colorSpace = T.SRGBColorSpace;
    this.bubbleGeo = this.own(new T.SphereGeometry(1, 24, 16));
    this.buildStage(); this.buildBackdrop();
  }
  own(x) { this.owned.push(x); return x; }
  mat(color, opts = {}) { return this.own(new T.MeshBasicMaterial({ color, ...opts })); }
  // ---------- Escenario ----------
  buildStage() {
    const r = this.r, S = this.S, g = new T.Group(), v = this.volcano;
    const [a, b] = S.main, w = b - a, c = (a + b) / 2;
    const top = v ? '#5e5450' : this.P.ground, side = v ? '#3e3634' : '#9a7a58', rock = v ? '#2e2828' : '#8a8478';
    r.box(g, top, c, -.2, 0, w, .4, 4.2, true);
    r.box(g, v ? '#6e625e' : this.P.path, c, -.04, 1.95, w - .2, .1, .3, true);
    r.box(g, side, c, -S.depth / 2 - .2, 0, w - .3, S.depth, 3.8, true);
    for (let i = 0; i < 9; i++) { const x = a + .9 + i * (w - 1.8) / 8, h = 1.2 + ((i * 7) % 5) * .35; const k = r.mesh(g, 'cone24', rock, [x, -S.depth - h / 2 + .1, (i % 3 - 1) * .6], [.75 + (i % 2) * .3, h, .75]); k.rotation.x = Math.PI; }
    if (!v) for (let i = 0; i < 26; i++) r.mesh(g, 'ball', i % 3 ? '#ffffff' : '#ffe27a', [a + .4 + i * (w - .8) / 25, .03, 1.7 + (i % 2) * .25], [.07, .05, .07]);
    for (const [pa, pb, h] of S.plats) {
      const pw = pb - pa, pc = (pa + pb) / 2;
      r.box(g, v ? '#4e4644' : '#b58552', pc, h - .14, 0, pw, .28, 2.4, true);
      r.box(g, v ? '#7a3a2a' : this.P.leaves[1], pc, h - .01, 0, pw - .1, .06, 2.3, true);
      const k = r.mesh(g, 'cone24', rock, [pc, h - .9, 0], [pw * .22, 1.2, .6]); k.rotation.x = Math.PI;
    }
    // Árboles o rocas detrás del piso.
    if (!v) for (const x of [a + 1.2, b - 1.6, c + 2.5]) { r.mesh(g, 'cylinder', '#7d5f40', [x, .7, -1.5], [.14, 1.4, .14]); r.ball(g, this.P.leaves[0], x, 1.75, -1.5, 1.1, .9, 1.0); r.ball(g, this.P.leaves[2], x + .3, 2.05, -1.4, .7, .6, .7); }
    else for (const x of [a + 1, b - 1.4]) { const k = r.mesh(g, 'cone24', '#3a3030', [x, .9, -1.5], [.7, 1.8, .7]); k.rotation.z = .1; }
    r.batch(g); this.root.add(g);
  }
  buildBackdrop() {
    const r = this.r, g = new T.Group(), v = this.volcano;
    // Montañas lejanas y nubes (o humo en el volcán).
    for (let i = 0; i < 9; i++) { const x = -60 + i * 15 + (i % 2) * 4, h = 14 + (i * 5) % 12; r.mesh(g, 'cone24', v ? '#4a3434' : i % 2 ? '#8fb8a8' : '#a6c8b8', [x, -14 + h / 2, -55 - (i % 3) * 8], [9 + (i % 3) * 3, h, 8]); }
    for (let i = 0; i < 10; i++) r.ball(g, v ? '#6a5a5a' : '#ffffff', -40 + i * 9, 10 + (i % 3) * 3.5, -34 - (i % 2) * 6, 4 + (i % 3), 1.4, 2);
    r.batch(g); this.root.add(g);
    // Abajo: mar (isla) o lava (volcán) muy lejos, para que se sienta el vacío.
    const under = new T.Mesh(new T.PlaneGeometry(260, 160), v ? this.mat('#ff6a2a', { transparent: true, opacity: .85 }) : this.e.environment.water);
    this.owned.push(under.geometry); under.rotation.x = -Math.PI / 2; under.position.set(0, -22, -40); this.root.add(under);
    if (v) { const glow = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color: '#ff7a3a', blending: T.AdditiveBlending, transparent: true, depthWrite: false })); this.owned.push(glow.material); glow.scale.set(90, 30, 1); glow.position.set(0, -16, -20); this.root.add(glow); }
  }
  // ---------- Peleadores ----------
  addFighter(p) {
    const r = this.r, root = new T.Group(); this.root.add(root);
    const model = creatureModel(r, p.sp);
    let h = HEIGHT.get(p.sp);
    if (!h) { model.updateMatrixWorld(true); const box = new T.Box3().setFromObject(model); h = Math.max(.3, box.max.y - box.min.y); HEIGHT.set(p.sp, h); }
    const want = 1.55 + Math.min(.45, Math.max(0, (p.weight - 55) / 60));
    model.scale.multiplyScalar(want / h);
    const body = new T.Group(); body.add(model); root.add(body);
    const color = COLORS[p.id % COLORS.length];
    const ring = new T.Mesh(this.own(new T.RingGeometry(.5, .62, 28)), this.mat(color, { transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .04; ring.renderOrder = 4;
    const shadow = r.shadow(this.root, 0, 0, 1.2, .8, .3);
    const bubble = new T.Mesh(this.bubbleGeo, this.mat(color, { transparent: true, opacity: .32, depthWrite: false })); bubble.renderOrder = 8; bubble.visible = false; bubble.position.y = .7; root.add(bubble);
    root.add(ring);
    const v = { root, body, model, ring, shadow, bubble, want, face: p.face, spin: 0, land: 0 };
    this.fighters.set(p.id, v); return v;
  }
  groundBelow(x, y) {
    const S = this.S; let best = null;
    if (x >= S.main[0] && x <= S.main[1] && y >= -.05) best = 0;
    for (const [a, b, h] of S.plats) if (x >= a && x <= b && y >= h - .05 && (best === null || h > best)) best = h;
    return best;
  }
  updateFighter(v, p, dt, t) {
    v.root.visible = !p.out && p.stocks > 0;
    if (!v.root.visible) { v.shadow.visible = false; return; }
    v.root.position.set(p.x, p.y, 0);
    const want = p.face > 0 ? 1.05 : -1.05; v.face += (want - v.face) * Math.min(1, dt * 14);
    v.body.rotation.y = v.face;
    const run = p.state === 'run' ? Math.abs(Math.sin(t * 14 + p.id)) * .1 : 0;
    let lx = 0, sy = 1, sx = 1;
    if (p.move) { const k = Math.sin(Math.min(1, p.t / .2) * Math.PI); lx = p.face * k * (p.move === 'dash' ? .1 : .32); sx = 1 + k * .12; sy = 1 - k * .08; }
    if (p.state === 'hurt') { v.spin += dt * (Math.hypot(p.kx, p.ky) > 14 ? 16 : 6) * (p.kx >= 0 ? -1 : 1); } else v.spin *= Math.pow(.001, dt);
    if (p.ground && v.wasAir) v.land = .14; v.wasAir = !p.ground; v.land = Math.max(0, v.land - dt);
    if (v.land > 0) { sy *= 1 - v.land * 1.6; sx *= 1 + v.land * 1.2; }
    v.body.position.set(lx, run, 0); v.body.rotation.z = v.spin + (p.state === 'run' ? -p.face * .1 : 0) + (!p.ground && p.state !== 'hurt' ? -p.vy * .012 * p.face : 0);
    v.body.scale.set(sx, sy, sx);
    animateCreature(v.model, t, dt);
    v.bubble.visible = p.shielding; if (p.shielding) v.bubble.scale.setScalar(.55 + p.shield * .55);
    v.root.visible = !(p.inv > 0 && Math.floor(t * 12) % 2 === 0);
    v.ring.visible = p.ground;
    const gy = this.groundBelow(p.x, p.y);
    v.shadow.visible = gy !== null && p.y - gy < 6;
    if (v.shadow.visible) { v.shadow.position.set(p.x, gy + .03, 0); const k = Math.max(.35, 1 - (p.y - gy) / 7); v.shadow.scale.set(k * 1.2, k * .8, 1); }
  }
  // ---------- Disparos y efectos ----------
  syncShots(sim) {
    const seen = new Set();
    for (const s of sim.shots) {
      seen.add(s.id); let m = this.shots.get(s.id);
      if (!m) {
        const color = TYPES[s.type]?.color || '#ffffff';
        m = new T.Group(); const ball = new T.Mesh(this.r.geometries.ball, this.mat(color)); ball.scale.setScalar(.22); m.add(ball);
        const glow = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); glow.scale.setScalar(1.1); m.add(glow);
        m.userData.mats = [ball.material, glow.material]; this.root.add(m); this.shots.set(s.id, m);
      }
      m.position.set(s.x, s.y, 0);
    }
    for (const [id, m] of this.shots) if (!seen.has(id)) { m.userData.mats.forEach(x => x.dispose()); m.removeFromParent(); this.shots.delete(id); }
  }
  burst(x, y, color, size = 1, life = .3) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(x, y, .4); s.scale.setScalar(.2); this.root.add(s); this.fx.push({ o: s, t: 0, life, size, kind: 'burst' });
  }
  puff(x, y, size = 1, color = '#ffffff') {
    for (let i = 0; i < 6; i++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: this.glowTex, color, transparent: true, depthWrite: false })), a = i / 6 * Math.PI * 2;
      s.position.set(x, y, .3); this.root.add(s);
      this.fx.push({ o: s, t: 0, life: .5, size, kind: 'puff', vx: Math.cos(a) * 2 * size, vy: Math.sin(a) * 1.4 * size + .6 });
    }
  }
  beam(x, y, color) {
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    const cx = this.cam.x, cy = this.cam.y, ang = Math.atan2(cy - y, cx - x), len = Math.hypot(cx - x, cy - y) + 6;
    m.position.set(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2, -.5); m.rotation.z = ang; m.scale.set(len, 2.4, 1); this.root.add(m);
    this.fx.push({ o: m, t: 0, life: .6, size: 1, kind: 'beam', geo: m.geometry });
  }
  event(ev, sim) {
    const p = sim.f[ev.id];
    if (ev.type === 'hit') { this.burst(ev.x, ev.y, ev.strong ? '#fff2a0' : '#ffffff', ev.strong ? 2.2 : 1.1); if (ev.strong) this.shake = .25; }
    else if (ev.type === 'block') this.burst(ev.x, ev.y, COLORS[ev.id % 4], .9);
    else if (ev.type === 'break') this.puff(p.x, p.y + .7, 1, '#ffd25c');
    else if (ev.type === 'ko') { this.beam(ev.x, ev.y, COLORS[ev.id % 4]); this.burst(ev.x, ev.y, '#ffffff', 5, .5); this.shake = .4; }
    else if (ev.type === 'land' && ev.hard) this.puff(p.x, p.y + .1, .5, '#e8e0d0');
    else if (ev.type === 'jump' && ev.air) this.puff(p.x, p.y, .4, '#ffffff');
    else if (ev.type === 'respawn') this.burst(p.x, p.y + .7, COLORS[ev.id % 4], 2.5, .6);
    else if (ev.type === 'recover') this.puff(p.x, p.y, .5, COLORS[ev.id % 4]);
  }
  stepFx(dt) {
    for (const f of this.fx) {
      f.t += dt; const k = Math.min(1, f.t / f.life);
      if (f.kind === 'burst') { f.o.scale.setScalar(.3 + k * f.size); f.o.material.opacity = 1 - k; }
      else if (f.kind === 'puff') { f.o.position.x += f.vx * dt; f.o.position.y += f.vy * dt; f.o.scale.setScalar(.35 + k * .6 * f.size); f.o.material.opacity = .85 * (1 - k); }
      else if (f.kind === 'beam') { f.o.material.opacity = (1 - k) * .8; f.o.scale.y = 2.4 * (1 - k * .7); }
      if (k >= 1) { f.o.removeFromParent(); f.o.material.dispose(); f.geo?.dispose(); f.done = true; }
    }
    this.fx = this.fx.filter(f => !f.done);
  }
  sync(sim, events, dt, t) {
    this.time = t;
    if (sim) {
      for (const p of sim.f) { const v = this.fighters.get(p.id) || this.addFighter(p); this.updateFighter(v, p, dt, t); }
      this.syncShots(sim);
      for (const ev of events) this.event(ev, sim);
    }
    this.stepFx(dt);
  }
  // Cámara que encuadra a todos los que siguen en pie (con márgenes para la pantalla de daño de abajo).
  frame(dt, aspect, sim) {
    const S = this.S, live = sim ? sim.f.filter(p => !p.out && p.stocks > 0) : [];
    let x0 = S.main[0] + 1.5, x1 = S.main[1] - 1.5, y0 = -1.5, y1 = 5;
    for (const p of live) { x0 = Math.min(x0, p.x - 2); x1 = Math.max(x1, p.x + 2); y0 = Math.min(y0, p.y - 1.6); y1 = Math.max(y1, p.y + 2.4); }
    x0 = Math.max(x0, -S.blast.x); x1 = Math.min(x1, S.blast.x); y0 = Math.max(y0, S.blast.bottom + 2); y1 = Math.min(y1, S.blast.top);
    const w = x1 - x0, h = (y1 - y0) * 1.35, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - (y1 - y0) * .12;
    const d = Math.min(46, Math.max(12.5, Math.max(h / (2 * TAN), w / (2 * TAN * aspect))));
    const k = this.cam.init ? 1 - Math.exp(-dt * 3) : 1; this.cam.init = true;
    this.cam.x += (cx - this.cam.x) * k; this.cam.y += (cy - this.cam.y) * k; this.cam.d += (d - this.cam.d) * k;
    const sh = this.shake > 0 ? this.shake : 0; this.shake = Math.max(0, (this.shake || 0) - dt);
    const jx = sh ? (Math.random() - .5) * sh * .6 : 0, jy = sh ? (Math.random() - .5) * sh * .6 : 0;
    const cam = this.camera; cam.fov = FOV; cam.aspect = aspect; cam.updateProjectionMatrix();
    cam.position.set(this.cam.x + jx, this.cam.y + this.cam.d * .16 + jy, this.cam.d); cam.lookAt(this.cam.x + jx, this.cam.y + jy, 0);
    const e = this.e; if (!e.scene.background?.isColor) e.scene.background = new T.Color();
    const sky = this.volcano ? '#3a2a30' : '#a8d8f0';
    e.scene.background.set(sky); e.scene.fog.color.set(sky); e.scene.fog.near = this.cam.d + 20; e.scene.fog.far = this.cam.d + 110;
    e.lights.update(new T.Vector3(this.cam.x, 0, 0), false, this.volcano ? 18 : 13);
    e.styleOpts = { focusY: .5, tilt: 0, night: 0, bloom: this.volcano ? .55 : .32, lift: .1, grade: this.volcano ? [1.12, .96, .9] : [1.04, 1.01, .97], sat: 1.15 };
    return cam;
  }
  toScreen(x, y) { const v = new T.Vector3(x, y, 0).project(this.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }
  dispose() {
    for (const f of this.fx) { f.o.material?.dispose(); f.geo?.dispose(); }
    for (const m of this.shots.values()) m.userData.mats.forEach(x => x.dispose());
    this.r.release(this.root);
    for (const x of this.owned) x.dispose?.();
  }
}
