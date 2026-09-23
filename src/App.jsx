// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import AutoLogout from './components/AutoLogout';
import XpToastContainer, { LevelUpModal } from './components/gamification/XpToast';
import xpEventBus from './services/xpEventBus';

// Cada página se carga en su propio chunk: la app inicial no necesita traer
// las herramientas de administración, formularios de datos, etc. de una sola vez.

// Páginas públicas
const Home = lazy(() => import('./pages/Home'));
const Docs = lazy(() => import('./pages/Docs'));
const Login = lazy(() => import('./components/auth/Login'));
const Signup = lazy(() => import('./components/auth/Signup'));

// Páginas privadas
const HomeNew = lazy(() => import('./pages/Home_New'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Help = lazy(() => import('./pages/Help'));
const Settings = lazy(() => import('./pages/Settings')); // Nueva página de configuración
const FlightExplorerPage = lazy(() => import('./pages/FlightExplorerPage'));
const StudentChallenges = lazy(() => import('./pages/StudentChallenges'));
const MyBugReports = lazy(() => import('./pages/MyBugReports'));

// Páginas de administrador
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminFlights = lazy(() => import('./pages/admin/Flights'));
const AdminCommissions = lazy(() => import('./pages/admin/Commissions'));
const UserCommandHistoryPage = lazy(() => import('./pages/admin/UserCommandHistory'));
const UserPNRsPage = lazy(() => import('./pages/admin/UserPNRsPage'));
const DataManagementPage = lazy(() => import('./pages/admin/DataManagementPage'));
const ReleaseNotesManagement = lazy(() => import('./pages/admin/ReleaseNotesManagement'));
const AnnouncementsManagement = lazy(() => import('./pages/admin/AnnouncementsManagement'));
const BugReportsManagement = lazy(() => import('./pages/admin/BugReportsManagement'));
const AdminChallenges = lazy(() => import('./pages/admin/AdminChallenges'));

// Páginas de error
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoadingFallback() {
  return <div className="flex h-screen items-center justify-center">Cargando...</div>;
}

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

// ── XP event manager ─────────────────────────────────────────────────────────
// Subscribes to xpEventBus and renders toasts/modals globally
function XpToastManager() {
  const [toastEvents, setToastEvents] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);

  useEffect(() => {
    const unsub = xpEventBus.subscribe(ev => {
      if (ev.type === 'level_up') {
        setLevelUpData(ev.data);
      } else if (ev.type === 'achievement') {
        setAchievements(prev => [...prev, { ...ev.achievement, id: ev.id }]);
      } else {
        setToastEvents(prev => [...prev, ev]);
      }
    });
    return unsub;
  }, []);

  return (
    <>
      <XpToastContainer
        events={toastEvents}
        achievements={achievements}
        onDismissEvent={id => setToastEvents(prev => prev.filter(e => e.id !== id))}
        onDismissAchievement={id => setAchievements(prev => prev.filter(a => a.id !== id))}
      />
      <LevelUpModal levelData={levelUpData} onClose={() => setLevelUpData(null)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <XpToastManager />
      <AutoLogout>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Rutas protegidas - accesibles por usuarios y espectadores */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomeNew />
              </PrivateRoute>
            }
          />
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
          <Route
            path="/flights"
            element={
              <PrivateRoute>
                <FlightExplorerPage />
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
          <Route
            path="/bug-reports"
            element={
              <AuthenticatedOnlyRoute>
                <MyBugReports />
              </AuthenticatedOnlyRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <AuthenticatedOnlyRoute>
                <StudentChallenges />
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
          <Route
            path="/admin/data-management"
            element={
              <AdminRoute>
                <DataManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/release-notes"
            element={
              <AdminRoute>
                <ReleaseNotesManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <AdminRoute>
                <AnnouncementsManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bug-reports"
            element={
              <AdminRoute>
                <BugReportsManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/challenges"
            element={
              <AdminRoute>
                <AdminChallenges />
              </AdminRoute>
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </AutoLogout>
    </AuthProvider>
  );
}