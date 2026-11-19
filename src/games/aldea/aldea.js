// Aldea Puchamon: pantalla del juego. Tu aldea en 3D con edificios que producen plata (la misma de Puchamon) y
// bayas, obras con tiempo real, tu ejército de Puchamon y ataques a aldeas rivales. La lógica vive en sim.js y
// el dibujo en render3d/aldea3d.js; aquí van los toques, el teclado, los paneles y el guardado.
import { ui, esc, money } from '../../ui/ui.js';
import { input } from '../../core/input.js';
import { saveState } from '../../core/state.js';
import { iconURL } from '../../art/creatures.js';
import { TYPES } from '../../data/creatures.js';
import { cardRole, rng } from '../arena/sim.js';
import { B, KINDS, GRID, aldeaState, casaLevel, countOf, limitOf, maxLevel, busyBuilders, bayasCap, armySpace, armyUsed, tick, collect, fits, buildBlock, build, upgradeBlock, upgrade, rushCost, rush, move, troopCards, train, untrain, trainBlock, enemyVillage, RaidSim, TRAIN_COST } from './sim.js';

const ICON = { casa: '🏠', mina: '⛏️', huerto: '🍓', granero: '🌾', corral: '🐾', torre: '🗼', lanza: '🪨', muro: '🧱' };
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); if (s >= 3600) return Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm'; if (s >= 60) return Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; return s + 's'; };

export class AldeaGame {
  constructor(game) { this.game = game; this.scene = 'aldea'; this.view = null; this.mode = 'home'; this.sel = null; this.ghost = null; this.raid = null; this.pending = []; this.speed = 1; this.cursor = { x: 12, y: 23, show: false }; }
  get st() { return this.game.state; }
  get A() { return aldeaState(this.st); }
  pic(sp) { return this.game.graphics?.portrait(sp) || iconURL(sp); }
  save() { saveState(this.st); }
  run() {
    tick(this.A); this.save();
    this.buildHud();
    return new Promise(res => { this.exit = res; });
  }
  // ---------- Pantalla de la aldea ----------
  buildHud() {
    this.destroyHud();
    const el = document.createElement('div'); el.id = 'aldeaHud';
    el.innerHTML = `<div class="al-layer"></div>
      <div class="al-top"><div class="al-res"><span class="al-plata" title="Plata (la misma de Puchamon)">💰 <b></b></span><span class="al-bayas" title="Bayas"><i></i>🍓 <b></b></span></div>
        <div class="al-info"><span class="al-casa"></span><span class="al-build"></span></div></div>
      <div class="al-tags"></div>
      <div class="al-bottom al-home"><button data-a="build">🏗️ CONSTRUIR</button><button data-a="army">🐾 EJÉRCITO</button><button data-a="attack" class="hot">⚔️ ATACAR</button><button data-a="exit" class="soft">SALIR</button></div>
      <div class="al-bottom al-place hidden"><span>Toca dónde ponerlo</span><button data-a="ok" class="hot">✔ PONER</button><button data-a="cancel" class="soft">✖ CANCELAR</button></div>
      <div class="al-raid hidden"><div class="al-rtop"><div class="al-pct"><b>0%</b><small>DESTRUIDO</small></div><div class="al-stars"><i></i><i></i><i></i></div><div class="al-clock"><small>TIEMPO</small><b>2:30</b></div></div>
        <div class="al-troops"></div><button data-a="end" class="al-end">TERMINAR</button></div>`;
    document.getElementById('ui').appendChild(el);
    this.hud = el; const $ = s => el.querySelector(s);
    this.h = { plata: $('.al-plata b'), bayas: $('.al-bayas b'), bayasBar: $('.al-bayas i'), casa: $('.al-casa'), build: $('.al-build'), tags: $('.al-tags'), home: $('.al-bottom.al-home'), place: $('.al-bottom.al-place'), raid: $('.al-raid'), troops: $('.al-troops'), pct: $('.al-pct b'), stars: [...el.querySelectorAll('.al-stars i')], clock: $('.al-clock b') };
    el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) this.act(b.dataset.a); });
    el.addEventListener('pointerdown', e => { const t = e.target.closest('[data-tag]'); if (t) { e.preventDefault(); this.tagTap(+t.dataset.tag); } });
    const layer = $('.al-layer');
    layer.addEventListener('pointerdown', e => { e.preventDefault(); this.down = { x: e.clientX, y: e.clientY, id: e.pointerId }; this.tapGround(e.clientX, e.clientY, false); });
    this.onMove = e => { if (this.down && e.pointerId === this.down.id && this.mode === 'place') this.tapGround(e.clientX, e.clientY, true); if (this.mode === 'raid' && this.raidSel >= 0 && e.pointerType === 'mouse') this.aim(e.clientX, e.clientY); };
    this.onUp = e => { if (this.down && e.pointerId === this.down.id) this.down = null; };
    addEventListener('pointermove', this.onMove); addEventListener('pointerup', this.onUp);
    this.hudUpdate(true);
  }
  destroyHud() { if (!this.hud) return; removeEventListener('pointermove', this.onMove); removeEventListener('pointerup', this.onUp); this.hud.remove(); this.hud = null; this.tagEls?.clear(); }
  setMode(m) {
    this.mode = m;
    this.h.home.classList.toggle('hidden', m !== 'home'); this.h.place.classList.toggle('hidden', m !== 'place'); this.h.raid.classList.toggle('hidden', m !== 'raid');
    this.h.tags.classList.toggle('hidden', m === 'raid'); this.hud.classList.toggle('raiding', m === 'raid');
  }
  act(a) {
    if (ui.panel?.modal && !['ok', 'cancel'].includes(a)) return;
    ({ build: () => this.shop(), army: () => this.army(), attack: () => this.attack(), exit: () => this.leave(), ok: () => this.confirmPlace(), cancel: () => this.cancelPlace(), end: () => this.endRaid() })[a]?.();
  }
  leave() { this.save(); ui.closePanel(); this.destroyHud(); this.exit?.(); }
  hudUpdate(force = false) {
    const A = this.A, h = this.h; if (!h) return;
    const now = Date.now();
    if (force || now - (this.lastTick || 0) > 1000) { this.lastTick = now; tick(A, now); }
    h.plata.textContent = money(this.st.money).replace('$', '');
    const cap = bayasCap(A); h.bayas.textContent = `${Math.floor(A.bayas)} / ${cap}`; h.bayasBar.style.width = Math.min(100, A.bayas / cap * 100) + '%';
    h.casa.textContent = `🏠 Casa Grande nv ${casaLevel(A)}`; h.build.textContent = `🔨 ${A.builders - busyBuilders(A, now)}/${A.builders} libres`;
    if (this.mode === 'raid' || !this.view) return;
    // Etiquetas encima de los edificios: lo que hay para recoger y lo que falta de las obras. Se actualizan en su
    // sitio (sin rehacerlas) para que un toque nunca caiga en una etiqueta que se acaba de reemplazar.
    this.tagEls ??= new Map(); const seen = new Set();
    for (const b of A.buildings) {
      const kind = b.upg ? 'work' : B[b.kind].prod && (b.store || 0) >= 1 ? 'take' : null; if (!kind) continue;
      const key = b.id + kind; seen.add(key);
      let el = this.tagEls.get(key);
      if (!el) { el = document.createElement(kind === 'take' ? 'button' : 'span'); el.className = 'al-tag ' + kind; if (kind === 'take') el.dataset.tag = b.id; h.tags.appendChild(el); this.tagEls.set(key, el); }
      const s = B[b.kind].size, p = this.view.fieldToScreen(b.x + s / 2, b.y + s / 2, b.kind === 'muro' ? 1.2 : 3.2);
      const tf = `translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-100%)`; if (el.style.transform !== tf) el.style.transform = tf;
      const txt = kind === 'work' ? `🔨 ${fmtTime((b.upg.done - now) / 1000)}` : `${b.kind === 'mina' ? '💰' : '🍓'} ${Math.floor(b.store)}`; if (el.textContent !== txt) el.textContent = txt;
      if (kind === 'take') el.classList.toggle('full', b.store >= B[b.kind].cap[b.level - 1]);
    }
    for (const [key, el] of this.tagEls) if (!seen.has(key)) { el.remove(); this.tagEls.delete(key); }
  }
  tagTap(id) { const b = this.A.buildings.find(x => x.id === id); if (!b) return; const got = collect(this.A, b, this.st); this.game.toast(got ? `+${b.kind === 'mina' ? money(got) : got + ' bayas'}` : 'El granero está lleno: construye o sube un granero'); this.save(); this.hudUpdate(); if (this.sel === id) this.info(b); }
  cellAt(px, py) { const p = this.view?.screenToField(px, py); return p ? { x: p.x, y: p.y } : null; }
  tapGround(px, py, dragging) {
    const p = this.cellAt(px, py); if (!p) return;
    if (this.mode === 'place') { const s = B[this.ghost.kind].size; this.ghost.x = Math.max(1, Math.min(GRID - 1 - s, Math.round(p.x - s / 2))); this.ghost.y = Math.max(1, Math.min(GRID - 1 - s, Math.round(p.y - s / 2))); return; }
    if (this.mode === 'raid') { this.aim(px, py); this.deployAt(); return; }
    if (dragging || ui.panel?.modal) return;
    const b = this.A.buildings.find(b => p.x >= b.x && p.x < b.x + B[b.kind].size && p.y >= b.y && p.y < b.y + B[b.kind].size);
    if (!b) { this.sel = null; ui.closePanel(); return; }
    this.sel = b.id; this.info(b);
  }
  // Panel de un edificio: qué hace, recoger, mejorar, terminar ya y mover.
  info(b) {
    const A = this.A, D = B[b.kind], now = Date.now(), lv = b.level, next = lv < maxLevel(A, b.kind) ? lv : null;
    const lines = [];
    if (D.prod) lines.push(`Produce ${D.prod[Math.max(0, lv - 1)]} ${b.kind === 'mina' ? 'de plata' : 'bayas'} por minuto · guarda hasta ${D.cap[Math.max(0, lv - 1)]}`);
    if (D.store) lines.push(`Guarda ${D.store[Math.max(0, lv - 1)]} bayas`);
    if (D.space) lines.push(`Espacio para ${D.space[Math.max(0, lv - 1)]} en tu ejército`);
    if (D.dmg) lines.push(`Daño ${D.dmg[Math.max(0, lv - 1)]} · alcance ${D.range} · ${D.air ? 'tierra y aire' : 'sólo tierra'}`);
    const block = upgradeBlock(A, b, this.st, now);
    const upTxt = b.upg ? '' : next !== null ? `<button data-act="up"${block ? ' class="off"' : ' class="primary"'}>MEJORAR A NV ${lv + 1} · ${money(D.cost[lv])}${D.time[lv] ? ' · ' + fmtTime(D.time[lv]) : ''}</button>${block ? `<small class="hint">${esc(block)}</small>` : ''}` : `<small class="hint">${b.kind === 'casa' ? 'Nivel máximo' : 'Sube la Casa Grande para mejorarlo más'}</small>`;
    ui.setPanel(`<h3 class="ph">${ICON[b.kind]} ${esc(D.name)} <small>nv ${Math.max(1, lv)}</small></h3><p class="hint">${esc(D.desc)}</p>${lines.map(l => `<p class="al-line">${esc(l)}</p>`).join('')}
      ${b.upg ? `<p class="al-line work">🔨 En obra: falta ${fmtTime((b.upg.done - now) / 1000)}</p><button data-act="rush" class="primary">TERMINAR YA · ${money(rushCost(b, now))}</button>` : ''}
      ${D.prod && !b.upg ? `<button data-act="take">RECOGER ${Math.floor(b.store || 0)}</button>` : ''}
      ${upTxt}<div class="row2">${b.kind !== 'casa' || true ? '<button data-act="move">MOVER</button>' : ''}<button class="bt-back" data-back>CERRAR</button></div>`,
    { cls: 'aldea-panel', onAct: a => {
      if (a === 'take') return this.tagTap(b.id);
      if (a === 'up') { if (upgrade(A, b, this.st)) { this.game.toast(b.upg ? `Obra empezada: ${D.name} nv ${b.upg.to}` : `${D.name} subió a nv ${b.level}`); this.save(); } else this.game.toast(upgradeBlock(A, b, this.st) || 'No se pudo'); return this.info(b); }
      if (a === 'rush') { if (rush(A, b, this.st)) { this.game.toast(`¡Listo! ${D.name} nv ${b.level}`); this.save(); } else this.game.toast('Te falta plata para terminar ya'); return this.info(b); }
      if (a === 'move') { ui.closePanel(); this.startPlace(b.kind, b); }
    }, onBack: () => { this.sel = null; ui.closePanel(); } });
  }
  // ---------- Construir ----------
  shop() {
    const A = this.A, st = this.st;
    const rows = KINDS.filter(k => k !== 'casa').map(k => {
      const D = B[k], block = buildBlock(A, k, st);
      return `<button data-act="b:${k}" class="al-shop${block ? ' off' : ''}"><span class="al-ico">${ICON[k]}</span><b>${esc(D.name)}</b><small>${countOf(A, k)}/${limitOf(A, k)} · ${money(D.cost[0])}${D.time[0] ? ' · ' + fmtTime(D.time[0]) : ''}</small><em>${esc(block || D.desc)}</em></button>`;
    }).join('');
    ui.setPanel(`<h3 class="ph">CONSTRUIR <small>💰 ${money(st.money)}</small></h3><div class="al-shoplist">${rows}</div><button class="bt-back" data-back>VOLVER</button>`,
      { modal: true, cls: 'aldea-panel wide', onAct: a => { const k = a.slice(2), why = buildBlock(A, k, st); if (why) { this.game.toast(why); return; } ui.closePanel(); this.startPlace(k); }, onBack: () => ui.closePanel() });
  }
  startPlace(kind, moving = null) {
    const s = B[kind].size; let x = moving ? moving.x : Math.round(GRID / 2 - s / 2), y = moving ? moving.y : GRID - 2 - s;
    // Primer hueco libre cerca del centro si no cabe ahí.
    if (!moving && !fits(this.A, kind, x, y)) { outer: for (let r = 0; r < GRID; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (fits(this.A, kind, x + dx, y + dy)) { x += dx; y += dy; break outer; } }
    this.ghost = { kind, x, y, level: moving ? moving.level : 1, moving: moving?.id || null };
    this.sel = null; this.setMode('place');
  }
  confirmPlace() {
    const g = this.ghost; if (!g) return;
    if (g.moving) { const b = this.A.buildings.find(b => b.id === g.moving); if (!b || !move(this.A, b, g.x, g.y)) { this.game.toast('Ahí no cabe'); return; } this.game.toast('Movido'); }
    else { const b = build(this.A, g.kind, g.x, g.y, this.st); if (!b) { this.game.toast(fits(this.A, g.kind, g.x, g.y) ? buildBlock(this.A, g.kind, this.st) || 'No se pudo' : 'Ahí no cabe'); return; } this.game.toast(b.upg ? `Obra empezada: ${B[g.kind].name}` : `${B[g.kind].name} listo`); if (g.kind === 'muro' && !buildBlock(this.A, 'muro', this.st)) { this.save(); this.ghost = { ...g, x: Math.min(GRID - 2, g.x + 1) }; return; } }
    this.save(); this.ghost = null; this.setMode('home');
  }
  cancelPlace() { this.ghost = null; this.setMode('home'); }
  // ---------- Ejército ----------
  army() {
    const A = this.A, cards = troopCards(this.st), list = Object.values(cards).sort((a, b) => b.level - a.level);
    const draw = () => {
      const used = armyUsed(A, cards), space = armySpace(A);
      const rows = list.length ? list.map(c => `<div class="al-troop" style="--t:${TYPES[c.types[0]]?.color || '#888'}"><img src="${this.pic(c.sp)}" alt=""><div><b>${esc(c.name)} <small>nv ${c.level}</small></b><small>${esc(cardRole(c))} · espacio ${c.cost} · ${c.cost * TRAIN_COST} bayas</small></div><button data-act="m:${c.sp}"${A.army[c.sp] ? '' : ' class="off"'}>−</button><b class="al-n">${A.army[c.sp] || 0}</b><button data-act="p:${c.sp}" class="primary">+</button></div>`).join('') : '<p class="empty">Atrapa Puchamon en la aventura para entrenarlos aquí.</p>';
      ui.setPanel(`<h3 class="ph">EJÉRCITO <small>${used}/${space} espacio · 🍓 ${Math.floor(A.bayas)}</small></h3><div class="al-cap"><i style="width:${space ? Math.min(100, used / space * 100) : 0}%"></i></div><p class="hint">Entrena copias de tus Puchamon con bayas. Los que sueltes en un ataque se gastan.</p><div class="al-troops-list">${rows}</div><button class="bt-back" data-back>LISTO</button>`,
        { modal: true, cls: 'aldea-panel wide', onAct: a => {
          const c = cards[a.slice(2)]; if (!c) return;
          if (a[0] === 'p') { if (!train(A, c, cards)) this.game.toast(trainBlock(A, c) || 'El corral está lleno: sube o construye un corral'); }
          else untrain(A, c);
          this.save(); const i = ui.panel?.index; draw(); if (ui.panel && i !== undefined) { ui.panel.index = i; ui.paintFocus(); }
        }, onBack: () => ui.closePanel() });
    };
    draw();
  }
  // ---------- Ataque ----------
  async attack() {
    const A = this.A, cards = troopCards(this.st);
    const army = Object.entries(A.army).filter(([sp, n]) => n > 0 && cards[sp]).map(([sp, n]) => ({ card: cards[sp], count: n }));
    if (!army.length) { this.game.toast('Entrena Puchamon en EJÉRCITO para atacar'); return this.army(); }
    const avg = army.reduce((a, x) => a + x.card.level * x.count, 0) / army.reduce((a, x) => a + x.count, 0);
    const rnd = rng((Date.now() ^ (A.raids * 7919)) >>> 0);
    const lv = Math.max(1, Math.min(5, casaLevel(A) + (rnd() < .25 ? 1 : 0)));
    const village = enemyVillage(lv, avg, rnd);
    ui.closePanel(); this.sel = null;
    this.raid = new RaidSim({ village, army, seed: Math.floor(rnd() * 1e9) }); this.raidStart = army.map(a => ({ sp: a.card.sp, count: a.count }));
    this.view?.dispose(); this.view = null; this.enemy = true; this.raidSel = 0; this.pending = [];
    this.setMode('raid'); this.drawTroops();
    this.game.toast(`Aldea rival nv ${lv} · botín hasta 💰${village.loot.plata} y 🍓${village.loot.bayas}`);
  }
  drawTroops() {
    const sim = this.raid; if (!sim) return;
    this.h.troops.innerHTML = sim.army.map((a, i) => `<button class="al-tb${i === this.raidSel ? ' sel' : ''}${a.count ? '' : ' empty'}" data-t="${i}" style="--t:${TYPES[a.card.types[0]]?.color || '#888'}"><img src="${this.pic(a.card.sp)}" alt=""><b>×${a.count}</b></button>`).join('');
    this.h.troops.querySelectorAll('.al-tb').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); this.raidSel = +b.dataset.t; this.drawTroops(); }));
  }
  aim(px, py) { const p = this.cellAt(px, py); if (!p) return; this.cursor.x = p.x; this.cursor.y = p.y; this.cursor.show = true; }
  deployAt() {
    const sim = this.raid; if (!sim || sim.phase !== 'play') return;
    const a = sim.army[this.raidSel]; if (!a || a.count <= 0) { const i = sim.army.findIndex(x => x.count > 0); if (i < 0) return; this.raidSel = i; }
    if (!sim.deploy(this.raidSel, this.cursor.x, this.cursor.y)) { this.game.toast('Ahí no: suéltalo fuera de la zona roja'); return; }
    if (sim.army[this.raidSel].count <= 0) { const i = sim.army.findIndex(x => x.count > 0); if (i >= 0) this.raidSel = i; }
    this.drawTroops();
  }
  endRaid() { if (this.raid && this.raid.phase === 'play') this.raid.finish(); }
  async raidDone() {
    const sim = this.raid, A = this.A, s = sim.spoils();
    // Los que se soltaron se gastan; los que quedaron vuelven al corral.
    for (const a of sim.army) { if (a.count > 0) A.army[a.card.sp] = a.count; else delete A.army[a.card.sp]; }
    const bayas = Math.min(s.bayas, Math.max(0, bayasCap(A) - A.bayas));
    this.st.money += s.plata; A.bayas += bayas; A.raids++; A.stars += s.stars; if (s.stars > 0) A.wins++;
    this.save();
    await new Promise(r => setTimeout(r, 900));
    await new Promise(resolve => ui.setPanel(`<div class="ar-result ${s.stars ? 'win' : 'lose'}"><b class="ar-title">${s.stars ? '¡VICTORIA!' : 'DERROTA'}</b>
      <div class="al-stars big">${[0, 1, 2].map(i => `<i class="${i < s.stars ? 'on' : ''}"></i>`).join('')}</div><p class="al-line">${s.pct}% destruido</p>
      <div class="ar-prize"><span>💰 +${money(s.plata)}</span><span>🍓 +${bayas}${bayas < s.bayas ? ' (granero lleno)' : ''}</span></div>
      <p class="hint">La plata ya está en tu partida de Puchamon.</p><button data-act="ok" class="primary">VOLVER A MI ALDEA</button></div>`,
      { modal: true, cls: 'arena-panel', onAct: resolve, onBack: resolve }));
    ui.closePanel();
    this.raid = null; this.enemy = false; this.view?.dispose(); this.view = null; this.cursor.show = false; this.setMode('home'); this.hudUpdate(true);
  }
  raidHud() {
    const sim = this.raid, h = this.h; if (!sim) return;
    const pct = sim.pct() + '%'; if (h.pct.textContent !== pct) h.pct.textContent = pct;
    const st = sim.stars(); h.stars.forEach((s, i) => s.classList.toggle('on', i < st));
    const left = Math.ceil(sim.left()), txt = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (h.clock.textContent !== txt) h.clock.textContent = txt;
  }
  keys() {
    if (ui.dialog || ui.panel?.modal) return;
    if (this.mode === 'place') {
      const g = this.ghost, s = B[g.kind].size, d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      for (const k in d) if (input.hit(k)) { g.x = Math.max(1, Math.min(GRID - 1 - s, g.x + d[k][0])); g.y = Math.max(1, Math.min(GRID - 1 - s, g.y + d[k][1])); }
      if (input.hit('a')) this.confirmPlace(); if (input.hit('b') || input.hit('start')) this.cancelPlace();
    } else if (this.mode === 'raid') {
      const d = { up: [0, -.5], down: [0, .5], left: [-.5, 0], right: [.5, 0] };
      for (const k in d) if (input.hit(k)) { this.cursor.x = Math.max(.3, Math.min(GRID - .3, this.cursor.x + d[k][0])); this.cursor.y = Math.max(.3, Math.min(GRID - .3, this.cursor.y + d[k][1])); this.cursor.show = true; }
      if (input.hit('a')) this.deployAt();
    } else if (this.mode === 'home' && !ui.panel && (input.hit('start') || input.hit('b'))) this.leave();
  }
  update(dt) {
    this.keys();
    if (this.mode === 'raid' && this.raid) {
      for (let i = 0; i < this.speed; i++) this.raid.step(dt);
      if (this.raid.events.length) { this.pending.push(...this.raid.events); this.raid.events.length = 0; }
      this.raidHud();
      if (this.raid.phase === 'done' && !this.finishing) { this.finishing = true; this.raidDone().finally(() => { this.finishing = false; }); }
      return;
    }
    this.hudUpdate();
  }
  async viewClass() { const { AldeaView } = await import('../../render3d/aldea3d.js'); return AldeaView; }
  draw3d(engine, dt) {
    if (!this.View) { if (!this.loading) this.loading = this.viewClass().then(V => { this.View = V; }); return null; }
    if (!this.view) { this.view = new this.View(engine, { enemy: !!this.enemy, biome: this.enemy ? 'jungle' : 'meadow' }); if (this.raid) this.view.startRaid(this.raid); }
    if (this.raid) this.view.syncRaid(this.raid, this.pending.splice(0), dt, engine.time.value, this.mode === 'raid' ? { ...this.cursor, ok: this.raid.canDeploy(this.cursor.x, this.cursor.y) } : null);
    else {
      const g = this.ghost;
      this.view.syncVillage(this.A, { sel: this.sel, moving: g?.moving, ghost: g ? { ...g, ok: fits(this.A, g.kind, g.x, g.y, g.moving) } : null });
      this.view.stepFx(dt);
    }
    const tall = engine.camera.aspect < 1;
    return this.view.frame(dt, engine.camera.aspect, tall ? { top: .1, bottom: .16, left: .02, right: .02 } : { top: .1, bottom: .14, left: .02, right: .02 });
  }
  render2d(r) {
    const g = r.g; g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, r.w, r.h); g.fillStyle = '#fff'; g.font = '8px monospace'; g.textAlign = 'center';
    g.fillText(this.game.graphics?.status === 'unavailable' ? 'Este juego necesita gráficos 3D' : 'Cargando la aldea 3D...', r.w / 2, r.h / 2); g.textAlign = 'left';
  }
  dispose() { this.destroyHud(); this.view?.dispose(); this.view = null; ui.closePanel(); }
}
