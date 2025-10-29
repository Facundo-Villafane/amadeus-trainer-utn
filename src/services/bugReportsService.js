// src/services/bugReportsService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Servicio para gestionar Bug Reports
 */
class BugReportsService {
  constructor() {
    this.collectionName = 'bugReports';
  }

  /**
   * Crear un nuevo bug report
   * @param {Object} bugReport - Datos del reporte
   * @param {string} bugReport.title - Título del bug
   * @param {string} bugReport.description - Descripción detallada
   * @param {string} bugReport.category - Categoría del bug
   * @param {string} bugReport.priority - Prioridad (low, medium, high)
   * @param {string} userId - ID del usuario que reporta
   * @param {string} userEmail - Email del usuario
   * @returns {Promise<string>} ID del documento creado
   */
  async createBugReport(bugReport, userId, userEmail) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        title: bugReport.title,
        description: bugReport.description,
        category: bugReport.category || 'general',
        priority: bugReport.priority || 'medium',
        status: 'pending', // pending, in-progress, resolved
        userId: userId,
        userEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminResponse: null,
        resolvedAt: null,
        resolvedBy: null
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating bug report:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los bug reports de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de bug reports
   */
  async getUserBugReports(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return reports;
    } catch (error) {
      console.error('Error getting user bug reports:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los bug reports (para admin)
   * @param {string} filterStatus - Filtrar por estado (opcional)
   * @returns {Promise<Array>} Array de bug reports
   */
  async getAllBugReports(filterStatus = null) {
    try {
      let q;

      if (filterStatus) {
        q = query(
          collection(db, this.collectionName),
          where('status', '==', filterStatus),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          collection(db, this.collectionName),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return reports;
    } catch (error) {
      console.error('Error getting all bug reports:', error);
      throw error;
    }
  }

  /**
   * Actualizar el estado de un bug report
   * @param {string} reportId - ID del reporte
   * @param {string} status - Nuevo estado
   * @param {string} adminId - ID del admin (opcional)
   * @returns {Promise<void>}
   */
  async updateStatus(reportId, status, adminId = null) {
    try {
      const updates = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'resolved') {
        updates.resolvedAt = serverTimestamp();
        if (adminId) {
          updates.resolvedBy = adminId;
        }
      }

      const docRef = doc(db, this.collectionName, reportId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating bug report status:', error);
      throw error;
    }
  }

  /**
   * Agregar respuesta del admin
   * @param {string} reportId - ID del reporte
   * @param {string} response - Respuesta del admin
   * @param {string} adminId - ID del admin
   * @returns {Promise<void>}
   */
  async addAdminResponse(reportId, response, adminId) {
    try {
      const docRef = doc(db, this.collectionName, reportId);
      await updateDoc(docRef, {
        adminResponse: response,
        respondedBy: adminId,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding admin response:', error);
      throw error;
    }
  }

  /**
   * Eliminar un bug report
   * @param {string} reportId - ID del reporte
   * @returns {Promise<void>}
   */
  async deleteBugReport(reportId) {
    try {
      const docRef = doc(db, this.collectionName, reportId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting bug report:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de bug reports
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats() {
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const stats = {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;
        if (data.status === 'pending') stats.pending++;
        else if (data.status === 'in-progress') stats.inProgress++;
        else if (data.status === 'resolved') stats.resolved++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting bug report stats:', error);
      throw error;
    }
  }
}

export default new BugReportsService();
