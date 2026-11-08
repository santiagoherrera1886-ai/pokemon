import * as T from 'three';
export class Lighting {
  constructor(scene){
    this.hemi=new T.HemisphereLight('#ebf2da','#7d967d',2.05);scene.add(this.hemi);
    this.sun=new T.DirectionalLight('#fff0cb',3.1);this.sun.castShadow=true;this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.025;
    Object.assign(this.sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:65});this.sun.shadow.radius=3;
    scene.add(this.sun,this.sun.target);
    this.fill=new T.DirectionalLight('#9ccce1',.65);this.fill.position.set(4,6,-8);scene.add(this.fill);
  }
  quality(settings){this.sun.castShadow=settings.shadow>0;if(settings.shadow){this.sun.shadow.mapSize.set(settings.shadow,settings.shadow);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}}
  update(focus,interior){
    this.sun.position.set(focus.x-8,16,focus.z+6);this.sun.target.position.copy(focus);
    this.sun.intensity=interior?2.3:2.8;this.hemi.intensity=interior?1.7:1.9;
    this.hemi.groundColor.set(interior?'#ad8f77':'#789171');
  }
  dispose(){this.sun.shadow.map?.dispose();}
}
