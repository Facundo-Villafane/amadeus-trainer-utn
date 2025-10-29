// src/components/admin/EnhancedFlightScheduleGenerator.jsx
import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiCalendar, FiCheck, FiLoader, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EnhancedFlightScheduleGenerator({ flight, onClose, onComplete }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ total: 0, created: 0, skipped: 0 });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Estado para configuración avanzada
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [classAvailability, setClassAvailability] = useState({});
  const [hasStops, setHasStops] = useState(false);
  const [stops, setStops] = useState([]);
  const [includeClasses, setIncludeClasses] = useState(true);
  
  // Inicializar clases basadas en la aerolínea
  useState(() => {
    if (flight?.airline_code) {
      let initialClasses = {};
      
      // Configuraciones predefinidas por aerolínea
      const airlineConfigs = {
        IB: { J: 4, C: 4, D: 4, Y: 9, B: 9, H: 9, K: 9, L: 9, M: 9, V: 9 }, // Iberia
        BA: { F: 2, J: 4, W: 4, Y: 9, B: 9, M: 9, K: 9 },                   // British Airways
        AF: { P: 2, F: 2, J: 4, W: 4, Y: 9, B: 9, M: 9 },                   // Air France
        LH: { F: 2, A: 2, J: 4, C: 4, Y: 9, B: 9, M: 9, H: 9 },             // Lufthansa
        // Añadir más aerolíneas según sea necesario
      };
      
      // Usar configuración de la aerolínea o predeterminada
      initialClasses = airlineConfigs[flight.airline_code] || { Y: 9, B: 9, M: 9 };
      
      // Si el vuelo ya tiene clases definidas, usarlas
      if (flight.class_availability && Object.keys(flight.class_availability).length > 0) {
        initialClasses = { ...flight.class_availability };
      }
      
      setClassAvailability(initialClasses);
    }
  }, [flight]);
  
  // Manejar cambios en la selección de días
  const handleDayChange = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  // Función para gestionar paradas/escalas
  const addStop = () => {
    setStops([...stops, { 
      airport_code: '', 
      arrival_time: '', 
      departure_time: '', 
      ground_time: 60 // 60 minutos por defecto
    }]);
  };
  
  const removeStop = (index) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };
  
  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
  };

  // Función para generar fechas entre startDate y endDate
  const generateDates = () => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    // Mapear nombres de días a números (0=domingo, 1=lunes, etc.)
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    // Obtener array de números de días seleccionados
    const selectedDayNumbers = Object.entries(selectedDays)
      .filter(([_, selected]) => selected)
      .map(([day, _]) => dayMap[day]);

    if (selectedDayNumbers.length === 0) return [];

    // Iterar desde start hasta end
    const current = new Date(start);
    while (current <= end) {
      // Verificar si el día de la semana actual está seleccionado
      if (selectedDayNumbers.includes(current.getDay())) {
        dates.push(new Date(current));
      }
      // Avanzar al siguiente día
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Generar programación de vuelos
  const generateSchedule = async () => {
    try {
      setGenerating(true);
      setStats({ total: 0, created: 0, skipped: 0 });

      // Generar fechas
      const dates = generateDates();
      
      if (dates.length === 0) {
        toast.error('No hay fechas para generar. Verifica las fechas y días seleccionados.');
        setGenerating(false);
        return;
      }

      let created = 0;
      let skipped = 0;
      
      // Inicializar progreso
      setProgress({ current: 0, total: dates.length });

      // Para cada fecha, crear un nuevo vuelo
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        
        // Actualizar progreso
        setProgress({ current: i + 1, total: dates.length });
        
        // Formatear fecha como D/M/YYYY
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        // Verificar si el vuelo ya existe para esta fecha
        const flightQuery = query(
          collection(db, 'flights'),
          where('flight_number', '==', flight.flight_number),
          where('airline_code', '==', flight.airline_code),
          where('departure_date', '==', formattedDate)
        );
        
        const existingFlights = await getDocs(flightQuery);
        
        if (existingFlights.empty) {
          // Crear nuevo vuelo con la misma información pero fecha diferente
          const newFlightData = {
            ...flight,
            departure_date: formattedDate,
            // Recalcular arrival_date basado en duration_hours
            arrival_date: calculateArrivalDate(formattedDate, flight.departure_time, flight.duration_hours),
            created_at: serverTimestamp()
          };
          
          // Añadir información de clases si está habilitado
          if (includeClasses) {
            newFlightData.class_availability = classAvailability;
          }
          
          // Añadir información de escalas si está habilitado
          if (hasStops && stops.length > 0) {
            newFlightData.stops = stops.length;
            newFlightData.connection_airports = stops;
          } else {
            newFlightData.stops = 0;
            newFlightData.connection_airports = [];
          }
          
          // Añadir información de frecuencia
          const daysOfOperation = Object.entries(selectedDays)
            .filter(([_, selected]) => selected)
            .map(([day, _]) => day.charAt(0).toUpperCase())
            .join('');
            
          newFlightData.days_of_operation = daysOfOperation || 'D'; // D = Diario si no hay días específicos
          
          await addDoc(collection(db, 'flights'), newFlightData);
          created++;
        } else {
          skipped++;
        }
        
        // Actualizar estadísticas mientras avanza
        setStats({
          total: dates.length,
          created,
          skipped
        });
      }

      toast.success(`Programación generada: ${created} vuelos creados, ${skipped} omitidos`);
      
      // Notificar que se ha completado la generación
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error al generar programación:', error);
      toast.error('Error al generar la programación de vuelos');
    } finally {
      setGenerating(false);
    }
  };

  // Modificación segura para calculateArrivalDate
const calculateArrivalDate = (departureDate, departureTime, durationHours) => {
  try {
    // Verificar que los parámetros son válidos
    if (!departureDate || !departureTime || durationHours === undefined) {
      console.warn('Parámetros incompletos para calculateArrivalDate', { departureDate, departureTime, durationHours });
      return ''; // Devolver fecha vacía si faltan datos
    }
    
    // Convertir fecha y hora de salida a un objeto Date
    let day, month, year;
    
    // Intentar dividir la fecha según el formato (D/M/YYYY)
    try {
      [day, month, year] = departureDate.split('/').map(num => parseInt(num, 10));
      
      // Verificar que los valores son válidos
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error('Formato de fecha inválido');
      }
    } catch (error) {
      console.warn('Error al procesar la fecha de salida:', error);
      return ''; // Devolver fecha vacía en caso de error
    }
    
    // Procesar la hora
    let hours = 0, minutes = 0;
    try {
      [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
      
      // Verificar que los valores son válidos
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Formato de hora inválido');
      }
    } catch (error) {
      console.warn('Error al procesar la hora de salida:', error);
      hours = 0;
      minutes = 0;
    }
    
    // Crear fecha de salida (mes - 1 porque en JS los meses van de 0-11)
    const departureDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Validar que la fecha es válida
    if (isNaN(departureDateTime.getTime())) {
      console.warn('Fecha/hora de salida inválida');
      return '';
    }
    
    // Calcular fecha y hora de llegada añadiendo la duración
    const durationMs = durationHours * 60 * 60 * 1000;
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
    
    // Formatear fecha de llegada: D/M/YYYY
    return `${arrivalDateTime.getDate()}/${arrivalDateTime.getMonth() + 1}/${arrivalDateTime.getFullYear()}`;
  } catch (error) {
    console.error('Error general en calculateArrivalDate:', error);
    return ''; // Devolver fecha vacía en caso de error general
  }
};

  // Componente para editar las clases disponibles
  const ClassesEditor = () => {
    // Lista de clases comunes para mostrar
    const commonClasses = ['F', 'A', 'J', 'C', 'D', 'I', 'W', 'S', 'Y', 'B', 'M', 'H', 'K', 'L', 'Q', 'T', 'V', 'X'];
    const [newClass, setNewClass] = useState('');
    
    const addClass = () => {
      if (newClass && !classAvailability[newClass]) {
        setClassAvailability({
          ...classAvailability,
          [newClass]: 9 // Valor predeterminado
        });
        setNewClass('');
      }
    };
    
    const removeClass = (classCode) => {
      const updatedClasses = { ...classAvailability };
      delete updatedClasses[classCode];
      setClassAvailability(updatedClasses);
    };
    
    const updateAvailability = (classCode, value) => {
      setClassAvailability({
        ...classAvailability,
        [classCode]: parseInt(value, 10)
      });
    };
    
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Clases disponibles</h4>
        
        <div className="grid grid-cols-4 gap-2 mb-3">
          {Object.entries(classAvailability).map(([classCode, seats]) => (
            <div key={classCode} className="flex items-center space-x-2 p-2 border rounded">
              <span className="font-mono font-bold">{classCode}</span>
              <input
                type="number"
                min="0"
                max="9"
                value={seats}
                onChange={(e) => updateAvailability(classCode, e.target.value)}
                className="w-12 border rounded py-1 px-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeClass(classCode)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            className="border rounded py-1 px-2 text-sm"
          >
            <option value="">Agregar clase...</option>
            {commonClasses
              .filter(cls => !classAvailability[cls])
              .map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
          </select>
          <button
            type="button"
            onClick={addClass}
            disabled={!newClass}
            className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    );
  };
  
  // Componente para editar las escalas
  const StopsEditor = () => {
    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Escalas</h4>
          <button
            type="button"
            onClick={addStop}
            className="text-sm text-amadeus-primary hover:text-amadeus-secondary"
          >
            + Agregar escala
          </button>
        </div>
        
        {stops.length === 0 ? (
          <p className="text-xs text-gray-500 mt-2">No hay escalas configuradas.</p>
        ) : (
          <div className="space-y-3 mt-2">
            {stops.map((stop, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Escala {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-700">Aeropuerto</label>
                    <input
                      type="text"
                      value={stop.airport_code}
                      onChange={(e) => updateStop(index, 'airport_code', e.target.value.toUpperCase())}
                      className="w-full border rounded py-1 px-2 text-sm"
                      placeholder="MAD"
                      maxLength={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-700">Tiempo en tierra (min)</label>
                    <input
                      type="number"
                      min="15"
                      value={stop.ground_time}
                      onChange={(e) => updateStop(index, 'ground_time', e.target.value)}
                      className="w-full border rounded py-1 px-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-700">Llegada</label>
                    <input
                      type="time"
                      value={stop.arrival_time}
                      onChange={(e) => updateStop(index, 'arrival_time', e.target.value)}
                      className="w-full border rounded py-1 px-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-700">Salida</label>
                    <input
                      type="time"
                      value={stop.departure_time}
                      onChange={(e) => updateStop(index, 'departure_time', e.target.value)}
                      className="w-full border rounded py-1 px-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amadeus-light sm:mx-0 sm:h-10 sm:w-10">
                <FiCalendar className="h-6 w-6 text-amadeus-primary" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Generar Programación de Vuelos
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Crea múltiples instancias del vuelo {flight.airline_code} {flight.flight_number} en diferentes fechas.
                </p>
                
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de operación
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { id: 'monday', label: 'L' },
                        { id: 'tuesday', label: 'M' },
                        { id: 'wednesday', label: 'X' },
                        { id: 'thursday', label: 'J' },
                        { id: 'friday', label: 'V' },
                        { id: 'saturday', label: 'S' },
                        { id: 'sunday', label: 'D' }
                      ].map((day) => (
                        <div 
                          key={day.id}
                          onClick={() => handleDayChange(day.id)}
                          className={`flex items-center justify-center rounded-full w-8 h-8 cursor-pointer border ${
                            selectedDays[day.id] 
                              ? 'bg-amadeus-primary text-white border-amadeus-primary' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Botón para mostrar/ocultar configuración avanzada */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                      className="text-amadeus-primary hover:text-amadeus-secondary flex items-center text-sm"
                    >
                      <FiLayers className="mr-1" />
                      {showAdvancedConfig ? 'Ocultar configuración avanzada' : 'Mostrar configuración avanzada'}
                    </button>
                  </div>
                  
                  {/* Configuración avanzada */}
                  {showAdvancedConfig && (
                    <div className="space-y-3">
                      {/* Opción para incluir/excluir configuración de clases */}
                      <div className="flex items-center">
                        <input
                          id="includeClasses"
                          type="checkbox"
                          checked={includeClasses}
                          onChange={() => setIncludeClasses(!includeClasses)}
                          className="h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                        />
                        <label htmlFor="includeClasses" className="ml-2 block text-sm text-gray-700">
                          Configurar clases disponibles
                        </label>
                      </div>
                      
                      {/* Editor de clases disponibles */}
                      {includeClasses && <ClassesEditor />}
                      
                      {/* Opción para incluir/excluir escalas */}
                      <div className="flex items-center mt-4">
                        <input
                          id="hasStops"
                          type="checkbox"
                          checked={hasStops}
                          onChange={() => setHasStops(!hasStops)}
                          className="h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                        />
                        <label htmlFor="hasStops" className="ml-2 block text-sm text-gray-700">
                          Este vuelo tiene escalas
                        </label>
                      </div>
                      
                      {/* Editor de escalas */}
                      {hasStops && <StopsEditor />}
                    </div>
                  )}
                </div>

                {generating && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-700 mb-2">
                      Generando vuelos {flight.airline_code} {flight.flight_number}...
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-amadeus-primary h-2.5 rounded-full" 
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-600">
                        {progress.current} de {progress.total}
                      </span>
                    </div>
                  </div>
                )}

                {!generating && stats.total > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center">
                        <FiCheck className="mr-1.5 h-4 w-4 text-green-500" />
                        <span className="font-medium">{stats.created}</span>
                        <span className="ml-1">vuelos creados</span>
                      </div>
                      {stats.skipped > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          {stats.skipped} vuelos omitidos (ya existentes)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={generateSchedule}
              disabled={generating || !startDate || !endDate || !Object.values(selectedDays).some(selected => selected)}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${
                generating || !startDate || !endDate || !Object.values(selectedDays).some(selected => selected)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary'
              } sm:ml-3 sm:w-auto sm:text-sm`}
            >
              {generating ? (
                <>
                  <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Generando ({progress.current}/{progress.total})
                </>
              ) : (
                'Generar programación'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );}