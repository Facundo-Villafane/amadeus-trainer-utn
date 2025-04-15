// src/utils/commandParser/index.js
import { handleAvailabilityCommand } from './commands/availability';
import { handleScheduleCommand } from './commands/schedule';
import { handleTimetableCommand } from './commands/timetable'; 
import { handleMoveDown, handleMoveUp } from './commands/navigation';
import { generateHelpText, handleHelpCommand } from './commands/help';
import { handleEncodeCity, handleDecodeCity } from './commands/city';
import { handleEncodeAirline } from './commands/airline';
import { handleSellSegment, handleAddName, handleAddContact, handleRetrievePNR } from './commands/pnr';
import { handleEndTransaction } from './commands/transaction';

// Función principal para analizar y ejecutar comandos
export async function commandParser(command) {
  // Convertir a mayúsculas y eliminar espacios al inicio y al final
  const cmd = command.trim().toUpperCase();
  
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
    return await handleSellSegment(cmd);
  }
  
  if (cmd.startsWith('NM')) {
    return handleAddName(cmd);
  }
  
  if (cmd.startsWith('AP')) {
    return handleAddContact(cmd);
  }
  
  if (cmd.startsWith('RF')) {
    return "Received From entrada guardada.";
  }
  
  if (cmd === 'ET' || cmd === 'ER') {
    return handleEndTransaction(cmd);
  }
  
  if (cmd.startsWith('RT')) {
    return await handleRetrievePNR(cmd);
  }
  
  // Si no coincide con ningún comando conocido
  return `Comando desconocido: ${cmd}. Ingrese HELP para ver los comandos disponibles.`;
}