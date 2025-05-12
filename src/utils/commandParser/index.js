// src/utils/commandParser/index.js

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

// Variable para rastrear si el comando anterior fue XI (para confirmación con RF)
let previousCommandWasXI = false;

// Función principal para analizar y ejecutar comandos
export async function commandParser(command, userId) {
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
    
    // Si es el primer comando de creación de PNR, iniciar timer
    if (cmd.startsWith('SS') && !getCurrentPNR()) {
      await experienceService.startPNRCreation(userId);
    }
    
    // Comandos de paginación
    if (cmd === 'MD' || cmd === 'M') {
      result = await handleMoveDown();
      return result;
    }
    
    if (cmd === 'U') {
      result = await handleMoveUp();
      return result;
    }
    
    // Comandos de ayuda
    if (cmd === 'HELP' || cmd === 'HE') {
      result = generateHelpText();
      return result;
    }
    
    // Comandos de formato HE
    if (cmd.startsWith('HE')) {
      result = handleHelpCommand(cmd);
      return result;
    }
    
    // Comando de despliegue de disponibilidad AN
    if (cmd.startsWith('AN')) {
      result = await handleAvailabilityCommand(cmd);
      return result;
    }
    
    // Comando de despliegue de horarios SN
    if (cmd.startsWith('SN')) {
      result = await handleScheduleCommand(cmd);
      return result;
    }
    
    // Comando de despliegue de frecuencias TN
    if (cmd.startsWith('TN')) {
      result = await handleTimetableCommand(cmd);
      return result;
    }
    
    // Comandos de codificación y decodificación
    if (cmd.startsWith('DAN')) {
      result = await handleEncodeCity(cmd);
      return result;
    }
    
    if (cmd.startsWith('DAC')) {
      result = await handleDecodeCity(cmd);
      return result;
    }
    
    if (cmd.startsWith('DNA')) {
      result = await handleEncodeAirline(cmd);
      return result;
    }
    
    // Comandos para PNR
    if (cmd.startsWith('SS')) {
      result = await handleSellSegment(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('NM')) {
      result = await handleAddName(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('AP') && !cmd.startsWith('APE')) {
      result = await handleAddContact(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }

    if (cmd.startsWith('APE')) {
      result = await handleAddEmailContact(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }

    // Comandos TK para ticketing
    if (cmd.startsWith('TK')) {
      result = await handleTicketing(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    // Comando RF (verificar si está confirmando una cancelación)
    if (cmd.startsWith('RF')) {
      // Intentar procesar como confirmación de XI
      if (previousCommandWasXI) {
        result = await confirmCancelPNR(cmd, userId, true);
        if (result !== null) {
          previousCommandWasXI = false; // Reiniciar el estado
          return result;
        }
      }
      
      // Procesar normalmente si no es confirmación o la confirmación devolvió null
      result = await handleReceivedFrom(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd === 'ET' || cmd === 'ER') {
      result = await handleEndTransaction(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('RT')) {
      result = await handleRetrievePNR(cmd, userId);
      previousCommandWasXI = false;
      return result;
    }
    
    // Nuevos comandos
    if (cmd.startsWith('XE')) {
      result = await handleDeleteElements(cmd);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd === 'XI') {
      result = await handleCancelPNRWithConfirmation();
      previousCommandWasXI = true; // Activar el estado para confirmar con RF
      return result;
    }
    
    // Comandos de elementos suplementarios
    if (cmd.startsWith('OS')) {
      result = await handleAddOSI(cmd);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('SRFOID')) {
      result = await handleAddFOID(cmd);
      previousCommandWasXI = false;
      return result;
    }
    
    if (cmd.startsWith('SR')) {
      result = await handleAddSSR(cmd);
      previousCommandWasXI = false;
      return result;
    }
    
    // Si llegamos aquí, el comando no fue reconocido
    result = `Comando no reconocido: ${cmd}`;
    previousCommandWasXI = false;
    
    // Si el comando fue exitoso (no es un mensaje de error)
    if (result && !result.startsWith('Error') && !result.includes('incorrecto')) {
      await experienceService.recordSuccessfulCommand(userId, cmd, commandType);
    } else if (result && result.includes('error')) {
      await experienceService.recordCommandError(userId, cmd, result);
      
      // Si es un error durante creación de PNR
      if (getCurrentPNR()) {
        await experienceService.recordPNRError(userId);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error en commandParser:', error);
    await experienceService.recordCommandError(userId, cmd, error.message);
    previousCommandWasXI = false; // Reiniciar el estado en caso de error
    return `Error al procesar el comando: ${error.message}`;
  }
}