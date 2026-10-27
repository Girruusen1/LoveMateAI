import React from 'react';
import { Dices, Gamepad2, Sprout, Users } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const CoupleModeView = lazyView(() => import('../couple/CoupleModeView').then((m) => m.CoupleModeView));
const CoupleGamesView = lazyView(() => import('../games/CoupleGamesView').then((m) => m.CoupleGamesView));
const InfiniteGamesView = lazyView(() => import('../games/InfiniteGamesView').then((m) => m.InfiniteGamesView));
const RelationshipChallengesView = lazyView(() => import('../challenges/RelationshipChallengesView').then((m) => m.RelationshipChallengesView));

const MODES: HubMode[] = [
  { id: 'couple-mode', label: 'Quiz & room', icon: <Users />, hint: 'Answer sealed questions on two phones and reveal them together.', render: () => <CoupleModeView /> },
  { id: 'games', label: 'Games', icon: <Gamepad2 />, hint: 'Quick games for two: truth or dare, would you rather and more.', render: () => <CoupleGamesView /> },
  { id: 'infinite-games', label: 'Infinite games', icon: <Dices />, hint: 'AI makes a new game every time, tuned to you two.', render: () => <InfiniteGamesView /> },
  { id: 'challenges', label: 'Challenges', icon: <Sprout />, hint: 'Small weekly challenges that build good habits together.', render: () => <RelationshipChallengesView /> },
];

export const CoupleHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="couple"
    title="Couple mode"
    subtitle="Play together: the sealed quiz and couple room, games for two, endless AI games and weekly challenges."
    icon={<Gamepad2 />}
    modes={MODES}
    initialMode={initialMode}
  />
);
