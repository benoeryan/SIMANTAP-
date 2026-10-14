import { useLanguage, LanguageContextType } from '../context/LanguageContext';
import { AppLanguage, EcosystemDictionary } from '../i18n/ecosystem-i18n';

export type { AppLanguage, EcosystemDictionary };

/**
 * Global Centralized Shared Localization Hook
 * Can be imported and used by ANY portal component across the entire ecosystem.
 *
 * Usage Examples:
 *
 * 1. General usage:
 *    const { lang, isJapanese, setLang, toggleLang, t, tScoped } = useEcosystemTranslation();
 *    <h1>{t.adminDoc.portalTitle}</h1>
 *
 * 2. Scoped usage:
 *    const { scoped: docT, lang, isJapanese } = useEcosystemTranslation('adminDoc');
 *    <button>{docT.syncDrive}</button>
 *
 * 3. Quick bilingual text chooser:
 *    const { bilingual } = useEcosystemTranslation();
 *    <span>{bilingual('Simpan Data', 'データを保存')}</span>
 */
export function useEcosystemTranslation<K extends keyof EcosystemDictionary>(portalScope?: K) {
  const languageContext = useLanguage();

  const scoped = portalScope ? languageContext.tScoped(portalScope) : undefined;

  /**
   * Quick inline bilingual selector helper
   * Returns ja text when lang is 'ja', otherwise id text
   */
  const bilingual = (idText: string, jaText: string): string => {
    return languageContext.lang === 'ja' ? jaText : idText;
  };

  return {
    ...languageContext,
    scoped: scoped as K extends keyof EcosystemDictionary ? EcosystemDictionary[K] : undefined,
    bilingual
  };
}

export const useTranslation = useEcosystemTranslation;
export default useEcosystemTranslation;
