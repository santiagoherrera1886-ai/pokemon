import * as T from 'three';
import {Resources} from './resources.js';
import {Environment} from './environment.js';
import {DioramaCamera} from './camera.js';
import {Lighting} from './lighting.js';
import {character,animateCharacter,creature} from './actors.js';
import {QUALITY,normalizeQuality,actorPosition,visibleMapIds} from './policy.js';
import {ui} from '../ui/ui.js';
import {hash} from '../core/pixel.js';

export class PremiumRenderer {
  constructor(game,quality,onStatus){
    this.game=game;this.onStatus=onStatus;this.lost=false;this.last=performance.now();this.maps=new Map();this.actors=new Map();this.battleKey=null;this.frameCount=0;
    this.canvas=document.createElement('canvas');this.canvas.id='premium';this.canvas.setAttribute('aria-label','Alborada · mundo 3D');
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.setVisible(false);onStatus('lost');});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.sizeKey='';this.clearWorld();this.clearBattle();onStatus('ready');});
    try{this.webgl=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
    catch(e){this.canvas.remove();throw e;}
    this.webgl.outputColorSpace=T.SRGBColorSpace;this.webgl.toneMapping=T.ACESFilmicToneMapping;this.webgl.toneMappingExposure=1.12;
    this.webgl.shadowMap.type=T.PCFSoftShadowMap;
    document.getElementById('topScreen').insertBefore(this.canvas,document.getElementById('topui'));
    this.scene=new T.Scene();this.scene.background=new T.Color('#9aaea7');this.scene.fog=new T.Fog('#b7c8b0',28,68);
    this.r=new Resources();this.time={value:0};this.environment=new Environment(this.r,this.time);this.camera=new DioramaCamera();this.lights=new Lighting(this.scene);
    this.worldRoot=new T.Group();this.scene.add(this.worldRoot);this.battleRoot=new T.Group();this.scene.add(this.battleRoot);
    this.setQuality(quality);this.makeParticles();this.makeBackdrop();
    this.onResize=()=>{this.sizeKey='';};addEventListener('resize',this.onResize);
  }
  setVisible(visible){this.canvas.style.display=visible?'block':'none';document.body.classList.toggle('premium-active',visible);}
  setQuality(value){this.quality=normalizeQuality(value);this.settings=QUALITY[this.quality];this.webgl.shadowMap.enabled=this.settings.shadow>0;this.lights.quality(this.settings);this.sizeKey='';this.adaptive=1;this.slowFrames=0;}
  resize(){
    const rect=document.getElementById('topScreen').getBoundingClientRect();
    const width=Math.min(this.settings.maxPixels,Math.max(384,Math.round(rect.width*this.settings.scale*this.adaptive)));
    if(this.sizeKey!==width){this.webgl.setPixelRatio(1);this.webgl.setSize(width,Math.round(width*.75),false);this.sizeKey=width;}
  }
  makeParticles(){
    const positions=new Float32Array(72*3);for(let i=0;i<72;i++){positions[i*3]=hash(i,1)*30-15;positions[i*3+1]=.4+hash(i,2)*4;positions[i*3+2]=hash(i,3)*30-15;}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));
    this.particles=new T.Points(geo,new T.PointsMaterial({color:'#fff5cd',size:.045,transparent:true,opacity:.65,depthWrite:false}));this.particles.frustumCulled=false;this.scene.add(this.particles);
  }
  makeBackdrop(){
    // Unwalkable background uses the same map query as the classic forest fill.
    this.backdrop=new T.Group();this.worldRoot.add(this.backdrop);this.backdropCell='';
  }
  updateBackdrop(position){
    const cx=Math.floor(position.x/8)*8,cz=Math.floor(position.z/8)*8,key=cx+','+cz;
    if(this.backdropCell===key)return;
    this.r.release(this.backdrop);this.backdrop=new T.Group();this.worldRoot.add(this.backdrop);this.backdropCell=key;
    const list=[];
    for(let z=cz-22;z<cz+24;z+=2)for(let x=cx-22;x<cx+24;x+=2){if(this.game.world.outdoorAt(x,z)||this.game.world.outdoorAt(x+1,z+1))continue;list.push([x,z]);}
    const mesh=new T.InstancedMesh(this.r.geometries.cone,this.r.mat('#689363'),list.length),dummy=new T.Object3D();
    list.forEach(([x,z],i)=>{dummy.position.set(x+.7,1.2,z+.7);dummy.scale.set(1.2,2.7,1.2);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.computeBoundingSphere();this.backdrop.add(mesh);
    const floor=this.r.mesh(this.backdrop,'box','#8fae75',[cx,-.13,cz],[70,.1,70]);floor.castShadow=false;
  }
  clearWorld(){for(const e of this.maps.values())this.r.release(e.root);this.maps.clear();for(const a of this.actors.values())this.r.release(a.root);this.actors.clear();this.backdropCell='';this.currentMap=null;}
  clearBattle(){this.r.release(this.battleRoot);this.battleRoot=new T.Group();this.scene.add(this.battleRoot);this.battleKey=null;this.creatures=null;}
  world(dt){
    const g=this.game,ow=g.ow,m=ow.map;if(!m)return;
    const p=actorPosition(ow.player,m);this.worldRoot.visible=true;this.battleRoot.visible=false;
    this.scene.background.set(m.outdoor?'#a5ba9d':'#485d60');this.scene.fog.color.set('#b7c8b0');
    const wanted=new Set(visibleMapIds(g.world,m,p,this.settings.radius));
    for(const [id,e]of this.maps)if(!wanted.has(id)){this.r.release(e.root);this.maps.delete(id);}
    for(const id of wanted)if(!this.maps.has(id)){const e=this.environment.build(g.world.get(id),g.state);this.worldRoot.add(e.root);this.maps.set(id,e);}
    for(const e of this.maps.values())this.environment.update(e,g.state,p);
    this.backdrop.visible=!!m.outdoor;if(m.outdoor)this.updateBackdrop(p);
    const active=new Set();
    for(const actor of [...ow.npcs,ow.player]){
      const id=actor.id,look=actor.look;active.add(id);
      if(!this.actors.has(id)){const rig=character(this.r,look);this.actors.set(id,rig);this.worldRoot.add(rig.root);}
      animateCharacter(this.actors.get(id),actor,m,this.time.value,dt,!!ui.dialog&&!actor.moving);
    }
    for(const [id,rig]of this.actors)if(!active.has(id)){this.r.release(rig.root);this.actors.delete(id);}
    this.camera.update(m,p,dt);this.lights.update(this.camera.focus,!m.outdoor);
    this.particles.visible=true;this.particles.geometry.setDrawRange(0,m.outdoor?this.settings.particles:12);
    this.particles.position.set(p.x,0,p.z);this.particles.rotation.y=this.time.value*.015;
    this.currentMap=m.id;
  }
  battle(dt){
    const b=this.game.battleObj;if(!b)return;
    const key=b.foe.sp+':'+b.ally?.sp;
    if(key!==this.battleKey){
      this.clearBattle();this.battleKey=key;
      const r=this.r,ground=new T.Group();this.battleRoot.add(ground);
      r.box(ground,'#9ab982',0,-.19,0,22,.3,18,true);
      for(const [x,z]of [[-2,1.5],[2,-1.8]]){r.mesh(ground,'cylinder','#e6d8af',[x,-.005,z],[1.65,.12,1.3]);r.mesh(ground,'cylinder','#c0cf94',[x,.06,z],[1.51,.025,1.16]);}
      for(let i=0;i<18;i++){const x=(i%9)*2-8,z=i<9?-5.5:6; r.mesh(ground,'cone','#6e9c6b',[x,1.2,z],[1.15,2.7,1]);}
      r.batch(ground);
      this.creatures={foe:creature(r,b.foe.sp),ally:b.ally?creature(r,b.ally.sp):null};
      for(const rig of Object.values(this.creatures))if(rig)this.battleRoot.add(rig.root);
      this.ball=r.ball(this.battleRoot,'#f2e5cf',0,.2,0,.13);this.ball.visible=false;
    }
    this.worldRoot.visible=false;this.battleRoot.visible=true;this.particles.visible=false;this.scene.background.set('#bfd3bd');
    const f=b.fx,time=this.time.value;
    for(const side of ['foe','ally']){
      const rig=this.creatures[side];if(!rig)continue;
      const ally=side==='ally',blink=f[side+'Blink']&&(this.game.frame>>2)%2;
      rig.root.visible=f[side+'Alpha']>.05&&!blink;
      rig.root.position.set((ally?-2:2)+f[side+'X']/20,Math.max(-1,-f[side+'Y']/30),ally?1.5:-1.8);
      rig.root.rotation.y=ally?Math.PI+.3:.3;
      const s=ally?1.35:(f.foeScale??1)*1.12;rig.root.scale.setScalar(s);
      rig.model.position.y=Math.sin(time*3.8+(ally?0:1))*.045;
      rig.model.rotation.z=Math.sin(time*2.4)*.025;
    }
    this.ball.visible=!!f.ball;if(f.ball)this.ball.position.set((f.ball.x-128)/24,Math.max(.2,(110-f.ball.y)/35),(f.ball.y-90)/25);
    this.camera.update(null,null,dt,true);this.lights.update(this.camera.focus,false);
    // Existing battle FX is presentation state. Consume flash exactly as classic render does.
    if(f.flash>0){this.canvas.style.filter=`brightness(${1+f.flash*2})`;f.flash=Math.max(0,f.flash-.08);}else this.canvas.style.filter='';
  }
  render(){
    const now=performance.now(),dt=Math.min(.1,(now-this.last)/1000);this.last=now;this.time.value=now/1000;
    if(document.hidden)return;
    if(this.game.scene==='battle')this.battle(dt);else{this.canvas.style.filter='';this.world(dt);}
    this.resize();this.webgl.render(this.scene,this.camera.camera);
    if(++this.frameCount%120===0){this.stats={drawCalls:this.webgl.info.render.calls,triangles:this.webgl.info.render.triangles,textures:this.webgl.info.memory.textures,geometries:this.webgl.info.memory.geometries,maps:this.maps.size,resolution:this.canvas.width,quality:this.quality};}
    // Sustained slow frames reduce only pixel resolution; no simulation changes.
    this.slowFrames=dt>.028?this.slowFrames+1:Math.max(0,this.slowFrames-1);
    if(this.slowFrames>100&&this.adaptive>.6){this.adaptive=Math.max(.6,this.adaptive-.1);this.slowFrames=0;this.sizeKey='';}
  }
  dispose(){removeEventListener('resize',this.onResize);this.clearWorld();this.clearBattle();this.r.release(this.backdrop);this.particles.geometry.dispose();this.particles.material.dispose();this.environment.dispose();this.lights.dispose();this.r.dispose();this.webgl.dispose();this.canvas.remove();}
}
