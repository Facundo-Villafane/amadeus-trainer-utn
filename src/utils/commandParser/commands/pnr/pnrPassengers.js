// src/utils/commandParser/commands/pnr/pnrPassengers.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR, getUserEmail } from './pnrState';
import { formatPNRResponse } from './pnrUtils';
import { createInfantSSR } from './pnrSupplementary';

/**
 * Maneja la adición de nombres (NM)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleAddName(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Analizar el comando NM
    // Formato básico: NM1APELLIDO/NOMBRE
    // Formato con título: NM1APELLIDO/NOMBRE
    // Formato con niño: NM1APELLIDO/NOMBRE(CHD/01JAN15)
    // Formato con infante: NM1APELLIDO/NOMBRE(INFGARCIA/LUIS/01JAN20)
    
    const namePattern = /NM(\d+)([A-Z]+)\/([A-Z\s]+)(?:\s+([A-Z]+))?(?:\((CHD|INF)(?:\/([^)]+))?\))?/i;
    const match = cmd.match(namePattern);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: NM1GARCIA/JUAN";
    }
    
    const [, quantityStr, lastName, firstName, title, passengerType, additionalInfo] = match;
    const quantity = parseInt(quantityStr, 10);
    
    // Verificar límite de pasajeros basado en asientos reservados
    const totalSeatsBooked = currentPNR.segments.reduce((total, segment) => {
      return total + (segment.quantity || 0);
    }, 0);
    
    // Calcular cuántos pasajeros ya hay en el PNR
    const currentPassengerCount = currentPNR.passengers ? currentPNR.passengers.length : 0;
    
    // Verificar si estamos intentando agregar más pasajeros de los que hay asientos
    if (currentPassengerCount + quantity > totalSeatsBooked) {
      return `Error: Está intentando agregar ${quantity} pasajero(s), pero solo tiene ${totalSeatsBooked} asiento(s) reservado(s). ` +
             `Ya hay ${currentPassengerCount} pasajero(s) en el PNR.`;
    }
    
    // Crear objetos de pasajero
    const newPassengers = [];
    for (let i = 0; i < quantity; i++) {
      const passenger = {
        lastName: lastName.toUpperCase(),
        firstName: firstName.trim().toUpperCase(),
        title: (title || '').toUpperCase(),
        type: passengerType ? passengerType.toUpperCase() : 'ADT', // Por defecto adulto
        addedAt: new Date()
      };
      
      // Si es un infante, procesar información adicional
      if (passengerType === 'INF' && additionalInfo) {
        const [infLastName, infFirstName, infDob] = additionalInfo.split('/');
        passenger.infant = {
          lastName: infLastName ? infLastName.toUpperCase() : lastName.toUpperCase(),
          firstName: infFirstName ? infFirstName.toUpperCase() : 'INFANT',
          dateOfBirth: infDob
        };
      }
      
      // Si es un niño, procesar fecha de nacimiento
      if (passengerType === 'CHD' && additionalInfo) {
        passenger.dateOfBirth = additionalInfo;
      }
      
      newPassengers.push(passenger);
    }
    
    // Combinar los pasajeros existentes con los nuevos
    const allPassengers = [...(currentPNR.passengers || []), ...newPassengers];
    
    // Ordenar TODOS los pasajeros alfabéticamente por apellido y luego por nombre
    allPassengers.sort((a, b) => {
      // Primero comparar apellidos
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      // Si los apellidos son iguales, comparar nombres
      return a.firstName.localeCompare(b.firstName);
    });
    
    // Actualizar la lista de pasajeros ordenada
    currentPNR.passengers = allPassengers;
    
    // Si hay infantes, crear automáticamente los elementos SSR INFT
    for (let i = 0; i < newPassengers.length; i++) {
      if (newPassengers[i].type === 'INF' && newPassengers[i].infant) {
        // Encontrar el índice del pasajero en la lista ordenada
        const passengerIndex = currentPNR.passengers.findIndex(p => 
          p.lastName === newPassengers[i].lastName && 
          p.firstName === newPassengers[i].firstName
        ) + 1; // +1 porque los índices en el PNR comienzan en 1
        
        // Crear el SSR INFT
        const updatedPNR = createInfantSSR(currentPNR, passengerIndex, newPassengers[i].infant);
        // Actualizar currentPNR con el PNR actualizado que incluye los SSR INFT
        Object.assign(currentPNR, updatedPNR);
      }
    }
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        const updateData = {
          passengers: currentPNR.passengers,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: cmd,
            result: `${quantity} passenger(s) added`,
            timestamp: new Date().toISOString()
          }
        };
        
        // Si se agregaron SSRs para infantes, incluirlos en la actualización
        if (currentPNR.ssrElements) {
          updateData.ssrElements = currentPNR.ssrElements;
        }
        
        await updateDoc(doc(db, 'pnrs', currentPNR.id), updateData);
      } else if (userId) {
        // Si el PNR no existe en Firestore, crearlo
        const historyEntry = {
          command: cmd,
          result: `PNR created with ${quantity} passenger(s)`,
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
    console.error('Error al procesar el comando NM:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}