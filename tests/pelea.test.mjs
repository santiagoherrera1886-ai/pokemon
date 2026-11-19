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

test('sostener A carga el golpe fuerte y pega más duro', () => {
  const smash = hold => {
    const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
    a.x = 0; b.x = 1.1; a.face = 1; b.face = -1;
    sim.setInput(0, { ...blankInput(), x: 1, attack: true, attackHeld: hold }); sim.step(1 / 60);
    if (hold) { assert.equal(a.state, 'charge', 'está cargando'); for (let i = 0; i < 40; i++) { sim.setInput(0, { ...blankInput(), x: 1, attackHeld: true }); sim.step(1 / 60); } }
    sim.setInput(0, blankInput()); run(sim, .8);
    return b.damage;
  };
  const tap = smash(false), charged = smash(true);
  assert.ok(tap > 0, 'el golpe normal pega');
  assert.ok(charged > tap * 1.3, `cargado pega más: ${tap.toFixed(1)} → ${charged.toFixed(1)}`);
});

test('un golpe congela un instante a los dos (pausa de impacto)', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  a.x = 0; b.x = 1; a.face = 1;
  const f = sim.hitFighter(b, a, 12, 5, 1, 40, 1);
  assert.ok(f > 0 && b.freeze > 0, 'queda congelado');
  const x0 = b.x; sim.step(1 / 60); assert.equal(b.x, x0, 'no se mueve durante la pausa');
  run(sim, .5); assert.ok(b.x > x0, 'después sale volando');
});

test('se agarra del borde al caer cerca y sube con arriba', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] }), edge = STAGES.isla.main[1];
  a.x = edge + .3; a.y = -.3; a.vy = -2; a.ground = false;
  run(sim, .2); assert.equal(a.ledge, 1, 'colgado del borde derecho');
  assert.ok(a.inv > 0, 'protegido al agarrarse');
  sim.setInput(0, { ...blankInput(), up: true }); sim.step(1 / 60);
  assert.ok(!a.ledge && a.ground && a.y === 0 && a.x < edge, 'subió al escenario');
});

test('con el escudo una dirección rueda sin recibir golpes y termina mirando atrás', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  a.x = -2; a.face = 1; b.x = 4;
  sim.setInput(0, { ...blankInput(), shield: true }); sim.step(1 / 60); assert.ok(a.shielding, 'pone el escudo');
  sim.setInput(0, { ...blankInput(), shield: true, x: 1 }); sim.step(1 / 60);
  assert.ok(a.dodge > 0 && a.inv > 0 && a.state === 'roll', 'rueda protegido');
  const x0 = a.x; sim.setInput(0, blankInput()); run(sim, .6);
  assert.ok(a.x - x0 > 1.5, 'avanzó rodando: ' + (a.x - x0).toFixed(2)); assert.equal(a.face, -1, 'quedó mirando hacia atrás');
  // Correr y luego poner el escudo no rueda solo.
  sim.setInput(0, { ...blankInput(), x: 1 }); sim.step(1 / 60); sim.setInput(0, { ...blankInput(), x: 1, shield: true }); sim.step(1 / 60);
  assert.ok(a.shielding && a.dodge <= 0, 'sólo escudo');
});

test('rodar se frena en el borde del escenario', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] }), edge = STAGES.isla.main[1];
  a.x = edge - 1; b.x = -5;
  sim.setInput(0, { ...blankInput(), shield: true }); sim.step(1 / 60);
  sim.setInput(0, { ...blankInput(), shield: true, x: 1 }); sim.step(1 / 60); sim.setInput(0, blankInput()); run(sim, .6);
  assert.ok(a.ground && a.x <= edge && a.stocks === 3, 'sigue en el piso: ' + a.x.toFixed(2));
});

test('en el aire el escudo esquiva una sola vez por salto', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] });
  a.x = 0; a.y = 4; a.ground = false;
  sim.setInput(0, { ...blankInput(), shield: true }); sim.step(1 / 60);
  assert.ok(a.dodge > 0 && a.airDodge && a.inv > 0, 'esquiva en el aire');
  sim.setInput(0, blankInput()); run(sim, .4); sim.setInput(0, { ...blankInput(), shield: true }); sim.step(1 / 60);
  assert.ok(a.dodge <= 0, 'no repite en el mismo salto');
  sim.setInput(0, blankInput()); run(sim, 1.5); assert.ok(a.ground && !a.airDodge, 'al caer se recupera');
});

test('soltar el salto rápido da un saltico más bajo', () => {
  const height = held => {
    const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), sim = new FightSim({ fighters: [a, b] }); b.x = 6;
    sim.setInput(0, { ...blankInput(), jump: true, jumpHeld: true }); sim.step(1 / 60);
    let top = 0; sim.setInput(0, { ...blankInput(), jumpHeld: held }); run(sim, 1, () => { top = Math.max(top, a.y); });
    return top;
  };
  const full = height(true), short = height(false);
  assert.ok(short < full * .75, `saltico ${short.toFixed(2)} contra salto ${full.toFixed(2)}`);
});

test('abajo + B lanza el poder de su tipo alrededor y luego se recarga', () => {
  const a = makeFighter('brasin', 30), b = makeFighter('charquin', 30), c = makeFighter('brotelo', 30), sim = new FightSim({ fighters: [a, b, c] });
  a.x = 0; b.x = 1.4; c.x = -1.4; a.pcd = 0;
  sim.setInput(0, { ...blankInput(), special: true, down: true }); sim.step(1 / 60);
  assert.equal(a.move, 'power', 'arranca el poder'); assert.ok(a.pcd > 0, 'queda recargando');
  assert.ok(sim.events.some(e => e.type === 'power' && e.id === 0), 'avisa para el dibujo');
  sim.setInput(0, blankInput()); run(sim, .8);
  assert.ok(b.damage > 0 && c.damage > 0, 'le pega a los dos lados');
  assert.ok(b.x > 1.4 && c.x < -1.4, 'los empuja hacia afuera');
  run(sim, .5); sim.setInput(0, { ...blankInput(), special: true, down: true }); sim.step(1 / 60);
  assert.notEqual(a.move, 'power', 'no se repite mientras recarga');
});

test('el premio suma plata, más si ganas', () => {
  assert.ok(peleaReward(true, 3, 2, 3, 4).money > peleaReward(true, 1, 0, 1, 1).money);
  assert.ok(peleaReward(false, 1, 1, 0, 0).money > 0);
});
