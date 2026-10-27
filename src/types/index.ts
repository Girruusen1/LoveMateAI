export type Language = 'hinglish' | 'english' | 'hindi' | 'roman_hindi';

export type AIPersonality = 'wingman' | 'empath' | 'savage' | 'poet';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streak: number;
  points: number;
  xp: number;
  isPro: boolean;
  vibe: string;
  preferredLanguage: Language;
  joinedAt: string;
  goals: string[];
  partnerName?: string;
  partnerConnected?: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: Language;
  personality?: AIPersonality;
  isSaved?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  updatedAt: string;
  personality: AIPersonality;
  language: Language;
  isPinned?: boolean;
}

export interface CompatibilityResult {
  id: string;
  yourName: string;
  theirName: string;
  birthdaySelf?: string;
  birthdayPartner?: string;
  relationshipType: string;
  overallScore: number;
  breakdown: {
    chemistry: number;
    communication: number;
    personality: number;
    emotionalConnection: number;
  };
  aiAnalysis: string;
  verdict: string;
  createdAt: string;
}

export interface ConfessionItem {
  id: string;
  recipient: string;
  tone: string;
  language: Language;
  length: 'short' | 'medium' | 'long';
  content: string;
  originalPrompt?: string;
  createdAt: string;
  favorite?: boolean;
}

export interface ReplySuggestion {
  id: string;
  inputMessage: string;
  intent: string;
  replies: {
    id: string;
    text: string;
    vibe: string;
    explanation: string;
  }[];
  createdAt: string;
}

export interface CrushAnalysisResult {
  score: number;
  ratingLabel: string;
  summary: string;
  signals: { label: string; status: 'positive' | 'neutral' | 'watchout'; detail: string }[];
  aiAdvice: string;
  nextMove: string;
}

export interface ShouldIConfessResult {
  status: 'green' | 'yellow' | 'red';
  statusLabel: string;
  confidencePercent: number;
  analysis: string;
  reasons: string[];
  recommendedSteps: string[];
  suggestedScript: string;
}

/** Crush analyser answers (option codes from CrushAnalyzerView; an empty string means not asked). */
export interface CrushAnswers {
  initiates: string;
  replySpeed: string;
  length: string;
  emojis: string;
  plans: string;
  memory: string;
}

export interface ConfessSituation {
  howLongKnown: string;
  has1on1Hangouts: boolean;
  flirtyVibe: boolean;
  isCloseFriend: boolean;
  /** Optional free-text description of the situation. */
  story?: string;
}

export interface RelationshipSignalResult {
  flagType: 'green' | 'yellow' | 'red';
  label: string;
  analysis: string;
  whatToNotice: string[];
  whatToAsk: string;
  healthyResponse: string;
}

export interface OurStoryMemories {
  howMet: string;
  firstDate: string;
  funnyMemory: string;
  favoritePlace: string;
  whatYouLove: string;
}

export interface ScrapbookCaptionContext {
  date?: string;
  location?: string;
  tags?: string;
}

export interface GameCard {
  id: string;
  category: string;
  question: string;
  optionA?: string;
  optionB?: string;
  spicyLevel?: 1 | 2 | 3;
}

export interface DateGiftIdea {
  id: string;
  occasion: string;
  budget: string;
  dateIdeas: {
    title: string;
    description: string;
    estimatedCost: string;
    vibe: string;
    insiderTip: string;
  }[];
  giftIdeas: {
    item: string;
    whyTheyWillLoveIt: string;
    priceRange: string;
  }[];
}

export interface LoveStoryEpisode {
  episodeNumber: number;
  title: string;
  content: string;
}

export interface LoveStory {
  id: string;
  protagonistName: string;
  partnerName: string;
  howWeMet: string;
  setting: string;
  mood: string;
  episodes: LoveStoryEpisode[];
  createdAt: string;
}

export interface DailyDrop {
  id: string;
  date: string;
  tip: { english: string; hinglish: string; hindi: string };
  conversationStarter: { english: string; hinglish: string; hindi: string };
  coupleQuestion: { english: string; hinglish: string; hindi: string };
  cuteQuote: { english: string; hinglish: string; hindi: string };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AIMemoryItem {
  id: string;
  fact: string;
  category: 'crush' | 'relationship' | 'habit' | 'preference';
  dateLearned: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'love';
  message: string;
}

// ========================
// ADVANCED V2 DATA MODELS
// ========================

// 1. Decode This
export interface DecodeResult {
  id: string;
  originalMessage: string;
  context?: string;
  tone: string;
  mood: string;
  interestSignal: 'Unclear' | 'Subtle Interest' | 'Promising' | 'Platonic';
  conversationOpportunity: 'Low' | 'Medium' | 'High';
  momentum: {
    level: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  whatItMightMean: string[];
  whatNotToAssume: string;
  responses: {
    id: string;
    label: 'Casual' | 'Playful' | 'Flirty';
    text: string;
    hinglishText: string;
    explanation: string;
  }[];
}

// 2. Screenshot Analyzer
export interface ScreenshotAnalysis {
  id: string;
  imagePreviewUrl: string;
  extractedSnippet: string;
  conversationTone: string;
  energyLevel: 'Low' | 'Balanced' | 'High';
  momentum: string;
  potentialMisunderstandings: string[];
  suggestedReplies: {
    vibe: string;
    reply: string;
    hinglishReply: string;
    why: string;
  }[];
  timestamp: string;
}

// 3. AI Roleplay (Practice It)
export interface RoleplayScenario {
  id: string;
  title: string;
  icon: string;
  characterRole: string;
  context: string;
  startingMessage: string;
}

export interface RoleplayMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface RoleplayScorecard {
  confidence: number; // /10
  clarity: number; // /10
  naturalness: number; // /10
  pressureLevel: 'Low' | 'Medium' | 'High';
  whatWorked: string[];
  whatCouldImprove: string[];
  betterScript: string;
}

// 4. Two-Person Couple Mode & Rooms
export interface CoupleRoom {
  id: string;
  roomCode: string;
  creatorName: string;
  partnerName?: string;
  status: 'waiting' | 'connected' | 'completed';
  activityType: 'quiz' | 'know_me_better' | 'chemistry' | 'check_in';
  createdAt: string;
  expiresAt: string;
}

export interface CoupleMatchResult {
  matchedOn: string[];
  differOn: string[];
  discussionPrompts: string[];
}

// 5. Relationship Timeline
export interface TimelineMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'first_met' | 'first_convo' | 'first_date' | 'first_trip' | 'confession' | 'i_love_you' | 'funny' | 'anniversary' | 'custom';
  icon: string;
  photoUrl?: string;
}

// 6. Our Story (From Real Memories)
export interface RealOurStoryChapter {
  chapterNumber: number;
  title: string;
  subtitle: string;
  content: string;
}

export interface RealOurStory {
  id: string;
  title: string;
  partners: string;
  chapters: RealOurStoryChapter[];
  style: 'romantic' | 'funny' | 'cinematic';
  createdAt: string;
}

// 7. Relationship Health Check
export interface HealthCheckScore {
  category: 'Communication' | 'Trust' | 'Quality Time' | 'Emotional Connection' | 'Appreciation' | 'Conflict Resolution' | 'Fun' | 'Support';
  score: number; // 0-100
  note: string;
}

export interface HealthCheckResult {
  scores: HealthCheckScore[];
  strengths: string[];
  areasWorthDiscussing: string[];
  suggestedActions: string[];
  overallHealthLabel: string;
}

// 8. What If Simulator
export interface WhatIfPath {
  pathType: 'A' | 'B' | 'C';
  label: string; // e.g., 'Positive Response ❤️', 'Uncertain Response 🤔', 'Not Interested 💔'
  scenarioDescription: string;
  whatToSay: string;
  whatToAvoid: string;
  respectfulResponse: string;
}

export interface WhatIfResult {
  query: string;
  paths: WhatIfPath[];
}

// 9. Timed Date Planner
export interface DatePlanItineraryItem {
  time: string;
  activity: string;
  description: string;
  locationTip?: string;
}

export interface DatePlanItinerary {
  id: string;
  title: string;
  stage: string;
  budgetEst: string;
  schedule: DatePlanItineraryItem[];
  conversationTopics: string[];
  cuteMoments: string[];
  thingsToAvoid: string[];
  backupPlan: string;
  budgetBreakdown: { item: string; cost: string }[];
}

// 10. Love Cards
export interface LoveCard {
  id: string;
  recipientName: string;
  type: 'Birthday' | 'Anniversary' | 'Good Morning' | 'Good Night' | 'I Miss You' | 'Apology' | 'Valentine\'s Day' | 'Just Because';
  theme: 'soft-rose' | 'lavender-dream' | 'golden-sunset' | 'midnight-romance' | 'minimal-ivory';
  quote: string;
  personalNote: string;
  createdAt: string;
}

// 11. Important Dates
export interface ImportantDate {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'first_date' | 'milestone';
  reminderEnabled: boolean;
  notes?: string;
}

// 12. Growth Challenges
export interface GrowthChallengeDay {
  dayNumber: number;
  task: string;
  detail: string;
  completed: boolean;
}

export interface GrowthChallenge {
  id: string;
  title: string;
  category: string;
  description: string;
  days: GrowthChallengeDay[];
  isStarted: boolean;
}

// 13. Chemistry Mode Level Questions
export interface ChemistryQuestion {
  id: string;
  level: 1 | 2 | 3 | 4;
  levelTitle: string;
  question: string;
  whyAsking: string;
}

// ========================
// ADVANCED V3 DATA MODELS
// ========================

// 1. Memory Engine & Graph
export type MemorySourceType =
  | 'explicit_user_input'
  | 'inferred'
  | 'imported'
  | 'shared'
  | 'temporary'
  | 'chat'
  | 'checkin'
  | 'manual'
  | 'quiz'
  | 'timeline';

export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface UserMemoryItem {
  id: string;
  userId: string;
  category: 'personal' | 'relationship' | 'preferences' | 'memories' | 'goals' | 'communication' | 'important_dates';
  content: string;
  source: MemorySourceType;
  confidence: number; // 0.0 - 1.0
  visibility: 'private' | 'shared';
  importance?: MemoryImportance;
  lastConfirmedAt?: string;
  lastUsedAt?: string;
  sourceReason?: string; // e.g. "Mentioned during Wingman conversation on Oct 12"
  isConflicting?: boolean;
  conflictingReason?: string;
  decayScore?: number; // 0 - 100
  createdAt: string;
}

export interface MemoryEntity {
  id: string;
  type: 'user' | 'partner' | 'place' | 'event' | 'preference' | 'date' | 'goal' | 'activity';
  name: string;
  metadata?: Record<string, any>;
}

export interface MemoryRelation {
  id: string;
  sourceEntityId: string;
  relation: 'likes' | 'prefers' | 'first_date_at' | 'anniversary' | 'completed' | 'dislikes' | 'plans';
  targetEntityId: string;
  confidence: number;
}

export interface MemorySettings {
  personalMemory: boolean;
  relationshipMemory: boolean;
  conversationMemory: boolean;
  sharedCoupleMemory: boolean;
  personalization: boolean;
  isPaused: boolean;
}

// 2. Personal Relationship AI (My LoveMate)
export interface LoveMateProfile {
  communicationStyle: string; // e.g. "Casual + Hinglish"
  adviceStyle: 'direct' | 'options' | 'gentle';
  relationshipStage: 'single' | 'crush' | 'talking' | 'dating' | 'engaged' | 'married' | 'long_distance' | 'moving_on';
  favoriteActivities: string[];
  preferredMessageStyle: string;
  humorLevel: 'high' | 'subtle' | 'none';
  preferredLength: 'concise' | 'detailed';
}

export interface AdviceFeedback {
  id: string;
  timestamp: string;
  helpfulness: 'helpful' | 'okay' | 'not_useful';
  note?: string;
  featureContext: string;
}

// 3. Relationship Patterns & Trends
export interface RelationshipPattern {
  id: string;
  topic: string;
  frequencyCount: number;
  timePeriod: string;
  commonTheme: string;
  suggestedExperiment: string;
  detectedAt: string;
}

export interface RelationshipTrends {
  communicationTrend: 'improving' | 'stable' | 'declining';
  qualityTimeTrend: 'improving' | 'stable' | 'declining';
  trustTrend: 'improving' | 'stable' | 'declining';
  sharedActivitiesTrend: 'improving' | 'stable' | 'declining';
  overallSnapshot: {
    emotionalConnection: number;
    communication: number;
    qualityTime: number;
    sharedGoals: number;
    fun: number;
    trust: number;
  };
}

// 4. Proactive AI & Detective
export interface ProactiveSuggestion {
  id: string;
  type: 'anniversary' | 'challenge' | 'date_revisit' | 'reconnect' | 'practice';
  title: string;
  text: string;
  ctaLabel: string;
  ctaTab: ActiveTab;
  dismissable: boolean;
  createdAt: string;
}

export interface ProactiveSettings {
  frequency: 'minimal' | 'balanced' | 'frequent' | 'off';
  dailySuggestions: boolean;
  dateReminders: boolean;
  challengeReminders: boolean;
  streakReminders: boolean;
}

export interface RelationshipDetectiveResult {
  whatWeKnow: string[];
  whatMightBeHappening: string[];
  whatWeDontKnow: string[];
  whatYouCanDoNext: string[];
  suggestedConversation: string;
}

// 5. Shared Relationship Space
export interface SharedMemory {
  id: string;
  title: string;
  date: string;
  location?: string;
  caption: string;
  photoUrl?: string;
  tags: string[];
  generatedCaptions?: {
    romantic: string;
    funny: string;
    shortStory: string;
  };
}

export interface SharedGoal {
  id: string;
  title: string;
  category: 'travel' | 'habit' | 'savings' | 'challenge' | 'communication';
  progressPercent: number;
  deadline?: string;
  notes?: string;
  completed: boolean;
}

export interface SharedPlanItem {
  id: string;
  title: string;
  type: 'date' | 'travel' | 'gift' | 'restaurant' | 'idea';
  notes?: string;
  status: 'planned' | 'someday' | 'completed';
}

export interface CoupleJournalEntry {
  id: string;
  authorName: string;
  title: string;
  content: string;
  mood: string;
  visibility: 'shared' | 'private';
  createdAt: string;
  aiSummary?: string;
}

export interface LongDistanceState {
  isEnabled: boolean;
  yourCity: string;
  yourTimezone: string;
  partnerCity: string;
  partnerTimezone: string;
  nextMeetingDate?: string;
  milesApart?: number;
}

export interface CouplePermissions {
  shareTimeline: boolean;
  shareMemories: boolean;
  shareActivities: boolean;
  shareImportantDates: boolean;
  sharePersonalAiMemory: boolean;
  sharePrivateConversations: boolean;
  sharePersonalJournal: boolean;
}

// 6. Infinite AI Games & Real-Time Copilot
export interface GeneratedGameSession {
  id: string;
  title: string;
  gameType: string;
  relationshipStage: string;
  mood: string;
  durationMinutes: number;
  questions: {
    id: string;
    prompt: string;
    type: 'guess' | 'rapid' | 'choice' | 'open';
    options?: string[];
  }[];
}

export interface ConversationCoachPlan {
  scenarioGoal: string;
  steps: {
    step: string;
    phase: 'Opening' | 'Main Point' | 'Example' | 'Listen' | 'Respond' | 'Next Step';
    script: string;
    tip: string;
  }[];
}

export interface ReplyCopilotResult {
  bestReply: string;
  playfulReply: string;
  flirtyReply: string;
  safeReply: string;
  conversationExtender: string;
  changeTopic: string;
  hinglishBonus: string;
}

export interface VoiceCommunicationAudit {
  clarityScore: number; // 0-10
  confrontationalTriggerWords: string[];
  constructiveAlternative: string;
  coachAdvice: string;
}

// 7. Growth Engine & Wrapped
export interface LoveMateWrapped {
  year: number;
  period: 'annual' | 'monthly';
  monthName?: string;
  mostDiscussedTopic: string;
  mostUsedFeature: string;
  favoriteActivity: string;
  challengesCompleted: number;
  memoriesCreated: number;
  daysConnected: number;
  yearInOneSentence: string;
  highlightMoments: string[];
}

export interface ReferralInvite {
  id: string;
  token: string;
  inviteeRole: 'partner' | 'crush' | 'friend' | 'date';
  rewardPoints: number;
  status: 'pending' | 'joined' | 'completed';
  createdAt: string;
}

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  type: 'date' | 'challenge' | 'memory' | 'partner' | 'suggestion';
  isRead: boolean;
  timestamp: string;
  actionTab?: ActiveTab;
}

// 8. Relationship DNA & Wingman & Gifts/Trips
export interface RelationshipDNAResult {
  communication: number;
  lifestyle: number;
  emotionalConnection: number;
  humor: number;
  conflictStyle: number;
  futureGoals: number;
  qualityTime: number;
  strongestConnection: string;
  biggestDifference: string;
  funMatch: string;
  worthDiscussing: string;
  tryTogetherActivity: string;
}

export type WingmanStage = 'crush' | 'talking' | 'first_date' | 'confession' | 'dating' | 'moving_on';

export interface WantToTextDecision {
  situation: string;
  whatHappened: string;
  recommendation: 'send' | 'wait' | 'rewrite' | 'dont_send';
  reasoning: string;
  polishedText?: string;
  delayHours?: number;
}

export interface GiftIntelligenceResult {
  giftPersonality: {
    sentimental: 'High' | 'Medium' | 'Low';
    practical: 'High' | 'Medium' | 'Low';
    experienceOriented: 'High' | 'Medium' | 'Low';
  };
  recommendations: {
    title: string;
    category: string;
    estimatedPrice: string;
    whyTheyLoveIt: string;
    whereToFind: string;
  }[];
}

export interface TripTogetherItinerary {
  destination: string;
  durationDays: number;
  totalEstimatedBudget: string;
  dailyPlans: {
    dayNumber: number;
    theme: string;
    schedule: { time: string; activity: string; tip: string }[];
    coupleSurprise: string;
  }[];
  packingTips: string[];
  backupPlan: string;
}

// ==========================================
// V4 MASTER EXPANSION TYPES
// AI Agent, Copilot, Automation & Ecosystem
// ==========================================

export type AgentTaskType =
  | 'reminder'
  | 'date_plan'
  | 'gift_plan'
  | 'message_plan'
  | 'anniversary_plan'
  | 'birthday_plan'
  | 'relationship_checkin'
  | 'challenge'
  | 'calendar_event'
  | 'trip_plan'
  | 'surprise_plan'
  | 'reflection'
  | 'follow_up';

export type AgentTaskStatus =
  | 'pending'
  | 'planned'
  | 'awaiting_confirmation'
  | 'scheduled'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentActionStep {
  id: string;
  stepNumber: number;
  title: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed';
  permissionLevel: 1 | 2 | 3; // 1: Safe auto, 2: Confirm, 3: Explicit
  category: string;
}

export interface AgentActionPlan {
  id: string;
  intent: string;
  summary: string;
  steps: AgentActionStep[];
  estimatedBudget?: string;
  recommendedDate?: string;
  requiresConfirmation: boolean;
  permissionLevel: 1 | 2 | 3;
  suggestedTasks: {
    type: AgentTaskType;
    title: string;
    description: string;
    priority: AgentTaskPriority;
  }[];
  createdAt: string;
}

export interface AgentTask {
  id: string;
  userId: string;
  coupleId?: string;
  type: AgentTaskType;
  title: string;
  description: string;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  scheduledAt: string;
  deadline?: string;
  source: 'copilot' | 'autopilot' | 'agent' | 'user';
  requiresConfirmation: boolean;
  permissionLevel: 1 | 2 | 3;
  executionData?: Record<string, any>;
  resultData?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface RelationshipAutopilotSetting {
  id: string;
  key:
    | 'anniversary_prep'
    | 'weekly_date_suggestion'
    | 'sunday_checkin'
    | 'long_distance_weekend'
    | 'growth_challenge'
    | 'birthday_alert';
  title: string;
  description: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  quietHours: { start: string; end: string };
  lastTriggered?: string;
  nextTriggerScheduled?: string;
}

export interface CoupleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  category: 'anniversary' | 'birthday' | 'date' | 'trip' | 'challenge' | 'goal' | 'reminder';
  participants: 'both' | 'self' | 'partner';
  privacy: 'shared' | 'private';
  createdBy: string;
  reminderDaysBefore?: number;
  completed?: boolean;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface RelationshipGoalV2 {
  id: string;
  title: string;
  category:
    | 'quality_time'
    | 'communication'
    | 'dates'
    | 'long_distance'
    | 'financial'
    | 'travel'
    | 'emotional'
    | 'growth'
    | 'hobby';
  description: string;
  startDate: string;
  targetDate: string;
  progress: number; // 0 to 100
  milestones: GoalMilestone[];
  owner: 'both' | 'self' | 'partner';
  shared: boolean;
  status: 'active' | 'completed' | 'paused';
}

export type WishlistCategory =
  | 'gifts'
  | 'places'
  | 'restaurants'
  | 'trips'
  | 'activities'
  | 'movies'
  | 'experiences'
  | 'future_goals';

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category: WishlistCategory;
  url?: string;
  imageUrl?: string;
  estimatedPrice?: string;
  priority: 'dream' | 'high' | 'medium' | 'low';
  addedBy: string;
  shared: boolean;
  completed: boolean;
  createdAt: string;
}

export type ExperienceCategory =
  | 'games'
  | 'date_ideas'
  | 'conversation_packs'
  | 'challenges'
  | 'stories'
  | 'ldr'
  | 'proposals'
  | 'anniversary';

export interface CreatorProfile {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  bio?: string;
  experienceCount?: number;
}

export interface ExperienceItem {
  id: string;
  title: string;
  tagline: string;
  category: ExperienceCategory;
  description: string;
  price: 'free' | 'premium';
  rating: number;
  reviewCount: number;
  usageCount: number;
  creator: CreatorProfile;
  moderationStatus: 'approved' | 'pending' | 'draft';
  version: string;
  durationMinutes?: number;
  stepsCount?: number;
  tags: string[];
}

export interface FeatureFlags {
  love_agent: boolean;
  relationship_copilot: boolean;
  couple_ai: boolean;
  relationship_autopilot: boolean;
  couple_calendar: boolean;
  relationship_goals_v2: boolean;
  wishlist: boolean;
  gift_intelligence_v2: boolean;
  experience_marketplace: boolean;
  creator_system: boolean;
  community_foundation: boolean;
}

export interface AdminMetrics {
  activeUsers: number;
  totalAgentTasks: number;
  automationsActive: number;
  aiTokenUsageToday: number;
  aiLatencyAvgMs: number;
  moderationQueueLength: number;
  systemHealth: 'healthy' | 'degraded';
}

export type ActiveTab =
  | 'home'
  | 'chat'
  | 'calculator'
  | 'confession'
  | 'reply'
  | 'crush-analyzer'
  | 'should-confess'
  | 'relationship-helper'
  | 'games'
  | 'date-gift'
  | 'stories'
  | 'library'
  | 'profile'
  | 'pro'
  // Advanced V2 Tabs:
  | 'decode'
  | 'screenshot'
  | 'roleplay'
  | 'couple-mode'
  | 'timeline'
  | 'our-story'
  | 'health-check'
  | 'chemistry-mode'
  | 'what-if'
  | 'voice-chat'
  | 'date-planner'
  | 'message-transformer'
  | 'relationship-signals'
  | 'love-cards'
  | 'important-dates'
  | 'challenges'
  // Master V3 Tabs:
  | 'memory-center'
  | 'relationship-dashboard'
  | 'relationship-patterns'
  | 'detective'
  | 'our-space'
  | 'scrapbook'
  | 'our-story-movie'
  | 'couple-coach'
  | 'long-distance'
  | 'infinite-games'
  | 'conversation-coach'
  | 'reply-copilot'
  | 'communication-coach'
  | 'wrapped'
  | 'relationship-dna'
  | 'wingman-mode'
  | 'gift-intelligence'
  | 'trip-together'
  // Master V4 Tabs:
  | 'copilot'
  | 'agent-activity'
  | 'autopilot'
  | 'couple-calendar'
  | 'wishlist'
  | 'marketplace'
  | 'admin-hub'
  // Master V5 Tabs:
  | 'trust-center'
  | 'referrals'
  | 'support';

// ========================
// MASTER V5 DATA MODELS
// ========================

// 1. AI Quality & Model Routing
export type ModelRoutingTier = 'fast_cheap' | 'balanced' | 'deep_reasoning';

export interface AIModelConfig {
  id: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'fallback_local';
  modelName: string;
  taskType: 'classification' | 'generation' | 'reasoning' | 'agent_planning' | 'summarization';
  costTier: ModelRoutingTier;
  contextLimitTokens: number;
  latencyTargetMs: number;
  costPer1kTokensUSD: number;
  enabled: boolean;
}

export interface AIPromptVersion {
  promptId: string;
  version: string;
  feature: string;
  model: string;
  status: 'draft' | 'testing' | 'active' | 'archived';
  template: string;
  qualityScoreAvg: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
}

export interface AIEvaluationCase {
  id: string;
  feature: string;
  inputDescription: string;
  expectedBehavior: string;
  safetyRequirements: string;
  qualityScore: number; // 0 - 100
  lastTestedAt: string;
  status: 'passed' | 'warning' | 'failed';
  modelTested: string;
  notes?: string;
}

export interface AIFeedbackRecord {
  id: string;
  feature: string;
  helpful: boolean;
  comment?: string;
  timestamp: string;
}

export interface AIIssueReport {
  id: string;
  feature: string;
  category: 'incorrect' | 'unhelpful' | 'unsafe' | 'inappropriate' | 'privacy_concern' | 'technical';
  details: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
}

// 2. Advanced Memory 2.0 Contradictions
export interface MemoryContradiction {
  id: string;
  existingMemoryId: string;
  existingContent: string;
  newContent: string;
  suggestedResolution: string;
  status: 'pending' | 'resolved' | 'dismissed';
  detectedAt: string;
}

// 3. Monetization 2.0 & Entitlements
export type SubscriptionTierV5 = 'free' | 'plus' | 'couple' | 'premium';

export interface UserSubscriptionV5 {
  tier: SubscriptionTierV5;
  status: 'active' | 'trialing' | 'cancelled' | 'grace_period' | 'past_due';
  trialEndsAt?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  aiRequestsUsedThisMonth: number;
  aiRequestsLimitMonthly: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD';
  monthlyPrice: number;
}

export type EntitlementFeature =
  | 'basic_chat'
  | 'love_calculator'
  | 'confessions'
  | 'advanced_ai'
  | 'memory_center'
  | 'agent_autonomous'
  | 'autopilot'
  | 'couple_sync'
  | 'experience_marketplace'
  | 'unlimited_plans';

// 4. Growth & Referrals
export interface ReferralStats {
  referralCode: string;
  totalInvited: number;
  joinedCount: number;
  pointsEarned: number;
  activeCoupleLinked: boolean;
  invites: {
    id: string;
    emailOrCode: string;
    status: 'pending' | 'joined' | 'rewarded';
    createdAt: string;
  }[];
}

// 5. Customer Support & Tickets
export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  category: 'billing' | 'ai_response' | 'safety' | 'feature_request' | 'technical_bug';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
}

// 6. Experimentation Platform (A/B Testing)
export interface ExperimentItem {
  id: string;
  name: string;
  hypothesis: string;
  status: 'active' | 'paused' | 'concluded';
  variants: {
    id: string;
    name: string;
    allocationPercent: number;
    conversions: number;
    totalExposures: number;
  }[];
  startDate: string;
  primaryMetric: string;
}

// 7. Globalization
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD';
export type AppLanguage = 'en' | 'hinglish' | 'hi' | 'es' | 'fr';

export interface GlobalizationConfig {
  currency: CurrencyCode;
  currencySymbol: string;
  exchangeRateToUSD: number; // e.g. 84 for INR, 1.0 for USD
  language: AppLanguage;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

// 8. Unit Economics & Observability
export interface UnitEconomicsSummary {
  revenuePerUserUSD: number;
  aiCostPerUserUSD: number;
  infraCostPerUserUSD: number;
  grossMarginPercent: number;
  totalAiCostTodayUSD: number;
  totalAiTokensProcessedToday: number;
}


