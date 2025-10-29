// src/components/releaseNotes/ReleaseNotesCard.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCalendar, FiTag } from 'react-icons/fi';

/**
 * Componente para mostrar una release note individual
 */
export default function ReleaseNotesCard({ releaseNote }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtener color del tag
  const getTagColor = (tag) => {
    const colors = {
      feature: 'bg-blue-100 text-blue-800',
      bugfix: 'bg-red-100 text-red-800',
      enhancement: 'bg-green-100 text-green-800',
      breaking: 'bg-orange-100 text-orange-800',
      security: 'bg-purple-100 text-purple-800',
      performance: 'bg-yellow-100 text-yellow-800',
      documentation: 'bg-gray-100 text-gray-800'
    };
    return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Renderizar contenido markdown simplificado
  const renderContent = (content) => {
    if (!content) return null;

    // Split por líneas
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-md font-semibold text-gray-800 mt-3 mb-1">{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.substring(2)}</h1>;
      }

      // Lista
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4 text-gray-700">
            {line.substring(2)}
          </li>
        );
      }

      // Párrafo normal
      if (line.trim() === '') {
        return <br key={index} />;
      }

      return <p key={index} className="text-gray-700 mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                v{releaseNote.version}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <FiCalendar className="mr-1" size={14} />
                {formatDate(releaseNote.releaseDate)}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {releaseNote.title}
            </h3>
            {releaseNote.tags && releaseNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {releaseNote.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tag)}`}
                  >
                    <FiTag className="mr-1" size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="ml-4 text-gray-400 hover:text-gray-600">
            {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <div className="prose prose-sm max-w-none">
            {renderContent(releaseNote.content)}
          </div>
        </div>
      )}
    </div>
  );
}
