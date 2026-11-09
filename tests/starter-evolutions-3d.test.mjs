import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/render3d/resources.js';
import {creatureModel} from '../src/render3d/creatures3d.js';
import {STARTER_EVOLUTIONS,PREMIUM_STARTER_IDS} from '../src/render3d/starter-evolutions.js';
import {STARTERS,SPECIES} from '../src/data/creatures.js';
import {readFileSync} from 'node:fs';

const families=[
 ['brotelo','brotoso','bosqueron'],
 ['brasin','brason','volcarbon'],
 ['charquin','charcomar','mareon']
];

test('the three playable starter families have all nine real sculpted 3D evolutions',()=>{
 assert.deepEqual([...STARTERS],families.map(f=>f[0]));
 assert.equal(PREMIUM_STARTER_IDS.length,9);
 assert.deepEqual([...PREMIUM_STARTER_IDS].sort(),families.flat().sort());
 const r=new Resources();
 for(const family of families){
   const sizes=[];
   for(const sp of family){
     assert.equal(typeof STARTER_EVOLUTIONS[sp],'function');
     assert.ok(SPECIES[sp],sp);
     const model=creatureModel(r,sp);
     const body=model.userData.body;
     assert.equal(model.userData.starterFamily3D,sp,sp+' must use new 3D model');
     assert.equal(body.geometry.userData.starterSculpt3D,true,sp+' must not be a 2D portrait');
     assert.ok(body.geometry.attributes.position.count>200,sp+' body must have 3D geometry');
     assert.ok(body.geometry.attributes.normal.count>200,sp+' must be lit by the 3D renderer');
     assert.ok(model.userData.eyes.length===2,sp+' eyes still blink');
     const bound=new T.Box3().setFromObject(model);
     assert.ok(bound.max.y>0.9&&bound.max.y<2.5,sp+' must fit combat camera');
     assert.ok(bound.max.z-bound.min.z>.7,sp+' must have 3D depth');
     assert.ok(model.children.some(x=>x.isMesh&&x.material.side===T.BackSide),sp+' needs 3D contour');
     sizes.push(bound.max.y);
     r.release(model);
   }
   assert.ok(sizes[2]>sizes[0]*1.25,'final '+family[2]+' must grow visibly');
   assert.equal(SPECIES[family[0]].evo?.[0]??SPECIES[family[0]].evolvesTo?.[0],family[1]);
 }
 r.dispose();
});

test('title shows the actual 3D starter models and three evolution-stage controls',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const title=readFileSync(new URL('../src/render3d/title.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../retro-bruma.css',import.meta.url),'utf8');
 assert.match(html,/id="starter-stages"/);
 for(const stage of [0,1,2])assert.match(html,new RegExp('data-stage="'+stage+'"'));
 assert.match(title,/setStarterStage\(next\)/);
 assert.match(title,/this\.families\s*=\s*\[\['brotelo','brotoso','bosqueron'\]/);
 assert.match(css,/body\.at-title\.premium-active #retro-starters\{display:none!important\}/);
});
