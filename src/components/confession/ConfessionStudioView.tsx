import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Glasses,
  Mail,
  RefreshCw,
  Scissors,
  Share2,
  Smile,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { ConfessionItem, Language } from '../../types';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  Select,
  ToolLayout,
} from '../common/UIPrimitives';
import { SavedConfessions } from '../common/SavedItems';

export const ConfessionStudioView: React.FC = () => {
  const { user, saveConfession, openShareModal, showToast, triggerConfetti } = useApp();

  const [recipient, setRecipient] = useState('Crush');
  const [tone, setTone] = useState('Cute');
  const [language, setLanguage] = useState<Language>(user?.preferredLanguage || 'hinglish');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfession, setGeneratedConfession] = useState<string>(
    `Hey! Main bas itna kehna chahta hu ki jab bhi tera text aata hai na, mere chehre par ek silly si smile aa jati hai. You kind of make my ordinary days a lot brighter ❤️`
  );
  const [copied, setCopied] = useState(false);

  const recipients = ['Crush', 'Best Friend', 'Partner', 'Someone Special'];
  const tones = ['Cute', 'Romantic', 'Funny', 'Emotional', 'Confident', 'Shy', 'Deep'];
  const lengths: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];

  const handleGenerate = async (customPromptModifier?: string) => {
    setIsGenerating(true);
    let finalTone = tone;
    let finalLength = length;

    if (customPromptModifier === 'shorter') finalLength = 'short';
    if (customPromptModifier === 'cuter') finalTone = 'Cute';
    if (customPromptModifier === 'confident') finalTone = 'Confident';
    if (customPromptModifier === 'deep') finalTone = 'Deep';

    try {
      const confessionText = await AIService.generateConfession(recipient, finalTone, language, finalLength);
      setGeneratedConfession(confessionText);
      triggerConfetti();
      if (customPromptModifier) {
        showToast(`Adjusted: ${customPromptModifier}! ✨`, 'love');
      } else {
        showToast('Confession written with love ❤️', 'love');
      }
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Error generating confession', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(generatedConfession);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopied(true);
    showToast('Confession copied! Ready to send 💌', 'love');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const item: ConfessionItem = {
      id: 'conf_' + Date.now(),
      recipient,
      tone,
      language,
      length,
      content: generatedConfession,
      createdAt: 'Just now',
    };
    saveConfession(item);
  };

  const form = (
    <Card className="space-y-5">
      <div>
        <FieldLabel>Who are you confessing to?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {recipients.map((rec) => (
            <Chip key={rec} selected={recipient === rec} onClick={() => setRecipient(rec)}>
              {rec}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Tone</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Chip key={t} selected={tone === t} onClick={() => setTone(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Language</FieldLabel>
        <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          <option value="hinglish">Hinglish (Natural & Relatable)</option>
          <option value="english">English (Modern & Thoughtful)</option>
          <option value="roman_hindi">Roman Hindi</option>
          <option value="hindi">Hindi (हिंदी)</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Length</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {lengths.map((len) => (
            <Chip key={len} selected={length === len} onClick={() => setLength(len)} className="capitalize">
              {len}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => handleGenerate()}
        loading={isGenerating}
        icon={<Wand2 className="w-4 h-4" />}
      >
        Generate confession
      </Button>
    </Card>
  );

  const result = generatedConfession ? (
    <div className="space-y-4">
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-zinc-900">Your confession</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {recipient} · {tone} · {language}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleSave} title="Save this confession" icon={<Bookmark className="w-4 h-4" />}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                openShareModal({
                  type: 'confession',
                  data: { recipient, tone, content: generatedConfession },
                })
              }
              title="Share as card"
              icon={<Share2 className="w-4 h-4" />}
            >
              Share
            </Button>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-rose-50/50 border border-rose-100 text-zinc-800 text-sm leading-relaxed font-serif italic selection:bg-rose-200">
          "{generatedConfession}"
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-700 mb-2">Quick adjustments</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleGenerate('shorter')} icon={<Scissors className="w-3.5 h-3.5" />}>
              Make it shorter
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerate('cuter')} icon={<Smile className="w-3.5 h-3.5" />}>
              Make it cuter
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerate('confident')} icon={<Glasses className="w-3.5 h-3.5" />}>
              More confident
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleGenerate('deep')} icon={<Sparkles className="w-3.5 h-3.5" />}>
              Less cringe, deeper
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => handleGenerate()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Regenerate
          </Button>
          <Button
            variant="primary"
            onClick={handleCopy}
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied' : 'Copy confession'}
          </Button>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Mail />}
        title="Write a confession"
        subtitle="Pick who it is for, the tone and the language, and get a confession that sounds like you."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <Mail />,
          title: 'Your confession will appear here',
          description: 'Choose a recipient, tone and language on the left, then generate.',
        }}
      />

      <SavedConfessions />
    </PageContainer>
  );
};
