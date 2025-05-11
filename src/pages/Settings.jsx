// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TerminalSettings from '../components/settings/TerminalSettings';
import { FiSettings } from 'react-icons/fi';
import { db } from '../services/firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { GravatarQuickEditor } from '@gravatar-com/quick-editor';
import md5 from 'blueimp-md5';

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
                <AccountSettings currentUser={currentUser} />
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

// Componente de configuración de cuenta
function AccountSettings({ currentUser }) {
  const { userRole } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ role: '', commission: '', status: '', xp: 0, level: 1, active: true });
  const [fetching, setFetching] = useState(true);
  const [editor, setEditor] = useState(null); // Estado para almacenar la instancia del editor

  // Obtener datos completos del usuario de Firestore
  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser?.uid) return;
      setFetching(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData({
            role: userDoc.data().role || '-',
            commission: userDoc.data().commission || '-',
            status: userDoc.data().status || (userDoc.data().active === false ? 'No cursando' : 'Cursando'),
            xp: userDoc.data().xp ?? 0,
            level: userDoc.data().level ?? 1,
            active: userDoc.data().active !== false,
          });
        }
      } catch (e) {
        // Si falla, dejar valores por defecto
      } finally {
        setFetching(false);
      }
    }
    fetchUserData();
  }, [currentUser]);

  // Barra de experiencia
  const xpForNextLevel = userData.level * 100; // Ejemplo: 100 XP por nivel
  const xpPercent = Math.min(100, Math.round((userData.xp / xpForNextLevel) * 100));

  // Gravatar URL
  const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=128`;

  // Inicializar el editor de Gravatar
  useEffect(() => {
    const newEditor = new GravatarQuickEditor({
      email: email, // El email del usuario
      editorTriggerSelector: '#edit-profile', // Selector del botón que abrirá el editor
      avatarSelector: '#gravatar-avatar', // Selector de la imagen del avatar
      scope: ['avatars'], // Ámbito de los datos que se pueden editar
      onProfileUpdated: () => {
        console.log('Perfil actualizado');
      },
      onOpened: () => {
        console.log('Editor abierto');
      },
    });

    setEditor(newEditor); // Almacenar la instancia del editor
  }, [email]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), { name });
        toast.success('Nombre actualizado correctamente');
      }
    } catch (error) {
      toast.error('Error al actualizar el nombre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg p-6 max-w-lg">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Perfil de usuario</h2>
      {fetching ? (
        <div className="text-center text-gray-400 py-8">Cargando datos...</div>
      ) : (
        <>
          {/* Avatar Gravatar */}
          <div className="flex justify-center mb-6">
            <img
              id="gravatar-avatar"
              src={gravatarUrl}
              alt="Avatar"
              className="h-24 w-24 rounded-full border-2 border-amadeus-primary shadow"
            />
          </div>
          {/*<button 
            id="edit-profile" 
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => {
              if (editor) {
                editor.open(); // Abre el editor al hacer clic
              }
            }}
          >
            Editar Perfil
          </button>*/}
          {/* Barra de experiencia */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Nivel {userData.level}</span>
              <span className="text-xs text-gray-500">{userData.xp} / {xpForNextLevel} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-amadeus-primary h-3 rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Datos de solo lectura */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Rol</div>
              <div className="font-semibold text-gray-800">{userData.role}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Comisión</div>
              <div className="font-semibold text-gray-800">{userData.commission}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className={`font-semibold ${userData.active ? 'text-green-600' : 'text-red-600'}`}>{userData.status}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Activo</div>
              <div className={`font-semibold ${userData.active ? 'text-green-600' : 'text-red-600'}`}>{userData.active ? 'Sí' : 'No'}</div>
            </div>
          </div>

          {/* Formulario editable solo para el nombre si es admin */}
          <form onSubmit={handleSave} className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                className={`block w-full border ${userRole === 'admin' ? 'border-gray-300' : 'border-gray-200 bg-gray-100 cursor-not-allowed'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm`}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                readOnly={userRole !== 'admin'}
                disabled={userRole !== 'admin'}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed sm:text-sm"
                value={email}
                readOnly
              />
            </div>
            {userRole === 'admin' && (
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}