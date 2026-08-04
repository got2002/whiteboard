import React, { createContext, useContext, useState, useEffect } from 'react';
import th from './locales/th';
import en from './locales/en';
import zh from './locales/zh';

const I18nContext = createContext();

const dictionaries = {
  th,
  en,
  zh
};

export const I18nProvider = ({ children }) => {
  // Default to 'th' on every fresh start, no localStorage persistence
  const [lang, setLang] = useState('th');

  // Translation function
  // key can be nested, e.g., 'header.title'
  const t = (key) => {
    const keys = key.split('.');
    let value = dictionaries[lang];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to key if not found
        return key;
      }
    }
    return value;
  };

  const value = {
    lang,
    setLang,
    language: lang,
    changeLanguage: setLang,
    t,
    langs: [
      { code: 'th', label: 'ไทย', flag: '🇹🇭' },
      { code: 'en', label: 'English', flag: '🇬🇧' },
      { code: 'zh', label: '中文', flag: '🇨🇳' }
    ]
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
