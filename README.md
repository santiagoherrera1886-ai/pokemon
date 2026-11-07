# Sinnoh Reborn — navegador, edición pixel art

**Jugar en línea:** https://pokemon-sa-ntiago.vercel.app/

Este proyecto es una **aventura fan independiente inspirada en la Sinnoh de Pokémon Diamante y Perla**. No requiere cargar ROMs ni instalar emuladores: la entrada `index.html` funciona con Canvas 2D y JavaScript en el navegador.

> **Importante:** no es el videojuego comercial, no es un port del código de Nintendo DS y **no reproduce de forma idéntica** todo su contenido. La edición visual V2 usa personajes dibujados por nuestro código en píxeles originales y proporciones más cercanas a Nintendo DS. La decompilación upstream se mantiene vinculada como **referencia**.

## Qué funciona actualmente

- Arranque en la habitación del protagonista y progresión de la primera aventura.
- Pueblo Hojaverde de cuatro casas, Ruta 201, Lago Veraz, Pueblo Arena, Ruta 202 y una representación inicial de Jubileo.
- Conversaciones con mamá, Barry y el profesor Serbal.
- Elección de Turtwig, Chimchar o Piplup; primer Starly; combates, experiencia y captura básica.
- Centros Pokémon con curación, Poké Mart con compras de Poké Balls y pociones, inventario persistente.
- Entradas automáticas caminando por las puertas; salida automática por la puerta de los interiores.
- Bloqueos para no atravesar mobiliario y obstáculos del mapa.
- Personajes de pixel art originales de cuatro direcciones, árboles en capas y gráficos renderizados a baja resolución con escala nítida.
- Guardado en el navegador (localStorage); no se envían datos de partida a servidores.
- Controles táctiles en móvil: flechas, botón **A** interactuar, botón **B** correr. Los diálogos avanzan tocando el cuadro.

## Controles de escritorio

| Acción | Tecla |
|---|---|
| Mover | WASD o flechas |
| Interactuar y hablar | E, Enter o espacio |
| Correr | Shift |
| Mostrar u ocultar misión | Q |
| Equipo | R |
| Mapa | M |
| Cerrar ventana | Esc |

## Código y fuente original

- `index.html` y `hd2d.html`: páginas de juego sincronizadas.
- `hd2d.js`: motor web y pixel art dibujado por código.
- `hd2d.css`: controles, diálogos, UI y presentación de juego.
- `tests/qa-browser.cjs`: prueba real de escritorio y móvil.
- `original/pokediamond`: **submódulo de Git** apuntando a [pret/pokediamond](https://github.com/pret/pokediamond) (proyecto de decompilación Nintendo DS en desarrollo). Su código no se ejecuta en la web.

Para obtener el código fuente upstream junto al proyecto:

```bash
git clone --recurse-submodules https://github.com/santiagoherrera1886-ai/pokemon.git
```

Más contexto en [ORIGINAL-CODE.md](ORIGINAL-CODE.md).

## Pruebas reproducibles

En un entorno de desarrollo con Node y Chromium:

```bash
npm install --no-save playwright
npx playwright install chromium
node tests/qa-browser.cjs
```

Esta prueba inicia un servidor web local, carga el juego en Chromium, comprueba los pasos 0–7 de la historia, entradas y salidas, compras en Poké Mart, curación en Centro Pokémon, errores JS y movimiento táctil. Para sistemas Linux se pueden necesitar las dependencias de Chromium (`npx playwright install-deps chromium`).

## Qué falta para una versión realmente fiel

El motor actual **no** contiene los mapas extraídos de la ROM comercial, sus modelos/sprites originales, todas las ciudades/rutas ni los ocho gimnasios y la historia completa. La decompilación de `pret` requiere dependencias del entorno Nintendo DS y datos del juego original: incorporarla como submódulo no convierte automáticamente este prototipo en un juego web idéntico.

Este fan project no tiene afiliación con Nintendo, Game Freak ni The Pokémon Company. Pokémon y todos sus personajes y marcas pertenecen a sus titulares. No se incluye ni distribuye ROM comercial.
