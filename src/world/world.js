// Mapas en tiempo de ejecución: consultas de tiles, colisiones, sprites de objetos y suelo pre-renderizado.
import { canvas } from '../core/pixel.js';
import { drawTile, SOLID, TS } from '../art/tiles.js';
import { tree, bush, rock, fence, sign, mailbox, briefcase, lamp, house, lab, furniture, palm, pine, boulder, crystal, statue, fountain, bench, boat, bigBuilding, caveMouth } from '../art/objects.js';
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
      if (t === 'Y') this.objects.push({ kind: 'pine', x, y, solid: true });
      if (t === 'J') this.objects.push({ kind: 'palm', x, y, solid: true });
      if (t === 'O') this.objects.push({ kind: 'boulder', x, y, solid: true });
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

  // Lista de sprites ordenables {img, x, y, base} en píxeles locales del mapa, más sombras {shadow}.
  sprites(st) {
    if (this._spr && this._sprKey === this.spriteKey(st)) return this._spr;
    const out = [];
    const sh = (cx, cy, rx, ry) => out.push({ shadow: [cx, cy, rx, ry], base: -2000 });
    const rs = (x, y, w, h) => out.push({ shadowRect: [x, y, w, h], base: -2000 });
    for (const o of this.visibleObjects(st)) {
      const X = o.x * TS, Y = o.y * TS;
      const push = (img, x, y, base) => out.push({ img, x, y, base });
      switch (o.kind) {
        case 'tree': push(tree(o.variant), X - 3, Y - 16, Y + 16); sh(X + 10, Y + 14, 10, 4); break;
        case 'pine': push(pine(), X - 2, Y - 18, Y + 16); sh(X + 9, Y + 14, 8, 3); break;
        case 'palm': push(palm(), X - 5, Y - 20, Y + 16); sh(X + 12, Y + 14, 9, 3); break;
        case 'bush': push(bush(), X, Y, Y + 16); sh(X + 8, Y + 14, 7, 2); break;
        case 'rock': push(rock(), X, Y, Y + 16); sh(X + 8, Y + 14, 7, 2); break;
        case 'boulder': push(boulder(), X, Y - 2, Y + 16); sh(X + 9, Y + 14, 7, 2); break;
        case 'crystal': push(crystal(), X, Y - 4, Y + 16); break;
        case 'statue': push(statue(), X, Y - 14, Y + 16); sh(X + 9, Y + 15, 7, 2); break;
        case 'fountain': push(fountain(), X, Y, Y + 32); sh(X + 17, Y + 28, 15, 4); break;
        case 'bench': push(bench(), X, Y + 2, Y + 16); break;
        case 'boat': push(boat(), X, Y, Y + 22); break;
        case 'cave': push(caveMouth(), X - 2, Y - 4, Y + 1); break;
        case 'shimmer': push(crystal(), X, Y - 4, Y + 16); break;
        case 'fence': push(fence(this.at(o.x - 1, o.y) === 'f', this.at(o.x + 1, o.y) === 'f'), X, Y - 4, Y + 16); break;
        case 'sign': push(sign(), X, Y - 4, Y + 16); sh(X + 8, Y + 15, 5, 1); break;
        case 'mailbox': push(mailbox(), X, Y - 4, Y + 16); sh(X + 8, Y + 15, 4, 1); break;
        case 'lamp': push(lamp(), X, Y - 16, Y + 16); sh(X + 9, Y + 15, 4, 1); out.push({ light: [X + 8, Y - 10, 34], base: 9e9 }); break;
        case 'briefcase': push(briefcase(), X, Y, Y + 15); break;
        case 'house': out.push({ light: [X + o.w * 8, Y + o.h * TS - 10, 26 + o.w * 4], base: 9e9 }); push(house(o.w, o.h, o.opt), X - 1, Y - TS, Y + o.h * TS); rs(X + 3, Y + o.h * TS - 3, o.w * TS, 5); rs(X + o.w * TS, Y + 4, 4, o.h * TS - 2); break;
        case 'lab': push(lab(o.w, o.h), X - 1, Y - TS, Y + o.h * TS); rs(X + 3, Y + o.h * TS - 3, o.w * TS, 5); rs(X + o.w * TS, Y + 4, 4, o.h * TS - 2); break;
        case 'big': push(bigBuilding(o.w, o.h, o.opt), X - 1, Y - TS, Y + o.h * TS); rs(X + 3, Y + o.h * TS - 3, o.w * TS, 5); rs(X + o.w * TS, Y + 4, 4, o.h * TS - 2); break;
        case 'furniture': push(furniture(o.name, o.arg), X + (o.sx || 0), Y + (o.sy || 0), Y + o.h * TS); break;
        case 'deco': out.push({ img: furniture(o.name), x: o.px, y: o.py, base: -1000 }); break;
      }
    }
    this._spr = out; this._sprKey = this.spriteKey(st);
    return out;
  }
  spriteKey(st) { return this.objects.map(o => o.when ? (o.when(st) ? 1 : 0) : 2).join(''); }
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
