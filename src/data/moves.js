// Movimientos de Alborada: 18 tipos, efectos secundarios, estados y una animación por movimiento.
// anim: tackle, scratch, bite, punch, slash, shot, spray, beam, bolt, rain, pillar, wave, quake, gust, rings,
//       shadow, sting, drain, heal, buff, debuff, powder, sparkle, shield, roar, dragon.
// Campos opcionales: status [id, %], confuse %, stat [{stat, stages, target, chance}], prio, hits [mín, máx],
// recoil (fracción del daño), drain (fracción del daño), heal (fracción de los PS), crit (golpe crítico fácil), protect.
// Duración (cuadros a 60 por segundo) de cada animación; el combate espera eso antes de aplicar el daño.
export const ANIM_FRAMES = { tackle: 26, scratch: 24, bite: 26, punch: 26, slash: 26, shot: 34, spray: 40, beam: 46, bolt: 36, rain: 50, pillar: 44, wave: 50, quake: 50, gust: 42, rings: 40, shadow: 44, sting: 30, drain: 50, heal: 44, buff: 40, debuff: 36, powder: 44, sparkle: 40, shield: 36, roar: 36, dragon: 48, status: 34, alba: 72 };
const s = (stat, stages, target = 'foe', chance = 100) => ({ stat, stages, target, chance });
const m = (name, type, power, acc, pp, anim, extra = {}) => ({ name, type, power, acc, pp, anim, ...extra });

export const MOVES = {
  // ---------------- NORMAL
  embestida: m('Embestida', 'normal', 40, 100, 35, 'tackle', { desc: 'Carga con todo el cuerpo.' }),
  forcejeo: m('Forcejeo', 'normal', 50, 100, 1, 'tackle', { recoil: .25, desc: 'Último recurso: también se hace daño.' }),
  arañazo: m('Arañazo', 'normal', 40, 100, 35, 'scratch', { desc: 'Raya al rival con garras afiladas.' }),
  mordisco: m('Mordisco', 'normal', 50, 95, 25, 'bite', { desc: 'Muerde con fuerza.' }),
  arrancon: m('Arrancón', 'normal', 40, 100, 30, 'tackle', { prio: 1, desc: 'Arranca tan rápido que siempre golpea primero.' }),
  rafaga: m('Ráfaga de Golpes', 'normal', 18, 85, 15, 'punch', { hits: [2, 5], desc: 'Golpea de 2 a 5 veces seguidas.' }),
  golpecuerpo: m('Golpe Cuerpo', 'normal', 70, 100, 15, 'tackle', { status: ['par', 30], desc: 'Se lanza con todo su peso. Puede paralizar.' }),
  cabezazo: m('Cabezazo', 'normal', 70, 100, 15, 'tackle', { confuse: 20, desc: 'Golpe de cabeza que puede confundir.' }),
  derribo: m('Derribo', 'normal', 85, 90, 10, 'tackle', { recoil: .25, desc: 'Embestida brutal que también lo lastima.' }),
  granestallido: m('Gran Estallido', 'normal', 120, 90, 5, 'beam', { desc: 'Libera toda su energía en un rayo enorme.' }),
  ceño: m('Ceño', 'normal', 0, 100, 40, 'debuff', { stat: [s('atk', -1)], desc: 'Mira feo al rival y le baja el Ataque.' }),
  mirada: m('Mirada', 'normal', 0, 100, 30, 'debuff', { stat: [s('def', -1)], desc: 'Mirada intimidante que baja la Defensa.' }),
  chillido: m('Chillido', 'normal', 0, 85, 30, 'roar', { stat: [s('def', -2)], desc: 'Un grito que baja mucho la Defensa.' }),
  refuerzo: m('Refuerzo', 'normal', 0, 100, 20, 'buff', { stat: [s('atk', 1, 'self')], desc: 'Sube su Ataque.' }),
  escudo: m('Escudo', 'normal', 0, 100, 20, 'shield', { stat: [s('def', 1, 'self')], desc: 'Sube su Defensa.' }),
  danzaguerrera: m('Danza Guerrera', 'normal', 0, 100, 20, 'buff', { stat: [s('atk', 2, 'self')], desc: 'Baile de combate que sube mucho el Ataque.' }),
  arrullo: m('Arrullo', 'normal', 0, 55, 15, 'roar', { status: ['dor', 100], desc: 'Canción de cuna que duerme al rival.' }),
  respiro: m('Respiro', 'normal', 0, 100, 10, 'heal', { heal: .5, desc: 'Respira hondo y recupera la mitad de sus PS.' }),
  escudototal: m('Escudo Total', 'normal', 0, 100, 10, 'shield', { prio: 4, protect: true, desc: 'Se protege de todo ataque durante el turno.' }),

  // ---------------- FUEGO
  brasa: m('Brasa', 'fuego', 45, 100, 25, 'shot', { status: ['que', 10], desc: 'Lanza una bola de fuego. Puede quemar.' }),
  ruedaignea: m('Rueda Ígnea', 'fuego', 60, 100, 25, 'tackle', { status: ['que', 10], desc: 'Rueda envuelto en llamas. Puede quemar.' }),
  llamarada: m('Llamarada', 'fuego', 65, 100, 20, 'spray', { status: ['que', 10], desc: 'Chorro de llamas. Puede quemar.' }),
  lanzallamas: m('Lanzallamas', 'fuego', 90, 100, 15, 'beam', { status: ['que', 10], desc: 'Un río de fuego directo al rival.' }),
  erupcion: m('Erupción', 'fuego', 95, 95, 10, 'pillar', { status: ['que', 10], desc: 'Hace estallar el suelo bajo el rival.' }),
  infierno: m('Infierno', 'fuego', 110, 80, 5, 'pillar', { status: ['que', 30], desc: 'Columna de fuego enorme. Quema con facilidad.' }),
  fuegofatuo: m('Fuego Fatuo', 'fuego', 0, 85, 15, 'powder', { status: ['que', 100], desc: 'Llamitas azules que queman al rival.' }),

  // ---------------- AGUA
  chorro: m('Chorro', 'agua', 45, 100, 25, 'spray', { desc: 'Dispara agua a presión.' }),
  burbujeo: m('Burbujeo', 'agua', 65, 100, 20, 'shot', { stat: [s('spe', -1, 'foe', 10)], desc: 'Burbujas que pueden bajar la Velocidad.' }),
  coletazo: m('Coletazo', 'agua', 80, 90, 10, 'slash', { desc: 'Latigazo con la cola llena de agua.' }),
  aguacero: m('Aguacero', 'agua', 80, 100, 10, 'rain', { desc: 'Hace llover a cántaros sobre el rival.' }),
  oleaje: m('Oleaje', 'agua', 95, 95, 10, 'wave', { desc: 'Una ola gigante arrasa al rival.' }),
  torrente: m('Torrente', 'agua', 110, 80, 5, 'beam', { desc: 'Chorro de agua tan fuerte que tumba árboles.' }),

  // ---------------- PLANTA
  absorber: m('Absorber', 'planta', 40, 100, 25, 'drain', { drain: .5, desc: 'Roba energía: recupera la mitad del daño.' }),
  hojarasca: m('Hojarasca', 'planta', 45, 100, 25, 'shot', { desc: 'Lanza hojas filosas.' }),
  latigazo: m('Latigazo', 'planta', 65, 100, 20, 'slash', { desc: 'Golpea con lianas como látigos.' }),
  chupasavia: m('Chupasavia', 'planta', 75, 100, 10, 'drain', { drain: .5, desc: 'Chupa la energía del rival y se cura.' }),
  tormentafloral: m('Tormenta Floral', 'planta', 95, 95, 10, 'rain', { desc: 'Una tormenta de pétalos filosos.' }),
  rayoclorofila: m('Rayo de Clorofila', 'planta', 110, 90, 5, 'beam', { desc: 'Concentra la luz del sol en un rayo verde.' }),
  polendormilon: m('Polen Dormilón', 'planta', 0, 75, 15, 'powder', { status: ['dor', 100], desc: 'Polvillo que duerme al rival.' }),

  // ---------------- ELÉCTRICO
  chispa: m('Chispa', 'electrico', 45, 100, 25, 'shot', { status: ['par', 10], desc: 'Descarga pequeña. Puede paralizar.' }),
  puñovoltio: m('Puño Voltio', 'electrico', 75, 100, 15, 'punch', { status: ['par', 10], desc: 'Puño cargado de electricidad.' }),
  rayo: m('Rayo', 'electrico', 85, 95, 15, 'bolt', { status: ['par', 10], desc: 'Un rayo cae sobre el rival.' }),
  tronamenta: m('Tronamenta', 'electrico', 110, 70, 10, 'bolt', { status: ['par', 30], desc: 'Tormenta eléctrica. Paraliza con facilidad.' }),
  corrientazo: m('Corrientazo', 'electrico', 0, 90, 20, 'powder', { status: ['par', 100], desc: 'Un corrientazo que paraliza al rival.' }),

  // ---------------- HIELO
  copito: m('Copito', 'hielo', 40, 100, 25, 'shot', { status: ['con', 10], desc: 'Bola de nieve. Puede congelar.' }),
  mordiscohelado: m('Mordisco Helado', 'hielo', 65, 95, 15, 'bite', { status: ['con', 10], desc: 'Colmillos de hielo. Puede congelar.' }),
  rayogelido: m('Rayo Gélido', 'hielo', 90, 100, 10, 'beam', { status: ['con', 10], desc: 'Rayo helado. Puede congelar.' }),
  ventisca: m('Ventisca', 'hielo', 110, 70, 5, 'rain', { status: ['con', 10], desc: 'Tormenta de nieve y granizo.' }),

  // ---------------- LUCHA
  patadon: m('Patadón', 'lucha', 50, 100, 25, 'punch', { desc: 'Una patada directa.' }),
  doblepatada: m('Doble Patada', 'lucha', 30, 100, 30, 'punch', { hits: [2, 2], desc: 'Dos patadas seguidas.' }),
  gancho: m('Gancho', 'lucha', 75, 100, 15, 'punch', { crit: 1, desc: 'Gancho al mentón. Críticos más fáciles.' }),
  combofinal: m('Combo Final', 'lucha', 120, 100, 5, 'punch', { stat: [s('def', -1, 'self')], desc: 'Golpiza total; después le baja la Defensa.' }),
  calentamiento: m('Calentamiento', 'lucha', 0, 100, 20, 'buff', { stat: [s('atk', 1, 'self'), s('def', 1, 'self')], desc: 'Estira y calienta: sube Ataque y Defensa.' }),

  // ---------------- VENENO
  pinchazo: m('Pinchazo', 'veneno', 35, 100, 35, 'sting', { status: ['ven', 30], desc: 'Púa tóxica. Puede envenenar.' }),
  acido: m('Ácido', 'veneno', 40, 100, 30, 'spray', { stat: [s('def', -1, 'foe', 10)], desc: 'Rocía ácido que puede bajar la Defensa.' }),
  boladelodo: m('Bola de Lodo', 'veneno', 90, 100, 10, 'shot', { status: ['ven', 30], desc: 'Lodo tóxico. Envenena con facilidad.' }),
  toxina: m('Toxina', 'veneno', 0, 90, 10, 'powder', { status: ['ven', 100], desc: 'Envenena al rival.' }),

  // ---------------- TIERRA
  barrazo: m('Barrazo', 'tierra', 55, 95, 15, 'shot', { stat: [s('spe', -1)], desc: 'Bola de barro que frena al rival.' }),
  tierraviva: m('Tierra Viva', 'tierra', 90, 100, 10, 'pillar', { stat: [s('def', -1, 'foe', 10)], desc: 'La tierra estalla bajo el rival.' }),
  terremoto: m('Terremoto', 'tierra', 100, 100, 10, 'quake', { desc: 'Sacude todo el suelo.' }),

  // ---------------- VOLADOR
  picotazo: m('Picotazo', 'volador', 35, 100, 35, 'sting', { desc: 'Pica con el pico.' }),
  aleteo: m('Aleteo', 'volador', 40, 100, 30, 'gust', { desc: 'Bate las alas con fuerza.' }),
  tornado: m('Tornado', 'volador', 60, 100, 20, 'gust', { confuse: 10, desc: 'Remolino de viento. Puede confundir.' }),
  tajoaereo: m('Tajo Aéreo', 'volador', 70, 95, 15, 'slash', { desc: 'Corta el aire como una cuchilla.' }),
  clavado: m('Clavado', 'volador', 110, 100, 15, 'tackle', { recoil: .33, desc: 'Se lanza en picada; también se lastima.' }),
  posarse: m('Posarse', 'volador', 0, 100, 10, 'heal', { heal: .5, desc: 'Descansa en una rama y recupera la mitad de sus PS.' }),

  // ---------------- PSÍQUICO
  mareo: m('Mareo', 'psiquico', 50, 100, 25, 'rings', { confuse: 10, desc: 'Onda que marea. Puede confundir.' }),
  ondamental: m('Onda Mental', 'psiquico', 55, 100, 20, 'rings', { desc: 'Golpea con la mente.' }),
  psicorayo: m('Psicorrayo', 'psiquico', 85, 95, 10, 'beam', { confuse: 10, desc: 'Rayo mental. Puede confundir.' }),
  hipnosis: m('Hipnosis', 'psiquico', 0, 60, 20, 'rings', { status: ['dor', 100], desc: 'Mirada hipnótica que duerme al rival.' }),
  barrera: m('Barrera', 'psiquico', 0, 100, 20, 'shield', { stat: [s('def', 2, 'self')], desc: 'Muro invisible: sube mucho la Defensa.' }),
  meditacion: m('Meditación', 'psiquico', 0, 100, 20, 'buff', { stat: [s('atk', 1, 'self'), s('spe', 1, 'self')], desc: 'Se concentra: sube Ataque y Velocidad.' }),

  // ---------------- BICHO
  hilo: m('Hilo Seda', 'bicho', 0, 95, 40, 'debuff', { stat: [s('spe', -1)], desc: 'Enreda al rival y le baja la Velocidad.' }),
  picadura: m('Picadura', 'bicho', 40, 100, 25, 'sting', { desc: 'Pica con su aguijón.' }),
  aguijon: m('Aguijón', 'bicho', 60, 100, 20, 'sting', { status: ['ven', 10], desc: 'Aguijón largo. Puede envenenar.' }),
  tijeretazo: m('Tijeretazo', 'bicho', 80, 100, 15, 'slash', { desc: 'Corta en forma de X.' }),
  zumbido: m('Zumbido', 'bicho', 90, 100, 10, 'roar', { stat: [s('def', -1, 'foe', 10)], desc: 'Zumbido que aturde.' }),

  // ---------------- ROCA
  pedrada: m('Pedrada', 'roca', 45, 95, 20, 'shot', { desc: 'Lanza una piedra.' }),
  tranque: m('Tranque', 'roca', 60, 95, 15, 'rain', { stat: [s('spe', -1)], desc: 'Rocas que encierran al rival y lo frenan.' }),
  alud: m('Alud', 'roca', 80, 90, 10, 'rain', { desc: 'Una lluvia de rocas.' }),
  filodepiedra: m('Filo de Piedra', 'roca', 100, 80, 5, 'pillar', { crit: 1, desc: 'Lanzas de piedra. Críticos más fáciles.' }),
  pulido: m('Pulido', 'roca', 0, 100, 20, 'buff', { stat: [s('spe', 2, 'self')], desc: 'Pule su cuerpo: sube mucho la Velocidad.' }),

  // ---------------- FANTASMA
  lamida: m('Lamida', 'fantasma', 30, 100, 30, 'bite', { status: ['par', 30], desc: 'Lengüetazo fantasmal. Puede paralizar.' }),
  zarpafantasma: m('Zarpa Fantasma', 'fantasma', 70, 100, 15, 'scratch', { crit: 1, desc: 'Garra salida de las sombras.' }),
  bolaespectral: m('Bola Espectral', 'fantasma', 80, 100, 15, 'shot', { stat: [s('def', -1, 'foe', 20)], desc: 'Bola de energía fantasmal.' }),
  susto: m('Susto', 'fantasma', 0, 100, 10, 'shadow', { confuse: 100, desc: 'Un susto que deja confundido al rival.' }),

  // ---------------- DRAGÓN
  alientodragon: m('Aliento Dragón', 'dragon', 60, 100, 20, 'spray', { status: ['par', 30], desc: 'Aliento abrasador. Puede paralizar.' }),
  garradragon: m('Garra Dragón', 'dragon', 80, 100, 15, 'scratch', { desc: 'Garras enormes y filosas.' }),
  rugidodragon: m('Rugido Dragón', 'dragon', 85, 100, 10, 'dragon', { desc: 'Una onda con forma de dragón.' }),
  cometa: m('Cometa Ancestral', 'dragon', 120, 90, 5, 'rain', { stat: [s('atk', -2, 'self')], desc: 'Llama cometas del cielo; queda agotado.' }),
  danzadragon: m('Danza Dragón', 'dragon', 0, 100, 20, 'buff', { stat: [s('atk', 1, 'self'), s('spe', 1, 'self')], desc: 'Danza mística: sube Ataque y Velocidad.' }),

  // ---------------- SINIESTRO
  zarpazo: m('Zarpazo', 'siniestro', 45, 100, 25, 'scratch', { desc: 'Golpe sucio con las garras.' }),
  zancadilla: m('Zancadilla', 'siniestro', 70, 100, 5, 'tackle', { prio: 1, desc: 'Le mete el pie al rival antes de que se mueva.' }),
  tinieblas: m('Tinieblas', 'siniestro', 75, 95, 15, 'shadow', { desc: 'Envuelve al rival en oscuridad.' }),
  tarascada: m('Tarascada', 'siniestro', 80, 100, 15, 'bite', { stat: [s('def', -1, 'foe', 20)], desc: 'Mordisco tremendo que puede bajar la Defensa.' }),
  planmacabro: m('Plan Macabro', 'siniestro', 0, 100, 20, 'buff', { stat: [s('atk', 2, 'self')], desc: 'Trama algo malo: sube mucho el Ataque.' }),

  // ---------------- ACERO
  garrametal: m('Garra Metal', 'acero', 50, 95, 35, 'scratch', { stat: [s('atk', 1, 'self', 10)], desc: 'Garras de acero. Puede subir el Ataque.' }),
  cabezahierro: m('Cabeza de Hierro', 'acero', 80, 100, 15, 'tackle', { desc: 'Cabezazo de metal.' }),
  destellometal: m('Destello Metálico', 'acero', 80, 100, 10, 'beam', { stat: [s('def', -1, 'foe', 10)], desc: 'Rayo de luz metálica.' }),
  colazoacero: m('Colazo de Acero', 'acero', 100, 75, 15, 'slash', { stat: [s('def', -1, 'foe', 30)], desc: 'Golpe con la cola dura como el hierro.' }),
  corazahierro: m('Coraza de Hierro', 'acero', 0, 100, 15, 'shield', { stat: [s('def', 2, 'self')], desc: 'Endurece el cuerpo: sube mucho la Defensa.' }),

  // ---------------- HADA
  brisahada: m('Brisa Hada', 'hada', 40, 100, 30, 'sparkle', { desc: 'Viento brillante.' }),
  besito: m('Besito', 'hada', 50, 100, 10, 'drain', { drain: .75, desc: 'Un beso que roba energía.' }),
  destellohada: m('Destello Hada', 'hada', 80, 100, 10, 'sparkle', { desc: 'Luz mágica que deslumbra.' }),
  juegorudo: m('Juego Rudo', 'hada', 90, 90, 10, 'punch', { stat: [s('atk', -1, 'foe', 10)], desc: 'Juega tan brusco que lastima.' }),
  ternura: m('Ternura', 'hada', 0, 100, 20, 'sparkle', { stat: [s('atk', -2)], desc: 'Tanta ternura le baja mucho el Ataque al rival.' }),
  luzdeluna: m('Luz de Luna', 'hada', 0, 100, 10, 'heal', { heal: .5, desc: 'Se baña en luz de luna y recupera la mitad de sus PS.' }),

  // ---------------- Familias nuevas de la Bruma y firmas de las leyendas
  puñohielo: m('Puño Hielo', 'hielo', 75, 100, 15, 'punch', { status: ['con', 10], desc: 'Puñetazo helado. Puede congelar.' }),
  carambano: m('Carámbano', 'hielo', 25, 100, 20, 'shot', { hits: [2, 5], desc: 'Dispara de 2 a 5 carámbanos seguidos.' }),
  topetazo: m('Topetazo', 'lucha', 85, 95, 10, 'tackle', { confuse: 10, desc: 'Cabezazo de carnero con todo. Puede confundir.' }),
  jab: m('Jab', 'lucha', 40, 100, 30, 'punch', { prio: 1, desc: 'Golpe rápido que siempre sale primero.' }),
  colmillotoxico: m('Colmillo Tóxico', 'veneno', 60, 100, 15, 'bite', { status: ['ven', 30], desc: 'Muerde con colmillos venenosos.' }),
  farolfatuo: m('Farol Fatuo', 'fantasma', 80, 100, 15, 'shot', { status: ['que', 20], desc: 'Lanza la llama de su farol. Puede quemar.' }),
  velosombrio: m('Velo Sombrío', 'fantasma', 95, 100, 10, 'shadow', { desc: 'Envuelve al rival en una sombra helada.' }),
  lluviadecuarzo: m('Lluvia de Cuarzo', 'roca', 90, 95, 10, 'rain', { desc: 'Hace caer cristales de cuarzo sobre el rival.' }),
  hojanavaja: m('Hoja Navaja', 'planta', 70, 95, 20, 'slash', { crit: true, desc: 'Hojas filudas. Da golpes críticos con facilidad.' }),
  picotrueno: m('Pico Trueno', 'electrico', 80, 100, 15, 'sting', { status: ['par', 20], desc: 'Picotazo cargado de electricidad. Puede paralizar.' }),
  puñomagma: m('Puño Magma', 'fuego', 85, 100, 15, 'punch', { status: ['que', 20], desc: 'Puñetazo de lava ardiente. Puede quemar.' }),
  orbitamental: m('Órbita Mental', 'psiquico', 85, 100, 10, 'rings', { confuse: 20, desc: 'Anillos de energía giran alrededor del rival.' }),
  velodebruma: m('Velo de Bruma', 'fantasma', 100, 95, 5, 'shadow', { stat: [s('atk', -1, 'foe', 50)], desc: 'Niebla del Bosque Bruma. Puede bajar el Ataque.' }),
  martillofragua: m('Martillo de Fragua', 'acero', 110, 90, 5, 'punch', { status: ['que', 30], desc: 'Golpe de yunque al rojo vivo. Puede quemar.' }),
  alaglaciar: m('Ala Glaciar', 'hielo', 100, 95, 5, 'gust', { status: ['con', 20], desc: 'Aletazo de viento helado. Puede congelar.' }),
  rayodelalba: m('Rayo del Alba', 'dragon', 110, 95, 5, 'beam', { stat: [s('atk', 1, 'self', 30)], desc: 'La primera luz del día hecha rayo.' })
};

// Daño típico (para la IA y el menú): potencia por número medio de golpes.
export function movePower(id) { const M = MOVES[id]; return M.power * (M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1); }
