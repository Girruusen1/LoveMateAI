import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { RelationshipDetectiveResult } from '../../types';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const RelationshipDetectiveView: React.FC = () => {
  const { userMemories, setActiveTab, showToast } = useApp();

  const [description, setDescription] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RelationshipDetectiveResult | null>(null);

  const sampleSituations = [
    {
      label: 'Slow replies after a minor disagreement',
      text: "Yesterday we had a small disagreement about weekend plans. Today his replies are taking 4+ hours and he only sent 'yeah sounds good haha'.",
      context: 'We usually text throughout the day and he has a busy work deadline on Fridays.',
    },
    {
      label: 'Sudden dry tone after fun date',
      text: "We had a super fun date on Tuesday where we laughed a ton. But the next day her texts felt brief and she hasn't initiated since.",
      context: 'She mentioned she gets exhausted after social events.',
    },
  ];

  const handleAnalyze = async () => {
    if (!description.trim()) {
      showToast('Please describe the situation first', 'info');
      return;
    }
    setLoading(true);
    try {
      const res = await AIService.generateRelationshipDetective(description, contextInput);
      setResult(res);
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Analysis error, please retry', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = async () => {
    if (result?.suggestedConversation) {
      const ok = await copyText(result.suggestedConversation);
      if (!ok) {
        showToast("Couldn't copy. Please copy manually.", 'info');
        return;
      }
      showToast('Suggested conversation copied to clipboard! 📋', 'love');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Search />}
        title="Relationship detective"
        subtitle="Understand what is really happening by weighing context, relevant memories and conversation nuance without jumping to conclusions."
      />
      <p className="text-xs text-zinc-500">
        No mind-reading: we never claim to know someone else's unspoken intentions. Verified facts are kept separate from uncertainties.
      </p>

      <ToolLayout
        form={
          <Card className="space-y-5">
            <div>
              <FieldLabel>What happened?</FieldLabel>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. He left my message on read for 6 hours after we had a disagreement yesterday..."
              />
            </div>

            <div>
              <FieldLabel hint="optional">Important background context</FieldLabel>
              <Input
                type="text"
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="e.g. They work intense 12-hour shifts or recently had family stress..."
              />
            </div>

            <div>
              <FieldLabel>Try a sample</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {sampleSituations.map((sample) => (
                  <Chip
                    key={sample.label}
                    selected={description === sample.text}
                    onClick={() => {
                      setDescription(sample.text);
                      setContextInput(sample.context);
                    }}
                  >
                    {sample.label}
                  </Chip>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAnalyze}
              loading={loading}
              disabled={!description.trim()}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Understand what's happening
            </Button>
          </Card>
        }
        result={
          result ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="space-y-3">
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    What we know
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-700">
                    {result.whatWeKnow.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="space-y-3">
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    What we don't know
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-700">
                    {result.whatWeDontKnow.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card className="space-y-3">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-rose-500" />
                  What might be happening
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {result.whatMightBeHappening.map((item, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-zinc-800 leading-relaxed">
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-3">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  What you can do next
                </h3>
                <ul className="space-y-2 text-xs text-zinc-700">
                  {result.whatYouCanDoNext.map((act, i) => (
                    <li key={i} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-zinc-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{act}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card variant="accent" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-rose-600" />
                    A natural way to reconnect
                  </h3>
                  <Button variant="secondary" size="sm" icon={<Copy className="w-3 h-3" />} onClick={handleCopyScript}>
                    Copy script
                  </Button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-100 text-sm text-zinc-800 leading-relaxed">
                  {result.suggestedConversation}
                </div>

                <button
                  onClick={() => setActiveTab('roleplay')}
                  className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                >
                  Rehearse this in roleplay <ArrowRight className="w-3 h-3" />
                </button>
              </Card>
            </div>
          ) : null
        }
        placeholder={{
          icon: <Search />,
          title: 'Your analysis will appear here',
          description: 'Describe the situation and any background, then let the detective separate facts from assumptions.',
        }}
      />
    </PageContainer>
  );
};
