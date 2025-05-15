// src/components/dashboard/DashboardSidebar.jsx
import { Link, useLocation } from 'react-router';
import { FiDatabase, FiMonitor, FiBook, FiUser, FiUsers, FiBarChart2, FiSettings, FiHelpCircle, FiAirplay, FiSliders, FiGrid, FiEye, FiAward } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { SlPlane } from 'react-icons/sl';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardSidebar({ userRole }) {
  const location = useLocation();
  const { isSpectator } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Navegación para espectadores
  const spectatorNavigation = [
    { name: 'Terminal', href: '/dashboard', icon: FiMonitor },
    { name: 'Leaderboard', href: '/leaderboard', icon: FiAward },
    { name: 'Explorador de Vuelos', href: '/flights', icon: SlPlane },
    { name: 'Ayuda', href: '/help', icon: FiHelpCircle },
  ];
  
  // Navegación para usuarios autenticados
  const userNavigation = [
    { name: 'Terminal', href: '/dashboard', icon: FiMonitor },
    { name: 'Mi Perfil', href: '/profile', icon: FiUser },
    // Quitar 'Mis PNRs' y 'Historial de Comandos' que ahora están en el perfil
    { name: 'Leaderboard', href: '/leaderboard', icon: FiAward },
    { name: 'Explorador de Vuelos', href: '/flights', icon: SlPlane },
    { name: 'Ayuda', href: '/help', icon: FiHelpCircle },
    { name: 'Configuración', href: '/settings', icon: FiSliders },
    
  ];
  
  // Usar navegación de espectador si está en modo espectador
  let navigation = isSpectator ? spectatorNavigation : userNavigation;
  
  // Agregar opciones de administrador si el usuario es admin y no es espectador
  if (isAdmin && !isSpectator) {
    navigation = [
      ...navigation,
      { name: 'Gestión de Comisiones', href: '/admin/commissions', icon: FiGrid },
      { name: 'Gestión de Usuarios', href: '/admin/users', icon: FiUsers },
      { name: 'Gestión de Vuelos', href: '/admin/flights', icon: FiAirplay },
      { name: 'Configuración Sistema', href: '/admin/settings', icon: FiSettings },
      { name: 'Datos Maestros', href: '/admin/data-management', icon: FiDatabase },
    ];
  }

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-amadeus-dark">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="font-leckerli text-white text-6xl font-extralight">Mozart</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'bg-amadeus-secondary text-white'
                      : 'text-gray-300 hover:bg-amadeus-primary hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon 
                    className={classNames(
                      location.pathname === item.href
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-white',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
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