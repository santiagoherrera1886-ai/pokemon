// Personajes 3D de Puchamon con la dirección visual aprobada (aventura anime 3D):
// unas 4 cabezas de alto, anatomía continua (torso, cuello y extremidades torneados, rodillas que doblan al
// caminar), cara pintada e integrada en la cabeza (faces.js), pelo en mechones esculpidos con silueta propia
// y ropa con paneles, vueltas, cuellos, cremalleras, suelas y costuras. Materiales mates y luz suave.
// Los colores salen de LOOKS (art/characters.js); la forma de cada personaje sale de DESIGN (abajo): cada NPC
// tiene su complexión, su cara, su peinado y su ropa; no son recoloreados del protagonista.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LOOKS } from '../art/characters.js';
import { headGeometry, faceGeometry, faceMaterial, headRadius } from './faces.js';

// ---------- Geometrías compartidas (batch() las clona al fusionar; no se liberan por personaje) ----------
const G = {};
const geo = (key, make) => G[key] || (G[key] = make());
const sphere = () => geo('sphere', () => new T.SphereGeometry(1, 24, 16));
const capG = t => geo('cap' + t, () => new T.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * t));
const panelG = () => geo('panel', () => new T.SphereGeometry(1, 20, 10, Math.PI / 2 - 1, 2, .12, Math.PI * .38));
const rbox = () => geo('rbox', () => new RoundedBoxGeometry(1, 1, 1, 3, .32));
const cyl = () => geo('cyl', () => new T.CylinderGeometry(1, 1, 1, 20));
const halfDisc = () => geo('half', () => new T.CylinderGeometry(1, 1, 1, 24, 1, false, -Math.PI / 2, Math.PI));
// Visera de gorra: media luna con grosor que se curva hacia abajo en los lados (medidas reales).
const visorG = (w, d, th) => geo('visor' + w + d + th, () => {
  const g = new T.CylinderGeometry(1, 1, th, 28, 1, false, -Math.PI / 2, Math.PI), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) * w, z = p.getZ(i) * d; p.setXYZ(i, x, p.getY(i) - (x / w) ** 2 * w * .32 - z * .12, z); }
  g.computeVertexNormals(); return g;
});
// Aro con radio EXTERIOR 1 (así la escala es el radio de afuera y los dobladillos no se salen de la ropa).
const torusG = (tube = .3) => geo('tor' + tube, () => new T.TorusGeometry(1 / (1 + tube), tube / (1 + tube), 8, 30));
const k3 = v => Math.round(v * 1000);
// Torneado de un perfil [[radio, y], ...] con y creciente. gap: abertura al frente (chaquetas y batas abiertas).
// pleats: pliegues verticales (faldas). front: sólo un arco al frente (delantales).
function lathe(pts, { gap = 0, seg = 26, pleats = 0, front = 0 } = {}) {
  const key = 'L' + pts.map(([r, y]) => k3(r) + ',' + k3(y)).join(';') + '|' + gap + '|' + seg + '|' + pleats + '|' + front;
  return geo(key, () => {
    const v = pts.map(([r, y]) => new T.Vector2(Math.max(.0005, r), y));
    const g = front ? new T.LatheGeometry(v, seg, -front, front * 2) : new T.LatheGeometry(v, seg, gap / 2, Math.PI * 2 - gap);
    if (pleats) {
      const p = g.attributes.position, ys = pts.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), t = (y1 - y) / (y1 - y0);
        const f = 1 + pleats * t * Math.cos(a * 14);
        p.setX(i, x * f); p.setZ(i, z * f);
      }
    }
    g.computeVertexNormals();
    return g;
  });
}
// Tela con grosor: sube por fuera y baja por dentro (así se ve el revés por las aberturas).
const shell = (outer, th = .007) => [...outer, ...outer.slice().reverse().map(([r, y]) => [Math.max(.001, r - th), y]), outer[0]];
// Extremidad torneada que cuelga desde y = 0 hasta y = -len, con puntas redondeadas.
function limbPts(len, r0, r1, bulge = 0) {
  const pts = [[0, -len - r1 * .45], [r1 * .72, -len - r1 * .2]];
  for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([r1 + (r0 - r1) * t + Math.sin(t * Math.PI) * bulge, -len + len * t]); }
  pts.push([r0 * .72, r0 * .3], [0, r0 * .5]);
  return pts;
}
// Mechón de pelo: cono aplanado que sale de la raíz (y = 0) hasta la punta (y = len), curvado hacia afuera
// (bend > 0) o abrazando la cabeza (bend < 0), con giro lateral (curl). Geometría propia: se libera al fusionar.
function lockGeometry(len, wid, thick, bend, curl) {
  // Huso: nace fino en la raíz (sin borde que asome), se ensancha y termina en punta.
  const w = wid / 2, prof = [[0, 0], [w * .55, len * .06], [w * .92, len * .2], [w, len * .34], [w * .82, len * .55], [w * .48, len * .78], [w * .16, len * .94], [0, len]];
  const g = new T.LatheGeometry(prof.map(([x, y]) => new T.Vector2(Math.max(.0004, x), y)), 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / len;
    p.setZ(i, p.getZ(i) * thick + bend * len * t * t);
    p.setX(i, p.getX(i) + curl * len * t * t);
  }
  g.computeVertexNormals();
  return g;
}

// Complexiones: alto de la cadera, largo del torso, medio ancho de hombros y caderas, largo del brazo,
// escala de la cabeza y grosor. Con la cabeza de ~0,38, un adolescente mide unas 4 cabezas.
const BUILDS = {
  kid: { hip: .5, torso: .3, sh: .125, hp: .1, arm: .42, head: .97, girth: .92 },
  teen: { hip: .64, torso: .36, sh: .152, hp: .106, arm: .5, head: 1, girth: 1 },
  adult: { hip: .74, torso: .41, sh: .168, hp: .114, arm: .57, head: 1.02, girth: 1.05 },
  big: { hip: .74, torso: .44, sh: .205, hp: .138, arm: .6, head: 1.05, girth: 1.28 },
  elder: { hip: .66, torso: .38, sh: .158, hp: .114, arm: .54, head: 1, girth: 1.08, hunch: 1 }
};

// Diseño de cada personaje (lo que no está en LOOKS): complexión, expresión, prendas y accesorios.
const DESIGN = {
  player: { build: 'teen', face: 'bold', top: 'jacket', bottom: 'shorts', shoes: 'sneakers', socks: 1, pack: 'backpack', leaves: 1 },
  rival: { build: 'teen', face: 'smirk', top: 'track', bottom: 'pants', shoes: 'sneakers' },
  mom: { build: 'adult', face: 'kind', top: 'blouse', bottom: 'skirt', shoes: 'flats', fem: 1 },
  prof: { build: 'adult', face: 'calm', top: 'tee', coat: 'lab', bottom: 'pants', shoes: 'boots', glasses: 1, fem: 1 },
  aide: { build: 'adult', face: 'cheer', top: 'tee', coat: 'lab', bottom: 'pants', shoes: 'sneakers' },
  nurse: { build: 'adult', face: 'kind', top: 'dress', shoes: 'flats', fem: 1 },
  clerk: { build: 'adult', face: 'cheer', top: 'shirt', bottom: 'pants', shoes: 'sneakers', glasses: 1 },
  vendor: { build: 'adult', face: 'cheer', top: 'blouse', bottom: 'skirt', shoes: 'flats', fem: 1 },
  kid: { build: 'kid', face: 'grin', top: 'tee', bottom: 'shorts', shoes: 'sneakers', socks: 1, freckles: 1 },
  girl: { build: 'kid', face: 'cheer', top: 'tee', bottom: 'skirt', shoes: 'flats', socks: 1, fem: 1 },
  old: { build: 'elder', face: 'old', top: 'cardigan', bottom: 'pants', shoes: 'boots', cane: 1, glasses: 1 },
  man: { build: 'adult', face: 'calm', top: 'shirt', bottom: 'pants', shoes: 'boots' },
  rivalMom: { build: 'adult', face: 'kind', top: 'blouse', bottom: 'skirt', shoes: 'flats', fem: 1 },
  hiedra: { build: 'adult', face: 'calm', top: 'dress', shoes: 'boots', fem: 1 },
  basalto: { build: 'big', face: 'stern', top: 'shirt', bottom: 'pants', shoes: 'boots', beard: 1, hat: 'helmet' },
  coral: { build: 'adult', face: 'cheer', top: 'tee', bottom: 'pants', shoes: 'sandals', fem: 1 },
  grunt: { build: 'adult', face: 'stern', top: 'uniform', bottom: 'pants', shoes: 'boots' },
  bruma: { build: 'adult', face: 'cool', top: 'dress', coat: 'long', shoes: 'boots', fem: 1 },
  umbra: { build: 'adult', face: 'stern', top: 'shirt', coat: 'long', bottom: 'pants', shoes: 'boots' },
  aurora: { build: 'adult', face: 'kind', top: 'dress', shoes: 'flats', fem: 1 },
  centella: { build: 'adult', face: 'smirk', top: 'tee', coat: 'short', bottom: 'pants', shoes: 'boots', fem: 1 },
  velia: { build: 'adult', face: 'cool', top: 'dress', shoes: 'boots', fem: 1 },
  tinto: { build: 'adult', face: 'cheer', top: 'shirt', bottom: 'pants', shoes: 'boots', bag: 'carriel', hat: 'brim' },
  nevada: { build: 'adult', face: 'calm', top: 'tee', coat: 'long', bottom: 'pants', shoes: 'boots', fem: 1 },
  sabino: { build: 'elder', face: 'old', top: 'shirt', coat: 'lab', bottom: 'pants', shoes: 'boots', beard: 1 },
  hiker: { build: 'big', face: 'grin', top: 'tee', bottom: 'shorts', shoes: 'boots', socks: 1, pack: 'hiking', beard: 1 },
  bugkid: { build: 'kid', face: 'grin', top: 'tee', bottom: 'shorts', shoes: 'sneakers', socks: 1, freckles: 1 },
  swimmer: { build: 'teen', face: 'cheer', top: 'tee', bottom: 'shorts', shoes: 'sandals', goggles: 1 },
  lass: { build: 'teen', face: 'cheer', top: 'blouse', bottom: 'skirt', shoes: 'flats', socks: 1, fem: 1 },
  sailor: { build: 'big', face: 'grin', top: 'sailor', bottom: 'pants', shoes: 'boots', beard: 1, hat: 'captain' },
  guard: { build: 'adult', face: 'stern', top: 'uniform', bottom: 'pants', shoes: 'boots', badge: 1, hat: 'police' },
  courier: { build: 'teen', face: 'cheer', top: 'tee', bottom: 'shorts', shoes: 'sneakers', socks: 1, bag: 'messenger' }
};
const EYES = { player: '#3a5a9a', rival: '#3f8a52', mom: '#7a4a2e', prof: '#3e6a4a', nurse: '#c0507a', hiedra: '#2f7a3a', coral: '#2a7ac0', bruma: '#7a5ab0', umbra: '#b83a3a', aurora: '#3a9ad0', grunt: '#7a3a5a', centella: '#c89a18', velia: '#8a6ad0', tinto: '#5a3a1e', nevada: '#2f8ac8', sabino: '#8a6a2a', vendor: '#6a4a2a' };

function shade(hex, f) { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); }
const lum = hex => { const c = new T.Color(hex); return c.r * .3 + c.g * .59 + c.b * .11; };

// Diseño final de un personaje: el de la tabla, o el del avatar (que trae skirt, lashes, eyes y wearCap).
function designFor(look, L) {
  if (typeof look === 'object' || look === 'player') {
    const fem = !!L.skirt;
    return { ...DESIGN.player, bottom: fem ? 'skirt' : 'shorts', fem, lashes: !!L.lashes };
  }
  return DESIGN[look] || { build: 'adult', face: 'calm', top: 'tee', bottom: 'pants', shoes: 'sneakers' };
}

// ---------- Pelo: casco y mechones sobre una elipse alrededor del cráneo ----------
const HS = { y: .02, z: -.014, rx: .19, ry: .212, rz: .202 };
const _basis = new T.Matrix4();
function onScalp(a, e, k = 1) {
  const ce = Math.cos(e), se = Math.sin(e), sa = Math.sin(a), ca = Math.cos(a);
  return {
    p: new T.Vector3(HS.rx * k * ce * sa, HS.y + HS.ry * k * se, HS.z + HS.rz * k * ce * ca),
    n: new T.Vector3(ce * sa, se, ce * ca),
    d: new T.Vector3(se * sa, -ce, se * ca)
  };
}

// look: nombre de LOOKS o un objeto con los mismos campos (el avatar).
export function person(r, look = 'player') {
  const L = typeof look === 'object' ? look : (LOOKS[look] || LOOKS.player);
  const D = designFor(look, L), B = BUILDS[D.build] || BUILDS.adult;
  const fem = !!(D.fem || L.skirt), g = B.girth, tl = B.torso;
  const skirt = D.bottom === 'skirt', dress = D.top === 'dress';
  const OPT = { roughness: .8 };
  const mat = c => r.mat(c, OPT);
  const root = new T.Group();
  const add = (parent, gm, color, p, s, rot) => {
    const m = new T.Mesh(gm, typeof color === 'string' ? mat(color) : color);
    m.position.set(...p); m.scale.set(...s); if (rot) m.rotation.set(...rot);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (parent, color, p, s, rot) => add(parent, sphere(), color, p, s, rot);
  const tube = (parent, color, pts, p, s = [1, 1, 1], o, rot) => add(parent, lathe(pts, o), color, p, s, rot);
  // Fusiona un grupo y marca el resultado para que un grupo padre no lo vuelva a fusionar.
  const seal = grp => { r.batch(grp); for (const c of grp.children) if (c.isMesh) c.userData.keep = true; return grp; };

  const hipY = B.hip, shY = hipY + tl, top = L.coat || L.shirt;
  const jacketColor = L.shirt, tee = L.accent || '#f6f0e2';
  const shirtColor = D.top === 'jacket' ? tee : L.shirt;

  // ---------------- Cuerpo (estático) ----------------
  const body = new T.Group(); root.add(body);
  const torsoRows = fem
    ? [[.112, -.12], [.118, .02], [.1, .3], [.096, .42], [.11, .62], [.117, .77], [.11, .89], [.078, .965], [.044, 1]]
    : [[.108, -.12], [.112, .02], [.104, .3], [.106, .45], [.122, .66], [.128, .79], [.118, .9], [.08, .965], [.045, 1]];
  const torso = torsoRows.map(([rr, y]) => [rr * g * (B.sh / .152) ** .6, y * tl]);
  const tz = .74;                                  // el torso es más plano de frente a espalda
  tube(body, dress ? L.shirt : shirtColor, torso, [0, hipY, 0], [1, 1, tz]);
  for (const s of [-1, 1]) ball(body, D.top === 'jacket' || D.top === 'tee' || D.top === 'blouse' ? (D.top === 'jacket' ? jacketColor : shirtColor) : top, [s * (B.sh - .026), shY - .052, 0], [.046 * g, .044 * g, .046 * g]);
  add(body, cyl(), L.skin, [0, shY + .035, -.008], [.042 * g, .1, .04 * g]);                   // cuello
  // Pelvis: shorts, pantalón o la parte alta de la falda.
  const lower = dress ? L.shirt : (skirt ? L.pants : L.pants);
  const pk = Math.min(1, hipY / .64);
  tube(body, lower, [[.001, -.1 * pk], [.07 * g, -.095 * pk], [.11 * g, -.065 * pk], [.118 * g, -.02], [.117 * g, .05], [.112 * g, .1]], [0, hipY, 0], [1, 1, .8]);
  if (D.bottom !== 'skirt' && !dress) add(body, torusG(.25), shade(L.pants, -.25), [0, hipY + .095, 0], [.113 * g, .113 * g * .8, .05], [Math.PI / 2, 0, 0]); // pretina

  const torsoR = y => { // radio del torso a una altura relativa a la cadera
    for (let i = 1; i < torso.length; i++) if (y <= torso[i][1]) { const [r0, y0] = torso[i - 1], [r1, y1] = torso[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); }
    return torso[torso.length - 1][0];
  };
  const clothAround = (from, to, extra, flare = 0, n = 7) => Array.from({ length: n }, (_, i) => {
    const y = from + (to - from) * i / (n - 1), t = 1 - i / (n - 1);
    return [torsoR(Math.max(-.1, y)) + extra + flare * t * t, y];
  });

  // Prendas de arriba
  if (D.top === 'jacket') {
    // Chaqueta abierta de manga corta: paneles con grosor, cuello alto, cremallera, bolsillos y dobladillo.
    const jk = clothAround(-.04, tl * .955, .016 * g, .012);
    tube(body, jacketColor, shell(jk, .008), [0, hipY, 0], [1, 1, tz + .02], { gap: .62 });
    const edge = a => [Math.sin(a), Math.cos(a)];
    for (const s of [-1, 1]) {
      const [ex, ez] = edge(s * .31), r0 = torsoR(.08 * tl) + .016 * g, r1 = torsoR(.7 * tl) + .016 * g;
      const p0 = [ex * r0, hipY + .0, ez * r0 * (tz + .02)], p1 = [ex * r1, hipY + tl * .86, ez * r1 * (tz + .02)];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
      const m = add(body, cyl(), tee === '#f6f0e2' ? '#efe6d2' : shade(jacketColor, .45), [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + .003], [.0075, len, .007]);
      m.lookAt(new T.Vector3(p1[0], p1[1], p1[2] + .003)); m.rotateX(Math.PI / 2);   // ribete de la cremallera
      const pk = edge(s * .95), rp = torsoR(.2 * tl) + .02 * g;
      add(body, rbox(), '#efe6d2', [pk[0] * rp, hipY + tl * .2, pk[1] * rp * (tz + .02)], [.01, .055, .006], [0, s * .95, s * .35]); // bolsillo
    }
    add(body, torusG(.22), shade(jacketColor, -.1), [0, hipY - .035, 0], [torsoR(-.03) + .02 * g, (torsoR(-.03) + .02 * g) * (tz + .02), .06], [Math.PI / 2, 0, 0]);   // dobladillo
    // Cuello alto abierto adelante, con revés claro.
    tube(body, jacketColor, shell([[.07 * g, 0], [.069 * g, .03], [.074 * g, .058]], .007), [0, shY - .015, -.006], [1, 1, .9], { gap: 1.1 });
    tube(body, '#efe6d2', [[.06 * g, 0], [.06 * g, .05]], [0, shY - .012, -.006], [1, 1, .9], { gap: 1.2 });
    add(body, torusG(.3), shade(tee, -.12), [0, shY - .02, .004], [.058 * g, .048 * g, .05], [Math.PI / 2 + .25, 0, 0]);   // cuello redondo de la camiseta
  } else if (D.top === 'track') {
    // Chaqueta deportiva cerrada: cremallera, cuello alto y franjas en las mangas.
    tube(body, L.shirt, clothAround(-.04, tl * .96, .014 * g, .006), [0, hipY, 0], [1, 1, tz + .02]);
    add(body, rbox(), shade(L.shirt, -.3), [0, hipY + tl * .45, torsoR(.45 * tl) * (tz + .02) + .01], [.008, tl * .95, .006]);
    tube(body, L.shirt, shell([[.068 * g, 0], [.066 * g, .05]], .008), [0, shY - .012, 0], [1, 1, .92]);
    add(body, torusG(.25), L.accent, [0, hipY - .03, 0], [torsoR(-.03) + .016, (torsoR(-.03) + .016) * (tz + .02), .05], [Math.PI / 2, 0, 0]);
  } else if (D.top === 'uniform' || D.top === 'sailor') {
    tube(body, L.shirt, clothAround(-.06, tl * .96, .012 * g, .02), [0, hipY, 0], [1, 1, tz + .02]);
    add(body, torusG(.3), shade(L.pants, -.2), [0, hipY + .02, 0], [torsoR(.02) + .016, (torsoR(.02) + .016) * (tz + .02), .07], [Math.PI / 2, 0, 0]); // cinturón
    add(body, rbox(), L.accent, [0, hipY + .02, (torsoR(.02) + .016) * (tz + .02)], [.035, .025, .012]);                           // hebilla
    for (let i = 0; i < 4; i++) ball(body, L.accent, [0, hipY + .07 + i * tl * .2, torsoR(.07 + i * tl * .2) * tz + .009], [.008, .008, .005]);
    if (D.top === 'sailor') {
      add(body, rbox(), L.accent, [0, shY - .07, -torsoR(tl * .85) * tz - .006], [.2 * g, .14, .012], [.2, 0, 0]);                // cuello de marinero
      for (const s of [-1, 1]) add(body, rbox(), L.accent, [s * .04, shY - .06, torsoR(tl * .85) * tz + .004], [.035, .1, .008], [-.15, 0, s * .5]);
      add(body, rbox(), '#d84848', [0, shY - .1, torsoR(tl * .8) * tz + .012], [.03, .035, .01]);                                 // pañoleta
    } else for (const s of [-1, 1]) add(body, rbox(), shade(L.shirt, -.2), [s * .045, shY - .03, torsoR(tl * .9) * tz + .004], [.05, .03, .01], [-.2, 0, s * .45]);
  } else if (D.top === 'cardigan') {
    tube(body, L.shirt, shell(clothAround(-.1, tl * .95, .014 * g, .015), .008), [0, hipY, 0], [1, 1, tz + .02], { gap: .5 });
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) if (s > 0) ball(body, L.accent, [s * .03, hipY + .02 + i * tl * .22, torsoR(.02 + i * tl * .22) * tz + .016], [.009, .009, .006]);
  } else if (D.top === 'blouse' || D.top === 'shirt' || D.top === 'dress') {
    for (const s of [-1, 1]) add(body, rbox(), D.top === 'shirt' ? shade(L.shirt, .18) : L.accent, [s * .036, shY - .03, torsoR(tl * .9) * tz + .006], [.055, .028, .01], [-.2, 0, s * .5]); // cuello
    if (D.top === 'shirt') for (let i = 0; i < 4; i++) ball(body, shade(L.shirt, .3), [0, hipY + .06 + i * tl * .2, torsoR(.06 + i * tl * .2) * tz + .004], [.007, .007, .004]);
  } else {
    add(body, torusG(.3), shade(L.shirt, -.15), [0, shY - .018, .004], [.058 * g, .048 * g, .05], [Math.PI / 2 + .25, 0, 0]);   // camiseta: cuello redondo
    add(body, torusG(.22), shade(L.shirt, -.12), [0, hipY - .02, 0], [torsoR(-.02) + .004, (torsoR(-.02) + .004) * tz, .05], [Math.PI / 2, 0, 0]);
    if (L.accent && D.build !== 'kid') add(body, rbox(), L.accent, [0, hipY + tl * .62, torsoR(.62 * tl) * tz + .004], [.07 * g, .045, .006]);   // estampado
  }
  // Falda y vestido: con pliegues suaves.
  let skirtPts = null;
  if (skirt || dress) {
    const len = dress ? hipY * .52 : hipY * .4, r0 = .118 * g, r1 = (dress ? .2 : .19) * g;
    skirtPts = [[r1, -len], [r1 * .97, -len * .7], [r0 * 1.1, -len * .3], [r0, -.05], [r0 * .97, .1]];
    tube(body, dress ? L.shirt : L.pants, shell(skirtPts, .008), [0, hipY, 0], [1, 1, .9], { pleats: .05, seg: 42 });
    add(body, torusG(.3), dress ? L.accent : shade(L.pants, -.2), [0, hipY + .09, 0], [r0 * .99, r0 * .99 * .9, .06], [Math.PI / 2, 0, 0]);
  }
  // Batas y abrigos (laboratorio, abrigos largos, chaqueta corta de líder).
  if (D.coat) {
    const coatC = L.coat || shade(L.shirt, -.25), long = D.coat !== 'short', bottom = long ? -hipY * .52 : -.06;
    const pts = [[(.2 + (long ? .03 : 0)) * g, bottom], ...clothAround(Math.max(-.1, bottom * .4), tl * .95, .02 * g, 0, 6)];
    pts.sort((a, b) => a[1] - b[1]);
    tube(body, coatC, shell(pts, .009), [0, hipY, 0], [1, 1, tz + .06], { gap: long ? .7 : .8 });
    for (const s of [-1, 1]) add(body, rbox(), shade(coatC, -.08), [s * .06, shY - .07, torsoR(tl * .8) * (tz + .06) + .016], [.035, .13, .01], [-.15, 0, s * .32]); // solapas
    if (long) for (const s of [-1, 1]) add(body, rbox(), shade(coatC, -.12), [s * .13 * g, hipY - .02, (torsoR(0) + .03) * (tz + .06)], [.05, .006, .012], [0, s * .7, 0]); // bolsillos
  }
  if (L.apron) {
    const ap = skirtPts ? skirtPts.map(([rr, y]) => [rr * 1.08 + .012, y * (y < 0 ? .9 : 1)]) : [[.15 * g, -hipY * .4], [.13 * g, -.1], [.125 * g, .05], [.122 * g, .1]];
    tube(body, L.apron, ap, [0, hipY, .004], [1, 1, .9], { front: .85, seg: 16 });
    tube(body, L.apron, [[.112 * g, .2 * tl], [.118 * g, .5 * tl], [.11 * g, .78 * tl]], [0, hipY, .008], [1, 1, tz + .02], { front: .6, seg: 10 });
    add(body, torusG(.25), shade(L.apron, -.15), [0, hipY + .09, 0], [.124 * g, .124 * g * .82, .045], [Math.PI / 2, 0, 0]);
  }
  if (L.scarf) {
    add(body, torusG(.42), L.scarf, [0, shY + .005, -.004], [.072 * g, .066 * g, .07], [Math.PI / 2 - .12, 0, 0]);
    add(body, rbox(), L.scarf, [.045, shY - .1, torsoR(tl * .7) * tz + .028], [.045, .15, .018], [-.1, 0, .12]);
    add(body, rbox(), shade(L.scarf, -.1), [.065, shY - .06, torsoR(tl * .8) * tz + .03], [.04, .1, .016], [-.1, 0, -.3]);
  }
  if (D.badge) add(body, rbox(), '#f0c040', [-.07 * g, shY - .1, torsoR(tl * .72) * (tz + .02) + .006], [.03, .036, .008]);
  // Mochilas y bolsos
  const backZ = -torsoR(tl * .6) * (tz + .03) - .01;
  if (D.pack === 'backpack' || D.pack === 'hiking' || (L.bag && !D.bag && !D.pack)) {
    const big = D.pack === 'hiking', bc = D.pack === 'backpack' || big ? L.bag : L.bag, w = (big ? .27 : .21) * g, h = big ? .34 : .24;
    const pack = new T.Group(); pack.position.set(0, shY - .2 - (big ? .04 : 0), backZ - (big ? .07 : .05)); body.add(pack);
    add(pack, rbox(), bc, [0, 0, 0], [w, h, big ? .16 : .11]);
    add(pack, rbox(), shade(bc, -.18), [0, h * .32, -.008], [w * 1.02, h * .36, big ? .15 : .1]);                        // tapa
    add(pack, rbox(), '#efe6d2', [0, -h * .3, -.012], [w * .94, h * .3, big ? .15 : .1]);                                  // bolsillo de abajo
    if (!big) {
      add(pack, cyl(), '#efe6d2', [0, .005, -.058], [.05, .012, .05], [Math.PI / 2, 0, 0]);                              // disco
      add(pack, cyl(), '#38b6a8', [0, .005, -.064], [.04, .008, .04], [Math.PI / 2, 0, 0]);
    } else add(pack, cyl(), '#5a6a8a', [0, h * .62, 0], [.06, w * 1.05, .06], [0, 0, Math.PI / 2]);                         // colchoneta enrollada
    for (const s of [-1, 1]) {                                                                                           // correas y hebillas
      add(body, rbox(), shade(bc, -.3), [s * .085 * g, shY - .02, -.035], [.03, .02, .1], [.3, 0, 0]);
      add(body, rbox(), shade(bc, -.3), [s * .088 * g, shY - .14, torsoR(tl * .62) * (tz + .03) + .012], [.026, .2, .008], [-.12, 0, 0]);
      add(body, rbox(), '#c9cdd2', [s * .088 * g, shY - .13, torsoR(tl * .62) * (tz + .03) + .019], [.032, .026, .008]);
    }
  }
  if (D.bag === 'carriel' || D.bag === 'messenger') {
    const bc = L.bag || '#7a5030';
    add(body, rbox(), shade(bc, -.25), [0, hipY + tl * .55, torsoR(tl * .5) * tz + .012], [.022, tl * 1.25, .008], [0, 0, .62]);
    add(body, rbox(), bc, [-.14 * g, hipY - .01, .02], [.05, .13, .14], [0, 0, .05]);
    add(body, rbox(), shade(bc, -.15), [-.165 * g, hipY + .03, .02], [.012, .06, .145]);
  }
  if (B.hunch) { body.rotation.x = .12; body.position.z = -.02; }
  r.batch(body);

  // ---------------- Cabeza (pivote en el cuello) ----------------
  const headY = shY + .07, hk = B.head;
  const head = new T.Group(); head.position.set(0, headY, B.hunch ? .05 : 0); root.add(head);
  const skull = new T.Group(); skull.position.set(0, .175 * hk, .012); skull.scale.setScalar(hk); head.add(skull);
  add(skull, headGeometry(), L.skin, [0, 0, 0], [1, 1, .97]);
  for (const s of [-1, 1]) ball(skull, L.skin, [s * .16, -.035, -.01], [.022, .042, .03], [0, s * .3, 0]);       // orejas
  const hair = L.hair, hairD = shade(hair, -.2), hairM = mat(hair), hairDM = mat(hairD);
  const style = L.style, capOn = style === 'cap' || !!L.wearCap, hs = style === 'cap' ? 'capHair' : style;
  const lockMesh = (a, e, len, wid, o = {}) => {
    const s = onScalp(a, e, o.k ?? .97), side = new T.Vector3().crossVectors(s.n, s.d).normalize();
    const y = (o.world ? new T.Vector3(...o.world) : s.d.clone().multiplyScalar(o.down ?? 1)).addScaledVector(s.n, o.out ?? .3).addScaledVector(side, o.side ?? 0).normalize();
    const z = s.n.clone().addScaledVector(y, -s.n.dot(y)).normalize(), x = new T.Vector3().crossVectors(y, z);
    const m = new T.Mesh(lockGeometry(len, wid, o.thick ?? .45, o.bend ?? .1, o.curl ?? 0), o.dark ? hairDM : hairM);
    m.quaternion.setFromRotationMatrix(_basis.makeBasis(x, y, z)); m.position.copy(s.p);
    m.userData.ownedGeometry = true; m.castShadow = true; skull.add(m); return m;
  };
  const mass = (t = .6, tilt = -.9, k = .985) => add(skull, capG(t), hair, [0, HS.y, HS.z], [HS.rx * k, HS.ry * k, HS.rz * k], [tilt, 0, 0]);
  const bangs = (n, len, { spread = .62, e = .66, side = 0, curl = .14, wid = .085, bend = -.1, out = .12 } = {}) => {
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : i / (n - 1) * 2 - 1, alt = i % 2 ? 1 : -1;
      lockMesh(k * spread, e + (1 - Math.abs(k)) * .04, len * (1 - Math.abs(k) * .18) * (i % 2 ? .9 : 1), wid, { down: 1, out, side: side + k * .25, curl: curl * alt + side * .15, bend, dark: i % 3 === 1 });
    }
  };
  const fringeSides = (len, out = .45, bend = .25) => { for (const s of [-1, 1]) { lockMesh(s * 1.18, .28, len, .075, { out, bend, curl: s * .12, side: s * .2 }); lockMesh(s * 1.5, .12, len * .9, .07, { out: out + .1, bend, curl: -s * .1, dark: true }); } };
  const backFlicks = (n, len, out = .55, bend = .3, e = .15) => { for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : i / (n - 1) * 2 - 1; lockMesh(Math.PI + k * 1.05, e + (i % 2) * .12, len * (i % 2 ? .85 : 1), .09, { out, bend, curl: k * .2, dark: i % 2 === 0 }); } };
  if (hs === 'hood') {
    const hc = L.hood || '#3a2c4a';
    mass(); bangs(5, .12);
    add(skull, capG(.64), hc, [0, .02, -.02], [.235, .245, .235], [-.82, 0, 0]);
    add(skull, torusG(.28), shade(hc, -.25), [0, .06, .14], [.18, .2, .2], [-.82 + Math.PI / 2 - .2, 0, 0]);
    add(skull, cyl(), L.accent, [0, .21, .14], [.03, .008, .03], [.75, 0, 0]);
  } else if (hs === 'bald') {
    for (const [a, e, sz] of [[1.45, .1, .034], [1.75, .07, .038], [2.15, .05, .04], [2.6, .04, .04], [Math.PI, .03, .04]]) for (const s of a === Math.PI ? [1] : [-1, 1]) {
      const q = onScalp(s * a, e, .9); ball(skull, hair, [q.p.x, q.p.y, q.p.z], [sz * .9, sz * 1.25, sz]);
    }
  } else if (hs === 'buzz') {
    mass(.6, -1.02, .968);
    for (const s of [-1, 1]) lockMesh(s * 1.25, .05, .06, .05, { out: .05, bend: -.1 });
  } else {
    if (hs === 'curly') {
      mass(.62, -.95);
      const curls = [[0, .9], [-.5, .85], [.5, .85], [-.9, .6], [.9, .6], [-1.3, .4], [1.3, .4], [-1.7, .3], [1.7, .3], [Math.PI, .4], [Math.PI - .6, .5], [Math.PI + .6, .5], [Math.PI, .9], [-.3, 1.15], [.3, 1.15], [Math.PI - 1.1, .2], [Math.PI + 1.1, .2], [Math.PI, .05]];
      curls.forEach(([a, e], i) => { if (capOn && e > .55) return; const s = onScalp(a, e, 1.02); ball(skull, i % 3 ? hair : hairD, [s.p.x, s.p.y, s.p.z], [.05, .048, .05]); });
      bangs(5, .08, { wid: .08, curl: .3, bend: .15 });
    } else if (hs === 'capHair') {
      mass(.6, -.9, .975);
      bangs(4, .1, { spread: .5, e: .55 });
      fringeSides(.11);
      backFlicks(4, .1, .5, .25, .1);
    } else {
      mass(.6, -.9, capOn ? .95 : .985);
      if (hs === 'short') {
        bangs(5, .125, { curl: .18 });
        fringeSides(.12, .5, .28);
        backFlicks(5, .13, .55, .3);
        if (!capOn) { for (const [a, e, l] of [[Math.PI - .4, 1.15, .12], [Math.PI + .4, 1.12, .11], [Math.PI, .9, .13], [-.7, 1.2, .1], [.7, 1.2, .1]]) lockMesh(a, e, l, .11, { down: 1, out: .4, bend: .2, curl: .1 }); }
      } else if (hs === 'spiky') {
        bangs(5, .125, { curl: .22, out: .2 });
        fringeSides(.13, .45, .3);
        backFlicks(5, .16, .7, .35, .2);
        if (!capOn) for (const [a, e, l] of [[Math.PI - .5, 1.05, .16], [Math.PI + .5, 1.02, .15], [Math.PI - 1.2, .85, .15], [Math.PI + 1.2, .82, .15], [Math.PI, .8, .17]]) lockMesh(a, e, l, .12, { down: 1, out: .3, bend: .22, curl: Math.sin(a) * .15 });
      } else if (hs === 'long') {
        bangs(6, .14, { side: -.3, curl: .08, spread: .7 });
        for (const s of [-1, 1]) { lockMesh(s * 1.12, .32, .34, .11, { world: [s * .12, -1, .12], out: .05, bend: -.03, curl: s * .03 }); lockMesh(s * 1.5, .22, .4, .12, { world: [s * .14, -1, -.02], out: .05, bend: -.03, dark: true }); }
        for (let i = 0; i < 6; i++) { const k = i / 5 * 2 - 1, a = Math.PI + k * 1.0; lockMesh(a, .42, .5 - Math.abs(k) * .07, .17, { world: [Math.sin(a) * .14, -1, Math.cos(a) * .14 - .04], out: .04, bend: -.03, curl: k * .03, thick: .5, dark: i % 2 === 1 }); }
        ball(skull, hair, [0, -.1, -.14], [.17, .22, .11]);
      } else if (hs === 'bob') {
        bangs(7, .13, { curl: .04, spread: .72, wid: .075 });
        for (let i = 0; i < 7; i++) { const k = i / 6 * 2 - 1, a = Math.PI + k * 2.1; lockMesh(a, .25, .22, .12, { out: .15, bend: -.18, curl: -k * .03, thick: .55, dark: i % 2 === 1 }); }
      } else if (hs === 'tail') {
        bangs(5, .14, { curl: .14 });
        for (const s of [-1, 1]) lockMesh(s * 1.2, .25, .2, .06, { out: .05, bend: -.05 });
        const tie = onScalp(Math.PI, .5, 1.02);
        add(skull, torusG(.35), L.accent, [tie.p.x, tie.p.y, tie.p.z], [.035, .035, .035], [-.5, 0, 0]);
        for (const [sx, l, dk] of [[0, .36, false], [-.03, .3, true], [.03, .32, true]]) {
          const m = new T.Mesh(lockGeometry(l, .1, .55, .25, sx * 3), dk ? hairDM : hairM);
          m.position.set(tie.p.x + sx, tie.p.y, tie.p.z - .01); m.rotation.set(Math.PI * .86, 0, sx * 4);
          m.userData.ownedGeometry = true; m.castShadow = true; skull.add(m);
        }
      } else if (hs === 'bun') {
        bangs(5, .13, { curl: .12 });
        for (const s of [-1, 1]) lockMesh(s * 1.2, .25, .16, .05, { out: .05, bend: -.05 });
        const b = onScalp(Math.PI, .95, 1.1);
        ball(skull, hair, [b.p.x, b.p.y, b.p.z], [.085, .08, .085]);
        ball(skull, hairD, [b.p.x, b.p.y + .03, b.p.z - .03], [.05, .04, .05]);
        add(skull, torusG(.3), L.accent, [b.p.x, b.p.y - .045, b.p.z + .03], [.055, .055, .05], [-.6, 0, 0]);
      } else {
        bangs(5, .13); fringeSides(.11); backFlicks(4, .11);
      }
    }
  }
  // Brillo del pelo: un arco claro en la coronilla, como en las ilustraciones.
  // Barba, bigote, gafas y gafas de natación
  if (D.beard) { ball(skull, hairD, [0, -.15, .07], [.12, .07, .1]); for (const s of [-1, 1]) ball(skull, hairD, [s * .12, -.1, .04], [.04, .09, .07]); }
  const must = L.mustache || (D.beard ? hairD : (look === 'old' || look === 'sabino') ? hair : null);
  if (must) for (const s of [-1, 1]) ball(skull, must, [s * .022, -.105, headRadius(-.105) * .97 + .006], [.03, .012, .012], [0, 0, s * .3]);
  if (D.glasses) {
    const gc = '#4a3a32', z = headRadius(-.032) * .97 + .016;
    for (const s of [-1, 1]) add(skull, torusG(.13), gc, [s * .064, -.032, z - .006], [.046, .04, .04], [0, s * .32, 0]);
    add(skull, cyl(), gc, [0, -.022, z], [.004, .03, .004], [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) add(skull, cyl(), gc, [s * .145, -.025, z - .07], [.004, .13, .004], [Math.PI / 2, 0, 0]);
  }
  if (D.goggles) {
    add(skull, torusG(.2), '#2a3a4a', [0, .1, -.005], [.19, .19, .2], [Math.PI / 2 - .5, 0, 0]);
    for (const s of [-1, 1]) add(skull, cyl(), '#7ad0f8', [s * .055, .14, .15], [.038, .025, .03], [1.0, 0, 0]);
  }
  // Sombreros
  const hatKind = D.hat || (L.helmet ? 'helmet' : L.brim ? 'brim' : capOn ? 'baseball' : null);
  const hc = L.hat || '#e2603f', band = L.hatBand || '#f6f0e2';
  if (hatKind === 'baseball') {
    add(skull, capG(.5), hc, [0, .066, -.014], [.206, .17, .218], [-.12, 0, 0]);
    add(skull, panelG(), band, [0, .066, -.014], [.209, .173, .221], [-.12, 0, 0]);
    add(skull, sphere(), shade(hc, -.1), [0, .232, -.036], [.018, .01, .018]);
    add(skull, visorG(.158, .155, .014), hc, [0, .078, .168], [1, 1, 1], [.12, 0, 0]);
    add(skull, visorG(.152, .148, .006), shade(hc, -.22), [0, .07, .17], [1, 1, 1], [.12, 0, 0]);
    if (D.leaves) for (const s of [-1, 1]) add(skull, sphere(), '#2fa89a', [s * .022, .16, .186], [.025, .012, .006], [-.6, s * .25, s * .7]);
    else add(skull, cyl(), hc, [0, .16, .188], [.022, .006, .022], [Math.PI / 2 - .55, 0, 0]);
  } else if (hatKind === 'police' || hatKind === 'captain') {
    const crown = hatKind === 'captain' ? '#f6f6f2' : hc;
    add(skull, cyl(), crown, [0, .14, -.01], [.215, .1, .215], [-.12, 0, 0]);
    add(skull, cyl(), shade(crown, .08), [0, .19, -.016], [.23, .02, .23], [-.12, 0, 0]);
    add(skull, cyl(), hatKind === 'captain' ? '#2a3a6a' : shade(hc, -.3), [0, .1, -.006], [.205, .04, .205], [-.12, 0, 0]);
    add(skull, halfDisc(), '#1e2228', [0, .085, .16], [.165, .012, .13], [.28, 0, 0]);
    add(skull, rbox(), '#f0c040', [0, .15, .2], [.04, .036, .012], [-.12, 0, 0]);
  } else if (hatKind === 'helmet') {
    add(skull, capG(.5), hc, [0, .07, -.01], [.225, .19, .235]);
    add(skull, torusG(.2), shade(hc, -.12), [0, .075, -.01], [.235, .245, .14], [Math.PI / 2, 0, 0]);
    add(skull, rbox(), shade(hc, .12), [0, .2, -.01], [.03, .1, .4]);
  } else if (hatKind === 'brim') {
    add(skull, capG(.5), hc, [0, .11, -.01], [.2, .14, .2], [-.06, 0, 0]);
    add(skull, torusG(.14), band, [0, .125, -.008], [.198, .198, .2], [Math.PI / 2 - .06, 0, 0]);
    add(skull, cyl(), hc, [0, .118, .0], [.36, .012, .35], [-.06, 0, 0]);
    add(skull, torusG(.08), shade(hc, -.1), [0, .118, 0], [.36, .35, .12], [Math.PI / 2 - .06, 0, 0]);
    for (let i = 0; i < 6; i++) add(skull, torusG(.06), band, [0, .124, 0], [.25 + i * .02, .245 + i * .02, .1], [Math.PI / 2 - .06, 0, 0]); // vueltas tejidas
  }
  if (L.cap) { add(skull, rbox(), L.cap, [0, .19, .06], [.15, .07, .09], [.5, 0, 0]); add(skull, rbox(), L.accent, [0, .2, .11], [.03, .012, .006], [.5, 0, 0]); add(skull, rbox(), L.accent, [0, .2, .11], [.012, .03, .006], [.5, 0, 0]); }
  seal(skull);
  // Cara pintada (se queda aparte para parpadear)
  const browC = lum(hair) > .55 ? shade(hair, -.42) : shade(hair, -.15);
  const face = new T.Mesh(faceGeometry(), faceMaterial({ iris: L.eyes || EYES[look] || shade(hair, -.1), brow: browC, face: D.face, lashes: !!(D.lashes ?? (fem && D.face !== 'stern')), freckles: !!D.freckles, wrinkles: D.face === 'old' }));
  face.scale.set(1, 1, .97); face.userData.ownedMaterial = true; face.renderOrder = 2; skull.add(face);

  // ---------------- Brazos (pivote en el hombro) ----------------
  const limbs = [], ua = B.arm * .47, fa = B.arm * .42;
  const longSleeve = D.coat || ['track', 'uniform', 'cardigan', 'sailor'].includes(D.top);
  const sleeveC = D.coat ? (L.coat || shade(L.shirt, -.25)) : D.top === 'jacket' ? jacketColor : L.shirt;
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * (B.sh + .004), shY - .05, 0); root.add(arm);
    tube(arm, L.skin, limbPts(ua, .045 * g, .036 * g, .005), [0, 0, 0]);
    if (!dress || D.coat) {
      if (longSleeve) tube(arm, sleeveC, shell([[.048 * g, -ua], [.053 * g, -ua * .5], [.058 * g, -.01], [.045 * g, .022], [.022 * g, .036], [0, .04]], .007), [0, 0, 0]);
      else {
        tube(arm, sleeveC, shell([[.058 * g, -ua * .52], [.059 * g, -ua * .3], [.06 * g, -.01], [.046 * g, .022], [.022 * g, .036], [0, .04]], .007), [0, 0, 0]);
        add(arm, torusG(.28), D.top === 'jacket' ? shade(jacketColor, .14) : shade(sleeveC, -.12), [0, -ua * .5, 0], [.056 * g, .056 * g, .04], [Math.PI / 2, 0, 0]); // vuelta de la manga
      }
    }
    const fore = new T.Group(); fore.position.set(0, -ua, 0); fore.rotation.x = -.18; arm.add(fore);
    tube(fore, L.skin, limbPts(fa, .036 * g, .028 * g, .005), [0, 0, 0]);
    if (longSleeve) {
      tube(fore, sleeveC, shell([[.038 * g, -fa * .86], [.042 * g, -fa * .5], [.046 * g, 0], [.044 * g, .03]], .007), [0, 0, 0]);
      add(fore, torusG(.3), D.top === 'track' ? L.accent : shade(sleeveC, -.15), [0, -fa * .84, 0], [.038 * g, .038 * g, .03], [Math.PI / 2, 0, 0]);
      if (D.top === 'track') add(fore, torusG(.25), L.accent, [0, -fa * .3, 0], [.044 * g, .044 * g, .03], [Math.PI / 2, 0, 0]);
    }
    ball(fore, L.skin, [0, -fa - .03, .004], [.03 * g, .042 * g, .022 * g]);                              // mano
    ball(fore, L.skin, [-side * .012, -fa - .022, .022], [.012, .022, .012], [.3, 0, side * .4]);         // pulgar
    if (D.cane && side < 0) { add(fore, cyl(), '#7a5030', [0, -fa - .03 - hipY * .45, .03], [.012, hipY * .95, .012]); add(fore, torusG(.25), '#7a5030', [.03, -fa - .02, .03], [.03, .03, .03], [0, Math.PI / 2, 0]); }
    r.batch(arm); limbs.push(arm);
  }
  // ---------------- Piernas (pivote en la cadera, rodilla aparte) ----------------
  const knees = [], thigh = hipY * .5 - .005, shin = hipY * .5 - .065;
  for (const side of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(side * B.hp * .58, hipY, 0); root.add(leg);
    const bare = skirt || dress || D.bottom === 'shorts';
    tube(leg, bare ? L.skin : L.pants, limbPts(thigh, .066 * g, .049 * g, .007), [0, 0, 0]);
    if (D.bottom === 'shorts') {
      const cuff = -thigh * .6;
      tube(leg, L.pants, shell([[.075 * g, cuff], [.076 * g, cuff * .5], [.077 * g, .03]], .007), [0, 0, 0]);
      tube(leg, shade(L.pants, .12), shell([[.08 * g, cuff - .016], [.083 * g, cuff + .002], [.08 * g, cuff + .02]], .006), [0, 0, 0]); // vuelta del short
      add(leg, torusG(.12), shade(L.pants, -.25), [0, cuff + .022, 0], [.079 * g, .079 * g, .03], [Math.PI / 2, 0, 0]);                  // costura
    } else if (!bare) tube(leg, L.pants, [[.056 * g, -thigh - .012], [.073 * g, -thigh * .4], [.077 * g, .03]], [0, 0, 0]);
    const knee = new T.Group(); knee.position.set(0, -thigh, 0); leg.add(knee);
    tube(knee, bare ? L.skin : L.pants, limbPts(shin, .049 * g, .032 * g, .009), [0, 0, 0]);
    if (!bare) tube(knee, L.pants, [[.052 * g, -shin + .006], [.055 * g, -shin * .5], [.058 * g, .014]], [0, 0, 0]);
    // Medias
    if (D.socks || D.shoes === 'sneakers') {
      const hi = fem && D.socks && skirt ? shin * .62 : .075;
      tube(knee, '#f7f4ee', [[.033 * g, -shin - .005], [.034 * g, -shin + hi * .5], [.037 * g, -shin + hi]], [0, 0, 0]);
      add(knee, torusG(.2), '#e6e1d6', [0, -shin + hi, 0], [.036 * g, .036 * g, .03], [Math.PI / 2, 0, 0]);
    }
    // Zapatos (y = -shin es el tobillo)
    const foot = new T.Group(); foot.position.set(0, -shin, 0); knee.add(foot);
    const sc = L.shoes, fs = D.build === 'kid' ? .9 : D.build === 'big' ? 1.12 : 1;
    if (D.shoes === 'sneakers') {
      add(foot, rbox(), sc, [0, -.022, .024], [.082 * fs, .062, .15 * fs]);
      add(foot, rbox(), '#f3ead8', [0, -.052, .026], [.09 * fs, .028, .162 * fs]);                    // suela
      add(foot, rbox(), '#f3ead8', [0, -.026, .085 * fs], [.074 * fs, .036, .042]);                    // puntera
      for (const s of [-1, 1]) add(foot, rbox(), '#f3ead8', [s * .041 * fs, -.018, .02], [.006, .022, .07], [0, 0, 0]);   // franja lateral
      add(foot, rbox(), '#f3ead8', [0, .006, .04], [.04, .008, .05], [.25, 0, 0]);                       // cordones
    } else if (D.shoes === 'boots') {
      add(foot, rbox(), sc, [0, .0, .006], [.08 * fs, .1, .09]);
      add(foot, rbox(), sc, [0, -.03, .035], [.082 * fs, .055, .14 * fs]);
      add(foot, rbox(), shade(sc, -.4), [0, -.056, .033], [.088 * fs, .02, .148 * fs]);
    } else if (D.shoes === 'sandals') {
      add(foot, rbox(), L.skin, [0, -.035, .03], [.07 * fs, .04, .13 * fs]);
      add(foot, rbox(), sc === L.skin ? '#8a6040' : sc, [0, -.058, .03], [.078 * fs, .016, .14 * fs]);
      add(foot, rbox(), sc === L.skin ? '#8a6040' : sc, [0, -.03, .055], [.074 * fs, .012, .02]);
    } else {
      add(foot, rbox(), sc, [0, -.035, .028], [.072 * fs, .045, .135 * fs]);
      add(foot, rbox(), shade(sc, -.35), [0, -.056, .028], [.076 * fs, .012, .14 * fs]);
    }
    seal(knee); r.batch(leg); limbs.push(leg); knees.push(knee);
  }
  const shadow = r.shadow(root, 0, 0, .7 + (g - 1) * .5, .55 + (g - 1) * .4);
  return { root, body, head, face, eyes: face, limbs, knees, shadow, phase: 0, look, headY, hunch: !!B.hunch, blink: 2 + Math.random() * 3 };
}

const ANGLES = [0, Math.PI, -Math.PI / 2, Math.PI / 2];
export function animatePerson(rig, p, actor, time, dt, talking = false) {
  const walk = !!actor.moving, run = walk && actor.moving.dur <= 10;
  rig.root.position.set(p.x, 0, p.z);
  const target = ANGLES[actor.dir] || 0, delta = Math.atan2(Math.sin(target - rig.root.rotation.y), Math.cos(target - rig.root.rotation.y));
  rig.root.rotation.y += delta * Math.min(1, dt * 18);
  rig.phase += dt * (run ? 17 : walk ? 11 : 0);
  const ph = rig.phase, sw = walk ? Math.sin(ph) : 0, amp = run ? .75 : .5, slow = rig.hunch ? .55 : 1;
  // Piernas: el muslo va y viene y la rodilla dobla mientras la pierna pasa hacia adelante.
  rig.limbs[2].rotation.x = -sw * amp * slow; rig.limbs[3].rotation.x = sw * amp * slow;
  if (rig.knees) {
    const c = walk ? Math.cos(ph) : 0;
    rig.knees[0].rotation.x = walk ? Math.max(0, c) ** 1.4 * (run ? 1.3 : .85) * slow + .05 : 0;
    rig.knees[1].rotation.x = walk ? Math.max(0, -c) ** 1.4 * (run ? 1.3 : .85) * slow + .05 : 0;
  }
  // Brazos al contrario de las piernas, un poco abiertos; en reposo respiran.
  const armAmp = (run ? .85 : .55) * slow;
  rig.limbs[0].rotation.x = sw * armAmp; rig.limbs[1].rotation.x = -sw * armAmp;
  rig.limbs[0].rotation.z = -.07 - (walk ? 0 : Math.sin(time * 2) * .015);
  rig.limbs[1].rotation.z = .07 + (walk ? 0 : Math.sin(time * 2) * .015);
  const bob = walk ? (1 - Math.abs(Math.sin(ph))) * (run ? .035 : .022) : 0;
  rig.body.position.y = bob;
  rig.body.rotation.x = (rig.hunch ? .12 : 0) + (run ? .1 : 0);
  rig.body.scale.y = walk ? 1 : 1 + Math.sin(time * 2.2) * .008;
  for (const a of [rig.limbs[0], rig.limbs[1]]) a.position.y = (a.userData.y0 ??= a.position.y) + bob;
  rig.head.position.y = rig.headY + bob + (walk ? 0 : Math.sin(time * 2.2 - .4) * .004);
  rig.head.rotation.z = walk ? Math.sin(ph) * .03 : 0;
  // La cabeza se inclina un poco hacia la cámara alta para que la cara siempre se lea.
  const facing = Math.cos(rig.root.rotation.y);
  rig.head.rotation.x = -.22 * Math.max(0, facing) + (talking ? Math.sin(time * 7) * .05 : 0);
  if (talking && !walk) rig.limbs[1].rotation.z = .3 + Math.sin(time * 4) * .12;
  // Parpadeo: cambia la textura de la cara por la de ojos cerrados un instante.
  rig.blink -= dt;
  const faces = rig.face?.material?.userData?.faces;
  if (faces) { const want = rig.blink < .12 ? faces.closed : faces.open; if (rig.face.material.map !== want) rig.face.material.map = want; }
  if (rig.blink < 0) rig.blink = 2.2 + Math.random() * 3;
}
