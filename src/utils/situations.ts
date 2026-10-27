import type { ActiveTab, Situation } from '../types';

/**
 * "What's your situation?" The answer picks the five tools a person sees first, so a new user
 * gets something useful in the first minute instead of a menu of twenty tools.
 */
export interface SituationInfo {
  id: Situation;
  emoji: string;
  label: string;
  description: string;
  /** Shown first on the home page, in this order. Tab ids may be hubs or old tool ids (both resolve). */
  tools: { tab: ActiveTab; label: string; why: string }[];
}

export const SITUATIONS: SituationInfo[] = [
  {
    id: 'crush',
    emoji: '🫣',
    label: 'I have a crush',
    description: 'Not together yet. Reading signals, finding the words.',
    tools: [
      { tab: 'crush-analyzer', label: 'Does my crush like me?', why: 'Read the signals honestly' },
      { tab: 'decode', label: 'Decode a message', why: 'What did that text really mean?' },
      { tab: 'reply', label: 'Help me reply', why: 'The right reply, in your voice' },
      { tab: 'should-confess', label: 'Should I confess?', why: 'Timing, risks and a gentle script' },
      { tab: 'confession', label: 'Confession studio', why: 'When you are ready to say it' },
    ],
  },
  {
    id: 'dating',
    emoji: '💞',
    label: "We're dating",
    description: 'Early days or a few months in. Keep it fun and growing.',
    tools: [
      { tab: 'decode', label: 'Decode a message', why: 'Clear up mixed signals fast' },
      { tab: 'help-reply', label: 'Help me reply', why: 'Playful, warm or honest, your call' },
      { tab: 'plan-date', label: 'Date & gift planner', why: 'Plans that fit your city and budget' },
      { tab: 'couple', label: 'Couple mode', why: 'Quizzes and games for two phones' },
      { tab: 'calculator', label: 'Love calculator', why: 'A fun one to share' },
    ],
  },
  {
    id: 'long_distance',
    emoji: '🌏',
    label: 'Long distance',
    description: 'Different cities or countries. Staying close across the miles.',
    tools: [
      { tab: 'long-distance', label: 'Long distance', why: 'Time zones, countdown and virtual dates' },
      { tab: 'couple-calendar', label: 'Couple calendar', why: 'Shared plans and the next reunion' },
      { tab: 'couple', label: 'Couple mode', why: 'Daily questions and games together' },
      { tab: 'our-space', label: 'Our Space', why: 'Memories and goals in one place' },
      { tab: 'chat', label: 'AI chat', why: 'Talk it through any time' },
    ],
  },
  {
    id: 'engaged',
    emoji: '💍',
    label: 'Engaged or getting there',
    description: 'Families, dates and big decisions ahead.',
    tools: [
      { tab: 'kundli', label: 'Kundli Milan', why: 'Guna score and Manglik check, explained calmly' },
      { tab: 'important-dates', label: 'Important dates', why: 'Never miss the days that matter' },
      { tab: 'plan-date', label: 'Date & gift planner', why: 'Gifts and plans for every occasion' },
      { tab: 'couple-coach', label: 'Couples coach', why: 'Money, families, future: talk it out' },
      { tab: 'our-space', label: 'Our Space', why: 'Shared goals and your story so far' },
    ],
  },
  {
    id: 'married',
    emoji: '🏡',
    label: 'Married',
    description: 'Keeping the spark and handling real life together.',
    tools: [
      { tab: 'couple-coach', label: 'Couples coach', why: 'Guided talks for busy weeks' },
      { tab: 'insights', label: 'Check-in & insights', why: 'How are we doing, honestly?' },
      { tab: 'couple', label: 'Couple mode', why: 'Challenges and games that reconnect' },
      { tab: 'important-dates', label: 'Important dates', why: 'Anniversaries, birthdays, reminders' },
      { tab: 'our-space', label: 'Our Space', why: 'Memories, goals and the bucket list' },
    ],
  },
  {
    id: 'complicated',
    emoji: '🌧️',
    label: "It's complicated",
    description: 'Mixed signals, a rough patch or figuring out what you want.',
    tools: [
      { tab: 'read-situation', label: 'Read the situation', why: 'Signals, red flags and what if' },
      { tab: 'practice', label: 'Practice a conversation', why: 'Rehearse the hard talk first' },
      { tab: 'chat', label: 'AI chat', why: 'A calm, private sounding board' },
      { tab: 'insights', label: 'Check-in & insights', why: 'See the pattern, not just the moment' },
      { tab: 'couple-coach', label: 'Couples coach', why: 'If you both want to work on it' },
    ],
  },
];

export const situationInfo = (id?: Situation | null) => SITUATIONS.find((s) => s.id === id) ?? null;
