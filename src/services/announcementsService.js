// src/services/announcementsService.js
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
  where,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Servicio para gestionar Announcements (Avisos/Anuncios)
 */
class AnnouncementsService {
  constructor() {
    this.collectionName = 'announcements';
  }

  /**
   * Crear un nuevo anuncio
   * @param {Object} announcement - Datos del anuncio
   * @param {string} announcement.title - Título del anuncio
   * @param {string} announcement.content - Contenido del anuncio
   * @param {string} announcement.type - Tipo: "info", "warning", "success", "error"
   * @param {string} announcement.priority - Prioridad: "low", "medium", "high"
   * @param {Date} announcement.expiresAt - Fecha de expiración (opcional)
   * @param {string} userId - ID del admin que crea el anuncio
   * @returns {Promise<string>} ID del documento creado
   */
  async createAnnouncement(announcement, userId) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        title: announcement.title,
        content: announcement.content,
        type: announcement.type || 'info',
        priority: announcement.priority || 'medium',
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        published: announcement.published !== false,
        expiresAt: announcement.expiresAt || null,
        pinned: announcement.pinned || false
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los anuncios activos (no expirados)
   * @param {number} limitCount - Número máximo de anuncios a obtener
   * @returns {Promise<Array>} Array de anuncios
   */
  async getActiveAnnouncements(limitCount = 10) {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collectionName),
        orderBy('pinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const announcements = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Filtrar solo los publicados y no expirados
        const isPublished = data.published !== false;
        const isExpired = data.expiresAt && data.expiresAt.toDate() < now;

        if (isPublished && !isExpired) {
          announcements.push({
            id: doc.id,
            ...data
          });
        }
      });

      return announcements;
    } catch (error) {
      console.error('Error getting active announcements:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los anuncios (para admin)
   * @param {number} limitCount - Número máximo de anuncios a obtener
   * @returns {Promise<Array>} Array de anuncios
   */
  async getAllAnnouncements(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const announcements = [];

      snapshot.forEach((doc) => {
        announcements.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return announcements;
    } catch (error) {
      console.error('Error getting all announcements:', error);
      throw error;
    }
  }

  /**
   * Obtener un anuncio por ID
   * @param {string} announcementId - ID del anuncio
   * @returns {Promise<Object>} Anuncio
   */
  async getAnnouncementById(announcementId) {
    try {
      const docRef = doc(db, this.collectionName, announcementId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Announcement not found');
      }
    } catch (error) {
      console.error('Error getting announcement:', error);
      throw error;
    }
  }

  /**
   * Actualizar un anuncio
   * @param {string} announcementId - ID del anuncio
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<void>}
   */
  async updateAnnouncement(announcementId, updates) {
    try {
      const docRef = doc(db, this.collectionName, announcementId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  /**
   * Eliminar un anuncio
   * @param {string} announcementId - ID del anuncio
   * @returns {Promise<void>}
   */
  async deleteAnnouncement(announcementId) {
    try {
      const docRef = doc(db, this.collectionName, announcementId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  /**
   * Cambiar el estado de publicación de un anuncio
   * @param {string} announcementId - ID del anuncio
   * @param {boolean} published - Nuevo estado
   * @returns {Promise<void>}
   */
  async togglePublished(announcementId, published) {
    try {
      await this.updateAnnouncement(announcementId, { published });
    } catch (error) {
      console.error('Error toggling published status:', error);
      throw error;
    }
  }

  /**
   * Fijar/Desfijar un anuncio
   * @param {string} announcementId - ID del anuncio
   * @param {boolean} pinned - Nuevo estado
   * @returns {Promise<void>}
   */
  async togglePinned(announcementId, pinned) {
    try {
      await this.updateAnnouncement(announcementId, { pinned });
    } catch (error) {
      console.error('Error toggling pinned status:', error);
      throw error;
    }
  }
}

export default new AnnouncementsService();
