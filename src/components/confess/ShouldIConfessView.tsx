import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, CheckCircle, Circle, Copy, Heart, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { ShouldIConfessResult } from '../../types';
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

export const ShouldIConfessView: React.FC = () => {
  const { addPoints, showToast, setActiveTab, triggerConfetti } = useApp();

  const [howLongKnown, setHowLongKnown] = useState('1 to 3 months');
  const [has1on1Hangouts, setHas1on1Hangouts] = useState(true);
  const [flirtyVibe, setFlirtyVibe] = useState(true);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [situationStory, setSituationStory] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<ShouldIConfessResult | null>(null);

  const handleEvaluate = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      const evaluation = AIService.evaluateShouldIConfess({
        howLongKnown,
        has1on1Hangouts,
        flirtyVibe,
        isCloseFriend,
      });
      if ((evaluation as unknown) instanceof Promise) {
        // Free AI limit reached: the app already showed a toast and the upgrade modal
        (evaluation as unknown as Promise<unknown>).catch(() => undefined);
        setIsEvaluating(false);
        return;
      }
      setResult(evaluation);
      setIsEvaluating(false);
      triggerConfetti();
      addPoints(15, 'Confession Readiness Check');
      showToast('Decision analysis ready! 🚦', 'love');
    }, 650);
  };

  const handleCopyScript = async (script: string) => {
    const ok = await copyText(script);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    showToast('Suggested script copied to clipboard! 📋', 'love');
  };

  const statusBadgeVariant = result
    ? result.status === 'green'
      ? 'emerald'
      : result.status === 'yellow'
      ? 'amber'
      : 'rose'
    : 'zinc';

  const form = (
    <Card>
      <div className="space-y-5">
        {/* Timing options */}
        <div>
          <FieldLabel>How long have you known them?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {['Less than 2 weeks', '1 to 3 months', '3 to 6 months', 'Over a year'].map((t) => (
              <Chip key={t} selected={howLongKnown === t} onClick={() => setHowLongKnown(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* Dynamic checks */}
        <div>
          <FieldLabel>What describes your dynamic?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Chip
              selected={has1on1Hangouts}
              onClick={() => setHas1on1Hangouts(!has1on1Hangouts)}
              icon={has1on1Hangouts ? <Check /> : <Circle />}
            >
              We hang out one-on-one
            </Chip>

            <Chip
              selected={flirtyVibe}
              onClick={() => setFlirtyVibe(!flirtyVibe)}
              icon={flirtyVibe ? <Check /> : <Circle />}
            >
              There is noticeable flirting or tension
            </Chip>

            <Chip
              selected={isCloseFriend}
              onClick={() => setIsCloseFriend(!isCloseFriend)}
              icon={isCloseFriend ? <AlertTriangle /> : <Circle />}
            >
              They are currently a close best friend
            </Chip>
          </div>
        </div>

        {/* Optional text story context */}
        <div>
          <FieldLabel hint="optional">Briefly describe your current situation</FieldLabel>
          <Textarea
            rows={3}
            placeholder="e.g. We chat every night until 2 AM and went to a concert together last weekend..."
            value={situationStory}
            onChange={(e) => setSituationStory(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isEvaluating}
          onClick={handleEvaluate}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Check my timing
        </Button>
      </div>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card>
        <div className="space-y-6">
          {/* Verdict header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-zinc-100">
            <div className="min-w-0">
              <span className="text-xs text-zinc-500">Timing verdict</span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{result.statusLabel}</h2>
              <p className="text-sm text-zinc-600 mt-1">{result.analysis}</p>
            </div>

            <Badge variant={statusBadgeVariant} size="md" className="shrink-0">
              {result.confidencePercent}% confidence
            </Badge>
          </div>

          {/* Reasons Why */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900">Why this verdict</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {result.reasons.map((r, i) => (
                <div key={i} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-700">
                  <span className="text-rose-500 font-bold mr-1">•</span> {r}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900">What to do next</h3>
            <ul className="space-y-1.5 text-sm text-zinc-600">
              {result.recommendedSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tailor-Made Script Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> What you could say
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyScript(result.suggestedScript)}
                icon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy script
              </Button>
            </div>
            <p className="text-sm text-zinc-900 font-serif italic bg-white p-3.5 rounded-xl border border-rose-200/60 leading-relaxed">
              "{result.suggestedScript}"
            </p>
          </div>

          {/* CTA */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('confession')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              Want a full letter? Write a confession
            </Button>

            <Button variant="primary" size="sm" onClick={() => setActiveTab('chat')}>
              Roleplay with Wingman
            </Button>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Mail />}
        title="Should I confess?"
        subtitle="Avoid awkward timing. Get a clear green, yellow, or red light based on your dynamic."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Mail />,
          title: 'Your verdict appears here',
          description: 'Answer a few quick questions on the left and we will weigh the timing for you.',
        }}
      />
    </PageContainer>
  );
};
