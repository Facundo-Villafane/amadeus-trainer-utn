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
    
    // Crear un array con los elementos a eliminar
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
    
    // Contar total de elementos en el PNR para validar los índices
    let totalElements = 0;
    
    // Contar pasajeros
    if (currentPNR.passengers) {
      totalElements += currentPNR.passengers.length;
    }
    
    // Contar segmentos
    if (currentPNR.segments) {
      totalElements += currentPNR.segments.length;
    }
    
    // Contar contactos telefónicos
    if (currentPNR.contacts) {
      totalElements += currentPNR.contacts.length;
    }
    
    // Contar contactos de email
    if (currentPNR.emailContacts) {
      totalElements += currentPNR.emailContacts.length;
    }
    
    // Contar ticketing
    if (currentPNR.ticketing) {
      totalElements += 1;
    }
    
    // Validar que los elementos existan
    for (const elementNum of elementsToDelete) {
      if (elementNum <= 0 || elementNum > totalElements) {
        return `Error: El elemento ${elementNum} no existe en el PNR actual.`;
      }
    }
    
    // Eliminar los elementos en orden inverso (de mayor a menor índice)
    for (const elementNum of elementsToDelete) {
      let currentIndex = 1; // Empezamos desde 1 para alinearnos con la numeración del PNR
      
      // Verificar si el elemento es un pasajero
      if (currentPNR.passengers && elementNum <= currentPNR.passengers.length) {
        // Eliminar el pasajero en la posición correspondiente (elementNum - 1)
        currentPNR.passengers.splice(elementNum - 1, 1);
        continue;
      }
      currentIndex += currentPNR.passengers ? currentPNR.passengers.length : 0;
      
      // Verificar si el elemento es un segmento
      if (currentPNR.segments && elementNum <= currentIndex + currentPNR.segments.length) {
        // Eliminar el segmento en la posición correspondiente
        const segmentIndex = elementNum - currentIndex - 1 + 1; // Ajuste para el índice en el array (base 0)
        currentPNR.segments.splice(segmentIndex - 1, 1);
        continue;
      }
      currentIndex += currentPNR.segments ? currentPNR.segments.length : 0;
      
      // Verificar si el elemento es un contacto telefónico
      if (currentPNR.contacts && elementNum <= currentIndex + currentPNR.contacts.length) {
        // Eliminar el contacto en la posición correspondiente
        const contactIndex = elementNum - currentIndex - 1 + 1;
        currentPNR.contacts.splice(contactIndex - 1, 1);
        continue;
      }
      currentIndex += currentPNR.contacts ? currentPNR.contacts.length : 0;
      
      // Verificar si el elemento es un contacto de email
      if (currentPNR.emailContacts && elementNum <= currentIndex + currentPNR.emailContacts.length) {
        // Eliminar el contacto de email en la posición correspondiente
        const emailIndex = elementNum - currentIndex - 1 + 1;
        currentPNR.emailContacts.splice(emailIndex - 1, 1);
        continue;
      }
      currentIndex += currentPNR.emailContacts ? currentPNR.emailContacts.length : 0;
      
      // Verificar si el elemento es ticketing
      if (currentPNR.ticketing && elementNum === currentIndex + 1) {
        // Eliminar la información de ticketing
        delete currentPNR.ticketing;
        continue;
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