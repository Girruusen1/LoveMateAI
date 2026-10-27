import type { ActiveTab } from '../types';

/**
 * Pages that exist on their own: the hubs, the standalone tools, account pages and public pages.
 * Old per-tool ids are not listed here; they live in ALIASES and open a hub in the right mode.
 */
export const ALL_TABS: ActiveTab[] = [
  'home', 'chat', 'copilot', 'voice-chat', 'pro',
  // Hubs
  'understand-message', 'read-situation', 'help-reply', 'plan-date', 'practice', 'insights', 'couple', 'our-story-hub',
  // Standalone tools
  'confession', 'love-cards', 'trip-together', 'important-dates', 'couple-calendar', 'wishlist',
  'wingman-mode', 'memory-center', 'our-space', 'couple-coach', 'long-distance', 'wrapped',
  // Jyotish
  'kundli', 'my-kundli', 'rashifal', 'calculator',
  // Account, support, admin
  'profile', 'notification-settings', 'referrals', 'support', 'trust-center', 'admin-hub',
  // Legal / business pages
  'terms', 'privacy', 'refund', 'contact',
];

/** Where an old tool id goes now: the hub that holds it and the mode to open it in. `mode` is the old id itself. */
export type TabAlias = { tab: ActiveTab; mode?: ActiveTab };

export const ALIASES: Partial<Record<ActiveTab, TabAlias>> = {
  // Decode a message
  decode: { tab: 'understand-message', mode: 'decode' },
  screenshot: { tab: 'understand-message', mode: 'screenshot' },
  // Read the situation
  'relationship-signals': { tab: 'read-situation', mode: 'relationship-signals' },
  detective: { tab: 'read-situation', mode: 'detective' },
  'crush-analyzer': { tab: 'read-situation', mode: 'crush-analyzer' },
  'should-confess': { tab: 'read-situation', mode: 'should-confess' },
  'what-if': { tab: 'read-situation', mode: 'what-if' },
  // Help me reply
  reply: { tab: 'help-reply', mode: 'reply' },
  'reply-copilot': { tab: 'help-reply', mode: 'reply-copilot' },
  'message-transformer': { tab: 'help-reply', mode: 'message-transformer' },
  'communication-coach': { tab: 'help-reply', mode: 'communication-coach' },
  // Date & gift planner
  'date-planner': { tab: 'plan-date', mode: 'date-planner' },
  'date-gift': { tab: 'plan-date', mode: 'date-gift' },
  'gift-intelligence': { tab: 'plan-date', mode: 'gift-intelligence' },
  // Practice a conversation
  roleplay: { tab: 'practice', mode: 'roleplay' },
  'conversation-coach': { tab: 'practice', mode: 'conversation-coach' },
  'relationship-helper': { tab: 'practice', mode: 'relationship-helper' },
  // Check-in & insights
  'health-check': { tab: 'insights', mode: 'health-check' },
  'relationship-dashboard': { tab: 'insights', mode: 'relationship-dashboard' },
  'relationship-patterns': { tab: 'insights', mode: 'relationship-patterns' },
  'relationship-dna': { tab: 'insights', mode: 'relationship-dna' },
  // Couple mode
  'couple-mode': { tab: 'couple', mode: 'couple-mode' },
  games: { tab: 'couple', mode: 'games' },
  'infinite-games': { tab: 'couple', mode: 'infinite-games' },
  challenges: { tab: 'couple', mode: 'challenges' },
  'chemistry-mode': { tab: 'couple', mode: 'couple-mode' },
  // Our story
  timeline: { tab: 'our-story-hub', mode: 'timeline' },
  scrapbook: { tab: 'our-story-hub', mode: 'scrapbook' },
  'our-story': { tab: 'our-story-hub', mode: 'our-story' },
  stories: { tab: 'our-story-hub', mode: 'stories' },
  'our-story-movie': { tab: 'our-story-hub', mode: 'timeline' },
  // Retired pages: the link still works and lands on home.
  marketplace: { tab: 'home' },
  'agent-activity': { tab: 'home' },
  autopilot: { tab: 'home' },
  // Saved items now live inside the tool that made them (confessions, replies, cards...).
  library: { tab: 'home' },
};

/** Every old id that still resolves (the keys of ALIASES). */
export const LEGACY_TABS = Object.keys(ALIASES) as ActiveTab[];

/** Old ids whose page no longer exists; they land on home. */
export const RETIRED_TABS = new Set<ActiveTab>(LEGACY_TABS.filter((t) => ALIASES[t]?.tab === 'home'));

const TAB_SET = new Set<string>([...ALL_TABS, ...LEGACY_TABS]);

/** The page to render for a tab: hubs resolve to themselves, old tool ids to their hub plus the mode to open. */
export function resolveTab(tab: ActiveTab): { tab: ActiveTab; mode?: ActiveTab } {
  return ALIASES[tab] ?? { tab };
}

/**
 * The admin dashboard lives at a secret address (VITE_ADMIN_PATH, e.g. "ops-7f3k9q" -> "#/ops-7f3k9q")
 * instead of "#/admin-hub". Without the setting there is no admin address at all. The address only hides
 * the page; the server still checks that the signed-in account is in ADMIN_EMAILS before returning data.
 */
const ADMIN_TAB: ActiveTab = 'admin-hub';
const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH as string | undefined)?.trim() || null;

/** "#/decode" -> "decode"; unknown or empty -> null. Old tool ids are returned as-is so the hub knows which mode to open. */
export function hashToTab(hash: string): ActiveTab | null {
  const id = hash.replace(/^#\/?/, '').split('?')[0];
  if (id === ADMIN_TAB) return null;
  if (ADMIN_PATH && id === ADMIN_PATH) return ADMIN_TAB;
  return TAB_SET.has(id) ? (id as ActiveTab) : null;
}

/** "#/understand-message?mode=screenshot" -> "screenshot"; none -> null */
export function hashToMode(hash: string): string | null {
  const query = hash.split('?')[1];
  if (!query) return null;
  const mode = new URLSearchParams(query).get('mode');
  return mode && mode.trim() ? mode.trim() : null;
}

export function tabToHash(tab: ActiveTab): string {
  if (tab === ADMIN_TAB) return ADMIN_PATH ? `#/${ADMIN_PATH}` : '';
  return tab === 'home' ? '' : `#/${tab}`;
}
