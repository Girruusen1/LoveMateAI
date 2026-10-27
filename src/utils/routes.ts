import type { ActiveTab } from '../types';

export const ALL_TABS: ActiveTab[] = [
  'home', 'chat', 'calculator', 'confession', 'reply', 'crush-analyzer', 'should-confess', 'relationship-helper', 'games', 'date-gift', 'stories', 'library', 'profile', 'pro',
  'decode', 'screenshot', 'roleplay', 'couple-mode', 'timeline', 'our-story', 'health-check', 'chemistry-mode', 'what-if', 'voice-chat', 'date-planner', 'message-transformer', 'relationship-signals', 'love-cards', 'important-dates', 'challenges',
  'memory-center', 'relationship-dashboard', 'relationship-patterns', 'detective', 'our-space', 'scrapbook', 'our-story-movie', 'couple-coach', 'long-distance', 'infinite-games', 'conversation-coach', 'reply-copilot', 'communication-coach', 'wrapped', 'relationship-dna', 'wingman-mode', 'gift-intelligence', 'trip-together',
  'copilot', 'agent-activity', 'autopilot', 'couple-calendar', 'wishlist', 'marketplace', 'admin-hub', 'trust-center', 'referrals', 'support', 'notification-settings',
  'kundli', 'my-kundli', 'rashifal',
  'terms', 'privacy', 'refund', 'contact',
];

const TAB_SET = new Set<string>(ALL_TABS);

/**
 * The admin dashboard lives at a secret address (VITE_ADMIN_PATH, e.g. "ops-7f3k9q" -> "#/ops-7f3k9q")
 * instead of "#/admin-hub". Without the setting there is no admin address at all. The address only hides
 * the page; the server still checks that the signed-in account is in ADMIN_EMAILS before returning data.
 */
const ADMIN_TAB: ActiveTab = 'admin-hub';
const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH as string | undefined)?.trim() || null;

/** "#/decode" -> "decode"; unknown or empty -> null */
export function hashToTab(hash: string): ActiveTab | null {
  const id = hash.replace(/^#\/?/, '').split('?')[0];
  if (id === ADMIN_TAB) return null;
  if (ADMIN_PATH && id === ADMIN_PATH) return ADMIN_TAB;
  return TAB_SET.has(id) ? (id as ActiveTab) : null;
}

export function tabToHash(tab: ActiveTab): string {
  if (tab === ADMIN_TAB) return ADMIN_PATH ? `#/${ADMIN_PATH}` : '';
  return tab === 'home' ? '' : `#/${tab}`;
}
