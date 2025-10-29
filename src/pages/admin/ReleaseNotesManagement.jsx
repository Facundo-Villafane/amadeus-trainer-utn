// src/pages/admin/ReleaseNotesManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import releaseNotesService from '../../services/releaseNotesService';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

export default function ReleaseNotesManagement() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    content: '',
    tags: [],
    published: true,
    releaseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReleaseNotes();
  }, []);

  const loadReleaseNotes = async () => {
    try {
      setLoading(true);
      const notes = await releaseNotesService.getAllReleaseNotes(50);
      setReleaseNotes(notes);
    } catch (error) {
      console.error('Error loading release notes:', error);
      toast.error('Error al cargar las notas de versión');
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

    if (!formData.version || !formData.title || !formData.content) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      if (editingNote) {
        // Actualizar nota existente
        await releaseNotesService.updateReleaseNote(editingNote.id, formData);
        toast.success('Nota de versión actualizada correctamente');
      } else {
        // Crear nueva nota
        await releaseNotesService.createReleaseNote(formData, currentUser.uid);
        toast.success('Nota de versión creada correctamente');
      }

      setShowModal(false);
      resetForm();
      loadReleaseNotes();
    } catch (error) {
      console.error('Error saving release note:', error);
      toast.error('Error al guardar la nota de versión');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      version: note.version,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      published: note.published !== false,
      releaseDate: note.releaseDate?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta nota de versión?')) {
      return;
    }

    try {
      await releaseNotesService.deleteReleaseNote(noteId);
      toast.success('Nota de versión eliminada correctamente');
      loadReleaseNotes();
    } catch (error) {
      console.error('Error deleting release note:', error);
      toast.error('Error al eliminar la nota de versión');
    }
  };

  const handleTogglePublished = async (note) => {
    try {
      await releaseNotesService.togglePublished(note.id, !note.published);
      toast.success(
        note.published ? 'Nota de versión ocultada' : 'Nota de versión publicada'
      );
      loadReleaseNotes();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast.error('Error al cambiar el estado de publicación');
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setFormData({
      version: '',
      title: '',
      content: '',
      tags: [],
      published: true,
      releaseDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove)
    });
  };

  const availableTags = [
    'feature',
    'bugfix',
    'enhancement',
    'breaking',
    'security',
    'performance',
    'documentation'
  ];

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
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Release Notes
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Administra las notas de versión del sistema
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
                  Nueva Nota
                </button>
              </div>
            </div>

            {/* Release Notes List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : releaseNotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No hay notas de versión creadas</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Versión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
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
                    {releaseNotes.map((note) => (
                      <tr key={note.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            v{note.version}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{note.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(note.releaseDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {note.tags?.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              note.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {note.published ? 'Publicada' : 'Oculta'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePublished(note)}
                              className="text-gray-600 hover:text-gray-900"
                              title={
                                note.published ? 'Ocultar' : 'Publicar'
                              }
                            >
                              {note.published ? (
                                <FiEyeOff size={18} />
                              ) : (
                                <FiEye size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(note)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingNote ? 'Editar Nota de Versión' : 'Nueva Nota de Versión'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versión *
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) =>
                        setFormData({ ...formData, version: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="1.0.0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Release *
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, releaseDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Título de la release"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido * (Markdown)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    rows={12}
                    placeholder="## Nuevas características&#10;- Feature 1&#10;- Feature 2&#10;&#10;## Correcciones&#10;- Bug fix 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter((tag) => !formData.tags.includes(tag))
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-100"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>

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
                  <label
                    htmlFor="published"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Publicar inmediatamente
                  </label>
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
                    {editingNote ? 'Actualizar' : 'Crear'}
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
