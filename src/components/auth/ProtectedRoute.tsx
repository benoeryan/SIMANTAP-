import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { isSuperAdminUser } from '../../utils/authUtils';
import { Building2, ShieldCheck, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();
  const { masterSettings } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-4 max-w-sm w-full">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Memverifikasi Otorisasi...</h3>
            <p className="text-xs text-slate-400 mt-1">Sistem Informasi Manajemen LPK IJEF CORP</p>
          </div>
          <div className="flex justify-center">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    const isBackOfficeAllowed = allowedRoles?.includes('admin') || allowedRoles?.includes('marketing');
    return <Navigate to={isBackOfficeAllowed ? '/admin/login' : '/login'} replace />;
  }

  // Super Admin universal access bypass - can access all portal routes directly
  const isSuperAdmin = isSuperAdminUser(user, masterSettings?.adminUsers);
  if (isSuperAdmin) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Role restriction check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Siswa trying to access Admin, Marketing, or Mitra route -> redirect to candidate portal
    if (role === 'siswa') {
      return <Navigate to="/portal-siswa" replace />;
    }
    // Mitra trying to access other route -> redirect to mitra portal
    if (role === 'mitra') {
      return <Navigate to="/portal-mitra" replace />;
    }
    // Admin or Marketing trying to access student-only route -> redirect to admin dashboard
    if (role === 'admin' || role === 'marketing') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
