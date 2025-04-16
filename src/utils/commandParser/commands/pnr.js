// En utils/commandParser/commands/pnr.js - Añadir a lo anterior

import { generatePNR } from '../../pnrGenerator';
import { 
  collection, addDoc, getDocs, query, where, limit, 
  updateDoc, doc, getDoc, serverTimestamp, arrayUnion 
} from 'firebase/firestore';
import { db } from '../../../services/firebase';

// Función corregida para ordenar todos los pasajeros alfabéticamente
export async function handleAddName(cmd, userId) {
    try {
      // Verificar si hay un PNR en progreso
      if (!currentPNR) {
        return "No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.";
      }
      
      // Analizar el comando NM
      // Formato básico: NM1APELLIDO/NOMBRE
      // Formato con título: NM1APELLIDO/NOMBRE MR
      // Formato con niño: NM1APELLIDO/NOMBRE(CHD/01JAN15)
      // Formato con infante: NM1APELLIDO/NOMBRE(INFGARCIA/LUIS/01JAN20)
      
      const namePattern = /NM(\d+)([A-Z]+)\/([A-Z\s]+)(?:\s+([A-Z]+))?(?:\((CHD|INF)(?:\/([^)]+))?\))?/i;
      const match = cmd.match(namePattern);
      
      if (!match) {
        return "Formato incorrecto. Ejemplo: NM1GARCIA/JUAN MR";
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
          title: (title || 'MR').toUpperCase(),
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
      
      // Guardar el PNR actualizado en Firestore
      try {
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            passengers: currentPNR.passengers,
            updatedAt: serverTimestamp(),
            history: arrayUnion({
              command: cmd,
              result: `${quantity} passenger(s) added`,
              timestamp: serverTimestamp()
            })
          });
        } else {
          // Si el PNR no existe en Firestore, crearlo
          const pnrRef = await addDoc(collection(db, 'pnrs'), {
            ...currentPNR,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            history: [{
              command: cmd,
              result: `PNR created with ${quantity} passenger(s)`,
              timestamp: serverTimestamp()
            }]
          });
          currentPNR.id = pnrRef.id;
        }
      } catch (error) {
        console.error('Error al guardar PNR:', error);
        // Continuamos aunque falle el guardado para mostrar respuesta al usuario
      }
      
      // Formatear la respuesta
      let response = `\nRP/UTN5168476/\n`;
      
      // Mostrar pasajeros
      currentPNR.passengers.forEach((passenger, index) => {
        response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}`;
        if (passenger.type === 'CHD') {
          response += `(CHD/${passenger.dateOfBirth || ''})`;
        } else if (passenger.type === 'INF' && passenger.infant) {
          response += `(INF${passenger.infant.lastName}/${passenger.infant.firstName}/${passenger.infant.dateOfBirth || ''})`;
        }
        response += `\n`;
      });
      
      // Mostrar segmentos
      currentPNR.segments.forEach((segment, index) => {
        response += `${index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
        response += `${segment.departureDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
        response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
        response += `${segment.departureDate} E ${segment.equipment}\n`;
      });
      
      // Mostrar contactos si hay
      if (currentPNR.contacts && currentPNR.contacts.length > 0) {
        currentPNR.contacts.forEach((contact, index) => {
          const elementNumber = currentPNR.passengers.length + index + 1;
          response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
        });
      }
      
      response += `*TRN*\n>`;
      
      return response;
    } catch (error) {
      console.error('Error al procesar el comando NM:', error);
      return `Error al procesar el comando: ${error.message}`;
    }
  }

// Función para manejar la adición de contactos (AP)
export async function handleAddContact(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
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
    
    // Guardar el PNR actualizado en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          contacts: currentPNR.contacts,
          updatedAt: serverTimestamp(),
          history: arrayUnion({
            command: cmd,
            result: 'Contact added',
            timestamp: serverTimestamp()
          })
        });
      } else {
        // Si el PNR no existe en Firestore, crearlo
        const pnrRef = await addDoc(collection(db, 'pnrs'), {
          ...currentPNR,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          history: [{
            command: cmd,
            result: 'PNR created with contact',
            timestamp: serverTimestamp()
          }]
        });
        currentPNR.id = pnrRef.id;
      }
    } catch (error) {
      console.error('Error al guardar PNR:', error);
      // Continuamos aunque falle el guardado para mostrar respuesta al usuario
    }
    
    // Formatear la respuesta
    let response = `\nRP/UTN5168476/\n`;
    
    // Mostrar pasajeros
    if (currentPNR.passengers && currentPNR.passengers.length > 0) {
      currentPNR.passengers.forEach((passenger, index) => {
        response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}\n`;
      });
    }
    
    // Mostrar segmentos
    currentPNR.segments.forEach((segment, index) => {
      response += `${index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
      response += `${segment.departureDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
      response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
      response += `${segment.departureDate} E ${segment.equipment}\n`;
    });
    
    // Mostrar contactos
    currentPNR.contacts.forEach((contact, index) => {
      const elementNumber = (currentPNR.passengers?.length || 0) + index + 1;
      response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
    });
    
    response += `*TRN*\n>`;
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando AP:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar Received From (RF)
export async function handleReceivedFrom(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
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
    
    // Guardar en Firestore
    try {
      if (currentPNR.id) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          receivedFrom,
          updatedAt: serverTimestamp(),
          history: arrayUnion({
            command: cmd,
            result: 'Received From added',
            timestamp: serverTimestamp()
          })
        });
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

// Función para manejar el fin de transacción (ET/ER)
export async function handleEndTransaction(cmd, userId) {
    try {
      // Verificar si hay un PNR en progreso
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
          const day = String(today.getDate()).padStart(2, '0');
          const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const month = months[today.getMonth()];
          
          currentPNR.ticketing = {
            date: `${day}${month}`,
            timeLimit: `${day}${month}/1200` // Por defecto, caducidad al mediodía
          };
          
          // Guardar el PNR finalizado en Firestore
          if (currentPNR.id) {
            await updateDoc(doc(db, 'pnrs', currentPNR.id), {
              recordLocator: currentPNR.recordLocator,
              status: currentPNR.status,
              segments: currentPNR.segments,
              ticketing: currentPNR.ticketing,
              updatedAt: serverTimestamp(),
              history: arrayUnion({
                command: cmd,
                result: 'PNR finalized',
                timestamp: serverTimestamp()
              })
            });
          } else {
            // Si el PNR no existe en Firestore, crearlo como finalizado
            const pnrRef = await addDoc(collection(db, 'pnrs'), {
              ...currentPNR,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              history: [{
                command: cmd,
                result: 'PNR created and finalized',
                timestamp: serverTimestamp()
              }]
            });
            currentPNR.id = pnrRef.id;
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
          const day = String(today.getDate()).padStart(2, '0');
          const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const month = months[today.getMonth()];
          
          currentPNR.ticketing = {
            date: `${day}${month}`,
            timeLimit: `${day}${month}/1200` // Por defecto, caducidad al mediodía
          };
          
          // Guardar el PNR finalizado en Firestore (igual que en ET)
          if (currentPNR.id) {
            await updateDoc(doc(db, 'pnrs', currentPNR.id), {
              recordLocator: currentPNR.recordLocator,
              status: currentPNR.status,
              segments: currentPNR.segments,
              ticketing: currentPNR.ticketing,
              updatedAt: serverTimestamp(),
              history: arrayUnion({
                command: cmd,
                result: 'PNR finalized',
                timestamp: serverTimestamp()
              })
            });
          } else {
            // Si el PNR no existe en Firestore, crearlo como finalizado
            const pnrRef = await addDoc(collection(db, 'pnrs'), {
              ...currentPNR,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              history: [{
                command: cmd,
                result: 'PNR created and finalized',
                timestamp: serverTimestamp()
              }]
            });
            currentPNR.id = pnrRef.id;
          }
          
          // Formatear la respuesta para mostrar el PNR completo
          let response = `\n---RLR---\n`;
          response += `RP/UTN5168476/AGENTE FF/WE ${currentPNR.ticketing.date}/1200Z ${currentPNR.recordLocator}\n`;
          
          // Mostrar pasajeros
          if (currentPNR.passengers && currentPNR.passengers.length > 0) {
            currentPNR.passengers.forEach((passenger, index) => {
              response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}\n`;
            });
          }
          
          // Mostrar segmentos
          currentPNR.segments.forEach((segment, index) => {
            response += `${index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
            response += `${segment.departureDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
            response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
            response += `${segment.departureDate} E ${segment.equipment}\n`;
          });
          
          // Mostrar contactos
          if (currentPNR.contacts && currentPNR.contacts.length > 0) {
            currentPNR.contacts.forEach((contact, index) => {
              const elementNumber = (currentPNR.passengers?.length || 0) + index + 1;
              response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
            });
          }
          
          // Mostrar límite de tiempo para emisión de billete
          const tkNumber = (currentPNR.passengers?.length || 0) + (currentPNR.contacts?.length || 0) + 1;
          response += `${tkNumber} TK TL${currentPNR.ticketing.timeLimit}\n`;
          
          // Mostrar Received From
          if (currentPNR.receivedFrom) {
            const rfNumber = tkNumber + 1;
            response += `${rfNumber} RF ${currentPNR.receivedFrom}\n`;
          }
          
          response += `*TRN*\n>`;
          
          // A diferencia de ET, con ER mantenemos el PNR actual activo
          // para seguir trabajando con él
          
          return response;
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

  // Función para validar que un PNR tenga todos los elementos obligatorios
function validatePNR(pnr) {
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

// Función para manejar la recuperación de PNR (RT)
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
    
    // Formatear la respuesta
    let response = `\n---RLR---\n`;
    response += `RP/UTN5168476/AGENTE FF/WE ${pnrData.ticketing?.date || '01JAN'}/1200Z ${pnrData.recordLocator}\n`;
    
    // Mostrar pasajeros
    if (pnrData.passengers && pnrData.passengers.length > 0) {
      pnrData.passengers.forEach((passenger, index) => {
        response += `${index + 1}.${passenger.lastName}/${passenger.firstName} ${passenger.title}\n`;
      });
    }
    
    // Mostrar segmentos
    if (pnrData.segments && pnrData.segments.length > 0) {
      pnrData.segments.forEach((segment, index) => {
        response += `${index + 1} ${segment.airline_code} ${segment.flight_number} ${segment.class} `;
        response += `${segment.departureDate} ${segment.dayOfWeek} ${segment.origin}${segment.destination} `;
        response += `${segment.status}${segment.quantity} ${segment.departureTime} ${segment.arrivalTime} `;
        response += `${segment.departureDate} E ${segment.equipment}\n`;
      });
    }
    
    // Mostrar contactos
    if (pnrData.contacts && pnrData.contacts.length > 0) {
      pnrData.contacts.forEach((contact, index) => {
        const elementNumber = (pnrData.passengers?.length || 0) + index + 1;
        response += `${elementNumber} AP ${contact.city} ${contact.phone}-${contact.type}\n`;
      });
    }
    
    // Mostrar límite de tiempo para emisión de billete
    if (pnrData.ticketing) {
      const tkNumber = (pnrData.passengers?.length || 0) + (pnrData.contacts?.length || 0) + 1;
      response += `${tkNumber} TK TL${pnrData.ticketing.timeLimit}\n`;
    }
    
    response += `*TRN*\n>`;
    
    // Registrar esta recuperación en el historial del PNR
    try {
      await updateDoc(doc(db, 'pnrs', pnrData.id), {
        history: arrayUnion({
          command: cmd,
          result: 'PNR retrieved',
          timestamp: serverTimestamp()
        })
      });
    } catch (error) {
      console.error('Error al actualizar historial del PNR:', error);
      // Continuamos aunque falle
    }
    
    return response;
  } catch (error) {
    console.error('Error al procesar el comando RT:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

// Función para manejar el comando de cancelación (XI)
export async function handleCancelPNR(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    if (!currentPNR) {
      return "No hay un PNR en progreso que cancelar.";
    }
    
    // Cambiar estado a cancelado
    currentPNR.status = 'CANCELLED';
    
    // Guardar el cambio en Firestore
    if (currentPNR.id) {
      await updateDoc(doc(db, 'pnrs', currentPNR.id), {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          command: cmd,
          result: 'PNR cancelled',
          timestamp: serverTimestamp()
        })
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