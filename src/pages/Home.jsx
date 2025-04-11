// src/pages/Home.jsx
import { Link } from 'react-router';
import { FaPlay, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="bg-amadeus-primary text-white">
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Amadeus Trainer
            </h1>
            <p className="mt-6 text-xl max-w-2xl mx-auto">
              La plataforma educativa para aprender el sistema de reservas Amadeus a través de la práctica.
            </p>
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
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amadeus-secondary hover:bg-amadeus-dark"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-amadeus-primary font-semibold tracking-wide uppercase">Características</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Aprende Amadeus como un profesional
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nuestra plataforma simula el entorno real de Amadeus permitiéndote practicar y aprender de manera efectiva.
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
                    Trabaja con una terminal que simula la experiencia real de Amadeus, con los mismos comandos y respuestas.
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

      {/* CTA Section */}
      <div className="bg-amadeus-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">¿Listo para comenzar?</span>
            <span className="block text-amadeus-accent">Regístrate hoy mismo.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/signup"
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