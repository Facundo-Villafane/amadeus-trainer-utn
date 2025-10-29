// src/pages/admin/components/ClassAvailabilityEditor.jsx
import React, { useState, useEffect } from 'react';

/**
 * Componente para editar la disponibilidad de clases en vuelos
 */
export default function ClassAvailabilityEditor({ value, onChange }) {
  // Clases de reserva comunes en sistemas de distribución
  const commonClasses = ['F', 'A', 'J', 'C', 'D', 'I', 'W', 'S', 'Y', 'B', 'M', 'H', 'K', 'L', 'Q', 'T', 'V', 'X'];
  
  // Estado local
  const [classAvailability, setClassAvailability] = useState(value || {});
  const [selectedClass, setSelectedClass] = useState('');
  
  // Actualizar estado cuando cambian los props
  useEffect(() => {
    setClassAvailability(value || {});
  }, [value]);
  
  // Añadir una nueva clase
  const addClass = () => {
    if (!selectedClass || classAvailability[selectedClass] !== undefined) return;
    
    const newState = {
      ...classAvailability,
      [selectedClass]: 9 // Valor predeterminado
    };
    
    setClassAvailability(newState);
    onChange(newState);
    setSelectedClass('');
  };
  
  // Eliminar una clase
  const removeClass = (classCode) => {
    const newState = { ...classAvailability };
    delete newState[classCode];
    
    setClassAvailability(newState);
    onChange(newState);
  };
  
  // Actualizar la disponibilidad de una clase
  const updateAvailability = (classCode, seats) => {
    const newState = {
      ...classAvailability,
      [classCode]: parseInt(seats, 10)
    };
    
    setClassAvailability(newState);
    onChange(newState);
  };
  
  // Clasificar las clases por categoría
  const classGroups = {
    first: ['F', 'A', 'P'], // First Class
    business: ['J', 'C', 'D', 'I', 'Z', 'R'], // Business Class
    premium: ['W', 'E', 'T', 'U'], // Premium Economy
    economy: ['Y', 'B', 'M', 'H', 'K', 'L', 'Q', 'S', 'V', 'X', 'N', 'O', 'G'] // Economy
  };
  
  // Determinar la categoría de la clase
  const getClassCategory = (classCode) => {
    if (classGroups.first.includes(classCode)) return 'Primera Clase';
    if (classGroups.business.includes(classCode)) return 'Clase Business';
    if (classGroups.premium.includes(classCode)) return 'Premium Economy';
    return 'Clase Económica';
  };
  
  // Organizar las clases por categoría
  const organizedClasses = Object.entries(classAvailability).reduce((acc, [classCode, seats]) => {
    const category = getClassCategory(classCode);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ classCode, seats });
    return acc;
  }, {});
  
  return (
    <div className="mt-4 col-span-2">
      <h3 className="text-base font-medium text-gray-900 mb-4">Disponibilidad por Clase</h3>
      
      {/* Secciones de clases agrupadas por categoría */}
      <div className="space-y-4">
        {Object.entries(organizedClasses).map(([category, classes]) => (
          <div key={category} className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
            <div className="space-y-3">
              {classes.map(({ classCode, seats }) => (
                <div key={classCode} className="bg-white p-4 rounded-md border border-gray-200 relative">
                  <button
                    type="button"
                    onClick={() => removeClass(classCode)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="font-mono font-bold text-blue-600">{classCode}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Disponibles</div>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={seats}
                        onChange={(e) => updateAvailability(classCode, e.target.value)}
                        className="mt-1 block w-16 py-1 px-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selector para añadir nuevas clases */}
      <div className="mt-4 flex items-center">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Clase</option>
          {commonClasses
            .filter(cls => !classAvailability[cls])
            .map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
        </select>
        <button
          type="button"
          onClick={addClass}
          disabled={!selectedClass}
          className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Añadir clase
        </button>
      </div>
      
      {/* Mensaje informativo */}
      <div className="mt-4 bg-blue-50 p-3 rounded-md flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="ml-3 text-sm text-blue-700">
          Los valores deben estar entre 0 y 9. Valor 0 indica clase cerrada.
        </p>
      </div>
    </div>
  );
}