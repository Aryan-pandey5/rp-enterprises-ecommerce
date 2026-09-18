import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en';
import hi from '../translations/hi';

// Create LanguageContext for global application language state management
const LanguageContext = createContext();

const translations = { en, hi };

export const LanguageProvider = ({ children }) => {
  const STORAGE_KEY = 'rp-enterprises-language';

  // Initialize language state from localStorage with fallback to default English ('en')
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY);
      if (savedLanguage === 'hi' || savedLanguage === 'en') {
        return savedLanguage;
      }
    } catch (e) {
      console.error('Error reading language from localStorage:', e);
    }
    return 'en';
  });

  // Persist language selection to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      console.error('Error saving language to localStorage:', e);
    }
  }, [language]);

  // Toggle function between English and Hindi
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  // Translation lookup function with placeholder interpolation (e.g. t('inStockCount', { count: 5 }))
  const t = (key, params = {}) => {
    const langDict = translations[language] || translations.en;
    let translation = langDict[key] || translations.en[key] || key;

    if (params && typeof params === 'object') {
      Object.keys(params).forEach((paramKey) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isHindi: language === 'hi',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to consume LanguageContext safely throughout the application
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
