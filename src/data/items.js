// Objetos de Alborada (contenido original): catálogo, bolsillos de la mochila, qué vende cada tienda
// y los efectos que comparten el combate y el menú de la mochila.
import { SPECIES, MOVES, STATUS, expForLevel, refreshStats } from './creatures.js';
import { TYPES } from './types.js';

// ---------- Bolsillos de la mochila ----------
export const POCKETS = {
  capsulas: { name: 'Cápsulas', color: '#d8574a' },
  medicinas: { name: 'Medicinas', color: '#3f9e62' },
  batalla: { name: 'Batalla', color: '#d68a14' },
  campo: { name: 'Campo', color: '#3f7fc8' },
  cuidado: { name: 'Cuidado', color: '#9a5cc0' },
  equipo: { name: 'Equipables', color: '#d0603a' },
  clave: { name: 'Clave', color: '#c89a2a' }
};
export const POCKET_ORDER = ['capsulas', 'medicinas', 'batalla', 'campo', 'cuidado', 'equipo', 'clave'];
// En combate sólo se abren estos bolsillos.
export const BATTLE_POCKETS = ['capsulas', 'medicinas', 'batalla'];

const item = (pocket, icon) => (name, price, desc, color, extra = {}) => ({ name, price, desc, pocket, icon, color, ...extra });
const cap = item('capsulas', 'capsule');
const gear = icon => item('equipo', icon);
// Amuleto de tipo: +20% de daño a los ataques de ese tipo.
const charm = (name, type, desc) => gear('charm')(name, 2500, `Equipado: sus ataques de tipo ${TYPES[type].name.charAt(0) + TYPES[type].name.slice(1).toLowerCase()} hacen 20% más de daño. ${desc}`, TYPES[type].color, { held: { kind: 'type', type, mult: 1.2 } });
const spray = item('medicinas', 'spray');
const drink = item('medicinas', 'drink');
const drop = item('medicinas', 'drop');
const flask = item('batalla', 'flask');
const can = item('campo', 'can');
const seed = item('cuidado', 'seed');

export const ITEMS = {
  // Cápsulas: el color es el de la mitad pintada de la cápsula (la otra mitad es crema).
  capsula: cap('Cápsula', 200, 'Sirve para atrapar criaturas salvajes.', '#3a9ad8'),
  supercapsula: cap('Supercápsula', 600, 'Atrapa criaturas con más facilidad que una Cápsula.', '#e04848', { catchBonus: 1.6 }),
  hipercapsula: cap('Hipercápsula', 1200, 'Cápsula de alto rendimiento: atrapa mucho mejor que una Supercápsula.', '#f0b428', { catchBonus: 2.2 }),
  capsulaVeloz: cap('Cápsula Veloz', 1000, 'Funciona de maravilla si la lanzas en el primer turno del combate.', '#2ab8b0', { special: 'fast' }),
  capsulaOcaso: cap('Cápsula Ocaso', 1000, 'Atrapa mucho mejor de noche y dentro de las cuevas.', '#5a4a96', { special: 'dusk' }),
  capsulaReloj: cap('Cápsula Reloj', 1000, 'Mientras más turnos dure el combate, mejor funciona.', '#c8642e', { special: 'timer' }),
  capsulaMalla: cap('Cápsula Malla', 1000, 'Tejida con red de pescador: ideal para criaturas de tipo Agua o Bicho.', '#3f9a5e', { special: 'net' }),
  capsulaAlba: cap('Cápsula Alba', 200, 'Edición especial del color del amanecer. Funciona igual que una Cápsula.', '#f29ab0', { gift: true }),

  // Medicinas
  tonico: spray('Tónico', 300, 'Restaura 20 PS de una criatura.', '#9a6ad0', { heal: 20 }),
  supertonico: spray('Supertónico', 700, 'Restaura 60 PS de una criatura.', '#e0588a', { heal: 60 }),
  hipertonico: spray('Hipertónico', 1200, 'Restaura 120 PS de una criatura.', '#e8862a', { heal: 120 }),
  tonicoMax: spray('Tónico Máximo', 2500, 'Restaura todos los PS de una criatura.', '#2a8ed8', { heal: 'full' }),
  despertar: item('medicinas', 'heart')('Revivir', 1500, 'Reanima a una criatura debilitada con la mitad de sus PS.', '#f0c030', { revive: 0.5 }),
  aguaPanela: drink('Agua de Panela', 200, 'Bebida dulce y calientica. Restaura 40 PS.', '#c8873a', { heal: 40 }),
  jugoLulo: drink('Jugo de Lulo', 300, 'Jugo fresco y bien ácido. Restaura 60 PS.', '#e8c030', { heal: 60 }),
  avena: drink('Avena', 400, 'Avena fría y espesa. Restaura 80 PS.', '#efe2c4', { heal: 80 }),
  // Curas de estado
  antidoto: spray('Antídoto', 100, 'Cura el envenenamiento de una criatura.', '#4aa85a', { cure: 'ven' }),
  arnica: spray('Pomada de Árnica', 200, 'Alivia los músculos tiesos: cura la parálisis.', '#e0b030', { cure: 'par' }),
  tinto: drink('Tinto Cargado', 250, 'Un café bien cargado que despierta a cualquiera.', '#6a3a1e', { cure: 'dor' }),
  sabila: item('medicinas', 'jar')('Gel de Sábila', 250, 'Gel fresquito que cura las quemaduras.', '#3f9a5e', { cure: 'que' }),
  panelaCaliente: drink('Panela Caliente', 250, 'Bebida hirviendo que descongela a una criatura.', '#d8782a', { cure: 'con' }),
  remedioCasero: item('medicinas', 'heart')('Remedio Casero', 600, 'El remedio de la abuela: cura cualquier estado.', '#e86a9a', { cure: 'all' }),
  rocio: drop('Rocío', 1500, 'Gotas del amanecer. Recupera 10 PP de cada movimiento de una criatura.', '#5ac8e8', { pp: 10 }),
  rocioPuro: drop('Rocío Puro', 3000, 'Recupera todos los PP de todos los movimientos de una criatura.', '#3a7af0', { pp: 'full' }),

  // Batalla: sólo durante un combate, sobre la criatura que está peleando.
  pocimaFuerza: flask('Pócima Fuerza', 500, 'Sube el Ataque de tu criatura mientras dure el combate.', '#e0583a', { boost: 'atk' }),
  pocimaCoraza: flask('Pócima Coraza', 550, 'Sube la Defensa de tu criatura mientras dure el combate.', '#c89a30', { boost: 'def' }),
  pocimaViento: flask('Pócima Viento', 350, 'Sube la Velocidad de tu criatura mientras dure el combate.', '#3aaee0', { boost: 'spe' }),
  pocimaCertera: flask('Pócima Certera', 650, 'Hace mucho más probables los golpes críticos de tu criatura.', '#d8c030', { boost: 'crit' }),

  // Campo
  repelente: can('Repelente', 350, 'Durante 100 pasos ahuyenta a las criaturas salvajes más débiles que la primera de tu equipo.', '#5aa850', { repel: 100 }),
  repelenteFuerte: can('Repelente Fuerte', 500, 'Como el Repelente, pero dura 200 pasos.', '#2f9a8a', { repel: 200 }),
  repelenteTotal: can('Repelente Total', 700, 'Como el Repelente, pero dura 250 pasos.', '#2a62a8', { repel: 250 }),
  silbato: item('campo', 'whistle')('Silbato de Regreso', 550, 'Llama a la Mensajera, que te lleva volando a la última Posada donde descansaste.', '#d8b040', { escape: true }),
  miel: item('campo', 'jar')('Miel Silvestre', 300, 'Úsala en el pasto alto o en una cueva para atraer a una criatura salvaje.', '#f0a020', { lure: true }),

  // Cuidado: mejoras permanentes.
  semillaVital: seed('Semilla Vital', 3000, 'Sube para siempre los PS máximos de una criatura.', '#e05a6a', { seed: 'hp' }),
  semillaFuerza: seed('Semilla Fuerza', 3000, 'Sube para siempre el Ataque de una criatura.', '#e0883a', { seed: 'atk' }),
  semillaCoraza: seed('Semilla Coraza', 3000, 'Sube para siempre la Defensa de una criatura.', '#b89a48', { seed: 'def' }),
  semillaViento: seed('Semilla Viento', 3000, 'Sube para siempre la Velocidad de una criatura.', '#48a8d8', { seed: 'spe' }),
  dulce: item('cuidado', 'candy')('Dulce de Arequipe', 4800, 'Un dulce delicioso: la criatura que lo come sube un nivel.', '#b8743a', { levelUp: true }),

  // Equipables: cada criatura lleva uno; se da desde el Equipo o la Mochila y actúa solo en combate.
  cintaFuerza: gear('ribbon')('Cinta de Fuerza', 3000, 'Equipada: todos sus ataques hacen 10% más de daño.', '#e04a3a', { held: { kind: 'power', mult: 1.1 } }),
  panueloVeloz: gear('scarf')('Pañuelo Veloz', 3000, 'Equipado: su Velocidad sube 20% en combate.', '#3ab0e0', { held: { kind: 'speed', mult: 1.2 } }),
  chalecoAcolchado: gear('vest')('Chaleco Acolchado', 3000, 'Equipado: recibe 12% menos daño de los ataques.', '#a07850', { held: { kind: 'guard', mult: .88 } }),
  arepaReserva: gear('arepa')('Arepa de Reserva', 4000, 'Equipada: al final de cada turno recupera un poquito de PS.', '#f0d890', { held: { kind: 'regen', frac: 1 / 16 } }),
  guayaba: gear('fruit')('Guayaba Madura', 400, 'Equipada: cuando le quedan pocos PS se la come y recupera la cuarta parte. Se gasta.', '#f08aa0', { held: { kind: 'berry', at: .5, heal: .25 } }),
  brasaEterna: charm('Brasa Eterna', 'fuego', 'Un carbón que nunca se apaga.'),
  perlaDeRio: charm('Perla de Río', 'agua', 'Brilla como el agua en la mañana.'),
  broteVivo: charm('Brote Vivo', 'planta', 'Sigue creciendo dentro de su frasquito.'),
  bobinaDeCobre: charm('Bobina de Cobre', 'electrico', 'Hecha en los talleres de Pueblo Cobre.'),
  escarchaEterna: charm('Escarcha Eterna', 'hielo', 'Hielo de los nevados que no se derrite.'),
  vendaDeCampeon: charm('Venda de Campeón', 'lucha', 'La usaron los mejores boxeadores de los cerros.'),
  cristalMental: charm('Cristal Mental', 'psiquico', 'Zumba suavecito cuando alguien piensa cerca.'),
  escamaAntigua: charm('Escama Antigua', 'dragon', 'De un dragón que nadie ha vuelto a ver.'),
  velaDeNiebla: charm('Vela de Niebla', 'fantasma', 'Su llama es morada y no da calor.'),

  // Clave: no se gastan ni se venden.
  brazaleteAlba: item('clave', 'band')('Brazalete Alba', 0, 'Despierta la Forma Alba una vez por combate. En LUCHAR, toca FORMA ALBA antes de escoger el ataque.', '#f0c040', { key: true })
};
export const isCapsule = id => ITEMS[id]?.pocket === 'capsulas';
export const sellPrice = id => Math.floor((ITEMS[id]?.price || 0) / 2);
// Los objetos clave no se venden ni se gastan.
export const isKeyItem = id => !!ITEMS[id]?.key;

// ---------- Qué vende cada tienda ----------
// Mostrador general: crece con las medallas, como en la portátil.
const GENERAL = [
  ['capsula', 0], ['supercapsula', 0], ['tonico', 0], ['supertonico', 0], ['despertar', 0], ['antidoto', 0], ['tinto', 0], ['arnica', 0], ['rocio', 0], ['repelente', 0], ['silbato', 0],
  ['hipertonico', 1], ['sabila', 1], ['panelaCaliente', 1], ['repelenteFuerte', 1],
  ['hipercapsula', 2], ['tonicoMax', 2], ['remedioCasero', 2], ['repelenteTotal', 2],
  ['rocioPuro', 3], ['guayaba', 1], ['vendaDeCampeon', 3], ['cristalMental', 3], ['escamaAntigua', 3], ['velaDeNiebla', 3]
];
// Mostrador especial de cada ciudad (lo atiende la vendedora del delantal).
export const SPECIAL = {
  arenal: { name: 'Rincón del Explorador', items: ['miel', 'pocimaFuerza', 'pocimaViento', 'guayaba', 'cintaFuerza'] },
  corola: { name: 'Vivero de Corola', items: ['semillaVital', 'semillaFuerza', 'semillaCoraza', 'semillaViento', 'miel', 'broteVivo', 'arepaReserva'] },
  cobre: { name: 'Taller de Cápsulas', items: ['capsulaVeloz', 'capsulaOcaso', 'capsulaReloj', 'capsulaMalla', 'bobinaDeCobre', 'panueloVeloz', 'chalecoAcolchado'] },
  marea: { name: 'Botica del Puerto', items: ['pocimaFuerza', 'pocimaCoraza', 'pocimaViento', 'pocimaCertera', 'dulce', 'perlaDeRio', 'escarchaEterna', 'brasaEterna'] },
  guadua: { name: 'Canastos de la Selva', items: ['miel', 'remedioCasero', 'guayaba', 'capsulaMalla', 'rocio'] },
  caracol: { name: 'Puesto del Muelle', items: ['perlaDeRio', 'capsulaVeloz', 'dulce', 'panelaCaliente', 'despertar'] },
  voltio: { name: 'Taller del Viento', items: ['bobinaDeCobre', 'panueloVeloz', 'capsulaVeloz', 'pocimaViento', 'repelenteTotal', 'rocio'] },
  niebla: { name: 'Velería de la Bruma', items: ['velaDeNiebla', 'capsulaOcaso', 'cristalMental', 'remedioCasero', 'despertar', 'miel'] },
  cafetal: { name: 'Tienda de la Hacienda', items: ['tinto', 'arepaReserva', 'vendaDeCampeon', 'cintaFuerza', 'pocimaFuerza', 'dulce', 'guayaba'] },
  escarcha: { name: 'Refugio del Nevado', items: ['escarchaEterna', 'panelaCaliente', 'chalecoAcolchado', 'pocimaCoraza', 'tonicoMax', 'capsulaMalla'] },
  albor: { name: 'Bazar del Templo', items: ['escamaAntigua', 'semillaVital', 'semillaFuerza', 'semillaCoraza', 'semillaViento', 'rocioPuro', 'dulce', 'capsulaReloj'] }
};
export const VENDING = ['aguaPanela', 'jugoLulo', 'avena'];
export const TOWN_NAMES = { arenal: 'Villa Arenal', corola: 'Ciudad Corola', cobre: 'Pueblo Cobre', marea: 'Ciudad Marea', guadua: 'Pueblo Guadua', caracol: 'Puerto Caracol', voltio: 'Ciudad Voltio', niebla: 'Pueblo Niebla', cafetal: 'Villa Cafetal', escarcha: 'Ciudad Escarcha', albor: 'Ciudad Albor' };

export function generalStock(st) {
  const n = (st.badges || []).length;
  return GENERAL.filter(([, need]) => n >= need).map(([id]) => id);
}
// Lo que todavía no se vende: [id, medallas que faltan], para mostrarlo bloqueado y que se note lo que viene.
export function lockedStock(st) {
  const n = (st.badges || []).length;
  return GENERAL.filter(([, need]) => need > n);
}
export function nextUnlock(st) {
  const next = lockedStock(st)[0];
  return next ? next[1] : null;
}

// ---------- Efectos ----------
export const STAT_NAMES = { hp: 'los PS máximos', atk: 'el Ataque', def: 'la Defensa', spe: 'la Velocidad', crit: 'la puntería crítica' };
export const SEED_STEP = 3, SEED_MAX = 15;
const NO = { ok: false, msg: 'No tendría ningún efecto.' };

// Resumen corto del efecto, para las filas de la tienda y la mochila.
const STAT_SHORT = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spe: 'Velocidad' };
export function shortDesc(id) {
  const it = ITEMS[id];
  if (it.pocket === 'capsulas') return { fast: 'Mejor en el primer turno', dusk: 'Mejor de noche y en cuevas', timer: 'Mejor en combates largos', net: 'Mejor con Agua y Bicho' }[it.special] || (it.catchBonus ? `Atrapa ×${it.catchBonus}` : 'Captura normal');
  if (it.heal) return it.heal === 'full' ? 'Cura todos los PS' : `Cura ${it.heal} PS`;
  if (it.revive) return 'Reanima con media vida';
  if (it.cure) return it.cure === 'all' ? 'Cura cualquier estado' : `Cura: ${STATUS[it.cure].name.toLowerCase()}`;
  if (it.pp) return it.pp === 'full' ? 'Llena todos los PP' : `+${it.pp} PP a cada movimiento`;
  if (it.boost) return it.boost === 'crit' ? 'Más golpes críticos' : `Sube ${STAT_SHORT[it.boost]} en combate`;
  if (it.repel) return `${it.repel} pasos sin salvajes débiles`;
  if (it.escape) return 'Vuelve a la última Posada';
  if (it.lure) return 'Atrae a una criatura salvaje';
  if (it.seed) return `+${SEED_STEP} de ${STAT_SHORT[it.seed]} para siempre`;
  if (it.levelUp) return 'Sube un nivel';
  if (it.held) { const h = it.held; return { power: 'Equipable · +10% de daño', speed: 'Equipable · +20% de Velocidad', guard: 'Equipable · -12% de daño recibido', regen: 'Equipable · recupera PS cada turno', berry: 'Equipable · se cura con pocos PS', type: `Equipable · +20% ${TYPES[h.type]?.name || ''}` }[h.kind] || 'Equipable'; }
  if (it.key) return 'Objeto clave';
  return '';
}

// ¿El objeto sirve sobre esta criatura? (para marcar opciones en las listas)
export function canUseOn(id, c) {
  const it = ITEMS[id];
  if (it.revive) return c.hp <= 0;
  if (it.cure) return c.hp > 0 && !!c.status && (it.cure === 'all' || it.cure === c.status);
  if (it.heal) return c.hp > 0 && c.hp < c.stats.hp;
  if (it.pp) return c.moves.some(m => m.pp < MOVES[m.id].pp);
  if (it.seed) return (c.bonus?.[it.seed] || 0) < SEED_MAX;
  if (it.levelUp) return c.level < 100;
  return false;
}
export const targetsCreature = id => { const it = ITEMS[id]; return !!(it.revive || it.cure || it.heal || it.pp || it.seed || it.levelUp); };

// Aplica el objeto a una criatura. Devuelve { ok, msg, from, to } (from/to de PS para animar la barra).
export function useOnCreature(id, c) {
  const it = ITEMS[id];
  if (!canUseOn(id, c)) return NO;
  const max = c.stats.hp, from = c.hp;
  if (it.revive) { c.hp = Math.max(1, Math.floor(max * it.revive)); c.status = null; return { ok: true, msg: `¡${c.name} se recuperó!`, from, to: c.hp }; }
  if (it.cure) {
    const was = c.status; c.status = null; c.sleep = 0;
    return { ok: true, msg: `¡${c.name} ${{ ven: 'ya no está envenenado', que: 'ya no tiene quemaduras', par: 'ya no está paralizado', dor: 'se despertó', con: 'se descongeló' }[was] || 'se curó'}!`, cured: true };
  }
  if (it.heal) { c.hp = it.heal === 'full' ? max : Math.min(max, c.hp + it.heal); return { ok: true, msg: `${c.name} recuperó ${c.hp - from} PS.`, from, to: c.hp }; }
  if (it.pp) {
    for (const m of c.moves) m.pp = it.pp === 'full' ? MOVES[m.id].pp : Math.min(MOVES[m.id].pp, m.pp + it.pp);
    return { ok: true, msg: `Los PP de ${c.name} se recuperaron.` };
  }
  if (it.seed) {
    c.bonus = { ...(c.bonus || {}) };
    c.bonus[it.seed] = Math.min(SEED_MAX, (c.bonus[it.seed] || 0) + SEED_STEP);
    refreshStats(c);
    return { ok: true, msg: `¡Subió ${STAT_NAMES[it.seed]} de ${c.name}!` };
  }
  if (it.levelUp) {
    c.level++; c.exp = Math.max(c.exp, expForLevel(c.level));
    refreshStats(c);
    return { ok: true, msg: `¡${c.name} subió al nivel ${c.level}!`, levelUp: true };
  }
  return NO;
}

// Multiplicador de captura de cada cápsula. ctx = { turn, foe, night, dark }
export function catchBonus(id, ctx) {
  const it = ITEMS[id];
  switch (it.special) {
    case 'fast': return ctx.turn <= 1 ? 4 : 1;
    case 'dusk': return ctx.night || ctx.dark ? 3 : 1;
    case 'timer': return Math.min(4, 1 + Math.max(0, ctx.turn - 1) * 0.3);
    case 'net': return SPECIES[ctx.foe.sp].types.some(t => t === 'agua' || t === 'bicho') ? 3 : 1;
  }
  return it.catchBonus || 1;
}

// El repelente ahuyenta a las salvajes de nivel menor que la primera criatura en pie del equipo.
export function repelled(st, level) {
  const lead = st.party.find(c => c.hp > 0);
  return (st.repel || 0) > 0 && !!lead && level < lead.level;
}

// Total de objetos de un bolsillo que hay en la mochila.
export function pocketItems(bag, pocket) {
  return Object.keys(ITEMS).filter(id => ITEMS[id].pocket === pocket && (bag[id] || 0) > 0);
}
