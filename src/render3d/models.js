import * as T from 'three';
import {storeSign,postSign} from './signs.js';

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

const shade=(hex,f)=>{const c=new T.Color(hex);return '#'+(f>0?c.lerp(new T.Color('#ffffff'),f):c.multiplyScalar(1+f)).getHexString();};
const WHITE_TRIM='#fff8ec';

// Edificios con acabado de juguete: cimiento de piedra, paredes con zócalo y esquineros, ventanas de marco
// blanco con postigos y jardinera, puerta con alero de tela festoneado, techo de tejas en franjas gruesas
// con canal y cumbrera redondeados, y letreros en placa. Todo es diseño propio (sin emblemas de terceros).
export function building(r,o) {
  const g=new T.Group(), w=o.w,d=o.h, opt=o.opt||{}, lab=o.kind==='lab', big=o.kind==='big';
  const b=(c,x,y,z,W,H,D,soft=true)=>r.box(g,c,x,y,z,W,H,D,soft);
  const ball=(c,x,y,z,W,H=W,D=W)=>r.ball(g,c,x,y,z,W,H,D);
  const gloss=c=>r.mat(c,{roughness:.42});
  const roof=opt.roof||'#648d96', wall=opt.wall||CREAM, trim=opt.trim||shade(wall,-.12);
  const dc=(opt.doorCol ?? Math.floor(w/2))+.5, zc=d/2-.3, zf=d-.65;      // centro de la puerta, centro y frente de las paredes
  // Cimiento, paredes, zócalo y moldura superior
  b('#a3a493',w/2,.1,zc,w+.04,.2,d-.5);
  b(wall,w/2,1.13,zc,w-.15,1.95,d-.7);
  b(shade(wall,-.07),w/2,.42,zf+.02,w-.12,.44,.06);
  b(shade(wall,-.16),w/2,.66,zf+.04,w-.1,.06,.07);
  b(WHITE_TRIM,w/2,2.06,zf+.03,w-.08,.1,.09);
  for(const x of [.1,w-.1]){b(trim,x,1.13,zf,.2,1.95,.18);b(shade(trim,.2),x,2.12,zf,.26,.08,.22);b(shade(trim,-.1),x,.24,zf,.26,.12,.22);}
  // Puerta: marco blanco, hoja con tableros, pomo, escalón y alero festoneado
  const doorColor=opt.door||(lab?'#86bdc0':'#a47b52');
  b(WHITE_TRIM,dc,.9,zf+.04,.98,1.46,.12);
  b(doorColor,dc,.86,zf+.1,.74,1.32,.05);
  if(!lab)for(const y of [.55,1.15])b(shade(doorColor,-.12),dc,y,zf+.13,.52,.42,.02,false);
  else r.mesh(g,'soft',r.mat('#bfe6e8',{emissive:'#cfe9e0',emissiveIntensity:.2,roughness:.15}),[dc,.95,zf+.13],[.58,1.0,.02]);
  ball('#e8c060',dc+.25,.84,zf+.15,.045,.045,.03);
  b('#c9c2b4',dc,.1,zf+.36,1.12,.2,.5);
  const awning=lab?'#7aa6aa':shade(roof,-.05);
  const aw=r.box(g,awning,dc,1.79,zf+.32,1.16,.07,.56,true);aw.rotation.x=.42;
  for(let i=0;i<5;i++)ball(i%2?WHITE_TRIM:awning,dc-.46+i*.23,1.66,zf+.56,.12,.08,.06);
  // Ventanas: marco blanco, vidrio que brilla un poco, travesaños, postigos, alféizar y jardinera
  for(let i=0;i<w;i++)if(Math.abs(i+.5-dc)>.9){
    const x=i+.5;
    b(WHITE_TRIM,x,1.32,zf+.04,.66,.8,.1);
    r.mesh(g,'soft',r.mat('#a9dbe4',{emissive:'#d7c78a',emissiveIntensity:.2,roughness:.15}),[x,1.33,zf+.09],[.52,.64,.03]);
    b(WHITE_TRIM,x,1.33,zf+.11,.035,.64,.02,false);b(WHITE_TRIM,x,1.4,zf+.11,.52,.035,.02,false);
    b(WHITE_TRIM,x,.9,zf+.1,.76,.07,.16);
    if(opt.flowers!==false&&!lab){
      b('#b6805d',x,.79,zf+.16,.66,.15,.2);
      for(let n=0;n<5;n++){ball('#6aa85a',x-.24+n*.12,.88,zf+.14,.06,.05,.06);ball(['#e79d84','#f2d06a','#fff4f0','#e79d84','#f2a8c0'][n],x-.24+n*.12,.92,zf+.19,.055,.05,.055);}
    }
  }
  if(lab){
    // Techo plano con pretil redondeado y claraboyas de vidrio
    b('#547b82',w/2,2.26,zc,w+.25,.3,d-.35);
    b('#6f969c',w/2,2.44,zc,w+.3,.1,d-.3);b('#91b6b0',w/2,2.47,zc,w-.3,.06,d-.8,false);
    for(let i=0;i<3;i++){const x=1.4+i*(w-2.8)/2;b('#e8f2ee',x,2.56,zc-.05,1.66,.16,1.16);r.mesh(g,'soft',r.mat('#a8d8dc',{emissive:'#cfeee6',emissiveIntensity:.25,roughness:.12}),[x,2.66,zc-.05],[1.46,.06,.96]);}
  } else {
    // Base del techo: prisma a dos aguas (también lo usa la prueba de visibilidad).
    const geometry=new T.BufferGeometry();
    const W=w/2+.22,D=d/2-.12,H=.95;
    const v=[-W,0,-D,W,0,-D,0,H,-D, -W,0,D,0,H,D,W,0,D, -W,0,-D,0,H,-D,0,H,D,-W,0,-D,0,H,D,-W,0,D, 0,H,-D,W,0,-D,W,0,D,0,H,-D,W,0,D,0,H,D];
    geometry.setAttribute('position',new T.Float32BufferAttribute(v,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(new Array(v.length/3*2).fill(0),2));
    geometry.setIndex(Array.from({length:6},(_,i)=>[i*3,i*3+2,i*3+1]).flat());
    geometry.computeVertexNormals();
    geometry.rotateY(Math.PI/2);
    const roofMesh=new T.Mesh(geometry,r.mat(shade(roof,-.35)));roofMesh.scale.set((w+.44)/(d-.24),1,(d-.24)/(w+.44));roofMesh.position.set(w/2,2.16,zc);roofMesh.castShadow=true;roofMesh.receiveShadow=true;roofMesh.userData.ownedGeometry=true;g.add(roofMesh);
    // Tejas en franjas gruesas y redondeadas, con una ranura oscura entre franja y franja.
    const run=D,rise=H,L=Math.hypot(run,rise),theta=Math.atan2(rise,run),N=5,len=L/N;
    const nx=0,ny=Math.cos(theta),nz=Math.sin(theta);
    for(const side of [1,-1])for(let j=0;j<N;j++){
      const k=(j+.55)/N,y=2.16+rise*(1-k)+ny*.06,z=zc+side*(run*k+nz*.06);
      const strip=r.mesh(g,'soft',gloss(j%2?roof:shade(roof,.07)),[w/2,y,z],[w+.52,.09,len*.9]);strip.rotation.x=side*theta;
      if(side===1){const lip=r.mesh(g,'soft',gloss(shade(roof,-.12)),[w/2,y-Math.sin(theta)*len*.45-.035,z+Math.cos(theta)*len*.45],[w+.5,.06,.07]);lip.rotation.x=theta;}
    }
    // Canal del alero, cumbrera y remates
    for(const side of [1,-1])b(shade(roof,-.3),w/2,2.13,zc+side*(D+.07),w+.62,.16,.18);
    const ridge=r.mesh(g,'cylinder',gloss(shade(roof,-.16)),[w/2,3.16,zc],[.14,w+.6,.14]);ridge.rotation.z=Math.PI/2;
    for(const x of [-.3,w+.3])ball(shade(roof,-.22),x,3.16,zc,.17);
    if(opt.chimney){b('#b9785e',w-.95,2.95,zc-.25,.5,1.05,.5);for(let k=0;k<3;k++)b('#a6684f',w-.95,2.6+k*.26,zc-.005,.52,.03,.02,false);b('#e3b69a',w-.95,3.5,zc-.25,.64,.13,.64);b('#544c47',w-.95,3.57,zc-.25,.4,.02,.4,false);}
  }
  // Letrero luminoso del local sobre el alero, inclinado hacia la cámara alta, con patas al techo (ver signs.js).
  if(opt.sign||lab){
    const text=lab?'LAB. CEIBA':opt.sign, color=opt.signColor||(lab?'#3a8a78':'#467b70');
    const sh=big?1.0:lab?.9:.82, by=lab?2.5:2.3;
    const sign=storeSign(r,{text,color,height:sh,maxWidth:w-(big?1.2:.55)}), sw=sign.userData.width;
    for(const x of [-sw*.34,sw*.34])r.box(sign,shade(color,-.5),x,-sh/2-.16,-.13,.09,.42,.09,true);
    sign.position.set(w/2,by+sh/2+.08,lab?zf+.02:zf+.12);sign.rotation.x=-.4;g.add(sign);
  }
  if(big){
    for(const x of [.35,w-.35]){b(opt.trim||'#c4b790',x,1.2,zf+.15,.3,2.25,.36);b('#eee1bb',x,2.32,zf+.15,.48,.16,.48);b(shade(opt.trim||'#c4b790',-.15),x,.18,zf+.15,.42,.2,.46);}
    // Escudo redondo del gimnasio sobre la cumbrera (sólo el color de la medalla, nada de logos).
    if(opt.emblem){const ey=lab?2.9:3.42,ez=zc+.12;ball(WHITE_TRIM,w/2,ey,ez,.42,.42,.1);ball(opt.emblem,w/2,ey,ez+.05,.32,.32,.08);ball('#ffffff',w/2-.1,ey+.1,ez+.12,.07,.06,.02);r.box(g,shade(opt.trim||'#c4b790',-.1),w/2,ey-.4,ez-.02,.1,.4,.08,true);}
  }

  // BRUMA ARCHITECTURE · real 3D facades and roof detailing on all buildings.
  // Visual only: never touches tile collisions, doors, warps or map data.
  const finish=new T.Group();finish.name='bruma-architecture';g.add(finish);
  const mesh=(type,color,x,y,z,sx,sy,sz,rot=0)=>{
    const part=r.mesh(finish,type,color,[x,y,z],[sx,sy,sz]);
    part.rotation.z=rot;return part;
  };
  const darkTrim=shade(trim,-.26),gold='#edc680';
  for(const x of [.24,w-.24]){
    mesh('box',darkTrim,x,1.15,zf+.16,.12,1.75,.07);
    mesh('box',WHITE_TRIM,x,2.02,zf+.16,.24,.08,.15);
    mesh('soft',gold,x,.22,zf+.16,.20,.13,.18);
  }
  mesh('soft',gold,dc,1.69,zf+.54,1.18,.055,.12);
  for(const side of [-1,1]){
    const x=dc+side*.70;
    mesh('box',darkTrim,x,1.37,zf+.24,.07,.33,.08);
    mesh('crystal','#ffe1a1',x,1.40,zf+.31,.13,.17,.13);
    mesh('box',gold,x,1.53,zf+.31,.17,.025,.15);
    mesh('box',gold,x,1.28,zf+.31,.17,.025,.15);
    for(let n=0;n<2;n++)mesh('soft',n?'#e2cb9e':'#f1e3bf',dc+side*.31,.03,zf+.52+n*.22,.27,.055,.21);
  }
  for(let i=0;i<w;i++){
    const x=i+.5;if(Math.abs(x-dc)<=.9)continue;
    for(const side of [-1,1]){
      const sx=x+side*.35;
      mesh('box',shade(roof,side>0?.08:-.16),sx,1.35,zf+.16,.10,.68,.05);
      for(let j=-1;j<=1;j++)mesh('box',WHITE_TRIM,sx,1.35+j*.16,zf+.19,.09,.02,.013);
    }
    mesh('soft',gold,x,1.77,zf+.18,.76,.035,.12);
  }
  if(lab){
    const count=Math.min(4,Math.max(2,Math.floor(w/2)));
    for(let i=0;i<count;i++)mesh('soft',gold,.9+i*(w-1.8)/(count-1),2.54,zc-.04,.07,.06,d-.65);
    mesh('cylinder','#577384',w-.84,2.87,zc-.4,.16,.41,.16,-.16);
    mesh('crystal','#79dbe8',w-.80,3.10,zc-.38,.15,.24,.16);
    mesh('crystal','#83d3cf',dc,2.28,zf+.20,.15,.12,.09);
  }else{
    const n=Math.max(3,Math.min(9,Math.floor(w*1.1)));
    for(let i=0;i<n;i++)mesh('soft',i%3===0?gold:shade(roof,.18),.3+(i+.5)*(w-.6)/n,3.17,zc,.10,.07,.13);
    mesh('crystal',gold,w/2,3.33,zc,.13,.18,.14);
    for(const x of [w*.20,w*.80]){
      mesh('box',shade(roof,-.22),x,2.63,zf-.05,.37,.27,.07);
      mesh('box',WHITE_TRIM,x,2.64,zf+.015,.24,.16,.027);
    }
  }
  if(big){
    for(const x of [.62,w-.62]){
      mesh('soft',gold,x,2.0,zf+.27,.40,.11,.20);
      mesh('crystal',opt.emblem||'#8ecdc6',x,2.28,zf+.27,.16,.25,.14);
    }
    mesh('soft',darkTrim,w/2,2.16,zf+.20,Math.min(w-1,3.3),.12,.15);
  }else if(!lab){
    for(const side of [-1,1]){
      const x=dc+side*.86;
      mesh('box','#956c50',x,.20,zf+.40,.31,.20,.31);
      mesh('leaf','#75ac75',x,.40,zf+.40,.22,.22,.20,side*.24);
      mesh('ball',side>0?'#f0a3b9':'#f7d887',x,.52,zf+.46,.065,.06,.065);
    }
  }
  r.batch(finish);

  // New silhouette: the roof must read as an illustrated fantasy town,
  // not a five-stripe rectangular toy box. These are actual Three.js meshes.
  const silhouette=new T.Group();silhouette.name='bruma-storybook-silhouette';g.add(silhouette);
  const form=(shape,color,x,y,z,sx,sy,sz,rotation=[])=>{
    const p=r.mesh(silhouette,shape,color,[x,y,z],[sx,sy,sz]);
    if(rotation.length)p.rotation.set(...rotation);return p;
  };
  const gableDark=shade(roof,-.30),gableBright=shade(roof,.21);
  if(!lab){
    const run=d/2-.12,rise=.95,angle=Math.atan2(rise,run);
    // Individual roof shingles alternate in short staggered courses. Shingle
    // tips produce visible relief and shadow at the elevated game camera.
    for(const side of [-1,1])for(let row=0;row<5;row++){
      const t=(row+.48)/5;
      const y=2.16+rise*(1-t)+.105,zz=zc+side*(run*t);
      const count=Math.max(4,Math.min(14,Math.floor(w/.55)));
      for(let i=0;i<count;i++){
        const x=(i+.5+(row%2)*.12)*w/count;
        const color=(i+row)%5===0?gableBright:(i+row)%3===0?shade(roof,-.12):roof;
        form('soft',color,x,y,zz,w/count*.86,.035,run*.135,[side*angle,0,0]);
      }
    }
    // Roofline changes in geometry: framed dormers projecting from both
    // roof slopes. The bright dormer glass has a physical recessed frame.
    const count=w>6?3:2;
    for(let i=0;i<count;i++){
      const x=w*(i+1)/(count+1),z=zc+run*.58;
      const y=2.16+rise*.42;
      form('soft',shade(wall,-.02),x,y+.20,z,.71,.53,.47);
      form('box',gableDark,x,y+.21,z+.252,.51,.36,.06);
      form('soft','#f6e4ba',x,y+.21,z+.289,.43,.28,.04);
      form('box','#6db3b9',x,y+.22,z+.314,.32,.19,.018);
      form('box',WHITE_TRIM,x,y+.22,z+.33,.034,.22,.024);
      form('soft',gableBright,x,y+.51,z,.88,.095,.64,[.38,0,0]);
      form('crystal','#f8dd91',x,y+.60,z-.10,.072,.13,.075);
      // Little flowering vines at the sill are distinct 3D leaves.
      for(let k=-1;k<=1;k++){
        form('foliage',k===0?'#6f9a81':'#7db69b',x+k*.135,y+.015,z+.30,.10,.10,.08);
        form('bloomFlower',k===0?'#f1bad2':'#e8d78f',x+k*.13,y+.11,z+.37,.065,.09,.07);
      }
    }
    // Ridge spires give each building a recognizable skyline.
    for(const i of [0,1,2]){
      const x=(i+.5)*w/3;
      form('crystal',i===1?'#e9bb7a':gableDark,x,3.38,zc,.15,.23,.14);
      form('soft',gableBright,x,3.16,zc,.22,.075,.20);
    }
  }else{
    // The laboratory is a scientific observatory, not a generic house.
    for(const side of [-1,1]){
      const x=side>0?w-.75:.75;
      form('cylinder','#5f7991',x,2.95,zc-.3,.26,.7,.26);
      form('crystal','#81e3db',x,3.38,zc-.3,.26,.44,.25);
      form('ring','#edca8f',x,3.38,zc-.3,.29,.30,.29,[Math.PI/2,0,0]);
    }
    form('soft','#e6cc94',w/2,2.75,zc,Math.min(w-1,2.4),.14,.22);
    for(let i=-2;i<=2;i++)form('crystal',i%2?'#9be4d8':'#f4e0aa',w/2+i*.38,2.92,zc,.12,.21,.12);
  }
  if(big){
    // Gym/league architecture gets symmetrical vertical towers, high
    // silhouettes and a dimensional crest instead of a standard house.
    for(const x of [.72,w-.72]){
      form('soft',trim,x,2.58,zf-.14,.58,.77,.57);
      form('cylinder',gableDark,x,3.05,zf-.14,.34,.18,.34);
      form('crystal',opt.emblem||'#8ed6c0',x,3.36,zf-.14,.27,.43,.27);
      form('soft','#f0d3a1',x,2.24,zf+.18,.40,.12,.43);
    }
    form('crystal',opt.emblem||'#9fdbb8',w/2,3.69,zc,.33,.54,.22);
  }
  r.batch(silhouette);
  return g;
}

export function smallProp(r,o) {
  const g=new T.Group(),b=(c,x,y,z,w,h,d)=>r.box(g,c,x,y,z,w,h,d,true);
  if(o.kind==='fence'){for(const x of [-.34,.34]){b('#eee0be',x,.38,0,.12,.76,.14);r.mesh(g,'cone','#eee0be',[x,.82,0],[.095,.16,.095]);}for(const y of [.31,.59])b('#eee0be',0,y,0,1,.09,.09);}
  if(o.kind==='sign')g.add(postSign(r,(o.text||[])[0]||''));
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
