import React, { useEffect, useState } from 'react';
import {
  Clock,
  Dna,
  Heart,
  Laugh,
  Leaf,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Scale,
  Share2,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RelationshipDNAResult } from '../../types';
import { Button, Card, FieldLabel, PageContainer, PageHeader, SectionHeading, inputClasses } from '../common/UIPrimitives';

type FacetKey = 'humor' | 'emotionalConnection' | 'communication' | 'futureGoals' | 'lifestyle' | 'conflictStyle' | 'qualityTime';
type Ratings = Record<FacetKey, number | null>;

interface StoredDNA {
  dna: RelationshipDNAResult;
  ratings: Record<FacetKey, number>;
}

interface FacetDef {
  key: FacetKey;
  label: string;
  icon: React.ReactNode;
  desc: string;
  /** Statement the user rates from 1 (not yet) to 5 (absolutely). */
  statement: string;
  strongNote: string;
  growthNote: string;
  activity: string;
}

const FACETS: FacetDef[] = [
  {
    key: 'humor',
    label: 'Humor & Banter',
    icon: <Laugh />,
    desc: 'Shared sarcasm, silly memes & playful roasts',
    statement: 'We make each other laugh easily, even on hard days.',
    strongNote: 'Shared laughter works as your natural shock absorber when life gets heavy.',
    growthNote: 'Playfulness has taken a back seat lately. Small silly moments can bring it back.',
    activity: 'Swap your three funniest memes or memories tonight and tell the story behind each one.',
  },
  {
    key: 'emotionalConnection',
    label: 'Emotional Connection',
    icon: <Heart />,
    desc: 'Vulnerability, safety & empathy',
    statement: 'I feel safe sharing my real feelings with them.',
    strongNote: 'You feel safe being vulnerable with each other, which is the foundation for everything else.',
    growthNote: 'Opening up still feels a little risky. Gentle, judgment-free check-ins help build safety.',
    activity: 'Try a 10-minute Chemistry mode session and answer one deeper question each.',
  },
  {
    key: 'communication',
    label: 'Communication Style',
    icon: <MessageSquare />,
    desc: 'Clarity, listening & active responsiveness',
    statement: 'When I talk, I feel heard and understood.',
    strongNote: 'You listen well and respond with care, so small issues rarely snowball.',
    growthNote: 'Messages sometimes land differently than intended. Reflecting back what you heard can help.',
    activity: 'Take turns speaking for two minutes while the other only listens, then summarize what you heard.',
  },
  {
    key: 'futureGoals',
    label: 'Future Goals',
    icon: <Target />,
    desc: 'Career, travel & life milestone alignment',
    statement: 'We want similar things for our future.',
    strongNote: 'You are pulling in the same direction on the big things, which makes planning feel easy.',
    growthNote: 'Your future pictures may not be fully in sync yet. Talking about them openly is the first step.',
    activity: 'Each write down three things you want in the next year, then compare lists over dinner.',
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Habits',
    icon: <Leaf />,
    desc: 'Social battery, cleanliness & food tastes',
    statement: 'Our daily routines and habits fit well together.',
    strongNote: 'Your day-to-day rhythms mesh well, so everyday life together feels smooth.',
    growthNote: 'Everyday routines create some friction. Naming small preferences out loud avoids silent resentment.',
    activity: 'Plan a no-phone cook-together night and pick the menu as a team.',
  },
  {
    key: 'conflictStyle',
    label: 'Conflict Processing',
    icon: <Scale />,
    desc: 'De-escalation vs needing cooling space',
    statement: 'We resolve disagreements without lasting hurt.',
    strongNote: 'You recover from disagreements well and come back closer instead of more distant.',
    growthNote: 'Disagreements can linger. Agreeing on a pause-and-return signal can make conflict safer.',
    activity: 'Agree on a "pause" word for heated moments and when you will come back to the topic.',
  },
  {
    key: 'qualityTime',
    label: 'Quality Time Needs',
    icon: <Clock />,
    desc: 'Screen-free presence & spontaneous dates',
    statement: 'We get enough focused, screen-free time together.',
    strongNote: 'You protect real, present time together, and it shows in how connected you feel.',
    growthNote: 'Focused time together has been scarce. Even short, intentional moments add up.',
    activity: 'Schedule one screen-free hour this week, doing something neither of you has tried before.',
  },
];

const RATING_LABELS = ['Not yet', 'A little', 'Somewhat', 'Mostly', 'Absolutely'];

const EMPTY_RATINGS: Ratings = {
  humor: null,
  emotionalConnection: null,
  communication: null,
  futureGoals: null,
  lifestyle: null,
  conflictStyle: null,
  qualityTime: null,
};

const storageKey = (userId?: string) => `lovemate_relationship_dna_${userId || 'guest'}`;

const readStored = (userId?: string): StoredDNA | null => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as StoredDNA) : null;
  } catch {
    return null;
  }
};

/** Builds a DNA result purely from the user's own ratings and notes. No sample values. */
const buildDNA = (ratings: Record<FacetKey, number>, funMatch: string, worthDiscussing: string): RelationshipDNAResult => {
  const score = (key: FacetKey) => ratings[key] * 20;
  const ranked = [...FACETS].sort((a, b) => score(b.key) - score(a.key));
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  return {
    humor: score('humor'),
    emotionalConnection: score('emotionalConnection'),
    communication: score('communication'),
    futureGoals: score('futureGoals'),
    lifestyle: score('lifestyle'),
    conflictStyle: score('conflictStyle'),
    qualityTime: score('qualityTime'),
    strongestConnection: `${strongest.label} (${score(strongest.key)}%)`,
    biggestDifference: `${weakest.label} (${score(weakest.key)}%)`,
    funMatch: funMatch.trim(),
    worthDiscussing: worthDiscussing.trim(),
    tryTogetherActivity: weakest.activity,
  };
};

const facetFromLabel = (text: string) => FACETS.find((f) => text.startsWith(f.label));

export const RelationshipDNAView: React.FC = () => {
  const { user, setActiveTab, openShareModal, showToast } = useApp();

  const [stored, setStored] = useState<StoredDNA | null>(() => readStored(user?.id));
  const [editing, setEditing] = useState(false);
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const [funMatch, setFunMatch] = useState('');
  const [worthDiscussing, setWorthDiscussing] = useState('');

  // Reload when a different account signs in.
  useEffect(() => {
    setStored(readStored(user?.id));
    setEditing(false);
  }, [user?.id]);

  const partnerName = user?.partnerName || 'your partner';
  const dna = stored?.dna ?? null;
  const showQuiz = !dna || editing;
  const answeredCount = FACETS.filter((f) => ratings[f.key] !== null).length;

  const startQuiz = () => {
    // Pre-fill previous answers so a retake only needs the changes.
    setRatings(stored ? { ...stored.ratings } : EMPTY_RATINGS);
    setFunMatch(stored?.dna.funMatch ?? '');
    setWorthDiscussing(stored?.dna.worthDiscussing ?? '');
    setEditing(true);
  };

  const handleGenerate = () => {
    if (answeredCount < FACETS.length) {
      showToast('Rate all seven statements to generate your DNA.', 'info');
      return;
    }
    const complete = ratings as Record<FacetKey, number>;
    const next: StoredDNA = { dna: buildDNA(complete, funMatch, worthDiscussing), ratings: complete };
    setStored(next);
    setEditing(false);
    try {
      localStorage.setItem(storageKey(user?.id), JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode); the result still shows for this session.
    }
    showToast('Relationship DNA generated from your answers! 🧬', 'love');
  };

  const handleShare = () => {
    if (!dna) return;
    const strongest = facetFromLabel(dna.strongestConnection);
    const weakest = facetFromLabel(dna.biggestDifference);
    openShareModal({
      type: 'compatibility',
      data: {
        yourName: user?.name || 'You',
        theirName: partnerName,
        overallScore: Math.round(
          (dna.communication + dna.emotionalConnection + dna.humor + dna.futureGoals) / 4
        ),
        breakdown: {
          chemistry: dna.humor,
          communication: dna.communication,
          personality: dna.lifestyle,
          emotionalConnection: dna.emotionalConnection,
        },
        verdict: `Strongest Connection: ${dna.strongestConnection}`,
        aiAnalysis: [strongest?.strongNote, weakest ? `Room to grow: ${weakest.label}.` : '']
          .filter(Boolean)
          .join(' '),
      },
    });
  };

  const facets = dna ? FACETS.map((f) => ({ ...f, score: dna[f.key] })) : [];
  const strongestFacet = dna ? facetFromLabel(dna.strongestConnection) : undefined;
  const weakestFacet = dna ? facetFromLabel(dna.biggestDifference) : undefined;

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Dna />}
        title="Relationship DNA"
        subtitle={`Seven layers of synergy between ${user?.name || 'you'} and ${partnerName}, beyond a single percentage.`}
        actions={
          dna && !editing ? (
            <>
              <Button variant="secondary" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                Share card
              </Button>
              <Button variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={startQuiz}>
                Retake
              </Button>
            </>
          ) : undefined
        }
      />
      <p className="text-xs text-zinc-500">
        These facets are calculated from your own answers to seven short statements, not biological claims.
      </p>

      {showQuiz ? (
        /* Questionnaire */
        <Card className="space-y-4">
          <SectionHeading
            title={dna ? 'Update your answers' : 'Map your Relationship DNA'}
            description={`How true is each statement for you and ${partnerName} right now? Be honest. Only you see your answers.`}
            action={<span className="text-xs font-bold text-rose-600">{answeredCount}/{FACETS.length}</span>}
          />

          <div className="space-y-3">
            {FACETS.map((facet) => (
              <div key={facet.key} className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/90 space-y-3">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-rose-600 [&>svg]:w-4 [&>svg]:h-4 mt-0.5 shrink-0">{facet.icon}</span>
                  <div>
                    <p className="font-bold text-zinc-800">{facet.label}</p>
                    <p className="text-zinc-600 mt-0.5">{facet.statement}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {RATING_LABELS.map((label, i) => {
                    const value = i + 1;
                    const selected = ratings[facet.key] === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setRatings((prev) => ({ ...prev, [facet.key]: value }))}
                        className={`px-1.5 py-2 rounded-xl text-[10px] sm:text-[11px] font-semibold border transition-colors ${
                          selected
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-rose-300 hover:text-rose-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>What do you love doing together? (optional)</FieldLabel>
              <input
                type="text"
                value={funMatch}
                onChange={(e) => setFunMatch(e.target.value)}
                placeholder="e.g. long walks, cooking, board games"
                className={inputClasses}
              />
            </div>
            <div>
              <FieldLabel>Something worth talking about? (optional)</FieldLabel>
              <input
                type="text"
                value={worthDiscussing}
                onChange={(e) => setWorthDiscussing(e.target.value)}
                placeholder="e.g. how we spend weekends"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {dna && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={handleGenerate}
              disabled={answeredCount < FACETS.length}
            >
              {dna ? 'Update DNA' : 'Generate my DNA'}
            </Button>
          </div>
        </Card>
      ) : (
        dna && (
          <>
            {/* Facets */}
            <Card className="space-y-4">
              <SectionHeading title="Seven core facets" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {facets.map((facet) => (
                  <div
                    key={facet.label}
                    className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/90 space-y-2 hover:border-rose-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800 flex items-center gap-2">
                        <span className="text-rose-600 [&>svg]:w-4 [&>svg]:h-4">{facet.icon}</span>
                        <span>{facet.label}</span>
                      </span>
                      <span className="font-bold text-rose-600 text-sm">{facet.score}%</span>
                    </div>

                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${facet.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-zinc-500">{facet.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Deep insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Strongest synergy</p>
                    <p className="text-sm font-bold text-zinc-900">{dna.strongestConnection}</p>
                  </div>
                </div>
                {strongestFacet && (
                  <p className="text-xs text-zinc-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    {strongestFacet.strongNote}
                  </p>
                )}
              </Card>

              <Card className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Most room to grow</p>
                    <p className="text-sm font-bold text-zinc-900">{dna.biggestDifference}</p>
                  </div>
                </div>
                {weakestFacet && (
                  <p className="text-xs text-zinc-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    {weakestFacet.growthNote}
                  </p>
                )}
              </Card>
            </div>

            {(dna.funMatch || dna.worthDiscussing) && (
              <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {dna.funMatch && (
                  <div className="space-y-1">
                    <p className="text-zinc-500">You love doing together</p>
                    <p className="text-sm font-bold text-zinc-900">{dna.funMatch}</p>
                  </div>
                )}
                {dna.worthDiscussing && (
                  <div className="space-y-1">
                    <p className="text-zinc-500">Worth talking about</p>
                    <p className="text-sm font-bold text-zinc-900">{dna.worthDiscussing}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Recommended activity */}
            <Card variant="accent" className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-rose-600" />
                <span className="text-base font-bold text-zinc-900">Recommended activity</span>
              </div>
              <p className="text-sm text-zinc-700 leading-snug">"{dna.tryTogetherActivity}"</p>

              <div className="pt-1">
                <Button variant="primary" size="sm" onClick={() => setActiveTab('couple-mode')}>
                  Open the couple quiz
                </Button>
              </div>
            </Card>
          </>
        )
      )}
    </PageContainer>
  );
};
