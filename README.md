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
| Equipo Eclipse | Bodega de Ciudad Marea, Lago Espejo | Admin. Bruma, Jefe Umbra y la guardiana Espejalba (se puede atrapar). La profesora abre la Ruta 6 |
| Medalla Chispa | Ruta 6 (costa), Ciudad Voltio, gimnasio | Ciudad de molinos; líder Centella (Eléctrico) |
| Medalla Sombra | Ruta 7 (bosque de niebla), Pueblo Niebla, gimnasio | Pueblo de velas y lápidas; líder Velia (Fantasma) |
| Medalla Puño | Ruta 8 (cafetales), Villa Cafetal, gimnasio | Hacienda cafetera; líder Don Tinto (Lucha) |
| Medalla Escarcha | Ruta 9 (paso nevado), Ciudad Escarcha, gimnasio | Ciudad con nieve y cristales; líder Nevada (Hielo) |
| Medalla Escama | Ruta 10 (camino antiguo), Ciudad Albor, gimnasio | La ciudad más antigua; maestro Sabino (Dragón) |
| Liga | Ruta 11, Ruta 5, Liga Alborada | Con las ocho medallas: combate final con Nico, Campeona Aurora, créditos y regreso a casa |

**Mapa de la región:** el viaje da la vuelta completa a Alborada, de una ciudad a la siguiente:

Pueblo Brisal → Sendero 1 (al oeste, el Lago Espejo) → Villa Arenal → Ruta 2 → **Ciudad Corola** → Ruta 3 → Cueva Eco → **Pueblo Cobre** → Ruta 4 → **Ciudad Marea** → Ruta 6 → **Ciudad Voltio** → Ruta 7 → **Pueblo Niebla** → Ruta 8 → **Villa Cafetal** → Ruta 9 → **Ciudad Escarcha** → Ruta 10 → **Ciudad Albor** → Ruta 11 → Ruta 5 → **Liga Alborada**. La Ruta 5 también baja a Corola, así que la vuelta se cierra. Las ciudades nuevas tienen posada, tienda con mostrador propio y una casa.

Cada ciudad nueva tiene un guardia en la salida hacia la siguiente ruta: deja pasar cuando ganas en su gimnasio. La Liga pide las **ocho medallas**. En el juego, **Inicio → VER MAPA** muestra la región dibujada con sus casillas, los ocho gimnasios numerados (en color los ganados), la Liga y dónde estás.

**Contenido:** 62 especies (diez familias nuevas y cinco leyendas), todas con Forma Alba, 18 tipos, 123 movimientos, 5 estados alterados, 69 mapas (22 al aire libre, 12 rutas y zonas con criaturas salvajes), 48 entrenadores con línea de visión, 8 gimnasios con edificio propio en 3D, viaje rápido con la Mensajera de las posadas, PC de almacenamiento, registro de criaturas vistas y atrapadas.

## Combate

- **18 tipos** (Normal, Fuego, Agua, Planta, Eléctrico, Hielo, Lucha, Veneno, Tierra, Volador, Psíquico, Bicho, Roca, Fantasma, Dragón, Siniestro, Acero y Hada) con su tabla completa de ventajas, desventajas e inmunidades (`src/data/types.js`).
- **123 movimientos** (`src/data/moves.js`): ataques de varias potencias, golpes que van primero, de 2 a 5 golpes, retroceso, drenaje, curación, protección, críticos fáciles, subidas y bajadas de estadísticas y efectos secundarios.
- **Estados:** quemado (resta PS y baja el ataque), envenenado, paralizado (más lento y a veces no se mueve), dormido y congelado, más la confusión durante el combate. Se quedan después del combate; se curan en la posada o con Antídoto, Pomada de Árnica, Tinto Cargado, Gel de Sábila, Panela Caliente y Remedio Casero. Cada tipo tiene inmunidades (el Fuego no se quema, el Eléctrico no se paraliza, etc.).
- **Animaciones por movimiento:** en 3D (`src/render3d/movefx.js`) hay proyectiles, chorros, rayos, relámpagos, lluvias de rocas y pétalos, columnas, olas, terremotos con sacudida de cámara, remolinos, anillos psíquicos, sombras, mordiscos, zarpazos, drenajes, escudos, mejoras y efectos de cada estado. En pixel clásico, las mismas animaciones con partículas.
- La IA de los rivales elige según la efectividad, usa estados y curaciones con criterio y no repite lo que no sirve.
- **Forma Alba:** con la primera medalla recibes el **Brazalete Alba**. Una vez por combate, en LUCHAR, tocas **FORMA ALBA** antes de escoger el ataque: la criatura crece, le sale una corona de luz con adornos de su tipo, alas de luz y un brillo cálido, y sube su Ataque (+30 %), Defensa (+20 %) y Velocidad (+20 %) hasta que termina el combate. Funciona con todas las especies (`src/data/alba.js`, `src/render3d/alba.js`). Basalto, Coral, Centella, Velia, Don Tinto, Nevada, Sabino, Nico, el Jefe Umbra y la Campeona Aurora también la usan con su última criatura.

## Iniciales

Las tres líneas iniciales siguen la lámina de diseño del proyecto (`src/render3d/iniciales.js`):

| Línea | Tipos | Etapas |
| --- | --- | --- |
| Planta | Planta · Planta · Planta/Roca | Brotelo (zorrito de orejas de hoja) → Brotoso (zorro esbelto con cola de hojas) → Bosquerón (ciervo con astas en flor) |
| Fuego | Fuego · Fuego · Fuego/Tierra | Brasín (cachorro de león con cola de fuego) → Brasón (león joven de melena ardiente) → Volcarbón (león que ruge sobre la roca volcánica) |
| Agua | Agua · Agua · Agua/Psíquico | Charquín (foquita de cola de pez) → Charcomar (nutria dragón de aletas) → Mareón (señor del mar con corona y gema) |

## Criaturas nuevas (bestiario de la Bruma)

Diez familias de tres etapas, con diseños propios inspirados en las láminas de concepto del proyecto (`src/render3d/bestiary.js`):

| Familia | Tipos | Dónde aparece |
|---|---|---|
| Nivalín → Nivalmar → Nivalord (ballena de hielo) | Agua/Hielo | Ruta 4 |
| Michín → Mistigato → Orbelina (gata mística) | Psíquico → Psíquico/Hada | Lago Espejo, Ruta 5 |
| Ferlum → Ferrox → Acerión (perro de acero) | Acero | Cueva Eco |
| Magmol → Magmor → Magmatrón (gólem de magma) | Fuego/Roca | Cueva Eco |
| Cuarcín → Cuarzón → Astrocuarzo (geoda de cristal) | Roca/Hada | Cueva Eco, Ruta 5 |
| Verdílago → Foliatón → Arbórex (lagarto de hojas) | Planta → Planta/Dragón | Ruta 2, Ruta 5 |
| Fatuín → Candelo → Velaria (farolero fantasma) | Fantasma/Fuego | De noche: Sendero 1, Lago, Ruta 4, Ruta 5 |
| Sierpín → Serpentil → Cobrumbra (cobra) | Veneno → Veneno/Siniestro | Ruta 2, Ruta 5 |
| Lanín → Carnerazo → Arietón (carnero boxeador) | Lucha → Lucha/Tierra | Ruta 3, Ruta 5 |
| Truenín → Tormavis → Elestrix (ave de tormenta) | Eléctrico/Volador | Ruta 3, Ruta 4 |

**Leyendas (después de ser campeón):** Brumalia (Fantasma/Hada, Ruta 2 de noche), Fraguón (Fuego/Acero, Cueva Eco) y Glaciel (Hielo/Volador, Ruta 5). Al atrapar las tres, Dracalba (Dragón/Psíquico) despierta en el Lago Espejo. Cada una tiene su movimiento propio.

En pixel clásico, todas las especies usan sprites sacados de sus modelos 3D (`src/art/bruma-sprites.png`), así se ven igual en los dos modos; el pixel art original queda de respaldo mientras carga el atlas. Si cambias un modelo, se regeneran con `node scripts/sprites.cjs`.

## Personaje y partidas

- **Creador de personaje:** al empezar escoges chico o chica, tono de piel, peinado (corto, puntas, rizos, rapado, largo, cola, moño o melena), color de pelo, gorra (o sin gorra), chaqueta, pantalón o falda y morral. Se ve igual en 3D y en pixel clásico, y se cambia cuando quieras en **Opciones → Mi avatar**.
- **Tres ranuras:** varias personas pueden jugar en el mismo navegador sin borrarse la partida. Cada ranura muestra nombre, medallas, tiempo jugado y lugar.
- **Guardado automático** al entrar a cada lugar (se apaga en Opciones), además del botón Guardar.
- **Respaldo en GitHub (opcional):** en **Partidas y GitHub** se pega una vez un token con permiso `gist` (el juego abre el enlace para crearlo). Las partidas se suben a un gist privado de tu cuenta (`alborada-partidas.json`) cada vez que guardas y se pueden traer en otro equipo. El token queda sólo en ese navegador.
- **Archivo:** descargar la partida como `.json` y cargarla en otra ranura desde el título.

## Menús

- **Inicio:** tu personaje, el lugar, el tiempo jugado, el dinero, el objetivo (con el botón **VER MAPA**) y las ocho medallas, con botones grandes para Equipo, Mochila, Registro, Tarjeta, Guardar y Opciones.
- **Mapa de la región:** toda Alborada dibujada con las casillas reales de cada mapa; lo que no has visitado se ve apagado.
- **Equipo y ficha:** tarjetas con retrato, tipos, estado y PS; la ficha muestra barras de estadísticas, experiencia, movimientos con tipo y potencia, y el objeto equipado (dar, cambiar o quitar).
- **Registro:** las 62 especies numeradas; las que no has visto salen como «???». Cada ficha trae estadísticas base, dónde vive (de día o de noche) y la línea evolutiva.
- **Tarjeta de entrenador:** retrato, dinero, tiempo, registro, equipo y medallas.
- **Códigos secretos** (Opciones › Códigos): hay claves para plata infinita, para evolucionar cualquier criatura desde su ficha, para subir de nivel (botones SUBIR 1 NIVEL y SUBIR 10 NIVELES en la ficha) y para recibir las cinco leyendas. Los de plata, evolución y nivel se guardan en la partida y se apagan escribiendo la misma clave otra vez; el de las leyendas las entrega una sola vez. En el código del juego sólo quedan las huellas de las claves, no el texto.

## Tiendas y objetos

Cada tienda tiene tres puestos:

- **Dependiente (mostrador general):** comprar y vender (te pagan la mitad). Lo que vende crece con las medallas y lo que todavía no llega se ve bloqueado.
- **Vendedora (mostrador especial):** cosas propias de cada ciudad. Arenal: Miel Silvestre, Pócimas, Guayaba y Cinta de Fuerza. Corola: Semillas que suben estadísticas para siempre, Brote Vivo y Arepa de Reserva. Cobre: cápsulas especiales, Bobina de Cobre, Pañuelo Veloz y Chaleco Acolchado. Marea: todas las Pócimas, el Dulce de Arequipe, Perla de Río, Escarcha Eterna y Brasa Eterna. Voltio: Bobina de Cobre, Pañuelo Veloz y Cápsula Veloz. Niebla: Vela de Niebla, Cápsula Ocaso y Cristal Mental. Cafetal: Tinto Cargado, Arepa de Reserva y Venda de Campeón. Escarcha: Escarcha Eterna, Panela Caliente y Chaleco Acolchado. Albor: Escama Antigua, las cuatro Semillas y Rocío Puro.
- **Máquina expendedora:** Agua de Panela, Jugo de Lulo y Avena (curan más barato).

Son 53 objetos originales en 7 bolsillos de la mochila:

| Bolsillo | Objetos |
|---|---|
| Cápsulas | Cápsula, Supercápsula, Hipercápsula, Veloz (primer turno), Ocaso (noche y cuevas), Reloj (combates largos), Malla (Agua y Bicho), Alba (regalo al llevar 10) |
| Medicinas | Tónico, Supertónico, Hipertónico, Tónico Máximo, Revivir, bebidas, Rocío y Rocío Puro (PP) |
| Batalla | Pócimas Fuerza, Coraza, Viento (suben dos etapas) y Certera (más críticos) |
| Campo | Repelente (100, 200 o 250 pasos; avisa y ofrece otro al acabarse), Silbato de Regreso (te lleva a la última Posada), Miel Silvestre (atrae una criatura) |
| Cuidado | Semillas Vital, Fuerza, Coraza y Viento (+3 permanentes, hasta +15), Dulce de Arequipe (sube un nivel, aprende movimientos y puede evolucionar) |
| Equipables | Una por criatura, actúan solas en combate: Cinta de Fuerza (+10% de daño), Pañuelo Veloz (+20% de Velocidad), Chaleco Acolchado (-12% de daño recibido), Arepa de Reserva (recupera PS cada turno), Guayaba Madura (se cura con pocos PS y se gasta) y nueve amuletos de tipo (+20%): Brasa Eterna, Perla de Río, Brote Vivo, Bobina de Cobre, Escarcha Eterna, Venda de Campeón, Cristal Mental, Escama Antigua y Vela de Niebla |
| Clave | Brazalete Alba (Forma Alba, una vez por combate) |

La tienda muestra íconos en pixel art, descripción de cada objeto, cantidad x1/x10 y total con lo que te queda.

## Controles

| Acción | Teclado | Táctil |
|---|---|---|
| Caminar / girar (toque corto = solo girar) | Flechas o WASD | Cruceta |
| Hablar, investigar, aceptar | Z, E, Enter o Espacio | A |
| Correr (después de recibir las zapatillas), cancelar | X o Shift | B |
| Menú | Esc o M | Botón ☰ |

## Gráficos

Dos modos, que se cambian en **Opciones → Gráficos** sin perder la partida:

- **3D (por defecto):** pantalla completa con Three.js. Cámara alta casi cenital con perspectiva suave, personajes cabezones que inclinan la cabeza hacia la cámara, criaturas esculpidas (cada cuerpo es una sola pieza que funde cabeza, cuello, patas y cola, con barriga y cachetes pintados, boca tallada y ojos grandes con brillo que parpadean; se arman con campos de distancia y Surface Nets en `src/render3d/sculpt.js`), casas de juguete (techo de tejas en franjas gruesas, cumbrera con remates, ventanas de marco blanco con jardinera y alero festoneado), letreros luminosos en los locales (placa con borde extruido, ícono propio y letras grandes, inclinada hacia la cámara; `src/render3d/signs.js`) y postes de camino con el nombre del lugar pintado, materiales satinados, sol desde arriba a la izquierda con sombras suaves, resplandor (bloom) en lo brillante, gradación cálida y leve desenfoque en los bordes. Las ciudades (Villa Arenal, Corola, Marea) tienen calles de asfalto con bordillo y andenes de baldosa. Los combates usan cámara baja con cielo y fondo según el terreno. Calidad baja, media o alta.
  En 3D la interfaz usa letra redonda (Nunito y Fredoka): diálogo en caja blanca con doble borde y placa de lugar que entra desde la izquierda con el color de la zona.
  La pantalla de inicio es una escena 3D al amanecer en el Lago Espejo con bruma sobre el agua: las tres iniciales posan en una lomita con el sol detrás, el protagonista las acompaña y suben motas de luz. En pantalla horizontal el logo y el menú van en una columna a la izquierda; en el celular, logo arriba y menú abajo. Las tarjetas de inicial, el equipo y el Registro muestran retratos 3D de las criaturas.
  **Acabado HD de las criaturas:** luz de borde tibia en la piel, sombra de pliegues horneada en la malla esculpida, ojos redondos de cachorro u ojos en almendra con párpados para las formas mayores, láminas con grosor (orejas de hoja, hojas, aletas translúcidas, pétalos) y fuego vivo que titila. Las formas finales traen su efecto en movimiento: hojas que flotan alrededor de Bosquerón, brasas que suben de Volcarbón y agua que gira a los pies de Mareón.
- **Pixel clásico:** el motor 2D anterior.

**Estilo de arte** (Opciones → Estilo de arte): **HD** por defecto, o **Retro 16-bit**, que activa el tema Bruma Retro (`retro-bruma.css`, letra pixel, ilustraciones retro de las láminas y pixelado del 3D).

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
src/world/            constructor de mapas, mapas (maps.js inicio, maps2.js Ruta 2 a Marea y la Liga, maps3.js Ruta 6 a Ruta 11 con sus cinco ciudades), colisiones y exploración
src/story/scripts.js  guiones de toda la historia
src/battle/battle.js  combate, entrenadores, experiencia, niveles, aprendizaje y captura
src/ui/               diálogo, paneles, menú, equipo, mochila por bolsillos, tienda, opciones, viaje rápido, título
src/data/creatures.js especies, movimientos, tipos y encuentros (de día y de noche)
src/data/alba.js      Forma Alba: brazalete, multiplicadores y limpieza al terminar el combate
src/data/gyms.js      los ocho gimnasios: medalla, líder, ciudad, regalo, siguiente destino y la regla de la Liga
src/render3d/gyms.js  el edificio 3D de cada gimnasio según su tipo
src/ui/regionmap.js   mapa de la región con gimnasios, Liga y posición del jugador
src/render3d/iniciales.js modelos de las tres líneas iniciales con el acabado HD de la lámina
src/render3d/bestiary.js  modelos esculpidos de las familias nuevas y las leyendas
src/render3d/alba.js  corona, alas de luz y brillo de la Forma Alba en 3D
scripts/sprites.cjs   genera los sprites clásicos de todas las especies desde sus modelos 3D
src/data/items.js     objetos, bolsillos, inventario de cada tienda y efectos (combate y mapa)
src/data/avatar.js    opciones del creador de personaje y conversión a look (pixel y 3D)
src/core/state.js     estado de la partida y tres ranuras de guardado
src/core/cloud.js     respaldo opcional de las partidas en un gist privado de GitHub
tests/e2e.cjs         prueba que juega toda la historia en Chromium real
tests/region.test.mjs mapas conectados, puertas, guardias, gimnasios, entrenadores y encuentros
fonts/                Pixelify Sans, Fredoka y Nunito (licencia SIL OFL, incluida), servidas localmente
```

## Pruebas

```bash
npm install
npx playwright install chromium
npm test
```

La prueba juega **la historia entera** con teclas reales: camina con una ruta calculada sobre las colisiones del juego (sin teletransportes), entra y sale de edificios, pelea con Nico, los entrenadores, los ocho líderes (recorre la Ruta 6 a la Ruta 11 de una ciudad a otra), Bruma, Umbra, Espejalba, Nico en la Liga y la Campeona Aurora (usando la Forma Alba en cada combate desde la primera medalla), encuentra a Fraguón en la Cueva Eco después de la Liga, usa la posada, compra y vende en la tienda, compra en el mostrador especial y en la máquina, usa el viaje rápido, guarda y continúa tras recargar, prueba las opciones y los controles táctiles en un celular, crea una chica en el editor de personaje, usa dos ranuras y conecta el respaldo de GitHub contra una API simulada, y falla si aparece cualquier error de JavaScript. Las capturas quedan en `tests/screenshots/`.

Para que la prueba sea rápida y no dependa del azar, después de elegir inicial sube su nivel, le recarga los PP en algunos puntos y, en la región del este, entrena al equipo antes de cada líder y da por vencidos a los entrenadores de ruta (ya probados antes). Todo lo demás es entrada real. Las pruebas unitarias (`tests/region.test.mjs`) revisan que los 69 mapas se alcancen caminando, que los bordes empaten sin cortes, que cada puerta tenga regreso y que los líderes vayan subiendo de nivel.

## Pendiente

- Música y efectos de sonido.
- Más zonas opcionales después de la Liga (por ahora, después de ser campeón quedan las leyendas de la Bruma).

## Sobre `original/pokediamond`

El submódulo apunta a la decompilación pública `pret/pokediamond` y se conserva como referencia, pero **el juego no lo usa**: esa decompilación no incluye gráficos, mapas ni textos (se extraen de una ROM que el proyecto no distribuye). Más detalle en [ORIGINAL-CODE.md](ORIGINAL-CODE.md).

Versiones anteriores: `respaldo/sinnoh-reborn-v2` (primer prototipo) y `respaldo/etapa1-ds` (Etapa 1 con doble pantalla).
