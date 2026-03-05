// src/utils/commandParser/commands/seatmap.js

import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnr/pnrState';
import { formatPNRResponse } from './pnr/pnrUtils';

// ── Global state for the SM modal ─────────────────────────────────────────────
export let currentSeatmapRequest = {
  pnr: null,
  segmentIndex: null,
  showModal: false
};

export function openSeatmapModal(pnr, segmentIndex) {
  currentSeatmapRequest = { pnr, segmentIndex, showModal: true };
  return true;
}

// ── Seat layout definitions ───────────────────────────────────────────────────
// Each aircraft layout: { cols, aisleAfter, exitRows, blockedRows }
const LAYOUTS = {
  // Narrow-body (B737, A320 style) — 3-3
  narrow: {
    cols: ['A', 'B', 'C', 'D', 'E', 'F'],
    aisleAfter: 'C',      // aisle between C and D
    exitRows: [12, 26],
    totalRows: 34,
    window: ['A', 'F'],
    aisle: ['C', 'D'],
  },
  // Wide-body (B777, A330 style) — 3-4-3
  wide: {
    cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
    aisleAfter: ['C', 'G'], // two aisles
    exitRows: [14, 30],
    totalRows: 42,
    window: ['A', 'K'],
    aisle: ['C', 'D', 'G', 'H'],
  },
};

// Choose layout based on aircraft type in PNR (simplified heuristic)
function pickLayout(segment) {
  const wide = ['777', '787', '330', '340', '380', '350', '767', '747'];
  const aircraft = String(segment?.aircraft_type || segment?.aircraft || '');
  return wide.some(t => aircraft.includes(t)) ? LAYOUTS.wide : LAYOUTS.narrow;
}

// Generate a consistent occupied pattern seeded by route+flight
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 2147483647;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function buildSeatGrid(segment, layout) {
  const rng = seededRandom(`${segment.airline_code}${segment.flight_number}${segment.origin}${segment.destination}`);
  const grid = {}; // key: "ROW-COL" → 'free' | 'occupied' | 'blocked' | 'exit'

  for (let row = 1; row <= layout.totalRows; row++) {
    for (const col of layout.cols) {
      const key = `${row}-${col}`;
      const isExit = layout.exitRows.includes(row);
      const r = rng();
      // row 1–6: first/business — mostly blocked for economy simulation
      if (row <= 6) {
        grid[key] = 'blocked'; // shows as R (airline block)
      } else if (isExit) {
        grid[key] = r < 0.3 ? 'occupied' : 'free'; // exit row — shown with ^
      } else {
        const p = row < 15 ? 0.65 : row < 25 ? 0.5 : 0.3; // front fills first
        grid[key] = r < p ? 'occupied' : 'free';
      }
    }
  }
  return grid;
}

// ── SM command — graphical (SM / SM without number) or cryptic (SM2 etc.) ─────
export async function handleSeatmapCommand(cmd) {
  try {
    const currentPNR = getCurrentPNR();
    if (!currentPNR) return 'No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.';
    if (!currentPNR.segments?.length) return 'El PNR no contiene segmentos de vuelo.';
    if (!currentPNR.passengers?.length) return 'Debe agregar al menos un pasajero (NM) antes de seleccionar asientos.';

    // Parse: SM alone → graphical; SMN (N ≥ 1) → cryptic
    const match = cmd.match(/^SM(\d+)?$/i);
    const segNumStr = match?.[1];

    // SM alone (no number) → open graphical modal
    if (!segNumStr) {
      openSeatmapModal(currentPNR, 0);
      return 'GRAPHIC SEAT SELECTION LOADING...';
    }

    // SM2, SM1, etc. → cryptic text output
    const segmentIndex = parseInt(segNumStr, 10) - 1;
    if (segmentIndex < 0 || segmentIndex >= currentPNR.segments.length) {
      return `Número de segmento inválido. El PNR tiene ${currentPNR.segments.length} segmento(s).`;
    }

    return generateCrypticSeatmap(currentPNR, segmentIndex);
  } catch (e) {
    return `Error al procesar el comando SM: ${e.message}`;
  }
}

// ── Cryptic ASCII seat map (SM2 style) ───────────────────────────────────────
function generateCrypticSeatmap(pnr, segmentIndex) {
  const seg = pnr.segments[segmentIndex];
  const layout = pickLayout(seg);
  const grid = buildSeatGrid(seg, layout);
  const exit = new Set(layout.exitRows);
  const cols = layout.cols;
  const aisles = Array.isArray(layout.aisleAfter) ? layout.aisleAfter : [layout.aisleAfter];

  // Seats already assigned to passengers in this segment
  const assignedSeats = {}; // seat → Pn
  if (pnr.ssrElements) {
    pnr.ssrElements
      .filter(s => s.code === 'RQST' && s.segmentIndex === segmentIndex)
      .forEach(s => {
        Object.entries(s.seatInfo || {}).forEach(([pk, seat]) => {
          assignedSeats[seat] = pk; // e.g. "24A" → "P1"
        });
      });
  }

  // Characters (real Amadeus cryptic convention):
  // .  = available
  // X  = occupied
  // R  = airline reserved/blocked
  // ^  = emergency exit row (available)
  // i  = infant seat
  const lines = [];

  // Header
  lines.push(`SM ${segmentIndex + 1} - ${seg.airline_code}${seg.flight_number} ${seg.origin}-${seg.destination}`);
  lines.push('');

  // Column headers
  const colHeader = '     ' + cols.map(c => c.padStart(2)).join('');
  lines.push(colHeader);
  lines.push('     ' + cols.map(() => '--').join(''));

  for (let row = 1; row <= layout.totalRows; row++) {
    const rowStr = String(row).padStart(3);
    let line = rowStr + ' |';

    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      const key = `${row}-${col}`;
      const seatId = `${row}${col}`;
      const state = grid[key];

      let ch;
      if (state === 'occupied') {
        ch = '-';
      } else if (state === 'blocked') {
        ch = 'R';
      } else if (exit.has(row)) {
        ch = '^'; // emergency exit, available
      } else {
        ch = '*'; // available
      }

      line += ' ' + ch;

      // Aisle gap
      if (aisles.includes(col)) line += ' ';
    }

    line += ' |' + rowStr;

    // Exit row marker
    if (exit.has(row)) line += '  <-- EMERGENCY EXIT';

    lines.push(line);
  }

  lines.push('     ' + cols.map(() => '--').join(''));
  lines.push(colHeader);
  lines.push('');
  lines.push('LEGEND: * AVAILABLE  - OCCUPIED  R RESERVED  ^ EMERGENCY EXIT  i INFANT');
  lines.push(`SEGMENT ${segmentIndex + 1}: ${seg.airline_code}${seg.flight_number} ${seg.origin}-${seg.destination} ${seg.departure_date || ''}`);

  return lines.join('\n');
}

// ── ST command — all variants ─────────────────────────────────────────────────
// Accepted formats:
//   ST                       → random seat, all pax, seg 1
//   ST/A/P{n}/S{n}           → aisle seat
//   ST/W/P{n}/S{n}           → window seat
//   ST/{SEAT}/P{n}/S{n}      → specific seat (e.g. ST/24L/P1/S1)

export async function handleAssignSeatCommand(cmd, userId) {
  try {
    const currentPNR = getCurrentPNR();
    if (!currentPNR) return 'No hay un PNR en progreso. Primero debe seleccionar un vuelo con SS.';
    if (!currentPNR.segments?.length) return 'El PNR no contiene segmentos de vuelo.';
    if (!currentPNR.passengers?.length) return 'Debe agregar al menos un pasajero (NM) antes de seleccionar asientos.';

    const upper = cmd.trim().toUpperCase();

    // ── ST alone → assign random seats to all passengers on segment 1 ─────
    if (upper === 'ST') {
      return await assignRandomToAll(currentPNR, 0);
    }

    // ── ST/type/P{n}/S{n} ─────────────────────────────────────────────────
    // Matches: ST/A/P1/S1  |  ST/W/P2/S1  |  ST/24L/P1/S2
    const full = upper.match(/^ST\/([A-Z0-9]+)\/P(\d+)\/S(\d+)$/);
    if (!full) {
      return [
        'Formato incorrecto. Formatos válidos:',
        '  ST                   → asiento aleatorio para todos los pasajeros (seg 1)',
        '  ST/A/P{n}/S{n}       → pasillo (Aisle)',
        '  ST/W/P{n}/S{n}       → ventana (Window)',
        '  ST/{asiento}/P{n}/S{n} → asiento específico (ej: ST/24L/P1/S1)',
      ].join('\n');
    }

    const [, seatArg, paxStr, segStr] = full;
    const segIdx = parseInt(segStr, 10) - 1;
    const paxIdx = parseInt(paxStr, 10) - 1;

    if (segIdx < 0 || segIdx >= currentPNR.segments.length)
      return `Segmento inválido. El PNR tiene ${currentPNR.segments.length} segmento(s).`;
    if (paxIdx < 0 || paxIdx >= currentPNR.passengers.length)
      return `Pasajero inválido. El PNR tiene ${currentPNR.passengers.length} pasajero(s).`;

    const seg = currentPNR.segments[segIdx];
    const layout = pickLayout(seg);
    const grid = buildSeatGrid(seg, layout);

    let resolvedSeat;

    if (seatArg === 'A') {
      // Aisle seat
      resolvedSeat = pickSeatByType(grid, layout, 'aisle', currentPNR, segIdx);
      if (!resolvedSeat) return 'No hay asientos de pasillo disponibles en este segmento.';
    } else if (seatArg === 'W') {
      // Window seat
      resolvedSeat = pickSeatByType(grid, layout, 'window', currentPNR, segIdx);
      if (!resolvedSeat) return 'No hay asientos de ventana disponibles en este segmento.';
    } else {
      // Specific seat e.g. 24L
      if (!/^\d+[A-Z]$/.test(seatArg)) {
        return `Formato de asiento incorrecto. Debe ser número + letra (ej: 24A, 15C). Obtenido: ${seatArg}`;
      }
      const row = parseInt(seatArg, 10);
      const col = seatArg.slice(-1);
      if (!layout.cols.includes(col)) {
        return `Columna ${col} no existe en este avión. Columnas válidas: ${layout.cols.join(', ')}`;
      }
      if (row < 1 || row > layout.totalRows) {
        return `Fila ${row} fuera de rango (1–${layout.totalRows}).`;
      }
      if (grid[`${row}-${col}`] !== 'free') {
        return `El asiento ${seatArg} no está disponible (ocupado o bloqueado).`;
      }
      resolvedSeat = seatArg;
    }

    return await writeSeatToSSR(currentPNR, segIdx, paxIdx, resolvedSeat);

  } catch (e) {
    console.error('Error ST:', e);
    return `Error al procesar el comando ST: ${e.message}`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Get seats already assigned in a segment (to avoid double-assigning)
function getOccupiedByPNR(pnr, segIdx) {
  const used = new Set();
  (pnr.ssrElements || [])
    .filter(s => s.code === 'RQST' && s.segmentIndex === segIdx)
    .forEach(s => Object.values(s.seatInfo || {}).forEach(seat => used.add(seat)));
  return used;
}

function pickSeatByType(grid, layout, type, pnr, segIdx) {
  const cols = type === 'window' ? layout.window : layout.aisle;
  const used = getOccupiedByPNR(pnr, segIdx);
  // Search from row 10 onward to avoid business zones
  for (let row = 10; row <= layout.totalRows; row++) {
    for (const col of cols) {
      if (!layout.cols.includes(col)) continue;
      const id = `${row}${col}`;
      if (grid[`${row}-${col}`] === 'free' && !used.has(id)) return id;
    }
  }
  return null;
}

async function assignRandomToAll(pnr, segIdx) {
  const seg = pnr.segments[segIdx];
  const layout = pickLayout(seg);
  const grid = buildSeatGrid(seg, layout);
  const used = getOccupiedByPNR(pnr, segIdx);
  const assignments = [];

  for (let paxIdx = 0; paxIdx < pnr.passengers.length; paxIdx++) {
    // Try to find a free seat starting from row 10
    let found = null;
    outer: for (let row = 10; row <= layout.totalRows; row++) {
      for (const col of layout.cols) {
        const id = `${row}${col}`;
        if (grid[`${row}-${col}`] === 'free' && !used.has(id)) {
          found = id;
          used.add(id);
          break outer;
        }
      }
    }
    if (found) assignments.push({ paxIdx, seat: found });
  }

  if (!assignments.length) return 'No hay asientos disponibles en este segmento.';

  // Write all asignaciones
  for (const { paxIdx, seat } of assignments) {
    await writeSeatToSSR(pnr, segIdx, paxIdx, seat, /* skipFormat */ true);
  }

  return formatPNRResponse(getCurrentPNR());
}

async function writeSeatToSSR(pnr, segIdx, paxIdx, seat, skipFormat = false) {
  const seg = pnr.segments[segIdx];
  const segNum = segIdx + 1;
  const paxNum = paxIdx + 1;
  const routeCode = `${seg.origin}${seg.destination}`;

  if (!pnr.ssrElements) pnr.ssrElements = [];

  const existIdx = pnr.ssrElements.findIndex(s => s.code === 'RQST' && s.segmentIndex === segIdx);

  if (existIdx >= 0) {
    const ssr = pnr.ssrElements[existIdx];
    ssr.seatInfo = { ...(ssr.seatInfo || {}), [`P${paxNum}`]: seat };
    const parts = Object.entries(ssr.seatInfo).map(([p, s]) => `${s},${p}`).join('/');
    ssr.message = `${routeCode}/${parts}`;
  } else {
    const seatInfo = { [`P${paxNum}`]: seat };
    pnr.ssrElements.push({
      type: 'SSR',
      code: 'RQST',
      airlineCode: seg.airline_code,
      status: 'HK1',
      message: `${routeCode}/${seat},P${paxNum}`,
      segmentNumber: segNum,
      segmentIndex: segIdx,
      seatInfo,
      addedAt: new Date(),
    });
  }

  setCurrentPNR(pnr);

  if (pnr.id) {
    try {
      await updateDoc(doc(db, 'pnrs', pnr.id), {
        ssrElements: pnr.ssrElements,
        updatedAt: serverTimestamp(),
        [`history.${Date.now()}`]: {
          command: `ST/${seat}/P${paxNum}/S${segNum}`,
          result: `Asiento ${seat} asignado a P${paxNum}, segmento ${segNum}`,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('Error guardando SSR en Firestore:', e);
    }
  }

  if (skipFormat) return null;
  return formatPNRResponse(getCurrentPNR());
}