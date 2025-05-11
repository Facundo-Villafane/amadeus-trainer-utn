// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import experienceService from '../services/experienceService';
import { FiTrendingUp, FiAward, FiClock, FiTarget } from 'react-icons/fi';
import md5 from 'blueimp-md5';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, weekly, monthly
  const { currentUser, userRole, logout } = useAuth();
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

  // Función para obtener URL de Gravatar
  const getGravatarUrl = (email, size = 80) => {
    const emailHash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=${size}`;
  };

  // Componente Podio
  const Podium = ({ top5 }) => {
    if (top5.length === 0) return null;

    // Reorganizar para el diseño visual del podio (2, 1, 3, 4, 5)
    const podiumOrder = [
      top5[1], // 2do lugar
      top5[0], // 1er lugar
      top5[2], // 3er lugar
      top5[3], // 4to lugar
      top5[4]  // 5to lugar
    ].filter(Boolean); // Filtrar undefined si hay menos de 5 usuarios

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Top 5 Estudiantes</h2>
        <div className="flex justify-center items-end space-x-6">
          {podiumOrder.map((user, index) => {
            if (!user) return null;
            
            // Determinar la posición real
            let position = 1;
            if (index === 0) position = 2;
            else if (index === 1) position = 1;
            else if (index === 2) position = 3;
            else if (index === 3) position = 4;
            else if (index === 4) position = 5;
            
            // Altura del podio basada en la posición
            const heights = {
              1: 'h-40',
              2: 'h-32',
              3: 'h-24',
              4: 'h-20',
              5: 'h-16'
            };
            
            const bgColors = {
              1: 'bg-yellow-400',
              2: 'bg-gray-300',
              3: 'bg-amber-600',
              4: 'bg-gray-200',
              5: 'bg-gray-100'
            };
            
            return (
              <div key={user.id} className="flex flex-col items-center">
                {/* Foto de perfil */}
                <div className="relative mb-2">
                  <img
                    src={getGravatarUrl(user.email)}
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
                
                {/* Nombre */}
                <p className="text-sm font-medium text-gray-900 text-center mb-1">
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
                     position === 3 ? '🥉' :
                     position === 4 ? '🏅' :
                     '🎖️'}
                  </span>
                </div>
              </div>
            );
          })}
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
            ) : (
              <>
                {/* Podio Top 5 */}
                <Podium top5={leaderboard.slice(0, 5)} />

                {/* Tabla de clasificación completa */}
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
                          XP Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PNRs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiempo Promedio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Logros
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((user, index) => (
                        <tr 
                          key={user.id}
                          className={user.id === currentUser?.uid ? 'bg-amadeus-light' : ''}
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
                                src={getGravatarUrl(user.email)}
                                alt={user.name}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                              <div className="text-sm font-medium text-gray-900">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.pnrsCreated}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.avgPNRTime}s
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-1">
                              {user.achievements.slice(0, 3).map(achievementId => (
                                <span key={achievementId} title={achievementId}>
                                  {experienceService.ACHIEVEMENTS[achievementId]?.icon || '🏅'}
                                </span>
                              ))}
                              {user.achievements.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{user.achievements.length - 3}
                                </span>
                              )}
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
    </div>
  );
}