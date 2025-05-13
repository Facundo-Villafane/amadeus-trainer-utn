// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import experienceService from '../services/experienceService';
import { FiAward, FiEye, FiUser, FiBook, FiList } from 'react-icons/fi';
import { getProfilePhotoUrl } from '../utils/profileUtils';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, weekly, monthly
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser, userRole, logout, isSpectator } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await experienceService.getLeaderboard(50);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeframe]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // Mostrar el perfil resumido del usuario
  const handleShowUserProfile = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Componente Podio simplificado para top 3
  const Podium = ({ top5 }) => {
    // Solo tomamos los primeros 3 usuarios
    const top3 = top5.slice(0, 3);
    
    if (top3.length === 0) return null;

    // Reorganizar para el diseño visual del podio (2º, 1º, 3º)
    const podiumOrder = [
      top3[1], // 2do lugar en posición 0
      top3[0], // 1er lugar en posición 1 (centro)
      top3[2]  // 3er lugar en posición 2
    ].filter(Boolean); // Filtrar undefined si hay menos de 3 usuarios

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Top 3 Estudiantes</h2>
        <div className="flex justify-center items-end space-x-6">
          {podiumOrder.map((user, index) => {
            // Calcular la posición real (2,1,3) basada en el índice en podiumOrder
            const position = index === 0 ? 2 : 
                           index === 1 ? 1 : 3;
            
            return (
              <PodiumPosition
                key={user.id}
                user={user}
                position={position}
                onProfileClick={handleShowUserProfile}
              />
            );
          })}
        </div>
      </div>
    );
  };
  
  // Componente auxiliar para cada posición del podio
  const PodiumPosition = ({ user, position, onProfileClick }) => {
    if (!user) return null;
    
    // Altura del podio basada en la posición
    const heights = {
      1: 'h-40',
      2: 'h-32',
      3: 'h-24'
    };
    
    const bgColors = {
      1: 'bg-yellow-400',
      2: 'bg-gray-300',
      3: 'bg-amber-600'
    };
    
    return (
      <div className="flex flex-col items-center">
        {/* Foto de perfil - ahora usando getProfilePhotoUrl */}
        <div className="relative mb-2 cursor-pointer" onClick={() => onProfileClick(user)}>
          <img
            src={getProfilePhotoUrl(user, 80)}
            alt={user.name}
            className={`w-20 h-20 rounded-full border-4 ${
              position === 1 ? 'border-yellow-400' :
              position === 2 ? 'border-gray-300' :
              position === 3 ? 'border-amber-600' :
              'border-gray-200'
            }`}
          />
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${bgColors[position]}`}>
            {position}
          </div>
        </div>
        
        {/* Nombre (clickeable) */}
        <p 
          className="text-sm font-medium text-gray-900 text-center mb-1 cursor-pointer hover:underline"
          onClick={() => onProfileClick(user)}
        >
          {user.name}
        </p>
        
        {/* XP */}
        <p className="text-xs text-gray-500 mb-2">
          {user.xp.toLocaleString()} XP
        </p>
        
        {/* Podio */}
        <div className={`${heights[position]} w-20 ${bgColors[position]} rounded-t-lg flex items-center justify-center`}>
          <span className="text-2xl">
            {position === 1 ? '🥇' : 
             position === 2 ? '🥈' : 
             position === 3 ? '🥉' : ''}
          </span>
        </div>
      </div>
    );
  };

  // Modal para mostrar perfil resumido
  const UserProfileModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amadeus-light sm:mx-0 sm:h-10 sm:w-10">
                  <FiUser className="h-6 w-6 text-amadeus-primary" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Perfil de {user.name}
                  </h3>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col items-center sm:items-start sm:flex-row sm:space-x-6">
                {/* Avatar - ahora usando getProfilePhotoUrl */}
                <div className="mb-4 sm:mb-0">
                  <img 
                    src={getProfilePhotoUrl(user, 128)} 
                    alt={user.name}
                    className="h-32 w-32 rounded-full border-2 border-amadeus-primary shadow-md" 
                  />
                </div>
                
                {/* Información del usuario */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Información</h4>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Comisión</p>
                        <p className="text-sm font-medium">{user.commissionName || user.commissionCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Nivel</p>
                        <p className="text-sm font-medium">Nivel {user.level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Experiencia</p>
                        <p className="text-sm font-medium">{user.xp.toLocaleString()} XP</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">PNRs Creados</p>
                        <p className="text-sm font-medium">{user.pnrsCreated || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logros */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Logros</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.achievements && user.achievements.length > 0 ? (
                        user.achievements.map(achievementId => {
                          const achievement = experienceService.ACHIEVEMENTS[achievementId];
                          if (!achievement) return null;
                          return (
                            <div 
                              key={achievementId}
                              className="bg-gray-100 rounded-md p-2 text-center flex flex-col items-center"
                              title={achievement.name}
                            >
                              <span className="text-xl">{achievement.icon}</span>
                              <span className="text-xs mt-1">{achievement.name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No ha desbloqueado logros aún</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {!isSpectator && userRole === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${user.id}/pnrs`)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiBook className="mr-2 h-5 w-5" />
                    Ver PNRs
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${user.id}/commands`)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiList className="mr-2 h-5 w-5" />
                    Comandos
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Tabla de Clasificación
              </h1>
              
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-amadeus-primary focus:ring-amadeus-primary"
              >
                <option value="all">Todo el tiempo</option>
                <option value="weekly">Esta semana</option>
                <option value="monthly">Este mes</option>
              </select>
            </div>

            {loading ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">Cargando clasificación...</p>
              </div>
            ) : leaderboard.length === 0 && isSpectator ? (
              // Mensaje para usuarios espectadores
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <FiEye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Modo Espectador</h3>
                <p className="text-gray-500 mb-4">
                  Estás viendo la aplicación en modo espectador. La tabla de clasificación sólo está disponible para usuarios registrados.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-offset-2 focus:ring-amadeus-primary"
                >
                  Iniciar sesión para ver la clasificación
                </button>
              </div>
            ) : leaderboard.length === 0 ? (
              // Para usuarios normales pero sin datos
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No hay datos disponibles para mostrar</p>
              </div>
            ) : (
              <>
                {/* Podio Top 3 */}
                <Podium top5={leaderboard.slice(0, 5)} />

                {/* Tabla de clasificación simplificada */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comisión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          XP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((user, index) => (
                        <tr 
                          key={user.id}
                          className={`${user.id === currentUser?.uid ? 'bg-amadeus-light' : ''} hover:bg-gray-50 cursor-pointer`}
                          onClick={() => handleShowUserProfile(user)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <span className={`text-2xl ${
                                  index === 0 ? 'text-yellow-400' :
                                  index === 1 ? 'text-gray-400' :
                                  'text-amber-700'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-900">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={getProfilePhotoUrl(user, 32)}
                                alt={user.name}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                              <div className="text-sm font-medium text-gray-900 hover:underline">
                                {user.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.commissionName || user.commissionCode || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Nivel {user.level}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.xp.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal para mostrar el perfil resumido */}
      {showUserModal && selectedUser && (
        <UserProfileModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}