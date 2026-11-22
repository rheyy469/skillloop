import React, { createContext, useContext, useState } from 'react';

export type AppLanguage = 'id' | 'en';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  tx: (idText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'skillloop_ui_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'id') return saved;
    } catch {
      // Ignore
    }
    return 'id';
  });

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'id' ? 'en' : 'id');
  };

  const tx = (idText: string, enText: string) => (lang === 'en' ? enText : idText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, tx }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
