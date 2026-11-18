// Modo desarrollador, parte sin interfaz: la lista de lugares para ir de una y la casilla libre más cercana a un
// punto (para tocar el mapa e ir). La usan src/ui/dev.js y las pruebas.
import { CANDIDATES } from './hogar.js';
import { LOTS, MOTEL_DOORS, MOTEL_NAMES } from './maps7.js';

// Dónde deja la Mensajera en cada pueblo (frente a la posada). Las rutas se buscan desde su centro.
const COURIER = { brisal: [5, 8], arenal: [18, 8], corola: [6, 16], cobre: [6, 17], marea: [22, 8], guadua: [7, 12], caracol: [7, 8], cabo: [6, 16], palmar: [7, 15], sabana: [7, 13], voltio: [6, 16], niebla: [6, 19], cafetal: [6, 12], escarcha: [6, 17], albor: [14, 13], ruta5: [7, 7], ribera: [28, 13], cascada: [8, 14], caleta: [25, 12] };
const SUR = { ruta26: [12, 4], ribera: [28, 13], ruta27: [5, 6], cano: [12, 9], ruta29: [8, 5], cascada: [8, 14], ruta28: [10, 4], caleta: [25, 12] };

// sur: lo nuevo del sur (pueblos, gimnasio extra, cueva, moteles, lotes y las personas con las que se sale).
// al: todos los mapas exteriores de Alborada.
export function devPlaces(world) {
  const at = (id, x, y) => ({ map: id, x, y });
  const name = id => world.get?.(id)?.name || id;
  const sur = [];
  for (const [id, [x, y]] of Object.entries(SUR)) sur.push({ name: name(id), ...at(id, x, y) });
  sur.push({ name: 'Gimnasio extra de Ciudad Cascada (Amaranta)', ...at('cascada', 34, 12) });
  sur.push({ name: 'Cueva Guácharo (entrada del caño)', ...at('cano', 22, 25) });
  for (const [id, [map, x, y]] of Object.entries(MOTEL_DOORS)) sur.push({ name: MOTEL_NAMES[id], ...at(map, x, y) });
  for (const [id, L] of Object.entries(LOTS)) sur.push({ name: `Lote en venta · ${L.name}`, ...at(L.map, L.door[0], L.door[1] + 1) });
  for (const P of Object.values(CANDIDATES)) sur.push({ name: `${P.name} (pareja) · ${P.town}`, ...at(P.home.map, P.home.x, P.home.y + 1) });
  const al = (world.base || []).map(m => COURIER[m.id] ? { name: m.name, ...at(m.id, ...COURIER[m.id]) } : { name: m.name, g: [m.origin[0] + Math.floor(m.w / 2), m.origin[1] + Math.floor(m.h / 2)] });
  return { sur, al };
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
  return findFree(world, st, p.g[0], p.g[1], 60);
}
