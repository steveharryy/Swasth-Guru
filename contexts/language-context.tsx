'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';

export type Language = 'english' | 'hindi' | 'punjabi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations = {
  english: {
    welcome: "Welcome to Swasth Guru in English language",
    tagline: "Your Comprehensive Healthcare Companion",
    chooseLanguage: "Choose Language",
    speakText: "Listen to Welcome"
  },
  hindi: {
    welcome: "स्वस्थ गुरु में आपका स्वागत है",
    tagline: "आपका संपूर्ण स्वास्थ्य साथी",
    chooseLanguage: "भाषा चुनें",
    speakText: "स्वागत संदेश हिंदी में सुनें"
  },
  punjabi: {
    welcome: "ਸਵਸਥ ਗੁਰੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    tagline: "ਤੁਹਾਡਾ ਸੰਪੂਰਨ ਸਿਹਤ ਸਾਥੀ",
    chooseLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    speakText: "ਸੁਆਗਤ ਸੰਦੇਸ਼ ਪੰਜਾਬੀ ਵਿੱਚ ਸੁਣੋ"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('english');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('swasthguru_language') as Language;
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('swasthguru_language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    const langTranslations = translations[language as keyof typeof translations];
    return (langTranslations as any)?.[key] || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL: false
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}