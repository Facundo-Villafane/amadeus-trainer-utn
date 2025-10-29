// src/pages/admin/components/FlightTable.jsx
import React from 'react';
import { FiAirplay, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';

/**
 * Componente para mostrar la tabla de vuelos
 */
export default function FlightTable({ 
  flights, 
  loading, 
  onEdit, 
  onDelete, 
  onSchedule 
}) {
  if (loading) {
    return (
      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vuelo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen/Destino
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
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
      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vuelo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen/Destino
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <p className="text-gray-500">No se encontraron vuelos que coincidan con los criterios.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vuelo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origen/Destino
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
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
                    {flight.departure_date} a las {flight.departure_time}
                  </div>
                  <div className="text-sm text-gray-500">
                    Duración: {flight.duration_hours}h
                  </div>
                  {flight.arrival_date && flight.arrival_time && (
                    <div className="text-xs text-gray-400">
                      Llegada: {flight.arrival_date} {flight.arrival_time}
                    </div>
                  )}
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
}