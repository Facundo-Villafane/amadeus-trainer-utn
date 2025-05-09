// src/utils/commandParser/commands/pnr/pnrTransaction.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { generatePNR } from '../../../../utils/pnrGenerator';
import { getCurrentPNR, clearCurrentPNR, setCurrentPNR, validatePNR, getUserEmail } from './pnrState';
import { formatERResponse, formatPNRResponse } from './pnrUtils';
import { formatAmadeusDate } from './dateUtils';

/**
 * Maneja el fin de transacción (ET/ER)
 * @param {string} cmd - Comando ingresado por el usuario (ET o ER)
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleEndTransaction(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que finalizar.";
    }
    
    // Verificar que el PNR tenga todos los elementos obligatorios
    const validationErrors = validatePNR(currentPNR);
    if (validationErrors.length > 0) {
      return `No se puede finalizar el PNR: ${validationErrors.join(" ")}`;
    }
    
    // Para ET (End Transaction), finalizar y guardar el PNR
    if (cmd === 'ET') {
      try {
        // Si no tiene un localizador permanente, generarlo ahora
        if (!currentPNR.recordLocator || currentPNR.recordLocator.startsWith('TEMP')) {
          currentPNR.recordLocator = generatePNR();
        }
        
        // Cambiar estado a confirmado y actualizar el estado de los segmentos
        currentPNR.status = 'CONFIRMED';
        
        // Cambiar el estado de los segmentos de DK (solicitud) a HK (confirmado)
        currentPNR.segments = currentPNR.segments.map(segment => ({
          ...segment,
          status: 'HK' // Cambiar a confirmado
        }));
        
        // Añadir fecha de emisión de billete (TK)
        const today = new Date();
        const timeLimit = formatAmadeusDate(today) + '/1200'; // Caducidad al mediodía
        
        currentPNR.ticketing = {
          date: formatAmadeusDate(today),
          timeLimit: timeLimit
        };
        
        // Actualizar la referencia global 
        setCurrentPNR(currentPNR);
        
        // Guardar el PNR finalizado en Firestore
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            recordLocator: currentPNR.recordLocator,
            status: currentPNR.status,
            segments: currentPNR.segments,
            ticketing: currentPNR.ticketing,
            updatedAt: serverTimestamp(),
            [`history.${Date.now()}`]: {
              command: cmd,
              result: 'PNR finalized',
              timestamp: new Date().toISOString()
            }
          });
        } else if (userId) {
          // Si el PNR no existe en Firestore, crearlo como finalizado
          const historyEntry = {
            command: cmd,
            result: 'PNR created and finalized',
            timestamp: new Date().toISOString()
          };
          
          const pnrRef = await addDoc(collection(db, 'pnrs'), {
            ...currentPNR,
            userId: userId,
            userEmail: await getUserEmail(userId),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            history: { [Date.now()]: historyEntry }
          });
          
          // Guardar el ID en el PNR actual
          currentPNR.id = pnrRef.id;
          
          // Actualizar la referencia global
          setCurrentPNR(currentPNR);
        }
        
        // Guardar una copia del PNR antes de limpiarlo
        const finalizedPNR = { ...currentPNR };
        
        // Limpiar el PNR actual para comenzar uno nuevo
        clearCurrentPNR();
        
        return `FIN DE TRANSACCION COMPLETADO - ${finalizedPNR.recordLocator}`;
      } catch (error) {
        console.error('Error al finalizar el PNR:', error);
        return `Error al finalizar la transacción: ${error.message}`;
      }
    } else if (cmd === 'ER') {
      // Para ER (End and Retrieve), finalizar y mostrar el PNR completo
      try {
        // Si no tiene un localizador permanente, generarlo ahora
        if (!currentPNR.recordLocator || currentPNR.recordLocator.startsWith('TEMP')) {
          currentPNR.recordLocator = generatePNR();
        }
        
        // Cambiar estado a confirmado y actualizar el estado de los segmentos
        currentPNR.status = 'CONFIRMED';
        
        // Cambiar el estado de los segmentos de DK (solicitud) a HK (confirmado)
        currentPNR.segments = currentPNR.segments.map(segment => ({
          ...segment,
          status: 'HK' // Cambiar a confirmado
        }));
        
        // Añadir fecha de emisión de billete (TK)
        const today = new Date();
        const timeLimit = formatAmadeusDate(today) + '/1200'; // Caducidad al mediodía
        
        currentPNR.ticketing = {
          date: formatAmadeusDate(today),
          timeLimit: timeLimit
        };
        
        // Actualizar la referencia global
        setCurrentPNR(currentPNR);
        
        // Guardar el PNR finalizado en Firestore (igual que en ET)
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            recordLocator: currentPNR.recordLocator,
            status: currentPNR.status,
            segments: currentPNR.segments,
            ticketing: currentPNR.ticketing,
            updatedAt: serverTimestamp(),
            [`history.${Date.now()}`]: {
              command: cmd,
              result: 'PNR finalized',
              timestamp: new Date().toISOString()
            }
          });
        } else if (userId) {
          // Si el PNR no existe en Firestore, crearlo como finalizado
          const historyEntry = {
            command: cmd,
            result: 'PNR created and finalized',
            timestamp: new Date().toISOString()
          };
          
          const pnrRef = await addDoc(collection(db, 'pnrs'), {
            ...currentPNR,
            userId: userId,
            userEmail: await getUserEmail(userId),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            history: { [Date.now()]: historyEntry }
          });
          
          // Guardar el ID en el PNR actual
          currentPNR.id = pnrRef.id;
          
          // Actualizar la referencia global
          setCurrentPNR(currentPNR);
        }
        
        // Formatear y devolver la respuesta completa
        return formatERResponse(currentPNR);
      } catch (error) {
        console.error('Error al procesar ER:', error);
        return `Error al procesar el comando: ${error.message}`;
      }
    }
    
    return `Comando desconocido: ${cmd}`;
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Maneja el comando de cancelación (XI)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleCancelPNR(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que cancelar.";
    }
    
    // Cambiar estado a cancelado
    currentPNR.status = 'CANCELLED';
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el cambio en Firestore
    if (currentPNR.id) {
      await updateDoc(doc(db, 'pnrs', currentPNR.id), {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
        [`history.${Date.now()}`]: {
          command: cmd,
          result: 'PNR cancelled',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Limpiar el PNR actual
    const cancelledPNR = { ...currentPNR };
    clearCurrentPNR();
    
    return `PNR ${cancelledPNR.recordLocator || 'actual'} cancelado.`;
  } catch (error) {
    console.error('Error al procesar el comando XI:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}