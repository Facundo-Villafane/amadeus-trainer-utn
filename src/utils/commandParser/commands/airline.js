// src/utils/commandParser/commands/airline.js
// Handles DNA (encode airline by name) and airline decode commands.
// Data source: public/data/airlines.json (pre-built from OpenFlights airlines.dat)
// Falls back to Firestore → mock data if JSON is unavailable.

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// ── In-memory airline data ─────────────────────────────────────────────────
let airlinesData = null; // Array<{ iata, name, country }>
let nameIndex = null; // Map: NAME_UPPER → airline[]
let iataIndex = null; // Map: IATA → airline
let loadingPromise = null;

async function loadAirlinesData() {
  if (airlinesData) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const res = await fetch('/data/airlines.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      airlinesData = await res.json();
      _buildIndexes();
      console.log(`[AirlineData] Loaded ${airlinesData.length} airlines`);
      return true;
    } catch (err) {
      console.warn('[AirlineData] Could not load airlines.json:', err.message);
      airlinesData = FALLBACK_AIRLINES;
      _buildIndexes();
      return false;
    }
  })();

  return loadingPromise;
}

function _buildIndexes() {
  nameIndex = new Map();
  iataIndex = new Map();

  for (const airline of airlinesData) {
    // IATA index — exact
    iataIndex.set(airline.iata.toUpperCase(), airline);

    // Name index — each word + full name
    const nameUpper = airline.name.toUpperCase();
    if (!nameIndex.has(nameUpper)) nameIndex.set(nameUpper, []);
    nameIndex.get(nameUpper).push(airline);
  }
}

function searchByName(query) {
  const q = query.toUpperCase().trim();
  const results = [];
  for (const airline of airlinesData) {
    if (airline.name.toUpperCase().includes(q)) {
      results.push(airline);
      if (results.length >= 10) break; // cap at 10 results
    }
  }
  return results;
}

function findByIata(code) {
  return iataIndex?.get(code.toUpperCase()) || null;
}

// ── Fallback (if JSON fails to load) ──────────────────────────────────────
const FALLBACK_AIRLINES = [
  { iata: 'AA', name: 'American Airlines', country: 'United States' },
  { iata: 'AR', name: 'Aerolíneas Argentinas', country: 'Argentina' },
  { iata: 'BA', name: 'British Airways', country: 'United Kingdom' },
  { iata: 'IB', name: 'Iberia', country: 'Spain' },
  { iata: 'LH', name: 'Lufthansa', country: 'Germany' },
  { iata: 'AF', name: 'Air France', country: 'France' },
  { iata: 'LA', name: 'LATAM Airlines', country: 'Chile' },
  { iata: 'UA', name: 'United Airlines', country: 'United States' },
  { iata: 'DL', name: 'Delta Air Lines', country: 'United States' },
  { iata: 'EK', name: 'Emirates', country: 'UAE' },
  { iata: 'QR', name: 'Qatar Airways', country: 'Qatar' },
  { iata: 'TK', name: 'Turkish Airlines', country: 'Turkey' },
  { iata: 'G3', name: 'GOL Transportes Aéreos', country: 'Brazil' },
];

// ── Command Handlers ───────────────────────────────────────────────────────

/**
 * DNA <airline name> — encode airline name to IATA code
 */
export async function handleEncodeAirline(cmd) {
  try {
    const airlineName = cmd.slice(3).trim();
    if (!airlineName) return 'DNA: Ingrese el nombre de la aerolínea.';

    // 1. Try Firestore first (custom/override entries)
    try {
      const q = query(
        collection(db, 'airlines'),
        where('name_uppercase', '>=', airlineName.toUpperCase()),
        where('name_uppercase', '<=', airlineName.toUpperCase() + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        let response = `DNA${airlineName.toUpperCase()}\n`;
        snap.forEach(doc => {
          const a = doc.data();
          response += `${a.code}  ${a.name.toUpperCase()}\n`;
        });
        return response;
      }
    } catch {
      // Firebase unavailable — continue to local data
    }

    // 2. Local airlines.json
    await loadAirlinesData();
    const results = searchByName(airlineName);

    if (results.length === 0) {
      return `DNA${airlineName.toUpperCase()}\nNo se encontró ninguna aerolínea con ese nombre.`;
    }

    let response = `DNA${airlineName.toUpperCase()}\n`;
    for (const a of results) {
      response += `${a.iata.padEnd(3)} ${a.name.toUpperCase()}`;
      if (a.country) response += ` (${a.country})`;
      response += '\n';
    }
    return response;

  } catch (error) {
    console.error('Error en DNA:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}

/**
 * Decode airline by IATA code (used internally and for display)
 */
export async function handleDecodeAirline(cmd) {
  try {
    const airlineCode = cmd.slice(3).trim().toUpperCase();
    if (!airlineCode) return 'Ingrese el código IATA de la aerolínea.';

    // 1. Try Firestore
    try {
      const q = query(
        collection(db, 'airlines'),
        where('code', '==', airlineCode),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const a = snap.docs[0].data();
        let response = `${airlineCode} - ${a.name.toUpperCase()}`;
        if (a.country) response += ` (${a.country})`;
        return response;
      }
    } catch {
      // Continue
    }

    // 2. Local JSON
    await loadAirlinesData();
    const airline = findByIata(airlineCode);

    if (airline) {
      let response = `${airlineCode} - ${airline.name.toUpperCase()}`;
      if (airline.country) response += ` (${airline.country})`;
      return response;
    }

    return `No se encontró información para el código: ${airlineCode}`;
  } catch (error) {
    console.error('Error al decodificar aerolínea:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}