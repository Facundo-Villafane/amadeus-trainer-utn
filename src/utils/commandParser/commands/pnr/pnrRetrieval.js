// src/utils/commandParser/commands/pnr/pnrRetrieval.js
// eslint-disable-next-line no-unused-vars
import { collection, query, where, getDocs, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { setCurrentPNR } from './pnrState';
import { formatRTResponse } from './pnrUtils';

/**
 * Maneja la recuperación de PNR (RT)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
// eslint-disable-next-line no-unused-vars
export async function handleRetrievePNR(cmd, userId) {
  try {
    // Formato: RT[CODIGO]
    const pnrCode = cmd.slice(2).trim().toUpperCase();
    
    if (!pnrCode) {
      return "Formato incorrecto. Ejemplo: RTABCDEF";
    }
    
    // Buscar el PNR en Firestore
    const q = query(
      collection(db, 'pnrs'),
      where('recordLocator', '==', pnrCode),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return `No se encontró el PNR con código ${pnrCode}`;
    }
    
    // Obtener el PNR
    const pnrDoc = querySnapshot.docs[0];
    const pnrData = {
      id: pnrDoc.id,
      ...pnrDoc.data()
    };
    
    // Establecer como PNR actual para trabajar con él
    setCurrentPNR(pnrData);
    
    // Registrar esta recuperación en el historial del PNR
    try {
      await updateDoc(doc(db, 'pnrs', pnrData.id), {
        [`history.${Date.now()}`]: {
          command: cmd,
          result: 'PNR retrieved',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error al actualizar historial del PNR:', error);
      // Continuamos aunque falle
    }
    
    // Formatear y devolver la respuesta
    return formatRTResponse(pnrData);
  } catch (error) {
    console.error('Error al procesar el comando RT:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}