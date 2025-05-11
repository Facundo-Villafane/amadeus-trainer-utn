// src/contexts/AuthProvider.jsx
import { useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { AuthContext } from './authContext';

// Componente proveedor que envuelve a la aplicación
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCommission, setUserCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpectator, setIsSpectator] = useState(false);

  // Registro con email y contraseña
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil con el nombre
      await updateProfile(userCredential.user, { displayName });
      
      // Crear un documento de usuario en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        role: 'student', // Por defecto, todos los usuarios nuevos son estudiantes
        createdAt: new Date().toISOString()
      });
      
      return userCredential;
    } catch (error) {
      console.error('Error en signup:', error);
      throw error;
    }
  }

  // Inicio de sesión con email y contraseña
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Inicio de sesión con Google
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Verificar si el usuario ya existe en Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Si es la primera vez que inicia sesión, crear un documento de usuario
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          role: 'student', // Por defecto, todos los usuarios nuevos son estudiantes
          createdAt: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      throw error;
    }
  }

  // Función de logout modificada
  async function logout() {
    try {
      // Limpiar el historial almacenado
      if (currentUser) {
        localStorage.removeItem(`terminal_history_${currentUser.uid}`);
        localStorage.removeItem(`command_history_${currentUser.uid}`);
      }
      
      // Limpiar modo espectador
      localStorage.removeItem('spectatorMode');
      setIsSpectator(false);
      
      // Cerrar sesión en Firebase
      return await signOut(auth);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  // Obtener información completa del usuario
  async function fetchUserInfo(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        
        // Si el usuario tiene una comisión asignada, establecerla
        if (userData.commissionId) {
          setUserCommission({
            id: userData.commissionId,
            name: userData.commissionName,
            code: userData.commissionCode
          });
        }
        
        return userData.role;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      return null;
    }
  }

  // Alias para compatibilidad
  const fetchUserRole = fetchUserInfo;

  // Efecto para observar el estado de autenticación
  useEffect(() => {
    // Verificar si está en modo espectador
    const spectatorMode = localStorage.getItem('spectatorMode') === 'true';
    setIsSpectator(spectatorMode);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserInfo(user.uid);
      } else {
        setUserRole(null);
        setUserCommission(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Crear el objeto de valor para el contexto
  const value = {
    currentUser,
    userRole,
    userCommission,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchUserRole,
    fetchUserInfo,
    isAdmin: userRole === 'admin',
    isSpectator
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Exportación por defecto del componente
export default AuthProvider;