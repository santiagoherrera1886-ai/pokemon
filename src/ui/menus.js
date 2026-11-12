// Paneles de la pantalla inferior fuera del combate: menú principal, equipo, mochila por bolsillos,
// guardado, opciones, tienda (comprar, vender, mostrador especial, máquina expendedora), elección de inicial y título.
import { ui, esc, money, statusChip } from './ui.js';
import { iconURL } from '../art/creatures.js';
import { itemIcon } from '../art/items.js';
import { SPECIES, MOVES, TYPES, STARTERS, expForLevel, ENCOUNTERS } from '../data/creatures.js';
import { GYMS, nextGym, badgeCount, LEAGUE_BADGES } from '../data/gyms.js';
import { regionMapHTML, drawRegionMap } from './regionmap.js';
import { isHeld, giveHeld, takeHeld } from '../data/held.js';
import { CHEATS, tryCode, spend, cheatOn } from '../data/cheats.js';
import { ITEMS, POCKETS, POCKET_ORDER, SPECIAL, VENDING, STAT_NAMES, SEED_MAX, generalStock, lockedStock, shortDesc, sellPrice, pocketItems, canUseOn, useOnCreature, isCapsule } from '../data/items.js';
import { saveState, listSaves, SLOTS, loadState, storeState, parseState, playTimeText } from '../core/state.js';
import { cloud, TOKEN_URL } from '../core/cloud.js';
import { AVATAR_OPTIONS, defaultAvatar, cleanAvatar, avatarLook } from '../data/avatar.js';
import { lookFrame } from '../art/characters.js';

const hpBar = c => { const k = Math.max(0, c.hp / c.stats.hp); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
const typeTags = sp => SPECIES[sp].types.map(t => `<span class="type" style="--t:${TYPES[t].color}">${TYPES[t].name}</span>`).join('');
const ico = (id, cls = 'ico') => `<img class="${cls}" src="${itemIcon(id)}" alt="">`;
// Íconos del menú principal (SVG en línea, se pintan con el color del botón).
const SVG = {
  party: '<svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10" rx="5" fill="#e65a4a"/><path d="M12 7h4.5a5 5 0 0 1 0 10H12z" fill="#fbf1da"/><rect x="11.2" y="7" width="1.6" height="10" fill="#26222e"/><circle cx="12" cy="12" r="2" fill="#fff" stroke="#26222e" stroke-width="1.2"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M8 7V5.5a4 4 0 0 1 8 0V7" fill="none" stroke="#7a4a1a" stroke-width="2"/><rect x="4" y="7" width="16" height="14" rx="4" fill="#f0a838"/><rect x="7" y="13" width="10" height="6" rx="2" fill="#d4861c"/><rect x="11" y="12" width="2" height="3" rx="1" fill="#7a4a1a"/></svg>',
  dex: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3" fill="#3e8ad8"/><rect x="7" y="6" width="10" height="7" rx="2" fill="#dff0ff"/><circle cx="12" cy="9.5" r="2.2" fill="#3e8ad8"/><rect x="7" y="15.5" width="10" height="1.6" rx=".8" fill="#dff0ff"/><rect x="7" y="18" width="6" height="1.6" rx=".8" fill="#dff0ff"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3" fill="#3faa70"/><circle cx="8" cy="11" r="2.6" fill="#fff4d8"/><path d="M4.5 17a3.5 3.5 0 0 1 7 0" fill="#fff4d8"/><rect x="13" y="9" width="6" height="1.6" rx=".8" fill="#fff"/><rect x="13" y="12.5" width="5" height="1.6" rx=".8" fill="#fff"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#4a6ad8"/><rect x="7" y="3" width="8" height="6" rx="1" fill="#dfe8ff"/><rect x="6" y="13" width="12" height="6" rx="1.4" fill="#dfe8ff"/></svg>',
  options: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2 2.6 3.2-.6.6 3.2 2.6 2-1.6 2.8 1.6 2.8-2.6 2-.6 3.2-3.2-.6-2 2.6-2-2.6-3.2.6-.6-3.2-2.6-2 1.6-2.8L3.6 9.7l2.6-2 .6-3.2 3.2.6z" fill="#7a7f98"/><circle cx="12" cy="12" r="3.4" fill="#eef0f6"/></svg>'
};
// Dónde vive cada especie (encuentros de las rutas, de día o de noche) y las leyendas.
const PLACE = { sendero1: 'Sendero 1', lago: 'Lago Espejo', ruta2: 'Ruta 2', ruta3: 'Ruta 3', cueva: 'Cueva Eco', ruta4: 'Ruta 4', ruta5: 'Ruta 5', ruta6: 'Ruta 6', ruta7: 'Ruta 7', ruta8: 'Ruta 8', ruta9: 'Ruta 9', ruta10: 'Ruta 10', ruta11: 'Ruta 11', ruta12: 'Ruta 12', ruta13: 'Ruta 13', ruta14: 'Ruta 14', ruta15: 'Desierto Tatacoa', volcan: 'Cerro Fragua', ruta16: 'Ruta 16', ruta17: 'Glaciar', pico: 'Pico Cóndor', ruta18: 'Ruta 18', ruta19: 'Banco de arena', ruta20: 'Ruta 20', ruinas: 'Ruinas del Alba', ruta21: 'Ruta 21', ruta22: 'Ruta 22', ruta23: 'Ruta 23', ruta24: 'Ruta 24', ruta25: 'Ruta 25', manglar: 'Manglar', isla: 'Isla Totuma' };
const LEGEND_PLACE = { espejalba: 'Lago Espejo (historia)', brumalia: 'Ruta 2 de noche, después de la Liga', fraguon: 'Cueva Eco, después de la Liga', glaciel: 'Ruta 5, después de la Liga', dracalba: 'Lago Espejo, con las tres leyendas atrapadas' };
// Objetivo después del Lago Espejo: el siguiente de los ocho gimnasios, o la Liga cuando ya están todas.
function goalAfterLake(st) {
  const g = nextGym(st), n = badgeCount(st);
  if (!g) return 'Tienes las ocho medallas: baja por la Ruta 11 (o sube por la Ruta 5, al norte de Corola) hasta la Liga Alborada';
  const here = st.map === g.map || st.map === 'gym' + (GYMS.indexOf(g) + 1);
  if (here) return `Medalla ${n + 1} de ${LEAGUE_BADGES}: entra al gimnasio de ${g.city} y gánale a ${g.who}`;
  const way = { chispa: 'sal de Ciudad Marea por la Ruta 6, al este', sombra: 'sube por la Ruta 7 hasta Pueblo Niebla', puno: 'sube por los cafetales de la Ruta 8', escarcha: 'cruza el paso nevado de la Ruta 9, al oeste de Cafetal', escama: 'baja por el camino antiguo de la Ruta 10' }[g.badge];
  return `Medalla ${n + 1} de ${LEAGUE_BADGES}: ${way ? way + ' y gana' : 'gana'} la Medalla ${g.name} en ${g.city}`;
}
function habitat(sp) {
  if (LEGEND_PLACE[sp]) return LEGEND_PLACE[sp];
  const out = [];
  for (const [k, t] of Object.entries(ENCOUNTERS)) for (const e of t.list) if (e[0] === sp) out.push(`${PLACE[k] || k}${e[4] === 'noche' ? ' (de noche)' : ''}`);
  return out.length ? [...new Set(out)].join(' · ') : 'Evoluciona de otra criatura o te la dan en la historia.';
}
// Línea evolutiva completa (desde la primera etapa) con el nivel de cada salto.
function evoLine(sp) {
  let first = sp, guard = 0;
  while (guard++ < 5) { const prev = Object.keys(SPECIES).find(k => SPECIES[k].evo?.[0] === first); if (!prev) break; first = prev; }
  const line = [[first, null]];
  let cur = first; guard = 0;
  while (SPECIES[cur].evo && guard++ < 5) { line.push([SPECIES[cur].evo[0], SPECIES[cur].evo[1]]); cur = SPECIES[cur].evo[0]; }
  return line;
}
const DEX_ORDER = Object.keys(SPECIES);
const STAT_ROWS = [['hp', 'PS', '#5ac85a'], ['atk', 'ATQ', '#e8743a'], ['def', 'DEF', '#e8c040'], ['spe', 'VEL', '#4aa8e8']];
const statBars = (vals, max = 200) => `<div class="sbars">${STAT_ROWS.map(([k, n, col]) => `<div class="sbar"><span>${n}</span><b>${vals[k]}</b><i><u style="width:${Math.min(100, vals[k] / max * 100)}%;background:${col}"></u></i></div>`).join('')}</div>`;

const POCKET_HINTS = {
  capsulas: 'Cápsulas: se lanzan en combate para atrapar criaturas salvajes.',
  medicinas: 'Medicinas: curan PS, reaniman y recuperan PP. Sirven en combate y fuera de él.',
  batalla: 'Batalla: Pócimas que ayudan a tu criatura durante un combate.',
  campo: 'Campo: objetos para explorar: repelentes, silbato y miel.',
  cuidado: 'Cuidado: mejoras permanentes para tus criaturas.',
  equipo: 'Equipables: se le dan a una criatura y actúan solos en combate (uno por criatura).',
  clave: 'Clave: objetos importantes. No se gastan ni se venden.'
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
      'Detén al Equipo Eclipse en su bodega de Ciudad Marea', 'Corre al Lago Espejo: el Equipo Eclipse va por la guardiana', goalAfterLake(st), 'Eres campeón. Busca a las leyendas de la Bruma y completa tu registro'];
    const dex = Object.values(st.dex || {}), caught = dex.filter(v => v === 2).length;
    const items = Object.values(st.bag || {}).reduce((a, n) => a + (n > 0 ? n : 0), 0);
    ui.setPanel(`<div class="home">
      <div class="home-top"><img class="home-av" src="${this.avatarThumb(st.avatar, 4)}" alt=""><div class="home-id"><b>${esc(st.name)}</b><small>${esc(map ? map.name : '')} · ${playTimeText(st.playTime)}</small></div><div class="home-money">${money(st.money)}</div></div>
      <div class="goal"><button data-act="map" class="goal-map">VER MAPA</button><small>OBJETIVO</small>${esc(goals[Math.min(goals.length - 1, st.story)])}</div>
      <div class="badges">${GYMS.map(g => `<i class="${(st.badges || []).includes(g.badge) ? 'on' : ''}" style="--c:${g.color}" title="Medalla ${esc(g.name)}"></i>`).join('')}<span>Registro: ${caught} atrapadas · ${dex.length} vistas</span></div>
      <div class="home-grid">
        <button data-act="party" class="hb hb-party">${SVG.party}<b>EQUIPO</b><small>${st.party.length}/6</small></button>
        <button data-act="bag" class="hb hb-bag">${SVG.bag}<b>MOCHILA</b><small>${items} objetos</small></button>
        <button data-act="dex" class="hb hb-dex">${SVG.dex}<b>REGISTRO</b><small>${caught}/${DEX_ORDER.length}</small></button>
        <button data-act="card" class="hb hb-card">${SVG.card}<b>TARJETA</b><small>${(st.badges || []).length} medallas</small></button>
        <button data-act="save" class="hb hb-save">${SVG.save}<b>GUARDAR</b><small>Ranura ${st.slot || 1}</small></button>
        <button data-act="options" class="hb hb-opt">${SVG.options}<b>OPCIONES</b><small>Gráficos y más</small></button>
      </div>
      <button class="bt-back" data-back>CERRAR</button></div>`,
    { modal: true, cls: 'home-panel', focus: 1, onAct: a => this.open(a), onBack: () => ui.closePanel() });   // el cursor arranca en EQUIPO
  }
  open(what) {
    ({ party: () => this.party(), bag: () => this.bag(), dex: () => this.dex(), card: () => this.card(), save: () => this.save(), options: () => this.options(), map: () => this.regionMap() })[what]();
  }

  // ---------- Mapa de la región ----------
  regionMap() {
    const world = this.game.world;
    ui.setPanel(`${regionMapHTML(world, this.st)}<button class="bt-back" data-back>VOLVER</button>`, { modal: true, cls: 'list-panel wide-panel map-panel', onBack: () => this.home(true) });
    drawRegionMap(document.getElementById('rmCanvas'), world, this.st);
  }

  // ---------- Equipo ----------
  party() {
    const st = this.st;
    const row = (c, i) => `<button data-act="${i}" class="pc${c.hp <= 0 ? ' ko' : ''}">${this.pic(c.sp)}<span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level} ${statusChip(c)}${c.item ? ico(c.item, 'ico held') : ''}</small><span class="tt">${typeTags(c.sp)}</span></span><span class="php">${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></span></button>`;
    ui.setPanel(`<h3 class="ph">EQUIPO <small>${st.party.length}/6</small></h3><div class="plist party-cards">${st.party.length ? st.party.map(row).join('') : '<p class="empty">Todavía no tienes criaturas.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel wide-panel', onAct: i => this.creature(+i), onBack: () => this.home(true) });
  }
  creature(i) {
    const st = this.st, c = st.party[i], s = SPECIES[c.sp];
    const lo = expForLevel(c.level), hi = expForLevel(c.level + 1), toNext = hi - c.exp;
    const bonus = Object.entries(c.bonus || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(' · ');
    const gear = Object.keys(st.bag).filter(id => st.bag[id] > 0 && isHeld(id));
    const held = c.item ? `<div class="heldbox">${ico(c.item)}<span><b>${esc(ITEMS[c.item].name)}</b><small>${esc(ITEMS[c.item].desc.replace(/^Equipad[oa]: /, ''))}</small></span></div>` : '<div class="heldbox empty">Sin objeto equipado</div>';
    ui.setPanel(`<div class="sum">
      <div class="sum-l">${this.pic(c.sp)}<b class="sum-n">${esc(c.name)} <small>Nv${c.level}</small></b><div>${typeTags(c.sp)} ${statusChip(c)}</div><p class="desc">${esc(s.desc)}</p></div>
      <div class="sum-r">${statBars({ hp: c.stats.hp, atk: c.stats.atk, def: c.stats.def, spe: c.stats.spe }, 220)}
        <div class="xpline"><span>PS ${Math.ceil(c.hp)}/${c.stats.hp}</span><span>Sig. nivel: ${toNext} exp</span></div><div class="xp"><i style="width:${Math.max(0, Math.min(100, (c.exp - lo) / (hi - lo) * 100))}%"></i></div>
        ${bonus ? `<p class="hint">Semillas: ${bonus}</p>` : ''}
        <div class="moves">${c.moves.map(m => { const M = MOVES[m.id]; return `<span style="--t:${TYPES[M.type].color}"><b>${esc(M.name)}</b><small>${TYPES[M.type].name}${M.power ? ' · ' + M.power : ''} · PP ${m.pp}/${M.pp}</small></span>`; }).join('')}</div>
        ${held}</div></div>
      <div class="row2">${cheatOn(st, 'level') && c.level < 100 ? '<button data-act="lvl1" class="evo-bt">SUBIR 1 NIVEL</button><button data-act="lvl10" class="evo-bt">SUBIR 10 NIVELES</button>' : ''}${cheatOn(st, 'evolve') && s.evo ? `<button data-act="evolve" class="evo-bt">EVOLUCIONAR A ${esc(SPECIES[s.evo[0]].name.toUpperCase())}</button>` : ''}${i > 0 ? '<button data-act="lead">PONER PRIMERO</button>' : ''}${gear.length ? `<button data-act="give">${c.item ? 'CAMBIAR OBJETO' : 'DAR OBJETO'}</button>` : ''}${c.item ? '<button data-act="take">QUITAR OBJETO</button>' : ''}<button class="bt-back" data-back>VOLVER</button></div>`,
    { modal: true, cls: 'list-panel wide-panel sum-panel', onAct: async a => {
      if (a === 'lead') { const [x] = st.party.splice(i, 1); st.party.unshift(x); return this.party(); }
      if (a === 'evolve' && s.evo) { ui.closePanel(); await this.game.evolve(c, s.evo[0]); return this.creature(i); }
      if ((a === 'lvl1' || a === 'lvl10') && cheatOn(st, 'level')) { ui.closePanel(); await this.game.levelUpBy(c, a === 'lvl1' ? 1 : 10); return this.creature(st.party.indexOf(c)); }
      if (a === 'take') { const r = takeHeld(st, c); await ui.say([r.msg]); return this.creature(i); }
      if (a === 'give') return this.pickHeld(i);
    }, onBack: () => this.party() });
  }
  // Lista de equipables de la mochila para dárselo a la criatura i.
  pickHeld(i) {
    const st = this.st, c = st.party[i], ids = Object.keys(st.bag).filter(id => st.bag[id] > 0 && isHeld(id));
    ui.show(`¿Qué le das a ${c.name}?`);
    ui.setPanel(`<h3 class="ph">EQUIPAR A ${esc(c.name.toUpperCase())}</h3><div class="ilist items">${ids.map(id => `<button data-act="${id}" class="it">${ico(id)}<span class="it-n"><b>${esc(ITEMS[id].name)}</b><small>${esc(shortDesc(id))}</small></span><span class="it-q">x${st.bag[id]}</span></button>`).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onFocus: el => { const it = ITEMS[el.dataset.act]; if (it) ui.show(`${it.name}: ${it.desc}`); }, onAct: async id => { const r = giveHeld(st, c, id); ui.hideMsg(); await ui.say([r.msg]); this.creature(i); }, onBack: () => { ui.hideMsg(); this.creature(i); } });
  }

  // ---------- Registro (todas las especies) ----------
  dex(focus = 0) {
    const st = this.st, seen = st.dex || {}, caught = Object.values(seen).filter(v => v === 2).length;
    const cell = (sp, n) => {
      const k = seen[sp] || 0, num = String(n + 1).padStart(3, '0');
      return `<button data-act="${sp}" class="dx${k ? '' : ' unseen'}${k === 2 ? ' got' : ''}"><small>${num}</small>${k ? `<img src="${iconURL(sp)}" alt="">` : '<i>?</i>'}<span>${k ? esc(SPECIES[sp].name) : '???'}</span></button>`;
    };
    ui.setPanel(`<h3 class="ph">REGISTRO <small>${caught} atrapadas · ${Object.keys(seen).length} vistas · ${DEX_ORDER.length} especies</small></h3><div class="dex-grid">${DEX_ORDER.map(cell).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel wide-panel dex-panel', focus, onAct: sp => this.dexEntry(sp), onBack: () => this.home(true),
        onFocus: el => { const sp = el.dataset.act; if (SPECIES[sp]) ui.show(seen[sp] ? `${SPECIES[sp].name}: ${seen[sp] === 2 ? 'atrapada' : 'vista'}.` : 'Todavía no la has visto.'); } });
  }
  dexEntry(sp) {
    const st = this.st, k = (st.dex || {})[sp] || 0, s = SPECIES[sp], n = DEX_ORDER.indexOf(sp);
    if (!k) { ui.show('Todavía no la has visto. Búscala en el pasto, las cuevas y de noche.'); return; }
    const line = evoLine(sp).map(([id, lv]) => { const known = (st.dex || {})[id]; return `${lv ? `<em>Nv${lv} →</em>` : ''}<span class="${id === sp ? 'cur' : ''}">${known ? `<img src="${iconURL(id)}" alt="">` : '<i>?</i>'}${known ? esc(SPECIES[id].name) : '???'}</span>`; }).join('');
    ui.hideMsg();
    ui.setPanel(`<div class="sum">
      <div class="sum-l">${this.pic(sp)}<b class="sum-n"><small>N.º ${String(n + 1).padStart(3, '0')}</small> ${esc(s.name)}</b><div>${typeTags(sp)}${s.legendary ? '<span class="type leg">LEYENDA</span>' : ''}</div><p class="desc">${esc(s.desc)}</p></div>
      <div class="sum-r"><h4>Estadísticas base</h4>${statBars(s.base, 130)}
        <h4>Dónde vive</h4><p class="hint">${esc(habitat(sp))}</p>
        <h4>Evolución</h4><div class="evo">${line}</div>
        <p class="hint">${k === 2 ? 'Atrapada · tiene Forma Alba' : 'Vista, todavía no atrapada'}</p></div></div>
      <button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel wide-panel sum-panel', onBack: () => this.dex(DEX_ORDER.indexOf(sp)) });
  }

  // ---------- Tarjeta de entrenador ----------
  card() {
    const st = this.st, dex = Object.values(st.dex || {});
    const portrait = this.game.graphics?.avatarPortrait?.(avatarLook(st.avatar));
    ui.setPanel(`<div class="tcard">
      <div class="tc-head"><span>TARJETA DE ENTRENADOR</span><span>PUCHAMON</span></div>
      <div class="tc-body">${portrait ? `<img class="tc-av3d" src="${portrait}" alt="">` : `<img class="tc-av" src="${this.avatarThumb(st.avatar, 6)}" alt="">`}
        <div class="tc-data"><b>${esc(st.name)}</b>
          <span>Dinero <em>${money(st.money)}</em></span><span>Tiempo de juego <em>${playTimeText(st.playTime)}</em></span>
          <span>Registro <em>${dex.filter(v => v === 2).length} atrapadas · ${dex.length} vistas</em></span>
          <span>Equipo <em>${st.party.map(c => esc(c.name)).join(', ') || '—'}</em></span></div></div>
      <div class="tc-badges">${GYMS.map(g => `<div class="${(st.badges || []).includes(g.badge) ? 'on' : ''}" style="--c:${g.color}"><i></i><small>${esc(g.name)}</small></div>`).join('')}${st.story >= 12 ? '<div class="on champ" style="--c:#f0c040"><i></i><small>Campeón</small></div>' : ''}</div>
      </div><button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel wide-panel', onBack: () => this.home(true) });
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
    if (it.key) { await ui.say([it.desc, 'Funciona con todas las criaturas, una vez por combate. La transformación dura hasta que termina la pelea.']); return back(); }
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
      : it.seed ? ` · ${it.seed.toUpperCase()} +${c.bonus?.[it.seed] || 0}/${SEED_MAX}` : it.held ? ` · ${c.item ? 'lleva ' + ITEMS[c.item].name : 'sin objeto'}` : '';
    ui.show(it.held ? `¿A quién le das ${it.name}?` : `¿En quién vas a usar ${it.name}?`);
    ui.setPanel(`<h3 class="ph">${ico(id, 'ico sm')} ${esc(it.name)} <small>x${st.bag[id] || 0}</small></h3><div class="plist">${st.party.map((c, i) => `<button data-act="${i}" class="${it.held || canUseOn(id, c) ? '' : 'dim'}">${this.pic(c.sp)}<span class="pn"><b>${esc(c.name)}</b><small>Nv${c.level} ${statusChip(c)}${extra(c)}</small></span>${hpBar(c)}<em>${Math.ceil(c.hp)}/${c.stats.hp}</em></button>`).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'list-panel', onBack: () => this.bag(it.pocket), onAct: async a => {
        const c = st.party[+a];
        if (it.held) { const r = giveHeld(st, c, id); await ui.say([r.msg]); return st.bag[id] > 0 ? this.target(id) : this.bag(it.pocket); }
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
      let msg = ok ? `${this.st.name} guardó la partida en la ranura ${this.st.slot}.` : 'No se pudo guardar (el navegador bloquea el almacenamiento).';
      if (ok && cloud.linked) { try { await cloud.push(); msg += ' También quedó en GitHub.'; } catch { msg += ' GitHub no respondió; se sube la próxima vez.'; } }
      await ui.say([msg]);
    }
    ui.closePanel();
  }

  options() {
    const o = this.st.options, graphics = this.game.graphics;
    ui.setPanel(`<h3 class="ph">OPCIONES</h3><div class="opts">
      <button data-act="graphics">Gráficos: <b>${graphics.mode === 'premium' ? '3D' : 'PIXEL CLÁSICO'}</b></button>
      <button data-act="quality">Calidad 3D: <b>${({low:'BAJA',medium:'MEDIA',high:'ALTA'})[graphics.quality]}</b></button>
      <button data-act="art">Estilo de arte: <b>${graphics.art === 'retro' ? 'RETRO 16-BIT' : 'HD'}</b></button>
      <button data-act="hero">Protagonista 3D: <b>${graphics.hero === 'glb' ? 'MODELO GLB (PRUEBA)' : 'ESCULPIDO'}</b></button>
      <button data-act="persp">Perspectiva (pixel clásico): <b>${o.perspective ? 'SÍ' : 'NO'}</b></button>
      <button data-act="speed">Velocidad del texto: <b>${['LENTA', 'NORMAL', 'RÁPIDA', 'INSTANTÁNEA'][o.textSpeed]}</b></button>
      <button data-act="hour">Hora del día: <b>${o.forceHour === undefined ? 'REAL' : o.forceHour === 12 ? 'SIEMPRE DÍA' : 'SIEMPRE NOCHE'}</b></button>
      <button data-act="avatar">Mi avatar</button>
      <button data-act="autosave">Guardado automático: <b>${o.autosave === false ? 'NO' : 'SÍ'}</b></button>
      <button data-act="files">Partidas y GitHub${cloud.linked ? ' ☁' : ''}</button>
      <button data-act="codes">Códigos${Object.keys(this.st.cheats || {}).length ? ` <b>${Object.keys(this.st.cheats).length} ACTIVO${Object.keys(this.st.cheats).length > 1 ? 'S' : ''}</b>` : ''}</button>
      <button data-act="full">Pantalla completa del navegador</button>
      <button data-act="title">Volver al título</button></div>
      <p class="hint">Teclado: flechas/WASD mover · Z/E/Enter = A · X/Shift = B (correr) · Esc/M = menú</p>
      <button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel graphics-options', onBack: () => this.home(true), onAct: async a => {
      if (a === 'graphics') { await graphics.setMode(graphics.mode === 'premium' ? 'classic' : 'premium'); }
      if (a === 'quality') { const levels = ['low','medium','high']; graphics.setQuality(levels[(levels.indexOf(graphics.quality)+1)%3]); }
      if (a === 'art') graphics.setArt(graphics.art === 'retro' ? 'hd' : 'retro');
      if (a === 'hero') graphics.setHero(graphics.hero === 'glb' ? 'sculpt' : 'glb');
      if (a === 'persp') { o.perspective = !o.perspective; this.game.applyOptions(); }
      if (a === 'speed') { o.textSpeed = (o.textSpeed + 1) % 4; this.game.applyOptions(); }
      if (a === 'hour') { o.forceHour = o.forceHour === undefined ? 12 : o.forceHour === 12 ? 22 : undefined; }
      if (a === 'avatar') { const av = await this.avatarEditor(this.st.avatar); if (av) { this.st.avatar = av; this.game.applyAvatar(); } }
      if (a === 'autosave') o.autosave = o.autosave === false;
      if (a === 'files') await this.saveFiles();
      if (a === 'codes') return this.codes();
      if (a === 'full') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* no permitido */ } }
      if (a === 'title') { const i = await ui.ask('¿Volver al título? Lo que no hayas guardado se perderá.', ['Sí', 'No']); if (i === 0) return this.game.toTitle(); }
      this.options();
    } });
  }

  // ---------- Códigos secretos ----------
  codes() {
    const st = this.st, active = Object.keys(CHEATS).filter(k => cheatOn(st, k));
    ui.setPanel(`<h3 class="ph">CÓDIGOS</h3><div class="name-entry code-entry"><label for="ccode">Escribe un código secreto</label><input id="ccode" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false"><button data-act="try" class="primary">PROBAR</button></div>
      <div class="code-list">${active.length ? active.map(k => `<span>✓ ${CHEATS[k].name}</span>`).join('') : '<span class="none">Ningún código activo</span>'}</div>
      <p class="hint">Para apagar un código, escríbelo otra vez.</p><button class="bt-back" data-back>VOLVER</button>`,
    { modal: true, cls: 'list-panel', onBack: () => this.options(), onAct: async a => {
      if (a !== 'try') return;
      const input = document.getElementById('ccode'), r = tryCode(st, input?.value);
      input?.blur();   // sin esto, la Z se escribe en la caja en vez de pasar el mensaje
      await ui.say([r.msg]);
      this.codes();
    } });
    setTimeout(() => { const el = document.getElementById('ccode'); if (!el) return; el.focus(); el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ui.panel.els[0].click(); } }); }, 30);
  }

  // ---------- Tienda ----------
  // kind: 'general' (mostrador por medallas), 'special' (mostrador de la ciudad), 'vending' (máquina) o 'sell' (vender).
  shop({ kind = 'general', town = 'arenal', title = 'TIENDA' } = {}) {
    return new Promise(resolve => {
      const st = this.st, sell = kind === 'sell', vending = kind === 'vending';
      const greeting = sell ? '¿Qué quieres vender? Te pago la mitad de lo que cuesta.' : vending ? 'Una máquina expendedora llena de bebidas frías.' : kind === 'special' ? `${SPECIAL[town].name}: cosas que no encuentras en otra tienda.` : '¡Mira todo lo que tenemos!';
      const stock = () => sell ? POCKET_ORDER.flatMap(p => pocketItems(st.bag, p)).filter(id => !ITEMS[id].key) : vending ? VENDING : kind === 'special' ? SPECIAL[town].items : generalStock(st);
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
          spend(st, total);
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
  // Devuelve { type: 'continue', slot } o { type: 'new', slot, name, avatar }.
  title() {
    return new Promise(resolve => {
      const main = () => {
        const saves = listSaves();
        ui.setPanel(`<div class="title-menu">
          ${saves.length ? '<button data-act="continue" class="primary">CONTINUAR</button>' : ''}
          <button data-act="new">NUEVA PARTIDA</button>
          <button data-act="files" class="soft">PARTIDAS Y GITHUB${cloud.linked ? ' ☁' : ''}</button>
          <p class="hint">Juego original sin ROM · guardado en tu navegador${cloud.linked ? ` y en GitHub (${esc(cloud.login)})` : ''}</p></div>`,
        { modal: true, cls: 'title-panel', onAct: a => {
          if (a === 'continue') return saves.length === 1 ? resolve({ type: 'continue', slot: saves[0].slot }) : pick('continue');
          if (a === 'new') return saves.length ? pick('new') : nameStep(1);
          if (a === 'files') return this.saveFiles({ fromTitle: true }).then(main);
        } });
      };
      const pick = mode => this.slotPicker(mode).then(slot => slot ? (mode === 'continue' ? resolve({ type: 'continue', slot }) : nameStep(slot)) : main());
      const nameStep = slot => {
        ui.setPanel(`<div class="name-entry"><label for="pname">¿Cómo te llamas?</label><input id="pname" maxlength="10" value="Santi" autocomplete="off"><button data-act="ok" class="primary">SIGUIENTE</button><button data-back class="soft">VOLVER</button></div>`,
          { modal: true, cls: 'title-panel', onBack: main, onAct: () => {
            const name = (document.getElementById('pname').value || 'Santi').trim().slice(0, 10) || 'Santi';
            this.avatarEditor(defaultAvatar(), { start: true, name }).then(avatar => avatar ? resolve({ type: 'new', slot, name, avatar }) : nameStep(slot));
          } });
        setTimeout(() => { const el = document.getElementById('pname'); if (!el) return; el.focus(); el.select(); el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ui.panel.els[0].click(); } }); }, 30);
      };
      main();
    });
  }

  // Miniatura del avatar (pixel art ampliado, igual en los dos modos).
  avatarThumb(avatar, scale = 3) {
    const f = lookFrame(avatarLook(avatar)), c = document.createElement('canvas');
    c.width = 16 * scale; c.height = 24 * scale; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(f, 0, 0, c.width, c.height);
    return c.toDataURL();
  }

  // Ranuras de partida. mode 'continue': sólo las ocupadas; 'new': todas (las ocupadas piden confirmación).
  slotPicker(mode, title = mode === 'new' ? 'NUEVA PARTIDA · ESCOGE RANURA' : 'CONTINUAR · ESCOGE PARTIDA') {
    return new Promise(resolve => {
      const saves = Object.fromEntries(listSaves().map(s => [s.slot, s]));
      const row = n => {
        const s = saves[n];
        if (!s) return `<button data-act="slot:${n}" class="slot empty" ${mode === 'continue' ? 'disabled' : ''}><i class="av ph"></i><span><b>Ranura ${n}</b><small>Vacía</small></span><span class="sl-n">${n}</span></button>`;
        const where = this.game.world?.get(s.map)?.name || '';
        return `<button data-act="slot:${n}" class="slot"><img class="av" src="${this.avatarThumb(s.avatar)}" alt=""><span><b>${esc(s.name)}</b><small>${s.badges} medalla${s.badges === 1 ? '' : 's'} · ${playTimeText(s.playTime)}${where ? ' · ' + esc(where) : ''}</small></span><span class="sl-n">${n}</span></button>`;
      };
      ui.setPanel(`<h3 class="ph">${title}</h3><div class="slots">${SLOTS.map(row).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'list-panel slot-panel', focus: mode === 'continue' ? 0 : Math.max(0, SLOTS.findIndex(n => !saves[n])), onBack: () => resolve(null), onAct: async a => {
          const n = +a.split(':')[1];
          if (mode === 'new' && saves[n]) {
            const i = await ui.ask(`La ranura ${n} tiene la partida de ${saves[n].name}. ¿Empezar encima y borrarla?`, ['No', 'Sí, borrarla']);
            ui.hideMsg(); if (i !== 1) return this.slotPicker(mode, title).then(resolve);
          }
          resolve(n);
        } });
    });
  }

  // Editor del avatar. Devuelve el avatar escogido o null si se cancela.
  avatarEditor(initial, { start = false, name = '' } = {}) {
    const game = this.game, before = initial;
    let av = cleanAvatar(initial);
    document.body.classList.add('editing-avatar');
    return new Promise(res => {
      const resolve = v => { document.body.classList.remove('editing-avatar'); res(v); };
      const O = AVATAR_OPTIONS;
      const sw = (key, list, none = false) => list.map((c, i) => c ? `<button data-act="${key}:${i}" class="sw${av[key] === i ? ' on' : ''}" style="--c:${c}" aria-label="${key} ${i + 1}"></button>` : `<button data-act="${key}:${i}" class="sw none${av[key] === i ? ' on' : ''}" aria-label="sin gorra">✕</button>`).join('');
      const preview = () => { const p = game.graphics?.avatarPortrait?.(avatarLook(av)); return p ? `<img class="av3d" src="${p}" alt="">` : `<img class="av2d" src="${this.avatarThumb(av, 8)}" alt="">`; };
      const draw = act => {
        game.previewAvatar?.(av);
        const chica = av.body === 'chica';
        ui.setPanel(`<h3 class="ph">${start ? 'CREA TU PERSONAJE' : 'MI AVATAR'}${name ? ` <small>${esc(name)}</small>` : ''}</h3>
          <div class="avatar-ed"><div class="av-prev">${preview()}</div><div class="av-rows">
            <div class="av-row"><span>Soy</span><div class="av-opts">${O.body.map(([id, label]) => `<button data-act="body:${id}" class="opt${av.body === id ? ' on' : ''}">${label}</button>`).join('')}</div></div>
            <div class="av-row"><span>Piel</span><div class="av-opts">${sw('skin', O.skin)}</div></div>
            <div class="av-row"><span>Peinado</span><div class="av-opts">${O.hairStyle[av.body].map(([id, label]) => `<button data-act="hairStyle:${id}" class="opt${av.hairStyle === id ? ' on' : ''}">${label}</button>`).join('')}</div></div>
            <div class="av-row"><span>Pelo</span><div class="av-opts">${sw('hairColor', O.hairColor)}</div></div>
            <div class="av-row"><span>Gorra</span><div class="av-opts">${sw('hat', O.hat)}</div></div>
            <div class="av-row"><span>Chaqueta</span><div class="av-opts">${sw('top', O.top)}</div></div>
            <div class="av-row"><span>${chica ? 'Falda' : 'Pantalón'}</span><div class="av-opts">${sw('bottom', O.bottom)}</div></div>
            <div class="av-row"><span>Morral</span><div class="av-opts">${sw('bag', O.bag)}</div></div>
          </div></div>
          <div class="av-actions"><button data-act="random" class="soft">AL AZAR</button><button data-act="start" class="primary">${start ? 'EMPEZAR' : 'LISTO'}</button></div>
          <button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'list-panel avatar-panel', onBack: () => { game.previewAvatar?.(before); resolve(null); }, onAct: a => {
          if (a === 'start') return resolve(av);
          if (a === 'random') {
            const r = n => Math.floor(Math.random() * n), body = O.body[r(2)][0];
            av = cleanAvatar({ body, skin: r(O.skin.length), hairColor: r(O.hairColor.length), hairStyle: O.hairStyle[body][r(4)][0], hat: r(O.hat.length), top: r(O.top.length), bottom: r(O.bottom.length), bag: r(O.bag.length) });
          } else {
            const [key, val] = a.split(':');
            if (key === 'body') { if (val !== av.body) av = { ...defaultAvatar(val), skin: av.skin, hairColor: av.hairColor }; }
            else av = cleanAvatar({ ...av, [key]: key === 'hairStyle' ? val : +val });
          }
          draw(a);
        } });
        if (act) ui.focusAct(act); else ui.focusAct('start');
      };
      draw();
    });
  }

  // Partidas y respaldo: GitHub (gist privado) y archivo. Desde el título también se puede cargar un archivo.
  saveFiles({ fromTitle = false } = {}) {
    return new Promise(resolve => {
      const done = () => { ui.hideMsg(); resolve(); };
      const ago = t => { if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };
      const draw = () => {
        const linked = cloud.linked;
        ui.setPanel(`<h3 class="ph">PARTIDAS Y GITHUB</h3><div class="opts cloud">
          ${linked ? `<p class="hint">☁ Conectado a GitHub como <b>${esc(cloud.login)}</b>${cloud.lastSync ? ` · último respaldo ${ago(cloud.lastSync)}` : ''}. Cada vez que guardas, la partida también se sube a un gist privado de tu cuenta.</p>
            <button data-act="push">Subir mis partidas ahora</button>
            <button data-act="pull">Traer partidas de GitHub</button>
            <button data-act="unlink">Desconectar GitHub</button>`
          : `<p class="hint">Guarda tus partidas en tu cuenta de GitHub (un gist privado) para no perderlas y seguir en otro celular o compu. GitHub pide un código de acceso con permiso de gist; queda guardado sólo en este navegador.</p>
            <button data-act="token">1 · Crear el código en GitHub</button>
            <input id="ghToken" placeholder="2 · Pega aquí el código (ghp_...)" autocomplete="off" spellcheck="false">
            <button data-act="link">3 · CONECTAR</button>`}
          <div class="sep"></div>
          <button data-act="export">Descargar partida (archivo)</button>
          ${fromTitle ? '<button data-act="import">Cargar partida desde un archivo</button><input type="file" id="importFile" accept=".json,application/json" hidden>' : ''}
          </div><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'list-panel files-panel', onBack: done, onAct: async a => {
          try {
            if (a === 'token') { window.open(TOKEN_URL, '_blank', 'noopener'); ui.show('En GitHub baja hasta el final, dale "Generate token" y copia el código que empieza por ghp_.'); return; }
            if (a === 'link') {
              const token = document.getElementById('ghToken')?.value || '';
              ui.show('Conectando con GitHub...');
              const login = await cloud.connect(token);
              const got = await cloud.pull();
              await cloud.push();
              await ui.say([`¡Listo! Conectado como ${login}.`, got.length ? `Se trajeron ${got.length} partida${got.length > 1 ? 's' : ''} de GitHub.` : 'Tus partidas ya quedaron respaldadas en GitHub.']);
            }
            if (a === 'push') { ui.show('Subiendo a GitHub...'); await cloud.push(); await ui.say(['Partidas subidas a GitHub.']); }
            if (a === 'pull') {
              if (!fromTitle) { await ui.say(['Para traer partidas de GitHub vuelve al título: así no se cruzan con la que estás jugando.']); return draw(); }
              ui.show('Trayendo partidas de GitHub...'); const got = await cloud.pull();
              await ui.say([got.length ? `Se trajeron ${got.length} partida${got.length > 1 ? 's' : ''} de GitHub.` : 'Tus partidas locales ya están al día.']);
            }
            if (a === 'unlink') { const i = await ui.ask('¿Desconectar GitHub? Tus partidas siguen en este navegador y en tu gist.', ['No', 'Sí']); if (i === 1) cloud.disconnect(); }
            if (a === 'export') await this.exportSave(fromTitle);
            if (a === 'import') { const input = document.getElementById('importFile'); input.onchange = () => this.importSave(input.files[0]).then(draw); input.click(); return; }
          } catch (e) { await ui.say([e.message || 'No se pudo conectar con GitHub.']); }
          draw();
        } });
      };
      draw();
    });
  }
  async exportSave(fromTitle) {
    let st = this.st;
    if (fromTitle) {
      const saves = listSaves(); if (!saves.length) return ui.say(['Todavía no hay partidas guardadas.']);
      const slot = saves.length === 1 ? saves[0].slot : await this.slotPicker('continue', 'DESCARGAR · ESCOGE PARTIDA'); if (!slot) return;
      st = loadState(slot);
    } else saveState(st);
    const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `alborada-${(st.name || 'partida').toLowerCase().replace(/[^a-z0-9ñ]+/g, '-')}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    await ui.say([`Se descargó la partida de ${st.name}.`]);
  }
  async importSave(file) {
    if (!file) return;
    const st = parseState(await file.text());
    if (!st) return ui.say(['Ese archivo no es una partida de Alborada.']);
    const slot = await this.slotPicker('new', 'CARGAR ARCHIVO · ESCOGE RANURA'); if (!slot) return;
    storeState(st, slot); cloud.pushSoon();
    await ui.say([`La partida de ${st.name} quedó en la ranura ${slot}.`]);
  }
}
