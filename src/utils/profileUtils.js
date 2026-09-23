// src/utils/profileUtils.js
import md5 from 'blueimp-md5';

// Estilo de avatar de DiceBear (https://www.dicebear.com/styles/gaze/) usado como
// fallback para usuarios sin foto de perfil de Google. CC0 1.0.
const DICEBEAR_STYLE = 'gaze';

/**
 * Genera la URL de un avatar DiceBear determinístico a partir de un seed.
 * El mismo seed siempre da el mismo avatar, así se mantiene estable entre sesiones.
 * @param {string} seed - Identificador sin datos personales (ej. el uid del usuario)
 * @param {number} size - Tamaño deseado de la imagen
 * @returns {string} URL del avatar SVG
 */
function getDiceBearUrl(seed, size) {
  const params = new URLSearchParams({
    seed: seed || 'anonymous',
    size: String(size),
    tags: 'animation',
  });
  return `https://api.dicebear.com/10.x/${DICEBEAR_STYLE}/svg?${params.toString()}`;
}

/**
 * Obtiene la URL de la foto de perfil del usuario priorizando la de Google si existe.
 * Si no tiene foto, se genera un avatar DiceBear a partir de su uid (sin datos
 * personales: ni email ni nombre), así cada usuario conserva siempre el mismo avatar.
 *
 * Caso especial: cuentas marcadas con `useGravatar` (ej. la cuenta de demo del
 * docente, para tener un avatar propio reconocible al compartir pantalla) usan
 * su Gravatar en lugar del avatar generado.
 *
 * @param {Object} user - Objeto de usuario (puede incluir photoURL de Google, uid/id,
 *   email, useGravatar)
 * @param {number} size - Tamaño deseado de la imagen
 * @returns {string} URL de la imagen de perfil
 */
export const getProfilePhotoUrl = (user, size = 80) => {
  if (!user) {
    return getDiceBearUrl('anonymous', size);
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

  // Caso especial: cuenta marcada para usar Gravatar en vez del avatar generado
  if (user.useGravatar && user.email) {
    const emailHash = md5(user.email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=${size}`;
  }

  // Sin foto: avatar DiceBear estable basado en el uid (Firebase Auth usa "uid",
  // los objetos armados desde Firestore a veces usan "id")
  return getDiceBearUrl(user.uid || user.id, size);
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
