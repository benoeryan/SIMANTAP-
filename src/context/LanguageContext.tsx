import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppLanguage, EcosystemDictionary, ECOSYSTEM_DICTIONARY } from '../i18n/ecosystem-i18n';

export interface LanguageContextType {
  lang: AppLanguage;
  isJapanese: boolean;
  setLang: (newLang: AppLanguage) => void;
  toggleLang: () => void;
  t: EcosystemDictionary;
  tScoped: <K extends keyof EcosystemDictionary>(portal: K) => EcosystemDictionary[K];
  translate: (path: string, fallback?: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'ijef_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ja' || saved === 'id') {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for language:', e);
    }
    return 'id';
  });

  // Master setter that broadcasts and persists
  const setLang = useCallback((newLang: AppLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new CustomEvent('ecosystem:language_changed', { detail: { lang: newLang } }));
    } catch (e) {
      console.warn('Unable to save language to localStorage:', e);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ja' ? 'id' : 'ja');
  }, [lang, setLang]);

  // Synchronize across browser tabs and ecosystem custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'ja' || e.newValue === 'id')) {
        setLangState(e.newValue as AppLanguage);
      }
    };

    const handleCustomLangEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: AppLanguage }>;
      if (customEvent.detail && (customEvent.detail.lang === 'ja' || customEvent.detail.lang === 'id')) {
        setLangState(customEvent.detail.lang);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ecosystem:language_changed', handleCustomLangEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ecosystem:language_changed', handleCustomLangEvent);
    };
  }, []);

  // Compute active dictionary
  const t = useMemo(() => {
    return ECOSYSTEM_DICTIONARY[lang] || ECOSYSTEM_DICTIONARY.id;
  }, [lang]);

  // Scoped dictionary getter (e.g. tScoped('adminDoc'))
  const tScoped = useCallback(<K extends keyof EcosystemDictionary>(portal: K): EcosystemDictionary[K] => {
    const dict = ECOSYSTEM_DICTIONARY[lang] || ECOSYSTEM_DICTIONARY.id;
    return dict[portal];
  }, [lang]);

  // Dot-path translation lookup with interpolation fallback
  const translate = useCallback((path: string, fallback?: string, params?: Record<string, string | number>): string => {
    const dict = ECOSYSTEM_DICTIONARY[lang] || ECOSYSTEM_DICTIONARY.id;
    const parts = path.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    let result = typeof current === 'string' ? current : (fallback || path);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(val));
      });
    }

    return result;
  }, [lang]);

  const value = useMemo<LanguageContextType>(() => ({
    lang,
    isJapanese: lang === 'ja',
    setLang,
    toggleLang,
    t,
    tScoped,
    translate
  }), [lang, setLang, toggleLang, t, tScoped, translate]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useEcosystemTranslation = () => {
  const languageContext = useLanguage();
  const { lang, isJapanese, setLang, toggleLang, t, tScoped, translate } = languageContext;

  const bilingual = useCallback((idText: string, jaText: string): string => {
    return lang === 'ja' ? jaText : idText;
  }, [lang]);

  return {
    lang,
    isJapanese,
    setLang,
    toggleLang,
    t,
    tScoped,
    translate,
    bilingual
  };
};

