// Códigos secretos (Opciones › Códigos). En el código sólo quedan sus huellas, no el texto de cada clave.
// Los de interruptor se guardan en la partida (st.cheats) y se apagan escribiendo la misma clave otra vez;
// los de regalo (action) entregan algo cada vez que se escriben y no quedan prendidos.
import { SPECIES, makeCreature } from './creatures.js';

export const MONEY_MAX = 999999;
export const LEGEND_LEVEL = 50;
const SALT = 'alborada-bruma:';

// Mayúsculas, sin tildes, sin espacios ni signos: "Hola, mamá" = "HOLAMAMA".
export const normalizeCode = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// Huella cyrb53 (rápida y sin dependencias): sirve para no dejar la clave escrita en el código del juego.
export function codePrint(text, seed = 0) {
  const str = SALT + text; let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export const CHEATS = {
  evolve: { print: '143d0f2012e239', name: 'Evolución libre', on: 'Código aceptado: ahora puedes evolucionar cualquier criatura desde su ficha (EVOLUCIONAR).', off: 'Evolución libre apagada.' },
  money: { print: '10ec4785594157', name: 'Plata infinita', on: `Código aceptado: tu billetera queda llena para siempre ($${MONEY_MAX.toLocaleString('es-CO')}).`, off: 'Plata infinita apagada. Te quedas con lo que tienes.' },
  level: { print: '8308c66b3bb1e', name: 'Subir de nivel', on: 'Código aceptado: en la ficha de cada criatura aparecen SUBIR 1 NIVEL y SUBIR 10 NIVELES.', off: 'Subir de nivel apagado.' },
  legend: { print: '93b8953577db9', name: 'Legendarios', action: true }
};
export const cheatOn = (st, id) => !!(st && st.cheats && st.cheats[id]);

export function tryCode(st, text) {
  const n = normalizeCode(text);
  if (!n) return { ok: false, msg: 'Escribe un código.' };
  const p = codePrint(n), id = Object.keys(CHEATS).find(k => CHEATS[k].print === p);
  if (!id) return { ok: false, msg: 'Ese código no existe.' };
  if (CHEATS[id].action) { const r = giveLegends(st); return { ok: true, id, on: false, given: r.given, msg: r.msg }; }
  st.cheats = st.cheats || {};
  st.cheats[id] = !st.cheats[id];
  if (!st.cheats[id]) delete st.cheats[id];
  if (!Object.keys(st.cheats).length) delete st.cheats;
  refillMoney(st);
  return { ok: true, id, on: cheatOn(st, id), msg: cheatOn(st, id) ? CHEATS[id].on : CHEATS[id].off };
}

// Plata: con el código prendido la billetera siempre está llena y nada la baja.
export function refillMoney(st) { if (cheatOn(st, 'money') && st.money !== MONEY_MAX) st.money = MONEY_MAX; }
export function spend(st, amount) { if (cheatOn(st, 'money')) return refillMoney(st); st.money -= amount; }
export const cleanCheats = c => Object.fromEntries(Object.keys(CHEATS).filter(k => !CHEATS[k].action && c && c[k] === true).map(k => [k, true]));

// Legendarios: entrega las especies legendarias que todavía no tienes (equipo o caja), al nivel 50.
// Van al equipo mientras haya cupo y el resto a la caja del PC; quedan registradas como atrapadas.
export const LEGENDS = Object.keys(SPECIES).filter(k => SPECIES[k].legendary);
export function giveLegends(st, level = LEGEND_LEVEL) {
  st.party = st.party || []; st.box = st.box || []; st.dex = st.dex || {};
  const owned = new Set([...st.party, ...st.box].filter(Boolean).map(c => c.sp));
  const list = LEGENDS.filter(k => !owned.has(k));
  if (!list.length) return { given: [], msg: 'Ya tienes todas las criaturas legendarias.' };
  let toBox = 0;
  for (const sp of list) {
    const c = makeCreature(sp, level);
    if (st.party.length < 6) st.party.push(c); else { st.box.push(c); toBox++; }
    st.dex[sp] = 2;
  }
  const names = list.map(k => SPECIES[k].name), many = list.length > 1;
  const where = !toBox ? '' : toBox === list.length ? ` Tu equipo está lleno: ${many ? 'quedaron' : 'quedó'} en la caja del PC de cualquier posada.` : ` ${toBox} ${toBox > 1 ? 'quedaron' : 'quedó'} en la caja del PC de cualquier posada.`;
  return { given: list, msg: `¡${many ? `Llegaron ${list.length} criaturas legendarias` : 'Llegó una criatura legendaria'} al nivel ${level}: ${names.join(', ')}!${where}` };
}
