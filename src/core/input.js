// Entrada unificada: teclado + controles táctiles. Botones lógicos: up down left right a b start.
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', KeyE: 'a', Enter: 'a', Space: 'a',
  KeyX: 'b', ShiftLeft: 'b', ShiftRight: 'b', Backspace: 'b',
  Escape: 'start', KeyM: 'start', Tab: 'start'
};

class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.order = [];   // dirección más reciente gana
    addEventListener('keydown', e => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const b = KEYMAP[e.code];
      if (!b) return;
      e.preventDefault();
      if (!e.repeat) this.press(b);
    });
    addEventListener('keyup', e => { const b = KEYMAP[e.code]; if (b) this.release(b); });
    addEventListener('blur', () => { this.down.clear(); this.order = []; });
  }
  press(b) {
    if (!this.down.has(b)) this.pressed.add(b);
    this.down.add(b);
    if (['up', 'down', 'left', 'right'].includes(b)) { this.order = this.order.filter(x => x !== b); this.order.push(b); }
  }
  release(b) {
    this.down.delete(b);
    this.order = this.order.filter(x => x !== b);
  }
  held(b) { return this.down.has(b); }
  hit(b) { if (this.pressed.has(b)) { this.pressed.delete(b); return true; } return false; }
  dir() { return this.order[this.order.length - 1] || null; }
  endFrame() { this.pressed.clear(); }
  clear() { this.pressed.clear(); }

  bindTouch(root) {
    root.querySelectorAll('[data-btn]').forEach(el => {
      const b = el.dataset.btn;
      const on = e => { e.preventDefault(); el.classList.add('on'); this.press(b); };
      const off = e => { e.preventDefault(); el.classList.remove('on'); this.release(b); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    });
  }
}

export const input = new Input();
