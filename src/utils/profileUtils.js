// src/utils/profileUtils.js
import md5 from 'blueimp-md5';

/**
 * Obtiene la URL de la foto de perfil del usuario priorizando la de Google si existe
 * @param {Object} user - Objeto de usuario (puede incluir photoURL de Google o email para Gravatar)
 * @param {number} size - Tamaño deseado de la imagen
 * @param {boolean} forceFresh - Si es true, añade timestamp para forzar refresco
 * @returns {string} URL de la imagen de perfil
 */
export const getProfilePhotoUrl = (user, size = 80, forceFresh = false) => {
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
    // Añadir timestamp si se solicita refresco forzado
    const cacheBuster = forceFresh ? `&t=${Date.now()}` : '';
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=${size}${cacheBuster}`;
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

/**
 * Determina si un usuario está usando Gravatar (no tiene photoURL de provider)
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} true si el usuario está usando Gravatar
 */
export const isUsingGravatar = (user) => {
  if (!user || !user.email) return false;
  
  // Si tiene photoURL específica de otro proveedor, no está usando Gravatar
  if (user.photoURL) {
    // Verificar si la URL es de Google, GitHub, etc.
    if (user.photoURL.includes('googleusercontent.com') || 
        user.photoURL.includes('github') ||
        user.photoURL.includes('facebook')) {
      return false;
    }
    
    // Si tiene photoURL pero no es de un proveedor conocido, podría ser personalizada
    // Verificar si coincide con el patrón de Gravatar
    const emailHash = md5(user.email.trim().toLowerCase());
    return user.photoURL.includes(`gravatar.com/avatar/${emailHash}`);
  }
  
  // Si no tiene photoURL pero tiene email, asumimos que usa Gravatar por defecto
  return true;
};