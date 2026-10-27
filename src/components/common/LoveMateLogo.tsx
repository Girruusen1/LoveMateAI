import React, { useEffect, useState } from 'react';

export type LogoStyle = 'interlocking' | 'editorial' | 'pebbles' | 'legacy';

interface LoveMateLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  forcedStyle?: LogoStyle;
  showStylePicker?: boolean;
  colorMode?: 'light' | 'dark' | 'auto';
}

const STORAGE_KEY = 'lovemate_active_logo_style';

/**
 * Modern SVG Logo Mark 1: "Interlocking Harmony"
 * Two continuous, flowing ribbon loops forming an abstract heart & infinity connection.
 */
export const InterlockingMark: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-9 h-9',
  className = '',
}) => (
  <svg
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${sizeClass} shrink-0 ${className}`}
    aria-label="LoveMate Interlocking Mark"
  >
    <defs>
      <linearGradient id="lm-knot-grad1" x1="4" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="45%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id="lm-knot-grad2" x1="40" y1="6" x2="6" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="55%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>
      <filter id="lm-subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#E11D48" floodOpacity="0.22" />
      </filter>
    </defs>

    {/* Soft tinted squircle vessel */}
    <rect x="1" y="1" width="42" height="42" rx="13" fill="#FFF5F6" stroke="#FFE4E8" strokeWidth="1.2" />

    {/* Intertwined Heart Infinity Knot */}
    <g filter="url(#lm-subtle-glow)">
      {/* Primary ribbon: Left heart lobe & crossover */}
      <path
        d="M22 34C15.8 29.2 9 22.8 9 15.6C9 10.4 13 6.8 17.8 6.8C20.8 6.8 23.4 8.4 24.8 11.2C23.2 14.5 20.8 19 20.8 23.5C20.8 27.5 21.4 31 22 34Z"
        fill="url(#lm-knot-grad1)"
      />
      {/* Secondary ribbon: Right heart lobe intertwining under & over */}
      <path
        d="M22 34C28.2 29.2 35 22.8 35 15.6C35 10.4 31 6.8 26.2 6.8C23.2 6.8 20.6 8.4 19.2 11.2C20.8 14.5 23.2 19 23.2 23.5C23.2 27.5 22.6 31 22 34Z"
        fill="url(#lm-knot-grad2)"
        opacity="0.95"
      />
      {/* Central embrace overlay (unbroken unity heart highlight) */}
      <path
        d="M22 13.5C20.6 11 19.2 9.2 17.8 9.2C14.5 9.2 11.8 11.8 11.8 15.6C11.8 20.8 16.5 26.4 22 30.8C27.5 26.4 32.2 20.8 32.2 15.6C32.2 11.8 29.5 9.2 26.2 9.2C24.8 9.2 23.4 11 22 13.5Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.75"
      />
      {/* Golden spark at apex */}
      <circle cx="22" cy="7" r="1.6" fill="#F59E0B" />
    </g>
  </svg>
);

/**
 * Modern SVG Logo Mark 2: "Warm Editorial Monogram"
 * Refined 'L + M' intertwined romance ligature enclosed in warm rose-gold crest.
 */
export const EditorialMonogramMark: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-9 h-9',
  className = '',
}) => (
  <svg
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${sizeClass} shrink-0 ${className}`}
    aria-label="LoveMate Editorial Monogram"
  >
    <defs>
      <linearGradient id="lm-edit-crest" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFDFB" />
        <stop offset="100%" stopColor="#FFF1F2" />
      </linearGradient>
      <linearGradient id="lm-edit-gold" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BE123C" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
    </defs>

    {/* Warm circular crest with double border */}
    <circle cx="22" cy="22" r="20" fill="url(#lm-edit-crest)" stroke="#F3E5DE" strokeWidth="1.5" />
    <circle cx="22" cy="22" r="17" stroke="#FFE4E6" strokeWidth="0.8" strokeDasharray="2 2" />

    {/* Monogram Ligature (L ♥ M) */}
    {/* Serif L */}
    <path
      d="M13 13V27.5C13 28.5 13.5 29 15 29H20.5"
      stroke="url(#lm-edit-gold)"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M11.5 13H15" stroke="url(#lm-edit-gold)" strokeWidth="2" strokeLinecap="round" />

    {/* Elegant Heart connecting L and M */}
    <path
      d="M21.5 24C20.5 22.5 18.5 22.5 17.5 24C16 26 19.5 28.5 21.5 30C23.5 28.5 27 26 25.5 24C24.5 22.5 22.5 22.5 21.5 24Z"
      fill="#E11D48"
    />

    {/* Serif M */}
    <path
      d="M23 29V14.5L28 23L33 14.5V29"
      stroke="url(#lm-edit-gold)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M21.5 29H24.5M31.5 29H34.5" stroke="url(#lm-edit-gold)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Modern SVG Logo Mark 3: "Dual Souls / Aura Pebbles"
 * Two translucent, overlapping organic discs that merge into a glowing third heart center.
 */
export const PebblesAuraMark: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-9 h-9',
  className = '',
}) => (
  <svg
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${sizeClass} shrink-0 ${className}`}
    aria-label="LoveMate Dual Souls Mark"
  >
    <defs>
      <linearGradient id="lm-peb-rose" x1="4" y1="6" x2="28" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="lm-peb-amber" x1="40" y1="6" x2="16" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>

    {/* Warm background plate */}
    <rect x="1" y="1" width="42" height="42" rx="14" fill="#FAF7F2" stroke="#EFE9DE" strokeWidth="1" />

    {/* Left Aura Pebble (Rose) */}
    <ellipse cx="18" cy="22" rx="10.5" ry="12" transform="rotate(-15 18 22)" fill="url(#lm-peb-rose)" opacity="0.88" />

    {/* Right Aura Pebble (Amber/Coral) */}
    <ellipse cx="26" cy="22" rx="10.5" ry="12" transform="rotate(15 26 22)" fill="url(#lm-peb-amber)" opacity="0.82" />

    {/* Central Heart of Confluence */}
    <path
      d="M22 17.5C20.8 15.8 18.5 15.8 17.5 17.2C16 19.2 19.5 22.8 22 25C24.5 22.8 28 19.2 26.5 17.2C25.5 15.8 23.2 15.8 22 17.5Z"
      fill="#FFFFFF"
      opacity="0.95"
    />
    <circle cx="22" cy="13.5" r="1.3" fill="#F59E0B" />
  </svg>
);

/**
 * Legacy Raster Logo (Fallback)
 */
const MARK_LEGACY = '/brand/logo-mark.png';
const WORDMARK_LEGACY = '/brand/logo-wordmark.png';
const FULL_LEGACY = '/brand/logo-full.png';

export const LoveMateLogo: React.FC<LoveMateLogoProps> = ({
  variant = 'compact',
  size = 'md',
  showTagline = false,
  className = '',
  forcedStyle,
  showStylePicker = false,
  colorMode = 'auto',
}) => {
  const [activeStyle, setActiveStyle] = useState<LogoStyle>('interlocking');

  // Load preferred style from localStorage or sync with custom events
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LogoStyle | null;
    if (saved && ['interlocking', 'editorial', 'pebbles', 'legacy'].includes(saved)) {
      setActiveStyle(saved);
    }

    const handleStorageChange = () => {
      const updated = localStorage.getItem(STORAGE_KEY) as LogoStyle | null;
      if (updated) setActiveStyle(updated);
    };

    window.addEventListener('lovemate_logo_style_changed', handleStorageChange);
    return () => window.removeEventListener('lovemate_logo_style_changed', handleStorageChange);
  }, []);

  const currentStyle = forcedStyle || activeStyle;

  const markSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const primaryTextColor = colorMode === 'dark' ? 'text-white' : 'text-zinc-900';
  const subTextColor = colorMode === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  // Render Mark based on selected style
  const renderMark = () => {
    if (currentStyle === 'legacy') {
      const hClass = { sm: 'h-7', md: 'h-10', lg: 'h-14', xl: 'h-20' }[size];
      return <img src={MARK_LEGACY} alt="LoveMate" className={`${hClass} w-auto shrink-0 select-none`} draggable={false} />;
    }
    if (currentStyle === 'editorial') {
      return <EditorialMonogramMark sizeClass={markSizeClasses} />;
    }
    if (currentStyle === 'pebbles') {
      return <PebblesAuraMark sizeClass={markSizeClasses} />;
    }
    // Default: interlocking
    return <InterlockingMark sizeClass={markSizeClasses} />;
  };

  // Render Wordmark based on selected style
  const renderWordmark = () => {
    if (currentStyle === 'legacy') {
      const hClass = { sm: 'h-[15px]', md: 'h-[21px]', lg: 'h-7', xl: 'h-10' }[size];
      return <img src={WORDMARK_LEGACY} alt="LoveMate" className={`lm-legacy-wordmark ${hClass} w-auto ${colorMode === 'dark' ? 'brightness-125' : ''}`} draggable={false} />;
    }

    if (currentStyle === 'editorial') {
      const titleSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' }[size];
      return (
        <span className="flex flex-col leading-none">
          <span className={`${titleSize} font-serif-romance font-bold ${primaryTextColor} tracking-tight`}>
            Love<span className="text-rose-500 font-serif-romance italic">Mate</span>
          </span>
          {showTagline && (
            <span className={`text-[9px] uppercase tracking-[0.18em] font-semibold ${subTextColor} mt-1`}>
              Couple Sanctuary
            </span>
          )}
        </span>
      );
    }

    if (currentStyle === 'pebbles') {
      const titleSize = { sm: 'text-sm font-semibold', md: 'text-lg font-bold', lg: 'text-2xl font-bold', xl: 'text-3xl font-extrabold' }[size];
      return (
        <span className="flex flex-col leading-none">
          <span className={`${titleSize} ${primaryTextColor} tracking-tight flex items-center`}>
            love<span className="text-rose-500 font-bold">mate</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 ml-1 mb-0.5 animate-pulse" />
          </span>
          {showTagline && (
            <span className={`text-[10px] ${subTextColor} font-medium mt-1`}>
              Connection & Intimacy
            </span>
          )}
        </span>
      );
    }

    // Default: 'interlocking'
    const titleSize = { sm: 'text-base font-bold', md: 'text-[19px] font-extrabold', lg: 'text-2xl font-extrabold', xl: 'text-3xl font-extrabold' }[size];
    return (
      <span className="flex flex-col leading-none">
        <span className={`${titleSize} ${primaryTextColor} tracking-tight flex items-baseline`}>
          <span>Love</span>
          <span className="text-rose-500 font-bold ml-[1px]">Mate</span>
          <span className="text-rose-400 text-xs ml-0.5 font-sans">✦</span>
        </span>
        {showTagline && (
          <span className={`text-[10px] uppercase font-bold tracking-widest ${subTextColor} mt-1`}>
            Relationship AI Copilot
          </span>
        )}
      </span>
    );
  };

  // Icon only
  if (variant === 'icon') {
    return <span className={`inline-flex items-center justify-center ${className}`}>{renderMark()}</span>;
  }

  // Full stacked
  if (variant === 'full') {
    if (currentStyle === 'legacy') {
      const fullH = { sm: 'h-20', md: 'h-28', lg: 'h-40', xl: 'h-56' }[size];
      return (
        <span className={`inline-flex flex-col items-center select-none ${className}`}>
          <img src={FULL_LEGACY} alt="LoveMate" className={`${fullH} w-auto`} draggable={false} />
          {showTagline && <span className="text-xs text-zinc-500 mt-2">Your AI wingman for love & relationships</span>}
        </span>
      );
    }

    return (
      <span className={`inline-flex flex-col items-center gap-2 select-none text-center ${className}`}>
        {renderMark()}
        {renderWordmark()}
      </span>
    );
  }

  // Compact row (Navbar / Footer standard)
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {renderMark()}
      {renderWordmark()}
    </span>
  );
};

/**
 * Helper to update logo style globally
 */
export const setGlobalLogoStyle = (style: LogoStyle) => {
  localStorage.setItem(STORAGE_KEY, style);
  window.dispatchEvent(new Event('lovemate_logo_style_changed'));
};
