import * as T from 'three';
import {hash} from '../core/pixel.js';
import {furniture,wallDecoration,building,smallProp} from './models.js';

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
    this.floorMat=new T.MeshStandardMaterial({map:this.wood,roughness:.9});
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
    this.blade=new T.BufferGeometry();
    this.blade.setAttribute('position',new T.Float32BufferAttribute([-.07,0,0,.07,0,0,.035,.45,.025,0,0,-.07,0,0,.07,.025,.38,.01],3));this.blade.computeVertexNormals();
  }
  windMat(color) {
    if(!this.wind.has(color)){
      const m=new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide});
      m.onBeforeCompile=shader=>{shader.uniforms.alboradaTime=this.time;shader.vertexShader='uniform float alboradaTime;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          #ifdef USE_INSTANCING
          transformed.x += sin(alboradaTime*1.25+instanceMatrix[3].x*.6+instanceMatrix[3].z*.5)*max(0.,position.y+.15)*.055;
          #endif`);
      };m.customProgramCacheKey=()=> 'alborada-wind-v1';this.wind.set(color,m);
    }return this.wind.get(color);
  }
  build(map,state) {
    const r=this.r,root=new T.Group(),staticProps=new T.Group(),dynamic=[];root.name=map.id;
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
      let key=ground,height=-.035,color=ground==='grass'?new T.Color('#9dbd74').multiplyScalar(.96+n*.07):null;
      if(ground==='tile'&&map.floorColors)color=map.floorColors[(x+z)%map.floorColors.length];
      if(code==='p'||code==='s'){key='path';color=code==='s'?'#eddbac':'#dfcda3';height=-.005;}
      if(code==='w'){key='water';height=-.045;}
      if(code==='g'){color='#79a761';}
      if(code==='c'){key='cave';color=new T.Color('#9d9b8e').multiplyScalar(.78+n*.2);}
      if(code==='K'||code==='R'){
        key=map.dark?'cave':'grass';
        r.box(staticProps,code==='K'?'#9e9c86':'#777d7a',x+.5,.55,z+.5,.99,1.12,.99,true);
        r.box(staticProps,code==='K'?'#b2b09b':'#949990',x+.5,1.13,z+.5,.95,.11,.95,true);
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
      if(code==='g'||code==='F'||(code==='.'&&n>.7)) {
        const amount=code==='g'?13:code==='F'?5:2;
        for(let i=0;i<amount;i++){
          const xx=x+.12+hash(x,z,i+2)*.76,zz=z+.12+hash(z,x,i+8)*.76;
          C.grass.push({p:[xx,.02,zz],s:[1,code==='g'?.75+hash(x,z,i)*.5:.35,1],r:[0,i*2.4,0]});
          if(code==='F')C.flowers.push({p:[xx,.27,zz],s:[.07,.045,.07],c:['#f6e4ad','#eea692','#edf2cf'][Math.floor(n*3)]});
        }
      }
      if(code==='w')for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]])if(map.at(x+dx,z+dz)!=='w'){
        tile(x,z,'shore',{p:[x+.5+dx*.45,-.005,z+.5+dz*.45],s:[dx?.1:1,.1,dz?.1:1]});
        tile(x,z,'foam',{p:[x+.5+dx*.38,.012,z+.5+dz*.38],s:[dx?.025:.86,.008,dz?.025:.86]});
      }
      if((code==='s'||code==='p')&&n>.7)C.pebbles.push({p:[x+.2+n*.5,.042,z+.2+hash(z,x)*.5],s:[.07,.035,.05]});
    }
    for(const o of map.objects){
      if(o.kind==='tree'){getChunk(o.x,o.y).trees.push(o);continue;}
      let model;
      if(o.kind==='deco')model=wallDecoration(r,o);
      else if(o.kind==='furniture'){model=furniture(r,o);model.position.set(o.x+o.w/2,0,o.y+o.h/2);}
      else if(o.kind==='house'||o.kind==='lab'||o.kind==='big'){model=building(r,o);model.position.set(o.x,0,o.y);}
      else {model=smallProp(r,o);model.position.set(o.x+o.w/2,0,o.y+o.h/2);}
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
    const mats={grass:r.mat('#ffffff'),path:r.mat('#ffffff'),cave:r.mat('#ffffff'),water:this.water,wood:this.floorMat,tile:r.mat(map.floorColors?'#ffffff':'#dce3d5'),grout:r.mat('#b6c6bb'),rug:r.mat(map.style==='league'?'#af6977':'#789faa'),mat:r.mat('#cc8e74'),trim:r.mat('#edd4a2'),shore:r.mat('#e8d5a5'),foam:r.mat('#b9dcd2')};
    const lods=[];
    for(const C of chunks.values()){
      const chunk=new T.Group();root.add(chunk);
      for(const [key,items] of Object.entries(C.tiles))instances(chunk,r.geometries.box,mats[key],items,false);
      instances(chunk,this.blade,this.windMat('#759952'),C.grass,false);
      instances(chunk,r.geometries.ball,r.mat('#ffffff'),C.flowers,false);
      instances(chunk,r.geometries.leaf,r.mat('#b6b49c'),C.pebbles,false);
      if(C.trees.length){
        const near=new T.Group(),far=new T.Group();chunk.add(near,far);
        const trunks=[],leaves=[],simple=[];
        for(const o of C.trees){
          const h=1.65+hash(o.x,o.y)*.3,x=o.x+.5,z=o.y+.5;
          trunks.push({p:[x,.6,z],s:[.12,1.2,.12]});
          for(let k=0;k<3;k++)leaves.push({p:[x+(k===1?-.2:k===2?.2:0),h+(k===0?.35:0),z+(k===0?-.1:.05)],s:[k===0?.5:.57,k===0?.63:.52,.56],c:['#56885c','#679b62','#78a96c'][o.variant||0]});
          simple.push({p:[x,h,z],s:[.74,1.1,.73],c:['#56885c','#679b62','#78a96c'][o.variant||0]});
        }
        instances(chunk,r.geometries.cylinder,r.mat('#847351'),trunks,true);
        instances(near,r.geometries.leaf,this.windMat('#ffffff'),leaves,true);
        instances(far,r.geometries.cone,r.mat('#ffffff'),simple,false);far.visible=false;
        lods.push({near,far,center:C.center});
      }
    }
    root.position.set(...(map.outdoor?[map.origin[0],0,map.origin[1]]:[0,0,0]));
    return {root,dynamic,lods,map};
  }
  update(entry,state,pos) {
    entry.dynamic.forEach(({model,when})=>model.visible=!!when(state));
    for(const lod of entry.lods){const x=lod.center[0]+entry.root.position.x,z=lod.center[1]+entry.root.position.z;const near=Math.hypot(x-pos.x,z-pos.z)<17;lod.near.visible=near;lod.far.visible=!near;}
  }
  dispose(){this.floorMat.dispose();this.water.dispose();this.blade.dispose();this.wind.forEach(m=>m.dispose());}
}
