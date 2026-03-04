// src/utils/__tests__/calculateArrival.test.js
import { describe, it, expect } from 'vitest';
import { calculateArrival } from '../flightUtils';

describe('calculateArrival', () => {
    it('vuelo mismo día', () => {
        const result = calculateArrival('2026-03-15', '10:00', 2.5);
        expect(result).toEqual({ arrival_date: '2026-03-15', arrival_time: '12:30' });
    });

    it('vuelo que cruza la medianoche (pasa al día siguiente)', () => {
        const result = calculateArrival('2026-03-15', '23:45', 2.0);
        expect(result).toEqual({ arrival_date: '2026-03-16', arrival_time: '01:45' });
    });

    it('vuelo largo de 12.5 horas desde las 23:45', () => {
        const result = calculateArrival('2026-03-15', '23:45', 12.5);
        expect(result).toEqual({ arrival_date: '2026-03-16', arrival_time: '12:15' });
    });

    it('duración 0 — llegada igual a salida', () => {
        const result = calculateArrival('2026-03-15', '10:00', 0);
        expect(result).toEqual({ arrival_date: '2026-03-15', arrival_time: '10:00' });
    });

    it('departureDate null — retorna strings vacíos sin lanzar', () => {
        const result = calculateArrival(null, '10:00', 2);
        expect(result).toEqual({ arrival_date: '', arrival_time: '' });
    });

    it('departureTime undefined — retorna strings vacíos sin lanzar', () => {
        const result = calculateArrival('2026-03-15', undefined, 2);
        expect(result).toEqual({ arrival_date: '', arrival_time: '' });
    });

    it('durationHours NaN — retorna strings vacíos sin lanzar', () => {
        const result = calculateArrival('2026-03-15', '10:00', NaN);
        expect(result).toEqual({ arrival_date: '', arrival_time: '' });
    });

    it('vuelo con minutos no nulos en duración (1.75h = 1h 45min)', () => {
        const result = calculateArrival('2026-06-01', '08:15', 1.75);
        expect(result).toEqual({ arrival_date: '2026-06-01', arrival_time: '10:00' });
    });

    it('vuelo que cruza fin de mes', () => {
        const result = calculateArrival('2026-01-31', '22:00', 3.0);
        expect(result).toEqual({ arrival_date: '2026-02-01', arrival_time: '01:00' });
    });

    it('vuelo que cruza fin de año', () => {
        const result = calculateArrival('2026-12-31', '22:00', 3.0);
        expect(result).toEqual({ arrival_date: '2027-01-01', arrival_time: '01:00' });
    });
});
