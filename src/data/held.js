// Objetos equipables: cada criatura lleva uno (c.item) y actúa solo en combate.
// power: más daño en todo · type: más daño en un tipo · speed: más Velocidad · guard: menos daño recibido
// regen: recupera PS al final de cada turno · berry: se la come con pocos PS y se gasta.
import { ITEMS } from './items.js';

export const isHeld = id => !!ITEMS[id]?.held;
export const heldOf = c => (c && c.item && ITEMS[c.item]?.held) || null;
export function heldPower(c, M) {
  const h = heldOf(c); if (!h || !M.power) return 1;
  if (h.kind === 'power') return h.mult;
  if (h.kind === 'type' && h.type === M.type) return h.mult;
  return 1;
}
export const heldGuard = c => { const h = heldOf(c); return h && h.kind === 'guard' ? h.mult : 1; };
export const heldSpeed = c => { const h = heldOf(c); return h && h.kind === 'speed' ? h.mult : 1; };
export const heldRegen = c => { const h = heldOf(c); return h && h.kind === 'regen' && c.hp > 0 && c.hp < c.stats.hp ? Math.max(1, Math.floor(c.stats.hp * h.frac)) : 0; };
export const berryReady = c => { const h = heldOf(c); return !!(h && h.kind === 'berry' && c.hp > 0 && c.hp <= c.stats.hp * h.at); };
export const berryHeal = c => Math.max(1, Math.floor(c.stats.hp * (heldOf(c)?.heal || 0)));

// Dar o quitar un objeto desde el menú: lo que tenía vuelve a la mochila.
export function giveHeld(st, c, id) {
  if (!isHeld(id) || !(st.bag[id] > 0)) return { ok: false, msg: 'Eso no se puede equipar.' };
  const old = c.item;
  st.bag[id]--;
  if (old) st.bag[old] = (st.bag[old] || 0) + 1;
  c.item = id;
  return { ok: true, old, msg: old ? `${c.name} ahora lleva ${ITEMS[id].name}. ${ITEMS[old].name} volvió a la mochila.` : `${c.name} ahora lleva ${ITEMS[id].name}.` };
}
export function takeHeld(st, c) {
  if (!c.item) return { ok: false, msg: `${c.name} no lleva nada.` };
  const id = c.item; delete c.item;
  st.bag[id] = (st.bag[id] || 0) + 1;
  return { ok: true, msg: `Guardaste ${ITEMS[id].name} en la mochila.` };
}
