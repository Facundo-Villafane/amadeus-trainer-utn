// src/pages/Docs.jsx
// Technical documentation — sidebar layout (ReadTheDocs / Docusaurus style)
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
    FiTerminal, FiDatabase, FiCode, FiLayers, FiZap,
    FiMail, FiChevronDown, FiChevronRight, FiBook,
    FiAward, FiShield, FiTrendingUp, FiGlobe, FiMenu, FiX,
} from 'react-icons/fi';
import { FaUniversity } from 'react-icons/fa';

// ── Navigation tree ───────────────────────────────────────────────────────────
const NAV = [
    {
        section: 'Getting Started',
        items: [
            { id: 'overview', label: 'Overview' },
            { id: 'how-it-works', label: 'How it works' },
        ],
    },
    {
        section: 'Command Reference',
        items: [
            { id: 'cmd-availability', label: 'Availability (AN/SN/TN)' },
            { id: 'cmd-pnr-creation', label: 'PNR Creation' },
            { id: 'cmd-pnr-retrieval', label: 'PNR Retrieval & Changes' },
            { id: 'cmd-services', label: 'Special Services & Remarks' },
            { id: 'cmd-seats', label: 'Seat Map & Assignment' },
            { id: 'cmd-encode', label: 'Encode / Decode' },
            { id: 'cmd-navigation', label: 'Navigation & Help' },
        ],
    },
    {
        section: 'Gamification',
        items: [
            { id: 'xp-values', label: 'XP Values' },
            { id: 'level-table', label: 'Level Table' },
            { id: 'achievements', label: 'Achievements' },
            { id: 'anti-farming', label: 'Anti-farming Rules' },
            { id: 'legacy', label: 'Legacy Cohorts' },
        ],
    },
    {
        section: 'Platform',
        items: [
            { id: 'tech-stack', label: 'Tech Stack' },
            { id: 'data-pipeline', label: 'Data Pipeline' },
            { id: 'architecture', label: 'Architecture Notes' },
        ],
    },
];

// ── Content sections ──────────────────────────────────────────────────────────
const SECTIONS = {
    // Getting Started
    overview: {
        title: 'Overview',
        content: () => (
            <div className="prose-section">
                <p className="lead">Mozart Trainer is a GDS (Global Distribution System) training platform built for students of the <strong>Tecnicatura Universitaria en Gestión Aeronáutica at UTN</strong>.</p>
                <p>It simulates a real Amadeus/Mozart terminal environment with identical command syntax, so students can practice ticketing and reservations workflows before handling live systems.</p>
                <Callout type="info" title="Who is this for?">
                    Students enrolled in the <em>Billetaje y Reservas</em> course. Access is granted via commission code by the instructor.
                </Callout>
                <h3>What you can do</h3>
                <ul>
                    <li>Search flight availability by route and date</li>
                    <li>Build complete PNRs from segment sell to end transaction</li>
                    <li>Practice without affecting real inventory or real passengers</li>
                    <li>Track your progress, earn XP, and unlock achievements</li>
                    <li>Compare performance with classmates on the leaderboard</li>
                </ul>
            </div>
        ),
    },
    'how-it-works': {
        title: 'How it works',
        content: () => (
            <div className="prose-section">
                <p className="lead">The terminal accepts text commands, parses them server-side, and returns formatted responses — just like a real GDS screen.</p>
                <h3>Session flow</h3>
                <ol>
                    <li>Log in with your student credentials (provisioned by your instructor)</li>
                    <li>Type commands in the terminal — the system uppercases automatically</li>
                    <li>XP is awarded (or deducted) in real time for each command</li>
                    <li>PNRs are saved to Firestore and visible to your instructor</li>
                </ol>
                <h3>Synthetic flights</h3>
                <p>On dates with no manually loaded flights, the system generates synthetic availability so you always find results to practice with. Synthetic carriers use the prefix <code>ZZ</code> and are clearly labeled.</p>
                <Callout type="warning" title="Practice environment">
                    Nothing you do here affects real airline inventory. The environment is completely isolated from production systems.
                </Callout>
            </div>
        ),
    },

    // Commands
    'cmd-availability': {
        title: 'Availability (AN / SN / TN)',
        content: () => (
            <div className="prose-section">
                <p className="lead">Query flight availability, schedules, and timetables for a given route and date.</p>
                <CommandBlock cmd="AN DDMMMORGDST" example="AN 05JUNBUEBCN" desc="Display available flights. Results are paginated — use MD/U to navigate." />
                <CommandBlock cmd="SN DDMMMORGDST" example="SN 05JUNBUEBCN" desc="Display published schedules. Shows carrier schedules rather than real-time seats." />
                <CommandBlock cmd="TN DDMMMORGDST" example="TN 05JUNBUEBCN" desc="Display timetable frequencies." />
                <Callout type="info" title="Date format">
                    Use <code>DDMMM</code> — e.g. <code>05JUN</code>, <code>14DEC</code>. The system accepts 2-digit days and 3-letter month codes (JAN–DEC).
                </Callout>
                <h3>Reading the response</h3>
                <TerminalBlock>{`AN 05JUNBUEBCN
** MOZART AVAILABILITY - 05 JUN WED BUE BCN **
  1 AR 1130    BUE 10:30  BCN 06:30+1  S4 Y4 B4 H4 Q4
  2 IB 6844    BUE 12:00  BCN 09:15+1  J2 C2 D0 Y4 B4`}</TerminalBlock>
                <p>Each line shows: line number, carrier + flight, origin time, destination time, booking classes with seats available.</p>
            </div>
        ),
    },
    'cmd-pnr-creation': {
        title: 'PNR Creation',
        content: () => (
            <div className="prose-section">
                <p className="lead">A PNR (Passenger Name Record) is built by entering a sequence of mandatory elements. The minimum required fields are: segment, passenger name, phone contact, received-from, and end transaction.</p>
                <CommandBlock cmd="SS N C L" example="SS1Y1" desc="Sell N seats in class C from line L of the last availability display." />
                <CommandBlock cmd="NM N LAST/FIRST" example="NM1GARCIA/MARIA" desc="Add N passengers. First passenger = NM1, two passengers = NM2LAST1/FIRST1 + repeat." />
                <CommandBlock cmd="AP PHONE" example="AP 1123456789" desc="Add contact phone. Required before ET." />
                <CommandBlock cmd="APE EMAIL" example="APE PAX@EMAIL.COM" desc="Add contact email." />
                <CommandBlock cmd="RF AGENT" example="RF VILLAFANE" desc="Received from — who requested the booking. Required before ET." />
                <CommandBlock cmd="TK TL" example="TK TL" desc="Set ticketing time limit." />
                <CommandBlock cmd="ET" example="ET" desc="End Transaction — saves the PNR and generates a permanent record locator." />
                <CommandBlock cmd="ER" example="ER" desc="End and Retrieve — saves and immediately displays the finalized PNR." />
                <Callout type="warning" title="Anti-farming cooldown">
                    A minimum of 3 minutes between PNRs is required to earn XP. PNRs completed in under 30 seconds receive a −5 XP penalty. See <a href="#anti-farming" className="text-amadeus-primary hover:underline">Anti-farming Rules</a>.
                </Callout>
            </div>
        ),
    },
    'cmd-pnr-retrieval': {
        title: 'PNR Retrieval & Changes',
        content: () => (
            <div className="prose-section">
                <CommandBlock cmd="RT LOCATOR" example="RT ABC123" desc="Retrieve a saved PNR by its 6-character record locator." />
                <CommandBlock cmd="XE N" example="XE 3" desc="Delete element N from the active PNR (shown in the RT display)." />
                <CommandBlock cmd="XI" example="XI" desc="Cancel the PNR. Requires confirmation with RF before taking effect." />
            </div>
        ),
    },
    'cmd-services': {
        title: 'Special Services & Remarks',
        content: () => (
            <div className="prose-section">
                <CommandBlock cmd="OS YY INFO" example="OS YY VEGAN PAX" desc="Other Service Information — sent to all carriers." />
                <CommandBlock cmd="SR SSSG1 .TEXT" example="SR VGML S1" desc="Special Service Request — sent to a specific carrier segment." />
                <CommandBlock cmd="SR FOID PP.../NUM" example="SR FOID PP12345678/1" desc="Add passport/ID to passenger N." />
                <CommandBlock cmd="RM TEXT" example="RM PLEASE REISSUE" desc="General remark — visible to all parties." />
                <CommandBlock cmd="RC TEXT" example="RC INTERNAL NOTE" desc="Confidential remark — not transmitted to carriers." />
                <CommandBlock cmd="RIR TEXT" example="RIR ITINERARY NOTE" desc="Itinerary remark." />
            </div>
        ),
    },
    'cmd-seats': {
        title: 'Seat Map & Assignment',
        content: () => (
            <div className="prose-section">
                <CommandBlock cmd="SM N" example="SM 1" desc="Display the seat map for segment N of the active PNR." />
                <CommandBlock cmd="ST N ROW+SEAT/PAX" example="ST 1 12A/1" desc="Assign seat ROW+SEAT on segment N to passenger PAX." />
                <TerminalBlock>{`SM 1
SEAT MAP - AR1130 - ECONOMY CLASS
ROW  A  B  C    D  E  F
 10  X  X  .    .  X  .
 11  .  .  .    X  .  .
 12  .  X  .    .  .  X
(X=occupied  .=available)`}</TerminalBlock>
            </div>
        ),
    },
    'cmd-encode': {
        title: 'Encode / Decode',
        content: () => (
            <div className="prose-section">
                <p className="lead">Convert between city/airport names and IATA codes, and look up airline codes. Data is sourced from the OpenFlights database (1,500+ airports, 1,500+ airlines).</p>
                <CommandBlock cmd="DAN CITY NAME" example="DAN BUENOS AIRES" desc="Find the IATA code for a city. Supports partial name search." />
                <CommandBlock cmd="DNA CODE" example="DNA BUE" desc="Decode an IATA city/airport code to its full name and country." />
                <CommandBlock cmd="DAL AIRLINE NAME" example="DAL AEROLINEAS" desc="Find the IATA 2-letter code for an airline. Partial search supported." />
            </div>
        ),
    },
    'cmd-navigation': {
        title: 'Navigation & Help',
        content: () => (
            <div className="prose-section">
                <CommandBlock cmd="MD / M" example="MD" desc="Move Down — scroll to the next page of results." />
                <CommandBlock cmd="U" example="U" desc="Move Up — scroll back to the previous page." />
                <CommandBlock cmd="HE TOPIC" example="HE AN" desc="Display help text for a command or topic. HE alone shows the full index." />
            </div>
        ),
    },

    // Gamification
    'xp-values': {
        title: 'XP Values',
        content: () => (
            <div className="prose-section">
                <p className="lead">XP is awarded and deducted automatically for every action. The floor is always 0 — XP cannot go negative.</p>
                <table className="doc-table">
                    <thead><tr><th>Action</th><th>XP</th><th>Notes</th></tr></thead>
                    <tbody>
                        {[
                            ['Command success', '+3', 'Every valid command'],
                            ['Command error', '−2', 'Invalid commands. Floor at 0.'],
                            ['PNR completed (≥3 min)', '+30', 'Full reward when cooldown is respected'],
                            ['PNR completed (<3 min)', '0', 'Cooldown hit — no XP, no penalty'],
                            ['PNR completed (<30 sec)', '−5', 'Spam detection penalty'],
                            ['PNR validation error', '−3', 'Attempting ET with incomplete PNR'],
                            ['Daily streak (days 2–7)', '+10', 'Per consecutive login day'],
                            ['Achievement unlock', 'varies', 'Each achievement awards its own bonus'],
                        ].map(([a, x, n]) => (
                            <tr key={a}>
                                <td className="font-medium">{a}</td>
                                <td className={`font-mono font-bold ${x.startsWith('+') ? 'text-green-600' : x === '0' ? 'text-gray-400' : 'text-red-500'}`}>{x}</td>
                                <td className="text-gray-500">{n}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    'level-table': {
        title: 'Level Table',
        content: () => (
            <div className="prose-section">
                <p className="lead">20 levels with gender-neutral titles. The title is displayed in the user profile and on the leaderboard.</p>
                <table className="doc-table">
                    <thead><tr><th>Level</th><th>Title</th><th>XP Required</th></tr></thead>
                    <tbody>
                        {[
                            [1, 'Cadete', 0], [2, 'Aprendiz/a', 150], [3, 'Auxiliar', 400], [4, 'Asistente', 800],
                            [5, 'Agente', 1400], [6, 'Agente Senior', 2200], [7, 'Consultor/a', 3200], [8, 'Consultor/a Senior', 4500],
                            [9, 'Especialista', 6200], [10, 'Especialista Senior', 8500], [11, 'Analista', 11500], [12, 'Analista Senior', 15000],
                            [13, 'Supervisor/a', 19500], [14, 'Inspector/a', 25000], [15, 'Ejecutivo/a', 32000], [16, 'Gerente', 40000],
                            [17, 'Director/a', 50000], [18, 'VP de Reservas', 65000], [19, 'GM Amadeus', 85000], [20, 'Leyenda', 110000],
                        ].map(([lv, title, xp]) => (
                            <tr key={lv} className={lv === 20 ? 'font-bold text-amber-600' : ''}>
                                <td className="text-gray-500">{lv}</td>
                                <td>{title}</td>
                                <td className="font-mono">{xp.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    achievements: {
        title: 'Achievements',
        content: () => (
            <div className="prose-section">
                <p className="lead">Over 40 achievements across 5 rarity tiers. Each unlocked achievement displays its icon and XP bonus in the user profile.</p>
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {[['COMMON', 'gray-400', 'Común'], ['UNCOMMON', 'green-500', 'Poco común'], ['RARE', 'blue-500', 'Raro'], ['EPIC', 'purple-500', 'Épico'], ['LEGENDARY', 'amber-500', 'Legendario']].map(([k, c, l]) => (
                        <div key={k} className={`border-2 border-${c} rounded-lg p-2 text-center text-xs font-semibold text-${c}`}>{l}</div>
                    ))}
                </div>
                <p>Secret achievements show only a <em>hint</em> before unlocking — the name and description are revealed once earned. Honorary achievements (like <strong>Pionero/a</strong>) are auto-awarded and cannot be farmed.</p>
                <h3>Categories</h3>
                <table className="doc-table">
                    <thead><tr><th>Category</th><th>Examples</th></tr></thead>
                    <tbody>
                        {[
                            ['Progress', 'Primer PNR, Dominio del Terminal, Nivel 10, Nivel 20'],
                            ['Precision', 'Sesión Perfecta, Precisión (20 comandos sin errores)'],
                            ['Daily streaks', 'Constancia (3 días), Racha Semanal (7), El Mes Perfecto (30)'],
                            ['Exploration', 'El/La Explorador/a (20 destinos), La Vuelta al Mundo'],
                            ['Time-based', 'Night Owl, Early Bird, Marathon, Coffee Break'],
                            ['Secret / Easter eggs', 'The Answer (42 comandos), Lucky Seven, Binary Master, ...'],
                            ['Honorary', 'Pionero/a (camadas anteriores — auto-awarded)'],
                        ].map(([cat, ex]) => (
                            <tr key={cat}><td className="font-medium">{cat}</td><td className="text-gray-500 text-sm">{ex}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    'anti-farming': {
        title: 'Anti-farming Rules',
        content: () => (
            <div className="prose-section">
                <p className="lead">The XP system is designed so that only genuine practice counts. Several mechanisms prevent rapid XP accumulation through mechanical repetition.</p>
                <h3>PNR cooldown</h3>
                <ul>
                    <li><strong>Less than 3 minutes</strong> since the last PNR → 0 XP (no penalty, just no reward)</li>
                    <li><strong>Less than 30 seconds</strong> since the last PNR → −5 XP spam penalty</li>
                    <li>Cooldown timestamps are persisted in Firestore — relaunching the browser does not bypass them</li>
                </ul>
                <h3>Command spam</h3>
                <ul>
                    <li>The same command repeated more than 5 times within 60 seconds → no XP from the 6th repetition onward</li>
                </ul>
                <h3>Error penalty</h3>
                <ul>
                    <li>Every invalid command → −2 XP</li>
                    <li>Every PNR validation error (attempting ET with missing fields) → −3 XP</li>
                    <li>XP floor is always 0 — it cannot go negative</li>
                </ul>
                <Callout type="info" title="Why this matters">
                    Without these rules, students could script PNR creation in a loop to quickly reach high levels. The goal is to reward genuine daily practice, not automation.
                </Callout>
            </div>
        ),
    },
    legacy: {
        title: 'Legacy Cohorts',
        content: () => (
            <div className="prose-section">
                <p className="lead">Students from previous academic cohorts are automatically identified and visually distinguished on the leaderboard.</p>
                <h3>Detection mechanism</h3>
                <p>Each user document in Firestore has a <code>commissionCode</code> field. If that code belongs to a commission marked <code>active: false</code> in the <code>commissions</code> collection, the user is classified as legacy.</p>
                <h3>Effects</h3>
                <ul>
                    <li>Auto-awarded the honorary <strong>Pionero/a</strong> achievement on next login (0 XP, Legendary rarity)</li>
                    <li>Leaderboard: row rendered in muted gray, name blurred by default (visible on hover for privacy)</li>
                    <li>Active students can filter the leaderboard to show only their current cohort</li>
                    <li>Legacy XP and achievements are fully preserved — no data is removed</li>
                </ul>
                <Callout type="info" title="No data changes required">
                    Legacy detection is a read-time operation. No existing user documents are modified — the flag is computed when the leaderboard loads.
                </Callout>
            </div>
        ),
    },

    // Platform
    'tech-stack': {
        title: 'Tech Stack',
        content: () => (
            <div className="prose-section">
                <table className="doc-table">
                    <thead><tr><th>Technology</th><th>Role</th></tr></thead>
                    <tbody>
                        {[
                            ['React 19 + Vite', 'Frontend framework and build tool'],
                            ['Firebase Firestore', 'NoSQL real-time database for PNRs, users, commissions, XP'],
                            ['Firebase Auth', 'Email/password authentication, role-based access (admin / student)'],
                            ['Tailwind CSS', 'Utility-first CSS framework'],
                            ['React Router v7', 'Client-side routing and protected routes'],
                            ['react-icons/fi', 'Icon library (Feather Icons) — used throughout the UI'],
                            ['react-hot-toast', 'Toast notifications for non-XP system messages'],
                            ['OpenFlights data', 'airports.json + airlines.json built from .dat files at deploy time'],
                            ['Playwright', 'End-to-end testing'],
                            ['Render', 'Deployment platform'],
                        ].map(([t, r]) => <tr key={t}><td className="font-medium">{t}</td><td className="text-gray-500">{r}</td></tr>)}
                    </tbody>
                </table>
            </div>
        ),
    },
    'data-pipeline': {
        title: 'Data Pipeline',
        content: () => (
            <div className="prose-section">
                <p className="lead">Airport and airline data is processed at build time from OpenFlights CSV files into lean JSON indexes. This keeps the runtime bundle small and lookups O(1).</p>
                <TerminalBlock>{`# package.json
"prebuild": "node scripts/build-airports-json.mjs && node scripts/build-airlines-json.mjs"

# scripts/build-airports-json.mjs
# Input:  data/airports-extended.dat  (1.6 MB, 14,000+ airports)
# Output: public/data/airports.json   (628 KB, IATA codes only)

# scripts/build-airlines-json.mjs
# Input:  data/airlines.dat           (raw OpenFlights)
# Output: public/data/airlines.json   (91 KB, 1,533 airlines)`}</TerminalBlock>
                <p>Both files are loaded lazily on first use and indexed in-memory:</p>
                <ul>
                    <li>Airports: indexed by <code>iataCode</code>, <code>city</code> name, and <code>cityCode</code></li>
                    <li>Airlines: indexed by <code>iataCode</code> and lowercase <code>name</code> for partial search</li>
                    <li>Fallback: a small hardcoded set of key airports/airlines is used if the JSON fails to load</li>
                </ul>
            </div>
        ),
    },
    architecture: {
        title: 'Architecture Notes',
        content: () => (
            <div className="prose-section">
                <h3>XP Event Bus</h3>
                <p>XP notifications flow through a lightweight singleton pub/sub module (<code>xpEventBus.js</code>), avoiding React prop drilling entirely:</p>
                <TerminalBlock>{`experienceService  ──emit──►  xpEventBus  ──subscribe──►  XpToastManager (App.jsx)
                                                              └─► XpToastContainer
                                                              └─► LevelUpModal`}</TerminalBlock>
                <h3>experienceService singleton</h3>
                <p>All XP logic lives in a single class instance exported as a default. It manages:</p>
                <ul>
                    <li>Anti-farming state (persisted to Firestore across sessions)</li>
                    <li>Achievement unlock checks after every action</li>
                    <li>Legacy cohort detection via <code>commissions</code> query</li>
                    <li>Daily streak tracking with XP bonus emission</li>
                </ul>
                <h3>commandParser</h3>
                <p>A flat <code>async function commandParser(cmd, userId)</code> that routes commands to their handlers and calls <code>experienceService</code> methods. Returns a plain string response — all XP events flow out-of-band via the event bus.</p>
                <h3>Synthetic flights</h3>
                <p>If Firestore returns 0 flights for a queried date, <code>generateSyntheticFlights()</code> produces realistic fake entries using the <code>ZZ</code> carrier prefix. Seeded by the route+date hash for consistency.</p>
            </div>
        ),
    },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function CommandBlock({ cmd, example, desc }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-3">
                <code className="text-green-400 font-mono text-sm">{cmd}</code>
            </div>
            <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 mb-2">{desc}</p>
                <p className="text-xs text-gray-400">
                    Example: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">{example}</code>
                </p>
            </div>
        </div>
    );
}

function TerminalBlock({ children }) {
    return (
        <pre className="bg-gray-900 text-green-400 text-xs font-mono rounded-xl px-5 py-4 overflow-x-auto my-4 leading-relaxed">
            {children}
        </pre>
    );
}

function Callout({ type, title, children }) {
    const styles = {
        info: 'bg-blue-50 border-blue-300 text-blue-900',
        warning: 'bg-amber-50 border-amber-300 text-amber-900',
        tip: 'bg-green-50 border-green-300 text-green-900',
    };
    return (
        <div className={`border-l-4 rounded-r-lg px-4 py-3 my-4 text-sm ${styles[type] || styles.info}`}>
            {title && <p className="font-semibold mb-1">{title}</p>}
            <div>{children}</div>
        </div>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onSelect, mobile, onClose }) {
    return (
        <nav className={mobile ? 'p-4' : 'py-8 px-4'}>
            {mobile && (
                <div className="flex justify-between items-center mb-4">
                    <span className="font-leckerli text-amadeus-primary text-xl">Mozart</span>
                    <button onClick={onClose}><FiX size={20} className="text-gray-500" /></button>
                </div>
            )}
            {NAV.map(group => (
                <div key={group.section} className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">{group.section}</p>
                    <ul className="space-y-0.5">
                        {group.items.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => { onSelect(item.id); if (onClose) onClose(); }}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${active === item.id
                                            ? 'bg-amadeus-primary text-white font-medium'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Docs() {
    const [activeId, setActiveId] = useState('overview');
    const [mobileOpen, setMobileOpen] = useState(false);
    const section = SECTIONS[activeId] || SECTIONS.overview;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top bar */}
            <header className="h-14 bg-amadeus-dark flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-30 shadow">
                <button
                    className="sm:hidden text-gray-400 hover:text-white"
                    onClick={() => setMobileOpen(true)}
                >
                    <FiMenu size={20} />
                </button>
                <Link to="/" className="text-white font-leckerli font-light text-xl tracking-wide">Mozart</Link>
                <span className="text-gray-600 text-sm hidden sm:inline">/</span>
                <span className="text-gray-400 text-sm hidden sm:inline">Documentation</span>
                <div className="ml-auto flex items-center gap-3">
                    <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
                    <a
                        href="mailto:favillafane@gmail.com"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
                    >
                        <FiMail size={12} /> Email
                    </a>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Desktop sidebar */}
                <aside className="hidden sm:block w-60 lg:w-64 border-r border-gray-200 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-white">
                    <Sidebar active={activeId} onSelect={setActiveId} />
                </aside>

                {/* Mobile sidebar overlay */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-40 flex sm:hidden">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                        <div className="relative z-50 w-64 bg-white h-full overflow-y-auto shadow-xl">
                            <Sidebar active={activeId} onSelect={setActiveId} mobile onClose={() => setMobileOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                            {section.title}
                        </h1>
                        <section.content />

                        {/* Prev/Next navigation */}
                        <DocNav active={activeId} onSelect={setActiveId} />
                    </div>

                    {/* Footer */}
                    <footer className="border-t border-gray-100 py-6 px-6 text-center">
                        <p className="text-xs text-gray-400">Mozart Trainer · <FaUniversity className="inline mb-0.5" /> UTN</p>
                    </footer>
                </main>
            </div>

            {/* Inline styles for prose */}
            <style>{`
        .prose-section p { margin-bottom: 1rem; color: #374151; line-height: 1.65; }
        .prose-section p.lead { font-size: 1.05rem; color: #1f2937; margin-bottom: 1.25rem; }
        .prose-section h3 { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.5rem; }
        .prose-section ul, .prose-section ol { padding-left: 1.25rem; margin-bottom: 1rem; color: #374151; }
        .prose-section li { margin-bottom: 0.35rem; line-height: 1.6; }
        .prose-section code { background: #f3f4f6; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.85em; font-family: monospace; color: #be185d; }
        .doc-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 1.5rem; }
        .doc-table thead th { text-align: left; padding: 0.6rem 0.75rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; }
        .doc-table tbody td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f3f4f6; color: #374151; }
        .doc-table tbody tr:last-child td { border-bottom: none; }
      `}</style>
        </div>
    );
}

// Prev/Next nav between sections
function DocNav({ active, onSelect }) {
    const flat = NAV.flatMap(g => g.items);
    const idx = flat.findIndex(i => i.id === active);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    return (
        <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between">
            {prev ? (
                <button onClick={() => onSelect(prev.id)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-amadeus-primary transition-colors">
                    <FiChevronRight className="rotate-180" /> {prev.label}
                </button>
            ) : <span />}
            {next ? (
                <button onClick={() => onSelect(next.id)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-amadeus-primary transition-colors">
                    {next.label} <FiChevronRight />
                </button>
            ) : <span />}
        </div>
    );
}
