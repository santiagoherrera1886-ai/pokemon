import * as T from 'three';
import {LOOKS} from '../art/characters.js';
import {actorPosition} from './policy.js';
import {STORY_SPECIES} from './story-creatures.js';
import {creatureModel} from './creatures3d.js';
import {person,animatePerson} from './people.js';
export const MODEL_SPECIES=['brotelo','brasin','charquin','pipiu','roedin','capullin',...STORY_SPECIES];

// Personajes: ver people.js (diseño chibi). Se mantienen estos nombres para el resto del motor.
export function character(r, look='player') { return person(r, look); }
export function animateCharacter(rig, actor, map, time, dt, talking=false) { animatePerson(rig, actorPosition(actor,map), actor, time, dt, talking); }

// Criaturas con acabado de figura (creatures3d.js). Devuelve también los ojos para que parpadeen en combate.
export function creature(r,sp) {
  if(!MODEL_SPECIES.includes(sp))throw new Error(`Especie sin modelo: ${sp}`);
  const root=new T.Group(),model=creatureModel(r,sp);root.add(model);
  r.shadow(root,0,0,1.7,1.25);
  return {root,model,sp,eyes:model.userData.eyes||[]};
}
