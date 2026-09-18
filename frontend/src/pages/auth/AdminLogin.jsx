import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Loader2, Home } from 'lucide-react';

// Dedicated Admin Login Portal component
const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAuthenticated, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged-in admin redirect check
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (user?.is_staff || user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Handle Admin Login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      // Call AuthContext adminLogin handler which calls POST /api/auth/admin/login/
      const result = await adminLogin(username.trim(), password);

      if (!result.success) {
        throw new Error(result.error || 'Admin authentication failed.');
      }

      const authenticatedUser = result.user;
      const isAdmin = authenticatedUser?.is_staff || authenticatedUser?.role === 'admin';

      if (!isAdmin) {
        throw new Error('You do not have administrator permissions.');
      }

      // Automatically navigate authenticated administrator to executive dashboard
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      
      {/* Top Header Link */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto pt-2">
        <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors">
          <Home className="w-4 h-4 text-emerald-500" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
          Factory Management Portal
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xs my-auto">
        
        {/* Branding & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg text-white font-black text-xl tracking-tight">
            RP
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Administrator Login</h1>
            <p className="text-slate-400 text-xs mt-1">
              Sign in with your R.P. Enterprises admin credentials to access inventory, orders, and dashboard controls.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Security Footer Note */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Protected by R.P. Enterprises JWT role-based security. Customer accounts cannot access admin privileges.</span>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="text-center text-[11px] text-slate-500 pb-2">
        © {new Date().getFullYear()} R.P. Enterprises. All Rights Reserved.
      </div>

    </div>
  );
};

export const AdminLoginPage = AdminLogin;
export default AdminLogin;
