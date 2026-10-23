import React, { useState } from 'react';
import {
  CheckCircle2,
  Dices,
  Globe,
  Heart,
  MapPinned,
  MessageSquare,
  Play,
  Plus,
  Search,
  Sparkles,
  Sprout,
  Star,
  Store,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExperienceCategory, ExperienceItem } from '../../types';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Textarea,
} from '../common/UIPrimitives';

const SESSION_LENGTH = 6;

/** Small prompt bank keyed by category; a pack's title and tags choose the deck and seed the order. */
const PROMPT_BANK: Record<ExperienceCategory | 'generic', string[]> = {
  conversation_packs: [
    'What is one dream you have held back from saying out loud because it sounded unrealistic?',
    'Which small habit of mine makes you feel most loved, and which one quietly annoys you?',
    'What is a belief you had about relationships at 18 that you no longer hold?',
    'When did you last feel truly understood by me? What was happening?',
    'If we could redo one conversation from this year, which one and why?',
    'What is something you want more of from us in the next three months?',
    'Which compliment from me do you replay in your head?',
    'What do you need from me on a hard day that you rarely ask for?',
  ],
  games: [
    'Rapid fire: name three things on my phone home screen without looking.',
    'Guess my answer: my ideal lazy Sunday in five words.',
    'Would I rather: a surprise trip or a surprise party? Explain your guess.',
    'Finish my sentence: "The moment I knew I liked you was..."',
    'Two truths and a lie about my childhood. Catch the lie.',
    'Impersonate how I order food at a restaurant.',
    'Guess which song I would pick as our soundtrack. Then reveal.',
    'Describe our first date using only emojis; partner decodes it.',
  ],
  challenges: [
    'Today: send one specific, unprompted appreciation text before noon.',
    'Today: do one chore the other usually handles, without announcing it.',
    'Today: a ten-minute phone-free check-in. Ask "how is your heart?"',
    'Today: write down one thing you admired about them and read it aloud tonight.',
    'Today: plan one tiny ritual for this week (tea at 9, walk after dinner).',
    'Today: apologise for one small thing you brushed off recently.',
    'Today: ask about one worry they have and only listen, no fixing.',
  ],
  proposals: [
    'Step: list three places that already mean something to you both.',
    'Step: write the one sentence you would say if you only had one.',
    'Step: who needs to be there, who should be surprised later, and why?',
    'Step: pick a backup plan for weather, delays or nerves.',
    'Step: decide how you want the first ten minutes after "yes" to feel.',
    'Step: choose one keepsake from the moment to save in Our Space.',
    'Step: rehearse the words out loud once, then stop rehearsing.',
  ],
  ldr: [
    'Tonight: share the view from your window and describe the day in three words.',
    'Tonight: plan the first meal you will cook together when you reunite.',
    'Tonight: swap one voice note that is just a laugh, no words.',
    'Tonight: pick a song each and listen at the same time on call.',
    'Tonight: tell one small thing from today you would normally forget to mention.',
    'Tonight: count down to the next reunion and name one thing you will do first.',
    'Tonight: ask "what did you need today that distance made harder?"',
  ],
  date_ideas: [
    'Pick a neighbourhood neither of you knows and walk it with no map for an hour.',
    'Cook a dish from the first place you travelled together (or want to).',
    'Each secretly plan one hour of the evening; reveal only when it starts.',
    'Visit a bookshop; pick a book for each other with a note inside.',
    'Recreate your first date photo in the same spot, same pose.',
    'Sunset spot plus a shared playlist you build on the way there.',
    'Try a class together where you are both beginners.',
  ],
  stories: [
    "Chapter 1: how did it start? Tell it from the other person's point of view.",
    'Chapter 2: the moment things got real. What were you each thinking?',
    'Chapter 3: a hard season and the small thing that got you through it.',
    'Chapter 4: an inside joke and the story nobody else understands.',
    'Chapter 5: the quiet ordinary day you would relive.',
    'Chapter 6: the next chapter you want to write together.',
  ],
  anniversary: [
    "Toast: name the year's best shared moment in one sentence each.",
    'Look back: what did you learn about each other this year?',
    'Gratitude: one thing your partner did that you never properly thanked them for.',
    'Tradition: pick one ritual to keep every anniversary from now on.',
    'Forward: one hope for the next year, as specific as you can make it.',
    'Keepsake: write a two-line note to open on your next anniversary.',
  ],
  generic: [
    'What made you smile this week that you have not told me yet?',
    'What is one thing we could do more of together?',
    'Describe me in three words, then explain the hardest one to pick.',
    'What is a memory of us you hope we never forget?',
    'What is something you want to learn or try together this year?',
    'What does a perfect ordinary day with me look like?',
  ],
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Choose SESSION_LENGTH prompts for a pack, seeded by its id/title/tags so each pack has a stable deck. */
function buildSessionPrompts(exp: ExperienceItem): string[] {
  const base = PROMPT_BANK[exp.category] || PROMPT_BANK.generic;
  const lowerTags = exp.tags.map((t) => t.toLowerCase());
  const extras: string[] = [];
  if (lowerTags.some((t) => /spicy|flirt|intimacy/.test(t))) extras.push('Flirty round: what is one thing I do that you find unfairly attractive?');
  if (lowerTags.some((t) => /deep|vulnerab|honest/.test(t))) extras.push('Deep round: what fear about us have you never said out loud?');
  if (lowerTags.some((t) => /fun|banter|laugh|playful/.test(t))) extras.push('Banter round: roast my worst habit lovingly, in under 20 seconds.');
  if (lowerTags.some((t) => /travel|trip|adventure/.test(t))) extras.push('Travel round: the one place you want us to see before anything else.');
  const pool = [...extras, ...base, ...PROMPT_BANK.generic.filter((p) => !base.includes(p))];
  const seed = hashString(`${exp.id}|${exp.title}|${exp.tags.join(',')}`);
  const picked: string[] = [];
  const deck = pool.slice();
  let cursor = seed;
  while (picked.length < SESSION_LENGTH && deck.length) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    const idx = cursor % deck.length;
    picked.push(deck.splice(idx, 1)[0]);
  }
  return picked;
}

export const ExperienceMarketplaceView: React.FC = () => {
  const { marketplaceExperiences, useExperience, submitExperience, user, showToast, addPoints, triggerConfetti } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [activeExpModal, setActiveExpModal] = useState<ExperienceItem | null>(null);
  const [sessionPrompts, setSessionPrompts] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [completedPackIds, setCompletedPackIds] = useState<string[]>([]);

  const startSession = (exp: ExperienceItem) => {
    useExperience(exp.id);
    setSessionPrompts(buildSessionPrompts(exp));
    setPromptIndex(0);
    setSessionFinished(false);
    setActiveExpModal(exp);
  };

  const handleNextPrompt = () => {
    if (!activeExpModal) return;
    if (promptIndex < sessionPrompts.length - 1) {
      setPromptIndex((i) => i + 1);
      return;
    }
    setSessionFinished(true);
    if (!completedPackIds.includes(activeExpModal.id)) {
      setCompletedPackIds((prev) => [...prev, activeExpModal.id]);
      addPoints(30, `Completed "${activeExpModal.title}"`);
      triggerConfetti();
    } else {
      showToast('Pack completed again. Points are awarded once per pack.', 'info');
    }
  };

  // Submission Form State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<ExperienceCategory>('conversation_packs');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [tagsInput, setTagsInput] = useState('Intimacy, Deep Talk');

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All packs', icon: <Sparkles /> },
    { id: 'conversation_packs', label: 'Conversation decks', icon: <MessageSquare /> },
    { id: 'games', label: 'Couple games', icon: <Dices /> },
    { id: 'challenges', label: 'Habit sprints', icon: <Sprout /> },
    { id: 'proposals', label: 'Proposals & milestones', icon: <Heart /> },
    { id: 'ldr', label: 'Long distance', icon: <Globe /> },
    { id: 'date_ideas', label: 'Date adventures', icon: <MapPinned /> },
  ];

  const filteredExperiences = marketplaceExperiences.filter((exp) => {
    const matchesCat = activeCategory === 'all' || exp.category === activeCategory;
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    submitExperience({
      title,
      tagline,
      category,
      description,
      price: 'free',
      creator: {
        id: user?.id || 'usr_1',
        name: user?.name || 'You',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        verified: false,
        bio: 'Community relationship builder.',
      },
      version: '1.0',
      durationMinutes,
      stepsCount: 10,
      tags: tagsInput.split(',').map((t) => t.trim()),
    });

    setTitle('');
    setTagline('');
    setDescription('');
    setSubmitModalOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Store />}
        title="Experiences"
        subtitle="Conversation decks, couple games, proposal roadmaps and date challenges made by relationship experts and creative couples."
        actions={
          <Button variant="primary" onClick={() => setSubmitModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Submit a pack
          </Button>
        }
      />

      {/* Search Bar & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search experiences by theme, long distance, or banter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip key={c.id} selected={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} icon={c.icon}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Experiences Grid */}
      {filteredExperiences.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No experiences found"
          description="Try a different search or category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExperiences.map((exp) => (
            <div
              key={exp.id}
              className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs hover:border-rose-200 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="zinc">{exp.category.replace('_', ' ')}</Badge>
                    {exp.price === 'premium' ? (
                      <Badge variant="purple">Pro</Badge>
                    ) : (
                      <Badge variant="emerald">Free</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-800 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{exp.rating.toFixed(1)}</span>
                    <span className="text-zinc-400 font-normal">({exp.reviewCount})</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-zinc-900 group-hover:text-rose-700 transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{exp.tagline}</p>
                </div>

                <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  {exp.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {exp.tags.slice(0, 3).map((tag, tIdx) => (
                    <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Creator & Start Action */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={exp.creator.avatar}
                    alt={exp.creator.name}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-zinc-800 leading-none truncate">{exp.creator.name}</span>
                      {exp.creator.verified && <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-500">{exp.usageCount.toLocaleString()} plays</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => startSession(exp)}
                  icon={<Play className="w-3 h-3 fill-white" />}
                >
                  Play
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience Active Modal / Preview */}
      {activeExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">{activeExpModal.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveExpModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">{activeExpModal.description}</p>

            {sessionFinished ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2 text-center">
                <h4 className="text-sm font-bold text-emerald-800">Pack complete</h4>
                <p className="text-xs text-zinc-600">
                  You worked through all {sessionPrompts.length} prompts of "{activeExpModal.title}".
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
                <h4 className="text-xs font-bold text-rose-800">
                  Prompt {promptIndex + 1}{' '}
                  <span className="text-rose-400 font-semibold">· {promptIndex + 1} of {sessionPrompts.length}</span>
                </h4>
                <p className="text-sm font-semibold text-zinc-800 italic">"{sessionPrompts[promptIndex]}"</p>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center gap-3 text-xs text-zinc-500">
              <span>Duration: ~{activeExpModal.durationMinutes || 30} mins</span>
              <div className="flex items-center gap-2">
                {!sessionFinished && promptIndex > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setPromptIndex((i) => Math.max(0, i - 1))}>
                    Back
                  </Button>
                )}
                {sessionFinished ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPromptIndex(0);
                        setSessionFinished(false);
                      }}
                    >
                      Play again
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setActiveExpModal(null)}>
                      Done
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleNextPrompt}>
                    {promptIndex < sessionPrompts.length - 1 ? 'Next prompt' : 'Finish pack'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Experience Pack Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> Submit an experience pack
              </h3>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <FieldLabel>Pack title</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 20 Questions for Long Drive Nights"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Tagline</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Playful prompts and spicy hypotheticals"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option value="conversation_packs">Conversation decks</option>
                    <option value="games">Couple games</option>
                    <option value="challenges">Habit sprints</option>
                    <option value="proposals">Proposals & milestones</option>
                    <option value="ldr">Long distance</option>
                    <option value="date_ideas">Date adventures</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Estimated minutes</FieldLabel>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Description and rules</FieldLabel>
                <Textarea
                  rows={3}
                  required
                  placeholder="Describe how couples play or engage with this deck..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel hint="comma-separated">Tags</FieldLabel>
                <Input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit for review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
