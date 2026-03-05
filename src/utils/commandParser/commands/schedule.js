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

      const idxStr = String(index).padStart(2, ' ');
      const carrierStr = `${flight.airline_code} ${flight.flight_number}`.padEnd(8, ' ');

      let classesArr = [];
      if (flight.all_classes) {
        Object.entries(flight.all_classes).forEach(([classCode, status]) => {
          classesArr.push(`${classCode}${status}`);
        });
      } else if (flight.class_availability) {
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          const status = seats > 0 ? seats : 'C'; // C = cerrado
          classesArr.push(`${classCode}${status}`);
        });
      } else {
        classesArr = ['YC', 'BC', 'MC', 'KC'];
      }

      // Max 7 classes per line = 21 chars + 1 padding space
      let classesFirstLine = classesArr.slice(0, 7).join(' ').padEnd(21, ' ') + '  ';
      let classesSecondLine = classesArr.length > 7 ? classesArr.slice(7).join(' ') : null;

      const routingStr = `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal}`.padEnd(13, ' ');

      // Format times to 4 chars without colon
      const formatTime = (t) => t ? t.replace(':', '') : '----';
      const depTimeStr = formatTime(flight.departure_time).padEnd(8, ' ');

      let arrTimeBase = formatTime(flight.arrival_time);
      if (flight.arrival_time && flight.departure_time && flight.arrival_time < flight.departure_time) {
        arrTimeBase += '+1';
      }
      const arrTimeStr = arrTimeBase.padEnd(6, ' ');

      const equipStr = `E0/${aircraftCode}`.padEnd(12, ' ');

      let flightLine = ` ${idxStr}   ${carrierStr}${classesFirstLine}${routingStr}${depTimeStr}${arrTimeStr}${equipStr}${duration}\n`;
      response += flightLine;

      if (classesSecondLine) {
        response += `             ${classesSecondLine}\n`;
      }

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