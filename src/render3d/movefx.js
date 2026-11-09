// Animaciones 3D de los movimientos: proyectiles, chorros, rayos, relámpagos, lluvias, columnas, olas,
// terremotos, remolinos, anillos psíquicos, sombras, drenajes, mejoras y estados. Todo brilla con el bloom.
// battle.js deja eventos { anim, type, from, to, status } y el motor los convierte en efectos con duración.
import * as T from 'three';
import { TYPE_FX } from '../data/types.js';

const ADD = T.AdditiveBlending;
const rnd = (a = 1) => (Math.random() - .5) * a;
const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
const bell = k => Math.sin(Math.min(1, Math.max(0, k)) * Math.PI);

function canvasTex(draw, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

export class MoveFX {
  constructor(r, parent) {
    this.r = r; this.parent = parent; this.items = []; this.shake = 0;
    this.tex = {
      glow: canvasTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.75)'); gr.addColorStop(.6, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }),
      star: canvasTex((g, s) => { g.translate(s / 2, s / 2); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? s * .12 : s * .48; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * .3); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-s / 2, -s / 2, s, s); }),
      z: canvasTex((g, s) => { g.fillStyle = '#fff'; g.strokeStyle = '#5a5a7a'; g.lineWidth = s * .08; g.font = `900 ${s * .8}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('Z', s / 2, s / 2); g.fillText('Z', s / 2, s / 2); }),
      dot: canvasTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,1)'); gr.addColorStop(.8, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }),
      smoke: canvasTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); })
    };
    this.geo = { sphere: new T.SphereGeometry(1, 16, 12), torus: new T.TorusGeometry(1, .09, 8, 40), cyl: new T.CylinderGeometry(1, 1, 1, 14, 1, true), cone: new T.ConeGeometry(1, 1, 10), rock: new T.IcosahedronGeometry(1, 0), plane: new T.PlaneGeometry(1, 1), octa: new T.OctahedronGeometry(1, 0), box: new T.BoxGeometry(1, 1, 1) };
  }

  // ---------- Piezas ----------
  solid(color, opacity = 1) { return this.mat(color, opacity, T.NormalBlending); }
  // Las piezas del efecto se dibujan encima de las criaturas (sin prueba de profundidad), como en la portátil.
  mat(color, opacity = 1, blending = ADD) { return new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, blending, fog: false }); }
  sprite(fx, color, size, map = this.tex.glow, blending = ADD) {
    const s = new T.Sprite(new T.SpriteMaterial({ map, color, transparent: true, depthWrite: false, depthTest: false, blending, fog: false }));
    s.scale.setScalar(size); s.renderOrder = 6; fx.group.add(s); return s;
  }
  mesh(fx, geo, material) { const m = new T.Mesh(geo, material); m.renderOrder = 5; fx.group.add(m); return m; }
  // Nube de partículas brillantes con velocidad, gravedad y arrastre.
  cloud(fx, n, colors, size, init, { map = this.tex.dot, blending = T.NormalBlending, drag = 0, grav = 0 } = {}) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3), born = new Float32Array(n), life = new Float32Array(n), c = new T.Color();
    for (let i = 0; i < n; i++) { const p = init(i); pos.set([p.x, p.y, p.z], i * 3); vel.set([p.vx || 0, p.vy || 0, p.vz || 0], i * 3); born[i] = p.delay || 0; life[i] = p.life || 99; c.set(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    // PointsMaterial mide en (alto/2)/distancia: se multiplica por 1/tan(fov/2) para que size sea en unidades del mundo.
    const pts = new T.Points(geo, new T.PointsMaterial({ size: size * 3.8, map, vertexColors: true, transparent: true, depthWrite: false, blending, sizeAttenuation: true, fog: false }));
    pts.frustumCulled = false; fx.group.add(pts);
    const cl = { pts, vel, born, n, drag, grav };
    cl.step = (dt, t) => { const p = geo.attributes.position.array; for (let i = 0; i < n; i++) { if (t < born[i] || t > born[i] + life[i]) { p[i * 3 + 1] = -99; continue; } if (p[i * 3 + 1] === -99) { const q = init(i); p[i * 3] = q.x; p[i * 3 + 1] = q.y; p[i * 3 + 2] = q.z; } vel[i * 3 + 1] -= grav * dt; const k = Math.exp(-drag * dt); vel[i * 3] *= k; vel[i * 3 + 1] *= k; vel[i * 3 + 2] *= k; p[i * 3] += vel[i * 3] * dt; p[i * 3 + 1] += vel[i * 3 + 1] * dt; p[i * 3 + 2] += vel[i * 3 + 2] * dt; } geo.attributes.position.needsUpdate = true; };
    for (let i = 0; i < n; i++) if (born[i] > 0) pos[i * 3 + 1] = -99;
    return cl;
  }
  burst(fx, at, colors, n = 26, speed = 3.2, size = .32, opts = {}) {
    return this.cloud(fx, n, colors, size, () => { const d = new T.Vector3(rnd(2), rnd(2) + .3, rnd(2)).normalize().multiplyScalar(speed * (.4 + Math.random() * .8)); return { x: at.x, y: at.y, z: at.z, vx: d.x, vy: d.y, vz: d.z, delay: opts.delay || 0 }; }, { drag: 3, grav: opts.grav || 0, ...opts });
  }
  // Rayo entre dos puntos: cilindro brillante con núcleo blanco.
  beamMesh(fx, a, b, radius, color) {
    const g = new T.Group(); fx.group.add(g);
    const outer = new T.Mesh(this.geo.cyl, this.mat(color, .75)), core = new T.Mesh(this.geo.cyl, this.mat('#ffffff', .95));
    g.add(outer, core); core.scale.set(radius * .4, 1, radius * .4); outer.scale.set(radius, 1, radius);
    g.position.copy(a).add(b).multiplyScalar(.5); g.lookAt(b); g.rotateX(Math.PI / 2);
    g.userData.len = a.distanceTo(b); g.scale.y = .001; return g;
  }
  boltMesh(fx, a, b, color, segs = 9) {
    const g = new T.Group(); fx.group.add(g);
    let p = a.clone();
    for (let i = 1; i <= segs; i++) {
      const q = a.clone().lerp(b, i / segs); if (i < segs) q.add(new T.Vector3(rnd(.7), 0, rnd(.7)));
      const len = p.distanceTo(q), seg = new T.Mesh(this.geo.box, this.mat(i % 2 ? '#ffffff' : color, 1));
      seg.position.copy(p).add(q).multiplyScalar(.5); seg.lookAt(q); seg.scale.set(.11, .11, len); g.add(seg);
      const glow = new T.Mesh(this.geo.box, this.mat(color, .45)); glow.position.copy(seg.position); glow.quaternion.copy(seg.quaternion); glow.scale.set(.34, .34, len); g.add(glow);
      p = q;
    }
    return g;
  }

  // ---------- Crear efecto ----------
  spawn(ev, ctx) {
    const fx = { group: new T.Group(), t: 0, dur: 1, parts: [], tick: null, shake: 0 };
    this.parent.add(fx.group);
    const C = TYPE_FX[ev.status] || TYPE_FX[ev.type] || TYPE_FX.normal;
    const from = ctx.center(ev.from), to = ctx.center(ev.to), feet = ctx.feet(ev.to), H = ctx.height(ev.to);
    const strong = (ev.power || 0) >= 90 ? 1.35 : 1;
    const impact = (delay = 0, scale = 1) => {
      const flash = this.sprite(fx, C[0], .1); const star = this.sprite(fx, '#ffffff', .1, this.tex.star);
      flash.position.copy(to); star.position.copy(to).add(new T.Vector3(0, 0, .2));
      const cl = this.burst(fx, to, C, Math.round(36 * strong), 3.8 * strong * scale, .34, { delay });
      fx.parts.push((t) => { const k = (t - delay) / .32; const on = k > 0 && k < 1; flash.visible = star.visible = on; if (on) { flash.scale.setScalar(3.2 * scale * strong * bell(k)); star.scale.setScalar(2.2 * scale * strong * bell(k)); star.material.rotation = k * 2; } }, cl);
      fx.shakeAt = delay; fx.shake = .12 * strong * (ev.eff > 1 ? 1.8 : 1);
    };
    const make = this[ev.anim] || this.tackle;
    make.call(this, fx, { ev, C, from, to, feet, H, strong, impact, ctx });
    this.items.push(fx);
    return fx;
  }

  // ---------- Contacto ----------
  tackle(fx, { impact }) { fx.dur = .55; impact(.06); }
  punch(fx, { to, C, impact }) {
    fx.dur = .6; impact(.04, 1.1);
    for (let i = 0; i < 2; i++) { const ring = this.mesh(fx, this.geo.torus, this.mat(C[i % C.length], .9)); ring.position.copy(to); ring.lookAt(this.cam()); fx.parts.push(t => { const k = (t - .05 - i * .08) / .35; ring.visible = k > 0 && k < 1; ring.scale.setScalar(.2 + ease(k) * 1.2); ring.material.opacity = (1 - k) * .9; }); }
  }
  bite(fx, { to, C, impact }) {
    fx.dur = .6; impact(.22);
    for (const s of [1, -1]) {
      const jaw = this.mesh(fx, new T.TorusGeometry(.7, .11, 8, 20, Math.PI), this.solid(C.find(c => c !== '#ffffff') || C[0], 1)); jaw.userData.own = true;
      jaw.position.copy(to); jaw.lookAt(this.cam()); jaw.rotateZ(s > 0 ? 0 : Math.PI);
      for (let i = 0; i < 4; i++) { const tooth = new T.Mesh(this.geo.cone, this.solid('#ffffff', 1)); tooth.scale.set(.09, .26, .09); tooth.position.set(-.5 + i * .33, .62, 0); tooth.rotation.z = Math.PI; jaw.add(tooth); }
      fx.parts.push(t => { const k = ease(t / .22); jaw.position.copy(to).add(new T.Vector3(0, s * (.7 - k * .45), 0)); jaw.visible = t < .34; });
    }
  }
  scratch(fx, { to, C, impact }) {
    fx.dur = .55; impact(.18, .8);
    for (let i = 0; i < 3; i++) {
      const streak = this.mesh(fx, this.geo.box, this.solid(i === 1 ? '#ffffff' : C.find(c => c !== '#ffffff') || C[0], 1)); const glow = this.mesh(fx, this.geo.box, this.mat(C[0], .35));
      const x = (i - 1) * .32;
      for (const m of [streak, glow]) { m.position.copy(to).add(new T.Vector3(x, 0, .3)); m.lookAt(this.cam()); m.rotateZ(-.7); }
      fx.parts.push(t => { const k = (t - i * .05) / .2; streak.visible = glow.visible = k > 0 && t < .45; streak.scale.set(.09, Math.min(1, k) * 1.5, .02); glow.scale.set(.26, Math.min(1, k) * 1.6, .02); streak.material.opacity = 1 - Math.max(0, (t - .3) / .15); });
    }
  }
  slash(fx, { to, C, impact }) {
    fx.dur = .6; impact(.16, .9);
    const arc = this.mesh(fx, new T.TorusGeometry(.9, .06, 8, 32, Math.PI * .9), this.mat('#ffffff', 1)); arc.userData.own = true;
    const glow = this.mesh(fx, new T.TorusGeometry(.9, .2, 8, 32, Math.PI * .9), this.mat(C[0], .45)); glow.userData.own = true;
    for (const m of [arc, glow]) { m.position.copy(to); m.lookAt(this.cam()); }
    fx.parts.push(t => { const k = t / .3; arc.visible = glow.visible = k < 1.3; arc.rotation.z = glow.rotation.z = -1.2 + ease(k) * 2.4; arc.material.opacity = 1 - Math.max(0, k - .7) * 2; });
  }

  // ---------- A distancia ----------
  shot(fx, { from, to, C, impact, ev, strong }) {
    const travel = .42; fx.dur = travel + .55;
    const core = this.sprite(fx, C[0], 1.3 * strong), bright = this.sprite(fx, '#ffffff', .65 * strong);
    const rock = ev.type === 'roca' || ev.type === 'tierra';
    const body = rock ? this.mesh(fx, this.geo.rock, new T.MeshStandardMaterial({ color: C[0], roughness: .8 })) : null; if (body) body.scale.setScalar(.38 * strong);
    const trail = this.cloud(fx, 40, C, .5, i => ({ x: from.x, y: from.y, z: from.z, delay: 9 }), { drag: 4 });
    let n = 0;
    fx.parts.push((t, dt) => {
      const k = Math.min(1, t / travel), p = from.clone().lerp(to, ease(k)); p.y += Math.sin(k * Math.PI) * .7;
      for (const o of [core, bright, body]) if (o) { o.position.copy(p); o.visible = t < travel; }
      if (body) body.rotation.set(t * 9, t * 7, 0);
      if (t < travel) { const arr = trail.pts.geometry.attributes.position.array; const i = n++ % 40; trail.born[i] = 0; arr[i * 3] = p.x + rnd(.15); arr[i * 3 + 1] = p.y + rnd(.15); arr[i * 3 + 2] = p.z + rnd(.15); trail.vel[i * 3 + 1] = ev.type === 'fuego' ? .8 : 0; }
    }, trail);
    impact(travel, 1.1);
    if (ev.type === 'agua' || ev.type === 'veneno') fx.parts.push(this.burst(fx, to, C, 24, 3, .25, { delay: travel, grav: 9 }));
  }
  sting(fx, { from, to, C, impact }) {
    fx.dur = .75;
    for (let i = 0; i < 3; i++) {
      const needle = this.mesh(fx, this.geo.cone, this.solid(i === 1 ? '#ffffff' : C[0], 1)); needle.scale.set(.08, .55, .08);
      const d0 = i * .08;
      fx.parts.push(t => { const k = (t - d0) / .22; needle.visible = k > 0 && k < 1; const p = from.clone().lerp(to, Math.min(1, k)); p.y += (i - 1) * .12; needle.position.copy(p); needle.lookAt(to); needle.rotateX(Math.PI / 2); });
    }
    impact(.24, .7); impact(.32, .6);
  }
  spray(fx, { from, to, C, impact, ev }) {
    fx.dur = 1.0;
    const dir = to.clone().sub(from), dist = dir.length(); dir.normalize();
    const cl = this.cloud(fx, 120, C, ev.type === 'fuego' || ev.type === 'dragon' ? .5 : .38, i => { const sp = dist / .34; return { x: from.x, y: from.y, z: from.z, vx: dir.x * sp + rnd(.9), vy: dir.y * sp + rnd(.9) + (ev.type === 'fuego' ? .5 : 0), vz: dir.z * sp + rnd(.9), delay: i * .006, life: .36 + Math.random() * .06 }; }, { drag: .6 });
    fx.parts.push(cl, t => { cl.pts.material.opacity = t > .75 ? 1 - (t - .75) / .25 : 1; });
    impact(.38, 1);
  }
  drain(fx, { from, to, C, ctx, ev }) {
    fx.dur = 1.1;
    const n = 14, orbs = [];
    for (let i = 0; i < n; i++) { const o = this.sprite(fx, i % 2 ? '#ffffff' : (ev.type === 'hada' ? C[0] : '#7af07a'), .32); orbs.push(o); }
    const halo = this.sprite(fx, '#7af07a', .1); halo.position.copy(from);
    fx.parts.push(t => {
      orbs.forEach((o, i) => { const k = (t - i * .04) / .6; o.visible = k > 0 && k < 1; const p = to.clone().lerp(from, ease(k)); p.y += Math.sin(k * Math.PI) * (.6 + (i % 3) * .2); p.x += Math.sin(k * 9 + i) * .15; o.position.copy(p); });
      halo.scale.setScalar(2.2 * bell((t - .45) / .6));
    });
    const hit = this.burst(fx, to, C, 18, 2.4, .3); fx.parts.push(hit);
  }
  beam(fx, { from, to, C, strong, impact }) {
    fx.dur = 1.05;
    const radius = .24 * strong, beam = this.beamMesh(fx, from, to, radius, C[0]), len = beam.userData.len;
    const glowA = this.sprite(fx, C[0], .1), glowB = this.sprite(fx, '#ffffff', .1); glowA.position.copy(from);
    const sparks = this.cloud(fx, 80, C, .42, () => { const p = from.clone().lerp(to, Math.random()); return { x: p.x, y: p.y, z: p.z, vx: rnd(2), vy: rnd(2) + .6, vz: rnd(2), delay: .08 + Math.random() * .55 }; }, { drag: 2 });
    fx.parts.push(sparks, t => {
      const grow = ease(t / .16), fade = t > .72 ? 1 - (t - .72) / .2 : 1, pulse = 1 + Math.sin(t * 50) * .12;
      beam.scale.set(pulse * fade, len * grow, pulse * fade); beam.position.copy(from).lerp(to, grow * .5);
      beam.visible = fade > 0; glowA.scale.setScalar(2.2 * strong * fade * pulse);
      glowB.position.copy(from).lerp(to, grow); glowB.scale.setScalar(2 * strong * fade);
    });
    impact(.2, 1.2);
  }
  bolt(fx, { to, feet, C, impact, strong }) {
    fx.dur = .85;
    const top = to.clone().add(new T.Vector3(rnd(.4), 6.5, rnd(.4)));
    const bolts = [0, 1, 2].map(i => { const b = this.boltMesh(fx, top.clone().add(new T.Vector3(rnd(1), 0, rnd(1))), to.clone().add(new T.Vector3(rnd(.3), rnd(.3), 0)), C[0], 10); b.visible = false; return b; });
    const flash = this.sprite(fx, '#ffffff', .1); flash.position.copy(to);
    fx.parts.push(t => { bolts.forEach((b, i) => { b.visible = t > i * .06 && t < .42 + i * .06 && ((t * 24 + i) | 0) % 4 !== 3; }); flash.scale.setScalar(4.5 * strong * bell(t / .45)); });
    impact(.05, 1.3);
    fx.parts.push(this.cloud(fx, 26, ['#ffffff', C[0]], .2, () => ({ x: feet.x + rnd(1.6), y: feet.y + .05, z: feet.z + rnd(1.6), vy: 2 + Math.random() * 2, delay: .05 }), { grav: 8 }));
    fx.shake = .2 * strong;
  }
  rain(fx, { to, feet, C, ev }) {
    fx.dur = 1.25;
    const rocky = ['roca', 'tierra', 'dragon'].includes(ev.type), cold = ev.type === 'hielo';
    const n = rocky ? 12 : 30, drops = [];
    for (let i = 0; i < n; i++) {
      const start = new T.Vector3(feet.x + rnd(2.4), feet.y + 3.6 + Math.random() * 1.4, feet.z + rnd(2)), land = new T.Vector3(start.x * .3 + feet.x * .7, feet.y + .1, start.z * .3 + feet.z * .7), d0 = i * (rocky ? .07 : .025);
      const petals = ev.type === 'planta' ? ['#ff9ac8', '#ffffff', '#7ad06a', '#ffd0e8'] : C;
      const o = rocky ? this.mesh(fx, this.geo.rock, ev.type === 'dragon' ? this.mat(C[i % 2], 1) : new T.MeshStandardMaterial({ color: C[i % C.length], roughness: .8 })) : cold ? this.mesh(fx, this.geo.octa, this.solid(C[i % 2], .95)) : this.mesh(fx, this.geo.plane, new T.MeshBasicMaterial({ color: petals[i % petals.length], side: T.DoubleSide, transparent: true, depthWrite: false, depthTest: false }));
      o.scale.setScalar(rocky ? .3 + Math.random() * .2 : cold ? .16 : .3); if (ev.type === 'dragon') { const g = this.sprite(fx, C[0], .1); drops.push({ o: g, start, land, d0, glow: true }); }
      drops.push({ o, start, land, d0 });
    }
    fx.parts.push(t => drops.forEach(d => { const k = (t - d.d0) / .45; d.o.visible = k > 0 && k < 1; if (d.glow) d.o.scale.setScalar(.9); d.o.position.copy(d.start).lerp(d.land, k * k); d.o.rotation.set(t * 6, t * 4, t * 5); }));
    for (let i = 0; i < 4; i++) fx.parts.push(this.burst(fx, feet.clone().add(new T.Vector3(rnd(1.5), .2, rnd(1.2))), C, 12, 2.2, .26, { delay: .3 + i * .15, grav: 6 }));
    if (rocky) fx.shake = .15;
  }
  pillar(fx, { feet, C, H, strong }) {
    fx.dur = 1.0;
    const col = this.mesh(fx, this.geo.cyl, this.mat(C[0], .7)), core = this.mesh(fx, this.geo.cyl, this.mat('#ffffff', .8));
    const ring = this.mesh(fx, this.geo.torus, this.mat(C[1] || C[0], .9)); ring.position.copy(feet).add(new T.Vector3(0, .05, 0)); ring.rotation.x = Math.PI / 2;
    const h = Math.max(2.6, H * 2.2) * strong;
    fx.parts.push(t => {
      const grow = ease(t / .18), fade = t > .62 ? 1 - (t - .62) / .3 : 1, w = (.6 + Math.sin(t * 40) * .05) * strong;
      col.scale.set(w * fade, h * grow, w * fade); col.position.copy(feet).add(new T.Vector3(0, h * grow / 2, 0));
      core.scale.set(w * .45 * fade, h * grow, w * .45 * fade); core.position.copy(col.position);
      ring.scale.setScalar(.4 + ease(t / .4) * 1.4); ring.material.opacity = .9 * (1 - t);
      col.visible = core.visible = fade > 0;
    });
    fx.parts.push(this.cloud(fx, 60, C, .4, () => ({ x: feet.x + rnd(1), y: feet.y + .1, z: feet.z + rnd(1), vx: rnd(1), vy: 3 + Math.random() * 4, vz: rnd(1), delay: Math.random() * .4 }), { drag: 1 }));
    fx.shake = .14 * strong;
  }
  wave(fx, { from, to, feet, C }) {
    fx.dur = 1.3;
    const geo = new T.CylinderGeometry(1.6, 1.6, 4, 24, 1, true, 0, Math.PI), wave = new T.Mesh(geo, this.mat(C[0], .65)); wave.userData.own = true; fx.group.add(wave);
    const crest = new T.Mesh(new T.TorusGeometry(1.6, .14, 6, 24, Math.PI), this.mat('#ffffff', .85)); crest.userData.own = true; fx.group.add(crest);
    const start = new T.Vector3(from.x, feet.y, from.z), end = new T.Vector3(to.x + (to.x - from.x) * .25, feet.y, to.z + (to.z - from.z) * .25), dir = end.clone().sub(start).normalize();
    for (const m of [wave, crest]) { m.lookAt(m.position.clone().add(dir)); }
    fx.parts.push(t => {
      const k = ease(t / 1.0), p = start.clone().lerp(end, k), rise = bell(Math.min(1, t / 1.05));
      wave.position.copy(p).add(new T.Vector3(0, 1.2 * rise - .4, 0)); wave.rotation.set(0, Math.atan2(dir.x, dir.z), Math.PI / 2); wave.scale.set(rise, 1, rise);
      crest.position.copy(wave.position); crest.rotation.copy(wave.rotation); crest.scale.set(rise, rise, rise);
      wave.material.opacity = .65 * (t < 1 ? 1 : 1 - (t - 1) / .3);
    });
    fx.parts.push(this.cloud(fx, 70, ['#ffffff', C[1] || C[0]], .3, () => { const p = start.clone().lerp(end, Math.random()); return { x: p.x + rnd(1), y: feet.y + Math.random() * 2, z: p.z + rnd(1), vy: 1.5 + Math.random() * 2, delay: Math.random() * .9 }; }, { grav: 6 }));
  }
  quake(fx, { feet, C }) {
    fx.dur = 1.2; fx.shake = .32; fx.shakeLong = true;
    for (let i = 0; i < 7; i++) { const crack = this.mesh(fx, this.geo.box, new T.MeshBasicMaterial({ color: '#2a2018', transparent: true, depthWrite: false })); crack.position.copy(feet).add(new T.Vector3(rnd(.6), .03, rnd(.6))); crack.rotation.y = i * .9; crack.scale.set(.06, .02, .1); fx.parts.push(t => { crack.scale.z = .1 + ease(t / .4) * (1.4 + i % 3 * .4); crack.material.opacity = t > .9 ? 1 - (t - .9) / .3 : 1; }); }
    const rocks = [];
    for (let i = 0; i < 10; i++) { const r = this.mesh(fx, this.geo.rock, new T.MeshStandardMaterial({ color: C[i % C.length], roughness: .9 })); r.scale.setScalar(.12 + Math.random() * .14); rocks.push({ r, v: new T.Vector3(rnd(3), 3 + Math.random() * 3, rnd(3)), p: feet.clone().add(new T.Vector3(rnd(1.4), .05, rnd(1.4))), d: Math.random() * .3 }); }
    fx.parts.push((t, dt) => rocks.forEach(o => { if (t < o.d) { o.r.visible = false; return; } o.r.visible = true; o.v.y -= 12 * dt; o.p.addScaledVector(o.v, dt); if (o.p.y < feet.y + .08) { o.p.y = feet.y + .08; o.v.multiplyScalar(.4); o.v.y = Math.abs(o.v.y); } o.r.position.copy(o.p); o.r.rotation.x += dt * 6; }));
    fx.parts.push(this.cloud(fx, 50, ['#d8c8a8', '#a89878'], .7, () => ({ x: feet.x + rnd(2.6), y: feet.y + .2, z: feet.z + rnd(2.2), vx: rnd(1), vy: .8 + Math.random(), vz: rnd(1), delay: Math.random() * .5 }), { drag: 1.5, map: this.tex.smoke, blending: T.NormalBlending }));
  }
  gust(fx, { feet, C, H }) {
    fx.dur = 1.0;
    const n = 80, cl = this.cloud(fx, n, C.length > 1 ? C.slice(1) : C, .28, i => ({ x: feet.x, y: feet.y, z: feet.z, delay: i * .008 }));
    const rings = [0, 1, 2].map(i => { const ring = this.mesh(fx, this.geo.torus, this.mat(C[i % C.length], .5)); ring.rotation.x = Math.PI / 2; return ring; });
    fx.parts.push(t => {
      const arr = cl.pts.geometry.attributes.position.array;
      for (let i = 0; i < n; i++) { const life = t - i * .008; if (life < 0) continue; const a = life * 12 + i, h = life * 2.6 * (1 + (i % 4) * .2), r = .5 + h * .35; arr[i * 3] = feet.x + Math.cos(a) * r; arr[i * 3 + 1] = feet.y + h; arr[i * 3 + 2] = feet.z + Math.sin(a) * r; }
      cl.pts.geometry.attributes.position.needsUpdate = true; cl.pts.material.opacity = t > .75 ? 1 - (t - .75) / .25 : 1;
      rings.forEach((r, i) => { r.position.copy(feet).add(new T.Vector3(0, .3 + i * H * .45, 0)); r.scale.setScalar((.7 + i * .25) * (1 + Math.sin(t * 20 + i) * .08)); r.rotation.z = t * 10; r.material.opacity = .5 * bell(t); });
    });
  }
  rings(fx, { to, C, ctx, ev }) {
    fx.dur = .95;
    for (let i = 0; i < 4; i++) { const ring = this.mesh(fx, this.geo.torus, this.mat(C[i % C.length], 1)); const halo = this.mesh(fx, this.geo.torus, this.mat(C[0], .35)); for (const m of [ring, halo]) { m.position.copy(to); m.lookAt(this.cam()); } fx.parts.push(t => { const k = (t - i * .12) / .45; ring.visible = halo.visible = k > 0 && k < 1; const sc = .3 + ease(k) * 1.8; ring.scale.setScalar(sc); halo.scale.set(sc, sc, 3); ring.material.opacity = 1 - k; halo.material.opacity = .35 * (1 - k); }); }
    const glow = this.sprite(fx, C[0], .1); glow.position.copy(to); fx.parts.push(t => glow.scale.setScalar(2.6 * bell(t / .9)));
    fx.wobble = ev.to;
  }
  roar(fx, { from, to, C }) {
    fx.dur = .8;
    for (let i = 0; i < 4; i++) { const ring = this.mesh(fx, this.geo.torus, this.mat(C[i % C.length], .85)); fx.parts.push(t => { const k = (t - i * .1) / .45; ring.visible = k > 0 && k < 1; const p = from.clone().lerp(to, ease(k)); ring.position.copy(p); ring.lookAt(to); ring.scale.setScalar(.3 + k * 1.2); ring.material.opacity = .85 * (1 - k * .8); }); }
    fx.shake = .05;
  }
  shadow(fx, { to, C }) {
    fx.dur = 1.0;
    fx.parts.push(this.cloud(fx, 46, ['#2a2236', '#3a2c48', '#1a1622'], 1.1, () => { const a = Math.random() * Math.PI * 2; return { x: to.x + Math.cos(a) * 1.4, y: to.y + rnd(1.2), z: to.z + Math.sin(a) * 1.4, vx: -Math.cos(a) * 1.6, vy: rnd(.4), vz: -Math.sin(a) * 1.6, delay: Math.random() * .3 }; }, { drag: 2, map: this.tex.smoke, blending: T.NormalBlending }));
    for (const s of [-1, 1]) { const eye = this.sprite(fx, '#ff4a6a', .1); eye.position.copy(to).add(new T.Vector3(s * .22, .5, .4)); fx.parts.push(t => eye.scale.setScalar(.35 * bell((t - .25) / .6))); }
    const claw = this.sprite(fx, C[0], .1, this.tex.star); claw.position.copy(to); fx.parts.push(t => claw.scale.setScalar(2.2 * bell((t - .45) / .35)));
    fx.shakeAt = .5; fx.shake = .1;
  }
  dragon(fx, { from, to, C, impact }) {
    fx.dur = 1.15;
    const n = 70, cl = this.cloud(fx, n, C, .42, i => ({ x: from.x, y: from.y, z: from.z, delay: i * .01 }));
    const head = this.sprite(fx, C[0], 1.4); const headCore = this.sprite(fx, '#ffffff', .6);
    fx.parts.push(t => {
      const arr = cl.pts.geometry.attributes.position.array, dir = to.clone().sub(from), side = new T.Vector3(-dir.z, 0, dir.x).normalize();
      for (let i = 0; i < n; i++) { const k = Math.min(1, Math.max(0, (t - i * .006) / .55)); const p = from.clone().lerp(to, ease(k)); p.addScaledVector(side, Math.sin(k * 10 - i * .1) * .5 * (1 - k)); p.y += Math.cos(k * 8) * .35 * (1 - k); arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; }
      cl.pts.geometry.attributes.position.needsUpdate = true;
      const k = Math.min(1, t / .55); head.position.copy(from).lerp(to, ease(k)); headCore.position.copy(head.position); head.visible = headCore.visible = t < .58; cl.pts.material.opacity = t > .8 ? 1 - (t - .8) / .35 : 1;
    });
    impact(.55, 1.3);
  }

  // ---------- Mejoras, curación y estados ----------
  buff(fx, { to, feet, C, H, ev }) {
    fx.dur = .9;
    const down = ev.anim === 'debuff';
    for (let i = 0; i < 6; i++) {
      const arrow = this.mesh(fx, this.geo.cone, this.solid(down ? '#3a7ad8' : (C[0] === '#ffffff' ? '#ff8a2a' : C[0]), .95)); arrow.scale.set(.2, .42, .2); if (down) arrow.rotation.z = Math.PI;
      const a = i / 6 * Math.PI * 2, x = Math.cos(a) * .7, z = Math.sin(a) * .5, d0 = i * .05;
      fx.parts.push(t => { const k = (t - d0) / .6; arrow.visible = k > 0 && k < 1; arrow.position.set(feet.x + x, feet.y + (down ? H * 1.4 - k * H * 1.2 : .2 + k * H * 1.3), feet.z + z); arrow.material.opacity = .9 * bell(k); });
    }
    const aura = this.sprite(fx, down ? '#6ab0ff' : '#ffd060', .1); aura.position.copy(to); fx.parts.push(t => aura.scale.setScalar(2.4 * bell(t / .8)));
  }
  debuff(fx, o) { this.buff(fx, o); }
  heal(fx, { to, feet, H }) {
    fx.dur = 1.0;
    fx.parts.push(this.cloud(fx, 40, ['#8af08a', '#ffffff', '#c8ffb0'], .3, () => ({ x: feet.x + rnd(1.4), y: feet.y + Math.random() * .4, z: feet.z + rnd(1.2), vy: 1.5 + Math.random() * 1.5, delay: Math.random() * .4 })));
    for (let i = 0; i < 3; i++) { const plus = new T.Group(); fx.group.add(plus); for (const [w, h] of [[.44, .13], [.13, .44]]) { const b = new T.Mesh(this.geo.box, this.solid('#3ac85a', .95)); b.scale.set(w, h, .05); plus.add(b); } const x = (i - 1) * .55, d0 = i * .12; fx.parts.push(t => { const k = (t - d0) / .7; plus.visible = k > 0 && k < 1; plus.position.set(feet.x + x, feet.y + .4 + k * H * 1.2, feet.z + .3); plus.lookAt(this.cam()); plus.children.forEach(c => { c.material.opacity = .95 * bell(k); }); }); }
    const ring = this.mesh(fx, this.geo.torus, this.mat('#8af08a', .8)); ring.position.copy(feet).add(new T.Vector3(0, .05, 0)); ring.rotation.x = Math.PI / 2; fx.parts.push(t => { ring.scale.setScalar(.5 + ease(t / .6) * 1.1); ring.material.opacity = .8 * (1 - t); });
  }
  shield(fx, { to, C, H }) {
    fx.dur = .9;
    const dome = this.mesh(fx, this.geo.sphere, this.mat(C[0] === '#ffffff' ? '#9ad8ff' : C[0], .28)); const rim = this.mesh(fx, this.geo.torus, this.mat('#ffffff', .8));
    dome.position.copy(to); rim.position.copy(to); rim.lookAt(this.cam());
    fx.parts.push(t => { const s = Math.max(.6, H * .9) * (t < .2 ? ease(t / .2) * 1.15 : 1.15 - Math.min(.15, (t - .2))); dome.scale.setScalar(s); rim.scale.setScalar(s); const fade = t > .7 ? 1 - (t - .7) / .2 : 1; dome.material.opacity = .28 * fade; rim.material.opacity = .8 * fade; });
  }
  powder(fx, { to, feet, C, H }) {
    fx.dur = 1.05;
    fx.parts.push(this.cloud(fx, 80, C, .3, () => ({ x: to.x + rnd(2), y: to.y + H * .9 + Math.random() * .8, z: to.z + rnd(1.6), vx: rnd(.6), vy: -1 - Math.random(), vz: rnd(.6), delay: Math.random() * .5 })));
    fx.parts.push(this.cloud(fx, 18, C, .9, () => ({ x: to.x + rnd(1.6), y: to.y + rnd(.8), z: to.z + rnd(1.4), vx: rnd(.4), vy: rnd(.3), delay: .2 + Math.random() * .3 }), { map: this.tex.smoke, drag: 1 }));
  }
  sparkle(fx, { to, C, impact }) {
    fx.dur = .95;
    const stars = [];
    for (let i = 0; i < 12; i++) { const s = this.sprite(fx, C[i % C.length], .1, this.tex.star); const a = Math.random() * Math.PI * 2, r = .5 + Math.random() * 1; stars.push({ s, p: to.clone().add(new T.Vector3(Math.cos(a) * r, rnd(1.4), Math.sin(a) * r * .6)), d: Math.random() * .4 }); }
    fx.parts.push(t => stars.forEach(o => { const k = (t - o.d) / .4; o.s.visible = k > 0 && k < 1; o.s.position.copy(o.p); o.s.scale.setScalar(.6 * bell(k)); o.s.material.rotation = t * 4; }));
    impact(.45, .9);
  }
  status(fx, { to, feet, C, H, ev }) {
    const id = ev.status; fx.dur = .9;
    if (id === 'dor') {
      for (let i = 0; i < 3; i++) { const z = this.sprite(fx, '#ffffff', .1, this.tex.z, T.NormalBlending); const d0 = i * .2; fx.parts.push(t => { const k = (t - d0) / .6; z.visible = k > 0 && k < 1; z.position.copy(to).add(new T.Vector3(.4 + k * .5, H * .5 + k * .9, .2)); z.scale.setScalar((.25 + i * .08) * bell(k) + .05); }); }
    } else if (id === 'conf') {
      const stars = [0, 1, 2].map(() => this.sprite(fx, '#ffe060', .3, this.tex.star));
      fx.parts.push(t => stars.forEach((s, i) => { const a = t * 9 + i * Math.PI * 2 / 3; s.position.copy(to).add(new T.Vector3(Math.cos(a) * .6, H * .55, Math.sin(a) * .45)); s.material.rotation = t * 5; s.visible = t < .85; }));
    } else if (id === 'par') {
      for (let i = 0; i < 4; i++) { const b = this.boltMesh(fx, to.clone().add(new T.Vector3(rnd(1.2), rnd(1.2), .3)), to.clone().add(new T.Vector3(rnd(1.2), rnd(1.2), .3)), '#ffe040', 4); fx.parts.push(t => { b.visible = ((t * 24 + i) | 0) % 2 === 0 && t < .7; }); }
    } else if (id === 'con') {
      for (let i = 0; i < 8; i++) { const c = this.mesh(fx, this.geo.octa, this.mat(i % 2 ? '#ffffff' : '#9ae4ff', .9)); const a = i / 8 * Math.PI * 2; fx.parts.push(t => { const k = Math.min(1, t / .3); c.position.copy(to).add(new T.Vector3(Math.cos(a) * .7, Math.sin(a) * .7, .3)); c.scale.set(.1 * k, .28 * k, .1 * k); c.visible = t < .75; }); }
      fx.parts.push(this.burst(fx, to, C, 20, 2.6, .26, { delay: .7, grav: 6 }));
    } else {
      // que: llamitas; ven: burbujas moradas
      fx.parts.push(this.cloud(fx, 40, C, id === 'ven' ? .34 : .3, () => ({ x: feet.x + rnd(1.2), y: feet.y + Math.random() * H, z: feet.z + rnd(1), vx: rnd(.3), vy: 1 + Math.random() * 1.5, delay: Math.random() * .4 })));
    }
  }

  // ---------- Bucle ----------
  cam() { return this.camera ? this.camera.position : new T.Vector3(0, 4, 12); }
  update(dt, camera) {
    this.camera = camera; let shake = 0;
    for (const fx of this.items) {
      let step = dt;
      if (this.hold !== undefined && fx.t + dt > this.hold) { step = Math.max(0, this.hold - fx.t); }   // hold: congelar para capturas
      fx.t += step;
      for (const p of fx.parts) { if (typeof p === 'function') p(fx.t, step); else p.step(step, fx.t); }
      const since = fx.t - (fx.shakeAt || 0);
      if (fx.shake && since > 0 && since < (fx.shakeLong ? .9 : .3)) shake = Math.max(shake, fx.shake * (1 - since / (fx.shakeLong ? .9 : .3)));
    }
    for (const fx of this.items.filter(f => f.t >= f.dur)) this.drop(fx);
    this.items = this.items.filter(f => f.t < f.dur);
    return shake;
  }
  wobbleTargets() { return this.items.filter(f => f.wobble && f.t < f.dur).map(f => f.wobble); }
  drop(fx) {
    fx.group.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } if (o.geometry && (o.isPoints || o.userData.own)) o.geometry.dispose(); });
    fx.group.removeFromParent();
  }
  clear() { this.items.forEach(fx => this.drop(fx)); this.items = []; }
  dispose() { this.clear(); Object.values(this.tex).forEach(t => t.dispose()); Object.values(this.geo).forEach(g => g.dispose()); }
}
