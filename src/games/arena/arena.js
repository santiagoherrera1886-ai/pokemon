// Duelo de Torres: menú del juego, mazo, partida y premios. La lógica vive en sim.js y el dibujo 3D en
// render3d/arena3d.js; aquí se conectan con los toques, el teclado y la partida guardada (la plata es la misma
// de Puchamon). Se entra desde el título (stock de juegos) o desde el menú del juego (JUEGOS).
import { ui, esc, money } from '../../ui/ui.js';
import { input } from '../../core/input.js';
import { saveState } from '../../core/state.js';
import { iconURL } from '../../art/creatures.js';
import { SPECIES, TYPES } from '../../data/creatures.js';
import { ArenaSim, playerDeck, rivalDeck, ownedBest, makeCard, cardRole, arenaOf, arenaState, arenaReward, ARENAS, RIVAL_NAMES, MAX_ENERGY, FIELD, rng } from './sim.js';
export { arenaState, arenaReward };

const fmt = s => { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export class ArenaGame {
  constructor(game) { this.game = game; this.scene = 'arena'; this.sim = null; this.view = null; this.hud = null; this.sel = -1; this.cursor = { x: 9, y: 24, show: false }; this.pending = []; this.speed = 1; }
  get st() { return this.game.state; }
  pic(sp) { return this.game.graphics?.portrait(sp) || iconURL(sp); }
  cardHTML(c, extra = '') {
    const t = TYPES[c.types[0]];
    return `<div class="ar-card${c.loan ? ' loan' : ''}${extra}" style="--t:${t?.color || '#888'}"><img src="${this.pic(c.sp)}" alt=""><b class="ar-cost">${c.cost}</b><span>${esc(c.name)}</span><small>Nv ${c.level}${c.loan ? ' · prestado' : ''}</small></div>`;
  }
  async run() {
    arenaState(this.st);
    for (;;) {
      const a = await this.home();
      if (a === 'exit') return;
      if (a === 'deck') await this.deckEditor();
      if (a === 'play') await this.match();
    }
  }
  home() {
    return new Promise(resolve => {
      const A = arenaState(this.st), ar = arenaOf(A.trophies), next = ARENAS.find(a => a.min > A.trophies);
      const prog = next ? Math.round((A.trophies - ar.min) / (next.min - ar.min) * 100) : 100;
      const deck = playerDeck(this.st);
      ui.setPanel(`<div class="ar-home">
        <div class="ar-head"><div><small>DUELO DE TORRES</small><b>${esc(ar.name)}</b></div><div class="ar-tro">🏆 ${A.trophies}</div></div>
        <div class="ar-progress"><i style="width:${prog}%"></i><span>${next ? `${next.min - A.trophies} trofeos para ${esc(next.name)}` : '¡Llegaste a la última arena!'}</span></div>
        <div class="ar-deck">${deck.map(c => this.cardHTML(c)).join('')}</div>
        <p class="hint">Gana plata para Puchamon y trofeos. Tu plata: <b>${money(this.st.money)}</b> · ${A.wins} ganadas · ${A.losses} perdidas</p>
        <button data-act="play" class="primary ar-play">¡A JUGAR!</button>
        <div class="row2"><button data-act="deck">MAZO</button><button data-act="help">CÓMO SE JUEGA</button></div>
        <button class="bt-back" data-back>SALIR</button></div>`,
      { modal: true, cls: 'arena-panel', focus: 0, onAct: a => { if (a === 'help') return this.help().then(() => this.home().then(resolve)); resolve(a); }, onBack: () => resolve('exit') });
    });
  }
  async help() {
    ui.closePanel();
    await ui.say(['Duelo de Torres: tumba las torres del rival con tus Puchamon. Cada carta cuesta energía (la barra de abajo se llena sola).',
      'Toca una carta y luego toca tu mitad del campo (o arrástrala). Tus Puchamon cruzan el río por los puentes y atacan solos.',
      'Cada torre vale una corona; la torre del centro vale la partida. A los 2 minutos la energía va el doble de rápido.',
      'Los tipos cuentan: fuego le gana a planta, agua a fuego... Los voladores pasan el río y sólo les pegan los que atacan a distancia.',
      'Con teclado: 1 a 4 escogen carta, flechas mueven el punto y Z o Enter la sueltan.']);
  }
  // ---------- Mazo ----------
  deckEditor() {
    return new Promise(resolve => {
      const st = this.st, A = arenaState(st), best = ownedBest(st);
      const all = Object.values(best).sort((a, b) => b.level - a.level);
      let pick = playerDeck(st).filter(c => !c.loan).map(c => c.sp);
      const draw = () => {
        const list = all.length ? all.map(c => { const card = makeCard(c.sp, c.level), on = pick.includes(c.sp); return `<button data-act="sp:${c.sp}" class="ar-pick${on ? ' on' : ''}">${this.cardHTML(card)}<em>${esc(cardRole(card))}</em></button>`; }).join('') : '<p class="empty">Todavía no tienes Puchamon: juega con prestados o atrapa criaturas en la aventura.</p>';
        ui.setPanel(`<h3 class="ph">MAZO <small>${pick.length}/8</small></h3><p class="hint">Escoge hasta 8 de tus Puchamon (la más fuerte de cada especie). Si faltan, se completan con prestados.</p>
          <div class="ar-picks">${list}</div><button data-act="ok" class="primary">LISTO</button><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'arena-panel wide', onAct: a => {
          if (a === 'ok') { A.deck = pick.slice(0, 8); saveState(st); return resolve(); }
          const sp = a.slice(3); if (pick.includes(sp)) pick = pick.filter(x => x !== sp); else if (pick.length < 8) pick.push(sp); else this.game.toast('El mazo ya tiene 8: quita uno primero');
          const i = ui.panel?.index; draw(); if (ui.panel && i !== undefined) { ui.panel.index = i; ui.paintFocus(); }
        }, onBack: () => resolve() });
      };
      draw();
    });
  }
  // ---------- Partida ----------
  async match() { while (await this.playOne()) { /* JUGAR OTRA */ } }
  async playOne() {
    const st = this.st, A = arenaState(st), rnd = rng((Date.now() ^ (A.wins * 977 + A.losses * 131)) >>> 0);
    const deckA = playerDeck(st), avg = deckA.reduce((a, c) => a + c.level, 0) / deckA.length, deckB = rivalDeck(A.trophies, rnd, avg);
    this.rival = { name: RIVAL_NAMES[Math.floor(rnd() * RIVAL_NAMES.length)], trophies: Math.max(0, A.trophies + Math.round((rnd() - .5) * 80)) };
    this.arena = arenaOf(A.trophies);
    this.sim = new ArenaSim({ decks: [deckA, deckB], seed: Math.floor(rnd() * 1e9), skill: Math.min(.95, .25 + A.trophies / 2000) });
    ui.closePanel(); this.view?.dispose(); this.view = null; this.pending = [];
    this.sel = -1; this.cursor.show = false; this.paused = false;
    this.buildHud();
    await this.banner('¡3!', 650); await this.banner('¡2!', 650); await this.banner('¡1!', 650); this.banner('¡A JUGAR!', 900);
    this.playing = true;
    await new Promise(res => { this.onEnd = res; });
    this.playing = false; this.select(-1);
    const sim = this.sim, w = sim.winner;
    await this.banner(w === 0 ? '¡GANASTE!' : w === 1 ? 'PERDISTE' : 'EMPATE', 1600);
    const r = arenaReward(A.trophies, w, sim.crowns[0], sim.crowns[1]);
    A.trophies = Math.max(0, A.trophies + r.trophies); A.best = Math.max(A.best, A.trophies);
    if (w === 0) A.wins++; else if (w === 1) A.losses++; else A.draws++;
    st.money += r.money; if (r.capsules) st.bag.capsula = (st.bag.capsula || 0) + r.capsules;
    saveState(st);
    this.destroyHud();
    const again = await this.results(w, r, sim);
    this.sim = null;
    return again;
  }
  results(w, r, sim) {
    return new Promise(resolve => {
      const crowns = n => [0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
      ui.setPanel(`<div class="ar-result ${w === 0 ? 'win' : w === 1 ? 'lose' : 'draw'}">
        <b class="ar-title">${w === 0 ? '¡GANASTE!' : w === 1 ? 'PERDISTE' : 'EMPATE'}</b>
        <div class="ar-vs"><div><small>TÚ</small><span class="ar-crowns blue">${crowns(sim.crowns[0])}</span></div><em>VS</em><div><small>${esc(this.rival.name.toUpperCase())}</small><span class="ar-crowns red">${crowns(sim.crowns[1])}</span></div></div>
        <div class="ar-prize"><span>🏆 ${r.trophies >= 0 ? '+' : ''}${r.trophies}</span><span>💰 +${money(r.money)}</span>${r.capsules ? `<span>+${r.capsules} cápsulas</span>` : ''}</div>
        <p class="hint">La plata ya está en tu partida de Puchamon. Trofeos: ${arenaState(this.st).trophies}</p>
        <button data-act="again" class="primary">JUGAR OTRA</button><button class="bt-back" data-back>VOLVER</button></div>`,
      { modal: true, cls: 'arena-panel', onAct: () => resolve(true), onBack: () => resolve(false) });
    });
  }
  // ---------- Pantalla de la partida (HTML encima del 3D) ----------
  buildHud() {
    this.destroyHud();
    const el = document.createElement('div'); el.id = 'arenaHud';
    el.innerHTML = `<div class="ah-layer"></div>
      <div class="ah-top"><div class="ah-foe"><b>${esc(this.rival.name)}</b><small>🏆 ${this.rival.trophies}</small><span class="ah-crowns red"><i></i><i></i><i></i></span></div>
        <div class="ah-clock"><small>TIEMPO</small><b>3:00</b></div></div>
      <div class="ah-me"><span class="ah-crowns blue"><i></i><i></i><i></i></span></div>
      <button class="ah-pause" aria-label="Pausa">II</button>
      <div class="ah-towers">${this.sim.towers.map(t => `<span class="ah-tw s${t.side}${t.kind === 'king' ? ' king' : ''}" data-t="${t.id}"><i></i><b></b></span>`).join('')}</div>
      <div class="ah-bottom"><div class="ah-next"><small>SIGUE</small><img alt=""></div>
        <div class="ah-hand">${[0, 1, 2, 3].map(i => `<button class="ah-card" data-slot="${i}"><img alt=""><b class="ar-cost"></b><small></small></button>`).join('')}</div>
        <div class="ah-energy"><div class="ah-bar"><i></i><u></u></div><b>5</b></div></div>
      <div class="ah-banner hidden"></div><img class="ah-ghost hidden" alt="">`;
    document.getElementById('ui').appendChild(el);
    this.hud = el; this.hudCache = {};
    const $ = s => el.querySelector(s);
    this.h = { layer: $('.ah-layer'), clock: $('.ah-clock b'), clockBox: $('.ah-clock'), bar: $('.ah-bar i'), energy: $('.ah-energy b'), next: $('.ah-next img'), banner: $('.ah-banner'), ghost: $('.ah-ghost'),
      cards: [...el.querySelectorAll('.ah-card')], towers: [...el.querySelectorAll('.ah-tw')], meCrowns: [...el.querySelectorAll('.ah-me i')], foeCrowns: [...el.querySelectorAll('.ah-foe i')] };
    // Toques: tocar carta y luego el campo, o arrastrar la carta hasta el campo.
    const onCardDown = e => {
      e.preventDefault(); const slot = +e.currentTarget.dataset.slot;
      if (this.sel === slot && !this.drag) { this.select(-1); return; }
      this.select(slot); this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
    };
    this.h.cards.forEach(c => c.addEventListener('pointerdown', onCardDown));
    this.onMove = e => {
      if (!this.drag || e.pointerId !== this.drag.id) { if (this.sel >= 0 && e.pointerType === 'mouse') this.aim(e.clientX, e.clientY); return; }
      if (Math.hypot(e.clientX - this.drag.x0, e.clientY - this.drag.y0) > 14) this.drag.moved = true;
      if (this.drag.moved) { this.aim(e.clientX, e.clientY); const g = this.h.ghost; g.classList.remove('hidden'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
    };
    this.onUp = e => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const moved = this.drag.moved; this.drag = null; this.h.ghost.classList.add('hidden');
      if (moved) { const over = document.elementFromPoint(e.clientX, e.clientY); if (over && over.closest('.ah-bottom')) { this.cursor.show = false; return; } this.placeAt(e.clientX, e.clientY); }
    };
    addEventListener('pointermove', this.onMove); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp);
    this.h.layer.addEventListener('pointerdown', e => { e.preventDefault(); if (this.sel >= 0) this.placeAt(e.clientX, e.clientY); });
    el.querySelector('.ah-pause').addEventListener('click', () => this.pause());
    this.onKey = e => { if (!this.playing || this.paused || ui.dialog || ui.panel) return; const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code]; if (n !== undefined) { e.preventDefault(); this.select(this.sel === n ? -1 : n); if (this.sel >= 0) this.cursor.show = true; } };
    addEventListener('keydown', this.onKey);
    this.hudUpdate(true);
  }
  destroyHud() {
    if (!this.hud) return;
    removeEventListener('pointermove', this.onMove); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp); removeEventListener('keydown', this.onKey);
    this.hud.remove(); this.hud = null; this.drag = null;
  }
  select(slot) {
    this.sel = slot;
    this.h?.cards.forEach((c, i) => c.classList.toggle('sel', i === slot));
    if (slot < 0) this.cursor.show = false;
    else { const c = this.sim?.card(0, slot); if (c) this.h.ghost.src = this.pic(c.sp); }
  }
  aim(px, py) { const p = this.view?.screenToField(px, py); if (!p) return; this.cursor.x = p.x; this.cursor.y = p.y; this.cursor.show = true; }
  placeAt(px, py) { this.aim(px, py); this.place(); }
  place() {
    const sim = this.sim, slot = this.sel; if (!sim || slot < 0 || !this.playing || this.paused) return false;
    const c = sim.card(0, slot), { x, y } = this.cursor;
    if (!c) return false;
    if (sim.energy[0] < c.cost) { this.game.toast(`Te falta energía: ${c.name} cuesta ${c.cost}`); return false; }
    if (!sim.canPlace(0, x, y)) { this.game.toast('Ahí no: suéltala en tu mitad del campo'); return false; }
    sim.play(0, slot, x, y); this.select(-1);
    return true;
  }
  async pause() {
    if (!this.playing || this.paused) return;
    this.paused = true; this.select(-1);
    const i = await ui.ask('Partida en pausa.', ['Seguir jugando', 'Rendirse (cuenta como perdida)']);
    ui.hideMsg(); this.paused = false;
    if (i === 1 && this.sim) { for (const t of this.sim.towers) if (t.side === 0 && t.kind === 'king') { t.hp = 1; this.sim.damage(t, 99); } }
  }
  banner(text, ms) {
    const b = this.h?.banner; if (!b) return Promise.resolve();
    b.textContent = text; b.classList.remove('hidden', 'pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(this.bannerT);
    return new Promise(res => { this.bannerT = setTimeout(() => { b.classList.add('hidden'); res(); }, ms); });
  }
  hudUpdate(force = false) {
    const sim = this.sim, h = this.h, C = this.hudCache; if (!sim || !h) return;
    const left = fmt(sim.left()); if (C.clock !== left || force) { C.clock = left; h.clock.textContent = left; h.clockBox.classList.toggle('hurry', sim.left() <= 60 || sim.overtime); }
    const e = sim.energy[0]; h.bar.style.width = e / MAX_ENERGY * 100 + '%'; const ei = Math.floor(e); if (C.e !== ei || force) { C.e = ei; h.energy.textContent = ei; }
    for (let i = 0; i < 4; i++) {
      const c = sim.card(0, i), el = h.cards[i], key = c ? c.sp + c.level : '';
      if (C['c' + i] !== key || force) { C['c' + i] = key; if (c) { el.querySelector('img').src = this.pic(c.sp); el.querySelector('.ar-cost').textContent = c.cost; el.querySelector('small').textContent = c.name; el.style.setProperty('--t', TYPES[c.types[0]]?.color || '#888'); } }
      el.classList.toggle('poor', !c || c.cost > e);
    }
    const n = sim.next(0); if (n && C.next !== n.sp) { C.next = n.sp; h.next.src = this.pic(n.sp); }
    h.meCrowns.forEach((c, i) => c.classList.toggle('on', i < sim.crowns[0])); h.foeCrowns.forEach((c, i) => c.classList.toggle('on', i < sim.crowns[1]));
    // Vida de las torres encima de cada una.
    for (const el of h.towers) {
      const t = sim.towers.find(x => x.id === el.dataset.t); if (!t || !this.view) continue;
      if (t.hp <= 0) { el.classList.add('down'); continue; }
      const p = this.view.fieldToScreen(t.x, t.y, t.kind === 'king' ? 5.1 : 4.4);
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      el.querySelector('i').style.width = t.hp / t.max * 100 + '%';
      const hp = Math.ceil(t.hp); if (el.dataset.hp !== String(hp)) { el.dataset.hp = hp; el.querySelector('b').textContent = hp; }
      el.classList.toggle('sleep', t.kind === 'king' && !t.active);
    }
  }
  keys() {
    if (!this.playing || this.paused || ui.dialog || ui.panel) return;
    if (input.hit('start') || input.hit('b')) { if (this.sel >= 0) this.select(-1); else this.pause(); return; }
    if (this.sel < 0) return;
    const step = .5, d = { up: [0, -step], down: [0, step], left: [-step, 0], right: [step, 0] };
    for (const k of Object.keys(d)) if (input.hit(k)) { this.cursor.x = Math.max(.6, Math.min(FIELD.w - .6, this.cursor.x + d[k][0])); this.cursor.y = Math.max(.8, Math.min(FIELD.h - .8, this.cursor.y + d[k][1])); this.cursor.show = true; }
    if (input.hit('a')) this.place();
  }
  // Lo llama el bucle del juego 60 veces por segundo.
  update(dt) {
    this.keys();
    if (!this.sim || !this.playing || this.paused) return;
    for (let i = 0; i < this.speed; i++) this.sim.step(dt);
    if (this.sim.events.length) { for (const ev of this.sim.events) { if (ev.type === 'overtime') this.banner('¡MUERTE SÚBITA! La primera torre gana', 2200); if (ev.type === 'tower') this.banner(ev.side === 1 ? '¡Tumbaste una torre!' : 'Te tumbaron una torre', 1300); } this.pending.push(...this.sim.events); this.sim.events.length = 0; }
    if (!this.dbl && this.sim.doubleEnergy() && !this.sim.overtime) { this.dbl = true; this.banner('¡ENERGÍA DOBLE!', 1600); }
    this.hudUpdate();
    if (this.sim.phase === 'done' && this.onEnd) { const f = this.onEnd; this.onEnd = null; this.dbl = false; f(); }
  }
  cursorInfo() {
    const sim = this.sim, c = this.sel >= 0 && sim ? sim.card(0, this.sel) : null;
    const pocket = sim ? [0, 1].map(i => { const t = sim.towers.find(t => t.side === 1 && t.kind === 'side' && (i ? t.x > 9 : t.x < 9)); return t && t.hp <= 0; }) : [false, false];
    return { x: this.cursor.x, y: this.cursor.y, show: this.cursor.show, ok: !!(c && sim.canPlace(0, this.cursor.x, this.cursor.y) && sim.energy[0] >= c.cost), r: c?.r, pocket };
  }
  // Dibujo: el motor 3D llama esto en cada cuadro (también en el menú del juego, con el campo vacío).
  async draw3dInit(engine) { const { ArenaView } = await import('../../render3d/arena3d.js'); return ArenaView; }
  draw3d(engine, dt) {
    if (!this.View) { if (!this.loading) this.loading = this.draw3dInit(engine).then(V => { this.View = V; }); return null; }
    const biome = (this.arena || arenaOf(arenaState(this.st).trophies)).biome;
    if (!this.view || this.view.biome !== biome) { this.view?.dispose(); this.view = new this.View(engine, { biome }); }
    this.view.sync(this.sim, this.pending.splice(0), dt, engine.time.value, this.sim && this.sel >= 0 ? this.cursorInfo() : null);
    const tall = engine.camera.aspect < 1;
    return this.view.frame(dt, engine.camera.aspect, tall ? { top: .1, bottom: .25, left: .03, right: .03 } : { top: .12, bottom: .24, left: .03, right: .03 });
  }
  // Sin 3D (equipo sin WebGL): aviso en la pantalla clásica.
  render2d(r) {
    const g = r.g; g.fillStyle = '#2a3a5a'; g.fillRect(0, 0, r.w, r.h); g.fillStyle = '#fff'; g.font = '8px monospace'; g.textAlign = 'center';
    g.fillText(this.game.graphics?.status === 'unavailable' ? 'Este juego necesita gráficos 3D' : 'Cargando la arena 3D...', r.w / 2, r.h / 2); g.textAlign = 'left';
  }
  dispose() { this.destroyHud(); this.view?.dispose(); this.view = null; this.sim = null; ui.closePanel(); }
}
