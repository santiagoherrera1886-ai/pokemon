// Personajes 3D chibi de Alborada: cabeza grande y redonda, ojos expresivos con brillo, pelo con volumen,
// ropa con forma (gorra con visera curva, chaqueta, bata, falda, bufanda, morral) y manos/zapatos redondeados.
// Todo es geometría propia; los colores salen de LOOKS (art/characters.js).
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LOOKS } from '../art/characters.js';
import { dressCharacter } from './art-direction.js';

// ---------- Geometrías compartidas (se clonan al fusionar, así que no se liberan por personaje) ----------
const G = {};
function geo(key, make) { return G[key] || (G[key] = make()); }
const sphere = () => geo('sphere', () => new T.SphereGeometry(1, 9, 7));
const retroHead = () => geo('retroHead', () => new RoundedBoxGeometry(2,2,2,2,.18));
const capsule = (radius, len) => geo('capsule' + radius + ':' + len, () => new T.CapsuleGeometry(radius, len, 3, 8));
const cap = (t) => geo('cap' + t, () => new T.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI * t));
const torus = (arc = Math.PI * 2, tube = .28) => geo('torus' + arc.toFixed(2) + tube, () => new T.TorusGeometry(1, tube, 6, 12, arc));
const halfDisc = () => geo('halfdisc', () => new T.CylinderGeometry(1, 1, 1, 10, 1, false, -Math.PI / 2, Math.PI));
const disc = () => geo('disc', () => new T.CylinderGeometry(1, 1, 1, 10));
const cone = () => geo('cone', () => new T.ConeGeometry(1, 1, 8));
const lathe = (name, pts) => geo('lathe' + name, () => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), 10));
const TORSO = [[.001, 0], [.17, 0], [.185, .05], [.18, .16], [.155, .27], [.11, .33], [.001, .335]];
const COAT = [[.001, -.02], [.215, -.02], [.205, .1], [.19, .2], [.165, .29], [.115, .345], [.001, .35]];
const SKIRT = [[.13, .14], [.25, 0], [.255, -.012], [.001, -.012], [.001, .14]];

// Rasgos por personaje que no están en LOOKS (color de ojos y extras).
const EYES = { vendor: '#6a4a2a', player: '#3a5a9a', rival: '#3f8a52', mom: '#7a4a2e', prof: '#3e6a4a', nurse: '#c0507a', hiedra: '#2f7a3a', coral: '#2a7ac0', bruma: '#7a5ab0', umbra: '#b83a3a', aurora: '#3a9ad0', grunt: '#7a3a5a' };
const SKIRT_LOOKS = new Set(['mom', 'girl', 'lass', 'nurse', 'coral', 'hiedra', 'aurora', 'bruma', 'rivalMom', 'vendor']);
const GLASSES = new Set(['prof', 'old', 'clerk']);
const LASHES = new Set(['mom', 'girl', 'lass', 'nurse', 'coral', 'hiedra', 'aurora', 'bruma', 'rivalMom', 'prof', 'vendor']);

function shade(hex, f) { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); }

// look: nombre de LOOKS o un objeto con los mismos campos (el avatar trae skirt, lashes, eyes y wearCap).
export function person(r, look = 'player') {
  const L = typeof look === 'object' ? look : (LOOKS[look] || LOOKS.player);
  const eyeColor = L.eyes || EYES[look] || shade(L.hair, -.15);
  const skirt = L.skirt ?? SKIRT_LOOKS.has(look), lashes = L.lashes ?? LASHES.has(look);
  const root = new T.Group();

  // Ayudante para crear mallas con geometría compartida.
  const add = (parent, g, color, p, s, rot) => {
    const m = new T.Mesh(g, r.mat(color));
    m.position.set(...p); m.scale.set(...s); if (rot) m.rotation.set(...rot);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (parent, color, p, s, rot) => add(parent, sphere(), color, p, s, rot);
  const pill = (parent, color, p, radius, len, s = [1, 1, 1], rot) => add(parent, capsule(radius, len), color, p, s, rot);

  // ---------------- Cuerpo ----------------
  const body = new T.Group(); root.add(body);
  const top = L.coat || L.shirt;
  add(body, lathe('torso', TORSO), L.shirt, [0, .36, 0], [1, 1, .82]);
  if (L.coat) {
    add(body, lathe('coat', COAT), L.coat, [0, .33, -.005], [1, 1, .86]);
    pill(body, L.shirt, [0, .53, .15], .045, .2, [1.3, 1, .5]);                       // camisa visible por delante
    for (const x of [-1, 1]) add(body, cone(), shade(L.coat, -.08), [x * .07, .66, .135], [.05, .1, .02], [0, 0, x * .5]); // solapas
  }
  if (skirt) add(body, lathe('skirt', SKIRT), L.pants, [0, .28, 0], [1, 1, .85]);
  // Cuello de la camisa y detalle del pecho
  add(body, torus(), L.accent, [0, .695, 0], [.1, .1, .08], [Math.PI / 2, 0, 0]);
  if (!L.coat && !L.apron) pill(body, L.accent, [0, .52, .148], .012, .22, [1, 1, 1]);   // cremallera / botones
  if (!L.coat && !L.apron) add(body, torus(), shade(L.shirt, -.18), [0, .37, 0], [.172, .172, .14], [Math.PI / 2, 0, 0]); // dobladillo
  if (L.apron) {
    ball(body, L.apron, [0, .47, .1], [.15, .17, .06]);
    add(body, torus(Math.PI), L.apron, [0, .66, .02], [.12, .12, .1], [0, 0, 0]);
  }
  if (L.scarf) {
    add(body, torus(), L.scarf, [0, .7, 0], [.135, .135, .12], [Math.PI / 2, 0, 0]);
    pill(body, L.scarf, [.08, .6, .13], .04, .14, [1, 1, .6], [0, 0, .25]);
  }
  if (L.bag) {
    const pack = new T.Group(); pack.position.set(0, .54, -.17); body.add(pack);
    ball(pack, L.bag, [0, 0, 0], [.16, .17, .1]);
    ball(pack, shade(L.bag, -.2), [0, .07, -.03], [.15, .09, .09]);                     // solapa
    ball(pack, shade(L.bag, .25), [0, -.06, -.08], [.06, .05, .03]);                    // bolsillo
    for (const x of [-1, 1]) pill(body, shade(L.bag, -.25), [x * .1, .55, .1], .018, .26, [1, 1, .6], [-.25, 0, 0]); // correas
  }
  r.batch(body);

  // ---------------- Cabeza ----------------
  const head = new T.Group(); head.position.y = .98; head.scale.setScalar(1.2); root.add(head);
  const skull = new T.Group(); head.add(skull);
  add(skull, retroHead(), L.skin, [0, 0, 0], [.31, .29, .285]);
  pill(skull, L.skin, [0, -.28, -.02], .055, .06);                                     // cuello
  for (const x of [-1, 1]) ball(skull, L.skin, [x * .3, -.01, -.01], [.05, .065, .04]); // orejas
  ball(skull, shade(L.skin, -.04), [0, -.05, .28], [.014, .01, .01]);                    // nariz
  for (const x of [-1, 1]) ball(skull, '#f5b0a4', [x * .175, -.075, .215], [.04, .02, .015], [0, x * .6, 0]); // cachetes
  add(skull, torus(Math.PI), '#6a2e2a', [0, -.105, .262], [.022, .016, .016], [0, 0, Math.PI]); // boca
  for (const x of [-1, 1]) pill(skull, shade(L.hair, -.1), [x * .11, .085, .266], .008, .04, [1, 1, .6], [0, x * .3, Math.PI / 2 + x * .1]); // cejas finas

  // Ojos (grupo aparte para parpadear)
  const eyes = new T.Group(); head.add(eyes);
  for (const x of [-1, 1]) {
    // Ojo ovalado oscuro con un brillo grande, como figura de plástico; el color del iris solo asoma abajo.
    const e = new T.Group(); e.position.set(x * .108, -.02, .248); e.rotation.y = x * .38; eyes.add(e);
    ball(e, shade(eyeColor, -.6), [0, 0, 0], [.04, .064, .024]);
    ball(e, shade(eyeColor, -.05), [0, -.03, .012], [.028, .024, .014]);
    ball(e, '#ffffff', [-x * .012, .026, .02], [.014, .017, .008]);
    ball(e, '#ffffff', [x * .01, -.02, .022], [.005, .005, .004]);
    if (lashes) pill(e, '#1e1a24', [x * .03, .052, .006], .007, .03, [1, 1, .8], [0, 0, Math.PI / 2 - x * .5]);
  }
  if (GLASSES.has(look)) { for (const x of [-1, 1]) add(head, torus(Math.PI * 2, .09), '#4a3a32', [x * .105, -.005, .285], [.07, .07, .05], [0, x * .3, 0]); add(head, torus(Math.PI, .12), '#4a3a32', [0, .005, .3], [.035, .02, .03]); }

  // Pelo
  const hair = L.hair, hairD = shade(hair, -.18), hairL = shade(hair, .22);
  const hairCap = (radius = .33, t = .5, tilt = -.45) => add(skull, cap(t), hair, [0, .015, -.01], [radius, radius * .97, radius * .95], [tilt, 0, 0]);
  // Flequillo en mechones gruesos y suaves (bloques esculpidos), del mismo color que el pelo.
  const bangs = (n = 5, len = .12) => {
    n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, a = k * .95;
      const x = Math.sin(a) * .25, z = Math.cos(a) * .24, l = len * (i % 2 ? .85 : 1);
      ball(skull, hair, [x, .17 - l * .35, z], [.105, l, .055], [-.55, a, -k * .35]);
    }
    add(skull, cap(.5), hair, [0, .13, .07], [.295, .11, .225], [.3, 0, 0]);
  };
  const style = L.style, capOn = style === 'cap' || !!L.wearCap, hs = style === 'cap' ? 'capHair' : style;
  if (hs === 'hood') {
    const hc = L.hood || '#3a2c4a';
    hairCap(.33); bangs(7, .12);
    add(skull, cap(.62), hc, [0, .02, -.03], [.38, .37, .37], [-.85, 0, 0]);
    add(skull, torus(), shade(hc, -.2), [0, .06, .13], [.29, .3, .3], [-.85 + Math.PI / 2 - .25, 0, 0]);
    add(skull, disc(), L.accent, [0, .3, .1], [.05, .01, .05], [.7, 0, 0]);            // insignia
    for (const x of [-1, 1]) ball(body, hc, [x * .12, .66, -.06], [.09, .07, .11]);     // capucha caída sobre los hombros
  } else {
    if (hs !== 'bald' && hs !== 'capHair') hairCap(hs === 'buzz' ? .312 : capOn ? .318 : .33);
    if (hs === 'capHair') {
      bangs(5, .1);
      for (const x of [-1, 1]) ball(skull, hair, [x * .27, .03, .06], [.05, .08, .05], [0, 0, x * .3]); // patillas
      for (let i = 0; i < 3; i++) ball(skull, i % 2 ? hairD : hair, [(i - 1) * .1, -.02, -.27], [.07, .09, .05], [.4, 0, (i - 1) * .3]); // nuca
      ball(skull, hairD, [-.06, .12, .27], [.05, .07, .03], [-.3, 0, .3]);              // mechón bajo la visera
    } else if (hs === 'short') {
      bangs(7, .12);
      for (const x of [-1, 1]) ball(skull, hair, [x * .26, .03, .05], [.06, .1, .06], [0, 0, x * .25]);
      if (!capOn) ball(skull, hairL, [-.1, .23, .14], [.06, .025, .04], [-.6, 0, .4]);  // brillo del pelo
    } else if (hs === 'buzz') {
      for (const x of [-1, 1]) ball(skull, hair, [x * .25, .05, .06], [.04, .07, .04], [0, 0, x * .25]);
      ball(skull, hair, [0, .2, .17], [.22, .05, .07], [.5, 0, 0]);                    // línea de la frente
    } else if (hs === 'spiky') {
      bangs(7, .14);
      const spikes = [[0, .32, -.02, -.3, 0], [-.15, .28, .02, -.2, .55], [.15, .28, .02, -.2, -.55], [-.08, .26, -.18, -1, .3], [.08, .26, -.18, -1, -.3], [-.24, .14, -.1, -.6, 1.1], [.24, .14, -.1, -.6, -1.1], [0, .15, -.27, -1.6, 0]];
      spikes.forEach(([x, y, z, rx, rz]) => { if (capOn && y > .2) return; add(skull, cone(), hair, [x, y, z], [.1, .17, .09], [rx, 0, rz]); });
      if (!capOn) ball(skull, hairL, [-.08, .24, .15], [.05, .02, .035], [-.6, 0, .4]);
    } else if (hs === 'curly') {
      bangs(5, .1);
      const curls = [[0, .3, 0], [-.14, .28, .06], [.14, .28, .06], [-.2, .2, -.1], [.2, .2, -.1], [0, .24, -.17], [-.1, .12, -.25], [.1, .12, -.25], [-.26, .06, .02], [.26, .06, .02], [0, .02, -.3], [-.07, .3, -.1], [.07, .3, -.1]];
      curls.forEach(([x, y, z], i) => { if (capOn && y > .18) return; ball(skull, i % 3 ? hair : hairD, [x, y, z], [.085, .08, .085]); });
    } else if (hs === 'long') {
      bangs(8, .14);
      ball(skull, hair, [0, -.17, -.17], [.27, .3, .13]);                                // melena por detrás
      for (const x of [-1, 1]) pill(skull, hair, [x * .25, -.14, .04], .065, .3, [1, 1, .8], [0, 0, -x * .08]); // mechones laterales
      for (const x of [-1, 1]) ball(skull, hairD, [x * .22, -.33, -.06], [.07, .06, .07]); // puntas
      if (!capOn) ball(skull, hairL, [-.12, .22, .13], [.07, .025, .04], [-.6, 0, .4]);
    } else if (hs === 'bob') {
      bangs(8, .13);
      ball(skull, hair, [0, -.06, -.16], [.3, .24, .16]);                                // volumen atrás
      for (const x of [-1, 1]) ball(skull, hair, [x * .25, -.08, .03], [.09, .17, .12], [0, 0, -x * .12]); // laterales a la mandíbula
      for (const x of [-1, 1]) ball(skull, hairD, [x * .23, -.22, .03], [.08, .04, .1]);  // puntas hacia adentro
      if (!capOn) ball(skull, hairL, [-.12, .22, .13], [.07, .025, .04], [-.6, 0, .4]);
    } else if (hs === 'tail') {
      bangs(7, .12);
      for (const x of [-1, 1]) pill(skull, hair, [x * .25, -.05, .05], .04, .14, [1, 1, .8], [0, 0, -x * .1]);
      add(skull, torus(), L.accent, [0, .12, -.27], [.06, .06, .05], [-.4, 0, 0]);        // liga de la cola
      pill(skull, hair, [0, -.08, -.36], .08, .3, [1, 1, .9], [-.35, 0, 0]);              // cola de caballo
      ball(skull, hairD, [0, -.28, -.42], [.06, .06, .06]);
      if (!capOn) ball(skull, hairL, [-.12, .22, .13], [.07, .025, .04], [-.6, 0, .4]);
    } else if (hs === 'bun') {
      bangs(7, .12);
      ball(skull, hair, [0, .29, -.13], [.12, .11, .12]);
      add(skull, torus(), shade(L.accent, -.1), [0, .25, -.1], [.08, .08, .06], [-.9, 0, 0]); // moño con liga
      for (const x of [-1, 1]) pill(skull, hair, [x * .26, -.06, .06], .04, .16, [1, 1, .8], [0, 0, -x * .1]);
    } else if (hs === 'bald') {
      for (const x of [-1, 1]) ball(skull, hair, [x * .27, .02, -.08], [.07, .1, .12]);
      ball(skull, hair, [0, .0, -.27], [.18, .1, .06]);
      for (const x of [-1, 1]) ball(skull, hair, [x * .055, -.07, .265], [.06, .025, .02], [0, 0, x * .3]); // bigote
      for (const x of [-1, 1]) pill(skull, hair, [x * .1, .11, .265], .018, .07, [1, 1, .6], [0, 0, Math.PI / 2]); // cejas pobladas
    }
  }
  if (capOn) {
    const hc = L.hat || '#e04848', band = L.hatBand || '#ffffff';
    add(skull, cap(.5), hc, [0, .1, -.02], [.33, .29, .32], [-.38, 0, 0]);                 // copa de la gorra
    add(skull, cap(.5), shade(hc, .18), [-.06, .2, .05], [.12, .06, .1], [-.5, 0, .3]);   // brillo de la copa
    add(skull, torus(Math.PI * 2, .1), band, [0, .135, -.005], [.315, .3, .3], [Math.PI / 2 - .38, 0, 0]); // banda delgada
    add(skull, halfDisc(), hc, [0, .17, .24], [.17, .02, .15], [.12, 0, 0]);              // visera corta
    add(skull, halfDisc(), shade(hc, -.25), [0, .158, .24], [.165, .01, .145], [.12, 0, 0]);
    add(skull, disc(), band, [0, .3, .14], [.06, .012, .06], [.85, 0, 0]);               // emblema
    add(skull, disc(), hc, [0, .305, .145], [.03, .014, .03], [.85, 0, 0]);
  }
  if (L.cap) { ball(skull, L.cap, [0, .28, .07], [.15, .07, .09], [.35, 0, 0]); add(skull, disc(), L.accent, [0, .3, .15], [.035, .01, .035], [1.2, 0, 0]); } // cofia
  r.batch(skull);
  r.batch(eyes);

  // ---------------- Brazos y piernas ----------------
  const limbs = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * .2, .64, 0); root.add(arm);
    pill(arm, top, [side * .02, -.08, 0], .06, .1, [1, 1, 1], [0, 0, side * .12]);
    add(arm, torus(), shade(top, -.15), [side * .03, -.16, 0], [.058, .058, .058], [Math.PI / 2, 0, 0]); // puño de la manga
    ball(arm, L.skin, [side * .035, -.205, .005], [.055, .058, .055]);
    r.batch(arm); limbs.push(arm);
  }
  for (const side of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(side * .09, .32, 0); root.add(leg);
    const legColor = skirt ? L.skin : L.pants;
    pill(leg, legColor, [0, -.1, 0], .068, .11);
    if (skirt) add(leg, torus(), '#ffffff', [0, -.19, 0], [.066, .066, .05], [Math.PI / 2, 0, 0]); // calcetas
    ball(leg, L.shoes, [0, -.255, .03], [.08, .06, .105]);
    ball(leg, '#f4f1ea', [0, -.29, .03], [.082, .02, .107]);                            // suela
    r.batch(leg); limbs.push(leg);
  }
  // Individual dimensional costumes on the animated NPC rig.
  dressCharacter(r,{root,body,head},look,L);
  const shadow = r.shadow(root, 0, 0, .8, .65);
  return { root, body, head, eyes, limbs, shadow, phase: 0, look, headY: .98, blink: 2 + Math.random() * 3 };
}

const ANGLES = [0, Math.PI, -Math.PI / 2, Math.PI / 2];
export function animatePerson(rig, p, actor, time, dt, talking = false) {
  const walk = !!actor.moving, run = walk && actor.moving.dur <= 10;
  rig.root.position.set(p.x, 0, p.z);
  const target = ANGLES[actor.dir] || 0, delta = Math.atan2(Math.sin(target - rig.root.rotation.y), Math.cos(target - rig.root.rotation.y));
  rig.root.rotation.y += delta * Math.min(1, dt * 18);
  rig.phase += dt * (run ? 20 : walk ? 12 : 0);
  const swing = walk ? Math.sin(rig.phase) * (run ? .9 : .6) : 0;
  rig.limbs[0].rotation.x = swing; rig.limbs[1].rotation.x = -swing;
  rig.limbs[2].rotation.x = -swing * .9; rig.limbs[3].rotation.x = swing * .9;
  // Brazos un poco abiertos y respiración en reposo
  rig.limbs[0].rotation.z = -.08 - (walk ? 0 : Math.sin(time * 2) * .02);
  rig.limbs[1].rotation.z = .08 + (walk ? 0 : Math.sin(time * 2) * .02);
  const bob = walk ? Math.abs(Math.sin(rig.phase)) * (run ? .06 : .04) : 0;
  rig.body.position.y = bob;
  rig.body.scale.y = walk ? 1 : 1 + Math.sin(time * 2.2) * .012;
  rig.head.position.y = rig.headY + bob + (walk ? 0 : Math.sin(time * 2.2 - .4) * .006);
  rig.head.rotation.z = walk ? Math.sin(rig.phase) * .04 : 0;
  // La cabeza se inclina hacia la cámara alta para que la cara siempre se lea.
  const facing = Math.cos(rig.root.rotation.y);
  rig.head.rotation.x = -.36 * Math.max(0, facing) + (talking ? Math.sin(time * 7) * .05 : 0);
  if (talking && !walk) rig.limbs[1].rotation.z = .3 + Math.sin(time * 4) * .12;
  // Parpadeo
  rig.blink -= dt;
  rig.eyes.scale.y = rig.blink < .12 ? .12 : 1;
  if (rig.blink < 0) rig.blink = 2.2 + Math.random() * 3;
}
