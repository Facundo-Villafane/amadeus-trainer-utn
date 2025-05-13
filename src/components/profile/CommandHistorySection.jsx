// src/components/profile/CommandHistorySection.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiSearch, FiCalendar, FiClock, FiFilter, FiCheck, FiX, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CommandHistorySection() {
  const { currentUser } = useAuth();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandTypes, setCommandTypes] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterSuccess, setFilterSuccess] = useState('all');

  // Cargar historial de comandos del usuario
  useEffect(() => {
    const fetchCommandHistory = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const querySnapshot = await getDocs(
          query(
            collection(db, 'commandHistory'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(100)
          )
        );
        
        const commandsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          isSuccessful: doc.data().isSuccessful !== false
        }));
        
        // Extraer tipos de comandos únicos para el filtro
        const uniqueTypes = [...new Set(commandsData.map(cmd => cmd.commandType).filter(Boolean))];
        setCommandTypes(uniqueTypes);
        setCommands(commandsData);
      } catch (error) {
        console.error('Error al cargar historial de comandos:', error);
        toast.error('Error al cargar el historial de comandos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommandHistory();
  }, [currentUser]);
  
  // Filtrar comandos por búsqueda y tipo
  const filteredCommands = commands.filter(cmd => {
    // Filtrar por texto de búsqueda
    const matchesSearch = cmd.command?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         cmd.result?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por tipo de comando
    const matchesType = filterType === 'all' || cmd.commandType === filterType;
    
    // Filtrar por éxito/error
    const matchesSuccess = filterSuccess === 'all' || 
                          (filterSuccess === 'success' && cmd.isSuccessful) || 
                          (filterSuccess === 'error' && !cmd.isSuccessful);
    
    return matchesSearch && matchesType && matchesSuccess;
  });
  
  // Agrupar comandos por fecha
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const date = command.timestamp.toLocaleDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(command);
    return groups;
  }, {});

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FiList className="mr-2" />
        Historial de Comandos
      </h2>
      
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
              placeholder="Buscar comandos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
          >
            <option value="all">Todos los tipos</option>
            {commandTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="w-40">
          <select
            value={filterSuccess}
            onChange={(e) => setFilterSuccess(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
          >
            <option value="all">Todos</option>
            <option value="success">Exitosos</option>
            <option value="error">Con errores</option>
          </select>
        </div>
      </div>
      
      {/* Listado de comandos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando historial...</div>
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500">No se encontraron comandos con los filtros seleccionados.</div>
        </div>
      ) : (
        <div>
          {Object.entries(groupedCommands).map(([date, dateCommands]) => (
            <div key={date} className="mb-8">
              <div className="flex items-center mb-4">
                <FiCalendar className="text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">{date}</h3>
              </div>
              
              <div className="space-y-3">
                {dateCommands.map((command) => (
                  <CommandItem key={command.id} command={command} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Command Item Component - for better separation of concerns
function CommandItem({ command }) {
  const [showFullResponse, setShowFullResponse] = useState(false);
  
  // Determine if the response is long enough to truncate
  const isLongResponse = command.response && command.response.length > 300;
  
  return (
    <div 
      className={`bg-gray-50 p-4 rounded-lg border ${
        command.isSuccessful ? 'border-green-200' : 'border-red-200'
      }`}
    >
      <div className="flex justify-between mb-2">
        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {command.command}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <FiClock className="mr-1" />
          {command.timestamp.toLocaleTimeString()}
          {command.isSuccessful ? (
            <span className="ml-2 text-green-600 flex items-center">
              <FiCheck className="mr-1" /> Exitoso
            </span>
          ) : (
            <span className="ml-2 text-red-600 flex items-center">
              <FiX className="mr-1" /> Error
            </span>
          )}
        </div>
      </div>
      
      {/* Tipo y resultado */}
      <div className="flex justify-between text-xs">
        <div>
          <span className="font-medium text-gray-700">Tipo:</span>{' '}
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {command.commandType || 'UNKNOWN'}
          </span>
        </div>
        {command.result && (
          <div className="text-gray-600 truncate max-w-md">
            <span className="font-medium text-gray-700">Resultado:</span> {command.result}
          </div>
        )}
      </div>
      
      {/* Mostrar respuesta si existe */}
      {command.response && (
        <div className="mt-2 text-xs">
          <div className="font-medium text-gray-700 mb-1">Respuesta:</div>
          <div className="bg-white p-2 rounded border border-gray-200 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {isLongResponse && !showFullResponse ? (
              <>
                {command.response.substring(0, 300)}...{' '}
                <button 
                  onClick={() => setShowFullResponse(true)}
                  className="text-amadeus-primary hover:underline"
                >
                  Ver más
                </button>
              </>
            ) : (
              <>
                {command.response}
                {isLongResponse && (
                  <button 
                    onClick={() => setShowFullResponse(false)}
                    className="block mt-1 text-amadeus-primary hover:underline"
                  >
                    Ver menos
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mostrar error si existe */}
      {command.error && (
        <div className="mt-2 text-xs">
          <div className="font-medium text-red-600 mb-1">Error:</div>
          <div className="bg-red-50 p-2 rounded border border-red-200 text-red-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {command.error}
          </div>
        </div>
      )}
    </div>
  );
}