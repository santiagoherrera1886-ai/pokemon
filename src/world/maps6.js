// Tercera tanda: todo el occidente de Alborada y una isla.
//   Lago Espejo → Ruta 22 → Valle de las Palmas → Ruta 23 → Pueblo Llanero → Ruta 24 → Manglar →
//   Ruta 25 → Puerto Caracol. Cierra una segunda vuelta grande por el sur.
//   Desde Cabo Faro, con las ocho medallas, un barco lleva a la Isla Totuma.
// El occidente se abre con la Medalla Marea: las criaturas de allá ya están crecidas.
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen, casaGen } from './maps2.js';
import { hasBadge, badgeCount, LEAGUE_BADGES } from '../data/gyms.js';

const T = (name, look, party, money, intro, defeat, after) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat) });
const POSADA = { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false };
const TIENDA = { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false };
const put = (b, ch, list) => { for (const [x, y] of list) b.set(x, y, ch); return b; };

// ---------------------------------------------------------------- RUTA 22 (bosque al oeste del lago)
function ruta22() {
  const b = new MapBuilder('ruta22', 32, 16).meta({ name: 'Ruta 22', outdoor: true, origin: [-62, -18], encounters: 'ruta22', battleBg: 'grass' });
  b.border('T').rect(0, 6, 32, 2, 'p').rect(12, 2, 2, 5, 'p').rect(10, 2, 7, 2, 'g');
  b.rect(4, 9, 7, 4, 'g').rect(20, 9, 8, 4, 'g').rect(22, 2, 6, 3, 'g').rect(5, 2, 4, 3, 'F');
  put(b, 'J', [[3, 8], [11, 13], [18, 8], [29, 12], [16, 13], [25, 8]]);
  b.obj({ kind: 'sign', x: 28, y: 5, text: ['RUTA 22', 'Este: Lago Espejo · Oeste: Valle de las Palmas'] });
  b.npc({ id: 'r22bicho', look: 'bugkid', x: 13, y: 9, dir: 1, sight: 2, trainer: T('Cazabichos Pipe', 'bugkid', [['arrierin', 20], ['orugazul', 20], ['mariposol', 21]], 880, ['¡Al oeste hay bichos que nadie ha visto!'], ['¡Y uno me ganó... digo, me ganaste tú!'], ['Las palmas del valle son más altas que cualquier edificio.']) });
  b.npc({ id: 'r22chica', look: 'lass', x: 22, y: 5, dir: 2, sight: 2, trainer: T('Excursionista Mariana', 'lass', [['perecin', 21], ['colibrin', 21]], 900, ['¡Me voy caminando hasta los Llanos!'], ['Ya se me quitaron las ganas.'], ['Del valle baja un camino largo hacia el sur.']) });
  b.npc({ id: 'r22viejo', look: 'old', x: 7, y: 5, dir: 0, wander: 1, talk: ['Este bosque y el lago son la misma agua, mijo.', 'Lo que pasa allá se siente acá.'] });
  return b.build();
}

// ---------------------------------------------------------------- VALLE DE LAS PALMAS
function palmar() {
  const b = new MapBuilder('palmar', 36, 32).meta({ name: 'Valle de las Palmas', outdoor: true, biome: 'jungle', origin: [-98, -28], battleBg: 'grass' });
  b.border('T').rect(2, 16, 34, 2, 'p').rect(14, 18, 2, 14, 'p').rect(14, 4, 2, 12, 'p');
  b.rect(6, 14, 1, 2, 'p').rect(24, 14, 1, 2, 'p').rect(6, 20, 1, 2, 'p').rect(6, 21, 9, 1, 'p');
  b.rect(20, 20, 7, 5, 'g').rect(4, 26, 8, 4, 'g').rect(24, 5, 8, 5, 'g').rect(20, 27, 6, 3, 'F').rect(3, 4, 6, 3, 'F');
  // Las palmas de cera del valle: altas y en fila.
  put(b, 'J', [[3, 12], [6, 9], [10, 11], [19, 10], [22, 13], [28, 12], [31, 15], [4, 19], [11, 24], [19, 18], [26, 18], [31, 22], [8, 29], [28, 29], [33, 27], [2, 24]]);
  b.building('house', 4, 10, 6, 4, POSADA, 'posadaPalmar', 6, 7)
    .building('house', 22, 10, 5, 4, TIENDA, 'tiendaPalmar', 5, 6)
    .building('house', 4, 17, 5, 3, { roof: '#6a9a3a', doorCol: 2 }, 'casaPalmar', 4, 5)
    .building('house', 26, 2, 5, 3, { roof: '#c88a3a', doorCol: 2 }, 'casaPalmar2', 4, 5);
  for (const [x, y] of [[13, 18], [16, 14], [12, 25]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 12, y: 15, text: ['VALLE DE LAS PALMAS', 'Las palmas más altas del mundo crecen aquí.'] });
  b.obj({ kind: 'sign', x: 16, y: 30, text: ['RUTA 23 ↓ PUEBLO LLANERO', 'El camino baja hasta la sabana.'] });
  b.npc({ id: 'palmarGuia', look: 'lass', x: 18, y: 15, dir: 0, wander: 2, talk: ['Una palma de estas tarda cien años en crecer.', 'Por eso nadie las corta: valen más vivas.'] });
  b.npc({ id: 'palmarNino', look: 'kid', x: 10, y: 20, dir: 0, wander: 2, talk: ['¡Mi mamá dice que los colibríes del valle son de siete colores!', 'Yo sólo he visto de tres, pero igual son bonitos.'] });
  b.npc({ id: 'palmarRegalo', look: 'old', x: 29, y: 12, dir: 2, talk: 'regalo', arg: { flag: 'regaloPalmar', item: 'rocioPuro', n: 2, who: 'Don Palmiro', lines: ['Llevo toda la vida cuidando estas palmas.', 'Tome, del rocío que se junta en las hojas al amanecer.'], after: ['Cuide el valle cuando yo ya no esté.'] } });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 23 (bajada a la sabana)
function ruta23() {
  const b = new MapBuilder('ruta23', 18, 34).meta({ name: 'Ruta 23', outdoor: true, origin: [-92, 4], encounters: 'ruta23', battleBg: 'grass' });
  b.border('T').rect(8, 0, 2, 34, 'p').rect(3, 12, 6, 2, 'p').rect(3, 24, 7, 2, 'p');
  b.rect(3, 4, 4, 6, 'g').rect(11, 6, 4, 8, 'g').rect(3, 16, 4, 6, 'g').rect(11, 20, 4, 9, 'g').rect(11, 2, 4, 2, 'F');
  put(b, 'J', [[3, 11], [13, 16], [5, 23], [14, 31], [2, 29], [15, 4]]);
  b.obj({ kind: 'sign', x: 10, y: 31, text: ['RUTA 23', 'Sur: Pueblo Llanero · Norte: Valle de las Palmas'] });
  b.npc({ id: 'r23vaquero', look: 'man', x: 7, y: 13, dir: 3, sight: 2, trainer: T('Llanero Efrén', 'man', [['anteojin', 23], ['carnerazo', 24]], 1000, ['¡Bajando de la montaña y ya quiere pasar derecho!'], ['Pase, pues.'], ['Abajo empieza la sabana. No se ve el final.']) });
  b.npc({ id: 'r23chica', look: 'girl', x: 10, y: 25, dir: 2, sight: 2, trainer: T('Naturalista Ana', 'girl', [['doradita', 24], ['perecin', 24], ['colibrin', 24]], 1050, ['¡Estoy contando especies! Tú vas de número doce.'], ['Número doce: ganador.'], ['Las ranas doradas de aquí no se tocan con la mano.']) });
  return b.build();
}

// ---------------------------------------------------------------- PUEBLO LLANERO
function sabana() {
  const b = new MapBuilder('sabana', 36, 32).meta({ name: 'Pueblo Llanero', outdoor: true, origin: [-108, 38], battleBg: 'grass' });
  b.border('T').rect(24, 0, 2, 14, 'p').rect(2, 14, 34, 2, 'p').rect(10, 16, 2, 14, 'p');
  b.rect(6, 12, 1, 2, 'p').rect(18, 12, 1, 2, 'p').rect(14, 18, 1, 2, 'p').rect(12, 19, 3, 1, 'p');
  b.rect(3, 4, 7, 5, 'g').rect(14, 4, 8, 6, 'g').rect(18, 20, 10, 6, 'g').rect(2, 22, 6, 5, 'g').rect(28, 4, 5, 6, 'F').rect(16, 27, 6, 3, 'F');
  b.building('house', 4, 8, 6, 4, POSADA, 'posadaSabana', 6, 7)
    .building('house', 16, 8, 5, 4, TIENDA, 'tiendaSabana', 5, 6)
    .building('house', 12, 15, 5, 3, { roof: '#d8a040', doorCol: 2 }, 'casaSabana', 4, 5)
    .building('house', 28, 16, 5, 3, { roof: '#b85a3a', doorCol: 2 }, 'casaSabana2', 4, 5);
  for (const [x, y] of [[22, 13], [9, 20], [26, 15]]) b.obj({ kind: 'lamp', x, y });
  put(b, 'J', [[2, 18], [33, 20], [30, 28], [4, 30], [34, 12]]);
  b.obj({ kind: 'sign', x: 8, y: 13, text: ['PUEBLO LLANERO', 'Sabana, ganado y atardeceres que no se acaban.'] });
  b.obj({ kind: 'sign', x: 33, y: 13, text: ['RUTA 24 → MANGLAR', 'Al oriente la sabana se vuelve agua salada.'] });
  b.npc({ id: 'sabanaLlanero', look: 'man', x: 14, y: 13, dir: 0, wander: 2, talk: ['Aquí el horizonte queda lejísimos. Uno se acostumbra.', 'Al atardecer todo el cielo se pone naranja.'] });
  b.npc({ id: 'sabanaArpista', look: 'girl', x: 20, y: 17, dir: 0, wander: 1, talk: ['Toco el arpa llanera desde los seis años.', 'Dicen que las criaturas del llano se calman cuando la oyen.'] });
  b.npc({ id: 'sabanaNino', look: 'kid', x: 6, y: 20, dir: 3, wander: 2, talk: ['¡Vi un Condoral volando bien alto!', '...bueno, era un punto. Pero yo sé que era.'] });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 24 (sabana abierta)
function ruta24() {
  const b = new MapBuilder('ruta24', 36, 16).meta({ name: 'Ruta 24', outdoor: true, origin: [-72, 46], encounters: 'ruta24', battleBg: 'grass' });
  b.border('T').rect(0, 6, 36, 2, 'p').rect(16, 2, 2, 5, 'p').rect(16, 8, 2, 6, 'p');
  b.rect(4, 2, 9, 4, 'g').rect(22, 2, 10, 4, 'g').rect(3, 9, 10, 4, 'g').rect(21, 9, 11, 4, 'g');
  put(b, 'J', [[2, 8], [14, 13], [20, 8], [34, 12], [19, 2], [33, 8]]);
  b.obj({ kind: 'sign', x: 3, y: 5, text: ['RUTA 24 · SABANA ABIERTA', 'Oeste: Pueblo Llanero · Este: el Manglar'] });
  b.npc({ id: 'r24jinete', look: 'hiker', x: 17, y: 9, dir: 1, sight: 2, trainer: T('Jinete Camilo', 'hiker', [['arrieron', 27], ['gurron', 27]], 1200, ['¡En el llano se corre derecho y se pelea de frente!'], ['De frente perdí.'], ['El manglar de allá es un laberinto de raíces.']) });
  b.npc({ id: 'r24dama', look: 'lass', x: 26, y: 5, dir: 2, sight: 2, trainer: T('Vaquera Lucero', 'lass', [['anteojon', 28], ['roedon', 27]], 1250, ['¡Oiga! Por aquí se saluda combatiendo.'], ['Buen saludo.'], ['De noche en el llano se ven todas las estrellas.']) });
  return b.build();
}

// ---------------------------------------------------------------- MANGLAR
function manglar() {
  const b = new MapBuilder('manglar', 32, 30).meta({ name: 'Manglar', outdoor: true, biome: 'jungle', origin: [-36, 40], encounters: 'manglar', battleBg: 'beach' });
  b.border('T').rect(0, 12, 20, 2, 'p').rect(18, 2, 2, 12, 'p').rect(20, 2, 12, 2, 'p');
  b.rect(8, 6, 1, 6, 'p').rect(8, 6, 6, 1, 'p').rect(4, 16, 1, 2, 'p').rect(4, 17, 18, 1, 'p').rect(21, 17, 1, 8, 'p');
  b.rect(2, 20, 14, 6, 'w').rect(24, 8, 6, 6, 'w').rect(24, 20, 6, 6, 'w').rect(3, 2, 5, 6, 'g').rect(12, 20, 8, 4, 'g').rect(26, 15, 5, 3, 'g');
  put(b, 'J', [[2, 10], [15, 8], [22, 6], [30, 6], [3, 15], [16, 15], [23, 15], [30, 18], [7, 27], [18, 27], [28, 28], [11, 15]]);
  b.obj({ kind: 'sign', x: 17, y: 11, text: ['MANGLAR', 'Oeste: la sabana · Norte: Ruta 25 y Puerto Caracol'] });
  b.obj({ kind: 'boat', x: 5, y: 19, w: 3, h: 1, text: ['Una canoa de madera, amarrada a una raíz.'] });
  b.npc({ id: 'manglarPescador', look: 'sailor', x: 10, y: 16, dir: 0, wander: 1, talk: ['Entre estas raíces crían los peces de todo el golfo.', 'Si se tumba el manglar, se acaba la pesca. Así de sencillo.'] });
  b.npc({ id: 'manglarNada', look: 'swimmer', x: 19, y: 18, dir: 2, sight: 2, trainer: T('Canoera Yurani', 'swimmer', [['cangrejon', 30], ['doradon', 30]], 1350, ['¡Conozco cada canal de memoria!'], ['Hoy me perdí.'], ['Al norte sale el camino a Puerto Caracol.']) });
  b.npc({ id: 'manglarBicho', look: 'bugkid', x: 22, y: 9, dir: 2, sight: 2, trainer: T('Cazabichos Dayana', 'bugkid', [['mariposol', 30], ['arrieron', 31]], 1380, ['¡Los bichos del manglar son enormes!'], ['Y mi derrota también.'], ['Las mariposas azules salen cuando pega el sol.']) });
  b.npc({ id: 'manglarRegalo', look: 'girl', x: 28, y: 17, dir: 2, talk: 'regalo', arg: { flag: 'regaloManglar', item: 'perlaDeRio', n: 2, who: 'Bióloga Nidia', lines: ['¿Llegaste hasta acá? Casi nadie se anima.', 'Toma, las encontré entre las raíces. Que te den suerte.'], after: ['Cada raíz de estas es la casa de algo.'] } });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 25 (camino al puerto)
function ruta25() {
  const b = new MapBuilder('ruta25', 34, 16).meta({ name: 'Ruta 25', outdoor: true, origin: [-4, 30], encounters: 'ruta25', battleBg: 'beach' });
  b.border('T').rect(0, 12, 20, 2, 'p').rect(18, 6, 2, 8, 'p').rect(20, 6, 14, 2, 'p');
  b.rect(3, 3, 8, 5, 'g').rect(22, 10, 9, 4, 'g').rect(4, 9, 7, 2, 'F').rect(24, 2, 7, 3, 'g');
  put(b, 'J', [[2, 10], [13, 10], [16, 3], [21, 9], [32, 11], [12, 14], [27, 9]]);
  b.obj({ kind: 'sign', x: 17, y: 11, text: ['RUTA 25', 'Este: Puerto Caracol · Oeste: el Manglar'] });
  b.npc({ id: 'r25marino', look: 'sailor', x: 14, y: 13, dir: 2, sight: 2, trainer: T('Marinero Jairo', 'sailor', [['cangrejon', 32], ['meduson', 32]], 1420, ['¡Del manglar al puerto me sé el camino dormido!'], ['Despierto perdí.'], ['En Puerto Caracol siempre hay quien lo lleve a uno a alguna parte.']) });
  b.npc({ id: 'r25chica', look: 'lass', x: 25, y: 9, dir: 0, sight: 2, trainer: T('Caminante Sara', 'lass', [['perezon', 32], ['mariposol', 33]], 1450, ['Esta vuelta por el sur es larga pero vale la pena.'], ['Y perder también enseña.'], ['Si sigues al este llegas al puerto, y de ahí a la playa larga.']) });
  return b.build();
}

// ---------------------------------------------------------------- ISLA TOTUMA (en barco desde Cabo Faro)
function isla() {
  const b = new MapBuilder('isla', 38, 34, 'w').meta({ name: 'Isla Totuma', outdoor: true, biome: 'jungle', origin: [268, -26], encounters: 'isla', battleBg: 'beach' });
  b.rect(4, 4, 30, 26, 's').rect(6, 6, 26, 22, '.');
  b.rect(16, 28, 4, 4, 's');                                     // playa del muelle, al sur
  b.rect(17, 24, 2, 6, 'p').rect(8, 22, 22, 2, 'p').rect(8, 10, 2, 13, 'p').rect(8, 10, 18, 2, 'p');
  b.rect(11, 14, 7, 6, 'g').rect(21, 18, 7, 4, 'g').rect(12, 6, 6, 3, 'g').rect(27, 5, 4, 4, 'g').rect(22, 25, 7, 3, 'F').rect(9, 25, 5, 3, 'F');
  put(b, 'J', [[7, 8], [11, 12], [19, 11], [26, 12], [30, 10], [6, 20], [30, 20], [15, 25], [31, 25], [20, 7], [10, 6], [33, 16]]);
  put(b, 'O', [[24, 10], [13, 21], [28, 16]]);
  b.building('house', 10, 6, 6, 4, POSADA, 'posadaIsla', 6, 7)
    .building('house', 20, 6, 5, 4, TIENDA, 'tiendaIsla', 5, 6)
    .building('house', 27, 15, 5, 3, { roof: '#2fa08a', doorCol: 2 }, 'casaIsla', 4, 5);
  for (const [x, y] of [[19, 21], [9, 21], [29, 21]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'boat', x: 16, y: 31, w: 3, h: 1, text: ['El barco que te trajo. El capitán espera tranquilo.'] });
  b.obj({ kind: 'sign', x: 15, y: 23, text: ['ISLA TOTUMA', 'Mar adentro, al este de Cabo Faro.'] });
  b.npc({ id: 'islaCapitan', look: 'sailor', x: 18, y: 30, dir: 0, talk: 'barcoVuelta' });
  b.npc({ id: 'islaVieja', look: 'old', x: 12, y: 21, dir: 0, wander: 1, talk: ['En esta isla no hay gimnasio ni liga ni nada de eso.', 'Sólo mar, palmas y criaturas que no le tienen miedo a nadie.'] });
  b.npc({ id: 'islaAs1', look: 'aide', x: 24, y: 20, dir: 2, sight: 3, trainer: T('As Marcela', 'aide', [['condoral', 48], ['mariposol', 47], ['doradon', 48]], 2600, ['Vine a la isla a entrenar lejos del ruido.'], ['Y me encontré con alguien mejor.'], ['Aquí las criaturas salvajes son más fuertes que en la Liga.']) });
  b.npc({ id: 'islaAs2', look: 'hiker', x: 14, y: 17, dir: 3, sight: 3, trainer: T('As Nelson', 'hiker', [['gurron', 48], ['cangrejon', 48], ['anteojon', 49]], 2650, ['¿Campeón? Aquí eso no vale nada. Demuéstralo.'], ['Bueno, sí vale.'], ['Cada tanto llega alguien nuevo. Casi siempre se devuelve.']) });
  b.npc({ id: 'islaRegalo', look: 'girl', x: 31, y: 20, dir: 2, talk: 'regalo', arg: { flag: 'regaloIsla', item: 'escamaAntigua', n: 1, who: 'Buceadora Keila', lines: ['¡Nadie viene hasta acá! Toma, la saqué del fondo.', 'Dicen que es de un dragón de mar. Yo no sé, pero brilla bonito.'], after: ['Mar adentro todavía hay cosas que nadie ha visto.'] } });
  return b.build();
}

function carve(def, x, y, w, h, ch) {
  def.tiles = def.tiles.map((row, j) => j >= y && j < y + h ? row.slice(0, x) + ch.repeat(w) + row.slice(x + w) : row);
}
export function connectWestZones(maps) {
  carve(maps.lago, 0, 8, 2, 2, 'p');          // oeste del Lago Espejo → Ruta 22
  carve(maps.caracol, 0, 12, 2, 2, 'p');      // oeste de Puerto Caracol → Ruta 25
  // El occidente es para entrenadores con rodaje: se abre con la Medalla Marea.
  maps.lago.triggers.push({ x: 1, y: 8, w: 1, h: 2, when: st => st.dir === 2 && !hasBadge(st, 'marea'), script: 'bloqueoOeste' });
  maps.lago.npcs.push({ id: 'guardiaOeste', look: 'guard', x: 2, y: 10, dir: 1, talk: 'guardiaOeste' });
  // El capitán de Cabo Faro lleva a la Isla Totuma cuando ya tienes las ocho medallas.
  maps.cabo.npcs.push({ id: 'caboCapitan', look: 'sailor', x: 20, y: 13, dir: 2, talk: 'barcoIsla' });
  maps.cabo.objects.push({ kind: 'sign', x: 17, y: 11, solid: true, text: ['MUELLE DE CABO FARO', 'Mar adentro está la Isla Totuma. Sólo zarpa quien tenga las ocho medallas.'] });
}

export function buildWestZones() {
  return [
    ruta22(), palmar(), ruta23(), sabana(), ruta24(), manglar(), ruta25(), isla(),
    posadaGen('posadaPalmar', 'Posada del Valle', ['palmar', 7, 14]), tiendaGen('tiendaPalmar', 'Tienda del Valle', ['palmar', 24, 14], 'palmar'),
    posadaGen('posadaSabana', 'Posada Llanera', ['sabana', 7, 12]), tiendaGen('tiendaSabana', 'Tienda Llanera', ['sabana', 18, 12], 'sabana'),
    posadaGen('posadaIsla', 'Posada de la Isla', ['isla', 13, 10]), tiendaGen('tiendaIsla', 'Tienda de la Isla', ['isla', 22, 10], 'isla'),
    casaGen('casaPalmar', 'Casa del cerero', 'man', ['De la palma de cera se sacaba cera para las velas.', 'Ya no: ahora las cuidamos y ya. Salen mejor vivas.'], ['palmar', 6, 20], '#e8efd4'),
    casaGen('casaPalmar2', 'Casa del observador', 'girl', ['Llevo un cuaderno con todos los colibríes que pasan.', 'Van doscientos diecisiete este año.'], ['palmar', 28, 5], '#f2e6cc'),
    casaGen('casaSabana', 'Casa del arpista', 'old', ['El arpa, el cuatro y las maracas: con eso basta.', 'Siéntese un rato, que aquí nadie tiene afán.'], ['sabana', 14, 18], '#f4e8c8'),
    casaGen('casaSabana2', 'Casa de la veterinaria', 'nurse', ['Atiendo criaturas y también ganado.', 'En el llano uno aprende de todo un poquito.'], ['sabana', 30, 19], '#eee4d2'),
    casaGen('casaIsla', 'Casa del faro viejo', 'old', ['Esta isla no sale en los mapas viejos.', 'Mejor así: la gente que llega es la que de verdad quería venir.'], ['isla', 29, 18], '#dff0ea')
  ];
}
