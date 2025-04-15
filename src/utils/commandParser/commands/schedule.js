// src/utils/commandParser/commands/schedule.js
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { parseSNCommand, parseOptions } from '../parserUtils';
import { generateHeader } from '../formatters';
import { formatDuration, getAircraftIATACode } from '../helpers';
import paginationState from '../paginationState';

// Función para manejar el comando de horarios (SN)
export async function handleScheduleCommand(cmd) {
  try {
    // Guardar el comando actual para paginación
    paginationState.currentCommand = cmd;
    paginationState.commandType = 'SN';
    
    // Limpiar historial de paginación y reiniciar contador
    paginationState.previousPages = [];
    paginationState.currentIndex = 1;
    
    // Usar el parser para extraer componentes del comando
    const parsedCommand = parseSNCommand(cmd);
    
    if (!parsedCommand.isValid) {
      return parsedCommand.error;
    }
    
    const { dateStr, origin, destination, options } = parsedCommand;
    
    // Extraer opciones adicionales
    const { airline } = parseOptions(options);
    
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
      return `No se encontraron vuelos para la ruta ${origin}-${destination}.`;
    }
    
    // Actualizar el último documento visible para paginación
    paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Almacenar los resultados actuales
    paginationState.currentResults = querySnapshot.docs.map(doc => doc.data());
    
    // Si hay exactamente `pageSize` resultados, verificar si hay más resultados
    const hasMoreResults = querySnapshot.docs.length === paginationState.pageSize;
    
    // Generar la cabecera con la fecha extraída del comando
    const header = await generateHeader('SN', destination, origin, dateStr);
    let response = `${header}\n`;
    
    // Procesar resultados
    let index = paginationState.currentIndex;
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
    
    // Actualizar el índice actual
    paginationState.currentIndex = index;
    
    if (hasMoreResults) {
      response += "\nUse MD para mostrar más resultados.";
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando SN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}