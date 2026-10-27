'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary } from './dictionary';

const LanguageContext = createContext({
  language: 'th',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('th');

  useEffect(() => {
    const saved = localStorage.getItem('ltt_site_language');
    if (saved === 'en' || saved === 'th') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('ltt_site_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const t = (key) => {
    if (dictionary[language] && dictionary[language][key]) {
      return dictionary[language][key];
    }
    if (dictionary.th && dictionary.th[key]) {
      return dictionary.th[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
