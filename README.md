# Alborada · Edición Bruma

**Jugar:** https://pokemon-sa-ntiago.vercel.app/

Aventura de criaturas para navegador con el estilo de los juegos de portátil de doble pantalla: vista 3/4 con perspectiva, movimiento por casillas, pantalla superior para el mundo y pantalla inferior táctil para los menús. Se abre desde `index.html`, no necesita ROM ni emulador y guarda la partida en el navegador.

El mundo, los personajes, las criaturas, los nombres y todo el pixel art son **originales**. No usa gráficos, mapas, textos ni código de ningún juego comercial.

## Estado actual: Etapa 1 completa

| Escena | Estado |
|---|---|
| Cuarto del protagonista | Jugable |
| Planta baja y escena con mamá | Jugable |
| Pueblo Brisal (4 casas con interior) | Jugable |
| Casa de Nico (1.º y 2.º piso) | Jugable |
| Sendero 1 (pasto alto con criaturas salvajes) | Jugable |
| Lago Espejo (escena de la profesora y el maletín) | Jugable |
| Elección de inicial (Brotelo, Brasín, Charquín) | Jugable |
| Primer combate contra Pipiú | Jugable |
| Regreso a casa (zapatillas para correr) | Jugable |
| Villa Arenal y Laboratorio Ceiba | Jugable |
| Posada Vital (curación) y Tienda (compras) | Jugable |
| Ruta 2, Ciudad Corola, entrenadores, gimnasios | **Pendiente (Etapa 2 en adelante)** |

## Controles

| Acción | Teclado | Táctil |
|---|---|---|
| Caminar / girar (toque corto = solo girar) | Flechas o WASD | Cruceta |
| Hablar, investigar, aceptar | Z, E, Enter o Espacio | A |
| Correr (después de recibir las zapatillas), cancelar | X o Shift | B |
| Menú | Esc o M | START o tocar la pantalla inferior |

## Arquitectura

```
index.html            consola de doble pantalla (canvas superior + panel HTML inferior)
styles.css            estilos de la consola, diálogos, HUD y menús
src/main.js           bucle a 60 Hz, escenas (título, exploración, combate) y servicios del juego
src/core/             renderizador con perspectiva, entrada teclado/táctil, estado y guardado, escala de pantalla, utilidades de pixel art
src/art/              tiles con autotiling, objetos y edificios, personajes (4 direcciones × 3 cuadros), criaturas
src/world/            constructor de mapas, definiciones de mapas, colisiones y exploración
src/story/scripts.js  guiones de la historia
src/battle/battle.js  combate por turnos, experiencia, niveles y captura
src/ui/               diálogo, paneles táctiles, equipo, mochila, tienda, opciones, título
src/data/creatures.js especies, movimientos, tipos, objetos y tablas de encuentros
tests/e2e.cjs         prueba completa en Chromium real
```

Detalles técnicos:

- **Perspectiva tipo portátil:** el mundo se dibuja plano en un búfer y se proyecta fila por fila, más angosto arriba. Se puede apagar en Opciones; no cambia la geometría ni las colisiones.
- **Mundo continuo:** los mapas exteriores comparten un plano global, así que se pasa de Pueblo Brisal al Sendero 1, al Lago Espejo y a Villa Arenal sin pantallas de carga. Fuera de los mapas se dibuja bosque.
- **Profundidad:** árboles, edificios, muebles y personajes se ordenan por su línea de base; el pasto alto tapa los pies del personaje.
- **Interiores:** cámara centrada en la habitación; puertas, tapetes de salida y escaleras con fundido.

## Pruebas

```bash
npm install
npx playwright install chromium
npm test
```

La prueba juega la Etapa 1 completa con teclas reales (sin teletransportes): colisiones con muebles y paredes, objetos, escaleras, bloqueos de historia, transición entre mapas, elección de inicial, primer combate, regreso a casa, correr, laboratorio, curación en la posada, compra en la tienda (dinero e inventario), encuentro salvaje con captura, menú de equipo, guardar y continuar tras recargar, opción de perspectiva y controles táctiles en un viewport móvil. Falla si aparece cualquier error de JavaScript. Las capturas quedan en `tests/screenshots/`.

## Pendiente

- Etapa 2: Ruta 2, Ciudad Corola, combates contra entrenadores y el combate con Nico.
- Música y efectos de sonido.
- Almacenamiento de criaturas en el PC (hoy el equipo llega hasta 6).
- Reemplazar movimientos cuando una criatura ya conoce cuatro.

## Sobre `original/pokediamond`

El submódulo apunta a la decompilación pública `pret/pokediamond`. Se conserva como referencia, pero **el juego no lo usa**: esa decompilación no incluye gráficos, mapas ni textos (se extraen de una ROM que el proyecto no distribuye), y su código depende del hardware de Nintendo DS. Más detalle en [ORIGINAL-CODE.md](ORIGINAL-CODE.md).

La versión anterior del prototipo quedó en la rama `respaldo/sinnoh-reborn-v2`.
