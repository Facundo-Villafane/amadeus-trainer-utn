// src/components/student/FlightExplorer.jsx
import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FiSearch, FiCalendar, FiClock, FiMap, 
  FiFilter, FiChevronRight, FiInfo 
} from 'react-icons/fi';
import { SlPlane } from 'react-icons/sl';

export default function FlightExplorer() {
    // Estados principales
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [totalFlights, setTotalFlights] = useState(0);
    
    // Estado para paginación y límites de búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [flightsPerPage] = useState(20);  // Aumentado de 10 a 20
    const [maxResultsLimit, setMaxResultsLimit] = useState(1000);  // Aumentado de 500 a 1000
    
    // Obtener la fecha actual en formato YYYY-MM-DD para los filtros de fecha
    const today = new Date().toISOString().split('T')[0];
    // Crear un objeto Date para operaciones con fechas
    const todayDate = new Date();
    
    // Estados para filtros
    const [filters, setFilters] = useState({
      origin: '',
      destination: '',
      airline: '',
      dateFrom: today, // Inicializar con la fecha actual
      dateTo: '',
      hasStops: 'all', // 'all', 'direct', 'connections'
      sortBy: 'departure_date' // Campo por el cual ordenar resultados
    });
    
    // Para autocompletado
    const [origins, setOrigins] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [airlines, setAirlines] = useState([]);
    
    // Calcular índices de paginación
    const indexOfLastFlight = currentPage * flightsPerPage;
    const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
    const currentFlights = flights.slice(indexOfFirstFlight, indexOfLastFlight);
    const totalPages = Math.ceil(flights.length / flightsPerPage);
    
    // Cargar los vuelos al iniciar
    useEffect(() => {
      fetchFlights();
      fetchFilterOptions();
    }, []);
    
    // Cargar vuelos cuando cambian los filtros
    useEffect(() => {
      fetchFlights();
    }, [filters]);
    
    // Función para cargar las opciones de filtros
    const fetchFilterOptions = async () => {
      try {
        // Obtener aeropuertos para origen y destino
        const airportsRef = collection(db, 'airports');
        const airportsSnapshot = await getDocs(airportsRef);
        
        const uniqueOrigins = new Set();
        const uniqueDestinations = new Set();
        
        airportsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.code) {
            uniqueOrigins.add({
              code: data.code,
              name: data.name || data.code,
              city: data.city || '',
              country_code: data.country_code || ''
            });
            uniqueDestinations.add({
              code: data.code,
              name: data.name || data.code,
              city: data.city || '',
              country_code: data.country_code || ''
            });
          }
        });
        
        setOrigins(Array.from(uniqueOrigins));
        setDestinations(Array.from(uniqueDestinations));
        
        // Obtener aerolíneas
        const airlinesRef = collection(db, 'airlines');
        const airlinesSnapshot = await getDocs(airlinesRef);
        
        const uniqueAirlines = new Set();
        
        airlinesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.code) {
            uniqueAirlines.add({
              code: data.code,
              name: data.name || data.code
            });
          }
        });
        
        setAirlines(Array.from(uniqueAirlines));
        
      } catch (error) {
        console.error('Error al cargar opciones de filtros:', error);
      }
    };
    
    // Función para cargar vuelos
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setCurrentPage(1); // Restablecer a primera página cuando cambian los filtros
        
        // Verificar si hay filtros aplicados
        const hasFilters = 
          filters.origin || 
          filters.destination || 
          filters.airline || 
          filters.dateFrom || 
          filters.dateTo || 
          filters.hasStops !== 'all';
        
        
        
        let flightsQuery = query(collection(db, 'flights'));

        
        
        // Aplicar filtros
        if (filters.origin) {
          flightsQuery = query(flightsQuery, where('departure_airport_code', '==', filters.origin));
        }
        
        if (filters.destination) {
          flightsQuery = query(flightsQuery, where('arrival_airport_code', '==', filters.destination));
        }
        
        if (filters.airline) {
          flightsQuery = query(flightsQuery, where('airline_code', '==', filters.airline));
        }
        
        // Aplicar filtro de fecha mínima por defecto (si no se ha especificado)
        // Formato de fecha en Firestore: DD/MM/YYYY
        const todayFirestore = new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '/');
        
        // Si no hay filtros específicos de fecha, filtrar por fecha >= hoy
        if (!filters.dateFrom && !filters.dateTo) {
          flightsQuery = query(flightsQuery, where('departure_date', '>=', todayFirestore));
        }
        
        // No se puede filtrar por fecha y otros campos al mismo tiempo en Firestore sin índices compuestos
        // Haremos el filtrado de fechas en el cliente
        
        if (filters.hasStops !== 'all') {
          const hasConnections = filters.hasStops === 'connections';
          flightsQuery = query(flightsQuery, where('stops', hasConnections ? '>' : '==', 0));
        }
        
        // Ordenar por el campo seleccionado
        flightsQuery = query(flightsQuery, orderBy(filters.sortBy, 'asc'));
        
        // Limitar a mayor cantidad de resultados para rendimiento (ajustable según necesidades)
        flightsQuery = query(flightsQuery, limit(maxResultsLimit));
        
        const querySnapshot = await getDocs(flightsQuery);
        
        // Filtrar por fecha en el cliente si es necesario
        let filteredFlights = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Aplicar el filtro de "solo desde hoy"
        filteredFlights = filterFlightsFromToday(filteredFlights);
        
        // Filtrar por fecha
        if (filters.dateFrom || filters.dateTo) {
          filteredFlights = filteredFlights.filter(flight => {
            // Convertir fecha del vuelo (formato 'DD/MM/YYYY') a objeto Date
            const [day, month, year] = flight.departure_date.split('/');
            const flightDate = new Date(`${year}-${month}-${day}`);
            
            // Comprobar filtro dateFrom
            if (filters.dateFrom) {
              const fromDate = new Date(filters.dateFrom);
              if (flightDate < fromDate) return false;
            }
            
            // Comprobar filtro dateTo
            if (filters.dateTo) {
              const toDate = new Date(filters.dateTo);
              if (flightDate > toDate) return false;
            }
            
            return true;
          });
        }
        
        // Actualizar variables para estadísticas
        setTotalFlights(filteredFlights.length);
        setFlights(filteredFlights);
        
        // Informar si se alcanzó el límite
        if (querySnapshot.docs.length >= maxResultsLimit) {
          console.log(`Se alcanzó el límite máximo de ${maxResultsLimit} resultados. Utiliza filtros más específicos para ver más vuelos.`);
          
        }
      } catch (error) {
        console.error('Error al cargar vuelos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Manejar cambio en los filtros
    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    // Formatear duración (horas a horas:minutos)
    const formatDuration = (hours) => {
      const totalMinutes = Math.round(hours * 60);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    };
    
    // Formatear fecha "DD/MM/YYYY" a "DD MMM" (ejemplo: 15 Nov)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const [day, month, year] = dateStr.split('/');
      return `${day} ${months[parseInt(month, 10) - 1]}`;
    };
    
    // Cambiar de página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Obtener días de operación (lunes a domingo) basado en el campo days_of_operation
    const getOperationDays = (daysString) => {
      if (!daysString) return 'No disponible';
      
      // Si el formato es "1234567", lo convierte a "Lun, Mar, Mié, Jue, Vie, Sáb, Dom"
      if (/^[1-7]+$/.test(daysString)) {
        const dayMap = {
          '1': 'Lun', '2': 'Mar', '3': 'Mié', 
          '4': 'Jue', '5': 'Vie', '6': 'Sáb', '7': 'Dom'
        };
        
        return daysString.split('').map(d => dayMap[d]).join(', ');
      }
      
      // Si el formato es "LMXJVSD" o similar
      if (/^[LMXJVSD]+$/i.test(daysString)) {
        const dayMap = {
          'L': 'Lun', 'M': 'Mar', 'X': 'Mié', 
          'J': 'Jue', 'V': 'Vie', 'S': 'Sáb', 'D': 'Dom'
        };
        
        return daysString.toUpperCase().split('').map(d => dayMap[d]).join(', ');
      }
      
      // Si es "D" (diario)
      if (daysString === 'D') return 'Diario';
      
      // En cualquier otro caso, devolver tal cual
      return daysString;
    };
    
    // Resetear filtros
    const resetFilters = () => {
      setFilters({
        origin: '',
        destination: '',
        airline: '',
        dateFrom: today, // Mantener la fecha actual como mínimo
        dateTo: '',
        hasStops: 'all',
        sortBy: 'departure_date'
      });
      setCurrentPage(1); // Volver a la primera página cuando se resetean los filtros
    };

    // Nueva función para determinar si un vuelo opera hoy
    const operatesToday = (flight) => {
        // Si no hay información de días de operación, no podemos determinar
        if (!flight.days_of_operation) return false;
        
        // Si es "D" (diario), entonces opera todos los días
        if (flight.days_of_operation === 'D') return true;
        
        // Obtener el día de la semana actual (0=Domingo, 1=Lunes, etc.)
        const currentDay = todayDate.getDay();
        
        // Convertir al formato de días usado en la aplicación (1=Lunes, 7=Domingo)
        const dayIndex = currentDay === 0 ? 7 : currentDay;
        
        // Si el formato es "1234567" (numérico)
        if (/^[1-7]+$/.test(flight.days_of_operation)) {
            return flight.days_of_operation.includes(dayIndex.toString());
        }
        
        // Si el formato es "LMXJVSD"
        if (/^[LMXJVSD]+$/i.test(flight.days_of_operation)) {
            const dayMap = {
                'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7
            };
            
            // Obtener los índices de los días de operación
            const operationDays = flight.days_of_operation.toUpperCase().split('')
                .map(d => dayMap[d]);
                
            return operationDays.includes(dayIndex);
        }
        
        return false;
    };
    
    // Nueva función para calcular la próxima fecha de operación
    const getNextOperationDate = (flight) => {
        if (!flight.days_of_operation || flight.days_of_operation === 'D') {
            // Si opera diariamente o no hay información, mostrar "Hoy"
            return 'Hoy';
        }
        
        // Obtener los días de operación
        let operationDays = [];
        
        // Si el formato es "1234567" (numérico)
        if (/^[1-7]+$/.test(flight.days_of_operation)) {
            operationDays = flight.days_of_operation.split('').map(Number);
        } 
        // Si el formato es "LMXJVSD"
        else if (/^[LMXJVSD]+$/i.test(flight.days_of_operation)) {
            const dayMap = {
                'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7
            };
            
            operationDays = flight.days_of_operation.toUpperCase().split('')
                .map(d => dayMap[d]);
        } else {
            return 'Próximo vuelo';
        }
        
        // Día actual (1-7, donde 1 es lunes)
        const currentDay = todayDate.getDay() === 0 ? 7 : todayDate.getDay();
        
        // Encontrar el próximo día de operación
        let nextDay = null;
        let daysToAdd = 0;
        
        // Buscar el próximo día de operación
        for (let i = 0; i < 7; i++) {
            const checkDay = ((currentDay + i - 1) % 7) + 1; // Asegurarse de que esté en rango 1-7
            if (operationDays.includes(checkDay)) {
                nextDay = checkDay;
                daysToAdd = i;
                break;
            }
        }
        
        if (nextDay === null) {
            return 'No programado';
        }
        
        // Si es hoy
        if (daysToAdd === 0) {
            return 'Hoy';
        }
        
        // Si es mañana
        if (daysToAdd === 1) {
            return 'Mañana';
        }
        
        // Para otros días, mostrar el día de la semana
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return dayNames[nextDay - 1];
    };
    
    // Modificar el filtrado de los vuelos para incluir solo los disponibles desde hoy
    const filterFlightsFromToday = (flights) => {
        return flights.filter(flight => {
            // Si tiene fecha específica, verificar que sea hoy o posterior
            if (flight.departure_date) {
                const [day, month, year] = flight.departure_date.split('/').map(part => parseInt(part, 10));
                const flightDate = new Date(year, month - 1, day); // Meses en JS son 0-indexed
                
                if (flightDate < todayDate) {
                    return false; // Excluir vuelos antiguos
                }
            }
            
            // Si tiene días de operación, verificar que opere en algún día desde hoy
            if (flight.days_of_operation) {
                // Si es diario, siempre incluirlo
                if (flight.days_of_operation === 'D') {
                    return true;
                }
                
                // Si tiene un rango de validez, verificar que el rango incluya fechas desde hoy
                if (flight.valid_from && flight.valid_to) {
                    const [fromDay, fromMonth, fromYear] = flight.valid_from.split('/').map(part => parseInt(part, 10));
                    const validFromDate = new Date(fromYear, fromMonth - 1, fromDay);
                    
                    const [toDay, toMonth, toYear] = flight.valid_to.split('/').map(part => parseInt(part, 10));
                    const validToDate = new Date(toYear, toMonth - 1, toDay);
                    
                    // Si todo el rango es anterior a hoy, excluir
                    if (validToDate < todayDate) {
                        return false;
                    }
                }
                
                // Incluir el vuelo si tiene algún día de operación válido
                return true;
            }
            
            // Si no hay suficiente información, incluir el vuelo de todos modos
            return true;
        });
    };
    
    // En la parte donde cargas los vuelos, aplica el filtrado
    useEffect(() => {
        fetchFlights();
    }, [filters]);
    

    return (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <SlPlane className="mr-2 text-amadeus-primary" />
                Explorador de Vuelos
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{totalFlights} vuelos encontrados</span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full"
                >
                  <FiFilter className={`${showFilters ? 'text-amadeus-primary' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>
            
            {/* Panel de filtros */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                      Origen
                    </label>
                    <select
                      id="origin"
                      name="origin"
                      value={filters.origin}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todos los orígenes</option>
                      {origins.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.code} - {airport.city || airport.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                      Destino
                    </label>
                    <select
                      id="destination"
                      name="destination"
                      value={filters.destination}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todos los destinos</option>
                      {destinations.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.code} - {airport.city || airport.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="airline" className="block text-sm font-medium text-gray-700">
                      Aerolínea
                    </label>
                    <select
                      id="airline"
                      name="airline"
                      value={filters.airline}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="">Todas las aerolíneas</option>
                      {airlines.map((airline) => (
                        <option key={airline.code} value={airline.code}>
                          {airline.code} - {airline.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                      Fecha desde
                    </label>
                    <input
                      type="date"
                      id="dateFrom"
                      name="dateFrom"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
                      Fecha hasta
                    </label>
                    <input
                      type="date"
                      id="dateTo"
                      name="dateTo"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="hasStops" className="block text-sm font-medium text-gray-700">
                      Escalas
                    </label>
                    <select
                      id="hasStops"
                      name="hasStops"
                      value={filters.hasStops}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                    >
                      <option value="all">Todos los vuelos</option>
                      <option value="direct">Solo vuelos directos</option>
                      <option value="connections">Solo vuelos con escalas</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                    Ordenar por
                  </label>
                  <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="mt-1 w-full sm:w-1/3 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                  >
                    <option value="departure_date">Fecha de salida</option>
                    <option value="flight_number">Número de vuelo</option>
                    <option value="airline_code">Aerolínea</option>
                    <option value="departure_time">Hora de salida</option>
                  </select>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
            
            {/* Tabla de vuelos */}
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amadeus-primary"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando vuelos...</p>
              </div>
            ) : flights.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <FiInfo className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron vuelos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Prueba a cambiar los filtros o consulta más tarde.
                </p>
              </div>
            ) : (
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
                        Horario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operación
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clases
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentFlights.map((flight) => (
                      <tr key={`${flight.id}-${flight.flight_number}-${flight.departure_date}`} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                              <span className="text-sm font-medium text-gray-800">{flight.airline_code}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{flight.airline_code} {flight.flight_number}</div>
                              <div className="text-sm text-gray-500">{flight.equipment_code || flight.aircraft_type || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{flight.departure_airport_code}</span>
                            <FiChevronRight className="mx-1 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{flight.arrival_airport_code}</span>
                          </div>
                          {flight.stops > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              {flight.stops} {flight.stops === 1 ? 'escala' : 'escalas'}
  </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{flight.departure_time} / {flight.arrival_time}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatDuration(flight.duration_hours)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(flight.departure_date)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                              {operatesToday(flight) ? (
                                  <span className="text-green-600 font-medium">Opera hoy</span>
                              ) : (
                                  <span title="Próximo vuelo">
                                      {getNextOperationDate(flight)}
                                  </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {flight.class_availability && Object.entries(flight.class_availability)
                              .filter(([_, seats]) => seats > 0)
                              .map(([classCode, seats]) => (
                                <span 
                                  key={`${classCode}-${seats}`}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                  title={`${seats} asientos disponibles`}
                                >
                                  {classCode}
                                </span>
                              ))}
                            {(!flight.class_availability || Object.entries(flight.class_availability).length === 0) && (
                              <span className="text-xs text-gray-500">Sin información</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Paginación */}
                {!loading && flights.length > 0 && (
                  <div className="flex justify-between items-center mt-4 px-2">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstFlight + 1}</span> - 
                      <span className="font-medium">{Math.min(indexOfLastFlight, flights.length)}</span> de 
                      <span className="font-medium"> {flights.length}</span> vuelos
                      {flights.length === maxResultsLimit && (
                        <span className="ml-1 text-amber-500 font-medium">
                          (límite máximo alcanzado)
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 border rounded-md ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Anterior
                      </button>
                      
                      {/* Mostrar números de página */}
                      <div className="hidden sm:flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Determinar qué páginas mostrar para no exceder el límite
                          let pageNum;
                          if (totalPages <= 5) {
                            // Si hay 5 o menos páginas, mostrar todas
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Si estamos en las primeras páginas, mostrar 1-5
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // Si estamos en las últimas páginas, mostrar las últimas 5
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Mostrar 2 páginas antes y 2 después de la actual
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => paginate(pageNum)}
                              className={`px-3 py-1 border rounded-md ${
                                currentPage === pageNum 
                                  ? 'bg-amadeus-primary text-white' 
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 border rounded-md ${
                          currentPage === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Instrucciones */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              
              
              {/* Nota sobre límite de resultados */}
              {flights.length >= maxResultsLimit && (
                <div className="mt-3 bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center font-medium">
                    <FiInfo className="mr-2 flex-shrink-0" />
                    Estás viendo el límite máximo de {maxResultsLimit} resultados. Hay más vuelos disponibles en la base de datos que no se están mostrando.
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Para ver más vuelos, utiliza los filtros para acotar tu búsqueda (origen, destino, aerolínea, fechas).
                    Los filtros se aplicarán directamente a todos los vuelos en la base de datos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }