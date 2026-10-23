import React, { useState } from 'react';
import { Activity, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const RelationshipSignalsView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [behaviorInput, setBehaviorInput] = useState(
    'They apologize when they are late and reschedule with a specific day, but rarely text first during work hours'
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof AIService.analyzeRelationshipSignal> | null>(null);

  const sampleBehaviors = [
    'They apologize when they are late and immediately suggest an alternate day',
    'They constantly hide their phone face down whenever I sit next to them',
    'They take 8 hours to reply but send long thoughtful voice notes explaining they were in surgery',
    'They get upset and give me the silent treatment for days after any minor disagreement',
  ];

  const handleEvaluate = (customText?: string) => {
    const textToUse = customText || behaviorInput;
    if (!textToUse.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      const evaluation = AIService.analyzeRelationshipSignal(textToUse);
      setResult(evaluation);
      setIsEvaluating(false);
      addPoints(15, 'Analyzed Relationship Signal');
      triggerConfetti();
      showToast('Signal evaluated with psychological nuance! 🚦', 'love');
    }, 550);
  };

  const flagBadgeVariant = result
    ? result.flagType === 'green'
      ? 'emerald'
      : result.flagType === 'yellow'
      ? 'amber'
      : 'rose'
    : 'zinc';

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>Describe the behavior or situation you observed</FieldLabel>
          <Textarea
            rows={3}
            placeholder="e.g. They got upset when I wanted to hang out with my childhood friends..."
            value={behaviorInput}
            onChange={(e) => setBehaviorInput(e.target.value)}
          />
        </div>

        {/* Sample chips */}
        <div>
          <FieldLabel>Or try a common dilemma</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {sampleBehaviors.map((b, idx) => (
              <Chip
                key={idx}
                selected={behaviorInput === b}
                onClick={() => {
                  setBehaviorInput(b);
                  handleEvaluate(b);
                }}
                className="whitespace-normal text-left"
              >
                {b.slice(0, 48)}...
              </Chip>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isEvaluating}
          onClick={() => handleEvaluate()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Analyze signal
        </Button>

        <p className="text-xs text-zinc-500">
          People are multifaceted. We analyze observable communication patterns without making medical or clinical
          diagnoses.
        </p>
      </div>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-xs text-zinc-500">Signal classification</span>
              <h2 className="text-xl font-bold text-zinc-900 mt-0.5">{result.label}</h2>
            </div>

            <Badge variant={flagBadgeVariant} size="md">
              {result.flagType} flag
            </Badge>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            {result.analysis}
          </p>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900">What to notice over time</h3>
            <div className="space-y-1.5 text-sm text-zinc-600">
              {result.whatToNotice.map((note, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5">
              <span className="font-bold text-zinc-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-rose-600" /> What to ask them with curiosity
              </span>
              <p className="text-zinc-800 font-serif italic">{result.whatToAsk}</p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
              <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Healthy emotional response
              </span>
              <p className="text-zinc-800">{result.healthyResponse}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Activity />}
        title="Relationship signals"
        subtitle="Distinguish genuine red flags from harmless quirks or stress, with clear guidance and no pop-psychology labels."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Activity />,
          title: 'Your signal reading appears here',
          description: 'Describe a behavior on the left and we will weigh context before telling you what to notice.',
        }}
      />
    </PageContainer>
  );
};
