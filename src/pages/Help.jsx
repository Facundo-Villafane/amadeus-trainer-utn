// src/pages/Help.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiTerminal, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Componente de Acordeón para preguntas frecuentes
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200">
      <button
        className="flex items-center justify-between w-full py-4 px-2 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <FiChevronUp className="h-5 w-5 text-amadeus-primary" />
        ) : (
          <FiChevronDown className="h-5 w-5 text-amadeus-primary" />
        )}
      </button>
      
      {isOpen && (
        <div className="pb-4 px-2">
          <div className="text-gray-600 text-base">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Tarjeta de Comando
function CommandCard({ command, description, example, result }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-amadeus-dark px-4 py-2">
        <h3 className="text-lg font-mono text-white">{command}</h3>
      </div>
      <div className="p-4">
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="bg-gray-100 p-3 rounded-md">
          <div className="font-mono text-sm text-amadeus-primary">
            <span className="text-gray-500">{'>'}</span> {example}
          </div>
          {result && (
            <div className="mt-2 font-mono text-xs text-gray-700 whitespace-pre-wrap">
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // Datos para la página de ayuda
  const faqItems = [
    {
      question: "¿Qué es Amadeus Trainer?",
      answer: "Amadeus Trainer es una plataforma educativa diseñada para simular el entorno de trabajo del sistema de reservas Amadeus. Permite a los estudiantes y profesionales practicar comandos y procedimientos en un entorno seguro antes de trabajar con sistemas reales."
    },
    {
      question: "¿Cómo empiezo a usar la terminal?",
      answer: "Puedes comenzar a usar la terminal simplemente escribiendo comandos en el campo de entrada en la página del Dashboard. Prueba comandos simples como 'HELP' o 'HE' para obtener una lista de comandos disponibles."
    },
    {
      question: "¿Los PNRs creados son reales?",
      answer: "No, todos los PNRs y reservas creados en Amadeus Trainer son simulados y no tienen impacto en sistemas reales. La plataforma está diseñada exclusivamente para fines educativos."
    },
    {
      question: "¿Puedo ver mis comandos anteriores?",
      answer: "Sí, puedes ver tu historial de comandos en la sección 'Historial de Comandos' del menú lateral. Allí encontrarás todos los comandos que has ejecutado, junto con sus respuestas y la fecha en que fueron realizados."
    },
    {
      question: "¿Cómo puedo cambiar mi contraseña?",
      answer: "Puedes cambiar tu contraseña desde la sección de Perfil, accesible desde el menú desplegable en la esquina superior derecha de la pantalla."
    }
  ];
  
  const commonCommands = [
    {
      command: "HELP o HE",
      description: "Muestra ayuda general sobre los comandos disponibles.",
      example: "HELP",
      result: "COMANDOS DISPONIBLES:\n\nAYUDA:\nHE                      Despliega este mensaje de ayuda\nHE[COMANDO]             Ayuda específica sobre un comando\n\nCODIFICACIÓN/DECODIFICACIÓN:\nDAN[CIUDAD]             Codificar ciudad/aeropuerto\nDAC[CÓDIGO]             Decodificar ciudad/aeropuerto\nDNA[AEROLÍNEA]          Codificar aerolínea\n..."
    },
    {
      command: "AN - Disponibilidad",
      description: "Muestra vuelos disponibles entre dos ciudades en una fecha específica.",
      example: "AN15NOVBUEMAD",
      result: "** AMADEUS AVAILABILITY - AN ** MAD MADRID.ES 183 MO 15NOV 0000\n1 IB 6841 J4 C4 D4 Y9 B9 H9 K9 EZE 1 MAD 1 1310 0530+1E0/346 12:20\nM9 L9 V9 Q9 S9\n2 AR 1132 J2 C2 Y7 B7 K7 H7 Q7 EZE A MAD 3 2350 1605+1E0/332 12:15\nL7 T7 V7 X7 Z7"
    },
    {
      command: "SS - Selección de Asientos",
      description: "Selecciona asientos en un vuelo específico.",
      example: "SS1J1",
      result: "RP/XXXXX1234/\n1 IB 6841 J 15NOV 1 EZEMAD DK1 1310 0530+1 16NOV E 346\n*TRN*"
    },
    {
      command: "NM - Agregar Nombres",
      description: "Agrega nombres de pasajeros a la reserva.",
      example: "NM1GARCIA/JUAN MR",
      result: "RP/XXXXX1234/\n1.GARCIA/JUAN MR\n2 IB 6841 J 15NOV 1 EZEMAD DK1 1310 0530+1 16NOV E 346\n*TRN*"
    },
    {
      command: "RT - Recuperar PNR",
      description: "Recupera un PNR por su código localizador.",
      example: "RTABC123",
      result: "---RLR---\nRP/XXXXX1234/AGENT FF/WE 01JAN/1200Z ABC123\n1.PEREZ/JUAN MR\n2 AR 1132 Y 10JUN 1 EZEMAD HK1 2350 1605+1 11JUN E 332\n3 AR 1133 Y 20JUN 1 MADEZE HK1 2210 0610+1 21JUN E 332\n4 AP BUE 1122334455-M\n5 TK TL05JUN/1200\n*TRN*"
    }
  ];
  
  // Filtrar comandos por término de búsqueda
  const filteredCommands = commonCommands.filter(cmd => 
    cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.example.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Manejar cierre de sesión
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar userRole={userRole} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Centro de Ayuda</h1>
            <p className="mt-1 text-sm text-gray-500">
              Guía de referencia para utilizar el sistema Amadeus Trainer.
            </p>
            
            {/* Categorías */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amadeus-primary rounded-md p-3">
                      <FiTerminal className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Comandos Frecuentes</h3>
                      <p className="text-sm text-gray-500">
                        Referencia rápida de los comandos más utilizados en Amadeus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amadeus-primary rounded-md p-3">
                      <FiSearch className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Preguntas Frecuentes</h3>
                      <p className="text-sm text-gray-500">
                        Respuestas a las preguntas más comunes sobre la plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comandos Frecuentes */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Comandos Frecuentes</h2>
              
              {/* Search Bar */}
              <div className="mt-4 flex items-center max-w-md">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                    placeholder="Buscar comandos"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredCommands.map((cmd, idx) => (
                  <CommandCard key={idx} {...cmd} />
                ))}
              </div>
            </div>
            
            {/* FAQs */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Preguntas Frecuentes</h2>
              
              <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {faqItems.map((item, idx) => (
                    <FAQItem key={idx} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}