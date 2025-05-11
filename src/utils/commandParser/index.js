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
  handleCancelPNR,
  handleAddEmailContact,
  getCurrentPNR  // Añadir esta línea
} from './commands/pnr';
import experienceService from '../../services/experienceService';

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

    // Si es el primer comando de creación de PNR, iniciar timer
    if (cmd.startsWith('SS') && !getCurrentPNR()) {
      await experienceService.startPNRCreation(userId);
    }
    
    // Comandos de paginación
    if (cmd === 'MD' || cmd === 'M') {
      return await handleMoveDown();
    }
    
    if (cmd === 'U') {
      return await handleMoveUp();
    }
    
    // Comandos de ayuda
    if (cmd === 'HELP' || cmd === 'HE') {
      return generateHelpText();
    }
    
    // Comandos de formato HE
    if (cmd.startsWith('HE')) {
      return handleHelpCommand(cmd);
    }
    
    // Comando de despliegue de disponibilidad AN
    if (cmd.startsWith('AN')) {
      return await handleAvailabilityCommand(cmd);
    }
    
    // Comando de despliegue de horarios SN
    if (cmd.startsWith('SN')) {
      return await handleScheduleCommand(cmd);
    }
    
    // Comando de despliegue de frecuencias TN
    if (cmd.startsWith('TN')) {
      return await handleTimetableCommand(cmd);
    }
    
    // Comandos de codificación y decodificación
    if (cmd.startsWith('DAN')) {
      return await handleEncodeCity(cmd);
    }
    
    if (cmd.startsWith('DAC')) {
      return await handleDecodeCity(cmd);
    }
    
    if (cmd.startsWith('DNA')) {
      return await handleEncodeAirline(cmd);
    }
    
    // Comandos para PNR
    if (cmd.startsWith('SS')) {
      return await handleSellSegment(cmd, userId);
    }
    
    if (cmd.startsWith('NM')) {
      return await handleAddName(cmd, userId);
    }
    
    if (cmd.startsWith('AP') && !cmd.startsWith('APE')) {
      return await handleAddContact(cmd, userId);
    }

    if (cmd.startsWith('APE')) {
      return await handleAddEmailContact(cmd, userId);
    }

    // En la función commandParser, agregar después de los otros comandos PNR:
    if (cmd.startsWith('TK')) {
      return await handleTicketing(cmd, userId);
    }
    
    if (cmd.startsWith('RF')) {
      return await handleReceivedFrom(cmd, userId);
    }
    
    if (cmd === 'ET' || cmd === 'ER') {
      return await handleEndTransaction(cmd, userId);
    }
    
    if (cmd.startsWith('RT')) {
      return await handleRetrievePNR(cmd, userId);
    }
    
    if (cmd === 'XI') {
      return await handleCancelPNR(cmd, userId);
    }
    
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
    throw error;
  }
}