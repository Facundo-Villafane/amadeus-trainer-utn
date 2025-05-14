// src/pages/Home.jsx
import { Link } from 'react-router';
import { FaPlay, FaUserGraduate, FaChalkboardTeacher, FaAward, FaTrophy, FaGraduationCap, FaUniversity } from 'react-icons/fa';
import { FiTarget, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="bg-amadeus-dark text-white">
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-9xl">
              <span className="font-leckerli font-extralight">Mozart</span>
            </h1>
            <p className="mt-2 text-xl max-w-3xl mx-auto">
              GDS Training Simulator
            </p>
            <p className="mt-24 text-xl max-w-3xl mx-auto">
              Plataforma educativa para la asignatura de Billetaje y Reservas de la Tecnicatura Universitaria en Gestión Aeronáutica - UTN
            </p>
            <div className="mt-6 text-lg max-w-3xl mx-auto">
              <p>Aprende el sistema de reservas Mozart de forma práctica y autogestionada</p>
            </div>
            <div className="mt-10 flex justify-center">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-amadeus-primary bg-white hover:bg-gray-50"
                >
                  <FaPlay className="mr-2" />
                  Ir al Dashboard
                </Link>
              ) : (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-amadeus-primary bg-white hover:bg-gray-50"
                  >
                    Iniciar Sesión
                  </Link>
                  
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About UTN Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-amadeus-primary font-semibold tracking-wide uppercase">Sobre la plataforma</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Formación académica especializada
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <FaUniversity className="h-8 w-8 text-amadeus-primary mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Universidad Tecnológica Nacional</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Mozart Trainer ha sido diseñado específicamente para los estudiantes de la <strong>Tecnicatura Universitaria en Gestión Aeronáutica</strong> de la UTN como herramienta complementaria para la asignatura de <strong>Billetaje y Reservas</strong>.
                </p>
                <p className="text-gray-700">
                  Esta plataforma permite a los estudiantes practicar de manera autogestionada los comandos y procedimientos del sistema de reservas Mozart, tal como se utiliza en la industria de viajes y turismo, preparando a los futuros profesionales con experiencia práctica.
                </p>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <FaGraduationCap className="h-8 w-8 text-amadeus-primary mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Aprendizaje autodirigido</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Mozart Trainer fomenta el aprendizaje independiente, permitiendo a los estudiantes practicar a su propio ritmo en un entorno virtual que simula el sistema real.
                </p>
                <p className="text-gray-700">
                  Los profesores pueden hacer seguimiento del progreso de cada estudiante a través del panel de administración, analizando su rendimiento y ofreciendo orientación cuando sea necesario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-amadeus-primary font-semibold tracking-wide uppercase">Características</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Aprende Mozart como un profesional
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nuestra plataforma simula el entorno real de Mozart permitiéndote practicar y aprender de manera efectiva.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-amadeus-primary text-white">
                  <FaChalkboardTeacher className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Terminal realista</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Trabaja con una terminal que simula la experiencia real de Mozart, con los mismos comandos y respuestas.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-amadeus-primary text-white">
                  <FaUserGraduate className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Seguimiento de progreso</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Los profesores pueden hacer seguimiento del progreso de sus alumnos, revisar comandos y evaluar su desempeño.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-amadeus-primary text-white">
                  <FaPlay className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Aprende haciendo</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Crea reservas, consulta vuelos, y maneja PNRs en un entorno seguro antes de trabajar con clientes reales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-amadeus-primary font-semibold tracking-wide uppercase">Sistema de Gamificación</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Aprende mientras compites y ganas
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Hemos implementado elementos de juego para hacer tu aprendizaje más motivador y efectivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logros */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-yellow-500 p-3 rounded-md">
                  <FaTrophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-3 text-xl font-medium text-gray-900">Logros</h3>
              </div>
              <p className="text-gray-600">
                Desbloquea logros a medida que dominas diferentes aspectos del sistema, desde crear tu primer PNR hasta completar reservas complejas con múltiples segmentos.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Común</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Poco común</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Raro</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Legendario</span>
              </div>
            </div>

            {/* Desafíos diarios */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-green-500 p-3 rounded-md">
                  <FiTarget className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-3 text-xl font-medium text-gray-900">Desafíos diarios</h3>
              </div>
              <p className="text-gray-600">
                Completa desafíos que se renuevan cada día para ganar experiencia extra y mejorar tus habilidades. Desde crear varios PNRs hasta utilizar comandos específicos.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Ejemplo: <span className="font-medium">Crea 3 PNRs completos hoy</span></p>
                <p>Recompensa: <span className="font-medium text-green-600">+50 XP</span></p>
              </div>
            </div>

            {/* Niveles */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-blue-500 p-3 rounded-md">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-3 text-xl font-medium text-gray-900">Niveles</h3>
              </div>
              <p className="text-gray-600">
                Sube de nivel a medida que ganas experiencia (XP) completando PNRs, desbloqueando logros y completando desafíos. Cada nivel te acerca más a convertirte en un experto.
              </p>
              <div className="mt-4 bg-gray-200 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">Nivel 5 - 75% para el nivel 6</p>
            </div>

            {/* Tabla de clasificación */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-purple-500 p-3 rounded-md">
                  <FaAward className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-3 text-xl font-medium text-gray-900">Clasificación</h3>
              </div>
              <p className="text-gray-600">
                Compite con tus compañeros de clase en la tabla de clasificación. Ve quién consigue más puntos, completa más PNRs correctamente y desbloquea más logros.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="bg-yellow-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    <span className="text-sm">María García</span>
                  </span>
                  <span className="text-sm font-medium">2,450 XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="bg-gray-300 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    <span className="text-sm">Juan Pérez</span>
                  </span>
                  <span className="text-sm font-medium">2,120 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-amadeus-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">¿Listo para comenzar?</span>
            
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-amadeus-primary bg-white hover:bg-gray-50"
              >
                Comenzar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}