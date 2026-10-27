import React, { useState } from 'react';
import {
  Download,
  Heart,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ShareCardButton } from '../common/ShareCardButton';
import { Button, PageContainer } from '../common/UIPrimitives';

export const WrappedView: React.FC = () => {
  const { user, loveMateWrapped, coupleStreak, openShareModal, triggerConfetti, showToast } = useApp();

  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual');

  const partnerName = user?.partnerName || 'your partner';

  const handleShare = () => {
    triggerConfetti();
    openShareModal({
      type: 'wrapped',
      data: loveMateWrapped,
    });
  };

  const handleDownloadCard = () => {
    triggerConfetti();
    const textContent = `❤️ LOVEMATE WRAPPED ${loveMateWrapped.year} ❤️\n\n` +
      `Partners: ${user?.name || 'You'} & ${partnerName}\n` +
      `Days Connected: ${loveMateWrapped.daysConnected} Days\n` +
      `Couple Streak: ${coupleStreak} Days\n` +
      `Challenges Completed: ${loveMateWrapped.challengesCompleted}\n` +
      `Memories Created: ${loveMateWrapped.memoriesCreated}\n` +
      `Favorite Shared Activity: ${loveMateWrapped.favoriteActivity}\n\n` +
      `Our Year In One Sentence:\n"${loveMateWrapped.yearInOneSentence}"\n\n` +
      `Made with LoveMate`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoveMate_Wrapped_${loveMateWrapped.year}.txt`;
    a.click();
    showToast('LoveMate Wrapped downloaded! 📥', 'success');
  };

  return (
    <PageContainer narrow>
      {/* Celebratory hero */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              LoveMate Wrapped {loveMateWrapped.year}
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
            <ShareCardButton
              fileName={`lovemate-wrapped-${loveMateWrapped.year}`}
              spec={{
                eyebrow: `Wrapped ${loveMateWrapped.year}`,
                names: [user?.name || 'You', partnerName],
                hero: String(loveMateWrapped.daysConnected),
                heroLabel: 'days connected',
                headline: 'Our year in numbers',
                lines: [
                  `${loveMateWrapped.memoriesCreated} memories created`,
                  `${loveMateWrapped.challengesCompleted} challenges finished`,
                  `${coupleStreak}-day best couple streak`,
                  `Favourite together: ${loveMateWrapped.favoriteActivity}`,
                ],
                footnote: loveMateWrapped.yearInOneSentence,
              }}
            />
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
            Annual (2026)
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
              period === 'monthly' ? 'bg-white text-rose-600' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            October 2026
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
            LOVE ARCHIVE #{loveMateWrapped.year}
          </span>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Days connected</span>
            <p className="text-3xl font-bold text-white">{loveMateWrapped.daysConnected}</p>
            <span className="text-[10px] text-emerald-400 font-bold">Unbroken bond</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Memories created</span>
            <p className="text-3xl font-bold text-rose-400">{loveMateWrapped.memoriesCreated}</p>
            <span className="text-[10px] text-zinc-400">In timeline and album</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Challenges finished</span>
            <p className="text-3xl font-bold text-amber-400">{loveMateWrapped.challengesCompleted}</p>
            <span className="text-[10px] text-zinc-400">Habits strengthened</span>
          </div>

          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/60 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-semibold block">Best couple streak</span>
            <p className="text-3xl font-bold text-purple-400">{coupleStreak}d</p>
            <span className="text-[10px] text-zinc-400">Daily connection</span>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-700/60 space-y-2">
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Most discussed theme</span>
            <p className="text-base font-bold text-white">{loveMateWrapped.mostDiscussedTopic}</p>
            <p className="text-zinc-400 leading-relaxed">
              You both invested intentional time into conscious listening, moving past surface chatter into real emotional security.
            </p>
          </div>

          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-700/60 space-y-2">
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Favorite shared tool</span>
            <p className="text-base font-bold text-white">{loveMateWrapped.favoriteActivity}</p>
            <p className="text-zinc-400 leading-relaxed">
              Your synchronized answers revealed 94% alignment on sense of humor, travel, and late-night talks.
            </p>
          </div>
        </div>

        {/* Year in one sentence */}
        <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-pink-950/40 p-6 rounded-2xl border border-rose-500/30 text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
            Your year in one sentence
          </span>
          <p className="text-sm sm:text-base font-serif italic text-rose-100 max-w-xl mx-auto leading-relaxed">
            "{loveMateWrapped.yearInOneSentence}"
          </p>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top shared highlights</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {loveMateWrapped.highlightMoments.map((mom, i) => (
              <div key={i} className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40 flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-semibold text-zinc-200">{mom}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
