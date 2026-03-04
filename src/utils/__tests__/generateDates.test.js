// src/utils/__tests__/generateDates.test.js
import { describe, it, expect } from 'vitest';

// Extraemos la lógica pura de generateDates del EnhancedFlightScheduleGenerator
// para poder testearla independientemente.
function generateDates(startDate, endDate, selectedDays) {
    if (!startDate || !endDate) return [];

    // Parsear como fecha local (agregar T00:00:00 evita que JS los trate como UTC)
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const dates = [];

    const dayMap = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
    };

    const selectedDayNumbers = Object.entries(selectedDays)
        .filter(([, selected]) => selected)
        .map(([day]) => dayMap[day]);

    if (selectedDayNumbers.length === 0) return [];

    const current = new Date(start);
    while (current <= end) {
        if (selectedDayNumbers.includes(current.getDay())) {
            // Formatear como YYYY-MM-DD en hora local
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
        }
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

const allDays = {
    monday: true, tuesday: true, wednesday: true, thursday: true,
    friday: true, saturday: true, sunday: true,
};

const noDays = {
    monday: false, tuesday: false, wednesday: false, thursday: false,
    friday: false, saturday: false, sunday: false,
};

describe('generateDates', () => {
    it('rango de 7 días con todos los días seleccionados devuelve 7 fechas', () => {
        // 2026-03-02 es lunes
        const result = generateDates('2026-03-02', '2026-03-08', allDays);
        expect(result).toHaveLength(7);
    });

    it('rango de 7 días solo lunes devuelve 1 fecha', () => {
        // 2026-03-02 (lunes) al 2026-03-08 (domingo) → solo 1 lunes
        const result = generateDates('2026-03-02', '2026-03-08', { ...noDays, monday: true });
        expect(result).toHaveLength(1);
        expect(result[0]).toBe('2026-03-02');
    });

    it('rango de 14 días solo lunes devuelve 2 fechas', () => {
        const result = generateDates('2026-03-02', '2026-03-15', { ...noDays, monday: true });
        expect(result).toHaveLength(2);
        expect(result[0]).toBe('2026-03-02');
        expect(result[1]).toBe('2026-03-09');
    });

    it('sin días seleccionados retorna array vacío', () => {
        const result = generateDates('2026-03-02', '2026-03-08', noDays);
        expect(result).toHaveLength(0);
    });

    it('startDate mayor que endDate retorna array vacío', () => {
        const result = generateDates('2026-03-10', '2026-03-02', allDays);
        expect(result).toHaveLength(0);
    });

    it('startDate y endDate iguales con el día seleccionado devuelve 1 fecha', () => {
        // 2026-03-02 es lunes
        const result = generateDates('2026-03-02', '2026-03-02', { ...noDays, monday: true });
        expect(result).toHaveLength(1);
    });

    it('startDate y endDate iguales sin el día seleccionado devuelve 0', () => {
        // 2026-03-02 es lunes, buscamos martes
        const result = generateDates('2026-03-02', '2026-03-02', { ...noDays, tuesday: true });
        expect(result).toHaveLength(0);
    });

    it('retorna fechas en formato YYYY-MM-DD', () => {
        const result = generateDates('2026-03-02', '2026-03-08', allDays);
        result.forEach(date => {
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});
