// src/utils/commandParser/commands/pnr/pnrClone.js
// RRN command — Clone a PNR's itinerary into a new working PNR

import { setCurrentPNR, getCurrentPNR } from './pnrState';
import { convertToAmadeusDate } from './dateUtils';

/**
 * Format months for Amadeus date display
 */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function amadeusDate(dateStr) {
    try { return convertToAmadeusDate(dateStr); } catch { return dateStr || ''; }
}

function todayAmadeus() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}${MONTHS[d.getMonth()]}`;
}

function nowUTC() {
    const d = new Date();
    return `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}Z`;
}

function dayOfWeek(d) { return WEEKDAYS[new Date(d).getDay()]; }

/**
 * Handle RRN[/N] — clone the loaded PNR's itinerary into a fresh working PNR.
 *
 * Formats:
 *   RRN       → clone for 1 pax (default)
 *   RRN/3     → clone for 3 pax
 *
 * Behaviour (mirrors real Amadeus):
 * 1. Requires a PNR already in memory (loaded via RT or just saved with ET/ER).
 * 2. Copies only the segments, with quantity updated to N and status → DK.
 * 3. Clears passengers, contacts, SSR, OSI, remarks, ticketing, receivedFrom.
 * 4. Stores the original PNR locator + office reference for the "replicated from" footer.
 * 5. Sets the new PNR as the active working PNR.
 * 6. Returns a terminal display showing IGNORED + the cloned itinerary.
 */
export async function handleRRNCommand(cmd) {
    try {
        const source = getCurrentPNR();
        if (!source) {
            return 'No hay un PNR cargado. Use RT[LOCALIZADOR] para recuperar un PNR primero.';
        }
        if (!source.segments || source.segments.length === 0) {
            return 'El PNR no contiene segmentos de vuelo para clonar.';
        }

        // Parse quantity: RRN or RRN/N
        const match = cmd.match(/^RRN(?:\/(\d+))?$/i);
        if (!match) {
            return 'Formato incorrecto. Ejemplos: RRN  |  RRN/3';
        }
        const quantity = match[1] ? parseInt(match[1], 10) : 1;

        if (quantity < 1 || quantity > 9) {
            return 'El número de pax a clonar debe ser entre 1 y 9.';
        }

        // ── Build cloned segments ────────────────────────────────────────────────
        const clonedSegments = source.segments.map(seg => ({
            ...seg,
            status: 'DK',   // DK = on request / pending confirmation
            quantity,
        }));

        // ── The original PNR locator and office for the "replicated from" line ──
        const sourceLocator = source.recordLocator || '??????';
        const officeId = 'UTN5168476'; // fixed office id

        // ── Create fresh PNR in memory ──────────────────────────────────────────
        const clonedPNR = {
            // Itinerary only
            segments: clonedSegments,

            // Everything else starts empty
            passengers: [],
            contacts: [],
            emailContacts: [],
            osiElements: [],
            ssrElements: [],
            remarks: [],
            confidentialRemarks: [],
            itineraryRemarks: [],
            ticketing: null,
            receivedFrom: null,
            recordLocator: null,

            // Track where this clone came from
            replicatedFrom: {
                locator: sourceLocator,
                officeId,
                date: todayAmadeus(),
                time: nowUTC(),
            },

            // No Firestore ID yet — it's a fresh unsaved PNR
            id: null,
        };

        setCurrentPNR(clonedPNR);

        // ── Build terminal response ─────────────────────────────────────────────
        let response = '\n---RLR---\n';
        response += `-IGNORED ${sourceLocator}-\n`;
        response += `RP/${officeId}\n`;

        clonedSegments.forEach((seg, i) => {
            const date = amadeusDate(seg.departureDate);
            const dow = seg.dayOfWeek || dayOfWeek(seg.departureDate) || '';
            response += `${i + 1}  ${seg.airline_code} ${seg.flight_number} ${seg.class} `;
            response += `${date} ${dow} ${seg.origin}${seg.destination} `;
            response += `DK${quantity} ${seg.departureTime} ${seg.arrivalTime} `;
            response += `${date} E  ${seg.equipment || seg.aircraft || ''}\n`;
        });

        response += '*TRN*\n>';

        return response;
    } catch (e) {
        console.error('Error en RRN:', e);
        return `Error al procesar el comando RRN: ${e.message}`;
    }
}
