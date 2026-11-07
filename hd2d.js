/* SINNOH REBORN HD-2D · self-contained original browser adventure
   No ROM, emulator or file uploads. Built as a canvas engine.
   Unofficial fan prototype. Nintendo/PKMN trademarks belong to owners. */
"use strict";
const $=id=>document.getElementById(id),show=id=>$(id).classList.remove("hidden"),hide=id=>$(id).classList.add("hidden");
const canvas=$("screen"),ctx=canvas.getContext("2d",{alpha:false});
const T=54,TAU=Math.PI*2;
let W=innerWidth,H=innerHeight,dpr=1,zoom=1,last=0,elapsed=0,clock=0,near=null;
let started=false,modal="",dialog=null,dialogCallback=null,battle=null,battleBusy=false,scene="bedroom";
const keys=new Set(),saveKey="sinnohHD2DGameV1";
const species={Turtwig:[387,"Planta",25,9],Chimchar:[390,"Fuego",23,10],Piplup:[393,"Agua",24,9],Starly:[396,"Normal",17,7],Bidoof:[399,"Normal",21,7],Shinx:[403,"Eléctrico",18,9],Budew:[406,"Planta",17,7],Geodude:[74,"Roca",22,8],Magikarp:[129,"Agua",15,5],Kricketot:[401,"Bicho",16,6],Ponyta:[77,"Fuego",21,9],Buizel:[418,"Agua",19,8],Pachirisu:[417,"Eléctrico",21,8]};
const pokeImg=name=>"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+(species[name]?.[0]||396)+".png";
const questInfo=[
 ["Una mañana especial","Baja de tu habitación y habla con mamá."],
 ["Habla con mamá","Mamá te espera en el salón de tu casa."],
 ["¡Barry te busca!","Visita la casa de Barry en Pueblo Hojaverde."],
 ["El misterio del lago","Ve al Lago Veraz y revisa el maletín del profesor."],
 ["Tu primer combate","Defiende a tu nuevo compañero de un Starly salvaje."],
 ["Un regalo de mamá","Vuelve a casa y habla con mamá."],
 ["El profesor Serbal","Ve al laboratorio de Pueblo Arena y habla con el profesor."],
 ["Un mundo por explorar","Explora rutas, encuentra entrenadores y captura Pokémon."]
];
function fresh(){return {quest:0,scene:"bedroom",x:8.5,y:10,exitX:33.2,exitY:76.1,team:[],starter:null,balls:6,potions:3,wins:0,money:3000,flags:{},visited:["Hojaverde"],sound:true};}
let state=fresh();
const r=(x,y)=>{const h=Math.sin(x*127.1+y*311.7+42.13)*43758.5453123;return h-Math.floor(h)};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=c;ctx.fill()}
function poly(pts,color){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function line(x1,y1,x2,y2,color,width=.06){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function rounded(x,y,w,h,rad,color){ctx.beginPath();ctx.roundRect(x,y,w,h,rad);ctx.fillStyle=color;ctx.fill()}
function text(t,x,y,size,color,align="center"){ctx.fillStyle=color;ctx.font="900 "+(size/T)+"px Outfit,Arial";ctx.textAlign=align;ctx.fillText(t,x,y)}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+"px";canvas.style.height=H+"px";zoom=Math.min(1.58,Math.max(.82,Math.min(W/1280,H/740)*1.18));}
window.addEventListener("resize",resize);resize();
let cam={x:8,y:10};
const houses=[
 {x:27.7,y:68,w:11,h:7.8,kind:"home",name:"Tu casa",roof:"#317c70",walls:"#e6dfba",doorX:33.2,doorY:76.2},
 {x:8.5,y:52,w:11,h:7.8,kind:"barry",name:"Casa de Barry",roof:"#32887b",walls:"#e2d9b5",doorX:14,doorY:60.2},
 {x:8.5,y:68,w:9.5,h:7,kind:"neighbor1",name:"Casa de los vecinos",roof:"#367f72",walls:"#e4d5ad",doorX:13.3,doorY:75.3},
 {x:28,y:52,w:9.5,h:7,kind:"neighbor2",name:"Casa de los vecinos",roof:"#367f72",walls:"#e2d5ad",doorX:32.8,doorY:59.3},
 {x:52,y:17,w:10,h:8,kind:"lab",name:"Laboratorio Pokémon",roof:"#5e83a8",walls:"#e2e5d5",doorX:57,doorY:25.5},
 {x:62,y:29,w:8,h:7,kind:"center",name:"Centro Pokémon",roof:"#d65b68",walls:"#faf0dd",doorX:66,doorY:36.5},
 {x:46,y:29,w:8,h:7,kind:"mart",name:"Tienda Pokémon",roof:"#598bbb",walls:"#edf4e7",doorX:50,doorY:36.5},
 {x:63,y:-13,w:9,h:8,kind:"center2",name:"Centro Pokémon de Jubileo",roof:"#ce6575",walls:"#fff0da",doorX:67.5,doorY:-4.5},
 {x:47,y:-13,w:11,h:8,kind:"jubilife",name:"Estación de Jubileo",roof:"#789ab2",walls:"#dddfe7",doorX:52.5,doorY:-4.5}
];
const outdoorNPCs=[
 {x:21,y:62,name:"VECINA",kind:"chat",skin:"neighbor",dialog:["¡Qué bonita mañana en Pueblo Hojaverde! Dicen que Barry se ha ido a ver el Lago Veraz.","Sigue los caminos claros para recorrer el pueblo."]},
 {x:35,y:60,name:"ENTRENADOR",kind:"chat",skin:"boy",dialog:["¡Los Pokémon salvajes se esconden en la hierba alta! Necesitas un compañero para enfrentarlos."]},
 {x:29,y:33,name:"BARRY",kind:"barryOut",skin:"barry",dialog:["¡Vamos al lago, rápido! Tengo el presentimiento de que encontraremos algo increíble."]},
 {x:48,y:26,name:"AYUDANTE",kind:"chat",skin:"girl",dialog:["¡Bienvenido a Pueblo Arena! En el laboratorio encontrarás al profesor Serbal."]},
 {x:57,y:8,name:"ENTRENADOR LEO",kind:"trainer",skin:"boy",pokemon:"Shinx",dialog:["¡Te reto a un combate Pokémon!"]},
 {x:51,y:-1,name:"GUÍA DE JUBILEO",kind:"chat",skin:"girl",dialog:["¡Estás en Ciudad Jubileo! Desde aquí comienza una nueva etapa de tu aventura."]},
 {x:60,y:-18,name:"ENTRENADOR TOMÁS",kind:"trainer",skin:"barry",pokemon:"Geodude",dialog:["¡Mi Pokémon está listo para luchar!"]}
];
const pathRects=[
 [20.35,41,5,51],[5,77.6,35.4,3.9],[12.7,60.9,21.8,3.6],
 [12.6,59.1,3,21],[31.6,59.1,3.2,21],[13.1,75.6,21.2,3],[15,35.2,10,3.5],
 [20.5,19.5,4.3,23],[22,23.5,42.5,4.3],[55,14,4.4,11.4],
 [54.6,2,4.8,22],[50,36,16.8,3.5],[52,-23,5.4,27],
 [52,-3.5,17.3,3.3],[65,-4,4,16],[15.5,47,21,2.3]
];
const lake={cx:10.8,cy:32.2,rx:7.3,ry:9};
const villagePond={cx:8.6,cy:84.2,rx:2.25,ry:1.65};
const isPath=(x,y)=>pathRects.some(p=>x>=p[0]&&y>=p[1]&&x<=p[0]+p[2]&&y<=p[1]+p[3]);
const inTown=(x,y)=>x>6&&x<40&&y>49&&y<88;
const inSandgem=(x,y)=>x>43&&x<74&&y>12&&y<42;
const inJubilife=(x,y)=>x>45&&x<75&&y>-24&&y<9;
const inLake=(x,y)=>Math.pow((x-lake.cx)/lake.rx,2)+Math.pow((y-lake.cy)/lake.ry,2)<1;
const inPond=(x,y)=>((x-villagePond.cx)/villagePond.rx)**2+((y-villagePond.cy)/villagePond.ry)**2<1;
const grass=(x,y)=>!isPath(x,y)&&!inTown(x,y)&&!inSandgem(x,y)&&!inJubilife(x,y)&&!inLake(x,y)&&!inPond(x,y);
function treeAt(x,y){
 if(x<1||x>77||y<-24||y>93)return false;
 if(inLake(x,y)||inPond(x,y)||isPath(x,y)||inTown(x,y)||inSandgem(x,y)||inJubilife(x,y))return false;
 if(Math.abs(y-37)<3&&x>13&&x<25)return false;
 return r(Math.floor(x),Math.floor(y))>(y>46&&y<90&&x<44?.64:.82)&&r(Math.floor(x)+50,Math.floor(y)+11)>.28;
}
function obstacle(x,y){
 if(x<2.5||x>75||y<-22||y>90)return true;
 if(inLake(x,y)||inPond(x,y))return true;
 if(houses.some(h=>x>h.x+.18&&x<h.x+h.w-.18&&y>h.y+1.4&&y<h.y+h.h-.35))return true;
 if(scene!=="outside")return false;
 if(treeAt(x,y))return true;
 return false;
}
function sky(){
 const g=ctx.createLinearGradient(0,0,0,canvas.height);
 g.addColorStop(0,"#83c5ce");g.addColorStop(.65,"#a0cca9");g.addColorStop(1,"#c2dcae");
 ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
}
function groundTile(x,y){
 let color;
 const n=r(x,y);
 if(inLake(x+.5,y+.5)||inPond(x+.5,y+.5)){color=n>.5?"#6fbcc6":"#77c8cf";}
 else if(isPath(x+.5,y+.5)){color=n>.84?"#e6d4a9":n>.45?"#e2cca4":"#d9c39a";}
 else if(inTown(x+.5,y+.5)||inSandgem(x+.5,y+.5)||inJubilife(x+.5,y+.5)){color=n>.7?"#93c17a":n>.3?"#95c57f":"#8ec077";}
 else color=n>.73?"#79b36b":n>.33?"#80b96d":"#84b974";
 rect(x,y,1.01,1.01,color);
 if(inLake(x+.5,y+.5)){
   const wave=Math.sin(elapsed*1.5+x*2.8+y)*.055;
   if(n>.42)ellipse(x+.2+n*.6,y+.6,wave+.11,.025,"#d9fcf3a1");
 }else if(isPath(x+.5,y+.5)){
   if(n>.6)ellipse(x+.25+n*.32,y+.63,.04,.028,"#c4a77d88");
 }else{
   if(n>.1){
     const u=x+.12+n*.73,v=y+.3+r(x+71,y)*.55;
     line(u-.06,v+.1,u,v-.075,"#699d5b6b",.027);
     line(u+.05,v+.09,u,v-.075,"#699d5b6b",.027);
   }
   if(n>.89){ellipse(x+.55,y+.43,.055,.08,"#f3e2a7");ellipse(x+.62,y+.48,.055,.07,"#fff9e3");}
 }
}
function tree(x,y){
 ctx.save();ctx.translate(x+.5,y+.85);
 ellipse(.12,.03,.77,.30,"#1c694b60");
 rounded(-.15,-.64,.3,.69,.08,"#76583c");
 rounded(-.09,-.64,.13,.64,.03,"#9c7551");
 // two-tone clustered evergreen canopy
 ellipse(-.25,-1.19,.73,.82,"#317756");
 ellipse(.32,-1.25,.74,.84,"#377e58");
 ellipse(0,-1.50,.79,.91,"#4e9b6b");
 ellipse(-.22,-1.79,.44,.44,"#77b986");
 ellipse(.34,-1.47,.32,.37,"#63ab77");
 ellipse(-.55,-1.18,.25,.34,"#5a9f6c");
 line(-.25,-1.8,-.43,-1.6,"#a2d9a5",.045);
 ctx.restore();
}
function house(h){
 const x=h.x,y=h.y,w=h.w,b=h.h;
 ctx.save();ctx.translate(x,y);
 ellipse(w*.51,b+.3,w*.65,.60,"#1b4e4161");
 // plaster walls
 rounded(.4,2.18,w-.8,b-2.15,.18,"#ae9270");
 rounded(.57,2.24,w-1.14,b-2.55,.1,h.walls);
 rect(.8,2.5,w-1.6,.18,"#fff4d08c");
 for(let i=0;i<2;i++){
  const wx=1.5+i*(w-4);
  rounded(wx,3.1,1.55,1.64,.06,"#456e83");
  rect(wx+.14,3.26,1.26,1.32,"#9fdbe4");
  rect(wx+.7,3.24,.12,1.37,"#f9f1da");
  rect(wx+.13,3.82,1.28,.12,"#f9f1da");
  rect(wx+.16,3.28,.37,.34,"#ffffff67");
  rect(wx-.1,4.57,1.82,.15,"#d0b594");
 }
 // main door
 rounded(w/2-1.13,b-2.1,2.26,2.06,.12,"#674b46");
 rounded(w/2-.9,b-1.88,1.8,1.82,.09,h.kind==="lab"?"#375b72":"#956c57");
 ellipse(w/2+.56,b-1.02,.09,.09,"#f3d596");
 rect(w/2-1.47,b-.02,2.94,.18,"#ece1bd");
 // dark eaves and main shaped tiled roof
 poly([[-.35,2.55],[w*.13,.46],[w*.5,-.82],[w*.87,.46],[w+.35,2.55]],"#3c4e53");
 poly([[.1,2.43],[w*.16,.52],[w*.5,-.52],[w*.84,.52],[w-.1,2.43]],h.roof);
 poly([[.5,2.18],[w*.18,.56],[w*.5,-.34],[w*.82,.56],[w-.5,2.18]],h.roof);
 for(let row=0;row<4;row++){
  const yy=.55+row*.41;
  const edge=Math.max(.65,2.9-row*.58);
  for(let col=edge;col<w-edge;col+=.79){
   line(col,yy,col+.39,yy+.08,"#ffffff45",.045);
   line(col+.4,yy+.08,col+.72,yy,"#233f4e33",.037);
  }
 }
 poly([[w*.15,.4],[w*.5,-.66],[w*.85,.4],[w*.5,-.25]],"#ffffff33");
 // special motifs
 if(h.kind==="center"||h.kind==="center2"){
  ellipse(w/2,1.18,.78,.7,"#fff7e5");ellipse(w/2,1.18,.58,.52,"#df6269");
  rect(w/2-.4,1.10,.8,.16,"#fff8e9");rect(w/2-.08,.78,.16,.8,"#fff8e9");
 }
 if(h.kind==="mart"){
  rounded(w/2-1.18,.65,2.36,1.08,.11,"#f0e8d2");
  text("MART",w/2,1.35,21,"#3b7aa8");
 }
 if(h.kind==="lab"){
  rounded(w*.32,1.75,w*.36,.86,.1,"#f8efdd");text("LABORATORIO",w/2,2.28,10,"#3e5d76");
 }
 // Windowsills, plank details and the classic red mailboxes next to the two protagonists' homes.
 if(h.kind==="home"||h.kind==="barry"){
   const bx=w+1.03;ellipse(bx,b+.18,.48,.19,"#23433566");
   rounded(bx-.09,b-1.35,.18,1.4,.04,"#675b4b");
   rounded(bx-.43,b-1.72,.86,.63,.14,"#bd4c46");
   rounded(bx-.41,b-1.71,.82,.14,.05,"#e37b67");
   rect(bx-.25,b-1.47,.48,.065,"#553a3c");
   rounded(w/2-1.55,b+.08,3.1,.38,.12,"#aaa18b");
   rounded(w/2-1.28,b+.19,2.56,.20,.07,"#e7ddc5");
 }
 ctx.restore();
}
function flowers(x,y){
 const n=r(x,y),clr=n>.68?"#f9e6a1":n>.34?"#f5a9c1":"#e5dcfb";
 ctx.save();ctx.translate(x+.5,y+.55);line(0,.22,0,-.18,"#528b54",.04);
 for(let i=0;i<5;i++){let a=i*TAU/5;ellipse(Math.cos(a)*.15,Math.sin(a)*.15,.13,.10,clr);}
 ellipse(0,0,.10,.10,"#f8c66f");ctx.restore();
}
function lamp(x,y){
 ctx.save();ctx.translate(x,y);ellipse(.07,.2,.28,.14,"#2254405c");rounded(-.08,-1.62,.16,1.7,.08,"#53636b");
 ellipse(0,-1.65,.40,.15,"#354f62");rounded(-.25,-1.85,.5,.3,.04,"#f8e5b0");
 ellipse(0,-1.7,.19,.12,"#fff6ca");ctx.restore();
}
function fence(x,y,w){
 for(let i=0;i<=w;i++){
  rounded(x+i-.07,y-.46,.14,.55,.035,"#eee1c3");
  poly([[x+i-.07,y-.46],[x+i,y-.64],[x+i+.07,y-.46]],"#f9edcf");
 }
 rect(x,y-.31,w,.13,"#d6c09f");rect(x,y-.03,w,.13,"#bca380");
}
function grassBush(x,y){ellipse(x+.5,y+.7,.58,.35,"#3b8a59");ellipse(x+.24,y+.49,.40,.42,"#57a96a");ellipse(x+.68,y+.39,.39,.39,"#65b678");ellipse(x+.48,y+.19,.36,.40,"#75c481");}
function sign(x,y,label){rounded(x-.55,y-1.55,1.1,.79,.1,"#7b5f45");rounded(x-.45,y-1.43,.9,.56,.04,"#f0dfb9");rect(x-.07,y-.77,.14,1.02,"#91704d");text(label,x,y-1.1,9,"#3a5962");}
function briefcase(x,y){ellipse(x,y+.13,.71,.30,"#2b4e4466");rounded(x-.65,y-.65,1.30,.86,.1,"#79533b");rounded(x-.54,y-.58,1.08,.68,.07,"#a47a51");rounded(x-.24,y-.82,.48,.17,.06,"#5c4132");rect(x-.57,y-.18,1.13,.1,"#cfb77d");rect(x-.09,y-.3,.18,.27,"#f6dc9b");}
function character(x,y,skin="hero",facing="down",walk=0){
 const palette={
  hero:["#cc413f","#354d71","#262e43","#f3c99b","#30374d"],
  barry:["#efbb55","#e2a646","#48434c","#f4c69e","#e9b34f"],
  mom:["#da7890","#aa657e","#414255","#f0c7a3","#775a4a"],
  rowan:["#f3f0e6","#c6ced4","#4f585f","#e8c0a1","#e9e9e0"],
  neighbor:["#81aa82","#507f7c","#444954","#edc5a0","#9b6351"],
  girl:["#ef94aa","#b24e6b","#505365","#f1c4a0","#624d4d"],
  boy:["#80b5d1","#4f728d","#3b4d60","#edc6a5","#8d6650"]
 };
 const [coat,trim,pants,skinColor,hair]=palette[skin]||palette.hero;
 const stride=Math.sin(walk*10)*.115;
 const bob=walk?Math.abs(Math.sin(walk*10))*.055:Math.sin(elapsed*2+x+y)*.015;
 ctx.save();ctx.translate(x,y-bob);
 ellipse(0,.06,.38,.17,"#1a594951");
 // legs + stride
 rounded(-.23,-.44,.18,.45,.05,pants);rounded(.05,-.44,.18,.45,.05,pants);
 if(walk){rect(-.21,-.22+stride,.15,.15,"#364052");rect(.07,-.22-stride,.15,.15,"#364052");}
 // body outline
 rounded(-.41,-1.12,.82,.83,.14,"#334454");
 rounded(-.35,-1.08,.70,.76,.12,coat);
 rounded(-.10,-1.05,.20,.75,.04,trim);
 // arms
 rounded(-.51,-1.04,.17,.65,.06,coat);
 rounded(.34,-1.04,.17,.65,.06,coat);
 if(skin==="hero"||skin==="barry")rounded(.14,-.97,.23,.44,.09,"#c59b76");
 // neck and face
 rounded(-.115,-1.33,.23,.26,.06,skinColor);
 ellipse(0,-1.54,.36,.40,skinColor);
 if(facing!=="up"){
  ellipse(-.14,-1.55,.046,.060,"#29364b");ellipse(.14,-1.55,.046,.06,"#29364b");
  if(skin==="mom"||skin==="girl")ellipse(.0,-1.37,.09,.028,"#b77f73");
 }
 // cap / hair
 if(skin==="hero"){
  ellipse(0,-1.82,.43,.24,hair);
  poly([[-.48,-1.80],[-.35,-2.02],[.24,-2.08],[.49,-1.83]],"#d84747");
  rounded(-.57,-1.81,1.05,.13,.05,"#f8f1e2");
 }else if(skin==="barry"){
  ellipse(0,-1.86,.45,.24,"#eab954");
  poly([[-.38,-1.95],[-.50,-2.15],[-.11,-2.03],[.14,-2.24],[.33,-1.99],[.48,-2.10],[.42,-1.78]],"#e5bd5d");
 }else if(skin==="mom"||skin==="girl"){
  ellipse(0,-1.93,.46,.28,hair);rect(-.43,-1.83,.12,.42,hair);rect(.33,-1.83,.12,.42,hair);
 }else if(skin==="rowan"){
  ellipse(0,-1.87,.46,.20,"#e6e8e4");rect(-.45,-1.85,.14,.27,"#eeeeeb");
 }else{
  ellipse(0,-1.88,.43,.26,hair);rect(-.41,-1.81,.13,.32,hair);
 }
 if(facing==="up"){rounded(-.29,-1.0,.58,.47,.06,"#2d475bb8");}
 ctx.restore();
}
function drawWorld(){
 const minX=Math.floor(cam.x-(W/(T*zoom))/2)-3,maxX=Math.ceil(cam.x+(W/(T*zoom))/2)+3;
 const minY=Math.floor(cam.y-(H/(T*zoom))/2)-4,maxY=Math.ceil(cam.y+(H/(T*zoom))/2)+4;
 for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++)groundTile(x,y);
 // handcrafted scenery: flower gardens, lamps, fences, berry bushes and biome flora
 for(let y=minY;y<maxY+2;y++)for(let x=minX;x<maxX+2;x++){
   if(grass(x+.5,y+.5)&&r(x+29,y+83)>.936)grassBush(x,y);
   else if(!isPath(x+.5,y+.5)&&!inPond(x+.5,y+.5)&&!inLake(x+.5,y+.5)&&r(x+11,y+73)>.972)flowers(x,y);
 }
 // Place decorations on dedicated, hand-composed town blocks
 for(let x=6.2;x<=40;x+=1.2){if(x<19.4||x>25.7)fence(x,49.2,1.01);}
 for(let x=5.5;x<=40;x+=1.2){if(x<5.8||x>11.6)fence(x,87.3,1.01);}
 for(let x=44;x<=72;x+=1.2){if(x<56||x>61)fence(x,14,1.01);}
 for(let j=0;j<16;j++){const x=11.7+(j%8)*1.1,y=82.7+Math.floor(j/8)*1.2;flowers(x,y);}
 for(let j=0;j<18;j++){const x=42.3+(j%9)*1.5,y=39.5+Math.floor(j/9)*1.2;flowers(x,y);}
 for(const [x,y] of [[7.6,62],[39.2,62],[7.6,78],[39.2,78],[41,27],[71,25],[49,-6]])lamp(x,y);
 for(const [x,y,l] of [[22,43,"RUTA 201"],[21,29,"LAGO VERAZ"],[45,28,"PUEBLO ARENA"],[56,8,"RUTA 202"]])sign(x,y,l);
 // draw sorted tall props, NPC and player for depth
 const things=[];
 for(let yy=minY-2;yy<maxY+2;yy++)for(let xx=minX-2;xx<maxX+2;xx++)if(treeAt(xx+.48,yy+.48))things.push({sort:yy+.8,draw:()=>tree(xx,yy)});
 for(const h of houses)things.push({sort:h.y+h.h,draw:()=>house(h)});
 for(const n of outdoorNPCs)if(n.y>=minY-3&&n.y<=maxY+3)things.push({sort:n.y,draw:()=>character(n.x,n.y,n.skin,"down",elapsed*.13+r(n.x,n.y)*5)});
 things.push({sort:state.y,draw:()=>character(state.x,state.y,"hero",facing,walkClock)});
 const brief={x:18.1,y:36.3};
 things.push({sort:brief.y,draw:()=>{if(state.quest<4)briefcase(brief.x,brief.y);}});
 things.sort((a,b)=>a.sort-b.sort);
 for(const o of things)o.draw();
 // flying petals and light
 for(let i=0;i<35;i++){
  const x=minX+((i*3.71+elapsed*(.16+i%3*.06))%(maxX-minX+3));
  const y=minY+((i*7.83+elapsed*.17)%(maxY-minY+3));
  ellipse(x,y,.035,.068,i%3?"#f9f2c69a":"#fbc4df9c");
 }
}
const roomTypes={
 bedroom:{name:"Tu habitación",floor:"#d4ad7b",wall:"#cbe7d2"},
 home:{name:"Tu casa",floor:"#dfbf8e",wall:"#f3e1c5"},
 barry:{name:"Casa de Barry",floor:"#d3a781",wall:"#eee0c6"},
 lab:{name:"Laboratorio Pokémon",floor:"#cfdddc",wall:"#d7e6e4"},
 neighbor1:{name:"Casa de los vecinos",floor:"#ddbd91",wall:"#e5d9cf"},
 neighbor2:{name:"Casa de los vecinos",floor:"#d5b88a",wall:"#e3d8cb"},
 center:{name:"Centro Pokémon",floor:"#e9d2cf",wall:"#fff0e7"},
 center2:{name:"Centro Pokémon",floor:"#e9d2cf",wall:"#fff0e7"},
 mart:{name:"Poké Mart",floor:"#c3d2df",wall:"#e3eff1"},
 jubilife:{name:"Estación de Jubileo",floor:"#bfcbd9",wall:"#e2e8e8"}
};
function furniture(x,y,w,h,c,top="#fff1d7"){rounded(x,y+.1,w,h,.1,"#6b5b54");rounded(x,y,w,h-.11,.1,c);rect(x+.18,y+.06,w-.36,.12,top);}
function drawInterior(){
 const t=roomTypes[scene]||roomTypes.home;
 rect(0,0,16,12,t.floor);rect(0,0,16,1.9,t.wall);rect(0,0,.33,12,"#ad937d");rect(15.67,0,.33,12,"#ad937d");
 rect(0,1.67,16,.17,"#aa8a72");rect(0,11.63,16,.37,"#ac8e71");
 // planks
 for(let i=0;i<18;i++){line(0,2+i*.56,16,2+i*.56,"#835f5130",.024);for(let j=0;j<16;j+=3)line((i+j)%3+2.5,2+i*.56,j+2.6,2+i*.56,"#a88d7a32",.018);}
 rounded(5.4,10.8,5.2,.6,.09,"#9b805f");rect(7.5,11.37,1,.55,"#f0d69c");
 // daylight windows
 for(const wx of [2,12.6]){rounded(wx,0.5,1.5,1.2,.08,"#f9efdb");rect(wx+.13,.63,1.24,.95,"#9ed2df");rect(wx+.66,.62,.14,.97,"#fff6df");rect(wx+.14,1.08,1.22,.1,"#fff7e8");}
 // decorative rug
 rounded(5,5.7,6,3.6,.42,scene==="lab"?"#77a3ae":"#b47d8d");rounded(5.24,5.93,5.52,3.14,.38,scene==="lab"?"#a6cbd2":"#e3baad");
 if(scene==="bedroom"){
  furniture(1.5,3.0,4.2,3.3,"#7398b3","#f8e7ce");
  rounded(1.8,3.1,3.6,1.25,.17,"#f5f7ea");rounded(1.8,4.35,3.6,1.35,.12,"#a9c6df");
  furniture(10.3,3.1,3.8,2.0,"#906d4e");rect(11,2.74,2.4,1.4,"#253c52");rect(11.25,2.96,1.9,.9,"#76b7c6");text("TV",12.2,3.53,16,"#fff7e8");
  furniture(10,8.0,3.8,1.7,"#ac8659");rect(10.7,8.0,1.8,.6,"#e4ead8");
  character(13.1,6.2,"boy");text("✦",8,5.3,19,"#fff3bc");
 }else if(scene==="home"){
  furniture(1.2,3,4.5,2.5,"#ba9983");furniture(10.5,3.0,4.1,2.2,"#8da7a0");
  furniture(2.7,8.6,3.9,1.5,"#c7a36b");furniture(9.4,8.6,3.7,1.6,"#c4a07c");
  character(11.8,6.8,"mom");
 }else if(scene==="barry"){
  furniture(1.3,3.1,3.3,2.4,"#7ea8be");
  furniture(10.7,3.1,3.2,2,"#aa8977");
  character(6.8,5.3,"barry");
  character(12.5,7.1,"mom");
 }else if(scene==="lab"){
  furniture(1,3.4,4.2,2.3,"#7e9aa8");furniture(10.6,3.4,4.1,2.3,"#829fab");
  for(let x of [4.3,6.4,8.5]){rounded(x,8,.85,1.1,.1,"#aac7cb");ellipse(x+.42,7.9,.32,.23,"#f7fff1");}
  character(8,5.2,"rowan");character(12.5,7.2,"girl");
 }else if(scene==="center"||scene==="center2"){
  furniture(3.1,3.1,9.8,2.4,"#df7781");
  for(let x of [5.1,7.6,10.1]){ellipse(x,3.7,.58,.54,"#fff4f0");ellipse(x,3.7,.33,.34,"#e8767a");}
  character(8,6.7,"girl");
 }else if(scene==="mart"){
  for(let x of [1,12.4])for(let y of [3.5,6.6])furniture(x,y,2.7,2.4,"#5f8ab7");
  furniture(5,3.3,6,2.3,"#92acc6");character(8,6.7,"boy");
 }else{furniture(2,3.4,4,2.6,"#a1acbd");furniture(10,3.6,3.6,2.2,"#af9786");character(8,6.4,"neighbor");}
 character(state.x,state.y,"hero",facing,walkClock);
}
function currentZone(){
 if(scene!=="outside")return (roomTypes[scene]||roomTypes.home).name;
 if(state.y< -5)return "Ciudad Jubileo";
 if(state.y<10&&state.x>42)return "Ruta 202";
 if(state.x>43&&state.y<42)return "Pueblo Arena";
 if(state.x<20&&state.y<44)return "Lago Veraz";
 if(state.y<50)return "Ruta 201";
 return "Pueblo Hojaverde";
}
const indoorInteractions={
 bedroom:[{x:8,y:12,kind:"stairs",name:"Bajar al salón"},{x:12,y:4,kind:"television",name:"Ver televisión"}],
 home:[{x:11.8,y:6.8,kind:"mom",name:"Hablar con mamá"},{x:8,y:11.6,kind:"exit",name:"Salir de casa"},{x:3,y:3.5,kind:"stairsUp",name:"Subir a tu habitación"}],
 barry:[{x:6.8,y:5.3,kind:"barry",name:"Hablar con Barry"},{x:8,y:11.6,kind:"exit",name:"Salir de casa"}],
 lab:[{x:8,y:5.2,kind:"rowan",name:"Hablar con el profesor Serbal"},{x:8,y:11.6,kind:"exit",name:"Salir del laboratorio"}],
 center:[{x:8,y:6.7,kind:"heal",name:"Curar a tus Pokémon"},{x:8,y:11.6,kind:"exit",name:"Salir del centro"}],
 center2:[{x:8,y:6.7,kind:"heal",name:"Curar a tus Pokémon"},{x:8,y:11.6,kind:"exit",name:"Salir del centro"}],
 mart:[{x:8,y:6.7,kind:"mart",name:"Comprar Poké Balls"},{x:8,y:11.6,kind:"exit",name:"Salir de la tienda"}],
 jubilife:[{x:8,y:6.5,kind:"chat",name:"Hablar con el encargado"},{x:8,y:11.6,kind:"exit",name:"Salir de la estación"}]
};
function indoorList(){return indoorInteractions[scene]||[{x:8,y:6.5,kind:"chat",name:"Hablar con el vecino"},{x:8,y:11.6,kind:"exit",name:"Salir"}];}
function interactions(){
 if(scene!=="outside")return indoorList();
 const list=houses.map(h=>({x:h.doorX,y:h.doorY,kind:"door",room:h.kind,name:"Entrar · "+h.name}));
 list.push(...outdoorNPCs.map(n=>({...n})));
 if(state.quest<=3)list.push({x:18.1,y:36.3,kind:"briefcase",name:"Revisar el maletín"});
 list.push({x:21.3,y:42.8,kind:"sign",name:"Leer cartel de Ruta 201"});
 return list;
}
function closest(){
 let best=null,d=2.15;
 for(const item of interactions()){if(item.kind==="barryOut"&&state.quest<3)continue;const dd=Math.hypot(item.x-state.x,item.y-state.y);if(dd<d){d=dd;best=item;}}
 return best;
}
function updateQuest(){
 const q=questInfo[state.quest]||questInfo[7];$("questName").textContent=q[0];$("questDesc").textContent=q[1];$("chapter").textContent=String(Math.min(state.quest+1,8)).padStart(2,"0")+" / 08";$("questProgress").style.width=Math.max(9,Math.min(100,(state.quest+1)/8*100))+"%";
}
function advance(q){if(q>state.quest){state.quest=q;updateQuest();notify("✦ "+questInfo[q][0]);sound(720,.17);save();}}
let messageTimeout=null;
function notify(str){$("toast").textContent=str;show("toast");clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>hide("toast"),3200);}
let audio=null;function sound(freq=540,dur=.08){if(!state.sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type="triangle";o.frequency.value=freq;g.gain.setValueAtTime(.028,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch(e){}}
function talk(lines,then){dialog={lines:lines.map(a=>typeof a==="string"?{name:"NARRADOR",text:a}:a),idx:0};dialogCallback=then||null;paintDialog();show("dialog");}
function paintDialog(){if(!dialog)return;const it=dialog.lines[dialog.idx];$("dialogName").textContent=it.name||"NARRADOR";$("dialogText").textContent=it.text;$("portrait").textContent=({BARRY:"⚡",MAMÁ:"♥","PROF. SERBAL":"✦","ENFERMERA JOY":"✚",TELEVISOR:"▣"}[it.name]||"✦");sound(430+dialog.idx*68,.05);}
function nextDialog(){if(!dialog)return;if(++dialog.idx<dialog.lines.length){paintDialog();return;}dialog=null;hide("dialog");const after=dialogCallback;dialogCallback=null;if(after)after();}
function inside(id,origin){
 if(origin){state.exitX=origin.x;state.exitY=origin.y;}
 scene=id;state.scene=id;state.x=8;state.y=10.5;cam.x=8;cam.y=8;facing="up";save();locationUpdate();
}
function outside(){
 scene="outside";state.scene="outside";state.x=state.exitX||14;state.y=(state.exitY||77)+.6;cam.x=state.x;cam.y=state.y;facing="down";save();locationUpdate();
}
function interact(){
 if(dialog){nextDialog();return;}
 if(battle||modal)return;
 const obj=closest();if(!obj)return;const kind=obj.kind;
 if(kind==="door"){inside(obj.room,{x:obj.x,y:obj.y});sound(700,.10);return;}
 if(kind==="exit"){outside();sound(580,.10);return;}
 if(kind==="stairs"){inside("home");if(state.quest===0)advance(1);return;}
 if(kind==="stairsUp"){inside("bedroom");return;}
 if(kind==="television"){talk([{name:"TELEVISOR",text:"«Un misterioso Gyarados rojo ha sido visto en la lejana región de Johto»."},"¡Qué noticia tan extraña! Me pregunto si algún Pokémon parecido vive cerca de aquí."]);return;}
 if(kind==="mom"){
  if(state.quest===1){talk([{name:"MAMÁ",text:"¡Buenos días! Barry ha estado buscándote desde temprano."},{name:"MAMÁ",text:"Quiere visitar el Lago Veraz. No se te olvide volver para contarme cómo les fue."}],()=>advance(2));}
  else if(state.quest===5){talk([{name:"MAMÁ",text:"¡Tu primer Pokémon! ¡Qué orgullosa estoy de ti!"},{name:"MAMÁ",text:"Te regalo unas zapatillas para correr y unas pociones. ¡Cuídate muchísimo!"}],()=>{state.potions+=3;advance(6);renderTeam();});}
  else talk([{name:"MAMÁ",text:"Recuerda explorar con cuidado y disfrutar de tu aventura. ¡Siempre serás bienvenido a casa!"}]);
  return;
 }
 if(kind==="barry"){if(state.quest===2)talk([{name:"BARRY",text:"¡Por fin llegaste! ¿Viste la noticia del Gyarados rojo?"},{name:"BARRY",text:"¡Seguro que hay Pokémon increíbles en el Lago Veraz! ¡Vamos ahora mismo!"}],()=>advance(3));else talk([{name:"BARRY",text:"¡Tenemos un mundo entero por explorar! ¡Nos vemos en la próxima ruta!"}]);return;}
 if(kind==="barryOut"){talk([{name:"BARRY",text:state.quest<5?"¡Ahí está el maletín! ¡Mira, hay tres Poké Balls!":"¡Ese fue un combate increíble! ¡Nos vemos en el laboratorio de Pueblo Arena!"}]);return;}
 if(kind==="briefcase"){if(state.quest<3){talk(["Es un maletín abandonado en medio de la hierba. Mejor esperar a Barry."]);return;}
  if(state.quest===3){talk([{name:"NARRADOR",text:"Dos Starly salvajes salen de la hierba. Barry grita al verlos."},{name:"BARRY",text:"¡Rápido! ¡Elige un Pokémon del maletín para defenderte!"}],()=>{show("starterModal");modal="starter";});}else talk(["El maletín ya no está aquí. Has elegido a tu compañero."]);return;}
 if(kind==="rowan"){if(state.quest===6){talk([{name:"PROF. SERBAL",text:"¡Bienvenido! Soy Serbal, profesor Pokémon de Sinnoh."},{name:"PROF. SERBAL",text:"Veo que has establecido un vínculo con tu nuevo Pokémon. Quiero confiarte una tarea importante."},{name:"PROF. SERBAL",text:"Llévate esta Pokédex y descubre las especies que habitan nuestra región. ¡El mundo te espera!"}],()=>{state.balls+=5;advance(7);renderTeam();});}else talk([{name:"PROF. SERBAL",text:"La vida y evolución de los Pokémon son verdaderos misterios. ¡Continúa tu aventura!"}]);return;}
 if(kind==="heal"){for(const p of state.team)p.hp=p.max;renderTeam();save();talk([{name:"ENFERMERA JOY",text:"¡Tus Pokémon han recuperado toda su energía! ¡Vuelve siempre que lo necesites!"}]);return;}
 if(kind==="mart"){if(state.money>=500){state.money-=500;state.balls+=5;renderTeam();save();talk([{name:"DEPENDIENTE",text:"¡Gracias por tu compra! Cinco Poké Balls por 500 ₽. ¡Buena suerte!"}]);}else talk(["No tienes suficiente dinero para comprar Poké Balls."]);return;}
 if(kind==="trainer"){if(!state.starter){talk(["Consigue un Pokémon antes de desafiar entrenadores."]);return;}if(state.flags[obj.name])talk([{name:obj.name,text:"¡Bien jugado! Entrenaré más para la revancha."}]);else talk([{name:obj.name,text:"¡Te desafío a un combate Pokémon!"}],()=>startBattle(obj.pokemon,obj.name));return;}
 if(kind==="sign"){talk(["RUTA 201 · Pueblo Hojaverde ↔ Pueblo Arena y Lago Veraz."]);return;}
 talk((obj.dialog||[{name:obj.name||"VECINO",text:"¡Bienvenido a Sinnoh! Que tengas un buen viaje."}]).map(t=>typeof t==="string"?{name:obj.name||"VECINO",text:t}:t));
}
function renderTeam(){
 const first=state.team[0];
 if(first){show("party");$("partyIcon").src=pokeImg(first.name);$("partyName").textContent=first.name;$("partyLevel").textContent="Nv. "+first.lv+" · "+first.hp+"/"+first.max+" PS";$("partyHealth").style.width=(first.hp/first.max*100)+"%";}else hide("party");
 $("inventoryInfo").textContent="Poké Balls: "+state.balls+" · Pociones: "+state.potions+" · Dinero: "+state.money+" ₽";
 $("teamHeal").disabled=!first||first.hp===first.max||state.potions<=0;
 const list=$("teamList");list.textContent="";
 for(const p of state.team){const div=document.createElement("div");div.className="team-entry";
  const img=document.createElement("img");img.src=pokeImg(p.name);img.alt=p.name;
  const label=document.createElement("div");label.innerHTML="<strong></strong><small></small>";label.querySelector("strong").textContent=p.name;
  label.querySelector("small").textContent="Nivel "+p.lv+" · "+p.hp+" / "+p.max+" PS";
  div.append(img,label);list.append(div);}
}
function save(){if(!started)return;try{localStorage.setItem(saveKey,JSON.stringify(state));}catch(e){}}
function load(){try{const o=JSON.parse(localStorage.getItem(saveKey));return o&&typeof o.quest==="number"&&Number.isFinite(o.x)?{...fresh(),...o}:null;}catch(e){return null;}}
function start(resume=false){
 if(resume){const s=load();state=s||fresh();}else state=fresh();
 started=true;scene=state.scene;cam.x=state.x;cam.y=state.y;hide("title");show("game-ui");updateQuest();renderTeam();locationUpdate();save();
 if(!resume)talk([{name:"NARRADOR",text:"REGIÓN DE SINNOH · PUEBLO HOJAVERDE. Una mañana soleada, comienzas tu aventura en tu habitación."},{name:"TELEVISOR",text:"«Última hora: ¡Investigadores siguen la pista de un misterioso Gyarados rojo!»"},{name:"NARRADOR",text:"Tu mejor amigo Barry te ha estado esperando. Primero baja y habla con mamá."}]);
}
function locationUpdate(){
 const z=currentZone();if($("zoneName").textContent!==z){$("zoneName").textContent=z;if(started)notify("◇ "+z);}
 if(!state.visited.includes(z)){state.visited.push(z);save();}
}
function chooseStarter(name){
 const data=species[name];state.starter=name;state.team=[{name,lv:5,hp:data[2],max:data[2],xp:0}];hide("starterModal");modal="";advance(4);renderTeam();save();
 talk([{name:"NARRADOR",text:"¡"+name+" ha decidido acompañarte! ¡Tu primer vínculo Pokémon acaba de nacer!"}],()=>startBattle("Starly",null,true));
}
function updateBattle(){
 if(!battle)return;const e=battle,me=state.team[0];
 $("enemyName").textContent=e.name.toUpperCase();$("enemyLevel").textContent="Nv. "+e.lv;$("enemyHP").style.width=(100*e.hp/e.max)+"%";$("enemyHPText").textContent=e.hp+" / "+e.max+" PS";$("enemyImage").src=pokeImg(e.name);
 $("allyName").textContent=me.name.toUpperCase();$("allyLevel").textContent="Nv. "+me.lv;$("allyHP").style.width=(100*me.hp/me.max)+"%";$("allyHPText").textContent=me.hp+" / "+me.max+" PS";$("allyImage").src=pokeImg(me.name);
 $("battleLabel").textContent=e.trainer?"COMBATE CON "+e.trainer:"ENCUENTRO SALVAJE";
 $("specialBtn").textContent="✦ "+({"Turtwig":"HOJA AFILADA","Chimchar":"ASCUAS","Piplup":"BURBUJA"}[me.name]||"MOVIMIENTO");
 for(const id of ["attackBtn","specialBtn","catchBtn","runBtn"])$(id).disabled=battleBusy||(id==="catchBtn"&&(!!e.trainer||state.balls<1))||(id==="runBtn"&&!!e.trainer);
}
function startBattle(name,trainer=null,scripted=false){
 if(!state.team.length)return;const data=species[name]||species.Starly;const lv=scripted?3:trainer?5+state.wins:2+Math.floor(Math.random()*4);
 battle={name,lv,hp:data[2]+(lv-3)*2,max:data[2]+(lv-3)*2,trainer,scripted};battleBusy=false;show("battle");hide("interact");$("battleText").textContent=trainer?"¡"+trainer+" quiere combatir!":"¡Un "+name+" salvaje ha aparecido!";updateBattle();sound(390,.2);
}
function endBattle(win,caught=false){
 if(!battle)return;
 const old=battle;
 if(win){state.wins++;state.money+=old.trainer?400:0;
  const p=state.team[0];p.xp+=(old.lv+1)*12;
  if(p.xp>=p.lv*17){p.xp=0;p.lv++;p.max+=3;p.hp=Math.min(p.max,p.hp+6);notify("✦ ¡"+p.name+" subió al nivel "+p.lv+"!");}
  if(old.trainer)state.flags[old.trainer]=true;
  if(old.scripted&&state.quest===4)advance(5);
 }
 battle=null;hide("battle");renderTeam();save();if(win&&!caught)notify("✦ ¡Victoria! Tu equipo ha ganado experiencia.");
}
function enemyTurn(){
 if(!battle)return;const me=state.team[0],dmg=2+Math.floor(Math.random()*4)+Math.max(0,Math.floor(battle.lv/5));
 me.hp=Math.max(0,me.hp-dmg);$("battleText").textContent="¡"+battle.name+" usó Placaje!";sound(250,.2);updateBattle();
 if(me.hp===0){battleBusy=true;setTimeout(()=>{for(const p of state.team)p.hp=p.max;endBattle(false);if(scene!=="outside")outside();else{state.x=14.1;state.y=79.1;}notify("Tu equipo se recuperó en Pueblo Hojaverde.");},1050);}
 else {battleBusy=false;updateBattle();}
}
function attack(power){
 if(!battle||battleBusy)return;battleBusy=true;updateBattle();const p=state.team[0],dmg=power+Math.floor(Math.random()*5)+Math.floor(p.lv/2);
 $("battleText").textContent="¡"+p.name+" usó "+(power>8?"su movimiento especial":"Placaje")+"!";sound(power>8?690:550,.18);
 const enemy=$("enemyImage");enemy.animate([{transform:"translateX(0)",filter:"brightness(1)"},{transform:"translateX(18px)",filter:"brightness(2.5)"},{transform:"translateX(0)",filter:"brightness(1)"}],{duration:350});
 setTimeout(()=>{if(!battle)return;battle.hp=Math.max(0,battle.hp-dmg);updateBattle();
 if(battle.hp===0){$("battleText").textContent="¡"+battle.name+" se ha debilitado!";setTimeout(()=>endBattle(true),650);}
 else setTimeout(enemyTurn,560);},350);
}
function catchBall(){
 if(!battle||battleBusy||battle.trainer||state.balls<1)return;battleBusy=true;state.balls--;updateBattle();save();$("battleText").textContent="¡Lanzaste una Poké Ball!";sound(900,.18);
 const chance=.18+.76*(1-battle.hp/battle.max);
 setTimeout(()=>{if(!battle)return;if(Math.random()<chance){
  const p=battle,full=state.team.length>=6;
  if(!full)state.team.push({name:p.name,lv:p.lv,hp:p.hp,max:p.max,xp:0});
  $("battleText").textContent=full?"¡Pokémon registrado! El equipo está completo.":"¡Capturaste a "+p.name+"!";
  setTimeout(()=>endBattle(true,true),920);
 }else{$("battleText").textContent="¡Oh, no! ¡El Pokémon se escapó!";setTimeout(enemyTurn,660);}},780);
}
function runAway(){if(!battle||battleBusy||battle.trainer)return;battleBusy=true;$("battleText").textContent="¡Escapaste sin problemas!";setTimeout(()=>endBattle(false),450);}
function walkable(x,y){
 if(scene!=="outside"){if(x<.8||x>15.2||y<2.1||y>11.4)return false;return true;}
 for(const [dx,dy] of [[-.23,0],[.23,0],[0,-.08],[0,.08]])if(obstacle(x+dx,y+dy))return false;
 return true;
}
let facing="down",walkClock=0,locTick=0,step=0;
function movement(dt){
 if(!started||dialog||modal||battle||!$("title").classList.contains("hidden"))return;
 let dx=0,dy=0;
 if(keys.has("w")||keys.has("arrowup"))dy--;
 if(keys.has("s")||keys.has("arrowdown"))dy++;
 if(keys.has("a")||keys.has("arrowleft"))dx--;
 if(keys.has("d")||keys.has("arrowright"))dx++;
 if(!dx&&!dy)return;
 const mag=Math.hypot(dx,dy);dx/=mag;dy/=mag;const speed=keys.has("shift")?5.6:3.6;
 const mx=dx*speed*dt,my=dy*speed*dt;
 if(Math.abs(dx)>Math.abs(dy))facing=dx>0?"right":"left";else facing=dy>0?"down":"up";
 const ox=state.x,oy=state.y;
 if(walkable(state.x+mx,state.y))state.x+=mx;
 if(walkable(state.x,state.y+my))state.y+=my;
 const delta=Math.hypot(state.x-ox,state.y-oy);
 if(delta>.0001){walkClock+=dt*(keys.has("shift")?1.7:1);step+=delta;
  if(step>1.35){step=0;if(scene==="outside"&&state.starter&&state.quest>=5&&grass(state.x,state.y)&&Math.random()<.12)startBattle(["Starly","Bidoof","Shinx","Budew","Kricketot","Buizel"][Math.floor(Math.random()*6)]);}}
 locTick+=dt;if(locTick>.4){locTick=0;locationUpdate();}
}
function drawFrame(now){
 requestAnimationFrame(drawFrame);const dt=Math.min(.05,Math.max(0,(now-last)/1000||.016));last=now;elapsed+=dt;clock+=dt;
 movement(dt);
 cam.x+=(state.x-cam.x)*Math.min(1,dt*7);cam.y+=(state.y-1.5-cam.y)*Math.min(1,dt*7);
 sky();ctx.setTransform(dpr*T*zoom,0,0,dpr*T*zoom,dpr*W/2-cam.x*dpr*T*zoom,dpr*H/2-cam.y*dpr*T*zoom);
 if(scene==="outside")drawWorld();else drawInterior();
 ctx.setTransform(1,0,0,1,0,0);
 if(started&&$("title").classList.contains("hidden")){
  near=closest();if(!dialog&&!modal&&!battle&&near){$("interactText").textContent=near.name||"Interactuar";show("interact");}else hide("interact");
 }
}
function drawMap(){
 const c=$("mapCanvas"),g=c.getContext("2d"),w=c.width,h=c.height;
 g.fillStyle="#94bf8b";g.fillRect(0,0,w,h);
 const mx=x=>x/77*w,my=y=>(y+24)/118*h;
 g.lineCap="round";g.strokeStyle="#f3e6c7";g.lineWidth=13;
 const paths=[[22,77,22,25],[22,26,57,26],[22,36,16,36],[57,26,57,-5],[14,77,32,77],[14,62,32,62]];
 for(const [x,y,xx,yy] of paths){g.beginPath();g.moveTo(mx(x),my(y));g.lineTo(mx(xx),my(yy));g.stroke();}
 for(const [name,x,y] of [["HOJAVERDE",22,70],["RUTA 201",22,44],["LAGO VERAZ",10,33],["PUEBLO ARENA",58,29],["RUTA 202",57,8],["JUBILEO",58,-9]]){
  g.fillStyle="#163b53";g.beginPath();g.arc(mx(x),my(y),5,0,TAU);g.fill();
  g.fillStyle="#18354b";g.font="900 11px Outfit";g.textAlign="center";g.fillText(name,mx(x),my(y)-11);
 }
 if(scene==="outside"){g.fillStyle="#f5bf5d";g.beginPath();g.arc(mx(state.x),my(state.y),8,0,TAU);g.fill();g.strokeStyle="#ffffff";g.lineWidth=3;g.stroke();}
}
function toggleModal(id){if(dialog||battle)return;const opened=!$(id).classList.contains("hidden");for(const m of ["teamModal","mapModal","helpModal"])hide(m);
 if(!opened){show(id);modal=id;if(id==="teamModal")renderTeam();if(id==="mapModal")drawMap();}else modal="";}
function closeModal(){for(const m of ["teamModal","mapModal","helpModal"])hide(m);modal="";}
function bind(){
 $("newGame").addEventListener("click",()=>start(false));
 const old=load();if(old){show("continueGame");$("continueGame").addEventListener("click",()=>start(true));}
 document.querySelectorAll("[data-starter]").forEach(b=>b.addEventListener("click",()=>chooseStarter(b.dataset.starter)));
 $("attackBtn").addEventListener("click",()=>attack(6));$("specialBtn").addEventListener("click",()=>attack(11));
 $("catchBtn").addEventListener("click",catchBall);$("runBtn").addEventListener("click",runAway);
 $("teamBtn").addEventListener("click",()=>toggleModal("teamModal")) ;$("mapBtn").addEventListener("click",()=>toggleModal("mapModal"));
 $("openMapBtn").addEventListener("click",()=>toggleModal("mapModal"));$("helpBtn").addEventListener("click",()=>toggleModal("helpModal"));
 $("teamClose").addEventListener("click",closeModal);$("mapClose").addEventListener("click",closeModal);$("helpClose").addEventListener("click",closeModal);
 $("teamHeal").addEventListener("click",()=>{const p=state.team[0];if(!p||state.potions<1||p.hp>=p.max)return;state.potions--;p.hp=Math.min(p.max,p.hp+20);renderTeam();save();sound(840,.15);notify("✚ "+p.name+" recuperó 20 PS.");});
 $("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("soundBtn").textContent=state.sound?"♫":"♪";save();});
 // Mobile inputs are first-class controls (no external keyboard required).
 for(const button of document.querySelectorAll("[data-game-key]")){
  const key=button.dataset.gameKey;
  function release(e){if(e)e.preventDefault();keys.delete(key);button.classList.remove("pressed");}
  button.addEventListener("pointerdown",e=>{
    e.preventDefault();
    button.setPointerCapture?.(e.pointerId);
    button.classList.add("pressed");
    if(key==="e"){if(dialog)nextDialog();else interact();}
    else keys.add(key);
  });
  button.addEventListener("pointerup",release);
  button.addEventListener("pointercancel",release);
  button.addEventListener("lostpointercapture",release);
 }
 window.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key))e.preventDefault();
  const k=e.key.toLowerCase();keys.add(k);
  if(e.repeat&&["e","enter","r","m","escape"].includes(k))return;
  if(k==="escape"){closeModal();return;}
  if(k==="e"||k==="enter"||k===" "){if(dialog){nextDialog();return;}interact();return;}
  if(k==="r"&&!dialog)toggleModal("teamModal");
  if(k==="m"&&!dialog)toggleModal("mapModal");
 });
 window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
 window.addEventListener("blur",()=>{keys.clear();save();});
 window.addEventListener("beforeunload",save);
}
bind();requestAnimationFrame(drawFrame);
