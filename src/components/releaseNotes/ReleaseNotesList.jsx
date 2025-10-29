// src/components/releaseNotes/ReleaseNotesList.jsx
import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import releaseNotesService from '../../services/releaseNotesService';
import ReleaseNotesCard from './ReleaseNotesCard';

/**
 * Componente para listar todas las release notes
 */
export default function ReleaseNotesList({ limitCount = 5 }) {
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReleaseNotes();
  }, [limitCount]);

  const loadReleaseNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const notes = await releaseNotesService.getPublishedReleaseNotes(limitCount);
      setReleaseNotes(notes);
    } catch (err) {
      console.error('Error loading release notes:', err);
      setError('Error al cargar las notas de versión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiAlertCircle className="text-red-600 mr-2" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (releaseNotes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No hay notas de versión disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {releaseNotes.map((note) => (
        <ReleaseNotesCard key={note.id} releaseNote={note} />
      ))}
    </div>
  );
}
