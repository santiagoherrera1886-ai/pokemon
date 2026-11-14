// Mapa de la región de Alborada: se dibuja con los mismos tiles de los mapas exteriores (cada casilla es un
// cuadrito), con los ocho gimnasios numerados, la Liga, el Lago Espejo, la Cueva Eco y dónde estás tú.
// Las zonas que todavía no visitas se ven como en un mapa viejo: sólo la silueta, sin detalle.
import { GYMS, badgeCount, LEAGUE_BADGES, nextGym } from '../data/gyms.js';
import { TG, SIZE, CITIES, AIRPORTS, ROADS, RIVERS, ENTRY_X } from '../world/tierra.js';
import { overviewCanvas, OV, seenCount } from '../world/flightmap.js';

const PX = 3;   // píxeles por casilla en el lienzo (luego el CSS lo escala sin suavizar)
const PAPER = '#efe7d0';
const TILE = {
  '.': '#a9d68a', g: '#5fae4e', p: '#ead7a6', D: '#ead7a6', s: '#f1e2a6', w: '#5aa6de', F: '#e9a9bd',
  T: '#3f7f42', Y: '#2f6a4c', J: '#7fb24c', O: '#9b9588', K: '#a08a68', B: '#4b8a3c', f: '#b48d5c', R: '#7a7068', x: '#a9d68a'
};
const SNOW = { '.': '#eef3f7', g: '#cddde7', Y: '#8fa9a2', K: '#b9c4cc', O: '#c4c8cc', T: '#8fa9a2' };
const PAVED = { '.': '#dcd4c0' };
const BIOME = {
  desert: { '.': '#ecd49a', g: '#d2ba74', K: '#c48a58', O: '#b98a5c' },
  volcano: { '.': '#7a6c66', g: '#62554f', K: '#4b403e', O: '#5a4c48', w: '#ff8a2a', p: '#9a8a80' },
  jungle: { '.': '#74b464', g: '#4a9a4e', T: '#2f7c4c', J: '#3f9a52' }
};

// Lugar exterior (mapa, x, y) donde está el jugador; si está bajo techo, la puerta por la que entró.
function outdoorSpot(world, st) {
  let id = st.map, x = st.x, y = st.y;
  for (let hop = 0; hop < 4; hop++) {
    const m = world.get(id);
    if (!m) return null;
    if (m.outdoor) return [m.origin[0] + x, m.origin[1] + y];
    const from = Object.values(world.maps).find(o => o.warps.some(w => w.to === id));
    const w = from && from.warps.find(w => w.to === id);
    if (!w) return null;
    id = from.id; x = w.x; y = w.y;
  }
  return null;
}

function bounds(world) {
  const ms = world.base || world.outdoor;   // sólo Alborada: Tierra Grande tiene su propio mapa
  const x0 = Math.min(...ms.map(m => m.origin[0])) - 3, y0 = Math.min(...ms.map(m => m.origin[1])) - 3;
  const x1 = Math.max(...ms.map(m => m.origin[0] + m.w)) + 3, y1 = Math.max(...ms.map(m => m.origin[1] + m.h)) + 3;
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

// HTML del mapa: el lienzo más las etiquetas (en HTML para que se lean bien a cualquier tamaño).
export function regionMapHTML(world, st) {
  const B = bounds(world);
  const pos = (gx, gy) => `left:${((gx - B.x0) / B.w * 100).toFixed(2)}%;top:${((gy - B.y0) / B.h * 100).toFixed(2)}%`;
  // Las etiquetas de los bordes se pegan hacia adentro para que no se salgan del mapa.
  const label = (gx, gy) => { const t = (gx - B.x0) / B.w; return pos(gx, gy) + (t < .1 ? ';transform:translate(0,-50%)' : t > .9 ? ';transform:translate(-100%,-50%)' : ''); };
  const visited = st.visited || {}, esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const out = [];
  for (const m of world.base || world.outdoor) {
    const cx = m.origin[0] + m.w / 2, cy = m.origin[1] + m.h / 2, seen = visited[m.id] ? '' : ' fog';
    if (m.encounters && !['lago', 'volcan', 'manglar', 'isla'].includes(m.id)) out.push(`<span class="rm-l route${seen}" style="${label(cx, cy)}">${esc(m.name)}</span>`);
    else out.push(`<span class="rm-l town${['lago', 'volcan', 'manglar', 'isla'].includes(m.id) ? ' spot' : ''}${seen}" style="${label(cx, m.origin[1] + m.h - 2.5)}">${esc(m.name)}</span>`);
  }
  out.push(`<span class="rm-l spot" style="${label(95.5, -66)}">Cueva Eco</span>`);
  const next = nextGym(st);
  GYMS.forEach((g, i) => {
    const m = world.get(g.map), o = m && m.objects.find(o => o.kind === 'gym');
    if (!o) return;
    const won = (st.badges || []).includes(g.badge);
    out.push(`<span class="rm-gym${won ? ' on' : ''}${next === g && st.story >= 6 ? ' next' : ''}" style="${pos(m.origin[0] + o.x + o.w / 2, m.origin[1] + o.y + o.h / 2)};--c:${g.color}" title="Gimnasio de ${esc(g.city)} · ${esc(g.leader)} · Medalla ${esc(g.name)}">${i + 1}</span>`);
  });
  const r5 = world.get('ruta5'), liga = r5 && r5.objects.find(o => o.kind === 'big');
  if (liga) out.push(`<span class="rm-liga" style="${pos(r5.origin[0] + liga.x + liga.w / 2, r5.origin[1] + liga.y + liga.h / 2)}" title="Liga Alborada">★</span>`);
  const me = outdoorSpot(world, st);
  if (me) out.push(`<span class="rm-me" style="${pos(me[0] + .5, me[1] + .5)}" title="Estás aquí"></span>`);
  const n = badgeCount(st);
  return `<h3 class="ph">MAPA DE ALBORADA <small>${n}/${LEAGUE_BADGES} medallas</small></h3>
    <div class="rmap" style="aspect-ratio:${B.w} / ${B.h}"><canvas id="rmCanvas" width="${B.w * PX}" height="${B.h * PX}"></canvas>${out.join('')}</div>
    <div class="rm-key"><span><i class="k-gym on"></i>Gimnasio ganado</span><span><i class="k-gym"></i>Gimnasio por ganar</span><span><i class="k-liga">★</i>Liga</span><span><i class="k-me"></i>Tú</span></div>`;
}

export function drawRegionMap(canvas, world, st) {
  if (!canvas) return;
  const B = bounds(world), g = canvas.getContext('2d'), visited = st.visited || {};
  g.fillStyle = PAPER; g.fillRect(0, 0, canvas.width, canvas.height);
  // Cuadrícula suave de mapa de papel.
  g.fillStyle = 'rgba(160,130,80,.12)';
  for (let x = 0; x < B.w; x += 10) g.fillRect(x * PX, 0, 1, canvas.height);
  for (let y = 0; y < B.h; y += 10) g.fillRect(0, y * PX, canvas.width, 1);
  // Túnel de la Cueva Eco entre la Ruta 3 y Pueblo Cobre.
  g.fillStyle = '#6a5442'; g.fillRect((92 - B.x0) * PX, (-71 - B.y0) * PX, 8 * PX, 4 * PX);
  for (const m of world.base || world.outdoor) {
    const ox = (m.origin[0] - B.x0) * PX, oy = (m.origin[1] - B.y0) * PX;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const c = m.tiles[y][x];
      g.fillStyle = (m.biome && BIOME[m.biome] && BIOME[m.biome][c]) || (m.snow && SNOW[c]) || (m.paved && PAVED[c]) || TILE[c] || TILE['.'];
      g.fillRect(ox + x * PX, oy + y * PX, PX, PX);
    }
    for (const o of m.objects) {
      if (!['house', 'lab', 'big', 'gym'].includes(o.kind)) continue;
      const gym = o.kind === 'gym' && GYMS.find(G => G.map === m.id);
      g.fillStyle = gym ? gym.color : (o.opt && o.opt.roof) || '#c8665a';
      g.fillRect(ox + o.x * PX, oy + o.y * PX, o.w * PX, o.h * PX);
      g.fillStyle = 'rgba(0,0,0,.28)';
      g.fillRect(ox + o.x * PX, oy + (o.y + o.h) * PX - 2, o.w * PX, 2);
    }
    if (!visited[m.id]) {   // sin visitar: sólo la silueta
      g.fillStyle = 'rgba(239,231,208,.62)';
      g.fillRect(ox, oy, m.w * PX, m.h * PX);
    }
  }
}

// ---------------------------------------------------------------- Tierra Grande
// El terreno sólo se ve donde ya has estado (a pie, en carro o volando); las carreteras, las ciudades y los
// aeropuertos salen siempre, como en un mapa de carreteras.
const TGK = 2;   // el lienzo va a 2 píxeles por píxel del mapa chiquito (1 píxel cada 4 casillas)
export function tgMapHTML(st, me) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const pos = (x, y) => `left:${(x / SIZE * 100).toFixed(2)}%;top:${(y / SIZE * 100).toFixed(2)}%`;
  const out = [];
  // Las etiquetas pegadas a un borde se corren hacia adentro para que no se corten.
  const label = (x, y) => pos(x, y) + (x / SIZE < .14 ? ';transform:translate(0,-50%)' : x / SIZE > .8 ? ';transform:translate(-100%,-50%)' : '');
  for (const c of CITIES) out.push(`<span class="rm-l town${c.kind === 'grande' ? ' big' : ''}" style="${label((c.x0 + c.x1) / 2, c.y1 + 30)}">${esc(c.name)}</span>`);
  for (const a of AIRPORTS) out.push(`<span class="rm-air" style="${pos(a.x0 + 60, a.y0 + 4)}" title="${esc(a.name)}">✈</span>`);
  out.push(`<span class="rm-l spot" style="${pos(ENTRY_X, 60)}">↑ Sabana</span>`);
  if (me) out.push(`<span class="rm-me" style="${pos(me[0], me[1])}" title="Estás aquí"></span>`);
  const pct = Math.round(seenCount(st) / (TG.N * TG.N) * 100);
  return `<h3 class="ph">MAPA DE TIERRA GRANDE <small>${pct}% explorado</small></h3>
    <div class="rmap tg" style="aspect-ratio:1 / 1"><canvas id="rmCanvas" width="${TG.N * OV * TGK}" height="${TG.N * OV * TGK}"></canvas>${out.join('')}</div>
    <div class="rm-key"><span><i class="k-air">✈</i>Aeropuerto</span><span><i class="k-road"></i>Autopista</span><span><i class="k-me"></i>Tú</span><span>Lo que no has visitado sale en blanco</span></div>`;
}
export function drawTGMap(canvas, st, me) {
  if (!canvas) return;
  const g = canvas.getContext('2d'), W = canvas.width, k = W / SIZE;
  g.fillStyle = '#7fb0d8'; g.fillRect(0, 0, W, W);             // mar
  g.fillStyle = PAPER;
  g.beginPath(); g.ellipse(W / 2, W / 2, W * .47, W * .47, 0, 0, Math.PI * 2); g.fill();
  const ov = overviewCanvas(st);
  if (ov) { g.imageSmoothingEnabled = false; g.drawImage(ov, 0, 0, W, W); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const r of RIVERS) { g.strokeStyle = '#5aa6de'; g.lineWidth = Math.max(2, r.w * k * 1.2); g.beginPath(); r.line.forEach(([x, y], i) => i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)); g.stroke(); }
  for (const r of ROADS) {
    const wide = r.w >= 6;
    for (const [col, w] of [['#5a5048', wide ? 6 : 4], [wide ? '#f2c84a' : '#f6f2ea', wide ? 3.4 : 2]]) {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath(); r.line.forEach(([x, y], i) => i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)); g.stroke();
    }
  }
  for (const c of CITIES) {
    g.fillStyle = 'rgba(200,102,90,.55)'; g.fillRect(c.x0 * k, c.y0 * k, (c.x1 - c.x0) * k, (c.y1 - c.y0) * k);
    g.strokeStyle = '#8a3a30'; g.lineWidth = 2; g.strokeRect(c.x0 * k, c.y0 * k, (c.x1 - c.x0) * k, (c.y1 - c.y0) * k);
  }
  for (const a of AIRPORTS) { g.fillStyle = '#4a4e58'; g.fillRect(a.x0 * k, a.y0 * k - 1, (a.x1 - a.x0) * k, Math.max(3, 8 * k)); }
  // Volando: flecha con el rumbo de la avioneta.
  if (me && me[2] !== undefined) {
    g.save(); g.translate(me[0] * k, me[1] * k); g.rotate(me[2]);
    g.fillStyle = '#e04848'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(26, 0); g.lineTo(-10, -12); g.lineTo(-4, 0); g.lineTo(-10, 12); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}
