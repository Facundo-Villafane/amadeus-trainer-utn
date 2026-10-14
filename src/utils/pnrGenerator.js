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
 * Localizador de la aerolínea (vendor locator) de un PNR confirmado.
 * Se deriva del localizador de Mozart y del código de aerolínea: es estable
 * entre recuperaciones sin necesidad de guardarlo, distinto al de Mozart, y
 * compartido por todos los segmentos de la misma aerolínea.
 * @param {string} recordLocator - Localizador del PNR en Mozart
 * @param {string} airlineCode - Código IATA de la aerolínea
 * @returns {string} - Localizador de 6 caracteres
 */
export function generateAirlineLocator(recordLocator, airlineCode) {
  // Hash FNV-1a de 32 bits
  let hash = 2166136261;
  for (const ch of `${recordLocator}/${airlineCode}`) {
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  }

  // 6 dígitos en base 32 (30 bits del hash)
  let locator = '';
  for (let i = 0; i < 6; i++) {
    locator += CHARACTERS.charAt(hash % CHARACTERS.length);
    hash = Math.floor(hash / CHARACTERS.length);
  }
  return locator;
}

/**
 * Localizador de aerolínea a mostrar para un segmento ("IB/M2YJD2"), o null si
 * el PNR todavía no está grabado o el segmento no está confirmado (HK).
 * @param {Object} pnr - PNR con recordLocator
 * @param {Object} segment - Segmento con airline_code y status
 * @returns {string|null}
 */
export function getSegmentAirlineLocator(pnr, segment) {
  if (!pnr?.recordLocator || pnr.recordLocator.startsWith('TEMP') || segment?.status !== 'HK') {
    return null;
  }
  return `${segment.airline_code}/${generateAirlineLocator(pnr.recordLocator, segment.airline_code)}`;
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