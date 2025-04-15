// src/utils/commandParser/commands/city.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import paginationState from '../paginationState';

// Función para manejar codificación de ciudad (DAN)
export async function handleEncodeCity(cmd) {
  try {
    const cityName = cmd.slice(3).trim();
    
    // Consultar ciudades en Firebase
    const citiesQuery = query(
      collection(db, 'cities'),
      where('name_uppercase', '>=', cityName.toUpperCase()),
      where('name_uppercase', '<=', cityName.toUpperCase() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(citiesQuery);
    
    if (querySnapshot.empty) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
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
  } catch (error) {
    console.error('Error al procesar el comando DAN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar decodificación de ciudad (DAC)
export async function handleDecodeCity(cmd) {
  try {
    const cityCode = cmd.slice(3).trim().toUpperCase();
    
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
    
    return `No se encontró información para el código: ${cityCode}`;
  } catch (error) {
    console.error('Error al procesar el comando DAC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}