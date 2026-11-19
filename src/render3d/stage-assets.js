// Modelos 3D de los escenarios de la Pelea hechos en Blender (roca en bloques, pasto, árboles, ruinas...).
// Se cargan una vez (comprimidos con meshopt) y se guardan para las siguientes peleas.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const URLS = {
  isla: new URL('../../assets/pelea/isla.glb', import.meta.url).href,
  volcan: new URL('../../assets/pelea/volcan.glb', import.meta.url).href,
  templo: new URL('../../assets/pelea/templo.glb', import.meta.url).href
};
const loading = new Map(), done = new Map();
export function loadStageModel(id) {
  if (!URLS[id]) return Promise.resolve(null);
  if (!loading.has(id)) {
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    loading.set(id, loader.loadAsync(URLS[id]).then(g => { done.set(id, g.scene); return g.scene; }, err => { console.warn('Puchamon: no cargó el escenario', id, err?.message); loading.delete(id); return null; }));
  }
  return loading.get(id);
}
export function stageModelNow(id) { return done.get(id) || null; }
