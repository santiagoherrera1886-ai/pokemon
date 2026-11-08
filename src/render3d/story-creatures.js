import { creatureModel } from './creatures3d.js';

export const STORY_SPECIES=['brotoso','bosqueron','brason','volcarbon','charcomar','mareon','pipiolo','roedon','capullado','alasol','setin','seton','chispaz','voltaz','guijarrin','penon','medusin','meduson','sombrin','sombrador','mentelin','espejalba'];

// Los modelos viven en creatures3d.js (acabado de figura); esto queda para quien construya sólo especies de la historia.
export function storyCreature(r,sp){
  if(!STORY_SPECIES.includes(sp))throw new Error(`Especie sin modelo: ${sp}`);
  return creatureModel(r,sp);
}
