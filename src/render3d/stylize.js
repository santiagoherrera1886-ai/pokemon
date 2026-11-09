// Estilo visual del modo 3D (tipo maqueta brillante): materiales suaves y satinados, resplandor (bloom)
// en zonas claras, gradación cálida de clave alta, viñeta suave y un leve desenfoque en los bordes.
// Un contorno de tinta opcional queda disponible pero apagado por defecto.
import * as T from 'three';

// Material satinado: color limpio, brillo suave. Acepta las mismas opciones que MeshStandardMaterial.
export function softMaterial(options = {}) {
  const { roughness = .94, metalness = 0, flatShading = true, ...rest } = options;
  return new T.MeshStandardMaterial({ roughness, metalness, flatShading, ...rest });
}
export const toonMaterial = softMaterial; // nombre anterior, para no romper importaciones

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

// Extrae lo brillante a media resolución.
const BRIGHT = `uniform sampler2D tColor; uniform float threshold; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tColor, vUv).rgb; float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(threshold, threshold + .35, l), 1.); }`;
// Desenfoque gaussiano separable de 9 muestras.
const BLUR = `uniform sampler2D tColor; uniform vec2 dir; varying vec2 vUv;
  void main(){ vec3 s = texture2D(tColor, vUv).rgb * .2270270;
  s += texture2D(tColor, vUv + dir * 1.3846153).rgb * .3162162; s += texture2D(tColor, vUv - dir * 1.3846153).rgb * .3162162;
  s += texture2D(tColor, vUv + dir * 3.2307692).rgb * .0702702; s += texture2D(tColor, vUv - dir * 3.2307692).rgb * .0702702;
  gl_FragColor = vec4(s, 1.); }`;

const FRAG = `
  uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tBloom; uniform vec2 texel;
  uniform float focusY; uniform float tilt; uniform float ink; uniform vec3 grade; uniform float night; uniform float sat;
  uniform float bloom; uniform float lift; uniform float near; uniform float far; uniform float retro;
  varying vec2 vUv;
  float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
  float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
  void main(){
    vec2 sampledUV = vUv;
    if(retro > .5){ vec2 cell = texel * 2.0; sampledUV = (floor(vUv / cell) + .5) * cell; }
    vec3 col = texture2D(tColor, sampledUV).rgb;
    float d = abs(vUv.y - focusY);
    float blur = smoothstep(.26, .7, d) * tilt;
    if (blur > .01) {
      vec3 acc = col; float w = 1.;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398;
        vec2 o = vec2(cos(a), sin(a)) * texel * (1.5 + 2.5 * blur);
        acc += texture2D(tColor, vUv + o).rgb + texture2D(tColor, vUv + o * 2.).rgb * .6; w += 1.6;
      }
      col = mix(col, acc / w, blur);
    }
    if (ink > .001) {
      vec2 t2 = texel * 1.5; float dc = lin(texture2D(tDepth, vUv).x);
      float e = max(max(abs(lin(texture2D(tDepth, vUv - vec2(t2.x,0.)).x) - dc), abs(lin(texture2D(tDepth, vUv + vec2(t2.x,0.)).x) - dc)),
                    max(abs(lin(texture2D(tDepth, vUv + vec2(0.,t2.y)).x) - dc), abs(lin(texture2D(tDepth, vUv - vec2(0.,t2.y)).x) - dc)));
      col = mix(col, col * vec3(.2, .18, .26), smoothstep(.25, .6, e) * ink);
    }
    col += texture2D(tBloom, vUv).rgb * bloom;
    // Clave alta: levanta las sombras un poco (luz rebotada) y aplica tinte y saturación.
    col = col + lift * (1. - col) * .35;
    col = (col - .5) * 1.08 + .5;
    float L = lum(col);
    col = mix(vec3(L), col, sat);
    col *= grade;
    col = mix(col, col * vec3(.55, .62, .95) + vec3(.0, .01, .04), night);
    if(retro > .5){
      float bayer = mod(floor(vUv.x / texel.x) + 2.0 * floor(vUv.y / texel.y), 4.0);
      col = clamp(floor(clamp(col, 0., 1.) * 26.0 + bayer * .16) / 26.0, 0., 1.);
    }
    vec2 v = vUv - .5; col *= 1. - dot(v, v) * .36;
    gl_FragColor = vec4(col, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const pass = (frag, uniforms, toned = false) => {
  const m = new T.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
  m.toneMapped = toned; return m;
};

export class Stylizer {
  constructor(webgl) {
    this.webgl = webgl;
    this.target = null;
    this.mat = pass(FRAG, {
      tColor: { value: null }, tDepth: { value: null }, tBloom: { value: null }, texel: { value: new T.Vector2() },
      near: { value: .5 }, far: { value: 160 }, focusY: { value: .5 }, tilt: { value: .4 }, ink: { value: 0 },
      grade: { value: new T.Vector3(1.04, 1.0, .95) }, night: { value: 0 }, sat: { value: 1.1 }, bloom: { value: .55 }, lift: { value: .25 }, retro: {value: 1}
    }, true);
    this.bright = pass(BRIGHT, { tColor: { value: null }, threshold: { value: 1.05 } });
    this.blur = pass(BLUR, { tColor: { value: null }, dir: { value: new T.Vector2() } });
    this.quad = new T.Mesh(new T.PlaneGeometry(2, 2), this.mat);
    this.quad.frustumCulled = false;
    this.scene = new T.Scene(); this.scene.add(this.quad);
    this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  setSize(w, h) {
    if (this.target && this.target.width === w && this.target.height === h) return;
    this.w = w; this.h = h;
    this.target?.dispose(); this.bloomA?.dispose(); this.bloomB?.dispose();
    this.target = new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: this.samples ?? 4 });
    this.target.depthTexture = new T.DepthTexture(w, h);
    this.target.depthTexture.type = T.UnsignedIntType;
    const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
    this.bloomA = new T.WebGLRenderTarget(bw, bh, { type: T.HalfFloatType });
    this.bloomB = new T.WebGLRenderTarget(bw, bh, { type: T.HalfFloatType });
    this.bloomTexel = new T.Vector2(1 / bw, 1 / bh);
    this.mat.uniforms.texel.value.set(1 / w, 1 / h);
  }
  draw(material, target) { this.quad.material = material; this.webgl.setRenderTarget(target); this.webgl.render(this.scene, this.cam); }
  render(scene, camera, opts) {
    if (!this.target) { const w = this.w, h = this.h; this.w = 0; this.setSize(w, h); }
    const u = this.mat.uniforms;
    u.near.value = camera.near; u.far.value = camera.far;
    u.focusY.value = opts.focusY ?? .5; u.tilt.value = (opts.tilt ?? .4) * .48; u.ink.value = opts.ink ?? .26;
    u.night.value = opts.night ?? 0; u.sat.value = opts.sat ?? 1.1; u.bloom.value = opts.bloom ?? .55; u.lift.value = opts.lift ?? .25;
    u.retro.value = opts.retro ?? 1;
    if (opts.grade) u.grade.value.set(...opts.grade);
    this.webgl.setRenderTarget(this.target);
    this.webgl.render(scene, camera);
    if (!(opts.bloom > 0)) { u.tColor.value = this.target.texture; u.tDepth.value = this.target.depthTexture; u.bloom.value = 0; u.tBloom.value = this.target.texture; this.draw(this.mat, null); return; }
    // Bloom: brillo a 1/4 de resolución + dos desenfoques separables.
    this.bright.uniforms.tColor.value = this.target.texture; this.draw(this.bright, this.bloomA);
    for (let i = 0; i < 2; i++) {
      this.blur.uniforms.tColor.value = this.bloomA.texture; this.blur.uniforms.dir.value.set(this.bloomTexel.x * (1 + i), 0); this.draw(this.blur, this.bloomB);
      this.blur.uniforms.tColor.value = this.bloomB.texture; this.blur.uniforms.dir.value.set(0, this.bloomTexel.y * (1 + i)); this.draw(this.blur, this.bloomA);
    }
    u.tColor.value = this.target.texture; u.tDepth.value = this.target.depthTexture; u.tBloom.value = this.bloomA.texture;
    this.draw(this.mat, null);
  }
  dispose() { this.target?.dispose(); this.bloomA?.dispose(); this.bloomB?.dispose(); this.mat.dispose(); this.bright.dispose(); this.blur.dispose(); this.quad.geometry.dispose(); }
}
