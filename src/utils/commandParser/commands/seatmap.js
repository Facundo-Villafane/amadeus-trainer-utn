// src/utils/commandParser/commands/seatmap.js

import {updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnr/pnrState';
import { formatPNRResponse } from './pnr/pnrUtils';

// Variable global para almacenar el PNR y segmento seleccionados para el SM
export let currentSeatmapRequest = {
  pnr: null,
  segmentIndex: null,
  showModal: false
};

// Función para abrir la modal de selección de asientos
export function openSeatmapModal(pnr, segmentIndex) {
  currentSeatmapRequest = {
    pnr,
    segmentIndex,
    showModal: true
  };
  
  return true; // Indica que se debe abrir el modal
}

// Función para manejar el comando de seatmap (SM)
export async function handleSeatmapCommand(cmd) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
    }
    
    // Verificar que haya al menos un segmento en el PNR
    if (!currentPNR.segments || currentPNR.segments.length === 0) {
      return "El PNR no contiene segmentos de vuelo.";
    }
    
    // Verificar que haya al menos un pasajero en el PNR
    if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
      return "Debe agregar al menos un pasajero (NM) antes de seleccionar asientos.";
    }
    
    // Formato: SM o SM[NÚMERO_SEGMENTO]
    const segmentMatch = cmd.match(/^SM(\d+)?$/i);
    
    let segmentIndex = 0; // Por defecto, usar el primer segmento
    
    if (segmentMatch && segmentMatch[1]) {
      segmentIndex = parseInt(segmentMatch[1], 10) - 1; // Ajustar a base 0
      
      if (segmentIndex < 0 || segmentIndex >= currentPNR.segments.length) {
        return `Número de segmento inválido. El PNR tiene ${currentPNR.segments.length} segmento(s).`;
      }
    }
    
    // Abrir la modal para selección de asientos
    const shouldOpenModal = openSeatmapModal(currentPNR, segmentIndex);
    
    if (shouldOpenModal) {
      // Este es un caso especial donde se abrirá un modal en la interfaz de usuario
      // La respuesta real se muestra solo en el modal, aquí devolvemos un mensaje informativo
      return "Cargando mapa de asientos...";
    } else {
      return "Error al cargar el mapa de asientos.";
    }
  } catch (error) {
    console.error('Error al procesar el comando SM:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Método alternativo: comando para asignar asiento directamente (ST)
// eslint-disable-next-line no-unused-vars
export async function handleAssignSeatCommand(cmd, userId) {
    try {
        // Verificar si hay un PNR en progreso
        const currentPNR = getCurrentPNR();
        if (!currentPNR) {
            return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
        }
    
        // Verificar que haya al menos un segmento y un pasajero
        if (!currentPNR.segments || currentPNR.segments.length === 0) {
            return "El PNR no contiene segmentos de vuelo.";
        }
    
        if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
            return "Debe agregar al menos un pasajero (NM) antes de seleccionar asientos.";
        }
    
        // Formato correcto: ST/[ASIENTO]/P[PASAJERO]/S[SEGMENTO]
        // Ejemplo: ST/24L/P2/S1 (Asiento 24L, Pasajero 2, Segmento 1)
        const seatPattern = /^ST\/([A-Z0-9]+)\/P(\d+)\/S(\d+)$/i;
        const match = cmd.match(seatPattern);
    
        if (!match) {
            return "Formato incorrecto. Ejemplo: ST/24L/P2/S1 (Asiento 24L, Pasajero 2, Segmento 1)";
        }
    
        const [, seat, passengerStr, segmentStr] = match;
        const segmentIndex = parseInt(segmentStr, 10) - 1; // Ajustar a base 0
        const passengerIndex = parseInt(passengerStr, 10) - 1; // Ajustar a base 0
    
        // Validar índices
        if (segmentIndex < 0 || segmentIndex >= currentPNR.segments.length) {
            return `Número de segmento inválido. El PNR tiene ${currentPNR.segments.length} segmento(s).`;
        }
    
        if (passengerIndex < 0 || passengerIndex >= currentPNR.passengers.length) {
            return `Número de pasajero inválido. El PNR tiene ${currentPNR.passengers.length} pasajero(s).`;
        }
    
        // Obtener el segmento seleccionado y validar
        const segment = currentPNR.segments[segmentIndex];
        const segmentNumber = segmentIndex + 1; // Índice real en el PNR (base 1)
    
        // Validar formato del asiento (más flexible para incluir letras y números, como 24L)
        if (!/^[1-9]\d*[A-Z]$/i.test(seat)) {
            return "Formato de asiento incorrecto. Debe ser un número seguido de una letra (ej: 24L, 15C).";
        }
    
        // Crear o actualizar el SSR RQST en el PNR
        if (!currentPNR.ssrElements) {
            currentPNR.ssrElements = [];
        }
    
        // Verificar si ya existe un SSR RQST para este segmento
        const existingRqstIndex = currentPNR.ssrElements.findIndex(ssr =>
            ssr.code === 'RQST' && ssr.segmentIndex === segmentIndex
        );
    
        const routeCode = `${segment.origin}${segment.destination}`;
        const passengerNumber = passengerIndex + 1; // Número de pasajero (base 1)
    
        if (existingRqstIndex >= 0) {
            // Actualizar SSR existente
            const existingRqst = currentPNR.ssrElements[existingRqstIndex];
      
            // Verificar si el pasajero ya tiene un asiento asignado
            const seatInfo = existingRqst.seatInfo || {};
            seatInfo[`P${passengerNumber}`] = seat;
      
            // Actualizar el mensaje del SSR
            const seatAssignments = Object.entries(seatInfo)
                .map(([passenger, seatNumber]) => `${seatNumber},${passenger}`)
                .join('/');
      
            existingRqst.message = `${routeCode}/${seatAssignments}`;
            existingRqst.seatInfo = seatInfo;
      
            currentPNR.ssrElements[existingRqstIndex] = existingRqst;
        } else {
            // Crear nuevo SSR RQST
            const seatInfo = { [`P${passengerNumber}`]: seat };
            const seatAssignment = `${seat},P${passengerNumber}`;
      
            const newSsrElement = {
                type: 'SSR',
                code: 'RQST',
                airlineCode: segment.airline_code,
                status: 'HK1',
                message: `${routeCode}/${seatAssignment}`,
                segmentNumber: segmentNumber,
                segmentIndex: segmentIndex,
                seatInfo: seatInfo,
                addedAt: new Date()
            };
      
            currentPNR.ssrElements.push(newSsrElement);
        }
        
        // Actualizar la referencia global
        setCurrentPNR(currentPNR);
        
        // Guardar el PNR actualizado en Firestore si existe
        if (currentPNR.id) {
            try {
                await updateDoc(doc(db, 'pnrs', currentPNR.id), {
                    ssrElements: currentPNR.ssrElements,
                    updatedAt: serverTimestamp(),
                    [`history.${Date.now()}`]: {
                        command: cmd,
                        result: `Asiento ${seat} asignado al pasajero ${passengerNumber} en el segmento ${segmentNumber}`,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Error al guardar PNR:', error);
                // Continuamos aunque falle el guardado para mostrar respuesta al usuario
            }
        }
        
        // Formatear y devolver la respuesta
        return formatPNRResponse(currentPNR);
        
    } catch (error) {
        console.error('Error al procesar el comando ST:', error);
        return `Error al procesar el comando: ${error.message}`;
    }
}