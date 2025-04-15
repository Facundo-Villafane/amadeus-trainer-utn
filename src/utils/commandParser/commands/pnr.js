// src/utils/commandParser/commands/pnr.js
import { collection, query, where, getDocs, addDoc, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { generatePNR } from '../../pnrGenerator';

// Función para manejar la venta de segmentos (SS)
export async function handleSellSegment(cmd) {
  try {
    // Formato esperado: SS[CANTIDAD][CLASE][LÍNEA]
    const regex = /SS(\d+)([A-Z])(\d+)/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SS1Y1";
    }
    
    const [, quantity, classCode, lineNumber] = match;
    
    // En una implementación real, aquí buscaríamos el vuelo correspondiente
    // y crearíamos un nuevo PNR o actualizaríamos uno existente
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1 XX 1234 ${classCode} 01JAN 1 XXXYYY DK${quantity} 1200 1400 01JAN E 737
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando SS:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la adición de nombres (NM)
export function handleAddName(cmd) {
  try {
    // Analizar el comando NM
    // Formato básico: NM1APELLIDO/NOMBRE
    // Formato con título: NM1APELLIDO/NOMBRE MR
    // Formato con niño: NM1APELLIDO/NOMBRE(CHD/01JAN15)
    // Formato con infante: NM1APELLIDO/NOMBRE(INFGARCIA/LUIS/01JAN20)
    
    // Simplificado para fines educativos
    const namePattern = /NM(\d+)([A-Z]+)\/([A-Z\s]+)\s?([A-Z]+)?/i;
    const match = cmd.match(namePattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: NM1GARCIA/JUAN MR";
    }
    
    const [, quantity, lastName, firstName, title] = match;
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1.${lastName.toUpperCase()}/${firstName.trim().toUpperCase()} ${title || 'MR'}
2 XX 1234 Y 01JAN 1 XXXYYY DK1 1200 1400 01JAN E 737
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando NM:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la adición de contacto (AP)
export function handleAddContact(cmd) {
  try {
    // Analizar el comando AP
    // Formato: AP CIUDAD TELEFONO-TIPO
    const contactPattern = /AP\s+([A-Z]{3})\s+([0-9\-]+)(?:-([A-Z]))?/i;
    const match = cmd.match(contactPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: AP BUE 12345678-M";
    }
    
    const [, city, phone, type] = match;
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
RP/UTN5168476/
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY DK1 1200 1400 01JAN E 737
3 AP ${city.toUpperCase()} ${phone}-${type || 'H'}
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando AP:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la recuperación de PNR (RT)
export async function handleRetrievePNR(cmd) {
  try {
    // Analizar el comando RT
    // Formato: RT[CODIGO]
    const pnrCode = cmd.slice(2).trim();
    
    if (!pnrCode) {
      return "Formato incorrecto. Ejemplo: RTABCDEF";
    }
    
    // En una implementación real, aquí buscaríamos el PNR en Firebase
    // por ejemplo:
    /*
    const pnrRef = doc(db, 'pnrs', pnrCode);
    const pnrDoc = await getDoc(pnrRef);
    
    if (pnrDoc.exists()) {
      // Construir la respuesta basada en los datos reales del PNR
      const pnrData = pnrDoc.data();
      
      let response = `---RLR---\n`;
      response += `RP/${pnrData.office}/${pnrData.agent} FF/WE ${pnrData.creationDate}/${pnrData.creationTime}Z ${pnrCode}\n`;
      
      // Mostrar pasajeros
      pnrData.passengers.forEach((passenger, index) => {
        response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}\n`;
      });
      
      // Mostrar segmentos
      pnrData.segments.forEach((segment, index) => {
        response += `${index + 1} ${segment.airline} ${segment.flightNumber} ${segment.class} ${segment.date} ${segment.dayOfWeek} `;
        response += `${segment.origin}${segment.destination} ${segment.status} ${segment.departureTime} ${segment.arrivalTime} `;
        response += `${segment.nextDate} ${segment.flags} ${segment.equipment}\n`;
      });
      
      // Mostrar contactos
      if (pnrData.contacts) {
        pnrData.contacts.forEach((contact, index) => {
          response += `${index + 4} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
        });
      }
      
      response += `*TRN*\n>`;
      
      return response;
    }
    */
    
    // Para esta demo, simularemos una respuesta exitosa
    const response = `
---RLR---
RP/UTN5168476/AGENTE FF/WE 01JAN/1200Z ${pnrCode}
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY HK1 1200 1400 01JAN E 737
3 AP BUE 12345678-H
4 TK TL01JAN/1200
*TRN*
>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando RT:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}