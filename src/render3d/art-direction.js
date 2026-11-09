// ALBORADA · 3D ART DIRECTION v2
// Real geometry throughout the playable world. No sprite overlays or billboards.
// Shared visual language: ink / warm paper / violet / cyan / brass / flora.
// Every existing character role receives a distinctive visible accessory and
// every map gets subtle biome-appropriate microdetail, without new collision.
import * as T from 'three';

const PALETTE=Object.freeze({
 ink:'#29233f',plum:'#614b83',violet:'#af88e3',gold:'#edc27b',
 cream:'#fff3d2',aqua:'#85dfd8',mint:'#7bc59e',leaf:'#5fa478',
 flame:'#f18b53',rose:'#ef9eb3',stone:'#9b94b0'
});
const darker=(color,k=.7)=>new T.Color(color).multiplyScalar(k).getStyle();
const unit=()=>new T.Vector3(0,1,0);

function ornament(r,parent,shape,color,p,s,rot) {
 const m=r.mesh(parent,shape,color,p,s);
 if(rot)m.rotation.set(...rot);
 return m;
}
function gem(r,p,c,at,size=.052){
 return ornament(r,p,'crystal',c,at,[size,size*1.5,size]);
}
function stripe(r,p,c,at,length=.18,width=.02) {
 return ornament(r,p,'soft',c,at,[width,length,width*1.5]);
}
function medal(r,p,c,at,scale=.07){
 ornament(r,p,'crystal',PALETTE.gold,at,[scale*1.35,scale*1.35,scale*.26]);
 gem(r,p,c,[at[0],at[1],at[2]+scale*.27],scale*.53);
}
function laurel(r,p,c,center,side=1){
 const stem=ornament(r,p,'cylinder',darker(c),[center[0],center[1],center[2]],[.012,.20,.012]);
 stem.rotation.z=side*.32;
 for(let i=0;i<3;i++){
  const leaf=ornament(r,p,'leaf',i===1?PALETTE.mint:c,[center[0]+side*(i*.034-.02),center[1]+.055+i*.063,center[2]],[.064,.032,.014]);
  leaf.rotation.z=side*(.4+i*.2);
 }
}
function halo(r,p,c,pos,rad=.17){
 const ring=ornament(r,p,'ring',c,pos,[rad,rad,rad]);
 ring.rotation.x=Math.PI/2; return ring;
}
function crest(r,p,c,pos){
 ornament(r,p,'crystal',c,pos,[.082,.14,.04]);
 ornament(r,p,'box',PALETTE.cream,[pos[0],pos[1]-.03,pos[2]+.045],[.027,.085,.014]);
 ornament(r,p,'box',PALETTE.cream,[pos[0],pos[1]-.03,pos[2]+.045],[.08,.026,.014]);
}

export const VISUAL_ROLE_IDS=Object.freeze([
 'player','rival','mom','prof','aide','nurse','clerk','vendor','kid',
 'girl','old','man','rivalMom','hiedra','basalto','coral','grunt',
 'bruma','umbra','aurora','hiker','bugkid','swimmer','lass','sailor',
 'guard','courier'
]);

// Attaches to the actual rig: head-following details rotate with the head,
// torso details animate with walking/breathing. Works with custom avatars too.
export function dressCharacter(r,{root,body,head},look,L){
 const role=typeof look==='string' ? look : 'player';
 const hairColor=L.hair||'#513e48',accent=L.accent||PALETTE.gold;
 const torso=new T.Group(),face=new T.Group();
 torso.name='bruma-persona-'+role;face.name='bruma-head-'+role;
 body.add(torso);head.add(face);
 // Consistent 3D embroidery for everyone: the embroidered insignia never
 // changes identity / outfit colors / saved avatar settings.
 medal(r,torso,accent,[.107,.63,.147],.036);
 stripe(r,torso,darker(L.shirt||accent,.78),[0,.39,.16],.08,.018);
 switch(role){
  case 'player':
    medal(r,face,PALETTE.gold,[0,.30,.32],.060);
    ornament(r,torso,'box',PALETTE.gold,[.11,.46,.17],[.044,.061,.019]);
    ornament(r,torso,'soft',PALETTE.aqua,[-.105,.41,.17],[.050,.027,.025]);
    break;
  case 'rival':
    stripe(r,torso,PALETTE.mint,[-.075,.55,.18],.21,.045);
    medal(r,torso,PALETTE.gold,[0,.42,.18],.060);
    ornament(r,face,'crystal',PALETTE.gold,[-.12,.34,.20],[.060,.11,.06]);
    break;
  case 'prof':
  case 'aide':
    ornament(r,torso,'box','#f4fbf6',[-.14,.48,.17],[.085,.12,.015]);
    for(let i=0;i<3;i++)ornament(r,torso,'box',i%2?PALETTE.aqua:PALETTE.plum,[-.14,.53-i*.042,.183],[.058,.012,.006]);
    ornament(r,torso,'crystal',PALETTE.gold,[.19,.59,.15],[.040,.068,.030]);
    break;
  case 'nurse':
    crest(r,face,PALETTE.rose,[0,.33,.30]);
    ornament(r,torso,'box',PALETTE.rose,[0,.48,.19],[.050,.16,.018]);
    ornament(r,torso,'box',PALETTE.rose,[0,.49,.20],[.16,.050,.017]);
    break;
  case 'mom':
  case 'rivalMom':
    for(let i=0;i<5;i++){
     const a=i*Math.PI*2/5;
     ornament(r,torso,'ball',i%2?PALETTE.rose:PALETTE.cream,[.17+Math.cos(a)*.047,.55+Math.sin(a)*.044,.19],[.032,.032,.017]);
    }
    gem(r,torso,PALETTE.gold,[.17,.55,.20],.026);
    ornament(r,face,'ball',PALETTE.rose,[.26,.10,.08],[.052,.036,.034]);
    break;
  case 'hiedra':
    for(const s of [-1,1]){
      laurel(r,face,PALETTE.leaf,[s*.26,.27,.04],s);
      laurel(r,torso,PALETTE.mint,[s*.18,.56,.03],s);
    }
    gem(r,torso,PALETTE.gold,[0,.56,.18],.071);
    break;
  case 'coral':
    for(const s of [-1,1]){
      for(let j=0;j<3;j++)ornament(r,face,'crystal',j%2?PALETTE.aqua:'#4c9cd0',[s*(.25+j*.05),.04+j*.055,.04],[.035,.075,.032]);
      ornament(r,torso,'crystal','#b4f5f3',[s*.20,.62,.03],[.06,.12,.035]);
    }
    halo(r,torso,PALETTE.aqua,[0,.49,.16],.072);
    break;
  case 'basalto':
  case 'hiker':
    for(const s of [-1,1]){
      ornament(r,torso,'soft',PALETTE.stone,[s*.20,.59,0],[.11,.075,.15]);
      gem(r,face,PALETTE.gold,[s*.23,.23,.15],.05);
    }
    ornament(r,face,'crystal',PALETTE.cream,[0,.33,.31],[.07,.12,.055]);
    ornament(r,torso,'box',PALETTE.ink,[0,.48,.16],[.14,.08,.027]);
    break;
  case 'bruma':
    for(const s of [-1,1]){
      ornament(r,face,'crystal',PALETTE.violet,[s*.21,.31,-.09],[.065,.16,.07]);
      ornament(r,torso,'crystal',PALETTE.plum,[s*.22,.59,.01],[.07,.18,.045]);
    }
    medal(r,torso,PALETTE.violet,[0,.53,.19],.088);
    break;
  case 'umbra':
    for(const s of [-1,1]){
      ornament(r,torso,'soft',PALETTE.ink,[s*.23,.56,-.02],[.13,.09,.16]);
      ornament(r,face,'cone',PALETTE.plum,[s*.26,.30,-.03],[.070,.23,.07],[0,0,-s*.32]);
    }
    gem(r,torso,PALETTE.rose,[0,.53,.19],.085);
    break;
  case 'aurora':
    for(let i=-2;i<=2;i++)gem(r,face,i%2?PALETTE.aqua:PALETTE.cream,[i*.11,.38+(2-Math.abs(i))*.07,.04],.044);
    for(const s of [-1,1]){
      ornament(r,torso,'crystal',PALETTE.aqua,[s*.20,.65,-.01],[.07,.17,.037]);
    }
    gem(r,torso,PALETTE.aqua,[0,.54,.19],.076);
    break;
  case 'grunt':
    gem(r,face,PALETTE.gold,[0,.33,.29],.060);
    ornament(r,torso,'box',PALETTE.gold,[0,.51,.18],[.12,.043,.021]);
    for(const s of [-1,1])ornament(r,torso,'soft',PALETTE.plum,[s*.17,.62,0],[.12,.07,.14]);
    break;
  case 'guard':
    medal(r,face,PALETTE.gold,[0,.30,.28],.059);
    for(const s of [-1,1])ornament(r,torso,'soft',PALETTE.gold,[s*.21,.64,.03],[.105,.032,.135]);
    ornament(r,torso,'box',PALETTE.ink,[0,.40,.17],[.23,.039,.025]);
    break;
  case 'courier':
    for(const s of [-1,1])stripe(r,torso,PALETTE.cream,[s*.10,.53,.17],.15,.031);
    ornament(r,torso,'box',PALETTE.gold,[0,.43,.19],[.16,.09,.023]);
    medal(r,face,PALETTE.cream,[0,.31,.29],.037);
    break;
  case 'sailor':
    for(const s of [-1,1])ornament(r,torso,'soft',PALETTE.cream,[s*.16,.65,.075],[.13,.07,.13]);
    ornament(r,torso,'box',PALETTE.aqua,[0,.50,.18],[.040,.20,.025]);
    ornament(r,face,'soft',PALETTE.ink,[0,.33,.09],[.25,.027,.27]);
    break;
  case 'swimmer':
    for(const s of [-1,1])ornament(r,torso,'soft',PALETTE.aqua,[s*.19,.57,.02],[.065,.05,.15]);
    halo(r,torso,PALETTE.cream,[0,.52,.17],.06);
    break;
  case 'clerk':
  case 'vendor':
    ornament(r,torso,'soft',PALETTE.cream,[0,.51,.17],[.17,.14,.025]);
    for(let i=0;i<3;i++)stripe(r,torso,i%2?PALETTE.gold:PALETTE.plum,[-.09+i*.065,.51,.20],.065,.018);
    gem(r,torso,PALETTE.aqua,[.13,.58,.19],.032);
    break;
  case 'bugkid':
    ornament(r,torso,'crystal',PALETTE.leaf,[0,.50,.18],[.07,.11,.042]);
    for(const s of [-1,1])ornament(r,face,'crystal',PALETTE.mint,[s*.21,.35,-.01],[.045,.09,.045]);
    break;
  case 'kid':
  case 'girl':
  case 'lass':
    for(const s of [-1,1])ornament(r,face,'ball',PALETTE.gold,[s*.28,.21,.07],[.050,.043,.033]);
    medal(r,torso,PALETTE.mint,[0,.46,.18],.052);
    break;
  case 'old':
    ornament(r,torso,'crystal',PALETTE.gold,[0,.48,.18],[.043,.093,.04]);
    for(const s of [-1,1])ornament(r,face,'soft','#eeeee7',[s*.19,-.1,.21],[.075,.018,.027]);
    break;
  case 'man':
    stripe(r,torso,PALETTE.aqua,[0,.50,.18],.17,.027);
    medal(r,torso,PALETTE.gold,[.14,.57,.18],.042);
    break;
  default:
    medal(r,torso,PALETTE.gold,[0,.53,.16],.055);
 }
 // Batch only these decorative attachments; never flatten the animated rig.
 r.batch(torso);r.batch(face);
 return role;
}

const hash=(x,z,n=0)=>{
 const t=Math.sin(x*127.1+z*311.7+n*47.9)*43758.5453;
 return t-Math.floor(t);
};

// Decoration is deliberately non-solid: gameplay collision & map triggers
// stay entirely controlled by map objects. Batches with existing staticProps.
export function dressWorld(r,staticProps,map) {
 const outdoor=!!map.outdoor,style=map.style||'home',id=map.id||'';
 const cave=map.dark||/cave|cueva|min[a]?|eco|eclipse/i.test(id);
 const water=/marea|lago|rio|playa|beach|lake/i.test(id);
 const city=/ciudad|corola|cobre|villa|jubileo|league|liga/i.test(id);
 const natures=['#5e9b7c','#9dcf80','#7cc2a4','#e7bd8c','#cc9ec4'];
 const head=(x,z)=>map.at(x,z);
 if(outdoor) {
  // World flourishes in clear spaces between paths, flowers and structures.
  // ~1 per 25 cells, capped at 50 so every map remains performant.
  let count=0;
  for(let z=2;z<map.h-2&&count<48;z+=4)for(let x=2;x<map.w-2&&count<48;x+=4){
   const code=head(x,z),h=hash(x,z,3);
   if(!['.','g','F'].includes(code)||h<.26)continue;
   const xx=x+.23+hash(x,z)*.48,zz=z+.24+hash(z,x)*.50;
   if(cave){
    const c=h>.65?PALETTE.violet:PALETTE.aqua;
    gem(r,staticProps,c,[xx,.17,zz],.11+hash(x,z,5)*.075);
    gem(r,staticProps,PALETTE.stone,[xx+.16,.085,zz-.15],.055);
   }else if(water&&h>.58){
    for(let k=0;k<3;k++){
     const p=ornament(r,staticProps,'leaf',k%2?PALETTE.mint:PALETTE.aqua,[xx+(k-1)*.08,.09,zz],[.11,.029,.070]);
     p.rotation.y=k*.7;
    }
    gem(r,staticProps,PALETTE.cream,[xx,.14,zz],.035);
   }else if(city&&h>.67){
    ornament(r,staticProps,'soft','#d3c6aa',[xx,.075,zz],[.21,.12,.21]);
    ornament(r,staticProps,'crystal',PALETTE.gold,[xx,.155,zz],[.068,.10,.05]);
   }else{
    for(let k=0;k<3;k++){
     const a=k*2.1,dx=Math.cos(a)*.095,dz=Math.sin(a)*.095;
     const m=ornament(r,staticProps,'leaf',natures[(k+Math.floor(h*5))%5],
       [xx+dx,.12,zz+dz],[.08,.035,.13]);
     m.rotation.y=a;m.rotation.z=(k-1)*.35;
    }
    gem(r,staticProps,h>.7?PALETTE.rose:PALETTE.gold,[xx,.20,zz],.037);
   }
   count++;
  }
 }else{
  // Genuine dimensional interior trims and thematic emblems, pushed against
  // the back wall to avoid NPCs, door triggers, counters and floor movement.
  const c=style==='center'?PALETTE.aqua:style==='lab'?PALETTE.mint:
    style==='gym'?PALETTE.gold:style==='league'?PALETTE.violet:PALETTE.rose;
  const innerW=Math.max(0,map.w-2);
  for(let i=2;i<map.w-1;i+=3){
   const x=i+.5;
   ornament(r,staticProps,'soft',PALETTE.cream,[x,2.08,1.97],[.58,.08,.039]);
   ornament(r,staticProps,'box',c,[x,1.94,1.985],[.42,.047,.024]);
   gem(r,staticProps,PALETTE.gold,[x,2.13,2.06],.039);
  }
  const cx=map.w/2;
  if(style==='center'){
   ornament(r,staticProps,'box',PALETTE.cream,[cx,1.69,2.03],[.42,.35,.044]);
   ornament(r,staticProps,'box',PALETTE.rose,[cx,1.69,2.086],[.11,.30,.021]);
   ornament(r,staticProps,'box',PALETTE.rose,[cx,1.69,2.085],[.30,.11,.022]);
  }else if(style==='lab'){
   for(let k=-1;k<=1;k++){const ring=ornament(r,staticProps,'ring',PALETTE.aqua,[cx,1.67,2.055],[.26,.14,.12]);ring.rotation.y=k*.48;}
   gem(r,staticProps,PALETTE.gold,[cx,1.68,2.095],.08);
  }else if(style==='gym'||style==='league'){
   medal(r,staticProps,style==='gym'?PALETTE.mint:PALETTE.violet,[cx,1.73,2.06],.22);
   for(const side of [-1,1]){const m=ornament(r,staticProps,'crystal',c,[cx+side*.45,1.73,2.03],[.11,.25,.055]);m.rotation.z=side*.19;}
  }else{
   for(const side of [-1,1]){
    ornament(r,staticProps,'soft',PALETTE.gold,[cx+side*.39,1.63,2.0],[.11,.27,.07]);
    gem(r,staticProps,c,[cx+side*.39,1.92,2.04],.065);
   }
  }
 }
 return {outdoor,style,id};
}

// Battle arenas now share the architecture and typology of the rest of Bruma,
// rather than a plain flat square with duplicate generic trees.
export function dressBattle(r,ground,terrain='grass'){
 const ice=terrain==='lake'||terrain==='beach';
 const dark=['cave','eclipse','league'].includes(terrain);
 const color=dark?PALETTE.violet:ice?PALETTE.aqua:PALETTE.mint;
 const trim=dark?PALETTE.gold:PALETTE.cream;
 const spokes=12;
 for(const [cx,cz] of [[-2,1.5],[2,-1.8]]){
  for(let i=0;i<spokes;i++){
   const a=i*2*Math.PI/spokes;
   const x=cx+Math.cos(a)*1.53,z=cz+Math.sin(a)*1.19;
   const p=ornament(r,ground,'soft',i%3?trim:color,[x,.061,z],[.17,.045,.10]);
   p.rotation.y=-a;
  }
  const disc=ornament(r,ground,'crystal',color,[cx,.115,cz],[.08,.12,.07]);
  disc.rotation.y=.8;
 }
 for(const side of [-1,1])for(const z of [-5.1,4.7]){
  const x=side*8.0;
  ornament(r,ground,'soft',PALETTE.ink,[x,.41,z],[.70,.78,.70]);
  ornament(r,ground,'soft',trim,[x,.78,z],[.80,.13,.80]);
  const plume=ornament(r,ground,'crystal',color,[x,1.1,z],[.25,.39,.23]);
  plume.rotation.y=side*.35;
  gem(r,ground,PALETTE.gold,[x,1.53,z],.085);
 }
 for(let i=0;i<8;i++){
  const a=i*Math.PI*2/8,x=Math.cos(a)*5.5,z=Math.sin(a)*3.3;
  if(dark){gem(r,ground,color,[x,.20,z],.13);gem(r,ground,trim,[x+.17,.10,z],.06);}
  else if(ice){
   for(let j=0;j<3;j++){
    const m=ornament(r,ground,'leaf',j===1?'#eaf7ed':PALETTE.aqua,[x+j*.1,.09,z],[.14,.034,.09]);m.rotation.y=j*.6;
   }
  }else{
   for(let j=0;j<3;j++){
    const m=ornament(r,ground,'leaf',j%2?PALETTE.leaf:PALETTE.mint,[x+j*.08,.09,z],[.11,.085,.12]);m.rotation.z=(j-1)*.3;
   }
   gem(r,ground,PALETTE.rose,[x,.19,z],.032);
  }
 }
 return ground;
}

export const BRUMA_ART_PALETTE=PALETTE;
