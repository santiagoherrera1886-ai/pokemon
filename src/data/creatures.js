// Especies, movimientos, tabla de tipos, objetos, encuentros y fórmulas de Alborada (contenido original).
import { TYPES, effectiveness, TYPE_ORDER, STATUS } from './types.js';
import { MOVES } from './moves.js';
export { TYPES, effectiveness, TYPE_ORDER, STATUS, MOVES };

const sp = (name, types, b, exp, learn, desc, evo, extra = {}) => ({ name, types, base: { hp: b[0], atk: b[1], def: b[2], spe: b[3] }, exp, learn, desc, evo, ...extra });
export const SPECIES = {
  brotelo: sp('Brotelo', ['planta'], [55, 66, 64, 31], 64, [[1, 'embestida'], [1, 'ceño'], [5, 'absorber'], [7, 'hojarasca'], [11, 'mordisco'], [13, 'polendormilon'], [15, 'escudo'], [20, 'latigazo'], [24, 'chupasavia'], [28, 'golpecuerpo'], [36, 'tormentafloral'], [44, 'rayoclorofila']], 'Una piedrecita cubierta de musgo. Cuando duerme, le brotan hojas nuevas.', ['brotoso', 16]),
  brotoso: sp('Brotoso', ['planta'], [72, 86, 84, 38], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'latigazo'], [24, 'chupasavia'], [28, 'golpecuerpo'], [36, 'tormentafloral'], [44, 'rayoclorofila']], 'Su caparazón de roca guarda un pequeño jardín que cuida con orgullo.', ['bosqueron', 32]),
  bosqueron: sp('Bosquerón', ['planta', 'roca'], [95, 109, 105, 56], 236, [[1, 'latigazo'], [32, 'alud'], [36, 'tormentafloral'], [40, 'terremoto'], [44, 'rayoclorofila']], 'Lleva un bosque entero en el lomo. Las aves anidan en él sin miedo.'),
  brasin: sp('Brasín', ['fuego'], [44, 58, 44, 61], 62, [[1, 'arañazo'], [1, 'ceño'], [7, 'brasa'], [11, 'mordisco'], [13, 'ruedaignea'], [15, 'refuerzo'], [20, 'llamarada'], [24, 'fuegofatuo'], [28, 'golpecuerpo'], [32, 'lanzallamas'], [36, 'erupcion'], [44, 'infierno']], 'Un topo de carbón. La llama de su lomo se aviva cuando está contento.', ['brason', 16]),
  brason: sp('Brasón', ['fuego'], [64, 78, 58, 81], 142, [[1, 'arañazo'], [15, 'refuerzo'], [20, 'llamarada'], [24, 'fuegofatuo'], [28, 'golpecuerpo'], [32, 'lanzallamas'], [36, 'erupcion'], [44, 'infierno']], 'Cava túneles que deja tibios para que otras criaturas pasen el invierno.', ['volcarbon', 32]),
  volcarbon: sp('Volcarbón', ['fuego', 'tierra'], [78, 104, 75, 102], 240, [[1, 'llamarada'], [32, 'lanzallamas'], [34, 'tierraviva'], [36, 'erupcion'], [40, 'terremoto'], [44, 'infierno']], 'Su espalda es un pequeño volcán. Cuando ruge, el suelo tiembla.'),
  charquin: sp('Charquín', ['agua'], [53, 51, 53, 40], 63, [[1, 'embestida'], [1, 'mirada'], [7, 'chorro'], [11, 'mordisco'], [13, 'copito'], [15, 'escudo'], [20, 'burbujeo'], [24, 'coletazo'], [28, 'ondamental'], [36, 'oleaje'], [44, 'torrente']], 'Vive en los charcos de la lluvia. Sus aletas laterales le ayudan a escuchar.', ['charcomar', 16]),
  charcomar: sp('Charcomar', ['agua'], [68, 70, 72, 55], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'burbujeo'], [24, 'coletazo'], [28, 'ondamental'], [32, 'rayogelido'], [36, 'oleaje'], [44, 'torrente']], 'Nada contra la corriente para fortalecer sus aletas, que ya parecen alas.', ['mareon', 32]),
  mareon: sp('Mareón', ['agua', 'psiquico'], [88, 90, 92, 72], 238, [[1, 'burbujeo'], [32, 'psicorayo'], [34, 'rayogelido'], [36, 'oleaje'], [40, 'barrera'], [44, 'torrente']], 'Dicen que puede escuchar los pensamientos de quien mira el mar.'),
  pipiu: sp('Pipiú', ['normal', 'volador'], [40, 45, 35, 56], 49, [[1, 'picotazo'], [1, 'ceño'], [5, 'aleteo'], [9, 'arrancon'], [12, 'refuerzo'], [18, 'tajoaereo'], [22, 'tornado'], [26, 'golpecuerpo'], [30, 'posarse']], 'Gorrión parlanchín. Sus alas de punta turquesa brillan al amanecer.', ['pipiolo', 14]),
  pipiolo: sp('Pipiolo', ['normal', 'volador'], [63, 64, 55, 78], 122, [[1, 'aleteo'], [9, 'arrancon'], [18, 'tajoaereo'], [22, 'tornado'], [26, 'golpecuerpo'], [30, 'posarse'], [34, 'derribo'], [40, 'clavado']], 'Vuela en bandadas en forma de flecha. Su canto anuncia la lluvia.'),
  roedin: sp('Roedín', ['normal'], [49, 50, 40, 50], 50, [[1, 'embestida'], [3, 'mirada'], [6, 'mordisco'], [9, 'arrancon'], [13, 'golpecuerpo'], [17, 'rafaga'], [22, 'derribo']], 'Guarda semillas en los cachetes para el invierno.', ['roedon', 15]),
  roedon: sp('Roedón', ['normal'], [72, 78, 62, 72], 120, [[1, 'mordisco'], [9, 'arrancon'], [13, 'golpecuerpo'], [17, 'rafaga'], [22, 'derribo'], [26, 'tarascada'], [30, 'refuerzo'], [36, 'danzaguerrera']], 'Construye diques con ramas. Sus dientes nunca dejan de crecer.'),
  capullin: sp('Capullín', ['bicho'], [45, 30, 35, 45], 39, [[1, 'embestida'], [1, 'hilo'], [5, 'picadura']], 'Oruga que teje hilos brillantes entre las hojas altas.', ['capullado', 7]),
  capullado: sp('Capullado', ['bicho'], [50, 20, 60, 30], 72, [[1, 'escudo'], [7, 'escudo']], 'Un capullo duro. Por dentro se está preparando para volar.', ['alasol', 10]),
  alasol: sp('Alasol', ['bicho', 'volador'], [60, 55, 50, 75], 160, [[1, 'aleteo'], [10, 'aleteo'], [12, 'polendormilon'], [14, 'aguijon'], [18, 'ondamental'], [24, 'tajoaereo'], [28, 'zumbido'], [34, 'tornado']], 'Sus alas dejan polvo dorado. Sólo vuela cuando sale el sol.'),
  setin: sp('Setín', ['planta', 'veneno'], [45, 55, 50, 35], 55, [[1, 'embestida'], [4, 'absorber'], [7, 'hojarasca'], [9, 'escudo'], [12, 'polendormilon'], [14, 'latigazo'], [18, 'toxina'], [22, 'chupasavia'], [26, 'tormentafloral']], 'Un hongo travieso. Esconde el sombrero cuando alguien lo mira.', ['seton', 22]),
  seton: sp('Setón', ['planta', 'veneno'], [70, 82, 72, 45], 150, [[1, 'latigazo'], [18, 'toxina'], [22, 'chupasavia'], [26, 'tormentafloral'], [30, 'golpecuerpo'], [34, 'boladelodo']], 'Sus esporas hacen que las flores del bosque crezcan el doble.'),
  chispaz: sp('Chispaz', ['electrico'], [40, 52, 40, 72], 58, [[1, 'embestida'], [1, 'ceño'], [5, 'chispa'], [9, 'corrientazo'], [12, 'refuerzo'], [16, 'arrancon'], [20, 'puñovoltio'], [24, 'rayo']], 'Una bolita de estática. Se pega al pelo de quien la acaricia.', ['voltaz', 20]),
  voltaz: sp('Voltaz', ['electrico'], [62, 78, 56, 98], 150, [[1, 'chispa'], [12, 'refuerzo'], [16, 'arrancon'], [20, 'puñovoltio'], [24, 'rayo'], [30, 'golpecuerpo'], [38, 'tronamenta']], 'Corre tan rápido que deja chispas en el aire. Se carga con las tormentas.'),
  guijarrin: sp('Guijarrín', ['roca', 'tierra'], [40, 70, 80, 20], 60, [[1, 'embestida'], [1, 'escudo'], [5, 'pedrada'], [9, 'barrazo'], [12, 'pulido'], [14, 'golpecuerpo'], [18, 'tranque'], [24, 'alud'], [30, 'terremoto']], 'Rueda cuesta abajo para viajar. Si se asusta, se queda quieto como una piedra.', ['penon', 20]),
  penon: sp('Peñón', ['roca', 'tierra'], [62, 98, 112, 32], 150, [[1, 'pedrada'], [14, 'golpecuerpo'], [18, 'tranque'], [24, 'alud'], [30, 'terremoto'], [32, 'derribo'], [38, 'filodepiedra']], 'Duerme en las paredes de las cuevas. Lo confunden con una roca.'),
  medusin: sp('Medusín', ['agua', 'veneno'], [45, 45, 45, 58], 60, [[1, 'chorro'], [1, 'mirada'], [4, 'pinchazo'], [8, 'burbujeo'], [12, 'acido'], [18, 'ondamental'], [22, 'toxina'], [30, 'oleaje']], 'Brilla de noche en el puerto. Los pescadores la siguen para encontrar peces.', ['meduson', 24]),
  meduson: sp('Medusón', ['agua', 'psiquico'], [72, 66, 72, 84], 155, [[1, 'burbujeo'], [12, 'acido'], [18, 'ondamental'], [22, 'toxina'], [28, 'psicorayo'], [30, 'oleaje'], [36, 'boladelodo']], 'Sus tentáculos dibujan figuras en el agua que hipnotizan a quien las mira.'),
  sombrin: sp('Sombrín', ['siniestro', 'fantasma'], [45, 58, 40, 62], 62, [[1, 'zarpazo'], [1, 'ceño'], [5, 'lamida'], [8, 'mordisco'], [12, 'susto'], [15, 'tinieblas'], [20, 'zancadilla'], [28, 'derribo']], 'Vive en las sombras de los rincones. El Equipo Eclipse los entrena.', ['sombrador', 20]),
  sombrador: sp('Sombrador', ['siniestro', 'fantasma'], [70, 84, 60, 88], 155, [[1, 'zarpazo'], [12, 'susto'], [15, 'tinieblas'], [20, 'zancadilla'], [24, 'bolaespectral'], [28, 'tarascada'], [34, 'planmacabro']], 'Se funde con la noche. Sus ojos son lo único que se ve.'),
  mentelin: sp('Mentelín', ['psiquico', 'bicho'], [42, 42, 48, 64], 64, [[1, 'ondamental'], [1, 'mirada'], [6, 'mareo'], [9, 'hipnosis'], [12, 'escudo'], [16, 'polendormilon'], [22, 'psicorayo'], [28, 'zumbido']], 'Una polilla que flota sin mover las alas. Sueña los sueños de los demás.'),
  espejalba: sp('Espejalba', ['agua', 'psiquico'], [100, 100, 100, 92], 300, [[1, 'oleaje'], [1, 'psicorayo'], [1, 'barrera'], [1, 'tajoaereo']], 'La guardiana del Lago Espejo. Su reflejo muestra el cielo de otro mundo.', null, { legendary: true })
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
