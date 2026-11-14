// Vuelo libre sobre Tierra Grande: despegue por la pista, crucero con la cruceta (la avioneta gira hacia donde
// apuntes), turbo con B y aterrizaje con A encima de cualquier pista. Las posiciones van en casillas de
// Tierra Grande (con decimales); el overworld se queda quieto en el aeropuerto de salida mientras tanto.
import { SIZE, AIRPORTS } from './tierra.js';
import { CH, CPX, getChunk, warmChunks, chunksAround, runwayAt, nearestAirport, markSeen } from './flightmap.js';
import { planeTop, planeShadow } from '../art/vehicles.js';

export const CRUISE = .55, TURBO = .95, TURN = .045;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export class Flight {
  constructor(ap, color = '#f6f2ea') {
    this.ap = ap; this.color = color;
    this.x = ap.x0 + 8; this.y = ap.y0 + 4;     // cabecera oeste de la pista, mirando al este
    this.heading = 0; this.speed = 0; this.alt = 0; this.bank = 0;
    this.phase = 'takeoff'; this.t = 0; this.edgeWarned = 0; this.landAt = null;
  }
  get flying() { return this.phase === 'cruise'; }
  // dirs: {up, down, left, right} sostenidos; turbo: B sostenido. Devuelve 'landed' cuando ya tocó tierra.
  update(dirs, turbo) {
    this.t++;
    if (this.phase === 'takeoff') {
      this.speed = Math.min(CRUISE, this.speed + CRUISE / 110);
      if (this.t > 55) this.alt = Math.min(1, this.alt + 1 / 100);
      if (this.alt >= 1) this.phase = 'cruise';
    } else if (this.phase === 'cruise') {
      const dx = (dirs.right ? 1 : 0) - (dirs.left ? 1 : 0), dy = (dirs.down ? 1 : 0) - (dirs.up ? 1 : 0);
      let turn = 0;
      if (dx || dy) turn = Math.max(-TURN, Math.min(TURN, wrap(Math.atan2(dy, dx) - this.heading)));
      // Cerca del borde de Tierra Grande la avioneta da la vuelta sola.
      const m = 40;
      if (this.x < m || this.y < m || this.x > SIZE - m || this.y > SIZE - m) {
        turn = Math.max(-TURN, Math.min(TURN, wrap(Math.atan2(SIZE / 2 - this.y, SIZE / 2 - this.x) - this.heading)));
        if (!this.edgeWarned) this.edgeWarned = 1;
      }
      this.heading = wrap(this.heading + turn);
      this.bank += (turn / TURN * .55 - this.bank) * .12;
      this.speed += ((turbo ? TURBO : CRUISE) - this.speed) * .04;
    } else if (this.phase === 'landing') {
      // Baja sobre la pista hacia donde apunte, frenando; al tocar tierra se termina el vuelo.
      this.alt = Math.max(0, this.alt - 1 / 70);
      this.speed += (.18 - this.speed) * .06;
      this.bank *= .9;
      if (this.alt <= 0) { this.phase = 'done'; return 'landed'; }
    }
    this.x = Math.max(8, Math.min(SIZE - 8, this.x + Math.cos(this.heading) * this.speed));
    this.y = Math.max(8, Math.min(SIZE - 8, this.y + Math.sin(this.heading) * this.speed));
    return null;
  }
  // A: aterrizar si hay pista debajo. Devuelve el aeropuerto o null.
  tryLand() {
    if (this.phase !== 'cruise') return null;
    const ap = runwayAt(this.x, this.y);
    if (!ap) return null;
    this.phase = 'landing'; this.landAt = ap;
    // Que baje a lo largo de la pista: si va más de lado que de frente, se endereza hacia el lado más cercano.
    const along = Math.abs(Math.cos(this.heading)) > .35;
    if (!along) this.heading = Math.cos(this.heading) >= 0 ? 0 : Math.PI;
    return ap;
  }
  nearest() { return nearestAirport(this.x, this.y); }
  mark(st) { if (this.t % 20 === 0) markSeen(st, this.x, this.y, 2); }
}

// ---------------------------------------------------------------- Vista en pixel (modo clásico)
const CLOUDS = [];
function cloud(i) {
  if (CLOUDS[i]) return CLOUDS[i];
  const c = document.createElement('canvas'); c.width = 120; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.82)';
  for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(24 + k * 14 + (k % 2) * 4, 34 + Math.sin(k * 2 + i) * 8, 15 + (k % 3) * 4, 0, Math.PI * 2); g.fill(); }
  return (CLOUDS[i] = c);
}

export function renderFlight2D(r, f, frame, hour) {
  const g = r.bg, BW = r.bw, BH = r.bh;
  const S = CPX + (1 - f.alt) * 8;                   // al despegar se va alejando: de 12 a 4 píxeles por casilla
  const camX = f.x * S, camY = f.y * S, ox = r.anchorX() - camX, oy = r.anchorY() - camY;
  r.clear('#4a8cd0');
  g.imageSmoothingEnabled = false;
  const vx = BW / S / 2 + CH, vy = BH / S / 2 + CH;
  const list = chunksAround(f.x, f.y, vx, vy);
  // Lo que viene adelante se pinta primero.
  const ahead = chunksAround(f.x + Math.cos(f.heading) * vx, f.y + Math.sin(f.heading) * vy, CH * 1.5);
  warmChunks(list, 7); warmChunks(ahead, 2);
  for (const [cx, cy] of list) {
    const X = Math.floor(ox + cx * CH * S), Y = Math.floor(oy + cy * CH * S), W = Math.ceil(CH * S) + 1;
    if (X > BW || Y > BH || X + W < 0 || Y + W < 0) continue;
    const c = getChunk(cx, cy);
    if (c && c.canvas) g.drawImage(c.canvas, X, Y, W, W);
    else { g.fillStyle = '#8fbf72'; g.fillRect(X, Y, W, W); }
  }
  // Sombra de la avioneta en el suelo (más lejos cuanto más alto) y nubes por debajo.
  const px = r.anchorX(), py = r.anchorY(), rot = f.heading + Math.PI / 2;
  const sh = planeShadow(), k = .55 + f.alt * .25;
  drawRot(g, sh, px + f.alt * 34, py + f.alt * 26, rot, k * (1 - Math.abs(f.bank) * .4), k);
  const drift = frame * .2;
  for (let i = 0; i < 7; i++) {
    const cl = cloud(i % 3), wx = (i * 977 + 300) % 2400, wy = (i * 613 + 140) % 1600;
    const X = ((wx - camX * 1.25 + drift) % 2400 + 2400) % 2400 - 400, Y = ((wy - camY * 1.25) % 1600 + 1600) % 1600 - 300;
    if (X < BW && Y < BH && f.alt > .3) { g.globalAlpha = Math.min(1, (f.alt - .3) * 2) * .85; g.drawImage(cl, X, Y); g.globalAlpha = 1; }
  }
  const pl = planeTop(f.color), sz = .7 + f.alt * .35;
  drawRot(g, pl, px, py - f.alt * 6, rot, sz * (1 - Math.abs(f.bank) * .35), sz);
  // Hélice girando (una rayita que cambia).
  r.present();
  r.post({ outdoor: true, hour, dark: false });
}
function drawRot(g, img, x, y, rot, sx, sy) {
  g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); g.scale(sx, sy);
  g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
}
export const airportList = () => AIRPORTS;
