import * as T from 'three';

export const STORY_SPECIES=['brotoso','bosqueron','brason','volcarbon','charcomar','mareon','pipiolo','roedon','capullado','alasol','setin','seton','chispaz','voltaz','guijarrin','penon','medusin','meduson','sombrin','sombrador','mentelin','espejalba'];

// Original silhouettes and palettes from Alborada's species descriptions and pixel art.
export function storyCreature(r,sp){
  if(!STORY_SPECIES.includes(sp))throw new Error(`Especie sin modelo: ${sp}`);
  const g=new T.Group();
  const ball=(c,x,y,z,w,h=w,d=w)=>r.ball(g,c,x,y,z,w,h,d);
  const box=(c,x,y,z,w,h,d)=>r.box(g,c,x,y,z,w,h,d,true);
  const shape=(s,c,p,size)=>r.mesh(g,s,c,p,size);
  const glow=c=>r.mat(c,{emissive:c,emissiveIntensity:.28,roughness:.5});
  let eyes=[.18,.8,.42],eyeColor='#273743';
  const feet=(color,x=.3,z=.18)=>{for(const side of [-1,1])ball(color,side*x,.1,z,.18,.1,.23);};
  const flame=(x,y,z,s=1)=>{
    for(let i=0;i<3;i++){const m=shape('cone',glow(i===1?'#ffdc75':'#f18d43'),[x+(i-1)*s*.14,y+(i===1?.15:0)*s,z],[.17*s,.65*s,.16*s]);m.rotation.z=(i-1)*-.22;}
  };
  const antenna=(color,tip,y=1.25)=>{for(const x of [-.19,.19]){box(color,x,y,0,.035,.35,.035);ball(tip,x,y+.19,0,.065);}};
  if(sp==='brotoso'||sp==='bosqueron'){
    const forest=sp==='bosqueron';
    shape('leaf','#8b7b60',[0,.46,0],[.78,.48,.64]);ball('#577e45',0,.75,0,.65,.2,.5);
    for(const x of [-.48,.48])for(const z of [-.32,.32])ball('#a28d69',x,.13,z,.2,.13,.23);
    ball('#c0ad85',0,.4,.55,.34,.25,.22);eyes=[.15,.46,.75];
    if(forest){
      shape('cylinder','#8c6745',[0,1.1,-.08],[.13,.8,.13]);
      for(const [x,y,z,s] of [[0,1.62,0,.52],[-.35,1.48,0,.36],[.34,1.5,-.1,.38]])shape('leaf','#56935a',[x,y,z],[s,s*.7,s]);
    }else{
      box('#60834a',0,1.1,0,.05,.65,.05);
      for(const side of [-1,1]){const m=ball('#88b85e',side*.25,1.22+side*.06,0,.3,.07,.15);m.rotation.z=side*.3;ball(side===1?'#e5a7bb':'#edd17a',side*.4,.92,.1,.1);}
    }
  }else if(sp==='brason'||sp==='volcarbon'){
    const volcano=sp==='volcarbon';
    ball('#494351',0,.55,0,volcano?.76:.49,.5,.47);feet('#e8d8c0',volcano?.48:.29);
    for(const side of [-1,1]){ball('#494351',side*.62,.5,.05,.23,.18,.22);for(let i=0;i<3;i++)box('#efe0c6',side*.62+(i-1)*.08,.44,.26,.045,.05,.19);}
    if(volcano){
      const geo=new T.CylinderGeometry(.22,.46,.8,9);const m=new T.Mesh(geo,r.mat('#745e4d'));m.position.set(0,1.08,-.18);m.userData.ownedGeometry=true;g.add(m);
      shape('cylinder',glow('#ffb953'),[0,1.49,-.18],[.23,.035,.23]);flame(0,1.65,-.18,.48);
      ball('#5a5065',0,.65,.4,.35,.28,.22);eyes=[.17,.72,.59];eyeColor='#f5ca65';
    }else{ball('#494351',0,1.1,0,.36,.32,.33);flame(.25,1.03,-.23,.65);flame(0,1.62,0,.5);eyes=[.15,1.14,.3];}
    ball('#df9798',0,eyes[1]-.12,eyes[2]+.05,.08,.045,.035);
  }else if(sp==='charcomar'||sp==='mareon'){
    const final=sp==='mareon';ball(final?'#397eb8':'#418fc3',0,.55,0,.5,.5,.4);ball('#c1e7ec',0,.5,.33,.33,.36,.1);
    ball('#418fc3',0,1.12,0,.34,.37,.32);feet('#347aa6');eyes=[.14,1.15,.3];
    for(const side of [-1,1]){
      const fin=ball('#a1d9e9',side*.64,.91,0,final?.25:.37,final?.52:.13,.1);fin.rotation.z=side*-.2;
      ball('#9bd2e8',side*.58,.63,-.03,.25,.09,.1);
    }
    for(let i=-1;i<=1;i++)ball('#aadfeb',i*.18,1.63-Math.abs(i)*.08,0,.06,i===0?.23:.17,.065);
    if(final)ball(glow('#d797cf'),0,1.37,.28,.07,.08,.025);
  }else if(sp==='pipiolo'){
    ball('#bb8058',0,.62,0,.45,.51,.38);ball('#efdfc4',0,.55,.28,.3,.34,.13);ball('#bb8058',0,1.2,0,.31);
    for(const side of [-1,1]){const wing=ball('#966540',side*.65,.95,0,.48,.21,.15);wing.rotation.z=side*.45;ball('#5ba9a6',side*.97,.79,0,.14,.15,.12);}
    feet('#d8a452',.17);const beak=shape('cone','#e3b353',[0,1.11,.38],[.12,.25,.12]);beak.rotation.x=Math.PI/2;
    for(let i=-1;i<=1;i++)box('#5ba9a6',i*.085,1.58-Math.abs(i)*.04,0,.04,.25,.07);eyes=[.13,1.24,.28];
  }else if(sp==='roedon'){
    ball('#b98e64',0,.64,0,.58,.6,.44);ball('#e5cfad',0,.51,.34,.36,.36,.12);feet('#977048');
    const tail=ball('#8d6946',.45,.14,-.48,.29,.09,.52);tail.rotation.y=-.5;
    for(const x of [-.35,.35]){ball('#a67d54',x,1.2,0,.16);ball('#d1a18e',x,1.2,.13,.09,.09,.025);}
    box('#fff2d9',0,.61,.45,.17,.17,.05);ball('#805946',0,.76,.46,.09,.06,.03);eyes=[.2,.91,.37];
  }else if(sp==='capullado'){
    ball('#a6ba80',0,.72,0,.38,.68,.35);ball('#c1ce99',0,.83,.07,.29,.49,.3);
    for(let i=0;i<6;i++){const ring=shape('ring','#8d9e65',[0,.27+i*.18,0],[.32,.3,.22]);ring.rotation.x=Math.PI/2;}
    box('#e4e2c8',0,1.55,0,.035,.35,.035);eyes=[.14,.92,.35];
  }else if(sp==='alasol'||sp==='mentelin'){
    const moth=sp==='mentelin',wing=moth?'#e4d4ed':'#efd067',accent=moth?'#b998d5':'#e3a14b';
    ball(moth?'#bd9bd3':'#705640',0,.8,0,moth?.3:.15,.43,.17);ball(moth?'#c3a5dc':'#705640',0,1.25,0,.2);
    for(const side of [-1,1]){ball(wing,side*.5,1.14,-.04,.41,.34,.075);ball(accent,side*.43,.67,-.04,.28,.24,.07);ball(moth?'#c2a3da':'#fff0b3',side*.57,1.18,.04,.17,.17,.025);if(!moth)ball('#76513e',side*.44,.67,.035,.08,.09,.025);}
    antenna(moth?'#9677ae':'#705640',moth?'#da86b2':'#eaca69',1.55);eyes=[.085,1.27,.18];
    if(moth)ball(glow('#dca2c9'),0,1.41,.14,.055);
  }else if(sp==='setin'||sp==='seton'){
    const large=sp==='seton';ball('#eddec1',0,.4,0,.3,.38,.28);feet('#cdb997',.2);
    ball(large?'#b76043':'#d47e51',0,.99,0,large?.8:.67,.35,.62);ball('#eed9ba',0,.79,0,large?.76:.62,.07,.59);
    for(let i=0;i<7;i++){const a=i*2.4,rad=i%2?.42:.22;ball('#fff1d6',Math.cos(a)*rad,1.24-Math.pow(rad,2)*.3,Math.sin(a)*rad,.065,.02,.065);}
    if(large){for(const side of [-1,1])ball('#ead7b7',side*.37,.43,0,.18,.07,.08);ball('#88b761',.56,.52,0,.17,.05,.09);}
    eyes=[.12,.42,.26];
  }else if(sp==='chispaz'||sp==='voltaz'){
    const final=sp==='voltaz';ball(final?'#477ac0':'#eac65c',0,.65,0,.53,.5,.43);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const m=shape('cone',final?'#477ac0':'#eac65c',[Math.cos(a)*.47,.67+Math.sin(a)*.45,0],[.1,.24,.09]);m.rotation.z=a-Math.PI/2;}
    ball('#f0d477',0,.58,.35,.35,.35,.1);feet('#e9cd6c');
    if(!final){antenna('#52606c','#80c1e2',1.28);for(let i=0;i<3;i++)box('#5b85bd',.48+i*.09,.58+i*.13,-.05,.13,.12,.1);}
    eyes=[.16,.75,.42];
  }else if(sp==='guijarrin'||sp==='penon'){
    const big=sp==='penon';shape('leaf',big?'#8d9396':'#a2a8ad',[0,.59,0],[big?.65:.53,big?.6:.49,.47]);
    for(const side of [-1,1])shape('leaf','#899197',[side*.65,.43,0],[big?.25:.17,.2,.2]);
    if(big){ball('#77a967',0,1.13,0,.48,.1,.31);feet('#777d84');}
    box('#69717b',-.15,.91,.36,.17,.02,.015);box('#69717b',.27,.4,.4,.13,.02,.015);eyes=[.18,.65,.44];
  }else if(sp==='medusin'||sp==='meduson'){
    const large=sp==='meduson';ball('#78b9d9',0,1.03,0,large?.66:.53,.44,.5);ball('#b0dbe7',-.1,1.21,.04,.36,.24,.35);
    ball('#4f9ebf',0,.8,0,large?.63:.51,.065,.48);
    for(let i=0;i<(large?7:5);i++){const a=i*2.4;for(let j=0;j<5;j++)ball(i%2&&large?'#b7a2d5':'#9bcedf',Math.cos(a)*.32+Math.sin(j*.8+i)*.04,.7-j*.12,Math.sin(a)*.3,.04,.1,.04);}
    if(large){for(let i=-2;i<=2;i++)ball('#c0a7dc',i*.18,1.48+Math.cos(i)*.07,0,.065,.12,.07);ball(glow('#dfa0ca'),0,1.08,.49,.1,.1,.025);}
    eyes=[large?.24:.16,1.1,.45];
  }else if(sp==='sombrin'||sp==='sombrador'){
    const big=sp==='sombrador',c=big?'#493951':'#5f4b6e';ball(c,0,.5,0,.45,.45,.36);ball(c,0,1.05,0,.33,.31,.3);feet(c);
    for(const side of [-1,1]){shape('cone',c,[side*.23,1.43,0],[.12,.37,.13]);if(big){ball(c,side*.5,.68,0,.25,.11,.14);for(let j=0;j<3;j++)box('#e4dfeb',side*.62,.62,.08+j*.07,.035,.14,.03);}}
    for(let i=0;i<4;i++)ball(c,.4+i*.07,.35+i*.13,-.2,.11-i*.017);
    eyes=[.14,1.1,.29];eyeColor=big?'#ed7879':'#e8d06c';box('#e5dfec',0,.92,.3,.13,.035,.025);
  }else if(sp==='espejalba'){
    ball('#edf5f4',0,.5,0,.45,.43,.37);ball('#c4e4ec',0,.48,.3,.3,.29,.1);
    shape('cylinder','#e9f2f2',[0,1.05,0],[.1,.8,.1]);ball('#edf5f4',.05,1.48,.03,.24,.2,.21);
    const beak=shape('cone','#e7be63',[.05,1.43,.34],[.08,.3,.09]);beak.rotation.x=Math.PI/2;
    for(const side of [-1,1]){const wing=ball('#d7edf2',side*.65,.92,-.08,.33,.63,.1);wing.rotation.z=side*-.15;ball('#91c9e1',side*.66,.94,.015,.23,.47,.04);box('#edf8fa',side*.66-.05,1.02,.062,.035,.4,.016);}
    for(let i=-1;i<=1;i++)shape('cone','#94d3e6',[i*.09,1.78,0],[.045,.23-Math.abs(i)*.04,.045]);
    eyes=[.09,1.51,.21];eyeColor='#425c91';ball('#93cadc',0,.09,-.12,.32,.07,.3);
  }
  for(const x of [-eyes[0],eyes[0]]){ball(eyeColor,x,eyes[1],eyes[2],.045,.063,.023);ball('#fff9e5',x-.012,eyes[1]+.024,eyes[2]+.02,.014,.018,.006);}
  r.batch(g);return g;
}
