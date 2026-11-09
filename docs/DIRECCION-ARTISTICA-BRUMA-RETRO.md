# Alborada · Dirección artística oficial — Bruma Retro 16-bit

**Estado:** primera integración funcional en rama \`feature/retro-bruma-visual\`.
**Fuente de referencia:** las diez láminas conceptuales de Alborada aprobadas en ChatGPT, entregadas como \`Alborada_10_Laminas_Assets_Claude.zip\` y \`Alborada_10_Laminas_Retro_Claude.pdf\`. Son **moodboards/conceptos**, no sprites optimizados listos para juego.

## Decisión visual definitiva

La estética que debe mantenerse para el mundo, las criaturas, las transformaciones, los humanos, el mapa, los menús y los combates es **fantasía pixel art de 16 bits**, en la línea de los diez moodboards:

- Siluetas fuertes, contornos deliberados, luces por bloques, texturas de pocos colores.
- Mundo luminoso, naturaleza verde esmeralda, agua turquesa, piedra añil y detalles lavanda; noche azul-violeta con partículas cálidas.
- Interfaz de Pokédex original: fondo de pergamino crema, tinta índigo, cabeceras índigo/morado, marco oro y acentos turquesa.
- Evoluciones de tres etapas progresivas: la criatura debe mantener rasgos reconocibles a través de sus tres formas.
- **Forma Alba** es la evolución temporal especial ya implementada: conservar nombre, mecánica, límites y estadísticas. Rediseñar la silueta y los efectos sin cambiar las reglas.
- Sprites de batalla de frente y espalda, movimiento en cuatro direcciones, miniatura de la mochila/Pokédex, retrato y variantes de estado.
- Humanos en el mismo lenguaje: cabezas expresivas, proporciones de RPG portátil, paletas de ropa consistentes, expresiones de diálogo.
- 3D premium debe leerse como un **diorama pixel art**, no como modelos de plastilina lisos; presentar volumen real conservando el tratamiento retro de paleta y silueta.
- No copiar directamente sprites, interfaces o ROMs comerciales de ninguna franquicia.

## Tokens de diseño (aplicados en \`retro-bruma.css\`)

| Token | Valor | Uso |
|---|---|---|
| Tinta índigo | \`#252040\` | bordes, texto principal |
| Noche bruma | \`#12172f\` | batalla y título |
| Violeta | \`#4b326b\` | cabeceras, gremios, noche |
| Oro | \`#f9c976\` | acentos, progreso, selección |
| Turquesa | \`#78d9df\` | foco, magia, agua |
| Coral | \`#da5d79\` | selección, acción primaria |
| Papel claro | \`#fff9e9\` | menús y conversaciones |

## Implementación real de la primera entrega

1. \`retro-bruma.css\` — rediseño no destructivo de inicio, menús, equipo, mochila, Pokédex, tienda, diálogo, HUD y combate.
2. \`index.html\` — carga el tema nuevo después del CSS existente.
3. \`scripts/build.cjs\` — incluye el archivo en \`dist/\` de Vercel.
4. \`src/art/creatures.js\` — postproceso por sprite (reducir colores, sombreado y tramado tenue) para las 62 especies; no altera datos, nombres ni niveles.
5. \`src/render3d/stylize.js\` — cuantización de color y muestreo pixelado del postproceso 3D; la geometría y la interacción no cambian.

## Integración de arte de las láminas (segunda etapa)

**43 especies del bestiario tienen ahora un retrato pixel-art individual** tomado de los diseños originales de las láminas, recortado a fondo transparente y adaptado a una paleta de 30 colores. Están conectadas a los IDs reales de `src/data/creatures.js`; no se crearon nuevas especies ni se alteraron las partidas.

- `src/art/retro-raw/{0,1,2,3}.b64`: fuente del atlas original, dividida en cuatro partes de texto para versionarse en Git.
- `scripts/build.cjs`: recompone automáticamente `src/art/retro-reference.png` (PNG de 256×192, celdas 32×32) **tanto en desarrollo como al desplegar en Vercel**. Comprueba SHA-256 para detectar archivos corruptos.
- `src/art/retro-reference.js`: registra el orden y las 43 claves del bestiario.
- `src/art/creatures.js`: pone estos dibujos en las vistas frontales del modo clásico, el Registro, los iconos, las evoluciones y el menú de equipo. La vista trasera conserva el sprite anterior hasta que se produzca una ilustración específica.
- `src/core/graphics.js`: muestra estos retratos 16-bit en la interfaz incluso cuando está activo el modo 3D.
- `index.html` y `retro-bruma.css`: muestran los tres retratos originales de los iniciales en la portada para que el cambio visual sea evidente desde el inicio.
- `tests/retro-art.test.mjs`: protege las 43 asociaciones de especies, dimensiones y hash de la imagen.

**Alcance honesto:** son recortes de arte conceptual, no 43 hojas de animación completas ni sprites producidos manualmente de cero. Quedan 19 especies en el atlas previo; sus colores y pixelado siguen la guía visual, pero no tienen ilustración nueva de las láminas. Falta redibujar las vistas traseras, corregir algunos bordes de recorte, producir los sprites de los personajes y crear siluetas nuevas para cada Forma Alba. El mundo 3D mantiene los modelos de Claude con el nuevo tratamiento retro; no se rehizo su geometría.

El paso de integración al build fue verificado reconstruyendo el PNG, comparando su hash y abriendo la aplicación en Chromium con los 43 iconos disponibles, sin errores JS.

## Contrato para Claude/Astra: implementación de las imágenes sin perder el juego

**No rehacer todo el juego.** Usar las especies y claves de \`src/data/creatures.js\` como fuente única de verdad. Las familias actuales son definitivas, incluida la línea original Brotelo/Brásin/Charquín y las diez líneas Bruma.

Para cada especie que se redibuje:

1. Definir \`speciesId\` exacto, etapa evolutiva, tipos, paleta y silueta; nombres y evolución deben corresponder al código actual.
2. Entregar hoja de sprites **transparente, sin texto ni flechas ni fondos**; separar frente, espalda, 4 direcciones, ataque, daño e inactivo. Los posters no son hojas listas para uso.
3. Preferir celdas de resolución fija, por ejemplo overworld 32×32, batalla 96×96 o 128×128 según la silueta; arte con \`image-rendering: pixelated\` y sin reescalado con suavizado.
4. Para la Forma Alba, mantener reconocible la criatura base pero con estructura visual distinta: nuevos detalles de tipo, aura, elementos de silueta. No basta un filtro púrpura. Mantener las estadísticas y condiciones de activación.
5. Construir el modelo 3D equivalente con las mismas marcas: forma general, cabeza, extremidades, cola, ojos, alas, cristales, luces. Sombreado **cel/pixel**, con silueta nítida y paleta acotada.
6. Registrar sprites en \`src/art/bruma-sprites.js\` o el sistema que lo sustituya; mantener fallback a sprite existente mientras se cargan.
7. Comprobar el sprite tanto en combate como en Pokédex, menú de equipo, pantalla de evolución y capturas; no aceptar recortes con texto de las láminas.
8. Capturar **antes y después** del mismo personaje, habitación, Pueblo Brisal, Centro, Tienda y combate; revisar en móvil.
9. Mantener guardado, colisiones, scripts, cámara, escena 3D, 18 tipos, 123 movimientos, 62 criaturas y Forma Alba.
10. No fusionar producción antes de \`npm run build\`, \`npm run test:unit\`, \`npm test\` y revisión visual real.

## Indicadores de aceptación

- [ ] Los dibujos son visualmente consistentes con las diez láminas y no parecen simples capturas de modelados 3D.
- [ ] Cada especie tiene su propia silueta reconocible, y la evolución especial es claramente distinta.
- [ ] No hay etiquetas ni fondos de poster dentro de sprites individuales.
- [ ] La interfaz se lee bien en escritorio, móvil y combate.
- [ ] No se altera el progreso existente.
- [ ] Las puertas, el mundo continuo, las compras, curación, historia y combates siguen funcionando.
- [ ] La versión final pasa pruebas y coincide con el commit desplegado.

**En una frase:** *menos panel de aplicación y menos figuras lisas; más aventura retro de colección, personajes memorables y mundo de diorama vivo.*
