// src/utils/commandParser/commands/pnr/pnrSupplementary.js
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnrState';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja el comando OS para añadir información especial (OSI - Other Special Information)
 * @param {string} cmd - Comando ingresado por el usuario (OS + aerolínea + mensaje + /P + nº pasajero)
 * @returns {string} Respuesta del comando
 */
export async function handleAddOSI(cmd) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Validar que haya al menos un pasajero en el PNR
    if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
      return "Debe agregar al menos un pasajero (NM) antes de usar el comando OS.";
    }
    
    // Validar que haya al menos un segmento en el PNR
    if (!currentPNR.segments || currentPNR.segments.length === 0) {
      return "Debe agregar al menos un segmento (SS) antes de usar el comando OS.";
    }
    
    // Extraer información del comando OS
    // Formato: OS [AIRLINE] [MESSAGE] /P[PASSENGER_NUMBER]
    const osiPattern = /^OS\s+([A-Z0-9]{2})\s+(.+?)(?:\s*\/P(\d+))?$/i;
    const match = cmd.match(osiPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: OS UX PAX VIP WAGNER /P1";
    }
    
    let [, airlineCode, message, passengerNumber] = match;
    
    // Normalizar códigos y mensajes
    airlineCode = airlineCode.toUpperCase();
    message = message.trim();
    
    // Validar longitud del mensaje
    if (message.length > 68) {
      return "Error: El mensaje OSI no puede exceder los 68 caracteres.";
    }
    
    // Si el pasajero no está especificado, asumimos que es para todos
    let passengerIndex = null;
    if (passengerNumber) {
      passengerIndex = parseInt(passengerNumber, 10);
      
      // Verificar que el pasajero existe
      if (passengerIndex <= 0 || passengerIndex > currentPNR.passengers.length) {
        return `Error: El pasajero ${passengerIndex} no existe en el PNR actual.`;
      }
    }
    
    // Si el código de aerolínea es YY, convertirlo a las aerolíneas del itinerario
    const uniqueAirlines = [];
    if (airlineCode === 'YY') {
      // Obtener todas las aerolíneas únicas del itinerario
      currentPNR.segments.forEach(segment => {
        if (!uniqueAirlines.includes(segment.airline_code)) {
          uniqueAirlines.push(segment.airline_code);
        }
      });
      
      if (uniqueAirlines.length === 0) {
        return "Error: No se pudo determinar la aerolínea para el OSI.";
      }
    } else {
      // Validar que la aerolínea existe en el itinerario
      const airlineExists = currentPNR.segments.some(segment => segment.airline_code === airlineCode);
      
      // Advertencia pero permitir continuar (algunos OSI pueden ser para aerolíneas no en el itinerario)
      if (!airlineExists) {
        console.warn(`La aerolínea ${airlineCode} no está en el itinerario.`);
      }
      
      uniqueAirlines.push(airlineCode);
    }
    
    // Verificar el límite de 127 elementos OSI
    const currentOSICount = (currentPNR.osiElements || []).length;
    if (currentOSICount + uniqueAirlines.length > 127) {
      return "Error: Se ha alcanzado el límite máximo de 127 elementos OSI en el PNR.";
    }
    
    // Crear los elementos OSI para cada aerolínea
    const newOSIElements = uniqueAirlines.map(airline => ({
      type: 'OSI',
      airlineCode: airline,
      message: message,
      passengerNumber: passengerIndex,
      addedAt: new Date()
    }));
    
    // Añadir los elementos OSI al PNR
    if (!currentPNR.osiElements) {
      currentPNR.osiElements = [];
    }
    
    currentPNR.osiElements = [...currentPNR.osiElements, ...newOSIElements];
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          osiElements: currentPNR.osiElements,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'OSI element(s) added',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar PNR:', error);
      // Continuamos aunque falle el guardado para mostrar respuesta al usuario
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando OS:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Lista de códigos SSR válidos y sus descripciones
 */
export const validSSRCodes = {
  'FQTS': 'Frequent flyer service request',
  'FQTR': 'Frequent flyer mileage program redemption',
  'FPML': 'Fruit platter',
  'EXST': 'Extra seat',
  'DEPU': 'Deportee, unaccompanied',
  'DEPA': 'Deportee accompanied by an escort',
  'DEAF': 'Deaf (with or without guide dog)',
  'DBML': 'Diabetic meal',
  'COUR': 'Commercial courier',
  'CKIN': 'Information for airport personnel',
  'CHML': 'Child meal',
  'CBBG': 'Cabin baggage',
  'BULK': 'Bulky baggage',
  'BSCT': 'Bassinet/Carry cot/Baby basket',
  'FRAV': 'First available',
  'FRAG': 'Fragile baggage',
  'FQTV': 'Frequent flyer mileage program accrual',
  'FQTU': 'Frequent flyer upgrade and accrual',
  'HMFL': 'High fiber meal',
  'GRPS': 'Passengers travelling together using a common identity',
  'GRPF': 'Group fare',
  'LFML': 'Low cholesterol',
  'LCML': 'Low calorie meal',
  'LANG': 'Languages spoken',
  'KSML': 'Kosher meal',
  'HNML': 'Hindu meal',
  'MOML': 'Moslem meal',
  'MEDA': 'Medical case',
  'MAAS': 'Meet and assist',
  'LSML': 'Low sodium, no salt added meal',
  'LPML': 'Low protein meal',
  'NSST': 'No smoking seat',
  'NSSB': 'No smoking bulkhead seat',
  'NSSA': 'No smoking aisle seat',
  'NLML': 'Non lactose meal',
  'NAME': 'Name - when airline holds reservations under a different name',
  'PETC': 'Animal in cabin',
  'PCTC': 'Emergency contact details',
  'OTHS': 'Other service not specified by any other SSR code',
  'ORML': 'Oriental meal',
  'NSSW': 'No smoking window seat',
  'SMSW': 'Smoking window seat',
  'SMST': 'Smoking seat',
  'SMSB': 'Smoking bulkhead seat',
  'SMSA': 'Smoking aisle seat',
  'SLPR': 'Bed/Berth in cabin',
  'SFML': 'Sea food meal',
  'SEMN': 'Seaman - ship\'s crew',
  'SEAT': 'Pre-reserved seat with boarding pass issued or to be issued',
  'RVML': 'Raw vegetarian meal',
  'RQST': 'Seat request - include seat number preference',
  'PSPT': 'Passport',
  'PRML': 'Low Purim meal',
  'TWOV': 'Transit or transfer without visa',
  'TKTL': 'Ticket time limit',
  'TKNM': 'Ticket number in FH element',
  'TKNC': 'Ticket number in transmission',
  'TKNA': 'Ticket number in FA element',
  'STCR': 'Stretcher passenger',
  'SPML': 'Special meal',
  'SPEQ': 'Sports equipment',
  'XBAG': 'Excess baggage',
  'WCOB': 'Wheelchair - on board',
  'WCMP': 'Wheelchair - manual power (US carriers only)',
  'WCHS': 'Wheel chair up and down steps',
  'WCHR': 'Wheelchair - for ramp',
  'WCHC': 'Wheelchair - all the way to seat',
  'WCBW': 'Wheelchair',
  'WCBD': 'Wheelchair - dry cell battery',
  'VLML': 'Vegetarian meal (lacto-ovo)',
  'VGML': 'Vegetarian meal (non-dairy)',
  'UMNR': 'Unaccompanied minor',
  'INFT': 'Infant (not occupying a seat)'
};

/**
 * Maneja el comando SR para añadir solicitudes de servicio especial (SSR - Special Service Request)
 * @param {string} cmd - Comando ingresado por el usuario (SR[CÓDIGO]/P[#])
 * @returns {string} Respuesta del comando
 */
export async function handleAddSSR(cmd) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Validar que haya al menos un pasajero en el PNR
    if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
      return "Debe agregar al menos un pasajero (NM) antes de usar el comando SR.";
    }
    
    // Validar que haya al menos un segmento en el PNR
    if (!currentPNR.segments || currentPNR.segments.length === 0) {
      return "Debe agregar al menos un segmento (SS) antes de usar el comando SR.";
    }
    
    // Extraer información del comando SR
    // Formato: SR[CÓDIGO]/P[NÚMERO_PASAJERO]
    // Ejemplo: SRVGML/P2
    const ssrPattern = /^SR([A-Z]{4})(?:\/P(\d+))?$/i;
    const match = cmd.match(ssrPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SRVGML/P2";
    }
    
    let [, ssrCode, passengerNumber] = match;
    
    // Normalizar códigos
    ssrCode = ssrCode.toUpperCase();
    
    // Validar que el código SSR existe
    if (!validSSRCodes[ssrCode]) {
      return `Error: El código SSR '${ssrCode}' no es válido o no está soportado. Use HE SSRCODES para ver la lista de códigos válidos.`;
    }
    
    // El pasajero debe especificarse para SSR
    if (!passengerNumber) {
      return "Error: Debe especificar un número de pasajero para el SSR. Ejemplo: SRVGML/P2";
    }
    
    // Convertir a número y verificar que existe
    const passengerIndex = parseInt(passengerNumber, 10);
    if (passengerIndex <= 0 || passengerIndex > currentPNR.passengers.length) {
      return `Error: El pasajero ${passengerIndex} no existe en el PNR actual.`;
    }
    
    // Crear un SSR para cada segmento
    const newSSRElements = [];
    
    currentPNR.segments.forEach((segment, segmentIndex) => {
      // SSR VGML YY HK1 /S3/P2
      const airlineCode = segment.airline_code;
      const segmentNumber = segmentIndex + 1 + (currentPNR.passengers?.length || 0); // Índice del segmento en el PNR
      
      const ssrElement = {
        type: 'SSR',
        code: ssrCode,
        airlineCode: airlineCode,
        status: 'HK1', // HK1 = confirmado para 1 pasajero
        passengerNumber: passengerIndex,
        segmentNumber: segmentNumber,
        segmentIndex: segmentIndex,
        addedAt: new Date()
      };
      
      newSSRElements.push(ssrElement);
    });
    
    // Añadir los elementos SSR al PNR
    if (!currentPNR.ssrElements) {
      currentPNR.ssrElements = [];
    }
    
    currentPNR.ssrElements = [...currentPNR.ssrElements, ...newSSRElements];
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          ssrElements: currentPNR.ssrElements,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'SSR element(s) added',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar PNR:', error);
      // Continuamos aunque falle el guardado para mostrar respuesta al usuario
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando SR:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Función para crear automáticamente un SSR INFT cuando se añade un pasajero con infante
 * @param {Object} pnr - El PNR actual
 * @param {number} passengerIndex - Índice del pasajero con infante (base 1)
 * @param {Object} infantData - Datos del infante
 * @returns {Object} PNR actualizado
 */
export function createInfantSSR(pnr, passengerIndex, infantData) {
  // Si no hay segmentos o no hay datos de infante, no hacer nada
  if (!pnr.segments || pnr.segments.length === 0 || !infantData) {
    return pnr;
  }
  
  // Asegurarse de que existe el array de SSR
  if (!pnr.ssrElements) {
    pnr.ssrElements = [];
  }
  
  // Crear un SSR INFT para cada segmento
  pnr.segments.forEach((segment, segmentIndex) => {
    const airlineCode = segment.airline_code;
    const segmentNumber = segmentIndex + 1 + (pnr.passengers?.length || 0); // Índice del segmento en el PNR
    
    // Formatear el nombre del infante
    const infantName = `${infantData.lastName}/${infantData.firstName}`;
    
    const ssrElement = {
      type: 'SSR',
      code: 'INFT',
      airlineCode: airlineCode,
      status: 'HK1', // HK1 = confirmado para 1 pasajero
      passengerNumber: passengerIndex,
      segmentNumber: segmentNumber,
      segmentIndex: segmentIndex,
      infantName: infantName,
      addedAt: new Date()
    };
    
    pnr.ssrElements.push(ssrElement);
  });
  
  return pnr;
}

/**
 * Maneja el comando SRFOID para añadir información de documento de identidad
 * @param {string} cmd - Comando ingresado por el usuario (SRFOID YY HK1-PP12345678/P1)
 * @returns {string} Respuesta del comando
 */
export async function handleAddFOID(cmd) {
    try {
        // Verificar si hay un PNR en progreso
        const currentPNR = getCurrentPNR();
        if (!currentPNR) {
            return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
        }
    
        // Validar que haya al menos un pasajero en el PNR
        if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
            return "Debe agregar al menos un pasajero (NM) antes de usar el comando SRFOID.";
        }
    
        // Extraer información del comando SRFOID
        // Formato: SRFOID [CODIGO_AEROLINEA] HK1-[TIPO][NUMERO]/P[PASAJERO]
        // Ejemplo: SRFOID YY HK1-PP12345678/P1 o SRFOID YY HK1-PPAB12345XY/P1
        const foidPattern = /^SRFOID\s+([A-Z0-9]{2})\s+HK1-([A-Z]{2})([A-Z0-9-]+)\/P(\d+)$/i;
        const match = cmd.match(foidPattern);
    
        if (!match) {
            return "Formato incorrecto. Ejemplo: SRFOID YY HK1-PP12345678/P1 (PP para pasaporte, NI para DNI)";
        }
    
        let [, airlineCode, docType, docNumber, passengerNumber] = match;
    
        // Normalizar códigos
        airlineCode = airlineCode.toUpperCase();
        docType = docType.toUpperCase();
        passengerNumber = parseInt(passengerNumber, 10);
    
        // Validar el tipo de documento
        if (docType !== 'PP' && docType !== 'NI') {
            return "Error: El tipo de documento debe ser PP (pasaporte) o NI (documento nacional de identidad).";
        }
    
        // Verificar que el pasajero existe
        if (passengerNumber <= 0 || passengerNumber > currentPNR.passengers.length) {
            return `Error: El pasajero ${passengerNumber} no existe en el PNR actual.`;
        }
    
        // Si el código de aerolínea es YY, obtener aerolíneas del itinerario
        const airlines = [];
        if (airlineCode === 'YY') {
            // Obtener todas las aerolíneas únicas del itinerario
            currentPNR.segments.forEach(segment => {
                if (!airlines.includes(segment.airline_code)) {
                    airlines.push(segment.airline_code);
                }
            });
      
            if (airlines.length === 0) {
                return "Error: No se pudo determinar la aerolínea para el FOID.";
            }
        } else {
            airlines.push(airlineCode);
        }
    
        // Crear los elementos FOID para cada aerolínea
        const newFOIDElements = airlines.map(airline => ({
            type: 'SSR',
            code: 'FOID',
            airlineCode: airline,
            status: 'HK1',
            docType: docType,
            docNumber: docNumber,
            passengerNumber: passengerNumber,
            addedAt: new Date()
        }));
    
        // Añadir los elementos FOID al PNR
        if (!currentPNR.ssrElements) {
            currentPNR.ssrElements = [];
        }
    
        // Si el pasajero ya tiene un FOID, reemplazarlo
        currentPNR.ssrElements = currentPNR.ssrElements.filter(ssr =>
            !(ssr.code === 'FOID' && ssr.passengerNumber === passengerNumber)
        );
    
        currentPNR.ssrElements = [...currentPNR.ssrElements, ...newFOIDElements];
    
        // Actualizar la referencia global
        setCurrentPNR(currentPNR);
    
        // Guardar el PNR actualizado en Firestore
        try {
            if (currentPNR.id) {
                await updateDoc(doc(db, 'pnrs', currentPNR.id), {
                    ssrElements: currentPNR.ssrElements,
                    updatedAt: serverTimestamp(),
                    [`history.${Date.now()}`]: {
                        command: cmd,
                        result: 'FOID element(s) added',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        } catch (error) {
            console.error('Error al guardar PNR:', error);
            // Continuamos aunque falle el guardado para mostrar respuesta al usuario
        }
    
        // Formatear y devolver la respuesta
        return formatPNRResponse(currentPNR);
    } catch (error) {
        console.error('Error al procesar el comando SRFOID:', error);
        return `Error al procesar el comando: ${error.message}`;
    }
}