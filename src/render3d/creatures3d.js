// Criaturas 3D de Alborada con acabado de figura: cuerpos redondos y brillantes, ojos grandes con brillo
// puestos sobre la curva de la cara, cachetes, boquita y patas rechonchas. Cada especie sale de su pixel art
// y de su descripción (diseños propios). Los ojos quedan aparte para que puedan parpadear.
import * as T from 'three';

export const ALL_SPECIES = ['brotelo', 'brotoso', 'bosqueron', 'brasin', 'brason', 'volcarbon', 'charquin', 'charcomar', 'mareon',
  'pipiu', 'pipiolo', 'roedin', 'roedon', 'capullin', 'capullado', 'alasol', 'setin', 'seton', 'chispaz', 'voltaz',
  'guijarrin', 'penon', 'medusin', 'meduson', 'sombrin', 'sombrador', 'mentelin', 'espejalba'];

// ---------- Geometrías compartidas (el lote las clona, así que no se liberan por criatura) ----------
const G = {};
const geo = (k, make) => G[k] || (G[k] = make());
const SPHERE = () => geo('s', () => new T.SphereGeometry(1, 26, 18));
const SPHERE_LO = () => geo('sl', () => new T.SphereGeometry(1, 14, 10));
const DOME = () => geo('dome', () => new T.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2));
const CONE = () => geo('cone', () => new T.ConeGeometry(1, 1, 18));
const CYL = () => geo('cyl', () => new T.CylinderGeometry(1, 1, 1, 18));
const TORUS = (arc, tube) => geo('t' + arc.toFixed(3) + tube, () => new T.TorusGeometry(1, tube, 8, 28, arc));
// Gota de agua: base redonda y punta arriba (alto 1.75 con radio 1).
const TEAR = () => geo('tear', () => new T.LatheGeometry([[0, 0], [.55, .06], [.88, .3], [1, .62], [.93, .92], [.72, 1.18], [.45, 1.42], [.2, 1.62], [0, 1.75]].map(([x, y]) => new T.Vector2(x, y)), 28));
const VOLCANO = () => geo('volcano', () => new T.CylinderGeometry(.42, 1, 1, 22));

const sh = (hex, f) => { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); };
const UP = new T.Vector3(0, 1, 0), FWD = new T.Vector3(0, 0, 1);

function kit(r, g) {
  const M = (c, o = {}) => typeof c === 'object' ? c : r.mat(c, { roughness: .4, ...o });
  const glow = (c, k = .55) => r.mat(c, { emissive: c, emissiveIntensity: k, roughness: .35 });
  const HL = r.mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: .55, roughness: .25 });
  const add = (gm, c, p, s, rot, parent = g) => {
    const m = new T.Mesh(gm, M(c)); m.position.set(...p); m.scale.set(...(Array.isArray(s) ? s : [s, s, s]));
    if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (c, p, s, rot) => add(SPHERE(), c, p, s, rot);
  const dot = (c, p, s, rot) => add(SPHERE_LO(), c, p, s, rot);
  const cone = (c, p, s, rot) => add(CONE(), c, p, s, rot);
  const cyl = (c, p, s, rot) => add(CYL(), c, p, s, rot);
  const dome = (c, p, s, rot) => add(DOME(), c, p, s, rot);
  const ring = (c, p, radius, tube = .18, rot = [Math.PI / 2, 0, 0], arc = Math.PI * 2) => add(TORUS(arc, tube), c, p, [radius, radius, radius], rot);
  // Punto sobre un elipsoide (az: 90° es el frente; el: 0 arriba, 90° ecuador) y su normal.
  const shell = (h, az, el, out = 0) => {
    const d = [Math.cos(az) * Math.sin(el), Math.cos(el), Math.sin(az) * Math.sin(el)];
    const n = new T.Vector3(d[0] / h.r[0], d[1] / h.r[1], d[2] / h.r[2]).normalize();
    return { p: new T.Vector3(h.c[0] + d[0] * h.r[0], h.c[1] + d[1] * h.r[1], h.c[2] + d[2] * h.r[2]).addScaledVector(n, out), n };
  };
  // Pieza aplastada pegada a la superficie (manchas, cachetes).
  const spot = (c, h, az, el, w, t = w * .32, hgt = w) => {
    const { p, n } = shell(h, az, el, -t * .25);
    const m = dot(c, [p.x, p.y, p.z], [w, t, hgt]); m.quaternion.setFromUnitVectors(UP, n); return m;
  };
  const eyes = [];
  // Ojo de figura: óvalo oscuro brillante, iris de color abajo y dos brillos. style 'cat': ojo de color con pupila rasgada.
  const eye = (h, az, el, s, iris, { lid = 0, lidColor, style, tilt = 0 } = {}) => {
    const { p, n } = shell(h, az, el, -s * .12);
    const e = new T.Group(); e.position.copy(p); e.quaternion.setFromUnitVectors(FWD, n); e.rotateZ(tilt); g.add(e);
    const keep = m => { m.userData.keep = true; return m; };
    if (style === 'cat') {
      keep(add(SPHERE(), glow(iris, .35), [0, 0, 0], [s * 1.1, s * 1.25, s * .42], null, e));
      keep(add(SPHERE_LO(), M('#1a1420', { roughness: .2 }), [0, 0, s * .2], [s * .32, s * 1.0, s * .3], null, e));
    } else {
      keep(add(SPHERE(), M(sh(iris, -.78), { roughness: .16 }), [0, 0, 0], [s, s * 1.42, s * .44], null, e));
      keep(add(SPHERE_LO(), M(sh(iris, .05), { roughness: .2 }), [0, -s * .48, s * .16], [s * .7, s * .55, s * .32], null, e));
    }
    keep(add(SPHERE_LO(), HL, [-s * .3, s * .46, s * .34], [s * .36, s * .44, s * .14], null, e));
    keep(add(SPHERE_LO(), HL, [s * .3, -s * .42, s * .36], [s * .14, s * .14, s * .08], null, e));
    if (lid) keep(add(SPHERE(), lidColor, [0, s * (1.6 - lid * 1.2), s * .1], [s * 1.25, s * .9, s * .55], null, e));
    eyes.push(e); return e;
  };
  // Cara completa sobre la cabeza h = { c:[x,y,z], r:[rx,ry,rz] }.
  const face = (h, o = {}) => {
    const { spread = .4, el = 1.3, size = .075, iris = '#3a5a9a', cheek = '#f4a3a8', mouth = 'smile', lid = 0, lidColor = '#888', style, tilt = 0, mouthDrop = .36, mouthW = .045 } = o;
    for (const side of [-1, 1]) eye(h, Math.PI / 2 + side * spread, el, size, iris, { lid, lidColor, style, tilt: side * tilt });
    if (cheek) for (const side of [-1, 1]) spot(cheek, h, Math.PI / 2 + side * (spread + .3), el + .26, size * .95, size * .3, size * .62);
    const m = shell(h, Math.PI / 2, el + mouthDrop, -.004);
    const ink = '#3a2a2a';
    if (mouth === 'smile' || mouth === 'fang' || mouth === 'cat') {
      const sm = add(TORUS(Math.PI, .32), ink, [m.p.x, m.p.y + mouthW * .5, m.p.z], [mouthW, mouthW * .8, mouthW], null);
      sm.quaternion.setFromUnitVectors(FWD, m.n); sm.rotateZ(Math.PI);
      if (mouth === 'cat') { sm.scale.multiplyScalar(.7); sm.position.x -= mouthW * .7; const b = sm.clone(); b.position.x += mouthW * 1.4; g.add(b); }
      if (mouth === 'fang') { const f = cone('#ffffff', [m.p.x + mouthW * .55, m.p.y - mouthW * .2, m.p.z + .005], [mouthW * .35, mouthW * .7, mouthW * .3], [Math.PI, 0, 0]); f.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(FWD, m.n)); }
    } else if (mouth === 'open') {
      const o2 = dot('#7a3040', [m.p.x, m.p.y, m.p.z], [mouthW * 1.1, mouthW * .8, mouthW * .4]); o2.quaternion.setFromUnitVectors(FWD, m.n);
      const t = dot('#f08a96', [m.p.x, m.p.y - mouthW * .35, m.p.z + mouthW * .12], [mouthW * .7, mouthW * .35, mouthW * .25]); t.quaternion.setFromUnitVectors(FWD, m.n);
    }
  };
  const feet = (c, x, z, s = .16, y = .07) => { for (const side of [-1, 1]) ball(c, [side * x, y, z], [s, s * .55, s * 1.25]); };
  // Llama de tres lenguas brillantes con corazón claro.
  const flame = (x, y, z, s = 1) => {
    cone(glow('#ff8a3a', .7), [x - .1 * s, y + .02 * s, z], [.12 * s, .42 * s, .12 * s], [0, 0, .32]);
    cone(glow('#ff8a3a', .7), [x + .1 * s, y + .02 * s, z], [.12 * s, .42 * s, .12 * s], [0, 0, -.32]);
    cone(glow('#ffc04a', .75), [x, y + .12 * s, z], [.16 * s, .62 * s, .16 * s]);
    ball(glow('#fff1b0', .8), [x, y - .02 * s, z + .02], [.1 * s, .14 * s, .1 * s]);
  };
  // Tubo suave a lo largo de una curva (cuellos, colas largas).
  const tube = (c, pts, radius) => {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)));
    const m = new T.Mesh(new T.TubeGeometry(curve, 24, radius, 14), M(c)); m.userData.ownedGeometry = true; m.castShadow = m.receiveShadow = true; g.add(m);
    ball(c, pts[0], radius); ball(c, pts[pts.length - 1], radius); return m;
  };
  const antenna = (c, tip, x, y, z, len = .32, lean = .25) => {
    for (const side of [-1, 1]) {
      const a = side * lean;
      cyl(c, [side * x + Math.sin(a) * len / 2, y + Math.cos(a) * len / 2, z], [.018, len, .018], [0, 0, -a]);
      ball(tip, [side * x + Math.sin(a) * len, y + Math.cos(a) * len, z], .06);
    }
  };
  return { M, glow, ball, dot, cone, cyl, dome, ring, shell, spot, eye, face, feet, flame, antenna, tube, eyes, add, root: g };
}

// ---------- Especies ----------
const BUILD = {
  brotelo(k) {
    const stone = { c: [0, .42, .02], r: [.6, .43, .53] };
    k.ball('#c4a97f', stone.c, stone.r);
    k.ball('#5aa84c', [0, .64, -.03], [.63, .3, .55]);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .3; if (Math.sin(a) > .55) continue; k.ball(i % 2 ? '#74bd58' : '#5fae4f', [Math.cos(a) * .52, .56, Math.sin(a) * .45], [.15, .12, .15]); }
    k.cyl('#4a8a3c', [0, .96, 0], [.035, .3, .035]);
    k.ball('#a3d46c', [-.17, 1.11, 0], [.21, .055, .12], [0, 0, .35]); k.ball('#88c45a', [.17, 1.14, 0], [.21, .055, .12], [0, 0, -.35]);
    k.face(stone, { spread: .36, el: 1.6, size: .078, iris: '#4a7a3a', mouthDrop: .28 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) k.ball('#a88c66', [x * .36, .09, z * .25], [.15, .09, .18]);
  },
  brotoso(k) {
    k.ball('#a8916c', [0, .58, -.08], [.8, .5, .68]); k.ball('#8f7a58', [0, .4, -.08], [.84, .2, .72]);
    k.ball('#5d9a4c', [0, .88, -.1], [.68, .24, .55]);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; k.ball(i % 2 ? '#6cb058' : '#579a48', [Math.cos(a) * .6, .82, -.1 + Math.sin(a) * .48], [.15, .11, .15]); }
    k.cyl('#4a8a3c', [.1, 1.2, -.12], [.035, .4, .035]);
    k.ball('#a3d46c', [-.08, 1.4, -.12], [.22, .055, .12], [0, 0, .35]); k.ball('#88c45a', [.28, 1.43, -.12], [.22, .055, .12], [0, 0, -.35]);
    for (const [x, z, c] of [[-.36, .1, '#f1a7c0'], [.34, -.32, '#f2d466'], [-.1, -.4, '#f1a7c0']]) { k.ball(c, [x, 1.06, z], [.09, .05, .09]); k.dot('#fff4d0', [x, 1.09, z], .035); }
    const head = { c: [0, .52, .58], r: [.34, .3, .28] };
    k.ball('#dcc290', head.c, head.r);
    k.face(head, { spread: .42, el: 1.42, size: .066, iris: '#4a6a32', mouthDrop: .34 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) k.ball('#b89a70', [x * .52, .15, -.08 + z * .34], [.2, .15, .23]);
  },
  bosqueron(k) {
    k.ball('#8f7c5c', [0, .64, -.12], [.94, .58, .78]); k.ball('#776448', [0, .42, -.12], [.98, .22, .82]);
    k.ball('#4f8a46', [0, 1.0, -.14], [.8, .25, .64]);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; k.ball(i % 2 ? '#5f9e52' : '#4b8642', [Math.cos(a) * .72, .94, -.14 + Math.sin(a) * .56], [.17, .12, .17]); }
    k.cyl('#8c6745', [0, 1.38, -.2], [.12, .72, .12]);
    k.ball('#4f9a52', [0, 1.86, -.2], [.55, .4, .5]); k.ball('#5fae5c', [-.4, 1.72, -.12], [.36, .3, .34]); k.ball('#5fae5c', [.38, 1.75, -.28], [.38, .3, .34]);
    k.ball('#7cc46a', [-.12, 2.08, -.08], [.26, .16, .24]);
    for (const [x, z] of [[-.5, .2], [.48, .05]]) k.ball('#6aa85a', [x, 1.12, z], [.16, .12, .15]);
    const head = { c: [0, .56, .7], r: [.38, .32, .3] };
    k.ball('#cbb082', head.c, head.r);
    k.face(head, { spread: .42, el: 1.4, size: .07, iris: '#3d5a2f', mouthDrop: .34 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) k.ball('#a68a62', [x * .62, .18, -.1 + z * .42], [.25, .19, .28]);
  },
  brasin(k) {
    const body = { c: [0, .47, 0], r: [.6, .45, .52] };
    k.ball('#655d7a', body.c, body.r); k.ball('#736a8a', [0, .4, .22], [.44, .32, .3]);
    for (const [x, y, z, rz] of [[-.5, .55, .12, .5], [.52, .5, .16, -.6], [.36, .74, -.2, .2]]) k.ball(k.glow('#ff9a4a', .8), [x, y, z], [.025, .11, .025], [0, 0, rz]);
    k.ball('#efdcc0', [0, .42, .47], [.22, .15, .15]); k.dot('#e88a8e', [0, .47, .61], [.06, .045, .045]);
    for (const x of [-1, 1]) { k.ball('#efdcc0', [x * .32, .14, .36], [.15, .08, .17]); for (let i = -1; i <= 1; i++) k.dot('#fff6e6', [x * .32 + i * .055, .14, .51], [.022, .022, .03]); }
    k.flame(0, .98, -.12, .95);
    k.face(body, { spread: .34, el: 1.12, size: .066, iris: '#d8823a', cheek: '#f39a62', mouth: 'none' });
    k.feet('#4a4258', .26, -.1, .14);
  },
  brason(k) {
    k.ball('#655d7a', [0, .62, 0], [.55, .58, .47]); k.ball('#7a7290', [0, .55, .24], [.38, .42, .26]);
    const head = { c: [0, 1.2, .03], r: [.37, .34, .33] };
    k.ball('#655d7a', head.c, head.r);
    k.ball('#efdcc0', [0, 1.11, .31], [.2, .13, .13]); k.dot('#e88a8e', [0, 1.16, .43], [.055, .04, .04]);
    for (const x of [-1, 1]) { k.ball('#655d7a', [x * .56, .76, .1], [.2, .15, .17]); for (let i = -1; i <= 1; i++) k.cone('#fff4e2', [x * .66, .7 + i * .06, .2], [.03, .1, .03], [Math.PI / 2, 0, 0]); }
    for (const [x, y, z, rz] of [[-.44, .7, .2, .4], [.46, .52, .22, -.5]]) k.ball(k.glow('#ff9a4a', .8), [x, y, z], [.025, .12, .025], [0, 0, rz]);
    k.flame(0, 1.58, -.04, .75); k.flame(.32, .62, -.42, .6);
    k.face(head, { spread: .38, el: 1.3, size: .062, iris: '#d8823a', cheek: '#f39a62', mouth: 'none' });
    k.feet('#efdcc0', .28, .14, .17);
  },
  volcarbon(k) {
    k.ball('#564e66', [0, .6, -.05], [.84, .55, .7]); k.ball('#6e6684', [0, .5, .3], [.56, .36, .36]);
    k.add(VOLCANO(), k.M('#735c4c', { roughness: .55 }), [0, 1.24, -.22], [.5, .78, .5]);
    k.cyl(k.glow('#ffb04a', .9), [0, 1.62, -.22], [.2, .04, .2]);
    k.flame(0, 1.78, -.22, .62);
    for (const [x, y, z, rz] of [[-.62, .62, .25, .5], [.64, .58, .2, -.5], [-.3, .88, .4, .2], [.44, .9, -.3, -.3]]) k.ball(k.glow('#ff9a4a', .85), [x, y, z], [.03, .14, .03], [0, 0, rz]);
    const head = { c: [0, .66, .6], r: [.42, .36, .32] };
    k.ball('#5e566e', head.c, head.r);
    k.ball('#efdcc0', [0, .58, .88], [.2, .13, .1]); k.dot('#e88a8e', [0, .63, .97], [.055, .04, .04]);
    k.face(head, { spread: .42, el: 1.32, size: .066, iris: '#f5c542', style: 'cat', cheek: false, mouth: 'none' });
    for (const x of [-1, 1]) for (const z of [-1, 1]) { k.ball('#efdcc0', [x * .56, .14, -.05 + z * .38], [.22, .14, .26]); }
  },
  charquin(k) {
    k.add(TEAR(), '#4fa8d8', [0, 0, 0], [.52, .68, .46]);
    const head = { c: [0, .42, 0], r: [.52, .52, .46] };
    k.ball('#cdeef4', [0, .38, .27], [.33, .3, .2]);
    for (const x of [-1, 1]) { k.ball('#a4def0', [x * .55, .66, 0], [.26, .09, .14], [0, 0, x * .25]); k.ball('#a4def0', [x * .52, .5, -.02], [.18, .07, .1], [0, 0, x * .15]); }
    k.feet('#3f8cbc', .22, .14, .15);
    k.face(head, { spread: .38, el: 1.05, size: .078, iris: '#2c6aa8', mouthDrop: .3 });
  },
  charcomar(k) {
    k.add(TEAR(), '#3f90cc', [0, 0, 0], [.58, .74, .5]);
    const head = { c: [0, .46, 0], r: [.58, .57, .5] };
    k.ball('#cdeef4', [0, .44, .3], [.36, .34, .22]);
    for (let i = -1; i <= 1; i++) k.cone('#9bd6ee', [i * .14, 1.38 - Math.abs(i) * .1, -.02], [.07, .28, .07], [0, 0, -i * .45]);
    for (const x of [-1, 1]) { k.ball('#a8def2', [x * .7, .86, 0], [.34, .12, .15], [0, 0, x * .32]); k.ball('#a8def2', [x * .64, .66, 0], [.26, .1, .13], [0, 0, x * .12]); }
    k.feet('#337cb0', .26, .16, .17);
    k.face(head, { spread: .38, el: .93, size: .076, iris: '#245e9a', mouthDrop: .28 });
  },
  mareon(k) {
    k.add(TEAR(), '#3a7fc0', [0, 0, 0], [.6, .92, .52]);
    const head = { c: [0, .57, 0], r: [.6, .73, .52] };
    k.ball('#cdeef4', [0, .52, .32], [.38, .4, .22]);
    for (const x of [-1, 1]) { k.ball('#bfe6f6', [x * .74, 1.05, -.06], [.26, .52, .08], [0, 0, -x * .2]); k.ball('#8fcce8', [x * .74, 1.05, -.02], [.17, .38, .05], [0, 0, -x * .2]); }
    for (let i = -1; i <= 1; i++) k.ball('#93d2ec', [i * .13, 1.66 - Math.abs(i) * .08, 0], [.065, .2, .065], [0, 0, -i * .35]);
    k.dot(k.glow('#ec92d6', .7), [0, 1.34, .46], [.075, .075, .035]);
    k.feet('#2f6ea8', .28, .16, .18);
    k.face(head, { spread: .38, el: .85, size: .074, iris: '#3a4aa0', mouthDrop: .26 });
  },
  pipiu(k) {
    k.ball('#c08a5e', [0, .5, 0], [.48, .46, .42]); k.ball('#f5e2c2', [0, .44, .26], [.32, .32, .2]);
    const head = { c: [0, .98, .02], r: [.34, .32, .31] };
    k.ball('#c08a5e', head.c, head.r); k.ball('#f3dfbf', [0, .93, .17], [.25, .2, .17]);
    for (const x of [-1, 1]) { k.ball('#8e6448', [x * .45, .58, -.02], [.14, .3, .26], [0, 0, x * .3]); k.ball('#5fb8b4', [x * .5, .36, .0], [.1, .09, .14]); }
    k.cone('#e6b04a', [0, .92, .37], [.075, .16, .075], [Math.PI / 2, 0, 0]);
    for (const x of [-1, 1]) k.ball('#8e6448', [x * .05, 1.33, -.02], [.04, .13, .055], [0, 0, -x * .35]);
    k.feet('#e0a04a', .16, .1, .11);
    k.face(head, { spread: .42, el: 1.36, size: .064, iris: '#5a3a2a', mouth: 'none' });
  },
  pipiolo(k) {
    k.ball('#bb7f55', [0, .62, 0], [.46, .52, .4]); k.ball('#f1dcbc', [0, .55, .26], [.31, .36, .17]);
    const head = { c: [0, 1.22, .02], r: [.33, .32, .3] };
    k.ball('#bb7f55', head.c, head.r); k.ball('#f1dcbc', [0, 1.16, .18], [.24, .19, .15]);
    for (const x of [-1, 1]) { k.ball('#8e6040', [x * .66, .94, 0], [.5, .2, .16], [0, 0, x * .45]); k.ball('#4fa8a4', [x * 1.04, .76, 0], [.16, .14, .12]); k.ball('#a27450', [x * .5, 1.04, .05], [.26, .1, .1], [0, 0, x * .45]); }
    k.cone('#e6b04a', [0, 1.15, .37], [.075, .17, .075], [Math.PI / 2, 0, 0]);
    for (let i = -1; i <= 1; i++) k.ball('#3f9a96', [i * .08, 1.6 - Math.abs(i) * .04, -.02], [.045, .2, .06], [0, 0, -i * .3]);
    k.feet('#e0a04a', .17, .1, .12);
    k.face(head, { spread: .42, el: 1.36, size: .062, iris: '#4a2a1a', mouth: 'none', lid: .25, lidColor: '#bb7f55' });
  },
  roedin(k) {
    const body = { c: [0, .56, 0], r: [.58, .54, .46] };
    k.ball('#d8b088', body.c, body.r); k.ball('#f6e6c8', [0, .44, .3], [.4, .32, .18]);
    for (const x of [-1, 1]) { k.ball('#f3d8b0', [x * .3, .52, .3], [.18, .15, .13]); k.ball('#c9996c', [x * .36, 1.03, 0], [.17, .18, .09]); k.ball('#f0b0a8', [x * .36, 1.03, .06], [.11, .12, .04]); k.ball('#e9c9a0', [x * .2, .3, .42], [.09, .07, .07]); }
    k.dot('#9a6a5a', [0, .58, .47], [.05, .035, .03]);
    k.add(SPHERE_LO(), '#ffffff', [0, .44, .47], [.05, .06, .02]);
    k.feet('#c9996c', .26, .1, .14);
    k.face(body, { spread: .38, el: 1.08, size: .07, iris: '#4a3020', mouth: 'none' });
  },
  roedon(k) {
    const body = { c: [0, .66, 0], r: [.6, .64, .48] };
    k.ball('#a87a50', body.c, body.r); k.ball('#ead4b0', [0, .55, .3], [.4, .42, .2]);
    k.ball('#7a5a3e', [0, .14, -.62], [.3, .07, .44], [-.2, 0, 0]);
    for (let i = 0; i < 3; i++) k.ball('#6a4c34', [0, .155, -.46 - i * .14], [.26, .02, .02], [-.2, 0, 0]);
    for (const x of [-1, 1]) { k.ball('#8e6644', [x * .36, 1.22, 0], [.13, .13, .07]); k.ball('#c99a7a', [x * .36, 1.22, .04], [.08, .08, .03]); k.ball('#ead4b0', [x * .26, .42, .4], [.1, .08, .08]); }
    for (const x of [-1, 1]) k.add(SPHERE_LO(), '#ffffff', [x * .035, .64, .47], [.034, .065, .02]);
    k.dot('#5a3a2e', [0, .76, .47], [.07, .05, .04]);
    k.feet('#7a5a3e', .3, .12, .17);
    k.face(body, { spread: .36, el: .95, size: .068, iris: '#3a2418', mouth: 'none' });
  },
  capullin(k) {
    k.ball('#86c25a', [0, .27, -.58], [.27, .26, .27]); k.ball('#94ca62', [0, .3, -.26], [.31, .3, .3]);
    for (const z of [-.58, -.26]) k.ball('#d8eeb0', [0, .18, z + .12], [.2, .14, .14]);
    const head = { c: [0, .5, .16], r: [.37, .36, .33] };
    k.ball('#a2d470', head.c, head.r); k.ball('#d8eeb0', [0, .36, .32], [.22, .16, .14]);
    k.antenna('#5a7a40', '#e8584a', .13, .82, .14, .3, .3);
    for (const z of [-.6, -.3, 0]) k.feet('#6a9a48', .2, z, .08, .05);
    k.face(head, { spread: .38, el: 1.38, size: .07, iris: '#2a4a2a', mouthDrop: .32 });
  },
  capullado(k) {
    k.ball('#a4b87e', [0, .76, 0], [.37, .7, .35]); k.ball('#b8c890', [0, .86, .08], [.3, .52, .3]);
    for (let i = 0; i < 6; i++) { const y = .26 + i * .19, rr = .37 * Math.sqrt(Math.max(.05, 1 - ((y - .76) / .7) ** 2)); k.ring('#8a9e64', [0, y, 0], rr * 1.01, .07); }
    k.cyl('#f2f0e2', [0, 1.6, 0], [.012, .34, .012]);
    k.face({ c: [0, .86, .08], r: [.3, .52, .3] }, { spread: .36, el: 1.3, size: .058, iris: '#3a4a2a', lid: .55, lidColor: '#b8c890', mouth: 'none', cheek: '#e8b0a0' });
  },
  alasol(k) {
    k.ball('#6e5040', [0, .78, 0], [.13, .36, .13]); k.ball('#6e5040', [0, 1.05, 0], [.16, .15, .15]);
    const head = { c: [0, 1.28, .02], r: [.17, .16, .16] };
    k.ball('#6e5040', head.c, head.r);
    for (const x of [-1, 1]) {
      k.ball('#f2cf55', [x * .48, 1.13, -.06], [.42, .34, .06], [0, 0, x * .25]); k.ball('#fff3c0', [x * .52, 1.18, 0], [.18, .16, .02]);
      k.ball('#f0a640', [x * .38, .66, -.06], [.28, .25, .06], [0, 0, -x * .2]); k.ball('#7a4a2a', [x * .4, .64, 0], [.09, .09, .02]); k.ball('#fff3c0', [x * .4, .64, .012], [.035, .035, .01]);
    }
    k.antenna('#6e5040', '#f2cf55', .06, 1.4, 0, .26, .35);
    k.face(head, { spread: .48, el: 1.36, size: .05, iris: '#d8423a', cheek: false, mouth: 'none' });
  },
  setin(k) {
    const stem = { c: [0, .42, 0], r: [.3, .36, .28] };
    k.ball('#f2e2c4', stem.c, stem.r);
    k.feet('#d9c3a0', .16, .08, .13);
    const cap = { c: [0, .8, 0], r: [.62, .42, .56] };
    k.dome('#e0743e', cap.c, cap.r); k.ball('#f5dfbf', [0, .8, 0], [.6, .08, .54]);
    for (const [az, el] of [[1.5, .35], [.4, .9], [2.6, .95], [1.6, 1.15], [4.2, .8], [5.3, 1.0], [3.4, .5], [.9, 1.3], [2.2, 1.3]]) k.spot('#fff6e6', cap, az, el, .085, .04);
    k.face(stem, { spread: .42, el: 1.36, size: .056, iris: '#5a3a2a', mouthDrop: .3, mouthW: .035 });
  },
  seton(k) {
    const stem = { c: [0, .5, 0], r: [.38, .46, .34] };
    k.ball('#f0dfbe', stem.c, stem.r);
    for (const x of [-1, 1]) k.ball('#e8d4b0', [x * .42, .52, .05], [.18, .08, .09], [0, 0, x * .3]);
    k.ball('#7ab85a', [.62, .58, .08], [.17, .05, .09], [0, .4, .3]);
    k.feet('#d2bc96', .2, .1, .16);
    const cap = { c: [0, 1.0, 0], r: [.86, .5, .78] };
    k.dome('#c05e3a', cap.c, cap.r); k.ball('#f2dcbc', [0, 1.0, 0], [.84, .09, .76]);
    for (const [az, el] of [[1.5, .3], [.3, .85], [2.8, .9], [1.6, 1.1], [4.2, .75], [5.2, 1.0], [3.5, .45], [.9, 1.3], [2.3, 1.3], [0, .5]]) k.spot('#fff6e6', cap, az, el, .11, .05);
    k.face(stem, { spread: .38, el: 1.3, size: .06, iris: '#4a3022', mouthDrop: .32, mouthW: .04, lid: .2, lidColor: '#f0dfbe' });
  },
  chispaz(k) {
    const body = { c: [0, .62, 0], r: [.5, .48, .44] };
    k.ball('#f2cf4f', body.c, body.r);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (Math.sin(a) < -.55) continue; k.cone('#f2cf4f', [Math.cos(a) * .48, .62 + Math.sin(a) * .46, -.06], [.09, .22, .09], [0, 0, a - Math.PI / 2]); }
    k.ball('#f8e08a', [0, .56, .27], [.34, .3, .17]);
    k.antenna('#4a5866', k.glow('#7cc8f0', .6), .14, 1.02, 0, .32, .22);
    for (const [x, y, rz] of [[.52, .5, .7], [.64, .62, -.5], [.72, .76, .7]]) k.ball('#4a7ec0', [x, y, -.22], [.06, .1, .05], [0, 0, rz]);
    k.feet('#e8c040', .22, .1, .14);
    k.face(body, { spread: .36, el: 1.4, size: .072, iris: '#4a3a1a', cheek: '#f3805a', mouth: 'open', mouthW: .04 });
  },
  voltaz(k) {
    const body = { c: [0, .7, 0], r: [.48, .52, .42] };
    k.ball('#f3d24a', body.c, body.r);
    k.ball('#3f6fc0', [0, .86, -.14], [.56, .56, .34]);
    for (let i = 0; i < 15; i++) { const a = i / 14 * Math.PI * 1.25 - Math.PI * .125; k.ball(i % 2 ? '#3f6fc0' : '#4a7ed0', [Math.cos(a) * .56, .78 + Math.sin(a) * .52, -.1], [.17, .17, .13]); }
    for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI; k.cone('#3f6fc0', [Math.cos(a) * .62, .8 + Math.sin(a) * .62, -.12], [.08, .18, .08], [0, 0, a - Math.PI / 2]); }
    k.ball('#f8e08a', [0, .66, .26], [.36, .34, .16]);
    k.feet('#e8b830', .24, .1, .16);
    for (const [x, y, rz] of [[-.5, .45, .7], [-.62, .56, -.5]]) k.ball('#3f6fc0', [x, y, -.25], [.06, .1, .05], [0, 0, rz]);
    k.face(body, { spread: .34, el: 1.34, size: .07, iris: '#3a2a10', cheek: '#f3805a', mouthDrop: .32, lid: .2, lidColor: '#f3d24a' });
  },
  guijarrin(k) {
    const body = { c: [0, .5, 0], r: [.56, .5, .48] };
    k.ball(k.M('#a3a9ae', { roughness: .7 }), body.c, body.r);
    for (const x of [-1, 1]) k.ball(k.M('#8f969c', { roughness: .7 }), [x * .6, .44, .05], [.17, .12, .14]);
    k.ball('#7c838a', [-.24, .74, .38], [.12, .015, .02], [0, 0, .4]); k.ball('#7c838a', [.3, .32, .42], [.1, .015, .02], [0, 0, -.3]);
    k.ball(k.M('#b8bec2', { roughness: .7 }), [-.14, .94, .06], [.2, .11, .18]);
    k.feet('#7f878c', .26, .14, .13);
    k.face(body, { spread: .38, el: 1.42, size: .062, iris: '#3a3a44', lid: .32, lidColor: '#a3a9ae', cheek: '#d0a8a8', mouthDrop: .3, mouthW: .035 });
  },
  penon(k) {
    const body = { c: [0, .62, 0], r: [.72, .6, .6] };
    k.ball(k.M('#8e9599', { roughness: .7 }), body.c, body.r);
    k.ball(k.M('#9aa1a5', { roughness: .7 }), [-.4, .9, -.1], [.32, .26, .3]);
    k.ball('#79ad62', [0, 1.12, -.04], [.56, .14, .43]);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; k.ball('#6a9e55', [Math.cos(a) * .5, 1.06, -.04 + Math.sin(a) * .38], [.1, .1, .1]); }
    for (const x of [-1, 1]) { k.ball(k.M('#7f878c', { roughness: .7 }), [x * .8, .56, .1], [.24, .2, .2]); k.ball(k.M('#7f878c', { roughness: .7 }), [x * .32, .1, .22], [.22, .12, .25]); }
    k.ball('#6c7378', [-.25, .5, .56], [.14, .015, .02], [0, 0, .5]); k.ball('#6c7378', [.34, .88, .48], [.12, .015, .02], [0, 0, -.4]);
    k.face(body, { spread: .34, el: 1.32, size: .066, iris: '#2a2a32', lid: .38, lidColor: '#8e9599', cheek: false, mouthDrop: .26, mouthW: .04 });
  },
  medusin(k) {
    const bell = { c: [0, .9, 0], r: [.55, .5, .5] };
    k.dome('#7cc4e4', bell.c, bell.r); k.ring('#5aa8cc', [0, .9, 0], .53, .12);
    k.ball('#4f9cc0', [0, .9, 0], [.5, .07, .46]); k.ball('#d4f0fa', [-.18, 1.2, .14], [.17, .1, .13]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; for (let j = 0; j < 5; j++) k.dot('#9ad4ea', [Math.cos(a) * .3 + Math.sin(j * .9 + i) * .05, .8 - j * .12, Math.sin(a) * .28], [.05 - j * .004, .08, .05 - j * .004]); }
    k.face(bell, { spread: .38, el: 1.18, size: .07, iris: '#2a5a8a', mouthDrop: .26 });
  },
  meduson(k) {
    const bell = { c: [0, 1.05, 0], r: [.68, .55, .62] };
    k.dome('#78bede', bell.c, bell.r); k.ring('#5aa2c8', [0, 1.05, 0], .66, .12);
    k.ball('#4a96bc', [0, 1.05, 0], [.63, .08, .58]); k.ball('#d4f0fa', [-.22, 1.38, .2], [.2, .11, .15]);
    for (let i = -2; i <= 2; i++) k.ball('#c0a6e0', [i * .19, 1.58 - Math.abs(i) * .07, -.04], [.075, .11, .075]);
    k.dot(k.glow('#f08cc0', .7), [0, 1.12, .62], [.1, .1, .04]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; for (let j = 0; j < 7; j++) k.dot(i % 2 ? '#b8a2d8' : '#9ad0e6', [Math.cos(a) * .38 + Math.sin(j * .9 + i) * .06, .95 - j * .12, Math.sin(a) * .34], [.055 - j * .004, .08, .055 - j * .004]); }
    k.face(bell, { spread: .42, el: 1.22, size: .072, iris: '#2a4a8a', mouthDrop: .24 });
  },
  sombrin(k) {
    k.ball('#62507a', [0, .5, 0], [.44, .42, .36]); k.ball('#7a6894', [0, .45, .24], [.28, .26, .16]);
    const head = { c: [0, 1.0, .02], r: [.37, .33, .32] };
    k.ball('#62507a', head.c, head.r);
    for (const x of [-1, 1]) { k.cone('#62507a', [x * .21, 1.34, -.02], [.12, .28, .11], [0, 0, -x * .22]); k.cone('#9a7ab8', [x * .2, 1.32, .03], [.06, .17, .04], [0, 0, -x * .22]); }
    for (let i = 0; i < 5; i++) k.ball('#62507a', [.36 + Math.sin(i * .7) * .12, .4 + i * .12, -.3], .085 - i * .006);
    k.ball('#7a6894', [.42, .98, -.3], .07);
    k.feet('#4e3e64', .22, .12, .14);
    k.face(head, { spread: .4, el: 1.36, size: .068, iris: '#f2d050', style: 'cat', lid: .25, lidColor: '#62507a', cheek: '#b88ab8', mouth: 'cat', mouthW: .03 });
  },
  sombrador(k) {
    k.ball('#4a3a5e', [0, .66, 0], [.56, .6, .46]); k.ball('#64547c', [0, .58, .26], [.36, .4, .22]);
    const head = { c: [0, 1.32, .02], r: [.42, .38, .36] };
    k.ball('#4a3a5e', head.c, head.r);
    for (const x of [-1, 1]) {
      k.cone('#4a3a5e', [x * .26, 1.74, -.02], [.13, .38, .12], [0, 0, -x * .3]); k.cone('#8a5aa8', [x * .25, 1.71, .04], [.06, .22, .04], [0, 0, -x * .3]);
      k.ball('#4a3a5e', [x * .62, .82, .1], [.22, .16, .18]); for (let i = -1; i <= 1; i++) k.cone('#ece6f2', [x * .72, .76 + i * .06, .24], [.03, .11, .03], [Math.PI / 2, 0, 0]);
    }
    for (let i = 0; i < 6; i++) k.ball('#4a3a5e', [.4 + Math.sin(i * .6) * .14, .5 + i * .13, -.34], .09 - i * .007);
    k.cone('#8a5aa8', [.48, 1.32, -.34], [.06, .14, .06]);
    k.feet('#3a2c4c', .28, .14, .18);
    k.face(head, { spread: .4, el: 1.36, size: .07, iris: '#f05a5a', style: 'cat', lid: .3, lidColor: '#4a3a5e', tilt: -.25, cheek: false, mouth: 'fang', mouthW: .045 });
  },
  mentelin(k) {
    k.ball('#c6a8e0', [0, .9, 0], [.3, .36, .28]);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; k.ball('#ece0f6', [Math.cos(a) * .24, 1.08, Math.sin(a) * .22], .08); }
    const head = { c: [0, 1.26, .02], r: [.25, .23, .23] };
    k.ball('#c6a8e0', head.c, head.r);
    for (const x of [-1, 1]) {
      k.ball('#ece0f6', [x * .5, 1.06, -.08], [.38, .32, .06], [0, 0, x * .2]); k.ball('#b48ad0', [x * .54, 1.1, -.02], [.14, .12, .02]);
      k.ball('#ddcdef', [x * .36, .7, -.08], [.24, .2, .06], [0, 0, -x * .25]); k.ball('#c09ad8', [x * .38, .68, -.02], [.08, .07, .02]);
      k.ball('#a888c8', [x * .1, .5, .02], [.05, .12, .05]);
    }
    k.antenna('#9677ae', '#e88ac0', .07, 1.42, 0, .28, .3);
    k.dot(k.glow('#f0a0d0', .7), [0, 1.38, .2], [.05, .05, .025]);
    k.face(head, { spread: .46, el: 1.4, size: .056, iris: '#6a3a9a', lid: .3, lidColor: '#c6a8e0', cheek: '#f0a8c8', mouthDrop: .3, mouthW: .03 });
  },
  espejalba(k) {
    k.ball('#f4f8f8', [0, .62, -.05], [.5, .45, .62]); k.ball('#d2ecf2', [0, .55, .32], [.3, .3, .2]);
    k.tube('#f4f8f8', [[0, .82, .26], [0, 1.08, .36], [0, 1.3, .36], [0, 1.48, .32]], .11);
    const head = { c: [0, 1.6, .32], r: [.21, .19, .21] };
    k.ball('#f4f8f8', head.c, head.r);
    k.cone('#e8be5c', [0, 1.56, .58], [.055, .2, .055], [Math.PI / 2, 0, 0]);
    for (let i = -1; i <= 1; i++) k.cone('#7cc8e8', [i * .07, 1.82, .22 - Math.abs(i) * .04], [.04, .2 - Math.abs(i) * .04, .04], [-.4, 0, -i * .3]);
    const mirror = k.M('#bfe6f6', { metalness: .55, roughness: .12, emissive: '#9ad8f0', emissiveIntensity: .25 });
    for (const x of [-1, 1]) {
      const wing = new T.Group(); wing.position.set(x * .5, .98, -.12); wing.rotation.set(0, -x * .55, -x * .12); k.add(SPHERE(), '#dcecf2', [x * .26, 0, 0], [.34, .54, .07], null, wing);
      k.add(SPHERE(), mirror, [x * .26, 0, .045], [.27, .45, .04], null, wing); k.add(SPHERE_LO(), '#ffffff', [x * .2, .14, .08], [.035, .24, .01], [0, 0, -x * .25], wing);
      wing.updateMatrixWorld(true); k.root.add(wing);
    }
    for (let i = -1; i <= 1; i++) k.ball('#c4e4ec', [i * .14, .7, -.62], [.08, .12, .2], [-.6, 0, i * .3]);
    k.face(head, { spread: .5, el: 1.34, size: .05, iris: '#3a5aa0', cheek: '#f4c0c8', mouth: 'none' });
  }
};

// Modelo de la especie (grupo con piezas fusionadas, salvo los ojos). model.userData.eyes = grupos de ojos.
export function creatureModel(r, sp) {
  const build = BUILD[sp];
  if (!build) throw new Error(`Especie sin modelo: ${sp}`);
  const g = new T.Group(), k = kit(r, g);
  build(k);
  r.batch(g);
  g.userData.eyes = k.eyes;
  return g;
}
