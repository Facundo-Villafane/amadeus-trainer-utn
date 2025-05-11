// Improved DAT to JSON Converter
// This utility converts airports.dat file to a usable JSON structure

/**
 * Converts airports.dat file to JSON format
 * @param {string} datFileContent - Content of the .dat file
 * @returns {Object} JavaScript object containing the processed airport data
 */
function convertDatToJson(datFileContent) {
    // Split the content into lines
    const lines = datFileContent.split('\n');
    const airports = [];
    
    console.log(`Processing ${lines.length} lines from DAT file...`);
    
    // Process each line
    lines.forEach((line, index) => {
      if (!line.trim()) return; // Skip empty lines
      
      try {
        // Handle the CSV-like format with quotes
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
        
        // Check if we have at least the minimum required fields
        if (cleanValues.length < 5) {
          console.warn(`Line ${index + 1}: Not enough fields. Skipping.`);
          return;
        }
        
        // Create an airport object with the parsed values
        const airport = {
          id: parseInt(cleanValues[0], 10) || index + 1,
          name: cleanValues[1] || '',
          city: cleanValues[2] || '',
          country: cleanValues[3] || '',
          iata: cleanValues[4] || '',
        };
        
        // Add optional fields if they exist
        if (cleanValues.length > 5) airport.icao = cleanValues[5] || '';
        if (cleanValues.length > 6) airport.latitude = parseFloat(cleanValues[6]) || 0;
        if (cleanValues.length > 7) airport.longitude = parseFloat(cleanValues[7]) || 0;
        
        // Skip airports without IATA codes or with invalid codes
        if (!airport.iata || airport.iata === "\\N" || airport.iata.trim() === "") {
          return;
        }
        
        // Skip airports without city name
        if (!airport.city || airport.city.trim() === "") {
          return;
        }
        
        airports.push(airport);
        
      } catch (error) {
        console.error(`Error parsing line ${index + 1}:`, error);
      }
    });
    
    console.log(`Successfully processed ${airports.length} valid airports`);
    
    // Group airports by city
    const cities = {};
    airports.forEach(airport => {
      // Create a unique key for each city using city and country
      const cityKey = `${airport.city}-${airport.country}`.toUpperCase();
      
      if (!cities[cityKey]) {
        // Use country code or XX if unknown
        const countryCode = getCountryCode(airport.country);
        
        cities[cityKey] = {
          name: airport.city,
          country: airport.country,
          countryCode: countryCode,
          code: airport.iata, // Initially use first airport's code
          name_uppercase: airport.city.toUpperCase(),
          airports: []
        };
      }
      
      // Add this airport to the city
      cities[cityKey].airports.push({
        code: airport.iata,
        name: airport.name,
        distance: '0K' // Default distance
      });
    });
    
    // Post-process cities: set the shortest code (usually main airport) as city code
    Object.values(cities).forEach(city => {
      if (city.airports.length > 1) {
        // Sort airports by code length and alphabetically
        city.airports.sort((a, b) => {
          if (a.code.length !== b.code.length) {
            return a.code.length - b.code.length;
          }
          return a.code.localeCompare(b.code);
        });
        
        // Use the first (shortest) code as city code
        city.code = city.airports[0].code;
      }
    });
    
    return {
      airports: airports,
      cities: Object.values(cities),
      metadata: {
        count: airports.length,
        citiesCount: Object.keys(cities).length,
        generated: new Date().toISOString(),
        version: "1.0"
      }
    };
  }
  
  /**
   * Get a 2-letter country code for a country name
   * @param {string} country - Country name
   * @returns {string} 2-letter country code or "XX" if unknown
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
   * Example usage:
   * 
   * // To convert DAT to JSON:
   * const datContent = "..."; // Your DAT file content
   * const airportsData = convertDatToJson(datContent);
   * const jsonString = JSON.stringify(airportsData, null, 2);
   * 
   * // To save to a file: (in Node.js)
   * // require('fs').writeFileSync('airports-data.json', jsonString);
   * 
   * // To use in browser:
   * // localStorage.setItem('airportsData', jsonString);
   */
  
  // Export for use in other modules
  export { convertDatToJson, getCountryCode };