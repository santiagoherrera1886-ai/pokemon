// Modo desarrollador, parte sin interfaz: la lista de lugares para ir de una y la casilla libre más cercana a un
// punto (para tocar el mapa e ir). La usan src/ui/dev.js y las pruebas.
import { TG, CITIES, AIRPORTS, BLOCK, blockPlan } from './tierra.js';
import { CANDIDATES, candidateSpot } from './hogar.js';

// El Parador del Llano: donde Doña Rueda presta el carro (el mismo punto al que lleva la Mensajera).
export const PARADOR = { name: 'Parador del Llano · carro de Doña Rueda', map: 'tg_40_5', x: 17, y: 10 };

// Lugares para ir de una. Los de Tierra Grande van en casillas de Tierra Grande (tg: [x, y]); los de Alborada son
// los mapas exteriores hechos a mano (se cae en el centro, o donde la Mensajera deja si es un pueblo).
const COURIER = { brisal: [5, 8], arenal: [18, 8], corola: [6, 16], cobre: [6, 17], marea: [22, 8], guadua: [7, 12], caracol: [7, 8], cabo: [6, 16], palmar: [7, 15], sabana: [7, 13], voltio: [6, 16], niebla: [6, 19], cafetal: [6, 12], escarcha: [6, 17], albor: [14, 13], ruta5: [7, 7] };
const center = c => [Math.floor((c.x0 + c.x1) / 2 / BLOCK), Math.floor((c.y0 + c.y1) / 2 / BLOCK)];
export function devPlaces(world) {
  const tg = [PARADOR], al = [];
  // Frente a la posada de cada ciudad (la posada está en la manzana del centro, con la puerta en (5, 7) de la manzana).
  for (const c of CITIES) if (c.kind === 'grande' || c.kind === 'pueblo') { const [bx, by] = center(c); tg.push({ name: c.name, tg: [bx * BLOCK + 9, by * BLOCK + 12] }); }
  for (const a of AIRPORTS) tg.push({ name: `${a.name} ✈`, tg: a.arrive });
  for (const c of CITIES) if (c.kind === 'motel') tg.push({ name: c.name, tg: [c.x0 + 8, c.y0 + 14] });
  // Un lote en venta por ciudad que tenga (frente a la puerta de la casa que se construya).
  for (const c of CITIES) {
    if (c.kind !== 'grande' && c.kind !== 'pueblo') continue;
    let lot = null;
    for (let by = c.y0 / BLOCK; !lot && by * BLOCK < c.y1 - 4; by++) for (let bx = c.x0 / BLOCK; !lot && bx * BLOCK < c.x1 - 4; bx++) if (blockPlan(c, bx, by).type === 'lote') lot = [bx, by];
    if (lot) tg.push({ name: `Lote en venta · ${c.name}`, tg: [lot[0] * BLOCK + 14, lot[1] * BLOCK + 16] });
  }
  for (const id in CANDIDATES) {
    const P = CANDIDATES[id], c = CITIES.find(c => c.id === P.city), [x, y] = candidateSpot(c);
    tg.push({ name: `${P.name} (pareja) · ${c.name}`, tg: [x, y + 1] });
  }
  for (const m of world.base) {
    const k = COURIER[m.id];
    al.push(k ? { name: m.name, map: m.id, x: k[0], y: k[1] } : { name: m.name, g: [m.origin[0] + Math.floor(m.w / 2), m.origin[1] + Math.floor(m.h / 2)] });
  }
  return { tg, al };
}

// Casilla libre más cercana a (gx, gy) en coordenadas globales, buscando en anillos cada vez más grandes:
// que se pueda pisar, que no sea agua, ni una puerta, ni un evento, ni donde está parado alguien.
export function findFree(world, st, gx, gy, maxR = 40) {
  const ok = (x, y) => {
    const m = world.outdoorAt(x, y);
    if (!m) return null;
    const lx = x - m.origin[0], ly = y - m.origin[1], t = m.at(lx, ly);
    if (t === undefined || t === 'w' || m.blocked(lx, ly, st) || m.warpAt(lx, ly)) return null;
    if (m.npcs.some(n => n.x === lx && n.y === ly && (!n.when || n.when(st)))) return null;
    if (m.triggers.some(r => lx >= r.x && ly >= r.y && lx < r.x + r.w && ly < r.y + r.h)) return null;
    return { map: m.id, x: lx, y: ly };
  };
  for (let r = 0; r <= maxR; r++) {
    if (!r) { const s = ok(gx, gy); if (s) return s; continue; }
    for (let d = -r; d <= r; d++) for (const [x, y] of [[gx + d, gy - r], [gx + d, gy + r], [gx - r, gy + d], [gx + r, gy + d]]) { const s = ok(x, y); if (s) return s; }
  }
  return null;
}
// Punto exacto de un lugar de la lista: los que traen mapa y casilla se usan tal cual; los demás se buscan.
export function spotOf(world, st, p) {
  if (p.map) return { map: p.map, x: p.x, y: p.y };
  if (p.tg) return findFree(world, st, TG.X + p.tg[0], TG.Y + p.tg[1]);
  return findFree(world, st, p.g[0], p.g[1], 60);
}
