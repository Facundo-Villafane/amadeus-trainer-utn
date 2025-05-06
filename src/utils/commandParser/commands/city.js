// src/utils/commandParser/commands/city.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import paginationState from '../paginationState';
import { mockCities, mockAirports } from '../../../data/mockData';
import openFlightsDataService from '../../../services/openFlightsDataService';

// Data initialization flag
let dataInitialized = false;

/**
 * Initialize the OpenFlights data if not already done
 */
async function initializeOpenFlightsData() {
  if (!dataInitialized) {
    try {
      const response = await fetch('/data/airports-extended.dat');
      const data = await response.text();
      openFlightsDataService.initializeService(data);
      dataInitialized = true;
      console.log('OpenFlights data initialized successfully');
    } catch (error) {
      console.error('Error initializing OpenFlights data:', error);
      // Continue with manual data if initialization fails
      dataInitialized = true; // Mark as initialized to avoid repeated attempts
    }
  }
}

// Función para manejar codificación de ciudad (DAN)
export async function handleEncodeCity(cmd) {
  try {
    // Ensure OpenFlights data is initialized
    await initializeOpenFlightsData();
    
    const cityName = cmd.slice(3).trim();
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DAN${cityName.toUpperCase()}\n`;
    response += `A:APT B:BUS C:CITY G:GRD H:HELI O:OFF-PT R:RAIL S:ASSOC TOWN\n`;
    
    // Try Firebase first
    try {
      const citiesQuery = query(
        collection(db, 'cities'),
        where('name_uppercase', '>=', cityName.toUpperCase()),
        where('name_uppercase', '<=', cityName.toUpperCase() + '\uf8ff'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(citiesQuery);
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const city = doc.data();
          response += `${city.code}*C ${city.name.toUpperCase()} /${city.country_code}\n`;
          
          // Si hay aeropuertos asociados
          if (city.airports && Array.isArray(city.airports)) {
            city.airports.forEach(airport => {
              response += `A ${airport.code} - ${airport.name} - ${airport.distance || '0K'} /${city.country_code}\n`;
            });
          }
        });
        
        return response;
      }
    } catch (error) {
      console.warn('Firebase query failed:', error);
    }
    
    // Try OpenFlights data
    const matchedCities = openFlightsDataService.searchCitiesByName(cityName);
    
    if (matchedCities && matchedCities.length > 0) {
      matchedCities.forEach(city => {
        response += `${city.code}*C ${city.name.toUpperCase()} /${city.countryCode}\n`;
        
        // Si hay aeropuertos asociados
        if (city.airports && Array.isArray(city.airports)) {
          city.airports.forEach(airport => {
            response += `A ${airport.code} - ${airport.name} - ${airport.distance || '0K'} /${city.countryCode}\n`;
          });
        }
      });
      
      return response;
    }
    
    // Fallback to mock data if neither Firebase nor OpenFlights worked
    const matchedCities = mockCities.filter(city => 
      city.name_uppercase.includes(cityName.toUpperCase())
    );
    
    if (matchedCities.length === 0) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
    matchedCities.forEach(city => {
      response += `${city.code}*C ${city.name.toUpperCase()} /${city.country_code}\n`;
      
      // Si hay aeropuertos asociados
      if (city.airports && Array.isArray(city.airports)) {
        city.airports.forEach(airport => {
          response += `A ${airport.code} - ${airport.name} - ${airport.distance || '0K'} /${city.country_code}\n`;
        });
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DAN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar decodificación de ciudad (DAC)
export async function handleDecodeCity(cmd) {
  try {
    // Ensure OpenFlights data is initialized
    await initializeOpenFlightsData();
    
    const cityCode = cmd.slice(3).trim().toUpperCase();
    
    // Try Firebase first
    try {
      // Buscar primero como ciudad
      const citiesQuery = query(
        collection(db, 'cities'),
        where('code', '==', cityCode),
        limit(1)
      );
      
      const citiesSnapshot = await getDocs(citiesQuery);
      
      if (!citiesSnapshot.empty) {
        const city = citiesSnapshot.docs[0].data();
        
        // Formatear la respuesta para ciudad
        let response = `DAC${cityCode}\n`;
        response += `${cityCode} C ${city.name.toUpperCase()} /${city.country_code}\n`;
        
        // Si hay aeropuertos asociados
        if (city.airports && Array.isArray(city.airports)) {
          response += `AIRPORTS:\n`;
          city.airports.forEach(airport => {
            response += `${airport.code} - ${airport.name}\n`;
          });
        }
        
        return response;
      }
      
      // Si no se encuentra como ciudad, buscar como aeropuerto
      const airportsQuery = query(
        collection(db, 'airports'),
        where('code', '==', cityCode),
        limit(1)
      );
      
      const airportsSnapshot = await getDocs(airportsQuery);
      
      if (!airportsSnapshot.empty) {
        const airport = airportsSnapshot.docs[0].data();
        
        // Formatear la respuesta para aeropuerto
        let response = `DAC${cityCode}\n`;
        response += `${cityCode} A ${airport.name} /${airport.country_code}\n`;
        response += `${airport.city_code} C ${airport.city_name}\n`;
        
        return response;
      }
    } catch (error) {
      console.warn('Firebase query failed:', error);
    }
    
    // Try OpenFlights data
    const city = openFlightsDataService.getCityByCode(cityCode);
    if (city) {
      // Formatear la respuesta para ciudad
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} C ${city.name.toUpperCase()} /${city.countryCode}\n`;
      
      // Si hay aeropuertos asociados
      if (city.airports && city.airports.length > 0) {
        response += `AIRPORTS:\n`;
        city.airports.forEach(airport => {
          response += `${airport.code} - ${airport.name}\n`;
        });
      }
      
      return response;
    }
    
    // Check if it's an airport code
    const airport = openFlightsDataService.getAirportByCode(cityCode);
    if (airport) {
      // Formatear la respuesta para aeropuerto
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} A ${airport.name} /${airport.country_code || 'XX'}\n`;
      
      if (airport.city_code) {
        response += `${airport.city_code} C ${airport.city_name}\n`;
      }
      
      return response;
    }
    
    // Fallback to mock data if neither Firebase nor OpenFlights worked
    // Buscar primero como ciudad
    const matchedCity = mockCities.find(city => city.code === cityCode);
    
    if (matchedCity) {
      // Formatear la respuesta para ciudad
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} C ${matchedCity.name.toUpperCase()} /${matchedCity.country_code}\n`;
      
      // Si hay aeropuertos asociados
      if (matchedCity.airports && matchedCity.airports.length > 0) {
        response += `AIRPORTS:\n`;
        matchedCity.airports.forEach(airport => {
          response += `${airport.code} - ${airport.name}\n`;
        });
      }
      
      return response;
    }
    
    // Buscar como aeropuerto
    const matchedAirport = mockAirports.find(airport => airport.code === cityCode);
    
    if (matchedAirport) {
      // Formatear la respuesta para aeropuerto
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} A ${matchedAirport.name} /${matchedAirport.country_code}\n`;
      response += `${matchedAirport.city_code} C ${matchedAirport.city_name}\n`;
      
      return response;
    }
    
    return `No se encontró información para el código: ${cityCode}`;
  } catch (error) {
    console.error('Error al procesar el comando DAC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}