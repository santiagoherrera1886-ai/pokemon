import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toonMaterial} from './stylize.js';

export class Resources {
  constructor() {
    this.materials = new Map(); this.textures = new Set();
    this.geometries = {
      box: new T.BoxGeometry(1,1,1), soft: new RoundedBoxGeometry(1,1,1,2,0.09),
      ball: new T.SphereGeometry(1,20,14), leaf: new T.IcosahedronGeometry(1,1),
      cylinder: new T.CylinderGeometry(1,1,1,12), cone: new T.ConeGeometry(1,1,8),
      plane: new T.PlaneGeometry(1,1), ring: new T.TorusGeometry(1,.06,6,32),
      // Formas más finas para edificios grandes (gimnasios): conos y cilindros lisos, cúpulas y cristales.
      cone24: new T.ConeGeometry(1,1,24), cyl32: new T.CylinderGeometry(1,1,1,32), ballHi: new T.SphereGeometry(1,32,20),
      dome: new T.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2), octa: new T.OctahedronGeometry(1,0),
      vault: new T.CylinderGeometry(1,1,1,28,1,true,0,Math.PI).rotateZ(Math.PI/2),
      halfDisc: new T.CircleGeometry(1,28,0,Math.PI)
    };
    this.merged = new Set();
  }
  mat(color, options = {}) {
    const key = color + JSON.stringify(options);
    if (!this.materials.has(key)) this.materials.set(key, toonMaterial({color, ...options}));
    return this.materials.get(key);
  }
  mesh(parent, shape, color, pos, scale, options = {}) {
    const m = new T.Mesh(this.geometries[shape], typeof color === 'object' ? color : this.mat(color, options));
    m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  box(p,c,x,y,z,w,h,d,soft=false) {return this.mesh(p,soft?'soft':'box',c,[x,y,z],[w,h,d]);}
  ball(p,c,x,y,z,w,h=w,d=w) {return this.mesh(p,'ball',c,[x,y,z],[w,h,d]);}
  // Batch opaque static props with vertex colors, preserving emissive surfaces separately.
  batch(group) {
    group.updateMatrixWorld(true);
    const groups = new Map(), remove = [];
    group.traverse(m => {
      // userData.keep: piezas que se animan aparte (por ejemplo los ojos que parpadean).
      if (!m.isMesh || m.isInstancedMesh || m.material.map || m.material.transparent || m.userData.keep) return;
      const mat = m.material;
      const emissive = mat.emissive?.getHex() || 0;
      const roughness = mat.roughness ?? .62, metalness = mat.metalness ?? 0;
      const key = `${emissive}:${mat.emissiveIntensity || 0}:${roughness}:${metalness}`;
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      const count = g.attributes.position.count, colors = new Float32Array(count * 3);
      for (let i=0;i<count;i++) mat.color.toArray(colors,i*3);
      g.setAttribute('color',new T.BufferAttribute(colors,3));
      const plain = g.index ? g.toNonIndexed() : g;
      if (plain !== g) g.dispose();
      if (!groups.has(key)) groups.set(key,{list:[],emissive,intensity:mat.emissiveIntensity,roughness,metalness});
      groups.get(key).list.push(plain); remove.push(m);
    });
    remove.forEach(m=>{m.removeFromParent();if(m.userData.ownedGeometry)m.geometry.dispose();});
    const inverse = new T.Matrix4().copy(group.matrixWorld).invert();
    for (const {list,emissive,intensity,roughness,metalness} of groups.values()) {
      const geo=mergeGeometries(list); list.forEach(g=>g.dispose());
      if (!geo) throw new Error('Geometría incompatible');
      geo.applyMatrix4(inverse); this.merged.add(geo);
      const opts={vertexColors:true,emissive,emissiveIntensity:intensity};
      if (roughness!==.62) opts.roughness=roughness;
      if (metalness) opts.metalness=metalness;
      const mesh=new T.Mesh(geo,this.mat('#ffffff',opts));
      mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh);
    }
    return group;
  }
  texture(draw,size=128) {
    const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); draw(g,size);
    const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; this.textures.add(t); return t;
  }
  shadow(parent,x,z,sx,sz,opacity=.22) {
    if (!this.shadowMat) {
      const map=this.texture((g,s)=>{const grad=g.createRadialGradient(s/2,s/2,2,s/2,s/2,s/2);grad.addColorStop(0,'rgba(25,30,38,.7)');grad.addColorStop(.4,'rgba(25,30,38,.3)');grad.addColorStop(1,'rgba(25,30,38,0)');g.fillStyle=grad;g.fillRect(0,0,s,s);});
      this.shadowMat=new T.MeshBasicMaterial({map,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    }
    const m=new T.Mesh(this.geometries.plane,this.shadowMat);m.rotation.x=-Math.PI/2;m.position.set(x,.018,z);m.scale.set(sx,sz,1);parent.add(m);return m;
  }
  release(group) {
    group.traverse(m=>{
      if (m.geometry && this.merged.delete(m.geometry)) m.geometry.dispose();
      if (m.isInstancedMesh) m.dispose();
      if (m.userData.ownedGeometry) m.geometry.dispose();
      if (m.userData.ownedMaterial) {if(m.material.map && this.textures.delete(m.material.map))m.material.map.dispose();m.material.dispose();}
    });
    group.removeFromParent();
  }
  dispose() {
    Object.values(this.geometries).forEach(g=>g.dispose()); this.merged.forEach(g=>g.dispose());
    this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());this.shadowMat?.dispose();
  }
}
