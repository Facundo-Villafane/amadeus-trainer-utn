// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import Terminal from '../components/terminal/Terminal';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Dashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const [commandHistory, setCommandHistory] = useState([]);
  const [recentPNRs, setRecentPNRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Obtener historial de comandos del usuario
  useEffect(() => {
    async function fetchCommandHistory() {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'commandHistory'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const commands = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        setCommandHistory(commands);
      } catch (error) {
        console.error('Error al obtener el historial de comandos:', error);
      }
    }
    
    async function fetchRecentPNRs() {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'pnrs'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const pnrs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentPNRs(pnrs);
      } catch (error) {
        console.error('Error al obtener los PNRs recientes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommandHistory();
    fetchRecentPNRs();
  }, [currentUser]);

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
            <h1 className="text-2xl font-semibold text-gray-900">Terminal Amadeus</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa comandos en formato Amadeus para practicar y aprender.
            </p>
            
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Terminal */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-200px)]">
                  <Terminal />
                </div>
              </div>
              
              {/* Sidebar with recent activity and PNRs */}
              <div className="space-y-4">
                {/* Recent Commands */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Comandos Recientes</h2>
                  
                  {loading ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  ) : commandHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay comandos recientes.</p>
                  ) : (
                    <ul className="space-y-2">
                      {commandHistory.slice(0, 5).map((cmd) => (
                        <li key={cmd.id} className="text-sm">
                          <span className="font-mono bg-gray-100 px-1 rounded">{cmd.command}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {cmd.timestamp?.toLocaleString() || 'Sin fecha'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Recent PNRs */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">PNRs Recientes</h2>
                  
                  {loading ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  ) : recentPNRs.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay PNRs recientes.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recentPNRs.map((pnr) => (
                        <li key={pnr.id} className="p-2 hover:bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span className="font-mono text-amadeus-primary">{pnr.recordLocator}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(pnr.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {pnr.passengers?.map(p => `${p.lastName}/${p.firstName}`).join(', ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pnr.segments?.map(s => `${s.origin}-${s.destination}`).join(', ')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Help / Quick Reference */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Referencia Rápida</h2>
                  
                  <ul className="text-sm space-y-1">
                    <li>
                      <span className="font-mono text-amadeus-primary">AN</span>
                      <span className="text-gray-600"> - Disponibilidad</span>
                    </li>
                    <li>
                      <span className="font-mono text-amadeus-primary">SN</span>
                      <span className="text-gray-600"> - Horarios</span>
                    </li>
                    <li>
                      <span className="font-mono text-amadeus-primary">SS</span>
                      <span className="text-gray-600"> - Selección de asientos</span>
                    </li>
                    <li>
                      <span className="font-mono text-amadeus-primary">NM</span>
                      <span className="text-gray-600"> - Añadir nombre</span>
                    </li>
                    <li>
                      <span className="font-mono text-amadeus-primary">AP</span>
                      <span className="text-gray-600"> - Añadir contacto</span>
                    </li>
                    <li>
                      <span className="font-mono text-amadeus-primary">HELP</span>
                      <span className="text-gray-600"> - Ayuda</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}