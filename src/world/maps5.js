// Segunda tanda de zonas nuevas de Puchamon: el mapa crece por las cuatro puntas.
//   Este:      Ciudad Voltio → Ruta 16 → Cabo Faro (pueblo con faro).
//   Norte:     Ciudad Escarcha → Ruta 17 (glaciar) → Pico Cóndor.
//   Sur:       Puerto Caracol → Ruta 18 (playa) → Ruta 19 (banco de arena) → Ciudad Marea. Cierra la vuelta de la costa.
//   Noroeste:  Pueblo Guadua → Ruta 20 → Ruinas del Alba → Ruta 21 → Ciudad Albor (se entra a Albor con la Medalla Escarcha).
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen, casaGen } from './maps2.js';
import { hasBadge } from '../data/gyms.js';

const T = (name, look, party, money, intro, defeat, after) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat) });
const POSADA = { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false };
const TIENDA = { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false };
const put = (b, ch, list) => { for (const [x, y] of list) b.set(x, y, ch); return b; };

function ruta16() {
  const b = new MapBuilder('ruta16', 28, 16).meta({ name: 'Ruta 16', outdoor: true, origin: [196, -24], encounters: 'ruta16', battleBg: 'beach' });
  b.border('T').rect(0, 8, 28, 2, 'p').rect(2, 12, 24, 2, 's').rect(0, 14, 28, 2, 'w').rect(4, 3, 6, 4, 'g').rect(18, 3, 6, 4, 'g').rect(12, 4, 4, 2, 'F');
  put(b, 'J', [[3, 12], [12, 13], [20, 12], [25, 13], [11, 3], [16, 6]]);
  b.obj({ kind: 'sign', x: 3, y: 7, text: ['RUTA 16', 'Oeste: Ciudad Voltio · Este: Cabo Faro'] });
  b.npc({ id: 'r16marino', look: 'sailor', x: 10, y: 10, dir: 1, sight: 1, trainer: T('Marinero Óscar', 'sailor', [['meduson', 29], ['nivalmar', 29]], 1200, ['¡Voy para el faro y nadie me adelanta!'], ['Me adelantaste por babor.'], ['El faro de Cabo Faro se ve desde media región.']) });
  b.npc({ id: 'r16chica', look: 'lass', x: 20, y: 7, dir: 0, sight: 1, trainer: T('Cometera Sara', 'lass', [['tormavis', 30], ['pipiolo', 30]], 1250, ['¡Con este viento mis criaturas vuelan solas!'], ['Se me enredó la cometa.'], ['En el cabo siempre hay brisa.']) });
  return b.build();
}

function cabo() {
  const b = new MapBuilder('cabo', 28, 28).meta({ name: 'Cabo Faro', outdoor: true, origin: [224, -34], battleBg: 'beach' });
  b.border('T').rect(19, 2, 3, 24, 's').rect(22, 0, 6, 28, 'w').rect(0, 18, 16, 2, 'p').rect(14, 6, 2, 14, 'p');
  b.rect(6, 16, 1, 2, 'p').rect(11, 16, 1, 2, 'p').rect(6, 8, 1, 1, 'p').rect(6, 9, 9, 1, 'p').rect(4, 21, 5, 2, 'F').rect(10, 23, 6, 2, 'F');
  put(b, 'J', [[19, 4], [20, 12], [19, 20], [20, 24], [17, 22], [3, 24]]);
  b.building('house', 3, 12, 6, 4, POSADA, 'posadaCabo', 6, 7)
    .building('house', 9, 12, 5, 4, TIENDA, 'tiendaCabo', 5, 6)
    .building('house', 4, 5, 5, 3, { roof: '#3aa6a0', doorCol: 2 }, 'casaCabo', 4, 5)
    .building('house', 13, 2, 5, 4, { roof: '#d84a4a', wall: '#ffffff', sign: 'FARO', signColor: '#d84a4a', doorCol: 2, flowers: false }, 'faroCabo', 4, 5);
  for (const [x, y] of [[13, 17], [16, 10], [17, 19]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 12, y: 20, text: ['CABO FARO', 'La última luz de Alborada antes del mar abierto.'] });
  b.obj({ kind: 'boat', x: 23, y: 14, w: 3, h: 1, text: ['Un velero pequeño. Su vela tiene pintado un sol.'] });
  b.npc({ id: 'caboPintora', look: 'girl', x: 17, y: 14, dir: 3, talk: ['Vengo a pintar el amanecer. Aquí sale el sol antes que en cualquier otra parte.', 'Por eso la región se llama Alborada.'] });
  b.npc({ id: 'caboNino', look: 'kid', x: 8, y: 21, dir: 0, wander: 2, talk: ['¡De noche el faro gira y gira!', 'Mi abuelo dice que así las criaturas del mar encuentran el camino.'] });
  b.npc({ id: 'caboRegalo', look: 'sailor', x: 20, y: 22, dir: 2, talk: 'regalo', arg: { flag: 'regaloCabo', item: 'capsulaVeloz', n: 3, who: 'Capitana Brisa', lines: ['¿Llegaste caminando hasta la punta del mapa? Eso merece premio.', 'Con estas cápsulas atrapé a las criaturas más rápidas del mar.'], after: ['El mar siempre guarda algo más allá. Algún día lo sabrás.'] } });
  return b.build();
}

function ruta17() {
  const b = new MapBuilder('ruta17', 18, 32).meta({ name: 'Ruta 17 · Glaciar', outdoor: true, snow: true, origin: [112, -196], encounters: 'ruta17', battleBg: 'mountain' });
  b.border('Y').rect(8, 0, 2, 32, 'p').rect(3, 4, 4, 6, 'g').rect(11, 12, 4, 6, 'g').rect(3, 20, 4, 6, 'g').rect(11, 4, 4, 2, 'K').rect(3, 14, 4, 2, 'K').rect(11, 24, 4, 2, 'K');
  put(b, 'O', [[12, 8], [5, 12], [13, 20], [4, 28], [12, 28]]);
  b.obj({ kind: 'sign', x: 10, y: 29, text: ['RUTA 17 · GLACIAR', 'Norte: Pico Cóndor · Sur: Ciudad Escarcha'] });
  b.npc({ id: 'r17monta', look: 'hiker', x: 7, y: 11, dir: 3, sight: 1, trainer: T('Alpinista Bernardo', 'hiker', [['nivalord', 41], ['arieton', 41]], 1900, ['¡A esta altura falta el aire y sobran las ganas!'], ['Me quedé sin aire.'], ['En la cumbre vive un ermitaño que regala cosas.']) });
  b.npc({ id: 'r17esqui', look: 'man', x: 10, y: 22, dir: 2, sight: 1, trainer: T('Esquiador Lucas', 'man', [['acerion', 42], ['nivalord', 42]], 1950, ['¡Bajo el glaciar en dos minutos!'], ['Hoy bajé rodando.'], ['El hielo de aquí arriba nunca se derrite.']) });
  return b.build();
}

function pico() {
  const b = new MapBuilder('pico', 30, 26).meta({ name: 'Pico Cóndor', outdoor: true, snow: true, origin: [106, -222], encounters: 'pico', battleBg: 'mountain' });
  b.border('K').rect(14, 14, 2, 12, 'p').rect(8, 12, 14, 2, 'p').rect(6, 9, 1, 3, 'p').rect(6, 12, 2, 1, 'p').rect(10, 4, 10, 5, 'w').rect(3, 15, 7, 6, 'g').rect(20, 15, 7, 6, 'g');
  put(b, 'O', [[4, 12], [24, 5], [26, 12], [11, 22], [19, 23]]);
  put(b, 'Y', [[3, 3], [26, 3], [3, 22], [26, 22], [22, 8]]);
  b.building('house', 4, 6, 5, 3, { roof: '#7a5a3a', wall: '#e8dcc8', doorCol: 2, flowers: false }, 'refugioPico', 4, 5);
  for (const [x, y] of [[21, 7], [23, 10], [9, 10]]) b.obj({ kind: 'crystal', x, y });
  b.obj({ kind: 'statue', x: 15, y: 10, text: ['Un cóndor tallado en hielo. No se sabe quién lo hizo.', '"Quien llega hasta aquí ya voló más alto que muchos."'] });
  b.obj({ kind: 'sign', x: 16, y: 23, text: ['PICO CÓNDOR', 'El punto más alto de Alborada.'] });
  b.npc({ id: 'picoRegalo', look: 'old', x: 18, y: 11, dir: 0, talk: 'regalo', arg: { flag: 'regaloPico', item: 'tonicoMax', n: 2, who: 'Ermitaño del pico', lines: ['Hace años que nadie subía hasta aquí.', 'Lleva esto. Allá abajo te va a servir más que a mí.'], after: ['Desde aquí se ve toda Alborada. Mírala bien.'] } });
  b.npc({ id: 'picoAs', look: 'aide', x: 12, y: 18, dir: 3, sight: 2, trainer: T('As Camila', 'aide', [['nivalord', 44], ['astrocuarzo', 44], ['acerion', 45]], 2300, ['Entreno en la cumbre porque aquí no hay excusas.'], ['Ni excusas ni victoria.'], ['La campeona Aurora también entrenó en este pico.']) });
  b.npc({ id: 'picoMonje', look: 'old', x: 17, y: 22, dir: 2, sight: 2, trainer: T('Monje Silvio', 'old', [['arieton', 44], ['cuarzon', 44]], 2200, ['El silencio de la nieve enseña más que mil libros.'], ['Hoy me enseñaste tú.'], ['Respira hondo. El aire de la cumbre limpia la cabeza.']) });
  return b.build();
}

function ruta18() {
  const b = new MapBuilder('ruta18', 40, 16).meta({ name: 'Ruta 18', outdoor: true, origin: [60, 26], encounters: 'ruta18', battleBg: 'beach' });
  b.border('T').rect(0, 8, 40, 2, 'p').rect(2, 10, 36, 2, 's').rect(0, 12, 40, 4, 'w').rect(5, 3, 7, 4, 'g').rect(20, 3, 8, 4, 'g').rect(31, 3, 5, 4, 'g').rect(14, 4, 4, 2, 'F');
  put(b, 'J', [[4, 11], [13, 10], [22, 11], [30, 10], [36, 11], [18, 3], [29, 6]]);
  b.obj({ kind: 'sign', x: 3, y: 7, text: ['RUTA 18 · PLAYA LARGA', 'Oeste: Puerto Caracol · Este: Ruta 19 y Ciudad Marea'] });
  b.obj({ kind: 'sign', x: 37, y: 7, text: ['CUIDADO', 'En el banco de arena de la Ruta 19 hay criaturas fuertes.'] });
  b.npc({ id: 'r18nino', look: 'kid', x: 14, y: 7, dir: 0, sight: 1, trainer: T('Niño Mateo', 'kid', [['pipiu', 10], ['medusin', 10]], 400, ['¡Hice un castillo de arena y tú casi lo pisas!'], ['Se cayó el castillo.'], ['La playa sigue y sigue hasta Ciudad Marea.']) });
  b.npc({ id: 'r18nada', look: 'swimmer', x: 26, y: 10, dir: 1, sight: 1, trainer: T('Nadadora Irene', 'swimmer', [['nivalin', 11], ['medusin', 11], ['roedin', 10]], 440, ['¡Salí del agua sólo para ganarte!'], ['Vuelvo al agua.'], ['Las criaturas de Agua le temen al Eléctrico y a la Planta.']) });
  return b.build();
}

function ruta19() {
  const b = new MapBuilder('ruta19', 18, 40, 'w').meta({ name: 'Ruta 19 · Banco de arena', outdoor: true, origin: [100, 0], encounters: 'ruta19', battleBg: 'beach' });
  b.rect(8, 0, 3, 2, 's').rect(6, 2, 7, 30, 's').rect(8, 32, 3, 4, 's').rect(0, 34, 10, 2, 's').rect(6, 10, 2, 6, 'g').rect(11, 20, 2, 6, 'g').rect(6, 27, 2, 4, 'g');
  put(b, 'J', [[6, 4], [12, 6], [12, 16], [6, 19], [12, 29]]);
  put(b, 'O', [[11, 11], [7, 23]]);
  b.obj({ kind: 'sign', x: 11, y: 3, text: ['RUTA 19 · BANCO DE ARENA', 'Norte: Ciudad Marea · Sur: Ruta 18 y Puerto Caracol'] });
  b.npc({ id: 'r19nada', look: 'swimmer', x: 12, y: 8, dir: 2, sight: 2, trainer: T('Nadadora Olga', 'swimmer', [['meduson', 24], ['nivalmar', 23]], 980, ['¡Cruzo este banco nadando ida y vuelta!'], ['Me dio un calambre.'], ['Con marea alta el banco casi desaparece.']) });
  b.npc({ id: 'r19marino', look: 'sailor', x: 6, y: 25, dir: 3, sight: 2, trainer: T('Pescador Ramiro', 'sailor', [['pipiolo', 23], ['meduson', 24], ['roedon', 23]], 1000, ['¡Shh! Me espantas la pesca... ¡ahora me la pagas!'], ['Ni un pescado hoy.'], ['Al sur, por la playa larga, se llega a Puerto Caracol.']) });
  return b.build();
}

function ruta20() {
  const b = new MapBuilder('ruta20', 18, 32).meta({ name: 'Ruta 20', outdoor: true, biome: 'jungle', origin: [-20, -116], encounters: 'ruta20', battleBg: 'grass' });
  b.border('T').rect(8, 0, 2, 32, 'p').rect(3, 4, 4, 6, 'g').rect(11, 10, 4, 7, 'g').rect(3, 19, 4, 7, 'g').rect(11, 3, 4, 4, 'w').rect(11, 22, 3, 3, 'F');
  put(b, 'J', [[3, 12], [14, 8], [12, 19], [4, 28], [13, 28], [6, 15]]);
  b.obj({ kind: 'sign', x: 10, y: 29, text: ['RUTA 20', 'Norte: Ruinas del Alba · Sur: Pueblo Guadua'] });
  b.npc({ id: 'r20explo', look: 'hiker', x: 7, y: 12, dir: 3, sight: 1, trainer: T('Arqueólogo Darío', 'hiker', [['guijarrin', 17], ['cuarcin', 18]], 760, ['¡Voy para las ruinas y no comparto hallazgos!'], ['Bueno, te comparto la derrota.'], ['Las ruinas son más viejas que Ciudad Albor.']) });
  b.npc({ id: 'r20chica', look: 'lass', x: 10, y: 24, dir: 2, sight: 1, trainer: T('Guía Paola', 'lass', [['verdilago', 18], ['truenin', 18], ['michin', 17]], 800, ['¿Turista? Primero la prueba de la selva.'], ['Pasaste la prueba.'], ['No toques las estatuas de las ruinas. Por si acaso.']) });
  return b.build();
}

function ruinas() {
  const b = new MapBuilder('ruinas', 30, 28).meta({ name: 'Ruinas del Alba', outdoor: true, biome: 'jungle', origin: [-26, -144], encounters: 'ruinas', battleBg: 'grass' });
  b.border('T').rect(14, 16, 2, 12, 'p').rect(14, 18, 16, 2, 'p').rect(8, 6, 14, 10, 'p').rect(7, 5, 16, 1, 'K').rect(7, 5, 1, 11, 'K').rect(22, 5, 1, 11, 'K');
  b.rect(3, 19, 8, 6, 'g').rect(19, 21, 8, 5, 'g').rect(3, 6, 3, 9, 'g').rect(24, 6, 3, 9, 'g');
  put(b, 'J', [[3, 3], [26, 3], [12, 22], [17, 24], [4, 16], [25, 16]]);
  for (const [x, y] of [[10, 8], [19, 8], [10, 13], [19, 13]]) b.obj({ kind: 'statue', x, y, text: ['Una estatua cubierta de musgo. Tiene forma de criatura, pero de ninguna que conozcas.'] });
  b.obj({ kind: 'statue', x: 14, y: 7, text: ['Un altar con un sol tallado.', '"Antes de las ciudades, antes de los gimnasios, la gente y las criaturas ya caminaban juntas."'] });
  b.obj({ kind: 'sign', x: 16, y: 21, text: ['RUINAS DEL ALBA', 'Este: Ruta 21 y Ciudad Albor · Sur: Ruta 20'] });
  b.npc({ id: 'ruinasRegalo', look: 'aide', x: 16, y: 8, dir: 0, talk: 'regalo', arg: { flag: 'regaloRuinas', item: 'cristalMental', n: 1, who: 'Investigadora Sol', lines: ['¡Cuidado con pisar los grabados! ...Ah, eres entrenador.', 'Encontré esto entre las piedras. A mí no me sirve, pero a tus criaturas sí.'], after: ['Cada piedra de aquí cuenta una historia. Me falta leer como mil.'] } });
  b.npc({ id: 'ruinasMonje', look: 'old', x: 12, y: 20, dir: 3, sight: 2, trainer: T('Guardián Anselmo', 'old', [['mistigato', 21], ['candelo', 22]], 1000, ['Estas piedras no se visitan sin permiso.'], ['Tienes el permiso.'], ['El altar del centro mira hacia donde sale el sol.']) });
  b.npc({ id: 'ruinasBicho', look: 'bugkid', x: 20, y: 17, dir: 0, sight: 1, trainer: T('Cazabichos Joaquín', 'bugkid', [['alasol', 21], ['seton', 22], ['serpentil', 21]], 980, ['¡Entre las ruinas salen bichos que no están en ningún libro!'], ['Tampoco en mi red.'], ['Al este el camino sube hasta Ciudad Albor. Dicen que piden una medalla para entrar.']) });
  return b.build();
}

function ruta21() {
  const b = new MapBuilder('ruta21', 50, 16).meta({ name: 'Ruta 21', outdoor: true, origin: [4, -134], encounters: 'ruta21', battleBg: 'mountain' });
  b.border('K').rect(0, 8, 50, 2, 'p').rect(5, 3, 8, 4, 'g').rect(20, 11, 9, 3, 'g').rect(34, 3, 8, 4, 'g').rect(40, 11, 6, 3, 'g');
  put(b, 'O', [[15, 4], [18, 12], [30, 5], [32, 12], [45, 5], [9, 12]]);
  put(b, 'T', [[3, 12], [14, 12], [24, 4], [26, 4], [44, 12]]);
  b.obj({ kind: 'sign', x: 4, y: 7, text: ['RUTA 21 · CAMINO DE PIEDRA', 'Oeste: Ruinas del Alba · Este: Ciudad Albor'] });
  b.obj({ kind: 'sign', x: 46, y: 7, text: ['CIUDAD ALBOR →', 'Por esta puerta sólo entra quien tenga la Medalla Escarcha.'] });
  b.npc({ id: 'r21monje', look: 'old', x: 16, y: 7, dir: 0, sight: 1, trainer: T('Peregrino Tobías', 'old', [['orbelina', 38], ['cobrumbra', 39]], 1750, ['Camino de las ruinas al templo una vez al año.'], ['Este año aprendí algo nuevo.'], ['El maestro Sabino recibe a los peregrinos en Albor.']) });
  b.npc({ id: 'r21monta', look: 'hiker', x: 30, y: 10, dir: 1, sight: 1, trainer: T('Cantero Efraín', 'hiker', [['penon', 39], ['ferrox', 39], ['arieton', 39]], 1800, ['¡Estas piedras las puse yo! ¡Respeto!'], ['Respeto para ti.'], ['El camino de piedra tiene más de mil años.']) });
  return b.build();
}

function carve(def, x, y, w, h, ch) {
  def.tiles = def.tiles.map((row, j) => j >= y && j < y + h ? row.slice(0, x) + ch.repeat(w) + row.slice(x + w) : row);
}
// Abre las salidas en los mapas que ya existían.
export function connectFarZones(maps) {
  carve(maps.voltio, 32, 20, 2, 2, 'p');     // este de Voltio → Ruta 16
  carve(maps.escarcha, 26, 0, 2, 2, 'p');    // norte de Escarcha → Ruta 17
  carve(maps.marea, 12, 24, 3, 2, 's');      // muelle de arena de Marea → Ruta 19
  carve(maps.albor, 0, 6, 2, 2, 'p');        // oeste de Albor → Ruta 21
  // Por las ruinas se llegaría a Albor antes de tiempo: la puerta del oeste pide la Medalla Escarcha.
  maps.albor.triggers.push({ x: 0, y: 6, w: 1, h: 2, when: st => st.dir === 3 && !hasBadge(st, 'escarcha'), script: 'bloqueoRuinas' });
}

export function buildFarZones() {
  return [
    ruta16(), cabo(), ruta17(), pico(), ruta18(), ruta19(), ruta20(), ruinas(), ruta21(),
    posadaGen('posadaCabo', 'Posada de Cabo Faro', ['cabo', 6, 16]), tiendaGen('tiendaCabo', 'Tienda de Cabo Faro', ['cabo', 11, 16], 'cabo'),
    casaGen('casaCabo', 'Casa de la pintora', 'girl', ['Tengo como cien cuadros del mismo amanecer.', 'Ninguno me ha quedado igual a otro.'], ['cabo', 6, 8], '#e6f0f4'),
    casaGen('faroCabo', 'Faro del Cabo', 'old', ['Prendo esta luz todas las noches desde hace cuarenta años.', 'Mientras el faro alumbre, nadie se pierde en el mar de Alborada.'], ['cabo', 15, 6], '#f4ecd8'),
    casaGen('refugioPico', 'Refugio del pico', 'hiker', ['¡Entra, entra, que afuera hiela! Hay aguapanela caliente.', 'Descansa antes de bajar. La bajada cansa más que la subida.'], ['pico', 6, 9], '#e8dcc8')
  ];
}
