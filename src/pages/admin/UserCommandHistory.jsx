// src/pages/admin/UserCommandHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FiArrowLeft, FiCalendar, FiClock, FiCheck, FiX, FiList, FiUser, FiFilter } from 'react-icons/fi';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import toast from 'react-hot-toast';

export default function UserCommandHistoryPage() {
  const { userId } = useParams();
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterSuccess, setFilterSuccess] = useState('all');
  
  const ITEMS_PER_PAGE = 20;
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  // Cargar información del usuario
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
        } else {
          toast.error('Usuario no encontrado');
          navigate('/admin/users');
        }
      } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        toast.error('Error al cargar la información del usuario');
      }
    };
    
    fetchUserInfo();
  }, [userId, navigate]);
  
  // Usar useCallback para fetchCommandHistory
  const fetchCommandHistory = useCallback(async (pageNum) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Crear consulta base
      let commandQuery = query(
        collection(db, 'commandHistory'),
        where('userId', '==', userId)
      );
      
      // Aplicar filtro por tipo de comando
      if (filterType !== 'all') {
        commandQuery = query(
          commandQuery,
          where('commandType', '==', filterType)
        );
      }
      
      // Aplicar filtro por éxito/error
      if (filterSuccess !== 'all') {
        const isSuccessful = filterSuccess === 'success';
        commandQuery = query(
          commandQuery,
          where('isSuccessful', '==', isSuccessful)
        );
      }
      
      // Ordenar por fecha descendente y limitar resultados
      commandQuery = query(
        commandQuery,
        orderBy('timestamp', 'desc'),
        limit(pageNum * ITEMS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(commandQuery);
      
      // Formatear los resultados
      const commandsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        isSuccessful: doc.data().isSuccessful !== false,
      }));
      
      setCommands(commandsData);
      setHasMore(querySnapshot.docs.length === pageNum * ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al obtener historial de comandos:', error);
      toast.error('Error al cargar el historial de comandos');
    } finally {
      setLoading(false);
    }
  }, [userId, filterType, filterSuccess, ITEMS_PER_PAGE]);
  
  // Corregir useEffect para usar fetchCommandHistory como dependencia
  useEffect(() => {
    fetchCommandHistory(1);
  }, [fetchCommandHistory]);
  
  const loadMore = () => {
    fetchCommandHistory(page + 1);
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
  
  // Obtener tipos de comandos únicos para el filtro
  const commandTypes = [...new Set(commands.map(cmd => cmd.commandType).filter(Boolean))];
  
  // Agrupar comandos por fecha
  const groupedCommands = commands.reduce((groups, command) => {
    const date = command.timestamp.toLocaleDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(command);
    return groups;
  }, {});
  
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
            {/* Encabezado y botón de regreso */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate('/admin/users')}
                className="mr-4 p-2 rounded-full hover:bg-gray-200"
                title="Volver a lista de usuarios"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <FiList className="mr-2" />
                Historial de Comandos
              </h1>
            </div>
            
            {/* Info del usuario */}
            {userInfo && (
              <div className="bg-white shadow rounded-lg p-4 mb-6 flex items-center">
                <div className="h-10 w-10 rounded-full bg-amadeus-primary text-white flex items-center justify-center text-xl mr-4">
                  {userInfo.displayName ? userInfo.displayName.substring(0, 1).toUpperCase() : 
                   userInfo.email ? userInfo.email.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="font-medium text-gray-900">
                    {userInfo.displayName || 'Usuario'}
                  </h2>
                  <p className="text-sm text-gray-500">{userInfo.email}</p>
                </div>
                <div className="ml-auto flex space-x-2">
                  {userInfo.commissionName && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center">
                      <span>{userInfo.commissionName}</span>
                      <code className="ml-1 bg-white px-1 rounded text-xs">{userInfo.commissionCode}</code>
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded text-xs ${
                    userInfo.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    <FiUser className="inline-block mr-1" />
                    {userInfo.role === 'admin' ? 'Administrador' : 'Estudiante'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros</h3>
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-auto">
                  <label htmlFor="filterType" className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo de comando
                  </label>
                  <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  >
                    <option value="all">Todos los tipos</option>
                    {commandTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="filterSuccess" className="block text-xs font-medium text-gray-700 mb-1">
                    Resultado
                  </label>
                  <select
                    id="filterSuccess"
                    value={filterSuccess}
                    onChange={(e) => setFilterSuccess(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="success">Exitosos</option>
                    <option value="error">Con errores</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Historial de comandos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                Comandos ({commands.length})
              </h3>
              
              {loading && commands.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Cargando historial...</div>
                </div>
              ) : commands.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-500">No se encontraron comandos con los filtros seleccionados.</div>
                </div>
              ) : (
                <>
                  {Object.entries(groupedCommands).map(([date, dateCommands]) => (
                    <div key={date} className="mb-8">
                      <div className="flex items-center mb-4">
                        <FiCalendar className="text-gray-400 mr-2" />
                        <h3 className="text-sm font-medium text-gray-700">{date}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {dateCommands.map((command) => (
                          <div 
                            key={command.id} 
                            className={`bg-gray-50 p-4 rounded-lg border ${
                              command.isSuccessful ? 'border-green-200' : 'border-red-200'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {command.command}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <FiClock className="mr-1" />
                                {command.timestamp.toLocaleTimeString()}
                                {command.isSuccessful ? (
                                  <span className="ml-2 text-green-600 flex items-center">
                                    <FiCheck className="mr-1" /> Exitoso
                                  </span>
                                ) : (
                                  <span className="ml-2 text-red-600 flex items-center">
                                    <FiX className="mr-1" /> Error
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Tipo y resultado */}
                            <div className="flex justify-between text-xs">
                              <div>
                                <span className="font-medium text-gray-700">Tipo:</span>{' '}
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {command.commandType || 'UNKNOWN'}
                                </span>
                              </div>
                              {command.result && (
                                <div className="text-gray-600 truncate max-w-md">
                                  <span className="font-medium text-gray-700">Resultado:</span> {command.result}
                                </div>
                              )}
                            </div>
                            
                            {/* Mostrar respuesta si existe */}
                            {command.response && (
                              <div className="mt-2 text-xs">
                                <div className="font-medium text-gray-700 mb-1">Respuesta:</div>
                                <div className="bg-white p-2 rounded border border-gray-200 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                  {command.response}
                                </div>
                              </div>
                            )}
                            
                            {/* Mostrar error si existe */}
                            {command.error && (
                              <div className="mt-2 text-xs">
                                <div className="font-medium text-red-600 mb-1">Error:</div>
                                <div className="bg-red-50 p-2 rounded border border-red-200 text-red-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                  {command.error}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Botón de cargar más */}
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={loadMore}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cargar más
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}