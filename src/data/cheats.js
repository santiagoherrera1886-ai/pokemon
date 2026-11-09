// Códigos secretos (Opciones › Códigos). En el código sólo quedan sus huellas, no el texto de cada clave.
// Se guardan en la partida (st.cheats) y se apagan escribiendo la misma clave otra vez.
export const MONEY_MAX = 999999;
const SALT = 'alborada-bruma:';

// Mayúsculas, sin tildes, sin espacios ni signos: "Santi evoluciona" = "SANTIEVOLUCIONA".
export const normalizeCode = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
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
  money: { print: '10ec4785594157', name: 'Plata infinita', on: `Código aceptado: tu billetera queda llena para siempre ($${MONEY_MAX.toLocaleString('es-CO')}).`, off: 'Plata infinita apagada. Te quedas con lo que tienes.' }
};
export const cheatOn = (st, id) => !!(st && st.cheats && st.cheats[id]);

export function tryCode(st, text) {
  const n = normalizeCode(text);
  if (!n) return { ok: false, msg: 'Escribe un código.' };
  const p = codePrint(n), id = Object.keys(CHEATS).find(k => CHEATS[k].print === p);
  if (!id) return { ok: false, msg: 'Ese código no existe.' };
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
export const cleanCheats = c => Object.fromEntries(Object.keys(CHEATS).filter(k => c && c[k] === true).map(k => [k, true]));
