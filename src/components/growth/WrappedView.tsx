import React, { useMemo, useState } from 'react';
import {
  Camera,
  Download,
  Heart,
  MessageCircle,
  Milestone,
  Share2,
  Sparkles,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoveMateWrapped } from '../../types';
import { Button, Card, PageContainer } from '../common/UIPrimitives';

const DAY_MS = 24 * 60 * 60 * 1000;

const MEMORY_CATEGORY_LABELS: Record<string, string> = {
  personal: 'Getting to know each other',
  relationship: 'Your relationship',
  preferences: 'Likes & preferences',
  memories: 'Shared moments',
  goals: 'Goals & plans',
  communication: 'Communication',
  important_dates: 'Important dates',
};

/** Parses the loose date strings stored across the app ("Sep 18, 2026", "2026-10-22", "Today"). */
const parseLooseDate = (value?: string): Date | null => {
  if (!value) return null;
  const lower = value.trim().toLowerCase();
  if (lower === 'today' || lower === 'just now') return new Date();
  if (lower === 'yesterday') return new Date(Date.now() - DAY_MS);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Returns the key with the highest count, or null when every count is zero. */
const topEntry = (counts: Record<string, number>): string | null => {
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const WrappedView: React.FC = () => {
  const {
    user,
    coupleStreak,
    sharedMemories,
    timelineMilestones,
    growthChallenges,
    userMemories,
    savedChats,
    savedConfessions,
    savedLoveCards,
    setActiveTab,
    openShareModal,
    triggerConfetti,
    showToast,
  } = useApp();

  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual');

  const partnerName = user?.partnerName || 'your partner';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  const challengeDaysDone = growthChallenges.reduce(
    (sum, c) => sum + c.days.filter((d) => d.completed).length,
    0
  );

  // Anything the user has actually created. Streak alone doesn't count as activity.
  const totalActivity =
    sharedMemories.length +
    timelineMilestones.length +
    challengeDaysDone +
    userMemories.length +
    savedChats.length +
    savedConfessions.length +
    savedLoveCards.length;
  const hasActivity = totalActivity > 0;

  // Build the Wrapped summary from the user's own data for the selected period.
  const wrapped = useMemo<LoveMateWrapped>(() => {
    const inPeriod = (value?: string) => {
      const d = parseLooseDate(value);
      // Undated items still belong to the annual view; monthly needs a real date.
      if (!d) return period === 'annual';
      if (d.getFullYear() !== year) return false;
      return period === 'annual' || d.getMonth() === month;
    };

    const periodMemories = sharedMemories.filter((m) => inPeriod(m.date));
    const periodMilestones = timelineMilestones.filter((m) => inPeriod(m.date));
    const finishedChallenges = growthChallenges.filter((c) => c.days.length > 0 && c.days.every((d) => d.completed));

    // Days connected: since the earliest dated milestone, otherwise since joining LoveMate.
    const milestoneDates = timelineMilestones
      .map((m) => parseLooseDate(m.date))
      .filter((d): d is Date => d !== null && d.getTime() <= Date.now());
    const startDate =
      milestoneDates.length > 0
        ? new Date(Math.min(...milestoneDates.map((d) => d.getTime())))
        : parseLooseDate(user?.joinedAt);
    const daysConnected = startDate ? Math.max(1, Math.floor((Date.now() - startDate.getTime()) / DAY_MS) + 1) : 0;

    // Most discussed theme = the category LoveMate has learned most about.
    const categoryCounts: Record<string, number> = {};
    userMemories.forEach((m) => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });
    const tagCounts: Record<string, number> = {};
    sharedMemories.forEach((m) => m.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }));
    const topCategory = topEntry(categoryCounts);
    const topTag = topEntry(tagCounts);
    const mostDiscussedTopic = topCategory
      ? MEMORY_CATEGORY_LABELS[topCategory] || topCategory
      : topTag
        ? `#${topTag}`
        : '';

    // Most used feature = whichever tool holds the most of the user's saved work.
    const featureCounts: Record<string, number> = {
      'AI chat': savedChats.length,
      'Confession writer': savedConfessions.length,
      'Shared memories': sharedMemories.length,
      'Relationship timeline': timelineMilestones.length,
      'Growth challenges': challengeDaysDone,
      'Love cards': savedLoveCards.length,
    };
    const mostUsedFeature = topEntry(featureCounts) || '';

    // Favorite activity = most-progressed challenge, else the most common memory tag.
    const topChallenge = [...growthChallenges]
      .map((c) => ({ title: c.title, done: c.days.filter((d) => d.completed).length }))
      .filter((c) => c.done > 0)
      .sort((a, b) => b.done - a.done)[0];
    const favoriteActivity = topChallenge ? topChallenge.title : topTag ? `#${topTag}` : '';

    const memoriesCreated = periodMemories.length + periodMilestones.length;

    const highlightMoments = [
      ...[...periodMilestones]
        .sort((a, b) => (parseLooseDate(b.date)?.getTime() || 0) - (parseLooseDate(a.date)?.getTime() || 0))
        .map((m) => m.title),
      ...periodMemories.map((m) => m.title),
      ...finishedChallenges.map((c) => `Finished the "${c.title}" challenge`),
      ...(coupleStreak >= 3 ? [`Hit a ${coupleStreak}-day couple connection streak`] : []),
    ]
      .filter((t) => t && t.trim())
      .slice(0, 6);

    const parts: string[] = [];
    if (memoriesCreated > 0) parts.push(memoriesCreated === 1 ? '1 memory' : `${memoriesCreated} memories`);
    if (challengeDaysDone > 0) parts.push(plural(challengeDaysDone, 'challenge day'));
    if (savedChats.length > 0) parts.push(plural(savedChats.length, 'saved conversation'));
    const periodWord = period === 'annual' ? `${year}` : monthName;
    const yearInOneSentence =
      parts.length > 0
        ? `${periodWord} so far: ${parts.join(', ')}, written by you two, one moment at a time.`
        : `${periodWord} is still a blank page, ready for your next moment together.`;

    return {
      year,
      period,
      monthName: period === 'monthly' ? monthName : undefined,
      mostDiscussedTopic,
      mostUsedFeature,
      favoriteActivity,
      challengesCompleted: finishedChallenges.length,
      memoriesCreated,
      daysConnected,
      yearInOneSentence,
      highlightMoments,
    };
  }, [
    period,
    year,
    month,
    monthName,
    user?.joinedAt,
    sharedMemories,
    timelineMilestones,
    growthChallenges,
    userMemories,
    savedChats,
    savedConfessions,
    savedLoveCards,
    challengeDaysDone,
    coupleStreak,
  ]);

  const handleShare = () => {
    triggerConfetti();
    openShareModal({
      type: 'wrapped',
      data: wrapped,
    });
  };

  const handleDownloadCard = () => {
    triggerConfetti();
    const label = wrapped.monthName ? `${wrapped.monthName} ${wrapped.year}` : `${wrapped.year}`;
    const textContent = `❤️ LOVEMATE WRAPPED ${label} ❤️\n\n` +
      `Partners: ${user?.name || 'You'} & ${partnerName}\n` +
      `Days Connected: ${wrapped.daysConnected} Days\n` +
      `Couple Streak: ${coupleStreak} Days\n` +
      `Challenges Completed: ${wrapped.challengesCompleted}\n` +
      `Memories Created: ${wrapped.memoriesCreated}\n` +
      (wrapped.favoriteActivity ? `Favorite Shared Activity: ${wrapped.favoriteActivity}\n` : '') +
      (wrapped.highlightMoments.length > 0
        ? `\nHighlights:\n${wrapped.highlightMoments.map((h) => `• ${h}`).join('\n')}\n`
        : '') +
      `\nOur ${wrapped.monthName ? 'Month' : 'Year'} In One Sentence:\n"${wrapped.yearInOneSentence}"\n\n` +
      `Made with LoveMate`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoveMate_Wrapped_${label.replace(' ', '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('LoveMate Wrapped downloaded! 📥', 'success');
  };

  // Brand-new users get a warm nudge instead of an empty keepsake card.
  if (!hasActivity) {
    const starters = [
      { label: 'Add a milestone', tab: 'timeline' as const, icon: <Milestone className="w-3.5 h-3.5" /> },
      { label: 'Save a memory', tab: 'our-space' as const, icon: <Camera className="w-3.5 h-3.5" /> },
      { label: 'Start a challenge', tab: 'challenges' as const, icon: <Target className="w-3.5 h-3.5" /> },
      { label: 'Chat with LoveMate', tab: 'chat' as const, icon: <MessageCircle className="w-3.5 h-3.5" /> },
    ];

    return (
      <PageContainer narrow>
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">LoveMate Wrapped {year}</h1>
          <p className="text-sm text-rose-100 mt-1 max-w-xl">
            Your personal recap of conversations, milestones and memories made together.
          </p>
        </div>

        <Card className="text-center space-y-4 py-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center border border-rose-100">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 tracking-tight">Your Wrapped is waiting to be written</h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Your Wrapped fills up as you use LoveMate. Add milestones, save memories with {partnerName} and
              complete challenges, and we'll turn them into a keepsake you can share.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {starters.map((s) => (
              <Button key={s.tab} variant="secondary" size="sm" icon={s.icon} onClick={() => setActiveTab(s.tab)}>
                {s.label}
              </Button>
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      {/* Celebratory hero */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              LoveMate Wrapped {wrapped.year}
            </h1>
            <p className="text-sm text-rose-100 mt-1 max-w-xl">
              Celebrate every late-night conversation, milestone conquered and shared memory created together.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Share2 className="w-3.5 h-3.5" />} onClick={handleShare}>
              Share
            </Button>
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleDownloadCard}>
              Download
            </Button>
          </div>
        </div>

        {/* Period selector */}
        <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setPeriod('annual')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
              period === 'annual' ? 'bg-white text-rose-600' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Annual ({year})
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
              period === 'monthly' ? 'bg-white text-rose-600' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {monthName} {year}
          </button>
        </div>
      </div>

      {/* Keepsake card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-zinc-800 space-y-8 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse-subtle" />
            <span className="font-bold text-base tracking-tight text-white">
              {user?.name || 'You'} & {partnerName}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            LOVE ARCHIVE #{wrapped.year}
          </span>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Days connected</span>
            <p className="text-3xl font-bold text-white">{wrapped.daysConnected}</p>
            <span className="text-[10px] text-emerald-400 font-bold">And counting</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Memories created</span>
            <p className="text-3xl font-bold text-rose-400">{wrapped.memoriesCreated}</p>
            <span className="text-[10px] text-zinc-400">In timeline and album</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Challenges finished</span>
            <p className="text-3xl font-bold text-amber-400">{wrapped.challengesCompleted}</p>
            <span className="text-[10px] text-zinc-400">{plural(challengeDaysDone, 'day')} completed</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Couple streak</span>
            <p className="text-3xl font-bold text-purple-400">{coupleStreak}d</p>
            <span className="text-[10px] text-zinc-400">Daily connection</span>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-700/60 space-y-2">
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Most discussed theme</span>
            <p className="text-base font-bold text-white">{wrapped.mostDiscussedTopic || 'Still taking shape'}</p>
            <p className="text-zinc-400 leading-relaxed">
              {wrapped.mostDiscussedTopic
                ? 'The topic LoveMate has learned the most about from your memories and moments.'
                : 'Add a few memories in the Memory center and your recurring theme will appear here.'}
            </p>
          </div>

          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-700/60 space-y-2">
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Favorite shared tool</span>
            <p className="text-base font-bold text-white">{wrapped.mostUsedFeature || 'Still taking shape'}</p>
            <p className="text-zinc-400 leading-relaxed">
              {wrapped.favoriteActivity
                ? `Favorite activity: ${wrapped.favoriteActivity}.`
                : 'The LoveMate feature where you have saved the most moments so far.'}
            </p>
          </div>
        </div>

        {/* Period in one sentence */}
        <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-pink-950/40 p-6 rounded-2xl border border-rose-500/30 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
            Your {period === 'annual' ? 'year' : 'month'} in one sentence
          </span>
          <p className="text-sm sm:text-base font-serif italic text-rose-100 max-w-xl mx-auto leading-relaxed">
            "{wrapped.yearInOneSentence}"
          </p>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top shared highlights</h4>
          {wrapped.highlightMoments.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No highlights for this period yet. Milestones and shared memories you add will show up here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {wrapped.highlightMoments.map((mom, i) => (
                <div key={i} className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40 flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold text-zinc-200">{mom}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
