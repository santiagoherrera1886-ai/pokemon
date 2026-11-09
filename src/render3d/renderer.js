import * as T from 'three';
import {Resources} from './resources.js';
import {Environment} from './environment.js';
import {DioramaCamera} from './camera.js';
import {Lighting} from './lighting.js';
import {character,animateCharacter,creature} from './actors.js';
import {capsuleModel} from './models.js';
import {TitleScene} from './title.js';
import {MoveFX} from './movefx.js';
import {setAlba,animateAlba} from './alba.js';
import {SPECIES} from '../data/creatures.js';
import {QUALITY,normalizeQuality,actorPosition,visibleMapIds} from './policy.js';
import {ui} from '../ui/ui.js';
import {hash} from '../core/pixel.js';
import {Stylizer} from './stylize.js';

const rnd3=()=>Math.random()-.5;
export class PremiumRenderer {
  constructor(game,quality,onStatus){
    this.game=game;this.onStatus=onStatus;this.lost=false;this.last=performance.now();this.maps=new Map();this.actors=new Map();this.battleKey=null;this.frameCount=0;
    this.canvas=document.createElement('canvas');this.canvas.id='premium';this.canvas.setAttribute('aria-label','Alborada · mundo 3D');
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.setVisible(false);onStatus('lost');});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.sizeKey='';this.clearWorld();this.clearBattle();onStatus('ready');});
    try{this.webgl=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
    catch(e){this.canvas.remove();throw e;}
    this.webgl.outputColorSpace=T.SRGBColorSpace;this.webgl.toneMapping=T.NeutralToneMapping;this.webgl.toneMappingExposure=1.05;
    this.webgl.shadowMap.type=T.PCFSoftShadowMap;
    document.getElementById('app').insertBefore(this.canvas,document.getElementById('ui'));this.style=new Stylizer(this.webgl);
    this.scene=new T.Scene();this.scene.background=new T.Color('#9aaea7');this.scene.fog=new T.Fog('#b7c8b0',28,68);
    this.r=new Resources();this.time={value:0};this.environment=new Environment(this.r,this.time);this.camera=new DioramaCamera();this.lights=new Lighting(this.scene);
    this.worldRoot=new T.Group();this.scene.add(this.worldRoot);this.battleRoot=new T.Group();this.scene.add(this.battleRoot);
    this.setQuality(quality);this.makeParticles();this.makeBackdrop();
    this.onResize=()=>{this.sizeKey='';};addEventListener('resize',this.onResize);
  }
  setVisible(visible){this.canvas.style.display=visible?'block':'none';document.body.classList.toggle('premium-active',visible);}
  setQuality(value){this.quality=normalizeQuality(value);this.settings=QUALITY[this.quality];this.webgl.shadowMap.enabled=this.settings.shadow>0;this.lights.quality(this.settings);this.sizeKey='';this.adaptive=1;this.slowTime=0;this.degrade=this.quality==='low'?2:0;this.style.samples=this.quality==='low'?0:4;this.style.target?.dispose();this.style.target=null;}
  resize(){
    // Pantalla completa: el lienzo ocupa toda la ventana; la resolución interna depende de la calidad.
    const vw=innerWidth,vh=innerHeight,dpr=Math.min(2,devicePixelRatio||1);
    const width=Math.round(Math.min(this.settings.maxPixels*1.6,vw*dpr*this.settings.scale*.62)*this.adaptive);
    const height=Math.max(1,Math.round(width*vh/vw)),key=width+'x'+height;
    if(this.sizeKey!==key){this.webgl.setPixelRatio(1);this.webgl.setSize(width,height,false);this.canvas.style.width=vw+'px';this.canvas.style.height=vh+'px';this.style.setSize(width,height);this.camera.aspect=vw/vh;this.sizeKey=key;}
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
  // Pantalla de inicio: escena propia (lago al amanecer) con cielo en degradé, niebla cálida y sol bajo.
  title(dt){
    if(!this.titleScene){this.titleScene=new TitleScene(this.r);this.scene.add(this.titleScene.root);this.savedFill=this.lights.fill.position.clone();}
    const ts=this.titleScene,t=this.time.value;
    this.worldRoot.visible=false;this.battleRoot.visible=false;this.particles.visible=true;this.canvas.style.filter='';
    this.scene.background=ts.background;this.scene.fog.color.set('#f6d8bd');this.scene.fog.near=22;this.scene.fog.far=75;
    ts.update(this.camera.camera,this.camera.aspect,t,dt);
    this.lights.update(new T.Vector3(0,0,-2),false,12);
    this.lights.sun.position.set(6,10,-7);this.lights.sun.target.position.set(-1,0,0);this.lights.sun.color.set('#ffd6a6');this.lights.sun.intensity=2.6;
    this.lights.hemi.color.set('#ffece0');this.lights.hemi.groundColor.set('#8aa070');this.lights.hemi.intensity=1.7;
    this.lights.fill.position.set(-4,6,12);this.lights.fill.intensity=.9;
    this.camera.camera.updateMatrixWorld(true);
    this.styleOpts={focusY:.55,tilt:.12,night:0,bloom:.55,lift:.1,grade:[1.08,1.0,.94],sat:1.14};
  }
  clearTitle(){
    this.titleScene.dispose();this.titleScene=null;
    this.scene.background=new T.Color('#9aaea7');this.camera.camera.fov=28;this.camera.camera.updateProjectionMatrix();
    if(this.savedFill){this.lights.fill.position.copy(this.savedFill);this.lights.fill.intensity=.65;}
  }
  // Retrato 3D de una criatura para la interfaz (tarjetas de inicial, equipo). Se dibuja en una esquina del
  // lienzo y se copia de inmediato; el siguiente cuadro del juego lo tapa, así que no se ve ningún parpadeo.
  portrait(sp){
    this.portraits=this.portraits||new Map();
    if(this.portraits.has(sp))return this.portraits.get(sp);
    const size=Math.min(224,this.canvas.width,this.canvas.height),scene=new T.Scene();scene.background=new T.Color('#fff8ec');
    scene.add(new T.HemisphereLight('#fff6ec','#a8b4a0',2.0));
    const key=new T.DirectionalLight('#fff0d8',2.8);key.position.set(-2,4,5);scene.add(key);
    const rim=new T.DirectionalLight('#cfe6ff',1.4);rim.position.set(3,3,-4);scene.add(rim);
    const rig=creature(this.r,sp);scene.add(rig.root);rig.root.rotation.y=.42;
    rig.root.traverse(o=>{if(o.material===this.r.shadowMat)o.visible=false;});
    rig.root.updateMatrixWorld(true);
    const box=new T.Box3().setFromObject(rig.model),c=box.getCenter(new T.Vector3()),d=box.getSize(new T.Vector3());
    const cam=new T.PerspectiveCamera(28,1,.1,60),h=Math.max(d.y,d.x*.95)*1.12,dist=h/(2*Math.tan(14*Math.PI/180));
    cam.position.set(c.x,c.y+h*.18,c.z+dist);cam.lookAt(c.x,c.y,c.z);
    const prev=this.webgl.getViewport(new T.Vector4()),prevRT=this.webgl.getRenderTarget();
    this.webgl.setRenderTarget(null);this.webgl.setViewport(0,0,size,size);this.webgl.render(scene,cam);
    const out=document.createElement('canvas');out.width=out.height=size;
    out.getContext('2d').drawImage(this.canvas,0,this.canvas.height-size,size,size,0,0,size,size);
    this.webgl.setViewport(prev);this.webgl.setRenderTarget(prevRT);this.r.release(rig.root);
    const url=out.toDataURL('image/png');this.portraits.set(sp,url);return url;
  }
  // El avatar cambió: se rehace el muñeco del protagonista (en el mundo y en el título).
  refreshPlayer(){
    const rig=this.actors.get('player');if(rig){this.r.release(rig.root);this.actors.delete('player');}
    this.titleScene?.setPlayer();this.avatarShots?.clear();
  }
  // Retrato 3D del avatar de cuerpo entero (editor de personaje). Igual que portrait(), en una esquina del lienzo.
  avatarPortrait(look){
    this.avatarShots=this.avatarShots||new Map();const key=JSON.stringify(look);
    if(this.avatarShots.has(key))return this.avatarShots.get(key);
    const size=Math.min(260,this.canvas.width,this.canvas.height),scene=new T.Scene();scene.background=new T.Color('#fff8ec');
    scene.add(new T.HemisphereLight('#fff6ec','#a8b4a0',2.0));
    const key1=new T.DirectionalLight('#fff0d8',2.6);key1.position.set(-2,4,5);scene.add(key1);
    const rim=new T.DirectionalLight('#cfe6ff',1.2);rim.position.set(3,3,-4);scene.add(rim);
    const rig=character(this.r,look);scene.add(rig.root);rig.root.rotation.y=.35;rig.head.rotation.x=-.08;
    rig.root.traverse(o=>{if(o.material===this.r.shadowMat)o.visible=false;});
    const cam=new T.PerspectiveCamera(26,1,.1,40);cam.position.set(0,.98,3.7);cam.lookAt(0,.76,0);
    const prev=this.webgl.getViewport(new T.Vector4()),prevRT=this.webgl.getRenderTarget();
    this.webgl.setRenderTarget(null);this.webgl.setViewport(0,0,size,size);this.webgl.render(scene,cam);
    const out=document.createElement('canvas');out.width=out.height=size;
    out.getContext('2d').drawImage(this.canvas,0,this.canvas.height-size,size,size,0,0,size,size);
    this.webgl.setViewport(prev);this.webgl.setRenderTarget(prevRT);this.r.release(rig.root);
    const url=out.toDataURL('image/png');if(this.avatarShots.size>40)this.avatarShots.clear();this.avatarShots.set(key,url);return url;
  }
  clearBattle(){this.movefx?.clear();this.r.release(this.battleRoot);this.battleRoot=new T.Group();this.scene.add(this.battleRoot);this.battleKey=null;this.creatures=null;}
  world(dt){
    const g=this.game,ow=g.ow,m=ow.map;if(!m)return;
    const p=actorPosition(ow.player,m);this.worldRoot.visible=true;this.battleRoot.visible=false;
    const hour=g.hour(),night=m.outdoor&&(hour>=19||hour<5);
    this.scene.background.set(m.dark?'#1c2228':night?'#2a3550':m.outdoor?'#d8e8dc':'#3a4652');this.scene.fog.color.set(m.dark?'#1c2228':night?'#2a3550':'#e4eee6');this.scene.fog.near=m.outdoor?34:60;this.scene.fog.far=m.outdoor?80:140;this.styleOpts={focusY:.5,tilt:m.outdoor?.4:.12,night:night?.55:0,bloom:night||m.dark?.8:.3,lift:m.dark?.03:.1,grade:night?[1,1,1]:hour>=17&&hour<19?[1.12,.98,.86]:[1.05,1.01,.95],sat:m.dark?1.05:1.12};
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
    this.camera.update(m,p,dt);this.lights.update(this.camera.focus,!m.outdoor,hour,m.dark);
    this.particles.visible=true;this.particles.geometry.setDrawRange(0,m.outdoor?this.settings.particles:12);
    this.particles.position.set(p.x,0,p.z);this.particles.rotation.y=this.time.value*.015;
    this.currentMap=m.id;
  }
  battle(dt){
    const b=this.game.battleObj;if(!b)return;
    b.L=b.layout(this.game.renderer);
    const terrain=b.opts.bg||'grass',trainer=b.trainer?.look||'';
    const key=b.foe.sp+':'+b.ally?.sp+':'+terrain+':'+trainer;
    if(key!==this.battleKey){
      this.clearBattle();this.battleKey=key;
      const r=this.r,ground=new T.Group();this.battleRoot.add(ground);
      const colors={grass:'#9ab982',lake:'#a4c9b5',cave:'#78807d',beach:'#e4d3ad',mountain:'#a4ac91',gym:'#c8d8bf',eclipse:'#74657f',league:'#dfd2ad'};
      r.box(ground,colors[terrain]||colors.grass,0,-.19,0,22,.3,18,true);
      for(const [x,z]of [[-2,1.5],[2,-1.8]]){r.mesh(ground,'cylinder','#e6d8af',[x,-.005,z],[1.65,.12,1.3]);r.mesh(ground,'cylinder','#c0cf94',[x,.06,z],[1.51,.025,1.16]);}
      for(let i=0;i<26;i++){const row=i<13?0:1,x=(i%13)*2.2-13.2+row*1.1,z=row?-8:-6,rock=terrain==='cave'||terrain==='mountain';r.mesh(ground,rock?'leaf':'cone',rock?(row?'#6f7770':'#858d86'):(row?'#5d8a5c':'#6e9c6b'),[x,1.2+row*.3,z],[1.15,rock?1.7:2.7+row*.5,1]);}
      r.batch(ground);
      this.creatures={foe:creature(r,b.foe.sp),ally:b.ally?creature(r,b.ally.sp):null};
      for(const rig of Object.values(this.creatures))if(rig)this.battleRoot.add(rig.root);
      this.ball=capsuleModel(r);this.battleRoot.add(this.ball);this.ball.visible=false;
      this.trainerRig=trainer?character(r,trainer):null;if(this.trainerRig)this.battleRoot.add(this.trainerRig.root);
      // Alto de cada criatura (para apuntar los efectos al pecho y a los pies).
      for(const rig of Object.values(this.creatures))if(rig){rig.root.updateMatrixWorld(true);rig.h=Math.max(.6,new T.Box3().setFromObject(rig.model).max.y);}
      this.fxLayer=new T.Group();this.battleRoot.add(this.fxLayer);
      this.movefx=this.movefx||new MoveFX(this.r,this.fxLayer);this.movefx.parent=this.fxLayer;b.fxEvents.length=0;
    }
    this.worldRoot.visible=false;this.battleRoot.visible=true;this.particles.visible=false;this.scene.background.set({cave:'#2a2a2e',eclipse:'#2a2236',league:'#2e2c4e',lake:'#a8daf0',beach:'#9fd8f4',mountain:'#b8dcf0'}[terrain]||'#a8d8ee');this.scene.fog.color.copy(this.scene.background);this.scene.fog.near=14;this.scene.fog.far=40;this.styleOpts={focusY:.5,tilt:.3,night:0,bloom:.3,lift:.1,grade:[1.05,1.01,.95],sat:1.12};
    const f=b.fx,time=this.time.value;
    for(const side of ['foe','ally']){
      const rig=this.creatures[side];if(!rig)continue;
      const ally=side==='ally',blink=f[side+'Blink']&&(this.game.frame>>2)%2;
      rig.root.visible=f[side+'Alpha']>.05&&!blink;
      rig.root.position.set((ally?-2:2)+f[side+'X']*13,Math.max(-1,-f[side+'Y']/30),ally?1.5:-1.8);
      rig.root.rotation.y=ally?Math.PI+.3:.3;
      // Forma Alba: corona, alas de luz y brillo; la criatura crece un poco mientras dure el combate.
      const cr=ally?b.ally:b.foe,albaOn=!!(cr&&cr.alba&&cr.sp===rig.sp);
      if(!!rig.albaOn!==albaOn)setAlba(this.r,rig,albaOn,SPECIES[rig.sp].types);
      rig.albaK=(rig.albaK??1)+((albaOn?1.14:1)-(rig.albaK??1))*Math.min(1,dt*5);animateAlba(rig,time);
      const s=(ally?1.35:(f.foeScale??1)*1.12)*rig.albaK;rig.root.scale.setScalar(s);
      rig.model.position.y=Math.sin(time*3.8+(ally?0:1))*.045;
      rig.model.rotation.z=Math.sin(time*2.4)*.025;rig.baseScale??=rig.model.scale.x;rig.model.scale.setScalar(rig.baseScale);
      // Parpadeo de figura: cada 2 a 5 segundos los ojos se cierran un instante.
      rig.blinkAt=rig.blinkAt??time+1+Math.random()*2.5;
      if(time>rig.blinkAt+.14)rig.blinkAt=time+2+Math.random()*3;
      const closed=time>rig.blinkAt;for(const e of rig.eyes||[])e.scale.y=closed?.12:1;
    }
    this.ball.visible=!!f.ball;if(f.ball){this.ball.position.set((f.ball.x-.5)*10,Math.max(.2,(.5-f.ball.y)*9),(f.ball.y-.43)*9-1.8);this.ball.userData.paint(f.ball.color||'#3a9ad8');this.ball.rotation.set(0,.45,f.ball.spin||0);}
    if(this.trainerRig){this.trainerRig.root.visible=f.trainerA>.05;this.trainerRig.root.position.set(2+f.trainerX*13,0,-1.8);this.trainerRig.root.scale.setScalar(1.5);}
    this.camera.update(null,null,dt,true);this.lights.update(this.camera.focus,false);
    this.camera.camera.updateMatrixWorld(true);
    // Animaciones de los movimientos (movefx.js): se crean con los eventos que deja el combate.
    const rigs=this.creatures,side=n=>rigs[n]||rigs.foe;
    const ctx={
      center:n=>{const r=side(n);return r.root.position.clone().add(new T.Vector3(0,r.h*r.root.scale.y*.5,0));},
      feet:n=>side(n).root.position.clone().setY(0),
      height:n=>{const r=side(n);return r.h*r.root.scale.y;}
    };
    this.movefx.camera=this.camera.camera;
    while(b.fxEvents.length)this.movefx.spawn(b.fxEvents.shift(),ctx);
    const shake=this.movefx.update(dt,this.camera.camera);
    if(this.movefx.items.length)this.styleOpts.bloom=.62;
    for(const n of this.movefx.wobbleTargets()){const r=rigs[n];if(r){r.model.rotation.z+=Math.sin(time*30)*.08;r.model.scale.setScalar(r.baseScale*(1+Math.sin(time*24)*.04));}}
    if(shake>0){this.camera.camera.position.x+=rnd3()*shake;this.camera.camera.position.y+=rnd3()*shake*.6;}
    b.parts.length=0;
    // Existing battle FX is presentation state. Consume flash exactly as classic render does.
    if(f.flash>0){this.canvas.style.filter=`brightness(${1+f.flash*2})`;f.flash=Math.max(0,f.flash-.08);}else this.canvas.style.filter='';
  }
  render(){
    const now=performance.now(),raw=(now-this.last)/1000,dt=Math.min(.1,raw);this.last=now;this.time.value=now/1000;
    if(document.hidden)return;
    if(this.game.scene!=='title'&&this.titleScene)this.clearTitle();
    if(this.game.scene==='battle')this.battle(dt);else if(this.game.scene==='title')this.title(dt);else{this.canvas.style.filter='';this.world(dt);}
    this.resize();const so={...(this.styleOpts||{})};if(this.degrade>=1)so.tilt=0;if(this.degrade>=2)so.bloom=0;this.style.render(this.scene,this.camera.camera,so);
    if(++this.frameCount%120===0){this.stats={drawCalls:this.webgl.info.render.calls,triangles:this.webgl.info.render.triangles,textures:this.webgl.info.memory.textures,geometries:this.webgl.info.memory.geometries,maps:this.maps.size,resolution:this.canvas.width,quality:this.quality};}
    // Sustained slow frames reduce only pixel resolution; no simulation changes.
    // Si hay cuadros lentos sostenidos, baja la carga por escalones: 1 sin desenfoque, 2 sin bloom ni MSAA, 3+ menos resolución.
    this.slowTime=raw>.04?this.slowTime+Math.min(raw,1):Math.max(0,this.slowTime-raw*.5);
    if(this.slowTime>1.5&&this.degrade<5){this.degrade++;this.slowTime=0;if(this.degrade===2){this.style.samples=0;this.style.target?.dispose();this.style.target=null;}if(this.degrade>=3)this.adaptive=Math.max(.55,this.adaptive-.15);this.sizeKey='';}
  }
  dispose(){removeEventListener('resize',this.onResize);this.style.dispose();this.clearWorld();this.clearBattle();this.r.release(this.backdrop);this.particles.geometry.dispose();this.particles.material.dispose();this.environment.dispose();this.lights.dispose();this.r.dispose();this.webgl.dispose();this.canvas.remove();}
}
