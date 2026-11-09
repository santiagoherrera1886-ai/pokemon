# Alborada · Auditoría de arte 3D — revisión transversal

Rama: \`feature/retro-bruma-visual\`. **No modificar producción sin revisión.**

## Objetivo artístico

La dirección artística aprobada por el usuario es un RPG de aventura 3D estilizado inspirado en las láminas de fantasía retro Alborada. **No** una aplicación con sprites 2D pegados ni un diorama de plastilina genérico. Los detalles y materiales deben ser geometría auténtica o sombreado nativo Three.js; la interfaz debe conservar la personalidad 16-bit, la lectura y la doble pantalla.

### Sistema de arte integrado

| Área | Alcance verificable | Archivos |
|---|---|---|
| 27 personajes/arquetipos humanos | Todo \`LOOKS\` recibe insignias, apliques y accesorios 3D vinculados al rig, diferenciados según oficio (profesores, curanderas, rivales, jefes, guardias, empleados, protagonista, etc.) | \`src/render3d/art-direction.js\`, \`people.js\` |
| 37 mapas | Todos mantienen su geometría, colisión y objetos actuales; se agregan adornos 3D no sólidos por bioma y placas/molduras en interiores (posada, laboratorio, gimnasios, Liga, hogares). | \`art-direction.js\`, \`environment.js\` |
| 8 arenas de batalla | Cada terreno tiene plataformas 3D, pilares, detalles y *escenografía de fondo distinta*. Se reemplazó la fila de 26 conos idénticos por árboles de copas facetadas, escollos, vegetación costera o formaciones cristalinas; los gimnasios/Liga añaden arquitectura. | \`art-direction.js\`, \`renderer.js\` |
| Criaturas | 62 cuerpos 3D; nueve iniciales con esculturas propias y sus tres etapas; las demás mantienen cuerpos voxel volumétricos. | \`creatures3d.js\`, \`starter-evolutions.js\`, \`sculpt.js\` |
| Formas Alba | Transformaciones con seis espinas volumétricas y efectos por tipo, manteniendo condiciones y estadísticas originales. | \`alba.js\` |
| Retratos y menús | Atlas de 43 ilustraciones originales ya conectado al bestiario; interfaz índigo, crema y oro 16-bit. | \`retro-reference.js\`, \`creatures.js\`, \`retro-bruma.css\` |

### Reglas preservadas

- Las colisiones y la lógica de puertas nunca se modifican en la decoración.
- NPC y protagonista conservan \`limbs\`, \`head\`, \`eyes\`, caminar/correr/parpadear.
- Los nombres, estadísticas, ataques, evoluciones, IA, objetos, diálogos y guardados no cambian.
- La escenografía del combate vive fuera de la lógica que calcula daño, captura y experiencia.
- Los recursos decorativos estáticos pasan por \`r.batch\` para reducir llamadas de dibujo.

## Pruebas efectuadas

**Unitarias:** \`npm run build\` y \`npm run test:unit\` — **41/41 PASS**. Una prueba dedicada inspecciona todos los 27 roles, los 37 mapas y los ocho terrenos de combate, incluido que las decoraciones no mutan \`tiles\`, \`objects\` ni \`warps\`.

**Navegador real (Chromium/WebGL):** pruebas visuales de poblado Brisal, Posada y Cueva en modo clásico y 3D, más batallas con Brotelo, Brasín y Charquín. Todas las escenas de esa selección funcionaron sin errores JS. Antes del último ajuste visual, una auditoría adicional revisó 11 mapas consecutivos y se interrumpió al intentar el duodécimo; el mapa Liga fue comprobado después de forma aislada. No se afirma haber terminado la prueba E2E de toda la historia.

## Faltantes importantes (no presentar como terminados)

1. **Humanos:** se actualizaron 27 arquetipos mediante accesorios geométricos, pero la base de rostro/cuerpo/peinado del motor sigue siendo compartida. Faltan modelos hechos a medida por personaje importante, expresiones, retratos y animaciones específicas.
2. **Mapas:** los 37 tienen nueva ornamentación; las fachadas/interiores todavía comparten generadores procedurales. La distribución y gran parte del mobiliario siguen siendo los de Claude. Falta identidad arquitectónica artesanal por ciudad.
3. **Criaturas:** 9 iniciales redibujados volumétricamente; los otros 53 siguen tomando su silueta base del escultor existente y el arte de póster solo cubre 43 de 62 retratos frontales. Falta cerrar las 19 especies restantes, vistas traseras y animaciones únicas.
4. **Combates:** hay nuevos biomas tridimensionales, pero faltan efectos de cámara, transiciones particulares y escenografía narrativa de jefes.
5. **Cobertura E2E:** la prueba unitaria cubre datos/geometría de todas las áreas; la inspección visual de navegador se realizó en un conjunto representativo, no en cada evento de la historia.

## Cómo revisar y publicar

1. Abrir la vista previa **Vercel Preview** vinculada a la última confirmación de \`feature/retro-bruma-visual\`.
2. Comparar el pueblo, una cueva, la posada y un combate real con la dirección artística de las diez láminas.
3. Si el resultado está aprobado, fusionar **PR #2** a \`main\`. Vercel creará un despliegue de producción.
4. Si el resultado no convence, mantener producción sin modificar. No realizar cambios destructivos de guardados para iterar arte.
