// src/utils/commandParser/commands/airline.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { mockAirlines } from '../../../data/mockData';

// Función para manejar codificación de aerolínea (DNA)
export async function handleEncodeAirline(cmd) {
  try {
    const airlineName = cmd.slice(3).trim();
    
    try {
      // Intentar con Firebase primero
      const airlinesQuery = query(
        collection(db, 'airlines'),
        where('name_uppercase', '>=', airlineName.toUpperCase()),
        where('name_uppercase', '<=', airlineName.toUpperCase() + '\uf8ff'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(airlinesQuery);
      
      if (!querySnapshot.empty) {
        // Formatear la respuesta simulando la respuesta de Amadeus
        let response = `DNA${airlineName.toUpperCase()}\n`;
        
        querySnapshot.forEach((doc) => {
          const airline = doc.data();
          response += `${airline.code} ${airline.name.toUpperCase()}\n`;
        });
        
        return response;
      }
    } catch (error) {
      console.warn('Firebase query failed, using mock data:', error);
      // Si falla Firebase, continuamos con datos mockeados
    }
    
    // Usar datos mockeados
    const matchedAirlines = mockAirlines.filter(airline => 
      airline.name_uppercase.includes(airlineName.toUpperCase())
    );
    
    if (matchedAirlines.length === 0) {
      return `No se encontró información para la aerolínea: ${airlineName}`;
    }
    
    // Formatear la respuesta
    let response = `DNA${airlineName.toUpperCase()}\n`;
    
    matchedAirlines.forEach(airline => {
      response += `${airline.code} ${airline.name.toUpperCase()}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DNA:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para decodificar aerolínea (si se necesita en el futuro)
export async function handleDecodeAirline(cmd) {
  try {
    const airlineCode = cmd.slice(3).trim().toUpperCase();
    
    try {
      // Consultar aerolíneas en Firebase
      const airlinesQuery = query(
        collection(db, 'airlines'),
        where('code', '==', airlineCode),
        limit(1)
      );
      
      const querySnapshot = await getDocs(airlinesQuery);
      
      if (!querySnapshot.empty) {
        // Formatear la respuesta
        let response = `${airlineCode} - `;
        
        const airline = querySnapshot.docs[0].data();
        response += `${airline.name.toUpperCase()}`;
        
        if (airline.country) {
          response += ` (${airline.country})`;
        }
        
        return response;
      }
    } catch (error) {
      console.warn('Firebase query failed, using mock data:', error);
      // Si falla Firebase, continuamos con datos mockeados
    }
    
    // Usar datos mockeados
    const matchedAirline = mockAirlines.find(airline => airline.code === airlineCode);
    
    if (matchedAirline) {
      let response = `${airlineCode} - ${matchedAirline.name.toUpperCase()}`;
      
      if (matchedAirline.country) {
        response += ` (${matchedAirline.country})`;
      }
      
      return response;
    }
    
    return `No se encontró información para el código: ${airlineCode}`;
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}