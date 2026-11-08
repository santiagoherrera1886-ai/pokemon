import * as T from 'three';
import {LOOKS} from '../art/characters.js';
import {actorPosition} from './policy.js';
import {storyCreature,STORY_SPECIES} from './story-creatures.js';
import {person,animatePerson} from './people.js';
export const MODEL_SPECIES=['brotelo','brasin','charquin','pipiu','roedin','capullin',...STORY_SPECIES];

// Personajes: ver people.js (diseño chibi). Se mantienen estos nombres para el resto del motor.
export function character(r, look='player') { return person(r, look); }
export function animateCharacter(rig, actor, map, time, dt, talking=false) { animatePerson(rig, actorPosition(actor,map), actor, time, dt, talking); }

// Six original creatures, modeled from their existing palettes and species descriptions.
export function creature(r,sp) {
  if(STORY_SPECIES.includes(sp)){const root=new T.Group(),model=storyCreature(r,sp);root.add(model);r.shadow(root,0,0,1.8,1.3);return {root,model,sp};}
  if(!MODEL_SPECIES.includes(sp))throw new Error(`Especie sin modelo: ${sp}`);
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
