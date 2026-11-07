// Renderizador de la pantalla superior (256x192) con perspectiva tipo DS opcional:
// el mundo se dibuja plano en un búfer y luego se proyecta fila por fila (más angosto arriba).
import { canvas } from './pixel.js';

export const SW = 256, SH = 192;
const TOP_SCALE = 0.82;      // escala horizontal de la fila superior
export const PLAYER_ROW = 104; // fila de pantalla donde se ubica el personaje

export class Renderer {
  constructor(el) {
    this.screen = el;
    this.g = el.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    [this.buf, this.bg] = canvas(320, 232);
    this.perspective = true;
    this.rowScale = new Float32Array(SH);
    this.rowSrc = new Float32Array(SH);
    let acc = 0;
    for (let y = 0; y < SH; y++) {
      const s = TOP_SCALE + (1 - TOP_SCALE) * (y / (SH - 1));
      this.rowScale[y] = s; this.rowSrc[y] = acc; acc += 1 / s;
    }
    this.flatOffset = 0;
  }
  // Coordenada Y del búfer donde debe quedar el personaje para aparecer en PLAYER_ROW.
  anchorY() { return this.perspective ? Math.round(this.rowSrc[PLAYER_ROW]) : PLAYER_ROW; }
  anchorX() { return 160; }

  clear(color = '#000') { this.bg.fillStyle = color; this.bg.fillRect(0, 0, 320, 232); }

  present() {
    const g = this.g;
    if (!this.perspective) { g.drawImage(this.buf, 32, 0, SW, SH, 0, 0, SW, SH); return; }
    for (let y = 0; y < SH; y++) {
      const s = this.rowScale[y], w = SW / s;
      g.drawImage(this.buf, 160 - w / 2, Math.floor(this.rowSrc[y]), w, 1, 0, y, SW, 1);
    }
  }
}
