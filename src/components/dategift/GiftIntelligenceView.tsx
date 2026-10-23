import React, { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { GiftIntelligenceResult } from '../../types';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  Select,
  ToolLayout,
} from '../common/UIPrimitives';

export const GiftIntelligenceView: React.FC = () => {
  const { showToast } = useApp();

  const [stage, setStage] = useState('Dating (6+ Months)');
  const [budget, setBudget] = useState('₹1,500 – ₹3,000');
  const [occasion, setOccasion] = useState('Anniversary');
  const [personality, setPersonality] = useState('Loves coffee, rooftop cafes, journaling & film photography');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftIntelligenceResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await AIService.generateGiftIntelligence(stage, budget, occasion, personality, 'sentimental');
      setResult(res);
      showToast('Gift Intelligence tailored! 🎁', 'love');
    } catch (e) {
      showToast('Gift generation error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <Card className="space-y-4">
      <div>
        <FieldLabel>Relationship stage</FieldLabel>
        <Select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="Talking / Early Dates">Talking / Early Dates</option>
          <option value="Dating (6+ Months)">Dating (6+ Months)</option>
          <option value="Long Term">Long Term / Committed</option>
          <option value="Long Distance">Long Distance</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Occasion</FieldLabel>
        <Select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
          <option value="Anniversary">Anniversary</option>
          <option value="Birthday">Birthday</option>
          <option value="Just Because">Just Because / Surprise</option>
          <option value="Post-Fight Reconciliation">Post-Fight Reconciliation</option>
          <option value="Milestone Celebration">Milestone Celebration</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Budget</FieldLabel>
        <Select value={budget} onChange={(e) => setBudget(e.target.value)}>
          <option value="Under ₹1,000 (Thoughtful & Low Cost)">Under ₹1,000</option>
          <option value="₹1,500 – ₹3,000">₹1,500 – ₹3,000</option>
          <option value="₹3,000 – ₹6,000">₹3,000 – ₹6,000</option>
          <option value="₹6,000+ (Luxury & Experience)">₹6,000+ (Luxury)</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Partner's interests and tastes</FieldLabel>
        <Input
          type="text"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="e.g. Loves hazelnut cold brews, rooftop stargazing, vintage vinyl & cats"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        loading={loading}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Generate gift ideas
      </Button>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Card className="space-y-3">
        <SectionHeading title="Gift personality" description="How your partner tends to value a gift." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-xs text-zinc-500 block">Sentimental</span>
            <p className="text-base font-bold text-zinc-900 mt-1">{result.giftPersonality.sentimental}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-xs text-zinc-500 block">Practical</span>
            <p className="text-base font-bold text-zinc-900 mt-1">{result.giftPersonality.practical}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-xs text-zinc-500 block">Shared experience</span>
            <p className="text-base font-bold text-zinc-900 mt-1">{result.giftPersonality.experienceOriented}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <SectionHeading title="Recommendations" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.recommendations.map((gift, i) => (
            <Card key={i} padding="sm" className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="rose">{gift.category}</Badge>
                <h4 className="text-sm font-bold text-zinc-900 leading-snug">{gift.title}</h4>
                <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <span className="font-bold text-zinc-800">Why they will love it: </span>
                  {gift.whyTheyLoveIt}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-900">{gift.estimatedPrice}</span>
                <span className="text-zinc-500 truncate">{gift.whereToFind}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Gift />}
        title="Gift ideas"
        subtitle="Describe your partner and the occasion to get sentimental, experience-rich gift recommendations."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Gift />,
          title: 'Gift recommendations will appear here',
          description: 'Fill in the stage, occasion, budget and what your partner loves, then generate ideas.',
        }}
      />
    </PageContainer>
  );
};
