// src/components/announcements/AnnouncementCard.jsx
import { FiAlertCircle, FiInfo, FiCheckCircle, FiAlertTriangle, FiStar } from 'react-icons/fi';

/**
 * Componente para mostrar un anuncio individual
 */
export default function AnnouncementCard({ announcement }) {
  // Obtener ícono según el tipo
  const getIcon = () => {
    switch (announcement.type) {
      case 'success':
        return <FiCheckCircle className="flex-shrink-0" size={20} />;
      case 'warning':
        return <FiAlertTriangle className="flex-shrink-0" size={20} />;
      case 'error':
        return <FiAlertCircle className="flex-shrink-0" size={20} />;
      default:
        return <FiInfo className="flex-shrink-0" size={20} />;
    }
  };

  // Obtener colores según el tipo
  const getColors = () => {
    switch (announcement.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          text: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          text: 'text-yellow-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          text: 'text-red-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          text: 'text-blue-800'
        };
    }
  };

  const colors = getColors();

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 relative`}>
      {announcement.pinned && (
        <div className="absolute top-2 right-2">
          <FiStar className="text-yellow-500" size={16} />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={colors.icon}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-semibold ${colors.title}`}>
              {announcement.title}
            </h3>
            {announcement.createdAt && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(announcement.createdAt)}
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm ${colors.text}`}>
            {announcement.content}
          </p>

          {announcement.expiresAt && (
            <p className="mt-2 text-xs text-gray-600">
              Expira: {formatDate(announcement.expiresAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
