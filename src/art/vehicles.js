// Sprites de Tierra Grande para el modo pixel: edificios altos, carros (parqueados y manejando), avionetas,
// surtidores de gasolina. Todo arte original, con el mismo contorno y sombreado que el resto del juego.
import { canvas, px, ellipse, outline, shadeHex } from '../core/pixel.js';
import { tinyText } from './objects.js';

const OUT = '#2a2630';
const cache = new Map();
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// Edificio alto: azotea vista desde arriba y fachada con una fila de ventanas por piso.
export function tower(w, h, floors = 6, opt = {}) {
  return memo('tower' + w + h + floors + JSON.stringify(opt), () => {
    const W = w * 16, roofH = Math.max(10, Math.round(h * 16 * .5)), facadeH = floors * 10 + 8, H = roofH + facadeH;
    const [c, g] = canvas(W + 2, H + 1);
    const wall = opt.wall || '#d8d0c0', roof = opt.roof || shadeHex(wall, -.25);
    // azotea con pretil, aire acondicionado y, en las torres grandes, helipuerto
    px(g, 1, 0, shadeHex(roof, .18), W, roofH);
    px(g, 3, 2, roof, W - 4, roofH - 4);
    if (opt.control) { px(g, 3, 1, '#7ac8e8', W - 4, roofH - 2); px(g, 3, 1, '#c8ecf8', W - 4, 2); }
    else {
      for (let i = 0; i < Math.floor(w / 3); i++) { px(g, 6 + i * 24, 4, '#a8acb4', 8, 5); px(g, 6 + i * 24, 4, '#d0d4da', 8, 1); }
      if (w >= 7 && floors >= 8) { ellipse(g, W / 2 + 1, roofH / 2 + 1, 7, Math.max(3, roofH / 2 - 3), '#5a5f6a'); px(g, W / 2 - 2, roofH / 2 - 2, '#f0f0f0', 1, 6); px(g, W / 2 + 3, roofH / 2 - 2, '#f0f0f0', 1, 6); px(g, W / 2 - 2, roofH / 2 + 1, '#f0f0f0', 6, 1); }
    }
    px(g, 1, roofH - 2, shadeHex(roof, -.35), W, 2);
    // fachada
    px(g, 1, roofH, wall, W, facadeH);
    px(g, 1, roofH, shadeHex(wall, .15), W, 2);
    for (let f = 0; f < floors; f++) {
      const y = roofH + 4 + f * 10;
      px(g, 1, y + 8, shadeHex(wall, -.12), W, 1);
      if (f === floors - 1) continue;
      for (let x = 4; x < W - 4; x += 8) { px(g, x, y + 1, '#5f8fb0', 5, 6); px(g, x, y + 1, '#a9d8ec', 5, 2); px(g, x + 4, y + 3, '#86b6d0', 1, 4); }
    }
    // planta baja: vitrina y puerta de vidrio
    const gy = roofH + facadeH - 12, dx = (opt.doorCol ?? Math.floor(w / 2)) * 16;
    px(g, 1, gy, shadeHex(wall, -.2), W, 12);
    for (let x = 4; x < W - 4; x += 12) { px(g, x, gy + 2, '#8cc4dc', 9, 8); px(g, x, gy + 2, '#c8ecf8', 9, 2); }
    px(g, dx + 1, gy - 1, '#3a3a4a', 14, 13); px(g, dx + 3, gy + 1, '#a8dcf2', 10, 11); px(g, dx + 8, gy + 1, '#3a3a4a', 1, 11);
    px(g, 1, H - 2, shadeHex(wall, -.4), W, 2);
    outline(c, OUT);
    return c;
  });
}

// Carro parqueado visto desde arriba (ocupa 1 × 2 casillas). dir 0 = trompa abajo, 1 = arriba.
export function parkedCar(color = '#d8443a', dir = 0) { return memo('pc' + color + dir, () => carTop(color, dir ? 1 : 0)); }
function carTop(color, dir) {
  const [c, g] = canvas(18, 34);
  const dark = shadeHex(color, -.3), light = shadeHex(color, .3);
  for (const y of [5, 23]) { px(g, 1, y, '#26262e', 3, 7); px(g, 14, y, '#26262e', 3, 7); }
  px(g, 3, 1, color, 12, 32); px(g, 2, 3, color, 14, 28);
  px(g, 3, 1, light, 12, 2);
  const front = dir === 0 ? 24 : 4;                    // parabrisas hacia donde mira
  px(g, 4, dir === 0 ? 20 : 8, '#8cc4dc', 10, 6); px(g, 4, dir === 0 ? 20 : 8, '#c8ecf8', 10, 2);
  px(g, 4, dir === 0 ? 9 : 19, '#6a9ab4', 10, 4);
  px(g, 4, 13, dark, 10, 6); px(g, 5, 14, color, 8, 4);
  px(g, 4, dir === 0 ? 31 : 1, '#fff6c8', 3, 2); px(g, 11, dir === 0 ? 31 : 1, '#fff6c8', 3, 2);
  px(g, 4, dir === 0 ? 1 : 31, '#e04848', 3, 1); px(g, 11, dir === 0 ? 1 : 31, '#e04848', 3, 1);
  void front;
  outline(c, OUT);
  return c;
}
// Carro del jugador manejando: 4 direcciones, con el conductor (gorra y pelo) por el vidrio.
export function driveCar(color = '#e2603f', dir = 0, look = {}) {
  return memo('dc' + color + dir + (look.hat || '') + (look.hair || ''), () => {
    if (dir === 0 || dir === 1) {
      const [c, g] = canvas(20, 30);
      const dark = shadeHex(color, -.3), light = shadeHex(color, .3), up = dir === 1;
      for (const y of [4, 20]) { px(g, 1, y, '#26262e', 3, 7); px(g, 16, y, '#26262e', 3, 7); }
      px(g, 3, 1, color, 14, 28); px(g, 2, 4, color, 16, 22); px(g, 3, 1, light, 14, 2);
      px(g, 4, up ? 5 : 17, '#8cc4dc', 12, 6); px(g, 4, up ? 5 : 17, '#c8ecf8', 12, 2);
      ellipse(g, 10, up ? 13 : 14, 3, 3, look.hat || look.hair || '#3a2a2a');
      px(g, 4, up ? 17 : 8, '#6a9ab4', 12, 4);
      px(g, 4, 11, dark, 12, 1);
      px(g, 4, up ? 1 : 27, '#fff6c8', 3, 2); px(g, 13, up ? 1 : 27, '#fff6c8', 3, 2);
      outline(c, OUT); return c;
    }
    const [c, g] = canvas(32, 20);
    const dark = shadeHex(color, -.3), light = shadeHex(color, .3), right = dir === 3;
    for (const x of [5, 22]) { px(g, x, 15, '#26262e', 6, 4); px(g, x + 2, 16, '#8a8f9a', 2, 2); }
    px(g, 1, 7, color, 30, 9); px(g, 3, 6, color, 26, 2); px(g, 1, 7, light, 30, 1);
    px(g, right ? 9 : 8, 1, color, 15, 7); px(g, right ? 10 : 9, 2, '#8cc4dc', 13, 5); px(g, right ? 10 : 9, 2, '#c8ecf8', 13, 1);
    ellipse(g, 16, 5, 2, 2, look.hat || look.hair || '#3a2a2a');
    px(g, 1, 12, dark, 30, 1);
    px(g, right ? 29 : 1, 9, '#fff6c8', 2, 2); px(g, right ? 1 : 29, 9, '#e04848', 2, 2);
    outline(c, OUT); return c;
  });
}
// Avioneta vista desde arriba con la trompa hacia arriba (se rota al dibujarla).
export function planeTop(color = '#f6f2ea', scale = 1) {
  return memo('pt' + color + scale, () => {
    const s = scale, [c, g] = canvas(48 * s, 44 * s);
    const P = (x, y, col, w = 1, h = 1) => px(g, x * s, y * s, col, w * s, h * s);
    const trim = color === '#f6f2ea' ? '#e2603f' : '#f6f2ea';
    P(2, 14, color, 44, 7); P(2, 14, shadeHex(color, .25), 44, 2); P(2, 19, shadeHex(color, -.2), 44, 2);   // ala
    P(2, 14, trim, 4, 7); P(42, 14, trim, 4, 7);
    P(21, 2, color, 6, 38); P(20, 6, color, 8, 30); P(22, 2, shadeHex(color, .25), 2, 36);                   // fuselaje
    P(21, 6, '#8cc4dc', 6, 6); P(21, 6, '#c8ecf8', 6, 2);                                                       // cabina
    P(14, 34, color, 20, 5); P(14, 34, trim, 20, 2);                                                            // timón de cola
    P(23, 37, trim, 2, 5);
    P(18, 0, '#3a3a44', 12, 2);                                                                                 // hélice
    outline(c, OUT); return c;
  });
}
export function parkedPlane(color) { return planeTop(color); }
// Sombra de la avioneta (la misma silueta, oscura y suave).
export function planeShadow() {
  return memo('pshadow', () => {
    const src = planeTop('#000000'), [c, g] = canvas(src.width, src.height);
    g.globalAlpha = .3; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(16,24,40,.3)'; g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}
export function pump() {
  return memo('pump', () => {
    const [c, g] = canvas(16, 26);
    px(g, 3, 4, '#e04848', 10, 20); px(g, 3, 4, '#f07a6a', 10, 2);
    px(g, 5, 7, '#f6f2ea', 6, 5); tinyText(g, 'G', 6, 7, '#3a3a4a');
    px(g, 13, 10, '#3a3a44', 2, 9); px(g, 2, 24, '#8a8f9a', 12, 2);
    outline(c, OUT); return c;
  });
}
