import * as T from 'three';
// Cámara alta casi cenital con perspectiva suave (lente larga). Sin giro lateral: las calles se ven derechas.
// `h` es la altura visible (en casillas) a la distancia del foco; la distancia se calcula a partir del FOV.
const FOV = 28;
const PITCH = 46 * Math.PI / 180;
const TAN = Math.tan(FOV * Math.PI / 360);
const BATTLE_DIR = new T.Vector3(0, Math.sin(22 * Math.PI / 180), Math.cos(22 * Math.PI / 180));

export class DioramaCamera {
  constructor() {
    this.camera = new T.PerspectiveCamera(FOV, 16 / 9, .5, 160);
    this.focus = new T.Vector3();
    this.dir = new T.Vector3(0, Math.sin(PITCH), Math.cos(PITCH));
    this.offset = this.dir.clone().multiplyScalar(20);
    this.key = null; this.frames = new Map(); this.aspect = 16 / 9; this.distance = 20;
  }
  interiorFrame(map) {
    if (this.frames.has(map.id)) return this.frames.get(map.id);
    const right = new T.Vector3(1, 0, 0);
    const up = new T.Vector3().crossVectors(this.dir, right).normalize();
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
    const a = this.aspect;
    let h = battle ? 7 : follow ? 9.2 : Math.max(frame.width / a, frame.height);
    if (follow && a < 1) h = Math.min(17, 9.5 / a);
    if (battle && a < 1) h = Math.min(15, 9 / a);
    this.camera.aspect = a; this.camera.updateProjectionMatrix();
    const target = battle ? new T.Vector3(0, .5, 0) : follow ? new T.Vector3(position.x, .1, position.z - .3) : frame.target;
    if (this.key !== key) this.focus.copy(target); else this.focus.lerp(target, 1 - Math.exp(-dt * 8));
    this.key = key;
    this.distance = h / (2 * TAN);
    this.offset.copy(battle ? BATTLE_DIR : this.dir).multiplyScalar(this.distance);
    this.camera.position.copy(this.focus).add(this.offset); this.camera.lookAt(this.focus);
  }
  // Punto 3D sobre el plano del foco que cae en las coordenadas de pantalla (0..1) dadas.
  screenPoint(sx, sy, out = new T.Vector3()) {
    const ray = new T.Vector3(sx * 2 - 1, 1 - sy * 2, .5).unproject(this.camera).sub(this.camera.position).normalize();
    return out.copy(this.camera.position).addScaledVector(ray, this.distance);
  }
}
