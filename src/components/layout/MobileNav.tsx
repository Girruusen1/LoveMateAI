import React, { useState } from 'react';
import { Compass, Heart, Home, Search, Sparkles, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { EXPLORE_GROUPS } from './Navbar';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, user, openAuthModal } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const groups = EXPLORE_GROUPS.map((g) => ({
    ...g,
    items: q ? g.items.filter((i) => i.label.toLowerCase().includes(q) || g.title.toLowerCase().includes(q)) : g.items,
  })).filter((g) => g.items.length > 0);

  const go = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSheetOpen(false);
    setQuery('');
  };

  const tabBtn = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[56px] rounded-xl text-[11px] transition-colors ${
      active ? 'text-rose-600 font-semibold' : 'text-zinc-500 font-medium'
    }`;

  return (
    <>
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end lg:hidden animate-in fade-in duration-150" onClick={() => setSheetOpen(false)}>
          <div
            className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto mt-3 shrink-0" />
            <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0">
              <h3 className="text-base font-bold text-zinc-900">Explore</h3>
              <button onClick={() => setSheetOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Search features"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 text-sm rounded-xl bg-zinc-100 border border-transparent focus:bg-white focus:border-rose-300 focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-5 pb-8 space-y-5">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">{g.title}</p>
                  <ul className="grid grid-cols-2 gap-1.5">
                    {g.items.map((item) => {
                      const active = activeTab === item.tab;
                      return (
                        <li key={item.tab}>
                          <button
                            onClick={() => go(item.tab)}
                            className={`w-full flex items-center gap-2.5 px-3 h-11 rounded-xl text-left text-[13px] border transition-colors [&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0 ${
                              active
                                ? 'bg-rose-50 border-rose-200 text-rose-700 [&>svg]:text-rose-600'
                                : 'bg-white border-zinc-200 text-zinc-700 [&>svg]:text-zinc-400'
                            }`}
                          >
                            {item.icon}
                            <span className="truncate">{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-zinc-500 text-center py-8">No features match “{query}”.</p>}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden flex items-center justify-around" aria-label="Mobile">
        <button onClick={() => go('home')} className={tabBtn(activeTab === 'home')}>
          <Home className="w-5 h-5" />
          Home
        </button>
        <button onClick={() => go('copilot')} className={tabBtn(activeTab === 'copilot')}>
          <Sparkles className="w-5 h-5" />
          Ask AI
        </button>
        <button onClick={() => go('our-space')} className={tabBtn(activeTab === 'our-space')}>
          <Heart className={`w-5 h-5 ${activeTab === 'our-space' ? 'fill-rose-500' : ''}`} />
          Our Space
        </button>
        <button onClick={() => setSheetOpen(true)} className={tabBtn(sheetOpen)}>
          <Compass className="w-5 h-5" />
          Explore
        </button>
        <button onClick={() => (user ? go('profile') : openAuthModal('login'))} className={tabBtn(activeTab === 'profile')}>
          <User className="w-5 h-5" />
          Profile
        </button>
      </nav>
    </>
  );
};
