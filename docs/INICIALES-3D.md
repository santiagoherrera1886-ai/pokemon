# Alborada — Iniciales 3D y sus tres evoluciones

**Estado:** implementado en \`feature/retro-bruma-visual\`, pendiente de fusionar manualmente a \`main\`.

## Cambio solicitado

La referencia visual aprobada tiene tres criaturas iniciales modeladas en 3D, cada una con tres etapas:
- Zorro de hojas: cría tierna de orejas vegetales → criatura esbelta con melena de hojas → guardián de bosque con astas florecidas.
- Zorro de fuego: cría anaranjada con cola de llama → corredor de melena ardiente → guardián de gran melena y fuego volumétrico.
- Familiar acuático: criatura azul con aletas → compañero de cola de ola → guardián de mareas con aletas, cresta y detalles dorados.

No se pegaron imágenes 2D a la pantalla. **Los nueve diseños se generan como geometría Three.js con volumen real, ojos y detalles 3D**, y comparten el sistema de renderizado de combates.

## Correspondencias en el juego

| Familia | Nivel inicial | Primera evolución (nivel 16) | Evolución final (nivel 32) |
|---|---|---|---|
| Planta | Brotelo | Brotoso | Bosquerón |
| Fuego | Brasín | Brasón | Volcarbón |
| Agua | Charquín | Charcomar | Mareón |

Los IDs, estadísticas, movimientos, tipos, niveles de evolución y partidas guardadas **no cambian**. Los textos del bestiario sí reflejan las nuevas formas.

## Código que se modificó

- \`src/render3d/starter-evolutions.js\`: esculturas originales de las nueve criaturas y elementos tridimensionales para hojas, flores, llamas, aletas y olas.
- \`src/render3d/creatures3d.js\`: cada uno de los nueve IDs usa su modelo esculpido suave en el modo 3D, mientras las demás especies mantienen sus modelos actuales. No se usa un plano con una imagen.
- \`src/render3d/title.js\`: muestra físicamente a los tres iniciales sobre pedestales; permite alternar entre las tres etapas con modelos 3D, sin cambiar el juego ni el progreso.
- \`index.html\` y \`retro-bruma.css\`: añaden controles accesibles INICIALES / EVOLUCIÓN II / EVOLUCIÓN III; eliminan los retratos planos *solo* cuando el modo 3D está activo y apartan el menú para mostrar las criaturas completas.
- \`src/render3d/renderer.js\`: mantiene un acabado 3D más suave en la portada, sin eliminar el modo pixel clásico.
- \`src/data/creatures.js\`: actualiza la narrativa del bestiario sin modificar las reglas.
- \`tests/starter-evolutions-3d.test.mjs\` y \`tests/retro-3d.test.mjs\`: pruebas de modelos 3D, evoluciones y elementos de UI.

## Qué se probó

- Construcción de los nueve modelos con geometría volumétrica real, ojos animables y tamaño compatible con la cámara.
- Test automatizado de continuidad de la cadena evolutiva y preservación de especies.
- Navegación de INICIALES → EVOLUCIÓN II → EVOLUCIÓN III → INICIALES desde la portada en Chromium real.
- Inicio de nueva partida, página móvil, sin errores JavaScript en los escenarios verificados.
- Compilación \`npm run build\` y pruebas unitarias \`npm run test:unit\`.

## Alcance visual y trabajo futuro

Es una **implementación 3D propia inspirada en la hoja conceptual aprobada**, no la extracción automática de un modelo 3D desde un PNG. La imagen no contenía mallas, rig, huesos, texturas UV ni animaciones; esos recursos deben crearse mediante modelado 3D para lograr una réplica exacta. Estos modelos son esculturas procedurales de calidad jugable, no una reconstrucción idéntica de cada detalle del render conceptual. Las animaciones siguen utilizando el rig de combate ya presente, con los ojos animables.

En modo clásico 2D se mantienen los sprites 16-bit aprobados; en modo 3D se muestran las nuevas esculturas.

## Cómo desplegar

Abre la PR #2 del repositorio y verifica primero el enlace Preview más reciente. Para publicar, pulsa **Merge pull request** para fusionar a \`main\`. Vercel desplegará el commit fusionado en la web principal. Mientras no se fusione, producción permanece sin estos nuevos modelos.
