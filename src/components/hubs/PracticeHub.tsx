import React from 'react';
import { Headphones, LifeBuoy, MessageCircleHeart } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const RoleplayView = lazyView(() => import('../practice/RoleplayView').then((m) => m.RoleplayView));
const ConversationCoachView = lazyView(() => import('../copilot/ConversationCoachView').then((m) => m.ConversationCoachView));
const RelationshipHelperView = lazyView(() => import('../relationship/RelationshipHelperView').then((m) => m.RelationshipHelperView));

const MODES: HubMode[] = [
  { id: 'roleplay', label: 'Roleplay', icon: <Headphones />, hint: 'Rehearse the conversation with an AI that plays the other person.', render: () => <RoleplayView /> },
  { id: 'conversation-coach', label: 'Conversation coach', icon: <MessageCircleHeart />, hint: 'Get coached through a live conversation, one message at a time.', render: () => <ConversationCoachView /> },
  { id: 'relationship-helper', label: 'Tough moments', icon: <LifeBuoy />, hint: 'Apologies, fights and hard talks, handled with care.', render: () => <RelationshipHelperView /> },
];

export const PracticeHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="practice"
    title="Practice a conversation"
    subtitle="Rehearse before it matters: roleplay the talk, get coached through it, or prepare for a tough moment."
    icon={<Headphones />}
    modes={MODES}
    initialMode={initialMode}
  />
);
