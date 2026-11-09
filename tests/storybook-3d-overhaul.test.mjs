import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFoliageGeometry,createFlowerGeometry} from '../src/render3d/storybook-foliage.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('storybook tree canopies are actual 3D mesh with planar UVs for renderer batching',()=>{
  const g=createFoliageGeometry(),p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
  assert.ok(p.count>=150,'volumetric toothed canopy needs multiple sculpted faces');
  assert.equal(n.count,p.count,'each leaf vertex must have its own surface normal');
  assert.equal(uv.count,p.count,'UV data is essential to batched mesh compatibility');
  assert.ok(g.boundingBox.max.y-g.boundingBox.min.y>1,'canopy has dimensional vertical height');
  assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>1,'canopy has true XYZ volume');
  assert.equal(g.userData.kind,'alborada-3d-foliage');
  g.dispose();
});
test('new geometric flowers have UVs, visible 3D petals, and work with the static mesh merger',()=>{
  const g=createFlowerGeometry();
  assert.ok(g.getAttribute('position').count>=50);
  assert.equal(g.getAttribute('normal').count,g.getAttribute('uv').count);
  g.dispose();
});
test('Corola material, building and camera changes live in real 3D scene code',()=>{
  const env=read('src/render3d/environment.js'),models=read('src/render3d/models.js'),c=read('src/render3d/camera.js');
  assert.match(env,/makeStorybookTextures\(resources\)/);
  for(const kind of ['grass','road','sidewalk','path','tile','stone'])assert.match(read('src/render3d/storybook-textures.js'),new RegExp("type==='"+kind+"'"));
  assert.match(env,/r\.geometries\.foliage/);
  assert.match(env,/r\.geometries\.bloomFlower/);
  assert.match(models,/bruma-storybook-silhouette/);
  assert.match(models,/bruma-architecture/);
  assert.match(models,/sculpted|ceramic roof|shingles/);
  assert.match(c,/const PITCH = 43/);
  assert.doesNotMatch(models,/Tejas en franjas gruesas y redondeadas/);
});
