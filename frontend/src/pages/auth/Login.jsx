import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Phone, Lock, LogIn, AlertCircle } from 'lucide-react';

// Customer Login Page
const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Already logged-in user redirect check
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (user?.is_staff || user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (from && from !== '/login' && from !== '/admin/login') {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mobileNumber.trim() || !password) {
      setError('Please fill in both mobile number and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(mobileNumber.trim(), password);
    setSubmitting(false);

    if (result.success) {
      const authenticatedUser = result.user;
      const isAdmin = authenticatedUser?.is_staff || authenticatedUser?.role === 'admin';

      // Role-based login redirect: Admin goes to /admin/dashboard, Customer goes to destination or Home
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const dest = (from === '/login' || from === '/admin/login') ? '/' : from;
        navigate(dest, { replace: true });
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-lg text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('loginHeading')}</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('usernameOrMobile')}
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            <span>{submitting ? t('processing') : t('login')}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>{t('dontHaveAccount')} </span>
          <Link to="/signup" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('createAccount')}
          </Link>
        </div>

      </div>
    </div>
  );
};

export const LoginPage = Login;
export default Login;
