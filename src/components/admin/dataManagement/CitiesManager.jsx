

// src/components/admin/dataManagement/CitiesManager.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { FiUpload, FiPlus, FiEdit, FiTrash, FiSearch, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CityForm from './forms/CityForm';

export default function CitiesManager() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  
  // Cargar ciudades
  useEffect(() => {
    fetchCities();
  }, []);
  
  const fetchCities = async () => {
    try {
      setLoading(true);
      const citiesRef = collection(db, 'cities');
      const citiesSnapshot = await getDocs(citiesRef);
      
      const citiesList = citiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCities(citiesList);
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
      toast.error('Error al cargar datos de ciudades');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar ciudades según búsqueda
  const filteredCities = cities.filter(city => 
    city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agregar ciudad
  const handleAddCity = async (cityData) => {
    try {
      // Preparar datos y asegurar que campos clave estén en mayúsculas para búsquedas
      const data = {
        ...cityData,
        code: cityData.code.toUpperCase(),
        name: cityData.name,
        name_uppercase: cityData.name.toUpperCase(),
        country: cityData.country,
        country_code: cityData.country_code.toUpperCase(),
        created_at: new Date()
      };
      
      await addDoc(collection(db, 'cities'), data);
      toast.success('Ciudad agregada correctamente');
      setShowAddModal(false);
      fetchCities();
    } catch (error) {
      console.error('Error al agregar ciudad:', error);
      toast.error('Error al agregar ciudad');
    }
  };
  
  // Editar ciudad
  const handleEditCity = async (cityData) => {
    try {
      if (!currentCity?.id) return;
      
      const data = {
        ...cityData,
        code: cityData.code.toUpperCase(),
        name: cityData.name,
        name_uppercase: cityData.name.toUpperCase(),
        country: cityData.country,
        country_code: cityData.country_code.toUpperCase(),
        updated_at: new Date()
      };
      
      await updateDoc(doc(db, 'cities', currentCity.id), data);
      toast.success('Ciudad actualizada correctamente');
      setShowEditModal(false);
      setCurrentCity(null);
      fetchCities();
    } catch (error) {
      console.error('Error al actualizar ciudad:', error);
      toast.error('Error al actualizar ciudad');
    }
  };
  
  // Eliminar ciudad
  const handleDeleteCity = async (cityId) => {
    try {
      if (!window.confirm('¿Está seguro de eliminar esta ciudad? Esta acción no se puede deshacer.')) {
        return;
      }
      
      await deleteDoc(doc(db, 'cities', cityId));
      toast.success('Ciudad eliminada correctamente');
      fetchCities();
    } catch (error) {
      console.error('Error al eliminar ciudad:', error);
      toast.error('Error al eliminar ciudad');
    }
  };
  
  // Importar ciudades desde archivo JSON
  const handleImportCities = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const cities = JSON.parse(event.target.result);
          
          if (!Array.isArray(cities)) {
            throw new Error('El archivo debe contener un array de ciudades');
          }
          
          // Confirmar importación
          if (!window.confirm(`¿Desea importar ${cities.length} ciudades? Esto puede tomar un tiempo.`)) {
            return;
          }
          
          let imported = 0;
          let errors = 0;
          
          for (const city of cities) {
            try {
              // Verificar datos mínimos
              if (!city.code || !city.name) {
                errors++;
                continue;
              }
              
              const data = {
                code: city.code.toUpperCase(),
                name: city.name,
                name_uppercase: city.name.toUpperCase(),
                country: city.country || '',
                country_code: city.country_code?.toUpperCase() || '',
                airports: city.airports || [],
                created_at: new Date()
              };
              
              await addDoc(collection(db, 'cities'), data);
              imported++;
            } catch (error) {
              console.error('Error al importar ciudad:', error);
              errors++;
            }
          }
          
          toast.success(`Importación completada: ${imported} ciudades importadas, ${errors} errores`);
          fetchCities();
        } catch (error) {
          console.error('Error al procesar archivo:', error);
          toast.error('Error al procesar el archivo JSON');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error al importar ciudades:', error);
      toast.error('Error al importar ciudades');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar ciudades..."
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
              onChange={handleImportCities} 
            />
          </label>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amadeus-primary hover:bg-amadeus-secondary text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiPlus className="mr-2" />
            Nueva Ciudad
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Cargando ciudades...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aeropuertos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron ciudades
                  </td>
                </tr>
              ) : (
                filteredCities.map((city) => (
                  <tr key={city.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{city.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.country} {city.country_code ? `(${city.country_code})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.airports?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentCity(city);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteCity(city.id)}
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
        <CityForm
          onSubmit={handleAddCity}
          onCancel={() => setShowAddModal(false)}
        />
      )}
      
      {showEditModal && currentCity && (
        <CityForm
          initialData={currentCity}
          onSubmit={handleEditCity}
          onCancel={() => {
            setShowEditModal(false);
            setCurrentCity(null);
          }}
        />
      )}
    </div>
  );
}

