// src/pages/Home_New.jsx
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  FiTerminal,
  FiBook,
  FiUsers,
  FiAward,
  FiUser,
  FiSettings,
  FiBarChart2,
  FiDatabase,
  FiDollarSign,
  FiTrendingUp,
  FiFileText,
  FiNavigation
} from 'react-icons/fi';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ReleaseNotesList from '../components/releaseNotes/ReleaseNotesList';
import AnnouncementsList from '../components/announcements/AnnouncementsList';

export default function HomeNew() {
  const { currentUser, userRole, isSpectator, logout } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserStats(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // Accesos rápidos según el rol
  const getQuickAccessLinks = () => {
    const commonLinks = [
      {
        title: 'Terminal Amadeus',
        description: 'Accede a la terminal de comandos',
        icon: FiTerminal,
        path: '/dashboard',
        color: 'bg-indigo-500',
        available: true
      },
      {
        title: 'Explorador de Vuelos',
        description: 'Busca y explora vuelos disponibles',
        icon: FiNavigation,
        path: '/flights',
        color: 'bg-blue-500',
        available: true
      },
      {
        title: 'Ayuda',
        description: 'Guías y documentación',
        icon: FiBook,
        path: '/help',
        color: 'bg-green-500',
        available: true
      },
      {
        title: 'Tabla de Posiciones',
        description: 'Ver ranking de usuarios',
        icon: FiAward,
        path: '/leaderboard',
        color: 'bg-yellow-500',
        available: true
      }
    ];

    const studentLinks = [
      ...commonLinks,
      {
        title: 'Mi Perfil',
        description: 'Gestiona tu información personal',
        icon: FiUser,
        path: '/profile',
        color: 'bg-purple-500',
        available: !isSpectator
      },
      {
        title: 'Mis PNRs',
        description: 'Ver historial de reservas',
        icon: FiFileText,
        path: '/my-pnrs',
        color: 'bg-pink-500',
        available: !isSpectator
      }
    ];

    const adminLinks = [
      ...studentLinks,
      {
        title: 'Gestión de Usuarios',
        description: 'Administrar usuarios del sistema',
        icon: FiUsers,
        path: '/admin/users',
        color: 'bg-red-500',
        available: userRole === 'admin'
      },
      {
        title: 'Gestión de Vuelos',
        description: 'Administrar vuelos disponibles',
        icon: FiDatabase,
        path: '/admin/flights',
        color: 'bg-teal-500',
        available: userRole === 'admin'
      },
      {
        title: 'Comisiones',
        description: 'Gestionar comisiones y tarifas',
        icon: FiDollarSign,
        path: '/admin/commissions',
        color: 'bg-emerald-500',
        available: userRole === 'admin'
      },
      {
        title: 'Configuración del Sistema',
        description: 'Ajustes generales del sistema',
        icon: FiSettings,
        path: '/admin/settings',
        color: 'bg-gray-500',
        available: userRole === 'admin'
      }
    ];

    if (userRole === 'admin') {
      return adminLinks.filter(link => link.available);
    }

    return studentLinks.filter(link => link.available);
  };

  const quickAccessLinks = getQuickAccessLinks();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido{currentUser ? `, ${currentUser.displayName || 'Usuario'}` : ''}
              </h1>
              <p className="text-gray-600">
                {isSpectator
                  ? 'Estás en modo espectador. Explora el sistema sin límites.'
                  : userRole === 'admin'
                  ? 'Panel de administración - Gestiona el sistema completo'
                  : 'Practica tus habilidades con Amadeus y mejora tu nivel'}
              </p>
            </div>

            {/* User Stats - Solo para usuarios autenticados no espectadores */}
            {currentUser && !isSpectator && userStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                      <FiTrendingUp size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Nivel</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats.level || 1}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FiAward size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">XP Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats.totalXP || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FiTerminal size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Comandos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats.totalCommands || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FiBarChart2 size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Precisión</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats.accuracy ? `${userStats.accuracy.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Access Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickAccessLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left border border-gray-200 hover:border-indigo-300"
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg ${link.color} text-white`}>
                        <link.icon size={24} />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Announcements Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Avisos Importantes
                </h2>
                {userRole === 'admin' && (
                  <button
                    onClick={() => navigate('/admin/announcements')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Gestionar Avisos
                  </button>
                )}
              </div>
              <AnnouncementsList limitCount={3} />
            </div>

            {/* Release Notes Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Notas de Versión
                </h2>
                {userRole === 'admin' && (
                  <button
                    onClick={() => navigate('/admin/release-notes')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Gestionar Notas
                  </button>
                )}
              </div>
              <ReleaseNotesList limitCount={3} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
