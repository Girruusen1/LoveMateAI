import React from 'react';
import { Gauge, MessageSquare, MessageSquareText, Wand2 } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const ReplyGeneratorView = lazyView(() => import('../reply/ReplyGeneratorView').then((m) => m.ReplyGeneratorView));
const ReplyCopilotView = lazyView(() => import('../copilot/ReplyCopilotView').then((m) => m.ReplyCopilotView));
const MessageTransformerView = lazyView(() => import('../tools/MessageTransformerView').then((m) => m.MessageTransformerView));
const CommunicationCoachView = lazyView(() => import('../coach/CommunicationCoachView').then((m) => m.CommunicationCoachView));

const MODES: HubMode[] = [
  { id: 'reply', label: 'Quick replies', icon: <MessageSquare />, hint: 'Paste their message and pick from replies in different vibes.', render: () => <ReplyGeneratorView /> },
  { id: 'reply-copilot', label: 'Reply copilot', icon: <MessageSquareText />, hint: 'Work through a tricky reply step by step with context.', render: () => <ReplyCopilotView /> },
  { id: 'message-transformer', label: 'Make this better', icon: <Wand2 />, hint: 'Already have a draft? Make it shorter, braver or less cringe.', render: () => <MessageTransformerView /> },
  { id: 'communication-coach', label: 'Tone check', icon: <Gauge />, hint: 'Check how your message will land before you send it.', render: () => <CommunicationCoachView /> },
];

export const ReplyHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="help-reply"
    title="Help me reply"
    subtitle="Find the words: quick options, a guided reply, a polish of your own draft, or a tone check before you hit send."
    icon={<MessageSquare />}
    modes={MODES}
    initialMode={initialMode}
  />
);
