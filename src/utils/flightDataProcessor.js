// src/utils/flightDataProcessor.js

import { normalizeLegacyDateToISO } from './flightUtils';

/**
 * Procesa los datos de vuelos para completar información faltante
 * y normalizar el formato de fecha a ISO YYYY-MM-DD.
 * @param {Array} flights - Array de objetos de vuelos desde Mockaroo/JSON
 * @returns {Array} - Array de vuelos con datos normalizados
 */
export function processFlightData(flights) {
  return flights.map(flight => {
    const processedFlight = { ...flight };

    // Normalizar departure_date a formato ISO YYYY-MM-DD
    if (processedFlight.departure_date) {
      const normalized = normalizeLegacyDateToISO(processedFlight.departure_date);
      if (normalized) {
        processedFlight.departure_date = normalized;
      }
    }

    // Normalizar arrival_date también si existe
    if (processedFlight.arrival_date) {
      const normalized = normalizeLegacyDateToISO(processedFlight.arrival_date);
      if (normalized) {
        processedFlight.arrival_date = normalized;
      }
    }

    // Calcular arrival_date y arrival_time basados en departure y duration
    if (processedFlight.departure_date && processedFlight.departure_time && processedFlight.duration_hours) {
      // Importar dinámicamente para no crear dependencia circular
      const { calculateArrival } = require('./flightUtils');
      const { arrival_date, arrival_time } = calculateArrival(
        processedFlight.departure_date,
        processedFlight.departure_time,
        processedFlight.duration_hours
      );
      if (arrival_date) processedFlight.arrival_date = arrival_date;
      if (arrival_time) processedFlight.arrival_time = arrival_time;
    }

    // Procesar class_availability si está como array vacío
    if (Array.isArray(processedFlight.class_availability) && processedFlight.class_availability.length > 0) {
      const classes = ['F', 'J', 'Y', 'W', 'M', 'B', 'K', 'H', 'Q', 'L', 'V'];
      const availability = {};
      // Usar disponibilidad fija (no aleatoria) para consistencia
      classes.forEach(cls => {
        availability[cls] = 9;
      });
      processedFlight.class_availability = availability;
    }

    // Procesar available_classes si es un string simple
    if (typeof processedFlight.available_classes === 'string') {
      const classes = ['F', 'J', 'Y', 'W', 'M', 'B', 'K', 'H', 'Q', 'L', 'V'];
      processedFlight.available_classes = classes;
    }

    // Procesar connection_airports si está como array de objetos vacíos
    if (Array.isArray(processedFlight.connection_airports)) {
      if (processedFlight.stops === 0) {
        processedFlight.connection_airports = [];
      } else {
        processedFlight.connection_airports = [];
      }
    }

    return processedFlight;
  });
}