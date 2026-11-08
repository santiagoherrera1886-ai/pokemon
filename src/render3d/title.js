// Pantalla de inicio en 3D: Pueblo Brisal al amanecer junto al Lago Espejo. Las tres iniciales esperan
// en el pasto, Espejalba flota sobre el lago, el sol sale detrás de las colinas y la cámara se mece despacio.
// Se arma una sola vez al entrar al título y se libera al empezar a jugar.
import * as T from 'three';
import { creature, character } from './actors.js';
import { animatePerson } from './people.js';
import { building } from './models.js';

const sky = r => r.texture((g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s);
  gr.addColorStop(0, '#7fb2e6'); gr.addColorStop(.38, '#c7c9e6'); gr.addColorStop(.56, '#f6c7ae'); gr.addColorStop(.7, '#ffdcae'); gr.addColorStop(1, '#fff1cf');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, 256);

export class TitleScene {
  constructor(r) {
    this.r = r; this.root = new T.Group(); this.background = sky(r);
    const R = this.root, statics = new T.Group(); R.add(statics);
    const ball = (c, p, s) => r.mesh(statics, 'ball', c, p, Array.isArray(s) ? s : [s, s, s]);
    // Suelo, colinas lejanas y montañas con bruma
    r.mesh(statics, 'box', '#9fd47a', [0, -.1, -12], [90, .2, 70]).castShadow = false;
    for (const [x, z, w, d, c] of [[-9, -6, 6, 4, '#a7d980'], [10, -8, 7, 5, '#98cc72'], [-2, -16, 12, 6, '#a4d27e'], [6, 6, 5, 3, '#a2d67c']]) ball(c, [x, -1.3, z], [w, 1.6, d]);
    for (const [x, y, z, w, h, c] of [[-14, -4, -30, 16, 8, '#a8c9a6'], [10, -5, -32, 18, 9, '#b4cfaa'], [-2, -8, -44, 34, 14, '#c6d0d8'], [20, -6, -40, 14, 10, '#c9d2dc']]) ball(c, [x, y, z], [w, h, 6]);
    // Sol saliendo con halo (el bloom lo hace brillar); se acomoda en layout(). Nubes rosadas.
    this.sun = new T.Group(); R.add(this.sun);
    r.mesh(this.sun, 'ball', r.mat('#fff6d6', { emissive: '#ffe8b0', emissiveIntensity: 2.4 }), [0, 0, 0], [2.4, 2.4, 2.4]);
    this.glowMap = r.texture((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(.25, 'rgba(255,214,150,.55)'); gr.addColorStop(.6, 'rgba(255,190,140,.16)'); gr.addColorStop(1, 'rgba(255,180,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 128);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: this.glowMap, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    halo.scale.set(16, 16, 1); halo.userData.ownedMaterial = true; this.sun.add(halo);
    const cloud = r.mat('#fff2ee', { emissive: '#ffd9cc', emissiveIntensity: .35, roughness: .9 });
    for (const [x, y, z, s] of [[-12, 10, -34, 1.2], [-4, 12.5, -36, 1], [12, 11, -33, 1.3], [18, 14, -38, .9]]) {
      for (const [dx, dy, w] of [[0, 0, 2.6], [1.8, .3, 1.9], [-1.9, -.1, 1.7], [.6, .9, 1.6]]) r.mesh(statics, 'ball', cloud, [x + dx * s, y + dy * s, z], [w * s, w * .55 * s, 1]);
    }
    // Lago Espejo con orilla de arena y destellos
    r.mesh(statics, 'cylinder', '#f2e2b0', [-.6, .015, -7.6], [8.2, .03, 3.7]).castShadow = false;
    r.mesh(statics, 'cylinder', r.mat('#8fd8ee', { roughness: .08, metalness: .25, emissive: '#5aaed0', emissiveIntensity: .18 }), [-.6, .04, -7.6], [7.6, .03, 3.2]).castShadow = false;
    const glint = r.mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: .9 });
    for (let i = 0; i < 14; i++) r.mesh(statics, 'ball', glint, [-6 + (i * 37 % 120) / 10, .06, -9.8 + (i * 53 % 50) / 10], [.35 + (i % 3) * .1, .01, .03]);
    // Árboles redondos alrededor
    const tree = (x, z, s) => {
      r.mesh(statics, 'cylinder', '#8c6745', [x, .55 * s, z], [.17 * s, 1.1 * s, .17 * s]);
      ball('#58a755', [x, 1.5 * s, z], [.82 * s, .72 * s, .78 * s]); ball('#6bbd62', [x - .38 * s, 1.32 * s, z + .2 * s], [.52 * s, .46 * s, .5 * s]); ball('#4f9a4c', [x + .4 * s, 1.28 * s, z - .1 * s], [.54 * s, .46 * s, .5 * s]);
      ball('#82cf72', [x - .15 * s, 1.9 * s, z + .15 * s], [.34 * s, .22 * s, .3 * s]);
    };
    for (const [x, z, s] of [[-10.4, .5, 1.3], [-9.6, -6.5, 1.2], [-6.6, -9.6, 1], [-3, -13.5, .9], [1.5, -14, 1], [5.5, -12.6, 1.1], [10.2, -3.5, 1.3], [9.4, 1.2, 1.2], [11, -8.5, 1.1], [-11, -11, 1.4], [13, -12, 1.4]]) tree(x, z, s);
    // Flores en el pasto de adelante
    const petals = ['#f4a3b8', '#ffe07a', '#ffffff', '#c9a8f0', '#ff9f80'];
    for (let i = 0; i < 46; i++) {
      const x = -8 + (i * 71 % 160) / 10, z = 1.5 + (i * 29 % 45) / 10;
      if ((x > -5 && x < -1.4 && z < 2.4) || (Math.abs(x) < 1.6 && z > 3) || Math.abs(x + 4.9) < .7) continue;
      ball('#5aa84a', [x, .05, z], [.09, .05, .09]); ball(petals[i % 5], [x, .12, z], [.075, .05, .075]);
    }
    r.batch(statics);
    // Casa del protagonista (techo rojo) con su caminito de arena
    this.house = building(r, { kind: 'house', w: 4, h: 4, opt: { roof: '#d8504a', chimney: true, doorCol: 2 } });
    r.mesh(this.house, 'box', '#f0dcae', [2.5, .012, 5.6], [1.1, .02, 4.4]).castShadow = false;
    r.batch(this.house); R.add(this.house);
    // Protagonista, las tres iniciales y Espejalba
    this.player = character(r, 'player'); R.add(this.player.root);
    this.starters = ['brotelo', 'charquin', 'brasin'].map(sp => { const c = creature(r, sp); R.add(c.root); return c; });
    this.legend = creature(r, 'espejalba'); R.add(this.legend.root); this.legend.root.scale.setScalar(1.5);
    this.layout(16 / 9);
  }
  // Acomoda la escena según la forma de la pantalla (horizontal o vertical).
  layout(aspect) {
    if (this.aspect === aspect) return; this.aspect = aspect;
    // Horizontal: casa e iniciales a la izquierda, Espejalba a contraluz con el sol a la derecha, menú abajo al centro.
    // Vertical: logo arriba, Espejalba y la casa en el medio, iniciales en fila sobre el menú.
    const portrait = aspect < 1;
    this.view = portrait ? { fov: 52, pos: [0, 3.7, 13.5], look: [0, 1.9, 0] } : { fov: 40, pos: [0, 3.0, 10.5], look: [0, 1.55, -1] };
    const spots = portrait ? [[-1.2, 3.4], [0, 3.8], [1.2, 3.4]] : [[-4.4, 1.6], [-3.2, 2.0], [-2.0, 1.6]];
    this.starters.forEach((c, i) => { c.root.position.set(spots[i][0], 0, spots[i][1]); c.root.rotation.y = portrait ? (i - 1) * -.2 : .35; });
    this.legend.root.position.set(portrait ? 1.0 : 5.5, 0, portrait ? -4.5 : -5);
    this.legendY = portrait ? 2.0 : 1.0;
    this.house.position.set(portrait ? -4.2 : -7.4, 0, portrait ? -6.2 : -3.4);
    this.sun.position.set(portrait ? 9 : 22.6, portrait ? 9 : 3.4, -38);
    this.player.root.visible = !portrait; this.playerSpot = { x: 2.6, z: 3.4 };
  }
  update(camera, aspect, t, dt) {
    this.layout(aspect);
    const v = this.view;
    camera.fov = v.fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    camera.position.set(v.pos[0] + Math.sin(t * .13) * .55, v.pos[1] + Math.sin(t * .09) * .12, v.pos[2]);
    camera.lookAt(v.look[0] + Math.sin(t * .13) * .2, v.look[1], v.look[2]);
    // Iniciales: respiran, se mecen y parpadean; Espejalba flota sobre el lago.
    this.starters.forEach((c, i) => {
      c.model.position.y = Math.abs(Math.sin(t * 2.2 + i * 1.7)) * .06;
      c.model.rotation.y = Math.sin(t * .8 + i) * .12;
      c.blinkAt = c.blinkAt ?? t + 1 + i; if (t > c.blinkAt + .14) c.blinkAt = t + 2.2 + Math.random() * 2.5;
      for (const e of c.eyes) e.scale.y = t > c.blinkAt ? .12 : 1;
    });
    const L = this.legend; L.model.position.y = this.legendY + Math.sin(t * 1.1) * .14; L.model.rotation.y = -.3 + Math.sin(t * .4) * .15; L.model.rotation.z = Math.sin(t * .9) * .05;
    if (this.player.root.visible) { animatePerson(this.player, this.playerSpot, { dir: 0, moving: null }, t, dt, false); this.player.root.rotation.y = -.45; this.player.head.rotation.x = -.04; }
  }
  dispose() { this.r.release(this.root); for (const t of [this.background, this.glowMap]) { this.r.textures.delete(t); t.dispose(); } }
}
