// La región grande de Alborada: los cinco gimnasios que faltan, al este y al norte de Ciudad Marea.
//   Marea → Ruta 6 → Ciudad Voltio (Eléctrico) → Ruta 7 → Pueblo Niebla (Fantasma) → Ruta 8 → Villa Cafetal (Lucha)
//   → Ruta 9 (paso nevado) → Ciudad Escarcha (Hielo) → Ruta 10 → Ciudad Albor (Dragón) → Ruta 11 → Ruta 5 y la Liga.
// Cada ciudad tiene gimnasio (edificio 3D de su tipo), posada, tienda y una casa; cada ruta, entrenadores y encuentros.
// Los mapas exteriores comparten el plano global (origin) con el resto para que los bordes empaten sin cortes.
import { MapBuilder } from './builder.js';
import { posadaGen, tiendaGen, casaGen, gymGen } from './maps2.js';
import { hasBadge } from '../data/gyms.js';

const T = (name, look, party, money, intro, defeat, after, extra = {}) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat), ...extra });
// Dibuja el mapa por filas (cada fila del ancho exacto del mapa).
const drawErrors = [];
const draw = (b, rows) => {
  if (rows.length !== b.def.h) drawErrors.push(`${b.def.id}: tiene ${rows.length} filas y no ${b.def.h}`);
  rows.forEach((r, y) => { if (r.length !== b.def.w) drawErrors.push(`${b.def.id}: la fila ${y} mide ${r.length} y no ${b.def.w}`); });
  b.rows(0, 0, rows); return b;
};
const rep = (s, n) => s.repeat(n);
// Salida vigilada: el guardia sólo frena a quien sale de la ciudad hacia la ruta siguiente sin la medalla
// (dir: 0 abajo, 1 arriba, 2 izquierda, 3 derecha). Quien llega por esa ruta entra sin problema.
const gate = (b, x, y, w, h, badge, dir, script) => b.trigger({ x, y, w, h, when: st => st.dir === dir && !hasBadge(st, badge), script });

// ---------------------------------------------------------------- RUTA 6 (costa: Marea → Voltio)
function ruta6() {
  const b = new MapBuilder('ruta6', 32, 16).meta({ name: 'Ruta 6', outdoor: true, origin: [130, -24], encounters: 'ruta6', battleBg: 'beach' });
  draw(b, [
    rep('T', 32), rep('T', 32),
    'TT..gggg....TTT...gggggggg....TT',
    'TT..gggg.....T....gggggggg....TT',
    'TT..gggg.pppppppppp.....F.....TT',
    'TT.......pp......pp.....FF....TT',
    'TT.......pp..ggg.pp...........TT',
    'TT.......pp..ggg.pp....ggggg..TT',
    rep('p', 12) + '.ggg.' + rep('p', 15),
    rep('p', 12) + '.....' + rep('p', 15),
    'TT....F.......ggg......ggggg..TT',
    'TT..........J.ggg.....J.......TT',
    'TT' + rep('s', 28) + 'TT', 'TT' + rep('s', 28) + 'TT',
    rep('w', 32), rep('w', 32)
  ]);
  b.obj({ kind: 'sign', x: 3, y: 10, text: ['RUTA 6', 'Oeste: Ciudad Marea · Este: Ciudad Voltio'] });
  b.npc({ id: 'r6marino', look: 'sailor', x: 26, y: 5, dir: 0, wander: 2, talk: ['¿Ves las aspas allá al este? Son los molinos de Ciudad Voltio.', 'Con ese viento se carga media región.'] });
  b.npc({ id: 'r6nadadora', look: 'swimmer', x: 20, y: 12, dir: 1, sight: 3, trainer: T('Nadadora Paula', 'swimmer', [['meduson', 27], ['nivalmar', 27]], 1100, ['¡Vengo nadando desde Marea! ¡Y tengo energía de sobra!'], ['¡Me cogió la corriente!'], ['En Voltio hay una líder que brilla como un rayo.']) });
  b.npc({ id: 'r6chica', look: 'lass', x: 6, y: 6, dir: 3, sight: 3, trainer: T('Chica Valentina', 'lass', [['voltaz', 27], ['tormavis', 28]], 1150, ['¡Mis criaturas están cargadas al cien!'], ['¡Se me fue la luz!'], ['Lleva criaturas de Tierra a Voltio. Me lo agradecerás.']) });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD VOLTIO (Eléctrico)
function voltio() {
  const b = new MapBuilder('voltio', 34, 30).meta({ name: 'Ciudad Voltio', outdoor: true, paved: true, origin: [162, -36], battleBg: 'grass' });
  const mid = (a, c) => 'TT' + a + 'pp' + c + 'TT';
  draw(b, [
    rep('T', 16) + 'pp' + rep('T', 16), rep('T', 16) + 'pp' + rep('T', 16),
    mid(rep('.', 14), rep('.', 14)), mid(rep('.', 14), rep('.', 14)), mid(rep('.', 14), rep('.', 14)),
    mid(rep('.', 14), rep('.', 14)), mid(rep('.', 14), rep('.', 14)),
    mid('...p.....p....', rep('.', 14)), mid('...p.....p....', rep('.', 14)), mid('...p.....p....', rep('.', 14)),
    mid(rep('p', 14), '.......pp.....'), mid(rep('p', 14), '.......pp.....'),
    mid(rep('.', 14), '.......pp.....'), mid(rep('.', 14), '.......pp.....'), mid(rep('.', 14), '.......pp.....'), mid(rep('.', 14), '.......pp.....'),
    mid('....p.....p...', '.......pp.....'), mid('....p.....p...', '.......pp.....'), mid('....p.....p...', '.......pp.....'), mid('....p.....p...', '.......pp.....'),
    rep('p', 32) + 'TT', rep('p', 32) + 'TT',
    'TT' + rep('.', 30) + 'TT',
    'TT' + '..FF' + rep('.', 22) + 'FF..' + 'TT',
    'TT' + '..FF' + rep('.', 24) + 'F.' + 'TT',
    'TT' + rep('.', 30) + 'TT',
    'TT' + rep('.', 30) + 'TT',
    rep('T', 34), rep('T', 34), rep('T', 34)
  ]);
  b.gym('electrico', 21, 3, 'gym4', 6, 14, { roof: '#d8a020', signColor: '#c88a10', emblem: '#f0c820' })
    .building('house', 3, 12, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaVoltio', 6, 7)
    .building('house', 10, 12, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaVoltio', 5, 6)
    .building('house', 3, 4, 5, 3, { roof: '#5a8ad8', doorCol: 2 }, 'casaVoltio', 4, 5)
    .building('house', 8, 4, 5, 3, { roof: '#d89a3a', doorCol: 3 }, 'casaVoltio2', 4, 5);
  b.obj({ kind: 'fountain', x: 16, y: 23, w: 2, h: 2 });
  for (const [x, y] of [[15, 12], [19, 19], [9, 22], [24, 22]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 14, y: 22, text: ['CIUDAD VOLTIO', 'La ciudad del viento y la luz.'] });
  b.obj({ kind: 'sign', x: 18, y: 2, text: ['RUTA 7 → PUEBLO NIEBLA', 'Bosque de niebla. No te salgas del camino.'] });
  b.npc({ id: 'voltioIng', look: 'aide', x: 20, y: 24, dir: 2, wander: 2, talk: ['La líder Centella diseñó los molinos de la ciudad.', 'Dicen que sus criaturas corren más rápido que un rayo.'] });
  b.npc({ id: 'voltioNina', look: 'kid', x: 6, y: 25, dir: 0, wander: 2, talk: ['¡Cuando sea grande quiero un Elestrix!', 'Los Tormavis evolucionan cuando ya son muy fuertes.'] });
  b.npc({ id: 'guardiaVoltio', look: 'guard', x: 15, y: 2, dir: 0, talk: 'guardiaVoltio' });
  gate(b, 16, 1, 2, 1, 'chispa', 1, 'bloqueoVoltio');
  return b.build();
}

// ---------------------------------------------------------------- RUTA 7 (bosque de niebla: Voltio → Niebla)
function ruta7() {
  const b = new MapBuilder('ruta7', 16, 34).meta({ name: 'Ruta 7', outdoor: true, origin: [172, -70], encounters: 'ruta7', battleBg: 'grass' });
  draw(b, [
    'TTTTTTppTTTTTTTT', 'TTTTTTppTTTTTTTT',
    'TT....pp.gggggTT', 'TT....pp.gggggTT',
    'TTgg..pppppp..TT', 'TTgg..pppppp..TT',
    'TTgg......pp..TT', 'TTT.......pp.TTT',
    'TTT..ggg..pp.TTT', 'TT...ggg..pp..TT',
    'TT.ppppppppp..TT', 'TT.ppppppppp..TT',
    'TT.pp..ggggg..TT', 'TT.pp..ggggg..TT',
    'TTTpp.....TT..TT', 'TT.pp.....TT..TT',
    'TT.pp..ggg....TT', 'TT.pp..ggg....TT',
    'TT.pppppppppp.TT', 'TT.pppppppppp.TT',
    'TTgg....gg.pp.TT', 'TTgg....gg.pp.TT',
    'TT.....TTT.pp.TT', 'TT.ggg.....pp.TT',
    'TT.ggg.....pp.TT', 'TT....pppppppTTT',
    'TT....pppppppTTT', 'TTggg.pp.....TTT',
    'TTggg.pp..ggg.TT', 'TT....pp..ggg.TT',
    'TT....pp......TT', 'TTTTT.pp..TTTTTT',
    'TTTTTTppTTTTTTTT', 'TTTTTTppTTTTTTTT'
  ]);
  b.obj({ kind: 'sign', x: 8, y: 30, text: ['RUTA 7', 'Norte: Pueblo Niebla · Sur: Ciudad Voltio'] });
  b.npc({ id: 'r7medium', look: 'old', x: 2, y: 11, dir: 3, sight: 3, trainer: T('Médium Carmela', 'old', [['sombrador', 30], ['candelo', 30]], 1250, ['La niebla me dijo que vendrías...', '...y que perderías.'], ['La niebla se equivocó.'], ['En Pueblo Niebla las velas se prenden solas.']) });
  b.npc({ id: 'r7bicho', look: 'bugkid', x: 13, y: 19, dir: 2, sight: 4, trainer: T('Cazabichos Simón', 'bugkid', [['mentelin', 30], ['alasol', 31]], 1250, ['¡En la niebla salen los bichos más raros!'], ['¡Se me escaparon todos!'], ['Mentelin lee la mente. ¡Ojo con lo que piensas!']) });
  return b.build();
}

// ---------------------------------------------------------------- PUEBLO NIEBLA (Fantasma)
function niebla() {
  const b = new MapBuilder('niebla', 30, 28).meta({ name: 'Pueblo Niebla', outdoor: true, origin: [166, -98], battleBg: 'grass' });
  const mid = (a, c) => 'YY' + a + 'pp' + c + 'YY';
  draw(b, [
    rep('Y', 12) + 'pp' + rep('Y', 16), rep('Y', 12) + 'pp' + rep('Y', 16),
    mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)),
    mid('...p......', rep('.', 14)), mid('...p......', rep('.', 14)), mid('...p......', rep('.', 14)),
    mid('...p......', '......pp......'), mid('...p......', '......pp......'),
    'YY' + rep('p', 26) + 'YY', 'YY' + rep('p', 26) + 'YY',
    mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)), mid(rep('.', 10), rep('.', 14)),
    mid('....p.....', '....p.........'), mid('....p.....', '....p.........'),
    'YY' + rep('p', 26) + 'YY', 'YY' + rep('p', 26) + 'YY',
    mid(rep('.', 10), rep('.', 14)), mid('.FF.......', '..........FF..'), mid(rep('.', 10), rep('.', 14)),
    rep('Y', 12) + 'pp' + rep('Y', 16), rep('Y', 12) + 'pp' + rep('Y', 16)
  ]);
  b.gym('fantasma', 16, 3, 'gym5', 6, 14, { roof: '#5a3a7a', signColor: '#6a3a9a', emblem: '#8a6ad0' })
    .building('house', 3, 15, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaNiebla', 6, 7)
    .building('house', 16, 15, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaNiebla', 5, 6)
    .building('house', 3, 4, 5, 3, { roof: '#6a5a7a', doorCol: 2 }, 'casaNiebla', 4, 5);
  for (const [x, y] of [[4, 23], [7, 23], [20, 24], [24, 23], [27, 24]]) b.obj({ kind: 'statue', x, y, text: ['Una lápida vieja cubierta de musgo.', '"Aquí descansa un amigo fiel. Su vela nunca se apaga."'] });
  for (const [x, y] of [[11, 14], [14, 20], [25, 11]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 14, y: 24, text: ['PUEBLO NIEBLA', 'Donde la bruma no se levanta nunca.'] });
  b.obj({ kind: 'sign', x: 14, y: 3, text: ['RUTA 8 → VILLA CAFETAL', 'Sube por los cafetales de la montaña.'] });
  b.npc({ id: 'nieblaAbuela', look: 'old', x: 8, y: 13, dir: 0, wander: 2, talk: ['La líder Velia vive sola en la mansión desde niña.', 'Sus criaturas son fantasmas... pero muy cariñosos.'] });
  b.npc({ id: 'nieblaChica', look: 'girl', x: 22, y: 21, dir: 2, wander: 2, talk: ['De noche salen más criaturas de tipo Fantasma por aquí.', '¿Te dan miedo? A mí no... bueno, un poquito.'] });
  b.npc({ id: 'guardiaNiebla', look: 'guard', x: 11, y: 2, dir: 0, talk: 'guardiaNiebla' });
  gate(b, 12, 1, 2, 1, 'sombra', 1, 'bloqueoNiebla');
  return b.build();
}

// ---------------------------------------------------------------- RUTA 8 (cafetales de montaña: Niebla → Cafetal)
function ruta8() {
  const b = new MapBuilder('ruta8', 18, 34).meta({ name: 'Ruta 8', outdoor: true, origin: [170, -132], encounters: 'ruta8', battleBg: 'mountain' });
  draw(b, [
    'TTTTTTTTppTTTTTTTT', 'TTTTTTTTppTTTTTTTT',
    'TT.BBBB.pp.BBBB.TT', 'TT......pp......TT', 'TT.BBBB.pp.BBBB.TT',
    'TT......pppppp..TT', 'TTJ.gggg....pp..TT', 'TT..gggg....pp..TT',
    'TTKKKKKKKK..pp..TT', 'TT..........pp..TT', 'TT.BBBBB.BB.pp..TT',
    'TT.....pppppppJ.TT', 'TT.BBB.pp.BBBB..TT', 'TT.....pp.......TT',
    'TTggg..pp..ggg..TT', 'TTggg..pp..ggg..TT', 'TTKKKK.pp.KKKKKKTT',
    'TT.....pp.......TT', 'TT.BBB.pppppp...TT', 'TT.........pp...TT',
    'TTJ.ggggg..pp.J.TT', 'TT..ggggg..pp...TT', 'TT.BBBB....pp...TT',
    'TT......ppppp...TT', 'TT......pp......TT', 'TTKKKKK.pp.KKKKKTT',
    'TT......pp..ggg.TT', 'TT.BBB..pp..ggg.TT', 'TT......pp......TT',
    'TT.J....pp....J.TT', 'TT......pp......TT', 'TTTTTT..pp..TTTTTT',
    'TTTTTTTTppTTTTTTTT', 'TTTTTTTTppTTTTTTTT'
  ]);
  b.obj({ kind: 'sign', x: 10, y: 28, text: ['RUTA 8', 'Cafetales de la montaña. Norte: Villa Cafetal'] });
  b.npc({ id: 'r8recolector', look: 'man', x: 3, y: 13, dir: 3, wander: 1, talk: ['¡Estamos en cosecha! Cada grano rojo se recoge a mano.', 'El café de Villa Cafetal es el mejor de Alborada, no le crea a nadie más.'] });
  b.npc({ id: 'r8caficultor', look: 'man', x: 14, y: 9, dir: 2, sight: 2, trainer: T('Caficultor Juan', 'man', [['roedon', 33], ['seton', 34]], 1400, ['¡Ey! ¡Nadie pasa por mi cafetal sin echarse un combate!'], ['Uy, me dejó como un tinto sin azúcar.'], ['Don Tinto, el líder, levanta bultos de café como si nada.']) });
  b.npc({ id: 'r8karateca', look: 'hiker', x: 13, y: 19, dir: 2, sight: 2, trainer: T('Karateca Ramón', 'hiker', [['carnerazo', 34], ['magmor', 34]], 1450, ['¡Entreno subiendo esta montaña todos los días!'], ['¡Me faltó pierna!'], ['Contra Lucha, lleva Volador o Psíquico.']) });
  return b.build();
}

// ---------------------------------------------------------------- VILLA CAFETAL (Lucha)
function cafetal() {
  const b = new MapBuilder('cafetal', 36, 32).meta({ name: 'Villa Cafetal', outdoor: true, origin: [162, -164], battleBg: 'mountain' });
  const field = r => r % 2 ? '..BBBBBBBBBBBB..' : rep('.', 16);
  const south = (y, left) => 'TT' + left + 'pp' + field(y) + 'TT';
  draw(b, [
    rep('T', 36), rep('T', 36),
    'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT',
    'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT', 'TT' + rep('.', 32) + 'TT',
    'TT' + rep('.', 32) + 'TT',
    'TT' + rep('.', 22) + 'pp' + rep('.', 8) + 'TT',
    'TT' + '....p.....p...........pp........' + 'TT', 'TT' + '....p.....p...........pp........' + 'TT',
    rep('p', 34) + 'TT', rep('p', 34) + 'TT',
    'TT' + rep('.', 14) + 'pp' + rep('.', 16) + 'TT',
    south(17, rep('.', 14)), south(18, rep('.', 14)), south(19, rep('.', 14)),
    south(20, '...p..........'), south(21, '...p..........'), south(22, '...p..........'),
    south(23, '.ppppppppppppp'),
    south(24, rep('.', 14)), south(25, '..FF..........'), south(26, rep('.', 14)), south(27, rep('.', 14)), south(28, rep('.', 14)), south(29, rep('.', 14)),
    rep('T', 16) + 'pp' + rep('T', 18), rep('T', 16) + 'pp' + rep('T', 18)
  ]);
  b.gym('lucha', 20, 4, 'gym6', 6, 14, { roof: '#c8402a', signColor: '#c8402a', emblem: '#e06040' })
    .building('house', 3, 8, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaCafetal', 6, 7)
    .building('house', 10, 8, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaCafetal', 5, 6)
    .building('house', 3, 17, 5, 3, { roof: '#b8603a', doorCol: 2 }, 'casaCafetal', 4, 5);
  for (const [x, y] of [[15, 12], [2, 13], [18, 25]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 15, y: 16, text: ['VILLA CAFETAL', 'El café más rico de Alborada se cosecha a mano.'] });
  b.obj({ kind: 'sign', x: 3, y: 13, text: ['← RUTA 9 · PASO NEVADO', 'Ciudad Escarcha queda al otro lado de la montaña.'] });
  b.npc({ id: 'cafetalArriero', look: 'man', x: 22, y: 18, dir: 0, wander: 2, talk: ['¿Se toma un tintico? Aquí lo regalamos.', 'Don Tinto dice que el café le da la fuerza para entrenar.'] });
  b.npc({ id: 'cafetalAbuelo', look: 'old', x: 8, y: 25, dir: 0, wander: 2, talk: ['Mi abuelo sembró los primeros cafetos de esta montaña.', 'Las criaturas de tipo Lucha nos ayudan a cargar la cosecha.'] });
  b.npc({ id: 'guardiaCafetal', look: 'guard', x: 2, y: 16, dir: 1, talk: 'guardiaCafetal' });
  gate(b, 0, 14, 1, 2, 'puno', 2, 'bloqueoCafetal');
  return b.build();
}

// ---------------------------------------------------------------- RUTA 9 (paso nevado: Cafetal → Escarcha)
function ruta9() {
  const b = new MapBuilder('ruta9', 34, 16).meta({ name: 'Ruta 9', outdoor: true, snow: true, origin: [128, -154], encounters: 'ruta9', battleBg: 'mountain' });
  draw(b, [
    rep('Y', 34), rep('Y', 34),
    'YY..ggggg.....YYY.....gggg......YY',
    'YY..ggggg..O..YYY..O..gggg......YY',
    'YY......' + rep('p', 26),
    'YY......' + rep('p', 26),
    'YY......pp....KKKKK....gggg.....YY',
    'YY.ggg..pp..O...........gggg....YY',
    'YY.ggg..pp.....YYYY.....O.......YY',
    'YY......pp......................YY',
    rep('p', 10) + '...ggggg......O.......YY',
    rep('p', 10) + '...ggggg..............YY',
    'YY..O.........YYYY......ggg.....YY',
    'YY.......ggg..........O.........YY',
    rep('Y', 34), rep('Y', 34)
  ]);
  b.obj({ kind: 'sign', x: 30, y: 6, text: ['RUTA 9 · PASO NEVADO', 'Oeste: Ciudad Escarcha · Este: Villa Cafetal'] });
  b.npc({ id: 'r9esquiador', look: 'man', x: 20, y: 7, dir: 1, sight: 2, trainer: T('Esquiador Andrés', 'man', [['nivalmar', 37], ['ferrox', 37]], 1600, ['¡Bajé esquiando sólo para retarte!'], ['¡Me resbalé!'], ['En Escarcha la líder Nevada vive en un palacio de hielo.']) });
  b.npc({ id: 'r9montanera', look: 'hiker', x: 5, y: 9, dir: 3, sight: 3, trainer: T('Montañera Sofía', 'hiker', [['cuarzon', 37], ['arieton', 38]], 1650, ['¡En el nevado sólo sobreviven los fuertes!'], ['Bueno... tú sobrevives.'], ['Abrígate. En Escarcha nunca deja de nevar.']) });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD ESCARCHA (Hielo)
function escarcha() {
  const b = new MapBuilder('escarcha', 34, 30).meta({ name: 'Ciudad Escarcha', outdoor: true, snow: true, paved: true, origin: [94, -164], battleBg: 'mountain' });
  const row = s => 'YY' + s + 'YY';
  draw(b, [
    rep('Y', 34), rep('Y', 34),
    row(rep('.', 30)), row(rep('.', 30)), row(rep('.', 30)), row(rep('.', 30)), row(rep('.', 30)),
    row('...p' + rep('.', 26)), row('...p' + rep('.', 26)), row('...p' + rep('.', 26)),
    row('...p' + rep('.', 12) + 'pp' + rep('.', 12)), row('...p' + rep('.', 12) + 'pp' + rep('.', 12)),
    row('...ppppppp' + rep('.', 6) + 'pp' + rep('.', 12)),
    row(rep('.', 8) + 'pp' + rep('.', 6) + 'pp' + rep('.', 12)), row(rep('.', 8) + 'pp' + rep('.', 6) + 'pp' + rep('.', 12)),
    row(rep('.', 8) + 'pp' + rep('.', 6) + 'pp' + rep('.', 12)), row(rep('.', 8) + 'pp' + rep('.', 6) + 'pp' + rep('.', 12)),
    row('....p...pp......pp......p.....'), row('....p...pp......pp......p.....'), row('....p...pp......pp......p.....'),
    'YY' + rep('p', 32), 'YY' + rep('p', 32),
    row(rep('.', 8) + 'pp' + rep('.', 20)), row(rep('.', 8) + 'pp' + '..FF..........FF....'), row(rep('.', 8) + 'pp' + rep('.', 20)),
    row(rep('.', 8) + 'pp' + rep('.', 20)), row(rep('.', 8) + 'pp' + rep('.', 20)), row(rep('.', 8) + 'pp' + rep('.', 20)),
    rep('Y', 10) + 'pp' + rep('Y', 22), rep('Y', 10) + 'pp' + rep('Y', 22)
  ]);
  b.gym('hielo', 14, 3, 'gym7', 6, 14, { roof: '#8ad8f0', signColor: '#2f8ac8', emblem: '#8ad8f0' })
    .building('house', 3, 13, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaEscarcha', 6, 7)
    .building('house', 24, 13, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaEscarcha', 5, 6)
    .building('house', 3, 4, 5, 3, { roof: '#7aa8c8', doorCol: 2 }, 'casaEscarcha', 4, 5);
  for (const [x, y] of [[13, 23], [21, 25], [27, 23], [6, 24], [29, 4], [27, 8]]) b.obj({ kind: 'crystal', x, y });
  for (const [x, y] of [[12, 19], [23, 19]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 13, y: 22, text: ['CIUDAD ESCARCHA', 'Donde la nieve brilla como cristal.'] });
  b.npc({ id: 'escarchaNino', look: 'kid', x: 20, y: 23, dir: 0, wander: 2, talk: ['¡Mira, mira! ¡Hice un muñeco de nieve con forma de Nivalín!', 'La líder Nevada dice que el hielo también tiene corazón.'] });
  b.npc({ id: 'escarchaSenora', look: 'old', x: 4, y: 21, dir: 0, wander: 1, talk: ['Hace mucho, un cóndor de hielo cruzó el cielo sobre la ciudad.', 'Desde ese día nunca ha dejado de nevar.'] });
  b.npc({ id: 'guardiaEscarcha', look: 'guard', x: 12, y: 27, dir: 2, talk: 'guardiaEscarcha' });
  gate(b, 10, 28, 2, 1, 'escarcha', 0, 'bloqueoEscarcha');
  return b.build();
}

// ---------------------------------------------------------------- RUTA 10 (camino antiguo: Escarcha → Albor)
function ruta10() {
  const b = new MapBuilder('ruta10', 22, 14).meta({ name: 'Ruta 10', outdoor: true, origin: [88, -134], encounters: 'ruta10', battleBg: 'mountain' });
  draw(b, [
    rep('T', 16) + 'pp' + rep('T', 4), rep('T', 16) + 'pp' + rep('T', 4),
    'TT..gggg..O.....pp..TT',
    'TT..gggg........pp..TT',
    'TT..........pppppp..TT',
    'TT....ggg...pp......TT',
    'TT....ggg...pp..ggg.TT',
    'TT..........pp..ggg.TT',
    rep('p', 14) + '......TT',
    rep('p', 14) + '......TT',
    'TT..O....ggg........TT',
    'TT.......ggg...O....TT',
    rep('T', 22), rep('T', 22)
  ]);
  b.obj({ kind: 'statue', x: 3, y: 2, text: ['Una estatua gastada por el tiempo: un dragón que mira hacia el oeste.'] }).obj({ kind: 'statue', x: 18, y: 10, text: ['Las letras antiguas dicen: "El alba vuelve siempre".'] });
  b.obj({ kind: 'sign', x: 15, y: 7, text: ['RUTA 10 · CAMINO ANTIGUO', 'Oeste: Ciudad Albor · Norte: Ciudad Escarcha'] });
  b.npc({ id: 'r10monje', look: 'old', x: 14, y: 6, dir: 2, sight: 2, trainer: T('Monje Fermín', 'old', [['arborex', 40], ['cuarzon', 40]], 1800, ['El camino antiguo pone a prueba a los viajeros.'], ['Tu camino es firme.'], ['El maestro Sabino guarda el templo de Albor.']) });
  b.npc({ id: 'r10dama', look: 'lass', x: 6, y: 10, dir: 1, sight: 2, trainer: T('Dama Isabel', 'lass', [['orbelina', 40], ['cobrumbra', 41]], 1850, ['¡Qué elegancia de entrenador! Veamos si combates igual.'], ['¡Qué fina derrota!'], ['Contra los dragones, el Hada es lo mejor.']) });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD ALBOR (Dragón)
function albor() {
  const b = new MapBuilder('albor', 34, 32).meta({ name: 'Ciudad Albor', outdoor: true, paved: true, origin: [54, -132], battleBg: 'grass' });
  const row = s => 'TT' + s + 'TT';
  draw(b, [
    rep('T', 34), rep('T', 34),
    row(rep('.', 30)), row(rep('.', 30)), row(rep('.', 30)),
    row(rep('.', 20) + 'p' + rep('.', 9)),
    'TT' + rep('p', 32), 'TT' + rep('p', 32),
    row('......pp' + rep('.', 22)), row('......pp' + rep('.', 22)), row('......pp' + rep('.', 22)), row('......pp' + rep('.', 22)), row('......pp' + rep('.', 22)),
    row('......pp....p' + rep('.', 17)), row('......pp....p' + rep('.', 17)), row('......pp....p' + rep('.', 17)), row('......pp....p' + rep('.', 17)), row('......pp....p' + rep('.', 17)), row('......pp....p' + rep('.', 17)),
    row('..p...pp....p.........pp......'), row('..p...pp....p.........pp......'), row('..p...pp....p.........pp......'),
    row(rep('p', 30)), row(rep('p', 30)),
    row('......pp' + rep('.', 22)), row('......pp..FF..............FF..'), row('......pp' + rep('.', 22)),
    row('......pp' + rep('.', 22)), row('......pp..FF..............FF..'), row('......pp' + rep('.', 22)),
    rep('T', 8) + 'pp' + rep('T', 24), rep('T', 8) + 'pp' + rep('T', 24)
  ]);
  b.gym('dragon', 20, 12, 'gym8', 6, 14, { roof: '#a83a3a', signColor: '#a83a3a', emblem: '#6a5ae0' })
    .building('house', 11, 9, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaAlbor', 6, 7)
    .building('house', 2, 14, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaAlbor', 5, 6)
    .building('house', 20, 2, 5, 3, { roof: '#c8843a', doorCol: 2 }, 'casaAlbor', 4, 5);
  b.obj({ kind: 'fountain', x: 18, y: 25, w: 2, h: 2 });
  for (const [x, y] of [[13, 26], [24, 26], [13, 29], [24, 29]]) b.obj({ kind: 'statue', x, y, text: ['Un guardián de piedra del Templo del Alba.'] });
  for (const [x, y] of [[10, 5], [30, 9], [10, 21]]) b.obj({ kind: 'lamp', x, y });
  b.obj({ kind: 'sign', x: 10, y: 24, text: ['CIUDAD ALBOR', 'La ciudad más antigua de Alborada. Aquí nace el alba.'] });
  b.obj({ kind: 'sign', x: 10, y: 28, text: ['RUTA 11 ↓ LIGA ALBORADA', 'Sólo para quien tenga las ocho medallas.'] });
  b.npc({ id: 'alborSabia', look: 'old', x: 16, y: 27, dir: 0, wander: 2, talk: ['Cuentan que un dragón despierta al sol cada mañana.', 'El maestro Sabino lo ha esperado toda su vida.'] });
  b.npc({ id: 'alborChico', look: 'kid', x: 28, y: 23, dir: 2, wander: 2, talk: ['¡Mi hermano dice que la Liga está bajando por la Ruta 11!', 'Pero primero tienes que ganarle al maestro Sabino.'] });
  b.set(4, 18, 'p');
  b.npc({ id: 'guardiaAlbor', look: 'guard', x: 10, y: 29, dir: 2, talk: 'guardiaAlbor' });
  gate(b, 8, 30, 2, 1, 'escama', 0, 'bloqueoAlbor');
  return b.build();
}

// ---------------------------------------------------------------- RUTA 11 (camino de la victoria: Albor → Ruta 5)
function ruta11() {
  const b = new MapBuilder('ruta11', 20, 14).meta({ name: 'Ruta 11', outdoor: true, origin: [54, -100], encounters: 'ruta11', battleBg: 'mountain' });
  draw(b, [
    rep('K', 8) + 'pp' + rep('K', 10), rep('K', 8) + 'pp' + rep('K', 10),
    'KK....O.pp..ggg...KK',
    'KK..ggg.pp..ggg...KK',
    'KK..ggg.pppppppp..KK',
    'KK..........O.pp..KK',
    'KKK..O........pp..KK',
    'KK......ggg...pp..KK',
    rep('p', 16) + '..KK',
    rep('p', 16) + '..KK',
    'KK...ggg.....O....KK',
    'KK...ggg..O.......KK',
    rep('K', 20), rep('K', 20)
  ]);
  b.obj({ kind: 'sign', x: 3, y: 7, text: ['RUTA 11 · CAMINO DE LA VICTORIA', 'Oeste: Ruta 5 y Liga Alborada · Norte: Ciudad Albor'] });
  b.npc({ id: 'r11as', look: 'aide', x: 12, y: 7, dir: 0, sight: 1, trainer: T('As Valeria', 'aide', [['elestrix', 44], ['velaria', 44], ['sombrador', 45]], 2200, ['Ocho medallas... Impresionante. Pero aquí empieza lo difícil.'], ['Eres de verdad.'], ['La campeona Aurora te está esperando.']) });
  b.npc({ id: 'r11as2', look: 'hiker', x: 16, y: 6, dir: 2, sight: 2, trainer: T('As Gonzalo', 'hiker', [['penon', 45], ['acerion', 45], ['cobrumbra', 46]], 2250, ['¡El último muro antes de la Liga soy yo!'], ['El muro se cayó.'], ['Sigue al oeste y llegarás a la Ruta 5.']) });
  return b.build();
}

// ---------------------------------------------------------------- Interiores
export function buildRegionMaps() {
  const gyms = [
    gymGen('gym4', 'Gimnasio Voltio', 'electrico', ['voltio', 25, 10],
      { look: 'centella', talk: 'lider', trainer: T('Líder Centella', 'centella', [['tormavis', 29], ['voltaz', 30], ['elestrix', 32]], 3200, ['¡Bienvenido a la central! Soy Centella.', 'Mis criaturas se cargan con el viento de Voltio. ¿Aguantas la descarga?'], ['¡Qué chispazo! Te ganaste la Medalla Chispa.'], ['La energía bien usada mueve el mundo. Sigue al norte, a Pueblo Niebla.'], { alba: true }), badge: 'chispa' },
      [{ look: 'aide', x: 2, y: 8, dir: 3, sight: 4, trainer: T('Ingeniero Tomás', 'aide', [['voltaz', 27], ['tormavis', 27]], 900, ['¡Calculé que te voy a ganar!'], ['¡Error de cálculo!'], ['Centella diseñó todos los molinos.']) },
       { look: 'lass', x: 10, y: 9, dir: 2, sight: 4, trainer: T('Técnica Lina', 'lass', [['voltaz', 28]], 900, ['¡Revisa tus cables, que te voy a fundir!'], ['¡Cortocircuito!'], ['Ojo con la Tierra: es lo único que la detiene.']) }]),
    gymGen('gym5', 'Gimnasio Niebla', 'fantasma', ['niebla', 20, 10],
      { look: 'velia', talk: 'lider', trainer: T('Líder Velia', 'velia', [['candelo', 33], ['sombrador', 33], ['velaria', 35]], 3800, ['Shhh... las velas te estaban esperando.', 'Soy Velia. Mis amigos no son de este mundo... ¿les tienes miedo?'], ['La llama de tu corazón es muy fuerte. La Medalla Sombra es tuya.'], ['Los fantasmas también cuidan a quien los quiere. Sigue a Villa Cafetal.'], { alba: true }), badge: 'sombra' },
      [{ look: 'old', x: 1, y: 9, dir: 3, sight: 5, trainer: T('Médium Rosa', 'old', [['sombrador', 31], ['candelo', 31]], 1000, ['Los espíritus dicen tu nombre...'], ['...y ahora se ríen de mí.'], ['Velia habla con las velas.']) },
       { look: 'lass', x: 11, y: 7, dir: 2, sight: 5, trainer: T('Niña Bruja Luna', 'lass', [['candelo', 32]], 1000, ['¡Abracadabra! ¡A pelear!'], ['¡Se me dañó el hechizo!'], ['Siniestro le gana a Fantasma.']) }]),
    gymGen('gym6', 'Gimnasio Cafetal', 'lucha', ['cafetal', 24, 11],
      { look: 'tinto', talk: 'lider', trainer: T('Líder Tinto', 'tinto', [['carnerazo', 35], ['penon', 36], ['arieton', 38]], 4400, ['¡Buenas, mijo! Soy Don Tinto, caficultor y líder de este gimnasio.', 'Aquí se entrena cargando bultos desde las cuatro de la mañana. ¡A ver esa fuerza!'], ['¡Eso sí es berraquera! Llévese la Medalla Puño.'], ['Siga por el paso nevado hasta Ciudad Escarcha. ¡Y abríguese!'], { alba: true }), badge: 'puno' },
      [{ look: 'lass', x: 2, y: 8, dir: 3, sight: 4, trainer: T('Recolectora Inés', 'lass', [['carnerazo', 34], ['roedon', 34]], 1100, ['¡Recojo café y también victorias!'], ['¡Se me regó la cosecha!'], ['Don Tinto nunca se cansa.']) },
       { look: 'hiker', x: 10, y: 9, dir: 2, sight: 4, trainer: T('Arriero Pacho', 'hiker', [['carnerazo', 35]], 1100, ['¡Mi carnero empuja más que una mula!'], ['¡Hasta la mula me ganó!'], ['Contra Lucha, Volador y Psíquico.']) }]),
    gymGen('gym7', 'Gimnasio Escarcha', 'hielo', ['escarcha', 18, 10],
      { look: 'nevada', talk: 'lider', trainer: T('Líder Nevada', 'nevada', [['meduson', 39], ['cuarzon', 40], ['nivalord', 42]], 5000, ['Bienvenido a mi palacio. Soy Nevada.', 'El hielo es paciente y no perdona errores. ¿Y tú?'], ['Derretiste el hielo de mi palacio... La Medalla Escarcha es tuya.'], ['Al sur, por el camino antiguo, está Ciudad Albor. El último gimnasio.'], { alba: true }), badge: 'escarcha' },
      [{ look: 'lass', x: 2, y: 8, dir: 3, sight: 4, trainer: T('Patinadora Sol', 'lass', [['meduson', 37], ['nivalmar', 38]], 1200, ['¡Mira cómo patino! ¡Y cómo gano!'], ['¡Me caí de nalgas!'], ['Nevada nunca tiene frío.']) },
       { look: 'man', x: 10, y: 7, dir: 2, sight: 4, trainer: T('Esquiador Iván', 'man', [['nivalmar', 38]], 1200, ['¡Bajada a toda velocidad!'], ['¡Me estrellé!'], ['El Fuego derrite cualquier cosa.']) }]),
    gymGen('gym8', 'Gimnasio Albor', 'dragon', ['albor', 24, 19],
      { look: 'sabino', talk: 'lider', trainer: T('Líder Sabino', 'sabino', [['orbelina', 43], ['astrocuarzo', 43], ['cobrumbra', 44], ['arborex', 46]], 6000, ['Te esperaba, joven. Soy Sabino, guardián del Templo del Alba.', 'Siete medallas brillan en tu tarjeta. Veamos si mereces la octava.'], ['El alba brilla en tus ojos. Tuya es la Medalla Escama.'], ['Con ocho medallas, la Liga te abre sus puertas. Baja por la Ruta 11.'], { alba: true }), badge: 'escama' },
      [{ look: 'old', x: 2, y: 8, dir: 3, sight: 4, trainer: T('Monje Aurelio', 'old', [['arborex', 41], ['cuarzon', 41]], 1300, ['El templo no se abre a los impacientes.'], ['La paciencia te sobra.'], ['El maestro Sabino tiene un Arborex, mitad planta y mitad dragón.']) },
       { look: 'lass', x: 10, y: 7, dir: 2, sight: 4, trainer: T('Sacerdotisa Alba', 'lass', [['orbelina', 42], ['cobrumbra', 42]], 1300, ['¡Que la luz del alba me acompañe!'], ['Se hizo de noche...'], ['Hada y Hielo hacen temblar a los dragones.']) }])
  ];
  const outdoor = [ruta6(), voltio(), ruta7(), niebla(), ruta8(), cafetal(), ruta9(), escarcha(), ruta10(), albor(), ruta11()];
  if (drawErrors.length) throw new Error('Mapas mal dibujados:\n' + drawErrors.splice(0).join('\n'));
  return [
    ...outdoor, ...gyms,
    posadaGen('posadaVoltio', 'Posada de Voltio', ['voltio', 6, 16]), tiendaGen('tiendaVoltio', 'Tienda de Voltio', ['voltio', 12, 16], 'voltio'),
    posadaGen('posadaNiebla', 'Posada de Niebla', ['niebla', 6, 19]), tiendaGen('tiendaNiebla', 'Tienda de Niebla', ['niebla', 18, 19], 'niebla'),
    posadaGen('posadaCafetal', 'Posada de Cafetal', ['cafetal', 6, 12]), tiendaGen('tiendaCafetal', 'Tienda de Cafetal', ['cafetal', 12, 12], 'cafetal'),
    posadaGen('posadaEscarcha', 'Posada de Escarcha', ['escarcha', 6, 17]), tiendaGen('tiendaEscarcha', 'Tienda de Escarcha', ['escarcha', 26, 17], 'escarcha'),
    posadaGen('posadaAlbor', 'Posada de Albor', ['albor', 14, 13]), tiendaGen('tiendaAlbor', 'Tienda de Albor', ['albor', 4, 18], 'albor'),
    casaGen('casaVoltio', 'Casa de la ingeniera', 'aide', ['Arreglo los molinos cuando se dañan con las tormentas.', 'Las criaturas Eléctricas me ayudan... aunque a veces me dan corrientazo.'], ['voltio', 5, 7], '#e8eef8'),
    casaGen('casaVoltio2', 'Casa del farolero', 'old', ['Antes prendía los faroles uno por uno.', 'Ahora la ciudad se ilumina sola con el viento. ¡Qué tiempos!'], ['voltio', 11, 7]),
    casaGen('casaNiebla', 'Casa de las velas', 'girl', ['Hago velas para toda la región.', 'Dicen que las de Velia nunca se apagan... ¡yo no se las hice!'], ['niebla', 5, 7], '#e4dcea'),
    casaGen('casaCafetal', 'Casa de la familia cafetera', 'lass', ['¡Bienvenido! ¿Le provoca un pandebono con chocolate?', 'Aquí en Villa Cafetal nadie se va con hambre.'], ['cafetal', 5, 20], '#f2e2c8'),
    casaGen('casaEscarcha', 'Casa del glaciólogo', 'man', ['Estudio el hielo del nevado desde hace treinta años.', 'Un cóndor de hielo duerme en las cumbres. Dicen que baja después de la Liga.'], ['escarcha', 5, 7], '#e6f2f8'),
    casaGen('casaAlbor', 'Casa del historiador', 'old', ['Ciudad Albor es más vieja que el propio reino de Alborada.', 'En sus muros está escrita la leyenda del dragón del alba.'], ['albor', 22, 5], '#efe2c6')
  ];
}
