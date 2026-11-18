import * as T from 'three';
// Cámara inclinada y cercana, como en los juegos de bolsillo: se ven las caras y los frentes de las casas. Sin giro lateral: las calles se ven derechas.
// `h` es la altura visible (en casillas) a la distancia del foco; la distancia se calcula a partir del FOV.
const FOV = 28;
const PITCH = 38 * Math.PI / 180;
const PITCH_IN = 46 * Math.PI / 180;   // los cuartos pequeños se miran desde más arriba para que quepan completos
const TAN = Math.tan(FOV * Math.PI / 360);
const BATTLE_PITCH = 22 * Math.PI / 180, BATTLE_PITCH_TALL = 30 * Math.PI / 180;
const BATTLE_DIR = new T.Vector3(0, Math.sin(BATTLE_PITCH), Math.cos(BATTLE_PITCH));
const BATTLE_DIR_TALL = new T.Vector3(0, Math.sin(BATTLE_PITCH_TALL), Math.cos(BATTLE_PITCH_TALL));

// Alto visible afuera (en casillas). Más cerca que antes para que el protagonista y su pareja se vean grandes;
// en pantallas verticales (iPad parado, celular) se muestra un poco más de alto para no perder el camino.
export function outdoorHeight(aspect) { return aspect < 1 ? Math.min(12, 6 / aspect) : 6.3; }
// Encuadre del combate. En pantallas verticales las dos criaturas se ponen una más al fondo que la otra (menos
// ancho, más profundidad) para que se vean grandes; `k` escala los deslizamientos de entrada y el lanzamiento.
export function battleLayout(aspect) {
  if (aspect >= 1) return { tall: false, ally: [-2, 1.5], foe: [2, -1.8], k: 1 };
  return { tall: true, ally: [-1.05, 1.75], foe: [1.05, -2.1], k: .55 };
}
export function battleHeight(aspect) { return aspect < 1 ? Math.min(12, 5.2 / aspect) : 6.4; }

export class DioramaCamera {
  constructor() {
    this.camera = new T.PerspectiveCamera(FOV, 16 / 9, .5, 160);
    this.focus = new T.Vector3();
    this.dir = new T.Vector3(0, Math.sin(PITCH), Math.cos(PITCH));
    this.dirIn = new T.Vector3(0, Math.sin(PITCH_IN), Math.cos(PITCH_IN));
    this.offset = this.dir.clone().multiplyScalar(20);
    this.key = null; this.frames = new Map(); this.aspect = 16 / 9; this.distance = 20; this.target = new T.Vector3();
  }
  interiorFrame(map) {
    if (this.frames.has(map.id)) return this.frames.get(map.id);
    const right = new T.Vector3(1, 0, 0);
    const up = new T.Vector3().crossVectors(this.dirIn, right).normalize();
    const center = new T.Vector3(map.w / 2, .5, (map.h + 1.5) / 2);
    const points = [];
    for (const x of [-.3, map.w + .3]) {
      for (const z of [1.45, map.h + .3]) points.push(new T.Vector3(x, -.45, z));
      points.push(new T.Vector3(x, 2.4, 1.45));
    }
    const xs = points.map(p => p.clone().sub(center).dot(right));
    const ys = points.map(p => p.clone().sub(center).dot(up));
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    center.addScaledVector(right, (minX + maxX) / 2).addScaledVector(up, (minY + maxY) / 2);
    // Margen extra porque la perspectiva agranda lo que queda más cerca de la cámara.
    const frame = { target: center, width: (maxX - minX) * 1.14, height: (maxY - minY) * 1.14 };
    this.frames.set(map.id, frame); return frame;
  }
  update(map, position, dt, battle = false) {
    const follow = !battle && (map.outdoor || map.dark || map.h > 12);
    const key = battle ? 'battle' : map.outdoor ? 'outside' : map.id;
    const frame = !battle && !follow ? this.interiorFrame(map) : null;
    const a = this.aspect, tall = a < 1;
    let h = battle ? battleHeight(a) : follow ? outdoorHeight(a) : Math.max(frame.width / a, frame.height);
    // El zoom se suaviza dentro de una misma vista (por ejemplo al girar el iPad).
    if (this.key !== key || this.hCur === undefined) this.hCur = h; else this.hCur += (h - this.hCur) * (1 - Math.exp(-dt * 4));
    h = this.hCur;
    this.camera.aspect = a; this.camera.far = 160; this.camera.updateProjectionMatrix();
    let target;
    if (battle) {
      // En vertical, la escena sube un poco en la pantalla: abajo quedan el cuadro de texto y los botones.
      const lift = tall ? h * .12 : 0;
      target = this.target.set(0, .5 - lift * Math.cos(BATTLE_PITCH_TALL), lift * Math.sin(BATTLE_PITCH_TALL));
    } else target = follow ? this.target.set(position.x, .55, position.z - .2) : frame.target;
    if (this.key !== key) this.focus.copy(target); else this.focus.lerp(target, 1 - Math.exp(-dt * 8));
    this.key = key;
    this.distance = h / (2 * TAN);
    const dir = battle ? (tall ? BATTLE_DIR_TALL : BATTLE_DIR) : follow ? this.dir : this.dirIn;
    this.offset.copy(dir).multiplyScalar(this.distance);
    this.camera.position.copy(this.focus).add(this.offset); this.camera.lookAt(this.focus);
  }
  // Punto 3D sobre el plano del foco que cae en las coordenadas de pantalla (0..1) dadas.
  screenPoint(sx, sy, out = new T.Vector3()) {
    const ray = new T.Vector3(sx * 2 - 1, 1 - sy * 2, .5).unproject(this.camera).sub(this.camera.position).normalize();
    return out.copy(this.camera.position).addScaledVector(ray, this.distance);
  }
}
