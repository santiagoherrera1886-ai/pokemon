// Guiones de la historia de la Etapa 1. Cada guion es una función async que recibe el overworld.
import { ui } from '../ui/ui.js';
import { SPECIES, RIVAL_PICK, makeCreature } from '../data/creatures.js';

const N = { mom: 'Mamá', nico: 'Nico', prof: 'Prof. Ceiba', aide: 'Ayudante', kid: 'Niño', nurse: 'Enfermera Malva', clerk: 'Dependiente', rivalMom: 'Mamá de Nico' };

export class Scripts {
  constructor(game) { this.game = game; }
  async run(name, ow, arg) {
    const f = S[name];
    if (!f) { console.warn('Guion inexistente', name); return; }
    await f(ow, this.game, arg);
  }
}

const say = (who, ...pages) => ui.say(pages, { name: who });

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
    await say(N.prof, 'Con las Cápsulas puedes atrapar criaturas salvajes. Bájales los PS primero.', 'En la Posada Vital curan a tus criaturas, y en la Tienda venden objetos.', 'Cuando abran la Ruta 2, quiero que sigas hasta Ciudad Corola.');
    st.story = 5;
    game.toast('Etapa 1 completada');
  },
  async profe(ow, game) {
    if (game.state.story === 4) return S.profeEntrega(ow, game);
    await say(N.prof, '¿Ya pasaste por la Posada y la Tienda?', 'La Ruta 2 abrirá pronto. Prepárate bien.');
  },
  async posada(ow, game) {
    const st = game.state;
    if (!st.party.length) return say(N.nurse, '¡Bienvenido a la Posada Vital!', 'Cuando tengas criaturas, aquí las curamos gratis.');
    const i = await ui.ask('¡Bienvenido a la Posada Vital! ¿Quieres que cure a tus criaturas?', ['Sí, por favor', 'No, gracias'], { name: N.nurse });
    if (i !== 0) return say(N.nurse, '¡Vuelve cuando quieras!');
    await say(N.nurse, 'Muy bien, déjamelas un momento...');
    await game.healParty(true);
    st.lastHeal = { map: 'posada', x: 6, y: 7 };
    await say(N.nurse, '¡Listo! Tus criaturas están en plena forma.', '¡Que te vaya bien!');
  },
  async tienda(ow, game) {
    const i = await ui.ask('¡Bienvenido a la Tienda Arenal! ¿Qué deseas?', ['Comprar', 'Nada, gracias'], { name: N.clerk });
    if (i === 0) await game.openShop();
    await say(N.clerk, '¡Gracias, vuelve pronto!');
  }
};
