# ALBORADA 3D · BRUMA RETRO
## Implementación en el motor (no un filtro aplicado sobre figuras anteriores)

**Rama lista para revisión:** \`feature/retro-bruma-visual\`. Producción \`main\` no se modifica automáticamente.

### Qué cambió en 3D de verdad

- **Todas las 62 especies:** \`src/render3d/sculpt.js\` exporta \`voxelSculptGeometry(sculpt, step)\`, una geometría Three.js no indexada de miles de triángulos con caras cuadradas de vóxel, normales de seis direcciones y colores por cara. Muestrea el SDF original de cada criatura, crea caras **solo cuando están expuestas al exterior** y las coloca en XYZ con profundidad real. No utiliza \`PlaneGeometry\`, \`SpriteMaterial\`, imágenes 2D ni \`billboard\` para representar el cuerpo.
- **Criaturas:** \`src/render3d/creatures3d.js\` ahora utiliza esas geometrías para cada modelo y aplica un contorno negro-violeta mediante un casco de malla 3D (\`BackSide\`). Mantiene las piezas individuales (ojos, alas, cola, animaciones) y posiciones del motor actual.
- **Protagonista y NPC:** \`src/render3d/people.js\` usa una cabeza chibi cúbica con esquinas cortas y geometrías de bajo poligonaje para el cabello, la ropa y las extremidades. Se mantienen huesos/grupos animados.
- **Escenarios:** \`src/render3d/resources.js\` reduce las primitivas suaves a formas angulares y añade un cristal octaédrico. Todo el mundo continúa siendo geometría 3D, incluidas las piezas de la casa, árboles, mobiliario y demás.
- **Pantalla de inicio:** \`src/render3d/title.js\` reconstruye los colores del cielo, montes, bosque, agua, vegetación y piedras en un atardecer violeta; añade 22 formaciones cristalinas verdaderamente tridimensionales y una orilla de bloques elevados.
- **Forma Alba:** \`src/render3d/alba.js\` utiliza piezas facetadas y agrega seis cristales volumétricos que cambian la silueta, sin alterar su funcionamiento ni condiciones.
- **Materiales:** \`src/render3d/stylize.js\` usa sombreado de caras planas (flat) y acabados mates con tonalidad limitada, no materiales de plastilina brillante.

### Lo que se preserva

Los IDs de las criaturas, mapas, diálogos, lucha, decisiones, controles, interacción, puertas, guardados, progreso y datos antiguos permanecen intactos. El modo clásico 2D continúa disponible.

### Pruebas

- \`npm run build\`: completado.
- \`npm run test:unit\`: **36/36**.
- \`tests/retro-3d.test.mjs\`: verifica que las 62 criaturas contienen geometría voxel auténtica en X/Y/Z, normales, contorno 3D, las seis espinas de Forma Alba y la cabeza cúbica chibi.
- Chromium escritorio y móvil: apertura, pantalla de inicio, comienzo de partida, habitación y CSS, sin errores JS en los escenarios probados.

### Lo que aún NO afirma esta implementación

Es una **evolución visual tridimensional del código existente**, no un modelado individual manual desde cada una de las diez láminas. La forma base de cada criatura procede del escultor actual y ahora tiene un tratamiento volumétrico 16-bit; para una equivalencia artística exacta con cada hoja de referencia siguen faltando trabajo manual por especie, siluetas específicas de Forma Alba y texturas/decoraciones nuevas. No se declara ese trabajo terminado.

### Para desplegar sin sobrescribir producción por error

Abre el Pull Request de la rama y revisa el enlace de Vercel Preview más reciente. Si lo apruebas, fusiónalo con \`main\`. GitHub/Vercel crearán un nuevo despliegue que contiene los archivos 3D actualizados. No basta con desplegar el commit anterior de \`main\`: ese aún presenta los modelos redondeados viejos.
