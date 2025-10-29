// src/pages/admin/components/Pagination.jsx
import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Componente de paginación reutilizable
 */
export default function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  shownItems,
  onPreviousPage, 
  onNextPage 
}) {
  return (
    <div className="mt-4 flex justify-between items-center">
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{shownItems}</span> de{' '}
        <span className="font-medium">{totalItems}</span> vuelos
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
            currentPage === 1
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <FiChevronLeft className="mr-1" /> Anterior
        </button>
        <button
          onClick={onNextPage}
          disabled={shownItems < itemsPerPage}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
            shownItems < itemsPerPage
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Siguiente <FiChevronRight className="ml-1" />
        </button>
      </div>
    </div>
  );
}