// src/components/announcements/AnnouncementsList.jsx
import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import announcementsService from '../../services/announcementsService';
import AnnouncementCard from './AnnouncementCard';

/**
 * Componente para listar todos los anuncios activos
 */
export default function AnnouncementsList({ limitCount = 5 }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, [limitCount]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await announcementsService.getActiveAnnouncements(limitCount);
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
      setError('Error al cargar los avisos');
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

  if (announcements.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 text-sm">No hay avisos en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}
