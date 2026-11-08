// Especies, movimientos, tabla de tipos y objetos de Alborada (contenido original).
export const TYPES = {
  normal: { name: 'NORMAL', color: '#a8a090' },
  planta: { name: 'PLANTA', color: '#5cb04c' },
  fuego: { name: 'FUEGO', color: '#f0802a' },
  agua: { name: 'AGUA', color: '#3e98dc' },
  volador: { name: 'VOLADOR', color: '#8aa8e8' },
  bicho: { name: 'BICHO', color: '#9ab830' }
};

// Multiplicadores atacante -> defensor
const CHART = {
  planta: { agua: 2, fuego: 0.5, planta: 0.5, volador: 0.5, bicho: 0.5 },
  fuego: { planta: 2, bicho: 2, agua: 0.5, fuego: 0.5 },
  agua: { fuego: 2, agua: 0.5, planta: 0.5 },
  volador: { planta: 2, bicho: 2 },
  bicho: { planta: 2, fuego: 0.5, volador: 0.5 },
  normal: {}
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType]?.[t] ?? 1), 1);
}

export const MOVES = {
  embestida: { name: 'Embestida', type: 'normal', power: 40, acc: 100, pp: 35 },
  arañazo: { name: 'Arañazo', type: 'normal', power: 40, acc: 100, pp: 35 },
  ceño: { name: 'Ceño', type: 'normal', power: 0, acc: 100, pp: 40, effect: { stat: 'atk', stages: -1, target: 'foe' } },
  mirada: { name: 'Mirada', type: 'normal', power: 0, acc: 100, pp: 30, effect: { stat: 'def', stages: -1, target: 'foe' } },
  hojarasca: { name: 'Hojarasca', type: 'planta', power: 45, acc: 100, pp: 25 },
  brasa: { name: 'Brasa', type: 'fuego', power: 45, acc: 100, pp: 25 },
  chorro: { name: 'Chorro', type: 'agua', power: 45, acc: 100, pp: 25 },
  picotazo: { name: 'Picotazo', type: 'volador', power: 35, acc: 100, pp: 35 },
  aleteo: { name: 'Aleteo', type: 'volador', power: 40, acc: 100, pp: 30 },
  mordisco: { name: 'Mordisco', type: 'normal', power: 50, acc: 95, pp: 25 },
  hilo: { name: 'Hilo Seda', type: 'bicho', power: 0, acc: 95, pp: 40, effect: { stat: 'spe', stages: -1, target: 'foe' } },
  picadura: { name: 'Picadura', type: 'bicho', power: 40, acc: 100, pp: 25 }
};

export const SPECIES = {
  brotelo: { name: 'Brotelo', types: ['planta'], base: { hp: 55, atk: 66, def: 64, spe: 31 }, exp: 64, learn: [[1, 'embestida'], [1, 'ceño'], [7, 'hojarasca'], [11, 'mordisco']], desc: 'Una piedrecita cubierta de musgo. Cuando duerme, le brotan hojas nuevas.' },
  brasin: { name: 'Brasín', types: ['fuego'], base: { hp: 44, atk: 58, def: 44, spe: 61 }, exp: 62, learn: [[1, 'arañazo'], [1, 'ceño'], [7, 'brasa'], [11, 'mordisco']], desc: 'Un topo de carbón. La llama de su lomo se aviva cuando está contento.' },
  charquin: { name: 'Charquín', types: ['agua'], base: { hp: 53, atk: 51, def: 53, spe: 40 }, exp: 63, learn: [[1, 'embestida'], [1, 'mirada'], [7, 'chorro'], [11, 'mordisco']], desc: 'Vive en los charcos de la lluvia. Sus aletas laterales le ayudan a escuchar.' },
  pipiu: { name: 'Pipiú', types: ['normal', 'volador'], base: { hp: 40, atk: 45, def: 35, spe: 56 }, exp: 49, learn: [[1, 'picotazo'], [1, 'ceño'], [5, 'aleteo']], desc: 'Gorrión parlanchín. Sus alas de punta turquesa brillan al amanecer.' },
  roedin: { name: 'Roedín', types: ['normal'], base: { hp: 49, atk: 50, def: 40, spe: 50 }, exp: 50, learn: [[1, 'embestida'], [3, 'mirada'], [6, 'mordisco']], desc: 'Guarda semillas en los cachetes para el invierno.' },
  capullin: { name: 'Capullín', types: ['bicho'], base: { hp: 45, atk: 30, def: 35, spe: 45 }, exp: 39, learn: [[1, 'embestida'], [1, 'hilo'], [5, 'picadura']], desc: 'Oruga que teje hilos brillantes entre las hojas altas.' }
};

export const STARTERS = ['brotelo', 'brasin', 'charquin'];
// Inicial con ventaja sobre cada elección (el rival elige este).
export const RIVAL_PICK = { brotelo: 'brasin', brasin: 'charquin', charquin: 'brotelo' };

export const ITEMS = {
  capsula: { name: 'Cápsula', price: 200, desc: 'Sirve para atrapar criaturas salvajes.', pocket: 'capsulas' },
  tonico: { name: 'Tónico', price: 300, desc: 'Restaura 20 PS de una criatura.', pocket: 'medicina', heal: 20 },
  supertonico: { name: 'Supertónico', price: 700, desc: 'Restaura 50 PS de una criatura.', pocket: 'medicina', heal: 50 },
  despertar: { name: 'Revivir', price: 1500, desc: 'Reanima a una criatura debilitada con la mitad de sus PS.', pocket: 'medicina', revive: true }
};

export const SHOP_STOCK = ['capsula', 'tonico', 'supertonico', 'despertar'];

export const ENCOUNTERS = {
  sendero1: { rate: 0.12, list: [['pipiu', 2, 4, 50], ['roedin', 2, 4, 40], ['capullin', 2, 3, 10]] },
  lago: { rate: 0.12, list: [['pipiu', 2, 4, 40], ['capullin', 2, 4, 35], ['roedin', 3, 4, 25]] }
};

// ---------- Fórmulas ----------
export function calcStats(sp, level) {
  const b = SPECIES[sp].base;
  return {
    hp: Math.floor(2 * b.hp * level / 100) + level + 10,
    atk: Math.floor(2 * b.atk * level / 100) + 5,
    def: Math.floor(2 * b.def * level / 100) + 5,
    spe: Math.floor(2 * b.spe * level / 100) + 5
  };
}
export const expForLevel = l => l * l * l;

export function makeCreature(sp, level) {
  const s = SPECIES[sp];
  const moves = s.learn.filter(([l]) => l <= level).slice(-4).map(([, m]) => ({ id: m, pp: MOVES[m].pp }));
  const stats = calcStats(sp, level);
  return { sp, name: s.name, level, exp: expForLevel(level), hp: stats.hp, stats, moves };
}

export function refreshStats(c) {
  const old = c.stats.hp;
  c.stats = calcStats(c.sp, c.level);
  c.hp = Math.min(c.stats.hp, c.hp + (c.stats.hp - old));
}
