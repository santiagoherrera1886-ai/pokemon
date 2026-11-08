// Sprites de objetos del mundo: árboles, cercas, letreros, edificios y muebles. Todo arte original.
import { canvas, px, ellipse, outline, autoShade, shadeHex, hash } from '../core/pixel.js';

const OUT = '#2a2630';
const cache = new Map();
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// ---------- Fuente de 3x5 para letreros dentro del mundo ----------
const FONT = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'], I: ['111', '010', '010', '010', '111'], L: ['100', '100', '100', '100', '111'],
  N: ['101', '111', '111', '101', '101'], O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], R: ['110', '101', '110', '101', '101'],
  C: ['011', '100', '100', '100', '011'], V: ['101', '101', '101', '101', '010'], M: ['101', '111', '101', '101', '101'],
  G: ['011', '100', '101', '101', '011'], U: ['101', '101', '101', '101', '111'], H: ['101', '101', '111', '101', '101'], F: ['111', '100', '110', '100', '100'],
  X: ['101', '101', '010', '101', '101'], '·': ['000', '000', '010', '000', '000'],
  ' ': ['000', '000', '000', '000', '000']
};
export function tinyText(g, text, x, y, color) {
  [...text].forEach((ch, i) => (FONT[ch] || FONT[' ']).forEach((row, r) => [...row].forEach((b, c) => { if (b === '1') px(g, x + i * 4 + c, y + r, color); })));
}

// ---------- Naturaleza ----------
export function tree(variant = 0) {
  return memo('tree' + variant, () => {
    const [c, g] = canvas(22, 32);
    const dark = '#2f7d3a', mid = '#46a046', light = '#72c45a', hi = '#a6e07a';
    px(g, 9, 24, '#7a4a28', 4, 6); px(g, 9, 24, '#9a6436', 2, 6);
    ellipse(g, 11, 25, 9, 3, dark);
    ellipse(g, 11, 17, 10, 8, dark);
    ellipse(g, 11, 10, 8, 7, dark);
    ellipse(g, 10, 16, 8, 6, mid);
    ellipse(g, 10, 9, 6, 5, mid);
    ellipse(g, 8, 13, 4, 3, light);
    ellipse(g, 8, 7, 3, 2, light);
    px(g, 7, 6, hi, 2, 1); px(g, 6, 12, hi, 2, 1);
    // Textura de hojas
    for (let i = 0; i < 14; i++) {
      const x = 3 + Math.floor(hash(i, variant, 4) * 16), y = 4 + Math.floor(hash(i, variant, 9) * 20);
      const d = g.getImageData(x, y, 1, 1).data;
      if (d[3]) px(g, x, y, i % 3 ? dark : light);
    }
    outline(c, OUT);
    return c;
  });
}

export function bush() {
  return memo('bush', () => {
    const [c, g] = canvas(16, 16);
    ellipse(g, 8, 9, 7, 5, '#3c8c3c'); ellipse(g, 7, 8, 5, 4, '#5cb04c'); px(g, 5, 6, '#94d870', 3, 1);
    outline(c, OUT); return c;
  });
}

export function rock() {
  return memo('rock', () => {
    const [c, g] = canvas(16, 16);
    ellipse(g, 8, 10, 7, 5, '#8c8c96'); ellipse(g, 7, 9, 5, 3, '#acacb6'); px(g, 5, 7, '#d0d0d8', 3, 1);
    outline(c, OUT); return c;
  });
}

export function fence(left, right) {
  return memo('fence' + left + right, () => {
    const [c, g] = canvas(16, 20);
    const w = '#f2ecdc', d = '#b8ac94';
    px(g, 6, 4, w, 4, 14); px(g, 9, 4, d, 1, 14); px(g, 6, 3, w, 4, 1);
    px(g, left ? 0 : 6, 7, w, left ? (right ? 16 : 10) : (right ? 10 : 4), 3);
    px(g, left ? 0 : 6, 13, w, left ? (right ? 16 : 10) : (right ? 10 : 4), 3);
    px(g, left ? 0 : 6, 9, d, left ? (right ? 16 : 10) : (right ? 10 : 4), 1);
    px(g, left ? 0 : 6, 15, d, left ? (right ? 16 : 10) : (right ? 10 : 4), 1);
    outline(c, OUT); return c;
  });
}

export function sign() {
  return memo('sign', () => {
    const [c, g] = canvas(16, 20);
    px(g, 7, 12, '#7a4a28', 2, 7);
    px(g, 1, 3, '#c88a4a', 14, 10); px(g, 2, 4, '#e2a862', 12, 8);
    for (let i = 0; i < 3; i++) px(g, 4, 6 + i * 2, '#9a6436', 8, 1);
    outline(c, OUT); return c;
  });
}

export function mailbox() {
  return memo('mailbox', () => {
    const [c, g] = canvas(16, 20);
    px(g, 7, 10, '#6a6a74', 2, 9);
    px(g, 3, 4, '#d84a4a', 10, 7); px(g, 4, 3, '#d84a4a', 8, 1); px(g, 4, 5, '#f07a6a', 7, 2);
    px(g, 12, 2, '#f8d040', 1, 5);
    outline(c, OUT); return c;
  });
}

export function briefcase() {
  return memo('brief', () => {
    const [c, g] = canvas(16, 16);
    px(g, 2, 6, '#8a5a30', 12, 8); px(g, 3, 7, '#a8743e', 10, 3); px(g, 6, 4, '#5a3a20', 4, 2); px(g, 7, 9, '#f0d070', 2, 2);
    outline(c, OUT); return c;
  });
}

export function lamp() {
  return memo('lamp', () => {
    const [c, g] = canvas(16, 32);
    px(g, 7, 8, '#4a5a6a', 2, 22); px(g, 5, 29, '#4a5a6a', 6, 2);
    px(g, 4, 2, '#4a5a6a', 8, 2); px(g, 5, 4, '#fff2b0', 6, 5); px(g, 6, 5, '#ffffff', 2, 2);
    outline(c, OUT); return c;
  });
}

export function palm() {
  return memo('palm', () => {
    const [c, g] = canvas(26, 36);
    for (let y = 14; y < 34; y++) px(g, 12 + Math.round(Math.sin(y / 6) * 1.5), y, y % 3 ? '#a0703a' : '#86582c', 3, 1);
    const fr = (x, y, w, dir) => { for (let i = 0; i < w; i++) px(g, x + i * dir, y + Math.floor(i * i / 14), '#3c9a3c', 2, 3); };
    fr(13, 12, 12, 1); fr(13, 12, 12, -1); fr(13, 10, 9, 1); fr(13, 10, 9, -1);
    ellipse(g, 13, 11, 5, 3, '#58b848'); ellipse(g, 12, 14, 2, 2, '#8a5a2a'); ellipse(g, 15, 15, 2, 2, '#8a5a2a');
    outline(c, OUT); return c;
  });
}
export function pine() {
  return memo('pine', () => {
    const [c, g] = canvas(20, 34);
    px(g, 9, 27, '#6a4024', 3, 6);
    for (let t = 0; t < 4; t++) { const y = 3 + t * 6, w = 4 + t * 2.4; for (let i = 0; i < 8; i++) px(g, 10 - Math.round(w * i / 8), y + i, t % 2 ? '#2a6a4a' : '#2f7a52', Math.round(w * i / 8) * 2 + 1, 1); }
    px(g, 7, 10, '#5aa07a', 2, 1); px(g, 5, 17, '#5aa07a', 3, 1); px(g, 4, 23, '#5aa07a', 3, 1);
    outline(c, OUT); return c;
  });
}
export function boulder() {
  return memo('boulder', () => {
    const [c, g] = canvas(16, 18);
    ellipse(g, 8, 10, 7, 7, '#7a6650'); ellipse(g, 7, 8, 5, 4, '#9a8468'); px(g, 5, 6, '#c0a888', 3, 1); px(g, 9, 13, '#5a4a3a', 4, 1);
    outline(c, OUT); return c;
  });
}
export function crystal() {
  return memo('crystal', () => {
    const [c, g] = canvas(16, 20);
    for (let i = 0; i < 9; i++) px(g, 6 - Math.floor(i / 3), 4 + i, '#7ad0f8', 2 + Math.floor(i / 3) * 2, 1);
    for (let i = 0; i < 6; i++) px(g, 11, 9 + i, '#b8a0f8', 3, 1);
    px(g, 6, 5, '#ffffff', 1, 4); px(g, 2, 14, '#5a4636', 13, 4);
    outline(c, OUT); return c;
  });
}
export function statue() {
  return memo('statue', () => {
    const [c, g] = canvas(16, 30);
    px(g, 2, 22, '#8a8a96', 12, 7); px(g, 3, 22, '#b0b0bc', 10, 2);
    ellipse(g, 8, 14, 5, 7, '#c8c8d4'); ellipse(g, 8, 6, 4, 4, '#c8c8d4'); px(g, 4, 2, '#c8c8d4', 2, 4); px(g, 10, 2, '#c8c8d4', 2, 4);
    px(g, 6, 6, '#6a6a76', 1, 1); px(g, 9, 6, '#6a6a76', 1, 1);
    outline(c, OUT); return c;
  });
}
export function fountain() {
  return memo('fountain', () => {
    const [c, g] = canvas(32, 32);
    ellipse(g, 16, 22, 15, 8, '#b0b0bc'); ellipse(g, 16, 21, 12, 6, '#5ab0e8'); ellipse(g, 14, 20, 5, 2, '#a8dcfa');
    px(g, 14, 6, '#b0b0bc', 4, 14); ellipse(g, 16, 7, 6, 3, '#b0b0bc'); ellipse(g, 16, 6, 4, 2, '#5ab0e8');
    px(g, 15, 0, '#d8f0ff', 2, 5); px(g, 12, 3, '#d8f0ff', 1, 3); px(g, 19, 3, '#d8f0ff', 1, 3);
    outline(c, OUT); return c;
  });
}
export function bench() {
  return memo('bench', () => {
    const [c, g] = canvas(32, 16);
    px(g, 1, 3, '#a8743e', 30, 3); px(g, 1, 8, '#c88a4a', 30, 3); px(g, 3, 11, '#4a4a54', 2, 4); px(g, 27, 11, '#4a4a54', 2, 4);
    outline(c, OUT); return c;
  });
}
export function caveMouth() {
  return memo('cavemouth', () => {
    const [c, g] = canvas(20, 20);
    ellipse(g, 10, 12, 9, 9, '#5a4636'); ellipse(g, 10, 13, 7, 8, '#1a1210'); px(g, 3, 18, '#1a1210', 14, 2);
    px(g, 4, 6, '#846a54', 3, 2); px(g, 13, 7, '#846a54', 3, 2);
    return c;
  });
}
export function boat() {
  return memo('boat', () => {
    const [c, g] = canvas(48, 22);
    for (let y = 0; y < 8; y++) px(g, 2 + y, 10 + y, '#c84a3a', 44 - y * 2, 1);
    px(g, 4, 8, '#f4f4f4', 40, 3); px(g, 22, 0, '#6a4a2a', 2, 10); px(g, 24, 1, '#f8f8f0', 10, 7);
    outline(c, OUT); return c;
  });
}

// Edificio grande con letrero (gimnasio, liga, base del Equipo Eclipse).
export function bigBuilding(w, h, opt = {}) {
  return memo('big' + w + h + JSON.stringify(opt), () => {
    const W = w * 16, H = (h + 1) * 16;
    const [c, g] = canvas(W + 2, H + 1);
    const roof = opt.roof || '#8a5ad8', wall = opt.wall || '#f4f0e8', trim = opt.trim || '#3a3a4a';
    const roofH = Math.round(H * 0.42);
    // tejado a dos aguas con franja
    for (let y = 0; y < roofH; y++) {
      const inset = Math.max(0, 10 - Math.floor(y / 2));
      px(g, 1 + inset, y, y % 6 === 5 ? shadeHex(roof, -0.25) : (y < 4 ? shadeHex(roof, 0.25) : roof), W - inset * 2, 1);
    }
    px(g, 0, roofH - 3, shadeHex(roof, -0.4), W + 2, 3);
    if (opt.emblem) { ellipse(g, W / 2 + 1, roofH / 2, 7, 6, '#ffffff'); ellipse(g, W / 2 + 1, roofH / 2, 5, 4, opt.emblem); }
    // muro con columnas
    px(g, 2, roofH, wall, W - 2, H - roofH - 1);
    for (let x = 6; x < W - 4; x += 16) { px(g, x, roofH + 2, shadeHex(wall, -0.12), 4, H - roofH - 6); px(g, x, roofH + 2, shadeHex(wall, 0.2), 1, H - roofH - 6); }
    px(g, 2, roofH, trim, W - 2, 3);
    px(g, 2, H - 4, shadeHex(wall, -0.35), W - 2, 3);
    // puerta doble
    const dx = (opt.doorCol ?? Math.floor(w / 2)) * 16;
    px(g, dx - 1, H - 22, trim, 18, 21); px(g, dx + 1, H - 20, opt.door || '#a8dcf2', 14, 18); px(g, dx + 8, H - 20, trim, 1, 18);
    // ventanales
    for (let i = 0; i < w; i++) if (Math.abs(i - (opt.doorCol ?? Math.floor(w / 2))) > 1) windowAt(g, i * 16 + 3, roofH + 9, 10, 10, false);
    if (opt.sign) {
      const sw = opt.sign.length * 4 + 6;
      px(g, Math.round(W / 2 - sw / 2), roofH + 2, '#ffffff', sw, 8); px(g, Math.round(W / 2 - sw / 2), roofH + 2, opt.signColor || trim, sw, 1);
      tinyText(g, opt.sign, Math.round(W / 2 - sw / 2) + 3, roofH + 4, opt.signColor || trim);
    }
    outline(c, OUT);
    return c;
  });
}

// ---------- Edificios ----------
function windowAt(g, x, y, w = 12, h = 10, box = true) {
  px(g, x - 1, y - 1, '#7a5a3a', w + 2, h + 2);
  px(g, x, y, '#86c8f0', w, h);
  px(g, x + 1, y + 1, '#c8ecff', 3, 2); px(g, x + w - 3, y + h - 3, '#5aa0d8', 2, 2);
  px(g, x + Math.floor(w / 2), y, '#7a5a3a', 1, h); px(g, x, y + Math.floor(h / 2), '#7a5a3a', w, 1);
  if (box) { px(g, x - 1, y + h + 1, '#8a5a30', w + 2, 3); for (let i = 0; i < w; i += 3) px(g, x + i, y + h, i % 2 ? '#f05a5a' : '#f8d040', 2, 1); }
}

function door(g, x, y, color = '#9a5a2e', w = 12, h = 17) {
  px(g, x - 1, y - 1, '#5a3a20', w + 2, h + 1);
  px(g, x, y, color, w, h);
  px(g, x + 1, y + 1, shadeHex(color, 0.2), w - 2, 6); px(g, x + 1, y + 9, shadeHex(color, 0.2), w - 2, 6);
  px(g, x + w - 3, y + 9, '#f0d070', 1, 2);
}

// Casa de 3/4: tejado inclinado con tejas, fachada con ventanas y puerta en `doorCol`.
export function house(w, h, opt = {}) {
  const key = 'house' + w + h + JSON.stringify(opt);
  return memo(key, () => {
    const W = w * 16, H = (h + 1) * 16;
    const [c, g] = canvas(W + 2, H + 1);
    const roof = opt.roof || '#d8504a', wall = opt.wall || '#f6eedc';
    const roofH = Math.round(H * 0.52), fy = roofH - 2, fh = H - fy;
    // Fachada
    px(g, 3, fy, wall, W - 4, fh - 2);
    for (let y = fy + 4; y < H - 3; y += 4) px(g, 3, y, shadeHex(wall, -0.06), W - 4, 1);
    px(g, 3, H - 4, '#a89a84', W - 4, 3);
    px(g, 3, fy, shadeHex(wall, -0.18), W - 4, 2);
    // Tejado (trapecio con tejas)
    for (let y = 0; y < roofH; y++) {
      const inset = Math.max(0, 6 - Math.floor(y / 3));
      const row = Math.floor(y / 5);
      const col = (y % 5 === 4) ? shadeHex(roof, -0.25) : (row % 2 ? roof : shadeHex(roof, 0.08));
      px(g, 1 + inset, y, col, W - inset * 2, 1);
      if (y % 5 !== 4) for (let x = (row % 2 ? 3 : 0) + inset + 1; x < W - inset; x += 6) px(g, x, y, shadeHex(roof, -0.15));
    }
    px(g, 7, 0, shadeHex(roof, 0.3), W - 12, 2);
    px(g, 0, roofH - 3, shadeHex(roof, -0.35), W + 2, 3);
    if (opt.chimney) { px(g, W - 22, -0 + 1, '#a05a40', 8, 9); px(g, W - 23, 0, '#80483a', 10, 2); }
    // Puerta y ventanas
    const dc = opt.doorCol ?? Math.floor(w / 2);
    const dx = dc * 16 + 2;
    door(g, dx, H - 21, opt.doorColor);
    const wy = fy + 7;
    const spots = [];
    for (let i = 0; i < w; i++) if (i !== dc && Math.abs(i - dc) >= 1) spots.push(i);
    spots.forEach(i => { if (i !== 0 || w > 4) windowAt(g, i * 16 + 3, wy, 11, 9, opt.flowers !== false); });
    if (opt.sign) {
      px(g, dx - 6, fy - 1, '#ffffff', 24, 8); px(g, dx - 6, fy - 1, opt.signColor || '#3a6ad8', 24, 1);
      tinyText(g, opt.sign, dx - 6 + Math.round((24 - opt.sign.length * 4) / 2) + 1, fy + 1, opt.signColor || '#3a6ad8');
    }
    outline(c, OUT);
    return c;
  });
}

// Laboratorio: techo plano, ventanales grandes y letrero.
export function lab(w, h) {
  return memo('lab' + w + h, () => {
    const W = w * 16, H = (h + 1) * 16;
    const [c, g] = canvas(W + 2, H + 1);
    const roofH = 26;
    px(g, 1, 4, '#5a7a8a', W, roofH - 4); px(g, 3, 6, '#7a9cac', W - 4, roofH - 10);
    for (let x = 6; x < W - 6; x += 10) px(g, x, 8, '#9cc0ce', 6, 3);
    px(g, 0, roofH - 2, '#3a5464', W + 2, 3);
    px(g, 2, roofH + 1, '#eef2f4', W - 2, H - roofH - 2);
    px(g, 2, roofH + 1, '#c8d2da', W - 2, 2);
    for (let i = 0; i < w; i++) if (i !== Math.floor(w / 2)) windowAt(g, i * 16 + 3, roofH + 8, 11, 14, false);
    const dx = Math.floor(w / 2) * 16 + 1;
    px(g, dx - 1, H - 22, '#4a6a7a', 16, 21); px(g, dx + 1, H - 20, '#a8dcf2', 12, 18); px(g, dx + 7, H - 20, '#4a6a7a', 1, 18);
    px(g, dx - 8, roofH + 2, '#ffffff', 30, 7); tinyText(g, 'LAB', dx + 1, roofH + 3, '#2a6a4a');
    px(g, 2, H - 4, '#9aa4ac', W - 2, 3);
    outline(c, OUT);
    return c;
  });
}

// ---------- Muebles ----------
const F = {
  bed: () => { const [c, g] = canvas(16, 30); px(g, 1, 2, '#8a5a30', 14, 26); px(g, 2, 3, '#f8f8f8', 12, 7); px(g, 3, 4, '#ffffff', 6, 3); px(g, 2, 10, '#4a8ad8', 12, 16); px(g, 2, 10, '#78aaf0', 12, 2); for (let y = 13; y < 26; y += 3) px(g, 2, y, '#3a74c0', 12, 1); outline(c, OUT); return c; },
  tv: () => { const [c, g] = canvas(16, 20); px(g, 1, 10, '#8a5a30', 14, 8); px(g, 2, 1, '#3a3a44', 12, 10); px(g, 3, 2, '#6ac0e8', 10, 7); px(g, 4, 3, '#b0e6ff', 3, 2); px(g, 3, 12, '#5a3a20', 4, 2); outline(c, OUT); return c; },
  plant: () => { const [c, g] = canvas(16, 24); px(g, 4, 16, '#c86a3a', 8, 7); px(g, 5, 17, '#e08a4a', 6, 2); ellipse(g, 8, 10, 6, 6, '#3c8c3c'); ellipse(g, 7, 9, 4, 4, '#5cb04c'); px(g, 5, 6, '#94d870', 2, 2); outline(c, OUT); return c; },
  table: () => { const [c, g] = canvas(32, 24); px(g, 1, 3, '#b07a44', 30, 12); px(g, 2, 4, '#d4a062', 28, 9); px(g, 2, 15, '#8a5a30', 28, 3); px(g, 3, 18, '#6a4424', 3, 5); px(g, 26, 18, '#6a4424', 3, 5); px(g, 8, 6, '#ffffff', 6, 4); px(g, 9, 7, '#f08a4a', 4, 2); px(g, 20, 6, '#e8f4ff', 4, 4); outline(c, OUT); return c; },
  chair: () => { const [c, g] = canvas(16, 16); px(g, 4, 2, '#a06a3a', 8, 6); px(g, 3, 8, '#c88a4a', 10, 4); px(g, 4, 12, '#6a4424', 2, 3); px(g, 10, 12, '#6a4424', 2, 3); outline(c, OUT); return c; },
  shelf: () => { const [c, g] = canvas(32, 32); px(g, 1, 1, '#8a5a30', 30, 30); px(g, 2, 2, '#6a4424', 28, 28); const cols = ['#d84a4a', '#4a8ad8', '#f0c040', '#5cb04c', '#a05ad0', '#f0f0f0']; for (let r = 0; r < 3; r++) { px(g, 2, 2 + r * 9 + 8, '#a8743e', 28, 2); for (let i = 0; i < 9; i++) px(g, 3 + i * 3, 3 + r * 9 + (i % 3 ? 1 : 0), cols[(i + r * 2) % 6], 2, 7 - (i % 3 ? 1 : 0)); } outline(c, OUT); return c; },
  kitchen: () => { const [c, g] = canvas(32, 28); px(g, 1, 4, '#f0f0f4', 30, 22); px(g, 1, 4, '#c8ccd8', 30, 3); px(g, 4, 10, '#d8dce6', 10, 12); px(g, 18, 10, '#d8dce6', 10, 12); px(g, 12, 15, '#8a8a94', 2, 2); px(g, 26, 15, '#8a8a94', 2, 2); px(g, 5, 1, '#3a3a44', 8, 3); px(g, 19, 0, '#a8b0c0', 8, 4); outline(c, OUT); return c; },
  fridge: () => { const [c, g] = canvas(16, 32); px(g, 1, 1, '#f4f6fa', 14, 30); px(g, 1, 12, '#c8ccd8', 14, 1); px(g, 12, 4, '#8a8a94', 1, 5); px(g, 12, 15, '#8a8a94', 1, 8); px(g, 3, 3, '#ffffff', 3, 6); outline(c, OUT); return c; },
  desk: () => { const [c, g] = canvas(32, 28); px(g, 1, 10, '#b07a44', 30, 8); px(g, 2, 18, '#8a5a30', 28, 8); px(g, 4, 1, '#3a3a44', 12, 10); px(g, 5, 2, '#6ae0b0', 10, 7); px(g, 20, 6, '#f0f0f0', 8, 5); px(g, 21, 7, '#4a8ad8', 6, 1); outline(c, OUT); return c; },
  console: () => { const [c, g] = canvas(16, 12); px(g, 2, 4, '#e8e8f0', 12, 6); px(g, 4, 6, '#8a8a94', 3, 2); px(g, 9, 6, '#d84a4a', 2, 2); outline(c, OUT); return c; },
  sofa: () => { const [c, g] = canvas(32, 22); px(g, 1, 2, '#c85a5a', 30, 10); px(g, 1, 10, '#e07070', 30, 8); px(g, 1, 2, '#a84040', 3, 16); px(g, 28, 2, '#a84040', 3, 16); px(g, 15, 10, '#c85a5a', 1, 8); outline(c, OUT); return c; },
  counter: (w = 5) => { const [c, g] = canvas(w * 16, 24); px(g, 0, 2, '#f4f0e8', w * 16, 8); px(g, 0, 10, '#d88a8a', w * 16, 12); px(g, 0, 10, '#b86a6a', w * 16, 2); for (let x = 8; x < w * 16; x += 16) px(g, x, 13, '#f0b0b0', 2, 7); outline(c, OUT); return c; },
  shopCounter: (w = 3) => { const [c, g] = canvas(w * 16, 24); px(g, 0, 2, '#e8f0f8', w * 16, 8); px(g, 0, 10, '#5a8ad8', w * 16, 12); px(g, 0, 10, '#3a6ab8', w * 16, 2); px(g, 6, 0, '#3a3a44', 10, 6); px(g, 7, 1, '#6ae0b0', 8, 3); outline(c, OUT); return c; },
  healer: () => { const [c, g] = canvas(32, 28); px(g, 1, 6, '#e8e8f0', 30, 20); px(g, 1, 6, '#c8ccd8', 30, 3); for (let i = 0; i < 6; i++) { const x = 4 + (i % 3) * 9, y = 10 + Math.floor(i / 3) * 7; px(g, x, y, '#d84a4a', 6, 3); px(g, x, y + 3, '#f4f4f4', 6, 3); px(g, x + 2, y + 2, '#3a3a44', 2, 2); } px(g, 10, 0, '#8ae0ff', 12, 6); outline(c, OUT); return c; },
  pc: () => { const [c, g] = canvas(16, 30); px(g, 1, 6, '#c8ccd8', 14, 22); px(g, 2, 7, '#e8e8f0', 12, 20); px(g, 3, 9, '#2a3a5a', 10, 8); px(g, 4, 10, '#4ad0a0', 8, 2); px(g, 4, 13, '#4ad0a0', 5, 1); px(g, 4, 20, '#8a8a94', 8, 2); outline(c, OUT); return c; },
  machine: () => { const [c, g] = canvas(32, 32); px(g, 1, 2, '#9aa8b4', 30, 28); px(g, 2, 3, '#c8d4de', 28, 10); px(g, 4, 5, '#2a3a5a', 12, 7); px(g, 5, 6, '#6af0a0', 3, 1); px(g, 5, 8, '#6af0a0', 8, 1); px(g, 5, 10, '#f0d040', 5, 1); for (let i = 0; i < 4; i++) px(g, 20 + (i % 2) * 5, 5 + Math.floor(i / 2) * 4, ['#d84a4a', '#4ad04a', '#f0d040', '#4a8ad8'][i], 3, 3); px(g, 4, 16, '#7a8894', 24, 12); outline(c, OUT); return c; },
  labTable: () => { const [c, g] = canvas(32, 24); px(g, 1, 3, '#e8eef2', 30, 10); px(g, 1, 13, '#8aa0ac', 30, 9); px(g, 4, 0, '#4a8ad8', 3, 6); px(g, 9, 1, '#f0d040', 3, 5); px(g, 18, 4, '#ffffff', 10, 6); px(g, 19, 5, '#8a8a94', 8, 1); px(g, 19, 7, '#8a8a94', 6, 1); outline(c, OUT); return c; },
  storeShelf: () => { const [c, g] = canvas(32, 30); px(g, 1, 1, '#c8ccd8', 30, 28); px(g, 2, 2, '#f4f6fa', 28, 26); const cols = ['#d84a4a', '#f0d040', '#4a8ad8', '#5cb04c', '#f08a4a']; for (let r = 0; r < 3; r++) { px(g, 2, 9 + r * 8, '#a8b0c0', 28, 1); for (let i = 0; i < 6; i++) px(g, 4 + i * 4, 3 + r * 8, cols[(i + r) % 5], 3, 5); } outline(c, OUT); return c; },
  window: () => { const [c, g] = canvas(24, 16); windowAt(g, 2, 2, 20, 11, false); return c; },
  picture: () => { const [c, g] = canvas(16, 14); px(g, 1, 1, '#8a5a30', 14, 12); px(g, 2, 2, '#9ad8f0', 12, 10); px(g, 2, 8, '#6ac05a', 12, 4); px(g, 9, 3, '#f8e070', 3, 3); return c; },
  clock: () => { const [c, g] = canvas(12, 12); ellipse(g, 6, 6, 5, 5, '#8a5a30'); ellipse(g, 6, 6, 4, 4, '#ffffff'); px(g, 6, 3, '#3a3a44', 1, 3); px(g, 6, 6, '#3a3a44', 2, 1); return c; },
  boxes: () => { const [c, g] = canvas(16, 18); px(g, 1, 6, '#c89a5a', 14, 11); px(g, 1, 6, '#e0b878', 14, 2); px(g, 7, 6, '#a07a40', 2, 11); px(g, 3, 1, '#c89a5a', 9, 6); outline(c, OUT); return c; }
};

export function furniture(name, arg) {
  return memo('f-' + name + (arg ?? ''), () => F[name](arg));
}

export function shade(c) { return autoShade(c); }
