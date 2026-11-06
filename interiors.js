// Interior scenes: fully explorable rooms, furniture, doors, NPCs and contextual actions.
// World models are procedural and authored specifically for this fan prototype.
export function createInteriors(T) {
  const rooms=new Map();
  const matCache=new Map();
  function mat(hex,roughness=.88){let key=hex+"_"+roughness;if(!matCache.has(key))matCache.set(key,new T.MeshStandardMaterial({color:hex,roughness}));return matCache.get(key);}
  function box(scene,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
  function sphere(scene,x,y,z,r,color,detail=2){const m=new T.Mesh(new T.IcosahedronGeometry(r,detail),mat(color));m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;}
  function cylinder(scene,x,y,z,r1,r2,h,color,seg=12){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg),mat(color));m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;}
  function rug(scene,x,z,w,d,color){const a=box(scene,x,.066,z,w,.035,d,color);return a;}
  function art(scene,x,z,frame,inside){box(scene,x,3.2,z,1.7,1.24,.14,frame);box(scene,x,3.2,z+.085,1.42,.98,.045,inside);sphere(scene,x,3.32,z+.15,.26,0xe9e2ab,1);}
  function npc(scene,name,x,z,color=0xc57b8a){
    const root=new T.Group();root.position.set(x,0,z);scene.add(root);
    const skin=mat(0xf5c6a4);
    let m=new T.Mesh(new T.CapsuleGeometry(.39,.75,4,9),mat(color));m.position.y=1.32;root.add(m);m.castShadow=true;
    m=new T.Mesh(new T.SphereGeometry(.49,16,12),skin);m.position.y=2.35;root.add(m);m.castShadow=true;
    m=new T.Mesh(new T.SphereGeometry(.52,14,10,0,Math.PI*2,0,Math.PI*.6),mat(name==="BARRY"?0xe9b647:name==="PROF. SERBAL"?0xf2f2f2:0x73503f));m.position.set(0,2.61,-.05);root.add(m);
    for(const v of [-1,1]){sphere(root,v*.19,2.36,.44,.054,0x202733,2);
      const leg=box(root,v*.2,.49,0,.25,.89,.31,0x364966);
      const arm=box(root,v*.53,1.32,0,.23,.83,.30,color);arm.rotation.z=v*.1;}
    box(root,0,.12,.15,.8,.19,.50,0x424d4c);
    const trainer=name==="BARRY"?"barry":name==="PROF. SERBAL"?"rowan":name==="LUCAS / MAYA"?"dawn":name==="MAMÁ"?"lady":name==="MADRE DE BARRY"?"lady":"gentleman";
    const loader=new T.TextureLoader();loader.setCrossOrigin("anonymous");
    loader.load("https://play.pokemonshowdown.com/sprites/trainers/"+trainer+".png",tex=>{
      tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.NearestFilter;tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;
      for(const child of [...root.children])child.visible=false;
      const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,alphaTest:.05,depthTest:true,depthWrite:false}));
      sp.scale.set(3.7,3.7,1);sp.position.y=1.9;root.add(sp);
    });
    return {name,x,z,root,kind:"actor"};
  }
  function make(id){
    const room=new T.Scene();room.background=new T.Color(0x5c6e6f);
    room.add(new T.HemisphereLight(0xebf5ff,0x8b6a4c,2.4));
    const light=new T.DirectionalLight(0xffeed2,3);light.position.set(-7,13,10);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-20;light.shadow.camera.right=20;light.shadow.camera.top=20;light.shadow.camera.bottom=-20;room.add(light);
    const isLab=id==="lab";
    const floor=isLab?0xc5d9d9:0xc9976f,wall=id==="barry"?0xffe3ba:id==="home"?0xf3dfc7:id==="bedroom"?0xe4e5d7:id==="lab"?0xe6f1ed:0xe2d4b6;
    box(room,0,-.25,0,15,.50,12,floor);
    if(!isLab){for(let i=0;i<15;i++){box(room,-7+i,.021,0,.045,.013,12,0x7c5b40);}}
    box(room,0,2.85,-5.96,15,5.85,.25,wall);
    box(room,-7.48,2.85,0,.25,5.85,12,wall);
    box(room,7.48,2.85,0,.25,5.85,12,wall);
    box(room,0,.3,-5.77,14.4,.45,.22,isLab?0x718c95:0xb87d5f);
    box(room,-7.22,.3,0,.2,.45,11.6,isLab?0x718c95:0xb87d5f);
    box(room,7.22,.3,0,.2,.45,11.6,isLab?0x718c95:0xb87d5f);
    box(room,0,5.75,-5.8,15,.25,.26,0xffffff);
    box(room,-7.34,5.75,0,.28,.25,12,0xffffff);
    box(room,7.34,5.75,0,.28,.25,12,0xffffff);
    // Windows with sky-color panes, wood or white frames.
    for(const x of [-4.8,4.8]){
      box(room,x,3.5,-5.73,2.7,2.15,.17,0xfff6da);
      box(room,x,3.5,-5.62,2.38,1.84,.10,0x94d4e1);
      box(room,x,3.5,-5.50,.09,1.85,.05,0xfff9e4);
      box(room,x,3.52,-5.5,2.38,.09,.05,0xfff9e4);
      const glow=box(room,x,3.5,-5.43,2.28,1.75,.01,0xb7e5e2);glow.material.transparent=true;glow.material.opacity=.16;
    }
    cylinder(room,0,5.15,0,.20,.23,1.0,0xf3e2ba,12);
    sphere(room,0,4.5,0,.74,0xfff2c9,2);
    const triggers=[],blocks=[];
    const add=(name,x,z,kind,extra={})=>triggers.push({name,x,z,kind,...extra});
    // A bright wooden entrance arch at the open front edge.
    box(room,-1.1,1.6,5.65,.28,3.15,.25,0xf8ead0);box(room,1.1,1.6,5.65,.28,3.15,.25,0xf8ead0);
    box(room,0,3.15,5.65,2.42,.23,.25,0xf8ead0);
    rug(room,0,3.7,2.3,1.2,isLab?0x5f8fb4:0xa76355);
    add("Salir",0,4.55,"exit");
    if(id==="home"){
      rug(room,0,-.2,5,3.8,0xf0d6b4);
      box(room,-3.0,.55,-1.1,2.9,1.0,1.15,0x88634e);box(room,-3,1.1,-1.55,2.75,1.05,.24,0xaa8468);
      for(const s of [-1,1])box(room,-3+s*1.3,.75,-.45,.28,1.1,1.3,0x87664f);
      box(room,2.6,.88,-1.2,2.9,.20,1.35,0x9b795b);
      for(const x of [1.6,3.6])for(const z of [-1.68,-.74])cylinder(room,x,.44,z,.14,.16,.76,0x94684a);
      box(room,2.5,1.0,-5.23,2.3,1.65,.58,0x836f63);
      box(room,2.5,1.18,-4.87,1.92,1.18,.13,0x1d3b49);box(room,2.5,1.2,-4.78,1.67,.92,.05,0x75b3cd);
      sphere(room,2.5,1.24,-4.65,.32,0xf3d3a2,1);
      const mom=npc(room,"MAMÁ",1.7,.8,0xbc6b7e);add("Hablar con mamá",mom.x,mom.z,"mom");
      // staircase to personal bedroom
      for(let i=0;i<6;i++)box(room,-5.8,.19+i*.16,-5+i*.6,2,.25,.6,0x9a7355);
      add("Subir a tu habitación",-5.0,-3.9,"stairsUp");
      add("Ver las noticias",2.5,-3.1,"television");
      add("Examinar mesa",2.7,-.2,"table");
      art(room,-.35,-5.56,0xc49d72,0x95b1a1);
    }else if(id==="bedroom"){
      rug(room,0,.15,4.2,3.1,0x73abc5);
      box(room,-4,0.75,-2.3,3.1,.6,5.1,0x966d54);
      box(room,-4,1.14,-2.3,2.82,.38,4.8,0xf7f1d8);
      box(room,-4,1.2,-4.3,2.76,.22,.65,0xc2d3ec);
      box(room,-4,1.22,-2.25,2.83,.08,3.4,0xb2cdea);
      box(room,3.8,.9,-2.9,3.7,.22,1.5,0xa17859);
      box(room,3.85,1.55,-3.1,.20,1.16,.17,0x697e89);
      box(room,3.85,2.15,-3.2,1.18,.7,.13,0x223849);
      box(room,3.85,2.16,-3.08,.97,.52,.04,0x73bfe2);
      box(room,3.85,1.2,-2.1,1.25,.12,.50,0xd9dbce);
      const seat=box(room,3.8,.5,-.9,1.0,.2,1.1,0x487a98);
      add("Revisar el ordenador",3.8,-1.5,"computer");add("Dormir y descansar",-3.2,-.5,"bed");
      add("Bajar al salón",-5.0,3.35,"stairsDown");
      box(room,0,1.3,-5.4,2.1,2.8,.45,0xb58a68);
      art(room,1.2,-5.54,0xdfbb7c,0x87a4a6);
    }else if(id==="barry"){
      rug(room,0,.2,5.1,3.5,0xdfad7a);
      box(room,3,.7,-1.6,2.5,1.2,2.3,0xb78d60);box(room,3,1.35,-1.5,2.45,.16,2.3,0xd6b07a);
      box(room,-4,1.3,-4.92,2.5,2.5,.7,0x8e784d);box(room,-4,2.2,-4.55,2.4,.07,.7,0xf8d6a2);
      for(let i=0;i<8;i++){const x=-4.9+(i%4)*.6,y=1.6+Math.floor(i/4)*1.1;box(room,x,y,-4.5,.35,.72,.35,[0xca6b5f,0x729eaf,0xe5b56b,0xb57c8b][i%4]);}
      const barry=npc(room,"BARRY",-1.4,-.7,0xe1a63d);add("Hablar con Barry",-1.4,-.7,"barryInside");
      const older=npc(room,"MADRE DE BARRY",4.7,1.2,0x75b29a);add("Hablar con la madre de Barry",4.7,1.2,"barryMom");
      add("Examinar libros",-4,-3.1,"books");
      art(room,.6,-5.56,0x9b6c51,0x92bd93);
    }else if(id==="lab"){
      // Clinical teal floor in alternating large polished tiles.
      for(let x=-6;x<=6;x+=2){for(let z=-4;z<=4;z+=2){box(room,x,.015,z,1.93,.02,1.93,(x+z)%4===0?0xcfe7e5:0xd9eeee);}}
      box(room,0,1.05,-3.1,4.8,.25,1.8,0x618d9c);
      box(room,0,.56,-3.1,4.8,.85,1.7,0xe9f1e9);
      for(const x of [-1.1,0,1.1]){sphere(room,x,1.35,-3,.29,0xf1e6d4,2);sphere(room,x,1.35,-2.75,.18,0xdc6665,2);}
      for(const x of [-5.3,5.3]){box(room,x,1.55,-3.1,1.4,3.05,1.5,0x678e98);box(room,x,1.7,-2.30,1.05,1.25,.12,0x244f67);box(room,x,1.75,-2.22,.78,.9,.03,0x80d2c5);}
      for(let i=0;i<8;i++){sphere(room,-6.8+i*1.9,.55,-4.9,.16,0x93bfd5,2);}
      const rowan=npc(room,"PROF. SERBAL",-2.6,.5,0xe5e5dd);add("Hablar con el Profesor Serbal",-2.6,.5,"rowanLab");
      const aide=npc(room,"LUCAS / MAYA",3,.6,0x648cac);add("Hablar con el ayudante",3,.6,"aideLab");
      add("Examinar la Pokédex",0,-1.7,"pokedex");
      add("Revisar investigación",-5,-1.6,"research");
      art(room,0,-5.56,0x456c76,0x6db5b8);
    }else{
      rug(room,0,0,5.5,3.5,0x9cb7a0);
      box(room,0,.8,-2.2,3.4,.18,2.4,0x9a7b5d);
      box(room,0,.38,-2.2,2.8,.75,1.8,0xd7bf9d);
      for(const x of [-4.6,4.6]){cylinder(room,x,.8,-3,.35,.35,1.5,0x715c4a);sphere(room,x,1.7,-3,.8,0x5f9c72);}
      const citizen=npc(room,"VECINO",2,1,0x7ca8b4);add("Hablar con el vecino",2,1,"neighborInside");
    }
    const data={scene:room,id,triggers,blocks,entry:{x:0,z:1.8},find(x,z){let candidate=null,d=2.65;for(const n of this.triggers){const cur=Math.hypot(x-n.x,z-n.z);if(cur<d){d=cur;candidate=n;}}return candidate;},collides(x,z){return x<-6.55||x>6.55||z<-5.1||z>4.6;}};
    rooms.set(id,data);return data;
  }
  return {get(id){return rooms.get(id)||make(id);}};
}
