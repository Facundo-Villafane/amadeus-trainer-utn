import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiMonitor, FiSave, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AppearanceSettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para los ajustes
    const [theme, setTheme] = useState('light'); // 'light', 'dark'
    const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'

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

                    if (userData.appearanceSettings) {
                        const settings = userData.appearanceSettings;
                        setTheme(settings.theme || 'light');
                        setFontSize(settings.fontSize || 'normal');
                    }
                }
            } catch (error) {
                console.error('Error al cargar configuración de apariencia:', error);
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

            const appearanceSettings = {
                theme,
                fontSize
            };

            // Actualizar en Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                appearanceSettings,
                updatedAt: new Date()
            });

            toast.success('Configuración de apariencia guardada correctamente.');
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Restablecer valores predeterminados
    const resetToDefaults = () => {
        setTheme('light');
        setFontSize('normal');
        toast.success('Valores de apariencia restablecidos a predeterminados');
    };

    return (
        <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <FiMonitor className="mr-2" /> Apariencia
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={resetToDefaults}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 transition"
                    >
                        <FiRefreshCw className="mr-1" /> Restablecer
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={saving || loading}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none transition"
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
                    <div className="space-y-6 max-w-2xl">

                        {/* Tamaño de Fuente */}
                        <div>
                            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">
                                Tamaño de Fuente (Terminal)
                            </label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="font-small"
                                        name="fontSize"
                                        type="radio"
                                        value="small"
                                        checked={fontSize === 'small'}
                                        onChange={() => setFontSize('small')}
                                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                                    />
                                    <label htmlFor="font-small" className="ml-3 block text-sm text-gray-700">
                                        Pequeño (12px)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="font-normal"
                                        name="fontSize"
                                        type="radio"
                                        value="normal"
                                        checked={fontSize === 'normal'}
                                        onChange={() => setFontSize('normal')}
                                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                                    />
                                    <label htmlFor="font-normal" className="ml-3 block text-sm text-gray-700">
                                        Normal (14px) - Recomendado
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="font-large"
                                        name="fontSize"
                                        type="radio"
                                        value="large"
                                        checked={fontSize === 'large'}
                                        onChange={() => setFontSize('large')}
                                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                                    />
                                    <label htmlFor="font-large" className="ml-3 block text-sm text-gray-700">
                                        Grande (16px) - Accesibilidad
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Tema */}
                        <div className="pt-4 border-t border-gray-200">
                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                                Tema de la Interfaz
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                NOTA: El tema general de la página no afecta los colores personalizados de tu Terminal.
                            </p>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="theme-light"
                                        name="theme"
                                        type="radio"
                                        value="light"
                                        checked={theme === 'light'}
                                        onChange={() => setTheme('light')}
                                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                                    />
                                    <label htmlFor="theme-light" className="ml-3 block text-sm text-gray-700">
                                        Claro (Light Mode)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="theme-dark"
                                        name="theme"
                                        type="radio"
                                        value="dark"
                                        checked={theme === 'dark'}
                                        onChange={() => setTheme('dark')}
                                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                                    />
                                    <label htmlFor="theme-dark" className="ml-3 block text-sm text-gray-700">
                                        Oscuro (Dark Mode) - <span className="italic text-gray-400">Próximamente</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
