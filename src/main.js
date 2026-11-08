// Punto de entrada: bucle a 60 Hz, gestión de escenas (título, exploración, combate) y servicios del juego.
import { input } from './core/input.js';
import { Renderer } from './core/renderer.js';
import { newState, loadState, hasSave } from './core/state.js';
import { canvas, px, ellipse } from './core/pixel.js';
import { World } from './world/world.js';
import { Overworld } from './world/overworld.js';
import { Scripts } from './story/scripts.js';
import { Battle } from './battle/battle.js';
import { ui } from './ui/ui.js';
import { Menus } from './ui/menus.js';
import { battleSprite } from './art/creatures.js';
import { tree, house } from './art/objects.js';
import { sheet } from './art/characters.js';
import { ENCOUNTERS, SPECIES, makeCreature, MOVES } from './data/creatures.js';

class Game {
  constructor() {
    ui.init();
    this.renderer = new Renderer(document.getElementById('top'));
    this.world = new World();
    this.scripts = new Scripts(this);
    this.menus = new Menus(this);
    this.frame = 0;
    this.waiters = [];
    this.scene = 'title';
    this.fading = false;
    ui.restoreHook = () => this.restoreBottom();
    input.bindTouch(document);
    this.state = newState();
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

  render() {
    const r = this.renderer;
    if (this.scene === 'overworld') this.ow.render(r);
    else if (this.scene === 'battle' && this.battleObj) this.battleObj.render(r);
    else if (this.scene === 'title') this.renderTitle(r.g);
    else if (this.scene === 'flash') this.renderFlash(r.g);
  }

  // ---------- Título ----------
  renderTitle(g) {
    if (!this.titleBg) {
      const [c, tg] = canvas(256, 192);
      const sky = ['#f8c8a0', '#f8d8b0', '#f6e4c4', '#d8ecf0', '#b8e0f4'];
      sky.forEach((col, i) => px(tg, 0, i * 20, col, 256, 20));
      ellipse(tg, 196, 64, 18, 18, '#fff4c8'); ellipse(tg, 196, 64, 14, 14, '#ffffff');
      px(tg, 0, 100, '#7ac0e0', 256, 30);
      for (let x = 0; x < 256; x += 6) px(tg, x + (x % 12 ? 2 : 0), 108 + (x % 18) / 3, '#b8e4f8', 4, 1);
      px(tg, 0, 130, '#79c85a', 256, 62);
      for (let i = 0; i < 18; i++) tg.drawImage(tree(i % 3), i * 15 - 6, 112 + (i % 2) * 6);
      tg.drawImage(house(5, 3, { roof: '#d8504a', chimney: true }), 150, 120);
      this.titleBg = c;
    }
    g.drawImage(this.titleBg, 0, 0);
    const t = this.frame;
    const bob = Math.round(Math.sin(t / 20) * 2);
    g.drawImage(battleSprite('brotelo'), 4, 128 + bob, 48, 48);
    g.drawImage(battleSprite('charquin'), 46, 132 - bob, 48, 48);
    g.drawImage(battleSprite('brasin'), 88, 128 + bob, 48, 48);
    g.drawImage(sheet('player')[0][(t >> 4) % 2 ? 0 : 0], 220, 150);
  }
  renderFlash(g) {
    const k = this.flashT++;
    if (k < 36) { g.fillStyle = (k >> 2) % 2 ? '#ffffff' : '#1a1a24'; g.fillRect(0, 0, 256, 192); }
    else { const w = Math.min(256, (k - 36) * 14); g.fillStyle = '#000'; g.fillRect(0, 0, w, 96); g.fillRect(256 - w, 96, w, 96); }
  }

  async toTitle() {
    this.scene = 'title';
    document.body.classList.add('at-title');
    ui.hideMsg();
    document.getElementById('fade').style.opacity = '0';
    const choice = await this.menus.title(hasSave());
    document.body.classList.remove('at-title');
    if (choice.type === 'continue') this.state = loadState() || newState();
    else this.state = newState(choice.name);
    this.applyOptions();
    await this.fadeOut();
    this.scene = 'overworld';
    this.ow.map = null; this.ow.npcs = [];
    this.ow.load(this.state.map, this.state.x, this.state.y, this.state.dir);
    this.menus.home(false);
    await this.fadeIn();
    if (choice.type === 'new') {
      this.ow.scripts++;
      await ui.say([`${this.state.name}, despierta... Hoy es un día especial en Pueblo Brisal.`, 'Usa las flechas o la cruceta para caminar y A para hablar e investigar.', 'Pulsa START (Esc) o toca la pantalla de abajo para abrir el menú.']);
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
    clearTimeout(this.toastT); this.toastT = setTimeout(() => el.classList.add('hidden'), 2600);
  }
  async healParty(anim = false) {
    if (anim) { ui.show('♪ ♫ ♪'); await this.frames(70); ui.hideMsg(); }
    for (const c of this.state.party) { c.hp = c.stats.hp; for (const m of c.moves) m.pp = MOVES[m.id].pp; }
    this.refreshHome();
  }
  chooseStarter() { return this.menus.starter(); }
  async openShop() { await this.menus.shop(); ui.hideMsg(); this.menus.home(false); }

  async maybeEncounter(key) {
    const table = ENCOUNTERS[key];
    if (!table || !this.state.party.some(c => c.hp > 0) || this.state.story < 3) return;
    if (Math.random() >= table.rate) return;
    let roll = Math.random() * 100, pick = table.list[0];
    for (const e of table.list) { if ((roll -= e[3]) < 0) { pick = e; break; } }
    const [sp, lo, hi] = pick;
    const foe = makeCreature(sp, lo + Math.floor(Math.random() * (hi - lo + 1)));
    this.ow.scripts++;
    const res = await this.battle({ foe, wild: true, canRun: true, canCatch: (this.state.bag.capsula || 0) > 0 || this.state.story >= 5 });
    if (res === 'lose') await this.blackout();
    this.ow.scripts--;
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
    ui.hideMsg();
    await this.frames(58);
    this.battleObj = new Battle(this, opts);
    this.scene = 'battle';
    const res = await this.battleObj.run();
    await this.fadeOut();
    this.scene = prev;
    this.battleObj = null;
    this.menus.home(false);
    await this.fadeIn();
    input.clear();
    return res;
  }
}

window.addEventListener('DOMContentLoaded', () => { new Game(); });
