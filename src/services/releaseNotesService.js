// src/services/releaseNotesService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Servicio para gestionar Release Notes
 */
class ReleaseNotesService {
  constructor() {
    this.collectionName = 'releaseNotes';
  }

  /**
   * Crear una nueva release note
   * @param {Object} releaseNote - Datos de la release note
   * @param {string} releaseNote.version - Versión (ej: "1.2.0")
   * @param {string} releaseNote.title - Título de la release
   * @param {string} releaseNote.content - Contenido en markdown
   * @param {Array} releaseNote.tags - Tags (ej: ["feature", "bugfix", "enhancement"])
   * @param {string} userId - ID del admin que crea la nota
   * @returns {Promise<string>} ID del documento creado
   */
  async createReleaseNote(releaseNote, userId) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        version: releaseNote.version,
        title: releaseNote.title,
        content: releaseNote.content,
        tags: releaseNote.tags || [],
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        published: releaseNote.published || true,
        releaseDate: releaseNote.releaseDate || new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating release note:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las release notes (ordenadas por fecha)
   * @param {number} limitCount - Número máximo de notas a obtener
   * @returns {Promise<Array>} Array de release notes
   */
  async getAllReleaseNotes(limitCount = 10) {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('releaseDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const releaseNotes = [];

      snapshot.forEach((doc) => {
        releaseNotes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return releaseNotes;
    } catch (error) {
      console.error('Error getting release notes:', error);
      throw error;
    }
  }

  /**
   * Obtener solo las release notes publicadas
   * @param {number} limitCount - Número máximo de notas a obtener
   * @returns {Promise<Array>} Array de release notes publicadas
   */
  async getPublishedReleaseNotes(limitCount = 10) {
    try {
      const allNotes = await this.getAllReleaseNotes(limitCount);
      return allNotes.filter(note => note.published !== false);
    } catch (error) {
      console.error('Error getting published release notes:', error);
      throw error;
    }
  }

  /**
   * Obtener una release note por ID
   * @param {string} noteId - ID de la release note
   * @returns {Promise<Object>} Release note
   */
  async getReleaseNoteById(noteId) {
    try {
      const docRef = doc(db, this.collectionName, noteId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Release note not found');
      }
    } catch (error) {
      console.error('Error getting release note:', error);
      throw error;
    }
  }

  /**
   * Actualizar una release note
   * @param {string} noteId - ID de la release note
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<void>}
   */
  async updateReleaseNote(noteId, updates) {
    try {
      const docRef = doc(db, this.collectionName, noteId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating release note:', error);
      throw error;
    }
  }

  /**
   * Eliminar una release note
   * @param {string} noteId - ID de la release note
   * @returns {Promise<void>}
   */
  async deleteReleaseNote(noteId) {
    try {
      const docRef = doc(db, this.collectionName, noteId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting release note:', error);
      throw error;
    }
  }

  /**
   * Cambiar el estado de publicación de una release note
   * @param {string} noteId - ID de la release note
   * @param {boolean} published - Nuevo estado
   * @returns {Promise<void>}
   */
  async togglePublished(noteId, published) {
    try {
      await this.updateReleaseNote(noteId, { published });
    } catch (error) {
      console.error('Error toggling published status:', error);
      throw error;
    }
  }
}

export default new ReleaseNotesService();
