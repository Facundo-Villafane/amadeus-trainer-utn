// src/services/openFlightsDataService.js

// Structure of the .dat file
// 1,"Goroka Airport","Goroka","Papua New Guinea","GKA","AYGA",-6.081689834590001,145.391998291,5282,10,"U","Pacific/Port_Moresby","airport","OurAirports"
// ID,Name,City,Country,IATA,ICAO,Latitude,Longitude,Altitude,Timezone,DST,Timezone Database,Type,Source

/**
 * Parse the airports.dat file format into structured objects
 * @param {string} dataContent - The content of the airports.dat file
 * @returns {Array} Array of airport objects
 */
function parseAirportsData(dataContent) {
    console.log('Comenzando a parsear datos de aeropuertos, tamaño del contenido:', dataContent.length);
    const lines = dataContent.split('\n');
    console.log('Cantidad de líneas en el archivo:', lines.length);
    const airports = [];
  
    lines.forEach((line, index) => {
      if (!line.trim()) return; // Skip empty lines
  
      try {
        // This regex handles commas inside quoted strings correctly
        const parts = [];
        let currentPart = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(currentPart);
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        
        // Add the last part
        parts.push(currentPart);
        
        // Remove quotes from the strings
        const cleanValues = parts.map(value => {
          if (value.startsWith('"') && value.endsWith('"')) {
            return value.substring(1, value.length - 1);
          }
          return value;
        });
  
        if (cleanValues.length < 5) { // Need at least ID, name, city, country, and IATA
          console.warn(`Línea ${index + 1}: Datos incompletos, se requieren al menos 5 campos:`, line);
          return;
        }
  
        // Create an airport object with the parsed values
        const airport = {
          id: parseInt(cleanValues[0], 10) || index + 1,
          name: cleanValues[1] || '',
          city: cleanValues[2] || '',
          country: cleanValues[3] || '',
          iata: cleanValues[4] || '', // Airport code
        };

        // Add optional fields if they exist
        if (cleanValues.length > 5) airport.icao = cleanValues[5] || '';
        if (cleanValues.length > 6) airport.latitude = parseFloat(cleanValues[6]) || 0;
        if (cleanValues.length > 7) airport.longitude = parseFloat(cleanValues[7]) || 0;
        
        // Skip airports without IATA codes (they're not useful for our purpose)
        // Also skip if it has "\\N" or empty string as IATA
        if (!airport.iata || airport.iata === "\\N" || airport.iata.trim() === "") {
          return;
        }
        
        // Skip airports without city name
        if (!airport.city || airport.city.trim() === "") {
          return;
        }

        airports.push(airport);
        
        // Log every 1000 airports processed as a progress indicator
        if (airports.length % 1000 === 0) {
          console.log(`Procesados ${airports.length} aeropuertos válidos hasta ahora...`);
        }
      } catch (error) {
        console.error(`Error al parsear línea ${index + 1}:`, error, 'Contenido de la línea:', line);
      }
    });
  
    console.log(`Terminado! Se procesaron ${airports.length} aeropuertos válidos.`);
    return airports;
}

// Esta es una pequeña muestra de aeropuertos para usar como fallback si todo lo demás falla
const fallbackAirports = [
  // Argentina
  { id: 1, name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", iata: "EZE" },
  { id: 2, name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", iata: "AEP" },
  { id: 3, name: "Governor Francisco Gabrielli International Airport", city: "Mendoza", country: "Argentina", iata: "MDZ" },
  { id: 4, name: "Teniente Benjamin Matienzo International Airport", city: "Tucuman", country: "Argentina", iata: "TUC" },
  { id: 5, name: "Ingeniero Aeronáutico Ambrosio L.V. Taravella International Airport", city: "Cordoba", country: "Argentina", iata: "COR" },
  { id: 6, name: "Sauce Viejo Airport", city: "Santa Fe", country: "Argentina", iata: "SFN" },
  { id: 7, name: "Islas Malvinas Airport", city: "Rosario", country: "Argentina", iata: "ROS" },
  { id: 8, name: "Cataratas Del Iguazú International Airport", city: "Puerto Iguazu", country: "Argentina", iata: "IGR" },
  { id: 9, name: "Resistencia International Airport", city: "Resistencia", country: "Argentina", iata: "RES" },
  { id: 10, name: "Viedma Airport", city: "Viedma", country: "Argentina", iata: "VDM" },
  
  // Chile
  { id: 11, name: "Comodoro Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", iata: "SCL" },
  
  // Uruguay
  { id: 12, name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", iata: "MVD" },
  
  // Brazil
  { id: 13, name: "São Paulo-Guarulhos International Airport", city: "Sao Paulo", country: "Brazil", iata: "GRU" },
  { id: 14, name: "Rio de Janeiro/Galeão International Airport", city: "Rio De Janeiro", country: "Brazil", iata: "GIG" },
];

// In-memory data structures
let AIRPORTS_DATA = [];
let CITIES_DATA = {};
let initialized = false;
let loadAttempted = false;

/**
 * Initialize the service with the airports data
 * @param {string} airportsDataContent - The content of the airports.dat file
 */
export function initializeService(airportsDataContent) {
  if (initialized || loadAttempted) return;
  
  loadAttempted = true; // Mark that we've attempted to load, to prevent infinite recursion
  
  try {
    console.log('Iniciando servicio de datos de aeropuertos...');
    
    // If data was provided directly, use it
    if (airportsDataContent && airportsDataContent.length > 100) {
      console.log('Procesando datos proporcionados, longitud:', airportsDataContent.length);
      processAirportsData(airportsDataContent);
      return;
    }
    
    console.log('Intentando cargar datos desde variable global window._airportsData si existe...');
    
    // Try to access the data from a global variable if available
    if (typeof window !== 'undefined' && window._airportsData) {
      console.log('Datos encontrados en window._airportsData, longitud:', window._airportsData.length);
      processAirportsData(window._airportsData);
      return;
    }
    
    // Hard-coded path to try loading the file using AJAX
    const paths = [
      '/data/airports-extended.dat',
      '/src/data/airports-extended.dat',
      '/public/data/airports-extended.dat',
      '/assets/data/airports-extended.dat',
      '../data/airports-extended.dat',
      './data/airports-extended.dat',
    ];
    
    console.log('Intentando cargar el archivo desde múltiples rutas...');
    
    // Try each path in sequence
    loadFromPathsSequentially(paths, 0);
    
  } catch (error) {
    console.error('Error al inicializar servicio de datos de aeropuertos:', error);
    useFallbackData();
  }
}

/**
 * Try to load the data file from multiple paths sequentially
 */
function loadFromPathsSequentially(paths, index) {
  if (index >= paths.length) {
    console.warn('No se pudo cargar el archivo desde ninguna ruta, usando datos de respaldo');
    useFallbackData();
    return;
  }
  
  const path = paths[index];
  console.log(`Intentando cargar desde: ${path}`);
  
  // Create an XMLHttpRequest to load the file
  const xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log(`Archivo cargado con éxito desde ${path}, longitud:`, xhr.responseText.length);
        processAirportsData(xhr.responseText);
      } else {
        console.warn(`Fallo al cargar desde ${path}, código: ${xhr.status}, intentando siguiente ruta...`);
        loadFromPathsSequentially(paths, index + 1);
      }
    }
  };
  xhr.send();
}

/**
 * Use fallback data if all load attempts fail
 */
function useFallbackData() {
  console.warn('Usando datos de respaldo con aeropuertos limitados...');
  AIRPORTS_DATA = fallbackAirports;
  buildCitiesData();
  initialized = true;
}

/**
 * Process the airports data after loading
 * @param {string} dataContent - The airports data content
 */
function processAirportsData(dataContent) {
  try {
    // Parse the airports data
    const parsedAirports = parseAirportsData(dataContent);
    
    if (parsedAirports.length > 0) {
      AIRPORTS_DATA = parsedAirports;
    } else {
      console.warn('No se pudieron parsear aeropuertos, usando datos de respaldo');
      AIRPORTS_DATA = fallbackAirports;
    }
    
    buildCitiesData();
    initialized = true;
    
  } catch (error) {
    console.error('Error al procesar datos de aeropuertos:', error);
    useFallbackData();
  }
}

/**
 * Build the cities data from airports data
 */
function buildCitiesData() {
  console.log(`Creando estructura de datos de ciudades a partir de ${AIRPORTS_DATA.length} aeropuertos...`);
  
  // Reset cities data
  CITIES_DATA = {};
  
  // Group airports by city to create city entries
  AIRPORTS_DATA.forEach(airport => {
    if (!airport.city || !airport.iata) return;
    
    const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
    
    if (!CITIES_DATA[cityKey]) {
      // Create a new city entry
      CITIES_DATA[cityKey] = {
        name: airport.city,
        country: airport.country,
        countryCode: getCountryCode(airport.country),
        code: airport.iata, // Use the airport code as the city code initially
        name_uppercase: airport.city.toUpperCase(),
        airports: []
      };
    }
    
    // Add this airport to the city's airports
    CITIES_DATA[cityKey].airports.push({
      code: airport.iata,
      name: airport.name,
      distance: '0K',
    });
  });
  
  // Second pass: set city codes correctly (main airport of each city)
  Object.keys(CITIES_DATA).forEach(cityKey => {
    const city = CITIES_DATA[cityKey];
    
    // Sort airports by IATA code (often main airports have shorter codes)
    city.airports.sort((a, b) => a.code.localeCompare(b.code));
    
    // Use the first airport's code as the city code
    // This is a simplification - in reality there are more complex rules
    if (city.airports.length > 0) {
      city.code = city.airports[0].code;
    }
  });
  
  console.log(`Inicialización completada: ${AIRPORTS_DATA.length} aeropuertos en ${Object.keys(CITIES_DATA).length} ciudades.`);
  
  // Log some sample data for verification
  const sampleAirports = AIRPORTS_DATA.slice(0, 5);
  console.log('Muestra de aeropuertos:', sampleAirports.map(a => `${a.iata}: ${a.name} (${a.city}, ${a.country})`));
  
  const cityKeys = Object.keys(CITIES_DATA).slice(0, 5);
  console.log('Muestra de ciudades:', cityKeys.map(k => `${CITIES_DATA[k].code}: ${CITIES_DATA[k].name} (${CITIES_DATA[k].country})`));
}
  
/**
 * Get a 2-letter country code
 * This is a simple mapping for common countries
 */
function getCountryCode(country) {
  const countryCodes = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Spain': 'ES',
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'Japan': 'JP',
    'China': 'CN',
    'Russia': 'RU',
    'Brazil': 'BR',
    'Argentina': 'AR',
    'Australia': 'AU',
    'Canada': 'CA',
    'Mexico': 'MX',
    'India': 'IN',
    'Papua New Guinea': 'PG',
    'Chile': 'CL',
    'Peru': 'PE',
    'Colombia': 'CO',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'Ecuador': 'EC',
    'Venezuela': 'VE',
  };
  
  return countryCodes[country] || 'XX';
}
  
/**
 * Search for cities by name
 * @param {string} cityName - Name of the city to search for
 * @returns {Array} - Array of matching cities
 */
export function searchCitiesByName(cityName) {
  if (!initialized) {
    console.warn('Servicio de datos de aeropuertos no inicializado, inicializando con valores predeterminados');
    initializeService('');
  }
  
  const upperCityName = cityName.toUpperCase();
  const results = [];
  
  // Search through cities
  for (const key in CITIES_DATA) {
    const city = CITIES_DATA[key];
    if (city.name_uppercase.includes(upperCityName)) {
      results.push(city);
    }
  }
  
  // If no exact city matches, try searching through airports
  if (results.length === 0) {
    // Create a set to prevent duplicate cities
    const citiesFound = new Set();
    
    AIRPORTS_DATA.forEach(airport => {
      if (airport.city.toUpperCase().includes(upperCityName) && !citiesFound.has(airport.city)) {
        citiesFound.add(airport.city);
        
        // Find the corresponding city entry
        const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
        const city = CITIES_DATA[cityKey];
        
        if (city) {
          results.push(city);
        } else {
          // If city entry doesn't exist, create a temporary one
          results.push({
            name: airport.city,
            country: airport.country,
            countryCode: getCountryCode(airport.country),
            code: airport.iata,
            name_uppercase: airport.city.toUpperCase(),
            airports: [{
              code: airport.iata,
              name: airport.name,
              distance: '0K'
            }]
          });
        }
      }
    });
  }
  
  // Log search results for debugging
  console.log(`Búsqueda de ciudad "${cityName}" retornó ${results.length} resultados:`, 
    results.map(r => `${r.name} (${r.code})`));
  
  return results.slice(0, 5); // Limit to 5 results
}
  
/**
 * Search for cities by code
 * @param {string} cityCode - City code (usually 3 letters)
 * @returns {Object|null} - The city object or null if not found
 */
export function getCityByCode(cityCode) {
  if (!initialized) {
    console.warn('Servicio de datos de aeropuertos no inicializado, inicializando con valores predeterminados');
    initializeService('');
  }
  
  const upperCityCode = cityCode.toUpperCase();
  
  // First, look for exact matches in city codes
  for (const key in CITIES_DATA) {
    const city = CITIES_DATA[key];
    if (city.code === upperCityCode) {
      return city;
    }
  }
  
  // If not found as a city code, look for cities that have this airport code
  for (const key in CITIES_DATA) {
    const city = CITIES_DATA[key];
    if (city.airports.some(airport => airport.code === upperCityCode)) {
      return {
        ...city,
        code: upperCityCode // Override the city code with the airport code for proper response formatting
      };
    }
  }
  
  // If still not found, try to find airport by code directly
  const airport = AIRPORTS_DATA.find(a => a.iata === upperCityCode);
  if (airport) {
    // Create a city object from the airport data
    const cityObject = {
      name: airport.city,
      country: airport.country,
      countryCode: getCountryCode(airport.country),
      code: airport.iata,
      name_uppercase: airport.city.toUpperCase(),
      airports: [{
        code: airport.iata,
        name: airport.name,
        distance: '0K'
      }]
    };
    
    // Store it for future use
    const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
    CITIES_DATA[cityKey] = cityObject;
    
    return cityObject;
  }
  
  return null;
}
  
/**
 * Search for airports by code
 * @param {string} airportCode - Airport IATA code (3 letters)
 * @returns {Object|null} - The airport object or null if not found
 */
export function getAirportByCode(airportCode) {
  if (!initialized) {
    console.warn('Servicio de datos de aeropuertos no inicializado, inicializando con valores predeterminados');
    initializeService('');
  }
  
  const upperAirportCode = airportCode.toUpperCase();
  
  // Search through airports
  const airport = AIRPORTS_DATA.find(a => a.iata === upperAirportCode);
  
  if (!airport) return null;
  
  // Find the city for this airport
  const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
  const city = CITIES_DATA[cityKey];
  
  return {
    ...airport,
    city_code: city ? city.code : airport.iata,
    city_name: airport.city,
    country_code: getCountryCode(airport.country)
  };
}

// Initialize at load time to make data available as soon as possible
initializeService('');
  
export default {
  initializeService,
  searchCitiesByName,
  getCityByCode,
  getAirportByCode,
  // Expose for testing
  getInitializedStatus: () => initialized
};