import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useT } from '../../i18n';
import { useTheme, type ThemeSetting } from './theme';

interface Props {
  className?: string;
  /** 'segmented' shows three icon buttons (sun / moon / system); 'cycle' is a single button that cycles through them. */
  variant?: 'segmented' | 'cycle';
  /** Show the text label next to each icon (segmented only). */
  showLabels?: boolean;
}

const OPTIONS: { id: ThemeSetting; icon: React.ReactNode; label: string; title: string }[] = [
  { id: 'light', icon: <Sun />, label: 'Light', title: 'Light theme' },
  { id: 'dark', icon: <Moon />, label: 'Dark', title: 'Dark theme' },
  { id: 'system', icon: <Monitor />, label: 'System', title: 'Follow system theme' },
];

/** Light / dark / system switch. Drop it anywhere (navbar, footer, settings). */
export const ThemeToggle: React.FC<Props> = ({ className = '', variant = 'segmented', showLabels = false }) => {
  const { t } = useT();
  const { theme, setTheme, isDark } = useTheme();

  if (variant === 'cycle') {
    const next: ThemeSetting = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[2];
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        title={`${t(current.title)} · ${t(isDark ? 'Dark' : 'Light')}`}
        aria-label={t('Theme')}
        className={`w-9 h-9 inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors [&>svg]:w-4 [&>svg]:h-4 ${className}`}
      >
        {current.icon}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center bg-zinc-100 p-0.5 rounded-lg ${className}`} role="radiogroup" aria-label={t('Theme')}>
      {OPTIONS.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(o.title)}
            onClick={() => setTheme(o.id)}
            className={`inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold transition-all [&>svg]:w-3.5 [&>svg]:h-3.5 ${
              active ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {o.icon}
            {showLabels && <span>{t(o.label)}</span>}
            {!showLabels && <span className="sr-only">{t(o.label)}</span>}
          </button>
        );
      })}
    </div>
  );
};
