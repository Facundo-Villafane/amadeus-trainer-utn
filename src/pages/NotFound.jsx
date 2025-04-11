// src/pages/NotFound.jsx
import { Link } from 'react-router';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
            <FiAlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Error 404
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Lo sentimos, la página que estás buscando no existe.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary"
          >
            <FiHome className="mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}