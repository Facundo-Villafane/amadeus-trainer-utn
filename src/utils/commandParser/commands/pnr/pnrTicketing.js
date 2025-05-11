// src/utils/commandParser/commands/pnr/pnrTicketing.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR, getUserEmail } from './pnrState';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja el comando de ticketing (TK)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleTicketing(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Parsear el comando TK
    const tkOkPattern = /^TKOK$/i;
    const tkTlPattern = /^TKTL(\d{1,2}[A-Z]{3})\/(\d{2,4})$/i;
    const tkXlPattern = /^TKXL(\d{1,2}[A-Z]{3})\/(\d{2,4})$/i;
    
    let ticketingInfo = {};
    
    if (tkOkPattern.test(cmd)) {
      // TKOK - Emisión inmediata
      ticketingInfo = {
        type: 'OK',
        officeId: 'UTN5168476'
      };
    } else if (tkTlPattern.test(cmd)) {
      // TKTL - Time Limit
      const match = cmd.match(tkTlPattern);
      const [, date, time] = match;
      ticketingInfo = {
        type: 'TL',
        date: date.toUpperCase(),
        time: time,
        officeId: 'UTN5168476'
      };
    } else if (tkXlPattern.test(cmd)) {
      // TKXL - Cancel Limit
      const match = cmd.match(tkXlPattern);
      const [, date, time] = match;
      ticketingInfo = {
        type: 'XL',
        date: date.toUpperCase(),
        time: time,
        officeId: 'UTN5168476'
      };
    } else {
      return "Formato incorrecto. Ejemplos: TKOK, TKTL15NOV/1600, TKXL16NOV/1600";
    }
    
    // Actualizar el PNR con la información de ticketing
    currentPNR.ticketing = ticketingInfo;
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          ticketing: currentPNR.ticketing,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'Ticketing information added',
            timestamp: new Date().toISOString()
          }
        });
      } else if (userId) {
        // Si el PNR no existe en Firestore, crearlo
        const historyEntry = {
          command: cmd,
          result: 'PNR created with ticketing',
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
    } catch (error) {
      console.error('Error al guardar PNR:', error);
      // Continuamos aunque falle el guardado para mostrar respuesta al usuario
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando TK:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}