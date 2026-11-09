// Guiones de la historia de la Etapa 1. Cada guion es una función async que recibe el overworld.
import { ui } from '../ui/ui.js';
import { SPECIES, RIVAL_PICK, makeCreature, rivalForm } from '../data/creatures.js';
import { ITEMS, SPECIAL } from '../data/items.js';
import { gymOf, hasBadge, badgeCount, nextGym, LEAGUE_BADGES } from '../data/gyms.js';

const N = { mom: 'Mamá', nico: 'Nico', prof: 'Prof. Ceiba', aide: 'Ayudante', kid: 'Niño', nurse: 'Enfermera Malva', clerk: 'Dependiente', vendor: 'Vendedora', rivalMom: 'Mamá de Nico', guard: 'Guardia', grunt: 'Recluta Eclipse', bruma: 'Bruma', umbra: 'Umbra', aurora: 'Campeona Aurora', courier: 'Mensajera' };

export class Scripts {
  constructor(game) { this.game = game; }
  async run(name, ow, arg) {
    const f = S[name];
    if (!f) { console.warn('Guion inexistente', name); return; }
    await f(ow, this.game, arg);
  }
}

const say = (who, ...pages) => ui.say(pages, { name: who });
// Guardias de las ciudades nuevas: frenan sin la medalla de su gimnasio y la piden por su nombre.
async function gateStop(ow, badge, why) {
  const g = gymOf(badge);
  await say(N.guard, why, `Sólo pasa quien tenga la Medalla ${g.name}. Se gana en el gimnasio de ${g.city}, contra ${g.who}.`);
  await ow.stepBack();
}
async function gateTalk(game, badge, where) {
  const g = gymOf(badge);
  if (hasBadge(game.state, badge)) return say(N.guard, `¡La Medalla ${g.name}! Adelante.`, where);
  await say(N.guard, where, `Pero primero gánate la Medalla ${g.name} en el gimnasio de ${g.city}.`);
}

const S = {
  // ---------- Pueblo Brisal ----------
  async chicoBrisal(ow, game) {
    if (game.state.story < 2) await say(N.kid, '¡Nico pasó corriendo hace un rato!', 'Iba gritando tu nombre. Su casa es la del techo azul.');
    else await say(N.kid, 'Dicen que en el Lago Espejo vive algo enorme...', '¡Yo no me acerco ni loco!');
  },
  async bloqueoNorte(ow, game) {
    const kid = ow.npc('chico'); if (kid) kid.dir = 2;
    await say(N.kid, '¡Ey, espera!', 'Nico te andaba buscando. Pasa primero por su casa, la del techo azul.');
    await ow.stepBack();
  },
  async mamaInicio(ow, game) {
    const mom = ow.npc('mama'); if (mom) mom.dir = 3;
    await say(N.mom, `¡Por fin despiertas, ${game.state.name}!`, 'Nico vino hace un rato. Dijo que era URGENTE, como siempre.', 'Deberías pasar por su casa. Es la del techo azul, al otro lado de la calle.');
    game.state.story = 1;
  },
  async mama(ow, game) {
    const st = game.state;
    if (st.story <= 1) return say(N.mom, 'Nico te está esperando en su casa.', 'Ese muchacho no aguanta ni un minuto quieto.');
    if (st.story === 2) return say(N.mom, '¿Al Lago Espejo con Nico? Bueno...', 'Pero no se metan al pasto alto sin una criatura.');
    if (st.story === 3) return S.mamaRegreso(ow, game);
    await say(N.mom, '¡Hola, cariño! Tus criaturas se ven cansadas.', 'Descansen un ratico aquí.');
    await game.healParty();
    st.lastHeal = { map: 'casa1', x: 5, y: 6 };
    await say(N.mom, '¡Listo! Ya están como nuevas. ¡Cuídate mucho!');
  },
  async mamaRegreso(ow, game) {
    const st = game.state;
    const c = st.party[0];
    await say(N.mom, `¡${st.name}! ¿Y esa criatura?`, `¿La sacaste del maletín de la Profesora Ceiba? ¿Y ${c ? c.name : 'ella'} te defendió?`, 'Ay, no... tienes que ir a Villa Arenal y explicarle todo a la profesora.', 'El laboratorio queda al este del Sendero 1.');
    await say(N.mom, 'Ah, y toma esto: unas Zapatillas nuevas.');
    st.shoes = true;
    await ui.say(['¡Recibiste las ZAPATILLAS!', 'Mantén pulsado B (o Shift) mientras caminas para correr.']);
    await game.healParty();
    st.lastHeal = { map: 'casa1', x: 5, y: 6 };
    st.story = 4;
    game.toast('Nuevo objetivo: ir a Villa Arenal');
  },
  async mamaNico(ow, game) {
    if (game.state.story === 1) await say(N.rivalMom, '¡Hola! Nico está arriba en su cuarto.', 'Hoy anda más acelerado que de costumbre.');
    else await say(N.rivalMom, 'Nico salió corriendo otra vez.', 'Si lo ves, dile que vuelva a almorzar.');
  },
  async nicoCuarto(ow, game) {
    const st = game.state, nico = ow.npc('nicoCuarto');
    await say(N.nico, `¡${st.name}! ¡Por fin! ¿Viste las noticias?`, 'Dicen que en el Lago Espejo apareció una criatura rarísima.', '¡Vamos a buscarla! Te espero en el Sendero 1, al norte del pueblo.', '¡Si llegas tarde te cobro multa de un millón!');
    st.story = 2;
    if (nico) {
      for (const d of ['left', 'left', 'left', 'up']) {
        const [dx, dy] = { left: [-1, 0], up: [0, -1] }[d];
        if (ow.blocked(nico.x + dx, nico.y + dy, nico)) continue;
        await ow.walk(nico, [d], 10);
      }
    }
  },

  // ---------- Sendero 1 ----------
  async nicoSendero(ow, game) {
    const nico = ow.npc('nicoSendero');
    if (nico) nico.dir = 0;
    await say(N.nico, '¡Llegaste! Te demoraste más que una tortuga.', 'El lago queda al oeste del sendero. ¡Vamos, vamos!');
    if (nico) await ow.walk(nico, ['up', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'], 9);
    game.state.flags.nicoSendero = true;
  },
  async bloqueoEste(ow, game) {
    const st = game.state;
    if (st.party.length === 0) await ui.say(['Por ahí se va a Villa Arenal.', 'Nico te espera en el Lago Espejo, al oeste.']);
    else await ui.say(['(Deberías volver a casa primero y contarle a mamá lo que pasó.)']);
    await ow.stepBack();
  },
  async pastoSinCriatura(ow, game) {
    await ui.say(['¡No! El pasto alto está lleno de criaturas salvajes.', 'Sin una compañera es muy peligroso meterse.']);
    await ow.stepBack();
  },

  // ---------- Lago Espejo ----------
  async escenaProfe(ow, game) {
    const st = game.state, nico = ow.npc('nicoLago');
    if (nico) nico.dir = 3;
    await say(N.nico, '¡Ahí está el Lago Espejo!', '...Oye, ¿quiénes son esos de allá?');
    const prof = ow.npc('profeLago'), aide = ow.npc('ayudanteLago');
    await say(N.prof, 'Mmm... el agua está quieta hoy.', 'No hay nada más que ver aquí.');
    await say(N.aide, 'Profesora, ¿y el maletín?');
    await say(N.prof, 'Lo recogemos de vuelta. Vámonos, que ya es tarde.');
    if (prof && aide) await Promise.all([ow.walk(prof, ['left', 'left', 'left'], 12), ow.walk(aide, ['left', 'down', 'left'], 12)]);
    st.flags.vioProfe = true;
    ow.refreshNpcs();
    await say(N.nico, '¿Esa no era la Profesora Ceiba? ¡La que sale en la tele!', 'Se fueron por la orilla... ¡Vamos a ver qué hay allá!');
  },
  async escenaMaletin(ow, game) {
    const st = game.state, nico = ow.npc('nicoLago');
    if (nico) nico.dir = 2;
    await say(N.nico, '¡Mira! Dejaron el maletín en la orilla.', 'Tiene grabado "Lab. Ceiba"... ¿Y si le echamos un ojito?');
    await ui.say(['¡Shhrr! ¡El pasto se está moviendo!', '¡Una bandada de Pipiú salvajes se lanza contra ustedes!']);
    await say(N.nico, '¡Aaah! ¡Nos atacan!', `¡${st.name}, saca una criatura del maletín! ¡Rápido!`);
    const sp = await game.chooseStarter();
    st.party.push(makeCreature(sp, 5));
    st.rivalStarter = RIVAL_PICK[sp];
    await ui.say([`¡Elegiste a ${SPECIES[sp].name}!`]);
    const result = await game.battle({ foe: makeCreature('pipiu', 2), wild: true, canRun: false, canCatch: false, tutorial: true });
    if (result === 'lose') await game.healParty();
    st.story = 3;
    await say(N.nico, '¡Uf! ¡Lo logramos!', `Yo tomé a ${SPECIES[st.rivalStarter].name} del maletín para espantar a los demás.`, 'Ahora... ¿qué hacemos con el maletín? Si la profe se entera, ¡nos mata!', 'Mejor vamos a casa primero. ¡Nos vemos!');
    if (nico) await ow.walk(nico, ['right', 'right', 'right', 'right', 'right', 'right'], 9);
    game.toast('Nuevo objetivo: volver a casa');
  },

  // ---------- Villa Arenal ----------
  async ayudanteVilla(ow, game) {
    await say(N.aide, '¿Tú eres quien abrió el maletín del lago?', 'La profesora te espera en el laboratorio. Es el edificio grande de aquí atrás.');
  },
  async profeEntrega(ow, game) {
    const st = game.state, prof = ow.npc('profe');
    const p = ow.player;
    if (p.y > prof.y + 1) {
      const steps = [];
      for (let y = p.y; y > prof.y + 1; y--) steps.push('up');
      await ow.walk(p, steps, 14);
    }
    p.dir = 1; if (prof) prof.dir = 0;
    const c = st.party[0];
    await say(N.prof, `Así que tú eres ${st.name}.`, 'Abriste mi maletín en el Lago Espejo, ¿no es así?', '...', `Mm. Ese ${c.name} parece muy contento contigo.`, 'Está bien. Quédatelo. Cuídense mucho el uno al otro.');
    await say(N.prof, 'Y toma esto también.');
    st.bag.capsula = (st.bag.capsula || 0) + 5;
    await ui.say(['¡Recibiste 5 CÁPSULAS!']);
    await say(N.prof, 'Con las Cápsulas puedes atrapar criaturas salvajes. Bájales los PS primero.', 'En la Posada Vital curan a tus criaturas, y en la Tienda venden objetos.', 'Al norte de Villa Arenal está la Ruta 2. Síguela hasta Ciudad Corola: allá está el primer gimnasio.');
    st.story = 5;
    game.toast('Nuevo objetivo: Ciudad Corola');
  },
  async profe(ow, game) {
    if (game.state.story === 4) return S.profeEntrega(ow, game);
    const st = game.state, n = badgeCount(st), g = nextGym(st);
    if (st.story >= 11 && st.story < 12) return say(N.prof, n >= LEAGUE_BADGES ? '¡Las ocho medallas! La Liga Alborada te espera al final de la Ruta 5.' : `¡${n} medalla${n > 1 ? 's' : ''}! Te faltan ${LEAGUE_BADGES - n} para la Liga.`, g ? `El siguiente gimnasio está en ${g.city}.` : 'Ve con todo. Alborada entera va a estar pendiente.');
    await say(N.prof, n ? `¡${n} medalla${n > 1 ? 's' : ''}! Vas muy bien.` : '¿Ya pasaste por la Posada y la Tienda?', 'Recuerda: el Lago Espejo guarda un secreto. Yo sigo investigando.');
  },
  async posada(ow, game, npc) {
    const st = game.state;
    if (!st.party.length) return say(N.nurse, '¡Bienvenido a la Posada!', 'Cuando tengas criaturas, aquí las curamos gratis.');
    const i = await ui.ask('¡Bienvenido a la Posada! ¿Quieres que cure a tus criaturas?', ['Sí, por favor', 'No, gracias'], { name: N.nurse });
    if (i !== 0) return say(N.nurse, '¡Vuelve cuando quieras!');
    await say(N.nurse, 'Muy bien, déjamelas un momento...');
    await game.healParty(true);
    st.lastHeal = (npc && npc.arg) || { map: 'posada', x: 6, y: 7 };
    await say(N.nurse, '¡Listo! Tus criaturas están en plena forma.', '¡Que te vaya bien!');
  },
  // Mostrador general: comprar (crece con las medallas) o vender a mitad de precio.
  async tienda(ow, game, npc) {
    const town = npc && npc.town || 'arenal', title = ow.map.name;
    for (let first = true; ; first = false) {
      const i = await ui.ask(first ? '¡Bienvenido! ¿Qué deseas?' : '¿Te ayudo con algo más?', ['Comprar', 'Vender', 'Nada, gracias'], { name: N.clerk });
      if (i === 0) await game.openShop({ kind: 'general', town, title });
      else if (i === 1) await game.openShop({ kind: 'sell', title: 'Vender' });
      else break;
    }
    await say(N.clerk, '¡Gracias, vuelve pronto!');
  },
  // Mostrador especial: cada ciudad vende cosas propias.
  async tiendaEspecial(ow, game, npc) {
    const town = npc && npc.town || 'arenal', sp = SPECIAL[town];
    for (let first = true; ; first = false) {
      const i = await ui.ask(first ? `¡A la orden! Esto es el ${sp.name}: cositas que no consigues en otro lado.` : '¿Te provoca algo más?', ['Ver productos', 'Nada, gracias'], { name: N.vendor });
      if (i !== 0) break;
      await game.openShop({ kind: 'special', town, title: sp.name });
    }
    await say(N.vendor, '¡Que te rinda el viaje!');
  },
  async maquina(ow, game) {
    await game.openShop({ kind: 'vending', title: 'Máquina expendedora' });
  },
  async pc(ow, game) {
    const st = game.state;
    st.box = st.box || [];
    if (!st.box.length) return ui.say(['PC de almacenamiento.', 'La caja está vacía. Las criaturas que atrapes con el equipo lleno llegan aquí.']);
    const list = st.box.slice(0, 5);
    const i = await ui.ask('PC de almacenamiento. ¿A quién quieres sacar?', [...list.map(c => `${c.name} Nv${c.level}`), 'Salir']);
    if (i >= list.length) return;
    if (st.party.length >= 6) return ui.say(['Tu equipo está lleno. Deja a alguien primero (habla de nuevo con la enfermera para curar y vuelve).']);
    const [c] = st.box.splice(i, 1);
    st.party.push(c);
    await ui.say([`${c.name} se unió a tu equipo.`]);
  },
  async viaje(ow, game) {
    const st = game.state;
    if (!(st.badges || []).length) return say(N.courier, '¡Hola! Soy la Mensajera de Alborada.', 'Cuando tengas tu primera medalla, te llevo volando a cualquier pueblo que ya conozcas.');
    const places = [['Pueblo Brisal', 'brisal', 5, 8], ['Villa Arenal', 'arenal', 18, 8], ['Ciudad Corola', 'corola', 6, 16], ['Pueblo Cobre', 'cobre', 6, 17], ['Ciudad Marea', 'marea', 22, 8],
      ['Ciudad Voltio', 'voltio', 6, 16], ['Pueblo Niebla', 'niebla', 6, 19], ['Villa Cafetal', 'cafetal', 6, 12], ['Ciudad Escarcha', 'escarcha', 6, 17], ['Ciudad Albor', 'albor', 14, 13], ['Liga Alborada', 'ruta5', 7, 7]]
      .filter(p => st.visited && st.visited[p[1]]).map(([name, map, x, y]) => ({ name, map, x, y }));
    await say(N.courier, '¡Hola! ¿A dónde te llevo?');
    const i = await game.menus.travel(places);
    if (i < 0) return say(N.courier, '¡Cuando quieras!');
    await say(N.courier, `¡Agárrate fuerte! Rumbo a ${places[i].name}.`);
    await ow.warp(places[i].map, places[i].x, places[i].y, 0);
  },

  // ---------- Etapa 2: Ruta 2 y Corola ----------
  async bloqueoArenal(ow) {
    await ui.say(['(Primero deberías pasar por el laboratorio de la Profesora Ceiba.)']);
    await ow.stepBack();
  },
  async nicoRuta2(ow, game) {
    const st = game.state, nico = ow.npc('nicoR2');
    if (nico) { ow.emote(nico, '!'); await game.frames(30); await ow.approach(nico); }
    await say(N.nico, `¡${st.name}! ¡Te estaba esperando!`, 'La profe me dio Cápsulas a mí también. ¡Mira lo que ya entrené!', '¡Vamos a ver quién es mejor!');
    const res = await game.trainerBattle({ name: 'Nico', look: 'rival', party: [['pipiu', 5], [st.rivalStarter || 'brasin', 7]], money: 300 }, 'grass', { noBlackout: true });
    if (res === 'lose') { await game.healParty(); await say(N.nico, '¡Ja! ¡Te gané!', 'Tranqui, ya curé a tus criaturas. ¡La próxima será más pareja!'); }
    else await say(N.nico, '¡¿Qué?! ¡Perdí!', 'Bueno... ¡la próxima te gano seguro! ¡Me voy a Corola a entrenar!');
    st.flags.nicoR2 = true;
    if (nico) for (let i = 0; i < 3; i++) { if (ow.blocked(nico.x, nico.y - 1, nico)) break; await ow.walk(nico, ['up'], 9); }
  },
  async eclipseCorola(ow, game) {
    const st = game.state;
    await ui.say(['Dos personas con capuchas moradas discuten frente al gimnasio...']);
    await say(N.grunt, '...Te digo que el cristal de la cueva no basta.', 'El jefe Umbra quiere a la guardiana del Lago Espejo. Con ella el Eclipse va a cubrir todo Alborada.');
    await say(N.grunt, '¡Shh! Alguien nos mira. ¡Vámonos!');
    const a = ow.npc('gruntA'), b = ow.npc('gruntB');
    if (a && b) await Promise.all([ow.walk(a, ['right', 'right', 'right', 'right'], 9), ow.walk(b, ['right', 'right', 'right'], 9)]);
    st.flags.eclipseCorola = true;
    st.story = Math.max(st.story, 6);
    game.toast('Nuevo objetivo: Medalla Hoja');
  },
  async bloqueoCorola(ow) {
    await say(N.guard, 'Lo siento. La Ruta 3 pasa por la Cueva Eco y es peligrosa.', 'Sólo dejo pasar a quien tenga la Medalla Hoja del gimnasio de Corola.');
    await ow.stepBack();
  },
  async guardiaCorola(ow, game) {
    if ((game.state.badges || []).includes('hoja')) return say(N.guard, '¡Esa Medalla Hoja se ve muy bien! Pasa, y cuidado en la cueva.');
    await say(N.guard, 'Sin la Medalla Hoja no puedo dejarte pasar a la Ruta 3.');
  },
  async bloqueoLiga(ow, game) {
    const n = badgeCount(game.state);
    await say(N.guard, 'Este es el camino a la Liga Alborada.', `Sólo pueden pasar entrenadores con las ${LEAGUE_BADGES} medallas de Alborada. Tú llevas ${n}.`);
    await ow.stepBack();
  },
  async guardiaLiga(ow, game) {
    const st = game.state, n = badgeCount(st);
    if (st.story >= 12 || (st.story >= 11 && n >= LEAGUE_BADGES)) return say(N.guard, '¡Ocho medallas! Adelante, campeón en potencia.', 'La Liga te espera al final de la Ruta 5.');
    await say(N.guard, `La Ruta 5 lleva a la Liga Alborada. Vuelve cuando tengas las ${LEAGUE_BADGES} medallas.`, n ? `Llevas ${n}. ¡Vas bien!` : 'Los ocho gimnasios están repartidos por toda la región.');
  },
  // Las ocho medallas salen de la tabla de gimnasios (data/gyms.js): nombre, regalo y siguiente destino.
  async medalla(ow, game, npc) {
    const st = game.state, badge = npc.badge, g = gymOf(badge);
    st.badges = st.badges || [];
    if (!g || st.badges.includes(badge)) return;
    st.badges.push(badge);
    const [gift, qty] = g.gift;
    await ui.say([`¡${st.name} recibió la MEDALLA ${g.name.toUpperCase()}!`]);
    st.bag[gift] = (st.bag[gift] || 0) + qty;
    await ui.say([qty > 1 ? `¡Y además ${qty} ${ITEMS[gift].name}!` : `¡Y además: ${ITEMS[gift].name}!`]);
    if (!st.bag.brazaleteAlba) {
      st.bag.brazaleteAlba = 1;
      await ui.say(['Y una cosa más: ¡un Brazalete Alba!', 'Con él, una vez por combate, tu criatura despierta la Forma Alba: crece, brilla y se vuelve más fuerte.', 'En LUCHAR toca FORMA ALBA antes de escoger el ataque.']);
    }
    if (g.story) st.story = Math.max(st.story, g.story);
    const n = badgeCount(st);
    if (n > 3) await ui.say([n >= LEAGUE_BADGES ? '¡Ya tienes las ocho medallas de Alborada! La Liga te abre sus puertas.' : `Llevas ${n} de ${LEAGUE_BADGES} medallas.`]);
    game.toast(n >= LEAGUE_BADGES ? 'Nuevo objetivo: la Liga Alborada (Ruta 11 y Ruta 5)' : `Nuevo objetivo: ${g.next}`);
  },

  // ---------- Salidas vigiladas de la región del este ----------
  // Cada ciudad nueva guarda la ruta siguiente hasta que ganes en su gimnasio.
  async bloqueoMareaEste(ow) {
    await say(N.guard, 'La Ruta 6 lleva a Ciudad Voltio y a los otros cinco gimnasios.', 'Pero con el Equipo Eclipse suelto por ahí, sólo dejo pasar a quien la Profesora Ceiba autorice.');
    await ow.stepBack();
  },
  async guardiaMareaEste(ow, game) {
    if (game.state.story >= 11) return say(N.guard, 'La profesora me avisó de ti. ¡Adelante!', 'Sigue la costa hacia el este y llegarás a Ciudad Voltio.');
    await say(N.guard, 'Más allá está la Ruta 6. Por ahora está cerrada.', 'Dicen que el Equipo Eclipse anda en algo raro... primero hay que resolver eso.');
  },
  async bloqueoVoltio(ow) { await gateStop(ow, 'chispa', 'La Ruta 7 se mete en el bosque de niebla. Es fácil perderse.'); },
  async guardiaVoltio(ow, game) { await gateTalk(game, 'chispa', 'La Ruta 7 sube hasta Pueblo Niebla.'); },
  async bloqueoNiebla(ow) { await gateStop(ow, 'sombra', 'Arriba están los cafetales de la montaña. El camino es empinado.'); },
  async guardiaNiebla(ow, game) { await gateTalk(game, 'sombra', 'La Ruta 8 sube por los cafetales hasta Villa Cafetal.'); },
  async bloqueoCafetal(ow) { await gateStop(ow, 'puno', 'El paso nevado de la Ruta 9 es muy duro. Aquí no se manda a nadie sin preparación.'); },
  async guardiaCafetal(ow, game) { await gateTalk(game, 'puno', 'Al oeste, por el paso nevado, está Ciudad Escarcha.'); },
  async bloqueoEscarcha(ow) { await gateStop(ow, 'escarcha', 'El camino antiguo de la Ruta 10 baja hasta Ciudad Albor.'); },
  async guardiaEscarcha(ow, game) { await gateTalk(game, 'escarcha', 'El camino antiguo lleva a Ciudad Albor, la del último gimnasio.'); },
  async bloqueoAlbor(ow) { await gateStop(ow, 'escama', 'La Ruta 11 es el camino de la victoria: lleva a la Liga.'); },
  async guardiaAlbor(ow, game) { await gateTalk(game, 'escama', 'La Ruta 11 baja hasta la Ruta 5 y la Liga Alborada.'); },

  // ---------- Cobre y Ruta 4 ----------
  async bloqueoCobre(ow) {
    await say(N.guard, 'La Ruta 4 baja hasta la costa.', 'Basalto me pidió que sólo dejara pasar a quien tenga la Medalla Roca.');
    await ow.stepBack();
  },
  async guardiaCobre(ow, game) {
    if ((game.state.badges || []).includes('roca')) return say(N.guard, '¡Medalla Roca! Adelante, el mar te espera.');
    await say(N.guard, 'Sin la Medalla Roca no puedes bajar a la Ruta 4.');
  },
  async nicoRuta4(ow, game) {
    const st = game.state, nico = ow.npc('nicoR4');
    if (nico) { ow.emote(nico, '!'); await game.frames(30); await ow.approach(nico); }
    await say(N.nico, '¡Ey! ¡Dos medallas! Yo también tengo dos, ¿qué creías?', 'Oí que el Equipo Eclipse tiene una bodega en Ciudad Marea.', '¡Pero primero, revancha!');
    const res = await game.trainerBattle({ name: 'Nico', look: 'rival', party: [['pipiolo', 17], ['setin', 16], [rivalForm(st.rivalStarter || 'brasin', 18), 18]], money: 800, alba: true }, 'beach');
    if (res !== 'win') return;
    st.flags.nicoR4 = true;
    await say(N.nico, '¡Otra vez! ¿Cómo haces?', 'Bueno, ¡me adelanto a Marea! ¡Nos vemos!');
    if (nico) { const blocked = ow.blocked(nico.x, nico.y + 1, nico); if (!blocked) await ow.walk(nico, ['down', 'down'], 9); }
  },

  // ---------- Marea y el Equipo Eclipse ----------
  async bruma(ow, game) {
    const st = game.state;
    if (st.flags.bruma) return say(N.bruma, 'Ya es tarde, mocoso. Umbra ya está en el Lago Espejo.');
    await say(N.bruma, '¿Un niño aquí? Qué ternura.', 'Soy Bruma, administradora del Equipo Eclipse.', 'Nuestro jefe va a despertar a la guardiana del Lago Espejo y con su poder cubrirá el cielo de Alborada.', '¿Quieres detenernos? Inténtalo.');
    const res = await game.trainerBattle({ name: 'Admin. Bruma', look: 'bruma', party: [['sombrador', 23], ['voltaz', 22], ['mentelin', 22]], money: 2000 }, 'eclipse');
    if (res !== 'win') return;
    st.flags.bruma = true;
    st.story = Math.max(st.story, 10);
    await say(N.bruma, '...No importa. Umbra ya salió para el Lago Espejo hace una hora.', 'Cuando llegues, todo habrá terminado.');
    await say(N.prof, `(Suena tu teléfono) ¡${st.name}! ¡Hay gente rara en el Lago Espejo!`, '¡Ve rápido! La Mensajera de cualquier Posada te puede llevar a Pueblo Brisal.');
    game.toast('Nuevo objetivo: ¡al Lago Espejo!');
  },
  async eventoLago(ow, game) {
    const st = game.state, umbra = ow.npc('umbra');
    if (umbra) { umbra.dir = 3; ow.emote(umbra, '!'); await game.frames(30); }
    await say(N.umbra, 'Así que tú eres el niño que molestó a mis reclutas.', 'Mira el lago. En unos minutos, la guardiana despertará y obedecerá al Equipo Eclipse.', 'Y nadie, NADIE, nos va a detener.');
    const res = await game.trainerBattle({ name: 'Jefe Umbra', look: 'umbra', party: [['sombrador', 26], ['mentelin', 25], ['penon', 26], ['voltaz', 26]], money: 3500, alba: true }, 'lake');
    if (res !== 'win') return;
    await say(N.umbra, '¡¿Cómo?! ¡¿Un niño?!', '...¡Esperen! ¡El lago está brillando!');
    await ui.say(['El agua del Lago Espejo se vuelve plata.', 'Del reflejo del cielo sale una criatura con alas como espejos...']);
    await say(N.umbra, '¡Es ella! ¡ESPEJALBA! ¡Atrápenla!');
    await ui.say(['Espejalba mira a Umbra... y luego te mira a ti.']);
    await S.espejalbaOtraVez(ow, game);
    await say(N.umbra, 'Esto no se queda así. ¡Retirada!');
    await say(N.prof, `¡${st.name}! Llegué en cuanto pude... ¿qué pasó aquí?`, '¿Derrotaste al jefe del Equipo Eclipse? ¿Y viste a Espejalba?', 'Increíble. Eres el entrenador que Alborada necesitaba.', 'Para entrar a la Liga Alborada necesitas las ocho medallas. Te faltan cinco gimnasios, todos al este y al norte de Ciudad Marea.', 'Le aviso al guardia de Marea: la Ruta 6 queda abierta para ti. Empieza por Ciudad Voltio.');
    st.bag.hipertonico = (st.bag.hipertonico || 0) + 3;
    await ui.say(['¡La Profesora Ceiba te dio 3 Hipertónicos!']);
    st.story = 11;
    const g = nextGym(st);
    game.toast(g ? `Nuevo objetivo: ${g.city}${g.badge === 'chispa' ? ' (Ruta 6, al este de Marea)' : ''}` : 'Nuevo objetivo: Liga Alborada (Ruta 5)');
  },
  async espejalbaOtraVez(ow, game) {
    const st = game.state;
    if (st.flags.espejalba) return;
    if (st.story >= 11) await ui.say(['El agua brilla... ¡Espejalba aparece otra vez!']);
    const foe = makeCreature('espejalba', 30);
    const res = await game.battle({ foe, wild: true, legendary: true, canRun: true, canCatch: true, bg: 'lake' });
    if (res === 'caught') { st.flags.espejalba = true; await ui.say(['Espejalba ahora es tu compañera. El lago se ve tranquilo.']); }
    else if (res === 'lose') await game.blackout();
    else await ui.say(['Espejalba se sumergió en el lago... Un brillo se quedó en la orilla.', '(Puedes volver a buscarla cuando quieras.)']);
  },

  // ---------- Leyendas de la Bruma (después de ser campeón) ----------
  // Brumalia (Ruta 2 de noche), Fraguón (Cueva Eco) y Glaciel (Ruta 5). Con las tres, Dracalba despierta en el Lago Espejo.
  async leyenda(ow, game, obj) {
    const st = game.state, sp = obj.legend;
    if (st.flags[sp]) return;
    const L = {
      brumalia: { lv: 45, bg: 'grass', intro: ['La niebla se junta entre los árboles... y toma forma de cierva.', '¡Brumalia, la guardiana del Bosque Bruma!'], gone: 'Brumalia se deshizo en la niebla...' },
      fraguon: { lv: 45, bg: 'cave', intro: ['El suelo de la cueva está caliente. Algo golpea como un martillo...', '¡Fraguón despertó de su sueño de lava!'], gone: 'Fraguón volvió a hundirse en el calor de la roca...' },
      glaciel: { lv: 45, bg: 'mountain', intro: ['Empieza a nevar en plena ruta. Una sombra enorme tapa el sol...', '¡Glaciel, el cóndor de hielo, bajó de los nevados!'], gone: 'Glaciel se fue volando entre la nieve...' },
      dracalba: { lv: 50, bg: 'lake', intro: ['La niebla, el fuego y la nieve que encontraste se reúnen sobre el lago.', 'El cielo se pone color de amanecer...', '¡Dracalba, el dragón del alba, despertó!'], gone: 'Dracalba subió hacia el sol y se perdió de vista...' }
    }[sp];
    if (!L) return;
    await ui.say(L.intro);
    const foe = makeCreature(sp, L.lv);
    const res = await game.battle({ foe, wild: true, legendary: true, canRun: true, canCatch: true, bg: L.bg });
    if (res === 'caught') {
      st.flags[sp] = true;
      await ui.say([`¡${SPECIES[sp].name} ahora es parte de tu equipo!`]);
      if (sp !== 'dracalba' && ['brumalia', 'fraguon', 'glaciel'].every(k => st.flags[k])) await ui.say(['Sientes un calor suave, como el primer rayo del día...', 'Algo te llama desde el Lago Espejo.']);
    } else if (res === 'lose') await game.blackout();
    else await ui.say([L.gone, '(Puedes volver a buscarlo cuando quieras.)']);
  },

  // ---------- Liga ----------
  async nicoLiga(ow, game) {
    const st = game.state, nico = ow.npc('nicoLiga');
    await say(N.nico, `¡Sabía que llegarías, ${st.name}!`, 'Yo también recorrí los ocho gimnasios. ¡Centella casi me fríe!', 'Desde ese día en el lago supe que eras mi gran rival.', 'Antes de que llegues a la campeona... ¡tienes que pasar por mí! ¡Con todo!');
    const res = await game.trainerBattle({ name: 'Nico', look: 'rival', party: [['pipiolo', 47], ['voltaz', 47], ['arieton', 47], ['roedon', 46], [rivalForm(st.rivalStarter || 'brasin', 50), 50]], money: 8000, alba: true }, 'league');
    if (res !== 'win') return;
    st.flags.nicoLiga = true;
    await say(N.nico, '...Ganaste. Otra vez.', '¿Sabes qué? Me alegra que seas tú. ¡Ve! ¡Aurora te espera!');
    if (nico) await ow.walk(nico, ['left', 'left', 'left'], 10);
  },
  async aurora(ow, game) {
    const st = game.state;
    if (st.story >= 12) return say(N.aurora, `¡${st.name}, campeón de Alborada!`, 'Vuelve cuando quieras. Las puertas de la Liga siempre estarán abiertas para ti.');
    const aur = ow.npc('aurora');
    if (aur) aur.dir = 0;
    await say(N.aurora, 'Bienvenido. Soy Aurora, campeona de la Liga Alborada.', 'Supe lo que hiciste en el Lago Espejo. Gracias por proteger nuestra región.', 'Pero aquí no hay favores: muéstrame todo lo que aprendiste en tu viaje.');
    const res = await game.trainerBattle({ name: 'Campeona Aurora', look: 'aurora', party: [['meduson', 50], ['elestrix', 51], ['astrocuarzo', 51], ['nivalord', 51], ['orbelina', 52], ['velaria', 53]], money: 20000, alba: true }, 'league');
    if (res !== 'win') return;
    st.story = 12;
    await say(N.aurora, '...Qué combate tan hermoso.', `Desde hoy, ${st.name}, eres el nuevo campeón de la Liga Alborada.`, 'Tu nombre y el de tus criaturas quedarán grabados en el Salón de la Fama.');
    await game.fadeOut();
    await game.credits();
    await game.healParty();
    ow.load('casa1', 5, 6, 1);
    st.lastHeal = { map: 'casa1', x: 5, y: 6 };
    await game.fadeIn();
    await say(N.mom, `¡${st.name}! ¡Te vimos en la tele! ¡Campeón de Alborada!`, 'Nico vino a contarme todo. Está orgullosísimo... aunque no lo admita.', 'Descansa, cariño. Y cuando quieras, el mundo sigue ahí afuera.');
    game.toast('¡Eres campeón de Alborada!');
  }
};
