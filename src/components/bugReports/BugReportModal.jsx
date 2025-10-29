// src/components/bugReports/BugReportModal.jsx
import { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import bugReportsService from '../../services/bugReportsService';

export default function BugReportModal({ isOpen, onClose, userId, userEmail }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      await bugReportsService.createBugReport(formData, userId, userEmail);
      toast.success('Reporte enviado correctamente. ¡Gracias por tu colaboración!');
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      onClose();
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Error al enviar el reporte');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reportar un Error</h2>
                <p className="text-sm text-gray-600">
                  Ayúdanos a mejorar el sistema reportando cualquier problema que encuentres
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del Error *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: El comando AN no muestra resultados"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Detallada *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={6}
                placeholder="Describe qué estabas haciendo cuando ocurrió el error, qué esperabas que pasara y qué pasó en realidad..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Mientras más detalles proporciones, más fácil será solucionar el problema
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="terminal">Terminal/Comandos</option>
                  <option value="pnr">PNR</option>
                  <option value="flights">Vuelos</option>
                  <option value="ui">Interfaz de Usuario</option>
                  <option value="performance">Rendimiento</option>
                  <option value="other">Otro</option>
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
                  <option value="low">Baja (Cosmético)</option>
                  <option value="medium">Media (Molesto pero funciona)</option>
                  <option value="high">Alta (No puedo continuar)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
