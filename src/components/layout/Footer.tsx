import React from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { LoveMateLogo } from '../common/LoveMateLogo';

/** `member` links only make sense with an account and are hidden from visitors. */
const LINKS: { label: string; tab: ActiveTab; member?: boolean }[] = [
  { label: 'Ask LoveMate', tab: 'copilot', member: true },
  { label: 'Our Space', tab: 'our-space', member: true },
  { label: 'Calendar', tab: 'couple-calendar', member: true },
  { label: 'Saved library', tab: 'library', member: true },
  { label: 'Trust & safety', tab: 'trust-center' },
  { label: 'Support', tab: 'support', member: true },
];

export const Footer: React.FC = () => {
  const { user, setActiveTab, setProModalOpen, openAuthModal } = useApp();

  return (
    <footer className="border-t border-zinc-200/80 bg-white pb-24 lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <LoveMateLogo variant="compact" size="md" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 pl-3 border-l border-zinc-200">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Private by default
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            {LINKS.filter((l) => user || !l.member).map((l) => (
              <button key={l.tab} onClick={() => setActiveTab(l.tab)} className="text-zinc-600 hover:text-zinc-900 transition-colors">
                {l.label}
              </button>
            ))}
            {!user && (
              <button onClick={() => openAuthModal('login')} className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Log in
              </button>
            )}
            <button onClick={() => setProModalOpen(true)} className="text-rose-600 hover:text-rose-700 font-medium">
              {user ? 'LoveMate Pro' : 'Pricing'}
            </button>
          </nav>
        </div>

        <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} LoveMate AI</p>
          <p>LoveMate offers relationship insights and playful advice. It is not a substitute for professional counseling.</p>
        </div>
      </div>
    </footer>
  );
};
