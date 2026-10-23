import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, PageContainer, PageHeader } from '../common/UIPrimitives';

export const OurStoryMovieView: React.FC = () => {
  const { user, setActiveTab, triggerConfetti } = useApp();

  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const partnerName = user?.partnerName || 'your partner';

  const movieChapters = [
    {
      actNumber: 'ACT I',
      title: 'The Opening',
      subtitle: 'Two strangers in the same bustling city',
      narrative: `It started in a quiet corner of the city. A casual glance, a shared pause, and two separate lives brushing against each other before either realized what was about to happen.`,
      backdrop: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=800&fit=crop',
      mood: 'Quiet Curiosity',
      quote: '"Some people arrive like a quiet season change."',
    },
    {
      actNumber: 'ACT II',
      title: 'The First Spark',
      subtitle: 'When text notifications made our hearts skip',
      narrative: `What began as brief pleasantries rapidly spiraled into 2 AM conversations. Late-night memes turned into childhood confessions, music playlists, and that undeniable flutter whenever the screen lit up.`,
      backdrop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop',
      mood: 'Electric Excitement',
      quote: '"I stopped noticing the time whenever we talked."',
    },
    {
      actNumber: 'ACT III',
      title: 'The Turning Point',
      subtitle: 'When "I" quietly evolved into "We"',
      narrative: `Somewhere between walking together through sudden downpours and sharing cold brews without needing to fill the silence, the realization dawned: this was no longer casual. This was home.`,
      backdrop: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&h=800&fit=crop',
      mood: 'Deep Realization',
      quote: '"Silence became comfortable, and presence became vital."',
    },
    {
      actNumber: 'ACT IV',
      title: 'The Funny Chapter',
      subtitle: 'Spilled coffee, missed exits & uncontrollable laughter',
      narrative: `True love isn't just movie-perfect candlelight dinners. It's ordering takeout that arrives cold, missing highway exits because we were laughing too hard, and arguing over who hogs the blanket.`,
      backdrop: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=800&fit=crop',
      mood: 'Pure Laughter',
      quote: '"We are completely ridiculous together, and that is perfection."',
    },
    {
      actNumber: 'ACT V',
      title: 'Weathering the Storm',
      subtitle: 'Choosing each other when things get tough',
      narrative: `We learned that disagreements are not the end of love, but the crucible where patience is tested. Pausing ego, taking deep breaths, and choosing understanding over being right.`,
      backdrop: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=800&fit=crop',
      mood: 'Resilience & Trust',
      quote: '"I care more about us than about winning an argument."',
    },
    {
      actNumber: 'ACT VI',
      title: 'Where We Are Now',
      subtitle: 'A steady flame in a noisy world',
      narrative: `Today, we walk forward with deep mutual respect. In a world of fleeting connections, what we have built is rare, deliberate, and deeply cherished.`,
      backdrop: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1200&h=800&fit=crop',
      mood: 'Gratitude & Calm',
      quote: '"You are my favorite place to go when my mind searches for peace."',
    },
    {
      actNumber: 'ACT VII',
      title: 'The Unwritten Future',
      subtitle: 'All the adventures still waiting for us',
      narrative: `New road trips, unexplored cities, spontaneous midnight ice cream drives, and a million ordinary mornings waiting to be greeted together. The best is yet to come.`,
      backdrop: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=800&fit=crop',
      mood: 'Endless Possibility',
      quote: '"Whatever lies ahead, we meet it together."',
    },
  ];

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentChapter((prev) => {
          if (prev >= movieChapters.length - 1) {
            setIsPlaying(false);
            triggerConfetti();
            return prev;
          }
          return prev + 1;
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, movieChapters.length, triggerConfetti]);

  const activeAct = movieChapters[currentChapter];

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Clapperboard />}
        title="Story movie"
        subtitle="Your relationship told in seven short acts. Sit back, or step through it at your own pace."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
              icon={isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActiveTab('our-space')} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to our space
            </Button>
          </>
        }
      />

      <p className="text-xs text-zinc-500">
        Chapter {currentChapter + 1} of {movieChapters.length}
      </p>

      {/* Cinematic Theater Canvas (the one dark element on this page) */}
      <div className="relative rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] shadow-2xl bg-zinc-950 flex flex-col justify-between p-6 sm:p-12 border border-zinc-800 transition-all select-none">
        {/* Background Film Backdrop with subtle pan zoom effect */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105 opacity-35"
          style={{ backgroundImage: `url(${activeAct.backdrop})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Top Floating Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-300 text-xs font-bold">
            <Film className="w-3 h-3" /> {activeAct.actNumber} · {user?.name || 'You'} & {partnerName}
          </div>
          <span className="text-xs font-semibold text-zinc-300 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
            {activeAct.mood}
          </span>
        </div>

        {/* Center Chapter Title & Emotional Narrative */}
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4 my-auto">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-bold block">
            {activeAct.subtitle}
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
            {activeAct.title}
          </h2>
          <p className="text-xs sm:text-base text-zinc-200 font-medium leading-relaxed drop-shadow-xs">
            {activeAct.narrative}
          </p>
          <p className="italic text-rose-200/90 text-xs sm:text-sm font-serif pt-1">
            {activeAct.quote}
          </p>
        </div>

        {/* Bottom Playback & Progress Controls */}
        <div className="relative z-10 space-y-4 pt-4 border-t border-white/10">
          {/* Progress Timeline Segments */}
          <div className="grid grid-cols-7 gap-1.5">
            {movieChapters.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentChapter(i)}
                className="h-1 rounded-full cursor-pointer overflow-hidden bg-white/20 hover:bg-white/40 transition-colors"
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    i < currentChapter ? 'bg-rose-500 w-full' : i === currentChapter ? 'bg-rose-400 w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-white text-xs">
            <button
              onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
              disabled={currentChapter === 0}
              aria-label="Previous chapter"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold flex items-center gap-2 hover:bg-rose-100 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => {
                if (currentChapter < movieChapters.length - 1) {
                  setCurrentChapter((prev) => prev + 1);
                } else {
                  setCurrentChapter(0);
                }
              }}
              aria-label={currentChapter === movieChapters.length - 1 ? 'Replay' : 'Next chapter'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {currentChapter === movieChapters.length - 1 ? <RotateCcw className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
