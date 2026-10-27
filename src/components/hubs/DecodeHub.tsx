import React from 'react';
import { Camera, MessageSquareText, Search } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const DecodeThisView = lazyView(() => import('../tools/DecodeThisView').then((m) => m.DecodeThisView));
const ScreenshotAnalyzerView = lazyView(() => import('../tools/ScreenshotAnalyzerView').then((m) => m.ScreenshotAnalyzerView));

const MODES: HubMode[] = [
  { id: 'decode', label: 'Message', icon: <MessageSquareText />, hint: 'Paste one text and see its tone, what it might mean and how to reply.', render: () => <DecodeThisView /> },
  { id: 'screenshot', label: 'Screenshot', icon: <Camera />, hint: 'Upload a chat screenshot to read the whole exchange at once.', render: () => <ScreenshotAnalyzerView /> },
];

export const DecodeHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="understand-message"
    title="Decode a message"
    subtitle="A text or a whole chat screenshot: see the tone, what it might mean and what not to assume."
    icon={<Search />}
    modes={MODES}
    initialMode={initialMode}
  />
);
