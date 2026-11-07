// Mapas en tiempo de ejecución: consultas de tiles, colisiones, sprites de objetos y suelo pre-renderizado.
import { canvas } from '../core/pixel.js';
import { drawTile, SOLID, TS } from '../art/tiles.js';
import { tree, bush, rock, fence, sign, mailbox, briefcase, lamp, house, lab, furniture } from '../art/objects.js';
import { buildMaps } from './maps.js';

export class GameMap {
  constructor(def) {
    Object.assign(this, def);
    this.groundCache = [];
    // Árboles, cercas y arbustos se generan a partir de los tiles.
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const t = this.at(x, y);
      if (t === 'T') this.objects.push({ kind: 'tree', x, y, solid: true, variant: (x * 3 + y) % 3 });
      if (t === 'f') this.objects.push({ kind: 'fence', x, y, solid: true });
      if (t === 'B') this.objects.push({ kind: 'bush', x, y, solid: true });
    }
    for (const o of this.objects) {
      o.w = o.w || 1; o.h = o.h || 1;
      if (o.solid === undefined) o.solid = o.kind !== 'deco';
    }
  }
  at(x, y) { return (y < 0 || x < 0 || y >= this.h || x >= this.w) ? undefined : this.tiles[y][x]; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  visibleObjects(st) { return this.objects.filter(o => !o.when || o.when(st)); }
  objectAt(x, y, st) {
    return this.visibleObjects(st).find(o => o.kind !== 'deco' && x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h);
  }
  blocked(x, y, st) {
    const t = this.at(x, y);
    if (t === undefined || SOLID.has(t)) return true;
    const o = this.objectAt(x, y, st);
    if (o && o.solid && !(o.door && o.door[0] === x && o.door[1] === y)) return true;
    return false;
  }
  warpAt(x, y) { return this.warps.find(w => w.x === x && w.y === y); }

  ground(frame) {
    const f = frame % 4;
    if (this.groundCache[f]) return this.groundCache[f];
    const [c, g] = canvas(this.w * TS, this.h * TS);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) drawTile(g, this.tiles[y][x], x, y, this, f, x * TS, y * TS);
    this.groundCache[f] = c;
    return c;
  }

  // Lista de sprites ordenables {img, x, y, base} en píxeles locales del mapa.
  sprites(st) {
    const out = [];
    for (const o of this.visibleObjects(st)) {
      const X = o.x * TS, Y = o.y * TS;
      switch (o.kind) {
        case 'tree': out.push({ img: tree(o.variant), x: X - 3, y: Y - 16, base: Y + 16 }); break;
        case 'bush': out.push({ img: bush(), x: X, y: Y, base: Y + 16 }); break;
        case 'rock': out.push({ img: rock(), x: X, y: Y, base: Y + 16 }); break;
        case 'fence': out.push({ img: fence(this.at(o.x - 1, o.y) === 'f', this.at(o.x + 1, o.y) === 'f'), x: X, y: Y - 4, base: Y + 16 }); break;
        case 'sign': out.push({ img: sign(), x: X, y: Y - 4, base: Y + 16 }); break;
        case 'mailbox': out.push({ img: mailbox(), x: X, y: Y - 4, base: Y + 16 }); break;
        case 'lamp': out.push({ img: lamp(), x: X, y: Y - 16, base: Y + 16 }); break;
        case 'briefcase': out.push({ img: briefcase(), x: X, y: Y, base: Y + 15 }); break;
        case 'house': out.push({ img: house(o.w, o.h, o.opt), x: X - 1, y: Y - TS, base: Y + o.h * TS }); break;
        case 'lab': out.push({ img: lab(o.w, o.h), x: X - 1, y: Y - TS, base: Y + o.h * TS }); break;
        case 'furniture': out.push({ img: furniture(o.name, o.arg), x: X + (o.sx || 0), y: Y + (o.sy || 0), base: Y + o.h * TS }); break;
        case 'deco': out.push({ img: furniture(o.name), x: o.px, y: o.py, base: -1000 }); break;
      }
    }
    return out;
  }
}

export class World {
  constructor() {
    const defs = buildMaps();
    this.maps = {};
    for (const id in defs) this.maps[id] = new GameMap(defs[id]);
    this.outdoor = Object.values(this.maps).filter(m => m.outdoor);
  }
  get(id) { return this.maps[id]; }
  // Mapa exterior que contiene la coordenada global (gx, gy).
  outdoorAt(gx, gy) {
    return this.outdoor.find(m => gx >= m.origin[0] && gy >= m.origin[1] && gx < m.origin[0] + m.w && gy < m.origin[1] + m.h);
  }
}
