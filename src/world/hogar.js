// Vida en Tierra Grande: moteles de carretera, casas propias (lote, construcción y muebles) y los datos de las
// personas con las que se puede salir. Los interiores se generan como los de las posadas: siempre iguales;
// lo que cambia con la partida (si la casa está hecha, qué muebles hay) va en condiciones `when` y `dyn`.
import { MapBuilder } from './builder.js';

// ---------------------------------------------------------------- Casas
// Tres modelos. Todos dejan la puerta en la misma casilla del lote (10, 11), así la entrada no cambia.
export const HOUSE_MODELS = {
  sencilla: { name: 'Casa sencilla', price: 12000, dx: 7, dy: 7, w: 6, h: 5, doorCol: 3, floors: 1, desc: 'Un piso, techo de teja y jardín.' },
  dospisos: { name: 'Casa de dos pisos', price: 28000, dx: 7, dy: 7, w: 7, h: 5, doorCol: 3, floors: 2, desc: 'Dos pisos con ventanas grandes.' },
  casona: { name: 'Casona con piscina', price: 55000, dx: 6, dy: 6, w: 9, h: 6, doorCol: 4, floors: 2, chimney: true, pool: true, desc: 'Dos pisos, chimenea y piscina en el patio.' }
};
export const LOT_DOOR = [10, 11];
export const WALL_COLORS = [['Crema', '#f6eedc'], ['Durazno', '#f6d2b4'], ['Menta', '#d6eedc'], ['Celeste', '#d4e6f6']];
export const ROOF_COLORS = [['Teja roja', '#d8504a'], ['Azul', '#3f7fc8'], ['Verde', '#4f9a5a'], ['Café', '#8a5a3a']];
// Forma de la casa construida en el lote (coordenadas del mapa donde cae el lote: ox, oy = esquina de la manzana).
export function houseShape(h, ox, oy) {
  const M = HOUSE_MODELS[h?.model] || HOUSE_MODELS.sencilla;
  return { x: ox + M.dx, y: oy + M.dy, w: M.w, h: M.h, opt: { wall: h?.wall || '#f6eedc', roof: h?.roof || '#d8504a', doorCol: M.doorCol, floors: M.floors, chimney: !!M.chimney } };
}
export const houseOf = (st, lot) => st?.houses?.[lot] || null;
export const ownsFurniture = (st, lot, id) => !!houseOf(st, lot)?.furniture?.includes(id);

// Catálogo de muebles (se compran en el computador de la casa). Cada mueble pone una o varias piezas en su lugar.
export const FURNITURE = [
  { id: 'cocina', name: 'Cocina integral', price: 3500, pieces: [['kitchen', 10, 2, 2, 1, { sy: -12, text: ['Tu cocina. Huele a arepa recién asada.'] }]] },
  { id: 'nevera', name: 'Nevera', price: 2800, pieces: [['fridge', 12, 2, 1, 1, { sy: -16, text: ['La nevera: jugo de lulo, queso y bocadillo.'] }]] },
  { id: 'tele', name: 'Televisor', price: 2500, pieces: [['tv', 5, 2, 1, 1, { sy: -4, text: ['Están pasando la final de la Liga Alborada... ¡repetida!'] }]] },
  { id: 'consola', name: 'Consola de videojuegos', price: 1800, pieces: [['console', 5, 4, 1, 1, { solid: false, sy: 4 }]] },
  { id: 'comedor', name: 'Comedor con dos sillas', price: 3000, pieces: [['table', 10, 4, 2, 1, { sy: -8 }], ['chair', 9, 4, 1, 1, {}], ['chair', 12, 4, 1, 1, {}]] },
  { id: 'sofa', name: 'Sofá', price: 2600, pieces: [['sofa', 3, 5, 2, 1, { sy: -6 }]] },
  { id: 'biblioteca', name: 'Biblioteca', price: 2200, pieces: [['shelf', 7, 2, 2, 1, { sy: -16, text: ['Novelas, recetas y un atlas de Tierra Grande.'] }]] },
  { id: 'hamaca', name: 'Hamaca', price: 1500, pieces: [['hammock', 0, 7, 2, 1, { sy: -8, text: ['Una hamaca de colores. Provoca echarse a dormir la siesta.'] }]] },
  { id: 'acuario', name: 'Acuario', price: 3200, pieces: [['aquarium', 9, 7, 2, 1, { sy: -12, text: ['Unos pececitos de colores nadan entre las plantas.'] }]] },
  { id: 'guitarra', name: 'Guitarra', price: 1200, pieces: [['guitar', 13, 7, 1, 1, { sy: -10, text: ['Una guitarra. Sabes tocar tres acordes... y con eso basta.'] }]] },
  { id: 'alfombra', name: 'Alfombra', price: 900, pieces: [['rug', 4, 6, 3, 2, { solid: false, flat: true }]] },
  { id: 'peluche', name: 'Peluche gigante', price: 2000, pieces: [['plush', 12, 7, 1, 1, { sy: -6, text: ['Un peluche gigante y blandito. Da ganas de abrazarlo.'] }]] },
  { id: 'matas', name: 'Matas', price: 600, pieces: [['plant', 13, 2, 1, 1, { sy: -8 }], ['plant', 0, 9 - 1, 1, 1, { sy: -8 }]] },
  { id: 'cuadro', name: 'Cuadro de paisaje', price: 800, deco: [['picture', 70, 6]] }
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));

// Interior de tu casa: cama (dormir, curar, guardar y volver aquí), computador con el catálogo de muebles,
// y los muebles que hayas comprado.
export function casaPropiaGen(id, lot, back) {
  const b = new MapBuilder(id, 14, 10, 'o').meta({ name: 'Tu casa', outdoor: false, floor: 'o', wallColor: '#f6e8d6', region: 'tierra', lot });
  b.rect(0, 0, 14, 2, 'W');
  b.set(6, 9, 'm').rect(0, 9, 6, 1, ' ').rect(7, 9, 7, 1, ' ');
  b.warp(6, 9, back[0], back[1], back[2], { face: 0, needDir: 0 });
  b.furniture('bed', 0, 2, 1, 2, { sy: -2, script: 'camaCasa', lot });
  b.furniture('desk', 2, 2, 2, 1, { sy: -12, script: 'catalogo', lot });
  b.deco('window', 3 * 16 + 52, 2);
  for (const f of FURNITURE) {
    const when = st => ownsFurniture(st, lot, f.id);
    for (const [name, x, y, w, h, opt] of f.pieces || []) b.furniture(name, x, y, w, h, { ...opt, when });
    for (const [name, px, py] of f.deco || []) b.obj({ kind: 'deco', name, px, py, when });
  }
  return b.build();
}

// ---------------------------------------------------------------- Moteles
export const MOTEL_PRICE = 300;
export function motelGen(id, name, back, mid) {
  const b = new MapBuilder(id, 13, 9, 'k').meta({ name, outdoor: false, floor: 'k', style: 'center', wallColor: '#f4e2d6', region: 'tierra' });
  b.rect(0, 0, 13, 2, 'W');
  b.set(6, 8, 'm').rect(0, 8, 6, 1, ' ').rect(7, 8, 6, 1, ' ');
  b.warp(6, 8, back[0], back[1], back[2], { face: 0, needDir: 0 });
  b.furniture('counter', 1, 3, 4, 1, { sy: -8, counter: true, arg: 4 });
  b.furniture('plant', 0, 2, 1, 1, { sy: -8 });
  b.furniture('vending', 6, 2, 1, 1, { sy: -18, script: 'maquina' });
  b.furniture('tv', 8, 2, 1, 1, { sy: -4, text: ['Dan el pronóstico: sol en el llano, lluvia en la selva y nieve en el páramo.'] });
  b.furniture('bed', 10, 2, 1, 2, { sy: -2, script: 'motelCama', arg: mid });
  b.furniture('bed', 12, 2, 1, 2, { sy: -2, script: 'motelCama', arg: mid });
  b.furniture('sofa', 1, 6, 2, 1, { sy: -6 });
  b.furniture('table', 9, 6, 2, 1, { sy: -8 });
  b.deco('picture', 52, 6);
  b.npc({ id: id + 'Rec', look: 'clerk', x: 2, y: 2, dir: 0, talk: 'motel', arg: mid, name: 'Recepcionista' });
  return b.build();
}
// Dormir: horas del reloj del juego a las que despiertas.
export const WAKE = { noche: 20, manana: 7 };

// ---------------------------------------------------------------- Pareja
// Personas adultas de Tierra Grande con las que puedes salir. Cada una vive en una ciudad y tiene sus regalos
// favoritos. Todo es de citas, regalos y paseos: apto para cualquier edad.
export const CANDIDATES = {
  valentina: { name: 'Valentina', look: 'valentina', city: 'bahia', a: 'a', job: 'veterinaria del puerto', loves: ['ramoFlores', 'peluche'], likes: ['chocolates', 'cafe'],
    hi: ['¡Hola! Soy Valentina, la veterinaria de Bahía Dorada.', 'Si algún día tu Puchamon se enferma, aquí estoy. Y si no... también.'],
    talk: [['Hoy me tocó curar a un Careyín que se comió una bolsa. ¡Pobrecito!'], ['Me encanta caminar por la playa al atardecer.'], ['¿Tú también hablas con tus Puchamon? Yo con los míos tengo conversaciones enteras.']] },
  julian: { name: 'Julián', look: 'julian', city: 'altamira', a: 'o', job: 'guía de montaña', loves: ['cafe', 'mochila'], likes: ['chocolates', 'ramoFlores'],
    hi: ['¿Qué más? Me llamo Julián, soy guía de montaña aquí en Altamira.', 'Conozco cada sendero de la sierra. Si quieres, un día te llevo.'],
    talk: [['Esta mañana vi un Condoral volando tan bajito que le vi los ojos.'], ['El mejor café del mundo se toma a cuatro mil metros, con frío.'], ['Cuando hay neblina en el páramo, los Frailejones parecen gente quieta.']] },
  mariana: { name: 'Mariana', look: 'mariana', city: 'medano', a: 'a', job: 'ceramista', loves: ['mochila', 'ramoFlores'], likes: ['cafe', 'peluche'],
    hi: ['¡Hola, forastero! Soy Mariana. Hago vasijas de barro con la arena del desierto.', 'Este calor seca el barro en un ratico, por eso aquí trabajo feliz.'],
    talk: [['Le pinté un Cactín a una vasija y se vendió en un minuto.'], ['En el desierto las noches son llenas de estrellas. Hay que verlas.'], ['Un día me gustaría abrir un taller en Bahía Dorada, frente al mar.']] },
  samuel: { name: 'Samuel', look: 'samuel', city: 'cruce', a: 'o', job: 'cocinero', loves: ['chocolates', 'cafe'], likes: ['ramoFlores', 'mochila'],
    hi: ['¡Bienvenido a Villa Cruce! Soy Samuel, el de las arepas.', 'Por aquí pasa todo el que viaja: nadie se va sin probar una.'],
    talk: [['El secreto de la arepa es el maíz pelado y mucho cariño.'], ['Un Llamarón me ayudó a prender el fogón el otro día. ¡Qué servicio!'], ['Quiero ganar el concurso de cocina de Tierra Grande este año.']] },
  luciana: { name: 'Luciana', look: 'luciana', city: 'palma', a: 'a', job: 'bióloga de la selva', loves: ['peluche', 'cafe'], likes: ['chocolates', 'mochila'],
    hi: ['¡Shhh! Hay un Pintín durmiendo en esa rama... Hola, soy Luciana.', 'Estudio a los Puchamon de la selva. Llevo tres años aquí en Pueblo Palma.'],
    talk: [['Los Temblones se juntan en el río cuando va a llover. Nadie sabe por qué.'], ['Anoche escuché una flauta en el río... ¿será el Mohán?'], ['Mi sueño es ver un Jaguarón de cerquita. Pero no TAN de cerquita.']] },
  felipe: { name: 'Felipe', look: 'felipe', city: 'pino', a: 'o', job: 'músico', loves: ['chocolates', 'ramoFlores'], likes: ['peluche', 'cafe'],
    hi: ['¡Ey! Soy Felipe. Toco el tiple en la plaza de Pueblo Pino.', 'Si te gusta la música, quédate un ratico. Si no... también.'],
    talk: [['Estoy componiendo una canción sobre un Lechuzón que no podía dormir.'], ['En el bosque de pinos la música suena distinto, como con eco.'], ['Algún día quiero tocar en la Liga Alborada, antes de la final.']] }
};
export const GIFTS = ['ramoFlores', 'chocolates', 'peluche', 'cafe', 'mochila'];
export const LOVE = { talk: 4, love: 15, like: 9, gift: 4, date: 12, ask: 70, dates: 3, first: 25 };
// Día del juego: avanza al dormir y cada 15 minutos jugados (así una cita por día no se demora una vida).
export const dayOf = st => (st.day || 0) + Math.floor((st.playTime || 0) / (60 * 60 * 15));
export function romanceOf(st, id) {
  st.romance = st.romance || {};
  return st.romance[id] = st.romance[id] || { pts: 0, dates: 0, talk: -1, gift: -1, date: -1, met: false };
}
// Dónde está cada persona en su ciudad: frente a la posada, al lado de la tienda (en casillas de Tierra Grande).
export function candidateSpot(c) {
  const BLOCK = 24, cx = Math.floor((c.x0 + c.x1) / 2 / BLOCK), cy = Math.floor((c.y0 + c.y1) / 2 / BLOCK);
  return [cx * BLOCK + 4 + 13, cy * BLOCK + 4 + 12];
}
