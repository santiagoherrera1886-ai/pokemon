// Aviso de versión nueva. El juego se queda abierto días enteros en una pestaña (sobre todo en el iPad o el
// celular) y así nunca se ven los cambios publicados. Cada rato, y cada vez que se vuelve a la pestaña, se mira
// version.json (lo escribe el build); si el commit cambió, se avisa una sola vez con onNew(version).
import { BUILD } from './version.js';

export function isNewer(remote, local = BUILD) { return !!(remote && remote.sha && local.sha !== 'dev' && remote.sha !== local.sha); }

export function watchUpdates(onNew, { every = 3 * 60 * 1000, first = 8000 } = {}) {
  if (BUILD.sha === 'dev' || typeof fetch === 'undefined' || typeof document === 'undefined') return;
  let told = false;
  const check = async () => {
    if (told) return;
    try {
      const r = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const v = await r.json();
      if (isNewer(v)) { told = true; onNew(v); }
    } catch { /* sin red: se vuelve a intentar más tarde */ }
  };
  setTimeout(check, first);
  setInterval(check, every);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
