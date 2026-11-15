// Reloj del juego: la hora real del computador, corrida las horas que hayas dormido en un motel o en tu casa
// (clockShift), o una hora fija si las opciones de prueba la ponen (forceHour).
export const gameHour = st => st?.options?.forceHour ?? (((new Date().getHours() + (st?.clockShift || 0)) % 24) + 24) % 24;
// Corrimiento para que el reloj marque `target` ahora mismo.
export const shiftTo = target => (((target - new Date().getHours()) % 24) + 24) % 24;
