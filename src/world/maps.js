// Definición de todos los mapas de la Etapa 1 de Alborada.
// Los mapas exteriores comparten un plano global (origin) para que se conecten sin cortes.
import { MapBuilder } from './builder.js';
import { buildStoryMaps } from './maps2.js';

const S = st => st.story;

// ---------------------------------------------------------------- PUEBLO BRISAL
function brisal() {
  const b = new MapBuilder('brisal', 24, 22).meta({ name: 'Pueblo Brisal', outdoor: true, origin: [0, 0], battleBg: 'grass' });
  b.border('T', 2);
  b.rect(11, 0, 2, 2, 'p');                 // salida norte al Sendero 1
  b.rect(11, 2, 2, 16, 'p');                // calle principal
  b.rect(3, 9, 18, 2, 'p');                 // calle superior
  b.rect(3, 17, 18, 1, 'p');                // calle inferior
  b.set(5, 8, 'p').set(18, 8, 'p').set(5, 16, 'p').set(18, 16, 'p');
  b.rect(14, 18, 5, 2, 'w');                // estanque
  b.rect(3, 8, 2, 1, 'F').rect(6, 8, 2, 1, 'F').rect(16, 8, 2, 1, 'F').rect(19, 8, 1, 1, 'F');
  b.rect(8, 2, 3, 1, 'F').rect(13, 2, 2, 1, 'F').rect(8, 12, 2, 3, 'F').rect(14, 12, 1, 3, 'F');
  b.rect(3, 19, 9, 1, 'f');                 // cerca sur
  b.set(3, 2, 'T').set(20, 2, 'T');
  b.building('house', 3, 4, 6, 4, { roof: '#d8504a', chimney: true }, 'casa1', 5, 6)
    .building('house', 15, 4, 6, 4, { roof: '#4a78c8', doorCol: 3 }, 'casa2', 5, 6)
    .building('house', 3, 12, 5, 4, { roof: '#5aa04a', doorCol: 2 }, 'vecino1', 4, 5)
    .building('house', 16, 12, 5, 4, { roof: '#c8843a', doorCol: 2 }, 'vecino2', 4, 5);
  b.obj({ kind: 'sign', x: 13, y: 3, text: ['PUEBLO BRISAL', 'Donde sopla primero la brisa del alba.'] });
  b.obj({ kind: 'mailbox', x: 9, y: 7, text: ['Buzón de tu casa. Está vacío.'] });
  b.obj({ kind: 'mailbox', x: 14, y: 7, text: ['Buzón de la casa de Nico.'] });
  b.obj({ kind: 'lamp', x: 10, y: 12 }).obj({ kind: 'lamp', x: 13, y: 15 });
  b.npc({ id: 'vecina', look: 'girl', x: 9, y: 16, dir: 2, wander: 2, talk: ['¿Sabías que al oeste del Sendero 1 está el Lago Espejo?', 'Dicen que en su fondo se refleja otro cielo.'] });
  b.npc({ id: 'chico', look: 'kid', x: 14, y: 2, dir: 2, talk: 'chicoBrisal' });
  b.trigger({ x: 11, y: 1, w: 2, h: 1, when: st => S(st) < 2, script: 'bloqueoNorte' });
  return b.build();
}

// ---------------------------------------------------------------- SENDERO 1
function sendero1() {
  const b = new MapBuilder('sendero1', 40, 16).meta({ name: 'Sendero 1', outdoor: true, origin: [-8, -16], encounters: 'sendero1', battleBg: 'grass' });
  b.border('T', 2);
  b.rect(0, 7, 2, 2, 'p').rect(38, 7, 2, 2, 'p');   // conexiones oeste (lago) y este (villa)
  b.rect(19, 14, 2, 2, 'p');                        // conexión sur (Brisal)
  b.rect(2, 7, 36, 2, 'p');
  b.rect(19, 9, 2, 5, 'p');
  b.rect(4, 3, 7, 4, 'g').rect(22, 10, 9, 3, 'g').rect(27, 2, 7, 4, 'g').rect(11, 10, 6, 3, 'g');
  b.rect(14, 2, 3, 3, 'T').rect(34, 10, 3, 3, 'T').rect(2, 10, 3, 2, 'T').rect(23, 3, 2, 2, 'T');
  b.rect(6, 10, 3, 1, 'F').rect(35, 3, 2, 1, 'F');
  b.obj({ kind: 'sign', x: 21, y: 12, text: ['SENDERO 1', 'Norte: Lago Espejo (oeste) · Villa Arenal (este)'] });
  b.obj({ kind: 'sign', x: 3, y: 9, text: ['← LAGO ESPEJO'] });
  b.obj({ kind: 'sign', x: 36, y: 9, text: ['VILLA ARENAL →', 'Laboratorio de la Profesora Ceiba.'] });
  b.npc({ id: 'nicoSendero', look: 'rival', x: 20, y: 9, dir: 0, when: st => S(st) === 2 && !st.flags.nicoSendero, talk: 'nicoSendero' });
  b.npc({ id: 'caminante', look: 'man', x: 25, y: 6, dir: 2, wander: 2, talk: ['El pasto alto esconde criaturas salvajes.', 'Si no tienes una compañera, ni se te ocurra meterte.'] });
  b.trigger({ x: 19, y: 13, w: 2, h: 1, when: st => S(st) === 2 && !st.flags.nicoSendero, script: 'nicoSendero' });
  b.trigger({ x: 37, y: 7, w: 1, h: 2, when: st => S(st) < 4, script: 'bloqueoEste' });
  b.trigger({ x: 4, y: 3, w: 7, h: 4, when: st => st.party.length === 0, script: 'pastoSinCriatura' });
  b.trigger({ x: 22, y: 10, w: 9, h: 3, when: st => st.party.length === 0, script: 'pastoSinCriatura' });
  b.trigger({ x: 27, y: 2, w: 7, h: 4, when: st => st.party.length === 0, script: 'pastoSinCriatura' });
  b.trigger({ x: 11, y: 10, w: 6, h: 3, when: st => st.party.length === 0, script: 'pastoSinCriatura' });
  return b.build();
}

// ---------------------------------------------------------------- LAGO ESPEJO
function lago() {
  const b = new MapBuilder('lago', 22, 20).meta({ name: 'Lago Espejo', outdoor: true, origin: [-30, -20], encounters: 'lago', battleBg: 'lake' });
  b.border('T', 2);
  b.rect(20, 11, 2, 2, 'p');
  b.rect(12, 11, 8, 2, 'p');
  b.rect(2, 3, 12, 8, 's');
  b.rect(3, 4, 10, 6, 'w').set(3, 4, 's').set(12, 4, 's').set(3, 9, 's').set(12, 9, 's');
  b.rect(5, 3, 6, 1, 'w');
  b.rect(10, 11, 2, 3, 's').rect(4, 11, 6, 2, 's');
  b.rect(14, 3, 5, 6, 'g').rect(13, 14, 6, 3, 'g');
  b.rect(2, 14, 3, 3, 'T').rect(18, 15, 2, 2, 'T');
  b.rect(6, 15, 4, 1, 'F');
  b.obj({ kind: 'sign', x: 19, y: 13, text: ['LAGO ESPEJO', 'En días quietos, el agua refleja un cielo que no es este.'] });
  b.obj({ kind: 'rock', x: 2, y: 12 }).obj({ kind: 'rock', x: 13, y: 3 });
  b.obj({ kind: 'briefcase', x: 9, y: 12, when: st => st.flags.vioProfe && S(st) < 3, script: 'escenaMaletin' });
  b.npc({ id: 'nicoLago', look: 'rival', x: 15, y: 11, dir: 2, when: st => S(st) === 2 && st.flags.nicoSendero });
  b.npc({ id: 'profeLago', look: 'prof', x: 7, y: 12, dir: 3, when: st => S(st) === 2 && st.flags.nicoSendero && !st.flags.vioProfe });
  b.npc({ id: 'ayudanteLago', look: 'aide', x: 6, y: 11, dir: 3, when: st => S(st) === 2 && st.flags.nicoSendero && !st.flags.vioProfe });
  b.trigger({ x: 17, y: 3, w: 1, h: 14, when: st => S(st) === 2 && st.flags.nicoSendero && !st.flags.vioProfe, script: 'escenaProfe' });
  b.trigger({ x: 12, y: 11, w: 1, h: 2, when: st => S(st) === 2 && st.flags.vioProfe, script: 'escenaMaletin' });
  // Evento final del Equipo Eclipse
  b.npc({ id: 'umbra', look: 'umbra', x: 8, y: 12, dir: 3, when: st => S(st) === 10 });
  b.npc({ id: 'gruntLago1', look: 'grunt', x: 7, y: 11, dir: 3, when: st => S(st) === 10 });
  b.npc({ id: 'gruntLago2', look: 'grunt', x: 9, y: 11, dir: 3, when: st => S(st) === 10 });
  b.trigger({ x: 17, y: 3, w: 1, h: 14, when: st => S(st) === 10, script: 'eventoLago' });
  b.obj({ kind: 'shimmer', x: 8, y: 10, solid: true, when: st => S(st) >= 11 && !st.flags.espejalba, script: 'espejalbaOtraVez' });
  return b.build();
}

// ---------------------------------------------------------------- VILLA ARENAL
function arenal() {
  const b = new MapBuilder('arenal', 26, 24).meta({ name: 'Villa Arenal', outdoor: true, paved: true, origin: [32, -22], battleBg: 'grass' });
  b.border('T', 2);
  b.rect(0, 13, 2, 2, 'p');                 // conexión oeste
  b.rect(2, 13, 21, 2, 'p');
  b.rect(12, 0, 2, 13, 'p').rect(12, 15, 2, 5, 'p');
  b.rect(7, 8, 1, 5, 'p').rect(18, 8, 1, 5, 'p').rect(6, 19, 1, 1, 'p').rect(17, 19, 1, 1, 'p');
  b.rect(3, 20, 17, 1, 'p');
  b.rect(19, 15, 5, 1, 's').rect(20, 16, 4, 5, 's').rect(21, 18, 3, 3, 'w');
  b.rect(3, 9, 3, 1, 'F').rect(9, 9, 2, 1, 'F').rect(15, 9, 2, 1, 'F').rect(20, 9, 2, 1, 'F').rect(9, 16, 2, 2, 'F');
  b.building('lab', 3, 3, 9, 5, {}, 'lab', 7, 9)
    .building('house', 15, 4, 6, 4, { roof: '#e05050', wall: '#fff6f0', sign: 'POSADA', signColor: '#d83a4a', doorCol: 3, flowers: false }, 'posada', 6, 7)
    .building('house', 15, 16, 5, 4, { roof: '#3a6ad8', wall: '#f0f6ff', sign: 'TIENDA', signColor: '#2a5ac8', doorCol: 2, flowers: false }, 'tienda', 5, 6)
    .building('house', 4, 16, 5, 4, { roof: '#8a6ab8', doorCol: 2 }, 'vecino3', 4, 5);
  b.obj({ kind: 'sign', x: 14, y: 11, text: ['VILLA ARENAL', 'Un pueblo de arena tibia y viento salado.'] });
  b.obj({ kind: 'sign', x: 14, y: 2, text: ['RUTA 2 ↑ CIUDAD COROLA', 'Gimnasio de tipo Planta.'] });
  b.obj({ kind: 'lamp', x: 11, y: 10 }).obj({ kind: 'lamp', x: 14, y: 16 });
  b.npc({ id: 'obrero', look: 'man', x: 14, y: 4, dir: 2, talk: ['Por la Ruta 2 se llega a Ciudad Corola.', 'Allá está el primer gimnasio.'] });
  b.trigger({ x: 12, y: 1, w: 2, h: 1, when: st => S(st) < 5, script: 'bloqueoArenal' });
  b.npc({ id: 'abuelo', look: 'old', x: 9, y: 14, dir: 3, wander: 2, talk: ['En la Posada curan a tus criaturas gratis.', 'Y en la Tienda venden Cápsulas para atrapar nuevas.'] });
  b.npc({ id: 'ayudanteVilla', look: 'aide', x: 7, y: 9, dir: 0, when: st => S(st) === 4, talk: 'ayudanteVilla' });
  return b.build();
}

// ---------------------------------------------------------------- INTERIORES
function interior(id, w, h, opt) {
  const b = new MapBuilder(id, w, h, opt.floor || 'o').meta({ name: opt.name, outdoor: false, floor: opt.floor || 'o', style: opt.style, wallColor: opt.wallColor });
  b.rect(0, 0, w, 2, 'W');
  return b;
}

function cuarto() {
  const b = interior('cuarto', 9, 7, { name: 'Tu cuarto', wallColor: '#f6e2d0' });
  b.set(8, 2, 'S').rect(3, 4, 3, 2, 'r');
  b.warp(8, 2, 'casa1', 9, 3, { face: 0 });
  b.furniture('bed', 0, 2, 1, 2, { sx: 0, sy: -2, text: ['Tu cama. Todavía está tibia.'] });
  b.furniture('desk', 2, 2, 2, 1, { sx: 0, sy: -12, text: ['Tu computadora. Tiene correo nuevo:', '"Gran hallazgo en el Lago Espejo" — Noticias de Alborada.'] });
  b.furniture('tv', 5, 2, 1, 1, { sx: 0, sy: -4, text: ['En la tele pasan un programa sobre criaturas del lago.'] });
  b.furniture('console', 5, 4, 1, 1, { solid: false, sx: 0, sy: 4 });
  b.furniture('plant', 0, 6, 1, 1, { sy: -8 });
  b.deco('window', 40, 2).deco('picture', 100, 6);
  return b.build();
}

function casa1() {
  const b = interior('casa1', 11, 8, { name: 'Tu casa' });
  b.set(9, 2, 'U').set(5, 7, 'm').rect(0, 7, 5, 1, ' ').rect(6, 7, 5, 1, ' ');
  b.warp(9, 2, 'cuarto', 8, 3, { face: 0 });
  b.warp(5, 7, 'brisal', 5, 8, { face: 0, needDir: 0 });
  b.furniture('kitchen', 0, 2, 2, 1, { sy: -12, text: ['La cocina. Huele a pan recién hecho.'] });
  b.furniture('fridge', 2, 2, 1, 1, { sy: -16, text: ['El refrigerador. Lleno de jugo de mora.'] });
  b.furniture('tv', 6, 2, 1, 1, { sy: -4, text: ['Noticias: "Una profesora regresa a Villa Arenal tras estudiar el Lago Espejo".'] });
  b.furniture('table', 4, 4, 2, 1, { sy: -8 });
  b.furniture('chair', 3, 4, 1, 1, { sy: 0 }).furniture('chair', 6, 4, 1, 1, { sy: 0 });
  b.furniture('plant', 0, 6, 1, 1, { sy: -8 }).furniture('plant', 10, 6, 1, 1, { sy: -8 });
  b.furniture('shelf', 7, 2, 2, 1, { sy: -16, text: ['Libros de cocina y una enciclopedia de criaturas.'] });
  b.deco('clock', 70, 4).deco('window', 2 * 16 + 20, 2);
  b.npc({ id: 'mama', look: 'mom', x: 5, y: 5, dir: 1, talk: 'mama' });
  b.trigger({ x: 9, y: 3, w: 1, h: 1, when: st => S(st) === 0, script: 'mamaInicio' });
  b.trigger({ x: 5, y: 6, w: 1, h: 1, when: st => S(st) === 3, script: 'mamaRegreso' });
  return b.build();
}

function casa2() {
  const b = interior('casa2', 11, 8, { name: 'Casa de Nico', wallColor: '#e2ecf6' });
  b.set(1, 2, 'U').set(5, 7, 'm').rect(0, 7, 5, 1, ' ').rect(6, 7, 5, 1, ' ');
  b.warp(1, 2, 'casa2f2', 0, 3, { face: 0 });
  b.warp(5, 7, 'brisal', 18, 8, { face: 0, needDir: 0 });
  b.furniture('kitchen', 9, 2, 2, 1, { sy: -12 });
  b.furniture('tv', 4, 2, 1, 1, { sy: -4, text: ['Pasan un concurso de preguntas. Nico siempre grita las respuestas.'] });
  b.furniture('sofa', 3, 4, 2, 1, { sy: -6 });
  b.furniture('table', 6, 5, 2, 1, { sy: -8 });
  b.furniture('plant', 10, 6, 1, 1, { sy: -8 }).furniture('plant', 0, 6, 1, 1, { sy: -8 });
  b.deco('picture', 104, 6);
  b.npc({ id: 'mamaNico', look: 'rivalMom', x: 8, y: 4, dir: 0, talk: 'mamaNico' });
  return b.build();
}

function casa2f2() {
  const b = interior('casa2f2', 9, 7, { name: 'Cuarto de Nico', wallColor: '#e2ecf6' });
  b.set(0, 2, 'S').rect(3, 4, 3, 2, 'r');
  b.warp(0, 2, 'casa2', 1, 3, { face: 0 });
  b.furniture('bed', 8, 2, 1, 2, { sy: -2 });
  b.furniture('shelf', 3, 2, 2, 1, { sy: -16, text: ['Pura revista de aventuras. Algunas están rayadas con "¡YO SERÉ EL MEJOR!"'] });
  b.furniture('boxes', 6, 2, 1, 1, { sy: -2 });
  b.deco('window', 92, 2);
  b.npc({ id: 'nicoCuarto', look: 'rival', x: 4, y: 3, dir: 0, when: st => S(st) === 1, talk: 'nicoCuarto' });
  return b.build();
}

function vecino(id, name, look, lines, back) {
  const b = interior(id, 9, 7, { name, wallColor: '#f2e8d2' });
  b.set(4, 6, 'm').rect(0, 6, 4, 1, ' ').rect(5, 6, 4, 1, ' ');
  b.warp(4, 6, back[0], back[1], back[2], { face: 0, needDir: 0 });
  b.furniture('table', 3, 3, 2, 1, { sy: -8 });
  b.furniture('shelf', 6, 2, 2, 1, { sy: -16 });
  b.furniture('plant', 0, 2, 1, 1, { sy: -8 }).furniture('tv', 1, 2, 1, 1, { sy: -4 });
  b.deco('window', 44, 2);
  b.npc({ id: id + 'npc', look, x: 6, y: 4, dir: 2, talk: lines });
  return b.build();
}

function lab() {
  const b = interior('lab', 15, 11, { name: 'Laboratorio Ceiba', floor: 'k', style: 'lab' });
  b.set(7, 10, 'm').rect(0, 10, 7, 1, ' ').rect(8, 10, 7, 1, ' ');
  b.warp(7, 10, 'arenal', 7, 8, { face: 0, needDir: 0 });
  b.furniture('machine', 1, 2, 2, 1, { sy: -24, text: ['Una máquina que analiza muestras del Lago Espejo.'] });
  b.furniture('machine', 4, 2, 2, 1, { sy: -24 });
  b.furniture('pc', 7, 2, 1, 1, { sy: -14, text: ['Archivo de la Profesora Ceiba: "Las criaturas del lago parecen recordar."'] });
  b.furniture('shelf', 10, 2, 2, 1, { sy: -16 }).furniture('shelf', 12, 2, 2, 1, { sy: -16 });
  b.furniture('labTable', 2, 6, 2, 1, { sy: -8 }).furniture('labTable', 11, 6, 2, 1, { sy: -8 });
  b.furniture('plant', 0, 9, 1, 1, { sy: -8 }).furniture('plant', 14, 9, 1, 1, { sy: -8 });
  b.npc({ id: 'profe', look: 'prof', x: 7, y: 4, dir: 0, talk: 'profe' });
  b.npc({ id: 'ayudanteLab', look: 'aide', x: 11, y: 8, dir: 2, wander: 1, talk: ['La profe se la pasa en el Lago Espejo.', 'Dice que allá todo empezó.'] });
  b.trigger({ x: 7, y: 9, w: 1, h: 1, when: st => S(st) === 4, script: 'profeEntrega' });
  return b.build();
}

function posada() {
  const b = interior('posada', 13, 9, { name: 'Posada Vital', floor: 'k', style: 'center' });
  b.set(6, 8, 'm').rect(0, 8, 6, 1, ' ').rect(7, 8, 6, 1, ' ');
  b.warp(6, 8, 'arenal', 18, 8, { face: 0, needDir: 0 });
  b.furniture('counter', 4, 3, 5, 1, { sy: -8, counter: true, arg: 5 });
  b.furniture('healer', 7, 2, 2, 1, { sy: -14, solid: true });
  b.furniture('pc', 11, 2, 1, 1, { sy: -14, text: ['Un PC de almacenamiento. (Disponible en la Etapa 2.)'] });
  b.furniture('sofa', 1, 6, 2, 1, { sy: -6 }).furniture('plant', 0, 2, 1, 1, { sy: -8 }).furniture('plant', 12, 2, 1, 1, { sy: -8 });
  b.furniture('table', 9, 6, 2, 1, { sy: -8 });
  b.npc({ id: 'enfermera', look: 'nurse', x: 6, y: 2, dir: 0, talk: 'posada', arg: { map: 'posada', x: 6, y: 7 } });
  b.npc({ id: 'mensajeraArenal', look: 'courier', x: 10, y: 5, dir: 2, talk: 'viaje' });
  b.npc({ id: 'viajero', look: 'girl', x: 2, y: 5, dir: 0, talk: ['Cuando tus criaturas estén cansadas, habla con la enfermera Malva.'] });
  return b.build();
}

function tienda() {
  const b = interior('tienda', 11, 8, { name: 'Tienda Arenal', floor: 'k', style: 'lab' });
  b.set(5, 7, 'm').rect(0, 7, 5, 1, ' ').rect(6, 7, 5, 1, ' ');
  b.warp(5, 7, 'arenal', 17, 20, { face: 0, needDir: 0 });
  b.furniture('shopCounter', 1, 3, 4, 1, { sy: -8, counter: true, arg: 4 });
  b.furniture('storeShelf', 6, 3, 2, 1, { sy: -14 }).furniture('storeShelf', 9, 3, 2, 1, { sy: -14 });
  b.furniture('storeShelf', 6, 5, 2, 1, { sy: -14 }).furniture('storeShelf', 9, 5, 2, 1, { sy: -14 });
  b.furniture('plant', 0, 2, 1, 1, { sy: -8 });
  b.furniture('vending', 10, 2, 1, 1, { sy: -18, script: 'maquina' });
  b.npc({ id: 'dependiente', look: 'clerk', x: 2, y: 2, dir: 0, talk: 'tienda', town: 'arenal' });
  b.npc({ id: 'vendedora', look: 'vendor', x: 4, y: 2, dir: 0, talk: 'tiendaEspecial', town: 'arenal' });
  b.npc({ id: 'cliente', look: 'kid', x: 8, y: 4, dir: 1, talk: ['¡Con Cápsulas puedes atrapar criaturas!', 'Primero bájales los PS, así es más fácil.'] });
  return b.build();
}

export function buildMaps() {
  const list = [
    brisal(), sendero1(), lago(), arenal(),
    cuarto(), casa1(), casa2(), casa2f2(), lab(), posada(), tienda(),
    vecino('vecino1', 'Casa de los Robles', 'old', ['Hace años vi una sombra enorme en el Lago Espejo.', 'Nunca supe qué era.'], ['brisal', 5, 16]),
    vecino('vecino2', 'Casa de los Ocampo', 'man', ['¿Sabías que las criaturas suben de nivel ganando combates?', 'Y al subir aprenden movimientos nuevos.'], ['brisal', 18, 16]),
    vecino('vecino3', 'Casa de la playa', 'girl', ['Mi abuela dice que el mar trae criaturas raras en invierno.'], ['arenal', 6, 20])
  ];
  list.push(...buildStoryMaps());
  return Object.fromEntries(list.map(m => [m.id, m]));
}
