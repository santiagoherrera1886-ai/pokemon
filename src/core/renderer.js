// Renderizador a pantalla completa con resolución interna dinámica (pixel art nítido a escala entera)
// y perspectiva tipo portátil opcional: el mundo se dibuja plano en un búfer y se proyecta fila por fila.
import { canvas } from './pixel.js';

const TOP_SCALE = 0.84;

export class Renderer {
  constructor(el) {
    this.screen = el;
    this.perspective = true;
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 150));
  }

  resize() {
    const vw = innerWidth, vh = innerHeight;
    // Escala entera: ~24 casillas de ancho en escritorio, ~12 en celular vertical.
    let s = Math.max(2, Math.round(Math.min(vw / 400, vh / 230)));
    if (vw < 700) s = Math.max(2, Math.round(Math.min(vw / 200, vh / 300)));
    this.scale = s;
    this.w = Math.ceil(vw / s); this.h = Math.ceil(vh / s);
    const el = this.screen;
    el.width = this.w; el.height = this.h;
    el.style.width = this.w * s + 'px'; el.style.height = this.h * s + 'px';
    this.g = el.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    // Tabla de proyección
    this.rowScale = new Float32Array(this.h);
    this.rowSrc = new Float32Array(this.h);
    let acc = 0;
    for (let y = 0; y < this.h; y++) {
      const k = TOP_SCALE + (1 - TOP_SCALE) * (y / (this.h - 1));
      this.rowScale[y] = k; this.rowSrc[y] = acc; acc += 1 / k;
    }
    this.bw = Math.ceil(this.w / TOP_SCALE) + 32;
    this.bh = Math.ceil(acc) + 24;
    [this.buf, this.bg] = canvas(this.bw, this.bh);
    this.playerRow = Math.round(this.h * 0.54);
    this.vignette = null;
    this.onResize && this.onResize();
  }
  anchorY() { return this.perspective ? Math.round(this.rowSrc[this.playerRow]) : this.playerRow; }
  anchorX() { return Math.floor(this.bw / 2); }
  clear(color = '#000') { this.bg.fillStyle = color; this.bg.fillRect(0, 0, this.bw, this.bh); }

  present() {
    const g = this.g, cx = this.bw / 2;
    if (!this.perspective) {
      g.drawImage(this.buf, Math.round(cx - this.w / 2), 0, this.w, this.h, 0, 0, this.w, this.h);
      return;
    }
    for (let y = 0; y < this.h; y++) {
      const w = this.w / this.rowScale[y];
      g.drawImage(this.buf, cx - w / 2, Math.floor(this.rowSrc[y]), w, 1, 0, y, this.w, 1);
    }
  }

  // Post-proceso: viñeta suave y tinte según la hora del día (solo en exteriores).
  post({ outdoor, hour, dark }) {
    const g = this.g;
    if (outdoor) {
      let tint = null;
      if (hour >= 17 && hour < 19) tint = 'rgba(255,140,60,0.13)';
      else if (hour >= 19 || hour < 5) tint = 'rgba(30,40,110,0.30)';
      else if (hour >= 5 && hour < 7) tint = 'rgba(255,180,200,0.10)';
      if (tint) { g.fillStyle = tint; g.fillRect(0, 0, this.w, this.h); }
    }
    if (dark) {
      const r = Math.min(this.w, this.h) * 0.42;
      const px = this.w / 2, py = this.playerRow - 4;
      const grad = g.createRadialGradient(px, py, r * 0.25, px, py, r);
      grad.addColorStop(0, 'rgba(5,4,12,0)');
      grad.addColorStop(1, 'rgba(5,4,12,0.92)');
      g.fillStyle = grad; g.fillRect(0, 0, this.w, this.h);
    }
    if (!this.vignette) {
      const [c, vg] = canvas(this.w, this.h);
      const grad = vg.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.45, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(10,8,24,0.32)');
      vg.fillStyle = grad; vg.fillRect(0, 0, this.w, this.h);
      this.vignette = c;
    }
    g.drawImage(this.vignette, 0, 0);
  }
}
