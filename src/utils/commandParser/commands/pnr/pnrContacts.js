// src/utils/commandParser/commands/pnr/pnrContacts.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR, getUserEmail } from './pnrState';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja la adición de contactos (AP)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleAddContact(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Analizar el comando AP
    // Formato: AP CIUDAD TELEFONO-TIPO
    const contactPattern = /AP\s+([A-Z]{3})\s+([0-9\-]+)(?:-([A-Z]))?/i;
    const match = cmd.match(contactPattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: AP BUE 12345678-M";
    }
    
    const [, city, phone, type = 'H'] = match; // H (Home) por defecto
    
    // Crear objeto de contacto
    const contact = {
      city: city.toUpperCase(),
      phone: phone,
      type: type.toUpperCase(),
      addedAt: new Date()
    };
    
    // Añadir el contacto al PNR (reemplazar cualquier contacto existente por simplicidad)
    currentPNR.contacts = [contact]; // Por simplicidad, solo un contacto
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          contacts: currentPNR.contacts,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'Contact added',
            timestamp: new Date().toISOString()
          }
        });
      } else if (userId) {
        // Si el PNR no existe en Firestore, crearlo
        const historyEntry = {
          command: cmd,
          result: 'PNR created with contact',
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
    console.error('Error al procesar el comando AP:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Maneja el comando Received From (RF)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleReceivedFrom(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Formato: RF NOMBRE
    const rfPattern = /RF\s+(.+)/i;
    const match = cmd.match(rfPattern);
    
    let receivedFrom = 'UNKNOWN';
    if (match && match[1]) {
      receivedFrom = match[1].trim().toUpperCase();
    }
    
    // Agregar el campo receivedFrom al PNR
    currentPNR.receivedFrom = receivedFrom;
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          receivedFrom,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: 'Received From added',
            timestamp: new Date().toISOString()
          }
        });
      } else if (userId) {
        // Si el PNR no existe en Firestore, crearlo
        const historyEntry = {
          command: cmd,
          result: 'PNR created with Received From',
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
    }
    
    return "Received From entrada guardada.";
  } catch (error) {
    console.error('Error al procesar el comando RF:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}