// Partidas en la nube (Supabase). Todas las ranuras se guardan con un "código de partida" secreto, como las
// claves de los juegos de antes: con el mismo código sigues jugando en el iPad, el celular o el computador.
// El código queda en este navegador; en Supabase sólo se guarda su huella (sha256), nunca el código.
// La llave de abajo es la pública del proyecto (hecha para ir en la página): sin el código no se puede leer nada.
import { SLOTS, loadState, storeState, parseState } from './state.js';

export const SUPABASE = { url: 'https://tuaxomjkkkmhjdpjvenp.supabase.co', key: 'sb_publishable_Gk7vEuZwSysOjIGJqE8zwQ_jE9pJbz-' };
const KEY = 'puchamon-nube-v1';
const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // sin letras que se confunden (I, L, O, 0, 1)

function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
function write(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } }
// 16 letras al azar (unos 79 bits): imposible de adivinar. Se escribe en grupos de 4 para copiarlo fácil.
export function newCode() {
  const a = new Uint8Array(16); crypto.getRandomValues(a);
  let s = ''; for (const b of a) s += ABC[b % ABC.length];
  return 'PUCHA-' + s.match(/.{4}/g).join('-');
}
// Acepta el código con o sin guiones, en minúsculas o con espacios.
export function cleanCode(text) {
  const raw = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^PUCHA/, '');
  if (raw.length !== 16 || [...raw].some(c => !ABC.includes(c))) return null;
  return 'PUCHA-' + raw.match(/.{4}/g).join('-');
}
async function rpc(fn, body) {
  let res;
  try { res = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw new Error('No hay conexión con la nube. Se intenta otra vez al guardar.'); }
  if (!res.ok) throw new Error(`La nube respondió ${res.status}. Intenta otra vez en un rato.`);
  return res.json();
}
function bundle() {
  const slots = {};
  for (const n of SLOTS) { const st = loadState(n); if (st) slots[n] = st; }
  return { game: 'alborada', version: 1, updatedAt: Date.now(), slots };
}
// Mezcla lo que llegó de la nube: una ranura local sólo se reemplaza si la de la nube es más nueva.
function merge(data) {
  const updated = [];
  for (const n of SLOTS) {
    const remote = parseState(data?.slots?.[n], n); if (!remote) continue;
    const local = loadState(n);
    if (!local || (remote.savedAt || 0) > (local.savedAt || 0)) { storeState(remote, n); updated.push(n); }
  }
  return updated;
}

export const nube = {
  get linked() { return !!read()?.code; },
  get off() { return !!read()?.off; },
  get code() { return read()?.code || ''; },
  get lastSync() { return read()?.lastSync || 0; },
  // Sube todas las ranuras. La primera vez se crea el código solo (así toda partida queda en la nube).
  async push() {
    let c = read(); if (c?.off) return false;
    if (!c?.code) { c = { code: newCode(), lastSync: 0 }; write(c); }
    // Antes de subir se traen las ranuras más nuevas de otros equipos, para no pisarlas con copias viejas.
    else { const remote = await rpc('puchamon_leer', { codigo: c.code }); if (remote) merge(remote); }
    const data = bundle(); if (!Object.keys(data.slots).length) return false;
    await rpc('puchamon_guardar', { codigo: c.code, datos: data });
    write({ ...c, lastSync: Date.now() });
    if (!c.lastSync) this.onFirst?.(c.code);
    return true;
  },
  async pull() {
    const c = read(); if (!c?.code || c.off) return [];
    const data = await rpc('puchamon_leer', { codigo: c.code });
    const updated = data ? merge(data) : [];
    write({ ...c, lastSync: Date.now() }); return updated;
  },
  // Usar un código que ya existe (por ejemplo el del iPad en el computador): trae esas partidas.
  async link(text) {
    const code = cleanCode(text); if (!code) throw new Error('Ese código no está completo: son 16 letras y números después de PUCHA.');
    const data = await rpc('puchamon_leer', { codigo: code });
    if (!data) throw new Error('No hay partidas guardadas con ese código. Revisa que esté bien escrito.');
    write({ code, lastSync: Date.now() });
    return merge(data);
  },
  setOff(off) { const c = read() || {}; write({ ...c, off: !!off }); },
  forget() { write({ off: false }); },
  // Subida silenciosa después de guardar (no interrumpe el juego si falla).
  pushSoon() {
    if (this.off) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push().catch(e => console.warn('Puchamon: nube pendiente', e.message)), 1800);
  }
};
