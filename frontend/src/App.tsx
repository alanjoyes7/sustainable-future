import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Home = lazy(() => import('./pages/Home'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Result = lazy(() => import('./pages/Result'));
const Map = lazy(() => import('./pages/Map'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const History = lazy(() => import('./pages/History'));

function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-on-surface font-bold">The Biome</p>
          <p className="text-on-surface-variant font-medium text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Preparing your eco dashboard..." />;
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader label="Loading experience..." />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Home />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="result" element={<Result />} />
              <Route path="map" element={<Map />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="history" element={<History />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '999px', fontWeight: 700, fontSize: '14px' },
        }}
      />
    </AuthProvider>
  );
}
