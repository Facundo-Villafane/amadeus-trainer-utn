// src/utils/commandParser/index.js

import { handleAvailabilityCommand } from './commands/availability';
import { handleScheduleCommand } from './commands/schedule';
import { handleTimetableCommand } from './commands/timetable'; 
import { handleMoveDown, handleMoveUp } from './commands/navigation';
import { generateHelpText, handleHelpCommand } from './commands/help';
import { handleEncodeCity, handleDecodeCity } from './commands/city';
import { handleEncodeAirline } from './commands/airline';
import { 
  handleSellSegment, 
  handleAddName, 
  handleAddContact,
  handleReceivedFrom,
  handleEndTransaction, 
  handleRetrievePNR,
  handleCancelPNR
} from './commands/pnr';

// Función principal para analizar y ejecutar comandos
export async function commandParser(command, userId) {
  // Convertir a mayúsculas y eliminar espacios al inicio y al final
  const cmd = command.trim().toUpperCase();
  
  // Manejo de errores global para evitar que la aplicación se rompa
  try {
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
    
    if (cmd.startsWith('AP')) {
      return await handleAddContact(cmd, userId);
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
    
    // Si no coincide con ningún comando conocido
    return `Comando desconocido: ${cmd}. Ingrese HELP para ver los comandos disponibles.`;
  } catch (error) {
    console.error('Error en commandParser:', error);
    throw error; // Re-lanzar para que Terminal.jsx pueda manejarlo apropiadamente
  }
}