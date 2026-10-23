import React, { useState } from 'react';
import { AlertTriangle, CornerDownRight, FlaskConical, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { WhatIfResult } from '../../types';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  ToolLayout,
} from '../common/UIPrimitives';

export const WhatIfSimulatorView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [scenarioInput, setScenarioInput] = useState('What if I tell her I like her this weekend?');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const sampleScenarios = [
    'What if I tell my crush I like them this weekend?',
    'What if I suggest moving in together after 1 year of dating?',
    'What if I ask them why their replies have been unusually slow?',
    'What if I tell my partner that I need more alone time?',
  ];

  const handleSimulate = async (customQuery?: string) => {
    const q = customQuery || scenarioInput;
    if (!q.trim()) return;

    setIsSimulating(true);
    try {
      const res = await AIService.evaluateWhatIf(q);
      setResult(res);
      addPoints(15, 'Explored What If Scenario');
      triggerConfetti();
      showToast('Scenario branches generated! 🧪', 'love');
    } catch (e) {
      showToast('Error simulating scenario', 'info');
    } finally {
      setIsSimulating(false);
    }
  };

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>Your what-if question</FieldLabel>
          <Input
            type="text"
            placeholder="e.g. What if I ask him out on a real date?"
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
          />
        </div>

        {/* Quick Sample Prompts */}
        <div>
          <FieldLabel>Or try one of these</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {sampleScenarios.map((s, idx) => (
              <Chip
                key={idx}
                selected={scenarioInput === s}
                onClick={() => {
                  setScenarioInput(s);
                  handleSimulate(s);
                }}
                className="whitespace-normal text-left"
              >
                {s}
              </Chip>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSimulating}
          onClick={() => handleSimulate()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Explore the outcomes
        </Button>
      </div>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <SectionHeading title="Possible paths" description={`For: "${result.query}"`} />

      <div className="grid grid-cols-1 gap-4">
        {result.paths.map((path) => (
          <Card key={path.pathType}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                <span className="font-bold text-sm text-zinc-900">{path.label}</span>
                <Badge variant="zinc">Scenario branch</Badge>
              </div>

              <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                {path.scenarioDescription}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 text-[10px] uppercase flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> What to say
                  </span>
                  <p className="text-zinc-800">{path.whatToSay}</p>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                  <span className="font-bold text-rose-900 text-[10px] uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> What to avoid
                  </span>
                  <p className="text-zinc-800">{path.whatToAvoid}</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-100/60 rounded-xl text-xs text-zinc-700 flex items-start gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-800">Dignified closure:</strong> {path.respectfulResponse}
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
        icon={<FlaskConical />}
        title="What if?"
        subtitle="Explore possible outcomes before taking a leap, and know how to respond with dignity on every path."
      />
      <p className="text-xs text-zinc-500">
        These are scenario explorations, not forecasts of what someone will actually say.
      </p>

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <FlaskConical />,
          title: 'Your scenario paths appear here',
          description: 'Ask a what-if question on the left and we will map out three ways it could go.',
        }}
      />
    </PageContainer>
  );
};
