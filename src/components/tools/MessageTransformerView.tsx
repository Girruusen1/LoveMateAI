import React, { useState } from 'react';
import { Check, Copy, Sparkles, Wand2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import {
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

export const MessageTransformerView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [inputText, setInputText] = useState('I miss you');
  const [activeStyle, setActiveStyle] = useState('Flirty');
  const [isTransforming, setIsTransforming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [variations, setVariations] = useState<{ text: string; hinglish: string; explanation: string }[]>([
    {
      text: `I was having a totally productive day until you popped into my head... now look what you did 😏`,
      hinglish: `Sab kuch normal chal raha tha fir achanak teri yaad aa gayi... ab batao kya kiya jaye? 😏`,
      explanation: 'Playfully accuses them of distracting you, creating pleasant romantic tension.',
    },
    {
      text: `Just so you know, you are completely ruining my ability to focus today.`,
      hinglish: `Sach bolu toh aaj mera focus kharab karne ka saara credit tujhe jaata hai haha.`,
      explanation: 'Short, punchy, confident banter.',
    },
  ]);

  const styles = [
    'Cute',
    'Romantic',
    'Funny',
    'Flirty',
    'Hinglish',
    'Confident',
    'Deep',
    'Casual',
    'Less Cringe',
  ];

  const handleTransform = async (chosenStyle?: string) => {
    const s = chosenStyle || activeStyle;
    if (!inputText.trim()) return;

    setIsTransforming(true);
    try {
      const results = await AIService.transformMessage(inputText, s);
      setVariations(results);
      addPoints(10, 'Transformed Message');
      triggerConfetti();
      showToast(`Polished in ${s} tone! ✨`, 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Error transforming message', 'info');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopy = async (idx: number, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedIdx(idx);
    showToast('Copied polished message! 📋', 'love');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>Your rough draft</FieldLabel>
          <Input
            type="text"
            placeholder="e.g. 'I miss you', 'Are you free?', 'Thanks for yesterday'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {/* Style Selector Chips */}
        <div>
          <FieldLabel>Tone</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {styles.map((st) => (
              <Chip
                key={st}
                selected={activeStyle === st}
                onClick={() => {
                  setActiveStyle(st);
                  handleTransform(st);
                }}
              >
                {st}
              </Chip>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isTransforming}
          onClick={() => handleTransform()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Make this better
        </Button>
      </div>
    </Card>
  );

  const resultView = (
    <div className="space-y-4">
      <SectionHeading title="Polished variations" description={`${activeStyle} tone`} />

      <div className="space-y-3.5">
        {variations.map((v, i) => (
          <Card key={i} className="hover:border-rose-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 uppercase tracking-wider">
                  Variation {i + 1}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(i, v.text)}
                  icon={
                    copiedIdx === i ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedIdx === i ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* English Version */}
              <p className="text-sm font-semibold text-zinc-900 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                "{v.text}"
              </p>

              {/* Natural Hinglish Version */}
              <p className="text-xs font-medium text-rose-700 italic bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/60">
                Hinglish: "{v.hinglish}"
              </p>

              <p className="text-xs text-zinc-500">
                <strong className="text-zinc-700">Why it works:</strong> {v.explanation}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        icon={<Wand2 />}
        title="Make this better"
        subtitle="Turn dry, awkward, or ordinary texts into memorable messages in the tone you want."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Wand2 />,
          title: 'Your polished messages appear here',
          description: 'Type a rough draft, pick a tone, and we will give you a few better versions.',
        }}
      />
    </PageContainer>
  );
};
