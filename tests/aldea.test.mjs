// Aldea Puchamon: producción, obras con tiempo, ejército y ataques a aldeas rivales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { B, GRID, newAldea, aldeaState, tick, collect, build, buildBlock, upgrade, upgradeBlock, rush, rushCost, fits, move, troopCards, train, untrain, armySpace, armyUsed, bayasCap, enemyVillage, RaidSim, casaLevel, TRAIN_COST } from '../src/games/aldea/sim.js';
import { makeCard, rng } from '../src/games/arena/sim.js';
import { makeCreature } from '../src/data/creatures.js';
import { newState } from '../src/core/state.js';

const T0 = 1_700_000_000_000;
test('las minas producen plata con el tiempo y se recoge en la partida', () => {
  const st = newState(), A = aldeaState(st, T0), mina = A.buildings.find(b => b.kind === 'mina');
  tick(A, T0 + 10 * 60000);
  assert.equal(Math.round(mina.store), 10 * B.mina.prod[0], '10 minutos de producción');
  tick(A, T0 + 600 * 60000); assert.equal(mina.store, B.mina.cap[0], 'se llena hasta su tope');
  const before = st.money, got = collect(A, mina, st, T0 + 600 * 60000);
  assert.equal(st.money, before + got); assert.equal(mina.store, 0);
  const huerto = A.buildings.find(b => b.kind === 'huerto'); A.bayas = bayasCap(A) - 10; tick(A, T0 + 700 * 60000);
  assert.equal(collect(A, huerto, st, T0 + 700 * 60000), 10, 'las bayas sólo hasta lo que cabe en el granero');
});

test('construir, mejorar con tiempo, terminar ya y mover', () => {
  const st = newState(); st.money = 100000; const A = aldeaState(st, T0);
  assert.equal(buildBlock(A, 'lanza', st, T0), 'Sube la Casa Grande para construir esto');
  const casa = A.buildings.find(b => b.kind === 'casa');
  assert.ok(upgrade(A, casa, st, T0)); assert.equal(casa.level, 1, 'la obra tarda'); assert.ok(casa.upg);
  tick(A, T0 + B.casa.time[1] * 1000 + 1); assert.equal(casaLevel(A), 2, 'terminó la obra');
  assert.ok(!fits(A, 'lanza', 10, 10), 'no encima de otro edificio');
  const l = build(A, 'lanza', 2, 9, st, T0 + 100000); assert.ok(l && l.level === 0 && l.upg, 'se construye con tiempo');
  const cost = rushCost(l, T0 + 100000); const m0 = st.money; assert.ok(rush(A, l, st, T0 + 100000)); assert.equal(st.money, m0 - cost); assert.equal(l.level, 1);
  assert.ok(move(A, l, 2, 12)); assert.ok(!move(A, l, 10, 10));
  const wall = build(A, 'muro', 8, 20, st, T0 + 100000); assert.equal(wall.level, 1, 'el muro es al instante');
  const tower = A.buildings.find(b => b.kind === 'torre'); tower.level = 2;
  assert.equal(upgradeBlock(A, tower, st, T0 + 100000), 'Sube la Casa Grande primero');
  st.money = 0; assert.equal(buildBlock(A, 'mina', st, T0 + 100000), 'Te falta plata');
});

test('entrenar Puchamon con bayas hasta llenar el corral', () => {
  const st = newState(); st.party = [makeCreature('brasin', 20), makeCreature('pipiu', 15)];
  const A = aldeaState(st, T0), cards = troopCards(st); A.bayas = 5000;
  let n = 0; while (train(A, cards.brasin, cards)) n++;
  assert.ok(armyUsed(A, cards) <= armySpace(A) && n > 0, 'no pasa del espacio del corral');
  assert.ok(armySpace(A) - armyUsed(A, cards) < cards.brasin.cost);
  const b0 = A.bayas; assert.ok(untrain(A, cards.brasin)); assert.equal(A.bayas, b0 + Math.floor(cards.brasin.cost * TRAIN_COST * .5));
});

test('las aldeas rivales quedan bien armadas en todos los niveles', () => {
  for (let lv = 1; lv <= 5; lv++) for (let s = 1; s <= 5; s++) {
    const v = enemyVillage(lv, 20, rng(lv * 10 + s));
    assert.ok(v.buildings.some(b => b.kind === 'casa'));
    for (const b of v.buildings) { const sz = B[b.kind].size; assert.ok(b.x >= 0 && b.y >= 0 && b.x + sz <= GRID && b.y + sz <= GRID, 'dentro del mapa'); }
    for (let i = 0; i < v.buildings.length; i++) for (let j = i + 1; j < v.buildings.length; j++) { const a = v.buildings[i], b = v.buildings[j], sa = B[a.kind].size, sb = B[b.kind].size; assert.ok(!(a.x < b.x + sb && a.x + sa > b.x && a.y < b.y + sb && a.y + sa > b.y), 'sin choques'); }
    if (lv >= 2) assert.ok(v.buildings.some(b => b.kind === 'muro'), 'con muros');
    assert.ok(v.loot.plata > 0 && v.loot.bayas > 0);
  }
});

test('un ataque con buen ejército tumba la aldea y deja botín', () => {
  const village = enemyVillage(2, 20, rng(4));
  const army = [{ card: makeCard('bosqueron', 40), count: 3 }, { card: makeCard('brason', 40), count: 4 }, { card: makeCard('pipiu', 30), count: 4 }];
  const sim = new RaidSim({ village, army, seed: 3 });
  assert.ok(!sim.canDeploy(11, 11), 'no en el centro');
  const spots = [[.6, 12], [23.4, 12], [12, .6], [12, 23.4], [.6, .6], [23.4, 23.4], [.6, 23.4], [23.4, .6]].filter(([x, y]) => sim.canDeploy(x, y));
  assert.ok(spots.length > 0, 'hay bordes libres para soltar');
  let k = 0;
  for (let i = 0; i < 60 * (150 + 5) && sim.phase !== 'done'; i++) {
    if (i % 20 === 0) for (let a = 0; a < sim.army.length; a++) if (sim.army[a].count > 0) { const [x, y] = spots[k++ % spots.length]; sim.deploy(a, x, y); break; }
    sim.step(1 / 60);
    for (const u of sim.units) assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y));
  }
  assert.equal(sim.phase, 'done');
  const s = sim.spoils();
  assert.ok(s.pct >= 50, 'destruye al menos la mitad: ' + s.pct); assert.ok(s.stars >= 1); assert.ok(s.plata > 0);
});

test('un ataque flojo contra una aldea grande no la tumba', () => {
  const sim = new RaidSim({ village: enemyVillage(5, 40, rng(9)), army: [{ card: makeCard('pipiu', 8), count: 2 }], seed: 5 });
  sim.deploy(0, .6, .6); sim.deploy(0, .8, .6);
  for (let i = 0; i < 60 * 160 && sim.phase !== 'done'; i++) sim.step(1 / 60);
  assert.equal(sim.phase, 'done'); assert.ok(sim.pct() < 50);
});
