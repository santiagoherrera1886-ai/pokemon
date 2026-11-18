import * as T from 'three';
import {LOOKS} from '../art/characters.js';
import {actorPosition} from './policy.js';
import {creatureModel,ALL_SPECIES} from './creatures3d.js';
import {person,animatePerson} from './people.js';
// Todas las especies con modelo esculpido (las de la historia y el bestiario de la Bruma).
export const MODEL_SPECIES=ALL_SPECIES;

// Personajes: ver people.js (diseño chibi). Se mantienen estos nombres para el resto del motor.
export function character(r, look='player') { return person(r, look); }
export function animateCharacter(rig, actor, map, time, dt, talking=false) { animatePerson(rig, actorPosition(actor,map), actor, time, dt, talking); }

// Silueta del protagonista (y de su pareja) cuando un árbol, una casa o un mueble lo tapa. Se dibuja sólo donde hay
// algo delante (prueba de profundidad invertida) y antes que el propio muñeco, así no se pinta encima de sí mismo.
// El piso y el pasto se dibujan después (renderOrder 3 en environment.js), por eso no cuentan como estorbo.
let XRAY=null;
export function addXray(rig){
  XRAY??=new T.MeshBasicMaterial({color:'#7e9ee8',depthWrite:false,depthFunc:T.GreaterDepth,fog:false});
  const list=[];rig.root.traverse(m=>{if(m.isMesh&&!m.material.transparent&&!m.userData.xray)list.push(m);});
  for(const m of list){const x=new T.Mesh(m.geometry,XRAY);x.userData.xray=true;x.renderOrder=1;x.castShadow=x.receiveShadow=false;m.add(x);m.renderOrder=2;}
  rig.xray=true;return rig;
}

// Criaturas con acabado de figura (creatures3d.js). Devuelve también los ojos para que parpadeen en combate.
export function creature(r,sp) {
  if(!MODEL_SPECIES.includes(sp))throw new Error(`Especie sin modelo: ${sp}`);
  const root=new T.Group(),model=creatureModel(r,sp);root.add(model);
  r.shadow(root,0,0,1.7,1.25);
  return {root,model,sp,eyes:model.userData.eyes||[]};
}
