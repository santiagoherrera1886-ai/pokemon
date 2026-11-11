import {hasRetroReference} from '../art/retro-reference.js';
import {setRetroArt} from '../art/creatures.js';
// Display preferences intentionally live outside alborada-save-v1.
const KEY = 'alborada-graphics-v1';
// Los letreros 3D se pintan con la fuente del juego: se espera a que cargue (máximo 2,5 s).
function fontsReady() {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve();
  const wait = Promise.all(['700 64px Fredoka', '800 32px Nunito'].map(f => document.fonts.load(f))).catch(() => {});
  return Promise.race([wait, new Promise(res => setTimeout(res, 2500))]);
}
export class Graphics {
  constructor(game) {
    // art: 'hd' (criaturas y menús en alta definición, por defecto) o 'retro' (tema Bruma Retro 16-bit).
    this.game = game; this.mode = 'premium'; this.quality = 'medium'; this.art = 'hd'; this.status = 'idle';
    this.engine = null; this.pending = null;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) {this.mode = saved.mode === 'classic' ? 'classic' : 'premium'; this.quality = ['low','medium','high'].includes(saved.quality) ? saved.quality : 'medium'; this.art = saved.art === 'retro' ? 'retro' : 'hd';}
      else if (matchMedia('(pointer: coarse)').matches) this.quality = 'low';
    } catch { /* Storage is optional; gameplay still works. */ }
  }
  save() {try {localStorage.setItem(KEY, JSON.stringify({mode:this.mode, quality:this.quality, art:this.art}));} catch { /* private browsing */ }}
  // Estilo de arte: activa o apaga la hoja retro, los sprites retro y el pixelado del 3D. Los retratos se rehacen.
  applyArt() {
    const retro = this.art === 'retro';
    setRetroArt(retro);
    if (typeof document !== 'undefined') {
      const css = document.getElementById('retroCss'); if (css) css.disabled = !retro;
      document.body?.classList.toggle('art-retro', retro); document.body?.classList.toggle('art-hd', !retro);
    }
    this.engine?.portraits?.clear();
  }
  setArt(value) {this.art = value === 'retro' ? 'retro' : 'hd'; this.save(); this.applyArt();}
  async setMode(mode) {
    this.mode = mode === 'classic' ? 'classic' : 'premium'; this.save();
    if (this.mode === 'classic') {this.engine?.setVisible(false); return true;}
    return this.ensure();
  }
  setQuality(value) {this.quality = value; this.save(); this.engine?.setQuality(value);}
  async ensure() {
    if (this.engine) return !this.engine.lost;
    if (this.pending) return this.pending;
    this.status = 'loading';
    this.pending = fontsReady().then(() => import('../render3d/renderer.js')).then(({PremiumRenderer}) => {
      this.engine = new PremiumRenderer(this.game, this.quality, status => {
        this.status = status;
        if (status === 'lost') this.game.toast('Gráficos pausados · modo clásico activo');
        if (status === 'ready') this.game.toast('Gráficos 3D recuperados');
      });
      this.status = 'ready'; return true;
    }).catch(error => {
      this.status = 'unavailable'; this.mode = 'classic';
      this.game.toast('3D no disponible · puedes seguir en clásico');
      console.warn('Puchamon: 3D no disponible', error.message);
      return false;
    }).finally(() => {this.pending = null;});
    return this.pending;
  }
  // Retrato 3D para la interfaz cuando el modo 3D está activo (si no, null y se usa el pixel art).
  portrait(sp) {
    // Con el tema retro, el catálogo retro aprobado prima sobre los retratos 3D en cualquier modo.
    if(this.art === 'retro' && hasRetroReference(sp))return null;
    if (this.mode !== 'premium' || this.status !== 'ready' || !this.engine || this.engine.lost) return null;
    try { return this.engine.portrait(sp); } catch (error) { console.warn('Puchamon: retrato no disponible', error.message); return null; }
  }
  avatarPortrait(look) {
    if (this.mode !== 'premium' || this.status !== 'ready' || !this.engine || this.engine.lost) return null;
    try { return this.engine.avatarPortrait(look); } catch (error) { console.warn('Puchamon: retrato del avatar no disponible', error.message); return null; }
  }
  render() {
    const supportedScene = this.game.scene === 'overworld' || this.game.scene === 'battle' || this.game.scene === 'title';
    if (this.mode !== 'premium' || !supportedScene || this.status === 'unavailable') {this.engine?.setVisible(false); return false;}
    if (!this.engine) {this.ensure(); return false;}
    if (this.engine.lost) {this.engine.setVisible(false); return false;}
    try {this.engine.render(); this.engine.setVisible(true); return true;}
    catch (error) {
      this.engine.setVisible(false); this.status = 'unavailable'; this.mode = 'classic';
      console.warn('Puchamon: se recuperó el modo clásico', error.message);
      this.game.toast('Modo clásico activo · tu partida continúa'); return false;
    }
  }
}
