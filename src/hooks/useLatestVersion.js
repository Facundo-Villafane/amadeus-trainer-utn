// src/hooks/useLatestVersion.js
import { useState, useEffect } from 'react';
import releaseNotesService from '../services/releaseNotesService';

/**
 * Hook personalizado para obtener la última versión publicada
 * @returns {string} Número de versión (ej: "1.0.0")
 */
export function useLatestVersion() {
  const [version, setVersion] = useState('1.0.0'); // Versión por defecto
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestVersion();
  }, []);

  const loadLatestVersion = async () => {
    try {
      setLoading(true);
      // Obtener solo la primera release note (la más reciente)
      const notes = await releaseNotesService.getPublishedReleaseNotes(1);

      if (notes && notes.length > 0 && notes[0].version) {
        setVersion(notes[0].version);
      }
    } catch (error) {
      console.error('Error loading latest version:', error);
      // Mantener la versión por defecto si hay error
    } finally {
      setLoading(false);
    }
  };

  return { version, loading };
}
