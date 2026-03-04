// src/utils/flightUtils.js
// Utilidades compartidas para el manejo de vuelos

/**
 * Calcula la fecha y hora de llegada a partir de la salida y duración.
 * Maneja correctamente vuelos que cruzan la medianoche.
 *
 * @param {string} departureDate - Fecha ISO: YYYY-MM-DD
 * @param {string} departureTime - Hora: HH:MM
 * @param {number} durationHours - Duración en horas decimales (ej: 12.5)
 * @returns {{ arrival_date: string, arrival_time: string }} ambos en formato ISO / HH:MM
 */
export function calculateArrival(departureDate, departureTime, durationHours) {
    try {
        if (!departureDate || !departureTime || durationHours === undefined || durationHours === null) {
            return { arrival_date: '', arrival_time: '' };
        }

        const duration = Number(durationHours);
        if (isNaN(duration)) {
            return { arrival_date: '', arrival_time: '' };
        }

        // Parsear fecha ISO (YYYY-MM-DD)
        const [yearStr, monthStr, dayStr] = departureDate.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return { arrival_date: '', arrival_time: '' };
        }

        // Parsear hora (HH:MM)
        const [hoursStr, minutesStr] = departureTime.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (isNaN(hours) || isNaN(minutes)) {
            return { arrival_date: '', arrival_time: '' };
        }

        // Construir datetime de salida (usando UTC para evitar problemas de TZ)
        const departureDt = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

        if (isNaN(departureDt.getTime())) {
            return { arrival_date: '', arrival_time: '' };
        }

        // Sumar duración en milisegundos
        const durationMs = duration * 60 * 60 * 1000;
        const arrivalDt = new Date(departureDt.getTime() + durationMs);

        // Formatear fecha de llegada: YYYY-MM-DD
        const arrYear = arrivalDt.getUTCFullYear();
        const arrMonth = String(arrivalDt.getUTCMonth() + 1).padStart(2, '0');
        const arrDay = String(arrivalDt.getUTCDate()).padStart(2, '0');
        const arrival_date = `${arrYear}-${arrMonth}-${arrDay}`;

        // Formatear hora de llegada: HH:MM
        const arrHours = String(arrivalDt.getUTCHours()).padStart(2, '0');
        const arrMinutes = String(arrivalDt.getUTCMinutes()).padStart(2, '0');
        const arrival_time = `${arrHours}:${arrMinutes}`;

        return { arrival_date, arrival_time };
    } catch (error) {
        console.error('calculateArrival error:', error);
        return { arrival_date: '', arrival_time: '' };
    }
}

/**
 * Convierte una fecha en formato de comando Amadeus (DDMMM o DDMMMYY) al formato ISO YYYY-MM-DD.
 * Ejemplos: '15MAR' → '2026-03-15', '1ENE' → '2026-01-01'
 *
 * @param {string} dateStr - Fecha en formato Amadeus (ej: '15MAR', '5NOV26')
 * @returns {string|null} Fecha en formato YYYY-MM-DD, o null si no se puede parsear
 */
export function normalizeDateToISO(dateStr) {
    if (!dateStr) return null;

    // Meses en inglés (comandos Amadeus usan inglés)
    const months = {
        JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
        JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
        // Aliases en español para compatibilidad
        ENE: 1, ABR: 4, AGO: 8, DIC: 12,
    };

    const match = dateStr.toUpperCase().match(/^(\d{1,2})([A-Z]{3})(\d{2,4})?$/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const monthCode = match[2];
    const monthNum = months[monthCode];

    if (!monthNum) return null;

    let year = match[3] ? parseInt(match[3], 10) : null;
    if (year !== null && year < 100) {
        year = 2000 + year;
    }

    if (!year) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const candidate = new Date(currentYear, monthNum - 1, day);

        // Ventana válida: hasta 1 mes en el pasado, hasta 11 meses en el futuro
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const elevenMonthsAhead = new Date(now);
        elevenMonthsAhead.setMonth(elevenMonthsAhead.getMonth() + 11);

        if (candidate < oneMonthAgo) {
            // Más de 1 mes en el pasado → saltar al año siguiente
            year = currentYear + 1;
        } else if (candidate > elevenMonthsAhead) {
            // Más de 11 meses en el futuro → usar el año anterior
            year = currentYear - 1;
        } else {
            year = currentYear;
        }
    }


    const monthStr = String(monthNum).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Normaliza una fecha en cualquiera de los formatos legacy (D/M/YYYY, DD-MM-YYYY, etc.)
 * al formato estándar ISO YYYY-MM-DD.
 *
 * @param {string} dateStr - Fecha en formato variable
 * @returns {string|null} Fecha en formato ISO, o null si no puede parsear
 */
export function normalizeLegacyDateToISO(dateStr) {
    if (!dateStr) return null;

    // Si ya está en formato ISO YYYY-MM-DD, retornar directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Intentar parsear D/M/YYYY o DD/MM/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const d = String(slashMatch[1]).padStart(2, '0');
        const m = String(slashMatch[2]).padStart(2, '0');
        const y = slashMatch[3];
        return `${y}-${m}-${d}`;
    }

    // Intentar parsear D-M-YYYY o DD-MM-YYYY
    const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
        const d = String(dashMatch[1]).padStart(2, '0');
        const m = String(dashMatch[2]).padStart(2, '0');
        const y = dashMatch[3];
        return `${y}-${m}-${d}`;
    }

    // Intentar formato Amadeus DDMMM
    return normalizeDateToISO(dateStr);
}
