import React, { useState } from 'react';
import { CheckCircle, Sparkles, Sprout } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';
import { HealthCheckResult } from '../../types';
import { Badge, Button, Card, PageContainer, PageHeader, ToolLayout } from '../common/UIPrimitives';

export const RelationshipCheckInView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [ratings, setRatings] = useState<Record<string, number>>({
    comm: 84,
    trust: 92,
    time: 68,
    emotion: 86,
    apprec: 80,
    conflict: 74,
    fun: 88,
    support: 90,
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);

  const categories = [
    { id: 'comm', label: 'Communication', desc: 'Feeling heard and understood without defensiveness' },
    { id: 'trust', label: 'Trust & Safety', desc: 'Confidence in integrity and emotional transparency' },
    { id: 'time', label: 'Quality Time', desc: 'Undivided, phone-free presence and shared rituals' },
    { id: 'emotion', label: 'Emotional Connection', desc: 'Vulnerability and intuitive empathy' },
    { id: 'apprec', label: 'Appreciation & Gratitude', desc: 'Verbalizing love for small daily gestures' },
    { id: 'conflict', label: 'Conflict De-escalation', desc: 'Fighting the problem rather than each other' },
    { id: 'fun', label: 'Shared Playfulness', desc: 'Spontaneous laughter, banter, and lightness' },
    { id: 'support', label: 'Mutual Dream Support', desc: 'Encouraging personal goals and individual growth' },
  ];

  const handleSliderChange = (catId: string, val: number) => {
    setRatings((prev) => ({ ...prev, [catId]: val }));
  };

  const handleRunCheckIn = async () => {
    setIsEvaluating(true);
    try {
      const evaluation = await AIService.generateHealthCheck(ratings);
      setResult(evaluation);
      triggerConfetti();
      addPoints(20, 'Completed Relationship Health Check');
      showToast('Health reflection synthesized! 🌱', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Could not generate your reflection. Please retry.', 'info');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Sprout />}
        title="Check-in"
        subtitle="A recurring reflection across eight foundational pillars, so small frictions get noticed before they turn into arguments."
      />
      <p className="text-xs text-zinc-500">
        This is a relationship reflection and connection tool, not a clinical or psychological diagnosis.
      </p>

      <ToolLayout
        form={
          <Card className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Rate the past fortnight</h3>
              <span className="text-xs text-zinc-500">8 dimensions</span>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-zinc-900">{cat.label}</span>
                      <p className="text-[11px] text-zinc-500">{cat.desc}</p>
                    </div>
                    <span className="font-bold text-rose-600 text-sm shrink-0">{ratings[cat.id]}%</span>
                  </div>

                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={ratings[cat.id]}
                    onChange={(e) => handleSliderChange(cat.id, parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRunCheckIn}
              loading={isEvaluating}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Generate reflection
            </Button>
          </Card>
        }
        result={
          result ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Card className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                  <div>
                    <span className="text-xs text-zinc-500">Reflection summary</span>
                    <h2 className="text-xl font-bold text-zinc-900 mt-0.5">{result.overallHealthLabel}</h2>
                  </div>
                  <Badge variant="emerald" size="md">
                    Balanced dynamics
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.scores.map((sc, i) => (
                    <div key={i} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-800">
                        <span>{sc.category}</span>
                        <span className="font-bold text-rose-600">{sc.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sc.score}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">{sc.note}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-900 block">Core strengths</span>
                    {result.strengths.map((str, idx) => (
                      <p key={idx} className="text-zinc-700">• {str}</p>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs space-y-1.5">
                    <span className="font-bold text-amber-900 block">Worth a gentle discussion</span>
                    {result.areasWorthDiscussing.map((area, idx) => (
                      <p key={idx} className="text-zinc-700">• {area}</p>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-zinc-800 space-y-2">
                  <span className="font-bold text-rose-900 block">Suggested micro-actions for this week</span>
                  <ul className="space-y-1">
                    {result.suggestedActions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          ) : null
        }
        placeholder={{
          icon: <Sprout />,
          title: 'Your reflection will appear here',
          description: 'Adjust the sliders to reflect the past two weeks, then generate a summary with strengths and gentle next steps.',
        }}
      />
    </PageContainer>
  );
};
