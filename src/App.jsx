// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import AutoLogout from './components/AutoLogout';


// Páginas públicas
import Home from './pages/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Páginas privadas
import Dashboard from './pages/Dashboard';
import CommandHistory from './pages/CommandHistory';
import UserProfile from './pages/UserProfile';
import MyPNRs from './pages/MyPNRs';
import Leaderboard from './pages/Leaderboard';
import Help from './pages/Help';
import Settings from './pages/Settings'; // Nueva página de configuración

// Páginas de administrador
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import AdminFlights from './pages/admin/Flights';
import AdminCommissions from './pages/admin/Commissions';
import UserCommandHistoryPage from './pages/admin/UserCommandHistory';
import UserPNRsPage from './pages/admin/UserPNRsPage';

// Páginas de error
import NotFound from './pages/NotFound';

// Componente para rutas protegidas
function PrivateRoute({ children }) {
  const { currentUser, loading, isSpectator } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  // Permitir acceso si está autenticado o es espectador
  if (!currentUser && !isSpectator) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Componente para rutas de administrador
function AdminRoute({ children }) {
  const { currentUser, userRole, loading, isSpectator } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  // No permitir acceso a espectadores
  if (isSpectator) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Componente para rutas que no deben ser accesibles a espectadores
function AuthenticatedOnlyRoute({ children }) {
  const { currentUser, loading, isSpectator } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if (!currentUser || isSpectator) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AutoLogout>
        <Toaster position="top-right" />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Rutas protegidas - accesibles por usuarios y espectadores */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
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
          <Route 
            path="/leaderboard" 
            element={
              <PrivateRoute>
                <Leaderboard />
              </PrivateRoute>
            } 
          />
          
          {/* Rutas solo para usuarios autenticados (no espectadores) */}
          // Rutas de perfil centralizado
          <Route 
            path="/profile" 
            element={
              <AuthenticatedOnlyRoute>
                <UserProfile initialTab="personal" />
              </AuthenticatedOnlyRoute>
            } 
          />
          <Route 
            path="/my-pnrs" 
            element={
              <AuthenticatedOnlyRoute>
                <UserProfile initialTab="pnrs" />
              </AuthenticatedOnlyRoute>
            } 
          />
          <Route 
            path="/command-history" 
            element={
              <AuthenticatedOnlyRoute>
                <UserProfile initialTab="commands" />
              </AuthenticatedOnlyRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <AuthenticatedOnlyRoute>
                <Settings />
              </AuthenticatedOnlyRoute>
            } 
          />
          
          {/* Rutas de administrador */}
          <Route 
            path="/admin/commissions" 
            element={
              <AdminRoute>
                <AdminCommissions />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } 
          />
          {/* Nueva ruta para historial de comandos de usuario */}
          <Route 
            path="/admin/users/:userId/commands" 
            element={
              <AdminRoute>
                <UserCommandHistoryPage />
              </AdminRoute>
            } 
          />
          {/* Ruta para PNRs de usuario */}
          <Route 
            path="/admin/users/:userId/pnrs" 
            element={
              <AdminRoute>
                <UserPNRsPage />
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
          <Route 
            path="/admin/flights" 
            element={
              <AdminRoute>
                <AdminFlights />
              </AdminRoute>
            } 
          />
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AutoLogout>
    </AuthProvider>
  );
}