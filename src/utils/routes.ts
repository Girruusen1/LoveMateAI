import type { ActiveTab } from '../types';

export const ALL_TABS: ActiveTab[] = [
  'home', 'chat', 'calculator', 'confession', 'reply', 'crush-analyzer', 'should-confess', 'relationship-helper', 'games', 'date-gift', 'stories', 'library', 'profile', 'pro',
  'decode', 'screenshot', 'roleplay', 'couple-mode', 'timeline', 'our-story', 'health-check', 'chemistry-mode', 'what-if', 'voice-chat', 'date-planner', 'message-transformer', 'relationship-signals', 'love-cards', 'important-dates', 'challenges',
  'memory-center', 'relationship-dashboard', 'relationship-patterns', 'detective', 'our-space', 'scrapbook', 'our-story-movie', 'couple-coach', 'long-distance', 'infinite-games', 'conversation-coach', 'reply-copilot', 'communication-coach', 'wrapped', 'relationship-dna', 'wingman-mode', 'gift-intelligence', 'trip-together',
  'copilot', 'agent-activity', 'autopilot', 'couple-calendar', 'wishlist', 'marketplace', 'admin-hub', 'trust-center', 'referrals', 'support',
  'terms', 'privacy', 'refund', 'contact',
];

const TAB_SET = new Set<string>(ALL_TABS);

/** "#/decode" -> "decode"; unknown or empty -> null */
export function hashToTab(hash: string): ActiveTab | null {
  const id = hash.replace(/^#\/?/, '').split('?')[0];
  return TAB_SET.has(id) ? (id as ActiveTab) : null;
}

export function tabToHash(tab: ActiveTab): string {
  return tab === 'home' ? '' : `#/${tab}`;
}
