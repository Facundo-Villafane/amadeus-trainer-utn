// src/pages/admin/AnnouncementsManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiArrowLeft, FiStar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import announcementsService from '../../services/announcementsService';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

export default function AnnouncementsManagement() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    published: true,
    pinned: false,
    expiresAt: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsService.getAllAnnouncements(50);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Error al cargar los avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null
      };

      if (editingAnnouncement) {
        await announcementsService.updateAnnouncement(editingAnnouncement.id, dataToSave);
        toast.success('Aviso actualizado correctamente');
      } else {
        await announcementsService.createAnnouncement(dataToSave, currentUser.uid);
        toast.success('Aviso creado correctamente');
      }

      setShowModal(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Error al guardar el aviso');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'info',
      priority: announcement.priority || 'medium',
      published: announcement.published !== false,
      pinned: announcement.pinned || false,
      expiresAt: announcement.expiresAt
        ? announcement.expiresAt.toDate().toISOString().split('T')[0]
        : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este aviso?')) {
      return;
    }

    try {
      await announcementsService.deleteAnnouncement(announcementId);
      toast.success('Aviso eliminado correctamente');
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Error al eliminar el aviso');
    }
  };

  const handleTogglePublished = async (announcement) => {
    try {
      await announcementsService.togglePublished(announcement.id, !announcement.published);
      toast.success(announcement.published ? 'Aviso ocultado' : 'Aviso publicado');
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast.error('Error al cambiar el estado de publicación');
    }
  };

  const handleTogglePinned = async (announcement) => {
    try {
      await announcementsService.togglePinned(announcement.id, !announcement.pinned);
      toast.success(announcement.pinned ? 'Aviso desfijado' : 'Aviso fijado');
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling pinned status:', error);
      toast.error('Error al cambiar el estado de fijado');
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      published: true,
      pinned: false,
      expiresAt: ''
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <FiArrowLeft className="mr-2" />
                Volver al inicio
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Gestión de Avisos</h1>
                  <p className="text-gray-600 mt-1">
                    Administra los avisos importantes del sistema
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FiPlus className="mr-2" />
                  Nuevo Aviso
                </button>
              </div>
            </div>

            {/* Announcements List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No hay avisos creados</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {announcements.map((announcement) => (
                      <tr key={announcement.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {announcement.pinned && (
                              <FiStar className="text-yellow-500 mr-2" size={14} />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {announcement.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {announcement.content.substring(0, 60)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded ${getTypeColor(
                              announcement.type
                            )}`}
                          >
                            {announcement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {announcement.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              announcement.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {announcement.published ? 'Publicado' : 'Oculto'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePinned(announcement)}
                              className={`${
                                announcement.pinned
                                  ? 'text-indigo-600'
                                  : 'text-gray-400'
                              } hover:text-indigo-900`}
                              title={announcement.pinned ? 'Desfijar' : 'Fijar'}
                            >
                              <FiStar size={18} />
                            </button>
                            <button
                              onClick={() => handleTogglePublished(announcement)}
                              className="text-gray-600 hover:text-gray-900"
                              title={announcement.published ? 'Ocultar' : 'Publicar'}
                            >
                              {announcement.published ? (
                                <FiEyeOff size={18} />
                              ) : (
                                <FiEye size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(announcement)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(announcement.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
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

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAnnouncement ? 'Editar Aviso' : 'Nuevo Aviso'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Título del aviso"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="Contenido del aviso"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="info">Información</option>
                      <option value="success">Éxito</option>
                      <option value="warning">Advertencia</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Expiración (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({ ...formData, published: e.target.checked })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                      Publicar inmediatamente
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={formData.pinned}
                      onChange={(e) =>
                        setFormData({ ...formData, pinned: e.target.checked })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pinned" className="ml-2 block text-sm text-gray-700">
                      Fijar al inicio
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingAnnouncement ? 'Actualizar' : 'Crear'}
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
