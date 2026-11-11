// Ambiente del mundo: partículas según el lugar y la hora (polen y pétalos de día, luciérnagas de noche,
// nieve en el nevado, arena en el desierto, chispas en el volcán, jirones de niebla) y sombras de nubes
// que pasan despacio sobre el suelo. Todo se mueve en el shader: no cuesta nada por partícula.
import * as T from 'three';

const KINDS = {
  pollen: { vel: [.22, .04, .1], color: '#fff6cf', size: .075, alpha: .7, sway: .5, h: 4 },
  petals: { vel: [.55, -.32, .2], color: '#ffd3e0', size: .12, alpha: .85, sway: .9, h: 5 },
  leaves: { vel: [.45, -.28, .25], color: '#bfe38a', size: .12, alpha: .8, sway: 1, h: 5 },
  fireflies: { vel: [.07, .02, .05], color: '#dcff8c', size: .16, alpha: 1, sway: 1.3, h: 2.2, add: true, flicker: 1 },
  snow: { vel: [.35, -1.1, .12], color: '#ffffff', size: .11, alpha: .92, sway: .6, h: 7 },
  sand: { vel: [3.4, -.04, .6], color: '#f6e2ac', size: .065, alpha: .55, sway: .2, h: 2.4 },
  embers: { vel: [.22, .85, .1], color: '#ffa548', size: .1, alpha: 1, sway: .7, h: 5, add: true, flicker: .6 },
  mist: { vel: [.28, 0, .06], color: '#ffffff', size: 1.5, alpha: .085, sway: .3, h: 1.5 }
};
const COUNT = 220, BOX = 30;

function layer() {
  const seeds = new Float32Array(COUNT * 3);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(seeds, 3));
  const mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, center: { value: new T.Vector3() }, vel: { value: new T.Vector3() }, box: { value: new T.Vector3(BOX, 4, BOX) },
      size: { value: .1 }, sway: { value: .5 }, flicker: { value: 0 }, color: { value: new T.Color() }, alpha: { value: 1 }, scale: { value: 600 } },
    vertexShader: `uniform float time, size, sway, flicker, alpha, scale; uniform vec3 center, vel, box; varying float vA;
      void main(){ vec3 q = position * box + vel * time;
        q.x += sin(time * .7 + position.y * 40.) * sway; q.z += cos(time * .6 + position.x * 40.) * sway;
        q.xz = mod(q.xz - center.xz + box.xz * .5, box.xz) - box.xz * .5 + center.xz; q.y = mod(q.y, box.y) + .15;
        vec4 mv = viewMatrix * vec4(q, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = size * scale / -mv.z;
        float edge = smoothstep(0., .12, q.y / box.y) * smoothstep(1., .8, q.y / box.y);
        vA = alpha * edge * mix(1., .5 + .5 * sin(time * 3. + position.x * 90.), flicker); }`,
    fragmentShader: `uniform vec3 color; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .12, d) * vA; if (a < .004) discard; gl_FragColor = vec4(color, a);
        #include <colorspace_fragment>
      }`
  });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false; return pts;
}

export class Ambient {
  constructor(parent) {
    this.layers = [layer(), layer()]; parent.add(...this.layers); this.kinds = ['', ''];
    // Sombras de nubes: manchas suaves que se repiten y se deslizan con el viento.
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const blobs = [[60, 70, 62], [190, 50, 48], [130, 170, 70], [30, 200, 44], [220, 210, 52]];
    for (const [x, y, r] of blobs) for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256], [256, 256], [-256, -256], [256, -256], [-256, 256]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, r * .15, x + dx, y + dy, r);
      gr.addColorStop(0, 'rgba(20,34,52,.55)'); gr.addColorStop(.6, 'rgba(20,34,52,.3)'); gr.addColorStop(1, 'rgba(20,34,52,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    }
    this.cloudTex = new T.CanvasTexture(c); this.cloudTex.wrapS = this.cloudTex.wrapT = T.RepeatWrapping; this.cloudTex.colorSpace = T.SRGBColorSpace;
    this.clouds = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshBasicMaterial({ map: this.cloudTex, transparent: true, opacity: .34, depthWrite: false }));
    this.clouds.rotation.x = -Math.PI / 2; this.clouds.renderOrder = 2; this.clouds.visible = false; parent.add(this.clouds);
  }
  // Qué partículas tocan en este mapa a esta hora.
  static pick(map, night) {
    if (!map.outdoor || map.dark) return ['', ''];
    if (map.snow) return ['snow', ''];
    if (map.biome === 'desert') return ['sand', night ? 'fireflies' : ''];
    if (map.biome === 'volcano') return ['embers', ''];
    if (map.mist) return ['mist', night ? 'fireflies' : 'pollen'];
    if (night) return ['fireflies', ''];
    if (map.biome === 'jungle') return ['leaves', 'pollen'];
    return ['pollen', map.paved ? '' : 'petals'];
  }
  update(map, night, focus, time, pixelHeight, fovScale, amount) {
    const kinds = Ambient.pick(map, night);
    this.layers.forEach((pts, i) => {
      const k = KINDS[kinds[i]]; pts.visible = !!k; if (!k) return;
      const u = pts.material.uniforms;
      if (this.kinds[i] !== kinds[i]) {
        this.kinds[i] = kinds[i]; u.vel.value.set(...k.vel); u.box.value.set(BOX, k.h, BOX); u.size.value = k.size; u.sway.value = k.sway;
        u.flicker.value = k.flicker || 0; u.color.value.set(k.color); u.alpha.value = k.alpha;
        pts.material.blending = k.add ? T.AdditiveBlending : T.NormalBlending; pts.material.needsUpdate = true;
      }
      u.time.value = time; u.center.value.copy(focus); u.scale.value = pixelHeight * fovScale;
      pts.geometry.setDrawRange(0, Math.max(20, Math.min(COUNT, Math.round(COUNT * amount * (kinds[i] === 'mist' ? .35 : kinds[i] === 'fireflies' ? .5 : 1)))));
    });
    const sunny = map.outdoor && !night && !map.dark && !map.mist && map.biome !== 'volcano';
    this.clouds.visible = sunny;
    if (sunny) {
      this.clouds.position.set(focus.x, .11, focus.z);
      this.cloudTex.repeat.set(90 / 34, 90 / 34);
      this.cloudTex.offset.set(focus.x / 34 - time * .012, -focus.z / 34 + time * .006);
    }
  }
  hide() { this.layers.forEach(p => p.visible = false); this.clouds.visible = false; }
  dispose() { this.layers.forEach(p => { p.geometry.dispose(); p.material.dispose(); }); this.clouds.geometry.dispose(); this.clouds.material.dispose(); this.cloudTex.dispose(); }
}
