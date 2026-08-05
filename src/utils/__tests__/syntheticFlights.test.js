import { describe, expect, it } from 'vitest';
import { generateSyntheticFlights, getSyntheticCarrierPool } from '../commandParser/syntheticFlights';

describe('synthetic flight generation', () => {
  it('uses real route-aware airline codes instead of the old fictitious carrier', () => {
    const flights = generateSyntheticFlights('EZE', 'MAD', '2026-06-05', 0);
    const carriers = new Set(flights.map(flight => flight.airline_code));

    expect(flights).toHaveLength(10);
    expect(carriers.has('XT')).toBe(false);
    expect([...carriers].every(carrier => ['AR', 'IB'].includes(carrier))).toBe(true);
    expect(flights.every(flight => flight.synthetic && flight.trainingOnly)).toBe(true);
  });

  it('respects a plausible airline filter', () => {
    const flights = generateSyntheticFlights('BUE', 'MAD', '2026-06-05', 0, {
      preferredAirline: 'IB',
    });

    expect(flights).toHaveLength(10);
    expect(flights.every(flight => flight.airline_code === 'IB')).toBe(true);
  });

  it('does not synthesize an implausible airline filter for the route', () => {
    expect(getSyntheticCarrierPool('BUE', 'MAD', 'QR')).toEqual([]);
    expect(generateSyntheticFlights('BUE', 'MAD', '2026-06-05', 0, {
      preferredAirline: 'QR',
    })).toEqual([]);
  });
});
