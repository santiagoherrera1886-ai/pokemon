// Respaldo de partidas en GitHub: un gist privado del jugador con el archivo alborada-partidas.json.
// El jugador pega una vez un token con permiso "gist"; se guarda solo en este navegador.
import { SLOTS, loadState, storeState, parseState } from './state.js';

const KEY = 'alborada-github-v1', FILE = 'alborada-partidas.json', API = 'https://api.github.com';
export const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Puchamon%20partidas';

function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
function write(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } }

async function gh(path, token, opts = {}) {
  const res = await fetch(API + path, { ...opts, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) } });
  if (res.status === 401) throw new Error('GitHub no aceptó el código. Revisa que esté completo y que tenga permiso de gist.');
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}. Intenta otra vez en un rato.`);
  return res.status === 204 ? null : res.json();
}

function bundle() {
  const slots = {};
  for (const n of SLOTS) { const st = loadState(n); if (st) slots[n] = st; }
  return { game: 'alborada', version: 1, updatedAt: Date.now(), slots };
}

export const cloud = {
  get linked() { return !!read()?.token; },
  get login() { return read()?.login || ''; },
  get lastSync() { return read()?.lastSync || 0; },

  // Valida el token, busca el gist de Alborada (o lo crea) y deja todo listo.
  async connect(token) {
    token = (token || '').trim();
    if (!/^(gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}$/.test(token)) throw new Error('Ese código no parece un token de GitHub (empieza por ghp_ o github_pat_).');
    const user = await gh('/user', token);
    let gistId = null;
    for (let page = 1; page <= 3 && !gistId; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`, token);
      gistId = list.find(g => g.files && g.files[FILE])?.id || null;
      if (list.length < 100) break;
    }
    if (!gistId) gistId = (await gh('/gists', token, { method: 'POST', body: JSON.stringify({ description: 'Puchamon · partidas guardadas', public: false, files: { [FILE]: { content: JSON.stringify(bundle()) } } }) })).id;
    write({ token, login: user.login, gistId, lastSync: Date.now() });
    return user.login;
  },
  disconnect() { write(null); },

  // Sube todas las ranuras locales.
  async push() {
    const c = read(); if (!c) return false;
    await gh(`/gists/${c.gistId}`, c.token, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(bundle()) } } }) });
    write({ ...c, lastSync: Date.now() }); return true;
  },
  // Trae las ranuras de GitHub. Solo reemplaza una ranura local si la de GitHub es más nueva.
  async pull() {
    const c = read(); if (!c) return [];
    const gist = await gh(`/gists/${c.gistId}`, c.token), f = gist.files?.[FILE];
    if (!f) return [];
    let text = f.content;
    if (f.truncated && f.raw_url) text = await (await fetch(f.raw_url)).text();
    const data = JSON.parse(text || '{}'), updated = [];
    for (const n of SLOTS) {
      const remote = parseState(data.slots?.[n], n); if (!remote) continue;
      const local = loadState(n);
      if (!local || (remote.savedAt || 0) > (local.savedAt || 0)) { storeState(remote, n); updated.push(n); }
    }
    write({ ...c, lastSync: Date.now() });
    return updated;
  },
  // Subida silenciosa después de guardar (no interrumpe el juego si falla).
  pushSoon() {
    if (!this.linked) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push().catch(e => console.warn('Puchamon: respaldo en GitHub pendiente', e.message)), 1500);
  }
};
