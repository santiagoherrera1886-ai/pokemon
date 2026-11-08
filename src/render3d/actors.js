import * as T from 'three';
import {LOOKS} from '../art/characters.js';
import {actorPosition} from './policy.js';

export function character(r, look='player') {
  const L=LOOKS[look] || LOOKS.player, root=new T.Group(), body=new T.Group();root.add(body);
  const b=(p,c,x,y,z,w,h,d)=>r.box(p,c,x,y,z,w,h,d,true);
  const ball=(p,c,x,y,z,w,h=w,d=w)=>r.ball(p,c,x,y,z,w,h,d);
  b(body,L.shirt,0,.55,0,.4,.46,.28);b(body,L.accent,0,.76,.13,.3,.07,.03);
  if(L.apron)b(body,L.apron,0,.5,.16,.29,.34,.025);
  if(L.coat)for(const x of [-.13,.13])b(body,L.coat,x,.5,.12,.15,.53,.12);
  if(L.bag){b(body,L.bag,0,.6,-.22,.33,.35,.19);b(body,'#cf8943',0,.53,-.33,.25,.15,.03);for(const x of [-.13,.13])b(body,L.bag,x,.58,.15,.05,.31,.025);}
  if(L.scarf){b(body,L.scarf,0,.76,0,.43,.13,.35);b(body,L.scarf,-.14,.56,-.21,.13,.37,.07);}
  r.batch(body);
  const head=new T.Group();head.position.y=.96;root.add(head);
  ball(head,L.skin,0,.08,0,.29,.29,.26);ball(head,L.hair,0,.19,-.035,.3,.23,.27);
  b(head,L.skin,0,.04,.17,.43,.3,.16);
  for(const x of [-.105,.105]){
    ball(head,'#2c3441',x,.065,.264,.035,.052,.022);ball(head,'#fff9e9',x-.009,.086,.28,.012,.016,.007);
    ball(head,'#e7a18d',x*1.5,-.01,.255,.04,.018,.012);
    ball(head,L.skin,x*2.7,.035,0,.06,.09,.065);
  }
  b(head,'#ab7059',0,-.045,.269,.06,.012,.01);
  if(L.style==='cap'){
    ball(head,L.hat,0,.27,-.025,.32,.15,.285);b(head,L.hat,0,.22,.21,.5,.055,.35);
    b(head,L.hatBand,0,.3,.23,.15,.075,.025);b(head,L.hatBand,0,.23,-.28,.3,.04,.025);
  } else if(L.style==='spiky') {
    for(let i=0;i<5;i++){const spike=r.mesh(head,'cone',L.hair,[-.2+i*.1,.38,0],[.085,.19+(i%2)*.08,.09]);spike.rotation.z=(2-i)*.2;}
  } else if(L.style==='bun')ball(head,L.hair,0,.34,-.2,.16);
  else if(L.style==='long'){b(head,L.hair,0,-.06,-.18,.51,.43,.14);for(const x of [-.24,.24])b(head,L.hair,x,.02,-.01,.1,.4,.17);}
  if(L.cap){b(head,L.cap,0,.31,0,.43,.12,.35);b(head,L.accent,0,.31,.19,.08,.06,.025);}
  r.batch(head);
  const limbs=[];
  for(const side of [-1,1]) {
    const arm=new T.Group();arm.position.set(side*.27,.69,0);root.add(arm);
    b(arm,L.coat||L.shirt,0,-.08,0,.15,.22,.18);ball(arm,L.skin,0,-.235,0,.078,.09,.075);r.batch(arm);limbs.push(arm);
  }
  for(const side of [-1,1]) {
    const leg=new T.Group();leg.position.set(side*.11,.34,0);root.add(leg);
    b(leg,L.pants,0,-.1,0,.17,.26,.2);b(leg,L.shoes,0,-.25,.055,.2,.13,.3);r.batch(leg);limbs.push(leg);
  }
  const shadow=r.shadow(root,0,0,.95,.75);
  return {root,body,head,limbs,shadow,phase:0,look};
}

const ANGLES=[0,Math.PI,-Math.PI/2,Math.PI/2];
export function animateCharacter(rig, actor, map, time, dt, talking=false) {
  const p=actorPosition(actor,map), walk=!!actor.moving, run=walk && actor.moving.dur <=10;
  rig.root.position.set(p.x,0,p.z);
  const target=ANGLES[actor.dir] || 0, delta=Math.atan2(Math.sin(target-rig.root.rotation.y),Math.cos(target-rig.root.rotation.y));
  rig.root.rotation.y+=delta*Math.min(1,dt*20);
  rig.phase += dt*(run?21:walk?13:0);
  const swing=walk?Math.sin(rig.phase)*(run?.85:.55):0;
  rig.limbs[0].rotation.x=swing;rig.limbs[1].rotation.x=-swing;
  rig.limbs[2].rotation.x=-swing;rig.limbs[3].rotation.x=swing;
  rig.body.position.y=walk?Math.abs(Math.sin(rig.phase))*.045:Math.sin(time*2.2)*.009;
  rig.head.position.y=.96+rig.body.position.y;
  rig.head.rotation.x=talking?Math.sin(time*7)*.05:0;
  if(talking&&!walk)rig.limbs[1].rotation.z=-.22-Math.sin(time*4)*.08;else rig.limbs[1].rotation.z=0;
}

// Six original creatures, modeled from their existing palettes and species descriptions.
export function creature(r,sp) {
  const root=new T.Group(),model=new T.Group();root.add(model);
  const b=(c,x,y,z,w,h,d)=>r.box(model,c,x,y,z,w,h,d,true);
  const ball=(c,x,y,z,w,h=w,d=w)=>r.ball(model,c,x,y,z,w,h,d);
  let eyeY=.64,eyeZ=.43,eyeX=.16;
  if(sp==='brotelo'){
    ball('#b4a482',0,.48,0,.65,.46,.5);ball('#5b9d50',0,.78,-.035,.63,.22,.46);
    for(let i=0;i<7;i++)ball('#6eb563',Math.sin(i*2.4)*.47,.67,Math.cos(i*2.4)*.4,.14,.12,.14);
    b('#4a7944',0,1.04,0,.05,.45,.05);
    const a=ball('#9bcb69',-.2,1.2,0,.29,.07,.13);a.rotation.z=-.25;
    const c=ball('#7ab45b',.2,1.3,0,.29,.07,.13);c.rotation.z=.25;
    eyeY=.49;eyeZ=.47;eyeX=.22;
    for(const x of [-.36,.36])ball('#8d7954',x,.12,.05,.17,.1,.2);
  } else if(sp==='brasin') {
    ball('#555361',0,.47,0,.62,.44,.48);ball('#353e4a',0,.37,.13,.52,.27,.43);
    for(const x of [-.38,.38]){ball('#f0ddc2',x,.11,.15,.19,.08,.22);ball('#eb9168',x,.5,.39,.1,.07,.03);}
    for(let i=0;i<3;i++){const flame=r.mesh(model,'cone',r.mat(i%2?'#ffcc66':'#ef9256',{emissive:'#de6e2c',emissiveIntensity:.4}),[(i-1)*.17,1.01+(i%2)*.18,-.2],[.18,.8,.16]);flame.rotation.z=(i-1)*-.25;}
    ball('#db9391',0,.42,.5,.09,.05,.04);eyeY=.62;
  } else if(sp==='charquin') {
    ball('#4fa9c9',0,.48,0,.5,.46,.41);ball('#61b5d6',0,.87,0,.4,.36,.36);ball('#c0e6da',0,.44,.31,.33,.29,.12);
    for(const x of [-1,1]){ball('#9ddcda',x*.54,.65,0,.25,.09,.12);ball('#9ddcda',x*.56,.49,-.01,.2,.07,.1);ball('#408cb4',x*.28,.1,.11,.16,.08,.22);}
    const crest=ball('#9cdad8',0,1.33,-.02,.1,.23,.1);crest.rotation.z=.22;eyeY=.93;eyeZ=.32;
  } else if(sp==='pipiu') {
    ball('#bd8d65',0,.52,0,.47,.45,.39);ball('#f3dfb9',0,.45,.28,.31,.3,.15);ball('#bd8d65',0,1.02,0,.32,.31,.29);
    for(const x of [-1,1]){const wing=ball('#8b624e',x*.43,.62,0,.16,.34,.25);wing.rotation.z=x*.25;ball('#61b4b1',x*.46,.38,.03,.11,.1,.18);b('#daa34d',x*.19,.08,.1,.09,.08,.24);}
    const beak=r.mesh(model,'cone','#e2ae52',[0,.93,.38],[.12,.27,.12]);beak.rotation.x=Math.PI/2;
    for(const x of [-.07,.07])b('#8b624e',x,1.32,0,.055,.2,.07);eyeY=1.06;eyeZ=.25;eyeX=.135;
  } else if(sp==='roedin') {
    ball('#cea87f',0,.58,0,.58,.55,.42);ball('#f0debd',0,.42,.32,.36,.29,.12);
    for(const x of [-1,1]){ball('#b8906b',x*.37,1.07,0,.21,.23,.13);ball('#e3afa4',x*.37,1.07,.12,.13,.15,.025);ball('#ebbd91',x*.38,.62,.33,.17,.14,.09);ball('#a9845f',x*.3,.1,.11,.15,.08,.2);}
    ball('#82584f',0,.67,.45,.07,.045,.03);b('#fff4df',0,.55,.45,.11,.12,.035);eyeY=.8;eyeZ=.36;eyeX=.21;
  } else {
    for(let i=0;i<3;i++)ball(i%2?'#a1c96a':'#80b45f',0,.3,(-i+.6)*.4,.34,.3,.34);
    ball('#9dca70',0,.7,.48,.34,.34,.3);
    for(const x of [-.19,.19]){b('#63884c',x,1.1,.48,.045,.32,.045);ball('#d37e72',x,1.27,.48,.06);}
    eyeY=.78;eyeZ=.75;eyeX=.135;
  }
  for(const x of [-eyeX,eyeX]){ball('#273743',x,eyeY,eyeZ,.052,.08,.027);ball('#fff6df',x-.014,eyeY+.03,eyeZ+.023,.017,.025,.008);}
  r.batch(model);r.shadow(root,0,0,1.6,1.2);
  return {root,model,sp};
}
