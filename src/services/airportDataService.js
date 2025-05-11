// src/services/airportDataService.js
import { convertDatToJson } from '../utils/datToJsonConverter';

// A module to handle airport data management
class AirportDataService {
  constructor() {
    this.initialized = false;
    this.airports = [];
    this.cities = {};
    this.metadata = {};
    
    // Fallback data for critical airports (will be used if loading fails)
    this.fallbackData = {
      // Key airports in Argentina and main international destinations
      airports: [
        { id: 1, name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", iata: "EZE" },
        { id: 2, name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", iata: "AEP" },
        { id: 3, name: "Ingeniero Aeronáutico Ambrosio L.V. Taravella International Airport", city: "Cordoba", country: "Argentina", iata: "COR" },
        { id: 4, name: "Comodoro Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", iata: "SCL" },
        { id: 5, name: "Madrid Barajas International Airport", city: "Madrid", country: "Spain", iata: "MAD" },
        { id: 6, name: "Barcelona–El Prat Airport", city: "Barcelona", country: "Spain", iata: "BCN" },
        { id: 7, name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "Spain", iata: "MAD" },
        { id: 8, name: "Heathrow Airport", city: "London", country: "United Kingdom", iata: "LHR" },
        { id: 9, name: "Charles de Gaulle Airport", city: "Paris", country: "France", iata: "CDG" },
        { id: 10, name: "Leonardo da Vinci International Airport", city: "Rome", country: "Italy", iata: "FCO" }
      ],
      
      // Corresponding cities
      cities: [
        { name: "Buenos Aires", country: "Argentina", countryCode: "AR", code: "EZE", name_uppercase: "BUENOS AIRES", 
          airports: [
            { code: "EZE", name: "Ministro Pistarini International Airport", distance: "0K" },
            { code: "AEP", name: "Jorge Newbery Airfield", distance: "0K" }
          ] 
        },
        { name: "Cordoba", country: "Argentina", countryCode: "AR", code: "COR", name_uppercase: "CORDOBA", 
          airports: [{ code: "COR", name: "Ingeniero Aeronáutico Ambrosio L.V. Taravella International Airport", distance: "0K" }] 
        },
        { name: "Santiago", country: "Chile", countryCode: "CL", code: "SCL", name_uppercase: "SANTIAGO", 
          airports: [{ code: "SCL", name: "Comodoro Arturo Merino Benítez International Airport", distance: "0K" }] 
        },
        { name: "Madrid", country: "Spain", countryCode: "ES", code: "MAD", name_uppercase: "MADRID", 
          airports: [{ code: "MAD", name: "Madrid Barajas International Airport", distance: "0K" }] 
        },
        { name: "Barcelona", country: "Spain", countryCode: "ES", code: "BCN", name_uppercase: "BARCELONA", 
          airports: [{ code: "BCN", name: "Barcelona–El Prat Airport", distance: "0K" }] 
        },
        { name: "London", country: "United Kingdom", countryCode: "GB", code: "LHR", name_uppercase: "LONDON", 
          airports: [{ code: "LHR", name: "Heathrow Airport", distance: "0K" }] 
        },
        { name: "Paris", country: "France", countryCode: "FR", code: "CDG", name_uppercase: "PARIS", 
          airports: [{ code: "CDG", name: "Charles de Gaulle Airport", distance: "0K" }] 
        },
        { name: "Rome", country: "Italy", countryCode: "IT", code: "FCO", name_uppercase: "ROME", 
          airports: [{ code: "FCO", name: "Leonardo da Vinci International Airport", distance: "0K" }] 
        }
      ]
    };
  }

  /**
   * Initialize the service with data
   * @param {string|Object} data - Either raw DAT file content or pre-processed JSON
   * @returns {Promise<boolean>} Success status
   */
  async initialize(data) {
    if (this.initialized) {
      console.log('Airport data service already initialized');
      return true;
    }
    
    try {
      // Si no hay datos proporcionados, intentar cargar el archivo DAT
      if (!data) {
        console.log('No data provided, attempting to load DAT file');
        const success = await this.loadFromUrl();
        if (success) {
          this.initialized = true;
          return true;
        }
      }
      
      // Si data es un string, intentar parsearlo como DAT
      if (typeof data === 'string' && data.length > 100) {
        console.log('Processing provided DAT file data');
        const result = convertDatToJson(data);
        if (result.airports && result.airports.length > 0) {
          this.airports = result.airports;
          this.cities = this.arrayToCityMap(result.cities || []);
          this.metadata = result.metadata || {};
          this.initialized = true;
          return true;
        }
      }
      
      // Si data es un objeto, usarlo directamente
      if (typeof data === 'object' && data !== null) {
        console.log('Using provided object data');
        if (data.airports && data.airports.length > 0) {
          this.airports = data.airports;
          this.cities = this.arrayToCityMap(data.cities || []);
          this.metadata = data.metadata || {};
          this.initialized = true;
          return true;
        }
      }
      
      // Si llegamos aquí, usar datos de respaldo
      console.warn('No valid data found, using fallback data');
      this.useFallbackData();
      return true;
      
    } catch (error) {
      console.error('Error initializing airport data service:', error);
      this.useFallbackData();
      return true;
    }
  }
  
  /**
   * Use fallback data when loading fails
   */
  useFallbackData() {
    console.log('Using fallback airport data');
    this.airports = this.fallbackData.airports;
    this.cities = this.arrayToCityMap(this.fallbackData.cities);
    this.metadata = { source: 'fallback', count: this.airports.length };
    this.initialized = true;
  }
  
  /**
   * Convert an array of cities to a map for efficient lookup
   * @param {Array} citiesArray - Array of city objects
   * @returns {Object} Map of cities with city code as key
   */
  arrayToCityMap(citiesArray) {
    const cityMap = {};
    citiesArray.forEach(city => {
      // Use city code as primary key
      cityMap[city.code] = city;
      
      // Also map by name for easier search
      const nameKey = `name:${city.name.toUpperCase()}`;
      if (!cityMap[nameKey]) {
        cityMap[nameKey] = [];
      }
      cityMap[nameKey].push(city);
    });
    return cityMap;
  }
  
  /**
   * Try to load the DAT file from various possible locations
   * @returns {Promise<boolean>} Success status
   */
  async loadFromUrl() {
    const possiblePaths = [
      '/src/data/airports-extended.dat',
      '/data/airports-extended.dat',
      '/public/data/airports-extended.dat',
      './data/airports-extended.dat',
      '../data/airports-extended.dat',
    ];
    
    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to load from ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          const datContent = await response.text();
          console.log('Successfully loaded DAT file, content length:', datContent.length);
          
          if (!datContent || datContent.length < 100) {
            console.warn('DAT file content is too short or empty');
            continue;
          }
          
          const result = convertDatToJson(datContent);
          console.log('Converted DAT to JSON, airports:', result.airports?.length || 0);
          
          if (!result.airports || result.airports.length < 10) {
            console.warn('Converted data has insufficient airports');
            continue;
          }
          
          this.airports = result.airports;
          this.cities = this.arrayToCityMap(result.cities || []);
          this.metadata = result.metadata || {};
          
          // Cache the data in localStorage for future use
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem('airportsData', JSON.stringify({
                airports: this.airports,
                cities: Object.values(this.cities).filter(city => typeof city !== 'function' && !Array.isArray(city)),
                metadata: this.metadata
              }));
              console.log('Airport data cached in localStorage');
            } catch (storageError) {
              console.warn('Failed to cache airport data in localStorage:', storageError);
            }
          }
          
          this.initialized = true;
          console.log(`Airport data loaded from ${path}`);
          return true;
        }
      } catch (error) {
        console.warn(`Failed to load from ${path}:`, error);
      }
    }
    
    console.warn('Failed to load airport data from any path');
    this.useFallbackData();
    return false;
  }
  
  /**
   * Search for cities by name
   * @param {string} cityName - The city name to search for
   * @returns {Array} - Matching cities
   */
  searchCitiesByName(cityName) {
    if (!this.initialized) {
      console.warn('Airport data service not initialized');
      this.useFallbackData();
    }
    
    const upperName = cityName.toUpperCase();
    const results = [];
    
    // Primero buscar por código de aeropuerto exacto
    const airport = this.airports.find(a => a.iata === upperName);
    if (airport) {
      const city = {
        name: airport.city,
        country: airport.country,
        countryCode: this.getCountryCode(airport.country),
        code: airport.iata,
        name_uppercase: airport.city.toUpperCase(),
        airports: [{
          code: airport.iata,
          name: airport.name,
          distance: '0K'
        }]
      };
      results.push(city);
    }
    
    // Luego buscar por nombre de ciudad
    const nameKey = `name:${upperName}`;
    if (this.cities[nameKey]) {
      results.push(...this.cities[nameKey]);
    }
    
    // Finalmente buscar coincidencias parciales
    Object.values(this.cities).forEach(city => {
      // Skip array entries (the name indexes)
      if (Array.isArray(city)) return;
      
      // Skip if we already have this city from previous matches
      if (results.some(r => r.code === city.code)) return;
      
      // Check if name contains the search term
      if (city.name_uppercase && city.name_uppercase.includes(upperName)) {
        results.push(city);
      }
    });
    
    // Sort by relevance (exact match first, then by name length)
    results.sort((a, b) => {
      // Exact matches first
      if (a.code === upperName && b.code !== upperName) return -1;
      if (a.code !== upperName && b.code === upperName) return 1;
      
      // Then by length of name (shorter names first)
      return a.name.length - b.name.length;
    });
    
    return results.slice(0, 5); // Limit to top 5 matches
  }
  
  /**
   * Get city information by code
   * @param {string} cityCode - The city/airport code
   * @returns {Object|null} - City information or null if not found
   */
  getCityByCode(cityCode) {
    if (!this.initialized) {
      console.warn('Airport data service not initialized');
      this.useFallbackData();
    }
    
    const upperCode = cityCode.toUpperCase();
    
    // Direct lookup by code
    if (this.cities[upperCode]) {
      return this.cities[upperCode];
    }
    
    // Look for cities with this airport code
    for (const city of Object.values(this.cities)) {
      // Skip array entries (the name indexes)
      if (Array.isArray(city)) continue;
      
      // Check if any of the city's airports matches the code
      if (city.airports && city.airports.some(airport => airport.code === upperCode)) {
        return {
          ...city,
          code: upperCode // Override the city code with the airport code
        };
      }
    }
    
    // If not found, try to find it in the airports array
    const airport = this.airports.find(a => a.iata === upperCode);
    if (airport) {
      // Create a city object on the fly
      return {
        name: airport.city,
        country: airport.country,
        countryCode: this.getCountryCode(airport.country),
        code: airport.iata,
        name_uppercase: airport.city.toUpperCase(),
        airports: [{
          code: airport.iata,
          name: airport.name,
          distance: '0K'
        }]
      };
    }
    
    return null;
  }
  
  /**
   * Get airport information by code
   * @param {string} airportCode - The airport IATA code
   * @returns {Object|null} - Airport information or null if not found
   */
  getAirportByCode(airportCode) {
    if (!this.initialized) {
      console.warn('Airport data service not initialized');
      this.useFallbackData();
    }
    
    const upperCode = airportCode.toUpperCase();
    
    // Find the airport in the array
    const airport = this.airports.find(a => a.iata === upperCode);
    
    if (!airport) return null;
    
    // Find the corresponding city
    const city = this.getCityByCode(airport.city);
    
    return {
      ...airport,
      city_code: city ? city.code : airport.iata,
      city_name: airport.city,
      country_code: this.getCountryCode(airport.country)
    };
  }
  
  /**
   * Get a 2-letter country code
   * @param {string} country - Country name
   * @returns {string} - 2-letter country code or XX if unknown
   */
  getCountryCode(country) {
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
      'Venezuela': 'VE'
    };
    
    return countryCodes[country] || 'XX';
  }
}

// Create a singleton instance
const airportDataService = new AirportDataService();

// Initialize the service when this module is first imported
// This approach doesn't block the main thread
setTimeout(() => {
  airportDataService.initialize()
    .then(success => {
      if (success) {
        console.log('Airport data service initialization completed in background');
      }
    })
    .catch(error => {
      console.error('Error during background initialization:', error);
    });
}, 0);

export default airportDataService;