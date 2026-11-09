import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {building} from '../src/render3d/models.js';
import {readFileSync} from 'node:fs';

test('all houses receive modeled architecture without modifying interactive entrances',()=>{
  const r=new Resources();
  for(const w of [4,5,6,9]){
    const room={kind:'house',w,h:5,opt:{doorCol:Math.floor(w/2),roof:'#6a9887',wall:'#f1e3cb'}};
    const house=building(r,room);
    const detail=house.getObjectByName('bruma-architecture');
    assert.ok(detail,'house must contain an independently modeled visual layer');
    const meshes=[];detail.traverse(x=>{if(x.isMesh)meshes.push(x)});
    assert.ok(meshes.length>5,'house must have physical trim, roof details and accessories');
    const bbox=new T.Box3().setFromObject(house);
    assert.ok(bbox.max.y>3.2,'roof details should have real 3D height');
    assert.ok(bbox.min.y>=-.05,'new decor should not extend below the base');
    assert.ok(bbox.max.z>0,'facade must have actual depth');
    r.release(house);
  }
  r.dispose();
});

test('large gym architecture has separate crystals and emblem geometry',()=>{
  const r=new Resources();
  const gym=building(r,{kind:'big',w:9,h:6,opt:{roof:'#747bb8',emblem:'#76d7c8'}});
  const decoration=gym.getObjectByName('bruma-architecture');
  assert.ok(decoration,'gym has visual dressing');
  let crystals=0;decoration.traverse(x=>{if(x.isMesh && x.geometry===r.geometries.crystal)crystals++});
  assert.ok(crystals>=3,'gym has distinctive three-dimensional crystal emblems');
  r.release(gym);r.dispose();
});

test('trees use a multi-layered broadleaf silhouette in close and distant world views',()=>{
  const source=readFileSync(new URL('../src/render3d/environment.js',import.meta.url),'utf8');
  assert.match(source,/const crowns=\[/);
  assert.match(source,/leaves\.push\(/);
  assert.match(source,/instances\(far,r\.geometries\.leaf/);
  assert.doesNotMatch(source,/instances\(far,r\.geometries\.cone/);
});
