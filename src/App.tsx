import React, { Suspense, useEffect } from 'react';
import { ToastContainer } from './components/common/ToastContainer';
import { PersonalizedDashboard } from './components/home/PersonalizedDashboard';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { EXPLORE_GROUPS, Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/modals/AuthModal';
import { MagicButtonModal } from './components/modals/MagicButtonModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { ProModal } from './components/modals/ProModal';
import { SearchModal } from './components/modals/SearchModal';
import { ShareModal } from './components/modals/ShareModal';
import { DesignSystemModal } from './components/common/DesignSystemModal';
import { LogoShowcaseModal } from './components/common/LogoShowcaseModal';
import { AppProvider, useApp } from './context/AppContext';
import type { ActiveTab } from './types';
import { PAGE_PLAN } from './utils/plans';
import { RETIRED_TABS, resolveTab } from './utils/routes';
import { lazyView } from './utils/lazy';
import { FeatureGate } from './components/common/FeatureGate';
import { GenAIStatusBanner } from './components/common/GenAIStatusBanner';
import { PageSkeleton } from './components/common/PageSkeleton';

/* Every page but home loads on demand, so the first paint ships only the shell, the landing page and home. */

// Hubs (several tools behind one mode switcher)
const DecodeHub = lazyView(() => import('./components/hubs/DecodeHub').then((m) => m.DecodeHub));
const SituationHub = lazyView(() => import('./components/hubs/SituationHub').then((m) => m.SituationHub));
const ReplyHub = lazyView(() => import('./components/hubs/ReplyHub').then((m) => m.ReplyHub));
const PlanDateHub = lazyView(() => import('./components/hubs/PlanDateHub').then((m) => m.PlanDateHub));
const PracticeHub = lazyView(() => import('./components/hubs/PracticeHub').then((m) => m.PracticeHub));
const InsightsHub = lazyView(() => import('./components/hubs/InsightsHub').then((m) => m.InsightsHub));
const CoupleHub = lazyView(() => import('./components/hubs/CoupleHub').then((m) => m.CoupleHub));
const OurStoryHub = lazyView(() => import('./components/hubs/OurStoryHub').then((m) => m.OurStoryHub));

// Standalone tools
const AIChatView = lazyView(() => import('./components/chat/AIChatView').then((m) => m.AIChatView));
const RelationshipCopilotView = lazyView(() => import('./components/copilot/RelationshipCopilotView').then((m) => m.RelationshipCopilotView));
const VoiceLoveMateView = lazyView(() => import('./components/voice/VoiceLoveMateView').then((m) => m.VoiceLoveMateView));
const ConfessionStudioView = lazyView(() => import('./components/confession/ConfessionStudioView').then((m) => m.ConfessionStudioView));
const LoveCardsView = lazyView(() => import('./components/cards/LoveCardsView').then((m) => m.LoveCardsView));
const TripTogetherView = lazyView(() => import('./components/travel/TripTogetherView').then((m) => m.TripTogetherView));
const ImportantDatesView = lazyView(() => import('./components/dates/ImportantDatesView').then((m) => m.ImportantDatesView));
const CoupleCalendarView = lazyView(() => import('./components/calendar/CoupleCalendarView').then((m) => m.CoupleCalendarView));
const CoupleWishlistView = lazyView(() => import('./components/wishlist/CoupleWishlistView').then((m) => m.CoupleWishlistView));
const WingmanModeView = lazyView(() => import('./components/wingman/WingmanModeView').then((m) => m.WingmanModeView));
const MemoryCenterView = lazyView(() => import('./components/memory/MemoryCenterView').then((m) => m.MemoryCenterView));
const OurSpaceView = lazyView(() => import('./components/space/OurSpaceView').then((m) => m.OurSpaceView));
const CouplesCoachView = lazyView(() => import('./components/coach/CouplesCoachView').then((m) => m.CouplesCoachView));
const LongDistanceView = lazyView(() => import('./components/space/LongDistanceView').then((m) => m.LongDistanceView));
const WrappedView = lazyView(() => import('./components/growth/WrappedView').then((m) => m.WrappedView));
const LoveCalculatorView = lazyView(() => import('./components/calculator/LoveCalculatorView').then((m) => m.LoveCalculatorView));

// Jyotish
const KundliMilanView = lazyView(() => import('./components/jyotish/KundliMilanView').then((m) => m.KundliMilanView));
const MyKundliView = lazyView(() => import('./components/jyotish/MyKundliView').then((m) => m.MyKundliView));
const RashifalView = lazyView(() => import('./components/jyotish/RashifalView').then((m) => m.RashifalView));

// Account, support, admin, legal
const SavedLibraryView = lazyView(() => import('./components/library/SavedLibraryView').then((m) => m.SavedLibraryView));
const ProfileSettingsView = lazyView(() => import('./components/profile/ProfileSettingsView').then((m) => m.ProfileSettingsView));
const NotificationSettingsView = lazyView(() => import('./components/notifications/NotificationSettingsView').then((m) => m.NotificationSettingsView));
const ReferralCenterView = lazyView(() => import('./components/growth/ReferralCenterView').then((m) => m.ReferralCenterView));
const CustomerSupportView = lazyView(() => import('./components/support/CustomerSupportView').then((m) => m.CustomerSupportView));
const TrustSafetyCenterView = lazyView(() => import('./components/trust/TrustSafetyCenterView').then((m) => m.TrustSafetyCenterView));
const AdminDashboardView = lazyView(() => import('./components/admin/AdminDashboardView').then((m) => m.AdminDashboardView));
const LegalView = lazyView(() => import('./components/legal/LegalView').then((m) => m.LegalView));

type PageProps = { initialMode?: ActiveTab };

/** What each page renders. Old tool ids are not keys here; resolveTab() maps them to their hub and mode first. */
const PAGES: Partial<Record<ActiveTab, React.ComponentType<PageProps>>> = {
  home: PersonalizedDashboard,

  // Hubs
  'understand-message': DecodeHub,
  'read-situation': SituationHub,
  'help-reply': ReplyHub,
  'plan-date': PlanDateHub,
  practice: PracticeHub,
  insights: InsightsHub,
  couple: CoupleHub,
  'our-story-hub': OurStoryHub,

  // Talk
  chat: AIChatView,
  copilot: () => (<FeatureGate flag="relationship_copilot" featureName="Ask LoveMate"><RelationshipCopilotView /></FeatureGate>),
  'voice-chat': VoiceLoveMateView,

  // Create & plan
  confession: ConfessionStudioView,
  'love-cards': LoveCardsView,
  'trip-together': TripTogetherView,
  'important-dates': ImportantDatesView,
  'couple-calendar': () => (<FeatureGate flag="couple_calendar" featureName="Couple calendar"><CoupleCalendarView /></FeatureGate>),
  wishlist: () => (<FeatureGate flag="wishlist" featureName="Wishlist"><CoupleWishlistView /></FeatureGate>),

  // Practice & grow
  'wingman-mode': WingmanModeView,
  'memory-center': () => (<FeatureGate entitlement="memory_center" featureName="Memory center"><MemoryCenterView /></FeatureGate>),

  // Together
  'our-space': OurSpaceView,
  'couple-coach': CouplesCoachView,
  'long-distance': LongDistanceView,
  wrapped: WrappedView,

  // Jyotish (free with an account)
  kundli: KundliMilanView,
  'my-kundli': MyKundliView,
  rashifal: RashifalView,
  calculator: LoveCalculatorView,

  // Account, support, admin
  library: () => (<FeatureGate requireAuth featureName="Saved library"><SavedLibraryView /></FeatureGate>),
  profile: () => (<FeatureGate requireAuth featureName="Profile"><ProfileSettingsView /></FeatureGate>),
  'notification-settings': NotificationSettingsView,
  referrals: ReferralCenterView,
  support: CustomerSupportView,
  'trust-center': TrustSafetyCenterView,
  'admin-hub': () => (<FeatureGate adminOnly featureName="Admin console"><AdminDashboardView /></FeatureGate>),

  // Legal & business pages (public)
  terms: () => <LegalView page="terms" />,
  privacy: () => <LegalView page="privacy" />,
  refund: () => <LegalView page="refund" />,
  contact: () => <LegalView page="contact" />,
};

const LogoModalHost: React.FC = () => {
  const { logoModalOpen, setLogoModalOpen } = useApp();
  return <LogoShowcaseModal isOpen={logoModalOpen} onClose={() => setLogoModalOpen(false)} />;
};

/** Pages anyone can open. Every tool needs a free account (the landing page has a live demo to try first). */
const PUBLIC_PAGES = new Set<ActiveTab>(['home', 'pro', 'trust-center', 'terms', 'privacy', 'refund', 'contact']);

/** Names for the sign-in prompt, taken from the menu. */
const PAGE_NAMES: Partial<Record<ActiveTab, string>> = {
  ...Object.fromEntries(EXPLORE_GROUPS.flatMap((g) => g.items.map((i) => [i.tab, i.label]))),
  chat: 'AI chat',
  copilot: 'Ask LoveMate',
  'our-space': 'Our Space',
  'couple-calendar': 'Couple calendar',
  library: 'Saved library',
  profile: 'Profile',
  referrals: 'Invite friends',
  support: 'Support',
  'notification-settings': 'Notification settings',
  kundli: 'Kundli Milan',
  'my-kundli': 'My kundli',
  rashifal: 'Daily love rashifal',
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  refund: 'Refund & Cancellation Policy',
  contact: 'Contact us',
};

const Main: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
);

const MainContent: React.FC = () => {
  const { activeTab, user, hasPlan, setActiveTab, showToast, setProModalOpen } = useApp();
  const page = resolveTab(activeTab);

  // Links to retired pages still work: they land on home with a word of explanation.
  // "#/pro" is the pricing window, not a page: open it over the home page.
  useEffect(() => {
    if (RETIRED_TABS.has(activeTab)) {
      showToast('That page has been retired. Everything you need is on your home page.', 'info');
      setActiveTab('home');
    } else if (activeTab === 'pro') {
      setActiveTab('home');
      setProModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (!user && !PUBLIC_PAGES.has(page.tab)) {
    return (
      <Main>
        <FeatureGate requireAuth featureName={PAGE_NAMES[page.tab] ?? 'LoveMate'}>
          {null}
        </FeatureGate>
      </Main>
    );
  }

  const neededPlan = PAGE_PLAN[page.tab];
  if (user && neededPlan && !hasPlan(neededPlan)) {
    return (
      <Main>
        <FeatureGate plan={neededPlan} featureName={PAGE_NAMES[page.tab] ?? 'This tool'}>
          {null}
        </FeatureGate>
      </Main>
    );
  }

  const Page = PAGES[page.tab];
  return (
    <Main>
      <Suspense fallback={<PageSkeleton />}>{Page && <Page initialMode={page.mode} />}</Suspense>
    </Main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF9F8] text-zinc-900 font-sans selection:bg-rose-100 selection:text-rose-700">
        {/* Navigation */}
        <Navbar />
        <GenAIStatusBanner />

        {/* Dynamic Route Content */}
        <MainContent />

        {/* Global Footer */}
        <Footer />

        {/* Mobile Fixed Navigation */}
        <MobileNav />

        {/* Modals & Dialogs */}
        <AuthModal />
        <OnboardingModal />
        <SearchModal />
        <ProModal />
        <ShareModal />
        <NotificationsModal />
        <MagicButtonModal />
        <DesignSystemModal />
        <LogoModalHost />

        {/* Floating Toasts */}
        <ToastContainer />
      </div>
    </AppProvider>
  );
};

export default App;
