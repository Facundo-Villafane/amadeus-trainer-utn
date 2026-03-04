// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import experienceService from '../services/experienceService';
import { getProfilePhotoUrl } from '../utils/profileUtils';
import {
  FiAward, FiEye, FiUser, FiBook, FiList,
  FiClock, FiEyeOff,
} from 'react-icons/fi';

// ── Rarity colors for achievements ────────────────────────────────────────────
const RARITY_COLOR = {
  COMMON: 'bg-gray-200 text-gray-700',
  UNCOMMON: 'bg-green-100 text-green-700',
  RARE: 'bg-blue-100 text-blue-700',
  EPIC: 'bg-purple-100 text-purple-700',
  LEGENDARY: 'bg-amber-100 text-amber-700',
};

// ── Medal colors for top-5 podium ─────────────────────────────────────────────
const MEDAL_BG = { 1: 'bg-yellow-400', 2: 'bg-gray-300', 3: 'bg-amber-600', 4: 'bg-gray-200', 5: 'bg-gray-200' };
const MEDAL_BORDER = { 1: 'border-yellow-400', 2: 'border-gray-300', 3: 'border-amber-600', 4: 'border-gray-300', 5: 'border-gray-300' };
const MEDAL_H = { 1: 'h-44', 2: 'h-36', 3: 'h-28', 4: 'h-20', 5: 'h-16' };

// ── Podium ────────────────────────────────────────────────────────────────────
function PodiumSlot({ user, position, onProfileClick }) {
  if (!user) return null;
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative mb-2 cursor-pointer"
        onClick={() => onProfileClick(user)}
        title={user.name}
      >
        <img
          src={getProfilePhotoUrl(user, 72)}
          alt={user.name}
          className={`w-16 h-16 rounded-full border-4 ${MEDAL_BORDER[position]}`}
        />
        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${MEDAL_BG[position]}`}>
          {position}
        </div>
      </div>
      <p
        className="text-xs font-semibold text-gray-900 text-center mb-0.5 cursor-pointer hover:underline max-w-[80px] truncate"
        onClick={() => onProfileClick(user)}
      >
        {user.name}
      </p>
      <p className="text-xs text-gray-500">{user.xp.toLocaleString()} XP</p>
      <div className={`mt-1 ${MEDAL_H[position]} w-16 ${MEDAL_BG[position]} rounded-t-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-lg">{position}</span>
      </div>
    </div>
  );
}

function Podium({ users }) {
  // Podium visual order: 2nd, 1st, 3rd, 4th, 5th
  const ordered = [
    users[1], // pos 2 — left
    users[0], // pos 1 — center
    users[2], // pos 3 — right
    users[3], // pos 4
    users[4], // pos 5
  ];
  const positions = [2, 1, 3, 4, 5];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Top 5</h2>
      <div className="flex justify-center items-end gap-4">
        {ordered.map((user, i) =>
          user ? (
            <PodiumSlot key={user.id} user={user} position={positions[i]} onProfileClick={() => { }} />
          ) : null
        )}
      </div>
    </div>
  );
}

// ── User profile modal ─────────────────────────────────────────────────────────
function UserProfileModal({ user, onClose, userRole, isSpectator, navigate }) {
  if (!user) return null;
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose} />
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-amadeus-light sm:mx-0">
                <FiUser className="h-5 w-5 text-amadeus-primary" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {user.isLegacy ? (
                    <span className="flex items-center gap-2">
                      {user.name}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        <FiClock size={10} /> Camada anterior
                      </span>
                    </span>
                  ) : user.name}
                </h3>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:space-x-6 items-start">
              <img src={getProfilePhotoUrl(user, 128)} alt={user.name} className="h-24 w-24 rounded-full border-2 border-amadeus-primary mb-4 sm:mb-0" />
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Título</p>
                    <p className="font-medium">{user.levelTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nivel</p>
                    <p className="font-medium">{user.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">XP Total</p>
                    <p className="font-medium">{user.xp.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PNRs</p>
                    <p className="font-medium">{user.pnrsCreated}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Comisión</p>
                    <p className="font-medium">{user.commissionName || user.commissionCode || '-'}</p>
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Logros</p>
                  <div className="flex flex-wrap gap-2">
                    {user.achievements?.length > 0 ? (
                      user.achievements.map(id => {
                        const ach = experienceService.ACHIEVEMENTS[id];
                        if (!ach) return null;
                        return (
                          <div
                            key={id}
                            title={`${ach.name}: ${ach.description}`}
                            className={`px-2 py-1 rounded text-xs font-medium ${RARITY_COLOR[ach.rarity] || RARITY_COLOR.COMMON}`}
                          >
                            {ach.name}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400">Sin logros aún</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-2">
            {!isSpectator && userRole === 'admin' && (
              <>
                <button onClick={() => navigate(`/admin/users/${user.id}/pnrs`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <FiBook size={14} /> PNRs
                </button>
                <button onClick={() => navigate(`/admin/users/${user.id}/commands`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <FiList size={14} /> Comandos
                </button>
              </>
            )}
            <button onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLegacy, setShowLegacy] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser, userRole, logout, isSpectator } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await experienceService.getLeaderboard(50);
        setLeaderboard(data.filter(u => u.role !== 'admin'));
      } catch (e) {
        console.error('Leaderboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogout() {
    try { await logout(); navigate('/login'); } catch { /* ignore */ }
  }

  const activeUsers = leaderboard.filter(u => !u.isLegacy);
  const legacyUsers = leaderboard.filter(u => u.isLegacy);
  const displayed = showLegacy ? leaderboard : activeUsers;

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Tabla de Clasificación</h1>

              {legacyUsers.length > 0 && (
                <button
                  onClick={() => setShowLegacy(v => !v)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                >
                  {showLegacy ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  {showLegacy ? 'Ocultar camadas anteriores' : 'Mostrar camadas anteriores'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <p className="text-gray-500">Cargando clasificación...</p>
              </div>
            ) : isSpectator ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <FiEye className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Modo Espectador</h3>
                <p className="text-gray-500 mb-4">Iniciá sesión para ver la clasificación completa.</p>
                <button onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-amadeus-primary text-white rounded-md text-sm font-medium hover:bg-amadeus-secondary">
                  Iniciar sesión
                </button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No hay datos disponibles.</p>
              </div>
            ) : (
              <>
                {/* Top 5 Podium */}
                <Podium users={displayed.slice(0, 5)} />

                {/* Full table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Comisión</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayed.map((user, index) => {
                        const isSelf = user.id === currentUser?.uid;
                        const isLegacy = user.isLegacy;

                        return (
                          <tr
                            key={user.id}
                            className={`
                              cursor-pointer transition-colors
                              ${isSelf ? 'bg-amadeus-light' : ''}
                              ${isLegacy ? 'opacity-60' : 'hover:bg-gray-50'}
                            `}
                            onClick={() => setSelectedUser(user)}
                          >
                            {/* Position */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {index < 3 ? (
                                <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`}>
                                  {index + 1}
                                </span>
                              ) : (
                                <span className={`text-sm ${isLegacy ? 'text-gray-400' : 'text-gray-900'}`}>{index + 1}</span>
                              )}
                            </td>

                            {/* Name */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img src={getProfilePhotoUrl(user, 28)} alt={user.name}
                                  className={`w-7 h-7 rounded-full flex-shrink-0 ${isLegacy ? 'grayscale' : ''}`} />

                                {/* Blurred name for legacy users */}
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`
                                      text-sm font-medium
                                      ${isLegacy
                                        ? 'text-gray-400 blur-sm hover:blur-none transition-all duration-200 select-none cursor-default'
                                        : 'text-gray-900'}
                                    `}
                                    title={isLegacy ? 'Alumno/a de camada anterior' : user.name}
                                  >
                                    {user.name}
                                  </span>

                                  {isLegacy && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs text-gray-400 bg-gray-100 flex-shrink-0">
                                      <FiClock size={9} /> anterior
                                    </span>
                                  )}

                                  {user.achievements?.includes('LEGACY_PIONEER') && (
                                    <span className="text-amber-400" title="Pionero/a">
                                      <FiAward size={12} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Commission */}
                            <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                              <span className={`text-sm ${isLegacy ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.commissionName || user.commissionCode || '-'}
                              </span>
                            </td>

                            {/* Level title */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div>
                                <span className={`text-xs ${isLegacy ? 'text-gray-400' : 'text-gray-500'}`}>Lv {user.level}</span>
                                <p className={`text-sm font-medium ${isLegacy ? 'text-gray-400' : 'text-gray-900'}`}>{user.levelTitle}</p>
                              </div>
                            </td>

                            {/* XP */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-sm font-semibold ${isLegacy ? 'text-gray-400' : 'text-gray-900'}`}>
                                {user.xp.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                {showLegacy && legacyUsers.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3 text-right flex items-center justify-end gap-1">
                    <FiClock size={11} />
                    Las filas marcadas como &quot;anterior&quot; corresponden a camadas anteriores. El nombre se oculta por privacidad — hacé hover para verlo.
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          userRole={userRole}
          isSpectator={isSpectator}
          navigate={navigate}
        />
      )}
    </div>
  );
}