// src/pages/admin/BugReportsManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiLoader,
  FiTrash2,
  FiMessageSquare
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import bugReportsService from '../../services/bugReportsService';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

export default function BugReportsManagement() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadReports();
    loadStats();
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const statusFilter = filterStatus === 'all' ? null : filterStatus;
      const data = await bugReportsService.getAllBugReports(statusFilter);
      setReports(data);
    } catch (error) {
      console.error('Error loading bug reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await bugReportsService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
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

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await bugReportsService.updateStatus(reportId, newStatus, currentUser.uid);
      toast.success('Estado actualizado correctamente');
      loadReports();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleAddResponse = async (reportId) => {
    if (!responseText.trim()) {
      toast.error('Por favor escribe una respuesta');
      return;
    }

    try {
      await bugReportsService.addAdminResponse(reportId, responseText, currentUser.uid);
      toast.success('Respuesta agregada correctamente');
      setResponseText('');
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Error al agregar la respuesta');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este reporte?')) {
      return;
    }

    try {
      await bugReportsService.deleteBugReport(reportId);
      toast.success('Reporte eliminado correctamente');
      loadReports();
      loadStats();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
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
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FiAlertCircle className="text-red-600" />
                    Gestión de Reportes de Errores
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Administra los reportes enviados por los estudiantes
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <FiAlertCircle className="text-gray-400" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <FiClock className="text-yellow-400" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">En Progreso</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <FiLoader className="text-blue-400" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Resueltos</p>
                      <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    </div>
                    <FiCheckCircle className="text-green-400" size={32} />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilterStatus('in-progress')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'in-progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                En Progreso
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Resueltos
              </button>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No hay reportes con este filtro</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {report.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status === 'pending' && 'Pendiente'}
                            {report.status === 'in-progress' && 'En Progreso'}
                            {report.status === 'resolved' && 'Resuelto'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Usuario: {report.userEmail}</span>
                          <span>•</span>
                          <span>Categoría: {report.category}</span>
                          <span>•</span>
                          <span className={`font-medium ${getPriorityColor(report.priority)}`}>
                            Prioridad: {report.priority}
                          </span>
                          <span>•</span>
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
                    </div>

                    {report.adminResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          Tu Respuesta:
                        </h4>
                        <p className="text-sm text-blue-800">{report.adminResponse}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      {report.status !== 'resolved' && (
                        <>
                          {report.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(report.id, 'in-progress')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              Marcar En Progreso
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Marcar Resuelto
                          </button>
                        </>
                      )}

                      {!report.adminResponse && (
                        <button
                          onClick={() =>
                            setSelectedReport(selectedReport === report.id ? null : report.id)
                          }
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <FiMessageSquare size={16} />
                          Responder
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(report.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2 ml-auto"
                      >
                        <FiTrash2 size={16} />
                        Eliminar
                      </button>
                    </div>

                    {/* Response Form */}
                    {selectedReport === report.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          rows={3}
                          placeholder="Escribe tu respuesta al usuario..."
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAddResponse(report.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                          >
                            Enviar Respuesta
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(null);
                              setResponseText('');
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
