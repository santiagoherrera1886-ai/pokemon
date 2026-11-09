import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RETRO_IDS,RETRO_INDEX,RETRO_ATLAS,hasRetroReference} from '../src/art/retro-reference.js';
import {SPECIES} from '../src/data/creatures.js';

const here=new URL('../src/art/retro-raw/',import.meta.url);
test('43 illustration ids are unique and match actual game species',()=>{
  assert.equal(RETRO_IDS.length,43);
  assert.equal(new Set(RETRO_IDS).size,RETRO_IDS.length);
  for(const [index,id] of RETRO_IDS.entries()){
    assert.ok(SPECIES[id],id+' must exist in bestiary');
    assert.equal(RETRO_INDEX.get(id),index);
    assert.equal(hasRetroReference(id),true);
  }
  assert.equal(hasRetroReference('a_nonexistent_species'),false);
});
test('retro atlas is verified, lossless PNG from the approved concept art',()=>{
  const raw=[0,1,2,3].map(i=>readFileSync(new URL(i+'.b64',here),'utf8').trim()).join('');
  const png=Buffer.from(raw,'base64');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),256);
  assert.equal(png.readUInt32BE(20),192);
  assert.equal(RETRO_ATLAS.size,32);
  assert.equal(RETRO_ATLAS.cols*RETRO_ATLAS.rows*RETRO_ATLAS.size*RETRO_ATLAS.size >= RETRO_IDS.length*32*32,true);
  assert.equal(createHash('sha256').update(png).digest('hex'),'bbd65fb805c2caab38e70b84a55c66ae49858a0680f992d909bdb51d6245fb42');
});
