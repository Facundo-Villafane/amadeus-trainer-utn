// src/utils/__tests__/parserUtils.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// paginationState usa import de módulo, necesitamos mockearlo para aislar el test
import { vi } from 'vitest';

vi.mock('../commandParser/paginationState', () => ({
    default: {
        currentCommand: '',
        commandType: '',
        dateStr: null,
        origin: null,
        destination: null,
        options: null,
        lastVisible: null,
        previousPages: [],
        pageSize: 5,
        currentResults: [],
        currentIndex: 1,
    }
}));

import { parseANCommand, parseSNCommand, parseTNCommand, parseOptions } from '../commandParser/parserUtils';

describe('parseANCommand', () => {
    it('comando completo con fecha', () => {
        const result = parseANCommand('AN15MARBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('BUE');
        expect(result.destination).toBe('MAD');
        expect(result.dateStr).toBe('15MAR');
    });

    it('comando sin fecha', () => {
        const result = parseANCommand('ANBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('BUE');
        expect(result.destination).toBe('MAD');
        expect(result.dateStr).toBeNull();
    });

    it('con opción de aerolínea /AAR', () => {
        const result = parseANCommand('AN15MARBUEMAD/AAR');
        expect(result.isValid).toBe(true);
        expect(result.options).toBe('/AAR');
    });

    it('con día de 1 dígito', () => {
        const result = parseANCommand('AN5MARBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.dateStr).toBe('5MAR');
    });

    it('destino incompleto — isValid false', () => {
        const result = parseANCommand('ANBUEMA');
        expect(result.isValid).toBe(false);
    });

    it('formato completamente inválido', () => {
        const result = parseANCommand('HELLO');
        expect(result.isValid).toBe(false);
    });
});

describe('parseSNCommand', () => {
    it('comando correcto', () => {
        const result = parseSNCommand('SN15MARBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('BUE');
        expect(result.destination).toBe('MAD');
    });

    it('sin fecha', () => {
        const result = parseSNCommand('SNBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.dateStr).toBeNull();
    });
});

describe('parseTNCommand', () => {
    it('comando correcto', () => {
        const result = parseTNCommand('TNBUEMAD');
        expect(result.isValid).toBe(true);
        expect(result.origin).toBe('BUE');
        expect(result.destination).toBe('MAD');
    });
});

describe('parseOptions', () => {
    it('/AAR extrae aerolínea AR', () => {
        const { airline } = parseOptions('/AAR');
        expect(airline).toBe('AR');
    });

    it('/CY extrae clase Y', () => {
        const { flightClass } = parseOptions('/CY');
        expect(flightClass).toBe('Y');
    });

    it('sin opciones retorna vacíos', () => {
        const result = parseOptions('');
        expect(result.airline).toBe('');
        expect(result.flightClass).toBe('');
    });
});
