// src/components/dashboard/DashboardSidebar.jsx
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { FiDatabase, FiMonitor, FiBook, FiUser, FiUsers, FiBarChart2, FiSettings, FiHelpCircle, FiAirplay, FiSliders, FiGrid, FiEye, FiAward, FiHome, FiAlertCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { useLatestVersion } from '../../hooks/useLatestVersion';
import { SlPlane } from 'react-icons/sl';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardSidebar({ userRole }) {
  const location = useLocation();
  const { isSpectator } = useAuth();
  const { version } = useLatestVersion();
  const isAdmin = userRole === 'admin';
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // Navegación para espectadores
  const spectatorNavigation = [
    { name: 'Inicio', href: '/home', icon: FiHome },
    { name: 'Terminal', href: '/dashboard', icon: FiMonitor },
    { name: 'Leaderboard', href: '/leaderboard', icon: FiAward },
    { name: 'Explorador de Vuelos', href: '/flights', icon: SlPlane },
    { name: 'Ayuda', href: '/help', icon: FiHelpCircle },
  ];

  // Navegación principal para usuarios autenticados
  const userNavigation = [
    { name: 'Inicio', href: '/home', icon: FiHome },
    { name: 'Terminal', href: '/dashboard', icon: FiMonitor },
    { name: 'Mi Perfil', href: '/profile', icon: FiUser },
    { name: 'Leaderboard', href: '/leaderboard', icon: FiAward },
    { name: 'Explorador de Vuelos', href: '/flights', icon: SlPlane },
    { name: 'Reportar Error', href: '/bug-reports', icon: FiAlertCircle },
    { name: 'Ayuda', href: '/help', icon: FiHelpCircle },
    { name: 'Configuración', href: '/settings', icon: FiSliders },
  ];

  // Sub-menú de administración (solo para admins no espectadores)
  const adminNavigation = (isAdmin && !isSpectator) ? [
    { name: 'Gestión de Avisos', href: '/admin/announcements', icon: FiBarChart2 },
    { name: 'Gestión de Versiones', href: '/admin/release-notes', icon: FiBook },
    { name: 'Gestión de Bugs', href: '/admin/bug-reports', icon: FiAlertCircle },
    { name: 'Gestión de Comisiones', href: '/admin/commissions', icon: FiGrid },
    { name: 'Gestión de Usuarios', href: '/admin/users', icon: FiUsers },
    { name: 'Gestión de Vuelos', href: '/admin/flights', icon: FiAirplay },
    { name: 'Configuración', href: '/admin/settings', icon: FiSettings },
    { name: 'Datos Maestros', href: '/admin/data-management', icon: FiDatabase },
  ] : [];

  const mainNavigation = isSpectator ? spectatorNavigation : userNavigation;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-amadeus-dark">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <Link to="/home" className="flex flex-col items-start flex-shrink-0 px-4 hover:opacity-80 transition-opacity">
              <span className="font-leckerli text-white text-6xl font-extralight">Mozart</span>
              <span className="text-xs text-gray-400 font-mono ml-1">v{version}</span>
            </Link>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {/* Enlaces Principales */}
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'bg-amadeus-secondary text-white'
                      : 'text-gray-300 hover:bg-amadeus-primary hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={classNames(
                      location.pathname === item.href
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-white',
                      'mr-3 flex-shrink-0 h-6 w-6 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}

              {/* Sección de Administración (Accordion) */}
              {adminNavigation.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                    className="w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-amadeus-primary hover:text-white transition-colors focus:outline-none"
                  >
                    <div className="flex items-center">
                      <FiSettings
                        className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                      Admin Tools
                    </div>
                    {isAdminMenuOpen ? (
                      <FiChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white" />
                    ) : (
                      <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-white" />
                    )}
                  </button>

                  <div
                    className={classNames(
                      "mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out pl-8",
                      isAdminMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-amadeus-secondary text-white'
                            : 'text-gray-400 hover:bg-amadeus-primary hover:text-white',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href
                              ? 'text-white'
                              : 'text-gray-500 group-hover:text-white',
                            'mr-2 flex-shrink-0 h-4 w-4 transition-colors'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-amadeus-secondary p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-white">
                    {isSpectator ? (
                      <>
                        <FiEye className="inline mr-2" />
                        Modo Espectador
                      </>
                    ) : (
                      <>Rol: {userRole === 'admin' ? 'Administrador' : 'Estudiante'}</>
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-300">
                    {isSpectator ? 'Solo lectura' :
                      userRole === 'admin' ? 'Acceso completo al sistema' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DashboardSidebar.propTypes = {
  userRole: PropTypes.string
};

DashboardSidebar.defaultProps = {
  userRole: 'student'
};