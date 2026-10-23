import React, { useState } from 'react';
import {
  BookHeart,
  Coffee,
  Gem,
  Heart,
  Laugh,
  Mail,
  MessageSquare,
  Palette,
  Plane,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { TimelineMilestone } from '../../types';
import {
  Button,
  Chip,
  EmptyState,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from '../common/UIPrimitives';

export const TimelineView: React.FC = () => {
  const { timelineMilestones, addMilestone, deleteMilestone, addPoints, showToast, triggerConfetti, setActiveTab } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState('October 2026');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TimelineMilestone['type']>('first_date');
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // `emoji` is stored on the milestone record (TimelineMilestone.icon); `icon` is the lucide element used in the picker.
  const milestoneTypes: { id: TimelineMilestone['type']; label: string; emoji: string; icon: React.ReactNode }[] = [
    { id: 'first_met', label: 'First met', emoji: '☕', icon: <Coffee /> },
    { id: 'first_convo', label: 'First convo', emoji: '💬', icon: <MessageSquare /> },
    { id: 'first_date', label: 'First date', emoji: '🎨', icon: <Palette /> },
    { id: 'first_trip', label: 'First trip', emoji: '✈️', icon: <Plane /> },
    { id: 'confession', label: 'First confession', emoji: '💌', icon: <Mail /> },
    { id: 'i_love_you', label: 'First "I love you"', emoji: '❤️', icon: <Heart /> },
    { id: 'funny', label: 'Funny memory', emoji: '😂', icon: <Laugh /> },
    { id: 'anniversary', label: 'Anniversary', emoji: '💍', icon: <Gem /> },
    { id: 'custom', label: 'Custom milestone', emoji: '✨', icon: <Sparkles /> },
  ];

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a milestone title', 'info');
      return;
    }

    const selectedTypeObj = milestoneTypes.find((m) => m.id === type);
    addMilestone({
      date: date || 'Recent',
      title,
      description,
      type,
      icon: selectedTypeObj?.emoji || '❤️',
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleSummarizeJourney = async () => {
    setIsSummarizing(true);
    try {
      const story = await AIService.summarizeTimeline(
        timelineMilestones.map((m) => ({ title: m.title, date: m.date }))
      );
      setSummary(story);
      addPoints(15, 'Summarized Journey with AI');
      triggerConfetti();
      showToast('Journey summarized into a cohesive story ❤️', 'love');
    } catch (e) {
      showToast('Error summarizing journey', 'info');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Heart />}
        title="Our timeline"
        subtitle="A private timeline of the milestones you have shared together."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleSummarizeJourney}
              disabled={timelineMilestones.length === 0}
              loading={isSummarizing}
              icon={<Sparkles className="w-4 h-4 text-rose-500" />}
            >
              Summarize journey
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add milestone
            </Button>
          </>
        }
      />

      {/* AI Journey Summary Card */}
      {summary && (
        <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Journey summary
            </span>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('our-story')} icon={<BookHeart className="w-3.5 h-3.5" />}>
              Turn into a story book
            </Button>
          </div>
          <p className="text-sm text-zinc-800 font-serif leading-relaxed italic">"{summary}"</p>
        </div>
      )}

      {/* Milestone List */}
      {timelineMilestones.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-6 h-6" />}
          title="No milestones yet"
          description="Add your first meeting, first date or any moment that matters to you both."
          actionLabel="Add milestone"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-rose-200/80 space-y-6 my-2">
          {timelineMilestones.map((m) => (
            <div key={m.id} className="relative">
              {/* Timeline node icon (stored milestone content) */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-9 h-9 rounded-full bg-white border-2 border-rose-400 text-base flex items-center justify-center shadow-2xs">
                {m.icon || '❤️'}
              </div>

              {/* Content card */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs hover:border-rose-200 transition-all space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                    {m.date}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteMilestone(m.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete milestone"
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-zinc-900">{m.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-zinc-900">Add milestone</h3>

            <form onSubmit={handleCreateMilestone} className="space-y-3.5">
              <div>
                <FieldLabel>Milestone type</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {milestoneTypes.map((mt) => (
                    <Chip key={mt.id} selected={type === mt.id} onClick={() => setType(mt.id)} icon={mt.icon}>
                      {mt.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. October 14, 2026 or Spring 2026"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. First time you made me homemade pasta"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  rows={2}
                  placeholder="What was said, how did it feel, or why does it matter to you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save milestone
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
