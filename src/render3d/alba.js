// Forma Alba en 3D: corona de luz sobre la cabeza con adornos de su tipo, alas de luz detrás de los hombros,
// motas doradas que giran y un brillo cálido en el cuerpo. Sirve para todas las especies porque se arma con
// el ancla de la cabeza y el tamaño del cuerpo esculpido de cada una.
import * as T from 'three';
import { TYPE_FX } from '../data/types.js';

const G = {};
const geo = (k, make) => G[k] || (G[k] = make());
const RING = () => geo('ring', () => new T.TorusGeometry(1, .075, 5, 20));
const CONE = () => geo('cone', () => new T.ConeGeometry(1, 1, 6));
const OCTA = () => geo('octa', () => new T.OctahedronGeometry(1, 0));
const SPHERE = () => geo('sphere', () => new T.IcosahedronGeometry(1, 0));

// Qué adorno lleva la corona según el tipo principal.
const CROWN = {
  fuego: 'flame', fantasma: 'flame', dragon: 'horn', agua: 'drop', hielo: 'crystal', roca: 'crystal', tierra: 'crystal', acero: 'crystal',
  planta: 'leaf', bicho: 'leaf', electrico: 'spike', lucha: 'spike', veneno: 'drop', siniestro: 'flame', psiquico: 'gem', hada: 'gem', volador: 'leaf', normal: 'spike'
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function albaOverlay(r, rig, types = ['normal']) {
  if (rig.albaFx) return rig.albaFx;
  const model = rig.model, body = model.userData.body, head = model.userData.head;
  body.geometry.boundingBox || body.geometry.computeBoundingBox();
  const bb = body.geometry.boundingBox, H = bb.max.y, W = bb.max.x - bb.min.x, zc = (bb.min.z + bb.max.z) / 2;
  const pal = TYPE_FX[types[0]] || TYPE_FX.normal, c1 = pal.find(c => c !== '#ffffff') || '#ffd77a', c2 = pal[1] && pal[1] !== c1 ? pal[1] : '#fff4c8';
  const gold = r.mat('#ffd77a', { emissive: '#ffb84a', emissiveIntensity: .95, roughness: .28, metalness: .2 });
  const glow = c => r.mat(c, { emissive: c, emissiveIntensity: .85, roughness: .3 });
  const g = new T.Group(); g.name = 'alba'; g.userData.keep = true;
  const add = (geom, mat, p, s, rot) => { const m = new T.Mesh(geom, mat); m.position.set(...p); m.scale.set(...s); if (rot) m.rotation.set(...rot); m.userData.keep = true; g.add(m); return m; };

  // Corona: aro dorado que flota sobre la cabeza con seis adornos del tipo.
  const top = head ? head.top : new T.Vector3(0, H, zc), hs = head ? head.size : .07;
  const R = clamp(hs * 3.3, .15, .34), cy = top.y + .12 + R * .2;
  const crown = new T.Group(); crown.position.set(top.x, cy, top.z - .02); g.add(crown);
  const ring = new T.Mesh(RING(), gold); ring.scale.setScalar(R); ring.rotation.x = Math.PI / 2; crown.add(ring);
  const kind = CROWN[types[0]] || 'spike';
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R, mat = i % 2 ? gold : glow(c1);
    let m;
    if (kind === 'crystal' || kind === 'gem') { m = new T.Mesh(OCTA(), i % 2 ? gold : r.mat(c1, { emissive: c1, emissiveIntensity: .6, roughness: .12, transparent: true, opacity: .9 })); m.scale.set(.045, kind === 'gem' ? .07 : .12, .045); m.position.set(x, kind === 'gem' ? .05 : .1, z); }
    else if (kind === 'drop') { m = new T.Mesh(SPHERE(), mat); m.scale.set(.045, .07, .045); m.position.set(x, .08, z); }
    else if (kind === 'leaf') { m = new T.Mesh(SPHERE(), mat); m.scale.set(.05, .12, .016); m.position.set(x, .1, z); m.rotation.set(0, -a, Math.cos(a) * .3); }
    else if (kind === 'horn') { m = new T.Mesh(CONE(), mat); m.scale.set(.04, .18, .04); m.position.set(x, .1, z); m.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); }
    else { m = new T.Mesh(CONE(), mat); m.scale.set(.035, kind === 'flame' ? .2 : .15, .035); m.position.set(x, kind === 'flame' ? .11 : .08, z); }
    crown.add(m);
  }
  const jewel = new T.Mesh(OCTA(), glow(c2 === '#fff4c8' ? '#ff9a5a' : c2)); jewel.scale.set(.05, .07, .05); jewel.position.set(0, .03, R); crown.add(jewel);

  // Alas de luz: abanico de plumas translúcidas del color del tipo, con borde dorado.
  const L = clamp(H * .62, .55, 1.35), wings = [];
  const wingMat = r.mat(c1, { emissive: c1, emissiveIntensity: .7, roughness: .4, transparent: true, opacity: .62, side: T.DoubleSide, depthWrite: false });
  const edgeMat = r.mat('#fff2c8', { emissive: '#ffd77a', emissiveIntensity: .8, roughness: .3, transparent: true, opacity: .85, side: T.DoubleSide, depthWrite: false });
  for (const side of [-1, 1]) {
    const w = new T.Group(); w.position.set(side * clamp(W * .2, .12, .5), H * .66, zc - (bb.max.z - bb.min.z) * .08); w.rotation.set(.1, side * .55, 0); g.add(w);
    for (let i = 0; i < 5; i++) {
      const a = .75 - i * .32, len = L * (1 - i * .12), f = new T.Mesh(SPHERE(), i % 2 ? edgeMat : wingMat);
      f.scale.set(len * .5, .07 + .02 * (i === 0), .02); f.position.set(side * Math.cos(a) * len * .5, Math.sin(a) * len * .5, -i * .02); f.rotation.z = side * a; f.renderOrder = 2; w.add(f);
    }
    w.userData.side = side; w.userData.base = w.rotation.y; wings.push(w);
  }

  // La Forma Alba ahora modifica la silueta tridimensional: seis prismas
  // visibles que nacen de los hombros y la espalda, no solo un filtro luminoso.
  const crest=new T.Group();crest.name='alba-retro-spines';g.add(crest);
  for(let i=0;i<6;i++){
    const side=i%2===0?-1:1,row=Math.floor(i/2);
    const shard=new T.Mesh(OCTA(),i%3===0?gold:glow(i%2?c1:c2));
    const h=(.21+row*.10)*Math.min(1.7,Math.max(.6,H));
    shard.position.set(side*(W*.22+row*.10),H*(.48+row*.12),zc-(bb.max.z-bb.min.z)*(.15+row*.10));
    shard.scale.set(.065+row*.025,h,.09+row*.01);
    shard.rotation.z=side*(.45+row*.12);
    shard.rotation.y=side*.25;
    shard.userData.keep=true;
    crest.add(shard);
  }
  // Motas que orbitan alrededor del cuerpo.
  const orbit = new T.Group(); orbit.position.set(0, H * .5, zc); g.add(orbit);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, rr = clamp(W * .75, .5, 1.3); const m = new T.Mesh(SPHERE(), i % 2 ? gold : glow(c1)); m.scale.setScalar(.035 + (i % 3) * .01); m.position.set(Math.cos(a) * rr, Math.sin(a * 2) * H * .25, Math.sin(a) * rr * .8); orbit.add(m); }

  g.traverse(o => { if (o.isMesh) { o.userData.keep = true; o.castShadow = false; } });
  model.add(g);
  const orig = body.material;
  const lit = r.mat('#ffffff', { vertexColors: true, roughness: orig.roughness, metalness: orig.metalness, emissive: '#fff4e0', emissiveIntensity: .06 });
  rig.albaFx = g; rig.albaMats = [orig, lit];
  g.userData = { crown, wings, orbit, keep: true };
  g.visible = false;
  return g;
}

// Enciende o apaga la Forma Alba de un modelo (con el brillo del cuerpo y el tamaño objetivo).
export function setAlba(r, rig, on, types) {
  if (on && !rig.albaFx) albaOverlay(r, rig, types);
  if (!rig.albaFx) return;
  rig.albaFx.visible = on;
  rig.model.userData.body.material = rig.albaMats[on ? 1 : 0];
  rig.albaOn = on;
}

// Animación de cada cuadro: la corona gira despacio, las alas aletean y las motas orbitan.
export function animateAlba(rig, time) {
  const fx = rig.albaFx; if (!fx || !fx.visible) return;
  const { crown, wings, orbit } = fx.userData;
  crown.rotation.y = time * .7; crown.position.y += Math.sin(time * 2.2) * .0008;
  for (const w of wings) w.rotation.y = w.userData.base + w.userData.side * Math.sin(time * 2.6) * .12;
  orbit.rotation.y = time * .9;
}
