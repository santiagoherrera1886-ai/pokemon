// Especies, movimientos, tabla de tipos, objetos, encuentros y fórmulas de Alborada (contenido original).
export const TYPES = {
  normal: { name: 'NORMAL', color: '#a8a090' },
  planta: { name: 'PLANTA', color: '#5cb04c' },
  fuego: { name: 'FUEGO', color: '#f0802a' },
  agua: { name: 'AGUA', color: '#3e98dc' },
  volador: { name: 'VOLADOR', color: '#8aa8e8' },
  bicho: { name: 'BICHO', color: '#9ab830' },
  roca: { name: 'ROCA', color: '#b8a058' },
  electrico: { name: 'ELÉCTRICO', color: '#f0c820' },
  psiquico: { name: 'PSÍQUICO', color: '#e85a9a' },
  siniestro: { name: 'SINIESTRO', color: '#6a5a7a' }
};

// Multiplicadores atacante -> defensor
const CHART = {
  normal: { roca: 0.5 },
  planta: { agua: 2, roca: 2, fuego: 0.5, planta: 0.5, volador: 0.5, bicho: 0.5 },
  fuego: { planta: 2, bicho: 2, agua: 0.5, fuego: 0.5, roca: 0.5 },
  agua: { fuego: 2, roca: 2, agua: 0.5, planta: 0.5 },
  volador: { planta: 2, bicho: 2, roca: 0.5, electrico: 0.5 },
  bicho: { planta: 2, psiquico: 2, siniestro: 2, fuego: 0.5, volador: 0.5 },
  roca: { fuego: 2, volador: 2, bicho: 2 },
  electrico: { agua: 2, volador: 2, planta: 0.5, electrico: 0.5, roca: 0.5 },
  psiquico: { psiquico: 0.5, siniestro: 0 },
  siniestro: { psiquico: 2, siniestro: 0.5 }
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType]?.[t] ?? 1), 1);
}

const fx = (stat, stages, target) => ({ stat, stages, target });
export const MOVES = {
  embestida: { name: 'Embestida', type: 'normal', power: 40, acc: 100, pp: 35 },
  forcejeo: { name: 'Forcejeo', type: 'normal', power: 50, acc: 100, pp: 1 },
  arañazo: { name: 'Arañazo', type: 'normal', power: 40, acc: 100, pp: 35 },
  golpecuerpo: { name: 'Golpe Cuerpo', type: 'normal', power: 70, acc: 100, pp: 15 },
  derribo: { name: 'Derribo', type: 'normal', power: 85, acc: 90, pp: 10 },
  mordisco: { name: 'Mordisco', type: 'normal', power: 50, acc: 95, pp: 25 },
  ceño: { name: 'Ceño', type: 'normal', power: 0, acc: 100, pp: 40, effect: fx('atk', -1, 'foe') },
  mirada: { name: 'Mirada', type: 'normal', power: 0, acc: 100, pp: 30, effect: fx('def', -1, 'foe') },
  refuerzo: { name: 'Refuerzo', type: 'normal', power: 0, acc: 100, pp: 20, effect: fx('atk', 1, 'self') },
  escudo: { name: 'Escudo', type: 'normal', power: 0, acc: 100, pp: 20, effect: fx('def', 1, 'self') },
  hojarasca: { name: 'Hojarasca', type: 'planta', power: 45, acc: 100, pp: 25 },
  latigazo: { name: 'Latigazo', type: 'planta', power: 65, acc: 100, pp: 20 },
  tormentafloral: { name: 'Tormenta Floral', type: 'planta', power: 95, acc: 95, pp: 10 },
  brasa: { name: 'Brasa', type: 'fuego', power: 45, acc: 100, pp: 25 },
  llamarada: { name: 'Llamarada', type: 'fuego', power: 65, acc: 100, pp: 20 },
  erupcion: { name: 'Erupción', type: 'fuego', power: 95, acc: 95, pp: 10 },
  chorro: { name: 'Chorro', type: 'agua', power: 45, acc: 100, pp: 25 },
  burbujeo: { name: 'Burbujeo', type: 'agua', power: 65, acc: 100, pp: 20 },
  oleaje: { name: 'Oleaje', type: 'agua', power: 95, acc: 95, pp: 10 },
  picotazo: { name: 'Picotazo', type: 'volador', power: 35, acc: 100, pp: 35 },
  aleteo: { name: 'Aleteo', type: 'volador', power: 40, acc: 100, pp: 30 },
  tajoaereo: { name: 'Tajo Aéreo', type: 'volador', power: 70, acc: 95, pp: 15 },
  hilo: { name: 'Hilo Seda', type: 'bicho', power: 0, acc: 95, pp: 40, effect: fx('spe', -1, 'foe') },
  picadura: { name: 'Picadura', type: 'bicho', power: 40, acc: 100, pp: 25 },
  aguijon: { name: 'Aguijón', type: 'bicho', power: 60, acc: 100, pp: 20 },
  pedrada: { name: 'Pedrada', type: 'roca', power: 45, acc: 95, pp: 20 },
  alud: { name: 'Alud', type: 'roca', power: 80, acc: 90, pp: 10 },
  chispa: { name: 'Chispa', type: 'electrico', power: 45, acc: 100, pp: 25 },
  rayo: { name: 'Rayo', type: 'electrico', power: 85, acc: 95, pp: 15 },
  ondamental: { name: 'Onda Mental', type: 'psiquico', power: 55, acc: 100, pp: 20 },
  psicorayo: { name: 'Psicorrayo', type: 'psiquico', power: 85, acc: 95, pp: 10 },
  zarpazo: { name: 'Zarpazo', type: 'siniestro', power: 45, acc: 100, pp: 25 },
  tinieblas: { name: 'Tinieblas', type: 'siniestro', power: 75, acc: 95, pp: 15 }
};

const sp = (name, types, b, exp, learn, desc, evo, extra = {}) => ({ name, types, base: { hp: b[0], atk: b[1], def: b[2], spe: b[3] }, exp, learn, desc, evo, ...extra });
export const SPECIES = {
  brotelo: sp('Brotelo', ['planta'], [55, 66, 64, 31], 64, [[1, 'embestida'], [1, 'ceño'], [7, 'hojarasca'], [11, 'mordisco'], [15, 'escudo'], [20, 'latigazo'], [28, 'golpecuerpo'], [36, 'tormentafloral']], 'Una piedrecita cubierta de musgo. Cuando duerme, le brotan hojas nuevas.', ['brotoso', 16]),
  brotoso: sp('Brotoso', ['planta'], [72, 86, 84, 38], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'latigazo'], [28, 'golpecuerpo'], [36, 'tormentafloral']], 'Su caparazón de roca guarda un pequeño jardín que cuida con orgullo.', ['bosqueron', 32]),
  bosqueron: sp('Bosquerón', ['planta', 'roca'], [95, 109, 105, 56], 236, [[1, 'latigazo'], [32, 'alud'], [36, 'tormentafloral']], 'Lleva un bosque entero en el lomo. Las aves anidan en él sin miedo.'),
  brasin: sp('Brasín', ['fuego'], [44, 58, 44, 61], 62, [[1, 'arañazo'], [1, 'ceño'], [7, 'brasa'], [11, 'mordisco'], [15, 'refuerzo'], [20, 'llamarada'], [28, 'golpecuerpo'], [36, 'erupcion']], 'Un topo de carbón. La llama de su lomo se aviva cuando está contento.', ['brason', 16]),
  brason: sp('Brasón', ['fuego'], [64, 78, 58, 81], 142, [[1, 'arañazo'], [15, 'refuerzo'], [20, 'llamarada'], [28, 'golpecuerpo'], [36, 'erupcion']], 'Cava túneles que deja tibios para que otras criaturas pasen el invierno.', ['volcarbon', 32]),
  volcarbon: sp('Volcarbón', ['fuego', 'roca'], [78, 104, 75, 102], 240, [[1, 'llamarada'], [32, 'alud'], [36, 'erupcion']], 'Su espalda es un pequeño volcán. Cuando ruge, el suelo tiembla.'),
  charquin: sp('Charquín', ['agua'], [53, 51, 53, 40], 63, [[1, 'embestida'], [1, 'mirada'], [7, 'chorro'], [11, 'mordisco'], [15, 'escudo'], [20, 'burbujeo'], [28, 'ondamental'], [36, 'oleaje']], 'Vive en los charcos de la lluvia. Sus aletas laterales le ayudan a escuchar.', ['charcomar', 16]),
  charcomar: sp('Charcomar', ['agua'], [68, 70, 72, 55], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'burbujeo'], [28, 'ondamental'], [36, 'oleaje']], 'Nada contra la corriente para fortalecer sus aletas, que ya parecen alas.', ['mareon', 32]),
  mareon: sp('Mareón', ['agua', 'psiquico'], [88, 90, 92, 72], 238, [[1, 'burbujeo'], [32, 'psicorayo'], [36, 'oleaje']], 'Dicen que puede escuchar los pensamientos de quien mira el mar.'),
  pipiu: sp('Pipiú', ['normal', 'volador'], [40, 45, 35, 56], 49, [[1, 'picotazo'], [1, 'ceño'], [5, 'aleteo'], [12, 'refuerzo'], [18, 'tajoaereo'], [26, 'golpecuerpo']], 'Gorrión parlanchín. Sus alas de punta turquesa brillan al amanecer.', ['pipiolo', 14]),
  pipiolo: sp('Pipiolo', ['normal', 'volador'], [63, 64, 55, 78], 122, [[1, 'aleteo'], [18, 'tajoaereo'], [26, 'golpecuerpo'], [34, 'derribo']], 'Vuela en bandadas en forma de flecha. Su canto anuncia la lluvia.'),
  roedin: sp('Roedín', ['normal'], [49, 50, 40, 50], 50, [[1, 'embestida'], [3, 'mirada'], [6, 'mordisco'], [13, 'golpecuerpo'], [22, 'derribo']], 'Guarda semillas en los cachetes para el invierno.', ['roedon', 15]),
  roedon: sp('Roedón', ['normal'], [72, 78, 62, 72], 120, [[1, 'mordisco'], [13, 'golpecuerpo'], [22, 'derribo'], [30, 'refuerzo']], 'Construye diques con ramas. Sus dientes nunca dejan de crecer.'),
  capullin: sp('Capullín', ['bicho'], [45, 30, 35, 45], 39, [[1, 'embestida'], [1, 'hilo'], [5, 'picadura']], 'Oruga que teje hilos brillantes entre las hojas altas.', ['capullado', 7]),
  capullado: sp('Capullado', ['bicho'], [50, 20, 60, 30], 72, [[1, 'escudo'], [7, 'escudo']], 'Un capullo duro. Por dentro se está preparando para volar.', ['alasol', 10]),
  alasol: sp('Alasol', ['bicho', 'volador'], [60, 55, 50, 75], 160, [[1, 'aleteo'], [10, 'aleteo'], [14, 'aguijon'], [18, 'ondamental'], [24, 'tajoaereo']], 'Sus alas dejan polvo dorado. Sólo vuela cuando sale el sol.'),
  setin: sp('Setín', ['planta'], [45, 55, 50, 35], 55, [[1, 'embestida'], [4, 'hojarasca'], [9, 'escudo'], [14, 'latigazo'], [26, 'tormentafloral']], 'Un hongo travieso. Esconde el sombrero cuando alguien lo mira.', ['seton', 22]),
  seton: sp('Setón', ['planta'], [70, 82, 72, 45], 150, [[1, 'latigazo'], [26, 'tormentafloral'], [30, 'golpecuerpo']], 'Sus esporas hacen que las flores del bosque crezcan el doble.'),
  chispaz: sp('Chispaz', ['electrico'], [40, 52, 40, 72], 58, [[1, 'embestida'], [1, 'ceño'], [5, 'chispa'], [12, 'refuerzo'], [24, 'rayo']], 'Una bolita de estática. Se pega al pelo de quien la acaricia.', ['voltaz', 20]),
  voltaz: sp('Voltaz', ['electrico'], [62, 78, 56, 98], 150, [[1, 'chispa'], [12, 'refuerzo'], [24, 'rayo'], [30, 'golpecuerpo']], 'Corre tan rápido que deja chispas en el aire. Se carga con las tormentas.'),
  guijarrin: sp('Guijarrín', ['roca'], [40, 70, 80, 20], 60, [[1, 'embestida'], [1, 'escudo'], [5, 'pedrada'], [14, 'golpecuerpo'], [24, 'alud']], 'Rueda cuesta abajo para viajar. Si se asusta, se queda quieto como una piedra.', ['penon', 20]),
  penon: sp('Peñón', ['roca'], [62, 98, 112, 32], 150, [[1, 'pedrada'], [14, 'golpecuerpo'], [24, 'alud'], [32, 'derribo']], 'Duerme en las paredes de las cuevas. Lo confunden con una roca.'),
  medusin: sp('Medusín', ['agua'], [45, 45, 45, 58], 60, [[1, 'chorro'], [1, 'mirada'], [8, 'burbujeo'], [18, 'ondamental'], [30, 'oleaje']], 'Brilla de noche en el puerto. Los pescadores la siguen para encontrar peces.', ['meduson', 24]),
  meduson: sp('Medusón', ['agua', 'psiquico'], [72, 66, 72, 84], 155, [[1, 'burbujeo'], [18, 'ondamental'], [28, 'psicorayo'], [30, 'oleaje']], 'Sus tentáculos dibujan figuras en el agua que hipnotizan a quien las mira.'),
  sombrin: sp('Sombrín', ['siniestro'], [45, 58, 40, 62], 62, [[1, 'zarpazo'], [1, 'ceño'], [8, 'mordisco'], [15, 'tinieblas'], [28, 'derribo']], 'Vive en las sombras de los rincones. El Equipo Eclipse los entrena.', ['sombrador', 20]),
  sombrador: sp('Sombrador', ['siniestro'], [70, 84, 60, 88], 155, [[1, 'zarpazo'], [15, 'tinieblas'], [28, 'derribo'], [34, 'refuerzo']], 'Se funde con la noche. Sus ojos son lo único que se ve.'),
  mentelin: sp('Mentelín', ['psiquico'], [42, 42, 48, 64], 64, [[1, 'ondamental'], [1, 'mirada'], [12, 'escudo'], [22, 'psicorayo']], 'Una polilla que flota sin mover las alas. Sueña los sueños de los demás.'),
  espejalba: sp('Espejalba', ['agua', 'psiquico'], [100, 100, 100, 92], 300, [[1, 'oleaje'], [1, 'psicorayo'], [1, 'escudo'], [1, 'tajoaereo']], 'La guardiana del Lago Espejo. Su reflejo muestra el cielo de otro mundo.', null, { legendary: true })
};

export const STARTERS = ['brotelo', 'brasin', 'charquin'];
export const RIVAL_PICK = { brotelo: 'brasin', brasin: 'charquin', charquin: 'brotelo' };
// Forma evolucionada del inicial del rival según el nivel.
export function rivalForm(base, level) {
  let s = base;
  while (SPECIES[s].evo && level >= SPECIES[s].evo[1]) s = SPECIES[s].evo[0];
  return s;
}

// Los objetos y las tiendas viven en items.js.

export const ENCOUNTERS = {
  sendero1: { rate: 0.12, list: [['pipiu', 2, 4, 50], ['roedin', 2, 4, 40], ['capullin', 2, 3, 10]] },
  lago: { rate: 0.12, list: [['pipiu', 2, 4, 40], ['capullin', 2, 4, 35], ['roedin', 3, 4, 25]] },
  ruta2: { rate: 0.12, list: [['pipiu', 4, 6, 30], ['roedin', 4, 6, 25], ['setin', 4, 6, 25], ['capullin', 4, 5, 20]] },
  ruta3: { rate: 0.12, list: [['chispaz', 8, 10, 35], ['roedin', 8, 10, 25], ['pipiu', 9, 11, 20], ['setin', 8, 10, 20]] },
  cueva: { rate: 0.09, list: [['guijarrin', 9, 12, 50], ['sombrin', 10, 12, 30], ['mentelin', 10, 11, 20]] },
  ruta4: { rate: 0.12, list: [['medusin', 14, 16, 30], ['chispaz', 14, 16, 25], ['pipiolo', 15, 17, 25], ['guijarrin', 14, 16, 20]] },
  ruta5: { rate: 0.12, list: [['sombrin', 22, 25, 25], ['mentelin', 22, 24, 25], ['voltaz', 23, 25, 20], ['seton', 23, 25, 15], ['penon', 23, 25, 15]] }
};

// ---------- Fórmulas ----------
// bonus: lo que han sumado las Semillas (permanente, por estadística).
export function calcStats(s, level, bonus = {}) {
  const b = SPECIES[s].base, k = bonus || {};
  return {
    hp: Math.floor(2 * b.hp * level / 100) + level + 10 + (k.hp || 0),
    atk: Math.floor(2 * b.atk * level / 100) + 5 + (k.atk || 0),
    def: Math.floor(2 * b.def * level / 100) + 5 + (k.def || 0),
    spe: Math.floor(2 * b.spe * level / 100) + 5 + (k.spe || 0)
  };
}
export const expForLevel = l => l * l * l;

// Movimientos que conocería una criatura de esa especie y nivel (los últimos 4 aprendidos, recorriendo su línea evolutiva).
function lineOf(s) {
  const line = [s];
  let changed = true;
  while (changed) { changed = false; for (const k in SPECIES) if (SPECIES[k].evo && SPECIES[k].evo[0] === line[0]) { line.unshift(k); changed = true; } }
  return line;
}
export function movesFor(s, level) {
  const seen = [];
  for (const k of lineOf(s)) for (const [l, m] of SPECIES[k].learn) if (l <= level && !seen.includes(m)) seen.push(m);
  return seen.slice(-4);
}

export function makeCreature(s, level) {
  const stats = calcStats(s, level);
  return { sp: s, name: SPECIES[s].name, level, exp: expForLevel(level), hp: stats.hp, stats, moves: movesFor(s, level).map(m => ({ id: m, pp: MOVES[m].pp })) };
}

export function refreshStats(c) {
  const old = c.stats.hp;
  c.stats = calcStats(c.sp, c.level, c.bonus);
  if (c.hp > 0) c.hp = Math.min(c.stats.hp, c.hp + (c.stats.hp - old));
}
