import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, useT, type UiLanguage } from './index';

interface Props {
  className?: string;
  /** 'select' is a compact native select; 'segmented' is three small pills. */
  variant?: 'select' | 'segmented';
  /** Visually hide the icon (the select still has an accessible label). */
  hideIcon?: boolean;
}

/** Compact interface-language picker (English / Hinglish / हिन्दी). */
export const LanguageSwitch: React.FC<Props> = ({ className = '', variant = 'select', hideIcon = false }) => {
  const { t, lang, setLang } = useT();

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center bg-zinc-100 p-0.5 rounded-lg text-[11px] font-semibold ${className}`} role="radiogroup" aria-label={t('Interface language')}>
        {LANGUAGE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={lang === o.id}
            onClick={() => setLang(o.id)}
            className={`px-2 py-0.5 rounded-md transition-all ${lang === o.id ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <label className={`inline-flex items-center gap-1.5 text-xs text-zinc-600 ${className}`}>
      {!hideIcon && <Languages className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />}
      <span className="sr-only">{t('Interface language')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as UiLanguage)}
        className="h-8 pl-2 pr-6 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:border-rose-400 cursor-pointer"
      >
        {LANGUAGE_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};
