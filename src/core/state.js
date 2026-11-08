// Estado de la partida y guardado local (localStorage). No se envía nada a ningún servidor.
const KEY = 'alborada-save-v1';

export function newState(name = 'Santi') {
  return {
    version: 1,
    name,
    map: 'cuarto', x: 2, y: 4, dir: 0,
    story: 0,
    flags: {},
    party: [],
    bag: { capsula: 0, tonico: 1, supertonico: 0, despertar: 0 },
    money: 3000,
    shoes: false,
    lastHeal: { map: 'casa1', x: 5, y: 6 },
    playTime: 0,
    options: { perspective: true, textSpeed: 2 }
  };
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.version === 1 ? Object.assign(newState(), s) : null;
  } catch { return null; }
}

export function saveState(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch { return false; }
}

export function eraseSave() { try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } }
