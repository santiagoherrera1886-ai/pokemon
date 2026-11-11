// Zonas nuevas de Puchamon: el mapa crece hacia el oeste, el sur y el centro de Alborada.
//   Oeste (selva):   Ciudad Corola → Ruta 12 → Pueblo Guadua → Ruta 13 → Lago Espejo (cierra una vuelta).
//   Sur (costa):     Villa Arenal → Ruta 14 → Puerto Caracol.
//   Centro (seco):   Pueblo Cobre → Ruta 15 (Desierto Tatacoa) → Cerro Fragua (volcán).
// Son zonas opcionales: no tienen gimnasio, pero sí entrenadores, criaturas, pueblos con posada y tienda,
// y cada una usa su propio bioma (selva, desierto, volcán) en el modo 3D.
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen, casaGen } from './maps2.js';
import { hasBadge } from '../data/gyms.js';

const T = (name, look, party, money, intro, defeat, after) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat) });
const POSADA = { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false };
const TIENDA = { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false };

// ---------------------------------------------------------------- RUTA 12 (selva: Corola → Guadua)
function ruta12() {
  const b = new MapBuilder('ruta12', 30, 16).meta({ name: 'Ruta 12', outdoor: true, biome: 'jungle', origin: [0, -78], encounters: 'ruta12', battleBg: 'grass' });
  b.border('T').rect(0, 8, 30, 2, 'p');
  b.rect(4, 3, 6, 4, 'g').rect(22, 3, 5, 4, 'g').rect(14, 11, 7, 3, 'g').rect(12, 3, 4, 3, 'w').rect(17, 4, 3, 2, 'F').rect(4, 11, 4, 2, 'F');
  for (const [x, y] of [[10, 5], [20, 6], [9, 12], [25, 12], [11, 2], [16, 6]]) b.set(x, y, 'J');
  for (const [x, y] of [[3, 7], [27, 10], [22, 12]]) b.set(x, y, 'B');
  b.obj({ kind: 'sign', x: 27, y: 7, text: ['RUTA 12 · SELVA DE GUADUA', 'Oeste: Pueblo Guadua · Este: Ciudad Corola'] });
  b.npc({ id: 'r12bicho', look: 'bugkid', x: 8, y: 7, dir: 0, sight: 2, trainer: T('Cazabichos Emilio', 'bugkid', [['alasol', 12], ['setin', 12]], 500, ['¡En la selva hay bichos del tamaño de mi cabeza!'], ['¡Se volaron todos!'], ['En Pueblo Guadua todo se hace con guadua: casas, puentes y hasta flautas.']) });
  b.npc({ id: 'r12chica', look: 'lass', x: 18, y: 10, dir: 1, sight: 2, trainer: T('Exploradora Juana', 'lass', [['verdilago', 13], ['michin', 13]], 560, ['¡Me perdí, pero no pienso perder contigo!'], ['Perdida y derrotada. Qué día.'], ['Dicen que el sendero del sur baja hasta el Lago Espejo.']) });
  b.npc({ id: 'r12viejo', look: 'old', x: 23, y: 11, dir: 0, wander: 1, talk: ['Esta selva es más vieja que cualquier ciudad de Alborada.', 'Si oyes un silbido entre las guaduas, es el viento... casi siempre.'] });
  return b.build();
}

// ---------------------------------------------------------------- PUEBLO GUADUA
function guadua() {
  const b = new MapBuilder('guadua', 30, 28).meta({ name: 'Pueblo Guadua', outdoor: true, biome: 'jungle', origin: [-30, -84], battleBg: 'grass' });
  b.border('T').rect(2, 14, 28, 2, 'p').rect(17, 16, 2, 12, 'p');
  b.rect(7, 12, 1, 2, 'p').rect(14, 12, 1, 2, 'p').rect(24, 12, 1, 2, 'p').rect(7, 21, 1, 1, 'p').rect(7, 22, 10, 1, 'p');
  b.rect(21, 19, 5, 4, 'w').rect(3, 3, 24, 1, 'B').rect(3, 5, 8, 1, 'B').rect(19, 5, 8, 1, 'B').rect(11, 18, 4, 2, 'F').rect(21, 24, 4, 2, 'F');
  for (const [x, y] of [[20, 18], [26, 18], [26, 23], [3, 25], [12, 25], [28 - 2, 8]]) b.set(x, y, 'J');
  b.building('house', 4, 8, 6, 4, POSADA, 'posadaGuadua', 6, 7)
    .building('house', 12, 8, 5, 4, TIENDA, 'tiendaGuadua', 5, 6)
    .building('house', 22, 9, 5, 3, { roof: '#7a9a3a', doorCol: 2 }, 'casaGuadua', 4, 5)
    .building('house', 5, 18, 5, 3, { roof: '#b8843a', doorCol: 2 }, 'casaGuadua2', 4, 5);
  for (const [x, y] of [[16, 13], [19, 17], [10, 16]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 19, y: 13, text: ['PUEBLO GUADUA', 'Donde la selva y la gente viven juntas.'] });
  b.obj({ kind: 'sign', x: 19, y: 25, text: ['RUTA 13 ↓ LAGO ESPEJO', 'Sendero de selva. Lleva repelente.'] });
  b.npc({ id: 'guaduaArtesana', look: 'girl', x: 12, y: 16, dir: 0, wander: 2, talk: ['Hago canastos de guadua desde chiquita.', 'La guadua crece tan rápido que casi la oyes crecer.'] });
  b.npc({ id: 'guaduaPescador', look: 'man', x: 20, y: 21, dir: 3, talk: ['En este estanque viven criaturas de agua muy tranquilas.', 'Yo no las pesco. Sólo vengo a mirarlas.'] });
  b.npc({ id: 'guaduaNino', look: 'kid', x: 23, y: 16, dir: 0, wander: 2, talk: ['¡Mi papá dice que por el sendero del sur se llega al Lago Espejo!', '¡Y que allá duerme una guardiana!'] });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 13 (selva: Guadua → Lago Espejo)
function ruta13() {
  const b = new MapBuilder('ruta13', 16, 36).meta({ name: 'Ruta 13', outdoor: true, biome: 'jungle', origin: [-22, -56], encounters: 'ruta13', battleBg: 'grass' });
  b.border('T').rect(9, 0, 2, 13, 'p').rect(4, 12, 7, 2, 'p').rect(4, 12, 2, 12, 'p').rect(4, 22, 7, 2, 'p').rect(9, 22, 2, 14, 'p');
  b.rect(3, 3, 5, 5, 'g').rect(11, 5, 3, 5, 'g').rect(7, 15, 6, 5, 'g').rect(3, 26, 5, 5, 'g').rect(11, 27, 3, 5, 'g').rect(11, 14, 3, 3, 'w').rect(12, 21, 2, 2, 'F');
  for (const [x, y] of [[3, 9], [12, 11], [7, 21], [2, 32], [13, 25], [6, 33]]) b.set(x, y, 'J');
  b.obj({ kind: 'sign', x: 11, y: 33, text: ['RUTA 13', 'Sur: Lago Espejo · Norte: Pueblo Guadua'] });
  b.npc({ id: 'r13monta', look: 'hiker', x: 7, y: 11, dir: 0, sight: 1, trainer: T('Montañero Rubén', 'hiker', [['guijarrin', 13], ['lanin', 14]], 600, ['¡Abrí este sendero a machete! ¡Aquí mando yo!'], ['El sendero es tuyo.'], ['Con la Medalla Hoja ya puedes subir desde el lago.']) });
  b.npc({ id: 'r13chica', look: 'girl', x: 8, y: 24, dir: 1, sight: 1, trainer: T('Botánica Elena', 'girl', [['setin', 14], ['verdilago', 14], ['capullado', 13]], 640, ['¡No pises mis orquídeas!'], ['Bueno... pisaste a mis criaturas.'], ['La selva guarda plantas que no existen en ningún otro lado.']) });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 14 (costa sur: Arenal → Puerto Caracol)
function ruta14() {
  const b = new MapBuilder('ruta14', 18, 22).meta({ name: 'Ruta 14', outdoor: true, origin: [36, 2], encounters: 'ruta14', battleBg: 'beach' });
  b.border('T').rect(8, 0, 2, 22, 'p');
  b.rect(11, 4, 5, 14, 's').rect(13, 6, 3, 10, 'w').rect(3, 4, 4, 5, 'g').rect(3, 13, 4, 5, 'g').rect(4, 10, 3, 2, 'F');
  for (const [x, y] of [[11, 4], [12, 17], [11, 11], [6, 19], [2, 10]]) b.set(x, y, 'J');
  b.obj({ kind: 'sign', x: 10, y: 2, text: ['RUTA 14 · CAMINO DEL MAR', 'Sur: Puerto Caracol · Norte: Villa Arenal'] });
  b.npc({ id: 'r14nino', look: 'kid', x: 7, y: 8, dir: 3, sight: 1, trainer: T('Niño Samuel', 'kid', [['pipiu', 6], ['roedin', 6]], 240, ['¡Voy para la playa y nadie me para!'], ['Bueno, tú sí me paraste.'], ['En Puerto Caracol venden el mejor pescado frito.']) });
  b.npc({ id: 'r14nadadora', look: 'swimmer', x: 11, y: 14, dir: 2, sight: 1, trainer: T('Nadadora Lucía', 'swimmer', [['medusin', 7], ['nivalin', 7]], 300, ['¡El agua está deliciosa! ¡Y mis criaturas también!'], ['¡Me hundiste!'], ['Las criaturas de Agua le ganan al Fuego y a la Roca.']) });
  return b.build();
}

// ---------------------------------------------------------------- PUERTO CARACOL
function caracol() {
  const b = new MapBuilder('caracol', 30, 24).meta({ name: 'Puerto Caracol', outdoor: true, origin: [30, 24], battleBg: 'beach' });
  b.border('T').rect(2, 17, 26, 3, 's').rect(0, 20, 30, 4, 'w').rect(14, 0, 2, 10, 'p').rect(2, 10, 26, 2, 'p');
  b.rect(7, 8, 1, 2, 'p').rect(22, 8, 1, 2, 'p').rect(18, 12, 1, 4, 'p').rect(18, 15, 5, 1, 'p').rect(14, 12, 2, 5, 'p');
  b.rect(3, 13, 5, 2, 'F').rect(24, 3, 3, 2, 'F').rect(10, 3, 3, 3, 'g');
  for (const [x, y] of [[3, 17], [9, 18], [25, 17], [27, 18], [11, 13], [26, 13], [2, 8]]) b.set(x, y, 'J');
  b.building('house', 4, 4, 6, 4, POSADA, 'posadaCaracol', 6, 7)
    .building('house', 20, 4, 5, 4, TIENDA, 'tiendaCaracol', 5, 6)
    .building('house', 20, 12, 5, 3, { roof: '#3aa6a0', doorCol: 2 }, 'casaCaracol', 4, 5);
  b.obj({ kind: 'boat', x: 5, y: 20, w: 3, h: 1, text: ['Una lancha de pescadores. Tiene pintado un caracol en la proa.'] });
  b.obj({ kind: 'boat', x: 20, y: 21, w: 3, h: 1, text: ['Un bote amarrado. Las olas lo mecen despacio.'] });
  for (const [x, y] of [[13, 9], [16, 13], [9, 12]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 16, y: 9, text: ['PUERTO CARACOL', 'El mar empieza aquí.'] });
  b.npc({ id: 'caracolPescador', look: 'sailor', x: 12, y: 18, dir: 0, wander: 2, talk: ['Salgo a pescar antes de que salga el sol.', 'Mar adentro he visto criaturas enormes saltando sobre las olas.'] });
  b.npc({ id: 'caracolNina', look: 'girl', x: 6, y: 16, dir: 0, wander: 2, talk: ['¡Estoy buscando caracoles para hacer un collar!', 'Los más bonitos aparecen después de la lluvia.'] });
  b.npc({ id: 'caracolRegalo', look: 'old', x: 24, y: 18, dir: 2, talk: 'regalo', arg: { flag: 'regaloCaracol', item: 'perlaDeRio', n: 1, who: 'Viejo marinero', lines: ['Llevo sesenta años en este puerto y casi nadie viene a saludar.', 'Tenga, mijo: esto me lo dejó el mar una madrugada.'], after: ['El mar da y el mar quita. Vuelva cuando quiera.'] } });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 15 (Desierto Tatacoa: Cobre → Cerro Fragua)
function ruta15() {
  const b = new MapBuilder('ruta15', 34, 18).meta({ name: 'Ruta 15 · Desierto Tatacoa', outdoor: true, biome: 'desert', origin: [126, -76], encounters: 'ruta15', battleBg: 'mountain' });
  b.border('K').rect(0, 8, 18, 2, 'p').rect(16, 0, 2, 9, 'p').rect(18, 8, 8, 2, 'p');
  b.rect(4, 3, 6, 3, 'g').rect(6, 12, 7, 3, 'g').rect(21, 3, 6, 4, 'g').rect(24, 11, 5, 3, 'w').rect(20, 12, 3, 2, 'g');
  for (const [x, y] of [[23, 10], [29, 10], [30, 13], [23, 14], [27, 14]]) b.set(x, y, 'J');
  for (const [x, y] of [[3, 7], [12, 4], [14, 13], [19, 6], [29, 5], [10, 11], [30, 8]]) b.set(x, y, 'O');
  for (const [x, y] of [[8, 7], [13, 10], [20, 10], [28, 7]]) b.set(x, y, 'K');
  b.obj({ kind: 'sign', x: 3, y: 10, text: ['RUTA 15 · DESIERTO TATACOA', 'Oeste: Pueblo Cobre · Norte: Cerro Fragua'] });
  b.obj({ kind: 'sign', x: 22, y: 7, text: ['OASIS', 'Agua fresca. No la desperdicie.'] });
  b.npc({ id: 'r15monta', look: 'hiker', x: 10, y: 10, dir: 1, sight: 1, trainer: T('Buscador Fabio', 'hiker', [['guijarrin', 15], ['ferlum', 16]], 700, ['¡Busco fósiles! ¡Y hoy encontré un rival!'], ['Me fosilizaste.'], ['Hace millones de años esto era el fondo del mar.']) });
  b.npc({ id: 'r15nomada', look: 'man', x: 19, y: 5, dir: 2, sight: 2, trainer: T('Nómada Tulio', 'man', [['sierpin', 16], ['magmol', 16]], 740, ['En el desierto sólo aguanta el que sabe.'], ['Tú sabes más.'], ['El Cerro Fragua echa humo desde que mi abuelo era niño.']) });
  b.npc({ id: 'r15astro', look: 'aide', x: 26, y: 9, dir: 0, wander: 1, talk: ['De noche, aquí se ven más estrellas que en cualquier parte de Alborada.', 'Vengo cada semana con mi telescopio.'] });
  return b.build();
}

// ---------------------------------------------------------------- CERRO FRAGUA (volcán)
function volcan() {
  const b = new MapBuilder('volcan', 26, 30).meta({ name: 'Cerro Fragua', outdoor: true, biome: 'volcano', origin: [130, -106], encounters: 'volcan', battleBg: 'cave' });
  b.border('K').rect(12, 20, 2, 10, 'p').rect(5, 20, 9, 2, 'p').rect(5, 10, 2, 12, 'p').rect(5, 10, 16, 2, 'p').rect(19, 4, 2, 8, 'p').rect(15, 3, 8, 3, 'p');
  b.rect(9, 14, 6, 4, 'w').rect(16, 23, 6, 4, 'w').rect(3, 4, 5, 4, 'w').rect(15, 14, 7, 4, 'g').rect(3, 23, 6, 4, 'g').rect(10, 4, 6, 4, 'g');
  for (const [x, y] of [[8, 9], [22, 9], [10, 22], [15, 20], [3, 13], [22, 20], [9, 26]]) b.set(x, y, 'O');
  for (const [x, y] of [[8, 13], [15, 12], [4, 19], [14, 27]]) b.set(x, y, 'K');
  b.obj({ kind: 'sign', x: 14, y: 27, text: ['CERRO FRAGUA', 'Volcán activo. Suba bajo su propio riesgo.'] });
  b.obj({ kind: 'statue', x: 22, y: 3, text: ['Un altar de piedra negra, tibio al tacto.', '"Al fuego que duerme bajo la montaña."'] });
  b.npc({ id: 'volcanFogonero', look: 'man', x: 7, y: 16, dir: 2, sight: 1, trainer: T('Fogonero Dimas', 'man', [['magmol', 18], ['fatuin', 18]], 860, ['¡Aquí arriba hasta las piedras queman!'], ['Me apagaste.'], ['Las criaturas de Fuego nacen cerca de la lava.']) });
  b.npc({ id: 'volcanMonta', look: 'hiker', x: 13, y: 9, dir: 0, sight: 1, trainer: T('Vulcanóloga Marta', 'hiker', [['guijarrin', 19], ['magmol', 19], ['ferlum', 19]], 900, ['¡Cuidado con las muestras! Bueno... mejor combatamos.'], ['Dato anotado: eres fuerte.'], ['En la cima hay un altar más viejo que el propio volcán.']) });
  b.npc({ id: 'volcanRegalo', look: 'old', x: 17, y: 3, dir: 0, talk: 'regalo', arg: { flag: 'regaloVolcan', item: 'brasaEterna', n: 1, who: 'Ermitaño', lines: ['Pocos suben hasta acá. Tienes piernas y tienes corazón.', 'Esta brasa lleva encendida más años que yo. Cuídala.'], after: ['La montaña respira. Escúchala.'] } });
  return b.build();
}

// Abre las salidas nuevas en los mapas que ya existían (Corola, Lago, Arenal y Cobre).
function carve(def, x, y, w, h, ch) {
  def.tiles = def.tiles.map((row, j) => j >= y && j < y + h ? row.slice(0, x) + ch.repeat(w) + row.slice(x + w) : row);
}
export function connectNewZones(maps) {
  carve(maps.corola, 0, 10, 10, 2, 'p');      // oeste de Corola → Ruta 12
  carve(maps.lago, 17, 0, 2, 3, 'p');         // norte del Lago Espejo → Ruta 13
  carve(maps.arenal, 12, 21, 2, 3, 'p');      // sur de Villa Arenal → Ruta 14
  carve(maps.cobre, 24, 12, 2, 2, 'p');       // este de Pueblo Cobre → Ruta 15
  // La selva tiene criaturas fuertes para quien apenas empieza: desde el lago sólo se sube con la Medalla Hoja.
  maps.lago.triggers.push({ x: 17, y: 1, w: 2, h: 1, when: st => st.dir === 1 && !hasBadge(st, 'hoja'), script: 'bloqueoSelva' });
  maps.lago.objects.push({ kind: 'sign', x: 16, y: 2, solid: true, text: ['RUTA 13 ↑ PUEBLO GUADUA', 'Sendero de selva. Sólo para entrenadores con la Medalla Hoja.'] });
}

export function buildNewZones() {
  return [
    ruta12(), guadua(), ruta13(), ruta14(), caracol(), ruta15(), volcan(),
    posadaGen('posadaGuadua', 'Posada de Guadua', ['guadua', 7, 12]), tiendaGen('tiendaGuadua', 'Tienda de Guadua', ['guadua', 14, 12], 'guadua'),
    posadaGen('posadaCaracol', 'Posada de Caracol', ['caracol', 7, 8]), tiendaGen('tiendaCaracol', 'Tienda de Caracol', ['caracol', 22, 8], 'caracol'),
    casaGen('casaGuadua', 'Casa del lutier', 'old', ['Hago flautas y marimbas de guadua.', 'Cada caña suena distinto. Hay que escucharla antes de cortarla.'], ['guadua', 24, 12], '#e4ecc8'),
    casaGen('casaGuadua2', 'Casa de la guía', 'lass', ['Llevo viajeros por la selva desde hace años.', 'Regla número uno: nunca te salgas del camino de noche.'], ['guadua', 7, 21], '#eadfbe'),
    casaGen('casaCaracol', 'Casa del pescador', 'sailor', ['¡Pase, pase! Aquí siempre hay sancocho de pescado.', 'El mar de Caracol es bravo, pero generoso.'], ['caracol', 22, 15], '#dff0f0')
  ];
}
