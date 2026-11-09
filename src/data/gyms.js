// Los ocho gimnasios de Alborada, en el orden del viaje: medalla, tipo, ciudad, líder, regalo y el
// siguiente destino. La Liga pide las ocho medallas.
export const GYMS = [
  { badge: 'hoja', name: 'Hoja', type: 'planta', color: '#5cb04c', city: 'Ciudad Corola', map: 'corola', leader: 'Hiedra', who: 'la líder Hiedra', gift: ['supertonico', 2], story: 7, next: 'Pueblo Cobre (Ruta 3 y Cueva Eco)' },
  { badge: 'roca', name: 'Roca', type: 'roca', color: '#b8a058', city: 'Pueblo Cobre', map: 'cobre', leader: 'Basalto', who: 'el líder Basalto', gift: ['supercapsula', 3], story: 8, next: 'Ciudad Marea (Ruta 4)' },
  { badge: 'marea', name: 'Marea', type: 'agua', color: '#3e98dc', city: 'Ciudad Marea', map: 'marea', leader: 'Coral', who: 'la líder Coral', gift: ['hipertonico', 2], story: 9, next: 'la bodega del Equipo Eclipse' },
  { badge: 'chispa', name: 'Chispa', type: 'electrico', color: '#f0c820', city: 'Ciudad Voltio', map: 'voltio', leader: 'Centella', who: 'la líder Centella', gift: ['hipercapsula', 3], next: 'Pueblo Niebla (Ruta 7)' },
  { badge: 'sombra', name: 'Sombra', type: 'fantasma', color: '#8a6ad0', city: 'Pueblo Niebla', map: 'niebla', leader: 'Velia', who: 'la líder Velia', gift: ['velaDeNiebla', 1], next: 'Villa Cafetal (Ruta 8)' },
  { badge: 'puno', name: 'Puño', type: 'lucha', color: '#e06040', city: 'Villa Cafetal', map: 'cafetal', leader: 'Tinto', who: 'Don Tinto', gift: ['vendaDeCampeon', 1], next: 'Ciudad Escarcha (Ruta 9)' },
  { badge: 'escarcha', name: 'Escarcha', type: 'hielo', color: '#8ad8f0', city: 'Ciudad Escarcha', map: 'escarcha', leader: 'Nevada', who: 'la líder Nevada', gift: ['tonicoMax', 2], next: 'Ciudad Albor (Ruta 10)' },
  { badge: 'escama', name: 'Escama', type: 'dragon', color: '#6a5ae0', city: 'Ciudad Albor', map: 'albor', leader: 'Sabino', who: 'el maestro Sabino', gift: ['escamaAntigua', 1], next: 'la Liga Alborada (Ruta 11 y Ruta 5)' }
];
export const LEAGUE_BADGES = GYMS.length;
export const BADGE_IDS = GYMS.map(g => g.badge);
export const gymOf = badge => GYMS.find(g => g.badge === badge);
export const hasBadge = (st, b) => (st.badges || []).includes(b);
export const badgeCount = st => BADGE_IDS.filter(b => hasBadge(st, b)).length;
// Siguiente gimnasio por ganar en orden, o null si ya tiene las ocho medallas.
export const nextGym = st => GYMS.find(g => !hasBadge(st, g.badge)) || null;
// Abierta con las ocho medallas después del Lago Espejo; quien ya es campeón (partidas viejas) la conserva.
export const leagueOpen = st => (st.story || 0) >= 12 || ((st.story || 0) >= 11 && badgeCount(st) >= LEAGUE_BADGES);
