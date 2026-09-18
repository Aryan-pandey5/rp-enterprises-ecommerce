import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Protects routes that require authenticated users or specific roles.
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login and preserve destination route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin') {
    const isAdmin = user?.is_staff || user?.role === 'admin' || user?.is_superuser;
    if (!isAdmin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
