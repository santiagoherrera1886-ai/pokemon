// Protagonista en GLB: el prototipo técnico del paquete "Puchamon Base 3D" (assets/models/player.glb).
// Es opcional (Opciones → Protagonista 3D) y viene apagado: el paquete pide revisión visual antes de
// reemplazar al protagonista en producción. Se carga una sola vez y cada instancia se clona con su
// esqueleto y se anima con sus clips (Idle, Walk, Run, Talk). Mientras carga, o si falla, se ve el
// protagonista esculpido. No se mezcla con la animación paramétrica: cuando el GLB está listo, el muñeco
// esculpido se oculta y sólo se aprovecha su raíz (posición y giro que manda el juego).
// Adaptado del puente incluido en el paquete (player-bridge.js y puchamon-assets.js, Three.js r180).
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

export const HERO_URL = new URL('../../assets/models/player.glb', import.meta.url).href;
export const HERO_HEIGHT = 1.46;
let request = null;

export function loadHero() {
  if (!request) {
    request = new GLTFLoader().loadAsync(HERO_URL).then(gltf => {
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        for (const m of [].concat(o.material)) {
          for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (m[k]) m[k].anisotropy = 4;
          // Igual que los muñecos esculpidos: un poco de luz propia para que la cara se lea con el sol de atrás.
          if (m.map && m.emissive) { m.emissive.set('#ffffff'); m.emissiveMap = m.map; m.emissiveIntensity = .2; }
        }
      });
      return gltf;
    }).catch(error => { request = null; throw error; });
  }
  return request;
}

function play(ctrl, name, fade = .18) {
  const next = ctrl.actions.get(name);
  if (!next || ctrl.action === next) return;
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).setLoop(T.LoopRepeat, Infinity).play();
  if (ctrl.action && fade > 0) next.crossFadeFrom(ctrl.action, fade, false); else ctrl.action?.stop();
  ctrl.action = next;
}

// Monta el GLB sobre un muñeco de people.js. El muñeco sigue visible hasta que el modelo esté listo.
export function attachHero(rig, { height = HERO_HEIGHT } = {}) {
  if (rig.hero) return rig.hero;
  const state = rig.hero = { ctrl: null, disposed: false, failed: false };
  loadHero().then(gltf => {
    if (state.disposed) return;
    const model = cloneSkeleton(gltf.scene), holder = new T.Group();
    holder.name = 'PuchamonHeroGLB'; holder.add(model);
    const box = new T.Box3().setFromObject(model), size = box.getSize(new T.Vector3()), k = height / Math.max(.001, size.y);
    model.scale.setScalar(k); model.position.set(0, -box.min.y * k, 0);
    rig.root.add(holder);
    for (const part of [rig.body, rig.head, ...rig.limbs]) part.visible = false;
    const mixer = new T.AnimationMixer(model);
    state.ctrl = { holder, model, mixer, actions: new Map(gltf.animations.map(c => [c.name, mixer.clipAction(c)])), action: null };
    play(state.ctrl, 'Idle', 0);
  }).catch(error => {
    state.failed = true;
    console.warn('Puchamon: el protagonista GLB no cargó; se queda el esculpido.', error.message);
  });
  return state;
}

export function updateHero(rig, { moving = false, running = false, talking = false } = {}, dt = 0) {
  const ctrl = rig.hero?.ctrl;
  if (!ctrl) return;
  play(ctrl, moving ? (running ? 'Run' : 'Walk') : talking ? 'Talk' : 'Idle');
  if (Number.isFinite(dt) && dt >= 0) ctrl.mixer.update(Math.min(dt, .1));
}

// Antes de liberar el muñeco: detiene el mezclador y suelta el clon (la malla y las texturas del molde
// se comparten entre instancias y se quedan en memoria para la próxima vez).
export function detachHero(rig) {
  const state = rig?.hero;
  if (!state) return;
  state.disposed = true;
  const ctrl = state.ctrl;
  if (ctrl) { ctrl.mixer.stopAllAction(); ctrl.mixer.uncacheRoot(ctrl.model); ctrl.holder.removeFromParent(); }
  for (const part of [rig.body, rig.head, ...(rig.limbs || [])]) if (part) part.visible = true;
  rig.hero = null;
}
