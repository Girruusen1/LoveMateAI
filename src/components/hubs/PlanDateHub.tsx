import React from 'react';
import { Gift, Sparkles, Wine } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const DatePlannerView = lazyView(() => import('../dateplanner/DatePlannerView').then((m) => m.DatePlannerView));
const DateGiftGeneratorView = lazyView(() => import('../dategift/DateGiftGeneratorView').then((m) => m.DateGiftGeneratorView));
const GiftIntelligenceView = lazyView(() => import('../dategift/GiftIntelligenceView').then((m) => m.GiftIntelligenceView));

const MODES: HubMode[] = [
  { id: 'date-planner', label: 'Date plan', icon: <Wine />, hint: 'A full plan for your city, budget and mood, stop by stop.', render: () => <DatePlannerView /> },
  { id: 'date-gift', label: 'Date & gift ideas', icon: <Sparkles />, hint: 'Quick ideas for a date or a gift when you need inspiration.', render: () => <DateGiftGeneratorView /> },
  { id: 'gift-intelligence', label: 'Gift intelligence', icon: <Gift />, hint: 'Gifts matched to their personality and what they have mentioned.', flag: 'gift_intelligence_v2', render: () => <GiftIntelligenceView /> },
];

export const PlanDateHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="plan-date"
    title="Date & gift planner"
    subtitle="Plan a date step by step, get quick ideas for dates and gifts, or find a gift that really fits them."
    icon={<Gift />}
    modes={MODES}
    initialMode={initialMode}
  />
);
