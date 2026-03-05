// src/components/dashboard/DashboardHeader.jsx
import { Fragment, useState, useEffect, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router';
import {
  FiChevronDown, FiUser, FiSettings, FiLogOut, FiEye,
  FiBell, FiTrendingUp, FiTrendingDown, FiAward, FiZap,
} from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { useLatestVersion } from '../../hooks/useLatestVersion';
import xpEventBus from '../../services/xpEventBus';

// ── Notification Bell ─────────────────────────────────────────────────────────
const MAX_NOTIF = 20;

function eventIcon(type) {
  if (type === 'xp_gain' || type === 'daily_streak') return <FiTrendingUp className="text-green-500 flex-shrink-0" size={14} />;
  if (type === 'xp_loss') return <FiTrendingDown className="text-red-400 flex-shrink-0" size={14} />;
  if (type === 'level_up') return <FiZap className="text-amber-500 flex-shrink-0" size={14} />;
  if (type === 'achievement') return <FiAward className="text-purple-500 flex-shrink-0" size={14} />;
  return <FiBell className="text-gray-400 flex-shrink-0" size={14} />;
}

function eventLabel(ev) {
  if (ev.type === 'xp_gain') return `+${ev.amount} XP — ${ev.reason || ''}`;
  if (ev.type === 'xp_loss') return `-${Math.abs(ev.amount)} XP — ${ev.reason || ev.error || ''}`;
  if (ev.type === 'daily_streak') return `Racha diaria +${ev.amount} XP (día ${ev.streak})`;
  if (ev.type === 'level_up') return `Subiste al nivel ${ev.level}: ${ev.title}`;
  if (ev.type === 'achievement') return `Logro: ${ev.achievement?.name || ''}`;
  if (ev.type === 'cooldown') return 'PNR en cooldown — sin XP';
  return ev.type;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Subscribe to all XP event types
    const TYPES = ['xp_gain', 'xp_loss', 'level_up', 'achievement', 'daily_streak', 'cooldown'];
    const unsubs = TYPES.map(type =>
      xpEventBus.subscribe(type, (data) => {
        const notif = { id: Date.now() + Math.random(), type, ts: new Date(), ...data };
        setNotifications(prev => [notif, ...prev].slice(0, MAX_NOTIF));
        setUnread(n => n + 1);
      })
    );
    return () => unsubs.forEach(fn => fn?.());
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle() {
    if (!open) setUnread(0); // mark as read
    setOpen(v => !v);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
        title="Notificaciones XP"
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Notificaciones</p>
            {notifications.length > 0 && (
              <button onClick={() => { setNotifications([]); setUnread(0); }} className="text-xs text-gray-400 hover:text-gray-600">
                Limpiar
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50">
                  {eventIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{eventLabel(n)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {n.ts.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}



function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardHeader({ user, onLogout }) {
  const { isSpectator } = useAuth();
  const { version } = useLatestVersion();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center py-3">
        <div className="flex items-center space-x-2">
          {/* Notification Bell */}
          {!isSpectator && <NotificationBell />}

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