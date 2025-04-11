// src/pages/CommandHistory.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiSearch, FiCalendar, FiClock, FiTerminal } from 'react-icons/fi';

export default function CommandHistory() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandCount, setCommandCount] = useState(0);
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Obtener historial de comandos
  useEffect(() => {
    async function fetchCommandHistory() {
      if (!currentUser) return;
      
      try {
        const isAdmin = userRole === 'admin';
        let q;
        
        if (isAdmin) {
          // Para administradores, mostrar todos los comandos
          q = query(
            collection(db, 'commandHistory'),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
        } else {
          // Para estudiantes, mostrar solo sus propios comandos
          q = query(
            collection(db, 'commandHistory'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
        }
        
        const querySnapshot = await getDocs(q);
        const commandsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        setCommands(commandsData);
        setCommandCount(commandsData.length);
      } catch (error) {
        console.error('Error al obtener historial de comandos:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommandHistory();
  }, [currentUser, userRole]);
  
  // Filtrar comandos según el término de búsqueda
  const filteredCommands = commands.filter(cmd => 
    cmd.command?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.response?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
            <h1 className="text-2xl font-semibold text-gray-900">Historial de Comandos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Revisa tu historial de comandos ejecutados en la terminal Amadeus.
            </p>
            
            {/* Stats */}
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amadeus-primary rounded-md p-3">
                      <FiTerminal className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total de Comandos
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{commandCount}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {userRole === 'admin' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-amadeus-primary rounded-md p-3">
                        <FiClock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Periodo
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">Últimos 100 comandos</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="mt-4 flex items-center max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                  placeholder="Buscar comandos"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Commands Table */}
            <div className="mt-4 bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comando
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Respuesta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      {userRole === 'admin' && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                          Cargando comandos...
                        </td>
                      </tr>
                    ) : filteredCommands.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron comandos
                        </td>
                      </tr>
                    ) : (
                      filteredCommands.map((cmd) => (
                        <tr key={cmd.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="font-mono text-sm font-medium text-amadeus-primary">
                                {cmd.command}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-h-20 overflow-y-auto">
                              {cmd.response ? (
                                <pre className="whitespace-pre-wrap font-mono text-xs">{cmd.response}</pre>
                              ) : (
                                <span className="text-gray-500 italic">Sin respuesta</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {cmd.timestamp ? (
                                <div className="flex items-center">
                                  <FiCalendar className="mr-1 h-4 w-4" />
                                  {cmd.timestamp.toLocaleDateString()}
                                  <span className="mx-1">•</span>
                                  <FiClock className="mr-1 h-4 w-4" />
                                  {cmd.timestamp.toLocaleTimeString()}
                                </div>
                              ) : (
                                <span className="italic">Fecha desconocida</span>
                              )}
                            </div>
                          </td>
                          {userRole === 'admin' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {cmd.userEmail || 'Usuario desconocido'}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}