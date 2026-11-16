// Modo desarrollador (se prende con una clave en Opciones › Códigos): ir a cualquier lugar, volver a donde estabas y
// atajos para el carro y la avioneta. Sirve para revisar todo el mapa sin tener que jugar la historia hasta allá.
// Los interruptores (atravesar paredes, paseo tranquilo, caminar rápido) están en cheats.js y los usa overworld.js;
// la lista de lugares y la casilla libre más cercana, en world/devmap.js.
import { ui } from './ui.js';
import { TG, AIRPORTS } from '../world/tierra.js';
import { MONEY_MAX } from '../data/cheats.js';
import { PARADOR, findFree } from '../world/devmap.js';
export { PARADOR, devPlaces, findFree, spotOf } from '../world/devmap.js';

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

// Carro ya: entrega las llaves si faltan y se sube. Si estás lejos de Tierra Grande te deja en el Parador del Llano;
// si vas volando, aterriza en el punto libre que haya debajo.
export async function devCar(game) {
  const ow = game.ow, st = game.state, f = ow.flight;
  st.bag.llavesCarro = 1; st.carColor = st.carColor || '#d8443a';
  const inTG = ow.map?.outdoor && ow.map.region === 'tierra';
  if (f) { if (!await devGo(game, findFree(game.world, st, TG.X + Math.floor(f.x), TG.Y + Math.floor(f.y), 80))) return; }
  else if (!inTG) await devGo(game, PARADOR);
  else { ui.closePanel(); game.menus.home(false); }
  if (ow.vehicle !== 'car') ow.toggleCar();
}
// Avioneta ya: entrega la licencia si falta y despega desde donde estés (afuera en Tierra Grande) o desde la Pista Norte.
export async function devPlane(game) {
  const ow = game.ow, st = game.state;
  st.bag.licenciaPiloto = 1; st.planeColor = st.planeColor || '#f6f2ea';
  ui.closePanel(); game.menus.home(false);
  if (ow.flight) { game.toast('Ya vas volando'); return; }
  const p = ow.map?.outdoor && ow.map.region === 'tierra' ? ow.tgPos() : null;
  if (p && p[1] > 0) { await ow.takeoff({ id: 'dev', name: 'aquí', x0: p[0] - 8, y0: p[1] - 4 }); return; }
  const ap = AIRPORTS[0];
  if (await devGo(game, findFree(game.world, st, TG.X + ap.arrive[0], TG.Y + ap.arrive[1]))) await ow.takeoff(ap);
}
export function devMoney(game, amount = 50000) {
  const st = game.state;
  st.money = Math.min(MONEY_MAX, (st.money || 0) + amount);
}
