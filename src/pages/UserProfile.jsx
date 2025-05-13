// src/pages/UserProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiUser, FiBook, FiList, FiAward } from 'react-icons/fi';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import MyPNRsSection from '../components/profile/MyPNRsSection';
import CommandHistorySection from '../components/profile/CommandHistorySection';
import AchievementsSection from '../components/profile/AchievementsSection';

export default function UserProfile({ initialTab = 'personal' }) {
  const { currentUser, userRole, logout } = useAuth();
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    provider: 'password', // default authentication provider
  });
  const [stats, setStats] = useState({
    commandsExecuted: 0,
    pnrsCreated: 0,
    lastActivity: null
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const navigate = useNavigate();
  
  // Cargar datos del usuario
  useEffect(() => {
    if (!currentUser) return;
    
    async function fetchUserData() {
      try {
        setLoading(true);
        
        // Determine auth provider
        const isGoogleUser = currentUser.providerData && 
          currentUser.providerData.some(provider => provider.providerId === 'google.com');
        
        // Cargar datos de Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userDocData = userDoc.data();
          
          // Cargar estadísticas
          setStats({
            commandsExecuted: userDocData.commandsExecuted || 0,
            pnrsCreated: userDocData.pnrsCreated || 0,
            lastActivity: userDocData.lastActivity ? new Date(userDocData.lastActivity) : null
          });
        }
        
        // Cargar datos de Auth
        setUserData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          provider: isGoogleUser ? 'google.com' : 'password'
        });
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [currentUser]);
  
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
            <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tu información personal y accede a tu actividad en el sistema.
            </p>
            
            {/* Tabs de navegación */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`${
                    activeTab === 'personal'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FiUser className="mr-2" />
                  Información Personal
                </button>
                <button
                  onClick={() => setActiveTab('pnrs')}
                  className={`${
                    activeTab === 'pnrs'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FiBook className="mr-2" />
                  Mis PNRs
                </button>
                <button
                  onClick={() => setActiveTab('commands')}
                  className={`${
                    activeTab === 'commands'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FiList className="mr-2" />
                  Historial de Comandos
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`${
                    activeTab === 'achievements'
                      ? 'border-amadeus-primary text-amadeus-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FiAward className="mr-2" />
                  Experiencia y Logros
                </button>
              </nav>
            </div>
            
            {/* Contenido de la pestaña activa */}
            <div className="mt-6">
              {activeTab === 'personal' && (
                <PersonalInfoSection 
                  currentUser={currentUser}
                  userData={{ ...userData, role: userRole }} // Asegúrate de pasar el userRole aquí
                  userRole={userRole}
                  stats={stats}
                  loading={loading}
                />
              )}
              
              {activeTab === 'pnrs' && <MyPNRsSection />}
              
              {activeTab === 'commands' && <CommandHistorySection />}
              
              {activeTab === 'achievements' && (
                <AchievementsSection currentUser={currentUser} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}