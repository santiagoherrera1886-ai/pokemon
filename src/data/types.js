// Los 18 tipos de Alborada, su tabla de efectividad y los estados alterados.
export const TYPES = {
  normal: { name: 'NORMAL', color: '#a8a090' },
  fuego: { name: 'FUEGO', color: '#f0802a' },
  agua: { name: 'AGUA', color: '#3e98dc' },
  planta: { name: 'PLANTA', color: '#5cb04c' },
  electrico: { name: 'ELÉCTRICO', color: '#e8b818' },
  hielo: { name: 'HIELO', color: '#6cc8e4' },
  lucha: { name: 'LUCHA', color: '#c8402a' },
  veneno: { name: 'VENENO', color: '#9a4ab8' },
  tierra: { name: 'TIERRA', color: '#c89a48' },
  volador: { name: 'VOLADOR', color: '#8aa8e8' },
  psiquico: { name: 'PSÍQUICO', color: '#e85a9a' },
  bicho: { name: 'BICHO', color: '#9ab830' },
  roca: { name: 'ROCA', color: '#b8a058' },
  fantasma: { name: 'FANTASMA', color: '#6a5aa8' },
  dragon: { name: 'DRAGÓN', color: '#6248d8' },
  siniestro: { name: 'SINIESTRO', color: '#5a4a5a' },
  acero: { name: 'ACERO', color: '#9aa4b8' },
  hada: { name: 'HADA', color: '#ec86c4' }
};
export const TYPE_ORDER = Object.keys(TYPES);

// Multiplicadores atacante -> defensor (lo que no aparece vale 1).
export const CHART = {
  normal: { roca: .5, fantasma: 0, acero: .5 },
  fuego: { fuego: .5, agua: .5, planta: 2, hielo: 2, bicho: 2, roca: .5, dragon: .5, acero: 2 },
  agua: { fuego: 2, agua: .5, planta: .5, tierra: 2, roca: 2, dragon: .5 },
  electrico: { agua: 2, electrico: .5, planta: .5, tierra: 0, volador: 2, dragon: .5 },
  planta: { fuego: .5, agua: 2, planta: .5, veneno: .5, tierra: 2, volador: .5, bicho: .5, roca: 2, dragon: .5, acero: .5 },
  hielo: { fuego: .5, agua: .5, planta: 2, hielo: .5, tierra: 2, volador: 2, dragon: 2, acero: .5 },
  lucha: { normal: 2, hielo: 2, veneno: .5, volador: .5, psiquico: .5, bicho: .5, roca: 2, fantasma: 0, siniestro: 2, acero: 2, hada: .5 },
  veneno: { planta: 2, veneno: .5, tierra: .5, roca: .5, fantasma: .5, acero: 0, hada: 2 },
  tierra: { fuego: 2, electrico: 2, planta: .5, veneno: 2, volador: 0, bicho: .5, roca: 2, acero: 2 },
  volador: { electrico: .5, planta: 2, lucha: 2, bicho: 2, roca: .5, acero: .5 },
  psiquico: { lucha: 2, veneno: 2, psiquico: .5, siniestro: 0, acero: .5 },
  bicho: { fuego: .5, planta: 2, lucha: .5, veneno: .5, volador: .5, psiquico: 2, fantasma: .5, siniestro: 2, acero: .5, hada: .5 },
  roca: { fuego: 2, hielo: 2, lucha: .5, tierra: .5, volador: 2, bicho: 2, acero: .5 },
  fantasma: { normal: 0, psiquico: 2, fantasma: 2, siniestro: .5 },
  dragon: { dragon: 2, acero: .5, hada: 0 },
  siniestro: { lucha: .5, psiquico: 2, fantasma: 2, siniestro: .5, hada: .5 },
  acero: { fuego: .5, agua: .5, electrico: .5, hielo: 2, roca: 2, acero: .5, hada: 2 },
  hada: { fuego: .5, lucha: 2, veneno: .5, dragon: 2, siniestro: 2, acero: .5 }
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType]?.[t] ?? 1), 1);
}

// Estados alterados: se quedan después del combate hasta curarlos (posada u objeto).
export const STATUS = {
  que: { name: 'QUEMADO', short: 'QUE', color: '#e8603a', immune: ['fuego'], verb: 'se quemó' },
  ven: { name: 'ENVENENADO', short: 'VEN', color: '#9a4ab8', immune: ['veneno', 'acero'], verb: 'quedó envenenado' },
  par: { name: 'PARALIZADO', short: 'PAR', color: '#d8aa10', immune: ['electrico'], verb: 'quedó paralizado' },
  dor: { name: 'DORMIDO', short: 'DOR', color: '#7a7a96', immune: [], verb: 'se quedó dormido' },
  con: { name: 'CONGELADO', short: 'CON', color: '#48b0d8', immune: ['hielo'], verb: 'quedó congelado' }
};
export function canGetStatus(id, types) { return !STATUS[id].immune.some(t => types.includes(t)); }

// Colores de partículas por tipo (y por estado) para las animaciones.
export const TYPE_FX = {
  normal: ['#ffffff', '#f8e8a8', '#e8d8c8'], fuego: ['#ff7a24', '#ffc838', '#ff4a20'], agua: ['#3e98dc', '#b4e4fa', '#ffffff'], planta: ['#5cb04c', '#a8e880', '#2f7a3a'],
  electrico: ['#ffe040', '#ffffff', '#f0b818'], hielo: ['#bff0ff', '#ffffff', '#6cc8e4'], lucha: ['#ff8a4a', '#ffffff', '#c8402a'], veneno: ['#b45ad8', '#e0a0f8', '#6a2a8a'],
  tierra: ['#c89a48', '#8a6a3a', '#e8c890'], volador: ['#ffffff', '#c8dcf8', '#9ab8e8'], psiquico: ['#ff6aa8', '#c8a0f0', '#ffffff'], bicho: ['#b8d840', '#e8f8a0', '#7a9a20'],
  roca: ['#a89070', '#6a5a46', '#c8b090'], fantasma: ['#8a6ae0', '#3a2c58', '#c8b0ff'], dragon: ['#7a5af8', '#40d0f0', '#f8c848'], siniestro: ['#3a2c48', '#7a5a8a', '#1a1622'],
  acero: ['#e8eef8', '#a8b4c8', '#ffffff'], hada: ['#ffb0e0', '#ffffff', '#f8d0f0'],
  que: ['#ff7a24', '#ffc838'], ven: ['#b45ad8', '#e0a0f8'], par: ['#ffe040', '#ffffff'], dor: ['#ffffff', '#c8c8e8'], con: ['#bff0ff', '#ffffff'], conf: ['#ffe060', '#ffffff']
};
