// src/utils/commandParser/commandParser.js
import { handleAvailabilityCommand } from './commands/availability';
import { handleScheduleCommand } from './commands/schedule';
import { handleTimetableCommand } from './commands/timetable'; 
import { handleMoveDown, handleMoveUp } from './commands/navigation';
import { generateHelpText, handleHelpCommand } from './commands/help';
import { handleEncodeCity, handleDecodeCity } from './commands/city';
import { handleEncodeAirline } from './commands/airline';
import { handleTicketing } from './commands/pnr/pnrTicketing';
import { 
  handleSellSegment, 
  handleAddName, 
  handleAddContact,
  handleReceivedFrom,
  handleEndTransaction, 
  handleRetrievePNR,
  getCurrentPNR,
  handleAddEmailContact,
  handleDeleteElements,
  handleCancelPNRWithConfirmation,
  confirmCancelPNR,
  handleAddOSI,
  handleAddSSR,
  handleAddFOID
} from './commands/pnr';
import experienceService from '../../services/experienceService';
import { handleSeatmapCommand, handleAssignSeatCommand } from './commands/seatmap';

// Variable para rastrear si el comando anterior fue XI (para confirmación con RF)
let previousCommandWasXI = false;

// Función principal para analizar y ejecutar comandos
export async function commandParser(command, userId) {
  if (!userId) {
    console.warn('commandParser called without userId');
    // Continuar de todos modos para permitir uso por usuarios no autenticados
  }
  
  // Convertir a mayúsculas y eliminar espacios al inicio y al final
  const cmd = command.trim().toUpperCase();
  
  // Manejo de errores global para evitar que la aplicación se rompa
  try {
    let result;
    let commandType = 'UNKNOWN';
    
    // Determinar tipo de comando para estadísticas
    if (cmd.startsWith('AN')) commandType = 'AN';
    else if (cmd.startsWith('SN')) commandType = 'SN';
    else if (cmd.startsWith('TN')) commandType = 'TN';
    else if (cmd.startsWith('SS')) commandType = 'SS';
    else if (cmd.startsWith('NM')) commandType = 'NM';
    else if (cmd.startsWith('AP')) commandType = 'AP';
    else if (cmd.startsWith('RF')) commandType = 'RF';
    else if (cmd.startsWith('TK')) commandType = 'TK';
    else if (cmd === 'ET' || cmd === 'ER') commandType = 'ET_ER';
    else if (cmd.startsWith('XE')) commandType = 'XE';
    else if (cmd === 'XI') commandType = 'XI';
    else if (cmd.startsWith('OS')) commandType = 'OS';
    else if (cmd.startsWith('SR') && !cmd.startsWith('SRFOID')) commandType = 'SR';
    else if (cmd.startsWith('SRFOID')) commandType = 'FOID';
    else if (cmd.startsWith('SM')) commandType = 'SM';
    else if (cmd.startsWith('ST')) commandType = 'ST';
    else if (cmd === 'HELP' || cmd.startsWith('HE')) commandType = 'HELP';
    else if (cmd === 'MD' || cmd === 'M' || cmd === 'U') commandType = 'NAVIGATION';
    
    // Si es el primer comando de creación de PNR, iniciar timer
    if (cmd.startsWith('SS') && !getCurrentPNR() && userId) {
      await experienceService.startPNRCreation(userId);
    }
    
    // Comandos de paginación
    if (cmd === 'MD' || cmd === 'M') {
      result = await handleMoveDown();
      
      // Registrar comando exitoso si hay userId
      if (userId && result && !result.startsWith('Error') && !result.includes('No hay resultados')) {
        await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
      }
      
      return result;
    }
    
    if (cmd === 'U') {
      result = await handleMoveUp();
      
      // Registrar comando exitoso si hay userId
      if (userId && result && !result.startsWith('Error') && !result.includes('No hay páginas previas')) {
        await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
      }
      
      return result;
    }
    
    // Comandos de ayuda
    if (cmd === 'HELP' || cmd === 'HE') {
      result = generateHelpText();
      
      // Registrar uso de comando HELP para logro "Helping Hand"
      if (userId) {
        await experienceService.recordSuccessfulCommand(userId, cmd, 'HELP');
      }
      
      return result;
    }
    
    // Comandos de formato HE
    if (cmd.startsWith('HE')) {
      result = handleHelpCommand(cmd);
      
      // Registrar uso de comando HE para logro "Helping Hand"
      if (userId) {
        await experienceService.recordSuccessfulCommand(userId, cmd, 'HELP');
      }
      
      return result;
    }
    
    // Comando de despliegue de disponibilidad AN
    if (cmd.startsWith('AN')) {
      result = await handleAvailabilityCommand(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontraron')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Comando de despliegue de horarios SN
    if (cmd.startsWith('SN')) {
      result = await handleScheduleCommand(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontraron')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Comando de despliegue de frecuencias TN
    if (cmd.startsWith('TN')) {
      result = await handleTimetableCommand(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontraron')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Comandos de codificación y decodificación
    if (cmd.startsWith('DAN')) {
      result = await handleEncodeCity(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontró')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, 'DECODE_ENCODE');
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('DAC')) {
      result = await handleDecodeCity(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontró')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, 'DECODE_ENCODE');
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('DNA')) {
      result = await handleEncodeAirline(cmd);
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontró')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, 'DECODE_ENCODE');
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Comandos para PNR
    if (cmd.startsWith('SS')) {
      result = await handleSellSegment(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('NM')) {
      result = await handleAddName(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('AP') && !cmd.startsWith('APE')) {
      result = await handleAddContact(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }

    if (cmd.startsWith('APE')) {
      result = await handleAddEmailContact(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }

    // Comandos TK para ticketing
    if (cmd.startsWith('TK')) {
      result = await handleTicketing(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }
    
    // Comando RF (verificar si está confirmando una cancelación)
    if (cmd.startsWith('RF')) {
      // Intentar procesar como confirmación de XI
      if (previousCommandWasXI) {
        result = await confirmCancelPNR(cmd, userId, true);
        if (result !== null) {
          previousCommandWasXI = false; // Reiniciar el estado
          
          // Registrar resultado
          if (userId) {
            if (!result.startsWith('Error')) {
              await experienceService.recordSuccessfulCommand(userId, cmd, 'PNR_CANCEL');
            } else {
              await experienceService.recordCommandError(userId, cmd, result);
            }
          }
          
          return result;
        }
      }
      
      // Procesar normalmente si no es confirmación o la confirmación devolvió null
      result = await handleReceivedFrom(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }
    
    if (cmd === 'ET' || cmd === 'ER') {
      result = await handleEndTransaction(cmd, userId);
      previousCommandWasXI = false;
      
      // No necesitamos registrar comandos aquí ya que handleEndTransaction ya llama a
      // experienceService.completePNR que registra la experiencia
      
      return result;
    }
    
    if (cmd.startsWith('RT')) {
      result = await handleRetrievePNR(cmd, userId);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error') && !result.includes('No se encontró el PNR')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Nuevos comandos
    if (cmd.startsWith('XE')) {
      result = await handleDeleteElements(cmd);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    if (cmd === 'XI') {
      result = await handleCancelPNRWithConfirmation();
      previousCommandWasXI = true; // Activar el estado para confirmar con RF
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
        }
      }
      
      return result;
    }
    
    // Comandos de elementos suplementarios
    if (cmd.startsWith('OS')) {
      result = await handleAddOSI(cmd);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('SRFOID')) {
      result = await handleAddFOID(cmd);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
    }
    
    if (cmd.startsWith('SR')) {
      result = await handleAddSSR(cmd);
      previousCommandWasXI = false;
      
      // Registrar resultado
      if (userId) {
        if (!result.startsWith('Error')) {
          await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
        } else {
          await experienceService.recordCommandError(userId, cmd, result);
          
          // Si es un error durante creación de PNR
          if (getCurrentPNR()) {
            await experienceService.recordPNRError(userId);
          }
        }
      }
      
      return result;
      }
      
      // Comandos de seatmap
    if (cmd.startsWith('SM')) {
      result = await handleSeatmapCommand(cmd);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('ST')) {
      result = await handleAssignSeatCommand(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    // Si llegamos aquí, el comando no fue reconocido
    result = `Comando no reconocido: ${cmd}`;
    previousCommandWasXI = false;
    
    // Registrar comando no reconocido como error
    if (userId) {
      await experienceService.recordCommandError(userId, cmd, result);
    }
    
    return result;
  } catch (error) {
    console.error('Error en commandParser:', error);
    
    if (userId) {
      await experienceService.recordCommandError(userId, cmd, error.message);
    }
    
    previousCommandWasXI = false; // Reiniciar el estado en caso de error
    return `Error al procesar el comando: ${error.message}`;
  }
}