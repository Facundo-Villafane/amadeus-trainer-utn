// src/utils/commandParser/commands/pnr/index.js
import { handleSellSegment } from './pnrSegments';
import { handleAddName } from './pnrPassengers';
import { handleAddContact, handleReceivedFrom, handleAddEmailContact } from './pnrContacts';
import { handleEndTransaction, handleCancelPNR } from './pnrTransaction';
import { handleRetrievePNR } from './pnrRetrieval';
import { getCurrentPNR, clearCurrentPNR, setCurrentPNR } from './pnrState';

// Exportar todas las funciones relacionadas con PNR
export {
  // Segmentos
  handleSellSegment,
  
  // Pasajeros
  handleAddName,
  
  // Contactos
  handleAddContact,
  handleAddEmailContact,
  handleReceivedFrom,
  
  // Transacciones
  handleEndTransaction,
  handleCancelPNR,
  
  // Recuperación
  handleRetrievePNR,
  
  // Estado del PNR
  getCurrentPNR,
  clearCurrentPNR,
  setCurrentPNR
};