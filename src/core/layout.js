// Marca el tipo de dispositivo en <body> para que la interfaz y los controles táctiles se acomoden.
export function initLayout() {
  const apply = () => {
    const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window && innerWidth < 1100;
    document.body.classList.toggle('touch', touch);
    document.body.classList.toggle('landscape', touch && innerWidth > innerHeight);
    // iPad y tabletas: letra, botones y controles más grandes (antes se veían como en un celular).
    document.body.classList.toggle('tablet', touch && Math.min(innerWidth, innerHeight) >= 700);
  };
  addEventListener('resize', apply);
  addEventListener('orientationchange', () => setTimeout(apply, 120));
  apply();
}
