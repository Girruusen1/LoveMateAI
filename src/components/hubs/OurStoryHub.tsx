import React from 'react';
import { BookHeart, BookOpen, Images, MapPinned } from 'lucide-react';
import type { ActiveTab } from '../../types';
import { lazyView } from '../../utils/lazy';
import { HubView, type HubMode } from '../common/HubView';

const TimelineView = lazyView(() => import('../timeline/TimelineView').then((m) => m.TimelineView));
const ScrapbookView = lazyView(() => import('../scrapbook/ScrapbookView').then((m) => m.ScrapbookView));
const OurRealStoryView = lazyView(() => import('../story/OurRealStoryView').then((m) => m.OurRealStoryView));
const AILoveStoryView = lazyView(() => import('../story/AILoveStoryView').then((m) => m.AILoveStoryView));

const MODES: HubMode[] = [
  { id: 'timeline', label: 'Timeline', icon: <MapPinned />, hint: 'Your milestones in order, from the first message onwards.', render: () => <TimelineView /> },
  { id: 'scrapbook', label: 'Scrapbook', icon: <Images />, hint: 'Your moments and photos as a flippable album.', render: () => <ScrapbookView /> },
  { id: 'our-story', label: 'Our real story', icon: <BookHeart />, hint: 'Your real story, told well, in your own words.', render: () => <OurRealStoryView /> },
  { id: 'stories', label: 'AI love story', icon: <BookOpen />, hint: 'A story written for you two, in the style you choose.', render: () => <AILoveStoryView /> },
];

export const OurStoryHub: React.FC<{ initialMode?: ActiveTab }> = ({ initialMode }) => (
  <HubView
    hubId="our-story-hub"
    title="Our story"
    subtitle="Everything you have lived together: the timeline, a scrapbook, your real story told well, and an AI love story."
    icon={<BookHeart />}
    modes={MODES}
    initialMode={initialMode}
  />
);
