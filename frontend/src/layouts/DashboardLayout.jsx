import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  Users, 
  Package, 
  Layers, 
  Menu, 
  X, 
  LogOut, 
  ArrowLeft,
  Bell,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

// Admin Dashboard Navigation Layout Component.
// Ensures the admin sidebar remains visually fixed on the left while only the main Outlet content scrolls independently.
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user, accessToken, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch unread admin notifications count for staff
    if (accessToken) {
      const fetchAdminUnread = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/notifications/unread-count/?admin=true`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadNotifs(data.unread_count);
          }
        } catch (err) {
          console.error('Error fetching admin unread notifications:', err);
        }
      };

      fetchAdminUnread();
      const interval = setInterval(fetchAdminUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [accessToken, location.pathname]);

  // Admin Sidebar Navigation Item definitions using translation keys
  const adminNavItems = [
    { name: t('adminDashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('notifications'), path: '/admin/notifications', icon: Bell },
    { name: t('adminOrders'), path: '/admin/orders', icon: ShoppingBag },
    { name: t('adminStock'), path: '/admin/stock', icon: Boxes },
    { name: t('adminCustomers'), path: '/admin/customers', icon: Users },
    { name: t('adminProducts'), path: '/admin/products', icon: Package },
    { name: t('adminCategories'), path: '/admin/categories', icon: Layers },
    { name: t('adminGSMPrices'), path: '/admin/gsm-prices', icon: Layers },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Outer viewport container fixed to exactly 100vh to prevent browser body scrollbars
    <div className="h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col lg:flex-row transition-colors duration-200">
      
      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 z-30 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center font-black text-white text-xs">
            RP
          </div>
          <span className="font-bold text-sm tracking-tight text-white">{t('adminPortal')}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700"
            title="Change language / भाषा बदलें"
            aria-label="Change language"
          >
            🌐 {language === 'hi' ? 'हिंदी' : 'EN'}
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <Link to="/admin/notifications" className="relative text-slate-300 hover:text-white p-1">
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {unreadNotifs}
              </span>
            )}
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Admin Fixed Sidebar (Fixed position on Desktop, Drawer on Mobile) */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-800
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full justify-between">
          
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Admin Header Branding */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md">
                  RP
                </div>
                <div>
                  <h2 className="font-black text-white text-sm tracking-tight">R.P. Enterprises</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{t('adminPortal')}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Language Toggle in Admin Sidebar Header */}
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  title="Change language / भाषा बदलें"
                  aria-label="Change language"
                >
                  🌐 {language === 'hi' ? 'हिंदी' : 'EN'}
                </button>

                {/* Theme Toggle in Admin Sidebar Header */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
                </button>
              </div>
            </div>

            {/* Navigation Links - Scrollable within sidebar if menu exceeds screen height */}
            <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Actions - Pinned at bottom of sidebar */}
          <div className="space-y-3 pt-4 border-t border-slate-800 shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Storefront ({t('home')})</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Scrollable Main Content Area (Outlet Container) */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100">
        {children || <Outlet />}
      </main>

    </div>
  );
};

export default DashboardLayout;
