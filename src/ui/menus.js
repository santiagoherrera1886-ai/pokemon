// Paneles de la pantalla inferior fuera del combate: menú principal, equipo, mochila,
// guardado, opciones, tienda, elección de inicial y título.
import { ui, esc } from './ui.js';
import { iconURL } from '../art/creatures.js';
import { SPECIES, MOVES, TYPES, ITEMS, SHOP_STOCK, STARTERS, expForLevel } from '../data/creatures.js';
import { saveState } from '../core/state.js';

const hpBar = c => { const k = Math.max(0, c.hp / c.stats.hp); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
const typeTags = sp => SPECIES[sp].types.map(t => `<span class="type" style="--t:${TYPES[t].color}">${TYPES[t].name}</span>`).join('');

export class Menus {
  constructor(game) { this.game = game; }
  get st() { return this.game.state; }

  // Menú principal (se abre con Esc o el botón MENÚ). Sin modal, simplemente se cierra el panel.
  home(modal = false) {
    if (!modal) { if (!ui.panel || !ui.panel.modal) ui.closePanel(); return; }
    const st = this.st, map = this.game.ow?.map;
    const goals = ['Baja a hablar con mamá', 'Ve a la casa de Nico (techo azul)', 'Ve al Lago Espejo (Sendero 1, al oeste)', 'Vuelve a casa', 'Ve al laboratorio de Villa Arenal',
      'Sigue la Ruta 2 hacia Ciudad Corola', 'Gana la Medalla Hoja en el gimnasio de Corola', 'Cruza la Cueva Eco hasta Pueblo Cobre y gana la Medalla Roca', 'Baja por la Ruta 4 hasta Ciudad Marea y gana la Medalla Marea',
      'Detén al Equipo Eclipse en su bodega de Ciudad Marea', 'Corre al Lago Espejo: el Equipo Eclipse va por la guardiana', 'Sube por la Ruta 5 (norte de Corola) hasta la Liga Alborada', 'Eres campeón. Explora y completa tu registro'];
    const BADGES = [['hoja', '#5cb04c'], ['roca', '#b8a058'], ['marea', '#3e98dc']];
    const dex = Object.values(st.dex || {});
    ui.setPanel(`<div class="home">
      <div class="home-head"><span>${esc(map ? map.name : '')}</span><span>$${st.money}</span></div>
      <div class="goal"><small>OBJETIVO</small>${esc(goals[Math.min(goals.length - 1, st.story)])}</div>
      <div class="badges">${BADGES.map(([b, c]) => `<i class="${(st.badges || []).includes(b) ? 'on' : ''}" style="--c:${c}" title="Medalla ${b}"></i>`).join('')}<span>Registro: ${dex.filter(v => v === 2).length} atrapadas · ${dex.length} vistas</span></div>
      <div class="home-grid">
        <button data-act="party" class="hb hb-party"><i></i>EQUIPO</button>
        <button data-act="bag" class="hb hb-bag"><i></i>MOCHILA</button>
        <button data-act="save" class="hb hb-save"><i></i>GUARDAR</button>
        <button data-act="options" class="hb hb-opt"><i></i>OPCIONES</button>
      </div>
      <button class="bt-back" data-back>CERRAR</button></div>`,
    { modal: true, cls: 'home-panel', onAct: a => this.open(a), onBack: () => ui.closePanel() });
  }
  open(what) {
    ({ party: () => this.party(), bag: () => this.bag(), save: () => this.save(), options: () => this.options() })[what]();
  }

  party() {
    const st = this.st;
    ui.setPanel(`<h3 class="ph">EQUIPO</h3><div class="plist">${st.party.length ? st.party.map((c, i) => `<button data-act="${i}"><img src="${iconURL(c.sp)}" alt=""><span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level}</small></span>${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></button>`).join('') : '<p class="empty">Todavía no tienes criaturas.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onAct: i => this.creature(+i), onBack: () => this.home(true) });
  }
  creature(i) {
    const c = this.st.party[i], s = SPECIES[c.sp];
    const toNext = expForLevel(c.level + 1) - c.exp;
    ui.setPanel(`<div class="detail"><img src="${iconURL(c.sp)}" alt=""><div><b>${esc(c.name)}</b> <small>Nv${c.level}</small><div>${typeTags(c.sp)}</div></div></div>
      <p class="desc">${esc(s.desc)}</p>
      <div class="stats"><span>PS ${Math.ceil(c.hp)}/${c.stats.hp}</span><span>ATQ ${c.stats.atk}</span><span>DEF ${c.stats.def}</span><span>VEL ${c.stats.spe}</span><span>Sig. nivel: ${toNext} exp</span></div>
      <div class="moves">${c.moves.map(m => `<span style="--t:${TYPES[MOVES[m.id].type].color}">${esc(MOVES[m.id].name)} <small>PP ${m.pp}/${MOVES[m.id].pp}</small></span>`).join('')}</div>
      <div class="row2">${i > 0 ? `<button data-act="lead">PONER PRIMERO</button>` : ''}<button class="bt-back" data-back>VOLVER</button></div>`,
    { modal: true, cls: 'list-panel', onAct: a => { if (a === 'lead') { const [x] = this.st.party.splice(i, 1); this.st.party.unshift(x); this.party(); } }, onBack: () => this.party() });
  }

  bag() {
    const st = this.st;
    const ids = Object.keys(ITEMS).filter(id => st.bag[id] > 0);
    ui.setPanel(`<h3 class="ph">MOCHILA <small>$${st.money}</small></h3><div class="ilist">${ids.length ? ids.map(id => `<button data-act="${id}"><b>${esc(ITEMS[id].name)}</b><span>x${st.bag[id]}</span><small>${esc(ITEMS[id].desc)}</small></button>`).join('') : '<p class="empty">La mochila está vacía.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onAct: id => this.useItem(id), onBack: () => this.home(true) });
  }
  useItem(id) {
    const it = ITEMS[id], st = this.st;
    if (id === 'capsula' || id === 'supercapsula') { ui.say(['Las Cápsulas se usan en combate contra criaturas salvajes.']).then(() => this.bag()); return; }
    if (!st.party.length) { ui.say(['No tienes criaturas.']).then(() => this.bag()); return; }
    ui.setPanel(`<h3 class="ph">¿En quién usar ${esc(it.name)}?</h3><div class="plist">${st.party.map((c, i) => `<button data-act="${i}"><img src="${iconURL(c.sp)}" alt=""><span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level}</small></span>${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></button>`).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onBack: () => this.bag(), onAct: async a => {
        const c = st.party[+a];
        let msg;
        if (it.revive) { if (c.hp > 0) msg = 'No tendría ningún efecto.'; else { c.hp = Math.floor(c.stats.hp / 2); st.bag[id]--; msg = `¡${c.name} se recuperó!`; } }
        else if (c.hp <= 0 || c.hp >= c.stats.hp) msg = 'No tendría ningún efecto.';
        else { const before = c.hp; c.hp = Math.min(c.stats.hp, c.hp + it.heal); st.bag[id]--; msg = `${c.name} recuperó ${c.hp - before} PS.`; }
        await ui.say([msg]);
        st.bag[id] > 0 ? this.useItem(id) : this.bag();
      } });
  }

  async save() {
    const i = await ui.ask('¿Quieres guardar la partida?', ['Sí', 'No']);
    if (i === 0) {
      const ok = saveState(this.st);
      await ui.say([ok ? `${this.st.name} guardó la partida.` : 'No se pudo guardar (el navegador bloquea el almacenamiento).']);
    }
    ui.closePanel();
  }

  options() {
    const o = this.st.options;
    ui.setPanel(`<h3 class="ph">OPCIONES</h3><div class="opts">
      <button data-act="persp">Perspectiva DS: <b>${o.perspective ? 'SÍ' : 'NO'}</b></button>
      <button data-act="speed">Velocidad del texto: <b>${['LENTA', 'NORMAL', 'RÁPIDA', 'INSTANTÁNEA'][o.textSpeed]}</b></button>
      <button data-act="hour">Hora del día: <b>${o.forceHour === undefined ? 'REAL' : o.forceHour === 12 ? 'SIEMPRE DÍA' : 'SIEMPRE NOCHE'}</b></button>
      <button data-act="full">Pantalla completa del navegador</button>
      <button data-act="title">Volver al título</button></div>
      <p class="hint">Teclado: flechas/WASD mover · Z/E/Enter = A · X/Shift = B (correr) · Esc/M = menú</p>
      <button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel', onBack: () => this.home(true), onAct: async a => {
      if (a === 'persp') { o.perspective = !o.perspective; this.game.applyOptions(); }
      if (a === 'speed') { o.textSpeed = (o.textSpeed + 1) % 4; this.game.applyOptions(); }
      if (a === 'hour') { o.forceHour = o.forceHour === undefined ? 12 : o.forceHour === 12 ? 22 : undefined; }
      if (a === 'full') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* no permitido */ } }
      if (a === 'title') { const i = await ui.ask('¿Volver al título? Lo que no hayas guardado se perderá.', ['Sí', 'No']); if (i === 0) return this.game.toTitle(); }
      this.options();
    } });
  }

  // ---------- Tienda ----------
  shop(tier = 1) {
    return new Promise(resolve => {
      const st = this.st, stock = SHOP_STOCK[tier] || SHOP_STOCK[1];
      const list = () => ui.setPanel(`<h3 class="ph">TIENDA <small>Tienes $${st.money}</small></h3><div class="ilist">${stock.map(id => `<button data-act="${id}"><b>${esc(ITEMS[id].name)}</b><span>$${ITEMS[id].price}</span><small>En mochila: ${st.bag[id] || 0}</small></button>`).join('')}</div><button class="bt-back" data-back>SALIR</button>`,
        { modal: true, cls: 'list-panel', onAct: id => qty(id, 1), onBack: () => { ui.closePanel(); resolve(); } });
      const qty = (id, n) => {
        const it = ITEMS[id], max = Math.max(1, Math.min(99, Math.floor(st.money / it.price)));
        n = Math.max(1, Math.min(max, n));
        ui.show(`${it.name}: ${it.desc}`);
        ui.setPanel(`<h3 class="ph">${esc(it.name)} <small>Tienes $${st.money}</small></h3>
          <div class="qty"><button data-act="minus">−</button><b>x${n}</b><button data-act="plus">+</button></div>
          <p class="total">Total: $${it.price * n}</p>
          <div class="row2"><button data-act="buy" class="primary">COMPRAR</button><button class="bt-back" data-back>VOLVER</button></div>`,
        { modal: true, cls: 'list-panel', focus: 2, onBack: () => { ui.hideMsg(); list(); }, onAct: async a => {
          if (a === 'minus') return qty(id, n - 1);
          if (a === 'plus') return qty(id, n + 1);
          if (st.money < it.price * n) { await ui.say(['No te alcanza el dinero.']); return list(); }
          st.money -= it.price * n;
          st.bag[id] = (st.bag[id] || 0) + n;
          await ui.say([`¡Compraste ${n} ${it.name}${n > 1 ? 's' : ''} por $${it.price * n}!`]);
          if (id === 'capsula' && n >= 10) { st.bag.capsula++; await ui.say(['¡Te regalamos una Cápsula extra por tu compra!']); }
          list();
        } });
      };
      list();
    });
  }

  // ---------- Viaje rápido ----------
  travel(places) {
    return new Promise(resolve => {
      ui.setPanel(`<h3 class="ph">VIAJE RÁPIDO</h3><div class="ilist">${places.map((p, i) => `<button data-act="${i}"><b>${esc(p.name)}</b></button>`).join('')}</div><button class="bt-back" data-back>CANCELAR</button>`,
        { modal: true, cls: 'list-panel', onAct: i => { ui.closePanel(); resolve(+i); }, onBack: () => { ui.closePanel(); resolve(-1); } });
    });
  }

  // ---------- Elección de inicial ----------
  starter() {
    return new Promise(resolve => {
      const pick = () => {
        ui.show('Dentro del maletín hay tres Cápsulas. ¿Cuál vas a abrir?');
        ui.setPanel(`<div class="starters">${STARTERS.map(sp => `<button data-act="${sp}"><img src="${iconURL(sp)}" alt=""><b>${esc(SPECIES[sp].name)}</b>${typeTags(sp)}</button>`).join('')}</div>`,
          { modal: true, cls: 'starter-panel', onAct: async sp => {
            ui.panel = null;
            await ui.say([SPECIES[sp].desc]);
            const i = await ui.ask(`¿Eliges a ${SPECIES[sp].name}, de tipo ${TYPES[SPECIES[sp].types[0]].name}?`, ['¡Sí, este!', 'Mejor otro']);
            if (i === 0) resolve(sp); else pick();
          } });
      };
      pick();
    });
  }

  // ---------- Título ----------
  title(hasSave) {
    return new Promise(resolve => {
      ui.setPanel(`<div class="title-menu">
        ${hasSave ? '<button data-act="continue" class="primary">CONTINUAR</button>' : ''}
        <button data-act="new">NUEVA PARTIDA</button>
        <p class="hint">Juego original sin ROM · guardado local en tu navegador</p></div>`,
      { modal: true, cls: 'title-panel', onAct: a => {
        if (a === 'continue') return resolve({ type: 'continue' });
        ui.setPanel(`<div class="name-entry"><label for="pname">¿Cómo te llamas?</label><input id="pname" maxlength="10" value="Santi" autocomplete="off"><button data-act="ok" class="primary">EMPEZAR</button></div>`,
          { modal: true, cls: 'title-panel', onAct: () => {
            const name = (document.getElementById('pname').value || 'Santi').trim().slice(0, 10) || 'Santi';
            resolve({ type: 'new', name });
          } });
        setTimeout(() => { const el = document.getElementById('pname'); el.focus(); el.select(); el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ui.panel.els[0].click(); } }); }, 30);
      } });
    });
  }
}
