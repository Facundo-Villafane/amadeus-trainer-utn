// src/pages/admin/Flights.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
  query, orderBy, limit, startAfter, where, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ImportFlights from '../../components/admin/ImportFlights';
import FlightScheduleGenerator from '../../components/admin/FlightScheduleGenerator';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiAirplay, 
  FiFilter, FiChevronLeft, FiChevronRight, FiCalendar 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminFlights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFlights, setTotalFlights] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    airline_code: '',
    departure_airport_code: '',
    arrival_airport_code: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueAirlines, setUniqueAirlines] = useState([]);
  const [uniqueOrigins, setUniqueOrigins] = useState([]);
  const [uniqueDestinations, setUniqueDestinations] = useState([]);
  
  // Estado del formulario para añadir/editar vuelo
  const [formData, setFormData] = useState({
    flight_number: '',
    airline_code: '',
    airline_name: '',
    departure_airport_code: '',
    departure_airport: '',
    departure_city: '',
    departure_country: '',
    departure_terminal: '',
    departure_date: '',
    departure_time: '',
    arrival_airport_code: '',
    arrival_airport: '',
    arrival_city: '',
    arrival_country: '',
    arrival_terminal: '',
    arrival_date: '',
    arrival_time: '',
    duration_hours: 0,
    aircraft_type: '',
    equipment_code: '',
    status: 'Scheduled',
    flight_distance: 0,
    stops: 0
  });
  
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  // Obtener valores únicos para filtros
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        // Consulta para obtener todas las aerolíneas
        const airlinesQuery = query(
          collection(db, 'flights'),
          orderBy('airline_code')
        );
        const airlinesSnapshot = await getDocs(airlinesQuery);
        
        // Extraer códigos únicos de aerolíneas
        const airlines = new Set();
        airlinesSnapshot.docs.forEach(doc => {
          const flight = doc.data();
          if (flight.airline_code) {
            airlines.add(flight.airline_code);
          }
        });
        setUniqueAirlines(Array.from(airlines).sort());
        
        // Consulta para obtener aeropuertos de origen y destino
        const airportsQuery = query(collection(db, 'flights'));
        const airportsSnapshot = await getDocs(airportsQuery);
        
        // Extraer códigos únicos de aeropuertos
        const origins = new Set();
        const destinations = new Set();
        
        airportsSnapshot.docs.forEach(doc => {
          const flight = doc.data();
          if (flight.departure_airport_code) {
            origins.add(flight.departure_airport_code);
          }
          if (flight.arrival_airport_code) {
            destinations.add(flight.arrival_airport_code);
          }
        });
        
        setUniqueOrigins(Array.from(origins).sort());
        setUniqueDestinations(Array.from(destinations).sort());
        
      } catch (error) {
        console.error('Error al obtener opciones de filtro:', error);
      }
    }
    
    fetchFilterOptions();
  }, []);
  
  // Contar el total de vuelos (para paginación)
  useEffect(() => {
    async function countTotalFlights() {
      try {
        let flightsQuery = query(collection(db, 'flights'));
        
        // Aplicar filtros a la consulta
        if (filters.airline_code) {
          flightsQuery = query(
            flightsQuery, 
            where('airline_code', '==', filters.airline_code)
          );
        }
        
        if (filters.departure_airport_code) {
          flightsQuery = query(
            flightsQuery, 
            where('departure_airport_code', '==', filters.departure_airport_code)
          );
        }
        
        if (filters.arrival_airport_code) {
          flightsQuery = query(
            flightsQuery, 
            where('arrival_airport_code', '==', filters.arrival_airport_code)
          );
        }
        
        const snapshot = await getDocs(flightsQuery);
        setTotalFlights(snapshot.size);
      } catch (error) {
        console.error('Error al contar vuelos:', error);
      }
    }
    
    countTotalFlights();
  }, [filters]);
  
  // Cargar vuelos con paginación y filtros
  useEffect(() => {
    async function fetchFlights() {
      try {
        setLoading(true);
        
        // Construir la consulta base
        let flightsQuery;
        
        // Si es la primera página, consultar desde el principio
        if (currentPage === 1 || !lastVisible) {
          flightsQuery = query(
            collection(db, 'flights'),
            orderBy('departure_date', 'desc'),
            orderBy('departure_time', 'desc')
          );
        } else {
          // Si no es la primera página, comenzar después del último documento visible
          flightsQuery = query(
            collection(db, 'flights'),
            orderBy('departure_date', 'desc'),
            orderBy('departure_time', 'desc'),
            startAfter(lastVisible)
          );
        }
        
        // Aplicar filtros
        if (filters.airline_code) {
          flightsQuery = query(
            collection(db, 'flights'),
            where('airline_code', '==', filters.airline_code),
            orderBy('departure_date', 'desc'),
            orderBy('departure_time', 'desc')
          );
        }
        
        if (filters.departure_airport_code) {
          flightsQuery = query(
            collection(db, 'flights'),
            where('departure_airport_code', '==', filters.departure_airport_code),
            orderBy('departure_date', 'desc'),
            orderBy('departure_time', 'desc')
          );
        }
        
        if (filters.arrival_airport_code) {
          flightsQuery = query(
            collection(db, 'flights'),
            where('arrival_airport_code', '==', filters.arrival_airport_code),
            orderBy('departure_date', 'desc'),
            orderBy('departure_time', 'desc')
          );
        }
        
        // Aplicar límite por página
        flightsQuery = query(flightsQuery, limit(pageSize));
        
        // Ejecutar la consulta
        const querySnapshot = await getDocs(flightsQuery);
        
        // Si no hay resultados, mostrar mensaje
        if (querySnapshot.empty) {
          setFlights([]);
          setLastVisible(null);
          setFirstVisible(null);
          setLoading(false);
          return;
        }
        
        // Extraer datos y actualizar estado
        const flightsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFlights(flightsData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
      } catch (error) {
        console.error('Error al cargar vuelos:', error);
        toast.error('Error al cargar los vuelos');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFlights();
  }, [currentPage, pageSize, filters]);
  
  // Navegar a la página siguiente
  const goToNextPage = () => {
    // Guardar el estado actual en el historial de páginas
    setPageHistory(prev => [...prev, { page: currentPage, firstVisible, lastVisible }]);
    setCurrentPage(prev => prev + 1);
  };
  
  // Navegar a la página anterior
  const goToPrevPage = () => {
    if (currentPage > 1) {
      // Obtener el estado de la página anterior desde el historial
      const prevPageInfo = pageHistory[pageHistory.length - 1];
      setLastVisible(prevPageInfo.lastVisible);
      setFirstVisible(prevPageInfo.firstVisible);
      
      // Actualizar el historial de páginas
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Resetear la paginación al cambiar filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setPageHistory([]);
    setLastVisible(null);
    setFirstVisible(null);
  };
  
  // Resetear todos los filtros
  const clearFilters = () => {
    setFilters({
      airline_code: '',
      departure_airport_code: '',
      arrival_airport_code: ''
    });
    setCurrentPage(1);
    setPageHistory([]);
    setLastVisible(null);
    setFirstVisible(null);
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convertir a número si es un campo numérico
    const finalValue = type === 'number' ? parseFloat(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };
  
  // Añadir o actualizar vuelo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingFlight) {
        // Actualizar vuelo existente
        await updateDoc(doc(db, 'flights', editingFlight.id), {
          ...formData,
          updated_at: serverTimestamp()
        });
        
        toast.success('Vuelo actualizado correctamente');
      } else {
        // Crear nuevo vuelo
        await addDoc(collection(db, 'flights'), {
          ...formData,
          created_at: serverTimestamp()
        });
        
        toast.success('Vuelo añadido correctamente');
      }
      
      // Cerrar modal y limpiar formulario
      setShowAddModal(false);
      setEditingFlight(null);
      setFormData({
        flight_number: '',
        airline_code: '',
        airline_name: '',
        departure_airport_code: '',
        departure_airport: '',
        departure_city: '',
        departure_country: '',
        departure_terminal: '',
        departure_date: '',
        departure_time: '',
        arrival_airport_code: '',
        arrival_airport: '',
        arrival_city: '',
        arrival_country: '',
        arrival_terminal: '',
        arrival_date: '',
        arrival_time: '',
        duration_hours: 0,
        aircraft_type: '',
        equipment_code: '',
        status: 'Scheduled',
        flight_distance: 0,
        stops: 0
      });
      
      // Recargar la primera página
      setCurrentPage(1);
      setPageHistory([]);
      setLastVisible(null);
      setFirstVisible(null);
      
    } catch (error) {
      console.error('Error al guardar vuelo:', error);
      toast.error('Error al guardar el vuelo');
    }
  };
  
  // Eliminar vuelo
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este vuelo?')) return;
    
    try {
      await deleteDoc(doc(db, 'flights', id));
      
      // Actualizar lista de vuelos
      setFlights(prev => prev.filter(flight => flight.id !== id));
      
      toast.success('Vuelo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar vuelo:', error);
      toast.error('Error al eliminar el vuelo');
    }
  };
  
  // Editar vuelo
  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setFormData({
      flight_number: flight.flight_number || '',
      airline_code: flight.airline_code || '',
      airline_name: flight.airline_name || '',
      departure_airport_code: flight.departure_airport_code || '',
      departure_airport: flight.departure_airport || '',
      departure_city: flight.departure_city || '',
      departure_country: flight.departure_country || '',
      departure_terminal: flight.departure_terminal || '',
      departure_date: flight.departure_date || '',
      departure_time: flight.departure_time || '',
      arrival_airport_code: flight.arrival_airport_code || '',
      arrival_airport: flight.arrival_airport || '',
      arrival_city: flight.arrival_city || '',
      arrival_country: flight.arrival_country || '',
      arrival_terminal: flight.arrival_terminal || '',
      arrival_date: flight.arrival_date || '',
      arrival_time: flight.arrival_time || '',
      duration_hours: flight.duration_hours || 0,
      aircraft_type: flight.aircraft_type || '',
      equipment_code: flight.equipment_code || '',
      status: flight.status || 'Scheduled',
      flight_distance: flight.flight_distance || 0,
      stops: flight.stops || 0
    });
    setShowAddModal(true);
  };
  
  // Filtrar vuelos según el término de búsqueda
  const filteredFlights = flights.filter(flight => 
    flight.flight_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.airline_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.departure_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.arrival_city?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Gestión de Vuelos</h1>
              <button
                onClick={() => {
                  setEditingFlight(null);
                  setFormData({
                    flight_number: '',
                    airline_code: '',
                    airline_name: '',
                    departure_airport_code: '',
                    departure_airport: '',
                    departure_city: '',
                    departure_country: '',
                    departure_terminal: '',
                    departure_date: '',
                    departure_time: '',
                    arrival_airport_code: '',
                    arrival_airport: '',
                    arrival_city: '',
                    arrival_country: '',
                    arrival_terminal: '',
                    arrival_date: '',
                    arrival_time: '',
                    duration_hours: 0,
                    aircraft_type: '',
                    equipment_code: '',
                    status: 'Scheduled',
                    flight_distance: 0,
                    stops: 0
                  });
                  setShowAddModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Añadir Vuelo
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Componente de importación */}
              <ImportFlights onImportComplete={() => {
                setCurrentPage(1);
                setPageHistory([]);
                setLastVisible(null);
                setFirstVisible(null);
              }} />
              
              {/* Información y estadísticas */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Estadísticas de Vuelos</h3>
                  <div className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-2">
                    <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Vuelos</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalFlights}</dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Aerolíneas</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {uniqueAirlines.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="w-full max-w-lg">
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                      placeholder="Buscar vuelos por número, aerolínea o ciudad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FiFilter className="-ml-1 mr-2 h-5 w-5" />
                  Filtros {showFilters ? 'aplicados' : ''}
                </button>
              </div>
              
              {/* Filtros avanzados */}
              {showFilters && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="airline_code" className="block text-sm font-medium text-gray-700">
                      Aerolínea
                    </label>
                    <select
                      id="airline_code"
                      name="airline_code"
                      value={filters.airline_code}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todas las aerolíneas</option>
                      {uniqueAirlines.map(airline => (
                        <option key={airline} value={airline}>
                          {airline}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="departure_airport_code" className="block text-sm font-medium text-gray-700">
                      Aeropuerto de Origen
                    </label>
                    <select
                      id="departure_airport_code"
                      name="departure_airport_code"
                      value={filters.departure_airport_code}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todos los orígenes</option>
                      {uniqueOrigins.map(origin => (
                        <option key={origin} value={origin}>
                          {origin}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="arrival_airport_code" className="block text-sm font-medium text-gray-700">
                      Aeropuerto de Destino
                    </label>
                    <select
                      id="arrival_airport_code"
                      name="arrival_airport_code"
                      value={filters.arrival_airport_code}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todos los destinos</option>
                      {uniqueDestinations.map(destination => (
                        <option key={destination} value={destination}>
                          {destination}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Flights Table */}
            <div className="mt-4 bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vuelo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalles
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Cargando vuelos...
                        </td>
                      </tr>
                    ) : filteredFlights.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron vuelos
                        </td>
                      </tr>
                    ) : (
                      filteredFlights.map((flight, index) => (
                        <tr key={`flight-${flight.id}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-amadeus-light text-amadeus-primary">
                                <FiAirplay className="h-5 w-5" />
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
                              {flight.departure_city} ({flight.departure_airport_code}) → {flight.arrival_city} ({flight.arrival_airport_code})
                            </div>
                            <div className="text-xs text-gray-500">
                              {flight.stops === 0 ? 'Directo' : `${flight.stops} escala(s)`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {flight.departure_date} {flight.departure_time}
                            </div>
                            <div className="text-xs text-gray-500">
                              Duración: {flight.duration_hours}h
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                flight.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                flight.status === 'On Time' ? 'bg-green-100 text-green-800' :
                                flight.status === 'Delayed' ? 'bg-yellow-100 text-yellow-800' :
                                flight.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {flight.status}
                              </span>
                              <div className="text-xs text-gray-500">
                                {flight.equipment_code && (
                                  <div>Equipo: {flight.equipment_code}</div>
                                )}
                                {flight.aircraft_type && (
                                  <div>Aeronave: {flight.aircraft_type}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleEdit(flight)}
                                className="text-amadeus-primary hover:text-amadeus-secondary mr-3"
                                title="Editar vuelo"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFlight(flight);
                                  setShowScheduleModal(true);
                                }}
                                className="text-amber-500 hover:text-amber-600 mr-3"
                                title="Generar programación"
                              >
                                <FiCalendar className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(flight.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Eliminar vuelo"
                              >
                                <FiTrash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={flights.length < pageSize}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      flights.length < pageSize
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{flights.length}</span> de <span className="font-medium">{totalFlights}</span> vuelos
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Página {currentPage}
                      </span>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={flights.length < pageSize}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          flights.length < pageSize
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal para añadir/editar vuelo */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {editingFlight ? 'Editar Vuelo' : 'Añadir Vuelo'}
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700">
                            Número de Vuelo
                          </label>
                          <input
                            type="text"
                            name="flight_number"
                            id="flight_number"
                            value={formData.flight_number}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="airline_code" className="block text-sm font-medium text-gray-700">
                            Código de Aerolínea
                          </label>
                          <input
                            type="text"
                            name="airline_code"
                            id="airline_code"
                            value={formData.airline_code}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label htmlFor="airline_name" className="block text-sm font-medium text-gray-700">
                            Nombre de Aerolínea
                          </label>
                          <input
                            type="text"
                            name="airline_name"
                            id="airline_name"
                            value={formData.airline_name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        {/* Origen */}
                        <div>
                          <label htmlFor="departure_airport_code" className="block text-sm font-medium text-gray-700">
                            Código Aeropuerto Origen
                          </label>
                          <input
                            type="text"
                            name="departure_airport_code"
                            id="departure_airport_code"
                            value={formData.departure_airport_code}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="departure_city" className="block text-sm font-medium text-gray-700">
                            Ciudad Origen
                          </label>
                          <input
                            type="text"
                            name="departure_city"
                            id="departure_city"
                            value={formData.departure_city}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        {/* Destino */}
                        <div>
                          <label htmlFor="arrival_airport_code" className="block text-sm font-medium text-gray-700">
                            Código Aeropuerto Destino
                          </label>
                          <input
                            type="text"
                            name="arrival_airport_code"
                            id="arrival_airport_code"
                            value={formData.arrival_airport_code}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="arrival_city" className="block text-sm font-medium text-gray-700">
                            Ciudad Destino
                          </label>
                          <input
                            type="text"
                            name="arrival_city"
                            id="arrival_city"
                            value={formData.arrival_city}
                            onChange={handleInputChange}
                            required
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        {/* Fechas y horarios */}
                        <div>
                          <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700">
                            Fecha Salida (D/M/YYYY)
                          </label>
                          <input
                            type="text"
                            name="departure_date"
                            id="departure_date"
                            value={formData.departure_date}
                            onChange={handleInputChange}
                            required
                            placeholder="15/4/2025"
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700">
                            Hora Salida (HH:MM)
                          </label>
                          <input
                            type="text"
                            name="departure_time"
                            id="departure_time"
                            value={formData.departure_time}
                            onChange={handleInputChange}
                            required
                            placeholder="14:30"
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700">
                            Duración (horas)
                          </label>
                          <input
                            type="number"
                            name="duration_hours"
                            id="duration_hours"
                            value={formData.duration_hours}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Estado
                          </label>
                          <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                          >
                            <option value="Scheduled">Programado</option>
                            <option value="On Time">A tiempo</option>
                            <option value="Delayed">Retrasado</option>
                            <option value="Cancelled">Cancelado</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="aircraft_type" className="block text-sm font-medium text-gray-700">
                            Tipo de Aeronave
                          </label>
                          <select
                            id="aircraft_type"
                            name="aircraft_type"
                            value={formData.aircraft_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="Boeing 737-800">Boeing 737-800</option>
                            <option value="Boeing 787-9">Boeing 787-9</option>
                            <option value="Airbus A320">Airbus A320</option>
                            <option value="Airbus A330">Airbus A330</option>
                            <option value="Airbus A350">Airbus A350</option>
                            <option value="Embraer E190">Embraer E190</option>
                            <option value="Embraer E195">Embraer E195</option>
                            <option value="Boeing 777-300ER">Boeing 777-300ER</option>
                            <option value="Boeing 767-300">Boeing 767-300</option>
                            <option value="Airbus A319">Airbus A319</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="equipment_code" className="block text-sm font-medium text-gray-700">
                            Código de Equipo
                          </label>
                          <select
                            id="equipment_code"
                            name="equipment_code"
                            value={formData.equipment_code}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                          >
                            <option value="">Seleccionar código</option>
                            <option value="738">738 - Boeing 737-800</option>
                            <option value="788">788 - Boeing 787-8</option>
                            <option value="789">789 - Boeing 787-9</option>
                            <option value="320">320 - Airbus A320</option>
                            <option value="321">321 - Airbus A321</option>
                            <option value="330">330 - Airbus A330</option>
                            <option value="350">350 - Airbus A350</option>
                            <option value="77W">77W - Boeing 777-300ER</option>
                            <option value="763">763 - Boeing 767-300</option>
                            <option value="E90">E90 - Embraer E190</option>
                            <option value="E95">E95 - Embraer E195</option>
                            <option value="319">319 - Airbus A319</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amadeus-primary text-base font-medium text-white hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingFlight ? 'Actualizar' : 'Añadir'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para generar programación de vuelos */}
      {showScheduleModal && selectedFlight && (
        <FlightScheduleGenerator
          flight={selectedFlight}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedFlight(null);
          }}
          onComplete={() => {
            // Recargar la primera página para ver los cambios
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