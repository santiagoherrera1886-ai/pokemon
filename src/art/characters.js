// Personajes de 16x24 en 4 direcciones x 3 cuadros, construidos píxel a píxel con contorno automático.
import { canvas, px, outline, flipH, shadeHex } from '../core/pixel.js';

const EYE = '#2a2630';

export const LOOKS = {
  player: { skin: '#f8d0a8', hair: '#3a2a2a', style: 'cap', hat: '#e04848', hatBand: '#ffffff', shirt: '#2f5fb8', accent: '#f0f0f0', pants: '#3a3a4a', shoes: '#d84a4a', bag: '#f0b040' },
  rival: { skin: '#f8d0a8', hair: '#f0c040', style: 'spiky', shirt: '#f08a3a', accent: '#3a8a4a', pants: '#4a5a7a', shoes: '#3a3a44', scarf: '#3a9a5a' },
  mom: { skin: '#f8d0a8', hair: '#8a4a2e', style: 'long', shirt: '#e86a8a', accent: '#ffffff', pants: '#5a6ab8', shoes: '#8a5a30', apron: '#fff4e0' },
  prof: { skin: '#f0c8a0', hair: '#5a8a5a', style: 'bun', shirt: '#4a6a8a', accent: '#ffffff', pants: '#3a3a44', shoes: '#5a3a20', coat: '#f8f8f8' },
  aide: { skin: '#e8b890', hair: '#2a2a3a', style: 'short', shirt: '#5aa0d0', accent: '#ffffff', pants: '#3a3a44', shoes: '#3a3a44', coat: '#f8f8f8' },
  nurse: { skin: '#f8d0a8', hair: '#f08ab0', style: 'long', shirt: '#ffffff', accent: '#f05a8a', pants: '#ffffff', shoes: '#f8f8f8', apron: '#ffe4ee', cap: '#ffffff' },
  clerk: { skin: '#e8b890', hair: '#3a2a20', style: 'short', shirt: '#4a8ad8', accent: '#ffffff', pants: '#3a3a44', shoes: '#3a3a44', apron: '#3a6ab8' },
  kid: { skin: '#f8d0a8', hair: '#6a3a2a', style: 'spiky', shirt: '#5cb04c', accent: '#ffffff', pants: '#3a5a8a', shoes: '#f0f0f0' },
  girl: { skin: '#f0c8a0', hair: '#2a2a3a', style: 'long', shirt: '#f0c040', accent: '#ffffff', pants: '#d84a7a', shoes: '#ffffff' },
  old: { skin: '#e8c0a0', hair: '#d8d8e0', style: 'bald', shirt: '#8a6a4a', accent: '#c8a878', pants: '#5a4a3a', shoes: '#3a3a44' },
  man: { skin: '#d8a880', hair: '#2a2020', style: 'short', shirt: '#6a7a8a', accent: '#ffffff', pants: '#2a3a5a', shoes: '#3a3a44' },
  rivalMom: { skin: '#f8d0a8', hair: '#f0c040', style: 'bun', shirt: '#8ac0e8', accent: '#ffffff', pants: '#5a5a7a', shoes: '#8a5a30', apron: '#ffffff' }
};

function head(g, L, dir) {
  const hair = L.hair, dark = shadeHex(hair, -0.3);
  if (dir === 0) { // de frente
    px(g, 5, 1, hair, 6, 1); px(g, 4, 2, hair, 8, 4);
    px(g, 4, 5, L.skin, 8, 6); px(g, 5, 10, L.skin, 6, 1);
    if (L.style === 'long') { px(g, 3, 4, hair, 2, 9); px(g, 11, 4, hair, 2, 9); px(g, 4, 5, hair, 8, 1); }
    else if (L.style === 'bun') { px(g, 6, 0, hair, 4, 2); px(g, 4, 5, hair, 8, 1); px(g, 4, 6, hair, 1, 2); px(g, 11, 6, hair, 1, 2); }
    else if (L.style === 'spiky') { px(g, 3, 2, hair, 1, 3); px(g, 12, 2, hair, 1, 3); px(g, 5, 0, hair, 1, 1); px(g, 8, 0, hair, 1, 1); px(g, 10, 0, hair, 1, 1); px(g, 4, 5, hair, 8, 1); px(g, 5, 6, hair, 1, 1); px(g, 8, 6, hair, 1, 1); }
    else if (L.style === 'bald') { px(g, 5, 1, L.skin, 6, 3); px(g, 4, 3, hair, 1, 4); px(g, 11, 3, hair, 1, 4); px(g, 6, 5, hair, 4, 1); }
    else { px(g, 4, 5, hair, 8, 1); px(g, 4, 6, hair, 1, 2); px(g, 11, 6, hair, 1, 2); }
    if (L.style === 'cap') { px(g, 4, 1, L.hat, 8, 4); px(g, 3, 4, L.hat, 10, 1); px(g, 3, 5, shadeHex(L.hat, -0.25), 10, 1); px(g, 4, 2, L.hatBand, 8, 1); px(g, 7, 3, L.hatBand, 2, 1); px(g, 4, 6, hair, 1, 2); px(g, 11, 6, hair, 1, 2); }
    if (L.cap) { px(g, 5, 1, L.cap, 6, 2); px(g, 7, 1, '#f05a8a', 2, 2); }
    px(g, 6, 7, EYE, 1, 2); px(g, 9, 7, EYE, 1, 2);
    px(g, 5, 9, shadeHex(L.skin, -0.08), 1, 1); px(g, 10, 9, shadeHex(L.skin, -0.08), 1, 1);
  } else if (dir === 1) { // de espaldas
    px(g, 5, 1, hair, 6, 1); px(g, 4, 2, hair, 8, 8); px(g, 5, 10, hair, 6, 1);
    px(g, 4, 9, dark, 8, 1);
    if (L.style === 'long') { px(g, 3, 4, hair, 10, 9); px(g, 4, 12, dark, 8, 1); }
    if (L.style === 'bun') px(g, 6, 0, hair, 4, 3);
    if (L.style === 'spiky') { px(g, 3, 2, hair, 1, 3); px(g, 12, 2, hair, 1, 3); px(g, 5, 0, hair, 1, 1); px(g, 10, 0, hair, 1, 1); }
    if (L.style === 'bald') { px(g, 5, 1, L.skin, 6, 4); }
    if (L.style === 'cap') { px(g, 4, 1, L.hat, 8, 5); px(g, 4, 5, shadeHex(L.hat, -0.25), 8, 1); px(g, 6, 4, L.hatBand, 4, 1); }
    if (L.cap) px(g, 5, 1, L.cap, 6, 2);
  } else { // perfil izquierdo
    px(g, 5, 1, hair, 6, 1); px(g, 4, 2, hair, 8, 4);
    px(g, 4, 5, L.skin, 6, 6); px(g, 3, 7, L.skin, 1, 2);
    px(g, 9, 4, hair, 3, 6); px(g, 4, 5, hair, 5, 1);
    if (L.style === 'long') { px(g, 9, 4, hair, 4, 9); }
    if (L.style === 'bun') { px(g, 9, 1, hair, 4, 3); }
    if (L.style === 'spiky') { px(g, 11, 2, hair, 2, 2); px(g, 6, 0, hair, 1, 1); px(g, 9, 0, hair, 1, 1); }
    if (L.style === 'bald') { px(g, 5, 1, L.skin, 5, 4); px(g, 9, 4, hair, 3, 4); }
    if (L.style === 'cap') { px(g, 4, 1, L.hat, 8, 4); px(g, 2, 4, L.hat, 7, 1); px(g, 2, 5, shadeHex(L.hat, -0.25), 5, 1); px(g, 4, 2, L.hatBand, 8, 1); }
    if (L.cap) px(g, 5, 1, L.cap, 5, 2);
    px(g, 5, 7, EYE, 1, 2);
  }
}

function body(g, L, dir, frame) {
  const shirtD = shadeHex(L.shirt, -0.22);
  const step = frame === 0 ? 0 : (frame === 1 ? 1 : -1);
  if (dir === 0 || dir === 1) {
    px(g, 4, 11, L.shirt, 8, 5); px(g, 4, 15, shirtD, 8, 1);
    if (dir === 0) px(g, 6, 11, L.accent, 4, 1);
    if (L.scarf) px(g, 5, 11, L.scarf, 6, 2);
    // brazos con balanceo
    const la = step === 1 ? -1 : (step === -1 ? 1 : 0), ra = -la;
    px(g, 3, 11, L.shirt, 1, 3 + la); px(g, 3, 14 + la, L.skin, 1, 2);
    px(g, 12, 11, L.shirt, 1, 3 + ra); px(g, 12, 14 + ra, L.skin, 1, 2);
    if (L.coat) { px(g, 3, 11, L.coat, 2, 8); px(g, 11, 11, L.coat, 2, 8); if (dir === 1) px(g, 4, 11, L.coat, 8, 8); else px(g, 4, 16, L.coat, 2, 3), px(g, 10, 16, L.coat, 2, 3); }
    if (L.apron && dir === 0) px(g, 5, 13, L.apron, 6, 5);
    if (L.bag && dir === 1) { px(g, 5, 11, L.bag, 6, 5); px(g, 5, 15, shadeHex(L.bag, -0.3), 6, 1); px(g, 7, 12, shadeHex(L.bag, -0.2), 2, 1); }
    if (L.bag && dir === 0) { px(g, 5, 11, shadeHex(L.bag, -0.3), 1, 4); px(g, 10, 11, shadeHex(L.bag, -0.3), 1, 4); }
    // piernas
    const pd = shadeHex(L.pants, -0.2);
    px(g, 4, 16, pd, 8, 1);
    const lUp = step === -1 ? 1 : 0, rUp = step === 1 ? 1 : 0;
    px(g, 5, 17, L.pants, 3, 3 - lUp); px(g, 8, 17, L.pants, 3, 3 - rUp);
    px(g, 5, 20 - lUp, L.shoes, 3, 2); px(g, 8, 20 - rUp, L.shoes, 3, 2);
    px(g, 8, 17, pd, 1, 3 - rUp);
  } else {
    px(g, 5, 11, L.shirt, 6, 5); px(g, 5, 15, shirtD, 6, 1);
    if (L.scarf) px(g, 4, 11, L.scarf, 6, 2);
    if (L.bag) { px(g, 9, 11, L.bag, 3, 5); px(g, 9, 15, shadeHex(L.bag, -0.3), 3, 1); }
    if (L.coat) px(g, 5, 11, L.coat, 6, 8);
    if (L.apron) px(g, 4, 13, L.apron, 2, 5);
    const pd = shadeHex(L.pants, -0.2);
    if (step === 0) {
      px(g, 6, 16, L.pants, 4, 4); px(g, 5, 20, L.shoes, 5, 2);
      px(g, 7, 11, shirtD, 2, 4); px(g, 7, 15, L.skin, 2, 1);
    } else {
      px(g, 4, 16, L.pants, 3, 4); px(g, 3, 20, L.shoes, 4, 2);
      px(g, 8, 16, pd, 3, 3); px(g, 9, 19, shadeHex(L.shoes, -0.2), 3, 2);
      const a = step === 1 ? 0 : 1;
      px(g, 5 + a * 3, 11, shirtD, 2, 3); px(g, 5 + a * 3, 14, L.skin, 2, 1);
    }
  }
}

function frameSprite(L, dir, frame) {
  const [c, g] = canvas(16, 24);
  const bob = frame !== 0 ? 1 : 0;
  // El cuerpo se dibuja primero, la cabeza encima (con rebote de 1px al caminar).
  body(g, L, dir, frame);
  const [hc, hg] = canvas(16, 24);
  head(hg, L, dir);
  g.drawImage(hc, 0, bob ? 0 : 0);
  if (bob) { const [t, tg] = canvas(16, 24); tg.drawImage(c, 0, 1); return outline(t, '#26222e'); }
  return outline(c, '#26222e');
}

const sheetCache = new Map();
// Devuelve frames[dir][frame]; dir: 0 abajo, 1 arriba, 2 izquierda, 3 derecha.
export function sheet(lookName) {
  if (sheetCache.has(lookName)) return sheetCache.get(lookName);
  const L = LOOKS[lookName] || LOOKS.man;
  const frames = [0, 1, 2].map(d => [0, 1, 2].map(f => frameSprite(L, d, f)));
  frames[3] = frames[2].map(flipH);
  sheetCache.set(lookName, frames);
  return frames;
}

// Retrato grande para el cuadro de diálogo (cabeza ampliada x2 de frente).
export function portrait(lookName) {
  const f = sheet(lookName)[0][0];
  const [c, g] = canvas(32, 24);
  g.drawImage(f, 0, 0, 16, 12, 0, 0, 32, 24);
  return c;
}
