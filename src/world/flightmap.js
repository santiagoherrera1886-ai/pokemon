// Tierra Grande vista desde el aire. Se pinta por pedazos de 32 × 32 casillas (4 píxeles por casilla) que se
// guardan en caché: los usan la vista de vuelo en pixel, el suelo del vuelo en 3D (como textura) y, en chiquito,
// el mapa del menú. Cada pedazo trae además la lista de árboles y de edificios (con su altura) para el 3D.
import { SIZE, TG, CITIES, AIRPORTS, ROADS, BLOCK, tileAt, cityAt, blockPlan, biomeAt } from './tierra.js';

export const CH = 32, CPX = 4;
export const NCH = SIZE / CH;   // 126 pedazos por lado

const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// Colores del suelo por bioma (casilla '.') y de cada tipo de casilla.
const GROUND = { llano: [134, 196, 98], bosque: [112, 178, 86], selva: [92, 166, 80], desierto: [232, 210, 150], sierra: [150, 176, 112], nevado: [236, 242, 246], playa: [238, 224, 164], mar: [70, 140, 210] };
const TILE = { g: [86, 158, 70], p: [92, 96, 108], s: [238, 222, 160], w: [64, 136, 208], F: [134, 196, 98], O: [150, 146, 136], K: [150, 128, 96], B: [70, 130, 56] };
const TREE = { T: [52, 120, 60], Y: [40, 98, 74], J: [96, 160, 64] };
const SNOWTREE = [118, 150, 140], SIDEWALK = [212, 206, 192], YARD = [150, 200, 110];
export const TREE_TILES = new Set(['T', 'Y', 'J']);

// Color de una casilla vista desde arriba (sin edificios), como [r, g, b]. biome es opcional (se calcula si falta).
export function groundColor(t, x, y, biome) {
  const b = biome || biomeAt(x, y);
  if (t === '.') {
    const c = cityAt(x, y);
    if (c) { const plan = blockPlan(c, Math.floor(x / BLOCK), Math.floor(y / BLOCK)); return plan.type === 'parque' || plan.type === 'casas' ? YARD : SIDEWALK; }
    return GROUND[b] || GROUND.llano;
  }
  if (TREE[t]) return b === 'nevado' ? SNOWTREE : TREE[t];
  if (t === 'g' && b === 'nevado') return [205, 221, 231];
  if (t === 'g' && b === 'desierto') return [210, 186, 116];
  return TILE[t] || GROUND[b] || GROUND.llano;
}

// ---------------------------------------------------------------- Pedazos
const cache = new Map();          // clave → pedazo
const MAX = 180;                  // ~11 MB de lienzos como mucho
export const chunkKey = (cx, cy) => cy * NCH + cx;
export function getChunk(cx, cy) {
  const k = chunkKey(cx, cy), c = cache.get(k);
  if (c) { cache.delete(k); cache.set(k, c); }   // LRU
  return c || null;
}
// Pinta los pedazos que falten de la lista, hasta gastar `budget` milisegundos. Devuelve cuántos quedaron pendientes.
export function warmChunks(list, budget = 6) {
  const t0 = performance.now();
  let left = 0;
  for (const [cx, cy] of list) {
    if (cx < 0 || cy < 0 || cx >= NCH || cy >= NCH || cache.has(chunkKey(cx, cy))) continue;
    if (performance.now() - t0 > budget) { left++; continue; }
    cache.set(chunkKey(cx, cy), buildChunk(cx, cy));
    while (cache.size > MAX) { const old = cache.keys().next().value; cache.get(old).dispose?.(); cache.delete(old); }
  }
  return left;
}
// Pedazos que tocan un rectángulo en casillas de Tierra Grande, del centro hacia afuera.
export function chunksAround(x, y, rx, ry = rx) {
  const out = [], cx0 = Math.floor((x - rx) / CH), cx1 = Math.floor((x + rx) / CH), cy0 = Math.floor((y - ry) / CH), cy1 = Math.floor((y + ry) / CH);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) out.push([cx, cy]);
  const mx = x / CH - .5, my = y / CH - .5;
  return out.sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my));
}

// Datos de un pedazo sin dibujar (sirve también en las pruebas, sin navegador): casillas, árboles y edificios.
export function chunkData(cx, cy) {
  const x0 = cx * CH, y0 = cy * CH, tiles = new Array(CH * CH), biomes = new Array(64);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) biomes[j * 8 + i] = biomeAt(x0 + i * 4 + 2, y0 + j * 4 + 2);
  const trees = [];
  for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
    const t = tileAt(x0 + x, y0 + y); tiles[y * CH + x] = t;
    if (TREE_TILES.has(t) && (x + y) % 2 === 0) trees.push([x0 + x, y0 + y, t, biomes[(y >> 2) * 8 + (x >> 2)] === 'nevado']);
  }
  // Edificios de las manzanas que tocan el pedazo, en casillas de Tierra Grande, con su altura en pisos de casa.
  const buildings = [];
  const c = CITIES.find(c => c.x0 < x0 + CH && c.x1 > x0 && c.y0 < y0 + CH && c.y1 > y0);
  if (c) {
    for (let by = Math.floor(y0 / BLOCK); by * BLOCK < y0 + CH; by++) for (let bx = Math.floor(x0 / BLOCK); bx * BLOCK < x0 + CH; bx++) {
      const cc = cityAt(bx * BLOCK + 12, by * BLOCK + 12); if (!cc) continue;
      const plan = blockPlan(cc, bx, by), ox = bx * BLOCK + 4, oy = by * BLOCK + 4;
      for (const o of plan.objects) {
        if (o.lot) continue;   // las casas de los lotes dependen de la partida: desde el aire se ve el lote
        const gx = ox + o.x, gy = oy + o.y;
        if (gx >= x0 + CH || gy >= y0 + CH || gx + o.w <= x0 || gy + o.h <= y0) continue;
        const h = o.kind === 'tower' ? o.floors * 1.05 + .5 : o.kind === 'big' ? 2.4 : o.kind === 'house' ? 1.8 : o.kind === 'car' ? .7 : o.kind === 'statue' || o.kind === 'fountain' ? 1 : o.kind === 'pump' ? 1 : o.kind === 'pool' ? .08 : 0;
        if (!h) continue;
        const wall = o.kind === 'pool' ? '#f2ede2' : o.opt?.wall || o.color || '#d8d0c0', roof = o.kind === 'pool' ? '#2f8fd0' : o.opt?.roof || (o.kind === 'car' ? o.color : o.kind === 'statue' ? '#b8b4a8' : o.kind === 'fountain' ? '#7ac0e8' : o.kind === 'pump' ? '#e04848' : wall);
        buildings.push({ kind: o.kind, x: gx, y: gy, w: o.w, h: o.h, height: h, wall, roof });
      }
    }
  }
  for (const a of AIRPORTS) {
    const [ax, ay] = a.apron;
    if (ax + 48 <= x0 || ax >= x0 + CH || ay + 24 <= y0 || ay >= y0 + CH) continue;
    // terminal, hangar y torre de control (mismos lugares que en tgMap)
    buildings.push({ kind: 'big', x: ax + 2, y: ay + 9, w: 12, h: 5, height: 2.6, wall: '#eef3f6', roof: '#3f7fc8' });
    buildings.push({ kind: 'big', x: ax + 30, y: ay + 6, w: 12, h: 8, height: 3.2, wall: '#d8dde2', roof: '#6a7480' });
    buildings.push({ kind: 'tower', x: ax + 17, y: ay + 10, w: 3, h: 3, height: 6.8, wall: '#e8eef2', roof: '#7ac8e8' });
  }
  return { cx, cy, x0, y0, tiles, biomes, trees, buildings };
}

function buildChunk(cx, cy) {
  const d = chunkData(cx, cy), { x0, y0, tiles, biomes } = d, W = CH * CPX;
  if (typeof document === 'undefined') return d;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = W;
  const g = canvas.getContext('2d'), img = g.createImageData(W, W), px = img.data;
  const put = (x, y, c) => { const i = (y * W + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; };
  for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
    const t = tiles[y * CH + x], gx = x0 + x, gy = y0 + y, b = biomes[(y >> 2) * 8 + (x >> 2)];
    const base = TREE[t] ? (b === 'nevado' ? GROUND.nevado : GROUND[b] || GROUND.llano) : groundColor(t, gx, gy, b);
    for (let j = 0; j < CPX; j++) for (let i = 0; i < CPX; i++) {
      const n = hash(gx * 4 + i, gy * 4 + j, 3) - .5;
      let c = base;
      if (t === 'w') c = mix(base, [150, 200, 240], n > .44 ? .5 : 0);
      else if (t === 'p') c = mix(base, [0, 0, 0], n * .08);
      else c = mix(base, n > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(n) * .14);
      if (t === 'F' && hash(gx, gy, j * 4 + i) > .82) c = hash(gx, gy, 9) > .5 ? [240, 150, 180] : [246, 220, 96];
      put(x * CPX + i, y * CPX + j, c);
    }
    if (TREE[t]) {   // copa redonda con sombra abajo a la derecha y brillo arriba a la izquierda
      const tc = groundColor(t, gx, gy, b), dark = mix(tc, [0, 0, 0], .32), light = mix(tc, [255, 255, 255], .25);
      const X = x * CPX, Y = y * CPX;
      for (const [i, j] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]]) put(X + i, Y + j, j >= 2 || i === 3 ? dark : tc);
      put(X + 1, Y + 1, light); put(X + 2, Y + 1, tc); put(X + 1, Y + 2, tc); put(X + 2, Y + 2, dark);
    }
  }
  g.putImageData(img, 0, 0);
  // Líneas de las carreteras (las de la ciudad no llevan) y marcas de las pistas.
  g.save(); g.translate(-x0 * CPX, -y0 * CPX); g.lineCap = 'butt';
  for (const r of ROADS) {
    const L = r.line;
    let near = false;
    for (const [x, y] of L) if (x > x0 - 40 && x < x0 + CH + 40 && y > y0 - 40 && y < y0 + CH + 40) { near = true; break; }
    if (!near) continue;
    const path = () => { g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(x * CPX, y * CPX) : g.moveTo(x * CPX, y * CPX)); };
    if (r.w >= 6) { g.strokeStyle = '#f2c84a'; g.lineWidth = 1.5; g.setLineDash([]); path(); g.stroke(); }
    else { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.setLineDash([6, 6]); path(); g.stroke(); }
  }
  g.setLineDash([]);
  for (const a of AIRPORTS) {
    if (a.x1 < x0 || a.x0 > x0 + CH || a.y1 < y0 || a.y0 > y0 + CH) continue;
    g.fillStyle = '#f6f6f2';
    for (let x = a.x0 + 10; x < a.x1 - 10; x += 8) g.fillRect(x * CPX, (a.y0 + 4) * CPX - 1, 4 * CPX, 2);
    for (const ex of [a.x0 + 2, a.x1 - 6]) for (let k = 0; k < 4; k++) g.fillRect(ex * CPX, (a.y0 + 1 + k * 1.6) * CPX, 4 * CPX, 3);
  }
  g.restore();
  // Edificios: sombra hacia abajo a la derecha según la altura, techo y borde.
  for (const o of d.buildings) {
    const X = (o.x - x0) * CPX, Y = (o.y - y0) * CPX, W2 = o.w * CPX, H2 = o.h * CPX, s = Math.min(14, o.height * 1.4);
    g.fillStyle = 'rgba(20,28,40,.28)'; g.fillRect(X + s * .6, Y + s * .8, W2, H2);
    g.fillStyle = o.roof; g.fillRect(X, Y, W2, H2);
    if (o.kind === 'tower' || o.kind === 'big' || o.kind === 'house') {
      g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(X, Y, W2, 1);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(X, Y + H2 - 2, W2, 2);
      if (o.kind === 'tower' && o.w >= 4) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(X + 3, Y + 3, Math.min(8, W2 - 6), 3); }
    }
  }
  d.canvas = canvas;
  return d;
}

// ---------------------------------------------------------------- Lo explorado (para el mapa del menú)
// Un bit por cada mapa de 48 × 48 que el jugador ha visto, guardado en la partida como texto base64.
const CELLS = TG.N * TG.N;
function bits(st) {
  if (st._tgBits) return st._tgBits;
  const b = new Uint8Array(Math.ceil(CELLS / 8));
  if (st.tgSeen) { try { const s = atob(st.tgSeen); for (let i = 0; i < Math.min(s.length, b.length); i++) b[i] = s.charCodeAt(i); } catch { /* partida vieja o dañada: empieza de cero */ } }
  Object.defineProperty(st, '_tgBits', { value: b, enumerable: false, configurable: true, writable: true });
  return b;
}
export function seenCell(st, i, j) { return i >= 0 && j >= 0 && i < TG.N && j < TG.N && !!(bits(st)[(j * TG.N + i) >> 3] & (1 << ((j * TG.N + i) & 7))); }
// Marca como visto todo lo que hay alrededor de (x, y) en casillas de Tierra Grande. Devuelve true si hubo algo nuevo.
export function markSeen(st, x, y, r = 1) {
  const b = bits(st), ci = Math.floor(x / TG.S), cj = Math.floor(y / TG.S);
  let changed = false;
  for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    if (i < 0 || j < 0 || i >= TG.N || j >= TG.N) continue;
    const k = j * TG.N + i;
    if (!(b[k >> 3] & (1 << (k & 7)))) { b[k >> 3] |= 1 << (k & 7); changed = true; paintCell(i, j); }
  }
  if (changed) { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); st.tgSeen = btoa(s); }
  return changed;
}
export const seenCount = st => { let n = 0; for (const v of bits(st)) for (let k = v; k; k &= k - 1) n++; return n; };

// Mapa chiquito de todo Tierra Grande: 6 píxeles por mapa de 48 (1 píxel cada 8 casillas).
export const OV = 6;
let overview = null, overviewOwner = null;
function paintCell(i, j) {
  if (!overview) return;
  const g = overview.getContext('2d'), img = g.createImageData(OV, OV);
  for (let y = 0; y < OV; y++) for (let x = 0; x < OV; x++) {
    const gx = i * TG.S + x * 8 + 4, gy = j * TG.S + y * 8 + 4, t = tileAt(gx, gy), c = groundColor(t, gx, gy), k = (y * OV + x) * 4;
    img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
  }
  g.putImageData(img, i * OV, j * OV);
}
// Lienzo con lo explorado de esta partida (lo demás queda transparente: el menú pone el papel debajo).
export function overviewCanvas(st) {
  if (typeof document === 'undefined') return null;
  if (!overview) { overview = document.createElement('canvas'); overview.width = overview.height = TG.N * OV; }
  if (overviewOwner !== st) {
    overview.getContext('2d').clearRect(0, 0, overview.width, overview.height); overviewOwner = st;
    for (let j = 0; j < TG.N; j++) for (let i = 0; i < TG.N; i++) if (seenCell(st, i, j)) paintCell(i, j);
  }
  return overview;
}

// Aeropuerto más cercano a (x, y): [aeropuerto, distancia en casillas, ángulo en radianes (0 = este)].
export function nearestAirport(x, y) {
  let best = null, bd = Infinity;
  for (const a of AIRPORTS) { const d = Math.hypot((a.x0 + a.x1) / 2 - x, (a.y0 + a.y1) / 2 - y); if (d < bd) { bd = d; best = a; } }
  return [best, bd, Math.atan2((best.y0 + best.y1) / 2 - y, (best.x0 + best.x1) / 2 - x)];
}
// ¿(x, y) queda encima de la pista de algún aeropuerto (con un margen para no tener que atinarle exacto)?
export function runwayAt(x, y, m = 6) { return AIRPORTS.find(a => x >= a.x0 - m && x < a.x1 + m && y >= a.y0 - m && y < a.y1 + m) || null; }
