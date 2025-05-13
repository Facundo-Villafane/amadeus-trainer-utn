// src/components/profile/AchievementsSection.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiAward, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import experienceService from '../../services/experienceService';

export default function AchievementsSection({ currentUser }) {
  const [userData, setUserData] = useState({
    xp: 0,
    level: 1,
    achievements: []
  });
  const [loading, setLoading] = useState(true);
  const [showSecretAchievements, setShowSecretAchievements] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState('ALL');
  
  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            xp: data.xp || 0,
            level: data.level || 1,
            achievements: data.achievements || []
          });
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        toast.error('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  return (
    <div className="space-y-6">
      {/* Sección de experiencia */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
          <FiAward className="mr-2 text-yellow-500" />
          Experiencia
        </h2>
        
        {loading ? (
          <div className="text-center text-gray-500 py-4">Cargando datos...</div>
        ) : (
          <>
            <ExperienceBar userData={userData} />
            
            {/* Historial de XP */}
            <XPHistorySection userId={currentUser.uid} />
          </>
        )}
      </div>
      
      {/* Sección de logros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiAward className="mr-2 text-amber-500" />
            Logros
          </h2>
          
          {/* Estadísticas de logros */}
          <AchievementStats userData={userData} />
        </div>
        
        {/* Filtros y controles */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <select
            value={achievementFilter}
            onChange={(e) => setAchievementFilter(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="ALL">Todas las rarezas</option>
            <option value="COMMON">Común</option>
            <option value="UNCOMMON">Poco Común</option>
            <option value="RARE">Raro</option>
            <option value="EPIC">Épico</option>
            <option value="LEGENDARY">Legendario</option>
          </select>
          
          <button
            onClick={() => setShowSecretAchievements(!showSecretAchievements)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            
          </button>
        </div>
        
        {/* Estadísticas por rareza */}
        <RarityStats userData={userData} />
        
        {/* Logros */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">Cargando logros...</div>
        ) : (
          <AchievementGrid 
            userData={userData} 
            filter={achievementFilter}
            showSecretAchievements={showSecretAchievements}
          />
        )}
      </div>
    </div>
  );
}

function ExperienceBar({ userData }) {
    // Obtener nivel calculado correctamente basado en XP
    const level = experienceService.calculateLevel(userData.xp);
    
    // Obtener XP para el siguiente nivel desde el servicio
    const xpForNextLevel = experienceService.calculateXpForNextLevel(level);
    
    // Si está en el nivel máximo, mostrar 100%
    const xpPercent = xpForNextLevel 
      ? Math.min(100, Math.round(((userData.xp - experienceService.LEVELS[level-1].requiredXP) / 
         (xpForNextLevel - experienceService.LEVELS[level-1].requiredXP)) * 100))
      : 100;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-900">Nivel {level}</span>
            <span className="ml-2 text-gray-500">({userData.xp} XP)</span>
          </div>
          {xpForNextLevel ? (
            <span className="text-sm text-gray-500">{userData.xp} / {xpForNextLevel} XP para el siguiente nivel</span>
          ) : (
            <span className="text-sm text-gray-500">¡Nivel máximo alcanzado!</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-amadeus-primary h-3 rounded-full transition-all"
            style={{ width: `${xpPercent}%` }}
          ></div>
        </div>
      </div>
    );
  }

// XP History Component
function XPHistorySection({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchXPHistory = async () => {
      if (!userId) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data().xpHistory) {
          // Ordenar por fecha, más reciente primero
          const historyData = userDoc.data().xpHistory || [];
          // Convertir el objeto a un array si es necesario
          const historyArray = Array.isArray(historyData) 
            ? historyData 
            : Object.entries(historyData).map(([timestamp, entry]) => ({
                ...entry,
                timestamp: parseInt(timestamp)
              }));
          
          // Ordenar por timestamp
          historyArray.sort((a, b) => {
            const dateA = a.timestamp || new Date(a.addedAt).getTime();
            const dateB = b.timestamp || new Date(b.addedAt).getTime();
            return dateB - dateA;
          });
          
          setHistory(historyArray);
        }
      } catch (error) {
        console.error('Error fetching XP history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchXPHistory();
  }, [userId]);
  
  if (loading) return <p className="text-sm text-gray-500">Cargando historial...</p>;
  
  if (history.length === 0) {
    return <p className="text-sm text-gray-500">No hay registros de experiencia.</p>;
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-md font-medium mb-2">Historial de Experiencia</h3>
      <ul className="divide-y divide-gray-200">
        {history.map((entry, idx) => (
          <li key={idx} className="py-3">
            <div className="flex justify-between">
              <span className="font-medium text-amadeus-primary">+{entry.amount} XP</span>
              <span className="text-sm text-gray-500">
                {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString() : new Date(entry.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{entry.reason}</p>
            <p className="text-xs text-gray-500">
              {entry.type === 'admin_bonus' ? 'Bonificación manual' : 
               entry.type === 'pnr_creation' ? 'Creación de PNR' : 
               entry.type === 'achievement' ? 'Logro desbloqueado' : 'Otro'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Achievement Stats
function AchievementStats({ userData }) {
  const stats = getAchievementStats(userData);
  
  return (
    <div className="text-sm text-gray-600">
      {stats.unlocked} / {stats.total} ({stats.percentage}%)
    </div>
  );
}

// Rarity Stats Component
function RarityStats({ userData }) {
  const stats = getAchievementStats(userData);
  
  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-2">
      {Object.entries(stats.byRarity).map(([rarity, total]) => (
        <div key={rarity} className={`p-3 rounded-lg ${getRarityColor(rarity)}`}>
          <div className="text-xs font-medium">{experienceService.RARITY[rarity].name}</div>
          <div className="text-lg font-bold">
            {stats.unlockedByRarity[rarity] || 0} / {total}
          </div>
        </div>
      ))}
    </div>
  );
}

// Achievement Grid Component
function AchievementGrid({ userData, filter, showSecretAchievements }) {
  const filteredAchievements = getFilteredAchievements(userData, filter, showSecretAchievements);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredAchievements.map(([id, achievement]) => (
        <AchievementCard 
          key={id} 
          id={id} 
          achievement={achievement} 
          isUnlocked={userData.achievements.includes(id)} 
        />
      ))}
    </div>
  );
}

// Achievement Card Component
function AchievementCard({  achievement, isUnlocked }) {
  return (
    <div 
      className={`rounded-lg p-4 relative ${getRarityColor(achievement.rarity)} ${
        isUnlocked ? '' : 'opacity-50'
      } hover:shadow-md transition-shadow`}
    >
      {/* Badge de rareza */}
      <div className="absolute top-2 right-2">
        {getRarityBadge(achievement.rarity)}
      </div>
      
      <div className="text-center">
        <div className="text-4xl mb-2">
          {isUnlocked ? achievement.icon : '🔒'}
        </div>
        <div className="text-sm font-medium text-gray-900">
          {isUnlocked ? achievement.name : '???'}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {isUnlocked ? achievement.description : '-------'}
        </div>
        <div className="text-xs text-amadeus-primary mt-2">
          +{achievement.xp} XP
        </div>
        
        {/* Indicador de achievement secreto */}
        {achievement.secret && (
          <div className="absolute top-2 left-2">
            <span className="text-xs bg-black text-white px-1 rounded">
              SECRET
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility Functions

// Get achievement stats
function getAchievementStats(userData) {
  const total = Object.keys(experienceService.ACHIEVEMENTS).length;
  const unlocked = userData.achievements ? userData.achievements.length : 0;
  const percentage = Math.round((unlocked / total) * 100);
  
  // Contar por rareza
  const byRarity = {};
  Object.values(experienceService.ACHIEVEMENTS).forEach(achievement => {
    byRarity[achievement.rarity] = (byRarity[achievement.rarity] || 0) + 1;
  });
  
  const unlockedByRarity = {};
  if (userData.achievements) {
    userData.achievements.forEach(id => {
      const achievement = experienceService.ACHIEVEMENTS[id];
      if (achievement) {
        unlockedByRarity[achievement.rarity] = (unlockedByRarity[achievement.rarity] || 0) + 1;
      }
    });
  }
  
  return { total, unlocked, percentage, byRarity, unlockedByRarity };
}

// Get filtered achievements
function getFilteredAchievements(userData, filter, showSecretAchievements) {
  return Object.entries(experienceService.ACHIEVEMENTS).filter(([achievementId, achievement]) => {
    // Filtrar por rareza
    if (filter !== 'ALL' && achievement.rarity !== filter) {
      return false;
    }
    
    // Filtrar achievements secretos
    if (achievement.secret && !showSecretAchievements && 
        !(userData.achievements && userData.achievements.includes(achievementId))) {
      return false;
    }
    
    return true;
  });
}

// Get rarity color
function getRarityColor(rarity) {
  const colors = {
    COMMON: 'border-gray-300 bg-gray-50',
    UNCOMMON: 'border-green-300 bg-green-50',
    RARE: 'border-blue-300 bg-blue-50',
    EPIC: 'border-purple-300 bg-purple-50',
    LEGENDARY: 'border-orange-300 bg-orange-50'
  };
  return colors[rarity] || colors.COMMON;
}

// Get rarity badge
function getRarityBadge(rarity) {
  const badges = {
    COMMON: { text: 'Común', bgColor: 'bg-gray-200 text-gray-700' },
    UNCOMMON: { text: 'Poco Común', bgColor: 'bg-green-200 text-green-800' },
    RARE: { text: 'Raro', bgColor: 'bg-blue-200 text-blue-800' },
    EPIC: { text: 'Épico', bgColor: 'bg-purple-200 text-purple-800' },
    LEGENDARY: { text: 'Legendario', bgColor: 'bg-orange-200 text-orange-800' }
  };
  const badge = badges[rarity] || badges.COMMON;
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${badge.bgColor}`}>
      {badge.text}
    </span>
  );
}