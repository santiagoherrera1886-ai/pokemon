// Original procedural 3D world for the Sinnoh Reborn fan prototype.
export function buildWorld(T, scene) {
  let seed = 12873;
  function rng(){ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }
  const materialCache=new Map();function mat(c, roughness=1, metalness=0){const key=c+'-'+roughness+'-'+metalness;if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color:c,roughness,metalness}));return materialCache.get(key);}
  const grassMat=mat(0x7eaf69), pathMat=mat(0xd8c3a0), wood=mat(0x85543b), paleWood=mat(0xb47a55), rockMat=mat(0xa8b4a0);
  const obstacles=[], npcs=[], spots=[], portals=[], leaves=[], clouds=[], animated=[], butterflies=[];
  function mesh(geo, material, parent=scene,x=0,y=0,z=0,cast=true,receive=true){
    const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=receive;parent.add(m);return m;
  }
  function box(parent,w,h,d,color,x,y,z){return mesh(new T.BoxGeometry(w,h,d),typeof color==="number"?mat(color):color,parent,x,y,z);}
  function sphere(parent,r,color,x,y,z,detail=1){return mesh(new T.IcosahedronGeometry(r,detail),typeof color==="number"?mat(color):color,parent,x,y,z);}
  function cyl(parent,r1,r2,h,color,x,y,z,seg=8){return mesh(new T.CylinderGeometry(r1,r2,h,seg),typeof color==="number"?mat(color):color,parent,x,y,z);}
  function patch(x,z,sx,sz,c){const m=mesh(new T.CircleGeometry(1,25),mat(c),scene,x,.012,z,false,false);m.rotation.x=-Math.PI/2;m.scale.set(sx,sz,1);return m;}
  function glowSprite(color, size, y, root){const t=document.createElement("canvas");t.width=t.height=128;const a=t.getContext("2d");const g=a.createRadialGradient(64,64,3,64,64,62);g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.28,color);g.addColorStop(1,"rgba(255,255,255,0)");a.fillStyle=g;a.fillRect(0,0,128,128);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(t),transparent:true,depthWrite:false}));sp.scale.set(size,size,1);sp.position.y=y;root.add(sp);return sp;}
  function label(name,root,y=4.2){const c=document.createElement("canvas");c.width=512;c.height=128;const a=c.getContext("2d");a.fillStyle="rgba(20,38,57,.90)";a.beginPath();a.roundRect(9,18,494,85,35);a.fill();a.strokeStyle="#ffffff70";a.lineWidth=4;a.stroke();a.fillStyle="#fff8e8";a.font="bold 38px sans-serif";a.textAlign="center";a.fillText(name,256,73);const texture=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));s.scale.set(3.4,.85,1);s.position.y=y;root.add(s);return s;}
  // Faded textured grass across the whole world: no tiled checkerboard.
  const cv=document.createElement("canvas");cv.width=cv.height=512;const cx=cv.getContext("2d");cx.fillStyle="#90bd75";cx.fillRect(0,0,512,512);
  for(let i=0;i<6500;i++){const x=rng()*512,y=rng()*512,r=rng()*3+.5;cx.fillStyle=i%2?"rgba(29,82,39,.06)":"rgba(248,236,158,.06)";cx.fillRect(x,y,r,r*2);}
  const grassTex=new T.CanvasTexture(cv);grassTex.wrapS=grassTex.wrapT=T.RepeatWrapping;grassTex.repeat.set(10,10);grassTex.colorSpace=T.SRGBColorSpace;
  mesh(new T.PlaneGeometry(120,120),new T.MeshStandardMaterial({map:grassTex,roughness:1}),scene,0,-.04,0,false,true).rotation.x=-Math.PI/2;
  // Paved lanes cut through town and toward Lake Verity.
  function lane(x,z,w,d){box(scene,w,.045,d,pathMat,x,.007,z);const strips=Math.max(5,Math.floor(w*d/13));for(let i=0;i<strips;i++){let xx=x+(rng()-.5)*w*.9,zz=z+(rng()-.5)*d*.9;const s=patch(xx,zz,.13+rng()*.38,.08+rng()*.23,i%2?0xd3b995:0xe0cda9);s.position.y=.034;}}
  lane(-.5,2,5.7,81);lane(-15,14,37,4.6);lane(-15,-19,33,4.4);lane(21,-16,42,5.4);lane(29,-27,5.4,22);
  for(let i=0;i<120;i++){let x=(rng()-.5)*84,z=(rng()-.5)*84;if(rng()<.7&&Math.abs(x)<5)continue;patch(x,z,1+rng()*3,.45+rng()*2,rng()<.5?0x87b86b:0x8bb873);}
  // Lakeside with water, shoreline and a small wooden pier.
  patch(-27,-31,12,8.6,0xd1ca9b);
  const lake=patch(-27,-31,11.2,7.7,0x70bec8);lake.position.y=.037;
  const lakeInner=patch(-27,-31,9.5,6.5,0x83d7d5);lakeInner.position.y=.043;lakeInner.material=new T.MeshStandardMaterial({color:0x7cced0,metalness:.22,roughness:.19,transparent:true,opacity:.93});
  for(let i=0;i<13;i++){const x=-27+(rng()-.5)*16,z=-31+(rng()-.5)*9;const m=mesh(new T.TorusGeometry(.3+rng()*.55,.035,6,34),new T.MeshBasicMaterial({color:0xdbffff,transparent:true,opacity:.42}),scene,x,.085,z,false,false);m.rotation.x=Math.PI/2;animated.push({kind:"ripple",obj:m,t:rng()*9});}
  for(let i=0;i<8;i++)box(scene,1.7,.24,2.7,0xb78c61,-15.8+i*.45,.15,-30.7);
  for(let i=0;i<18;i++){const angle=rng()*Math.PI*2;const x=-27+Math.cos(angle)*11,z=-31+Math.sin(angle)*8;const stone=sphere(scene,.25+rng()*.55,rng()<.5?0xb8b7a8:0x849d8a,x,.17,z);stone.scale.y=.5;}
  // Houses with visible walls, sloped roofs, balconies and trim.
  function house(x,z,wall,roof,w=6.2,d=5.7,name=null,id='cottage'){
    const root=new T.Group();root.position.set(x,0,z);scene.add(root);
    box(root,w+.35,.4,d+.4,0xb7ab97,0,.21,0);
    box(root,w,3.4,d,wall,0,1.95,0);
    box(root,w+.12,.17,d+.12,0xf7e8c8,0,3.57,0);
    const roofMat=mat(roof), ridgeY=4.15;
    let a=box(root,w*.60,.23,d+.95,roofMat,-w*.25,ridgeY,0);a.rotation.z=-.52;
    a=box(root,w*.60,.23,d+.95,roofMat,w*.25,ridgeY,0);a.rotation.z=.52;
    box(root,w*.95,.26,.2,roofMat,0,4.96,0);
    box(root,1.35,2.08,.22,0x735642,0,1.35,d/2+.16);
    box(root,1.02,1.7,.23,0xc48c67,0,1.3,d/2+.29);
    sphere(root,.075,0xe8d499,.38,1.35,d/2+.43,2);
    for(const v of [-1,1]){box(root,1.18,1.20,.17,0xf7f0d5,v*(w*.31),2.36,d/2+.12);box(root,1.01,1.04,.18,0xa1e5e9,v*(w*.31),2.36,d/2+.25);box(root,.11,1.17,.21,0xf8f7dd,v*(w*.31),2.36,d/2+.34);box(root,1.18,.11,.2,0xf8f7dd,v*(w*.31),2.36,d/2+.34);}
    box(root,1.18,1.25,.12,0xf6e5c4,w/2+.12,2.3,0);
    box(root,1.02,1.08,.14,0x9fdde0,w/2+.21,2.3,0);
    box(root,.35,1.7,.5,0xe5c0a1,w*.25,4.7,-d*.2);
    box(root,.52,.15,.68,roofMat,w*.25,5.6,-d*.2);
    box(root,2,.17,1.25,0xd8c3a6,0,.11,d/2+.7);
    if(name){const l=label(name,root,6.5);l.scale.multiplyScalar(.84);}
    obstacles.push({x,z,r:Math.max(w,d)*.57+0.9,w:w/2+.65,d:d/2+.65,kind:'building'});portals.push({kind:'door',id,name:'Entrar: '+(name||'Casa'),x,z:z+d/2+1.12,doorZ:z+d/2+.15,exitZ:z+d/2+2.05});return root;
  }
  house(-17,13,0xf8e2b7,0xc56c5e,7,6.2,"CASA DE BARRY","barry");
  house(12,13,0xf1daa8,0x557baf,7,6.2,"TU CASA","home");
  house(-17,-1,0xf2e9ce,0x9a775a,6.4,5.5,"CASA DEL VECINO","cottage");
  house(13,-1,0xfbe3c0,0x96646c,6.8,6.0,"CASA DEL JARDINERO","cottage");
  house(24,-29,0xe4e3d4,0x4a8d8a,8.7,7.5,"LABORATORIO","lab");
  house(36,-29,0xf3e2ca,0xc47756,5.5,5.1,"CASA","cottage");
  // Fence lines and garden gates.
  function fence(x1,z1,x2,z2,steps){for(let i=0;i<=steps;i++){const x=x1+(x2-x1)*i/steps,z=z1+(z2-z1)*i/steps;box(scene,.18,.9,.18,0xf8edcd,x,.45,z);box(scene,.3,.13,.32,0xf4e7bd,x,.95,z);}
    if(Math.abs(x1-x2)>Math.abs(z1-z2)){box(scene,Math.abs(x2-x1),.13,.12,0xf8efdc,(x1+x2)/2,.43,z1);box(scene,Math.abs(x2-x1),.12,.12,0xf8efdc,(x1+x2)/2,.7,z1);}
    else{box(scene,.12,.13,Math.abs(z2-z1),0xf8efdc,x1,.43,(z1+z2)/2);box(scene,.12,.12,Math.abs(z2-z1),0xf8efdc,x1,.7,(z1+z2)/2);}}
  fence(-24,8,-20,8,5);fence(-14,8,-11,8,4);fence(7,8,10,8,4);fence(15,8,19,8,5);
  // Tall trees are sculpted from different green low-poly canopies.
  const greens=[0x39885e,0x48986b,0x3a995a,0x64aa6e,0x77b46c,0x2c8058];
  function tree(x,z,scale=1){const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(scale);scene.add(root);
    const trunk=cyl(root,.23,.34,2.2,0x825b43,0,1.1,0,7);trunk.castShadow=true;
    const c=greens[Math.floor(rng()*greens.length)];
    sphere(root,1.6,c,0,3.1,0,1);sphere(root,1.17,greens[Math.floor(rng()*greens.length)],-.58,2.65,.42,1);
    sphere(root,1.18,c,.58,2.8,-.25,1);sphere(root,1.04,0x75bd78,0,3.9,.12,1);
    obstacles.push({x,z,r:1.05*scale});leaves.push({root,t:rng()*6});return root;}
  // Ecological border; deliberate gap for paths, lake and village.
  for(let i=0;i<160;i++){const x=(rng()-.5)*87,z=(rng()-.5)*87;let blocked=false;
    for(const o of obstacles){if(Math.hypot(x-o.x,z-o.z)<o.r+2.7)blocked=true;}
    if(Math.abs(x)<5.7 && z>-39 && z<30)blocked=true;
    if(Math.abs(z-14)<5.3 && x>-26 && x<23)blocked=true;
    if(Math.abs(z+19)<5 && x>-32 && x<12)blocked=true;
    if(Math.abs(z+16)<5.5&&x>0)blocked=true;
    if(x>19&&x<40&&z>-34&&z<-21)blocked=true;
    if(Math.hypot((x+27)/1.2,(z+31)/.8)<11.5)blocked=true;
    if(Math.abs(x)<12&&z>8&&z<25)blocked=true;
    if(!blocked&&rng()>.09)tree(x,z,.75+rng()*.48);
  }
  for(let i=0;i<35;i++){let x=(rng()-.5)*74,z=(rng()-.5)*76;if(Math.abs(x)<4.1||Math.abs(z-14)<3||Math.hypot(x+27,z+31)<12)continue;const r=sphere(scene,.15+rng()*.25,rockMat,x,.13,z);r.scale.y=.4;}
  // Flowers and grass; grass is taller on the routes for encounters.
  const wildZones=[{x:10,z:-11,w:14,h:15},{x:13,z:-33,w:15,h:11},{x:-17,z:-12,w:12,h:8},{x:35,z:-13,w:8,h:13},{x:-2,z:-38,w:13,h:8}];
  function grassAt(x,z){return wildZones.some(q=>Math.abs(x-q.x)<q.w/2&&Math.abs(z-q.z)<q.h/2);}
  function grassTuft(x,z,wild){const g=new T.Group();g.position.set(x,0,z);scene.add(g);const h=wild?.65:.32;
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const leaf=mesh(new T.ConeGeometry(wild?.17:.10,h,3),mat(wild?[0x399954,0x4b9f49,0x2d8d59][i]:0x73a95e),g,Math.cos(a)*.17,h*.5,Math.sin(a)*.17,false,false);leaf.rotation.z=(rng()-.5)*.38;}
    if(wild)animated.push({kind:"grass",obj:g,t:rng()*7});}
  for(const zone of wildZones){for(let i=0;i<95;i++){const x=zone.x+(rng()-.5)*zone.w,z=zone.z+(rng()-.5)*zone.h;if(obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+0.4))continue;grassTuft(x,z,true);}}
  for(let i=0;i<270;i++){const x=(rng()-.5)*78,z=(rng()-.5)*78;if(grassAt(x,z)||Math.abs(x)<3||Math.abs(z-14)<2.6)continue;if(rng()<.65){grassTuft(x,z,false);}else{const c=[0xf7e2aa,0xf9b3b1,0xfbf6db,0xb9d5ff][Math.floor(rng()*4)];cyl(scene,.024,.025,.24,0x559a59,x,.13,z,4);sphere(scene,.11,c,x,.29,z,1);}}
  // Streetlamps and bench details.
  function lamp(x,z){const root=new T.Group();root.position.set(x,0,z);scene.add(root);cyl(root,.1,.16,3.3,0x4c6871,0,1.65,0,7);box(root,.65,.22,.65,0x304c57,0,3.22,0);box(root,.49,.65,.48,0xffebb5,0,3.66,0);box(root,.72,.15,.72,0x315365,0,4.03,0);glowSprite("rgba(255,233,150,.28)",3,3.7,root);}
  for(const p of [[-7,10],[5,8],[-7,-5],[5,-19],[25,-16],[21,-35]])lamp(p[0],p[1]);
  function bench(x,z){const root=new T.Group();root.position.set(x,0,z);scene.add(root);for(let i=0;i<3;i++)box(root,2.4,.12,.29,paleWood,0,.7,(i-1)*.29);box(root,2.4,.65,.18,paleWood,0,1.15,-.47);for(const a of [-.9,.9])box(root,.12,.62,.58,wood,a,.34,0);}
  bench(-7,22);bench(9,23);
  // Character models with face, hat, arms, boots and shadows.
  function person(x,z,shirt=0x447ac0,hat=0xc94b55,skin=0xf1bf92,scale=1.0){
    const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(scale);scene.add(root);
    const shadow=mesh(new T.CircleGeometry(.65,24),new T.MeshBasicMaterial({color:0x234e3d,transparent:true,opacity:.17,depthWrite:false}),root,0,.034,0,false,false);shadow.rotation.x=-Math.PI/2;
    const rig=new T.Group();root.add(rig);
    // torso, jacket and collar
    const torso=box(rig,.96,1.02,.59,shirt,0,1.36,0);torso.rotation.x=.04;
    box(rig,.38,.62,.64,0xeff7ee,0,1.3,.01);
    cyl(rig,.24,.22,.20,skin,0,2.0,0,9);
    sphere(rig,.54,skin,0,2.32,0,2);
    for(const a of [-1,1]){sphere(rig,.075,0x1b3039,a*.22,2.33,.48,2);sphere(rig,.023,0xffffff,a*.22-.018,2.35,.535,1);}
    const hair=mesh(new T.SphereGeometry(.56,10,8,0,Math.PI*2,0,Math.PI*.57),mat(0x252c37),rig,0,2.56,-.035);
    const cap=cyl(rig,.62,.65,.27,hat,0,2.77,0,10);cap.scale.z=1.05;
    box(rig,1.02,.11,.36,hat,0,2.72,.43);
    const arms=[];
    for(const a of [-1,1]){const pivot=new T.Group();pivot.position.set(a*.58,1.77,0);rig.add(pivot);const arm=box(pivot,.29,.72,.32,shirt,0,-.38,0);sphere(pivot,.18,skin,0,-.77,0,1);arms.push(pivot);
      const leg=box(rig,.33,.69,.37,0x334b66,a*.22,.55,0);box(rig,.36,.22,.56,0xf0f0f2,a*.22,.13,.11);}
    box(rig,.52,.73,.19,0xdeb658,0,1.35,-.43);
    return {root,rig,arms,walk(t,moving){rig.position.y=moving?Math.sin(t*11)*.08:Math.sin(t*2.5)*.035;arms[0].rotation.x=moving?Math.sin(t*11)*.55:0;arms[1].rotation.x=moving?-Math.sin(t*11)*.55:0;}};}
  const hero=person(-6,21,0x355eaf,0xd64d52,0xf4c69b,1.02);
  function actor(name,x,z,color,hat,kind,face){const p=person(x,z,color,hat,0xebc09c,.97);p.root.rotation.y=face||0;label(name,p.root,4);npcs.push({name,x,z,kind,model:p});return p;}
  actor("BARRY",-3,12.1,0xe7ac47,0xecb64d,"barry",-1);
  actor("PROF. SERBAL",-21.4,-20.4,0xeeeeea,0xe0e4e4,"rowan",1);
  actor("VECINA",2,26,0xcc7895,0xa77756,"neighbor",1.6);
  actor("AYUDANTE",27,-23.8,0x77ae9a,0x497f7c,"aide",2);
  // Road signs, visible signboards, a small compass stone.
  function sign(x,z,name,kind){const root=new T.Group();root.position.set(x,0,z);scene.add(root);cyl(root,.10,.13,1.4,wood,0,.7,0,6);box(root,1.8,.85,.17,0x85603d,0,1.55,0);box(root,1.57,.63,.19,0xe8d4a7,0,1.55,.10);label(name,root,2.95).scale.multiplyScalar(.72);spots.push({name,x,z,kind});}
  sign(2,-11.5,"RUTA 201","routeSign");sign(18,-19,"PUEBLO ARENA →","townSign");sign(-15,-26.5,"LAGO VERAZ","lakeSign");
  // Rowan's mysterious briefcase — a real mission interaction, not just a decoration.
  const caseRoot=new T.Group();caseRoot.position.set(-16.4,0,-23.6);scene.add(caseRoot);
  box(caseRoot,1.55,.78,.87,0x8c643e,0,.44,0);
  box(caseRoot,1.65,.15,.92,0x6e4f32,0,.85,0);
  for(const q of [-.59,.59])box(caseRoot,.13,.91,.97,0xd8b76d,q,.46,0);
  box(caseRoot,.53,.17,.19,0xd6bc80,0,.98,.03);
  sphere(caseRoot,.19,0xffdf82,0,1.23,0,2);
  label("MALETÍN",caseRoot,2.7).scale.multiplyScalar(.82);
  spots.push({name:"Maletín del profesor",x:-16.4,z:-23.6,kind:"briefcase"});
  // Markers for story characters, slowly spinning.
  const markers=[];
  function marker(x,z){const root=new T.Group();root.position.set(x,3.55,z);scene.add(root);const diamond=mesh(new T.OctahedronGeometry(.27),new T.MeshStandardMaterial({color:0xffd06f,emissive:0xffc557,emissiveIntensity:.55,metalness:.28,roughness:.35}),root,0,.0,0);glowSprite("rgba(255,217,125,.55)",1.4,0,root);markers.push({root,diamond,x,z});return root;}
  marker(-3,12.1);marker(-21.4,-20.4);marker(27,-23.8);
  // Floating forest dust and butterfly lights.
  for(let i=0;i<30;i++){const root=new T.Group();root.position.set((rng()-.5)*73,.9+rng()*2.7,(rng()-.5)*75);scene.add(root);const g=glowSprite(i%3===0?"rgba(255,232,138,.8)":"rgba(230,255,208,.45)",.20+rng()*.25,0,root);butterflies.push({obj:root,t:rng()*10,x:root.position.x,z:root.position.z});}
  scene.fog=new T.FogExp2(0xb3d8b5,.0085);scene.background=new T.Color(0xb2d9d2);
  function animate(t,quest){for(const a of animated){if(a.kind==="ripple"){a.obj.material.opacity=.24+.19*Math.sin(t*.7+a.t);a.obj.scale.setScalar(1+.08*Math.sin(t*.55+a.t));}
    if(a.kind==="grass")a.obj.rotation.z=Math.sin(t*1.25+a.t)*.045;}
    for(const l of leaves)l.root.rotation.y=Math.sin(t*.37+l.t)*.015;
    for(const b of butterflies){b.obj.position.x=b.x+Math.sin(t*.8+b.t)*.38;b.obj.position.y=1.4+Math.cos(t*1.3+b.t)*.4;b.obj.position.z=b.z+Math.sin(t*.6+b.t)*.3;}
    for(let i=0;i<markers.length;i++){const m=markers[i],active=(i===0&&quest===0)||(i===1&&(quest===1||quest===3))||(i===2&&quest>=4);m.root.visible=active;m.root.position.y=3.8+Math.sin(t*2+i)*.2;m.diamond.rotation.y=t*1.7;}
    for(const n of npcs)n.model.walk(t,false);
  }
  return {hero,npcs,spots,portals,obstacles,grassAt,animate,markers};
}