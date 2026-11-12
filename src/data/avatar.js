// Avatar del protagonista: chico o chica, tono de piel, peinado, color de pelo, gorra, chaqueta, pantalón o falda
// y morral. Se guarda en la partida (state.avatar) y se convierte en un "look" para el pixel art y el 3D.
export const AVATAR_OPTIONS = {
  body: [['chico', 'Chico'], ['chica', 'Chica']],
  skin: ['#fbdcc0', '#f2c49e', '#dca47a', '#b47a52', '#83543a'],
  hairColor: ['#2a1f1e', '#5a3a24', '#93603a', '#e0b060', '#c8503a', '#4a62c8', '#e6e2ee'],
  hairStyle: {
    chico: [['short', 'Corto'], ['spiky', 'Puntas'], ['curly', 'Rizos'], ['buzz', 'Rapado']],
    chica: [['long', 'Largo'], ['tail', 'Cola'], ['bun', 'Moño'], ['bob', 'Melena']]
  },
  hat: [null, '#e04848', '#3a6ad8', '#2a9a5a', '#f0b030', '#2a2a32', '#f6f2ea', '#e86aa0', '#e2603f'],
  top: ['#2f5fb8', '#d84848', '#2a9a5a', '#f0a030', '#8a4ad0', '#2a2a32', '#f6f2ea', '#e86aa0', '#e2603f'],
  bottom: ['#3a3a4a', '#2a3a6a', '#6a4a2a', '#d8d0c0', '#c83a4a', '#2a6a4a', '#e86aa0', '#4170b4'],
  bag: ['#f0b040', '#e04848', '#3a6ad8', '#2a9a5a', '#f6f2ea', '#8a4ad0', '#3a3e48']
};

export function defaultAvatar(body = 'chico') {
  return body === 'chica'
    ? { body: 'chica', skin: 1, hairColor: 1, hairStyle: 'long', hat: 6, top: 7, bottom: 0, bag: 4 }
    : { body: 'chico', skin: 1, hairColor: 1, hairStyle: 'short', hat: 8, top: 8, bottom: 7, bag: 6 };
}

// Corrige valores fuera de rango (partidas viejas o archivos editados a mano).
export function cleanAvatar(a) {
  const d = defaultAvatar(a && a.body === 'chica' ? 'chica' : 'chico'), o = AVATAR_OPTIONS, out = { ...d };
  if (!a || typeof a !== 'object') return out;
  const idx = (v, list, def) => Number.isInteger(v) && v >= 0 && v < list.length ? v : def;
  out.skin = idx(a.skin, o.skin, d.skin); out.hairColor = idx(a.hairColor, o.hairColor, d.hairColor);
  out.hat = idx(a.hat, o.hat, d.hat); out.top = idx(a.top, o.top, d.top); out.bottom = idx(a.bottom, o.bottom, d.bottom); out.bag = idx(a.bag, o.bag, d.bag);
  out.hairStyle = o.hairStyle[out.body].some(([id]) => id === a.hairStyle) ? a.hairStyle : d.hairStyle;
  return out;
}

const darker = hex => { const n = parseInt(hex.slice(1), 16), f = .72; return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join(''); };

// Look compatible con LOOKS (art/characters.js) y con people.js.
export function avatarLook(avatar) {
  const a = cleanAvatar(avatar), o = AVATAR_OPTIONS, chica = a.body === 'chica';
  const hat = o.hat[a.hat], top = o.top[a.top];
  return {
    skin: o.skin[a.skin], hair: o.hairColor[a.hairColor], style: a.hairStyle,
    wearCap: !!hat, hat: hat || undefined, hatBand: hat === '#f6f2ea' ? '#e04848' : '#f6f0e2',
    shirt: top, accent: top === '#f6f2ea' ? '#3a6ad8' : '#f6f2ea', pants: o.bottom[a.bottom],
    shoes: chica ? darker(o.bottom[a.bottom]) : '#d84a4a', bag: o.bag[a.bag],
    skirt: chica, lashes: chica, eyes: chica ? '#7a4a9a' : '#3a5a9a'
  };
}
