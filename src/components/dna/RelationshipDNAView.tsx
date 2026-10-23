import React, { useState } from 'react';
import {
  Clock,
  Dna,
  Heart,
  Laugh,
  Leaf,
  Lightbulb,
  MessageSquare,
  Scale,
  Share2,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_RELATIONSHIP_DNA } from '../../data/seedData';
import { AIService } from '../../services/ai';
import { Button, Card, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

export const RelationshipDNAView: React.FC = () => {
  const { user, setActiveTab, openShareModal, showToast } = useApp();

  const [dna, setDna] = useState(INITIAL_RELATIONSHIP_DNA);
  const [loading, setLoading] = useState(false);

  const partnerName = user?.partnerName || 'your partner';

  const facets = [
    { label: 'Humor & Banter', score: dna.humor, icon: <Laugh />, desc: 'Shared sarcasm, silly memes & playful roasts' },
    { label: 'Emotional Connection', score: dna.emotionalConnection, icon: <Heart />, desc: 'Vulnerability, safety & empathy' },
    { label: 'Communication Style', score: dna.communication, icon: <MessageSquare />, desc: 'Clarity, listening & active responsiveness' },
    { label: 'Future Goals', score: dna.futureGoals, icon: <Target />, desc: 'Career, travel & life milestone alignment' },
    { label: 'Lifestyle & Habits', score: dna.lifestyle, icon: <Leaf />, desc: 'Social battery, cleanliness & food tastes' },
    { label: 'Conflict Processing', score: dna.conflictStyle, icon: <Scale />, desc: 'De-escalation vs needing cooling space' },
    { label: 'Quality Time Needs', score: dna.qualityTime, icon: <Clock />, desc: 'Screen-free presence & spontaneous dates' },
  ];

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await AIService.generateRelationshipDNA();
      setDna(res);
      showToast('Relationship DNA updated from recent activities! 🧬', 'love');
    } catch (e) {
      showToast('Calculation error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
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
        aiAnalysis: `Your humor and emotional safety are cosmic anchors. Discussing conflict styles keeps the bond resilient.`,
      },
    });
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Dna />}
        title="Relationship DNA"
        subtitle={`Seven layers of synergy between ${user?.name || 'you'} and ${partnerName}, beyond a single percentage.`}
        actions={
          <>
            <Button variant="secondary" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
              Share card
            </Button>
            <Button variant="primary" icon={<Sparkles className="w-4 h-4" />} onClick={handleRecalculate} loading={loading}>
              Refresh DNA
            </Button>
          </>
        }
      />
      <p className="text-xs text-zinc-500">
        These facets are calculated from your shared quiz answers and reflection check-ins, not biological claims.
      </p>

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
          <p className="text-xs text-zinc-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            You bounce off each other's comedic timing effortlessly. Shared humor functions as your relationship's natural shock absorber.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Biggest contrast</p>
              <p className="text-sm font-bold text-zinc-900">{dna.biggestDifference}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            One of you regulates stress best by talking through things immediately, while the other needs 20 minutes of silence to reset.
          </p>
        </Card>
      </div>

      {/* Recommended activity */}
      <Card variant="accent" className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-rose-600" />
          <span className="text-base font-bold text-zinc-900">Recommended activity</span>
        </div>
        <p className="text-sm text-zinc-700 leading-snug">"{dna.tryTogetherActivity}"</p>

        <div className="pt-1">
          <Button variant="primary" size="sm" onClick={() => setActiveTab('chemistry-mode')}>
            Launch Chemistry mode
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
