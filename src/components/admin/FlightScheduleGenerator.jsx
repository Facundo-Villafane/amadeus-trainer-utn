// src/components/admin/FlightScheduleGenerator.jsx
import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiCalendar, FiCheck, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FlightScheduleGenerator({ flight, onClose, onComplete }) {
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

  // Manejar cambios en la selección de días
  const handleDayChange = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
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
          where('departure_date', '==', formattedDate)
        );
        
        const existingFlights = await getDocs(flightQuery);
        
        if (existingFlights.empty) {
          // Crear nuevo vuelo con la misma información pero fecha diferente
          await addDoc(collection(db, 'flights'), {
            ...flight,
            departure_date: formattedDate,
            // Recalcular arrival_date basado en duration_hours
            arrival_date: calculateArrivalDate(formattedDate, flight.departure_time, flight.duration_hours),
            created_at: serverTimestamp()
          });
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

  // Función para calcular fecha de llegada basada en fecha/hora de salida y duración
  const calculateArrivalDate = (departureDate, departureTime, durationHours) => {
    // Convertir fecha y hora de salida a un objeto Date
    const [day, month, year] = departureDate.split('/').map(num => parseInt(num));
    const [hours, minutes] = departureTime.split(':').map(num => parseInt(num));
    
    const departureDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Calcular fecha y hora de llegada añadiendo la duración
    const durationMs = durationHours * 60 * 60 * 1000;
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
    
    // Formatear fecha de llegada: D/M/YYYY
    return `${arrivalDateTime.getDate()}/${arrivalDateTime.getMonth() + 1}/${arrivalDateTime.getFullYear()}`;
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
  );
}