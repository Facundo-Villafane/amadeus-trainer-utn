import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiSliders, FiSave, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BehaviorSettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para los ajustes
    const [autoFocus, setAutoFocus] = useState(true);

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

                    if (userData.behaviorSettings) {
                        const settings = userData.behaviorSettings;
                        setAutoFocus(settings.autoFocus !== undefined ? settings.autoFocus : true);
                    }
                }
            } catch (error) {
                console.error('Error al cargar configuración de comportamiento:', error);
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

            const behaviorSettings = {
                autoFocus
            };

            // Actualizar en Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                behaviorSettings,
                updatedAt: new Date()
            });

            toast.success('Configuración de comportamiento guardada correctamente.');
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Restablecer valores predeterminados
    const resetToDefaults = () => {
        setAutoFocus(true);
        toast.success('Valores de comportamiento restablecidos a predeterminados');
    };

    return (
        <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <FiSliders className="mr-2" /> Comportamiento Avanzado
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

                        {/* Auto-Focus */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="autoFocus"
                                    name="autoFocus"
                                    type="checkbox"
                                    checked={autoFocus}
                                    onChange={(e) => setAutoFocus(e.target.checked)}
                                    className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="autoFocus" className="font-medium text-gray-700">
                                    Auto-Focus Inmersivo en la Terminal
                                </label>
                                <p className="text-gray-500">
                                    Bloquea el cursor para que se enfoque automáticamente en la línea de comando principal,
                                    evitando que tengas que hacer clic manualmente antes de escribir tras ejecutar comandos o interactuar con otros elementos.
                                </p>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
