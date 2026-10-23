import React, { useEffect, useState } from 'react';
import { Check, Sparkles, X, Sun, Moon, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoveMateLogo, LogoStyle, setGlobalLogoStyle } from './LoveMateLogo';

interface LogoOption {
  id: LogoStyle;
  name: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  recommended?: boolean;
}

const LOGO_OPTIONS: LogoOption[] = [
  {
    id: 'interlocking',
    name: 'Interlocking Harmony',
    badge: 'Modern Partnership • Recommended',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    tagline: 'Continuous ribbon loops forming an abstract heart & infinity connection.',
    description:
      'Inspired by Apple Design Award winners and modern relationship benchmarks. Clean, mathematical SVG vectors with vibrant rose-crimson gradient and crisp Plus Jakarta Sans typography. Scales razor-sharp from a 16px favicon to giant billboards.',
    recommended: true,
  },
  {
    id: 'editorial',
    name: 'Warm Editorial Monogram',
    badge: 'Playfair Display Romance',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    tagline: 'Intertwined "L ♥ M" romance ligature in a warm rose-gold crest.',
    description:
      'Matches the Playfair Display headline styling of your inner pages. Evokes the warmth of a luxury couple’s memory book, intimate journal, and timeless relationship stationery.',
  },
  {
    id: 'pebbles',
    name: 'Dual Souls (Aura Pebbles)',
    badge: 'Coupleship / Paired Aesthetic',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    tagline: 'Two translucent organic pebbles merging into a luminous shared heart.',
    description:
      'Minimalist, calming, psychological emotional wellness look. Soft translucent overlap of rose and warm amber symbolizing two distinct personalities forming one shared space.',
  },
  {
    id: 'legacy',
    name: 'Original Clip-Art (Legacy)',
    badge: 'Original Stock Graphic',
    badgeColor: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    tagline: 'The original raster PNG illustration with silhouette couple & bubble font.',
    description:
      'The previous bitmap graphic featuring man & woman face silhouettes and rounded bubble-gum lettering. Kept for backwards compatibility and direct visual comparison.',
  },
];

interface LogoShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoShowcaseModal: React.FC<LogoShowcaseModalProps> = ({ isOpen, onClose }) => {
  const [currentStyle, setCurrentStyle] = useState<LogoStyle>('interlocking');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('lovemate_active_logo_style') as LogoStyle) || 'interlocking';
    setCurrentStyle(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (id: LogoStyle) => {
    setCurrentStyle(id);
    setGlobalLogoStyle(id);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FAF9F8] rounded-[32px] max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-[#E8E2D9] shadow-2xl p-5 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EBE5DC]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <Palette className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-serif-romance font-bold text-zinc-900 tracking-tight">
                Brand Logo & Identity Studio
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              Select your preferred logo direction. Click any card to apply it live across the entire website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Background switcher for contrast check */}
            <div className="flex items-center bg-zinc-200/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setPreviewBg('light')}
                className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  previewBg === 'light' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500'
                }`}
                title="Preview on Light Linen Background"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Light</span>
              </button>
              <button
                onClick={() => setPreviewBg('dark')}
                className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  previewBg === 'dark' ? 'bg-zinc-900 text-white shadow-2xs font-bold' : 'text-zinc-500'
                }`}
                title="Preview on Dark Onyx Background"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Dark</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 border border-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOGO_OPTIONS.map((opt) => {
            const isActive = currentStyle === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                    : 'bg-white/80 hover:bg-white border-[#E8E2D9] hover:border-zinc-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Badge & Active Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                    {isActive ? (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Active on Website</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-700">
                        Click to activate
                      </span>
                    )}
                  </div>

                  {/* Logo Display Canvas (Light or Dark preview) */}
                  <div
                    className={`p-6 rounded-2xl border transition-colors flex flex-col sm:flex-row items-center justify-center gap-6 ${
                      previewBg === 'light'
                        ? 'bg-[#FDFBF7] border-[#EFE9DF]'
                        : 'bg-[#18181B] border-zinc-800 text-white'
                    }`}
                  >
                    {/* Compact Navbar Look */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Navbar Scale</span>
                      <LoveMateLogo variant="compact" size="md" forcedStyle={opt.id} colorMode={previewBg} />
                    </div>

                    <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

                    {/* App Icon Mark Scale */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 mb-1">App Icon Mark</span>
                      <LoveMateLogo variant="icon" size="lg" forcedStyle={opt.id} colorMode={previewBg} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-serif-romance font-bold text-zinc-900 flex items-center gap-2">
                      <span>{opt.name}</span>
                      {opt.recommended && (
                        <span className="text-[10px] font-sans font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white">
                          Staff Pick
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      {opt.tagline}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-[#FAF7F2] hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-[#E8E2D9]'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Current Active Brand Logo</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Switch Website to This Logo</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-4 rounded-2xl bg-white border border-[#EBE5DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-zinc-500 text-center sm:text-left">
            💡 <strong className="text-zinc-900">Pro tip:</strong> The selected logo applies seamlessly to the Header Navbar, Footer, Mobile Drawer, and AI dialogs.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl shadow-2xs transition-colors shrink-0"
          >
            Done & Keep Selected
          </button>
        </div>
      </div>
    </div>
  );
};
