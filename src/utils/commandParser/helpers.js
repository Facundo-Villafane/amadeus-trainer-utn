// src/utils/commandParser/helpers.js
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import esLocale from 'i18n-iso-countries/langs/es.json';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Inicializar la librería con los idiomas que necesitas
countries.registerLocale(enLocale);
countries.registerLocale(esLocale);

// Función para calcular los días reales que faltan hasta la fecha de viaje
export function calculateDaysLeft(dateStr) {
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
    
      if (!Object.prototype.hasOwnProperty.call(monthMap, monthStr)) {
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

// Función para obtener información del destino desde Firebase
export async function getDestinationInfoFromDB(destinationCode) {
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
export function getCountryCode(countryName) {
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
export function getDefaultDestinationInfo(destinationCode) {
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

// Función para formatear duración en horas:minutos
export function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Función auxiliar para obtener código IATA del equipo
export function getAircraftIATACode(aircraft) {
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