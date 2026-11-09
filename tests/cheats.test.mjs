import test from 'node:test';
import assert from 'node:assert/strict';
import { CHEATS, MONEY_MAX, normalizeCode, codePrint, tryCode, spend, refillMoney, cleanCheats, cheatOn } from '../src/data/cheats.js';

// Las claves reales no se escriben aquí (el repositorio es público): se prueban con claves de prueba.
const withTestCodes = fn => {
  const saved = Object.fromEntries(Object.entries(CHEATS).map(([k, c]) => [k, c.print]));
  CHEATS.evolve.print = codePrint('EVOPRUEBA'); CHEATS.money.print = codePrint('PLATAPRUEBA');
  try { fn(); } finally { for (const [k, p] of Object.entries(saved)) CHEATS[k].print = p; }
};

test('codes ignore case, accents, spaces and signs', () => {
  assert.equal(normalizeCode('  Plata  prueba! '), 'PLATAPRUEBA');
  assert.equal(normalizeCode('evolución-prueba'), 'EVOLUCIONPRUEBA');
  assert.equal(codePrint('A'), codePrint('A')); assert.notEqual(codePrint('A'), codePrint('B'));
});

test('the source only keeps fingerprints, never the codes themselves', () => {
  for (const c of Object.values(CHEATS)) assert.match(c.print, /^[0-9a-f]{10,14}$/);
});

test('a code turns its cheat on and the same code turns it off', () => withTestCodes(() => {
  const st = { money: 120 };
  assert.equal(tryCode(st, 'nada que ver').ok, false);
  assert.equal(tryCode(st, '').ok, false);
  let r = tryCode(st, 'plata prueba');
  assert.ok(r.ok && r.on && r.id === 'money'); assert.equal(st.money, MONEY_MAX);
  spend(st, 50000); assert.equal(st.money, MONEY_MAX, 'con plata infinita comprar no baja la plata');
  st.money = 3; refillMoney(st); assert.equal(st.money, MONEY_MAX);
  r = tryCode(st, 'Evo Prueba'); assert.ok(r.ok && cheatOn(st, 'evolve'));
  r = tryCode(st, 'PLATA PRUEBA'); assert.ok(r.ok && !r.on && !cheatOn(st, 'money'));
  spend(st, 1000); assert.equal(st.money, MONEY_MAX - 1000, 'apagado, la plata vuelve a gastarse');
  assert.deepEqual(cleanCheats({ evolve: true, money: 'si', otro: true }), { evolve: true });
}));
