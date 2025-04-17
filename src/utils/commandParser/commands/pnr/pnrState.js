// src/utils/commandParser/commands/pnr/pnrState.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../services/firebase';

// Variable global para almacenar el PNR actual en memoria
let currentPNR = null;

/**
 * Establece el PNR actual
 * @param {Object} pnr - Objeto PNR
 */
export function setCurrentPNR(pnr) {
  currentPNR = pnr;
}

/**
 * Limpia el PNR actual
 */
export function clearCurrentPNR() {
  currentPNR = null;
}

/**
 * Obtiene el PNR actual
 * @returns {Object|null} El PNR actual o null si no hay ninguno
 */
export function getCurrentPNR() {
  return currentPNR;
}

/**
 * Obtiene el email de un usuario a partir de su ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} Email del usuario o dirección por defecto si no se encuentra
 */
export async function getUserEmail(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().email || 'unknown@email.com';
    }
    return 'unknown@email.com';
  } catch (error) {
    console.error('Error al obtener email de usuario:', error);
    return 'unknown@email.com';
  }
}

/**
 * Valida que un PNR tenga todos los elementos obligatorios
 * @param {Object} pnr - El PNR a validar
 * @returns {Array} Lista de errores encontrados
 */
export function validatePNR(pnr) {
  const errors = [];
  
  // 1. Debe tener al menos un segmento
  if (!pnr.segments || pnr.segments.length === 0) {
    errors.push("No hay segmentos añadidos. Use SS para añadir un vuelo.");
  }
  
  // 2. Debe tener al menos un pasajero
  if (!pnr.passengers || pnr.passengers.length === 0) {
    errors.push("No hay pasajeros añadidos. Use NM para añadir un pasajero.");
  }
  
  // 3. Debe tener al menos un contacto
  if (!pnr.contacts || pnr.contacts.length === 0) {
    errors.push("No hay información de contacto. Use AP para añadir un teléfono.");
  }
  
  // 4. Debe tener Received From (RF)
  if (!pnr.receivedFrom) {
    errors.push("Falta la información de 'Received From'. Use RF para añadirla.");
  }
  
  return errors;
}