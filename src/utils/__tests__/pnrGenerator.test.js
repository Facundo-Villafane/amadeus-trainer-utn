import { describe, it, expect } from 'vitest';
import { generateAirlineLocator, getSegmentAirlineLocator, validatePNR } from '../pnrGenerator';

describe('generateAirlineLocator', () => {
    it('returns a valid 6-char locator', () => {
        expect(validatePNR(generateAirlineLocator('DBDKGB', 'IB'))).toBe(true);
    });

    it('is stable for the same PNR and airline', () => {
        expect(generateAirlineLocator('DBDKGB', 'IB')).toBe(generateAirlineLocator('DBDKGB', 'IB'));
    });

    it('differs from the Mozart locator', () => {
        expect(generateAirlineLocator('DBDKGB', 'IB')).not.toBe('DBDKGB');
    });

    it('differs per airline and per PNR', () => {
        expect(generateAirlineLocator('DBDKGB', 'IB')).not.toBe(generateAirlineLocator('DBDKGB', 'AR'));
        expect(generateAirlineLocator('DBDKGB', 'IB')).not.toBe(generateAirlineLocator('XK4P2Q', 'IB'));
    });
});

describe('getSegmentAirlineLocator', () => {
    const segment = { airline_code: 'IB', status: 'HK' };

    it('shows AIRLINE/LOCATOR for a saved PNR with an HK segment', () => {
        expect(getSegmentAirlineLocator({ recordLocator: 'DBDKGB' }, segment))
            .toBe(`IB/${generateAirlineLocator('DBDKGB', 'IB')}`);
    });

    it('returns null for unsaved PNRs or unconfirmed segments', () => {
        expect(getSegmentAirlineLocator({}, segment)).toBeNull();
        expect(getSegmentAirlineLocator({ recordLocator: 'TEMP12' }, segment)).toBeNull();
        expect(getSegmentAirlineLocator({ recordLocator: 'DBDKGB' }, { ...segment, status: 'DK' })).toBeNull();
    });
});
