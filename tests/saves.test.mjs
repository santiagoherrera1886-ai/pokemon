import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage mínimo para probar las ranuras sin navegador.
const store = new Map();
globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), clear: () => store.clear() };

const { newState, saveState, loadState, listSaves, hasSave, firstFreeSlot, parseState, storeState, eraseSave, playTimeText } = await import('../src/core/state.js');
const { avatarLook, cleanAvatar, defaultAvatar, AVATAR_OPTIONS } = await import('../src/data/avatar.js');

test('three save slots are independent and slot 1 keeps the original key', () => {
  store.clear();
  assert.equal(hasSave(), false); assert.equal(firstFreeSlot(), 1);
  const a = newState('Santi', defaultAvatar(), 1), b = newState('Vale', defaultAvatar('chica'), 2);
  a.badges = ['hoja']; saveState(a); saveState(b);
  assert.ok(store.has('alborada-save-v1'), 'la ranura 1 usa la clave de siempre');
  assert.deepEqual(listSaves().map(s => [s.slot, s.name, s.badges]), [[1, 'Santi', 1], [2, 'Vale', 0]]);
  assert.equal(firstFreeSlot(), 3);
  assert.equal(loadState(2).avatar.body, 'chica');
  eraseSave(1); assert.equal(hasSave(1), false); assert.equal(hasSave(), true);
});

test('old saves without avatar or slot still load', () => {
  store.clear();
  const old = newState('Viejo'); delete old.avatar; delete old.slot; delete old.savedAt; old.options = { perspective: false, textSpeed: 1 };
  store.set('alborada-save-v1', JSON.stringify(old));
  const st = loadState(1);
  assert.equal(st.slot, 1); assert.equal(st.avatar.body, 'chico'); assert.equal(st.options.autosave, true); assert.equal(st.options.perspective, false);
});

test('imported saves are validated and stored in the chosen slot', () => {
  store.clear();
  assert.equal(parseState('{"hola":1}'), null);
  assert.equal(parseState('no es json'), null);
  const st = newState('Archivo'); st.savedAt = 123;
  assert.ok(storeState(JSON.stringify(st), 3));
  assert.equal(loadState(3).name, 'Archivo'); assert.equal(loadState(3).savedAt, 123, 'guardar una partida traída no cambia su fecha');
});

test('avatar values are clamped and turned into a full look', () => {
  const bad = cleanAvatar({ body: 'chica', skin: 99, hairStyle: 'spiky', hat: -1, top: 2.5 });
  assert.equal(bad.body, 'chica'); assert.equal(bad.hairStyle, 'long'); assert.equal(bad.skin, defaultAvatar('chica').skin);
  const look = avatarLook({ ...defaultAvatar('chica'), hat: 0, bottom: 4 });
  assert.equal(look.wearCap, false); assert.equal(look.skirt, true); assert.equal(look.pants, AVATAR_OPTIONS.bottom[4]);
  const boy = avatarLook(defaultAvatar());
  assert.equal(boy.wearCap, true); assert.equal(boy.skirt, false); assert.match(boy.hat, /^#/);
  for (const key of ['skin', 'hair', 'shirt', 'pants', 'shoes', 'bag']) assert.match(boy[key], /^#[0-9a-f]{6}$/i, key);
});

test('play time reads in hours and minutes', () => {
  assert.equal(playTimeText(0), '0 min');
  assert.equal(playTimeText(60 * 60 * 125), '2 h 05 min');
});
