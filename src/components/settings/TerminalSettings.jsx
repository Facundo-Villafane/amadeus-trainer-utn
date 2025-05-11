// src/components/settings/TerminalSettings.jsx
import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiTerminal, FiSave, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TerminalSettings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para los colores (valores por defecto)
  const [textColor, setTextColor] = useState('#080286');
  const [backgroundColor, setBackgroundColor] = useState('#E1E6FC');
  const [inputTextColor, setInputTextColor] = useState('#080286');
  const [outputTextColor, setOutputTextColor] = useState('#000000');
  const [errorTextColor, setErrorTextColor] = useState('#FF0000');
  
  // Cargar configuración actual del usuario
  useEffect(() => {
    async function loadUserSettings() {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.terminalSettings) {
            // Cargar configuración guardada
            const settings = userData.terminalSettings;
            setTextColor(settings.textColor || '#080286');
            setBackgroundColor(settings.backgroundColor || '#E1E6FC');
            setInputTextColor(settings.inputTextColor || '#080286');
            setOutputTextColor(settings.outputTextColor || '#000000');
            setErrorTextColor(settings.errorTextColor || '#FF0000');
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración de terminal:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserSettings();
  }, [currentUser]);
  
  // Guardar la configuración
  const saveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      const terminalSettings = {
        textColor,
        backgroundColor,
        inputTextColor,
        outputTextColor,
        errorTextColor
      };
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        terminalSettings,
        updatedAt: new Date()
      });
      
      // Mensaje de éxito más detallado
      console.log('Guardando configuración:', terminalSettings);
      toast.success('Configuración guardada correctamente. Recarga la página para ver los cambios.');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast.error('Error al guardar la configuración: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Restablecer valores predeterminados
  const resetToDefaults = () => {
    setTextColor('#080286');
    setBackgroundColor('#E1E6FC');
    setInputTextColor('#080286');
    setOutputTextColor('#000000');
    setErrorTextColor('#FF0000');
    toast.success('Valores restablecidos a predeterminados');
  };
  
  // Vista previa de la terminal
  const TerminalPreview = () => (
    <div 
      className="font-mono p-4 rounded-md overflow-hidden border"
      style={{ backgroundColor }}
    >
      <div style={{ color: inputTextColor }}>{'>'} AN15NOVBUEMAD</div>
      <div style={{ color: outputTextColor }}>
        ** AMADEUS AVAILABILITY - AN ** MAD MADRID.ES 30 MO 15NOV 1200<br />
        1 IB 6841 J4 C4 D4 Y9 B9 H9 K9 EZE 1 MAD 1 1310 0530+1E0/346 12:20<br />
        M9 L9 V9 Q9 S9
      </div>
      <div style={{ color: errorTextColor }}>Error: Comando desconocido: ANNN</div>
    </div>
  );
  
  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <FiTerminal className="mr-2" /> Configuración de Terminal
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
          >
            <FiRefreshCw className="mr-1" /> Restablecer
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:shadow-outline-blue active:bg-amadeus-dark transition ease-in-out duration-150"
          >
            <FiSave className="mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {loading ? (
          <div className="text-center py-4">
            <p>Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-base font-medium text-gray-900">Vista previa</h4>
              <div className="mt-2">
                <TerminalPreview />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                  Color de fondo de la terminal
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-8 w-16 p-0 border-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="ml-2 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="inputTextColor" className="block text-sm font-medium text-gray-700">
                  Color de texto de entrada (comandos)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="inputTextColor"
                    value={inputTextColor}
                    onChange={(e) => setInputTextColor(e.target.value)}
                    className="h-8 w-16 p-0 border-0"
                  />
                  <input
                    type="text"
                    value={inputTextColor}
                    onChange={(e) => setInputTextColor(e.target.value)}
                    className="ml-2 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="outputTextColor" className="block text-sm font-medium text-gray-700">
                  Color de texto de salida (respuestas)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="outputTextColor"
                    value={outputTextColor}
                    onChange={(e) => setOutputTextColor(e.target.value)}
                    className="h-8 w-16 p-0 border-0"
                  />
                  <input
                    type="text"
                    value={outputTextColor}
                    onChange={(e) => setOutputTextColor(e.target.value)}
                    className="ml-2 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="errorTextColor" className="block text-sm font-medium text-gray-700">
                  Color de texto de error
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="errorTextColor"
                    value={errorTextColor}
                    onChange={(e) => setErrorTextColor(e.target.value)}
                    className="h-8 w-16 p-0 border-0"
                  />
                  <input
                    type="text"
                    value={errorTextColor}
                    onChange={(e) => setErrorTextColor(e.target.value)}
                    className="ml-2 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}