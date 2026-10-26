import React from 'react';
import { LoveCalculatorView } from './components/calculator/LoveCalculatorView';
import { LoveCardsView } from './components/cards/LoveCardsView';
import { RelationshipChallengesView } from './components/challenges/RelationshipChallengesView';
import { AIChatView } from './components/chat/AIChatView';
import { ChemistryModeView } from './components/chemistry/ChemistryModeView';
import { CommunicationCoachView } from './components/coach/CommunicationCoachView';
import { CouplesCoachView } from './components/coach/CouplesCoachView';
import { ToastContainer } from './components/common/ToastContainer';
import { ShouldIConfessView } from './components/confess/ShouldIConfessView';
import { ConfessionStudioView } from './components/confession/ConfessionStudioView';
import { ConversationCoachView } from './components/copilot/ConversationCoachView';
import { ReplyCopilotView } from './components/copilot/ReplyCopilotView';
import { CoupleModeView } from './components/couple/CoupleModeView';
import { CrushAnalyzerView } from './components/crush/CrushAnalyzerView';
import { RelationshipDashboardView } from './components/dashboard/RelationshipDashboardView';
import { DateGiftGeneratorView } from './components/dategift/DateGiftGeneratorView';
import { GiftIntelligenceView } from './components/dategift/GiftIntelligenceView';
import { DatePlannerView } from './components/dateplanner/DatePlannerView';
import { ImportantDatesView } from './components/dates/ImportantDatesView';
import { RelationshipDetectiveView } from './components/detective/RelationshipDetectiveView';
import { RelationshipDNAView } from './components/dna/RelationshipDNAView';
import { CoupleGamesView } from './components/games/CoupleGamesView';
import { InfiniteGamesView } from './components/games/InfiniteGamesView';
import { WrappedView } from './components/growth/WrappedView';
import { RelationshipCheckInView } from './components/health/RelationshipCheckInView';
import { PersonalizedDashboard } from './components/home/PersonalizedDashboard';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { EXPLORE_GROUPS, Navbar } from './components/layout/Navbar';
import { SavedLibraryView } from './components/library/SavedLibraryView';
import { MemoryCenterView } from './components/memory/MemoryCenterView';
import { AuthModal } from './components/modals/AuthModal';
import { MagicButtonModal } from './components/modals/MagicButtonModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { ProModal } from './components/modals/ProModal';
import { SearchModal } from './components/modals/SearchModal';
import { ShareModal } from './components/modals/ShareModal';
import { DesignSystemModal } from './components/common/DesignSystemModal';
import { LogoShowcaseModal } from './components/common/LogoShowcaseModal';
import { OurStoryMovieView } from './components/movie/OurStoryMovieView';
import { RelationshipPatternsView } from './components/patterns/RelationshipPatternsView';
import { RoleplayView } from './components/practice/RoleplayView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { RelationshipHelperView } from './components/relationship/RelationshipHelperView';
import { ReplyGeneratorView } from './components/reply/ReplyGeneratorView';
import { ScrapbookView } from './components/scrapbook/ScrapbookView';
import { LongDistanceView } from './components/space/LongDistanceView';
import { OurSpaceView } from './components/space/OurSpaceView';
import { AILoveStoryView } from './components/story/AILoveStoryView';
import { OurRealStoryView } from './components/story/OurRealStoryView';
import { TimelineView } from './components/timeline/TimelineView';
import { DecodeThisView } from './components/tools/DecodeThisView';
import { MessageTransformerView } from './components/tools/MessageTransformerView';
import { RelationshipSignalsView } from './components/tools/RelationshipSignalsView';
import { ScreenshotAnalyzerView } from './components/tools/ScreenshotAnalyzerView';
import { TripTogetherView } from './components/travel/TripTogetherView';
import { VoiceLoveMateView } from './components/voice/VoiceLoveMateView';
import { WhatIfSimulatorView } from './components/whatif/WhatIfSimulatorView';
import { WingmanModeView } from './components/wingman/WingmanModeView';
// V4 Imports
import { RelationshipCopilotView } from './components/copilot/RelationshipCopilotView';
import { AgentActivityCenterView } from './components/agent/AgentActivityCenterView';
import { RelationshipAutopilotView } from './components/autopilot/RelationshipAutopilotView';
import { CoupleCalendarView } from './components/calendar/CoupleCalendarView';
import { CoupleWishlistView } from './components/wishlist/CoupleWishlistView';
import { ExperienceMarketplaceView } from './components/marketplace/ExperienceMarketplaceView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
// V5 Imports
import { TrustSafetyCenterView } from './components/trust/TrustSafetyCenterView';
import { ReferralCenterView } from './components/growth/ReferralCenterView';
import { CustomerSupportView } from './components/support/CustomerSupportView';
import { AppProvider, useApp } from './context/AppContext';
import type { ActiveTab } from './types';
import { FeatureGate } from './components/common/FeatureGate';
import { GenAIStatusBanner } from './components/common/GenAIStatusBanner';

const LogoModalHost: React.FC = () => {
  const { logoModalOpen, setLogoModalOpen } = useApp();
  return <LogoShowcaseModal isOpen={logoModalOpen} onClose={() => setLogoModalOpen(false)} />;
};

/** Pages anyone can open. Every tool needs a free account (the landing page has a live demo to try first). */
const PUBLIC_PAGES = new Set<ActiveTab>(['home', 'pro', 'trust-center', 'support']);

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
};

const MainContent: React.FC = () => {
  const { activeTab, user } = useApp();

  if (!user && !PUBLIC_PAGES.has(activeTab)) {
    return (
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FeatureGate requireAuth featureName={PAGE_NAMES[activeTab] ?? 'LoveMate'}>
          {null}
        </FeatureGate>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Home & Dashboard */}
      {activeTab === 'home' && <PersonalizedDashboard />}

      {/* Talk Pillar */}
      {activeTab === 'chat' && <AIChatView />}
      {activeTab === 'voice-chat' && <VoiceLoveMateView />}
      {activeTab === 'roleplay' && <RoleplayView />}
      {activeTab === 'wingman-mode' && <WingmanModeView />}
      {activeTab === 'conversation-coach' && <ConversationCoachView />}
      {activeTab === 'reply-copilot' && <ReplyCopilotView />}
      {activeTab === 'communication-coach' && <CommunicationCoachView />}

      {/* Understand Pillar */}
      {activeTab === 'decode' && <DecodeThisView />}
      {activeTab === 'screenshot' && <ScreenshotAnalyzerView />}
      {activeTab === 'what-if' && <WhatIfSimulatorView />}
      {activeTab === 'relationship-signals' && <RelationshipSignalsView />}
      {activeTab === 'calculator' && <LoveCalculatorView />}
      {activeTab === 'crush-analyzer' && <CrushAnalyzerView />}
      {activeTab === 'should-confess' && <ShouldIConfessView />}
      {activeTab === 'health-check' && <RelationshipCheckInView />}
      {activeTab === 'relationship-helper' && <RelationshipHelperView />}
      {activeTab === 'relationship-dna' && <RelationshipDNAView />}
      {activeTab === 'detective' && <RelationshipDetectiveView />}
      {activeTab === 'relationship-patterns' && <RelationshipPatternsView />}
      {activeTab === 'memory-center' && (<FeatureGate entitlement="memory_center" featureName="Memory center"><MemoryCenterView /></FeatureGate>)}
      {activeTab === 'relationship-dashboard' && <RelationshipDashboardView />}

      {/* Create Pillar */}
      {activeTab === 'confession' && <ConfessionStudioView />}
      {activeTab === 'reply' && <ReplyGeneratorView />}
      {activeTab === 'message-transformer' && <MessageTransformerView />}
      {activeTab === 'love-cards' && <LoveCardsView />}
      {activeTab === 'date-planner' && <DatePlannerView />}
      {activeTab === 'date-gift' && <DateGiftGeneratorView />}
      {activeTab === 'gift-intelligence' && (<FeatureGate flag="gift_intelligence_v2" featureName="Gift ideas"><GiftIntelligenceView /></FeatureGate>)}
      {activeTab === 'our-story' && <OurRealStoryView />}
      {activeTab === 'stories' && <AILoveStoryView />}
      {activeTab === 'scrapbook' && <ScrapbookView />}
      {activeTab === 'our-story-movie' && <OurStoryMovieView />}

      {/* Play Pillar */}
      {activeTab === 'games' && <CoupleGamesView />}
      {activeTab === 'infinite-games' && <InfiniteGamesView />}
      {activeTab === 'chemistry-mode' && <ChemistryModeView />}
      {activeTab === 'challenges' && <RelationshipChallengesView />}

      {/* Connect & Remember Pillars */}
      {activeTab === 'couple-mode' && <CoupleModeView />}
      {activeTab === 'our-space' && <OurSpaceView />}
      {activeTab === 'couple-coach' && <CouplesCoachView />}
      {activeTab === 'long-distance' && <LongDistanceView />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'important-dates' && <ImportantDatesView />}
      {activeTab === 'trip-together' && <TripTogetherView />}
      {activeTab === 'wrapped' && <WrappedView />}

      {/* V4 Autonomous Agent, Copilot & Ecosystem */}
      {activeTab === 'copilot' && (<FeatureGate flag="relationship_copilot" featureName="Ask LoveMate"><RelationshipCopilotView /></FeatureGate>)}
      {activeTab === 'agent-activity' && (<FeatureGate entitlement="agent_autonomous" flag="love_agent" featureName="Agent activity"><AgentActivityCenterView /></FeatureGate>)}
      {activeTab === 'autopilot' && (<FeatureGate entitlement="autopilot" flag="relationship_autopilot" featureName="Autopilot"><RelationshipAutopilotView /></FeatureGate>)}
      {activeTab === 'couple-calendar' && (<FeatureGate flag="couple_calendar" featureName="Couple calendar"><CoupleCalendarView /></FeatureGate>)}
      {activeTab === 'wishlist' && (<FeatureGate flag="wishlist" featureName="Wishlist"><CoupleWishlistView /></FeatureGate>)}
      {activeTab === 'marketplace' && (<FeatureGate entitlement="experience_marketplace" flag="experience_marketplace" featureName="Experiences"><ExperienceMarketplaceView /></FeatureGate>)}
      {activeTab === 'admin-hub' && (<FeatureGate adminOnly featureName="Admin console"><AdminDashboardView /></FeatureGate>)}

      {/* V5 Systems: Trust, Growth, Support */}
      {activeTab === 'trust-center' && <TrustSafetyCenterView />}
      {activeTab === 'referrals' && <ReferralCenterView />}
      {activeTab === 'support' && <CustomerSupportView />}

      {/* Vault & Account */}
      {activeTab === 'library' && (<FeatureGate requireAuth featureName="Saved library"><SavedLibraryView /></FeatureGate>)}
      {activeTab === 'profile' && (<FeatureGate requireAuth featureName="Profile"><ProfileSettingsView /></FeatureGate>)}
    </main>
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

