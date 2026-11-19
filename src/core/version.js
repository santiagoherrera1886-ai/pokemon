// Versión del juego. El build (scripts/build.cjs) reescribe este archivo en dist/ con el commit publicado y deja
// el mismo dato en dist/version.json: así el juego sabe si hay una versión más nueva que la que tiene cargada.
// Aquí, sin build (pruebas y desarrollo), el commit es 'dev' y no se busca nada.
export const BUILD = { version: '5.2', sha: 'dev' };
