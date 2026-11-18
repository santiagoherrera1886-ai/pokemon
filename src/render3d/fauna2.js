// Las 40 especies del sur de Alborada, con el mismo acabado de figura que el resto (diseños originales):
//   Llano:     Chigüirín → Chigüirón (chigüiro) · Garcilla → Garzón (garza) · Becerrín → Torazo (toro de lidia del llano)
//   Bosque:    Lechucín → Lechuzón (lechuza) · Cucarrín → Cucarrón (escarabajo cornudo)
//   Selva:     Guacarín → Guacamarón (guacamaya) · Anguilín → Temblón (anguila eléctrica) · Bufeíto → Bufeón (delfín rosado)
//              Caimancito → Caimanazo (caimán) · Pintín → Tigrillo → Jaguarón (felinos)
//   Desierto:  Alacrín → Alacranzo (alacrán) · Cactín → Espinón (cactus) · Lagartijín → Iguanón → Draguana (iguana dragón)
//   Sierra:    Llamita → Llamarón (llama de fuego) · Páramo: Frailín → Frailejón (frailejón)
//   Costa:     Careyín → Careyón (tortuga carey) · Ciudad: Semaforín → Semafortón (semáforo)
//   Míticos:   Mohán (espíritu del río) · Madremonte (guardiana del monte) · Tunjo (figurita de oro) · Esmeraldón
// S = cuerpo esculpido en una pieza, D = detalles. Cada criatura mira hacia +z y pisa y = 0.
import { Sculpt } from './sculpt.js';

const E = Sculpt.ellipsoid;

// Cuatro patas (pares delantero y trasero) que bajan hasta el piso, con pezuña o pata redondeada.
function legs(S, D, s, { fx = .2, bx = .2, fz = .2, bz = -.2, top = .34, r1 = .09, r2 = .07, color, hoof, k = .08 }) {
  for (const [x, z] of [[fx, fz], [bx, bz]]) {
    S.limb([s * x, top, z], [s * (x + .02), .06, z + .01], r1, r2, color, { k });
    if (hoof) D.ball(hoof, [s * (x + .02), .04, z + .02], [r2 * 1.05, .045, r2 * 1.15]);
  }
}
// Pata articulada de bicho (cadera, rodilla afuera, punta en el piso).
function bugLeg(D, from, out, back, color, rad = .022, rise = .1) {
  const mid = [from[0] + out, from[1] + rise, from[2] + back], toe = [from[0] + out * 1.4, .02, from[2] + back * 1.4];
  D.stick(color, from, mid, rad); D.stick(color, mid, toe, rad * .8);
}
// Fila de púas a lo largo de una línea (crestas, espinas del lomo).
function ridge(D, color, from, to, n, h, lean = 0) {
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0, p = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
    const k = 1 - Math.abs(t - .4) * .9;
    D.cone(color, [p[0], p[1] + h * k * .45, p[2]], [h * .32 * k + .01, h * k, h * .32 * k + .01], [lean, 0, 0]);
  }
}
// Manchas pintadas sobre el cuerpo (felinos, carey, caimán).
function spots(S, list, color, soft = .02) { for (const [x, y, z, r] of list) S.paint(E([x, y, z], [r, r * .9, r]), color, soft); }

export const ROUGH2 = { cucarrin: .3, cucarron: .28, semaforin: .34, semaforton: .32, tunjo: .22, esmeraldon: .4, careyon: .5, careyin: .48, alacranzo: .44, espinon: .7, cactin: .7 };
export const METAL2 = { cucarrin: .35, cucarron: .45, semaforton: .35, tunjo: .75 };

export const FAUNA2 = {
  // ---------------- Chigüiro ----------------
  chiguirin(S, D) {
    const fur = '#a87444', back = '#8a5a34', snout = '#6e4a30';
    S.ball([0, .38, -.02], [.32, .28, .4], fur, { k: 0 });
    S.paint(E([0, .58, -.08], [.26, .14, .34]), back, .08);
    S.ball([0, .52, .34], [.21, .21, .22], fur, { k: .14 });
    S.limb([0, .48, .46], [0, .44, .62], .15, .13, snout, { k: .08, kc: .06 });
    S.pair(s => {
      S.ball([s * .14, .72, .3], [.06, .05, .04], back, { k: .05 });
      legs(S, D, s, { fx: .17, bx: .19, fz: .2, bz: -.24, top: .28, r1: .08, r2: .065, color: fur, hoof: '#3a2a20' });
    });
    D.ball('#2a1c16', [0, .47, .74], [.075, .05, .03]);
    D.face({ c: [0, .56, .38], spread: .62, pitch: .18, size: .046, iris: '#2a1a10', style: 'round', mouth: 'none', cheek: '#e8a07a' });
  },
  chiguiron(S, D) {
    const fur = '#9a6a3c', back = '#7a5030', snout = '#5e3e28';
    S.ball([0, .6, -.04], [.5, .44, .64], fur, { k: 0 });
    S.paint(E([0, .92, -.12], [.4, .2, .52]), back, .1);
    S.ball([0, .82, .58], [.32, .3, .34], fur, { k: .16 });
    S.limb([0, .76, .76], [0, .7, 1.0], .23, .2, snout, { k: .1, kc: .08 });
    S.pair(s => {
      S.ball([s * .21, 1.1, .5], [.08, .07, .05], back, { k: .06 });
      legs(S, D, s, { fx: .28, bx: .3, fz: .34, bz: -.38, top: .46, r1: .13, r2: .11, color: fur, hoof: '#2a1c16' });
    });
    D.ball('#24180f', [0, .74, 1.14], [.11, .07, .04]);
    // Una garcita amarilla echada en el lomo.
    D.ball('#f4d04e', [0, 1.1, -.12], [.11, .09, .13]); D.ball('#f8e07a', [0, 1.19, -.02], [.07, .07, .07]);
    D.cone('#e88a2a', [0, 1.19, .07], [.02, .07, .02], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) D.ball('#1a1410', [s * .04, 1.21, .03], [.012, .016, .01]);
    D.face({ c: [0, .86, .62], spread: .64, pitch: .2, size: .06, iris: '#2a1a10', style: 'round', mouth: 'none', cheek: '#d8906a' });
  },
  // ---------------- Garza ----------------
  garcilla(S, D) {
    const white = '#f6f4ee';
    S.ball([0, .6, -.02], [.21, .2, .27], white, { k: 0 });
    S.limb([0, .7, .1], [0, .94, .12], .075, .06, white, { k: .08 });
    S.ball([0, 1.0, .15], [.11, .1, .12], white, { k: .08 });
    S.pair(s => S.ball([s * .17, .62, -.06], [.07, .14, .2], '#ebe8e0', { k: .06 }));
    D.cone('#f0c040', [0, .99, .36], [.026, .17, .026], [Math.PI / 2, 0, 0]);
    // Parada en una sola pata (la otra doblada).
    D.stick('#3a3a3e', [.05, .46, 0], [.05, .04, .02], .018); D.ball('#3a3a3e', [.05, .02, .06], [.03, .012, .07]);
    D.stick('#3a3a3e', [-.05, .46, 0], [-.07, .3, .1], .016); D.stick('#3a3a3e', [-.07, .3, .1], [-.05, .38, .02], .014);
    D.blade('crest', white, [0, 1.06, .08], [0, 1.18, -.08], .06, [0, .3, 1], { thick: .4 });
    D.face({ c: [0, 1.0, .15], spread: .55, pitch: .08, size: .04, iris: '#d8a020', style: 'round', mouth: 'none', cheek: '' });
  },
  garzon(S, D) {
    const white = '#f8f7f2';
    S.ball([0, .98, -.04], [.27, .25, .36], white, { k: 0 });
    S.limb([0, 1.1, .16], [0, 1.38, .1], .085, .065, white, { k: .08 });
    S.limb([0, 1.38, .1], [0, 1.58, .22], .065, .06, white, { k: .06 });
    S.ball([0, 1.64, .26], [.1, .1, .12], white, { k: .07 });
    S.pair(s => S.ball([s * .22, 1.0, -.12], [.08, .18, .32], '#eeebe2', { k: .06 }));
    D.cone('#ecb82c', [0, 1.62, .52], [.03, .3, .03], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) {
      D.stick('#2e2e32', [s * .08, .8, 0], [s * .09, .04, .03], .022);
      D.ball('#2e2e32', [s * .09, .02, .09], [.035, .014, .09]);
    }
    // Plumas largas del lomo (de boda) y del pecho.
    for (const [x, a] of [[-.08, -.3], [0, 0], [.08, .3]]) D.blade('stream', '#ffffff', [x, 1.16, -.18], [x * 2.4, .9, -.62], .1, [a, 1, 0], { thick: .3 });
    D.blade('stream', '#ffffff', [0, 1.2, .2], [0, .96, .34], .1, [0, 0, 1], { thick: .3 });
    D.face({ c: [0, 1.64, .26], spread: .55, pitch: .08, size: .042, iris: '#e0a818', style: 'round', mouth: 'none', cheek: '', angry: .15 });
  },
  // ---------------- Toro ----------------
  becerrin(S, D) {
    const hide = '#c8844a', white = '#f4ead8';
    S.ball([0, .44, -.04], [.32, .28, .38], hide, { k: 0 });
    S.paint(E([.16, .5, -.14], [.14, .12, .16]), white, .03); S.paint(E([-.12, .4, .14], [.1, .1, .1]), white, .03);
    S.ball([0, .7, .3], [.25, .24, .23], hide, { k: .16 });
    S.limb([0, .64, .42], [0, .6, .54], .16, .15, '#f2c0aa', { k: .06, kc: .04 });
    S.pair(s => {
      S.limb([s * .18, .8, .3], [s * .33, .78, .26], .06, .03, hide, { k: .04 });
      legs(S, D, s, { fx: .17, bx: .18, fz: .2, bz: -.24, top: .34, r1: .08, r2: .07, color: hide, hoof: '#3a2a22' });
      D.cone('#f0e2c0', [s * .12, .92, .28], [.035, .07, .035], [0, 0, -s * .3]);
      D.ball('#3a2420', [s * .06, .6, .6], [.025, .03, .01]);
    });
    D.ring('#d83a3a', [0, .55, .26], .2, [Math.PI / 2.4, 0, 0], .05);     // pañoleta roja
    D.face({ c: [0, .72, .32], spread: .46, pitch: .12, size: .055, iris: '#3a2214', style: 'round', mouth: 'none', angry: .2 });
  },
  torazo(S, D) {
    const hide = '#2e2a30', chest = '#463e46';
    S.ball([0, .82, -.1], [.5, .46, .6], hide, { k: 0 });
    S.ball([0, 1.08, .3], [.44, .36, .36], hide, { k: .2 });                  // morrillo
    S.paint(E([0, .8, .44], [.3, .3, .2]), chest, .08);
    S.ball([0, 1.0, .66], [.28, .27, .26], hide, { k: .14 });
    S.limb([0, .92, .82], [0, .86, .96], .2, .18, '#5a4a52', { k: .08, kc: .05 });
    S.pair(s => {
      legs(S, D, s, { fx: .28, bx: .3, fz: .32, bz: -.42, top: .6, r1: .15, r2: .12, color: hide, hoof: '#1a1416' });
      S.limb([s * .22, 1.14, .62], [s * .42, 1.12, .6], .07, .04, hide, { k: .04 });
      // Cuernos largos y curvos.
      D.stick('#f2e8d2', [s * .2, 1.2, .62], [s * .46, 1.3, .66], .05);
      D.stick('#f2e8d2', [s * .46, 1.3, .66], [s * .58, 1.52, .62], .04);
      D.cone('#e8dcc0', [s * .6, 1.6, .62], [.035, .12, .035], [0, 0, -s * .3]);
      D.ball('#1e1418', [s * .08, .9, 1.0], [.03, .035, .012]);
    });
    D.ring('#e8b830', [0, .82, 1.0], .07, [0, 0, 0], .018);                   // argolla
    D.ring('#d83a3a', [0, .84, .5], .34, [Math.PI / 2.3, 0, 0], .07);
    D.tuft([0, .7, -.68], [0, .3, -.86], .04, hide);
    D.face({ c: [0, 1.04, .7], spread: .44, pitch: .1, size: .062, iris: '#c83a2a', style: 'round', mouth: 'none', angry: .35, cheek: '' });
  },
  // ---------------- Lechuza ----------------
  lechucin(S, D) {
    const down = '#8a7a6a', disk = '#e2d6c2';
    S.ball([0, .46, 0], [.34, .4, .32], down, { k: 0 });
    S.paint(E([0, .58, .26], [.27, .22, .14]), disk, .05);
    S.paint(E([0, .3, .24], [.2, .16, .12]), '#b8a890', .06);
    S.pair(s => {
      S.ball([s * .3, .44, -.04], [.08, .2, .16], '#6e5e50', { k: .06 });
      D.tuft([s * .16, .8, .06], [s * .22, .92, .02], .035, down);
      D.claws(s * .1, .09, .16, .7, '#e8c060');
    });
    D.cone('#e0a840', [0, .54, .36], [.035, .08, .035], [Math.PI / 1.7, 0, 0]);
    D.face({ c: [0, .6, .1], spread: .36, pitch: .04, size: .085, iris: '#f0c020', style: 'round', mouth: 'none', cheek: '' });
  },
  lechuzon(S, D) {
    const down = '#4e4258', disk = '#d8cce2', dark = '#2e2636';
    S.ball([0, .78, 0], [.42, .62, .4], down, { k: 0 });
    S.paint(E([0, 1.0, .32], [.33, .27, .16]), disk, .05);
    S.paint(E([0, .6, .34], [.26, .3, .14]), '#8a7e98', .06);
    S.pair(s => {
      S.ball([s * .38, .74, -.08], [.12, .4, .26], dark, { k: .06 });
      D.tuft([s * .22, 1.32, .04], [s * .32, 1.48, -.02], .05, down);
      D.stick('#c89a40', [s * .12, .22, .1], [s * .13, .06, .14], .03);
      D.claws(s * .13, .05, .2, .9, '#e8c060');
    });
    for (const [y, z] of [[.5, .38], [.66, .4], [.82, .4]]) for (const s of [-1, 0, 1]) D.cone('#a898b8', [s * .1, y, z], [.03, .05, .02], [Math.PI, 0, 0]);
    D.cone('#e0a840', [0, .92, .46], [.045, .1, .045], [Math.PI / 1.7, 0, 0]);
    D.face({ c: [0, 1.04, .12], spread: .36, pitch: .04, size: .1, iris: '#f6d040', style: 'round', mouth: 'none', cheek: '', angry: .25 });
  },
  // ---------------- Escarabajo ----------------
  cucarrin(S, D) {
    const shell = '#3a7a8e', dark = '#1e3a46';
    S.ball([0, .3, -.06], [.27, .22, .32], shell, { k: 0 });
    S.ball([0, .3, .24], [.16, .14, .13], dark, { k: .08 });
    S.paint(E([0, .44, -.08], [.025, .1, .3]), '#163038', .02);
    D.cone('#2a4e5a', [0, .46, .34], [.04, .13, .04], [-.4, 0, 0]);
    for (const s of [-1, 1]) for (const [z, b] of [[.16, .08], [.02, 0], [-.14, -.1]]) bugLeg(D, [s * .2, .18, z], s * .1, b, '#1a2a30', .02, .05);
    D.ball('#9adcf0', [-.1, .46, -.14], [.06, .03, .08]);
    D.face({ c: [0, .32, .26], spread: .5, pitch: .1, size: .045, iris: '#1a1a22', style: 'round', mouth: 'none', cheek: '' });
  },
  cucarron(S, D) {
    const shell = '#25485c', dark = '#122630';
    S.ball([0, .52, -.12], [.48, .38, .56], shell, { k: 0 });
    S.ball([0, .5, .42], [.3, .24, .22], dark, { k: .1 });
    S.paint(E([0, .86, -.14], [.03, .1, .5]), '#0e1e26', .02);
    // Cuerno grande que se dobla hacia arriba, y uno corto en el lomo.
    D.stick('#1e3846', [0, .62, .58], [0, .9, .86], .07); D.stick('#1e3846', [0, .9, .86], [0, 1.18, .82], .055);
    D.cone('#2a4c5c', [0, 1.26, .78], [.05, .14, .05], [-.2, 0, 0]);
    D.cone('#1e3846', [0, .86, .36], [.07, .2, .07], [.5, 0, 0]);
    for (const s of [-1, 1]) for (const [z, b] of [[.3, .12], [.04, 0], [-.24, -.14]]) bugLeg(D, [s * .36, .3, z], s * .16, b, '#0e1a20', .036, .08);
    D.ball('#bfefff', [-.18, .84, -.2], [.1, .04, .14]);
    D.face({ c: [0, .54, .48], spread: .52, pitch: .08, size: .055, iris: '#e8f4ff', style: 'led', mouth: 'none', cheek: '' });
  },
  // ---------------- Guacamaya ----------------
  guacarin(S, D) {
    const red = '#e0392a', yellow = '#f2c230', blue = '#2f6ad0';
    S.ball([0, .44, -.02], [.27, .32, .28], red, { k: 0 });
    S.ball([0, .76, .06], [.21, .2, .2], red, { k: .12 });
    S.paint(E([0, .78, .2], [.13, .11, .08]), '#f6efe6', .03);
    S.pair(s => {
      S.ball([s * .25, .46, -.06], [.07, .2, .16], red, { k: .06 });
      S.paint(E([s * .3, .4, -.04], [.06, .09, .1]), yellow, .02);
      S.paint(E([s * .3, .3, -.1], [.06, .08, .1]), blue, .02);
      D.claws(s * .09, .12, .14, .7, '#4a4a52');
    });
    D.blade('fin', blue, [0, .3, -.22], [0, .1, -.46], .14, [0, 1, 0], { thick: .3 });
    D.cone('#f4ece0', [0, .74, .28], [.07, .13, .06], [Math.PI / 1.6, 0, 0]);
    D.cone('#2a2a2e', [0, .66, .24], [.05, .07, .04], [Math.PI / 1.9, 0, 0]);
    D.face({ c: [0, .8, .1], spread: .5, pitch: .14, size: .055, iris: '#f0e6c8', style: 'round', mouth: 'none', cheek: '' });
  },
  guacamaron(S, D) {
    const red = '#d8301f', yellow = '#f2c230', blue = '#2a5ec8';
    S.ball([0, .82, -.04], [.34, .44, .34], red, { k: 0 });
    S.ball([0, 1.3, .1], [.25, .24, .24], red, { k: .14 });
    S.paint(E([0, 1.32, .27], [.16, .13, .09]), '#f8f2ea', .03);
    for (const s of [-1, 1]) {
      D.wing({ side: s, at: [s * .3, 1.0, -.08], len: .95, width: .12, n: 6, spread: 1.0, lift: .9, sweep: .5, colors: [red, red, yellow, yellow, blue, blue], tips: blue, covert: yellow });
      D.stick('#4a4a52', [s * .12, .44, .06], [s * .13, .07, .12], .035);
      D.claws(s * .13, .06, .18, .9, '#3e3e46');
    }
    for (const [x, c] of [[-.07, red], [0, blue], [.07, red]]) D.blade('stream', c, [x, .6, -.3], [x * 3, .1, -1.15], .12, [0, 1, 0], { thick: .3 });
    D.cone('#f4ece0', [0, 1.27, .36], [.09, .17, .08], [Math.PI / 1.6, 0, 0]);
    D.cone('#2a2a2e', [0, 1.17, .31], [.06, .09, .05], [Math.PI / 1.9, 0, 0]);
    D.plume([0, 1.48, .02], [0, 1, -.35], .3, { n: 3, spread: .5 });
    D.face({ c: [0, 1.34, .14], spread: .5, pitch: .14, size: .06, iris: '#f6e6b0', style: 'round', mouth: 'none', cheek: '', angry: .15 });
  },
  // ---------------- Anguila eléctrica ----------------
  anguilin(S, D) {
    const skin = '#4a5a36', belly = '#e8d070';
    const pts = [[0, .1, -.42], [.12, .14, -.24], [.08, .2, -.04], [-.06, .3, .1], [0, .46, .2]];
    for (let i = 0; i < pts.length - 1; i++) S.limb(pts[i], pts[i + 1], .07 + i * .012, .08 + i * .012, skin, { k: .06 });
    S.ball([0, .56, .26], [.13, .13, .15], skin, { k: .1 });
    S.paint(E([0, .46, .36], [.09, .12, .07]), belly, .03);
    D.blade('fin', '#f2d24a', [0, .66, .2], [0, .74, .02], .08, [1, 0, 0], { thick: .3 });
    for (const [x, y, z] of [[.1, .16, -.26], [.06, .24, -.02], [-.06, .34, .12]]) D.gem([x + .05, y + .05, z], '#ffe23a', .03);
    D.face({ c: [0, .58, .28], spread: .5, pitch: .12, size: .044, iris: '#1a1a12', style: 'round', mouth: 'smile', mouthPitch: -.35, mouthW: .04, cheek: '#f4d04a' });
  },
  temblon(S, D) {
    const skin = '#3a4a2a', belly = '#e8c84a';
    const pts = [[-.3, .12, -.5], [.1, .14, -.62], [.42, .16, -.3], [.32, .26, .06], [-.1, .38, .14], [-.18, .62, .2], [0, .92, .22]];
    for (let i = 0; i < pts.length - 1; i++) S.limb(pts[i], pts[i + 1], .1 + i * .016, .11 + i * .016, skin, { k: .07 });
    S.ball([0, 1.04, .28], [.2, .18, .24], skin, { k: .1 });
    S.paint(E([0, .88, .36], [.13, .18, .1]), belly, .04);
    D.blade('fin', '#f2d24a', [0, 1.18, .2], [0, 1.28, -.12], .14, [1, 0, 0], { thick: .3 });
    for (let i = 1; i < pts.length - 1; i++) D.vein(.4 * i, [pts[i][0], pts[i][1] + .02, pts[i][2]], [0, 1, 0], .07, .025, '#fff04a', 1.2);
    D.face({ c: [0, 1.06, .3], spread: .48, pitch: .1, size: .055, iris: '#ffe23a', style: 'led', mouth: 'smile', mouthPitch: -.35, mouthW: .05, cheek: '' });
  },
  // ---------------- Alacrán ----------------
  alacrin(S, D) {
    const shell = '#d8a858', dark = '#a8743a';
    S.ball([0, .22, -.04], [.22, .13, .26], shell, { k: 0 });
    S.ball([0, .24, .2], [.15, .12, .12], shell, { k: .08 });
    S.pair(s => {
      S.limb([s * .14, .22, .26], [s * .24, .2, .4], .05, .04, shell, { k: .05 });
      S.ball([s * .26, .2, .5], [.08, .06, .09], dark, { k: .05 });
      D.cone(dark, [s * .22, .2, .6], [.03, .07, .02], [Math.PI / 2, 0, 0]);
      for (const [z, b] of [[.08, .06], [-.04, -.02], [-.16, -.1]]) bugLeg(D, [s * .16, .16, z], s * .12, b, dark, .016, .08);
    });
    // Cola en arco sobre el lomo con el aguijón morado.
    const tail = [[0, .24, -.28], [0, .34, -.42], [0, .5, -.44], [0, .62, -.32]];
    for (let i = 0; i < tail.length - 1; i++) S.limb(tail[i], tail[i + 1], .06 - i * .008, .055 - i * .008, shell, { k: .04 });
    D.ball(D.glow('#b04ad8', .5), [0, .64, -.24], [.05, .05, .06]); D.cone('#5a2a6a', [0, .6, -.16], [.02, .07, .02], [2.2, 0, 0]);
    D.face({ c: [0, .26, .22], spread: .44, pitch: .2, size: .04, iris: '#1a1410', style: 'round', mouth: 'none', cheek: '' });
  },
  alacranzo(S, D) {
    const shell = '#8a4a2a', dark = '#5a2e1a';
    S.ball([0, .38, -.06], [.38, .22, .44], shell, { k: 0 });
    for (const z of [-.3, -.12, .06]) S.paint(E([0, .58, z], [.32, .04, .05]), dark, .02);
    S.ball([0, .4, .36], [.26, .2, .2], shell, { k: .1 });
    S.pair(s => {
      S.limb([s * .24, .38, .42], [s * .44, .36, .64], .08, .07, shell, { k: .06 });
      S.ball([s * .48, .34, .8], [.15, .11, .17], dark, { k: .06 });
      D.cone(dark, [s * .4, .34, .98], [.05, .12, .035], [Math.PI / 2, 0, .2 * s]);
      D.cone(dark, [s * .54, .34, .96], [.045, .1, .035], [Math.PI / 2, 0, -.2 * s]);
      for (const [z, b] of [[.18, .1], [0, 0], [-.18, -.12], [-.34, -.2]]) bugLeg(D, [s * .28, .28, z], s * .2, b, dark, .03, .12);
    });
    const tail = [[0, .4, -.46], [0, .58, -.7], [0, .86, -.74], [0, 1.08, -.56], [0, 1.16, -.34]];
    for (let i = 0; i < tail.length - 1; i++) S.limb(tail[i], tail[i + 1], .1 - i * .012, .09 - i * .012, shell, { k: .05 });
    D.ball(D.glow('#c050f0', .7), [0, 1.14, -.24], [.08, .08, .1]); D.cone('#3a1a4a', [0, 1.06, -.12], [.035, .12, .035], [2.3, 0, 0]);
    D.face({ c: [0, .44, .42], spread: .42, pitch: .2, size: .05, iris: '#f0c040', style: 'round', mouth: 'none', cheek: '', angry: .3 });
  },
  // ---------------- Cactus ----------------
  cactin(S, D) {
    const green = '#4a9a4a';
    S.ball([0, .4, 0], [.3, .36, .3], green, { k: 0 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; S.paint(E([Math.sin(a) * .29, .42, Math.cos(a) * .29], [.02, .3, .02]), '#3a7a3a', .02); }
    S.pair(s => S.ball([s * .14, .06, .06], [.1, .06, .12], '#5aa858', { k: .05 }));
    for (let i = 0; i < 14; i++) { const a = i * 2.4, y = .2 + (i % 5) * .11, rr = .3 * Math.sqrt(Math.max(.15, 1 - ((y - .4) / .36) ** 2)); D.spike('#f6f2e2', [Math.sin(a) * rr, y, Math.cos(a) * rr], [Math.sin(a) * (rr + .07), y + .02, Math.cos(a) * (rr + .07)], .012); }
    D.ball('#f08ab0', [0, .77, 0], [.06, .04, .06]);
    D.face({ c: [0, .44, .1], spread: .4, pitch: .05, size: .055, iris: '#1e2a14', style: 'round', mouth: 'smile', mouthPitch: -.2, mouthW: .05 });
  },
  espinon(S, D) {
    const green = '#3e8c42', dark = '#2e6a32';
    S.limb([0, .1, 0], [0, 1.1, 0], .3, .26, green, { k: 0 });
    S.ball([0, 1.16, 0], [.26, .2, .26], green, { k: .1 });
    S.pair(s => {
      S.limb([s * .24, .62, 0], [s * .5, .66, 0], .11, .1, green, { k: .1 });
      S.limb([s * .5, .66, 0], [s * .54, 1.0, 0], .1, .09, green, { k: .06 });
      S.ball([s * .14, .08, .1], [.13, .08, .15], '#5aa858', { k: .05 });
    });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; S.paint(E([Math.sin(a) * .28, .62, Math.cos(a) * .28], [.025, .55, .025]), dark, .02); }
    for (let i = 0; i < 26; i++) { const a = i * 2.4, y = .25 + (i % 9) * .1; D.spike('#fbf6e6', [Math.sin(a) * .28, y, Math.cos(a) * .28], [Math.sin(a) * .37, y + .03, Math.cos(a) * .37], .014); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; D.blade('petal', '#f07aa8', [0, 1.34, 0], [Math.sin(a) * .2, 1.42, Math.cos(a) * .2], .14, [Math.sin(a), .4, Math.cos(a)], { cup: .2, thick: .3 }); }
    D.ball('#f8d84a', [0, 1.38, 0], [.07, .05, .07]);
    D.face({ c: [0, .92, .1], spread: .38, pitch: .05, size: .062, iris: '#1e2a14', style: 'round', mouth: 'smile', mouthPitch: -.25, mouthW: .06 });
  },
  // ---------------- Llama ----------------
  llamita(S, D) {
    const wool = '#f2e6d0', face = '#e8d8bc';
    S.ball([0, .52, -.06], [.27, .24, .32], wool, { k: 0 });
    for (const [x, y, z] of [[.16, .62, -.2], [-.16, .64, -.06], [0, .7, .12], [.12, .56, .16], [-.14, .5, -.26]]) S.ball([x, y, z], [.1, .1, .1], wool, { k: .08 });
    S.limb([0, .62, .2], [0, .92, .26], .1, .09, wool, { k: .08 });
    S.ball([0, 1.0, .3], [.13, .13, .15], face, { k: .08 });
    S.limb([0, .96, .38], [0, .94, .46], .08, .07, face, { k: .05 });
    S.pair(s => {
      D.blade('ear', face, [s * .07, 1.1, .26], [s * .13, 1.28, .22], .07, [0, 0, 1], { cup: .3, thick: .4 });
      D.ball(s > 0 ? '#e0408a' : '#2ab0b8', [s * .13, 1.24, .25], [.035, .035, .035]);   // borlas
      legs(S, D, s, { fx: .13, bx: .14, fz: .14, bz: -.22, top: .38, r1: .07, r2: .06, color: face, hoof: '#4a3a32' });
    });
    D.plume([0, 1.12, .24], [0, 1, -.3], .14, { n: 2 });
    D.face({ c: [0, 1.02, .32], spread: .52, pitch: .12, size: .045, iris: '#2a1a14', style: 'round', mouth: 'none' });
  },
  llamaron(S, D) {
    const wool = '#f6e2c6', face = '#ead2b0';
    S.ball([0, .9, -.08], [.4, .34, .5], wool, { k: 0 });
    for (const [x, y, z] of [[.24, 1.0, -.3], [-.24, 1.04, -.1], [0, 1.12, .14], [.2, .86, .26], [-.2, .82, -.42]]) S.ball([x, y, z], [.15, .14, .15], wool, { k: .1 });
    S.limb([0, 1.0, .34], [0, 1.5, .44], .14, .12, wool, { k: .1 });
    S.ball([0, 1.6, .5], [.18, .17, .2], face, { k: .1 });
    S.limb([0, 1.55, .62], [0, 1.52, .74], .11, .1, face, { k: .06 });
    // Manta tejida con franjas sobre el lomo.
    for (const [z, c] of [[-.3, '#e0408a'], [-.14, '#f2c230'], [.02, '#2ab0b8'], [.18, '#e0408a']]) S.paint(E([0, 1.18, z], [.44, .1, .07]), c, .02);
    S.pair(s => {
      D.blade('ear', face, [s * .1, 1.74, .44], [s * .18, 1.98, .4], .09, [0, 0, 1], { cup: .3, thick: .4 });
      legs(S, D, s, { fx: .2, bx: .22, fz: .26, bz: -.36, top: .62, r1: .1, r2: .085, color: face, hoof: '#3e2e28' });
    });
    D.plume([0, 1.22, -.2], [0, 1, -.4], .32, { n: 3 });
    D.plume([0, 1.78, .44], [0, 1, -.2], .18, { n: 2 });
    D.face({ c: [0, 1.62, .52], spread: .5, pitch: .1, size: .055, iris: '#2a1a14', style: 'round', mouth: 'none', angry: .1 });
  },
  // ---------------- Frailejón ----------------
  frailin(S, D) {
    const stem = '#8a7a5a', leaf = '#b8c8a8';
    S.limb([0, .06, 0], [0, .34, 0], .17, .15, stem, { k: 0 });
    S.ball([0, .42, 0], [.22, .14, .22], leaf, { k: .1 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; D.blade('leaf', i % 2 ? '#c8d6b8' : '#a8bc98', [Math.sin(a) * .1, .46, Math.cos(a) * .1], [Math.sin(a) * .34, .66, Math.cos(a) * .34], .13, [Math.sin(a), .6, Math.cos(a)], { cup: .25, thick: .4 }); }
    D.crystal('#bfe8ff', [0, .52, 0], [0, .72, 0], .05);
    S.pair(s => S.ball([s * .1, .05, .06], [.07, .04, .08], stem, { k: .04 }));
    D.face({ c: [0, .3, .06], spread: .42, pitch: .02, size: .045, iris: '#1e2a24', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .04 });
  },
  frailejon(S, D) {
    const trunk = '#7a6248', dry = '#a88e6a', leaf = '#c2d2b4';
    S.limb([0, .05, 0], [0, 1.16, 0], .26, .22, dry, { k: 0 });
    for (let y = .26; y < 1.1; y += .22) S.ring([0, y, 0], .23, .03, trunk, { k: .05, rot: [0, 0, 0] });
    S.ball([0, 1.22, 0], [.3, .14, .3], leaf, { k: .1 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r0 = i % 2 ? .44 : .5; D.blade('leaf', i % 2 ? '#d2dfc6' : '#b4c6a4', [Math.sin(a) * .14, 1.26, Math.cos(a) * .14], [Math.sin(a) * r0, 1.52, Math.cos(a) * r0], .16, [Math.sin(a), .6, Math.cos(a)], { cup: .25, thick: .4 }); }
    // Varas de flores amarillas.
    for (const [x, z] of [[.1, .06], [-.08, -.08]]) { D.stick('#7a8a5a', [x, 1.3, z], [x * 2, 1.86, z * 2], .02); D.ball('#f6d040', [x * 2, 1.9, z * 2], [.07, .06, .07]); }
    for (const [x, y, z] of [[.3, .4, .1], [-.28, .7, .14], [.26, .96, -.1]]) D.crystal('#cfeeff', [x * .9, y, z], [x * 1.25, y + .14, z], .04);
    S.pair(s => S.ball([s * .14, .06, .1], [.1, .05, .12], trunk, { k: .04 }));
    D.face({ c: [0, .9, .1], spread: .4, pitch: .02, size: .058, iris: '#1e2a24', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .05 });
  },
  // ---------------- Tortuga carey ----------------
  careyin(S, D) {
    const shell = '#8a5a2a', skin = '#7ab0a0';
    S.ball([0, .26, -.04], [.3, .16, .34], shell, { k: 0 });
    spots(S, [[.1, .38, -.08, .08], [-.1, .38, .06, .07], [.02, .4, .12, .06], [-.06, .38, -.18, .07], [.16, .34, .1, .05]], '#e0a040', .03);
    S.ball([0, .3, .36], [.13, .12, .14], skin, { k: .1 });
    S.ball([0, .18, -.02], [.27, .07, .3], '#f2e2b0', { k: .04 });
    S.pair(s => {
      D.blade('fin', skin, [s * .2, .2, .16], [s * .46, .1, .26], .12, [0, 1, 0], { thick: .3 });
      D.blade('fin', skin, [s * .18, .18, -.26], [s * .32, .08, -.38], .09, [0, 1, 0], { thick: .3 });
    });
    D.face({ c: [0, .32, .38], spread: .5, pitch: .14, size: .048, iris: '#1a2a24', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .04 });
  },
  careyon(S, D) {
    const shell = '#7a4a1e', skin = '#6a9e90';
    S.ball([0, .5, -.06], [.56, .3, .64], shell, { k: 0 });
    spots(S, [[.2, .74, -.1, .14], [-.2, .74, .1, .13], [.04, .78, .26, .1], [-.12, .74, -.32, .12], [.3, .64, .24, .09], [-.32, .64, -.16, .09]], '#e8a848', .04);
    S.ball([0, .48, .66], [.21, .19, .22], skin, { k: .1 });
    S.ball([0, .3, -.04], [.5, .12, .58], '#f0dca8', { k: .04 });
    for (const [x, z] of [[0, -.1], [.22, .1], [-.22, -.2], [0, .24]]) D.crystal('#8a8a8e', [x, .74, z], [x * 1.1, .96, z], .07);
    S.pair(s => {
      D.blade('fin', skin, [s * .38, .36, .3], [s * .92, .2, .5], .22, [0, 1, 0], { thick: .3 });
      D.blade('fin', skin, [s * .36, .32, -.46], [s * .62, .16, -.66], .16, [0, 1, 0], { thick: .3 });
    });
    D.face({ c: [0, .5, .7], spread: .5, pitch: .12, size: .058, iris: '#1a2a24', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .05, cheek: '' });
  },
  // ---------------- Delfín rosado ----------------
  bufeito(S, D) {
    const pink = '#f0a2ba', pale = '#f8d0dc';
    S.ball([0, .5, -.02], [.24, .34, .26], pink, { k: 0 });
    S.ball([0, .84, .1], [.2, .19, .2], pink, { k: .14 });                       // melón de la frente
    S.limb([0, .78, .24], [0, .74, .5], .07, .045, pink, { k: .08 });           // pico largo
    S.paint(E([0, .46, .22], [.16, .24, .1]), pale, .05);
    S.limb([0, .26, -.12], [0, .12, -.32], .12, .06, pink, { k: .08 });
    D.blade('fluke', pink, [0, .12, -.32], [0, .04, -.56], .3, [0, 1, 0], { thick: .3 });
    S.pair(s => D.blade('fin', pink, [s * .2, .5, .06], [s * .38, .34, .1], .1, [0, 1, 0], { thick: .3 }));
    D.face({ c: [0, .86, .14], spread: .48, pitch: .02, size: .044, iris: '#2a1a24', style: 'round', mouth: 'none', cheek: '#f6c0d0' });
  },
  bufeon(S, D) {
    const pink = '#e88aa8', pale = '#f6c8d6';
    S.ball([0, .9, -.04], [.32, .52, .34], pink, { k: 0 });
    S.ball([0, 1.42, .14], [.26, .24, .26], pink, { k: .16 });
    S.limb([0, 1.34, .32], [0, 1.28, .7], .09, .055, pink, { k: .08 });
    S.paint(E([0, .86, .3], [.22, .38, .12]), pale, .06);
    S.limb([0, .46, -.18], [0, .2, -.46], .18, .08, pink, { k: .1 });
    D.blade('fluke', pink, [0, .2, -.46], [0, .06, -.82], .46, [0, 1, 0], { thick: .3 });
    S.pair(s => D.blade('fin', pink, [s * .28, .98, .08], [s * .58, .72, .16], .16, [0, 1, 0], { thick: .3 }));
    D.blade('fin', '#d87a98', [0, 1.3, -.2], [0, 1.5, -.42], .14, [1, 0, 0], { thick: .3 });
    D.gem([0, 1.6, .32], '#c27aff', .06);
    D.ring(D.glow('#d8a8ff', .8), [0, 1.86, .1], .22, [Math.PI / 2, 0, 0], .025);
    D.face({ c: [0, 1.44, .18], spread: .46, pitch: .02, size: .052, iris: '#5a2a7a', style: 'round', mouth: 'none', cheek: '#f4b8ca' });
  },
  // ---------------- Semáforo ----------------
  semaforin(S, D) {
    const body = '#f2c22e', frame = '#2e2e36';
    S.ball([0, .46, 0], [.2, .34, .18], body, { k: 0 });
    S.paint(E([0, .44, .16], [.11, .27, .06]), frame, .02);
    S.pair(s => {
      S.limb([s * .1, .16, 0], [s * .12, .04, .02], .06, .055, frame, { k: .05 });
      D.ball(frame, [s * .12, .03, .06], [.065, .03, .09]);
    });
    for (const [y, c] of [[.62, '#ff4a3a'], [.45, '#ffc02a'], [.28, '#3ae06a']]) {
      D.ball(D.glow(c, 1.1), [0, y, .17], [.065, .065, .03]);
      D.ball(frame, [0, y + .07, .19], [.08, .02, .05]);                           // viserita
    }
    D.stick(frame, [0, .8, 0], [0, .94, 0], .015); D.ball(D.glow('#ffe23a', .8), [0, .96, 0], [.035, .035, .035]);
    D.face({ c: [0, .7, .04], spread: .5, pitch: .55, size: .04, iris: '#1a1a22', style: 'led', mouth: 'none', cheek: '' });
  },
  semaforton(S, D) {
    const body = '#5a6272', frame = '#262a32', trim = '#f2c22e';
    S.ball([0, .9, 0], [.3, .56, .26], body, { k: 0 });
    S.paint(E([0, .9, .24], [.17, .44, .06]), frame, .02);
    S.paint(E([0, 1.42, 0], [.31, .05, .27]), trim, .02); S.paint(E([0, .38, 0], [.31, .05, .27]), trim, .02);
    S.pair(s => {
      S.limb([s * .28, 1.1, 0], [s * .52, .82, .06], .07, .06, body, { k: .06 });
      S.limb([s * .52, .82, .06], [s * .56, .56, .12], .06, .06, body, { k: .05 });
      D.ball(trim, [s * .56, .52, .13], [.08, .08, .08]);
      S.limb([s * .14, .4, 0], [s * .16, .06, .02], .1, .09, frame, { k: .06 });
      D.ball(frame, [s * .16, .04, .08], [.1, .04, .13]);
    });
    for (const [y, c] of [[1.2, '#ff4a3a'], [.92, '#ffc02a'], [.64, '#3ae06a']]) {
      D.ball(D.glow(c, 1.2), [0, y, .27], [.1, .1, .04]);
      D.ball(frame, [0, y + .11, .3], [.12, .025, .07]);
    }
    for (const s of [-1, 0, 1]) D.cone(D.glow('#ffe23a', .9), [s * .14, 1.58, 0], [.04, .14 - Math.abs(s) * .04, .04]);
    D.face({ c: [0, 1.36, .06], spread: .46, pitch: .5, size: .05, iris: '#9ae8ff', style: 'led', mouth: 'none', cheek: '' });
  },
  // ---------------- Caimán ----------------
  caimancito(S, D) {
    const skin = '#5e7e3c', belly = '#d8d29a';
    S.ball([0, .26, -.06], [.24, .17, .32], skin, { k: 0 });
    S.ball([0, .32, .26], [.16, .14, .16], skin, { k: .12 });
    S.limb([0, .28, .36], [0, .24, .62], .11, .08, skin, { k: .08 });
    S.limb([0, .24, -.34], [0, .1, -.72], .12, .03, skin, { k: .08 });
    S.paint(E([0, .14, .06], [.18, .08, .3]), belly, .04);
    S.pair(s => {
      S.ball([s * .08, .44, .3], [.06, .06, .06], skin, { k: .05 });           // ojos saltones
      S.limb([s * .2, .22, .16], [s * .3, .06, .22], .06, .05, skin, { k: .05 });
      S.limb([s * .2, .22, -.2], [s * .3, .06, -.26], .065, .055, skin, { k: .05 });
    });
    ridge(D, '#3e5a2a', [0, .4, .08], [0, .22, -.6], 6, .07);
    for (const s of [-1, 1]) D.cone('#fffaf0', [s * .07, .2, .6], [.012, .03, .012], [Math.PI, 0, 0]);
    D.face({ c: [0, .38, .3], spread: .3, pitch: .55, size: .045, iris: '#e0b030', style: 'cat', mouth: 'none', cheek: '' });
  },
  caimanazo(S, D) {
    const skin = '#3e5228', belly = '#c8c28a';
    S.ball([0, .4, -.1], [.42, .26, .56], skin, { k: 0 });
    S.ball([0, .5, .44], [.26, .22, .26], skin, { k: .14 });
    S.limb([0, .44, .6], [0, .38, 1.08], .2, .15, skin, { k: .1 });
    S.limb([0, .36, -.58], [0, .14, -1.28], .2, .05, skin, { k: .1 });
    S.paint(E([0, .2, .1], [.32, .12, .5]), belly, .05);
    S.pair(s => {
      S.ball([s * .13, .7, .5], [.09, .09, .09], skin, { k: .06 });
      S.limb([s * .34, .34, .3], [s * .5, .08, .4], .1, .09, skin, { k: .06 });
      S.limb([s * .34, .34, -.34], [s * .52, .08, -.42], .11, .1, skin, { k: .06 });
      D.claws(s * .52, .06, .48, .9, '#e8e0c8');
    });
    ridge(D, '#2a3a1a', [0, .66, .2], [0, .34, -1.1], 10, .12);
    for (const s of [-1, 1]) for (const z of [.7, .86, 1.0]) D.cone('#fffaf0', [s * .14, .32, z], [.02, .05, .02], [Math.PI, 0, 0]);
    D.cone('#f2c230', [.05, .32, 1.06], [.03, .07, .03], [Math.PI, 0, 0]);       // el diente de oro
    D.face({ c: [0, .62, .48], spread: .3, pitch: .55, size: .06, iris: '#f0c030', style: 'cat', mouth: 'none', cheek: '', angry: .3 });
  },
  // ---------------- Felinos ----------------
  pintin(S, D) {
    const fur = '#e8a858', cream = '#f8ead0', spot = '#3a2414';
    S.ball([0, .36, -.04], [.22, .2, .28], fur, { k: 0 });
    S.ball([0, .66, .14], [.24, .22, .22], fur, { k: .14 });
    S.paint(E([0, .58, .32], [.13, .1, .08]), cream, .03);
    S.paint(E([0, .3, .16], [.13, .14, .1]), cream, .04);
    spots(S, [[.14, .44, -.12, .04], [-.12, .46, -.02, .04], [.04, .52, -.2, .035], [-.16, .34, -.2, .035], [.18, .32, .04, .03], [.1, .8, .04, .03], [-.12, .8, .06, .03]], spot);
    S.pair(s => {
      D.blade('ear', fur, [s * .13, .84, .12], [s * .22, 1.02, .08], .12, [0, 0, 1], { cup: .3, thick: .45 });
      D.ball('#f4c0a8', [s * .19, .94, .11], [.035, .05, .015]);
      legs(S, D, s, { fx: .12, bx: .13, fz: .12, bz: -.18, top: .28, r1: .065, r2: .06, color: fur });
    });
    S.limb([0, .36, -.3], [0, .5, -.6], .05, .04, fur, { k: .05 });
    for (const t of [.35, .65, .92]) S.paint(E([0, .36 + .14 * t, -.3 - .3 * t], [.05, .05, .03]), spot, .01);
    D.ball('#e8828a', [0, .64, .36], [.03, .02, .02]);
    D.face({ c: [0, .68, .18], spread: .44, pitch: .06, size: .066, iris: '#6ab830', style: 'cat', mouth: 'cat', mouthPitch: -.35, mouthW: .035 });
  },
  tigrillo(S, D) {
    const fur = '#e09848', cream = '#f8e6c8', spot = '#2e1c10';
    S.ball([0, .56, -.06], [.24, .22, .4], fur, { k: 0 });
    S.ball([0, .84, .38], [.21, .2, .2], fur, { k: .14 });
    S.paint(E([0, .78, .54], [.11, .08, .06]), cream, .03);
    S.paint(E([0, .44, .1], [.14, .1, .26]), cream, .05);
    spots(S, [[.16, .66, -.2, .05], [-.14, .68, .02, .05], [.04, .74, -.32, .045], [-.17, .58, -.3, .045], [.18, .56, .12, .04], [.06, .76, -.06, .04], [-.06, .72, .2, .04], [.1, .98, .3, .03], [-.1, .98, .3, .03]], spot);
    S.pair(s => {
      D.blade('ear', fur, [s * .11, 1.0, .36], [s * .19, 1.16, .32], .1, [0, 0, 1], { cup: .3, thick: .45 });
      legs(S, D, s, { fx: .13, bx: .14, fz: .24, bz: -.32, top: .46, r1: .07, r2: .06, color: fur });
    });
    S.limb([0, .6, -.44], [0, .9, -.86], .055, .045, fur, { k: .05 });
    for (const t of [.25, .5, .75, .95]) S.paint(E([0, .6 + .3 * t, -.44 - .42 * t], [.055, .055, .03]), spot, .01);
    D.ball('#d8727a', [0, .82, .58], [.028, .02, .02]);
    D.face({ c: [0, .86, .42], spread: .44, pitch: .06, size: .058, iris: '#d8c030', style: 'cat', mouth: 'cat', mouthPitch: -.35, mouthW: .03, angry: .15 });
  },
  jaguaron(S, D) {
    const fur = '#d8963a', cream = '#f6e2bc', spot = '#2a1810';
    S.ball([0, .86, -.12], [.4, .38, .62], fur, { k: 0 });
    S.ball([0, 1.0, .34], [.36, .34, .3], fur, { k: .16 });                       // pecho y hombros
    S.ball([0, 1.26, .66], [.3, .28, .27], fur, { k: .14 });
    S.paint(E([0, 1.18, .86], [.16, .11, .08]), cream, .04);
    S.paint(E([0, .66, .2], [.22, .16, .4]), cream, .06);
    // Rosetas: anillo oscuro con centro más oscuro que el pelo.
    for (const [x, y, z] of [[.26, 1.0, -.2], [-.24, 1.04, .02], [.06, 1.16, -.42], [-.28, .86, -.44], [.3, .84, .2], [.12, 1.18, .1], [-.1, 1.14, -.2], [.24, .76, -.56]]) {
      S.paint(E([x, y, z], [.08, .07, .08]), spot, .012); S.paint(E([x * 1.02, y + .01, z], [.04, .035, .04]), '#b87a2a', .01);
    }
    S.pair(s => {
      D.blade('ear', fur, [s * .17, 1.48, .6], [s * .28, 1.62, .56], .12, [0, 0, 1], { cup: .3, thick: .45 });
      legs(S, D, s, { fx: .24, bx: .26, fz: .38, bz: -.5, top: .72, r1: .13, r2: .11, color: fur });
      D.claws(s * .26, .06, .5, 1, '#f8f0e0');
      D.ring('#c83a2a', [s * .24, .34, .38], .12, [Math.PI / 2, 0, 0], .035);      // vendas de pelea
    });
    S.limb([0, .9, -.72], [0, 1.24, -1.24], .08, .06, fur, { k: .06 });
    for (const t of [.3, .6, .9]) S.paint(E([0, .9 + .34 * t, -.72 - .52 * t], [.075, .075, .04]), spot, .01);
    D.ball('#c8626a', [0, 1.24, .92], [.04, .028, .02]);
    D.face({ c: [0, 1.3, .7], spread: .44, pitch: .06, size: .064, iris: '#f0d040', style: 'cat', mouth: 'fang', mouthPitch: -.38, mouthW: .05, angry: .3, cheek: '' });
  },
  // ---------------- Iguana dragón ----------------
  lagartijin(S, D) {
    const skin = '#8aa64a', belly = '#e8e0a0';
    S.ball([0, .22, -.04], [.16, .12, .26], skin, { k: 0 });
    S.ball([0, .3, .24], [.13, .12, .14], skin, { k: .12 });
    S.limb([0, .2, -.26], [0, .08, -.66], .09, .02, skin, { k: .08 });
    S.paint(E([0, .14, .02], [.12, .06, .22]), belly, .04);
    S.pair(s => {
      S.limb([s * .12, .2, .12], [s * .26, .04, .2], .045, .04, skin, { k: .05 });
      S.limb([s * .12, .2, -.16], [s * .26, .04, -.22], .05, .04, skin, { k: .05 });
    });
    ridge(D, '#c87a3a', [0, .34, .14], [0, .24, -.3], 5, .05);
    D.face({ c: [0, .34, .28], spread: .5, pitch: .2, size: .05, iris: '#d08a20', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .045 });
  },
  iguanon(S, D) {
    const skin = '#5e8a3a', belly = '#d8d496';
    S.ball([0, .4, -.08], [.28, .22, .44], skin, { k: 0 });
    S.ball([0, .56, .42], [.2, .19, .21], skin, { k: .14 });
    S.limb([0, .36, -.46], [0, .14, -1.12], .14, .03, skin, { k: .08 });
    S.ball([0, .4, .5], [.1, .14, .12], '#e8823a', { k: .06 });                   // papada
    S.paint(E([0, .24, .04], [.2, .1, .36]), belly, .05);
    for (const t of [.2, .45, .7]) S.paint(E([0, .3 - .14 * t, -.46 - .62 * t], [.08, .08, .04]), '#3e6a2a', .01);
    S.pair(s => {
      S.limb([s * .2, .34, .24], [s * .4, .06, .34], .08, .07, skin, { k: .06 });
      S.limb([s * .2, .34, -.28], [s * .42, .06, -.36], .085, .075, skin, { k: .06 });
      D.claws(s * .4, .06, .4, .7, '#f0e8d0');
    });
    ridge(D, '#e8a840', [0, .72, .38], [0, .5, -.7], 11, .12);
    D.face({ c: [0, .6, .46], spread: .5, pitch: .18, size: .054, iris: '#e0a020', style: 'round', mouth: 'none', angry: .2 });
  },
  draguana(S, D) {
    const skin = '#3e7a4e', belly = '#e6d8a0', gold = '#f2c230';
    S.ball([0, .82, -.12], [.42, .4, .62], skin, { k: 0 });
    S.ball([0, 1.08, .52], [.3, .28, .3], skin, { k: .16 });
    S.limb([0, 1.0, .7], [0, .94, .96], .18, .14, skin, { k: .08 });
    S.limb([0, .66, -.68], [0, .2, -1.5], .22, .04, skin, { k: .1 });
    S.ball([0, .74, .64], [.13, .2, .15], '#e8823a', { k: .06 });
    S.paint(E([0, .56, .1], [.3, .18, .5]), belly, .06);
    S.pair(s => {
      legs(S, D, s, { fx: .3, bx: .32, fz: .32, bz: -.44, top: .66, r1: .14, r2: .12, color: skin });
      D.claws(s * .32, .06, .42, 1, '#f6eed8');
      D.blade('fin', '#e8a840', [s * .32, 1.18, -.04], [s * .92, 1.5, -.32], .4, [0, 1, 0], { thick: .25 });   // alas cortas
      D.cone(gold, [s * .14, 1.36, .44], [.04, .16, .04], [-.5, 0, -s * .3]);
    });
    ridge(D, gold, [0, 1.36, .44], [0, .9, -1.0], 12, .16);
    D.ring(D.glow('#ffd84a', .7), [0, 1.36, -.26], .3, [0, 0, 0], .035);           // disco de sol en el lomo
    D.face({ c: [0, 1.12, .56], spread: .48, pitch: .16, size: .06, iris: '#f6c030', style: 'cat', mouth: 'none', angry: .3, cheek: '' });
  },
  // ---------------- Míticos ----------------
  mohan(S, D) {
    const hair = '#3e7a74', skin = '#8ab6b0', water = D.finMat('#7ad0e8', .35, .78);
    S.ball([0, 1.2, 0], [.3, .36, .26], hair, { k: 0 });                          // cuerpo de pelo
    S.ball([0, 1.6, .06], [.22, .22, .22], skin, { k: .12 });
    S.limb([0, 1.5, .06], [0, .9, -.1], .28, .2, hair, { k: .12 });               // melena larga
    S.limb([0, .9, -.1], [0, .52, -.2], .2, .12, hair, { k: .1 });
    S.paint(E([0, 1.46, .22], [.13, .12, .08]), '#d8e8e2', .04);                  // barba de espuma
    S.pair(s => {
      S.limb([s * .24, 1.26, .08], [s * .38, 1.0, .24], .07, .06, skin, { k: .06 });
      S.ball([s * .38, .98, .26], [.06, .06, .06], skin, { k: .04 });
    });
    D.stick('#c8b070', [-.38, .98, .3], [.3, 1.16, .34], .022);                   // flauta de caña
    for (const t of [.25, .5, .75]) D.ball('#7a6a3a', [-.38 + .68 * t, .98 + .18 * t, .32 + .04 * t], [.012, .012, .012]);
    // Remolino de agua donde estarían los pies.
    for (let i = 0; i < 3; i++) D.blade('stream', water, [0, .7 - i * .1, 0], [Math.sin(i * 2.1) * .4, .12 + i * .06, Math.cos(i * 2.1) * .4], .3 - i * .05, [0, 1, 0], { thick: .2 });
    D.ring(D.glow('#9ae8ff', .6), [0, .28, 0], .34, [Math.PI / 2, 0, 0], .03);
    D.face({ c: [0, 1.62, .1], spread: .42, pitch: .04, size: .05, iris: '#7af0ff', style: 'led', mouth: 'none', cheek: '' });
  },
  madremonte(S, D) {
    const moss = '#4a7a3a', dark = '#2e5428', bark = '#6a4e32';
    S.ball([0, .8, 0], [.42, .62, .4], moss, { k: 0 });                           // falda de hojas
    S.ball([0, 1.46, .02], [.26, .3, .24], moss, { k: .14 });
    S.ball([0, 1.82, .06], [.2, .2, .2], '#c8a87a', { k: .1 });
    S.paint(E([0, .5, 0], [.44, .16, .42]), dark, .08);
    S.pair(s => {
      S.limb([s * .26, 1.54, .04], [s * .5, 1.24, .22], .08, .06, moss, { k: .06 });
      D.leaf('#5aa040', [s * .52, 1.2, .26], [s * .62, 1.0, .36], .12);
    });
    // Sombrero de hojas grande y cabello de bejucos.
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; D.blade('leaf', i % 2 ? '#5aa040' : '#3e8a36', [Math.sin(a) * .1, 2.0, Math.cos(a) * .1 + .04], [Math.sin(a) * .5, 1.94, Math.cos(a) * .5 + .04], .2, [0, 1, 0], { cup: .2, thick: .35 }); }
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * .4; D.stick(dark, [Math.sin(a) * .2, 1.94, Math.cos(a) * .2 - .02], [Math.sin(a) * .34, 1.36, Math.cos(a) * .3 - .1], .02); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; D.blade('leaf', i % 3 ? '#3e7a34' : '#6a9a3e', [Math.sin(a) * .34, .6, Math.cos(a) * .32], [Math.sin(a) * .5, .08, Math.cos(a) * .48], .2, [Math.sin(a), 0, Math.cos(a)], { thick: .35 }); }
    D.stick(bark, [.46, .1, .3], [.4, 1.5, .3], .03);                              // bastón
    D.ball('#f0d84a', [.4, 1.54, .3], [.05, .05, .05]);
    D.face({ c: [0, 1.84, .1], spread: .42, pitch: .02, size: .052, iris: '#6af07a', style: 'led', mouth: 'none', cheek: '' });
  },
  tunjo(S, D) {
    const gold = '#e8b830', dark = '#a87818';
    S.ball([0, .96, 0], [.3, .5, .14], gold, { k: 0 });                           // cuerpo plano de figurita
    S.ball([0, 1.56, 0], [.2, .22, .12], gold, { k: .1 });
    S.pair(s => {
      S.limb([s * .24, 1.2, 0], [s * .42, .9, .04], .06, .05, gold, { k: .05 });
      S.limb([s * .12, .5, 0], [s * .14, .3, 0], .07, .06, gold, { k: .05 });
    });
    // Líneas de alambre de oro (el tunjo se hace con hilos de cera) y un tocado de plumas.
    for (const y of [.7, .86, 1.02, 1.18]) S.paint(E([0, y, .13], [.26, .015, .02]), dark, .01);
    for (const s of [-1, 0, 1]) D.cone(gold, [s * .12, 1.86, 0], [.04, .2 - Math.abs(s) * .05, .02], [0, 0, -s * .3]);
    D.ring(gold, [0, 1.36, .06], .16, [0, 0, 0], .02);
    D.ring(D.glow('#e8b0ff', .8), [0, 1.0, -.1], .62, [0, 0, 0], .025);           // halo psíquico
    D.gem([0, 1.0, .15], '#c27aff', .05);
    D.face({ c: [0, 1.58, .04], spread: .42, pitch: .02, size: .045, iris: '#3a2a10', style: 'round', mouth: 'none', cheek: '' });
  },
  esmeraldon(S, D) {
    const stone = '#58606a', belly = '#c8ccd2';
    S.ball([0, .62, -.06], [.42, .36, .52], stone, { k: 0 });
    S.ball([0, .76, .5], [.27, .26, .26], stone, { k: .16 });
    S.paint(E([0, .44, .2], [.24, .16, .3]), belly, .06);
    S.pair(s => {
      legs(S, D, s, { fx: .24, bx: .26, fz: .3, bz: -.38, top: .5, r1: .12, r2: .1, color: stone });
      D.blade('ear', stone, [s * .16, .96, .44], [s * .3, 1.14, .38], .12, [0, 0, 1], { cup: .3, thick: .45 });
    });
    // Esmeraldas que le salen del lomo.
    for (const [x, z, h] of [[0, -.1, .5], [.2, .1, .34], [-.2, -.02, .38], [.12, -.36, .36], [-.14, -.3, .3], [0, .24, .28]]) D.crystal('#2ad070', [x, .86, z], [x * 1.3, .86 + h, z * 1.1], .1, D.glow('#2ad070', .5));
    S.limb([0, .6, -.56], [0, .5, -.9], .1, .05, stone, { k: .06 });
    D.crystal('#2ad070', [0, .52, -.9], [0, .7, -1.04], .07, D.glow('#4ae890', .6));
    D.face({ c: [0, .8, .54], spread: .46, pitch: .08, size: .06, iris: '#2ad070', style: 'round', mouth: 'smile', mouthPitch: -.3, mouthW: .05 });
  }
};
