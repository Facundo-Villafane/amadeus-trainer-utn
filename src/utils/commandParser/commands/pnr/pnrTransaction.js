// src/utils/commandParser/commands/pnr/pnrTransaction.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { generatePNR } from '../../../../utils/pnrGenerator';
import { getCurrentPNR, clearCurrentPNR, setCurrentPNR, validatePNR, getUserEmail } from './pnrState';
import { formatERResponse } from './pnrUtils';
import experienceService from '../../../../services/experienceService';
import xpEventBus from '../../../../services/xpEventBus';

import { handleFinalizeSplit } from './pnrSplit';

/**
 * Maneja el fin de transacción (ET/ER)
 * @param {string} cmd - Comando ingresado por el usuario (ET o ER)
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleEndTransaction(cmd, userId) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que finalizar.";
    }

    // Interceptar si estamos finalizando un Split (estado PARENT)
    if (currentPNR.splitState === 'PARENT') {
      return await handleFinalizeSplit(cmd, userId);
    }

    // Verificar que el PNR tenga todos los elementos obligatorios
    const validationErrors = validatePNR(currentPNR);
    if (validationErrors.length > 0) {
      // Registrar error en experiencia
      if (userId) {
        await experienceService.recordPNRError(userId);
      }
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

        // Actualizar la referencia global 
        setCurrentPNR(currentPNR);

        // Guardar el PNR finalizado en Firestore
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            recordLocator: currentPNR.recordLocator,
            status: currentPNR.status,
            segments: currentPNR.segments,
            updatedAt: serverTimestamp(),
            [`history.${Date.now()}`]: {
              command: cmd,
              result: 'PNR finalized',
              timestamp: new Date().toISOString()
            }
          });
        } else if (userId) {
          // Si el PNR no existe en Firestore, crearlo como finalizado
          const historyEntry = {
            command: cmd,
            result: 'PNR created and finalized',
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

        // Guardar una copia del PNR antes de limpiarlo
        const finalizedPNR = { ...currentPNR };

        // Completar PNR y registrar experiencia
        if (finalizedPNR && finalizedPNR.id && userId) {
          try {
            const result = await experienceService.completePNR(
              userId,
              finalizedPNR.id,
              finalizedPNR.recordLocator
            );

            // Mostrar notificaciones solo si hay resultado
            if (result) {
              // XP events are now emitted by experienceService via xpEventBus
              // Individual toasts (XP gain, level-up, achievements) fire automatically
              if (result.cooldownHit) {
                xpEventBus.emitPNRCooldown(Math.max(0, 180 - result.secsSinceLast));
              }
            }
          } catch (error) {
            console.error('Error al procesar experiencia:', error);
            // No mostrar toast de error para no confundir al usuario
          }
        }

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

        // Actualizar la referencia global
        setCurrentPNR(currentPNR);

        // Guardar el PNR finalizado en Firestore
        if (currentPNR.id) {
          await updateDoc(doc(db, 'pnrs', currentPNR.id), {
            recordLocator: currentPNR.recordLocator,
            status: currentPNR.status,
            segments: currentPNR.segments,
            updatedAt: serverTimestamp(),
            [`history.${Date.now()}`]: {
              command: cmd,
              result: 'PNR finalized',
              timestamp: new Date().toISOString()
            }
          });
        } else if (userId) {
          // Si el PNR no existe en Firestore, crearlo como finalizado
          const historyEntry = {
            command: cmd,
            result: 'PNR created and finalized',
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

        // Guardar una copia del PNR antes de limpiarlo (para experiencia)
        const finalizedPNR = { ...currentPNR };

        if (finalizedPNR && finalizedPNR.id && userId) {
          try {
            const result = await experienceService.completePNR(
              userId,
              finalizedPNR.id,
              finalizedPNR.recordLocator
            );

            // Mostrar notificaciones solo si hay resultado
            if (result) {
              // XP events are now emitted by experienceService via xpEventBus
              if (result.cooldownHit) {
                xpEventBus.emitPNRCooldown(Math.max(0, 180 - result.secsSinceLast));
              }
            }
          } catch (error) {
            console.error('Error al procesar experiencia:', error);
            // No mostrar toast de error para no confundir al usuario
          }
        }

        // Formatear y devolver la respuesta completa
        return formatERResponse(currentPNR);
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

/**
 * Maneja el comando de cancelación (XI)
 * @param {string} cmd - Comando ingresado por el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Respuesta del comando
 */
export async function handleCancelPNR(cmd) {
  try {
    // Verificar si hay un PNR en progreso
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return "No hay un PNR en progreso que cancelar.";
    }

    // Cambiar estado a cancelado
    currentPNR.status = 'CANCELLED';

    // Actualizar la referencia global
    setCurrentPNR(currentPNR);

    // Guardar el cambio en Firestore
    if (currentPNR.id) {
      await updateDoc(doc(db, 'pnrs', currentPNR.id), {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
        [`history.${Date.now()}`]: {
          command: cmd,
          result: 'PNR cancelled',
          timestamp: new Date().toISOString()
        }
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