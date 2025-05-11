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
    
    // Extraer opciones adicionales
    const { airline, flightClass } = parseOptions(options);
    
    // Convertir dateStr a formato DD/MM/AAAA para el filtro
    const departureDateStr = toDDMMYYYY(dateStr);
    
    // Construir consulta a Firebase
    let flightsQuery = query(collection(db, 'flights'));
    
    // Filtrar por origen, destino y fecha
    flightsQuery = query(flightsQuery, 
      where('departure_airport_code', '==', origin),
      where('arrival_airport_code', '==', destination),
      where('departure_date', '==', departureDateStr)
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
    
    // Deduplicar vuelos por flight_number, departure_date y departure_time
    const uniqueFlightsMap = new Map();
    querySnapshot.forEach((doc) => {
      const flight = doc.data();
      const key = `${flight.flight_number}_${flight.departure_date}_${flight.departure_time}`;
      if (!uniqueFlightsMap.has(key)) {
        uniqueFlightsMap.set(key, flight);
      }
    });
    const uniqueFlights = Array.from(uniqueFlightsMap.values());
    
    // Si hay exactamente `pageSize` resultados, verificar si hay más resultados
    const hasMoreResults = querySnapshot.docs.length === paginationState.pageSize;
    
    // Procesar resultados
    let index = paginationState.currentIndex;
    const flightLines = [];
    uniqueFlights.forEach((flight) => {
      // Si se especificó una clase, verificar si el vuelo tiene esa clase disponible
      if (flightClass && (!flight.class_availability || !flight.class_availability[flightClass])) {
        return; // Saltar este vuelo si no tiene la clase especificada
      }
      
      const departureTerminal = flight.departure_terminal || ' ';
      const arrivalTerminal = flight.arrival_terminal || ' ';
      const aircraftCode = getAircraftIATACode(flight.equipment_code || flight.aircraft_type || '---');
      const duration = flight.duration_hours ? formatDuration(flight.duration_hours) : '----';
      
      // Construir línea de vuelo
      let flightLine = `${index} ${flight.flight_number} `;
      
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
    
    // === Generar línea de info alineada a la derecha ===
    const infoLine = `${calculateDaysLeft(dateStr)} ${new Date().toLocaleDateString('en-US', { weekday: 'short' })} ${new Date().toLocaleDateString('en-US', { month: 'short' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const paddedInfoLine = infoLine.padStart(maxLineLength);
    // === FIN NUEVO ===

    const header = await generateHeader('AN', destination, origin, dateStr);
    // Header e info alineada a la derecha en una sola línea
    // Calcula el espacio disponible para la info
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

// Utilidad para convertir dateStr tipo 10OCT o 10OCT24 a DD/MM/AAAA
function toDDMMYYYY(dateStr) {
  if (!dateStr) return null;
  const months = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  const match = dateStr.match(/^(\d{1,2})([A-Z]{3})(\d{2,4})?$/i);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = months[match[2].toUpperCase()];
  let year = match[3];
  if (!year) {
    year = new Date().getFullYear();
  } else if (year.length === 2) {
    // Asumir 20xx para años de dos dígitos
    year = '20' + year;
  }
  return `${day}/${month}/${year}`;
}