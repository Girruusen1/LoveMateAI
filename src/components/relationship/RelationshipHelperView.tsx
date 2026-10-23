import React, { useState } from 'react';
import {
  Bandage,
  Bird,
  Check,
  Copy,
  HandHeart,
  HeartCrack,
  HeartHandshake,
  Lightbulb,
  Shield,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const RelationshipHelperView: React.FC = () => {
  const { addPoints, showToast, setActiveTab } = useApp();

  const [activeModule, setActiveModule] = useState<
    'apology' | 'fight' | 'after_fight' | 'breakup' | 'boundary' | 'moving_on'
  >('apology');

  const [userInput, setUserInput] = useState('');
  const [outputResult, setOutputResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const modules = [
    { id: 'apology', title: 'Apology', icon: <HandHeart />, desc: 'Sincere, non-defensive apology without gaslighting' },
    { id: 'fight', title: 'De-escalate a fight', icon: <Bird />, desc: 'Cool down heated tension and bridge understanding' },
    { id: 'after_fight', title: 'Reconnect after a fight', icon: <Bandage />, desc: 'Warm check-in after the storm has cleared' },
    { id: 'boundary', title: 'Set a boundary', icon: <Shield />, desc: 'Express personal limits with clarity and grace' },
    { id: 'breakup', title: 'Respectful closure', icon: <HeartCrack />, desc: 'Honest, dignified breakup message' },
    { id: 'moving_on', title: 'Heartbreak first aid', icon: <Sprout />, desc: 'Mindset shifts and gentle reminders to heal' },
  ];

  const presets: Record<string, string> = {
    apology:
      "I was completely wrong for snapping at you earlier when I was stressed from work. I know that made you feel unappreciated, and I'm deeply sorry. You deserve my patience, not my frustration.",
    fight:
      "Hey, I can feel both of us getting overwhelmed, and when we are this elevated, we aren't listening to understand each other. Can we take a 30-minute pause to breathe? I care about our bond much more than winning this debate.",
    after_fight:
      "Hey... just checking in on your heart. Yesterday was heavy, and I hate when there is distance between us. When you feel ready, I'd love to hug you and talk through it calmly with an open mind.",
    boundary:
      "I value our connection so much, which is why I want to be honest with you. When plans change at the very last minute, it makes me feel like my time isn't respected. Going forward, I need us to give each other reasonable heads up.",
    breakup:
      "I have reflected deeply on our journey together, and while I have so much genuine care and respect for you, I've realized that what we each need long-term is leading in different directions. I want to be completely honest rather than let resentment build. Thank you for the memories we shared.",
    moving_on:
      "Remember: missing someone does not mean you made a mistake by walking away. Heartbreak is the brain detoxing from a familiar emotional routine. Treat yourself today like someone you love dearly. Drink water, go for a walk, and allow yourself to grieve without judgment.",
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setOutputResult(presets[activeModule]);
      setIsGenerating(false);
      addPoints(10, 'Used Relationship Studio');
      showToast('Generated supportive framework ❤️', 'love');
    }, 600);
  };

  const handleCopy = async () => {
    const ok = await copyText(outputResult || presets[activeModule]);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopied(true);
    showToast('Copied to clipboard! 📋', 'love');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentModule = modules.find((m) => m.id === activeModule);
  const scriptText = outputResult || presets[activeModule];

  const form = (
    <Card className="space-y-5">
      <div>
        <FieldLabel>What do you need help with?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <Chip
              key={m.id}
              selected={activeModule === m.id}
              icon={m.icon}
              onClick={() => {
                setActiveModule(m.id as any);
                setOutputResult(presets[m.id]);
              }}
            >
              {m.title}
            </Chip>
          ))}
        </div>
        {currentModule && <p className="text-xs text-zinc-500 mt-2">{currentModule.desc}</p>}
      </div>

      <div>
        <FieldLabel hint="optional">What happened?</FieldLabel>
        <Textarea
          rows={3}
          placeholder="e.g. We had a disagreement over being late and neither of us spoke all morning..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        loading={isGenerating}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Write the message
      </Button>
    </Card>
  );

  const result = scriptText ? (
    <div className="space-y-4">
      <Card className="space-y-5">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <h3 className="text-base font-bold text-zinc-900">{currentModule?.title}</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-800 leading-relaxed font-serif italic">
          "{scriptText}"
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-zinc-600 space-y-1">
          <p className="font-bold text-rose-800 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Tip
          </p>
          <p>
            Delivery matters as much as words. Speak slowly, drop defensiveness, and remember you are both on the same team against the problem, not against each other.
          </p>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<HeartHandshake />}
        title="Tough moments"
        subtitle="Calm, honest wording for apologies, arguments, boundaries and goodbyes."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <HeartHandshake />,
          title: 'Your message will appear here',
          description: 'Pick a situation on the left and generate a message you can adapt.',
        }}
      />
    </PageContainer>
  );
};
