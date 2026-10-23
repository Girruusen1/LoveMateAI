import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Gamepad2,
  Heart,
  MessageCircle,
  Search,
  Sparkles,
  Sprout,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { EXPLORE_GROUPS } from '../layout/Navbar';

export const SearchModal: React.FC = () => {
  const {
    searchOpen,
    setSearchOpen,
    setActiveTab,
    savedConfessions,
    timelineMilestones,
    importantDates,
    growthChallenges,
  } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const allTools: { title: string; tab: ActiveTab; category: string; icon: React.ReactNode }[] = [
    { title: 'Ask LoveMate', tab: 'copilot', category: 'Main', icon: <Sparkles /> },
    { title: 'AI chat', tab: 'chat', category: 'Main', icon: <MessageCircle /> },
    { title: 'Our Space', tab: 'our-space', category: 'Main', icon: <Heart /> },
    { title: 'Couple calendar', tab: 'couple-calendar', category: 'Main', icon: <Calendar /> },
    ...EXPLORE_GROUPS.flatMap((g) => g.items.map((i) => ({ title: i.label, tab: i.tab, category: g.title, icon: i.icon }))),
    { title: 'Saved library', tab: 'library', category: 'Account', icon: <Bookmark /> },
    { title: 'Profile & settings', tab: 'profile', category: 'Account', icon: <Users /> },
    { title: 'Trust & safety', tab: 'trust-center', category: 'Account', icon: <Sprout /> },
    { title: 'Referrals', tab: 'referrals', category: 'Account', icon: <Gamepad2 /> },
    { title: 'Support', tab: 'support', category: 'Account', icon: <Wrench /> },
  ];

  const filteredTools = allTools.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDates = importantDates.filter(
    (d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.date.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden relative">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search tools, games, timeline, dates, challenges..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredTools.length > 0) {
                e.preventDefault();
                handleSelect(filteredTools[0].tab);
              }
            }}
            className="w-full text-sm bg-transparent border-none focus:outline-hidden text-zinc-900 placeholder:text-zinc-400 font-medium"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-100 border border-zinc-200 rounded text-zinc-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results Container */}
        <div className="max-h-[62vh] overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
              Features ({filteredTools.length})
            </p>
            <div className="space-y-1">
              {filteredTools.slice(0, 10).map((tool) => (
                <button
                  key={tool.title}
                  onClick={() => handleSelect(tool.tab)}
                  className="w-full p-2.5 rounded-xl hover:bg-rose-50/70 text-left flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">{tool.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-zinc-900 group-hover:text-rose-700 transition-colors">
                          {tool.title}
                        </p>
                        <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Important Dates matching search */}
          {filteredDates.length > 0 && (
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
                Important Dates ({filteredDates.length})
              </p>
              <div className="space-y-1">
                {filteredDates.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('important-dates')}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-50/70 text-left flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-zinc-900">{d.title}</span>
                        <p className="text-[11px] text-zinc-500">{d.date}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between px-4">
          <span>Search every LoveMate feature</span>
          <span className="text-rose-600 font-semibold">LoveMate</span>
        </div>
      </div>
    </div>
  );
};
