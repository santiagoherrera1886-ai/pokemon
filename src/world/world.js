// Mapas en tiempo de ejecución: consultas de tiles, colisiones, sprites de objetos y suelo pre-renderizado.
import { canvas } from '../core/pixel.js';
import { drawTile, SOLID, TS } from '../art/tiles.js';
import { tree, bush, rock, fence, sign, mailbox, briefcase, lamp, house, lab, furniture, palm, pine, boulder, crystal, statue, fountain, bench, boat, bigBuilding, caveMouth } from '../art/objects.js';
import { buildMaps } from './maps.js';
import { tgDef, tgCell, tgId, TG, tileAt } from './tierra.js';
import { tower, parkedCar, parkedPlane, pump } from '../art/vehicles.js';

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
      if (t === 'Y') this.objects.push({ kind: 'pine', x, y, solid: true, snow: !!this.snow });
      if (t === 'J') this.objects.push({ kind: 'palm', x, y, solid: true });
      if (t === 'O') this.objects.push({ kind: 'boulder', x, y, solid: true, snow: !!this.snow });
    }
    for (const o of this.objects) {
      o.w = o.w || 1; o.h = o.h || 1;
      if (o.solid === undefined) o.solid = o.kind !== 'deco';
    }
  }
  // Fuera del mapa: en Tierra Grande se mira la casilla vecina del mundo (así no hay costuras entre pedazos).
  at(x, y) { return (y < 0 || x < 0 || y >= this.h || x >= this.w) ? (this.tg ? tileAt(this.tg[0] * TG.S + x, this.tg[1] * TG.S + y) : undefined) : this.tiles[y][x]; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  visibleObjects(st) { return this.objects.filter(o => !o.when || o.when(st)); }
  objectAt(x, y, st) {
    return this.visibleObjects(st).find(o => o.kind !== 'deco' && x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h);
  }
  blocked(x, y, st) {
    const t = this.at(x, y);
    if (t === undefined || SOLID.has(t)) return true;
    const o = this.objectAt(x, y, st);
    if (o && o.solid && !(o.door && o.door[0] === x && o.door[1] === y) && !(o.doors && o.doors.some(d => d[0] === x && d[1] === y))) return true;
    return false;
  }
  warpAt(x, y) { return this.warps.find(w => w.x === x && w.y === y); }

  ground(frame) {
    // Los mapas de Tierra Grande guardan menos cuadros de animación (hay muchos cargados a la vez).
    const f = frame % (this.animFrames || 4);
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
        case 'gym': push(bigBuilding(o.w, o.h, o.opt), X - 1, Y - TS, Y + o.h * TS); rs(X + 3, Y + o.h * TS - 3, o.w * TS, 5); rs(X + o.w * TS, Y + 4, 4, o.h * TS - 2); break;
        case 'furniture': push(furniture(o.name, o.arg), X + (o.sx || 0), Y + (o.sy || 0), Y + o.h * TS); break;
        case 'deco': out.push({ img: furniture(o.name), x: o.px, y: o.py, base: -1000 }); break;
        case 'tower': { const img = tower(o.w, o.h, o.floors, o.opt); push(img, X - 1, Y + o.h * TS - img.height, Y + o.h * TS); rs(X + 3, Y + o.h * TS - 3, o.w * TS, 5); rs(X + o.w * TS, Y + 4, 6, o.h * TS - 2); break; }
        case 'car': push(parkedCar(o.color, o.dir), X - 1, Y - 2, Y + o.h * TS); sh(X + 8, Y + o.h * TS - 2, 8, 3); break;
        case 'plane': push(parkedPlane(o.color), X - 4, Y - 4, Y + o.h * TS); sh(X + 24, Y + 40, 20, 5); break;
        case 'pump': push(pump(), X, Y - 10, Y + 16); sh(X + 8, Y + 14, 5, 2); break;
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
    this.base = Object.values(this.maps).filter(m => m.outdoor);   // mapas hechos a mano
    this.outdoor = [...this.base];                                  // + los de Tierra Grande que estén cargados
  }
  // Los mapas de Tierra Grande (tg_i_j) y sus interiores (tgi_...) se generan la primera vez que se piden.
  get(id) {
    let m = this.maps[id];
    if (m || typeof id !== 'string') return m;
    const def = tgDef(id);
    if (!def) return undefined;
    m = this.maps[id] = new GameMap(def);
    if (m.tg) { m.animFrames = m.tiles.some(r => r.includes('w')) ? 2 : 1; this.outdoor.push(m); }
    return m;
  }
  // Mapa exterior que contiene la coordenada global (gx, gy).
  outdoorAt(gx, gy) {
    const cell = tgCell(gx, gy);
    if (cell) return this.get(tgId(cell[0], cell[1]));
    return this.base.find(m => gx >= m.origin[0] && gy >= m.origin[1] && gx < m.origin[0] + m.w && gy < m.origin[1] + m.h);
  }
  // Asegura los mapas de Tierra Grande que tocan el cuadro de radio r alrededor de (gx, gy).
  around(gx, gy, r) {
    const a = tgCell(Math.max(gx - r, TG.X), Math.max(gy - r, TG.Y)), b = tgCell(Math.min(gx + r, TG.X + TG.S * TG.N - 1), Math.min(gy + r, TG.Y + TG.S * TG.N - 1));
    if (!a || !b) return;
    for (let j = a[1]; j <= b[1]; j++) for (let i = a[0]; i <= b[0]; i++) this.get(tgId(i, j));
  }
  // Olvida los mapas de Tierra Grande lejanos (se vuelven a generar idénticos si se necesitan).
  trim(gx, gy, keep = 3) {
    const c = tgCell(gx, gy);
    let dropped = false;
    for (const m of this.outdoor) {
      if (!m.tg) continue;
      if (c && Math.abs(m.tg[0] - c[0]) <= keep && Math.abs(m.tg[1] - c[1]) <= keep) continue;
      delete this.maps[m.id]; dropped = true;
    }
    if (dropped) this.outdoor = this.outdoor.filter(m => this.maps[m.id] === m);
  }
}
