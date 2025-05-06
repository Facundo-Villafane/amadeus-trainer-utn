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
    const lines = dataContent.split('\n');
    const airports = [];
  
    lines.forEach(line => {
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
  
        if (cleanValues.length < 14) {
          console.warn('Invalid airport data line, not enough fields:', line);
          return;
        }
  
        // Create an airport object with the parsed values
        const airport = {
          id: parseInt(cleanValues[0], 10),
          name: cleanValues[1],
          city: cleanValues[2],
          country: cleanValues[3],
          iata: cleanValues[4], // Airport code
          icao: cleanValues[5],
          latitude: parseFloat(cleanValues[6]),
          longitude: parseFloat(cleanValues[7]),
          altitude: parseFloat(cleanValues[8]),
          timezone: parseFloat(cleanValues[9]),
          dst: cleanValues[10],
          tz_database: cleanValues[11],
          type: cleanValues[12],
          source: cleanValues[13]
        };
        
        // Skip airports without IATA codes (they're not useful for our purpose)
        if (airport.iata && airport.iata !== "\\N" && airport.iata.trim() !== "") {
          airports.push(airport);
        }
      } catch (error) {
        console.error('Error parsing airport line:', line, error);
      }
    });
  
    return airports;
  }
  
  // Add some important airports manually to ensure they're included
  const manualAirports = [
    {
      id: 9999,
      name: "Teniente Benjamin Matienzo International Airport",
      city: "Tucuman",
      country: "Argentina",
      iata: "TUC",
      icao: "SANT",
      latitude: -26.8438,
      longitude: -65.1049,
      altitude: 1500,
      timezone: -3,
      dst: "N",
      tz_database: "America/Argentina/Tucuman",
      type: "airport",
      source: "manual"
    },
    // Add more manually if needed
  ];
  
  // In-memory data structures
  let AIRPORTS_DATA = [];
  let CITIES_DATA = {};
  let initialized = false;
  
  /**
   * Initialize the service with the airports data
   * @param {string} airportsDataContent - The content of the airports.dat file
   */
  export function initializeService(airportsDataContent) {
    if (initialized) return;
    
    try {
      // Parse the airports data
      const parsedAirports = airportsDataContent ? parseAirportsData(airportsDataContent) : [];
      
      // Combine with manual airports
      AIRPORTS_DATA = [...parsedAirports, ...manualAirports];
      
      // If no data was parsed, use only manual airports
      if (AIRPORTS_DATA.length === 0) {
        console.warn('No airports data parsed, using only manual data');
        AIRPORTS_DATA = manualAirports;
      }
      
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
            code: getCityCode(airport),
            name_uppercase: airport.city.toUpperCase(),
            airports: []
          };
        }
        
        // Add this airport to the city's airports
        CITIES_DATA[cityKey].airports.push({
          code: airport.iata,
          name: airport.name,
          distance: '0K', // We could calculate this, but it's not needed for the basic implementation
        });
      });
      
      initialized = true;
      console.log(`Initialized with ${AIRPORTS_DATA.length} airports and ${Object.keys(CITIES_DATA).length} cities.`);
    } catch (error) {
      console.error('Error initializing OpenFlights data service:', error);
      
      // Still mark as initialized to prevent repeated initialization attempts
      initialized = true;
      
      // Use manual airports as fallback
      AIRPORTS_DATA = manualAirports;
      
      // Setup cities data from manual airports
      manualAirports.forEach(airport => {
        const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
        
        CITIES_DATA[cityKey] = {
          name: airport.city,
          country: airport.country,
          countryCode: getCountryCode(airport.country),
          code: airport.iata, // Use the airport code as the city code
          name_uppercase: airport.city.toUpperCase(),
          airports: [{
            code: airport.iata,
            name: airport.name,
            distance: '0K'
          }]
        };
      });
      
      console.log(`Initialized with ${AIRPORTS_DATA.length} manual airports as fallback.`);
    }
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
      // Add more as needed
    };
    
    return countryCodes[country] || 'XX';
  }
  
  /**
   * Get a 3-letter code for the city
   * Usually the city code is the code of its main airport
   */
  function getCityCode(airport) {
    // In many cases, the IATA code of the main airport is used as the city code
    return airport.iata;
  }
  
  /**
   * Search for cities by name
   * @param {string} cityName - Name of the city to search for
   * @returns {Array} - Array of matching cities
   */
  export function searchCitiesByName(cityName) {
    if (!initialized) {
      console.warn('OpenFlights data service not initialized, initializing with defaults');
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
    
    return results.slice(0, 5); // Limit to 5 results
  }
  
  /**
   * Search for cities by code
   * @param {string} cityCode - City code (usually 3 letters)
   * @returns {Object|null} - The city object or null if not found
   */
  export function getCityByCode(cityCode) {
    if (!initialized) {
      console.warn('OpenFlights data service not initialized, initializing with defaults');
      initializeService('');
    }
    
    const upperCityCode = cityCode.toUpperCase();
    
    // In OpenFlights, city codes and airport codes can be the same
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
    
    return null;
  }
  
  /**
   * Search for airports by code
   * @param {string} airportCode - Airport IATA code (3 letters)
   * @returns {Object|null} - The airport object or null if not found
   */
  export function getAirportByCode(airportCode) {
    if (!initialized) {
      console.warn('OpenFlights data service not initialized, initializing with defaults');
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
  
  // Initialize with empty data to ensure manual airports are available immediately
  initializeService('');
  
  export default {
    initializeService,
    searchCitiesByName,
    getCityByCode,
    getAirportByCode,
    // Expose for testing
    getInitializedStatus: () => initialized
  };