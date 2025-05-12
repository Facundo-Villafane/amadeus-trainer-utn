// src/pages/admin/UserPNRsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FiArrowLeft, FiCalendar, FiClock, FiTag, FiUsers, FiMap, FiFilter, FiCheck, FiX } from 'react-icons/fi';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import toast from 'react-hot-toast';

export default function UserPNRsPage() {
  const { userId } = useParams();
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const [pnrs, setPnrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPNR, setSelectedPNR] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const ITEMS_PER_PAGE = 10;
  
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
  
  // Usar useCallback para fetchUserPNRs
  const fetchUserPNRs = useCallback(async (pageNum) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Crear consulta base
      let pnrsQuery = query(
        collection(db, 'pnrs'),
        where('userId', '==', userId)
      );
      
      // Aplicar filtro por estado
      if (filterStatus !== 'all') {
        pnrsQuery = query(
          pnrsQuery,
          where('status', '==', filterStatus)
        );
      }
      
      // Ordenar por fecha de actualización descendente y limitar resultados
      pnrsQuery = query(
        pnrsQuery,
        orderBy('updatedAt', 'desc'),
        limit(pageNum * ITEMS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(pnrsQuery);
      
      // Formatear los resultados
      const pnrsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setPnrs(pnrsData);
      setHasMore(querySnapshot.docs.length === pageNum * ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al obtener PNRs del usuario:', error);
      toast.error('Error al cargar los PNRs');
    } finally {
      setLoading(false);
    }
  }, [userId, filterStatus, ITEMS_PER_PAGE]);
  
  // Corregir useEffect para usar fetchUserPNRs como dependencia
  useEffect(() => {
    fetchUserPNRs(1);
  }, [fetchUserPNRs]);
  
  const loadMore = () => {
    fetchUserPNRs(page + 1);
  };
  
  // Abrir modal con detalles del PNR
  const openPNRDetail = (pnr) => {
    setSelectedPNR(pnr);
    setShowDetailModal(true);
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
                <FiTag className="mr-2" />
                PNRs del Usuario
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
                    <FiUsers className="inline-block mr-1" />
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
                  <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-700 mb-1">
                    Estado del PNR
                  </label>
                  <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="IN_PROGRESS">En progreso</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Lista de PNRs */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                PNRs ({pnrs.length})
              </h3>
              
              {loading && pnrs.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Cargando PNRs...</div>
                </div>
              ) : pnrs.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-500">No se encontraron PNRs con los filtros seleccionados.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pnrs.map((pnr) => (
                    <div 
                      key={pnr.id}
                      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer ${
                        pnr.status === 'CANCELLED' ? 'opacity-70 border-red-200' :
                        pnr.status === 'CONFIRMED' ? 'border-green-200' :
                        'border-blue-200'
                      }`}
                      onClick={() => openPNRDetail(pnr)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-mono text-lg font-medium text-amadeus-primary">
                          {pnr.recordLocator}
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pnr.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            pnr.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            pnr.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pnr.status === 'CONFIRMED' ? 'Confirmado' :
                             pnr.status === 'IN_PROGRESS' ? 'En progreso' :
                             pnr.status === 'CANCELLED' ? 'Cancelado' : pnr.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Pasajeros */}
                      {pnr.passengers && pnr.passengers.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Pasajeros</h4>
                          <ul className="text-sm">
                            {pnr.passengers.slice(0, 2).map((passenger, idx) => (
                              <li key={idx} className="truncate">
                                {passenger.lastName}/{passenger.firstName}
                              </li>
                            ))}
                            {pnr.passengers.length > 2 && (
                              <li className="text-gray-500 text-xs">
                                +{pnr.passengers.length - 2} más
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {/* Segmentos */}
                      {pnr.segments && pnr.segments.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Itinerario</h4>
                          <ul className="text-sm">
                            {pnr.segments.slice(0, 2).map((segment, idx) => (
                              <li key={idx} className="flex items-center">
                                <FiMap className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="font-mono">
                                  {segment.origin}-{segment.destination}
                                </span>
                                <span className="mx-1 text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {segment.departureDate}
                                </span>
                              </li>
                            ))}
                            {pnr.segments.length > 2 && (
                              <li className="text-gray-500 text-xs">
                                +{pnr.segments.length - 2} más
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {/* Fecha */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t">
                        <div className="flex items-center">
                          <FiCalendar className="h-3 w-3 mr-1" />
                          <span>
                            {pnr.createdAt ? pnr.createdAt.toLocaleDateString() : 'Fecha desconocida'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="h-3 w-3 mr-1" />
                          <span>
                            {pnr.updatedAt ? pnr.updatedAt.toLocaleDateString() : 'Fecha desconocida'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Botón de cargar más */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cargar más
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal de detalle del PNR */}
      {showDetailModal && selectedPNR && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amadeus-light sm:mx-0 sm:h-10 sm:w-10">
                    <FiTag className="h-6 w-6 text-amadeus-primary" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      PNR: {selectedPNR.recordLocator}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedPNR.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        selectedPNR.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        selectedPNR.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedPNR.status === 'CONFIRMED' ? 'Confirmado' :
                         selectedPNR.status === 'IN_PROGRESS' ? 'En progreso' :
                         selectedPNR.status === 'CANCELLED' ? 'Cancelado' : selectedPNR.status}
                      </span>
                    </h3>
                    
                    {/* Pasajeros */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700">Pasajeros</h4>
                      <ul className="mt-1 border rounded-md divide-y">
                        {selectedPNR.passengers && selectedPNR.passengers.map((passenger, idx) => (
                          <li key={idx} className="px-3 py-2">
                            <div className="text-sm">{idx + 1}. {passenger.lastName}/{passenger.firstName} {passenger.title}</div>
                            {passenger.type !== 'ADT' && (
                              <div className="text-xs text-gray-500">
                                {passenger.type === 'CHD' ? 'Niño' : 'Infante'} 
                                {passenger.dateOfBirth ? ` - Nacimiento: ${passenger.dateOfBirth}` : ''}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Segmentos/Vuelos */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700">Itinerario</h4>
                      <ul className="mt-1 border rounded-md divide-y">
                        {selectedPNR.segments && selectedPNR.segments.map((segment, idx) => (
                          <li key={idx} className="px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium">
                                  {segment.airline_code} {segment.flight_number} - Clase {segment.class}
                                </div>
                                <div className="text-sm">
                                  {segment.origin} - {segment.destination}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {segment.departureDate}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {segment.departureTime} - {segment.arrivalTime}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 flex justify-between">
                              <span>
                                Estado: {segment.status}{segment.quantity} 
                                {segment.status === 'HK' ? ' (Confirmado)' : 
                                 segment.status === 'DK' ? ' (Pendiente)' : ''}
                              </span>
                              <span>Equipo: {segment.equipment}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Contactos */}
                    {selectedPNR.contacts && selectedPNR.contacts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Contacto</h4>
                        <ul className="mt-1 border rounded-md divide-y">
                          {selectedPNR.contacts.map((contact, idx) => (
                            <li key={idx} className="px-3 py-2">
                              <div className="text-sm">
                                {contact.city} {contact.phone}
                                <span className="ml-1 text-xs text-gray-500">
                                  ({contact.type === 'M' ? 'Móvil' : 
                                   contact.type === 'H' ? 'Hogar' : 
                                   contact.type === 'B' ? 'Trabajo' : contact.type})
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Emisión de billetes */}
                    {selectedPNR.ticketing && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Emisión</h4>
                        <div className="mt-1 border rounded-md px-3 py-2">
                          <div className="text-sm">
                            Tipo: {selectedPNR.ticketing.type === 'OK' ? 'Inmediata' : 
                                  selectedPNR.ticketing.type === 'TL' ? 'Time Limit' : 
                                  selectedPNR.ticketing.type === 'XL' ? 'Cancelada' : selectedPNR.ticketing.type}
                          </div>
                          {selectedPNR.ticketing.date && (
                            <div className="text-sm">
                              Fecha: {selectedPNR.ticketing.date} {selectedPNR.ticketing.time}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Historial (si existe) */}
                    {selectedPNR.history && Object.keys(selectedPNR.history).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Historial de Cambios</h4>
                        <div className="mt-1 border rounded-md px-3 py-2 max-h-40 overflow-y-auto">
                          {Object.entries(selectedPNR.history)
                            .sort(([a], [b]) => parseInt(b) - parseInt(a))
                            .map(([timestamp, entry]) => (
                              <div key={timestamp} className="mb-2 pb-2 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0">
                                <div className="text-xs text-gray-500">
                                  {new Date(parseInt(timestamp)).toLocaleString()}
                                </div>
                                <div className="text-sm">
                                  <code className="font-mono text-xs bg-gray-100 px-1 rounded">{entry.command}</code>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {entry.result}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Fechas */}
                    <div className="mt-4 text-xs text-gray-500 flex justify-between">
                      <div>
                        Creado: {selectedPNR.createdAt ? selectedPNR.createdAt.toLocaleString() : 'Desconocido'}
                      </div>
                      <div>
                        Actualizado: {selectedPNR.updatedAt ? selectedPNR.updatedAt.toLocaleString() : 'Desconocido'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}