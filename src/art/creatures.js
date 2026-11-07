// Criaturas originales de Alborada: sprites de combate (frente/espalda) e íconos.
import { canvas, px, ellipse, outline, autoShade } from '../core/pixel.js';

function eyes(g, x1, x2, y, big = false) {
  for (const x of [x1, x2]) {
    if (big) { px(g, x - 1, y - 2, '#1e1a24', 4, 6); px(g, x, y - 1, '#ffffff', 1, 2); px(g, x + 1, y + 2, '#5a5a8a', 1, 1); }
    else { px(g, x, y - 1, '#1e1a24', 3, 4); px(g, x, y - 1, '#ffffff', 1, 1); }
  }
}

const DRAW = {
  brotelo(g, back) {
    ellipse(g, 24, 54, 5, 3, '#7a6a4a'); ellipse(g, 40, 54, 5, 3, '#7a6a4a');
    ellipse(g, 32, 42, 19, 14, '#b4a482');
    ellipse(g, 32, 36, 18, 9, '#4fa646');
    for (let i = 0; i < 7; i++) ellipse(g, 16 + i * 5.5, 41 + (i % 2) * 2, 3, 2, '#4fa646');
    ellipse(g, 28, 33, 6, 3, '#78c860');
    px(g, 31, 20, '#3a7a2a', 2, 9);
    ellipse(g, 26, 20, 6, 3, '#7cd05a'); ellipse(g, 38, 17, 6, 3, '#7cd05a');
    px(g, 22, 20, '#a8e880', 4, 1); px(g, 35, 16, '#a8e880', 4, 1);
    if (!back) { eyes(g, 24, 37, 46); px(g, 30, 50, '#5a4a3a', 4, 1); ellipse(g, 20, 50, 2, 1, '#e8a090'); ellipse(g, 44, 50, 2, 1, '#e8a090'); }
    else { ellipse(g, 32, 44, 15, 8, '#4fa646'); ellipse(g, 32, 46, 9, 4, '#3a8a36'); }
  },
  brasin(g, back) {
    ellipse(g, 32, 44, 18, 13, '#4a4452');
    ellipse(g, 32, 50, 12, 5, '#3a3442');
    ellipse(g, 20, 56, 5, 2, '#e8d8c0'); ellipse(g, 44, 56, 5, 2, '#e8d8c0');
    // llama del lomo
    ellipse(g, 34, 28, 7, 9, '#f07a24'); ellipse(g, 30, 22, 4, 7, '#f07a24'); ellipse(g, 39, 23, 3, 5, '#f07a24');
    ellipse(g, 33, 30, 4, 6, '#f8c838'); ellipse(g, 32, 33, 2, 3, '#fff2a0');
    // grietas de brasa
    px(g, 20, 42, '#f08a2a', 4, 1); px(g, 23, 43, '#f08a2a', 1, 2); px(g, 42, 46, '#f08a2a', 4, 1);
    if (!back) { eyes(g, 24, 37, 43); ellipse(g, 32, 49, 3, 2, '#f0909a'); px(g, 31, 48, '#ffffff', 1, 1); ellipse(g, 19, 47, 2, 1, '#f08a5a'); ellipse(g, 45, 47, 2, 1, '#f08a5a'); }
    else { ellipse(g, 32, 40, 12, 6, '#5a5462'); px(g, 26, 38, '#f08a2a', 6, 1); px(g, 34, 42, '#f08a2a', 5, 1); }
  },
  charquin(g, back) {
    // aletas laterales
    ellipse(g, 13, 38, 5, 3, '#9ad8f4'); ellipse(g, 12, 44, 4, 2, '#9ad8f4');
    ellipse(g, 51, 38, 5, 3, '#9ad8f4'); ellipse(g, 52, 44, 4, 2, '#9ad8f4');
    ellipse(g, 32, 44, 17, 14, '#3e98dc');
    ellipse(g, 32, 34, 12, 12, '#3e98dc');
    ellipse(g, 32, 24, 5, 6, '#3e98dc');
    ellipse(g, 32, 18, 2, 4, '#9ad8f4');
    ellipse(g, 32, 49, 11, 8, '#b4e4fa');
    ellipse(g, 22, 57, 5, 2, '#2e78b8'); ellipse(g, 42, 57, 5, 2, '#2e78b8');
    if (!back) { eyes(g, 25, 37, 38, true); px(g, 30, 45, '#1e3a6a', 4, 1); px(g, 29, 44, '#1e3a6a', 1, 1); px(g, 34, 44, '#1e3a6a', 1, 1); }
    else { ellipse(g, 32, 40, 10, 10, '#3088cc'); ellipse(g, 32, 56, 6, 3, '#9ad8f4'); }
  },
  pipiu(g, back) {
    ellipse(g, 26, 57, 2, 2, '#e8a030'); ellipse(g, 38, 57, 2, 2, '#e8a030');
    ellipse(g, 32, 42, 16, 14, '#c8845a');
    ellipse(g, 32, 47, 11, 9, '#f4e2c0');
    ellipse(g, 32, 28, 11, 10, '#c8845a');
    px(g, 30, 16, '#8a5a3a', 2, 4); px(g, 33, 15, '#8a5a3a', 2, 5);
    ellipse(g, 16, 42, 5, 9, '#8a5a3a'); ellipse(g, 48, 42, 5, 9, '#8a5a3a');
    ellipse(g, 15, 49, 3, 3, '#3aa0a0'); ellipse(g, 49, 49, 3, 3, '#3aa0a0');
    if (!back) { eyes(g, 26, 36, 28); px(g, 30, 31, '#f0b030', 4, 2); px(g, 31, 33, '#d08a20', 2, 1); ellipse(g, 23, 33, 2, 1, '#f0a090'); ellipse(g, 41, 33, 2, 1, '#f0a090'); }
    else { ellipse(g, 32, 40, 12, 10, '#a86a44'); ellipse(g, 32, 57, 5, 3, '#8a5a3a'); }
  },
  roedin(g, back) {
    ellipse(g, 18, 22, 6, 6, '#c8986a'); ellipse(g, 46, 22, 6, 6, '#c8986a');
    ellipse(g, 18, 22, 3, 3, '#f0a8b0'); ellipse(g, 46, 22, 3, 3, '#f0a8b0');
    ellipse(g, 32, 40, 19, 17, '#e0b888');
    ellipse(g, 32, 47, 12, 9, '#f8e8d0');
    ellipse(g, 24, 56, 4, 2, '#b88858'); ellipse(g, 40, 56, 4, 2, '#b88858');
    if (!back) {
      eyes(g, 24, 37, 35); ellipse(g, 32, 41, 2, 1, '#8a4a4a');
      px(g, 31, 43, '#ffffff', 3, 3); px(g, 32, 43, '#d8d8d8', 1, 3);
      ellipse(g, 19, 43, 4, 3, '#f8c8a0'); ellipse(g, 45, 43, 4, 3, '#f8c8a0');
    } else { px(g, 28, 24, '#9a6a40', 8, 30); px(g, 22, 28, '#b0805a', 3, 22); px(g, 39, 28, '#b0805a', 3, 22); }
  },
  capullin(g, back) {
    const segs = [[44, 50, 9], [34, 48, 10], [24, 44, 11]];
    segs.forEach(([x, y, r], i) => { ellipse(g, x, y, r, r - 2, i % 2 ? '#9ad050' : '#8cc444'); ellipse(g, x, y + 3, r - 3, 2, '#d8f0a0'); ellipse(g, x - 2, y - 4, 2, 2, '#f8d040'); });
    ellipse(g, 20, 30, 12, 11, '#9ad050');
    px(g, 13, 14, '#4a7a2a', 2, 9); px(g, 25, 13, '#4a7a2a', 2, 9);
    ellipse(g, 13, 13, 2, 2, '#f05a5a'); ellipse(g, 26, 12, 2, 2, '#f05a5a');
    if (!back) { eyes(g, 14, 23, 30); px(g, 17, 36, '#3a5a2a', 4, 1); }
    else ellipse(g, 20, 28, 8, 6, '#86bc42');
  }
};

const cache = new Map();
export function battleSprite(id, back = false) {
  const k = id + back;
  if (cache.has(k)) return cache.get(k);
  const [c, g] = canvas(64, 64);
  DRAW[id](g, back);
  autoShade(c, 0.18, ['#1e1a24', '#ffffff']);
  outline(c, '#1e1a24');
  cache.set(k, c);
  return c;
}

export function icon(id) {
  const k = 'icon' + id;
  if (cache.has(k)) return cache.get(k);
  const [c, g] = canvas(32, 32);
  g.drawImage(battleSprite(id), 0, 0, 64, 64, 0, 0, 32, 32);
  cache.set(k, c);
  return c;
}

export function iconURL(id) {
  return icon(id).toDataURL();
}
