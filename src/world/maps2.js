// Mapas de la historia completa: Ruta 2 a la Liga Alborada.
import { MapBuilder } from './builder.js';
import { leagueOpen } from '../data/gyms.js';

const S = st => st.story;
// De noche (19:00 a 4:59, o la hora fija de las opciones).
const isNight = st => { const h = st.options?.forceHour ?? new Date().getHours(); return h >= 19 || h < 5; };
const has = (st, b) => (st.badges || []).includes(b);
const T = (name, look, party, money, intro, defeat, after, extra = {}) => ({ name, look, party, money, intro: [].concat(intro), defeat: [].concat(defeat), after: [].concat(after || defeat), ...extra });

// ---------------------------------------------------------------- Interiores reutilizables
function interior(id, w, h, opt) {
  const b = new MapBuilder(id, w, h, opt.floor || 'o').meta({ name: opt.name, outdoor: false, floor: opt.floor || 'o', style: opt.style, wallColor: opt.wallColor, wallDark: opt.wallDark, floorColors: opt.floorColors, battleBg: opt.battleBg, voidColor: opt.voidColor });
  b.rect(0, 0, w, 2, 'W');
  return b;
}
function exitMat(b, x, y, w, back) {
  b.set(x, y, 'm').rect(0, y, x, 1, ' ').rect(x + 1, y, w - x - 1, 1, ' ');
  b.warp(x, y, back[0], back[1], back[2], { face: 0, needDir: 0 });
}
export function posadaGen(id, name, back) {
  const b = interior(id, 13, 9, { name, floor: 'k', style: 'center' });
  exitMat(b, 6, 8, 13, back);
  b.furniture('counter', 4, 3, 5, 1, { sy: -8, counter: true, arg: 5 });
  b.furniture('healer', 7, 2, 2, 1, { sy: -14 });
  b.furniture('pc', 11, 2, 1, 1, { sy: -14, script: 'pc' });
  b.furniture('sofa', 1, 6, 2, 1, { sy: -6 }).furniture('plant', 0, 2, 1, 1, { sy: -8 }).furniture('plant', 12, 2, 1, 1, { sy: -8 });
  b.furniture('table', 9, 6, 2, 1, { sy: -8 });
  b.npc({ id: id + 'Enf', look: 'nurse', x: 6, y: 2, dir: 0, talk: 'posada', arg: { map: id, x: 6, y: 7 } });
  b.npc({ id: id + 'Msj', look: 'courier', x: 10, y: 5, dir: 2, talk: 'viaje' });
  return b.build();
}
// Tienda: mostrador general (dependiente), mostrador especial de la ciudad (vendedora) y máquina de bebidas.
export function tiendaGen(id, name, back, town) {
  const b = interior(id, 11, 8, { name, floor: 'k', style: 'lab' });
  exitMat(b, 5, 7, 11, back);
  b.furniture('shopCounter', 1, 3, 4, 1, { sy: -8, counter: true, arg: 4 });
  b.furniture('storeShelf', 6, 3, 2, 1, { sy: -14 }).furniture('storeShelf', 9, 3, 2, 1, { sy: -14 });
  b.furniture('storeShelf', 6, 5, 2, 1, { sy: -14 }).furniture('storeShelf', 9, 5, 2, 1, { sy: -14 });
  b.furniture('plant', 0, 2, 1, 1, { sy: -8 });
  b.furniture('vending', 10, 2, 1, 1, { sy: -18, script: 'maquina' });
  b.npc({ id: id + 'Dep', look: 'clerk', x: 2, y: 2, dir: 0, talk: 'tienda', town });
  b.npc({ id: id + 'Esp', look: 'vendor', x: 4, y: 2, dir: 0, talk: 'tiendaEspecial', town });
  return b.build();
}
export function casaGen(id, name, look, lines, back, wallColor = '#f2e8d2') {
  const b = interior(id, 9, 7, { name, wallColor });
  exitMat(b, 4, 6, 9, back);
  b.furniture('table', 3, 3, 2, 1, { sy: -8 }).furniture('shelf', 6, 2, 2, 1, { sy: -16 });
  b.furniture('plant', 0, 2, 1, 1, { sy: -8 }).furniture('tv', 1, 2, 1, 1, { sy: -4 });
  b.deco('window', 44, 2);
  b.npc({ id: id + 'npc', look, x: 6, y: 4, dir: 2, talk: lines });
  return b.build();
}
// Interior de cada gimnasio: piso, paredes, fondo de combate, obstáculos y el consejo del guía según el tipo.
const GYM_ROOMS = {
  planta: { floorColors: ['#dcefcf', '#cde6bd', '#b4d4a0'], wallColor: '#e8f4dc', wallDark: '#c4dcb0', bg: 'gym', tip: 'Fuego y Volador funcionan muy bien aquí.' },
  roca: { floorColors: ['#e6dccb', '#d6c9b2', '#bfae92'], wallColor: '#ece2d0', wallDark: '#cfc0a4', bg: 'mountain', tip: 'Agua y Planta son tus mejores aliados aquí.' },
  agua: { floorColors: ['#d6ecf8', '#c4e0f4', '#a8cce8'], wallColor: '#e2f0fa', wallDark: '#bcd6ea', bg: 'beach', tip: 'Planta y Eléctrico le hacen mucho daño al Agua.' },
  electrico: { floorColors: ['#f2ecd2', '#e6dcb6', '#d2c494'], wallColor: '#f6f0dc', wallDark: '#d8cca8', bg: 'gym', tip: 'Tierra no recibe daño eléctrico. ¡Úsala!' },
  fantasma: { floorColors: ['#5a4a6a', '#4e4060', '#423652'], wallColor: '#4a3a5a', wallDark: '#2e2440', bg: 'eclipse', tip: 'Siniestro y Fantasma le pegan duro a Fantasma. Lo Normal ni le hace cosquillas.' },
  lucha: { floorColors: ['#e8d4b4', '#dcc49e', '#c8ac82'], wallColor: '#f2e2c4', wallDark: '#d4bc94', bg: 'mountain', tip: 'Volador, Psíquico y Hada aguantan bien los golpes de Lucha.' },
  hielo: { floorColors: ['#eaf6fc', '#d8eef8', '#c2e2f2'], wallColor: '#eef8fc', wallDark: '#c8e2ee', bg: 'mountain', tip: 'Fuego, Lucha, Roca y Acero rompen el hielo.' },
  dragon: { floorColors: ['#f0e2c0', '#e6d4aa', '#d4bf8e'], wallColor: '#e8d4b0', wallDark: '#c8ae80', bg: 'league', tip: 'Hielo, Hada y Dragón son la debilidad de los dragones.' }
};
export function gymGen(id, name, theme, back, leader, trainers) {
  const T2 = GYM_ROOMS[theme];
  const b = interior(id, 13, 16, { name, floor: 'k', style: 'gym', ...T2, battleBg: T2.bg });
  exitMat(b, 6, 15, 13, back);
  b.obj({ kind: 'statue', x: 4, y: 13, text: [`${name.toUpperCase()}`, `Líder: ${leader.trainer.name}.`] }).obj({ kind: 'statue', x: 8, y: 13, text: ['Entrenadores que ganaron aquí:', '...todavía no está tu nombre.'] });
  if (theme === 'planta') { b.rect(1, 7, 4, 1, 'B').rect(8, 7, 4, 1, 'B').rect(1, 10, 3, 1, 'B').rect(9, 10, 3, 1, 'B').rect(4, 4, 2, 1, 'B').rect(7, 4, 2, 1, 'B'); }
  if (theme === 'roca') { b.rect(1, 6, 4, 1, 'O').rect(8, 6, 4, 1, 'O').rect(2, 9, 3, 2, 'O').rect(8, 10, 3, 1, 'O'); }
  if (theme === 'agua') { b.rect(1, 5, 4, 3, 'w').rect(8, 5, 4, 3, 'w').rect(1, 9, 3, 2, 'w').rect(9, 9, 3, 2, 'w'); }
  if (theme === 'electrico') for (const [x, y] of [[1, 6], [10, 6], [1, 10], [10, 10]]) b.furniture('machine', x, y, 2, 1, { sy: -24, text: ['Un generador zumba con fuerza. Huele a ozono.'] });
  if (theme === 'fantasma') for (const [x, y] of [[2, 6], [10, 6], [2, 10], [10, 10], [4, 8], [8, 8]]) b.obj({ kind: 'statue', x, y, text: ['Una estatua cubierta de telarañas. Parece que te mira.'] });
  if (theme === 'lucha') for (const [x, y] of [[1, 6], [2, 6], [10, 6], [11, 6], [1, 10], [11, 10]]) b.furniture('boxes', x, y, 1, 1, { sy: -2, text: ['Un bulto de café de la hacienda. ¡Pesa una tonelada!'] });
  if (theme === 'hielo') for (const [x, y] of [[2, 5], [10, 5], [3, 9], [9, 9], [1, 11], [11, 11]]) b.obj({ kind: 'crystal', x, y });
  if (theme === 'dragon') { b.rect(6, 4, 1, 11, 'r'); for (const [x, y] of [[2, 5], [10, 5], [2, 9], [10, 9]]) b.obj({ kind: 'statue', x, y, text: ['Un dragón de piedra antiguo. Tiene los ojos de oro.'] }); }
  b.npc({ id: id + 'Lider', x: 6, y: 3, dir: 0, ...leader });
  trainers.forEach((t, i) => b.npc({ id: id + 'T' + i, ...t }));
  b.npc({ id: id + 'Guia', look: 'man', x: 10, y: 13, dir: 2, talk: [`¡Hola, retador! El gimnasio de tipo ${{ electrico: 'ELÉCTRICO', dragon: 'DRAGÓN' }[theme] || theme.toUpperCase()} es duro.`, T2.tip] });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 2
function ruta2() {
  const b = new MapBuilder('ruta2', 20, 30).meta({ name: 'Ruta 2', outdoor: true, origin: [36, -52], encounters: 'ruta2', battleBg: 'grass' });
  b.border('T', 2);
  b.rect(8, 28, 2, 2, 'p').rect(8, 0, 2, 2, 'p');
  b.rect(8, 20, 2, 8, 'p').rect(8, 20, 8, 2, 'p').rect(14, 10, 2, 12, 'p').rect(8, 10, 8, 2, 'p').rect(8, 2, 2, 9, 'p');
  b.rect(2, 13, 5, 5, 'g').rect(11, 13, 3, 6, 'g').rect(16, 3, 2, 6, 'g').rect(3, 3, 4, 5, 'g').rect(2, 22, 5, 4, 'g');
  b.rect(10, 4, 3, 3, 'T').rect(16, 23, 2, 3, 'T').rect(11, 23, 2, 2, 'F');
  b.obj({ kind: 'sign', x: 10, y: 26, text: ['RUTA 2', 'Norte: Ciudad Corola · Sur: Villa Arenal'] });
  b.npc({ id: 'r2bicho', look: 'bugkid', x: 5, y: 21, dir: 3, sight: 4, trainer: T('Cazabichos Leo', 'bugkid', [['capullin', 5], ['capullado', 6]], 120, ['¡Mis bichos están listos para pelear!'], ['¡Nooo! Mis bichos...'], ['Voy a buscar bichos más fuertes en el pasto.']) });
  b.npc({ id: 'r2chica', look: 'lass', x: 17, y: 12, dir: 2, sight: 3, trainer: T('Chica Ana', 'lass', [['pipiu', 6], ['setin', 6]], 140, ['¡Ey! ¡Nuestras miradas se cruzaron! ¡A combatir!'], ['Uy... eres muy bueno.'], ['En Corola hay un gimnasio de tipo Planta.']) });
  b.npc({ id: 'nicoR2', look: 'rival', x: 9, y: 23, dir: 0, when: st => S(st) === 5 && !st.flags.nicoR2 });
  b.trigger({ x: 2, y: 25, w: 14, h: 1, when: st => S(st) === 5 && !st.flags.nicoR2, script: 'nicoRuta2' });
  b.obj({ kind: 'shimmer', x: 12, y: 8, solid: true, legend: 'brumalia', when: st => S(st) >= 12 && !st.flags.brumalia && isNight(st), script: 'leyenda' });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD COROLA
function corola() {
  const b = new MapBuilder('corola', 32, 28).meta({ name: 'Ciudad Corola', outdoor: true, paved: true, origin: [30, -80], battleBg: 'grass' });
  b.border('T', 2);
  b.rect(14, 26, 2, 2, 'p').rect(14, 0, 2, 2, 'p').rect(30, 10, 2, 2, 'p');
  b.rect(14, 2, 2, 24, 'p').rect(3, 17, 26, 2, 'p').rect(10, 10, 22, 2, 'p');
  b.rect(22, 8, 1, 2, 'p').rect(6, 16, 1, 1, 'p').rect(25, 16, 1, 1, 'p').rect(6, 23, 1, 1, 'p').rect(25, 24, 1, 1, 'p').rect(3, 24, 26, 1, 'p');
  b.rect(10, 13, 3, 3, 'F').rect(18, 14, 2, 2, 'F').rect(3, 10, 5, 1, 'F').rect(24, 9, 5, 1, 'F').rect(9, 20, 4, 2, 'F');
  b.rect(18, 1, 10, 1, '.');
  b.gym('planta', 18, 1, 'gym1', 6, 14, { roof: '#4a9a4a', signColor: '#2a6a2a', emblem: '#5cb04c' })
    .building('house', 3, 12, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaCorola', 6, 7)
    .building('house', 23, 12, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaCorola', 5, 6)
    .building('house', 3, 20, 6, 3, { roof: '#c87ab8', doorCol: 3 }, 'casaCorola1', 4, 5)
    .building('house', 23, 21, 5, 3, { roof: '#d8a040', doorCol: 2 }, 'casaCorola2', 4, 5);
  b.obj({ kind: 'fountain', x: 16, y: 20, w: 2, h: 2 });
  b.obj({ kind: 'bench', x: 19, y: 22, w: 2, h: 1 }).obj({ kind: 'lamp', x: 13, y: 21 }).obj({ kind: 'lamp', x: 17, y: 9 });
  b.obj({ kind: 'sign', x: 16, y: 24, text: ['CIUDAD COROLA', 'La ciudad que florece todo el año.'] });
  b.obj({ kind: 'sign', x: 17, y: 2, text: ['RUTA 5 → LIGA ALBORADA', 'Sólo para entrenadores con las 8 medallas.'] });
  b.obj({ kind: 'sign', x: 28, y: 9, text: ['RUTA 3 → CUEVA ECO', 'Pueblo Cobre al otro lado de la montaña.'] });
  b.npc({ id: 'corolaVieja', look: 'old', x: 9, y: 18, dir: 0, wander: 2, talk: ['Hiedra, la líder del gimnasio, cuida cada flor de esta ciudad.', 'Si quieres ganarle, lleva criaturas de Fuego o Volador.'] });
  b.npc({ id: 'corolaNino', look: 'kid', x: 22, y: 18, dir: 2, wander: 2, talk: ['¿Viste a esos tipos de capucha morada?', 'Dicen que son del Equipo Eclipse y que buscan algo en los lagos.'] });
  b.npc({ id: 'guardiaEste', look: 'guard', x: 30, y: 12, dir: 1, talk: 'guardiaCorola' });
  b.npc({ id: 'guardiaNorte', look: 'guard', x: 13, y: 2, dir: 0, talk: 'guardiaLiga' });
  b.npc({ id: 'gruntA', look: 'grunt', x: 21, y: 9, dir: 1, when: st => S(st) === 5 && !st.flags.eclipseCorola });
  b.npc({ id: 'gruntB', look: 'grunt', x: 23, y: 9, dir: 1, when: st => S(st) === 5 && !st.flags.eclipseCorola });
  b.trigger({ x: 2, y: 25, w: 28, h: 1, when: st => S(st) === 5 && !st.flags.eclipseCorola, script: 'eclipseCorola' });
  b.trigger({ x: 30, y: 10, w: 1, h: 2, when: st => !has(st, 'hoja'), script: 'bloqueoCorola' });
  b.trigger({ x: 14, y: 1, w: 2, h: 1, when: st => st.dir === 1 && !leagueOpen(st), script: 'bloqueoLiga' });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 3
function ruta3() {
  const b = new MapBuilder('ruta3', 30, 14).meta({ name: 'Ruta 3', outdoor: true, origin: [62, -76], encounters: 'ruta3', battleBg: 'mountain' });
  b.border('T', 2);
  b.rect(0, 6, 25, 2, 'p');
  b.rect(25, 0, 5, 14, 'K');
  b.set(25, 6, 'p');
  b.obj({ kind: 'cave', x: 25, y: 6, solid: false });
  b.warp(25, 6, 'cueva', 1, 9, { face: 3 });
  b.rect(4, 2, 6, 3, 'g').rect(12, 9, 8, 3, 'g').rect(14, 2, 5, 3, 'g');
  b.rect(10, 2, 2, 2, 'T').rect(3, 10, 3, 1, 'F');
  b.obj({ kind: 'sign', x: 23, y: 8, text: ['CUEVA ECO', 'Cuidado: está muy oscura por dentro.'] });
  b.npc({ id: 'r3mont', look: 'hiker', x: 11, y: 9, dir: 1, sight: 2, trainer: T('Montañero Raúl', 'hiker', [['guijarrin', 9], ['roedin', 9]], 200, ['¡Las montañas forjan el carácter! ¡Y a las criaturas!'], ['¡Qué golpe, compadre!'], ['En la cueva hay rocas vivas. ¡Literal!']) });
  b.npc({ id: 'r3chica', look: 'lass', x: 19, y: 5, dir: 0, sight: 3, trainer: T('Chica Lucía', 'lass', [['chispaz', 10], ['setin', 9]], 210, ['¡Mi Chispaz tiene el pelo de punta! ¡Pelea!'], ['¡Se me descargó!'], ['Los Chispaz se pegan al pelo. ¡Qué pereza!']) });
  return b.build();
}

// ---------------------------------------------------------------- CUEVA ECO
function cueva() {
  const b = new MapBuilder('cueva', 28, 18, 'c').meta({ name: 'Cueva Eco', outdoor: false, encounters: 'cueva', allEncounter: true, battleBg: 'cave', dark: true, voidColor: '#0a0806' });
  b.border('R', 1);
  b.set(0, 9, 'c');
  b.warp(0, 9, 'ruta3', 24, 6, { face: 2 });
  b.set(27, 8, 'c');
  b.warp(27, 8, 'cobre', 2, 12, { face: 3 });
  b.rect(5, 1, 2, 6, 'R').rect(5, 11, 2, 6, 'R').rect(11, 4, 2, 10, 'R').rect(17, 1, 2, 5, 'R').rect(17, 10, 2, 7, 'R').rect(22, 4, 2, 7, 'R');
  b.rect(8, 2, 1, 1, 'O').rect(14, 15, 1, 1, 'O').rect(20, 7, 1, 1, 'O').rect(3, 14, 1, 1, 'O').rect(25, 14, 1, 1, 'O');
  for (const [x, y] of [[2, 2], [9, 15], [15, 2], [21, 14], [25, 2], [8, 9]]) b.obj({ kind: 'crystal', x, y });
  b.npc({ id: 'cuevaMont', look: 'hiker', x: 8, y: 6, dir: 0, sight: 3, trainer: T('Montañero Iván', 'hiker', [['guijarrin', 11], ['guijarrin', 12]], 260, ['¡Eco, eco, eco! ¡Pelea, pelea, pelea!'], ['Ay... ay... ay...'], ['La salida está al este. Sigue el eco.']) });
  b.npc({ id: 'cuevaGrunt', look: 'grunt', x: 20, y: 9, dir: 2, sight: 4, trainer: T('Recluta Eclipse', 'grunt', [['sombrin', 11], ['roedin', 12]], 300, ['¡Alto ahí! El Equipo Eclipse está buscando cristales del lago en esta cueva.', '¡Nadie pasa!'], ['¡Bah! Igual ya tenemos lo que necesitábamos...'], ['El jefe Umbra dice que el Lago Espejo esconde un poder enorme.']), bg: 'cave' });
  b.npc({ id: 'cuevaBici', look: 'man', x: 14, y: 9, dir: 3, talk: ['Me perdí... ¿la salida a Pueblo Cobre? Creo que es por el este.'] });
  b.obj({ kind: 'shimmer', x: 24, y: 12, solid: true, legend: 'fraguon', when: st => S(st) >= 12 && !st.flags.fraguon, script: 'leyenda' });
  return b.build();
}

// ---------------------------------------------------------------- PUEBLO COBRE
function cobre() {
  const b = new MapBuilder('cobre', 26, 24).meta({ name: 'Pueblo Cobre', outdoor: true, origin: [100, -80], battleBg: 'mountain' });
  b.rect(0, 0, 26, 24, 'Y');
  b.rect(2, 2, 22, 20, '.');
  b.rect(0, 0, 26, 2, 'K').rect(0, 0, 2, 24, 'K');
  b.set(1, 12, 'p');
  b.obj({ kind: 'cave', x: 1, y: 12, solid: false });
  b.warp(1, 12, 'cueva', 26, 8, { face: 2, needDir: 2 });
  b.rect(12, 22, 2, 2, 'p');
  b.rect(2, 12, 22, 2, 'p').rect(12, 8, 2, 14, 'p').rect(6, 17, 1, 1, 'p').rect(20, 17, 1, 1, 'p').rect(3, 18, 20, 1, 'p').rect(20, 7, 1, 5, 'p');
  b.rect(8, 1, 10, 1, '.');
  b.gym('roca', 8, 1, 'gym2', 6, 14, { roof: '#9a7a4a', signColor: '#6a4a2a', emblem: '#b8a058' })
    .building('house', 3, 14, 6, 3, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaCobre', 6, 7)
    .building('house', 18, 14, 5, 3, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaCobre', 5, 6)
    .building('house', 18, 4, 5, 3, { roof: '#7a6a5a', doorCol: 2 }, 'casaCobre', 4, 5);
  b.rect(3, 3, 4, 7, 'K').rect(3, 20, 3, 1, 'F').rect(16, 20, 4, 1, 'F');
  b.obj({ kind: 'sign', x: 14, y: 20, text: ['PUEBLO COBRE', 'Minas, montañas y gente terca.'] });
  b.obj({ kind: 'sign', x: 11, y: 21, text: ['RUTA 4 ↓ CIUDAD MAREA'] });
  for (const [x, y] of [[8, 9], [16, 10], [22, 10]]) b.obj({ kind: 'boulder', x, y });
  b.npc({ id: 'cobreMinero', look: 'hiker', x: 8, y: 13, dir: 3, wander: 2, talk: ['Basalto, el líder, trabaja en la mina de día y en el gimnasio de noche.', 'Sus criaturas de Roca le temen al Agua y a la Planta.'] });
  b.npc({ id: 'cobreGuardia', look: 'guard', x: 14, y: 21, dir: 0, talk: 'guardiaCobre' });
  b.trigger({ x: 12, y: 22, w: 2, h: 1, when: st => !has(st, 'roca'), script: 'bloqueoCobre' });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 4
function ruta4() {
  const b = new MapBuilder('ruta4', 30, 30).meta({ name: 'Ruta 4', outdoor: true, origin: [98, -56], encounters: 'ruta4', battleBg: 'beach' });
  b.border('T', 2);
  b.rect(14, 0, 2, 2, 'p').rect(14, 28, 2, 2, 'p');
  b.rect(20, 2, 10, 28, 's').rect(24, 2, 6, 28, 'w').rect(28, 0, 2, 30, 'w');
  b.rect(20, 28, 4, 2, 'T');                // la playa termina en árboles, como el borde de Ciudad Marea
  b.rect(14, 2, 2, 8, 'p').rect(6, 8, 10, 2, 'p').rect(6, 8, 2, 12, 'p').rect(6, 18, 10, 2, 'p').rect(14, 18, 2, 10, 'p');
  b.rect(2, 3, 4, 4, 'g').rect(9, 11, 5, 6, 'g').rect(16, 22, 4, 5, 'g').rect(3, 22, 8, 5, 'g');
  for (const [x, y] of [[21, 5], [22, 11], [21, 17], [22, 23]]) b.set(x, y, 'J');
  b.obj({ kind: 'sign', x: 16, y: 3, text: ['RUTA 4', 'Pueblo Cobre ↑ · Ciudad Marea ↓'] });
  b.npc({ id: 'r4nadador', look: 'swimmer', x: 22, y: 8, dir: 2, sight: 4, trainer: T('Nadador Tomás', 'swimmer', [['medusin', 15], ['charquin', 15]], 360, ['¡El mar me llama! ¡Y tú también, a pelear!'], ['Glu, glu... me hundí.'], ['Ciudad Marea tiene el mejor ceviche de Alborada.']) });
  b.npc({ id: 'r4mont', look: 'hiker', x: 4, y: 12, dir: 3, sight: 2, trainer: T('Montañero Ciro', 'hiker', [['guijarrin', 15], ['penon', 17]], 380, ['¡Bajé de la montaña sólo para retarte!'], ['Volveré a la montaña...'], ['Peñón era un Guijarrín. ¡Crecen tanto!']) });
  b.npc({ id: 'r4chica', look: 'lass', x: 17, y: 20, dir: 2, sight: 3, trainer: T('Chica Sara', 'lass', [['pipiolo', 16], ['chispaz', 16]], 380, ['¡Ay, qué emoción! ¡Mi primer combate de hoy!'], ['Bueno, ya tendré otro...'], ['La líder Coral nada con sus criaturas cada mañana.']) });
  b.npc({ id: 'nicoR4', look: 'rival', x: 15, y: 23, dir: 1, when: st => has(st, 'roca') && !st.flags.nicoR4 });
  b.trigger({ x: 2, y: 20, w: 18, h: 1, when: st => has(st, 'roca') && !st.flags.nicoR4, script: 'nicoRuta4' });
  return b.build();
}

// ---------------------------------------------------------------- CIUDAD MAREA
function marea() {
  const b = new MapBuilder('marea', 34, 26).meta({ name: 'Ciudad Marea', outdoor: true, paved: true, origin: [96, -26], battleBg: 'beach' });
  b.border('T', 2);
  b.rect(16, 0, 2, 2, 'p');
  b.rect(0, 20, 34, 6, 'w').rect(2, 18, 30, 2, 's').rect(12, 20, 3, 4, 's');
  b.rect(16, 2, 2, 16, 'p').rect(3, 10, 28, 2, 'p').rect(8, 9, 1, 1, 'p').rect(22, 8, 1, 2, 'p').rect(28, 8, 1, 2, 'p').rect(26, 17, 1, 1, 'p').rect(6, 17, 1, 1, 'p').rect(3, 17, 28, 1, 'p');
  b.rect(31, 10, 3, 2, 'p');                // salida este: Ruta 6 hacia Ciudad Voltio
  b.gym('agua', 4, 2, 'gym3', 6, 14, { roof: '#3a7ad8', signColor: '#2a5aa8', emblem: '#3e98dc' })
    .building('house', 19, 4, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posadaMarea', 6, 7)
    .building('house', 26, 4, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tiendaMarea', 5, 6)
    .building('big', 22, 12, 8, 5, { roof: '#4a3a5a', wall: '#d8d0c8', trim: '#2a2232', sign: 'BODEGA', signColor: '#3a2c4a', doorCol: 4, door: '#5a4a6a', flowers: false }, 'bodega', 8, 11)
    .building('house', 3, 13, 6, 4, { roof: '#40a8a0', doorCol: 3 }, 'casaMarea', 4, 5);
  b.obj({ kind: 'boat', x: 4, y: 20, w: 3, h: 1, text: ['Un barco pesquero. Huele a sal y a pescado fresco.'] });
  b.obj({ kind: 'fountain', x: 11, y: 13, w: 2, h: 2 });
  for (const [x, y] of [[2, 18], [10, 18], [21, 18], [31, 18]]) b.set(x, y, 'J');
  b.obj({ kind: 'sign', x: 18, y: 15, text: ['CIUDAD MAREA', 'El puerto donde el mar canta de noche.'] });
  b.npc({ id: 'mareaMarino', look: 'sailor', x: 13, y: 21, dir: 0, talk: ['¿Ves esa bodega de techo morado?', 'Desde que llegó esa gente de capucha, nadie entra ni sale de día.'] });
  b.npc({ id: 'mareaChica', look: 'girl', x: 20, y: 12, dir: 2, wander: 2, talk: ['La líder Coral siempre dice: "el agua apaga el fuego y gasta la roca".'] });
  b.obj({ kind: 'sign', x: 31, y: 9, text: ['RUTA 6 → CIUDAD VOLTIO', 'Los otros cinco gimnasios de Alborada están al este.'] });
  b.npc({ id: 'guardiaMareaEste', look: 'guard', x: 31, y: 12, dir: 1, talk: 'guardiaMareaEste' });
  b.trigger({ x: 33, y: 10, w: 1, h: 2, when: st => st.dir === 3 && S(st) < 11, script: 'bloqueoMareaEste' });
  b.npc({ id: 'gruntPuerta', look: 'grunt', x: 26, y: 17, dir: 0, when: st => !has(st, 'marea'), talk: ['¡Fuera de aquí! Esta bodega es propiedad privada.', '...¿Qué? ¿Medallas? Bah, sin la de Marea ni me molestes.'] });
  return b.build();
}

// ---------------------------------------------------------------- BODEGA ECLIPSE
function bodega() {
  const b = interior('bodega', 17, 13, { name: 'Bodega Eclipse', floor: 'k', style: 'lab', floorColors: ['#4a4258', '#423a50', '#36304a'], wallColor: '#3a3248', wallDark: '#2a2436', battleBg: 'eclipse' });
  exitMat(b, 8, 12, 17, ['marea', 26, 17]);
  b.furniture('machine', 1, 2, 2, 1, { sy: -24, text: ['Un monitor muestra un mapa del Lago Espejo marcado con una X roja.'] }).furniture('machine', 14, 2, 2, 1, { sy: -24 });
  b.furniture('boxes', 4, 5, 1, 1, { sy: -2 }).furniture('boxes', 5, 5, 1, 1, { sy: -2 }).furniture('boxes', 11, 5, 1, 1, { sy: -2 }).furniture('boxes', 12, 5, 1, 1, { sy: -2 });
  b.furniture('boxes', 2, 8, 1, 1, { sy: -2 }).furniture('boxes', 14, 8, 1, 1, { sy: -2 }).furniture('labTable', 7, 2, 2, 1, { sy: -8 });
  b.npc({ id: 'bodegaG1', look: 'grunt', x: 3, y: 10, dir: 3, sight: 4, trainer: T('Recluta Eclipse', 'grunt', [['sombrin', 19], ['chispaz', 19]], 500, ['¡Un intruso! ¡Alerta!'], ['¡Ay! ¡Avisen a la jefa Bruma!'], ['No vas a llegar a tiempo al lago...']) });
  b.npc({ id: 'bodegaG2', look: 'grunt', x: 13, y: 7, dir: 2, sight: 4, trainer: T('Recluta Eclipse', 'grunt', [['roedon', 19], ['sombrin', 20]], 520, ['¡De aquí no pasas, mocoso!'], ['¡Me ganó un niño!'], ['El jefe Umbra ya va camino al lago.']) });
  b.npc({ id: 'bruma', look: 'bruma', x: 8, y: 3, dir: 0, talk: 'bruma' });
  return b.build();
}

// ---------------------------------------------------------------- RUTA 5 Y LIGA
function ruta5() {
  const b = new MapBuilder('ruta5', 16, 30).meta({ name: 'Ruta 5', outdoor: true, origin: [38, -110], encounters: 'ruta5', battleBg: 'mountain' });
  b.rect(0, 0, 16, 30, 'Y');
  b.rect(2, 1, 12, 27, '.');
  b.rect(6, 28, 2, 2, 'p');
  b.rect(6, 8, 2, 20, 'p').rect(6, 18, 6, 2, 'p').rect(10, 12, 2, 7, 'p').rect(6, 12, 6, 2, 'p');
  b.rect(12, 18, 4, 2, 'p');                // salida este: Ruta 11 hacia Ciudad Albor
  b.rect(2, 20, 4, 5, 'g').rect(8, 22, 5, 4, 'g').rect(2, 10, 3, 6, 'g').rect(12, 8, 2, 4, 'g');
  b.building('big', 2, 2, 12, 5, { roof: '#c83a4a', wall: '#f8f0e0', trim: '#8a6a20', sign: 'LIGA ALBORADA', signColor: '#8a2a3a', emblem: '#f0c040', doorCol: 5 }, 'liga', 7, 14);
  b.obj({ kind: 'statue', x: 4, y: 8 }).obj({ kind: 'statue', x: 9, y: 8 });
  b.npc({ id: 'r5as', look: 'aide', x: 3, y: 18, dir: 3, sight: 3, trainer: T('As Daniel', 'aide', [['voltaz', 46], ['seton', 46]], 1800, ['Si llegaste aquí, eres bueno. Veamos qué tan bueno.'], ['Sí... eres muy bueno.'], ['La Campeona Aurora nunca ha perdido.']) });
  b.npc({ id: 'r5as2', look: 'lass', x: 12, y: 15, dir: 2, sight: 3, trainer: T('As Marina', 'lass', [['meduson', 47], ['pipiolo', 47]], 1840, ['¡Último filtro antes de la Liga!'], ['¡Pasa, pasa! Te lo ganaste.'], ['Suerte allá adentro.']) });
  b.npc({ id: 'r5as3', look: 'hiker', x: 8, y: 10, dir: 2, sight: 2, trainer: T('As Bruno', 'hiker', [['penon', 48], ['sombrador', 47]], 1900, ['¡Las puertas de la Liga no se abren solas!'], ['Ahí están. Abiertas.'], ['Demuéstrales quién manda.']) });
  b.obj({ kind: 'shimmer', x: 12, y: 20, solid: true, legend: 'glaciel', when: st => S(st) >= 12 && !st.flags.glaciel, script: 'leyenda' });
  return b.build();
}
function liga() {
  const b = interior('liga', 15, 16, { name: 'Liga Alborada', floor: 'k', style: 'league', floorColors: ['#f0e8d8', '#e6dcc8', '#d4c8b0'], wallColor: '#e8d8b8', wallDark: '#c8b490', battleBg: 'league' });
  exitMat(b, 7, 15, 15, ['ruta5', 7, 7]);
  b.rect(6, 2, 3, 13, 'r');
  b.obj({ kind: 'statue', x: 3, y: 12 }).obj({ kind: 'statue', x: 11, y: 12 }).obj({ kind: 'statue', x: 3, y: 6 }).obj({ kind: 'statue', x: 11, y: 6 });
  b.furniture('plant', 1, 2, 1, 1, { sy: -8 }).furniture('plant', 13, 2, 1, 1, { sy: -8 });
  b.npc({ id: 'nicoLiga', look: 'rival', x: 7, y: 9, dir: 0, when: st => S(st) === 11 && !st.flags.nicoLiga });
  b.npc({ id: 'nicoLiga2', look: 'rival', x: 4, y: 9, dir: 3, when: st => S(st) >= 11 && st.flags.nicoLiga, talk: ['¡Ve! ¡Aurora te espera!', 'Y si ganas... ¡la próxima vez te gano yo!'] });
  b.npc({ id: 'aurora', look: 'aurora', x: 7, y: 3, dir: 0, talk: 'aurora' });
  b.trigger({ x: 1, y: 11, w: 13, h: 1, when: st => S(st) === 11 && leagueOpen(st) && !st.flags.nicoLiga, script: 'nicoLiga' });
  b.trigger({ x: 1, y: 5, w: 13, h: 1, when: st => S(st) === 11 && st.flags.nicoLiga, script: 'aurora' });
  return b.build();
}

export function buildStoryMaps() {
  const g1 = gymGen('gym1', 'Gimnasio Corola', 'planta', ['corola', 22, 8],
    { look: 'hiedra', talk: 'lider', trainer: T('Líder Hiedra', 'hiedra', [['setin', 11], ['capullado', 11], ['seton', 13]], 1300, ['Bienvenido al Gimnasio Corola. Soy Hiedra.', 'Mis criaturas crecen con paciencia, como las flores. ¿Tienes tú esa paciencia?'], ['Floreciste en pleno combate... Te ganaste la Medalla Hoja.'], ['Cuida tus criaturas como a un jardín.']), badge: 'hoja' },
    [{ look: 'lass', x: 2, y: 9, dir: 3, sight: 4, trainer: T('Jardinera Flor', 'lass', [['setin', 10], ['setin', 10]], 300, ['¡Hiedra me enseñó todo lo que sé!'], ['¡Se me marchitaron!'], ['Hiedra es muy fuerte...']) },
     { look: 'bugkid', x: 10, y: 6, dir: 2, sight: 3, trainer: T('Cazabichos Teo', 'bugkid', [['capullado', 10], ['alasol', 11]], 300, ['¡Mis bichos aman las flores!'], ['Volaron lejos...'], ['Alasol sólo vuela de día.']) }]);
  const g2 = gymGen('gym2', 'Gimnasio Cobre', 'roca', ['cobre', 13, 8],
    { look: 'basalto', talk: 'lider', trainer: T('Líder Basalto', 'basalto', [['guijarrin', 15], ['roedon', 15], ['penon', 18]], 1800, ['¿Retador? Bien. Las rocas no se mueven, pero golpean duro.'], ['Hmm. Rompiste la roca. Toma la Medalla Roca.'], ['Sigue cavando, chico. Sigue cavando.'], { alba: true }), badge: 'roca' },
    [{ look: 'hiker', x: 1, y: 8, dir: 3, sight: 5, trainer: T('Minero Paco', 'hiker', [['guijarrin', 14], ['guijarrin', 14]], 400, ['¡Pura roca, compa!'], ['¡Derrumbe!'], ['Basalto es duro como el granito.']) }]);
  const g3 = gymGen('gym3', 'Gimnasio Marea', 'agua', ['marea', 8, 9],
    { look: 'coral', talk: 'lider', trainer: T('Líder Coral', 'coral', [['medusin', 20], ['charcomar', 21], ['meduson', 23]], 2400, ['¡Hola! Soy Coral. ¿Sabes nadar contra la corriente?', '¡Porque eso es lo que vas a tener que hacer!'], ['¡Qué ola! Te ganaste la Medalla Marea.'], ['Ahora sí puedes entrar a esa bodega... ten cuidado.'], { alba: true }), badge: 'marea' },
    [{ look: 'swimmer', x: 6, y: 9, dir: 0, sight: 2, trainer: T('Nadador Íker', 'swimmer', [['medusin', 19], ['medusin', 19]], 500, ['¡Splash! ¡Hora de pelear!'], ['Glub...'], ['Coral entrena a las 5 de la mañana.']) }]);
  const list = [
    ruta2(), corola(), ruta3(), cueva(), cobre(), ruta4(), marea(), bodega(), ruta5(), liga(), g1, g2, g3,
    posadaGen('posadaCorola', 'Posada de Corola', ['corola', 6, 16]), tiendaGen('tiendaCorola', 'Tienda de Corola', ['corola', 25, 16], 'corola'),
    posadaGen('posadaCobre', 'Posada de Cobre', ['cobre', 6, 17]), tiendaGen('tiendaCobre', 'Tienda de Cobre', ['cobre', 20, 17], 'cobre'),
    posadaGen('posadaMarea', 'Posada de Marea', ['marea', 22, 8]), tiendaGen('tiendaMarea', 'Tienda de Marea', ['marea', 28, 8], 'marea'),
    casaGen('casaCorola1', 'Casa de los Pétalos', 'girl', ['¿Viste la fuente de la plaza? La construyó la abuela de Hiedra.'], ['corola', 6, 23]),
    casaGen('casaCorola2', 'Casa del cartero', 'man', ['Llevo cartas a todo Alborada.', 'Si quieres viajar rápido, habla con la Mensajera en cualquier Posada.'], ['corola', 25, 24]),
    casaGen('casaCobre', 'Casa del minero', 'old', ['Yo encontré el primer cristal en la Cueva Eco, hace cincuenta años.', 'Brillaba igualito al Lago Espejo.'], ['cobre', 20, 7], '#e8dcc8'),
    casaGen('casaMarea', 'Casa de la pescadora', 'lass', ['Mi abuelo vio a la guardiana del Lago Espejo una vez.', 'Dice que sus alas eran como dos espejos.'], ['marea', 6, 17], '#e2f0f4')
  ];
  return list;
}
