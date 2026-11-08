// Pure conversions: one existing 16 px tile is one world unit. No gameplay writes.
export const QUALITY = {
  low: {label: 'BAJA', scale: 1, maxPixels: 640, shadow: 0, particles: 16, radius: 15},
  medium: {label: 'MEDIA', scale: 1.35, maxPixels: 960, shadow: 1024, particles: 40, radius: 18},
  high: {label: 'ALTA', scale: 1.75, maxPixels: 1440, shadow: 2048, particles: 72, radius: 21}
};
export const normalizeQuality = value => Object.hasOwn(QUALITY, value) ? value : 'medium';
export function actorPosition(actor, map) {
  const origin = map.outdoor ? map.origin : [0, 0];
  return {x: origin[0] + actor.px / 16 + 0.5, z: origin[1] + actor.py / 16 + 0.5};
}
export function mapDistance(map, x, z) {
  const [ox, oz] = map.origin || [0, 0];
  return Math.hypot(Math.max(ox - x, 0, x - ox - map.w), Math.max(oz - z, 0, z - oz - map.h));
}
export function visibleMapIds(world, current, position, radius) {
  if (!current.outdoor) return [current.id];
  return world.outdoor.filter(m => mapDistance(m, position.x, position.z) < radius).map(m => m.id);
}
export function defaultQuality() {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'low' : 'medium';
}
