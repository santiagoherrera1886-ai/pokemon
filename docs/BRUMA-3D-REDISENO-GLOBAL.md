# Alborada · Bruma 3D — Dirección artística unificada v3
**Estado:** implementación en rama \`feature/retro-bruma-visual\`; producción sin fusionar hasta revisión del propietario.

## Objetivo

Que **todos los sistemas visuales jugables** mantengan una sola gramática: fantasía portátil retro de diorama tridimensional, formas reconocibles, materiales mates, contornos y siluetas claras, paleta propia de índigo, jade, lavanda, turquesa y oro. Las diez láminas de arte aprobadas son la referencia de la identidad del bestiario. No se distribuyen assets de Nintendo.

## Aplicación en código — no son renders de propuesta

| Área | Código fuente | Aplicado |
|---|---|---|
| Nueve iniciales y evoluciones con siluetas 3D propias | \`src/render3d/starter-evolutions.js\` | Sí: tres familias × tres etapas, controles en portada |
| 62 cuerpos de criaturas | \`src/render3d/creatures3d.js\`, \`sculpt.js\`, \`bestiary.js\` | Sí: nueve esculpidos y el resto modelos voxel 3D |
| Formas Alba | \`src/render3d/alba.js\` | Sí: cristales y silueta adicionales, progresión intacta |
| 27 modelos de roles humanos | \`src/render3d/people.js\`, \`art-direction.js\` | Sí: accesorios 3D por rol, rig y animación preservados |
| Casas, laboratorios, tiendas y gimnasios | \`src/render3d/models.js\` | Sí: terminaciones en volumen, tejas, faroles, contraventanas, jardineras y símbolos |
| Árboles y suelo | \`src/render3d/environment.js\` | Sí: copas de cinco volúmenes, paletas por variante y LOD sin conos genéricos |
| Los 37 mapas exteriores/interiores | \`src/render3d/art-direction.js\`, \`environment.js\` | Sí: decoración 3D por bioma/tipo sin modificar mapa o colisiones |
| Ocho terrenos de combate | \`src/render3d/renderer.js\`, \`art-direction.js\` | Sí: eliminadas filas de conos repetidos; bosques, cristales, arrecifes y estructuras únicas |
| Menús, HUD y bestiario | \`retro-bruma.css\`, \`src/ui/menus.js\` | Sí: estilo portátil retro + galería de 43 ilustraciones |
| Portada 3D | \`src/render3d/title.js\`, \`index.html\` | Sí: pedestales, tres evoluciones y escena volumétrica |

**Compatibilidad:** \`src/story\`, \`src/battle\`, \`src/data\` (salvo textos descriptivos), colisiones, warps, guardados y flujo de misiones quedan íntegros. Modo 2D clásico sigue disponible.

## Evidencia técnica

- \`npm run build\`: correcto.
- \`npm run test:unit\`: **44 de 44** pruebas correctas.
- \`tests/complete-art-direction.test.mjs\`: roles humanos, mapas y ocho tipos de combate.
- \`tests/starter-evolutions-3d.test.mjs\`: nueve criaturas iniciales y su integración.
- \`tests/architecture-art.test.mjs\`: volumen físico de fachadas y copa arbórea, incluidas geometrías agrupadas.
- Prueba Chromium: Brisal, habitación, laboratorio, posada, Corola y gimnasio en 2D y 3D; estado de la partida idéntico, errores JS = 0. Comprobación visual de Brisal/laboratorio y captura de combate Brasín con fondo de bosque.

## Honestidad sobre el alcance

Esta es una **primera integración global de dirección artística**: modifica todos los *sistemas* de presentación del juego y habilita un estilo coherente. No afirma haber esculpido a mano modelos artísticos finales e independientes para cada una de las 62 criaturas, ni producir automáticamente modelos AAA idénticos a los conceptos 2D. Los 43 sprites del bestiario siguen siendo ilustraciones de referencia, no archivos GLB con huesos/UV/animación. Para una traducción exacta faltan trabajos manuales por especie: silueta, textura, aletas/alas/pelos, animación de ataque, vistas del perfil y Forma Alba individual.

La prueba gráfica completa de todos los mapas y la historia punta-a-punta siguen pendientes de ejecución exhaustiva; la revisión Chromium representa seis escenas escogidas más los tests de todo el modelo de datos.

## Despliegue

1. Abrir PR **#2** en GitHub.
2. Revisar el Preview Vercel READY del HEAD más reciente de esta rama.
3. Fusionar a \`main\` cuando se apruebe visualmente.
4. Confirmar que Vercel despliega exactamente el SHA del merge. La URL de producción sigue usando los gráficos anteriores hasta la fusión.

**Criterio de diseño:** No sacrificar usabilidad, colisiones, estado de partida o FPS por efectos decorativos. Construir geometría y materiales nativos, no insertar láminas planas como supuestos modelos 3D.
