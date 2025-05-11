// src/utils/commandParser/commands/pnr/pnrUtils.js
import { convertToAmadeusDate } from './dateUtils';

/**
 * Formatea un PNR para mostrar como respuesta en el terminal
 * @param {Object} pnr - El objeto PNR a formatear
 * @returns {string} - Respuesta formateada para el terminal
 */
export function formatPNRResponse(pnr) {
  // Formatear la respuesta
  let response = `\nRP/UTN5168476/\n`;
  
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
  
  // Mostrar segmentos
  if (pnr.segments && pnr.segments.length > 0) {
    pnr.segments.forEach((segment, index) => {
      response += `${pnr.passengers?.length + index + 1 || index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
      
      // Convertir la fecha al formato Amadeus
      const formattedDate = convertToAmadeusDate(segment.departureDate);
      
      response += `${formattedDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
      response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
      // También convertir la fecha en la parte final si es necesario
      response += `${formattedDate} E ${segment.equipment}\n`;
    });
  }
  
  // Mostrar contactos
  if (pnr.contacts && pnr.contacts.length > 0) {
    pnr.contacts.forEach((contact, index) => {
      const elementNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + index + 1;
      response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
    });
  }
  
  // Mostrar contactos de correo electrónico
  if (pnr.emailContacts && pnr.emailContacts.length > 0) {
    pnr.emailContacts.forEach((contact, index) => {
      const elementNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + (pnr.contacts?.length || 0) + index + 1;
      response += `${elementNumber} APE ${contact.email}\n`;
    });
  }
  
  // Mostrar Received From
  if (pnr.receivedFrom) {
    const rfNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + (pnr.contacts?.length || 0) + 1;
    response += `${rfNumber} RF ${pnr.receivedFrom}\n`;
  }
  
  // Mostrar límite de tiempo para emisión de billete
  if (pnr.ticketing) {
    const tkNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + 
                     (pnr.contacts?.length || 0) + (pnr.receivedFrom ? 1 : 0) + 1;
    response += `${tkNumber} TK TL${pnr.ticketing.timeLimit}\n`;
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
  response += `RP/UTN5168476/AGENTE FF/WE ${pnr.ticketing?.date || '01JAN'}/1200Z ${pnr.recordLocator}\n`;
  
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
  
  // Mostrar segmentos
  if (pnr.segments && pnr.segments.length > 0) {
    pnr.segments.forEach((segment, index) => {
      response += `${index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
      
      // Convertir la fecha al formato Amadeus
      const formattedDate = convertToAmadeusDate(segment.departureDate);
      
      response += `${formattedDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
      response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
      // También convertir la fecha en la parte final
      response += `${formattedDate} E ${segment.equipment}\n`;
    });
  }
  
  // Mostrar contactos
  if (pnr.contacts && pnr.contacts.length > 0) {
    pnr.contacts.forEach((contact, index) => {
      const elementNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + index + 1;
      response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
    });
  }
  
  // Mostrar límite de tiempo para emisión de billete
  if (pnr.ticketing) {
    const tkNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + 
                     (pnr.contacts?.length || 0) + 1;
    response += `${tkNumber} TK TL${pnr.ticketing.timeLimit}\n`;
  }
    
  // Mostrar Received From
  if (pnr.receivedFrom) {
    const rfNumber = (pnr.passengers?.length || 0) + (pnr.segments?.length || 0) + 
                    (pnr.contacts?.length || 0) + (pnr.ticketing ? 1 : 0) + 1;
    response += `${rfNumber} RF ${pnr.receivedFrom}\n`;
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