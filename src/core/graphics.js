// Display preferences intentionally live outside alborada-save-v1.
const KEY = 'alborada-graphics-v1';
export class Graphics {
  constructor(game) {
    this.game = game; this.mode = 'premium'; this.quality = 'medium'; this.status = 'idle';
    this.engine = null; this.pending = null;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) {this.mode = saved.mode === 'classic' ? 'classic' : 'premium'; this.quality = ['low','medium','high'].includes(saved.quality) ? saved.quality : 'medium';}
      else if (matchMedia('(pointer: coarse)').matches) this.quality = 'low';
    } catch { /* Storage is optional; gameplay still works. */ }
  }
  save() {try {localStorage.setItem(KEY, JSON.stringify({mode:this.mode, quality:this.quality}));} catch { /* private browsing */ }}
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
    this.pending = import('../render3d/renderer.js').then(({PremiumRenderer}) => {
      this.engine = new PremiumRenderer(this.game, this.quality, status => {
        this.status = status;
        if (status === 'lost') this.game.toast('Gráficos pausados · modo clásico activo');
        if (status === 'ready') this.game.toast('Gráficos 3D recuperados');
      });
      this.status = 'ready'; return true;
    }).catch(error => {
      this.status = 'unavailable'; this.mode = 'classic';
      this.game.toast('3D no disponible · puedes seguir en clásico');
      console.warn('Alborada: 3D no disponible', error.message);
      return false;
    }).finally(() => {this.pending = null;});
    return this.pending;
  }
  render() {
    const supportedScene = this.game.scene === 'overworld' || this.game.scene === 'battle';
    if (this.mode !== 'premium' || !supportedScene || this.status === 'unavailable') {this.engine?.setVisible(false); return false;}
    if (!this.engine) {this.ensure(); return false;}
    if (this.engine.lost) {this.engine.setVisible(false); return false;}
    try {this.engine.render(); this.engine.setVisible(true); return true;}
    catch (error) {
      this.engine.setVisible(false); this.status = 'unavailable'; this.mode = 'classic';
      console.warn('Alborada: se recuperó el modo clásico', error.message);
      this.game.toast('Modo clásico activo · tu partida continúa'); return false;
    }
  }
}
