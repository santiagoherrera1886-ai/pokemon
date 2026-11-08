// Paneles de la pantalla inferior fuera del combate: menú principal, equipo, mochila por bolsillos,
// guardado, opciones, tienda (comprar, vender, mostrador especial, máquina expendedora), elección de inicial y título.
import { ui, esc, money } from './ui.js';
import { iconURL } from '../art/creatures.js';
import { itemIcon } from '../art/items.js';
import { SPECIES, MOVES, TYPES, STARTERS, expForLevel } from '../data/creatures.js';
import { ITEMS, POCKETS, POCKET_ORDER, SPECIAL, VENDING, STAT_NAMES, SEED_MAX, generalStock, lockedStock, shortDesc, sellPrice, pocketItems, canUseOn, useOnCreature, isCapsule } from '../data/items.js';
import { saveState } from '../core/state.js';

const hpBar = c => { const k = Math.max(0, c.hp / c.stats.hp); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
const typeTags = sp => SPECIES[sp].types.map(t => `<span class="type" style="--t:${TYPES[t].color}">${TYPES[t].name}</span>`).join('');
const ico = (id, cls = 'ico') => `<img class="${cls}" src="${itemIcon(id)}" alt="">`;
const POCKET_HINTS = {
  capsulas: 'Cápsulas: se lanzan en combate para atrapar criaturas salvajes.',
  medicinas: 'Medicinas: curan PS, reaniman y recuperan PP. Sirven en combate y fuera de él.',
  batalla: 'Batalla: Pócimas que ayudan a tu criatura durante un combate.',
  campo: 'Campo: objetos para explorar: repelentes, silbato y miel.',
  cuidado: 'Cuidado: mejoras permanentes para tus criaturas.'
};

export class Menus {
  constructor(game) { this.game = game; }
  get st() { return this.game.state; }
  // Imagen de la criatura: retrato 3D en modo 3D, pixel art en modo clásico.
  pic(sp) { const p = this.game.graphics?.portrait(sp); return p ? `<img class="pt" src="${p}" alt="">` : `<img src="${iconURL(sp)}" alt="">`; }

  // La pantalla inferior muestra los objetivos; Esc y MENÚ abren la versión modal.
  home(modal = false) {
    if (!modal) { if (!ui.panel || !ui.panel.modal) ui.closePanel(); return; }
    const st = this.st, map = this.game.ow?.map;
    const goals = ['Baja a hablar con mamá', 'Ve a la casa de Nico (techo azul)', 'Ve al Lago Espejo (Sendero 1, al oeste)', 'Vuelve a casa', 'Ve al laboratorio de Villa Arenal',
      'Sigue la Ruta 2 hacia Ciudad Corola', 'Gana la Medalla Hoja en el gimnasio de Corola', 'Cruza la Cueva Eco hasta Pueblo Cobre y gana la Medalla Roca', 'Baja por la Ruta 4 hasta Ciudad Marea y gana la Medalla Marea',
      'Detén al Equipo Eclipse en su bodega de Ciudad Marea', 'Corre al Lago Espejo: el Equipo Eclipse va por la guardiana', 'Sube por la Ruta 5 (norte de Corola) hasta la Liga Alborada', 'Eres campeón. Explora y completa tu registro'];
    const BADGES = [['hoja', '#5cb04c'], ['roca', '#b8a058'], ['marea', '#3e98dc']];
    const dex = Object.values(st.dex || {});
    ui.setPanel(`<div class="home">
      <div class="home-head"><span>${esc(map ? map.name : '')}</span><span>${money(st.money)}</span></div>
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
    ui.setPanel(`<h3 class="ph">EQUIPO</h3><div class="plist">${st.party.length ? st.party.map((c, i) => `<button data-act="${i}">${this.pic(c.sp)}<span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level}</small></span>${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></button>`).join('') : '<p class="empty">Todavía no tienes criaturas.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onAct: i => this.creature(+i), onBack: () => this.home(true) });
  }
  creature(i) {
    const c = this.st.party[i], s = SPECIES[c.sp];
    const toNext = expForLevel(c.level + 1) - c.exp;
    const bonus = Object.entries(c.bonus || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(' · ');
    ui.setPanel(`<div class="detail">${this.pic(c.sp)}<div><b>${esc(c.name)}</b> <small>Nv${c.level}</small><div>${typeTags(c.sp)}</div></div></div>
      <p class="desc">${esc(s.desc)}</p>
      <div class="stats"><span>PS ${Math.ceil(c.hp)}/${c.stats.hp}</span><span>ATQ ${c.stats.atk}</span><span>DEF ${c.stats.def}</span><span>VEL ${c.stats.spe}</span><span>Sig. nivel: ${toNext} exp</span>${bonus ? `<span>Semillas: ${bonus}</span>` : ''}</div>
      <div class="moves">${c.moves.map(m => `<span style="--t:${TYPES[MOVES[m.id].type].color}">${esc(MOVES[m.id].name)} <small>PP ${m.pp}/${MOVES[m.id].pp}</small></span>`).join('')}</div>
      <div class="row2">${i > 0 ? `<button data-act="lead">PONER PRIMERO</button>` : ''}<button class="bt-back" data-back>VOLVER</button></div>`,
    { modal: true, cls: 'list-panel', onAct: a => { if (a === 'lead') { const [x] = this.st.party.splice(i, 1); this.st.party.unshift(x); this.party(); } }, onBack: () => this.party() });
  }

  // ---------- Mochila ----------
  bag(pocket) {
    const st = this.st;
    pocket = pocket || this.pocket || POCKET_ORDER.find(p => pocketItems(st.bag, p).length) || 'capsulas';
    this.pocket = pocket;
    const ids = pocketItems(st.bag, pocket);
    const count = p => pocketItems(st.bag, p).reduce((a, id) => a + st.bag[id], 0);
    const tabs = POCKET_ORDER.map(p => `<button data-act="tab:${p}" class="tab${p === pocket ? ' on' : ''}" style="--c:${POCKETS[p].color}">${POCKETS[p].name}<small>${count(p)}</small></button>`).join('');
    const repel = st.repel > 0 ? `<p class="hint">${esc(ITEMS[st.repelItem || 'repelente'].name)} activo: quedan ${st.repel} pasos.</p>` : '';
    ui.setPanel(`<h3 class="ph">MOCHILA <small>${money(st.money)}</small></h3><div class="tabs">${tabs}</div>
      <div class="ilist items">${ids.length ? ids.map(id => `<button data-act="${id}" class="it">${ico(id)}<span class="it-n"><b>${esc(ITEMS[id].name)}</b><small>${esc(shortDesc(id))}</small></span><span class="it-q">x${st.bag[id]}</span></button>`).join('') : '<p class="empty">Este bolsillo está vacío.</p>'}</div>
      ${repel}<button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel bag-panel', focus: ids.length ? POCKET_ORDER.length : POCKET_ORDER.indexOf(pocket),
      onFocus: el => { const a = el.dataset.act; if (ITEMS[a]) ui.show(`${ITEMS[a].name}: ${ITEMS[a].desc}`); else if (a.startsWith('tab:')) ui.show(POCKET_HINTS[a.slice(4)]); },
      onAct: a => a.startsWith('tab:') ? this.bag(a.slice(4)) : this.useItem(a),
      onBack: () => { ui.hideMsg(); this.home(true); } });
  }
  async useItem(id) {
    const it = ITEMS[id], st = this.st, game = this.game;
    const back = () => this.bag(it.pocket);
    if (isCapsule(id)) { await ui.say(['Las Cápsulas se lanzan en combate contra criaturas salvajes.']); return back(); }
    if (it.boost) { await ui.say(['Las Pócimas sólo sirven durante un combate.']); return back(); }
    if (it.repel) {
      if (st.repel > 0) { await ui.say([`Todavía queda efecto de ${ITEMS[st.repelItem || 'repelente'].name} (${st.repel} pasos).`]); return back(); }
      st.bag[id]--; st.repel = it.repel; st.repelItem = id;
      await ui.say([`Usaste ${it.name}. Las criaturas salvajes débiles no se acercarán en ${it.repel} pasos.`]);
      return back();
    }
    if (it.escape) {
      const i = await ui.ask(`¿Usar el ${it.name} para volver a la última Posada?`, ['Sí', 'No']);
      if (i !== 0) return back();
      st.bag[id]--; ui.closePanel(); ui.hideMsg();
      return game.whistle();
    }
    if (it.lure) {
      if (!game.canLure()) { await ui.say(['Aquí no hay criaturas salvajes que la huelan.', 'Úsala parado en el pasto alto o dentro de una cueva.']); return back(); }
      st.bag[id]--; ui.closePanel(); ui.hideMsg();
      return game.lure();
    }
    if (!st.party.length) { await ui.say(['No tienes criaturas.']); return back(); }
    this.target(id);
  }
  // Elegir sobre qué criatura usar una medicina, una semilla o un dulce.
  target(id) {
    const it = ITEMS[id], st = this.st;
    const extra = c => it.pp ? ` · PP ${c.moves.reduce((a, m) => a + m.pp, 0)}/${c.moves.reduce((a, m) => a + MOVES[m.id].pp, 0)}`
      : it.seed ? ` · ${it.seed.toUpperCase()} +${c.bonus?.[it.seed] || 0}/${SEED_MAX}` : '';
    ui.show(`¿En quién vas a usar ${it.name}?`);
    ui.setPanel(`<h3 class="ph">${ico(id, 'ico sm')} ${esc(it.name)} <small>x${st.bag[id] || 0}</small></h3><div class="plist">${st.party.map((c, i) => `<button data-act="${i}" class="${canUseOn(id, c) ? '' : 'dim'}">${this.pic(c.sp)}<span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level}${extra(c)}</small></span>${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></button>`).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onBack: () => this.bag(it.pocket), onAct: async a => {
        const c = st.party[+a];
        const res = useOnCreature(id, c);
        if (!res.ok) { await ui.say([res.msg]); return this.target(id); }
        st.bag[id]--;
        if (res.levelUp) {
          const ow = this.game.ow; ow.scripts++;
          try {
            ui.closePanel();
            await ui.say([res.msg]);
            await this.game.learnMoves(c, c.level);
            await this.game.checkEvolutions();
          } finally { ow.scripts--; }
        } else await ui.say([res.msg]);
        st.bag[id] > 0 ? this.target(id) : this.bag(it.pocket);
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
    const o = this.st.options, graphics = this.game.graphics;
    ui.setPanel(`<h3 class="ph">OPCIONES</h3><div class="opts">
      <button data-act="graphics">Gráficos: <b>${graphics.mode === 'premium' ? '3D' : 'PIXEL CLÁSICO'}</b></button>
      <button data-act="quality">Calidad 3D: <b>${({low:'BAJA',medium:'MEDIA',high:'ALTA'})[graphics.quality]}</b></button>
      <button data-act="persp">Perspectiva (pixel clásico): <b>${o.perspective ? 'SÍ' : 'NO'}</b></button>
      <button data-act="speed">Velocidad del texto: <b>${['LENTA', 'NORMAL', 'RÁPIDA', 'INSTANTÁNEA'][o.textSpeed]}</b></button>
      <button data-act="hour">Hora del día: <b>${o.forceHour === undefined ? 'REAL' : o.forceHour === 12 ? 'SIEMPRE DÍA' : 'SIEMPRE NOCHE'}</b></button>
      <button data-act="full">Pantalla completa del navegador</button>
      <button data-act="title">Volver al título</button></div>
      <p class="hint">Teclado: flechas/WASD mover · Z/E/Enter = A · X/Shift = B (correr) · Esc/M = menú</p>
      <button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel graphics-options', onBack: () => this.home(true), onAct: async a => {
      if (a === 'graphics') { await graphics.setMode(graphics.mode === 'premium' ? 'classic' : 'premium'); }
      if (a === 'quality') { const levels = ['low','medium','high']; graphics.setQuality(levels[(levels.indexOf(graphics.quality)+1)%3]); }
      if (a === 'persp') { o.perspective = !o.perspective; this.game.applyOptions(); }
      if (a === 'speed') { o.textSpeed = (o.textSpeed + 1) % 4; this.game.applyOptions(); }
      if (a === 'hour') { o.forceHour = o.forceHour === undefined ? 12 : o.forceHour === 12 ? 22 : undefined; }
      if (a === 'full') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* no permitido */ } }
      if (a === 'title') { const i = await ui.ask('¿Volver al título? Lo que no hayas guardado se perderá.', ['Sí', 'No']); if (i === 0) return this.game.toTitle(); }
      this.options();
    } });
  }

  // ---------- Tienda ----------
  // kind: 'general' (mostrador por medallas), 'special' (mostrador de la ciudad), 'vending' (máquina) o 'sell' (vender).
  shop({ kind = 'general', town = 'arenal', title = 'TIENDA' } = {}) {
    return new Promise(resolve => {
      const st = this.st, sell = kind === 'sell', vending = kind === 'vending';
      const greeting = sell ? '¿Qué quieres vender? Te pago la mitad de lo que cuesta.' : vending ? 'Una máquina expendedora llena de bebidas frías.' : kind === 'special' ? `${SPECIAL[town].name}: cosas que no encuentras en otra tienda.` : '¡Mira todo lo que tenemos!';
      const stock = () => sell ? POCKET_ORDER.flatMap(p => pocketItems(st.bag, p)) : vending ? VENDING : kind === 'special' ? SPECIAL[town].items : generalStock(st);
      const unit = id => sell ? sellPrice(id) : ITEMS[id].price;
      const exit = () => { ui.closePanel(); ui.hideMsg(); resolve(); };

      const list = focusId => {
        const ids = stock();
        // En el mostrador general también se ve lo que llega con más medallas (bloqueado).
        const locked = kind === 'general' ? Object.fromEntries(lockedStock(st)) : {};
        const all = [...ids, ...Object.keys(locked)];
        const groups = POCKET_ORDER.map(p => [p, all.filter(id => ITEMS[id].pocket === p)]).filter(([, l]) => l.length);
        const chips = groups.length >= 3 ? `<div class="chips">${groups.map(([p]) => `<button class="chip" data-act="go:${p}" style="--c:${POCKETS[p].color}">${POCKETS[p].name}</button>`).join('')}</div>` : '';
        const row = id => locked[id] ? `<button data-act="lock:${id}" class="it dim">${ico(id)}<span class="it-n"><b>${esc(ITEMS[id].name)}</b><small>Llega con ${locked[id]} medalla${locked[id] > 1 ? 's' : ''}</small></span><span class="it-p lock">${money(unit(id))}</span></button>`
          : `<button data-act="${id}" class="it">${ico(id)}<span class="it-n"><b>${esc(ITEMS[id].name)}</b><small>${esc(shortDesc(id))} · tienes ${st.bag[id] || 0}</small></span><span class="it-p">${money(unit(id))}</span></button>`;
        ui.setPanel(`<h3 class="ph">${esc(title.toUpperCase())} <small>Tienes ${money(st.money)}</small></h3>${chips}
          <div class="ilist items shop-list">${groups.length ? groups.map(([p, l]) => `<div class="sec" data-sec="${p}" style="--c:${POCKETS[p].color}"><i></i>${POCKETS[p].name}</div>${l.map(row).join('')}`).join('') : `<p class="empty">${sell ? 'No tienes nada para vender.' : 'No hay productos.'}</p>`}</div>
          <button class="bt-back" data-back>SALIR</button>`,
        { modal: true, cls: 'list-panel shop-panel' + (vending ? ' vending' : ''), focus: chips ? groups.length : 0,
          onFocus: el => { const a = el.dataset.act.replace('lock:', ''); ui.show(ITEMS[a] ? `${ITEMS[a].name}: ${ITEMS[a].desc}` : greeting); },
          onAct: a => {
            if (a.startsWith('lock:')) { const id = a.slice(5); ui.say([`${ITEMS[id].name} llega a la tienda cuando tengas ${locked[id]} medalla${locked[id] > 1 ? 's' : ''}.`]).then(() => list(a)); return; }
            if (a.startsWith('go:')) { const sec = ui.bottom.querySelector(`[data-sec="${a.slice(3)}"]`); const first = sec?.nextElementSibling; if (first) ui.focusAct(first.dataset.act); if (sec) ui.reveal(sec, 'start'); return; }
            if (!sell && st.money < unit(a)) { ui.say(['No te alcanza la plata para eso.']).then(() => list(a)); return; }
            qty(a, 1);
          },
          onBack: exit });
        if (focusId && ids.includes(focusId)) ui.focusAct(focusId);
      };

      const qty = (id, n) => {
        const it = ITEMS[id], price = unit(id);
        const max = sell ? (st.bag[id] || 0) : Math.max(1, Math.min(99, Math.floor(st.money / price)));
        n = Math.max(1, Math.min(max, n));
        ui.show(`${it.name}: ${it.desc}`);
        ui.setPanel(`<div class="buy-head">${ico(id, 'ico big')}<div><b>${esc(it.name)}</b><small>${sell ? `Tienes ${st.bag[id]} · Te pagan ${money(price)} c/u` : `En mochila: ${st.bag[id] || 0} · ${money(price)} c/u`}</small></div></div>
          <div class="qty"><button data-act="minus10">−10</button><button data-act="minus">−</button><b>x${n}</b><button data-act="plus">+</button><button data-act="plus10">+10</button></div>
          <p class="total">${sell ? 'Recibes' : 'Total'}: <b>${money(price * n)}</b> <small>· ${sell ? 'quedarías con' : 'te quedan'} ${money(sell ? st.money + price * n : st.money - price * n)}</small></p>
          <div class="row2"><button data-act="buy" class="primary">${sell ? 'VENDER' : 'COMPRAR'}</button><button class="bt-back" data-back>VOLVER</button></div>`,
        { modal: true, cls: 'list-panel shop-panel', onBack: () => list(id), onAct: async a => {
          if (a === 'minus') return qty(id, n - 1);
          if (a === 'plus') return qty(id, n + 1);
          if (a === 'minus10') return qty(id, n - 10);
          if (a === 'plus10') return qty(id, n + 10);
          const total = price * n;
          if (sell) {
            st.bag[id] -= n; st.money += total;
            await ui.say([`Vendiste ${it.name} x${n} por ${money(total)}.`]);
            return list(st.bag[id] > 0 ? id : null);
          }
          if (st.money < total) { await ui.say(['No te alcanza la plata.']); return list(id); }
          st.money -= total;
          st.bag[id] = (st.bag[id] || 0) + n;
          await ui.say([vending ? (n > 1 ? `¡Clonc, clonc! Cayeron ${n} bebidas: ${it.name} x${n}.` : `¡Clonc! Cayó tu ${it.name}.`) : `¡Listo! Compraste ${it.name} x${n} por ${money(total)}.`]);
          if (isCapsule(id) && n >= 10) { st.bag.capsulaAlba = (st.bag.capsulaAlba || 0) + 1; await ui.say(['¡Por llevar tantas, te regalamos una Cápsula Alba de la casa!']); }
          list(id);
        } });
        ui.focusAct('buy');
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
        ui.setPanel(`<div class="starters">${STARTERS.map(sp => `<button data-act="${sp}">${this.pic(sp)}<b>${esc(SPECIES[sp].name)}</b>${typeTags(sp)}</button>`).join('')}</div>`,
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
        setTimeout(() => { const el = document.getElementById('pname'); if (!el) return; el.focus(); el.select(); el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ui.panel.els[0].click(); } }); }, 30);
      } });
    });
  }
}
