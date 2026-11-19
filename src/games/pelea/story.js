// Historia de la Pelea Puchamon: "Copa del Alba". Siete combates en orden por los tres escenarios, con diálogos
// antes y después, peleas de dos contra ti y un jefe al final de cada parte (Fraguón en el volcán y Dracalba en
// el templo). Ganar un capítulo abre el siguiente; la primera vez paga premio completo y después una parte.
import { SPECIES } from '../../data/creatures.js';
import { makeFighter } from './sim.js';

const N = { host: 'Locutor', nico: 'Nico', hiedra: 'Hiedra', basalto: 'Basalto', coral: 'Coral', centella: 'Centella', sabino: 'Sabino', nevada: 'Nevada' };

// rivals: { type } busca el Puchamon más fuerte de ese tipo; { sp } usa esa especie; { rival } usa el inicial de Nico.
// lv: niveles por encima del tuyo. team: los que comparten equipo pelean juntos contra ti.
export const CHAPTERS = [
  { id: 'nico', stage: 'isla', title: 'El reto de Nico', who: N.nico, diff: 0, prize: 300,
    rivals: [{ rival: true, lv: -2, name: N.nico }],
    before: [[N.host, '¡Bienvenidos a la Copa del Alba! Aquí no hay órdenes desde afuera: entrenador y Puchamon pelean como uno solo.'],
      [N.host, 'La regla es sencilla: saca a tu rival de la isla. Cada golpe le sube el daño y entre más daño tenga, más lejos vuela.'],
      [N.nico, '¡Sabía que te ibas a inscribir! El primer combate es contra mí. ¡No me vas a ganar dos veces!']],
    after: [[N.nico, '¡Uy, me sacaste volando! La próxima no me descuido.'],
      [N.nico, 'Ojo: Hiedra, la líder de las plantas, también se inscribió. Te está esperando en esta misma isla.']] },
  { id: 'hiedra', stage: 'isla', title: 'Hiedra entre las flores', who: N.hiedra, diff: 1, prize: 400,
    rivals: [{ type: 'planta', lv: 0, name: N.hiedra }],
    before: [[N.hiedra, 'En el gimnasio peleo con calma, pero aquí arriba las raíces no te van a sostener si te caes.'],
      [N.hiedra, 'Muéstrame que sabes volver al borde. ¡Arriba más B, como una semilla que salta!']],
    after: [[N.hiedra, 'Te agarraste del borde como una enredadera. Bien hecho.'],
      [N.hiedra, 'Basalto y Coral se aliaron para la siguiente ronda. Van a pelear los dos contra ti.']] },
  { id: 'basalto', stage: 'isla', title: 'Roca y marea', who: `${N.basalto} y ${N.coral}`, diff: 1, prize: 500,
    rivals: [{ type: 'roca', lv: 0, name: N.basalto, team: 1 }, { type: 'agua', lv: -1, name: N.coral, team: 1 }],
    before: [[N.basalto, 'Una roca sola aguanta, pero con la marea al lado no hay quien pase.'],
      [N.coral, '¡Dos contra uno! Usa el escudo y rueda para salirte del medio.']],
    after: [[N.basalto, 'Nos partiste en dos... Esa isla quedó chiquita para ti.'],
      [N.coral, 'La copa sigue en el Cráter de Fragua. Allá abajo hay lava de verdad, no te quemes.']] },
  { id: 'centella', stage: 'volcan', title: 'Chispas en el cráter', who: N.centella, diff: 1, prize: 600,
    rivals: [{ type: 'electrico', lv: 2, name: N.centella }],
    before: [[N.host, 'Segunda parte de la copa: ¡el Cráter de Fragua! Las grietas brillan porque el volcán está despierto.'],
      [N.centella, 'Con tanto calor mi Puchamon anda cargadísimo. ¡Cuidado con el rayo cuando prenda el poder!']],
    after: [[N.centella, '¡Qué corrientazo! Me ganaste en mi mejor día.'],
      [N.centella, '¿Sentiste ese temblor? El guardián del volcán se despertó... y viene por el ganador.']] },
  { id: 'fraguon', stage: 'volcan', title: 'El guardián del volcán', who: 'Fraguón', diff: 2, prize: 1200, boss: true,
    rivals: [{ sp: 'fraguon', lv: 5, boss: true }],
    before: [[N.host, '¡El suelo se abre! Del fondo del cráter sale Fraguón, el que forjó las primeras herramientas de la región.'],
      [N.host, 'Es enorme y pesado: cuesta mucho sacarlo. Súbele el daño con golpes rápidos y remata con el golpe cargado.']],
    after: [[N.host, '¡Increíble! Fraguón vuelve a dormir dentro del volcán. ¡Pasas a la final en el Templo del Alba!']] },
  { id: 'sabino', stage: 'templo', title: 'Maestros del templo', who: `${N.sabino} y ${N.nevada}`, diff: 2, prize: 900,
    rivals: [{ type: 'dragon', lv: 3, name: N.sabino, team: 1 }, { type: 'hielo', lv: 2, name: N.nevada, team: 1 }],
    before: [[N.sabino, 'Este templo guarda el sol del amanecer. Sólo quien nos gane a los dos puede verlo salir.'],
      [N.nevada, 'Yo enfrío y Sabino remata. ¡A ver cuánto aguantas!']],
    after: [[N.sabino, 'Hace años que nadie pasaba por esta puerta. El sol dorado ya te reconoce.'],
      [N.nevada, 'Mira el portal... ¡algo viene con la luz del alba!']] },
  { id: 'dracalba', stage: 'templo', title: 'El dragón del amanecer', who: 'Dracalba', diff: 2, prize: 2500, boss: true,
    rivals: [{ sp: 'dracalba', lv: 8, boss: true }],
    before: [[N.host, '¡Final de la Copa del Alba! El sol del portal se enciende y baja Dracalba, el dragón del amanecer.'],
      [N.host, 'Dicen que cada mañana el sol sale porque él lo despierta. ¡Hoy pelea contra ti!']],
    after: [[N.host, '¡GANASTE LA COPA DEL ALBA! Dracalba levanta el vuelo y el sol sale más brillante que nunca.'],
      [N.nico, '¡Eso, parce! Sabía que lo ibas a lograr. Ahora sí, la revancha cuando quieras.']] }
];

// El Puchamon más fuerte (sin leyendas) de un tipo, sin repetir el tuyo.
export function strongestOfType(type, exclude = []) {
  const list = Object.entries(SPECIES).filter(([sp, S]) => !S.legendary && S.types[0] === type && !exclude.includes(sp));
  const pool = list.length ? list : Object.entries(SPECIES).filter(([sp, S]) => !S.legendary && S.types.includes(type) && !exclude.includes(sp));
  const total = S => S.base.hp + S.base.atk + S.base.def + S.base.spe;
  return pool.sort((a, b) => total(b[1]) - total(a[1]))[0]?.[0] || 'brasin';
}
// Nico usa el inicial que le gana al tuyo (o al tipo de tu peleador), ya evolucionado según el nivel.
function rivalStarter(mySp, level) {
  const t = SPECIES[mySp]?.types[0], base = t === 'planta' ? 'brasin' : t === 'fuego' ? 'charquin' : t === 'agua' ? 'brotelo' : 'brasin';
  let s = base;
  while (SPECIES[s]?.evo && level >= SPECIES[s].evo[1]) s = SPECIES[s].evo[0];
  return s;
}
export const SKILL = [.3, .56, .8];
// Peleadores del capítulo: tú (equipo 0) y los rivales con su nivel, equipo y si son jefes.
export function chapterFighters(ch, me) {
  const out = [makeFighter(me.sp, me.level, { team: 0 })];
  ch.rivals.forEach((r, i) => {
    const level = Math.max(5, Math.min(100, me.level + (r.lv || 0)));
    const sp = r.sp || (r.rival ? rivalStarter(me.sp, level) : strongestOfType(r.type, [me.sp]));
    const f = makeFighter(sp, level, { cpu: true, team: r.team ?? i + 1, boss: r.boss });
    if (r.name) f.trainer = r.name;
    out.push(f);
  });
  return out;
}
export function chapterPrize(ch, firstTime, stocksLeft) { return Math.round((firstTime ? ch.prize : ch.prize / 4) + stocksLeft * 40); }
