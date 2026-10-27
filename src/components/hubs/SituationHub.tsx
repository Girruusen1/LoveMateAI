import React from 'react';
import { FlaskConical, HeartHandshake, Radar, Scan, Target } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const RelationshipSignalsView = lazyView(() => import('../tools/RelationshipSignalsView').then((m) => m.RelationshipSignalsView));
const RelationshipDetectiveView = lazyView(() => import('../detective/RelationshipDetectiveView').then((m) => m.RelationshipDetectiveView));
const CrushAnalyzerView = lazyView(() => import('../crush/CrushAnalyzerView').then((m) => m.CrushAnalyzerView));
const ShouldIConfessView = lazyView(() => import('../confess/ShouldIConfessView').then((m) => m.ShouldIConfessView));
const WhatIfSimulatorView = lazyView(() => import('../whatif/WhatIfSimulatorView').then((m) => m.WhatIfSimulatorView));

const MODES: HubMode[] = [
  { id: 'relationship-signals', label: 'Signals', icon: <Radar />, hint: 'Read the green and amber signals in how they act with you.', render: () => <RelationshipSignalsView /> },
  { id: 'detective', label: 'Detective', icon: <Scan />, hint: 'Lay out what you know, what you are guessing and what would confirm it.', render: () => <RelationshipDetectiveView /> },
  { id: 'crush-analyzer', label: 'Does my crush like me?', icon: <Target />, hint: 'Answer a few questions about how they behave and get an honest read.', render: () => <CrushAnalyzerView /> },
  { id: 'should-confess', label: 'Should I confess?', icon: <HeartHandshake />, hint: 'Weigh timing, signals and risk before you say it.', render: () => <ShouldIConfessView /> },
  { id: 'what-if', label: 'What if?', icon: <FlaskConical />, hint: 'Play out a choice before you make it.', render: () => <WhatIfSimulatorView /> },
];

export const SituationHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="read-situation"
    title="Read the situation"
    subtitle="Step back from one message and look at the whole picture: signals, likely explanations and your next move."
    icon={<Radar />}
    modes={MODES}
    initialMode={initialMode}
  />
);
