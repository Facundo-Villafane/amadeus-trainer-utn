// src/utils/commandParser/commands/airline.js
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// Función para manejar codificación de aerolínea (DNA)
export async function handleEncodeAirline(cmd) {
  try {
    const airlineName = cmd.slice(3).trim();
    
    // Consultar aerolíneas en Firebase
    const airlinesQuery = query(
      collection(db, 'airlines'),
      where('name_uppercase', '>=', airlineName.toUpperCase()),
      where('name_uppercase', '<=', airlineName.toUpperCase() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(airlinesQuery);
    
    if (querySnapshot.empty) {
      return `No se encontró información para la aerolínea: ${airlineName}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DNA${airlineName.toUpperCase()}\n`;
    
    querySnapshot.forEach((doc) => {
      const airline = doc.data();
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
    
    // Consultar aerolíneas en Firebase
    const airlinesQuery = query(
      collection(db, 'airlines'),
      where('code', '==', airlineCode),
      limit(1)
    );
    
    const querySnapshot = await getDocs(airlinesQuery);
    
    if (querySnapshot.empty) {
      return `No se encontró información para el código: ${airlineCode}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `${airlineCode} - `;
    
    const airline = querySnapshot.docs[0].data();
    response += `${airline.name.toUpperCase()}`;
    
    if (airline.country) {
      response += ` (${airline.country})`;
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}