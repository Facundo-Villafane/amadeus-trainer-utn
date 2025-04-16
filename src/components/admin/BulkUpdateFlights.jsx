// src/components/admin/BulkUpdateFlights.jsx
import { useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiRefreshCw, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BulkUpdateFlights() {
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ total: 0, updated: 0 });
  const [updateType, setUpdateType] = useState('by_flight_number'); // by_flight_number o all
  const [flightNumber, setFlightNumber] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  
  // Definir clases de asientos comunes
  const generateClasses = () => {
    // Clases comunes para aerolíneas
    const classes = {
      // Clases estándar que muchas aerolíneas usan
      default: {
        Y: Math.floor(Math.random() * 5) + 5, // Economy (5-9 asientos)
        B: Math.floor(Math.random() * 4) + 1, // Economy Premium (1-4 asientos)
        M: Math.floor(Math.random() * 3) + 1, // Economy Discount (1-3 asientos)
        J: Math.floor(Math.random() * 3),     // Business (0-2 asientos)
        F: Math.floor(Math.random() * 2)      // First (0-1 asientos)
      },
      // Aerolíneas específicas
      IB: { // Iberia
        J: Math.floor(Math.random() * 3) + 1, // Business
        C: Math.floor(Math.random() * 2) + 1, // Business Premium
        D: Math.floor(Math.random() * 2),     // Business Discount
        Y: Math.floor(Math.random() * 4) + 5, // Economy
        B: Math.floor(Math.random() * 3) + 2, // Economy Premium
        H: Math.floor(Math.random() * 4) + 1, // Economy Discount
        Q: Math.floor(Math.random() * 4) + 3, // Economy Promotional
        V: Math.floor(Math.random() * 3) + 1  // Economy Super Promotional
      },
      BA: { // British Airways
        F: Math.floor(Math.random() * 2),     // First
        J: Math.floor(Math.random() * 2) + 1, // Club World/Business
        W: Math.floor(Math.random() * 2) + 1, // World Traveller Plus/Premium Economy
        Y: Math.floor(Math.random() * 4) + 4, // World Traveller/Economy
        B: Math.floor(Math.random() * 3) + 3, // Economy Premium
        M: Math.floor(Math.random() * 3) + 2, // Economy Standard
        K: Math.floor(Math.random() * 3) + 1  // Economy Discount
      },
      AF: { // Air France
        P: Math.floor(Math.random() * 2),     // First
        F: Math.floor(Math.random() * 2),     // First Premium
        J: Math.floor(Math.random() * 3) + 1, // Business
        W: Math.floor(Math.random() * 2) + 1, // Premium Economy
        Y: Math.floor(Math.random() * 4) + 5, // Economy
        B: Math.floor(Math.random() * 3) + 3, // Economy Premium
        M: Math.floor(Math.random() * 3) + 2  // Economy Discount
      },
      LH: { // Lufthansa
        F: Math.floor(Math.random() * 2),     // First
        A: Math.floor(Math.random() * 1) + 1, // First Discount
        J: Math.floor(Math.random() * 3) + 1, // Business
        C: Math.floor(Math.random() * 2) + 1, // Business Discount
        Y: Math.floor(Math.random() * 4) + 5, // Economy
        B: Math.floor(Math.random() * 3) + 3, // Economy Premium
        M: Math.floor(Math.random() * 3) + 2, // Economy Discount
        H: Math.floor(Math.random() * 3) + 1  // Economy Super Discount
      },
      DL: { // Delta
        F: Math.floor(Math.random() * 2),     // First
        J: Math.floor(Math.random() * 2) + 1, // Business/Delta One
        P: Math.floor(Math.random() * 2) + 1, // Premium Select
        Y: Math.floor(Math.random() * 4) + 5, // Main Cabin
        B: Math.floor(Math.random() * 3) + 3, // Discounted Main Cabin
        M: Math.floor(Math.random() * 3) + 2, // Deep Discount Main Cabin
        E: Math.floor(Math.random() * 3) + 1  // Basic Economy
      },
      AA: { // American Airlines
        F: Math.floor(Math.random() * 2),     // First
        J: Math.floor(Math.random() * 2) + 1, // Business
        W: Math.floor(Math.random() * 2) + 1, // Premium Economy
        Y: Math.floor(Math.random() * 4) + 5, // Main Cabin
        H: Math.floor(Math.random() * 3) + 1, // Main Cabin Extra
        Q: Math.floor(Math.random() * 3) + 3, // Main Cabin
        V: Math.floor(Math.random() * 3) + 1  // Basic Economy
      },
      // Agrega más aerolíneas si es necesario
    };
    
    return classes;
  };
  
  const updateFlights = async () => {
    try {
      setUpdating(true);
      setProgress({ current: 0, total: 0 });
      setStats({ total: 0, updated: 0 });
      
      // Construir la consulta según el tipo de actualización
      let flightsQuery = query(collection(db, 'flights'));
      
      if (updateType === 'by_flight_number' && flightNumber && airlineCode) {
        flightsQuery = query(
          flightsQuery,
          where('flight_number', '==', flightNumber),
          where('airline_code', '==', airlineCode)
        );
      }
      
      // Ejecutar la consulta
      const querySnapshot = await getDocs(flightsQuery);
      
      if (querySnapshot.empty) {
        toast.error('No se encontraron vuelos para actualizar');
        setUpdating(false);
        return;
      }
      
      setProgress({ current: 0, total: querySnapshot.size });
      
      // Generar las clases para diferentes aerolíneas
      const airlineClasses = generateClasses();
      
      // Agrupar vuelos por número de vuelo y aerolínea
      const flightGroups = {};
      querySnapshot.forEach(doc => {
        const flight = doc.data();
        const key = `${flight.airline_code}-${flight.flight_number}`;
        
        if (!flightGroups[key]) {
          flightGroups[key] = [];
        }
        
        flightGroups[key].push({
          id: doc.id,
          ...flight
        });
      });
      
      let updated = 0;
      
      // Para cada grupo de vuelos, generar una única configuración de clases
      for (const [groupKey, flights] of Object.entries(flightGroups)) {
        // Extraer el código de aerolínea
        const airlineCode = groupKey.split('-')[0];
        
        // Seleccionar las clases para esta aerolínea o usar el default
        const classes = airlineClasses[airlineCode] || airlineClasses.default;
        
        // Usar el batch para actualizar múltiples documentos eficientemente
        const batch = writeBatch(db);
        
        flights.forEach(flight => {
          const flightRef = doc(db, 'flights', flight.id);
          batch.update(flightRef, {
            class_availability: classes,
            updated_at: new Date()
          });
        });
        
        // Commit el batch
        await batch.commit();
        
        updated += flights.length;
        setProgress({ current: updated, total: querySnapshot.size });
        setStats({ total: querySnapshot.size, updated });
      }
      
      toast.success(`¡Actualización completada! Se actualizaron ${updated} vuelos.`);
    } catch (error) {
      console.error('Error al actualizar vuelos:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Actualización masiva de clases</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Actualiza la disponibilidad de clases para vuelos existentes.</p>
        </div>
        
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de actualización</label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="by-flight-number"
                  name="update-type"
                  type="radio"
                  checked={updateType === 'by_flight_number'}
                  onChange={() => setUpdateType('by_flight_number')}
                  className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                />
                <label htmlFor="by-flight-number" className="ml-3 block text-sm font-medium text-gray-700">
                  Por número de vuelo
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="all-flights"
                  name="update-type"
                  type="radio"
                  checked={updateType === 'all'}
                  onChange={() => setUpdateType('all')}
                  className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300"
                />
                <label htmlFor="all-flights" className="ml-3 block text-sm font-medium text-gray-700">
                  Todos los vuelos
                </label>
              </div>
            </div>
          </div>
          
          {updateType === 'by_flight_number' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="airline-code" className="block text-sm font-medium text-gray-700">
                  Código de aerolínea
                </label>
                <input
                  type="text"
                  id="airline-code"
                  value={airlineCode}
                  onChange={(e) => setAirlineCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  placeholder="IB"
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="flight-number" className="block text-sm font-medium text-gray-700">
                  Número de vuelo
                </label>
                <input
                  type="text"
                  id="flight-number"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                  placeholder="1234"
                />
              </div>
            </div>
          )}
          
          <div className="mt-5">
            <button
              type="button"
              onClick={updateFlights}
              disabled={updating || (updateType === 'by_flight_number' && (!airlineCode || !flightNumber))}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                updating || (updateType === 'by_flight_number' && (!airlineCode || !flightNumber))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary'
              }`}
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? `Actualizando (${progress.current}/${progress.total})` : 'Actualizar clases'}
            </button>
          </div>
          
          {updating && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700 mb-2">
                Actualizando clases de vuelos...
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
          
          {!updating && stats.total > 0 && (
            <div className="mt-3 text-sm">
              <div className="flex items-center text-green-600">
                <FiCheck className="mr-1.5 h-4 w-4" />
                <span>Vuelos actualizados: {stats.updated} de {stats.total}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}