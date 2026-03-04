#!/usr/bin/env node
// scripts/build-airlines-json.mjs
// Converts airlines.dat → public/data/airlines.json
// Keeps only airlines with a valid 2-letter IATA code.
// Run once at build time: node scripts/build-airlines-json.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SRC = join(root, 'src', 'data', 'airlines.dat');
const DEST = join(root, 'public', 'data', 'airlines.json');

// Columns in airlines.dat:
// 0:id  1:name  2:alias  3:IATA(2-letter)  4:ICAO(3-letter)
// 5:callsign  6:country  7:active("Y"/"N")

const raw = readFileSync(SRC, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

const airlines = [];

for (const line of lines) {
    const cols = parseCsvLine(line);
    if (!cols || cols.length < 7) continue;

    const iata = cols[3];
    const name = cols[1];
    const country = cols[6];

    // Keep only airlines with a valid 2-letter IATA code
    if (!iata || iata === '\\N' || iata === '' || iata.length !== 2) continue;
    if (!name || name === '\\N') continue;

    airlines.push({
        iata,
        name,
        country,
    });
}

// Sort by airline name for readability (binary search not needed at this scale)
airlines.sort((a, b) => a.name.localeCompare(b.name));

mkdirSync(join(root, 'public', 'data'), { recursive: true });
writeFileSync(DEST, JSON.stringify(airlines), 'utf8');

const sizeKB = Math.round(readFileSync(DEST).length / 1024);
console.log(`✅ airlines.json written to public/data/`);
console.log(`   Airlines kept (have IATA): ${airlines.length}`);
console.log(`   File size:                 ${sizeKB} KB`);

// ── CSV parser (handles quoted fields) ────────────────────────────────────────
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += ch; }
    }
    result.push(current.trim());
    return result;
}
