// Pantalla de inicio en 3D: el Lago Espejo al amanecer (la alborada) con bruma sobre el agua. Las tres
// iniciales posan en una lomita con el sol detrás (luz de borde), el protagonista las acompaña y suben
// motas de luz. Horizontal: el menú va a la izquierda y las criaturas a la derecha; vertical: logo arriba,
// criaturas al medio y menú abajo. Se arma una sola vez al entrar al título y se libera al empezar a jugar.
import * as T from 'three';
import { creature, character } from './actors.js';
import { animateCreature } from './creatures3d.js';
import { animatePerson } from './people.js';
import { detachHero } from './hero-model.js';
import { building } from './models.js';

const sky = r => r.texture((g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s);
  gr.addColorStop(0, '#34428e'); gr.addColorStop(.22, '#6b6cb8'); gr.addColorStop(.42, '#c886b4'); gr.addColorStop(.56, '#f5a3a0');
  gr.addColorStop(.68, '#ffc792'); gr.addColorStop(.82, '#ffe2b4'); gr.addColorStop(1, '#fff2d8');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, 256);
// Bruma: mancha suave, más ancha que alta, que se desvanece en los bordes.
const mistTexture = r => r.texture((g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, 128);

export class TitleScene {
  constructor(r) {
    this.r = r; this.root = new T.Group(); this.background = sky(r);
    const R = this.root, statics = new T.Group(); R.add(statics);
    const ball = (c, p, s) => r.mesh(statics, 'ball', c, p, Array.isArray(s) ? s : [s, s, s]);
    // Suelo, colinas cercanas, montañas lejanas azuladas por la bruma.
    r.mesh(statics, 'box', '#8fcd68', [0, -.1, -12], [90, .2, 70]).castShadow = false;
    for (const [x, z, w, d, c] of [[-10, -7, 7, 4, '#9ad674'], [11, -9, 8, 5, '#8cc866'], [-1, -17, 13, 6, '#9ccf72'], [-7, 4, 4, 3, '#94d06c']]) ball(c, [x, -1.3, z], [w, 1.7, d]);
    for (const [x, y, z, w, h, c] of [[-16, -4, -30, 17, 9, '#a6b8c8'], [11, -5, -33, 19, 10, '#b4bed0'], [-3, -8, -46, 36, 15, '#c8c4d6'], [24, -6, -42, 15, 11, '#cfc6d6']]) ball(c, [x, y, z], [w, h, 6]);
    // Sol bajo detrás de las iniciales, con halo; nubes rosadas encendidas por debajo.
    this.sun = new T.Group(); R.add(this.sun);
    r.mesh(this.sun, 'ball', r.mat('#fff6d6', { emissive: '#ffe8b0', emissiveIntensity: 2.4 }), [0, 0, 0], [2.2, 2.2, 2.2]);
    this.glowMap = r.texture((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(.25, 'rgba(255,214,150,.55)'); gr.addColorStop(.6, 'rgba(255,190,140,.16)'); gr.addColorStop(1, 'rgba(255,180,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 128);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: this.glowMap, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    halo.scale.set(20, 20, 1); halo.userData.ownedMaterial = true; this.sun.add(halo);
    const cloud = r.mat('#ffe6e8', { emissive: '#ffb8a8', emissiveIntensity: .42, roughness: .9 });
    for (const [x, y, z, s] of [[-14, 10, -34, 1.2], [-5, 13, -37, 1], [13, 11.5, -33, 1.3], [21, 15, -39, .9], [3, 16, -40, .8]]) {
      for (const [dx, dy, w] of [[0, 0, 2.6], [1.8, .3, 1.9], [-1.9, -.1, 1.7], [.6, .9, 1.6]]) r.mesh(statics, 'ball', cloud, [x + dx * s, y + dy * s, z], [w * s, w * .5 * s, 1]);
    }
    // Lago Espejo con orilla y destellos del sol.
    r.mesh(statics, 'cylinder', '#f2e2b0', [-.5, .015, -7], [9.4, .03, 3.9]).castShadow = false;
    r.mesh(statics, 'cylinder', r.mat('#9ad6ee', { roughness: .06, metalness: .3, emissive: '#f0b0a0', emissiveIntensity: .14 }), [-.5, .04, -7], [8.8, .03, 3.4]).castShadow = false;
    const glint = r.mat('#ffffff', { emissive: '#ffe6c0', emissiveIntensity: 1.1 });
    for (let i = 0; i < 16; i++) r.mesh(statics, 'ball', glint, [-6 + (i * 37 % 140) / 10, .06, -9.6 + (i * 53 % 50) / 10], [.35 + (i % 3) * .12, .01, .03]);
    // Árboles redondos alrededor del lago.
    const tree = (x, z, s) => {
      r.mesh(statics, 'cylinder', '#8c6745', [x, .55 * s, z], [.17 * s, 1.1 * s, .17 * s]);
      ball('#58a755', [x, 1.5 * s, z], [.82 * s, .72 * s, .78 * s]); ball('#6bbd62', [x - .38 * s, 1.32 * s, z + .2 * s], [.52 * s, .46 * s, .5 * s]); ball('#4f9a4c', [x + .4 * s, 1.28 * s, z - .1 * s], [.54 * s, .46 * s, .5 * s]);
      ball('#82cf72', [x - .15 * s, 1.9 * s, z + .15 * s], [.34 * s, .22 * s, .3 * s]);
    };
    for (const [x, z, s] of [[-11.5, -1.5, 1.4], [-9.6, -10.5, 1.2], [-4.4, -12.8, 1], [1.4, -13.8, 1], [6, -12.4, 1.1], [11.4, -5.5, 1.3], [12.6, -10, 1.1], [-13, -9, 1.4], [14, -14, 1.4], [8.6, -15.5, 1]]) tree(x, z, s);
    // Lomita donde posan las iniciales (se acomoda en layout) y flores alrededor.
    this.knoll = new T.Group(); R.add(this.knoll);
    r.mesh(this.knoll, 'ball', '#95d36e', [0, -.42, 0], [2.6, .55, 1.7]).castShadow = false;
    r.mesh(this.knoll, 'ball', '#a3da78', [-.4, -.36, -.2], [1.6, .46, 1.2]).castShadow = false;
    const petals = ['#f4a3b8', '#ffe07a', '#ffffff', '#c9a8f0', '#ff9f80'];
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996, rr = 1.4 + (i % 7) * .16, x = Math.cos(a) * rr * 1.45, z = Math.sin(a) * rr * .95;
      r.mesh(this.knoll, 'cone', '#5aa84a', [x, .05, z], [.05, .12, .05]); for (let j = 0; j < 4; j++) r.mesh(this.knoll, 'ball', petals[i % 5], [x + Math.cos(j * 1.57) * .035, .12, z + Math.sin(j * 1.57) * .035], [.032, .018, .032]); r.mesh(this.knoll, 'ball', '#ffe07a', [x, .13, z], [.02, .015, .02]);
    }
    // Matas y pasto alto en primer plano para dar profundidad.
    for (const [x, z, s] of [[3.6, 1.6, .5], [-3.2, .4, .42], [4.2, -.6, .36], [-2.6, -1.2, .34]]) { r.mesh(this.knoll, 'ball', '#5fae4e', [x, .2 * s, z], [.9 * s, .7 * s, .8 * s]); r.mesh(this.knoll, 'ball', '#72c25c', [x - .35 * s, .28 * s, z + .2 * s], [.55 * s, .5 * s, .5 * s]); r.mesh(this.knoll, 'ball', '#4f9a46', [x + .4 * s, .22 * s, z - .1 * s], [.6 * s, .45 * s, .55 * s]); }
    for (let i = 0; i < 26; i++) { const a = i * 2.39996, rr = 1.3 + (i % 9) * .3, x = Math.cos(a) * rr * 1.6, z = Math.sin(a) * rr * .9; for (const l of [-.35, 0, .35]) { const m = r.mesh(this.knoll, 'cone', i % 3 ? '#7cc85c' : '#68b84e', [x + l * .06, .06, z], [.024, .13 + (i % 3) * .03, .024]); m.rotation.z = -l; } }
    r.batch(this.knoll);
    r.batch(statics);
    // Casa del protagonista (techo rojo) al fondo, junto al lago.
    this.house = building(r, { kind: 'house', w: 4, h: 4, opt: { roof: '#d8504a', chimney: true, doorCol: 2 } });
    r.batch(this.house); R.add(this.house);
    // Bruma que flota sobre el agua y entre las colinas.
    this.mistMap = mistTexture(r); this.mist = [];
    for (const [x, y, z, w, h, o, c] of [[-4, .55, -6.5, 18, 1.8, .42, '#fff6f2'], [5, .9, -9.5, 22, 2.2, .34, '#fff0ec'], [-2, 1.5, -15, 30, 3, .26, '#f8eef4'], [9, 2.2, -22, 32, 3.6, .22, '#f6eef6'], [-12, .9, -4, 12, 1.6, .3, '#fff8f2']]) {
      const m = new T.Mesh(r.geometries.plane, new T.MeshBasicMaterial({ map: this.mistMap, color: c, transparent: true, opacity: o, depthWrite: false, fog: false }));
      m.position.set(x, y, z); m.scale.set(w, h, 1); m.userData.ownedMaterial = true; m.renderOrder = 2; R.add(m); this.mist.push({ m, x });
    }
    // Motas de luz que suben despacio (polen al amanecer).
    this.motes = [];
    const moteMat = new T.SpriteMaterial({ map: this.glowMap, color: '#fff2c8', transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    for (let i = 0; i < 34; i++) {
      const s = new T.Sprite(moteMat); s.scale.setScalar(.07 + (i % 4) * .025); R.add(s);
      this.motes.push({ s, x: -5 + (i * 47 % 140) / 10, z: -2 + (i * 31 % 50) / 10, ph: (i * .137) % 1, sp: .05 + (i % 5) * .012 });
    }
    this.motes[0].s.userData.ownedMaterial = true;
    // Protagonista y las tres iniciales: Brotelo, Brasín y Charquín.
    this.player = character(r, 'player'); R.add(this.player.root);
    this.starters = ['brotelo', 'brasin', 'charquin'].map(sp => { const c = creature(r, sp); R.add(c.root); return c; });
    this.layout(16 / 9);
  }
  // Rehace al protagonista con el avatar actual (el editor lo llama en cada cambio).
  setPlayer() {
    const old = this.player; this.player = character(this.r, 'player'); this.root.add(this.player.root);
    if (old) { this.player.root.visible = old.root.visible; detachHero(old); this.r.release(old.root); }
    if (this.aspect) { const a = this.aspect; this.aspect = 0; this.layout(a); }
  }
  // Acomoda la escena según la forma de la pantalla (horizontal o vertical).
  layout(aspect) {
    if (this.aspect === aspect) return; this.aspect = aspect;
    const portrait = aspect < 1;
    // Horizontal: las iniciales a la derecha del cuadro (el menú y el logo quedan a la izquierda).
    // Vertical: las iniciales al centro, entre el logo de arriba y el menú de abajo.
    this.view = portrait ? { fov: 46, pos: [0, 1.95, 9.2], look: [0, 1.15, 0] } : { fov: 28, pos: [-1.5, 1.85, 10.6], look: [.55, .98, 0] };
    const k = portrait ? [0, 1.25] : [2.25, 1.0];
    this.knoll.position.set(k[0], 0, k[1]);
    const spots = portrait ? [[-1.0, -.25], [0, .35], [1.0, -.25]] : [[-1.2, -.15], [0, .32], [1.2, -.2]];
    this.starters.forEach((c, i) => {
      c.root.position.set(k[0] + spots[i][0], .1, k[1] + spots[i][1]);
      c.root.rotation.y = portrait ? (1 - i) * .28 : (1 - i) * .3 - .3;
      c.root.scale.setScalar(1);
    });
    this.house.position.set(portrait ? -6 : -11.5, 0, portrait ? -9 : -13);
    this.sun.position.set(portrait ? 3 : 7.5, portrait ? 6.5 : 6.8, -40);
    this.player.root.visible = !portrait; this.playerSpot = { x: k[0] - 2.15, z: k[1] - .55 };
  }
  update(camera, aspect, t, dt) {
    this.layout(aspect);
    const v = this.view;
    camera.fov = v.fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    camera.position.set(v.pos[0] + Math.sin(t * .13) * .35, v.pos[1] + Math.sin(t * .09) * .08, v.pos[2]);
    camera.lookAt(v.look[0] + Math.sin(t * .13) * .12, v.look[1], v.look[2]);
    // Iniciales: respiran, se mecen, parpadean y mueven su fuego, sus hojas y su agua.
    this.starters.forEach((c, i) => {
      c.model.position.y = Math.abs(Math.sin(t * 2.2 + i * 1.7)) * .05;
      c.model.rotation.y = Math.sin(t * .8 + i) * .1;
      c.blinkAt = c.blinkAt ?? t + 1 + i; if (t > c.blinkAt + .14) c.blinkAt = t + 2.2 + Math.random() * 2.5;
      for (const e of c.eyes) e.scale.y = t > c.blinkAt ? .12 : 1;
      animateCreature(c.model, t, dt);
    });
    for (const { m, x } of this.mist) m.position.x = x + Math.sin(t * .05 + x) * 1.6;
    for (const p of this.motes) { const u = (t * p.sp + p.ph) % 1; p.s.position.set(p.x + Math.sin(t * .6 + p.ph * 9) * .3, .1 + u * 2.6, p.z); p.s.material.opacity = 1; p.s.visible = u > .04 && u < .96; }
    if (this.player.root.visible) { animatePerson(this.player, this.playerSpot, { dir: 0, moving: null }, t, dt, false); this.player.root.rotation.y = .45; this.player.head.rotation.x = -.04; }
  }
  dispose() { detachHero(this.player); this.r.release(this.root); for (const t of [this.background, this.glowMap, this.mistMap]) { this.r.textures.delete(t); t.dispose(); } }
}
