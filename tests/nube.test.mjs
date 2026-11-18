// Partidas en la nube (Supabase) con código de partida: se prueba con una nube de mentira en memoria.
import test from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k), clear: () => mem.clear() };
const cloudDB = new Map(); let calls = [];
globalThis.fetch = async (url, opts) => {
  const fn = url.split('/rpc/')[1], body = JSON.parse(opts.body); calls.push(fn);
  assert.ok(opts.headers.apikey.startsWith('sb_publishable_'), 'usa la llave pública');
  if (fn === 'puchamon_guardar') { cloudDB.set(body.codigo, JSON.parse(JSON.stringify(body.datos))); return { ok: true, json: async () => new Date().toISOString() }; }
  if (fn === 'puchamon_leer') return { ok: true, json: async () => cloudDB.get(body.codigo) ?? null };
  return { ok: false, status: 404, json: async () => ({}) };
};
const { nube, cleanCode, newCode } = await import('../src/core/nube.js');
const { newState, saveState, loadState, storeState } = await import('../src/core/state.js');

test('el código tiene 16 letras y se acepta como sea que lo escriban', () => {
  const c = newCode();
  assert.match(c, /^PUCHA-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(cleanCode(c.toLowerCase().replace(/-/g, ' ')), c);
  assert.equal(cleanCode('PUCHA-123'), null);
  assert.notEqual(newCode(), newCode());
});

test('al guardar se crea el código solo y la partida sube a la nube', async () => {
  mem.clear(); cloudDB.clear(); let first = null; nube.onFirst = code => { first = code; };
  const st = newState('Santi'); st.money = 777; saveState(st);
  assert.ok(await nube.push());
  assert.ok(nube.linked && first === nube.code, 'avisa la primera vez');
  assert.equal(cloudDB.get(nube.code).slots[1].money, 777);
});

test('otro equipo con el mismo código trae las partidas y no pisa lo más nuevo', async () => {
  const code = nube.code, remote = cloudDB.get(code);
  // "Otro equipo": navegador limpio que escribe el código.
  mem.clear();
  const got = await nube.link(code.toLowerCase());
  assert.deepEqual(got, [1]); assert.equal(loadState(1).money, 777);
  // Aquí se juega más: savedAt más nuevo; al subir no se pierde.
  const st = loadState(1); st.money = 900; saveState(st);
  await nube.push(); assert.equal(cloudDB.get(code).slots[1].money, 900);
  // La copia de la nube más nueva gana sobre una local vieja antes de subir.
  const newer = { ...cloudDB.get(code).slots[1], money: 1500, savedAt: Date.now() + 60000 };
  cloudDB.set(code, { ...remote, slots: { 1: newer } });
  const old = loadState(1); old.savedAt = Date.now() - 60000; storeState(old, 1);
  await nube.push(); assert.equal(loadState(1).money, 1500, 'se trajo la más nueva'); assert.equal(cloudDB.get(code).slots[1].money, 1500);
  await assert.rejects(nube.link('PUCHA-AAAA-AAAA-AAAA-AAAA'), /No hay partidas/);
});

test('con la nube apagada no se sube nada', async () => {
  nube.setOff(true); calls = [];
  const st = loadState(1); st.money = 5; saveState(st);
  assert.equal(await nube.push(), false); assert.deepEqual(calls, []);
  nube.setOff(false);
});
