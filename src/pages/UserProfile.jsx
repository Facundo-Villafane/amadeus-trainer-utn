// src/pages/UserProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  updateProfile, updateEmail, updatePassword, 
  EmailAuthProvider, reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { FiUser, FiMail, FiLock, FiSave, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { currentUser, userRole, logout } = useAuth();
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [stats, setStats] = useState({
    commandsExecuted: 0,
    pnrsCreated: 0,
    lastActivity: null
  });
  
  const navigate = useNavigate();
  
  // Cargar datos del usuario
  useEffect(() => {
    if (!currentUser) return;
    
    async function fetchUserData() {
      try {
        setLoading(true);
        
        // Cargar datos de Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userDocData = userDoc.data();
          
          // Cargar estadísticas
          setStats({
            commandsExecuted: userDocData.commandsExecuted || 0,
            pnrsCreated: userDocData.pnrsCreated || 0,
            lastActivity: userDocData.lastActivity ? new Date(userDocData.lastActivity) : null
          });
        }
        
        // Cargar datos de Auth
        setUserData(prevData => ({
          ...prevData,
          displayName: currentUser.displayName || '',
          email: currentUser.email || ''
        }));
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        toast.error('Error al cargar los datos del perfil');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [currentUser]);
  
  // Manejar cambios en los campos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Actualizar perfil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setUpdatingProfile(true);
      
      // Actualizar displayName en Auth
      await updateProfile(currentUser, {
        displayName: userData.displayName
      });
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: userData.displayName
      });
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setUpdatingProfile(false);
    }
  };
  
  // Actualizar email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !userData.currentPassword) {
      toast.error('Debes proporcionar tu contraseña actual');
      return;
    }
    
    try {
      setUpdatingEmail(true);
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        userData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar email
      await updateEmail(currentUser, userData.email);
      
      // Enviar verificación de email
      await sendEmailVerification(currentUser);
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email: userData.email
      });
      
      // Limpiar contraseña
      setUserData(prevData => ({
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
  
  // Actualizar contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !userData.currentPassword) {
      toast.error('Debes proporcionar tu contraseña actual');
      return;
    }
    
    if (userData.newPassword !== userData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (userData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setUpdatingPassword(true);
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        userData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar contraseña
      await updatePassword(currentUser, userData.newPassword);
      
      // Limpiar contraseñas
      setUserData(prevData => ({
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
  
  // Manejar cierre de sesión
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar userRole={userRole} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Perfil de Usuario</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra tu información personal y cuenta.
            </p>
            
            {loading ? (
              <div className="mt-4 bg-white shadow rounded-lg p-4">
                <p className="text-center text-gray-500">Cargando perfil...</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Información general */}
                <div className="lg:col-span-1">
                  <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <FiUser className="mr-2" />
                        Información General
                      </h2>
                      
                      <div className="mt-4">
                        <div className="flex justify-center">
                          <div className="h-32 w-32 rounded-full bg-amadeus-primary text-white flex items-center justify-center text-4xl">
                            {userData.displayName ? userData.displayName.substring(0, 1).toUpperCase() : '?'}
                          </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <h3 className="text-xl font-medium text-gray-900">{userData.displayName}</h3>
                          <p className="text-gray-500">{userData.email}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Rol: {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                          </p>
                        </div>
                        
                        <div className="mt-6 border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700">Estadísticas</h4>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2">
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
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Formularios de actualización */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Formulario de Perfil */}
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
                            value={userData.displayName}
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
                            value={userData.email}
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
                            value={userData.currentPassword}
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
                            value={userData.currentPassword}
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
                            value={userData.newPassword}
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
                            value={userData.confirmPassword}
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
                  
                  {/* Información de seguridad */}
                  {!currentUser?.emailVerified && (
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}