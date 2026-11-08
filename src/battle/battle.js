// Combate por turnos a pantalla completa: escena con fondo según el terreno, sprites con animación,
// efectos por tipo de movimiento, entrenadores con varias criaturas, experiencia, niveles, aprendizaje y captura.
import { ui, esc } from '../ui/ui.js';
import { itemIcon } from '../art/items.js';
import { input } from '../core/input.js';
import { battleSprite, silhouette, iconURL } from '../art/creatures.js';
import { sheet } from '../art/characters.js';
import { canvas, px, ellipse, hash } from '../core/pixel.js';
import { SPECIES, MOVES, TYPES, effectiveness, expForLevel, refreshStats } from '../data/creatures.js';
import { ITEMS, POCKETS, BATTLE_POCKETS, pocketItems, isCapsule, canUseOn, useOnCreature, catchBonus } from '../data/items.js';

const $ = id => document.getElementById(id);
const STAGE = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const rand = () => Math.random();

// ---------- Fondos según terreno ----------
const BGS = {
  grass: { sky: ['#cfeefc', '#bfe6fa', '#aedff7'], far: '#5aa860', ground: ['#a8dc84', '#9cd47a'], plat: ['#5a9a4a', '#c8e89a', '#dcf2b4'] },
  lake: { sky: ['#d8f0fc', '#c4e8f8', '#b0e0f4'], far: '#6ab8d8', ground: ['#8ccfe8', '#7cc4e2'], plat: ['#4a8ab0', '#d8eef8', '#eaf6fc'], water: true },
  cave: { sky: ['#3a2e28', '#342a24', '#2e2420'], far: '#4a3a30', ground: ['#6a5442', '#62503e'], plat: ['#3e3026', '#8a7058', '#9e8468'] },
  beach: { sky: ['#bfe8fc', '#aee0fa', '#9cd8f6'], far: '#3e98dc', ground: ['#f0e0a8', '#e6d498'], plat: ['#c8b078', '#f6eac0', '#fff6d8'], water: true },
  gym: { sky: ['#e8e4f4', '#dcd8ec', '#d0cce4'], far: '#b8b0d8', ground: ['#d8d0ec', '#ccc4e2'], plat: ['#8a80b8', '#ece8f8', '#f8f6ff'] },
  eclipse: { sky: ['#2a2238', '#241e32', '#1e182a'], far: '#3a2c4a', ground: ['#3a3048', '#342a42'], plat: ['#1a1622', '#5a4a6a', '#6a5a7a'] },
  league: { sky: ['#2a2a4a', '#30305a', '#3a3a6a'], far: '#5a4a8a', ground: ['#8a3a4a', '#7e3444'], plat: ['#d8b040', '#f8e8a8', '#fff6d0'] },
  mountain: { sky: ['#d8ecf8', '#c8e2f4', '#b8d8f0'], far: '#8a9ab0', ground: ['#b8c8a0', '#acbc94'], plat: ['#7a8a6a', '#d8e4c0', '#e8f0d8'] }
};
const bgCache = new Map();
function background(kind, w, h) {
  const k = kind + w + 'x' + h;
  if (bgCache.has(k)) return bgCache.get(k);
  const B = BGS[kind] || BGS.grass;
  const [c, g] = canvas(w, h);
  const hz = Math.round(h * 0.34);
  B.sky.forEach((col, i) => px(g, 0, Math.round(i * hz / 3), col, w, Math.ceil(hz / 3) + 1));
  for (let x = 0; x < w; x += 2) { const hh = 6 + Math.round(5 * Math.sin(x / 17) + 3 * Math.sin(x / 6)); px(g, x, hz - hh, B.far, 2, hh); }
  px(g, 0, hz, B.ground[0], w, h - hz);
  for (let y = hz + 4; y < h; y += 8) px(g, 0, y, B.ground[1], w, 3);
  if (B.water) for (let i = 0; i < w / 6; i++) px(g, Math.floor(hash(i, 1) * w), hz + 2 + Math.floor(hash(i, 2) * (h - hz) * 0.3), '#ffffff', 3, 1);
  if (kind === 'cave') for (let i = 0; i < 30; i++) px(g, Math.floor(hash(i, 3) * w), Math.floor(hash(i, 4) * hz), '#5a4a40', 2, 6 + Math.floor(hash(i, 5) * 10));
  if (kind === 'league') for (let i = 0; i < 40; i++) px(g, Math.floor(hash(i, 6) * w), Math.floor(hash(i, 7) * hz), '#f8f0c0', 1, 1);
  bgCache.set(k, c);
  return c;
}

export class Battle {
  constructor(game, opts) {
    this.game = game; this.st = game.state; this.opts = opts;
    this.trainer = opts.trainer || null;
    this.foeParty = this.trainer ? this.trainer.party : [opts.foe];
    this.foeIdx = 0;
    this.foe.stages = { atk: 0, def: 0, spe: 0 };
    this.activeIdx = this.st.party.findIndex(c => c.hp > 0);
    this.fx = { foeX: 1, allyX: -1, foeAlpha: 1, allyAlpha: 1, foeY: 0, allyY: 0, flash: 0, ball: null, foeScale: 1, shake: 0, trainerX: 0, trainerA: this.trainer ? 1 : 0 };
    this.parts = [];
    this.participants = new Set();
    this.allyStages = { atk: 0, def: 0, spe: 0 };
    document.body.classList.add('in-battle');
  }
  get foe() { return this.foeParty[this.foeIdx]; }
  get ally() { return this.st.party[this.activeIdx]; }

  // Disposición según el tamaño de pantalla
  layout(r) {
    const w = r.w, h = r.h, portrait = h > w * 1.1;
    const k = Math.max(1, Math.min(Math.round(h / 170), Math.floor(w / (portrait ? 110 : 150))));
    return portrait
      ? { k, foe: [w * 0.68, h * 0.30], ally: [w * 0.30, h * 0.48], w, h }
      : { k, foe: [w * 0.70, h * 0.43], ally: [w * 0.27, h * 0.76], w, h };
  }

  // ---------- Dibujo ----------
  render(r) {
    const g = r.g, f = this.fx, L = this.layout(r), k = L.k;
    const sh = f.shake > 0 ? Math.round((rand() - 0.5) * f.shake * 2) : 0; if (f.shake > 0) f.shake--;
    g.drawImage(background(this.opts.bg || 'grass', r.w, r.h), sh, 0);
    const B = BGS[this.opts.bg] || BGS.grass;
    const plat = ([cx, cy], rx, ry) => { ellipse(g, Math.round(cx + sh), Math.round(cy + 2), rx + 2, ry + 2, B.plat[0]); ellipse(g, Math.round(cx + sh), Math.round(cy), rx, ry, B.plat[1]); ellipse(g, Math.round(cx + sh), Math.round(cy - 1), rx - 8, ry - 3, B.plat[2]); };
    plat(L.foe, 46 * k, 11 * k); plat(L.ally, 58 * k, 13 * k);
    const bob = Math.round(Math.sin(this.game.frame / 22) * k);
    // Entrenador rival (antes de sacar criatura)
    if (this.trainer && f.trainerA > 0) {
      g.globalAlpha = f.trainerA;
      const sp = sheet(this.trainer.look || 'man')[0][0];
      g.drawImage(sp, Math.round(L.foe[0] - 16 * k + f.trainerX * L.w + sh), Math.round(L.foe[1] - 46 * k), 32 * k, 48 * k);
      g.globalAlpha = 1;
    }
    if (f.foeAlpha > 0 && !(f.foeBlink && (this.game.frame >> 2) % 2)) {
      g.globalAlpha = f.foeAlpha;
      const s = f.foeScale, size = 64 * k * s;
      const img = f.foeWhite ? silhouette(this.foe.sp) : battleSprite(this.foe.sp);
      g.drawImage(img, Math.round(L.foe[0] - size / 2 + f.foeX * L.w + sh), Math.round(L.foe[1] - size + 4 * k + f.foeY * k + (s === 1 ? bob : 0)), size, size);
      g.globalAlpha = 1;
    }
    if (this.ally && f.allyAlpha > 0 && !(f.allyBlink && (this.game.frame >> 2) % 2)) {
      g.globalAlpha = f.allyAlpha;
      const size = 80 * k;
      g.drawImage(battleSprite(this.ally.sp, true), Math.round(L.ally[0] - size / 2 + f.allyX * L.w + sh), Math.round(L.ally[1] - size + 10 * k + f.allyY * k - bob), size, size);
      g.globalAlpha = 1;
    }
    if (f.ball) this.drawCapsule(g, f.ball, L, k);
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--;
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 12));
      if (p.ring) { g.strokeStyle = p.color; g.lineWidth = k; g.beginPath(); g.arc(p.x, p.y, (30 - p.life) * k * 1.4, 0, Math.PI * 2); g.stroke(); }
      else { g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(p.y), p.s * k, p.s * k); }
    }
    g.globalAlpha = 1;
    this.parts = this.parts.filter(p => p.life > 0);
    if (f.flash > 0) { g.fillStyle = `rgba(255,255,255,${f.flash})`; g.fillRect(0, 0, r.w, r.h); f.flash = Math.max(0, f.flash - 0.06); }
    this.L = L;
  }

  // Cápsula alargada: mitad de color, mitad crema, unión oscura y gema; gira mientras vuela.
  drawCapsule(g, b, L, k) {
    const x = Math.round(b.x * L.w), y = Math.round(b.y * L.h), r = 3 * k, half = 4 * k;
    const pill = (x0, x1, rad, color) => { g.fillStyle = color; g.beginPath(); g.arc(x0, 0, rad, Math.PI / 2, Math.PI * 1.5); g.lineTo(x1, -rad); g.arc(x1, 0, rad, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill(); };
    g.save(); g.translate(x, y); g.rotate(b.spin || 0);
    pill(-half, half, r + k, '#26222e');
    pill(-half, 0, r, b.color || '#3a9ad8');
    pill(0, half, r, '#f6ead2');
    g.fillStyle = '#26222e'; g.fillRect(-k / 2, -r, k, r * 2);
    g.fillStyle = '#ffffff'; g.fillRect(-k, -k, 2 * k, 2 * k);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-half - k, -r + k, 2 * k, k); g.fillRect(k * 2, -r + k, 2 * k, k);
    g.restore();
  }

  // Efecto visual según el tipo del movimiento, centrado en el objetivo.
  effect(type, onFoe) {
    const L = this.L; if (!L) return;
    const [cx, cy0] = onFoe ? L.foe : L.ally, cy = cy0 - 30 * L.k;
    const add = (n, f) => { for (let i = 0; i < n; i++) this.parts.push(f(i)); };
    const R = (a) => (rand() - 0.5) * a;
    const C = { planta: ['#5cb04c', '#a8e880'], fuego: ['#f07a24', '#f8c838'], agua: ['#3e98dc', '#b4e4fa'], electrico: ['#f8d038', '#ffffff'], roca: ['#9a8468', '#6a5a46'], volador: ['#ffffff', '#c8dcf8'], bicho: ['#9ab830', '#d8f0a0'], psiquico: ['#e85a9a', '#c8a0f0'], siniestro: ['#3a2c48', '#6a5a7a'], normal: ['#ffffff', '#f8e8a8'] }[type] || ['#fff', '#fff'];
    if (type === 'psiquico' || type === 'siniestro') add(4, i => ({ x: cx, y: cy, vx: 0, vy: 0, life: 30 - i * 5, color: C[i % 2], ring: true }));
    else if (type === 'fuego') add(22, i => ({ x: cx + R(40 * L.k), y: cy + 20 * L.k, vx: R(0.6), vy: -1 - rand() * 1.4, life: 26, color: C[i % 2], s: 2 }));
    else if (type === 'roca') add(12, i => ({ x: cx + R(50 * L.k), y: cy - 40 * L.k, vx: 0, vy: 1, g: 0.25, life: 26, color: C[i % 2], s: 3 }));
    else if (type === 'electrico') add(18, i => ({ x: cx + R(50 * L.k), y: cy + R(40 * L.k), vx: R(3), vy: R(3), life: 14, color: C[i % 2], s: 2 }));
    else add(18, i => ({ x: cx + R(20 * L.k), y: cy + R(20 * L.k), vx: R(3), vy: R(3) - 0.5, g: type === 'agua' ? 0.08 : 0, life: 22, color: C[i % 2], s: 2 }));
  }

  // ---------- HUD ----------
  hud() {
    const foe = this.foe, al = this.ally;
    const bar = (hp, max) => { const k = Math.max(0, hp / max); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
    const caught = this.opts.wild && this.st.dex && this.st.dex[foe.sp] === 2 ? ' <span title="Ya atrapado">◉</span>' : '';
    $('hudFoe').innerHTML = `<b>${esc(foe.name)}</b>${caught}<span>Nv${foe.level}</span>${bar(foe.hp, foe.stats.hp)}`;
    if (al) {
      const lo = expForLevel(al.level), hi = expForLevel(al.level + 1);
      $('hudAlly').innerHTML = `<b>${esc(al.name)}</b><span>Nv${al.level}</span>${bar(al.hp, al.stats.hp)}<em>${Math.max(0, Math.ceil(al.hp))}/${al.stats.hp}</em><div class="xp"><i style="width:${Math.max(0, Math.min(100, (al.exp - lo) / (hi - lo) * 100))}%"></i></div>`;
    }
  }
  showHud(foe, ally) { $('hudFoe').classList.toggle('hidden', !foe); $('hudAlly').classList.toggle('hidden', !ally); }

  wait(frames) { return this.game.frames(frames); }
  async msg(text, hold = 40) {
    ui.show(text);
    input.clear();
    const n = Math.max(hold, Math.min(90, text.length * 1.3));
    for (let i = 0; i < n; i++) { await this.wait(1); if (i > 8 && input.hit('a')) break; }
  }
  async tween(obj, key, to, frames) {
    const from = obj[key];
    for (let i = 1; i <= frames; i++) { obj[key] = from + (to - from) * (i / frames); this.hud(); await this.wait(1); }
  }

  // ---------- Flujo principal ----------
  async run() {
    const f = this.fx;
    this.showHud(false, false);
    ui.closePanel();
    ui.show('', { hide: true });
    this.seen(this.foe);
    if (this.trainer) {
      f.foeAlpha = 0; f.trainerX = 0.6;
      await this.tween(f, 'trainerX', 0, 30);
      await this.msg(`¡${this.trainer.name} quiere combatir!`);
      await Promise.all([this.tween(f, 'trainerX', 0.4, 18), this.tween(f, 'trainerA', 0, 18)]);
      await this.sendFoe();
    } else {
      await this.tween(f, 'foeX', 0, 34);
      this.showHud(true, false); this.hud();
      await this.msg(this.opts.legendary ? `¡${this.foe.name} te desafía!` : `¡Un ${this.foe.name} salvaje apareció!`);
    }
    await this.sendOut();
    while (true) {
      const act = await this.choose();
      const end = await this.turn(act);
      if (end) { this.cleanup(); return end; }
    }
  }
  seen(c) { this.st.dex = this.st.dex || {}; if (!this.st.dex[c.sp]) this.st.dex[c.sp] = 1; }
  async sendFoe() {
    const f = this.fx;
    this.foe.stages = { atk: 0, def: 0, spe: 0 };
    this.seen(this.foe);
    f.foeAlpha = 1; f.foeY = 0; f.foeScale = 0.1; f.foeX = 0; f.flash = 0.5;
    await this.msg(`${this.trainer.name} envió a ${this.foe.name}.`, 10);
    await this.tween(f, 'foeScale', 1, 12);
    this.showHud(true, !!this.ally && f.allyX === 0); this.hud();
    await this.wait(16);
  }
  async sendOut() {
    this.fx.allyX = -1; this.fx.allyAlpha = 1; this.fx.allyY = 0;
    this.allyStages = { atk: 0, def: 0, spe: 0 };
    this.allyCrit = false;
    this.participants.add(this.activeIdx);
    ui.show(`¡Adelante, ${this.ally.name}!`);
    await this.tween(this.fx, 'allyX', 0, 22);
    this.showHud(true, true); this.hud();
    await this.wait(16);
  }
  cleanup() {
    this.showHud(false, false);
    ui.hideMsg(); ui.closePanel();
    document.body.classList.remove('in-battle');
  }

  // ---------- Menús ----------
  choose() {
    return new Promise(resolve => {
      const main = () => {
        ui.show(`¿Qué hará ${this.ally.name}?`);
        ui.setPanel(`<div class="bt-main"><button class="bt-fight" data-act="fight">LUCHAR</button><button class="bt-bag" data-act="bag">MOCHILA</button><button class="bt-party" data-act="party">EQUIPO</button><button class="bt-run" data-act="run" style="grid-column:1/-1">HUIR</button></div>`,
          { modal: true, cls: 'battle-panel', onAct: a => ({ fight: moves, bag, party: () => party(false), run: () => resolve({ type: 'run' }) })[a]() });
      };
      const moves = () => {
        const al = this.ally;
        if (al.moves.every(m => m.pp <= 0)) { ui.show(`¡A ${al.name} no le quedan PP! Usará Forcejeo.`); return resolve({ type: 'move', i: -1 }); }
        ui.setPanel(`<div class="bt-moves">${al.moves.map((m, i) => { const M = MOVES[m.id]; const eff = M.power ? effectiveness(M.type, SPECIES[this.foe.sp].types) : 1; return `<button class="mv" style="--t:${TYPES[M.type].color}" data-act="${i}" ${m.pp <= 0 ? 'disabled' : ''}><b>${esc(M.name)}</b><small>${TYPES[M.type].name}${M.power ? ' · ' + M.power : ''}${this.st.dex?.[this.foe.sp] && eff !== 1 ? (eff > 1 ? ' · ¡eficaz!' : ' · poco eficaz') : ''}</small><em>PP ${m.pp}/${M.pp}</em></button>`; }).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
          { modal: true, cls: 'battle-panel', onAct: a => resolve({ type: 'move', i: +a }), onBack: main });
      };
      // Mochila de combate: bolsillos de Cápsulas, Medicinas y Batalla.
      const bag = pocket => {
        const st = this.st;
        pocket = pocket || this.pocket || (this.opts.canCatch ? 'capsulas' : 'medicinas');
        this.pocket = pocket;
        const ids = pocketItems(st.bag, pocket);
        const tabs = BATTLE_POCKETS.map(p => `<button data-act="tab:${p}" class="tab${p === pocket ? ' on' : ''}" style="--c:${POCKETS[p].color}">${POCKETS[p].name}<small>${pocketItems(st.bag, p).reduce((a, id) => a + st.bag[id], 0)}</small></button>`).join('');
        const off = id => isCapsule(id) && !this.opts.canCatch;
        ui.setPanel(`<div class="tabs">${tabs}</div><div class="bt-list items">${ids.length ? ids.map(id => `<button data-act="${id}" class="it" ${off(id) ? 'disabled' : ''}><img class="ico" src="${itemIcon(id)}" alt=""><b>${esc(ITEMS[id].name)}</b><span>x${st.bag[id]}</span></button>`).join('') : '<p class="empty">Este bolsillo está vacío.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
          { modal: true, cls: 'battle-panel bag-panel', focus: ids.length ? BATTLE_POCKETS.length : BATTLE_POCKETS.indexOf(pocket),
            onFocus: el => { const a = el.dataset.act; if (ITEMS[a]) ui.show(off(a) ? 'Las Cápsulas sólo sirven contra criaturas salvajes.' : `${ITEMS[a].name}: ${ITEMS[a].desc}`); else ui.show(`¿Qué hará ${this.ally.name}?`); },
            onAct: a => {
              if (a.startsWith('tab:')) return bag(a.slice(4));
              const it = ITEMS[a];
              if (isCapsule(a)) return resolve({ type: 'catch', id: a });
              if (it.boost) return resolve({ type: 'boost', id: a });
              return party(false, a);
            }, onBack: main });
      };
      const party = (forced, itemId) => {
        const usable = c => itemId ? canUseOn(itemId, c) : (c.hp > 0 && this.st.party.indexOf(c) !== this.activeIdx);
        if (itemId) ui.show(`¿En quién vas a usar ${ITEMS[itemId].name}?`);
        ui.setPanel(`<div class="bt-list party">${this.st.party.map((c, i) => `<button data-act="${i}" class="${i === this.activeIdx ? 'cur' : ''}${usable(c) ? '' : ' dim'}"><img src="${iconURL(c.sp)}" alt=""><b>${esc(c.name)}</b><span>Nv${c.level} · ${Math.ceil(c.hp)}/${c.stats.hp}</span></button>`).join('')}</div>${forced ? '' : '<button class="bt-back" data-back>VOLVER</button>'}`,
          { modal: true, cls: 'battle-panel', onAct: a => {
            const i = +a, c = this.st.party[i];
            if (itemId) { if (!canUseOn(itemId, c)) { ui.show('No tendría ningún efecto.'); return; } return resolve({ type: 'item', id: itemId, target: i }); }
            if (c.hp <= 0 || i === this.activeIdx) return;
            resolve({ type: 'switch', i });
          }, onBack: forced ? null : (itemId ? () => { ui.show(`¿Qué hará ${this.ally.name}?`); bag(); } : main) });
      };
      if (this.needSwitch) party(true); else main();
    });
  }

  // ---------- Turnos ----------
  foeMove() {
    const usable = this.foe.moves.filter(m => m.pp > 0);
    if (!usable.length) return { id: 'embestida', pp: 1 };
    // IA: prefiere ataques fuertes y eficaces; a veces usa un movimiento de estado.
    const target = this.ally ? SPECIES[this.ally.sp].types : [];
    const score = m => { const M = MOVES[m.id]; if (!M.power) return 25; return M.power * effectiveness(M.type, target) * (SPECIES[this.foe.sp].types.includes(M.type) ? 1.5 : 1); };
    const smart = this.trainer ? 0.75 : 0.45;
    if (rand() < smart) return usable.reduce((a, b) => score(b) > score(a) ? b : a);
    return usable[Math.floor(rand() * usable.length)];
  }
  speed(c, stages) { return c.stats.spe * STAGE(stages.spe); }

  async turn(act) {
    ui.closePanel();
    this.needSwitch = false;
    this.turnN = (this.turnN || 0) + 1;
    if (act.type === 'run') {
      if (this.trainer) { await this.msg('¡No puedes huir de un combate contra un entrenador!'); return null; }
      if (!this.opts.canRun) { await this.msg('¡No puedes huir ahora!'); return null; }
      const ok = this.speed(this.ally, this.allyStages) >= this.speed(this.foe, this.foe.stages) || rand() < 0.6;
      if (ok) { await this.msg('¡Escapaste sin problemas!'); return 'run'; }
      await this.msg('¡No pudiste escapar!');
      return this.foeTurn();
    }
    if (act.type === 'switch') {
      await this.msg(`¡${this.ally.name}, vuelve!`, 20);
      await this.tween(this.fx, 'allyX', -1, 16);
      this.activeIdx = act.i;
      await this.sendOut();
      return this.foeTurn();
    }
    if (act.type === 'item') {
      const c = this.st.party[act.target], it = ITEMS[act.id];
      this.st.bag[act.id]--;
      await this.msg(`${this.st.name} usó ${it.name} en ${c.name}.`, 20);
      const res = useOnCreature(act.id, c);
      if (res.to !== undefined && act.target === this.activeIdx) { c.hp = res.from; await this.tween(c, 'hp', res.to, 24); c.hp = res.to; this.hud(); }
      await this.msg(res.msg);
      return this.foeTurn();
    }
    if (act.type === 'boost') {
      const it = ITEMS[act.id], al = this.ally;
      this.st.bag[act.id]--;
      await this.msg(`¡${this.st.name} usó ${it.name}!`, 20);
      this.effect('normal', false);
      if (it.boost === 'crit') {
        if (this.allyCrit) await this.msg(`${al.name} ya está concentrado al máximo.`);
        else { this.allyCrit = true; await this.msg(`¡${al.name} se concentró! Sus golpes críticos serán más probables.`); }
      } else {
        const names = { atk: 'el Ataque', def: 'la Defensa', spe: 'la Velocidad' };
        const before = this.allyStages[it.boost];
        this.allyStages[it.boost] = Math.min(6, before + 2);
        await this.msg(before >= 6 ? `¡${names[it.boost]} de ${al.name} no puede subir más!` : `¡Subió mucho ${names[it.boost]} de ${al.name}!`);
      }
      return this.foeTurn();
    }
    if (act.type === 'catch') return this.throwCapsule(act.id);

    const mine = act.i < 0 ? { id: 'forcejeo', pp: 1 } : this.ally.moves[act.i];
    const theirs = this.foeMove();
    const sa = this.speed(this.ally, this.allyStages), sf = this.speed(this.foe, this.foe.stages);
    const order = (sa > sf || (sa === sf && rand() < 0.5)) ? ['ally', 'foe'] : ['foe', 'ally'];
    for (const who of order) {
      const end = who === 'ally' ? await this.attack(true, mine) : await this.attack(false, theirs);
      if (end !== undefined) return end;
    }
    return null;
  }
  async foeTurn() { const e = await this.attack(false, this.foeMove()); return e === undefined ? null : e; }

  // Devuelve undefined si el combate sigue, null si terminó el turno por un cambio, o el resultado final.
  async attack(isAlly, slot) {
    const user = isAlly ? this.ally : this.foe, target = isAlly ? this.foe : this.ally;
    const us = isAlly ? this.allyStages : this.foe.stages, ts = isAlly ? this.foe.stages : this.allyStages;
    const M = MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
    const who = isAlly ? user.name : (this.trainer ? `${user.name} rival` : (this.opts.legendary ? user.name : `El ${user.name} salvaje`));
    await this.msg(`¡${who} usó ${M.name}!`, 28);
    const key = isAlly ? 'allyX' : 'foeX', dir = isAlly ? 1 : -1;
    await this.tween(this.fx, key, 0.04 * dir, 4); await this.tween(this.fx, key, 0, 4);
    if (rand() * 100 >= M.acc) { await this.msg('¡Pero falló!'); return undefined; }
    if (M.power > 0) {
      const eff = effectiveness(M.type, SPECIES[target.sp].types);
      this.effect(M.type, isAlly);
      await this.wait(16);
      if (eff === 0) { await this.msg(`No afecta a ${target.name}...`); return undefined; }
      const crit = rand() < (isAlly && this.allyCrit ? 1 / 4 : 1 / 16) ? 1.5 : 1;
      const A = user.stats.atk * (crit > 1 ? Math.max(1, STAGE(us.atk)) : STAGE(us.atk));
      const D = target.stats.def * (crit > 1 ? Math.min(1, STAGE(ts.def)) : STAGE(ts.def));
      const stab = SPECIES[user.sp].types.includes(M.type) ? 1.5 : 1;
      let dmg = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * M.power * A / D) / 50) + 2;
      dmg = Math.max(1, Math.floor(dmg * stab * eff * crit * (0.85 + rand() * 0.15)));
      const blink = isAlly ? 'foeBlink' : 'allyBlink';
      this.fx[blink] = true; this.fx.shake = eff > 1 ? 14 : 6; await this.wait(20); this.fx[blink] = false;
      await this.tween(target, 'hp', Math.max(0, target.hp - dmg), 22);
      target.hp = Math.max(0, Math.round(target.hp));
      if (crit > 1) await this.msg('¡Un golpe crítico!', 30);
      if (eff > 1) await this.msg('¡Es muy eficaz!', 30);
      if (eff < 1) await this.msg('No es muy eficaz...', 30);
      if (target.hp <= 0) return this.faint(!isAlly);
    } else if (M.effect) {
      const e = M.effect, stages = e.target === 'foe' ? ts : us, whom = e.target === 'foe' ? target : user;
      const names = { atk: 'el Ataque', def: 'la Defensa', spe: 'la Velocidad' };
      this.effect('psiquico', e.target === 'foe' ? isAlly : !isAlly);
      if (Math.abs(stages[e.stat] + e.stages) > 6) await this.msg(`¡${names[e.stat]} de ${whom.name} no puede cambiar más!`);
      else { stages[e.stat] += e.stages; await this.msg(`¡${e.stages < 0 ? 'Bajó' : 'Subió'} ${names[e.stat]} de ${whom.name}!`); }
    }
    return undefined;
  }

  async faint(allyFainted) {
    if (!allyFainted) {
      await Promise.all([this.tween(this.fx, 'foeY', 40, 18), this.tween(this.fx, 'foeAlpha', 0, 18)]);
      this.showHud(false, true);
      await this.msg(this.trainer ? `¡${this.foe.name} rival se debilitó!` : `¡${this.opts.legendary ? '' : 'El '}${this.foe.name}${this.opts.legendary ? '' : ' salvaje'} se debilitó!`);
      await this.giveExp();
      if (this.trainer && this.foeIdx < this.foeParty.length - 1) {
        this.foeIdx++;
        await this.sendFoe();
        return null;
      }
      if (this.trainer) {
        const money = this.trainer.money || 0;
        await this.msg(`¡Derrotaste a ${this.trainer.name}!`, 50);
        if (money) { this.st.money += money; await this.msg(`Ganaste $${money}.`); }
      }
      return 'win';
    }
    await Promise.all([this.tween(this.fx, 'allyY', 40, 18), this.tween(this.fx, 'allyAlpha', 0, 18)]);
    await this.msg(`¡${this.ally.name} se debilitó!`);
    this.participants.delete(this.activeIdx);
    if (this.st.party.some(c => c.hp > 0)) {
      this.needSwitch = true;
      const act = await this.choose();
      this.activeIdx = act.i;
      await this.sendOut();
      return null;
    }
    await this.msg('¡No te quedan criaturas en pie!');
    return 'lose';
  }

  async giveExp() {
    const base = SPECIES[this.foe.sp].exp;
    const total = Math.max(1, Math.floor(base * this.foe.level / 7 * (this.trainer ? 1.5 : 1)));
    const ids = [...this.participants].filter(i => this.st.party[i] && this.st.party[i].hp > 0);
    const each = Math.max(1, Math.floor(total / Math.max(1, ids.length)));
    for (const i of ids) {
      const c = this.st.party[i];
      await this.msg(`¡${c.name} ganó ${each} puntos de experiencia!`, 30);
      const target = c.exp + each;
      while (target >= expForLevel(c.level + 1) && c.level < 100) {
        if (i === this.activeIdx) await this.tween(c, 'exp', expForLevel(c.level + 1), 16);
        c.exp = expForLevel(c.level + 1);
        c.level++; refreshStats(c); this.hud();
        await this.msg(`¡${c.name} subió al nivel ${c.level}!`);
        await this.game.learnMoves(c, c.level, msg => this.msg(msg));
      }
      if (i === this.activeIdx) await this.tween(c, 'exp', target, 12);
      c.exp = target; this.hud();
    }
  }

  async throwCapsule(id) {
    if (this.st.party.length >= 6 && !this.st.box) this.st.box = [];
    this.st.bag[id]--;
    await this.msg(`¡${this.st.name} lanzó una ${ITEMS[id].name}!`, 10);
    const f = this.fx, L = this.L;
    const tx = L.foe[0] / L.w, ty = (L.foe[1] - 30 * L.k) / L.h;
    f.ball = { x: 0.25, y: 0.8, color: ITEMS[id].color, spin: 0 };
    for (let i = 1; i <= 26; i++) { const k = i / 26; f.ball.x = 0.25 + (tx - 0.25) * k; f.ball.y = 0.8 + (ty - 0.8) * k - Math.sin(k * Math.PI) * 0.25; f.ball.spin = k * Math.PI * 4; await this.wait(1); }
    f.ball.spin = 0;
    f.flash = 0.8; f.foeWhite = true;
    await Promise.all([this.tween(f, 'foeScale', 0.05, 12), this.tween(f, 'foeAlpha', 0, 12)]);
    f.foeWhite = false;
    f.ball.y = (L.foe[1] - 6 * L.k) / L.h;
    const max = this.foe.stats.hp, hp = this.foe.hp;
    const rate = this.opts.legendary ? 45 : 190;
    const hour = this.game.hour();
    const bonus = catchBonus(id, { turn: this.turnN || 1, foe: this.foe, night: hour >= 19 || hour < 6, dark: !!this.game.ow?.map?.dark || this.opts.bg === 'cave' });
    const chance = Math.min(1, ((3 * max - 2 * hp) * rate * bonus) / (3 * max) / 255 + 0.04);
    const ok = rand() < chance;
    const wobbles = ok ? 3 : Math.floor(rand() * 3);
    for (let w = 0; w < wobbles; w++) {
      await this.wait(18);
      for (const dx of [-0.006, 0.006, -0.006, 0]) { f.ball.x = tx + dx; f.ball.spin = dx * 60; await this.wait(4); }
    }
    await this.wait(16);
    if (ok) {
      await this.msg(`¡Ya está! ¡Atrapaste a ${this.foe.name}!`, 60);
      delete this.foe.stages;
      this.foe.hp = Math.max(1, this.foe.hp);
      this.st.dex[this.foe.sp] = 2;
      if (this.st.party.length < 6) { this.st.party.push(this.foe); await this.msg(`${this.foe.name} se unió a tu equipo.`); }
      else { this.st.box.push(this.foe); await this.msg(`Tu equipo está lleno: ${this.foe.name} se fue a la caja del PC.`); }
      f.ball = null;
      return 'caught';
    }
    f.ball = null; f.flash = 0.6;
    await Promise.all([this.tween(f, 'foeScale', 1, 10), this.tween(f, 'foeAlpha', 1, 10)]);
    await this.msg(['¡Oh, no! ¡Se escapó!', '¡Casi lo tenías!', '¡Uy! ¡Por poquito!'][wobbles] || '¡Se escapó!');
    return this.foeTurn();
  }
}
