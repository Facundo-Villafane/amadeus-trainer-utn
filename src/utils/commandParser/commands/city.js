// src/utils/commandParser/commands/city.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import paginationState from '../paginationState';
import { mockCities, mockAirports } from '../../../data/mockData';
import openFlightsDataService from '../../../services/openFlightsDataService';
import airportAliases from '../../../data/airportAliases.json';

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

// Función para buscar códigos de aeropuerto por nombre alternativo
function findAirportCodesByAlias(cityName, searchTerm) {
  const cityAliases = airportAliases[cityName];
  if (!cityAliases) return null;
  
  const matchingCodes = new Set();
  
  // Buscar coincidencias en los alias
  Object.entries(cityAliases).forEach(([alias, code]) => {
    if (alias.toUpperCase().includes(searchTerm.toUpperCase())) {
      matchingCodes.add(code);
    }
  });
  
  return Array.from(matchingCodes);
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
          response += `${city.code.padEnd(4)}*C ${city.name.toUpperCase().padEnd(20)} /${city.country_code}\n`;
          
          // Si hay aeropuertos asociados
          if (city.airports && Array.isArray(city.airports)) {
            city.airports.forEach(airport => {
              response += `A ${airport.code.padEnd(4)} - ${airport.name.padEnd(40)} - ${(airport.distance || '0K').padEnd(4)} /${city.country_code}\n`;
            });
          }
        });
        
        return response;
      }
    } catch (error) {
      console.warn('Firebase query failed:', error);
    }
    
    // Try OpenFlights data
    const openFlightsCities = openFlightsDataService.searchCitiesByName(cityName);
    
    if (openFlightsCities && openFlightsCities.length > 0) {
      openFlightsCities.forEach(city => {
        response += `${city.code.padEnd(4)}*C ${city.name.toUpperCase().padEnd(20)} /${city.countryCode}\n`;
        
        // Si hay aeropuertos asociados
        if (city.airports && Array.isArray(city.airports)) {
          city.airports.forEach(airport => {
            response += `A ${airport.code.padEnd(4)} - ${airport.name.padEnd(40)} - ${(airport.distance || '0K').padEnd(4)} /${city.countryCode}\n`;
          });
        }
      });
      
      return response;
    }
    
    // Fallback to mock data if neither Firebase nor OpenFlights worked
    const mockMatchedCities = mockCities.filter(city => 
      city.name_uppercase.includes(cityName.toUpperCase())
    );
    
    if (mockMatchedCities.length === 0) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
    mockMatchedCities.forEach(city => {
      response += `${city.code.padEnd(4)}*C ${city.name.toUpperCase().padEnd(20)} /${city.country_code}\n`;
      
      // Si hay aeropuertos asociados
      if (city.airports && Array.isArray(city.airports)) {
        city.airports.forEach(airport => {
          response += `A ${airport.code.padEnd(4)} - ${airport.name.padEnd(40)} - ${(airport.distance || '0K').padEnd(4)} /${city.country_code}\n`;
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
    
    const searchTerm = cmd.slice(3).trim().toUpperCase();
    
    // Caso especial para Ezeiza
    if (searchTerm === 'EZEIZA') {
      return `DACEZEIZA
BUE  C BUENOS AIRES         /AR
AIRPORTS:
EZE  - Ministro Pistarini International Airport                   `;
    }
    
    // Caso especial para Buenos Aires
    if (searchTerm === 'BUENOS AIRES') {
      return `DACBUENOS AIRES
BUE  C BUENOS AIRES         /AR
AIRPORTS:
EZE  - Ministro Pistarini International Airport                   
AEP  - Jorge Newbery Airfield                                   
FDO  - San Fernando Airport                                     `;
    }
    
    // Caso especial para London
    if (searchTerm === 'LONDON') {
      return `DACLONDON
LON  C LONDON               /GB
AIRPORTS:
LHR  - London Heathrow Airport                                  
LGW  - London Gatwick Airport                                   
STN  - London Stansted Airport                                  
LTN  - London Luton Airport                                    
LCY  - London City Airport                                     
SEN  - London Southend Airport                                  
BQH  - London Biggin Hill Airport                               
RAIL:
LON  - London Rail Station                                      
LST  - London Street Rail Station                               
BUS:
LON  - London Bus Terminal                                      `;
    }
    
    // Primero intentar encontrar la ciudad exacta
    let city = null;
    let airports = [];
    
    // Try Firebase first
    try {
      const citiesQuery = query(
        collection(db, 'cities'),
        where('name_uppercase', '==', searchTerm),
        limit(1)
      );
      
      const citiesSnapshot = await getDocs(citiesQuery);
      
      if (!citiesSnapshot.empty) {
        city = citiesSnapshot.docs[0].data();
        airports = city.airports || [];
      }
    } catch (error) {
      console.warn('Firebase query failed:', error);
    }
    
    // Si no se encontró en Firebase, intentar con OpenFlights
    if (!city) {
      const cities = openFlightsDataService.searchCitiesByName(searchTerm);
      if (cities && cities.length > 0) {
        city = cities[0];
        airports = city.airports || [];
      }
    }
    
    // Si aún no se encontró, buscar en los alias
    if (!city) {
      // Buscar en todas las ciudades que tienen alias
      for (const [cityName, aliases] of Object.entries(airportAliases)) {
        // Primero verificar si el término de búsqueda coincide con algún alias
        const matchingAlias = Object.entries(aliases).find(([alias, code]) => 
          alias.toUpperCase() === searchTerm
        );
        
        if (matchingAlias) {
          const [_, airportCode] = matchingAlias;
          // Encontrar la ciudad en OpenFlights
          const cities = openFlightsDataService.searchCitiesByName(cityName);
          if (cities && cities.length > 0) {
            city = cities[0];
            // Filtrar solo el aeropuerto que coincide con el código encontrado
            airports = (city.airports || []).filter(airport => 
              airport.code === airportCode
            );
            break;
          }
        }
      }
    }
    
    // Si aún no se encontró, usar datos mock
    if (!city) {
      const matchedCity = mockCities.find(city => city.name_uppercase === searchTerm);
      if (matchedCity) {
        city = matchedCity;
        airports = matchedCity.airports || [];
      }
    }
    
    // Si se encontró la ciudad, formatear la respuesta
    if (city) {
      let response = `DAC${searchTerm}\n`;
      response += `${city.code.padEnd(4)} C ${city.name.toUpperCase().padEnd(20)} /${city.country_code || city.countryCode || 'AR'}\n`;
      
      if (airports.length > 0) {
        response += `AIRPORTS:\n`;
        airports.forEach(airport => {
          response += `${airport.code.padEnd(4)} - ${airport.name.padEnd(40)}\n`;
        });
      }
      
      return response;
    }
    
    return `No se encontró información para: ${searchTerm}`;
  } catch (error) {
    console.error('Error al procesar el comando DAC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}