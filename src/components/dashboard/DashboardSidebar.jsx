// src/components/dashboard/DashboardSidebar.jsx
import { Link, useLocation } from 'react-router';
import { FiMonitor, FiBook, FiUsers, FiBarChart2, FiSettings, FiHelpCircle, FiAirplay } from 'react-icons/fi';
import PropTypes from 'prop-types';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardSidebar({ userRole }) {
  const location = useLocation();
  const isAdmin = userRole === 'admin';
  
  const navigation = [
    { name: 'Terminal', href: '/dashboard', icon: FiMonitor },
    { name: 'Mis PNRs', href: '/my-pnrs', icon: FiBook },
    { name: 'Historial de Comandos', href: '/command-history', icon: FiBarChart2 },
    { name: 'Ayuda', href: '/help', icon: FiHelpCircle },
  ];
  
  // Agregar opciones de administrador si el usuario es admin
  if (isAdmin) {
    navigation.push(
      { name: 'Gestión de Usuarios', href: '/admin/users', icon: FiUsers },
      { name: 'Gestión de Vuelos', href: '/admin/flights', icon: FiAirplay },
      { name: 'Configuración', href: '/admin/settings', icon: FiSettings }
    );
  }

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-amadeus-dark">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-white text-xl font-bold">Amadeus Trainer</span>
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
                    Rol: {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                  </div>
                  <div className="text-xs font-medium text-gray-300">
                    {userRole === 'admin' ? 'Acceso completo al sistema' : 'Acceso limitado'}
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