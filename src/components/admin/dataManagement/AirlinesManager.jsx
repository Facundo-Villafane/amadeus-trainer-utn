// src/components/admin/dataManagement/AirlinesManager.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { FiUpload, FiPlus, FiEdit, FiTrash, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AirlineForm from './forms/AirlineForm';

export default function AirlinesManager() {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAirline, setCurrentAirline] = useState(null);
  
  // Cargar aerolíneas
  useEffect(() => {
    fetchAirlines();
  }, []);
  
  const fetchAirlines = async () => {
    try {
      setLoading(true);
      const airlinesRef = collection(db, 'airlines');
      const airlinesSnapshot = await getDocs(airlinesRef);
      
      const airlinesList = airlinesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAirlines(airlinesList);
    } catch (error) {
      console.error('Error al cargar aerolíneas:', error);
      toast.error('Error al cargar datos de aerolíneas');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar aerolíneas según búsqueda
  const filteredAirlines = airlines.filter(airline => 
    airline.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airline.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agregar aerolínea
  const handleAddAirline = async (airlineData) => {
    try {
      // Asegurar que el código y nombre estén en mayúsculas para búsquedas
      const data = {
        ...airlineData,
        code: airlineData.code.toUpperCase(),
        name: airlineData.name,
        name_uppercase: airlineData.name.toUpperCase(),
        created_at: new Date()
      };
      
      await addDoc(collection(db, 'airlines'), data);
      toast.success('Aerolínea agregada correctamente');
      setShowAddModal(false);
      fetchAirlines();
    } catch (error) {
      console.error('Error al agregar aerolínea:', error);
      toast.error('Error al agregar aerolínea');
    }
  };
  
  // Editar aerolínea
  const handleEditAirline = async (airlineData) => {
    try {
      if (!currentAirline?.id) return;
      
      const data = {
        ...airlineData,
        code: airlineData.code.toUpperCase(),
        name: airlineData.name,
        name_uppercase: airlineData.name.toUpperCase(),
        updated_at: new Date()
      };
      
      await updateDoc(doc(db, 'airlines', currentAirline.id), data);
      toast.success('Aerolínea actualizada correctamente');
      setShowEditModal(false);
      setCurrentAirline(null);
      fetchAirlines();
    } catch (error) {
      console.error('Error al actualizar aerolínea:', error);
      toast.error('Error al actualizar aerolínea');
    }
  };
  
  // Eliminar aerolínea
  const handleDeleteAirline = async (airlineId) => {
    try {
      if (!window.confirm('¿Está seguro de eliminar esta aerolínea? Esta acción no se puede deshacer.')) {
        return;
      }
      
      await deleteDoc(doc(db, 'airlines', airlineId));
      toast.success('Aerolínea eliminada correctamente');
      fetchAirlines();
    } catch (error) {
      console.error('Error al eliminar aerolínea:', error);
      toast.error('Error al eliminar aerolínea');
    }
  };
  
  // Importar aerolíneas desde archivo JSON
  const handleImportAirlines = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const airlines = JSON.parse(event.target.result);
          
          if (!Array.isArray(airlines)) {
            throw new Error('El archivo debe contener un array de aerolíneas');
          }
          
          // Confirmar importación
          if (!window.confirm(`¿Desea importar ${airlines.length} aerolíneas? Esto puede tomar un tiempo.`)) {
            return;
          }
          
          let imported = 0;
          let errors = 0;
          
          for (const airline of airlines) {
            try {
              // Verificar datos mínimos
              if (!airline.code || !airline.name) {
                errors++;
                continue;
              }
              
              const data = {
                code: airline.code.toUpperCase(),
                name: airline.name,
                name_uppercase: airline.name.toUpperCase(),
                country: airline.country || '',
                country_code: airline.country_code || '',
                created_at: new Date()
              };
              
              await addDoc(collection(db, 'airlines'), data);
              imported++;
            } catch (error) {
              console.error('Error al importar aerolínea:', error);
              errors++;
            }
          }
          
          toast.success(`Importación completada: ${imported} aerolíneas importadas, ${errors} errores`);
          fetchAirlines();
        } catch (error) {
          console.error('Error al procesar archivo:', error);
          toast.error('Error al procesar el archivo JSON');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error al importar aerolíneas:', error);
      toast.error('Error al importar aerolíneas');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar aerolíneas..."
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
              onChange={handleImportAirlines} 
            />
          </label>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amadeus-primary hover:bg-amadeus-secondary text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiPlus className="mr-2" />
            Nueva Aerolínea
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Cargando aerolíneas...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAirlines.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron aerolíneas
                  </td>
                </tr>
              ) : (
                filteredAirlines.map((airline) => (
                  <tr key={airline.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{airline.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airline.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airline.country || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentAirline(airline);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteAirline(airline.id)}
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
        <AirlineForm
          onSubmit={handleAddAirline}
          onCancel={() => setShowAddModal(false)}
        />
      )}
      
      {showEditModal && currentAirline && (
        <AirlineForm
          initialData={currentAirline}
          onSubmit={handleEditAirline}
          onCancel={() => {
            setShowEditModal(false);
            setCurrentAirline(null);
          }}
        />
      )}
    </div>
  );
}