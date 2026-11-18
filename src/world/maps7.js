// Cuarta tanda: el SUR de Alborada, hecho a mano. Reemplaza al mapa gigante (Tierra Grande) y trae sus
// casas, moteles y parejas a pueblos de verdad.
//   Pueblo Llanero → Ruta 26 → Pueblo Ribera → Ruta 27 → Caño de los Colores → Ciudad Cascada → Ruta 28 → Caleta Sol
//   Caño de los Colores → Ruta 29 → Manglar (cierra la vuelta por el occidente)
//   Cueva Guácharo: atajo bajo tierra entre el Caño y la Ruta 28.
// Ciudad Cascada tiene un gimnasio extra (tipo Hada, Medalla Arcoíris) que no hace falta para la Liga.
// Con esa medalla salen las cuatro leyendas del sur: Mohán, Madremonte, Tunjo y Esmeraldón.
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen, casaGen, gymGen } from './maps2.js';
import { houseShape, motelGen, casaPropiaGen, CANDIDATES } from './hogar.js';
import { hasBadge } from '../data/gyms.js';
import { gameHour } from '../core/clock.js';

const T = (name, look, party, money, intro, defeat, after, extra = {}) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat), ...extra });
const POSADA = { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false };
const TIENDA = { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false };
const MOTEL = { roof: '#c8485a', wall: '#f8e8cc', sign: 'MOTEL', signColor: '#c8485a', doorCol: 3, flowers: false };
const isNight = st => { const h = gameHour(st); return h >= 19 || h < 5; };
const rainbow = st => hasBadge(st, 'arcoiris');

// Lote en venta (11 × 11 casillas desde su esquina noroeste Lx, Ly): piscina atrás (sólo la casona), la casa
// abajo con la puerta siempre en (Lx + 5, Ly + 9) y el letrero mientras no se haya construido.
// La forma y los colores de la casa salen de la partida (houseShape); por dentro es casa_<lote>.
export const LOTS = {};
function lot(b, id, Lx, Ly, sign = [Lx + 8, Ly + 10]) {
  const ox = Lx - 5, oy = Ly - 2, door = [Lx + 5, Ly + 9], built = st => !!st.houses?.[id];
  LOTS[id] = { map: b.def.id, door, name: b.def.name };
  b.obj({ kind: 'sign', x: sign[0], y: sign[1], solid: true, script: 'lote', lot: id, sale: true, when: st => !st.houses?.[id], text: ['SE VENDE', 'Lote para construir tu casa. Habla con el letrero.'] });
  b.obj({ kind: 'house', x: Lx + 1, y: Ly + 4, w: 9, h: 6, solid: true, lot: id, door, opt: { doorCol: 4 }, when: built, dyn: st => houseShape(st.houses?.[id], ox, oy), dynKey: st => JSON.stringify(st.houses?.[id] || 0) });
  b.obj({ kind: 'pool', x: Lx + 3, y: Ly, w: 4, h: 4, solid: true, lot: id, pool: true, when: st => st.houses?.[id]?.model === 'casona' });
  b.warp(door[0], door[1], 'casa_' + id, 6, 8, { face: 1, needDir: 1, when: built });
}
// Las personas con las que se puede salir: paradas en su pueblo (no están ahí si andan contigo).
function cita(b, id) {
  const P = CANDIDATES[id];
  b.npc({ id: 'cita_' + id, look: P.look, x: P.home.x, y: P.home.y, dir: P.home.dir || 0, talk: 'cita', cand: id, name: P.name, when: st => !(st.pareja?.id === id && st.pareja.follow) });
}
// Motel de carretera: edificio con letrero y su interior (recepción y dos camas).
export const MOTEL_DOORS = {};
function motel(b, id, x, y) { b.building('house', x, y, 8, 5, MOTEL, 'motel_' + id, 6, 7); MOTEL_DOORS[id] = [b.def.id, x + 3, y + 5]; }
function bridge(b, x, y, w, h) { b.obj({ kind: 'bridge', x, y, w, h, solid: false, flat: true }); }

// ---------------------------------------------------------------- RUTA 26 (bajada del llano al río)
function ruta26() {
  const b = new MapBuilder('ruta26', 24, 34).meta({ name: 'Ruta 26', outdoor: true, origin: [-100, 70], encounters: 'ruta26', battleBg: 'grass' });
  b.rows(0, 0, [
    'TTTTTTTTTTTTppTTTTTTTTTT',
    'TTTTTTTTTTTTppTTTTTTTTTT',
    'TT..........pp......FFTT',
    'TTggggg.....pp..gggg.FTT',
    'TTggggg.....pp..gggg..TT',
    'TTggggg.....pp..gggg..TT',
    'TT..........pp........TT',
    'TT...ppppppppp........TT',
    'TT...ppppppppp....ggg.TT',
    'TT...pp..........ggg..TT',
    'TTg..pp....O.....ggg..TT',
    'TTgg.pp..........gg...TT',
    'TTgg.pp.....B.........TT',
    'TT...pp...............TT',
    'TTwwwppwwwwwwwwwwwwwwwTT',
    'TTwwwppwwwwwwwwwwwwwwwTT',
    'TT...pp...............TT',
    'TTgg.pp...............TT',
    'TTgg.pp...............TT',
    'TTgg.pp...............TT',
    'TT...pp...............TT',
    'TT...pp...............TT',
    'TT...ppppppppppppp....TT',
    'TT...ppppppppppppp....TT',
    'TT........pp..........TT',
    'TTgggggg..pp..ggggggg.TT',
    'TTgggggg..pp..ggggggg.TT',
    'TTgggggg..pp..ggggggg.TT',
    'TT..F.....pp..........TT',
    'TT........pp.....O....TT',
    'TT.ggg....pp....ggg...TT',
    'TT.ggg....pp....ggg...TT',
    'TTTTTTTTTTppTTTTTTTTTTTT',
    'TTTTTTTTTTppTTTTTTTTTTTT'
  ]);
  bridge(b, 5, 14, 2, 2);
  motel(b, 'viajero', 13, 17);
  b.obj({ kind: 'sign', x: 12, y: 21, text: ['MOTEL EL VIAJERO', 'Piezas limpias y agua caliente. La noche vale $300.'] });
  for (const [x, y] of [[12, 18], [21, 19]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 14, y: 6, text: ['RUTA 26', 'Norte: Pueblo Llanero · Sur: Pueblo Ribera'] });
  b.npc({ id: 'r26vaquera', look: 'lass', x: 7, y: 11, dir: 2, sight: 2, trainer: T('Vaquera Rosalba', 'lass', [['arrieron', 32], ['chiguiron', 33]], 1450, ['¡Del llano al río se baja galopando!'], ['¡Me tumbaste del caballo!'], ['Abajo queda Pueblo Ribera. Allá se come el mejor pescado.']) });
  b.npc({ id: 'r26pescador', look: 'sailor', x: 9, y: 13, dir: 2, sight: 3, trainer: T('Pescador Wilson', 'sailor', [['garzon', 33], ['doradon', 33]], 1480, ['¡Shh! Me espantas los peces... ¡A pelear, entonces!'], ['Hoy no pica nada.'], ['Este caño baja de la sabana y se junta con el río.']) });
  b.npc({ id: 'r26arriero', look: 'hiker', x: 12, y: 26, dir: 2, sight: 1, trainer: T('Arriero Josué', 'hiker', [['torazo', 33], ['llamita', 33], ['carnerazo', 34]], 1520, ['¡Llevo ganado al pueblo y tú me estás atajando!'], ['Pase, pase.'], ['En el motel de arriba duerme todo el que baja del llano.']) });
  b.npc({ id: 'r26viajero', look: 'man', x: 19, y: 23, dir: 1, wander: 1, talk: ['Bajé del llano a pie. Mañana sigo hasta Ciudad Cascada.', 'Dicen que allá hay un gimnasio que no sale en la guía de la Liga.'] });
  return b.build();
}

// ---------------------------------------------------------------- PUEBLO RIBERA
function ribera() {
  const b = new MapBuilder('ribera', 40, 32).meta({ name: 'Pueblo Ribera', outdoor: true, origin: [-112, 104], battleBg: 'grass' });
  const mid = 'TTTwww................pp..............TT';
  const rows = [
    'TTTTTTTTTTTTTTTTTTTTTTppTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTppTTTTTTTTTTTTTTTT'
  ];
  for (let y = 2; y < 14; y++) rows.push(mid);
  rows.push('TTTwww..pppppppppppppppppppppppppppppppp', 'TTTwww..pppppppppppppppppppppppppppppppp');
  for (let y = 16; y < 25; y++) rows.push(mid);
  rows.push('TTTwww..ppppppppppppppppppppppppppppppTT', 'TTTwww..ppppppppppppppppppppppppppppppTT');
  rows.push('TTTwwwssssssssssssssssssssssssssssssssTT');
  rows.push('TTTwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwTT', 'TTTwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwTT');
  rows.push('T'.repeat(40), 'T'.repeat(40));
  b.rows(0, 0, rows);
  b.rect(11, 3, 2, 1, 'F').rect(34, 17, 3, 1, 'F').rect(7, 17, 2, 1, 'F').rect(34, 2, 3, 1, 'F');
  for (const [x, y] of [[9, 27], [16, 27], [26, 27], [35, 27]]) b.set(x, y, 'J');
  b.building('house', 25, 9, 6, 4, POSADA, 'posadaRibera', 6, 7)
    .building('house', 32, 9, 5, 4, TIENDA, 'tiendaRibera', 5, 6)
    .building('house', 27, 4, 5, 3, { roof: '#4a8a9a', doorCol: 2 }, 'casaRibera', 4, 5);
  lot(b, 'ribera1', 7, 4, [19, 13]);
  lot(b, 'ribera2', 7, 15, [19, 24]);
  lot(b, 'ribera3', 24, 15, [36, 24]);
  b.obj({ kind: 'fountain', x: 17, y: 4, w: 2, h: 2 });
  for (const [x, y] of [[16, 7], [19, 7]]) b.obj({ kind: 'bench', x, y });
  for (const [x, y] of [[21, 13], [24, 16], [7, 16], [21, 24], [37, 13]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'boat', x: 29, y: 28, w: 3, h: 1, text: ['Una chalupa de madera para cruzar el río.'] });
  b.obj({ kind: 'sign', x: 24, y: 3, text: ['PUEBLO RIBERA', 'Donde el río se calma y la gente también.'] });
  b.obj({ kind: 'sign', x: 37, y: 16, text: ['RUTA 27 → CAÑO DE LOS COLORES', 'Siguiendo el río hacia el oriente.'] });
  cita(b, 'samuel'); cita(b, 'felipe');
  b.npc({ id: 'riberaPescador', look: 'sailor', x: 31, y: 27, dir: 0, wander: 2, talk: ['El río trae de todo: peces, troncos y una que otra criatura rara.', 'Cuando crece, el pueblo entero sube las cosas al segundo piso.'] });
  b.npc({ id: 'riberaNina', look: 'girl', x: 20, y: 10, dir: 0, wander: 2, talk: ['¡En los lotes de aquí la gente construye su casa!', 'Mi papá dice que algún día vamos a tener una con piscina.'] });
  b.npc({ id: 'riberaRegalo', look: 'old', x: 34, y: 6, dir: 0, talk: 'regalo', arg: { flag: 'regaloRibera', item: 'perlaDeRio', n: 2, who: 'Doña Eulalia', lines: ['¡Qué milagro, alguien nuevo en el pueblo!', 'Tenga, mijo: las saqué del río cuando era jovencita.'], after: ['El río nunca se queda quieto. Ni la gente buena tampoco.'] } });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 27 (orillas del río)
function ruta27() {
  const b = new MapBuilder('ruta27', 42, 16).meta({ name: 'Ruta 27', outdoor: true, origin: [-72, 112], encounters: 'ruta27', battleBg: 'beach' });
  b.rows(0, 0, [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT..ggggg.........ww....ggggg......O....TT',
    'TT..ggggg.........ww....ggggg...........TT',
    'TT..ggggg.........ww....ggggg...........TT',
    'TT................ww....................TT',
    'pppppppppppppppppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppppppppppppppppp',
    'TT................ww....................TT',
    'TT..gggg..........ww......gggggg........TT',
    'TT..gggg..........ww......gggggg........TT',
    'TTssssssssssssssssssssssssssssssssssssssTT',
    'TTwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwTT',
    'TTwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
  ]);
  b.rect(18, 11, 2, 1, 'w');
  bridge(b, 18, 6, 2, 2);
  for (const [x, y] of [[8, 11], [28, 11], [35, 11]]) b.set(x, y, 'J');
  b.obj({ kind: 'sign', x: 2, y: 5, text: ['RUTA 27', 'Oeste: Pueblo Ribera · Este: Caño de los Colores'] });
  b.npc({ id: 'r27pescador', look: 'sailor', x: 10, y: 8, dir: 1, sight: 1, trainer: T('Pescadora Yamile', 'sailor', [['temblon', 34], ['bufeito', 34]], 1550, ['¡Lo que sale del río es mío!'], ['¡Se me fue el pescado y el combate!'], ['Las anguilas de aquí dan corrientazo. Cuidado al pisar el agua.']) });
  b.npc({ id: 'r27nadador', look: 'swimmer', x: 33, y: 9, dir: 1, sight: 2, trainer: T('Nadador Brayan', 'swimmer', [['caimancito', 35], ['garzon', 34], ['doradon', 35]], 1600, ['¡Crucé este río ida y vuelta esta mañana!'], ['Ahora sí me cansé.'], ['Más adelante el agua se pone de colores. No es mentira.']) });
  b.npc({ id: 'r27bicho', look: 'bugkid', x: 22, y: 4, dir: 0, sight: 2, trainer: T('Cazabichos Kevin', 'bugkid', [['cucarron', 34], ['mariposol', 35]], 1580, ['¡Este escarabajo tiene coraza de metal!'], ['¡Y aun así perdió!'], ['Los bichos de la selva son más bravos que los del llano.']) });
  b.npc({ id: 'r27lavandera', look: 'mom', x: 9, y: 10, dir: 0, wander: 1, talk: ['Aquí lavamos la ropa desde que mi abuela era niña.', 'El río se lleva el jabón y nos devuelve los chismes del pueblo.'] });
  return b.build();
}

// ---------------------------------------------------------------- CAÑO DE LOS COLORES
function cano() {
  const b = new MapBuilder('cano', 36, 30).meta({ name: 'Caño de los Colores', outdoor: true, origin: [-30, 100], encounters: 'cano', battleBg: 'grass', waterTint: 'colores' });
  b.rows(0, 0, [
    'TTTTTTTTTTTTppTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTppTTTTTTTTTTTTTTTTTTTTTT',
    'TT..ggggg...pp.....OO.....gggggg..TT',
    'TT..ggggg...pp..............gggg..TT',
    'TT..ggggg...pp.......F......gggg..TT',
    'TT..........pp..O.....FF..........TT',
    'TT.O........pp.........F..........TT',
    'TT..........pp.........gggggg.....TT',
    'TT..gggg....pp.........gggggg.....TT',
    'TT..gggg....pp.........gggggg.....TT',
    'TT..gggg....pppppppppppppppppppppppp',
    'TT..........pppppppppppppppppppppppp',
    'TT.sssssssssppssssssssssssssssssssTT',
    'TTwwwwwwwwwwppwwwwwwwwwwwwwwwwwwwwTT',
    'TTwwwwwwwwwwppwwwwwwwwwwwwwwwwwwwwTT',
    'TT.sssssssssppssssssssssssssssssssTT',
    'TT..........pp.........ggg......O.TT',
    'TT..gggg....pp.........ggg........TT',
    'pppppppppppppp.......ggg.....O....TT',
    'pppppppppppppppppppppppp..........TT',
    'TT..ggggg.......pppppppp..........TT',
    'TT..ggggg.....O.pp.KKKKKKKKK..ggg.TT',
    'TT..ggggg.......pp.KKKKKKKKK..ggg.TT',
    'TT..............pp.KKKKKKKKK......TT',
    'TT..F...........pp.KKKpKKKKK...F..TT',
    'TT..............pppppppp..........TT',
    'TT....O.....................O.....TT',
    'TT.........F..........F...........TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
  ]);
  bridge(b, 12, 13, 2, 2);
  // La boca de la cueva mira al sur (se ve de frente con la cámara): se entra caminando hacia arriba.
  b.obj({ kind: 'cave', x: 22, y: 24, solid: false });
  b.warp(22, 24, 'guacharo', 15, 1, { face: 0, needDir: 1 });
  b.obj({ kind: 'sign', x: 14, y: 8, text: ['CAÑO DE LOS COLORES', 'El río de cinco colores: rojo, amarillo, verde, azul y negro.', 'Las plantitas del fondo se ponen rojas cuando pega el sol.'] });
  b.obj({ kind: 'sign', x: 25, y: 25, text: ['CUEVA GUÁCHARO', 'Adentro viven aves que sólo salen de noche.', 'Al otro lado sale a la Ruta 28.'] });
  b.obj({ kind: 'sign', x: 15, y: 2, text: ['RUTA 29 ↑ EL MANGLAR', 'Por la selva se vuelve a la sabana.'] });
  // El Mohán sale del caño de noche, cuando ya tienes la Medalla Arcoíris.
  b.obj({ kind: 'shimmer', x: 26, y: 12, solid: true, legend: 'mohan', when: st => rainbow(st) && !st.flags.mohan && isNight(st), script: 'leyenda' });
  b.npc({ id: 'canoNaturalista', look: 'girl', x: 16, y: 9, dir: 0, sight: 1, trainer: T('Naturalista Paola', 'girl', [['bufeon', 36], ['iguanon', 36], ['colibron', 37]], 1650, ['¡No pises las plantitas rojas del fondo!'], ['Bueno, me ganaste sin pisarlas. Bien.'], ['El caño sólo se pone de colores unos meses al año. Tuviste suerte.']) });
  b.npc({ id: 'canoGuia', look: 'hiker', x: 8, y: 17, dir: 0, sight: 1, trainer: T('Guía Eduardo', 'hiker', [['alacranzo', 36], ['espinon', 36], ['penon', 37]], 1680, ['¡Yo traigo turistas aquí todos los días!'], ['Hoy el turista me ganó.'], ['La cueva del sur sale al bosque de niebla. Lleve linterna.']) });
  b.npc({ id: 'canoExplorador', look: 'man', x: 18, y: 23, dir: 2, sight: 1, trainer: T('Explorador Ramiro', 'man', [['caimanazo', 37], ['temblon', 37], ['alacranzo', 37]], 1720, ['¡Busco la entrada de la Cueva Guácharo!'], ['Ya sé dónde queda: justo detrás de mí.'], ['Dicen que adentro brilla algo dorado. ¿Será el Tunjo?']) });
  b.npc({ id: 'canoRegalo', look: 'guard', x: 30, y: 16, dir: 2, talk: 'regalo', arg: { flag: 'regaloCano', item: 'rocioPuro', n: 2, who: 'Guardaparques Nelly', lines: ['Bienvenido al caño. Aquí se mira y no se toca.', 'Tome: rocío del río, para que sus criaturas aguanten la caminata.'], after: ['Si ve basura, échela al morral. El caño se lo agradece.'] } });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 29 (selva del Caño, sube al Manglar)
function ruta29() {
  const b = new MapBuilder('ruta29', 16, 30).meta({ name: 'Ruta 29 · Selva del Caño', outdoor: true, biome: 'jungle', origin: [-24, 70], encounters: 'ruta29', battleBg: 'grass' });
  b.rows(0, 0, [
    'TTTTTTTTppTTTTTT',
    'TTTTTTTTppTTTTTT',
    'TTggg...pp.gggTT',
    'TTggg...pp.gggTT',
    'TTggg...pp.gggTT',
    'TT......pp....TT',
    'TT..pppppp..T.TT',
    'TT..pppppp....TT',
    'TT..pp..ggggg.TT',
    'TT..pp..ggggg.TT',
    'TTg.pp..ggggg.TT',
    'TTg.pp........TT',
    'TTg.pp...O....TT',
    'TT..pp........TT',
    'TT..pppppppp..TT',
    'TT..pppppppp..TT',
    'TTggg.....pp..TT',
    'TTggg.....pp.gTT',
    'TTggg.....pp.gTT',
    'TT........pp..TT',
    'TT..F.....pp..TT',
    'TT....pppppp..TT',
    'TT....pppppp..TT',
    'TT.gg.pp..ggg.TT',
    'TT.gg.pp..ggg.TT',
    'TT.gg.pp..ggg.TT',
    'TT....pp......TT',
    'TT.F..pp...O..TT',
    'TTTTTTppTTTTTTTT',
    'TTTTTTppTTTTTTTT'
  ]);
  b.obj({ kind: 'sign', x: 10, y: 5, text: ['RUTA 29 · SELVA DEL CAÑO', 'Norte: el Manglar · Sur: Caño de los Colores'] });
  // La Madremonte cuida lo más tupido de la selva (con la Medalla Arcoíris).
  b.obj({ kind: 'shimmer', x: 12, y: 11, solid: true, legend: 'madremonte', when: st => rainbow(st) && !st.flags.madremonte, script: 'leyenda' });
  b.npc({ id: 'r29cazador', look: 'bugkid', x: 6, y: 9, dir: 2, sight: 1, trainer: T('Cazabichos Andrés', 'bugkid', [['cucarron', 33], ['guacarin', 33]], 1500, ['¡En esta selva los bichos parecen joyas!'], ['¡Se me escaparon todos!'], ['Allá en lo tupido dicen que vive la Madremonte.']) });
  b.npc({ id: 'r29biologa', look: 'lass', x: 12, y: 16, dir: 2, sight: 2, trainer: T('Bióloga Tatiana', 'lass', [['tigrillo', 34], ['iguanon', 34], ['perezon', 34]], 1540, ['¡Estoy contando tigrillos! ¿Has visto alguno?'], ['Uno: el que me ganó.'], ['Los guacamayos de aquí se aprenden tu nombre si les hablas.']) });
  b.npc({ id: 'r29montanero', look: 'hiker', x: 8, y: 25, dir: 2, sight: 1, trainer: T('Montañero Fredy', 'hiker', [['guacamaron', 34], ['tigrillo', 35]], 1580, ['¡Uf, qué calor! Peleemos rapidito.'], ['Rapidito perdí.'], ['Al sur la selva se abre y se ve el caño de colores.']) });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD CASCADA
function cascada() {
  const b = new MapBuilder('cascada', 48, 36).meta({ name: 'Ciudad Cascada', outdoor: true, paved: true, origin: [6, 96], encounters: 'cascadaParque', battleBg: 'grass' });
  const park = [
    '.ggggg..FFF..ggggg..', '.ggggg.......ggggg..', '.ggggg.......ggggg..', '....................',
    '..F................F', '....................', '.gggg...........gggg', '.gggg...........gggg',
    '.gggg...FFFF....gggg', '....................', '..ggggggg..ggggggg..', '..ggggggg..ggggggg..'
  ];
  const D20 = '....................', D44 = '.'.repeat(44);
  const rows = [];
  for (let y = 0; y < 4; y++) rows.push('TTKKKKKKwwwwKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKTT');
  for (let y = 4; y < 8; y++) rows.push('TT..wwwwwwwwwwww..............................TT');
  rows.push('TT.ssssssssssssss.............................TT');
  for (let y = 9; y < 14; y++) rows.push('TT' + D44 + 'TT');
  rows.push('p'.repeat(46) + 'TT', 'p'.repeat(46) + 'TT');
  rows.push('TT' + '.'.repeat(22) + 'pp' + D20 + 'TT');
  for (const p of park) rows.push('TT' + p + '..' + 'pp' + D20 + 'TT');
  rows.push('TT' + 'p'.repeat(44) + 'TT', 'TT' + 'p'.repeat(44) + 'TT');
  rows.push('TT' + '.'.repeat(22) + 'pp' + D20 + 'TT');
  rows.push('TT..FF..................pp...F................TT'.slice(0, 48));
  rows.push('TT' + '.'.repeat(22) + 'pp' + D20 + 'TT');
  rows.push('T'.repeat(24) + 'pp' + 'T'.repeat(22), 'T'.repeat(24) + 'pp' + 'T'.repeat(22));
  b.rows(0, 0, rows);
  b.rect(34, 12, 2, 2, 'p').rect(41, 4, 3, 1, 'F').rect(18, 4, 2, 2, 'F').rect(42, 9, 2, 2, 'F');
  b.gym('hada', 30, 5, 'gym9', 6, 14, { roof: '#f2a8d0', signColor: '#c8508a', emblem: '#ec86c4' });
  b.building('house', 5, 10, 6, 4, POSADA, 'posadaCascada', 6, 7)
    .building('house', 12, 10, 5, 4, TIENDA, 'tiendaCascada', 5, 6)
    .building('house', 18, 9, 5, 3, { roof: '#8a6ad0', doorCol: 2 }, 'casaCascada', 4, 5);
  lot(b, 'cascada1', 26, 18);
  lot(b, 'cascada2', 36, 18, [44, 28]);
  b.obj({ kind: 'fountain', x: 11, y: 21, w: 2, h: 2 });
  for (const [x, y] of [[8, 20], [15, 20]]) b.obj({ kind: 'bench', x, y });
  for (const [x, y] of [[4, 13], [17, 13], [23, 13], [29, 13], [40, 13], [23, 31], [26, 31], [45, 16]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'statue', x: 20, y: 6, text: ['LA CASCADA DEL ALBA', 'Dicen que el agua baja derechito del cielo.'] });
  b.obj({ kind: 'sign', x: 26, y: 13, text: ['CIUDAD CASCADA', 'Aquí el agua cae desde lo más alto del mundo.'] });
  b.obj({ kind: 'sign', x: 27, y: 32, text: ['RUTA 28 ↓ CALETA SOL', 'Por el bosque de niebla se baja hasta el mar.'] });
  cita(b, 'valentina'); cita(b, 'luciana');
  b.npc({ id: 'cascadaVieja', look: 'old', x: 20, y: 16, dir: 0, wander: 2, talk: ['El gimnasio de aquí no sale en la guía de la Liga.', 'Amaranta dice que la medalla es para quien quiera más, no para quien la necesite.'] });
  b.npc({ id: 'cascadaNino', look: 'kid', x: 6, y: 26, dir: 1, wander: 2, talk: ['¡En el pasto del parque salen Semaforines!', 'Cambian de color cuando se asustan. Rojo es que corras.'] });
  b.npc({ id: 'cascadaObrero', look: 'man', x: 40, y: 31, dir: 2, wander: 1, talk: ['Esos dos lotes están en venta.', 'Uno construye la casa como quiera y después la amobla por el computador.'] });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 28 (bosque de niebla, baja al mar)
function ruta28() {
  const b = new MapBuilder('ruta28', 20, 34).meta({ name: 'Ruta 28 · Bosque de Niebla', outdoor: true, origin: [20, 132], encounters: 'ruta28', battleBg: 'mountain', mist: true });
  b.rows(0, 0, [
    'TTTTTTTTTTppTTTTTTTT',
    'TTTTTTTTTTppTTTTTTTT',
    'TT..ggg...pp..ggg.TT',
    'TT..ggg...pp..ggg.TT',
    'TT........pp......TT',
    'KKK.......pp...Y..TT',
    'KKK.......pp......TT',
    'KKK.......pp..ggg.TT',
    'KKpppppppppp..ggg.TT',
    'KKK.......pp..ggg.TT',
    'KKK.......pp......TT',
    'KKK...Y...pp...Y..TT',
    'TT........pp......TT',
    'TTggggg...pp.gggg.TT',
    'TTggggg...pp.gggg.TT',
    'TTggggg...pp.gggg.TT',
    'TT........pp......TT',
    'TT..Y.....pp....Y.TT',
    'TT........pp......TT',
    'TT........pp......TT',
    'TT........pp..ggg.TT',
    'TT........pp..ggg.TT',
    'TT........pp..ggg.TT',
    'TT........pp......TT',
    'TT...ppppppp......TT',
    'TT........pp......TT',
    'TT.ggg....pp.gggg.TT',
    'TT.ggg....pp.gggg.TT',
    'TT.ggg....pp.gggg.TT',
    'TT........pp......TT',
    'TT..F.....pp...F..TT',
    'TT........pp......TT',
    'TTTTTTTTTTppTTTTTTTT',
    'TTTTTTTTTTppTTTTTTTT'
  ]);
  b.obj({ kind: 'cave', x: 2, y: 8, solid: false });
  b.warp(2, 8, 'guacharo', 28, 15, { face: 2, needDir: 2 });
  motel(b, 'neblina', 2, 19);
  b.obj({ kind: 'sign', x: 12, y: 22, text: ['MOTEL LA NEBLINA', 'Cobijas gruesas y chocolate caliente. La noche vale $300.'] });
  b.obj({ kind: 'lamp', x: 12, y: 20 });
  b.obj({ kind: 'sign', x: 12, y: 4, text: ['RUTA 28 · BOSQUE DE NIEBLA', 'Norte: Ciudad Cascada · Sur: Caleta Sol'] });
  b.obj({ kind: 'sign', x: 4, y: 7, text: ['CUEVA GUÁCHARO', 'Al otro lado sale al Caño de los Colores.'] });
  b.npc({ id: 'r28caminante', look: 'hiker', x: 8, y: 3, dir: 3, sight: 2, trainer: T('Caminante Óscar', 'hiker', [['frailejon', 38], ['llamaron', 38], ['condorin', 39]], 1800, ['¡En la niebla uno no ve ni las manos! Pero a ti sí te vi.'], ['Mejor no te hubiera visto.'], ['Los frailejones parecen gente parada en la neblina.']) });
  b.npc({ id: 'r28fotografa', look: 'girl', x: 13, y: 16, dir: 2, sight: 2, trainer: T('Fotógrafa Lina', 'girl', [['lechuzon', 38], ['llamaron', 39]], 1830, ['¡Quieta ahí! ...Perdón, era para la foto. ¡Ahora sí, a pelear!'], ['Salió movida. Como yo.'], ['Abajo está Caleta Sol. Allá la niebla se vuelve brisa.']) });
  b.npc({ id: 'r28arriera', look: 'lass', x: 12, y: 29, dir: 2, sight: 1, trainer: T('Arriera Milena', 'lass', [['torazo', 39], ['frailejon', 40], ['llamaron', 40]], 1880, ['¡Bajo cargando café hasta el mar!'], ['Se me regó el café.'], ['En el motel de la ruta dan chocolate caliente. ¡Pruébelo!']) });
  return b.build();
}

// ---------------------------------------------------------------- CALETA SOL
function caleta() {
  const b = new MapBuilder('caleta', 40, 32).meta({ name: 'Caleta Sol', outdoor: true, origin: [0, 166], encounters: 'caleta', battleBg: 'beach' });
  const top = 'TT' + '.'.repeat(28) + 'pp' + '.'.repeat(6) + 'TT', mid = 'TT' + '.'.repeat(36) + 'TT';
  const rows = ['T'.repeat(30) + 'pp' + 'T'.repeat(8), 'T'.repeat(30) + 'pp' + 'T'.repeat(8)];
  for (let y = 2; y < 12; y++) rows.push(top);
  rows.push('TT' + 'p'.repeat(36) + 'TT', 'TT' + 'p'.repeat(36) + 'TT');
  for (let y = 14; y < 24; y++) rows.push(mid);
  rows.push('TT' + 's'.repeat(36) + 'TT', 'TT' + 's'.repeat(36) + 'TT');
  rows.push('TT' + 'g'.repeat(10) + 's'.repeat(17) + 'g'.repeat(9) + 'TT', 'TT' + 'g'.repeat(10) + 's'.repeat(17) + 'g'.repeat(9) + 'TT');
  for (let y = 28; y < 32; y++) rows.push('w'.repeat(40));
  b.rows(0, 0, rows);
  b.rect(24, 3, 3, 1, 'F').rect(3, 3, 3, 1, 'F').rect(34, 16, 3, 2, 'F');
  for (const [x, y] of [[13, 25], [21, 26], [27, 25], [33, 26], [5, 25]]) b.set(x, y, 'J');
  motel(b, 'brisa', 2, 7);
  b.building('house', 22, 8, 6, 4, POSADA, 'posadaCaleta', 6, 7)
    .building('house', 33, 8, 5, 4, TIENDA, 'tiendaCaleta', 5, 6)
    .building('house', 30, 19, 5, 3, { roof: '#2fa08a', doorCol: 2 }, 'casaCaleta', 4, 5);
  lot(b, 'caleta1', 11, 2, [21, 11]);
  lot(b, 'caleta2', 4, 14, [16, 24]);
  lot(b, 'caleta3', 17, 14, [29, 24]);
  for (const [x, y] of [[21, 7], [32, 7], [29, 14], [15, 23], [10, 11]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'boat', x: 14, y: 28, w: 3, h: 1, text: ['Una lancha con el nombre "La Sirena" pintado en azul.'] });
  b.obj({ kind: 'boat', x: 30, y: 29, w: 3, h: 1, text: ['Un bote de pesca. Huele a mar y a gasolina.'] });
  b.obj({ kind: 'sign', x: 29, y: 3, text: ['CALETA SOL', 'Arena blanca, agua tibia y pescado frito.'] });
  b.obj({ kind: 'sign', x: 10, y: 9, text: ['MOTEL BRISA MARINA', 'Con vista al mar. La noche vale $300.'] });
  cita(b, 'mariana'); cita(b, 'julian');
  b.npc({ id: 'caletaPescador', look: 'sailor', x: 26, y: 27, dir: 0, wander: 2, talk: ['Aquí se pesca de madrugada y se duerme la siesta al mediodía.', 'Las tortugas Careyín ponen sus huevos en esta misma playa.'] });
  b.npc({ id: 'caletaNina', look: 'girl', x: 8, y: 13, dir: 0, wander: 2, talk: ['¡Mi primo construyó una casa en el lote de allá!', 'Tiene piscina... ¡y está al lado del mar! ¿Para qué la piscina?'] });
  b.npc({ id: 'caletaNadadora', look: 'swimmer', x: 35, y: 26, dir: 2, sight: 2, trainer: T('Nadadora Yuli', 'swimmer', [['careyon', 40], ['meduson', 40], ['cangrejon', 41]], 1950, ['¡El mar de aquí es mi gimnasio!'], ['Me revolcó la ola.'], ['Las tortugas de la playa son lentas en tierra pero en el agua vuelan.']) });
  b.npc({ id: 'caletaRegalo', look: 'old', x: 36, y: 21, dir: 2, talk: 'regalo', arg: { flag: 'regaloCaleta', item: 'perlaDeRio', n: 3, who: 'Don Faustino', lines: ['Sesenta años pescando y nunca me había sobrado nada.', 'Hoy sí: tome estas perlas. Me las dio el mar, se las doy a usted.'], after: ['El mar no tiene dueño. Por eso es de todos.'] } });
  return b.build();
}

// ---------------------------------------------------------------- CUEVA GUÁCHARO (atajo: Caño ↔ Ruta 28)
function guacharo() {
  const b = new MapBuilder('guacharo', 30, 20, 'c').meta({ name: 'Cueva Guácharo', outdoor: false, encounters: 'guacharo', allEncounter: true, battleBg: 'cave', dark: true, voidColor: '#0a0806' });
  b.rows(0, 0, [
    'RRRRRRRRRRRRRRRcRRRRRRRRRRRRRR',
    'RccccccccRRRRRcccccccRRRccccRR',
    'RccOcccccRRRRRccccOccRRRccccRR',
    'RcccccRccRRRRRcccccccccccccccR',
    'RRRcccRcccccRRccccRRRRRccccccR',
    'RRRcccRcccccRRccccRRRRRccOcccR',
    'RcccccccccccRRccccRRRRRccccccR',
    'RccRRRRRRccccccccccccRRRRRRccR',
    'RccRRRRRRcccccwwwwcccRRRRRRccR',
    'RccccccRRcccccwwwwcccccccccccR',
    'RccccccRRcccccwwwwcccccccccccR',
    'RRRRcccRRcccccccccccRRRRccRRRR',
    'RRRRcccRRccccccccccRRRRRccRRRR',
    'RcccccccccccRRRRcccRRRRRcccccR',
    'RcOccccccOccRRRRcccccccccccccR',
    'RccccRRRRRccRRRRcccccccccccccc',
    'RccccRRRRRccRRRRccccRRRRRccccR',
    'RccccccccccccccccccRRRRRRccccR',
    'RccccccOcccccccccccRRRRRRccccR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'
  ]);
  b.warp(15, 0, 'cano', 22, 25, { face: 0 });
  b.warp(29, 15, 'ruta28', 3, 8, { face: 3 });
  for (const [x, y] of [[2, 1], [8, 6], [19, 3], [27, 9], [1, 13], [11, 17], [27, 17], [24, 3]]) b.obj({ kind: 'crystal', x, y });
  // Leyendas de la cueva: el Tunjo en la sala dorada y Esmeraldón en la veta verde (con la Medalla Arcoíris).
  b.obj({ kind: 'shimmer', x: 26, y: 1, solid: true, legend: 'tunjo', when: st => rainbow(st) && !st.flags.tunjo, script: 'leyenda' });
  b.obj({ kind: 'shimmer', x: 3, y: 17, solid: true, legend: 'esmeraldon', when: st => rainbow(st) && !st.flags.esmeraldon, script: 'leyenda' });
  b.npc({ id: 'guacharoEspeleo', look: 'hiker', x: 10, y: 7, dir: 3, sight: 3, trainer: T('Espeleóloga Diana', 'hiker', [['lechuzon', 37], ['alacranzo', 37], ['cuarzon', 38]], 1750, ['¡Shh! Los guácharos duermen de día. ¡Peleemos pasito!'], ['Pasito perdí.'], ['Los guácharos salen de noche a comer frutas. Se orientan con el eco.']) });
  b.npc({ id: 'guacharoMinero', look: 'man', x: 24, y: 14, dir: 2, sight: 4, trainer: T('Minero Gildardo', 'man', [['penon', 38], ['alacranzo', 39]], 1800, ['¡Esta veta es mía! Bueno... de la cueva. ¡Pero yo la encontré!'], ['Quédese con la veta.'], ['Por el oriente sale a la Ruta 28. Por el norte, al caño.']) });
  b.npc({ id: 'guacharoSabia', look: 'old', x: 4, y: 9, dir: 3, talk: 'regalo', arg: { flag: 'regaloGuacharo', item: 'escamaAntigua', n: 1, who: 'Doña Custodia', lines: ['Llevo cuarenta años estudiando esta cueva.', 'Encontré esto en la sala del fondo. Llévesela: aquí sólo junta polvo.'], after: ['Dicen que en la sala dorada duerme un Tunjo. Yo nunca lo he visto despierto.'] } });
  return b.build();
}

// ---------------------------------------------------------------- GIMNASIO ARCOÍRIS (extra, tipo Hada)
function gym9() {
  return gymGen('gym9', 'Gimnasio Cascada', 'hada', ['cascada', 34, 12],
    { look: 'amaranta', talk: 'lider', trainer: T('Líder Amaranta', 'amaranta', [['colibron', 44], ['cuarzon', 45], ['orbelina', 46], ['astrocuarzo', 47]], 6000, ['Bienvenido a mi gimnasio. Soy Amaranta.', 'Esta medalla no la pide la Liga. Es para quien quiere ver todos los colores.', '¿Vienes por ella?'], ['Ganaste con todos los colores. La Medalla Arcoíris es tuya.'], ['Con la Medalla Arcoíris, las leyendas del sur te van a salir al paso.', 'Busca en el caño de noche, en la selva y en lo más hondo de la Cueva Guácharo.'], { alba: true }), badge: 'arcoiris' },
    [
      { look: 'lass', x: 3, y: 9, dir: 3, sight: 3, trainer: T('Bailarina Celeste', 'lass', [['colibron', 41], ['orbelina', 42]], 1900, ['¡Bailo con los colores del arcoíris!'], ['Me salí del compás.'], ['Amaranta usa criaturas de tipo Hada. El Acero y el Veneno les hacen daño.']) },
      { look: 'man', x: 9, y: 6, dir: 2, sight: 3, trainer: T('Joyero Nelson', 'man', [['cuarzon', 42], ['astrocuarzo', 43]], 2000, ['¡Mis cristales brillan más que tus medallas!'], ['Se me rayó el cristal.'], ['La líder es la de los ojos de colores. No le quite la vista a sus criaturas.']) }
    ]);
}

export function connectSouthZone(maps) {
  // Pueblo Llanero → Ruta 26: camino de dos casillas hasta el borde sur.
  maps.sabana.tiles = maps.sabana.tiles.map((row, j) => j >= 16 ? row.slice(0, 20) + 'pp' + row.slice(22) : row);
  maps.sabana.objects.push({ kind: 'sign', x: 22, y: 28, text: ['RUTA 26 ↓ PUEBLO RIBERA', 'Al sur se baja al río: pueblos, motel, lotes en venta y un gimnasio extra.'] });
  const arpista = maps.sabana.npcs.find(n => n.id === 'sabanaArpista');
  if (arpista) { arpista.x = 24; arpista.y = 17; }
  // Manglar → Ruta 29: el camino del manglar sigue hasta el borde sur.
  maps.manglar.tiles = maps.manglar.tiles.map((row, j) => j >= 24 ? row.slice(0, 20) + 'pp' + row.slice(22) : row);
  maps.manglar.objects.push({ kind: 'sign', x: 22, y: 26, text: ['RUTA 29 ↓ CAÑO DE LOS COLORES', 'Por la selva se llega al río de cinco colores.'] });
}

export function buildSouthZone() {
  const list = [ruta26(), ribera(), ruta27(), cano(), ruta29(), cascada(), ruta28(), caleta(), guacharo(), gym9(),
    posadaGen('posadaRibera', 'Posada de la Ribera', ['ribera', 28, 13]), tiendaGen('tiendaRibera', 'Tienda de la Ribera', ['ribera', 34, 13], 'ribera'),
    posadaGen('posadaCascada', 'Posada de la Cascada', ['cascada', 8, 14]), tiendaGen('tiendaCascada', 'Tienda de la Cascada', ['cascada', 14, 14], 'cascada'),
    posadaGen('posadaCaleta', 'Posada de la Caleta', ['caleta', 25, 12]), tiendaGen('tiendaCaleta', 'Tienda de la Caleta', ['caleta', 35, 12], 'caleta'),
    casaGen('casaRibera', 'Casa de la balsera', 'mom', ['Mi abuelo pasaba gente en balsa de un lado al otro del río.', 'Ahora hay puente, pero la balsa la guardamos de recuerdo.'], ['ribera', 29, 7], '#e6f0ee'),
    casaGen('casaCascada', 'Casa del pintor', 'man', ['Pinto la cascada todos los días y nunca me sale igual.', 'El agua no se deja pintar quieta.'], ['cascada', 20, 12], '#efe6f6'),
    casaGen('casaCaleta', 'Casa del pescador', 'sailor', ['Las redes las tejo yo mismo. Una red buena dura diez años.', 'Una mala, una tarde.'], ['caleta', 32, 22], '#dff0ea')
  ];
  for (const [id, [map, x, y]] of Object.entries(MOTEL_DOORS)) list.push(motelGen('motel_' + id, MOTEL_NAMES[id], [map, x, y], id));
  for (const [id, L] of Object.entries(LOTS)) list.push(casaPropiaGen('casa_' + id, id, [L.map, L.door[0], L.door[1] + 1]));
  return list;
}
export const MOTEL_NAMES = { viajero: 'Motel El Viajero', neblina: 'Motel La Neblina', brisa: 'Motel Brisa Marina' };
