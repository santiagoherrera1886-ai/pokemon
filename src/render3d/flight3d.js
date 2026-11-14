// Vuelo en 3D: el suelo de Tierra Grande se arma con los pedazos de flightmap.js (cada uno es un plano con su
// textura), con árboles y edificios instanciados encima, nubes por debajo de la avioneta y su sombra en el suelo.
// Todo vive en su propio grupo y se libera al aterrizar; los mapas normales se vuelven a armar solos.
import * as T from 'three';
import { CH, getChunk, warmChunks, chunksAround } from '../world/flightmap.js';
import { TG } from '../world/tierra.js';
import { plane3d } from './vehicles.js';

export const ALT = 15;                 // altura de crucero (casillas)
const TREE_COLORS = { T: '#3e8a48', J: '#6aa848', Y: '#2e6a52' }, SNOW = '#c8d8dc';

function cloudTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  for (let k = 0; k < 7; k++) {
    const x = 22 + k * 14, y = 36 + Math.sin(k * 1.7) * 7, r = 14 + (k % 3) * 5;
    const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

export class FlightView {
  constructor(r, parent) {
    this.r = r; this.root = new T.Group(); this.root.name = 'flight'; parent.add(this.root);
    this.chunks = new Map();
    this.treeGeo = new T.IcosahedronGeometry(1, 0); this.pineGeo = new T.ConeGeometry(1, 1, 6); this.boxGeo = new T.BoxGeometry(1, 1, 1);
    this.treeMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .85, flatShading: true });
    this.bldMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .7 });
    this.dummy = new T.Object3D(); this.col = new T.Color();
    // Suelo de respaldo (mar) por si un pedazo todavía no está listo, y el horizonte.
    this.base = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshStandardMaterial({ color: '#4f8fcf', roughness: .9 }));
    this.base.rotation.x = -Math.PI / 2; this.base.position.y = -.05; this.base.scale.set(900, 900, 1); this.root.add(this.base);
    this.shadow = r.shadow(this.root, 0, 0, 4, 4); this.shadow.material = this.shadow.material.clone();   // propio: se aclara con la altura
    this.cloudTex = cloudTexture();
    this.cloudMat = new T.SpriteMaterial({ map: this.cloudTex, transparent: true, opacity: .8, depthWrite: false });
    this.clouds = [];
    for (let i = 0; i < 14; i++) {
      const s = new T.Sprite(this.cloudMat); const k = 14 + (i % 4) * 5; s.scale.set(k * 2, k, 1);
      s.userData.ox = (i * 137) % 300 - 150; s.userData.oz = (i * 211) % 300 - 150; s.userData.y = 8 + (i % 3) * 1.6;
      this.root.add(s); this.clouds.push(s);
    }
    this.planeColor = null; this.plane = null;
  }
  setPlane(color) {
    if (this.plane && this.planeColor === color) return;
    if (this.plane) this.r.release(this.plane);
    this.plane = plane3d(this.r, color); this.plane.scale.setScalar(1.8); this.plane.rotation.order = 'YXZ';
    this.planeColor = color; this.root.add(this.plane);
  }
  // Arma en 3D un pedazo ya pintado: plano con textura, árboles y edificios.
  build(c) {
    const g = new T.Group(), r = this.r;
    const tex = new T.CanvasTexture(c.canvas); tex.colorSpace = T.SRGBColorSpace; tex.magFilter = T.NearestFilter; tex.minFilter = T.LinearMipmapLinearFilter; tex.anisotropy = 4;
    const mat = new T.MeshStandardMaterial({ map: tex, roughness: .95 });
    const ground = new T.Mesh(r.geometries.plane, mat); ground.rotation.x = -Math.PI / 2; ground.scale.set(CH, CH, 1);
    ground.position.set(TG.X + c.x0 + CH / 2, 0, TG.Y + c.y0 + CH / 2); g.add(ground);
    const d = this.dummy, col = this.col;
    const trees = this.lowTrees ? c.trees.filter((t, i) => i % 2 === 0) : c.trees;
    for (const pine of [false, true]) {
      const list = trees.filter(t => (t[2] === 'Y') === pine);
      if (!list.length) continue;
      const m = new T.InstancedMesh(pine ? this.pineGeo : this.treeGeo, this.treeMat, list.length);
      list.forEach(([x, y, t, snow], i) => {
        const k = .8 + ((x * 7 + y * 13) % 5) * .08;
        d.position.set(TG.X + x + .5, pine ? 1.2 * k : 1.05 * k, TG.Y + y + .5);
        d.scale.set(pine ? .8 * k : .95 * k, pine ? 2.4 * k : 1.1 * k, pine ? .8 * k : .95 * k); d.rotation.set(0, (x * 3 + y) % 6, 0);
        d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, col.set(snow ? SNOW : TREE_COLORS[t] || TREE_COLORS.T));
      });
      m.computeBoundingSphere(); g.add(m);
    }
    if (c.buildings.length) {
      const n = c.buildings.length, walls = new T.InstancedMesh(this.boxGeo, this.bldMat, n), roofs = new T.InstancedMesh(this.boxGeo, this.bldMat, n);
      c.buildings.forEach((b, i) => {
        const w = Math.max(.6, b.w - .15), h = Math.max(.6, b.h - .15), x = TG.X + b.x + b.w / 2, z = TG.Y + b.y + b.h / 2;
        d.rotation.set(0, 0, 0);
        d.position.set(x, b.height / 2, z); d.scale.set(w, b.height, h); d.updateMatrix(); walls.setMatrixAt(i, d.matrix); walls.setColorAt(i, col.set(b.wall));
        d.position.set(x, b.height + .06, z); d.scale.set(w - .1, .14, h - .1); d.updateMatrix(); roofs.setMatrixAt(i, d.matrix); roofs.setColorAt(i, col.set(b.roof));
      });
      walls.computeBoundingSphere(); roofs.computeBoundingSphere(); g.add(walls, roofs);
    }
    this.root.add(g);
    return { group: g, tex, mat };
  }
  drop(key) {
    const e = this.chunks.get(key); if (!e) return;
    e.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
    e.group.removeFromParent(); e.tex.dispose(); e.mat.dispose(); this.chunks.delete(key);
  }
  // Devuelve el punto que sigue la cámara (la avioneta) en coordenadas del mundo 3D.
  update(f, dt, time, quality = 'medium') {
    const radius = quality === 'low' ? 80 : quality === 'high' ? 128 : 104;
    this.lowTrees = quality === 'low';
    const fx = f.x, fy = f.y, want = chunksAround(fx + Math.cos(f.heading) * 20, fy + Math.sin(f.heading) * 20, radius);
    warmChunks(want, 7);
    const keep = new Set();
    let built = 0;
    for (const [cx, cy] of want) {
      const key = cy * 1000 + cx; keep.add(key);
      if (this.chunks.has(key) || built >= 3) continue;
      const c = getChunk(cx, cy);
      if (c && c.canvas) { this.chunks.set(key, this.build(c)); built++; }
    }
    for (const key of [...this.chunks.keys()]) if (!keep.has(key)) this.drop(key);
    // La avioneta: rumbo, alabeo al girar, cabeceo al despegar y la hélice dando vueltas.
    this.setPlane(f.color);
    const x = TG.X + fx, z = TG.Y + fy, y = f.alt * ALT;
    this.plane.position.set(x, y, z);
    this.plane.rotation.set(f.phase === 'takeoff' && f.t > 55 ? -.12 : f.phase === 'landing' ? .06 : 0, Math.PI / 2 - f.heading, f.bank);
    const prop = this.plane.userData.prop; if (prop) prop.rotation.z += dt * (f.speed > .1 ? 46 : 12);
    const k = 3.6 + f.alt * 2; this.shadow.position.set(x + f.alt * 2, .06, z + f.alt * 1.5); this.shadow.scale.set(k, k, 1);
    this.shadow.material.opacity = .32 - f.alt * .12;
    this.base.position.set(x, -.05, z);
    // Nubes: se repiten alrededor de la avioneta, a media altura, y se ven sólo cuando ya va arriba.
    for (const s of this.clouds) {
      const u = s.userData, wx = ((u.ox - x * .15 + time * 1.5) % 300 + 300) % 300 - 150, wz = ((u.oz - z * .15) % 300 + 300) % 300 - 150;
      s.position.set(x + wx, u.y, z + wz); s.visible = f.alt > .45;
    }
    this.cloudMat.opacity = Math.min(.8, Math.max(0, (f.alt - .45) * 2));
    return { x, z, y: y + .5 };
  }
  dispose() {
    for (const key of [...this.chunks.keys()]) this.drop(key);
    if (this.plane) this.r.release(this.plane);
    this.treeGeo.dispose(); this.pineGeo.dispose(); this.boxGeo.dispose(); this.treeMat.dispose(); this.bldMat.dispose();
    this.base.geometry.dispose(); this.base.material.dispose(); this.cloudTex.dispose(); this.cloudMat.dispose(); this.shadow.material.dispose();
    this.root.removeFromParent();
  }
}
