// Modelos 3D de Tierra Grande: edificios altos (con ventanas en textura y transparencia cuando tapan al
// jugador), carros (parqueados, del tráfico y el del jugador), avionetas (parqueadas y en vuelo) y surtidores.
import * as T from 'three';

const shade = (hex, f) => { const c = new T.Color(hex); return '#' + (f > 0 ? c.lerp(new T.Color('#ffffff'), f) : c.multiplyScalar(1 + f)).getHexString(); };
const WINDOWS = new Map();
// Texturas propias (no se registran en Resources): se comparten entre edificios y sobreviven a release().
function paint(draw, size) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}
// Textura de fachada: una fila de ventanas por piso, con algunas luces prendidas.
function windowTexture(r, wall, floors, cols) {
  const key = wall + floors + ':' + cols;
  if (WINDOWS.has(key)) return WINDOWS.get(key);
  const tex = paint((g, q) => {
    g.fillStyle = wall; g.fillRect(0, 0, q, q);
    const fh = q / floors, cw = q / cols;
    for (let f = 0; f < floors; f++) {
      g.fillStyle = shade(wall, -.14); g.fillRect(0, f * fh + fh - 2, q, 2);
      if (f === floors - 1) continue;    // planta baja: se dibuja aparte
      for (let c = 0; c < cols; c++) {
        const lit = ((f * 7 + c * 13) % 9) === 0;
        g.fillStyle = lit ? '#f6e6a8' : '#5f8fb0'; g.fillRect(c * cw + cw * .18, f * fh + fh * .2, cw * .64, fh * .58);
        if (!lit) { g.fillStyle = '#a9d8ec'; g.fillRect(c * cw + cw * .18, f * fh + fh * .2, cw * .64, fh * .16); }
      }
    }
  }, 256);
  WINDOWS.set(key, tex);
  return tex;
}

// Edificio alto de w × h casillas y `floors` pisos. Devuelve el grupo y sus materiales (para desvanecerlo).
export function tower3d(r, o) {
  const g = new T.Group(), w = o.w, d = o.h, floors = o.floors || 6, opt = o.opt || {};
  const wall = opt.wall || '#d8d0c0', H = floors * 1.05 + .5, mats = [];
  const own = (color, extra = {}) => { const m = r.mat(color, extra).clone(); m.transparent = true; mats.push(m); return m; };
  const box = (mat, x, y, z, W, Hh, D) => { const m = new T.Mesh(r.geometries.box, mat); m.position.set(x, y, z); m.scale.set(W, Hh, D); m.castShadow = true; m.receiveShadow = true; m.userData.ownedMaterial = true; g.add(m); return m; };
  const tex = windowTexture(r, wall, floors, Math.max(2, Math.round(w * 1.4)));
  const facade = own('#ffffff'); facade.map = tex;
  const side = own('#ffffff'); side.map = windowTexture(r, shade(wall, -.08), floors, Math.max(2, Math.round(d * 1.4)));
  const body = new T.Mesh(r.geometries.box, [side, side, own(shade(wall, -.2)), own(shade(wall, -.3)), facade, side]);
  body.position.set(w / 2, H / 2 + .1, d / 2); body.scale.set(w - .1, H, d - .2); body.castShadow = body.receiveShadow = true; body.userData.ownedMaterial = true; g.add(body);
  box(own('#a3a493'), w / 2, .06, d / 2, w + .1, .12, d);                       // zócalo
  box(own(opt.roof || shade(wall, -.25)), w / 2, H + .16, d / 2, w - .02, .14, d - .1);   // pretil
  box(own(shade(wall, -.35)), w / 2, H + .1, d / 2, w - .4, .1, d - .5);
  if (!opt.control) for (let i = 0; i < Math.max(1, Math.floor(w / 3)); i++) box(own('#b9bdc4'), 1 + i * 2.6, H + .45, d / 2 - .3, .9, .5, .7);
  else box(own('#7ac8e8', { emissive: '#7ac8e8', emissiveIntensity: .25, roughness: .2 }), w / 2, H + .55, d / 2, w - .2, .8, d - .3);
  // Entrada de vidrio con alero.
  const dc = (opt.doorCol ?? Math.floor(w / 2)) + .5;
  box(own('#a8dcf2', { roughness: .15, emissive: '#cfe9e0', emissiveIntensity: .15 }), dc, .75, d - .06, 1.6, 1.3, .06);
  box(own('#3a3a4a'), dc, 1.5, d + .05, 2, .1, .5);
  g.userData.mats = mats; g.userData.height = H;
  return g;
}

// Carro de caricatura: 1 × 1,8 casillas, trompa hacia +z.
export function car3d(r, color = '#d8443a', { lights = true } = {}) {
  const g = new T.Group(), b = (c, x, y, z, w, h, d, soft = true) => r.box(g, c, x, y, z, w, h, d, soft);
  const dark = shade(color, -.3);
  b(color, 0, .38, 0, .92, .36, 1.72);                       // carrocería
  b(shade(color, .12), 0, .58, -.05, .84, .1, 1.5);
  b(color, 0, .74, -.12, .78, .34, .92);                     // cabina
  const glass = r.mat('#8cc4dc', { roughness: .15, emissive: '#cfe9e0', emissiveIntensity: .12 });
  r.mesh(g, 'soft', glass, [0, .76, .33], [.7, .26, .04]);   // parabrisas
  r.mesh(g, 'soft', glass, [0, .76, -.57], [.68, .24, .04]);
  for (const s of [-1, 1]) r.mesh(g, 'soft', glass, [s * .395, .76, -.12], [.03, .24, .74]);
  for (const [x, z] of [[-.44, .55], [.44, .55], [-.44, -.55], [.44, -.55]]) {
    const w = r.mesh(g, 'cylinder', '#26262e', [x, .2, z], [.2, .14, .2]); w.rotation.z = Math.PI / 2;
    const hub = r.mesh(g, 'cylinder', '#c9cdd2', [x + Math.sign(x) * .02, .2, z], [.09, .15, .09]); hub.rotation.z = Math.PI / 2;
  }
  b(dark, 0, .24, .86, .9, .14, .06); b(dark, 0, .24, -.86, .9, .14, .06);     // parachoques
  if (lights) for (const s of [-1, 1]) {
    r.mesh(g, 'soft', r.mat('#fff6c8', { emissive: '#fff2b0', emissiveIntensity: .6 }), [s * .3, .42, .86], [.18, .1, .04]);
    r.mesh(g, 'soft', r.mat('#e04848', { emissive: '#e04848', emissiveIntensity: .4 }), [s * .32, .42, -.86], [.16, .08, .04]);
  }
  return g;
}

// Avioneta de hélice: envergadura 3, largo 2,6; trompa hacia +z. La hélice queda en userData.prop.
export function plane3d(r, color = '#f6f2ea') {
  const g = new T.Group(), trim = color === '#f6f2ea' ? '#e2603f' : '#f6f2ea';
  const body = r.mesh(g, 'cylinder', color, [0, .55, 0], [.26, 2.1, .3]); body.rotation.x = Math.PI / 2;
  r.mesh(g, 'ball', color, [0, .55, 1.04], [.26, .26, .3]);
  r.mesh(g, 'cone', color, [0, .58, -1.25], [.2, .5, .2]).rotation.x = -Math.PI / 2;
  r.mesh(g, 'soft', r.mat('#8cc4dc', { roughness: .15, emissive: '#cfe9e0', emissiveIntensity: .15 }), [0, .78, .45], [.36, .2, .6]);
  r.box(g, color, 0, .5, .2, 3.1, .07, .62, true);                         // ala
  for (const s of [-1, 1]) r.box(g, trim, s * 1.42, .5, .2, .26, .08, .64, true);
  r.box(g, color, 0, .62, -1.25, 1.1, .05, .34, true);                      // estabilizador
  r.box(g, trim, 0, .9, -1.28, .06, .55, .38, true);                        // timón
  for (const s of [-1, 1]) { r.mesh(g, 'cylinder', '#26262e', [s * .45, .13, .3], [.1, .08, .1]).rotation.z = Math.PI / 2; r.box(g, '#8a8f9a', s * .38, .3, .3, .04, .3, .04); }
  r.mesh(g, 'cylinder', '#26262e', [0, .13, -1.1], [.06, .05, .06]).rotation.z = Math.PI / 2;
  const prop = new T.Group(); prop.position.set(0, .55, 1.3); g.add(prop);
  r.mesh(prop, 'ball', '#3a3a44', [0, 0, 0], [.07, .07, .07]);
  for (const a of [0, Math.PI / 2]) { const blade = r.box(prop, '#3a3a44', 0, 0, 0, .06, .8, .03, true); blade.rotation.z = a; }
  for (const m of prop.children) m.userData.keep = true;
  g.userData.prop = prop;
  return g;
}

export function pump3d(r) {
  const g = new T.Group();
  r.box(g, '#e04848', 0, .55, 0, .5, 1.1, .38, true); r.box(g, '#f6f2ea', 0, .82, .2, .34, .26, .02, true);
  r.box(g, '#3a3a44', .3, .6, 0, .06, .5, .06); r.box(g, '#8a8f9a', 0, .03, 0, .8, .06, .6);
  return g;
}
