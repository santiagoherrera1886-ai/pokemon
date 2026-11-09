// Combate por turnos a pantalla completa: escena con fondo según el terreno, sprites con animación,
// efectos por tipo de movimiento, entrenadores con varias criaturas, experiencia, niveles, aprendizaje y captura.
import { ui, esc, statusChip } from '../ui/ui.js';
import { itemIcon } from '../art/items.js';
import { input } from '../core/input.js';
import { battleSprite, silhouette, iconURL } from '../art/creatures.js';
import { sheet } from '../art/characters.js';
import { canvas, px, ellipse, hash } from '../core/pixel.js';
import { SPECIES, MOVES, TYPES, STATUS, effectiveness, expForLevel, refreshStats } from '../data/creatures.js';
import { canGetStatus, TYPE_FX } from '../data/types.js';
import { movePower, ANIM_FRAMES } from '../data/moves.js';
import { ITEMS, POCKETS, BATTLE_POCKETS, pocketItems, isCapsule, canUseOn, useOnCreature, catchBonus } from '../data/items.js';
import { albaStat, hasAlbaBand, clearAlba, ALBA_COLOR } from '../data/alba.js';

const $ = id => document.getElementById(id);
const STAGE = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const rand = () => Math.random();
const CONTACT = new Set(['tackle', 'scratch', 'bite', 'punch', 'slash']);
const STAT_NAMES = { atk: 'el Ataque', def: 'la Defensa', spe: 'la Velocidad' };


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
    this.fxEvents = [];                       // animaciones pendientes para el modo 3D
    this.participants = new Set();
    this.allyStages = { atk: 0, def: 0, spe: 0 };
    this.volAlly = { conf: 0, prot: 0 }; this.volFoe = { conf: 0, prot: 0 };
    this.albaUsed = false; this.foeAlbaUsed = false; this.albaArmed = false;   // Forma Alba: una vez por combate y por bando
    document.body.classList.add('in-battle');
  }
  get foe() { return this.foeParty[this.foeIdx]; }
  pic(sp) { const p = this.game.graphics?.portrait(sp); return p ? `<img class="pt" src="${p}" alt="">` : `<img src="${iconURL(sp)}" alt="">`; }
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
      const s = f.foeScale * (this.foe.alba ? 1.12 : 1), size = 64 * k * s;
      const img = f.foeWhite ? silhouette(this.foe.sp) : battleSprite(this.foe.sp);
      const fx0 = Math.round(L.foe[0] - size / 2 + f.foeX * L.w + sh), fy0 = Math.round(L.foe[1] - size + 4 * k + f.foeY * k + (f.foeScale === 1 ? bob : 0));
      if (this.foe.alba && !f.foeWhite) this.aura(g, this.foe.sp, false, fx0, fy0, size, k);
      g.drawImage(img, fx0, fy0, size, size);
      g.globalAlpha = 1;
    }
    if (this.ally && f.allyAlpha > 0 && !(f.allyBlink && (this.game.frame >> 2) % 2)) {
      g.globalAlpha = f.allyAlpha;
      const size = 80 * k * (this.ally.alba ? 1.12 : 1);
      const ax0 = Math.round(L.ally[0] - size / 2 + f.allyX * L.w + sh), ay0 = Math.round(L.ally[1] - size + 10 * k + f.allyY * k - bob);
      if (this.ally.alba) this.aura(g, this.ally.sp, true, ax0, ay0, size, k);
      g.drawImage(battleSprite(this.ally.sp, true), ax0, ay0, size, size);
      g.globalAlpha = 1;
    }
    if (f.ball) this.drawCapsule(g, f.ball, L, k);
    for (const p of this.parts) {
      if (p.delay > 0) { p.delay--; continue; }
      p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--;
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 12));
      if (p.ring) { g.strokeStyle = p.color; g.lineWidth = k; g.beginPath(); g.arc(p.x, p.y, Math.max(0, 30 - p.life) * k * 1.4, 0, Math.PI * 2); g.stroke(); }
      else if (p.line) { g.strokeStyle = p.color; g.lineWidth = Math.max(1, p.s * k / 2); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.line[0], p.line[1]); g.stroke(); }
      else if (p.text) { g.fillStyle = p.color; g.font = `bold ${p.s * k * 3}px monospace`; g.fillText(p.text, p.x, p.y); }
      else {
        if (p.trail) { g.fillStyle = p.trail; g.fillRect(Math.round(p.x - p.vx * 2), Math.round(p.y - p.vy * 2), p.s * k, p.s * k); }
        g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(p.y), p.s * k, p.s * k);
      }
    }
    g.globalAlpha = 1;
    this.parts = this.parts.filter(p => p.life > 0);
    if (f.flash > 0) { g.fillStyle = `rgba(255,255,255,${f.flash})`; g.fillRect(0, 0, r.w, r.h); f.flash = Math.max(0, f.flash - 0.06); }
    this.L = L;
  }

  // Forma Alba en modo clásico: contorno dorado que late, rayos de amanecer detrás y chispas que suben.
  aura(g, sp, back, x, y, size, k) {
    const t = this.game.frame, pulse = .55 + .25 * Math.sin(t / 9), glow = silhouette(sp, ALBA_COLOR, back);
    g.save(); g.globalAlpha = .28; g.fillStyle = ALBA_COLOR; g.translate(x + size / 2, y + size * .55);
    for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-k, 0, 2 * k, size * (.5 + .12 * Math.sin(t / 14 + i))); }
    g.restore();
    g.globalAlpha = pulse;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) g.drawImage(glow, x + dx * k, y + dy * k, size, size);
    g.globalAlpha = 1;
    if (t % 6 === 0) this.parts.push({ x: x + size * (.2 + rand() * .6), y: y + size * .8, vx: (rand() - .5) * .4, vy: -1 - rand(), life: 26, color: rand() < .5 ? '#fff4c8' : ALBA_COLOR, s: 2 });
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

  // Animaciones del modo clásico (pixel): partículas, proyectiles, rayos, ondas y estados.
  effect2d(ev) {
    const L = this.L; if (!L) return;
    const k = L.k, side = n => (n === 'ally' ? L.ally : L.foe), [fx0, fy0] = side(ev.from), [tx0, ty0] = side(ev.to);
    const sx = fx0, sy = fy0 - 32 * k, cx = tx0, cy = ty0 - 32 * k;
    const C = TYPE_FX[ev.status] || TYPE_FX[ev.type] || TYPE_FX.normal;
    const R = a => (rand() - 0.5) * a, add = (n, f) => { for (let i = 0; i < n; i++) this.parts.push(f(i)); };
    const burst = (n, spd = 3, life = 18, size = 2) => add(n, i => { const a = rand() * Math.PI * 2, v = (0.4 + rand()) * spd; return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, color: C[i % C.length], s: size, delay: ev.delay || 0 }; });
    const toward = (n, d0, spread, size, life) => add(n, i => ({ x: sx + R(spread), y: sy + R(spread), vx: (cx - sx) / life, vy: (cy - sy) / life, life, color: C[i % C.length], s: size, delay: d0 + i * 1.2, then: 'burst' }));
    switch (ev.anim) {
      case 'shot': case 'sting': add(1, () => ({ x: sx, y: sy, vx: (cx - sx) / 18, vy: (cy - sy) / 18, life: 18, color: C[0], s: ev.anim === 'sting' ? 3 : 6, trail: C[1] })); this.pendingBurst = { at: this.game.frame + 18, n: 16 }; break;
      case 'spray': case 'drain': if (ev.anim === 'drain') { add(14, i => ({ x: cx + R(30 * k), y: cy + R(30 * k), vx: (sx - cx) / 26, vy: (sy - cy) / 26, life: 26, color: C[i % 2], s: 3, delay: i * 2 })); } else toward(22, 0, 6 * k, 3, 20); break;
      case 'beam': add(30, i => ({ x: sx + (cx - sx) * i / 30, y: sy + (cy - sy) * i / 30 + R(4 * k), vx: 0, vy: 0, life: 22, color: C[i % 2], s: 4, delay: i * .6 })); this.pendingBurst = { at: this.game.frame + 24, n: 18 }; break;
      case 'bolt': { let x = cx, y = cy - 120 * k; for (let i = 0; i < 14; i++) { const nx = cx + R(30 * k), ny = y + 9 * k; this.parts.push({ x, y, vx: 0, vy: 0, life: 16, color: i % 2 ? '#ffffff' : C[0], s: 4, line: [nx, ny], delay: 4 }); x = nx; y = ny; } burst(16, 3, 16, 3); break; }
      case 'rain': add(26, i => { const vy = (2.6 + rand()) * k; return { x: cx + R(70 * k), y: cy - vy * 18 - rand() * 12 * k, vx: 0, vy, life: 24, color: C[i % C.length], s: 3 + (i % 2), delay: i * 1.2 }; }); break;
      case 'pillar': add(30, i => ({ x: cx + R(30 * k), y: ty0, vx: R(.6), vy: -2.5 - rand() * 3, life: 26, color: C[i % C.length], s: 3, delay: i * .5 })); break;
      case 'wave': add(36, i => ({ x: sx - 30 * k + R(10 * k), y: ty0 - (i % 6) * 6 * k, vx: (cx - sx + 60 * k) / 30, vy: R(.6), life: 32, color: C[i % 2], s: 4, delay: (i % 6) * 2 })); break;
      case 'quake': this.fx.shake = 24; add(20, i => ({ x: cx + R(90 * k), y: ty0, vx: R(2), vy: -2 - rand() * 2, g: .25, life: 26, color: C[i % C.length], s: 3 })); break;
      case 'gust': add(26, i => { const a = i / 26 * Math.PI * 4; return { x: cx + Math.cos(a) * 26 * k, y: cy + 20 * k - i * 2 * k, vx: -Math.sin(a) * 2, vy: -.6, life: 24, color: C[i % 2], s: 2, delay: i * .5 }; }); break;
      case 'rings': case 'roar': case 'shadow': add(5, i => ({ x: ev.anim === 'roar' ? sx : cx, y: ev.anim === 'roar' ? sy : cy, vx: 0, vy: 0, life: 30 - i * 5, color: C[i % 2], ring: true, delay: i * 4 })); if (ev.anim === 'shadow') burst(14, 1.5, 26, 4); break;
      case 'heal': case 'buff': add(16, i => ({ x: cx + R(40 * k), y: cy + 24 * k, vx: 0, vy: -1.4 - rand(), life: 28, color: C[i % C.length], s: 2, delay: i * 1.5 })); break;
      case 'debuff': add(14, i => ({ x: cx + R(40 * k), y: cy - 24 * k, vx: 0, vy: 1.4 + rand(), life: 24, color: C[i % C.length], s: 2, delay: i * 1.5 })); break;
      case 'powder': case 'sparkle': add(26, i => ({ x: cx + R(60 * k), y: cy - 40 * k + R(20 * k), vx: R(.8), vy: .6 + rand() * .6, life: 34, color: C[i % C.length], s: 2, delay: i })); break;
      case 'shield': add(5, i => ({ x: cx, y: cy, vx: 0, vy: 0, life: 26 - i * 3, color: C[0], ring: true, delay: i * 3 })); break;
      case 'status': if (ev.status === 'dor') add(3, i => ({ x: cx + 10 * k + i * 6 * k, y: cy - 10 * k, vx: .5, vy: -.8, life: 30, color: '#ffffff', s: 3 + i, delay: i * 8, text: 'z' })); else burst(18, 2, 24, 2); break;
      case 'alba': this.fx.flash = .7; add(40, i => ({ x: tx0 + R(70 * k), y: ty0, vx: R(.4), vy: -2.2 - rand() * 2.4, life: 34, color: i % 3 ? ALBA_COLOR : '#ffffff', s: 2 + (i % 2), delay: i * .6 })); add(4, i => ({ x: cx, y: cy, vx: 0, vy: 0, life: 30 - i * 5, color: ALBA_COLOR, ring: true, delay: 10 + i * 5 })); break;
      case 'dragon': add(32, i => { const t = i / 32; return { x: sx + (cx - sx) * t + Math.sin(t * 12) * 14 * k, y: sy + (cy - sy) * t + Math.cos(t * 12) * 10 * k, vx: 0, vy: 0, life: 22, color: C[i % 2], s: 4, delay: i * .7 }; }); this.pendingBurst = { at: this.game.frame + 24, n: 20 }; break;
      default: burst(ev.anim === 'punch' || ev.anim === 'tackle' ? 16 : 12, 3.2, 18, 3); if (ev.anim === 'scratch' || ev.anim === 'slash') add(3, i => ({ x: cx - 18 * k + i * 12 * k, y: cy - 18 * k, vx: 0, vy: 0, life: 16, color: '#ffffff', s: 3, line: [cx - 6 * k + i * 12 * k, cy + 18 * k] }));
    }
    if (this.pendingBurst) { const b = this.pendingBurst; this.pendingBurst = null; const n = b.n; add(n, i => { const a = rand() * Math.PI * 2, v = 1 + rand() * 3; return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 16, color: C[i % C.length], s: 3, delay: b.at - this.game.frame }; }); }
  }

  // ---------- HUD ----------
  hud() {
    const foe = this.foe, al = this.ally;
    const bar = (hp, max) => { const k = Math.max(0, hp / max); return `<div class="hp"><i style="width:${k * 100}%" class="${k > 0.5 ? 'g' : k > 0.2 ? 'y' : 'r'}"></i></div>`; };
    const caught = this.opts.wild && this.st.dex && this.st.dex[foe.sp] === 2 ? ' <span title="Ya atrapado">◉</span>' : '';
    const albaChip = c => c.alba ? '<i class="st alba">ALBA</i>' : '';
    $('hudFoe').innerHTML = `<b>${esc(foe.name)}</b>${caught}${albaChip(foe)}${statusChip(foe)}<span>Nv${foe.level}</span>${bar(foe.hp, foe.stats.hp)}`;
    if (al) {
      const lo = expForLevel(al.level), hi = expForLevel(al.level + 1);
      $('hudAlly').innerHTML = `<b>${esc(al.name)}</b>${albaChip(al)}${statusChip(al)}<span>Nv${al.level}</span>${bar(al.hp, al.stats.hp)}<em>${Math.max(0, Math.ceil(al.hp))}/${al.stats.hp}</em><div class="xp"><i style="width:${Math.max(0, Math.min(100, (al.exp - lo) / (hi - lo) * 100))}%"></i></div>`;
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
    this.volFoe = { conf: 0, prot: 0 };
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
    this.volAlly = { conf: 0, prot: 0 };
    this.allyCrit = false;
    this.participants.add(this.activeIdx);
    ui.show(`¡Adelante, ${this.ally.name}!`);
    await this.tween(this.fx, 'allyX', 0, 22);
    this.showHud(true, true); this.hud();
    await this.wait(16);
  }
  cleanup() {
    clearAlba(this.st.party); clearAlba(this.foeParty);
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
        if (al.moves.every(m => m.pp <= 0)) { ui.show(`¡A ${al.name} no le quedan PP! Usará Forcejeo.`); return resolve({ type: 'move', i: -1, alba: this.albaArmed && this.canAlba() }); }
        const alba = this.canAlba() ? `<button class="bt-alba${this.albaArmed ? ' on' : ''}" data-act="alba">${this.albaArmed ? '✦ FORMA ALBA LISTA' : '✦ FORMA ALBA'}</button>` : '';
        ui.setPanel(`${alba}<div class="bt-moves">${al.moves.map((m, i) => { const M = MOVES[m.id]; const eff = M.power ? effectiveness(M.type, SPECIES[this.foe.sp].types) : 1; return `<button class="mv" style="--t:${TYPES[M.type].color}" data-act="${i}" ${m.pp <= 0 ? 'disabled' : ''}><b>${esc(M.name)}</b><small>${TYPES[M.type].name}${M.power ? ' · ' + M.power : ''}${this.st.dex?.[this.foe.sp] && eff !== 1 ? (eff > 1 ? ' · ¡eficaz!' : ' · poco eficaz') : ''}</small><em>PP ${m.pp}/${M.pp}</em></button>`; }).join('')}</div><button class="bt-back" data-back>VOLVER</button>`,
          { modal: true, cls: 'battle-panel', focus: alba ? 1 : 0, onAct: a => { if (a === 'alba') { this.albaArmed = !this.albaArmed; return moves(); } resolve({ type: 'move', i: +a, alba: this.albaArmed && this.canAlba() }); }, onBack: () => { this.albaArmed = false; main(); },
            onFocus: el => { if (el.dataset.act === 'alba') return ui.show(this.albaArmed ? `${al.name} despertará la Forma Alba antes de atacar. Escoge el ataque.` : `Forma Alba: ${al.name} crece y sube su Ataque, Defensa y Velocidad. Una vez por combate.`); const M = MOVES[al.moves[+el.dataset.act]?.id]; if (M) ui.show(`${M.name}: ${M.desc || ''}${M.power ? ` Potencia ${M.power}` : ''}${M.acc < 100 ? ` · Precisión ${M.acc}%` : ''}${M.prio ? ' · Va primero' : ''}`); } });
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
        ui.setPanel(`<div class="bt-list party">${this.st.party.map((c, i) => `<button data-act="${i}" class="${i === this.activeIdx ? 'cur' : ''}${usable(c) ? '' : ' dim'}">${this.pic(c.sp)}<b>${esc(c.name)}</b>${statusChip(c)}<span>Nv${c.level} · ${Math.ceil(c.hp)}/${c.stats.hp}</span></button>`).join('')}</div>${forced ? '' : '<button class="bt-back" data-back>VOLVER</button>'}`,
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
    if (!usable.length) return { id: 'forcejeo', pp: 1 };
    // IA: prefiere ataques fuertes y eficaces; usa estados y mejoras de vez en cuando y no repite lo inútil.
    const foe = this.foe, ally = this.ally, target = ally ? SPECIES[ally.sp].types : [], mine = SPECIES[foe.sp].types;
    const hpK = foe.hp / foe.stats.hp;
    const score = m => {
      const M = MOVES[m.id];
      if (M.power) return movePower(m.id) * effectiveness(M.type, target) * (mine.includes(M.type) ? 1.5 : 1) * (M.acc / 100) * (M.recoil && hpK < .3 ? .5 : 1) + (M.prio && ally && ally.hp < ally.stats.hp * .25 ? 60 : 0);
      if (M.protect) return this.volFoe.prot === this.turnN - 1 ? 0 : 12;
      if (M.heal) return hpK < .4 ? 120 : hpK > .8 ? 0 : 20;
      if (M.status) return ally && !ally.status && canGetStatus(M.status[0], target) ? 55 * M.acc / 100 : 0;
      if (M.confuse) return this.volAlly.conf ? 0 : 35;
      if (M.stat) { const e = M.stat[0], st = e.target === 'self' ? foe.stages : this.allyStages; return Math.abs(st[e.stat] + e.stages) > 4 ? 0 : 28; }
      return 10;
    };
    const smart = this.trainer ? 0.8 : 0.5;
    if (rand() < smart) return usable.reduce((a, b) => score(b) > score(a) ? b : a);
    const ok = usable.filter(m => score(m) > 0);
    return (ok.length ? ok : usable)[Math.floor(rand() * (ok.length || usable.length))];
  }
  speed(c, stages) { return albaStat(c, 'spe') * STAGE(stages.spe) * (c.status === 'par' ? .5 : 1); }

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
      if (res.cured) { this.hud(); this.play('heal', 'normal', act.target === this.activeIdx, { self: true }); }
      await this.msg(res.msg);
      return this.foeTurn();
    }
    if (act.type === 'boost') {
      const it = ITEMS[act.id], al = this.ally;
      this.st.bag[act.id]--;
      await this.msg(`¡${this.st.name} usó ${it.name}!`, 20);
      this.play('buff', 'normal', true, { self: true });
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

    if (act.alba && this.canAlba()) await this.transform(true);
    await this.foeAlbaCheck();
    const mine = act.i < 0 ? { id: 'forcejeo', pp: 1 } : this.ally.moves[act.i];
    const theirs = this.foeMove();
    const pa = MOVES[mine.id].prio || 0, pf = MOVES[theirs.id].prio || 0;
    const sa = this.speed(this.ally, this.allyStages), sf = this.speed(this.foe, this.foe.stages);
    const allyFirst = pa !== pf ? pa > pf : (sa > sf || (sa === sf && rand() < 0.5));
    for (const who of allyFirst ? ['ally', 'foe'] : ['foe', 'ally']) {
      const end = who === 'ally' ? await this.attack(true, mine) : await this.attack(false, theirs);
      if (end !== undefined) return end;
    }
    return this.endTurn();
  }
  async foeTurn() { await this.foeAlbaCheck(); const e = await this.attack(false, this.foeMove()); return e === undefined ? this.endTurn() : e; }

  // ---------- Forma Alba ----------
  canAlba() { return !this.albaUsed && hasAlbaBand(this.st) && !!this.ally && this.ally.hp > 0 && !this.ally.alba; }
  // Los líderes, el rival y la Liga la despiertan con su última criatura (su as).
  async foeAlbaCheck() {
    const t = this.trainer, foe = this.foe;
    if (t && t.alba && !this.foeAlbaUsed && foe && foe.hp > 0 && !foe.alba && this.foeIdx === this.foeParty.length - 1) await this.transform(false);
  }
  async transform(isAlly) {
    const c = isAlly ? this.ally : this.foe, type = SPECIES[c.sp].types[0];
    if (isAlly) { this.albaUsed = true; this.albaArmed = false; } else this.foeAlbaUsed = true;
    await this.msg(isAlly ? `¡${this.st.name} alzó el Brazalete Alba!` : `¡${this.trainer.name} alzó su Brazalete Alba!`, 26);
    const frames = this.play('alba', type, isAlly, { self: true });
    await this.wait(Math.round(frames * .5));
    c.alba = true; this.hud();
    await this.wait(Math.round(frames * .5));
    await this.msg(`¡${this.nameOf(c, isAlly)} despertó la Forma Alba!`);
    await this.msg('Subieron su Ataque, su Defensa y su Velocidad.', 26);
  }

  // ---------- Estados ----------
  nameOf(c, isAlly) { return isAlly ? c.name : (this.trainer ? `${c.name} rival` : (this.opts.legendary ? c.name : `El ${c.name} salvaje`)); }
  vol(isAlly) { return isAlly ? this.volAlly : this.volFoe; }
  // Animación: en 3D la dibuja el motor (fxEvents); en clásico, partículas en el lienzo. Devuelve cuadros a esperar.
  play(anim, type, fromAlly, extra = {}) {
    const ev = { anim, type, from: fromAlly ? 'ally' : 'foe', to: extra.self ? (fromAlly ? 'ally' : 'foe') : (fromAlly ? 'foe' : 'ally'), ...extra };
    const g = this.game.graphics;
    if (g && g.mode === 'premium' && g.status === 'ready' && g.engine && !g.engine.lost) { this.fxEvents.push(ev); if (this.fxEvents.length > 12) this.fxEvents.shift(); }
    else this.effect2d(ev);
    return ANIM_FRAMES[anim] || 30;
  }
  async applyStatus(target, id, targetIsAlly, announce) {
    const name = this.nameOf(target, targetIsAlly);
    if (target.hp <= 0) return false;
    if (target.status) { if (announce) await this.msg(target.status === id ? `¡${name} ya está ${STATUS[id].name.toLowerCase()}!` : `No afectó a ${name}...`); return false; }
    if (!canGetStatus(id, SPECIES[target.sp].types)) { if (announce) await this.msg(`No afecta a ${name}...`); return false; }
    target.status = id; if (id === 'dor') target.sleep = 2 + Math.floor(rand() * 3);
    await this.wait(this.play('status', id, targetIsAlly, { self: true, status: id }));
    this.hud(); await this.msg(`¡${name} ${STATUS[id].verb}!`);
    return true;
  }
  async confuse(target, targetIsAlly, announce) {
    const v = this.vol(targetIsAlly), name = this.nameOf(target, targetIsAlly);
    if (target.hp <= 0) return;
    if (v.conf) { if (announce) await this.msg(`¡${name} ya está confundido!`); return; }
    v.conf = 2 + Math.floor(rand() * 4);
    await this.wait(this.play('status', 'conf', targetIsAlly, { self: true, status: 'conf' }));
    await this.msg(`¡${name} quedó confundido!`);
  }
  async changeStat(c, stages, e, isAlly) {
    const name = this.nameOf(c, isAlly);
    if (c.hp <= 0) return;
    if ((e.stages > 0 && stages[e.stat] >= 6) || (e.stages < 0 && stages[e.stat] <= -6)) { await this.msg(`¡${STAT_NAMES[e.stat]} de ${name} no puede ${e.stages > 0 ? 'subir' : 'bajar'} más!`); return; }
    stages[e.stat] = Math.max(-6, Math.min(6, stages[e.stat] + e.stages));
    this.play(e.stages > 0 ? 'buff' : 'debuff', e.stages > 0 ? 'normal' : 'psiquico', isAlly, { self: true, quiet: true });
    await this.msg(`¡${Math.abs(e.stages) > 1 ? (e.stages > 0 ? 'Subió mucho' : 'Bajó mucho') : (e.stages > 0 ? 'Subió' : 'Bajó')} ${STAT_NAMES[e.stat]} de ${name}!`);
  }
  // Antes de moverse: sueño, congelación, confusión y parálisis. Devuelve true, 'skip' o { end }.
  async canAct(user, isAlly) {
    const name = this.nameOf(user, isAlly), v = this.vol(isAlly);
    if (user.status === 'dor') {
      if (--user.sleep > 0) { await this.wait(this.play('status', 'dor', isAlly, { self: true, status: 'dor' }) >> 1); await this.msg(`${name} está dormido.`); return 'skip'; }
      user.status = null; this.hud(); await this.msg(`¡${name} se despertó!`);
    }
    if (user.status === 'con') {
      if (rand() < .2) { user.status = null; this.hud(); await this.msg(`¡${name} se descongeló!`); }
      else { await this.wait(this.play('status', 'con', isAlly, { self: true, status: 'con' }) >> 1); await this.msg(`¡${name} está congelado!`); return 'skip'; }
    }
    if (v.conf > 0) {
      if (--v.conf === 0) await this.msg(`¡${name} ya no está confundido!`);
      else {
        await this.wait(this.play('status', 'conf', isAlly, { self: true, status: 'conf' }) >> 1);
        await this.msg(`${name} está confundido...`);
        if (rand() < 1 / 3) {
          const dmg = this.damage(user, user, { power: 40, type: null }, isAlly ? this.allyStages : this.foe.stages, isAlly ? this.allyStages : this.foe.stages, isAlly).dmg;
          await this.hit(user, isAlly, dmg, 6);
          await this.msg('¡Se golpeó a sí mismo por la confusión!');
          if (user.hp <= 0) return { end: await this.faint(isAlly) };
          return 'skip';
        }
      }
    }
    if (user.status === 'par' && rand() < .25) { await this.wait(this.play('status', 'par', isAlly, { self: true, status: 'par' }) >> 1); await this.msg(`¡${name} está paralizado! No se puede mover.`); return 'skip'; }
    return true;
  }
  // Fin del turno: quemaduras y veneno restan PS.
  async endTurn() {
    for (const isAlly of [true, false]) {
      const c = isAlly ? this.ally : this.foe;
      if (!c || c.hp <= 0 || (c.status !== 'que' && c.status !== 'ven')) continue;
      const dmg = Math.max(1, Math.floor(c.stats.hp / (c.status === 'que' ? 16 : 8)));
      await this.wait(this.play('status', c.status, isAlly, { self: true, status: c.status }) >> 1);
      await this.msg(c.status === 'que' ? `¡${this.nameOf(c, isAlly)} sufre por la quemadura!` : `¡El veneno le resta PS a ${this.nameOf(c, isAlly)}!`, 26);
      await this.hit(c, isAlly, dmg, 4);
      if (c.hp <= 0) { const end = await this.faint(isAlly); if (end !== undefined) return end; }
    }
    return null;
  }
  // Daño con la fórmula de siempre: ataque, defensa, etapas, quemadura, mismo tipo, efectividad y crítico.
  damage(user, target, M, us, ts, isAlly) {
    const eff = M.type ? effectiveness(M.type, SPECIES[target.sp].types) : 1;
    const critRate = Math.min(.5, (M.crit ? 1 / 8 : 1 / 16) * (isAlly && this.allyCrit ? 4 : 1));
    const crit = M.type && rand() < critRate ? 1.5 : 1;
    const A = albaStat(user, 'atk') * (crit > 1 ? Math.max(1, STAGE(us.atk)) : STAGE(us.atk)) * (user.status === 'que' ? .5 : 1);
    const D = albaStat(target, 'def') * (crit > 1 ? Math.min(1, STAGE(ts.def)) : STAGE(ts.def));
    const stab = M.type && SPECIES[user.sp].types.includes(M.type) ? 1.5 : 1;
    let dmg = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * M.power * A / D) / 50) + 2;
    dmg = Math.max(1, Math.floor(dmg * stab * eff * crit * (0.85 + rand() * 0.15)));
    return { dmg, eff, crit };
  }
  // Aplica daño con parpadeo, sacudida y barra de PS animada.
  async hit(c, isAlly, dmg, shake = 6) {
    const blink = isAlly ? 'allyBlink' : 'foeBlink';
    this.fx[blink] = true; this.fx.shake = shake; await this.wait(14); this.fx[blink] = false;
    await this.tween(c, 'hp', Math.max(0, c.hp - dmg), 18);
    c.hp = Math.max(0, Math.round(c.hp)); this.hud();
  }

  // Devuelve undefined si el combate sigue, null si terminó el turno por un cambio, o el resultado final.
  async attack(isAlly, slot) {
    const user = isAlly ? this.ally : this.foe, target = isAlly ? this.foe : this.ally;
    const us = isAlly ? this.allyStages : this.foe.stages, ts = isAlly ? this.foe.stages : this.allyStages;
    const M = MOVES[slot.id], name = this.nameOf(user, isAlly), tname = this.nameOf(target, !isAlly);
    const can = await this.canAct(user, isAlly);
    if (can !== true) return can === 'skip' ? undefined : can.end;
    slot.pp = Math.max(0, slot.pp - 1);
    await this.msg(`¡${name} usó ${M.name}!`, 28);
    // Embestida hacia el rival en los ataques de contacto; un pasito en los demás.
    const key = isAlly ? 'allyX' : 'foeX', dir = isAlly ? 1 : -1, reach = CONTACT.has(M.anim) ? .1 : .03;
    await this.tween(this.fx, key, reach * dir, CONTACT.has(M.anim) ? 6 : 4);
    if (M.protect) {
      this.vol(isAlly).prot = this.turnN;
      await this.wait(this.play('shield', M.type, isAlly, { self: true }));
      await this.tween(this.fx, key, 0, 4);
      await this.msg(`¡${name} se protege!`); return undefined;
    }
    const aimsFoe = M.power > 0 || M.status || M.confuse || (M.stat || []).some(e => e.target === 'foe');
    if (aimsFoe && this.vol(!isAlly).prot === this.turnN) { await this.tween(this.fx, key, 0, 4); await this.wait(this.play('shield', 'normal', !isAlly, { self: true })); await this.msg(`¡${tname} se protegió del ataque!`); return undefined; }
    if (aimsFoe && rand() * 100 >= M.acc) { await this.tween(this.fx, key, 0, 4); await this.msg(`¡${name} falló!`); return undefined; }
    if (M.power > 0) {
      const eff0 = effectiveness(M.type, SPECIES[target.sp].types);
      const n = M.hits ? M.hits[0] + Math.floor(rand() * (M.hits[1] - M.hits[0] + 1)) : 1;
      let total = 0, hits = 0, crits = 0;
      for (let h = 0; h < n && target.hp > 0; h++) {
        const frames = this.play(M.anim, M.type, isAlly, { power: M.power, eff: eff0, hit: h });
        await this.wait(h === 0 ? frames : Math.min(frames, 22));
        if (h === 0) await this.tween(this.fx, key, 0, 4);
        if (eff0 === 0) { await this.msg(`No afecta a ${tname}...`); return undefined; }
        const r = this.damage(user, target, M, us, ts, isAlly), before = target.hp;
        await this.hit(target, !isAlly, r.dmg, r.eff > 1 ? 16 : M.power >= 90 ? 10 : 6);
        total += before - target.hp; hits++; if (r.crit > 1) crits++;
        if (target.status === 'con' && M.type === 'fuego' && target.hp > 0) { target.status = null; this.hud(); await this.msg(`¡${tname} se descongeló!`); }
      }
      if (crits) await this.msg(crits > 1 ? `¡${crits} golpes críticos!` : '¡Un golpe crítico!', 30);
      if (n > 1) await this.msg(`¡Golpeó ${hits} ${hits === 1 ? 'vez' : 'veces'}!`, 30);
      if (eff0 > 1) await this.msg('¡Es muy eficaz!', 30);
      if (eff0 < 1) await this.msg('No es muy eficaz...', 30);
      if (M.drain && user.hp > 0 && user.hp < user.stats.hp) { const heal = Math.max(1, Math.floor(total * M.drain)); await this.tween(user, 'hp', Math.min(user.stats.hp, user.hp + heal), 16); user.hp = Math.round(user.hp); this.hud(); await this.msg(`¡${tname} perdió energía!`, 26); }
      if (M.recoil) { const back = Math.max(1, Math.floor(total * M.recoil)); await this.hit(user, isAlly, back, 4); await this.msg(`¡${name} también se hizo daño!`, 26); }
      if (target.hp <= 0) { const end = await this.faint(!isAlly); if (end === 'win' || end === 'lose' || user.hp > 0) return end; return this.faint(isAlly); }
      if (M.status && rand() * 100 < M.status[1]) await this.applyStatus(target, M.status[0], !isAlly, false);
      if (M.confuse && rand() * 100 < M.confuse) await this.confuse(target, !isAlly, false);
      for (const e of M.stat || []) if (rand() * 100 < e.chance) await this.changeStat(e.target === 'self' ? user : target, e.target === 'self' ? us : ts, e, e.target === 'self' ? isAlly : !isAlly);
      if (user.hp <= 0) return this.faint(isAlly);
      return undefined;
    }
    // Movimientos de estado
    const self = !aimsFoe || M.heal;
    await this.wait(this.play(M.anim, M.type, isAlly, { self }));
    await this.tween(this.fx, key, 0, 4);
    if (M.heal) {
      if (user.hp >= user.stats.hp) await this.msg(`¡Los PS de ${name} ya están al máximo!`);
      else { await this.tween(user, 'hp', Math.min(user.stats.hp, user.hp + Math.ceil(user.stats.hp * M.heal)), 22); user.hp = Math.round(user.hp); this.hud(); await this.msg(`¡${name} recuperó PS!`); }
    }
    if (M.status) await this.applyStatus(target, M.status[0], !isAlly, true);
    if (M.confuse) await this.confuse(target, !isAlly, true);
    for (const e of M.stat || []) await this.changeStat(e.target === 'self' ? user : target, e.target === 'self' ? us : ts, e, e.target === 'self' ? isAlly : !isAlly);
    return undefined;
  }

  async faint(allyFainted) {
    if (!allyFainted) {
      this.foe.status = null;
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
    this.ally.status = null;
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
    const statusBonus = { dor: 2, con: 2, par: 1.5, ven: 1.5, que: 1.5 }[this.foe.status] || 1;
    const chance = Math.min(1, ((3 * max - 2 * hp) * rate * bonus * statusBonus) / (3 * max) / 255 + 0.04);
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
