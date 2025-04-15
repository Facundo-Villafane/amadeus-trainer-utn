// src/utils/commandParser.js - Versión completa con paginación

import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { generatePNR } from './pnrGenerator';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import esLocale from 'i18n-iso-countries/langs/es.json';

// Inicializar la librería con los idiomas que necesitas
countries.registerLocale(enLocale);
countries.registerLocale(esLocale);

// Variable global para almacenar el estado de la paginación
const paginationState = {
  currentCommand: '',    // Comando actual (ej: ANBUEMAD)
  lastVisible: null,     // Último documento visible para "Move Down"
  previousPages: [],     // Historial de páginas para "Move Up"
  pageSize: 5,           // Número de vuelos por página
  currentResults: [],     // Resultados actuales para mostrar
  currentIndex: 1        // Contador para la numeración continua
};

// Función para analizar y ejecutar comandos
export async function commandParser(command) {
  // Convertir a mayúsculas y eliminar espacios al inicio y al final
  const cmd = command.trim().toUpperCase();
  
  // Comandos de paginación
  if (cmd === 'MD' || cmd === 'M') {
    return await handleMoveDown();
  }
  
  if (cmd === 'U') {
    return await handleMoveUp();
  }
  
  // Comandos de ayuda
  if (cmd === 'HELP' || cmd === 'HE') {
    return generateHelpText();
  }
  
  // Comandos de formato HE
  if (cmd.startsWith('HE')) {
    return handleHelpCommand(cmd);
  }
  
  // Comando de despliegue de disponibilidad AN
  if (cmd.startsWith('AN')) {
    return await handleAvailabilityCommand(cmd);
  }
  
  // Comando de despliegue de horarios SN
  if (cmd.startsWith('SN')) {
    return await handleScheduleCommand(cmd);
  }
  
  // Comando de despliegue de frecuencias TN
  if (cmd.startsWith('TN')) {
    return await handleTimetableCommand(cmd);
  }
  
  // Comandos de codificación y decodificación
  if (cmd.startsWith('DAN')) {
    return await handleEncodeCity(cmd);
  }
  
  if (cmd.startsWith('DAC')) {
    return await handleDecodeCity(cmd);
  }
  
  if (cmd.startsWith('DNA')) {
    return await handleEncodeAirline(cmd);
  }
  
  // Comandos para PNR
  if (cmd.startsWith('SS')) {
    return await handleSellSegment(cmd);
  }
  
  if (cmd.startsWith('NM')) {
    return handleAddName(cmd);
  }
  
  if (cmd.startsWith('AP')) {
    return handleAddContact(cmd);
  }
  
  if (cmd.startsWith('RF')) {
    return "Received From entrada guardada.";
  }
  
  if (cmd === 'ET' || cmd === 'ER') {
    return handleEndTransaction(cmd);
  }
  
  if (cmd.startsWith('RT')) {
    return await handleRetrievePNR(cmd);
  }
  
  // Si no coincide con ningún comando conocido
  return `Comando desconocido: ${cmd}. Ingrese HELP para ver los comandos disponibles.`;
}

// Función mejorada para calcular días restantes
function calculateDaysLeft(dateStr) {
  try {
    // Si no hay fecha en el comando, devolver 0
    if (!dateStr) {
      return 0;
    }

    // Extraer día y mes con una expresión regular más flexible
    const dateMatch = /^(\d{1,2})([A-Z]{3})/i.exec(dateStr);
    if (!dateMatch) {
      return 0;
    }
    
    const day = parseInt(dateMatch[1], 10);
    const monthStr = dateMatch[2].toUpperCase();
    
    // Mapeo de nombres de meses a números
    const monthMap = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    
    if (!monthMap.hasOwnProperty(monthStr)) {
      return 0; // Mes no válido
    }
    
    const month = monthMap[monthStr];
    
    // Obtener la fecha actual
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Crear fecha objetivo (primero asumimos el año actual)
    let targetDate = new Date(currentYear, month, day);
    
    // Si la fecha ya pasó este año, sumar un año
    if (targetDate < currentDate) {
      targetDate = new Date(currentYear + 1, month, day);
    }
    
    // Calcular la diferencia en días
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  } catch (error) {
    console.error("Error al calcular días restantes:", error);
    return 0; // En caso de error, devolver 0
  }
}


// Función para manejar el comando "Move Down" (MD o M)
async function handleMoveDown() {
  try {
    // Verificar si hay un comando actual
    if (!paginationState.currentCommand) {
      return "No hay resultados previos para avanzar. Primero ejecute un comando AN/SN/TN.";
    }
    
    // Verificar si hay más resultados
    if (!paginationState.lastVisible) {
      return "No hay más resultados para mostrar.";
    }
    
    // Guardar el estado actual para poder volver atrás (incluir el índice actual)
    paginationState.previousPages.push({
      results: [...paginationState.currentResults],
      lastVisible: paginationState.lastVisible,
      startIndex: paginationState.currentIndex - paginationState.currentResults.length // Guardar el índice inicial
    });

    // Actualizar el índice inicial para la siguiente página
    paginationState.currentIndex += paginationState.currentResults.length;
    
    // Extraer la información del comando
    const cmd = paginationState.currentCommand;
    
    // Extraer la información del comando
    // Formato esperado: AN[FECHA][ORIGEN][DESTINO][/OPCIONES]
    const regex = /AN(\d{0,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Error al procesar el comando guardado.";
    }
    
    const [, dateStr, origin, destination, optionsStr] = match;
    
    // Analizar opciones si existen
    let airline = '';
    let flightClass = '';
    
    if (optionsStr) {
      // Opción de aerolínea: /AAR (Aerolíneas Argentinas)
      const airlineMatch = optionsStr.match(/\/A([A-Z]{2})/);
      if (airlineMatch) {
        airline = airlineMatch[1];
      }
      
      // Opción de clase: /CJ (Clase J)
      const classMatch = optionsStr.match(/\/C([A-Z])/);
      if (classMatch) {
        flightClass = classMatch[1];
      }
    }
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );
    
    // Si hay fecha específica en el comando, filtrar por fecha
    if (dateStr && dateStr.length >= 5) {
      // Extraer día y mes de dateStr (formato: DDMMM)
      const day = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 5);
      
      // TODO: Convertir a formato de fecha en tu base de datos si es necesario
    }
    
    // Si se especificó aerolínea, filtrar por aerolínea
    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }
    
    // Ordenar por algún campo (ajustar según tu schema)
    flightsQuery = query(flightsQuery, orderBy('departure_time'));
    
    // Empezar después del último documento visible
    flightsQuery = query(flightsQuery, startAfter(paginationState.lastVisible));
    
    // Limitar resultados
    flightsQuery = query(flightsQuery, limit(paginationState.pageSize));
    
    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);
    
    // Verificar si hay resultados
    if (querySnapshot.empty) {
      return "No hay más resultados para mostrar.";
    }
    
    // Actualizar el último documento visible
    paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Almacenar los nuevos resultados
    paginationState.currentResults = querySnapshot.docs.map(doc => doc.data());
    
    // Generar la cabecera
    const header = await generateANHeader(destination, origin);
    let response = `${header}\n`;
    
    // Procesar resultados con numeración continua
    let index = paginationState.currentIndex;
    querySnapshot.forEach((doc) => {
      const flight = doc.data();
      
      // Si se especificó una clase, verificar si el vuelo tiene esa clase disponible
      if (flightClass && (!flight.class_availability || !flight.class_availability[flightClass])) {
        return; // Saltar este vuelo si no tiene la clase especificada
      }
      
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Construir línea de vuelo
      let flightLine = `${index} ${flight.airline_code} ${flight.flight_number} `;
      
      // Agregar disponibilidad de clases
      if (flight.class_availability) {
        // Si tienes un objeto con clases como claves
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          flightLine += `${classCode}${seats} `;
        });
      } else if (flight.available_classes) {
        // Si tienes un array de objetos con code y seats
        flight.available_classes.forEach(cls => {
          flightLine += `${cls.code}${cls.seats} `;
        });
      } else {
        // Valores por defecto si no hay información de clases
        flightLine += 'Y9 B9 M9 ';
      }
      
      // Añadir detalles del vuelo
      flightLine += `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}\n`;
      
      response += flightLine;
      index++;
    });

    // Actualizar el índice actual para reflejar el último mostrado
    paginationState.currentIndex = index;
    
    response += "\nUse MD para mostrar más resultados o U para volver a la página anterior.";
    return response;
  } catch (error) {
    console.error('Error al procesar paginación (MD):', error);
    return `Error al procesar paginación: ${error.message}`;
  }
}

// Función para manejar el comando "Move Up" (U)
async function handleMoveUp() {
  try {
    // Verificar si hay páginas previas
    if (paginationState.previousPages.length === 0) {
      return "No hay páginas previas para mostrar.";
    }
    
    // Obtener la página anterior
    const previousPage = paginationState.previousPages.pop();
    
    // Restaurar el índice inicial
    paginationState.currentIndex = previousPage.startIndex;

    // Actualizar el estado actual
    paginationState.currentResults = previousPage.results;
    paginationState.lastVisible = previousPage.lastVisible;
    
    // Extraer información del comando actual
    const cmd = paginationState.currentCommand;
    const regex = /AN(\d{0,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Error al procesar el comando guardado.";
    }
    
    const [, , origin, destination] = match;
    
    // Generar la cabecera
    const header = await generateANHeader(destination, origin);
    let response = `${header}\n`;
    
    // Procesar resultados
    let index = paginationState.currentIndex;
    paginationState.currentResults.forEach((flight) => {
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Construir línea de vuelo
      let flightLine = `${index} ${flight.airline_code} ${flight.flight_number} `;
      
      // Agregar disponibilidad de clases
      if (flight.class_availability) {
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          flightLine += `${classCode}${seats} `;
        });
      } else if (flight.available_classes) {
        flight.available_classes.forEach(cls => {
          flightLine += `${cls.code}${cls.seats} `;
        });
      } else {
        flightLine += 'Y9 B9 M9 ';
      }
      
      // Añadir detalles del vuelo
      flightLine += `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}\n`;
      
      response += flightLine;
      index++;
    });

    // Actualizar el índice para la siguiente vez
    paginationState.currentIndex = index;
    
    if (paginationState.previousPages.length > 0) {
      response += "\nUse MD para mostrar más resultados o U para volver a la página anterior.";
    } else {
      response += "\nUse MD para mostrar más resultados.";
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar paginación (U):', error);
    return `Error al procesar paginación: ${error.message}`;
  }
}

// Función para obtener información del destino desde Firebase
async function getDestinationInfoFromDB(destinationCode) {
  try {
    // Buscamos en la colección flights los vuelos que tienen este destino
    const flightsQuery = query(
      collection(db, 'flights'),
      where('arrival_airport_code', '==', destinationCode),
      limit(1)
    );
    
    const querySnapshot = await getDocs(flightsQuery);
    
    if (!querySnapshot.empty) {
      // Tomamos los datos del primer vuelo que encontramos
      const flightData = querySnapshot.docs[0].data();
      
      // Obtenemos el código ISO del país usando la librería
      const countryCode = getCountryCode(flightData.arrival_country || '');
      
      // Extraemos la información que necesitamos
      return {
        city: flightData.arrival_city || destinationCode,
        countryCode: countryCode
      };
    }
    
    // Si no encontramos información en la base de datos, usamos valores por defecto
    return getDefaultDestinationInfo(destinationCode);
  } catch (error) {
    console.error('Error al obtener información del destino:', error);
    // En caso de error, devolvemos valores por defecto
    return getDefaultDestinationInfo(destinationCode);
  }
}

// Función para obtener el código ISO a partir del nombre del país utilizando la librería
function getCountryCode(countryName) {
  if (!countryName) return 'XX';
  
  // Si ya es un código ISO de 2 letras, lo devolvemos directamente
  if (countryName.length === 2 && countryName === countryName.toUpperCase()) {
    return countryName;
  }
  
  // Intentamos obtener el código desde la librería
  // Probamos tanto en inglés como en español
  const codeFromEN = countries.getAlpha2Code(countryName, 'en');
  if (codeFromEN) return codeFromEN;
  
  const codeFromES = countries.getAlpha2Code(countryName, 'es');
  if (codeFromES) return codeFromES;
  
  // Manejo de casos especiales comunes
  const specialCases = {
    'USA': 'US',
    'US': 'US',
    'UNITED STATES': 'US', 
    'UK': 'GB',
    'ENGLAND': 'GB'
  };
  
  const upperCountryName = countryName.toUpperCase();
  if (specialCases[upperCountryName]) {
    return specialCases[upperCountryName];
  }
  
  // Si no se encuentra, devolvemos XX
  return 'XX';
}

// Función para obtener información por defecto si no está en la base de datos
function getDefaultDestinationInfo(destinationCode) {
  // Mapeo básico de aeropuertos a ciudades y códigos de país
  const airportInfo = {
    'MAD': { city: 'MADRID', countryCode: 'ES' },
    'BCN': { city: 'BARCELONA', countryCode: 'ES' },
    'LHR': { city: 'LONDON', countryCode: 'GB' },
    'CDG': { city: 'PARIS', countryCode: 'FR' },
    'FCO': { city: 'ROME', countryCode: 'IT' },
    'EZE': { city: 'BUENOS AIRES', countryCode: 'AR' },
    'AEP': { city: 'BUENOS AIRES', countryCode: 'AR' },
    'COR': { city: 'CORDOBA', countryCode: 'AR' },
    'SCL': { city: 'SANTIAGO', countryCode: 'CL' },
    'MIA': { city: 'MIAMI', countryCode: 'US' },
    'JFK': { city: 'NEW YORK', countryCode: 'US' }
  };
  
  // Devuelve la info del destino o valores por defecto si no se encuentra
  return airportInfo[destinationCode] || { city: destinationCode, countryCode: 'XX' };
}

// Versión actualizada de generateANHeader
async function generateANHeader(destination, origin, dateStr) {
  // Obtener la fecha actual
  const now = new Date();
  
  // Formatear el día de la semana en inglés y obtener las dos primeras letras
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayOfWeek = weekdays[now.getDay()];
  
  // Formatear la fecha actual (DDMMM)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const formattedDate = `${day}${month}`;
  
  // Formatear la hora actual (HHMM)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}${minutes}`;
  
  // Calcular días restantes hasta la fecha de viaje
  const daysLeft = calculateDaysLeft(dateStr);
  
  // Obtener información del destino desde la base de datos
  const destinationInfo = await getDestinationInfoFromDB(destination);
  
  // Generar la cabecera
  return `** AMADEUS AVAILABILITY - AN ** ${destination} ${destinationInfo.city}.${destinationInfo.countryCode} ${daysLeft} ${dayOfWeek} ${formattedDate} ${formattedTime}`;
}

// Expresión regular mejorada para los comandos AN
// Esta versión captura correctamente todos los componentes incluso con días de un solo dígito
function parseANCommand(cmd) {
  // Expresión regular que captura grupos específicos para facilitar la extracción
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
  
  const origin = match[4];
  const destination = match[5];
  const options = match[6] || '';
  
  return {
    isValid: true,
    dateStr,
    origin,
    destination,
    options
  };
}

// Función para manejar el comando de disponibilidad (AN)
async function handleAvailabilityCommand(cmd) {
  try {
    // Guardar el comando actual para paginación
    paginationState.currentCommand = cmd;
    
    // Limpiar historial de paginación y reiniciar contador
    paginationState.previousPages = [];
    paginationState.currentIndex = 1;
    
    // Usar el nuevo parser para extraer componentes del comando
    const parsedCommand = parseANCommand(cmd);
    
    if (!parsedCommand.isValid) {
      return parsedCommand.error;
    }
    
    const { dateStr, origin, destination, options } = parsedCommand;
    
    // Analizar opciones si existen
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
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );
    
    // Si se especificó aerolínea, filtrar por aerolínea
    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }
    
    // Ordenar por algún campo (ajustar según tu schema)
    flightsQuery = query(flightsQuery, orderBy('departure_time'));
    
    // Limitar resultados para la primera página
    flightsQuery = query(flightsQuery, limit(paginationState.pageSize));
    
    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);
    
    // Verificar si hay resultados
    if (querySnapshot.empty) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}.`;
    }
    
    // Actualizar el último documento visible para paginación
    paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Almacenar los resultados actuales
    paginationState.currentResults = querySnapshot.docs.map(doc => doc.data());
    
    // Si hay exactamente `pageSize` resultados, verificar si hay más resultados
    const hasMoreResults = querySnapshot.docs.length === paginationState.pageSize;
    
    // Generar la cabecera con la fecha extraída del comando
    const header = await generateANHeader(destination, origin, dateStr);
    let response = `${header}\n`;
    
    // Procesar resultados
    let index = paginationState.currentIndex;
    querySnapshot.forEach((doc) => {
      const flight = doc.data();
      
      // Si se especificó una clase, verificar si el vuelo tiene esa clase disponible
      if (flightClass && (!flight.class_availability || !flight.class_availability[flightClass])) {
        return; // Saltar este vuelo si no tiene la clase especificada
      }
      
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Construir línea de vuelo
      let flightLine = `${index} ${flight.airline_code} ${flight.flight_number} `;
      
      // Agregar disponibilidad de clases
      if (flight.class_availability) {
        // Si tienes un objeto con clases como claves
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          flightLine += `${classCode}${seats} `;
        });
      } else if (flight.available_classes) {
        // Si tienes un array de objetos con code y seats
        flight.available_classes.forEach(cls => {
          flightLine += `${cls.code}${cls.seats} `;
        });
      } else {
        // Valores por defecto si no hay información de clases
        flightLine += 'Y9 B9 M9 ';
      }
      
      // Añadir detalles del vuelo
      flightLine += `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}\n`;
      
      response += flightLine;
      index++;
    });
    
    // Actualizar el índice actual
    paginationState.currentIndex = index;

    if (hasMoreResults) {
      response += "\nUse MD para mostrar más resultados.";
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando AN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el comando de horarios (SN)
async function handleScheduleCommand(cmd) {
  try {
    // Extraer la información del comando
    // Formato esperado: SN[FECHA][ORIGEN][DESTINO][/OPCIONES]
    const regex = /SN(\d{0,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SN15NOVBUEMAD";
    }
    
    const [, dateStr, origin, destination, optionsStr] = match;
    
    // Analizar opciones si existen
    let airline = '';
    
    if (optionsStr) {
      // Opción de aerolínea: /AAR (Aerolíneas Argentinas)
      const airlineMatch = optionsStr.match(/\/A([A-Z]{2})/);
      if (airlineMatch) {
        airline = airlineMatch[1];
      }
    }
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );
    
    // Si hay fecha específica en el comando, filtrar por fecha
    if (dateStr && dateStr.length >= 5) {
      // Implementar lógica de filtrado por fecha similar a handleAvailabilityCommand
    }
    
    // Si se especificó aerolínea, filtrar por aerolínea
    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }
    
    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);
    
    // Verificar si hay resultados
    if (querySnapshot.empty) {
      return `No se encontraron vuelos para la ruta ${origin}-${destination}.`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `** AMADEUS SCHEDULES - SN ** ${destination} ${origin}.XX\n`;
    
    // Procesar resultados
    let index = 1;
    querySnapshot.forEach((doc) => {
      const flight = doc.data();
      
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Construir línea de vuelo
      let flightLine = `${index} ${flight.airline_code} ${flight.flight_number} `;
      
      // En SN se muestran todas las clases, incluso las cerradas
      // Esto dependerá de cómo almacenas la disponibilidad de clases en tu base de datos
      if (flight.all_classes) {
        Object.entries(flight.all_classes).forEach(([classCode, status]) => {
          flightLine += `${classCode}${status} `;
        });
      } else if (flight.class_availability) {
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          const status = seats > 0 ? seats : 'C'; // C = cerrado si no hay asientos
          flightLine += `${classCode}${status} `;
        });
      } else {
        // Valores por defecto
        flightLine += 'YC BC MC KC ';
      }
      
      // Añadir detalles del vuelo
      flightLine += `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}\n`;
      
      response += flightLine;
      index++;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando SN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el comando de frecuencias (TN)
async function handleTimetableCommand(cmd) {
  try {
    // Extraer la información del comando
    // Formato esperado: TN[FECHA][ORIGEN][DESTINO][/OPCIONES]
    const regex = /TN(\d{0,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: TNBUEMAD";
    }
    
    const [, dateStr, origin, destination, optionsStr] = match;
    
    // Analizar opciones si existen
    let airline = '';
    
    if (optionsStr) {
      // Opción de aerolínea: /AAR (Aerolíneas Argentinas)
      const airlineMatch = optionsStr.match(/\/A([A-Z]{2})/);
      if (airlineMatch) {
        airline = airlineMatch[1];
      }
    }
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );
    
    // Si se especificó aerolínea, filtrar por aerolínea
    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }
    
    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);
    
    // Verificar si hay resultados
    if (querySnapshot.empty) {
      return `No se encontraron vuelos para la ruta ${origin}-${destination}.`;
    }
    
    // Obtener la fecha actual y calcular una semana después para el encabezado
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Formatear fechas para el encabezado (formato: DDMMM24)
    const formatDateHeader = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear().toString().substring(2);
      return `${day}${month}${year}`;
    };
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `** AMADEUS TIMETABLE - TN ** ${destination} ${origin} ${formatDateHeader(today)} ${formatDateHeader(nextWeek)}\n`;
    
    // Procesar resultados
    let index = 1;
    querySnapshot.forEach((doc) => {
      const flight = doc.data();
      
      // Formatear la línea de frecuencia de vuelo
      // Ejemplo: "1 LA 472 247 EZE A SCL 2 0510 0637 0 07APR24 31MAY24 320 2:27"
      
      // Obtener días de operación (si está disponible)
      let daysOfOperation = flight.days_of_operation || flight.frequency || 'D'; // D = Diario por defecto
      
      // Si es un número, convertirlo a formato de días (1=lunes, 2=martes, etc.)
      if (typeof daysOfOperation === 'number') {
        daysOfOperation = daysOfOperation.toString();
      }
      
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Fechas de validez (si están disponibles)
      const validFrom = flight.valid_from || flight.start_date || '01JAN24';
      const validTo = flight.valid_to || flight.end_date || '31DEC24';
      
      // Construir la línea de frecuencia
      const flightLine = `${index} ${flight.airline_code} ${flight.flight_number} ${daysOfOperation} ` +
                        `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ` +
                        `${flight.departure_time} ${flight.arrival_time} 0 ${validFrom} ${validTo} ${aircraftCode} ${duration}\n`;
      
      response += flightLine;
      index++;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando TN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar codificación de ciudad (DAN)
async function handleEncodeCity(cmd) {
  try {
    const cityName = cmd.slice(3).trim();
    
    // Consultar ciudades en Firebase
    const citiesQuery = query(
      collection(db, 'cities'),
      where('name_uppercase', '>=', cityName.toUpperCase()),
      where('name_uppercase', '<=', cityName.toUpperCase() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(citiesQuery);
    
    if (querySnapshot.empty) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DAN${cityName.toUpperCase()}\n`;
    response += `A:APT B:BUS C:CITY G:GRD H:HELI O:OFF-PT R:RAIL S:ASSOC TOWN\n`;
    
    querySnapshot.forEach((doc) => {
      const city = doc.data();
      response += `${city.code}*C ${city.name.toUpperCase()} /${city.country_code}\n`;
      
      // Si hay aeropuertos asociados
      if (city.airports && Array.isArray(city.airports)) {
        city.airports.forEach(airport => {
          response += `A ${airport.code} - ${airport.name} - ${airport.distance || '0K'} /${city.country_code}\n`;
        });
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DAN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar decodificación de ciudad (DAC)
async function handleDecodeCity(cmd) {
  try {
    const cityCode = cmd.slice(3).trim().toUpperCase();
    
    // Buscar primero como ciudad
    const citiesQuery = query(
      collection(db, 'cities'),
      where('code', '==', cityCode),
      limit(1)
    );
    
    const citiesSnapshot = await getDocs(citiesQuery);
    
    if (!citiesSnapshot.empty) {
      const city = citiesSnapshot.docs[0].data();
      
      // Formatear la respuesta para ciudad
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} C ${city.name.toUpperCase()} /${city.country_code}\n`;
      
      // Si hay aeropuertos asociados
      if (city.airports && Array.isArray(city.airports)) {
        response += `AIRPORTS:\n`;
        city.airports.forEach(airport => {
          response += `${airport.code} - ${airport.name}\n`;
        });
      }
      
      return response;
    }
    
    // Si no se encuentra como ciudad, buscar como aeropuerto
    const airportsQuery = query(
      collection(db, 'airports'),
      where('code', '==', cityCode),
      limit(1)
    );
    
    const airportsSnapshot = await getDocs(airportsQuery);
    
    if (!airportsSnapshot.empty) {
      const airport = airportsSnapshot.docs[0].data();
      
      // Formatear la respuesta para aeropuerto
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} A ${airport.name} /${airport.country_code}\n`;
      response += `${airport.city_code} C ${airport.city_name}\n`;
      
      return response;
    }
    
    return `No se encontró información para el código: ${cityCode}`;
  } catch (error) {
    console.error('Error al procesar el comando DAC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar codificación de aerolínea (DNA)
async function handleEncodeAirline(cmd) {
  try {
    const airlineName = cmd.slice(3).trim();
    
    // Consultar aerolíneas en Firebase
    const airlinesQuery = query(
      collection(db, 'airlines'),
      where('name_uppercase', '>=', airlineName.toUpperCase()),
      where('name_uppercase', '<=', airlineName.toUpperCase() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(airlinesQuery);
    
    if (querySnapshot.empty) {
      return `No se encontró información para la aerolínea: ${airlineName}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DNA${airlineName.toUpperCase()}\n`;
    
    querySnapshot.forEach((doc) => {
      const airline = doc.data();
      response += `${airline.code} ${airline.name.toUpperCase()}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DNA:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la venta de segmentos (SS)
async function handleSellSegment(cmd) {
  try {
    // Formato esperado: SS[CANTIDAD][CLASE][LÍNEA]
    const regex = /SS(\d+)([A-Z])(\d+)/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SS1Y1";
    }
    
    const [, quantity, classCode, lineNumber] = match;
    
    // En una implementación real, aquí buscaríamos el vuelo correspondiente
    // y crearíamos un nuevo PNR o actualizaríamos uno existente
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1 XX 1234 ${classCode} 01JAN 1 XXXYYY DK${quantity} 1200 1400 01JAN E 737
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando SS:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la adición de nombres (NM)
function handleAddName(cmd) {
  try {
    // Analizar el comando NM
    // Formato básico: NM1APELLIDO/NOMBRE
    // Formato con título: NM1APELLIDO/NOMBRE MR
    // Formato con niño: NM1APELLIDO/NOMBRE(CHD/01JAN15)
    // Formato con infante: NM1APELLIDO/NOMBRE(INFGARCIA/LUIS/01JAN20)
    
    // Simplificado para fines educativos
    const namePattern = /NM(\d+)([A-Z]+)\/([A-Z\s]+)\s?([A-Z]+)?/i;
    const match = cmd.match(namePattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: NM1GARCIA/JUAN MR";
    }
    
    const [, quantity, lastName, firstName, title] = match;
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1.${lastName.toUpperCase()}/${firstName.trim().toUpperCase()} ${title || 'MR'}
2 XX 1234 Y 01JAN 1 XXXYYY DK1 1200 1400 01JAN E 737
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando NM:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la adición de contacto (AP)
function handleAddContact(cmd) {
  try {
    // Analizar el comando AP
    // Formato: AP CIUDAD TELEFONO-TIPO
    const contactPattern = /AP\s+([A-Z]{3})\s+([0-9\-]+)(?:-([A-Z]))?/i;
    const match = cmd.match(contactPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: AP BUE 12345678-M";
    }
    
    const [, city, phone, type] = match;
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY DK1 1200 1400 01JAN E 737
3 AP ${city.toUpperCase()} ${phone}-${type || 'H'}
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando AP:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el fin de transacción (ET/ER)
function handleEndTransaction(cmd) {
  try {
    // Generar un código de reserva (PNR)
    const recordLocator = generatePNR();
    
    if (cmd === 'ET') {
      return `FIN DE TRANSACCION COMPLETADO - ${recordLocator}`;
    } else {
      // Para ER, simulamos que reabre el PNR
      return `
---RLR---
RP/UTN5168476/AGENTE FF/WE 01JAN/1200Z ${recordLocator}
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY HK1 1200 1400 01JAN E 737
3 AP BUE 12345678-H
4 TK TL01JAN/1200
*TRN*
>`;
    }
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la recuperación de PNR (RT)
async function handleRetrievePNR(cmd) {
  try {
    // Analizar el comando RT
    // Formato: RT[CODIGO]
    const pnrCode = cmd.slice(2).trim();
    
    if (!pnrCode) {
      return "Formato incorrecto. Ejemplo: RTABCDEF";
    }
    
    // En una implementación real, aquí buscaríamos el PNR en Firebase
    // Para esta demo, simularemos una respuesta exitosa
    
    const response = `
---RLR---
RP/UTN5168476/AGENTE FF/WE 01JAN/1200Z ${pnrCode}
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY HK1 1200 1400 01JAN E 737
3 AP BUE 12345678-H
4 TK TL01JAN/1200
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando RT:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Utilidad para formatear duración en horas:minutos
function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Función auxiliar para obtener código IATA del equipo
function getAircraftIATACode(aircraft) {
  // Mapeo de nombres completos a códigos IATA
  const aircraftMapping = {
    'Airbus A320': '320',
    'A320': '320',
    'Airbus A321': '321',
    'A321': '321',
    'Airbus A330': '330',
    'A330': '330',
    'Airbus A340': '340',
    'A340': '340',
    'Airbus A350': '350',
    'A350': '350',
    'Airbus A380': '380',
    'A380': '380',
    'Boeing 737': '737',
    'B737': '737',
    'Boeing 737-800': '738',
    'B738': '738',
    'Boeing 747': '747',
    'B747': '747',
    'Boeing 767': '767',
    'B767': '767',
    'Boeing 777': '777',
    'B777': '777',
    'Boeing 787': '787',
    'B787': '787',
    'Embraer E190': 'E90',
    'Embraer 190': 'E90',
    'E190': 'E90',
    'Embraer E195': 'E95',
    'Embraer 195': 'E95',
    'E195': 'E95'
  };
  
  // Si ya es un código IATA (3 caracteres o menos), devolverlo directamente
  if (aircraft.length <= 3) {
    return aircraft;
  }
  
  // Buscar en el mapeo
  return aircraftMapping[aircraft] || aircraft;
}