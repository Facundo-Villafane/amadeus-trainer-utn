// src/components/dashboard/DashboardHeader.jsx
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router';
import { FiChevronDown, FiUser, FiSettings, FiLogOut, FiEye } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { useLatestVersion } from '../../hooks/useLatestVersion';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardHeader({ user, onLogout }) {
  const { isSpectator } = useAuth();
  const { version } = useLatestVersion();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center py-3">
        <div className="flex items-center space-x-4">
          {/* User Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary">
                {isSpectator ? (
                  <>
                    <FiEye className="mr-2 h-5 w-5" />
                    <span>Espectador</span>
                  </>
                ) : (
                  <span className="truncate max-w-[150px]">{user?.displayName || user?.email}</span>
                )}
                <FiChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  {!isSpectator && (
                    <>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'flex px-4 py-2 text-sm items-center'
                            )}
                          >
                            <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                            Perfil
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/settings"
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'flex px-4 py-2 text-sm items-center'
                            )}
                          >
                            <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                            Configuración
                          </Link>
                        )}
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          if (isSpectator) {
                            // Para espectadores, simplemente redirigir al login
                            localStorage.removeItem('spectatorMode');
                            window.location.href = '/login';
                          } else {
                            onLogout();
                          }
                        }}
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'flex w-full px-4 py-2 text-sm items-center'
                        )}
                      >
                        <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                        {isSpectator ? 'Salir del modo espectador' : 'Cerrar sesión'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}

DashboardHeader.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string
  }),
  onLogout: PropTypes.func.isRequired
};