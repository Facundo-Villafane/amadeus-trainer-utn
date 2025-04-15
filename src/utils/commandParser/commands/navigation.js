// src/utils/commandParser/commands/navigation.js
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { generateHeader } from '../formatters';
import { formatDuration, getAircraftIATACode } from '../helpers';
import { parseANCommand, parseSNCommand, parseTNCommand } from '../parserUtils';
import paginationState from '../paginationState';

// Función para manejar el comando "Move Down" (MD o M)
export async function handleMoveDown() {
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
    
    // Extraer la información del comando
    const { commandType, origin, destination, dateStr, options } = paginationState;
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );
    
    // Analizar opciones para extraer aerolínea y clase si existen
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
    
    // Generar la cabecera con la fecha guardada
    const header = await generateHeader(commandType, destination, origin, dateStr, 'PÁGINA SIGUIENTE');
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
      
      // Construir línea de vuelo según el tipo de comando
      let flightLine = `${index} ${flight.airline_code} ${flight.flight_number} `;
      
      // Agregar disponibilidad de clases
      if (flight.class_availability) {
        // Mostrar clases disponibles con asientos
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          // En SN, se muestran clases cerradas como 'C'
          const seatDisplay = commandType === 'SN' && seats <= 0 ? 'C' : seats;
          flightLine += `${classCode}${seatDisplay} `;
        });
      } else if (flight.available_classes) {
        // Si tienes un array de objetos con code y seats
        flight.available_classes.forEach(cls => {
          flightLine += `${cls.code}${cls.seats} `;
        });
      } else {
        // Valores por defecto si no hay información de clases
        if (commandType === 'SN') {
          flightLine += 'YC BC MC KC '; // Para SN, clases cerradas
        } else {
          flightLine += 'Y9 B9 M9 '; // Para AN, clases abiertas
        }
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
export async function handleMoveUp() {
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
    
    // Extraer información necesaria del estado
    const { commandType, destination, origin, dateStr } = paginationState;
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    const header = await generateHeader(commandType, destination, origin, dateStr, 'PÁGINA ANTERIOR');
    let response = `${header}\n`;
    
    // Procesar resultados con numeración restaurada
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
          const seatDisplay = commandType === 'SN' && seats <= 0 ? 'C' : seats;
          flightLine += `${classCode}${seatDisplay} `;
        });
      } else if (flight.available_classes) {
        flight.available_classes.forEach(cls => {
          flightLine += `${cls.code}${cls.seats} `;
        });
      } else {
        if (commandType === 'SN') {
          flightLine += 'YC BC MC KC ';
        } else {
          flightLine += 'Y9 B9 M9 ';
        }
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