import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  OctagonAlert,
  RotateCw,
  Scale,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { AIService } from '../../services/ai';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  PageContainer,
  PageHeader,
  SectionHeading,
  Textarea,
} from '../common/UIPrimitives';

export const CouplesCoachView: React.FC = () => {
  const { user, setActiveTab, showToast, addSharedPlan } = useApp();

  const partnerName = user?.partnerName || 'your partner';

  const topics = [
    { id: 'communication', label: 'Communication problem', icon: <MessageSquare />, desc: 'Misunderstandings over text or tone' },
    { id: 'fighting', label: 'Fighting or tension', icon: <OctagonAlert />, desc: 'De-escalate without defensive ego' },
    { id: 'disconnected', label: 'Feeling disconnected', icon: <Sprout />, desc: 'Busy schedules created quiet distance' },
    { id: 'expectations', label: 'Different expectations', icon: <Scale />, desc: 'Different paces or needs for quality time' },
    { id: 'future', label: 'Future planning', icon: <Compass />, desc: 'Navigating long-term goals or next steps' },
  ];

  const [selectedTopic, setSelectedTopic] = useState('communication');
  const [personAInput, setPersonAInput] = useState(
    'I feel like we barely talk during the week, and when we do, it is rushed logistics rather than meaningful sharing.'
  );
  const [personBInput, setPersonBInput] = useState(
    'My work hours have been intense this month. When I get home, I feel mentally drained and need quiet space.'
  );
  const [step, setStep] = useState<'input' | 'resolving' | 'result'>('input');
  const [stepSaved, setStepSaved] = useState(false);
  const [result, setResult] = useState<{
    commonGround: string[];
    differences: string[];
    discussionPrompts: string[];
    agreedNextStep: string;
  } | null>(null);

  const handleStartResolution = async () => {
    setStep('resolving');
    try {
      const res = await AIService.generateCouplesCoachSession(selectedTopic, personAInput, personBInput);
      setResult(res);
      setStepSaved(false);
      setStep('result');
      showToast('Mediation session generated! 🤝', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Resolution error, please retry', 'info');
      setStep('input');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<HeartHandshake />}
        title="Couples coach"
        subtitle={`A structured, respectful exercise for ${user?.name || 'you'} and ${partnerName} to share perspectives, find common ground and agree on a gentle next step.`}
      />
      <p className="text-xs text-zinc-500 -mt-2">
        This is a mutual reflection tool, not clinical therapy. LoveMate never blames or diagnoses either person.
      </p>

      {/* Step 1: Select Topic & Input Perspectives */}
      {step === 'input' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <SectionHeading title="What conversation are you navigating?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {topics.map((t) => {
                const active = selectedTopic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopic(t.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-200 shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 [&>svg]:w-4 [&>svg]:h-4 ${
                        active ? 'bg-rose-600 text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {t.icon}
                    </span>
                    <p className="text-xs font-bold leading-tight">{t.label}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person A Side */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel className="mb-0">{user?.name ? `${user.name}'s perspective` : 'Your perspective'}</FieldLabel>
                <Badge variant="zinc">I-statement</Badge>
              </div>
              <Textarea
                rows={4}
                value={personAInput}
                onChange={(e) => setPersonAInput(e.target.value)}
                placeholder="How does this feel from your perspective? Focus on what you experience..."
              />
            </Card>

            {/* Person B Side */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel className="mb-0">{partnerName === 'your partner' ? "Your partner's perspective" : `${partnerName}'s perspective`}</FieldLabel>
                <Badge variant="zinc">Partner input</Badge>
              </div>
              <Textarea
                rows={4}
                value={personBInput}
                onChange={(e) => setPersonBInput(e.target.value)}
                placeholder="What has their experience or view seemed like? Or enter their direct words..."
              />
            </Card>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStartResolution}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Find common ground
          </Button>
        </div>
      )}

      {/* Resolving Loader */}
      {step === 'resolving' && (
        <Card padding="lg" className="py-20 text-center space-y-3 animate-in fade-in">
          <RotateCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-zinc-900">Synthesizing perspectives...</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Extracting mutual values, de-escalating accusations, and creating gentle discussion prompts.
          </p>
        </Card>
      )}

      {/* Step 2: Result Resolution */}
      {step === 'result' && result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Ground */}
            <Card className="space-y-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Where you align
              </h3>
              <ul className="space-y-2 text-xs text-zinc-700">
                {result.commonGround.map((item, i) => (
                  <li key={i} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Respectful Differences */}
            <Card className="space-y-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-500" />
                Where your needs differ
              </h3>
              <ul className="space-y-2 text-xs text-zinc-700">
                {result.differences.map((item, i) => (
                  <li key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-start gap-2">
                    <span className="text-zinc-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Discussion Prompts */}
          <Card className="space-y-3">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Questions to ask tonight
            </h3>
            <div className="space-y-2.5">
              {result.discussionPrompts.map((q, i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-xs sm:text-sm font-bold text-zinc-800 leading-snug">
                  {q}
                </div>
              ))}
            </div>
          </Card>

          {/* Agreed Win-Win Next Step */}
          <Card variant="accent" padding="lg" className="space-y-3">
            <Badge variant="rose">Agreed next step</Badge>
            <h3 className="text-lg font-bold text-zinc-900">{result.agreedNextStep}</h3>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setStep('input')}>
                Start new session
              </Button>
              <Button
                variant="primary"
                disabled={stepSaved}
                onClick={() => {
                  if (stepSaved) return;
                  addSharedPlan({
                    title: result.agreedNextStep,
                    type: 'idea',
                    notes: `Agreed in Couples Coach (${topics.find((t) => t.id === selectedTopic)?.label || selectedTopic}). Questions to ask: ${result.discussionPrompts.join(' | ')}`,
                    status: 'planned',
                  });
                  setStepSaved(true);
                  showToast('Agreed step saved to Our Space plans', 'love');
                }}
              >
                {stepSaved ? 'Saved to Our Space' : 'Save to Our Space'}
              </Button>
              {stepSaved && (
                <Button variant="ghost" onClick={() => setActiveTab('our-space')}>
                  Open Our Space
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
