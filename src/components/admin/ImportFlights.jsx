// src/components/admin/ImportFlights.jsx
import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { processFlightData } from '../../utils/flightDataProcessor';
import { FiUpload, FiCheck, FiAlertTriangle, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ImportFlights({ onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, imported: 0, errors: 0 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    setFileError(null);
    const file = e.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Verificar que sea un archivo JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setFileError('El archivo debe ser de tipo JSON');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  // Importar datos desde el archivo JSON seleccionado
  const importFromFile = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo JSON primero');
      return;
    }
    
    try {
      setImporting(true);
      setStats({ total: 0, imported: 0, errors: 0 });
      
      // Leer el archivo JSON
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          // Parsear el contenido JSON
          const flightData = JSON.parse(event.target.result);
          
          if (!Array.isArray(flightData)) {
            throw new Error('El archivo debe contener un array de vuelos');
          }
          
          // Procesar los datos para completar información faltante
          const processedFlights = processFlightData(flightData);
          
          let imported = 0;
          let errors = 0;
          
          // Inicializar progreso
          setProgress({ current: 0, total: processedFlights.length });
          
          // Importar cada vuelo a Firestore
          for (let i = 0; i < processedFlights.length; i++) {
            const flight = processedFlights[i];
            
            // Actualizar progreso
            setProgress({ current: i + 1, total: processedFlights.length });
            
            try {
              // Verificar si el vuelo ya existe
              const flightQuery = query(
                collection(db, 'flights'),
                where('flight_number', '==', flight.flight_number),
                where('departure_date', '==', flight.departure_date)
              );
              
              const existingFlights = await getDocs(flightQuery);
              
              if (existingFlights.empty) {
                // Añadir el vuelo a Firestore
                await addDoc(collection(db, 'flights'), {
                  ...flight,
                  imported_at: serverTimestamp()
                });
                imported++;
              } else {
                // El vuelo ya existe, lo saltamos
                errors++;
              }
              
              // Actualizar estadísticas mientras avanza
              setStats({
                total: processedFlights.length,
                imported,
                errors
              });
            } catch (error) {
              console.error('Error al importar vuelo:', error);
              errors++;
              
              // Actualizar estadísticas con el error
              setStats({
                total: processedFlights.length,
                imported,
                errors
              });
            }
          }
          
          setStats({
            total: processedFlights.length,
            imported,
            errors
          });
          
          toast.success(`Importación completada: ${imported} vuelos importados`);
          
          // Notificar que la importación ha sido completada
          if (onImportComplete && typeof onImportComplete === 'function') {
            onImportComplete();
          }
          
          // Limpiar el archivo seleccionado después de importar
          setSelectedFile(null);
          // Resetear el input de archivo
          const fileInput = document.getElementById('flight-json-file');
          if (fileInput) fileInput.value = '';
          
        } catch (error) {
          console.error('Error al procesar el archivo JSON:', error);
          toast.error(`Error al procesar el archivo: ${error.message}`);
          setFileError('El archivo no contiene datos de vuelo válidos');
        } finally {
          setImporting(false);
        }
      };
      
      fileReader.onerror = () => {
        toast.error('Error al leer el archivo');
        setImporting(false);
      };
      
      fileReader.readAsText(selectedFile);
      
    } catch (error) {
      console.error('Error al importar vuelos:', error);
      toast.error('Error al importar vuelos');
      setImporting(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Importar Vuelos</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Selecciona un archivo JSON con datos de vuelos para importar a la base de datos.</p>
        </div>
        
        <div className="mt-5">
          <div className="flex items-center justify-center space-x-6">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-amadeus-primary hover:text-amadeus-secondary">
              <span>Seleccionar archivo</span>
              <input 
                id="flight-json-file" 
                name="flight-json-file" 
                type="file" 
                accept=".json,application/json" 
                className="sr-only" 
                onChange={handleFileChange}
                disabled={importing}
              />
            </label>
            <button
              type="button"
              onClick={importFromFile}
              disabled={importing || !selectedFile}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary'
              }`}
            >
              <FiUpload className="-ml-1 mr-2 h-5 w-5" />
              {importing ? `Importando (${progress.current}/${progress.total})` : 'Importar Vuelos'}
            </button>
          </div>
          
          {importing && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700 mb-2">
                Importando vuelos desde {selectedFile?.name}...
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
          
          {selectedFile && !importing && (
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <FiFile className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>Archivo seleccionado: {selectedFile.name}</span>
            </div>
          )}
          
          {fileError && (
            <div className="mt-2 text-sm text-red-600">
              <div className="flex items-center">
                <FiAlertTriangle className="mr-1.5 h-4 w-4" />
                <span>{fileError}</span>
              </div>
            </div>
          )}
        </div>
        
        {!importing && stats.total > 0 && (
          <div className="mt-3 text-sm">
            <div className="flex items-center text-green-600">
              <FiCheck className="mr-1.5 h-4 w-4" />
              <span>Vuelos importados: {stats.imported} de {stats.total}</span>
            </div>
            {stats.errors > 0 && (
              <div className="flex items-center text-amber-600 mt-1">
                <FiAlertTriangle className="mr-1.5 h-4 w-4" />
                <span>Vuelos no importados (duplicados o errores): {stats.errors}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}