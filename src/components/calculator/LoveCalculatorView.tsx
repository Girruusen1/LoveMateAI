import React, { useState } from 'react';
import {
  Bookmark,
  Brain,
  Calculator,
  Flame,
  Heart,
  HelpCircle,
  MessageCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { CompatibilityResult } from '../../types';
import { ShareCardButton } from '../common/ShareCardButton';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  ToolLayout,
} from '../common/UIPrimitives';

export const LoveCalculatorView: React.FC = () => {
  const { user, saveCompatibility, openShareModal, setActiveTab, triggerConfetti, showToast } = useApp();

  const [yourName, setYourName] = useState(user?.name || '');
  const [theirName, setTheirName] = useState('');
  const [birthdaySelf, setBirthdaySelf] = useState('');
  const [birthdayPartner, setBirthdayPartner] = useState('');
  const [relationshipType, setRelationshipType] = useState('Crush');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const relationshipTypes = ['Crush', 'Talking Stage', 'Dating', 'Long-Distance', 'Complicated'];

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourName.trim() || !theirName.trim()) {
      showToast('Please enter both names to calculate compatibility!', 'info');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const calculated = AIService.calculateCompatibility(yourName, theirName, relationshipType);
      setResult(calculated);
      setIsCalculating(false);
      triggerConfetti();
      showToast('Compatibility Calculated! ❤️', 'love');
    }, 850);
  };

  const handleSave = () => {
    if (!result) return;
    saveCompatibility(result);
  };

  const breakdownRows = result
    ? [
        { label: 'Chemistry & attraction', icon: <Flame />, value: result.breakdown.chemistry },
        { label: 'Communication style', icon: <MessageCircle />, value: result.breakdown.communication },
        { label: 'Personality fit', icon: <Brain />, value: result.breakdown.personality },
        { label: 'Emotional connection', icon: <Heart />, value: result.breakdown.emotionalConnection },
      ]
    : [];

  const form = (
    <Card>
      <form onSubmit={handleCalculate} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Your name</FieldLabel>
            <Input
              type="text"
              placeholder="Your name"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Their name</FieldLabel>
            <Input
              type="text"
              placeholder="Their name"
              value={theirName}
              onChange={(e) => setTheirName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Relationship stage</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map((type) => (
              <Chip key={type} selected={relationshipType === type} onClick={() => setRelationshipType(type)}>
                {type}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel hint="optional">Birthdays</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="date" value={birthdaySelf} onChange={(e) => setBirthdaySelf(e.target.value)} />
            <Input type="date" value={birthdayPartner} onChange={(e) => setBirthdayPartner(e.target.value)} />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isCalculating}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Check compatibility
        </Button>
      </form>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="text-center sm:text-left min-w-0">
            <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Overall compatibility</span>
            <h2 className="text-2xl font-bold text-zinc-900 mt-0.5">
              {result.yourName} <span className="text-rose-500">×</span> {result.theirName}
            </h2>
            <p className="text-sm text-zinc-600 mt-1">{result.verdict}</p>
          </div>

          <div className="w-24 h-24 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-md shadow-rose-200 shrink-0">
            <span className="text-2xl font-bold">{result.overallScore}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Match</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {breakdownRows.map((row) => (
            <div key={row.label} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                <span className="inline-flex items-center gap-1.5 text-zinc-700 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-rose-500">
                  {row.icon}
                  {row.label}
                </span>
                <span className="text-rose-600 font-bold">{row.value}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
          <h4 className="text-xs font-bold text-rose-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Relationship insight
          </h4>
          <p className="text-sm text-zinc-700 leading-relaxed">{result.aiAnalysis}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave} icon={<Bookmark className="w-3.5 h-3.5" />}>
              Save report
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openShareModal({ type: 'compatibility', data: result })}
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share card
            </Button>
            <ShareCardButton
              fileName={`lovemate-love-score-${result.overallScore}`}
              spec={{
                eyebrow: 'Love calculator',
                names: [result.yourName, result.theirName],
                hero: `${result.overallScore}%`,
                heroLabel: 'match',
                headline: result.verdict,
                lines: [
                  `Chemistry ${result.breakdown.chemistry}%`,
                  `Communication ${result.breakdown.communication}%`,
                  `Emotional connection ${result.breakdown.emotionalConnection}%`,
                ],
                footnote: 'For fun and conversation. Real love runs on effort and empathy.',
              }}
            />
          </div>

          <Button variant="primary" size="sm" onClick={() => setActiveTab('chat')} icon={<MessageCircle className="w-3.5 h-3.5" />}>
            Talk to AI about this
          </Button>
        </div>

        <p className="text-xs text-zinc-500 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Compatibility scores are for fun and conversation. Real love thrives on mutual effort, empathy and respect.
          </span>
        </p>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Calculator />}
        title="Love calculator"
        subtitle="A playful read on your chemistry, communication and emotional connection."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Calculator />,
          title: 'No score yet',
          description: 'Enter both names and pick your relationship stage to see your compatibility.',
        }}
      />
    </PageContainer>
  );
};
