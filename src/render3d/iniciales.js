// Las tres líneas iniciales con el acabado HD de la lámina del proyecto: cachorros redondos de ojos grandes,
// una segunda etapa esbelta y una forma final majestuosa.
//   Planta: Brotelo (zorrito de orejas de hoja) → Brotoso (zorro esbelto) → Bosquerón (ciervo con astas en flor).
//   Fuego:  Brasín (cachorro de león con cola de fuego) → Brasón (león joven de melena ardiente) → Volcarbón (león que ruge sobre roca).
//   Agua:   Charquín (foquita de cola de pez) → Charcomar (nutria dragón de aletas) → Mareón (señor del mar con corona y gema).
// Mismo método que creatures3d.js: S = cuerpo esculpido en una pieza, D = detalles. Miran hacia +z y pisan y = 0.
import { Sculpt } from './sculpt.js';

const E = Sculpt.ellipsoid, RC = Sculpt.roundCone;
const plus = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dir = (yaw, pitch) => [Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];

// Oreja de hoja: hoja grande por fuera, centro de color por dentro y nervio.
function leafEar(D, head, s, { yaw = .55, pitch = .95, len = .44, w = .3, out = .3, back = .06, lean = 0, color, inner, rib, curl = -.12, cup = .3 }) {
  const base = D.skin(head, s * yaw, pitch, -.03), tip = plus(base, [s * out, len, -back + lean]);
  const face = [s * .45, .15, 1];
  D.blade('ear', color, base, tip, w, face, { curl, cup, thick: .7 });
  const fwd = [s * .02, .005, .03];
  D.blade('ear', inner, plus(base, fwd), plus(plus(tip, fwd), [-s * out * .38, -len * .38, 0]), w * .48, face, { curl: curl * .8, cup: cup * 1.3, thick: .45 });
  if (rib) D.stick(rib, plus(base, [s * .01, .02, .035]), plus(plus(tip, [s * .005, -.05, .03]), [-s * out * .12, -len * .1, 0]), .008);
}
// Flor blanca de cinco pétalos con centro amarillo.
function flower(D, p, size, face = [0, 1, 0], petal = '#fffaf2', heart = '#ffcf3a') {
  const F = face, up = Math.abs(F[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
  const u = cross(up, F), v = cross(F, u);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .3, d = [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)];
    D.blade('petal', petal, plus(p, d, size * .08), plus(plus(p, d, size), F, size * .18), size * .78, F, { cup: .35, thick: .35 });
  }
  D.ball(D.glow(heart, .35), plus(p, F, size * .1), size * .26);
}
const cross = (a, b) => { const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], l = Math.hypot(...c) || 1; return c.map(x => x / l); };
// Collar de hojas alrededor del cuello que cae sobre el pecho.
function leafCollar(D, c, { R = .2, n = 9, len = .2, w = .13, from = -2.2, to = 2.2, droop = .7, colors }) {
  for (let i = 0; i < n; i++) {
    const a = from + (to - from) * (i / (n - 1)), out = [Math.sin(a), 0, Math.cos(a)];
    const base = plus(c, out, R), tip = plus(plus(base, out, len * .55), [0, -len * droop, 0]);
    D.blade('leaf', colors[i % colors.length], base, tip, w, plus(out, [0, .3, 0]), { curl: .12, cup: .2, thick: .5 });
  }
}
// Pechera de pelo esponjado: filas de mechones de largo variado que caen del pecho.
function ruff(D, color, rows) {
  for (const [n, y, z, R, len, r] of rows) for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) * 2 - 1 : 0, x = u * R, k = .82 + ((i * 7 + n) % 5) * .09;
    const b = [x, y - Math.abs(u) * len * .25, z - Math.abs(u) * R * .55];
    D.tuft(b, [x * 1.25, b[1] - len * k, b[2] + len * .3], r * (1 - Math.abs(u) * .2), color);
  }
}
// Melena de fuego: lenguas que salen de la piel de la cabeza y el cuello hacia atrás.
function fireMane(D, c, list) {
  for (const [yaw, pitch, len, w, pal, back = .5, lift = .2] of list) {
    const base = D.skin(c, yaw, pitch, -.04), o = dir(yaw, pitch);
    const tip = plus(plus(base, o, len * .62), [0, len * lift, -len * back]);
    D.tongue(base, tip, w, { pal, bend: (yaw > 0 ? -1 : 1) * .25, face: [o[0], .2, o[2] + .3] });
  }
}
// Hojas o chispas que flotan alrededor (aura de las formas finales).
function orbit(D, make, { n, R, y0, y1, speed = .35, bob = .08 }) {
  const items = [];
  for (let i = 0; i < n; i++) items.push({ m: make(i), a: i / n * Math.PI * 2, y: y0 + (y1 - y0) * ((i * .618) % 1), r: R * (.85 + ((i * .37) % .3)), ph: i * 1.7 });
  D.anim(t => { for (const it of items) { const a = it.a + t * speed; it.m.position.set(Math.cos(a) * it.r, it.y + Math.sin(t * 1.3 + it.ph) * bob, Math.sin(a) * it.r - .1); it.m.rotation.set(t * .7 + it.ph, a, Math.sin(t + it.ph) * .6); } });
}

export const INICIALES = {
  // ---------------- Brotelo · zorrito de orejas de hoja (planta)
  brotelo(S, D) {
    const C = '#f6efe3', G = '#86b83a', GD = '#5d8e2a', GL = '#b9db6c', IN = '#e3964c', P = '#7a5236';
    S.ball([0, .36, -.08], [.25, .23, .32], C, { k: 0 });
    S.ball([0, .43, .1], [.21, .22, .19], C, { k: .1 });
    S.pair(s => S.ball([s * .14, .32, -.24], [.14, .16, .17], C, { k: .08 }));
    S.pair(s => {
      S.limb([s * .12, .3, .12], [s * .13, .08, .16], .074, .064, C, { k: .05 });
      S.ball([s * .13, .055, .2], [.075, .05, .085], C, { k: .03 });
      S.paint(E([s * .13, .035, .255], [.07, .03, .04]), P, .02);
      S.limb([s * .16, .26, -.27], [s * .17, .08, -.24], .08, .066, C, { k: .05 });
      S.ball([s * .17, .055, -.19], [.075, .05, .085], C, { k: .03 });
      S.paint(E([s * .17, .035, -.135], [.07, .03, .04]), P, .02);
    });
    const head = [0, .84, .1];
    S.ball(head, [.34, .3, .29], C, { k: .14 });
    S.ball([0, .755, .34], [.12, .08, .075], '#fffaf2', { k: .06, kc: .03 });
    S.pair(s => {
      for (const [yy, pp, l] of [[1.22, -.28, .12], [1.36, -.08, .1], [1.08, -.46, .085]]) { const b = D.skin(head, s * yy, pp, -.05); D.tuft(b, [b[0] + s * l, b[1] - l * .5, b[2] + .01], .055, C); }
      // Manchas verdes en forma de hoja en ancas y hombros.
      for (const [c, yaw, pitch, sz] of [[[s * .14, .32, -.24], s * 1.5, .25, .07], [[s * .14, .32, -.24], s * 1.9, -.1, .05], [[0, .43, .1], s * 1.2, .1, .045]]) S.paint(E(D.skin(c, yaw, pitch), [sz * .55, sz, sz * .55], [0, 0, s * .5]), G, .02);
    });
    const tuftBase = D.skin(head, 0, 1.15, -.03);
    for (const [x, z, l, c] of [[0, .02, .22, G], [-.08, -.02, .18, GL], [.08, -.02, .18, GD], [0, -.08, .16, G]]) D.blade('leaf', c, plus(tuftBase, [x * .5, 0, z]), plus(tuftBase, [x * 1.6, l, z + .08]), .09, [x, .3, 1], { curl: .2, thick: .5 });
    S.pair(s => leafEar(D, head, s, { yaw: .66, pitch: .72, len: .38, w: .33, out: .4, back: .05, color: G, inner: IN, rib: GD, curl: -.16 }));
    leafCollar(D, [0, .6, .1], { R: .2, n: 9, len: .2, w: .13, from: -2.2, to: 2.2, colors: [G, GL, GD] });
    // Cola: tallo corto y una hoja grande que se curva hacia arriba, con otra más chica detrás.
    S.limb([0, .36, -.36], [0, .46, -.5], .06, .04, C, { k: .04 });
    D.blade('leaf', G, [0, .44, -.5], [0, 1.0, -.66], .44, [1, 0, .15], { curl: .32, cup: .18, thick: .5 });
    D.blade('leaf', GD, [.02, .44, -.52], [.05, .84, -.76], .3, [1, 0, -.2], { curl: .24, thick: .45 });
    D.stick(GD, [.03, .48, -.52], [.03, .92, -.68], .01);
    D.face({ c: head, spread: .42, pitch: .02, size: .088, iris: '#5aa83a', style: 'round', cheek: '#f4a3a3', mouth: 'open', mouthPitch: -.34, mouthW: .05, fangs: true });
    D.ball('#3a2a26', [0, .79, .41], [.032, .022, .02]);
  },

  // ---------------- Brotoso · zorro esbelto de hojas (planta)
  brotoso(S, D) {
    const C = '#f1e8d5', G = '#6f9b36', GL = '#a8cb62', GD = '#4d7a26', IN = '#e8a36c', P = '#5a3a26';
    S.ball([0, .74, -.08], [.24, .23, .44], G, { k: 0 });
    S.paint(E([0, .58, -.06], [.2, .1, .38]), C, .08);
    S.ball([0, .8, .26], [.19, .23, .19], C, { k: .12 });
    S.paint(E([0, .98, .18], [.17, .1, .16]), G, .06);
    S.limb([0, .86, .3], [0, 1.12, .4], .135, .1, C, { k: .1 });
    S.paint(E([0, 1.02, .22], [.12, .18, .08]), G, .06);
    const head = [0, 1.22, .44];
    S.ball(head, [.19, .18, .19], G, { k: .1 });
    S.paint(E([0, 1.13, .56], [.15, .08, .12]), C, .05);
    S.limb([0, 1.17, .5], [0, 1.12, .72], .1, .045, C, { k: .06 });
    S.pair(s => {
      S.limb([s * .12, .72, .24], [s * .13, .36, .28], .068, .052, G, { k: .06 });
      S.limb([s * .13, .36, .28], [s * .13, .07, .3], .052, .044, C, { k: .03 });
      S.ball([s * .13, .045, .34], [.055, .04, .07], C, { k: .03 });
      S.ball([s * .15, .7, -.36], [.12, .17, .17], G, { k: .08 });
      S.limb([s * .16, .6, -.42], [s * .17, .32, -.5], .07, .05, G, { k: .05 });
      S.limb([s * .17, .32, -.5], [s * .17, .07, -.44], .05, .043, C, { k: .03 });
      S.ball([s * .17, .045, -.4], [.055, .04, .07], C, { k: .03 });
      S.paint(E([s * .14, .3, .3], [.06, .05, .06]), C, .04);
      for (const z of [.38, -.34]) D.claws(s * (z > 0 ? .13 : .17), .035, z + .02, .55, P);
      D.swirl([s * .15, .7, -.36], s * 1.55, .15, .07, GL, { w: .016, turns: 1, tail: 5, flip: s });
    });
    S.pair(s => leafEar(D, head, s, { yaw: .6, pitch: .78, len: .36, w: .27, out: .28, back: .12, color: G, inner: IN, rib: GD, curl: -.2 }));
    const crest = D.skin(head, 0, 1.0, -.02);
    for (const [x, l, c] of [[0, .2, GL], [-.05, .16, G], [.05, .16, GD]]) D.blade('leaf', c, plus(crest, [x, 0, 0]), plus(crest, [x * 2.4, l * .7, -l * .6]), .08, [x * 3, .5, 1], { curl: .15, thick: .5 });
    // Manto de hojas sobre los hombros.
    for (let i = 0; i < 8; i++) { const s = i % 2 ? 1 : -1, k = Math.floor(i / 2), base = [s * (.14 + k * .02), .98 - k * .03, .22 - k * .1]; D.blade('leaf', [G, GL, GD][k % 3], base, plus(base, [s * .14, -.16, -.16]), .12, [s, .4, .3], { curl: .1, thick: .5 }); }
    // Cola espesa de hojas en abanico.
    S.limb([0, .8, -.46], [0, .9, -.6], .07, .05, G, { k: .05 });
    const tb = [0, .9, -.6];
    for (const [yaw, up, l, w, c] of [[0, .9, .62, .3, G], [.45, .7, .56, .26, GL], [-.45, .7, .56, .26, GD], [.85, .45, .46, .22, G], [-.85, .45, .46, .22, GL], [0, .35, .5, .26, GD]]) {
      const d = [Math.sin(yaw) * .5, up, -Math.cos(yaw) * .7 - .3];
      D.blade('leaf', c, tb, plus(tb, d, l), w, [Math.sin(yaw), .2, -Math.cos(yaw) * .2 + .6], { curl: .28, cup: .15, thick: .5 });
    }
    D.face({ c: head, spread: .58, pitch: .12, size: .07, iris: '#86c23e', style: 'almond', lid: .12, lidColor: G, cheek: false, mouth: 'smile', mouthPitch: -.55, mouthW: .03 });
    D.ball('#3a2a26', [0, 1.14, .745], [.03, .022, .02]);
  },

  // ---------------- Bosquerón · ciervo del bosque con astas en flor (planta/roca)
  bosqueron(S, D) {
    const C = '#f2ead9', G = '#5f8f34', GL = '#9cc65a', GD = '#3f6e26', W = '#7a5434', H = '#4a3426', AU = '#e2b85c', PK = '#f2bca6';
    S.ball([0, 1.02, -.1], [.27, .27, .52], C, { k: 0 });
    S.paint(E([0, 1.2, -.14], [.3, .16, .54]), G, .1);
    S.ball([0, 1.1, .32], [.24, .28, .23], C, { k: .14 });
    S.limb([0, 1.18, .32], [0, 1.5, .5], .17, .12, C, { k: .1 });
    const head = [0, 1.62, .58];
    S.ball(head, [.16, .16, .19], C, { k: .1 });
    S.limb([0, 1.56, .66], [0, 1.5, .82], .1, .06, C, { k: .06 });
    S.paint(E([0, 1.74, .6], [.16, .07, .15]), G, .05);
    // Pecho de pelo largo que cae.
    ruff(D, C, [[5, 1.2, .5, .14, .2, .075], [4, 1.08, .53, .11, .26, .065], [3, .96, .5, .07, .22, .055]]);
    S.pair(s => {
      S.limb(D.skin(head, s * .9, .55, -.03), plus(D.skin(head, s * .9, .55), [s * .24, .14, -.14]), .065, .02, C, { k: .03 });
      S.paint(E(plus(D.skin(head, s * .9, .55), [s * .11, .07, -.05]), [.07, .025, .035], [0, 0, s * .5]), PK, .025);
      // Patas largas: muslo verde, media crema, banda dorada y pezuña.
      S.limb([s * .15, .98, .3], [s * .16, .52, .34], .085, .062, G, { k: .07 });
      S.limb([s * .16, .52, .34], [s * .16, .1, .36], .062, .05, C, { k: .03 });
      S.limb([s * .16, .1, .36], [s * .16, .02, .38], .054, .058, H, { k: .01 });
      S.ball([s * .17, 1.0, -.48], [.15, .24, .22], G, { k: .1 });
      S.limb([s * .18, .84, -.54], [s * .19, .44, -.64], .085, .06, G, { k: .05 });
      S.limb([s * .19, .44, -.64], [s * .19, .1, -.56], .056, .048, C, { k: .03 });
      S.limb([s * .19, .1, -.56], [s * .19, .02, -.54], .052, .056, H, { k: .01 });
      D.ring(D.M(AU, { metalness: .5, roughness: .3 }), [s * .16, .2, .36], .058, [Math.PI / 2, 0, 0], .16);
      D.ring(D.M(AU, { metalness: .5, roughness: .3 }), [s * .19, .2, -.57], .056, [Math.PI / 2, 0, 0], .16);
      D.swirl([s * .17, 1.0, -.48], s * 1.55, .05, .09, '#d6e6b8', { w: .018, turns: 1.05, tail: 6, flip: s });
      D.swirl([0, 1.1, .32], s * 1.35, .05, .06, GL, { w: .014, turns: .9, tail: 4, flip: -s });
    });
    // Astas de rama con hojas y flores.
    S.pair(s => {
      const b = D.skin(head, s * .35, 1.05, -.02), m1 = plus(b, [s * .12, .22, -.06]), m2 = plus(m1, [s * .14, .2, -.1]), tip = plus(m2, [s * .02, .18, -.04]);
      D.stick(W, b, m1, .03); D.stick(W, m1, m2, .025); D.stick(W, m2, tip, .02);
      const t1 = plus(m1, [s * .16, .08, .06]), t2 = plus(m2, [s * .16, .02, .08]), t3 = plus(m2, [-s * .04, .16, .06]);
      D.stick(W, m1, t1, .018); D.stick(W, m2, t2, .016); D.stick(W, m2, t3, .015);
      for (const [p, d] of [[t1, [s * .12, .02, .06]], [t2, [s * .1, .06, .04]], [tip, [0, .12, -.06]], [t3, [-s * .06, .1, .04]], [m1, [-s * .02, .1, .1]]]) D.blade('leaf', [G, GL][(p[1] * 10 | 0) % 2], p, plus(p, d), .07, [s * .3, .3, 1], { curl: .15, thick: .5 });
      flower(D, plus(m2, [s * .02, .02, .07]), .075, [s * .2, .5, 1]);
      flower(D, plus(t1, [0, .03, .03]), .06, [s * .3, .6, .8]);
    });
    // Manto de hojas en capas sobre lomo y hombros, con flores.
    for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
      const s = i % 2 ? 1 : -1, z = .3 - i * .15 + row * .03, base = [s * (.2 + row * .04), 1.3 - row * .1 - Math.abs(z + .1) * .08, z];
      D.blade('leaf', [G, GL, GD][(i + row) % 3], base, plus(base, [s * .13, -.1 - row * .04, -.2]), .14, [s * .6, 1, 0], { curl: .14, cup: .1, thick: .5 });
    }
    for (const [x, y, z, sz] of [[-.2, 1.34, .22, .07], [.24, 1.32, .02, .075], [-.16, 1.3, -.34, .065], [.08, 1.32, -.56, .06], [.16, 1.28, .36, .06]]) flower(D, [x, y, z], sz, [x * 2, 1, .2]);
    // Cola: haz de hojas largas que cae.
    for (const [x, l, c] of [[0, .62, G], [-.08, .54, GL], [.08, .54, GD], [-.14, .44, G], [.14, .44, GL]]) D.blade('blade', c, [x * .4, 1.14, -.6], [x * 1.4, 1.14 - l, -.82 - Math.abs(x)], .16, [x * 4, 0, -1], { curl: -.15, thick: .5 });
    // Hojitas que flotan alrededor.
    orbit(D, i => D.blade('leaf', [GL, G][i % 2], [0, 0, 0], [0, .1, 0], .06, [0, 0, 1], { keep: true, thick: .5 }), { n: 6, R: .75, y0: .5, y1: 1.7, speed: .3 });
    D.face({ c: head, spread: .66, pitch: .14, size: .056, iris: '#8cc63e', style: 'almond', lid: .2, lidColor: C, cheek: false, mouth: 'none' });
    D.ball('#3a2a26', [0, 1.525, .835], [.028, .02, .02]);
  },

  // ---------------- Brasín · cachorro de león con cola de fuego (fuego)
  brasin(S, D) {
    const O = '#ee7a2c', OD = '#d0601e', C = '#f8e2bc', BR = '#5e3424', IN = '#f6b48c';
    S.ball([0, .38, -.06], [.27, .25, .34], O, { k: 0 });
    S.ball([0, .44, .12], [.22, .23, .2], O, { k: .1 });
    S.paint(E([0, .36, .24], [.16, .2, .1]), C, .07);
    S.pair(s => S.ball([s * .14, .33, -.24], [.15, .17, .17], O, { k: .08 }));
    S.pair(s => {
      S.limb([s * .12, .3, .14], [s * .13, .08, .17], .078, .068, O, { k: .05 });
      S.ball([s * .13, .055, .21], [.08, .055, .09], C, { k: .03 });
      S.limb([s * .16, .27, -.27], [s * .17, .08, -.24], .084, .07, O, { k: .05 });
      S.ball([s * .17, .055, -.18], [.08, .055, .09], C, { k: .03 });
      D.swirl([s * .14, .33, -.24], s * 1.6, .1, .065, C, { w: .02, turns: .85, tail: 5, flip: s });
      D.swirl([0, .44, .12], s * 1.25, -.05, .045, C, { w: .016, turns: .8, tail: 4, flip: s });
    });
    for (let i = 0; i < 5; i++) { const x = (i - 2) * .06, b = [x, .52 - Math.abs(x) * .4, .3 - Math.abs(x) * .3]; D.tuft(b, [x * 1.4, b[1] - .17, b[2] + .05], .055, C); }
    const head = [0, .86, .12];
    S.ball(head, [.35, .31, .3], O, { k: .14 });
    S.paint(E([0, .74, .3], [.26, .14, .16]), C, .08);
    S.ball([0, .755, .36], [.13, .08, .075], C, { k: .06, kc: .03 });
    S.pair(s => {
      for (const [yy, pp, l] of [[1.2, -.32, .12], [1.36, -.12, .1], [1.05, -.5, .09]]) { const b = D.skin(head, s * yy, pp, -.05); D.tuft(b, [b[0] + s * l, b[1] - l * .5, b[2] + .01], .056, C); }
      const e = plus(D.skin(head, s * .78, .72, -.04), [s * .03, .04, -.02]);
      S.ball(e, [.15, .16, .07], BR, { k: .05, kc: .02, rot: [0, s * .45, -s * .3] });
      S.paint(E(plus(e, [-s * .01, -.01, .05]), [.1, .11, .05], [0, s * .45, -s * .3]), IN, .03);
      S.paint(E(plus(e, [s * .01, -.03, -.05]), [.12, .1, .05], [0, s * .45, -s * .3]), O, .03);
    });
    // Copete de fuego y cola con la punta encendida.
    D.plume(D.skin(head, 0, 1.1, -.06), [0, 1, -.38], .54, { face: [0, .3, 1], spread: .5, n: 3 });
    S.limb([0, .36, -.38], [0, .44, -.6], .055, .045, O, { k: .04 });
    S.limb([0, .44, -.6], [0, .66, -.72], .045, .04, O, { k: .03 });
    S.limb([0, .66, -.72], [0, .84, -.66], .04, .035, O, { k: .03 });
    D.plume([0, .84, -.66], [0, 1, .12], .46, { face: [1, 0, 0], spread: .6 });
    D.face({ c: head, spread: .42, pitch: .03, size: .09, iris: '#b23c1e', style: 'round', cheek: '#f7a088', mouth: 'open', mouthPitch: -.34, mouthW: .05, fangs: true });
    D.ball('#3a2420', [0, .79, .43], [.034, .024, .02]);
  },

  // ---------------- Brasón · león joven de melena ardiente (fuego)
  brason(S, D) {
    const O = '#e8702a', OD = '#c4521c', C = '#f7e3c2', ST = '#6a2a16', BR = '#4e2618';
    S.ball([0, .72, -.08], [.27, .26, .44], O, { k: 0 });
    S.paint(E([0, .56, -.04], [.2, .1, .36]), C, .08);
    S.ball([0, .8, .28], [.22, .25, .21], O, { k: .12 });
    S.limb([0, .86, .32], [0, 1.04, .44], .19, .16, O, { k: .1 });
    const head = [0, 1.14, .5];
    S.ball(head, [.23, .21, .22], O, { k: .1 });
    S.ball([0, 1.05, .69], [.125, .085, .085], C, { k: .06, kc: .03 });
    S.paint(E([0, 1.04, .62], [.17, .09, .12]), C, .05);
    ruff(D, C, [[5, .98, .46, .16, .22, .08], [4, .86, .48, .12, .26, .07], [3, .74, .45, .08, .2, .055]]);
    S.pair(s => {
      S.limb([s * .15, .78, .28], [s * .16, .38, .32], .09, .07, O, { k: .07 });
      S.limb([s * .16, .38, .32], [s * .16, .08, .34], .07, .06, C, { k: .03 });
      S.ball([s * .16, .055, .39], [.075, .05, .09], C, { k: .03 });
      S.ball([s * .17, .72, -.4], [.14, .2, .19], O, { k: .08 });
      S.limb([s * .18, .62, -.46], [s * .19, .32, -.54], .085, .062, O, { k: .05 });
      S.limb([s * .19, .32, -.54], [s * .19, .08, -.48], .062, .055, C, { k: .03 });
      S.ball([s * .19, .055, -.43], [.075, .05, .09], C, { k: .03 });
      D.claws(s * .16, .04, .47, .7, '#3a2a24'); D.claws(s * .19, .04, -.35, .7, '#3a2a24');
      // Rayas de tigre en el lomo y las ancas.
      for (const [y0, p0, y1, p1, w] of [[.4, 1.2, .9, .3, .03], [.8, 1.1, 1.25, .25, .028], [1.2, .9, 1.6, .1, .026], [1.7, .8, 2.0, .05, .024]]) D.stripe([0, .72, -.08], [s * y0, p0], [s * y1, p1], w, .006, ST);
      D.stripe([s * .17, .72, -.4], [s * 1.2, .6], [s * 1.5, -.2], .026, .006, ST);
      const e = D.skin(head, s * .62, .8, -.03);
      S.limb(e, plus(e, [s * .07, .17, -.05]), .085, .02, O, { k: .04 });
      S.paint(RC([e[0] + s * .04, e[1] + .12, e[2] - .02], [e[0] + s * .07, e[1] + .19, e[2] - .05], .045, .012), BR, .02);
      S.paint(E(D.skin(head, s * .4, .38), [.05, .012, .02], [0, 0, -s * .5]), BR, .015);
    });
    fireMane(D, head, [
      [0, 1.15, .42, .2, 'mane', .7, .3], [.5, 1.0, .4, .19, 'mane'], [-.5, 1.0, .4, .19, 'mane'], [1.0, .75, .4, .2, 'maneTip'], [-1.0, .75, .4, .2, 'maneTip'],
      [1.45, .4, .38, .19, 'mane'], [-1.45, .4, .38, .19, 'mane'], [1.75, .05, .36, .18, 'maneTip'], [-1.75, .05, .36, .18, 'maneTip'],
      [2.3, .6, .42, .2, 'mane', .8], [-2.3, .6, .42, .2, 'mane', .8], [3.1, .7, .44, .21, 'maneTip', .9], [2.0, -.3, .32, .17, 'mane', .6], [-2.0, -.3, .32, .17, 'mane', .6]
    ]);
    S.limb([0, .78, -.5], [0, .9, -.74], .06, .045, O, { k: .04 });
    S.limb([0, .9, -.74], [0, 1.1, -.84], .045, .04, O, { k: .03 });
    S.limb([0, 1.1, -.84], [0, 1.22, -.78], .04, .036, O, { k: .03 });
    D.plume([0, 1.22, -.78], [0, 1, .1], .6, { face: [1, 0, 0], spread: .65, n: 3 });
    D.face({ c: head, spread: .52, pitch: .14, size: .068, iris: '#f0a02c', style: 'almond', lid: .22, lowLid: .08, lidColor: O, angry: .18, cheek: false, mouth: 'smile', mouthPitch: -.55, mouthW: .035 });
    D.ball('#3a2420', [0, 1.085, .765], [.032, .024, .022]);
  },

  // ---------------- Volcarbón · león de fuego que ruge sobre la roca (fuego/tierra)
  volcarbon(S, D) {
    const R = '#d04a26', RD = '#a8341c', C = '#f7e1bd', AU = '#f4b43a', RK = '#4c3c38', RK2 = '#64524a';
    // Roca volcánica bajo las patas.
    S.ball([0, .1, -.05], [.62, .14, .86], RK, { k: 0 });
    for (const [x, z, w, h, c] of [[.28, .3, .3, .13, RK2], [-.3, -.4, .32, .12, RK2], [-.36, .32, .24, .1, RK], [.34, -.46, .26, .11, RK], [0, .7, .2, .08, RK2], [.05, -.86, .22, .09, RK2], [.52, -.05, .18, .09, RK]]) S.ball([x, .12, z], [w, h, w * .9], c, { k: .05 });
    S.paint(E([.1, .22, .1], [.3, .03, .4]), '#7a3a26', .06);
    const F = .2;   // altura del suelo sobre la roca
    S.ball([0, F + .78, -.1], [.33, .31, .52], R, { k: .02 });
    S.paint(E([0, F + .6, -.06], [.24, .12, .44]), C, .08);
    S.ball([0, F + .88, .3], [.28, .3, .26], R, { k: .14 });
    S.limb([0, F + .95, .32], [0, F + 1.18, .48], .22, .18, R, { k: .1 });
    const head = [0, F + 1.3, .56];
    S.ball(head, [.25, .24, .25], R, { k: .1 });
    // Hocico rugiendo hacia arriba con la boca abierta.
    S.limb([0, F + 1.26, .66], [0, F + 1.34, .84], .14, .1, C, { k: .06 });
    S.ball([0, F + 1.16, .74], [.12, .07, .1], C, { k: .05 });
    S.carve(E([0, F + 1.25, .84], [.1, .075, .12], [-.5, 0, 0]), .02);
    S.paint(E([0, F + 1.25, .82], [.12, .095, .14], [-.5, 0, 0]), '#5e1422', .01);
    S.paint(E([0, F + 1.21, .82], [.07, .03, .08]), '#e86a7a', .01);
    for (const [x, y, z, up] of [[-.06, F + 1.31, .9, 1], [.06, F + 1.31, .9, 1], [-.06, F + 1.19, .88, 0], [.06, F + 1.19, .88, 0]]) { const f = D.cone('#fffaf0', [x, y, z], [.018, .05, .018]); f.rotation.x = up ? Math.PI * .85 : -.15; }
    ruff(D, C, [[6, F + 1.14, .56, .22, .28, .1], [5, F + 1.0, .58, .17, .34, .09], [4, F + .86, .54, .12, .3, .075], [3, F + .72, .48, .07, .22, .06]]);
    S.pair(s => {
      S.limb([s * .18, F + .86, .3], [s * .19, F + .42, .36], .11, .085, R, { k: .07 });
      S.limb([s * .19, F + .42, .36], [s * .19, F + .08, .38], .085, .072, C, { k: .03 });
      S.ball([s * .19, F + .055, .44], [.09, .06, .11], C, { k: .03 });
      S.ball([s * .2, F + .8, -.44], [.17, .25, .23], R, { k: .08 });
      S.limb([s * .21, F + .68, -.52], [s * .22, F + .36, -.6], .1, .075, R, { k: .05 });
      S.limb([s * .22, F + .36, -.6], [s * .22, F + .08, -.52], .075, .066, C, { k: .03 });
      S.ball([s * .22, F + .055, -.46], [.09, .06, .11], C, { k: .03 });
      D.claws(s * .19, F + .04, .54, .85, '#33241f'); D.claws(s * .22, F + .04, -.36, .85, '#33241f');
      D.swirl([s * .2, F + .8, -.44], s * 1.5, .15, .12, AU, { w: .028, turns: 1.15, tail: 7, flip: s });
      D.swirl([0, F + .88, .3], s * 1.15, .3, .08, AU, { w: .022, turns: 1, tail: 5, flip: -s });
      D.stripe([s * .19, F + .42, .36], [s * .5, .3], [s * .3, -.6], .022, .006, AU);
      const e = D.skin(head, s * .8, .75, -.03);
      S.limb(e, plus(e, [s * .1, .12, -.12]), .08, .02, R, { k: .04 });
      S.paint(E(D.skin(head, s * .38, .45), [.055, .014, .02], [0, 0, -s * .6]), '#4a1a10', .015);
    });
    // Melena de fuego enorme que fluye hacia atrás.
    fireMane(D, head, [
      [0, 1.2, .6, .26, 'mane', .8, .35], [.45, 1.05, .58, .25, 'maneTip', .8, .3], [-.45, 1.05, .58, .25, 'maneTip', .8, .3],
      [.95, .8, .56, .25, 'mane', .7], [-.95, .8, .56, .25, 'mane', .7], [1.4, .45, .52, .24, 'maneTip', .7], [-1.4, .45, .52, .24, 'maneTip', .7],
      [1.8, .1, .5, .23, 'mane', .6], [-1.8, .1, .5, .23, 'mane', .6], [2.3, .7, .6, .26, 'mane', .9, .3], [-2.3, .7, .6, .26, 'mane', .9, .3],
      [2.8, .9, .62, .26, 'maneTip', 1, .3], [-2.8, .9, .62, .26, 'maneTip', 1, .3], [2.2, -.25, .46, .22, 'maneTip', .7], [-2.2, -.25, .46, .22, 'maneTip', .7],
      [3.14, .4, .56, .25, 'mane', 1, .2], [1.2, -.2, .4, .2, 'mane', .6], [-1.2, -.2, .4, .2, 'mane', .6]
    ]);
    S.limb([0, F + .86, -.58], [0, F + .96, -.86], .07, .05, R, { k: .04 });
    S.limb([0, F + .96, -.86], [0, F + 1.2, -.98], .05, .045, R, { k: .03 });
    S.limb([0, F + 1.2, -.98], [0, F + 1.36, -.92], .045, .04, R, { k: .03 });
    D.plume([0, F + 1.36, -.92], [0, 1, -.15], .78, { face: [1, 0, 0], spread: .7, n: 4 });
    // Brasas que suben.
    const sparks = [];
    for (let i = 0; i < 12; i++) { const m = D.ball(D.glow(i % 3 ? '#ff9a3a' : '#ffd25a', 1.4), [0, 0, 0], .022); m.userData.keep = true; sparks.push({ m, x: Math.cos(i * 2.4) * (.4 + (i % 4) * .12), z: Math.sin(i * 2.4) * (.5 + (i % 3) * .12) - .1, ph: i / 12 }); }
    D.anim(t => { for (const p of sparks) { const u = (t * .22 + p.ph) % 1; p.m.position.set(p.x + Math.sin(t * 2 + p.ph * 9) * .06, .5 + u * 1.9, p.z); p.m.scale.setScalar(.022 * (1 - u) + .004); } });
    D.face({ c: head, spread: .58, pitch: .3, size: .058, iris: '#ffd040', style: 'almond', lid: .32, lowLid: .1, lidColor: R, angry: .28, cheek: false, mouth: 'none' });
    D.ball('#2e1a16', [0, F + 1.4, .9], [.04, .028, .026]);
  },

  // ---------------- Charquín · foquita de cola de pez (agua)
  charquin(S, D) {
    const B = '#3e92e2', BD = '#2a72c4', C = '#f4ecdb', SP = '#a2d6f8', FN = '#8ed0f6';
    S.ball([0, .42, -.06], [.28, .3, .31], B, { k: 0 });
    S.paint(E([0, .38, .2], [.21, .27, .14]), C, .07);
    S.pair(s => S.ball([s * .13, .3, -.24], [.14, .15, .16], B, { k: .08 }));
    S.pair(s => {
      S.limb([s * .13, .3, .14], [s * .14, .08, .17], .072, .064, B, { k: .05 });
      S.ball([s * .14, .055, .21], [.078, .05, .088], C, { k: .03 });
      S.limb([s * .16, .25, -.27], [s * .17, .08, -.24], .076, .066, B, { k: .05 });
      S.ball([s * .17, .055, -.19], [.078, .05, .088], C, { k: .03 });
      S.paint(E(D.skin([s * .13, .3, -.24], s * 1.5, .3), .03), SP, .02);
    });
    const head = [0, .88, .1];
    S.ball(head, [.33, .3, .29], B, { k: .14 });
    S.paint(E([0, .76, .26], [.27, .15, .17]), C, .08);
    S.ball([0, .77, .34], [.13, .08, .075], C, { k: .06, kc: .03 });
    for (const [yaw, pitch, r] of [[0, 1.2, .045], [-.4, 1.0, .035], [.4, 1.0, .035], [-.2, .75, .028], [.2, .75, .028]]) S.paint(E(D.skin(head, yaw, pitch), r), SP, .015);
    S.pair(s => {
      const b = D.skin(head, s * 1.4, .05, -.04);
      D.blade('fin', D.finMat(FN, .3, .88), b, plus(b, [s * .24, .08, -.08]), .2, [s * .2, .2, 1], { curl: .1, thick: .6 });
    });
    // Aletitas del lomo y cola larga con aleta de pez.
    for (const [p, h] of [[1.45, .14], [1.85, .11]]) { const b = D.skin([0, .42, -.06], 0, p, -.03); D.blade('crest', D.finMat(FN, .3, .9), b, plus(b, [0, h, -.08]), .14, [1, 0, 0], { thick: .5 }); }
    S.limb([0, .32, -.34], [0, .24, -.6], .12, .07, B, { k: .07 });
    S.limb([0, .24, -.6], [0, .3, -.82], .07, .045, B, { k: .04 });
    D.blade('fluke', D.M(B, { roughness: .3 }), [0, .3, -.8], [0, .44, -1.08], .5, [1, 0, 0], { curl: .08, thick: .55 });
    D.blade('fluke', D.finMat(FN, .35, .85), [.012, .31, -.84], [.012, .43, -1.06], .4, [1, 0, 0], { thick: .4 });
    D.face({ c: head, spread: .42, pitch: .04, size: .09, iris: '#2e78de', style: 'round', cheek: '#f6a6b8', mouth: 'open', mouthPitch: -.34, mouthW: .05, fangs: true });
    D.ball('#1e2a44', [0, .8, .42], [.034, .024, .02]);
  },

  // ---------------- Charcomar · nutria dragón de aletas (agua)
  charcomar(S, D) {
    const B = '#3a86e0', BD = '#2a64bc', C = '#f3ebd8', SP = '#a8daf8', FN = '#86ccf6';
    S.ball([0, .5, -.22], [.26, .26, .46], B, { k: 0 });
    S.paint(E([0, .36, -.18], [.2, .1, .4]), C, .08);
    S.limb([0, .6, .12], [0, 1.02, .3], .21, .13, B, { k: .12 });
    S.paint(E([0, .8, .28], [.13, .3, .1]), C, .07);
    const head = [0, 1.16, .36];
    S.ball(head, [.18, .17, .19], B, { k: .1 });
    S.paint(E([0, 1.08, .46], [.15, .08, .12]), C, .05);
    S.limb([0, 1.11, .44], [0, 1.08, .58], .1, .065, C, { k: .06 });
    S.pair(s => {
      S.limb([s * .14, .46, .12], [s * .15, .08, .16], .07, .058, B, { k: .06 });
      S.ball([s * .15, .05, .2], [.068, .045, .08], C, { k: .03 });
      S.ball([s * .15, .5, -.5], [.13, .17, .18], B, { k: .08 });
      S.limb([s * .16, .4, -.54], [s * .17, .08, -.5], .072, .06, B, { k: .05 });
      S.ball([s * .17, .05, -.45], [.068, .045, .08], C, { k: .03 });
      for (const [yaw, pitch, r] of [[1.5, .3, .04], [1.8, .1, .03], [1.3, .55, .028]]) S.paint(E(D.skin([s * .15, .5, -.5], s * yaw, pitch), r), SP, .015);
      // Dos pares de aletas en la nuca.
      for (const [yaw, pitch, l, w, up] of [[.9, .55, .34, .24, .22], [1.25, .2, .26, .18, .1]]) { const b = D.skin(head, s * yaw, pitch, -.03); D.blade('crest', D.finMat(FN, .32, .86), b, plus(b, [s * .16, up, -l]), w, [s, .3, .2], { curl: .12, thick: .5 }); }
    });
    for (const [zz, h] of [[-.05, .18], [-.3, .16], [-.52, .12]]) { const b = [0, .74, zz]; D.blade('crest', D.finMat(FN, .3, .86), b, plus(b, [0, h, -.14]), .16, [1, 0, 0], { thick: .5 }); }
    S.limb([0, .48, -.62], [0, .42, -.9], .17, .11, B, { k: .08 });
    S.limb([0, .42, -.9], [0, .54, -1.14], .11, .07, B, { k: .05 });
    S.limb([0, .54, -1.14], [0, .78, -1.26], .07, .045, B, { k: .04 });
    D.blade('fin', D.finMat(FN, .38, .84), [0, .76, -1.24], [0, 1.28, -1.3], .62, [1, 0, 0], { curl: -.22, thick: .45 });
    D.face({ c: head, spread: .56, pitch: .12, size: .064, iris: '#3a7ae6', style: 'almond', lid: .1, lidColor: B, cheek: false, mouth: 'smile', mouthPitch: -.5, mouthW: .035 });
    D.ball('#1e2a44', [0, 1.115, .6], [.03, .022, .02]);
  },

  // ---------------- Mareón · señor del mar con corona y gema (agua/psíquico)
  mareon(S, D) {
    const B = '#2f60d2', BL = '#5a90ea', C = '#f3ecdf', AU = '#e8c060', FN = '#7ec8f8', GEM = '#5ff2f2';
    S.ball([0, 1.0, -.12], [.26, .26, .5], B, { k: 0 });
    S.paint(E([0, .84, -.08], [.2, .1, .42]), C, .08);
    S.ball([0, 1.08, .3], [.21, .27, .21], C, { k: .12 });
    S.limb([0, 1.14, .32], [0, 1.46, .48], .15, .11, C, { k: .1 });
    S.paint(E([0, 1.36, .36], [.11, .17, .06]), B, .05);
    const head = [0, 1.58, .55];
    S.ball(head, [.17, .16, .19], B, { k: .1 });
    S.paint(E([0, 1.5, .66], [.14, .07, .12]), C, .05);
    S.limb([0, 1.53, .63], [0, 1.49, .79], .09, .055, C, { k: .06 });
    S.pair(s => {
      S.limb([s * .14, .98, .3], [s * .15, .52, .34], .078, .06, B, { k: .07 });
      S.limb([s * .15, .52, .34], [s * .15, .08, .36], .06, .05, C, { k: .03 });
      S.ball([s * .15, .05, .4], [.065, .045, .08], BL, { k: .03 });
      S.ball([s * .16, .98, -.46], [.14, .22, .2], B, { k: .1 });
      S.limb([s * .17, .84, -.52], [s * .18, .44, -.62], .08, .058, B, { k: .05 });
      S.limb([s * .18, .44, -.62], [s * .18, .08, -.54], .056, .048, C, { k: .03 });
      S.ball([s * .18, .05, -.49], [.065, .045, .08], BL, { k: .03 });
      D.swirl([s * .16, .98, -.46], s * 1.55, .1, .09, BL, { w: .02, turns: 1, tail: 6, flip: s });
      D.stripe([s * .15, .52, .34], [s * .9, .9], [s * .6, -.3], .024, .008, BL);
      // Corona dorada en la frente y aletas largas que caen como cabello.
      const cb = D.skin(head, s * .3, .9, -.02);
      D.blade('crest', D.M(AU, { metalness: .55, roughness: .28, emissive: '#c08a2a', emissiveIntensity: .25 }), cb, plus(cb, [s * .12, .2, -.12]), .12, [s * .5, .3, 1], { curl: -.1, thick: .5 });
      for (const [yaw, pitch, l, w] of [[.85, .6, .72, .24], [1.2, .25, .6, .2], [.6, .95, .8, .22]]) { const b = D.skin(head, s * yaw, pitch, -.03); D.blade('stream', D.finMat(FN, .4, .8), b, plus(b, [s * .2, .12, -l]), w, [s, .4, .2], { curl: .25, thick: .4 }); }
      // Pechera dorada con alas.
      D.blade('crest', D.M(AU, { metalness: .55, roughness: .28, emissive: '#c08a2a', emissiveIntensity: .25 }), [s * .05, 1.12, .5], [s * .26, 1.26, .4], .16, [s * .3, .2, 1], { curl: -.12, thick: .45 });
    });
    D.gem(D.skin(head, 0, .78, .005), GEM, .03);
    D.gem(D.skin([0, 1.08, .3], 0, .15, .005), GEM, .052);
    // Colas de agua: tres aletas largas que flotan detrás.
    for (const [x, up, l, w] of [[0, .8, .9, .52], [.22, .5, .78, .42], [-.22, .5, .78, .42]]) D.blade('fin', D.finMat(FN, .42, .8), [x * .3, 1.06, -.6], [x * 1.6, 1.06 + up * l, -.6 - l * .8], w, [x * 4 + .01, .3, -1], { curl: -.2, thick: .4 });
    // Agua que gira a los pies (dos arcos anchos), un charco claro y crestas de ola alrededor.
    const water = D.finMat('#9ad8ff', .5, .42), arcs = [];
    for (let i = 0; i < 2; i++) { const m = D.arc(water, [0, .08 + i * .16, -.06], .7 + i * .12, Math.PI * 1.35, .045, [Math.PI / 2 + (i ? .14 : -.1), 0, i * 2]); m.userData.keep = true; arcs.push(m); }
    const pool = D.ball(D.finMat('#bfe8ff', .35, .38), [0, .015, -.06], [.9, .012, .78]); pool.userData.keep = true;
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + .3, b = [Math.cos(a) * .66, .01, Math.sin(a) * .58 - .06], o = [Math.cos(a), 0, Math.sin(a)]; D.blade('crest', D.finMat('#a8e0ff', .45, .7), b, plus(b, [o[0] * .12, .2 + (i % 3) * .06, o[2] * .12]), .2, o, { curl: .3, thick: .4, keep: true }); }
    const drops = [];
    for (let i = 0; i < 8; i++) { const m = D.ball(D.finMat('#c8eeff', .6, .85), [0, 0, 0], .026); m.userData.keep = true; drops.push({ m, a: i / 8 * Math.PI * 2, ph: i * .37 }); }
    D.anim(t => {
      arcs.forEach((m, i) => { m.rotation.z = i * 2 + t * (.8 + i * .3) * (i % 2 ? -1 : 1); });
      for (const d of drops) { const u = (t * .5 + d.ph) % 1, a = d.a + t * .4; d.m.position.set(Math.cos(a) * .72, .08 + Math.sin(u * Math.PI) * .42, Math.sin(a) * .72 - .06); d.m.visible = u < .96; }
    });
    D.face({ c: head, spread: .62, pitch: .14, size: .056, iris: '#48b4ff', style: 'almond', lid: .16, lidColor: B, cheek: false, mouth: 'smile', mouthPitch: -.5, mouthW: .03 });
    D.ball('#1e2a44', [0, 1.495, .815], [.028, .02, .02]);
  }
};
