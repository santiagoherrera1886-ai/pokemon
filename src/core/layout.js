export function initLayout() {
// Escala la consola de doble pantalla para que quepa en cualquier ventana (escala entera cuando se puede).
const ds = document.getElementById('ds');
const pad = document.getElementById('pad');
const H = 192 * 2 + 14, W = 256;

function touchMode() {
  return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('force-pad');
}

function layout() {
  const vw = innerWidth, vh = innerHeight;
  const touch = touchMode();
  document.body.classList.toggle('touch', touch);
  const landscape = vw > vh;
  document.body.classList.toggle('landscape', touch && landscape);
  let availW = vw - 16, availH = vh - 16;
  if (touch && !landscape) availH -= 190;
  if (touch && landscape) availW -= 300;
  let s = Math.min(availW / W, availH / H);
  if (s >= 2) s = Math.floor(s);
  s = Math.max(0.6, s);
  ds.style.transform = `scale(${s})`;
  ds.style.width = W + 'px'; ds.style.height = H + 'px';
  ds.parentElement.style.setProperty('--dsw', W * s + 'px');
  ds.parentElement.style.setProperty('--dsh', H * s + 'px');
  document.documentElement.style.setProperty('--s', s);
  pad.classList.toggle('show', touch);
}
addEventListener('resize', layout);
addEventListener('orientationchange', () => setTimeout(layout, 120));
layout();

}
