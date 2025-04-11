// src/App.jsx
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas públicas
import Home from './pages/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Páginas privadas
import Dashboard from './pages/Dashboard';
import CommandHistory from './pages/CommandHistory';
import UserProfile from './pages/UserProfile';
import MyPNRs from './pages/MyPNRs';
import Help from './pages/Help';

// Páginas de administrador
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

// Páginas de error
import NotFound from './pages/NotFound';

// Componente para rutas protegidas
function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Componente para rutas de administrador
function AdminRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/command-history" 
          element={
            <PrivateRoute>
              <CommandHistory />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/my-pnrs" 
          element={
            <PrivateRoute>
              <MyPNRs />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/help" 
          element={
            <PrivateRoute>
              <Help />
            </PrivateRoute>
          } 
        />
        
        {/* Rutas de administrador */}
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } 
        />
        
        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}