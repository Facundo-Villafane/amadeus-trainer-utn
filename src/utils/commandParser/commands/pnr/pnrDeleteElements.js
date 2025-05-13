// src/utils/commandParser/commands/pnr/pnrDeleteElements.js
import { updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnrState';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja el comando XE para eliminar elementos del PNR
 * @param {string} cmd - Comando ingresado por el usuario (XE seguido de números)
 * @returns {string} Respuesta del comando
 */
// Corrección de la función handleDeleteElements en pnrDeleteElements.js
export async function handleDeleteElements(cmd) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso para eliminar elementos.";
    }
    
    // Analizar el comando XE para extraer los elementos a eliminar
    // Formatos posibles: XE3, XE3,6, XE3-6
    const elementPattern = /^XE(\d+)(?:[-,](\d+))?$/i;
    const match = cmd.match(elementPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplos: XE3, XE3,6, XE3-6";
    }
    
    const startElement = parseInt(match[1], 10);
    let endElement = match[2] ? parseInt(match[2], 10) : startElement;
    const isRange = match[0].includes('-');
    const isCommaList = match[0].includes(',');
    
    // Crear un array con los números de elemento a eliminar
    let elementsToDelete = [];
    
    if (isRange) {
      // Para rangos (XE3-6), incluir todos los elementos entre start y end
      for (let i = startElement; i <= endElement; i++) {
        elementsToDelete.push(i);
      }
    } else if (isCommaList) {
      // Para listas separadas por comas (XE3,6), agregar ambos elementos
      elementsToDelete = [startElement, endElement];
    } else {
      // Para un solo elemento (XE3)
      elementsToDelete = [startElement];
    }
    
    // Ordenar los elementos de mayor a menor para evitar problemas al eliminar
    elementsToDelete.sort((a, b) => b - a);
    
    // Crear un mapeo de los elementos del PNR para poder eliminarlos correctamente
    const elementMap = [];
    
    // Mapear pasajeros
    if (currentPNR.passengers && currentPNR.passengers.length > 0) {
      currentPNR.passengers.forEach((_, index) => {
        elementMap.push({
          type: 'passenger',
          index: index
        });
      });
    }
    
    // Mapear segmentos
    if (currentPNR.segments && currentPNR.segments.length > 0) {
      currentPNR.segments.forEach((_, index) => {
        elementMap.push({
          type: 'segment',
          index: index
        });
      });
    }
    
    // Mapear contactos telefónicos
    if (currentPNR.contacts && currentPNR.contacts.length > 0) {
      currentPNR.contacts.forEach((_, index) => {
        elementMap.push({
          type: 'contact',
          index: index
        });
      });
    }
    
    // Mapear contactos de email
    if (currentPNR.emailContacts && currentPNR.emailContacts.length > 0) {
      currentPNR.emailContacts.forEach((_, index) => {
        elementMap.push({
          type: 'emailContact',
          index: index
        });
      });
    }
    
    // Mapear elementos OSI
    if (currentPNR.osiElements && currentPNR.osiElements.length > 0) {
      currentPNR.osiElements.forEach((_, index) => {
        elementMap.push({
          type: 'osiElement',
          index: index
        });
      });
    }
    
    // Mapear elementos SSR
    if (currentPNR.ssrElements && currentPNR.ssrElements.length > 0) {
      currentPNR.ssrElements.forEach((_, index) => {
        elementMap.push({
          type: 'ssrElement',
          index: index
        });
      });
    }
    
    // Mapear ticketing
    if (currentPNR.ticketing) {
      elementMap.push({
        type: 'ticketing'
      });
    }
    
    // Validar que los elementos existen
    for (const elementNum of elementsToDelete) {
      if (elementNum <= 0 || elementNum > elementMap.length) {
        return `Error: El elemento ${elementNum} no existe en el PNR actual.`;
      }
    }
    
    // Eliminar los elementos en orden inverso (de mayor a menor índice)
    for (const elementNum of elementsToDelete) {
      const elementToDelete = elementMap[elementNum - 1];
      
      if (!elementToDelete) {
        continue; // Saltar si no existe
      }
      
      // Eliminar según el tipo de elemento
      switch (elementToDelete.type) {
        case 'passenger':
          currentPNR.passengers.splice(elementToDelete.index, 1);
          break;
        case 'segment':
          currentPNR.segments.splice(elementToDelete.index, 1);
          break;
        case 'contact':
          currentPNR.contacts.splice(elementToDelete.index, 1);
          break;
        case 'emailContact':
          currentPNR.emailContacts.splice(elementToDelete.index, 1);
          break;
        case 'osiElement':
          currentPNR.osiElements.splice(elementToDelete.index, 1);
          break;
        case 'ssrElement':
          currentPNR.ssrElements.splice(elementToDelete.index, 1);
          break;
        case 'ticketing':
          delete currentPNR.ticketing;
          break;
        default:
          break;
      }
    }
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar los cambios en Firestore si existe
    try {
      if (currentPNR.id) {
        const updateData = {};
        
        if (currentPNR.passengers) {
          updateData.passengers = currentPNR.passengers;
        }
        
        if (currentPNR.segments) {
          updateData.segments = currentPNR.segments;
        }
        
        if (currentPNR.contacts) {
          updateData.contacts = currentPNR.contacts;
        }
        
        if (currentPNR.emailContacts) {
          updateData.emailContacts = currentPNR.emailContacts;
        }
        
        if (currentPNR.osiElements) {
          updateData.osiElements = currentPNR.osiElements;
        }
        
        if (currentPNR.ssrElements) {
          updateData.ssrElements = currentPNR.ssrElements;
        }
        
        // Si se eliminó el ticketing, actualizarlo a null
        if (!currentPNR.ticketing) {
          updateData.ticketing = null;
        }
        
        updateData.updatedAt = serverTimestamp();
        updateData[`history.${Date.now()}`] = {
          command: cmd,
          result: `Elements deleted: ${elementsToDelete.join(', ')}`,
          timestamp: new Date().toISOString()
        };
        
        await updateDoc(doc(db, 'pnrs', currentPNR.id), updateData);
      }
    } catch (error) {
      console.error('Error al actualizar PNR:', error);
      // Continuamos para mostrar el PNR actualizado aunque falle la actualización en Firestore
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
    
  } catch (error) {
    console.error('Error al procesar el comando XE:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Maneja el comando XI para cancelar un PNR completo con confirmación
 * @returns {string} Respuesta del comando
 */
export async function handleCancelPNRWithConfirmation() {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que cancelar.";
    }
    
    // Verificar si el PNR ya tiene un Record Locator (ya está guardado)
    if (!currentPNR.recordLocator || currentPNR.recordLocator.startsWith('TEMP')) {
      return "Este PNR aún no ha sido guardado. Use ET para guardar primero o XI para cancelar la sesión actual.";
    }
    
    // Solicitar confirmación al usuario
    return `¿Está seguro de que desea cancelar el PNR ${currentPNR.recordLocator}? Use RF seguido de su nombre para confirmar la cancelación.`;
    
  } catch (error) {
    console.error('Error al procesar el comando XI:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Confirma la cancelación de un PNR después del comando RF
 * @param {string} cmd - Comando ingresado por el usuario (RF...)
 * @param {string} userId - ID del usuario (para registrar quién canceló el PNR)
 * @param {boolean} previousCommandWasXI - Indica si el comando anterior fue XI
 * @returns {string} Respuesta del comando
 */
export async function confirmCancelPNR(cmd, userId, previousCommandWasXI) {
  try {
    if (!previousCommandWasXI) {
      // Si el comando anterior no fue XI, procesar RF normalmente
      return null; // Devolver null para indicar que se debe procesar normalmente
    }
    
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que cancelar.";
    }
    
    // Formato: RF NOMBRE
    const rfPattern = /RF\s+(.+)/i;
    const match = cmd.match(rfPattern);
    
    if (!match || !match[1]) {
      return "Formato incorrecto. Use RF seguido de su nombre para confirmar la cancelación.";
    }
    
    const receivedFrom = match[1].trim().toUpperCase();
    
    // Actualizar el estado en Firestore
    try {
      if (currentPNR.id) {
        // Obtener el PNR actual de Firestore para verificar su estado
        const pnrDoc = await getDoc(doc(db, 'pnrs', currentPNR.id));
        
        if (!pnrDoc.exists()) {
          return `El PNR ${currentPNR.recordLocator} ya no existe.`;
        }
        
        const pnrData = pnrDoc.data();
        
        if (pnrData.status === 'CANCELLED') {
          return `El PNR ${currentPNR.recordLocator} ya está cancelado.`;
        }
        
        // Actualizar el PNR para marcarlo como cancelado
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          status: 'CANCELLED',
          isDeleted: true, // Campo especial para indicar que está eliminado
          updatedAt: serverTimestamp(),
          cancellationInfo: {
            cancelledBy: userId,
            cancelledAt: serverTimestamp(),
            receivedFrom: receivedFrom
          },
          [`history.${Date.now()}`]: {
            command: "XI + RF",
            result: 'PNR cancelled and confirmed',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return "El PNR debe estar guardado antes de poder cancelarse. Use ET primero.";
      }
    } catch (error) {
      console.error('Error al cancelar PNR:', error);
      return `Error al cancelar el PNR: ${error.message}`;
    }
    
    // Limpiar el PNR actual
    const cancelledLocator = currentPNR.recordLocator;
    setCurrentPNR(null);
    
    return `PNR ${cancelledLocator} cancelado correctamente.`;
    
  } catch (error) {
    console.error('Error al confirmar cancelación:', error);
    return `Error al confirmar cancelación: ${error.message}`;
  }
}