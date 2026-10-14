import React from 'react';
import { useEcosystemTranslation, AppLanguage } from '../../hooks/useEcosystemTranslation';
import { Globe, Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'dropdown' | 'compact' | 'light' | 'dark';
  className?: string;
  showIcon?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  className = '',
  showIcon = true
}) => {
  const { lang, setLang } = useEcosystemTranslation();

  const toggleLang = (newLang: AppLanguage) => {
    setLang(newLang);
  };

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center shrink-0 flex-nowrap whitespace-nowrap bg-slate-200/90 p-0.5 rounded-lg border border-slate-300 shadow-2xs select-none gap-0.5 ${className}`}
      >
        <button
          type="button"
          onClick={() => toggleLang('id')}
          className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer leading-none ${
            lang === 'id'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
          title="Bahasa Indonesia"
        >
          <span className="shrink-0 leading-none">🇮🇩</span>
          <span className="shrink-0 whitespace-nowrap leading-none">ID</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLang('ja')}
          className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer leading-none ${
            lang === 'ja'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
          title="日本語 (Japanese)"
        >
          <span className="shrink-0 leading-none">🇯🇵</span>
          <span className="shrink-0 whitespace-nowrap leading-none">JA</span>
        </button>
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div
        className={`inline-flex items-center shrink-0 flex-nowrap whitespace-nowrap bg-slate-900/90 backdrop-blur-xs p-1 rounded-xl border border-slate-700 shadow-sm select-none gap-1 ${className}`}
      >
        {showIcon && (
          <div className="pl-1.5 pr-0.5 text-amber-400 shrink-0 flex items-center">
            <Languages className="w-3.5 h-3.5 shrink-0" />
          </div>
        )}
        <button
          type="button"
          onClick={() => toggleLang('id')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer leading-none ${
            lang === 'id'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Tampilkan dalam Bahasa Indonesia"
        >
          <span className="shrink-0 leading-none">🇮🇩</span>
          <span className="text-[11px] shrink-0 whitespace-nowrap font-bold leading-none">Indonesia</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLang('ja')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer leading-none ${
            lang === 'ja'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="日本語で表示する"
        >
          <span className="shrink-0 leading-none">🇯🇵</span>
          <span className="text-[11px] shrink-0 whitespace-nowrap font-bold leading-none">日本語</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center shrink-0 flex-nowrap whitespace-nowrap bg-white p-1 rounded-xl border border-slate-200 shadow-xs select-none gap-1 ${className}`}
    >
      {showIcon && (
        <div className="pl-1.5 pr-0.5 text-purple-700 shrink-0 flex items-center">
          <Globe className="w-3.5 h-3.5 shrink-0" />
        </div>
      )}
      <button
        type="button"
        onClick={() => toggleLang('id')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer leading-none ${
          lang === 'id'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Tampilkan dalam Bahasa Indonesia"
      >
        <span className="shrink-0 leading-none">🇮🇩</span>
        <span className="text-[11px] shrink-0 whitespace-nowrap font-bold leading-none">Indonesia</span>
      </button>
      <button
        type="button"
        onClick={() => toggleLang('ja')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer leading-none ${
          lang === 'ja'
            ? 'bg-red-700 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="日本語で表示する"
      >
        <span className="shrink-0 leading-none">🇯🇵</span>
        <span className="text-[11px] shrink-0 whitespace-nowrap font-bold leading-none">日本語</span>
      </button>
    </div>
  );
};
