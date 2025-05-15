// src/utils/commandParser/commands/availability.js

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { parseANCommand, parseOptions } from '../parserUtils';
import { generateHeader } from '../formatters';
import { formatDuration, getAircraftIATACode, calculateDaysLeft } from '../helpers';
import paginationState from '../paginationState';

// Función para manejar el comando de disponibilidad (AN)
export async function handleAvailabilityCommand(cmd) {
  try {
    // Guardar el comando actual para paginación
    paginationState.currentCommand = cmd;
    paginationState.commandType = 'AN';
    
    // Limpiar historial de paginación y reiniciar contador
    paginationState.previousPages = [];
    paginationState.currentIndex = 1;
    
    // Usar el parser para extraer componentes del comando
    const parsedCommand = parseANCommand(cmd);
    
    if (!parsedCommand.isValid) {
      return parsedCommand.error;
    }
    
    const { dateStr, origin, destination, options } = parsedCommand;
    
    // Registrar en la consola para depuración
    console.log(`Buscando vuelos: Origen=${origin}, Destino=${destination}, Fecha=${dateStr || 'cualquier fecha'}`);
    
    // Extraer opciones adicionales
    const { airline, flightClass } = parseOptions(options);
    
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
    
    // Ordenar por hora de salida
    flightsQuery = query(flightsQuery, orderBy('departure_time'));
    
    // Limitar resultados para la primera página
    flightsQuery = query(flightsQuery, limit(paginationState.pageSize));
    
    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);
    
    // Registrar la cantidad de resultados para depuración
    console.log(`Consulta ejecutada: se encontraron ${querySnapshot.size} resultados`);
    
    // Verificar si hay resultados
    if (querySnapshot.empty) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}.`;
    }
    
    // Actualizar el último documento visible para paginación
    paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Almacenar los resultados actuales y convertir a datos
    const allFlights = querySnapshot.docs.map(doc => doc.data());
    paginationState.currentResults = allFlights;
    
    // Filtrar resultados por fecha si se especificó
    let filteredResults = allFlights;
    if (dateStr) {
      // Convertir dateStr a varios formatos posibles para hacer coincidir con la base de datos
      const possibleDateFormats = generatePossibleDateFormats(dateStr);
      console.log("Posibles formatos de fecha a buscar:", possibleDateFormats);
      
      // Realizar una coincidencia flexible con cualquiera de los formatos de fecha
      filteredResults = allFlights.filter(flight => {
        if (!flight.departure_date) return true; // Incluir vuelos sin fecha
        
        // Verificar los vuelos y su formato de fecha
        console.log(`Verificando vuelo: ${flight.airline_code}${flight.flight_number}, Fecha en DB: ${flight.departure_date}`);
        
        // Comprobar si alguno de los formatos posibles coincide
        return possibleDateFormats.some(format => {
          const matches = flight.departure_date === format || 
                          flight.departure_date.includes(format);
          if (matches) {
            console.log(`¡Coincidencia encontrada! Formato: ${format}`);
          }
          return matches;
        });
      });
      
      console.log(`Después del filtrado por fecha, quedan ${filteredResults.length} vuelos`);
    }
    
    // Si no hay resultados después del filtrado, mostrar todos los vuelos disponibles
    if (filteredResults.length === 0) {
      console.log("No hay vuelos para la fecha específica. Mostrando todos los disponibles.");
      // En lugar de no mostrar nada, mostramos todos los vuelos con una advertencia
      filteredResults = allFlights;
      // Cambiar mensaje cuando se muestran todos, a pesar de filtro de fecha
      const infoMessage = dateStr ? 
        `No hay vuelos específicos para ${dateStr}. Mostrando todos los vuelos disponibles.\n` : 
        "";
      
      // Actualizar resultados filtrados
      paginationState.currentResults = filteredResults;
      
      // Si hay exactamente `pageSize` resultados, verificar si hay más resultados
      const hasMoreResults = querySnapshot.docs.length === paginationState.pageSize;
      
      // Procesar resultados
      let index = paginationState.currentIndex;
      const flightLines = [];
      filteredResults.forEach((flight) => {
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
        flightLine += ` ${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}`;
        if (dateStr) {
          // Mostrar la fecha del vuelo para claridad cuando se muestran todos los vuelos
          flightLine += ` (${flight.departure_date || 'fecha no especificada'})`;
        }
        
        flightLines.push(flightLine);
        index++;
      });
      
      // Calcular la longitud máxima de las líneas de vuelo
      const maxLineLength = flightLines.reduce((max, line) => Math.max(max, line.length), 0);
      
      // Generar línea de info alineada a la derecha
      const infoLine = `${calculateDaysLeft(dateStr)} ${new Date().toLocaleDateString('en-US', { weekday: 'short' })} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const paddedInfoLine = infoLine.padStart(maxLineLength);
      
      const header = await generateHeader('AN', destination, origin, dateStr);
      // Header e info alineada a la derecha en una sola línea
      const headerWithInfo = (header + ' ').padEnd(maxLineLength - infoLine.length, ' ') + infoLine;
      let response = `${headerWithInfo}\n${infoMessage}`;
      
      // Agregar las líneas de vuelo
      response += flightLines.map(l => l + '\n').join("");
      
      // Actualizar el índice actual
      paginationState.currentIndex = index;
      
      if (hasMoreResults) {
        response += "\nUse MD para mostrar más resultados.";
      }
      
      return response;
    }
    
    // Si llegamos aquí, hay resultados filtrados por fecha
    // Actualizar resultados filtrados
    paginationState.currentResults = filteredResults;
    
    // Si hay exactamente `pageSize` resultados, verificar si hay más resultados
    const hasMoreResults = querySnapshot.docs.length === paginationState.pageSize;
    
    // Procesar resultados
    let index = paginationState.currentIndex;
    const flightLines = [];
    filteredResults.forEach((flight) => {
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
      flightLine += ` ${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal} ${flight.departure_time} ${flight.arrival_time} E0/${aircraftCode} ${duration}`;
      
      flightLines.push(flightLine);
      index++;
    });
    
    // Calcular la longitud máxima de las líneas de vuelo
    const maxLineLength = flightLines.reduce((max, line) => Math.max(max, line.length), 0);
    
    // Generar línea de info alineada a la derecha
    const infoLine = `${calculateDaysLeft(dateStr)} ${new Date().toLocaleDateString('en-US', { weekday: 'short' })} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const paddedInfoLine = infoLine.padStart(maxLineLength);
    
    const header = await generateHeader('AN', destination, origin, dateStr);
    // Header e info alineada a la derecha en una sola línea
    const headerWithInfo = (header + ' ').padEnd(maxLineLength - infoLine.length, ' ') + infoLine;
    let response = `${headerWithInfo}\n`;
    
    // Agregar las líneas de vuelo
    response += flightLines.map(l => l + '\n').join("");
    
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

// Función para generar posibles formatos de fecha a partir de un dateStr
function generatePossibleDateFormats(dateStr) {
  if (!dateStr) return [];
  
  // Mapeo de meses de texto a números
  const months = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  // Intentar extraer día, mes y posiblemente año del formato DD[MMM][YY]
  const match = dateStr.match(/^(\d{1,2})([A-Z]{3})(\d{2,4})?$/i);
  
  if (!match) {
    console.warn(`Formato de fecha no reconocido: ${dateStr}`);
    return [dateStr]; // Devolver el formato original como única opción
  }
  
  const day = match[1];
  const dayPadded = day.padStart(2, '0');
  const monthText = match[2].toUpperCase();
  const month = months[monthText];
  
  if (!month) {
    console.warn(`Mes no reconocido: ${monthText} en fecha ${dateStr}`);
    return [dateStr]; // Devolver el formato original como única opción
  }
  
  let year = match[3] || new Date().getFullYear().toString();
  if (year.length === 2) {
    year = '20' + year;
  }
  
  // Generar múltiples formatos posibles de fecha
  return [
    // Formatos comunes
    `${dayPadded}/${month}/${year}`,  // DD/MM/YYYY
    `${day}/${month}/${year}`,       // D/M/YYYY
    `${dayPadded}-${month}-${year}`,  // DD-MM-YYYY
    `${day}-${month}-${year}`,       // D-M-YYYY
    `${year}-${month}-${dayPadded}`,  // YYYY-MM-DD (ISO)
    `${dayPadded}${monthText}${year.substring(2)}`, // DDMMMYY
    `${dayPadded}${monthText}`,      // DDMMM
    `${dayPadded}/${month}`,         // DD/MM
    `${month}/${dayPadded}/${year}`,  // MM/DD/YYYY (formato US)
    `${month}/${day}/${year}`,       // M/D/YYYY (formato US abreviado)
    
    // Formatos adicionales que pueden estar en la base de datos
    `${day}${month}${year}`,         // DDMMYYYY
    `${dayPadded}${month}${year}`,    // DDMMYYYY (con día con padding)
    dayPadded,                       // Solo el día (para comparaciones parciales)
    monthText,                       // Solo el mes en texto (para comparaciones parciales)
  ];
}