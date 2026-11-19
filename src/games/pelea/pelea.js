// Pelea Puchamon: pantalla del juego de pelea en plataformas. Menú (peleador, modo, dificultad y escenario),
// controles táctiles (cruceta y cuatro botones) o de teclado, el daño de cada uno abajo y los premios en la
// misma plata de Puchamon. La lógica vive en sim.js y el dibujo en render3d/pelea3d.js.
import { ui, esc, money } from '../../ui/ui.js';
import { saveState } from '../../core/state.js';
import { iconURL } from '../../art/creatures.js';
import { SPECIES, TYPES } from '../../data/creatures.js';
import { ownedBest, LOANERS, rng } from '../arena/sim.js';
import { FightSim, makeFighter, STAGES, peleaState, peleaReward, blankInput } from './sim.js';
import { CHAPTERS, SKILL, chapterFighters, chapterPrize } from './story.js';

const COLORS = ['#3f7fe8', '#e8484e', '#3fbf6a', '#f2b62c'];
const DIFF = ['Fácil', 'Normal', 'Difícil'];
// Nombre del poder de cada tipo (abajo + B).
const POWER = { normal: 'Temblor', fuego: 'Erupción', agua: 'Ola', planta: 'Lluvia de polen', electrico: 'Rayo', hielo: 'Columna de hielo', lucha: 'Temblor', veneno: 'Nube tóxica', tierra: 'Terremoto', volador: 'Remolino', psiquico: 'Pulso mental', bicho: 'Polvo picante', roca: 'Derrumbe', fantasma: 'Sombra', dragon: 'Columna dragón', siniestro: 'Sombra', acero: 'Impacto', hada: 'Destello' };
const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'jump', KeyZ: 'attack', KeyJ: 'attack', KeyX: 'special', KeyK: 'special', KeyC: 'shield', ShiftLeft: 'shield', ShiftRight: 'shield', KeyL: 'shield' };

export class PeleaGame {
  constructor(game) { this.game = game; this.scene = 'pelea'; this.sim = null; this.view = null; this.pending = []; this.speed = 1; this.held = {}; this.pressed = {}; this.opts = { mode: 1, diff: 1, stage: 'isla' }; }
  get st() { return this.game.state; }
  pic(sp) { return this.game.graphics?.portrait(sp) || iconURL(sp); }
  // Tus Puchamon (el más fuerte de cada especie) o, si no tienes, prestados.
  roster() {
    const best = Object.values(ownedBest(this.st)).sort((a, b) => b.level - a.level).map(c => ({ sp: c.sp, level: c.level }));
    return best.length ? best : LOANERS.slice(0, 4).map(sp => ({ sp, level: 10, loan: true }));
  }
  async run() {
    const P = peleaState(this.st), roster = this.roster();
    if (!roster.some(c => c.sp === P.fighter)) P.fighter = roster[0].sp;
    for (;;) {
      const a = await this.home();
      if (a === 'exit') return;
      if (a === 'pick') await this.pick();
      if (a === 'play') await this.match();
      if (a === 'story') await this.storyMenu();
    }
  }
  home() {
    return new Promise(resolve => {
      const P = peleaState(this.st), me = this.roster().find(c => c.sp === P.fighter) || this.roster()[0], S = SPECIES[me.sp];
      const o = this.opts; this.preloadStage(o.stage);
      ui.setPanel(`<div class="pe-home">
        <div class="ar-head pe-head"><div><small>PELEA PUCHAMON</small><b>${esc(STAGES[o.stage].name)}</b></div><div class="ar-tro">🏅 ${P.wins}</div></div>
        <div class="pe-me" style="--t:${TYPES[S.types[0]]?.color || '#888'}"><img src="${this.pic(me.sp)}" alt=""><div><small>TU PELEADOR</small><b>${esc(S.name)}</b><span>Nv ${me.level}${me.loan ? ' · prestado' : ''} · especial: ${makeFighter(me.sp, me.level).special === 'shot' ? 'disparo' : 'embestida'} · poder: ${POWER[S.types[0]] || 'Temblor'}</span></div><button data-act="pick">CAMBIAR</button></div>
        <div class="pe-opts">
          <div><small>MODO</small><button data-act="mode:1" class="${o.mode === 1 ? 'on' : ''}">1 contra 1</button><button data-act="mode:3" class="${o.mode === 3 ? 'on' : ''}">Todos contra todos</button></div>
          <div><small>RIVALES</small>${DIFF.map((d, i) => `<button data-act="diff:${i}" class="${o.diff === i ? 'on' : ''}">${d}</button>`).join('')}</div>
          <div><small>ESCENARIO</small>${Object.entries(STAGES).map(([id, s]) => `<button data-act="stage:${id}" class="${o.stage === id ? 'on' : ''}">${esc(s.name)}</button>`).join('')}</div>
        </div>
        <button data-act="play" class="primary ar-play">¡A PELEAR!</button>
        <button data-act="story" class="pe-story-btn">📜 HISTORIA: COPA DEL ALBA <small>${Math.min(P.story || 0, CHAPTERS.length)}/${CHAPTERS.length}</small></button>
        <div class="row2"><button data-act="help">CÓMO SE JUEGA</button><button class="bt-back" data-back>SALIR</button></div>
        <p class="hint">Ganar da plata para Puchamon · ${P.wins} ganadas · ${P.losses} perdidas · tu plata: ${money(this.st.money)}</p></div>`,
      { modal: true, cls: 'arena-panel pelea-panel', focus: 0, onAct: a => {
        if (a === 'help') return this.help().then(() => this.home().then(resolve));
        const [k, v] = a.split(':');
        if (k === 'mode') { o.mode = +v; return this.home().then(resolve); }
        if (k === 'diff') { o.diff = +v; return this.home().then(resolve); }
        if (k === 'stage') { o.stage = v; this.view?.dispose(); this.view = null; return this.home().then(resolve); }
        resolve(a);
      }, onBack: () => resolve('exit') });
    });
  }
  async help() {
    ui.closePanel();
    await ui.say(['Pelea Puchamon: saca a tus rivales del escenario. Cada golpe sube su daño (%); entre más daño tienen, más lejos salen volando.',
      'Cada uno tiene 3 vidas. Pierdes una si sales por los lados, por abajo o muy arriba. Gana el último que quede.',
      'Botones: A ataca (con dirección cambia el golpe), B es el especial de tu tipo, ⤒ salta (dos veces) y 🛡 es el escudo. Arriba + B te impulsa para volver si te caes.',
      'Golpe fuerte: deja oprimida A con una dirección para cargarlo y suéltala para pegar más duro. Un toque corto al salto da un saltico bajito.',
      'Abajo + B lanza el poder de tu tipo alrededor tuyo (fuego hace erupción, eléctrico llama un rayo, agua una ola...). Se recarga en unos segundos: el ⚡ de tu tarjeta se prende cuando está listo.',
      'Con el escudo puesto, una dirección te hace rodar y abajo esquiva en el sitio; en el aire, el escudo esquiva. Si caes cerca del borde te agarras solo: arriba para subir.',
      'Teclado: flechas o WASD para moverte, Espacio salta, Z ataca, X especial y C escudo.']);
  }
  pick() {
    return new Promise(resolve => {
      const P = peleaState(this.st), list = this.roster();
      ui.setPanel(`<h3 class="ph">ESCOGE PELEADOR</h3><div class="ar-picks">${list.map(c => { const S = SPECIES[c.sp], f = makeFighter(c.sp, c.level); return `<button data-act="sp:${c.sp}" class="ar-pick${P.fighter === c.sp ? ' on' : ''}"><div class="ar-card" style="--t:${TYPES[S.types[0]]?.color || '#888'}"><img src="${this.pic(c.sp)}" alt=""><span>${esc(S.name)}</span><small>Nv ${c.level}</small></div><em>${f.special === 'shot' ? 'Disparo' : 'Embestida'} · peso ${f.weight}</em></button>`; }).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'arena-panel wide', onAct: a => { P.fighter = a.slice(3); saveState(this.st); resolve(); }, onBack: () => resolve() });
    });
  }
  // ---------- Historia ----------
  storyMenu() {
    return new Promise(resolve => {
      const P = peleaState(this.st), next = Math.min(P.story || 0, CHAPTERS.length);
      const row = (ch, i) => {
        const done = i < next, open = i <= next, R = ch.rivals.map(r => r.sp || null);
        const face = R[0] && open ? `<img src="${this.pic(R[0])}" alt="">` : `<span class="pe-chap-n">${open ? i + 1 : '?'}</span>`;  // el jefe de un capítulo cerrado es sorpresa
        return `<button data-act="ch:${i}" class="pe-chap${done ? ' done' : ''}${i === next ? ' next' : ''}${ch.boss ? ' boss' : ''}" ${open ? '' : 'disabled'}>
          ${face}<div><small>CAPÍTULO ${i + 1} · ${esc(STAGES[ch.stage].name)}</small><b>${esc(ch.title)}</b><span>${open ? esc(ch.who) + (ch.rivals.length > 1 ? ' · dos contra ti' : '') + (ch.boss ? ' · JEFE' : '') : '🔒 Gana el capítulo anterior'}</span></div>
          <em>${done ? '✓' : i === next ? '¡SIGUE!' : ''}</em></button>`;
      };
      ui.setPanel(`<div class="pe-home"><div class="ar-head pe-head"><div><small>HISTORIA</small><b>Copa del Alba</b></div><div class="ar-tro">📜 ${next}/${CHAPTERS.length}</div></div>
        <div class="pe-chaps">${CHAPTERS.map(row).join('')}</div>
        <p class="hint">${next >= CHAPTERS.length ? '¡Ganaste la copa! Puedes repetir cualquier capítulo.' : 'Tres escenarios, peleas de dos contra ti y un jefe al final de cada parte. La primera victoria paga premio completo.'}</p>
        <button class="bt-back" data-back>VOLVER</button></div>`,
      { modal: true, cls: 'arena-panel pelea-panel', focus: Math.min(next, CHAPTERS.length - 1), onAct: async a => {
        let i = +a.split(':')[1];
        while (i >= 0) {
          const r = await this.playOne(CHAPTERS[i]);
          i = r === 'again' ? i : r === 'next' ? i + 1 : -1;
          if (i >= CHAPTERS.length) i = -1;
        }
        this.storyMenu().then(resolve);
      }, onBack: () => resolve() });
    });
  }
  async talk(lines) { ui.closePanel(); for (const [who, text] of lines) await ui.say([text], { name: who }); ui.hideMsg?.(); }
  // ---------- Partida ----------
  async match() { while (await this.playOne()) { /* OTRA VEZ */ } }
  get stageNow() { return this.sim?.stageId || this.opts.stage; }
  async playOne(ch = null) {
    const P = peleaState(this.st), o = this.opts, rnd = rng((Date.now() ^ (P.wins * 131 + P.losses * 17)) >>> 0);
    const me = this.roster().find(c => c.sp === P.fighter) || this.roster()[0];
    let fighters, skill, stage = o.stage;
    if (ch) {
      fighters = chapterFighters(ch, me); skill = SKILL[ch.diff]; stage = ch.stage;
    } else {
      skill = [.28, .55, .82][o.diff]; const lvK = [.85, 1, 1.15][o.diff];
      const pool = Object.keys(SPECIES).filter(sp => !SPECIES[sp].legendary && sp !== me.sp);
      fighters = [makeFighter(me.sp, me.level, { team: 0 })];
      for (let i = 0; i < o.mode; i++) fighters.push(makeFighter(pool[Math.floor(rnd() * pool.length)], Math.max(5, Math.round(me.level * lvK)), { cpu: true, team: i + 1 }));
    }
    this.sim = new FightSim({ fighters, stage, seed: Math.floor(rnd() * 1e9), skill });
    ui.closePanel(); this.view?.dispose(); this.view = null; this.pending = []; this.held = {}; this.pressed = {};
    await this.preloadStage(stage, 5000);
    if (ch) await this.talk(ch.before);  // la charla pasa con el escenario y los peleadores ya en su sitio
    this.buildHud();
    await this.banner('¡3!', 600); await this.banner('¡2!', 600); await this.banner('¡1!', 600); this.banner('¡PELEA!', 800);
    this.playing = true;
    await new Promise(res => { this.onEnd = res; });
    this.playing = false;
    const sim = this.sim, w = sim.winner, won = w === 0, me0 = sim.f[0];
    await this.banner('¡SE ACABÓ!', 1100, 'end');
    await this.banner(won ? '¡GANASTE!' : w === -1 ? 'EMPATE' : `GANÓ ${sim.f[w].name.toUpperCase()}`, 1500, won ? 'win' : '');
    const idx = ch ? CHAPTERS.indexOf(ch) : -1, first = ch && won && idx >= (P.story || 0);
    const r = ch ? { money: won ? chapterPrize(ch, first, me0.stocks) : 0 } : peleaReward(won, o.mode, o.diff, me0.stocks, me0.kos);
    if (won) P.wins++; else P.losses++; P.kos += me0.kos;
    if (first) P.story = idx + 1;
    this.st.money += r.money; saveState(this.st);
    this.destroyHud();
    if (ch && won) await this.talk(ch.after);
    if (ch) {
      const more = won && idx + 1 < CHAPTERS.length;
      return new Promise(resolve => ui.setPanel(`<div class="ar-result ${won ? 'win' : 'lose'}"><b class="ar-title">${won ? (idx + 1 === CHAPTERS.length ? '¡CAMPEÓN DE LA COPA!' : '¡CAPÍTULO GANADO!') : w === -1 ? 'EMPATE' : 'PERDISTE'}</b>
        <div class="pe-final">${sim.f.map(p => `<div class="${(won ? p.team === 0 : p.team !== 0 && p.stocks > 0) ? 'win' : ''}" style="--c:${COLORS[p.id]}"><img src="${this.pic(p.sp)}" alt=""><b>${esc(p.name)}</b><small>${p.id === 0 ? 'TÚ' : esc(p.trainer || (p.boss ? 'JEFE' : 'CPU'))} · ${p.kos} fuera · ${p.stocks} vidas</small></div>`).join('')}</div>
        ${won ? `<div class="ar-prize"><span>💰 +${money(r.money)}</span>${first ? '<small>¡primera vez!</small>' : ''}</div>` : '<p class="hint">Inténtalo otra vez: el capítulo sigue abierto.</p>'}
        ${more ? '<button data-act="next" class="primary">SIGUIENTE CAPÍTULO</button>' : ''}<button data-act="again" class="${more ? '' : 'primary'}">${won ? 'REPETIR' : 'OTRA VEZ'}</button><button class="bt-back" data-back>VOLVER</button></div>`,
        { modal: true, cls: 'arena-panel', onAct: a => { this.sim = null; resolve(a); }, onBack: () => { this.sim = null; resolve('back'); } }));
    }
    const again = await new Promise(resolve => ui.setPanel(`<div class="ar-result ${won ? 'win' : 'lose'}"><b class="ar-title">${won ? '¡GANASTE!' : w === -1 ? 'EMPATE' : 'PERDISTE'}</b>
      <div class="pe-final">${sim.f.map(p => `<div class="${p.id === w ? 'win' : ''}" style="--c:${COLORS[p.id]}"><img src="${this.pic(p.sp)}" alt=""><b>${esc(p.name)}</b><small>${p.id === 0 ? 'TÚ' : 'CPU'} · ${p.kos} fuera · ${p.stocks} vidas</small></div>`).join('')}</div>
      <div class="ar-prize"><span>💰 +${money(r.money)}</span></div><p class="hint">La plata ya está en tu partida de Puchamon.</p>
      <button data-act="again" class="primary">OTRA VEZ</button><button class="bt-back" data-back>VOLVER</button></div>`,
      { modal: true, cls: 'arena-panel', onAct: () => resolve(true), onBack: () => resolve(false) }));
    this.sim = null;
    return again;
  }
  // ---------- Pantalla y controles ----------
  buildHud() {
    this.destroyHud();
    const sim = this.sim, el = document.createElement('div'); el.id = 'peleaHud';
    el.innerHTML = `<div class="pe-clock"><b>3:00</b></div><button class="ah-pause" aria-label="Pausa">II</button>
      <div class="pe-cards">${sim.f.map(p => `<div class="pe-card${p.boss ? ' boss' : ''}" style="--c:${COLORS[p.id]}"><img src="${this.pic(p.sp)}" alt=""><div><small>${p.id === 0 ? 'TÚ' : esc(p.trainer || (p.boss ? 'JEFE' : 'CPU ' + p.id))} · ${esc(p.name)}</small><b class="pe-pct">0<i>%</i></b><span class="pe-stocks">${'<i></i>'.repeat(p.stocks)}</span></div><em class="pe-pow" title="Poder: ${esc(POWER[p.types[0]] || 'Temblor')}">⚡</em></div>`).join('')}</div>
      <div class="pe-tags">${sim.f.map(p => `<span class="pe-tag" style="--c:${COLORS[p.id]}"><b>${p.id === 0 ? 'TÚ' : p.boss ? 'JEFE' : p.team === 0 ? 'AMIGO' : 'CPU'}</b><img src="${this.pic(p.sp)}" alt=""></span>`).join('')}</div>
      <div class="pe-pad"><button data-k="left">◀</button><button data-k="up">▲</button><button data-k="down">▼</button><button data-k="right">▶</button></div>
      <div class="pe-btns"><button data-k="attack" class="a">A</button><button data-k="special" class="b">B</button><button data-k="jump" class="j">⤒</button><button data-k="shield" class="s">🛡</button></div>
      <div class="ah-banner hidden"></div>`;
    document.getElementById('ui').appendChild(el);
    this.hud = el;
    this.h = { clock: el.querySelector('.pe-clock b'), pow: [...el.querySelectorAll('.pe-pow')], pct: [...el.querySelectorAll('.pe-pct')], stocks: [...el.querySelectorAll('.pe-stocks')], cards: [...el.querySelectorAll('.pe-card')], tags: [...el.querySelectorAll('.pe-tag')], banner: el.querySelector('.ah-banner'), shown: sim.f.map(() => -1), lives: sim.f.map(p => p.stocks) };
    el.querySelector('.ah-pause').addEventListener('click', () => this.pause());
    for (const b of el.querySelectorAll('[data-k]')) {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); this.down(k); b.classList.add('on'); });
      const up = e => { e.preventDefault(); this.up(k); b.classList.remove('on'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    }
    this.onKeyDown = e => { const k = KEYS[e.code]; if (!k || !this.playing || this.paused || ui.dialog || ui.panel) return; e.preventDefault(); if (!e.repeat) this.down(k); };
    this.onKeyUp = e => { const k = KEYS[e.code]; if (k) this.up(k); if (e.code === 'Escape' && this.playing && !this.paused) this.pause(); };
    addEventListener('keydown', this.onKeyDown); addEventListener('keyup', this.onKeyUp);
  }
  destroyHud() { if (!this.hud) return; removeEventListener('keydown', this.onKeyDown); removeEventListener('keyup', this.onKeyUp); this.hud.remove(); this.hud = null; }
  down(k) { if (!this.held[k]) this.pressed[k] = true; this.held[k] = true; if (k === 'up') this.pressed.jumpUp = true; }
  up(k) { this.held[k] = false; }
  // Entrada del jugador para este cuadro (arriba también salta, como en los juegos de pelea de siempre).
  // Sostener A carga el golpe fuerte y soltar rápido el salto lo deja cortico.
  playerInput() {
    const h = this.held, p = this.pressed, inp = blankInput();
    inp.x = (h.right ? 1 : 0) - (h.left ? 1 : 0); inp.up = !!h.up; inp.down = !!h.down; inp.shield = !!h.shield;
    inp.attack = !!p.attack; inp.special = !!p.special;
    inp.jump = !!p.jump || (!!p.jumpUp && !p.attack && !p.special && !h.attack && !h.special);
    inp.attackHeld = !!h.attack; inp.jumpHeld = !!(h.jump || h.up);
    this.pressed = {};
    return inp;
  }
  async pause() {
    if (!this.playing || this.paused) return;
    this.paused = true; this.held = {};
    const i = await ui.ask('Pelea en pausa.', ['Seguir peleando', 'Rendirse']);
    ui.hideMsg(); this.paused = false;
    if (i === 1 && this.sim) {
      const me = this.sim.f[0]; me.stocks = 1; this.sim.ko(me); this.sim.checkEnd();
      if (this.sim.phase !== 'done') { const best = this.sim.f.filter(p => p.stocks > 0).sort((a, b) => b.stocks - a.stocks || a.damage - b.damage)[0]; this.sim.finish(best ? best.id : -1); }
    }
  }
  banner(text, ms, kind = '') {
    const b = this.h?.banner; if (!b) return Promise.resolve();
    b.textContent = text; b.classList.remove('hidden', 'pop', 'end', 'win', 'ko'); void b.offsetWidth; b.classList.add('pop'); if (kind) b.classList.add(kind);
    clearTimeout(this.bannerT);
    return new Promise(res => { this.bannerT = setTimeout(() => { b.classList.add('hidden'); res(); }, ms); });
  }
  // Color del daño: blanco, amarillo, naranja, rojo y rojo oscuro a medida que sube.
  static dmgColor(d) {
    const stops = [[0, [255, 255, 255]], [45, [255, 232, 90]], [90, [255, 150, 50]], [140, [255, 66, 48]], [200, [196, 24, 30]]];
    let i = 0; while (i < stops.length - 2 && d > stops[i + 1][0]) i++;
    const [d0, c0] = stops[i], [d1, c1] = stops[i + 1], k = Math.max(0, Math.min(1, (d - d0) / (d1 - d0)));
    return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`;
  }
  hudUpdate() {
    const sim = this.sim, h = this.h; if (!sim || !h) return;
    const W = innerWidth, H = innerHeight, m = 30;
    sim.f.forEach((p, i) => {
      const dmg = p.stocks > 0 ? Math.floor(p.damage) : -2;
      if (h.shown[i] !== dmg) {
        const pct = h.pct[i];
        pct.innerHTML = dmg >= 0 ? `${dmg}<i>%</i>` : '—'; pct.style.color = PeleaGame.dmgColor(Math.max(0, dmg));
        // Si subió el daño, la cifra tiembla (más fuerte entre más grande el golpe).
        if (dmg > h.shown[i] && h.shown[i] >= 0) { const card = h.cards[i]; card.classList.remove('hit', 'big'); void card.offsetWidth; card.classList.add('hit'); if (dmg - h.shown[i] >= 10) card.classList.add('big'); }
        h.shown[i] = dmg;
      }
      const lives = Math.max(0, p.stocks);
      if (h.lives[i] !== lives) { h.stocks[i].innerHTML = '<i></i>'.repeat(lives); if (lives < h.lives[i]) { const card = h.cards[i]; card.classList.remove('ko'); void card.offsetWidth; card.classList.add('ko'); } h.lives[i] = lives; }
      h.cards[i].classList.toggle('out', p.stocks <= 0);
      h.pow[i].classList.toggle('ready', p.stocks > 0 && p.pcd <= 0);
      // Etiqueta encima de cada uno; si se sale de la pantalla queda en el borde con su cara y una flecha.
      const tag = h.tags[i];
      if (this.view && !p.out && p.stocks > 0) {
        const s = this.view.toScreen(p.x, p.y + 2.2), off = s.x < m || s.x > W - m || s.y < m || s.y > H - m;
        if (off) { const x = Math.max(m + 4, Math.min(W - m - 4, s.x)), y = Math.max(m + 44, Math.min(H - m - 96, s.y)); tag.style.setProperty('--a', Math.atan2(s.y - y, s.x - x) + 'rad'); tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; }
        else tag.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
        tag.classList.toggle('edge', off); tag.style.display = '';
      } else tag.style.display = 'none';
    });
    const left = Math.max(0, Math.ceil(sim.limit - sim.time)), txt = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    if (h.clock.textContent !== txt) h.clock.textContent = txt;
  }
  update(dt) {
    if (!this.sim) return;
    if (!this.playing || this.paused) { this.hudUpdate(); return; }
    this.sim.setInput(0, this.playerInput());
    for (let i = 0; i < this.speed; i++) this.sim.step(dt);
    if (this.sim.events.length) {
      for (const ev of this.sim.events) if (ev.type === 'ko' && this.sim.phase !== 'done') this.banner(ev.id === 0 ? (ev.left ? '¡TE SACARON!' : '¡SIN VIDAS!') : `¡FUERA ${this.sim.f[ev.id].name.toUpperCase()}!`, 1000, 'ko');
      this.pending.push(...this.sim.events); this.sim.events.length = 0;
    }
    this.hudUpdate();
    if (this.sim.phase === 'done' && this.onEnd) { const f = this.onEnd; this.onEnd = null; f(); }
  }
  async viewClass() { const { PeleaView } = await import('../../render3d/pelea3d.js'); return PeleaView; }
  // Carga antes el modelo del escenario hecho en Blender (sólo con gráficos 3D); espera como mucho "wait" ms.
  async preloadStage(stage, wait = 0) {
    if (this.game.graphics?.mode !== 'premium') return;
    try {
      const { loadStageModel } = await import('../../render3d/stage-assets.js'), p = loadStageModel(stage);
      if (wait) await Promise.race([p, new Promise(r => setTimeout(r, wait))]);
    } catch { /* sin modelo: queda el escenario hecho en código */ }
  }
  draw3d(engine, dt) {
    if (!this.View) { if (!this.loading) this.loading = this.viewClass().then(V => { this.View = V; }); return null; }
    const stage = this.stageNow;
    if (!this.view || this.view.stageId !== stage) { this.view?.dispose(); this.view = new this.View(engine, { stage }); }
    this.view.sync(this.sim, this.pending.splice(0), dt, engine.time.value);
    return this.view.frame(dt, engine.camera.aspect, this.sim);
  }
  render2d(r) {
    const g = r.g; g.fillStyle = '#2a3050'; g.fillRect(0, 0, r.w, r.h); g.fillStyle = '#fff'; g.font = '8px monospace'; g.textAlign = 'center';
    g.fillText(this.game.graphics?.status === 'unavailable' ? 'Este juego necesita gráficos 3D' : 'Cargando la pelea 3D...', r.w / 2, r.h / 2); g.textAlign = 'left';
  }
  dispose() { this.destroyHud(); this.view?.dispose(); this.view = null; this.sim = null; ui.closePanel(); }
}
