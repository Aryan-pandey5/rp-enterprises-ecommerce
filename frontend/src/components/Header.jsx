import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  ShoppingCart,
  FileText,
  Bell,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";

// Handles the common header and navigation bar shared across storefront pages.
const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const { user, isAuthenticated, accessToken, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, toggleLanguage, t, isHindi } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch unread notification count for authenticated customer
    if (isAuthenticated && accessToken) {
      const fetchUnread = async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/notifications/unread-count/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setUnreadNotifs(data.unread_count);
          }
        } catch (err) {
          console.error("Error fetching unread notification count:", err);
        }
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 15000); // Polling every 15 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken, location.pathname]);

  // Main Navigation links list using translation keys
  const navLinks = [
    { name: t("disposableProducts"), path: "/disposable-products" },
    { name: t("rawMaterials"), path: "/raw-materials" },
    { name: t("allCatalog"), path: "/products" },
    { name: t("about"), path: "/about" },
    { name: t("contact"), path: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/assets/logo.png"
                alt="R.P. Enterprises Logo"
                className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden h-10 w-10 bg-emerald-600 rounded-lg items-center justify-center text-white font-bold text-lg shadow-sm">
                RP
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  R.P. ENTERPRISES
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  Disposable Products & Raw Material
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Auth State, Cart, Language, Theme Toggle & User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Global Language Selector Button */}
            <div className="relative">
              <button
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="Change language / भाषा बदलें"
                aria-label="Change language"
              >
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>🌐 {language === "hi" ? "हिंदी" : "English"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {langDropdown && (
                <div
                  className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in duration-150"
                  onMouseLeave={() => setLangDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setLangDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between ${
                      language === "en"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>English</span>
                    {language === "en" && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("hi");
                      setLangDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between ${
                      language === "hi"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>हिंदी</span>
                    {language === "hi" && <span>✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Global Light / Dark Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Cart Link Button */}
            <Link
              to={isAuthenticated ? "/cart" : "/login"}
              className="relative flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{t("cart")}</span>
              {isAuthenticated && itemCount > 0 && (
                <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notifications Button */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="View Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                    {unreadNotifs}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center space-x-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 px-3.5 py-2 rounded-xl text-sm font-bold border border-emerald-200/80 dark:border-emerald-800 transition-all cursor-pointer"
                >
                  <div className="h-7 w-7 bg-emerald-700 text-white rounded-lg flex items-center justify-center text-xs font-black">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </button>

                {/* User Dropdown */}
                {userDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-200"
                    onMouseLeave={() => setUserDropdown(false)}
                  >
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                    >
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>My Orders</span>
                    </Link>

                    {user?.is_staff && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                        >
                          <span className="w-4 h-4 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded flex items-center justify-center">
                            D
                          </span>
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/products"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                        >
                          <span className="w-4 h-4 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded flex items-center justify-center">
                            P
                          </span>
                          <span>Admin Products</span>
                        </Link>
                        <a
                          href={`${(import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/admin/`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                        >
                          <span className="w-4 h-4 text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded flex items-center justify-center">
                            A
                          </span>
                          <span>Django Admin</span>
                        </a>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium border-t border-slate-100 dark:border-slate-700 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Signup</span>
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center space-x-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs border border-transparent dark:border-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Login</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button & Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              title="Change language / भाषा बदलें"
              aria-label="Change language"
            >
              🌐 {language === "hi" ? "हिंदी" : "EN"}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                toggleLanguage();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>{t("changeLanguage")}</span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">
                🌐 {language === "hi" ? "हिंदी" : "English"}
              </span>
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  My Profile ({user?.name})
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  My Orders
                </Link>
                {user?.is_staff && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-base font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-bold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-3 bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Login / Signup
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-3 bg-slate-900 text-white font-bold rounded-xl"
                >
                  Admin Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
