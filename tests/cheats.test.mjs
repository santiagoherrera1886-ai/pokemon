import test from 'node:test';
import assert from 'node:assert/strict';
import { CHEATS, MONEY_MAX, LEGENDS, LEGEND_LEVEL, normalizeCode, codePrint, tryCode, spend, refillMoney, cleanCheats, cheatOn } from '../src/data/cheats.js';
import { SPECIES, makeCreature } from '../src/data/creatures.js';

// Las claves reales no se escriben aquí (el repositorio es público): se prueban con claves de prueba.
const withTestCodes = fn => {
  const saved = Object.fromEntries(Object.entries(CHEATS).map(([k, c]) => [k, c.print]));
  CHEATS.evolve.print = codePrint('EVOPRUEBA'); CHEATS.money.print = codePrint('PLATAPRUEBA');
  CHEATS.level.print = codePrint('NIVELPRUEBA'); CHEATS.legend.print = codePrint('LEYENDAPRUEBA');
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
  assert.deepEqual(cleanCheats({ evolve: true, money: 'si', otro: true, legend: true }), { evolve: true });
}));

test('the level code is a switch like the others', () => withTestCodes(() => {
  const st = { money: 0 };
  let r = tryCode(st, 'nivel prueba'); assert.ok(r.ok && r.on && cheatOn(st, 'level'));
  r = tryCode(st, 'NIVEL PRUEBA'); assert.ok(r.ok && !r.on && !cheatOn(st, 'level'));
}));

test('the legendary code gives every legendary once, to the party first and then to the box', () => withTestCodes(() => {
  assert.deepEqual([...LEGENDS].sort(), Object.keys(SPECIES).filter(k => SPECIES[k].legendary).sort());
  assert.equal(LEGENDS.length, 5);
  const st = { money: 0, party: [makeCreature('brotelo', 10), makeCreature('pipiu', 5), makeCreature('roedin', 5)], box: [makeCreature('glaciel', 60)], dex: {} };
  const r = tryCode(st, 'Leyenda prueba');
  assert.ok(r.ok && !r.on, 'no queda prendido');
  assert.equal(st.cheats, undefined, 'no se guarda como interruptor');
  assert.deepEqual([...r.given].sort(), LEGENDS.filter(k => k !== 'glaciel').sort(), 'no repite la que ya tenía');
  assert.equal(st.party.length, 6); assert.equal(st.box.length, 2);
  for (const c of [...st.party.slice(3), ...st.box.slice(1)]) { assert.ok(SPECIES[c.sp].legendary); assert.equal(c.level, LEGEND_LEVEL); assert.equal(st.dex[c.sp], 2); }
  const again = tryCode(st, 'LEYENDAPRUEBA');
  assert.equal(again.given.length, 0); assert.match(again.msg, /Ya tienes/);
}));
