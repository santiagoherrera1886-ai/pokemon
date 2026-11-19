// Escenarios de la Pelea en 3D con estilo de figuras de juguete, como los Puchamon: rocas redondeadas con textura
// pintada que se angostan hacia abajo (igual que el choque del juego), pasto que chorrea por el borde, nubes
// esponjosas en 3D, árboles redondos y fondos pintados con montañas. Cada escenario arma su grupo, devuelve sus
// colores (cielo, niebla, luz) y una función que anima lo que se mueve.
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { taperCut } from '../games/pelea/sim.js';
import { loadStageModel, stageModelNow } from './stage-assets.js';

// Azar con semilla: el escenario sale igual en cada partida.
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const C = new T.Color(), C2 = new T.Color();
const lerpHex = (a, b, k) => C.set(a).lerp(C2.set(b), Math.max(0, Math.min(1, k)));
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- Paletas ----------
export const PALETTES = {
  isla: {
    sky: ['#2c77dc', '#8ccdfb', '#fff2d2'], fog: '#bfe1fb', sun: '#fff0bf', sunDir: [.55, .32, -1], hour: 10.5, rim: '#e4f3ff',
    grass: ['#9be86a', '#62c548', '#3f9a35'], rock: ['#e2ae74', '#b77c45', '#7c4f2e'], stone: ['#f4ead4', '#d6c7a8'],
    leaves: ['#9be66e', '#58bd47', '#38933a'], trunk: '#8d5a33', cloud: '#ffffff', cloudGlow: '#cfe0ff',
    far: ['#a9cbe9', '#c4dcf0', '#edf6ff'], grade: [1.03, 1.0, .97], sat: 1.1, bloom: .3
  },
  volcan: {
    sky: ['#170b14', '#5e1f1f', '#ff7a2c'], fog: '#4a1d1b', sun: '#ff7b36', sunDir: [-.2, .05, -1], hour: 18, rim: '#ffa064',
    grass: ['#5a4a46', '#40332f', '#2a2120'], rock: ['#4f3e39', '#35292a', '#1c1617'], stone: ['#5e4e48', '#3e3230'],
    leaves: ['#4a3a36', '#3a2c2a', '#2a2020'], trunk: '#2a1e1c', cloud: '#7a4a42', cloudGlow: '#ff7a3a',
    far: ['#2a1416', '#3a1c1e', '#5a2a26'], grade: [1.1, .97, .92], sat: 1.12, bloom: .55, lava: '#ff6a12'
  },
  templo: {
    sky: ['#3b2d74', '#ff8f73', '#ffd796'], fog: '#f4b991', sun: '#ffd27a', sunDir: [-.35, .06, -1], hour: 17.4, rim: '#ffd0a0',
    grass: ['#f6efe4', '#e6dacb', '#cdbfae'], rock: ['#f1e2cf', '#cfb79d', '#9c8068'], stone: ['#fbf4ea', '#e6d8c6'],
    leaves: ['#7fcf6a', '#4fa857', '#3a8a4a'], trunk: '#7a5236', cloud: '#ffe8de', cloudGlow: '#ffb48a',
    far: ['#c58aa6', '#e2a8a8', '#ffd6b8'], grade: [1.06, .99, .95], sat: 1.12, bloom: .42, gold: '#f2c24e'
  }
};

// ---------- Texturas pintadas ----------
function canvasTex(w, h, draw, repeat = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
// Dibuja algo repetido en los bordes para que la textura empate sin costuras.
function wrapDraw(w, h, x, y, r, fn) { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) if (x + dx > -r && x + dx < w + r && y + dy > -r && y + dy < h + r) fn(x + dx, y + dy); }
// Roca clara con vetas, piedritas con luz y sombra y grietas (se tiñe con el color de cada vértice).
function rockTex(seed, { base = '#efe3d3', dark = 'rgba(70,40,20,', light = 'rgba(255,250,240,', veins = 'rgba(90,55,30,' } = {}) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 26 + Math.floor(r() * 20)) {
      const a = .05 + r() * .07, ph = r() * 6.28, amp = 4 + r() * 8;
      g.fillStyle = (r() < .5 ? dark : light) + a + ')'; g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / w * Math.PI * 4 + ph) * amp);
      g.lineTo(w, y + 14 + r() * 10); g.lineTo(0, y + 14 + r() * 10); g.closePath(); g.fill();
    }
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rx = 6 + r() * 22, ry = rx * (.5 + r() * .35);
      wrapDraw(w, h, x, y, rx + 4, (px, py) => {
        g.fillStyle = dark + (.1 + r() * .08) + ')'; g.beginPath(); g.ellipse(px + 2, py + 3, rx, ry, 0, 0, 7); g.fill();
        g.fillStyle = (r() < .5 ? light + '.32)' : dark + '.06)'); g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, 7); g.fill();
        g.fillStyle = light + '.45)'; g.beginPath(); g.ellipse(px - rx * .3, py - ry * .35, rx * .4, ry * .3, 0, 0, 7); g.fill();
      });
    }
    g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      let x = r() * w, y = r() * h; g.strokeStyle = veins + (.25 + r() * .2) + ')'; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (r() - .5) * 40; y += 8 + r() * 22; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 2600; i++) { g.fillStyle = (r() < .5 ? dark : light) + (.08 + r() * .1) + ')'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  }, 1);
}
// Pasto: motas claras y oscuras y rayitas de hojas.
function grassTex(seed) {
  const r = rng(seed);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h; g.strokeStyle = r() < .5 ? 'rgba(30,90,20,.16)' : 'rgba(255,255,220,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y - 3 - r() * 4); g.stroke(); }
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h, rr = 6 + r() * 14; wrapDraw(w, h, x, y, rr, (px, py) => { const gr = g.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, r() < .5 ? 'rgba(255,255,200,.22)' : 'rgba(20,70,20,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px - rr, py - rr, rr * 2, rr * 2); }); }
  }, 1);
}
// Mármol con vetas suaves (templo).
function marbleTex(seed) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#fbf6ef'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      let x = r() * w, y = r() * h, a = r() * 6.28; g.strokeStyle = `rgba(150,120,110,${.12 + r() * .14})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 14; k++) { a += (r() - .5) * .9; x += Math.cos(a) * 26; y += Math.sin(a) * 26; g.lineTo(x, y); }
      g.stroke();
    }
    // Juntas de baldosas
    g.strokeStyle = 'rgba(120,95,80,.22)'; g.lineWidth = 3; for (let k = 0; k <= 2; k++) { g.beginPath(); g.moveTo(0, k * 256); g.lineTo(w, k * 256); g.stroke(); g.beginPath(); g.moveTo(k * 256, 0); g.lineTo(k * 256, h); g.stroke(); }
  }, 1);
}
// Brillo de lava: grietas naranjas que se ven en la oscuridad (va como textura de brillo).
function lavaVeinsTex(seed) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#000000'; g.fillRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 9; i++) {
      const pts = []; let x = r() * w, y = r() * h; for (let k = 0; k < 7; k++) { pts.push([x, y]); x += (r() - .5) * 70; y += 18 + r() * 40; }
      for (const [lw, col] of [[9, 'rgba(255,90,10,.35)'], [4, 'rgba(255,140,30,.9)'], [1.6, 'rgba(255,230,140,1)']]) {
        g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke();
        g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px, py - h) : g.moveTo(px, py - h)); g.stroke();
      }
    }
  }, 1);
}

// ---------- Geometría ----------
// Pinta cada vértice con una función (x, y, z) → color.
function paint(geo, fn) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i)).toArray(col, i * 3); }
  geo.setAttribute('color', new T.BufferAttribute(col, 3)); return geo;
}
const solid = hex => () => C.set(hex);
function merge(parts) { return mergeGeometries(parts.map(g => { const n = g.index ? g.toNonIndexed() : g; if (!n.attributes.uv) n.setAttribute('uv', new T.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; })); }
// Silueta de la roca vista de frente: plana arriba, baja recta y luego se angosta (con bultos) hasta la punta.
function rockShape(a, b, top, depth, taper, r, inset = 0, bumps = .14) {
  const S = { taper }, from = taper ? taper.from : depth, n = 9, sh = new T.Shape();
  const side = (sign, i) => { const y = -from - (depth - from) * (i / n), cut = taperCut(S, y), bump = i > 0 && i < n ? (r() - .5) * bumps * 2 : 0; return [sign < 0 ? a + cut + inset + bump : b - cut - inset + bump, Math.max(-depth + inset, y)]; };
  sh.moveTo(a + inset, top - inset); sh.lineTo(a + inset, -from + .1);
  for (let i = 1; i <= n; i++) { const [x, y] = side(-1, i); sh.lineTo(x, y); }
  const [xl] = side(-1, n), [xr] = side(1, n), cx = (xl + xr) / 2;
  sh.quadraticCurveTo(cx, -depth - .9 + inset, xr, -depth + inset);
  for (let i = n - 1; i >= 1; i--) { const [x, y] = side(1, i); sh.lineTo(x, y); }
  sh.lineTo(b - inset, -from + .1); sh.lineTo(b - inset, top - inset); sh.lineTo(a + inset, top - inset);
  return sh;
}
// Roca de una isla con relieve redondeado, textura y color que se oscurece hacia abajo.
function rockBody(a, b, top, depth, taper, zDepth, pal, r, tex, extra = {}) {
  const bevel = extra.bevel ?? .32;
  const geo = new T.ExtrudeGeometry(rockShape(a, b, top, depth, taper, r, bevel), { depth: zDepth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, -(zDepth - bevel * 2) / 2);
  paint(geo, (x, y, z) => { const k = smooth(0, depth, -y); lerpHex(pal.rock[0], pal.rock[1], k * 1.6); if (k > .55) C.lerp(C2.set(pal.rock[2]), (k - .55) / .45); if (z < -zDepth * .3) C.multiplyScalar(.86); return C; });
  const m = new T.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: .9, metalness: 0, ...(extra.mat || {}) });
  const mesh = new T.Mesh(geo, m); mesh.castShadow = false; mesh.receiveShadow = true; return mesh;
}
// Tapa de pasto (o de piedra) con el borde de abajo que chorrea en gotas redondas.
function capShape(a, b, top, thick, r, drip = 1) {
  const sh = new T.Shape(), base = top - thick * .55, n = Math.max(6, Math.round((b - a) / .5));
  sh.moveTo(a, top); sh.lineTo(b, top); sh.lineTo(b, base);
  for (let i = 0; i < n; i++) {
    const x1 = b - (b - a) * (i + 1) / n, xm = b - (b - a) * (i + .5) / n, big = r() < .42;
    const drop = (big ? thick * (.9 + r() * 1.1) : thick * (.15 + r() * .35)) * drip;
    sh.quadraticCurveTo(xm, base - drop * 1.6, x1, base);
  }
  sh.lineTo(a, top); return sh;
}
function capMesh(a, b, top, thick, zDepth, colors, r, mat, drip = 1) {
  const bevel = .09;
  const geo = new T.ExtrudeGeometry(capShape(a + bevel, b - bevel, top - bevel, thick, r, drip), { depth: zDepth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 });
  geo.translate(0, 0, -(zDepth - bevel * 2) / 2);
  paint(geo, (x, y) => { const k = smooth(top - .02, top - thick * 1.8, y); lerpHex(colors[0], colors[1], k * 2); if (k > .5) C.lerp(C2.set(colors[2]), (k - .5) * 2); return C; });
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; return mesh;
}
// Árbol redondo: tronco y copa de varias bolas con dos tonos.
function treeGeo(r, s, pal) {
  const trunk = new T.CylinderGeometry(.11 * s, .2 * s, 1.7 * s, 10); trunk.translate(0, .85 * s, 0); paint(trunk, solid(pal.trunk));
  const parts = [trunk];
  for (const [x, y, z, rad] of [[0, 2.05, 0, 1], [.6, 1.8, .15, .72], [-.58, 1.85, -.1, .74], [.1, 2.65, -.05, .7], [0, 1.85, .5, .62], [-.3, 2.4, .35, .55]]) {
    const g = new T.IcosahedronGeometry(rad * s * (.92 + r() * .16), 2); g.translate(x * s, y * s, z * s);
    paint(g, (px, py) => lerpHex(pal.leaves[2], pal.leaves[0], smooth(1.3 * s, 3.1 * s, py + rnd01(r) * .2))); parts.push(g);
  }
  return merge(parts);
}
const rnd01 = r => r() - .5;
function bushGeo(r, s, cols) {
  const parts = []; for (let i = 0; i < 4; i++) { const g = new T.IcosahedronGeometry((.45 + r() * .25) * s, 2); g.translate((i - 1.5) * .42 * s, (.25 + r() * .15) * s, rnd01(r) * .3 * s); paint(g, (x, y) => lerpHex(cols[2], cols[0], smooth(0, .8 * s, y))); parts.push(g); }
  return merge(parts);
}
// Nube esponjosa: bolas juntas con la base aplanada.
function cloudGeo(r, n = 7) {
  const parts = [];
  for (let i = 0; i < n; i++) { const rad = .55 + r() * .6, mid = Math.abs(i - (n - 1) / 2); const g = new T.IcosahedronGeometry(rad, 2); g.translate((i - (n - 1) / 2) * .62 + rnd01(r) * .2, Math.max(0, .55 - mid * .14) + r() * .2, rnd01(r) * .6); parts.push(g); }
  const geo = merge(parts), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -.15) p.setY(i, -.15 + (y + .15) * .25); }
  geo.computeVertexNormals(); return geo;
}

// ---------- Fondos pintados ----------
// Cordilleras en capas con nieve y bruma, pintadas en un lienzo largo.
function rangeTex(pal, seed, { snow = true, glow = null } = {}) {
  const r = rng(seed);
  return canvasTex(2048, 640, (g, w, h) => {
    const layers = [[.42, .26, pal.far[2], 1], [.56, .2, pal.far[1], 2], [.7, .14, pal.far[0], 3]];
    for (const [base, amp, col, li] of layers) {
      const ph = [r() * 6.28, r() * 6.28, r() * 6.28], ridge = x => { const u = x / w; return h * (base - amp * (.55 * Math.abs(Math.sin(u * Math.PI * (2 + li) + ph[0])) + .3 * Math.sin(u * Math.PI * (7 + li) + ph[1]) * .5 + .15 * Math.sin(u * Math.PI * 17 + ph[2]))); };
      g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, ridge(x)); g.lineTo(w, h); g.closePath();
      const gr = g.createLinearGradient(0, h * (base - amp), 0, h); gr.addColorStop(0, col); gr.addColorStop(1, C.set(col).lerp(C2.set(pal.fog), .55).getStyle()); g.fillStyle = gr; g.fill();
      if (snow && li < 3) { g.save(); g.clip(); const top = h * (base - amp * .62); const sg = g.createLinearGradient(0, h * (base - amp), 0, top); sg.addColorStop(0, 'rgba(255,255,255,.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, top); g.restore(); }
      if (glow) { g.save(); g.clip(); const gg = g.createLinearGradient(0, h * base, 0, h); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, glow); g.fillStyle = gg; g.fillRect(0, 0, w, h); g.restore(); }
    }
    const haze = g.createLinearGradient(0, h * .55, 0, h); haze.addColorStop(0, 'rgba(0,0,0,0)'); haze.addColorStop(1, C.set(pal.fog).getStyle()); g.fillStyle = haze; g.fillRect(0, h * .55, w, h * .45);
  }, 0);
}

// ---------- Armado de cada escenario ----------
export function buildStage(view, id) {
  const pal = PALETTES[id] || PALETTES.isla, S = view.S, root = new T.Group(), anim = [], own = x => view.own(x), r = rng(id.length * 977 + 13);
  view.root.add(root);
  const [a, b] = S.main, D = S.depth, w = b - a, c = (a + b) / 2;
  // "solid": la roca, el piso, las plataformas y lo que está encima (se cambia por el modelo hecho en Blender si hay).
  const solid = new T.Group(); solid.name = 'solido'; root.add(solid);
  const add = (geo, mat, pos = [0, 0, 0], shadow = false, parent = solid) => { const m = new T.Mesh(own(geo), mat); m.position.set(...pos); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
  const leafMat = own(new T.MeshStandardMaterial({ vertexColors: true, roughness: .8 }));
  const cloudMat = own(new T.MeshStandardMaterial({ color: pal.cloud, roughness: 1, emissive: pal.cloudGlow, emissiveIntensity: .32 }));
  const glowMat = (hex, k = 1.4) => own(new T.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: .4 }));

  // Fondo pintado lejano (cordilleras) y nubes que pasan.
  const far = new T.Mesh(own(new T.PlaneGeometry(440, 137)), own(new T.MeshBasicMaterial({ map: own(rangeTex(pal, 7, { snow: id === 'isla', glow: id === 'volcan' ? 'rgba(255,90,30,.55)' : id === 'templo' ? 'rgba(255,170,120,.35)' : null })), transparent: true, depthWrite: false, fog: false })));
  far.position.set(0, id === 'templo' ? -2 : 4, -150); far.renderOrder = -5; root.add(far);
  const farX = far.position.x;
  anim.push(() => { far.position.x = farX + view.cam.x * .55; });
  const cloudGeos = [0, 1, 2].map(k => own(cloudGeo(rng(31 + k), 6 + k)));
  for (let i = 0; i < 12; i++) {
    const cl = new T.Mesh(cloudGeos[i % 3], cloudMat), s = 2.6 + r() * 2.8, x0 = -90 + i * 16 + r() * 8, y = 11 + r() * 13, z = -40 - r() * 50;
    cl.scale.set(s * 1.2, s, s); cl.position.set(x0, y, z); root.add(cl);
    anim.push(t => { cl.position.x = ((x0 + t * .9 + 100) % 200 + 200) % 200 - 100; });
  }
  // Mar de nubes debajo del escenario (o humo en el volcán).
  const sea = new T.InstancedMesh(own(new T.IcosahedronGeometry(1, 2)), id === 'volcan' ? own(new T.MeshStandardMaterial({ color: '#5a3532', roughness: 1, emissive: '#ff5a1e', emissiveIntensity: .22 })) : cloudMat, 170);
  const dummy = new T.Object3D();
  for (let i = 0; i < 170; i++) { const row = i % 5, s = 2.6 + r() * 3.4 + row * .6; dummy.position.set(-95 + r() * 190, -15.5 - row * 1.4 + r() * 1.5, 6 - row * 12 - r() * 8); dummy.scale.set(s * 1.3, s * .62, s); dummy.updateMatrix(); sea.setMatrixAt(i, dummy.matrix); }
  root.add(sea); own(sea);

  // Roca principal: igual de ancha y profunda que el choque del juego.
  const tex = id === 'templo' ? own(marbleTex(5)) : own(rockTex(id === 'volcan' ? 11 : 3, id === 'volcan' ? { base: '#d8ccc8', dark: 'rgba(20,10,10,', light: 'rgba(255,240,230,', veins: 'rgba(10,5,5,' } : {}));
  tex.repeat.set(.24, .24);
  const extra = id === 'volcan' ? { mat: { emissive: '#ffffff', emissiveMap: own(lavaVeinsTex(4)), emissiveIntensity: 1.1 } } : {};
  if (extra.mat) extra.mat.emissiveMap.repeat.set(.18, .18);
  const body = rockBody(a, b, -.18, D, S.taper, 4.6, pal, r, tex, extra); solid.add(body); own(body.geometry); own(body.material);
  // Tapa de arriba: pasto que chorrea (isla), basalto con borde encendido (volcán) o mármol con borde dorado (templo).
  const capTex = id === 'isla' ? own(grassTex(9)) : tex;
  const capMat = own(new T.MeshStandardMaterial({ vertexColors: true, map: capTex, roughness: id === 'templo' ? .45 : .85 }));
  if (capTex === tex) { /* misma textura repetida */ } else capTex.repeat.set(.5, .5);
  const cap = capMesh(a - .3, b + .3, .015, .34, 4.95, id === 'isla' ? pal.grass : pal.stone.concat(pal.stone[1]), r, capMat, id === 'isla' ? 1 : .25); solid.add(cap); own(cap.geometry);
  if (id === 'templo') { const trim = add(new T.BoxGeometry(w + .7, .1, .12), own(new T.MeshStandardMaterial({ color: pal.gold, metalness: .7, roughness: .3, emissive: pal.gold, emissiveIntensity: .12 })), [c, -.2, 2.52]); trim.castShadow = false; }
  if (id === 'volcan') {
    const edge = own(new T.BoxGeometry(w + .55, .06, .06)), lava = glowMat('#ff7a1a', 1.6);
    add(edge, lava, [c, -.24, 2.5]); add(edge, lava, [c, -.24, -2.5]);
  }
  // Plataformas: roquitas flotantes con su tapa.
  for (const [pa, pb, h] of S.plats) {
    const pw = pb - pa, pc = (pa + pb) / 2;
    // Roca de la plataforma: va de h-0.16 hasta casi h-1.2 (se arma con el piso en 0 y se sube).
    const pg = new T.ExtrudeGeometry(rockShape(pa + .05, pb - .05, 0, .95, { from: .35, slope: Math.min(1.6, pw * .22) }, r, .2, .06), { depth: 2.1, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelSegments: 3, curveSegments: 8 });
    pg.translate(0, h - .16, -1.05);
    paint(pg, (x, y) => { const k = smooth(h - .16, h - 1.4, y); lerpHex(pal.rock[0], pal.rock[1], k * 1.4); if (k > .6) C.lerp(C2.set(pal.rock[2]), (k - .6) * 2.5); return C; });
    add(pg, own(new T.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: .9, ...(extra.mat || {}) })));
    const pcap = capMesh(pa - .12, pb + .12, h + .015, .24, 2.7, id === 'isla' ? pal.grass : pal.stone.concat(pal.stone[1]), r, capMat, id === 'isla' ? .8 : .2); solid.add(pcap); own(pcap.geometry);
    const crystal = add(new T.OctahedronGeometry(.2, 0), glowMat(id === 'volcan' ? '#ff8a2a' : id === 'templo' ? pal.gold : '#7fe6ff', 1.2), [pc, h - 1.55, 0]); crystal.scale.y = 1.6;
    anim.push(t => { crystal.rotation.y = t * 1.4 + pc; crystal.position.y = h - 1.55 + Math.sin(t * 2 + pc) * .06; });
  }

  if (id === 'isla') {
    // Árboles redondos, arbustos, hongos, flores y un arco de piedra con cristal atrás.
    for (const [x, s] of [[a + 1.2, 1.05], [b - 1.5, 1.2], [c + 3.4, .85], [c - 3.3, .75]]) { const t = add(treeGeo(r, s, pal), leafMat, [x, 0, -1.85 - r() * .3], true); t.rotation.y = r() * 6; }
    for (let i = 0; i < 7; i++) { const bu = add(bushGeo(r, .8 + r() * .5, pal.leaves), leafMat, [a + 1 + i * (w - 2) / 6 + rnd01(r), 0, -2.05], true); bu.rotation.y = r() * 3; }
    const stoneMat = own(new T.MeshStandardMaterial({ map: tex, color: '#f1e7d6', roughness: .8 }));
    for (const s of [-1, 1]) add(new T.BoxGeometry(.6, 2.6, .6), stoneMat, [c + s * 1.35, 1.3, -2.15], true);
    add(new T.BoxGeometry(3.5, .5, .75), stoneMat, [c, 2.75, -2.15], true);
    const gem = add(new T.OctahedronGeometry(.32, 0), glowMat('#7fe6ff', 1.5), [c, 3.45, -2.15]); gem.scale.y = 1.5;
    anim.push(t => { gem.rotation.y = t; gem.position.y = 3.45 + Math.sin(t * 1.6) * .08; });
    const capG = own(new T.SphereGeometry(.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), stemG = own(new T.CylinderGeometry(.09, .12, .3, 10));
    const capRed = own(new T.MeshStandardMaterial({ color: '#ff5a4a', roughness: .5 })), stemMat = own(new T.MeshStandardMaterial({ color: '#fff3dc', roughness: .7 }));
    for (const [x, z, s] of [[a + 2.4, 1.9, .9], [b - 2.6, -1.4, 1.1], [c + 1.6, -1.6, .7]]) { const m = new T.Group(); const st = new T.Mesh(stemG, stemMat); st.position.y = .15; const cp = new T.Mesh(capG, capRed); cp.position.y = .28; cp.scale.y = .8; m.add(st, cp); m.position.set(x, 0, z); m.scale.setScalar(s); m.traverse(o => { o.castShadow = true; }); solid.add(m); }
    const petal = own(new T.SphereGeometry(1, 8, 6)), flowers = new T.InstancedMesh(petal, own(new T.MeshStandardMaterial({ roughness: .6 })), 70), cols = ['#ffffff', '#ffe36e', '#ff9ac4', '#c7b2ff', '#ffb36b'].map(x => new T.Color(x));
    for (let i = 0; i < 70; i++) { const front = i % 2; dummy.position.set(a + .4 + r() * (w - .8), .06, front ? 1.7 + r() * .6 : -1.4 - r() * .7); dummy.scale.set(.07, .045, .07); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, cols[i % 5]); }
    solid.add(flowers); own(flowers);
    // Cascada que cae por detrás hasta el mar de nubes.
    const fallMat = own(new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { time: view.e.time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float time; varying vec2 vUv; void main(){ float s = sin(vUv.x * 31. + sin(vUv.y * 4.) * 2.) * .5 + .5; float f = fract(vUv.y * 5. + time * 1.5 + s * .3); float edge = smoothstep(0., .14, vUv.x) * smoothstep(1., .86, vUv.x); float a = (.62 + .35 * smoothstep(.5, 1., f)) * edge * smoothstep(0., .25, vUv.y); gl_FragColor = vec4(mix(vec3(.62, .86, 1.), vec3(1.), f * .5 + s * .25), a); }' }));
    const fall = new T.Mesh(own(new T.PlaneGeometry(1.3, 15)), fallMat); fall.position.set(b - 2.2, -7.4, -2.8); root.add(fall);
    anim.push((t, dt) => { if (Math.random() < dt * 8) view.smoke.emit(b - 2.2 + (Math.random() - .5) * 1.6, -14.6, -2.8, (Math.random() - .5) * .8, .5, 0, 1.8, '#f2f9ff', 1.2, 3.2, .8); });
    // Islitas lejanas con un árbol.
    for (let i = 0; i < 6; i++) {
      const g = new T.Group(), s = .5 + r() * .45, x = -48 + i * 19 + rnd01(r) * 6, y = -2 + r() * 9, z = -30 - r() * 22;
      const ig = new T.ExtrudeGeometry(rockShape(-2, 2, 0, 3.2, { from: .5, slope: .55 }, r, .2), { depth: 2.4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelSegments: 2, curveSegments: 6 });
      ig.translate(0, 0, -1.2); paint(ig, (px, py) => { lerpHex(pal.rock[0], pal.rock[2], smooth(0, 3.2, -py)); return C; });
      const isl = new T.Mesh(own(ig), own(new T.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: .9 }))); g.add(isl);
      const top = capMesh(-2.2, 2.2, .05, .3, 2.9, pal.grass, r, capMat); own(top.geometry); g.add(top);
      const tr = new T.Mesh(own(treeGeo(r, .9, pal)), leafMat); tr.position.z = -.3; g.add(tr);
      g.scale.setScalar(s); g.position.set(x, y, z); root.add(g);
      anim.push(t => { g.position.y = y + Math.sin(t * .5 + i * 1.7) * .5; g.rotation.y = Math.sin(t * .2 + i) * .15; });
    }
  }
  if (id === 'volcan') {
    // Columnas de basalto, cristales oscuros, humo y brasas; volcán al fondo con columna de humo.
    const hex = own(new T.CylinderGeometry(1, 1, 1, 6)), basalt = own(new T.MeshStandardMaterial({ map: tex, color: '#4a3c38', roughness: .85 }));
    for (let i = 0; i < 10; i++) { const x = a + .9 + i * (w - 1.8) / 9 + rnd01(r) * .4, h = .7 + r() * 1.6; const m = add(hex, basalt, [x, h / 2, -2 - r() * .3], true); m.scale.set(.32 + r() * .1, h, .32 + r() * .1); m.rotation.y = r(); }
    for (const x of [a + 3.1, b - 3.3, c + .5]) { const cr = add(new T.OctahedronGeometry(.3, 0), glowMat('#b05cff', .8), [x, .45, -1.55], true); cr.scale.set(.8, 1.7, .8); cr.rotation.z = rnd01(r) * .5; }
    for (const x of [a + 2.2, c + .8, b - 2]) anim.push((t, dt) => { if (Math.random() < dt * 3) view.smoke.emit(x + (Math.random() - .5) * .4, .6, -2, (Math.random() - .5) * .3, 1.2, 0, 2.6, '#5a4744', .5, 2.4, .5); if (Math.random() < dt * 4) view.sparks.emit(x, .4, -1.9, (Math.random() - .5), 3 + Math.random() * 2, 0, 1, '#ffb04a', .12, .05); });
    const vol = new T.Mesh(own(new T.CylinderGeometry(7, 46, 38, 32, 4)), own(new T.MeshStandardMaterial({ color: '#2a1a1c', roughness: 1 }))); vol.position.set(14, -4, -120); vol.scale.z = .55; root.add(vol);
    const crater = add(new T.CylinderGeometry(6.6, 6.6, .6, 32), glowMat('#ff6a1a', 2.2), [14, 15.1, -120], false, root); crater.scale.z = .55;
    const glow = view.sprite('#ff7a2a', 34); glow.position.set(14, 16.5, -118); root.add(glow);
    anim.push((t, dt) => { glow.material.opacity = .7 + Math.sin(t * 1.6) * .15; if (Math.random() < dt * 4) view.smoke.emit(14 + (Math.random() - .5) * 6, 17, -119, (Math.random() - .5) * 1.5 + 1, 4 + Math.random() * 2, 0, 7, ['#7a5a54', '#6a4c48', '#8a6a60'][Math.floor(Math.random() * 3)], 5, 16, .4); });
    const lavaMat = own(new T.ShaderMaterial({ uniforms: { time: view.e.time }, fog: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float time; varying vec3 vW; void main(){ vec2 p = vW.xz * .07; float n = sin(p.x * 3. + time * .35) * sin(p.y * 4. - time * .27) + sin((p.x + p.y) * 7. + time * .6) * .5 + sin(p.x * 13. - p.y * 9. + time) * .2; vec3 c = mix(vec3(.45, .05, .02), vec3(1., .5, .1), smoothstep(-.4, 1.1, n)); c += vec3(1., .85, .45) * smoothstep(.95, 1.5, n);\ngl_FragColor = vec4(c, 1.);\n#include <colorspace_fragment>\n}' }));
    const lavaSea = new T.Mesh(own(new T.PlaneGeometry(500, 260)), lavaMat); lavaSea.rotation.x = -Math.PI / 2; lavaSea.position.set(0, -24, -90); root.add(lavaSea);
    // Chorro de lava que cae por detrás del escenario hasta el mar de lava.
    const fallLava = own(new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { time: view.e.time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float time; varying vec2 vUv; void main(){ float s = sin(vUv.x * 23. + sin(vUv.y * 3.) * 2.) * .5 + .5; float f = fract(vUv.y * 3. + time * .55 + s * .25); float edge = smoothstep(0., .2, vUv.x) * smoothstep(1., .8, vUv.x); float a = edge * smoothstep(0., .15, vUv.y) * smoothstep(1., .97, vUv.y); vec3 c = mix(vec3(.85, .16, .02), vec3(1., .7, .22), f * .55 + s * .35); gl_FragColor = vec4(c, a);\n#include <colorspace_fragment>\n}' }));
    for (const [x, wd] of [[a + 2.6, 1.2], [b - 3.4, .8]]) { const lf = new T.Mesh(own(new T.PlaneGeometry(wd, 15.5)), fallLava); lf.position.set(x, -7.6, -2.75); root.add(lf); }
    anim.push((t, dt) => { if (Math.random() < dt * 26) view.sparks.emit(view.cam.x + (Math.random() - .5) * 44, -12 + (Math.random() - .5) * 4, Math.random() * 14 - 10, (Math.random() - .5) * .8, 2.6 + Math.random() * 2.4, 0, 4, Math.random() < .6 ? '#ff8a3a' : '#ffd25c', .16, .06); });
  }
  if (id === 'templo') {
    // Columnas de mármol (algunas rotas), una puerta grande con un sol dorado y estandartes.
    const marble = own(new T.MeshStandardMaterial({ map: tex, color: '#fbf3ea', roughness: .45 })), gold = own(new T.MeshStandardMaterial({ color: pal.gold, metalness: .75, roughness: .28, emissive: pal.gold, emissiveIntensity: .1 }));
    const shaft = own(new T.CylinderGeometry(.36, .4, 1, 18, 1)), ring = own(new T.CylinderGeometry(.52, .52, .22, 18)), box = own(new T.BoxGeometry(1, 1, 1));
    for (let i = 0; i < 8; i++) {
      const x = a + 1 + i * (w - 2) / 7; if (Math.abs(x - c) < 2) continue; const broken = i % 3 === 1, h = broken ? 1.4 + r() * 1.2 : 3.6;
      add(ring, marble, [x, .11, -2.1], true); const sh = add(shaft, marble, [x, .22 + h / 2, -2.1], true); sh.scale.y = h;
      if (!broken) { const capt = add(box, marble, [x, h + .34, -2.1], true); capt.scale.set(1.05, .26, 1.05); }
      else { const chunk = add(box, marble, [x + .5, .16, -1.6], true); chunk.scale.set(.5, .32, .45); chunk.rotation.y = r(); }
    }
    for (const s of [-1, 1]) { const p = add(box, marble, [c + s * 1.55, 2.3, -2.25], true); p.scale.set(.75, 4.6, .75); }
    const lintel = add(box, marble, [c, 4.85, -2.25], true); lintel.scale.set(4.2, .55, .9);
    const sun = add(new T.CylinderGeometry(.62, .62, .12, 32), gold, [c, 3.55, -2.15], true); sun.rotation.x = Math.PI / 2;
    const rays = own(new T.BoxGeometry(.1, .5, .08)); for (let k = 0; k < 12; k++) { const ray = add(rays, gold, [c + Math.cos(k / 12 * 6.28) * .9, 3.55 + Math.sin(k / 12 * 6.28) * .9, -2.13]); ray.rotation.z = k / 12 * 6.28 - Math.PI / 2; }
    const halo = view.sprite('#ffd27a', 4.2); halo.position.set(c, 3.55, -2); root.add(halo);  // también brilla con el modelo de Blender
    anim.push(t => { halo.material.opacity = .55 + Math.sin(t * 1.4) * .15; sun.rotation.y = Math.sin(t * .8) * .2; });
    const banner = own(new T.PlaneGeometry(.8, 2.2, 1, 8)), bannerMat = own(new T.MeshStandardMaterial({ color: '#c8324a', side: T.DoubleSide, roughness: .7 }));
    for (const s of [-1, 1]) { const bn = add(banner, bannerMat, [c + s * 1.55, 3.2, -1.82]); anim.push(t => { bn.rotation.y = Math.sin(t * 1.3 + s) * .12; }); }
    for (let i = 0; i < 9; i++) { const bu = add(bushGeo(r, .55 + r() * .3, pal.leaves), leafMat, [a + .8 + r() * (w - 1.6), 0, -2.45], true); bu.rotation.y = r() * 3; }
    // Ruinas que flotan lejos.
    for (let i = 0; i < 6; i++) {
      const g = new T.Group(), s = .6 + r() * .6, x = -50 + i * 20 + rnd01(r) * 6, y = 1 + r() * 9, z = -32 - r() * 20;
      const ig = new T.ExtrudeGeometry(rockShape(-2, 2, 0, 2.6, { from: .4, slope: .6 }, r, .2), { depth: 2.4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelSegments: 2, curveSegments: 6 });
      ig.translate(0, 0, -1.2); paint(ig, (px, py) => { lerpHex(pal.rock[0], pal.rock[2], smooth(0, 2.6, -py)); return C; });
      g.add(new T.Mesh(own(ig), marble));
      const col = new T.Mesh(shaft, marble); col.scale.y = 2.4; col.position.set(-.8, 1.2, 0); g.add(col);
      const col2 = new T.Mesh(shaft, marble); col2.scale.y = 1.1; col2.position.set(.9, .55, 0); g.add(col2);
      g.scale.setScalar(s); g.position.set(x, y, z); root.add(g);
      anim.push(t => { g.position.y = y + Math.sin(t * .45 + i * 1.3) * .6; g.rotation.y = Math.sin(t * .18 + i) * .2; });
    }
    // Pétalos que vuelan con la luz del atardecer.
    anim.push((t, dt) => { if (Math.random() < dt * 6) view.twinkles.emit(view.cam.x + 14, 2 + Math.random() * 9, (Math.random() - .5) * 6, -2 - Math.random() * 1.5, -.3, 0, 7, ['#ffd1dc', '#ffe6a8', '#ffffff'][Math.floor(Math.random() * 3)], .22, .18); });
  }
  if (id !== 'volcan') {
    // Pajaritos lejanos.
    const birdMat = own(new T.MeshStandardMaterial({ color: id === 'templo' ? '#5a3a4a' : '#4a5a6e' })), wingG = own(new T.BoxGeometry(.9, .06, .3));
    for (let i = 0; i < 4; i++) {
      const bird = new T.Group(), wings = [-1, 1].map(s => { const m = new T.Mesh(wingG, birdMat); m.position.x = s * .42; bird.add(m); return m; });
      const y = 13 + i * 2.5, z = -45 - i * 8, sp = 3 + i * .7, off = i * 70; root.add(bird);
      anim.push(t => { const k = Math.sin(t * 9 + i); wings[0].rotation.z = k * .6; wings[1].rotation.z = -k * .6; bird.position.set(((t * sp + off) % 220) - 110, y + Math.sin(t * .8 + i) * 1.5, z); });
    }
  }
  // Si el escenario tiene modelo hecho en Blender, reemplaza la parte sólida apenas cargue (normalmente ya está listo).
  const stage = { pal, root, solid, model: null, update: (t, dt) => { for (const fn of anim) fn(t, dt); } };
  const use = model => { if (!model || view.disposed) return; solid.visible = false; model.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = !/matas|flores/.test(o.name); } }); root.add(model); stage.model = model; };
  // Chispas de los braseros del templo de Blender (x ±3, y 1.3, z -1.55).
  if (id === 'templo') anim.push((t, dt) => { if (stage.model && Math.random() < dt * 5) { const x = (Math.random() < .5 ? -3 : 3) + (Math.random() - .5) * .25; view.sparks.emit(x, 1.4, -1.55, (Math.random() - .5) * .4, 1.6 + Math.random() * 1.4, 0, .9, Math.random() < .5 ? '#ffb04a' : '#ffd27a', .1, .04); } });
  const ready = stageModelNow(id); if (ready) use(ready.clone(true)); else loadStageModel(id).then(m => m && use(m.clone(true)));
  return stage;
}
