// ALBORADA · THREE STARTER FAMILIES, NATIVE 3D
// Reference: approved 3D concept sheet (leaf fox, ember fox, tide familiar).
// No image plane, billboard, ROM texture or premade model: each visible
// form is made from native sculpted geometry + individual 3D details.
// Maps the approved silhouettes to the EXISTING nine species IDs and levels.
import { Sculpt } from './sculpt.js';
const E=Sculpt.ellipsoid;

// Actual sculpted quadrupeds with four paws and a face facing +Z.
// All stage-dependent geometry uses the same combat coordinates and rig.
const quadruped=(S,{body,head,bodySize,headSize,coat,face,feet,stage})=>{
  const [bx,by,bz]=body,[hx,hy,hz]=head;
  S.ball(body,bodySize,coat,{k:0});
  S.limb([0,by,bz+.22],[0,hy-.13,hz-.10],bodySize[0]*.38,headSize[0]*.53,coat,{k:.12});
  S.ball(head,headSize,coat,{k:.16});
  S.ball([0,hy-.115,hz+headSize[2]*.77],[headSize[0]*.52,headSize[1]*.34,headSize[2]*.38],face,{k:.045});
  const x=bodySize[0]*.72,lf=stage===2?.12:.085;
  for(const side of [-1,1])for(const front of [false,true]){
    const z=bz+(front?bodySize[2]*.58:-bodySize[2]*.55);
    const fx=side*x*(front? .94:1.08),fz=z+(front?.10:-.035);
    S.limb([side*x*.85,by-.09,z],[fx,lf+.045,fz],bodySize[0]*.31,bodySize[0]*.22,coat,{k:.08});
    S.ball([fx,lf,fz+.04],[bodySize[0]*.28,lf*.9,bodySize[0]*.32],feet,{k:.035});
  }
};

function leafFamily(S,D,stage){
  const small=stage===0,old=stage===2;
  const B=small?[0,.44,-.10]:stage===1?[0,.61,-.15]:[0,.74,-.19];
  const H=small?[0,.88,.23]:stage===1?[0,1.29,.40]:[0,1.71,.51];
  const bs=small?[.36,.32,.47]:stage===1?[.47,.39,.64]:[.60,.49,.78];
  const hs=small?[.34,.31,.34]:stage===1?[.39,.34,.37]:[.45,.38,.41];
  const green=old?'#e5dabe':'#f1e8d4',leaf=old?'#5e9856':'#6dbb55',dark='#377a4d';
  quadruped(S,{body:B,head:H,bodySize:bs,headSize:hs,coat:green,face:'#fff6e8',feet:green,stage});
  S.paint(E([0,H[1]+hs[1]*.6,H[2]-.025],[hs[0]*.90,hs[1]*.42,hs[2]*.9]),leaf,.045);
  S.paint(E([0,B[1]+bs[1]*.63,B[2]],[bs[0]*.87,bs[1]*.40,bs[2]*.95]),stage===2?'#54874d':'#8bc767',.055);
  S.paint(E([0,B[1]-.09,B[2]+bs[2]*.72],[bs[0]*.58,bs[1]*.64,bs[2]*.25]),'#fff6df',.055);
  // Two high, pointed ears: creamy core with real thick leaf sheaths.
  for(const s of [-1,1]){
    const u=[s*hs[0]*.65,H[1]+hs[1]*.64,H[2]-.09];
    const v=[s*(hs[0]+(old?.34:.22)),H[1]+hs[1]+(small?.32:old?.54:.40),H[2]-.20];
    S.limb(u,v,small?.125:.145,.018,green,{k:.06});
    D.leaf(leaf,u,v,small?.19:old?.30:.23,s*.14,true);
    const inner=[s*(hs[0]+(old?.12:.08)),H[1]+hs[1]+.12,H[2]-.13];
    D.ball('#b4d977',inner,[.065,.17,.022],[0,0,-s*.39]);
  }
  const neck=H[1]-hs[1]*.79,z=H[2]+.06;
  // Collar of dimensional leaves (not a printed texture).
  for(let i=-2;i<=2;i++){
    const a=i*.47;
    const from=[Math.sin(a)*hs[0]*.79,neck+.04,z-.07];
    const to=[Math.sin(a)*hs[0]*1.23,neck-(small?.22:old?.39:.31),z+.20];
    D.leaf(i%2?'#579b4e':'#83ca64',from,to,small?.13:old?.20:.17,a*.28,true);
  }
  // Leaf-tail grows from a tiny bud into a three-lobed fan and then a forest fan.
  const tailStart=[0,B[1]+.09,B[2]-bs[2]*.73],tailEnd=[0,B[1]+(small?.30:old?.63:.50),B[2]-bs[2]-(small?.42:old?.87:.67)];
  S.limb(tailStart,tailEnd,small?.095:old?.17:.13,.035,green,{k:.08});
  const n=small?2:stage===1?4:7;
  for(let i=0;i<n;i++){
    const a=(i-(n-1)/2)*(.28+(old?.03:0));
    const p=[Math.sin(a)*.15,tailEnd[1]-.05,tailEnd[2]+.09];
    const q=[Math.sin(a)*(small?.37:old?.78:.58),tailEnd[1]+(i%2?.20:.36),tailEnd[2]-(small?.10:old?.42:.24)];
    D.leaf(i%2?'#3f944d':'#96d65e',p,q,small?.16:old?.29:.23,a,true);
  }
  if(stage>0){
    // Leaf blades flare from the shoulders and spine, giving teens a recognizable silhouette.
    for(const s of [-1,1])for(const i of [0,1]){
      const a=[s*bs[0]*.64,B[1]+bs[1]*.7,B[2]+(i?.12:-.23)];
      const b=[s*(bs[0]+(old?.43:.26)),B[1]+bs[1]+(i?.20:.33),B[2]+(i?.26:-.36)];
      D.leaf(i?'#b1db7f':'#498d4d',a,b,old?.26:.18,s*.23,true);
    }
  }
  if(old){
    // Antler-like flowering branches grow behind the ears.
    for(const s of [-1,1]){
      const from=[s*.25,1.9,H[2]-.22],fork=[s*.47,2.16,H[2]-.26],top=[s*.73,2.32,H[2]-.32];
      D.stick('#785738',from,fork,.044);D.stick('#785738',fork,top,.030);
      D.stick('#785738',fork,[s*.40,2.37,H[2]-.26],.025);
      D.leaf('#67b75d',fork,[s*.87,2.35,H[2]-.35],.15,s*.3,true);
    }
    const flowers=[[.51,1.83,-.32],[-.40,1.94,-.37],[.13,1.73,-.61]];
    for(const [x,y,z] of flowers){
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;D.ball('#fff4d2',[x+Math.cos(a)*.075,y+Math.sin(a)*.075,z],[.065,.065,.035]);}
      D.ball('#f2bd48',[x,y,z+.04],[.054,.054,.024]);
    }
  }
  D.ball('#668c52',[0,H[1]-.14,H[2]+hs[2]*1.01],[.046,.035,.033]);
  D.face({c:H,spread:small?.40:.43,pitch:small?-.01:.05,size:small?.087:old?.077:.080,
    iris:'#397f53',cheek:small?'#f5b4ac':false,mouth:small?'open':'smile',mouthPitch:-.32,mouthW:.060,
    lid:old?.12:0,lidColor:green});
}

function flameFamily(S,D,stage){
  const small=stage===0,old=stage===2;
  const B=small?[0,.43,-.15]:stage===1?[0,.60,-.17]:[0,.76,-.25];
  const H=small?[0,.91,.20]:stage===1?[0,1.32,.39]:[0,1.77,.48];
  const bs=small?[.37,.31,.49]:stage===1?[.50,.39,.63]:[.67,.51,.86];
  const hs=small?[.35,.32,.34]:stage===1?[.40,.35,.36]:[.48,.38,.40];
  const orange=old?'#bb4b32':stage===1?'#e36b34':'#f48a3d';
  quadruped(S,{body:B,head:H,bodySize:bs,headSize:hs,coat:orange,face:'#fbe4c5',feet:old?'#713b31':orange,stage});
  S.paint(E([0,B[1]-.10,B[2]+bs[2]*.77],[bs[0]*.55,bs[1]*.75,bs[2]*.27]),'#f9e4bd',.055);
  S.paint(E([0,H[1]-.02,H[2]+hs[2]*.93],[hs[0]*.66,hs[1]*.53,hs[2]*.20]),'#fff0d2',.05);
  for(const s of [-1,1]){
    const base=[s*hs[0]*.7,H[1]+hs[1]*.61,H[2]-.13];
    const tip=[s*(hs[0]+(small?.15:old?.28:.22)),H[1]+hs[1]+(small?.42:old?.53:.52),H[2]-.26];
    S.limb(base,tip,small?.13:.15,.012,orange,{k:.04});
    const inner=[s*(hs[0]+(small?.06:.13)),H[1]+hs[1]+.18,H[2]-.08];
    D.ball('#ffa96b',inner,[.075,small?.19:.25,.025],[0,0,-s*.3]);
  }
  // Cream fur spikes along cheeks and ruff.
  for(const side of [-1,1]){
    for(let i=0;i<(small?2:old?4:3);i++){
      const y=H[1]-(small?.17:.18)-i*.085;
      D.spike(i%2?'#f8deae':'#fff2d6',[side*hs[0]*.52,y,H[2]+.06],
       [side*(hs[0]+.12+i*.055),y-.10,H[2]+.09],small?.065:old?.085:.075);
    }
  }
  if(stage>0){
    // Fiery mane: actual layered, pointed meshes and warm internal glow.
    const count=old?14:8;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2;
      const x=Math.sin(a)*hs[0]*.92;
      const z=H[2]-hs[2]*.3+Math.cos(a)*hs[2]*.70;
      const y=H[1]+Math.cos(a)*hs[1]*.58;
      const vx=Math.sin(a)*(old?.63:.35),vy=Math.cos(a)*(old?.54:.33);
      const tip=[x+vx,y+vy-.05,z-(old?.18:.13)];
      const col=i%3===0?'#ffdb65':i%2?'#f97030':'#ef4c31';
      D.spike(col,[x,y,z],tip,old?.115:.089);
    }
    for(const side of [-1,1])D.spike('#ffc457',
      [side*.2,H[1]+hs[1]*.75,H[2]-.05],
      [side*(old?.38:.28),H[1]+hs[1]+(old?.38:.31),H[2]-.20],old?.13:.09);
  }else{
    D.flame(0,H[1]+hs[1]+.14,H[2]-.11,.27);
  }
  // Signature FIRE TAIL: full 3D curved tail + 3 nested flame tongues.
  const tail0=[0,B[1]+.08,B[2]-bs[2]*.73];
  const tail1=[.20,B[1]+(small?.25:.38),B[2]-bs[2]-(small?.37:old?.77:.63)];
  const tail2=[.35,B[1]+(small?.50:old?.85:.65),tail1[2]-(small?.16:.28)];
  S.limb(tail0,tail1,small?.13:old?.20:.16,small?.08:.11,orange,{k:.06});
  S.limb(tail1,tail2,small?.075:old?.14:.10,.023,orange,{k:.05});
  D.flame(tail2[0],tail2[1]+(small?.13:.19),tail2[2],small?.54:stage===1?.94:1.15);
  if(old){
    // Volcarbón's final form carries flame geometry on back and feet too.
    for(const s of [-1,1]){
      D.spike('#fba648',[s*.52,1.05,-.48],[s*.70,1.45,-.56],.13);
      D.flame(s*.42,1.12,-.49,.35);
      for(const z of [.42,-.59])D.claws(s*.55,.13,z+.13,.95,'#ffe3b2');
    }
    D.ball(D.glow('#ffae54',.3),[0,B[1]+.18,B[2]+bs[2]*.95],[.13,.11,.04]);
  }
  D.ball('#55312b',[0,H[1]-.12,H[2]+hs[2]*1.10],[.060,.044,.039]);
  D.face({c:H,spread:.44,pitch:small?.02:.10,size:small?.090:old?.077:.08,
    iris:'#9e4e35',cheek:small?'#ffbc9d':false,mouth:small?'open':'smile',
    mouthPitch:-.31,mouthW:old?.085:.055,lid:old?.18:0,lidColor:orange,angry:old?.17:stage===1?.07:0});
}

function tideFamily(S,D,stage){
  const small=stage===0,old=stage===2;
  const B=small?[0,.39,-.08]:stage===1?[0,.61,-.16]:[0,.76,-.25];
  const H=small?[0,.87,.24]:stage===1?[0,1.29,.44]:[0,1.71,.57];
  const bs=small?[.36,.30,.44]:stage===1?[.45,.41,.62]:[.62,.49,.86];
  const hs=small?[.34,.30,.32]:stage===1?[.38,.34,.35]:[.47,.38,.41];
  const blue=small?'#429ed9':stage===1?'#3179c8':'#2669af';
  quadruped(S,{body:B,head:H,bodySize:bs,headSize:hs,coat:blue,face:'#f6f6eb',feet:'#347dba',stage});
  S.paint(E([0,B[1]-.04,B[2]+bs[2]*.79],[bs[0]*.65,bs[1]*.70,bs[2]*.26]),'#f0fbff',.06);
  S.paint(E([0,H[1]-.075,H[2]+hs[2]*.95],[hs[0]*.70,hs[1]*.56,hs[2]*.23]),'#fff9f0',.04);
  // Ear-fins: three-dimensional blades, growing into a crown.
  for(const s of [-1,1]){
    const base=[s*hs[0]*.82,H[1]+.12,H[2]-.12],tip=[s*(hs[0]+(small?.26:old?.68:.44)),H[1]+(small?.24:old?.38:.31),H[2]-.23];
    S.limb(base,tip,small?.10:.11,.012,'#57b4e8',{k:.04});
    D.leaf(old?'#67d2eb':'#65c5eb',base,tip,small?.15:old?.26:.22,s*.2,true);
    if(stage>0)D.spike('#f0cc84',
      [s*hs[0]*.38,H[1]+hs[1]*.7,H[2]-.17],
      [s*(hs[0]*.5+.13),H[1]+hs[1]+(old?.28:.18),H[2]-.21],.064);
  }
  for(let i=-1;i<=1;i++){
    const x=i*(old?.16:.10);
    D.spike(i?'#69c6eb':'#b9f0fa',
      [x,H[1]+hs[1]*.73,H[2]-.07],
      [x*1.2,H[1]+hs[1]+(small?.14:old?.34:.23),H[2]-.18],small?.065:old?.11:.083);
  }
  // Gills/flippers and swept fins on shoulders.
  for(const s of [-1,1]){
    D.leaf('#53b4e3',[s*bs[0]*.9,B[1]+.10,B[2]+.24],
      [s*(bs[0]+(small?.17:old?.45:.31)),B[1]+(small?.24:.36),B[2]+(small?.24:.38)],small?.15:old?.29:.24,s*.3,true);
    if(old)for(let k=0;k<3;k++)D.leaf(k%2?'#77d7ea':'#2c8dc8',
      [s*.25,1.20-k*.17,-.35],
      [s*(.67+k*.16),1.54-k*.07,-.64-k*.13],.19,s*.23,true);
  }
  // Tail becomes a tall curling wave, with actual 3D volume and translucent accents.
  const t0=[0,B[1]+.07,B[2]-bs[2]*.8];
  const t1=[.17,B[1]+(small?.22:stage===1?.49:.63),B[2]-bs[2]-(small?.24:old?.62:.45)];
  const t2=[.34,B[1]+(small?.42:stage===1?.85:1.13),t1[2]-(small?.22:old?.62:.42)];
  S.limb(t0,t1,small?.12:old?.21:.16,small?.09:.10,blue,{k:.06});
  S.limb(t1,t2,small?.09:old?.16:.11,.015,'#57bce8',{k:.06});
  for(const s of [-1,1]){
    const a=[t2[0]+s*.04,t2[1]-.10,t2[2]],b=[t2[0]+s*(small?.18:old?.50:.30),t2[1]+(small?.18:old?.48:.37),t2[2]-.16];
    D.leaf(s<0?'#80d8f4':'#a5eef7',a,b,small?.13:old?.30:.23,s*.26,true);
  }
  if(stage>0){
    // Hydrodynamic fins and gold crests define the adult rather than just a blue recolor.
    const n=old?5:3;
    for(let i=0;i<n;i++){
      const zz=B[2]-i*(old?.26:.24);
      D.leaf(i%2?'#9eeaf6':'#3b9ed9',[0,B[1]+bs[1]*.83,zz],
        [0,B[1]+bs[1]+(old?.32:.21)-i*.035,zz-.16],old?.18:.13,0,true);
    }
  }
  if(old){
    for(const s of [-1,1]){
      D.spike('#f8d184',[s*.23,1.94,H[2]-.18],[s*.44,2.30,H[2]-.21],.10);
      D.spike('#eac07e',[s*.36,1.82,H[2]-.15],[s*.68,2.02,H[2]-.20],.073);
    }
    D.gem([0,H[1]+.12,H[2]+hs[2]*.95],'#78edff',.079);
    for(const s of [-1,1]){
      D.leaf('#7fdef6',[s*.38,1.12,-.21],[s*.90,1.52,-.44],.20,s*.3);
      D.ball('#a4effb',[s*.68,1.23,-.38],[.07,.08,.05]);
    }
  }
  D.ball('#31638a',[0,H[1]-.13,H[2]+hs[2]*1.02],[.047,.034,.032]);
  D.face({c:H,spread:.40,pitch:small?.02:.06,size:small?.095:old?.074:.083,iris:'#2467ac',
    cheek:small?'#ffb3be':false,mouth:small?'open':'smile',mouthPitch:-.32,mouthW:.055,
    lid:old?.12:0,lidColor:blue});
}

// Existing IDs and evolutions remain unchanged, including save compatibility.
export const STARTER_EVOLUTIONS = Object.freeze({
  brotelo:(S,D)=>leafFamily(S,D,0),
  brotoso:(S,D)=>leafFamily(S,D,1),
  bosqueron:(S,D)=>leafFamily(S,D,2),
  brasin:(S,D)=>flameFamily(S,D,0),
  brason:(S,D)=>flameFamily(S,D,1),
  volcarbon:(S,D)=>flameFamily(S,D,2),
  charquin:(S,D)=>tideFamily(S,D,0),
  charcomar:(S,D)=>tideFamily(S,D,1),
  mareon:(S,D)=>tideFamily(S,D,2)
});
export const PREMIUM_STARTER_IDS=Object.freeze(Object.keys(STARTER_EVOLUTIONS));
