// src/utils/commandParser/commands/pnr/pnrRemarks.js

import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnrState';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja el comando de comentarios generales (RM)
 * @param {string} cmd - Comando ingresado por el usuario (RM + texto)
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
// eslint-disable-next-line no-unused-vars
export async function handleGeneralRemark(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe crear un PNR.";
    }
    
    // Extraer el texto del comentario (todo después de "RM ")
    // Asegurarnos de mantener exactamente el formato ingresado por el usuario
    const remarkText = cmd.substring(2).trim(); // RM tiene 2 caracteres
    
    if (!remarkText) {
      return "Formato incorrecto. Ejemplo: RM TEXTO DEL COMENTARIO";
    }
    
    // Crear el objeto de comentario
    const remark = {
      type: 'RM', // Tipo de comentario (General)
      text: remarkText,
      addedAt: new Date()
    };
    
    // Agregar el comentario al PNR
    if (!currentPNR.remarks) {
      currentPNR.remarks = [];
    }
    
    currentPNR.remarks.push(remark);
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar en Firestore si existe el PNR
    if (currentPNR.id) {
      try {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          remarks: currentPNR.remarks,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'General remark added',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error al guardar el comentario en Firestore:', error);
      }
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando RM:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Maneja el comando de comentarios confidenciales (RC)
 * @param {string} cmd - Comando ingresado por el usuario (RC + texto)
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleConfidentialRemark(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe crear un PNR.";
    }
    
    // Extraer el texto del comentario (todo después de "RC ")
    const remarkText = cmd.substring(2).trim(); // RC tiene 2 caracteres
    
    if (!remarkText) {
      return "Formato incorrecto. Ejemplo: RC TEXTO DEL COMENTARIO CONFIDENCIAL";
    }
    
    // Crear el objeto de comentario confidencial
    const remark = {
      type: 'RC', // Tipo de comentario (Confidencial)
      text: remarkText,
      addedBy: userId, // Registrar quién agregó el comentario
      addedAt: new Date()
    };
    
    // Agregar el comentario al PNR
    if (!currentPNR.confidentialRemarks) {
      currentPNR.confidentialRemarks = [];
    }
    
    currentPNR.confidentialRemarks.push(remark);
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar en Firestore si existe el PNR
    if (currentPNR.id) {
      try {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          confidentialRemarks: currentPNR.confidentialRemarks,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'Confidential remark added',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error al guardar el comentario confidencial en Firestore:', error);
      }
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando RC:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Maneja el comando de comentarios para el itinerario (RIR)
 * @param {string} cmd - Comando ingresado por el usuario (RIR + texto)
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
// eslint-disable-next-line no-unused-vars
export async function handleItineraryRemark(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe crear un PNR.";
    }
    
    // Extraer el texto del comentario (todo después de "RIR ")
    const remarkText = cmd.substring(3).trim(); // RIR tiene 3 caracteres
    
    if (!remarkText) {
      return "Formato incorrecto. Ejemplo: RIR TEXTO PARA EL ITINERARIO";
    }
    
    // Crear el objeto de comentario para itinerario
    const remark = {
      type: 'RIR', // Tipo de comentario (Itinerario)
      text: remarkText,
      addedAt: new Date()
    };
    
    // Agregar el comentario al PNR
    if (!currentPNR.itineraryRemarks) {
      currentPNR.itineraryRemarks = [];
    }
    
    currentPNR.itineraryRemarks.push(remark);
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar en Firestore si existe el PNR
    if (currentPNR.id) {
      try {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          itineraryRemarks: currentPNR.itineraryRemarks,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'Itinerary remark added',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error al guardar el comentario de itinerario en Firestore:', error);
      }
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando RIR:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}