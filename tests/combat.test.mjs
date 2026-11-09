import test from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, CHART, STATUS, effectiveness, canGetStatus } from '../src/data/types.js';
import { MOVES, ANIM_FRAMES } from '../src/data/moves.js';
import { SPECIES } from '../src/data/creatures.js';
import { ITEMS, canUseOn, useOnCreature } from '../src/data/items.js';

test('there are 18 types and the chart only uses known types and standard multipliers', () => {
  assert.equal(Object.keys(TYPES).length, 18);
  for (const [atk, row] of Object.entries(CHART)) {
    assert.ok(TYPES[atk], atk);
    for (const [def, k] of Object.entries(row)) { assert.ok(TYPES[def], `${atk}->${def}`); assert.ok([0, .5, 2].includes(k), `${atk}->${def}=${k}`); }
  }
  assert.deepEqual(Object.keys(CHART).sort(), Object.keys(TYPES).sort());
});

test('classic matchups work, including immunities and double weaknesses', () => {
  assert.equal(effectiveness('agua', ['fuego']), 2);
  assert.equal(effectiveness('electrico', ['tierra']), 0);
  assert.equal(effectiveness('lucha', ['fantasma']), 0);
  assert.equal(effectiveness('normal', ['fantasma']), 0);
  assert.equal(effectiveness('dragon', ['hada']), 0);
  assert.equal(effectiveness('tierra', ['volador']), 0);
  assert.equal(effectiveness('psiquico', ['siniestro']), 0);
  assert.equal(effectiveness('veneno', ['acero']), 0);
  assert.equal(effectiveness('fuego', ['planta', 'acero']), 4);
  assert.equal(effectiveness('agua', ['roca', 'tierra']), 4);
  assert.equal(effectiveness('planta', ['fuego', 'volador']), .25);
  assert.equal(effectiveness('hada', ['dragon']), 2);
});

test('every move is well formed and has an animation', () => {
  for (const [id, M] of Object.entries(MOVES)) {
    assert.ok(TYPES[M.type], `${id}: tipo`);
    assert.ok(ANIM_FRAMES[M.anim], `${id}: animación ${M.anim}`);
    assert.ok(M.pp > 0 && M.acc > 0 && M.acc <= 100, `${id}: pp/precisión`);
    assert.ok(M.power >= 0, id);
    if (M.status) assert.ok(STATUS[M.status[0]] && M.status[1] > 0 && M.status[1] <= 100, `${id}: estado`);
    for (const e of M.stat || []) assert.ok(['atk', 'def', 'spe'].includes(e.stat) && ['self', 'foe'].includes(e.target) && e.stages, `${id}: estadística`);
    if (M.power === 0) assert.ok(M.status || M.stat || M.heal || M.protect || M.confuse, `${id}: movimiento de estado sin efecto`);
    assert.ok(typeof M.desc === 'string' && M.desc.length > 5, `${id}: descripción`);
  }
  const perType = Object.keys(TYPES).map(t => Object.values(MOVES).filter(M => M.type === t && M.power > 0).length);
  assert.ok(perType.every(n => n >= 3), 'cada tipo tiene al menos 3 ataques');
});

test('learnsets only use existing moves and starters learn moves of their type', () => {
  for (const [sp, S] of Object.entries(SPECIES)) for (const [lv, mv] of S.learn) { assert.ok(MOVES[mv], `${sp}: ${mv}`); assert.ok(lv >= 1 && lv <= 100); }
  for (const [sp, t] of [['brotelo', 'planta'], ['brasin', 'fuego'], ['charquin', 'agua']]) assert.ok(SPECIES[sp].learn.some(([, m]) => MOVES[m].type === t && MOVES[m].power > 0), sp);
});

test('status immunities follow the creature types', () => {
  assert.equal(canGetStatus('que', ['fuego']), false);
  assert.equal(canGetStatus('ven', ['acero']), false);
  assert.equal(canGetStatus('par', ['electrico', 'volador']), false);
  assert.equal(canGetStatus('con', ['hielo']), false);
  assert.equal(canGetStatus('dor', ['normal']), true);
});

test('status cure items only work on the matching status', () => {
  const c = { name: 'Prueba', hp: 10, stats: { hp: 20 }, moves: [], status: 'ven' };
  assert.equal(canUseOn('antidoto', c), true);
  assert.equal(canUseOn('tinto', c), false);
  assert.equal(canUseOn('remedioCasero', c), true);
  const res = useOnCreature('antidoto', c);
  assert.ok(res.ok && res.cured); assert.equal(c.status, null);
  assert.equal(canUseOn('antidoto', c), false);
  for (const id of ['antidoto', 'arnica', 'tinto', 'sabila', 'panelaCaliente', 'remedioCasero']) assert.ok(ITEMS[id].cure, id);
});
