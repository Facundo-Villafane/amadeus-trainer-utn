// src/pages/FlightExplorerPage.jsx
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import FlightExplorer from '../components/student/FlightExplorer';
import { SlPlane } from 'react-icons/sl';

export default function FlightExplorerPage() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

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
      <DashboardSidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <SlPlane className="mr-2 text-amadeus-primary" />
              Explorador de Vuelos
            </h1>
            
            <p className="mt-2 mb-6 text-sm text-gray-500">
              Utiliza esta herramienta para explorar los vuelos disponibles en el sistema y familiarizarte con las rutas, aerolíneas y aeropuertos que puedes utilizar en la terminal.
            </p>
            
            <FlightExplorer />
          </div>
        </main>
      </div>
    </div>
  );
}