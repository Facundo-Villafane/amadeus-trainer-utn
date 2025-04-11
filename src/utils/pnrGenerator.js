// src/utils/pnrGenerator.js

// Caracteres permitidos para los PNRs (sin caracteres ambiguos como O, 0, I, 1)
const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Genera un código de reserva (PNR) único de 6 caracteres
 * @returns {string} - Código PNR de 6 caracteres
 */
export function generatePNR() {
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    pnr += CHARACTERS.charAt(randomIndex);
  }
  return pnr;
}

/**
 * Valida si un PNR tiene el formato correcto
 * @param {string} pnr - El PNR a validar
 * @returns {boolean} - true si el PNR es válido, false en caso contrario
 */
export function validatePNR(pnr) {
  if (!pnr || typeof pnr !== 'string') {
    return false;
  }
  
  // El PNR debe tener 6 caracteres
  if (pnr.length !== 6) {
    return false;
  }
  
  // Todos los caracteres deben estar en la lista de caracteres permitidos
  return pnr.split('').every(char => CHARACTERS.includes(char));
}