// src/services/experienceService.js
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  getDoc,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import xpEventBus from './xpEventBus';

// ─── Icon references (string identifiers mapped to react-icons in UI) ─────────
// Achievement icons are identified by string keys and resolved in the UI layer
// to avoid importing react-icons here (service layer stays framework-agnostic).
// Keys map to react-icons/fi unless noted.
const ICON = {
  TARGET: 'FiTarget',
  CLIPBOARD: 'FiClipboard',
  TERMINAL: 'FiTerminal',
  BOOK_OPEN: 'FiBookOpen',
  AWARD: 'FiAward',
  ZAP: 'FiZap',
  CHECK_CIRCLE: 'FiCheckCircle',
  SEARCH: 'FiSearch',
  MOON: 'FiMoon',
  COFFEE: 'FiCoffee',
  MAP: 'FiMap',
  HOME: 'FiHome',
  GLOBE: 'FiGlobe',
  CALENDAR: 'FiCalendar',
  SUN: 'FiSun',
  CLOUD_SNOW: 'FiCloudSnow',
  REPEAT: 'FiRepeat',
  ROTATE_CW: 'FiRotateCw',
  CLOCK: 'FiClock',
  TRENDING_UP: 'FiTrendingUp',
  STAR: 'FiStar',
  USERS: 'FiUsers',
  EYE: 'FiEye',
  SHIELD: 'FiShield',
  CODE: 'FiCode',
  LAYERS: 'FiLayers',
  ACTIVITY: 'FiActivity',
  FLAG: 'FiFlag',
};

class ExperienceService {
  // ── Levels (20, gender-neutral titles) ──────────────────────────────────────
  LEVELS = [
    { level: 1, requiredXP: 0, title: 'Cadete' },
    { level: 2, requiredXP: 150, title: 'Aprendiz/a' },
    { level: 3, requiredXP: 400, title: 'Auxiliar' },
    { level: 4, requiredXP: 800, title: 'Asistente' },
    { level: 5, requiredXP: 1_400, title: 'Agente' },
    { level: 6, requiredXP: 2_200, title: 'Agente Senior' },
    { level: 7, requiredXP: 3_200, title: 'Consultor/a' },
    { level: 8, requiredXP: 4_500, title: 'Consultor/a Senior' },
    { level: 9, requiredXP: 6_200, title: 'Especialista' },
    { level: 10, requiredXP: 8_500, title: 'Especialista Senior' },
    { level: 11, requiredXP: 11_500, title: 'Analista' },
    { level: 12, requiredXP: 15_000, title: 'Analista Senior' },
    { level: 13, requiredXP: 19_500, title: 'Supervisor/a' },
    { level: 14, requiredXP: 25_000, title: 'Inspector/a' },
    { level: 15, requiredXP: 32_000, title: 'Ejecutivo/a' },
    { level: 16, requiredXP: 40_000, title: 'Gerente' },
    { level: 17, requiredXP: 50_000, title: 'Director/a' },
    { level: 18, requiredXP: 65_000, title: 'VP de Reservas' },
    { level: 19, requiredXP: 85_000, title: 'GM Amadeus' },
    { level: 20, requiredXP: 110_000, title: 'Leyenda' },
  ];

  // ── XP values ────────────────────────────────────────────────────────────────
  XP_VALUES = {
    COMMAND_SUCCESS: 3,
    COMMAND_ERROR: -2,   // deducted; floor is 0
    PNR_CREATED: 30,   // only when ≥3 min since last PNR
    PNR_SPAM_PENALTY: -5,   // PNR completed in <30 sec
    PNR_ERROR: -3,   // error during PNR creation
    DAILY_STREAK: 10,   // per day (max 7 consecutive)
    // PNR_FAST_CREATION: removed — was the main farming exploit
    ACHIEVEMENT_MULTIPLIER: 1,
  };

  // ── Anti-farming state ────────────────────────────────────────────────────────
  // In-memory for the session; persisted to Firestore for cross-session protection
  _lastPNRCompletedAt = null;   // ms timestamp
  _commandSpamWindow = [];     // timestamps of recent commands (same command)
  _lastCommand = null;

  // ── Rarity ───────────────────────────────────────────────────────────────────
  RARITY = {
    COMMON: { name: 'Común', color: 'gray' },
    UNCOMMON: { name: 'Poco Común', color: 'green' },
    RARE: { name: 'Raro', color: 'blue' },
    EPIC: { name: 'Épico', color: 'purple' },
    LEGENDARY: { name: 'Legendario', color: 'amber' },
  };

  // ── Achievements ─────────────────────────────────────────────────────────────
  // hint: shown to all users before unlocking (short clue)
  // description: shown after unlocking
  // honorary: true → auto-awarded, not tracked as farmable
  ACHIEVEMENTS = {
    // Progress
    FIRST_STEPS: {
      id: 'FIRST_STEPS',
      name: 'Primeros Pasos',
      hint: 'Ejecutá tu primer comando en la terminal.',
      description: 'Ejecutaste tu primer comando.',
      icon: ICON.TARGET,
      xp: 10,
      rarity: 'COMMON',
      secret: false,
    },
    PNR_NOVICE: {
      id: 'PNR_NOVICE',
      name: 'Primer PNR',
      hint: 'Completá un PNR de principio a fin.',
      description: 'Creaste tu primer Passenger Name Record.',
      icon: ICON.CLIPBOARD,
      xp: 25,
      rarity: 'COMMON',
      secret: false,
    },
    COMMAND_MASTER: {
      id: 'COMMAND_MASTER',
      name: 'Dominio del Terminal',
      hint: 'La práctica hace al maestro. Seguí ejecutando comandos.',
      description: 'Ejecutaste 100 comandos exitosos.',
      icon: ICON.TERMINAL,
      xp: 50,
      rarity: 'UNCOMMON',
      secret: false,
    },
    QUICK_LEARNER: {
      id: 'QUICK_LEARNER',
      name: 'Aprendizaje Rápido',
      hint: 'Alcanzá un nivel intermedio.',
      description: 'Llegaste al nivel 3.',
      icon: ICON.BOOK_OPEN,
      xp: 30,
      rarity: 'UNCOMMON',
      secret: false,
    },
    PNR_EXPERT: {
      id: 'PNR_EXPERT',
      name: 'Experto/a PNR',
      hint: 'La cantidad importa. Seguí creando PNRs.',
      description: 'Creaste 10 PNRs.',
      icon: ICON.AWARD,
      xp: 75,
      rarity: 'RARE',
      secret: false,
    },
    PNR_25: {
      id: 'PNR_25',
      name: 'Coleccionista',
      hint: 'Los PNRs se acumulan con la práctica.',
      description: 'Creaste 25 PNRs.',
      icon: ICON.LAYERS,
      xp: 100,
      rarity: 'RARE',
      secret: false,
    },
    PNR_50: {
      id: 'PNR_50',
      name: 'Veterano/a',
      hint: '50 PNRs. Esto ya no es suerte.',
      description: 'Creaste 50 PNRs.',
      icon: ICON.SHIELD,
      xp: 200,
      rarity: 'EPIC',
      secret: false,
    },
    PERFECTIONIST: {
      id: 'PERFECTIONIST',
      name: 'Perfeccionista',
      hint: 'Completá varios PNRs sin cometer errores.',
      description: 'Creaste 5 PNRs sin errores consecutivos.',
      icon: ICON.CHECK_CIRCLE,
      xp: 60,
      rarity: 'EPIC',
      secret: false,
    },
    LEVEL_10: {
      id: 'LEVEL_10',
      name: 'Doble Dígito',
      hint: 'La mitad del camino. No pares.',
      description: 'Alcanzaste el nivel 10.',
      icon: ICON.TRENDING_UP,
      xp: 100,
      rarity: 'EPIC',
      secret: false,
    },
    LEVEL_20: {
      id: 'LEVEL_20',
      name: 'Cima',
      hint: 'El nivel máximo. Solo para los más dedicados.',
      description: 'Alcanzaste el nivel 20 — Leyenda.',
      icon: ICON.STAR,
      xp: 500,
      rarity: 'LEGENDARY',
      secret: false,
    },

    // Precision / streaks
    PRECISION_MASTER: {
      id: 'PRECISION_MASTER',
      name: 'Precisión',
      hint: 'Encadenás comandos correctos sin cometer errores.',
      description: '20 comandos exitosos seguidos sin errores.',
      icon: ICON.ACTIVITY,
      xp: 50,
      rarity: 'RARE',
      secret: false,
    },
    DAILY_STREAK_3: {
      id: 'DAILY_STREAK_3',
      name: 'Constancia',
      hint: 'Volvé al sistema varios días seguidos.',
      description: 'Usaste el sistema 3 días consecutivos.',
      icon: ICON.CALENDAR,
      xp: 15,
      rarity: 'COMMON',
      secret: false,
    },
    DAILY_STREAK_7: {
      id: 'DAILY_STREAK_7',
      name: 'Racha Semanal',
      hint: 'Una semana entera de práctica diaria.',
      description: 'Usaste el sistema 7 días consecutivos.',
      icon: ICON.FLAG,
      xp: 50,
      rarity: 'RARE',
      secret: false,
    },
    DAILY_STREAK_30: {
      id: 'DAILY_STREAK_30',
      name: 'El Mes Perfecto',
      hint: 'Un mes entero sin faltar. Casi imposible.',
      description: '30 días consecutivos de uso.',
      icon: ICON.AWARD,
      xp: 200,
      rarity: 'LEGENDARY',
      secret: false,
    },
    ERROR_FREE_SESSION: {
      id: 'ERROR_FREE_SESSION',
      name: 'Sesión Perfecta',
      hint: 'Terminá una sesión activa sin cometer ningún error.',
      description: 'Cerraste sesión sin errores.',
      icon: ICON.SHIELD,
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false,
    },
    CONSISTENCY_KEY: {
      id: 'CONSISTENCY_KEY',
      name: 'Constancia es Clave',
      hint: 'La regularidad te lleva lejos.',
      description: 'Usaste el sistema 30 días diferentes (no necesariamente consecutivos).',
      icon: ICON.ROTATE_CW,
      xp: 50,
      rarity: 'RARE',
      secret: false,
    },
    THE_VETERAN: {
      id: 'THE_VETERAN',
      name: 'Veterano/a',
      hint: 'La experiencia se acumula con el tiempo.',
      description: 'Usaste el sistema en 30 días diferentes.',
      icon: ICON.CLOCK,
      xp: 100,
      rarity: 'EPIC',
      secret: false,
    },

    // Behavior / funny (secret)
    NOT_FOUND: {
      id: 'NOT_FOUND',
      name: '404 Flight Not Found',
      hint: 'Algunos destinos son difíciles de encontrar...',
      description: 'Buscaste vuelos a destinos inexistentes muchas veces.',
      icon: ICON.SEARCH,
      xp: 15,
      rarity: 'UNCOMMON',
      secret: true,
    },
    OOPS_WRONG_BUTTON: {
      id: 'OOPS_WRONG_BUTTON',
      name: 'Oops',
      hint: 'Todos cometemos errores... ¿o no?',
      description: 'Ejecutaste 50 comandos inválidos.',
      icon: ICON.ZAP,
      xp: 20,
      rarity: 'UNCOMMON',
      secret: true,
    },
    LOST_IN_TRANSLATION: {
      id: 'LOST_IN_TRANSLATION',
      name: 'Lost in Translation',
      hint: 'El teclado a veces tiene vida propia.',
      description: '20 comandos con errores tipográficos.',
      icon: ICON.MAP,
      xp: 15,
      rarity: 'COMMON',
      secret: true,
    },
    GHOST_PASSENGER: {
      id: 'GHOST_PASSENGER',
      name: 'Ghost Passenger',
      hint: 'Un PNR sin pasajeros no va a ningún lado.',
      description: 'Intentaste crear un PNR sin agregar pasajeros.',
      icon: ICON.USERS,
      xp: 10,
      rarity: 'COMMON',
      secret: true,
    },
    COPY_PASTE_MASTER: {
      id: 'COPY_PASTE_MASTER',
      name: 'Copy Paste',
      hint: 'Ctrl+C, Ctrl+V... ¿cuántas veces?',
      description: 'Ejecutaste el mismo comando 10 veces seguidas.',
      icon: ICON.REPEAT,
      xp: 15,
      rarity: 'UNCOMMON',
      secret: true,
    },

    // Exploration
    THE_EXPLORER: {
      id: 'THE_EXPLORER',
      name: 'El/La Explorador/a',
      hint: 'Hay un mundo de destinos para descubrir.',
      description: 'Buscaste vuelos a 20 destinos diferentes.',
      icon: ICON.GLOBE,
      xp: 40,
      rarity: 'RARE',
      secret: false,
    },
    HOMESICK: {
      id: 'HOMESICK',
      name: 'Homesick',
      hint: '¿Siempre volvés al mismo lugar?',
      description: 'Buscaste 10 vuelos desde/hacia tu ciudad base.',
      icon: ICON.HOME,
      xp: 20,
      rarity: 'UNCOMMON',
      secret: true,
    },
    AROUND_THE_WORLD: {
      id: 'AROUND_THE_WORLD',
      name: 'La Vuelta al Mundo',
      hint: 'Los continentes te esperan. Explorá todos.',
      description: 'Creaste PNRs con vuelos en todos los continentes.',
      icon: ICON.GLOBE,
      xp: 100,
      rarity: 'LEGENDARY',
      secret: false,
    },

    // Time-based
    NIGHT_OWL: {
      id: 'NIGHT_OWL',
      name: 'Night Owl',
      hint: 'Hay quienes trabajan cuando el mundo duerme.',
      description: 'Usaste el sistema entre medianoche y las 5 AM.',
      icon: ICON.MOON,
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false,
    },
    COFFEE_BREAK: {
      id: 'COFFEE_BREAK',
      name: 'Coffee Break',
      hint: 'Un descanso y de vuelta al trabajo.',
      description: 'Volviste después de más de 1 hora de inactividad.',
      icon: ICON.COFFEE,
      xp: 10,
      rarity: 'COMMON',
      secret: false,
    },
    EARLY_BIRD: {
      id: 'EARLY_BIRD',
      name: 'Early Bird',
      hint: 'A madrugar te lleva lejos.',
      description: 'Usaste el sistema antes de las 7 AM durante 5 días.',
      icon: ICON.SUN,
      xp: 30,
      rarity: 'RARE',
      secret: false,
    },
    WEEKEND_WARRIOR: {
      id: 'WEEKEND_WARRIOR',
      name: 'Weekend Warrior',
      hint: 'El fin de semana también es tiempo de práctica.',
      description: 'Usaste el sistema solo fines de semana durante un mes.',
      icon: ICON.CALENDAR,
      xp: 35,
      rarity: 'RARE',
      secret: false,
    },
    MARATHON_RUNNER: {
      id: 'MARATHON_RUNNER',
      name: 'Marathon',
      hint: '¿Cuánto tiempo podés mantenerte activo/a?',
      description: 'Usaste el sistema durante 2 horas continuas.',
      icon: ICON.ACTIVITY,
      xp: 40,
      rarity: 'RARE',
      secret: false,
    },

    // Social
    TOP_CLASS: {
      id: 'TOP_CLASS',
      name: 'Top de la Clase',
      hint: 'El leaderboard dice quién está arriba.',
      description: 'Alcanzaste el top 3 del leaderboard.',
      icon: ICON.AWARD,
      xp: 75,
      rarity: 'EPIC',
      secret: false,
    },
    RISING_STAR: {
      id: 'RISING_STAR',
      name: 'Estrella en Ascenso',
      hint: 'Esta semana podés subir posiciones.',
      description: 'Subiste 5 posiciones en el leaderboard en una semana.',
      icon: ICON.TRENDING_UP,
      xp: 40,
      rarity: 'RARE',
      secret: false,
    },
    HELPING_HAND: {
      id: 'HELPING_HAND',
      name: 'Ayuda',
      hint: 'Nadie sabe todo. El manual existe por algo.',
      description: 'Usaste el comando HELP 10 veces.',
      icon: ICON.EYE,
      xp: 15,
      rarity: 'COMMON',
      secret: false,
    },

    // Easter eggs (secret)
    THE_ANSWER: {
      id: 'THE_ANSWER',
      name: 'The Answer',
      hint: '42.',
      description: 'Ejecutaste exactamente 42 comandos en un día.',
      icon: ICON.CODE,
      xp: 42,
      rarity: 'RARE',
      secret: true,
    },
    LUCKY_SEVEN: {
      id: 'LUCKY_SEVEN',
      name: 'Lucky Seven',
      hint: 'Un PNR especialmente cargado.',
      description: 'Creaste un PNR con 7 segmentos.',
      icon: ICON.LAYERS,
      xp: 77,
      rarity: 'EPIC',
      secret: true,
    },
    BINARY_MASTER: {
      id: 'BINARY_MASTER',
      name: 'Binary Master',
      hint: '1010 en binario es 10 en decimal. ¿Pero en comandos?',
      description: 'Ejecutaste 1010 comandos en total.',
      icon: ICON.CODE,
      xp: 101,
      rarity: 'EPIC',
      secret: true,
    },
    COMEBACK_KID: {
      id: 'COMEBACK_KID',
      name: 'Comeback',
      hint: 'Siempre se puede volver a empezar.',
      description: 'Volviste después de 7 días de inactividad.',
      icon: ICON.ROTATE_CW,
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false,
    },

    // Honorary
    LEGACY_PIONEER: {
      id: 'LEGACY_PIONEER',
      name: 'Pionero/a',
      hint: 'Este logro es especial. No se puede conseguir ahora.',
      description: 'Alumno/a de una camada anterior. Gracias por estar desde el inicio.',
      icon: ICON.STAR,
      xp: 0,
      rarity: 'LEGENDARY',
      secret: false,
      honorary: true,
    },
  };

  constructor() {
    this.sessionStartTime = null;
    this.pnrStartTime = null;
    this.lastCommandTime = null;
    this._lastCommand = null;
    this.sameCommandCount = 0;
    this.sessionCommands = 0;
    this.consecutivePerfectPNRs = 0;
    this.uniqueDestinations = new Set();
    this.homeCity = null;
    this.homeCitySearches = 0;
    this.hadPNRError = false;
    this.sessionCommandErrors = 0;  // For ERROR_FREE_SESSION
    this.consecutiveSuccesses = 0;  // For PRECISION_MASTER
  }

  // ── Session start ────────────────────────────────────────────────────────────
  async startSession(userId) {
    if (!userId) return;

    this.sessionStartTime = Date.now();
    this.sessionCommandErrors = 0;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Restore anti-farming state from Firestore
      this._lastPNRCompletedAt = userData.lastPNRCompletedAt || null;

      // Check comeback
      const lastActivity = userData.lastActivity || null;
      if (lastActivity) {
        const inactiveDays = Math.floor((Date.now() - lastActivity) / 86_400_000);
        if (inactiveDays >= 7) await this.checkAndUnlockAchievement(userId, 'COMEBACK_KID');
      }

      // Night Owl
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) await this.checkAndUnlockAchievement(userId, 'NIGHT_OWL');
      if (hour >= 5 && hour < 7) await this._incrementEarlyBirdStreak(userId);

      // Daily streak
      await this._updateDailyStreak(userId);

      // Auto-award LEGACY_PIONEER for legacy users (once)
      await this._checkLegacyPioneer(userId, userData);

      await updateDoc(userRef, { lastActivity: Date.now() });
    } catch (error) {
      console.error('Error in startSession:', error);
    }
  }

  // ── Check if user belongs to an inactive commission ──────────────────────────
  async _checkLegacyPioneer(userId, userData) {
    if (!userData.commissionCode) return;
    if ((userData.achievements || []).includes('LEGACY_PIONEER')) return;

    try {
      const q = query(
        collection(db, 'commissions'),
        where('code', '==', userData.commissionCode),
        firestoreLimit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const commission = snap.docs[0].data();
        if (commission.active === false) {
          await this.checkAndUnlockAchievement(userId, 'LEGACY_PIONEER');
        }
      }
    } catch (e) {
      console.warn('Could not check legacy pioneer:', e);
    }
  }

  // ── Daily streak ─────────────────────────────────────────────────────────────
  async _updateDailyStreak(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      const today = new Date().toDateString();
      const lastLoginDay = userData.lastLoginDay || null;
      const currentStreak = userData.dailyStreak || 0;

      if (lastLoginDay === today) return; // already logged in today

      const yesterday = new Date(Date.now() - 86_400_000).toDateString();
      const newStreak = lastLoginDay === yesterday ? currentStreak + 1 : 1;

      let xpBonus = 0;
      if (newStreak > 1 && newStreak <= 7) {
        xpBonus = this.XP_VALUES.DAILY_STREAK;
      }

      const updates = {
        lastLoginDay: today,
        dailyStreak: newStreak,
      };
      if (xpBonus > 0) {
        const result = await this._applyXP(
          userId,
          this.XP_VALUES.DAILY_STREAK,
          `Racha diaria (día ${newStreak})`,
          'daily_streak'
        );
        if (result?.delta > 0) {
          xpEventBus.emitDailyStreak(newStreak, result.delta);
          if (result.levelInfo?.leveledUp) {
            xpEventBus.emitLevelUp(result.levelInfo.oldLevel, result.levelInfo.newLevel, this.getLevelTitle(result.levelInfo.newLevel));
          }
        }
      }
      await updateDoc(userRef, updates);

      // Streak achievements
      if (newStreak >= 3) await this.checkAndUnlockAchievement(userId, 'DAILY_STREAK_3');
      if (newStreak >= 7) await this.checkAndUnlockAchievement(userId, 'DAILY_STREAK_7');
      if (newStreak >= 30) await this.checkAndUnlockAchievement(userId, 'DAILY_STREAK_30');

    } catch (e) {
      console.warn('Error updating daily streak:', e);
    }
  }

  // ── XP history ───────────────────────────────────────────────────────────────
  async addXpHistoryEntry(userId, amount, reason, type = 'other') {
    if (!userId) return false;
    try {
      const userRef = doc(db, 'users', userId);
      const timestamp = Date.now();
      await updateDoc(userRef, {
        [`xpHistory.${timestamp}`]: {
          amount,
          reason,
          type,
          addedAt: new Date().toISOString(),
          timestamp,
        },
      });
      return true;
    } catch (error) {
      console.error('Error adding XP history entry:', error);
      return false;
    }
  }

  // ── Level up check ───────────────────────────────────────────────────────────
  async checkLevelUp(userId, oldXP, xpDelta) {
    const newXP = Math.max(0, oldXP + xpDelta);
    const oldLevel = this.calculateLevel(oldXP);
    const newLevel = this.calculateLevel(newXP);

    if (newLevel > oldLevel) {
      await this.addXpHistoryEntry(userId, 0, `¡Subiste al nivel ${newLevel}!`, 'level_up');

      // Level milestone achievements
      if (newLevel >= 3) await this.checkAndUnlockAchievement(userId, 'QUICK_LEARNER');
      if (newLevel >= 10) await this.checkAndUnlockAchievement(userId, 'LEVEL_10');
      if (newLevel >= 20) await this.checkAndUnlockAchievement(userId, 'LEVEL_20');

      return { leveledUp: true, oldLevel, newLevel };
    }
    return { leveledUp: false, oldLevel, newLevel };
  }

  // ── Apply XP (handles floor at 0) ────────────────────────────────────────────
  async _applyXP(userId, delta, reason, type) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      const currentXP = userData.xp || 0;

      // Enforce floor at 0
      const effectiveDelta = delta < 0 ? Math.max(-currentXP, delta) : delta;
      if (effectiveDelta === 0 && delta !== 0) return { currentXP, newXP: 0, delta: 0 };

      await updateDoc(userRef, { xp: increment(effectiveDelta) });
      await this.addXpHistoryEntry(userId, effectiveDelta, reason, type);

      const newXP = currentXP + effectiveDelta;
      const levelInfo = await this.checkLevelUp(userId, currentXP, effectiveDelta);

      return { currentXP, newXP, delta: effectiveDelta, levelInfo };
    } catch (e) {
      console.error('_applyXP error:', e);
      return null;
    }
  }

  // ── Record successful command ─────────────────────────────────────────────────
  async recordSuccessfulCommand(userId, command, commandType) {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // First command ever
      if (!userData.commandsExecuted || userData.commandsExecuted === 0) {
        await this.checkAndUnlockAchievement(userId, 'FIRST_STEPS');
      }

      // Precision streak
      this.consecutiveSuccesses = (this.consecutiveSuccesses || 0) + 1;
      if (this.consecutiveSuccesses >= 20) {
        await this.checkAndUnlockAchievement(userId, 'PRECISION_MASTER');
      }

      // Anti-spam: same command repeated
      const now = Date.now();
      if (command === this._lastCommand) {
        this.sameCommandCount++;
        this._commandSpamWindow = [...(this._commandSpamWindow || []).filter(t => now - t < 60_000), now];
        if (this.sameCommandCount >= 10) {
          await this.checkAndUnlockAchievement(userId, 'COPY_PASTE_MASTER');
        }
        // >5 same commands in 60s → no XP
        if (this._commandSpamWindow.length > 5) {
          await updateDoc(userRef, { commandsExecuted: increment(1), lastActivity: now });
          this._lastCommand = command;
          return { xpGained: 0, spamDetected: true };
        }
      } else {
        this.sameCommandCount = 1;
        this._commandSpamWindow = [now];
        this._lastCommand = command;
      }

      const updates = {
        commandsExecuted: increment(1),
        successfulCommands: increment(1),
        lastActivity: now,
      };

      // HELP command
      if (command.toUpperCase().startsWith('HE') || command.toUpperCase() === 'HELP') {
        updates.helpCommandsUsed = increment(1);
        const helpCount = (userData.helpCommandsUsed || 0) + 1;
        if (helpCount >= 10) await this.checkAndUnlockAchievement(userId, 'HELPING_HAND');
      }

      // Unique destinations
      if (commandType === 'AN' || commandType === 'SN') {
        const destMatch = command.match(/[A-Z]{3}([A-Z]{3})/);
        if (destMatch) {
          const dest = destMatch[1];
          this.uniqueDestinations.add(dest);
          updates.uniqueDestinations = arrayUnion(dest);
          if (this.uniqueDestinations.size >= 20) {
            await this.checkAndUnlockAchievement(userId, 'THE_EXPLORER');
          }
        }
      }

      // Daily stats for THE_ANSWER
      const today = new Date().toDateString();
      const dailyStats = userData.dailyStats || {};
      const todayStats = dailyStats[today] || { commands: 0 };
      todayStats.commands++;
      if (todayStats.commands === 42) await this.checkAndUnlockAchievement(userId, 'THE_ANSWER');
      updates.dailyStats = { ...dailyStats, [today]: todayStats };

      // Binary master
      if ((userData.commandsExecuted || 0) + 1 === 1010) {
        await this.checkAndUnlockAchievement(userId, 'BINARY_MASTER');
      }

      // Command master
      if ((userData.successfulCommands || 0) + 1 >= 100) {
        await this.checkAndUnlockAchievement(userId, 'COMMAND_MASTER');
      }

      await updateDoc(userRef, updates);

      const result = await this._applyXP(
        userId,
        this.XP_VALUES.COMMAND_SUCCESS,
        `Comando exitoso: ${command}`,
        'command_success'
      );

      // Emit XP toast
      if (result?.delta > 0) {
        xpEventBus.emitCommandSuccess(result.delta);
        if (result.levelInfo?.leveledUp) {
          xpEventBus.emitLevelUp(result.levelInfo.oldLevel, result.levelInfo.newLevel, this.getLevelTitle(result.levelInfo.newLevel));
        }
      }
      this.sessionCommands++;

      // Session duration check
      if (this.sessionStartTime) {
        const mins = (now - this.sessionStartTime) / 60_000;
        if (mins >= 120) await this.checkAndUnlockAchievement(userId, 'MARATHON_RUNNER');
      }

      return { xpGained: result?.delta || 0, levelInfo: result?.levelInfo };
    } catch (error) {
      console.error('Error recording successful command:', error);
    }
  }

  // ── Record command error ──────────────────────────────────────────────────────
  async recordCommandError(userId, command, errorMessage) {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Reset precision streak
      this.consecutiveSuccesses = 0;
      this.sessionCommandErrors++;

      const updates = {
        commandsExecuted: increment(1),
        commandErrors: increment(1),
        lastActivity: Date.now(),
      };

      // Not-found errors
      if (errorMessage && (errorMessage.includes('No se encontró') || errorMessage.includes('ciudad no válida'))) {
        updates.notFoundErrors = increment(1);
        const notFoundErrors = (userData.notFoundErrors || 0) + 1;
        if (notFoundErrors >= 10) await this.checkAndUnlockAchievement(userId, 'NOT_FOUND');
      }

      // Typo detection
      const validCommands = ['AN', 'SN', 'TN', 'SS', 'NM', 'AP', 'RF', 'ET', 'ER', 'RT', 'XI'];
      const cmdStart = command.substring(0, 2).toUpperCase();
      const isTypo = validCommands.some(v => v !== cmdStart && this._levenshtein(cmdStart, v) <= 1);
      if (isTypo) {
        updates.typoErrors = increment(1);
        const typoErrors = (userData.typoErrors || 0) + 1;
        if (typoErrors >= 20) await this.checkAndUnlockAchievement(userId, 'LOST_IN_TRANSLATION');
      }

      // Total errors
      if ((userData.commandErrors || 0) + 1 >= 50) {
        await this.checkAndUnlockAchievement(userId, 'OOPS_WRONG_BUTTON');
      }

      // Ghost passenger
      if (errorMessage && (errorMessage.includes('No hay pasajeros') || errorMessage.includes('agregar al menos un pasajero'))) {
        await this.checkAndUnlockAchievement(userId, 'GHOST_PASSENGER');
      }

      await updateDoc(userRef, updates);

      // XP penalty (deduction)
      const result = await this._applyXP(
        userId,
        this.XP_VALUES.COMMAND_ERROR,
        `Error en comando: ${command}`,
        'command_error'
      );

      // Emit XP loss toast with the error reason
      if (result?.delta < 0) {
        xpEventBus.emitCommandError(result.delta, errorMessage);
      }

      return {
        xpGained: result?.delta || 0,
        penaltyApplied: true,
        errorMessage,
        levelInfo: result?.levelInfo,
      };
    } catch (error) {
      console.error('Error recording command error:', error);
    }
  }

  // ── PNR lifecycle ─────────────────────────────────────────────────────────────
  async startPNRCreation(userId) {
    if (!userId) return null;
    this.pnrStartTime = Date.now();
    this.hadPNRError = false;
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastPNRStartTime: this.pnrStartTime,
        lastActivity: Date.now(),
      });
    } catch (e) {
      console.error('startPNRCreation error:', e);
    }
    return this.pnrStartTime;
  }

  async recordPNRError(userId) {
    if (!userId) return;
    this.hadPNRError = true;
    this.consecutiveSuccesses = 0;

    const result = await this._applyXP(
      userId,
      this.XP_VALUES.PNR_ERROR,
      'Error durante creación de PNR',
      'pnr_error'
    );
    await updateDoc(doc(db, 'users', userId), {
      pnrErrors: increment(1),
      lastActivity: Date.now(),
    });
    return result;
  }

  async completePNR(userId, pnrId, recordLocator) {
    if (!userId || !pnrId) return null;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      const now = Date.now();

      if (!this.pnrStartTime) this.pnrStartTime = now - 300_000;

      const creationMs = now - this.pnrStartTime;
      const creationSecs = creationMs / 1000;

      // ── Anti-farming cooldown check ──────────────────────────────────────────
      const lastPNR = this._lastPNRCompletedAt || userData.lastPNRCompletedAt || null;
      const secsSinceLast = lastPNR ? (now - lastPNR) / 1000 : Infinity;

      let xpDelta = 0;
      let cooldownHit = false;
      let spamPenalty = false;

      if (creationSecs < 30) {
        // Spam: PNR in under 30 seconds
        xpDelta = this.XP_VALUES.PNR_SPAM_PENALTY;
        spamPenalty = true;
      } else if (secsSinceLast < 180) {
        // Cooldown: less than 3 minutes since last PNR
        xpDelta = 0;
        cooldownHit = true;
      } else {
        xpDelta = this.XP_VALUES.PNR_CREATED;
      }

      // Update last PNR timestamp
      this._lastPNRCompletedAt = now;

      // First PNR ever
      if (!userData.pnrsCreated || userData.pnrsCreated === 0) {
        await this.checkAndUnlockAchievement(userId, 'PNR_NOVICE');
      }

      const updates = {
        pnrsCreated: increment(1),
        lastPNRCompletedAt: now,
        lastPNRCreationTime: creationSecs / 60,
        lastActivity: now,
      };

      await updateDoc(userRef, updates);

      let unlockedAchievements = [];

      // PNR count achievements
      const totalPNRs = (userData.pnrsCreated || 0) + 1;
      if (totalPNRs >= 10) {
        const u1 = await this.checkAndUnlockAchievement(userId, 'PNR_EXPERT');
        if (u1) unlockedAchievements.push(this.ACHIEVEMENTS.PNR_EXPERT);
      }
      if (totalPNRs >= 25) {
        const u2 = await this.checkAndUnlockAchievement(userId, 'PNR_25');
        if (u2) unlockedAchievements.push(this.ACHIEVEMENTS.PNR_25);
      }
      if (totalPNRs >= 50) {
        const u3 = await this.checkAndUnlockAchievement(userId, 'PNR_50');
        if (u3) unlockedAchievements.push(this.ACHIEVEMENTS.PNR_50);
      }

      // PNR segments check (Lucky Seven, Around the World)
      const pnrDoc = await getDoc(doc(db, 'pnrs', pnrId));
      if (pnrDoc.exists()) {
        const pnrData = pnrDoc.data();

        if (pnrData.segments?.length === 7) {
          const u = await this.checkAndUnlockAchievement(userId, 'LUCKY_SEVEN');
          if (u) unlockedAchievements.push(this.ACHIEVEMENTS.LUCKY_SEVEN);
        }

        if (pnrData.segments) {
          const continents = new Set(pnrData.segments.map(s => this._continent(s.destination)).filter(Boolean));
          if (continents.size > 0) {
            await updateDoc(userRef, { continentsVisited: arrayUnion(...continents) });
            const allContinents = new Set([...(userData.continentsVisited || []), ...continents]);
            if (allContinents.size >= 6) {
              const u = await this.checkAndUnlockAchievement(userId, 'AROUND_THE_WORLD');
              if (u) unlockedAchievements.push(this.ACHIEVEMENTS.AROUND_THE_WORLD);
            }
          }
        }

        if (pnrData.passengers?.length > 0) {
          const pax = `${pnrData.passengers[0].lastName}/${pnrData.passengers[0].firstName}`;
          const passengerPNRs = { ...(userData.passengerPNRs || {}), [pax]: (userData.passengerPNRs?.[pax] || 0) + 1 };
          await updateDoc(userRef, { passengerPNRs });
        }
      }

      // Perfect PNR streak
      if (!this.hadPNRError) {
        this.consecutivePerfectPNRs++;
        await updateDoc(userRef, { consecutivePerfectPNRs: this.consecutivePerfectPNRs });
        if (this.consecutivePerfectPNRs >= 5) {
          const u = await this.checkAndUnlockAchievement(userId, 'PERFECTIONIST');
          if (u) unlockedAchievements.push(this.ACHIEVEMENTS.PERFECTIONIST);
        }
      } else {
        this.consecutivePerfectPNRs = 0;
        await updateDoc(userRef, { consecutivePerfectPNRs: 0 });
      }

      // Apply XP and emit events
      let currentXP = (await getDoc(userRef)).data()?.xp || 0;
      let levelInfo = { leveledUp: false, oldLevel: this.calculateLevel(currentXP), newLevel: this.calculateLevel(currentXP) };

      if (spamPenalty) {
        xpEventBus.emitPNRSpam();
      } else if (cooldownHit) {
        // secsRemaining = 180 - secsSinceLast
        xpEventBus.emitPNRCooldown(Math.max(0, 180 - secsSinceLast));
      }

      if (xpDelta !== 0) {
        const res = await this._applyXP(
          userId,
          xpDelta,
          spamPenalty ? 'PNR creado demasiado rápido (penalización)'
            : `Creación de PNR ${recordLocator || pnrId}`,
          spamPenalty ? 'pnr_spam' : 'pnr_creation'
        );
        levelInfo = res?.levelInfo || levelInfo;
        currentXP = res?.currentXP || currentXP;

        if (res?.delta > 0) {
          xpEventBus.emitPNRCompleted(res.delta);
        }
        if (res?.levelInfo?.leveledUp) {
          xpEventBus.emitLevelUp(res.levelInfo.oldLevel, res.levelInfo.newLevel, this.getLevelTitle(res.levelInfo.newLevel));
        }
      }

      this.pnrStartTime = null;
      this.hadPNRError = false;

      return {
        xpGained: xpDelta,
        newXP: currentXP + xpDelta,
        oldLevel: levelInfo.oldLevel,
        newLevel: levelInfo.newLevel,
        levelUp: levelInfo.leveledUp,
        achievements: unlockedAchievements,
        cooldownHit,
        spamPenalty,
        secsSinceLast: Math.round(secsSinceLast),
      };
    } catch (error) {
      console.error('Error completing PNR:', error);
      this.pnrStartTime = null;
      this.hadPNRError = false;
      return null;
    }
  }

  // ── Session end ───────────────────────────────────────────────────────────────
  async endSession(userId) {
    if (!userId) return;
    if (this.sessionCommandErrors === 0 && this.sessionCommands > 0) {
      await this.checkAndUnlockAchievement(userId, 'ERROR_FREE_SESSION');
    }
    this.sessionCommandErrors = 0;
    this.sessionCommands = 0;
  }

  // ── Achievement unlock ────────────────────────────────────────────────────────
  async checkAndUnlockAchievement(userId, achievementId) {
    if (!userId || !achievementId) return false;
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      const achieved = userData.achievements || [];

      if (achieved.includes(achievementId)) return false;

      const achievement = this.ACHIEVEMENTS[achievementId];
      if (!achievement) return false;

      const updates = { achievements: arrayUnion(achievementId) };
      if (achievement.xp > 0) updates.xp = increment(achievement.xp);
      await updateDoc(userRef, updates);

      if (achievement.xp > 0) {
        await this.addXpHistoryEntry(userId, achievement.xp, `Logro desbloqueado: ${achievement.name}`, 'achievement');
        const currentXP = userData.xp || 0;
        await this.checkLevelUp(userId, currentXP, achievement.xp);
      }

      // Store for notification
      await updateDoc(userRef, { newAchievements: arrayUnion(achievement) });

      // Emit achievement toast via event bus
      xpEventBus.emitAchievement(achievement);

      return true;
    } catch (error) {
      console.error('Error checking achievement:', error);
      return false;
    }
  }

  async clearNewAchievements(userId) {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), { newAchievements: [] });
    } catch (e) {
      console.error('clearNewAchievements:', e);
    }
  }

  // ── Admin XP grant ────────────────────────────────────────────────────────────
  async grantXP(userId, amount, reason = 'Bonificación administrativa') {
    if (!userId || !amount || amount <= 0) return { success: false };
    const result = await this._applyXP(userId, amount, reason, 'admin_bonus');
    return result ? { success: true, ...result } : { success: false };
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────────
  async getLeaderboard(limitCount = 50) {
    try {
      // Load inactive commission codes for legacy detection
      const commissionsSnap = await getDocs(collection(db, 'commissions'));
      const inactiveCodes = new Set();
      commissionsSnap.forEach(d => {
        const c = d.data();
        if (c.active === false && c.code) inactiveCodes.add(c.code);
      });

      const usersQuery = query(
        collection(db, 'users'),
        orderBy('xp', 'desc'),
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(usersQuery);
      const leaderboard = [];

      snapshot.forEach(d => {
        const data = d.data();
        if (data.role === 'admin') return;

        const isLegacy = data.commissionCode
          ? inactiveCodes.has(data.commissionCode)
          : false;

        leaderboard.push({
          id: d.id,
          name: data.displayName || data.email,
          email: data.email,
          xp: data.xp || 0,
          level: this.calculateLevel(data.xp || 0),
          levelTitle: this.getLevelTitle(this.calculateLevel(data.xp || 0)),
          pnrsCreated: data.pnrsCreated || 0,
          avgPNRTime: data.lastPNRCreationTime
            ? parseFloat(data.lastPNRCreationTime).toFixed(1)
            : '0.0',
          achievements: data.achievements || [],
          achievementCount: (data.achievements || []).length,
          commissionName: data.commissionName || '',
          commissionCode: data.commissionCode || '',
          isLegacy,
        });
      });

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // ── Calculation helpers ───────────────────────────────────────────────────────
  calculateLevel(totalXp) {
    if (typeof totalXp !== 'number' || isNaN(totalXp)) return 1;
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= this.LEVELS[i].requiredXP) return this.LEVELS[i].level;
    }
    return 1;
  }

  calculateXpForNextLevel(currentLevel) {
    const next = this.LEVELS.find(l => l.level > currentLevel);
    return next ? next.requiredXP : null;
  }

  getLevelTitle(level) {
    return this.LEVELS.find(l => l.level === level)?.title || 'Desconocido';
  }

  async getLastActivity(userId) {
    if (!userId) return null;
    try {
      return (await getDoc(doc(db, 'users', userId))).data()?.lastActivity || null;
    } catch { return null; }
  }

  // ── Private helpers ───────────────────────────────────────────────────────────
  async _incrementEarlyBirdStreak(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const today = new Date().toDateString();
      await updateDoc(userRef, { earlyBirdDays: arrayUnion(today) });
      const earlyBirdDays = (await getDoc(userRef)).data()?.earlyBirdDays || [];
      if ([...new Set(earlyBirdDays)].length >= 5) {
        await this.checkAndUnlockAchievement(userId, 'EARLY_BIRD');
      }
    } catch (e) { console.warn('earlyBirdStreak:', e); }
  }

  _levenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }

  _continent(airportCode) {
    const map = {
      JFK: 'NA', LAX: 'NA', MIA: 'NA', YYZ: 'NA', MEX: 'NA', ORD: 'NA', ATL: 'NA',
      EZE: 'SA', GRU: 'SA', SCL: 'SA', BOG: 'SA', LIM: 'SA', GIG: 'SA', MVD: 'SA',
      LHR: 'EU', CDG: 'EU', FCO: 'EU', MAD: 'EU', FRA: 'EU', AMS: 'EU', BCN: 'EU', LIS: 'EU',
      NRT: 'AS', PEK: 'AS', HKG: 'AS', BKK: 'AS', SIN: 'AS', DXB: 'AS', DOH: 'AS',
      JNB: 'AF', CAI: 'AF', CPT: 'AF', NBO: 'AF', ADD: 'AF', LOS: 'AF',
      SYD: 'OC', MEL: 'OC', AKL: 'OC', PER: 'OC', BNE: 'OC',
    };
    return map[airportCode] || null;
  }
}

export default new ExperienceService();