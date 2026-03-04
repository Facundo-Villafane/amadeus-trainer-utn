// src/utils/commandParser/syntheticFlights.js
//
// Genera vuelos "fantasma" (ghost flights) cuando la búsqueda AN devuelve
// menos de MIN_FLIGHTS resultados reales.
// Los vuelos sintéticos usan la aerolínea ficticia XT ("Amadeus Trainer").
// NUNCA se guardan en Firestore — existen solo en memoria durante la respuesta.

const SYNTHETIC_AIRLINE = 'XT';
const MIN_FLIGHTS = 10; // completar hasta este número si hay menos

// Tabla de duración aproximada entre regiones (en horas)
// Clave: "REGION_ORIGEN-REGION_DESTINO"
const DURATION_TABLE = {
    // América del Sur ↔ Europa
    'SA-EU': 12.5, 'EU-SA': 13.0,
    // América del Sur ↔ Norteamérica
    'SA-NA': 9.5, 'NA-SA': 10.0,
    // América del Sur ↔ América del Sur
    'SA-SA': 3.5,
    // Europa ↔ Europa
    'EU-EU': 2.5,
    // Europa ↔ Norteamérica
    'EU-NA': 9.0, 'NA-EU': 8.5,
    // Europa ↔ Asia/Medio Oriente
    'EU-AS': 11.0, 'AS-EU': 11.5,
    // Norteamérica ↔ Norteamérica
    'NA-NA': 4.0,
    // Asia ↔ Asia
    'AS-AS': 5.0,
    // Por defecto
    'default': 8.0,
};

// Mapa de aeropuertos conocidos a regiones (extensible)
const AIRPORT_REGION = {
    // Argentina / Cono Sur
    EZE: 'SA', AEP: 'SA', COR: 'SA', MDZ: 'SA', BRC: 'SA',
    SCL: 'SA', GIG: 'SA', GRU: 'SA', MVD: 'SA', ASU: 'SA',
    // Europa
    MAD: 'EU', BCN: 'EU', LHR: 'EU', CDG: 'EU', FCO: 'EU',
    AMS: 'EU', FRA: 'EU', MXP: 'EU', LIS: 'EU', ZRH: 'EU',
    VIE: 'EU', MUC: 'EU', OSL: 'EU', ARN: 'EU', CPH: 'EU',
    // Norteamérica
    JFK: 'NA', MIA: 'NA', LAX: 'NA', ORD: 'NA', YYZ: 'NA',
    MEX: 'NA', CUN: 'NA', BOG: 'NA', LIM: 'NA', PTY: 'NA',
    // Asia / Medio Oriente
    DXB: 'AS', DOH: 'AS', SIN: 'AS', HKG: 'AS', NRT: 'AS',
    BKK: 'AS', IST: 'AS', TLV: 'AS',
    // África
    JNB: 'AF', CAI: 'AF',
};

/** Devuelve la región de un aeropuerto (o 'XX' si no se conoce) */
function getRegion(iata) {
    return AIRPORT_REGION[iata?.toUpperCase()] || 'XX';
}

/** Duración estimada entre origen y destino */
function estimateDuration(origin, destination) {
    const key = `${getRegion(origin)}-${getRegion(destination)}`;
    return DURATION_TABLE[key] || DURATION_TABLE['default'];
}

/**
 * Generador de números pseudo-aleatorios determinístico (LCG simple).
 * Dado el mismo seed siempre produce la misma secuencia → los mismos vuelos
 * para la misma búsqueda.
 */
function makePrng(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

/** Convierte string a número para usar como seed */
function stringToSeed(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return Math.abs(h);
}

/** Formatea un número de minutos como "HH:MM" */
function minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Calcula la hora de llegada dado salida + duración en horas */
function calcArrivalTime(depMinutes, durationHours) {
    const arrMinutes = (depMinutes + Math.round(durationHours * 60)) % (24 * 60);
    return minutesToTime(arrMinutes);
}

/** Calcula la fecha de llegada (puede ser +1 día) */
function calcArrivalDate(isoDate, depMinutes, durationHours) {
    if (!isoDate) return isoDate;
    const totalArr = depMinutes + Math.round(durationHours * 60);
    const dayOffset = Math.floor(totalArr / (24 * 60));
    if (dayOffset === 0) return isoDate;
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
}

/**
 * Genera vuelos sintéticos para completar hasta MIN_FLIGHTS.
 *
 * @param {string} origin   - Código IATA origen
 * @param {string} destination - Código IATA destino
 * @param {string|null} isoDate - Fecha ISO (YYYY-MM-DD) o null
 * @param {number} realCount - Cuántos vuelos reales ya hay
 * @returns {Array} Array de objetos flight sintéticos
 */
export function generateSyntheticFlights(origin, destination, isoDate, realCount) {
    const needed = Math.max(0, MIN_FLIGHTS - realCount);
    if (needed === 0) return [];

    const seed = stringToSeed(`${origin}-${destination}-${isoDate || 'nodate'}`);
    const rand = makePrng(seed);
    const duration = estimateDuration(origin, destination);

    const flights = [];

    // Distribuir salidas a lo largo del día (06:00 → 23:00)
    const startMinute = 6 * 60;   // 06:00
    const endMinute = 23 * 60;  // 23:00
    const spread = endMinute - startMinute;

    for (let i = 0; i < needed; i++) {
        // Hora de salida pseudo-aleatoria pero distribuida
        const depMinutes = Math.round(startMinute + (rand() * spread));
        const depTime = minutesToTime(depMinutes);

        // Pequeña variación en duración (±30 min) para que no sean idénticos
        const variedDuration = duration + (rand() * 1.0 - 0.5);
        const arrTime = calcArrivalTime(depMinutes, variedDuration);
        const arrDate = calcArrivalDate(isoDate, depMinutes, variedDuration);

        // Número de vuelo: XT + 4 dígitos determinísticos
        const flightNum = String(Math.floor(rand() * 9000) + 1000);

        // Disponibilidad de clases (realista: J < C < Y << M)
        const classAvail = {
            J: Math.floor(rand() * 5) + 1,
            C: Math.floor(rand() * 8) + 2,
            Y: Math.floor(rand() * 30) + 10,
            B: Math.floor(rand() * 20) + 5,
            M: Math.floor(rand() * 25) + 5,
            H: Math.floor(rand() * 15) + 3,
        };

        flights.push({
            airline_code: SYNTHETIC_AIRLINE,
            flight_number: flightNum,
            departure_airport_code: origin,
            arrival_airport_code: destination,
            departure_date: isoDate,
            arrival_date: arrDate,
            departure_time: depTime,
            arrival_time: arrTime,
            duration_hours: parseFloat(variedDuration.toFixed(1)),
            equipment_code: pickAircraft(rand),
            class_availability: classAvail,
            departure_terminal: '',
            arrival_terminal: '',
            synthetic: true,   // marca para distinguirlos si se necesita
        });
    }

    // Ordenar por hora de salida
    return flights.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
}

/** Elegir un tipo de avión plausible */
function pickAircraft(rand) {
    const aircraft = ['738', '789', '77W', '320', '321', '333', '744', '32A', '359', '77L'];
    return aircraft[Math.floor(rand() * aircraft.length)];
}
