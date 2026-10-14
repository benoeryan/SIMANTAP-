import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';
import { CandidateLogin } from './components/auth/CandidateLogin';
import { AdminLogin } from './components/auth/AdminLogin';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StudentLayout } from './components/layouts/StudentLayout';
import { AdminLayout } from './components/layouts/AdminLayout';
import { MitraPortalLayout } from './components/layouts/MitraPortalLayout';
import { MitraLogin } from './components/auth/MitraLogin';
import { Building2 } from 'lucide-react';

// Root Redirect Controller based on current Auth State
const RootRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl text-center space-y-4 max-w-sm w-full">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Memuat Sistem IJEF CORP...</h3>
            <p className="text-xs text-slate-500 mt-1">Mengautentikasi Sesi Pengguna</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin' || role === 'marketing') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role === 'mitra') {
    return <Navigate to="/portal-mitra" replace />;
  }

  return <Navigate to="/portal-siswa" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<CandidateLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/mitra-login" element={<MitraLogin />} />
            <Route path="/mitra/login" element={<MitraLogin />} />

            {/* Candidate Protected Route - Strictly Clean StudentLayout ONLY */}
            <Route
              path="/portal-siswa"
              element={
                <ProtectedRoute allowedRoles={['siswa']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            />

            {/* Partner / Mitra Protected Route */}
            <Route
              path="/portal-mitra"
              element={
                <ProtectedRoute allowedRoles={['mitra', 'admin', 'marketing']}>
                  <MitraPortalLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mitra"
              element={<Navigate to="/portal-mitra" replace />}
            />

            {/* Admin Back-Office Protected Route - AdminLayout ONLY */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'marketing']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* Default Catch-all & Root Redirect */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  </AuthProvider>
  );
}

export default App;
