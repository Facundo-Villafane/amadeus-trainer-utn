// src/utils/commandParser/commands/pnr/pnrUtils.js
import { convertToAmadeusDate } from './dateUtils';

/**
 * Formatea un PNR para mostrar como respuesta en el terminal
 * @param {Object} pnr - El objeto PNR a formatear
 * @returns {string} - Respuesta formateada para el terminal
 */
// Versión completa de la función formatPNRResponse en pnrUtils.js

/**
 * Formatea un PNR para mostrar como respuesta en el terminal
 * @param {Object} pnr - El objeto PNR a formatear
 * @returns {string} - Respuesta formateada para el terminal
 */
export function formatPNRResponse(pnr) {
  // Formatear la respuesta con receivedFrom si existe
  let response = `\nRP/UTN5168476/`;
  
  // Añadir receivedFrom si existe
  if (pnr.receivedFrom) {
    response += pnr.receivedFrom;
  }
  
  response += '\n';
  
  // Mostrar pasajeros
  if (pnr.passengers && pnr.passengers.length > 0) {
    pnr.passengers.forEach((passenger, index) => {
      response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}`;
      if (passenger.type === 'CHD') {
        response += `(CHD/${passenger.dateOfBirth || ''})`;
      } else if (passenger.type === 'INF' && passenger.infant) {
        response += `(INF${passenger.infant.lastName}/${passenger.infant.firstName}/${passenger.infant.dateOfBirth || ''})`;
      }
      response += `\n`;
    });
  }
  
  // Mostrar segmentos con numeración continua después de los pasajeros
  let elementNumber = (pnr.passengers?.length || 0) + 1;
  
  if (pnr.segments && pnr.segments.length > 0) {
    pnr.segments.forEach((segment) => {
      response += `${elementNumber} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
      
      // Convertir la fecha al formato Amadeus
      const formattedDate = convertToAmadeusDate(segment.departureDate);
      
      response += `${formattedDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
      response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
      response += `${formattedDate} E ${segment.equipment}\n`;
      
      elementNumber++;
    });
  }
  
  // Mostrar contactos
  if (pnr.contacts && pnr.contacts.length > 0) {
    pnr.contacts.forEach((contact) => {
      response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar contactos de correo electrónico
  if (pnr.emailContacts && pnr.emailContacts.length > 0) {
    pnr.emailContacts.forEach((contact) => {
      response += `${elementNumber} APE ${contact.email}\n`;
      elementNumber++;
    });
  }

  // Mostrar elementos OSI
  if (pnr.osiElements && pnr.osiElements.length > 0) {
    pnr.osiElements.forEach((osiElement) => {
      let osiLine = `${elementNumber} OSI ${osiElement.airlineCode} ${osiElement.message}`;
      
      // Añadir referencia al pasajero si existe
      if (osiElement.passengerNumber) {
        osiLine += `/P${osiElement.passengerNumber}`;
      }
      
      response += `${osiLine}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar elementos SSR
  if (pnr.ssrElements && pnr.ssrElements.length > 0) {
    pnr.ssrElements.forEach((ssrElement) => {
      // Formato: SSR VGML YY HK1 /S3/P2
      // O para infantes: SSR INFT YY HK1 APELLIDO/NOMBRE/S3/P2
      // O para FOID: SSR FOID YY HK1 PP12345678/P2
      // O para RQST: SSR RQST YY HK1 BUEMAD/24A,P1/15C,P2 /S1
      let ssrLine = `${elementNumber} SSR ${ssrElement.code} ${ssrElement.airlineCode} ${ssrElement.status}`;
      
      // Si es un SSR de infante, añadir el nombre
      if (ssrElement.code === 'INFT' && ssrElement.infantName) {
        ssrLine += ` ${ssrElement.infantName}`;
      }
      
      // Si es un FOID, mostrar tipo y número de documento
      if (ssrElement.code === 'FOID' && ssrElement.docType && ssrElement.docNumber) {
        ssrLine += ` ${ssrElement.docType}${ssrElement.docNumber}`;
      }
      
      // Si es un RQST, mostrar el mensaje completo que incluye ruta y asignación de asientos
      if (ssrElement.code === 'RQST' && ssrElement.message) {
        ssrLine += ` ${ssrElement.message}`;
      }
      
      // Añadir referencia al segmento
      if (ssrElement.segmentNumber) {
        ssrLine += ` /S${ssrElement.segmentNumber}`;
      }
      
      // Añadir referencia al pasajero, excepto para RQST que ya incluye esta info en el mensaje
      if (ssrElement.passengerNumber && ssrElement.code !== 'RQST') {
        ssrLine += `/P${ssrElement.passengerNumber}`;
      }
      
      response += `${ssrLine}\n`;
      elementNumber++;
    });
  }

  // Mostrar límite de tiempo si existe
  if (pnr.ticketing) {
    let tkDisplay = '';
    
    if (pnr.ticketing.type === 'OK') {
      tkDisplay = `${elementNumber} TK OK/${pnr.ticketing.officeId}\n`;
    } else if (pnr.ticketing.type === 'TL') {
      tkDisplay = `${elementNumber} TK TL${pnr.ticketing.date}/${pnr.ticketing.time}/${pnr.ticketing.officeId}\n`;
    } else if (pnr.ticketing.type === 'XL') {
      tkDisplay = `${elementNumber} TK XL${pnr.ticketing.date}/${pnr.ticketing.time}/${pnr.ticketing.officeId}\n`;
    }
    
    response += tkDisplay;
    elementNumber++;
  }

    // Actualización de la función formatPNRResponse para incluir los comentarios

  // Este código debe integrarse dentro de la función formatPNRResponse existente,
  // justo antes de la parte final donde se muestra "*TRN*\n>"

  // Mostrar comentarios generales (RM)
  if (pnr.remarks && pnr.remarks.length > 0) {
    pnr.remarks.forEach((remark) => {
      response += `${elementNumber} RM ${remark.text}\n`;
      elementNumber++;
    });
  }

  // Mostrar comentarios confidenciales (RC)
  if (pnr.confidentialRemarks && pnr.confidentialRemarks.length > 0) {
    pnr.confidentialRemarks.forEach((remark) => {
      response += `${elementNumber} RC ${remark.text}\n`;
      elementNumber++;
    });
  }

  // Mostrar comentarios para el itinerario (RIR)
  if (pnr.itineraryRemarks && pnr.itineraryRemarks.length > 0) {
    pnr.itineraryRemarks.forEach((remark) => {
      response += `${elementNumber} RIR ${remark.text}\n`;
      elementNumber++;
    });
  }


  
  response += `*TRN*\n>`;
  
  return response;
}

/**
 * Formatea la respuesta de ER (End + Retrieve)
 * @param {Object} pnr - El objeto PNR a formatear
 * @returns {string} - Respuesta formateada para el terminal
 */
export function formatERResponse(pnr) {
  let response = `\n---RLR---\n`;
  
  // Manejar fecha de creación con fallback a fecha actual si no existe
  let createdDate;
  if (pnr.createdAt) {
    // Si createdAt es un timestamp de Firestore
    if (pnr.createdAt.toDate) {
      createdDate = pnr.createdAt.toDate();
    } else if (pnr.createdAt instanceof Date) {
      createdDate = pnr.createdAt;
    } else {
      createdDate = new Date(pnr.createdAt);
    }
  } else {
    // Fallback a fecha actual si no existe createdAt
    createdDate = new Date();
  }
  
  // Validar que la fecha sea válida
  if (isNaN(createdDate.getTime())) {
    createdDate = new Date();
  }
  
  // Obtener día de la semana en formato de 2 letras
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayOfWeek = weekdays[createdDate.getDay()];
  
  // Formatear fecha como DDMMM
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(createdDate.getDate()).padStart(2, '0');
  const month = months[createdDate.getMonth()];
  const dateStr = `${day}${month}`;
  
  // Formatear hora UTC
  const utcHours = String(createdDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(createdDate.getUTCMinutes()).padStart(2, '0');
  const utcTime = `${utcHours}${utcMinutes}Z`;
  
  // Usar receivedFrom en lugar de "AGENTE"
  const agent = pnr.receivedFrom || 'AGENTE';
  
  response += `RP/UTN5168476/${agent} FF/${dayOfWeek} ${dateStr}/${utcTime} ${pnr.recordLocator}\n`;
  
  // Mostrar pasajeros
  let lastElementNumber = 0;
  if (pnr.passengers && pnr.passengers.length > 0) {
    pnr.passengers.forEach((passenger, index) => {
      const passengerNumber = index + 1;
      response += `${passengerNumber}.${passenger.lastName}/${passenger.firstName} ${passenger.title}`;
      if (passenger.type === 'CHD') {
        response += `(CHD/${passenger.dateOfBirth || ''})`;
      } else if (passenger.type === 'INF' && passenger.infant) {
        response += `(INF${passenger.infant.lastName}/${passenger.infant.firstName}/${passenger.infant.dateOfBirth || ''})`;
      }
      response += `\n`;
      lastElementNumber = passengerNumber;
    });
  }
  
  // Comenzar la numeración de segmentos después del último pasajero
  let segmentIndex = lastElementNumber + 1;
  
  // Mostrar segmentos
  if (pnr.segments && pnr.segments.length > 0) {
    pnr.segments.forEach((segment) => {
      response += `${segmentIndex} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
      
      // Convertir la fecha al formato Amadeus
      const formattedDate = convertToAmadeusDate(segment.departureDate);
      
      response += `${formattedDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
      response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
      response += `${formattedDate} E ${segment.equipment}\n`;
      
      segmentIndex++;
    });
  }
  
  // Continuar con la numeración para los demás elementos
  let elementNumber = segmentIndex;
  
  // Mostrar contactos
  if (pnr.contacts && pnr.contacts.length > 0) {
    pnr.contacts.forEach((contact) => {
      response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar contactos de correo electrónico
  if (pnr.emailContacts && pnr.emailContacts.length > 0) {
    pnr.emailContacts.forEach((contact) => {
      response += `${elementNumber} APE ${contact.email}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar elementos OSI
  if (pnr.osiElements && pnr.osiElements.length > 0) {
    pnr.osiElements.forEach((osiElement) => {
      let osiLine = `${elementNumber} OSI ${osiElement.airlineCode} ${osiElement.message}`;
      
      // Añadir referencia al pasajero si existe
      if (osiElement.passengerNumber) {
        osiLine += `/P${osiElement.passengerNumber}`;
      }
      
      response += `${osiLine}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar elementos SSR
  if (pnr.ssrElements && pnr.ssrElements.length > 0) {
    pnr.ssrElements.forEach((ssrElement) => {
      // Formato: SSR VGML YY HK1 /S3/P2
      // O para infantes: SSR INFT YY HK1 APELLIDO/NOMBRE/S3/P2
      // O para FOID: SSR FOID YY HK1 PP12345678/P2
      let ssrLine = `${elementNumber} SSR ${ssrElement.code} ${ssrElement.airlineCode} ${ssrElement.status}`;
      
      // Si es un SSR de infante, añadir el nombre
      if (ssrElement.code === 'INFT' && ssrElement.infantName) {
        ssrLine += ` ${ssrElement.infantName}`;
      }
      
      // Si es un FOID, mostrar tipo y número de documento
      if (ssrElement.code === 'FOID' && ssrElement.docType && ssrElement.docNumber) {
        ssrLine += ` ${ssrElement.docType}${ssrElement.docNumber}`;
      }
      
      // Añadir referencia al segmento, excepto para FOID que no está asociado a segmentos
      if (ssrElement.code !== 'FOID' && ssrElement.segmentNumber) {
        ssrLine += ` /S${ssrElement.segmentNumber}`;
      }
      
      // Añadir referencia al pasajero
      if (ssrElement.passengerNumber) {
        ssrLine += `/P${ssrElement.passengerNumber}`;
      }
      
      response += `${ssrLine}\n`;
      elementNumber++;
    });
  }
  
  // Mostrar límite de tiempo SOLO si existe y ha sido agregado por el sistema
  if (pnr.ticketing && pnr.ticketing.timeLimit) {
    response += `${elementNumber} TK TL${pnr.ticketing.timeLimit}\n`;
    elementNumber++;
  }

  // Mostrar límite de tiempo si existe
  if (pnr.ticketing) {
    let tkDisplay = '';
    
    if (pnr.ticketing.type === 'OK') {
      tkDisplay = `${elementNumber} TK OK/${pnr.ticketing.officeId}\n`;
    } else if (pnr.ticketing.type === 'TL') {
      tkDisplay = `${elementNumber} TK TL${pnr.ticketing.date}/${pnr.ticketing.time}/${pnr.ticketing.officeId}\n`;
    } else if (pnr.ticketing.type === 'XL') {
      tkDisplay = `${elementNumber} TK XL${pnr.ticketing.date}/${pnr.ticketing.time}/${pnr.ticketing.officeId}\n`;
    }
    
    response += tkDisplay;
    elementNumber++;
  }
  
  response += `*TRN*\n>`;
  
  return response;
}

/**
 * Formatea una respuesta de RT (Retrieve)
 * @param {Object} pnr - El PNR a formatear
 * @returns {string} - Respuesta formateada para el terminal
 */
export function formatRTResponse(pnr) {
  return formatERResponse(pnr);
}