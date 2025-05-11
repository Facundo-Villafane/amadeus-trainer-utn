// src/services/openFlightsDataService.js
// This is an improved version that works with our new airportDataService

import airportDataService from './airportDataService';

/**
 * A service that provides access to airport and city data
 * This implementation acts as a wrapper around the airportDataService
 * but maintains the same interface as the original openFlightsDataService
 */
class OpenFlightsDataService {
  constructor() {
    this.initialized = false;
    this.airportService = airportDataService;
    
    // Try to initialize immediately
    this.initializeService();
  }
  
  /**
   * Initialize the service
   * @param {string} dataContent - Optional data content to initialize with
   * @returns {boolean} - Success status
   */
  async initializeService(dataContent) {
    if (this.initialized) {
      return true;
    }
    
    try {
      // If data was provided, use it
      if (dataContent && dataContent.length > 100) {
        await this.airportService.initialize(dataContent);
      } else {
        // Otherwise use default initialization
        await this.airportService.initialize();
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing OpenFlightsDataService:', error);
      // Use fallback data
      await this.airportService.initialize({});
      this.initialized = true;
      return false;
    }
  }
  
  /**
   * Search for cities by name
   * @param {string} cityName - Name of the city to search for
   * @returns {Array} - Array of matching cities
   */
  searchCitiesByName(cityName) {
    if (!this.initialized) {
      console.warn('OpenFlightsDataService not initialized, initializing with defaults');
      this.initializeService();
    }
    
    return this.airportService.searchCitiesByName(cityName);
  }
  
  /**
   * Get city information by code
   * @param {string} cityCode - The city/airport code
   * @returns {Object|null} - City information or null if not found
   */
  getCityByCode(cityCode) {
    if (!this.initialized) {
      console.warn('OpenFlightsDataService not initialized, initializing with defaults');
      this.initializeService();
    }
    
    return this.airportService.getCityByCode(cityCode);
  }
  
  /**
   * Get airport information by code
   * @param {string} airportCode - The airport IATA code
   * @returns {Object|null} - Airport information or null if not found
   */
  getAirportByCode(airportCode) {
    if (!this.initialized) {
      console.warn('OpenFlightsDataService not initialized, initializing with defaults');
      this.initializeService();
    }
    
    return this.airportService.getAirportByCode(airportCode);
  }
  
  /**
   * Check if the service is initialized
   * @returns {boolean} - Initialization status
   */
  getInitializedStatus() {
    return this.initialized;
  }
}

// Create and export a singleton instance
const openFlightsDataService = new OpenFlightsDataService();
export default openFlightsDataService;