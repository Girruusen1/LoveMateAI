import React, { useState } from 'react';
import { Copy, HeartHandshake, Lightbulb, Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { ConversationCoachPlan } from '../../types';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  SectionHeading,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const ConversationCoachView: React.FC = () => {
  const { setActiveTab, showToast } = useApp();

  const [scenario, setScenario] = useState('');
  const [goal, setGoal] = useState('Solve a problem peacefully');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ConversationCoachPlan | null>(null);

  const goalOptions = [
    'Explain how I feel without sounding needy',
    'Solve a recurring problem peacefully',
    'Sincere apology without deflecting blame',
    'Set a healthy emotional boundary',
    'Ask for commitment or relationship clarity',
    'Discuss busy schedules and quality time',
  ];

  const handleGeneratePlan = async () => {
    if (!scenario.trim()) {
      showToast('Please describe the conversation you need to have', 'info');
      return;
    }
    setLoading(true);
    try {
      const res = await AIService.generateConversationCoach(scenario, goal);
      setPlan(res);
      showToast('Step-by-step blueprint generated! 📋', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Plan generation error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = async (script: string) => {
    const ok = await copyText(script);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    showToast('Script copied to clipboard! 📋', 'love');
  };

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>What conversation do you need to have?</FieldLabel>
          <Textarea
            rows={4}
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g. I need to talk to my partner about how last-minute plan changes make me feel unappreciated..."
          />
        </div>

        <div>
          <FieldLabel>Your main goal</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((g) => (
              <Chip key={g} selected={goal === g} onClick={() => setGoal(g)} className="whitespace-normal text-left">
                {g}
              </Chip>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!scenario.trim()}
          onClick={handleGeneratePlan}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Build my script
        </Button>
      </div>
    </Card>
  );

  const resultView = plan ? (
    <div className="space-y-4">
      <SectionHeading
        title="Your step-by-step script"
        description={plan.scenarioGoal}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('roleplay')}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Practice in roleplay
          </Button>
        }
      />

      <div className="space-y-3">
        {plan.steps.map((st, i) => (
          <Card key={i}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/80">
                  {st.step}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyScript(st.script)}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy script
                </Button>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-sm font-semibold text-zinc-800 leading-relaxed">
                {st.script}
              </div>

              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-700">Coaching tip:</strong> {st.tip}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<HeartHandshake />}
        title="Conversation coach"
        subtitle="Prepare for difficult or high-stakes relationship conversations with a step-by-step script."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <HeartHandshake />,
          title: 'Your script appears here',
          description: 'Describe the conversation and pick a goal, and we will build a step-by-step script with coaching tips.',
        }}
      />
    </PageContainer>
  );
};
