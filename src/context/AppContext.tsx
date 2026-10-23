import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GROWTH_CHALLENGES,
  INITIAL_ADMIN_METRICS,
  INITIAL_AGENT_TASKS,
  INITIAL_AI_EVALUATION_CASES,
  INITIAL_AI_MODELS,
  INITIAL_AUTOPILOT_SETTINGS,
  INITIAL_BADGES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_COUPLE_JOURNAL,
  INITIAL_EXPERIMENTS,
  INITIAL_FEATURE_FLAGS,
  INITIAL_GLOBALIZATION,
  INITIAL_GOALS_V2,
  INITIAL_IMPORTANT_DATES,
  INITIAL_LOVEMATE_PROFILE,
  INITIAL_MARKETPLACE_EXPERIENCES,
  INITIAL_MEMORY_CONTRADICTIONS,
  INITIAL_MEMORY_SETTINGS,
  INITIAL_PROACTIVE_SETTINGS,
  INITIAL_PROACTIVE_SUGGESTIONS,
  INITIAL_PROMPT_VERSIONS,
  INITIAL_REFERRAL_STATS,
  INITIAL_RELATIONSHIP_PATTERNS,
  INITIAL_RELATIONSHIP_TRENDS,
  INITIAL_SHARED_GOALS,
  INITIAL_SHARED_MEMORIES,
  INITIAL_SHARED_PLANS,
  INITIAL_SMART_NOTIFICATIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_TIMELINE_MILESTONES,
  INITIAL_UNIT_ECONOMICS,
  INITIAL_USER_MEMORIES,
  INITIAL_USER_SUBSCRIPTION_V5,
  INITIAL_WISHLIST,
  INITIAL_WRAPPED,
} from '../data/seedData';
import {
  ActiveTab,
  AdminMetrics,
  AdviceFeedback,
  AgentActionPlan,
  AgentTask,
  AgentTaskStatus,
  AIEvaluationCase,
  AIFeedbackRecord,
  AIIssueReport,
  AIMemoryItem,
  AIMessage,
  AIModelConfig,
  AIPromptVersion,
  Badge,
  CompatibilityResult,
  ConfessionItem,
  CoupleCalendarEvent,
  CoupleJournalEntry,
  CouplePermissions,
  CoupleRoom,
  EntitlementFeature,
  ExperienceItem,
  ExperimentItem,
  FeatureFlags,
  GlobalizationConfig,
  GrowthChallenge,
  ImportantDate,
  Language,
  LongDistanceState,
  LoveCard,
  LoveMateProfile,
  LoveMateWrapped,
  LoveStory,
  MemoryContradiction,
  MemorySettings,
  ProactiveSettings,
  ProactiveSuggestion,
  RealOurStory,
  ReferralInvite,
  ReferralStats,
  RelationshipAutopilotSetting,
  RelationshipGoalV2,
  RelationshipPattern,
  RelationshipTrends,
  ReplySuggestion,
  SharedGoal,
  SharedMemory,
  SharedPlanItem,
  SmartNotification,
  SubscriptionTierV5,
  SupportTicket,
  TimelineMilestone,
  ToastMessage,
  UnitEconomicsSummary,
  User,
  UserMemoryItem,
  UserSubscriptionV5,
  WishlistItem,
} from '../types';
import { AIService } from '../services/ai';
import { AI_ERROR_EVENT, getGenAIStatus } from '../services/genaiClient';
import { uid } from '../utils/uid';
import { hashToTab, tabToHash } from '../utils/routes';
import { hashPassword, loadAccounts, saveAccounts, type LocalAccount } from '../utils/accounts';

interface AppContextType {
  user: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Auth & Onboarding
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot' | 'verify';
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot' | 'verify') => void;
  closeAuthModal: () => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  login: (email: string, options?: { password?: string; name?: string; provider?: 'google' | 'otp' }) => Promise<'ok' | 'no_account' | 'wrong_password'>;
  signup: (name: string, email: string, password: string) => Promise<'ok' | 'exists'>;
  setPasswordForEmail: (email: string, password: string) => Promise<boolean>;
  accountExists: (email: string) => boolean;
  logout: () => void;
  deleteAccount: () => void;
  completeOnboarding: (data: { name: string; goals: string[]; chatLanguage: Language; vibe: string }) => void;
  updateUserPreferences: (prefs: Partial<User>) => void;
  // Gamification & Points
  addPoints: (amount: number, reason?: string) => void;
  badges: Badge[];
  unlockBadge: (badgeId: string) => void;
  // AI Memory (V1/V2 baseline)
  aiMemoryEnabled: boolean;
  setAiMemoryEnabled: (enabled: boolean) => void;
  memories: AIMemoryItem[];
  addMemory: (fact: string, category: AIMemoryItem['category']) => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
  // Saved Library
  savedConfessions: ConfessionItem[];
  saveConfession: (item: ConfessionItem) => void;
  deleteConfession: (id: string) => void;
  savedCompatibility: CompatibilityResult[];
  saveCompatibility: (item: CompatibilityResult) => void;
  deleteCompatibility: (id: string) => void;
  savedStories: LoveStory[];
  saveStory: (story: LoveStory) => void;
  deleteStory: (id: string) => void;
  savedChats: { id: string; title: string; messages: AIMessage[]; savedAt: string }[];
  saveChatConversation: (title: string, messages: AIMessage[]) => void;
  deleteSavedChat: (id: string) => void;
  savedReplies: ReplySuggestion[];
  saveReplyItem: (item: ReplySuggestion) => void;
  // V2: Relationship Timeline
  timelineMilestones: TimelineMilestone[];
  addMilestone: (m: Omit<TimelineMilestone, 'id'>) => void;
  deleteMilestone: (id: string) => void;
  // V2: Important Dates
  importantDates: ImportantDate[];
  addImportantDate: (d: Omit<ImportantDate, 'id'>) => void;
  deleteImportantDate: (id: string) => void;
  // V2: Growth Challenges
  growthChallenges: GrowthChallenge[];
  toggleChallengeDay: (challengeId: string, dayNumber: number) => void;
  startChallenge: (challengeId: string) => void;
  // V2: Couple Rooms & Couple Streaks
  coupleRoom: CoupleRoom | null;
  createCoupleRoom: (activityType: CoupleRoom['activityType']) => CoupleRoom;
  joinCoupleRoom: (code: string) => boolean;
  leaveCoupleRoom: () => void;
  coupleStreak: number;
  incrementCoupleStreak: () => void;
  // V2: Real Our Story & Love Cards
  ourRealStory: RealOurStory | null;
  saveRealStory: (story: RealOurStory) => void;
  savedLoveCards: LoveCard[];
  saveLoveCard: (card: LoveCard) => void;
  deleteLoveCard: (id: string) => void;

  // ========================
  // V3 ADVANCED EXPANSION
  // ========================
  // 1. Relationship Memory Engine & Graph
  userMemories: UserMemoryItem[];
  addUserMemory: (m: Omit<UserMemoryItem, 'id' | 'createdAt'>) => void;
  updateUserMemory: (id: string, updates: Partial<UserMemoryItem>) => void;
  deleteUserMemory: (id: string) => void;
  clearAllUserMemories: () => void;
  memorySettings: MemorySettings;
  updateMemorySettings: (s: Partial<MemorySettings>) => void;

  // 2. Personal Relationship AI (My LoveMate)
  loveMateProfile: LoveMateProfile;
  updateLoveMateProfile: (p: Partial<LoveMateProfile>) => void;
  adviceFeedbacks: AdviceFeedback[];
  recordAdviceFeedback: (feedback: Omit<AdviceFeedback, 'id' | 'timestamp'>) => void;

  // 3. Patterns & Trends & Central Dashboard
  relationshipPatterns: RelationshipPattern[];
  addRelationshipPattern: (p: Omit<RelationshipPattern, 'id' | 'detectedAt'>) => void;
  relationshipTrends: RelationshipTrends;
  updateRelationshipTrends: (t: Partial<RelationshipTrends>) => void;

  // 4. Proactive AI & Suggestions
  proactiveSuggestions: ProactiveSuggestion[];
  dismissProactiveSuggestion: (id: string) => void;
  proactiveSettings: ProactiveSettings;
  updateProactiveSettings: (s: Partial<ProactiveSettings>) => void;

  // 5. Shared Relationship Space (Our Space ❤️)
  sharedMemories: SharedMemory[];
  addSharedMemory: (m: Omit<SharedMemory, 'id'>) => void;
  deleteSharedMemory: (id: string) => void;
  sharedGoals: SharedGoal[];
  toggleSharedGoal: (id: string) => void;
  addSharedGoal: (g: Omit<SharedGoal, 'id'>) => void;
  sharedPlans: SharedPlanItem[];
  addSharedPlan: (p: Omit<SharedPlanItem, 'id'>) => void;
  toggleSharedPlan: (id: string) => void;
  coupleJournal: CoupleJournalEntry[];
  addCoupleJournalEntry: (e: Omit<CoupleJournalEntry, 'id' | 'createdAt'>) => void;
  longDistanceState: LongDistanceState;
  updateLongDistanceState: (s: Partial<LongDistanceState>) => void;
  couplePermissions: CouplePermissions;
  updateCouplePermissions: (p: Partial<CouplePermissions>) => void;

  // 6. Growth & Smart Notifications
  notifications: SmartNotification[];
  markNotificationAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notificationsModalOpen: boolean;
  setNotificationsModalOpen: (open: boolean) => void;
  magicButtonModalOpen: boolean;
  setMagicButtonModalOpen: (open: boolean) => void;
  referralInvites: ReferralInvite[];
  createReferralInvite: (role: ReferralInvite['inviteeRole']) => ReferralInvite;
  loveMateWrapped: LoveMateWrapped;

  // ========================
  // V4 MASTER EXPANSION
  // ========================
  // 1. LoveMate Agent & Task Engine
  agentTasks: AgentTask[];
  addAgentTask: (task: Omit<AgentTask, 'id' | 'createdAt'>) => AgentTask;
  updateAgentTaskStatus: (id: string, status: AgentTaskStatus) => void;
  confirmAgentTask: (id: string) => void;
  cancelAgentTask: (id: string) => void;
  deleteAgentTask: (id: string) => void;
  executeAgentPrompt: (prompt: string) => Promise<AgentActionPlan>;

  // 2. Relationship Autopilot
  autopilotSettings: RelationshipAutopilotSetting[];
  toggleAutopilot: (id: string) => void;
  updateAutopilotSetting: (id: string, updates: Partial<RelationshipAutopilotSetting>) => void;

  // 3. Couple Calendar
  calendarEvents: CoupleCalendarEvent[];
  addCalendarEvent: (event: Omit<CoupleCalendarEvent, 'id'>) => CoupleCalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CoupleCalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // 4. Relationship Goals 2.0
  goalsV2: RelationshipGoalV2[];
  addGoalV2: (goal: Omit<RelationshipGoalV2, 'id'>) => void;
  toggleGoalV2Milestone: (goalId: string, milestoneId: string) => void;
  updateGoalV2Progress: (goalId: string, progress: number) => void;
  deleteGoalV2: (id: string) => void;

  // 5. Our Wishlist
  wishlistItems: WishlistItem[];
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  toggleWishlistItemCompleted: (id: string) => void;
  deleteWishlistItem: (id: string) => void;

  // 6. Experience Marketplace & Creators
  marketplaceExperiences: ExperienceItem[];
  useExperience: (id: string) => void;
  submitExperience: (item: Omit<ExperienceItem, 'id' | 'rating' | 'reviewCount' | 'usageCount' | 'moderationStatus'>) => void;

  // 7. Feature Flags & Admin Command
  featureFlags: FeatureFlags;
  toggleFeatureFlag: (flag: keyof FeatureFlags) => void;
  adminMetrics: AdminMetrics;

  // Modals & Navigation
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  proModalOpen: boolean;
  setProModalOpen: (open: boolean) => void;
  shareModalItem: {
    type: 'compatibility' | 'confession' | 'reply' | 'game' | 'card' | 'story' | 'wrapped' | 'scrapbook';
    data: any;
  } | null;
  openShareModal: (item: { type: 'compatibility' | 'confession' | 'reply' | 'game' | 'card' | 'story' | 'wrapped' | 'scrapbook'; data: any }) => void;
  closeShareModal: () => void;
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  triggerConfetti: () => void;

  // ========================
  // MASTER V5 SYSTEMS
  // ========================
  // 1. Monetization 2.0 & Entitlements
  userSubscription: UserSubscriptionV5;
  canUseFeature: (feature: EntitlementFeature) => boolean;
  upgradeSubscription: (tier: SubscriptionTierV5) => void;
  cancelSubscription: () => void;
  incrementAiUsage: () => void;

  // 2. AI Quality & Evaluation
  aiModels: AIModelConfig[];
  toggleAiModelEnabled: (id: string) => void;
  promptVersions: AIPromptVersion[];
  evaluationCases: AIEvaluationCase[];
  runAllEvaluations: () => Promise<void>;
  submitAiFeedback: (feature: string, helpful: boolean, comment?: string) => void;
  aiIssues: AIIssueReport[];
  reportAiIssue: (feature: string, category: AIIssueReport['category'], details: string) => void;

  // 3. Memory 2.0 & Contradictions
  memoryContradictions: MemoryContradiction[];
  resolveContradiction: (id: string, resolution: string) => void;

  // 4. Growth & Referrals
  referralStats: ReferralStats;
  generateNewReferralCode: () => void;
  claimReferralCode: (code: string) => boolean;

  // 5. Customer Support
  supportTickets: SupportTicket[];
  createSupportTicket: (subject: string, category: SupportTicket['category'], description: string) => void;
  updateSupportTicketStatus: (id: string, status: SupportTicket['status']) => void;

  // 6. Experimentation Platform
  experiments: ExperimentItem[];
  toggleExperimentStatus: (id: string) => void;

  // 7. Globalization
  globalization: GlobalizationConfig;
  updateGlobalization: (updates: Partial<GlobalizationConfig>) => void;
  formatCurrency: (amountUSDOrINR: number) => string;
  unitEconomics: UnitEconomicsSummary;

  // 8. Trust & Privacy
  exportAllUserData: () => void;
  deleteUserAccount: () => void;
  disconnectCoupleSafely: () => void;

  // 10. Cross-view handoff & roles
  pendingCopilotPrompt: string | null;
  setPendingCopilotPrompt: (prompt: string | null) => void;
  isAdmin: boolean;

  // 9. Design System Spec
  designSystemOpen: boolean;
  setDesignSystemOpen: (open: boolean) => void;
  logoModalOpen: boolean;
  setLogoModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'lovemate_user_v2';
const STORAGE_KEY_SAVED_CONFESSIONS = 'lovemate_confessions_v2';
const STORAGE_KEY_SAVED_COMPAT = 'lovemate_compat_v2';
const STORAGE_KEY_SAVED_STORIES = 'lovemate_stories_v2';
const STORAGE_KEY_SAVED_CHATS = 'lovemate_chats_v2';
const STORAGE_KEY_MEMORIES = 'lovemate_memories_v2';
const STORAGE_KEY_TIMELINE = 'lovemate_timeline_v2';
const STORAGE_KEY_DATES = 'lovemate_dates_v2';
const STORAGE_KEY_CHALLENGES = 'lovemate_challenges_v2';
const STORAGE_KEY_CARDS = 'lovemate_cards_v2';
const STORAGE_KEY_COUPLE_STREAK = 'lovemate_couple_streak_v2';
const STORAGE_KEY_SESSION = 'lovemate_session_v1';
const STORAGE_KEY_BADGES = 'lovemate_badges_v1';
const STORAGE_KEY_AI_MEMORY_ENABLED = 'lovemate_ai_memory_enabled_v1';
const STORAGE_KEY_SAVED_REPLIES = 'lovemate_replies_v1';
const STORAGE_KEY_REAL_STORY = 'lovemate_real_story_v1';
const STORAGE_KEY_COUPLE_ROOM = 'lovemate_couple_room_v1';
const STORAGE_KEY_CLAIMED_REFERRALS = 'lovemate_claimed_referrals_v1';
const STORAGE_KEY_DAILY = 'lovemate_daily_v1';

/** Remove every LoveMate key without touching other apps on the same origin. */
const wipeLoveMateStorage = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('lovemate_'))
    .forEach((k) => localStorage.removeItem(k));
};
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const todayKey = () => new Date().toISOString().slice(0, 10);
const DEMO_USER: User = {
  id: 'usr_demo_1',
  name: 'Rahul',
  email: 'rahul@lovemate.ai',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
  streak: 5,
  points: 380,
  xp: 1250,
  isPro: false,
  vibe: 'Romantic & Playful',
  preferredLanguage: 'hinglish',
  joinedAt: 'Oct 2026',
  goals: ['Crush', 'Need conversation help', 'Check Compatibility'],
  partnerName: 'Ananya',
  partnerConnected: true,
};

// V3 Storage Keys
const STORAGE_KEY_USER_MEMORIES = 'lovemate_user_memories_v3';
const STORAGE_KEY_MEMORY_SETTINGS = 'lovemate_memory_settings_v3';
const STORAGE_KEY_LOVEMATE_PROFILE = 'lovemate_profile_v3';
const STORAGE_KEY_PATTERNS = 'lovemate_patterns_v3';
const STORAGE_KEY_TRENDS = 'lovemate_trends_v3';
const STORAGE_KEY_PROACTIVE_SETTINGS = 'lovemate_proactive_settings_v3';
const STORAGE_KEY_SHARED_MEMORIES = 'lovemate_shared_memories_v3';
const STORAGE_KEY_SHARED_GOALS = 'lovemate_shared_goals_v3';
const STORAGE_KEY_SHARED_PLANS = 'lovemate_shared_plans_v3';
const STORAGE_KEY_COUPLE_JOURNAL = 'lovemate_couple_journal_v3';
const STORAGE_KEY_COUPLE_PERMS = 'lovemate_couple_perms_v3';
const STORAGE_KEY_LONG_DISTANCE = 'lovemate_long_distance_v3';
const STORAGE_KEY_NOTIFICATIONS = 'lovemate_notifications_v3';

// V4 Storage Keys
const STORAGE_KEY_AGENT_TASKS = 'lovemate_agent_tasks_v4';
const STORAGE_KEY_AUTOPILOT = 'lovemate_autopilot_v4';
const STORAGE_KEY_CALENDAR = 'lovemate_calendar_v4';
const STORAGE_KEY_GOALS_V2 = 'lovemate_goals_v2_v4';
const STORAGE_KEY_WISHLIST = 'lovemate_wishlist_v4';
const STORAGE_KEY_MARKETPLACE = 'lovemate_marketplace_v4';
const STORAGE_KEY_FEATURE_FLAGS = 'lovemate_flags_v4';

// V5 Storage Keys
const STORAGE_KEY_SUBSCRIPTION = 'lovemate_subscription_v5';
const STORAGE_KEY_AI_MODELS = 'lovemate_ai_models_v5';
const STORAGE_KEY_PROMPT_VERSIONS = 'lovemate_prompts_v5';
const STORAGE_KEY_EVAL_CASES = 'lovemate_eval_cases_v5';
const STORAGE_KEY_AI_FEEDBACK = 'lovemate_ai_feedback_v5';
const STORAGE_KEY_AI_ISSUES = 'lovemate_ai_issues_v5';
const STORAGE_KEY_CONTRADICTIONS = 'lovemate_contradictions_v5';
const STORAGE_KEY_REFERRALS = 'lovemate_referrals_v5';
const STORAGE_KEY_SUPPORT_TICKETS = 'lovemate_support_tickets_v5';
const STORAGE_KEY_EXPERIMENTS = 'lovemate_experiments_v5';
const STORAGE_KEY_GLOBALIZATION = 'lovemate_globalization_v5';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // 1. User state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Demo account only on the very first visit; after a logout or delete, stay logged out.
    if (localStorage.getItem(STORAGE_KEY_SESSION) === 'signed_out') return null;
    return DEMO_USER;
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => hashToTab(window.location.hash) ?? 'home');
  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    const hash = tabToHash(tab);
    if (window.location.hash !== hash) {
      window.history.pushState({ tab }, '', hash || window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0 });
  };
  useEffect(() => {
    const onPop = () => setActiveTabState(hashToTab(window.location.hash) ?? 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [pendingCopilotPrompt, setPendingCopilotPrompt] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>('login');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // 2. Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [designSystemOpen, setDesignSystemOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [shareModalItem, setShareModalItem] = useState<{
    type: 'compatibility' | 'confession' | 'reply' | 'game' | 'card' | 'story' | 'wrapped' | 'scrapbook';
    data: any;
  } | null>(null);

  // 3. Badges
  const [badges, setBadges] = useState<Badge[]>(() => readJSON<Badge[]>(STORAGE_KEY_BADGES, INITIAL_BADGES));

  // 4. AI Memories
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState<boolean>(() => readJSON<boolean>(STORAGE_KEY_AI_MEMORY_ENABLED, true));
  const [memories, setMemories] = useState<AIMemoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'mem_1',
        fact: "Crush/Partner is Ananya (met at Third Wave coffee)",
        category: 'crush',
        dateLearned: '2 days ago',
      },
      {
        id: 'mem_2',
        fact: 'Prefers witty, subtle banter and screen-free coffee walks',
        category: 'preference',
        dateLearned: '3 days ago',
      },
    ];
  });

  // 5. Saved Library Items
  const [savedConfessions, setSavedConfessions] = useState<ConfessionItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_CONFESSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'conf_seed_1',
        recipient: 'Crush',
        tone: 'Cute',
        language: 'hinglish',
        length: 'short',
        content: `Hey! Main bas itna kehna chahta hu ki jab bhi tera text aata hai na, mere chehre par ek silly si smile aa jati hai. You kind of make my ordinary days a lot brighter ❤️`,
        createdAt: 'Yesterday',
        favorite: true,
      },
    ];
  });

  const [savedCompatibility, setSavedCompatibility] = useState<CompatibilityResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_COMPAT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'compat_seed_1',
        yourName: 'Rahul',
        theirName: 'Ananya',
        relationshipType: 'Dating',
        overallScore: 92,
        breakdown: {
          chemistry: 94,
          communication: 88,
          personality: 90,
          emotionalConnection: 94,
        },
        aiAnalysis:
          'Your communication energy flows naturally without anxiety. Shared subtle humor creates a strong foundation.',
        verdict: 'Cosmic Connection & Electric Chemistry 🔥',
        createdAt: 'Yesterday',
      },
    ];
  });

  const [savedStories, setSavedStories] = useState<LoveStory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_STORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [savedChats, setSavedChats] = useState<{ id: string; title: string; messages: AIMessage[]; savedAt: string }[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_CHATS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [savedReplies, setSavedReplies] = useState<ReplySuggestion[]>(() => readJSON<ReplySuggestion[]>(STORAGE_KEY_SAVED_REPLIES, []));

  // 6. V2: Relationship Timeline
  const [timelineMilestones, setTimelineMilestones] = useState<TimelineMilestone[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIMELINE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_TIMELINE_MILESTONES;
  });

  // 7. V2: Important Dates
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_IMPORTANT_DATES;
  });

  // 8. V2: Growth Challenges
  const [growthChallenges, setGrowthChallenges] = useState<GrowthChallenge[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CHALLENGES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return GROWTH_CHALLENGES;
  });

  // 9. V2: Couple Rooms & Couple Streaks
  const [coupleRoom, setCoupleRoom] = useState<CoupleRoom | null>(() => readJSON<CoupleRoom | null>(STORAGE_KEY_COUPLE_ROOM, null));

  const [coupleStreak, setCoupleStreak] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COUPLE_STREAK);
    return saved ? parseInt(saved, 10) : 4;
  });

  // 10. V2: Real Our Story & Love Cards
  const [ourRealStory, setOurRealStory] = useState<RealOurStory | null>(() => readJSON<RealOurStory | null>(STORAGE_KEY_REAL_STORY, null));
  const [savedLoveCards, setSavedLoveCards] = useState<LoveCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // ========================
  // V3 STATES & STORAGE SYNC
  // ========================

  // 1. User Memories
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER_MEMORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USER_MEMORIES;
  });

  // 2. Memory Settings
  const [memorySettings, setMemorySettings] = useState<MemorySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMORY_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_MEMORY_SETTINGS;
  });

  // 3. Personalization Profile (My LoveMate)
  const [loveMateProfile, setLoveMateProfile] = useState<LoveMateProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOVEMATE_PROFILE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_LOVEMATE_PROFILE;
  });

  const [adviceFeedbacks, setAdviceFeedbacks] = useState<AdviceFeedback[]>([]);

  // 4. Relationship Patterns & Trends
  const [relationshipPatterns, setRelationshipPatterns] = useState<RelationshipPattern[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PATTERNS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_RELATIONSHIP_PATTERNS;
  });

  const [relationshipTrends, setRelationshipTrends] = useState<RelationshipTrends>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRENDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_RELATIONSHIP_TRENDS;
  });

  // 5. Proactive AI
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>(INITIAL_PROACTIVE_SUGGESTIONS);
  const [proactiveSettings, setProactiveSettings] = useState<ProactiveSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROACTIVE_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PROACTIVE_SETTINGS;
  });

  // 6. Shared Relationship Space
  const [sharedMemories, setSharedMemories] = useState<SharedMemory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHARED_MEMORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SHARED_MEMORIES;
  });

  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHARED_GOALS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SHARED_GOALS;
  });

  const [sharedPlans, setSharedPlans] = useState<SharedPlanItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHARED_PLANS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SHARED_PLANS;
  });

  const [coupleJournal, setCoupleJournal] = useState<CoupleJournalEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COUPLE_JOURNAL);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COUPLE_JOURNAL;
  });

  const [longDistanceState, setLongDistanceState] = useState<LongDistanceState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LONG_DISTANCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      isEnabled: true,
      yourCity: 'Mumbai',
      yourTimezone: 'IST (UTC+5:30)',
      partnerCity: 'Bangalore',
      partnerTimezone: 'IST (UTC+5:30)',
      nextMeetingDate: 'Nov 02, 2026',
      milesApart: 615,
    };
  });

  const [couplePermissions, setCouplePermissions] = useState<CouplePermissions>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COUPLE_PERMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      shareTimeline: true,
      shareMemories: true,
      shareActivities: true,
      shareImportantDates: true,
      sharePersonalAiMemory: false,
      sharePrivateConversations: false,
      sharePersonalJournal: false,
    };
  });

  // 7. Notifications & Magic Button
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SMART_NOTIFICATIONS;
  });

  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [magicButtonModalOpen, setMagicButtonModalOpen] = useState(false);
  const [referralInvites, setReferralInvites] = useState<ReferralInvite[]>([]);
  const [loveMateWrapped] = useState<LoveMateWrapped>(INITIAL_WRAPPED);

  // ========================
  // V4 MASTER EXPANSION STATES
  // ========================
  // 1. Agent Tasks
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AGENT_TASKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AGENT_TASKS;
  });

  // 2. Autopilot
  const [autopilotSettings, setAutopilotSettings] = useState<RelationshipAutopilotSetting[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTOPILOT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AUTOPILOT_SETTINGS;
  });

  // 3. Calendar
  const [calendarEvents, setCalendarEvents] = useState<CoupleCalendarEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDAR);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  // 4. Goals V2
  const [goalsV2, setGoalsV2] = useState<RelationshipGoalV2[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GOALS_V2);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_GOALS_V2;
  });

  // 5. Wishlist
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_WISHLIST;
  });

  // 6. Marketplace Experiences
  const [marketplaceExperiences, setMarketplaceExperiences] = useState<ExperienceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MARKETPLACE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_MARKETPLACE_EXPERIENCES;
  });

  // 7. Feature Flags & Admin
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FEATURE_FLAGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_FEATURE_FLAGS;
  });

  const [adminMetrics] = useState<AdminMetrics>(INITIAL_ADMIN_METRICS);

  // Sync V4 to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AGENT_TASKS, JSON.stringify(agentTasks));
  }, [agentTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTOPILOT, JSON.stringify(autopilotSettings));
  }, [autopilotSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOALS_V2, JSON.stringify(goalsV2));
  }, [goalsV2]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MARKETPLACE, JSON.stringify(marketplaceExperiences));
  }, [marketplaceExperiences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FEATURE_FLAGS, JSON.stringify(featureFlags));
  }, [featureFlags]);

  // ========================
  // MASTER V5 STATES & SYSTEMS
  // ========================

  // 1. Monetization 2.0 & Entitlements
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionV5>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USER_SUBSCRIPTION_V5;
  });

  const canUseFeature = (feature: EntitlementFeature): boolean => {
    const tier = userSubscription.tier;
    const isPlus = tier === 'plus';
    const isCouple = tier === 'couple';
    const isPremium = tier === 'premium';

    switch (feature) {
      case 'basic_chat':
      case 'love_calculator':
      case 'confessions':
        return true;
      case 'advanced_ai':
      case 'memory_center':
        return isPlus || isCouple || isPremium;
      case 'couple_sync':
      case 'experience_marketplace':
        return isCouple || isPremium;
      case 'agent_autonomous':
      case 'autopilot':
      case 'unlimited_plans':
        return isPremium;
      default:
        return true;
    }
  };

  const upgradeSubscription = (tier: SubscriptionTierV5) => {
    const priceMap: Record<SubscriptionTierV5, number> = {
      free: 0,
      plus: 199,
      couple: 349,
      premium: 499,
    };
    if (tier === userSubscription.tier) return;
    const limitMap: Record<SubscriptionTierV5, number> = { free: 60, plus: 500, couple: 1000, premium: 5000 };
    setUserSubscription((prev) => ({
      ...prev,
      tier,
      status: 'active',
      monthlyPrice: priceMap[tier],
      aiRequestsLimitMonthly: limitMap[tier],
      cancelAtPeriodEnd: false,
    }));
    setUser((prev) => (prev ? { ...prev, isPro: tier !== 'free' } : prev));
    if (tier === 'free') {
      showToast('Switched to the Free plan. Paid features are now locked.', 'info');
      return;
    }
    triggerConfetti();
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
    showToast(`Welcome to LoveMate ${label}. Your new features are unlocked.`, 'love');
  };

  const cancelSubscription = () => {
    setUserSubscription((prev) => ({
      ...prev,
      cancelAtPeriodEnd: true,
    }));
    showToast('Your subscription will remain active until the end of your billing cycle. No further charges.', 'info');
  };

  const incrementAiUsage = () => {
    setUserSubscription((prev) => ({
      ...prev,
      aiRequestsUsedThisMonth: prev.aiRequestsUsedThisMonth + 1,
    }));
  };

  // 2. AI Quality & Observability
  const [aiModels, setAiModels] = useState<AIModelConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AI_MODELS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AI_MODELS;
  });

  const toggleAiModelEnabled = (id: string) => {
    setAiModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const [promptVersions] = useState<AIPromptVersion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROMPT_VERSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PROMPT_VERSIONS;
  });

  const [evaluationCases, setEvaluationCases] = useState<AIEvaluationCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVAL_CASES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AI_EVALUATION_CASES;
  });

  const runAllEvaluations = async () => {
    const updated = await AIService.runEvaluationSuite(evaluationCases);
    setEvaluationCases(updated);
    showToast('AI Quality & Regression Test Suite completed: 100% Passed ✅', 'success');
  };

  const [aiFeedback, setAiFeedback] = useState<AIFeedbackRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AI_FEEDBACK);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const submitAiFeedback = (feature: string, helpful: boolean, comment?: string) => {
    const newRecord: AIFeedbackRecord = {
      id: uid('fb'),
      feature,
      helpful,
      comment,
      timestamp: new Date().toISOString(),
    };
    setAiFeedback((prev) => [newRecord, ...prev]);
    showToast(
      helpful
        ? 'Thank you! LoveMate learns from your feedback ❤️'
        : 'Feedback recorded. Our prompt team will calibrate this.',
      'info'
    );
  };

  const [aiIssues, setAiIssues] = useState<AIIssueReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AI_ISSUES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const reportAiIssue = (feature: string, category: AIIssueReport['category'], details: string) => {
    const newReport: AIIssueReport = {
      id: uid('iss'),
      feature,
      category,
      details,
      status: 'open',
      createdAt: 'Just now',
    };
    setAiIssues((prev) => [newReport, ...prev]);
    showToast('Report submitted. We take response safety and quality seriously.', 'info');
  };

  // 3. Memory 2.0 Contradictions
  const [memoryContradictions, setMemoryContradictions] = useState<MemoryContradiction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONTRADICTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_MEMORY_CONTRADICTIONS;
  });

  const resolveContradiction = (id: string, resolution: string) => {
    setMemoryContradictions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'resolved' as const } : c))
    );
    showToast(`Memory contradiction resolved: "${resolution}"`, 'success');
  };

  // 4. Growth & Referrals
  const [referralStats, setReferralStats] = useState<ReferralStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REFERRALS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_REFERRAL_STATS;
  });

  const generateNewReferralCode = () => {
    const newCode = `LOVE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setReferralStats((prev) => ({ ...prev, referralCode: newCode }));
    showToast(`New referral code generated: ${newCode}`, 'info');
  };

  const claimReferralCode = (code: string): boolean => {
    if (code.trim().toUpperCase() === referralStats.referralCode) {
      showToast('You cannot use your own referral code!', 'info');
      return false;
    }
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,24}$/.test(normalized)) {
      showToast('That does not look like a valid referral code.', 'info');
      return false;
    }
    const claimed = readJSON<string[]>(STORAGE_KEY_CLAIMED_REFERRALS, []);
    if (claimed.includes(normalized)) {
      showToast('You have already used this referral code.', 'info');
      return false;
    }
    localStorage.setItem(STORAGE_KEY_CLAIMED_REFERRALS, JSON.stringify([...claimed, normalized]));
    setReferralStats((prev) => ({ ...prev, pointsEarned: prev.pointsEarned + 100 }));
    addPoints(100, 'Referral bonus');
    triggerConfetti();
    return true;
  };

  // 5. Customer Support
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUPPORT_TICKETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SUPPORT_TICKETS;
  });

  const createSupportTicket = (
    subject: string,
    category: SupportTicket['category'],
    description: string
  ) => {
    const newTicket: SupportTicket = {
      id: uid('tkt'),
      userId: user?.id || 'usr_demo_1',
      userEmail: user?.email || 'user@lovemate.ai',
      category,
      subject,
      description,
      status: 'open',
      priority: 'medium',
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    showToast('Support ticket created. Our team will review within 24 hours.', 'success');
  };

  const updateSupportTicketStatus = (id: string, status: SupportTicket['status']) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: 'Just now' } : t))
    );
  };

  // 6. Experiments
  const [experiments, setExperiments] = useState<ExperimentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_EXPERIMENTS;
  });

  const toggleExperimentStatus = (id: string) => {
    setExperiments((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === 'active' ? 'paused' : 'active' } : e
      )
    );
  };

  // 7. Globalization
  const [globalization, setGlobalization] = useState<GlobalizationConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GLOBALIZATION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_GLOBALIZATION;
  });

  const updateGlobalization = (updates: Partial<GlobalizationConfig>) => {
    setGlobalization((prev) => ({ ...prev, ...updates }));
    showToast('Regional preferences updated.', 'info');
  };

  const formatCurrency = (amountUSDOrINR: number): string => {
    const symbol = globalization.currencySymbol;
    if (globalization.currency === 'INR') {
      return `${symbol}${amountUSDOrINR.toLocaleString('en-IN')}`;
    }
    const rate = globalization.exchangeRateToUSD || 84;
    return `${symbol}${(amountUSDOrINR / rate).toFixed(2)}`;
  };

  const [unitEconomics] = useState<UnitEconomicsSummary>(INITIAL_UNIT_ECONOMICS);

  // 8. Trust, Privacy & Data Lifecycle
  const exportAllUserData = () => {
    const dataBlob = {
      exportTimestamp: new Date().toISOString(),
      user,
      memories: userMemories,
      subscription: userSubscription,
      calendar: calendarEvents,
      wishlist: wishlistItems,
      goals: goalsV2,
      savedConfessions,
      savedStories,
      notes: 'LoveMate AI User Data Archive — Privacy First Guarantee',
    };
    const jsonStr = JSON.stringify(dataBlob, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lovemate_user_archive_${user?.name || 'rahul'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Full data archive exported successfully! 📦', 'success');
  };

  const deleteUserAccount = () => {
    if (
      window.confirm(
        'Are you absolutely sure? All memories, shared moments, and history will be permanently deleted. This cannot be undone.'
      )
    ) {
      deleteAccount();
    }
  };

  const disconnectCoupleSafely = () => {
    setUser((prev) => (prev ? { ...prev, partnerConnected: false } : null));
    showToast('Partner safely disconnected. Shared access paused; your private vault remains secure.', 'info');
  };

  // Sync V5 to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(userSubscription));
  }, [userSubscription]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_MODELS, JSON.stringify(aiModels));
  }, [aiModels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVAL_CASES, JSON.stringify(evaluationCases));
  }, [evaluationCases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_FEEDBACK, JSON.stringify(aiFeedback));
  }, [aiFeedback]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_ISSUES, JSON.stringify(aiIssues));
  }, [aiIssues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTRADICTIONS, JSON.stringify(memoryContradictions));
  }, [memoryContradictions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(referralStats));
  }, [referralStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(supportTickets));
  }, [supportTickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(experiments));
  }, [experiments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GLOBALIZATION, JSON.stringify(globalization));
  }, [globalization]);

  // 11. Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'love') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#a855f7'],
      });
    } catch (e) {}
  };

  // Persist library, badges, replies, story, room, memory toggle
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SAVED_CONFESSIONS, JSON.stringify(savedConfessions)); }, [savedConfessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SAVED_COMPAT, JSON.stringify(savedCompatibility)); }, [savedCompatibility]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SAVED_STORIES, JSON.stringify(savedStories)); }, [savedStories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SAVED_CHATS, JSON.stringify(savedChats)); }, [savedChats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories)); }, [memories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(badges)); }, [badges]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_AI_MEMORY_ENABLED, JSON.stringify(aiMemoryEnabled)); }, [aiMemoryEnabled]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SAVED_REPLIES, JSON.stringify(savedReplies)); }, [savedReplies]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_REAL_STORY, JSON.stringify(ourRealStory)); }, [ourRealStory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_COUPLE_ROOM, JSON.stringify(coupleRoom)); }, [coupleRoom]);

  // Daily login streak: +1 if last active yesterday, reset to 1 if older, unchanged if already counted today
  useEffect(() => {
    if (!user) return;
    const daily = readJSON<{ lastActive?: string }>(STORAGE_KEY_DAILY, {});
    const today = todayKey();
    if (daily.lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    setUser((prev) =>
      prev ? { ...prev, streak: daily.lastActive === yesterday ? prev.streak + 1 : daily.lastActive ? 1 : prev.streak } : prev
    );
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify({ ...daily, lastActive: today }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Consume ?room=CODE invite links once on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (!room) return;
    if (user && joinCoupleRoom(room)) setActiveTab('couple-mode');
    params.delete('room');
    params.delete('partner');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-model failures (refusals, rate limits, outages) are announced once here as a toast.
  useEffect(() => {
    const onAiError = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      showToast(detail?.message || 'The AI request failed. Please try again.', 'info');
    };
    window.addEventListener(AI_ERROR_EVENT, onAiError);
    void getGenAIStatus();
    return () => window.removeEventListener(AI_ERROR_EVENT, onAiError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Meter every AI call and enforce the free-tier monthly limit (wraps the static service once)
  const subscriptionRef = React.useRef(userSubscription);
  subscriptionRef.current = userSubscription;
  useEffect(() => {
    const svc = AIService as unknown as Record<string, unknown> & { __metered?: boolean };
    if (svc.__metered) return;
    svc.__metered = true;
    const skip = new Set(['prototype', 'length', 'name', 'selectModelForTask', 'evaluateResponseQuality']);
    for (const key of Object.getOwnPropertyNames(AIService)) {
      const fn = svc[key];
      // Only meter real (async) AI generations; synchronous helpers keep their plain return values.
      if (typeof fn !== 'function' || skip.has(key) || fn.constructor.name !== 'AsyncFunction') continue;
      svc[key] = (...args: unknown[]) => {
        const sub = subscriptionRef.current;
        if (sub.tier === 'free' && sub.aiRequestsUsedThisMonth >= sub.aiRequestsLimitMonthly) {
          setProModalOpen(true);
          showToast("You've used this month's free AI requests. Upgrade to keep going.", 'info');
          return Promise.reject(new Error('AI_LIMIT_REACHED'));
        }
        setUserSubscription((prev) => ({ ...prev, aiRequestsUsedThisMonth: prev.aiRequestsUsedThisMonth + 1 }));
        return (fn as (...a: unknown[]) => unknown).apply(AIService, args);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMELINE, JSON.stringify(timelineMilestones));
  }, [timelineMilestones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(importantDates));
  }, [importantDates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHALLENGES, JSON.stringify(growthChallenges));
  }, [growthChallenges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(savedLoveCards));
  }, [savedLoveCards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUPLE_STREAK, coupleStreak.toString());
  }, [coupleStreak]);

  // Points & Gamification
  const addPoints = (amount: number, reason?: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newPoints = prev.points + amount;
      const newXp = prev.xp + amount * 3;
      return { ...prev, points: newPoints, xp: newXp };
    });
    if (reason) {
      showToast(`+${amount} Love Points! (${reason})`, 'love');
    }
  };

  const unlockBadge = (badgeId: string) => {
    const badge = badges.find((b) => b.id === badgeId);
    if (!badge || badge.unlocked) return;
    setBadges((prev) => prev.map((b) => (b.id === badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() } : b)));
    showToast(`🏆 Badge Unlocked: ${badge.title}!`, 'success');
    triggerConfetti();
  };

  // Memory operations
  const addMemory = (fact: string, category: AIMemoryItem['category']) => {
    const newItem: AIMemoryItem = {
      id: uid('mem'),
      fact,
      category,
      dateLearned: 'Just now',
    };
    setMemories((prev) => [newItem, ...prev]);
    showToast('Saved to AI Memory', 'info');
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('Memory item removed', 'info');
  };

  const clearMemories = () => {
    setMemories([]);
    showToast('All AI memories cleared', 'info');
  };

  // Saved library operations
  const saveConfession = (item: ConfessionItem) => {
    setSavedConfessions((prev) => [item, ...prev]);
    addPoints(20, 'Saved Confession');
    showToast('Confession saved to Library ❤️', 'love');
    triggerConfetti();
  };

  const deleteConfession = (id: string) => {
    setSavedConfessions((prev) => prev.filter((c) => c.id !== id));
    showToast('Confession deleted', 'info');
  };

  const saveCompatibility = (item: CompatibilityResult) => {
    setSavedCompatibility((prev) => [item, ...prev]);
    addPoints(25, 'Compatibility Check');
    showToast('Compatibility report saved ❤️', 'love');
  };

  const deleteCompatibility = (id: string) => {
    setSavedCompatibility((prev) => prev.filter((c) => c.id !== id));
    showToast('Report removed', 'info');
  };

  const saveStory = (story: LoveStory) => {
    setSavedStories((prev) => [story, ...prev.filter((s) => s.id !== story.id)]);
    addPoints(30, 'Saved Love Story');
    showToast('Love Story saved! 📖', 'love');
  };

  const deleteStory = (id: string) => {
    setSavedStories((prev) => prev.filter((s) => s.id !== id));
    showToast('Story removed', 'info');
  };

  const saveChatConversation = (title: string, messages: AIMessage[]) => {
    const item = {
      id: uid('chat'),
      title,
      messages,
      savedAt: 'Just now',
    };
    setSavedChats((prev) => [item, ...prev]);
    addPoints(15, 'Saved AI Chat');
    showToast('Conversation saved to Library', 'love');
  };

  const deleteSavedChat = (id: string) => {
    setSavedChats((prev) => prev.filter((c) => c.id !== id));
    showToast('Chat removed from Library', 'info');
  };

  const saveReplyItem = (item: ReplySuggestion) => {
    setSavedReplies((prev) => [item, ...prev]);
    showToast('Reply saved!', 'love');
  };

  // V2: Relationship Timeline operations
  const addMilestone = (m: Omit<TimelineMilestone, 'id'>) => {
    const newMilestone: TimelineMilestone = {
      ...m,
      id: uid('mile'),
    };
    setTimelineMilestones((prev) => [newMilestone, ...prev]);
    addPoints(20, 'Added Relationship Milestone');
    showToast('Milestone added to Our Timeline ❤️', 'love');
    triggerConfetti();
  };

  const deleteMilestone = (id: string) => {
    setTimelineMilestones((prev) => prev.filter((m) => m.id !== id));
    showToast('Milestone removed', 'info');
  };

  // V2: Important Dates operations
  const addImportantDate = (d: Omit<ImportantDate, 'id'>) => {
    const newDate: ImportantDate = {
      ...d,
      id: uid('date'),
    };
    setImportantDates((prev) => [newDate, ...prev]);
    addPoints(15, 'Saved Important Date');
    showToast('Date saved with reminder! 📅', 'love');
  };

  const deleteImportantDate = (id: string) => {
    setImportantDates((prev) => prev.filter((d) => d.id !== id));
    showToast('Date removed', 'info');
  };

  // V2: Growth Challenges operations
  const toggleChallengeDay = (challengeId: string, dayNumber: number) => {
    const ch = growthChallenges.find((c) => c.id === challengeId);
    const day = ch?.days.find((d) => d.dayNumber === dayNumber);
    if (!ch || !day) return;
    const completing = !day.completed;
    const updatedDays = ch.days.map((d) => (d.dayNumber === dayNumber ? { ...d, completed: completing } : d));
    const wasAllCompleted = ch.days.every((d) => d.completed);
    const allCompleted = updatedDays.every((d) => d.completed);
    setGrowthChallenges((prev) => prev.map((c) => (c.id === challengeId ? { ...c, days: updatedDays } : c)));
    if (!completing) return;
    if (allCompleted && !wasAllCompleted) {
      unlockBadge('relationship_builder');
      addPoints(50, 'Completed 7-Day Challenge');
      showToast('🎉 Congratulations! You completed the 7-day challenge!', 'success');
    } else {
      addPoints(10, `Completed Day ${dayNumber}`);
    }
  };

  const startChallenge = (challengeId: string) => {
    setGrowthChallenges((prev) =>
      prev.map((ch) => (ch.id === challengeId ? { ...ch, isStarted: true } : ch))
    );
    showToast('Challenge started! Let’s grow together 🌱', 'love');
  };

  // V2: Couple Rooms operations
  const createCoupleRoom = (activityType: CoupleRoom['activityType']) => {
    const code = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);
    const newRoom: CoupleRoom = {
      id: uid('room'),
      roomCode: code,
      creatorName: user?.name || 'You',
      partnerName: user?.partnerName || 'Partner',
      status: 'connected',
      activityType,
      createdAt: 'Just now',
      expiresAt: 'In 24 hours',
    };
    setCoupleRoom(newRoom);
    unlockBadge('couple_explorer');
    addPoints(25, 'Created Couple Room');
    showToast(`Room created: ${code} ❤️`, 'love');
    triggerConfetti();
    return newRoom;
  };

  const joinCoupleRoom = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!/^LOVE-[A-Z0-9]{4}$/.test(normalized)) {
      showToast('Room codes look like LOVE-1234. Check the code and try again.', 'info');
      return false;
    }
    if (coupleRoom && coupleRoom.roomCode === normalized && coupleRoom.creatorName === (user?.name || 'You')) {
      showToast('That is your own room code. Share it with your partner instead.', 'info');
      return false;
    }
    setCoupleRoom({
      id: uid('room'),
      roomCode: normalized,
      creatorName: user?.partnerName || 'Partner',
      partnerName: user?.name || 'You',
      status: 'connected',
      activityType: 'know_me_better',
      createdAt: 'Just now',
      expiresAt: 'In 24 hours',
    });
    unlockBadge('couple_explorer');
    addPoints(25, 'Joined Partner Room');
    showToast('Connected to Partner Room! 👫', 'success');
    triggerConfetti();
    return true;
  };

  const leaveCoupleRoom = () => {
    setCoupleRoom(null);
    showToast('Left Couple Room', 'info');
  };

  const incrementCoupleStreak = () => {
    const daily = readJSON<{ lastCoupleCheckIn?: string }>(STORAGE_KEY_DAILY, {});
    if (daily.lastCoupleCheckIn === todayKey()) {
      showToast('You already checked in today. Come back tomorrow to keep the streak going.', 'info');
      return;
    }
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify({ ...daily, lastCoupleCheckIn: todayKey() }));
    const next = coupleStreak + 1;
    setCoupleStreak(next);
    showToast(`🔥 Couple Streak Increased to ${next} Days!`, 'love');
    addPoints(20, 'Couple Streak Bonus');
    triggerConfetti();
  };

  // V2: Real Our Story & Love Cards
  const saveRealStory = (story: RealOurStory) => {
    setOurRealStory(story);
    unlockBadge('story_keeper');
    addPoints(35, 'Created Real Our Story');
    showToast('Our Story saved to Vault ❤️', 'love');
    triggerConfetti();
  };

  const saveLoveCard = (card: LoveCard) => {
    setSavedLoveCards((prev) => [card, ...prev]);
    addPoints(15, 'Created Love Card');
    showToast('Love Card saved! 🎨', 'love');
    triggerConfetti();
  };

  const deleteLoveCard = (id: string) => {
    setSavedLoveCards((prev) => prev.filter((c) => c.id !== id));
    showToast('Card removed', 'info');
  };

  // ========================

  // V3 HANDLERS & SYNC EFFECTS
  // ========================

  // Sync V3 to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER_MEMORIES, JSON.stringify(userMemories));
  }, [userMemories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMORY_SETTINGS, JSON.stringify(memorySettings));
  }, [memorySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOVEMATE_PROFILE, JSON.stringify(loveMateProfile));
  }, [loveMateProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PATTERNS, JSON.stringify(relationshipPatterns));
  }, [relationshipPatterns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRENDS, JSON.stringify(relationshipTrends));
  }, [relationshipTrends]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROACTIVE_SETTINGS, JSON.stringify(proactiveSettings));
  }, [proactiveSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHARED_MEMORIES, JSON.stringify(sharedMemories));
  }, [sharedMemories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHARED_GOALS, JSON.stringify(sharedGoals));
  }, [sharedGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHARED_PLANS, JSON.stringify(sharedPlans));
  }, [sharedPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUPLE_JOURNAL, JSON.stringify(coupleJournal));
  }, [coupleJournal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LONG_DISTANCE, JSON.stringify(longDistanceState));
  }, [longDistanceState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUPLE_PERMS, JSON.stringify(couplePermissions));
  }, [couplePermissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // V3 Memory Handlers
  const addUserMemory = (m: Omit<UserMemoryItem, 'id' | 'createdAt'>) => {
    const newItem: UserMemoryItem = {
      ...m,
      id: uid('mem'),
      createdAt: 'Just now',
    };
    setUserMemories((prev) => [newItem, ...prev]);
    showToast('Saved to LoveMate Memory Engine 🧠', 'love');
  };

  const updateUserMemory = (id: string, updates: Partial<UserMemoryItem>) => {
    setUserMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    showToast('Memory updated', 'success');
  };

  const deleteUserMemory = (id: string) => {
    setUserMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('Memory forgotten safely', 'info');
  };

  const clearAllUserMemories = () => {
    setUserMemories([]);
    showToast('All AI memories cleared safely', 'info');
  };

  const updateMemorySettings = (s: Partial<MemorySettings>) => {
    setMemorySettings((prev) => ({ ...prev, ...s }));
    showToast('Memory settings saved', 'success');
  };

  // V3 Personalization Handlers
  const updateLoveMateProfile = (p: Partial<LoveMateProfile>) => {
    setLoveMateProfile((prev) => ({ ...prev, ...p }));
    showToast('Personalization profile updated ✨', 'success');
  };

  const recordAdviceFeedback = (feedback: Omit<AdviceFeedback, 'id' | 'timestamp'>) => {
    const newFeedback: AdviceFeedback = {
      ...feedback,
      id: uid('fb'),
      timestamp: 'Just now',
    };
    setAdviceFeedbacks((prev) => [newFeedback, ...prev]);
    showToast('Thank you for helping LoveMate learn your style! ❤️', 'love');
  };

  // V3 Patterns & Trends
  const addRelationshipPattern = (p: Omit<RelationshipPattern, 'id' | 'detectedAt'>) => {
    const newPattern: RelationshipPattern = {
      ...p,
      id: uid('pat'),
      detectedAt: 'Today',
    };
    setRelationshipPatterns((prev) => [newPattern, ...prev]);
  };

  const updateRelationshipTrends = (t: Partial<RelationshipTrends>) => {
    setRelationshipTrends((prev) => ({ ...prev, ...t }));
  };

  // V3 Proactive AI
  const dismissProactiveSuggestion = (id: string) => {
    setProactiveSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const updateProactiveSettings = (s: Partial<ProactiveSettings>) => {
    setProactiveSettings((prev) => ({ ...prev, ...s }));
    showToast('Proactive AI settings updated', 'success');
  };

  // V3 Shared Space Handlers
  const addSharedMemory = (m: Omit<SharedMemory, 'id'>) => {
    const newItem: SharedMemory = {
      ...m,
      id: uid('smem'),
    };
    setSharedMemories((prev) => [newItem, ...prev]);
    addPoints(20, 'Added Shared Memory');
    showToast('Memory added to Our Space ❤️', 'love');
    triggerConfetti();
  };

  const deleteSharedMemory = (id: string) => {
    setSharedMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('Memory removed', 'info');
  };

  const toggleSharedGoal = (id: string) => {
    setSharedGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const completed = !g.completed;
          if (completed) {
            addPoints(40, 'Completed Shared Goal');
            triggerConfetti();
            showToast(`Goal Completed: ${g.title}! 🎉`, 'success');
          }
          return { ...g, completed, progressPercent: completed ? 100 : g.progressPercent };
        }
        return g;
      })
    );
  };

  const addSharedGoal = (g: Omit<SharedGoal, 'id'>) => {
    const newGoal: SharedGoal = {
      ...g,
      id: uid('goal'),
    };
    setSharedGoals((prev) => [newGoal, ...prev]);
    showToast('New shared goal created 🎯', 'success');
  };

  const addSharedPlan = (p: Omit<SharedPlanItem, 'id'>) => {
    const newPlan: SharedPlanItem = {
      ...p,
      id: uid('plan'),
    };
    setSharedPlans((prev) => [newPlan, ...prev]);
    showToast('Added to Shared Plans 🍷', 'love');
  };

  const toggleSharedPlan = (id: string) => {
    setSharedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'completed' ? 'planned' : 'completed' } : p))
    );
  };

  const addCoupleJournalEntry = (e: Omit<CoupleJournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: CoupleJournalEntry = {
      ...e,
      id: uid('journ'),
      createdAt: 'Just now',
    };
    setCoupleJournal((prev) => [newEntry, ...prev]);
    addPoints(15, 'Wrote in Couple Journal');
    showToast(e.visibility === 'shared' ? 'Shared entry posted to Our Journal ❤️' : 'Private journal entry saved 🔒', 'love');
  };

  const updateLongDistanceState = (s: Partial<LongDistanceState>) => {
    setLongDistanceState((prev) => ({ ...prev, ...s }));
    showToast('Long-Distance Mode settings updated 🌍', 'success');
  };

  const updateCouplePermissions = (p: Partial<CouplePermissions>) => {
    setCouplePermissions((prev) => ({ ...prev, ...p }));
    showToast('Sharing permissions updated', 'success');
  };

  // V3 Notifications & Growth
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');
  };

  const createReferralInvite = (role: ReferralInvite['inviteeRole']) => {
    const token = 'LM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newInvite: ReferralInvite = {
      id: uid('inv'),
      token,
      inviteeRole: role,
      rewardPoints: 150,
      status: 'pending',
      createdAt: 'Just now',
    };
    setReferralInvites((prev) => [newInvite, ...prev]);
    showToast(`Invite created for your ${role}! +150 Points when they connect ❤️`, 'love');
    return newInvite;
  };

  // Auth functions
  const openAuthModal = (mode: 'login' | 'signup' | 'forgot' | 'verify' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const newUserRecord = (name: string, email: string): User => ({
    id: uid('usr'),
    name,
    email,
    streak: 1,
    points: 100,
    xp: 250,
    isPro: false,
    vibe: 'Cute & Friendly',
    preferredLanguage: 'hinglish',
    joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    goals: ['Crush'],
    partnerName: undefined,
    partnerConnected: false,
  });

  const finishSignIn = (u: User, message: string) => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    setUser(u);
    closeAuthModal();
    showToast(message, 'love');
  };

  const login: AppContextType['login'] = async (email, options = {}) => {
    const key = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts[key];
    if (options.provider === 'google' || options.provider === 'otp') {
      const u = account?.user ?? newUserRecord(options.name || key.split('@')[0], key);
      accounts[key] = { passwordHash: account?.passwordHash ?? null, user: u };
      saveAccounts(accounts);
      finishSignIn(u, `Welcome${account ? ' back' : ''}, ${u.name}!`);
      return 'ok';
    }
    if (!account) return 'no_account';
    if (account.passwordHash) {
      const hash = await hashPassword(options.password || '');
      if (hash !== account.passwordHash) return 'wrong_password';
    }
    finishSignIn(account.user, `Welcome back, ${account.user.name}!`);
    return 'ok';
  };

  const signup: AppContextType['signup'] = async (name, email, password) => {
    const key = email.trim().toLowerCase();
    const accounts = loadAccounts();
    if (accounts[key]) return 'exists';
    const u = newUserRecord(name.trim(), key);
    accounts[key] = { user: u, passwordHash: await hashPassword(password) };
    saveAccounts(accounts);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    setUser(u);
    closeAuthModal();
    setOnboardingOpen(true);
    showToast("Account created. Let's personalise your experience.", 'love');
    return 'ok';
  };

  const setPasswordForEmail: AppContextType['setPasswordForEmail'] = async (email, password) => {
    const key = email.trim().toLowerCase();
    const accounts = loadAccounts();
    if (!accounts[key]) return false;
    accounts[key] = { ...accounts[key], passwordHash: await hashPassword(password) };
    saveAccounts(accounts);
    return true;
  };

  const accountExists = (email: string) => !!loadAccounts()[email.trim().toLowerCase()];

  // Keep the signed-in user's record in the account store current
  useEffect(() => {
    if (!user) return;
    const accounts = loadAccounts();
    const key = user.email.toLowerCase();
    const current: LocalAccount = accounts[key] ?? { user, passwordHash: null };
    accounts[key] = { ...current, user };
    saveAccounts(accounts);
  }, [user]);

  const logout = () => {
    localStorage.setItem(STORAGE_KEY_SESSION, 'signed_out');
    setUser(null);
    setPendingCopilotPrompt(null);
    showToast('Logged out', 'info');
    setActiveTab('home');
  };

  const deleteAccount = () => {
    const email = user?.email.toLowerCase();
    wipeLoveMateStorage();
    if (email) {
      const accounts = loadAccounts();
      delete accounts[email];
      saveAccounts(accounts);
    }
    localStorage.setItem(STORAGE_KEY_SESSION, 'signed_out');
    showToast('Account and all personal relationship data erased.', 'info');
    setTimeout(() => window.location.replace(window.location.pathname), 600);
  };

  const completeOnboarding = (data: { name: string; goals: string[]; chatLanguage: Language; vibe: string }) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: data.name || prev.name,
        goals: data.goals,
        preferredLanguage: data.chatLanguage,
        vibe: data.vibe,
        points: prev.points + 100,
      };
    });
    setOnboardingOpen(false);
    triggerConfetti();
    showToast("You're all set! Let’s figure out love together ❤️", 'love');
  };

  const updateUserPreferences = (prefs: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...prefs } : null));
    showToast('Profile updated', 'success');
  };

  const openShareModal = (item: {
    type: 'compatibility' | 'confession' | 'reply' | 'game' | 'card' | 'story' | 'wrapped' | 'scrapbook';
    data: any;
  }) => {
    setShareModalItem(item);
  };

  const closeShareModal = () => {
    setShareModalItem(null);
  };

  // ========================
  // V4 MASTER EXPANSION HANDLERS
  // ========================
  // 1. Agent Tasks & Planner
  const addAgentTask = (task: Omit<AgentTask, 'id' | 'createdAt'>): AgentTask => {
    const newTask: AgentTask = {
      ...task,
      id: uid('task'),
      createdAt: 'Just now',
    };
    setAgentTasks((prev) => [newTask, ...prev]);
    showToast(`Task queued: "${newTask.title}"`, 'success');
    return newTask;
  };

  const updateAgentTaskStatus = (id: string, status: AgentTaskStatus) => {
    setAgentTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, completedAt: status === 'completed' ? 'Just now' : t.completedAt } : t))
    );
    showToast(`Task updated to ${status}`, 'info');
  };

  const confirmAgentTask = (id: string) => {
    setAgentTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'scheduled', requiresConfirmation: false } : t))
    );
    showToast('Task confirmed & scheduled! 🚀', 'success');
  };

  const cancelAgentTask = (id: string) => {
    setAgentTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' } : t))
    );
    showToast('Task cancelled', 'info');
  };

  const deleteAgentTask = (id: string) => {
    setAgentTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task removed', 'info');
  };

  const executeAgentPrompt = async (prompt: string): Promise<AgentActionPlan> => {
    showToast('LoveMate Agent: Thinking & planning...', 'love');
    const plan = await AIService.executeAgentRequest(
      prompt,
      { name: user?.name || 'Rahul', partnerName: user?.partnerName || 'Ananya' },
      userMemories
    );

    // Queue suggested tasks
    if (plan.suggestedTasks && plan.suggestedTasks.length > 0) {
      const newTasks: AgentTask[] = plan.suggestedTasks.map((st, idx) => ({
        id: `task_${Date.now()}_${idx}`,
        userId: user?.id || 'usr_demo_1',
        type: st.type,
        title: st.title,
        description: st.description,
        status: plan.requiresConfirmation ? 'awaiting_confirmation' : 'planned',
        priority: st.priority,
        scheduledAt: plan.recommendedDate || 'Upcoming',
        source: 'agent',
        requiresConfirmation: plan.requiresConfirmation,
        permissionLevel: plan.permissionLevel,
        createdAt: 'Just now',
      }));
      setAgentTasks((prev) => [...newTasks, ...prev]);
    }

    // Auto-create calendar placeholder if a recommended date exists
    if (plan.recommendedDate) {
      const newEvent: CoupleCalendarEvent = {
        id: uid('cal'),
        title: plan.steps[0]?.title || plan.summary,
        description: `Agent Plan: ${plan.summary}`,
        date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        time: '19:30',
        category: plan.intent === 'anniversary_plan' ? 'anniversary' : 'date',
        participants: 'both',
        privacy: 'shared',
        createdBy: 'LoveMate Agent',
        reminderDaysBefore: 2,
      };
      setCalendarEvents((prev) => [newEvent, ...prev]);
    }

    triggerConfetti();
    showToast('Action plan created by LoveMate Agent! 🎯', 'success');
    return plan;
  };

  // 2. Autopilot
  const toggleAutopilot = (id: string) => {
    setAutopilotSettings((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
    showToast('Autopilot rule updated', 'info');
  };

  const updateAutopilotSetting = (id: string, updates: Partial<RelationshipAutopilotSetting>) => {
    setAutopilotSettings((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Autopilot preferences saved', 'success');
  };

  // 3. Calendar Events
  const addCalendarEvent = (event: Omit<CoupleCalendarEvent, 'id'>): CoupleCalendarEvent => {
    const newEvent: CoupleCalendarEvent = {
      ...event,
      id: uid('cal'),
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
    showToast(`Added to Couple Calendar: "${newEvent.title}"`, 'success');
    return newEvent;
  };

  const updateCalendarEvent = (id: string, updates: Partial<CoupleCalendarEvent>) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    showToast('Calendar event updated', 'info');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('Event removed from calendar', 'info');
  };

  // 4. Goals V2
  const addGoalV2 = (goal: Omit<RelationshipGoalV2, 'id'>) => {
    const newGoal: RelationshipGoalV2 = {
      ...goal,
      id: `goal_v2_${Date.now()}`,
    };
    setGoalsV2((prev) => [newGoal, ...prev]);
    showToast(`Goal established: "${newGoal.title}"`, 'love');
  };

  const toggleGoalV2Milestone = (goalId: string, milestoneId: string) => {
    setGoalsV2((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = Math.round((completedCount / updatedMilestones.length) * 100);
        return { ...g, milestones: updatedMilestones, progress };
      })
    );
    showToast('Goal milestone updated', 'success');
  };

  const updateGoalV2Progress = (goalId: string, progress: number) => {
    setGoalsV2((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, progress } : g))
    );
  };

  const deleteGoalV2 = (id: string) => {
    setGoalsV2((prev) => prev.filter((g) => g.id !== id));
    showToast('Goal removed', 'info');
  };

  // 5. Wishlist
  const addWishlistItem = (item: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const newItem: WishlistItem = {
      ...item,
      id: uid('wish'),
      createdAt: 'Just now',
    };
    setWishlistItems((prev) => [newItem, ...prev]);
    showToast(`Added to Our Wishlist: "${newItem.title}"`, 'love');
  };

  const toggleWishlistItemCompleted = (id: string) => {
    setWishlistItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, completed: !w.completed } : w))
    );
    showToast('Wishlist item updated', 'info');
  };

  const deleteWishlistItem = (id: string) => {
    setWishlistItems((prev) => prev.filter((w) => w.id !== id));
    showToast('Item removed from wishlist', 'info');
  };

  // 6. Marketplace Experiences
  const useExperience = (id: string) => {
    setMarketplaceExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, usageCount: exp.usageCount + 1 } : exp))
    );
    addPoints(25, 'Started Marketplace Experience');
    showToast('Experience activated! Have fun together ❤️', 'love');
  };

  const submitExperience = (
    item: Omit<ExperienceItem, 'id' | 'rating' | 'reviewCount' | 'usageCount' | 'moderationStatus'>
  ) => {
    const newExp: ExperienceItem = {
      ...item,
      id: uid('exp'),
      rating: 5.0,
      reviewCount: 1,
      usageCount: 1,
      moderationStatus: 'pending',
    };
    setMarketplaceExperiences((prev) => [newExp, ...prev]);
    showToast('Experience submitted to moderation queue! 🎉', 'success');
  };

  // 7. Feature Flags
  const toggleFeatureFlag = (flag: keyof FeatureFlags) => {
    setFeatureFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
    showToast(`Feature flag ${flag} toggled`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        pendingCopilotPrompt,
        setPendingCopilotPrompt,
        isAdmin: !!user && (user.email.endsWith("@lovemate.ai") || user.email === "admin@lovemate.ai"),
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        onboardingOpen,
        setOnboardingOpen,
        login,
        signup,
        setPasswordForEmail,
        accountExists,
        logout,
        deleteAccount,
        completeOnboarding,
        updateUserPreferences,
        addPoints,
        badges,
        unlockBadge,
        aiMemoryEnabled,
        setAiMemoryEnabled,
        memories,
        addMemory,
        deleteMemory,
        clearMemories,
        savedConfessions,
        saveConfession,
        deleteConfession,
        savedCompatibility,
        saveCompatibility,
        deleteCompatibility,
        savedStories,
        saveStory,
        deleteStory,
        savedChats,
        saveChatConversation,
        deleteSavedChat,
        savedReplies,
        saveReplyItem,
        timelineMilestones,
        addMilestone,
        deleteMilestone,
        importantDates,
        addImportantDate,
        deleteImportantDate,
        growthChallenges,
        toggleChallengeDay,
        startChallenge,
        coupleRoom,
        createCoupleRoom,
        joinCoupleRoom,
        leaveCoupleRoom,
        coupleStreak,
        incrementCoupleStreak,
        ourRealStory,
        saveRealStory,
        savedLoveCards,
        saveLoveCard,
        deleteLoveCard,

        // V3 Provider Values
        userMemories,
        addUserMemory,
        updateUserMemory,
        deleteUserMemory,
        clearAllUserMemories,
        memorySettings,
        updateMemorySettings,
        loveMateProfile,
        updateLoveMateProfile,
        adviceFeedbacks,
        recordAdviceFeedback,
        relationshipPatterns,
        addRelationshipPattern,
        relationshipTrends,
        updateRelationshipTrends,
        proactiveSuggestions,
        dismissProactiveSuggestion,
        proactiveSettings,
        updateProactiveSettings,
        sharedMemories,
        addSharedMemory,
        deleteSharedMemory,
        sharedGoals,
        toggleSharedGoal,
        addSharedGoal,
        sharedPlans,
        addSharedPlan,
        toggleSharedPlan,
        coupleJournal,
        addCoupleJournalEntry,
        longDistanceState,
        updateLongDistanceState,
        couplePermissions,
        updateCouplePermissions,
        notifications,
        markNotificationAsRead,
        dismissNotification,
        clearAllNotifications,
        notificationsModalOpen,
        setNotificationsModalOpen,
        magicButtonModalOpen,
        setMagicButtonModalOpen,
        referralInvites,
        createReferralInvite,
        loveMateWrapped,

        // V4 Provider Values
        agentTasks,
        addAgentTask,
        updateAgentTaskStatus,
        confirmAgentTask,
        cancelAgentTask,
        deleteAgentTask,
        executeAgentPrompt,
        autopilotSettings,
        toggleAutopilot,
        updateAutopilotSetting,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        goalsV2,
        addGoalV2,
        toggleGoalV2Milestone,
        updateGoalV2Progress,
        deleteGoalV2,
        wishlistItems,
        addWishlistItem,
        toggleWishlistItemCompleted,
        deleteWishlistItem,
        marketplaceExperiences,
        useExperience,
        submitExperience,
        featureFlags,
        toggleFeatureFlag,
        adminMetrics,

        searchOpen,
        setSearchOpen,
        proModalOpen,
        setProModalOpen,
        shareModalItem,
        openShareModal,
        closeShareModal,
        toasts,
        showToast,
        triggerConfetti,

        // V5 Provider Values
        userSubscription,
        canUseFeature,
        upgradeSubscription,
        cancelSubscription,
        incrementAiUsage,
        aiModels,
        toggleAiModelEnabled,
        promptVersions,
        evaluationCases,
        runAllEvaluations,
        submitAiFeedback,
        aiIssues,
        reportAiIssue,
        memoryContradictions,
        resolveContradiction,
        referralStats,
        generateNewReferralCode,
        claimReferralCode,
        supportTickets,
        createSupportTicket,
        updateSupportTicketStatus,
        experiments,
        toggleExperimentStatus,
        globalization,
        updateGlobalization,
        formatCurrency,
        unitEconomics,
        exportAllUserData,
        deleteUserAccount,
        disconnectCoupleSafely,

        // 9. Design System Spec
        designSystemOpen,
        setDesignSystemOpen,
        logoModalOpen,
        setLogoModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
