// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
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

// Crear el contexto
const AuthContext = createContext(null);

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Componente proveedor que envuelve a la aplicación
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    // Cerrar sesión en Firebase
    return await signOut(auth);
  } catch (error) {
    console.error('Error en logout:', error);
    throw error;
  }
}

  // Obtener el rol del usuario
  async function fetchUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        return userData.role;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener el rol del usuario:', error);
      return null;
    }
  }

  // Efecto para observar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserRole(user.uid);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Crear el objeto de valor para el contexto
  const value = {
    currentUser,
    userRole,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchUserRole,
    isAdmin: userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Esta exportación asegura compatibilidad con HMR
export default AuthProvider;