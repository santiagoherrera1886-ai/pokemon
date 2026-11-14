// Tierra Grande: una región enorme, del tamaño de San Andreas a la escala del juego (4.032 × 4.032 casillas),
// generada por código a partir de una semilla fija: costa con playas, llanos, bosques, selva, desierto,
// sierra y nevado, dos ríos, lagos, tres ciudades grandes, pueblos, un parador, autopistas y aeropuertos.
// Todo sale de funciones deterministas (la misma casilla siempre da lo mismo), así que los mapas de 48 × 48
// se crean cuando el jugador se acerca y se pueden olvidar y volver a crear idénticos.
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen } from './maps2.js';

export const TG = { S: 48, N: 84, X: -2016, Y: 100 };   // tamaño de cada mapa, mapas por lado y origen global
export const SIZE = TG.S * TG.N;                          // 4.032 casillas por lado
export const ENTRY_X = 1930;                              // la autopista entra por el borde norte aquí

// ---------------------------------------------------------------- Ruido determinista
function h2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, o = 4) {
  let t = 0, amp = .5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { t += vn(x * f, y * f, s + i * 17) * amp; n += amp; amp *= .5; f *= 2; }
  return t / n;
}
const gauss = (x, y, cx, cy, r) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r));

// ---------------------------------------------------------------- Lugares
// Las ciudades van alineadas a cuadras de 24 casillas: calles de 4 y manzanas de 20; así ningún edificio
// queda partido entre dos mapas de 48.
export const CITIES = [
  { id: 'bahia', name: 'Bahía Dorada', x0: 1152, y0: 3048, x1: 1872, y1: 3528, kind: 'grande', palette: 'costa' },
  { id: 'altamira', name: 'Altamira', x0: 2712, y0: 504, x1: 3192, y1: 888, kind: 'grande', palette: 'sierra' },
  { id: 'medano', name: 'Ciudad Médano', x0: 3144, y0: 1944, x1: 3600, y1: 2352, kind: 'grande', palette: 'desierto' },
  { id: 'cruce', name: 'Villa Cruce', x0: 1944, y0: 1440, x1: 2160, y1: 1608, kind: 'pueblo', palette: 'llano' },
  { id: 'palma', name: 'Pueblo Palma', x0: 504, y0: 1800, x1: 696, y1: 1944, kind: 'pueblo', palette: 'selva' },
  { id: 'pino', name: 'Pueblo Pino', x0: 888, y0: 648, x1: 1056, y1: 792, kind: 'pueblo', palette: 'llano' },
  { id: 'viejo', name: 'Puerto Viejo', x0: 2976, y0: 3336, x1: 3192, y1: 3480, kind: 'pueblo', palette: 'costa' },
  { id: 'parador', name: 'Parador del Llano', x0: 1896, y0: 192, x1: 2016, y1: 264, kind: 'parador', palette: 'llano' }
// Cuatro casillas más al este y al sur: así cada ciudad queda rodeada de calle por los cuatro lados y
// cualquier carretera que llegue por cualquier borde empata con una calle (y no con la pared de una manzana).
].map(c => ({ ...c, x1: c.x1 + 4, y1: c.y1 + 4 }));
// Aeropuertos: pista horizontal de 384 × 8 y plataforma de 48 × 24 al sur del arranque, con terminal,
// hangar, aviones parqueados y la controladora, que es quien te deja despegar.
export const AIRPORTS = [
  { id: 'norte', name: 'Pista Norte', x0: 2064, y0: 336 },
  { id: 'altamira', name: 'Aeropuerto de Altamira', x0: 3264, y0: 672 },
  { id: 'medano', name: 'Aeropuerto del Desierto', x0: 2976, y0: 1824, side: 'e' },
  { id: 'bahia', name: 'Aeropuerto Bahía Dorada', x0: 624, y0: 3168, side: 'e' },
  { id: 'palma', name: 'Pista de la Selva', x0: 768, y0: 2208 }
// La plataforma queda en la punta de la pista que mira a la ciudad (side 'e' = este); todo alineado a 48
// para que la terminal y el hangar no queden partidos entre dos mapas.
].map(a => { const ax = a.side === 'e' ? a.x0 + 336 : a.x0; return { ...a, x1: a.x0 + 384, y1: a.y0 + 8, apron: [ax, a.y0 + 8, ax + 48, a.y0 + 32], arrive: [ax + 24, a.y0 + 27] }; });

function smooth(pts, step = 18) {
  // Catmull-Rom: curvas suaves entre los puntos dados.
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
export const ROADS = [
  { name: 'Autopista del Llano', w: 6, pts: [[ENTRY_X, -4], [1934, 300], [1990, 800], [2046, 1440]] },
  { name: 'Autopista del Sur', w: 6, pts: [[2046, 1608], [1980, 2200], [1720, 2700], [1530, 3048]] },
  { name: 'Autopista del Desierto', w: 6, pts: [[2160, 1524], [2700, 1700], [3144, 2100]] },
  { name: 'Autopista de la Sierra', w: 6, pts: [[3372, 1944], [3420, 1400], [3150, 888]] },
  { name: 'Carretera del Páramo', w: 4, pts: [[2160, 1452], [2500, 1100], [2712, 852]] },
  { name: 'Carretera de los Pinos', w: 4, pts: [[2712, 660], [2400, 570], [1990, 610], [1056, 716]] },
  { name: 'Carretera del Bosque', w: 4, pts: [[972, 792], [840, 1300], [612, 1800]] },
  { name: 'Carretera de la Selva', w: 4, pts: [[600, 1944], [760, 2500], [1152, 3130]] },
  { name: 'Carretera de la Costa', w: 4, pts: [[1872, 3300], [2500, 3440], [2976, 3420]] },
  { name: 'Carretera del Puerto', w: 4, pts: [[3084, 3336], [3350, 2800], [3384, 2352]] },
  { name: 'Carretera del Llano Bajo', w: 4, pts: [[1944, 1524], [1300, 1650], [696, 1880]] },
  { name: 'Acceso Pista Norte', w: 4, pts: [[1934, 356], [2066, 356]] },
  { name: 'Acceso Aeropuerto de Altamira', w: 4, pts: [[3192, 690], [3266, 690]] },
  { name: 'Acceso Aeropuerto del Desierto', w: 4, pts: [[3336, 1944], [3336, 1846]] },
  { name: 'Acceso Aeropuerto Bahía Dorada', w: 4, pts: [[1152, 3190], [984, 3190]] },
  { name: 'Acceso Pista de la Selva', w: 4, pts: [[668, 2236], [790, 2236]] }
].map(r => ({ ...r, line: smooth(r.pts) }));
export const RIVERS = [
  { name: 'Río Grande', w: 9, line: smooth([[3060, 260], [2800, 900], [2560, 1350], [2350, 2000], [2250, 2600], [2130, 3200], [2160, 4100]], 24) },
  { name: 'Río Verde', w: 7, line: smooth([[250, 1100], [420, 1700], [470, 2300], [640, 3000], [600, 4100]], 24) }
];

// Índice de segmentos por celdas de 64 casillas: cada consulta sólo mira los tramos cercanos.
const CELL = 64;
function indexLines(lines) {
  const grid = new Map();
  lines.forEach((L, li) => {
    for (let k = 0; k < L.line.length - 1; k++) {
      const [ax, ay] = L.line[k], [bx, by] = L.line[k + 1], m = L.w / 2 + 4;
      for (let cy = Math.floor((Math.min(ay, by) - m) / CELL); cy <= Math.floor((Math.max(ay, by) + m) / CELL); cy++)
        for (let cx = Math.floor((Math.min(ax, bx) - m) / CELL); cx <= Math.floor((Math.max(ax, bx) + m) / CELL); cx++) {
          const key = cx * 4096 + cy; if (!grid.has(key)) grid.set(key, []); grid.get(key).push([li, ax, ay, bx, by]);
        }
    }
  });
  return grid;
}
const ROAD_GRID = indexLines(ROADS), RIVER_GRID = indexLines(RIVERS);
// Distancia a la línea más cercana (y cuál es), o Infinity.
function nearest(grid, x, y) {
  const list = grid.get(Math.floor(x / CELL) * 4096 + Math.floor(y / CELL));
  let best = Infinity, which = -1;
  if (list) for (const [li, ax, ay, bx, by] of list) {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
    if (d < best) { best = d; which = li; }
  }
  return [best, which];
}
export function roadAt(x, y) { const [d, i] = nearest(ROAD_GRID, x + .5, y + .5); return i >= 0 && d <= ROADS[i].w / 2 ? ROADS[i] : null; }

// ---------------------------------------------------------------- Clima, relieve y biomas
const inRect = (x, y, r, m = 0) => x >= r.x0 - m && y >= r.y0 - m && x < r.x1 + m && y < r.y1 + m;
export function cityAt(x, y, m = 0) { for (const c of CITIES) if (inRect(x, y, c, m)) return c; return null; }
export function airportAt(x, y, m = 0) {
  for (const a of AIRPORTS) if (inRect(x, y, a, m) || (x >= a.apron[0] - m && y >= a.apron[1] - m && x < a.apron[2] + m && y < a.apron[3] + m)) return a;
  return null;
}
function landValue(x, y) {
  const nx = (x - SIZE / 2) / (SIZE / 2), ny = (y - SIZE / 2) / (SIZE / 2);
  const d = Math.pow(nx ** 4 + ny ** 4, .25);
  let v = .9 - d - (fbm(x / 310, y / 310, 101) - .5) * .34;
  if (Math.abs(x - ENTRY_X) < 70 && y < 500) v = Math.max(v, .06);      // la autopista entra por tierra firme
  return v;   // > 0 tierra, < 0 mar
}
function elevation(x, y) {
  return fbm(x / 520, y / 520, 211) * .62 + .64 * gauss(x, y, 3080, 400, 720) + .34 * gauss(x, y, 1120, 430, 420) + .2 * gauss(x, y, 3560, 2950, 360) - .12;
}
function moisture(x, y) {
  return fbm(x / 610, y / 610, 307) * .6 + .1 + .42 * (1 - x / SIZE) - .36 * gauss(x, y, 3420, 2180, 700) + .14 * gauss(x, y, 520, 2300, 600);
}
export function biomeAt(x, y) {
  const lv = landValue(x, y);
  if (lv < 0) return 'mar';
  if (lv < .028) return 'playa';
  const e = elevation(x, y);
  if (e > .74) return 'nevado';
  if (e > .63) return 'sierra';
  const m = moisture(x, y);
  if (m < .3) return 'desierto';
  if (m > .74) return 'selva';
  return fbm(x / 210, y / 210, 401) > .565 ? 'bosque' : 'llano';
}

// ---------------------------------------------------------------- Manzanas de las ciudades
export const BLOCK = 24;
const PALETTES = {
  costa: { walls: ['#f6efe0', '#f2d9b8', '#e8f0f2', '#f4e0d0', '#fff6e6'], roofs: ['#3f8fb0', '#e07a52', '#4fb39a', '#d8a83a', '#8a6ad0'], towers: ['#9ec6d8', '#e8dcc6', '#c6d6e4', '#f0c8a8', '#a8c8b8'] },
  sierra: { walls: ['#efe6d6', '#e6d2bc', '#f2f2ea', '#dcd6cc'], roofs: ['#8a4a3a', '#5a6a7a', '#3f6a5a', '#a05a3a'], towers: ['#b8c0cc', '#d8d0c4', '#9aa8b6', '#c8bca8'] },
  desierto: { walls: ['#f2dcb0', '#ecc89a', '#f6e6c6', '#e8b88a'], roofs: ['#c8643a', '#d89a3a', '#8a5a3a', '#3f8fa0'], towers: ['#e8c8a0', '#d8b088', '#f0dcc0', '#c8a888'] },
  llano: { walls: ['#f6ead2', '#f2dcc0', '#eef2e6', '#f6e2c6'], roofs: ['#d8574a', '#4f8fb8', '#5aa860', '#d89a3a'], towers: ['#d8d0c0', '#c8d8d0', '#e0c8b0'] },
  selva: { walls: ['#f6ead2', '#e6f2dc', '#f6dcc0'], roofs: ['#3f9a5a', '#d8743a', '#8a5a3a', '#3f8fb0'], towers: ['#c8dcc0', '#e0d0b0'] }
};
const SHOPS = ['PANADERÍA', 'FARMACIA', 'CAFÉ', 'ARTESANÍAS', 'FERRETERÍA', 'HELADERÍA', 'LIBRERÍA', 'FRUTERÍA', 'ARCADE', 'MÚSICA', 'BICICLETAS', 'ZAPATERÍA'];
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
const BLOCK_CACHE = new Map();
// Tipo de manzana (bx, by en cuadras absolutas) y su contenido: edificios en coordenadas de la manzana (0..19).
export function blockPlan(c, bx, by) {
  const key = c.id + ':' + bx + ':' + by;
  if (BLOCK_CACHE.has(key)) return BLOCK_CACHE.get(key);
  const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2, mx = bx * BLOCK + 14, my = by * BLOCK + 14;
  const dist = Math.hypot((mx - cx) / ((c.x1 - c.x0) / 2), (my - cy) / ((c.y1 - c.y0) / 2));
  const centerBlock = Math.floor(cx / BLOCK) === bx && Math.floor(cy / BLOCK) === by;
  const r = h2(bx, by, 977), P = PALETTES[c.palette] || PALETTES.llano;
  let type;
  if (c.kind === 'parador') type = (bx * BLOCK - c.x0) / BLOCK === 2 && (by * BLOCK - c.y0) / BLOCK === 1 ? 'posada' : (bx * BLOCK - c.x0) / BLOCK === 3 ? 'parqueadero' : 'gasolina';
  else if (centerBlock) type = 'posada';
  else if (c.kind === 'grande') type = dist < .4 ? (r < .7 ? 'torres' : r < .85 ? 'plaza' : 'parqueadero') : dist < .75 ? (r < .55 ? 'edificios' : r < .75 ? 'parque' : r < .85 ? 'parqueadero' : 'casas') : (r < .6 ? 'casas' : r < .8 ? 'parque' : 'edificios');
  else type = r < .55 ? 'casas' : r < .72 ? 'edificios' : r < .87 ? 'parque' : 'plaza';
  const R = k => h2(bx, by, 1000 + k), out = { type, objects: [] };
  const wall = k => pick(P.walls, R(k)), roof = k => pick(P.roofs, R(k + 50));
  const O = out.objects;
  if (type === 'torres') {
    const layouts = [[[1, 1, 8, 7], [11, 1, 8, 7], [1, 11, 8, 7], [11, 11, 8, 7]], [[1, 2, 18, 7], [1, 12, 8, 6], [11, 12, 8, 6]], [[2, 2, 7, 16], [11, 2, 7, 7], [11, 11, 7, 7]]];
    pick(layouts, R(1)).forEach(([x, y, w, h], k) => O.push({ kind: 'tower', x, y, w, h, solid: true, floors: 4 + Math.floor(R(10 + k) * (dist < .2 ? 7 : 4)), opt: { wall: pick(P.towers, R(20 + k)), roof: shadeHex(pick(P.towers, R(20 + k)), -.25), doorCol: Math.floor(w / 2) } }));
  } else if (type === 'edificios') {
    [[1, 2, 8, 5], [11, 2, 8, 5], [1, 12, 8, 5], [11, 12, 8, 5]].forEach(([x, y, w, h], k) => {
      if (R(30 + k) < .12) return;
      O.push({ kind: 'big', x, y, w, h, solid: true, opt: { wall: wall(k), roof: roof(k), sign: R(40 + k) < .7 ? pick(SHOPS, R(60 + k)) : undefined, doorCol: Math.floor(w / 2) } });
    });
  } else if (type === 'casas') {
    [[1, 1], [8, 1], [14, 1], [1, 11], [8, 11], [14, 11]].forEach(([x, y], k) => {
      if (R(70 + k) < .15) return;
      O.push({ kind: 'house', x, y, w: 5, h: 4, solid: true, opt: { roof: roof(k), wall: wall(k), chimney: R(80 + k) < .5, doorCol: 2 } });
    });
  } else if (type === 'parque') {
    O.push({ kind: 'fountain', x: 9, y: 9, w: 2, h: 2, solid: true });
    for (const [x, y] of [[6, 9], [13, 9], [9, 6], [9, 13]]) O.push({ kind: 'bench', x, y, w: 1, h: 1, solid: true });
  } else if (type === 'plaza') {
    O.push({ kind: 'statue', x: 9, y: 8, w: 2, h: 2, solid: true });
    for (const [x, y] of [[4, 4], [15, 4], [4, 15], [15, 15]]) O.push({ kind: 'lamp', x, y, w: 1, h: 1, solid: true });
    for (const [x, y] of [[6, 12], [13, 12]]) O.push({ kind: 'bench', x, y, w: 1, h: 1, solid: true });
  } else if (type === 'parqueadero') {
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) if (R(90 + row * 6 + k) < .62) O.push({ kind: 'car', x: 2 + k * 3, y: 2 + row * 6, w: 1, h: 2, solid: true, color: pick(CAR_COLORS, R(120 + row * 6 + k)), dir: row % 2 });
  } else if (type === 'posada') {
    O.push({ kind: 'big', x: 1, y: 3, w: 9, h: 5, solid: true, opt: { wall: '#fbeee6', roof: '#d8574a', sign: 'POSADA', doorCol: 4 }, door: [5, 7], to: 'posada' });
    O.push({ kind: 'big', x: 11, y: 3, w: 8, h: 5, solid: true, opt: { wall: '#eef4fa', roof: '#3f7fc8', sign: 'TIENDA', doorCol: 4 }, door: [15, 7], to: 'tienda' });
    O.push({ kind: 'sign', x: 9, y: 14, w: 1, h: 1, solid: true, text: [`${c.name}.`, c.kind === 'grande' ? 'Ciudad de Tierra Grande.' : c.kind === 'parador' ? 'Descanse, llene el tanque y siga.' : 'Pueblo de Tierra Grande.'] });
    for (const [x, y] of [[2, 12], [17, 12]]) O.push({ kind: 'lamp', x, y, w: 1, h: 1, solid: true });
  } else if (type === 'gasolina') {
    O.push({ kind: 'big', x: 3, y: 3, w: 10, h: 5, solid: true, opt: { wall: '#fff4e0', roof: '#f0b030', sign: 'GASOLINA', doorCol: 5 } });
    for (const x of [4, 8, 12]) O.push({ kind: 'pump', x, y: 12, w: 1, h: 1, solid: true });
  }
  BLOCK_CACHE.set(key, out);
  return out;
}
export const CAR_COLORS = ['#d8443a', '#3a6ad8', '#f0c030', '#2a9a5a', '#f6f2ea', '#2a2a32', '#e86aa0', '#e2603f', '#4fb3c8', '#8a8f9a'];
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16), k = 1 + f;
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- La casilla
// Prioridad: aeropuerto > ciudad > carretera > río > mar/playa > terreno del bioma.
export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 'w';
  // Anillo de mar en todo el borde: sólo se entra (y se sale) por la Autopista del Llano.
  if (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1) {
    if (y === 0 && x >= ENTRY_X - 5 && x <= ENTRY_X + 5) return x >= ENTRY_X - 3 && x <= ENTRY_X + 2 ? 'p' : '.';
    return 'w';
  }
  const ap = airportAt(x, y, 4);
  if (ap) return inRect(x, y, ap) || airportAt(x, y) || roadAt(x, y) ? 'p' : '.';   // la vía de acceso cruza el borde
  const c = cityAt(x, y);
  if (c) return cityTile(c, x, y);
  const [rd, ri] = nearest(ROAD_GRID, x + .5, y + .5);
  if (ri >= 0) {
    const w = ROADS[ri].w / 2;
    if (rd <= w) return 'p';
    if (rd <= w + 2.5) return landValue(x, y) < 0 ? 'w' : biomeAt(x, y) === 'desierto' || biomeAt(x, y) === 'playa' ? 's' : '.';
  }
  if (cityAt(x, y, 3)) return '.';
  const [vd, vi] = nearest(RIVER_GRID, x + .5, y + .5);
  if (vi >= 0) { const w = RIVERS[vi].w / 2 * (.8 + vn(x / 30, y / 30, 503) * .45); if (vd <= w) return 'w'; if (vd <= w + 1.5) return 's'; }
  const b = biomeAt(x, y);
  if (b === 'mar') return 'w';
  if (b === 'playa') return h2(x, y, 7) < .025 && landValue(x, y) > .012 ? 'J' : 's';
  const n = h2(x, y, 11);
  const grass = fbm(x / 22, y / 22, 41, 3), clump = fbm(x / 30, y / 30, 51, 3);
  switch (b) {
    case 'llano': {
      if (fbm(x / 170, y / 170, 31, 3) > .735) return 'w';
      if (grass > .62) return 'g';
      if (clump > .67 && n < .5) return 'T';
      if (n < .006) return 'T';
      if (fbm(x / 14, y / 14, 61, 2) > .7 && n > .4) return 'F';
      return '.';
    }
    case 'bosque': {
      if (fbm(x / 150, y / 150, 33, 3) > .76) return 'w';
      const glade = fbm(x / 26, y / 26, 52, 3);
      if (glade > .56) return grass > .5 ? 'g' : n < .04 ? 'B' : '.';
      return n < .62 ? 'T' : n < .7 ? 'B' : '.';
    }
    case 'selva': {
      if (fbm(x / 120, y / 120, 35, 3) > .78) return 'w';
      if (grass > .48) return n < .08 ? 'J' : 'g';
      if (clump > .45 && n < .45) return 'J';
      if (n < .05) return 'T';
      return n > .93 ? 'F' : '.';
    }
    case 'desierto': {
      if (fbm(x / 40, y / 40, 71, 3) > .8) return 'K';
      if (n < .01) return 'O';
      if (grass > .72) return 'g';
      return 's';
    }
    case 'sierra': {
      if (fbm(x / 34, y / 34, 72, 3) > .7) return 'K';
      if (clump > .55 && n < .4) return 'Y';
      if (n < .015) return 'O';
      if (grass > .63) return 'g';
      return '.';
    }
    case 'nevado': {
      if (fbm(x / 40, y / 40, 73, 3) > .74) return 'K';
      if (clump > .6 && n < .45) return 'Y';
      if (n < .012) return 'O';
      if (grass > .66) return 'g';
      return '.';
    }
  }
  return '.';
}
function cityTile(c, x, y) {
  const lx = x % BLOCK, ly = y % BLOCK;
  if (lx < 4 || ly < 4) return 'p';
  const plan = blockPlan(c, Math.floor(x / BLOCK), Math.floor(y / BLOCK)), bx = lx - 4, by = ly - 4;
  if (plan.type === 'parqueadero' || plan.type === 'gasolina') return 'p';
  if (plan.type === 'parque') {
    const ring = bx === 0 || by === 0 || bx === 19 || by === 19;
    if (ring) return (bx + by) % 3 === 0 ? 'T' : '.';
    if ((bx > 3 && bx < 7 && by > 3 && by < 7) || (bx > 12 && bx < 16 && by > 12 && by < 16)) return 'F';
    return '.';
  }
  if (plan.type === 'plaza') return (bx + by) % 2 ? '.' : '.';
  return '.';
}

// ---------------------------------------------------------------- Nombres y encuentros por zona
const QUAD = (x, y) => (y < SIZE * .4 ? 'Norte' : y > SIZE * .62 ? 'Sur' : x < SIZE / 2 ? 'Oeste' : 'Este');
const AREA = {
  llano: q => `Llano ${q}`, bosque: q => `Bosque ${q}`, selva: () => 'Selva del Río Verde', desierto: () => 'Desierto de los Médanos',
  sierra: () => 'Sierra Fría', nevado: () => 'Nevado del Cóndor', playa: q => `Costa ${q}`, mar: q => `Costa ${q}`
};
export const TG_ENCOUNTER = { llano: 'tgLlano', bosque: 'tgBosque', selva: 'tgSelva', desierto: 'tgDesierto', sierra: 'tgSierra', nevado: 'tgNevado', playa: 'tgCosta', mar: 'tgCosta' };
const BIOME3D = { llano: 'meadow', bosque: 'meadow', selva: 'jungle', desierto: 'desert', sierra: 'meadow', nevado: 'snow', playa: 'meadow', mar: 'meadow' };
const BG = { llano: 'grass', bosque: 'grass', selva: 'grass', desierto: 'beach', sierra: 'mountain', nevado: 'mountain', playa: 'beach', mar: 'lake' };
// Bioma dominante del mapa (muestreo en rejilla).
function mapBiome(x0, y0) {
  const count = {};
  for (let j = 4; j < TG.S; j += 8) for (let i = 4; i < TG.S; i += 8) { const b = biomeAt(x0 + i, y0 + j); count[b] = (count[b] || 0) + 1; }
  delete count.mar;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'playa';
}

// ---------------------------------------------------------------- Mapas de 48 × 48
export const tgId = (i, j) => `tg_${i}_${j}`;
export function tgCell(gx, gy) {
  const x = gx - TG.X, y = gy - TG.Y;
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return [Math.floor(x / TG.S), Math.floor(y / TG.S)];
}
const LOOK_POOL = ['man', 'girl', 'kid', 'old', 'lass', 'hiker', 'courier', 'clerk', 'vendor', 'swimmer', 'bugkid'];
const LINES = [
  ['¡Qué calor tan berraco!', 'Menos mal que en Tierra Grande siempre hay una tienda cerca.'],
  ['Esta ciudad es enorme.', 'Yo me pierdo y eso que vivo aquí.'],
  ['Con un carro llegas a cualquier parte.', 'Y en avión, ni te cuento.'],
  ['Dicen que en el Nevado del Cóndor viven Puchamon que nadie ha visto.'],
  ['¿Ya fuiste a la playa de Bahía Dorada?', 'El atardecer es lo más bonito.'],
  ['Los aeropuertos están marcados en el mapa con un avioncito.'],
  ['En el desierto hay Puchamon que aguantan sin agua días enteros.'],
  ['Mi abuela dice que el Río Grande nace en la sierra y muere en el mar.'],
  ['¡Buenas! ¿Usted no es de por aquí, cierto?'],
  ['Si te cansas de manejar, para en cualquier posada.']
];
const TITLES = { llano: ['Excursionista', 'Campista', 'Chica del campo'], bosque: ['Cazabichos', 'Excursionista', 'Guardabosque'], selva: ['Explorador', 'Cazabichos', 'Botánica'], desierto: ['Arqueóloga', 'Motociclista', 'Excursionista'], sierra: ['Montañista', 'Excursionista', 'Escaladora'], nevado: ['Esquiadora', 'Montañista', 'Escalador'], playa: ['Nadadora', 'Pescador', 'Surfista'] };
const TRAINER_LOOK = { Excursionista: 'hiker', Campista: 'kid', 'Chica del campo': 'lass', Cazabichos: 'bugkid', Guardabosque: 'man', Explorador: 'hiker', Botánica: 'lass', Arqueóloga: 'girl', Motociclista: 'courier', Montañista: 'hiker', Escaladora: 'lass', Esquiadora: 'girl', Escalador: 'man', Nadadora: 'swimmer', Pescador: 'sailor', Surfista: 'swimmer' };
const FIRST = ['Mateo', 'Sara', 'Juanjo', 'Valen', 'Camilo', 'Luisa', 'Andrés', 'Mafe', 'Tomás', 'Isa', 'Simón', 'Majo', 'Nico', 'Laura', 'Pipe', 'Dani'];
// Equipos de entrenadores por bioma: [especie, nivel relativo]. Se completan con las especies nuevas.
export const TG_TEAMS = {
  llano: [['pipiolo', 0], ['roedon', 1], ['seton', 0], ['carnerazo', 1], ['voltaz', 0]],
  bosque: [['capullado', 0], ['seton', 1], ['foliaton', 0], ['perezon', 1], ['alasol', 0]],
  selva: [['foliaton', 0], ['serpentil', 1], ['mariposol', 0], ['colibron', 1], ['doradon', 0]],
  desierto: [['penon', 1], ['magmor', 0], ['serpentil', 0], ['gurron', 1]],
  sierra: [['penon', 0], ['condoral', 1], ['carnerazo', 0], ['anteojon', 1], ['ferrox', 0]],
  nevado: [['nivalmar', 1], ['condoral', 0], ['penon', 1], ['anteojon', 0]],
  playa: [['meduson', 0], ['cangrejon', 1], ['charcomar', 0], ['pipiolo', 1]]
};
export function tgMap(i, j) {
  if (i < 0 || j < 0 || i >= TG.N || j >= TG.N) return null;
  const S = TG.S, x0 = i * S, y0 = j * S, id = tgId(i, j);
  const b = new MapBuilder(id, S, S, '.');
  let roadTiles = 0, cityTiles = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const t = tileAt(x0 + x, y0 + y); b.grid[y][x] = t;
    if (t === 'p') roadTiles++;
  }
  const mid = [x0 + S / 2, y0 + S / 2];
  const city = cityAt(mid[0], mid[1]) || CITIES.find(c => c.x0 < x0 + S && c.x1 > x0 && c.y0 < y0 + S && c.y1 > y0);
  const ap = AIRPORTS.find(a => a.x0 < x0 + S && a.x1 > x0 && a.y0 < y0 + S && a.apron[3] > y0);
  const road = roadAt(mid[0], mid[1]) || (roadTiles > 20 ? ROADS.find(r => r.line.some(([x, y]) => x >= x0 && x < x0 + S && y >= y0 && y < y0 + S)) : null);
  const biome = mapBiome(x0, y0);
  const name = city ? city.name : ap ? ap.name : road ? road.name : AREA[biome](QUAD(mid[0], mid[1]));
  b.meta({ name, outdoor: true, origin: [TG.X + x0, TG.Y + y0], tg: [i, j], region: 'tierra', biome: BIOME3D[biome], snow: biome === 'nevado' || undefined,
    paved: roadTiles > 0 || undefined, encounters: city ? undefined : TG_ENCOUNTER[biome], battleBg: BG[biome], zone: biome });
  // Edificios, parques y gente de las manzanas que caen en este mapa.
  for (let by = Math.floor(y0 / BLOCK); by < (y0 + S) / BLOCK; by++) for (let bx = Math.floor(x0 / BLOCK); bx < (x0 + S) / BLOCK; bx++) {
    const c = cityAt(bx * BLOCK + 12, by * BLOCK + 12);
    if (!c) continue;
    const plan = blockPlan(c, bx, by), ox = bx * BLOCK + 4 - x0, oy = by * BLOCK + 4 - y0;
    for (const o of plan.objects) {
      const obj = { ...o, x: o.x + ox, y: o.y + oy, opt: o.opt && { ...o.opt } };
      if (o.to) {
        const door = [o.door[0] + ox, o.door[1] + oy], inner = `tgi_${o.to}_${c.id}`;
        obj.door = door; delete obj.to;
        b.warp(door[0], door[1], inner, o.to === 'posada' ? 6 : 5, o.to === 'posada' ? 7 : 6, { face: 1, needDir: 1 });
      }
      if (o.kind === 'house' || o.kind === 'big' || o.kind === 'tower') obj.door = obj.door || [obj.x + (obj.opt?.doorCol ?? Math.floor(obj.w / 2)), obj.y + obj.h - 1];
      b.obj(obj);
    }
    // Faroles en las esquinas de la manzana y un par de vecinos.
    for (const [lx, ly] of [[0, 0], [19, 0], [0, 19], [19, 19]]) if (plan.type !== 'parque' && h2(bx + lx, by + ly, 5) < .5) b.obj({ kind: 'lamp', x: ox + lx, y: oy + ly, w: 1, h: 1, solid: true });
    const people = plan.type === 'posada' ? 2 : h2(bx, by, 9) < .55 ? 1 : 0;
    for (let k = 0; k < people; k++) {
      const nx = ox + 2 + Math.floor(h2(bx, by, 20 + k) * 16), ny = oy + 19 + (k ? -19 : 0) + (k ? 0 : 0);
      const tx = Math.max(1, Math.min(S - 2, nx)), ty = Math.max(1, Math.min(S - 2, oy + (k ? -2 : 21)));
      if (ty >= 0 && ty < S) b.npc({ id: `tgn_${bx}_${by}_${k}`, look: pick(LOOK_POOL, h2(bx, by, 30 + k)), x: tx, y: ty, dir: Math.floor(h2(bx, by, 40 + k) * 4), wander: 2, talk: pick(LINES, h2(bx, by, 50 + k)) });
    }
  }
  // Parador del Llano: aquí te dan las llaves del carro.
  const par = CITIES.find(c => c.id === 'parador');
  if (par.x0 < x0 + S && par.x1 > x0 && par.y0 < y0 + S && par.y1 > y0) {
    const kx = 1938 - x0, ky = 248 - y0;
    if (kx >= 0 && kx < S && ky >= 0 && ky < S) b.npc({ id: 'tgLlaves', look: 'courier', x: kx, y: ky, dir: 2, talk: 'llavesCarro', name: 'Doña Rueda' });
    const sx = 1926 - x0, sy = 196 - y0;
    if (sx >= 0 && sx < S && sy >= 0 && sy < S) b.obj({ kind: 'sign', x: sx, y: sy, w: 1, h: 1, solid: true, text: ['Bienvenido a TIERRA GRANDE.', 'Parador del Llano: posada, gasolina y llaves.'] });
  }
  // Aeropuerto: terminal, hangar, torre, aviones y la controladora.
  if (ap && ap.apron[0] >= x0 && ap.apron[0] < x0 + S && ap.apron[1] >= y0 && ap.apron[1] < y0 + S) {
    const ax = ap.apron[0] - x0, ay = ap.apron[1] - y0;
    b.obj({ kind: 'big', x: ax + 2, y: ay + 9, w: 12, h: 5, solid: true, opt: { wall: '#eef3f6', roof: '#3f7fc8', sign: 'AEROPUERTO', doorCol: 6 } });
    b.obj({ kind: 'big', x: ax + 30, y: ay + 6, w: 12, h: 8, solid: true, opt: { wall: '#d8dde2', roof: '#6a7480', sign: 'HANGAR', doorCol: 6 } });
    b.obj({ kind: 'tower', x: ax + 17, y: ay + 10, w: 3, h: 3, solid: true, floors: 6, opt: { wall: '#e8eef2', roof: '#3f7fc8', doorCol: 1, control: true } });
    for (const [px, py] of [[ax + 22, ay + 2], [ax + 36, ay + 17]]) b.obj({ kind: 'plane', x: px, y: py, w: 3, h: 3, solid: true, color: pick(['#f6f2ea', '#e2603f', '#3a6ad8'], h2(px, py, 3)) });
    b.npc({ id: 'tgAvion_' + ap.id, look: 'guard', x: ax + 8, y: ay + 15, dir: 0, talk: 'aeropuerto', arg: ap.id, name: 'Controladora' });
    b.obj({ kind: 'sign', x: ax + 4, y: ay + 16, w: 1, h: 1, solid: true, text: [ap.name + '.', 'Vuelos libres sobre Tierra Grande.', 'Para aterrizar, vuela sobre cualquier pista y oprime A.'] });
  }
  // Entrenadores a la orilla de las carreteras del campo.
  if (!city && !ap && road && h2(i, j, 13) < .45) {
    const pts = [];
    for (let y = 2; y < S - 2; y++) for (let x = 2; x < S - 2; x++) if (b.grid[y][x] === '.' && (b.grid[y][x - 1] === 'p' || b.grid[y][x + 1] === 'p' || b.grid[y - 1][x] === 'p' || b.grid[y + 1][x] === 'p')) pts.push([x, y]);
    if (pts.length) {
      const [tx, ty] = pts[Math.floor(h2(i, j, 14) * pts.length)];
      const zone = biome === 'mar' ? 'playa' : biome, title = pick(TITLES[zone] || TITLES.llano, h2(i, j, 15)), who = pick(FIRST, h2(i, j, 16));
      const team = TG_TEAMS[zone] || TG_TEAMS.llano, n = 1 + Math.floor(h2(i, j, 17) * 3);
      const party = Array.from({ length: n }, (_, k) => [...pick(team, h2(i, j, 18 + k))]);
      const dir = b.grid[ty][tx - 1] === 'p' ? 2 : b.grid[ty][tx + 1] === 'p' ? 3 : b.grid[ty - 1][tx] === 'p' ? 1 : 0;
      b.npc({ id: `tgt_${i}_${j}`, look: TRAINER_LOOK[title] || 'hiker', x: tx, y: ty, dir, sight: 4,
        trainer: { name: `${title} ${who}`, look: TRAINER_LOOK[title] || 'hiker', party, scale: true, money: 60 * (n + 2), intro: [`¡Ey! En ${name} nadie pasa sin pelear.`], defeat: ['¡Qué nivel! Se nota que vienes de lejos.'], after: ['Tierra Grande es enorme: no te pierdas.'] } });
    }
  }
  return b.build();
}
// Interiores de posadas y tiendas de cada ciudad: la puerta de regreso sale del plano de la manzana.
export function tgInterior(id) {
  const m = /^tgi_(posada|tienda)_(\w+)$/.exec(id);
  if (!m) return null;
  const c = CITIES.find(c => c.id === m[2]);
  if (!c) return null;
  const cx = Math.floor((c.x0 + c.x1) / 2 / BLOCK), cy = Math.floor((c.y0 + c.y1) / 2 / BLOCK);
  let bx = cx, by = cy;
  if (c.kind === 'parador') { bx = c.x0 / BLOCK + 2; by = c.y0 / BLOCK + 1; }
  const plan = blockPlan(c, bx, by), o = plan.objects.find(o => o.to === m[1]);
  if (!o) return null;
  const gx = bx * BLOCK + 4 + o.door[0], gy = by * BLOCK + 4 + o.door[1];
  const back = [tgId(Math.floor(gx / TG.S), Math.floor(gy / TG.S)), gx % TG.S, gy % TG.S + 1];
  const def = m[1] === 'posada' ? posadaGen(id, `Posada de ${c.name}`, back) : tiendaGen(id, `Tienda de ${c.name}`, back, 'tg_' + c.id);
  def.region = 'tierra';
  return def;
}
export function tgDef(id) {
  const m = /^tg_(\d+)_(\d+)$/.exec(id);
  if (m) return tgMap(+m[1], +m[2]);
  if (id.startsWith('tgi_')) return tgInterior(id);
  return null;
}
// Entrada desde Pueblo Llanero: autopista que baja de y = 70 a y = 100 (global) y empata con la de aquí.
export function buildAutopista() {
  const b = new MapBuilder('autopistaLlano', 24, 30, 'T');
  const cx = ENTRY_X + TG.X - (-100);   // columna de la autopista dentro de este mapa (origen x = -100)
  // Arriba empata con las 4 casillas de asfalto que se abren en la Sabana; abajo, con la entrada de Tierra Grande.
  b.rect(cx - 5, 2, 11, 28, '.').rect(cx - 3, 2, 6, 28, 'p').rect(cx - 2, 0, 4, 2, 'p');
  for (let y = 4; y < 28; y += 6) b.obj({ kind: 'lamp', x: cx - 5, y, w: 1, h: 1, solid: true });
  b.obj({ kind: 'sign', x: cx + 4, y: 3, w: 1, h: 1, solid: true, text: ['AUTOPISTA DEL LLANO.', 'Al sur: TIERRA GRANDE.', 'Ciudades, carreteras, aeropuertos... ¡y más de cien kilómetros de mapa!'] });
  b.meta({ name: 'Autopista del Llano', outdoor: true, origin: [-100, 70], paved: true, region: 'tierra', battleBg: 'grass' });
  return b.build();
}
export const ENTRY_LOCAL_X = ENTRY_X + TG.X + 100;   // columna central de la autopista dentro de autopistaLlano

// ---------------------------------------------------------------- Mapa de la región (vista de pájaro)
export const TILE_COLORS = {
  '.': [169, 214, 138], g: [95, 174, 78], p: [140, 145, 156], s: [241, 226, 166], w: [90, 166, 222], F: [233, 169, 189],
  T: [63, 127, 66], Y: [47, 106, 76], J: [127, 178, 76], O: [155, 149, 136], K: [160, 138, 104], B: [75, 138, 60]
};
const SNOWC = { '.': [236, 242, 246], g: [205, 221, 231], Y: [130, 158, 150], K: [185, 196, 204], O: [196, 200, 204] };
const DESERTC = { '.': [232, 214, 160] };
// Color de una casilla vista desde arriba (con techos de edificios), como [r, g, b].
export function overviewColor(x, y) {
  const t = tileAt(x, y);
  const c = cityAt(x, y);
  if (c && t === '.') {
    const plan = blockPlan(c, Math.floor(x / BLOCK), Math.floor(y / BLOCK)), bx = x % BLOCK - 4, by = y % BLOCK - 4;
    for (const o of plan.objects) if (bx >= o.x && by >= o.y && bx < o.x + o.w && by < o.y + o.h) {
      const col = o.kind === 'tower' ? o.opt.wall : o.opt?.roof || (o.kind === 'car' ? o.color : '#c0c0c0');
      const n = parseInt(col.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255];
    }
    return [208, 202, 186];
  }
  if (t === 'p' && airportAt(x, y)) return [118, 122, 130];
  const b = biomeAt(x, y);
  if (b === 'nevado' && SNOWC[t]) return SNOWC[t];
  if (b === 'desierto' && DESERTC[t]) return DESERTC[t];
  return TILE_COLORS[t] || TILE_COLORS['.'];
}
