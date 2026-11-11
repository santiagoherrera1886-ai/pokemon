import * as T from 'three';
import {hash} from '../core/pixel.js';
import {furniture,wallDecoration,building,smallProp} from './models.js';
import {gymBuilding} from './gyms.js';
import {toonMaterial} from './stylize.js';

// Paleta por bioma: pradera (por defecto), nieve, desierto, volcán y selva.
export const BIOMES={
  meadow:{ground:'#96c26e',tall:'#74ab5c',blade:'#5fa64c',cliff:'#9e9c86',cliffTop:'#b2b09b',path:'#e4d0a2',edge:'#c7b07a',sand:'#eddbac',leaves:['#56885c','#679b62','#78a96c'],back:'#689363',floor:'#8fae75',shore:'#e8d5a5',foam:'#b9dcd2',bloom:true},
  snow:{ground:'#eaf1f6',tall:'#cfdee8',blade:'#e4edf3',cliff:'#a9b3bd',cliffTop:'#f2f6f9',path:'#c5ced9',edge:'#b2bfcc',sand:'#dfe6ec',leaves:['#d6e4ea','#e6eff3','#f2f7f9'],back:'#9db5ae',floor:'#e3ebf1',shore:'#d9e4ec',foam:'#f4fafc'},
  desert:{ground:'#ecd49a',tall:'#d2ba74',blade:'#b9a25a',cliff:'#c48a58',cliffTop:'#dda670',path:'#f4e4ba',edge:'#d6bb80',sand:'#f1dea8',leaves:['#6f9a58','#7fa862','#8fb46c'],back:'#c9965e',floor:'#e6cc90',shore:'#d9c48c',foam:'#c8e6dc'},
  volcano:{ground:'#7a6c66',tall:'#62554f',blade:'#96704c',cliff:'#4b403e',cliffTop:'#665652',path:'#9a8a80',edge:'#5c504c',sand:'#8a7a70',leaves:['#5e5c48','#6c6850','#7a745a'],back:'#463c3a',floor:'#695e5a',shore:'#3a302e',foam:'#ffb648'},
  jungle:{ground:'#74b464',tall:'#52a052',blade:'#3f9448',cliff:'#7f8a6c',cliffTop:'#95a27e',path:'#d9c493',edge:'#b19c68',sand:'#e6d6a4',leaves:['#2f7c4c','#3f8e52','#54a25c'],back:'#3a7a4a',floor:'#62a058',shore:'#d8c898',foam:'#b9dcd2',bloom:true}
};
export const biomeOf=map=>BIOMES[map.snow?'snow':map.biome]||BIOMES.meadow;
// Ruido suave para que el suelo no sea un solo color plano: manchas grandes de pasto más claro y más oscuro.
const sm=t=>t*t*(3-2*t);
function patch(x,z){const fx=x/6,fz=z/6,ix=Math.floor(fx),iz=Math.floor(fz),tx=sm(fx-ix),tz=sm(fz-iz);
  const a=hash(ix,iz,91),b=hash(ix+1,iz,91),c=hash(ix,iz+1,91),d=hash(ix+1,iz+1,91);return (a+(b-a)*tx)*(1-tz)+(c+(d-c)*tx)*tz;}
const dummy=new T.Object3D();
function instances(parent,geometry,material,items,shadow=true) {
  if(!items.length)return;
  const mesh=new T.InstancedMesh(geometry,material,items.length);
  items.forEach((it,i)=>{
    dummy.position.set(...it.p);dummy.scale.set(...it.s);dummy.rotation.set(...(it.r||[0,0,0]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    if(it.c)mesh.setColorAt(i,new T.Color(it.c));
  });
  mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}

export class Environment {
  constructor(resources,time) {
    this.r=resources;this.time=time;
    this.wind=new Map();
    this.wood=resources.texture((g,s)=>{
      g.fillStyle='#d2a978';g.fillRect(0,0,s,s);
      for(let y=0;y<4;y++){
        g.fillStyle=['#cba16d','#dfb987','#d8ae79','#e3bd89'][y];g.fillRect(0,y*s/4,s,s/4-1);
        g.strokeStyle='#a17c50';g.lineWidth=1;g.beginPath();g.moveTo((y%2?.65:.23)*s,y*s/4);g.lineTo((y%2?.65:.23)*s,(y+1)*s/4);g.stroke();
        for(let i=0;i<8;i++){g.fillStyle='rgba(116,76,38,.075)';g.fillRect(hash(i,y)*s,y*s/4+4+hash(y,i)*20,8+hash(i,y,8)*50,1);}
      }
    });
    this.floorMat=toonMaterial({map:this.wood});
    this.water=new T.ShaderMaterial({uniforms:{time},vertexShader:`
      uniform float time; varying vec3 world;
      void main(){vec4 p=vec4(position,1.); #ifdef USE_INSTANCING
      p=instanceMatrix*p; #endif
      p=modelMatrix*p; world=p.xyz; p.y+=sin(p.x*2.4+time)*cos(p.z*2.1-time*.7)*.018;
      gl_Position=projectionMatrix*viewMatrix*p;}`.replace(/ #/g,'\n#'),fragmentShader:`
      uniform float time; varying vec3 world;
      void main(){vec2 p=world.xz;float wave=sin(p.x*3.+p.y*1.8+time*.9)*cos(p.y*4.-time*.65);
      float glint=pow(max(0.,sin(p.x*5.+p.y*4.+time)*cos(p.x*2.-p.y*6.+time*.8)),16.);
      float clouds=smoothstep(.3,.95,sin(p.x*.5+time*.035)*cos(p.y*.34+time*.02));
      vec3 color=mix(vec3(.19,.54,.58),vec3(.39,.76,.73),.45+wave*.18);
      color=mix(color,vec3(.76,.88,.83),clouds*.3);color+=glint*.23;
      gl_FragColor=vec4(color,1.); #include <tonemapping_fragment>
      #include <colorspace_fragment>}`.replace(/ #/g,'\n#')});
    // Suelo con textura: pasto con briznas pintadas y tierra con granos y piedritas. La textura se proyecta en
    // coordenadas del mundo (no por casilla), así no se nota la cuadrícula; el color de cada casilla la tiñe.
    const wrapDraw=(g,q,fn)=>{for(const dx of [-q,0,q])for(const dy of [-q,0,q]){g.save();g.translate(dx,dy);fn();g.restore();}};
    const rnd=(i,k)=>hash(i,k,7);
    const grassTex=resources.texture((g,q)=>{
      g.fillStyle='#eef2e4';g.fillRect(0,0,q,q);
      wrapDraw(g,q,()=>{
        for(let i=0;i<70;i++){const x=rnd(i,1)*q,y=rnd(i,2)*q,r=18+rnd(i,3)*40;const gr=g.createRadialGradient(x,y,2,x,y,r);const dark=rnd(i,4)>.5;
          gr.addColorStop(0,dark?'rgba(70,120,60,.20)':'rgba(255,255,210,.26)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
        g.lineCap='round';
        for(let i=0;i<2600;i++){const x=rnd(i,5)*q,y=rnd(i,6)*q,l=5+rnd(i,7)*9,a=-1.57+(rnd(i,8)-.5)*1.1;
          g.strokeStyle=rnd(i,9)>.45?`rgba(40,95,45,${.10+rnd(i,10)*.16})`:`rgba(250,255,200,${.14+rnd(i,11)*.2})`;g.lineWidth=1.2+rnd(i,12)*1.4;
          g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
      });
    },512);
    const dirtTex=resources.texture((g,q)=>{
      g.fillStyle='#f3efe6';g.fillRect(0,0,q,q);
      wrapDraw(g,q,()=>{
        for(let i=0;i<60;i++){const x=rnd(i,21)*q,y=rnd(i,22)*q,r=20+rnd(i,23)*46;const gr=g.createRadialGradient(x,y,2,x,y,r);
          gr.addColorStop(0,rnd(i,24)>.5?'rgba(120,90,50,.16)':'rgba(255,250,225,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
        for(let i=0;i<1500;i++){const x=rnd(i,25)*q,y=rnd(i,26)*q;g.fillStyle=rnd(i,27)>.5?`rgba(110,80,45,${.1+rnd(i,28)*.18})`:'rgba(255,252,235,.35)';g.fillRect(x,y,1.5+rnd(i,29)*2,1.5+rnd(i,30)*2);}
        for(let i=0;i<46;i++){const x=rnd(i,31)*q,y=rnd(i,32)*q,r=3+rnd(i,33)*5;g.fillStyle='rgba(95,75,50,.28)';g.beginPath();g.ellipse(x+1,y+2,r,r*.7,0,0,7);g.fill();
          g.fillStyle='rgba(235,228,212,.95)';g.beginPath();g.ellipse(x,y,r,r*.7,0,0,7);g.fill();}
      });
    },512);
    for(const t of [grassTex,dirtTex]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}
    const worldMat=(map,scale)=>{const m=toonMaterial({map,roughness:.9});
      m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          vec4 puchaW=vec4(transformed,1.);
          #ifdef USE_INSTANCING
          puchaW=instanceMatrix*puchaW;
          #endif
          puchaW=modelMatrix*puchaW; vMapUv=puchaW.xz*${scale.toFixed(3)};`);};
      m.customProgramCacheKey=()=> 'pucha-ground-'+scale;return m;};
    this.grassMat=worldMat(grassTex,.2);this.dirtMat=worldMat(dirtTex,.25);
    this.blade=new T.BufferGeometry();
    this.blade.setAttribute('position',new T.Float32BufferAttribute([-.07,0,0,.07,0,0,.035,.45,.025,0,0,-.07,0,0,.07,.025,.38,.01],3));this.blade.setAttribute('color',new T.Float32BufferAttribute([.62,.62,.62,.62,.62,.62,1.28,1.28,1.1,.62,.62,.62,.62,.62,.62,1.28,1.28,1.1],3));this.blade.computeVertexNormals();
    // Lava: el mismo oleaje del agua, pero al rojo vivo.
    this.lava=new T.ShaderMaterial({uniforms:{time},vertexShader:this.water.vertexShader,fragmentShader:`
      uniform float time; varying vec3 world;
      void main(){vec2 p=world.xz;float flow=sin(p.x*1.7+p.y*1.1+time*.5)*cos(p.y*2.3-time*.4);
      float crust=smoothstep(.15,.7,sin(p.x*2.9-time*.2)*cos(p.y*3.3+time*.17));
      vec3 color=mix(vec3(1.,.36,.06),vec3(1.,.78,.2),.5+flow*.4);color=mix(color,vec3(.32,.09,.05),crust*.6);
      gl_FragColor=vec4(color*1.25,1.); #include <tonemapping_fragment>
      #include <colorspace_fragment>}`.replace(/ #/g,'\n#')});
    // Luz de los faroles de noche: un halo y un charco de luz en el piso.
    const halo=resources.texture((g,q)=>{const gr=g.createRadialGradient(q/2,q/2,1,q/2,q/2,q/2);gr.addColorStop(0,'rgba(255,236,170,1)');gr.addColorStop(.25,'rgba(255,214,120,.55)');gr.addColorStop(1,'rgba(255,190,90,0)');g.fillStyle=gr;g.fillRect(0,0,q,q);});
    this.glowMat=new T.SpriteMaterial({map:halo,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8,fog:false});
    this.poolMat=new T.MeshBasicMaterial({map:halo,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.42,fog:false});
  }
  windMat(color,grad=false) {
    const id=color+(grad?'g':'');
    if(!this.wind.has(id)){
      const m=toonMaterial({color,side:T.DoubleSide,vertexColors:grad});
      m.onBeforeCompile=shader=>{shader.uniforms.alboradaTime=this.time;shader.vertexShader='uniform float alboradaTime;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          #ifdef USE_INSTANCING
          transformed.x += sin(alboradaTime*1.25+instanceMatrix[3].x*.6+instanceMatrix[3].z*.5)*max(0.,position.y+.15)*.055;
          #endif`);
      };m.customProgramCacheKey=()=> 'alborada-wind-v1'+(grad?'g':'');this.wind.set(id,m);
    }return this.wind.get(id);
  }
  build(map,state) {
    const r=this.r,root=new T.Group(),staticProps=new T.Group(),dynamic=[],glows=[],P=biomeOf(map),ox=map.outdoor?map.origin[0]:0,oz=map.outdoor?map.origin[1]:0;root.name=map.id;
    const chunks=new Map();
    const getChunk=(x,z)=>{
      const key=`${Math.floor(x/8)},${Math.floor(z/8)}`;
      if(!chunks.has(key))chunks.set(key,{tiles:{},trees:[],grass:[],flowers:[],pebbles:[],center:[Math.floor(x/8)*8+4,Math.floor(z/8)*8+4]});
      return chunks.get(key);
    };
    const tile=(x,z,key,item)=>{const c=getChunk(x,z);(c.tiles[key]??=[]).push(item);};
    for(let z=0;z<map.h;z++)for(let x=0;x<map.w;x++){
      const code=map.at(x,z);if(code===' '||code==='W')continue;
      const C=getChunk(x,z),n=hash(x,z),ground=map.outdoor?'grass':map.dark?'cave':map.floor==='k'?'tile':'wood';
      const pt=patch(x+ox,z+oz);
      let key=ground,height=-.035,color=ground==='grass'?new T.Color(P.ground).multiplyScalar(map.snow?.97+n*.04:.9+pt*.16+n*.04):null;
      if(ground==='tile'&&map.floorColors)color=map.floorColors[(x+z)%map.floorColors.length];
      if(code==='p'||code==='s'){key='path';color=new T.Color(code==='s'?P.sand:P.path).multiplyScalar(.97+n*.05);height=-.005;}
      if(code==='p'&&!map.paved&&map.outdoor){   // borde del camino: una franja más oscura donde empieza el pasto
        for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const t=map.at(x+dx,z+dz);if(t!==undefined&&!'psDw'.includes(t))tile(x,z,'edge',{p:[x+.5+dx*.47,.0,z+.5+dz*.47],s:[dx?.08:1.06,.085,dz?.08:1.06]});}
      }
      if(map.paved&&code==='p'){
        // Calle de asfalto con bordillo claro donde termina la calzada.
        color=new T.Color('#8c919c').multiplyScalar(.96+n*.06);
        for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const t=map.at(x+dx,z+dz);if(t!=='p'&&t!==undefined)tile(x,z,'curb',{p:[x+.5+dx*.47,.035,z+.5+dz*.47],s:[dx?.07:1,.08,dz?.07:1]});}
      }
      if(map.paved&&(code==='.'||code==='F')){
        let near=false;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(map.at(x+dx,z+dz)==='p')near=true;
        if(near){key='sidewalk';height=.01;color=map.snow?(((x+z)%2)?'#e6ebf0':'#d8dfe7'):((x+z)%2)?'#efdfa6':'#e6d18f';
          tile(x,z,'grout',{p:[x+.5,.06,z+.99],s:[1,.006,.02]});tile(x,z,'grout',{p:[x+.99,.06,z+.5],s:[.02,.006,1]});
          if(hash(x,z,61)>.55)tile(x,z,'inlay',{p:[x+.5,.062,z+.5],s:[.42,.006,.42]});}
      }
      if(code==='w'){key=map.biome==='volcano'?'lava':'water';height=-.045;}
      if(code==='g'){color=new T.Color(P.tall).multiplyScalar(.95+pt*.1);}
      if(code==='c'){key='cave';color=new T.Color('#9d9b8e').multiplyScalar(.78+n*.2);}
      if(code==='K'||code==='R'){
        key=map.dark?'cave':'grass';
        const kh=code==='K'?hash(x,z,71)*.38:0,kc=.92+hash(x,z,72)*.14;
        r.box(staticProps,'#'+new T.Color(code==='K'?P.cliff:'#777d7a').multiplyScalar(kc).getHexString(),x+.5,.55+kh/2,z+.5,1.02,1.12+kh,1.02,true);
        r.box(staticProps,'#'+new T.Color(code==='K'?P.cliffTop:'#949990').multiplyScalar(kc).getHexString(),x+.5,1.13+kh,z+.5,.97,.11,.97,true);
      }
      tile(x,z,key,{p:[x+.5,height,z+.5],s:[1,.08,1],c:color});
      if(ground==='tile'){
        tile(x,z,'grout',{p:[x+.5,.008,z+.99],s:[1,.006,.018]});tile(x,z,'grout',{p:[x+.99,.008,z+.5],s:[.018,.006,1]});
      }
      if(code==='r'||code==='m'){
        const mat=code==='r'?'rug':'mat';tile(x,z,mat,{p:[x+.5,.018,z+.5],s:[code==='m'?.86:1,.035,code==='m'?.7:1]});
        for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]])if(map.at(x+dx,z+dz)!==code)tile(x,z,'trim',{p:[x+.5+dx*.46,.04,z+.5+dz*.46],s:[dx?.035:1,.015,dz?.035:1]});
      }
      if(code==='S'||code==='U'){
        r.box(staticProps,'#6f6654',x+.5,.015,z+.5,.95,.03,.95);
        for(let i=0;i<6;i++){const h=code==='U'?(6-i)*.055:.02+i*.035;r.box(staticProps,'#bfa47d',x+.5,h/2,z+.08+i*.16,.85,h,.15);}
        for(const xx of [x+.06,x+.94])r.box(staticProps,'#866a4d',xx,.22,z+.5,.06,.44,.98,true);
      }
      if((code==='g'||code==='F'||(code==='.'&&n>.7&&!map.snow))&&key!=='sidewalk') {   // sobre la nieve no salen matas sueltas
        const amount=code==='g'?(map.snow?9:16):code==='F'?5:2;
        for(let i=0;i<amount;i++){
          const xx=x+.12+hash(x,z,i+2)*.76,zz=z+.12+hash(z,x,i+8)*.76;
          C.grass.push({p:[xx,.02,zz],s:[code==='g'?1.25:1,code==='g'?.8+hash(x,z,i)*.55:.35,code==='g'?1.25:1],r:[0,i*2.4,0]});
          if(code==='F')C.flowers.push({p:[xx,.27,zz],s:[.07,.045,.07],c:['#f6e4ad','#eea692','#edf2cf'][Math.floor(n*3)]});
        }
      }
      if(code==='w')for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]])if(map.at(x+dx,z+dz)!=='w'){
        tile(x,z,'shore',{p:[x+.5+dx*.45,-.005,z+.5+dz*.45],s:[dx?.1:1,.1,dz?.1:1]});
        tile(x,z,'foam',{p:[x+.5+dx*.38,.012,z+.5+dz*.38],s:[dx?.025:.86,.008,dz?.025:.86]});
      }
      if(code==='.'&&P.bloom&&ground==='grass'&&key==='grass'&&hash(x,z,33)>.88){   // florecitas sueltas en la pradera
        const col=['#ffffff','#ffe27a','#f7a8c4','#c9b6ff'][Math.floor(hash(x,z,34)*4)];
        for(let i=0;i<3;i++)C.flowers.push({p:[x+.2+hash(x,z,40+i)*.6,.06,z+.2+hash(z,x,50+i)*.6],s:[.055,.04,.055],c:col});
      }
      if((code==='s'||code==='p')&&n>.7)C.pebbles.push({p:[x+.2+n*.5,.042,z+.2+hash(z,x)*.5],s:[.07,.035,.05]});
    }
    for(const o of map.objects){
      if(o.kind==='tree'){getChunk(o.x,o.y).trees.push(o);continue;}
      let model;
      if(o.kind==='deco')model=wallDecoration(r,o);
      else if(o.kind==='furniture'){model=furniture(r,o);model.position.set(o.x+o.w/2,0,o.y+o.h/2);}
      else if(o.kind==='house'||o.kind==='lab'||o.kind==='big'){model=building(r,o);model.position.set(o.x,0,o.y);}
      else if(o.kind==='gym'){model=gymBuilding(r,o.theme);model.position.set(o.x,0,o.y);}
      else {model=smallProp(r,o);model.position.set(o.x+o.w/2,0,o.y+o.h/2);}
      if(o.kind==='lamp'&&map.outdoor){
        const g1=new T.Sprite(this.glowMat);g1.position.set(o.x+.5,1.9,o.y+.5);g1.scale.set(3.4,3.4,1);
        const g2=new T.Mesh(r.geometries.plane,this.poolMat);g2.rotation.x=-Math.PI/2;g2.position.set(o.x+.5,.09,o.y+.5);g2.scale.set(6.5,6.5,1);
        g1.visible=g2.visible=false;root.add(g1,g2);glows.push(g1,g2);
      }
      if(o.when){r.batch(model);root.add(model);dynamic.push({model,when:o.when});model.visible=!!o.when(state);}
      else staticProps.add(model);
      if(o.solid&&o.kind!=='deco')r.shadow(root,o.x+o.w/2,o.y+o.h/2,o.w+.6,o.h+.45);
    }
    if(!map.outdoor&&!map.dark){
      const wall=map.wallColor||(map.style?'#c4ded7':'#eadbc2');
      r.box(staticProps,'#857361',map.w/2,-.21,(map.h+2)/2,map.w+.3,.4,map.h-2+.3,true);
      r.box(staticProps,wall,map.w/2,1.12,1.76,map.w+.12,2.25,.3,true);
      r.box(staticProps,'#927451',map.w/2,.16,1.96,map.w,.32,.09);
      r.box(staticProps,'#d4bf9b',map.w/2,2.28,1.76,map.w+.3,.11,.43,true);
      for(let x=.5;x<map.w;x+=.6)r.box(staticProps,'#d9c9ad',x,1.25,1.92,.025,1.7,.015);
      for(const x of [-.1,map.w+.1])r.box(staticProps,'#c3ad87',x,.15,(map.h+2)/2,.18,.3,map.h-2,true);
      r.box(staticProps,'#b99a70',map.w/2,-.04,map.h+.08,map.w+.25,.16,.17,true);
      // Window light is a textured light pool; furniture still casts real shadows over it.
      const light=r.texture((g,s)=>{const gr=g.createLinearGradient(0,0,s,s);gr.addColorStop(0,'rgba(255,232,167,.32)');gr.addColorStop(1,'rgba(255,232,167,0)');g.fillStyle=gr;g.fillRect(0,0,s,s);});
      const patch=new T.Mesh(r.geometries.plane,new T.MeshBasicMaterial({map:light,transparent:true,depthWrite:false}));patch.userData.ownedMaterial=true;patch.rotation.x=-Math.PI/2;patch.position.set(3.2,.014,4.5);patch.scale.set(3.8,4,1);root.add(patch);
    }
    r.batch(staticProps);root.add(staticProps);
    const mats={grass:this.grassMat,path:this.dirtMat,cave:r.mat('#ffffff'),water:this.water,wood:this.floorMat,tile:r.mat(map.floorColors?'#ffffff':'#dce3d5'),grout:r.mat('#b6c6bb'),rug:r.mat(map.style==='league'?'#af6977':'#789faa'),mat:r.mat('#cc8e74'),trim:r.mat('#edd4a2'),curb:r.mat('#e4e6ea'),sidewalk:r.mat('#ffffff'),inlay:r.mat(map.snow?'#b9c7d4':'#d4b56a'),shore:r.mat(P.shore),foam:r.mat(P.foam),edge:r.mat(P.edge),lava:this.lava};
    const lods=[];
    for(const C of chunks.values()){
      const chunk=new T.Group();root.add(chunk);
      for(const [key,items] of Object.entries(C.tiles))instances(chunk,r.geometries.box,mats[key],items,false);
      instances(chunk,this.blade,this.windMat(P.blade,true),C.grass,false);
      instances(chunk,r.geometries.ball,r.mat('#ffffff'),C.flowers,false);
      instances(chunk,r.geometries.leaf,r.mat('#b6b49c'),C.pebbles,false);
      if(C.trees.length){
        const near=new T.Group(),far=new T.Group();chunk.add(near,far);
        const trunks=[],leaves=[],simple=[];
        for(const o of C.trees){
          const h=1.75+hash(o.x,o.y)*.35,x=o.x+.5,z=o.y+.5,k=.92+hash(o.y,o.x,5)*.2;
          trunks.push({p:[x,.65,z],s:[.15,1.3,.15]});trunks.push({p:[x,.12,z],s:[.24,.24,.24]});
          const tint=P.leaves,base=new T.Color(tint[o.variant||0]),lo='#'+base.clone().multiplyScalar(.84).getHexString(),hi='#'+base.clone().lerp(new T.Color('#f4ffb8'),.24).getHexString(),mid='#'+base.getHexString();
          // Copa redonda de varios lóbulos: abajo más oscuro, arriba un brillo, como hojas de verdad al sol.
          for(const [dx,dy,dz,sx,sy,sz,c] of [[0,.2,0,.8,.72,.76,mid],[-.36,-.02,.06,.5,.46,.5,lo],[.36,-.04,.04,.5,.46,.5,lo],[0,-.1,.32,.52,.44,.46,mid],[.04,-.02,-.3,.5,.46,.46,lo],[.1,.62,-.06,.5,.42,.48,mid],[-.2,.56,.14,.36,.3,.34,hi],[.22,.3,.3,.3,.26,.28,hi]])
            leaves.push({p:[x+dx*k,h+dy*k,z+dz*k],s:[sx*k,sy*k,sz*k],c});
          simple.push({p:[x,h+.15,z],s:[.86,.95,.82],c:mid});
        }
        instances(chunk,r.geometries.cylinder,r.mat('#7d5f40'),trunks,true);
        instances(near,r.geometries.leaf,this.windMat('#ffffff'),leaves,true);
        instances(far,r.geometries.leaf,r.mat('#ffffff'),simple,false);far.visible=false;
        lods.push({near,far,center:C.center});
      }
    }
    root.position.set(...(map.outdoor?[map.origin[0],0,map.origin[1]]:[0,0,0]));
    return {root,dynamic,lods,map,glows};
  }
  update(entry,state,pos,night=false) {
    entry.dynamic.forEach(({model,when})=>model.visible=!!when(state));
    for(const g of entry.glows)g.visible=night;
    for(const lod of entry.lods){const x=lod.center[0]+entry.root.position.x,z=lod.center[1]+entry.root.position.z;const near=Math.hypot(x-pos.x,z-pos.z)<17;lod.near.visible=near;lod.far.visible=!near;}
  }
  dispose(){this.floorMat.dispose();this.water.dispose();this.lava.dispose();this.grassMat.dispose();this.dirtMat.dispose();this.glowMat.dispose();this.poolMat.dispose();this.blade.dispose();this.wind.forEach(m=>m.dispose());}
}
