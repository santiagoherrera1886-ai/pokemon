import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import { buildWorld } from "./world.js";
import { createInteriors } from "./interiors.js";

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
  Budew:{id:406,type:"Planta",move:"Absorber",power:6,max:16}
};
const sprite=name=>SPRITE_ROOT+(DATABASE[name]?.id||396)+".png";
const freshState=()=>({quest:0,starter:null,team:[],balls:5,potions:3,seen:[],caught:[],wins:0,pos:{x:12,z:19.5},room:"home",sound:true,shoes:false,pokedex:false,scriptedBattle:false});
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
const camera=new THREE.PerspectiveCamera(43,window.innerWidth/window.innerHeight,.1,180);
const hemi=new THREE.HemisphereLight(0xe3fbff,0x6e8e57,2.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5b7,3.7);sun.position.set(-22,45,21);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-51;sun.shadow.camera.right=51;sun.shadow.camera.top=51;sun.shadow.camera.bottom=-51;sun.shadow.camera.near=.5;sun.shadow.camera.far=125;sun.shadow.bias=-.00012;sun.shadow.normalBias=.035;scene.add(sun);
const world=buildWorld(THREE,scene);
const interiors=createInteriors(THREE);
let activeRoom=null;
let outsidePosition={x:12,z:19.5};
let scriptedBattle=false;
const trainerPics={"BARRY":"barry","PROF. SERBAL":"rowan","LUCAS":"lucas","MAYA":"dawn","AYUDANTE":"dawn","MAMÁ":"lady","MADRE DE BARRY":"lady","VECINO":"gentleman","VECINA":"lady"};
function enterRoom(id,fromStairs=false){
  if(battle)return;
  const p=world.hero.root;
  if(!activeRoom){outsidePosition={x:p.position.x,z:p.position.z};}
  activeRoom=interiors.get(id);
  activeRoom.scene.add(p);p.position.set(fromStairs?0:0,0,fromStairs?2.7:1.9);p.rotation.y=Math.PI;
  cameraTarget.set(0,1.1,0);cameraYaw=0;
  camDistance=16;
  hide("interactHint");hide("radar");
  checkPosition();updateNavigation();save();
}
function exitRoom(){
  if(!activeRoom)return;
  const id=activeRoom.id;
  if(id==="bedroom"){enterRoom("home",true);notify("Has bajado al salón.");return;}
  const door=world.portals.find(p=>p.id===id)||world.portals.find(p=>p.id==="home");
  scene.add(world.hero.root);activeRoom=null;
  world.hero.root.position.set(door.x,0,door.exitZ+.2);
  outsidePosition={x:door.x,z:door.exitZ+.2};
  cameraTarget.set(door.x,1.1,door.exitZ);
  cameraYaw=.64;camDistance=16;
  show("radar");checkPosition();updateNavigation();save();
}

let cameraYaw=.65,camDistance=16,cameraTarget=new THREE.Vector3(12,1,19.5),lastPos={x:12,z:19.5},stepDistance=0,locationTimer=0;
const clock=new THREE.Clock();
const questData=[
  ["El comienzo de todo","Estás en casa, en Pueblo Hojaverde. Habla con mamá para saber qué ocurre."],
  ["¡Barry te necesita!","Ve a la casa de Barry, la de tejado rojo, y habla con él en el interior."],
  ["El misterio del lago","Barry quiere investigar el Lago Veraz. Busca un maletín olvidado junto al agua."],
  ["Tres Pokémon, un destino","Abre el maletín y elige a tu primer compañero Pokémon."],
  ["¡Protege a tu Pokémon!","Un Starly salvaje te ha atacado. Gana tu primer combate."],
  ["Un regalo de mamá","Vuelve a casa y habla con mamá. Te tiene preparado algo para el viaje."],
  ["Hacia Pueblo Arena","Ve hacia el este, entra al laboratorio y habla con el Profesor Serbal."],
  ["Un mundo por descubrir","¡Tienes tu Pokédex! Explora la Ruta 201, captura Pokémon y forma tu equipo."]
];
function save(){
  if(!started)return;
  if(!activeRoom)outsidePosition={x:world.hero.root.position.x,z:world.hero.root.position.z};
  state.pos={x:Number(outsidePosition.x.toFixed(2)),z:Number(outsidePosition.z.toFixed(2))};
  state.room=activeRoom?.id||null;
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
function nextQuest(index){if(index>state.quest){state.quest=index;updateQuest();notify("✦ "+questData[index][0]);chirp();save();}}
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
  if(pic){photo.src="https://play.pokemonshowdown.com/sprites/trainers/"+pic+".png";show("dialogCharacter");}
  else hide("dialogCharacter");
}
function advanceDialogue(){
  if(!dialogOpen)return;dialogIndex++;tone(580,.04);
  if(dialogIndex<dialogQueue.length){paintDialogue();return;}
  dialogOpen=false;hide("dialog");const cb=dialogAfter;dialogAfter=null;if(cb)cb();save();
}
function hideModal(id){hide(id);}
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
  const p=world.hero.root.position,x=p.x,z=p.z;
  const name=x<-14&&z<-22?"Lago Veraz":x>18&&z<-20?"Pueblo Arena":z<-5&&x>0?"Ruta 201":z<-12?"Ruta 201":"Pueblo Hojaverde";
  if($("placeName").textContent!==name){$("placeName").textContent=name;notify("◇ "+name);}
}
function closestInteract(){
  const p=world.hero.root.position;
  const all=[...world.npcs,...world.spots];
  let best=null,dist=3.5;
  for(const a of all){const d=Math.hypot(a.x-p.x,a.z-p.z);if(d<dist){best=a;dist=d;}}
  return best;
}
function doInteract(){
  if(dialogOpen){advanceDialogue();return;}
  if(!started||battle||!$("intro").classList.contains("hidden")||!$("teamModal").classList.contains("hidden")||!$("starterModal").classList.contains("hidden")||!$("helpModal").classList.contains("hidden"))return;
  const n=closestInteract();if(!n)return;const kind=n.kind;
  if(kind==="barry"){
    if(state.quest===0){openDialogue([{name:"BARRY",text:"¡Eh! ¡Por fin apareces! ¿Has oído hablar del misterioso Pokémon que vive cerca del Lago Veraz?"},{name:"BARRY",text:"¡Vamos a comprobarlo! El Profesor Serbal anda investigando por allí. Sigue el camino hacia el norte."},{name:"BARRY",text:"¡Y no te metas en la hierba alta sin un Pokémon! ¡Podría ser peligroso!"}],()=>nextQuest(1));}
    else openDialogue([{name:"BARRY",text:state.starter?"¡Ese "+state.starter+" es increíble! ¡Nos espera una gran aventura!":"¡Nos vemos en el Lago Veraz! ¡No tardes!"}]);
  }else if(kind==="rowan"){
    if(!state.starter&&state.quest===0){openDialogue([{name:"PROF. SERBAL",text:"Veo que tienes ganas de explorar. Habla primero con Barry; seguro que está buscándote en el pueblo."}]);}
    else if(!state.starter){openDialogue([{name:"PROF. SERBAL",text:"¡Ah, llegas justo a tiempo! Soy el Profesor Serbal. Estudio el origen y la evolución de los Pokémon."},{name:"PROF. SERBAL",text:"En Sinnoh conviven cientos de especies fascinantes. Para investigarlas necesitaré tu ayuda."},{name:"PROF. SERBAL",text:"Pero antes, quiero entregarte a un compañero. Piensa bien cuál de estos tres Pokémon quieres que te acompañe."}],()=>show("starterModal"));}
    else if(state.quest===3){openDialogue([{name:"PROF. SERBAL",text:"¡Excelente trabajo! Ya has tenido tu primer combate. Tu vínculo con "+state.starter+" será cada vez más fuerte."},{name:"PROF. SERBAL",text:"Toma algunas Poké Balls adicionales. Viaja hacia el este hasta Pueblo Arena y habla con mi ayudante junto al laboratorio."},{name:"PROF. SERBAL",text:"¡El mundo Pokémon está esperando a que lo descubras!"}],()=>{state.balls+=5;nextQuest(4);updateHud();});}
    else openDialogue([{name:"PROF. SERBAL",text:state.quest>=4?"Recuerda cuidar de tu equipo y explorar cada rincón de Sinnoh. ¡El laboratorio está al este!":"Tu Pokémon todavía tiene mucho por aprender. Prueba a combatir en la hierba alta de la Ruta 201."}]);
  }else if(kind==="mom"){
    if(state.team.length){let p=currentPokemon();p.hp=p.maxHp;updateHud();save();openDialogue([{name:"MAMÁ",text:"¡Qué alegría verte! He dejado que tus Pokémon descansen. Ya están completamente recuperados."},{name:"MAMÁ",text:"Y recuerda, ningún gran viaje se completa de un solo salto. Disfruta cada paso."}]);}
    else openDialogue([{name:"MAMÁ",text:"¡Buenos días! Barry te ha estado buscando. Parece muy emocionado por algo. ¡Ve a verlo!"}]);
  }else if(kind==="aide"){
    if(state.quest===4){openDialogue([{name:"AYUDANTE",text:"¡Por fin has llegado a Pueblo Arena! El Profesor Serbal me dijo que vendrías."},{name:"AYUDANTE",text:"Has superado el comienzo de tu viaje. ¡Enhorabuena! Esta es una demo: pronto podrás explorar nuevas rutas y ciudades."},{name:"AYUDANTE",text:"Mientras tanto, ¡prueba a capturar nuevos Pokémon para tu equipo!"}],()=>{nextQuest(5);state.potions+=2;save();});}
    else openDialogue([{name:"AYUDANTE",text:"¡Hola, entrenador! Si necesitas recuperar fuerzas, habla con tu mamá en Pueblo Hojaverde. ¡Y no olvides tus Poké Balls!"}]);
  }else if(kind==="lakeSign"){openDialogue([{name:"SEÑAL",text:"LAGO VERAZ — Las tranquilas aguas de Sinnoh reflejan historias que aún no han sido contadas."}]);}
  else if(kind==="townSign"){openDialogue([{name:"SEÑAL",text:"PUEBLO ARENA → Sede del laboratorio del Profesor Serbal."}]);}
  else if(kind==="routeSign"){openDialogue([{name:"SEÑAL",text:"RUTA 201 — Hierba alta. Habitan Pokémon salvajes. ¡Prepara tu equipo antes de avanzar!"}]);}
}
function createStarter(name){
  hide("starterModal");
  const data=DATABASE[name];state.starter=name;
  state.team=[{name,level:5,maxHp:data.max,hp:data.max,xp:0}];
  state.balls=5;state.potions=3;
  nextQuest(2);updateHud();chirp();
  openDialogue([{name:"PROF. SERBAL",text:"¡Maravilloso! "+name+" será tu primer compañero. Estoy seguro de que formaréis un equipo extraordinario."},{name:"PROF. SERBAL",text:"Te entrego cinco Poké Balls. Enfréntate a Pokémon salvajes en la hierba alta; así aprenderéis a combatir juntos."}]);
  save();
}
function startGame(resume){
  state=resume&&saved?{...freshState(),...saved}:freshState();
  if(!resume){try{localStorage.removeItem("sinnohRebornSaveV3");}catch(e){}}
  world.hero.root.position.set(state.pos.x,0,state.pos.z);
  cameraTarget.set(state.pos.x,1.1,state.pos.z);
  started=true;hide("intro");show("hud");show("leftHud");show("bottomHud");
  updateQuest();updateHud();checkPosition();chirp();save();
  if(!resume){openDialogue([{name:"NARRADOR",text:"Una mañana dorada en Pueblo Hojaverde, en la región de Sinnoh..."},{name:"NARRADOR",text:"Los días tranquilos están a punto de cambiar. Barry, tu mejor amigo, te espera cerca de casa. Ve a buscarlo."}]);}
  else notify("Partida recuperada. ¡Bienvenido de nuevo!");
}
function randomEnemy(){
  const candidates=["Starly","Bidoof","Shinx","Kricketot","Budew"];
  return state.quest===2&&state.wins===0?"Starly":candidates[Math.floor(Math.random()*candidates.length)];
}
function encounter(){
  if(battle||dialogOpen||!currentPokemon())return;
  const name=randomEnemy(),lev=2+Math.floor(Math.random()*4),p=DATABASE[name];
  const maxHp=p.max+Math.max(0,lev-3)*2;
  battle={name,level:lev,hp:maxHp,maxHp};
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
  $("catchBtn").disabled=battleBusy||state.balls<=0;
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
  battleSay("¡"+battle.name+" salvaje usó "+move+"!");tone(210,.15,"sawtooth",.018);
  animateHit("playerSprite");await pause(420);
  const damage=Math.max(2,Math.floor(2+battle.level*.9+Math.random()*4-p.level*.12));
  p.hp=Math.max(0,p.hp-damage);updateBattle();
  await pause(450);
  if(p.hp<=0){battleSay("¡"+p.name+" se ha debilitado! Volveréis a casa para descansar.");await pause(1700);p.hp=p.maxHp;world.hero.root.position.set(-6,0,21);finishBattle(false);notify("Tus Pokémon se han recuperado en casa.");}
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
  if(won){state.wins++;if(state.quest===2)nextQuest(3);}
  battle=null;battleBusy=false;hide("battle");updateHud();save();
  if(won&&!caught)notify("¡Victoria! Tu equipo ha ganado experiencia.");
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
  if(!battle||battleBusy)return;battleBusy=true;updateBattle();
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
$("soundToggle").addEventListener("click",()=>{state.sound=!state.sound;$("soundToggle").textContent=state.sound?"♫":"♪̸";notify(state.sound?"Sonido activado":"Sonido desactivado");save();});
$("healBtn").addEventListener("click",()=>{const p=currentPokemon();if(!p||state.potions<1||p.hp>=p.maxHp)return;state.potions--;p.hp=Math.min(p.maxHp,p.hp+20);tone(760,.14);renderTeam();updateHud();save();notify(p.name+" recuperó PS.");});
window.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key))e.preventDefault();
  if(e.repeat&&["e","Enter","r","Escape"].includes(e.key))return;
  const k=e.key.toLowerCase();keys.add(k);
  if(k==="escape"){if(dialogOpen)return;hide("teamModal");hide("helpModal");return;}
  if(k==="e"||k==="enter"||k===" "){if(dialogOpen){advanceDialogue();return;}doInteract();}
  if(k==="r"&&!dialogOpen)toggleTeam();
});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
window.addEventListener("blur",()=>{keys.clear();save();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});
window.addEventListener("beforeunload",save);
window.addEventListener("resize",()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
let pointerDown=false,lastPointerX=0,dragDistance=0;
renderer.domElement.addEventListener("pointerdown",e=>{pointerDown=true;lastPointerX=e.clientX;dragDistance=0;});
window.addEventListener("pointerup",()=>pointerDown=false);
window.addEventListener("pointermove",e=>{if(!pointerDown)return;const dx=e.clientX-lastPointerX;cameraYaw-=dx*.005;lastPointerX=e.clientX;dragDistance+=Math.abs(dx);});
renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();camDistance=Math.max(15,Math.min(34,camDistance+e.deltaY*.016));},{passive:false});
function canMove(){return started&&!battle&&!dialogOpen&&["intro","starterModal","teamModal","helpModal"].every(id=>$(id).classList.contains("hidden"));}
function collides(x,z){
  if(x<-41||x>41||z<-41||z>41)return true;
  for(const o of world.obstacles){if(Math.hypot(x-o.x,z-o.z)<o.r+.25)return true;}return false;
}
function move(dt,t){
  const f=(keys.has("w")||keys.has("arrowup")?1:0)-(keys.has("s")||keys.has("arrowdown")?1:0);
  const r=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
  if(!f&&!r){world.hero.walk(t,false);return;}
  const speed=keys.has("shift")?8.0:5.1,mag=Math.hypot(f,r);
  const forward=new THREE.Vector2(-Math.sin(cameraYaw),-Math.cos(cameraYaw)),right=new THREE.Vector2(Math.cos(cameraYaw),-Math.sin(cameraYaw));
  const dx=(forward.x*f+right.x*r)/mag*speed*dt,dz=(forward.y*f+right.y*r)/mag*speed*dt;
  const p=world.hero.root.position;
  if(!collides(p.x+dx,p.z))p.x+=dx;
  if(!collides(p.x,p.z+dz))p.z+=dz;
  const facing=Math.atan2(dx,dz);world.hero.root.rotation.y=facing;
  world.hero.walk(t,true);
  const moved=Math.hypot(p.x-lastPos.x,p.z-lastPos.z);
  if(moved>.08){stepDistance+=moved;lastPos={x:p.x,z:p.z};}
  if(stepDistance>3){stepDistance=0;if(state.starter&&world.grassAt(p.x,p.z)&&Math.random()<.28)encounter();}
}
let hintTick=0,autosaveTick=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(.055,clock.getDelta()),t=clock.elapsedTime;
  if(canMove())move(dt,t);
  else world.hero.walk(t,false);
  world.animate(t,state.quest);
  const pos=world.hero.root.position;
  cameraTarget.lerp(new THREE.Vector3(pos.x,1.2,pos.z),Math.min(1,dt*3.2));
  let yaw=cameraYaw;
  if(!started)yaw=.65+Math.sin(t*.18)*.06;
  const newPos=new THREE.Vector3(cameraTarget.x+Math.sin(yaw)*camDistance,cameraTarget.y+camDistance*.73,cameraTarget.z+Math.cos(yaw)*camDistance);
  camera.position.lerp(newPos,Math.min(1,dt*2.8));camera.lookAt(cameraTarget);
  renderer.render(scene,camera);
  if(started){hintTick+=dt;autosaveTick+=dt;
    if(hintTick>.24){hintTick=0;checkPosition();if(canMove()){const n=closestInteract();if(n){$("interactLabel").textContent="Hablar · "+n.name;show("interactHint");}else hide("interactHint");}else hide("interactHint");}
    if(autosaveTick>12){autosaveTick=0;save();}
  }
}
try{hide("loading");frame();}catch(err){console.error(err);hide("loading");show("error");}
