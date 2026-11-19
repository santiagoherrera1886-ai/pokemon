# Escenarios de la Pelea hechos en Blender

Estos scripts arman los tres escenarios de la Pelea Puchamon (Isla Flotante, Cráter de Fragua y Templo del Alba)
con Blender como librería de Python (`pip install bpy`). Todo sale de código: no hay modelos ni texturas de terceros.

- `common.py`: utilidades (coordenadas del juego a Blender, horneado de colores y relieve, materiales, exportar).
- `stagelib.py`: piezas de los escenarios (roca en bloques con grietas, pasto que chorrea, costra de lava, piedra
  tallada, mármol, columnas con estrías, estandartes, braseros, árboles, cristales...).
- `isla.py`, `volcan.py`, `templo.py`: cada escenario, del mismo ancho y profundidad que el choque del juego.
- `build_all.sh isla volcan templo`: arma los que se le pidan y los comprime con meshopt (`gltf-transform`).

Con `FAST=1` las texturas y muestras salen a la cuarta parte para revisar rápido. El resultado final se copia a
`assets/pelea/<escenario>.glb` (lo carga `src/render3d/stage-assets.js`).
