# Alborada · Edición Bruma

**Jugar:** https://pokemon-sa-ntiago.vercel.app/

Aventura de criaturas en pixel art para el navegador, a pantalla completa. Vista 3/4 con perspectiva, movimiento por casillas, combates por turnos y una historia completa de principio a fin. Se abre desde `index.html`, no necesita ROM ni emulador y guarda la partida en el navegador.

El mundo, los personajes, las criaturas, los nombres y todo el pixel art son **originales**. No usa gráficos, mapas, textos ni código de ningún juego comercial.

## Historia completa

| Parte | Lugares | Qué pasa |
|---|---|---|
| Inicio | Cuarto, casa, Pueblo Brisal, casa de Nico | Mamá, Nico y el viaje al lago |
| Lago Espejo | Sendero 1, Lago Espejo | La profesora, el maletín, el inicial y el primer combate |
| Laboratorio | Villa Arenal, Laboratorio Ceiba, Posada, Tienda | Zapatillas para correr, Cápsulas |
| Medalla Hoja | Ruta 2, Ciudad Corola, gimnasio | Primer combate con Nico, aparece el Equipo Eclipse, líder Hiedra (Planta) |
| Medalla Roca | Ruta 3, Cueva Eco (oscura), Pueblo Cobre, gimnasio | Recluta Eclipse en la cueva, líder Basalto (Roca) |
| Medalla Marea | Ruta 4, Ciudad Marea, gimnasio | Segundo combate con Nico, líder Coral (Agua) |
| Equipo Eclipse | Bodega de Ciudad Marea, Lago Espejo | Admin. Bruma, Jefe Umbra y la guardiana Espejalba (se puede atrapar) |
| Liga | Ruta 5, Liga Alborada | Combate final con Nico, Campeona Aurora, créditos y regreso a casa |

**Contenido:** 28 especies con evoluciones, 10 tipos, 33 movimientos, más de 20 entrenadores con línea de visión, 3 gimnasios, viaje rápido con la Mensajera de las posadas, PC de almacenamiento, registro de criaturas vistas y atrapadas.

## Controles

| Acción | Teclado | Táctil |
|---|---|---|
| Caminar / girar (toque corto = solo girar) | Flechas o WASD | Cruceta |
| Hablar, investigar, aceptar | Z, E, Enter o Espacio | A |
| Correr (después de recibir las zapatillas), cancelar | X o Shift | B |
| Menú | Esc o M | Botón ☰ |

## Gráficos

Dos modos, que se cambian en **Opciones → Gráficos** sin perder la partida:

- **3D (por defecto):** pantalla completa con Three.js. Cámara alta casi cenital con perspectiva suave, personajes cabezones que inclinan la cabeza hacia la cámara, materiales satinados, sol desde arriba a la izquierda con sombras suaves, resplandor (bloom) en lo brillante, gradación cálida y leve desenfoque en los bordes. Las ciudades (Villa Arenal, Corola, Marea) tienen calles de asfalto con bordillo y andenes de baldosa. Los combates usan cámara baja con cielo y fondo según el terreno. Calidad baja, media o alta.
- **Pixel clásico:** el motor 2D anterior.

Detalles del modo pixel clásico:

- Pantalla completa con resolución interna dinámica y escala entera: el pixel art se ve nítido en cualquier pantalla.
- Perspectiva tipo portátil (desactivable en Opciones).
- Sombras de árboles, edificios y personajes; nubes que cruzan el mapa; pétalos y hojas que caen; pasto que se mueve al pisarlo; polvo al correr.
- Luz según la hora real (amanecer, tarde, noche): de noche se encienden los faroles y las puertas de las casas. Se puede dejar fija en Opciones.
- Cueva Eco oscura con luz alrededor del personaje.
- Combates con fondo según el terreno (pasto, lago, cueva, playa, montaña, gimnasio, base Eclipse, Liga), criaturas que respiran, efectos por tipo de movimiento y sacudida de pantalla.
- Escena de evolución animada.

## Arquitectura

```
index.html            canvas a pantalla completa + interfaz superpuesta
styles.css            diálogo, menús, HUD de combate, controles táctiles
src/main.js           bucle a 60 Hz, escenas (título, exploración, combate, evolución, créditos) y servicios
src/core/             renderizador con perspectiva y post-proceso, entrada, estado y guardado, utilidades de pixel art
src/art/              tiles con autotiling, objetos y edificios, personajes, criaturas
src/world/            constructor de mapas, mapas (maps.js inicio, maps2.js resto de la historia), colisiones y exploración
src/story/scripts.js  guiones de toda la historia
src/battle/battle.js  combate, entrenadores, experiencia, niveles, aprendizaje y captura
src/ui/               diálogo, paneles, menú, equipo, mochila, tienda, opciones, viaje rápido, título
src/data/creatures.js especies, movimientos, tipos, objetos y encuentros
tests/e2e.cjs         prueba que juega toda la historia en Chromium real
```

## Pruebas

```bash
npm install
npx playwright install chromium
npm test
```

La prueba juega **la historia entera** con teclas reales: camina con una ruta calculada sobre las colisiones del juego (sin teletransportes), entra y sale de edificios, pelea con Nico, los entrenadores, los tres líderes, Bruma, Umbra, Espejalba, Nico en la Liga y la Campeona Aurora, usa la posada, la tienda y el viaje rápido, guarda y continúa tras recargar, prueba las opciones y los controles táctiles en un celular, y falla si aparece cualquier error de JavaScript. Las capturas quedan en `tests/screenshots/`.

Para que la prueba sea rápida y no dependa del azar, después de elegir inicial sube su nivel y le recarga los PP en algunos puntos. Todo lo demás es entrada real.

## Pendiente

- Música y efectos de sonido.
- Estados alterados (veneno, parálisis, sueño) y objetos equipables.
- Más zonas opcionales después de la Liga.

## Sobre `original/pokediamond`

El submódulo apunta a la decompilación pública `pret/pokediamond` y se conserva como referencia, pero **el juego no lo usa**: esa decompilación no incluye gráficos, mapas ni textos (se extraen de una ROM que el proyecto no distribuye). Más detalle en [ORIGINAL-CODE.md](ORIGINAL-CODE.md).

Versiones anteriores: `respaldo/sinnoh-reborn-v2` (primer prototipo) y `respaldo/etapa1-ds` (Etapa 1 con doble pantalla).
