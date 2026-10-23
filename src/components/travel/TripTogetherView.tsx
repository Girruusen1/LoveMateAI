import React, { useState } from 'react';
import { CheckCircle2, Gift, Plane, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { AIService } from '../../services/ai';
import { TripTogetherItinerary } from '../../types';
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

export const TripTogetherView: React.FC = () => {
  const { showToast, addSharedPlan } = useApp();

  const [destination, setDestination] = useState('Udaipur, Rajasthan');
  const [durationDays, setDurationDays] = useState(3);
  const [budget, setBudget] = useState('₹22,000 for couple');
  const [vibe, setVibe] = useState('Heritage, Rooftops & Lake Sunsets');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<TripTogetherItinerary | null>(null);
  const [savedToSpace, setSavedToSpace] = useState(false);

  const handleSaveToSpace = () => {
    if (!itinerary || savedToSpace) return;
    const summary = [
      `${itinerary.durationDays} days · ${itinerary.totalEstimatedBudget}`,
      ...itinerary.dailyPlans.map(
        (dp) => `Day ${dp.dayNumber}: ${dp.theme} — ${dp.schedule.map((s) => `${s.time} ${s.activity}`).join('; ')}`
      ),
      itinerary.backupPlan ? `Backup: ${itinerary.backupPlan}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    addSharedPlan({ title: `Trip: ${itinerary.destination}`, type: 'travel', notes: summary, status: 'planned' });
    setSavedToSpace(true);
    showToast('Itinerary saved to Our Space plans! 🍷', 'love');
  };

  const handlePlanTrip = async () => {
    setLoading(true);
    try {
      const res = await AIService.generateTripTogether(destination, durationDays, budget, vibe);
      setItinerary(res);
      setSavedToSpace(false);
      showToast('Couples trip itinerary curated! ✈️', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Trip planning error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <Card className="space-y-4">
      <div>
        <FieldLabel>Destination</FieldLabel>
        <Input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Udaipur, Goa, Manali, Pondicherry"
        />
      </div>

      <div>
        <FieldLabel>Duration</FieldLabel>
        <Select value={durationDays} onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}>
          <option value={2}>Weekend getaway (2 days)</option>
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Budget</FieldLabel>
        <Input
          type="text"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="e.g. ₹20,000"
        />
      </div>

      <div>
        <FieldLabel>Vibe and shared interests</FieldLabel>
        <Input
          type="text"
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. Relaxed cafes, heritage walks, scenic boat rides & local food"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handlePlanTrip}
        loading={loading}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Plan our trip
      </Button>
    </Card>
  );

  const result = itinerary ? (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900">{itinerary.destination} itinerary</h2>
          <p className="text-xs text-zinc-500">
            {itinerary.durationDays} days • Estimated budget: {itinerary.totalEstimatedBudget}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleSaveToSpace} disabled={savedToSpace}>
          {savedToSpace ? 'Saved to Our Space' : 'Save to Our Space'}
        </Button>
      </div>

      <div className="space-y-4">
        {itinerary.dailyPlans.map((dp) => (
          <Card key={dp.dayNumber} className="space-y-4">
            <div className="border-b border-zinc-100 pb-3">
              <Badge variant="rose">Day {dp.dayNumber}</Badge>
              <h3 className="text-base font-bold text-zinc-900 mt-1.5">{dp.theme}</h3>
            </div>

            <div className="space-y-2.5">
              {dp.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3"
                >
                  <span className="font-mono text-xs font-bold text-rose-600 shrink-0 sm:w-16">{item.time}</span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-800">{item.activity}</p>
                    <p className="text-xs text-zinc-500">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {dp.coupleSurprise && (
              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 space-y-1">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-rose-600" />
                  Surprise idea
                </span>
                <p className="text-sm text-zinc-700 italic leading-relaxed">"{dp.coupleSurprise}"</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm" className="space-y-2">
          <h3 className="text-base font-bold text-zinc-900">Packing tips</h3>
          <ul className="space-y-1.5">
            {itinerary.packingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-zinc-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="sm" className="space-y-2">
          <h3 className="text-base font-bold text-zinc-900">Backup plan</h3>
          <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            {itinerary.backupPlan}
          </p>
        </Card>
      </div>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Plane />}
        title="Trip together"
        subtitle="Plan a couple's getaway with daily schedules, photo spots and small surprise moments."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <Plane />,
          title: 'Your trip itinerary will appear here',
          description: 'Enter a destination, duration, budget and vibe, then plan the trip.',
        }}
      />
    </PageContainer>
  );
};
