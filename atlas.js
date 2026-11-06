// Interactive atlas of Sinnoh, using the same real coordinates as the 3D world.
export function makeAtlas(places,routes,getGameState){
 const $=id=>document.getElementById(id);
 const container=$("sinnohMap");
 const cityById=Object.fromEntries(places.map(c=>[c.id,c]));
 const minX=-175,maxX=480,minZ=-475,maxZ=90;
 const project=(x,z)=>({x:6+(x-minX)/(maxX-minX)*88,y:5+(z-minZ)/(maxZ-minZ)*90});
 let selected="twinleaf",open=false;
 const svgNS="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(svgNS,"svg");svg.setAttribute("viewBox","0 0 1000 1000");svg.setAttribute("preserveAspectRatio","none");
 for(const [a,b,name] of routes){
   const p=project(cityById[a].x,cityById[a].z),q=project(cityById[b].x,cityById[b].z);
   const d="M "+p.x*10+" "+p.y*10+" Q "+((p.x+q.x)*5+(p.y-q.y)*.45)+" "+((p.y+q.y)*5-(p.x-q.x)*.45)+" "+q.x*10+" "+q.y*10;
   const path=document.createElementNS(svgNS,"path");
   path.setAttribute("d",d);path.setAttribute("stroke","#fff5d7");path.setAttribute("stroke-width","15");path.setAttribute("stroke-linecap","round");path.setAttribute("fill","none");path.setAttribute("opacity",".75");svg.append(path);
   const edge=document.createElementNS(svgNS,"path");
   edge.setAttribute("d",d);edge.setAttribute("stroke","#7fa4a0");edge.setAttribute("stroke-width","2");edge.setAttribute("stroke-dasharray","9 6");edge.setAttribute("fill","none");svg.append(edge);
 }
 container.appendChild(svg);
 const pins=new Map();
 for(const place of places){
   const p=project(place.x,place.z);
   const button=document.createElement("button");button.type="button";button.className="city-pin";
   button.style.left=p.x+"%";button.style.top=p.y+"%";
   button.innerHTML="<i></i><small></small>";
   button.querySelector("small").textContent=place.name.toUpperCase();
   button.title=place.name;
   button.addEventListener("click",()=>{selected=place.id;update();});
   container.append(button);pins.set(place.id,button);
 }
 const avatar=document.createElement("div");avatar.className="map-avatar";avatar.title="Tu posición";
 container.append(avatar);
 const medals=[
  {name:"Lignito",city:"oreburgh",icon:"◆"},{name:"Bosque",city:"eterna",icon:"❀"},
  {name:"Reliquia",city:"hearthome",icon:"☯"},{name:"Adoquín",city:"veilstone",icon:"✦"},
  {name:"Ciénaga",city:"pastoria",icon:"◈"},{name:"Mina",city:"canalave",icon:"✸"},
  {name:"Carámbano",city:"snowpoint",icon:"✧"},{name:"Faro",city:"sunyshore",icon:"ϟ"}
 ];
 const badges=document.getElementById("badgeList");
 for(const medal of medals){const el=document.createElement("div");el.className="badge-item";el.textContent=medal.icon;el.title="Medalla "+medal.name;el.dataset.city=medal.city;badges.append(el);}
 function update(){
   const s=getGameState(),place=cityById[selected];
   for(const [id,pin] of pins)pin.className="city-pin"+((s.visited||[]).includes(id)?" visited":"")+(selected===id?" selected":"");
   const position=project(s.pos.x,s.pos.z);
   avatar.style.left=position.x+"%";avatar.style.top=position.y+"%";
   $("mapRegionTitle").textContent=place.name;
   $("mapRegionDesc").textContent=place.desc;
   $("mapRegionKind").textContent=place.type==="snow"?"ZONA GLACIAL":place.type==="coastal"?"COSTA DE SINNOH":place.type==="mining"?"CIUDAD MINERA":place.type==="city"?"GRAN CIUDAD":"POBLACIÓN · SINNOH";
   const visit=(s.visited||[]).length;
   $("visitedCounter").textContent=String(visit).padStart(2,"0")+" / "+places.length;
   $("visitedBar").style.width=Math.min(100,visit/places.length*100)+"%";
   const total=(s.badges||[]).length;
   $("badgeCounter").textContent=total+" / 8";
   for(const el of badges.children)el.classList.toggle("earned",(s.badges||[]).includes(el.dataset.city));
 }
 function openMap(){
   const s=getGameState();
   if(s.pos){let nearest=places[0],dist=Infinity;for(const c of places){const d=Math.hypot(c.x-s.pos.x,c.z-s.pos.z);if(d<dist){dist=d;nearest=c;}}selected=nearest.id;}
   open=true;update();$("mapModal").classList.remove("hidden");
 }
 function closeMap(){open=false;$("mapModal").classList.add("hidden");}
 return {openMap,closeMap,update,get isOpen(){return open;}};
}