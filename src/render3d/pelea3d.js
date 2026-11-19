// Pelea Puchamon en 3D: escenario flotante visto de lado con cielo de degradado, sol, nubes que pasan, islas
// lejanas, cascada y mar de nubes (o lava, humo y brasas en el volcán). Tus Puchamon pelean con poses: respiran,
// corren levantando polvo, saltan con voltereta, cargan el golpe brillando, pegan con estelas del color de su tipo,
// tiemblan con el impacto, salen girando con humo y se cuelgan del borde. Poderes por tipo con partículas,
// impactos de los combates de la aventura, escudo de burbuja, esquivas y salidas con destello.
import * as T from 'three';
import { creatureModel, animateCreature } from './creatures3d.js';
import { BIOMES } from './environment.js';
import { MoveFX } from './movefx.js';
import { TYPE_FX } from '../data/types.js';
import { STAGES, MOVES } from '../games/pelea/sim.js';

export const COLORS = ['#3f7fe8', '#e8484e', '#3fbf6a', '#f2b62c'];
const HEIGHT = new Map();
const FOV = 32, TAN = Math.tan(FOV * Math.PI / 360);
const rnd = (a = 1) => (Math.random() - .5) * a;
const pick = list => list[Math.floor(Math.random() * list.length)];
const fxColors = type => TYPE_FX[type] || TYPE_FX.normal;
// Impacto de los combates de la aventura según el tipo del que pega (sólo los de contacto).
const HIT_ANIM = { normal: 'punch', fuego: 'punch', agua: 'punch', planta: 'slash', electrico: 'punch', hielo: 'scratch', lucha: 'punch', veneno: 'bite', tierra: 'punch', volador: 'scratch', psiquico: 'rings', bicho: 'scratch', roca: 'punch', fantasma: 'shadow', dragon: 'slash', siniestro: 'bite', acero: 'slash', hada: 'sparkle' };
// Estela de cada golpe: ángulo del centro y largo del arco (mirando a la derecha).
// Poder de cada tipo (abajo + B): animación de los combates de la aventura alrededor del que lo lanza.
const POWER_ANIM = { normal: 'quake', fuego: 'pillar', agua: 'wave', planta: 'powder', electrico: 'bolt', hielo: 'pillar', lucha: 'quake', veneno: 'powder', tierra: 'quake', volador: 'gust', psiquico: 'rings', bicho: 'powder', roca: 'quake', fantasma: 'shadow', dragon: 'pillar', siniestro: 'shadow', acero: 'quake', hada: 'sparkle' };
const ARC = { jab: [0, 1.5], side: [.3, 2.3], up: [Math.PI / 2, 2.7], down: [-Math.PI / 2, 3.8], air: [0, Math.PI * 2], dash: [0, 1.3], recover: [Math.PI / 2, 4.6] };
const REACH = { jab: .3, side: .55, up: .1, down: .3, air: .15, dash: .25, recover: 0, power: 0 };

function canvasTex(draw, w = 64, h = w) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
function radial(g, x, y, r, stops) { const gr = g.createRadialGradient(x, y, 0, x, y, r); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }

// Partículas en un solo dibujo, cada una con color, transparencia y tamaño propios (tamaño en unidades del mundo).
const PV = 'uniform float scale; attribute float size; attribute vec4 rgba; varying vec4 vC; void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * scale / max(.5, -mv.z); gl_Position = projectionMatrix * mv; }';
const PF = 'uniform sampler2D map; varying vec4 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); if (gl_FragColor.a < .004) discard;\n#include <colorspace_fragment>\n}';
class Particles {
  constructor(view, map, n, { add = true, gravity = 0, drag = 2.2, smoke = false } = {}) {
    Object.assign(this, { n, i: 0, g: gravity, drag, smoke });
    this.pos = new Float32Array(n * 3); this.rgba = new Float32Array(n * 4); this.size = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n).fill(1);
    this.s0 = new Float32Array(n); this.s1 = new Float32Array(n); this.a0 = new Float32Array(n);
    for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -999;
    const geo = new T.BufferGeometry();
    for (const [k, arr, w] of [['position', this.pos, 3], ['rgba', this.rgba, 4], ['size', this.size, 1]]) geo.setAttribute(k, new T.BufferAttribute(arr, w).setUsage(T.DynamicDrawUsage));
    this.mat = new T.ShaderMaterial({ uniforms: { map: { value: map }, scale: view.pointScale }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending });
    this.pts = new T.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = add ? 9 : 8;
    view.root.add(this.pts); this.c = new T.Color();
  }
  emit(x, y, z, vx, vy, vz, life, color, s0, s1 = s0, a = 1) {
    const i = this.i++ % this.n, j = i * 3, q = i * 4;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z; this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.life[i] = this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a; this.size[i] = s0;
    this.c.set(color); this.rgba[q] = this.c.r; this.rgba[q + 1] = this.c.g; this.rgba[q + 2] = this.c.b; this.rgba[q + 3] = this.smoke ? 0 : a;
  }
  step(dt) {
    const p = this.pos, v = this.vel, k = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; const j = i * 3;
      if (this.life[i] <= 0) { p[j + 1] = -999; this.rgba[i * 4 + 3] = 0; continue; }
      v[j + 1] -= this.g * dt; v[j] *= k; v[j + 1] *= k; v[j + 2] *= k;
      p[j] += v[j] * dt; p[j + 1] += v[j + 1] * dt; p[j + 2] += v[j + 2] * dt;
      const q = 1 - this.life[i] / this.max[i];
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * q;
      this.rgba[i * 4 + 3] = this.a0[i] * (this.smoke ? Math.min(1, q * 7) * (1 - q) : 1 - q * q);
    }
    const a = this.pts.geometry.attributes; a.position.needsUpdate = a.rgba.needsUpdate = a.size.needsUpdate = true;
  }
  dispose() { this.pts.geometry.dispose(); this.mat.dispose(); }
}

export class PeleaView {
  constructor(engine, { stage = 'isla' } = {}) {
    this.e = engine; this.r = engine.r; this.stageId = STAGES[stage] ? stage : 'isla'; this.S = STAGES[this.stageId];
    this.P = BIOMES[this.S.biome] || BIOMES.meadow; this.volcano = this.S.biome === 'volcano';
    this.root = new T.Group(); this.root.name = 'pelea'; engine.scene.add(this.root);
    this.camera = new T.PerspectiveCamera(FOV, 1, .5, 500);
    this.cam = { x: 0, y: 2, d: 20 }; this.fighters = new Map(); this.shots = new Map(); this.fx = []; this.owned = []; this.anim = []; this.arcGeo = {}; this.timers = [];
    this.time = 0; this.shake = 0; this.punch = 0; this.flash = 0; this.ending = null; this.sim = null; this.pointScale = { value: 600 };
    const tx = (draw, w, h) => this.own(canvasTex(draw, w, h));
    this.tex = {
      glow: tx((g, s) => radial(g, s / 2, s / 2, s / 2, [[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.8)'], [.55, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']])),
      smoke: tx((g, s) => { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; radial(g, s / 2 + Math.cos(a) * s * .15, s / 2 + Math.sin(a) * s * .15, s * .3, [[0, 'rgba(255,255,255,.6)'], [.6, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); } radial(g, s / 2, s / 2, s * .32, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]); }),
      star: tx((g, s) => { radial(g, s / 2, s / 2, s * .24, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]); g.translate(s / 2, s / 2); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? s * .07 : s * .48; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }),
      ring: tx((g, s) => { g.shadowColor = '#fff'; g.shadowBlur = s * .08; g.strokeStyle = '#fff'; g.lineWidth = s * .07; g.beginPath(); g.arc(s / 2, s / 2, s * .4, 0, Math.PI * 2); g.stroke(); }),
      cloud: tx((g, w, h) => {
        for (let i = 0; i < 18; i++) { const x = w * (.14 + Math.random() * .72), y = h * (.5 + Math.random() * .16) - Math.sin(x / w * Math.PI) * h * .14, rr = h * (.15 + Math.random() * .17); radial(g, x, y, rr, [[0, 'rgba(255,255,255,.95)'], [.55, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]); }
        g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, h * .25, 0, h * .8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c6d6ea'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }, 256, 128)
    };
    this.sparks = new Particles(this, this.tex.glow, 900, { gravity: 5, drag: 2.6 });
    this.twinkles = new Particles(this, this.tex.star, 220, { gravity: 1.2, drag: 1.4 });
    this.smoke = new Particles(this, this.tex.smoke, 380, { add: false, gravity: -.9, drag: 1.8, smoke: true });
    this.movefx = new MoveFX(this.r, this.root);
    this.ringGeo = this.own(new T.RingGeometry(.56, .72, 40)); this.bubbleGeo = this.own(new T.SphereGeometry(1, 32, 20));
    this.buildSky();
    if (this.volcano) this.buildVolcan(); else this.buildIsla();
    this.buildBackdrop();
    const fill = engine.lights?.fill; if (fill) this.fillSave = { c: fill.color.clone(), i: fill.intensity, p: fill.position.clone() };
  }
  own(x) { this.owned.push(x); return x; }
  mat(color, opts = {}) { return this.own(new T.MeshBasicMaterial({ color, ...opts })); }
  glowMat(color, i = 1.2) { return this.r.mat(color, { emissive: color, emissiveIntensity: i }); }
  // Brillo plano que siempre mira a la cámara (los de efectos de un momento no se guardan: se botan al terminar).
  sprite(color, size, map = this.tex.glow, keep = true) {
    const m = new T.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const s = new T.Sprite(keep ? this.own(m) : m); s.scale.setScalar(size); return s;
  }
  // ---------- Cielo ----------
  buildSky() {
    const v = this.volcano;
    this.skyColors = v ? { top: '#1c0f1c', mid: '#6e2c2a', low: '#ff8a3c', fog: '#5a2626' } : { top: '#3b7fd8', mid: '#a9d8f6', low: '#fdf1da', fog: '#bfe2f6' };
    const u = { top: { value: new T.Color(this.skyColors.top) }, mid: { value: new T.Color(this.skyColors.mid) }, low: { value: new T.Color(this.skyColors.low) }, sunC: { value: new T.Color(v ? '#ff6a24' : '#fff2c4') }, sun: { value: new T.Vector3(v ? -.1 : .45, v ? -.02 : .32, -1).normalize() } };
    const m = this.own(new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, depthTest: false, uniforms: u,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top, mid, low, sunC, sun; varying vec3 vP;
        void main(){ vec3 d = normalize(vP); float h = d.y; vec3 c = h > 0. ? mix(mid, top, smoothstep(0., .6, h)) : mix(mid, low, smoothstep(0., -.3, h));
          float s = max(0., dot(d, sun)); c += sunC * (pow(s, 90.) * 1.4 + pow(s, 8.) * .28);
          gl_FragColor = vec4(c, 1.);
          #include <colorspace_fragment>
        }`.replace(/ {10}#include/, '#include') }));
    this.sky = new T.Mesh(this.own(new T.SphereGeometry(10, 32, 16)), m); this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.root.add(this.sky);
  }
  // ---------- Isla Flotante ----------
  buildIsla() {
    const r = this.r, S = this.S, P = this.P, g = new T.Group(), env = this.e.environment;
    const [a, b] = S.main, w = b - a, c = (a + b) / 2;
    const rock = ['#a98d70', '#8f765f', '#786350'], stone = ['#ece2cb', '#dcd0b4'];
    // Pasto de arriba (con manchas más claras), un borde más oscuro y un ribete de piedra tallada al frente.
    r.box(g, P.ground, c, -.2, 0, w, .4, 4.6, true);
    for (let i = 0; i < 16; i++) r.mesh(g, 'cylinder', i % 3 ? '#a6d27c' : '#8cbf66', [a + .9 + (i * 3.73) % (w - 1.8), .003, rnd(3.4)], [.5 + (i % 4) * .22, .008, .3 + (i % 3) * .14]);
    r.box(g, P.tall, c, -.36, 0, w + .2, .22, 4.8, true);
    const n = 14, bw = (w - .9) / n;
    for (let i = 0; i < n; i++) r.box(g, stone[i % 2], a + .45 + bw * (i + .5), -.62, 2.28, bw - .07, .36, .32, true);
    // Capas de roca que se van angostando hacia abajo, con piedras incrustadas, musgo y picos colgando.
    r.box(g, rock[0], c, -1.1, 0, w - .1, .96, 4.3, true);
    r.box(g, rock[1], c, -1.9, -.08, w - 1.3, .72, 3.6, true);
    r.box(g, rock[2], c, -2.42, -.16, w - 2.9, .44, 2.9, true);
    for (let i = 0; i < 12; i++) { const x = a + .8 + (i * 5.37) % (w - 1.6), k = i % 3, s = .22 + (i % 4) * .07; r.ball(g, k ? '#9a8068' : '#bba58a', x, [-1, -1.85, -2.42][k], [2.08, 1.74, 1.3][k], s * 1.4, s, s * .6); }
    for (let i = 0; i < 10; i++) { const x = a + 1 + i * (w - 2) / 9; r.ball(g, P.leaves[i % 3], x, -.82, 2.14, .45 + (i % 3) * .16, .2, .26); }
    for (let i = 0; i < 9; i++) { const x = a + 2 + i * (w - 4) / 8, h = 1 + ((i * 7) % 5) * .32; const k = r.mesh(g, 'cone24', rock[i % 3], [x, -2.6 - h / 2 + .12, rnd(.8)], [.5 + (i % 3) * .2, h, .5]); k.rotation.x = Math.PI; }
    // Bejucos que cuelgan del ribete.
    for (let i = 0; i < 11; i++) { const x = a + .8 + i * (w - 1.6) / 10 + rnd(.4), len = .5 + (i * 3 % 5) * .28; r.mesh(g, 'cylinder', '#4e8a3c', [x, -.8 - len / 2, 2.42], [.035, len, .035]); r.ball(g, P.leaves[i % 3], x, -.8 - len, 2.44, .13, .11, .09); r.ball(g, P.leaves[(i + 1) % 3], x + .06, -.8 - len * .55, 2.45, .09, .08, .07); }
    // Plataformas: losas de piedra clara con pasto encima y un cristal brillante debajo.
    for (const [pa, pb, h] of S.plats) {
      const pw = pb - pa, pc = (pa + pb) / 2;
      r.box(g, stone[0], pc, h - .18, 0, pw, .34, 2.6, true);
      r.box(g, P.ground, pc, h - .02, 0, pw - .1, .05, 2.5, true);
      r.box(g, '#c2b394', pc, h - .43, 0, pw - .5, .2, 2.1, true);
      const k = r.mesh(g, 'cone24', '#a8977a', [pc, h - 1.03, 0], [pw * .17, 1.05, .45]); k.rotation.x = Math.PI;
      r.mesh(g, 'octa', this.glowMat('#8fe8ff', 1.1), [pc, h - 1.72, 0], [.15, .26, .15]);
      for (const s of [-1, 1]) r.ball(g, '#f2d47c', pc + s * (pw / 2 - .16), h - .18, 1.31, .11, .11, .05);
    }
    // Atrás: árboles, arbustos y dos columnas con cristales que brillan.
    for (const [x, s] of [[a + 1.1, 1], [b - 1.5, 1.12], [c + 3.1, .82]]) {
      r.mesh(g, 'cylinder', '#7a5c3e', [x, .85 * s, -1.75], [.15 * s, 1.7 * s, .15 * s]);
      r.ball(g, P.leaves[0], x, 2 * s, -1.75, 1.15 * s, .95 * s, 1.05 * s); r.ball(g, P.leaves[2], x + .38 * s, 2.35 * s, -1.6, .72 * s, .6 * s, .66 * s); r.ball(g, P.leaves[1], x - .42 * s, 2.18 * s, -1.85, .7 * s, .56 * s, .64 * s);
    }
    for (let i = 0; i < 12; i++) { const x = a + .6 + i * (w - 1.2) / 11; r.ball(g, P.leaves[i % 3], x, .18, -2.05 + (i % 2) * .15, .5 + (i % 3) * .12, .36, .4); }
    for (const x of [a + 3.3, b - 3.7]) { r.box(g, stone[1], x, .95, -2, .55, 1.9, .55, true); r.box(g, stone[0], x, 1.94, -2, .78, .14, .78, true); r.box(g, stone[0], x, .06, -2, .78, .14, .78, true); }
    // Arroyito arriba que se vuelve cascada por detrás.
    const fx = b - 1.6;
    r.box(g, this.glowMat('#8fd4f4', .25), fx, .01, -1.9, 1.1, .04, .9, false);
    r.batch(g); this.root.add(g);
    for (const x of [a + 3.3, b - 3.7]) {
      const cr = new T.Mesh(this.r.geometries.octa, this.glowMat('#9ff0ff', 1.3)); cr.position.set(x, 2.35, -2); cr.scale.set(.2, .34, .2); this.root.add(cr);
      const gl = this.sprite('#7fe8ff', 1.4); gl.position.set(x, 2.35, -1.9); this.root.add(gl);
      this.anim.push(t => { cr.rotation.y = t * 1.3; cr.position.y = 2.35 + Math.sin(t * 2 + x) * .07; gl.material.opacity = .65 + Math.sin(t * 3 + x) * .2; });
    }
    this.waterfall(fx, -2.5);
    // Pasto que se mueve con el viento al frente (bajito, para no tapar los pies) y atrás, con flores.
    if (env?.blade && env.windMat) {
      const dummy = new T.Object3D(), front = [], back = [];
      for (let i = 0; i < 90; i++) front.push([a + .2 + Math.random() * (w - .4), 1.75 + Math.random() * .5, .4 + Math.random() * .35]);
      for (let i = 0; i < 90; i++) back.push([a + .2 + Math.random() * (w - .4), -1.35 - Math.random() * .85, .6 + Math.random() * .5]);
      const list = front.concat(back), m = new T.InstancedMesh(env.blade, env.windMat('#a4d672', true), list.length);
      list.forEach(([x, z, s], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, Math.random() * 3, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
      m.receiveShadow = true; this.root.add(m);
      const fl = new T.InstancedMesh(this.r.geometries.ball, this.r.mat('#ffffff', { roughness: .5 }), 46), cols = ['#ffffff', '#ffe27a', '#f7a8c4', '#c9b6ff'].map(x => new T.Color(x));
      for (let i = 0; i < 46; i++) { dummy.position.set(a + .4 + Math.random() * (w - .8), .07, (i % 2 ? 1 : -1) * (1.5 + Math.random() * .7)); dummy.scale.set(.08, .06, .08); dummy.updateMatrix(); fl.setMatrixAt(i, dummy.matrix); fl.setColorAt(i, cols[i % 4]); }
      this.root.add(fl);
    }
  }
  // Cascada que cae del borde de atrás: franjas que bajan y bruma donde llega al mar de nubes.
  waterfall(x, z) {
    const m = this.own(new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { time: this.e.time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float time; varying vec2 vUv; void main(){ float s = sin(vUv.x * 37. + sin(vUv.y * 5.) * 2.) * .5 + .5; float f = fract(vUv.y * 4. + time * 1.4 + s * .35); float edge = smoothstep(0., .12, vUv.x) * smoothstep(1., .88, vUv.x); float a = (.5 + .4 * smoothstep(.55, 1., f)) * edge * smoothstep(0., .3, vUv.y); gl_FragColor = vec4(mix(vec3(.5, .8, .96), vec3(1.), f * .55 + s * .2), a * .85); }' }));
    const fall = new T.Mesh(this.own(new T.PlaneGeometry(1.1, 15)), m); fall.position.set(x, -7.4, z); fall.renderOrder = 2; this.root.add(fall);
    this.anim.push((t, dt) => { if (Math.random() < dt * 9) this.smoke.emit(x + rnd(1.4), -14.6 + rnd(.5), z + rnd(.6), rnd(.8), .5, 0, 1.8, '#f0f8ff', 1.2, 3.2, .8); if (Math.random() < dt * 5) this.smoke.emit(x + rnd(.5), -.1, z + .1, rnd(.3), -.3, .2, .8, '#ffffff', .3, .7, .55); });
  }
  // ---------- Cráter de Fragua ----------
  buildVolcan() {
    const r = this.r, S = this.S, g = new T.Group();
    const [a, b] = S.main, w = b - a, c = (a + b) / 2;
    const rock = ['#3a302e', '#2f2727', '#241e1e'], lava = this.glowMat('#ff4a0a', .55), lavaHot = this.glowMat('#ff8a1a', .65);
    r.box(g, '#2a2220', c, -.2, 0, w, .4, 4.6, true);
    // Piso de baldosas de basalto (hexágonos) con rendijas oscuras.
    const hexTop = this.own(new T.CylinderGeometry(.44, .46, .04, 6)), basalt = ['#4e4440', '#463c39', '#544844', '#4a403c'].map(x => r.mat(x));
    for (let i = 0; a + .45 + i * .72 < b - .3; i++) for (let j = 0; j < 5; j++) {
      const x = a + .45 + i * .72, z = -1.86 + j * .8 + (i % 2) * .4; if (z > 2.05) continue;
      const m = new T.Mesh(hexTop, basalt[(i * 3 + j * 5) % 4]); m.position.set(x, -.005, z); m.receiveShadow = true; g.add(m);
    }
    r.box(g, '#2c2422', c, -.36, 0, w + .2, .22, 4.8, true);
    const n = 15, bw = (w - .9) / n;
    for (let i = 0; i < n; i++) r.box(g, i % 2 ? '#3e3432' : '#463a37', a + .45 + bw * (i + .5), -.62, 2.28, bw - .07, .36, .32, true);
    r.box(g, rock[0], c, -1.15, 0, w - .1, 1.05, 4.3, true);
    r.box(g, rock[1], c, -2.05, -.08, w - 1.4, .8, 3.6, true);
    r.box(g, rock[2], c, -2.75, -.16, w - 3, .5, 2.9, true);
    // Grietas de lava encendida al frente y por encima, y gotas de lava en las puntas de abajo.
    // Grietas de lava en zigzag al frente de la roca.
    for (let i = 0; i < 8; i++) {
      let x = a + 1.4 + i * (w - 2.8) / 7 + rnd(.5), y = -.72;
      for (let k = 0; k < 4; k++) { const len = .28 + Math.random() * .22, ang = (k % 2 ? .55 : -.45) + rnd(.3), m = r.mesh(g, 'box', k % 2 ? lava : lavaHot, [x + Math.sin(ang) * len / 2, y - Math.cos(ang) * len / 2, 2.16], [.045, len, .03]); m.rotation.z = ang; x += Math.sin(ang) * len; y -= Math.cos(ang) * len; }
    }
    for (let i = 0; i < 9; i++) { const x = a + 2 + i * (w - 4) / 8, h = 1.1 + ((i * 7) % 5) * .32; const k = r.mesh(g, 'cone24', rock[i % 3], [x, -3 - h / 2 + .12, rnd(.8)], [.5 + (i % 3) * .2, h, .5]); k.rotation.x = Math.PI; r.mesh(g, 'ball', lava, [x, -3 - h + .15, k.position.z], [.09, .12, .09]); }
    for (const [pa, pb, h] of S.plats) {
      const pw = pb - pa, pc = (pa + pb) / 2;
      r.box(g, '#4e4440', pc, h - .18, 0, pw, .34, 2.6, true);
      r.box(g, '#3a3230', pc, h - .43, 0, pw - .5, .2, 2.1, true);
      r.mesh(g, 'box', lava, [pc, h - .3, 1.31], [pw * .8, .05, .02]);
      const k = r.mesh(g, 'cone24', '#2e2626', [pc, h - 1.05, 0], [pw * .17, 1.1, .45]); k.rotation.x = Math.PI;
      r.mesh(g, 'ball', lavaHot, [pc, h - 1.62, 0], [.12, .16, .12]);
    }
    // Atrás: columnas de basalto y cristales oscuros.
    const hex = this.own(new T.CylinderGeometry(1, 1, 1, 6));
    for (let i = 0; i < 9; i++) { const x = a + .8 + i * (w - 1.6) / 8, h = .8 + ((i * 5) % 4) * .45; const m = new T.Mesh(hex, r.mat(i % 2 ? '#2a2424' : '#342c2a')); m.position.set(x, h / 2, -1.95 - (i % 2) * .2); m.scale.set(.32, h, .32); m.castShadow = m.receiveShadow = true; g.add(m); }
    for (const x of [a + 3, b - 3.4]) { r.mesh(g, 'octa', this.glowMat('#8a4ab8', .35), [x, .5, -1.6], [.24, .5, .24]); r.mesh(g, 'octa', this.glowMat('#6a3a96', .3), [x + .3, .3, -1.7], [.15, .32, .15]); }
    r.batch(g); this.root.add(g);
    // Respiraderos de humo y chispas atrás.
    for (const x of [a + 2.2, c + .8, b - 2]) this.anim.push((t, dt) => { if (Math.random() < dt * 3) this.smoke.emit(x + rnd(.3), .6, -1.9, rnd(.3), 1.2, 0, 2.6, '#5a4a48', .5, 2.4, .55); if (Math.random() < dt * 4) this.sparks.emit(x, .4, -1.8, rnd(1), 3 + Math.random() * 2, 0, 1, '#ffb04a', .12, .05); });
  }
  // ---------- Fondo ----------
  buildBackdrop() {
    const r = this.r, v = this.volcano, g = new T.Group();
    // Montañas lejanas (con nieve en la isla).
    for (let i = 0; i < 12; i++) {
      const x = -150 + i * 27 + (i % 2) * 8, h = 34 + (i * 7) % 24, rad = 19 + (i % 3) * 6, z = -165 - (i % 3) * 18, col = v ? (i % 2 ? '#3a2226' : '#2e1c20') : (i % 2 ? '#bcd6ea' : '#c8def0');
      r.mesh(g, 'cone24', col, [x, -24 + h / 2, z], [rad, h, rad * .7]);
      if (!v && i % 3 !== 1) r.mesh(g, 'cone24', '#f6faff', [x, -24 + h - h * .14, z + .5], [rad * .29, h * .28, rad * .2]);
    }
    if (v) {
      // Volcán grande atrás con el cráter encendido y una columna de humo.
      const cone = new T.Mesh(this.own(new T.CylinderGeometry(7, 48, 40, 28)), r.mat('#2a1a1c')); cone.position.set(12, 0, -130); cone.scale.z = .6; g.add(cone);
      r.mesh(g, 'cylinder', this.glowMat('#ff6a1a', 2), [12, 20.1, -130], [6.4, .5, 3.8]);
    }
    r.batch(g); this.root.add(g);
    if (v) {
      const glow = this.sprite('#ff7a2a', 40); glow.position.set(12, 21, -128); this.root.add(glow);
      this.anim.push((t, dt) => { glow.material.opacity = .7 + Math.sin(t * 1.7) * .15; if (Math.random() < dt * 4) this.smoke.emit(12 + rnd(6), 23, -129, rnd(1.5) + 1, 4 + Math.random() * 2, 0, 7, pick(['#7a5a54', '#6a4c48', '#8a6a60']), 5, 16, .45); });
    }
    // Islas que flotan a media distancia, subiendo y bajando.
    for (let i = 0; i < 7; i++) {
      const isl = new T.Group(), s = .9 + (i % 3) * .55, x = -60 + i * 20 + rnd(6), y = -3 + (i % 3) * 5.5, z = -34 - (i % 4) * 9;
      r.box(isl, v ? '#3a302e' : this.P.ground, 0, 0, 0, 3.2 * s, .5 * s, 2.4 * s, true);
      r.box(isl, v ? '#2e2626' : '#a88660', 0, -.5 * s, 0, 2.7 * s, .6 * s, 2 * s, true);
      const k = r.mesh(isl, 'cone24', v ? '#241e1e' : '#8e6c4c', [0, -1.9 * s, 0], [1.25 * s, 2.4 * s, .95 * s]); k.rotation.x = Math.PI;
      if (!v) { r.mesh(isl, 'cylinder', '#7a5c3e', [.4 * s, .75 * s, 0], [.11 * s, 1.1 * s, .11 * s]); r.ball(isl, this.P.leaves[i % 3], .4 * s, 1.5 * s, 0, .75 * s, .62 * s, .7 * s); }
      else r.mesh(isl, 'ball', this.glowMat('#ff7a24', 1.4), [0, -3.05 * s, 0], [.18 * s, .22 * s, .18 * s]);
      r.batch(isl); isl.position.set(x, y, z); this.root.add(isl);
      this.anim.push(t => { isl.position.y = y + Math.sin(t * .45 + i * 1.7) * .7; isl.rotation.y = Math.sin(t * .2 + i) * .12; });
    }
    // Nubes lejanas que pasan y un mar de nubes por debajo del escenario (humo rojizo en el volcán).
    const cloud = (color, opacity) => { const sp = new T.Sprite(this.own(new T.SpriteMaterial({ map: this.tex.cloud, color, transparent: true, depthWrite: false, opacity }))); return sp; };
    for (let i = 0; i < 12; i++) {
      const sp = cloud(v ? '#6a3a3a' : '#ffffff', v ? .55 : .92), x0 = -130 + i * 23, y = 16 + (i % 4) * 7, z = -70 - (i % 3) * 22, s = 22 + (i % 3) * 10;
      sp.position.set(x0, y, z); sp.scale.set(s, s * .5, 1); this.root.add(sp);
      this.anim.push(t => { sp.position.x = ((x0 + t * 1.3 + 140) % 280 + 280) % 280 - 140; });
    }
    for (let i = 0; i < 30; i++) {
      const row = i % 3, sp = cloud(v ? '#ff8a4a' : '#ffffff', v ? .32 : .97), x0 = -80 + (i * 37 % 160) + rnd(6), y = -13.5 - row * 2.6, z = -4 - row * 20 + rnd(5), s = 16 + rnd(8) + row * 6;
      sp.position.set(x0, y, z); sp.scale.set(s, s * .42, 1); this.root.add(sp);
      this.anim.push(t => { sp.position.x = x0 + Math.sin(t * .12 + i) * 3; });
    }
    if (v) {
      // Mar de lava muy abajo.
      const lava = this.own(new T.ShaderMaterial({ uniforms: { time: this.e.time },
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform float time; varying vec3 vW; void main(){ vec2 p = vW.xz * .07; float n = sin(p.x * 3. + time * .35) * sin(p.y * 4. - time * .27) + sin((p.x + p.y) * 7. + time * .6) * .5 + sin(p.x * 13. - p.y * 9. + time) * .2; vec3 c = mix(vec3(.45, .05, .02), vec3(1., .5, .1), smoothstep(-.4, 1.1, n)); c += vec3(1., .85, .45) * smoothstep(.95, 1.5, n);\ngl_FragColor = vec4(c, 1.);\n#include <colorspace_fragment>\n}' }));
      const sea = new T.Mesh(this.own(new T.PlaneGeometry(500, 260)), lava); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -24, -90); this.root.add(sea);
      // Brasas que suben por todo el escenario.
      this.anim.push((t, dt) => { if (Math.random() < dt * 26) this.sparks.emit(this.cam.x + rnd(44), -12 + rnd(4), rnd(14) - 3, rnd(.8), 2.6 + Math.random() * 2.4, 0, 4, Math.random() < .6 ? '#ff8a3a' : '#ffd25c', .16, .06); });
    } else {
      // Pajaritos lejanos que cruzan el cielo.
      for (let i = 0; i < 4; i++) {
        const bird = new T.Group(), wings = [-1, 1].map(s => { const m = new T.Mesh(this.r.geometries.box, this.r.mat('#4a5a6e')); m.scale.set(.9, .06, .3); m.position.x = s * .42; bird.add(m); return m; });
        const y = 12 + i * 2.5, z = -45 - i * 8, sp = 3 + i * .7, off = i * 70;
        bird.scale.setScalar(.9); this.root.add(bird);
        this.anim.push(t => { const k = Math.sin(t * 9 + i); wings[0].rotation.z = k * .6; wings[1].rotation.z = -k * .6; bird.position.set(((t * sp + off) % 220) - 110, y + Math.sin(t * .8 + i) * 1.5, z); });
      }
    }
  }
  // ---------- Peleadores ----------
  addFighter(p) {
    const r = this.r, root = new T.Group(); this.root.add(root);
    const model = creatureModel(r, p.sp);
    let h = HEIGHT.get(p.sp);
    if (!h) { model.updateMatrixWorld(true); const box = new T.Box3().setFromObject(model); h = Math.max(.3, box.max.y - box.min.y); HEIGHT.set(p.sp, h); }
    const want = 1.65 + Math.min(.5, Math.max(0, (p.weight - 55) / 55));
    model.scale.multiplyScalar(want / h);
    model.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // Material propio del cuerpo: brilla blanco al recibir, del color de su tipo al cargar y azul al esquivar.
    const bodyMesh = model.userData.body; let skin = null, baseE = new T.Color(0, 0, 0);
    if (bodyMesh?.material?.isMeshStandardMaterial) {
      const base = bodyMesh.material; skin = this.own(base.clone()); skin.onBeforeCompile = base.onBeforeCompile;
      if (Object.prototype.hasOwnProperty.call(base, 'customProgramCacheKey')) skin.customProgramCacheKey = base.customProgramCacheKey;
      baseE = base.emissive.clone().multiplyScalar(base.emissiveIntensity); skin.emissiveIntensity = 1; bodyMesh.material = skin;
    }
    const pivot = new T.Group(); pivot.position.y = want * .5; root.add(pivot);
    const body = new T.Group(); body.position.y = -want * .5; body.add(model); pivot.add(body);
    const color = COLORS[p.id % COLORS.length], C = fxColors(p.types[0]);
    const ring = new T.Mesh(this.ringGeo, this.mat(color, { transparent: true, opacity: .95, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .035; ring.renderOrder = 4; root.add(ring);
    const shadow = r.shadow(this.root, 0, 0, 1.3, .9, .3);
    const bubble = new T.Mesh(this.bubbleGeo, this.own(new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { color: { value: new T.Color(color) }, k: { value: 1 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 color; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(1. - abs(dot(normalize(vN), vV)), 2.); gl_FragColor = vec4(mix(color, vec3(1.), rim * .55), (.16 + rim * .78) * k);\n#include <colorspace_fragment>\n}' })));
    bubble.renderOrder = 8; bubble.visible = false; bubble.position.y = want * .5; root.add(bubble);
    const aura = this.sprite(C[0], want * 1.6); aura.material.opacity = 0; aura.position.y = want * .5; aura.renderOrder = 7; root.add(aura);
    const halo = new T.Mesh(this.ringGeo, this.mat('#ffffff', { transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); halo.rotation.x = -Math.PI / 2; halo.renderOrder = 7; root.add(halo);
    const dizzy = new T.Group(); dizzy.position.y = want * 1.08; root.add(dizzy);
    for (let i = 0; i < 3; i++) { const s = this.sprite('#ffe27a', .32, this.tex.star); s.position.set(Math.cos(i * 2.1) * .45, 0, Math.sin(i * 2.1) * .45); dizzy.add(s); }
    const v = { root, pivot, body, model, skin, baseE, ring, shadow, bubble, aura, halo, dizzy, want, color, C, face: p.face > 0 ? 1.05 : -1.05, spin: 0, land: 0, hurtFlash: 0, eyes: model.userData.eyes || [], blink: 2 + Math.random() * 3, dust: 0, wasAir: false, emis: new T.Color() };
    this.fighters.set(p.id, v); return v;
  }
  groundBelow(x, y) {
    const S = this.S; let best = null;
    if (x >= S.main[0] && x <= S.main[1] && y >= -.05) best = 0;
    for (const [a, b, h] of S.plats) if (x >= a && x <= b && y >= h - .05 && (best === null || h > best)) best = h;
    return best;
  }
  updateFighter(v, p, dt, t) {
    const visible = !p.out && p.stocks > 0;
    v.root.visible = visible;
    if (!visible) { v.shadow.visible = false; return; }
    v.root.position.set(p.x, p.y, 0);
    const winner = this.ending && this.ending.winner === p.id;
    // Mira hacia donde va, de tres cuartos para que se le vea la cara; al ganar voltea de frente a la cámara.
    const wantFace = winner ? 0 : p.face > 0 ? 1.05 : -1.05;
    v.face += (wantFace - v.face) * Math.min(1, dt * (winner ? 5 : 16));
    v.body.rotation.y = v.face;
    let sx = 1, sy = 1, lx = 0, ly = 0, rz = 0;
    const kSpeed = Math.hypot(p.kx, p.ky), state = p.state;
    if (state === 'idle' || state === 'shield') { const br = Math.sin(t * 3.4 + p.id * 1.3); sy = 1 + br * .03; sx = 1 - br * .018; rz = Math.sin(t * 1.7 + p.id) * .03; if (state === 'shield') { sy *= .94; sx *= 1.04; } }
    else if (state === 'run') {
      const ph = t * 16 + p.id; ly = Math.abs(Math.sin(ph)) * .16; rz = -Math.sign(p.vx || p.face) * .17; sx = 1 + Math.sin(ph * 2) * .035; sy = 1 - Math.sin(ph * 2) * .035;
      v.dust -= dt; if (v.dust <= 0 && p.ground) { v.dust = .12; this.smoke.emit(p.x - p.face * .35, p.y + .12, .25, -p.face * .9, .55, 0, .5, this.volcano ? '#8a7a74' : '#f1e8d8', .35, .8, .7); }
    }
    if (!p.ground && state !== 'hurt' && state !== 'ledge') { const st = Math.max(-.14, Math.min(.18, p.vy * .013)); sy *= 1 + st; sx *= 1 - st * .55; }
    // Cargando el golpe fuerte: se encoge hacia atrás, tiembla y junta energía del color de su tipo.
    const charging = state === 'charge', ck = charging ? Math.min(1, p.charge / .9) : 0;
    if (charging) {
      lx = -p.face * (.12 + ck * .12) + rnd(.07 * ck); sy *= 1 - ck * .12; sx *= 1 + ck * .09;
      v.aura.material.opacity = .4 + ck * .5 + Math.sin(t * 28) * .1; v.aura.scale.setScalar(v.want * (1.3 + ck * 1.2));
      if (Math.random() < dt * (30 + ck * 40)) { const a = Math.random() * 6.28, rr = 1.2 + Math.random() * .9; this.sparks.emit(p.x + Math.cos(a) * rr, p.y + v.want * .5 + Math.sin(a) * rr, .35, -Math.cos(a) * rr * 3, -Math.sin(a) * rr * 3, 0, .32, pick(v.C), .22, .08); }
    } else v.aura.material.opacity = Math.max(0, v.aura.material.opacity - dt * 5);
    // Golpes: se lanza hacia el golpe con un estirón distinto en cada uno.
    if (p.move && p.move !== 'hold') {
      const M = MOVES[p.move], k = Math.min(1, p.t / (M.start + M.active)), push = Math.sin(k * Math.PI);
      lx += p.face * push * (REACH[p.move] ?? .3) * (p.t < M.start ? -.5 : 1) * (p.mul > 1.05 ? 1.3 : 1);
      if (p.move === 'up') { ly += push * .28; sy *= 1 + push * .16; sx *= 1 - push * .06; }
      else if (p.move === 'down') { sy *= 1 - push * .2; sx *= 1 + push * .14; }
      else if (p.move === 'side' || p.move === 'jab') { rz += -p.face * push * (p.move === 'side' ? .32 : .14); sx *= 1 + push * .12; }
      if (p.move === 'dash' && p.t < M.start + M.active) {
        rz += -p.face * .35; if (Math.random() < dt * 60) { this.sparks.emit(p.x - p.face * .4, p.y + .25 + Math.random() * v.want * .7, rnd(.5), -p.face * (2 + Math.random() * 3), rnd(1), 0, .3, pick(v.C), .24, .06); this.smoke.emit(p.x - p.face * .6, p.y + .15, .1, -p.face, .3, 0, .45, '#ffffff', .4, 1, .6); }
      }
      if (p.move === 'power') {
        if (p.t < M.start) { const q = p.t / M.start; sy *= 1 - q * .24; sx *= 1 + q * .16; lx += rnd(.08 * q); if (Math.random() < dt * 70) { const a = Math.random() * 6.28, rr = 1.6 + Math.random() * .8; this.sparks.emit(p.x + Math.cos(a) * rr, p.y + v.want * .5 + Math.sin(a) * rr, .3, -Math.cos(a) * rr * 4, -Math.sin(a) * rr * 4, 0, .25, pick(v.C), .26, .1); } }
        else { const q = Math.min(1, (p.t - M.start) / .12); sy *= 1 + (1 - q) * .22 + .04; sx *= 1 - (1 - q) * .1; ly += (1 - q) * .2; }
      }
      if (p.move === 'recover' && p.t < .4) for (let i = 0; i < 2; i++) { const a = t * 22 + i * Math.PI; this.sparks.emit(p.x + Math.cos(a) * .7, p.y + .3, Math.sin(a) * .7, 0, -3.5, 0, .45, pick(v.C), .26, .08); }
    }
    // Voltereta del doble salto y giro del golpe en el aire.
    if (p.flip > 0) rz += -p.face * (1 - p.flip / (p.move === 'air' ? .3 : .38)) * Math.PI * 2;
    // Rodar y esquivar.
    if (state === 'roll') { const k = 1 - p.dodge / .4; rz += -p.dodgeDir * Math.min(1, k * 1.25) * Math.PI * 2; sy *= .82; sx *= 1.1; ly += .1; }
    else if (state === 'dodge') { sx *= .92; sy *= 1.04; }
    // Golpeado: tiembla durante la pausa del golpe y luego sale girando con una estela de humo.
    if (p.freeze > 0 && p.stun > 0) { lx += rnd(.22); ly += rnd(.12); }
    if (state === 'hurt' && kSpeed > 5 && !this.ending) {
      v.spin += dt * Math.min(20, kSpeed * .95) * (p.kx >= 0 ? -1 : 1);
      if (p.freeze <= 0 && Math.random() < dt * (kSpeed > 14 ? 32 : 16)) this.smoke.emit(p.x + rnd(.3), p.y + v.want * .5 + rnd(.3), rnd(.3), -p.kx * .04, -p.ky * .04, 0, .7, p.damage > 100 ? '#ffc4b4' : '#ffffff', .35, 1, .6);
      if (kSpeed > 14 && Math.random() < dt * 30) this.sparks.emit(p.x, p.y + v.want * .5, .2, rnd(2), rnd(2), 0, .3, '#ffffff', .25, .05);
    } else v.spin *= Math.pow(.0004, dt);
    if (p.ground && v.wasAir && state !== 'ledge') { v.land = .16; for (let i = 0; i < 5; i++) this.smoke.emit(p.x + rnd(.8), p.y + .1, rnd(.6), rnd(3.2), .5, 0, .5, this.volcano ? '#8a7a74' : '#f1e8d8', .35, .9, .7); }
    v.wasAir = !p.ground; v.land = Math.max(0, v.land - dt);
    if (v.land > 0) { sy *= 1 - v.land * 1.5; sx *= 1 + v.land * 1.1; }
    // Colgado del borde: más abajo, inclinado hacia la pared y meciéndose.
    if (state === 'ledge') { ly -= .12; rz = p.ledge * .3 + Math.sin(t * 3) * .05; sy *= 1.05; }
    // Escudo roto: queda mareado con estrellitas.
    v.dizzy.visible = p.broken > 0; if (p.broken > 0) { v.dizzy.rotation.y = t * 5; rz += Math.sin(t * 6) * .12; }
    // Ganador: salta de felicidad.
    if (winner && p.ground) { ly += Math.abs(Math.sin(t * 6)) * .55; sy *= 1 + Math.sin(t * 12) * .04; }
    v.body.position.set(lx, -v.want * .5 + ly, 0); v.pivot.rotation.z = v.spin + rz; v.body.scale.set(sx, sy, sx);
    animateCreature(v.model, t, dt);
    // Parpadeo
    v.blink -= dt; const closed = v.blink < .11 || (state === 'hurt' && kSpeed > 8); if (v.blink < 0) v.blink = 2 + Math.random() * 3.5; for (const e of v.eyes) if (e?.scale) e.scale.y = closed ? .12 : 1;
    // Brillo del cuerpo: golpe (blanco), carga (color del tipo), esquiva (azul) y recién salido (parpadeo suave).
    if (v.skin) {
      const E = v.emis.copy(v.baseE); v.hurtFlash = Math.max(0, v.hurtFlash - dt * 5);
      if (v.hurtFlash > 0) E.r += v.hurtFlash * 1.6, E.g += v.hurtFlash * 1.6, E.b += v.hurtFlash * 1.6;
      if (charging) { const c = this.tmpC || (this.tmpC = new T.Color()); c.set(v.C[0]).multiplyScalar(.25 + ck * .55 + Math.sin(t * 24) * .12); E.add(c); }
      if (state === 'roll' || state === 'dodge') { E.r += .25; E.g += .55; E.b += .9; }
      else if (p.inv > 0 && !p.ledge) { const k = (Math.sin(t * 18) * .5 + .5) * .45; E.r += k; E.g += k; E.b += k; }
      v.skin.emissive.copy(E);
    }
    // Escudo: burbuja que se encoge con el aguante y se pone roja cuando está por romperse.
    v.bubble.visible = p.shielding;
    if (p.shielding) { const u = v.bubble.material.uniforms; v.bubble.scale.setScalar(v.want * (.4 + p.shield * .42) * (1 + Math.sin(t * 12) * .02)); u.k.value = .55 + p.shield * .45; u.color.value.set(p.shield < .3 ? (Math.floor(t * 10) % 2 ? '#ff4a3a' : v.color) : v.color); }
    // Recién salido: aro de luz debajo mientras baja.
    const fresh = p.inv > 1.1 && !p.ground; v.halo.material.opacity = fresh ? .85 : Math.max(0, v.halo.material.opacity - dt * 3); v.halo.scale.setScalar(1.3 + Math.sin(t * 6) * .08); v.halo.position.y = -.1;
    if (fresh && Math.random() < dt * 24) this.twinkles.emit(p.x + rnd(1.4), p.y, rnd(1), 0, -1, 0, .5, v.color, .3, .1);
    v.ring.visible = p.ground && state !== 'ledge';
    const gy = this.groundBelow(p.x, p.y);
    v.shadow.visible = gy !== null && p.y - gy < 7;
    if (v.shadow.visible) { v.shadow.position.set(p.x, gy + .03, 0); const k = Math.max(.35, 1 - (p.y - gy) / 8); v.shadow.scale.set(k * 1.35, k * .9, 1); }
  }
  // Estela de color que barre el golpe, en el plano de la pelea.
  arc(move) {
    if (!this.arcGeo[move]) { const len = ARC[move][1]; this.arcGeo[move] = [this.own(new T.TorusGeometry(1, .13, 6, 48, len)), this.own(new T.TorusGeometry(1, .045, 6, 48, len))]; }
    return this.arcGeo[move];
  }
  swingArc(p, v, move, mul = 1) {
    const M = MOVES[move]; if (!M || !ARC[move]) return;
    const [center, len] = ARC[move], [g0, g1] = this.arc(move), big = move !== 'jab' || mul > 1.1;
    const cy = v.want * .5, R = (Math.hypot(M.dx, M.dy - cy) + M.r * .45) * (1 + (mul - 1) * .35);
    const outer = new T.Mesh(g0, new T.MeshBasicMaterial({ color: v.C[0], transparent: true, opacity: .9, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    const inner = new T.Mesh(g1, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    const grp = new T.Group(); grp.add(outer, inner); outer.renderOrder = inner.renderOrder = 9;
    grp.position.set(p.x, p.y + cy, .35); grp.scale.set(R * p.face, R, R * (big ? 1 : .8)); grp.rotation.z = (center - len / 2) * p.face;
    this.root.add(grp);
    this.fx.push({ o: grp, t: 0, life: move === 'air' ? .3 : .24, kind: 'arc', spin: (move === 'air' ? -10 : -5) * p.face, mats: [outer.material, inner.material], follow: p.id, cy, R });
  }
  // ---------- Poderes (disparos por tipo) ----------
  syncShots(sim, dt, t) {
    const seen = new Set();
    for (const s of sim.shots) {
      seen.add(s.id); const m = this.shots.get(s.id) || this.makeShot(s);
      m.g.position.set(s.x, s.y, .25); m.tick(t, dt, s);
    }
    for (const [id, m] of this.shots) if (!seen.has(id)) { m.mats.forEach(x => x.dispose()); m.geos.forEach(x => x.dispose()); m.g.removeFromParent(); this.shots.delete(id); }
  }
  makeShot(s) {
    const C = fxColors(s.type), g = new T.Group(), mats = [], geos = [], dir = Math.sign(s.vx) || 1;
    const glow = (c, size, map = this.tex.glow) => { const sp = new T.Sprite(new T.SpriteMaterial({ map, color: c, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); mats.push(sp.material); sp.scale.setScalar(size); sp.renderOrder = 10; g.add(sp); return sp; };
    const solid = (geo, c, opts = {}) => { const mt = new T.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, fog: false, ...opts }); mats.push(mt); const me = new T.Mesh(geo, mt); me.renderOrder = 10; g.add(me); return me; };
    const core = glow(C[0], 1.6); glow('#ffffff', .62);
    const trail = (rate, colors, spread = .25, vy = 0, life = .35, size = .3) => (dt, sh) => { if (Math.random() < dt * rate) this.sparks.emit(sh.x + rnd(spread), sh.y + rnd(spread), .25 + rnd(.2), -dir * (1 + Math.random() * 2), vy + rnd(1), 0, life, pick(colors), size, size * .2); };
    let tick;
    switch (s.type) {
      case 'fuego': { const tr = trail(120, C, .3, 1.6, .42, .34); tick = (tt, dt, sh) => { core.scale.setScalar(1.5 + Math.sin(tt * 40) * .3); tr(dt, sh); if (Math.random() < dt * 30) this.smoke.emit(sh.x - dir * .3, sh.y + .1, .2, -dir, 1, 0, .5, '#5a4a48', .3, .8, .5); }; break; }
      case 'agua': { const ball = solid(this.r.geometries.ball, '#8ad0f4', { opacity: .8 }); ball.scale.setScalar(.34); const tr = trail(90, ['#ffffff', '#b4e4fa', '#7ec8f0'], .2, -1.5, .32, .22); tick = (tt, dt, sh) => { ball.scale.set(.38 + Math.sin(tt * 25) * .05, .32 - Math.sin(tt * 25) * .04, .34); tr(dt, sh); }; break; }
      case 'electrico': {
        const bolts = []; for (let i = 0; i < 5; i++) { const geo = new T.BoxGeometry(1, 1, 1); geos.push(geo); bolts.push(solid(geo, i % 2 ? '#ffffff' : '#ffe040', { blending: T.AdditiveBlending })); }
        const tr = trail(80, C, .4, 0, .2, .26);
        tick = (tt, dt, sh) => { bolts.forEach((b, i) => { const a = tt * 31 + i * 1.3; b.position.set(Math.cos(a) * .38, Math.sin(a * 1.4) * .38, 0); b.rotation.z = a; b.scale.set(.45 + Math.random() * .35, .05, .05); }); core.scale.setScalar(1.3 + Math.random() * .5); tr(dt, sh); }; break;
      }
      case 'hielo': { const cr = solid(this.r.geometries.octa, '#e6faff', { opacity: .95 }); cr.scale.set(.46, .26, .26); const tr = trail(70, ['#ffffff', '#bff0ff'], .2, -.4, .55, .2); tick = (tt, dt, sh) => { cr.rotation.x = tt * 9; tr(dt, sh); }; break; }
      case 'psiquico': { const rings = [0, 1, 2].map(i => { const geo = new T.TorusGeometry(.3 + i * .12, .035, 6, 32); geos.push(geo); return solid(geo, i === 1 ? '#ffffff' : C[0], { blending: T.AdditiveBlending }); }); tick = tt => rings.forEach((rg, i) => { rg.rotation.y = Math.PI / 2; const k = (tt * 3 + i / 3) % 1; rg.scale.setScalar(.5 + k); rg.material.opacity = 1 - k; }); break; }
      case 'fantasma': { core.material.color.set('#8a5ae0'); const dark = glow('#20142e', 1.1); dark.material.blending = T.NormalBlending; const tr = trail(70, ['#b48ae8', '#5a3a8a', '#ffffff'], .3, .6, .6, .3); tick = (tt, dt, sh) => { core.scale.setScalar(1.6 + Math.sin(tt * 9) * .35); dark.scale.setScalar(.7 + Math.sin(tt * 9) * .1); tr(dt, sh); }; break; }
      case 'hada': { const st = glow('#ffffff', 1, this.tex.star); const tr = trail(80, ['#ff9ad8', '#ffffff', '#ffd2f0'], .45, 0, .55, .26); tick = (tt, dt, sh) => { st.material.rotation = tt * 7; tr(dt, sh); if (Math.random() < dt * 20) this.twinkles.emit(sh.x + rnd(.6), sh.y + rnd(.6), .3, -dir, rnd(1), 0, .5, pick(C), .3, .05); }; break; }
      case 'dragon': { const geo = new T.TorusGeometry(.42, .07, 6, 30); geos.push(geo); const rg = solid(geo, '#9a8aff', { blending: T.AdditiveBlending }); const tr = trail(90, C, .3, 0, .42, .3); tick = (tt, dt, sh) => { rg.rotation.set(tt * 7, tt * 4, 0); tr(dt, sh); }; break; }
      default: { const tr = trail(80, C, .3, 0, .35, .28); tick = (tt, dt, sh) => tr(dt, sh); }
    }
    this.root.add(g);
    const m = { g, mats, geos, tick }; this.shots.set(s.id, m); return m;
  }
  // ---------- Efectos ----------
  burst(x, y, color, size = 1, life = .3, map = this.tex.glow, z = .6) {
    const s = this.sprite(color, .2, map, false); s.position.set(x, y, z); s.renderOrder = 11; this.root.add(s);
    this.fx.push({ o: s, t: 0, life, size, kind: 'burst', mats: [s.material], rot: rnd(2) });
  }
  spray(x, y, colors, n, speed, life = .45, size = .3) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = speed * (.35 + Math.random() * .8); this.sparks.emit(x, y, .45, Math.cos(a) * sp, Math.sin(a) * sp + 1, rnd(1.5), life * (.6 + Math.random() * .6), pick(colors), size, size * .15); } }
  dust(x, y, n = 8, spread = 1.2) { for (let i = 0; i < n; i++) { const s = Math.sign(rnd()) || 1; this.smoke.emit(x + rnd(spread * .4), y + .1, rnd(.6), s * (1.5 + Math.random() * 2.5), .4 + Math.random() * .5, 0, .6, this.volcano ? '#8a7a74' : '#f1e8d8', .4, 1.2, .8); } }
  beam(x, y, color) {
    const m = new T.Mesh(this.r.geometries.plane, new T.MeshBasicMaterial({ color, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    const cx = this.cam.x, cy = this.cam.y, ang = Math.atan2(cy - y, cx - x), len = Math.hypot(cx - x, cy - y) + 12;
    m.position.set(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2, -.4); m.rotation.z = ang; m.scale.set(len, 2.4, 1); m.renderOrder = 11; this.root.add(m);
    const core = new T.Mesh(m.geometry, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); core.position.copy(m.position); core.rotation.z = ang; core.scale.set(len, .7, 1); core.renderOrder = 12; this.root.add(core);
    this.fx.push({ o: m, t: 0, life: .7, kind: 'beam', mats: [m.material], w: 2.4 }, { o: core, t: 0, life: .5, kind: 'beam', mats: [core.material], w: .7 });
  }
  // Onda en el piso y anillo de frente que crecen y se desvanecen.
  shockwave(x, y, C) {
    const flat = new T.Mesh(this.ringGeo, new T.MeshBasicMaterial({ color: C[0], transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); flat.rotation.x = -Math.PI / 2; flat.position.set(x, y + .06, 0); flat.renderOrder = 9;
    const up = new T.Mesh(this.ringGeo, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); up.position.set(x, y + .9, .3); up.renderOrder = 9;
    this.root.add(flat, up);
    this.fx.push({ o: flat, t: 0, life: .55, kind: 'wave', mats: [flat.material], grow: 5 }, { o: up, t: 0, life: .4, kind: 'wave', mats: [up.material], grow: 3.6 });
  }
  ctx(sim) {
    const at = (id, k) => { const p = sim.f[id], h = this.fighters.get(id)?.want || 1.6; return new T.Vector3(p.x, p.y + h * k, .45); };
    return { center: id => at(id, .5), feet: id => at(id, 0), height: id => this.fighters.get(id)?.want || 1.6 };
  }
  event(ev, sim) {
    const p = ev.id !== undefined ? sim.f[ev.id] : null, v = p && this.fighters.get(ev.id);
    switch (ev.type) {
      case 'hit': {
        const C = fxColors(ev.kind);
        if (v) v.hurtFlash = 1;
        if (ev.strong && sim.f[ev.by]) this.movefx.spawn({ anim: HIT_ANIM[ev.kind] || 'punch', type: ev.kind, from: ev.by, to: ev.id, power: 60, eff: 1 }, this.ctx(sim));
        this.burst(ev.x, ev.y, ev.strong ? '#fff4b0' : '#ffffff', ev.strong ? 3.6 : 1.8, .26, this.tex.star);
        this.burst(ev.x, ev.y, C[0], ev.strong ? 4.5 : 2.2, .3);
        this.spray(ev.x, ev.y, C, ev.strong ? 36 : 14, ev.strong ? 8 : 4.5, ev.strong ? .6 : .4);
        if (ev.strong) { this.burst(ev.x, ev.y, '#ffffff', 6, .4, this.tex.ring); this.spray(ev.x, ev.y, ['#ffffff'], 14, 11, .35, .2); }
        this.shake = Math.max(this.shake, ev.strong ? .32 + Math.min(.4, (ev.speed - 14) * .02) : .1);
        if (ev.strong) { this.punch = .1; if (ev.speed > 19) this.flash = Math.max(this.flash, .25); }
        break;
      }
      case 'block': { const c = COLORS[ev.id % 4]; this.burst(ev.x, ev.y, c, 1.6, .22, this.tex.ring); this.spray(ev.x, ev.y, ['#ffffff', c], 8, 3.5); break; }
      case 'break': if (p) { const c = COLORS[ev.id % 4]; this.spray(p.x, p.y + 1, ['#ffffff', c, '#ffd25c'], 44, 9, .8); this.burst(p.x, p.y + 1, '#ffd25c', 4.5, .45, this.tex.star); this.burst(p.x, p.y + 1, c, 5, .35, this.tex.ring); this.shake = Math.max(this.shake, .3); } break;
      case 'ko': {
        const c = COLORS[ev.id % 4];
        this.beam(ev.x, ev.y, c); this.burst(ev.x, ev.y, '#ffffff', 10, .7, this.tex.star); this.burst(ev.x, ev.y, c, 12, .8);
        this.spray(ev.x, ev.y, ['#ffffff', c, '#ffd25c'], 70, 16, 1, .4); for (let i = 0; i < 18; i++) this.twinkles.emit(ev.x + rnd(2), ev.y + rnd(2), .5, rnd(14), rnd(14), 0, 1.1, pick(['#ffffff', c, '#ffd25c']), .55, .1);
        this.shake = Math.max(this.shake, .7); this.flash = Math.max(this.flash, .55); break;
      }
      case 'land': if (p && ev.hard) this.dust(p.x, p.y, 10, 1.6); break;
      case 'jump': if (p) { if (ev.air) { this.burst(p.x, p.y + .15, '#ffffff', 1.8, .28, this.tex.ring, 0); this.spray(p.x, p.y + .1, ['#ffffff', v?.color || '#fff'], 6, 2.5, .3, .2); } else this.dust(p.x, p.y, 5, .8); } break;
      case 'respawn': if (p) { const c = COLORS[ev.id % 4]; this.burst(p.x, p.y + .8, c, 4.5, .7); this.spray(p.x, p.y + .8, ['#ffffff', c], 30, 5, .8); } break;
      case 'recover': if (p) { this.burst(p.x, p.y + .4, v?.C[0] || '#fff', 2.6, .35, this.tex.ring, 0); this.spray(p.x, p.y + .3, v?.C || ['#fff'], 16, 4, .5); } break;
      case 'swing': if (p && v) this.swingArc(p, v, ev.move, ev.mul || 1); break;
      case 'charge': if (p && v) this.burst(p.x, p.y + v.want * .5, v.C[0], 2, .25, this.tex.ring); break;
      case 'power': if (p && v) {
        const kind = ev.kind || p.types[0], anim = POWER_ANIM[kind] || 'quake', id = ev.id;
        this.burst(p.x, p.y + v.want * .5, v.C[0], 3, .3, this.tex.ring);
        // Al soltar el poder: explosión, onda en el piso y el efecto de su tipo.
        this.timers.push({ t: MOVES.power.start * .9, fn: () => {
          const q = this.sim?.f[id]; if (!q || q.out) return;
          const front = new T.Vector3(q.x + q.face * 3, q.y + v.want * .5, .45), base = this.ctx(this.sim);
          this.movefx.spawn({ anim, type: kind, from: id, to: anim === 'wave' ? 'front' : id, power: 100, eff: 1 }, { center: k => k === 'front' ? front : base.center(k), feet: k => k === 'front' ? new T.Vector3(front.x, q.y, .45) : base.feet(k), height: k => base.height(k === 'front' ? id : k) });
          this.shockwave(q.x, q.y, v.C);
          this.burst(q.x, q.y + v.want * .5, '#ffffff', 5, .35, this.tex.star); this.burst(q.x, q.y + v.want * .5, v.C[0], 7, .45);
          this.spray(q.x, q.y + v.want * .5, v.C, 40, 9, .7); this.shake = Math.max(this.shake, .3); this.flash = Math.max(this.flash, .12);
        } });
      } break;
      case 'release': if (p && v) { this.burst(p.x, p.y + v.want * .5, v.C[0], 2.4 + ev.level * 3, .32); this.spray(p.x, p.y + v.want * .5, v.C, 10 + Math.round(ev.level * 24), 4 + ev.level * 4); if (ev.level > .6) this.shake = Math.max(this.shake, .12); } break;
      case 'shoot': if (p && v) { this.burst(p.x + p.face * .8, p.y + .7, v.C[0], 2, .2); this.spray(p.x + p.face * .8, p.y + .7, v.C, 6, 3, .25, .2); } break;
      case 'pop': { const C = fxColors(ev.kind); this.burst(ev.x, ev.y, C[0], 2.6, .3); this.burst(ev.x, ev.y, '#ffffff', 1.4, .2, this.tex.star); this.spray(ev.x, ev.y, C, 22, 6); break; }
      case 'dodge': if (p && v) { this.burst(p.x, p.y + v.want * .5, '#bfe8ff', 2.4, .25, this.tex.ring); for (let i = 0; i < 6; i++) this.smoke.emit(p.x + rnd(.6), p.y + .2 + Math.random() * v.want * .6, .1, -(ev.dir || 0) * 2 + rnd(1), rnd(.6), 0, .4, '#dff3ff', .4, 1, .7); } break;
      case 'ledge': if (p) { this.burst(p.x, p.y + 1, '#ffffff', 1.3, .2, this.tex.star); this.spray(p.x, p.y + 1.05, ['#ffffff'], 6, 2, .3, .2); } break;
      case 'climb': if (p) this.dust(p.x, p.y, 5, .8); break;
      case 'end': this.ending = { t: 0, winner: ev.winner }; break;
    }
  }
  stepFx(dt) {
    for (const f of this.fx) {
      f.t += dt; const k = Math.min(1, f.t / f.life);
      if (f.kind === 'burst') { f.o.scale.setScalar(.3 + (1 - Math.pow(1 - k, 2)) * f.size); f.o.material.opacity = 1 - k; f.o.material.rotation = f.rot * k; }
      else if (f.kind === 'beam') { f.o.material.opacity = (1 - k) * .9; f.o.scale.y = f.w * (1 - k * .75); }
      else if (f.kind === 'wave') { f.o.scale.setScalar(.6 + (1 - Math.pow(1 - k, 3)) * f.grow); f.o.material.opacity = (1 - k) * .95; }
      else if (f.kind === 'arc') {
        f.o.rotation.z += f.spin * dt; const s = 1 + k * .15; f.o.scale.set(f.R * s * Math.sign(f.o.scale.x), f.R * s, f.o.scale.z);
        f.mats.forEach((m, i) => { m.opacity = (1 - k * k) * (i ? 1 : .9); });
        const p = this.sim?.f[f.follow]; if (p && !p.out) f.o.position.set(p.x, p.y + f.cy, .35);
      }
      if (k >= 1) { f.o.removeFromParent(); f.mats?.forEach(m => m.dispose()); f.done = true; }
    }
    this.fx = this.fx.filter(f => !f.done);
  }
  sync(sim, events, dt0, t) {
    this.time = t; this.sim = sim;
    // Cámara lenta un momento después de la última salida.
    const dt = this.ending && this.ending.t < 1.2 ? dt0 * .45 : dt0;
    for (const fn of this.anim) fn(t, dt);
    for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0 && !tm.done) { tm.done = true; tm.fn(); } }
    this.timers = this.timers.filter(tm => !tm.done);
    if (sim) {
      for (const p of sim.f) { const v = this.fighters.get(p.id) || this.addFighter(p); this.updateFighter(v, p, dt, t); }
      this.syncShots(sim, dt, t);
      for (const ev of events) this.event(ev, sim);
    }
    // Al final: confeti y estrellitas cayendo sobre el ganador.
    if (this.ending) {
      this.ending.t += dt0; const w = sim?.f[this.ending.winner];
      if (w && !w.out && this.ending.t < 4 && Math.random() < dt * 40) this.twinkles.emit(w.x + rnd(7), w.y + 5 + Math.random() * 2, rnd(2), rnd(1), -1.5, 0, 2.2, pick(['#ff6a8a', '#ffd25c', '#6ad0ff', '#8aff9a', '#ffffff', COLORS[w.id % 4]]), .35, .22);
    }
    this.sparks.step(dt); this.twinkles.step(dt); this.smoke.step(dt);
    this.stepFx(dt);
    const sh = this.movefx.update(dt, this.camera); if (sh) this.shake = Math.max(this.shake, sh * .8);
  }
  // Cámara que encuadra a todos (dejando espacio para las tarjetas de daño de abajo), que se acerca un instante
  // con los golpes fuertes y que al final se va encima del ganador.
  frame(dt, aspect, sim) {
    const S = this.S, live = sim ? sim.f.filter(p => !p.out && p.stocks > 0) : [], pad = aspect < 1 ? 4.2 : 2.6;
    let x0 = S.main[0] + pad, x1 = S.main[1] - pad, y0 = -1.4, y1 = 4.2;
    for (const p of live) { x0 = Math.min(x0, p.x - 2); x1 = Math.max(x1, p.x + 2); y0 = Math.min(y0, p.y - 1.4); y1 = Math.max(y1, p.y + 2.6); }
    x0 = Math.max(x0, -S.blast.x); x1 = Math.min(x1, S.blast.x); y0 = Math.max(y0, S.blast.bottom + 2); y1 = Math.min(y1, S.blast.top);
    const w = x1 - x0, h = (y1 - y0) * 1.3;
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - (y1 - y0) * .1;
    let d = Math.min(aspect < 1 ? 42 : 40, Math.max(aspect < 1 ? 13 : 11.5, Math.max(h / (2 * TAN), w / (2 * TAN * aspect))));
    const win = this.ending && sim?.f[this.ending.winner];
    if (win && !win.out) { cx = win.x * (aspect < 1 ? 1 : .85); cy = win.y + 1.2; d = aspect < 1 ? 14 : 10.5; }
    this.punch = Math.max(0, this.punch - dt); d *= 1 - this.punch * .7;
    // Al empezar, la cámara llega desde lejos.
    if (!this.cam.init) { this.cam.init = true; this.cam.x = cx; this.cam.y = cy + 3; this.cam.d = d + 16; }
    // Se aleja rápido (para no perder a nadie) y se acerca despacio.
    const out = d > this.cam.d, k = 1 - Math.exp(-dt * (win ? 2.2 : out ? 5.5 : 2.6)), kd = 1 - Math.exp(-dt * (win ? 2.2 : out ? 6 : 2));
    this.cam.x += (cx - this.cam.x) * k; this.cam.y += (cy - this.cam.y) * k; this.cam.d += (d - this.cam.d) * kd;
    const sh = this.shake; this.shake = Math.max(0, this.shake - dt * 1.8);
    const jx = sh ? rnd(sh) : 0, jy = sh ? rnd(sh) : 0;
    const cam = this.camera; cam.fov = FOV; cam.aspect = aspect; cam.updateProjectionMatrix();
    cam.position.set(this.cam.x + jx, this.cam.y + this.cam.d * .14 + jy, this.cam.d); cam.lookAt(this.cam.x + jx * .5, this.cam.y + jy * .5, 0);
    this.sky.position.copy(cam.position);
    const e = this.e;
    this.pointScale.value = (e.webgl?.domElement?.height || innerHeight) * .5 / TAN;
    if (!e.scene.background?.isColor) e.scene.background = new T.Color();
    e.scene.background.set(this.skyColors.mid); e.scene.fog.color.set(this.skyColors.fog); e.scene.fog.near = this.cam.d + 40; e.scene.fog.far = this.cam.d + 190;
    e.lights.update(new T.Vector3(this.cam.x, 0, 0), false, this.volcano ? 18 : 11);
    // Luz de contorno desde atrás para despegar a los peleadores del fondo.
    const fill = e.lights.fill; if (fill) { fill.color.set(this.volcano ? '#ff9a5a' : '#dcefff'); fill.intensity = this.volcano ? 1.9 : 1.5; fill.position.set(this.cam.x - 5, 9, -12); }
    this.flash = Math.max(0, this.flash - dt * 1.6);
    e.styleOpts = { focusY: .5, tilt: 0, night: 0, bloom: this.volcano ? .62 : .42, lift: .08 + this.flash * .9, grade: this.volcano ? [1.12, .96, .9] : [1.05, 1.01, .97], sat: 1.18 };
    return cam;
  }
  toScreen(x, y) { const v = new T.Vector3(x, y, 0).project(this.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, behind: v.z > 1 }; }
  dispose() {
    for (const f of this.fx) { f.o.removeFromParent(); f.mats?.forEach(m => m.dispose()); }
    for (const m of this.shots.values()) { m.mats.forEach(x => x.dispose()); m.geos.forEach(x => x.dispose()); }
    this.movefx.dispose(); this.sparks.dispose(); this.twinkles.dispose(); this.smoke.dispose();
    const fill = this.e.lights?.fill; if (fill && this.fillSave) { fill.color.copy(this.fillSave.c); fill.intensity = this.fillSave.i; fill.position.copy(this.fillSave.p); }
    this.r.release(this.root);
    for (const x of this.owned) x.dispose?.();
  }
}
