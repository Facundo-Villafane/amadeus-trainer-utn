// src/components/auth/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function Signup() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }
    
    try {
      setLoading(true);
      await signup(email, password, displayName);
      toast.success('Cuenta creada exitosamente');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al registrarse:', error);
      
      let errorMessage = 'Error al registrarse';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está en uso';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success('Registro con Google exitoso');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al registrarse con Google:', error);
      toast.error('Error al registrarse con Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-amadeus-primary mb-2">Amadeus Trainer</h2>
          <p className="text-gray-600">Crea una cuenta para acceder al sistema</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-gray-700 font-medium mb-1">Nombre completo</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="input"
              placeholder="Juan Pérez"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              placeholder="********"
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input"
              placeholder="********"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="my-4 flex items-center">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="mx-4 text-gray-500">o</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>
        
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 transition"
        >
          <FcGoogle size={20} className="mr-2" />
          Registrarse con Google
        </button>
        
        <p className="text-center mt-6">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-amadeus-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}