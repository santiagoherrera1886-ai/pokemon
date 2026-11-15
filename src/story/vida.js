// Guiones de la vida en Tierra Grande: moteles, casas propias (lote, construcción, cama y muebles) y pareja
// (conversar, regalos, citas y noviazgo). Todo apto para cualquier edad: citas, paseos y regalos.
import { ui } from '../ui/ui.js';
import { ITEMS } from '../data/items.js';
import { saveState } from '../core/state.js';
import { cloud } from '../core/cloud.js';
import { shiftTo } from '../core/clock.js';
import { CITIES } from '../world/tierra.js';
import { HOUSE_MODELS, WALL_COLORS, ROOF_COLORS, FURNITURE, MOTEL_PRICE, WAKE, CANDIDATES, GIFTS, LOVE, dayOf, romanceOf, houseOf } from '../world/hogar.js';

const say = (who, ...pages) => ui.say(pages, { name: who || undefined });
const money = n => '$' + Math.round(n).toLocaleString('es-CO');
function save(game) { const ok = saveState(game.state); if (ok && cloud.linked) cloud.pushSoon(); return ok; }
const hearts = pts => { const n = Math.min(5, Math.floor(pts / (LOVE.ask / 5))); return '♥'.repeat(n) + '♡'.repeat(5 - n); };

// Descansar o dormir: cura al equipo, guarda, deja este lugar como punto de regreso y adelanta el reloj si se quiere.
async function rest(ow, game, where, { price = 0, who } = {}) {
  const st = game.state;
  const i = await ui.ask(price ? `La pieza vale ${money(price)}. ¿Qué hacemos?` : '¿Qué hacemos?', ['Descansar un rato', 'Dormir hasta la noche', 'Dormir hasta mañana', 'Nada'], { name: who });
  if (i < 0 || i > 2) return false;
  if (price) {
    if ((st.money || 0) < price) { await say(who, 'Uy, no le alcanza para la pieza. Vuelva cuando tenga ' + money(price) + '.'); return false; }
    st.money -= price;
  }
  await game.fadeOut();
  await game.healParty();
  st.lastHeal = where;
  if (i === 1) { st.clockShift = shiftTo(WAKE.noche); st.day = (st.day || 0) + 1; }
  if (i === 2) { st.clockShift = shiftTo(WAKE.manana); st.day = (st.day || 0) + 1; }
  await game.frames(40);
  await game.fadeIn();
  const ok = save(game);
  await ui.say([['¡Qué buena siesta! Tu equipo quedó como nuevo.', 'Dormiste hasta la noche. Afuera ya salen las criaturas nocturnas.', '¡Buenos días! Dormiste como un tronco y tu equipo quedó como nuevo.'][i],
    ok ? 'Se guardó la partida. Si te debilitan, vuelves aquí.' : 'No se pudo guardar (el navegador bloquea el almacenamiento).']);
  return true;
}

// Una cita: escoges el plan, se ve la escena y sube el cariño.
async function date(ow, game, id) {
  const st = game.state, P = CANDIDATES[id], R = romanceOf(st, id);
  const plans = [['arepas', 'Comer arepas en la plaza'], ['atardecer', 'Ver el atardecer']];
  if (st.bag.llavesCarro) plans.push(['carro', 'Pasear en carro']);
  if (st.bag.licenciaPiloto) plans.push(['avioneta', 'Volar en avioneta']);
  const i = await ui.ask('¿Qué plan le propones?', [...plans.map(p => p[1]), 'Mejor otro día'], { name: P.name });
  if (i < 0 || i >= plans.length) return false;
  const k = plans[i][0], n = P.name;
  const scene = {
    arepas: [`${n} pidió una arepa de huevo y tú una de queso con mantequilla.`, '"¡Esta es la mejor arepa de Tierra Grande!", dice entre risas.', 'Se quedaron hablando hasta que cerraron el puesto.'],
    atardecer: ['Caminaron hasta un mirador a ver el atardecer.', 'El cielo se puso naranja, después rosado y después se llenó de estrellas.', `${n} te tomó de la mano un ratico.`],
    carro: ['Salieron por la autopista con las ventanas abiertas y la radio prendida.', `${n} sacó la mano por la ventana para sentir el viento.`, '"¡Más rápido!", te dijo... y luego "¡No, no tan rápido!".'],
    avioneta: ['Despegaron juntos y vieron Tierra Grande desde arriba.', `${n} señaló su ciudad, chiquitica allá abajo.`, '"Nunca había visto el mar y la sierra al mismo tiempo", te dijo.']
  }[k];
  await game.fadeOut();
  await game.frames(20);
  await game.fadeIn();
  await ui.say(scene);
  R.pts += LOVE.date; R.dates++; R.date = dayOf(st);
  ow.emote(ow.follower && st.pareja?.id === id ? ow.follower : ow.npc('tgCita_' + id) || ow.player, '♥');
  await say(n, R.dates === 1 ? '¡Me la pasé muy bien! Repitamos pronto.' : '¡Qué día tan bonito! Gracias por invitarme.');
  return true;
}

export const VIDA = {
  // ---------- Moteles ----------
  async motel(ow, game, npc) {
    const c = CITIES.find(c => c.id === npc?.arg), who = 'Recepcionista';
    await say(who, `¡Bienvenido al ${c ? c.name : 'motel'}!`, `La pieza vale ${money(MOTEL_PRICE)} la noche, con desayuno incluido.`);
    await rest(ow, game, { map: ow.map.id, x: 11, y: 4 }, { price: MOTEL_PRICE, who });
  },
  async motelCama(ow) { await ui.say(['Una cama tendida, con toallitas en forma de cisne.', 'Para quedarte, paga la pieza en la recepción.']); },

  // ---------- Casas propias ----------
  async lote(ow, game, obj) {
    const st = game.state, lot = obj.lot;
    if (houseOf(st, lot)) return;
    await ui.say(['SE VENDE este lote.', 'Escoge el modelo y los colores: los obreros construyen tu casa en una sola noche.']);
    const models = Object.entries(HOUSE_MODELS);
    const i = await ui.ask(`Tienes ${money(st.money || 0)}. ¿Qué casa construimos?`, [...models.map(([, M]) => `${M.name} · ${money(M.price)}`), 'Ahora no']);
    if (i < 0 || i >= models.length) return;
    const [key, M] = models[i];
    if ((st.money || 0) < M.price) return ui.say([`Te faltan ${money(M.price - (st.money || 0))} para la ${M.name.toLowerCase()}.`, 'Gana combates contra entrenadores o vende lo que no uses.']);
    await ui.say([M.desc]);
    const w = await ui.ask('¿De qué color las paredes?', WALL_COLORS.map(c => c[0]), { cancel: false });
    const r = await ui.ask('¿Y el techo?', ROOF_COLORS.map(c => c[0]), { cancel: false });
    const ok = await ui.ask(`${M.name}, paredes ${WALL_COLORS[w][0].toLowerCase()} y techo ${ROOF_COLORS[r][0].toLowerCase()}, por ${money(M.price)}. ¿Construimos?`, ['¡Sí, construyan!', 'No, mejor no']);
    if (ok !== 0) return;
    st.money -= M.price;
    st.houses = st.houses || {};
    st.houses[lot] = { model: key, wall: WALL_COLORS[w][1], roof: ROOF_COLORS[r][1], furniture: [], city: lot.split('_')[0] };
    await game.fadeOut();
    game.graphics?.engine?.clearWorld?.();   // el 3D vuelve a armar el mapa, ya con la casa
    await game.frames(40);
    await game.fadeIn();
    save(game);
    await ui.say(['¡Tun, tun, tun! Los obreros trabajaron toda la noche...', '¡Tu casa quedó lista!', 'Adentro, en el computador, puedes comprar muebles. En la cama duermes, curas a tu equipo y guardas.']);
  },
  async camaCasa(ow, game) { await rest(ow, game, { map: ow.map.id, x: 1, y: 4 }); },
  async catalogo(ow, game, obj) {
    const st = game.state, h = houseOf(st, obj.lot);
    if (!h) return;
    await ui.say(['Tienda de muebles en línea: lo que compres llega de una vez y queda en su lugar.']);
    let page = 0;
    for (;;) {
      const list = FURNITURE.filter(f => !h.furniture.includes(f.id));
      if (!list.length) return ui.say(['¡Ya tienes todos los muebles del catálogo! Tu casa quedó divina.']);
      const per = 5, pages = Math.ceil(list.length / per); page = Math.min(page, pages - 1);
      const shown = list.slice(page * per, page * per + per);
      const extra = pages > 1 ? ['Ver más muebles'] : [];
      const i = await ui.ask(`Tienes ${money(st.money || 0)}. ¿Qué mueble quieres?`, [...shown.map(f => `${f.name} · ${money(f.price)}`), ...extra, 'Salir']);
      if (i === shown.length && extra.length) { page = (page + 1) % pages; continue; }
      if (i < 0 || i >= shown.length) return;
      const f = shown[i];
      if ((st.money || 0) < f.price) { await ui.say([`No te alcanza para ${f.name.toLowerCase()}.`]); continue; }
      st.money -= f.price; h.furniture.push(f.id);
      await ui.say([`¡Llegó ${f.name.toLowerCase()}! Ya quedó en su lugar.`]);
    }
  },

  // ---------- Pareja ----------
  async cita(ow, game, npc) {
    const st = game.state, id = npc?.cand, P = CANDIDATES[id];
    if (!P) return;
    const R = romanceOf(st, id), day = dayOf(st), who = P.name, novix = P.a === 'a' ? 'novia' : 'novio';
    if (st.pareja?.id === id) {
      const i = await ui.ask('¡Hola, mi amor! ¿Qué hacemos hoy?', ['Vamos juntos', 'Salir en una cita', 'Nada, sólo pasaba a saludar'], { name: who });
      if (i === 0) { st.pareja.follow = true; ow.refreshNpcs(); ow.setFollower(); ow.emote(ow.follower || ow.player, '♥'); return say(who, '¡Vamos! Yo te sigo a donde vayas.'); }
      if (i === 1) { if (R.date === day) return say(who, 'Hoy ya salimos, ¡mañana otra vez!'); return date(ow, game, id); }
      return say(who, '¡Qué lindo! Aquí te espero.');
    }
    if (!R.met) { R.met = true; R.pts += 3; await say(who, ...P.hi); }
    const i = await ui.ask(`${hearts(R.pts)}  ¿Qué le dices a ${who}?`, ['Conversar', 'Dar un regalo', 'Invitar a salir', `Pedirle que sea tu ${novix}`, 'Chao'], { name: who });
    if (i === 0) {
      if (R.talk === day) return say(who, 'Ya hablamos hoy. ¡Mañana me cuentas más!');
      R.talk = day; R.pts += LOVE.talk;
      const lines = P.talk[(day + R.dates) % P.talk.length];
      await say(who, ...lines);
      return;
    }
    if (i === 1) {
      const have = GIFTS.filter(g => (st.bag[g] || 0) > 0);
      if (!have.length) return ui.say(['No tienes regalos.', 'En las tiendas de Tierra Grande venden flores, chocolates, café, peluches y mochilas.']);
      if (R.gift === day) return say(who, 'Hoy ya me diste algo. ¡Me vas a malcriar!');
      const g = await ui.ask('¿Qué le regalas?', [...have.map(g => `${ITEMS[g].name} (${st.bag[g]})`), 'Nada'], { name: who });
      if (g < 0 || g >= have.length) return;
      const it = have[g]; st.bag[it]--; R.gift = day;
      if (P.loves.includes(it)) { R.pts += LOVE.love; ow.emote(ow.npc('tgCita_' + id) || ow.player, '♥'); return say(who, `¡¿${ITEMS[it].name}?! ¿Cómo sabías? ¡Me encanta!`); }
      if (P.likes.includes(it)) { R.pts += LOVE.like; return say(who, '¡Gracias! Qué detalle tan lindo.'); }
      R.pts += LOVE.gift; return say(who, 'Ay, gracias... muy amable.');
    }
    if (i === 2) {
      if (R.pts < LOVE.first) return say(who, 'Mmm... todavía no nos conocemos mucho. Conversemos más, ¿sí?');
      if (R.date === day) return say(who, 'Hoy ya salimos. ¡Mañana otra vez!');
      return date(ow, game, id);
    }
    if (i === 3) {
      if (st.pareja) return say(who, 'Pero... ¡tú ya tienes pareja! Así no.');
      if (R.pts < LOVE.ask || R.dates < LOVE.dates) return say(who, 'Me caes muy bien... pero vamos despacio, ¿sí?', `(Cariño ${Math.min(R.pts, LOVE.ask)}/${LOVE.ask} · Citas ${Math.min(R.dates, LOVE.dates)}/${LOVE.dates})`);
      const ok = await ui.ask(`¿Le pides a ${who} que sea tu ${novix}?`, ['Sí, ¡ahora o nunca!', 'Mejor después']);
      if (ok !== 0) return;
      await say(who, '...', '¡Sí! ¡Claro que sí!');
      st.pareja = { id, follow: true, since: day }; R.pts += 10;
      ow.refreshNpcs(); ow.setFollower();
      ow.emote(ow.follower || ow.player, '♥');
      ui.banner(`¡${who} y tú son novios!`, 'town');
      save(game);
      return say(who, 'Desde hoy te acompaño en tus viajes. Si quieres que te espere en casa, me dices.');
    }
    return say(who, '¡Chao! Que te vaya bien.');
  },
  // Hablarle a tu pareja cuando te acompaña.
  async pareja(ow, game) {
    const st = game.state, id = st.pareja?.id, P = CANDIDATES[id];
    if (!P) return;
    const R = romanceOf(st, id), day = dayOf(st);
    const chat = [['¡Qué bueno andar contigo!'], ['¿Para dónde vamos hoy?'], ['Me encanta Tierra Grande, pero más contigo.'], ['¿Ya probaste las arepas de Villa Cruce?'], ['Tus Puchamon te quieren mucho, se nota.']][(day + st.party.length) % 5];
    const i = await ui.ask(chat[0], ['Seguir juntos', 'Salir en una cita', 'Que me espere en su ciudad', 'Terminar'], { name: P.name });
    if (i === 1) { if (R.date === day) return say(P.name, 'Hoy ya salimos, ¡mañana otra vez!'); return date(ow, game, id); }
    if (i === 2) {
      st.pareja.follow = false; ow.setFollower(); ow.refreshNpcs();
      const c = CITIES.find(c => c.id === P.city);
      return say(P.name, `Listo. Te espero en ${c.name}, frente a la posada.`);
    }
    if (i === 3) {
      const ok = await ui.ask('¿Seguro que quieres terminar?', ['Sí', 'No, me equivoqué']);
      if (ok !== 0) return say(P.name, '¡Uf! Qué susto.');
      st.pareja = null; R.pts = Math.max(0, R.pts - 40); R.dates = 0;
      ow.setFollower(); ow.refreshNpcs();
      return say(P.name, 'Ah... bueno. Que te vaya bien.');
    }
    ow.emote(ow.follower || ow.player, '♥');
  }
};
