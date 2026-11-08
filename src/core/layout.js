// Marca el tipo de dispositivo en <body> para que la interfaz y los controles táctiles se acomoden.
export function initLayout() {
  const apply = () => {
    const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window && innerWidth < 1100;
    document.body.classList.toggle('touch', touch);
    document.body.classList.toggle('landscape', touch && innerWidth > innerHeight);
  };
  addEventListener('resize', apply);
  addEventListener('orientationchange', () => setTimeout(apply, 120));
  apply();
}
