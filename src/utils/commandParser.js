// src/utils/commandParser.js
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generatePNR } from './pnrGenerator';
import mockData from '../data/mockData';

// Función para analizar y ejecutar comandos
export async function commandParser(command) {
  // Convertir a mayúsculas y eliminar espacios al inicio y al final
  const cmd = command.trim().toUpperCase();
  
  // Comandos de ayuda
  if (cmd === 'HELP' || cmd === 'HE') {
    return generateHelpText();
  }
  
  // Comandos de formato HE
  if (cmd.startsWith('HE')) {
    return handleHelpCommand(cmd);
  }
  
  // Comando de despliegue de disponibilidad AN
  if (cmd.startsWith('AN')) {
    return handleAvailabilityCommand(cmd);
  }
  
  // Comando de despliegue de horarios SN
  if (cmd.startsWith('SN')) {
    return handleScheduleCommand(cmd);
  }
  
  // Comando de despliegue de frecuencias TN
  if (cmd.startsWith('TN')) {
    return handleTimetableCommand(cmd);
  }
  
  // Comandos de codificación y decodificación
  if (cmd.startsWith('DAN')) {
    return handleEncodeCity(cmd);
  }
  
  if (cmd.startsWith('DAC')) {
    return handleDecodeCity(cmd);
  }
  
  if (cmd.startsWith('DNA')) {
    return handleEncodeAirline(cmd);
  }
  
  // Comandos para PNR
  if (cmd.startsWith('SS')) {
    return handleSellSegment(cmd);
  }
  
  if (cmd.startsWith('NM')) {
    return handleAddName(cmd);
  }
  
  if (cmd.startsWith('AP')) {
    return handleAddContact(cmd);
  }
  
  if (cmd.startsWith('RF')) {
    return "Received From entrada guardada.";
  }
  
  if (cmd === 'ET' || cmd === 'ER') {
    return handleEndTransaction(cmd);
  }
  
  if (cmd.startsWith('RT')) {
    return handleRetrievePNR(cmd);
  }
  
  // Si no coincide con ningún comando conocido
  return `Comando desconocido: ${cmd}. Ingrese HELP para ver los comandos disponibles.`;
}

// Función para generar el texto de ayuda
function generateHelpText() {
  return `
COMANDOS DISPONIBLES:

AYUDA:
HE                      Despliega este mensaje de ayuda
HE[COMANDO]             Ayuda específica sobre un comando

CODIFICACIÓN/DECODIFICACIÓN:
DAN[CIUDAD]             Codificar ciudad/aeropuerto
DAC[CÓDIGO]             Decodificar ciudad/aeropuerto
DNA[AEROLÍNEA]          Codificar aerolínea

DISPONIBILIDAD:
AN[FECHA][ORIGEN][DESTINO]          Disponibilidad de vuelos
SN[FECHA][ORIGEN][DESTINO]          Horarios de vuelos
TN[FECHA][ORIGEN][DESTINO]          Frecuencias de vuelos

PNR:
SS[ASIENTOS][CLASE][LÍNEA]          Seleccionar asientos
NM[CANTIDAD][APELLIDO]/[NOMBRE]     Agregar nombre
AP [CIUDAD] [TELÉFONO]              Agregar teléfono de contacto
RF[NOMBRE]                          Recibido de
ET                                  Finalizar transacción
RT[LOCALIZADOR]                     Recuperar PNR

Para más detalles sobre un comando específico, escriba HE seguido del comando (ejemplo: HEAN)
`;
}

// Función para manejar el comando de ayuda (HE)
function handleHelpCommand(cmd) {
  const subCommand = cmd.slice(2).trim();
  
  // Ayuda específica para cada comando
  switch (subCommand) {
    case 'AN':
      return `
AN - Despliegue de Disponibilidad Neutral

Formato: AN[FECHA][ORIGEN][DESTINO][/OPCIONES]

Ejemplos:
AN15NOVBUEMAD         Disponibilidad para el 15 de noviembre de Buenos Aires a Madrid
AN15NOVBUEMAD/AAR     Disponibilidad con la aerolínea AR (Aerolíneas Argentinas)
AN15NOVBUEMAD/CJ      Disponibilidad en clase J
AN15NOVBUEMAD*20NOV   Disponibilidad ida y vuelta
`;
    
    case 'SS':
      return `
SS - Selección de Asientos (Venta de Segmentos)

Formato: SS[CANTIDAD][CLASE][LÍNEA]

Ejemplos:
SS1Y1                 Selecciona 1 asiento en clase Y de la línea 1
SS2J3                 Selecciona 2 asientos en clase J de la línea 3
`;
    
    case 'NM':
      return `
NM - Nominación de Lugares (Agregar Nombres)

Formato: NM[CANTIDAD][APELLIDO]/[NOMBRE] [TITULO]

Ejemplos:
NM1GARCIA/JUAN MR                       Agrega un pasajero adulto
NM2PEREZ/MARIA MRS/PEDRO MR             Agrega dos pasajeros con el mismo apellido
NM1LOPEZ/ANA(CHD/01JAN15)               Agrega un niño con fecha de nacimiento
NM1RODRIGUEZ/MARIA(INFGARCIA/LUIS/01JAN20)  Agrega un adulto con un infante
`;
    
    default:
      return `No se encontró ayuda para el comando: ${subCommand}`;
  }
}

// Función para manejar el comando de disponibilidad (AN)
function handleAvailabilityCommand(cmd) {
  // Implementación simplificada de AN usando datos mock
  try {
    // Extraer la información del comando
    // Formato esperado: AN[FECHA][ORIGEN][DESTINO][/OPCIONES]
    const regex = /AN(\d{1,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: AN15NOVBUEMAD";
    }
    
    const [, date, origin, destination, options] = match;
    
    // Buscar en los datos mock
    const flights = mockData.flights.filter(flight => 
      flight.origin === origin && flight.destination === destination
    );
    
    if (flights.length === 0) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}.`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `** AMADEUS AVAILABILITY - AN ** ${destination} ${origin}.XX\n`;
    
    flights.forEach((flight, index) => {
      const flightLine = `${index + 1} ${flight.airline} ${flight.flightNumber} `;
      
      // Agregar clases disponibles
      let classes = "";
      flight.availableClasses.forEach(cls => {
        classes += `${cls.code}${cls.seats} `;
      });
      
      response += `${flightLine}${classes}${flight.origin} ${flight.destination} ${flight.departureTime} ${flight.arrivalTime} E0/${flight.aircraft} ${flight.duration}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando AN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el comando de horarios (SN)
function handleScheduleCommand(cmd) {
  // Implementación similar a AN pero mostrando todas las clases
  try {
    const regex = /SN(\d{1,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SN15NOVBUEMAD";
    }
    
    const [, date, origin, destination, options] = match;
    
    // Buscar en los datos mock
    const flights = mockData.flights.filter(flight => 
      flight.origin === origin && flight.destination === destination
    );
    
    if (flights.length === 0) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}.`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `** AMADEUS SCHEDULES - SN ** ${destination} ${origin}.XX\n`;
    
    flights.forEach((flight, index) => {
      const flightLine = `${index + 1} ${flight.airline} ${flight.flightNumber} `;
      
      // Agregar todas las clases, incluyendo las cerradas
      let classes = "";
      flight.allClasses.forEach(cls => {
        const status = cls.status || (cls.seats > 0 ? cls.seats : 'C');
        classes += `${cls.code}${status} `;
      });
      
      response += `${flightLine}${classes}${flight.origin} ${flight.destination} ${flight.departureTime} ${flight.arrivalTime} E0/${flight.aircraft} ${flight.duration}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando SN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el comando de frecuencias (TN)
function handleTimetableCommand(cmd) {
  try {
    const regex = /TN(\d{1,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\/.+)?/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: TN15NOVBUEMAD";
    }
    
    const [, date, origin, destination, options] = match;
    
    // Buscar en los datos mock
    const flights = mockData.flights.filter(flight => 
      flight.origin === origin && flight.destination === destination
    );
    
    if (flights.length === 0) {
      return `No se encontraron vuelos disponibles para la ruta ${origin}-${destination}.`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `** AMADEUS TIMETABLE - TN ** ${destination} ${origin}.XX\n`;
    
    flights.forEach((flight, index) => {
      response += `${index + 1} ${flight.airline} ${flight.flightNumber} ${flight.frequency} ${flight.origin} ${flight.destination} ${flight.departureTime} ${flight.arrivalTime} 0 ${flight.validFrom} ${flight.validTo} ${flight.aircraft} ${flight.duration}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando TN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar codificación de ciudad (DAN)
function handleEncodeCity(cmd) {
  try {
    const cityName = cmd.slice(3).trim();
    
    // Buscar en los datos mock
    const city = mockData.cities.find(c => 
      c.name.toUpperCase() === cityName.toUpperCase()
    );
    
    if (!city) {
      return `No se encontró información para la ciudad: ${cityName}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DAN${cityName.toUpperCase()}\n`;
    response += `A:APT B:BUS C:CITY G:GRD H:HELI O:OFF-PT R:RAIL S:ASSOC TOWN\n`;
    response += `${city.code}*C ${city.name.toUpperCase()} /${city.country}\n`;
    
    city.airports.forEach(airport => {
      response += `A ${airport.code} - ${airport.name} - ${airport.distance}K /${city.country}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DAN:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar decodificación de ciudad (DAC)
function handleDecodeCity(cmd) {
  try {
    const cityCode = cmd.slice(3).trim();
    
    // Buscar en los datos mock
    const city = mockData.cities.find(c => c.code === cityCode);
    
    if (!city) {
      // Buscar como aeropuerto
      const airport = mockData.cities.flatMap(c => c.airports).find(a => a.code === cityCode);
      
      if (!airport) {
        return `No se encontró información para el código: ${cityCode}`;
      }
      
      const parentCity = mockData.cities.find(c => 
        c.airports.some(a => a.code === cityCode)
      );
      
      // Formatear la respuesta para aeropuerto
      let response = `DAC${cityCode}\n`;
      response += `${cityCode} A ${airport.name} /${parentCity.country}\n`;
      response += `${parentCity.code} C ${parentCity.name}\n`;
      
      return response;
    }
    
    // Formatear la respuesta para ciudad
    let response = `DAC${cityCode}\n`;
    response += `${cityCode} C ${city.name.toUpperCase()} /${city.country}\n`;
    
    if (city.airports.length > 0) {
      response += `AIRPORTS:\n`;
      city.airports.forEach(airport => {
        response += `${airport.code} - ${airport.name}\n`;
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DAC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar codificación de aerolínea (DNA)
function handleEncodeAirline(cmd) {
  try {
    const airlineName = cmd.slice(3).trim();
    
    // Buscar en los datos mock
    const airline = mockData.airlines.find(a => 
      a.name.toUpperCase().includes(airlineName.toUpperCase()) ||
      a.code === airlineName.toUpperCase()
    );
    
    if (!airline) {
      return `No se encontró información para la aerolínea: ${airlineName}`;
    }
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    let response = `DNA${airlineName.toUpperCase()}\n`;
    response += `${airline.code} ${airline.name.toUpperCase()}\n`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando DNA:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la venta de segmentos (SS)
async function handleSellSegment(cmd) {
  try {
    // Formato esperado: SS[CANTIDAD][CLASE][LÍNEA]
    const regex = /SS(\d+)([A-Z])(\d+)/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SS1Y1";
    }
    
    const [, quantity, classCode, lineNumber] = match;
    
    // Crear un nuevo segmento para el PNR activo en Firebase
    // Normalmente, esto sería más complejo y consultaría a un sistema externo
    // Aquí lo simplificamos para fines educativos
    
    // Generar un PNR temporal
    const pnrData = {
      segments: [{
        airline: 'XX', // Se reemplazaría por la aerolínea real
        flightNumber: '1234', // Se reemplazaría por el número de vuelo real
        classCode,
        quantity: parseInt(quantity),
        origin: 'XXX', // Se reemplazaría por origen real
        destination: 'YYY', // Se reemplazaría por destino real
        departureTime: '1200',
        arrivalTime: '1400',
        departureDate: '01JAN', // Se reemplazaría por fecha real
        status: 'DK', // Direct Sell
        aircraft: '737',
      }],
      createdAt: new Date().toISOString(),
    };
    
    // En una aplicación real, aquí guardaríamos el PNR en Firebase
    // await addDoc(collection(db, 'pnrDrafts'), pnrData);
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    const response = `
RP/XXXXX1234/
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
function handleAddName(cmd) {
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
    
    // En una aplicación real, aquí actualizaríamos el PNR en Firebase
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    const response = `
RP/XXXXX1234/
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
function handleAddContact(cmd) {
  try {
    // Analizar el comando AP
    // Formato: AP CIUDAD TELEFONO-TIPO
    const contactPattern = /AP\s+([A-Z]{3})\s+([0-9\-]+)(?:-([A-Z]))?/i;
    const match = cmd.match(contactPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: AP BUE 12345678-M";
    }
    
    const [, city, phone, type] = match;
    
    // En una aplicación real, aquí actualizaríamos el PNR en Firebase
    
    // Formatear la respuesta simulando la respuesta de Amadeus
    const response = `
RP/XXXXX1234/
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

// Función para manejar el fin de transacción (ET/ER)
function handleEndTransaction(cmd) {
  try {
    // Generar un código de reserva (PNR)
    const recordLocator = generatePNR();
    
    if (cmd === 'ET') {
      return `FIN DE TRANSACCION COMPLETADO - ${recordLocator}`;
    } else {
      // Para ER, simulamos que reabre el PNR
      return `
---RLR---
RP/XXXXX1234/AGENTE FF/WE 01JAN/1200Z ${recordLocator}
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY HK1 1200 1400 01JAN E 737
3 AP BUE 12345678-H
4 TK TL01JAN/1200
*TRN*
>`;
    }
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar la recuperación de PNR (RT)
async function handleRetrievePNR(cmd) {
  try {
    // Analizar el comando RT
    // Formato: RT[CODIGO]
    const pnrCode = cmd.slice(2).trim();
    
    if (!pnrCode) {
      return "Formato incorrecto. Ejemplo: RTABCDEF";
    }
    
    // En una aplicación real, aquí buscaríamos el PNR en Firebase
    // Simulamos una respuesta con un PNR de ejemplo
    
    const response = `
---RLR---
RP/XXXXX1234/AGENTE FF/WE 01JAN/1200Z ${pnrCode}
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