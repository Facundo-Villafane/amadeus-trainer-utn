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
// Modificación de handleAddName en src/utils/commandParser/commands/pnr/pnrPassengers.js
export async function handleAddName(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Extraer la cantidad del comando NM
    const quantityMatch = cmd.match(/^NM(\d+)/i);
    if (!quantityMatch) {
      return "Formato incorrecto. Ejemplo: NM1GARCIA/JUAN MR";
    }
    const quantity = parseInt(quantityMatch[1], 10);
    
    // Eliminar la parte NM{cantidad} del comando para analizar los pasajeros
    const passengersPart = cmd.substring(quantityMatch[0].length);
    
    // Extraer los pasajeros del comando
    const passengersSegments = passengersPart.split('/');
    
    // El primer segmento contiene apellido y posiblemente parte del nombre del primer pasajero
    const firstSegment = passengersSegments[0];
    // Extraer apellido del primer pasajero (que puede ser usado por otros pasajeros)
    const lastNameMatch = firstSegment.match(/^([A-Z]+)/i);
    if (!lastNameMatch) {
      return "Formato incorrecto. Debe incluir un apellido válido.";
    }
    const defaultLastName = lastNameMatch[1].toUpperCase();
    
    // Inicializar array de pasajeros
    const newPassengers = [];
    let currentLastName = defaultLastName;
    let remainingSegments = [...passengersSegments];
    
    // Procesar cada pasajero
    for (let i = 0; i < quantity; i++) {
      // Para el primer pasajero, el nombre está en el segundo segmento
      if (i === 0) {
        const firstNameAndTitle = remainingSegments[1].trim().split(' ');
        const firstName = firstNameAndTitle[0].toUpperCase();
        const title = firstNameAndTitle.length > 1 ? firstNameAndTitle[1].toUpperCase() : '';
        
        // Verificar si tiene indicación de infante o niño
        let passengerType = 'ADT'; // Adulto por defecto
        let infantData = null;
        
        if (title.includes('(CHD') || title.includes('(INF')) {
          const typeMatch = title.match(/\((CHD|INF)(?:\/([^)]+))?\)/i);
          if (typeMatch) {
            passengerType = typeMatch[1].toUpperCase();
            if (passengerType === 'INF' && typeMatch[2]) {
              // Datos del infante, como INFAPELIIDO/NOMBRE/FECHA
              const infantParts = typeMatch[2].split('/');
              if (infantParts.length >= 2) {
                infantData = {
                  lastName: infantParts[0].toUpperCase(),
                  firstName: infantParts[1].toUpperCase(),
                  dateOfBirth: infantParts[2] || ''
                };
              }
            } else if (passengerType === 'CHD' && typeMatch[2]) {
              // Fecha de nacimiento del niño
              const dateOfBirth = typeMatch[2];
              newPassengers.push({
                lastName: currentLastName,
                firstName,
                title: title.replace(/\(CHD.*\)/i, '').trim(),
                type: passengerType,
                dateOfBirth,
                addedAt: new Date()
              });
              continue;
            }
          }
        }
        
        // Añadir el pasajero
        newPassengers.push({
          lastName: currentLastName,
          firstName,
          title: title.replace(/\((CHD|INF).*\)/i, '').trim(),
          type: passengerType,
          infant: infantData,
          addedAt: new Date()
        });
        
        // Eliminar los segmentos procesados
        remainingSegments = remainingSegments.slice(2);
      } else {
        // Para los siguientes pasajeros
        if (remainingSegments.length === 0) {
          return `Error: Se especificaron ${quantity} pasajeros pero solo se proporcionaron datos para ${i}`;
        }
        
        // Verificar si el segmento contiene un nuevo apellido
        const segmentStart = remainingSegments[0].trim();
        if (segmentStart.match(/^[A-Z]+$/i)) {
          // Es un nuevo apellido
          currentLastName = segmentStart.toUpperCase();
          remainingSegments = remainingSegments.slice(1);
        }
        
        // Verificar que aún quedan segmentos
        if (remainingSegments.length === 0) {
          return `Error: Falta el nombre para el pasajero ${i+1}`;
        }
        
        // Extraer nombre y título
        const firstNameAndTitle = remainingSegments[0].trim().split(' ');
        const firstName = firstNameAndTitle[0].toUpperCase();
        const title = firstNameAndTitle.length > 1 ? firstNameAndTitle[1].toUpperCase() : '';
        
        // Verificar si tiene indicación de infante o niño
        let passengerType = 'ADT'; // Adulto por defecto
        let infantData = null;
        
        if (title.includes('(CHD') || title.includes('(INF')) {
          const typeMatch = title.match(/\((CHD|INF)(?:\/([^)]+))?\)/i);
          if (typeMatch) {
            passengerType = typeMatch[1].toUpperCase();
            if (passengerType === 'INF' && typeMatch[2]) {
              // Datos del infante
              const infantParts = typeMatch[2].split('/');
              if (infantParts.length >= 2) {
                infantData = {
                  lastName: infantParts[0].toUpperCase(),
                  firstName: infantParts[1].toUpperCase(),
                  dateOfBirth: infantParts[2] || ''
                };
              }
            } else if (passengerType === 'CHD' && typeMatch[2]) {
              // Fecha de nacimiento del niño
              const dateOfBirth = typeMatch[2];
              newPassengers.push({
                lastName: currentLastName,
                firstName,
                title: title.replace(/\(CHD.*\)/i, '').trim(),
                type: passengerType,
                dateOfBirth,
                addedAt: new Date()
              });
              remainingSegments = remainingSegments.slice(1);
              continue;
            }
          }
        }
        
        // Añadir el pasajero
        newPassengers.push({
          lastName: currentLastName,
          firstName,
          title: title.replace(/\((CHD|INF).*\)/i, '').trim(),
          type: passengerType,
          infant: infantData,
          addedAt: new Date()
        });
        
        // Eliminar el segmento procesado
        remainingSegments = remainingSegments.slice(1);
      }
    }
    
    // Verificar límite de pasajeros basado en asientos reservados
    const totalSeatsBooked = currentPNR.segments.reduce((total, segment) => {
      return total + (segment.quantity || 0);
    }, 0);
    
    // Calcular cuántos pasajeros ya hay en el PNR
    const currentPassengerCount = currentPNR.passengers ? currentPNR.passengers.length : 0;
    
    // Verificar si estamos intentando agregar más pasajeros de los que hay asientos
    if (currentPassengerCount + newPassengers.length > totalSeatsBooked) {
      return `Error: Está intentando agregar ${newPassengers.length} pasajero(s), pero solo tiene ${totalSeatsBooked} asiento(s) reservado(s). ` +
             `Ya hay ${currentPassengerCount} pasajero(s) en el PNR.`;
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
            result: `${newPassengers.length} passenger(s) added`,
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
          result: `PNR created with ${newPassengers.length} passenger(s)`,
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