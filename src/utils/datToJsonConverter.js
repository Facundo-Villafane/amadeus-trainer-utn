// src/utils/datToJsonConverter.js

/**
 * Converts airports.dat file to JSON format
 * This function can be run once to create a JSON file from your .dat file
 * 
 * @param {string} datFileContent - Content of the .dat file
 * @returns {string} JSON string representation of the data
 */
function convertDatToJson(datFileContent) {
    // Split the content into lines
    const lines = datFileContent.split('\n');
    const airports = [];
    
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
    
    // Create a more structured output format
    const output = {
      airports: airports,
      metadata: {
        count: airports.length,
        generated: new Date().toISOString(),
        version: "1.0"
      }
    };
    
    return JSON.stringify(output, null, 2);
  }
  
  /**
   * Loads the airports JSON data into the global scope
   * Call this function once your JSON data is loaded
   * 
   * @param {string} jsonContent - JSON string with airport data
   */
  function loadAirportsData(jsonContent) {
    try {
      // Parse the JSON data
      const data = JSON.parse(jsonContent);
      
      // Make it available globally
      window._airportsData = data.airports || [];
      
      console.log(`Successfully loaded ${window._airportsData.length} airports`);
      
      // Return the data for immediate use if needed
      return window._airportsData;
    } catch (error) {
      console.error('Error loading airports data:', error);
      return [];
    }
  }
  
  export { convertDatToJson, loadAirportsData };