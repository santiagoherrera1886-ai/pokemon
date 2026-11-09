// Estado de la partida y guardado local (localStorage), con tres ranuras. El respaldo opcional en GitHub
// está en cloud.js; si no se conecta, nada sale del navegador.
import { defaultAvatar, cleanAvatar } from '../data/avatar.js';

export const SLOTS = [1, 2, 3];
const BASE = 'alborada-save-v1';
const keyOf = slot => slot === 1 ? BASE : `${BASE}-s${slot}`;     // la ranura 1 conserva la clave de siempre

export function newState(name = 'Santi', avatar = defaultAvatar(), slot = 1) {
  return {
    version: 1,
    slot,
    name,
    avatar: cleanAvatar(avatar),
    map: 'cuarto', x: 2, y: 4, dir: 0,
    story: 0,
    flags: {},
    party: [],
    box: [],
    badges: [],
    dex: {},
    visited: {},
    bag: { capsula: 0, tonico: 1, supertonico: 0, despertar: 0 },
    money: 3000,
    shoes: false,
    lastHeal: { map: 'casa1', x: 5, y: 6 },
    playTime: 0,
    savedAt: 0,
    options: { perspective: true, textSpeed: 2, autosave: true }
  };
}

// Convierte lo que venga (localStorage, archivo, GitHub) en un estado válido, o null.
export function parseState(raw, slot) {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!s || s.version !== 1 || typeof s.map !== 'string') return null;
    const st = Object.assign(newState(), s);
    st.avatar = cleanAvatar(s.avatar);
    st.options = Object.assign(newState().options, s.options || {});
    if (slot) st.slot = slot; else if (!SLOTS.includes(st.slot)) st.slot = 1;
    return st;
  } catch { return null; }
}

export function hasSave(slot) {
  try { return slot ? !!localStorage.getItem(keyOf(slot)) : SLOTS.some(n => !!localStorage.getItem(keyOf(n))); } catch { return false; }
}

export function loadState(slot = 1) {
  try { const raw = localStorage.getItem(keyOf(slot)); return raw ? parseState(raw, slot) : null; } catch { return null; }
}

// Resumen de las ranuras ocupadas (para el título y el menú de partidas).
export function listSaves() {
  return SLOTS.map(slot => { const st = loadState(slot); return st && { slot, name: st.name, badges: st.badges.length, playTime: st.playTime, map: st.map, savedAt: st.savedAt || 0, avatar: st.avatar, story: st.story }; }).filter(Boolean);
}

export function saveState(st, { touch = true } = {}) {
  try {
    if (!SLOTS.includes(st.slot)) st.slot = 1;
    if (touch) st.savedAt = Date.now();
    localStorage.setItem(keyOf(st.slot), JSON.stringify(st)); return true;
  } catch { return false; }
}

// Escribe una partida tal cual (por ejemplo la que llega de GitHub o de un archivo) en una ranura.
export function storeState(st, slot) {
  const parsed = parseState(st, slot); if (!parsed) return false;
  return saveState(parsed, { touch: false });
}

export function eraseSave(slot = 1) { try { localStorage.removeItem(keyOf(slot)); } catch { /* sin almacenamiento */ } }

export function firstFreeSlot() { return SLOTS.find(n => !hasSave(n)) || null; }

// Tiempo jugado (en cuadros de 60 Hz) como "2 h 05 min".
export function playTimeText(frames = 0) {
  const min = Math.floor(frames / 3600), h = Math.floor(min / 60);
  return h ? `${h} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`;
}
