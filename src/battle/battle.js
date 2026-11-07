// Sistema de combate por turnos estilo portátil: pantalla superior = escena, inferior = menú táctil.
import { ui, esc } from '../ui/ui.js';
import { input } from '../core/input.js';
import { battleSprite, iconURL } from '../art/creatures.js';
import { canvas, px, ellipse } from '../core/pixel.js';
import { SPECIES, MOVES, TYPES, ITEMS, effectiveness, expForLevel, refreshStats } from '../data/creatures.js';

const $ = id => document.getElementById(id);
const STAGE = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const rand = () => Math.random();

let BG = null;
function background() {
  if (BG) return BG;
  const [c, g] = canvas(256, 192);
  const sky = ['#cfeefc', '#bfe6fa', '#aedff7', '#9ed6f2'];
  sky.forEach((col, i) => px(g, 0, i * 12, col, 256, 12));
  for (let x = 0; x < 256; x += 2) { const h = 6 + Math.round(4 * Math.sin(x / 13) + 3 * Math.sin(x / 5)); px(g, x, 48 - h, '#5aa860', 2, h); px(g, x, 48 - h, '#78c070', 2, 1); }
  px(g, 0, 48, '#a8dc84', 256, 144);
  for (let y = 52; y < 192; y += 7) px(g, 0, y, '#9cd47a', 256, 3);
  const plat = (cx, cy, rx, ry) => { ellipse(g, cx, cy + 2, rx + 2, ry + 2, '#5a9a4a'); ellipse(g, cx, cy, rx, ry, '#c8e89a'); ellipse(g, cx, cy - 1, rx - 6, ry - 3, '#dcf2b4'); };
  plat(186, 80, 50, 12); plat(72, 140, 62, 14);
  BG = c; return c;
}

export class Battle {
  constructor(game, opts) {
    this.game = game; this.st = game.state; this.opts = opts;
    this.foe = opts.foe;
    this.foe.stages = { atk: 0, def: 0, spe: 0 };
    this.activeIdx = this.st.party.findIndex(c => c.hp > 0);
    this.fx = { foeX: 120, allyX: -120, foeAlpha: 1, allyAlpha: 1, foeY: 0, allyY: 0, flash: 0, ball: null, shake: 0, foeScale: 1 };
    this.participants = new Set();
    this.allyStages = { atk: 0, def: 0, spe: 0 };
  }
  get ally() { return this.st.party[this.activeIdx]; }

  // ---------- Dibujo ----------
  render(r) {
    const g = r.g, f = this.fx;
    g.drawImage(background(), 0, 0);
    if (f.foeAlpha > 0 && !(f.foeBlink && (this.game.frame >> 2) % 2)) {
      g.globalAlpha = f.foeAlpha;
      const s = f.foeScale ?? 1, sp = battleSprite(this.foe.sp);
      g.drawImage(sp, Math.round(154 + f.foeX + 32 * (1 - s)), Math.round(18 + f.foeY + 60 * (1 - s)), 64 * s, 64 * s);
      g.globalAlpha = 1;
    }
    if (this.ally && f.allyAlpha > 0 && !(f.allyBlink && (this.game.frame >> 2) % 2)) {
      g.globalAlpha = f.allyAlpha;
      g.drawImage(battleSprite(this.ally.sp, true), 0, 0, 64, 64, Math.round(28 + f.allyX), Math.round(60 + f.allyY), 88, 88);
      g.globalAlpha = 1;
    }
    if (f.ball) {
      const b = f.ball;
      ellipse(g, b.x, b.y, 4, 4, '#26222e'); ellipse(g, b.x, b.y, 3, 3, '#f4f4f4');
      px(g, b.x - 3, b.y - 3, '#3a9ad8', 7, 3); px(g, b.x - 4, b.y, '#26222e', 9, 1); px(g, b.x - 1, b.y - 1, '#ffffff', 2, 2);
    }
    if (f.flash > 0) { g.fillStyle = `rgba(255,255,255,${f.flash})`; g.fillRect(0, 0, 256, 192); f.flash = Math.max(0, f.flash - 0.08); }
  }

  // ---------- HUD ----------
  hud() {
    const foe = this.foe, al = this.ally;
    const bar = (hp, max) => { const k = Math.max(0, hp / max); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
    $('hudFoe').innerHTML = `<b>${esc(foe.name)}</b><span>Nv${foe.level}</span>${bar(foe.hp, foe.stats.hp)}`;
    if (al) {
      const lo = expForLevel(al.level), hi = expForLevel(al.level + 1);
      $('hudAlly').innerHTML = `<b>${esc(al.name)}</b><span>Nv${al.level}</span>${bar(al.hp, al.stats.hp)}<em>${Math.max(0, Math.ceil(al.hp))}/${al.stats.hp}</em><div class="xp"><i style="width:${Math.min(100, (al.exp - lo) / (hi - lo) * 100)}%"></i></div>`;
    }
  }
  showHud(foe, ally) { $('hudFoe').classList.toggle('hidden', !foe); $('hudAlly').classList.toggle('hidden', !ally); }

  wait(frames) { return this.game.frames(frames); }
  async msg(text, hold = 40) {
    ui.show(text);
    input.clear();
    const n = Math.max(hold, Math.min(90, text.length * 1.4));
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
    ui.show('', { hide: true });
    await Promise.all([this.tween(f, 'foeX', 0, 34), this.tween(f, 'allyX', -120, 1)]);
    this.showHud(true, false); this.hud();
    await this.msg(this.opts.wild ? `¡Un ${this.foe.name} salvaje apareció!` : `¡${this.opts.trainer} quiere combatir!`);
    await this.sendOut();
    while (true) {
      const act = await this.choose();
      const end = await this.turn(act);
      if (end) { this.cleanup(); return end; }
    }
  }
  async sendOut() {
    this.fx.allyX = -120; this.fx.allyAlpha = 1; this.fx.allyY = 0;
    this.allyStages = { atk: 0, def: 0, spe: 0 };
    this.participants.add(this.activeIdx);
    ui.show(`¡Adelante, ${this.ally.name}!`);
    await this.tween(this.fx, 'allyX', 0, 22);
    this.showHud(true, true); this.hud();
    await this.wait(20);
  }
  cleanup() {
    this.showHud(false, false);
    ui.hideMsg();
    for (const c of this.st.party) delete c.stages;
  }

  // ---------- Menús de la pantalla inferior ----------
  choose() {
    return new Promise(resolve => {
      const main = () => {
        ui.show(`¿Qué hará ${this.ally.name}?`);
        ui.setPanel(`<div class="bt-main">
          <button class="bt-fight" data-act="fight">LUCHAR</button>
          <div class="bt-row"><button class="bt-bag" data-act="bag">MOCHILA</button><button class="bt-run" data-act="run">HUIR</button><button class="bt-party" data-act="party">EQUIPO</button></div></div>`,
        { modal: true, cls: 'battle-panel', onAct: a => ({ fight: moves, bag, party: () => party(false), run: () => resolve({ type: 'run' }) })[a]() });
      };
      const moves = () => {
        const al = this.ally;
        ui.setPanel(`<div class="bt-moves">${al.moves.map((m, i) => { const M = MOVES[m.id]; return `<button class="mv" style="--t:${TYPES[M.type].color}" data-act="${i}" ${m.pp <= 0 ? 'disabled' : ''}><b>${esc(M.name)}</b><small>${TYPES[M.type].name}</small><em>PP ${m.pp}/${M.pp}</em></button>`; }).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'battle-panel', onAct: a => resolve({ type: 'move', i: +a }), onBack: main });
      };
      const bag = () => {
        const ids = Object.keys(ITEMS).filter(id => this.st.bag[id] > 0);
        ui.setPanel(`<div class="bt-list">${ids.length ? ids.map(id => `<button data-act="${id}" ${id === 'capsula' && (!this.opts.canCatch) ? 'disabled' : ''}><b>${esc(ITEMS[id].name)}</b><span>x${this.st.bag[id]}</span></button>`).join('') : '<p class="empty">La mochila está vacía.</p>'}</div><button class="bt-back" data-back>VOLVER</button>`,
        { modal: true, cls: 'battle-panel', onAct: id => {
          if (id === 'capsula') return resolve({ type: 'catch' });
          if (ITEMS[id].revive) return party(false, id);
          return resolve({ type: 'item', id, target: this.activeIdx });
        }, onBack: main });
      };
      const party = (forced, itemId) => {
        ui.setPanel(`<div class="bt-list party">${this.st.party.map((c, i) => `<button data-act="${i}" class="${i === this.activeIdx ? 'cur' : ''}"><img src="${iconURL(c.sp)}" alt=""><b>${esc(c.name)}</b><span>Nv${c.level} · ${Math.ceil(c.hp)}/${c.stats.hp}</span></button>`).join('')}</div>${forced ? '' : '<button class="bt-back" data-back>VOLVER</button>'}`,
        { modal: true, cls: 'battle-panel', onAct: a => {
          const i = +a, c = this.st.party[i];
          if (itemId) { if (c.hp > 0) return; return resolve({ type: 'item', id: itemId, target: i }); }
          if (c.hp <= 0 || i === this.activeIdx) return;
          resolve({ type: 'switch', i });
        }, onBack: forced ? null : main });
      };
      this.forceSwitch = () => party(true);
      if (this.needSwitch) party(true); else main();
    });
  }

  // ---------- Resolución de turnos ----------
  foeMove() {
    const usable = this.foe.moves.filter(m => m.pp > 0);
    const dmg = usable.filter(m => MOVES[m.id].power > 0);
    const pool = dmg.length && rand() < 0.75 ? dmg : usable;
    return pool[Math.floor(rand() * pool.length)] || { id: 'embestida', pp: 1 };
  }
  speed(c, stages) { return c.stats.spe * STAGE(stages.spe); }

  async turn(act) {
    ui.setPanel('<div class="bt-wait">...</div>', { cls: 'battle-panel' });
    this.needSwitch = false;
    if (act.type === 'run') {
      if (!this.opts.canRun) { await this.msg('¡No puedes huir ahora!'); return null; }
      const ok = this.speed(this.ally, this.allyStages) >= this.speed(this.foe, this.foe.stages) || rand() < 0.6;
      if (ok) { await this.msg('¡Escapaste sin problemas!'); return 'run'; }
      await this.msg('¡No pudiste escapar!');
      return this.foeTurn();
    }
    if (act.type === 'switch') {
      await this.msg(`¡${this.ally.name}, vuelve!`, 20);
      await this.tween(this.fx, 'allyX', -120, 16);
      this.activeIdx = act.i;
      await this.sendOut();
      return this.foeTurn();
    }
    if (act.type === 'item') {
      const c = this.st.party[act.target], it = ITEMS[act.id];
      if (!it.revive && c.hp >= c.stats.hp) { await this.msg('No tendría ningún efecto.'); return null; }
      this.st.bag[act.id]--;
      if (it.revive) c.hp = Math.floor(c.stats.hp / 2);
      else { const to = Math.min(c.stats.hp, c.hp + it.heal); await this.tween(c, 'hp', to, 24); }
      await this.msg(`Usaste ${it.name} en ${c.name}.`);
      return this.foeTurn();
    }
    if (act.type === 'catch') return this.throwCapsule();

    const mine = this.ally.moves[act.i];
    const theirs = this.foeMove();
    const meFirst = this.speed(this.ally, this.allyStages) > this.speed(this.foe, this.foe.stages) || (this.speed(this.ally, this.allyStages) === this.speed(this.foe, this.foe.stages) && rand() < 0.5);
    const order = meFirst ? ['ally', 'foe'] : ['foe', 'ally'];
    for (const who of order) {
      const end = who === 'ally' ? await this.attack(true, mine) : await this.attack(false, theirs);
      if (end !== undefined) return end;
    }
    return null;
  }
  async foeTurn() { const e = await this.attack(false, this.foeMove()); return e === undefined ? null : e; }

  // Devuelve undefined si el combate sigue, o el resultado si terminó.
  async attack(isAlly, slot) {
    const user = isAlly ? this.ally : this.foe, target = isAlly ? this.foe : this.ally;
    const us = isAlly ? this.allyStages : this.foe.stages, ts = isAlly ? this.foe.stages : this.allyStages;
    const M = MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
    const who = isAlly ? user.name : (this.opts.wild ? `El ${user.name} salvaje` : user.name);
    await this.msg(`¡${who} usó ${M.name}!`, 30);
    // pequeño embiste
    const key = isAlly ? 'allyX' : 'foeX', dir = isAlly ? 1 : -1;
    await this.tween(this.fx, key, 10 * dir, 4); await this.tween(this.fx, key, 0, 4);
    if (rand() * 100 >= M.acc) { await this.msg('¡Pero falló!'); return undefined; }
    if (M.power > 0) {
      const eff = effectiveness(M.type, SPECIES[target.sp].types);
      if (eff === 0) { await this.msg('No afecta...'); return undefined; }
      const crit = rand() < 1 / 16 ? 1.5 : 1;
      const A = user.stats.atk * (crit > 1 ? Math.max(1, STAGE(us.atk)) : STAGE(us.atk));
      const D = target.stats.def * (crit > 1 ? Math.min(1, STAGE(ts.def)) : STAGE(ts.def));
      const stab = SPECIES[user.sp].types.includes(M.type) ? 1.5 : 1;
      let dmg = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * M.power * A / D) / 50) + 2;
      dmg = Math.max(1, Math.floor(dmg * stab * eff * crit * (0.85 + rand() * 0.15)));
      const blink = isAlly ? 'foeBlink' : 'allyBlink';
      this.fx[blink] = true; await this.wait(24); this.fx[blink] = false;
      await this.tween(target, 'hp', Math.max(0, target.hp - dmg), 22);
      target.hp = Math.max(0, Math.round(target.hp));
      if (crit > 1) await this.msg('¡Un golpe crítico!', 30);
      if (eff > 1) await this.msg('¡Es muy eficaz!', 30);
      if (eff < 1) await this.msg('No es muy eficaz...', 30);
      if (target.hp <= 0) return this.faint(!isAlly);
    } else if (M.effect) {
      const e = M.effect, stages = e.target === 'foe' ? ts : us, who = e.target === 'foe' ? target : user;
      const names = { atk: 'Ataque', def: 'Defensa', spe: 'Velocidad' };
      if (Math.abs(stages[e.stat] + e.stages) > 6) await this.msg(`¡La ${names[e.stat]} de ${who.name} no puede bajar más!`);
      else { stages[e.stat] += e.stages; await this.msg(`¡${e.stages < 0 ? 'Bajó' : 'Subió'} ${names[e.stat] === 'Ataque' ? 'el' : 'la'} ${names[e.stat]} de ${who.name}!`); }
    }
    return undefined;
  }

  async faint(allyFainted) {
    if (!allyFainted) {
      await Promise.all([this.tween(this.fx, 'foeY', 40, 18), this.tween(this.fx, 'foeAlpha', 0, 18)]);
      this.showHud(false, true);
      await this.msg(`¡${this.opts.wild ? 'El ' + this.foe.name + ' salvaje' : this.foe.name} se debilitó!`);
      await this.giveExp();
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
      return null; // el turno termina tras el cambio
    }
    await this.msg('¡No te quedan criaturas en pie!');
    return 'lose';
  }

  async giveExp() {
    const base = SPECIES[this.foe.sp].exp;
    const total = Math.max(1, Math.floor(base * this.foe.level / 7 * (this.opts.wild ? 1 : 1.5)));
    const ids = [...this.participants].filter(i => this.st.party[i] && this.st.party[i].hp > 0);
    const each = Math.max(1, Math.floor(total / Math.max(1, ids.length)));
    for (const i of ids) {
      const c = this.st.party[i];
      await this.msg(`¡${c.name} ganó ${each} puntos de experiencia!`, 34);
      let target = c.exp + each;
      while (target >= expForLevel(c.level + 1)) {
        if (i === this.activeIdx) await this.tween(c, 'exp', expForLevel(c.level + 1), 18);
        c.exp = expForLevel(c.level + 1);
        c.level++; refreshStats(c); this.hud();
        await this.msg(`¡${c.name} subió al nivel ${c.level}!`);
        for (const [lv, mid] of SPECIES[c.sp].learn) {
          if (lv !== c.level || c.moves.some(m => m.id === mid)) continue;
          if (c.moves.length < 4) { c.moves.push({ id: mid, pp: MOVES[mid].pp }); await this.msg(`¡${c.name} aprendió ${MOVES[mid].name}!`); }
          else await this.msg(`${c.name} quería aprender ${MOVES[mid].name}, pero ya conoce cuatro movimientos.`);
        }
      }
      if (i === this.activeIdx) await this.tween(c, 'exp', target, 14);
      c.exp = target; this.hud();
    }
  }

  async throwCapsule() {
    if (this.st.party.length >= 6) { await this.msg('¡Tu equipo está lleno! (Máximo 6.)'); return null; }
    this.st.bag.capsula--;
    await this.msg(`¡${this.st.name} lanzó una Cápsula!`, 10);
    const f = this.fx; f.ball = { x: 60, y: 120 };
    for (let i = 1; i <= 26; i++) { const k = i / 26; f.ball.x = Math.round(60 + (186 - 60) * k); f.ball.y = Math.round(120 + (60 - 120) * k - Math.sin(k * Math.PI) * 50); await this.wait(1); }
    f.flash = 0.8;
    await Promise.all([this.tween(f, 'foeScale', 0.05, 12), this.tween(f, 'foeAlpha', 0, 12)]);
    f.ball.y = 76;
    const max = this.foe.stats.hp, hp = this.foe.hp;
    const chance = Math.min(1, ((3 * max - 2 * hp) * 190) / (3 * max) / 255 + 0.05);
    const ok = rand() < chance;
    const wobbles = ok ? 3 : Math.floor(rand() * 3);
    for (let w = 0; w < wobbles; w++) {
      await this.wait(18);
      for (const dx of [-2, 2, -2, 0]) { f.ball.x = 186 + dx; await this.wait(4); }
    }
    await this.wait(16);
    if (ok) {
      await this.msg(`¡Ya está! ¡Atrapaste a ${this.foe.name}!`, 60);
      delete this.foe.stages;
      this.foe.hp = Math.max(1, this.foe.hp);
      this.st.party.push(this.foe);
      await this.msg(`${this.foe.name} se unió a tu equipo.`);
      f.ball = null;
      return 'caught';
    }
    f.ball = null; f.flash = 0.6;
    await Promise.all([this.tween(f, 'foeScale', 1, 10), this.tween(f, 'foeAlpha', 1, 10)]);
    await this.msg(['¡Oh, no! ¡Se escapó!', '¡Casi lo tenías!', '¡Uy! ¡Por poquito!'][wobbles] || '¡Se escapó!');
    return this.foeTurn();
  }
}
