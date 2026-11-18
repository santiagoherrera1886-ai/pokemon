// Duelo de Torres: cartas, mazos y partidas completas máquina contra máquina.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ArenaSim, makeCard, playerDeck, rivalDeck, speciesCost, arenaOf, FIELD, MATCH_TIME, OVERTIME, rng } from '../src/games/arena/sim.js';
import { makeCreature, SPECIES } from '../src/data/creatures.js';
import { newState } from '../src/core/state.js';

test('cada especie da una carta válida con costo de 2 a 7', () => {
  for (const sp of Object.keys(SPECIES)) {
    const c = makeCard(sp, 30);
    assert.ok(c.cost >= 2 && c.cost <= 7, sp + ' costo ' + c.cost);
    for (const k of ['hp', 'dmg', 'speed', 'rate', 'range', 'r']) assert.ok(Number.isFinite(c[k]) && c[k] > 0, sp + ' ' + k);
    assert.equal(speciesCost(sp), c.cost);
  }
  assert.equal(makeCard('capullin', 10).count, 3, 'los pequeñitos salen de a tres');
  assert.ok(makeCard('bosqueron', 40).tank, 'Bosquerón (planta/roca) es tanque');
  assert.ok(makeCard('pipiu', 10).flying, 'los voladores vuelan');
  assert.ok(makeCard('brasin', 10).ranged, 'los de fuego atacan a distancia');
});

test('el mazo del jugador usa sus criaturas y completa con préstamos', () => {
  const st = newState();
  st.party = [makeCreature('mareon', 50), makeCreature('brasin', 12)]; st.box = [makeCreature('brasin', 30)];
  const deck = playerDeck(st);
  assert.equal(deck.length, 8);
  assert.equal(deck.filter(c => c.sp === 'brasin').length, 1, 'una carta por especie');
  assert.equal(deck.find(c => c.sp === 'brasin').level, 30, 'usa la más fuerte de la especie');
  assert.equal(deck.filter(c => c.loan).length, 6, 'faltan 6: prestados');
  st.arena = { deck: ['brasin'] };
  assert.equal(playerDeck(st)[0].sp, 'brasin', 'lo que escogiste va primero');
});

test('no se puede soltar en el río ni en la mitad del rival', () => {
  const sim = new ArenaSim({ decks: [rivalDeck(0, rng(1)), rivalDeck(0, rng(2))], ai: [] });
  assert.ok(sim.canPlace(0, 9, 24)); assert.ok(!sim.canPlace(0, 9, 16)); assert.ok(!sim.canPlace(0, 9, 10));
  assert.ok(sim.canPlace(1, 9, 8)); assert.ok(!sim.canPlace(1, 9, 24));
  sim.energy[0] = 10; const slot = sim.hand[0].findIndex((_, i) => sim.card(0, i).cost <= 10);
  const next = sim.queue[0][0];
  assert.ok(sim.play(0, slot, 6, 24));
  assert.equal(sim.hand[0][slot], next, 'la siguiente carta entra a la mano');
  assert.ok(sim.units.length >= 1);
});

test('una criatura cruza por el puente y le pega a la torre del rival', () => {
  const tank = makeCard('bosqueron', 60);
  const sim = new ArenaSim({ decks: [[tank, tank, tank, tank, tank], rivalDeck(0, rng(3))], ai: [] });
  sim.energy[0] = 10; assert.ok(sim.play(0, 0, 4, 26.5 - 3));
  const tower = sim.towers.find(t => t.side === 1 && t.kind === 'side' && t.x < 9);
  let crossed = false;
  for (let i = 0; i < 60 * 40 && tower.hp === tower.max; i++) { sim.step(1 / 60); const u = sim.units[0]; if (u && u.y < FIELD.riverTop) crossed = true; if (u && u.y > FIELD.riverTop && u.y < FIELD.riverBottom) assert.ok(Math.abs(u.x - 3.5) < FIELD.bridgeHalf, 'en el río sólo por el puente'); }
  assert.ok(crossed, 'cruzó el río');
  assert.ok(tower.hp < tower.max, 'le pegó a la torre');
});

test('partidas completas máquina contra máquina terminan bien', () => {
  let ends = 0, crowns = 0, wins = [0, 0, 0];
  for (let seed = 1; seed <= 12; seed++) {
    const r = rng(seed * 7);
    const sim = new ArenaSim({ decks: [rivalDeck(200 + seed * 50, r), rivalDeck(200 + seed * 50, r)], seed, skill: .6, ai: [0, 1] });
    for (let i = 0; i < 60 * (MATCH_TIME + OVERTIME + 5) && sim.phase !== 'done'; i++) {
      sim.step(1 / 60);
      for (const u of sim.units) assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y), 'posiciones válidas');
    }
    assert.equal(sim.phase, 'done', 'la partida termina');
    ends++; crowns += sim.crowns[0] + sim.crowns[1]; wins[sim.winner === -1 ? 2 : sim.winner]++;
    assert.ok(sim.played[0] > 5 && sim.played[1] > 5, 'las dos máquinas juegan cartas');
  }
  assert.equal(ends, 12);
  assert.ok(crowns >= 6, 'se tumban torres: ' + crowns);
  assert.ok(wins[0] > 0 && wins[1] > 0, 'gana a veces cada lado: ' + wins);
});

test('arenas por trofeos', () => {
  assert.equal(arenaOf(0).name, 'Pradera Brisal'); assert.equal(arenaOf(350).name, 'Cafetal'); assert.equal(arenaOf(5000).name, 'Cerro Fragua');
});

test('el rival queda parecido a tu nivel y el premio suma plata y trofeos', async () => {
  const { rivalLevel } = await import('../src/games/arena/sim.js');
  const { arenaReward } = await import('../src/games/arena/sim.js');
  assert.ok(rivalLevel(0, 40) >= 28 && rivalLevel(0, 40) <= 34, 'al empezar, un poco más bajo');
  assert.ok(rivalLevel(2500, 40) > 40, 'con muchos trofeos, más alto');
  const win = arenaReward(100, 0, 3, 1), lose = arenaReward(10, 1, 0, 2), draw = arenaReward(100, -1, 1, 1);
  assert.ok(win.trophies > 0 && win.money > 0 && win.capsules === 2);
  assert.equal(lose.trophies, -10, 'no se baja de cero trofeos'); assert.ok(lose.money > 0);
  assert.equal(draw.trophies, 0);
});
