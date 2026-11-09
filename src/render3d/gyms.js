// Gimnasios de Alborada: un edificio propio por tipo, más grande que una casa (10 × 7 casillas).
// Todos comparten la entrada al frente y al centro (x = 5), el letrero luminoso y la medalla del tipo,
// y cada uno tiene su arquitectura: invernadero, cantera, acuario, central eléctrica, mansión, hacienda,
// palacio de hielo y templo. Diseño propio, sin edificios ni logos de otros juegos.
import * as T from 'three';
import {storeSign} from './signs.js';

export const GYM_W = 10, GYM_D = 8;      // terreno: 7 filas de edificio + 1 de antejardín
const FRONT = 6.45;                       // cara delantera de las paredes
const shade = (hex, f) => { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); };

// Techo a cuatro aguas: base W × D en y = 0, cumbrera de largo W − D a la altura H (caras planas).
function hipRoof(W, D, H) {
  const w = W / 2, d = D / 2, rr = Math.max(0, w - d), v = [];
  const tri = (a, b, c) => v.push(...a, ...b, ...c);
  const A = [-w, 0, d], B = [w, 0, d], C = [w, 0, -d], E = [-w, 0, -d], R1 = [-rr, H, 0], R2 = [rr, H, 0];
  tri(A, B, R2); tri(A, R2, R1); tri(C, E, R1); tri(C, R1, R2); tri(E, A, R1); tri(B, C, R2);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(v, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(new Array(v.length / 3 * 2).fill(0), 2)); geo.computeVertexNormals(); return geo;
}

export const GYM_THEMES = {
  planta:    { sign: '#3f9a4a', medal: '#5cb04c', name: 'Invernadero' },
  roca:      { sign: '#8a6a3a', medal: '#c8a058', name: 'Cantera' },
  agua:      { sign: '#2a7ac0', medal: '#3e98dc', name: 'Acuario' },
  electrico: { sign: '#c88a10', medal: '#f0c820', name: 'Central' },
  fantasma:  { sign: '#6a3a9a', medal: '#8a6ad0', name: 'Mansión' },
  lucha:     { sign: '#c8402a', medal: '#e06040', name: 'Hacienda' },
  hielo:     { sign: '#2f8ac8', medal: '#8ad8f0', name: 'Palacio' },
  dragon:    { sign: '#a83a3a', medal: '#6a5ae0', name: 'Templo' }
};

function kit(r, g) {
  const k = {
    box: (c, x, y, z, w, h, d, soft = true) => r.box(g, c, x, y, z, w, h, d, soft),
    ball: (c, x, y, z, w, h = w, d = w) => r.mesh(g, 'ballHi', c, [x, y, z], [w, h, d]),
    cyl: (c, x, y, z, rx, h, rz = rx, shape = 'cyl32') => r.mesh(g, shape, c, [x, y, z], [rx, h, rz]),
    cone: (c, x, y, z, rx, h, rz = rx) => r.mesh(g, 'cone24', c, [x, y, z], [rx, h, rz]),
    glow: (c, i = 1.2) => r.mat(c, { emissive: c, emissiveIntensity: i }),
    gloss: (c, ro = .3) => r.mat(c, { roughness: ro }),
    glass: (c, op = .42) => r.mat(c, { transparent: true, opacity: op, roughness: .08, metalness: .2, emissive: c, emissiveIntensity: .12, depthWrite: false }),
    // Árbol redondo, pino y arbusto con flores
    tree(x, z, s = 1, leaf = '#5aa855') {
      k.cyl('#8c6745', x, .5 * s, z, .14 * s, 1 * s);
      k.ball(leaf, x, 1.35 * s, z, .7 * s, .62 * s, .66 * s); k.ball(shade(leaf, .15), x - .3 * s, 1.2 * s, z + .2 * s, .45 * s, .4 * s, .42 * s); k.ball(shade(leaf, -.12), x + .34 * s, 1.18 * s, z - .1 * s, .46 * s, .4 * s, .42 * s);
    },
    pine(x, z, s = 1, c = '#4f8a6a', snow = false) {
      k.cyl('#7d6448', x, .4 * s, z, .12 * s, .8 * s);
      for (let i = 0; i < 3; i++) { k.cone(c, x, (.95 + i * .42) * s, z, (.62 - i * .14) * s, .9 * s); if (snow) k.cone('#f4faff', x, (1.18 + i * .42) * s, z, (.34 - i * .08) * s, .42 * s); }
    },
    bush(x, z, s = 1, c = '#5ea85a', dots = null) {
      k.ball(c, x, .3 * s, z, .42 * s, .34 * s, .4 * s);
      if (dots) for (let i = 0; i < 6; i++) { const a = i * 1.1; k.ball(dots[i % dots.length], x + Math.cos(a) * .3 * s, (.38 + (i % 3) * .08) * s, z + Math.sin(a) * .28 * s, .07 * s); }
    }
  };
  return k;
}

// Medalla redonda del tipo con aro blanco y brillo.
function medal(k, color, x, y, z, s = 1) {
  k.cyl('#fff8ec', x, y, z, .5 * s, .1 * s).rotation.x = Math.PI / 2;
  k.cyl(shade(color, -.25), x, y, z + .03 * s, .42 * s, .1 * s).rotation.x = Math.PI / 2;
  k.cyl(color, x, y, z + .07 * s, .36 * s, .06 * s).rotation.x = Math.PI / 2;
  k.ball('#ffffff', x - .13 * s, y + .13 * s, z + .1 * s, .07 * s, .07 * s, .03 * s);
}

// Puerta doble con marco, peldaños y faroles. pal: {frame, door, step}
function entrance(k, pal, opts = {}) {
  const x = 5, z = FRONT, w = opts.w || 1.9, h = opts.h || 2.1;
  k.box(pal.frame, x, h / 2 + .2, z + .06, w + .36, h + .3, .3);
  for (const s of [-1, 1]) {
    k.box(pal.door, x + s * w / 4, h / 2 + .15, z + .22, w / 2 - .06, h - .1, .08);
    k.box(r2(pal.door), x + s * w / 4, h * .62 + .15, z + .27, w / 2 - .3, h * .38, .02, false);
    k.ball('#f2d27a', x + s * .14, h * .48, z + .29, .05, .05, .03);
  }
  for (let i = 0; i < 2; i++) k.box(pal.step || '#cfc6b4', x, .07 + i * .12, z + .55 - i * .18, w + 1.1 - i * .4, .14, .5);
  if (opts.lamps !== false) for (const s of [-1, 1]) {
    k.box('#3f4652', x + s * (w / 2 + .42), 1.55, z + .3, .08, .5, .08);
    k.ball(k.glow('#ffe2a0', 1.3), x + s * (w / 2 + .42), 1.88, z + .3, .13, .17, .13);
    k.cone('#3f4652', x + s * (w / 2 + .42), 2.08, z + .3, .16, .14);
  }
}
const r2 = c => shade(c, .45);

// Letrero GIMNASIO; con baseY se le ponen dos patas hasta esa altura.
function sign(r, g, theme, y, z = FRONT + .35, tilt = -.22, h = 1.0, baseY = null) {
  const s = storeSign(r, { text: 'GIMNASIO', color: GYM_THEMES[theme].sign, height: h, maxWidth: 6 });
  s.position.set(5, y, z); s.rotation.x = tilt; g.add(s);
  if (baseY !== null) { const bottom = y - h / 2 * Math.cos(tilt), len = bottom - baseY + .05; for (const sx of [-1, 1]) r.box(g, shade(GYM_THEMES[theme].sign, -.5), 5 + sx * s.userData.width * .32, baseY + len / 2, z - .14, .09, len, .09, true); }
  return s;
}

// ---------------------------------------------------------------- Diseños
const BUILD = {
  // Invernadero: muro bajo de piedra blanca, paredes y bóveda de vidrio con costillas blancas,
  // cúpula con hoja en la punta, árboles adentro y canteros de flores al frente.
  planta(r, g, k) {
    const white = '#f6f2e6', trim = '#4f9a5a';
    k.box('#d9d2bf', 5, .12, 3.5, 9.9, .24, 6.4);
    k.box(white, 5, .62, 3.5, 9.6, .8, 5.9); k.box(trim, 5, 1.05, FRONT - .02, 9.62, .08, .06);
    const glass = k.glass('#9ff0dc', .26);
    // Paredes de vidrio con parales
    k.box(glass, 5, 1.6, FRONT - .1, 9.5, 1.1, .05, false); k.box(glass, 5, 1.6, .65, 9.5, 1.1, .05, false);
    for (const x of [.27, 9.73]) k.box(glass, x, 1.6, 3.5, .05, 1.1, 5.7, false);
    for (let i = 0; i <= 12; i++) { const x = .27 + i * 9.46 / 12; for (const z of [FRONT - .1, .65]) k.box(white, x, 1.6, z, .08, 1.12, .1); }
    k.box(white, 5, 2.17, 3.5, 9.62, .1, 5.92);
    // Bóveda de vidrio y costillas
    const R = 2.85;
    r.mesh(g, 'vault', glass, [5, 2.2, 3.5], [9.4, 2.1, R]);
    for (const s of [-1, 1]) { const cap = r.mesh(g, 'halfDisc', glass, [5 + s * 4.7, 2.2, 3.5], [R, 2.1, 1]); cap.rotation.y = s * Math.PI / 2; }
    const rib = new T.TorusGeometry(1, .03, 6, 28, Math.PI);
    for (let i = 0; i <= 8; i++) { const m = new T.Mesh(rib, r.mat(white)); m.position.set(.3 + i * 9.4 / 8, 2.2, 3.5); m.rotation.y = Math.PI / 2; m.scale.set(R, 2.1, 1); m.userData.ownedGeometry = i === 0; g.add(m); }
    k.box(white, 5, 4.3, 3.5, 9.5, .08, .12);
    // Plantas adentro (se ven a través del vidrio)
    k.tree(2.2, 3.2, 1.6, '#4f9e4a'); k.tree(7.6, 3.6, 1.45, '#62b25a'); k.tree(5, 2.4, 1.9, '#3f8c46');
    for (const [x, z] of [[1.2, 5], [3.6, 5.2], [6.6, 5.1], [8.8, 4.8]]) k.bush(x, z, 1.3, '#6abf5f', ['#f4a3b8', '#ffe07a']);
    // Cúpula con hoja
    k.cyl(white, 5, 4.35, 3.5, 1.0, .14);
    r.mesh(g, 'dome', glass, [5, 4.4, 3.5], [.95, .85, .95]);
    for (let i = 0; i < 6; i++) { const m = new T.Mesh(rib, r.mat(white)); m.position.set(5, 4.4, 3.5); m.rotation.y = i * Math.PI / 6; m.scale.set(.95, .85, .95); g.add(m); }
    const leaf = k.ball(k.gloss('#5cb04c'), 5, 5.45, 3.5, .18, .34, .08); leaf.rotation.z = .5;
    // Portada de piedra blanca con columnas y enredaderas
    k.box(white, 5, 1.55, FRONT - .1, 3.6, 3.1, .3);
    k.box(shade(white, -.06), 5, 3.15, FRONT + .14, 3.9, .16, .5);
    for (const s of [-1, 1]) {
      k.cyl(white, 5 + s * 1.62, 1.5, FRONT + .36, .17, 3.0);
      for (let j = 0; j < 7; j++) k.ball(j % 3 ? '#5aa84a' : '#7cc46a', 5 + s * (1.62 + Math.sin(j * 1.7) * .14), .35 + j * .4, FRONT + .5, .12, .1, .08);
      k.ball('#f4a3b8', 5 + s * 1.7, 2.3, FRONT + .56, .07);
    }
    entrance(k, { frame: white, door: '#6aa86a', step: '#d9d2bf' }, { lamps: false });
    sign(r, g, 'planta', 3.75, FRONT + .32, -.25);
    // Canteros de flores y macetas con topiaria
    for (const s of [-1, 1]) {
      k.box('#b6805d', 5 + s * 3.4, .22, FRONT + .62, 2.6, .3, .7);
      for (let i = 0; i < 9; i++) k.ball(['#f4a3b8', '#ffe07a', '#ffffff', '#c9a8f0', '#ff9f80'][(i + (s > 0 ? 2 : 0)) % 5], 5 + s * (2.3 + i * .27), .42, FRONT + .55 + (i % 2) * .16, .1);
      k.cyl('#c27a54', 5 + s * 2.05, .3, FRONT + 1.15, .22, .5); k.ball('#4f9e4a', 5 + s * 2.05, .85, FRONT + 1.15, .32);
    }
    medal(k, GYM_THEMES.planta.medal, 5, 4.95, 4.55, .85);
  },

  // Cantera: fortaleza de bloques de piedra con almenas, torres redondas, cristales ámbar que brillan,
  // portal de vigas de mina con faroles y rieles con una vagoneta cargada.
  roca(r, g, k) {
    const stones = ['#a39a8a', '#958c7d', '#b1a796', '#8b8274', '#9e9585'];
    let n = 0; const st = () => stones[(n++ * 7) % stones.length];
    k.box('#7d766a', 5, .2, 3.5, 9.9, .4, 6.4);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) {
      const off = row % 2 ? .55 : 0, x = .5 + off + i * 1.1; if (x > 9.6) continue;
      k.box(st(), x, .62 + row * .55, FRONT - .05, 1.04, .5, .24);
    }
    k.box('#958c7d', 5, 1.75, 3.5, 9.4, 2.7, 5.8);
    for (let i = 0; i < 9; i++) k.box(st(), .8 + i * 1.05, 3.33, FRONT - .05, .62, .5, .4);
    for (const x of [.4, 9.6]) for (let i = 0; i < 5; i++) k.box(st(), x, 3.33, 1 + i * 1.1, .4, .5, .62);
    // Torres redondas de las esquinas
    for (const x of [.85, 9.15]) {
      k.cyl('#9a917f', x, 2.1, FRONT - .3, .85, 4.2);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; k.box(st(), x + Math.cos(a) * .74, 4.42, FRONT - .3 + Math.sin(a) * .74, .36, .45, .36); }
      for (let i = 0; i < 4; i++) k.box('#5a524a', x + (x < 5 ? .55 : -.55), 1 + i * .8, FRONT + .52, .14, .34, .04, false);
      // Racimo de cristales ámbar
      const amber = r.mat('#ffb84a', { emissive: '#ff9a2a', emissiveIntensity: .7, roughness: .2 });
      for (const [dx, h, tilt] of [[0, 1.1, 0], [.3, .7, -.4], [-.3, .75, .45]]) { const c = r.mesh(g, 'octa', amber, [x + dx, 4.65 + h * .35, FRONT - .3], [.22, h * .6, .22]); c.rotation.z = tilt; }
    }
    // Gran cristal en el centro del techo
    const amber2 = r.mat('#ffc860', { emissive: '#ffa030', emissiveIntensity: .85, roughness: .15 });
    for (const [dx, dz, h, tz, tx] of [[0, 0, 2.2, 0, 0], [.6, .2, 1.3, -.35, .1], [-.6, .1, 1.4, .4, -.1], [.1, -.5, 1.1, .1, .45]]) { const c = r.mesh(g, 'octa', amber2, [5 + dx, 3.2 + h * .45, 2.6 + dz], [.4, h * .55, .4]); c.rotation.set(tx, 0, tz); }
    // Portal de mina
    const wood = '#7a5232';
    for (const s of [-1, 1]) k.box(wood, 5 + s * 1.2, 1.4, FRONT + .32, .3, 2.8, .3);
    k.box(wood, 5, 2.85, FRONT + .32, 2.9, .32, .36); k.box(shade(wood, -.2), 5, 3.05, FRONT + .3, 3.1, .1, .4);
    entrance(k, { frame: '#5a4a3a', door: '#8a5c36', step: '#8b8274' }, { w: 1.9, h: 2.2, lamps: false });
    for (const s of [-1, 1]) { k.box('#3f3a36', 5 + s * 1.62, 2.5, FRONT + .5, .06, .3, .06); k.ball(k.glow('#ffcf80', 1.4), 5 + s * 1.62, 2.25, FRONT + .5, .12, .16, .12); }
    // Rieles y vagoneta
    for (let i = 0; i < 6; i++) k.box('#6a5038', 5, .05, FRONT + .9 + i * .32, 1.3, .06, .14, false);
    for (const s of [-1, 1]) k.box('#4a4c52', 5 + s * .45, .1, FRONT + 1.7, .06, .06, 1.9, false);
    k.box('#6a6f78', 6.9, .5, FRONT + 1.4, .9, .5, .6); for (const dx of [-.3, .3]) for (const dz of [-.3, .3]) { const w = k.cyl('#3a3c42', 6.9 + dx, .2, FRONT + 1.4 + dz, .14, .06); w.rotation.z = Math.PI / 2; }
    for (const [dx, dz] of [[-.2, 0], [.15, .1], [0, -.12]]) r.mesh(g, 'octa', amber2, [6.9 + dx, .85, FRONT + 1.4 + dz], [.15, .22, .15]);
    sign(r, g, 'roca', 3.55, FRONT + .45, -.2);
    for (const [x, z, s] of [[1.6, FRONT + 1.1, .5], [8.6, FRONT + .9, .4], [2.3, FRONT + 1.5, .3]]) r.mesh(g, 'leaf', '#8e8577', [x, s * .7, z], [s, s * .8, s * .9]);
    medal(k, GYM_THEMES.roca.medal, 5, 4.45, FRONT - .3, .9);
  },

  // Acuario: rotonda blanca con franja de olas, cúpula de concha, ojos de buey, anexo de entrada con toldo,
  // fuente con chorro y un faro a rayas.
  agua(r, g, k) {
    const white = '#f8f6f0', blue = '#2f7ec8', teal = '#3aa8c8';
    k.cyl('#d8d4c8', 4.6, .12, 3.2, 3.5, .24); k.box('#d8d4c8', 5, .12, FRONT - .7, 4.4, .24, 1.8);
    k.cyl(white, 4.6, 1.5, 3.2, 3.2, 2.7);
    k.cyl(blue, 4.6, 1.95, 3.2, 3.24, .36);
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; k.ball('#ffffff', 4.6 + Math.cos(a) * 3.26, 2.16, 3.2 + Math.sin(a) * 3.26, .2, .12, .2); }
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * .15 + i * Math.PI * .7 / 6, x = 4.6 + Math.cos(a) * 3.2, z = 3.2 + Math.sin(a) * 3.2;
      const ring = r.mesh(g, 'ring', '#e8eef2', [x, 1.15, z], [.36, .36, 1.4]); ring.lookAt(4.6, 1.15, 3.2); ring.rotateY(Math.PI);
      const win = k.cyl(r.mat('#8fd8ee', { emissive: '#7ac8e8', emissiveIntensity: .35, roughness: .1 }), x + Math.cos(a) * .01, 1.15, z + Math.sin(a) * .01, .3, .04); win.lookAt(4.6, 1.15, 3.2); win.rotateX(Math.PI / 2);
    }
    // Cúpula de concha con costillas
    k.cyl('#e8eef2', 4.6, 2.92, 3.2, 3.35, .16);
    r.mesh(g, 'dome', k.gloss(teal, .25), [4.6, 3.0, 3.2], [3.25, 1.7, 3.25]);
    const rib = new T.TorusGeometry(1, .045, 6, 28, Math.PI);
    for (let i = 0; i < 8; i++) { const m = new T.Mesh(rib, k.gloss('#e8f6fa', .3)); m.position.set(4.6, 3.0, 3.2); m.rotation.y = i * Math.PI / 8; m.scale.set(3.27, 1.72, 3.27); m.userData.ownedGeometry = i === 0; g.add(m); }
    k.cyl(white, 4.6, 4.75, 3.2, .45, .3); r.mesh(g, 'dome', k.gloss(blue, .25), [4.6, 4.9, 3.2], [.45, .42, .45]);
    const wave = k.ball(k.gloss('#7ad0ee', .2), 4.6, 5.45, 3.2, .16, .3, .16); wave.rotation.z = .6;
    // Anexo de entrada
    k.box(white, 5, 1.45, FRONT - .75, 3.6, 2.7, 1.5);
    k.box(blue, 5, 2.9, FRONT - .7, 3.8, .2, 1.7);
    const aw = k.box(blue, 5, 2.45, FRONT + .5, 3.0, .08, .9); aw.rotation.x = .35;
    for (let i = 0; i < 7; i++) k.ball(i % 2 ? '#ffffff' : blue, 3.6 + i * .47, 2.25, FRONT + .92, .2, .12, .08);
    entrance(k, { frame: '#e8eef2', door: '#5aa8d8', step: '#d8d4c8' }, { lamps: true });
    sign(r, g, 'agua', 3.55, FRONT + .1, -.3);
    // Faro
    const fx = 8.7, fz = 2.0;
    for (let i = 0; i < 6; i++) k.cyl(i % 2 ? '#ffffff' : '#d84a4a', fx, .4 + i * .7, fz, .62 - i * .045, .7);
    k.cyl('#3f4652', fx, 4.6, fz, .58, .1); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; k.box('#3f4652', fx + Math.cos(a) * .52, 4.82, fz + Math.sin(a) * .52, .04, .35, .04, false); }
    k.cyl(r.mat('#fff4c0', { emissive: '#ffe080', emissiveIntensity: 1.6 }), fx, 5.0, fz, .32, .55);
    k.cone('#d84a4a', fx, 5.55, fz, .45, .5); k.ball('#3f4652', fx, 5.85, fz, .07);
    // Fuente con chorro
    const cx = 1.5, cz = FRONT + .62;
    k.cyl('#d8d4c8', cx, .22, cz, .85, .44); k.cyl(r.mat('#8fd8ee', { emissive: '#5ab8e0', emissiveIntensity: .35, roughness: .05 }), cx, .42, cz, .74, .04);
    k.cyl('#e8eef2', cx, .7, cz, .12, .6);
    for (let i = 0; i < 5; i++) k.ball(r.mat('#cfeefa', { emissive: '#9adcf4', emissiveIntensity: .5, transparent: true, opacity: .8 }), cx, 1.05 + i * .2, cz, .2 - i * .03, .16, .2 - i * .03);
    for (const [x, z] of [[3.0, FRONT + 1.2], [7.0, FRONT + 1.2]]) { k.cyl('#c2a070', x, .35, z, .08, .7); for (let i = 0; i < 5; i++) { const a = i * 1.26, l = k.ball('#6b9c68', x + Math.cos(a) * .3, .72, z + Math.sin(a) * .3, .35, .05, .1); l.rotation.y = -a; } }
    medal(k, GYM_THEMES.agua.medal, 4.6, 4.3, 5.42, .9);
  },

  // Central eléctrica: nave de lámina corrugada con techo de dientes de sierra y ventanales que brillan,
  // franja de peligro, bobinas con esferas de luz, aerogeneradores atrás y un rayo en la fachada.
  electrico(r, g, k) {
    const metal = '#c9cdd3', dark = '#4a4f58', yellow = '#f0c020';
    k.box('#8a8e94', 5, .12, 3.5, 9.9, .24, 6.4);
    k.box(metal, 5, 1.75, 3.5, 9.4, 3.1, 5.8);
    for (let i = 0; i < 31; i++) k.box(i % 2 ? '#b8bdc4' : '#d6d9de', .4 + i * .3, 1.85, FRONT - .02, .16, 2.7, .06, false);
    for (let i = 0; i < 24; i++) k.box(i % 2 ? '#2a2c30' : yellow, .4 + i * .38, .38, FRONT + .01, .38, .28, .06, false);
    k.box(yellow, 5, 3.32, FRONT - .02, 9.5, .18, .1);
    // Techo de dientes de sierra con ventanales encendidos
    const toothShape = new T.Shape(); toothShape.moveTo(0, 0); toothShape.lineTo(2.35, 0); toothShape.lineTo(2.35, 1.0); toothShape.closePath();
    const toothGeo = new T.ExtrudeGeometry(toothShape, { depth: 5.9, bevelEnabled: false });
    for (let i = 0; i < 4; i++) {
      const x = .3 + i * 2.35, m = new T.Mesh(toothGeo, r.mat('#a3a9b2', { roughness: .45, metalness: .25 }));
      m.position.set(x, 3.3, .55); m.userData.ownedGeometry = i === 0; m.castShadow = m.receiveShadow = true; g.add(m);
      k.box(r.mat('#fff1b0', { emissive: '#ffd860', emissiveIntensity: .9 }), x + 2.3, 3.8, 3.5, .06, .8, 5.6, false);
      for (let j = 1; j < 6; j++) { const rib = k.box('#8e949c', x + j * .39, 3.3 + j * .39 * (1 / 2.35) + .02, 3.5, .05, .05, 5.9, false); rib.position.y = 3.3 + (j * .39) / 2.35 + .03; }
    }
    // Rayo en la fachada (extruido)
    const bolt = new T.Shape(); bolt.moveTo(.1, 1); bolt.lineTo(-.35, 0); bolt.lineTo(-.02, 0); bolt.lineTo(-.25, -1); bolt.lineTo(.38, .2); bolt.lineTo(.04, .2); bolt.lineTo(.3, 1); bolt.closePath();
    const bg = new T.ExtrudeGeometry(bolt, { depth: .12, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 });
    for (const x of [1.9, 8.1]) { const m = new T.Mesh(bg, r.mat(yellow, { emissive: '#ffd030', emissiveIntensity: .6, roughness: .3 })); m.position.set(x, 2.1, FRONT + .02); m.scale.setScalar(.75); m.userData.ownedGeometry = x < 5; m.castShadow = true; g.add(m); }
    // Bobinas con esferas de luz
    for (const x of [.55, 9.45]) {
      k.cyl(dark, x, .5, FRONT + .5, .42, 1.0); k.cyl('#6a707a', x, 1.6, FRONT + .5, .16, 2.2);
      for (let i = 0; i < 6; i++) r.mesh(g, 'ring', r.mat('#d8883a', { metalness: .6, roughness: .3 }), [x, 1.0 + i * .3, FRONT + .5], [.32 - i * .02, .32 - i * .02, 3]).rotation.x = Math.PI / 2;
      const top = new T.Mesh(new T.TorusGeometry(.38, .15, 12, 28), r.mat('#e8ecf0', { metalness: .6, roughness: .25 })); top.position.set(x, 2.85, FRONT + .5); top.rotation.x = Math.PI / 2; top.userData.ownedGeometry = true; top.castShadow = true; g.add(top);
      k.ball(r.mat('#fff8c0', { emissive: '#ffe040', emissiveIntensity: 2.4 }), x, 3.12, FRONT + .5, .2);
    }
    // Aerogeneradores atrás
    for (const [x, z, s] of [[1.8, .4, .7], [8.4, .2, .8]]) {
      k.cone('#f2f4f6', x, 4.2 * s, z, .18 * s, 8.4 * s);
      k.box('#e6e9ec', x, 8.4 * s, z + .2, .34 * s, .3 * s, .7 * s);
      for (let i = 0; i < 3; i++) { const blade = k.box('#ffffff', x, 8.4 * s, z + .6 * s, .14 * s, 2.4 * s, .05 * s); const a = i * Math.PI * 2 / 3 + .3; blade.position.x = x + Math.sin(a) * 1.2 * s; blade.position.y = 8.4 * s + Math.cos(a) * 1.2 * s; blade.rotation.z = -a; }
      k.ball(yellow, x, 8.4 * s, z + .62 * s, .14 * s);
    }
    entrance(k, { frame: yellow, door: '#7a8290', step: '#9aa0a8' });
    sign(r, g, 'electrico', 2.88, FRONT + .14, -.15, .8);
    k.box('#4a4f58', 5, 3.75, FRONT - .02, 1.3, .9, .12); medal(k, GYM_THEMES.electrico.medal, 5, 3.78, FRONT + .06, .8);
  },

  // Mansión: casona de dos pisos color uva con techo de pizarra muy inclinado, torres torcidas con agujas,
  // rosetón que brilla, ventanas con luz verdosa, reja de lanzas y fuegos fatuos flotando.
  fantasma(r, g, k) {
    const wall = '#6e5c8a', trim = '#a998c4', slate = '#4a4264', ghost = r.mat('#b8ffe0', { emissive: '#7affc8', emissiveIntensity: 1.1 });
    k.box('#4a4458', 5, .12, 3.5, 9.9, .24, 6.4);
    k.box(wall, 5, 1.85, 3.575, 7.4, 3.3, 5.75);
    k.box(trim, 5, .4, FRONT, 7.5, .3, .1); k.box(trim, 5, 3.48, FRONT, 7.6, .14, .14);
    for (const x of [2.3, 3.3, 6.7, 7.7]) for (const y of [1.3, 2.7]) {
      k.box(trim, x, y, FRONT + .02, .62, .9, .08);
      k.box(r.mat('#a8f0d0', { emissive: '#6ae8b0', emissiveIntensity: y > 2 ? .9 : .5 }), x, y, FRONT + .07, .46, .72, .04, false);
      k.box(trim, x, y + .52, FRONT + .08, .7, .08, .14);
    }
    // Techo de pizarra a dos aguas muy inclinado
    for (const s of [-1, 1]) { const p = k.box(slate, 5, 5.04, 3.575 + s * 1.54, 7.8, .14, 4.45); p.rotation.x = s * .785; }
    k.box(shade(slate, -.2), 5, 6.6, 3.575, 7.9, .14, .22);
    for (let i = 0; i < 4; i++) k.cone(slate, 1.6 + i * 2.27, 6.85, 3.575, .07, .45);
    // Torres torcidas con agujas
    for (const [x, lean] of [[.9, .08], [9.1, -.1]]) {
      k.cyl(wall, x, 2.4, FRONT - .65, .85, 4.8); k.cyl(trim, x, 4.85, FRONT - .65, .92, .16);
      const spire = k.cone(slate, x + lean * 2, 6.0, FRONT - .65, .95, 2.4); spire.rotation.z = lean;
      k.ball(ghost, x + lean * 4.2, 7.3, FRONT - .65, .1);
      for (const y of [1.6, 3.4]) { k.box(r.mat('#a8f0d0', { emissive: '#6ae8b0', emissiveIntensity: .8 }), x, y, FRONT + .2, .3, .55, .04, false); k.box(trim, x, y + .32, FRONT + .22, .4, .08, .08); }
    }
    // Rosetón sobre la puerta
    k.cyl(trim, 5, 3.0, FRONT + .04, .78, .12).rotation.x = Math.PI / 2;
    k.cyl(r.mat('#e0a8ff', { emissive: '#c070ff', emissiveIntensity: 1.0 }), 5, 3.0, FRONT + .1, .64, .06).rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const sp = k.box(trim, 5 + Math.cos(a) * .32, 3.0 + Math.sin(a) * .32, FRONT + .14, .06, .64, .03, false); sp.rotation.z = a + Math.PI / 2; }
    entrance(k, { frame: trim, door: '#3a2c48', step: '#6a6478' });
    sign(r, g, 'fantasma', 4.5, FRONT + .3, -.3, .95, 3.55);
    // Reja de lanzas con portón abierto
    for (let i = 0; i < 21; i++) { const x = .2 + i * .48; if (Math.abs(x - 5) < 1.4) continue; k.box('#2a2632', x, .55, FRONT + 1.15, .05, 1.1, .05, false); k.cone('#2a2632', x, 1.15, FRONT + 1.15, .06, .16); }
    for (const y of [.35, .9]) for (const s of [-1, 1]) k.box('#2a2632', 5 + s * 3.15, y, FRONT + 1.15, 3.6, .05, .05, false);
    // Fuegos fatuos y árboles secos
    for (const [x, y, z] of [[1.6, 1.6, FRONT + .9], [8.3, 2.2, FRONT + .7], [3.1, 2.6, FRONT + 1.3], [7.0, 1.3, FRONT + 1.4], [9.5, 3.4, 2.0]]) { k.ball(ghost, x, y, z, .14, .17, .14); k.cone(ghost, x, y + .2, z, .09, .22); }
    for (const x of [.2, 9.8]) { k.cyl('#3a3038', x, .9, FRONT + .2, .1, 1.8); for (const [a, l] of [[.7, .7], [-.6, .6], [.2, .5]]) { const b = k.cyl('#3a3038', x + Math.sin(a) * l * .5, 1.5 + l * .3, FRONT + .2, .04, l); b.rotation.z = -a; } }
    medal(k, GYM_THEMES.fantasma.medal, 5, 5.75, 5.0, .9);
  },

  // Hacienda del cafetal: casona de dos pisos blanca con zócalo de colores, balcón corrido de madera roja,
  // ventanas y puertas de colores, techo de teja de barro, banderines, cafetos y costales de café.
  lucha(r, g, k) {
    const white = '#fbf7ee', red = '#d63c3a', blue = '#2a7ad8', yellow = '#f2c230', green = '#3aa860', tile = '#c8643a';
    k.box('#c9b9a0', 5, .12, 3.5, 9.9, .24, 6.4);
    k.box(white, 5, 1.95, 3.4, 9.4, 3.5, 5.6);
    // Zócalo de colores con rombos
    k.box(blue, 5, .6, FRONT - .3, 9.5, .7, .1); k.box(yellow, 5, .98, FRONT - .28, 9.5, .08, .12);
    for (let i = 0; i < 12; i++) { const d = k.box(i % 2 ? red : yellow, .6 + i * .8, .6, FRONT - .22, .3, .3, .04, false); d.rotation.z = Math.PI / 4; }
    // Ventanas con marcos de colores (dos pisos)
    const frames = [green, yellow, red, blue];
    [1.2, 2.6, 7.4, 8.8].forEach((x, i) => {
      for (const [y, h] of [[1.65, 1.0], [3.0, .95]]) {
        k.box(frames[(i + (y > 2 ? 1 : 0)) % 4], x, y, FRONT - .24, .9, h + .12, .08);
        k.box(r.mat('#ffe8b8', { emissive: '#ffd890', emissiveIntensity: .25 }), x, y, FRONT - .2, .66, h - .1, .04, false);
        for (const s of [-1, 1]) k.box(frames[(i + 2) % 4], x + s * .6, y, FRONT - .2, .3, h, .06);
      }
    });
    // Balcón corrido del segundo piso
    k.box('#8a5a34', 5, 2.42, FRONT + .25, 9.6, .12, 1.0);
    for (let i = 0; i < 25; i++) k.box(red, .3 + i * .39, 2.72, FRONT + .72, .06, .5, .06, false);
    k.box(red, 5, 2.98, FRONT + .72, 9.6, .08, .1); k.box(red, 5, 2.5, FRONT + .72, 9.6, .06, .08);
    for (const x of [.3, 2.0, 8.0, 9.7]) k.box(yellow, x, 1.2, FRONT + .72, .14, 2.4, .14);
    // Techo de teja de barro a cuatro aguas con hileras de tejas en las caras largas.
    const RW = 10.2, RD = 6.4, RH = 1.6;
    const roof = new T.Mesh(hipRoof(RW, RD, RH), r.mat(tile, { roughness: .55 })); roof.position.set(5, 3.72, 3.4); roof.userData.ownedGeometry = true; roof.castShadow = roof.receiveShadow = true; g.add(roof);
    const ang = Math.atan2(RH, RD / 2), slope = Math.hypot(RH, RD / 2);
    for (const s of [-1, 1]) for (let j = 0; j < 6; j++) {
      const t = (j + .5) / 6, len = RW - RD * t;
      const strip = k.box(j % 2 ? shade(tile, -.08) : shade(tile, .08), 5, 3.72 + RH * t + .05, 3.4 + s * RD / 2 * (1 - t), len, .07, slope / 6 * .9);
      strip.rotation.x = s * ang;
    }
    const ridgeCap = k.cyl(shade(tile, -.2), 5, 3.72 + RH + .04, 3.4, .1, RW - RD + .3); ridgeCap.rotation.z = Math.PI / 2;
    k.box(shade(tile, -.15), 5, 3.68, 3.4, RW + .05, .1, RD + .05);
    // Portón de madera en arco
    entrance(k, { frame: yellow, door: '#7a4a28', step: '#c9b9a0' }, { w: 2.0, h: 2.0 });
    sign(r, g, 'lucha', 4.0, FRONT + .62, -.3, .95, 3.02);
    // Banderines de colores
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const f = k.cone([red, yellow, blue, green][i % 4], 5 + s * (.6 + i * .5), 3.3 - Math.sin(i / 8 * Math.PI) * .25, FRONT + .95, .13, .26, .03); f.rotation.x = Math.PI; }
    // Cafetos con granos rojos, costales y muñecos de entrenamiento
    for (const [x, z] of [[.8, FRONT + 1.3], [1.9, FRONT + 1.5], [8.2, FRONT + 1.5], [9.3, FRONT + 1.3]]) k.bush(x, z, 1.2, '#2f7a3a', ['#d83a3a', '#e85a4a']);
    for (const [x, z] of [[3.1, FRONT + 1.3], [3.5, FRONT + 1.45]]) { k.ball('#c8a878', x, .3, z, .26, .32, .22); k.box('#8a6a48', x, .58, z, .14, .08, .14); }
    for (const x of [6.6, 7.3]) { k.cyl('#8a5a34', x, .6, FRONT + 1.3, .06, 1.2); k.cyl('#d8b080', x, .9, FRONT + 1.3, .2, .8); k.ball('#d8b080', x, 1.45, FRONT + 1.3, .18); const arm = k.cyl('#8a5a34', x, 1.05, FRONT + 1.3, .04, .8); arm.rotation.z = Math.PI / 2; }
    medal(k, GYM_THEMES.lucha.medal, 5, 5.45, 3.3, 1.0);
  },

  // Palacio de escarcha: muros de bloques de hielo con nieve encima, aguja central de cristal y cuatro menores,
  // carámbanos en los aleros, arco helado en la entrada, muñecos de nieve y pinos nevados.
  hielo(r, g, k) {
    const ice = r.mat('#c8ecf8', { roughness: .12, metalness: .05, emissive: '#9ad8f0', emissiveIntensity: .18 }), ice2 = r.mat('#aee0f2', { roughness: .12, emissive: '#8ad0ec', emissiveIntensity: .2 });
    const snow = '#f7fbff', crystal = r.mat('#d8f6ff', { roughness: .05, metalness: .1, emissive: '#7adcff', emissiveIntensity: .55 });
    k.box('#e8f2f8', 5, .12, 3.5, 9.9, .24, 6.4);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) { const x = .55 + (row % 2 ? .5 : 0) + i * 1.0; if (x > 9.5) continue; k.box((row + i) % 3 ? ice : ice2, x, .55 + row * .58, FRONT - .1, .96, .54, .3); }
    k.box(ice2, 5, 1.7, 3.4, 9.2, 3.0, 5.6);
    k.box(snow, 5, 3.3, 3.4, 9.6, .28, 6.0); for (let i = 0; i < 14; i++) k.ball(snow, .5 + i * .69, 3.42, FRONT + .1, .32, .2, .26);
    for (let i = 0; i < 20; i++) k.cone(crystal, .4 + i * .48, 3.0, FRONT + .2, .06, .3 + (i % 3) * .12).rotation.x = Math.PI;
    // Aguja central y cuatro menores
    r.mesh(g, 'octa', crystal, [5, 5.2, 3.0], [.8, 2.2, .8]);
    for (const [x, z, s] of [[1.6, 1.8, .9], [8.4, 1.8, .9], [2.6, 4.6, .65], [7.4, 4.6, .65]]) { k.cyl(ice2, x, 3.9, z, .5 * s, 1.2 * s); k.box(snow, x, 4.5 * s + .4, z, .9 * s, .14, .9 * s); r.mesh(g, 'octa', crystal, [x, 4.5 + 1.0 * s, z], [.38 * s, 1.1 * s, .38 * s]); }
    // Arco helado de la entrada
    const arch = new T.Mesh(new T.TorusGeometry(1.25, .22, 10, 24, Math.PI), crystal); arch.position.set(5, 2.2, FRONT + .35); arch.userData.ownedGeometry = true; arch.castShadow = true; g.add(arch);
    for (const s of [-1, 1]) k.box(ice, 5 + s * 1.25, 1.1, FRONT + .35, .44, 2.2, .44);
    entrance(k, { frame: '#e8f6fc', door: '#7ab8d8', step: '#dce8f0' }, { lamps: false });
    sign(r, g, 'hielo', 4.15, FRONT + .35, -.3);
    // Muñecos de nieve y pinos nevados
    for (const [x, z] of [[1.4, FRONT + 1.2], [8.6, FRONT + 1.3]]) {
      k.ball(snow, x, .38, z, .42, .38, .42); k.ball(snow, x, .95, z, .3, .28, .3); k.ball(snow, x, 1.38, z, .22);
      k.cone('#f08a30', x, 1.38, z + .3, .05, .22).rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) k.ball('#2a2c30', x + s * .08, 1.45, z + .19, .03);
      k.cyl('#3a6ad8', x, 1.12, z, .26, .1);
    }
    for (const [x, z, s] of [[.4, 1.0, 1.3], [9.6, 1.4, 1.2], [.5, FRONT + .3, .8], [9.5, FRONT + .2, .85]]) k.pine(x, z, s, '#3f7a6a', true);
    for (const [x, z] of [[2.6, FRONT + 1.4], [7.2, FRONT + 1.5], [6.2, FRONT + 1.2]]) r.mesh(g, 'octa', crystal, [x, .25, z], [.14, .32, .14]);
    medal(k, GYM_THEMES.hielo.medal, 5, 5.2, 4.6, .85);
  },

  // Templo de la cumbre: pirámide escalonada de piedra rojiza con bordes dorados, santuario con techo de
  // escamas y puntas curvas, braseros con fuego, estandartes y dos cabezas de dragón talladas.
  dragon(r, g, k) {
    const stone = '#a8634a', stone2 = '#93533e', gold = '#e8b84a', jade = '#3a8a6e', fire = r.mat('#ffb040', { emissive: '#ff7a18', emissiveIntensity: 2.2 });
    k.box('#7d4a38', 5, .15, 3.5, 9.9, .3, 6.4);
    const tiers = [[9.4, 5.9, 1.2], [7.6, 4.6, 1.1], [5.6, 3.4, 1.0]];
    let y = .3;
    tiers.forEach(([w, d, h], i) => {
      k.box(i % 2 ? stone2 : stone, 5, y + h / 2, 3.3, w, h, d);
      k.box(gold, 5, y + h - .03, 3.3 + d / 2 - .01, w + .04, .07, .06, false);
      for (let j = 0; j < Math.floor(w / .9); j++) k.box(shade(stone, -.15), 5 - w / 2 + .45 + j * .9, y + h * .45, 3.3 + d / 2, .5, .18, .04, false);
      y += h;
    });
    // Santuario con columnas y techo de escamas
    const top = y;
    for (const x of [3.3, 4.4, 5.6, 6.7]) { k.cyl('#c84a3a', x, top + .7, 3.3 + 1.1, .13, 1.4); k.cyl(gold, x, top + 1.42, 3.3 + 1.1, .17, .08); }
    k.box('#6a2e2a', 5, top + .7, 3.0, 3.6, 1.4, 1.6);
    for (let j = 0; j < 3; j++) {
      const w = 4.8 - j * 1.2, d = 3.4 - j * .8, yy = top + 1.6 + j * .5;
      k.box(jade, 5, yy, 3.3, w, .18, d);
      k.box(gold, 5, yy - .1, 3.3 + d / 2, w + .05, .06, .06, false);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const tip = k.cone(gold, 5 + sx * (w / 2 + .05), yy + .12, 3.3 + sz * (d / 2), .06, .34); tip.rotation.z = -sx * .5; }
      for (let i = 0; i < Math.floor(w / .4); i++) k.ball(shade(jade, .1), 5 - w / 2 + .2 + i * .4, yy + .1, 3.3 + d / 2 - .05, .16, .07, .12);
    }
    k.ball(r.mat('#ffd860', { emissive: '#ffb030', emissiveIntensity: 1.2, roughness: .2 }), 5, top + 3.0, 3.3, .3);
    // Portal en la base
    entrance(k, { frame: gold, door: '#5a2a24', step: '#8a5240' }, { w: 1.9, h: 2.0, lamps: false });
    sign(r, g, 'dragon', 2.9, FRONT + .5, -.3, .9, 2.3);
    // Cabezas de dragón talladas a los lados del portal
    for (const s of [-1, 1]) {
      const x = 5 + s * 2.4, z = FRONT + .5;
      k.box(stone2, x, .55, z, 1.0, 1.1, 1.0);
      k.ball(jade, x, 1.35, z, .42, .4, .5); k.box(jade, x, 1.28, z + .45, .42, .26, .5);
      k.box(shade(jade, -.2), x, 1.1, z + .5, .38, .1, .44);
      for (const e of [-1, 1]) { k.ball(fire, x + e * .2, 1.48, z + .3, .07, .05, .05); const horn = k.cone(gold, x + e * .22, 1.85, z - .15, .07, .55); horn.rotation.x = -.6; horn.rotation.z = -e * .25; }
      for (let i = 0; i < 4; i++) k.cone(gold, x, 1.72 - i * .06, z - .3 - i * .22, .07, .2 + i * .02).rotation.x = -.9;
    }
    // Braseros con fuego y estandartes
    for (const x of [.7, 9.3]) {
      k.cyl('#5a3a30', x, .5, FRONT + .9, .12, 1.0); k.cyl(gold, x, 1.05, FRONT + .9, .38, .22, .38);
      k.ball(fire, x, 1.3, FRONT + .9, .26, .32, .26); k.cone(fire, x, 1.62, FRONT + .9, .16, .42);
    }
    for (const x of [2.2, 7.8]) { k.box('#c84a3a', x, 2.6, FRONT - .08 - .6, .8, 1.4, .05, false); k.box(gold, x, 3.32, FRONT - .66, .9, .08, .1); k.ball(gold, x, 2.6, FRONT - .62, .16, .16, .04); }
    medal(k, GYM_THEMES.dragon.medal, 5, top + 2.25, 3.3 + 1.75, .8);
  }
};

// Construye el gimnasio del tipo pedido. El origen es la esquina noroeste de su terreno (como building()).
export function gymBuilding(r, theme) {
  const g = new T.Group(), k = kit(r, g);
  (BUILD[theme] || BUILD.planta)(r, g, k);
  g.userData.theme = theme;
  return g;
}
export const GYM_ORDER = ['planta', 'roca', 'agua', 'electrico', 'fantasma', 'lucha', 'hielo', 'dragon'];
