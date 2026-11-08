import * as T from 'three';

const WOOD='#a16d45', LIGHTWOOD='#d5a878', CREAM='#fff0d5', DARK='#32404b';
const BOOKS=['#d26a61','#5b99b2','#e2b94f','#739d67','#a082b1'];
export function furniture(r, o) {
  const g=new T.Group(), w=o.w || 1, d=o.h || 1, name=o.name;
  const b=(c,x,y,z,W,H,D,soft=true)=>r.box(g,c,x,y,z,W,H,D,soft);
  const ball=(c,x,y,z,W,H=W,D=W)=>r.ball(g,c,x,y,z,W,H,D);
  const legs=(width=w-.2,depth=.65,height=.65)=>{for(const x of [-1,1])for(const z of [-1,1])b(WOOD,x*width*.4,height/2,z*depth*.4,.1,height,.1);};
  const monitor=(x=0,y=1.12,z=-.12,screen='#67d7c5')=>{
    b(DARK,x,y-.23,z,.1,.22,.1); b(DARK,x,y-.32,z+.03,.42,.045,.3);
    b(DARK,x,y,z,.68,.49,.12);r.mesh(g,'soft',r.mat(screen,{emissive:screen,emissiveIntensity:.45}),[x,y,z+.07],[.55,.34,.02]);
    b('#baf1e0',x-.08,y+.07,z+.088,.28,.025,.008,false);b('#baf1e0',x-.13,y-.02,z+.088,.18,.022,.008,false);
  };
  switch(name) {
    case 'bed':
      b(WOOD,0,.23,0,.9,.32,1.85);b(WOOD,0,.67,-.9,.94,.9,.1);b(LIGHTWOOD,0,.85,-.89,.94,.1,.13);
      b('#fff7e9',0,.43,0,.85,.23,1.72);b('#6296c4',0,.58,.28,.87,.18,1.12);
      for(let i=0;i<5;i++)b('#82b2dc',0,.677,-.15+i*.2,.84,.015,.035,false);
      b('#fffaf4',0,.62,-.58,.69,.2,.42);b('#e4d8c0',0,.71,-.58,.56,.012,.015,false);
      b(LIGHTWOOD,0,.4,.9,.94,.32,.1);break;
    case 'desk':
      legs();b(LIGHTWOOD,0,.76,0,w-.08,.15,.83);b(WOOD,w*.32,.4,0,.48,.65,.74);
      for(let i=0;i<3;i++){b('#b88657',w*.32,.25+i*.18,.386,.4,.15,.04);b('#f6d685',w*.32,.25+i*.18,.415,.13,.035,.025);}
      monitor(-.35,1.12,-.12);b('#eee6d5',-.35,.86,.22,.55,.045,.2);
      b('#fff2d2',.38,.87,.1,.43,.035,.35);b('#5b9fbb',.38,.9,.1,.3,.02,.035,false);break;
    case 'tv':
      b(WOOD,0,.32,0,.88,.62,.64);b(LIGHTWOOD,0,.64,0,.95,.1,.72);monitor(0,1.01,0,'#73bdd2');
      for(const x of [-.21,.21])b('#5c443a',x,.36,.33,.35,.37,.025);break;
    case 'console':
      b('#e8e9e3',0,.11,0,.65,.17,.36);b(DARK,-.17,.207,0,.14,.02,.05);b(DARK,-.17,.207,0,.05,.02,.14);
      ball('#d86961',.18,.21,.035,.038,.015,.038);ball('#d5b14d',.12,.21,-.04,.032,.015,.032);break;
    case 'plant':
      r.mesh(g,'cylinder','#bc7957',[0,.21,0],[.27,.4,.27]);r.mesh(g,'cylinder','#e5a078',[0,.4,0],[.29,.08,.29]);
      r.mesh(g,'cylinder','#493e34',[0,.447,0],[.24,.02,.24]);
      for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(i%2?'#5c9e65':'#82b879',Math.cos(a)*.19,.65+i*.055,Math.sin(a)*.16,.13,.32,.09);leaf.rotation.z=Math.cos(a)*.5;}
      break;
    case 'table': case 'labTable':
      legs();b(name==='labTable'?'#dce7df':LIGHTWOOD,0,.75,0,w-.12,.18,.84);
      if(name==='table') {r.mesh(g,'cylinder',CREAM,[-.37,.855,.05],[.22,.025,.22]);ball('#e6a35d',-.37,.91,.05,.12,.05,.1);r.mesh(g,'cylinder','#add3d0',[.44,.94,-.1],[.085,.18,.085]);}
      else {for(let i=0;i<3;i++){r.mesh(g,'cylinder',BOOKS[i],[i*.32-.5,.98,-.05],[.07,.3,.07]);b('#f5f1e1',.45,.86,.05,.45,.04,.35);}r.mesh(g,'cylinder','#f2f0de',[.42,.93,-.1],[.08,.14,.08]);}
      break;
    case 'chair':
      legs(.65,.65,.38);b(LIGHTWOOD,0,.43,0,.65,.12,.65);b(WOOD,0,.74,-.27,.65,.55,.1);b('#d6a074',0,.79,-.21,.5,.29,.04);break;
    case 'sofa':
      b('#9f5453',0,.28,0,w-.1,.4,.8);b('#c4776c',0,.68,-.28,w-.1,.65,.27);
      for(const x of [-1,1]){b('#b9655e',x*(w/2-.18),.56,0,.28,.55,.9);b('#e39682',x*w*.2,.5,.1,w*.36,.22,.62);}
      break;
    case 'shelf':
      b(WOOD,0,.83,-.3,w-.1,1.66,.14);
      for(const x of [-1,1])b(LIGHTWOOD,x*(w/2-.08),.83,0,.1,1.66,.74);
      for(let row=0;row<3;row++){
        b(LIGHTWOOD,0,.11+row*.52,0,w-.08,.08,.74);
        for(let i=0;i<7;i++)b(BOOKS[(row+i)%5],-w/2+.24+i*(w-.42)/7,.32+row*.52,-.03,.14,.3+(i%3)*.04,.4);
      }
      b(LIGHTWOOD,0,1.66,0,w,.12,.8);break;
    case 'storeShelf': {
      // Góndola bien surtida: cajas de cápsulas, atomizadores y frascos con los colores de los objetos del juego.
      const BOX=['#3a9ad8','#e04848','#f0b428','#2ab8b0','#5a4a96'],SPRAY=['#9a6ad0','#e0588a','#e8862a','#2a8ed8','#3f9e62'],JAR=['#5aa850','#f0a020','#2f9a8a','#d8b040','#e05a6a'];
      b('#9fc8bc',0,.83,-.3,w-.1,1.66,.14);
      for(const x of [-1,1])b('#f1ead8',x*(w/2-.08),.83,0,.1,1.66,.74);
      const n=5,step=(w-.5)/(n-1);
      for(let row=0;row<3;row++){
        const y0=.11+row*.52;
        b('#f1ead8',0,y0,0,w-.08,.08,.74);b('#3a6ab8',0,y0+.02,.37,w-.1,.07,.02,false);
        for(let i=0;i<n;i++){
          const x=-(w-.5)/2+i*step,y=y0+.04;
          if(row===0){const c=BOX[i%5];b(c,x,y+.15,.02,.27,.3,.34);b(CREAM,x,y+.17,.19,.2,.12,.02,false);ball(c,x-.035,y+.17,.205,.035,.03,.012);ball(CREAM,x+.035,y+.17,.205,.035,.03,.012);}
          else if(row===1){const c=SPRAY[i%5];r.mesh(g,'cylinder',c,[x,y+.15,.02],[.1,.28,.1]);r.mesh(g,'cylinder','#5a6070',[x,y+.33,.02],[.05,.08,.05]);b(CREAM,x,y+.14,.115,.12,.1,.02,false);}
          else {const c=JAR[i%5];r.mesh(g,'cylinder',c,[x,y+.13,.02],[.11,.24,.11]);r.mesh(g,'cylinder',CREAM,[x,y+.13,.02],[.115,.07,.115]);r.mesh(g,'cylinder','#e8e2d0',[x,y+.27,.02],[.09,.04,.09]);}
        }
      }
      b('#f1ead8',0,1.66,0,w,.12,.8);
      for(let i=0;i<3;i++)b(BOX[(i+1)%5],-w/2+.4+i*.32,1.85,.05,.28,.26,.3);
      b(BOX[3],-w/2+.56,2.09,.05,.28,.24,.3);
      b('#fff4d6',w/2-.45,1.98,-.1,.6,.5,.06);b('#e04848',w/2-.45,2.13,-.065,.5,.1,.02,false);
      b('#3a6ab8',w/2-.45,1.95,-.065,.38,.06,.02,false);b('#3a6ab8',w/2-.45,1.85,-.065,.3,.06,.02,false);
      break;
    }
    case 'kitchen':
      b('#d8dfd0',0,.44,0,w-.1,.82,.82);b(CREAM,0,.9,0,w,.12,.9);
      for(const x of [-.48,.48]){b('#b6c4b8',x,.44,.43,.84,.65,.04);b('#6b7d72',x+.25,.56,.46,.06,.18,.035);}
      r.mesh(g,'cylinder',DARK,[-.5,.97,0],[.23,.02,.23]);r.mesh(g,'cylinder','#a9bab5',[.5,.965,0],[.26,.02,.23]);
      b('#788d8b',.6,1.1,-.25,.06,.32,.06);b('#788d8b',.6,1.25,-.14,.06,.06,.24);break;
    case 'fridge':
      b('#e5eddf',0,.86,0,.84,1.72,.82);b('#c4d0c7',0,1.15,.42,.82,.035,.025,false);
      b('#708879',.27,.73,.46,.05,.45,.05);b('#708879',.27,1.44,.46,.05,.2,.05);b('#e4bb65',-.16,1.4,.443,.19,.18,.012);break;
    case 'counter': case 'shopCounter':
      b(name==='counter'?'#c57d83':'#7096bc',0,.43,0,w-.04,.84,.9);b(CREAM,0,.9,0,w,.15,1);
      for(let i=0;i<w;i++)b(name==='counter'?'#e4a5a2':'#9abbd1',-w/2+.5+i,.4,.46,.62,.55,.03);
      if(name==='shopCounter')monitor(-w/2+.55,1.14,0);break;
    case 'pc':
      b('#d1e0d9',0,.6,0,.76,1.2,.8);monitor(0,1.15,0);b(DARK,0,.74,.43,.55,.07,.18);break;
    case 'machine':
      b('#a3bab7',0,.68,0,w-.1,1.36,.85);b('#d7e5dc',0,1.32,0,w,.15,.9);monitor(-.4,1.07,.42);
      for(let i=0;i<4;i++)ball(BOOKS[i],.3+(i%2)*.3,.97+Math.floor(i/2)*.24,.455,.07,.07,.025);
      for(let i=0;i<5;i++)b('#6d8c87',-.5+i*.23,.36,.44,.08,.25,.02,false);break;
    case 'healer':
      b('#f0e6db',0,.4,0,w-.08,.8,.83);b('#c98491',0,.87,-.27,w-.12,.24,.28);
      for(let i=0;i<6;i++) {const x=-.6+(i%3)*.6,z=-.14+Math.floor(i/3)*.4;r.mesh(g,'cylinder','#43565a',[x,.82,z],[.2,.03,.2]);ball('#f29897',x,.9,z,.12);}
      r.mesh(g,'soft',r.mat('#87d9d5',{emissive:'#87d9d5',emissiveIntensity:.4}),[0,1.08,-.28],[.65,.18,.1]);break;
    case 'vending': {
      // Máquina de bebidas: cuerpo redondeado, letrero y vitrina iluminados, botellas, botonera y bandeja.
      b('#2f8f86',0,.95,0,.86,1.9,.78);b('#45b0a6',0,1.84,.02,.92,.2,.84);
      r.mesh(g,'soft',r.mat('#fff2c8',{emissive:'#ffe2a0',emissiveIntensity:.65}),[0,1.84,.44],[.64,.13,.03]);
      r.mesh(g,'soft',r.mat('#e4f6f2',{emissive:'#c8f2ea',emissiveIntensity:.4}),[-.09,1.13,.4],[.56,1.02,.03]);
      const cols=['#c8873a','#e8c030','#efe2c4','#e06a4a'];
      for(let row=0;row<4;row++){
        const y=.76+row*.25;b('#9ac8c0',-.09,y-.09,.42,.52,.02,.03,false);
        for(let i=0;i<4;i++){const x=-.3+i*.14,col=cols[(i+row)%4];r.mesh(g,'cylinder',col,[x,y,.43],[.04,.15,.04]);ball('#f4f0e6',x,y+.09,.43,.03,.02,.03);}
      }
      b('#26303a',.3,1.3,.41,.13,.22,.03);ball('#f0d060',.3,1.06,.42,.035,.035,.02);ball('#e05a4a',.3,.95,.42,.035,.035,.02);
      b('#1f5f5a',-.04,.33,.4,.52,.2,.05);b('#0f2f2c',-.04,.31,.43,.42,.1,.02,false);break;
    }
    case 'boxes':
      b('#c69d66',0,.3,0,.8,.6,.78);b('#eee1bd',0,.61,0,.12,.025,.8);b('#ad7b48',.1,.78,-.1,.6,.34,.5);b('#eee1bd',.1,.96,-.1,.1,.025,.5);break;
    default: b(LIGHTWOOD,0,.4,0,w-.1,.8,d-.1);
  }
  return g;
}

export function wallDecoration(r,o) {
  const g=new T.Group();
  const b=(c,x,y,z,w,h,d)=>r.box(g,c,x,y,z,w,h,d,true);
  if(o.name==='window'){
    b('#a57751',0,0,0,1.6,1.22,.13);r.mesh(g,'soft',r.mat('#a9dedf',{emissive:'#86bec6',emissiveIntensity:.25}),[0,0,.08],[1.42,1.04,.03]);
    b(CREAM,0,0,.12,.045,1.05,.04);b(CREAM,0,0,.12,1.45,.045,.04);b(CREAM,0,-.64,.08,1.85,.09,.32);
    for(const x of [-.9,.9]){b('#dd9b7f',x,0,.13,.32,1.4,.16);b('#f6bd9b',x-.05,0,.23,.07,1.35,.025);}
  } else if(o.name==='clock'){
    const m=r.mesh(g,'cylinder',WOOD,[0,0,0],[.34,.12,.34]);m.rotation.x=Math.PI/2;
    const face=r.mesh(g,'cylinder',CREAM,[0,0,.07],[.29,.02,.29]);face.rotation.x=Math.PI/2;
    b(DARK,0,.09,.09,.025,.2,.02);b(DARK,.06,0,.09,.15,.025,.02);
  } else {
    b(WOOD,0,0,0,.95,.75,.1);b('#8fc2c4',0,0,.06,.81,.61,.02);b('#679877',0,-.18,.08,.8,.23,.02);
    r.ball(g,'#eed489',.2,.15,.09,.09,.09,.015);
  }
  g.position.set(o.px/16+.55,1.65,1.91);return g;
}

export function building(r,o) {
  const g=new T.Group(), w=o.w,d=o.h, opt=o.opt||{}, lab=o.kind==='lab';
  const b=(c,x,y,z,W,H,D,soft=false)=>r.box(g,c,x,y,z,W,H,D,soft);
  const roof=opt.roof||'#648d96', front=d-.59, dc=(opt.doorCol ?? Math.floor(w/2))+.5;
  b('#899a85',w/2,.13,d/2-.3,w-.04,.26,d-.6,true);
  b(opt.wall||CREAM,w/2,1.12,d/2-.3,w-.15,2,d-.7,true);
  b('#c9b99b',w/2,.35,front,w-.07,.18,.08);
  for(const x of [.12,w-.12])b('#b19169',x,1.15,front,.14,1.9,.1);
  for(let y=.6;y<2;y+=.35)b('#e4d5b8',w/2,y,front,w-.24,.025,.025);
  if(lab){
    b('#547b82',w/2,2.28,d/2-.3,w+.25,.32,d-.35,true);b('#91b6b0',w/2,2.46,d/2-.3,w-.2,.08,d-.8);
    for(let i=0;i<3;i++)b('#a8d1cf',1.4+i*2.7,2.57,d/2-.35,1.6,.15,1.1,true);
  } else {
    const geometry=new T.BufferGeometry();
    const W=w/2+.22,D=d/2-.12,H=.95;
    const v=[-W,0,-D,W,0,-D,0,H,-D, -W,0,D,0,H,D,W,0,D, -W,0,-D,0,H,-D,0,H,D,-W,0,-D,0,H,D,-W,0,D, 0,H,-D,W,0,-D,W,0,D,0,H,-D,W,0,D,0,H,D];
    geometry.setAttribute('position',new T.Float32BufferAttribute(v,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(new Array(v.length/3*2).fill(0),2));
    // Outward winding keeps the slopes visible with front-face rendering.
    geometry.setIndex(Array.from({length:6},(_,i)=>[i*3,i*3+2,i*3+1]).flat());
    geometry.computeVertexNormals();
    // Ridge runs across the house; rotate roof axes so the front slope is readable.
    geometry.rotateY(Math.PI/2);
    const roofMesh=new T.Mesh(geometry,r.mat(roof));roofMesh.scale.set((w+.44)/(d-.24),1,(d-.24)/(w+.44));roofMesh.position.set(w/2,2.16,d/2-.3);roofMesh.castShadow=true;roofMesh.receiveShadow=true;roofMesh.userData.ownedGeometry=true;g.add(roofMesh);
    b('#76564b',w/2,2.14,front+.1,w+.35,.13,.14,true);
    for(let row=0;row<6;row++){
      const k=(row+.5)/6, z=d/2-.3+(d/2-.12)*k,y=2.16+.95*(1-k);
      b(roof,w/2,y+.015,z,w+.42,.045,.055,true);
      for(let col=0;col<w*2;col++) b(roof,.22+col*.5+(row%2)*.1,y+.018,z-.08,.025,.025,.17);
    }
    b(roof,w/2,3.12,d/2-.3,w+.44,.12,.13,true);
    if(opt.chimney){b('#ac7760',w-.95,2.9,d/2-.6,.52,1,.5);b('#e3b69a',w-.95,3.42,d/2-.6,.64,.12,.62);b('#544c47',w-.95,3.49,d/2-.6,.42,.015,.4);}
  }
  b('#6e6756',dc,.8,front+.04,.9,1.6,.12,true);b(lab?'#86bdc0':'#a47b52',dc,.79,front+.12,.71,1.45,.035,true);
  b('#dbc17f',dc+.22,.75,front+.16,.055,.055,.03,true);b('#b7aaa0',dc,.12,front+.35,1.1,.2,.48,true);
  for(let i=0;i<w;i++)if(Math.abs(i+.5-dc)>.9){
    const x=i+.5;b('#997550',x,1.28,front+.03,.68,.82,.12,true);
    r.mesh(g,'soft',r.mat('#b5dfe1',{emissive:'#d7bb75',emissiveIntensity:.22}),[x,1.3,front+.11],[.53,.64,.03]);
    b(CREAM,x,1.3,front+.15,.035,.65,.025);b(CREAM,x,1.3,front+.15,.55,.035,.025);
    if(opt.flowers!==false&&!lab){b('#b6805d',x,.79,front+.14,.8,.17,.28,true);for(let n=0;n<4;n++)r.ball(g,n%2?'#e79d84':'#e7ca75',x-.25+n*.17,.92,front+.17,.085,.07,.085);}
  }
  if(opt.sign||lab){
    const text=lab?'CEIBA':opt.sign, map=r.texture((c,s)=>{c.fillStyle='#f7f0dc';c.fillRect(0,0,s,s);c.fillStyle=opt.signColor||'#467b70';c.font='bold 30px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,s/2,s/2);},256);
    const sign=new T.Mesh(r.geometries.plane,new T.MeshBasicMaterial({map}));sign.userData.ownedMaterial=true;sign.position.set(dc,1.89,front+.17);sign.scale.set(1.65,.42,1);g.add(sign);
  }
  if(o.kind==='big'){
    for(const x of [.35,w-.35]){b(opt.trim||'#c4b790',x,1.2,front+.15,.28,2.25,.34,true);b('#eee1bb',x,2.3,front+.15,.46,.16,.46,true);}
    if(opt.emblem)r.ball(g,opt.emblem,w/2,2.67,front-.25,.28,.28,.07);
  }
  return g;
}

export function smallProp(r,o) {
  const g=new T.Group(),b=(c,x,y,z,w,h,d)=>r.box(g,c,x,y,z,w,h,d,true);
  if(o.kind==='fence'){for(const x of [-.34,.34]){b('#eee0be',x,.38,0,.12,.76,.14);r.mesh(g,'cone','#eee0be',[x,.82,0],[.095,.16,.095]);}for(const y of [.31,.59])b('#eee0be',0,y,0,1,.09,.09);}
  if(o.kind==='sign'){b(WOOD,0,.32,0,.12,.64,.12);b('#c49a67',0,.8,0,.87,.54,.13);for(let i=0;i<3;i++)b('#705b43',0,.67+i*.12,.075,.6,.025,.01);}
  if(o.kind==='mailbox'){b('#667f79',0,.4,0,.11,.8,.11);b('#cb6a5a',0,.85,0,.65,.37,.42);b('#f4db96',.34,1,0,.04,.3,.04);b('#f4db96',.4,1.12,0,.14,.1,.04);}
  if(o.kind==='rock')r.mesh(g,'leaf','#96a6a0',[0,.3,0],[.44,.4,.42]);
  if(o.kind==='bush')r.mesh(g,'leaf','#6caa69',[0,.3,0],[.48,.45,.48]);
  if(o.kind==='briefcase'){b('#976a43',0,.24,0,.72,.42,.45);b('#d4b775',0,.27,.24,.08,.07,.02);b('#5e4b3d',0,.5,0,.3,.08,.1);}
  if(o.kind==='lamp'){b('#4d6d67',0,.9,0,.1,1.8,.1);b('#4d6d67',0,.05,0,.34,.1,.34);r.mesh(g,'soft',r.mat('#ffe2a1',{emissive:'#ffd985',emissiveIntensity:.7}),[0,1.9,0],[.36,.42,.36]);r.mesh(g,'cone','#4d6d67',[0,2.2,0],[.3,.22,.3]);}
  if(o.kind==='pine'){
    r.mesh(g,'cylinder','#8b7559',[0,.55,0],[.13,1.1,.13]);
    for(let i=0;i<3;i++)r.mesh(g,'cone',['#467b68','#558b72','#639b7b'][i],[0,1.1+i*.46,0],[.72-i*.14,1.1,.72-i*.14]);
  }
  if(o.kind==='palm'){
    const trunk=r.mesh(g,'cylinder','#b18c62',[0,.95,0],[.14,1.9,.14]);trunk.rotation.z=.1;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const leaf=r.ball(g,'#6b9c68',Math.cos(a)*.45,1.94,Math.sin(a)*.45,.7,.08,.18);leaf.rotation.y=-a;leaf.rotation.z=Math.cos(a)*-.18;}
    for(const x of [-.15,.12])r.ball(g,'#94754f',x,1.85,.13,.13);
  }
  if(o.kind==='boulder')r.mesh(g,'leaf','#969b98',[0,.45,0],[.5,.52,.47]);
  if(o.kind==='crystal'||o.kind==='shimmer')for(let i=0;i<3;i++){
    const crystal=r.mesh(g,'cone',r.mat(i===1?'#b1e1ed':'#85b4d3',{emissive:'#5b90b7',emissiveIntensity:.3,roughness:.3}),[(i-1)*.18,.4+(i===1?.15:0),0],[.17,i===1?1:.65,.17]);crystal.rotation.z=(i-1)*-.2;
  }
  if(o.kind==='statue'){
    b('#bcbda8',0,.14,0,.8,.28,.8);b('#a4ae9d',0,.56,0,.46,.65,.44);
    r.ball(g,'#bfcab4',0,1.06,0,.24,.28,.25);r.mesh(g,'cone','#bfcab4',[0,1.4,0],[.12,.25,.12]);
    for(const x of [-.29,.29])r.ball(g,'#aebaa7',x,.9,-.04,.14,.2,.08);
  }
  if(o.kind==='fountain'){
    r.mesh(g,'cylinder','#c9c5aa',[0,.16,0],[.95,.3,.95]);r.mesh(g,'cylinder','#8ec5c9',[0,.32,0],[.83,.025,.83]);
    const rim=r.mesh(g,'ring','#e3d9ba',[0,.35,0],[.88,.88,1]);rim.rotation.x=Math.PI/2;
    r.mesh(g,'cylinder','#d1c7a4',[0,.7,0],[.17,.75,.17]);r.mesh(g,'cylinder','#d8d0b2',[0,1.05,0],[.42,.1,.42]);
    r.ball(g,'#c1e1e4',0,1.2,0,.15,.21,.15);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;r.ball(g,'#b0dadd',Math.cos(a)*.38,.83,Math.sin(a)*.38,.04,.24,.04);}
  }
  if(o.kind==='bench'){
    for(const x of [-.65,.65])b('#667972',x,.3,0,.12,.6,.55);
    for(let i=0;i<3;i++)b('#c49b68',0,.62,-.25+i*.23,1.8,.08,.18);
    b('#c49b68',0,.92,-.29,1.8,.48,.09);
  }
  if(o.kind==='boat'){
    r.ball(g,'#9d7451',0,.22,0,1.42,.3,.46);r.ball(g,'#5e5146',0,.36,0,1.2,.09,.31);
    for(const x of [-.55,.35])b('#cfad79',x,.42,0,.22,.08,.68);b('#eee0ba',.6,.8,0,.04,.9,.04);
    b('#de8f75',.76,.98,0,.35,.4,.025);
  }
  if(o.kind==='cave'){
    for(const x of [-.58,.58])r.mesh(g,'leaf','#8c928a',[x,.65,0],[.29,.72,.4]);
    r.mesh(g,'leaf','#a8ada0',[0,1.2,0],[.75,.26,.42]);b('#263134',0,.6,-.21,.92,1.05,.04);
  }
  return g;
}

// Cápsula de captura de Alborada: alargada, mitad de color y mitad crema, con una gema en la unión.
export function capsuleModel(r) {
  const g=new T.Group(),paint=new T.Group(),cream=new T.Group();g.add(paint,cream);
  const half=(parent,side,c)=>{
    r.mesh(parent,'ball',c,[side*.08,0,0],[.11,.11,.11]);
    const body=r.mesh(parent,'cylinder',c,[side*.04,0,0],[.11,.08,.11]);body.rotation.z=Math.PI/2;
  };
  half(paint,-1,'#3a9ad8');half(cream,1,'#f6ead2');
  const seam=r.mesh(g,'ring','#3a3f4a',[0,0,0],[.112,.112,.112]);seam.rotation.y=Math.PI/2;
  r.mesh(g,'ball',r.mat('#ffffff',{emissive:'#bfe8ff',emissiveIntensity:.7}),[0,.02,.1],[.03,.03,.02]);
  g.userData.paint=c=>{const m=r.mat(c);paint.children.forEach(x=>{x.material=m;});};
  g.scale.setScalar(1.6);
  return g;
}
