import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {creatureModel} from '../src/render3d/creatures3d.js';
import {SPECIES} from '../src/data/creatures.js';
import {setAlba} from '../src/render3d/alba.js';
import {person} from '../src/render3d/people.js';
import { PREMIUM_STARTER_IDS } from '../src/render3d/starter-evolutions.js';

test('Every creature is now a volumetric 3D pixel sculpture, not a 2D billboard',()=>{
 const r=new Resources();
 for(const id of Object.keys(SPECIES)){
  const model=creatureModel(r,id);
  const mesh=model.userData.body;
  if(PREMIUM_STARTER_IDS.includes(id)){
    assert.equal(mesh.geometry.userData.starterSculpt3D,true,id+' needs unique smooth volumetric sculpt');
    assert.equal(model.userData.starterFamily3D,id,'native starter model must be used in game');
    assert.equal(model.userData.eyes.length,2,'starter eyes remain animated');
  }else{
    assert.equal(mesh.geometry.userData.retroVoxel,true,id+' should have a 3D voxel body');
    assert.equal(mesh.geometry.index,null,id+' should use exposed square voxel faces');
  }
  assert.ok(mesh.geometry.getAttribute('position').count>100,id+' should have actual volumetric faces');
  assert.ok(mesh.geometry.getAttribute('normal').count>100,id+' should have 3D normals');
  assert.ok(mesh.geometry.boundingBox.max.x>mesh.geometry.boundingBox.min.x,id+' x volume');
  assert.ok(mesh.geometry.boundingBox.max.z>mesh.geometry.boundingBox.min.z,id+' z volume');
  assert.ok(model.children.some(obj=>obj.isMesh && obj.material.side===T.BackSide),id+' must have 3D ink outlines');
  r.release(model);
 }
 r.dispose();
});

test('Forma Alba alters the 3D silhouette with crystal spines instead of only a color filter',()=>{
 const r=new Resources();
 for(const id of ['brotelo','brasin','charquin','espejalba']){
  const model=creatureModel(r,id);
  const rig={model,root:model,sp:id};
  setAlba(r,rig,true,SPECIES[id].types);
  assert.ok(rig.albaFx.visible);
  const crest=rig.albaFx.getObjectByName('alba-retro-spines');
  assert.ok(crest?.children.length>=6,id+' should have 3D crystals');
  setAlba(r,rig,false,SPECIES[id].types);
  assert.equal(rig.albaFx.visible,false);
  r.release(rig.root);
 }
 r.dispose();
});

test('Human characters use real cuboid head geometry',()=>{
 const r=new Resources();r.shadow=(root)=>{const shadow=new T.Group();root.add(shadow);return shadow;};const m=person(r,'player');
 const parts=[];m.root.traverse(o=>{if(o.isMesh)parts.push(o)});
 assert.ok(parts.length>0);
 assert.ok(parts.some(o=>o.geometry.type==='BufferGeometry' && o.geometry.attributes.position.count>=20));
 assert.ok(m.head, 'character animation rig remains available');
 r.release(m.root);r.dispose();
});
