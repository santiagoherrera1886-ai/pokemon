// Escultor por campos de distancia (SDF) para las criaturas: primitivas que se funden como plastilina
// (cabeza, cuello, patas y cola en una sola pieza), pintura por zonas (barriga, cachetes, manchas) y
// malla con Surface Nets, vértices ajustados a la superficie y normales del gradiente.
import * as T from 'three';

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25; };
const FAR = 1e9;

// Rotación inversa (para llevar el punto al espacio local de la pieza) a partir de ángulos de Euler.
function inverseRotation(rot) {
  if (!rot || (!rot[0] && !rot[1] && !rot[2])) return null;
  const e = new T.Matrix4().makeRotationFromEuler(new T.Euler(rot[0], rot[1], rot[2])).elements;
  return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
}
const linear = hex => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };

export class Sculpt {
  constructor() { this.parts = []; this.paints = []; }

  // ---------- Primitivas (devuelven la función de distancia y su caja) ----------
  static ellipsoid(c, r, rot) {
    const [cx, cy, cz] = c, [rx, ry, rz] = Array.isArray(r) ? r : [r, r, r], m = inverseRotation(rot);
    const ix = 1 / rx, iy = 1 / ry, iz = 1 / rz, ix2 = ix * ix, iy2 = iy * iy, iz2 = iz * iz, rmin = Math.min(rx, ry, rz), R = Math.max(rx, ry, rz);
    const f = (x, y, z) => {
      let dx = x - cx, dy = y - cy, dz = z - cz;
      if (m) { const lx = m[0] * dx + m[1] * dy + m[2] * dz, ly = m[3] * dx + m[4] * dy + m[5] * dz, lz = m[6] * dx + m[7] * dy + m[8] * dz; dx = lx; dy = ly; dz = lz; }
      const a = dx * ix, b = dy * iy, e = dz * iz, k0 = Math.sqrt(a * a + b * b + e * e);
      const a1 = dx * ix2, b1 = dy * iy2, e1 = dz * iz2, k1 = Math.sqrt(a1 * a1 + b1 * b1 + e1 * e1);
      return k1 < 1e-12 ? -rmin : k0 * (k0 - 1) / k1;
    };
    return { f, box: [cx - R, cy - R, cz - R, cx + R, cy + R, cz + R] };
  }
  // Cono redondeado entre a (radio r1) y b (radio r2): extremidades, cuellos, colas, cuernos.
  static roundCone(a, b, r1, r2) {
    const [ax, ay, az] = a, [bx, by, bz] = b;
    const bax = bx - ax, bay = by - ay, baz = bz - az, l2 = bax * bax + bay * bay + baz * baz;
    let rr = r1 - r2;
    if (l2 <= rr * rr + 1e-6) rr = Math.sign(rr) * Math.sqrt(l2) * .98;   // evita conos degenerados
    const a2 = l2 - rr * rr, il2 = 1 / l2, s = Math.sign(rr), R1 = r2 + rr;
    const f = (x, y, z) => {
      const pax = x - ax, pay = y - ay, paz = z - az;
      const yy = pax * bax + pay * bay + paz * baz, zz = yy - l2;
      const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2, k = s * rr * rr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
      if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - R1;
      return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - R1;
    };
    const R = Math.max(r1, r2);
    return { f, box: [Math.min(ax, bx) - R, Math.min(ay, by) - R, Math.min(az, bz) - R, Math.max(ax, bx) + R, Math.max(ay, by) + R, Math.max(az, bz) + R] };
  }
  static torus(c, R, r, rot) {
    const [cx, cy, cz] = c, m = inverseRotation(rot);
    const f = (x, y, z) => {
      let dx = x - cx, dy = y - cy, dz = z - cz;
      if (m) { const lx = m[0] * dx + m[1] * dy + m[2] * dz, ly = m[3] * dx + m[4] * dy + m[5] * dz, lz = m[6] * dx + m[7] * dy + m[8] * dz; dx = lx; dy = ly; dz = lz; }
      const q = Math.sqrt(dx * dx + dz * dz) - R; return Math.sqrt(q * q + dy * dy) - r;
    };
    const E = R + r;
    return { f, box: [cx - E, cy - E, cz - E, cx + E, cy + E, cz + E] };
  }

  // ---------- Construcción ----------
  // k: suavidad de la unión (0 = unión dura). kc: ancho de la mezcla de color con lo de al lado.
  push(shape, color, { k = .06, kc, sub = false } = {}) {
    const pad = k + .08, b = shape.box;
    this.parts.push({ f: shape.f, box: [b[0] - pad, b[1] - pad, b[2] - pad, b[3] + pad, b[4] + pad, b[5] + pad], raw: b, color: color ? linear(color) : null, k, kc: kc ?? Math.max(.025, k * .6), sub });
    return this;
  }
  ball(c, r, color, o = {}) { return this.push(Sculpt.ellipsoid(c, r, o.rot), color, o); }
  limb(a, b, r1, r2, color, o = {}) { return this.push(Sculpt.roundCone(a, b, r1, r2), color, o); }
  ring(c, R, r, color, o = {}) { return this.push(Sculpt.torus(c, R, r, o.rot), color, o); }
  // Tallar (restar) una forma: boca abierta, cráter, base plana.
  carve(shape, k = .03) { return this.push(shape, null, { k, sub: true }); }
  // Pintar sin cambiar la forma: soft = ancho del borde difuminado.
  paint(shape, color, soft = .03) { this.paints.push({ f: shape.f, box: shape.box, color: linear(color), soft }); return this; }
  // Simetría izquierda/derecha: fn recibe s = -1 y s = 1.
  pair(fn) { fn(-1); fn(1); return this; }

  eval(x, y, z) {
    let d = FAR;
    for (const p of this.parts) {
      const b = p.box;
      if (x < b[0] || y < b[1] || z < b[2] || x > b[3] || y > b[4] || z > b[5]) continue;
      const di = p.f(x, y, z);
      if (p.sub) { if (d < FAR) d = smax(d, -di, p.k); }
      else d = p.k > 0 ? smin(d, di, p.k) : Math.min(d, di);
    }
    return d;
  }
  grad(x, y, z, h, out) {
    out[0] = this.eval(x + h, y, z) - this.eval(x - h, y, z);
    out[1] = this.eval(x, y + h, z) - this.eval(x, y - h, z);
    out[2] = this.eval(x, y, z + h) - this.eval(x, y, z - h);
    const l = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2]) || 1;
    out[0] /= l; out[1] /= l; out[2] /= l; return out;
  }
  colorAt(x, y, z, out) {
    let dmin = FAR;
    const ds = [];
    for (const p of this.parts) {
      if (p.sub || !p.color) { ds.push(FAR); continue; }
      const b = p.box;
      if (x < b[0] || y < b[1] || z < b[2] || x > b[3] || y > b[4] || z > b[5]) { ds.push(FAR); continue; }
      const di = p.f(x, y, z); ds.push(di); if (di < dmin) dmin = di;
    }
    let r = 0, g = 0, bl = 0, wsum = 0;
    this.parts.forEach((p, i) => {
      const di = ds[i]; if (di >= FAR) return;
      const t = 1 - (di - dmin) / p.kc; if (t <= 0) return;
      const w = t * t; r += p.color[0] * w; g += p.color[1] * w; bl += p.color[2] * w; wsum += w;
    });
    if (wsum > 0) { r /= wsum; g /= wsum; bl /= wsum; } else { r = g = bl = .8; }
    for (const q of this.paints) {
      const b = q.box, m = q.soft;
      if (x < b[0] - m || y < b[1] - m || z < b[2] - m || x > b[3] + m || y > b[4] + m || z > b[5] + m) continue;
      const d = q.f(x, y, z), t0 = Math.min(1, Math.max(0, .5 - d / q.soft)), t = t0 * t0 * (3 - 2 * t0);
      if (t <= 0) continue;
      r += (q.color[0] - r) * t; g += (q.color[1] - g) * t; bl += (q.color[2] - bl) * t;
    }
    out[0] = r; out[1] = g; out[2] = bl; return out;
  }
  // Punto de la superficie saliendo desde un punto interior en una dirección, con su normal.
  surface(o, dir, maxT = 2) {
    const l = Math.hypot(dir[0], dir[1], dir[2]), d = [dir[0] / l, dir[1] / l, dir[2] / l];
    const at = t => this.eval(o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t);
    let a = 0, b = -1;
    for (let t = .01; t <= maxT; t += .01) { if (at(t) > 0) { b = t; break; } a = t; }
    if (b < 0) b = maxT;
    for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (at(m) > 0) b = m; else a = m; }
    const t = (a + b) / 2, p = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
    const n = this.grad(p[0], p[1], p[2], .004, [0, 0, 0]);
    return { p: new T.Vector3(...p), n: new T.Vector3(...n) };
  }

  // Malla por Surface Nets.
  mesh(voxel = .028) {
    let x0 = FAR, y0 = FAR, z0 = FAR, x1 = -FAR, y1 = -FAR, z1 = -FAR;
    for (const p of this.parts) if (!p.sub) { const b = p.raw; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); z0 = Math.min(z0, b[2]); x1 = Math.max(x1, b[3]); y1 = Math.max(y1, b[4]); z1 = Math.max(z1, b[5]); }
    const pad = voxel * 3; x0 -= pad; y0 -= pad; z0 -= pad; x1 += pad; y1 += pad; z1 += pad;
    const nx = Math.ceil((x1 - x0) / voxel) + 1, ny = Math.ceil((y1 - y0) / voxel) + 1, nz = Math.ceil((z1 - z0) / voxel) + 1;
    const F = new Float32Array(nx * ny * nz);
    for (let k = 0, idx = 0; k < nz; k++) { const z = z0 + k * voxel; for (let j = 0; j < ny; j++) { const y = y0 + j * voxel; for (let i = 0; i < nx; i++, idx++) F[idx] = this.eval(x0 + i * voxel, y, z); } }
    const at = (i, j, k) => F[i + nx * (j + ny * k)];
    const cnx = nx - 1, cny = ny - 1, cell = (i, j, k) => i + cnx * (j + cny * k);
    const cellV = new Int32Array(cnx * cny * (nz - 1)).fill(-1);
    const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cv = new Float64Array(8), pos = [];
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) { const v = at(i + C[c][0], j + C[c][1], k + C[c][2]); cv[c] = v; if (v < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of E) {
        const va = cv[a], vb = cv[b]; if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb), A = C[a], B = C[b];
        sx += A[0] + t * (B[0] - A[0]); sy += A[1] + t * (B[1] - A[1]); sz += A[2] + t * (B[2] - A[2]); n++;
      }
      cellV[cell(i, j, k)] = pos.length / 3;
      pos.push(x0 + (i + sx / n) * voxel, y0 + (j + sy / n) * voxel, z0 + (k + sz / n) * voxel);
    }
    // Ajusta cada vértice a la superficie real y calcula normal y color.
    const count = pos.length / 3, P = new Float32Array(pos), N = new Float32Array(count * 3), COL = new Float32Array(count * 3), g = [0, 0, 0], col = [0, 0, 0];
    for (let v = 0; v < count; v++) {
      let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      for (let it = 0; it < 2; it++) {
        const d = this.eval(x, y, z); if (Math.abs(d) > voxel * 2) break;
        this.grad(x, y, z, voxel * .3, g); x -= g[0] * d; y -= g[1] * d; z -= g[2] * d;
      }
      this.grad(x, y, z, voxel * .3, g);
      P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z; N[v * 3] = g[0]; N[v * 3 + 1] = g[1]; N[v * 3 + 2] = g[2];
      this.colorAt(x, y, z, col); COL[v * 3] = col[0]; COL[v * 3 + 1] = col[1]; COL[v * 3 + 2] = col[2];
    }
    // Caras: un cuadrilátero por cada arista de la rejilla que cruza la superficie.
    const index = [];
    const quad = (a, b, c, d) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, wx = P[c * 3] - ax, wy = P[c * 3 + 1] - ay, wz = P[c * 3 + 2] - az;
      const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
      const flip = fx * (N[a * 3] + N[c * 3]) + fy * (N[a * 3 + 1] + N[c * 3 + 1]) + fz * (N[a * 3 + 2] + N[c * 3 + 2]) < 0;
      const q = flip ? [a, d, c, b] : [a, b, c, d];
      const dist = (m, n) => (P[m * 3] - P[n * 3]) ** 2 + (P[m * 3 + 1] - P[n * 3 + 1]) ** 2 + (P[m * 3 + 2] - P[n * 3 + 2]) ** 2;
      if (dist(q[0], q[2]) <= dist(q[1], q[3])) index.push(q[0], q[1], q[2], q[0], q[2], q[3]);
      else index.push(q[1], q[2], q[3], q[1], q[3], q[0]);
    };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const s = at(i, j, k) < 0;
      if (s !== (at(i + 1, j, k) < 0)) quad(cellV[cell(i, j, k)], cellV[cell(i, j - 1, k)], cellV[cell(i, j - 1, k - 1)], cellV[cell(i, j, k - 1)]);
      if (s !== (at(i, j + 1, k) < 0)) quad(cellV[cell(i, j, k)], cellV[cell(i, j, k - 1)], cellV[cell(i - 1, j, k - 1)], cellV[cell(i - 1, j, k)]);
      if (s !== (at(i, j, k + 1) < 0)) quad(cellV[cell(i, j, k)], cellV[cell(i - 1, j, k)], cellV[cell(i - 1, j - 1, k)], cellV[cell(i, j - 1, k)]);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3));
    geo.setAttribute('normal', new T.BufferAttribute(N, 3));
    geo.setAttribute('color', new T.BufferAttribute(COL, 3));
    geo.setIndex(count > 65535 ? new T.BufferAttribute(new Uint32Array(index), 1) : new T.BufferAttribute(new Uint16Array(index), 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    return geo;
  }
}
