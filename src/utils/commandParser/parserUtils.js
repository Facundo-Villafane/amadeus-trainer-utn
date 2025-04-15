// src/utils/commandParser/parserUtils.js
import paginationState from './paginationState';

// Función general para extraer partes principales de un comando
export function parseCommand(cmd) {
  // Extraer el tipo de comando (primeras 2 letras)
  const commandType = cmd.substring(0, 2);
  
  // Guardar el comando original
  paginationState.currentCommand = cmd;
  paginationState.commandType = commandType;
  
  return { commandType };
}

// Parsear comandos de disponibilidad (AN)
export function parseANCommand(cmd) {
  // Expresión regular que captura grupos específicos
  // Grupo 1: Fecha completa (opcional)
  // Grupo 2: Día (1 o 2 dígitos)
  // Grupo 3: Mes (3 letras)
  // Grupo 4: Origen (3 letras)
  // Grupo 5: Destino (3 letras)
  // Grupo 6: Opciones (opcional, como /AAR)
  const regex = /AN((\d{1,2})([A-Z]{3}))?([A-Z]{3})([A-Z]{3})(\/.+)?/i;
  const match = cmd.match(regex);
  
  if (!match) {
    return {
      isValid: false,
      error: "Formato incorrecto. Ejemplo: AN15NOVBUEMAD"
    };
  }
  
  // Extraer componentes
  let dateStr = null;
  if (match[2] && match[3]) {
    // Reconstruir la fecha correctamente
    dateStr = match[2] + match[3].toUpperCase();
  }
  
  const origin = match[4].toUpperCase();
  const destination = match[5].toUpperCase();
  const options = match[6] || '';
  
  // Guardar en el estado para paginación
  paginationState.dateStr = dateStr;
  paginationState.origin = origin;
  paginationState.destination = destination;
  paginationState.options = options;
  
  return {
    isValid: true,
    dateStr,
    origin,
    destination,
    options
  };
}

// Parsear comandos de horarios (SN)
export function parseSNCommand(cmd) {
  // Usa la misma lógica que AN pero cambiando el prefijo
  const regex = /SN((\d{1,2})([A-Z]{3}))?([A-Z]{3})([A-Z]{3})(\/.+)?/i;
  const match = cmd.match(regex);
  
  if (!match) {
    return {
      isValid: false,
      error: "Formato incorrecto. Ejemplo: SN15NOVBUEMAD"
    };
  }
  
  // Extraer componentes
  let dateStr = null;
  if (match[2] && match[3]) {
    // Reconstruir la fecha correctamente
    dateStr = match[2] + match[3].toUpperCase();
  }
  
  const origin = match[4].toUpperCase();
  const destination = match[5].toUpperCase();
  const options = match[6] || '';
  
  // Guardar en el estado para paginación
  paginationState.dateStr = dateStr;
  paginationState.origin = origin;
  paginationState.destination = destination;
  paginationState.options = options;
  
  return {
    isValid: true,
    dateStr,
    origin,
    destination,
    options
  };
}

// Parsear comandos de frecuencias (TN)
export function parseTNCommand(cmd) {
  // Similar a SN pero con diferencias en las opciones
  const regex = /TN((\d{1,2})([A-Z]{3}))?([A-Z]{3})([A-Z]{3})(\/.+)?/i;
  const match = cmd.match(regex);
  
  if (!match) {
    return {
      isValid: false,
      error: "Formato incorrecto. Ejemplo: TNBUEMAD"
    };
  }
  
  // Extraer componentes
  let dateStr = null;
  if (match[2] && match[3]) {
    // Reconstruir la fecha correctamente
    dateStr = match[2] + match[3].toUpperCase();
  }
  
  const origin = match[4].toUpperCase();
  const destination = match[5].toUpperCase();
  const options = match[6] || '';
  
  // Guardar en el estado para paginación
  paginationState.dateStr = dateStr;
  paginationState.origin = origin;
  paginationState.destination = destination;
  paginationState.options = options;
  
  return {
    isValid: true,
    dateStr,
    origin,
    destination,
    options
  };
}

// Extraer opciones de aerolínea y clase de las opciones del comando
export function parseOptions(options) {
  let airline = '';
  let flightClass = '';
  
  if (options) {
    // Opción de aerolínea: /AAR (Aerolíneas Argentinas)
    const airlineMatch = options.match(/\/A([A-Z]{2})/i);
    if (airlineMatch) {
      airline = airlineMatch[1].toUpperCase();
    }
    
    // Opción de clase: /CJ (Clase J)
    const classMatch = options.match(/\/C([A-Z])/i);
    if (classMatch) {
      flightClass = classMatch[1].toUpperCase();
    }
  }
  
  return { airline, flightClass };
}