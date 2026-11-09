import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {person} from '../src/render3d/people.js';
import {LOOKS} from '../src/art/characters.js';
import {buildMaps} from '../src/world/maps.js';
import {dressWorld,dressBattle,VISUAL_ROLE_IDS,BRUMA_ART_PALETTE} from '../src/render3d/art-direction.js';

test('all named human characters have unique 3D dimensional costume geometry',()=>{
 const r=new Resources();r.shadow=()=>new T.Group();
 assert.deepEqual([...VISUAL_ROLE_IDS].sort(),Object.keys(LOOKS).sort());
 for(const role of VISUAL_ROLE_IDS){
  const rig=person(r,role);
  const outfit=rig.body.getObjectByName('bruma-persona-'+role);
  const face=rig.head.getObjectByName('bruma-head-'+role);
  assert.ok(outfit && face,role+' should have its own 3D custom outfit and head treatment');
  assert.ok(outfit.children.length>0,role+' outfit geometry missing');
  assert.ok(face.children.length>0,role+' head details missing');
  const meshes=[];rig.root.traverse(x=>{if(x.isMesh)meshes.push(x)});
  assert.ok(meshes.length>8,role+' should be a real volumetric animated model');
  assert.ok(rig.limbs.length===4,role+' arm and leg rig preserved');
  assert.ok(rig.eyes,role+' blink rig preserved');
  r.release(rig.root);
 }
 r.dispose();
});

test('every existing map has a matching original 3D art treatment without mutating collision',()=>{
 const maps=buildMaps();const entries=Object.values(maps),r=new Resources();
 assert.ok(entries.length>=30,'all existing towns, routes and interiors should be present');
 let outdoor=0,interior=0;
 for(const map of entries){
  const before=JSON.stringify({tiles:map.tiles,objects:map.objects,warps:map.warps});
  const root=new T.Group(),meta=dressWorld(r,root,map);
  assert.equal(meta.outdoor,!!map.outdoor,map.id+' biome mismatch');
  assert.ok(root.children.length>0,map.id+' lacks map-specific art');
  assert.equal(JSON.stringify({tiles:map.tiles,objects:map.objects,warps:map.warps}),before,map.id+' modified gameplay or collision');
  if(map.outdoor)outdoor++;else interior++;
  r.release(root);
 }
 assert.ok(outdoor>=8);assert.ok(interior>=8);
 r.dispose();
});

test('all eight battle terrain archetypes receive a stylized physical 3D arena',()=>{
 const r=new Resources();
 for(const terrain of ['grass','lake','cave','beach','mountain','gym','eclipse','league']){
  const arena=new T.Group(),ret=dressBattle(r,arena,terrain);
  assert.equal(ret,arena);
  const meshes=[];arena.traverse(x=>{if(x.isMesh)meshes.push(x)});
  assert.ok(meshes.length>30,terrain+' lacks detailed 3D battle geometry');
  const extents=new T.Box3().setFromObject(arena);
  assert.ok(extents.max.x-extents.min.x>10,terrain+' arena too small');
  assert.ok(extents.max.y>1,terrain+' has no actual 3D depth');
  r.release(arena);
 }
 assert.equal(BRUMA_ART_PALETTE.ink,'#29233f');
 r.dispose();
});
