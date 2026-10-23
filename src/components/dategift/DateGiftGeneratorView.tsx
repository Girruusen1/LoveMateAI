import React, { useState } from 'react';
import { Calendar, Gift, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { DateGiftIdea } from '../../types';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  SectionHeading,
  ToolLayout,
} from '../common/UIPrimitives';

export const DateGiftGeneratorView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [occasion, setOccasion] = useState('First Date');
  const [budget, setBudget] = useState('Moderate');
  const [vibe, setVibe] = useState('Romantic & Intimate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<DateGiftIdea>(
    AIService.generateDateAndGift('First Date', 'Moderate', 'Romantic & Intimate')
  );

  const occasions = ['First Date', 'Anniversary', 'Casual Weekend Hangout', 'Making Up After a Fight', 'Birthday Surprise'];
  const budgets = ['Low / Free', 'Moderate', 'Luxury / Special Occasion'];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = AIService.generateDateAndGift(occasion, budget, vibe);
      setIdeas(generated);
      setIsGenerating(false);
      triggerConfetti();
      addPoints(15, 'Generated Date Plans');
      showToast('Date & Gift ideas curated! 🎁', 'love');
    }, 600);
  };

  const form = (
    <Card className="space-y-5">
      <div>
        <FieldLabel>Occasion</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {occasions.map((occ) => (
            <Chip key={occ} selected={occasion === occ} onClick={() => setOccasion(occ)}>
              {occ}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Budget</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {budgets.map((b) => (
            <Chip key={b} selected={budget === b} onClick={() => setBudget(b)}>
              {b}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        loading={isGenerating}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Generate ideas
      </Button>
    </Card>
  );

  const result = ideas ? (
    <div className="space-y-4">
      <div className="space-y-3">
        <SectionHeading title="Date itineraries" description="Three dates matched to your occasion and budget." />
        <div className="grid grid-cols-1 gap-3">
          {ideas.dateIdeas.map((date, idx) => (
            <Card key={idx} padding="sm" className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="rose">Itinerary {idx + 1} • {date.vibe}</Badge>
                <Badge variant="zinc" size="md">Est. {date.estimatedCost}</Badge>
              </div>

              <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" /> {date.title}
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed">{date.description}</p>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-900">
                <span className="font-bold">Insider tip: </span>
                <span>{date.insiderTip}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading title="Gift ideas" description="Thoughtful picks in your price range." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ideas.giftIdeas.map((gift, idx) => (
            <Card key={idx} padding="sm" className="flex flex-col justify-between space-y-2">
              <div>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-rose-500" /> Gift {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-zinc-900 mt-1">{gift.item}</h4>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{gift.whyTheyWillLoveIt}</p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Price</span>
                <span className="font-bold text-rose-600">{gift.priceRange}</span>
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
        title="Date & gift ideas"
        subtitle="Get three date itineraries and three gift ideas tailored to the occasion and your budget."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <Gift />,
          title: 'Ideas will appear here',
          description: 'Choose an occasion and budget, then generate date and gift ideas.',
        }}
      />
    </PageContainer>
  );
};
