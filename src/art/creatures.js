// Criaturas originales de Alborada: sprites de combate (frente/espalda) e íconos. 64x64 con sombreado automático.
import { canvas, px, ellipse, outline, autoShade } from '../core/pixel.js';
import { ATLAS, ATLAS_SPECIES } from './bruma-sprites.js';
import {RETRO_ATLAS,RETRO_INDEX} from './retro-reference.js';

const K = '#1e1a24';
function eyes(g, x1, x2, y, o = {}) {
  const c = o.color || K;
  for (const x of [x1, x2]) {
    if (o.big) { px(g, x - 1, y - 2, c, 4, 6); px(g, x, y - 1, '#ffffff', 1, 2); px(g, x + 1, y + 2, '#5a5a8a', 1, 1); }
    else if (o.angry) { px(g, x, y, c, 3, 2); px(g, x - (x === x1 ? 1 : -2), y - 1, K, 3, 1); px(g, x + 1, y, '#ffffff', 1, 1); }
    else { px(g, x, y - 1, c, 3, 4); px(g, x, y - 1, '#ffffff', 1, 1); }
  }
}
const blush = (g, x1, x2, y, c = '#f0a090') => { ellipse(g, x1, y, 2, 1, c); ellipse(g, x2, y, 2, 1, c); };
const leaf = (g, x, y, rx, ry, c = '#7cd05a', hi = '#a8e880') => { ellipse(g, x, y, rx, ry, c); px(g, x - rx + 1, y - 1, hi, rx, 1); };
const flame = (g, x, y, s = 1) => {
  ellipse(g, x, y, 7 * s, 9 * s, '#f07a24'); ellipse(g, x - 4 * s, y - 6 * s, 4 * s, 7 * s, '#f07a24'); ellipse(g, x + 5 * s, y - 5 * s, 3 * s, 5 * s, '#f07a24');
  ellipse(g, x, y + 1, 4 * s, 6 * s, '#f8c838'); ellipse(g, x, y + 3, 2 * s, 3 * s, '#fff2a0');
};

const DRAW = {
  // ---------------- Línea planta
  brotelo(g, back) {
    ellipse(g, 24, 54, 5, 3, '#7a6a4a'); ellipse(g, 40, 54, 5, 3, '#7a6a4a');
    ellipse(g, 32, 42, 19, 14, '#b4a482');
    ellipse(g, 32, 36, 18, 9, '#4fa646');
    for (let i = 0; i < 7; i++) ellipse(g, 16 + i * 5.5, 41 + (i % 2) * 2, 3, 2, '#4fa646');
    ellipse(g, 28, 33, 6, 3, '#78c860');
    px(g, 31, 20, '#3a7a2a', 2, 9);
    leaf(g, 26, 20, 6, 3); leaf(g, 38, 17, 6, 3);
    if (!back) { eyes(g, 24, 37, 46); px(g, 30, 50, '#5a4a3a', 4, 1); blush(g, 20, 44, 50, '#e8a090'); }
    else { ellipse(g, 32, 44, 15, 8, '#4fa646'); ellipse(g, 32, 46, 9, 4, '#3a8a36'); }
  },
  brotoso(g, back) {
    for (const x of [16, 26, 38, 48]) ellipse(g, x, 56, 5, 4, '#8a7a5a');
    ellipse(g, 32, 44, 26, 14, '#a8987a');
    ellipse(g, 32, 34, 22, 12, '#7a6a52');
    for (let i = 0; i < 5; i++) ellipse(g, 16 + i * 8, 30 - (i % 2) * 3, 5, 4, '#7a6a52');
    ellipse(g, 32, 28, 16, 7, '#4fa646');
    px(g, 31, 10, '#3a7a2a', 2, 16); leaf(g, 24, 14, 8, 4); leaf(g, 40, 11, 8, 4); leaf(g, 32, 8, 5, 3);
    ellipse(g, 20, 24, 3, 3, '#f8e070'); ellipse(g, 44, 26, 3, 3, '#f0a0c0');
    if (!back) { ellipse(g, 32, 48, 11, 8, '#c8b896'); eyes(g, 26, 36, 47); px(g, 30, 52, '#5a4a3a', 4, 1); }
    else { ellipse(g, 32, 40, 18, 6, '#6a5a44'); }
  },
  bosqueron(g, back) {
    for (const x of [12, 24, 40, 52]) ellipse(g, x, 58, 6, 4, '#6a5a3a');
    ellipse(g, 32, 46, 30, 14, '#8a7a5e');
    ellipse(g, 32, 38, 26, 10, '#6a5a44');
    px(g, 28, 12, '#7a4a28', 8, 26); px(g, 28, 12, '#9a6436', 3, 26);
    ellipse(g, 32, 12, 20, 11, '#2f7d3a'); ellipse(g, 22, 18, 10, 7, '#3c8c3c'); ellipse(g, 42, 18, 10, 7, '#3c8c3c');
    ellipse(g, 28, 9, 9, 5, '#5cb04c'); px(g, 24, 6, '#94d870', 4, 1);
    ellipse(g, 16, 34, 4, 3, '#94a07a'); ellipse(g, 48, 34, 4, 3, '#94a07a');
    if (!back) { ellipse(g, 32, 50, 12, 7, '#b4a482'); eyes(g, 25, 37, 49, { angry: true }); px(g, 29, 54, '#3a2a1a', 6, 1); }
    else ellipse(g, 32, 42, 20, 6, '#5a4a36');
  },
  // ---------------- Línea fuego
  brasin(g, back) {
    ellipse(g, 32, 44, 18, 13, '#4a4452');
    ellipse(g, 32, 50, 12, 5, '#3a3442');
    ellipse(g, 20, 56, 5, 2, '#e8d8c0'); ellipse(g, 44, 56, 5, 2, '#e8d8c0');
    flame(g, 33, 28, 0.9);
    px(g, 20, 42, '#f08a2a', 4, 1); px(g, 23, 43, '#f08a2a', 1, 2); px(g, 42, 46, '#f08a2a', 4, 1);
    if (!back) { eyes(g, 24, 37, 43); ellipse(g, 32, 49, 3, 2, '#f0909a'); px(g, 31, 48, '#ffffff', 1, 1); blush(g, 19, 45, 47, '#f08a5a'); }
    else { ellipse(g, 32, 40, 12, 6, '#5a5462'); px(g, 26, 38, '#f08a2a', 6, 1); px(g, 34, 42, '#f08a2a', 5, 1); }
  },
  brason(g, back) {
    ellipse(g, 22, 58, 6, 3, '#e8d8c0'); ellipse(g, 42, 58, 6, 3, '#e8d8c0');
    ellipse(g, 32, 44, 18, 15, '#46404e');
    ellipse(g, 32, 26, 13, 11, '#46404e');
    ellipse(g, 14, 42, 5, 4, '#46404e'); ellipse(g, 50, 42, 5, 4, '#46404e');
    px(g, 10, 44, '#f0e0c8', 6, 2); px(g, 48, 44, '#f0e0c8', 6, 2);
    flame(g, 44, 30, 0.8); flame(g, 32, 14, 0.6);
    ellipse(g, 32, 48, 10, 8, '#6a5a6a');
    px(g, 22, 36, '#f08a2a', 5, 1); px(g, 38, 52, '#f08a2a', 4, 1);
    if (!back) { eyes(g, 26, 36, 26, { angry: true }); ellipse(g, 32, 32, 3, 2, '#f0909a'); }
    else { ellipse(g, 32, 40, 14, 10, '#56505e'); flame(g, 32, 34, 0.7); }
  },
  volcarbon(g, back) {
    ellipse(g, 18, 59, 8, 3, '#2a2430'); ellipse(g, 46, 59, 8, 3, '#2a2430');
    ellipse(g, 32, 46, 24, 14, '#3a3442');
    // volcán en la espalda
    for (let y = 0; y < 22; y++) px(g, 32 - (4 + y * 0.6), 14 + y, '#5a4a40', (4 + y * 0.6) * 2, 1);
    px(g, 28, 13, '#f07a24', 8, 3); ellipse(g, 32, 11, 5, 3, '#f8c838');
    px(g, 25, 18, '#f07a24', 2, 10); px(g, 37, 20, '#f07a24', 2, 7);
    ellipse(g, 12, 42, 7, 6, '#3a3442'); ellipse(g, 52, 42, 7, 6, '#3a3442');
    px(g, 6, 46, '#f0e0c8', 8, 2); px(g, 50, 46, '#f0e0c8', 8, 2);
    if (!back) { ellipse(g, 32, 44, 11, 8, '#4e4658'); eyes(g, 25, 36, 42, { angry: true, color: '#f8c838' }); px(g, 28, 48, '#f07a24', 8, 2); }
    else ellipse(g, 32, 44, 16, 8, '#4a4250');
  },
  // ---------------- Línea agua
  charquin(g, back) {
    ellipse(g, 13, 38, 5, 3, '#9ad8f4'); ellipse(g, 12, 44, 4, 2, '#9ad8f4');
    ellipse(g, 51, 38, 5, 3, '#9ad8f4'); ellipse(g, 52, 44, 4, 2, '#9ad8f4');
    ellipse(g, 32, 44, 17, 14, '#3e98dc'); ellipse(g, 32, 34, 12, 12, '#3e98dc'); ellipse(g, 32, 24, 5, 6, '#3e98dc');
    ellipse(g, 32, 18, 2, 4, '#9ad8f4');
    ellipse(g, 32, 49, 11, 8, '#b4e4fa');
    ellipse(g, 22, 57, 5, 2, '#2e78b8'); ellipse(g, 42, 57, 5, 2, '#2e78b8');
    if (!back) { eyes(g, 25, 37, 38, { big: true }); px(g, 30, 45, '#1e3a6a', 4, 1); px(g, 29, 44, '#1e3a6a', 1, 1); px(g, 34, 44, '#1e3a6a', 1, 1); }
    else { ellipse(g, 32, 40, 10, 10, '#3088cc'); ellipse(g, 32, 56, 6, 3, '#9ad8f4'); }
  },
  charcomar(g, back) {
    ellipse(g, 10, 36, 8, 4, '#9ad8f4'); ellipse(g, 8, 44, 6, 3, '#9ad8f4');
    ellipse(g, 54, 36, 8, 4, '#9ad8f4'); ellipse(g, 56, 44, 6, 3, '#9ad8f4');
    ellipse(g, 32, 44, 17, 15, '#2e88d0'); ellipse(g, 32, 28, 12, 11, '#2e88d0');
    ellipse(g, 32, 14, 3, 7, '#9ad8f4'); ellipse(g, 26, 16, 2, 5, '#9ad8f4'); ellipse(g, 38, 16, 2, 5, '#9ad8f4');
    ellipse(g, 32, 50, 11, 9, '#b4e4fa');
    ellipse(g, 46, 58, 8, 3, '#2a74b4');
    if (!back) { eyes(g, 25, 36, 29, { big: true }); px(g, 30, 36, '#1e3a6a', 4, 1); }
    else { ellipse(g, 32, 38, 12, 12, '#2a7cc0'); }
  },
  mareon(g, back) {
    ellipse(g, 8, 30, 8, 12, '#a8e0f8'); ellipse(g, 56, 30, 8, 12, '#a8e0f8');
    ellipse(g, 32, 46, 16, 14, '#2a78c4'); ellipse(g, 32, 26, 11, 12, '#2a78c4');
    ellipse(g, 32, 10, 4, 7, '#a8e0f8'); ellipse(g, 24, 13, 2, 5, '#a8e0f8'); ellipse(g, 40, 13, 2, 5, '#a8e0f8');
    ellipse(g, 32, 50, 10, 10, '#c8ecfc');
    ellipse(g, 32, 19, 2, 2, '#f05a9a'); px(g, 31, 18, '#ffffff', 1, 1);
    ellipse(g, 20, 59, 7, 3, '#2068a8'); ellipse(g, 44, 59, 7, 3, '#2068a8');
    if (!back) { eyes(g, 26, 36, 27, { color: '#2a1a4a' }); px(g, 30, 34, '#1e3a6a', 4, 1); }
    else ellipse(g, 32, 36, 12, 14, '#2470b8');
  },
  // ---------------- Aves y mamíferos
  pipiu(g, back) {
    ellipse(g, 26, 57, 2, 2, '#e8a030'); ellipse(g, 38, 57, 2, 2, '#e8a030');
    ellipse(g, 32, 42, 16, 14, '#c8845a'); ellipse(g, 32, 47, 11, 9, '#f4e2c0'); ellipse(g, 32, 28, 11, 10, '#c8845a');
    px(g, 30, 16, '#8a5a3a', 2, 4); px(g, 33, 15, '#8a5a3a', 2, 5);
    ellipse(g, 16, 42, 5, 9, '#8a5a3a'); ellipse(g, 48, 42, 5, 9, '#8a5a3a');
    ellipse(g, 15, 49, 3, 3, '#3aa0a0'); ellipse(g, 49, 49, 3, 3, '#3aa0a0');
    if (!back) { eyes(g, 26, 36, 28); px(g, 30, 31, '#f0b030', 4, 2); px(g, 31, 33, '#d08a20', 2, 1); blush(g, 23, 41, 33); }
    else { ellipse(g, 32, 40, 12, 10, '#a86a44'); ellipse(g, 32, 57, 5, 3, '#8a5a3a'); }
  },
  pipiolo(g, back) {
    ellipse(g, 26, 59, 3, 2, '#e8a030'); ellipse(g, 38, 59, 3, 2, '#e8a030');
    ellipse(g, 6, 34, 8, 6, '#7a4a2e'); ellipse(g, 58, 34, 8, 6, '#7a4a2e');
    ellipse(g, 10, 30, 10, 12, '#9a6440'); ellipse(g, 54, 30, 10, 12, '#9a6440');
    ellipse(g, 4, 40, 4, 4, '#3aa0a0'); ellipse(g, 60, 40, 4, 4, '#3aa0a0');
    ellipse(g, 32, 42, 15, 15, '#c07a50'); ellipse(g, 32, 47, 10, 10, '#f4e2c0'); ellipse(g, 32, 24, 11, 10, '#c07a50');
    px(g, 28, 8, '#3aa0a0', 2, 8); px(g, 32, 6, '#3aa0a0', 2, 10); px(g, 36, 9, '#3aa0a0', 2, 7);
    ellipse(g, 32, 58, 6, 4, '#7a4a2e');
    if (!back) { eyes(g, 26, 36, 24, { angry: true }); px(g, 29, 28, '#f0b030', 6, 2); px(g, 31, 30, '#d08a20', 2, 2); }
    else ellipse(g, 32, 38, 12, 12, '#a86a44');
  },
  roedin(g, back) {
    ellipse(g, 18, 22, 6, 6, '#c8986a'); ellipse(g, 46, 22, 6, 6, '#c8986a');
    ellipse(g, 18, 22, 3, 3, '#f0a8b0'); ellipse(g, 46, 22, 3, 3, '#f0a8b0');
    ellipse(g, 32, 40, 19, 17, '#e0b888'); ellipse(g, 32, 47, 12, 9, '#f8e8d0');
    ellipse(g, 24, 56, 4, 2, '#b88858'); ellipse(g, 40, 56, 4, 2, '#b88858');
    if (!back) { eyes(g, 24, 37, 35); ellipse(g, 32, 41, 2, 1, '#8a4a4a'); px(g, 31, 43, '#ffffff', 3, 3); px(g, 32, 43, '#d8d8d8', 1, 3); ellipse(g, 19, 43, 4, 3, '#f8c8a0'); ellipse(g, 45, 43, 4, 3, '#f8c8a0'); }
    else { px(g, 28, 24, '#9a6a40', 8, 30); px(g, 22, 28, '#b0805a', 3, 22); px(g, 39, 28, '#b0805a', 3, 22); }
  },
  roedon(g, back) {
    ellipse(g, 50, 54, 12, 5, '#7a5a3a'); for (let i = 0; i < 4; i++) px(g, 42 + i * 5, 52, '#5a4028', 1, 5);
    ellipse(g, 18, 18, 5, 5, '#a87850'); ellipse(g, 46, 18, 5, 5, '#a87850');
    ellipse(g, 32, 40, 20, 18, '#b8885a'); ellipse(g, 32, 46, 13, 11, '#e8d0b0');
    ellipse(g, 24, 58, 5, 2, '#8a6038'); ellipse(g, 40, 58, 5, 2, '#8a6038');
    if (!back) { eyes(g, 24, 37, 32, { angry: true }); ellipse(g, 32, 37, 3, 2, '#6a3a3a'); px(g, 29, 40, '#ffffff', 6, 5); px(g, 32, 40, '#d8d8d8', 1, 5); }
    else px(g, 26, 24, '#8a6038', 12, 30);
  },
  // ---------------- Bichos
  capullin(g, back) {
    [[44, 50, 9], [34, 48, 10], [24, 44, 11]].forEach(([x, y, r], i) => { ellipse(g, x, y, r, r - 2, i % 2 ? '#9ad050' : '#8cc444'); ellipse(g, x, y + 3, r - 3, 2, '#d8f0a0'); ellipse(g, x - 2, y - 4, 2, 2, '#f8d040'); });
    ellipse(g, 20, 30, 12, 11, '#9ad050');
    px(g, 13, 14, '#4a7a2a', 2, 9); px(g, 25, 13, '#4a7a2a', 2, 9);
    ellipse(g, 13, 13, 2, 2, '#f05a5a'); ellipse(g, 26, 12, 2, 2, '#f05a5a');
    if (!back) { eyes(g, 14, 23, 30); px(g, 17, 36, '#3a5a2a', 4, 1); } else ellipse(g, 20, 28, 8, 6, '#86bc42');
  },
  capullado(g, back) {
    px(g, 31, 2, '#e8e8d0', 2, 10);
    ellipse(g, 32, 34, 13, 22, '#a8b878'); ellipse(g, 32, 30, 10, 16, '#c0d090');
    for (let y = 18; y < 54; y += 6) px(g, 20, y, '#8a9a5a', 24, 1);
    if (!back) { eyes(g, 26, 35, 30, { angry: true }); } else px(g, 30, 16, '#8a9a5a', 4, 36);
  },
  alasol(g, back) {
    ellipse(g, 16, 22, 14, 13, '#f8c838'); ellipse(g, 48, 22, 14, 13, '#f8c838');
    ellipse(g, 18, 44, 10, 9, '#f0a020'); ellipse(g, 46, 44, 10, 9, '#f0a020');
    ellipse(g, 14, 20, 5, 5, '#fff2a0'); ellipse(g, 50, 20, 5, 5, '#fff2a0');
    ellipse(g, 16, 44, 3, 3, '#3a2a1a'); ellipse(g, 48, 44, 3, 3, '#3a2a1a');
    ellipse(g, 32, 36, 5, 16, '#4a3a2a');
    ellipse(g, 32, 18, 6, 6, '#4a3a2a');
    px(g, 28, 6, '#4a3a2a', 1, 8); px(g, 36, 6, '#4a3a2a', 1, 8); ellipse(g, 27, 5, 2, 2, '#f8c838'); ellipse(g, 37, 5, 2, 2, '#f8c838');
    if (!back) eyes(g, 29, 34, 18, { color: '#f05a5a' });
  },
  setin(g, back) {
    ellipse(g, 32, 50, 10, 9, '#f4ead4');
    ellipse(g, 32, 34, 22, 13, '#c8603a'); ellipse(g, 32, 30, 18, 9, '#e07848');
    for (const [x, y] of [[22, 30], [32, 26], [42, 31], [28, 38], [38, 37]]) ellipse(g, x, y, 2, 2, '#fff6e0');
    ellipse(g, 26, 58, 4, 2, '#d8c8a8'); ellipse(g, 38, 58, 4, 2, '#d8c8a8');
    if (!back) { eyes(g, 27, 35, 49); px(g, 30, 54, '#5a4a3a', 4, 1); blush(g, 24, 40, 53); }
  },
  seton(g, back) {
    ellipse(g, 32, 50, 13, 11, '#f0e4c8');
    ellipse(g, 14, 48, 5, 3, '#f0e4c8'); ellipse(g, 50, 48, 5, 3, '#f0e4c8');
    ellipse(g, 32, 28, 28, 15, '#a84a30'); ellipse(g, 32, 24, 24, 11, '#c8603a');
    for (const [x, y] of [[16, 26], [28, 18], [44, 22], [22, 34], [40, 32], [34, 26]]) ellipse(g, x, y, 3, 2, '#fff6e0');
    leaf(g, 54, 42, 6, 3); px(g, 50, 44, '#3a7a2a', 4, 1);
    ellipse(g, 24, 60, 5, 2, '#d0bc98'); ellipse(g, 40, 60, 5, 2, '#d0bc98');
    if (!back) { eyes(g, 26, 36, 48, { angry: true }); px(g, 29, 54, '#5a4a3a', 6, 1); }
  },
  // ---------------- Eléctricos y rocas
  chispaz(g, back) {
    px(g, 48, 40, '#3a6ad8', 4, 4); px(g, 51, 36, '#3a6ad8', 4, 4); px(g, 54, 32, '#3a6ad8', 4, 4); px(g, 52, 28, '#3a6ad8', 4, 4);
    ellipse(g, 32, 42, 17, 15, '#f8d038');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ellipse(g, 32 + Math.cos(a) * 16, 42 + Math.sin(a) * 14, 3, 3, '#f8d038'); }
    px(g, 24, 18, '#3a3a44', 2, 10); px(g, 38, 18, '#3a3a44', 2, 10); ellipse(g, 25, 17, 3, 2, '#6ab8f8'); ellipse(g, 39, 17, 3, 2, '#6ab8f8');
    if (!back) { eyes(g, 25, 36, 40, { big: true }); px(g, 30, 47, '#8a5a20', 4, 1); blush(g, 20, 44, 46, '#f08a5a'); }
    else { px(g, 26, 34, '#e0b020', 12, 2); px(g, 28, 40, '#e0b020', 8, 2); }
  },
  voltaz(g, back) {
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.9 + i / 8 * Math.PI * 0.8; px(g, 32 + Math.cos(a) * 22 - 2, 30 + Math.sin(a) * 18 - 2, '#2a5ac8', 5, 5); }
    ellipse(g, 32, 36, 21, 18, '#3a6ad8');
    ellipse(g, 32, 42, 15, 14, '#f8d038');
    ellipse(g, 22, 58, 5, 3, '#f8d038'); ellipse(g, 42, 58, 5, 3, '#f8d038');
    px(g, 12, 46, '#f8f8f8', 6, 2); px(g, 14, 48, '#f8f8f8', 2, 4); px(g, 46, 46, '#f8f8f8', 6, 2);
    if (!back) { eyes(g, 25, 36, 38, { angry: true }); px(g, 29, 45, '#8a5a20', 6, 1); }
    else ellipse(g, 32, 36, 16, 14, '#3060cc');
  },
  guijarrin(g, back) {
    ellipse(g, 12, 44, 5, 4, '#8a8a92'); ellipse(g, 52, 44, 5, 4, '#8a8a92');
    ellipse(g, 32, 42, 18, 16, '#9a9aa2');
    px(g, 22, 30, '#6a6a72', 6, 1); px(g, 27, 31, '#6a6a72', 1, 4); px(g, 38, 50, '#6a6a72', 5, 1);
    ellipse(g, 26, 32, 5, 3, '#c0c0c8');
    if (!back) { eyes(g, 25, 36, 42, { angry: true }); px(g, 29, 49, '#4a4a52', 6, 1); }
  },
  penon(g, back) {
    ellipse(g, 8, 46, 8, 7, '#7a7a82'); ellipse(g, 56, 46, 8, 7, '#7a7a82');
    ellipse(g, 32, 40, 25, 22, '#88888f');
    ellipse(g, 32, 22, 18, 6, '#5cb04c'); ellipse(g, 26, 20, 6, 3, '#7cc85a');
    px(g, 16, 36, '#5a5a62', 8, 1); px(g, 40, 48, '#5a5a62', 9, 1); px(g, 44, 30, '#5a5a62', 1, 8);
    ellipse(g, 20, 58, 8, 3, '#6a6a72'); ellipse(g, 44, 58, 8, 3, '#6a6a72');
    if (!back) { eyes(g, 24, 37, 38, { angry: true, color: '#3a2a1a' }); px(g, 27, 46, '#3a3a42', 10, 2); }
  },
  // ---------------- Mar, sombra y psique
  medusin(g, back) {
    for (let i = 0; i < 5; i++) { const x = 20 + i * 6; for (let y = 40; y < 58; y++) px(g, x + Math.round(Math.sin((y + i * 3) / 3) * 1.5), y, '#8ac8f0', 2, 1); }
    ellipse(g, 32, 32, 18, 14, '#7ac0f0'); ellipse(g, 32, 28, 14, 9, '#a8dcfa');
    ellipse(g, 32, 40, 17, 3, '#5aa8e0'); ellipse(g, 26, 24, 4, 3, '#e8f8ff');
    if (!back) { eyes(g, 26, 36, 33); px(g, 30, 37, '#2a5a8a', 4, 1); }
  },
  meduson(g, back) {
    for (let i = 0; i < 7; i++) { const x = 14 + i * 6; for (let y = 38; y < 62; y++) px(g, x + Math.round(Math.sin((y + i * 4) / 4) * 2), y, i % 2 ? '#c8a0f0' : '#8ac8f0', 2, 1); }
    ellipse(g, 32, 26, 22, 16, '#6ab0ec'); ellipse(g, 32, 22, 17, 10, '#9ad4f8');
    for (let i = 0; i < 5; i++) ellipse(g, 16 + i * 8, 9 + (i % 2) * 2, 3, 4, '#c8a0f0');
    ellipse(g, 32, 28, 5, 5, '#f05a9a'); ellipse(g, 31, 27, 2, 2, '#ffd0e8');
    ellipse(g, 32, 37, 21, 3, '#4a98d8');
    if (!back) eyes(g, 22, 40, 26, { color: '#2a1a4a' });
  },
  sombrin(g, back) {
    for (let i = 0; i < 3; i++) ellipse(g, 50 + i * 3, 46 - i * 6, 4 - i, 4 - i, '#4a3a5a');
    ellipse(g, 32, 44, 17, 13, '#4a3a5a');
    ellipse(g, 32, 30, 13, 11, '#4a3a5a');
    px(g, 20, 16, '#4a3a5a', 5, 8); px(g, 39, 16, '#4a3a5a', 5, 8); px(g, 21, 14, '#4a3a5a', 3, 2); px(g, 40, 14, '#4a3a5a', 3, 2);
    ellipse(g, 32, 48, 9, 6, '#5e4c70');
    if (!back) { eyes(g, 25, 36, 29, { color: '#f8d040', angry: true }); px(g, 29, 35, '#f8f8f8', 2, 2); px(g, 34, 35, '#f8f8f8', 2, 2); }
  },
  sombrador(g, back) {
    for (let i = 0; i < 5; i++) ellipse(g, 12 + i * 10, 58 - (i % 2) * 3, 5, 4, '#2e2238');
    ellipse(g, 32, 40, 19, 18, '#3a2c48');
    ellipse(g, 32, 20, 13, 11, '#3a2c48');
    px(g, 18, 4, '#3a2c48', 4, 12); px(g, 42, 4, '#3a2c48', 4, 12);
    ellipse(g, 10, 36, 6, 4, '#3a2c48'); ellipse(g, 54, 36, 6, 4, '#3a2c48');
    for (const x of [4, 7, 10]) px(g, x, 38, '#e8e8f0', 1, 4);
    for (const x of [54, 57, 60]) px(g, x, 38, '#e8e8f0', 1, 4);
    ellipse(g, 32, 44, 10, 8, '#4c3c5e');
    if (!back) { eyes(g, 25, 36, 19, { color: '#f04848', angry: true }); px(g, 27, 26, '#e8e8f0', 10, 1); }
  },
  mentelin(g, back) {
    ellipse(g, 14, 28, 11, 9, '#e8d8f8'); ellipse(g, 50, 28, 11, 9, '#e8d8f8');
    ellipse(g, 14, 28, 5, 4, '#c8a8e8'); ellipse(g, 50, 28, 5, 4, '#c8a8e8');
    ellipse(g, 32, 36, 13, 14, '#c098e0');
    ellipse(g, 32, 40, 8, 8, '#e0c8f8');
    px(g, 27, 12, '#8a6aa8', 1, 12); px(g, 37, 12, '#8a6aa8', 1, 12); ellipse(g, 26, 11, 2, 2, '#f05a9a'); ellipse(g, 38, 11, 2, 2, '#f05a9a');
    ellipse(g, 32, 56, 6, 2, '#e0c8f8');
    if (!back) { eyes(g, 26, 36, 33, { big: true }); ellipse(g, 32, 26, 2, 2, '#f05a9a'); }
  },
  espejalba(g, back) {
    // alas como espejos
    ellipse(g, 12, 30, 12, 18, '#d8f0ff'); ellipse(g, 52, 30, 12, 18, '#d8f0ff');
    ellipse(g, 12, 30, 8, 13, '#a8d8f8'); ellipse(g, 52, 30, 8, 13, '#a8d8f8');
    px(g, 8, 22, '#ffffff', 3, 10); px(g, 50, 22, '#ffffff', 3, 10);
    ellipse(g, 32, 44, 14, 14, '#f4fbff');
    ellipse(g, 32, 50, 9, 8, '#c8e8fc');
    px(g, 30, 14, '#f4fbff', 5, 22);
    ellipse(g, 35, 13, 7, 6, '#f4fbff');
    px(g, 40, 12, '#f0b040', 6, 3);
    for (let i = 0; i < 4; i++) px(g, 30 + i * 2, 3 + i, '#7ad0f8', 2, 6 - i);
    ellipse(g, 32, 58, 10, 3, '#8ac8f0');
    if (!back) { eyes(g, 35, 35, 12, { color: '#2a3a8a' }); ellipse(g, 32, 40, 3, 3, '#7ad0f8'); }
  }
};

// Sprites del modo clásico sacados de los modelos 3D (scripts/sprites.cjs); DRAW queda como respaldo.
let atlasImg = null, retroImg = null;
const loadAtlas = url => new Promise(resolve=>{
  const im = new Image();
  im.onload = () => resolve(im);
  im.onerror = () => resolve(null);
  im.src = url;
});
export const spritesReady = typeof Image === 'undefined' ? Promise.resolve(false) :
  Promise.all([loadAtlas(ATLAS.url),loadAtlas(RETRO_ATLAS.url)]).then(([classic,retro])=>{
    atlasImg = classic; retroImg = retro;
    cache.clear();
    return !!(classic||retro);
  });
function atlasSprite(g, id, back) {
  // Ilustraciones originales del paquete visual aprobado. Los retratos frontales,
  // los iconos de equipo y el Registro utilizan exactamente este atlas.
  // La espalda conserva el render previo hasta tener vistas traseras revisadas.
  const ri=RETRO_INDEX.get(id);
  if (!back && retroImg && ri!==undefined) {
    const S=RETRO_ATLAS.size,cols=RETRO_ATLAS.cols,prev=g.imageSmoothingEnabled;
    g.imageSmoothingEnabled=false;
    g.drawImage(retroImg,(ri%cols)*S,Math.floor(ri/cols)*S,S,S,0,0,64,64);
    g.imageSmoothingEnabled=prev;
    return true;
  }
  const i = ATLAS_SPECIES.indexOf(id); if (i < 0 || !atlasImg) return false;
  const n = i * 2 + (back ? 1 : 0), S = ATLAS.size;
  g.drawImage(atlasImg, (n % ATLAS.cols) * S, Math.floor(n / ATLAS.cols) * S, S, S, 0, 0, 64, 64);
  return true;
}
export const hasSprite = id => !!DRAW[id] || ATLAS_SPECIES.includes(id);

// Dirección artística Bruma 16-bit: convertir cada sprite del atlas 3D
// en un sprite de paleta limitada, con matices compactos como el dossier retro.
// Se ejecuta UNA vez por especie y orientación; no toca datos ni combates.
const BAYER4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
];
function finishRetroSprite(c) {
  const g=c.getContext('2d',{willReadFrequently:true});
  let pixels;
  try{pixels=g.getImageData(0,0,c.width,c.height);}catch{return;}
  const d=pixels.data,w=c.width,h=c.height;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,alpha=d[i+3];
    if(alpha<24){d[i+3]=0;continue;}
    // Asegura un borde limpio, sin el halo semitransparente de render 3D.
    d[i+3]=255;
    const R=d[i],G=d[i+1],B=d[i+2];
    const gray=(R*.24+G*.66+B*.10),shade=((BAYER4[(y&3)*4+(x&3)]-7.5)/15)*14;
    // Paleta 5-bit aproximada, saturación ligeramente superior y sombra tinta.
    const q=v=>Math.max(0,Math.min(255,Math.round(v/17)*17));
    d[i]=q(gray+(R-gray)*1.19+shade);
    d[i+1]=q(gray+(G-gray)*1.15+shade);
    d[i+2]=q(gray+(B-gray)*1.23+shade);
  }
  g.putImageData(pixels,0,0);
}

const cache = new Map();
// Todas las especies salen del atlas generado con sus modelos 3D, así el modo clásico se ve igual que el 3D.
// Mientras el atlas carga se usa el pixel art original (DRAW) o una silueta suave, sin guardarlos en la caché.
export function battleSprite(id, back = false) {
  const k = id + back;
  if (cache.has(k)) return cache.get(k);
  const [c, g] = canvas(64, 64);
  if (!atlasSprite(g, id, back)) {
    if (DRAW[id]) { DRAW[id](g, back); autoShade(c, 0.18, ['#1e1a24', '#ffffff']); }
    else { ellipse(g, 32, 40, 18, 16, '#b8b4c8'); ellipse(g, 32, 24, 13, 12, '#c8c4d8'); }
    outline(c, '#1e1a24'); finishRetroSprite(c); c.temp = true; return c;
  }
  outline(c, '#1e1a24');
  // Los recortes ya tienen su paleta original de 30 colores; no reprocesarlos.
  if (!(retroImg && !back && RETRO_INDEX.has(id))) finishRetroSprite(c);
  cache.set(k, c);
  return c;
}
// Silueta blanca (para evoluciones y capturas)
export function silhouette(id, color = '#ffffff', back = false) {
  const k = 'sil' + id + color + back;
  if (cache.has(k)) return cache.get(k);
  const [c, g] = canvas(64, 64), base = battleSprite(id, back);
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  if (!base.temp) cache.set(k, c);
  return c;
}
export function icon(id) {
  const k = 'icon' + id;
  if (cache.has(k)) return cache.get(k);
  const [c, g] = canvas(32, 32), base = battleSprite(id);
  g.drawImage(base, 0, 0, 64, 64, 0, 0, 32, 32);
  if (!base.temp) cache.set(k, c);
  return c;
}
export function iconURL(id) { return battleSprite(id).toDataURL(); }
export const CREATURE_IDS = [...new Set([...Object.keys(DRAW), ...ATLAS_SPECIES])];
