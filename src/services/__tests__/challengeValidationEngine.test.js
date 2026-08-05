import { describe, expect, it } from 'vitest';
import {
    checkHasContactEmail,
    checkHasContactPhone,
    checkHasTicketing,
    checkPassengerHasDocument,
    checkSegmentRoute,
    checkSsrExists,
    evaluateRules,
} from '../challengeValidationEngine';

const basePnr = {
    passengers: [
        { firstName: 'JUAN', lastName: 'PEREZ', type: 'ADT' },
        { firstName: 'MARTA', lastName: 'GOMEZ', type: 'ADT' },
    ],
    segments: [
        { origin: 'EZE', destination: 'MAD', departureDate: '2026-11-15', airline_code: 'IB' },
        { origin: 'MAD', destination: 'EZE', departureDate: '20NOV', airline_code: 'IB' },
    ],
    contacts: [
        { city: 'BUE', phone: '1135877344', type: 'O', passengerNumber: 1 },
    ],
    emailContacts: [
        { email: 'juan@example.com', passengerNumber: 1 },
    ],
    ticketing: { type: 'TL' },
    ssrElements: [
        { code: 'WCHR', airlineCode: 'IB', passengerNumber: 2, segmentNumber: 4, segmentIndex: 1 },
        { code: 'FOID', airlineCode: 'IB', docType: 'PP', docNumber: '12345678', passengerNumber: 1 },
        { code: 'CTCE', airlineCode: 'IB', message: 'juan//example.com', passengerNumber: 1 },
        { code: 'RQST', airlineCode: 'IB', message: 'EZEMAD/24A,P1', passengerNumber: 1, segmentNumber: 3, segmentIndex: 0, seatInfo: { P1: '24A' } },
    ],
};

describe('challengeValidationEngine', () => {
    it('validates segment routes with Amadeus and ISO dates', () => {
        expect(checkSegmentRoute(basePnr, { origin: 'EZE', destination: 'MAD', date: '15NOV' })).toBe(true);
        expect(checkSegmentRoute(basePnr, { origin: 'MAD', destination: 'EZE', date: '2026-11-20' })).toBe(true);
    });

    it('validates SSR by passenger, segment and message content', () => {
        expect(checkSsrExists(basePnr, { code: 'WCHR', passengerNumber: 2, segmentNumber: 2 })).toBe(true);
        expect(checkSsrExists(basePnr, { code: 'RQST', passengerNumber: 1, segmentNumber: 1, messageContains: '24A' })).toBe(true);
        expect(checkSsrExists(basePnr, { code: 'WCHR', passengerNumber: 1 })).toBe(false);
    });

    it('validates FOID by passenger and document details', () => {
        expect(checkPassengerHasDocument(basePnr, { passengerNumber: 1, docType: 'PP', docNumber: '1234' })).toBe(true);
        expect(checkPassengerHasDocument(basePnr, { passengerNumber: 2, docType: 'PP' })).toBe(false);
    });

    it('validates passenger-scoped contacts', () => {
        expect(checkHasContactPhone(basePnr, { passengerNumber: 1, contains: '3587' })).toBe(true);
        expect(checkHasContactPhone(basePnr, { passengerNumber: 2 })).toBe(false);
        expect(checkHasContactEmail(basePnr, { passengerNumber: 1, contains: 'example' })).toBe(true);
    });

    it('supports ticketingType and legacy type_value for ticketing checks', () => {
        expect(checkHasTicketing(basePnr, { type: 'has_ticketing', ticketingType: 'TL' })).toBe(true);
        expect(checkHasTicketing(basePnr, { type: 'has_ticketing', type_value: 'TL' })).toBe(true);
        expect(checkHasTicketing(basePnr, { type: 'has_ticketing', ticketingType: 'OK' })).toBe(false);
    });

    it('evaluates mixed rule reports deterministically', () => {
        const report = evaluateRules(basePnr, [
            { type: 'segment_count', min: 2, max: 2 },
            { type: 'has_ticketing', ticketingType: 'TL' },
            { type: 'ssr_exists', code: 'VGML' },
        ]);

        expect(report.isPass).toBe(false);
        expect(report.passed).toHaveLength(2);
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].type).toBe('ssr_exists');
    });
});
