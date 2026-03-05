// src/pages/Settings.jsx (versión simplificada)
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TerminalSettings from '../components/settings/TerminalSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import BehaviorSettings from '../components/settings/BehaviorSettings';
import { FiSettings } from 'react-icons/fi';

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
              Personaliza tu experiencia en Mozart Trainer.
            </p>

            {/* Tabs de navegación */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`${activeTab === 'terminal'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Terminal (Colores)
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`${activeTab === 'appearance'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Apariencia
                </button>
                <button
                  onClick={() => setActiveTab('behavior')}
                  className={`${activeTab === 'behavior'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Comportamiento
                </button>
              </nav>
            </div>

            {/* Contenido de la pestaña activa */}
            <div className="mt-4">
              {activeTab === 'terminal' && (
                <TerminalSettings />
              )}

              {activeTab === 'appearance' && (
                <AppearanceSettings />
              )}

              {activeTab === 'behavior' && (
                <BehaviorSettings />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}