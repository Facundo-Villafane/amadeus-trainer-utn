// src/pages/admin/Commissions.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiCopy, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    active: true
  });

  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  // Cargar comisiones
  useEffect(() => {
    fetchCommissions();
  }, []);

  async function fetchCommissions() {
    try {
      const commissionsSnapshot = await getDocs(collection(db, 'commissions'));
      const commissionsData = commissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommissions(commissionsData);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Error al cargar las comisiones');
    } finally {
      setLoading(false);
    }
  }

  // Generar código único para la comisión
  function generateCommissionCode() {
    const year = new Date().getFullYear();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const randomNum = Math.floor(Math.random() * 9) + 1;
    return `COM${year}${randomLetter}${randomNum}`;
  }

  // Crear nueva comisión
  async function handleCreateCommission(e) {
    e.preventDefault();
    
    try {
      const code = generateCommissionCode();
      
      const newCommission = {
        ...formData,
        code,
        maxStudents: parseInt(formData.maxStudents) || 30,
        currentStudents: 0,
        students: [],
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      };

      await addDoc(collection(db, 'commissions'), newCommission);
      
      toast.success(`Comisión creada con código: ${code}`);
      setShowCreateModal(false);
      resetForm();
      fetchCommissions();
    } catch (error) {
      console.error('Error creating commission:', error);
      toast.error('Error al crear la comisión');
    }
  }

  // Editar comisión
  async function handleEditCommission(e) {
    e.preventDefault();
    
    try {
      await updateDoc(doc(db, 'commissions', selectedCommission.id), {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxStudents: parseInt(formData.maxStudents) || 30,
        active: formData.active,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Comisión actualizada correctamente');
      setShowEditModal(false);
      setSelectedCommission(null);
      resetForm();
      fetchCommissions();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Error al actualizar la comisión');
    }
  }

  // Eliminar comisión
  async function handleDeleteCommission(commissionId) {
    if (!confirm('¿Estás seguro de eliminar esta comisión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'commissions', commissionId));
      toast.success('Comisión eliminada correctamente');
      fetchCommissions();
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast.error('Error al eliminar la comisión');
    }
  }

  // Copiar código al portapapeles
  function copyToClipboard(code) {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Código copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar:', err);
      toast.error('Error al copiar el código');
    });
  }

  // Reset formulario
  function resetForm() {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      maxStudents: '',
      active: true
    });
  }

  // Abrir modal de edición
  function openEditModal(commission) {
    setSelectedCommission(commission);
    setFormData({
      name: commission.name,
      description: commission.description || '',
      startDate: commission.startDate || '',
      endDate: commission.endDate || '',
      maxStudents: commission.maxStudents || 30,
      active: commission.active
    });
    setShowEditModal(true);
  }

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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Gestión de Comisiones</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Nueva Comisión
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando comisiones...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiantes
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{commission.name}</div>
                            <div className="text-sm text-gray-500">{commission.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{commission.code}</code>
                            <button
                              onClick={() => copyToClipboard(commission.code)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copiar código"
                            >
                              <FiCopy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiUsers className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {commission.currentStudents || 0} / {commission.maxStudents || 30}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {commission.startDate && commission.endDate ? (
                            <div>
                              <div>{new Date(commission.startDate).toLocaleDateString()}</div>
                              <div>{new Date(commission.endDate).toLocaleDateString()}</div>
                            </div>
                          ) : (
                            <span>Sin fecha</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {commission.active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiCheckCircle className="mr-1" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <FiXCircle className="mr-1" />
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(commission)}
                            className="text-amadeus-primary hover:text-amadeus-secondary mr-3"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCommission(commission.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de crear comisión */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateCommission}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Nueva Comisión
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre de la comisión *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ej: Comisión 2024-A"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Descripción opcional de la comisión"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Fecha de inicio
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Fecha de fin
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700">
                        Máximo de estudiantes
                      </label>
                      <input
                        type="number"
                        id="maxStudents"
                        min="1"
                        value={formData.maxStudents}
                        onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="30"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        id="active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                      />
                      <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                        Comisión activa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amadeus-primary text-base font-medium text-white hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Crear Comisión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar comisión */}
      {showEditModal && selectedCommission && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditCommission}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Editar Comisión
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de la comisión
                    </label>
                    <div className="flex items-center">
                      <code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-md">{selectedCommission.code}</code>
                      <span className="ml-2 text-sm text-gray-500">(No editable)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                        Nombre de la comisión *
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        id="edit-description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-startDate" className="block text-sm font-medium text-gray-700">
                          Fecha de inicio
                        </label>
                        <input
                          type="date"
                          id="edit-startDate"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-endDate" className="block text-sm font-medium text-gray-700">
                          Fecha de fin
                        </label>
                        <input
                          type="date"
                          id="edit-endDate"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="edit-maxStudents" className="block text-sm font-medium text-gray-700">
                        Máximo de estudiantes
                      </label>
                      <input
                        type="number"
                        id="edit-maxStudents"
                        min="1"
                        value={formData.maxStudents}
                        onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                        className="mt-1 focus:ring-amadeus-primary focus:border-amadeus-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        id="edit-active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="focus:ring-amadeus-primary h-4 w-4 text-amadeus-primary border-gray-300 rounded"
                      />
                      <label htmlFor="edit-active" className="ml-2 block text-sm text-gray-900">
                        Comisión activa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amadeus-primary text-base font-medium text-white hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCommission(null);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}