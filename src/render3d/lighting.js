import * as T from 'three';
export class Lighting {
  constructor(scene){
    this.hemi=new T.HemisphereLight('#eef5ff','#8a9a86',1.6);scene.add(this.hemi);
    this.sun=new T.DirectionalLight('#fff3d6',3.2);this.sun.castShadow=true;this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.025;
    Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});this.sun.shadow.radius=3;
    scene.add(this.sun,this.sun.target);
    this.fill=new T.DirectionalLight('#9ccce1',.65);this.fill.position.set(4,6,-8);scene.add(this.fill);
  }
  quality(settings){this.sun.castShadow=settings.shadow>0;if(settings.shadow){this.sun.shadow.mapSize.set(settings.shadow,settings.shadow);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}}
  update(focus,interior,hour=12,dark=false){
    this.sun.position.set(focus.x-7,15,focus.z-4);this.sun.target.position.copy(focus);
    const night=!interior&&(hour>=19||hour<5),dusk=!interior&&hour>=17&&hour<19;
    this.sun.color.set(night?'#9bb9e2':dusk?'#ffd09c':'#fff0cb');
    this.sun.intensity=dark?.65:night?.55:interior?2.4:3.35;this.hemi.intensity=dark?.7:night?.7:interior?1.6:1.5;
    this.hemi.groundColor.set(interior?'#ad8f77':'#789171');
  }
  dispose(){this.sun.shadow.map?.dispose();}
}
