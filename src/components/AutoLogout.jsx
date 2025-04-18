// src/components/AutoLogout.jsx

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

export default function AutoLogout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(new Date());
  
  // Tiempo de inactividad en milisegundos (ejemplo: 30 minutos)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  
  // Registrar actividad del usuario
  const resetTimer = () => {
    setLastActivity(new Date());
  };
  
  // Verificar si el usuario está inactivo
  const checkInactivity = () => {
    const now = new Date();
    const elapsed = now - lastActivity;
    
    if (elapsed > INACTIVITY_TIMEOUT) {
      handleInactiveLogout();
    }
  };
  
  // Manejar el cierre de sesión por inactividad
  const handleInactiveLogout = async () => {
    try {
      await logout();
      navigate('/login', { 
        state: { message: 'Su sesión ha caducado por inactividad.' } 
      });
    } catch (error) {
      console.error('Error al cerrar sesión automáticamente:', error);
    }
  };
  
  // Configurar los listeners de actividad
  useEffect(() => {
    // Eventos que reinician el temporizador de inactividad
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Agregar listeners para los eventos
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Configurar un intervalo para verificar la inactividad (cada minuto)
    const interval = setInterval(checkInactivity, 60 * 1000);
    
    // Limpiar listeners y el intervalo al desmontar
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [lastActivity]);
  
  return children;
}