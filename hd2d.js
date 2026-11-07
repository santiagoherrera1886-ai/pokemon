/* SINNOH REBORN HD-2D · self-contained original browser adventure
   No ROM, emulator or file uploads. Built as a canvas engine.
   Unofficial fan prototype. Nintendo/PKMN trademarks belong to owners. */
"use strict";
const $=id=>document.getElementById(id),show=id=>$(id).classList.remove("hidden"),hide=id=>$(id).classList.add("hidden");
const canvas=$("screen"),ctx=canvas.getContext("2d",{alpha:false});
const T=36,TAU=Math.PI*2;
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
function resize(){W=innerWidth;H=innerHeight;dpr=.5;canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.imageSmoothingEnabled=false;zoom=Math.min(2.3,Math.max(.7,Math.min(W/(20*T),H/(12.5*T))));}
window.addEventListener("resize",resize);resize();
let cam={x:8,y:10};
const houses=[
 {x:29.8,y:70.6,w:6.8,h:5.2,kind:"home",name:"Tu casa",roof:"#317c70",walls:"#e6dfba",doorX:33.2,doorY:76.2},
 {x:10.6,y:54.6,w:6.8,h:5.2,kind:"barry",name:"Casa de Barry",roof:"#32887b",walls:"#e2d9b5",doorX:14,doorY:60.2},
 {x:9.9,y:70.1,w:6.8,h:5.2,kind:"neighbor1",name:"Casa de los vecinos",roof:"#367f72",walls:"#e4d5ad",doorX:13.3,doorY:75.7},
 {x:29.4,y:54.2,w:6.8,h:5.2,kind:"neighbor2",name:"Casa de los vecinos",roof:"#367f72",walls:"#e2d5ad",doorX:32.8,doorY:59.8},
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
 // Each tile is decorated at a 1/16-tile subgrid, rather than one huge smooth square.
 // This is newly-drawn art in the 2006 DS palette: no assets extracted from any ROM.
 const n=r(x,y),water=inLake(x+.5,y+.5)||inPond(x+.5,y+.5);
 const road=isPath(x+.5,y+.5);
 const settled=inTown(x+.5,y+.5)||inSandgem(x+.5,y+.5)||inJubilife(x+.5,y+.5);
 let base=water?"#72b7c7":road?"#d7bd8e":settled?"#8ecb76":"#7bbb68";
 rect(x,y,1.01,1.01,base);
 if(water){
  if(n>.24){const wave=Math.sin(elapsed*1.65+x*2.8+y)*.06;
    rect(x+.16,y+.28+wave,.38,.036,"#bbebeb");
    rect(x+.50,y+.68-wave,.31,.028,"#d1f5ef");
  }
  if(r(x+19,y+31)>.5)rect(x+.06,y+.85,.2,.025,"#579aad");
  return;
 }
 if(road){
  // Small hand-placed pebbles and subtle grain; no high-contrast checkerboard squares.
  for(let i=0;i<5;i++){
   const u=r(x+i*31,y-i*7),v=r(x-i*13,y+i*17);
   rect(x+.10+u*.75,y+.08+v*.83,.06+(i%2)*.025,.025,
    i%2?"#bd9d73":"#eddbb5");
  }
  if(n>.78)rect(x+.2,y+.55,.24,.033,"#d0ae80");
  return;
 }
 // DS-like grassy clover speckles; keep decorative clusters smaller than a tile.
 for(let i=0;i<5;i++){
  const u=r(x+i*29,y-i*17),v=r(x-i*21,y+i*31);
  rect(x+.10+u*.78,y+.11+v*.76,.07,.10,i%2?"#74b45e":"#97d27b");
 }
 if(n>.35){
  const u=x+.18+r(x+71,y)*.65,v=y+.23+r(x,y+52)*.60;
  rect(u,v,.045,.22,"#509853");rect(u-.10,v+.07,.11,.034,"#5b9f57");
  rect(u+.05,v+.10,.12,.034,"#6caf5d");
 }
 if(n>.89){rect(x+.63,y+.33,.12,.10,"#f4edba");rect(x+.64,y+.25,.05,.21,"#fff8d7");}
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
// Character art: original 24 x 36 pixel sprites constructed in-memory.
// No Nintendo image/ROM files are needed. All four directions have independent silhouettes.
const spriteCache=new Map();
function spriteImage(skin="hero",direction="down",walk=0){
 const frame=walk?Math.floor(walk*8)%2:0;
 const id=skin+"/"+direction+"/"+frame;
 if(spriteCache.has(id))return spriteCache.get(id);
 const sheet=document.createElement("canvas");sheet.width=24;sheet.height=36;
 const g=sheet.getContext("2d");if(!g)return sheet;
 g.imageSmoothingEnabled=false;
 const q=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
 const pal={
  hero:{coat:"#406eac",trim:"#fbf2e2",pants:"#303b56",hair:"#25344e",hat:"#db4045",skin:"#edbd90",shoes:"#51352f"},
  barry:{coat:"#f1d16b",trim:"#faf3e3",pants:"#5c584e",hair:"#eeb63d",hat:null,skin:"#efc69e",shoes:"#594b48"},
  mom:{coat:"#c77c90",trim:"#e9b6bf",pants:"#89626f",hair:"#775648",hat:null,skin:"#ecc59d",shoes:"#614b4c"},
  rowan:{coat:"#efeee2",trim:"#a7bbc6",pants:"#5b5960",hair:"#d0d0cd",hat:null,skin:"#edc49d",shoes:"#494953"},
  girl:{coat:"#cf6e89",trim:"#f6f1dc",pants:"#354e69",hair:"#654b4d",hat:"#e76e88",skin:"#eec19d",shoes:"#5c4356"},
  boy:{coat:"#6099bf",trim:"#c0dfeb",pants:"#42566a",hair:"#6e5646",hat:null,skin:"#ecc49d",shoes:"#4d4b51"},
  neighbor:{coat:"#8eb78b",trim:"#e3e5bd",pants:"#556b5c",hair:"#655145",hat:null,skin:"#ecc09c",shoes:"#514f46"}
 };
 const p=pal[skin]||pal.boy;
 const line="#253545",outline="#293b4c";
 const moving=walk>0.05;
 const stride=moving?(frame?1:-1):0;
 // Two-layer floor shadow is drawn in world coordinates, not baked into the sprite.
 // Boots have independent running/walking frames.
 q(5,32+Math.max(0,stride),6,3,outline);q(13,32+Math.max(0,-stride),6,3,outline);
 q(6,32+Math.max(0,stride),5,2,p.shoes);q(14,32+Math.max(0,-stride),5,2,p.shoes);
 q(6,26,6,7,line);q(12,26,6,7,line);
 q(7,26,4,5,p.pants);q(13,26,4,5,p.pants);
 // Outlined torso and arms, front and back each use their own highlight.
 q(5,17,14,11,outline);q(6,18,12,9,p.coat);
 q(2,20+(moving?stride:0),5,9,outline);q(3,20+(moving?stride:0),3,7,p.coat);
 q(18,20-(moving?stride:0),5,9,outline);q(19,20-(moving?stride:0),3,7,p.coat);
 q(3,26+(moving?stride:0),3,2,p.skin);
 q(19,26-(moving?stride:0),3,2,p.skin);
 if(direction==="up"){
  q(9,18,6,9,p.trim);q(10,19,4,9,"#456180");
  q(7,17,10,3,p.hair);
 }else if(direction==="left"||direction==="right"){
  const lx=direction==="right"?9:7;
  q(lx,18,5,8,p.trim);
  q(direction==="right"?17:6,18,2,9,"#334d71");
 }else{
  q(10,18,4,9,p.trim);q(11,20,2,5,"#e15253");
 }
 // Neck, neck outline and pixelated head/face.
 q(9,15,6,4,outline);q(10,15,4,3,p.skin);
 q(6,6,12,11,outline);q(7,5,10,12,p.hair);
 if(direction==="up"){
  q(7,8,10,8,p.hair);q(7,14,10,2,"#353e50");
 }else if(direction==="left"){
  q(7,8,10,9,p.skin);q(7,7,4,8,p.hair);
  q(10,11,2,2,outline);q(16,13,2,2,"#d99b80");
 }else if(direction==="right"){
  q(7,8,10,9,p.skin);q(13,7,4,8,p.hair);
  q(13,11,2,2,outline);q(6,13,2,2,"#d99b80");
 }else{
  q(7,8,10,9,p.skin);q(9,11,2,2,outline);q(15,11,2,2,outline);
  q(10,14,5,1,"#d79c7e");q(9,8,6,2,p.hair);
 }
 // 2D silhouette of the Diamond cap, Barry's pointed hair and nurses/other hats.
 if(p.hat){
  q(4,4,16,5,outline);q(5,3,14,5,p.hat);
  q(7,2,10,3,p.hat);
  q(5,8,15,2,"#f5e7d5");
  q(direction==="up"?8:3,9,direction==="up"?9:18,2,p.hat);
  if(skin==="hero"){q(10,4,4,3,"#f5f3ec");q(11,4,2,3,"#f0d2a5");}
 }else if(skin==="barry"){
  q(6,4,12,6,"#d89f35");q(7,3,10,5,p.hair);
  q(4,7,5,4,p.hair);q(15,5,5,5,p.hair);
  q(8,1,3,5,"#f5d57d");q(13,1,3,5,"#f5d57d");
 }else if(skin==="rowan"){
  q(7,4,10,6,"#dee4dd");q(8,2,8,4,"#f3f2e4");
  q(6,7,2,6,"#ebe6dc");q(17,7,2,6,"#ebe6dc");
 }else{
  q(7,4,10,5,p.hair);q(5,7,4,7,p.hair);q(16,7,3,7,p.hair);
 }
 if(skin==="mom"||skin==="girl"){q(5,11,3,8,p.hair);q(16,11,3,8,p.hair);}
 // Pixel highlights, depth and outline details.
 q(7,19,2,5,"#ffffff35");q(16,19,1,4,"#00000024");
 g.imageSmoothingEnabled=false;
 spriteCache.set(id,sheet);
 return sheet;
}
function character(x,y,skin="hero",direction="down",walk=0){
 ctx.save();
 ctx.translate(Math.round(x*16)/16,Math.round(y*16)/16);
 ellipse(0,.06,.47,.17,"#1d4a3f66");
 const old=ctx.imageSmoothingEnabled;
 ctx.imageSmoothingEnabled=false;
 const sprite=spriteImage(skin,direction,walk);
 ctx.drawImage(sprite,-.7,-1.92,1.4,2.02);
 ctx.imageSmoothingEnabled=old;
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
function pokeballSymbol(x,y,size=1){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 ellipse(0,0,.52,.52,"#293e4e");ellipse(0,-.12,.45,.36,"#e96468");
 poly([[-.46,-.05],[.46,-.05],[.46,.09],[-.46,.09]],"#263c4e");
 ellipse(0,.01,.18,.18,"#f6f6e9");ellipse(0,.01,.09,.09,"#d7e0d9");
 ctx.restore();
}
function tileCounter(x,y,w,h,body,top){
 rounded(x-.13,y+.18,w+.26,h+.20,.09,"#475a66");
 rounded(x,y,w,h,.09,body);
 rounded(x-.17,y-.10,w+.34,.52,.12,top);
 line(x,y+.44,x+w,y+.44,"#ffffff60",.035);
}
function plantPot(x,y){
 ellipse(x,y+.1,.46,.22,"#324b4b66");
 rounded(x-.29,y-.30,.58,.42,.07,"#b17a60");
 ellipse(x,y-.44,.37,.42,"#34785c");
 ellipse(x-.2,y-.64,.27,.31,"#4d9d73");
 ellipse(x+.23,y-.61,.29,.32,"#61b987");
 ellipse(x,y-.80,.25,.28,"#70c88b");
}
function interiorDetails(){
 if(scene==="center"||scene==="center2"){
  // Pokémon Center reception, bright red service counter and healing machine.
  rect(.36,1.85,15.28,9.75,"#eedfd7");
  for(let y=2;y<11;y++)for(let x=1;x<15;x++){
   if((x+y)%2===0)rect(x,y,1,1,"#f4e9e2");
  }
  rounded(1.15,7.3,13.7,2.9,.3,"#e6a8a4");
  rounded(1.5,7.65,13,2.25,.26,"#f7d5c9");
  tileCounter(2.1,3.35,11.8,1.7,"#d65d66","#f7e8dd");
  rounded(6.6,3.34,2.8,.62,.12,"#a9c9cd");
  for(let i=0;i<6;i++)pokeballSymbol(6.95+i*.44,3.55,.28);
  rounded(1.15,3.1,.85,1.25,.1,"#b7d7d4");
  rounded(14,3.1,.85,1.25,.1,"#b7d7d4");
  plantPot(1.3,9.3);plantPot(14.5,9.3);
  for(const x of [2.6,12.5]){
   rounded(x,5.75,1.25,1.75,.15,"#5a8fa6");
   rounded(x+.12,5.9,1.0,.66,.1,"#b5d9df");
  }
  ellipse(8,6.65,.65,.19,"#31545b44");
  character(8,6.7,"girl");
 }else if(scene==="mart"){
  rect(.36,1.85,15.28,9.75,"#dce8ec");
  for(let y=2;y<11;y++)for(let x=1;x<15;x++)if((x+y)%2===0)rect(x,y,1,1,"#e9f0ee");
  for(const x of [1.1,12.4]){
   for(const y of [3.2,5.6,8]){
    tileCounter(x,y,2.4,1.55,"#668ea9","#c6d6df");
    for(let k=0;k<4;k++){
     rounded(x+.21+k*.51,y-.27,.38,.55,.05,["#efaf71","#80b7c4","#8dbf89","#d2a2c1"][k]);
     rect(x+.24+k*.51,y-.1,.31,.06,"#f5f4df");
    }
   }
  }
  tileCounter(4.5,3.4,7,1.8,"#688cab","#d9e9e6");
  for(let i=0;i<4;i++)pokeballSymbol(5.3+i*1.8,3.57,.34);
  plantPot(3.5,9.3);plantPot(12.2,9.3);
  character(8,6.7,"boy");
 }
}
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
 }else if(scene==="center"||scene==="center2"||scene==="mart"){
  interiorDetails();
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
 scene="outside";state.scene="outside";state.x=state.exitX??14;state.y=(state.exitY??77)+1.1;cam.x=state.x;cam.y=state.y;facing="down";save();locationUpdate();
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
 if(kind==="mart"){openShop();return;}
 if(kind==="trainer"){if(!state.starter){talk(["Consigue un Pokémon antes de desafiar entrenadores."]);return;}if(state.flags[obj.name])talk([{name:obj.name,text:"¡Bien jugado! Entrenaré más para la revancha."}]);else talk([{name:obj.name,text:"¡Te desafío a un combate Pokémon!"}],()=>startBattle(obj.pokemon,obj.name));return;}
 if(kind==="sign"){talk(["RUTA 201 · Pueblo Hojaverde ↔ Pueblo Arena y Lago Veraz."]);return;}
 talk((obj.dialog||[{name:obj.name||"VECINO",text:"¡Bienvenido a Sinnoh! Que tengas un buen viaje."}]).map(t=>typeof t==="string"?{name:obj.name||"VECINO",text:t}:t));
}
function openShop(){
 if(battle||dialog)return;
 modal="shopModal";show("shopModal");
 $("shopMoney").textContent="Dinero: "+state.money+" ₽";
 $("shopMessage").textContent="Selecciona un artículo para comprar.";
}
function buyShopItem(kind){
 const items={ball:{cost:200,balls:1,potions:0,name:"Poké Ball"},potion:{cost:300,balls:0,potions:1,name:"Poción"},five:{cost:1000,balls:5,potions:0,name:"5 Poké Balls"}};
 const item=items[kind];if(!item)return;
 if(state.money<item.cost){$("shopMessage").textContent="No tienes dinero suficiente para este artículo.";sound(230,.14);return;}
 state.money-=item.cost;state.balls+=item.balls;state.potions+=item.potions;
 $("shopMoney").textContent="Dinero: "+state.money+" ₽";
 $("shopMessage").textContent="¡Gracias! Has comprado "+item.name+".";
 renderTeam();save();sound(830,.16);
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
 // Walk directly through the entrance, as in the DS games: no interaction key needed.
 if(scene==="outside"&&dy<0){
  const entrance=houses.find(h=>Math.abs(state.x-h.doorX)<1.15&&state.y>=h.doorY-.48&&state.y<=h.doorY+1.15&&oy>=h.doorY-.48);
  if(entrance){inside(entrance.kind,{x:entrance.doorX,y:entrance.doorY});sound(700,.10);return;}
 }
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
function closeModal(){for(const m of ["teamModal","mapModal","helpModal","shopModal"])hide(m);modal="";}
function bind(){
 $("newGame").addEventListener("click",()=>start(false));
 const old=load();if(old){show("continueGame");$("continueGame").addEventListener("click",()=>start(true));}
 document.querySelectorAll("[data-starter]").forEach(b=>b.addEventListener("click",()=>chooseStarter(b.dataset.starter)));
 $("attackBtn").addEventListener("click",()=>attack(6));$("specialBtn").addEventListener("click",()=>attack(11));
 $("catchBtn").addEventListener("click",catchBall);$("runBtn").addEventListener("click",runAway);
 $("teamBtn").addEventListener("click",()=>toggleModal("teamModal")) ;$("mapBtn").addEventListener("click",()=>toggleModal("mapModal"));
 $("openMapBtn").addEventListener("click",()=>toggleModal("mapModal"));$("helpBtn").addEventListener("click",()=>toggleModal("helpModal"));
 $("shopClose").addEventListener("click",closeModal);
 document.querySelectorAll("[data-buy]").forEach(b=>b.addEventListener("click",()=>buyShopItem(b.dataset.buy)));
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
