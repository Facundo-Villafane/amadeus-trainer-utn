// src/pages/admin/Settings.jsx
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { FiSave, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DatToJsonConversionTool } from '../../utils/airportDataTools';

export default function AdminSettings() {
  const [systemSettings, setSystemSettings] = useState({
    maxPNRsPerUser: 50,
    maxCommandsPerDay: 1000,
    enableHelpMode: true,
    requireEmailVerification: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  // Cargar configuración
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsRef = doc(collection(db, 'system'), 'settings');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          setSystemSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        toast.error('Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);
  
  // Manejar cambios en los campos
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Convertir a número si es un campo numérico
    const finalValue = type === 'number' ? parseInt(value, 10) : type === 'checkbox' ? checked : value;
    
    setSystemSettings(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };
  
  // Guardar configuración
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsRef = doc(collection(db, 'system'), 'settings');
      await updateDoc(settingsRef, systemSettings);
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };
  
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
            <h1 className="text-2xl font-semibold text-gray-900">Configuración del Sistema</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra la configuración global del sistema Amadeus Trainer.
            </p>
            
            {loading ? (
              <div className="mt-4 bg-white shadow rounded-lg p-4">
                <p className="text-center text-gray-500">Cargando configuración...</p>
              </div>
            ) : (
              <div className="mt-4 bg-white shadow rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiSettings className="mr-2" />
                      Configuración General
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Configura los límites y comportamiento general del sistema.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="maxPNRsPerUser" className="block text-sm font-medium text-gray-700">
                        Máximo de PNRs por Usuario
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          name="maxPNRsPerUser"
                          id="maxPNRsPerUser"
                          value={systemSettings.maxPNRsPerUser}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Cantidad máxima de PNRs que un usuario puede crear.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="maxCommandsPerDay" className="block text-sm font-medium text-gray-700">
                        Máximo de Comandos por Día
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          name="maxCommandsPerDay"
                          id="maxCommandsPerDay"
                          value={systemSettings.maxCommandsPerDay}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Cantidad máxima de comandos que un usuario puede ejecutar por día.
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="enableHelpMode"
                          name="enableHelpMode"
                          type="checkbox"
                          checked={systemSettings.enableHelpMode}
                          onChange={handleInputChange}
                          className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="enableHelpMode" className="font-medium text-gray-700">
                          Activar Modo de Ayuda
                        </label>
                        <p className="text-gray-500">
                          Muestra sugerencias y ayuda contextual a los usuarios.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="requireEmailVerification"
                          name="requireEmailVerification"
                          type="checkbox"
                          checked={systemSettings.requireEmailVerification}
                          onChange={handleInputChange}
                          className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="requireEmailVerification" className="font-medium text-gray-700">
                          Requerir Verificación de Email
                        </label>
                        <p className="text-gray-500">
                          Los usuarios deben verificar su correo electrónico antes de usar el sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                      >
                        <FiSave className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                      </button>
                    </div>
                  </div>

                  {/* Add the new Airport Data Management section */}
                  <div className="mt-8">
                    <h2 className="text-lg font-medium text-gray-900">Gestión de Datos de Aeropuertos</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Convierte y gestiona los datos de aeropuertos utilizados por el sistema.
                    </p>
                    
                    <div className="mt-4">
                      <DatToJsonConversionTool />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}