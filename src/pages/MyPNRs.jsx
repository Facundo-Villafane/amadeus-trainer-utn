// src/pages/MyPNRs.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiSearch, FiCalendar, FiClock, FiAirplay, FiExternalLink, FiTag, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyPNRs() {
  const [pnrs, setPnrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPNR, setSelectedPNR] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Obtener PNRs del usuario
  useEffect(() => {
    async function fetchPNRs() {
      if (!currentUser) return;
      
      try {
        const isAdmin = userRole === 'admin';
        let q;
        
        if (isAdmin) {
          // Para administradores, mostrar todos los PNRs
          q = query(
            collection(db, 'pnrs'),
            orderBy('updatedAt', 'desc'),
            limit(100)
          );
        } else {
          // Para usuarios normales, mostrar solo sus propios PNRs
          q = query(
            collection(db, 'pnrs'),
            where('userId', '==', currentUser.uid),
            orderBy('updatedAt', 'desc'),
            limit(100)
          );
        }
        
        const querySnapshot = await getDocs(q);
        const pnrsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        setPnrs(pnrsData);
      } catch (error) {
        console.error('Error al obtener PNRs:', error);
        toast.error('Error al cargar los PNRs');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPNRs();
  }, [currentUser, userRole]);
  
  // Filtrar PNRs según el término de búsqueda
  const filteredPNRs = pnrs.filter(pnr => 
    pnr.recordLocator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pnr.segments?.some(segment => 
      segment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.destination.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    pnr.passengers?.some(passenger => 
      passenger.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Abrir modal con detalles del PNR
  const openPNRDetail = (pnr) => {
    setSelectedPNR(pnr);
    setShowDetailModal(true);
  };
  
  // Cancelar un PNR
  const cancelPNR = async (pnrId) => {
    try {
      await updateDoc(doc(db, 'pnrs', pnrId), {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          command: 'XI',
          result: 'PNR cancelled from UI',
          timestamp: serverTimestamp()
        })
      });
      
      // Actualizar la lista de PNRs
      setPnrs(prev => 
        prev.map(pnr => 
          pnr.id === pnrId 
            ? { ...pnr, status: 'CANCELLED', updatedAt: new Date() } 
            : pnr
        )
      );
      
      toast.success('PNR cancelado correctamente');
    } catch (error) {
      console.error('Error al cancelar PNR:', error);
      toast.error('Error al cancelar el PNR');
    }
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
            <h1 className="text-2xl font-semibold text-gray-900">Mis PNRs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tus reservas creadas en el sistema Amadeus Trainer.
            </p>
            
            {/* Search Bar */}
            <div className="mt-4 flex items-center max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                  placeholder="Buscar por localizador, origen, destino o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* PNRs Grid */}
            <div className="mt-4">
              {loading ? (
                <div className="bg-white shadow overflow-hidden rounded-lg p-4 text-center">
                  <p className="text-gray-500">Cargando PNRs...</p>
                </div>
              ) : filteredPNRs.length === 0 ? (
                <div className="bg-white shadow overflow-hidden rounded-lg p-4 text-center">
                  <p className="text-gray-500">No se encontraron PNRs</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPNRs.map((pnr) => (
                    <div 
                      key={pnr.id}
                      className={`bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow ${
                        pnr.status === 'CANCELLED' ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <FiTag className="h-5 w-5 text-amadeus-primary mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">{pnr.recordLocator}</h3>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              pnr.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              pnr.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              pnr.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pnr.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Pasajeros */}
                        {pnr.passengers && pnr.passengers.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-500">Pasajeros</h4>
                            <ul className="mt-1 space-y-1">
                              {pnr.passengers.map((passenger, idx) => (
                                <li key={idx} className="text-sm text-gray-900">
                                  {passenger.lastName}/{passenger.firstName} {passenger.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Itinerario */}
                        {pnr.segments && pnr.segments.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-500">Itinerario</h4>
                            <ul className="mt-1 space-y-1">
                              {pnr.segments.map((segment, idx) => (
                                <li key={idx} className="text-sm text-gray-900 flex items-center">
                                  <FiAirplay className="mr-1 h-4 w-4 text-gray-400" />
                                  <span className="font-mono">
                                    {segment.origin}-{segment.destination}
                                  </span>
                                  <span className="mx-1 text-gray-500">•</span>
                                  <span>
                                    {segment.departureDate}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Fecha de actualización */}
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center text-xs text-gray-500">
                            <FiCalendar className="mr-1 h-4 w-4" />
                            <span>
                              {pnr.updatedAt ? pnr.updatedAt.toLocaleDateString() : 'Fecha desconocida'}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openPNRDetail(pnr)}
                              className="flex items-center justify-center text-sm text-amadeus-primary hover:text-amadeus-secondary"
                            >
                              <FiExternalLink className="h-4 w-4 mr-1" />
                              <span>Ver</span>
                            </button>
                            
                            {pnr.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  if (confirm('¿Estás seguro de cancelar este PNR?')) {
                                    cancelPNR(pnr.id);
                                  }
                                }}
                                className="flex items-center justify-center text-sm text-red-500 hover:text-red-700"
                              >
                                <span>Cancelar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <FiFileText className="h-6 w-6 text-amadeus-primary" aria-hidden="true" />
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
                        {selectedPNR.status}
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
                            Límite de tiempo: {selectedPNR.ticketing.timeLimit || 'No especificado'}
                          </div>
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
                
                {selectedPNR.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      if (confirm('¿Estás seguro de cancelar este PNR?')) {
                        cancelPNR(selectedPNR.id);
                        setShowDetailModal(false);
                      }
                    }}
                  >
                    Cancelar PNR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}