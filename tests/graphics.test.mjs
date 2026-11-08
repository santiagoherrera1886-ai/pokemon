import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMaps} from '../src/world/maps.js';
import {actorPosition,visibleMapIds,QUALITY,normalizeQuality} from '../src/render3d/policy.js';
import {Graphics} from '../src/core/graphics.js';
import {newState,loadState,saveState} from '../src/core/state.js';

test('all 37 maps retain valid bidirectional door and stair destinations',()=>{
  const maps=buildMaps();assert.equal(Object.keys(maps).length,37);
  for(const map of Object.values(maps))for(const warp of map.warps){
    assert.ok(maps[warp.to],`${map.id} -> ${warp.to}`);
    assert.ok(warp.tx>=0 && warp.tx<maps[warp.to].w && warp.ty>=0 && warp.ty<maps[warp.to].h);
    assert.ok(maps[warp.to].warps.some(back=>back.to===map.id),`return from ${warp.to}`);
  }
});
test('3D coordinates preserve interpolated tile positions and connected map origins',()=>{
  const maps=buildMaps();
  assert.deepEqual(actorPosition({px:32,py:64},maps.cuarto),{x:2.5,z:4.5});
  assert.deepEqual(actorPosition({px:16*19,py:16*15},maps.sendero1),{x:11.5,z:-.5});
  const before=actorPosition({px:16*11,py:-8},maps.brisal);
  const after=actorPosition({px:16*19,py:16*15.5},maps.sendero1);
  assert.deepEqual(before,after,'crossing map seams cannot jump the camera');
});
test('indoor loading is isolated and outdoor loading is bounded by view distance',()=>{
  const maps=buildMaps(),world={outdoor:Object.values(maps).filter(m=>m.outdoor)};
  assert.deepEqual(visibleMapIds(world,maps.cuarto,{x:3,z:4},21),['cuarto']);
  const ids=visibleMapIds(world,maps.brisal,{x:5,z:15},15);
  assert.ok(ids.includes('brisal'));assert.ok(!ids.includes('arenal'));assert.ok(!ids.includes('lago'));
  assert.equal(normalizeQuality('invalid'),'medium');assert.equal(QUALITY.low.shadow,0);
});
test('graphics switching never changes the game state or legacy save bytes',async()=>{
  const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};globalThis.matchMedia=()=>({matches:false});
  const state=newState('Santi');state.story=12;state.map='liga';state.money=1900;state.bag.capsula=6;state.badges=['hoja','roca','marea'];state.flags.nicoLiga=true;state.visited.marea=true;state.dex.espejalba=2;saveState(state);
  const saved=store.get('alborada-save-v1'),before=JSON.stringify(state),g=new Graphics({state});
  g.engine={lost:false,setVisible(){},setQuality(){}};
  for(let i=0;i<12;i++){await g.setMode(i%2?'premium':'classic');g.setQuality(['low','medium','high'][i%3]);}
  assert.equal(JSON.stringify(state),before);assert.equal(store.get('alborada-save-v1'),saved);
  assert.deepEqual(loadState(),state);assert.ok(store.has('alborada-graphics-v1'));
});
