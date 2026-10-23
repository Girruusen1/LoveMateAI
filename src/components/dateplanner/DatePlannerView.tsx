import React, { useState } from 'react';
import { CalendarHeart, Clock, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { DatePlanItinerary } from '../../types';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Select,
  ToolLayout,
} from '../common/UIPrimitives';

export const DatePlannerView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [stage, setStage] = useState('First Date');
  const [budget, setBudget] = useState('₹1,500 - ₹2,500 ($20 - $35)');
  const [location, setLocation] = useState('Bandra / City Center');
  const [vibe, setVibe] = useState('Romantic & Intimate');
  const [isPlanning, setIsPlanning] = useState(false);
  const [itinerary, setItinerary] = useState<DatePlanItinerary | null>(null);

  const stages = ['First Date', 'Talking Stage', 'Couple Anniversary', 'Casual Weekend Hangout'];
  const vibes = ['Romantic & Intimate', 'Playful & Adventurous', 'Chill & Cozy', 'Aesthetic & Cultural'];

  const handleGenerate = async () => {
    setIsPlanning(true);
    try {
      const plan = await AIService.generateDateItinerary(stage, budget, location, vibe);
      setItinerary(plan);
      addPoints(20, 'Planned a Date Itinerary');
      triggerConfetti();
      showToast('Custom timed itinerary crafted! 🥂', 'love');
    } catch (e) {
      showToast('Error planning date', 'info');
    } finally {
      setIsPlanning(false);
    }
  };

  const form = (
    <Card className="space-y-4">
      <div>
        <FieldLabel>Relationship stage</FieldLabel>
        <Select value={stage} onChange={(e) => setStage(e.target.value)}>
          {stages.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Vibe</FieldLabel>
        <Select value={vibe} onChange={(e) => setVibe(e.target.value)}>
          {vibes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>City or neighborhood</FieldLabel>
        <Input
          type="text"
          placeholder="e.g. Bandra / Downtown / Central Park"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>Budget</FieldLabel>
        <Input
          type="text"
          placeholder="e.g. ₹1,500 ($25)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        loading={isPlanning}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Generate date plan
      </Button>
    </Card>
  );

  const result = itinerary ? (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Card className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <p className="text-xs text-zinc-500">Timed schedule</p>
            <h2 className="text-lg font-bold text-zinc-900 mt-0.5">{itinerary.title}</h2>
          </div>
          <Badge variant="rose" size="md">Est. {itinerary.budgetEst}</Badge>
        </div>

        <div className="relative pl-6 border-l-2 border-rose-200 space-y-5">
          {itinerary.schedule.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center text-[10px] font-bold text-rose-600">
                {idx + 1}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {step.time}
                  </span>
                  <span className="text-xs font-bold text-zinc-900">{step.activity}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">{step.description}</p>
                {step.locationTip && (
                  <p className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                    <span>{step.locationTip}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm" className="space-y-2">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-500" /> Conversation topics
          </h3>
          <ul className="space-y-1.5">
            {itinerary.conversationTopics.map((top, i) => (
              <li key={i} className="text-sm text-zinc-600 flex gap-2">
                <span className="text-rose-400">•</span>
                <span>{top}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="sm" className="space-y-2">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" /> Small chemistry boosters
          </h3>
          <ul className="space-y-1.5">
            {itinerary.cuteMoments.map((cm, i) => (
              <li key={i} className="text-sm text-zinc-600 flex gap-2">
                <span className="text-rose-400">•</span>
                <span>{cm}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card padding="sm" className="space-y-3">
        <div className="flex items-center justify-between text-sm font-bold text-zinc-900">
          <span>Budget breakdown</span>
          <span>Total: ~{itinerary.budgetEst}</span>
        </div>
        <div className="space-y-1.5">
          {itinerary.budgetBreakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-sm text-zinc-600">
              <span>{b.item}</span>
              <span className="font-semibold text-zinc-900">{b.cost}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-zinc-100 text-xs text-amber-800 bg-amber-50 border-amber-200 rounded-xl p-3">
          <span className="font-bold">Weather backup plan:</span> {itinerary.backupPlan}
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<CalendarHeart />}
        title="Date planner"
        subtitle="Get a step-by-step timed itinerary with conversation starters and a budget breakdown."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <CalendarHeart />,
          title: 'Your date plan will appear here',
          description: 'Pick a stage, vibe, location and budget, then generate a timed schedule for the evening.',
        }}
      />
    </PageContainer>
  );
};
