// src/components/admin/dataManagement/forms/AirlineForm.jsx
import { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import PropTypes from 'prop-types';

export default function AirlineForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: '',
    country_code: '',
    ...initialData
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {initialData ? 'Editar Aerolínea' : 'Nueva Aerolínea'}
                </h3>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 gap-y-4">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Código IATA (2 letras)
                      </label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        maxLength="2"
                        required
                        value={formData.code}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-amadeus-primary focus:border-amadeus-primary"
                        placeholder="IB"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre de Aerolínea
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-amadeus-primary focus:border-amadeus-primary"
                        placeholder="Iberia"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        País
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-amadeus-primary focus:border-amadeus-primary"
                        placeholder="España"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country_code" className="block text-sm font-medium text-gray-700">
                        Código de País (ISO 2)
                      </label>
                      <input
                        type="text"
                        id="country_code"
                        name="country_code"
                        maxLength="2"
                        value={formData.country_code}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-amadeus-primary focus:border-amadeus-primary"
                        placeholder="ES"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amadeus-primary text-base font-medium text-white hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:ml-3 sm:w-auto sm:text-sm"
            >
              <FiSave className="mr-2" />
              {initialData ? 'Actualizar' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <FiX className="mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

AirlineForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};