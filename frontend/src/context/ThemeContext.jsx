import React, { createContext, useContext, useState, useEffect } from 'react';

// Create ThemeContext for central application light/dark mode state management
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const STORAGE_KEY = 'rp-enterprises-theme';

  // Initialize theme from localStorage or system OS preference
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Error reading theme from localStorage:', e);
    }
    return 'light';
  });

  // Synchronize document element class and data-theme attribute whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, [theme]);

  // Toggle function between light and dark mode
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to consume ThemeContext safely throughout the application
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
