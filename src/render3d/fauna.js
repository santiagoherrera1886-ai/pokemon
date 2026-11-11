// Nueve familias de criaturas inspiradas en la fauna de Colombia, con el mismo acabado de figura que el resto:
//   Arrierín → Arrierón   (hormiga arriera que carga una hoja)
//   Colibrín → Colibrón   (colibrí de garganta brillante)
//   Doradita → Doradón    (rana dorada del Chocó)
//   Gurrín   → Gurrón     (armadillo con caparazón de placas)
//   Cangrejín→ Cangrejón  (cangrejo de playa con una muela enorme)
//   Perecín  → Perezón    (perezoso con musgo en el lomo)
//   Anteojín → Anteojón   (oso de anteojos)
//   Orugazul → Mariposol  (oruga y mariposa azul)
//   Condorín → Condoral   (cóndor de los Andes)
// S = cuerpo esculpido en una pieza, D = detalles. Cada criatura mira hacia +z y pisa y = 0.
import { Sculpt } from './sculpt.js';

const E = Sculpt.ellipsoid, RC = Sculpt.roundCone;
const plus = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// Pata de insecto en tres tramos (cadera arriba, rodilla afuera, pie en el piso).
function bugLeg(D, from, out, back, color, { knee = .3, foot = .02, rad = .022 } = {}) {
  const hip = from, mid = [from[0] + out, from[1] + knee, from[2] + back];
  const toe = [from[0] + out * 1.45, foot, from[2] + back * 1.5];
  D.stick(color, hip, mid, rad); D.stick(color, mid, toe, rad * .82);
  D.ball(color, toe, [rad * 1.5, rad * .9, rad * 2.2]);
}
// Ala de mariposa: una lámina grande y otra pequeña, con lunares y borde oscuro.
function butterflyWing(D, s, at, { len = .78, w = .5, color = '#3f6ad8', edge = '#1b2450', dots = '#cfe2ff', lift = .2, sweep = .5 }) {
  const up = [at[0] + s * len * .82, at[1] + len * (.52 + lift), at[2] - len * sweep * .3];
  const low = [at[0] + s * len * .62, at[1] - len * .3, at[2] - len * sweep * .42];
  const face = [0, 0, 1];
  D.blade('ear', edge, at, up, w * 1.08, face, { cup: .1, thick: .18 });
  D.blade('ear', color, plus(at, [0, 0, .012]), plus(up, [0, 0, .012]), w * .9, face, { cup: .1, thick: .16 });
  D.blade('ear', edge, at, low, w * .78, face, { cup: .14, thick: .18 });
  D.blade('ear', color, plus(at, [0, 0, .012]), plus(low, [0, 0, .012]), w * .62, face, { cup: .14, thick: .16 });
  for (const [t, r] of [[.48, .09], [.72, .06]]) D.ball(dots, [at[0] + (up[0] - at[0]) * t + s * .04, at[1] + (up[1] - at[1]) * t, at[2] + (up[2] - at[2]) * t + .02], [r, r * 1.2, .012]);
  D.ball(dots, [at[0] + (low[0] - at[0]) * .6, at[1] + (low[1] - at[1]) * .6, at[2] + (low[2] - at[2]) * .6 + .02], [.055, .07, .012]);
}

export const FAUNA = {
  // ---------------- Hormiga arriera ----------------
  arrierin(S, D) {
    const body = '#7a3a24', shine = '#a85a34';
    S.ball([0, .3, -.3], [.24, .22, .26], body, { k: 0 });                      // abdomen
    S.ball([0, .3, 0], [.18, .17, .2], body, { k: .12 });                       // tórax
    S.ball([0, .4, .3], [.21, .19, .19], shine, { k: .1 });                     // cabeza
    S.paint(E([0, .3, -.42], [.18, .16, .14]), '#5a2816', .05);
    D.antennae('#4a2414', '#f0c46a', .09, .54, .26, .26, .5, .1);
    for (const s of [-1, 1]) {
      bugLeg(D, [s * .13, .3, .12], s * .2, .1, '#4a2414');
      bugLeg(D, [s * .14, .28, -.02], s * .24, -.04, '#4a2414');
      bugLeg(D, [s * .13, .28, -.16], s * .2, -.16, '#4a2414');
      D.cone('#f0e2a0', [s * .07, .35, .46], [.035, .09, .035], [Math.PI / 2.1, 0, s * .4]);   // mandíbulas
    }
    // La hoja que carga sobre la cabeza.
    D.blade('leaf', '#67b24a', [0, .56, .12], [0, .96, .3], .34, [0, .3, 1], { curl: -.1, cup: .25, thick: .5 });
    D.stick('#4e8c38', [0, .54, .18], [0, .62, .16], .014);
    D.face({ c: [0, .4, .3], spread: .5, pitch: .1, size: .052, iris: '#1c1a22', style: 'led', mouth: 'none' });
  },
  arrieron(S, D) {
    const body = '#4a1c0e', shine = '#d8a024';
    S.ball([0, .52, -.56], [.4, .38, .46], body, { k: 0 });
    S.ball([0, .5, -.06], [.3, .3, .34], body, { k: .14 });
    S.limb([0, .5, .16], [0, .72, .44], .14, .2, shine, { k: .12 });
    S.ball([0, .76, .54], [.32, .28, .3], shine, { k: .1 });
    S.paint(E([0, .5, -.78], [.3, .26, .24]), '#4a1e10', .07);
    S.paint(E([0, .9, .62], [.2, .12, .16]), '#c87a44', .05);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) S.limb([s * .14, .72, -.34 - i * .2], [s * .3, 1.02 - i * .06, -.44 - i * .24], .06, .018, '#8a3a16', { k: .05 });   // púas del lomo
      bugLeg(D, [s * .22, .5, .22], s * .34, .2, '#3f1c0c', { knee: .5, rad: .034 });
      bugLeg(D, [s * .24, .48, 0], s * .4, -.06, '#3f1c0c', { knee: .46, rad: .034 });
      bugLeg(D, [s * .22, .48, -.24], s * .34, -.26, '#3f1c0c', { knee: .44, rad: .034 });
      D.spike('#f4e6ae', [s * .12, .7, .74], [s * .26, .78, 1.02], .04);   // mandíbulas largas
      D.cone('#f4e6ae', [s * .2, .74, .92], [.045, .16, .045], [Math.PI / 2.2, 0, s * .7]);
    }
    D.antennae('#3f1c0c', '#f6c84e', .13, .96, .46, .36, .55, .14);
    // Hoja grande sobre el lomo, sostenida con las mandíbulas.
    D.blade('leaf', '#5fab42', [0, 1.02, .22], [0, 2.1, .5], .92, [0, .25, 1], { curl: -.12, cup: .22, thick: .5 });
    D.blade('leaf', '#4b8e34', [0, 1.02, .2], [0, 1.84, .42], .46, [0, .25, 1], { curl: -.1, cup: .3, thick: .4 });
    D.face({ c: [0, .76, .54], spread: .46, pitch: .12, size: .07, iris: '#ffd24a', style: 'led', mouth: 'none' });
  },

  // ---------------- Colibrí ----------------
  colibrin(S, D) {
    const back = '#2f9f6a', belly = '#d8f0dc';
    S.ball([0, .62, 0], [.26, .27, .3], back, { k: 0 });
    S.ball([0, .88, .12], [.2, .19, .19], back, { k: .14 });
    S.paint(E([0, .56, .24], [.2, .22, .2]), belly, .05);
    S.paint(E([0, .8, .26], [.14, .12, .12]), '#e0446a', .04);                  // garganta rosada
    S.limb([0, .5, -.26], [0, .34, -.6], .09, .03, back, { k: .08 });           // cola corta
    D.stick('#2a2028', [0, .9, .3], [0, .92, .62], .018);                       // pico largo
    for (const s of [-1, 1]) {
      D.blade('ear', back, [s * .18, .66, .02], [s * .52, .86, -.2], .16, [0, 1, .2], { curl: .18, thick: .3 });
      D.stick('#e8b45a', [s * .07, .4, .06], [s * .08, .2, .1], .016);
      D.ball('#e8b45a', [s * .08, .18, .14], [.045, .02, .06]);
    }
    D.ball(D.glow('#58e0b0', .3), [0, .95, .02], [.06, .05, .05]);
    D.face({ c: [0, .88, .12], spread: .52, pitch: .08, size: .062, iris: '#1a1420', style: 'round', mouth: 'none' });
  },
  colibron(S, D) {
    const back = '#1f8f7a', belly = '#e6f6ec';
    S.ball([0, .92, 0], [.3, .32, .36], back, { k: 0 });
    S.ball([0, 1.26, .14], [.23, .22, .22], back, { k: .14 });
    S.paint(E([0, .86, .3], [.23, .26, .22]), belly, .06);
    S.paint(E([0, 1.16, .3], [.17, .16, .14]), '#e03a78', .04);
    S.paint(E([0, 1.3, .1], [.2, .1, .2]), '#36c0a0', .05);
    S.limb([0, .76, -.3], [0, .5, -.9], .1, .03, back, { k: .08 });
    for (const s of [-1, 1]) {
      S.limb([s * .05, .72, -.3], [s * .16, .38, -1.0], .05, .02, '#17705f', { k: .05 });   // plumas de la cola
      D.wing({ side: s, at: [s * .22, 1.0, -.02], len: 1.05, width: .1, n: 5, spread: .8, lift: .5, sweep: .5, tilt: .12, colors: ['#2aa08a', '#1f8f7a'], tips: '#bff0e2' });
      D.stick('#d8a04a', [s * .09, .66, .06], [s * .1, .26, .12], .02);
      D.ball('#d8a04a', [s * .1, .22, .18], [.055, .025, .075]);
      D.cone('#2a9c86', [s * .12, 1.46, .06], [.05, .16, .05], [-.2, 0, s * .35]);          // copete
    }
    D.stick('#2a2028', [0, 1.3, .34], [0, 1.3, .86], .022);
    D.gem([0, 1.18, .34], '#ff5a94', .05);
    D.face({ c: [0, 1.26, .14], spread: .5, pitch: .08, size: .066, iris: '#20141c', style: 'round', mouth: 'none' });
  },

  // ---------------- Rana dorada ----------------
  doradita(S, D) {
    const skin = '#f6c81e';
    S.ball([0, .3, 0], [.34, .28, .3], skin, { k: 0 });
    S.ball([0, .46, .18], [.27, .22, .24], skin, { k: .18 });
    S.paint(E([0, .18, .18], [.26, .16, .24]), '#fde98a', .05);
    S.pair(s => {
      S.ball([s * .17, .55, .16], [.11, .1, .1], skin, { k: .09 });             // ojos saltones
      S.limb([s * .24, .28, .1], [s * .34, .1, .22], .08, .055, skin, { k: .07 });
      S.limb([s * .24, .28, -.1], [s * .36, .26, -.26], .09, .06, skin, { k: .07 });
      S.limb([s * .36, .26, -.26], [s * .34, .08, -.02], .06, .05, skin, { k: .06 });
      D.ball('#fbe07a', [s * .34, .06, .3], [.1, .035, .12]);
      D.ball('#fbe07a', [s * .34, .06, .02], [.1, .035, .12]);
    });
    for (const [x, y, z, r] of [[.14, .42, -.16, .05], [-.16, .38, -.08, .045], [.02, .46, -.22, .04]]) D.ball('#7a4a06', [x, y, z], [r, r * .6, r]);
    D.face({ c: [0, .46, .2], spread: .42, pitch: .3, size: .068, iris: '#20160a', mouth: 'smile', mouthPitch: -.25, mouthW: .07 });
  },
  doradon(S, D) {
    const skin = '#f2b812';
    S.ball([0, .48, 0], [.5, .42, .46], skin, { k: 0 });
    S.ball([0, .74, .3], [.4, .33, .34], skin, { k: .2 });
    S.paint(E([0, .26, .3], [.4, .22, .34]), '#fff0a0', .06);
    for (const [x, y, z, r] of [[0, .72, -.3, .22], [.3, .54, -.06, .17], [-.3, .54, -.06, .17], [.2, .66, .2, .12], [-.2, .66, .2, .12], [0, .3, -.3, .14]])
      S.paint(E([x, y, z], [r, r * .9, r]), '#17151e', .06);
    S.pair(s => {
      S.ball([s * .25, .92, .28], [.16, .15, .15], skin, { k: .1 });
      S.limb([s * .36, .44, .16], [s * .52, .12, .38], .12, .07, skin, { k: .08 });
      S.limb([s * .36, .46, -.16], [s * .58, .44, -.42], .13, .08, skin, { k: .08 });
      S.limb([s * .58, .44, -.42], [s * .52, .1, .0], .085, .06, skin, { k: .07 });
      for (let i = -1; i <= 1; i++) D.ball('#ffe88a', [s * .52 + i * .07, .07, .5], [.055, .035, .09]);
      for (let i = -1; i <= 1; i++) D.ball('#ffe88a', [s * .52 + i * .07, .07, .06], [.055, .035, .09]);
      S.paint(E([s * .5, .3, .2], [.14, .12, .14]), '#17151e', .05);
    });
    D.ball(D.glow('#9bf0c8', .35), [0, .98, .5], [.05, .04, .04]);
    D.face({ c: [0, .76, .32], spread: .4, pitch: .28, size: .082, iris: '#1a1208', mouth: 'smile', mouthPitch: -.25, mouthW: .1 });
  },

  // ---------------- Armadillo ----------------
  gurrin(S, D) {
    const shell = '#9c8464', skin = '#efd9b2';
    S.ball([0, .34, -.06], [.36, .32, .4], shell, { k: 0 });
    S.limb([0, .36, .22], [0, .3, .5], .18, .13, skin, { k: .14 });
    S.ball([0, .3, .56], [.16, .14, .14], skin, { k: .1 });
    S.paint(E([0, .14, 0], [.3, .14, .34]), '#f0dcbc', .05);
    for (let i = 0; i < 4; i++) {
      const z = .18 - i * .17, k = 1 - Math.abs(i - 1.4) * .05;
      S.ball([0, .34, z], [.37 * k, .35 * k, .055], i % 2 ? '#7f6a4c' : '#bda886', { k: .035, kc: .015 });
      S.paint(E([0, .66 * k, z], [.1, .05, .05]), '#6a5638', .02);
    }
    S.limb([0, .28, -.42], [0, .14, -.74], .09, .035, shell, { k: .08 });
    S.pair(s => {
      S.ball([s * .11, .46, .5], [.06, .11, .05], skin, { k: .05, rot: [.1, 0, s * .2] });   // orejitas
      D.ball('#c9ab82', [s * .17, .1, .2], [.1, .07, .12]);
      D.ball('#c9ab82', [s * .17, .1, -.16], [.1, .07, .12]);
      D.claws(s * .17, .06, .3, .7, '#fff2d8');
    });
    D.ball('#6a4a2a', [0, .28, .68], [.05, .04, .04]);
    D.face({ c: [0, .32, .52], spread: .5, pitch: .22, size: .055, iris: '#30220e', style: 'round', mouth: 'none' });
  },
  gurron(S, D) {
    const shell = '#7d7f88', plate = '#b7bcc6';
    S.ball([0, .66, -.16], [.6, .56, .72], shell, { k: 0 });
    S.limb([0, .62, .42], [0, .52, .86], .28, .2, '#e2c9a2', { k: .16 });
    S.ball([0, .5, .96], [.24, .21, .22], '#e2c9a2', { k: .12 });
    S.paint(E([0, .2, -.1], [.48, .18, .6]), '#e8d6b4', .07);
    S.paint(E([0, .98, -.16], [.3, .22, .5]), '#cfd6e2', .08);
    for (let i = 0; i < 6; i++) {
      const z = .4 - i * .21, k = 1 - Math.abs(i - 2.2) * .07;
      S.ball([0, .66, z], [.65 * k, .62 * k, .08], i % 2 ? plate : shell, { k: .04, kc: .02 });
      S.paint(E([0, 1.2 * k + .06, z], [.14, .07, .07]), '#5e606a', .025);
      for (const s of [-1, 1]) S.limb([s * .5 * k, .92 * k + .1, z], [s * .64 * k, 1.0 * k + .16, z], .05, .02, '#d8dee8', { k: .04 });
    }
    S.limb([0, .5, -.84], [0, .22, -1.4], .14, .05, shell, { k: .1 });
    S.pair(s => {
      S.ball([s * .18, .74, .88], [.08, .18, .07], '#e2c9a2', { k: .06, rot: [.12, 0, s * .22] });
      S.limb([s * .3, .4, .3], [s * .34, .1, .34], .14, .12, '#9a8a72', { k: .1 });
      S.limb([s * .32, .4, -.34], [s * .38, .1, -.4], .15, .13, '#9a8a72', { k: .1 });
      D.claws(s * .34, .08, .5, 1.2, '#f6ead2');
      D.claws(s * .38, .08, -.24, 1.1, '#f6ead2');
      D.spike('#cbb894', [s * .3, 1.04, -.2], [s * .42, 1.24, -.34], .05);
    });
    D.ball('#5a4428', [0, .48, 1.12], [.07, .055, .05]);
    D.face({ c: [0, .54, .9], spread: .44, pitch: .2, size: .07, iris: '#3a2810', style: 'round', mouth: 'smile', mouthPitch: -.4, mouthW: .055 });
  },

  // ---------------- Cangrejo ----------------
  cangrejin(S, D) {
    const shell = '#e2603a', pale = '#f8b08a';
    S.ball([0, .34, 0], [.42, .26, .34], shell, { k: 0 });
    S.paint(E([0, .2, .2], [.34, .14, .24]), pale, .05);
    S.paint(E([0, .44, .18], [.3, .1, .18]), '#c8452a', .05);
    S.pair(s => {
      S.limb([s * .36, .34, .1], [s * .62, .42, .24], .09, .1, shell, { k: .08 });
      S.ball([s * .7, .46, .34], [.14, .13, .1], shell, { k: .07 });            // muela
      S.carve(E([s * .76, .5, .42], [.1, .05, .09]), .02);
      D.ball(pale, [s * .72, .4, .4], [.1, .05, .08]);
      D.stick('#d2502c', [s * .18, .5, .12], [s * .22, .68, .18], .022);        // ojos con tallo
      for (let i = 0; i < 3; i++) { const z = .06 - i * .16; D.stick('#c8452a', [s * .3, .3, z], [s * .5, .16, z - .06], .025); D.stick('#c8452a', [s * .5, .16, z - .06], [s * .58, .03, z - .1], .02); }
    });
      D.face({ c: [0, .38, .1], spread: .34, pitch: .62, size: .05, iris: '#1c1420', style: 'led', mouth: 'smile', mouthPitch: -.1, mouthW: .06 });
    for (const s of [-1, 1]) D.ball('#1c1420', [s * .22, .72, .2], [.055, .06, .055]);
  },
  cangrejon(S, D) {
    const shell = '#d84a28', pale = '#f8c09a';
    S.ball([0, .56, 0], [.7, .4, .52], shell, { k: 0 });
    S.paint(E([0, .3, .3], [.56, .2, .34]), pale, .06);
    S.paint(E([0, .74, .26], [.5, .14, .26]), '#b73a1e', .06);
    S.pair(s => {
      for (let i = 0; i < 4; i++) {
        const z = .14 - i * .2, L = 1 - i * .08;
        D.stick('#b73a1e', [s * .52, .5, z], [s * .86 * L, .3, z - .1], .036);
        D.stick('#b73a1e', [s * .86 * L, .3, z - .1], [s * 1.02 * L, .04, z - .16], .028);
        D.cone('#e8d0b0', [s * 1.04 * L, .03, z - .18], [.03, .08, .03], [Math.PI / 2, 0, -s * .5]);
      }
      D.stick('#c8452a', [s * .26, .84, .2], [s * .32, 1.12, .28], .034);
      D.ball('#1c1420', [s * .33, 1.18, .3], [.085, .095, .085]);
      D.ball('#ffffff', [s * .36, 1.22, .36], [.03, .032, .02]);
    });
    // Una muela enorme y otra pequeña.
    S.limb([.6, .56, .14], [1.0, .64, .36], .14, .16, shell, { k: .1 });
    S.ball([1.16, .72, .5], [.3, .26, .2], shell, { k: .08 });
    S.carve(E([1.3, .8, .64], [.2, .09, .17]), .03);
    D.ball(pale, [1.2, .62, .6], [.2, .09, .16]);
    S.limb([-.58, .5, .12], [-.84, .5, .3], .1, .11, shell, { k: .09 });
    S.ball([-.94, .56, .42], [.17, .15, .12], shell, { k: .07 });
    S.carve(E([-1.0, .6, .52], [.11, .055, .1]), .02);
    D.ball(pale, [-.96, .5, .48], [.12, .06, .1]);
    D.face({ c: [0, .6, .1], spread: .3, pitch: .55, size: .055, iris: '#1c1420', style: 'led', mouth: 'smile', mouthPitch: -.15, mouthW: .08 });
  },

  // ---------------- Perezoso ----------------
  perecin(S, D) {
    const fur = '#a8906e', face = '#e2cfa8';
    S.ball([0, .56, 0], [.34, .38, .3], fur, { k: 0 });
    S.ball([0, .94, .06], [.28, .26, .26], fur, { k: .16 });
    S.paint(E([0, .92, .28], [.2, .18, .16]), face, .05);
    S.paint(E([0, .4, .26], [.26, .24, .18]), '#c4ad86', .06);
    S.pair(s => {
      S.limb([s * .24, .76, .04], [s * .4, .3, .14], .1, .08, fur, { k: .09 });
      S.limb([s * .2, .3, 0], [s * .3, .06, .12], .1, .08, fur, { k: .09 });
      S.paint(E([s * .14, .98, .26], [.09, .11, .07]), '#7a6244', .035);        // antifaz
      D.claws(s * .4, .22, .2, .9, '#e8dcc0');
      D.claws(s * .3, .05, .2, .8, '#e8dcc0');
    });
    // Musgo en el lomo.
    for (const [x, y, z] of [[.1, .78, -.22], [-.12, .66, -.24], [0, .88, -.2], [.16, .56, -.2]]) D.ball('#7fae58', [x, y, z], [.09, .06, .07]);
    D.ball('#4a3626', [0, .9, .36], [.06, .05, .04]);
    D.face({ c: [0, .94, .08], spread: .4, pitch: .04, size: .062, iris: '#3a2a16', style: 'round', mouth: 'smile', mouthPitch: -.5, mouthW: .05 });
  },
  perezon(S, D) {
    const fur = '#9a8364', face = '#e8d6ae';
    S.ball([0, .84, 0], [.52, .56, .46], fur, { k: 0 });
    S.ball([0, 1.42, .08], [.38, .36, .36], fur, { k: .18 });
    S.paint(E([0, 1.4, .4], [.27, .25, .2]), face, .06);
    S.paint(E([0, .6, .38], [.38, .34, .24]), '#b79a74', .07);
    S.paint(E([0, 1.08, -.4], [.42, .4, .2]), '#7e8c5a', .09);
    S.pair(s => {
      S.limb([s * .36, 1.2, .06], [s * .68, .5, .2], .14, .1, fur, { k: .1 });
      S.limb([s * .3, .44, .02], [s * .44, .1, .18], .14, .11, fur, { k: .1 });
      S.paint(E([s * .2, 1.48, .38], [.12, .15, .1]), '#6a5338', .04);
      D.claws(s * .68, .38, .3, 1.3, '#ede0c4');
      D.claws(s * .44, .08, .3, 1.1, '#ede0c4');
      D.ball('#c8b48e', [s * .3, 1.66, .0], [.1, .09, .08]);
    });
    for (const [x, y, z, r] of [[.16, 1.1, -.34], [-.2, .94, -.36], [.04, 1.26, -.3], [.24, .76, -.3], [-.1, .66, -.34], [.3, 1.0, -.24], [-.3, 1.14, -.22], [0, .5, -.4]])
      D.ball('#76a84e', [x, y, z], [r || .15, .1, .11]);
    D.ball('#ffd84a', [-.02, 1.4, -.3], [.09, .07, .07]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; D.ball('#fff4de', [-.02 + Math.cos(a) * .12, 1.4 + Math.sin(a) * .1, -.3], [.06, .05, .04]); }
    for (const [x, y, z] of [[.1, 1.22, -.36], [-.14, .86, -.4]]) D.blade('leaf', '#8fc268', [x, y, z], [x + .1, y + .3, z - .12], .16, [0, .4, -1], { cup: .3, thick: .4 });
    D.ball('#4a3626', [0, 1.38, .5], [.075, .06, .05]);
    D.face({ c: [0, 1.44, .1], spread: .38, pitch: .04, size: .075, iris: '#44301a', style: 'round', mouth: 'smile', mouthPitch: -.46, mouthW: .062 });
  },

  // ---------------- Oso de anteojos ----------------
  anteojin(S, D) {
    const fur = '#3a3038', cream = '#efdcb0';
    S.ball([0, .46, 0], [.42, .4, .38], fur, { k: 0 });
    S.ball([0, .9, .1], [.32, .3, .3], fur, { k: .16 });
    S.limb([0, .92, .26], [0, .86, .44], .14, .11, fur, { k: .1 });
    S.paint(E([0, .4, .3], [.26, .26, .2]), cream, .05);
    S.paint(E([0, .86, .4], [.16, .13, .14]), cream, .04);
    S.pair(s => {
      S.ball([s * .22, 1.14, .02], [.11, .11, .06], fur, { k: .06 });
      S.limb([s * .3, .44, .1], [s * .36, .1, .2], .13, .11, fur, { k: .09 });
      S.limb([s * .26, .3, -.12], [s * .3, .08, -.16], .13, .12, fur, { k: .09 });
      D.ball('#f4e0b4', [s * .18, .96, .34], [.11, .12, .05]);                  // los "anteojos"
      D.ball(fur, [s * .18, .96, .37], [.075, .085, .035]);
      D.claws(s * .36, .07, .34, .8, '#e8dcc4');
    });
    D.ball('#1e1820', [0, .88, .5], [.07, .055, .05]);
    D.face({ c: [0, .9, .12], spread: .4, pitch: .08, size: .06, iris: '#5a3a1a', style: 'round', mouth: 'smile', mouthPitch: -.42, mouthW: .055 });
  },
  anteojon(S, D) {
    const fur = '#2e262e', cream = '#f0dcae';
    S.ball([0, .84, -.04], [.66, .64, .58], fur, { k: 0 });
    S.ball([0, 1.3, -.34], [.52, .5, .42], fur, { k: .22 });                     // joroba del lomo
    S.ball([0, 1.52, .16], [.42, .4, .38], fur, { k: .18 });
    S.limb([0, 1.54, .42], [0, 1.44, .72], .2, .15, fur, { k: .12 });
    S.paint(E([0, .7, .48], [.4, .4, .26]), cream, .07);
    S.paint(E([0, 1.46, .7], [.2, .17, .16]), cream, .05);
    S.pair(s => {
      S.ball([s * .3, 1.84, .06], [.14, .14, .08], fur, { k: .07 });
      S.limb([s * .46, .8, .16], [s * .54, .14, .3], .19, .16, fur, { k: .1 });
      S.limb([s * .4, .6, -.2], [s * .46, .12, -.26], .2, .18, fur, { k: .1 });
      D.ball('#f6e2b6', [s * .24, 1.6, .54], [.16, .18, .06]);
      D.ball(fur, [s * .24, 1.6, .58], [.11, .125, .04]);
      D.claws(s * .54, .1, .52, 1.2, '#efe2c8');
      D.claws(s * .46, .1, -.02, 1.1, '#efe2c8');
      D.spike('#efe2c8', [s * .16, 1.38, .78], [s * .2, 1.3, .86], .025);
    });
    D.ball('#1a141c', [0, 1.48, .82], [.09, .07, .06]);
    D.face({ c: [0, 1.54, .2], spread: .36, pitch: .06, size: .07, iris: '#6a4418', style: 'round', mouth: 'fang', mouthPitch: -.42, mouthW: .07 });
  },

  // ---------------- Mariposa azul ----------------
  orugazul(S, D) {
    const skin = '#4f74d8', pale = '#a8c2f4';
    for (let i = 0; i < 5; i++) {
      const z = .5 - i * .26, r = .26 - Math.abs(i - 1.4) * .02;
      S.ball([0, .28, z], [r, r * .92, r * .78], i % 2 ? skin : '#4166c6', { k: .14 });
    }
    S.paint(E([0, .1, 0], [.22, .1, .62]), pale, .06);
    for (let i = 0; i < 4; i++) S.pair(s => D.ball('#2f4aa0', [s * .18, .1, .4 - i * .26], [.07, .05, .09]));
    S.pair(s => {
      for (const z of [.4, .12, -.16]) bugLeg(D, [s * .2, .26, z], s * .12, 0, '#2f4aa0', { knee: .1, rad: .022 });
      D.ball('#ffe06a', [s * .13, .48, -.52], [.05, .07, .05]);
    });
    D.antennae('#2f4aa0', '#ffd44a', .1, .46, .52, .22, .55, -.04);
    D.face({ c: [0, .3, .5], spread: .44, pitch: .18, size: .062, iris: '#1a1626', style: 'round', mouth: 'smile', mouthPitch: -.4, mouthW: .05 });
  },
  mariposol(S, D) {
    const body = '#2a2a52';
    S.ball([0, .9, -.1], [.17, .19, .34], body, { k: 0 });
    S.ball([0, 1.22, .1], [.17, .16, .16], body, { k: .14 });
    S.limb([0, .78, -.3], [0, .62, -.6], .11, .05, body, { k: .1 });
    S.paint(E([0, .84, .1], [.13, .13, .2]), '#4a4a80', .04);
    for (const s of [-1, 1]) {
      butterflyWing(D, s, [s * .1, 1.0, -.1], { len: .92, w: .56, color: '#3f6ad8', edge: '#1b2450', dots: '#dbe8ff', lift: .22, sweep: .5 });
      butterflyWing(D, s, [s * .07, .96, -.2], { len: .72, w: .44, color: '#6a92ec', edge: '#24306a', dots: '#f2f6ff', lift: .1, sweep: .8 });
      for (const z of [.08, -.12]) bugLeg(D, [s * .12, .8, z], s * .12, 0, '#1b2450', { knee: .08, rad: .018, foot: .34 });
      D.ball('#1b2450', [s * .08, .66, -.06], [.05, .06, .05]);
    }
    D.antennae('#1b2450', '#ffd44a', .08, 1.34, .12, .3, .5, .1);
    D.face({ c: [0, 1.22, .1], spread: .5, pitch: .1, size: .058, iris: '#19162a', style: 'round', mouth: 'none' });
    D.stick('#ffd44a', [0, 1.14, .24], [0, 1.0, .36], .016);                    // espiritrompa enrollada
    D.ring('#ffd44a', [0, .94, .4], .06, [0, 0, 0], .016);
  },

  // ---------------- Cóndor ----------------
  condorin(S, D) {
    const down = '#4a4650', pale = '#e8e2d6';
    S.ball([0, .56, 0], [.36, .4, .34], down, { k: 0 });
    S.ball([0, .98, .08], [.24, .23, .23], '#d8b89a', { k: .14 });
    S.paint(E([0, .52, .24], [.3, .3, .2]), '#5e5a66', .06);
    S.ring([0, .76, .06], .25, .1, pale, { k: .1, rot: [Math.PI / 2, 0, 0] });   // collar de plumón
    S.pair(s => {
      S.limb([s * .26, .64, -.02], [s * .46, .36, -.2], .12, .07, down, { k: .1 });
      D.stick('#c8b08a', [s * .12, .22, .04], [s * .13, .06, .1], .03);
      D.claws(s * .13, .04, .22, .9, '#efe4cc');
    });
    D.cone('#2e2a32', [0, 1.02, .28], [.07, .14, .07], [Math.PI / 2.2, 0, 0]);
    D.ball('#f0e8dc', [0, 1.2, .04], [.1, .07, .1]);                            // plumón de la cabeza
    D.face({ c: [0, .98, .08], spread: .48, pitch: .1, size: .058, iris: '#3a2a14', style: 'round', mouth: 'none' });
  },
  condoral(S, D) {
    const black = '#242029', silver = '#c8ccd4', skin = '#d4906a';
    S.ball([0, 1.0, -.06], [.5, .58, .54], black, { k: 0 });
    S.limb([0, 1.4, .1], [0, 1.68, .3], .2, .16, skin, { k: .14 });
    S.ball([0, 1.8, .4], [.26, .25, .28], skin, { k: .1 });
    S.ring([0, 1.44, .12], .34, .14, '#f4f0e6', { k: .12, rot: [Math.PI / 2 - .2, 0, 0] });   // golilla blanca
    S.paint(E([0, .86, .34], [.36, .36, .24]), '#312c38', .07);
    S.limb([0, .8, -.5], [0, .5, -1.0], .2, .1, black, { k: .12 });
    S.pair(s => {
      S.limb([s * .1, .78, -.5], [s * .26, .42, -1.08], .09, .04, '#2e2a34', { k: .07 });
      D.wing({ side: s, at: [s * .4, 1.16, -.04], len: 1.7, width: .17, n: 7, spread: 1.1, lift: .5, sweep: .42, tilt: .08, colors: [black, '#322d38'], tips: silver, covert: '#2a2530' });
      D.stick('#d8c49c', [s * .17, .44, .04], [s * .19, .12, .14], .045);
      D.claws(s * .19, .08, .34, 1.3, '#f2e8d0');
      D.ball('#b47a52', [s * .12, 1.96, .3], [.07, .1, .07]);                   // carúnculas
    });
    D.spike('#e8dcc4', [0, 1.86, .56], [0, 1.78, .92], .09);     // pico ganchudo
    D.cone('#e8dcc4', [0, 1.74, .9], [.075, .17, .075], [Math.PI / 1.6, 0, 0]);
    D.ball('#c06a46', [0, 2.08, .36], [.1, .17, .2]);                           // cresta
    D.face({ c: [0, 1.8, .4], spread: .44, pitch: .14, size: .07, iris: '#c8a048', style: 'almond', lid: .18, lidColor: skin, mouth: 'none' });
  }
};
