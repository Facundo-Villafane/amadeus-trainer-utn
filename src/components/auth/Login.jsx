// src/components/auth/Login.jsx (modificado)
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { FaGoogle } from 'react-icons/fa';
import { FiMail, FiLock, FiUser, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { db, auth } from '../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { googleProvider } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [commissionData, setCommissionData] = useState(null);
  const [registrationMethod, setRegistrationMethod] = useState(null); // 'email' or 'google'
  
  const { login, loginWithGoogle, signup, enterSpectatorMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  // Función para verificar el código de comisión
  const verifyCommissionCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Por favor ingrese el código de verificación');
      return;
    }

    try {
      setLoading(true);
      
      // Buscar la comisión con el código proporcionado
      const commissionsQuery = query(
        collection(db, 'commissions'),
        where('code', '==', verificationCode.toUpperCase()),
        where('active', '==', true)
      );
      
      const commissionsSnapshot = await getDocs(commissionsQuery);
      
      if (commissionsSnapshot.empty) {
        toast.error('Código de verificación inválido o inactivo');
        return;
      }
      
      const commission = commissionsSnapshot.docs[0];
      const data = commission.data();
      
      // Verificar si la comisión ha alcanzado el límite de estudiantes
      if (data.maxStudents && data.currentStudents >= data.maxStudents) {
        toast.error('Esta comisión ha alcanzado el límite de estudiantes');
        return;
      }
      
      setCommissionData({ id: commission.id, ...data });
      setShowCodeStep(false);
      toast.success('Código verificado correctamente');
      
    } catch (error) {
      console.error('Error al verificar código:', error);
      toast.error('Error al verificar el código de comisión');
    } finally {
      setLoading(false);
    }
  };

  // Manejar el inicio del proceso de registro
  const handleRegisterClick = (method) => {
    setRegistrationMethod(method);
    setIsRegisterMode(true);
    setShowCodeStep(true);
  };

  // Función para completar el registro después de la verificación del código
  const completeRegistration = async (userCredential) => {
    try {
      // Actualizar el documento del usuario con la información de la comisión
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        commissionId: commissionData.id,
        commissionName: commissionData.name,
        commissionCode: commissionData.code,
        firstName: firstName || userCredential.user.displayName?.split(' ')[0] || '',
        lastName: lastName || userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
        displayName: `${firstName} ${lastName}`.trim() || userCredential.user.displayName
      });
      
      // Actualizar el contador de estudiantes en la comisión
      await updateDoc(doc(db, 'commissions', commissionData.id), {
        currentStudents: (commissionData.currentStudents || 0) + 1,
        students: [...(commissionData.students || []), userCredential.user.uid]
      });
      
      toast.success('Registro completado exitosamente');
      navigate('/home');
    } catch (error) {
      console.error('Error al completar registro:', error);
      toast.error('Error al completar el registro');
    }
  };

  // Manejar envío del formulario de registro con email
  async function handleEmailRegister(e) {
    e.preventDefault();
    
    // Validaciones
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      return setError('Por favor complete su nombre y apellido');
    }
    
    if (!commissionData) {
      return setError('Debe verificar el código de comisión primero');
    }

    try {
      setError('');
      setLoading(true);
      
      const displayName = `${firstName} ${lastName}`.trim();
      const userCredential = await signup(email, password, displayName);
      
      await completeRegistration(userCredential);
      
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado');
      } else {
        setError('Error al crear la cuenta: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Manejar registro con Google
  async function handleGoogleRegister() {
    if (!commissionData) {
      return setError('Debe verificar el código de comisión primero');
    }

    try {
      setError('');
      setLoading(true);
      
      const userCredential = await loginWithGoogle();
      
      await completeRegistration(userCredential);
      
    } catch (error) {
      console.error(error);
      setError('Error al registrar con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Manejar envío del formulario de login
  async function handleLogin(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setError('Usuario no encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else {
        setError('Error al iniciar sesión: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Manejar login con Google (para usuarios existentes)
  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      
      // Primero, intentar autenticar con Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Verificar si el usuario existe en Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Si el usuario no existe, significa que no se ha registrado con un código de comisión
        // Cerrar sesión inmediatamente
        await signOut(auth);
        setError('No existe una cuenta asociada a este correo. Debes registrarte primero con un código de comisión.');
        return;
      }
      
      // Obtener datos del usuario
      const userData = userDoc.data();
      
      // Si el usuario es admin, permitir acceso sin restricciones
      if (userData.role === 'admin') {
        navigate(from, { replace: true });
        return;
      }
      
      // Para usuarios normales, verificar que tengan una comisión asignada
      if (!userData.commissionId) {
        // Si por alguna razón no tiene comisión asignada, denegar acceso
        await signOut(auth);
        setError('Tu cuenta no está asociada a ninguna comisión. Contacta al administrador.');
        return;
      }
      
      // Todo está bien, proceder con el login
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      setError('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Manejar acceso como espectador
  async function handleSpectatorAccess() {
    try {
      setError('');
      setLoading(true);
      
      // Usar la función del AuthContext para activar el modo espectador
      enterSpectatorMode();
      
      // Mostrar mensaje de éxito
      toast.success('Accediendo en modo espectador');
      
      // Navegar al dashboard
      navigate('/home');
    } catch (error) {
      console.error('Error al acceder como espectador:', error);
      setError('Error al acceder como espectador');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegisterMode ? 'Crear una cuenta' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bienvenido a Mozart Trainer
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Paso de verificación de código para registro */}
        {isRegisterMode && showCodeStep && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Verificación de Código de Comisión
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingrese el código de verificación proporcionado por su instructor
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Código de Verificación
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                    placeholder=""
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setShowCodeStep(false);
                    setVerificationCode('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Volver al login
                </button>
                <button
                  type="button"
                  onClick={verifyCommissionCode}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de registro (después de verificar código) */}
        {isRegisterMode && !showCodeStep && commissionData && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">
                  ✓ Código verificado - Comisión: <strong>{commissionData.name}</strong>
                </p>
              </div>
            </div>

            {registrationMethod === 'email' ? (
              <form className="space-y-6" onSubmit={handleEmailRegister}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Apellido
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary disabled:opacity-50"
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
                >
                  <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                  {loading ? 'Registrando...' : 'Continuar con Google'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setShowCodeStep(false);
                  setCommissionData(null);
                  setRegistrationMethod(null);
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-500"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* Formulario de login */}
        {!isRegisterMode && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary focus:z-10 sm:text-sm"
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">O</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
              >
                <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                Continuar con Google
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="font-medium text-amadeus-primary hover:text-amadeus-secondary"
                >
                  Regístrate aquí
                </button>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                o{' '}
                <button
                  type="button"
                  onClick={handleSpectatorAccess}
                  className="font-medium text-gray-700 hover:text-gray-900"
                >
                  Acceder como espectador
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Opciones de registro cuando el usuario hace clic en "Regístrate aquí" */}
        {isRegisterMode && !showCodeStep && !commissionData && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Elige cómo deseas registrarte
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => handleRegisterClick('email')}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amadeus-primary hover:bg-amadeus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
              >
                <FiMail className="h-5 w-5 mr-2" />
                Registrarse con correo electrónico
              </button>
              <button
                onClick={() => handleRegisterClick('google')}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary"
              >
                <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                Registrarse con Google
              </button>
              <button
                onClick={() => setIsRegisterMode(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-500"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}