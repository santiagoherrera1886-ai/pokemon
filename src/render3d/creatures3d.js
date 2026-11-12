// Criaturas 3D de Alborada esculpidas: cada cuerpo es una sola pieza de "plastilina" (sculpt.js) con
// cabeza, cuello, patas y cola fundidos, barriga y cachetes pintados y boca tallada. Encima van los detalles
// finos (ojos con brillo que parpadean, llamas, alas, antenas, garras). Diseños propios de cada especie.
import * as T from 'three';
import { Sculpt } from './sculpt.js';
import { BRUMA } from './bestiary.js';
import { INICIALES } from './iniciales.js';
import { FAUNA } from './fauna.js';
import { creatureEyeMaterial, eyePatchGeometry } from './faces.js';

// ---------- Geometrías compartidas de los detalles ----------
const G = {};
const geo = (k, make) => G[k] || (G[k] = make());
const SPHERE = () => geo('s', () => new T.SphereGeometry(1, 24, 16));
const SPHERE_LO = () => geo('sl', () => new T.SphereGeometry(1, 14, 10));
const CONE = () => geo('cone', () => new T.ConeGeometry(1, 1, 16));
const CYL = () => geo('cyl', () => new T.CylinderGeometry(1, 1, 1, 14));
const TORUS = (arc, tube) => geo('t' + arc.toFixed(3) + tube, () => new T.TorusGeometry(1, tube, 8, 24, arc));
const OCTA = () => geo('octa', () => new T.OctahedronGeometry(1, 0));
const PRISM = () => geo('prism', () => new T.CylinderGeometry(.62, 1, 1, 6).translate(0, .5, 0));
const RING = tube => geo('ring' + tube, () => new T.TorusGeometry(1, tube, 10, 64));
const BODY = new Map();   // malla esculpida por especie (cara de construir, se guarda)

// Láminas con grosor (orejas de hoja, hojas, aletas, plumas de fuego planas): contorno 2D en una caja de
// ancho 1 (x de -.5 a .5) y largo 1 (y de 0 a 1), extruido con bisel redondo y luego arqueado.
// curl dobla la punta hacia +z (hacia el frente de la lámina) y cup ahueca los bordes.
const OUTLINE = {
  leaf: t => .5 * Math.pow(Math.sin(Math.PI * t), .72) * (1 - .16 * t),
  ear: t => .5 * Math.pow(Math.sin(Math.PI * (.12 + .88 * t)), .7),
  petal: t => .5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * .92 + .04)), .5),
  blade: t => .5 * Math.pow(Math.sin(Math.PI * (.05 + .95 * t)), 1.1) * (1 - .4 * t)
};
// Aletas: contornos por puntos (abanico con borde festoneado, cola de pez de dos lóbulos, cresta).
const POINTS = {
  fin: [[0, 0], [.2, .08], [.4, .4], [.52, .78], [.44, .9], [.3, .8], [.22, 1], [.06, .86], [-.06, .96], [-.16, .74], [-.18, .42], [-.12, .12]],
  fluke: [[0, 0], [.1, .2], [.3, .48], [.52, .8], [.5, 1], [.3, .8], [.1, .62], [0, .58], [-.1, .62], [-.3, .8], [-.5, 1], [-.52, .8], [-.3, .48], [-.1, .2]],
  crest: [[0, 0], [.34, .18], [.5, .52], [.38, .66], [.3, .58], [.24, .86], [.08, .7], [-.02, 1], [-.12, .68], [-.2, .4], [-.16, .12]],
  stream: [[0, 0], [.22, .14], [.3, .36], [.24, .6], [.12, .84], [.02, 1], [-.04, .82], [-.02, .56], [-.08, .3], [-.14, .1]]
};
function bladeGeo(kind, curl = 0, cup = 0) {
  const key = 'bl' + kind + curl.toFixed(2) + cup.toFixed(2);
  return geo(key, () => {
    const shape = new T.Shape(), f = OUTLINE[kind];
    if (f) {
      const N = 22;
      for (let i = 0; i <= N; i++) { const t = i / N; i ? shape.lineTo(f(t), t) : shape.moveTo(f(t), t); }
      for (let i = N; i >= 0; i--) { const t = i / N; if (f(t) > 1e-4) shape.lineTo(-f(t), t); }
    } else POINTS[kind].forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const g = new T.ExtrudeGeometry(shape, { depth: .05, bevelEnabled: true, bevelThickness: .045, bevelSize: .035, bevelSegments: 2, curveSegments: 6, steps: 1 });
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) - .025 + curl * y * y + cup * x * x * 2); }
    g.computeVertexNormals(); return g;
  });
}
// Fuego vivo: lenguas con degradé de color (sin luz propia: brillan solas y encienden el resplandor).
// [color de la base, intensidad, color de la punta, intensidad]; las intensidades > 1 hacen brillar el bloom.
const FIRE = {
  core: ['#fff2a8', 1.35, '#ffc83a', 1.12], mid: ['#ffb42a', 1.06, '#ff6a14', .95], out: ['#ff7a1e', .96, '#e0360e', .86],
  mane: ['#d6300e', .86, '#ffa21e', 1.06], maneTip: ['#ff5e14', .92, '#ffd040', 1.2]
};
let FIRE_MAT = null;
const fireMat = () => FIRE_MAT || (FIRE_MAT = new T.MeshBasicMaterial({ vertexColors: true }));
// Lengua de fuego: perfil de gota que se tuerce hacia la punta, con degradé de color (base -> punta).
function flameGeo(bend) {
  return geo('fl' + bend.toFixed(2), () => {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const h = i / 16; pts.push(new T.Vector2(.5 * Math.pow(Math.sin(Math.PI * (.08 + .92 * h)), .85) * Math.pow(1 - h, .55) + .001, h)); }
    const g = new T.LatheGeometry(pts, 10), p = g.attributes.position;
    // Curva en S: la base sale derecha y la punta se dobla (bend) como una lengua de fuego.
    for (let i = 0; i < p.count; i++) { const h = p.getY(i); p.setX(i, p.getX(i) + bend * (h * h * 1.1 - h * .22)); p.setZ(i, p.getZ(i) + bend * Math.sin(h * 3) * .08); }
    g.computeVertexNormals(); return g;
  });
}

const sh = (hex, f) => { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); };
const FWD = new T.Vector3(0, 0, 1);
const dirOf = (yaw, pitch) => [Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
const E = Sculpt.ellipsoid, C = Sculpt.roundCone;

function kit(r, g, S) {
  const M = (c, o = {}) => typeof c === 'object' ? c : r.mat(c, { roughness: .4, ...o });
  const glow = (c, k = .6) => r.mat(c, { emissive: c, emissiveIntensity: k, roughness: .35 });
  const HL = r.mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: .6, roughness: .25 });
  const add = (gm, c, p, s, rot, parent = g) => {
    const m = new T.Mesh(gm, M(c)); m.position.set(...p); m.scale.set(...(Array.isArray(s) ? s : [s, s, s]));
    if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (c, p, s, rot) => add(SPHERE(), c, p, s, rot);
  const cone = (c, p, s, rot) => add(CONE(), c, p, s, rot);
  const cyl = (c, p, s, rot) => add(CYL(), c, p, s, rot);
  // Cilindro entre dos puntos (tallos, antenas, bigotes, palitos).
  const stick = (c, a, b, radius) => {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), mid = A.clone().add(B).multiplyScalar(.5), len = A.distanceTo(B);
    const m = add(CYL(), c, [mid.x, mid.y, mid.z], [radius, len, radius]);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
  };
  const eyes = [];
  // Ojo de figura: óvalo oscuro brillante con iris de color abajo y dos brillos; 'cat' = ojo de color con pupila rasgada.
  const eyeAt = ({ p, n }, s, iris, { lid = 0, lowLid = 0, lidColor, style, tilt = 0, side = 1, R = .28, brow, mood, lashes } = {}) => {
    if (style === 'anime') {
      // Ojo pintado (calcomanía curva sobre la piel), como en el concepto aprobado de los iniciales.
      // Para parpadear basta aplastarlo en y, igual que los ojos de figura.
      const m = new T.Mesh(eyePatchGeometry(R * 1.012, s * 1.9 / R), creatureEyeMaterial({ iris, brow, mood, side, lashes }));
      m.position.copy(p).addScaledVector(n, -R); m.quaternion.setFromUnitVectors(FWD, n); m.rotateZ(tilt);
      m.userData.keep = true; m.renderOrder = 2; g.add(m); eyes.push(m); return m;
    }
    const e = new T.Group(); e.position.copy(p).addScaledVector(n, -s * (style === 'almond' ? .24 : .14)); e.quaternion.setFromUnitVectors(FWD, n); e.rotateZ(tilt); g.add(e);
    const keep = m => { m.userData.keep = true; return m; };
    if (style === 'cat') {
      keep(add(SPHERE(), glow(iris, .4), [0, 0, 0], [s * 1.1, s * 1.25, s * .42], null, e));
      keep(add(SPHERE_LO(), M('#1a1420', { roughness: .2 }), [0, 0, s * .2], [s * .3, s * 1.0, s * .3], null, e));
    } else if (style === 'round') {
      // Ojo grande de cachorro: borde oscuro, iris de color vivo que llena casi todo y pupila al centro.
      keep(add(SPHERE(), M('#1c1216', { roughness: .2 }), [0, 0, 0], [s * 1.02, s * 1.22, s * .42], null, e));
      keep(add(SPHERE(), M(iris, { roughness: .16, emissive: iris, emissiveIntensity: .16 }), [0, -s * .04, s * .1], [s * .86, s * 1.04, s * .36], null, e));
      keep(add(SPHERE_LO(), M(sh(iris, .32), { roughness: .2 }), [0, -s * .44, s * .2], [s * .56, s * .4, s * .26], null, e));
      keep(add(SPHERE_LO(), M('#120a0e', { roughness: .12 }), [0, s * .02, s * .25], [s * .44, s * .56, s * .24], null, e));
    } else if (style === 'almond') {
      // Mirada adulta: almendra con blanco, iris de color, pupila y delineado (el párpado de piel la recorta).
      keep(add(SPHERE(), M('#1e1216', { roughness: .3 }), [0, s * .04, -s * .04], [s * 1.32, s * .92, s * .4], null, e));
      keep(add(SPHERE(), M('#fbf5ea', { roughness: .22 }), [0, -s * .02, s * .05], [s * 1.18, s * .78, s * .36], null, e));
      keep(add(SPHERE(), M(iris, { roughness: .16, emissive: iris, emissiveIntensity: .2 }), [s * .06, -s * .02, s * .13], [s * .7, s * .72, s * .3], null, e));
      keep(add(SPHERE_LO(), M('#120a0e', { roughness: .12 }), [s * .07, -s * .02, s * .2], [s * .32, s * .44, s * .2], null, e));
    } else if (style === 'led') {
      // Ojo de máquina o de espíritu: óvalo de luz con borde oscuro, sin pupila.
      keep(add(SPHERE(), M('#1c1a26', { roughness: .2 }), [0, 0, -s * .05], [s * 1.18, s * 1.02, s * .4], null, e));
      keep(add(SPHERE(), glow(iris, .95), [0, 0, s * .1], [s * .96, s * .8, s * .36], null, e));
    } else {
      keep(add(SPHERE(), M(sh(iris, -.8), { roughness: .15 }), [0, 0, 0], [s, s * 1.38, s * .44], null, e));
      keep(add(SPHERE_LO(), M(sh(iris, .08), { roughness: .2 }), [0, -s * .46, s * .17], [s * .72, s * .56, s * .32], null, e));
    }
    const almond = style === 'almond';
    keep(add(SPHERE_LO(), HL, almond ? [-s * .2, s * .2, s * .3] : [-s * .3, s * .46, s * .35], almond ? [s * .2, s * .2, s * .1] : [s * .36, s * .44, s * .14], null, e));
    keep(add(SPHERE_LO(), HL, almond ? [s * .3, -s * .2, s * .3] : [s * .32, -s * .4, s * .37], almond ? [s * .08, s * .08, s * .06] : [s * .14, s * .14, s * .08], null, e));
    if (almond) {
      // Párpados delgados de piel que dejan la almendra, con delineado oscuro en el borde de arriba.
      if (lid) {
        const edge = s * (.9 - 2 * lid);
        keep(add(SPHERE(), lidColor, [0, edge + s * .66, s * .02], [s * 1.46, s * .66, s * .42], null, e));
        keep(add(SPHERE_LO(), M('#1e1216', { roughness: .3 }), [0, edge + s * .02, s * .14], [s * 1.36, s * .1, s * .3], null, e));
      }
      if (lowLid) { const edge = -s * (.85 - 2 * lowLid); keep(add(SPHERE(), lidColor, [0, edge - s * .58, 0], [s * 1.42, s * .6, s * .4], null, e)); }
    } else {
      if (lid) keep(add(SPHERE(), lidColor, [0, s * (1.62 - lid * 1.25), s * .1], [s * 1.28, s * .92, s * .55], null, e));
      if (lowLid) keep(add(SPHERE(), lidColor, [0, -s * (1.5 - lowLid * 1.1), s * .08], [s * 1.3, s * .9, s * .5], null, e));
    }
    eyes.push(e); return e;
  };
  // Cara sobre la cabeza (c = punto dentro de la cabeza): ojos, cachetes pintados y boca.
  const anchors = {};
  const face = o => {
    anchors.head = { c: o.c, size: o.size || .075, top: S.surface(o.c, [0, 1, 0]).p };
    const { c, spread = .38, pitch = .05, size = .075, iris = '#3a5a9a', cheek = '#f4a3a8', mouth = 'smile', mouthPitch = -.3, mouthW = .045, lid = 0, lowLid = 0, lidColor = '#888888', style, angry = 0, fangs = false, brow, mood, lashes } = o;
    for (const s of [-1, 1]) { const at = S.surface(c, dirOf(s * spread, pitch)); eyeAt(at, size, iris, { lid, lowLid, lidColor, style, tilt: s * angry, side: s, R: Math.max(.08, at.p.distanceTo(new T.Vector3(...c))), brow, mood, lashes }); }
    if (cheek) for (const s of [-1, 1]) { const h = S.surface(c, dirOf(s * (spread + .34), pitch - .22)); S.paint(E([h.p.x, h.p.y, h.p.z], [size * 1.15, size * .72, size * 1.15]), cheek, size * .7); }
    if (mouth === 'none') return;
    const h = S.surface(c, dirOf(0, mouthPitch)), ink = '#3a2228';
    if (mouth === 'open') {
      const q = h.p.clone().addScaledVector(h.n, -mouthW * .3);
      S.carve(E([q.x, q.y, q.z], [mouthW * 1.15, mouthW * .85, mouthW * .9]), .012);
      S.paint(E([q.x, q.y, q.z], [mouthW * 1.4, mouthW * 1.1, mouthW * 1.25]), '#6e2434', .008);
      S.paint(E([q.x, q.y - mouthW * .55, q.z + mouthW * .2], [mouthW * .8, mouthW * .42, mouthW * .9]), '#f08a9a', .01);
      // Colmillitos de cachorro en las comisuras de arriba.
      if (fangs) for (const s of [-1, 1]) { const f = cone('#fffaf0', [q.x + s * mouthW * .62, q.y + mouthW * .5, q.z + mouthW * .55], [mouthW * .2, mouthW * .42, mouthW * .2]); f.rotation.x = Math.PI; }
      return;
    }
    const arc = (dx, w) => { const m = add(TORUS(Math.PI, .34), ink, [h.p.x + dx, h.p.y + w * .45, h.p.z], [w, w * .8, w]); m.quaternion.setFromUnitVectors(FWD, h.n); m.rotateZ(Math.PI); return m; };
    if (mouth === 'cat') { arc(-mouthW * .62, mouthW * .62); arc(mouthW * .62, mouthW * .62); }
    else arc(0, mouthW);
    if (mouth === 'fang') { const f = cone('#ffffff', [h.p.x + mouthW * .5, h.p.y - mouthW * .25, h.p.z], [mouthW * .32, mouthW * .7, mouthW * .3]); f.quaternion.setFromUnitVectors(FWD, h.n); f.rotateX(-Math.PI / 2); }
  };
  // Llama de tres lenguas brillantes con corazón claro.
  const flame = (x, y, z, s = 1) => {
    cone(glow('#ff8a3a', .75), [x - .1 * s, y + .02 * s, z], [.12 * s, .42 * s, .12 * s], [0, 0, .32]);
    cone(glow('#ff8a3a', .75), [x + .1 * s, y + .02 * s, z], [.12 * s, .42 * s, .12 * s], [0, 0, -.32]);
    cone(glow('#ffc04a', .8), [x, y + .12 * s, z], [.16 * s, .62 * s, .16 * s]);
    ball(glow('#fff1b0', .85), [x, y - .02 * s, z + .02], [.1 * s, .14 * s, .1 * s]);
  };
  const antennae = (c, tip, x, y, z, len = .32, lean = .25, back = 0) => {
    for (const s of [-1, 1]) { const a = s * lean, top = [s * x + Math.sin(a) * len, y + Math.cos(a) * len, z - back]; stick(c, [s * x, y, z], top, .018); ball(tip, top, .06); }
  };
  const claws = (x, y, z, s = 1, color = '#fff6e6') => { for (let i = -1; i <= 1; i++) cone(color, [x + i * .055 * s, y, z], [.026 * s, .085 * s, .026 * s], [Math.PI / 2.4, 0, 0]); };
  const ember = (x, y, z, rz, len = .12) => ball(glow('#ff9a4a', .9), [x, y, z], [.026, len, .026], [0, 0, rz]);
  const gem = (p, color, s = .07) => ball(glow(color, .7), p, [s, s, s * .5]);
  // Pieza orientada de a (base) a b (punta): cuernos, púas, garras largas.
  const along = (gm, c, a, b, rx, rz = rx, centered = true) => {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), len = A.distanceTo(B);
    const at = centered ? A.clone().add(B).multiplyScalar(.5) : A;
    const m = add(gm, c, [at.x, at.y, at.z], [rx, centered ? len / (gm === OCTA() ? 2 : 1) : len, rz]);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
  };
  const spike = (c, a, b, r) => along(CONE(), c, a, b, r);
  // Cristal translúcido que brilla (hielo, gemas, cuarzo).
  const ice = (c, k = .4, opacity = .9) => r.mat(c, { emissive: c, emissiveIntensity: k, roughness: .14, metalness: .08, transparent: opacity < 1, opacity });
  const crystal = (c, a, b, rad, mat) => along(OCTA(), mat || ice(c), a, b, rad, rad * .8);
  const prism = (c, a, b, rad, mat) => along(PRISM(), mat || ice(c), a, b, rad, rad, false);
  // Hoja plana (crestas, colas, alas de hoja) entre dos puntos, con su nervio.
  const leaf = (c, a, b, w, roll = 0, rib = true) => {
    const m = along(SPHERE(), c, a, b, w, w * .16); m.scale.y *= .5; m.rotateY(roll);
    if (rib) { const n = along(SPHERE_LO(), sh(typeof c === 'string' ? c : '#5aa040', .28), a, b, w * .07, w * .2); n.scale.y *= .48; n.rotateY(roll); }
    return m;
  };
  // Grieta de lava o línea de energía pegada a la superficie del cuerpo esculpido.
  const vein = (rot, from, dir, len, w = .03, color = '#ff8a2a', k = .9) => {
    const h = S.surface(from, dir), m = add(SPHERE_LO(), glow(color, k), [h.p.x, h.p.y, h.p.z], [w, len, w * .45]);
    m.quaternion.setFromUnitVectors(FWD, h.n); m.rotateZ(rot); m.position.addScaledVector(h.n, -w * .1); return m;
  };
  // Ala de plumas: abanico de plumas planas desde el hombro (side = -1 izquierda, 1 derecha).
  const wing = ({ side, at, len = .9, width = .13, n = 6, spread = 1.1, lift = .35, sweep = .45, tilt = .1, colors = ['#8e5e3e'], tips, covert }) => {
    const w = new T.Group(); w.position.set(...at); w.rotation.set(tilt, side * sweep, 0); g.add(w);
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0, a = lift - t * spread, L = len * (1 - t * .35), c = colors[i % colors.length];
      const f = add(SPHERE(), c, [side * Math.cos(a) * L * .5, Math.sin(a) * L * .5, -t * .04], [L * .5, width, .035], [0, 0, side * a], w);
      if (tips) add(SPHERE_LO(), tips, [side * Math.cos(a) * L * .86, Math.sin(a) * L * .86, -t * .04 + .006], [L * .16, width * .82, .03], [0, 0, side * a], w);
      f.userData.feather = true;
    }
    if (covert) add(SPHERE(), covert, [side * len * .22, lift * len * .1, .03], [len * .3, len * .2, .05], [0, 0, side * .2], w);
    return w;
  };
  // Anillo (órbitas, halos, cinturones) con centro, radio y giro.
  const ring = (c, p, R, rot = [Math.PI / 2, 0, 0], tube = .04) => add(RING(tube), c, p, [R, R, R], rot);

  // ---------- Acabado HD (láminas, fuego vivo, pelaje y marcas) ----------
  // Animaciones propias del modelo (llamas que titilan, hojas que flotan): fn(t, dt) en cada cuadro.
  const anims = [];
  const anim = fn => { anims.push(fn); return fn; };
  // Orienta una pieza: su eje +y va de a hacia b y su cara +z mira hacia face. Devuelve el largo.
  const orient = (m, a, b, face = [0, 0, 1]) => {
    const A = new T.Vector3(...a), Y = new T.Vector3(...b).sub(A), len = Y.length() || 1e-3; Y.normalize();
    const Z = new T.Vector3(...face); Z.addScaledVector(Y, -Z.dot(Y));
    if (Z.lengthSq() < 1e-6) Z.set(1, 0, 0).addScaledVector(Y, -Y.x);
    Z.normalize();
    m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().crossVectors(Y, Z), Y, Z)); m.position.copy(A); return len;
  };
  // Lámina con grosor (oreja de hoja, hoja, aleta, pétalo) de a a b, de ancho w, con la cara hacia face.
  const blade = (kind, c, a, b, w, face, { curl = 0, cup = 0, thick = 1, keep = false } = {}) => {
    const m = add(bladeGeo(kind, curl, cup), c, [0, 0, 0], 1);
    const len = orient(m, a, b, face); m.scale.set(w, len, len * thick);
    if (keep || (typeof c === 'object' && c.transparent)) m.userData.keep = true;
    return m;
  };
  // Aleta translúcida de agua (brilla un poco y deja ver el fondo).
  const finMat = (c, k = .3, opacity = .82) => r.mat(c, { emissive: c, emissiveIntensity: k, roughness: .18, transparent: true, opacity, side: T.DoubleSide, depthWrite: true });
  const tongueGeo = (bend, pal) => geo('ft' + bend.toFixed(2) + pal, () => {
    const g = flameGeo(bend).clone(), p = g.attributes.position, [c0, k0, c1, k1] = FIRE[pal], A = new T.Color(c0), B = new T.Color(c1), col = new Float32Array(p.count * 3), tmp = new T.Color();
    for (let i = 0; i < p.count; i++) { const h = Math.min(1, Math.max(0, p.getY(i))); tmp.copy(A).multiplyScalar(k0).lerp(B.clone().multiplyScalar(k1), Math.pow(h, .8)); tmp.toArray(col, i * 3); }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
  });
  // Una lengua de fuego de a (base) a b (punta), ancho w; titila sola.
  const tongue = (a, b, w, { pal = 'mid', bend = .3, face = [0, 0, 1], speed = 1 } = {}) => {
    const m = new T.Mesh(tongueGeo(bend, pal), fireMat()); m.userData.keep = true; g.add(m);
    const len = orient(m, a, b, face); m.scale.set(w, len, w);
    const ph = Math.random() * 6.3, sy = len, q0 = m.quaternion.clone();
    anim(t => { const k = 1 + Math.sin(t * 9 * speed + ph) * .1 + Math.sin(t * 15.7 * speed + ph * 2) * .05; m.scale.y = sy * k; m.scale.x = m.scale.z = w * (1.04 - (k - 1) * .5); m.quaternion.copy(q0); m.rotateZ(Math.sin(t * 5.3 * speed + ph) * .07); });
    return m;
  };
  // Penacho de fuego (punta de cola, copete): lenguas rojizas alrededor del eje que se tuercen como un
  // remolino, una lengua media naranja y un núcleo claro.
  const plume = (base, dir, size, { face = [0, 0, 1], spread = .5, n = 3, tint = 'out' } = {}) => {
    const B = new T.Vector3(...base), Dv = new T.Vector3(...dir).normalize(), F = new T.Vector3(...face).normalize();
    const side = new T.Vector3().crossVectors(Dv, F); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const F2 = new T.Vector3().crossVectors(side, Dv).normalize();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + .5, off = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(F2, Math.sin(a) * .75);
      const len = size * (.7 + ((i * 3) % Math.max(1, n)) / Math.max(1, n) * .3);
      tongue(B.clone().addScaledVector(off, size * .1).toArray(), B.clone().addScaledVector(Dv, len).addScaledVector(off, size * spread * .45).toArray(), size * .34, { pal: tint, bend: .38, face: off.toArray() });
    }
    tongue(base, B.clone().addScaledVector(Dv, size * .95).toArray(), size * .36, { pal: 'mid', bend: .25, face });
    tongue(B.clone().addScaledVector(Dv, -size * .05).toArray(), B.clone().addScaledVector(Dv, size * .58).toArray(), size * .24, { pal: 'core', bend: .1, face, speed: 1.3 });
  };
  // Mechón de pelo fundido al cuerpo: cono de a (base) a b (punta).
  const tuft = (a, b, rad, c, k = .03) => S.limb(a, b, rad, rad * .12, c, { k, kc: .02 });
  // Punto de la piel saliendo desde c (dentro del cuerpo) hacia (yaw, pitch); out lo despega.
  const skin = (c, yaw, pitch, out = 0) => { const h = S.surface(c, dirOf(yaw, pitch)); return [h.p.x + h.n.x * out, h.p.y + h.n.y * out, h.p.z + h.n.z * out]; };
  // Marca en remolino pintada sobre la piel, centrada en el punto (yaw, pitch) visto desde c.
  const swirl = (c, yaw, pitch, R, color, { w = .022, turns = 1.1, start = 0, flip = 1, n = 22, tail = 0 } = {}) => {
    const h = S.surface(c, dirOf(yaw, pitch)), N0 = h.n, up = Math.abs(N0.y) > .9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
    const u = new T.Vector3().crossVectors(up, N0).normalize(), v = new T.Vector3().crossVectors(N0, u), C0 = new T.Vector3(...c);
    const dot = (q, wi) => { const s = S.surface(c, q.clone().sub(C0).toArray()); S.paint(E(s.p.toArray(), wi), color, wi * .55); };
    for (let i = 0; i <= n; i++) { const t = i / n, a = start + flip * t * turns * Math.PI * 2, rr = R * (1 - .8 * t); dot(h.p.clone().addScaledVector(u, Math.cos(a) * rr).addScaledVector(v, Math.sin(a) * rr), w * (1 - .4 * t)); }
    // Cola del remolino: sale desde el borde exterior y se afina.
    for (let i = 1; i <= tail; i++) { const t = i / tail, a = start - flip * t * .9; dot(h.p.clone().addScaledVector(u, Math.cos(a) * R * (1 + t * .9)).addScaledVector(v, Math.sin(a) * R * (1 + t * .9) - t * R * .3), w * (1 - .7 * t)); }
  };
  // Franja pintada sobre la piel entre dos direcciones (rayas de tigre, calcetines, máscaras).
  const stripe = (c, from, to, w0, w1, color, n = 14) => {
    for (let i = 0; i <= n; i++) { const t = i / n, p = skin(c, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t), wi = w0 + (w1 - w0) * t; S.paint(E(p, wi), color, wi * .5); }
  };
  // Arco de anillo (agua que gira, estelas): radio R, largo del arco en radianes y grosor relativo.
  const arc = (c, p, R, len, tube, rot) => add(TORUS(len, tube), c, p, [R, R, R], rot);
  return { M, glow, ball, cone, cyl, stick, eyeAt, face, flame, antennae, claws, ember, gem, eyes, add, root: g, anchors, spike, ice, crystal, prism, leaf, vein, wing, ring, sh, S,
    anims, anim, orient, blade, finMat, tongue, plume, tuft, skin, swirl, stripe, arc };
}

// ---------- Especies ----------
// S = cuerpo esculpido (una pieza), D = detalles. Cada especie mira hacia +z y pisa y = 0.
// Las líneas iniciales viven en iniciales.js (acabado HD de la lámina) y el bestiario de la Bruma en bestiary.js.
const BUILD = {
  pipiu(S, D) {
    S.ball([0, .5, 0], [.44, .42, .4], '#c98c5a', { k: 0 });
    S.ball([0, .9, .06], [.33, .31, .31], '#c98c5a', { k: .2 });
    S.paint(E([0, .86, .32], [.24, .2, .2]), '#f8e6c6', .05); S.paint(E([0, .44, .28], [.3, .3, .22]), '#f8e6c6', .06);
    S.pair(s => { S.ball([s * .42, .56, -.04], [.12, .28, .24], '#9a6a46', { k: .04, kc: .02, rot: [.2, 0, s * .35] }); S.paint(E([s * .5, .34, 0], [.12, .12, .2]), '#5fc4c0', .04); });
    S.ball([0, .4, -.42], [.16, .06, .22], '#9a6a46', { k: .04, kc: .02, rot: [.6, 0, 0] });
    S.pair(s => S.limb([s * .04, 1.16, .02], [s * .09, 1.32, -.05], .05, .015, '#9a6a46', { k: .03 }));
    S.limb([0, .86, .34], [0, .84, .47], .065, .012, '#eab24a', { k: .02, kc: .01 });
    S.pair(s => { D.stick('#e0a04a', [s * .14, .12, .06], [s * .15, .02, .1], .025); D.ball('#e0a04a', [s * .15, .02, .14], [.06, .025, .07]); });
    D.face({ c: [0, .9, .06], spread: .46, pitch: .08, size: .068, iris: '#4a2e1e', mouth: 'none' });
  },
  pipiolo(S, D) {
    S.ball([0, .66, 0], [.4, .5, .36], '#c27f52', { k: 0 });
    S.ball([0, 1.2, .06], [.32, .3, .3], '#c27f52', { k: .16 });
    S.paint(E([0, 1.15, .3], [.23, .19, .2]), '#f6e2c2', .05); S.paint(E([0, .58, .26], [.27, .38, .22]), '#f6e2c2', .06);
    S.pair(s => {
      S.ball([s * .62, 1.0, -.04], [.46, .12, .22], '#8e5e3e', { k: .06, kc: .02, rot: [0, 0, s * .42] });
      S.paint(E([s * 1.0, .76, 0], [.18, .16, .26]), '#4fb0aa', .05);
      S.ball([s * .46, .82, -.06], [.3, .1, .18], '#a8744c', { k: .05, kc: .02, rot: [0, 0, s * .62] });
    });
    for (const i of [-1, 0, 1]) S.limb([i * .06, 1.44, -.02], [i * .12, 1.68 - Math.abs(i) * .05, -.1], .05, .015, '#3fa49e', { k: .03, kc: .02 });
    for (const i of [-1, 0, 1]) S.limb([i * .08, .5, -.3], [i * .2, .34, -.62], .07, .02, '#8e5e3e', { k: .04 });
    S.limb([0, 1.16, .34], [0, 1.13, .48], .065, .012, '#eab24a', { k: .02, kc: .01 });
    S.pair(s => { D.stick('#e0a04a', [s * .14, .2, .04], [s * .15, .02, .1], .028); D.ball('#e0a04a', [s * .15, .02, .14], [.07, .025, .08]); });
    D.face({ c: [0, 1.2, .06], spread: .45, pitch: .08, size: .066, iris: '#3a2010', lid: .22, lidColor: '#c27f52', mouth: 'none' });
  },
  roedin(S, D) {
    S.ball([0, .52, 0], [.5, .48, .44], '#e3b98a', { k: 0 });
    S.pair(s => S.ball([s * .27, .5, .3], [.19, .17, .16], '#ecc89c', { k: .1 }));
    S.paint(E([0, .44, .3], [.34, .3, .26]), '#fdeed6', .05);
    S.pair(s => {
      S.ball([s * .3, .92, -.02], [.15, .16, .08], '#d4a272', { k: .04 });
      S.paint(E([s * .3, .92, .05], [.1, .11, .05]), '#f2b4ac', .03);
      S.ball([s * .15, .36, .4], .07, '#f6dcc0', { k: .03 });
      S.ball([s * .24, .06, .12], [.12, .06, .15], '#d4a272', { k: .04 });
    });
    S.ball([0, .55, .45], [.05, .035, .03], '#e88a96', { k: .01, kc: .01 });
    S.ball([0, .24, -.44], .06, '#d4a272', { k: .04 });
    D.ball('#8a6a3a', [0, .37, .5], [.07, .09, .05]);
    D.add(SPHERE_LO(), '#ffffff', [0, .46, .46], [.045, .055, .02]);
    D.face({ c: [0, .62, .1], spread: .36, pitch: .14, size: .078, iris: '#4a2e1a', cheek: '#f5a6a6', mouth: 'none' });
  },
  roedon(S, D) {
    S.ball([0, .66, 0], [.56, .6, .48], '#a97a4e', { k: 0 });
    S.ball([0, 1.08, .12], [.4, .36, .36], '#a97a4e', { k: .18 });
    S.ball([0, .98, .42], [.22, .15, .14], '#ecd4ae', { k: .06, kc: .02 });
    S.ball([0, 1.04, .55], [.07, .05, .04], '#4a3228', { k: .01, kc: .01 });
    S.paint(E([0, .56, .32], [.38, .4, .22]), '#ecd4ae', .06);
    S.pair(s => {
      S.ball([s * .32, 1.38, .02], [.1, .1, .06], '#8e6440', { k: .03 }); S.paint(E([s * .32, 1.38, .06], [.06, .06, .04]), '#c99a7a', .02);
      S.limb([s * .42, .78, .18], [s * .32, .62, .38], .1, .08, '#a97a4e', { k: .06 });
      S.ball([s * .3, .07, .16], [.15, .07, .2], '#6e5038', { k: .04, kc: .02 });
    });
    S.ball([0, .14, -.66], [.28, .06, .42], '#6e5038', { k: .05, kc: .02, rot: [-.15, 0, 0] });
    for (let i = 0; i < 4; i++) S.paint(C([-.26, .16, -.42 - i * .14], [.26, .16, -.42 - i * .14], .012, .012), '#563c2a', .01);
    S.paint(C([0, .17, -.3], [0, .12, -1.0], .012, .012), '#563c2a', .01);
    D.stick('#7a5232', [-.4, .58, .46], [.42, .64, .4], .035); D.ball('#5fae4e', [.46, .7, .4], [.07, .04, .05]);
    S.pair(s => D.add(SPHERE_LO(), '#ffffff', [s * .036, .9, .53], [.033, .06, .02]));
    D.face({ c: [0, 1.08, .12], spread: .38, pitch: .22, size: .072, iris: '#3a2416', mouth: 'none' });
  },
  capullin(S, D) {
    S.ball([0, .56, .2], [.36, .34, .32], '#a8dc72', { k: 0 });
    S.ball([0, .3, -.16], [.28, .27, .27], '#8cc85a', { k: .06, kc: .025 });
    S.ball([0, .26, -.46], [.24, .23, .23], '#a2d66c', { k: .06, kc: .025 });
    S.ball([0, .26, -.72], [.18, .18, .18], '#8cc85a', { k: .06, kc: .025 });
    S.limb([0, .28, -.84], [0, .38, -.98], .07, .02, '#8cc85a', { k: .04 });
    S.paint(E([0, .12, -.3], [.24, .14, .62]), '#e4f4bc', .06);
    for (const [y, z] of [[.56, -.18], [.5, -.46], [.44, -.72]]) S.paint(E([0, y, z], [.08, .05, .08]), '#f2e070', .02);
    for (const z of [-.16, -.46, -.72]) S.pair(s => S.ball([s * .16, .05, z], [.06, .05, .07], '#6a9a48', { k: .03 }));
    D.antennae('#5a7a40', '#ee584a', .13, .84, .14, .3, .3);
    D.face({ c: [0, .56, .2], spread: .38, pitch: .02, size: .076, iris: '#2a4a2a', mouth: 'open', mouthPitch: -.32 });
  },
  capullado(S, D) {
    S.ball([0, .8, 0], [.36, .72, .34], '#a9be82', { k: 0 });
    for (let i = 0; i < 7; i++) { const y = .24 + i * .18, R = .36 * Math.sqrt(Math.max(.04, 1 - ((y - .8) / .72) ** 2)); S.ring([0, y, 0], R, .035, '#94aa6a', { k: .03, kc: .02 }); }
    S.paint(E([0, .95, .28], [.24, .2, .15]), '#c9d9a6', .05);
    D.stick('#f2f0e2', [0, 1.5, 0], [0, 1.9, 0], .012);
    D.face({ c: [0, .95, .05], spread: .36, pitch: .02, size: .062, iris: '#3a4a2a', lid: .55, lidColor: '#c9d9a6', cheek: '#e8b0a0', mouth: 'smile', mouthPitch: -.28, mouthW: .035 });
  },
  alasol(S, D) {
    S.ball([0, .66, -.06], [.14, .32, .14], '#6e5040', { k: 0 });
    S.ball([0, .98, 0], [.17, .16, .16], '#6e5040', { k: .06 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; S.ball([Math.cos(a) * .15, 1.1, Math.sin(a) * .15], .07, '#f6d878', { k: .05, kc: .02 }); }
    S.ball([0, 1.26, .04], [.2, .19, .19], '#6e5040', { k: .08 });
    for (const s of [-1, 1]) {
      D.ball('#f2cf55', [s * .48, 1.13, -.06], [.42, .34, .05], [0, 0, s * .25]); D.ball('#fff3c0', [s * .52, 1.18, -.01], [.18, .16, .02]); D.ball('#e8a03a', [s * .48, 1.13, -.09], [.4, .32, .02], [0, 0, s * .25]);
      D.ball('#f0a640', [s * .38, .66, -.06], [.28, .25, .05], [0, 0, -s * .2]); D.ball('#7a4a2a', [s * .4, .64, -.01], [.09, .09, .02]); D.ball('#fff3c0', [s * .4, .64, .005], [.035, .035, .01]);
    }
    D.antennae('#6e5040', '#f2cf55', .06, 1.4, .02, .26, .35);
    D.face({ c: [0, 1.26, .04], spread: .5, pitch: .05, size: .062, iris: '#d8423a', cheek: '#f0a080', mouth: 'smile', mouthPitch: -.32, mouthW: .03 });
  },
  setin(S, D) {
    S.ball([0, .4, 0], [.3, .36, .28], '#f6e6ca', { k: 0 });
    S.ball([0, .86, 0], [.62, .36, .56], '#e8743e', { k: .04, kc: .02 });
    S.paint(E([0, .72, 0], [.6, .16, .54]), '#f6dcbc', .03);
    for (const [az, el] of [[1.5, .35], [.4, .9], [2.6, .95], [1.6, 1.12], [4.2, .8], [5.3, 1.0], [3.4, .5], [.9, 1.3], [2.2, 1.3]]) {
      const x = Math.cos(az) * Math.sin(el) * .62, y = .86 + Math.cos(el) * .36, z = Math.sin(az) * Math.sin(el) * .56;
      S.paint(E([x, y, z], [.085, .085, .085]), '#fff6e6', .025);
    }
    S.pair(s => { S.limb([s * .26, .42, .06], [s * .36, .34, .12], .06, .05, '#f6e6ca', { k: .04 }); S.ball([s * .15, .06, .08], [.11, .06, .14], '#dcc4a0', { k: .04 }); });
    D.face({ c: [0, .42, 0], spread: .42, pitch: .06, size: .064, iris: '#5a3a2a', mouth: 'open', mouthPitch: -.3, mouthW: .04 });
  },
  seton(S, D) {
    S.ball([0, .5, 0], [.38, .46, .34], '#f2e0bf', { k: 0 });
    S.ball([0, 1.12, 0], [.84, .46, .76], '#c45e3a', { k: .04, kc: .02 });
    S.paint(E([0, .94, 0], [.82, .2, .74]), '#f2dcbc', .03);
    for (const [az, el] of [[1.5, .3], [.3, .85], [2.8, .9], [1.6, 1.1], [4.2, .75], [5.2, 1.0], [3.5, .45], [.9, 1.3], [2.3, 1.3], [0, .5]]) {
      const x = Math.cos(az) * Math.sin(el) * .84, y = 1.12 + Math.cos(el) * .46, z = Math.sin(az) * Math.sin(el) * .76;
      S.paint(E([x, y, z], [.11, .11, .11]), '#fff6e6', .03);
    }
    S.pair(s => { S.limb([s * .34, .6, .06], [s * .56, .48, .14], .09, .07, '#ead6b2', { k: .06 }); S.ball([s * .58, .46, .16], .08, '#ead6b2', { k: .03 }); S.ball([s * .2, .07, .1], [.14, .07, .17], '#d2bc96', { k: .04 }); });
    D.ball('#7ab85a', [.66, .52, .2], [.17, .05, .09], [0, .4, .3]); D.stick('#5a8a3a', [.58, .46, .16], [.7, .5, .2], .015);
    D.face({ c: [0, .56, 0], spread: .4, pitch: .08, size: .068, iris: '#4a3022', lid: .2, lidColor: '#f2e0bf', mouth: 'smile', mouthPitch: -.3 });
  },
  chispaz(S, D) {
    S.ball([0, .6, 0], [.44, .42, .4], '#f6d250', { k: 0 });
    for (let i = 0; i < 15; i++) { const a = i / 15 * Math.PI * 2; if (Math.sin(a) < -.6) continue; const ca = Math.cos(a), sa = Math.sin(a); S.limb([ca * .34, .6 + sa * .32, -.06], [ca * .6, .6 + sa * .58, -.1], .1, .02, '#f6d250', { k: .06 }); }
    for (const [x, y] of [[-.18, .82], [.2, .84], [0, .5]]) S.limb([x, y, -.2], [x * 1.3, y + .06, -.5], .1, .02, '#f6d250', { k: .06 });
    S.paint(E([0, .56, .3], [.3, .26, .22]), '#fde9a2', .05);
    S.pair(s => { S.ball([s * .2, .08, .08], [.13, .08, .15], '#e8bb38', { k: .05 }); S.ball([s * .42, .46, .12], [.08, .07, .08], '#f6d250', { k: .05 }); });
    D.antennae('#4a5866', D.glow('#7cc8f0', .65), .14, 1.0, 0, .3, .22);
    for (const [x, y, rz] of [[.5, .5, .7], [.62, .62, -.5], [.72, .76, .7]]) D.ball('#4a7ec0', [x, y, -.24], [.06, .1, .05], [0, 0, rz]);
    D.face({ c: [0, .6, 0], spread: .38, pitch: .08, size: .082, iris: '#4a3a1a', cheek: '#f37a50', mouth: 'open', mouthPitch: -.3 });
  },
  voltaz(S, D) {
    S.ball([0, .56, -.06], [.38, .4, .42], '#f4d24c', { k: 0 });
    S.ball([0, .98, .12], [.36, .34, .32], '#f4d24c', { k: .14 });
    S.ball([0, 1.02, -.04], [.5, .48, .28], '#3f6fc8', { k: .06, kc: .02 });
    for (let a = -.35; a <= Math.PI + .35; a += .3) S.limb([Math.cos(a) * .38, 1.02 + Math.sin(a) * .36, -.06], [Math.cos(a) * .68, 1.02 + Math.sin(a) * .64, -.12], .11, .02, '#3f6fc8', { k: .05 });
    S.paint(E([0, .94, .36], [.26, .24, .2]), '#fbe6a0', .05);
    S.pair(s => { for (const z of [.12, -.3]) { S.limb([s * .24, .34, z], [s * .26, .1, z + .04], .1, .09, '#f4d24c', { k: .06 }); S.ball([s * .26, .06, z + .08], [.11, .06, .13], '#e0a830', { k: .04, kc: .02 }); } });
    for (const [x, y, rz] of [[-.4, .5, .7], [-.52, .62, -.5], [-.62, .76, .7]]) D.ball('#3f6fc8', [x, y, -.4], [.06, .11, .05], [0, 0, rz]);
    D.face({ c: [0, .98, .12], spread: .36, pitch: .08, size: .076, iris: '#3a2a10', lid: .2, lidColor: '#f4d24c', angry: .1, cheek: '#f37a50', mouth: 'smile', mouthPitch: -.32 });
  },
  guijarrin(S, D) {
    S.ball([0, .48, 0], [.54, .46, .48], '#aab0b4', { k: 0 });
    S.ball([-.28, .74, -.06], [.24, .2, .22], '#b6bcc0', { k: .08 }); S.ball([.3, .3, .2], [.2, .16, .18], '#9ea4a8', { k: .08 });
    S.pair(s => { S.limb([s * .46, .48, .06], [s * .62, .38, .12], .1, .09, '#9ea4a8', { k: .06 }); S.ball([s * .64, .36, .14], [.12, .11, .12], '#9ea4a8', { k: .04 }); S.ball([s * .24, .06, .14], [.14, .07, .16], '#8e9498', { k: .04 }); });
    S.ball([-.08, .96, .04], [.14, .08, .12], '#c4c9cc', { k: .03 });
    S.paint(C([-.36, .66, .3], [-.18, .58, .42], .012, .012), '#7a8085', .01); S.paint(C([.22, .26, .44], [.36, .34, .36], .012, .012), '#7a8085', .01);
    D.face({ c: [0, .5, .05], spread: .38, pitch: .06, size: .072, iris: '#3a3a44', lid: .35, lidColor: '#aab0b4', angry: .12, cheek: '#d6a8a8', mouth: 'smile', mouthPitch: -.3 });
  },
  penon(S, D) {
    S.ball([0, .66, 0], [.72, .6, .6], '#8f969b', { k: 0 });
    S.ball([-.42, .92, -.12], [.32, .28, .3], '#9aa1a6', { k: .1 }); S.ball([.4, .98, -.2], [.28, .24, .26], '#9aa1a6', { k: .1 });
    S.ball([0, 1.14, -.06], [.52, .14, .4], '#7ab063', { k: .06, kc: .02 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; S.ball([Math.cos(a) * .48, 1.08, -.06 + Math.sin(a) * .36], .09, '#6aa055', { k: .04, kc: .02 }); }
    S.pair(s => { S.limb([s * .62, .7, .1], [s * .86, .46, .2], .18, .15, '#80878c', { k: .08 }); S.ball([s * .88, .4, .24], [.2, .18, .2], '#80878c', { k: .05 }); S.ball([s * .34, .12, .22], [.22, .13, .26], '#80878c', { k: .06 }); });
    S.paint(C([-.3, .5, .55], [-.12, .4, .6], .014, .014), '#6c7378', .01); S.paint(C([.3, .86, .5], [.46, .78, .42], .014, .014), '#6c7378', .01);
    for (const [x, y, z, rz] of [[.56, 1.12, -.2, -.3], [.66, 1.0, -.1, -.6]]) D.cone(D.glow('#9ee0f0', .45), [x, y, z], [.07, .26, .07], [0, 0, rz]);
    D.face({ c: [0, .7, .1], spread: .34, pitch: .02, size: .072, iris: '#2a2a32', lid: .4, lidColor: '#8f969b', angry: .08, cheek: false, mouth: 'smile', mouthPitch: -.26 });
  },
  medusin(S, D) {
    S.ball([0, 1.0, 0], [.52, .42, .48], '#80cdea', { k: 0 });
    S.carve(E([0, .7, 0], [.5, .26, .46]), .06);
    S.ring([0, .84, 0], .46, .06, '#62b2d6', { k: .04, kc: .02 });
    S.paint(E([-.16, 1.26, .16], [.16, .1, .14]), '#d4f2fb', .06);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + .3, x = Math.cos(a) * .28, z = Math.sin(a) * .26, dx = Math.cos(a + 1.2) * .06, dz = Math.sin(a + 1.2) * .06;
      S.limb([x, .86, z], [x + dx, .56, z + dz], .06, .045, '#a2dcef', { k: .04 }); S.limb([x + dx, .56, z + dz], [x - dx * .5, .28, z - dz * .5], .045, .022, '#a2dcef', { k: .03 });
    }
    D.face({ c: [0, 1.0, 0], spread: .38, pitch: -.1, size: .076, iris: '#2a5a8a', mouth: 'open', mouthPitch: -.38 });
  },
  meduson(S, D) {
    S.ball([0, 1.18, 0], [.64, .5, .6], '#7ac4e4', { k: 0 });
    S.carve(E([0, .82, 0], [.62, .3, .58]), .06);
    S.ring([0, 1.0, 0], .58, .07, '#5aa2c8', { k: .04, kc: .02 });
    S.paint(E([-.2, 1.5, .2], [.2, .11, .15]), '#d4f2fb', .06);
    for (let i = -2; i <= 2; i++) S.ball([i * .19, 1.62 - Math.abs(i) * .07, -.04], [.08, .11, .08], '#c2a8e4', { k: .04, kc: .02 });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, x = Math.cos(a) * .36, z = Math.sin(a) * .32, dx = Math.cos(a + 1.2) * .07, dz = Math.sin(a + 1.2) * .07, c = i % 2 ? '#bba6e0' : '#a2dcef';
      S.limb([x, 1.0, z], [x + dx, .7, z + dz], .065, .05, c, { k: .04 }); S.limb([x + dx, .7, z + dz], [x - dx * .5, .42, z - dz * .5], .05, .035, c, { k: .03 }); S.limb([x - dx * .5, .42, z - dz * .5], [x + dx * .4, .2, z + dz * .4], .035, .018, c, { k: .02 });
    }
    D.gem([0, 1.18, .62], '#f08cc0', .09);
    D.face({ c: [0, 1.18, 0], spread: .42, pitch: -.06, size: .08, iris: '#2a4a8a', lid: .14, lidColor: '#7ac4e4', mouth: 'smile', mouthPitch: -.36 });
  },
  sombrin(S, D) {
    S.ball([0, .44, -.02], [.38, .36, .34], '#5e4c78', { k: 0 });
    S.paint(E([0, .4, .24], [.24, .24, .2]), '#7f6c98', .05);
    S.ball([0, .92, .06], [.38, .34, .33], '#5e4c78', { k: .12 });
    S.pair(s => {
      S.limb([s * .2, 1.14, .02], [s * .3, 1.42, -.02], .13, .025, '#5e4c78', { k: .05 });
      S.paint(C([s * .2, 1.16, .08], [s * .28, 1.36, .04], .07, .015), '#a888c8', .02);
      S.ball([s * .16, .08, .22], [.1, .07, .13], '#6e5c88', { k: .04 }); S.ball([s * .26, .07, -.04], [.12, .07, .15], '#6e5c88', { k: .04 });
    });
    S.limb([.26, .3, -.28], [.44, .5, -.38], .07, .06, '#5e4c78', { k: .04 }); S.limb([.44, .5, -.38], [.46, .78, -.34], .06, .05, '#5e4c78', { k: .04 }); S.limb([.46, .78, -.34], [.36, .92, -.28], .05, .04, '#5e4c78', { k: .04 });
    S.paint(E([.36, .92, -.28], .06), '#a888c8', .03);
    D.face({ c: [0, .92, .06], spread: .4, pitch: .08, size: .082, iris: '#f6d24a', style: 'cat', lid: .2, lidColor: '#5e4c78', angry: .06, cheek: '#a07ab8', mouth: 'cat', mouthPitch: -.3, mouthW: .035 });
  },
  sombrador(S, D) {
    S.ball([0, .72, 0], [.5, .62, .42], '#46385a', { k: 0 });
    S.paint(E([0, .64, .28], [.32, .44, .22]), '#5e4e76', .06);
    S.ball([0, 1.4, .06], [.42, .37, .36], '#46385a', { k: .12 });
    S.pair(s => {
      S.limb([s * .24, 1.66, .02], [s * .4, 2.02, -.06], .15, .025, '#46385a', { k: .05 });
      S.paint(C([s * .24, 1.68, .08], [s * .36, 1.94, 0], .08, .015), '#8a5ab0', .02);
      S.limb([s * .42, 1.1, -.06], [s * .66, 1.3, -.2], .12, .02, '#46385a', { k: .06 });
      S.limb([s * .42, 1.0, .06], [s * .6, .7, .22], .12, .1, '#46385a', { k: .08 }); D.claws(s * .62, .62, .34, 1, '#ece6f2');
      S.limb([s * .24, .3, 0], [s * .28, .1, .06], .15, .13, '#46385a', { k: .06 }); S.ball([s * .28, .07, .12], [.15, .07, .18], '#3a2c4c', { k: .04 });
    });
    for (let i = 0; i < 4; i++) S.limb([.3 + i * .08, .42 + i * .2, -.36 - (i % 2) * .04], [.38 + i * .08, .62 + i * .2, -.36], .08 - i * .012, .07 - i * .012, '#46385a', { k: .04 });
    S.limb([.62, 1.22, -.36], [.66, 1.42, -.36], .06, .01, '#8a5ab0', { k: .02, kc: .02 });
    D.face({ c: [0, 1.4, .06], spread: .4, pitch: .08, size: .078, iris: '#f05a5a', style: 'cat', lid: .3, lidColor: '#46385a', angry: .28, cheek: false, mouth: 'fang', mouthPitch: -.34, mouthW: .05 });
  },
  mentelin(S, D) {
    S.ball([0, .9, 0], [.28, .34, .26], '#c9aee2', { k: 0 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; S.ball([Math.cos(a) * .22, 1.08, Math.sin(a) * .2], .09, '#efe4f8', { k: .05, kc: .02 }); }
    S.ball([0, 1.26, .04], [.24, .22, .22], '#c9aee2', { k: .08 });
    S.pair(s => { S.limb([s * .1, .62, .04], [s * .12, .46, .06], .04, .03, '#a888c8', { k: .03 }); S.limb([s * .08, .66, -.06], [s * .1, .5, -.06], .035, .025, '#a888c8', { k: .03 }); });
    for (const s of [-1, 1]) {
      D.ball('#ece0f6', [s * .5, 1.06, -.08], [.38, .32, .05], [0, 0, s * .2]); D.ball('#b48ad0', [s * .54, 1.1, -.03], [.14, .12, .02]); D.ball('#d8c4ee', [s * .5, 1.06, -.11], [.36, .3, .02], [0, 0, s * .2]);
      D.ball('#ddcdef', [s * .36, .7, -.08], [.24, .2, .05], [0, 0, -s * .25]); D.ball('#c09ad8', [s * .38, .68, -.03], [.08, .07, .02]);
    }
    D.antennae('#9677ae', '#e88ac0', .07, 1.42, .02, .28, .3);
    D.gem([0, 1.4, .22], '#f0a0d0', .05);
    D.face({ c: [0, 1.26, .04], spread: .48, pitch: .02, size: .066, iris: '#6a3a9a', lid: .32, lidColor: '#c9aee2', cheek: '#f2a8cc', mouth: 'smile', mouthPitch: -.32, mouthW: .03 });
  },
  espejalba(S, D) {
    S.ball([0, .62, -.05], [.46, .42, .6], '#f2f7f8', { k: 0 });
    S.ball([0, .66, .3], [.34, .34, .3], '#f2f7f8', { k: .12 });
    S.paint(E([0, .62, .5], [.26, .28, .16]), '#d4edf3', .06);
    S.limb([0, .82, .32], [0, 1.16, .4], .14, .11, '#f2f7f8', { k: .08 });
    S.limb([0, 1.16, .4], [0, 1.44, .34], .11, .1, '#f2f7f8', { k: .06 });
    S.ball([0, 1.6, .36], [.2, .18, .2], '#f2f7f8', { k: .06 });
    S.limb([0, 1.57, .52], [0, 1.54, .7], .06, .012, '#e8be5c', { k: .02, kc: .01 });
    for (const i of [-1, 0, 1]) S.limb([i * .06, 1.72, .28], [i * .14, 1.92 - Math.abs(i) * .05, .14], .04, .012, '#7cc8e8', { k: .03, kc: .02 });
    for (const i of [-1, 0, 1]) S.limb([i * .1, .66, -.55], [i * .22, .78, -.86], .08, .02, '#c4e4ec', { k: .04, kc: .02 });
    const mirror = D.M('#bfe6f6', { metalness: .55, roughness: .12, emissive: '#9ad8f0', emissiveIntensity: .25 });
    for (const s of [-1, 1]) {
      const wing = new T.Group(); wing.position.set(s * .44, .98, -.12); wing.rotation.set(0, -s * .55, -s * .12);
      D.add(SPHERE(), '#dcecf2', [s * .26, 0, 0], [.34, .54, .07], null, wing); D.add(SPHERE(), mirror, [s * .26, 0, .045], [.27, .45, .04], null, wing);
      D.add(SPHERE_LO(), '#ffffff', [s * .2, .14, .08], [.035, .24, .01], [0, 0, -s * .25], wing); D.root.add(wing);
    }
    D.face({ c: [0, 1.6, .36], spread: .55, pitch: .05, size: .056, iris: '#3a5aa0', cheek: '#f4c0c8', mouth: 'none' });
  }
};
Object.assign(BUILD, INICIALES, BRUMA, FAUNA);
export const ALL_SPECIES = Object.keys(BUILD);
// Rugosidad y brillo metálico del cuerpo por especie (las rocas son mate, el metal brilla).
const ROUGH = { guijarrin: .62, penon: .64, espejalba: .3, medusin: .28, meduson: .28, magmol: .72, magmor: .72, magmatron: .7, cuarcin: .55, cuarzon: .55, astrocuarzo: .5, ferlum: .34, ferrox: .34, acerion: .32, fraguon: .36, nivalin: .3, nivalmar: .3, nivalord: .3 };
const METAL = {};

// Piel de figura HD: el color sale de la malla esculpida (con sombra de pliegues horneada) y una luz de borde
// tibia contornea la silueta, como en un render de estudio. Una sola por rugosidad y brillo metálico.
const SKIN = new Map();
export function skinMaterial(rough, metal = 0, lit = 0) {
  const key = rough + ':' + metal + ':' + lit;
  if (SKIN.has(key)) return SKIN.get(key);
  const m = new T.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: rough, metalness: metal, ...(lit ? { emissive: '#fff4e0', emissiveIntensity: lit } : {}) });
  m.onBeforeCompile = sh => {
    sh.uniforms.rimTint = { value: new T.Color('#fff1dc') };
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec3 rimTint;\nvoid main() {').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      totalEmissiveRadiance += mix(diffuseColor.rgb, rimTint, .45) * (pow(rimF, 3.0) * .55);`);
  };
  m.customProgramCacheKey = () => 'alborada-skin';
  SKIN.set(key, m); return m;
}

// Modelo de la especie: cuerpo esculpido (se construye una vez y se reutiliza) + detalles.
export function creatureModel(r, sp) {
  const build = BUILD[sp];
  if (!build) throw new Error(`Especie sin modelo: ${sp}`);
  const g = new T.Group(), S = new Sculpt(), D = kit(r, g, S);
  build(S, D);
  let body = BODY.get(sp);
  if (!body) { S.ao = .55; body = S.mesh(.026); BODY.set(sp, body); }
  const mesh = new T.Mesh(body, skinMaterial(ROUGH[sp] ?? .42, METAL[sp] || 0));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.keep = true; g.add(mesh);
  r.batch(g);
  g.userData.eyes = D.eyes;
  g.userData.head = D.anchors.head;
  g.userData.body = mesh;
  g.userData.anim = D.anims;
  return g;
}
// Mueve lo que cada modelo trae animado (fuego que titila, hojas que flotan, agua que gira).
export function animateCreature(model, t, dt = 1 / 60) { for (const fn of model.userData.anim || []) fn(t, dt); }
