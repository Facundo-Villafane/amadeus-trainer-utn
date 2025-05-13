// src/utils/commandParser/commands/pnr/pnrTransaction.js
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { generatePNR } from '../../../../utils/pnrGenerator';
import { getCurrentPNR, clearCurrentPNR, setCurrentPNR, validatePNR, getUserEmail } from './pnrState';
import { formatERResponse } from './pnrUtils';
import experienceService from '../../../../services/experienceService';
import toast from 'react-hot-toast';

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
    
    // Verificar que el PNR tenga todos los elementos obligatorios
    const validationErrors = validatePNR(currentPNR);
    if (validationErrors.length > 0) {
      // Registrar error en experiencia
      await experienceService.recordPNRError(userId);
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
        if (finalizedPNR && finalizedPNR.id) {
          const result = await experienceService.completePNR(
            userId, 
            finalizedPNR.id, 
            finalizedPNR.recordLocator
          );
          
          // Opcional: Mostrar notificación de XP ganado
          console.log(`XP ganado: ${result.xpGained}`);
          if (result.levelUp) {
            console.log(`¡Subiste al nivel ${result.levelUp}!`);
          }
          
          if (result.achievements && result.achievements.length > 0) {
            console.log(`Logros desbloqueados: ${result.achievements.map(a => a.name).join(', ')}`);
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
        
        // Guardar el PNR finalizado en Firestore (igual que en ET)
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
        
        if (finalizedPNR && finalizedPNR.id) {
          try {
            const result = await experienceService.completePNR(
              userId, 
              finalizedPNR.id, 
              finalizedPNR.recordLocator
            );
            
            // Mostrar XP ganado
            if (result.xpGained) {
              toast.success(`+${result.xpGained} XP`, {
                icon: '🌟',
                duration: 3000
              });
            }
            
            // Mostrar si subió de nivel
            if (result.levelUp) {
              toast.success(`¡Has subido al nivel ${result.levelUp}!`, {
                icon: '🏆',
                duration: 4000
              });
            }
            
            // Mostrar logros desbloqueados
            if (result.achievements && result.achievements.length > 0) {
              // Si hay varios logros, mostramos un mensaje general
              if (result.achievements.length > 1) {
                toast.success(`¡Has desbloqueado ${result.achievements.length} logros!`, {
                  icon: '🎖️',
                  duration: 4000
                });
              } else {
                // Si solo hay un logro, mostramos su nombre
                const achievement = result.achievements[0];
                toast.success(`¡Logro desbloqueado: ${achievement.name}!`, {
                  icon: achievement.icon || '🏅',
                  duration: 4000
                });
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