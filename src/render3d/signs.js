// Letreros del modo 3D: placas luminosas para los locales y tablas de madera para los postes del camino.
// Las caras se pintan en un canvas con la fuente del juego (Fredoka, servida desde ./fonts) y se montan
// sobre un marco extruido con bordes redondeados. Íconos y diseño son propios, sin logos de terceros.
import * as T from 'three';

const FACE = "'Fredoka', 'Nunito', 'Trebuchet MS', sans-serif";
const shade = (hex, f) => { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); };
const hasCanvas = () => typeof document !== 'undefined' && !!document.createElement;
const fontReady = () => { try { return !document.fonts || document.fonts.check(`700 64px ${FACE}`); } catch { return true; } };

function rounded(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function roundedShape(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}

// Pictogramas simples, centrados en (x, y) y de radio aproximado s.
const ICONS = {
  heart(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * .95);
    c.bezierCurveTo(x - s * 1.25, y + s * .05, x - s * .85, y - s * 1.0, x, y - s * .35);
    c.bezierCurveTo(x + s * .85, y - s * 1.0, x + s * 1.25, y + s * .05, x, y + s * .95); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x - s * .42, y - s * .28, s * .2, s * .13, -.6, 0, 7); c.fill();
  },
  bag(c, x, y, s, col, dark) {
    c.lineWidth = s * .2; c.strokeStyle = dark; c.beginPath(); c.arc(x, y - s * .38, s * .38, Math.PI, 0); c.stroke();
    c.fillStyle = col; rounded(c, x - s * .82, y - s * .42, s * 1.64, s * 1.32, s * .26); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y + s * .22, s * .3, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x, y + s * .22, s * .13, 0, 7); c.fill();
  },
  medal(c, x, y, s, col, dark) {
    c.fillStyle = dark; c.beginPath(); c.moveTo(x - s * .55, y - s); c.lineTo(x - s * .1, y - s); c.lineTo(x - s * .35, y - s * .2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + s * .55, y - s); c.lineTo(x + s * .1, y - s); c.lineTo(x + s * .35, y - s * .2); c.closePath(); c.fill();
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .42 : s * .86; c.lineTo(x + Math.cos(a) * rr, y + s * .22 + Math.sin(a) * rr); }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - s * .18, y + s * .02, s * .13, 0, 7); c.fill();
  },
  crate(c, x, y, s, col, dark) {
    c.fillStyle = col; rounded(c, x - s * .85, y - s * .75, s * 1.7, s * 1.5, s * .16); c.fill();
    c.strokeStyle = dark; c.lineWidth = s * .16; c.beginPath(); c.moveTo(x - s * .6, y - s * .5); c.lineTo(x + s * .6, y + s * .5); c.moveTo(x + s * .6, y - s * .5); c.lineTo(x - s * .6, y + s * .5); c.stroke();
  },
  leaf(c, x, y, s, col, dark) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - s * .7, y + s * .8);
    c.quadraticCurveTo(x - s * .9, y - s * .7, x + s * .8, y - s * .85); c.quadraticCurveTo(x + s * .75, y + s * .6, x - s * .7, y + s * .8); c.fill();
    c.strokeStyle = dark; c.lineWidth = s * .12; c.beginPath(); c.moveTo(x - s * .7, y + s * .8); c.quadraticCurveTo(x, y, x + s * .55, y - s * .55); c.stroke();
  },
  crown(c, x, y, s, col, dark) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - s * .9, y + s * .6); c.lineTo(x - s * .95, y - s * .45); c.lineTo(x - s * .45, y);
    c.lineTo(x, y - s * .75); c.lineTo(x + s * .45, y); c.lineTo(x + s * .95, y - s * .45); c.lineTo(x + s * .9, y + s * .6); c.closePath(); c.fill();
    c.fillStyle = dark; c.fillRect(x - s * .9, y + s * .42, s * 1.8, s * .2);
    c.fillStyle = 'rgba(255,255,255,.8)'; for (const dx of [-.95, 0, .95]) { c.beginPath(); c.arc(x + dx * s, y - (dx ? .5 : .8) * s, s * .14, 0, 7); c.fill(); }
  },
  arrow(c, x, y, s, col, dark, dir = 0) {
    c.save(); c.translate(x, y); c.rotate(dir); c.fillStyle = col; c.beginPath();
    c.moveTo(s, 0); c.lineTo(s * .05, -s * .8); c.lineTo(s * .05, -s * .32); c.lineTo(-s * .9, -s * .32); c.lineTo(-s * .9, s * .32); c.lineTo(s * .05, s * .32); c.lineTo(s * .05, s * .8); c.closePath(); c.fill();
    c.restore();
  }
};
export function signIcon(text = '') {
  const t = text.toUpperCase();
  if (t.includes('POSADA')) return 'heart';
  if (t.includes('TIENDA')) return 'bag';
  if (t.includes('GIMNASIO')) return 'medal';
  if (t.includes('BODEGA')) return 'crate';
  if (t.includes('LIGA')) return 'crown';
  if (t.includes('LAB')) return 'leaf';
  return null;
}

// Cara de un letrero de local: borde blanco, degradado del color del local, brillo arriba,
// ícono en un círculo blanco y letras blancas con contorno oscuro. Devuelve el ancho relativo (W/H).
// Al repintar (cuando carga la fuente) se conserva el tamaño del canvas: la textura ya está en la GPU.
function paintStoreFace(canvas, text, color, icon, maxAspect) {
  const H = 256, c0 = canvas.getContext('2d'), size = 132, keep = canvas.height === H;
  const font = s => `700 ${s}px ${FACE}`;
  c0.font = font(size); c0.letterSpacing = '6px';
  const tw = c0.measureText(text).width;
  const ir = icon ? H * .3 : 0, left = icon ? H * .1 + ir * 2 + H * .1 : H * .2, right = H * .22;
  let W = keep ? canvas.width : Math.ceil(left + tw + right);
  if (!keep && W / H > maxAspect) W = Math.floor(maxAspect * H);
  const k = Math.max(.55, Math.min(1, (W - left - right) / tw));
  if (!keep) { canvas.width = W; canvas.height = H; }
  const c = canvas.getContext('2d'), dark = shade(color, -.45), R = H * .3;
  c.clearRect(0, 0, W, H); c.letterSpacing = '0px';
  rounded(c, 0, 0, W, H, R); c.fillStyle = '#ffffff'; c.fill();
  const inset = H * .055;
  const g = c.createLinearGradient(0, inset, 0, H - inset);
  g.addColorStop(0, shade(color, .28)); g.addColorStop(.48, color); g.addColorStop(1, shade(color, -.2));
  rounded(c, inset, inset, W - inset * 2, H - inset * 2, R - inset); c.fillStyle = g; c.fill();
  c.save(); rounded(c, inset, inset, W - inset * 2, H - inset * 2, R - inset); c.clip();
  const gl = c.createLinearGradient(0, inset, 0, H * .5);
  gl.addColorStop(0, 'rgba(255,255,255,.3)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gl; c.fillRect(0, inset, W, H * .5);
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = H * .018; rounded(c, inset * 2.1, inset * 2.1, W - inset * 4.2, H - inset * 4.2, R - inset * 2); c.stroke();
  if (icon) {
    const cx = H * .1 + ir, cy = H / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(cx, cy + H * .03, ir, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, cy, ir, 0, 7); c.fill();
    const col = new T.Color(color), lum = .2126 * col.r + .7152 * col.g + .0722 * col.b;
    ICONS[icon](c, cx, cy, ir * .58, lum < .06 ? shade(color, .38) : color, dark);
  }
  c.font = font(size); c.letterSpacing = '6px'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
  const span = tw * k, x0 = left + Math.max(0, (W - left - right - span) / 2), y0 = H / 2 + H * .035;
  c.save(); c.translate(x0, y0); c.scale(k, 1);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillText(text, 0, H * .045);
  c.strokeStyle = dark; c.lineWidth = H * .085; c.strokeText(text, 0, 0);
  c.fillStyle = '#ffffff'; c.fillText(text, 0, 0);
  c.restore();
  return W / H;
}

function faceTexture(r, paint) {
  const canvas = document.createElement('canvas'); const aspect = paint(canvas);
  const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8; r.textures.add(tex);
  // Si la fuente todavía no estaba lista, se vuelve a pintar cuando cargue (el tamaño de la placa no cambia).
  if (!fontReady() && document.fonts?.load) document.fonts.load(`700 64px ${FACE}`).then(() => { paint(canvas); tex.needsUpdate = true; }).catch(() => {});
  return { tex, aspect };
}

// Placa luminosa de un local. Devuelve un grupo centrado en (0,0,0) con la cara mirando a +z.
// opts: text, color, icon, height (alto en casillas), maxWidth (ancho máximo en casillas).
export function storeSign(r, opts) {
  const g = new T.Group(), sh = opts.height || .8, color = opts.color || '#467b70', dark = shade(color, -.42);
  if (!hasCanvas()) { r.box(g, color, 0, 0, 0, sh * 3, sh, .12, true); g.userData.width = sh * 3; return g; }
  const { tex, aspect } = faceTexture(r, canvas => paintStoreFace(canvas, opts.text, color, opts.icon ?? signIcon(opts.text), (opts.maxWidth || 6) / sh));
  const sw = sh * aspect; g.userData.width = sw;
  // Marco extruido con el mismo radio que la cara, un poco más grande y oscuro.
  const m = .07, rad = sh * .3 + m;
  const frameGeo = new T.ExtrudeGeometry(roundedShape(sw + m * 2, sh + m * 2, rad), { depth: .1, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 6 });
  frameGeo.translate(0, 0, -.13);
  const frame = new T.Mesh(frameGeo, r.mat(dark, { roughness: .5 })); frame.userData.ownedGeometry = true; frame.castShadow = true; g.add(frame);
  const face = new T.Mesh(r.geometries.plane, new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: .38, roughness: .38, alphaTest: .5 }));
  face.userData.ownedMaterial = true; face.scale.set(sw, sh, 1); face.position.z = .005; face.receiveShadow = true; g.add(face);
  // Remaches dorados en las esquinas del marco.
  const stud = r.mat('#f2d27a', { roughness: .3, metalness: .4 });
  for (const x of [-sw / 2 - m * .2, sw / 2 + m * .2]) for (const y of [-sh / 2 + .08, sh / 2 - .08]) r.mesh(g, 'ball', stud, [x, y, .01], [.045, .045, .03]);
  return g;
}

// Cara del poste del camino: tabla clara con marco de madera, franja de color según el lugar,
// nombre en letras café y flecha si el texto indica una dirección.
function paintPostFace(canvas, title) {
  const W = 512, H = 300; if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  const c = canvas.getContext('2d'); c.clearRect(0, 0, W, H);
  const arrows = { '←': Math.PI, '→': 0, '↑': -Math.PI / 2, '↓': Math.PI / 2 };
  let dir = null; for (const [ch, a] of Object.entries(arrows)) if (title.includes(ch)) dir = a;
  const clean = title.replace(/[←→↑↓]/g, ' ').replace(/\s+/g, ' ').trim();
  const route = /^(RUTA|SENDERO)/.test(clean), band = route ? '#4f9a5a' : /^(LAGO|CUEVA|MONTE|BOSQUE)/.test(clean) ? '#3f8fb0' : '#d06a4a';
  rounded(c, 0, 0, W, H, 34); c.fillStyle = '#7a4f2c'; c.fill();
  rounded(c, 16, 16, W - 32, H - 32, 24); c.fillStyle = '#f6e7c4'; c.fill();
  c.save(); rounded(c, 16, 16, W - 32, H - 32, 24); c.clip();
  c.fillStyle = band; c.fillRect(16, 16, W, 54);
  c.fillStyle = 'rgba(122,79,44,.08)'; for (let i = 0; i < 6; i++) c.fillRect(16, 96 + i * 34, W, 3);
  c.restore();
  for (const x of [44, W - 44]) { c.fillStyle = '#e9d7ae'; c.beginPath(); c.arc(x, 43, 9, 0, 7); c.fill(); }
  // Palabras repartidas en una o dos líneas, lo más grandes que quepan.
  const words = clean.split(' '); let lines = [clean];
  if (words.length > 1 && clean.length > 9) { let best = null; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(a.length, b.length); if (!best || m < best.m) best = { m, l: [a, b] }; } lines = best.l; }
  const areaL = dir === null ? 40 : 128, areaW = W - areaL - 40, areaTop = 78, areaH = H - areaTop - 30;
  let size = Math.min(96, areaH / lines.length * .86);
  c.font = `700 ${size}px ${FACE}`; const widest = Math.max(...lines.map(l => c.measureText(l).width));
  if (widest > areaW) size *= areaW / widest;
  c.font = `700 ${size}px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#5a3a1e';
  lines.forEach((l, i) => c.fillText(l, areaL + areaW / 2, areaTop + areaH * (i + .5) / lines.length + 4));
  if (dir !== null) ICONS.arrow(c, 82, areaTop + areaH / 2 + 2, 44, band, '#5a3a1e', dir);
  return W / H;
}

// Poste del camino con tabla inclinada hacia la cámara. Mide como una casilla de ancho.
export function postSign(r, title = '') {
  const g = new T.Group(), wood = '#8a5c36', dark = '#6a4428';
  for (const x of [-.4, .4]) { r.box(g, wood, x, .42, -.02, .11, .84, .11, true); r.box(g, dark, x, .04, -.02, .17, .08, .17, true); }
  const board = new T.Group(); board.position.set(0, .86, .02); board.rotation.x = -.28; g.add(board);
  const bw = 1.16, bh = bw * 300 / 512;
  r.box(board, dark, 0, 0, -.05, bw + .06, bh + .06, .08, true);
  r.box(board, wood, 0, bh / 2 + .05, -.02, bw + .14, .06, .12, true);
  if (hasCanvas()) {
    const { tex } = faceTexture(r, canvas => paintPostFace(canvas, title));
    const face = new T.Mesh(r.geometries.plane, new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: .12, roughness: .7, alphaTest: .5 }));
    face.userData.ownedMaterial = true; face.scale.set(bw, bh, 1); face.position.z = .002; face.receiveShadow = true; board.add(face);
  } else r.box(board, '#f6e7c4', 0, 0, 0, bw, bh, .01, true);
  return g;
}
