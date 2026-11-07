// Constructor de mapas: rejilla de tiles + objetos + NPC + puertas + disparadores.
export class MapBuilder {
  constructor(id, w, h, fill = '.') {
    this.def = { id, w, h, objects: [], npcs: [], warps: [], triggers: [], signs: [] };
    this.grid = Array.from({ length: h }, () => Array(w).fill(fill));
  }
  set(x, y, c) { if (y >= 0 && y < this.def.h && x >= 0 && x < this.def.w) this.grid[y][x] = c; return this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  border(c, t = 2) {
    const { w, h } = this.def;
    this.rect(0, 0, w, t, c).rect(0, h - t, w, t, c).rect(0, 0, t, h, c).rect(w - t, 0, t, h, c);
    return this;
  }
  rows(y, x, strs) { strs.forEach((s, j) => [...s].forEach((ch, i) => { if (ch !== '?') this.set(x + i, y + j, ch); })); return this; }
  meta(o) { Object.assign(this.def, o); return this; }
  obj(o) { this.def.objects.push(o); return this; }
  npc(o) { this.def.npcs.push({ dir: 0, ...o }); return this; }
  warp(x, y, to, tx, ty, opts = {}) { this.def.warps.push({ x, y, to, tx, ty, face: 0, ...opts }); return this; }
  trigger(o) { this.def.triggers.push(o); return this; }

  // Edificio con puerta: el área es sólida salvo la puerta, que lleva al interior indicado.
  building(kind, x, y, w, h, opt, to, tx, ty) {
    const doorCol = opt.doorCol ?? Math.floor(w / 2);
    this.obj({ kind, x, y, w, h, opt: { ...opt, doorCol }, solid: true, door: [x + doorCol, y + h - 1] });
    this.warp(x + doorCol, y + h - 1, to, tx, ty, { face: 1, needDir: 1 });
    return this;
  }
  furniture(name, x, y, w, h, opt = {}) { this.obj({ kind: 'furniture', name, x, y, w, h, solid: opt.solid !== false, ...opt }); return this; }
  deco(name, px, py) { this.obj({ kind: 'deco', name, px, py }); return this; }

  build() {
    this.def.tiles = this.grid.map(r => r.join(''));
    return this.def;
  }
}
