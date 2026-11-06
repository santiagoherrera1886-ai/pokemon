import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import { buildWorld } from "./world.js";
import { createInteriors } from "./interiors.js";
import { expandSinnoh,PLACES,ROUTES } from "./sinnoh.js";
import { makeAtlas } from "./atlas.js";

const $=id=>document.getElementById(id);
const show=id=>$(id).classList.remove("hidden");
const hide=id=>$(id).classList.add("hidden");
const SPRITE_ROOT="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
const DATABASE={
  Turtwig:{id:387,type:"Planta",move:"Hoja Afilada",power:10,max:25},
  Chimchar:{id:390,type:"Fuego",move:"Ascuas",power:10,max:23},
  Piplup:{id:393,type:"Agua",move:"Pistola Agua",power:10,max:24},
  Starly:{id:396,type:"Normal",move:"Picotazo",power:6,max:17},
  Bidoof:{id:399,type:"Normal",move:"Placaje",power:5,max:20},
  Shinx:{id:403,type:"Eléctrico",move:"Chispa",power:8,max:18},
  Kricketot:{id:401,type:"Bicho",move:"Picadura",power:6,max:16},
  Budew:{id:406,type:"Planta",move:"Absorber",power:6,max:16},
  Geodude:{id:74,type:"Roca",move:"Lanzarrocas",power:9,max:21},
  Magikarp:{id:129,type:"Agua",move:"Salpicadura",power:5,max:19},
  Machop:{id:66,type:"Lucha",move:"Golpe Karate",power:10,max:22},
  Cranidos:{id:408,type:"Roca",move:"Cabezazo",power:12,max:26},
  Roselia:{id:315,type:"Planta",move:"Hoja Afilada",power:11,max:24},
  Mismagius:{id:429,type:"Fantasma",move:"Bola Sombra",power:12,max:26},
  Lucario:{id:448,type:"Lucha",move:"Esfera Aural",power:13,max:28},
  Floatzel:{id:419,type:"Agua",move:"Acua Jet",power:12,max:27},
  Bastiodon:{id:411,type:"Roca",move:"Cabeza de Hierro",power:13,max:32},
  Abomasnow:{id:460,type:"Planta",move:"Ventisca",power:13,max:31},
  Luxray:{id:405,type:"Eléctrico",move:"Colmillo Rayo",power:13,max:30}
};
const sprite=name=>SPRITE_ROOT+(DATABASE[name]?.id||396)+".png";
const freshState=()=>({quest:0,starter:null,team:[],balls:5,potions:3,seen:[],caught:[],wins:0,pos:{x:12,z:19.5},room:"bedroom",sound:true,shoes:false,pokedex:false,scriptedBattle:false,visited:["twinleaf"],badges:[],money:3000,portal:null});
let state=freshState(),saved=null,started=false,battle=null,battleBusy=false,turn=1;
let dialogQueue=[],dialogIndex=0,dialogAfter=null,dialogOpen=false,toastTimeout;
const keys=new Set();
let soundContext=null;
const container=$("viewport");
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.36;
container.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,window.innerWidth/window.innerHeight,.1,340);
const hemi=new THREE.HemisphereLight(0xe3fbff,0x6e8e57,2.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5b7,3.7);sun.position.set(-22,45,21);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-51;sun.shadow.camera.right=51;sun.shadow.camera.top=51;sun.shadow.camera.bottom=-51;sun.shadow.camera.near=.5;sun.shadow.camera.far=125;sun.shadow.bias=-.00012;sun.shadow.normalBias=.035;scene.add(sun);
const world=buildWorld(THREE,scene);
const sinnoh=expandSinnoh(THREE,scene,world);

const trainerLayer=$("characterSprites");
const trainerElements=new Map();
function trainerElement(key,trainer){
  let el=trainerElements.get(key);
  if(el)return el;
  el=document.createElement("img");
  el.alt="";
  el.className="hidden-sprite";
  el.dataset.ready="0";
  el.onload=()=>{el.dataset.ready="1";};
  el.onerror=()=>{el.dataset.ready="0";el.classList.add("hidden-sprite");};
  el.src="https://play.pokemonshowdown.com/sprites/trainers/"+trainer+".png";
  trainerLayer.appendChild(el);
  trainerElements.set(key,el);
  return el;
}
function displayCharacterArt(t){
  const cast=[];
  cast.push({key:"hero",trainer:"lucas",root:world.hero.root,rig:world.hero.rig});
  if(activeRoom){
    const skins={mom:"lady",barryInside:"barry",barryMom:"lady",rowanLab:"rowan",aideLab:"dawn",neighborInside:"gentleman"};
    for(const actor of activeRoom.triggers){if(actor.root&&skins[actor.kind])cast.push({key:"room-"+activeRoom.id+"-"+actor.kind,trainer:skins[actor.kind],root:actor.root,indoor:true});}
  }else{
    const skins={barry:"barry",rowan:"rowan",aide:"dawn",neighbor:"lady"};
    for(const actor of world.npcs){
      if(actor.model?.root.visible===false||!skins[actor.kind])continue;
      cast.push({key:"out-"+actor.kind,trainer:skins[actor.kind],root:actor.model.root,rig:actor.model.rig});
    }
  }
  const visible=new Set();
  for(const actor of cast){
    const el=trainerElement(actor.key,actor.trainer);
    if(el.dataset.ready!=="1")continue;
    actor.root.updateWorldMatrix(true,false);
    const pos=new THREE.Vector3(0,.12,0).applyMatrix4(actor.root.matrixWorld);
    const projected=pos.clone().project(camera);
    if(projected.z>1||projected.z< -1||Math.abs(projected.x)>1.25||Math.abs(projected.y)>1.25){el.classList.add("hidden-sprite");continue;}
    // Hide the backup geometry only when the 2D art really loaded.
    if(actor.rig)actor.rig.visible=false;
    if(actor.indoor)for(const node of actor.root.children)node.visible=false;
    else for(const node of actor.root.children)if(node.isSprite&&node.position.y<3.2)node.visible=false;
    visible.add(actor.key);
    const dist=Math.max(5,camera.position.distanceTo(pos));
    const scale=Math.max(.68,Math.min(1.7,16/dist));
    const width=150*scale,height=184*scale;
    const bob=actor.key==="hero"&&keys.size>0?Math.abs(Math.sin(t*10))*4:Math.sin(t*2)*1.2;
    el.style.left=((projected.x*.5+.5)*innerWidth).toFixed(1)+"px";
    el.style.top=((-projected.y*.5+.5)*innerHeight-bob).toFixed(1)+"px";
    el.style.width=width.toFixed(1)+"px";
    el.style.height=height.toFixed(1)+"px";
    el.classList.remove("hidden-sprite");
  }
  for(const [key,el] of trainerElements)if(!visible.has(key))el.classList.add("hidden-sprite");
}

const interiors=createInteriors(THREE);
const atlas=makeAtlas(PLACES,ROUTES,()=>state);
let activeRoom=null;
let activeEntrance=null;
let outsidePosition={x:12,z:19.5};
let scriptedBattle=false;
const trainerPics={"BARRY":"barry","PROF. SERBAL":"rowan","LUCAS":"lucas","MAYA":"dawn","AYUDANTE":"dawn","MAMÁ":"lady","MADRE DE BARRY":"lady","VECINO":"gentleman","VECINA":"lady"};
function enterRoom(id,fromStairs=false){
  let roomId=id;
  if(typeof fromStairs==="object"&&fromStairs){activeEntrance=fromStairs;roomId=fromStairs.room||id;}
  if(typeof fromStairs==="boolean"&&fromStairs===true)activeEntrance=activeEntrance||null;
  if(battle)return;
  const p=world.hero.root;
  if(!activeRoom){outsidePosition={x:p.position.x,z:p.position.z};}
  activeRoom=interiors.get(roomId);
  activeRoom.scene.add(p);p.position.set(0,0,fromStairs?.9:.85);p.rotation.y=Math.PI;
  cameraTarget.set(0,1.1,0);lastPos={x:0,z:.85};stepDistance=0;cameraYaw=0;
  camDistance=16;
  hide("interactHint");hide("radar");
  checkPosition();updateNavigation();save();
}
function exitRoom(){
  if(!activeRoom)return;
  const id=activeRoom.id;
  if(id==="bedroom"){enterRoom("home",true);notify("Has bajado al salón.");return;}
  const door=activeEntrance||world.portals.find(p=>p.id===id)||world.portals.find(p=>p.id==="home");
  scene.add(world.hero.root);activeRoom=null;
  world.hero.root.position.set(door.exitX??door.x,0,(door.exitZ??door.z)+.2);
  outsidePosition={x:door.exitX??door.x,z:(door.exitZ??door.z)+.2};lastPos={...outsidePosition};stepDistance=0;activeEntrance=null;
  cameraTarget.set(door.x,1.1,door.exitZ);
  cameraYaw=.64;camDistance=16;
  show("radar");checkPosition();updateNavigation();save();
}

let cameraYaw=.65,camDistance=16,cameraTarget=new THREE.Vector3(12,1,19.5),lastPos={x:12,z:19.5},stepDistance=0,locationTimer=0;
const clock=new THREE.Clock();
const questData=[
  ["Noticias del Gyarados rojo","Baja desde tu habitación al salón y habla con mamá sobre la noticia."],
  ["¡Barry te necesita!","Ve a la casa de Barry, la de tejado rojo, y habla con él en el interior."],
  ["El misterio del lago","Barry quiere investigar el Lago Veraz. Busca un maletín olvidado junto al agua."],
  ["Tres Pokémon, un destino","Abre el maletín y elige a tu primer compañero Pokémon."],
  ["¡Protege a tu Pokémon!","Un Starly salvaje te ha atacado. Gana tu primer combate."],
  ["Un regalo de mamá","Vuelve a casa y habla con mamá. Te tiene preparado algo para el viaje."],
  ["Hacia Pueblo Arena","Ve hacia el este, entra al laboratorio y habla con el Profesor Serbal."],
  ["Camino a Ciudad Jubileo","Atraviesa la Ruta 202 hasta Ciudad Jubileo, la primera gran metrópoli de Sinnoh."],
  ["¡Tu primera medalla!","Ve al este por la Ruta 203 y desafía al líder Roco en Ciudad Pirita."],
  ["El bosque de Vetusta","Busca Pueblo Aromaflor y luego Ciudad Vetusta. Gardenia te espera en el gimnasio."],
  ["El corazón de Sinnoh","Continúa hasta Ciudad Corazón y explora las rutas del centro de la región."],
  ["El desafío de Sinnoh","Visita gimnasios de toda Sinnoh y reúne las ocho medallas para tu equipo."]
];
function save(){
  if(!started)return;
  if(!activeRoom)outsidePosition={x:world.hero.root.position.x,z:world.hero.root.position.z};
  state.pos={x:Number(outsidePosition.x.toFixed(2)),z:Number(outsidePosition.z.toFixed(2))};
  state.room=activeRoom?.id||null;
  state.portal=activeEntrance?.id||null;
  try{localStorage.setItem("sinnohRebornSaveV3",JSON.stringify(state));}catch(e){}
}
function load(){
  try{const raw=localStorage.getItem("sinnohRebornSaveV3");if(!raw)return null;const s=JSON.parse(raw);return s&&typeof s.quest==="number"?{...freshState(),...s}:null;}catch(e){return null;}
}
saved=load();
if(saved)show("continueBtn");
function tone(freq=700,duration=.09,kind="sine",gain=.035){
  if(!state.sound)return;
  try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    if(!soundContext)soundContext=new Context();
    if(soundContext.state==="suspended")soundContext.resume();
    const osc=soundContext.createOscillator(),amp=soundContext.createGain(),t=soundContext.currentTime;
    osc.type=kind;osc.frequency.setValueAtTime(freq,t);
    amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(amp);amp.connect(soundContext.destination);osc.start(t);osc.stop(t+duration);
  }catch(e){}
}
function chirp(){tone(670,.075);setTimeout(()=>tone(895,.11),82);}
function notify(text){$("toastText").textContent=text;show("toast");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>hide("toast"),2800);}
function updateQuest(){
  $("questTitle").textContent=questData[state.quest][0];
  $("questDescription").textContent=questData[state.quest][1];
  $("questProgress").style.width=Math.min(100,9+state.quest*13)+"%";
}
function nextQuest(index){if(index>state.quest){state.quest=index;updateQuest();updateNavigation();notify("✦ "+questData[index][0]);chirp();save();}}
function currentPokemon(){return state.team[0]||null;}
function percent(n,max){return Math.max(0,Math.min(100,(n/(max||1))*100));}
function paintBar(id,n,max){const el=$(id);el.style.width=percent(n,max)+"%";el.style.background=percent(n,max)>52?"#63ce82":percent(n,max)>23?"#e4b958":"#e97465";}
function updateHud(){
  const p=currentPokemon();
  if(p){show("partyPanel");$("partyImg").src=sprite(p.name);$("partyName").textContent=p.name;$("partyLevel").textContent="Nv. "+p.level+" · "+p.hp+" / "+p.maxHp+" PS";paintBar("partyHpBar",p.hp,p.maxHp);}
  else hide("partyPanel");
  $("partyCount").textContent=("0"+state.team.length).slice(-2)+" / 06";
  $("ballCount").textContent=state.balls;
}
function openDialogue(lines,after){
  dialogQueue=lines.map(x=>typeof x==="string"?{name:"NARRADOR",text:x}:x);
  dialogIndex=0;dialogAfter=after||null;dialogOpen=true;
  show("dialog");paintDialogue();tone(500,.06);
}
function paintDialogue(){
  const l=dialogQueue[dialogIndex];if(!l)return;
  $("dialogSpeaker").textContent=l.name.toUpperCase();
  $("dialogText").textContent=l.text;
  $("dialogAvatar").textContent=l.name==="BARRY"?"⚡":l.name.includes("SERBAL")?"✦":l.name==="MAMÁ"?"♥":l.name==="AYUDANTE"?"✿":"◈";
  const pic=trainerPics[l.name.toUpperCase()];const photo=$("dialogCharacter");
  if(pic){photo.onerror=()=>hide("dialogCharacter");photo.src="https://play.pokemonshowdown.com/sprites/trainers/"+pic+".png";show("dialogCharacter");}
  else hide("dialogCharacter");
}
function advanceDialogue(){
  if(!dialogOpen)return;dialogIndex++;tone(580,.04);
  if(dialogIndex<dialogQueue.length){paintDialogue();return;}
  dialogOpen=false;hide("dialog");const cb=dialogAfter;dialogAfter=null;if(cb)cb();save();
}
function hideModal(id){hide(id);}
function toggleMap(){if(!started||battle||dialogOpen||!$("starterModal").classList.contains("hidden"))return;hide("teamModal");hide("helpModal");atlas.isOpen?atlas.closeMap():atlas.openMap();}
function toggleTeam(){
  if(!started||battle||dialogOpen||!$("starterModal").classList.contains("hidden"))return;
  if($("teamModal").classList.contains("hidden")){renderTeam();show("teamModal");tone(540,.07);}else hide("teamModal");
}
function renderTeam(){
  $("teamList").innerHTML="";
  if(!state.team.length)$("teamList").textContent="Aún no tienes Pokémon.";
  for(const p of state.team){
    const el=document.createElement("div");el.className="team-entry";
    const img=document.createElement("img");img.src=sprite(p.name);img.alt=p.name;
    const text=document.createElement("div");const name=document.createElement("strong");name.textContent=p.name+"  ·  Nv. "+p.level;
    const hp=document.createElement("small");hp.textContent=p.hp+" / "+p.maxHp+" PS";
    const bar=document.createElement("div");bar.className="hp-track";
    const fill=document.createElement("div");fill.style.width=percent(p.hp,p.maxHp)+"%";
    fill.style.background=percent(p.hp,p.maxHp)>50?"#65d88c":percent(p.hp,p.maxHp)>25?"#e1bd55":"#e76c6d";
    bar.append(fill);text.append(name,hp,bar);el.append(img,text);$("teamList").append(el);
  }
  $("inventoryBalls").textContent=state.balls;
  $("potionCount").textContent="x "+state.potions;
  $("healBtn").disabled=state.potions<1||!currentPokemon()||currentPokemon().hp>=currentPokemon().maxHp;
}
function checkPosition(){
  const p=world.hero.root.position;
  const place=activeRoom?({home:"Casa del protagonista",bedroom:"Tu habitación",barry:"Casa de Barry",lab:"Laboratorio Pokémon",cottage:"Casa del vecino",center:"Centro Pokémon",mart:"Poké Mart",gym:"Gimnasio Pokémon"}[activeRoom.id]||"Interior"):sinnoh.where(p.x,p.z);
  if(!activeRoom){for(const city of PLACES){if(Math.hypot(p.x-city.x,p.z-city.z)<city.radius+4&&!(state.visited||[]).includes(city.id)){
    state.visited=state.visited||[];state.visited.push(city.id);notify("✦ ¡Has descubierto "+city.name+"!");tone(900,.1);save();atlas.update();
    if(state.quest===7&&city.id==="jubilife")nextQuest(8);
    if(state.quest===9&&city.id==="eterna")nextQuest(10);
    if(state.quest===10&&city.id==="hearthome")nextQuest(11);
  }}}
  if($("placeName").textContent!==place){$("placeName").textContent=place;if(started)notify("◇ "+place);}
}
function closestInteract(){
  const p=world.hero.root.position;
  if(activeRoom)return activeRoom.find(p.x,p.z);
  const things=[...world.portals,...world.spots,...world.npcs];
  let nearest=null,dist=3.1;
  for(const a of things){
    if(a.model?.root.visible===false)continue;
    const d=Math.hypot(a.x-p.x,a.z-p.z);
    if(d<dist){nearest=a;dist=d;}
  }
  return nearest;
}
function objective(){
  if(activeRoom){
    const id=activeRoom.id;
    if(state.quest===0&&id==="home")return {text:"Habla con mamá",x:1.7,z:.8,local:true};
    if(state.quest===1&&id==="barry")return {text:"Habla con Barry",x:-1.4,z:-.7,local:true};
    if(state.quest===5&&id==="home")return {text:"Habla con mamá",x:1.7,z:.8,local:true};
    if(state.quest===6&&id==="lab")return {text:"Habla con el profesor",x:-2.6,z:.5,local:true};
    return {text:id==="bedroom"?"Baja al salón":"Sal de la casa",x:0,z:id==="bedroom"?3.35:4.55,local:true};
  }
  const targets=[
    {text:"Entra en tu casa",x:12,z:17.2},
    {text:"Casa de Barry · entrar",x:-17,z:17.3},
    {text:"Maletín junto al lago",x:-16.4,z:-23.6},
    {text:"Elige un compañero",x:-16.4,z:-23.6},
    {text:"Regresa al maletín",x:-16.4,z:-23.6},
    {text:"Vuelve a casa",x:12,z:17.2},
    {text:"Entra al laboratorio",x:24,z:-24.1},
    {text:"Explora la Ruta 201",x:10,z:-11}
  ];
  // Street-aware waypoints stop the guide pointing through solid buildings.
  const p=world.hero.root.position,q=state.quest;
  if(q>=2&&q<=4){
    if(p.x<-8&&p.z>6)return {text:"Ve al camino principal",x:-4,z:20};
    if(p.z>-16)return {text:"Sigue la Ruta 201",x:-2,z:-18};
  }
  if(q===5){
    if(p.x<-8&&p.z<-10)return {text:"Regresa por la Ruta 201",x:-3,z:-17};
    if(p.z<17)return {text:"Sigue hacia Hojaverde",x:-2,z:20};
    if(p.x<8)return {text:"Ve hacia tu casa",x:12,z:19};
  }
  if(q===6){
    if(p.x>6&&p.z>8)return {text:"Toma el camino central",x:-2,z:20};
    if(p.z>-18)return {text:"Avanza hacia Pueblo Arena",x:-2,z:-19};
    if(p.x<21)return {text:"Sigue al este",x:24,z:-19};
  }
  return targets[state.quest]||targets[7];
}
function updateNavigation(){
  if(!started)return;
  show("navigator");
  const target=objective(),p=world.hero.root.position;
  const dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz);
  const yaw=activeRoom?0:cameraYaw;
  const screenX=dx*Math.cos(yaw)-dz*Math.sin(yaw);
  const screenUp=-dx*Math.sin(yaw)-dz*Math.cos(yaw);
  const angle=Math.atan2(screenX,screenUp)*180/Math.PI;
  $("navArrow").style.transform="rotate("+angle+"deg)";
  $("navTitle").textContent=target.text;
  $("navDistance").textContent=distance<2.5?"¡Ya estás cerca!":Math.ceil(distance)+" m de distancia";
  if(activeRoom){hide("radar");return;}
  show("radar");
  const mapPos=(x,z)=>({left:(50+x/84*100).toFixed(1)+"%",top:(50-z/84*100).toFixed(1)+"%"});
  Object.assign($("radarPlayer").style,mapPos(p.x,p.z));
  Object.assign($("radarTarget").style,mapPos(target.x,target.z));
}
function doInteract(){
  if(dialogOpen){advanceDialogue();return;}
  if(!started||battle||!$("intro").classList.contains("hidden")||!$("teamModal").classList.contains("hidden")||!$("starterModal").classList.contains("hidden")||!$("helpModal").classList.contains("hidden"))return;
  const n=closestInteract();if(!n)return;
  const kind=n.kind;
  if(kind==="door"){enterRoom(n.room||n.id,n);tone(500,.12);return;}
  if(kind==="exit"){exitRoom();tone(420,.12);return;}
  if(kind==="stairsUp"){enterRoom("bedroom",true);openDialogue([{name:"NARRADOR",text:"Tu dormitorio. Aquí empezó todo, frente a una noticia sobre un misterioso Gyarados rojo."}]);return;}
  if(kind==="stairsDown"){enterRoom("home",true);return;}
  if(kind==="healCenter"){for(const mon of state.team)mon.hp=mon.maxHp;updateHud();save();chirp();
    openDialogue([{name:"ENFERMERA JOY",text:"¡Bienvenido al Centro Pokémon! Tus compañeros han descansado y están completamente recuperados."},{name:"ENFERMERA JOY",text:"Cuídalos mucho y vuelve siempre que lo necesites. ¡Te deseamos suerte en tu aventura!"}]);return;}
  if(kind==="pokemonPc"){openDialogue([{name:"PC DE BILL",text:"Tu equipo puede descansar aquí. ¡Prueba también a capturar especies diferentes en cada ruta!"}]);return;}
  if(kind==="shopBalls"||kind==="shopPotions"){
    const isBalls=kind==="shopBalls",price=isBalls?500:300,item=isBalls?"cinco Poké Balls":"una poción";
    if(state.money<price){openDialogue([{name:"DEPENDIENTE",text:"¡Hola! "+item+" cuestan "+price+" ₽. No te alcanza el dinero; derrota entrenadores para conseguir más."}]);return;}
    state.money-=price;
    if(isBalls)state.balls+=5;else state.potions+=1;
    updateHud();save();
    openDialogue([{name:"DEPENDIENTE",text:"¡Gracias por tu compra! Te entrego "+item+" por "+price+" ₽. Te quedan "+state.money+" ₽."}]);return;
  }
  if(kind==="gymInfo"||kind==="gymRules"){openDialogue([{name:"GIMNASIO",text:"Para conseguir una medalla tendrás que derrotar al líder de este gimnasio. No puedes lanzar Poké Balls a los Pokémon de otros entrenadores."}]);return;}
  if(kind==="gymBattle"||kind==="gymLeader"){
    if(!state.starter){openDialogue([{name:"LÍDER",text:"Antes de desafiar un gimnasio, consigue tu primer Pokémon con el Profesor Serbal."}]);return;}
    if(state.quest<7){openDialogue([{name:"LÍDER",text:"Primero termina tu aventura inicial en el laboratorio de Pueblo Arena."}]);return;}
    const cityName=activeEntrance?.city||sinnoh.where(n.x,n.z);
    const leaders=[
      ["Ciudad Pirita","oreburgh","ROCO","Cranidos",9],
      ["Ciudad Vetusta","eterna","GARDENIA","Roselia",13],
      ["Ciudad Corazón","hearthome","FANTINA","Mismagius",17],
      ["Ciudad Rocavelo","veilstone","MAYLENE","Lucario",21],
      ["Ciudad Pradera","pastoria","MANANTI","Floatzel",25],
      ["Ciudad Canal","canalave","BYRON","Bastiodon",29],
      ["Ciudad Puntaneva","snowpoint","INVERNA","Abomasnow",33],
      ["Ciudad Marina","sunyshore","ELECTRO","Luxray",37]
    ];
    const info=leaders.find(a=>a[0]===cityName)||leaders[0];
    if((state.badges||[]).includes(info[1])){openDialogue([{name:"LÍDER "+info[2],text:"¡Ya has conseguido mi medalla! Sigue recorriendo Sinnoh para encontrar nuevos retos."}]);return;}
    openDialogue([{name:"LÍDER "+info[2],text:"¡Así que has venido a desafiarme! El camino de un entrenador se demuestra en combate."},{name:"LÍDER "+info[2],text:"Soy "+info[2]+", líder de "+info[0]+". ¡Prepárate! ¡Te reto a un combate por la medalla!"}],()=>encounter(info[3],false,{name:"LÍDER "+info[2],city:info[1],level:info[4],gym:true}));return;
  }
  if(kind==="trainer"){
    if(!state.starter){openDialogue([{name:n.name,text:"¿Todavía no tienes un Pokémon? ¡Habla con el profesor junto al lago!"}]);return;}
    const beaten=state.defeated||[];
    if(beaten.includes(n.name)){openDialogue([{name:n.name,text:"¡Ha sido un gran combate! Entrenaré para poder ganarte la próxima vez."}]);return;}
    openDialogue([{name:n.name,text:"¿Quieres tener un combate Pokémon? ¡No voy a perder sin luchar!"}],()=>encounter(n.pokemon||"Starly",false,{name:n.name,level:5+Math.floor((Math.abs(n.x)+Math.abs(n.z))/80),gym:false}));return;
  }
  if(kind==="talk"){openDialogue([{name:n.name,text:"¡La región de Sinnoh es increíble! Puedes visitar pueblos, explorar edificios y ganar medallas en los gimnasios."}]);return;}
  if(kind==="shopInfo"){openDialogue([{name:"CATÁLOGO",text:"Poké Balls: 5 por 500 ₽. Pociones: 300 ₽ cada una. ¡Acércate al mostrador para comprar!"}]);return;}
  if(kind==="mom"){
    if(state.quest===0){openDialogue([
      {name:"MAMÁ",text:"¡Buenos días, cariño! ¿Has visto la noticia? Un equipo de investigación busca un Gyarados rojo en un lago lejano."},
      {name:"MAMÁ",text:"Barry ha venido preguntando por ti. Tenía tanta prisa que casi tira la puerta."},
      {name:"MAMÁ",text:"Dice que tiene una idea muy importante. Ve a su casa, pero prométeme que no entrarás en la hierba alta sin un Pokémon."}
    ],()=>{nextQuest(1);updateNavigation();});}
    else if(state.quest===5){
      if(currentPokemon())currentPokemon().hp=currentPokemon().maxHp;
      openDialogue([
        {name:"MAMÁ",text:"¡¿Un Starly os atacó en el lago?! Menos mal que tu nuevo Pokémon te protegió. ¡Qué susto!"},
        {name:"MAMÁ",text:"Si el Profesor Serbal te dejó conservarlo, deberías visitarlo en su laboratorio de Pueblo Arena."},
        {name:"MAMÁ",text:"Toma, te regalo unos zapatos para correr. Mantén pulsado Shift mientras caminas. Y vuelve a casa cuando necesites descansar."}
      ],()=>{state.shoes=true;nextQuest(6);updateHud();});}
    else{if(currentPokemon())for(const mon of state.team)mon.hp=mon.maxHp;updateHud();
      openDialogue([{name:"MAMÁ",text:state.quest>=6?"¡Qué orgullosa estoy! Tus Pokémon han descansado. El Profesor Serbal te espera en Pueblo Arena.":"¿Ya has hablado con Barry? Si quieres empezar una aventura, ¡ve primero a buscarlo a su casa!"}]);}
  }else if(kind==="barryInside"){
    if(state.quest===1){openDialogue([
      {name:"BARRY",text:"¡Por fin! ¡Pensaba multarte con un millón de monedas por llegar tarde!"},
      {name:"BARRY",text:"¿Viste lo del Gyarados rojo? ¡Apuesto lo que quieras a que en nuestro lago también hay Pokémon rarísimos!"},
      {name:"BARRY",text:"Vamos al Lago Veraz. Quiero verlo con mis propios ojos. ¡Te espero fuera! ¡Corre!"}
    ],()=>{nextQuest(2);updateNavigation();});}
    else openDialogue([{name:"BARRY",text:"¡El Lago Veraz está hacia el suroeste, siguiendo la Ruta 201! ¡No perdamos ni un minuto!"}]);
  }else if(kind==="barry"){
    openDialogue([{name:"BARRY",text:state.quest<2?"¡Mejor nos vemos en mi casa!":state.quest<5?"¡Venga, vamos al Lago Veraz! Creo que vi un maletín cerca del agua.":"¡Ese "+state.starter+" es una pasada! ¡Te esperaré en el próximo pueblo!"}]);
  }else if(kind==="briefcase"){
    if(state.quest<2){openDialogue([{name:"NARRADOR",text:"Un maletín con una marca extraña. Aún no sabes quién lo ha dejado aquí. Barry debería ver esto."}]);}
    else if(state.quest===2){openDialogue([
      {name:"BARRY",text:"¡Mira! ¡Es un maletín de investigación! ¿Quién se lo habrá dejado junto al lago?"},
      {name:"NARRADOR",text:"Se escucha un crujido entre los arbustos. ¡Un Starly salvaje se acerca a toda velocidad!"},
      {name:"BARRY",text:"¡Rápido! ¡Dentro del maletín hay tres Poké Balls! ¡Escoge una, antes de que nos ataque!"}
    ],()=>{nextQuest(3);show("starterModal");});}
    else if(state.quest===3){show("starterModal");}
    else if(state.quest===4){openDialogue([{name:"NARRADOR",text:"¡El Starly salvaje ha vuelto! ¡Protege a tu compañero!"}],()=>encounter("Starly",true));}
    else openDialogue([{name:"NARRADOR",text:"Es el maletín donde encontraste a "+state.starter+". Un recuerdo de tu primer combate."}]);
  }else if(kind==="rowan"||kind==="rowanLab"){
    if(state.quest===6&&kind==="rowanLab"){
      openDialogue([
        {name:"PROF. SERBAL",text:"¡Así que tú eres el entrenador que utilizó uno de mis Pokémon junto al lago! He podido observar vuestra conexión."},
        {name:"PROF. SERBAL",text:"El crecimiento de los Pokémon es un misterio fascinante. Por eso necesito la ayuda de entrenadores curiosos y valientes."},
        {name:"PROF. SERBAL",text:"Toma esta Pokédex. Registra los Pokémon que encuentres durante tu viaje. También te daré cinco Poké Balls más."},
        {name:"PROF. SERBAL",text:"Sinnoh es enorme. Este es solo el primer paso: visita nuevas rutas, conoce entrenadores y haz crecer a tu equipo."}
      ],()=>{state.pokedex=true;state.balls+=5;state.money+=1500;nextQuest(7);updateHud();});}
    else if(state.quest<5)openDialogue([{name:"PROF. SERBAL",text:"Soy el Profesor Serbal. Parece que alguien ha movido mi maletín de investigación. Ten mucho cuidado cerca de la hierba alta."}]);
    else openDialogue([{name:"PROF. SERBAL",text:state.quest===5?"Primero ve a casa a tranquilizar a tu madre. Después hablamos en el laboratorio.":"Cuida bien de tus Pokémon y registra cuantas especies puedas en la Pokédex."}]);
  }else if(kind==="aide"||kind==="aideLab"){
    openDialogue([{name:"AYUDANTE",text:state.quest===6?"¡El Profesor Serbal te espera dentro del laboratorio! Acércate a él para hablar.":"Trabajo con el Profesor Serbal. ¡Los Pokémon de Sinnoh son increíbles! Hay muchas especies esperando a ser descubiertas."}]);
  }else if(kind==="television"){
    openDialogue([{name:"TELEVISOR",text:"«En búsqueda del Gyarados rojo»: un grupo de investigadores analiza unos extraños avistamientos de un Pokémon de color diferente."},{name:"NARRADOR",text:"La noticia parece haber despertado el espíritu aventurero de Barry."}]);
  }else if(kind==="computer"){openDialogue([{name:"ORDENADOR",text:"Has abierto tu ordenador. Un mapa de Sinnoh muestra Pueblo Hojaverde, la Ruta 201 y Pueblo Arena."}]);}
  else if(kind==="bed"){for(const p of state.team)p.hp=p.maxHp;updateHud();openDialogue([{name:"NARRADOR",text:"Te tumbas un momento y descansas. Tu equipo Pokémon ha recuperado todos sus PS."}]);}
  else if(kind==="pokedex"){openDialogue([{name:"POKÉDEX",text:state.pokedex?"Pokédex Sinnoh · Has registrado "+state.caught.length+" especies capturadas.":"Un dispositivo rojo con una pantalla táctil. Parece diseñado para registrar especies Pokémon."}]);}
  else if(kind==="barryMom"){openDialogue([{name:"MADRE DE BARRY",text:"¡Barry siempre tiene prisa! Seguro que ya se ha inventado otra expedición. Procura que no se meta en problemas."}]);}
  else if(kind==="lakeSign"){openDialogue([{name:"SEÑAL",text:"LAGO VERAZ — Se dice que en el fondo de sus aguas habita un Pokémon que controla las emociones."}]);}
  else if(kind==="townSign"){openDialogue([{name:"SEÑAL",text:"PUEBLO ARENA → Hogar del laboratorio del Profesor Serbal. Abierto a los entrenadores Pokémon."}]);}
  else if(kind==="routeSign"){openDialogue([{name:"SEÑAL",text:"RUTA 201 — En la hierba alta viven Pokémon salvajes. No entres sin un compañero preparado."}]);}
  else openDialogue([{name:"NARRADOR",text:kind==="research"?"Notas de investigación sobre la evolución de los Pokémon.":kind==="books"?"Revistas y mapas de Sinnoh. ¡Barry ha marcado el lago con un círculo rojo!":kind==="table"?"Mamá ha dejado el desayuno sobre la mesa.":kind==="neighborInside"?"El vecino te desea suerte en tu aventura.":"¡Sinnoh está lleno de secretos por descubrir!"}]);
}
function createStarter(name){
  if(state.starter)return;
  hide("starterModal");
  const data=DATABASE[name];state.starter=name;
  state.team=[{name,level:5,maxHp:data.max,hp:data.max,xp:0}];
  state.balls=5;state.potions=3;
  nextQuest(4);updateHud();chirp();
  openDialogue([
    {name:"BARRY",text:"¡Has elegido a "+name+"! ¡Buena elección! ¡Ahora demuestra lo que vales!"},
    {name:"NARRADOR",text:"Un Starly salvaje sale de la hierba y ataca. ¡Tu primer combate Pokémon está a punto de empezar!"},
    {name:"NARRADOR",text:"En combate puedes usar Placaje, un movimiento especial, lanzar Poké Balls o intentar huir."}
  ],()=>encounter("Starly",true));
  save();
}
function startGame(resume){
  state=resume&&saved?{...freshState(),...saved}:freshState();
  if(!resume){try{localStorage.removeItem("sinnohRebornSaveV3");}catch(e){}}
  started=true;
  scene.add(world.hero.root);
  outsidePosition={...state.pos};
  world.hero.root.position.set(state.pos.x,0,state.pos.z);
  cameraTarget.set(state.pos.x,1.1,state.pos.z);
  hide("intro");show("hud");show("leftHud");show("bottomHud");show("navigator");
  if(state.room){activeEntrance=world.portals.find(p=>p.id===state.portal)||null;enterRoom(state.room);}
  else show("radar");
  updateQuest();updateHud();checkPosition();updateNavigation();chirp();save();
  if(!resume){
    openDialogue([
      {name:"NARRADOR",text:"SINNOH · PUEBLO HOJAVERDE. Estás en tu habitación, viendo las noticias en la televisión."},
      {name:"TELEVISOR",text:"«¡El misterio del Gyarados rojo!» Una expedición ha buscado un ejemplar de color distinto en un lago lejano, sin obtener resultados."},
      {name:"BARRY",text:"¡Eh, por fin estás despierto! ¿Has visto eso? ¡Apuesto a que nuestro lago también esconde un Pokémon increíble! ¡Nos vemos pronto!"},
      {name:"NARRADOR",text:"Barry sale corriendo. Baja al salón y habla con mamá. Usa WASD y pulsa E junto a las escaleras."}
    ]);
  }else notify("Partida recuperada. Tu aventura continúa.");
}
function randomEnemy(){
  const candidates=["Starly","Bidoof","Shinx","Kricketot","Budew"];
  return state.quest===2&&state.wins===0?"Starly":candidates[Math.floor(Math.random()*candidates.length)];
}
function encounter(forcedName=null,isScripted=false,challenger=null){
  if(battle||dialogOpen||!currentPokemon())return;
  const name=forcedName||randomEnemy(),lev=challenger?.level??(isScripted?3:2+Math.floor(Math.random()*4)),p=DATABASE[name];
  scriptedBattle=isScripted;
  const maxHp=p.max+Math.max(0,lev-3)*2;
  battle={name,level:lev,hp:maxHp,maxHp,trainer:challenger};
  document.querySelector(".battle-mark").textContent=challenger?"⚔ DESAFÍO DE "+challenger.name:"◈ ENCUENTRO SALVAJE";
  turn=1;battleBusy=false;
  $("enemySprite").src=sprite(name);
  $("playerSprite").src=sprite(currentPokemon().name);
  show("battle");hide("interactHint");
  $("battleMessage").textContent="¡Un "+name+" salvaje ha aparecido!";
  updateBattle();tone(360,.1,"triangle",.06);
  setTimeout(()=>tone(510,.1,"triangle",.05),150);
}
function updateBattle(){
  if(!battle)return;
  const p=currentPokemon();
  $("enemyName").textContent=battle.name.toUpperCase();
  $("enemyLevel").textContent="NV. "+battle.level;
  $("enemyHpText").textContent=battle.hp+" / "+battle.maxHp+" PS";
  paintBar("enemyHpBar",battle.hp,battle.maxHp);
  $("battlePlayerName").textContent=p.name.toUpperCase();
  $("battlePlayerLevel").textContent="NV. "+p.level;
  $("playerHpText").textContent=p.hp+" / "+p.maxHp+" PS";
  paintBar("playerHpBar",p.hp,p.maxHp);
  $("xpBar").style.width=percent(p.xp,p.level*24)+"%";
  $("specialName").textContent=DATABASE[p.name].move.toUpperCase();
  $("battleTurn").textContent="TURNO "+turn;
  $("catchBtn").disabled=battleBusy||state.balls<=0||!!battle.trainer;
  $("runBtn").disabled=battleBusy||!!battle.trainer;
  for(const btn of ["attackBtn","specialBtn","runBtn"])$(btn).disabled=battleBusy;
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function battleSay(msg){$("battleMessage").textContent=msg;}
function animateHit(id){
  const el=$(id);el.animate([{filter:"brightness(1)"},{filter:"brightness(2.2) drop-shadow(0 0 30px white)"},{filter:"brightness(1)"}],{duration:430,easing:"ease-out"});
}
async function enemyTurn(){
  if(!battle)return;
  const p=currentPokemon(),move=DATABASE[battle.name].move;
  battleSay("¡"+battle.name+(battle.trainer?" del entrenador":" salvaje")+" usó "+move+"!");tone(210,.15,"sawtooth",.018);
  animateHit("playerSprite");await pause(420);
  const damage=Math.max(2,Math.floor(2+battle.level*.9+Math.random()*4-p.level*.12));
  p.hp=Math.max(0,p.hp-damage);updateBattle();
  await pause(450);
  if(p.hp<=0){battleSay("¡"+p.name+" se ha debilitado! Te han ayudado a recuperar a tu equipo.");await pause(1300);for(const mon of state.team)mon.hp=mon.maxHp;finishBattle(false);if(activeRoom&&activeRoom.id==="gym")exitRoom();notify("Tus Pokémon han recuperado sus fuerzas.");}
  else{battleBusy=false;turn++;battleSay("¿Qué debería hacer "+p.name+"?");updateBattle();}
}
function awardXp(){
  const p=currentPokemon();if(!p)return;
  p.xp+=Math.max(12,battle.level*9);
  let leveled=false;
  while(p.xp>=p.level*24&&p.level<100){p.xp-=p.level*24;p.level++;p.maxHp+=3;p.hp=Math.min(p.maxHp,p.hp+6);leveled=true;}
  if(leveled)notify("✦ "+p.name+" ha subido al nivel "+p.level+"!");
}
function finishBattle(won,caught=false){
  if(!battle)return;
  const trainer=battle.trainer;
  if(won){
    state.wins++;
    if(state.quest===4&&scriptedBattle)nextQuest(5);
    if(trainer){
      state.money+=trainer.gym?1800:500;
      if(trainer.gym){state.badges=state.badges||[];if(!state.badges.includes(trainer.city))state.badges.push(trainer.city);
        if(trainer.city==="oreburgh"&&state.quest===8)nextQuest(9);
        if(trainer.city==="eterna"&&state.quest===10)nextQuest(11);
        notify("🏅 ¡Medalla conseguida! "+trainer.name);
      }else{state.defeated=state.defeated||[];if(!state.defeated.includes(trainer.name))state.defeated.push(trainer.name);}
      atlas.update();
    }
  }
  scriptedBattle=false;
  battle=null;battleBusy=false;hide("battle");updateHud();save();
  if(won&&!caught)notify(trainer?"¡Victoria! Has ganado dinero y experiencia.":"¡Victoria! Tu equipo ha ganado experiencia.");
}
async function playerAttack(special){
  if(!battle||battleBusy)return;
  battleBusy=true;updateBattle();
  const p=currentPokemon(),move=special?DATABASE[p.name].move:"Placaje";
  battleSay("¡"+p.name+" usó "+move+"!");
  $("playerSprite").animate([{transform:"scaleX(-1) translateX(0)"},{transform:"scaleX(-1) translateX(-23px)"},{transform:"scaleX(-1) translateX(0)"}],{duration:380});
  tone(special?700:460,.13,"triangle",.055);
  await pause(370);
  let advantage=1;
  const a=DATABASE[p.name].type,b=DATABASE[battle.name].type;
  if(a==="Planta"&&b==="Agua"||a==="Agua"&&b==="Fuego"||a==="Fuego"&&b==="Planta")advantage=1.45;
  const base=special?DATABASE[p.name].power:7;
  const damage=Math.max(2,Math.floor((base*.5+p.level*.9+Math.random()*4)*advantage));
  battle.hp=Math.max(0,battle.hp-damage);animateHit("enemySprite");updateBattle();
  await pause(400);
  if(battle.hp<=0){battleSay("¡El "+battle.name+" salvaje se ha debilitado!");awardXp();updateBattle();await pause(1350);finishBattle(true);return;}
  await enemyTurn();
}
async function throwBall(){
  if(!battle||battleBusy)return;
  if(battle.trainer){battleSay("¡No puedes capturar Pokémon de otro entrenador!");return;}
  if(state.balls<=0){battleSay("No te quedan Poké Balls.");return;}
  battleBusy=true;state.balls--;updateBattle();save();
  battleSay("¡Lanzaste una Poké Ball!");tone(900,.15);
  $("enemySprite").animate([{transform:"scale(1)",opacity:1},{transform:"scale(.1)",opacity:.2},{transform:"scale(1)",opacity:1}],{duration:700});
  await pause(900);
  const chance=.19+.73*(1-battle.hp/battle.maxHp);
  if(Math.random()<chance){
    const p=battle,already=state.team.length>=6;
    if(!state.caught.includes(p.name))state.caught.push(p.name);
    if(!already)state.team.push({name:p.name,level:p.level,hp:p.maxHp,maxHp:p.maxHp,xp:0});
    battleSay("¡Capturado! "+p.name+(already?" fue registrado, pero tu equipo está lleno.":" se ha unido a tu equipo."));
    chirp();await pause(1450);finishBattle(true,true);
    notify("◉ ¡Capturaste a "+p.name+"!");
  }else{battleSay("¡Oh, no! ¡"+battle.name+" se ha escapado de la Poké Ball!");tone(280,.15);await pause(1100);await enemyTurn();}
}
async function attemptRun(){
  if(!battle||battleBusy)return;
  if(battle.trainer){battleSay("¡No puedes huir de un combate contra un entrenador!");return;}battleBusy=true;updateBattle();
  if(Math.random()<.83){battleSay("¡Escapaste sin problemas!");await pause(600);finishBattle(false);}
  else{battleSay("¡No has podido escapar!");await pause(700);await enemyTurn();}
}
$("attackBtn").addEventListener("click",()=>playerAttack(false));
$("specialBtn").addEventListener("click",()=>playerAttack(true));
$("catchBtn").addEventListener("click",throwBall);
$("runBtn").addEventListener("click",attemptRun);
$("startBtn").addEventListener("click",()=>startGame(false));
$("continueBtn").addEventListener("click",()=>startGame(true));
document.querySelectorAll("[data-starter]").forEach(btn=>btn.addEventListener("click",()=>createStarter(btn.dataset.starter)));
$("starterCancel").addEventListener("click",()=>hide("starterModal"));
$("teamToggle").addEventListener("click",toggleTeam);
$("teamClose").addEventListener("click",()=>hide("teamModal"));
$("helpToggle").addEventListener("click",()=>show("helpModal"));
$("helpClose").addEventListener("click",()=>hide("helpModal"));
$("mapToggle").addEventListener("click",toggleMap);
$("mapButton").addEventListener("click",toggleMap);
$("mapClose").addEventListener("click",()=>atlas.closeMap());
$("soundToggle").addEventListener("click",()=>{state.sound=!state.sound;$("soundToggle").textContent=state.sound?"♫":"♪̸";notify(state.sound?"Sonido activado":"Sonido desactivado");save();});
$("healBtn").addEventListener("click",()=>{const p=currentPokemon();if(!p||state.potions<1||p.hp>=p.maxHp)return;state.potions--;p.hp=Math.min(p.maxHp,p.hp+20);tone(760,.14);renderTeam();updateHud();save();notify(p.name+" recuperó PS.");});
window.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key))e.preventDefault();
  if(e.repeat&&["e","Enter","r","Escape","m"].includes(e.key))return;
  const k=e.key.toLowerCase();keys.add(k);
  if(k==="escape"){if(dialogOpen)return;hide("teamModal");hide("helpModal");atlas.closeMap();return;}
  if(k==="e"||k==="enter"||k===" "){if(dialogOpen){advanceDialogue();return;}doInteract();}
  if(k==="r"&&!dialogOpen)toggleTeam();
  if(k==="m"&&!dialogOpen)toggleMap();
});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
window.addEventListener("blur",()=>{keys.clear();save();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});
window.addEventListener("beforeunload",save);
window.addEventListener("resize",()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
let pointerDown=false,lastPointerX=0,dragDistance=0;
renderer.domElement.addEventListener("pointerdown",e=>{if(activeRoom)return;pointerDown=true;lastPointerX=e.clientX;dragDistance=0;});
window.addEventListener("pointerup",()=>pointerDown=false);
window.addEventListener("pointermove",e=>{if(!pointerDown)return;const dx=e.clientX-lastPointerX;cameraYaw-=dx*.005;lastPointerX=e.clientX;dragDistance+=Math.abs(dx);});
renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();if(!activeRoom)camDistance=Math.max(11,Math.min(27,camDistance+e.deltaY*.014));},{passive:false});
function canMove(){return started&&!battle&&!dialogOpen&&["intro","starterModal","teamModal","helpModal","mapModal"].every(id=>$(id).classList.contains("hidden"));}
function collides(x,z){
  if(activeRoom)return activeRoom.collides(x,z);
  if(x<sinnoh.bounds.minX||x>sinnoh.bounds.maxX||z<sinnoh.bounds.minZ||z>sinnoh.bounds.maxZ)return true;
  for(const o of world.obstacles){
    if(o.kind==="building"){if(Math.abs(x-o.x)<o.w+.18&&Math.abs(z-o.z)<o.d+.18)return true;}
    else if(Math.hypot(x-o.x,z-o.z)<o.r+.25)return true;
  }
  return false;
}
function move(dt,t){
  const f=(keys.has("w")||keys.has("arrowup")?1:0)-(keys.has("s")||keys.has("arrowdown")?1:0);
  const r=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
  if(!f&&!r){world.hero.walk(t,false);return;}
  const speed=keys.has("shift")?state.shoes?8.8:6.0:5.1,mag=Math.hypot(f,r);
  const forward=new THREE.Vector2(-Math.sin(cameraYaw),-Math.cos(cameraYaw)),right=new THREE.Vector2(Math.cos(cameraYaw),-Math.sin(cameraYaw));
  const dx=(forward.x*f+right.x*r)/mag*speed*dt,dz=(forward.y*f+right.y*r)/mag*speed*dt;
  const p=world.hero.root.position;
  if(!collides(p.x+dx,p.z))p.x+=dx;
  if(!collides(p.x,p.z+dz))p.z+=dz;
  const facing=Math.atan2(dx,dz);world.hero.root.rotation.y=facing;
  world.hero.walk(t,true);
  const moved=Math.hypot(p.x-lastPos.x,p.z-lastPos.z);
  if(moved>.08){stepDistance+=moved;lastPos={x:p.x,z:p.z};}
  if(stepDistance>3){stepDistance=0;if(!activeRoom&&state.starter&&state.quest>=5&&sinnoh.inGrass(p.x,p.z)&&Math.random()<.21)encounter();}
}
let hintTick=0,autosaveTick=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(.055,clock.getDelta()),t=clock.elapsedTime;
  if(canMove())move(dt,t);
  else world.hero.walk(t,false);
  world.animate(t,state.quest);
  const pos=world.hero.root.position;
  cameraTarget.lerp(new THREE.Vector3(pos.x,activeRoom?1.0:1.2,pos.z),Math.min(1,dt*(activeRoom?6:3.2)));
  let yaw=cameraYaw;
  if(!started)yaw=.65+Math.sin(t*.18)*.06;
  const newPos=new THREE.Vector3(cameraTarget.x+Math.sin(yaw)*(activeRoom?13:camDistance),cameraTarget.y+(activeRoom?13:camDistance*.62),cameraTarget.z+Math.cos(yaw)*(activeRoom?13:camDistance));
  camera.position.lerp(newPos,Math.min(1,dt*2.8));camera.lookAt(cameraTarget);
  sinnoh.tick(t);
  renderer.render(activeRoom?.scene||scene,camera);
  displayCharacterArt(t);
  if(started){hintTick+=dt;autosaveTick+=dt;
    if(hintTick>.24){hintTick=0;checkPosition();updateNavigation();world.npcs.filter(n=>n.kind==="barry").forEach(n=>n.model.root.visible=state.quest>=2);if(canMove()){const n=closestInteract();if(n){$("interactLabel").textContent="Hablar · "+n.name;show("interactHint");}else hide("interactHint");}else hide("interactHint");}
    if(autosaveTick>12){autosaveTick=0;save();}
  }
}
try{hide("loading");frame();}catch(err){console.error(err);hide("loading");show("error");}
