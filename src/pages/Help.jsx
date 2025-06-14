// src/pages/Help.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiTerminal, FiSearch, FiChevronDown, FiChevronUp, FiAward, FiTarget } from 'react-icons/fi';

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
      question: "¿Qué es Mozart Trainer?",
      answer: "Mozart Trainer es una plataforma educativa diseñada para simular el entorno de trabajo del sistema de reservas Mozart. Permite a los estudiantes y profesionales practicar comandos y procedimientos en un entorno seguro antes de trabajar con sistemas reales."
    },
    {
      question: "¿Cómo empiezo a usar la terminal?",
      answer: "Puedes comenzar a usar la terminal simplemente escribiendo comandos en el campo de entrada en la página del Dashboard. Prueba comandos simples como 'HELP' o 'HE' para obtener una lista de comandos disponibles."
    },
    {
      question: "¿Los PNRs creados son reales?",
      answer: "No, todos los PNRs y reservas creados en Mozart Trainer son simulados y no tienen impacto en sistemas reales. La plataforma está diseñada exclusivamente para fines educativos."
    },
    {
      question: "¿Puedo ver mis comandos anteriores?",
      answer: "Sí, puedes ver tu historial de comandos en la sección 'Historial de Comandos' del menú lateral. Allí encontrarás todos los comandos que has ejecutado, junto con sus respuestas y la fecha en que fueron realizados."
    },
    {
      question: "¿Cómo puedo cambiar mi contraseña?",
      answer: "Puedes cambiar tu contraseña desde la sección de Perfil, accesible desde el menú desplegable en la esquina superior derecha de la pantalla."
    },
    {
      question: "¿Cómo funcionan los logros en Mozart Trainer?",
      answer: (
        <div>
          <p>Los logros son reconocimientos que se otorgan cuando alcanzas ciertas metas o dominas diferentes aspectos del sistema. Estos se dividen en categorías según su rareza:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><span className="font-semibold">Común:</span> Logros básicos que se consiguen con acciones regulares.</li>
            <li><span className="font-semibold">Poco Común:</span> Requieren más práctica y habilidad para obtenerlos.</li>
            <li><span className="font-semibold">Raro:</span> Representan un dominio considerable de ciertas funcionalidades.</li>
            <li><span className="font-semibold">Épico:</span> Logros difíciles que demuestran experiencia avanzada.</li>
            <li><span className="font-semibold">Legendario:</span> Los más difíciles de conseguir, representan maestría en el sistema.</li>
          </ul>
          <p className="mt-2">Cada logro otorga puntos de experiencia (XP) que contribuyen a tu nivel general en la plataforma. Algunos logros son secretos y solo se revelan cuando los desbloqueas. Puedes ver tus logros en la sección de "Configuración" bajo la pestaña "Cuenta".</p>
        </div>
      )
    },
    {
      question: "¿Qué son los desafíos diarios y cómo funcionan?",
      answer: (
        <div>
          <p>Los desafíos diarios son tareas especiales que se actualizan cada 24 horas y te permiten ganar experiencia extra al completarlos. Estos desafíos están diseñados para:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Fomentar la práctica regular de diferentes funcionalidades del sistema</li>
            <li>Enseñar comandos y técnicas que quizás no usarías normalmente</li>
            <li>Proporcionar objetivos concretos para mejorar tus habilidades</li>
          </ul>
          <p className="mt-2">Ejemplos de desafíos incluyen:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Crear 3 PNRs completos en un día</li>
            <li>Utilizar 5 comandos diferentes de elementos suplementarios (OSI, SSR)</li>
            <li>Realizar búsquedas de disponibilidad para 10 rutas diferentes</li>
          </ul>
          <p className="mt-2">Al completar un desafío, recibirás una bonificación de XP que se sumará automáticamente a tu perfil. Los desafíos se renuevan diariamente y puedes ver tus desafíos activos en la sección "Desafíos" del Dashboard.</p>
        </div>
      )
    },
    {
      question: "¿Cómo puedo subir de nivel y qué beneficios obtengo?",
      answer: (
        <div>
          <p>En Mozart Trainer, subes de nivel acumulando puntos de experiencia (XP) mediante:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Completar PNRs correctamente</li>
            <li>Desbloquear logros</li>
            <li>Realizar desafíos diarios</li>
            <li>Usar diferentes comandos y funcionalidades del sistema</li>
          </ul>
          <p className="mt-2">Cada nivel requiere más XP que el anterior. Subir de nivel te proporciona reconocimiento en la tabla de clasificación y desbloquea desafíos y logros más avanzados. Tu nivel actual se muestra en tu perfil y en la tabla de clasificación.</p>
        </div>
      )
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
      command: "OS - Información Especial",
      description: "Agrega información especial al PNR para las aerolíneas.",
      example: "OS UX PAX VIP WAGNER /P1",
      result: "RP/XXXXX1234/\n1.WAGNER/PETER MR\n2 UX 1234 J 15NOV 1 MADEZE DK1 1200 1400 15NOV E 320\n3 OSI UX PAX VIP WAGNER/P1\n*TRN*"
    },
    {
      command: "SR - Solicitud de Servicio Especial",
      description: "Agrega solicitudes de servicios especiales como comidas o asistencia.",
      example: "SRVGML/P1",
      result: "RP/XXXXX1234/\n1.KUMAR/RAVI MR\n2 UX 1234 J 15NOV 1 MADEZE DK1 1200 1400 15NOV E 320\n3 SSR VGML UX HK1 /S2/P1\n*TRN*"
    },
    {
      command: "SRFOID - Documento de Identidad",
      description: "Agrega información del documento de identidad del pasajero.",
      example: "SRFOID YY HK1-PP12345678/P1",
      result: "RP/XXXXX1234/\n1.SMITH/JOHN MR\n2 IB 1234 J 15NOV 1 MADEZE DK1 1200 1400 15NOV E 320\n3 SSR FOID IB HK1 PP12345678/P1\n*TRN*"
    },
    {
      command: "XE - Borrar Elementos",
      description: "Elimina elementos específicos del PNR actual.",
      example: "XE3",
      result: "RP/XXXXX1234/\n1.GARCIA/JUAN MR\n2 IB 6841 J 15NOV 1 EZEMAD DK1 1310 0530+1 16NOV E 346\n*TRN*"
    },
    {
      command: "XI - Cancelar PNR",
      description: "Inicia el proceso de cancelación del PNR actual (requiere confirmación con RF).",
      example: "XI",
      result: "¿Está seguro de que desea cancelar el PNR ABC123? Use RF seguido de su nombre para confirmar la cancelación."
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
              Guía de referencia para utilizar el sistema Mozart Trainer.
            </p>
            
            {/* Categorías */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amadeus-primary rounded-md p-3">
                      <FiTerminal className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Comandos Frecuentes</h3>
                      <p className="text-sm text-gray-500">
                        Referencia rápida de los comandos más utilizados en Mozart.
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
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                      <FiAward className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Logros</h3>
                      <p className="text-sm text-gray-500">
                        Cómo funcionan los logros y recompensas en el sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <FiTarget className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Desafíos Diarios</h3>
                      <p className="text-sm text-gray-500">
                        Completa desafíos para ganar experiencia extra y mejorar tus habilidades.
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