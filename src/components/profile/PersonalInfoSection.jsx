// src/components/profile/PersonalInfoSection.jsx
import { useState } from 'react';
import { 
  updateProfile, updateEmail, updatePassword, 
  EmailAuthProvider, reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiUser, FiMail, FiLock, FiSave, FiAlertCircle, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getProfilePhotoUrl, isGoogleUser } from '../../utils/profileUtils'; // Importa las utilidades


export default function PersonalInfoSection({ currentUser, userData, userRole, stats, loading }) {
  const [localUserData, setLocalUserData] = useState({
    displayName: userData.displayName || '',
    email: userData.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Update profile name
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setUpdatingProfile(true);
      
      // Actualizar displayName en Auth
      await updateProfile(currentUser, {
        displayName: localUserData.displayName
      });
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: localUserData.displayName
      });
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setUpdatingProfile(false);
    }
  };
  
  // Update email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !localUserData.currentPassword) {
      toast.error('Debes proporcionar tu contraseña actual');
      return;
    }
    
    try {
      setUpdatingEmail(true);
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        localUserData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar email
      await updateEmail(currentUser, localUserData.email);
      
      // Enviar verificación de email
      await sendEmailVerification(currentUser);
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email: localUserData.email
      });
      
      // Limpiar contraseña
      setLocalUserData(prevData => ({
        ...prevData,
        currentPassword: ''
      }));
      
      toast.success('Email actualizado. Se ha enviado un correo de verificación.');
    } catch (error) {
      console.error('Error al actualizar email:', error);
      
      let errorMessage = 'Error al actualizar el email';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está en uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdatingEmail(false);
    }
  };
  
  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !localUserData.currentPassword) {
      toast.error('Debes proporcionar tu contraseña actual');
      return;
    }
    
    if (localUserData.newPassword !== localUserData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (localUserData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setUpdatingPassword(true);
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        localUserData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar contraseña
      await updatePassword(currentUser, localUserData.newPassword);
      
      // Limpiar contraseñas
      setLocalUserData(prevData => ({
        ...prevData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      
      let errorMessage = 'Error al actualizar la contraseña';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña actual incorrecta';
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Check if the user is signed in with Google - ahora usando la utilidad importada
  const userIsGoogleAccount = isGoogleUser(currentUser) || (userData && userData.provider === 'google.com');

  // Obtener la URL de la foto de perfil usando nuestra utilidad
  const userPhotoUrl = getProfilePhotoUrl(currentUser, 128);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Información general */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow overflow-hidden rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Perfil de usuario</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Cargando datos...</div>
          ) : (
            <>
              {/* Avatar - Ahora usando la URL de foto obtenida con la utilidad */}
              <div className="flex justify-center mb-6">
                <img
                  id="user-avatar"
                  src={userPhotoUrl}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-2 border-amadeus-primary shadow"
                />
              </div>

              {/* Provider badge */}
              {userIsGoogleAccount && (
                <div className="flex justify-center mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded px-2.5 py-0.5">
                    Google Account
                  </span>
                </div>
              )}

              {/* Datos de solo lectura */}
              <div className="mb-4">
                <div className="text-xs text-gray-500">Nombre</div>
                <div className="font-semibold text-gray-800">{userData.displayName || '-'}</div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-semibold text-gray-800">{userData.email || '-'}</div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-gray-500">Rol</div>
                <div className="font-semibold text-gray-800">
                    {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                </div>
              </div>
              
              {/* Estadísticas */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Estadísticas</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xl font-semibold text-amadeus-primary">{stats.commandsExecuted}</div>
                    <div className="text-xs text-gray-500">Comandos ejecutados</div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xl font-semibold text-amadeus-primary">{stats.pnrsCreated}</div>
                    <div className="text-xs text-gray-500">PNRs creados</div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  <div>
                    Última actividad: {stats.lastActivity 
                      ? stats.lastActivity.toLocaleString() 
                      : 'Sin actividad'
                    }
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Formularios de actualización - solo para usuarios NO de Google */}
      <div className="lg:col-span-2 space-y-5">
        {userIsGoogleAccount ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center p-4 mb-4 text-sm text-blue-800 border border-blue-300 rounded-lg bg-blue-50">
              <FiInfo className="inline flex-shrink-0 mr-3 w-5 h-5" />
              <span>
                Tu cuenta está vinculada con Google. La gestión de tu perfil, email y contraseña debe realizarse a través de tu cuenta de Google.
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Formulario de actualización de perfil */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiUser className="mr-2" />
                  Actualizar Perfil
                </h2>
                
                <form onSubmit={handleUpdateProfile} className="mt-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      id="displayName"
                      value={localUserData.displayName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                    >
                      <FiSave className="mr-2 -ml-1 h-5 w-5" />
                      {updatingProfile ? 'Actualizando...' : 'Actualizar Perfil'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Formulario de Email */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiMail className="mr-2" />
                  Actualizar Email
                </h2>
                
                <form onSubmit={handleUpdateEmail} className="mt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Nuevo Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={localUserData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPasswordEmail"
                      value={localUserData.currentPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingEmail}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                    >
                      <FiSave className="mr-2 -ml-1 h-5 w-5" />
                      {updatingEmail ? 'Actualizando...' : 'Actualizar Email'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Formulario de Contraseña */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiLock className="mr-2" />
                  Cambiar Contraseña
                </h2>
                
                <form onSubmit={handleUpdatePassword} className="mt-4">
                  <div>
                    <label htmlFor="currentPasswordPwd" className="block text-sm font-medium text-gray-700">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPasswordPwd"
                      value={localUserData.currentPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={localUserData.newPassword}
                      onChange={handleInputChange}
                      minLength={6}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={localUserData.confirmPassword}
                      onChange={handleInputChange}
                      minLength={6}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                    >
                      <FiSave className="mr-2 -ml-1 h-5 w-5" />
                      {updatingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
        
        {/* Email verification warning - show for all users when email is not verified */}
        {!currentUser?.emailVerified && !userIsGoogleAccount && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Tu email no está verificado. Por favor, verifica tu email para acceder a todas las funcionalidades.
                </p>
                <button
                  className="mt-2 text-sm font-medium text-yellow-700 underline hover:text-yellow-600"
                  onClick={async () => {
                    try {
                      await sendEmailVerification(currentUser);
                      toast.success('Email de verificación enviado');
                    } catch (error) {
                      console.error('Error al enviar email de verificación:', error);
                      toast.error('Error al enviar email de verificación');
                    }
                  }}
                >
                  Reenviar email de verificación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}