// Íconos de objetos en pixel art (16x16 con margen para el contorno), dibujados en código con sombreado y contorno automáticos.
// Las cápsulas de Alborada son cápsulas de verdad: alargadas, mitad de color y mitad crema, con una gema en la unión.
import { canvas, px, ellipse, outline, autoShade, shadeHex } from '../core/pixel.js';
import { ITEMS } from '../data/items.js';

const OUT = '#26222e', GLASS = '#e6f2f6', CREAM = '#fbf1da', WHITE = '#ffffff';

const DRAW = {
  // Brazalete Alba: aro dorado con una gema de amanecer.
  band(g, c) {
    const dark = shadeHex(c, -.38), light = shadeHex(c, .45);
    ellipse(g, 8, 9, 6, 5, c);
    g.globalCompositeOperation = 'destination-out'; ellipse(g, 8, 9, 4, 3, '#000'); g.globalCompositeOperation = 'source-over';
    px(g, 2, 8, dark, 1, 3); px(g, 4, 5, light, 3, 1); px(g, 7, 13, dark, 3, 1);
    ellipse(g, 8, 4, 3, 2, '#ff9a5a'); px(g, 7, 3, '#ffe8c8', 2, 1);
  },
  capsule(g, c) {
    const dark = shadeHex(c, -.35);
    ellipse(g, 5, 8, 3, 3, c); px(g, 5, 5, c, 3, 7);           // mitad de color
    ellipse(g, 11, 8, 3, 3, CREAM); px(g, 8, 5, CREAM, 3, 7);  // mitad crema
    px(g, 8, 5, dark, 1, 7);                                   // unión
    px(g, 7, 7, WHITE, 2, 2); px(g, 7, 7, shadeHex(c, .45), 1, 1);  // gema
    px(g, 3, 6, shadeHex(c, .5), 3, 1); px(g, 10, 6, WHITE, 3, 1);  // brillos
  },
  spray(g, c) {
    const dark = shadeHex(c, -.4);
    px(g, 6, 1, '#5a6070', 4, 2); px(g, 10, 1, '#5a6070', 2, 1);  // atomizador
    px(g, 7, 3, '#c8ccd8', 2, 1);
    px(g, 5, 4, c, 6, 1); px(g, 4, 5, c, 8, 9); px(g, 5, 14, c, 6, 1);
    px(g, 5, 7, CREAM, 6, 5);                                     // etiqueta
    px(g, 7, 8, dark, 2, 3); px(g, 6, 9, dark, 4, 1);              // cruz
    px(g, 5, 5, shadeHex(c, .45), 1, 2);
  },
  drink(g, c) {
    px(g, 11, 0, '#e85a5a', 1, 3); px(g, 10, 2, '#e85a5a', 1, 4);  // pitillo
    for (let y = 4; y <= 14; y++) { const inset = y > 11 ? 1 : 0; px(g, 4 + inset, y, y < 6 ? GLASS : c, 8 - inset * 2, 1); }
    px(g, 4, 4, WHITE, 8, 1);
    px(g, 5, 7, shadeHex(c, .4), 1, 5);                            // reflejo
    px(g, 7, 6, shadeHex(c, .25), 3, 1);
  },
  drop(g, c) {
    ellipse(g, 8, 10, 4, 4, c);
    for (let y = 2; y <= 7; y++) { const half = Math.round((y - 2) * .7); px(g, 8 - half, y, c, half * 2 + 1, 1); }
    px(g, 6, 9, WHITE, 1, 2); px(g, 7, 8, shadeHex(c, .5), 1, 1);
  },
  flask(g, c) {
    px(g, 7, 1, '#b07a4a', 2, 2);                                  // corcho
    px(g, 7, 3, GLASS, 2, 3);
    ellipse(g, 8, 10, 5, 4, GLASS);
    ellipse(g, 8, 11, 4, 3, c); px(g, 4, 10, c, 9, 1);
    px(g, 5, 8, WHITE, 1, 2); px(g, 9, 11, shadeHex(c, .4), 2, 1);
  },
  can(g, c) {
    px(g, 7, 0, '#5a6070', 2, 1); px(g, 6, 1, '#c8ccd8', 4, 2);    // tapa
    px(g, 4, 3, c, 8, 12); px(g, 5, 15, c, 6, 1);
    px(g, 4, 7, CREAM, 8, 3);                                       // franja
    px(g, 7, 8, shadeHex(c, -.2), 2, 1);
    px(g, 5, 4, shadeHex(c, .45), 1, 2);
  },
  whistle(g, c) {
    px(g, 3, 7, c, 9, 5); px(g, 4, 6, c, 7, 1); px(g, 4, 12, c, 7, 1);  // cuerpo
    px(g, 12, 8, c, 3, 3);                                              // boquilla
    px(g, 6, 7, OUT, 3, 1);                                             // ranura
    px(g, 1, 3, '#e05a5a', 2, 1); px(g, 2, 4, '#e05a5a', 1, 2); px(g, 3, 5, '#e05a5a', 1, 1);  // cordón
    px(g, 5, 8, shadeHex(c, .5), 2, 1);
  },
  jar(g, c) {
    px(g, 4, 2, '#a86a3a', 8, 2);                                   // tapa
    px(g, 3, 4, GLASS, 10, 2); px(g, 3, 6, c, 10, 8); px(g, 4, 14, c, 8, 1);
    px(g, 5, 8, CREAM, 6, 3); px(g, 7, 9, '#e8a020', 2, 1);         // etiqueta
    px(g, 4, 7, shadeHex(c, .45), 1, 5);
  },
  seed(g, c) {
    ellipse(g, 8, 10, 4, 5, c);
    px(g, 8, 2, '#4a9a3a', 1, 4); px(g, 5, 2, '#6ac04a', 3, 2); px(g, 9, 3, '#6ac04a', 3, 2);  // brote
    px(g, 6, 8, shadeHex(c, .5), 1, 3); px(g, 9, 12, shadeHex(c, -.25), 2, 1);
  },
  candy(g, c) {
    ellipse(g, 8, 8, 4, 3, c);
    px(g, 1, 6, '#f6e2a8', 3, 5); px(g, 0, 7, '#f6e2a8', 1, 3);    // papel
    px(g, 12, 6, '#f6e2a8', 3, 5); px(g, 15, 7, '#f6e2a8', 1, 3);
    px(g, 6, 6, shadeHex(c, .5), 3, 1); px(g, 9, 9, shadeHex(c, -.2), 2, 1);
  },
  heart(g, c) {
    ellipse(g, 5, 6, 3, 3, c); ellipse(g, 11, 6, 3, 3, c);
    for (let y = 7; y <= 13; y++) { const half = 7 - (y - 7); px(g, 8 - half, y, c, half * 2, 1); }
    px(g, 4, 5, WHITE, 2, 1); px(g, 4, 6, shadeHex(c, .5), 1, 1);
    px(g, 13, 1, WHITE, 1, 3); px(g, 12, 2, WHITE, 3, 1);           // destello
  }
};

const cache = new Map();
export function itemIcon(id) {
  if (cache.has(id)) return cache.get(id);
  const it = ITEMS[id];
  const [c, g] = canvas(18, 18);
  g.translate(1, 1);                                   // margen de 1 px para el contorno
  (DRAW[it?.icon] || DRAW.capsule)(g, it?.color || '#a0a0a0');
  if (id === 'rocioPuro') { px(g, 12, 2, WHITE, 1, 3); px(g, 11, 3, WHITE, 3, 1); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  autoShade(c, .18, [WHITE, CREAM]);
  outline(c, OUT);
  const url = c.toDataURL();
  cache.set(id, url);
  return url;
}
