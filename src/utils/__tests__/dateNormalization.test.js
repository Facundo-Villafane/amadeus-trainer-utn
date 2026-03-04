// src/utils/__tests__/dateNormalization.test.js
import { describe, it, expect } from 'vitest';
import { normalizeDateToISO, normalizeLegacyDateToISO } from '../flightUtils';

describe('normalizeDateToISO (formato Amadeus DDMMM)', () => {
    it('15MAR — dentro de ventana válida (11 meses a futuro / 1 mes pasado)', () => {
        const result = normalizeDateToISO('15MAR');
        expect(result).toMatch(/^\d{4}-03-15$/);
    });

    it('1JAN — más de 1 mes atrás → año siguiente', () => {
        // Enero ya es más de 1 mes atrás desde marzo
        const result = normalizeDateToISO('1JAN');
        const year = parseInt(result.split('-')[0]);
        expect(year).toBeGreaterThanOrEqual(new Date().getFullYear());
        expect(result).toMatch(/^\d{4}-01-01$/);
    });

    it('31DEC', () => {
        const result = normalizeDateToISO('31DEC');
        expect(result).toMatch(/^\d{4}-12-31$/);
    });

    it('con año de 2 dígitos: 15MAR26 → 2026-03-15', () => {
        const result = normalizeDateToISO('15MAR26');
        expect(result).toBe('2026-03-15');
    });

    it('con año de 4 dígitos: 15MAR2026 → 2026-03-15', () => {
        const result = normalizeDateToISO('15MAR2026');
        expect(result).toBe('2026-03-15');
    });

    it('con alias español: 1ENE → enero', () => {
        const result = normalizeDateToISO('1ENE');
        expect(result).toMatch(/^\d{4}-01-01$/);
    });

    it('formato inválido retorna null', () => {
        expect(normalizeDateToISO('INVALID')).toBeNull();
        expect(normalizeDateToISO('')).toBeNull();
        expect(normalizeDateToISO(null)).toBeNull();
    });

    it('mes inválido retorna null', () => {
        expect(normalizeDateToISO('15XYZ')).toBeNull();
    });
});

describe('normalizeLegacyDateToISO (formatos legacy)', () => {
    it('formato D/M/YYYY', () => {
        expect(normalizeLegacyDateToISO('5/3/2026')).toBe('2026-03-05');
    });

    it('formato DD/MM/YYYY', () => {
        expect(normalizeLegacyDateToISO('15/03/2026')).toBe('2026-03-15');
    });

    it('formato D-M-YYYY', () => {
        expect(normalizeLegacyDateToISO('5-3-2026')).toBe('2026-03-05');
    });

    it('ya en formato ISO YYYY-MM-DD — retorna sin cambios', () => {
        expect(normalizeLegacyDateToISO('2026-03-15')).toBe('2026-03-15');
    });

    it('null retorna null', () => {
        expect(normalizeLegacyDateToISO(null)).toBeNull();
    });
});
