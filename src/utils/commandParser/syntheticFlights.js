// src/utils/commandParser/syntheticFlights.js
//
// Generates in-memory training flights when AN availability has too few real
// results. These flights are synthetic, but use real IATA airline codes so the
// practice screen is easier for students to recognize and discuss.

const MIN_FLIGHTS = 10;

const CITY_GROUPS = {
    EZE: 'BUE',
    AEP: 'BUE',
};

const ROUTE_CARRIERS = {
    'BUE-MAD': ['AR', 'IB'],
    'BUE-BCN': ['AR', 'IB'],
    'BUE-MIA': ['AR', 'AA'],
    'BUE-JFK': ['AR', 'AA', 'DL'],
    'BUE-LAX': ['AR', 'AA', 'DL', 'UA'],
    'BUE-SCL': ['AR', 'LA', 'H2'],
    'BUE-LIM': ['LA', 'AR'],
    'BUE-BOG': ['AV', 'AR'],
    'BUE-GRU': ['AR', 'LA', 'G3'],
    'BUE-GIG': ['AR', 'LA', 'G3'],
    'BUE-MVD': ['AR', 'LA'],
    'BUE-ASU': ['AR', 'LA'],
    'BUE-PTY': ['CM', 'AR'],
    'MAD-BUE': ['IB', 'AR'],
    'BCN-BUE': ['IB', 'AR'],
    'MIA-BUE': ['AA', 'AR'],
    'JFK-BUE': ['AA', 'DL', 'AR'],
    'LAX-BUE': ['AA', 'DL', 'UA', 'AR'],
    'SCL-BUE': ['LA', 'AR', 'H2'],
    'LIM-BUE': ['LA', 'AR'],
    'BOG-BUE': ['AV', 'AR'],
    'GRU-BUE': ['LA', 'G3', 'AR'],
    'GIG-BUE': ['LA', 'G3', 'AR'],
    'MVD-BUE': ['AR', 'LA'],
    'ASU-BUE': ['AR', 'LA'],
    'PTY-BUE': ['CM', 'AR'],
    'MAD-LHR': ['IB', 'BA'],
    'MAD-CDG': ['IB', 'AF', 'UX'],
    'MAD-FCO': ['IB', 'AZ', 'UX'],
    'MAD-BCN': ['IB', 'UX', 'VY'],
    'MAD-MIA': ['IB', 'AA'],
    'LHR-MAD': ['BA', 'IB'],
    'CDG-MAD': ['AF', 'IB', 'UX'],
    'FCO-MAD': ['AZ', 'IB', 'UX'],
    'BCN-MAD': ['IB', 'UX', 'VY'],
    'MIA-MAD': ['AA', 'IB'],
};

const REGION_CARRIERS = {
    'SA-EU': ['AR', 'IB', 'UX', 'AF', 'KL', 'AZ'],
    'EU-SA': ['IB', 'AR', 'UX', 'AF', 'KL', 'AZ'],
    'SA-NA': ['AR', 'AA', 'DL', 'UA', 'AV', 'CM'],
    'NA-SA': ['AA', 'DL', 'UA', 'AR', 'AV', 'CM'],
    'SA-SA': ['AR', 'LA', 'AV', 'CM', 'G3', 'H2'],
    'EU-EU': ['IB', 'BA', 'AF', 'LH', 'KL', 'AZ', 'UX', 'VY'],
    'EU-NA': ['BA', 'AA', 'DL', 'UA', 'LH', 'AF', 'KL', 'IB'],
    'NA-EU': ['AA', 'DL', 'UA', 'BA', 'LH', 'AF', 'KL', 'IB'],
    'EU-AS': ['EK', 'QR', 'TK', 'EY', 'SQ'],
    'AS-EU': ['EK', 'QR', 'TK', 'EY', 'SQ'],
    'NA-NA': ['AA', 'DL', 'UA', 'AC', 'AS', 'B6'],
    'AS-AS': ['SQ', 'CX', 'NH', 'JL', 'TG', 'KE'],
    default: ['AR', 'IB', 'LA', 'AA', 'AF', 'LH'],
};

export const TRAINING_AIRLINE_NAMES = {
    AR: 'Aerolineas Argentinas',
    IB: 'Iberia',
    LA: 'LATAM Airlines',
    AA: 'American Airlines',
    DL: 'Delta Air Lines',
    UA: 'United Airlines',
    H2: 'Sky Airline',
    AV: 'Avianca',
    G3: 'GOL Linhas Aereas',
    CM: 'Copa Airlines',
    BA: 'British Airways',
    AF: 'Air France',
    UX: 'Air Europa',
    AZ: 'ITA Airways',
    VY: 'Vueling',
    KL: 'KLM',
    LH: 'Lufthansa',
    EK: 'Emirates',
    QR: 'Qatar Airways',
    TK: 'Turkish Airlines',
    EY: 'Etihad Airways',
    SQ: 'Singapore Airlines',
    AC: 'Air Canada',
    AS: 'Alaska Airlines',
    B6: 'JetBlue',
    CX: 'Cathay Pacific',
    NH: 'All Nippon Airways',
    JL: 'Japan Airlines',
    TG: 'Thai Airways',
    KE: 'Korean Air',
};

const FLIGHT_NUMBER_RANGES = {
    AR: [1000, 1999],
    IB: [6000, 6999],
    LA: [4000, 4999],
    AA: [900, 2999],
    DL: [100, 2999],
    UA: [100, 2999],
    H2: [500, 999],
    AV: [100, 999],
    G3: [7000, 7999],
    CM: [100, 999],
    BA: [200, 999],
    AF: [1000, 1999],
    UX: [1000, 1999],
    AZ: [600, 999],
    VY: [6000, 6999],
    KL: [700, 999],
    LH: [400, 999],
    EK: [100, 999],
    QR: [100, 999],
    TK: [1000, 1999],
    EY: [100, 999],
    SQ: [100, 999],
    AC: [700, 1999],
    AS: [1, 999],
    B6: [1, 999],
    CX: [200, 999],
    NH: [100, 999],
    JL: [1, 999],
    TG: [900, 999],
    KE: [1, 999],
};

const DURATION_TABLE = {
    'SA-EU': 12.5, 'EU-SA': 13.0,
    'SA-NA': 9.5, 'NA-SA': 10.0,
    'SA-SA': 3.5,
    'EU-EU': 2.5,
    'EU-NA': 9.0, 'NA-EU': 8.5,
    'EU-AS': 11.0, 'AS-EU': 11.5,
    'NA-NA': 4.0,
    'AS-AS': 5.0,
    default: 8.0,
};

const AIRPORT_REGION = {
    EZE: 'SA', AEP: 'SA', COR: 'SA', MDZ: 'SA', BRC: 'SA',
    SCL: 'SA', GIG: 'SA', GRU: 'SA', MVD: 'SA', ASU: 'SA',
    BOG: 'SA', LIM: 'SA', PTY: 'SA',
    MAD: 'EU', BCN: 'EU', LHR: 'EU', CDG: 'EU', FCO: 'EU',
    AMS: 'EU', FRA: 'EU', MXP: 'EU', LIS: 'EU', ZRH: 'EU',
    VIE: 'EU', MUC: 'EU', OSL: 'EU', ARN: 'EU', CPH: 'EU',
    JFK: 'NA', MIA: 'NA', LAX: 'NA', ORD: 'NA', YYZ: 'NA',
    MEX: 'NA', CUN: 'NA',
    DXB: 'AS', DOH: 'AS', SIN: 'AS', HKG: 'AS', NRT: 'AS',
    BKK: 'AS', IST: 'AS', TLV: 'AS',
    JNB: 'AF', CAI: 'AF',
};

function normalizeAirportCode(code) {
    return String(code || '').toUpperCase();
}

function normalizeAirlineCode(code) {
    return String(code || '').toUpperCase();
}

function cityGroup(code) {
    const normalized = normalizeAirportCode(code);
    return CITY_GROUPS[normalized] || normalized;
}

function getRegion(iata) {
    return AIRPORT_REGION[normalizeAirportCode(iata)] || 'XX';
}

function estimateDuration(origin, destination) {
    const key = `${getRegion(origin)}-${getRegion(destination)}`;
    return DURATION_TABLE[key] || DURATION_TABLE.default;
}

function makePrng(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function stringToSeed(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return Math.abs(h);
}

function minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcArrivalTime(depMinutes, durationHours) {
    const arrMinutes = (depMinutes + Math.round(durationHours * 60)) % (24 * 60);
    return minutesToTime(arrMinutes);
}

function calcArrivalDate(isoDate, depMinutes, durationHours) {
    if (!isoDate) return isoDate;
    const totalArr = depMinutes + Math.round(durationHours * 60);
    const dayOffset = Math.floor(totalArr / (24 * 60));
    if (dayOffset === 0) return isoDate;
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
}

function routeCarrierPool(origin, destination) {
    const originCode = normalizeAirportCode(origin);
    const destinationCode = normalizeAirportCode(destination);
    const originCity = cityGroup(originCode);
    const destinationCity = cityGroup(destinationCode);
    const keys = [
        `${originCode}-${destinationCode}`,
        `${originCity}-${destinationCode}`,
        `${originCode}-${destinationCity}`,
        `${originCity}-${destinationCity}`,
    ];

    for (const key of keys) {
        if (ROUTE_CARRIERS[key]) return ROUTE_CARRIERS[key];
    }

    const regionKey = `${getRegion(originCode)}-${getRegion(destinationCode)}`;
    return REGION_CARRIERS[regionKey] || REGION_CARRIERS.default;
}

export function getSyntheticCarrierPool(origin, destination, preferredAirline = null) {
    const preferred = preferredAirline ? normalizeAirlineCode(preferredAirline) : null;
    const pool = routeCarrierPool(origin, destination);

    if (!preferred) return pool;
    return pool.includes(preferred) ? [preferred] : [];
}

export function formatTrainingAirlineList(codes) {
    const uniqueCodes = [...new Set(codes.map(normalizeAirlineCode).filter(Boolean))];
    return uniqueCodes
        .map(code => `${code} ${TRAINING_AIRLINE_NAMES[code] || 'carrier'}`)
        .join(', ');
}

function pickFlightNumber(airlineCode, rand) {
    const [min, max] = FLIGHT_NUMBER_RANGES[airlineCode] || [100, 8999];
    return String(Math.floor(rand() * (max - min + 1)) + min);
}

function pickAircraft(rand) {
    const aircraft = ['738', '789', '77W', '320', '321', '333', '744', '32A', '359', '77L'];
    return aircraft[Math.floor(rand() * aircraft.length)];
}

/**
 * @param {string} origin
 * @param {string} destination
 * @param {string|null} isoDate
 * @param {number} realCount
 * @param {{ preferredAirline?: string|null }} options
 * @returns {Array}
 */
export function generateSyntheticFlights(origin, destination, isoDate, realCount, options = {}) {
    const needed = Math.max(0, MIN_FLIGHTS - realCount);
    if (needed === 0) return [];

    const carrierPool = getSyntheticCarrierPool(origin, destination, options.preferredAirline);
    if (carrierPool.length === 0) return [];

    const seed = stringToSeed(`${origin}-${destination}-${isoDate || 'nodate'}-${options.preferredAirline || 'any'}`);
    const rand = makePrng(seed);
    const duration = estimateDuration(origin, destination);

    const flights = [];
    const startMinute = 6 * 60;
    const endMinute = 23 * 60;
    const spread = endMinute - startMinute;

    for (let i = 0; i < needed; i++) {
        const airlineCode = carrierPool[Math.floor(rand() * carrierPool.length)];
        const depMinutes = Math.round(startMinute + (rand() * spread));
        const depTime = minutesToTime(depMinutes);
        const variedDuration = duration + (rand() * 1.0 - 0.5);
        const arrTime = calcArrivalTime(depMinutes, variedDuration);
        const arrDate = calcArrivalDate(isoDate, depMinutes, variedDuration);
        const flightNum = pickFlightNumber(airlineCode, rand);

        const classAvail = {
            J: Math.floor(rand() * 5) + 1,
            C: Math.floor(rand() * 8) + 2,
            Y: Math.floor(rand() * 30) + 10,
            B: Math.floor(rand() * 20) + 5,
            M: Math.floor(rand() * 25) + 5,
            H: Math.floor(rand() * 15) + 3,
        };

        flights.push({
            airline_code: airlineCode,
            flight_number: flightNum,
            departure_airport_code: normalizeAirportCode(origin),
            arrival_airport_code: normalizeAirportCode(destination),
            departure_date: isoDate,
            arrival_date: arrDate,
            departure_time: depTime,
            arrival_time: arrTime,
            duration_hours: parseFloat(variedDuration.toFixed(1)),
            equipment_code: pickAircraft(rand),
            class_availability: classAvail,
            departure_terminal: '',
            arrival_terminal: '',
            synthetic: true,
            trainingOnly: true,
            source: 'TRAINING_SYNTHETIC',
        });
    }

    return flights.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
}
