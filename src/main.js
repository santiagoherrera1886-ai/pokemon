// Punto de entrada: bucle a 60 Hz, escenas (título, exploración, combate, evolución, créditos) y servicios del juego.
import { input } from './core/input.js';
import { Renderer } from './core/renderer.js';
import { Graphics } from './core/graphics.js';
import { initLayout } from './core/layout.js';
import { newState, loadState, hasSave } from './core/state.js';
import { canvas, px, ellipse } from './core/pixel.js';
import { World } from './world/world.js';
import { Overworld } from './world/overworld.js';
import { Scripts } from './story/scripts.js';
import { Battle } from './battle/battle.js';
import { ui } from './ui/ui.js';
import { Menus } from './ui/menus.js';
import { battleSprite, silhouette } from './art/creatures.js';
import { tree, house } from './art/objects.js';
import { sheet } from './art/characters.js';
import { ENCOUNTERS, SPECIES, MOVES, makeCreature, refreshStats } from './data/creatures.js';

class Game {
  constructor() {
    initLayout();
    ui.init();
    this.renderer = new Renderer(document.getElementById('top'));
    this.renderer.onResize = () => { this.titleBg = null; };
    this.world = new World();
    this.scripts = new Scripts(this);
    this.menus = new Menus(this);
    this.frame = 0;
    this.waiters = [];
    this.scene = 'title';
    this.fading = false;
    ui.restoreHook = () => this.restoreBottom();
    input.bindTouch(document);
    document.getElementById('menuBtn').addEventListener('click', () => { if (this.scene === 'overworld' && !this.ow.locked) this.openMenu(); });
    this.state = newState();
    this.graphics = new Graphics(this);
    this.ow = new Overworld(this);
    window.__game = this; window.__ui = ui; // acceso para pruebas automatizadas
    this.loop();
    this.toTitle();
  }

  // ---------- Bucle ----------
  loop() {
    let last = performance.now(), acc = 0;
    const step = 1000 / 60;
    const tick = now => {
      acc += Math.min(250, now - last); last = now;
      while (acc >= step) { this.update(); acc -= step; }
      this.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  update() {
    this.frame++;
    ui.update();
    if (this.scene === 'overworld') { this.ow.update(); this.state.playTime++; }
    const w = this.waiters; this.waiters = [];
    w.forEach(r => r());
    input.endFrame();
  }
  nextFrame() { return new Promise(r => this.waiters.push(r)); }
  async frames(n) { for (let i = 0; i < n; i++) await this.nextFrame(); }
  hour() { return this.state.options?.forceHour ?? new Date().getHours(); }

  render() {
    const r = this.renderer;
    if (this.graphics.render()) return;
    if (this.scene === 'overworld') this.ow.render(r);
    else if (this.scene === 'battle' && this.battleObj) this.battleObj.render(r);
    else if (this.scene === 'title') this.renderTitle(r);
    else if (this.scene === 'flash') this.renderFlash(r);
    else if (this.scene === 'evolve') this.renderEvolve(r);
  }

  // ---------- Título ----------
  renderTitle(r) {
    const W = r.w, H = r.h, g = r.g;
    if (!this.titleBg) {
      const [c, tg] = canvas(W, H);
      const sky = ['#f8c0a0', '#f8d0a8', '#f6e0c0', '#e0ecf0', '#c0e2f4'];
      const hz = Math.round(H * 0.58);
      sky.forEach((col, i) => px(tg, 0, Math.round(i * hz / 5), col, W, Math.ceil(hz / 5) + 1));
      ellipse(tg, Math.round(W * 0.76), Math.round(H * 0.42), 22, 22, '#fff4c8'); ellipse(tg, Math.round(W * 0.76), Math.round(H * 0.42), 17, 17, '#ffffff');
      px(tg, 0, hz, '#7ac0e0', W, Math.round(H * 0.12));
      for (let x = 0; x < W; x += 7) px(tg, x, hz + 4 + (x % 21) / 3, '#b8e4f8', 4, 1);
      px(tg, 0, Math.round(H * 0.7), '#79c85a', W, H);
      for (let i = 0; i < W / 14 + 1; i++) tg.drawImage(tree(i % 3), i * 14 - 6, Math.round(H * 0.62) + (i % 2) * 6);
      tg.drawImage(house(5, 3, { roof: '#d8504a', chimney: true }), Math.round(W * 0.62), Math.round(H * 0.66));
      this.titleBg = c;
    }
    g.drawImage(this.titleBg, 0, 0);
    const t = this.frame, bob = Math.round(Math.sin(t / 20) * 2), y = Math.round(H * 0.74);
    g.drawImage(battleSprite('brotelo'), Math.round(W * 0.10), y + bob, 48, 48);
    g.drawImage(battleSprite('charquin'), Math.round(W * 0.10) + 44, y + 4 - bob, 48, 48);
    g.drawImage(battleSprite('brasin'), Math.round(W * 0.10) + 88, y + bob, 48, 48);
    g.drawImage(sheet('player')[0][0], Math.round(W * 0.62) + 88, Math.round(H * 0.66) + 48);
    g.drawImage(battleSprite('espejalba'), Math.round(W * 0.42), Math.round(H * 0.30) + Math.round(Math.sin(t / 30) * 4), 40, 40);
  }
  renderFlash(r) {
    const g = r.g, k = this.flashT++;
    if (k < 36) { g.fillStyle = (k >> 2) % 2 ? '#ffffff' : '#1a1a24'; g.fillRect(0, 0, r.w, r.h); }
    else { const w = Math.min(r.w, (k - 36) * r.w / 18); g.fillStyle = '#000'; g.fillRect(0, 0, w, r.h / 2); g.fillRect(r.w - w, r.h / 2, w, r.h / 2); }
  }

  async toTitle() {
    this.scene = 'title';
    document.body.classList.add('at-title');
    document.getElementById('menuBtn').classList.add('hidden');
    ui.hideMsg(); ui.closePanel();
    document.getElementById('fade').style.opacity = '0';
    const choice = await this.menus.title(hasSave());
    ui.closePanel();
    document.body.classList.remove('at-title');
    if (choice.type === 'continue') this.state = loadState() || newState();
    else this.state = newState(choice.name);
    this.applyOptions();
    await this.fadeOut();
    this.scene = 'overworld';
    this.ow.map = null; this.ow.npcs = [];
    this.ow.load(this.state.map, this.state.x, this.state.y, this.state.dir);
    this.menus.home(false);
    document.getElementById('menuBtn').classList.remove('hidden');
    await this.fadeIn();
    if (choice.type === 'new') {
      this.ow.scripts++;
      await ui.say([`${this.state.name}, despierta... Hoy es un día especial en Pueblo Brisal.`, 'Usa las flechas o la cruceta para caminar y A (Z o Enter) para hablar e investigar.', 'Pulsa Esc o el botón MENÚ para ver tu equipo, la mochila y guardar.']);
      this.ow.scripts--;
    }
  }

  applyOptions() {
    this.renderer.perspective = !!this.state.options.perspective;
    ui.speed = this.state.options.textSpeed;
  }

  // ---------- Servicios para guiones ----------
  restoreBottom() { if (this.scene === 'overworld') this.menus.home(false); }
  refreshHome() { if (this.scene === 'overworld' && (!ui.panel || !ui.panel.modal)) this.menus.home(false); }
  openMenu() { this.menus.home(true); }
  async fadeOut() { this.fading = true; await ui.fade(1); }
  async fadeIn() { await ui.fade(0); this.fading = false; }
  toast(text) {
    const el = document.getElementById('toast');
    el.textContent = text; el.classList.remove('hidden'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    clearTimeout(this.toastT); this.toastT = setTimeout(() => el.classList.add('hidden'), 2800);
  }
  async healParty(anim = false) {
    if (anim) { ui.show('♪ ♫ ♪'); await this.frames(70); ui.hideMsg(); }
    for (const c of this.state.party) { c.hp = c.stats.hp; for (const m of c.moves) m.pp = MOVES[m.id].pp; }
  }
  chooseStarter() { return this.menus.starter(); }
  async openShop(tier) { await this.menus.shop(tier); ui.hideMsg(); this.menus.home(false); }

  // Aprende los movimientos de su especie para ese nivel; si ya sabe cuatro, pregunta cuál olvidar.
  async learnMoves(c, level, say = t => ui.say([t])) {
    for (const [lv, mid] of SPECIES[c.sp].learn) {
      if (lv !== level || c.moves.some(m => m.id === mid)) continue;
      if (c.moves.length < 4) { c.moves.push({ id: mid, pp: MOVES[mid].pp }); await say(`¡${c.name} aprendió ${MOVES[mid].name}!`); continue; }
      const opts = [...c.moves.map(m => `Olvidar ${MOVES[m.id].name}`), `No aprender ${MOVES[mid].name}`];
      const i = await ui.ask(`${c.name} quiere aprender ${MOVES[mid].name}, pero ya sabe cuatro movimientos. ¿Olvida uno?`, opts, { cancel: true });
      if (i < 4) { const old = c.moves[i]; c.moves[i] = { id: mid, pp: MOVES[mid].pp }; await say(`${c.name} olvidó ${MOVES[old.id].name} y aprendió ${MOVES[mid].name}.`); }
      else await say(`${c.name} no aprendió ${MOVES[mid].name}.`);
    }
  }

  async maybeEncounter(key, bg) {
    const table = ENCOUNTERS[key];
    if (!table || !this.state.party.some(c => c.hp > 0) || this.state.story < 3) return;
    if (Math.random() >= table.rate) return;
    let roll = Math.random() * 100, pick = table.list[0];
    for (const e of table.list) { if ((roll -= e[3]) < 0) { pick = e; break; } }
    const [sp, lo, hi] = pick;
    const foe = makeCreature(sp, lo + Math.floor(Math.random() * (hi - lo + 1)));
    this.ow.scripts++;
    const res = await this.battle({ foe, wild: true, canRun: true, canCatch: true, bg });
    if (res === 'lose') await this.blackout();
    this.ow.scripts--;
  }
  // Combate contra entrenador: t = { name, look, party: [[especie, nivel]], money }
  async trainerBattle(t, bg, opts = {}) {
    const party = t.party.map(([s, l]) => makeCreature(s, l));
    const res = await this.battle({ trainer: { ...t, party }, wild: false, canRun: false, canCatch: false, bg: t.bg || bg, ...opts });
    if (res === 'lose' && !opts.noBlackout) await this.blackout();
    return res;
  }
  async blackout() {
    const st = this.state;
    const lost = Math.floor(st.money / 2);
    st.money -= lost;
    await ui.say([`¡A ${st.name} no le quedan criaturas en pie!`, `Perdiste $${lost} en la carrera de vuelta...`]);
    await this.fadeOut();
    await this.healParty();
    const h = st.lastHeal;
    this.ow.load(h.map, h.x, h.y, 1);
    await this.fadeIn();
    await ui.say(['Tus criaturas se recuperaron después de descansar.']);
  }

  async battle(opts) {
    const prev = this.scene;
    this.flashT = 0; this.scene = 'flash';
    ui.hideMsg(); ui.closePanel();
    document.getElementById('menuBtn').classList.add('hidden');
    await this.frames(54);
    this.battleObj = new Battle(this, opts);
    this.scene = 'battle';
    const res = await this.battleObj.run();
    await this.fadeOut();
    this.battleObj = null;
    this.scene = prev;
    await this.fadeIn();
    if (res !== 'lose') await this.checkEvolutions();
    this.scene = prev;
    document.getElementById('menuBtn').classList.remove('hidden');
    this.menus.home(false);
    input.clear();
    return res;
  }

  // ---------- Evolución ----------
  async checkEvolutions() {
    for (const c of this.state.party) {
      const evo = SPECIES[c.sp].evo;
      if (!evo || c.hp <= 0 || c.level < evo[1]) continue;
      await this.evolve(c, evo[0]);
    }
  }
  renderEvolve(r) {
    const g = r.g, e = this.evo;
    const grad = g.createLinearGradient(0, 0, 0, r.h);
    grad.addColorStop(0, '#1a2a4a'); grad.addColorStop(1, '#4a2a5a');
    g.fillStyle = grad; g.fillRect(0, 0, r.w, r.h);
    for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2 + this.frame / 60; g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(r.w / 2 + Math.cos(a) * (60 + (this.frame * 2 + i * 7) % 80), r.h * 0.45 + Math.sin(a) * (40 + (this.frame * 2 + i * 7) % 60), 2, 2); }
    const k = Math.max(1, Math.min(Math.round(r.h / 120), Math.floor(r.w / 100)));
    const size = 64 * k, x = Math.round(r.w / 2 - size / 2), y = Math.round(r.h * 0.45 - size / 2);
    const img = e.stage === 'done' ? battleSprite(e.to) : e.stage === 'start' ? battleSprite(e.from) : silhouette(e.show ? e.to : e.from);
    g.drawImage(img, x, y, size, size);
    if (e.flash > 0) { g.fillStyle = `rgba(255,255,255,${e.flash})`; g.fillRect(0, 0, r.w, r.h); e.flash -= 0.04; }
  }
  async evolve(c, to) {
    const prev = this.scene;
    this.evo = { from: c.sp, to, stage: 'start', show: false, flash: 0 };
    this.scene = 'evolve';
    document.getElementById('menuBtn').classList.add('hidden');
    await ui.say([`¿Qué? ¡${c.name} está evolucionando!`]);
    this.evo.stage = 'morph';
    let gap = 30;
    for (let i = 0; i < 16; i++) { this.evo.show = !this.evo.show; await this.frames(Math.max(3, gap)); gap = Math.floor(gap * 0.82); }
    this.evo.flash = 1; this.evo.stage = 'done';
    const oldName = c.name, keepName = c.name !== SPECIES[c.sp].name;
    c.sp = to; if (!keepName) c.name = SPECIES[to].name;
    refreshStats(c);
    this.state.dex = this.state.dex || {}; this.state.dex[to] = 2;
    await this.frames(30);
    await ui.say([`¡Enhorabuena! ¡${oldName} evolucionó en ${SPECIES[to].name}!`]);
    await this.learnMoves(c, c.level);
    this.scene = prev;
    document.getElementById('menuBtn').classList.remove('hidden');
  }

  // ---------- Créditos ----------
  async credits() {
    const el = document.createElement('div');
    el.id = 'credits';
    const st = this.state;
    el.innerHTML = `<div class="roll">
      <h2>ALBORADA · EDICIÓN BRUMA</h2><p>Campeón de la Liga Alborada</p><p><b>${st.name}</b></p>
      <h2>Equipo campeón</h2>${st.party.map(c => `<p>${c.name} · Nv${c.level}</p>`).join('')}
      <h2>Medallas</h2><p>Hoja · Roca · Marea</p>
      <h2>Criaturas registradas</h2><p>${Object.keys(st.dex || {}).length} de ${Object.keys(SPECIES).length}</p>
      <h2>Diseño, programación y pixel art</h2><p>Hecho en el navegador, sin ROM y sin gráficos de terceros.</p>
      <h2>Gracias por jugar</h2><p>La aventura sigue: Pueblo Brisal te espera.</p></div>`;
    document.getElementById('ui').appendChild(el);
    el.addEventListener('click', () => el.dataset.skip = '1');
    for (let i = 0; i < 60 * 38 && !el.dataset.skip; i++) { await this.nextFrame(); if (input.hit('a') && i > 120) break; }
    el.remove();
  }
}

window.addEventListener('DOMContentLoaded', () => { new Game(); });
