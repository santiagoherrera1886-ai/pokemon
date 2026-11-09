import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, POCKETS, POCKET_ORDER, SPECIAL, VENDING, generalStock, nextUnlock, sellPrice, useOnCreature, canUseOn, catchBonus, repelled, pocketItems, SEED_MAX } from '../src/data/items.js';
import { makeCreature, MOVES } from '../src/data/creatures.js';
import { buildMaps } from '../src/world/maps.js';

test('every item is complete and every shop sells real items', () => {
  for (const [id, it] of Object.entries(ITEMS)) {
    assert.ok(it.name && it.desc && (it.key ? it.price === 0 : it.price > 0) && it.color && it.icon, id);
    assert.ok(POCKETS[it.pocket], `${id} pocket`);
  }
  const sold = new Set([...generalStock({ badges: ['hoja', 'roca', 'marea'] }), ...Object.values(SPECIAL).flatMap(s => s.items), ...VENDING]);
  for (const id of sold) assert.ok(ITEMS[id], id);
  assert.ok(sold.size >= 30, `al menos 30 productos a la venta (hay ${sold.size})`);
  assert.equal(sellPrice('capsula'), 100);
});

test('the general counter grows with badges', () => {
  const zero = generalStock({ badges: [] }), all = generalStock({ badges: ['hoja', 'roca', 'marea'] });
  assert.ok(zero.length >= 8 && zero.includes('capsula') && zero.includes('repelente'));
  assert.ok(!zero.includes('hipercapsula'));
  assert.ok(all.length > zero.length && all.includes('tonicoMax'));
  assert.equal(nextUnlock({ badges: [] }), 1);
  assert.equal(nextUnlock({ badges: ['hoja', 'roca', 'marea'] }), null);
});

test('every shop has a general clerk, a specialty clerk and a vending machine', () => {
  const maps = buildMaps();
  const shops = Object.keys(maps).filter(id => /^tienda/.test(id));
  assert.equal(shops.length, 9, 'una tienda en Arenal y en cada una de las ocho ciudades con gimnasio');
  for (const id of shops) {
    const m = maps[id];
    const clerk = m.npcs.find(n => n.talk === 'tienda'), vendor = m.npcs.find(n => n.talk === 'tiendaEspecial');
    assert.ok(clerk && vendor && SPECIAL[vendor.town], id);
    assert.ok(m.objects.some(o => o.name === 'vending' && o.script === 'maquina'), `${id} máquina`);
  }
});

test('medicines heal, revive and restore PP only when they do something', () => {
  const c = makeCreature('charquin', 20);
  assert.equal(canUseOn('tonico', c), false, 'con PS llenos no sirve');
  c.hp = 10;
  let r = useOnCreature('supertonico', c);
  assert.ok(r.ok); assert.equal(r.from, 10); assert.equal(c.hp, Math.min(c.stats.hp, 70));
  assert.equal(useOnCreature('despertar', c).ok, false, 'Revivir no sirve si no está debilitada');
  c.hp = 0;
  assert.equal(useOnCreature('tonico', c).ok, false, 'un Tónico no reanima');
  assert.ok(useOnCreature('despertar', c).ok); assert.equal(c.hp, Math.floor(c.stats.hp / 2));
  assert.ok(useOnCreature('tonicoMax', c).ok); assert.equal(c.hp, c.stats.hp);
  c.moves.forEach(m => { m.pp = 0; });
  assert.ok(useOnCreature('rocio', c).ok);
  assert.ok(c.moves.every(m => m.pp === Math.min(10, MOVES[m.id].pp)));
  assert.ok(useOnCreature('rocioPuro', c).ok);
  assert.ok(c.moves.every(m => m.pp === MOVES[m.id].pp));
  assert.equal(useOnCreature('rocioPuro', c).ok, false);
});

test('seeds raise stats permanently up to a cap and the candy levels up', () => {
  const c = makeCreature('brotelo', 10), atk = c.stats.atk, hp = c.stats.hp;
  assert.ok(useOnCreature('semillaFuerza', c).ok);
  assert.equal(c.stats.atk, atk + 3);
  assert.ok(useOnCreature('semillaVital', c).ok);
  assert.equal(c.stats.hp, hp + 3); assert.equal(c.hp, hp + 3, 'los PS actuales suben con los máximos');
  for (let i = 0; i < 10; i++) useOnCreature('semillaFuerza', c);
  assert.equal(c.bonus.atk, SEED_MAX); assert.equal(canUseOn('semillaFuerza', c), false);
  const lv = c.level, r = useOnCreature('dulce', c);
  assert.ok(r.ok && r.levelUp); assert.equal(c.level, lv + 1);
  assert.equal(c.stats.atk, makeCreature('brotelo', lv + 1).stats.atk + SEED_MAX, 'la semilla se conserva al subir de nivel');
});

test('special capsules reward the right situations', () => {
  const water = makeCreature('medusin', 10), normal = makeCreature('roedin', 10);
  assert.equal(catchBonus('capsulaVeloz', { turn: 1, foe: normal }), 4);
  assert.equal(catchBonus('capsulaVeloz', { turn: 3, foe: normal }), 1);
  assert.equal(catchBonus('capsulaMalla', { turn: 1, foe: water }), 3);
  assert.equal(catchBonus('capsulaMalla', { turn: 1, foe: normal }), 1);
  assert.equal(catchBonus('capsulaOcaso', { turn: 1, foe: normal, night: true }), 3);
  assert.equal(catchBonus('capsulaOcaso', { turn: 1, foe: normal, dark: false, night: false }), 1);
  assert.ok(catchBonus('capsulaReloj', { turn: 8, foe: normal }) > catchBonus('capsulaReloj', { turn: 2, foe: normal }));
  assert.equal(catchBonus('supercapsula', { turn: 1, foe: normal }), 1.6);
});

test('repellent keeps away only weaker wild creatures while it lasts', () => {
  const st = { party: [makeCreature('charquin', 12)], repel: 50 };
  assert.equal(repelled(st, 8), true);
  assert.equal(repelled(st, 14), false);
  st.repel = 0;
  assert.equal(repelled(st, 8), false);
  assert.deepEqual(pocketItems({ capsula: 2, tonico: 0, miel: 1 }, 'capsulas'), ['capsula']);
  assert.deepEqual(POCKET_ORDER.filter(p => pocketItems({ miel: 1 }, p).length), ['campo']);
});

test('equipable items change damage, speed and healing only while held', async () => {
  const { heldPower, heldGuard, heldSpeed, heldRegen, berryReady, berryHeal, giveHeld, takeHeld, isHeld } = await import('../src/data/held.js');
  const { makeCreature, MOVES } = await import('../src/data/creatures.js');
  const c = makeCreature('brasin', 20), fire = MOVES.lanzallamas, water = MOVES.oleaje;
  assert.equal(heldPower(c, fire), 1); assert.equal(heldSpeed(c), 1); assert.equal(heldGuard(c), 1); assert.equal(heldRegen(c), 0);
  const st = { bag: { brasaEterna: 1, cintaFuerza: 1, guayaba: 2, arepaReserva: 1 } };
  assert.ok(giveHeld(st, c, 'brasaEterna').ok);
  assert.equal(c.item, 'brasaEterna'); assert.equal(st.bag.brasaEterna, 0);
  assert.equal(heldPower(c, fire), 1.2); assert.equal(heldPower(c, water), 1);
  const r = giveHeld(st, c, 'cintaFuerza');
  assert.ok(r.ok && r.old === 'brasaEterna' && st.bag.brasaEterna === 1, 'el objeto anterior vuelve a la mochila');
  assert.equal(heldPower(c, water), 1.1); assert.equal(heldPower(c, MOVES.escudo), 1, 'los movimientos de estado no cambian');
  giveHeld(st, c, 'arepaReserva'); c.hp = c.stats.hp - 10;
  assert.equal(heldRegen(c), Math.max(1, Math.floor(c.stats.hp / 16)));
  c.hp = c.stats.hp; assert.equal(heldRegen(c), 0, 'con la vida llena no cura');
  giveHeld(st, c, 'guayaba'); c.hp = Math.floor(c.stats.hp * .6); assert.equal(berryReady(c), false);
  c.hp = Math.floor(c.stats.hp * .4); assert.equal(berryReady(c), true); assert.equal(berryHeal(c), Math.floor(c.stats.hp / 4));
  assert.ok(takeHeld(st, c).ok); assert.equal(c.item, undefined); assert.equal(st.bag.guayaba, 2);
  assert.equal(giveHeld(st, c, 'capsula').ok, false, 'lo que no es equipable no se equipa');
  assert.ok(isHeld('panueloVeloz') && !isHeld('pocion'));
  for (const [id, it] of Object.entries(ITEMS)) if (it.held) assert.equal(it.pocket, 'equipo', id);
});
