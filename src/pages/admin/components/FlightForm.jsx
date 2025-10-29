// src/pages/admin/components/FlightForm.jsx
import React, { useEffect } from 'react';
import ClassAvailabilityEditor from './ClassAvailabilityEditor';

// Función helper para calcular hora de llegada
const calculateArrivalTime = (departureTime, durationHours) => {
  if (!departureTime || !durationHours) return '';
  
  try {
    // Parsear hora de salida (formato HH:MM)
    const [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
    
    if (isNaN(hours) || isNaN(minutes)) return '';
    
    // Crear fecha temporal con la hora de salida
    const departureDateTime = new Date();
    departureDateTime.setHours(hours, minutes, 0, 0);
    
    // Calcular hora de llegada añadiendo la duración
    const durationMs = durationHours * 60 * 60 * 1000;
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
    
    // Formatear hora de llegada como HH:MM
    const arrivalHours = arrivalDateTime.getHours().toString().padStart(2, '0');
    const arrivalMinutes = arrivalDateTime.getMinutes().toString().padStart(2, '0');
    
    // Indicar si es el día siguiente
    const daysDiff = Math.floor(durationHours / 24);
    const arrivalTimeStr = `${arrivalHours}:${arrivalMinutes}`;
    
    return daysDiff > 0 ? `${arrivalTimeStr} (+${daysDiff})` : arrivalTimeStr;
  } catch (error) {
    console.error('Error calculando hora de llegada:', error);
    return '';
  }
};

export default function FlightForm({
  formData,
  isEditing,
  onInputChange,
  onSubmit,
  onCancel,
  setFormData
}) {
  
  // Efecto para calcular automáticamente la hora de llegada
  useEffect(() => {
    const calculatedArrivalTime = calculateArrivalTime(
      formData.departure_time,
      formData.duration_hours
    );
    
    // Solo actualizar si ha cambiado para evitar loops infinitos
    if (calculatedArrivalTime !== formData.arrival_time) {
      setFormData(prev => ({
        ...prev,
        arrival_time: calculatedArrivalTime
      }));
    }
  }, [formData.departure_time, formData.duration_hours]); // Dependencias: recalcular cuando cambien estos valores

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={onSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isEditing ? 'Editar Vuelo' : 'Añadir Vuelo'}
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        placeholder="15/4/2025"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        placeholder="14:30"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700">
                        Fecha Salida (D/M/YYYY)
                      </label>
                      <input
                        type="text"
                        name="departure_date"
                        id="departure_date"
                        value={formData.departure_date}
                        onChange={onInputChange}
                        required
                        placeholder="15/4/2025"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        placeholder="14:30"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        onChange={onInputChange}
                        required
                        step="0.01"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    {/* NUEVO CAMPO: Hora de llegada (calculada automáticamente) */}
                    <div>
                      <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700">
                        Hora Llegada (Calculada)
                      </label>
                      <input
                        type="text"
                        name="arrival_time"
                        id="arrival_time"
                        value={formData.arrival_time || ''}
                        readOnly
                        className="mt-1 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Se calcula automáticamente"
                      />
                      {formData.arrival_time && formData.arrival_time.includes('+') && (
                        <p className="mt-1 text-xs text-amber-600">
                          ⚠️ Llegada al día siguiente
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={onInputChange}
                        required
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                        onChange={onInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                        onChange={onInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

                    <ClassAvailabilityEditor
                      value={formData.class_availability}
                      onChange={(newValue) => setFormData(prev => ({
                        ...prev,
                        class_availability: newValue
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Vuelo'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}