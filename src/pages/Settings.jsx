// src/pages/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TerminalSettings from '../components/settings/TerminalSettings';
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
              Personaliza tu experiencia en Amadeus Trainer.
            </p>
            
            {/* Tabs de navegación */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`${
                    activeTab === 'terminal'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`${
                    activeTab === 'account'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Cuenta
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`${
                    activeTab === 'notifications'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Notificaciones
                </button>
              </nav>
            </div>
            
            {/* Contenido de la pestaña activa */}
            <div className="mt-4">
              {activeTab === 'terminal' && (
                <TerminalSettings />
              )}
              
              {activeTab === 'account' && (
                <div className="bg-white shadow overflow-hidden rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900">Configuración de cuenta</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta funcionalidad estará disponible próximamente. Para cambiar la configuración de tu cuenta, 
                    visita la página de Perfil.
                  </p>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div className="bg-white shadow overflow-hidden rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900">Configuración de notificaciones</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta funcionalidad estará disponible próximamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}