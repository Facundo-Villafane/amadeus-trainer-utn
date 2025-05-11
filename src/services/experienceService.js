// src/services/experienceService.js
import { 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  serverTimestamp, 
  getDoc,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,  // Renombrar la importación para evitar conflictos
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Configuración de XP
const XP_VALUES = {
  COMMAND_SUCCESS: 5,        // Comando exitoso
  PNR_COMPLETE: 100,        // PNR completo sin errores
  FAST_PNR: 50,            // Bonus por PNR rápido (< 2 minutos)
  PERFECT_PNR: 75,         // Bonus por PNR sin ningún error
  DAILY_STREAK: 25,        // Bonus por racha diaria
  WEEKLY_STREAK: 100,      // Bonus por racha semanal
  LEVEL_UP: 50             // Bonus por subir de nivel
};

// Configuración de medallas/logros
const ACHIEVEMENTS = {
  FIRST_PNR: {
    id: 'first_pnr',
    name: 'Primer PNR',
    description: 'Crea tu primer PNR',
    xp: 50,
    icon: '🏆'
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Demonio de la Velocidad',
    description: 'Crea un PNR en menos de 1 minuto',
    xp: 100,
    icon: '⚡'
  },
  PERFECT_STREAK_5: {
    id: 'perfect_streak_5',
    name: 'Racha Perfecta',
    description: 'Crea 5 PNRs perfectos consecutivos',
    xp: 200,
    icon: '🔥'
  },
  COMMAND_MASTER: {
    id: 'command_master',
    name: 'Maestro de Comandos',
    description: 'Ejecuta 100 comandos correctamente',
    xp: 150,
    icon: '🎯'
  },
  PNR_EXPERT: {
    id: 'pnr_expert',
    name: 'Experto en PNRs',
    description: 'Crea 50 PNRs exitosamente',
    xp: 300,
    icon: '👑'
  },
  EFFICIENCY_EXPERT: {
    id: 'efficiency_expert',
    name: 'Experto en Eficiencia',
    description: 'Promedio de tiempo < 2 minutos en últimos 10 PNRs',
    xp: 200,
    icon: '⏱️'
  }
};

class ExperienceService {
  // Calcular nivel basado en XP total
  calculateLevel(totalXp) {
    // Fórmula: Nivel = sqrt(XP / 100)
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }

  // Calcular XP necesario para el siguiente nivel
  calculateXpForNextLevel(currentLevel) {
    return Math.pow(currentLevel, 2) * 100;
  }

  // Registrar comando exitoso
  async recordSuccessfulCommand(userId, command, commandType) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Actualizar estadísticas
      await updateDoc(userRef, {
        'stats.commandsExecuted': increment(1),
        'stats.successfulCommands': increment(1),
        'stats.lastActivity': serverTimestamp(),
        'xp': increment(XP_VALUES.COMMAND_SUCCESS),
        [`commandStats.${commandType}`]: increment(1)
      });

      // Verificar logros relacionados con comandos
      await this.checkCommandAchievements(userId);
      
      return { xpGained: XP_VALUES.COMMAND_SUCCESS };
    } catch (error) {
      console.error('Error recording command:', error);
      throw error;
    }
  }

  // Registrar error de comando
  async recordCommandError(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        'stats.commandErrors': increment(1),
        'stats.lastActivity': serverTimestamp()
      });
    } catch (error) {
      console.error('Error recording command error:', error);
    }
  }

  // Iniciar creación de PNR (para medir tiempo)
  async startPNRCreation(userId) {
    const startTime = Date.now();
    
    // Guardar tiempo de inicio en memoria o en Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'currentPNR.startTime': startTime,
      'currentPNR.errorCount': 0
    });
    
    return startTime;
  }

  // Registrar error durante creación de PNR
  async recordPNRError(userId) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'currentPNR.errorCount': increment(1)
    });
  }

  // Completar PNR
  async completePNR(userId, pnrId, recordLocator) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const endTime = Date.now();
      const startTime = userData.currentPNR?.startTime || endTime;
      const duration = (endTime - startTime) / 1000; // en segundos
      const errorCount = userData.currentPNR?.errorCount || 0;
      
      let totalXp = XP_VALUES.PNR_COMPLETE;
      const achievements = [];
      
      // Bonus por velocidad
      if (duration < 60) { // Menos de 1 minuto
        totalXp += XP_VALUES.FAST_PNR * 2;
        achievements.push(ACHIEVEMENTS.SPEED_DEMON);
      } else if (duration < 120) { // Menos de 2 minutos
        totalXp += XP_VALUES.FAST_PNR;
      }
      
      // Bonus por PNR perfecto (sin errores)
      if (errorCount === 0) {
        totalXp += XP_VALUES.PERFECT_PNR;
      }
      
      // Actualizar estadísticas
      const updates = {
        'xp': increment(totalXp),
        'stats.pnrsCreated': increment(1),
        'stats.totalPNRTime': increment(duration),
        'stats.lastPNRTime': duration,
        'stats.perfectPNRs': errorCount === 0 ? increment(1) : increment(0),
        'pnrTimes': arrayUnion({
          pnrId,
          recordLocator,
          duration,
          errorCount,
          timestamp: serverTimestamp(),
          xpGained: totalXp
        })
      };
      
      // Si es el primer PNR
      if ((userData.stats?.pnrsCreated || 0) === 0) {
        achievements.push(ACHIEVEMENTS.FIRST_PNR);
      }
      
      // Actualizar logros
      for (const achievement of achievements) {
        if (!userData.achievements?.includes(achievement.id)) {
          updates.achievements = arrayUnion(achievement.id);
          updates.xp = increment(achievement.xp);
          totalXp += achievement.xp;
        }
      }
      
      // Limpiar estado temporal
      updates['currentPNR'] = null;
      
      await updateDoc(userRef, updates);
      
      // Verificar subida de nivel
      const newTotalXp = (userData.xp || 0) + totalXp;
      const currentLevel = this.calculateLevel(userData.xp || 0);
      const newLevel = this.calculateLevel(newTotalXp);
      
      if (newLevel > currentLevel) {
        await updateDoc(userRef, {
          'level': newLevel,
          'xp': increment(XP_VALUES.LEVEL_UP)
        });
        totalXp += XP_VALUES.LEVEL_UP;
      }
      
      return {
        xpGained: totalXp,
        duration,
        errorCount,
        achievements,
        levelUp: newLevel > currentLevel ? newLevel : null
      };
    } catch (error) {
      console.error('Error completing PNR:', error);
      throw error;
    }
  }

  // Verificar logros relacionados con comandos
  async checkCommandAchievements(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const successfulCommands = userData.stats?.successfulCommands || 0;
      
      // Maestro de comandos (100 comandos exitosos)
      if (successfulCommands >= 100 && !userData.achievements?.includes('command_master')) {
        await updateDoc(userRef, {
          achievements: arrayUnion('command_master'),
          xp: increment(ACHIEVEMENTS.COMMAND_MASTER.xp)
        });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
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
          pnrsCreated: data.stats?.pnrsCreated || 0,
          avgPNRTime: data.stats?.totalPNRTime 
            ? (data.stats.totalPNRTime / data.stats.pnrsCreated).toFixed(1)
            : 0,
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

  // Hacer público ACHIEVEMENTS para usar en otros componentes
  ACHIEVEMENTS = ACHIEVEMENTS;
}

export default new ExperienceService();