// src/components/admin/dataManagement/AirportsManager.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { FiUpload, FiPlus, FiEdit, FiTrash, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AirportForm from './forms/AirportForm';

export default function AirportsManager() {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAirport, setCurrentAirport] = useState(null);
  
  // Cargar aeropuertos
  useEffect(() => {
    fetchAirports();
  }, []);
  
  const fetchAirports = async () => {
    try {
      setLoading(true);
      const airportsRef = collection(db, 'airports');
      const airportsSnapshot = await getDocs(airportsRef);
      
      const airportsList = airportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAirports(airportsList);
    } catch (error) {
      console.error('Error al cargar aeropuertos:', error);
      toast.error('Error al cargar datos de aeropuertos');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar aeropuertos según búsqueda
  const filteredAirports = airports.filter(airport => 
    airport.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agregar aeropuerto
  const handleAddAirport = async (airportData) => {
    try {
      // Preparar datos y asegurar que campos clave estén en mayúsculas para búsquedas
      const data = {
        ...airportData,
        code: airportData.code.toUpperCase(),
        name: airportData.name,
        name_uppercase: airportData.name.toUpperCase(),
        city: airportData.city,
        city_code: airportData.city_code.toUpperCase(),
        country: airportData.country,
        country_code: airportData.country_code.toUpperCase(),
        created_at: new Date()
      };
      
      await addDoc(collection(db, 'airports'), data);
      toast.success('Aeropuerto agregado correctamente');
      setShowAddModal(false);
      fetchAirports();
    } catch (error) {
      console.error('Error al agregar aeropuerto:', error);
      toast.error('Error al agregar aeropuerto');
    }
  };
  
  // Editar aeropuerto
  const handleEditAirport = async (airportData) => {
    try {
      if (!currentAirport?.id) return;
      
      const data = {
        ...airportData,
        code: airportData.code.toUpperCase(),
        name: airportData.name,
        name_uppercase: airportData.name.toUpperCase(),
        city: airportData.city,
        city_code: airportData.city_code.toUpperCase(),
        country: airportData.country,
        country_code: airportData.country_code.toUpperCase(),
        updated_at: new Date()
      };
      
      await updateDoc(doc(db, 'airports', currentAirport.id), data);
      toast.success('Aeropuerto actualizado correctamente');
      setShowEditModal(false);
      setCurrentAirport(null);
      fetchAirports();
    } catch (error) {
      console.error('Error al actualizar aeropuerto:', error);
      toast.error('Error al actualizar aeropuerto');
    }
  };
  
  // Eliminar aeropuerto
  const handleDeleteAirport = async (airportId) => {
    try {
      if (!window.confirm('¿Está seguro de eliminar este aeropuerto? Esta acción no se puede deshacer.')) {
        return;
      }
      
      await deleteDoc(doc(db, 'airports', airportId));
      toast.success('Aeropuerto eliminado correctamente');
      fetchAirports();
    } catch (error) {
      console.error('Error al eliminar aeropuerto:', error);
      toast.error('Error al eliminar aeropuerto');
    }
  };
  
  // Importar aeropuertos desde archivo JSON
  const handleImportAirports = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const airports = JSON.parse(event.target.result);
          
          if (!Array.isArray(airports)) {
            throw new Error('El archivo debe contener un array de aeropuertos');
          }
          
          // Confirmar importación
          if (!window.confirm(`¿Desea importar ${airports.length} aeropuertos? Esto puede tomar un tiempo.`)) {
            return;
          }
          
          let imported = 0;
          let errors = 0;
          
          for (const airport of airports) {
            try {
              // Verificar datos mínimos
              if (!airport.code || !airport.name) {
                errors++;
                continue;
              }
              
              const data = {
                code: airport.code.toUpperCase(),
                name: airport.name,
                name_uppercase: airport.name.toUpperCase(),
                city: airport.city || '',
                city_code: airport.city_code?.toUpperCase() || '',
                country: airport.country || '',
                country_code: airport.country_code?.toUpperCase() || '',
                latitude: airport.latitude || null,
                longitude: airport.longitude || null,
                timezone: airport.timezone || null,
                terminals: airport.terminals || [],
                created_at: new Date()
              };
              
              await addDoc(collection(db, 'airports'), data);
              imported++;
            } catch (error) {
              console.error('Error al importar aeropuerto:', error);
              errors++;
            }
          }
          
          toast.success(`Importación completada: ${imported} aeropuertos importados, ${errors} errores`);
          fetchAirports();
        } catch (error) {
          console.error('Error al procesar archivo:', error);
          toast.error('Error al procesar el archivo JSON');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error al importar aeropuertos:', error);
      toast.error('Error al importar aeropuertos');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar aeropuertos..."
            className="pl-10 pr-4 py-2 border rounded-md focus:ring-amadeus-primary focus:border-amadeus-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <div className="flex space-x-2">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md flex items-center">
            <FiUpload className="mr-2" />
            Importar
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportAirports} 
            />
          </label>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amadeus-primary hover:bg-amadeus-secondary text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiPlus className="mr-2" />
            Nuevo Aeropuerto
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Cargando aeropuertos...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAirports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron aeropuertos
                  </td>
                </tr>
              ) : (
                filteredAirports.map((airport) => (
                  <tr key={airport.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{airport.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airport.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {airport.city} {airport.city_code ? `(${airport.city_code})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {airport.country} {airport.country_code ? `(${airport.country_code})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {airport.terminals?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentAirport(airport);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteAirport(airport.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modales */}
      {showAddModal && (
        <AirportForm
          onSubmit={handleAddAirport}
          onCancel={() => setShowAddModal(false)}
        />
      )}
      
      {showEditModal && currentAirport && (
        <AirportForm
          initialData={currentAirport}
          onSubmit={handleEditAirport}
          onCancel={() => {
            setShowEditModal(false);
            setCurrentAirport(null);
          }}
        />
      )}
    </div>
  );
}
