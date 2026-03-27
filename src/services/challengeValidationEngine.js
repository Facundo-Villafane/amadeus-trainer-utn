/**
 * challengeValidationEngine.js
 *
 * Motor de validación determinístico. NO usa IA.
 * Recibe el JSON del PNR y un array de reglas estructuradas,
 * y devuelve qué reglas pasaron y cuáles fallaron.
 */

// ── Checkers individuales ──────────────────────────────────────────────────────

/**
 * Verifica que exista al menos un segmento que cumpla origin/destination/date.
 * Cualquier campo omitido (undefined/null/'') se ignora en la comparación.
 */
export function checkSegmentRoute(pnr, rule) {
    const segments = pnr.segments || [];
    return segments.some(seg => {
        if (rule.origin && seg.origin?.toUpperCase() !== rule.origin.toUpperCase()) return false;
        if (rule.destination && seg.destination?.toUpperCase() !== rule.destination.toUpperCase()) return false;
        if (rule.date && seg.departureDate?.toUpperCase() !== rule.date.toUpperCase()) return false;
        return true;
    });
}

/** Verifica cantidad de segmentos dentro de un rango min/max. */
export function checkSegmentCount(pnr, rule) {
    const count = (pnr.segments || []).length;
    if (rule.min !== undefined && count < rule.min) return false;
    if (rule.max !== undefined && count > rule.max) return false;
    return true;
}

/**
 * Verifica cantidad de pasajeros.
 * Si passengerType es 'INF', busca pasajeros con campo .infant presente.
 * Para ADT/CHD busca por .type directamente.
 */
export function checkPassengerCount(pnr, rule) {
    let list = pnr.passengers || [];
    if (rule.passengerType) {
        if (rule.passengerType === 'INF') {
            list = list.filter(p => p.infant != null);
        } else {
            list = list.filter(p => p.type === rule.passengerType);
        }
    }
    const count = list.length;
    if (rule.min !== undefined && count < rule.min) return false;
    if (rule.max !== undefined && count > rule.max) return false;
    return true;
}

/**
 * Verifica que exista un SSR con el code indicado.
 * Si se especifica passengerNumber, también lo valida.
 */
export function checkSsrExists(pnr, rule) {
    const ssrs = pnr.ssrElements || [];
    return ssrs.some(ssr => {
        if (ssr.code?.toUpperCase() !== rule.code?.toUpperCase()) return false;
        if (rule.passengerNumber !== undefined && ssr.passengerNumber !== rule.passengerNumber) return false;
        return true;
    });
}

/**
 * Verifica que exista un SSR FOID (documento de identidad).
 * Si se especifica docType ('PP' o 'NI'), también lo valida.
 */
export function checkPassengerHasDocument(pnr, rule) {
    const ssrs = pnr.ssrElements || [];
    return ssrs.some(ssr => {
        if (ssr.code !== 'FOID') return false;
        if (rule.docType && ssr.docType !== rule.docType) return false;
        return true;
    });
}

/** Verifica que haya al menos un elemento de contacto telefónico (AP). */
export function checkHasContactPhone(pnr) {
    return (pnr.contacts || []).length > 0;
}

/** Verifica que haya email de contacto (APE o SSR CTCE). */
export function checkHasContactEmail(pnr) {
    const hasApe = (pnr.emailContacts || []).length > 0;
    const hasCtce = (pnr.ssrElements || []).some(s => s.code === 'CTCE');
    return hasApe || hasCtce;
}

/**
 * Verifica que exista un elemento TK (ticketing).
 * Si se especifica type ('TL', 'OK', 'XL'), también lo valida.
 */
export function checkHasTicketing(pnr, rule) {
    if (!pnr.ticketing) return false;
    if (rule.type && pnr.ticketing.type !== rule.type) return false;
    return true;
}

/** Verifica que haya al menos una observación (RM). */
export function checkHasRemark(pnr) {
    return (pnr.remarks || []).length > 0;
}

/**
 * Verifica que exista un elemento OSI.
 * Si se especifica contains, busca ese substring en el mensaje.
 */
export function checkOsiExists(pnr, rule) {
    const osis = pnr.osiElements || [];
    if (!rule.contains) return osis.length > 0;
    return osis.some(osi => osi.message?.toLowerCase().includes(rule.contains.toLowerCase()));
}

// ── Mapa de tipos ──────────────────────────────────────────────────────────────

const CHECKERS = {
    segment_route: checkSegmentRoute,
    segment_count: checkSegmentCount,
    passenger_count: checkPassengerCount,
    ssr_exists: checkSsrExists,
    passenger_has_document: checkPassengerHasDocument,
    has_contact_phone: (pnr) => checkHasContactPhone(pnr),
    has_contact_email: (pnr) => checkHasContactEmail(pnr),
    has_ticketing: checkHasTicketing,
    has_remark: (pnr) => checkHasRemark(pnr),
    osi_exists: checkOsiExists,
};

// ── Labels legibles para el feedback ──────────────────────────────────────────

function buildLabel(rule) {
    if (rule.description) return rule.description;
    switch (rule.type) {
        case 'segment_route': {
            const parts = [rule.origin, rule.destination].filter(Boolean).join('→');
            return `Segmento ${parts}${rule.date ? ` el ${rule.date}` : ''}`;
        }
        case 'segment_count':
            return `Cantidad de segmentos: ${rule.min ?? 1}–${rule.max ?? '∞'}`;
        case 'passenger_count': {
            const t = rule.passengerType ? ` (${rule.passengerType})` : '';
            return `Pasajeros${t}: ${rule.min ?? 1}–${rule.max ?? '∞'}`;
        }
        case 'ssr_exists':
            return `SSR ${rule.code}${rule.passengerNumber ? ` para PAX ${rule.passengerNumber}` : ''}`;
        case 'passenger_has_document':
            return `Documento${rule.docType ? ` tipo ${rule.docType}` : ''} (FOID)`;
        case 'has_contact_phone':
            return 'Teléfono de contacto (AP)';
        case 'has_contact_email':
            return 'Email de contacto (APE/CTCE)';
        case 'has_ticketing':
            return `Elemento TK${rule.type ? ` tipo ${rule.type}` : ''}`;
        case 'has_remark':
            return 'Observación (RM)';
        case 'osi_exists':
            return `OSI${rule.contains ? ` con "${rule.contains}"` : ''}`;
        default:
            return rule.type;
    }
}

// ── Función principal exportada ────────────────────────────────────────────────

/**
 * Evalúa un PNR contra un array de reglas estructuradas.
 *
 * @param {Object} pnrData - El objeto PNR completo guardado en Firestore.
 * @param {Array}  validationRules - Array de reglas del challenge.
 * @returns {{ passed: Array, failed: Array, isPass: boolean }}
 */
export function evaluateRules(pnrData, validationRules) {
    if (!Array.isArray(validationRules) || validationRules.length === 0) {
        return { passed: [], failed: [], isPass: true };
    }

    const passed = [];
    const failed = [];

    validationRules.forEach((rule, index) => {
        const checker = CHECKERS[rule.type];
        if (!checker) {
            console.warn(`[ValidationEngine] Tipo de regla desconocido: "${rule.type}" — ignorado.`);
            return;
        }

        const ok = checker(pnrData, rule);
        const entry = { ruleIndex: index, type: rule.type, description: buildLabel(rule), passed: ok };

        if (ok) passed.push(entry);
        else failed.push(entry);
    });

    return {
        passed,
        failed,
        isPass: failed.length === 0,
    };
}
