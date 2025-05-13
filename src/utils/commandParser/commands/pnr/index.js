// src/utils/commandParser/commands/pnr/index.js
// Actualización para agregar los manejadores de comentarios

import { handleSellSegment } from './pnrSegments';
import { handleAddName } from './pnrPassengers';
import { handleAddContact, handleReceivedFrom, handleAddEmailContact } from './pnrContacts';
import { handleEndTransaction, handleCancelPNR } from './pnrTransaction';
import { handleRetrievePNR } from './pnrRetrieval';
import { getCurrentPNR, clearCurrentPNR, setCurrentPNR } from './pnrState';
import { handleDeleteElements, handleCancelPNRWithConfirmation, confirmCancelPNR } from './pnrDeleteElements';
import { handleAddOSI, handleAddSSR, handleAddFOID, validSSRCodes } from './pnrSupplementary';
import { handleTicketing } from './pnrTicketing';
import { 
  handleGeneralRemark, 
  handleConfidentialRemark, 
  handleItineraryRemark 
} from './pnrRemarks';

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
  
  // Ticketing
  handleTicketing,
  
  // Comandos para eliminar elementos
  handleDeleteElements,
  handleCancelPNRWithConfirmation,
  confirmCancelPNR,
  
  // Elementos suplementarios
  handleAddOSI,
  handleAddSSR,
  handleAddFOID,
  validSSRCodes,
  
  // Comentarios
  handleGeneralRemark,
  handleConfidentialRemark,
  handleItineraryRemark,
  
  // Estado del PNR
  getCurrentPNR,
  clearCurrentPNR,
  setCurrentPNR
};