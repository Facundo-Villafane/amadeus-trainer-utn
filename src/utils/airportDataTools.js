// src/utils/airportDataTools.js
import airportDataService from '../services/airportDataService';
import DatToJsonTool from '../components/DatToJsonTool';

/**
 * This module provides tools and utilities for airport data
 * and can be used to integrate the data conversion tool
 * into your application.
 */

/**
 * Check if airport data is available
 * @returns {boolean} - True if data is already loaded
 */
export function isAirportDataAvailable() {
  // Check if data is in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedData = localStorage.getItem('airportsData');
      if (storedData) {
        const data = JSON.parse(storedData);
        return !!(data && data.airports && data.airports.length > 10);
      }
    } catch (error) {
      console.warn('Error checking airport data availability:', error);
    }
  }
  return false;
}

/**
 * Initialize airport data service
 * This can be called early in your application startup
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeAirportData() {
  try {
    return await airportDataService.initialize();
  } catch (error) {
    console.error('Error initializing airport data:', error);
    return false;
  }
}

/**
 * Get the DAT to JSON Conversion Tool component
 * This can be used to add the tool to your application
 * for manual data conversion if needed.
 * 
 * Example usage:
 * ```jsx
 * import { DatToJsonConversionTool } from '../utils/airportDataTools';
 * 
 * function DataManagementPage() {
 *   return (
 *     <div>
 *       <h1>Data Management</h1>
 *       <DatToJsonConversionTool />
 *     </div>
 *   );
 * }
 * ```
 */
export const DatToJsonConversionTool = DatToJsonTool;

/**
 * Implementation guide for fixing the airport data issue:
 * 
 * 1. Replace your current OpenFlightsDataService implementation:
 *    - Copy the improved-openflights-service.js file to replace src/services/openFlightsDataService.js
 *    - Copy airport-data-service.js to src/services/airportDataService.js
 * 
 * 2. Add the data conversion tool to an admin page:
 *    - Import { DatToJsonConversionTool } from '../utils/airportDataTools'
 *    - Add the component to an admin settings page or a data management page
 * 
 * 3. Initialize airport data early in your application:
 *    - In src/App.jsx or another entry point, add:
 *      ```
 *      import { initializeAirportData } from './utils/airportDataTools';
 *      
 *      // Initialize airport data
 *      useEffect(() => {
 *        initializeAirportData()
 *          .then(success => {
 *            console.log('Airport data initialization:', success ? 'Success' : 'Failed');
 *          });
 *      }, []);
 *      ```
 * 
 * 4. For immediate testing without DAT file:
 *    - If you can't get the DAT file, you can still use the fallback data
 *    - The service will automatically use fallback data if loading fails
 *    - You can add more airports to the fallback data in airportDataService.js
 */

// Export the data service for direct access if needed
export { airportDataService };

export default {
  isAirportDataAvailable,
  initializeAirportData,
  DatToJsonConversionTool,
  airportDataService
};