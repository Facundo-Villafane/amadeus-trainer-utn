#!/usr/bin/env node
// scripts/build-airports-json.mjs
// Converts airports-extended.dat → public/data/airports.json
// Keeps only airports with valid IATA codes and strips unused fields.
// Run once at build time: node scripts/build-airports-json.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SRC = join(root, 'src', 'data', 'airports-extended.dat');
const DEST = join(root, 'public', 'data', 'airports.json');

// Columns in airports-extended.dat:
// 0:id  1:name  2:city  3:country  4:IATA  5:ICAO
// 6:lat 7:lon   8:alt   9:tz_offset 10:dst 11:tz  12:type  13:source

const raw = readFileSync(SRC, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// We'll group airports by city to provide multi-airport cities (e.g. London)
const cityMap = {}; // cityKey → { code, name, countryCode, airports[] }

let totalKept = 0;

for (const line of lines) {
    // CSV parsing respecting quoted fields
    const cols = parseCsvLine(line);
    if (!cols || cols.length < 13) continue;

    const iata = cols[4];
    const type = cols[12];

    // Skip airports without IATA code or non-airport types
    if (!iata || iata === '\\N' || iata === '' || iata === 'N') continue;
    if (type !== 'airport') continue;

    const name = cols[1];
    const city = cols[2];
    const country = cols[3];

    // Derive 2-letter country code from country name using a small map
    // (OpenFlights uses full country names, not ISO codes in columns)
    // We'll store the full name and let the service handle it
    const cityKey = `${city}||${country}`;

    if (!cityMap[cityKey]) {
        cityMap[cityKey] = {
            city,
            country,
            airports: [],
        };
    }

    cityMap[cityKey].airports.push({ iata, name });
    totalKept++;
}

// Convert to array sorted by city name for binary search potential
const result = Object.values(cityMap)
    .sort((a, b) => a.city.localeCompare(b.city));

mkdirSync(join(root, 'public', 'data'), { recursive: true });
writeFileSync(DEST, JSON.stringify(result), 'utf8');

const destSizeKB = Math.round(readFileSync(DEST).length / 1024);
console.log(`✅ airports.json written to public/data/`);
console.log(`   Airports kept (have IATA): ${totalKept}`);
console.log(`   Unique city groups:        ${result.length}`);
console.log(`   File size:                 ${destSizeKB} KB`);

// ── CSV parser that handles quoted fields ──────────────────────────────────
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}
