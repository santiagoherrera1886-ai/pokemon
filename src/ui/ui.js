// Capa de interfaz: cuadro de diálogo (pantalla superior), paneles táctiles (pantalla inferior),
// letrero de zona y fundidos. Todo lo modal se procesa desde el bucle principal con update().
import { input } from '../core/input.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

class UI {
  constructor() {
    this.dialog = null;     // {pages, page, shown, resolve, name}
    this.panel = null;      // {focusable, index, onBack, modal}
    this.speed = 2;
    this.bannerTimer = 0;
  }
  init() {
    this.msg = $('msg'); this.msgText = $('msgText'); this.msgName = $('msgName'); this.msgArrow = $('msgArrow');
    this.bottom = $('panel'); this.fadeEl = $('fade'); this.bannerEl = $('banner');
    this.msg.addEventListener('pointerdown', e => { e.preventDefault(); this.advance(); });
  }
  get busy() { return !!this.dialog || !!(this.panel && this.panel.modal); }

  // ---------- Diálogo ----------
  say(pages, opts = {}) {
    if (!Array.isArray(pages)) pages = [pages];
    return new Promise(resolve => {
      this.msgName.textContent = opts.name || '';
      this.msgName.classList.toggle('hidden', !opts.name);
      this.msg.classList.remove('hidden');
      pages = pages.flatMap(p => this.fit(p));
      this.dialog = { pages, page: 0, shown: 0, resolve, keep: opts.keep, auto: opts.auto };
      this.renderDialog();
    });
  }
  // Parte un texto en páginas que quepan en el cuadro (máximo 2 líneas, como en la portátil).
  fit(text) {
    const el = this.msgText, maxH = parseFloat(getComputedStyle(el).lineHeight) * 2 + 4;
    const fits = t => { el.textContent = t; return el.scrollHeight <= maxH; };
    if (fits(text)) return [text];
    const words = text.split(' '), out = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (cur && !fits(next)) { out.push(cur); cur = w; } else cur = next;
    }
    if (cur) out.push(cur);
    el.textContent = '';
    return out;
  }
  renderDialog() {
    const d = this.dialog; if (!d) return;
    const text = d.pages[d.page];
    this.msgText.textContent = text.slice(0, Math.floor(d.shown));
    this.msgArrow.classList.toggle('hidden', d.shown < text.length || d.keep && d.page === d.pages.length - 1);
  }
  advance() {
    const d = this.dialog; if (!d) return;
    const text = d.pages[d.page];
    if (d.shown < text.length) { d.shown = text.length; this.renderDialog(); return; }
    if (d.keep && d.page === d.pages.length - 1) return;
    if (d.page < d.pages.length - 1) { d.page++; d.shown = 0; this.renderDialog(); return; }
    this.closeDialog();
  }
  closeDialog() {
    const d = this.dialog; if (!d) return;
    this.dialog = null;
    this.msg.classList.add('hidden');
    d.resolve();
  }
  // Muestra texto sin esperar (para combates: se cierra con closeDialog o el siguiente say).
  show(text, opts = {}) {
    this.dialog = null;
    this.msgName.classList.add('hidden');
    this.msg.classList.remove('hidden');
    this.msgText.textContent = text;
    this.msgArrow.classList.add('hidden');
    if (opts.hide) this.msg.classList.add('hidden');
  }
  hideMsg() { if (!this.dialog) this.msg.classList.add('hidden'); }

  // ---------- Paneles de la pantalla inferior ----------
  // html: contenido; los elementos con data-act son botones. modal: bloquea el mundo y toma el teclado.
  setPanel(html, { onAct, onBack, modal = false, focus = 0, cls = '' } = {}) {
    this.bottom.className = 'ui bottom-ui ' + cls;
    this.bottom.innerHTML = html;
    const els = [...this.bottom.querySelectorAll('[data-act]')];
    els.forEach(el => el.addEventListener('click', e => {
      e.preventDefault();
      if (el.disabled || el.classList.contains('off')) return;
      if (this.dialog && !this.panel?.allowDuringDialog) return;
      onAct && onAct(el.dataset.act, el);
    }));
    const back = this.bottom.querySelector('[data-back]');
    if (back) back.addEventListener('click', e => { e.preventDefault(); onBack && onBack(); });
    this.panel = { els, index: Math.min(focus, els.length - 1), onAct, onBack, modal };
    this.paintFocus();
  }
  closePanel() {
    this.panel = null;
    this.bottom.className = 'hidden';
    this.bottom.innerHTML = '';
  }
  paintFocus() {
    const p = this.panel; if (!p) return;
    p.els.forEach((el, i) => el.classList.toggle('focus', p.modal && i === p.index));
  }
  // Elige con el teclado el botón más cercano en la dirección pulsada.
  moveFocus(dir) {
    const p = this.panel; if (!p || !p.els.length) return;
    const r0 = p.els[p.index].getBoundingClientRect();
    const c0 = [r0.left + r0.width / 2, r0.top + r0.height / 2];
    let best = -1, bestD = Infinity;
    p.els.forEach((el, i) => {
      if (i === p.index || el.offsetParent === null) return;
      const r = el.getBoundingClientRect(), c = [r.left + r.width / 2, r.top + r.height / 2];
      const dx = c[0] - c0[0], dy = c[1] - c0[1];
      const ok = { up: dy < -4, down: dy > 4, left: dx < -4, right: dx > 4 }[dir];
      if (!ok) return;
      const d = (dir === 'up' || dir === 'down') ? Math.abs(dy) + Math.abs(dx) * 2 : Math.abs(dx) + Math.abs(dy) * 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) { p.index = best; this.paintFocus(); }
  }

  ask(question, options, opts = {}) {
    return new Promise(resolve => {
      const prev = this.saveBottom();
      if (question) this.say([question], { keep: true, name: opts.name });
      const html = `<div class="choices">${options.map((o, i) => `<button class="choice" data-act="${i}">${esc(o)}</button>`).join('')}</div>`;
      const done = i => { this.closePanel(); this.closeDialog(); this.restoreBottom(prev); resolve(i); };
      this.setPanel(html, { modal: true, onAct: a => done(+a), onBack: opts.cancel !== false ? () => done(options.length - 1) : null, cls: 'choice-panel' });
      this.panel.allowDuringDialog = true;
    });
  }
  saveBottom() { return { html: this.bottom.innerHTML, cls: this.bottom.className, panel: this.panel, restore: this.restoreHook }; }
  restoreBottom(prev) { if (this.restoreHook) this.restoreHook(); }

  // ---------- Letrero de zona y fundido ----------
  banner(name) {
    this.bannerEl.textContent = name;
    this.bannerEl.classList.remove('hidden');
    this.bannerEl.classList.remove('slide'); void this.bannerEl.offsetWidth; this.bannerEl.classList.add('slide');
    this.bannerTimer = 150;
  }
  fade(to, ms = 220) {
    return new Promise(res => {
      this.fadeEl.style.transition = `opacity ${ms}ms linear`;
      this.fadeEl.style.opacity = to ? '1' : '0';
      setTimeout(res, ms + 20);
    });
  }

  update() {
    if (this.bannerTimer > 0 && --this.bannerTimer === 0) this.bannerEl.classList.add('hidden');
    const d = this.dialog;
    let waiting = false; // diálogo fijo ya completo: el teclado pasa al panel
    if (d) {
      const text = d.pages[d.page];
      if (d.shown < text.length) { d.shown = Math.min(text.length, d.shown + [0.5, 1, 2, 4][this.speed]); this.renderDialog(); }
      waiting = d.keep && d.page === d.pages.length - 1 && d.shown >= text.length;
      if (!waiting && (input.hit('a') || input.hit('b'))) this.advance();
    }
    const p = this.panel;
    if (p && p.modal && (!d || (waiting && p.allowDuringDialog))) {
      for (const k of ['up', 'down', 'left', 'right']) if (input.hit(k)) this.moveFocus(k);
      if (input.hit('a') && p.els[p.index]) p.els[p.index].click();
      else if (input.hit('b') && p.onBack) p.onBack();
    }
  }
}

export const ui = new UI();
export { esc };
