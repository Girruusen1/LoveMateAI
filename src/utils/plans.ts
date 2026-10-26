import type { ActiveTab, SubscriptionTierV5 } from '../types';

/**
 * LoveMate plans: Free to get hooked, Plus for one person, Couple for two people with one payment.
 * Everything about what each plan includes lives here, so the menu, the locks and the pricing window agree.
 */
export type Plan = 'free' | 'plus' | 'couple';
export type PaidPlan = Exclude<Plan, 'free'>;

export const PLAN_RANK: Record<Plan, number> = { free: 0, plus: 1, couple: 2 };

/** Accounts that had the old Premium plan keep everything: it is now Couple. */
export const normalizePlan = (tier: SubscriptionTierV5): Plan => (tier === 'premium' ? 'couple' : tier);

export const PLANS: Record<Plan, { name: string; monthlyINR: number; yearlyINR: number }> = {
  free: { name: 'Free', monthlyINR: 0, yearlyINR: 0 },
  plus: { name: 'Plus', monthlyINR: 149, yearlyINR: 999 },
  couple: { name: 'Couple', monthlyINR: 249, yearlyINR: 1799 },
};

export const TRIAL_DAYS = 7;

/** Pages that need a paid plan. Everything else is free with an account. */
export const PAGE_PLAN: Partial<Record<ActiveTab, PaidPlan>> = {
  screenshot: 'plus',
  'reply-copilot': 'plus',
  detective: 'plus',
  'relationship-signals': 'plus',
  'what-if': 'plus',
  'message-transformer': 'plus',
  stories: 'plus',
  'date-planner': 'plus',
  'date-gift': 'plus',
  'gift-intelligence': 'plus',
  'trip-together': 'plus',
  'infinite-games': 'plus',
  roleplay: 'plus',
  'voice-chat': 'plus',
  'wingman-mode': 'plus',
  'relationship-patterns': 'plus',
  'relationship-dna': 'plus',
  'memory-center': 'plus',
  'conversation-coach': 'plus',
  'communication-coach': 'plus',
  'relationship-helper': 'plus',
  wrapped: 'plus',
  'couple-calendar': 'couple',
  wishlist: 'couple',
  scrapbook: 'couple',
  'our-story-movie': 'couple',
  challenges: 'couple',
  'couple-coach': 'couple',
  'long-distance': 'couple',
  'agent-activity': 'couple',
  autopilot: 'couple',
  marketplace: 'couple',
};

/** Free plan: daily AI allowance per kind of tool. Paid plans are unlimited. */
export type UsageBucket = 'chat' | 'decode' | 'replies' | 'confession' | 'other';

export const FREE_DAILY_LIMITS: Record<UsageBucket, number> = { chat: 10, decode: 3, replies: 3, confession: 2, other: 10 };

export const BUCKET_LABEL: Record<UsageBucket, string> = {
  chat: 'AI chat messages',
  decode: 'message decodes',
  replies: 'reply suggestions',
  confession: 'confessions',
  other: 'AI tool uses',
};

/** Which allowance each AI call uses; anything not listed counts as "other". */
export const BUCKET_FOR_METHOD: Record<string, UsageBucket> = {
  generateChatReply: 'chat',
  generateCopilotResponse: 'chat',
  decodeMessage: 'decode',
  generateReplies: 'replies',
  generateConfession: 'confession',
};

/** What the pricing window lists. Keep in sync with PAGE_PLAN and FREE_DAILY_LIMITS. */
export const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    'AI chat: 10 messages a day',
    'Decode a message: 3 a day',
    'Reply suggestions: 3 a day',
    'Confession studio: 2 a day',
    'Love calculator, love cards and couple games',
    'Our Space: link with your partner, memories and streak',
    'Important dates, timeline and check-ins',
  ],
  plus: [
    'Unlimited chat, decodes, replies and confessions',
    'Screenshot analyzer',
    'Roleplay, wingman, conversation and tone coaches',
    'AI memory that remembers your story',
    'Date planner, gift ideas and trip planner',
    'Relationship DNA, patterns and Wrapped',
  ],
  couple: [
    'Everything in Plus for both partners, one payment',
    'Shared calendar, wishlist and scrapbook, synced live',
    'Couples coach and couple challenges',
    'Our story movie and long-distance tools',
    'Love agent, autopilot and experiences',
  ],
};
