// Pelea Puchamon: golpes, empujones que crecen con el daño, plataformas, vidas y partidas de la máquina.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FightSim, makeFighter, STAGES, MOVES, peleaReward, blankInput } from '../src/games/pelea/sim.js';
import { SPECIES } from '../src/data/creatures.js';

const run = (sim, secs, fn) => { for (let i = 0; i < secs * 60 && sim.phase !== 'done'; i++) { fn?.(i); sim.step(1 / 60); } };

test('cada especie da un peleador con números válidos', () => {
  for (const sp of Object.keys(SPECIES)) { const f = makeFighter(sp, 30); for (const k of ['weight', 'power', 'speed', 'jump']) assert.ok(Number.isFinite(f[k]) && f[k] > 0, sp + ' ' + k); assert.ok(['shot', 'dash'].includes(f.special)); }
  assert.equal(makeFighter('brasin', 10).special, 'shot'); assert.equal(makeFighter('brotelo', 10).special, 'dash');
});

test('un golpe sube el daño y con más daño se sale más lejos', () => {
  const dist = dmg => {
    const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30);
    const sim = new FightSim({ fighters: [a, b] }); a.x = 0; b.x = 1; a.face = 1; b.damage = dmg;
    sim.hitFighter(b, a, MOVES.side.dmg, MOVES.side.kb, MOVES.side.grow, MOVES.side.ang, 1);
    const x0 = b.x; run(sim, 1.2); return { d: b.x - x0, dmg: b.damage };
  };
  const low = dist(0), high = dist(120);
  assert.ok(low.dmg > 0, 'sube el daño');
  assert.ok(high.d > low.d * 2, `más lejos con daño: ${low.d.toFixed(1)} → ${high.d.toFixed(1)}`);
});

test('salir de la zona quita una vida y reaparece arriba', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  b.x = 30; sim.step(1 / 60);
  assert.equal(b.stocks, 2); assert.ok(b.out);
  run(sim, 2); assert.ok(!b.out && b.y > 5 && b.damage === 0 && b.inv > 0, 'reaparece arriba, sin daño y protegido');
});

test('se para en las plataformas y se baja con abajo', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  const [x0, x1, h] = STAGES.isla.plats[0];
  a.x = (x0 + x1) / 2; a.y = h + 2; a.ground = false; run(sim, 1);
  assert.ok(a.ground && Math.abs(a.y - h) < .01, 'cayó sobre la plataforma');
  sim.setInput(0, { ...blankInput(), down: true }); sim.step(1 / 60); sim.setInput(0, blankInput()); run(sim, 1);
  assert.ok(a.ground && a.y === 0, 'se bajó al piso');
  sim.setInput(0, { ...blankInput(), jump: true }); sim.step(1 / 60); assert.ok(!a.ground && a.vy > 0, 'salta');
});

test('el escudo aguanta golpes y se rompe si se abusa', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  b.shielding = true; b.shield = 1;
  sim.hitFighter(b, a, 10, 5, 1, 30, 1); assert.equal(b.damage, 0, 'no recibe daño con escudo');
  for (let i = 0; i < 6; i++) { b.shielding = true; sim.hitFighter(b, a, 10, 5, 1, 30, 1); }
  assert.ok(b.broken > 0, 'el escudo se rompe');
});

test('las peleas de la máquina terminan por vidas', () => {
  let ends = 0;
  for (let seed = 1; seed <= 6; seed++) for (const stage of Object.keys(STAGES)) {
    const sim = new FightSim({ fighters: [makeFighter('brasin', 30, { cpu: true }), makeFighter('bosqueron', 30, { cpu: true }), makeFighter('pipiu', 30, { cpu: true })], stage, seed, skill: .6 });
    run(sim, 200);
    for (const p of sim.f) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    if (sim.phase === 'done' && sim.time < sim.limit) ends++;
  }
  assert.ok(ends >= 10, 'casi todas terminan antes del tiempo: ' + ends);
});

test('el premio suma plata, más si ganas', () => {
  assert.ok(peleaReward(true, 3, 2, 3, 4).money > peleaReward(true, 1, 0, 1, 1).money);
  assert.ok(peleaReward(false, 1, 1, 0, 0).money > 0);
});
