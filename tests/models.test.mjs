import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {building} from '../src/render3d/models.js';
import {DioramaCamera} from '../src/render3d/camera.js';
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

test('all interior floors and back walls fit within the elevated camera',()=>{
  const rig=new DioramaCamera();
  for(const map of Object.values(buildMaps()).filter(m=>!m.outdoor)){
    rig.update(map,{x:0,z:0},1/60);
    rig.camera.updateMatrixWorld(true);
    for(const x of [0,map.w])for(const [y,z] of [[0,2],[0,map.h],[2.35,1.5]]){
      const screen=new T.Vector3(x,y,z).project(rig.camera);
      assert.ok(Math.abs(screen.x)<1 && Math.abs(screen.y)<1,`${map.id}: room edge clipped`);
    }
  }
});
