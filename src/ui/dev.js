// Modo desarrollador (se prende con una clave en Códigos): ir a cualquier lugar y volver a donde estabas.
// Sirve para revisar todo el mapa sin tener que jugar la historia hasta allá.
// Los interruptores (atravesar paredes, paseo tranquilo, caminar rápido) están en cheats.js y los usa overworld.js;
// la lista de lugares y la casilla libre más cercana, en world/devmap.js.
import { ui } from './ui.js';
import { MONEY_MAX } from '../data/cheats.js';
export { devPlaces, findFree, spotOf } from '../world/devmap.js';

// Ir a un lugar. La primera vez se anota de dónde salió el jugador, para poder volver a su historia.
export async function devGo(game, spot) {
  const ow = game.ow, st = game.state;
  if (!spot) { ui.closePanel(); game.menus.home(false); game.toast('Ahí no hay dónde pararse (es mar o queda fuera del mapa)'); return false; }
  if (!st.devBack) st.devBack = { map: st.map, x: st.x, y: st.y, dir: st.dir || 0 };
  ui.closePanel();
  await ow.warp(spot.map, spot.x, spot.y, 0);
  game.menus.home(false);
  return true;
}
export async function devReturn(game) {
  const b = game.state.devBack;
  if (!b) return;
  delete game.state.devBack;
  ui.closePanel();
  await game.ow.warp(b.map, b.x, b.y, b.dir || 0);
  game.menus.home(false);
  game.toast('De vuelta a donde estabas');
}

export function devMoney(game, amount = 50000) {
  const st = game.state;
  st.money = Math.min(MONEY_MAX, (st.money || 0) + amount);
}
