// src/utils/commandParser/commands/city.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import paginationState from '../paginationState';
import { mockCities, mockAirports } from '../../../data/mockData';

// Función para manejar codificación de ciudad (DAN)
export async function handleEncodeCity(cmd) {
  try {
    const cityName = cmd.slice(3).trim();
    
    try {
      // Intentar con Firebase primero
      const citiesQuery = query(
        collection(db, 'cities'),
        where('name_uppercase', '>=', cityName.toUpperCase()),
        where('name_uppercase', '<=', cityName.toUpperCase() + '\uf8ff'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(citiesQuery);
      
      if (!querySnapshot.empty) {
        // Formatear la respuesta simulando la respuesta de Amadeus
        let response = `DAN${cityName.toUpperCase()}\n`;
        response += `A:APT B:BUS C:CITY G:GRD H:HELI O:OFF-PT R:RAIL S:ASSOC TOWN\n`;
        
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
      console.warn('Firebase query failed, using mock data:', error);
      // Si falla Firebase, continuamos con datos mockeados
    }
    
    // Usar datos mockeados
    const matchedCities = mockCities.filter(city => 
      city.name_uppercase.includes(cityName.toUpperCase())
    );
    
    if (matchedCities.length === 0) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
    // Formatear la respuesta
    let response = `DAN${cityName.toUpperCase()}\n`;
    response += `A:APT B:BUS C:CITY G:GRD H:HELI O:OFF-PT R:RAIL S:ASSOC TOWN\n`;
    
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
    const cityCode = cmd.slice(3).trim().toUpperCase();
    
    try {
      // Intentar primero con Firebase
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
      console.warn('Firebase query failed, using mock data:', error);
      // Si falla Firebase, continuamos con datos mockeados
    }
    
    // Usar datos mockeados
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