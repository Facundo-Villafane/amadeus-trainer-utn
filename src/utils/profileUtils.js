// src/utils/profileUtils.js
import md5 from 'blueimp-md5';

/**
 * Obtiene la URL de la foto de perfil del usuario priorizando la de Google si existe
 * @param {Object} user - Objeto de usuario (puede incluir photoURL de Google o email para Gravatar)
 * @param {number} size - Tamaño deseado de la imagen
 * @returns {string} URL de la imagen de perfil
 */
export const getProfilePhotoUrl = (user, size = 80) => {
  // Si el usuario no tiene datos, devolver avatar por defecto
  if (!user) {
    return `https://www.gravatar.com/avatar/0?d=identicon&s=${size}`;
  }

  // Verificar si el usuario tiene foto de perfil de Google
  if (user.photoURL) {
    // Si la foto es de Google, ajustar el tamaño 
    if (user.photoURL.includes('googleusercontent.com')) {
      // Las URLs de Google Photos suelen incluir parámetros de tamaño
      return user.photoURL.replace(/=s\d+(-c)?/, `=s${size}-c`);
    }
    // Usar la photoURL tal cual
    return user.photoURL;
  }
  
  // Si no tiene foto, verificar si tiene email para usar Gravatar
  if (user.email) {
    const emailHash = md5(user.email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=${size}`;
  }
  
  // Sin email ni foto, usar avatar genérico
  return `https://www.gravatar.com/avatar/0?d=identicon&s=${size}`;
};

/**
 * Determina si un usuario se autenticó mediante Google
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} true si el usuario se autenticó con Google
 */
export const isGoogleUser = (user) => {
  if (!user) return false;
  
  // Verificar provider en userData si existe
  if (user.provider === 'google.com') return true;
  
  // Verificar en providerData de Firebase Auth
  if (user.providerData && user.providerData.length > 0) {
    return user.providerData.some(provider => provider.providerId === 'google.com');
  }
  
  return false;
};