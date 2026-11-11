// Especies, movimientos, tabla de tipos, objetos, encuentros y fórmulas de Alborada (contenido original).
import { TYPES, effectiveness, TYPE_ORDER, STATUS } from './types.js';
import { MOVES } from './moves.js';
export { TYPES, effectiveness, TYPE_ORDER, STATUS, MOVES };

const sp = (name, types, b, exp, learn, desc, evo, extra = {}) => ({ name, types, base: { hp: b[0], atk: b[1], def: b[2], spe: b[3] }, exp, learn, desc, evo, ...extra });
export const SPECIES = {
  brotelo: sp('Brotelo', ['planta'], [55, 66, 64, 31], 64, [[1, 'embestida'], [1, 'ceño'], [5, 'absorber'], [7, 'hojarasca'], [11, 'mordisco'], [13, 'polendormilon'], [15, 'escudo'], [20, 'latigazo'], [24, 'chupasavia'], [28, 'golpecuerpo'], [36, 'tormentafloral'], [44, 'rayoclorofila']], 'Un cachorrito de orejas de hoja. Cuando está contento, las hojas de su collar se esponjan.', ['brotoso', 16]),
  brotoso: sp('Brotoso', ['planta'], [72, 86, 84, 38], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'latigazo'], [24, 'chupasavia'], [28, 'golpecuerpo'], [36, 'tormentafloral'], [44, 'rayoclorofila']], 'Corre ligero entre los árboles. Su cola de hojas guarda el rocío de la mañana.', ['bosqueron', 32]),
  bosqueron: sp('Bosquerón', ['planta', 'roca'], [95, 109, 105, 56], 236, [[1, 'latigazo'], [32, 'alud'], [36, 'tormentafloral'], [40, 'terremoto'], [44, 'rayoclorofila']], 'Sus astas florecen con cada amanecer y sus pezuñas de piedra no dejan huella en el bosque.'),
  brasin: sp('Brasín', ['fuego'], [44, 58, 44, 61], 62, [[1, 'arañazo'], [1, 'ceño'], [7, 'brasa'], [11, 'mordisco'], [13, 'ruedaignea'], [15, 'refuerzo'], [20, 'llamarada'], [24, 'fuegofatuo'], [28, 'golpecuerpo'], [32, 'lanzallamas'], [36, 'erupcion'], [44, 'infierno']], 'Un cachorro de león con la cola encendida. La llama de su cabeza crece cuando se emociona.', ['brason', 16]),
  brason: sp('Brasón', ['fuego'], [64, 78, 58, 81], 142, [[1, 'arañazo'], [15, 'refuerzo'], [20, 'llamarada'], [24, 'fuegofatuo'], [28, 'golpecuerpo'], [32, 'lanzallamas'], [36, 'erupcion'], [44, 'infierno']], 'Su melena arde más fuerte cuando protege a los suyos. Las rayas de su lomo nunca se apagan.', ['volcarbon', 32]),
  volcarbon: sp('Volcarbón', ['fuego', 'tierra'], [78, 104, 75, 102], 240, [[1, 'llamarada'], [32, 'lanzallamas'], [34, 'tierraviva'], [36, 'erupcion'], [40, 'terremoto'], [44, 'infierno']], 'Ruge sobre la roca volcánica y la tierra tiembla. Su melena de fuego no quema a sus amigos.'),
  charquin: sp('Charquín', ['agua'], [53, 51, 53, 40], 63, [[1, 'embestida'], [1, 'mirada'], [7, 'chorro'], [11, 'mordisco'], [13, 'copito'], [15, 'escudo'], [20, 'burbujeo'], [24, 'coletazo'], [28, 'ondamental'], [36, 'oleaje'], [44, 'torrente']], 'Una foquita que vive en los charcos de la lluvia. Mueve su cola de pez cuando está feliz.', ['charcomar', 16]),
  charcomar: sp('Charcomar', ['agua'], [68, 70, 72, 55], 142, [[1, 'embestida'], [15, 'escudo'], [20, 'burbujeo'], [24, 'coletazo'], [28, 'ondamental'], [32, 'rayogelido'], [36, 'oleaje'], [44, 'torrente']], 'Se desliza por los ríos como una nutria. Sus aletas brillan cuando el agua está limpia.', ['mareon', 32]),
  mareon: sp('Mareón', ['agua', 'psiquico'], [88, 90, 92, 72], 238, [[1, 'burbujeo'], [32, 'psicorayo'], [34, 'rayogelido'], [36, 'oleaje'], [40, 'barrera'], [44, 'torrente']], 'La gema de su pecho escucha los pensamientos de quien mira el mar. Donde pisa, el agua gira.'),
  pipiu: sp('Pipiú', ['normal', 'volador'], [40, 45, 35, 56], 49, [[1, 'picotazo'], [1, 'ceño'], [5, 'aleteo'], [9, 'arrancon'], [12, 'refuerzo'], [18, 'tajoaereo'], [22, 'tornado'], [26, 'golpecuerpo'], [30, 'posarse']], 'Gorrión parlanchín. Sus alas de punta turquesa brillan al amanecer.', ['pipiolo', 14]),
  pipiolo: sp('Pipiolo', ['normal', 'volador'], [63, 64, 55, 78], 122, [[1, 'aleteo'], [9, 'arrancon'], [18, 'tajoaereo'], [22, 'tornado'], [26, 'golpecuerpo'], [30, 'posarse'], [34, 'derribo'], [40, 'clavado']], 'Vuela en bandadas en forma de flecha. Su canto anuncia la lluvia.'),
  roedin: sp('Roedín', ['normal'], [49, 50, 40, 50], 50, [[1, 'embestida'], [3, 'mirada'], [6, 'mordisco'], [9, 'arrancon'], [13, 'golpecuerpo'], [17, 'rafaga'], [22, 'derribo']], 'Guarda semillas en los cachetes para el invierno.', ['roedon', 15]),
  roedon: sp('Roedón', ['normal'], [72, 78, 62, 72], 120, [[1, 'mordisco'], [9, 'arrancon'], [13, 'golpecuerpo'], [17, 'rafaga'], [22, 'derribo'], [26, 'tarascada'], [30, 'refuerzo'], [36, 'danzaguerrera']], 'Construye diques con ramas. Sus dientes nunca dejan de crecer.'),
  capullin: sp('Capullín', ['bicho'], [45, 30, 35, 45], 39, [[1, 'embestida'], [1, 'hilo'], [5, 'picadura']], 'Oruga que teje hilos brillantes entre las hojas altas.', ['capullado', 7]),
  capullado: sp('Capullado', ['bicho'], [50, 20, 60, 30], 72, [[1, 'escudo'], [7, 'escudo']], 'Un capullo duro. Por dentro se está preparando para volar.', ['alasol', 10]),
  alasol: sp('Alasol', ['bicho', 'volador'], [60, 55, 50, 75], 160, [[1, 'aleteo'], [10, 'aleteo'], [12, 'polendormilon'], [14, 'aguijon'], [18, 'ondamental'], [24, 'tajoaereo'], [28, 'zumbido'], [34, 'tornado']], 'Sus alas dejan polvo dorado. Sólo vuela cuando sale el sol.'),
  setin: sp('Setín', ['planta', 'veneno'], [45, 55, 50, 35], 55, [[1, 'embestida'], [4, 'absorber'], [7, 'hojarasca'], [9, 'escudo'], [12, 'polendormilon'], [14, 'latigazo'], [18, 'toxina'], [22, 'chupasavia'], [26, 'tormentafloral']], 'Un hongo travieso. Esconde el sombrero cuando alguien lo mira.', ['seton', 22]),
  seton: sp('Setón', ['planta', 'veneno'], [70, 82, 72, 45], 150, [[1, 'latigazo'], [18, 'toxina'], [22, 'chupasavia'], [26, 'tormentafloral'], [30, 'golpecuerpo'], [34, 'boladelodo']], 'Sus esporas hacen que las flores del bosque crezcan el doble.'),
  chispaz: sp('Chispaz', ['electrico'], [40, 52, 40, 72], 58, [[1, 'embestida'], [1, 'ceño'], [5, 'chispa'], [9, 'corrientazo'], [12, 'refuerzo'], [16, 'arrancon'], [20, 'puñovoltio'], [24, 'rayo']], 'Una bolita de estática. Se pega al pelo de quien la acaricia.', ['voltaz', 20]),
  voltaz: sp('Voltaz', ['electrico'], [62, 78, 56, 98], 150, [[1, 'chispa'], [12, 'refuerzo'], [16, 'arrancon'], [20, 'puñovoltio'], [24, 'rayo'], [30, 'golpecuerpo'], [38, 'tronamenta']], 'Corre tan rápido que deja chispas en el aire. Se carga con las tormentas.'),
  guijarrin: sp('Guijarrín', ['roca', 'tierra'], [40, 70, 80, 20], 60, [[1, 'embestida'], [1, 'escudo'], [5, 'pedrada'], [9, 'barrazo'], [12, 'pulido'], [14, 'golpecuerpo'], [18, 'tranque'], [24, 'alud'], [30, 'terremoto']], 'Rueda cuesta abajo para viajar. Si se asusta, se queda quieto como una piedra.', ['penon', 20]),
  penon: sp('Peñón', ['roca', 'tierra'], [62, 98, 112, 32], 150, [[1, 'pedrada'], [14, 'golpecuerpo'], [18, 'tranque'], [24, 'alud'], [30, 'terremoto'], [32, 'derribo'], [38, 'filodepiedra']], 'Duerme en las paredes de las cuevas. Lo confunden con una roca.'),
  medusin: sp('Medusín', ['agua', 'veneno'], [45, 45, 45, 58], 60, [[1, 'chorro'], [1, 'mirada'], [4, 'pinchazo'], [8, 'burbujeo'], [12, 'acido'], [18, 'ondamental'], [22, 'toxina'], [30, 'oleaje']], 'Brilla de noche en el puerto. Los pescadores la siguen para encontrar peces.', ['meduson', 24]),
  meduson: sp('Medusón', ['agua', 'psiquico'], [72, 66, 72, 84], 155, [[1, 'burbujeo'], [12, 'acido'], [18, 'ondamental'], [22, 'toxina'], [28, 'psicorayo'], [30, 'oleaje'], [36, 'boladelodo']], 'Sus tentáculos dibujan figuras en el agua que hipnotizan a quien las mira.'),
  sombrin: sp('Sombrín', ['siniestro', 'fantasma'], [45, 58, 40, 62], 62, [[1, 'zarpazo'], [1, 'ceño'], [5, 'lamida'], [8, 'mordisco'], [12, 'susto'], [15, 'tinieblas'], [20, 'zancadilla'], [28, 'derribo']], 'Vive en las sombras de los rincones. El Equipo Eclipse los entrena.', ['sombrador', 20]),
  sombrador: sp('Sombrador', ['siniestro', 'fantasma'], [70, 84, 60, 88], 155, [[1, 'zarpazo'], [12, 'susto'], [15, 'tinieblas'], [20, 'zancadilla'], [24, 'bolaespectral'], [28, 'tarascada'], [34, 'planmacabro']], 'Se funde con la noche. Sus ojos son lo único que se ve.'),
  mentelin: sp('Mentelín', ['psiquico', 'bicho'], [42, 42, 48, 64], 64, [[1, 'ondamental'], [1, 'mirada'], [6, 'mareo'], [9, 'hipnosis'], [12, 'escudo'], [16, 'polendormilon'], [22, 'psicorayo'], [28, 'zumbido']], 'Una polilla que flota sin mover las alas. Sueña los sueños de los demás.'),
  espejalba: sp('Espejalba', ['agua', 'psiquico'], [100, 100, 100, 92], 300, [[1, 'oleaje'], [1, 'psicorayo'], [1, 'barrera'], [1, 'tajoaereo']], 'La guardiana del Lago Espejo. Su reflejo muestra el cielo de otro mundo.', null, { legendary: true }),

  // ---------------- Familias nuevas de la Bruma
  nivalin: sp('Nivalín', ['agua', 'hielo'], [58, 45, 50, 40], 62, [[1, 'embestida'], [1, 'copito'], [4, 'chorro'], [8, 'mirada'], [12, 'mordiscohelado'], [16, 'burbujeo'], [20, 'carambano'], [24, 'escudo'], [28, 'rayogelido'], [34, 'oleaje'], [40, 'ventisca']], 'Ballenita que nada entre témpanos. Los cristalitos del lomo le crecen cuando está feliz.', ['nivalmar', 20]),
  nivalmar: sp('Nivalmar', ['agua', 'hielo'], [80, 62, 70, 48], 145, [[1, 'chorro'], [1, 'copito'], [12, 'mordiscohelado'], [16, 'burbujeo'], [20, 'carambano'], [24, 'escudo'], [28, 'rayogelido'], [34, 'oleaje'], [40, 'ventisca'], [46, 'torrente']], 'Canta bajo el agua y el mar se congela en figuras de cristal.', ['nivalord', 36]),
  nivalord: sp('Nivalord', ['agua', 'hielo'], [110, 88, 95, 60], 240, [[1, 'mordiscohelado'], [1, 'rayogelido'], [36, 'oleaje'], [40, 'ventisca'], [46, 'torrente']], 'Su lomo es un iceberg que no se derrite. Los barcos lo siguen para encontrar puerto.'),
  michin: sp('Michín', ['psiquico'], [45, 48, 42, 64], 58, [[1, 'arañazo'], [1, 'ternura'], [5, 'mareo'], [9, 'brisahada'], [13, 'hipnosis'], [17, 'ondamental'], [22, 'besito'], [27, 'psicorayo'], [32, 'meditacion'], [38, 'orbitamental']], 'Gatita que sigue con la mirada cosas que nadie más ve. La punta de su cola brilla de noche.', ['mistigato', 18]),
  mistigato: sp('Mistigato', ['psiquico', 'hada'], [62, 70, 58, 88], 140, [[1, 'mareo'], [1, 'brisahada'], [17, 'ondamental'], [22, 'besito'], [27, 'psicorayo'], [32, 'meditacion'], [38, 'orbitamental'], [44, 'destellohada']], 'El aro dorado de su cola guarda los sueños que se le escapan a la gente.', ['orbelina', 36]),
  orbelina: sp('Orbelina', ['psiquico', 'hada'], [85, 96, 78, 112], 236, [[1, 'psicorayo'], [1, 'destellohada'], [36, 'orbitamental'], [40, 'luzdeluna'], [44, 'juegorudo'], [50, 'barrera']], 'Dos lunas pequeñas giran a su alrededor. Dicen que ve el futuro en ellas.'),
  ferlum: sp('Ferlum', ['acero'], [52, 60, 66, 46], 62, [[1, 'embestida'], [1, 'mirada'], [5, 'garrametal'], [9, 'mordisco'], [13, 'corazahierro'], [18, 'cabezahierro'], [24, 'tarascada'], [30, 'destellometal'], [36, 'colazoacero']], 'Cachorro de acero que encontraron en un taller abandonado. Mueve la cola con un tic-tac.', ['ferrox', 22]),
  ferrox: sp('Ferrox', ['acero'], [70, 84, 90, 60], 148, [[1, 'garrametal'], [1, 'mordisco'], [13, 'corazahierro'], [18, 'cabezahierro'], [24, 'tarascada'], [30, 'destellometal'], [36, 'colazoacero'], [42, 'derribo']], 'Patrulla las minas de noche. Sus ojos alumbran como linternas.', ['acerion', 40]),
  acerion: sp('Acerión', ['acero'], [90, 112, 118, 78], 245, [[1, 'cabezahierro'], [1, 'tarascada'], [40, 'colazoacero'], [44, 'destellometal'], [50, 'terremoto']], 'Sus cuernos de oro se forjaron con el primer rayo de sol que tocó la mina.'),
  magmol: sp('Magmol', ['fuego', 'roca'], [55, 58, 68, 30], 64, [[1, 'embestida'], [1, 'pulido'], [6, 'brasa'], [10, 'pedrada'], [14, 'ruedaignea'], [19, 'tranque'], [24, 'puñomagma'], [30, 'alud'], [36, 'erupcion']], 'Se calienta al sol sobre las piedras del volcán. Si lo abrazas, quema un poquito.', ['magmor', 24]),
  magmor: sp('Magmor', ['fuego', 'roca'], [78, 86, 92, 38], 150, [[1, 'brasa'], [1, 'pedrada'], [14, 'ruedaignea'], [19, 'tranque'], [24, 'puñomagma'], [30, 'alud'], [36, 'erupcion'], [42, 'filodepiedra']], 'Por las grietas de su lomo corre lava. Duerme con la panza contra el suelo tibio.', ['magmatron', 40]),
  magmatron: sp('Magmatrón', ['fuego', 'roca'], [105, 128, 110, 48], 245, [[1, 'puñomagma'], [1, 'alud'], [40, 'erupcion'], [44, 'filodepiedra'], [50, 'infierno'], [56, 'terremoto']], 'Golpea el suelo con los puños y abre ríos de lava. Es tranquilo hasta que lo despiertan.'),
  cuarcin: sp('Cuarcín', ['roca', 'hada'], [50, 44, 72, 34], 60, [[1, 'embestida'], [1, 'ternura'], [5, 'pedrada'], [9, 'brisahada'], [13, 'pulido'], [17, 'tranque'], [22, 'besito'], [27, 'lluviadecuarzo'], [33, 'destellohada'], [40, 'filodepiedra']], 'Una geoda con patas. Por dentro guarda cristales que brillan cuando está contento.', ['cuarzon', 26]),
  cuarzon: sp('Cuarzón', ['roca', 'hada'], [72, 66, 100, 42], 150, [[1, 'pedrada'], [1, 'brisahada'], [17, 'tranque'], [22, 'besito'], [27, 'lluviadecuarzo'], [33, 'destellohada'], [40, 'filodepiedra'], [46, 'juegorudo']], 'Los cristales del lomo le crecen una vez al año. Los mineros siguen sus huellas.', ['astrocuarzo', 42]),
  astrocuarzo: sp('Astrocuarzo', ['roca', 'hada'], [100, 90, 130, 50], 245, [[1, 'lluviadecuarzo'], [1, 'destellohada'], [42, 'filodepiedra'], [46, 'juegorudo'], [50, 'luzdeluna'], [54, 'terremoto']], 'Un anillo de polvo de estrellas gira a su alrededor. Cayó del cielo hace mil años.'),
  verdilago: sp('Verdílago', ['planta'], [46, 54, 42, 62], 60, [[1, 'arañazo'], [1, 'ceño'], [5, 'absorber'], [9, 'hojarasca'], [13, 'mordisco'], [17, 'hojanavaja'], [22, 'chupasavia'], [28, 'alientodragon'], [34, 'tormentafloral']], 'Lagartija que se esconde entre las hojas. Si la miras mucho, se pone colorada.', ['foliaton', 18]),
  foliaton: sp('Foliatón', ['planta'], [64, 76, 60, 82], 142, [[1, 'hojarasca'], [1, 'mordisco'], [17, 'hojanavaja'], [22, 'chupasavia'], [28, 'alientodragon'], [34, 'tormentafloral'], [40, 'garradragon']], 'Las hojas de su cabeza giran hacia el sol. Corre en dos patas por el bosque.', ['arborex', 36]),
  arborex: sp('Arbórex', ['planta', 'dragon'], [88, 108, 86, 98], 240, [[1, 'hojanavaja'], [1, 'alientodragon'], [36, 'garradragon'], [40, 'tormentafloral'], [46, 'rayoclorofila'], [52, 'cometa']], 'Bate sus hojas como alas y levanta tormentas de pétalos. Es el rey del bosque viejo.'),
  fatuin: sp('Fatuín', ['fantasma', 'fuego'], [40, 56, 40, 58], 60, [[1, 'lamida'], [1, 'brasa'], [5, 'susto'], [9, 'fuegofatuo'], [13, 'zarpafantasma'], [18, 'farolfatuo'], [24, 'llamarada'], [30, 'bolaespectral'], [36, 'lanzallamas']], 'Llamita que flota en los caminos de noche. Si la sigues, te lleva a casa... casi siempre.', ['candelo', 22]),
  candelo: sp('Candelo', ['fantasma', 'fuego'], [58, 76, 58, 74], 145, [[1, 'brasa'], [1, 'susto'], [13, 'zarpafantasma'], [18, 'farolfatuo'], [24, 'llamarada'], [30, 'bolaespectral'], [36, 'lanzallamas'], [42, 'velosombrio']], 'Camina con su farol buscando almas perdidas para guiarlas.', ['velaria', 38]),
  velaria: sp('Velaria', ['fantasma', 'fuego'], [82, 108, 76, 96], 240, [[1, 'farolfatuo'], [1, 'bolaespectral'], [38, 'velosombrio'], [42, 'lanzallamas'], [48, 'infierno'], [54, 'tinieblas']], 'Sus faroles flotan solos. Cada uno guarda la luz de un viajero que ayudó.'),
  sierpin: sp('Sierpín', ['veneno'], [44, 52, 44, 58], 58, [[1, 'pinchazo'], [1, 'mirada'], [5, 'acido'], [9, 'mordisco'], [13, 'colmillotoxico'], [18, 'toxina'], [24, 'tarascada'], [30, 'boladelodo']], 'Se enrosca en las ramas y se hace pasar por una enredadera.', ['serpentil', 20]),
  serpentil: sp('Serpentil', ['veneno', 'siniestro'], [62, 76, 60, 78], 142, [[1, 'acido'], [1, 'mordisco'], [13, 'colmillotoxico'], [18, 'toxina'], [24, 'tarascada'], [30, 'boladelodo'], [36, 'tinieblas'], [42, 'planmacabro']], 'Hipnotiza a sus presas balanceando la cabeza despacio.', ['cobrumbra', 38]),
  cobrumbra: sp('Cobrumbra', ['veneno', 'siniestro'], [84, 104, 80, 100], 240, [[1, 'colmillotoxico'], [1, 'tarascada'], [38, 'boladelodo'], [42, 'tinieblas'], [48, 'planmacabro'], [52, 'terremoto']], 'Los ojos de su capucha asustan a cualquiera. Nadie le ha visto los de verdad.'),
  lanin: sp('Lanín', ['lucha'], [56, 62, 52, 44], 60, [[1, 'embestida'], [1, 'ceño'], [5, 'patadon'], [9, 'jab'], [13, 'calentamiento'], [17, 'doblepatada'], [22, 'topetazo'], [28, 'gancho'], [34, 'golpecuerpo']], 'Borreguito que entrena cabezazos contra las cercas. Su lana amortigua las caídas.', ['carnerazo', 18]),
  carnerazo: sp('Carnerazo', ['lucha'], [74, 90, 68, 58], 145, [[1, 'patadon'], [1, 'jab'], [13, 'calentamiento'], [17, 'doblepatada'], [22, 'topetazo'], [28, 'gancho'], [34, 'golpecuerpo'], [40, 'combofinal']], 'Se para en dos patas para boxear. Nunca deja un reto sin responder.', ['arieton', 34]),
  arieton: sp('Arietón', ['lucha', 'tierra'], [98, 124, 88, 74], 242, [[1, 'topetazo'], [1, 'gancho'], [34, 'terremoto'], [40, 'combofinal'], [46, 'danzaguerrera'], [50, 'tierraviva']], 'Campeón de los cerros. Su cinturón de oro es de una pelea que nadie recuerda haber ganado.'),
  truenin: sp('Truenín', ['electrico', 'volador'], [42, 50, 38, 66], 58, [[1, 'picotazo'], [1, 'ceño'], [5, 'chispa'], [9, 'aleteo'], [13, 'corrientazo'], [17, 'picotrueno'], [22, 'tajoaereo'], [28, 'rayo'], [34, 'tornado']], 'Polluelo que nace en las nubes de tormenta. Su cresta suelta chispas cuando estornuda.', ['tormavis', 20]),
  tormavis: sp('Tormavis', ['electrico', 'volador'], [62, 74, 56, 92], 145, [[1, 'chispa'], [1, 'aleteo'], [13, 'corrientazo'], [17, 'picotrueno'], [22, 'tajoaereo'], [28, 'rayo'], [34, 'tornado'], [40, 'clavado']], 'Vuela dentro de las nubes y sale con un trueno. Los pilotos lo saludan.', ['elestrix', 38]),
  elestrix: sp('Elestrix', ['electrico', 'volador'], [84, 104, 74, 118], 240, [[1, 'picotrueno'], [1, 'tajoaereo'], [38, 'rayo'], [42, 'clavado'], [48, 'tronamenta'], [54, 'tornado']], 'Cuando abre las alas el cielo se oscurece. Sus plumas guardan rayos.'),

  // ---------------- Leyendas de la Bruma (después de la Liga)
  brumalia: sp('Brumalia', ['fantasma', 'hada'], [100, 96, 100, 104], 300, [[1, 'velodebruma'], [1, 'destellohada'], [1, 'luzdeluna'], [1, 'hipnosis']], 'La guardiana del Bosque Bruma. Donde camina, la niebla toma forma de flores.', null, { legendary: true }),
  fraguon: sp('Fraguón', ['fuego', 'acero'], [110, 120, 110, 70], 300, [[1, 'martillofragua'], [1, 'lanzallamas'], [1, 'corazahierro'], [1, 'terremoto']], 'Duerme dentro del volcán. Con su lomo de yunque forjó las primeras herramientas de la región.', null, { legendary: true }),
  glaciel: sp('Glaciel', ['hielo', 'volador'], [96, 104, 92, 112], 300, [[1, 'alaglaciar'], [1, 'ventisca'], [1, 'tajoaereo'], [1, 'posarse']], 'Cóndor de hielo que vuela sobre los nevados. Su sombra trae la primera nevada.', null, { legendary: true }),
  dracalba: sp('Dracalba', ['dragon', 'psiquico'], [106, 112, 100, 104], 320, [[1, 'rayodelalba'], [1, 'psicorayo'], [1, 'danzadragon'], [1, 'respiro']], 'El dragón del amanecer. Dicen que cada mañana el sol sale porque él lo despierta.', null, { legendary: true }),
  // ---- Fauna de Alborada: nueve familias inspiradas en los animales del país ----
  arrierin: sp('Arrierín', ['bicho'], [45, 55, 50, 48], 56, [[1, 'picadura'], [1, 'ceño'], [5, 'hilo'], [8, 'arrancon'], [12, 'tijeretazo'], [16, 'escudo'], [20, 'aguijon'], [25, 'barrazo'], [30, 'zumbido']], 'Carga hojas diez veces más grandes que ella y nunca se queja. Sigue el rastro de su fila aunque llueva.', ['arrieron', 18]),
  arrieron: sp('Arrierón', ['bicho', 'tierra'], [78, 95, 88, 62], 160, [[1, 'tijeretazo'], [20, 'aguijon'], [25, 'barrazo'], [30, 'zumbido'], [34, 'tranque'], [38, 'tierraviva'], [44, 'terremoto'], [50, 'combofinal']], 'Abre caminos bajo tierra con sus mandíbulas. Un solo Arrierón puede sostener el techo de un hormiguero entero.'),
  colibrin: sp('Colibrín', ['volador', 'hada'], [40, 48, 40, 85], 58, [[1, 'picotazo'], [1, 'mirada'], [6, 'aleteo'], [10, 'besito'], [14, 'rafaga'], [18, 'brisahada'], [22, 'tajoaereo'], [26, 'ternura']], 'Bate las alas tan rápido que suena como un moscardón. Duerme colgado de una rama, tieso como una hoja seca.', ['colibron', 22]),
  colibron: sp('Colibrón', ['volador', 'hada'], [68, 80, 64, 122], 172, [[1, 'tajoaereo'], [22, 'tajoaereo'], [26, 'ternura'], [30, 'destellohada'], [36, 'tornado'], [42, 'luzdeluna'], [48, 'clavado'], [54, 'juegorudo']], 'Su garganta cambia de color según de dónde le dé el sol. Puede quedarse quieto en el aire durante horas.'),
  doradita: sp('Doradita', ['veneno'], [48, 58, 46, 62], 58, [[1, 'arañazo'], [1, 'chillido'], [6, 'acido'], [10, 'pinchazo'], [14, 'boladelodo'], [18, 'toxina'], [23, 'doblepatada'], [28, 'colmillotoxico']], 'Su piel brilla como el oro mojado. Ese brillo no es adorno: es un aviso para que nadie se la coma.', ['doradon', 24]),
  doradon: sp('Doradón', ['veneno', 'agua'], [82, 92, 74, 88], 170, [[1, 'colmillotoxico'], [28, 'colmillotoxico'], [32, 'burbujeo'], [36, 'oleaje'], [40, 'acido'], [46, 'torrente'], [52, 'toxina']], 'Vive donde el río nace. Dicen que el agua que toca un Doradón queda limpia de todo lo demás.'),
  gurrin: sp('Gurrín', ['tierra'], [52, 56, 70, 38], 58, [[1, 'embestida'], [1, 'escudo'], [6, 'barrazo'], [10, 'arañazo'], [14, 'tranque'], [18, 'cabezazo'], [23, 'tierraviva'], [28, 'pulido']], 'Cuando se asusta se hace una bolita perfecta y rueda cuesta abajo hasta donde lo lleve la pendiente.', ['gurron', 26]),
  gurron: sp('Gurrón', ['tierra', 'acero'], [85, 88, 128, 46], 172, [[1, 'tranque'], [28, 'pulido'], [32, 'cabezahierro'], [36, 'garrametal'], [42, 'terremoto'], [48, 'corazahierro'], [54, 'colazoacero']], 'Su caparazón de bandas aguanta una pedrada sin despeinarse. Cava túneles que duran generaciones.'),
  cangrejin: sp('Cangrejín', ['agua', 'roca'], [50, 66, 72, 36], 60, [[1, 'arañazo'], [1, 'ceño'], [6, 'burbujeo'], [10, 'pedrada'], [14, 'tranque'], [18, 'tijeretazo'], [23, 'chorro'], [28, 'filodepiedra']], 'Camina de lado por la playa y se mete en cualquier hueco. Su muela derecha siempre es más grande que la izquierda.', ['cangrejon', 25]),
  cangrejon: sp('Cangrejón', ['agua', 'roca'], [80, 112, 106, 48], 175, [[1, 'tijeretazo'], [28, 'filodepiedra'], [32, 'oleaje'], [38, 'alud'], [44, 'gancho'], [50, 'torrente'], [56, 'combofinal']], 'Su muela grande parte un coco de un solo golpe. Los pescadores dicen que marca la marea con ella.'),
  perecin: sp('Perecín', ['planta'], [60, 48, 58, 26], 56, [[1, 'arañazo'], [1, 'arrullo'], [6, 'absorber'], [10, 'hojarasca'], [14, 'escudo'], [18, 'chupasavia'], [23, 'polendormilon'], [28, 'latigazo']], 'Se demora un día entero en cambiar de rama y no le ve el problema. En su pelo crece musgo de verdad.', ['perezon', 24]),
  perezon: sp('Perezón', ['planta', 'normal'], [102, 78, 92, 34], 166, [[1, 'latigazo'], [28, 'latigazo'], [32, 'respiro'], [36, 'golpecuerpo'], [42, 'hojanavaja'], [48, 'tormentafloral'], [54, 'rayoclorofila']], 'Lleva encima un jardín completo: musgo, hongos y hasta insectos que viven en su pelo. Nunca tiene afán.'),
  anteojin: sp('Anteojín', ['normal'], [62, 62, 56, 44], 60, [[1, 'arañazo'], [1, 'ceño'], [7, 'mordisco'], [11, 'refuerzo'], [15, 'golpecuerpo'], [20, 'calentamiento'], [25, 'cabezazo'], [31, 'jab']], 'Las manchas claras alrededor de sus ojos parecen gafas. Cada cachorro las tiene distintas, como una firma.', ['anteojon', 30]),
  anteojon: sp('Anteojón', ['normal', 'lucha'], [100, 108, 86, 62], 180, [[1, 'jab'], [31, 'jab'], [35, 'gancho'], [40, 'patadon'], [46, 'derribo'], [52, 'combofinal'], [58, 'granestallido']], 'Sube a los árboles más altos del páramo buscando frutos. De pie es más alto que cualquier entrenador.'),
  orugazul: sp('Orugazul', ['bicho'], [42, 38, 44, 34], 44, [[1, 'embestida'], [1, 'hilo'], [5, 'picadura'], [9, 'escudo'], [13, 'absorber']], 'Mastica hojas todo el día sin levantar la cabeza. Su piel azul se ve casi negra entre la sombra.', ['mariposol', 16]),
  mariposol: sp('Mariposol', ['bicho', 'volador'], [66, 62, 66, 98], 150, [[1, 'aleteo'], [16, 'zumbido'], [20, 'polendormilon'], [24, 'tajoaereo'], [30, 'psicorayo'], [36, 'tornado'], [42, 'destellohada'], [48, 'ondamental']], 'Sus alas son de un azul que encandila al sol. Cuando las cierra desaparece: por debajo son pardas como la corteza.'),
  condorin: sp('Condorín', ['volador'], [58, 62, 52, 66], 64, [[1, 'picotazo'], [1, 'chillido'], [7, 'aleteo'], [12, 'rafaga'], [17, 'mirada'], [22, 'tajoaereo'], [28, 'posarse'], [34, 'clavado']], 'Todavía no vuela bien, pero ya se para en el borde del precipicio a mirar el valle horas enteras.', ['condoral', 38]),
  condoral: sp('Condoral', ['volador', 'acero'], [92, 110, 96, 104], 200, [[1, 'clavado'], [38, 'clavado'], [42, 'garrametal'], [46, 'tornado'], [52, 'destellometal'], [58, 'tajoaereo'], [64, 'cabezahierro']], 'Abre las alas y tapa el sol de un pueblo entero. Planea de una cordillera a la otra sin mover una pluma.'),
};

export const STARTERS = ['brotelo', 'brasin', 'charquin'];
export const RIVAL_PICK = { brotelo: 'brasin', brasin: 'charquin', charquin: 'brotelo' };
// Forma evolucionada del inicial del rival según el nivel.
export function rivalForm(base, level) {
  let s = base;
  while (SPECIES[s].evo && level >= SPECIES[s].evo[1]) s = SPECIES[s].evo[0];
  return s;
}

// Los objetos y las tiendas viven en items.js.

export const ENCOUNTERS = {
  sendero1: { rate: 0.12, list: [['pipiu', 2, 4, 50], ['roedin', 2, 4, 40], ['capullin', 2, 3, 10], ['fatuin', 3, 4, 14, 'noche']] },
  lago: { rate: 0.12, list: [['pipiu', 2, 4, 40], ['capullin', 2, 4, 35], ['roedin', 3, 4, 25], ['michin', 3, 4, 12], ['fatuin', 3, 5, 18, 'noche']] },
  ruta2: { rate: 0.12, list: [['pipiu', 4, 6, 30], ['roedin', 4, 6, 25], ['setin', 4, 6, 25], ['capullin', 4, 5, 20], ['verdilago', 4, 6, 16], ['sierpin', 4, 6, 14]] },
  ruta3: { rate: 0.12, list: [['chispaz', 8, 10, 35], ['roedin', 8, 10, 25], ['pipiu', 9, 11, 20], ['setin', 8, 10, 20], ['lanin', 8, 10, 16], ['truenin', 8, 10, 12]] },
  cueva: { rate: 0.09, list: [['guijarrin', 9, 12, 44], ['sombrin', 10, 12, 26], ['anteojin', 10, 12, 20], ['mentelin', 10, 11, 16], ['magmol', 10, 12, 16], ['ferlum', 10, 12, 13], ['cuarcin', 10, 12, 8]] },
  ruta4: { rate: 0.12, list: [['medusin', 14, 16, 30], ['chispaz', 14, 16, 25], ['pipiolo', 15, 17, 25], ['guijarrin', 14, 16, 20], ['nivalin', 14, 16, 18], ['truenin', 14, 16, 10], ['fatuin', 15, 17, 20, 'noche']] },
  ruta5: { rate: 0.12, list: [['sombrador', 44, 47, 25], ['mentelin', 44, 46, 20], ['voltaz', 45, 47, 20], ['seton', 45, 47, 15], ['penon', 45, 47, 15], ['arborex', 44, 46, 10], ['arieton', 45, 47, 10], ['cobrumbra', 44, 46, 10], ['orbelina', 44, 46, 8], ['astrocuarzo', 44, 46, 8], ['velaria', 45, 47, 16, 'noche']] },
  // Zonas opcionales: selva del oeste, costa del sur, desierto y volcán.
  ruta12: { rate: 0.12, list: [['arrierin', 11, 14, 22], ['orugazul', 11, 13, 20], ['setin', 11, 13, 16], ['perecin', 11, 14, 16], ['verdilago', 11, 13, 12], ['michin', 12, 14, 10], ['colibrin', 12, 15, 12], ['sombrin', 12, 14, 14, 'noche']] },
  ruta13: { rate: 0.12, list: [['doradita', 12, 15, 22], ['arrierin', 13, 16, 18], ['perecin', 12, 15, 16], ['mariposol', 16, 17, 10], ['verdilago', 12, 15, 14], ['sierpin', 12, 14, 12], ['colibrin', 13, 16, 12], ['fatuin', 13, 15, 14, 'noche']] },
  ruta14: { rate: 0.12, list: [['cangrejin', 5, 8, 24], ['pipiu', 5, 7, 22], ['roedin', 5, 7, 18], ['medusin', 5, 8, 18], ['orugazul', 5, 7, 14], ['capullin', 5, 6, 10], ['sombrin', 6, 8, 12, 'noche']] },
  ruta15: { rate: 0.12, list: [['gurrin', 14, 17, 26], ['guijarrin', 14, 17, 20], ['sierpin', 14, 16, 16], ['arrieron', 18, 19, 10], ['ferlum', 14, 17, 12], ['magmol', 15, 17, 12], ['cuarcin', 15, 17, 8], ['fatuin', 15, 17, 14, 'noche']] },
  volcan: { rate: 0.12, list: [['magmol', 17, 20, 26], ['gurrin', 17, 20, 18], ['guijarrin', 17, 19, 16], ['ferlum', 17, 20, 14], ['arrieron', 19, 21, 10], ['fatuin', 18, 20, 12], ['cuarcin', 18, 20, 8], ['sombrin', 17, 19, 12, 'noche']] },
  // Las cuatro puntas del mapa: cabo, glaciar, playa larga, banco de arena, ruinas y camino de piedra.
  ruta16: { rate: 0.12, list: [['colibron', 28, 31, 20], ['cangrejon', 28, 31, 18], ['meduson', 28, 31, 16], ['pipiolo', 28, 30, 14], ['tormavis', 28, 31, 14], ['nivalmar', 28, 30, 12], ['candelo', 29, 31, 12, 'noche']] },
  ruta17: { rate: 0.12, list: [['condorin', 40, 42, 22], ['nivalord', 40, 43, 20], ['anteojon', 40, 43, 16], ['arieton', 40, 42, 14], ['cuarzon', 40, 41, 12], ['acerion', 41, 43, 12], ['velaria', 41, 43, 12, 'noche']] },
  pico: { rate: 0.12, list: [['condoral', 44, 47, 14], ['condorin', 42, 44, 20], ['nivalord', 42, 45, 18], ['anteojon', 42, 45, 14], ['acerion', 42, 45, 12], ['astrocuarzo', 43, 45, 12], ['velaria', 43, 45, 10, 'noche']] },
  ruta18: { rate: 0.12, list: [['cangrejin', 9, 12, 26], ['pipiu', 9, 11, 20], ['medusin', 9, 12, 20], ['colibrin', 10, 12, 14], ['roedin', 9, 11, 14], ['nivalin', 10, 12, 10], ['sombrin', 10, 12, 12, 'noche']] },
  ruta19: { rate: 0.12, list: [['cangrejon', 25, 27, 24], ['cangrejin', 22, 24, 16], ['meduson', 24, 25, 18], ['nivalmar', 22, 25, 18], ['doradon', 24, 26, 10], ['pipiolo', 22, 24, 14], ['sombrador', 23, 25, 12, 'noche']] },
  ruta20: { rate: 0.12, list: [['arrierin', 16, 18, 20], ['perecin', 16, 19, 18], ['doradita', 16, 19, 16], ['mariposol', 17, 19, 12], ['setin', 16, 19, 14], ['colibrin', 17, 19, 12], ['gurrin', 17, 19, 10], ['fatuin', 17, 19, 14, 'noche']] },
  ruinas: { rate: 0.12, list: [['mariposol', 20, 23, 20], ['arrieron', 20, 23, 18], ['perezon', 24, 25, 10], ['mistigato', 20, 23, 14], ['doradon', 24, 25, 10], ['cuarcin', 20, 23, 12], ['foliaton', 20, 23, 12], ['sombrador', 20, 23, 14, 'noche']] },
  ruta21: { rate: 0.12, list: [['gurron', 38, 41, 20], ['anteojon', 38, 41, 14], ['arieton', 38, 41, 16], ['penon', 38, 40, 14], ['condorin', 36, 38, 12], ['cobrumbra', 38, 41, 12], ['orbelina', 38, 40, 10], ['velaria', 38, 41, 12, 'noche']] },
  // La región del este y del norte: Ruta 6 a Ruta 11.
  ruta6: { rate: 0.12, list: [['meduson', 26, 29, 30], ['nivalmar', 26, 29, 22], ['pipiolo', 26, 28, 20], ['voltaz', 26, 28, 18], ['tormavis', 27, 29, 12], ['roedon', 26, 28, 12], ['candelo', 27, 29, 16, 'noche']] },
  ruta7: { rate: 0.12, list: [['sombrador', 30, 32, 25], ['mentelin', 30, 33, 22], ['serpentil', 30, 32, 18], ['foliaton', 30, 32, 16], ['mistigato', 30, 32, 12], ['alasol', 30, 32, 12], ['candelo', 30, 33, 22, 'noche']] },
  ruta8: { rate: 0.12, list: [['anteojon', 33, 35, 22], ['carnerazo', 33, 35, 20], ['perezon', 33, 35, 14], ['roedon', 33, 35, 14], ['colibron', 33, 35, 12], ['seton', 33, 35, 12], ['magmor', 33, 35, 10], ['sombrador', 33, 35, 12, 'noche']] },
  ruta9: { rate: 0.12, list: [['nivalmar', 36, 38, 24], ['anteojon', 36, 39, 16], ['ferrox', 36, 39, 16], ['cuarzon', 36, 39, 14], ['condorin', 36, 38, 12], ['arieton', 37, 39, 12], ['nivalord', 38, 40, 4], ['velaria', 38, 40, 10, 'noche']] },
  ruta10: { rate: 0.12, list: [['arborex', 40, 42, 18], ['cuarzon', 40, 41, 18], ['orbelina', 40, 42, 16], ['cobrumbra', 40, 42, 16], ['acerion', 41, 43, 12], ['magmatron', 41, 43, 12], ['astrocuarzo', 42, 43, 6], ['velaria', 40, 43, 14, 'noche']] },
  ruta11: { rate: 0.12, list: [['elestrix', 43, 45, 18], ['cobrumbra', 43, 46, 16], ['astrocuarzo', 43, 45, 14], ['arieton', 43, 46, 16], ['acerion', 44, 46, 12], ['nivalord', 44, 46, 10], ['magmatron', 44, 46, 10], ['velaria', 43, 45, 18, 'noche']] }
};
// De noche (19:00 a 4:59) salen las criaturas marcadas con 'noche'; de día, solo las demás.
export const isNightHour = h => h >= 19 || h < 5;
export function encounterList(key, hour) {
  const night = isNightHour(hour);
  return (ENCOUNTERS[key]?.list || []).filter(e => !e[4] || (e[4] === 'noche') === night);
}

// ---------- Fórmulas ----------
// bonus: lo que han sumado las Semillas (permanente, por estadística).
export function calcStats(s, level, bonus = {}) {
  const b = SPECIES[s].base, k = bonus || {};
  return {
    hp: Math.floor(2 * b.hp * level / 100) + level + 10 + (k.hp || 0),
    atk: Math.floor(2 * b.atk * level / 100) + 5 + (k.atk || 0),
    def: Math.floor(2 * b.def * level / 100) + 5 + (k.def || 0),
    spe: Math.floor(2 * b.spe * level / 100) + 5 + (k.spe || 0)
  };
}
export const expForLevel = l => l * l * l;

// Movimientos que conocería una criatura de esa especie y nivel (los últimos 4 aprendidos, recorriendo su línea evolutiva).
function lineOf(s) {
  const line = [s];
  let changed = true;
  while (changed) { changed = false; for (const k in SPECIES) if (SPECIES[k].evo && SPECIES[k].evo[0] === line[0]) { line.unshift(k); changed = true; } }
  return line;
}
export function movesFor(s, level) {
  const seen = [];
  for (const k of lineOf(s)) for (const [l, m] of SPECIES[k].learn) if (l <= level && !seen.includes(m)) seen.push(m);
  return seen.slice(-4);
}

export function makeCreature(s, level) {
  const stats = calcStats(s, level);
  return { sp: s, name: SPECIES[s].name, level, exp: expForLevel(level), hp: stats.hp, stats, moves: movesFor(s, level).map(m => ({ id: m, pp: MOVES[m].pp })) };
}

export function refreshStats(c) {
  const old = c.stats.hp;
  c.stats = calcStats(c.sp, c.level, c.bonus);
  if (c.hp > 0) c.hp = Math.min(c.stats.hp, c.hp + (c.stats.hp - old));
}
