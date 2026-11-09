import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {building} from '../src/render3d/models.js';
import {DioramaCamera} from '../src/render3d/camera.js';
import {MODEL_SPECIES} from '../src/render3d/actors.js';
import {storyCreature,STORY_SPECIES} from '../src/render3d/story-creatures.js';
import {SPECIES} from '../src/data/creatures.js';
import {buildMaps} from '../src/world/maps.js';

test('house roof is visible to rays arriving from above on both slopes',()=>{
  const r=new Resources();
  const house=building(r,{kind:'house',w:5,h:4,opt:{}});
  house.updateMatrixWorld(true);
  const roof=house.children.find(m=>m.userData.ownedGeometry);
  for(const z of [.7,2.7]){
    const ray=new T.Raycaster(new T.Vector3(2.5,6,z),new T.Vector3(0,-1,0));
    const hits=ray.intersectObject(roof);
    assert.ok(hits.length>0,'roof must not be culled from above');
    assert.ok(hits[0].point.y>2.16);
  }
  r.release(house);r.dispose();
});

test('small interior floors and back walls fit within the elevated camera',()=>{
  const rig=new DioramaCamera();
  for(const map of Object.values(buildMaps()).filter(m=>!m.outdoor&&!m.dark&&m.h<=12)){
    rig.update(map,{x:0,z:0},1/60);
    rig.camera.updateMatrixWorld(true);
    for(const x of [0,map.w])for(const [y,z] of [[0,2],[0,map.h],[2.35,1.5]]){
      const screen=new T.Vector3(x,y,z).project(rig.camera);
      assert.ok(Math.abs(screen.x)<1 && Math.abs(screen.y)<1,`${map.id}: room edge clipped`);
    }
  }
});

test('every full-story species has an explicit 3D model',()=>{
  assert.deepEqual([...MODEL_SPECIES].sort(),Object.keys(SPECIES).sort());
  const r=new Resources();
  for(const sp of STORY_SPECIES){const model=storyCreature(r,sp);assert.ok(model.children.some(m=>m.isMesh));const bounds=new T.Box3().setFromObject(model);assert.ok(bounds.max.y>1 && bounds.max.y<2.5,sp);r.release(model);}
  r.dispose();
});

test('every species has classic sprites and the Bruma bestiary has sculpted models with a head anchor',async()=>{
  const {creatureModel,ALL_SPECIES}=await import('../src/render3d/creatures3d.js');
  const {BRUMA}=await import('../src/render3d/bestiary.js');
  const {ATLAS_SPECIES}=await import('../src/art/bruma-sprites.js');
  assert.deepEqual([...ATLAS_SPECIES].sort(),Object.keys(SPECIES).sort(),'el atlas de sprites está desactualizado: corre node scripts/sprites.cjs');
  assert.deepEqual([...ALL_SPECIES].sort(),Object.keys(SPECIES).sort());
  const r=new Resources();
  for(const sp of Object.keys(BRUMA)){
    const model=creatureModel(r,sp),bounds=new T.Box3().setFromObject(model);
    assert.ok(model.userData.body?.isMesh,`${sp}: cuerpo`);
    assert.ok(model.userData.head?.top,`${sp}: ancla de la cabeza`);
    assert.ok(bounds.max.y>.6&&bounds.max.y<2.5,`${sp}: alto ${bounds.max.y.toFixed(2)}`);
    r.release(model);
  }
  r.dispose();
});

test('Forma Alba overlay attaches to any creature and toggles its glow',async()=>{
  const {creatureModel}=await import('../src/render3d/creatures3d.js');
  const {setAlba}=await import('../src/render3d/alba.js');
  const r=new Resources();
  for(const sp of ['brotelo','espejalba','nivalord','dracalba']){
    const model=creatureModel(r,sp),rig={model,root:model,sp},before=model.userData.body.material;
    setAlba(r,rig,true,SPECIES[sp].types);
    assert.ok(rig.albaFx.visible&&rig.albaFx.children.length>3,sp);
    assert.notEqual(rig.model.userData.body.material,before);
    setAlba(r,rig,false,SPECIES[sp].types);
    assert.equal(rig.albaFx.visible,false);assert.equal(rig.model.userData.body.material,before);
    r.release(rig.root);
  }
  r.dispose();
});
