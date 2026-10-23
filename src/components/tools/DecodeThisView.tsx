import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Copy, Lightbulb, Search, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { DecodeResult } from '../../types';
import {
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const DecodeThisView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti, unlockBadge, setActiveTab } = useApp();

  const [inputMessage, setInputMessage] = useState('haan dekhte hain 😂');
  const [context, setContext] = useState('We were discussing meeting for coffee this weekend');
  const [isDecoding, setIsDecoding] = useState(false);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [activeHinglishMap, setActiveHinglishMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDecode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) {
      showToast('Please paste a message to decode!', 'info');
      return;
    }

    setIsDecoding(true);
    try {
      const decoded = await AIService.decodeMessage(inputMessage, context);
      setResult(decoded);
      addPoints(15, 'Decoded a Message');
      unlockBadge('first_decode');
      triggerConfetti();
      showToast('Message decoded with psychological context! 🔍', 'love');
    } catch (err) {
      if (!isAiLimitError(err)) showToast('Error decoding message', 'info');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Reply copied! 📋', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleHinglish = (id: string) => {
    setActiveHinglishMap((prev) => ({ ...prev, [id]: !prev[id] }));
    showToast('Switched response flavor ✨', 'info');
  };

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>Paste a message or conversation</FieldLabel>
          <Textarea
            rows={3}
            placeholder="e.g. 'haan dekhte hain 😂', 'haha okay sure', 'seen at 11:34 PM'"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
        </div>

        <div>
          <FieldLabel hint="optional">What happened before this?</FieldLabel>
          <Input
            type="text"
            placeholder="e.g. 'I asked them if they wanted to get coffee Saturday'"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isDecoding}
          onClick={() => handleDecode()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Decode message
        </Button>
      </div>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card>
        <div className="space-y-6">
          {/* Top Metric Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 border-b border-zinc-100 text-center">
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tone</span>
              <span className="text-xs font-bold text-zinc-900 mt-0.5 block">{result.tone}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Mood</span>
              <span className="text-xs font-bold text-zinc-900 mt-0.5 block">{result.mood}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Interest signal</span>
              <span className="text-xs font-bold text-amber-600 mt-0.5 block">{result.interestSignal}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Opportunity</span>
              <span className="text-xs font-bold text-rose-600 mt-0.5 block">{result.conversationOpportunity}</span>
            </div>
          </div>

          {/* Conversation Momentum */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-rose-900">Conversation momentum: {result.momentum.level}</span>
            </div>
            <p className="text-zinc-700 leading-relaxed pl-6">{result.momentum.explanation}</p>
          </div>

          {/* What it might mean */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" /> What it might mean
            </h3>
            <ul className="space-y-1.5 text-sm text-zinc-600 pl-1">
              {result.whatItMightMean.map((mean, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>{mean}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What NOT to assume */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>What not to assume</span>
            </div>
            <p className="text-amber-800 leading-relaxed font-medium pl-5">{result.whatNotToAssume}</p>
          </div>

          {/* Best Response Options */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-zinc-900">Best response options</h3>

            <div className="space-y-3">
              {result.responses.map((resp) => {
                const isHinglish = activeHinglishMap[resp.id];
                const activeText = isHinglish ? resp.hinglishText : resp.text;

                return (
                  <div
                    key={resp.id}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-2.5 transition-all hover:border-rose-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200 uppercase tracking-wider">
                        {resp.label} approach
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={isHinglish ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => toggleHinglish(resp.id)}
                        >
                          {isHinglish ? 'Hinglish on' : 'Switch to Hinglish'}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(resp.id, activeText)}
                          icon={
                            copiedId === resp.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {copiedId === resp.id ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-zinc-900 leading-relaxed font-serif italic bg-white p-3 rounded-xl border border-zinc-100">
                      "{activeText}"
                    </p>

                    <p className="text-xs text-zinc-500 leading-normal">
                      <strong className="text-zinc-700">Why it works:</strong> {resp.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('roleplay')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              Practice this scenario in roleplay
            </Button>

            <Button variant="primary" size="sm" onClick={() => setActiveTab('chat')}>
              Ask Wingman for more context
            </Button>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Search />}
        title="Decode a message"
        subtitle="Understand their true tone, emotional subtext, and hidden conversation opportunities without overthinking."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Search />,
          title: 'Your decoded message appears here',
          description: 'Paste a message on the left and we will break down its tone, mood, and the best ways to reply.',
        }}
      />
    </PageContainer>
  );
};
