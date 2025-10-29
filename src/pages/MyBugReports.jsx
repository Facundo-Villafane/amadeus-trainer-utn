// src/pages/MyBugReports.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { FiAlertCircle, FiClock, FiCheckCircle, FiLoader } from 'react-icons/fi';
import bugReportsService from '../services/bugReportsService';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import BugReportModal from '../components/bugReports/BugReportModal';

export default function MyBugReports() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadReports();
    }
  }, [currentUser]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await bugReportsService.getUserBugReports(currentUser.uid);
      setReports(data);
    } catch (error) {
      console.error('Error loading bug reports:', error);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in-progress':
        return 'En Progreso';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="inline mr-1" size={16} />;
      case 'in-progress':
        return <FiLoader className="inline mr-1" size={16} />;
      case 'resolved':
        return <FiCheckCircle className="inline mr-1" size={16} />;
      default:
        return null;
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FiAlertCircle className="text-red-600" />
                    Mis Reportes de Errores
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Revisa el estado de los errores que has reportado
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FiAlertCircle />
                  Reportar Nuevo Error
                </button>
              </div>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FiAlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No has reportado ningún error
                </h3>
                <p className="text-gray-600 mb-4">
                  Si encuentras algún problema, ¡no dudes en reportarlo!
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reportar Error
                </button>
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
                            {getStatusIcon(report.status)}
                            {getStatusText(report.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Categoría: {report.category}</span>
                          <span>•</span>
                          <span>Prioridad: {report.priority}</span>
                          <span>•</span>
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>

                    {report.adminResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          Respuesta del Administrador:
                        </h4>
                        <p className="text-sm text-blue-800">{report.adminResponse}</p>
                        {report.respondedAt && (
                          <p className="text-xs text-blue-600 mt-2">
                            {formatDate(report.respondedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {report.status === 'resolved' && report.resolvedAt && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <p className="text-sm text-green-800">
                          ✅ Resuelto el {formatDate(report.resolvedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          loadReports();
        }}
        userId={currentUser?.uid}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
