// src/pages/admin/DataManagementPage.jsx
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DataManagement from '../../components/admin/DataManagement';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router';

export default function DataManagementPage() {
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Gestión de Datos Maestros</h1>
            <DataManagement />
          </div>
        </main>
      </div>
    </div>
  );
}