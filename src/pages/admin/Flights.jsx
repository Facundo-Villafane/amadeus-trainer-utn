// src/pages/admin/Flights.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
  query, orderBy, limit, where, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ImportFlights from '../../components/admin/ImportFlights';
import FlightScheduleGenerator from '../../components/admin/EnhancedFlightScheduleGenerator';
import FlightFrequencyTable from '../../components/flights/FlightFrequencyTable';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiAirplay, 
  FiFilter, FiChevronLeft, FiChevronRight, FiCalendar 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Componente interno para la tabla de vuelos
const FlightTable = ({ flights, loading, onEdit, onDelete, onSchedule }) => {
  if (loading) {
    return (
      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vuelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen/Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="mt-2 text-gray-500">Cargando vuelos...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <div className="mt-8 text-center py-8">
        <p className="text-gray-500">No se encontraron vuelos que coincidan con los criterios.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vuelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen/Destino</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flights.map((flight) => (
              <tr key={flight.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiAirplay className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {flight.airline_code} {flight.flight_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flight.airline_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {flight.departure_city} ({flight.departure_airport_code})
                  </div>
                  <div className="text-sm text-gray-500">
                    {flight.arrival_city} ({flight.arrival_airport_code})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {flight.departure_date} {flight.departure_time}
                  </div>
                  <div className="text-sm text-gray-500">
                    Duración: {flight.duration_hours}h
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    flight.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    flight.status === 'On Time' ? 'bg-green-100 text-green-800' :
                    flight.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {flight.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(flight)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Editar vuelo"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => onDelete(flight.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar vuelo"
                    >
                      <FiTrash2 />
                    </button>
                    <button
                      onClick={() => onSchedule(flight)}
                      className="text-green-600 hover:text-green-900"
                      title="Programar vuelo"
                    >
                      <FiCalendar />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente interno para filtros
const FlightFilters = ({ filters, setFilters, uniqueAirlines, uniqueOrigins, uniqueDestinations, clearFilters }) => {
  const commonClasses = ['F', 'J', 'Y', 'C', 'W'];

  return (
    <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros Avanzados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Aerolínea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aerolínea</label>
          <select
            value={filters.airline_code || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, airline_code: e.target.value }))}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todas las aerolíneas</option>
            {uniqueAirlines.map(airline => (
              <option key={airline} value={airline}>{airline}</option>
            ))}
          </select>
        </div>
        
        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aeropuerto de Origen</label>
          <select
            value={filters.departure_airport_code || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, departure_airport_code: e.target.value }))}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los orígenes</option>
            {uniqueOrigins.map(origin => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>
        </div>
        
        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aeropuerto de Destino</label>
          <select
            value={filters.arrival_airport_code || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, arrival_airport_code: e.target.value }))}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los destinos</option>
            {uniqueDestinations.map(destination => (
              <option key={destination} value={destination}>{destination}</option>
            ))}
          </select>
        </div>
        
        {/* Estado del vuelo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="Scheduled">Programado</option>
            <option value="On Time">A tiempo</option>
            <option value="Delayed">Retrasado</option>
            <option value="Cancelled">Cancelado</option>
          </select>
        </div>
        
        {/* Fecha de salida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Salida</label>
          <input
            type="date"
            value={filters.departure_date || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, departure_date: e.target.value }))}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

// Componente interno para paginación
const Pagination = ({ currentPage, totalItems, itemsPerPage, shownItems, onPreviousPage, onNextPage }) => {
  return (
    <div className="mt-4 flex justify-between items-center">
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{shownItems}</span> de{' '}
        <span className="font-medium">{totalItems}</span> vuelos
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
            currentPage === 1
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <FiChevronLeft className="mr-1" /> Anterior
        </button>
        <button
          onClick={onNextPage}
          disabled={shownItems < itemsPerPage}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
            shownItems < itemsPerPage
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Siguiente <FiChevronRight className="ml-1" />
        </button>
      </div>
    </div>
  );
};

// Componente principal
export default function AdminFlights() {
  // Estados principales
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para paginación
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFlights, setTotalFlights] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    airline_code: '',
    departure_airport_code: '',
    arrival_airport_code: '',
    departure_date: '',
    status: '',
    available_class: ''
  });
  
  // Estados para opciones de filtro
  const [uniqueAirlines, setUniqueAirlines] = useState([]);
  const [uniqueOrigins, setUniqueOrigins] = useState([]);
  const [uniqueDestinations, setUniqueDestinations] = useState([]);
  
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Verificar permisos de administrador
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  // Cargar opciones para filtros
  useEffect(() => {
    fetchFilterOptions();
  }, []);
  
  // Contar total de vuelos
  useEffect(() => {
    countTotalFlights();
  }, [filters]);
  
  // Cargar vuelos con filtros y paginación
  useEffect(() => {
    fetchFlights();
  }, [currentPage, pageSize, filters]);
  
  // Métodos para cargar datos
  async function fetchFilterOptions() {
    try {
      const airlinesQuery = query(collection(db, 'flights'), orderBy('airline_code'));
      const airlinesSnapshot = await getDocs(airlinesQuery);
      
      const airlines = new Set();
      const origins = new Set();
      const destinations = new Set();
      
      airlinesSnapshot.docs.forEach(doc => {
        const flight = doc.data();
        if (flight.airline_code) airlines.add(flight.airline_code);
        if (flight.departure_airport_code) origins.add(flight.departure_airport_code);
        if (flight.arrival_airport_code) destinations.add(flight.arrival_airport_code);
      });
      
      setUniqueAirlines(Array.from(airlines).sort());
      setUniqueOrigins(Array.from(origins).sort());
      setUniqueDestinations(Array.from(destinations).sort());
      
    } catch (error) {
      console.error('Error al obtener opciones de filtro:', error);
    }
  }
  
  async function countTotalFlights() {
    try {
      let flightsQuery = query(collection(db, 'flights'));
      
      if (filters.airline_code) {
        flightsQuery = query(flightsQuery, where('airline_code', '==', filters.airline_code));
      }
      if (filters.departure_airport_code) {
        flightsQuery = query(flightsQuery, where('departure_airport_code', '==', filters.departure_airport_code));
      }
      if (filters.arrival_airport_code) {
        flightsQuery = query(flightsQuery, where('arrival_airport_code', '==', filters.arrival_airport_code));
      }
      
      const snapshot = await getDocs(flightsQuery);
      setTotalFlights(snapshot.size);
    } catch (error) {
      console.error('Error al contar vuelos:', error);
    }
  }
  
  async function fetchFlights() {
    try {
      setLoading(true);
      
      let baseQuery = query(collection(db, 'flights'));

      if (filters.departure_airport_code) {
        baseQuery = query(baseQuery, where('departure_airport_code', '==', filters.departure_airport_code));
      }
      if (filters.arrival_airport_code) {
        baseQuery = query(baseQuery, where('arrival_airport_code', '==', filters.arrival_airport_code));
      }
      if (filters.airline_code) {
        baseQuery = query(baseQuery, where('airline_code', '==', filters.airline_code));
      }
      if (filters.status) {
        baseQuery = query(baseQuery, where('status', '==', filters.status));
      }

      // Ordenar primero por fecha de salida, luego por hora
      // Nota: Si departure_date está en formato DD/MM/YYYY, necesitaremos convertirlo
      baseQuery = query(baseQuery, orderBy('departure_date'), orderBy('departure_time'), limit(pageSize));
      
      const querySnapshot = await getDocs(baseQuery);
      
      let flightsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenamiento adicional en el cliente para manejar formatos de fecha inconsistentes
      flightsData.sort((a, b) => {
        // Convertir fecha de DD/MM/YYYY a objeto Date para comparación
        const parseDate = (dateStr, timeStr) => {
          if (!dateStr) return new Date(0);
          
          // Si la fecha está en formato DD/MM/YYYY
          const [day, month, year] = dateStr.split('/');
          const dateObj = new Date(year, month - 1, day);
          
          // Agregar la hora si está disponible
          if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
          }
          
          return dateObj;
        };
        
        const dateA = parseDate(a.departure_date, a.departure_time);
        const dateB = parseDate(b.departure_date, b.departure_time);
        
        return dateA - dateB;
      });
      
      setFlights(flightsData);
      
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
      } else {
        setLastVisible(null);
        setFirstVisible(null);
      }
      
    } catch (error) {
      console.error('Error al cargar vuelos:', error);
      
      // Si falla el ordenamiento con Firestore, intentar sin orderBy
      try {
        let simpleQuery = query(collection(db, 'flights'));
        
        if (filters.departure_airport_code) {
          simpleQuery = query(simpleQuery, where('departure_airport_code', '==', filters.departure_airport_code));
        }
        if (filters.arrival_airport_code) {
          simpleQuery = query(simpleQuery, where('arrival_airport_code', '==', filters.arrival_airport_code));
        }
        if (filters.airline_code) {
          simpleQuery = query(simpleQuery, where('airline_code', '==', filters.airline_code));
        }
        if (filters.status) {
          simpleQuery = query(simpleQuery, where('status', '==', filters.status));
        }
        
        simpleQuery = query(simpleQuery, limit(pageSize));
        
        const fallbackSnapshot = await getDocs(simpleQuery);
        let fallbackData = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenamiento en el cliente
        fallbackData.sort((a, b) => {
          const parseDate = (dateStr, timeStr) => {
            if (!dateStr) return new Date(0);
            const [day, month, year] = dateStr.split('/');
            const dateObj = new Date(year, month - 1, day);
            if (timeStr) {
              const [hours, minutes] = timeStr.split(':');
              dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
            }
            return dateObj;
          };
          
          const dateA = parseDate(a.departure_date, a.departure_time);
          const dateB = parseDate(b.departure_date, b.departure_time);
          
          return dateA - dateB;
        });
        
        setFlights(fallbackData);
        
      } catch (fallbackError) {
        console.error('Error en consulta de respaldo:', fallbackError);
        toast.error('Error al cargar los vuelos');
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Métodos para paginación
  const goToNextPage = () => {
    setPageHistory(prev => [...prev, { page: currentPage, firstVisible, lastVisible }]);
    setCurrentPage(prev => prev + 1);
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prevPageInfo = pageHistory[pageHistory.length - 1];
      setLastVisible(prevPageInfo.lastVisible);
      setFirstVisible(prevPageInfo.firstVisible);
      
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Métodos para filtros
  const clearFilters = () => {
    setFilters({
      airline_code: '',
      departure_airport_code: '',
      arrival_airport_code: '',
      departure_date: '',
      status: '',
      available_class: ''
    });
    setCurrentPage(1);
    setPageHistory([]);
    setLastVisible(null);
    setFirstVisible(null);
  };
  
  // Métodos para operaciones CRUD
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este vuelo?')) return;
    
    try {
      await deleteDoc(doc(db, 'flights', id));
      setFlights(prev => prev.filter(flight => flight.id !== id));
      toast.success('Vuelo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar vuelo:', error);
      toast.error('Error al eliminar el vuelo');
    }
  };
  
  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setShowAddModal(true);
  };
  
  // Filtrar vuelos según término de búsqueda
  const filteredFlights = flights.filter(flight => 
    flight.flight_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.airline_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.departure_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.arrival_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Cerrar sesión
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
      {/* Sidebar fijo */}
      <DashboardSidebar />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        {/* Header */}
        <DashboardHeader title="Gestión de Vuelos" onLogout={handleLogout} />
        
        {/* Main content con scroll */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Vuelos</h1>
              
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => {
                    setEditingFlight(null);
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="mr-2 h-4 w-4" /> Añadir Vuelo
                </button>
              </div>
            </div>
            
            {/* Contenedor principal de la tabla de vuelos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                {/* Barra de búsqueda y filtros */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
                  <div className="w-full lg:w-1/3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar vuelos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiFilter className="mr-2 h-4 w-4" />
                      {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                  </div>
                </div>

                {/* Filtros avanzados (condicional) */}
                {showFilters && (
                  <FlightFilters
                    filters={filters}
                    setFilters={setFilters}
                    uniqueAirlines={uniqueAirlines}
                    uniqueOrigins={uniqueOrigins}
                    uniqueDestinations={uniqueDestinations}
                    clearFilters={clearFilters}
                  />
                )}

                {/* Tabla de vuelos */}
                <FlightTable
                  flights={filteredFlights}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSchedule={(flight) => {
                    setSelectedFlight(flight);
                    setShowScheduleModal(true);
                  }}
                />

                {/* Paginación */}
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalFlights}
                  itemsPerPage={pageSize}
                  shownItems={filteredFlights.length}
                  onPreviousPage={goToPrevPage}
                  onNextPage={goToNextPage}
                />
              </div>
            </div>

            {/* Contenedores adicionales */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Frecuencia de Vuelos</h3>
                  <FlightFrequencyTable />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Programación de Vuelos</h3>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FiCalendar className="mr-2 h-4 w-4" />
                      Programar Vuelos
                    </button>
                  </div>
                  <ImportFlights />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal para generar programación de vuelos */}
      {showScheduleModal && selectedFlight && (
        <FlightScheduleGenerator
          flight={selectedFlight}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedFlight(null);
          }}
          onComplete={() => {
            setCurrentPage(1);
            setPageHistory([]);
            setLastVisible(null);
            setFirstVisible(null);
          }}
        />
      )}
    </div>
  );
}