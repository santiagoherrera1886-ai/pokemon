# Código fuente reconstruido de Pokémon Diamante y Perla

Este repositorio incorpora como **submódulo Git** el proyecto público de decompilación [`pret/pokediamond`](https://github.com/pret/pokediamond).

**Código original disponible en:** [`original/pokediamond`](./original/pokediamond) (enlace a la revisión fijada del proyecto de decompilación).

**Revisión fijada:** `b623abef1b4dfe204ca50aab42447ac00c134290` (rama `master` de `pret/pokediamond` en el momento de incorporarlo).

## Cómo obtener todos los archivos fuente

Clonar con los submódulos:

```bash
git clone --recurse-submodules https://github.com/santiagoherrera1886-ai/pokemon.git
```

Si ya clonaste este proyecto:

```bash
git submodule update --init --recursive
```

Esto trae **el árbol original del proyecto pret**, incluidos sus archivos C, C++, ensamblador, herramientas, definiciones y recursos que el proyecto publique, directamente desde la fuente pública; no los reescribe ni modifica.

## Qué significa y qué no

- La decompilación está **en desarrollo** y apunta al software de **Nintendo DS**. No es un motor JavaScript ni una versión web integrada.
- El submódulo **referencia el repositorio original y una revisión concreta**; no copia físicamente sus aproximadamente 170 MB de archivos al historial de este repositorio. GitHub mostrará el enlace y `git clone --recurse-submodules` traerá su contenido.
- El proyecto original requiere herramientas y dependencias propietarias para algunas compilaciones. Consulta su [`INSTALL.md`](https://github.com/pret/pokediamond/blob/master/INSTALL.md).
- No se incorpora una ROM `.nds` comercial ni se distribuye una copia completa del videojuego.
- El sitio servido por Vercel es un prototipo web independiente: agregar el código de Nintendo DS al repositorio **no hace que el juego original funcione automáticamente** en Vercel.

**Autoría y atribución:** fuente upstream de `pret/pokediamond` y sus colaboradores. La decompilación no fue creada por este proyecto. Los derechos sobre Pokémon, sus datos y marcas pertenecen a sus respectivos titulares.
