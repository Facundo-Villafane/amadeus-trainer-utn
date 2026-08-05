/**
 * challengeValidationEngine.js
 *
 * Motor de validacion deterministico. NO usa IA.
 * Recibe el JSON del PNR y un array de reglas estructuradas,
 * y devuelve que reglas pasaron y cuales fallaron.
 */

const MONTHS = {
    JAN: '01',
    FEB: '02',
    MAR: '03',
    APR: '04',
    MAY: '05',
    JUN: '06',
    JUL: '07',
    AUG: '08',
    SEP: '09',
    OCT: '10',
    NOV: '11',
    DEC: '12',
};

function cleanText(value) {
    return String(value ?? '').trim();
}

function upper(value) {
    return cleanText(value).toUpperCase();
}

function hasValue(value) {
    return value !== undefined && value !== null && cleanText(value) !== '';
}

function toNumber(value) {
    if (!hasValue(value)) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function normalizeAmadeusDate(value) {
    const raw = upper(value);
    if (!raw) return '';

    const amadeusMatch = raw.match(/^(\d{1,2})([A-Z]{3})$/);
    if (amadeusMatch) {
        return `${amadeusMatch[1].padStart(2, '0')}${amadeusMatch[2]}`;
    }

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const month = Object.entries(MONTHS).find(([, number]) => number === isoMatch[2])?.[0];
        return month ? `${isoMatch[3]}${month}` : raw;
    }

    return raw;
}

function containsText(source, expected) {
    if (!hasValue(expected)) return true;
    return cleanText(source).toLowerCase().includes(cleanText(expected).toLowerCase());
}

function matchesPassengerNumber(element, rule) {
    const passengerNumber = toNumber(rule.passengerNumber);
    return passengerNumber === undefined || toNumber(element.passengerNumber) === passengerNumber;
}

function matchesSegmentNumber(element, rule) {
    const segmentNumber = toNumber(rule.segmentNumber ?? rule.segmentIndex);
    if (segmentNumber === undefined) return true;

    const storedSegmentNumber = toNumber(element.segmentNumber);
    const storedSegmentIndex = toNumber(element.segmentIndex);

    return storedSegmentNumber === segmentNumber || storedSegmentIndex === segmentNumber - 1;
}

function normalizeRule(rule) {
    const normalized = { ...rule };

    if (normalized.type === 'has_ticketing') {
        normalized.ticketingType = upper(normalized.ticketingType || normalized.type_value);
    }

    if (hasValue(normalized.code)) normalized.code = upper(normalized.code);
    if (hasValue(normalized.airlineCode)) normalized.airlineCode = upper(normalized.airlineCode);
    if (hasValue(normalized.docType)) normalized.docType = upper(normalized.docType);
    if (hasValue(normalized.passengerType)) normalized.passengerType = upper(normalized.passengerType);
    if (hasValue(normalized.origin)) normalized.origin = upper(normalized.origin);
    if (hasValue(normalized.destination)) normalized.destination = upper(normalized.destination);
    if (hasValue(normalized.date)) normalized.date = normalizeAmadeusDate(normalized.date);

    return normalized;
}

// Checkers individuales

/**
 * Verifica que exista al menos un segmento que cumpla origin/destination/date.
 * Cualquier campo omitido (undefined/null/'') se ignora en la comparacion.
 */
export function checkSegmentRoute(pnr, rule) {
    const normalizedRule = normalizeRule(rule);
    const segments = pnr.segments || [];

    return segments.some(seg => {
        if (normalizedRule.origin && upper(seg.origin) !== normalizedRule.origin) return false;
        if (normalizedRule.destination && upper(seg.destination) !== normalizedRule.destination) return false;
        if (normalizedRule.airlineCode && upper(seg.airline_code || seg.airlineCode) !== normalizedRule.airlineCode) return false;

        if (normalizedRule.date) {
            const segmentDate = normalizeAmadeusDate(seg.departureDate || seg.date);
            if (segmentDate !== normalizedRule.date) return false;
        }

        return true;
    });
}

/** Verifica cantidad de segmentos dentro de un rango min/max. */
export function checkSegmentCount(pnr, rule) {
    const count = (pnr.segments || []).length;
    const min = toNumber(rule.min);
    const max = toNumber(rule.max);

    if (min !== undefined && count < min) return false;
    if (max !== undefined && count > max) return false;
    return true;
}

/**
 * Verifica cantidad de pasajeros.
 * Si passengerType es INF, busca pasajeros con campo .infant presente.
 * Para ADT/CHD busca por .type directamente.
 */
export function checkPassengerCount(pnr, rule) {
    const normalizedRule = normalizeRule(rule);
    let list = pnr.passengers || [];

    if (normalizedRule.passengerType) {
        if (normalizedRule.passengerType === 'INF') {
            list = list.filter(p => p.infant != null);
        } else {
            list = list.filter(p => upper(p.type || 'ADT') === normalizedRule.passengerType);
        }
    }

    const count = list.length;
    const min = toNumber(normalizedRule.min);
    const max = toNumber(normalizedRule.max);

    if (min !== undefined && count < min) return false;
    if (max !== undefined && count > max) return false;
    return true;
}

/**
 * Verifica que exista un SSR con el code indicado.
 * Opcionalmente valida pasajero, segmento, aerolinea y texto del mensaje.
 */
export function checkSsrExists(pnr, rule) {
    const normalizedRule = normalizeRule(rule);
    const ssrs = pnr.ssrElements || [];

    return ssrs.some(ssr => {
        if (normalizedRule.code && upper(ssr.code) !== normalizedRule.code) return false;
        if (normalizedRule.airlineCode && upper(ssr.airlineCode) !== normalizedRule.airlineCode) return false;
        if (!matchesPassengerNumber(ssr, normalizedRule)) return false;
        if (!matchesSegmentNumber(ssr, normalizedRule)) return false;

        const expectedMessage = normalizedRule.messageContains ?? normalizedRule.contains;
        const searchableText = [
            ssr.message,
            ssr.docType,
            ssr.docNumber,
            ssr.infantName,
            ...Object.values(ssr.seatInfo || {}),
        ].filter(Boolean).join(' ');

        if (!containsText(searchableText, expectedMessage)) return false;
        return true;
    });
}

/**
 * Verifica que exista un SSR FOID (documento de identidad).
 * Opcionalmente valida tipo, pasajero, aerolinea y numero/contenido.
 */
export function checkPassengerHasDocument(pnr, rule) {
    const normalizedRule = normalizeRule(rule);
    const ssrs = pnr.ssrElements || [];

    return ssrs.some(ssr => {
        if (upper(ssr.code) !== 'FOID') return false;
        if (normalizedRule.docType && upper(ssr.docType) !== normalizedRule.docType) return false;
        if (normalizedRule.airlineCode && upper(ssr.airlineCode) !== normalizedRule.airlineCode) return false;
        if (!matchesPassengerNumber(ssr, normalizedRule)) return false;

        const expectedDoc = normalizedRule.docNumber ?? normalizedRule.contains;
        if (!containsText(ssr.docNumber, expectedDoc)) return false;
        return true;
    });
}

/** Verifica que haya al menos un elemento de contacto telefonico (AP). */
export function checkHasContactPhone(pnr, rule = {}) {
    const normalizedRule = normalizeRule(rule);
    return (pnr.contacts || []).some(contact => {
        if (!matchesPassengerNumber(contact, normalizedRule)) return false;
        if (normalizedRule.city && upper(contact.city) !== upper(normalizedRule.city)) return false;
        if (normalizedRule.contactType && upper(contact.type) !== upper(normalizedRule.contactType)) return false;
        if (!containsText(contact.phone, normalizedRule.contains)) return false;
        return true;
    });
}

/** Verifica que haya email de contacto (APE o SSR CTCE). */
export function checkHasContactEmail(pnr, rule = {}) {
    const normalizedRule = normalizeRule(rule);

    const hasApe = (pnr.emailContacts || []).some(contact => {
        if (!matchesPassengerNumber(contact, normalizedRule)) return false;
        return containsText(contact.email, normalizedRule.contains);
    });

    const hasCtce = (pnr.ssrElements || []).some(ssr => {
        if (upper(ssr.code) !== 'CTCE') return false;
        if (normalizedRule.airlineCode && upper(ssr.airlineCode) !== normalizedRule.airlineCode) return false;
        if (!matchesPassengerNumber(ssr, normalizedRule)) return false;
        return containsText(ssr.message, normalizedRule.contains);
    });

    return hasApe || hasCtce;
}

/**
 * Verifica que exista un elemento TK (ticketing).
 * ticketingType reemplaza al antiguo type_value.
 */
export function checkHasTicketing(pnr, rule = {}) {
    const normalizedRule = normalizeRule(rule);
    if (!pnr.ticketing) return false;
    if (normalizedRule.ticketingType && upper(pnr.ticketing.type) !== normalizedRule.ticketingType) return false;
    return true;
}

/** Verifica que haya al menos una observacion (RM). */
export function checkHasRemark(pnr, rule = {}) {
    const remarks = [
        ...(pnr.remarks || []),
        ...(pnr.confidentialRemarks || []),
        ...(pnr.itineraryRemarks || []),
    ];

    if (!hasValue(rule.contains)) return remarks.length > 0;
    return remarks.some(remark => containsText(remark.text || remark.message || remark, rule.contains));
}

/**
 * Verifica que exista un elemento OSI.
 * Opcionalmente valida aerolinea, pasajero y texto.
 */
export function checkOsiExists(pnr, rule) {
    const normalizedRule = normalizeRule(rule);
    const osis = pnr.osiElements || [];

    return osis.some(osi => {
        if (normalizedRule.airlineCode && upper(osi.airlineCode) !== normalizedRule.airlineCode) return false;
        if (!matchesPassengerNumber(osi, normalizedRule)) return false;
        if (!containsText(osi.message, normalizedRule.contains)) return false;
        return true;
    });
}

// Mapa de tipos

const CHECKERS = {
    segment_route: checkSegmentRoute,
    segment_count: checkSegmentCount,
    passenger_count: checkPassengerCount,
    ssr_exists: checkSsrExists,
    passenger_has_document: checkPassengerHasDocument,
    has_contact_phone: checkHasContactPhone,
    has_contact_email: checkHasContactEmail,
    has_ticketing: checkHasTicketing,
    has_remark: checkHasRemark,
    osi_exists: checkOsiExists,
};

// Labels legibles para el feedback

function buildLabel(rule) {
    const normalizedRule = normalizeRule(rule);

    if (normalizedRule.description) return normalizedRule.description;
    switch (normalizedRule.type) {
        case 'segment_route': {
            const parts = [normalizedRule.origin, normalizedRule.destination].filter(Boolean).join('->');
            return `Segmento ${parts}${normalizedRule.date ? ` el ${normalizedRule.date}` : ''}`;
        }
        case 'segment_count':
            return `Cantidad de segmentos: ${normalizedRule.min ?? 1}-${normalizedRule.max ?? 'sin maximo'}`;
        case 'passenger_count': {
            const t = normalizedRule.passengerType ? ` (${normalizedRule.passengerType})` : '';
            return `Pasajeros${t}: ${normalizedRule.min ?? 1}-${normalizedRule.max ?? 'sin maximo'}`;
        }
        case 'ssr_exists':
            return `SSR ${normalizedRule.code || ''}${normalizedRule.passengerNumber ? ` para PAX ${normalizedRule.passengerNumber}` : ''}`;
        case 'passenger_has_document':
            return `Documento${normalizedRule.docType ? ` tipo ${normalizedRule.docType}` : ''} (FOID)`;
        case 'has_contact_phone':
            return 'Telefono de contacto (AP)';
        case 'has_contact_email':
            return 'Email de contacto (APE/CTCE)';
        case 'has_ticketing':
            return `Elemento TK${normalizedRule.ticketingType ? ` tipo ${normalizedRule.ticketingType}` : ''}`;
        case 'has_remark':
            return 'Observacion (RM/RC/RIR)';
        case 'osi_exists':
            return `OSI${normalizedRule.contains ? ` con "${normalizedRule.contains}"` : ''}`;
        default:
            return normalizedRule.type;
    }
}

/**
 * Evalua un PNR contra un array de reglas estructuradas.
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
            console.warn(`[ValidationEngine] Tipo de regla desconocido: "${rule.type}" - ignorado.`);
            return;
        }

        const ok = checker(pnrData, rule);
        const entry = { ruleIndex: index, type: rule.type, description: buildLabel(rule), passed: ok, rule: normalizeRule(rule) };

        if (ok) passed.push(entry);
        else failed.push(entry);
    });

    return {
        passed,
        failed,
        isPass: failed.length === 0,
    };
}
