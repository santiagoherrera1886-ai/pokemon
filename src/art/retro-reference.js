// Inventario de 43 ilustraciones originales extraídas de las diez láminas aprobadas.
// Orden = orden de las celdas 32×32 del atlas (8 columnas).
// No contiene especies nuevas ni altera los ID de las partidas existentes.
export const RETRO_IDS = Object.freeze([
  'brasin','brason','volcarbon','charquin','charcomar','mareon','brotelo','brotoso',
  'bosqueron','chispaz','voltaz','magmol','magmor','magmatron','ferlum','ferrox',
  'acerion','nivalin','nivalmar','nivalord','truenin','tormavis','elestrix','verdilago',
  'foliaton','arborex','sierpin','serpentil','cobrumbra','setin','seton','capullin',
  'capullado','alasol','michin','mistigato','orbelina','fatuin','candelo','velaria',
  'cuarcin','cuarzon','astrocuarzo'
]);
export const RETRO_INDEX = new Map(RETRO_IDS.map((id,i)=>[id,i]));
export const RETRO_ATLAS = {
  url: new URL('./retro-reference.png',import.meta.url).href,
  size: 32,
  cols: 8,
  rows: 6
};
export const hasRetroReference=id=>RETRO_INDEX.has(id);
