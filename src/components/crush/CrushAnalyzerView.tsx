import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Coffee,
  Flame,
  Footprints,
  HelpCircle,
  Hourglass,
  Moon,
  Scale,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { CrushAnalysisResult } from '../../types';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  ToolLayout,
} from '../common/UIPrimitives';

export const CrushAnalyzerView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti, setActiveTab } = useApp();

  const [initiates, setInitiates] = useState('half');
  const [replySpeed, setReplySpeed] = useState('fast');
  const [length, setLength] = useState('balanced');
  const [emojis, setEmojis] = useState('lots');
  const [plans, setPlans] = useState('yes');
  const [memory, setMemory] = useState('remembers_everything');

  const [result, setResult] = useState<CrushAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = AIService.analyzeCrush({
        initiates,
        replySpeed,
        length,
        emojis,
        plans,
        memory,
      });
      setResult(res);
      setIsAnalyzing(false);
      triggerConfetti();
      addPoints(20, 'Crush Signal Analysis');
      showToast('Signals analyzed! 🔥', 'love');
    }, 700);
  };

  const form = (
    <Card>
      <div className="space-y-5">
        {/* Question 1: Who initiates */}
        <div>
          <FieldLabel>Who usually starts the conversation?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'often', label: 'They initiate often', icon: <Sparkles /> },
              { val: 'half', label: 'Pretty 50/50', icon: <Scale /> },
              { val: 'rarely', label: 'Almost always me', icon: <Footprints /> },
            ].map((opt) => (
              <Chip key={opt.val} selected={initiates === opt.val} onClick={() => setInitiates(opt.val)} icon={opt.icon}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Question 2: Reply Speed */}
        <div>
          <FieldLabel>How fast do they normally reply?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'instant', label: 'Within minutes', icon: <Zap /> },
              { val: 'fast', label: '1-2 hours, apologizes if late', icon: <Hourglass /> },
              { val: 'slow', label: 'Hours or days, dry replies', icon: <Moon /> },
            ].map((opt) => (
              <Chip key={opt.val} selected={replySpeed === opt.val} onClick={() => setReplySpeed(opt.val)} icon={opt.icon}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Question 3: Remembering details */}
        <div>
          <FieldLabel>Do they remember small details you told them?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'remembers_everything', label: 'Yes, tiny things I mentioned', icon: <Brain /> },
              { val: 'average', label: 'Only the big topics', icon: <HelpCircle /> },
            ].map((opt) => (
              <Chip key={opt.val} selected={memory === opt.val} onClick={() => setMemory(opt.val)} icon={opt.icon}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Question 4: Hanging out 1-on-1 */}
        <div>
          <FieldLabel>Have you met or planned to meet one-on-one?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'yes', label: 'Yes, we hang out or planned to', icon: <Coffee /> },
              { val: 'no', label: 'Only in groups or online', icon: <Users /> },
            ].map((opt) => (
              <Chip key={opt.val} selected={plans === opt.val} onClick={() => setPlans(opt.val)} icon={opt.icon}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isAnalyzing}
          onClick={handleAnalyze}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Analyze signals
        </Button>
      </div>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
            <div>
              <span className="text-xs text-zinc-500">Likelihood of romantic interest</span>
              <h2 className="text-2xl font-bold text-zinc-900 mt-0.5">{result.ratingLabel}</h2>
              <p className="text-sm text-zinc-600 mt-1">{result.summary}</p>
            </div>

            <div className="w-24 h-24 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <span className="text-2xl font-bold">{result.score}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Interest</span>
            </div>
          </div>

          {/* Signal Diagnostics Breakdown */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-zinc-900">Signals detected</h3>
            {result.signals.map((sig, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs flex items-start gap-3">
                {sig.status === 'positive' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {sig.status === 'neutral' && <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                {sig.status === 'watchout' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                <div>
                  <span className="font-bold text-zinc-900">{sig.label}: </span>
                  <span className="text-zinc-600">{sig.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Next Move Script */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
            <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Recommended next move
            </span>
            <p className="text-zinc-800 font-medium">{result.aiAdvice}</p>
            <div className="p-3 bg-white rounded-xl border border-rose-200/80 font-serif italic text-zinc-900">
              Try texting: "{result.nextMove}"
            </div>
          </div>

          {/* CTA */}
          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('should-confess')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              Should I confess now?
            </Button>

            <Button variant="primary" size="sm" onClick={() => setActiveTab('chat')}>
              Talk to Wingman
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-zinc-500 text-center">
            This is a playful reading of behavioral cues and cannot replace a person's spoken truth.
          </p>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Flame />}
        title="Does my crush like me?"
        subtitle="Read the subtle signals in texting frequency and behavior patterns."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Flame />,
          title: 'Your signal reading appears here',
          description: 'Answer the four quick questions on the left and we will score the interest signals.',
        }}
      />
    </PageContainer>
  );
};
