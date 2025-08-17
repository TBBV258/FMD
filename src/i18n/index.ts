import { useState, useEffect } from 'react';
import type { Language } from '@/lib/types';
import { ptTranslations } from './pt';
import { enTranslations } from './en';

const STORAGE_KEY = 'findmydocs_language';

const translations = {
  pt: ptTranslations,
  en: enTranslations,
} as const;

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || 'pt';
  });

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    // Fallback to Portuguese if not found in current language
    if (value === undefined && currentLanguage !== 'pt') {
      value = translations.pt;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
    }
    
    return value || key;
  };

  // Set initial language on document
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return {
    currentLanguage,
    setLanguage,
    t,
  };
}

// Standalone function for use outside components
export function getTranslation(key: string, lang: Language = 'pt'): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  // Fallback to Portuguese if not found
  if (value === undefined && lang !== 'pt') {
    value = translations.pt;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
  }
  
  return value || key;
}
