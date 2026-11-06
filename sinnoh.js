// Expanded Sinnoh: connected route network and distinctive 3D city districts.
// Cities/roads form a real traversable continuous region. No teleport needed.
export const PLACES=[
 {id:"twinleaf",name:"Pueblo Hojaverde",x:0,z:12,type:"home",color:"#91ba78",radius:28,desc:"Tu hogar. Aquí comienza el viaje."},
 {id:"sandgem",name:"Pueblo Arena",x:24,z:-29,type:"town",color:"#8ebbc0",radius:24,desc:"El laboratorio del Profesor Serbal."},
 {id:"jubilife",name:"Ciudad Jubileo",x:28,z:-112,type:"city",color:"#92c6e3",radius:31,desc:"La metrópoli de Sinnoh, con su plaza y su estación de televisión."},
 {id:"oreburgh",name:"Ciudad Pirita",x:144,z:-112,type:"mining",color:"#d5b98d",radius:31,desc:"Una ciudad minera junto al primer gimnasio."},
 {id:"canalave",name:"Ciudad Canal",x:-111,z:-111,type:"coastal",color:"#99cadd",radius:30,desc:"La ciudad portuaria del oeste, con barcos y muelles."},
 {id:"floaroma",name:"Pueblo Aromaflor",x:-30,z:-204,type:"flower",color:"#d3c7ec",radius:29,desc:"Un pueblo cubierto de campos de flores."},
 {id:"eterna",name:"Ciudad Vetusta",x:70,z:-275,type:"old",color:"#b5c49a",radius:29,desc:"Casas antiguas, bosque y el gimnasio de Gardenia."},
 {id:"hearthome",name:"Ciudad Corazón",x:152,z:-229,type:"city",color:"#d2b1d7",radius:34,desc:"La ciudad de los concursos Pokémon."},
 {id:"solaceon",name:"Pueblo Sosiego",x:225,z:-251,type:"ranch",color:"#d4c698",radius:27,desc:"Praderas, establos y Pokémon de crianza."},
 {id:"veilstone",name:"Ciudad Rocavelo",x:325,z:-285,type:"city",color:"#b6b9da",radius:34,desc:"Ciudad de tiendas, letreros y un gimnasio de tipo Lucha."},
 {id:"pastoria",name:"Ciudad Pradera",x:252,z:-116,type:"marsh",color:"#8bd6b3",radius:32,desc:"Una ciudad construida junto al Gran Pantano."},
 {id:"sunyshore",name:"Ciudad Marina",x:390,z:-131,type:"coastal",color:"#f2d18e",radius:34,desc:"Playa, energía solar y mar de Sinnoh."},
 {id:"celestic",name:"Pueblo Caelestis",x:173,z:-347,type:"old",color:"#c2bc9e",radius:28,desc:"Un pueblo antiguo lleno de historia."},
 {id:"snowpoint",name:"Ciudad Puntaneva",x:93,z:-433,type:"snow",color:"#dcebf2",radius:35,desc:"Nieve, templos y un gimnasio helado."}
];
export const ROUTES=[
 ["twinleaf","sandgem","Ruta 201"],["sandgem","jubilife","Ruta 202"],["jubilife","oreburgh","Ruta 203"],
 ["jubilife","canalave","Ruta 218"],["jubilife","floaroma","Ruta 204"],["floaroma","eterna","Ruta 205"],
 ["eterna","hearthome","Ruta 206"],["oreburgh","hearthome","Ruta 208"],["hearthome","solaceon","Ruta 209"],
 ["solaceon","veilstone","Ruta 215"],["solaceon","pastoria","Ruta 212"],["pastoria","sunyshore","Ruta 222"],
 ["hearthome","celestic","Ruta 210"],["celestic","snowpoint","Ruta 216–217"],["eterna","snowpoint","Ruta 217"],
 ["veilstone","sunyshore","Ruta 214"],["pastoria","oreburgh","Ruta 213"]
];
const seedFactory=()=>{
 let seed=1986;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
};
export function expandSinnoh(T,scene,world){
 const random=seedFactory(),cache=new Map(),animated=[],districts=[];
 const lookup=Object.fromEntries(PLACES.map(x=>[x.id,x]));
 const routeSegments=[];
 function material(color,more={}){let key=String(color)+JSON.stringify(more);if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:.86,...more}));return cache.get(key);}
 function cube(parent,x,y,z,w,h,d,color,cast=true){
   const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.castShadow=cast&&h>.5;m.receiveShadow=true;parent.add(m);return m;
 }
 function sphere(parent,x,y,z,r,color,sub=1){
   const m=new T.Mesh(new T.IcosahedronGeometry(r,sub),material(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
 }
 function cyl(parent,x,y,z,rA,rB,h,color,segments=9){
   const m=new T.Mesh(new T.CylinderGeometry(rA,rB,h,segments),material(color));m.position.set(x,y,z);m.castShadow=h>1;parent.add(m);return m;
 }
 const grassCanvas=document.createElement("canvas");grassCanvas.width=grassCanvas.height=256;
 const gc=grassCanvas.getContext("2d");gc.fillStyle="#89ba76";gc.fillRect(0,0,256,256);
 for(let i=0;i<5000;i++){let x=random()*256,y=random()*256;gc.fillStyle=random()>.6?"#96bd79":"#7aaf72";gc.globalAlpha=.11;gc.fillRect(x,y,2+random()*3,1+random()*4);}
 const tex=new T.CanvasTexture(grassCanvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(55,65);tex.colorSpace=T.SRGBColorSpace;
 const ground=new T.Mesh(new T.PlaneGeometry(1050,1050),new T.MeshStandardMaterial({map:tex,roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.set(140,-.087,-195);ground.receiveShadow=true;scene.add(ground);
 // Large soft-edged biome overlays blend transitions instead of abrupt flat squares.
 const biomeTexture=new Map();
 function terrainTint(x,z,rx,rz,color,alpha=.85){
    let texture=biomeTexture.get(color);
    if(!texture){
      const cv=document.createElement("canvas");cv.width=cv.height=256;const ctx=cv.getContext("2d");
      const g=ctx.createRadialGradient(128,128,25,128,128,125);
      g.addColorStop(0,color);g.addColorStop(.62,color);g.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=g;ctx.fillRect(0,0,256,256);texture=new T.CanvasTexture(cv);biomeTexture.set(color,texture);
    }
    const ground=new T.Mesh(new T.PlaneGeometry(rx*2,rz*2),new T.MeshBasicMaterial({map:texture,transparent:true,opacity:alpha,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    ground.rotation.x=-Math.PI/2;ground.position.set(x,-.015,z);scene.add(ground);return ground;
 }
 terrainTint(93,-420,125,100,"rgba(236,247,248,0.98)",.98);
 terrainTint(75,-310,115,105,"rgba(123,163,123,0.55)",.72);
 terrainTint(-31,-205,85,75,"rgba(245,194,217,0.68)",.72);
 terrainTint(156,-110,95,70,"rgba(190,172,140,0.58)",.73);
 terrainTint(264,-101,95,75,"rgba(115,194,164,0.66)",.76);
 terrainTint(-163,-110,110,95,"rgba(80,165,200,0.88)",.92);
 terrainTint(445,-120,120,120,"rgba(85,183,213,0.88)",.92);
 terrainTint(395,-135,65,70,"rgba(242,210,147,0.64)",.72);
 terrainTint(152,-231,85,84,"rgba(231,196,216,0.36)",.6);
 // Separate regions are visually identified by gardens, stones, snow and colored squares.
 function markerLabel(txt,x,z,y=4.4,size=5){
   const canvas=document.createElement("canvas");canvas.width=768;canvas.height=116;
   const g=canvas.getContext("2d");g.fillStyle="#16334de8";g.beginPath();g.roundRect(8,8,752,100,28);g.fill();
   g.strokeStyle="#e9ecda";g.lineWidth=4;g.stroke();
   g.font="bold 48px system-ui";g.textAlign="center";g.fillStyle="#fff1bc";g.fillText(txt,384,74,710);
   const texture=new T.CanvasTexture(canvas);
   const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
   sprite.position.set(x,y,z);sprite.scale.set(size,1,1);scene.add(sprite);return sprite;
 }
 // Roads follow smooth splines; each road is a continuous mesh, no gaps at corners.
 function road(a,b,name){
  const bend=Math.hypot(a.x-b.x,a.z-b.z)>140?.12:.07;
  const mid={x:(a.x+b.x)/2+(a.z-b.z)*bend,z:(a.z+b.z)/2-(a.x-b.x)*bend};
  const curve=new T.CatmullRomCurve3([
   new T.Vector3(a.x,.016,a.z),new T.Vector3(mid.x,.016,mid.z),new T.Vector3(b.x,.016,b.z)
  ],false,"catmullrom",.2);
  const n=Math.max(16,Math.ceil(curve.getLength()/2)),v=[],uv=[],indices=[],edges=[];
  for(let i=0;i<=n;i++){
   const t=i/n,p=curve.getPoint(t),dir=curve.getTangent(t);
   const width=3.75+(Math.sin(t*12)*.18);
   const side=new T.Vector3(-dir.z,0,dir.x).normalize();
   v.push(p.x+side.x*width,p.y,p.z+side.z*width,p.x-side.x*width,p.y,p.z-side.z*width);
   uv.push(i/4,0,i/4,1);
   edges.push({x:p.x,z:p.z});
   if(i<n){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(v,3));
  g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  let mesh=new T.Mesh(g,material(0xd9c7a6,{side:T.DoubleSide}));mesh.receiveShadow=true;scene.add(mesh);
  routeSegments.push({a,b,name,points:edges});
  // Decorative timber path markers at intervals.
  const center=curve.getPoint(.5);if(Math.hypot(center.x,center.z)>58){
    cyl(scene,center.x,1,center.z+6,.11,.15,2,0x83644d);
    cube(scene,center.x,2.05,center.z+6,3,.9,.22,0x9a734e);
    markerLabel(name,center.x,center.z+6,3.5,3.8);
  }
 }
 for(const [a,b,name] of ROUTES)road(lookup[a],lookup[b],name);
 function nearbyRoad(x,z,min=6){
  for(const seg of routeSegments){
   if(Math.min(Math.abs(x-seg.a.x)+Math.abs(z-seg.a.z),Math.abs(x-seg.b.x)+Math.abs(z-seg.b.z))<min)return true;
   for(let i=0;i<seg.points.length;i+=4){const p=seg.points[i];if(Math.hypot(x-p.x,z-p.z)<min)return true;}
  }
  return false;
 }
 const withinCity=(x,z,dist=0)=>PLACES.some(t=>Math.hypot(x-t.x,z-t.z)<t.radius+dist);
 function plaza(city){
  const {x,z,radius,type}=city;
  if(type==="home"||type==="town")return;
  let groundColor=type==="snow"?0xecf3f4:type==="city"?0xc8b9a5:type==="mining"?0xc3b39e:
    type==="coastal"?0xded6b5:type==="flower"?0xe4d6bf:type==="old"?0xccc7a8:0xcfccad;
  cube(scene,x,.035,z,radius*1.56,.055,radius*1.36,groundColor,false);
  cube(scene,x,.067,z,radius*1.48,.025,5.4,type==="snow"?0xd5e2e7:0xe5d0af,false);
  cube(scene,x,.067,z,5.4,.025,radius*1.26,type==="snow"?0xd5e2e7:0xe5d0af,false);
  // A central landmark to make every city visibly distinct at a glance.
  if(type==="flower"){for(let i=0;i<12;i++){const an=i*Math.PI/6;
     sphere(scene,x+Math.cos(an)*6,.8,z+Math.sin(an)*6,.72,[0xf7a4c5,0xffe3aa,0xd7a5d5][i%3],1);
     cyl(scene,x+Math.cos(an)*6,.45,z+Math.sin(an)*6,.13,.15,.8,0x569467);}
    cyl(scene,x,1,z,1.2,1.6,2,0x7fa776,12);
    sphere(scene,x,3,z,1.65,0xfbd1a2,2);
  }else if(type==="mining"){
    cyl(scene,x,1,z,2,2.1,2,0x746761,10);
    cyl(scene,x,4,z,.65,.82,4,0x56545b,10);
    for(let i=0;i<8;i++)sphere(scene,x+Math.cos(i)*4,.4,z+Math.sin(i)*3,1,0x85868a,1);
  }else if(type==="snow"){
    cyl(scene,x,1,z,2,2.1,2.1,0xc1d9e4,12);
    sphere(scene,x,3.1,z,1.35,0xffffff,2);
    cyl(scene,x,5.2,z,.22,.65,3.6,0xc6edf7,8);
  }else if(type==="coastal"||type==="marsh"){
    cyl(scene,x,.32,z,4.4,4.4,.62,0xf8e7c7,18);
    cyl(scene,x,.40,z,3.4,3.4,.26,0x88b7c1,18);
    const water=new T.Mesh(new T.CylinderGeometry(3.2,3.2,.12,24),material(0x72c7d1,{roughness:.25,metalness:.05}));
    water.position.set(x,.57,z);scene.add(water);
    for(let i=0;i<4;i++)sphere(scene,x+Math.cos(i*Math.PI/2)*2.7,.91,z+Math.sin(i*Math.PI/2)*2.7,.18,0xddf8f5);
    animated.push({kind:"water",object:water,base:.57,seed:random()*10});
  }else{
    cyl(scene,x,.65,z,3.2,3.7,1.3,0xe3d6bf,14);
    cyl(scene,x,1.45,z,2.1,2.1,.45,0xb6c0bb,14);
    sphere(scene,x,2.35,z,1.32,type==="old"?0x6da47a:0x7bb8cc,2);
    cyl(scene,x,3.7,z,.21,.31,1.2,0xe2e7dc,7);
    sphere(scene,x,4.45,z,.65,0xffe8a4,2);
  }
 }
 function building(city,i){
  const {x:cx,z:cz,type,radius}=city;
  const angle=i/(type==="city"?13:10)*Math.PI*2,rad=radius*.79;
  const x=cx+Math.cos(angle)*rad,z=cz+Math.sin(angle)*rad;
  if(nearbyRoad(x,z,3))return;
  const root=new T.Group();root.position.set(x,0,z);root.rotation.y=-angle-Math.PI/2;scene.add(root);
  const large=type==="city"||type==="mining";
  const width=5.5+random()*2.5,depth=5.7+random()*2,height=3.6+(large?random()*5:random()*1.8);
  const walls=type==="snow"?[0xf0f1eb,0xe2e9f0]:type==="city"?[0xc8d3dc,0xdce0d7,0xe3d5c6]:
   type==="coastal"?[0xf6dfb8,0xe3e5d6]:[0xe9d8b2,0xf0e0c7,0xcac0a5];
  const roof=type==="snow"?0x647b8b:type==="city"?0x58748b:type==="flower"?0x9f799b:
    type==="mining"?0x6e636b:type==="coastal"?0x558eab:[0xa86158,0x6a8a64,0x82766c][i%3];
  cube(root,0,.18,0,width+.55,.36,depth+.5,0xb6aaa0);
  cube(root,0,height/2+.32,0,width,height,depth,walls[i%walls.length]);
  cube(root,0,height+.35,0,width+.45,.30,depth+.45,roof);
  const roofLeft=cube(root,-width*.25,height+.95,0,width*.57,.25,depth+.85,roof);
  const roofRight=cube(root,width*.25,height+.95,0,width*.57,.25,depth+.85,roof);
  roofLeft.rotation.z=-.45;roofRight.rotation.z=.45;
  // Painted timber porch, door and lit windows.
  cube(root,0,1.14,depth*.5+.17,1.48,2.25,.20,0x715744);
  cube(root,0,1.19,depth*.5+.31,1.25,1.95,.18,0xac8662);
  sphere(root,.44,1.13,depth*.5+.48,.07,0xefdaa0,1);
  cube(root,0,.1,depth*.5+1.0,2.5,.16,1.4,0xd4b99c);
  for(let side of [-1,1]){
    const ex=side*(width*.31);
    cube(root,ex,height*.6,depth*.5+.18,1.35,1.30,.22,0xf5eee0);
    cube(root,ex,height*.6,depth*.5+.34,1.10,1.06,.10,0x9fd7d4);
    cube(root,ex,height*.6,depth*.5+.4,.08,1.08,.12,0xf7f2d8);
    cube(root,ex,height*.6,depth*.5+.4,1.1,.08,.12,0xf7f2d8);
  }
  for(let j=0;j<Math.max(0,Math.floor((height-4)/2));j++)for(const side of [-1,1]){
     const ex=side*(width*.28);
     cube(root,ex,3.65+j*2,depth*.5+.16,.9,1.1,.16,0xdff6df);
     cube(root,ex,3.65+j*2,depth*.5+.27,.70,.9,.10,0x8ed6d9);
  }
  if(i%3===0){cube(root,-width*.27,height+1.24,-depth*.24,.55,1.35,.75,0xb78369);
    cube(root,-width*.27,height+1.95,-depth*.24,.8,.17,.95,roof);}
  const dx=0,dz=depth*.5+1.25;
  const worldDoor=new T.Vector3(dx,0,dz).applyMatrix4((root.updateMatrixWorld(true),root.matrixWorld));
  const uid=city.id+"-"+i;
  let room="cottage";
  if(i===1||i===7)room="center";
  else if(i===2||i===8)room="mart";
  else if(i===3&&["oreburgh","eterna","hearthome","veilstone","pastoria","sunyshore","snowpoint","canalave"].includes(city.id))room="gym";
  else if(i===4)room="cottage";
  // Unique portal id, shared interior type; store exact entrance for returning to city.
  world.portals.push({kind:"door",name:"Entrar · "+(room==="center"?"Centro Pokémon":room==="mart"?"Tienda Pokémon":room==="gym"?"Gimnasio":"Casa"),id:uid,room,x:worldDoor.x,z:worldDoor.z,exitX:worldDoor.x-Math.cos(angle)*1.3,exitZ:worldDoor.z-Math.sin(angle)*1.3,city:city.name});
  world.obstacles.push({kind:"building",x,z,w:width/2,d:depth/2});
  if(i===1||i===2||i===3){
   const txt=i===1?"CENTRO POKÉMON":i===2?"POKÉ MART":room==="gym"?"GIMNASIO":"HOTEL";
   markerLabel(txt,x,z,height+3.2,4.7);
  }
  return {x,z};
 }
 // Town districts and their monuments are populated only beyond the first area.
 for(const city of PLACES){plaza(city);if(city.type==="home"||city.type==="town")continue;
  const buildings=city.type==="city"?13:city.type==="snow"?10:11;
  for(let i=0;i<buildings;i++)building(city,i);
  markerLabel(city.name.toUpperCase(),city.x,city.z,10.6,11);
  districts.push(city);
 }
 // Multiple flora palettes for spring, snow, mountains and salt marshes.
 function createTrees(){
  const trees=[],snowTrees=[];
  for(let i=0;i<1150;i++){
   const x=-170+random()*650,z=-475+random()*560;
   if(Math.abs(x)<58&&z>-65&&z<56)continue;
   if(withinCity(x,z,9)||nearbyRoad(x,z,7))continue;
   const nearSnow=z<-365||(z<-290&&x<130);
   (nearSnow?snowTrees:trees).push({x,z,s:.7+random()*.7});
  }
  function instanced(data,snow){
    if(!data.length)return;
    const trunkGeo=new T.CylinderGeometry(.22,.31,2.25,5);
    const leafGeo=new T.IcosahedronGeometry(1.6,1);
    const branchGeo=new T.ConeGeometry(1.7,3.5,6);
    const trunk=new T.InstancedMesh(trunkGeo,material(0x82654b),data.length);
    const foliage=new T.InstancedMesh(snow?branchGeo:leafGeo,material(snow?0xddebe2:0x478f69),data.length);
    const crown=new T.InstancedMesh(snow?branchGeo:leafGeo,material(snow?0xf2f6f0:0x7cb77c),data.length);
    const temp=new T.Object3D();
    for(let i=0;i<data.length;i++){
      const p=data[i];temp.position.set(p.x,p.s*1.1,p.z);temp.scale.setScalar(p.s);temp.rotation.y=random()*6.28;temp.updateMatrix();trunk.setMatrixAt(i,temp.matrix);
      temp.position.y=p.s*3;temp.rotation.y=random()*6.28;temp.updateMatrix();foliage.setMatrixAt(i,temp.matrix);
      temp.position.set(p.x+(.3-random()*.6),p.s*(snow?4.1:3.9),p.z);temp.scale.setScalar(p.s*(snow?.63:.72));temp.updateMatrix();crown.setMatrixAt(i,temp.matrix);
    }
    trunk.instanceMatrix.needsUpdate=foliage.instanceMatrix.needsUpdate=crown.instanceMatrix.needsUpdate=true;
    foliage.frustumCulled=false;crown.frustumCulled=false;trunk.frustumCulled=false;
    trunk.castShadow=false;foliage.castShadow=false;crown.castShadow=false;
    scene.add(trunk,foliage,crown);
  }
  instanced(trees,false);instanced(snowTrees,true);
 }
 createTrees();
 function flowers(){
  const n=1300,geometry=new T.ConeGeometry(.10,.32,4),materials=[0xffde85,0xf5a3c8,0xa9c4f1,0xffffff].map(c=>material(c));
  const inst=materials.map(m=>new T.InstancedMesh(geometry,m,Math.ceil(n/4)));
  const counts=[0,0,0,0],tmp=new T.Object3D();
  for(let i=0;i<n;i++){let city=random()>.5?lookup.floaroma:lookup.eterna; // fallback for exact key
    city=city||lookup.eterna;
    const angle=random()*6.283,rad=city.radius+5+random()*35;
    const x=city.x+Math.cos(angle)*rad,z=city.z+Math.sin(angle)*rad;
    if(nearbyRoad(x,z,4)||withinCity(x,z))continue;
    const k=i%4;tmp.position.set(x,.17,z);tmp.scale.setScalar(.7+random()*.8);tmp.rotation.y=random()*6.28;tmp.updateMatrix();inst[k].setMatrixAt(counts[k]++,tmp.matrix);
  }
  for(let i=0;i<inst.length;i++){inst[i].count=counts[i];inst[i].instanceMatrix.needsUpdate=true;scene.add(inst[i]);}
 }
 flowers();
 // Snow peaks and Oreburgh mining rocks enhance different biomes.
 for(let i=0;i<75;i++){
  const snow=random()<.58,x=snow?lookup.snowpoint.x+(random()-.5)*105:lookup.oreburgh.x+(random()-.5)*105;
  const z=snow?lookup.snowpoint.z+(random()-.5)*85:lookup.oreburgh.z+(random()-.5)*90;
  if(withinCity(x,z,5)||nearbyRoad(x,z,5))continue;
  const h=snow?3+random()*12:1.3+random()*4.2;
  const mesh=new T.Mesh(new T.ConeGeometry(h*.52,h,snow?5:7),material(snow?0xd7e6ec:0x908879,{flatShading:true}));
  mesh.position.set(x,h*.5,z);mesh.castShadow=true;scene.add(mesh);
  if(snow){let cap=new T.Mesh(new T.ConeGeometry(h*.23,h*.41,5),material(0xfafdf8));
    cap.position.set(x,h*.89,z);scene.add(cap);}
 }
 // Route signposts and trainers provide actual world interactions.
 const npcData=[
  ["ENTRENADOR LEO",62,-109,"trainer","Starly"],["MINERO TOMÁS",115,-125,"trainer","Geodude"],
  ["DOMADORA ELENA",69,-236,"trainer","Budew"],["PESCADOR RAÚL",246,-160,"trainer","Magikarp"],
  ["ESCALADOR JULIÁN",138,-310,"trainer","Machop"],["NIÑA DE LAS FLORES",-26,-200,"talk",""],
  ["GUÍA DE JUBILEO",14,-100,"talk",""],["VECINO DE CANAL",-105,-96,"talk",""],
  ["CHICA DE SOSIEGO",229,-244,"talk",""],["REPORTERO",323,-268,"talk",""],
  ["LÍDER ROCO",148,-111,"gymLeader","Cranidos"],["LÍDER GARDENIA",66,-276,"gymLeader","Roselia"],
  ["LÍDER FANTINA",149,-224,"gymLeader","Mismagius"],["LÍDER MAYLENE",332,-292,"gymLeader","Lucario"],
  ["LÍDER MANANTI",253,-112,"gymLeader","Floatzel"],["LÍDER BYRON",-110,-119,"gymLeader","Bastiodon"],
  ["LÍDER INVERNA",93,-438,"gymLeader","Abomasnow"],["LÍDER ELECTRO",397,-137,"gymLeader","Luxray"]
 ];
 const colors=[0xdd9a6b,0x7aa3bf,0x9ac48b,0xc4a1d4,0xd3a664,0xa9cdd4];
 for(let i=0;i<npcData.length;i++){
  const [name,x,z,kind,pokemon]=npcData[i];const root=new T.Group();root.position.set(x,0,z);scene.add(root);
  cyl(root,0,.86,0,.48,.45,1.3,colors[i%colors.length]);
  sphere(root,0,1.84,0,.49,0xf0c199,2);
  sphere(root,0,2.16,-.1,.5,i%2?0x3f3c43:0x956038,1);
  sphere(root,-.19,1.92,.38,.055,0x17252f);
  sphere(root,.19,1.92,.38,.055,0x17252f);
  for(const s of [-1,1])cube(root,s*.53,1.1,0,.24,.82,.3,colors[i%colors.length]);
  const n={name,x,z,kind,pokemon,model:{root,rig:root,walk:(t,moving)=>{root.position.y=Math.sin(t*1.8+i)*.035;}}};
  world.npcs.push(n);
  markerLabel(name,x,z,3.55,4.7);
 }
 // Roaming Pokémon: animated creatures on the routes, with real encounter triggers.
 const wildlife=[];
 const creatures=[
  ["Starly",396],["Bidoof",399],["Shinx",403],["Kricketot",401],
  ["Budew",406],["Geodude",74],["Machop",66],["Roselia",315],
  ["Magikarp",129],["Psyduck",54],["Buizel",418],["Pachirisu",417],
  ["Zubat",41],["Ponyta",77],["Gible",443],["Snover",459],["Buneary",427],
  ["Drifloon",425],["Shellos",422],["Croagunk",453],["Bronzor",436],["Riolu",447],
  ["Combee",415],["Cherubi",420],["Sneasel",215]
 ];
 const spriteCache=new Map(),textureLoader=new T.TextureLoader();
 textureLoader.setCrossOrigin("anonymous");
 for(const [species,id] of creatures){
   textureLoader.load("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+id+".png",tex=>{
      tex.colorSpace=T.SRGBColorSpace;
      spriteCache.set(species,tex);
      for(const mon of wildlife)if(mon.name===species){
        mon.sprite.material.map=tex;mon.sprite.material.needsUpdate=true;mon.sprite.visible=true;
      }
   },undefined,()=>{});
 }
 for(let i=0;i<215;i++){
   const zone=PLACES[2+Math.floor(random()*(PLACES.length-2))];
   const angle=random()*6.283,rad=zone.radius+9+random()*48;
   const x=zone.x+Math.cos(angle)*rad,z=zone.z+Math.sin(angle)*rad;
   if(nearbyRoad(x,z,5)||withinCity(x,z,7))continue;
   let selected=creatures[Math.floor(random()*creatures.length)];
   if(zone.type==="snow")selected=random()>.4?["Snover",459]:["Sneasel",215];
   if(zone.type==="flower")selected=random()>.45?["Cherubi",420]:["Combee",415];
   if(zone.type==="mining")selected=random()>.45?["Geodude",74]:["Zubat",41];
   if(zone.type==="coastal")selected=random()>.4?["Buizel",418]:["Shellos",422];
   if(zone.type==="marsh")selected=random()>.4?["Croagunk",453]:["Psyduck",54];
   const [name,pokedex]=selected;
   const root=new T.Group();root.position.set(x,0,z);scene.add(root);
   const shadow=new T.Mesh(new T.CircleGeometry(.68,20),new T.MeshBasicMaterial({color:0x284d40,transparent:true,opacity:.2,depthWrite:false}));
   shadow.rotation.x=-Math.PI/2;shadow.position.y=.045;root.add(shadow);
   const spr=new T.Sprite(new T.SpriteMaterial({map:spriteCache.get(name)||null,transparent:true,depthWrite:false,alphaTest:.04}));
   spr.position.set(0,1.18,0);spr.scale.set(2.35,2.35,1);spr.visible=!!spriteCache.get(name);root.add(spr);
   wildlife.push({name,pokedex,root,sprite:spr,shadow,anchorX:x,anchorZ:z,phase:random()*6.28,velocity:.3+random()*.3});
   world.spots.push({name:"Pokémon salvaje · "+name,x,z,kind:"wildPokemon",pokemon:name});
 }
 // A compact visual tag for region boundaries.
 for(const city of PLACES){
   if(city.id==="twinleaf"||city.id==="sandgem")continue;
   for(let a=0;a<8;a++){
    const angle=Math.PI*2*a/8,rr=city.radius*.9;
    const x=city.x+Math.cos(angle)*rr,z=city.z+Math.sin(angle)*rr;
    if(nearbyRoad(x,z,3))continue;
    cyl(scene,x,.68,z,.13,.15,1.3,0xf0f0df);
    sphere(scene,x,1.49,z,.27,city.type==="snow"?0xdceff3:0xf3d0a3,1);
   }
 }
 function inGrass(x,z){
  if(withinCity(x,z,-3)||nearbyRoad(x,z,3.3))return false;
  if(x>-180&&x<480&&z<-46&&z>-480)return true;
  return world.grassAt(x,z);
 }
 function where(x,z){
   let nearest=null,dist=Infinity;
   for(const city of PLACES){const d=Math.hypot(x-city.x,z-city.z);if(d<dist){dist=d;nearest=city;}}
   if(dist<nearest.radius+8)return nearest.name;
   for(const r of routeSegments){for(let i=0;i<r.points.length;i+=6){let p=r.points[i];if(Math.hypot(x-p.x,z-p.z)<13)return r.name;}}
   return nearest.name+" · Afueras";
 }
 function tick(t){
   for(const a of animated)if(a.kind==="water")a.object.position.y=a.base+Math.sin(t*.75+a.seed)*.035;
   for(const a of wildlife){const stride=t*a.velocity+a.phase;
     a.root.position.x=a.anchorX+Math.sin(stride)*1.25;
     a.root.position.z=a.anchorZ+Math.cos(stride*.7)*.7;
     a.sprite.position.y=1.18+Math.abs(Math.sin(t*2.6+a.phase))*.20;
     a.shadow.scale.setScalar(.9+Math.sin(t*2.6+a.phase)*.07);
   }
 }
 return {places:PLACES,routes:ROUTES,lookup,routeSegments,wildlife,where,inGrass,tick,bounds:{minX:-175,maxX:480,minZ:-475,maxZ:90},nearbyRoad};
}
