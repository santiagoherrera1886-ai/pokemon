// Cabeza y cara de los personajes 3D (dirección aprobada: aventura anime 3D).
// La cabeza es un torneado en forma de huevo (cráneo redondo, mentón fino) y la cara se pinta en una
// calcomanía que calza exacta sobre el frente de esa misma cabeza. Así los ojos quedan integrados:
// almendrados, con iris en degradé, pupila, sombra del párpado, brillos y línea de pestañas; cejas
// diseñadas, nariz y boca pequeñas, rubor y, según el personaje, pecas o arrugas.
// Cada cara tiene dos texturas (ojos abiertos y cerrados) para parpadear sin tocar la geometría.
import * as T from 'three';

// Perfil de la cabeza (radio, altura) desde el mentón hasta la coronilla. El centro del cráneo es y = 0.
const PROFILE = [[0, -.192], [.03, -.19], [.065, -.178], [.097, -.155], [.124, -.12], [.146, -.074], [.16, -.025],
  [.166, .025], [.164, .072], [.152, .113], [.128, .148], [.09, .174], [.046, .187], [0, .191]];
const DENSE = new T.SplineCurve(PROFILE.map(([x, y]) => new T.Vector2(x, y))).getSpacedPoints(56);
DENSE[0].set(0, -.192); DENSE[DENSE.length - 1].set(0, .191);

// Radio de la cabeza a una altura dada (interpolando el perfil).
export function headRadius(y) {
  if (y <= DENSE[0].y) return 0;
  for (let i = 1; i < DENSE.length; i++) {
    const a = DENSE[i - 1], b = DENSE[i];
    if (y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / Math.max(1e-6, b.y - a.y));
  }
  return 0;
}

// Zona pintada: de la barbilla a la frente, y ±A radianes alrededor del frente.
const A = 1.2, YB = -.178, YT = .1, SIZE = 256;
const RE = headRadius(-.03);                       // radio a la altura de los ojos
const SX = SIZE / (2 * A * RE), SY = SIZE / (YT - YB); // píxeles por unidad cerca de los ojos

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let headGeo = null, faceGeo = null;

// Malla del cráneo: el torneado más un ajuste atrás (nuca más estrecha abajo, cráneo un poco más lleno arriba).
export function headGeometry() {
  if (headGeo) return headGeo;
  const g = new T.LatheGeometry(DENSE, 36, Math.PI, Math.PI * 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), z = p.getZ(i);
    if (z < 0) p.setZ(i, z * (1 - .38 * smooth(-.02, -.19, y)) * (1 + .07 * smooth(-.02, .1, y)));
  }
  g.computeVertexNormals();
  return headGeo = g;
}

// Calcomanía de la cara: la misma superficie un pelo más afuera, con UV calculadas desde la posición.
export function faceGeometry() {
  if (faceGeo) return faceGeo;
  const pts = [];
  for (let i = 0; i <= 28; i++) { const y = YB + (YT - YB) * i / 28; pts.push(new T.Vector2(headRadius(y) * 1.006 + .0004, y)); }
  const g = new T.LatheGeometry(pts, 30, -A, 2 * A), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    uv.setXY(i, (Math.atan2(x, z) + A) / (2 * A), (y - YB) / (YT - YB));
  }
  return faceGeo = g;
}

// Punto de la cara (x, y en unidades de la cabeza, vista de frente) en píxeles de la textura.
function P(x, y) {
  const r = Math.max(.02, headRadius(y));
  const phi = Math.asin(Math.max(-.99, Math.min(.99, x / r)));
  return [SIZE / 2 + phi / A * SIZE / 2, (YT - y) * SY];
}
const hex = c => new T.Color(c);
const tone = (c, f) => { const k = hex(c); return '#' + (f > 0 ? k.lerp(new T.Color('#ffffff'), f) : k.multiplyScalar(1 + f)).getHexString(); };
const rgba = (c, a) => { const k = hex(c); return `rgba(${Math.round(k.r * 255)},${Math.round(k.g * 255)},${Math.round(k.b * 255)},${a})`; };

// Expresiones: inclinación de cejas (+ = ceño decidido, − = gesto amable), grosor de cejas, alto del ojo,
// párpado caído, boca y rubor.
const EXPR = {
  bold: { tilt: .32, bw: 1.15, eh: 1, lid: .04, mouth: 'smile', blush: .18 },
  smirk: { tilt: .38, bw: 1.1, eh: .92, lid: .14, mouth: 'smirk', blush: .1 },
  kind: { tilt: -.3, bw: .85, eh: 1, lid: .06, mouth: 'smile', blush: .32, arch: .5 },
  calm: { tilt: .05, bw: .9, eh: .92, lid: .16, mouth: 'small', blush: .14 },
  cheer: { tilt: -.12, bw: .95, eh: 1.04, lid: 0, mouth: 'open', blush: .3, arch: .3 },
  grin: { tilt: -.08, bw: 1.05, eh: 1.02, lid: 0, mouth: 'grin', blush: .3, arch: .2 },
  stern: { tilt: .5, bw: 1.35, eh: .82, lid: .22, mouth: 'flat', blush: 0 },
  cool: { tilt: .12, bw: .9, eh: .88, lid: .3, mouth: 'small', blush: .08, arch: .2 },
  old: { tilt: -.1, bw: 1.5, eh: .62, lid: .3, mouth: 'smile', blush: .12, arch: .3 }
};

function bez(a, c1, c2, b, t) {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
    u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]];
}

// Un ojo (cx, cy en unidades de la cabeza; s = 1 a la izquierda del personaje, -1 a la derecha).
function eye(g, cx, cy, s, F, closed) {
  const E = EXPR[F.face] || EXPR.calm, w = .07 * (F.ew || 1), h = .064 * E.eh * (F.eh || 1);
  const inner = [cx - s * w * .5, cy - h * .12], outer = [cx + s * w * .52, cy - h * .02];
  const lid = E.lid * h;
  const up1 = [cx - s * w * .36, cy + h * .62 - lid], up2 = [cx + s * w * .32, cy + h * .7 - lid * 1.3];
  const lo1 = [cx + s * w * .3, cy - h * .66], lo2 = [cx - s * w * .32, cy - h * .6];
  const lash = '#2a1c1a', N = 14;
  const upper = Array.from({ length: N + 1 }, (_, i) => bez(inner, up1, up2, outer, i / N));
  const lower = Array.from({ length: N + 1 }, (_, i) => bez(outer, lo1, lo2, inner, i / N));
  const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); };
  if (closed) {
    // Ojo cerrado: la línea de pestañas curvada hacia abajo y una sombra suave debajo.
    const mid = [cx + s * w * .02, cy - h * .32];
    const arc = Array.from({ length: N + 1 }, (_, i) => bez(inner, [inner[0] + s * w * .25, mid[1]], [outer[0] - s * w * .25, mid[1]], outer, i / N));
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = lash; g.lineWidth = .011 * SY; path(arc); g.stroke();
    g.strokeStyle = 'rgba(120,60,50,.25)'; g.lineWidth = .006 * SY;
    path(arc.map(([x, y]) => [x, y - .012])); g.stroke();
    return;
  }
  // Blanco del ojo con forma de almendra.
  path([...upper, ...lower]); g.closePath();
  g.fillStyle = '#fbf7f0'; g.fill();
  g.save(); g.clip();
  // Iris en degradé (oscuro arriba, claro abajo), pupila y sombra del párpado.
  const ic = [cx + s * w * .03, cy - h * .06], [ix, iy] = P(...ic), irx = w * .33 * SX, iry = h * .54 * SY;
  const grad = g.createLinearGradient(ix, iy - iry, ix, iy + iry);
  grad.addColorStop(0, tone(F.iris, -.55)); grad.addColorStop(.45, F.iris); grad.addColorStop(1, tone(F.iris, .42));
  g.fillStyle = grad; g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = tone(F.iris, -.6); g.lineWidth = .0035 * SY; g.stroke();
  g.fillStyle = tone(F.iris, -.8); g.beginPath(); g.ellipse(ix, iy - iry * .08, irx * .44, iry * .48, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = rgba(tone(F.iris, .5), .55); g.beginPath(); g.ellipse(ix, iy + iry * .55, irx * .55, iry * .22, 0, 0, Math.PI * 2); g.fill();
  const [ux, uy] = P(cx, cy + h * .55), shadow = g.createLinearGradient(ux, uy, ux, uy + h * .5 * SY);
  shadow.addColorStop(0, 'rgba(60,30,40,.42)'); shadow.addColorStop(1, 'rgba(60,30,40,0)');
  g.fillStyle = shadow; path([...upper, ...upper.slice().reverse().map(([x, y]) => [x, y - h * .5])]); g.fill();
  g.restore();
  // Brillos: uno grande arriba y uno pequeño abajo.
  g.fillStyle = '#ffffff';
  const [h1x, h1y] = P(ic[0] - s * w * .1, ic[1] + h * .2); g.beginPath(); g.ellipse(h1x, h1y, w * .1 * SX, h * .13 * SY, -.3 * s, 0, Math.PI * 2); g.fill();
  const [h2x, h2y] = P(ic[0] + s * w * .12, ic[1] - h * .27); g.beginPath(); g.ellipse(h2x, h2y, w * .045 * SX, h * .05 * SY, 0, 0, Math.PI * 2); g.fill();
  // Línea de pestañas: gruesa hacia afuera, con un remate en la esquina exterior.
  g.fillStyle = lash; g.beginPath();
  upper.forEach(([x, y], i) => { const t = i / N, [px, py] = P(x, y + (.0035 + .0105 * t * t) * (F.lw || 1)); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  const tip = [outer[0] + s * w * .17, outer[1] - h * .1];
  g.lineTo(...P(...tip));
  upper.slice().reverse().forEach(([x, y]) => g.lineTo(...P(x, y - .0022)));
  g.closePath(); g.fill();
  if (F.lashes) {
    g.strokeStyle = lash; g.lineCap = 'round'; g.lineWidth = .0045 * SY;
    for (const k of [.72, .88]) {
      const [bx, by] = bez(inner, up1, up2, outer, k);
      g.beginPath(); g.moveTo(...P(bx, by + .006)); g.lineTo(...P(bx + s * w * .14, by + h * .3)); g.stroke();
    }
  }
  // Pestañas de abajo, finas y sólo hacia afuera.
  g.strokeStyle = 'rgba(70,40,40,.55)'; g.lineWidth = .0035 * SY; g.lineCap = 'round';
  path(lower.slice(1, 7)); g.stroke();
}

function brow(g, cx, cy, s, F) {
  const E = EXPR[F.face] || EXPR.calm, w = .07, h = .064 * E.eh;
  const tilt = E.tilt, arch = E.arch || .15;
  const a = [cx - s * w * .46, cy + h * .9 + .006 - tilt * .02], b = [cx + s * w * .62, cy + h * .98 + .01 + tilt * .012];
  const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + .006 + arch * .012];
  const thick = .011 * E.bw * (F.bw || 1);
  const N = 12, top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], y = u * u * a[1] + 2 * u * t * m[1] + t * t * b[1];
    const k = thick * (1 - t * .7);
    top.push([x, y + k * .5]); bot.push([x, y - k * .5]);
  }
  g.fillStyle = F.brow; g.beginPath();
  [...top, ...bot.reverse()].forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.closePath(); g.fill();
}

function mouth(g, F) {
  const E = EXPR[F.face] || EXPR.calm, kind = F.mouth || E.mouth, y = -.124;
  const line = (pts, width, color) => {
    g.strokeStyle = color; g.lineWidth = width * SY; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    pts.forEach(([x, yy], i) => { const [px, py] = P(x, yy); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
  };
  const curve = (x0, y0, xc, yc, x1, y1) => Array.from({ length: 11 }, (_, i) => { const t = i / 10, u = 1 - t; return [u * u * x0 + 2 * u * t * xc + t * t * x1, u * u * y0 + 2 * u * t * yc + t * t * y1]; });
  const ink = '#6e2e28';
  if (kind === 'open' || kind === 'grin') {
    const wd = kind === 'grin' ? .03 : .022, dp = kind === 'grin' ? .026 : .022;
    const top = curve(-wd, y + .006, 0, y + .002, wd, y + .006), bot = curve(wd, y + .006, 0, y - dp * 1.4, -wd, y + .006);
    g.fillStyle = '#7e2f2c'; g.beginPath(); [...top, ...bot].forEach(([x, yy], i) => { const [px, py] = P(x, yy); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill();
    g.save(); g.clip();
    g.fillStyle = '#e6837a'; g.beginPath(); const [tx, ty] = P(0, y - dp * .75); g.ellipse(tx, ty, wd * .75 * SX, dp * .45 * SY, 0, 0, Math.PI * 2); g.fill();
    if (kind === 'grin') { g.fillStyle = '#fbf7f0'; const [ax, ay] = P(-wd, y + .006), [bx] = P(wd, y); g.fillRect(ax, ay, bx - ax, .008 * SY); }
    g.restore();
    line(top, .003, ink);
  } else if (kind === 'smirk') line(curve(-.02, y - .002, .002, y - .01, .026, y + .007), .0045, ink);
  else if (kind === 'flat') line(curve(-.019, y - .001, 0, y - .003, .019, y - .001), .0045, ink);
  else if (kind === 'small') line(curve(-.013, y, 0, y - .007, .013, y), .0042, ink);
  else line(curve(-.022, y + .003, 0, y - .012, .022, y + .003), .0045, ink);
}

function paint(F, closed) {
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d'), E = EXPR[F.face] || EXPR.calm;
  // Rubor y pecas.
  const blush = (E.blush + (F.blush || 0));
  if (blush > 0) for (const s of [-1, 1]) {
    const [bx, by] = P(s * .098, -.086), gr = g.createRadialGradient(bx, by, 1, bx, by, .036 * SX);
    gr.addColorStop(0, `rgba(240,110,100,${Math.min(.55, blush)})`); gr.addColorStop(1, 'rgba(240,110,100,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, .036 * SX, .02 * SY, 0, 0, Math.PI * 2); g.fill();
  }
  if (F.freckles) { g.fillStyle = 'rgba(150,80,50,.45)'; for (const s of [-1, 1]) for (const [dx, dy] of [[.08, -.075], [.097, -.07], [.112, -.08], [.088, -.088]]) { const [fx, fy] = P(s * dx, dy); g.beginPath(); g.arc(fx, fy, .0028 * SY, 0, Math.PI * 2); g.fill(); } }
  for (const s of [-1, 1]) { eye(g, s * .066, -.032, s, F, closed); brow(g, s * .066, -.032, s, F); }
  // Nariz: una sombra corta y un brillo.
  g.strokeStyle = 'rgba(150,70,55,.5)'; g.lineWidth = .0042 * SY; g.lineCap = 'round';
  g.beginPath(); g.moveTo(...P(.009, -.074)); g.quadraticCurveTo(...P(.012, -.088), ...P(.002, -.093)); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; const [nx, ny] = P(-.004, -.08); g.beginPath(); g.ellipse(nx, ny, .004 * SX, .006 * SY, 0, 0, Math.PI * 2); g.fill();
  if (F.wrinkles) {
    g.strokeStyle = 'rgba(120,60,45,.35)'; g.lineWidth = .003 * SY;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(...P(s * .12, -.02)); g.lineTo(...P(s * .137, -.012)); g.moveTo(...P(s * .12, -.035)); g.lineTo(...P(s * .138, -.036)); g.stroke();
      g.beginPath(); g.moveTo(...P(s * .03, -.098)); g.quadraticCurveTo(...P(s * .042, -.115), ...P(s * .036, -.132)); g.stroke();
      g.beginPath(); g.moveTo(...P(s * .045, -.064)); g.quadraticCurveTo(...P(s * .066, -.07), ...P(s * .088, -.062)); g.stroke();
    }
  }
  mouth(g, F);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const CACHE = new Map();
// spec: { iris, brow, face, lashes, freckles, wrinkles, blush }. Devuelve { open, closed } compartidas.
export function faceTextures(spec) {
  const key = JSON.stringify(spec);
  if (!CACHE.has(key)) CACHE.set(key, { open: paint(spec, false), closed: paint(spec, true) });
  return CACHE.get(key);
}
export function faceMaterial(spec) {
  const tex = faceTextures(spec);
  const m = new T.MeshStandardMaterial({ map: tex.open, emissive: '#ffffff', emissiveMap: tex.open, emissiveIntensity: .24, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  m.userData.faces = tex;
  return m;
}
export function disposeFaces() { for (const t of CACHE.values()) { t.open.dispose(); t.closed.dispose(); } CACHE.clear(); }

// ---------- Ojos pintados para criaturas (concepto aprobado de los iniciales) ----------
// Una calcomanía curva por ojo: almendra con línea de pestañas gruesa y remate afuera, iris en degradé,
// pupila, sombra del párpado, dos brillos y la ceja. side = 1 si el rabillo va hacia +x.
const EYE_MOODS = {
  bold: { lid: .1, droop: .1, brow: .32, bw: 1, eh: .92 },
  happy: { lid: 0, droop: -.04, brow: -.1, bw: .7, eh: 1.06 },
  calm: { lid: .18, droop: 0, brow: .05, bw: .8, eh: .9 }
};
const EYE_CACHE = new Map();
export function creatureEyeMaterial({ iris, brow, mood = 'bold', side = 1, lashes = false }) {
  const key = [iris, brow, mood, side, lashes].join('|');
  if (EYE_CACHE.has(key)) return EYE_CACHE.get(key);
  const W = 192, c = document.createElement('canvas'); c.width = c.height = W;
  const g = c.getContext('2d'), U = W / 2, P = (x, y) => [(x + 1) * U, (1 - y) * U], s = side;
  const Md = EYE_MOODS[mood] || EYE_MOODS.bold, h = .5 * Md.eh;
  const cy = -.16, inner = [-s * .6, cy - h * .16], outer = [s * .66, cy - h * .02 - Md.droop * .5];
  const up1 = [-s * .4, cy + h * 1.2 - Md.lid], up2 = [s * .36, cy + h * 1.32 - Md.lid * 1.3];
  const lo1 = [s * .36, cy - h * 1.3], lo2 = [-s * .38, cy - h * 1.18], N = 16;
  const upper = Array.from({ length: N + 1 }, (_, i) => bez(inner, up1, up2, outer, i / N));
  const lower = Array.from({ length: N + 1 }, (_, i) => bez(outer, lo1, lo2, inner, i / N));
  const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); };
  path([...upper, ...lower]); g.closePath(); g.fillStyle = '#fbf7f0'; g.fill();
  g.save(); g.clip();
  const [ix, iy] = P(s * .04, cy - h * .1), irx = .4 * U, iry = h * 1.12 * U;
  const grad = g.createLinearGradient(ix, iy - iry, ix, iy + iry);
  grad.addColorStop(0, tone(iris, -.6)); grad.addColorStop(.45, iris); grad.addColorStop(1, tone(iris, .45));
  g.fillStyle = grad; g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = tone(iris, -.65); g.lineWidth = .035 * U; g.stroke();
  g.fillStyle = tone(iris, -.82); g.beginPath(); g.ellipse(ix, iy - iry * .06, irx * .42, iry * .5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = rgba(tone(iris, .55), .55); g.beginPath(); g.ellipse(ix, iy + iry * .58, irx * .58, iry * .22, 0, 0, Math.PI * 2); g.fill();
  const [ux, uy] = P(0, cy + h), shadow = g.createLinearGradient(ux, uy, ux, uy + h * .9 * U);
  shadow.addColorStop(0, 'rgba(50,25,35,.45)'); shadow.addColorStop(1, 'rgba(50,25,35,0)');
  g.fillStyle = shadow; path([...upper, ...upper.slice().reverse().map(([x, y]) => [x, y - h * .9])]); g.fill();
  g.restore();
  g.fillStyle = '#ffffff';
  const hl = (x, y, rx, ry) => { const [px, py] = P(x, y); g.beginPath(); g.ellipse(px, py, rx * U, ry * U, -.3 * s, 0, Math.PI * 2); g.fill(); };
  hl(s * .04 - s * .14, cy + h * .38, .13, .16); hl(s * .04 + s * .16, cy - h * .5, .06, .07);
  // Línea de pestañas: gruesa, más ancha hacia el rabillo y con remate.
  g.fillStyle = '#24171a'; g.beginPath();
  upper.forEach(([x, y], i) => { const t = i / N, [px, py] = P(x, y + .05 + .12 * t * t); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.lineTo(...P(outer[0] + s * .2, outer[1] - h * .12));
  upper.slice().reverse().forEach(([x, y]) => g.lineTo(...P(x, y - .025)));
  g.closePath(); g.fill();
  if (lashes) {
    g.strokeStyle = '#24171a'; g.lineCap = 'round'; g.lineWidth = .05 * U;
    for (const k of [.7, .86]) { const [bx, by] = bez(inner, up1, up2, outer, k); g.beginPath(); g.moveTo(...P(bx, by + .06)); g.lineTo(...P(bx + s * .14, by + .26)); g.stroke(); }
  }
  g.strokeStyle = 'rgba(60,35,35,.55)'; g.lineWidth = .035 * U; g.lineCap = 'round'; path(lower.slice(1, 8)); g.stroke();
  // Ceja: trazo que se afina hacia afuera; decidida (baja adentro) o alegre (arqueada).
  if (brow) {
    const a = [-s * .52, cy + h * 1.5 + .12 - Md.brow * .22], b = [s * .7, cy + h * 1.62 + .12 + Md.brow * .1], m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + .08 + (Md.brow < 0 ? .1 : 0)];
    const top = [], bot = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, u = 1 - t, x = u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], y = u * u * a[1] + 2 * u * t * m[1] + t * t * b[1], k = .13 * Md.bw * (1 - t * .7); top.push([x, y + k * .5]); bot.push([x, y - k * .5]); }
    g.fillStyle = brow; g.beginPath(); [...top, ...bot.reverse()].forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill();
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  const m = new T.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .22, transparent: true, roughness: .45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  EYE_CACHE.set(key, m); return m;
}
// Parche curvo (trozo de esfera de radio R alrededor de +z) que cubre ±a radianes.
const PATCH = new Map();
export function eyePatchGeometry(R, a) {
  const key = Math.round(R * 1000) + ':' + Math.round(a * 1000);
  if (!PATCH.has(key)) PATCH.set(key, new T.SphereGeometry(R, 14, 14, Math.PI / 2 - a, 2 * a, Math.PI / 2 - a, 2 * a));
  return PATCH.get(key);
}
export function disposeCreatureEyes() { for (const m of EYE_CACHE.values()) { m.map.dispose(); m.dispose(); } EYE_CACHE.clear(); for (const g of PATCH.values()) g.dispose(); PATCH.clear(); }
