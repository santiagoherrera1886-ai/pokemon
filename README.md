# Sinnoh Reborn · HD-2D
Proyecto fan de aventura para navegador inspirado en la región de Sinnoh de Pokémon Diamante y Perla (Nintendo DS).

## 🎮 Jugar sin instalar archivos
**https://pokemon-sa-ntiago.vercel.app/**

Selecciona **Comenzar aventura**: el juego no solicita ni descarga una ROM .nds. Se ejecuta directamente en el navegador con un motor de dibujo Canvas 2D.

### Lo que está implementado
- Introducción en habitación, casa del protagonista y conversación con mamá.
- **Pueblo Hojaverde**: cuatro casas con el hogar al sureste y la casa de Barry al noroeste, caminos cruzados, estanque, árboles, cercas y buzones.
- Visita a Barry y viaje por Ruta 201 hacia Lago Veraz.
- Maletín con Turtwig, Chimchar y Piplup y primer combate contra Starly.
- Regreso a casa, laboratorio del profesor Serbal en Pueblo Arena, Ruta 202 y acceso a una representación inicial de Ciudad Jubileo.
- Casas, centro Pokémon, tienda, NPC, captura de Pokémon salvajes, batallas básicas, inventario, equipo y guardado local.
- Controles WASD o flechas, E/Enter interactuar, Shift correr, R equipo, M mapa, Esc cerrar ventanas. En móvil incluye D-pad, A (interactuar) y B (correr).

### Qué **NO** es
**No es Pokémon Diamante/Perla original ni una reproducción completa o exacta.** Los gráficos, escenarios, código, combate e historia más allá del capítulo inicial son un prototipo independiente. No incluye las ocho medallas, postgame, todas las especies, movimientos ni todos los eventos originales. No usa ni carga el código compilado de Nintendo DS en el navegador.

### Código de referencia de Diamante y Perla
La carpeta `original/pokediamond` es un **submódulo Git**, con enlace al proyecto comunitario de decompilación [pret/pokediamond](https://github.com/pret/pokediamond). Está presente en el repositorio para documentación, estudio e investigación; **no** es parte del bundle web de Vercel.

Clona los archivos originales de la comunidad con:
```bash
git clone --recurse-submodules https://github.com/santiagoherrera1886-ai/pokemon.git
```

Consulta [ORIGINAL-CODE.md](ORIGINAL-CODE.md) para requisitos de compilación y límites.

### Código web
- `index.html` interfaz del juego
- `hd2d.css` diseño y controles táctiles
- `hd2d.js` motor de exploración, colisiones, historia, personajes y combates
- `hd2d.html` entrada independiente del mismo juego (referencia)

### Nota legal
Proyecto fan no oficial y no comercial, sin relación con Nintendo, Game Freak ni The Pokémon Company. Los nombres, criaturas y marcas de Pokémon pertenecen a sus titulares respectivos. No se incluyen ni redistribuyen ROM comerciales.
