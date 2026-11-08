import * as T from 'three';
export class DioramaCamera {
  constructor(){this.camera=new T.OrthographicCamera(-6,6,4.5,-4.5,.1,140);this.focus=new T.Vector3();this.offset=new T.Vector3(2.8,12,15);this.key=null;}
  update(map,position,dt,battle=false){
    const key=battle?'battle':map.outdoor?'outside':map.id;
    const h=battle?7.4:map.outdoor?11.5:Math.max(7.1,map.w*.66+1.1,(map.h-2)*.76+2.8);
    this.camera.left=-h*2/3;this.camera.right=h*2/3;this.camera.top=h/2;this.camera.bottom=-h/2;
    this.camera.updateProjectionMatrix();
    const target=battle?new T.Vector3(0,.4,0):map.outdoor?new T.Vector3(position.x,.1,position.z-.5):new T.Vector3(map.w/2,.5,(map.h+2)/2-.3);
    if(this.key!==key)this.focus.copy(target);else this.focus.lerp(target,1-Math.exp(-dt*8));
    this.key=key;
    this.camera.position.copy(this.focus).add(this.offset);this.camera.lookAt(this.focus);
  }
}
