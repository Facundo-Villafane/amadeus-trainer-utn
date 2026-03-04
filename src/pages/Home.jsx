// src/pages/Home.jsx
// Bilingual landing page (ES/EN toggle) for Mozart Trainer
import { useState } from 'react';
import { Link } from 'react-router';
import {
  FiTerminal, FiTrendingUp, FiAward, FiUsers, FiBook,
  FiMail, FiGlobe, FiShield, FiZap, FiLayers,
} from 'react-icons/fi';
import { FaUniversity, FaPlay } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

// ── i18n content ──────────────────────────────────────────────────────────────
const T = {
  es: {
    lang: 'EN',
    switchTo: 'en',
    tagline: 'Entrenador GDS para la industria de la aviación',
    description:
      'Plataforma educativa diseñada para los estudiantes de la Tecnicatura Universitaria en Gestión Aeronáutica — UTN. Practicá los comandos de reservas como un profesional de la industria.',
    ctaLogin: 'Iniciar sesión',
    ctaDashboard: 'Ir al dashboard',
    ctaDocs: 'Documentación',
    aboutLabel: 'Sobre la plataforma',
    aboutTitle: 'Formación académica especializada',
    about1Title: 'Universidad Tecnológica Nacional',
    about1:
      'Mozart Trainer fue diseñado específicamente para los estudiantes de Billetaje y Reservas de la UTN-FRRo, como herramienta complementaria para practicar los sistemas GDS utilizados en la industria de viajes.',
    about2Title: 'Aprendizaje autodirigido',
    about2:
      'Practicá a tu propio ritmo en un entorno seguro que simula el sistema real. Los docentes tienen acceso al panel de administración para hacer seguimiento detallado del progreso de cada alumno.',
    featLabel: 'Características',
    featTitle: 'Aprendé como un profesional',
    features: [
      { icon: 'FiTerminal', title: 'La misma sintaxis, ambiente seguro', body: 'Mozart Trainer usa los mismos comandos Amadeus del sistema real — no simplificados, no adaptados. Cuando llegues al trabajo, ya sabes exactamente qué tipear.' },
      { icon: 'FiUsers', title: 'El docente ve todo, en tiempo real', body: 'Cada comando, cada PNR, cada error queda registrado. El docente puede revisar el historial completo de cada alumno desde el panel de administración, sin necesidad de evaluar en clase.' },
      { icon: 'FiZap', title: 'Siempre hay vuelos para practicar', body: 'Si no hay vuelos cargados para la fecha que buscás, el sistema genera disponibilidades sintéticas realistas con carrier ZZ. Nunca te quedás sin material para practicar.' },
      { icon: 'FiShield', title: 'XP que solo premia práctica real', body: 'El sistema de antifarm detecta y penaliza repetición mecánica: cooldown entre PNRs, detección de spam en 30 segundos, corte de XP después de 5 comandos idénticos seguidos.' },
    ],
    gamLabel: 'Gamificación',
    gamTitle: 'Aprendé mientras avanzás',
    gamDesc: 'Elementos de juego para que el aprendizaje sea más motivador — sin perder el rigor del entorno profesional.',
    gamItems: [
      { color: 'bg-yellow-500', icon: 'FiAward', title: 'Logros', body: 'Más de 40 logros por desbloquear, de rareza Común a Legendario, con pistas sobre cómo conseguirlos.' },
      { color: 'bg-blue-500', icon: 'FiTrendingUp', title: '20 Niveles', body: 'Desde Cadete hasta Leyenda — cada nivel tiene título propio y se muestra en tu perfil y en el ranking.' },
      { color: 'bg-purple-500', icon: 'FiLayers', title: 'Ranking', body: 'Leaderboard en tiempo real con tu comisión. Las camadas anteriores aparecen visualmente diferenciadas por privacidad.' },
      { color: 'bg-green-500', icon: 'FiZap', title: 'Rachas diarias', body: '+10 XP por día de uso consecutivo (hasta 7). Penalizaciones anti-farming para que solo cuente la práctica real.' },
    ],
    docsLabel: 'Documentación',
    docsTitle: 'Recursos y referencias',
    docsDesc: 'Guías de comandos, referencia técnica y notas de la plataforma, todo en un lugar.',
    docsBtn: 'Ver documentación',
    contactLabel: 'Contacto',
    contactTitle: '¿Consultas?',
    contactDesc: 'Para consultas académicas, bugs o sugerencias, escribime.',
    contactBtn: 'Enviar email',
    footerCopy: '© 2025 Mozart Trainer · UTN',
  },

  en: {
    lang: 'ES',
    switchTo: 'es',
    tagline: 'GDS Trainer for the aviation industry',
    description:
      'Educational platform designed for students of the University Technician in Aeronautical Management — UTN. Practice reservation commands like an industry professional.',
    ctaLogin: 'Log in',
    ctaDashboard: 'Go to dashboard',
    ctaDocs: 'Documentation',
    aboutLabel: 'About the platform',
    aboutTitle: 'Specialized academic training',
    about1Title: 'Universidad Tecnológica Nacional',
    about1:
      'Mozart Trainer was specifically designed for Ticketing & Reservations students at UTN-FRRo, as a complementary tool for practicing GDS systems used in the travel industry.',
    about2Title: 'Self-directed learning',
    about2:
      'Practice at your own pace in a safe environment that simulates the real system. Instructors have access to an admin panel for detailed tracking of each student\'s progress.',
    featLabel: 'Features',
    featTitle: 'Learn like a professional',
    features: [
      { icon: 'FiTerminal', title: 'Real syntax, safe environment', body: 'Mozart Trainer uses the exact same Amadeus command syntax as the live system — not simplified, not adapted. When you start working, you already know what to type.' },
      { icon: 'FiUsers', title: 'Instructor visibility, in real time', body: 'Every command, PNR, and error is logged. Instructors can review each student\'s full history from the admin panel — no need to evaluate in class.' },
      { icon: 'FiZap', title: 'Flights always available to practice', body: 'If no flights exist for the date you search, the system generates realistic synthetic availability with carrier ZZ. You never run out of material.' },
      { icon: 'FiShield', title: 'XP that rewards genuine practice', body: 'The anti-farming system detects mechanical repetition: PNR cooldown, 30-second spam detection, XP cutoff after 5 identical commands in a row.' },
    ],
    gamLabel: 'Gamification',
    gamTitle: 'Learn while you progress',
    gamDesc: 'Game elements to make learning more motivating — without losing the rigor of a professional environment.',
    gamItems: [
      { color: 'bg-yellow-500', icon: 'FiAward', title: 'Achievements', body: 'Over 40 achievements to unlock, from Common to Legendary rarity, with hints on how to earn them.' },
      { color: 'bg-blue-500', icon: 'FiTrendingUp', title: '20 Levels', body: 'From Cadet to Legend — each level has its own title, visible on your profile and the leaderboard.' },
      { color: 'bg-purple-500', icon: 'FiLayers', title: 'Leaderboard', body: 'Real-time leaderboard by cohort. Past cohorts are visually distinguished for privacy.' },
      { color: 'bg-green-500', icon: 'FiZap', title: 'Daily streaks', body: '+10 XP per consecutive day of use (up to 7). Anti-farming penalties so only genuine practice counts.' },
    ],
    docsLabel: 'Documentation',
    docsTitle: 'Resources & references',
    docsDesc: 'Command guides, technical reference, and platform notes — all in one place.',
    docsBtn: 'View documentation',
    contactLabel: 'Contact',
    contactTitle: 'Questions?',
    contactDesc: 'For academic inquiries, bug reports, or suggestions, drop me a message.',
    contactBtn: 'Send email',
    footerCopy: '© 2025 Mozart Trainer · UTN',
  },
};

// Icon resolver
const ICONS = { FiTerminal, FiTrendingUp, FiAward, FiUsers, FiZap, FiShield, FiLayers };
function Icon({ name, className }) {
  const Comp = ICONS[name] || FiZap;
  return <Comp className={className} />;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { currentUser } = useAuth();
  const [lang, setLang] = useState('es');
  const t = T[lang];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-amadeus-dark sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-white text-xl font-leckerli font-light tracking-wide">Mozart</span>
          <div className="flex items-center gap-3">
            <Link to="/docs" className="text-gray-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <FiBook size={14} /> {t.ctaDocs}
            </Link>
            <button
              onClick={() => setLang(t.switchTo)}
              className="flex items-center gap-1 text-gray-300 hover:text-white text-sm px-2 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
            >
              <FiGlobe size={13} /> {t.lang}
            </button>
            {currentUser ? (
              <Link to="/dashboard" className="text-sm px-3 py-1.5 bg-white text-amadeus-primary rounded font-medium hover:bg-gray-100 transition-colors">
                {t.ctaDashboard}
              </Link>
            ) : (
              <Link to="/login" className="text-sm px-3 py-1.5 bg-white text-amadeus-primary rounded font-medium hover:bg-gray-100 transition-colors">
                {t.ctaLogin}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-amadeus-dark text-white pb-24 pt-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-8xl sm:text-9xl font-leckerli font-light mb-3 tracking-tight">Mozart</h1>
          <p className="text-lg text-gray-400 mb-6">{t.tagline}</p>
          <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">{t.description}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {currentUser ? (
              <Link to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amadeus-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                <FaPlay size={14} /> {t.ctaDashboard}
              </Link>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amadeus-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                <FaPlay size={14} /> {t.ctaLogin}
              </Link>
            )}
            <Link to="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500 text-gray-300 font-semibold rounded-lg hover:border-gray-300 hover:text-white transition-colors">
              <FiBook size={14} /> {t.ctaDocs}
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm text-amadeus-primary font-semibold tracking-widest uppercase mb-2">{t.aboutLabel}</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{t.aboutTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <FaUniversity className="text-amadeus-primary w-6 h-6 flex-shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">{t.about1Title}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{t.about1}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <FiBook className="text-amadeus-primary w-6 h-6 flex-shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">{t.about2Title}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{t.about2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-amadeus-primary font-semibold tracking-widest uppercase mb-2">{t.featLabel}</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{t.featTitle}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-amadeus-primary/10 flex items-center justify-center mb-4">
                  <Icon name={f.icon} className="text-amadeus-primary w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-amadeus-primary font-semibold tracking-widest uppercase mb-2">{t.gamLabel}</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{t.gamTitle}</h2>
            <p className="mt-3 max-w-xl mx-auto text-gray-500">{t.gamDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.gamItems.map(g => (
              <div key={g.title} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className={`w-10 h-10 rounded-lg ${g.color} flex items-center justify-center mb-4`}>
                  <Icon name={g.icon} className="text-white w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{g.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Documentation CTA ── */}
      <section className="py-16 bg-amadeus-dark">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-amadeus-light font-semibold tracking-widest uppercase mb-2">{t.docsLabel}</p>
          <h2 className="text-3xl font-extrabold text-white mb-4">{t.docsTitle}</h2>
          <p className="text-gray-400 mb-8">{t.docsDesc}</p>
          <Link to="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amadeus-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            <FiBook size={16} /> {t.docsBtn}
          </Link>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-14 bg-gray-50" id="contact">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-sm text-amadeus-primary font-semibold tracking-widest uppercase mb-2">{t.contactLabel}</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{t.contactTitle}</h2>
          <p className="text-gray-500 mb-5">{t.contactDesc}</p>
          <a
            href="mailto:favillafane@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amadeus-primary text-white font-medium rounded-lg hover:bg-amadeus-secondary transition-colors"
          >
            <FiMail size={16} />
            {t.contactBtn}
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-amadeus-dark py-6 text-center">
        <p className="text-gray-500 text-sm">{t.footerCopy}</p>
      </footer>
    </div>
  );
}