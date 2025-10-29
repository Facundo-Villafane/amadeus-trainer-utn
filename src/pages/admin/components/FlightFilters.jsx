// src/pages/admin/components/FlightFilters.jsx
import React from 'react';

/**
 * Componente de filtros avanzados para la lista de vuelos
 */
export default function FlightFilters({ 
  filters, 
  setFilters, 
  uniqueAirlines, 
  uniqueOrigins, 
  uniqueDestinations,
  clearFilters
}) {
  // Clases más comunes para filtrar
  const commonClasses = ['F', 'J', 'Y', 'C', 'W'];

  // Handler para actualizar los filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="mt-4 bg-white p-4 shadow rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros Avanzados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Aerolínea */}
        <div>
          <label htmlFor="airline_code" className="block text-sm font-medium text-gray-700 mb-1">
            Aerolínea
          </label>
          <select
            id="airline_code"
            name="airline_code"
            value={filters.airline_code || ''}
            onChange={(e) => handleFilterChange('airline_code', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todas las aerolíneas</option>
            {uniqueAirlines.map(airline => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </div>
        
        {/* Origen */}
        <div>
          <label htmlFor="departure_airport_code" className="block text-sm font-medium text-gray-700 mb-1">
            Aeropuerto de Origen
          </label>
          <select
            id="departure_airport_code"
            name="departure_airport_code"
            value={filters.departure_airport_code || ''}
            onChange={(e) => handleFilterChange('departure_airport_code', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los orígenes</option>
            {uniqueOrigins.map(origin => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>
        
        {/* Destino */}
        <div>
          <label htmlFor="arrival_airport_code" className="block text-sm font-medium text-gray-700 mb-1">
            Aeropuerto de Destino
          </label>
          <select
            id="arrival_airport_code"
            name="arrival_airport_code"
            value={filters.arrival_airport_code || ''}
            onChange={(e) => handleFilterChange('arrival_airport_code', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los destinos</option>
            {uniqueDestinations.map(destination => (
              <option key={destination} value={destination}>
                {destination}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clase disponible */}
        <div>
          <label htmlFor="available_class" className="block text-sm font-medium text-gray-700 mb-1">
            Clase Disponible
          </label>
          <select
            id="available_class"
            name="available_class"
            value={filters.available_class || ''}
            onChange={(e) => handleFilterChange('available_class', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Cualquier clase</option>
            {commonClasses.map(cls => (
              <option key={cls} value={cls}>
                Clase {cls}
              </option>
            ))}
          </select>
        </div>
        
        {/* Fecha de salida */}
        <div>
          <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Salida
          </label>
          <input
            type="date"
            id="departure_date"
            name="departure_date"
            value={filters.departure_date || ''}
            onChange={(e) => handleFilterChange('departure_date', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Estado del vuelo */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="Scheduled">Programado</option>
            <option value="On Time">A tiempo</option>
            <option value="Delayed">Retrasado</option>
            <option value="Cancelled">Cancelado</option>
          </select>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Limpiar filtros
        </button>
        <button
          type="button"
          onClick={() => setFilters(prev => ({ ...prev }))} // Forzar actualización
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}