/**
 * challengeEvaluationService.js
 *
 * Motor determinístico (challengeValidationEngine) verifica cada regla contra el PNR → pass/fail,
 * y este módulo arma el feedback legible para el alumno a partir de ese reporte.
 */

import { evaluateRules } from './challengeValidationEngine';

/**
 * Evalúa la entrega de un alumno.
 *
 * @param {Object} challenge - El challenge con su array validationRules[].
 * @param {Object} pnrData   - Snapshot del PNR guardado en Firestore.
 * @returns {Promise<{ isPass: boolean, feedback: string }>}
 */
export const evaluateChallengeSubmission = async (challenge, pnrData) => {
    const rules = challenge.validationRules || [];

    if (rules.length === 0) {
        return {
            isPass: true,
            feedback: 'Este desafío no tiene reglas de validación configuradas. Consultá a tu docente.'
        };
    }

    const report = evaluateRules(pnrData, rules);

    return buildFallbackFeedback(report);
};

/**
 * Feedback generado localmente a partir del reporte del motor de validación.
 */
function buildFallbackFeedback(report) {
    const lines = [];

    if (report.isPass) {
        lines.push('¡Excelente trabajo! Cumpliste todos los requisitos del desafío.');
    } else {
        lines.push('Tu reserva no cumplió todos los requisitos. Revisá los siguientes puntos:');
    }

    if (report.passed.length > 0) {
        lines.push('\nRequisitos cumplidos:');
        report.passed.forEach(r => lines.push(`  ✅ ${r.description}`));
    }

    if (report.failed.length > 0) {
        lines.push('\nRequisitos no cumplidos:');
        report.failed.forEach(r => {
            const suggestion = buildCommandSuggestion(r);
            lines.push(`  ❌ ${r.description}`);
            if (suggestion) lines.push(`     Sugerencia: ${suggestion}`);
        });
    }

    return {
        isPass: report.isPass,
        feedback: lines.join('\n')
    };
}

function buildCommandSuggestion(entry) {
    const rule = entry.rule || {};

    switch (entry.type) {
        case 'segment_route': {
            const route = [rule.origin || 'ORIGEN', rule.destination || 'DESTINO'].join('');
            return `Buscá disponibilidad con AN${rule.date || 'FECHA'}${route} y vendé el segmento con SS.`;
        }
        case 'segment_count':
            return 'Revisá el itinerario con RT y agregá o cancelá segmentos con SS, XE o XI.';
        case 'passenger_count':
            return `Agregá pasajeros con NM. Ejemplo: NM${rule.min || 1}APELLIDO/NOMBRE.`;
        case 'ssr_exists': {
            const pax = rule.passengerNumber ? `/P${rule.passengerNumber}` : '/P1';
            return `Agregá el servicio con SR${rule.code || 'XXXX'}${pax}.`;
        }
        case 'passenger_has_document': {
            const pax = rule.passengerNumber ? `/P${rule.passengerNumber}` : '/P1';
            return `Cargá FOID con SRFOID${rule.airlineCode || 'YY'} HK1-${rule.docType || 'PP'}NUMERO${pax}.`;
        }
        case 'has_contact_phone': {
            const pax = rule.passengerNumber ? `/P${rule.passengerNumber}` : '';
            return `Agregá teléfono con AP${rule.city || 'BUE'}1133334444-M${pax}.`;
        }
        case 'has_contact_email': {
            const pax = rule.passengerNumber ? `/P${rule.passengerNumber}` : '';
            return `Agregá email con APE-alumno@mail.com${pax}.`;
        }
        case 'has_ticketing':
            return rule.ticketingType === 'OK'
                ? 'Agregá ticketing con TKOK.'
                : `Agregá ticketing con TK${rule.ticketingType || 'TL'}15NOV/1800.`;
        case 'has_remark':
            return 'Agregá una observación con RM TEXTO, RC TEXTO o RIR TEXTO.';
        case 'osi_exists':
            return `Agregá OSI con OS${rule.airlineCode || 'YY'} ${rule.contains || 'TEXTO'}.`;
        default:
            return '';
    }
}
