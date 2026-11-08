import * as T from 'three';
export class DioramaCamera {
  constructor(){this.camera=new T.OrthographicCamera(-6,6,4.5,-4.5,.1,140);this.focus=new T.Vector3();this.offset=new T.Vector3(2.8,12,15);this.key=null;this.frames=new Map();}
  interiorFrame(map){
    if(this.frames.has(map.id))return this.frames.get(map.id);
    const right=new T.Vector3(this.offset.z,0,-this.offset.x).normalize();
    const up=new T.Vector3().crossVectors(this.offset,right).normalize();
    const center=new T.Vector3(map.w/2,.5,(map.h+1.5)/2);
    const points=[];
    for(const x of [-.3,map.w+.3]){
      for(const z of [1.45,map.h+.3])points.push(new T.Vector3(x,-.45,z));
      points.push(new T.Vector3(x,2.4,1.45));
    }
    const xs=points.map(p=>p.clone().sub(center).dot(right));
    const ys=points.map(p=>p.clone().sub(center).dot(up));
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    center.addScaledVector(right,(minX+maxX)/2).addScaledVector(up,(minY+maxY)/2);
    const frame={target:center,height:Math.max((maxX-minX)*.75,maxY-minY)*1.06};
    this.frames.set(map.id,frame);return frame;
  }
  update(map,position,dt,battle=false){
    const follow=!battle&&(map.outdoor||map.dark||map.h>12);
    const key=battle?'battle':map.outdoor?'outside':map.id;
    const frame=!battle&&!follow?this.interiorFrame(map):null;
    const h=battle?7.4:follow?11.5:frame.height;
    this.camera.left=-h*2/3;this.camera.right=h*2/3;this.camera.top=h/2;this.camera.bottom=-h/2;
    this.camera.updateProjectionMatrix();
    const target=battle?new T.Vector3(0,.4,0):follow?new T.Vector3(position.x,.1,position.z-.5):frame.target;
    if(this.key!==key)this.focus.copy(target);else this.focus.lerp(target,1-Math.exp(-dt*8));
    this.key=key;
    this.camera.position.copy(this.focus).add(this.offset);this.camera.lookAt(this.focus);
  }
}
