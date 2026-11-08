// Tiles de 16x16 pintados píxel a píxel con autotiling (bordes de caminos, orillas y paredes).
import { px, hash } from '../core/pixel.js';

export const TS = 16;

const C = {
  grass: '#79c85a', grassD: '#5fae46', grassL: '#9bdc72', grassDD: '#4a9338',
  tall: '#4f9e3c', tallD: '#367a2b', tallL: '#7cc85a',
  path: '#ecd9a2', pathD: '#d6bd82', pathL: '#f6ead0', pathE: '#c9ab6c',
  sand: '#f1e2ac', sandD: '#ddc887',
  water: '#4aa3e3', waterD: '#3584c8', waterL: '#8fd0f6', foam: '#e6f6ff',
  wood: '#dfa868', woodD: '#c88c4e', woodL: '#efc48a', woodS: '#a86e38',
  tileA: '#eceef4', tileB: '#d7dfec', tileL: '#c2cadb',
  wall: '#f3e6c6', wallD: '#ddc89e', wallTop: '#8a6a4a', base: '#9c6a3c',
  labWall: '#e4ecf2', labWallD: '#c4d2de',
  void: '#101018'
};

export const SOLID = new Set(['T', 'w', 'W', 'x', ' ', 'f', 'B', 'C', 'R', 'K']);
export const OUTDOOR = new Set(['.', 'g', 'p', 'w', 's', 'F', 'T', 'f', 'x', 'B']);

function grassBase(g, dx, dy, x, y) {
  px(g, dx, dy, C.grass, 16, 16);
  // Variación suave de tono por casilla y matas en forma de "v".
  if (hash(x, y, 77) > 0.7) px(g, dx + 2, dy + 2, '#80cc60', 12, 12);
  for (let i = 0; i < 4; i++) {
    const r = hash(x, y, i + 1);
    const ax = dx + Math.floor(r * 13) + 1, ay = dy + Math.floor(hash(x, y, i + 9) * 13) + 1;
    px(g, ax, ay, C.grassD); px(g, ax + 2, ay, C.grassD); px(g, ax + 1, ay + 1, C.grassD);
    if (r > 0.45) px(g, ax + 1, ay - 1, C.grassL);
  }
  if (hash(x, y, 51) > 0.86) { const fx = dx + 3 + Math.floor(hash(x, y, 52) * 10), fy = dy + 3 + Math.floor(hash(x, y, 53) * 10); px(g, fx, fy, hash(x, y, 54) > 0.5 ? '#ffffff' : '#f8e070'); }
}

function cave(g, dx, dy, x, y) {
  px(g, dx, dy, '#8a7058', 16, 16);
  for (let i = 0; i < 6; i++) { const a = hash(x, y, i), b = hash(x, y, i + 20); px(g, dx + Math.floor(a * 14), dy + Math.floor(b * 14), i % 2 ? '#a08668' : '#725a44', i % 3 ? 1 : 2, 1); }
  if (hash(x, y, 33) > 0.8) { px(g, dx + 5, dy + 9, '#5e4836', 4, 2); px(g, dx + 5, dy + 8, '#b49a7a', 3, 1); }
}
function rockWall(g, dx, dy, x, y, map) {
  const below = map.at(x, y + 1), above = map.at(x, y - 1);
  px(g, dx, dy, '#5a4636', 16, 16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
    const ox = dx + c * 8 + (r % 2 ? 4 : 0) - 2, oy = dy + r * 4;
    px(g, ox, oy, '#6e5644', 7, 3); px(g, ox, oy, '#846a54', 7, 1);
  }
  if (above !== 'R' && above !== undefined) px(g, dx, dy, '#9a8068', 16, 2);
  if (below !== 'R' && below !== undefined) { px(g, dx, dy + 13, '#3e3026', 16, 3); }
}
function cliff(g, dx, dy, x, y, map) {
  grassBase(g, dx, dy, x, y);
  const above = map.at(x, y - 1), below = map.at(x, y + 1);
  px(g, dx, dy + (above === 'K' ? 0 : 4), '#9a8a6a', 16, 16 - (above === 'K' ? 0 : 4));
  for (let r = 0; r < 4; r++) px(g, dx + (r % 2) * 5, dy + 5 + r * 3, '#7a6a4e', 10, 1);
  if (above !== 'K') { px(g, dx, dy + 2, '#5aa046', 16, 2); px(g, dx, dy + 4, '#c0b090', 16, 1); }
  if (below !== 'K') px(g, dx, dy + 14, '#5a4a36', 16, 2);
}

function tallGrass(g, dx, dy, x, y) {
  px(g, dx, dy, C.tall, 16, 16);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const bx = dx + col * 5 + (row % 2 ? 2 : 0) - 1, by = dy + row * 5 + 1;
    px(g, bx + 1, by, C.tallL); px(g, bx + 3, by, C.tallL);
    px(g, bx, by + 1, C.tallL); px(g, bx + 2, by + 1, C.tallL); px(g, bx + 4, by + 1, C.tallL);
    px(g, bx, by + 2, C.tallD, 5, 1); px(g, bx + 1, by + 3, C.tallD, 3, 1);
  }
}

// Parte inferior del pasto alto que tapa los pies del personaje.
export function drawTallGrassOverlay(g, dx, dy) {
  for (let col = 0; col < 3; col++) {
    const bx = dx + col * 5 + 1, by = dy + 10;
    px(g, bx, by, C.tallL, 4, 1);
    px(g, bx - 1, by + 1, C.tall, 6, 3);
    px(g, bx + 1, by + 1, C.tallL); px(g, bx + 3, by + 1, C.tallL);
    px(g, bx - 1, by + 4, C.tallD, 6, 2);
  }
}

function edges(map, x, y, test) {
  return { n: !test(map.at(x, y - 1)), s: !test(map.at(x, y + 1)), w: !test(map.at(x - 1, y)), e: !test(map.at(x + 1, y)) };
}

function path(g, dx, dy, x, y, map) {
  grassBase(g, dx, dy, x, y);
  const isP = t => t === 'p' || t === 'm' || t === 'D';
  const e = edges(map, x, y, isP);
  const l = e.w ? 2 : 0, r = e.e ? 2 : 0, t = e.n ? 2 : 0, b = e.s ? 2 : 0;
  px(g, dx + l, dy + t, C.path, 16 - l - r, 16 - t - b);
  // Bordes irregulares y línea interior más oscura.
  for (let i = 0; i < 16; i++) {
    const j = hash(x * 16 + i, y, 3) > 0.6 ? 1 : 0;
    if (e.n) { px(g, dx + i, dy + 2 + j, C.pathE); }
    if (e.s) { px(g, dx + i, dy + 13 - j, C.pathE); }
    if (e.w) { px(g, dx + 2 + j, dy + i, C.pathE); }
    if (e.e) { px(g, dx + 13 - j, dy + i, C.pathE); }
  }
  for (let i = 0; i < 4; i++) {
    const a = hash(x, y, 20 + i), b2 = hash(x, y, 30 + i);
    const sx = dx + 3 + Math.floor(a * 10), sy = dy + 3 + Math.floor(b2 * 10);
    px(g, sx, sy, i % 2 ? C.pathD : C.pathL, i === 0 ? 2 : 1, 1);
  }
}

function sand(g, dx, dy, x, y) {
  px(g, dx, dy, C.sand, 16, 16);
  for (let i = 0; i < 5; i++) px(g, dx + Math.floor(hash(x, y, i) * 15), dy + Math.floor(hash(x, y, i + 7) * 15), C.sandD);
}

function water(g, dx, dy, x, y, map, frame) {
  const isW = t => t === 'w';
  const e = edges(map, x, y, isW);
  px(g, dx, dy, C.water, 16, 16);
  // Ondas animadas.
  for (let i = 0; i < 2; i++) {
    const wx = dx + ((Math.floor(hash(x, y, i) * 12) + frame * 2 + i * 6) % 12) + 1;
    const wy = dy + 4 + i * 6 + (Math.floor(hash(x, y, i + 4) * 3));
    px(g, wx, wy, C.waterL, 3, 1); px(g, wx + 1, wy - 1, C.waterL, 1, 1);
  }
  if (hash(x, y, frame + 40) > 0.82) px(g, dx + Math.floor(hash(x, y, frame) * 13) + 1, dy + Math.floor(hash(x, y, frame + 9) * 12) + 2, '#ffffff');
  // Orillas: arena + espuma.
  const shore = (sx, sy, w, h) => px(g, sx, sy, C.sand, w, h);
  if (e.n) { shore(dx, dy, 16, 3); px(g, dx, dy + 3, C.foam, 16, 1); px(g, dx, dy + 4, C.waterD, 16, 1); }
  if (e.s) { shore(dx, dy + 14, 16, 2); px(g, dx, dy + 13, C.foam, 16, 1); }
  if (e.w) { shore(dx, dy, 3, 16); px(g, dx + 3, dy, C.foam, 1, 16); px(g, dx + 4, dy + (e.n ? 5 : 0), C.waterD, 1, 16 - (e.n ? 5 : 0)); }
  if (e.e) { shore(dx + 13, dy, 3, 16); px(g, dx + 12, dy, C.foam, 1, 16); }
  if (e.n && frame % 2) px(g, dx + 4 + (x % 3) * 3, dy + 3, C.waterL, 2, 1);
}

function flowers(g, dx, dy, x, y, map, frame) {
  grassBase(g, dx, dy, x, y);
  const cols = [['#f4f4f4', '#f8d040'], ['#f05a5a', '#ffe08a'], ['#f8d040', '#f08a3a']];
  const [petal, mid] = cols[(x * 7 + y * 3) % 3];
  for (const [fx, fy] of [[3, 3], [10, 9]]) {
    const sway = (frame + x + y) % 4 === 0 ? 1 : 0;
    const ox = dx + fx + sway, oy = dy + fy;
    px(g, ox + 1, oy, petal); px(g, ox, oy + 1, petal); px(g, ox + 2, oy + 1, petal); px(g, ox + 1, oy + 2, petal);
    px(g, ox + 1, oy + 1, mid);
    px(g, ox + 1, oy + 3, C.grassDD, 1, 2);
  }
}

function woodFloor(g, dx, dy, x, y) {
  px(g, dx, dy, C.wood, 16, 16);
  for (let r = 0; r < 4; r++) {
    px(g, dx, dy + r * 4 + 3, C.woodD, 16, 1);
    const seam = (r * 5 + x * 7) % 16;
    px(g, dx + seam, dy + r * 4, C.woodS, 1, 3);
    px(g, dx + (seam + 3) % 16, dy + r * 4 + 1, C.woodL, 2, 1);
  }
}

function tileFloor(g, dx, dy, x, y, map) {
  const [A, B, L] = (map && map.floorColors) || [C.tileA, C.tileB, C.tileL];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    px(g, dx + i * 8, dy + j * 8, (i + j + x + y) % 2 ? B : A, 8, 8);
    px(g, dx + i * 8, dy + j * 8 + 7, L, 8, 1);
    px(g, dx + i * 8 + 7, dy + j * 8, L, 1, 8);
    px(g, dx + i * 8 + 1, dy + j * 8 + 1, '#ffffff', 2, 1);
  }
}

function wall(g, dx, dy, x, y, map) {
  const lab = map.style === 'lab' || map.style === 'center' || map.style === 'gym' || map.style === 'league';
  const base = map.wallColor || (lab ? C.labWall : C.wall), dark = map.wallDark || (lab ? C.labWallD : C.wallD);
  const below = map.at(x, y + 1), above = map.at(x, y - 1);
  px(g, dx, dy, base, 16, 16);
  for (let i = 0; i < 16; i += 4) px(g, dx + i, dy, dark, 1, 16);
  if (above !== 'W') { px(g, dx, dy, C.wallTop, 16, 3); px(g, dx, dy + 3, '#5e4430', 16, 1); }
  if (below !== 'W') { px(g, dx, dy + 12, C.base, 16, 4); px(g, dx, dy + 12, '#c08a54', 16, 1); px(g, dx, dy + 15, '#6a4426', 16, 1); }
}

function mat(g, dx, dy, x, y, map) {
  (map.floor === 'k' ? tileFloor : woodFloor)(g, dx, dy, x, y, map);
  px(g, dx + 1, dy + 3, '#c84848', 14, 11);
  px(g, dx + 2, dy + 4, '#e86a5a', 12, 9);
  for (let i = 0; i < 3; i++) px(g, dx + 3, dy + 6 + i * 2, '#f8d8a0', 10, 1);
}

function rug(g, dx, dy, x, y, map) {
  woodFloor(g, dx, dy, x, y);
  const isR = t => t === 'r';
  const e = edges(map, x, y, isR);
  const [rc, rl] = map.style === 'league' ? ['#b83a4a', '#d0505e'] : ['#5a8ad8', '#7aa6ee'];
  px(g, dx, dy, rc, 16, 16);
  if (e.n) px(g, dx, dy, '#f0d070', 16, 2);
  if (e.s) px(g, dx, dy + 14, '#f0d070', 16, 2);
  if (e.w) px(g, dx, dy, '#f0d070', 2, 16);
  if (e.e) px(g, dx + 14, dy, '#f0d070', 2, 16);
  if ((x + y) % 2) px(g, dx + 6, dy + 6, rl, 4, 4);
}

function stairs(g, dx, dy, x, y, map, down) {
  woodFloor(g, dx, dy, x, y);
  for (let i = 0; i < 4; i++) {
    const c = down ? ['#6a4a2e', '#86603a', '#a2774a', '#be9060'][i] : ['#be9060', '#a2774a', '#86603a', '#6a4a2e'][i];
    px(g, dx + 1, dy + i * 4, c, 14, 4);
    px(g, dx + 1, dy + i * 4, '#d8b080', 14, 1);
  }
  px(g, dx, dy, '#5a3e26', 1, 16); px(g, dx + 15, dy, '#5a3e26', 1, 16);
}

export function drawTile(g, code, x, y, map, frame, dx, dy) {
  switch (code) {
    case '.': case 'T': case 'f': case 'B': case 'Y': return grassBase(g, dx, dy, x, y);
    case 'J': return sand(g, dx, dy, x, y);
    case 'O': return cave(g, dx, dy, x, y);
    case 'g': return tallGrass(g, dx, dy, x, y);
    case 'p': case 'D': return path(g, dx, dy, x, y, map);
    case 's': return sand(g, dx, dy, x, y);
    case 'w': return water(g, dx, dy, x, y, map, frame);
    case 'F': return flowers(g, dx, dy, x, y, map, frame);
    case 'x': grassBase(g, dx, dy, x, y); return;
    case 'o': return woodFloor(g, dx, dy, x, y);
    case 'k': case 'C': return tileFloor(g, dx, dy, x, y, map);
    case 'c': return cave(g, dx, dy, x, y);
    case 'R': return rockWall(g, dx, dy, x, y, map);
    case 'K': return cliff(g, dx, dy, x, y, map);
    case 'W': return wall(g, dx, dy, x, y, map);
    case 'm': return mat(g, dx, dy, x, y, map);
    case 'r': return rug(g, dx, dy, x, y, map);
    case 'S': return stairs(g, dx, dy, x, y, map, true);
    case 'U': return stairs(g, dx, dy, x, y, map, false);
    default: px(g, dx, dy, C.void, 16, 16);
  }
}

export const VOID = C.void;
