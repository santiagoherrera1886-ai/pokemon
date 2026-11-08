// Herramientas de pixel art: lienzos, contorno automático, sombreado y ruido determinista.
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  return [c, g];
}

export function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shadeHex(h, f) {
  const [r, g, b] = hex(h);
  const k = v => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return '#' + [k(r), k(g), k(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Ruido determinista por coordenada (para variaciones de tiles sin aleatoriedad visible).
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Pinta un píxel o un rectángulo de píxeles.
export function px(g, x, y, c, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }

export function ellipse(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

// Dibuja arte definido como texto: cada carácter es una clave de la paleta, '.' es transparente.
export function art(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const [c, g] = canvas(w, h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) px(g, x, y, pal[ch]); }));
  return c;
}

// Contorno exterior automático: los píxeles vacíos que tocan uno lleno se pintan con `color`.
export function outline(c, color = '#26222e', diagonal = false) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const { width: w, height: h } = c;
  const d = g.getImageData(0, 0, w, h);
  const a = i => d.data[i * 4 + 3] > 0;
  const out = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(y * w + x)) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (diagonal) n.push([1, 1], [-1, -1], [1, -1], [-1, 1]);
    if (n.some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && a(Y * w + X); })) out.push([x, y]);
  }
  g.fillStyle = color;
  out.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  return c;
}

// Sombreado automático: luz desde arriba-izquierda, sombra abajo-derecha, respetando el color base.
export function autoShade(c, amount = 0.22, skip = []) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const { width: w, height: h } = c;
  const d = g.getImageData(0, 0, w, h), src = new Uint8ClampedArray(d.data);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
  const same = (x, y, i) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const j = (y * w + x) * 4;
    return src[j + 3] > 0 && Math.abs(src[j] - src[i]) + Math.abs(src[j + 1] - src[i + 1]) + Math.abs(src[j + 2] - src[i + 2]) < 40;
  };
  const skipSet = skip.map(hex);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!src[i + 3]) continue;
    if (skipSet.some(([r, gg, b]) => r === src[i] && gg === src[i + 1] && b === src[i + 2])) continue;
    let f = 0;
    if (!same(x, y - 1, i) || !same(x - 1, y, i)) f += amount * 0.8;
    if (!same(x, y + 1, i) || !same(x + 1, y, i)) f -= amount;
    if (!same(x + 2, y + 2, i) && at(x + 2, y + 2) === 0) f -= amount * 0.5;
    if (f === 0) continue;
    for (let k = 0; k < 3; k++) {
      const v = src[i + k];
      d.data[i + k] = f > 0 ? v + (255 - v) * f : v * (1 + f);
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}

export function flipH(src) {
  const [c, g] = canvas(src.width, src.height);
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
