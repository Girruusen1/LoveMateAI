import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  BookHeart,
  BookOpen,
  Brain,
  Calendar,
  CalendarHeart,
  Camera,
  ChevronDown,
  Clapperboard,
  Compass,
  Dices,
  Dna,
  Flame,
  FlaskConical,
  Gamepad2,
  Gift,
  Globe,
  Headphones,
  Heart,
  HeartHandshake,
  Images,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LogOut,
  Mail,
  MapPinned,
  MessageCircleHeart,
  MessageSquare,
  MessageSquareText,
  Mic,
  Moon,
  Navigation,
  Orbit,
  Palette,
  Plane,
  Radar,
  Scan,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  Store,
  Sun,
  Target,
  Trophy,
  User,
  Users,
  Wand2,
  Wine,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PLANS } from '../../utils/plans';
import { ActiveTab, CurrencyCode } from '../../types';
import { LoveMateLogo } from '../common/LoveMateLogo';

type NavItem = { label: string; tab: ActiveTab; icon: React.ReactNode };
/** stack: in the desktop mega-menu, show this group under the previous one (keeps the menu six columns wide). */
type NavGroup = { title: string; items: NavItem[]; stack?: boolean };

const PRIMARY: NavItem[] = [
  { label: 'Home', tab: 'home', icon: <LayoutDashboard /> },
  { label: 'Ask LoveMate', tab: 'copilot', icon: <Sparkles /> },
  { label: 'Our Space', tab: 'our-space', icon: <Heart /> },
  { label: 'Calendar', tab: 'couple-calendar', icon: <Calendar /> },
];

export const EXPLORE_GROUPS: NavGroup[] = [
  {
    title: 'Understand',
    items: [
      { label: 'Decode a message', tab: 'decode', icon: <Search /> },
      { label: 'Screenshot analyzer', tab: 'screenshot', icon: <Camera /> },
      { label: 'Reply copilot', tab: 'reply-copilot', icon: <MessageSquareText /> },
      { label: 'Relationship detective', tab: 'detective', icon: <Scan /> },
      { label: 'Relationship signals', tab: 'relationship-signals', icon: <Radar /> },
      { label: 'Does my crush like me?', tab: 'crush-analyzer', icon: <Target /> },
      { label: 'Should I confess?', tab: 'should-confess', icon: <HeartHandshake /> },
      { label: 'What if?', tab: 'what-if', icon: <FlaskConical /> },
    ],
  },
  {
    title: 'Create',
    items: [
      { label: 'Confession studio', tab: 'confession', icon: <Mail /> },
      { label: 'What should I reply?', tab: 'reply', icon: <MessageSquare /> },
      { label: 'Make this better', tab: 'message-transformer', icon: <Wand2 /> },
      { label: 'Love cards', tab: 'love-cards', icon: <Palette /> },
      { label: 'Our story', tab: 'our-story', icon: <BookHeart /> },
      { label: 'AI love story', tab: 'stories', icon: <BookOpen /> },
      { label: 'Scrapbook', tab: 'scrapbook', icon: <Images /> },
      { label: 'Story movie', tab: 'our-story-movie', icon: <Clapperboard /> },
    ],
  },
  {
    title: 'Plan',
    items: [
      { label: 'Date planner', tab: 'date-planner', icon: <Wine /> },
      { label: 'Date & gift ideas', tab: 'date-gift', icon: <Gift /> },
      { label: 'Gift intelligence', tab: 'gift-intelligence', icon: <ShoppingBag /> },
      { label: 'Trip together', tab: 'trip-together', icon: <Plane /> },
      { label: 'Wishlist', tab: 'wishlist', icon: <Star /> },
      { label: 'Important dates', tab: 'important-dates', icon: <CalendarHeart /> },
      { label: 'Timeline', tab: 'timeline', icon: <MapPinned /> },
    ],
  },
  {
    title: 'Play & practice',
    items: [
      { label: 'Couple games', tab: 'games', icon: <Gamepad2 /> },
      { label: 'Infinite games', tab: 'infinite-games', icon: <Dices /> },
      { label: 'Chemistry mode', tab: 'chemistry-mode', icon: <Zap /> },
      { label: 'Challenges', tab: 'challenges', icon: <Sprout /> },
      { label: 'Roleplay practice', tab: 'roleplay', icon: <Headphones /> },
      { label: 'Voice chat', tab: 'voice-chat', icon: <Mic /> },
      { label: 'Wingman mode', tab: 'wingman-mode', icon: <Compass /> },
      { label: 'Love calculator', tab: 'calculator', icon: <Heart /> },
    ],
  },
  {
    title: 'Grow',
    items: [
      { label: 'Relationship dashboard', tab: 'relationship-dashboard', icon: <Activity /> },
      { label: 'Check-in', tab: 'health-check', icon: <ListChecks /> },
      { label: 'Patterns & trends', tab: 'relationship-patterns', icon: <Navigation /> },
      { label: 'Relationship DNA', tab: 'relationship-dna', icon: <Dna /> },
      { label: 'Memory center', tab: 'memory-center', icon: <Brain /> },
      { label: 'Couples coach', tab: 'couple-coach', icon: <Users /> },
      { label: 'Conversation coach', tab: 'conversation-coach', icon: <MessageCircleHeart /> },
      { label: 'Tone coach', tab: 'communication-coach', icon: <Mic /> },
      { label: 'Tough moments', tab: 'relationship-helper', icon: <LifeBuoy /> },
    ],
  },
  {
    title: 'Together',
    items: [
      { label: 'Couple mode', tab: 'couple-mode', icon: <Users /> },
      { label: 'Long distance', tab: 'long-distance', icon: <Globe /> },
      { label: 'Wrapped', tab: 'wrapped', icon: <Trophy /> },
    ],
  },
  {
    title: 'Jyotish',
    stack: true,
    items: [
      { label: 'Kundli Milan', tab: 'kundli', icon: <Orbit /> },
      { label: 'My kundli', tab: 'my-kundli', icon: <Moon /> },
      { label: 'Daily love rashifal', tab: 'rashifal', icon: <Sun /> },
    ],
  },
];

/** Groups per desktop menu column (a stacked group joins the column before it). */
const EXPLORE_COLUMNS: NavGroup[][] = EXPLORE_GROUPS.reduce<NavGroup[][]>((cols, g) => {
  if (g.stack && cols.length) cols[cols.length - 1].push(g);
  else cols.push([g]);
  return cols;
}, []);

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  CAD: '$',
};

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    openAuthModal,
    logout,
    setSearchOpen,
    setProModalOpen,
    notifications,
    setNotificationsModalOpen,
    setMagicButtonModalOpen,
    globalization,
    updateGlobalization,
    userSubscription,
    plan,
    trialDaysLeft,
    planFromPartner,
    isAdmin,
  } = useApp();

  const [exploreOpen, setExploreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isPaid = plan !== 'free';
  const planLabel =
    trialDaysLeft !== null
      ? `Plus trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
      : planFromPartner
        ? 'Couple (from your partner)'
        : `LoveMate ${PLANS[plan].name}`;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExploreOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (tab: ActiveTab) => {
    setActiveTab(tab);
    setExploreOpen(false);
    setAccountOpen(false);
  };

  const exploreActive = EXPLORE_GROUPS.some((g) => g.items.some((i) => i.tab === activeTab));

  const iconBtn =
    'w-9 h-9 inline-flex items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors relative';

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="shrink-0 flex items-center gap-2">
          <button onClick={() => go('home')} className="shrink-0 flex items-center cursor-pointer" aria-label="LoveMate home">
            <LoveMateLogo variant="compact" size="md" />
          </button>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {PRIMARY.filter((item) => user || item.tab === 'home').map((item) => {
            const active = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => go(item.tab)}
                className={`px-3.5 h-9 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-rose-50 text-rose-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div ref={exploreRef}>
            <button
              onClick={() => setExploreOpen((o) => !o)}
              aria-expanded={exploreOpen}
              className={`px-3.5 h-9 rounded-xl text-sm font-medium whitespace-nowrap inline-flex items-center gap-1 transition-colors ${
                exploreOpen || exploreActive ? 'bg-rose-50 text-rose-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Explore
              <ChevronDown className={`w-4 h-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
            </button>

            {exploreOpen && (
              <div className="absolute left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 top-full mt-1 max-h-[75vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-zinc-200 p-6 grid grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-1 duration-150">
                {EXPLORE_COLUMNS.map((column) => (
                  <div key={column[0].title} className="space-y-5">
                  {column.map((group) => (
                  <div key={group.title}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 px-2">{group.title}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = activeTab === item.tab;
                        return (
                          <li key={item.tab}>
                            <button
                              onClick={() => go(item.tab)}
                              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-[13px] whitespace-nowrap transition-colors [&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0 ${
                                active
                                  ? 'bg-rose-50 text-rose-700 [&>svg]:text-rose-600'
                                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 [&>svg]:text-zinc-400'
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setSearchOpen(true)} className={iconBtn} title="Search (Ctrl+K)" aria-label="Search">
            <Search className="w-[18px] h-[18px]" />
          </button>

          {user && (
            <button
              onClick={() => setNotificationsModalOpen(true)}
              className={iconBtn}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="relative ml-1" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
                className={`flex items-center gap-2 h-9 pl-1 pr-1 lg:pr-2.5 rounded-full border transition-colors ${
                  accountOpen || activeTab === 'profile'
                    ? 'border-rose-300 bg-rose-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden lg:inline text-sm font-medium text-zinc-800 max-w-[96px] truncate">{user.name}</span>
                <ChevronDown className="hidden lg:block w-4 h-4 text-zinc-400" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> {user.streak}-day streak
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" /> {user.points} pts
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">{isPaid ? planLabel : 'Free plan'}</p>
                      <p className="text-[11px] text-zinc-500">{isPaid ? 'Manage your plan' : 'Unlimited AI tools from ₹' + PLANS.plus.monthlyINR}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProModalOpen(true);
                        setAccountOpen(false);
                      }}
                      className="px-3 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      {isPaid ? 'Plans' : 'Upgrade'}
                    </button>
                  </div>

                  <ul className="py-1.5 text-sm">
                    {[
                      { label: 'Profile & settings', tab: 'profile' as ActiveTab, icon: <User /> },
                      { label: 'Saved library', tab: 'library' as ActiveTab, icon: <BookOpen /> },
                      { label: 'Trust & safety', tab: 'trust-center' as ActiveTab, icon: <Shield /> },
                      { label: 'Referrals', tab: 'referrals' as ActiveTab, icon: <Gift /> },
                      { label: 'Support', tab: 'support' as ActiveTab, icon: <Headphones /> },
                    ].map((item) => (
                      <li key={item.tab}>
                        <button
                          onClick={() => go(item.tab)}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-700 hover:bg-zinc-50 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-zinc-400"
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => {
                          setMagicButtonModalOpen(true);
                          setAccountOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
                      >
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        Surprise me
                      </button>
                    </li>
                  </ul>

                  <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <label className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Currency
                    </label>
                    <select
                      value={globalization.currency}
                      onChange={(e) => {
                        const code = e.target.value as CurrencyCode;
                        updateGlobalization({ currency: code, currencySymbol: CURRENCY_SYMBOLS[code] });
                      }}
                      className="text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-2 h-7 text-zinc-700"
                    >
                      {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((c) => (
                        <option key={c} value={c}>
                          {CURRENCY_SYMBOLS[c]} {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-zinc-100 py-1.5 text-sm">
                    {isAdmin && (
                    <button
                      onClick={() => go('admin-hub')}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-500 hover:bg-zinc-50"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      Admin console
                    </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setAccountOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
                    >
                      <LogOut className="w-4 h-4 text-zinc-400" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-flex px-3 h-9 items-center text-sm font-medium text-zinc-700 hover:text-zinc-900 rounded-xl hover:bg-zinc-100"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 h-9 inline-flex items-center text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl whitespace-nowrap"
              >
                Get started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
