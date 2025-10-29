// src/components/flights/FlightFrequencyTable.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function FlightFrequencyTable() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlights();
  }, []);

  // Función helper para parsear fechas en formato DD/MM/YYYY
  const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      console.warn('Fecha inválida:', dateString);
      return null;
    }

    try {
      // Verificar si la fecha está en formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Crear fecha con año, mes (0-indexado), día
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          // Verificar que la fecha es válida
          if (isNaN(date.getTime())) {
            console.warn('Fecha inválida después del parseo:', dateString);
            return null;
          }
          
          return date;
        }
      }
      
      // Si no está en formato DD/MM/YYYY, intentar parseo directo
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('No se pudo parsear la fecha:', dateString);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Error parseando fecha:', dateString, error);
      return null;
    }
  };

  // Función para obtener el rango de fechas de un vuelo
  const getFlightRange = (flight) => {
    try {
      const departureDate = parseDate(flight.departure_date);
      const arrivalDate = parseDate(flight.arrival_date);

      if (!departureDate) {
        console.warn('Fecha de salida inválida para vuelo:', flight.id, flight.departure_date);
        return null;
      }

      // Si no hay fecha de llegada, usar la fecha de salida
      const endDate = arrivalDate || departureDate;

      return {
        start: departureDate,
        end: endDate,
        flight: flight
      };
    } catch (error) {
      console.error('Error obteniendo rango de vuelo:', flight.id, error);
      return null;
    }
  };

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);

      const flightsQuery = query(collection(db, 'flights'));
      const querySnapshot = await getDocs(flightsQuery);
      
      const flightsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Vuelos obtenidos:', flightsData.length);

      // Filtrar vuelos con fechas válidas y obtener rangos
      const flightRanges = flightsData
        .map(flight => getFlightRange(flight))
        .filter(range => range !== null); // Filtrar rangos inválidos

      console.log('Rangos válidos:', flightRanges.length);

      // Agrupar vuelos por ruta
      const routeFrequency = flightRanges.reduce((acc, { flight }) => {
        const routeKey = `${flight.departure_airport_code}-${flight.arrival_airport_code}`;
        
        if (!acc[routeKey]) {
          acc[routeKey] = {
            route: `${flight.departure_city} (${flight.departure_airport_code}) → ${flight.arrival_city} (${flight.arrival_airport_code})`,
            airline: flight.airline_name || flight.airline_code,
            count: 0,
            flights: []
          };
        }
        
        acc[routeKey].count++;
        acc[routeKey].flights.push(flight);
        
        return acc;
      }, {});

      // Convertir a array y ordenar por frecuencia
      const sortedRoutes = Object.values(routeFrequency)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 rutas

      setFlights(sortedRoutes);

    } catch (error) {
      console.error('Error fetching flights:', error);
      setError('Error al cargar la frecuencia de vuelos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Frecuencia de Vuelos</h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Cargando frecuencias...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Frecuencia de Vuelos</h3>
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <button 
            onClick={fetchFlights}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Frecuencia de Vuelos</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No hay datos de frecuencia disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Rutas Más Frecuentes</h3>
        <p className="text-sm text-gray-500">Top 10 rutas por número de vuelos</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aerolínea
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frecuencia
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flights.map((route, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {route.route}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {route.airline}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {route.count} vuelos
                    </div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(route.count / flights[0].count) * 100}%` }}
                      ></div>
                    </div>
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