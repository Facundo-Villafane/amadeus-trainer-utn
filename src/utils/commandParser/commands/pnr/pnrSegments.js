// src/utils/commandParser/commands/pnr/pnrSegments.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import paginationState from '../../paginationState';
import { getCurrentPNR, setCurrentPNR, getUserEmail } from './pnrState';
import { getDayOfWeek } from './dateUtils';
import { formatPNRResponse } from './pnrUtils';

/**
 * Maneja el comando de venta de segmentos (SS)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleSellSegment(cmd, userId) {
  try {
    // Formato esperado: SS[CANTIDAD][CLASE][LÍNEA]
    const regex = /SS(\d+)([A-Z])(\d+)/;
    const match = cmd.match(regex);
    
    if (!match) {
      return "Formato incorrecto. Ejemplo: SS1Y1";
    }
    
    const [, quantity, classCode, lineNumber] = match;
    const lineNum = parseInt(lineNumber, 10);
    const qty = parseInt(quantity, 10);
    
    // Verificar que hayan seleccionado un resultado previo
    if (!paginationState || !paginationState.currentResults || paginationState.currentResults.length === 0) {
      return "Debe realizar una búsqueda de vuelos (AN, SN o TN) antes de seleccionar asientos.";
    }
    
    // Verificar que el número de línea sea válido
    if (lineNum <= 0 || lineNum > paginationState.currentResults.length) {
      return `Número de línea inválido. Debe estar entre 1 y ${paginationState.currentResults.length}.`;
    }
    
    // Obtener el vuelo seleccionado (restando 1 porque los arrays comienzan en 0)
    const selectedFlight = paginationState.currentResults[lineNum - 1];
    
    // Verificar que la clase exista y tenga disponibilidad
    if (!selectedFlight.class_availability || 
        !selectedFlight.class_availability[classCode] || 
        selectedFlight.class_availability[classCode] <= 0) {
      return `La clase ${classCode} no está disponible en el vuelo seleccionado.`;
    }
    
    // Verificar que la cantidad solicitada no exceda la disponibilidad
    if (qty > selectedFlight.class_availability[classCode]) {
      return `Solo hay ${selectedFlight.class_availability[classCode]} asientos disponibles en clase ${classCode}.`;
    }
    
    // Obtener el PNR actual o crear uno nuevo
    let currentPNR = getCurrentPNR();
    
    // Si no hay un PNR actual, crear uno nuevo
    if (!currentPNR) {
      // Generar un localizador temporal
      const tempLocator = `TEMP${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Crear el PNR con un localizador temporal
      currentPNR = {
        recordLocator: tempLocator,
        userId: userId,
        status: 'IN_PROGRESS',
        segments: [],
        createdAt: new Date()
      };
      
      // Actualizar la referencia global
      setCurrentPNR(currentPNR);
    }
    
    // Usar la fecha del comando original si está disponible
    const departureDate = paginationState.dateStr || selectedFlight.departure_date;
    
    // Obtener el día de la semana
    const dayOfWeek = getDayOfWeek(departureDate);
    
    // Crear el nuevo segmento
    const newSegment = {
      airline_code: selectedFlight.airline_code,
      flight_number: selectedFlight.flight_number,
      class: classCode,
      origin: selectedFlight.departure_airport_code,
      destination: selectedFlight.arrival_airport_code,
      departureDate: departureDate,
      dayOfWeek: dayOfWeek,
      departureTime: selectedFlight.departure_time,
      arrivalTime: selectedFlight.arrival_time,
      equipment: selectedFlight.equipment_code || '---',
      status: 'DK', // DK = solicitado, no confirmado aún
      quantity: qty,
      selected_at: new Date()
    };
    
    // Añadir el segmento al PNR
    currentPNR.segments = [...(currentPNR.segments || []), newSegment];
    
    // Actualizar la referencia global
    setCurrentPNR(currentPNR);
    
    // Intentar guardar el PNR en Firestore si el usuario está autenticado
    if (userId) {
      try {
        // Si ya existe un PNR en Firestore, actualizarlo
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            segments: currentPNR.segments,
            updatedAt: serverTimestamp(),
            // Usar un objeto para el historial en lugar de un array
            [`history.${Date.now()}`]: {
              command: cmd,
              result: `Added segment ${selectedFlight.airline_code} ${selectedFlight.flight_number} in class ${classCode}`,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          // Si no existe, crear uno nuevo
          const historyEntry = {
            command: cmd,
            result: `Created PNR with segment ${selectedFlight.airline_code} ${selectedFlight.flight_number} in class ${classCode}`,
            timestamp: new Date().toISOString()
          };
          
          const newPNRRef = await addDoc(collection(db, 'pnrs'), {
            recordLocator: currentPNR.recordLocator,
            userId: userId,
            userEmail: await getUserEmail(userId),
            status: 'IN_PROGRESS',
            segments: currentPNR.segments,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Usar un objeto para el historial en lugar de un array
            history: { [Date.now()]: historyEntry }
          });
          
          // Guardar el ID en el PNR actual
          currentPNR.id = newPNRRef.id;
          
          // Actualizar la referencia global
          setCurrentPNR(currentPNR);
        }
      } catch (error) {
        console.error('Error al guardar PNR en Firestore:', error);
        // Continuamos aunque falle el guardado para mostrar respuesta al usuario
      }
    }
    
    // Formatear y devolver la respuesta
    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar el comando SS:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}