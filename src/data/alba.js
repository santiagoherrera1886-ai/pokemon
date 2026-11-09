// Forma Alba: la transformación de Alborada. Con el Brazalete Alba, una vez por combate, una criatura despierta
// la luz del amanecer: crece, brilla y sube su Ataque, su Defensa y su Velocidad hasta que termina el combate.
// Todas las especies la tienen; el aspecto cambia según su tipo (corona, halo, cristales o llamas de alba).
export const ALBA_ITEM = 'brazaleteAlba';
export const ALBA_MULT = { atk: 1.3, def: 1.2, spe: 1.2 };
export const ALBA_COLOR = '#ffd77a';

export const hasAlbaBand = st => (st?.bag?.[ALBA_ITEM] || 0) > 0;
// Estadística efectiva en combate (la Forma Alba multiplica; las demás reglas se aplican aparte).
export const albaStat = (c, k) => c.stats[k] * (c.alba ? (ALBA_MULT[k] || 1) : 1);
export const albaName = c => `${c.name} Alba`;
// Al terminar el combate todas vuelven a su forma normal.
export function clearAlba(party) { for (const c of party || []) if (c && c.alba) delete c.alba; }
