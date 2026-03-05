import { getCurrentPNR } from './pnrState';
import { convertToAmadeusDate } from './dateUtils';

// Helper: Formato de mes (ESP)
const MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MONTHS_FULL_ES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const DAYS_ES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

function formatDateFull(dateStr) {
    try {
        const d = new Date(dateStr);
        return `${d.getDate()} ${MONTHS_FULL_ES[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return dateStr || ''; }
}

function formatShortDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
    } catch { return dateStr || ''; }
}

function formatDayShort(dateStr) {
    try {
        const d = new Date(dateStr);
        return DAYS_ES[d.getDay()];
    } catch { return ''; }
}

// Diccionario mock para simular datos de aeropuertos, países y terminales conocidos
const mockAirportData = {
    'COR': { city: 'CORDOBA', country: 'AR', name: 'IA AMBROSIO TARAVELLA', terminal: 'TERMINAL' },
    'MAD': { city: 'MADRID', country: 'ES', name: 'BARAJAS', terminal: 'TERMINAL 3' },
    'BUE': { city: 'BUENOS AIRES', country: 'AR', name: 'PISTARINI', terminal: 'TERMINAL A' },
    'EZE': { city: 'BUENOS AIRES', country: 'AR', name: 'PISTARINI', terminal: 'TERMINAL A' },
    'AEP': { city: 'BUENOS AIRES', country: 'AR', name: 'JORGE NEWBERY', terminal: 'TERMINAL' },
    'MIA': { city: 'MIAMI', country: 'US', name: 'INTL', terminal: 'TERMINAL N' },
    'JFK': { city: 'NEW YORK', country: 'US', name: 'JOHN F KENNEDY INTL', terminal: 'TERMINAL 4' },
    'GRU': { city: 'SAO PAULO', country: 'BR', name: 'GUARULHOS INTL', terminal: 'TERMINAL 3' },
    'SCL': { city: 'SANTIAGO', country: 'CL', name: 'ARTURO MERINO BENITEZ', terminal: 'TERMINAL 2' },
    'LIM': { city: 'LIMA', country: 'PE', name: 'JORGE CHAVEZ INTL', terminal: 'TERMINAL' },
    'BOG': { city: 'BOGOTA', country: 'CO', name: 'EL DORADO', terminal: 'TERMINAL 1' },
    'MEX': { city: 'MEXICO CITY', country: 'MX', name: 'JUAREZ INTL', terminal: 'TERMINAL 2' },
    'CUN': { city: 'CANCUN', country: 'MX', name: 'INTL', terminal: 'TERMINAL 3' },
    'CDG': { city: 'PARIS', country: 'FR', name: 'CHARLES DE GAULLE', terminal: 'TERMINAL 2E' },
    'LHR': { city: 'LONDON', country: 'GB', name: 'HEATHROW', terminal: 'TERMINAL 5' },
    'FCO': { city: 'ROME', country: 'IT', name: 'FIUMICINO', terminal: 'TERMINAL 3' }
};

function getAirportInfo(iata) {
    return mockAirportData[iata] || { city: iata, country: 'XX', name: 'AIRPORT', terminal: 'TERMINAL 1' };
}

/**
 * Helper to build the header for the itinerary
 */
function buildHeader(pnr, agencyName = "UNIVERSIDAD TECNOLOGICA NACIONAL") {
    const today = new Date();
    const dateStr = `${today.getDate()} ${MONTHS_FULL_ES[today.getMonth()]} ${today.getFullYear()}`;

    let header = `${agencyName.padEnd(44)}CODIGO DE RES. ${pnr.recordLocator || '------'}\n`;
    header += `951 MEDRANO                                 FECHA:         ${dateStr}\n`;
    header += `BUENOS AIRES\n`;
    header += `ARGENTINA\n`;

    return header;
}

/**
 * Find info for a specific Pax
 */
function getPaxInfoBlocks(pnr, paxIndex) {
    const pax = pnr.passengers[paxIndex];
    if (!pax) return null;

    // Pax Name
    const nameLine = `${pax.lastName}/${pax.firstName} ${pax.title || ''}`.trim();

    // Contact phones
    const phones = pnr.contacts
        .filter(c => !c.passengerNumber || c.passengerNumber === (paxIndex + 1))
        .map(c => `TELEFONO:   ${c.phone}`);

    // Email Contacts (APE or CTCE)
    const emails = [];

    // APE elements
    if (pnr.emailContacts) {
        pnr.emailContacts
            .filter(c => !c.passengerNumber || c.passengerNumber === (paxIndex + 1))
            .forEach(c => emails.push(`E-MAIL: ${c.email}`));
    }

    // CTCE elements
    if (pnr.ssrElements) {
        pnr.ssrElements
            .filter(ssr => ssr.code === 'CTCE' && ssr.passengerNumber === (paxIndex + 1))
            .forEach(ssr => {
                const email = ssr.message ? ssr.message.replace(/\/\//g, '@').replace(/\.\./g, '_').replace(/\.\//g, '-') : '';
                if (email) emails.push(`E-MAIL: ${email}`);
            });
    }

    return { nameLine, phones, emails };
}

/**
 * Formats a single segment for Basic Itinerary (IBD)
 */
function buildBasicSegment(seg) {
    const deptDate = formatShortDate(seg.departureDate);
    const arrDate = formatShortDate(seg.arrivalDate);
    const day = formatDayShort(seg.departureDate);

    let out = `VUELO       ${seg.airline_code} ${seg.flight_number} - ${seg.airline_code}                    ${day} ${deptDate}\n`;
    out += `------------------------------------------------------------------------\n`;
    out += `SALIDA:     ${seg.origin}                                   ${deptDate} ${seg.departureTime}\n`;
    out += `LLEGADA:    ${seg.destination}                                   ${arrDate} ${seg.arrivalTime}\n`;
    out += `RESERVA CONFIRMADA, CLASE (${seg.class})\n`;
    out += `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`;
    return out;
}

/**
 * Formats a single segment for Extended Itinerary (IED)
 */
function buildExtendedSegment(seg, pnr, paxIndex) {
    const deptDate = formatShortDate(seg.departureDate);
    const arrDate = formatShortDate(seg.arrivalDate);
    const day = formatDayShort(seg.departureDate);
    const duration = seg.duration || '00:00'; // mocked duration if missing

    // Convert 1305 to 13:05
    const formatTime = (t) => t && t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2, 4)}` : t;
    const depTime = formatTime(seg.departureTime) || '';
    const arrTime = formatTime(seg.arrivalTime) || '';

    // E.g. LUN 18 NOVIEMBRE 2024
    let fullDateText = '';
    try {
        const d = new Date(seg.departureDate);
        fullDateText = `${day} ${d.getDate()} ${MONTHS_FULL_ES[d.getMonth()]} ${d.getFullYear()}`;
    } catch { fullDateText = deptDate; }

    const flightHeaderLeft = `VUELO       ${seg.airline_code} ${seg.flight_number} - ${seg.airline_code}`;
    let out = `${flightHeaderLeft.padEnd(59)}${fullDateText}\n`;
    out += `------------------------------------------------------------------------\n`;

    // Dynamic origin formatting
    const depLeft = `SALIDA:     ${origData.city}, ${origData.country} (${origData.name}), ${origData.terminal}`;
    out += `${depLeft.padEnd(60)}${deptDate} ${depTime}\n`;

    // Dynamic destination formatting
    const arrLeft = `LLEGADA:    ${destData.city}, ${destData.country} (${destData.name}), ${destData.terminal}`;
    out += `${arrLeft.padEnd(60)}${arrDate} ${arrTime}\n`;

    out += `            LOCALIZADOR AEROLINEA: ${seg.airline_code}/${seg.recordLocator || 'KTWNUC'}\n`;

    // Class mapping for display E.g. J -> BUSINESS, Y -> ECONOMY
    const classMap = { 'J': 'BUSINESS', 'F': 'FIRST', 'Y': 'ECONOMY', 'C': 'BUSINESS', 'W': 'PREMIUM ECONOMY' };
    const classDesc = classMap[seg.class] || 'ECONOMY';
    const confLeft = `            RESERVA CONFIRMADA, ${classDesc} (${seg.class})`;
    out += `${confLeft.padEnd(61)}DURACION: ${duration}\n`;

    out += `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n`;

    // Find pax specific info for this segment
    const pNum = paxIndex + 1;
    const sNum = pnr.segments.indexOf(seg) + 1 + pnr.passengers.length;

    // Meal SSRs
    const mealSSRs = pnr.ssrElements?.filter(s => s.code.endsWith('ML') && s.passengerNumber === pNum && s.segmentNumber === sNum) || [];
    if (mealSSRs.length > 0) {
        // e.g. BBML -> COMIDA PARA BEBE, VGML -> COMIDA VEGETARIANA
        const mealCode = mealSSRs[0].code;
        const msg = mealSSRs[0].message || 'PEDIDO';
        // Mocking the specific display from the screenshot
        if (mealCode === 'BBML') {
            out += `            COMIDA:                     CENA/DESAYUNO\n`;
            out += `            COMIDA PARA BEBE PEDIDO\n`;
        } else {
            out += `            COMIDA:                     ${msg}\n`;
        }
    }

    out += `\nSIN PARADAS ${origData.city},${origData.country} A ${destData.city},${destData.country}\n`;
    out += `            EQUIPO:                     ${seg.equipment || seg.aircraft || 'BOEING 787-900'}\n\n`;

    return out;
}

/**
 * Generates the full itinerary block for a specific passenger
 */
function generateItineraryForPax(pnr, paxIndex, type = 'EXTENDED') {
    const header = buildHeader(pnr);
    const info = getPaxInfoBlocks(pnr, paxIndex);

    if (!info) return '';

    let out = header;

    // Right align the pax name to column 44
    out += `${''.padEnd(44)}${info.nameLine}\n`;

    info.phones.forEach(p => out += `${p}\n`);

    // Agregamos un FAX mock porque estaba en la captura
    if (info.phones.length > 0) {
        out += `FAX:        ${info.phones[0].replace('TELEFONO:   ', '')}\n`;
    }

    info.emails.forEach(e => out += `${e}\n`);
    out += '\n';

    pnr.segments.forEach(seg => {
        if (type === 'EXTENDED') {
            out += buildExtendedSegment(seg, pnr, paxIndex);
        } else {
            out += buildBasicSegment(seg);
        }
    });

    return out;
}

/**
 * Main command handler for IE/IB commands
 */
export async function handleItineraryCommand(cmd, userId) {
    try {
        const currentPNR = getCurrentPNR();
        if (!currentPNR) {
            return "No hay un PNR en progreso.";
        }

        if (!currentPNR.passengers || currentPNR.passengers.length === 0) {
            return "El PNR no tiene pasajeros.";
        }

        if (!currentPNR.segments || currentPNR.segments.length === 0) {
            return "El PNR no tiene segmentos de vuelo.";
        }

        const command = cmd.toUpperCase().trim();

        // Parse the command
        // IED, IBD (Display)
        // IEP, IEP/P1, IEPJ (Print)
        // IEP-EMLA, IEP-EML-mail@mail.com (Email)

        const isExtended = command.startsWith('IE');
        const isBasic = command.startsWith('IB');

        if (!isExtended && !isBasic) {
            return "Comando de itinerario inválido.";
        }

        let output = '';

        // ── Email Handling (IEP-EML) ──
        if (command.includes('-EML')) {
            if (command.includes('-EMLA')) {
                // Enviar a los emails cargados (APE/CTCE)
                const emails = [];
                if (currentPNR.emailContacts) {
                    emails.push(...currentPNR.emailContacts.map(e => e.email));
                }
                if (currentPNR.ssrElements) {
                    currentPNR.ssrElements
                        .filter(s => s.code === 'CTCE' && s.message)
                        .forEach(s => {
                            const e = s.message.replace(/\/\//g, '@').replace(/\.\./g, '_').replace(/\.\//g, '-');
                            if (e) emails.push(e);
                        });
                }

                if (emails.length === 0) {
                    return "Error: No hay direcciones de correo electrónico cargadas en el PNR.";
                }

                // Simula el envío
                const uniqueEmails = [...new Set(emails)];
                return `ITINERARIO CORREO ELECT. ENVIADO – NUMERO ENVIADO ${uniqueEmails.length}`;
            }

            const emlMatch = command.match(/-EML-(.+)$/);
            if (emlMatch) {
                // Enviar al email escrito en la terminal
                const emailTarget = emlMatch[1].trim();
                if (!emailTarget.includes('@')) {
                    return "Error: Dirección de correo electrónico inválida.";
                }
                return `ITINERARIO CORREO ELECT. ENVIADO – NUMERO ENVIADO 1`;
            }
        }

        // ── Display / Print Handling ──
        // Determine which pax to generate for
        let targetPaxIndices = [];

        if (command === 'IED' || command === 'IBD' || command === 'IEPJ' || command === 'IBPJ' || command === 'IEP' || command === 'IBP') {
            // All passengers
            targetPaxIndices = currentPNR.passengers.map((_, i) => i);
        } else if (command.includes('/P')) {
            // Specific passenger
            const paxMatch = command.match(/\/P(\d+)/);
            if (paxMatch) {
                const pNum = parseInt(paxMatch[1], 10);
                if (pNum > 0 && pNum <= currentPNR.passengers.length) {
                    targetPaxIndices.push(pNum - 1);
                } else {
                    return `Error: Pasajero P${pNum} no encontrado en el PNR.`;
                }
            }
        }

        if (targetPaxIndices.length === 0) {
            return "Comando de itinerario inválido o falta especificar el pasajero.";
        }

        const type = isExtended ? 'EXTENDED' : 'BASIC';

        targetPaxIndices.forEach(idx => {
            output += generateItineraryForPax(currentPNR, idx, type);
            output += '\n\n';
        });

        // Trim trailing newlines
        output = output.replace(/\n\n$/, '');

        // For print commands, add a print confirmation footer
        if (command.includes('P') && !command.includes('-EML')) {
            output += '\n\nITINERARIO ENVIADO A LA IMPRESORA';
        }

        return output;

    } catch (error) {
        console.error('Error generando itinerario:', error);
        return `Error al generar itinerario: ${error.message}`;
    }
}
