// src/utils/commandParser/commands/availability.js

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { parseANCommand, parseOptions } from '../parserUtils';
import { generateHeader } from '../formatters';
import { formatDuration, getAircraftIATACode, calculateDaysLeft } from '../helpers';
import paginationState from '../paginationState';
import { normalizeDateToISO } from '../../flightUtils';
import { generateSyntheticFlights } from '../syntheticFlights';

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

    console.log(`Buscando vuelos: Origen=${origin}, Destino=${destination}, Fecha=${dateStr || 'cualquier fecha'}`);

    // Extraer opciones adicionales
    const { airline, flightClass } = parseOptions(options);

    // Convertir fecha del comando a ISO YYYY-MM-DD (formato estándar en DB)
    const isoDate = dateStr ? normalizeDateToISO(dateStr) : null;
    console.log(`Fecha del comando "${dateStr}" normalizada a: ${isoDate}`);

    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));

    // Filtrar por origen y destino
    flightsQuery = query(flightsQuery,
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination)
    );

    // Si se especificó fecha, filtrar directamente en Firestore (comparación exacta ISO)
    if (isoDate) {
      flightsQuery = query(flightsQuery, where('departure_date', '==', isoDate));
    }

    // Si se especificó aerolínea, filtrar por aerolínea
    if (airline) {
      flightsQuery = query(flightsQuery, where('airline_code', '==', airline));
    }

    // Ordenar por hora de salida y paginar
    flightsQuery = query(flightsQuery, orderBy('departure_time'));
    flightsQuery = query(flightsQuery, limit(paginationState.pageSize));

    // Ejecutar la consulta
    const querySnapshot = await getDocs(flightsQuery);

    console.log(`Consulta ejecutada: se encontraron ${querySnapshot.size} resultados`);

    if (querySnapshot.empty && airline) {
      // Si filtraron por aerolínea específica y no hay resultados, no generar sintéticos
      return `No se encontraron vuelos de ${airline} para la ruta ${origin}-${destination}${isoDate ? ` en la fecha ${dateStr}` : ''}.`;
    }

    // Actualizar el último documento visible para paginación
    if (!querySnapshot.empty) {
      paginationState.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    const realFlights = querySnapshot.docs.map(doc => doc.data());

    // ── Vuelos sintéticos (ghost flights) ──────────────────────────────────
    // Si hay menos de 10 vuelos reales, completar con vuelos XT (Amadeus Trainer)
    // Solo si NO se filtró por aerolínea específica
    const syntheticFlights = !airline
      ? generateSyntheticFlights(origin, destination, isoDate, realFlights.length)
      : [];

    // Mezclar y ordenar por hora de salida
    const allFlights = [...realFlights, ...syntheticFlights]
      .sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''));

    if (allFlights.length === 0) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}${isoDate ? ` en la fecha ${dateStr}` : ''}.`;
    }

    paginationState.currentResults = allFlights;
    const hasSynthetic = syntheticFlights.length > 0;

    const hasMoreResults = allFlights.length > paginationState.pageSize;

    // Generar cabecera
    const header = await generateHeader('AN', destination, origin, dateStr);
    const infoLine = `${calculateDaysLeft(dateStr)} ${new Date().toLocaleDateString('en-US', { weekday: 'short' })} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    // Procesar resultados (solo la primera página)
    const pageFlights = allFlights.slice(0, paginationState.pageSize);
    let index = paginationState.currentIndex;
    const flightLines = [];

    pageFlights.forEach((flight) => {
      // Si se especificó una clase, verificar si el vuelo tiene esa clase disponible
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

      // Max 7 classes per line = 21 chars + 1 padding space
      let classesFirstLine = classesArr.slice(0, 7).join(' ').padEnd(21, ' ') + '  ';
      let classesSecondLine = classesArr.length > 7 ? classesArr.slice(7).join(' ') : null;

      const routingStr = `${flight.departure_airport_code} ${departureTerminal} ${flight.arrival_airport_code} ${arrivalTerminal}`.padEnd(13, ' ');

      // Format times to 4 chars without colon (e.g. 01:25 -> 0125)
      const formatTime = (t) => t ? t.replace(':', '') : '----';
      const depTimeStr = formatTime(flight.departure_time).padEnd(8, ' ');

      // Determine if arrival is next day
      let arrTimeBase = formatTime(flight.arrival_time);
      if (flight.arrival_time && flight.departure_time && flight.arrival_time < flight.departure_time) {
        arrTimeBase += '+1';
      }
      const arrTimeStr = arrTimeBase.padEnd(6, ' ');

      const equipStr = `E0/${aircraftCode}`.padEnd(12, ' ');

      let flightLine = ` ${idxStr}   ${carrierStr}${classesFirstLine}${routingStr}${depTimeStr}${arrTimeStr}${equipStr}${duration}`;
      flightLines.push(flightLine);

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
      response += '\nUse MD para mostrar más resultados.';
    }

    if (hasSynthetic) {
      response += '\nXT: Amadeus Trainer flights - training purposes only.';
    }

    return response;
  } catch (error) {
    console.error('Error al procesar el comando AN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}