import React from 'react';
import { Activity, Dna, ListChecks, Navigation } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const RelationshipCheckInView = lazyView(() => import('../health/RelationshipCheckInView').then((m) => m.RelationshipCheckInView));
const RelationshipDashboardView = lazyView(() => import('../dashboard/RelationshipDashboardView').then((m) => m.RelationshipDashboardView));
const RelationshipPatternsView = lazyView(() => import('../patterns/RelationshipPatternsView').then((m) => m.RelationshipPatternsView));
const RelationshipDNAView = lazyView(() => import('../dna/RelationshipDNAView').then((m) => m.RelationshipDNAView));

const MODES: HubMode[] = [
  { id: 'health-check', label: 'Check-in', icon: <ListChecks />, hint: 'A short weekly check-in on how you two are doing.', render: () => <RelationshipCheckInView /> },
  { id: 'relationship-dashboard', label: 'Dashboard', icon: <Activity />, hint: 'Your relationship at a glance: streaks, check-ins, milestones.', render: () => <RelationshipDashboardView /> },
  { id: 'relationship-patterns', label: 'Patterns', icon: <Navigation />, hint: 'Trends over time and what they suggest.', render: () => <RelationshipPatternsView /> },
  { id: 'relationship-dna', label: 'Relationship DNA', icon: <Dna />, hint: 'Where you match, where you differ and what is worth a conversation.', render: () => <RelationshipDNAView /> },
];

export const InsightsHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="insights"
    title="Check-in & insights"
    subtitle="How are you two doing? Check in, see the dashboard, spot patterns and compare your Relationship DNA."
    icon={<Activity />}
    modes={MODES}
    initialMode={initialMode}
  />
);
