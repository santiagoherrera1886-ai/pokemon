// Tráfico de adorno en Tierra Grande: carros que van por su carril en las carreteras y en las calles de las
// ciudades, y sombras de avionetas que pasan por encima de vez en cuando. No chocan con nada (son de
// mentiras), pero frenan si el jugador se les para enfrente. Posiciones en casillas de Tierra Grande.
import { ROADS, CITIES, CAR_COLORS, BLOCK, TG } from './tierra.js';

const MAX = 12, NEAR = 18, FAR = 58;
const LEN = ROADS.map(r => { const acc = [0]; for (let i = 1; i < r.line.length; i++) acc.push(acc[i - 1] + Math.hypot(r.line[i][0] - r.line[i - 1][0], r.line[i][1] - r.line[i - 1][1])); return acc; });
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// Punto de la carretera ri a la distancia s de su arranque: [x, y, rumbo].
function along(ri, s) {
  const L = ROADS[ri].line, A = LEN[ri];
  let i = 1; while (i < A.length - 1 && A[i] < s) i++;
  const k = (s - A[i - 1]) / ((A[i] - A[i - 1]) || 1), [ax, ay] = L[i - 1], [bx, by] = L[i];
  return [ax + (bx - ax) * k, ay + (by - ay) * k, Math.atan2(by - ay, bx - ax)];
}

export class Traffic {
  constructor() { this.cars = []; this.shadows = []; this.t = 0; }
  clear() { this.cars = []; this.shadows = []; }
  // px, py: el jugador en casillas de Tierra Grande; facing: casilla de enfrente del jugador (para frenar).
  update(px, py) {
    this.t++;
    for (const c of this.cars) {
      // Frena si el jugador está justo adelante en su carril.
      const dx = px + .5 - c.x, dy = py + .5 - c.y, fwd = dx * Math.cos(c.h) + dy * Math.sin(c.h), side = Math.abs(-dx * Math.sin(c.h) + dy * Math.cos(c.h));
      const stop = fwd > 0 && fwd < 3.2 && side < 1.3;
      c.v += ((stop ? 0 : c.top) - c.v) * (stop ? .3 : .03);
      if (c.road !== undefined) {
        c.s += c.v * c.dir;
        if (c.s < 0 || c.s > LEN[c.road][LEN[c.road].length - 1]) { c.dead = true; continue; }
        const [x, y, h] = along(c.road, c.s), hh = c.dir > 0 ? h : h + Math.PI, off = c.lane;
        c.x = x - Math.sin(hh) * off; c.y = y + Math.cos(hh) * off; c.h = hh;
      } else {
        c.x += Math.cos(c.h) * c.v; c.y += Math.sin(c.h) * c.v;
        if (c.x < c.city.x0 - 2 || c.y < c.city.y0 - 2 || c.x > c.city.x1 + 2 || c.y > c.city.y1 + 2) c.dead = true;
      }
      if (Math.hypot(c.x - px, c.y - py) > FAR) c.dead = true;
    }
    this.cars = this.cars.filter(c => !c.dead);
    if (this.t % 15 === 0 && this.cars.length < MAX) this.spawn(px, py);
    // Sombras de avionetas: una cada tanto, cruzando cerca.
    for (const s of this.shadows) { s.x += Math.cos(s.h) * .6; s.y += Math.sin(s.h) * .6; s.life--; }
    this.shadows = this.shadows.filter(s => s.life > 0);
    if (this.t % 1500 === 700) { const a = rnd() * Math.PI * 2; this.shadows.push({ x: px - Math.cos(a) * 45 + (rnd() - .5) * 12, y: py - Math.sin(a) * 45 + (rnd() - .5) * 12, h: a, life: 160 }); }
  }
  spawn(px, py) {
    const city = CITIES.find(c => (c.kind === 'grande' || c.kind === 'pueblo') && px > c.x0 - 30 && px < c.x1 + 30 && py > c.y0 - 30 && py < c.y1 + 30);
    if (city && rnd() < .7) {
      // En la ciudad: por una calle (vertical u horizontal), en su carril, lejos del jugador.
      for (let tries = 0; tries < 6; tries++) {
        const vert = rnd() < .5, dir = rnd() < .5 ? 1 : -1;
        const sx = Math.floor((px + (rnd() - .5) * 70) / BLOCK) * BLOCK, sy = Math.floor((py + (rnd() - .5) * 70) / BLOCK) * BLOCK;
        let x, y, h;
        if (vert) { x = sx + (dir > 0 ? 1 : 3); y = py + (rnd() < .5 ? -1 : 1) * (NEAR + rnd() * 16); h = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
        else { y = sy + (dir > 0 ? 3 : 1); x = px + (rnd() < .5 ? -1 : 1) * (NEAR + 4 + rnd() * 18); h = dir > 0 ? 0 : Math.PI; }
        if (x < city.x0 || y < city.y0 || x > city.x1 || y > city.y1) continue;
        this.cars.push({ city, x, y, h, v: .1, top: .09 + rnd() * .05, color: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)] });
        return;
      }
      return;
    }
    // En carretera: un punto de alguna vía a buena distancia del jugador.
    const opts = [];
    ROADS.forEach((r, ri) => { if (r.name.startsWith('Acceso')) return; const A = LEN[ri]; for (let s = 0; s < A[A.length - 1]; s += 9) { const [x, y] = along(ri, s), d = Math.hypot(x - px, y - py); if (d > NEAR && d < 46) opts.push([ri, s]); } });
    if (!opts.length) return;
    const [ri, s] = opts[Math.floor(rnd() * opts.length)], dir = rnd() < .5 ? 1 : -1, wide = ROADS[ri].w >= 6;
    const c = { road: ri, s, dir, lane: wide ? (rnd() < .5 ? .9 : 2.1) : 1, v: .15, top: (wide ? .17 : .13) + rnd() * .06, color: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)] };
    const [x, y, h] = along(ri, s); c.x = x; c.y = y; c.h = dir > 0 ? h : h + Math.PI;
    this.cars.push(c);
  }
}
// Dirección de 4 lados más parecida a un rumbo (0 abajo, 1 arriba, 2 izquierda, 3 derecha), para los sprites.
export function dir4(h) {
  const c = Math.cos(h), s = Math.sin(h);
  return Math.abs(c) > Math.abs(s) ? (c > 0 ? 3 : 2) : (s > 0 ? 0 : 1);
}
export const TG_ORIGIN = [TG.X, TG.Y];
