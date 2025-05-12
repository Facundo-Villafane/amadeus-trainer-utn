// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TerminalSettings from '../components/settings/TerminalSettings';
import { FiSettings, FiAward, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { db } from '../services/firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import md5 from 'blueimp-md5';
import experienceService from '../services/experienceService';

export default function Settings() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados para la navegación de pestañas de configuración
  const [activeTab, setActiveTab] = useState('terminal');
  
  // Manejar cierre de sesión
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar userRole={userRole} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FiSettings className="mr-2" />
              Configuración
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Personaliza tu experiencia en Amadeus Trainer.
            </p>
            
            {/* Tabs de navegación */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`${
                    activeTab === 'terminal'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`${
                    activeTab === 'account'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Cuenta
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`${
                    activeTab === 'notifications'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Notificaciones
                </button>
              </nav>
            </div>
            
            {/* Contenido de la pestaña activa */}
            <div className="mt-4">
              {activeTab === 'terminal' && (
                <TerminalSettings />
              )}
              
              {activeTab === 'account' && (
                <AccountSettings currentUser={currentUser} />
              )}
              
              {activeTab === 'notifications' && (
                <div className="bg-white shadow overflow-hidden rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900">Configuración de notificaciones</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta funcionalidad estará disponible próximamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Componente de configuración de cuenta
function AccountSettings({ currentUser }) {
  const { userRole } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ 
    role: '', 
    commission: '', 
    status: '', 
    xp: 0, 
    level: 1, 
    active: true,
    achievements: [] 
  });
  const [fetching, setFetching] = useState(true);
  const [showSecretAchievements, setShowSecretAchievements] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState('ALL');

  // Obtener datos completos del usuario de Firestore
  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser?.uid) return;
      setFetching(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            role: data.role || '-',
            commission: data.commission || '-',
            status: data.status || (data.active === false ? 'No cursando' : 'Cursando'),
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            active: data.active !== false,
            achievements: data.achievements || []
          });
        }
      } catch {
        // Si falla, dejar valores por defecto
      } finally {
        setFetching(false);
      }
    }
    fetchUserData();
  }, [currentUser]);

  // Barra de experiencia
  const xpForNextLevel = userData.level * 100; // Ejemplo: 100 XP por nivel
  const xpPercent = Math.min(100, Math.round((userData.xp / xpForNextLevel) * 100));

  // Gravatar URL
  const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=128`;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), { name });
        toast.success('Nombre actualizado correctamente');
      }
    } catch (error) {
      toast.error('Error al actualizar el nombre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color de rareza
  const getRarityColor = (rarity) => {
    const colors = {
      COMMON: 'border-gray-300 bg-gray-50',
      UNCOMMON: 'border-green-300 bg-green-50',
      RARE: 'border-blue-300 bg-blue-50',
      EPIC: 'border-purple-300 bg-purple-50',
      LEGENDARY: 'border-orange-300 bg-orange-50'
    };
    return colors[rarity] || colors.COMMON;
  };

  // Función para obtener el badge de rareza
  const getRarityBadge = (rarity) => {
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
  };

  // Filtrar achievements según los filtros seleccionados
  const getFilteredAchievements = () => {
    return Object.entries(experienceService.ACHIEVEMENTS).filter(([id, achievement]) => {
      // Filtrar por rareza
      if (achievementFilter !== 'ALL' && achievement.rarity !== achievementFilter) {
        return false;
      }
      
      // Filtrar achievements secretos
      if (achievement.secret && !showSecretAchievements && !userData.achievements.includes(id)) {
        return false;
      }
      
      return true;
    });
  };

  // Contar achievements por categoría
  const getAchievementStats = () => {
    const total = Object.keys(experienceService.ACHIEVEMENTS).length;
    const unlocked = userData.achievements.length;
    const percentage = Math.round((unlocked / total) * 100);
    
    // Contar por rareza
    const byRarity = {};
    Object.values(experienceService.ACHIEVEMENTS).forEach(achievement => {
      byRarity[achievement.rarity] = (byRarity[achievement.rarity] || 0) + 1;
    });
    
    const unlockedByRarity = {};
    userData.achievements.forEach(id => {
      const achievement = experienceService.ACHIEVEMENTS[id];
      if (achievement) {
        unlockedByRarity[achievement.rarity] = (unlockedByRarity[achievement.rarity] || 0) + 1;
      }
    });
    
    return { total, unlocked, percentage, byRarity, unlockedByRarity };
  };

  const stats = getAchievementStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Card de Perfil */}
      <div className="bg-white shadow overflow-hidden rounded-lg p-6 max-w-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Perfil de usuario</h2>
        {fetching ? (
          <div className="text-center text-gray-400 py-8">Cargando datos...</div>
        ) : (
          <>
            {/* Avatar Gravatar */}
            <div className="flex justify-center mb-6">
              <img
                id="gravatar-avatar"
                src={gravatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full border-2 border-amadeus-primary shadow"
              />
            </div>
            
            {/* Barra de experiencia */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Nivel {userData.level}</span>
                <span className="text-xs text-gray-500">{userData.xp} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-amadeus-primary h-3 rounded-full transition-all"
                  style={{ width: `${xpPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Datos de solo lectura */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Rol</div>
                <div className="font-semibold text-gray-800">{userData.role}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Comisión</div>
                <div className="font-semibold text-gray-800">{userData.commission}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className={`font-semibold ${userData.active ? 'text-green-600' : 'text-red-600'}`}>{userData.status}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Activo</div>
                <div className={`font-semibold ${userData.active ? 'text-green-600' : 'text-red-600'}`}>{userData.active ? 'Sí' : 'No'}</div>
              </div>
            </div>

            {/* Formulario editable solo para el nombre si es admin */}
            <form onSubmit={handleSave} className="mt-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className={`block w-full border ${userRole === 'admin' ? 'border-gray-300' : 'border-gray-200 bg-gray-100 cursor-not-allowed'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm`}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  readOnly={userRole !== 'admin'}
                  disabled={userRole !== 'admin'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed sm:text-sm"
                  value={email}
                  readOnly
                />
              </div>
              {userRole === 'admin' && (
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}
            </form>
          </>
        )}
      </div>

      {/* Card de Logros */}
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiAward className="mr-2 text-yellow-500" />
            Logros
          </h2>
          
          {/* Estadísticas de logros */}
          <div className="text-sm text-gray-600">
            {stats.unlocked} / {stats.total} ({stats.percentage}%)
          </div>
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
            {showSecretAchievements ? <FiEyeOff className="mr-1" /> : <FiEye className="mr-1" />}
            {showSecretAchievements ? 'Ocultar secretos' : 'Mostrar secretos'}
          </button>
        </div>

        {/* Estadísticas por rareza */}
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
        
        {fetching ? (
          <div className="text-center text-gray-400 py-8">Cargando logros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredAchievements().map(([id, achievement]) => {
              const isUnlocked = userData.achievements.includes(id);
              
              return (
                <div 
                  key={id} 
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
                      {achievement.description}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}