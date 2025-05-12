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
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

class ExperienceService {
  // Sistema de niveles
  LEVELS = [
    { level: 1, requiredXP: 0, title: 'Novato' },
    { level: 2, requiredXP: 100, title: 'Principiante' },
    { level: 3, requiredXP: 250, title: 'Aprendiz' },
    { level: 4, requiredXP: 500, title: 'Intermedio' },
    { level: 5, requiredXP: 1000, title: 'Avanzado' },
    { level: 6, requiredXP: 1750, title: 'Experto' },
    { level: 7, requiredXP: 2750, title: 'Maestro' },
    { level: 8, requiredXP: 4000, title: 'Gran Maestro' },
    { level: 9, requiredXP: 5500, title: 'Elite' },
    { level: 10, requiredXP: 7500, title: 'Leyenda' }
  ];

  // Valores de XP por acción
  XP_VALUES = {
    COMMAND_SUCCESS: 2,
    COMMAND_ERROR: 1,
    PNR_CREATED: 50,
    PNR_FAST_CREATION: 25,
    PNR_ERROR: 5,
    ACHIEVEMENT_MULTIPLIER: 1
  };

  // Sistema de rareza
  RARITY = {
    COMMON: { name: 'Común', color: 'gray' },
    UNCOMMON: { name: 'Poco Común', color: 'green' },
    RARE: { name: 'Raro', color: 'blue' },
    EPIC: { name: 'Épico', color: 'purple' },
    LEGENDARY: { name: 'Legendario', color: 'orange' }
  };

  // Definición de todos los achievements
  ACHIEVEMENTS = {
    // Achievements de Progreso (existentes)
    FIRST_STEPS: {
      id: 'FIRST_STEPS',
      name: 'Primeros Pasos',
      description: 'Ejecuta tu primer comando',
      icon: '🎯',
      xp: 10,
      rarity: 'COMMON',
      secret: false
    },
    PNR_NOVICE: {
      id: 'PNR_NOVICE',
      name: 'Novato PNR',
      description: 'Crea tu primer PNR',
      icon: '📋',
      xp: 25,
      rarity: 'COMMON',
      secret: false
    },
    COMMAND_MASTER: {
      id: 'COMMAND_MASTER',
      name: 'Maestro de Comandos',
      description: 'Ejecuta 100 comandos exitosos',
      icon: '⌨️',
      xp: 50,
      rarity: 'UNCOMMON',
      secret: false
    },
    QUICK_LEARNER: {
      id: 'QUICK_LEARNER',
      name: 'Aprendizaje Rápido',
      description: 'Alcanza el nivel 3',
      icon: '📚',
      xp: 30,
      rarity: 'UNCOMMON',
      secret: false
    },
    PNR_EXPERT: {
      id: 'PNR_EXPERT',
      name: 'Experto PNR',
      description: 'Crea 10 PNRs',
      icon: '🏆',
      xp: 75,
      rarity: 'RARE',
      secret: false
    },
    SPEED_RUNNER: {
      id: 'SPEED_RUNNER',
      name: 'Velocista',
      description: 'Crea un PNR en menos de 2 minutos',
      icon: '⚡',
      xp: 40,
      rarity: 'RARE',
      secret: false
    },
    PERFECTIONIST: {
      id: 'PERFECTIONIST',
      name: 'Perfeccionista',
      description: 'Crea 5 PNRs sin errores consecutivos',
      icon: '✨',
      xp: 60,
      rarity: 'EPIC',
      secret: false
    },

    // Achievements Graciosos - Errores
    NOT_FOUND: {
      id: 'NOT_FOUND',
      name: '404 Flight Not Found',
      description: 'Busca vuelos entre ciudades inexistentes 10 veces',
      icon: '🛫',
      xp: 15,
      rarity: 'UNCOMMON',
      secret: true
    },
    OOPS_WRONG_BUTTON: {
      id: 'OOPS_WRONG_BUTTON',
      name: 'Oops, Wrong Button',
      description: 'Ejecuta 50 comandos inválidos',
      icon: '🙈',
      xp: 20,
      rarity: 'UNCOMMON',
      secret: true
    },
    LOST_IN_TRANSLATION: {
      id: 'LOST_IN_TRANSLATION',
      name: 'Lost in Translation',
      description: 'Escribe 20 comandos con errores tipográficos',
      icon: '🗺️',
      xp: 15,
      rarity: 'COMMON',
      secret: true
    },
    GHOST_PASSENGER: {
      id: 'GHOST_PASSENGER',
      name: 'Ghost Passenger',
      description: 'Intenta crear un PNR sin pasajeros',
      icon: '👻',
      xp: 10,
      rarity: 'COMMON',
      secret: true
    },

    // Achievements de Comportamiento
    NIGHT_OWL: {
      id: 'NIGHT_OWL',
      name: 'Night Owl',
      description: 'Usa el sistema entre 12 AM y 5 AM',
      icon: '🦉',
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false
    },
    COFFEE_BREAK: {
      id: 'COFFEE_BREAK',
      name: 'Coffee Break',
      description: 'Vuelve después de 1 hora de inactividad',
      icon: '☕',
      xp: 10,
      rarity: 'COMMON',
      secret: false
    },
    COPY_PASTE_MASTER: {
      id: 'COPY_PASTE_MASTER',
      name: 'Copy Paste Master',
      description: 'Ejecuta el mismo comando 10 veces seguidas',
      icon: '📋',
      xp: 15,
      rarity: 'UNCOMMON',
      secret: true
    },
    THE_EXPLORER: {
      id: 'THE_EXPLORER',
      name: 'The Explorer',
      description: 'Busca vuelos a 20 destinos diferentes',
      icon: '🗺️',
      xp: 40,
      rarity: 'RARE',
      secret: false
    },
    HOMESICK: {
      id: 'HOMESICK',
      name: 'Homesick',
      description: 'Busca 10 vuelos desde/hacia tu ciudad base',
      icon: '🏠',
      xp: 20,
      rarity: 'UNCOMMON',
      secret: true
    },

    // Achievements Temáticos
    AROUND_THE_WORLD: {
      id: 'AROUND_THE_WORLD',
      name: 'Around the World',
      description: 'Crea PNRs con vuelos en todos los continentes',
      icon: '🌍',
      xp: 100,
      rarity: 'LEGENDARY',
      secret: false
    },
    WEEKEND_WARRIOR: {
      id: 'WEEKEND_WARRIOR',
      name: 'Weekend Warrior',
      description: 'Usa el sistema solo fines de semana por un mes',
      icon: '📅',
      xp: 35,
      rarity: 'RARE',
      secret: false
    },
    EARLY_BIRD: {
      id: 'EARLY_BIRD',
      name: 'Early Bird',
      description: 'Usa el sistema antes de las 7 AM durante 5 días',
      icon: '🐦',
      xp: 30,
      rarity: 'RARE',
      secret: false
    },
    FREQUENT_FLYER: {
      id: 'FREQUENT_FLYER',
      name: 'Frequent Flyer',
      description: 'Crea 50 PNRs con el mismo pasajero',
      icon: '✈️',
      xp: 75,
      rarity: 'EPIC',
      secret: false
    },

    // Easter Eggs
    THE_ANSWER: {
      id: 'THE_ANSWER',
      name: 'The Answer',
      description: 'Ejecuta exactamente 42 comandos en un día',
      icon: '42',
      xp: 42,
      rarity: 'RARE',
      secret: true
    },
    LUCKY_SEVEN: {
      id: 'LUCKY_SEVEN',
      name: 'Lucky Seven',
      description: 'Crea un PNR con 7 segmentos',
      icon: '🎰',
      xp: 77,
      rarity: 'EPIC',
      secret: true
    },
    BINARY_MASTER: {
      id: 'BINARY_MASTER',
      name: 'Binary Master',
      description: 'Ejecuta 1010 comandos en total',
      icon: '💻',
      xp: 101,
      rarity: 'EPIC',
      secret: true
    },
    FLIGHT_CLUB: {
      id: 'FLIGHT_CLUB',
      name: 'Flight Club',
      description: 'Primera regla: no hablar del Flight Club',
      icon: '🥊',
      xp: 50,
      rarity: 'RARE',
      secret: true
    },

    // Achievements de Persistencia
    COMEBACK_KID: {
      id: 'COMEBACK_KID',
      name: 'Comeback Kid',
      description: 'Vuelve después de 7 días de inactividad',
      icon: '🔄',
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false
    },
    MARATHON_RUNNER: {
      id: 'MARATHON_RUNNER',
      name: 'Marathon Runner',
      description: 'Usa el sistema durante 2 horas continuas',
      icon: '🏃',
      xp: 40,
      rarity: 'RARE',
      secret: false
    },
    CONSISTENCY_KEY: {
      id: 'CONSISTENCY_KEY',
      name: 'Consistency is Key',
      description: 'Usa el sistema todos los días durante una semana',
      icon: '🔑',
      xp: 50,
      rarity: 'RARE',
      secret: false
    },
    THE_VETERAN: {
      id: 'THE_VETERAN',
      name: 'The Veteran',
      description: 'Usa el sistema durante 30 días diferentes',
      icon: '🎖️',
      xp: 100,
      rarity: 'EPIC',
      secret: false
    },

    // Achievements Sociales
    TOP_CLASS: {
      id: 'TOP_CLASS',
      name: 'Top of the Class',
      description: 'Alcanza el top 3 del leaderboard',
      icon: '🏆',
      xp: 75,
      rarity: 'EPIC',
      secret: false
    },
    RISING_STAR: {
      id: 'RISING_STAR',
      name: 'Rising Star',
      description: 'Sube 5 posiciones en el leaderboard en una semana',
      icon: '⭐',
      xp: 40,
      rarity: 'RARE',
      secret: false
    },
    HELPING_HAND: {
      id: 'HELPING_HAND',
      name: 'Helping Hand',
      description: 'Usa el comando HELP 10 veces',
      icon: '🤝',
      xp: 15,
      rarity: 'COMMON',
      secret: false
    },

    // Achievements Estacionales
    HOLIDAY_SPIRIT: {
      id: 'HOLIDAY_SPIRIT',
      name: 'Holiday Spirit',
      description: 'Crea PNRs durante días festivos',
      icon: '🎄',
      xp: 30,
      rarity: 'UNCOMMON',
      secret: false
    },
    SUMMER_VACATION: {
      id: 'SUMMER_VACATION',
      name: 'Summer Vacation',
      description: 'Crea PNRs a destinos de playa en verano',
      icon: '🏖️',
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false
    },
    WINTER_IS_COMING: {
      id: 'WINTER_IS_COMING',
      name: 'Winter is Coming',
      description: 'Crea PNRs a destinos fríos en invierno',
      icon: '❄️',
      xp: 25,
      rarity: 'UNCOMMON',
      secret: false
    }
  };

  constructor() {
    this.sessionStartTime = null;
    this.pnrStartTime = null;
    this.lastCommandTime = null;
    this.lastCommand = null;
    this.sameCommandCount = 0;
    this.sessionCommands = 0;
    this.consecutivePerfectPNRs = 0;
    this.uniqueDestinations = new Set();
    this.homeCity = null;
    this.homeCitySearches = 0;
    this.hadPNRError = false;
  }

  // Iniciar sesión
  async startSession(userId) {
    this.sessionStartTime = Date.now();
    const lastActivity = await this.getLastActivity(userId);
    
    if (lastActivity) {
      const inactiveDays = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));
      if (inactiveDays >= 7) {
        await this.checkAndUnlockAchievement(userId, 'COMEBACK_KID');
      }
    }

    // Verificar hora para Night Owl
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      await this.checkAndUnlockAchievement(userId, 'NIGHT_OWL');
    }

    // Verificar hora para Early Bird
    if (hour >= 5 && hour < 7) {
      await this.incrementEarlyBirdStreak(userId);
    }
  }

  // Actualizar método recordSuccessfulCommand para nuevos achievements
  async recordSuccessfulCommand(userId, command, commandType) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Primeros pasos - primer comando
      if (!userData.commandsExecuted || userData.commandsExecuted === 0) {
        await this.checkAndUnlockAchievement(userId, 'FIRST_STEPS');
      }

      // Actualizar estadísticas básicas
      const updates = {
        commandsExecuted: increment(1),
        successfulCommands: increment(1),
        xp: increment(this.XP_VALUES.COMMAND_SUCCESS),
        lastActivity: Date.now()
      };

      // Verificar Copy Paste Master
      if (command === this.lastCommand) {
        this.sameCommandCount++;
        if (this.sameCommandCount >= 10) {
          await this.checkAndUnlockAchievement(userId, 'COPY_PASTE_MASTER');
        }
      } else {
        this.sameCommandCount = 1;
        this.lastCommand = command;
      }

      // Contar comandos de esta sesión
      this.sessionCommands++;

      // Verificar comandos diarios para "The Answer"
      const today = new Date().toDateString();
      const dailyStats = userData.dailyStats || {};
      const todayStats = dailyStats[today] || { commands: 0 };
      todayStats.commands = (todayStats.commands || 0) + 1;

      if (todayStats.commands === 42) {
        await this.checkAndUnlockAchievement(userId, 'THE_ANSWER');
      }

      updates.dailyStats = {
        ...dailyStats,
        [today]: todayStats
      };

      // Verificar destinos únicos para The Explorer
      if (commandType === 'AN' || commandType === 'SN') {
        const destinationMatch = command.match(/[A-Z]{3}([A-Z]{3})/);
        if (destinationMatch) {
          const destination = destinationMatch[1];
          this.uniqueDestinations.add(destination);
          
          // Guardar destinos únicos en Firebase
          updates.uniqueDestinations = arrayUnion(destination);
          
          if (this.uniqueDestinations.size >= 20) {
            await this.checkAndUnlockAchievement(userId, 'THE_EXPLORER');
          }

          // Verificar Homesick
          if (!this.homeCity && userData.homeCity) {
            this.homeCity = userData.homeCity;
          }
          
          if (this.homeCity && (command.includes(this.homeCity) || command.includes(`${this.homeCity}`))) {
            this.homeCitySearches++;
            if (this.homeCitySearches >= 10) {
              await this.checkAndUnlockAchievement(userId, 'HOMESICK');
            }
          }
        }
      }

      // Verificar HELP commands
      if (command.toUpperCase().startsWith('HE') || command.toUpperCase() === 'HELP') {
        updates.helpCommandsUsed = increment(1);
        const helpCount = (userData.helpCommandsUsed || 0) + 1;
        
        if (helpCount >= 10) {
          await this.checkAndUnlockAchievement(userId, 'HELPING_HAND');
        }
      }

      // Verificar Binary Master
      const totalCommands = (userData.commandsExecuted || 0) + 1;
      if (totalCommands === 1010) {
        await this.checkAndUnlockAchievement(userId, 'BINARY_MASTER');
      }

      // Verificar Command Master
      if ((userData.successfulCommands || 0) + 1 >= 100) {
        await this.checkAndUnlockAchievement(userId, 'COMMAND_MASTER');
      }

      // Actualizar usuario
      await updateDoc(userRef, updates);

      // Verificar nivel para Quick Learner
      const newXP = (userData.xp || 0) + this.XP_VALUES.COMMAND_SUCCESS;
      const newLevel = this.calculateLevel(newXP);
      
      if (newLevel >= 3) {
        await this.checkAndUnlockAchievement(userId, 'QUICK_LEARNER');
      }

      // Verificar session duration
      if (this.sessionStartTime) {
        const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutos
        if (sessionDuration >= 120) {
          await this.checkAndUnlockAchievement(userId, 'MARATHON_RUNNER');
        }
      }

      // Actualizar tiempo del último comando
      this.lastCommandTime = Date.now();

    } catch (error) {
      console.error('Error recording successful command:', error);
    }
  }

  // Actualizar método recordCommandError para nuevos achievements
  async recordCommandError(userId, command, error) {
    try {
      const userRef = doc(db, 'users', userId);
      
      const updates = {
        commandsExecuted: increment(1),
        commandErrors: increment(1),
        xp: increment(this.XP_VALUES.COMMAND_ERROR),
        lastActivity: Date.now()
      };

      // Verificar tipos de errores
      if (error.includes('No se encontró información') || error.includes('ciudad no válida')) {
        updates.notFoundErrors = increment(1);
        
        const userDoc = await getDoc(userRef);
        const notFoundErrors = (userDoc.data()?.notFoundErrors || 0) + 1;
        
        if (notFoundErrors >= 10) {
          await this.checkAndUnlockAchievement(userId, 'NOT_FOUND');
        }
      }

      // Verificar errores tipográficos
      const validCommands = ['AN', 'SN', 'TN', 'SS', 'NM', 'AP', 'RF', 'ET', 'ER', 'RT', 'XI'];
      const cmdStart = command.substring(0, 2).toUpperCase();
      
      const isTypo = validCommands.some(valid => {
        return cmdStart.length === valid.length && 
               cmdStart !== valid && 
               this.calculateLevenshteinDistance(cmdStart, valid) <= 1;
      });

      if (isTypo) {
        updates.typoErrors = increment(1);
        
        const userDoc = await getDoc(userRef);
        const typoErrors = (userDoc.data()?.typoErrors || 0) + 1;
        
        if (typoErrors >= 20) {
          await this.checkAndUnlockAchievement(userId, 'LOST_IN_TRANSLATION');
        }
      }

      // Verificar total de errores
      const userDoc = await getDoc(userRef);
      const totalErrors = (userDoc.data()?.commandErrors || 0) + 1;
      
      if (totalErrors >= 50) {
        await this.checkAndUnlockAchievement(userId, 'OOPS_WRONG_BUTTON');
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error recording command error:', error);
    }
  }

  // Iniciar creación de PNR
  async startPNRCreation() {
    this.pnrStartTime = Date.now();
    this.hadPNRError = false;
    return this.pnrStartTime;
  }

  // Registrar error durante creación de PNR
  async recordPNRError(userId) {
    this.hadPNRError = true;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      xp: increment(this.XP_VALUES.PNR_ERROR),
      pnrErrors: increment(1)
    });
  }

  // Actualizar método completePNR para nuevos achievements
  async completePNR(userId, pnrId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Primer PNR
      if (!userData.pnrsCreated || userData.pnrsCreated === 0) {
        await this.checkAndUnlockAchievement(userId, 'PNR_NOVICE');
      }

      const pnrRef = doc(db, 'pnrs', pnrId);
      const pnrDoc = await getDoc(pnrRef);
      const pnrData = pnrDoc.data();

      // Calcular tiempo de creación
      const creationTime = Date.now() - this.pnrStartTime;
      const creationMinutes = creationTime / 1000 / 60;

      // XP base por crear PNR
      let xpGained = this.XP_VALUES.PNR_CREATED;

      // Bonus por creación rápida
      if (creationMinutes < 2) {
        xpGained += this.XP_VALUES.PNR_FAST_CREATION;
        await this.checkAndUnlockAchievement(userId, 'SPEED_RUNNER');
      }

      // Actualizar estadísticas
      const updates = {
        pnrsCreated: increment(1),
        xp: increment(xpGained),
        lastActivity: Date.now(),
        lastPNRCreationTime: creationMinutes
      };

      // Verificar Lucky Seven
      if (pnrData.segments && pnrData.segments.length === 7) {
        await this.checkAndUnlockAchievement(userId, 'LUCKY_SEVEN');
      }

      // Verificar continentes para Around the World
      if (pnrData.segments) {
        const continents = new Set();
        pnrData.segments.forEach(segment => {
          const continent = this.getContinent(segment.destination);
          if (continent) continents.add(continent);
        });

        updates.continentsVisited = arrayUnion(...continents);
        
        const userContinents = new Set(userData.continentsVisited || []);
        continents.forEach(c => userContinents.add(c));
        
        if (userContinents.size >= 6) {
          await this.checkAndUnlockAchievement(userId, 'AROUND_THE_WORLD');
        }
      }

      // Verificar Frequent Flyer
      if (pnrData.passengers && pnrData.passengers.length > 0) {
        const mainPassenger = `${pnrData.passengers[0].lastName}/${pnrData.passengers[0].firstName}`;
        
        const passengerPNRs = userData.passengerPNRs || {};
        passengerPNRs[mainPassenger] = (passengerPNRs[mainPassenger] || 0) + 1;
        
        if (passengerPNRs[mainPassenger] >= 50) {
          await this.checkAndUnlockAchievement(userId, 'FREQUENT_FLYER');
        }
        
        updates.passengerPNRs = passengerPNRs;
      }

      await updateDoc(userRef, updates);

      // Verificar PNR Expert
      const totalPNRs = (userData.pnrsCreated || 0) + 1;
      if (totalPNRs >= 10) {
        await this.checkAndUnlockAchievement(userId, 'PNR_EXPERT');
      }

      // Resetear contador de PNR perfectos si no tuvo errores
      if (!this.hadPNRError) {
        this.consecutivePerfectPNRs++;
        if (this.consecutivePerfectPNRs >= 5) {
          await this.checkAndUnlockAchievement(userId, 'PERFECTIONIST');
        }
      } else {
        this.consecutivePerfectPNRs = 0;
      }

      this.pnrStartTime = null;
      this.hadPNRError = false;

      return {
        xpGained,
        newXP: (userData.xp || 0) + xpGained,
        newLevel: this.calculateLevel((userData.xp || 0) + xpGained),
        levelUp: this.calculateLevel((userData.xp || 0) + xpGained) > this.calculateLevel(userData.xp || 0),
        achievements: userData.newAchievements || []
      };
    } catch (error) {
      console.error('Error completing PNR:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  async checkAndUnlockAchievement(userId, achievementId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      
      const achievements = userData.achievements || [];
      
      if (!achievements.includes(achievementId)) {
        const achievement = this.ACHIEVEMENTS[achievementId];
        
        await updateDoc(userRef, {
          achievements: arrayUnion(achievementId),
          xp: increment(achievement.xp),
          newAchievements: arrayUnion(achievement)
        });

        console.log(`Achievement unlocked: ${achievement.name}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking achievement:', error);
      return false;
    }
  }

  calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getContinent(airportCode) {
    // Mapeo simplificado de aeropuertos a continentes
    const continentMap = {
      // América del Norte
      'JFK': 'NA', 'LAX': 'NA', 'MIA': 'NA', 'YYZ': 'NA', 'MEX': 'NA',
      // América del Sur
      'EZE': 'SA', 'GRU': 'SA', 'SCL': 'SA', 'BOG': 'SA', 'LIM': 'SA',
      // Europa
      'LHR': 'EU', 'CDG': 'EU', 'FCO': 'EU', 'MAD': 'EU', 'FRA': 'EU',
      // Asia
      'NRT': 'AS', 'PEK': 'AS', 'HKG': 'AS', 'BKK': 'AS', 'SIN': 'AS',
      // África
      'JNB': 'AF', 'CAI': 'AF', 'CPT': 'AF', 'NBO': 'AF', 'ADD': 'AF',
      // Oceanía
     'SYD': 'OC', 'MEL': 'OC', 'AKL': 'OC', 'PER': 'OC', 'BNE': 'OC'
   };
   
   return continentMap[airportCode] || null;
 }

 // Calcular nivel basado en XP total
 calculateLevel(totalXp) {
   // Fórmula: Nivel = sqrt(XP / 100)
   return Math.floor(Math.sqrt(totalXp / 100)) + 1;
 }

 // Calcular XP necesario para el siguiente nivel
 calculateXpForNextLevel(currentLevel) {
   return Math.pow(currentLevel, 2) * 100;
 }

 async getLastActivity(userId) {
   try {
     const userRef = doc(db, 'users', userId);
     const userDoc = await getDoc(userRef);
     return userDoc.data()?.lastActivity || null;
   } catch (error) {
     console.error('Error getting last activity:', error);
     return null;
   }
 }

 async incrementEarlyBirdStreak(userId) {
   try {
     const userRef = doc(db, 'users', userId);
     const today = new Date().toDateString();
     
     await updateDoc(userRef, {
       earlyBirdDays: arrayUnion(today)
     });
     
     const userDoc = await getDoc(userRef);
     const earlyBirdDays = userDoc.data()?.earlyBirdDays || [];
     
     if (earlyBirdDays.length >= 5) {
       await this.checkAndUnlockAchievement(userId, 'EARLY_BIRD');
     }
   } catch (error) {
     console.error('Error incrementing early bird streak:', error);
   }
 }

 // Verificar logros básicos
 async checkBasicAchievements(userId, userData) {
   try {
     // Commands executed
     const commandsExecuted = (userData.commandsExecuted || 0) + 1;
     if (commandsExecuted === 1) {
       await this.checkAndUnlockAchievement(userId, 'FIRST_STEPS');
     }
     
     // PNRs created
     const pnrsCreated = (userData.pnrsCreated || 0) + 1;
     if (pnrsCreated === 1) {
       await this.checkAndUnlockAchievement(userId, 'PNR_NOVICE');
     }
     if (pnrsCreated >= 10) {
       await this.checkAndUnlockAchievement(userId, 'PNR_EXPERT');
     }
     
     // Level achievements
     const currentLevel = this.calculateLevel(userData.xp || 0);
     if (currentLevel >= 3) {
       await this.checkAndUnlockAchievement(userId, 'QUICK_LEARNER');
     }
     
     // Successful commands
     const successfulCommands = (userData.successfulCommands || 0) + 1;
     if (successfulCommands >= 100) {
       await this.checkAndUnlockAchievement(userId, 'COMMAND_MASTER');
     }
   } catch (error) {
     console.error('Error checking basic achievements:', error);
   }
 }

 // Verificar logros relacionados con comandos
 async checkCommandAchievements(userId) {
   try {
     const userRef = doc(db, 'users', userId);
     const userDoc = await getDoc(userRef);
     const userData = userDoc.data();
     
     const successfulCommands = userData.successfulCommands || 0;
     
     // Maestro de comandos (100 comandos exitosos)
     if (successfulCommands >= 100) {
       await this.checkAndUnlockAchievement(userId, 'COMMAND_MASTER');
     }
   } catch (error) {
     console.error('Error checking command achievements:', error);
   }
 }

 // Obtener ranking de usuarios
 async getLeaderboard(limitCount = 10) {
   try {
     const usersQuery = query(
       collection(db, 'users'),
       orderBy('xp', 'desc'),
       firestoreLimit(limitCount)
     );
     
     const snapshot = await getDocs(usersQuery);
     const leaderboard = [];
     
     snapshot.forEach((doc) => {
       const data = doc.data();
       leaderboard.push({
         id: doc.id,
         name: data.displayName || data.email,
         email: data.email,
         xp: data.xp || 0,
         level: this.calculateLevel(data.xp || 0),
         pnrsCreated: data.pnrsCreated || 0,
         avgPNRTime: data.lastPNRCreationTime 
           ? data.lastPNRCreationTime.toFixed(1)
           : '0.0',
         achievements: data.achievements || [],
         commissionName: data.commissionName || '',
         commissionCode: data.commissionCode || ''
       });
     });
     
     return leaderboard;
   } catch (error) {
     console.error('Error getting leaderboard:', error);
     throw error;
   }
 }
}

export default new ExperienceService();