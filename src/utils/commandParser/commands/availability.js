// src/utils/commandParser/commands/availability.js

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { parseANCommand, parseOptions } from '../parserUtils';
import { generateHeader } from '../formatters';
import { formatDuration, getAircraftIATACode, calculateDaysLeft } from '../helpers';
import paginationState from '../paginationState';
import { normalizeDateToISO } from '../../flightUtils';
import { formatTrainingAirlineList, generateSyntheticFlights } from '../syntheticFlights';

export async function handleAvailabilityCommand(cmd) {
  try {
    paginationState.currentCommand = cmd;
    paginationState.commandType = 'AN';
    paginationState.previousPages = [];
    paginationState.currentIndex = 1;

    const parsedCommand = parseANCommand(cmd);

    if (!parsedCommand.isValid) {
      return parsedCommand.error;
    }

    const { dateStr, origin, destination, options } = parsedCommand;

    console.log(`Buscando vuelos: Origen=${origin}, Destino=${destination}, Fecha=${dateStr || 'cualquier fecha'}`);

    const { airline, flightClass } = parseOptions(options);
    const isoDate = dateStr ? normalizeDateToISO(dateStr) : null;

    console.log(`Fecha del comando "${dateStr}" normalizada a: ${isoDate}`);

    let flightsQuery = query(collection(db, 'flights'));
    flightsQuery = query(
      flightsQuery,
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );

    if (isoDate) {
      flightsQuery = query(flightsQuery, where('departure_date', '==', isoDate));
    }

    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }

    flightsQuery = query(flightsQuery, orderBy('departure_time'));
    flightsQuery = query(flightsQuery, limit(paginationState.pageSize));

    const querySnapshot = await getDocs(flightsQuery);
    console.log(`Consulta ejecutada: se encontraron ${querySnapshot.size} resultados`);

    if (!querySnapshot.empty) {
      paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    const realFlights = querySnapshot.docs.map(doc => doc.data());

    const syntheticFlights = generateSyntheticFlights(origin, destination, isoDate, realFlights.length, {
      preferredAirline: airline || null,
    });

    if (querySnapshot.empty && airline && syntheticFlights.length === 0) {
      return `No se encontraron vuelos de ${airline} para la ruta ${origin}-${destination}${isoDate ? ` en la fecha ${dateStr}` : ''}.`;
    }

    const allFlights = [...realFlights, ...syntheticFlights]
      .sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''));

    if (allFlights.length === 0) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}${isoDate ? ` en la fecha ${dateStr}` : ''}.`;
    }

    paginationState.currentResults = allFlights;
    const hasSynthetic = syntheticFlights.length > 0;
    const hasMoreResults = allFlights.length > paginationState.pageSize;

    const header = await generateHeader('AN', destination, origin, dateStr);
    const infoLine = `${calculateDaysLeft(dateStr)} ${new Date().toLocaleDateString('en-US', { weekday: 'short' })} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const pageFlights = allFlights.slice(0, paginationState.pageSize);
    let index = paginationState.currentIndex;
    const flightLines = [];

    pageFlights.forEach((flight) => {
      if (flightClass && (!flight.class_availability || !flight.class_availability[flightClass])) {
        return;
      }

      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';

      const idxStr = String(index).padStart(2, ' ');
      const carrierStr = `${flight.airline_code} ${flight.flight_number}`.padEnd(8, ' ');

      let classesArr = [];
      if (flight.class_availability) {
        Object.entries(flight.class_availability).forEach(([classCode, seats]) => {
          classesArr.push(`${classCode}${seats}`);
        });
      } else if (flight.available_classes) {
        flight.available_classes.forEach(cls => {
          classesArr.push(`${cls.code}${cls.seats}`);
        });
      } else {
        classesArr = ['Y9', 'B9', 'M9'];
      }

      const classesFirstLine = classesArr.slice(0, 7).join(' ').padEnd(21, ' ') + '  ';
      const classesSecondLine = classesArr.length > 7 ? classesArr.slice(7).join(' ') : null;
      const routingStr = `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal}`.padEnd(13, ' ');
      const formatTime = (t) => t ? t.replace(':', '') : '----';
      const depTimeStr = formatTime(flight.departure_time).padEnd(8, ' ');

      let arrTimeBase = formatTime(flight.arrival_time);
      if (flight.arrival_time && flight.departure_time && flight.arrival_time < flight.departure_time) {
        arrTimeBase += '+1';
      }
      const arrTimeStr = arrTimeBase.padEnd(6, ' ');
      const equipStr = `E0/${aircraftCode}`.padEnd(12, ' ');

      flightLines.push(` ${idxStr}   ${carrierStr}${classesFirstLine}${routingStr}${depTimeStr}${arrTimeStr}${equipStr}${duration}`);

      if (classesSecondLine) {
        flightLines.push(`             ${classesSecondLine}`);
      }

      index++;
    });

    if (flightLines.length === 0) {
      return `No se encontraron vuelos con clase ${flightClass} disponible para la ruta ${origin}-${destination}.`;
    }

    const headerWithInfo = (header + ' ').padEnd(63, ' ') + infoLine;

    let response = `${headerWithInfo}\n`;
    response += flightLines.map(l => l + '\n').join('');

    paginationState.currentIndex = index;

    if (hasMoreResults) {
      response += '\nUse MD para mostrar mas resultados.';
    }

    if (hasSynthetic) {
      const syntheticAirlines = formatTrainingAirlineList(syntheticFlights.map(flight => flight.airline_code));
      response += `\n* Vuelos simulados de entrenamiento con codigos reales${syntheticAirlines ? ` (${syntheticAirlines})` : ''}. No representan disponibilidad real.`;
    }

    return response;
  } catch (error) {
    console.error('Error al procesar el comando AN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}
