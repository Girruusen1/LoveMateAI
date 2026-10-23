import React, { useState } from 'react';
import {
  Check,
  Copy,
  Flame,
  Laugh,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { ReplyCopilotResult } from '../../types';
import {
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const ReplyCopilotView: React.FC = () => {
  const { user, loveMateProfile, recordAdviceFeedback, showToast } = useApp();

  const [threadContext, setThreadContext] = useState(
    "You: 'Hey, are you free this weekend? Was thinking about that new cafe.'\nThem: 'haha maybe, busy with work rn but we will see 😂'"
  );
  const [lastMessage, setLastMessage] = useState('haha maybe, busy with work rn but we will see 😂');
  const [loading, setLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<ReplyCopilotResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateReplies = async () => {
    if (!lastMessage.trim()) return;
    setLoading(true);
    try {
      const res = await AIService.generateReplyCopilot(threadContext, lastMessage);
      setCopilotResult(res);
      showToast('Copilot generated 6 contextual options! ✨', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Generation error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOption = async (key: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedKey(key);
    recordAdviceFeedback({
      helpfulness: 'helpful',
      note: `Selected ${key} reply in Copilot`,
      featureContext: 'ReplyCopilot',
    });
    showToast(`Copied ${key} reply! Preference logged ❤️`, 'love');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const form = (
    <Card>
      <div className="space-y-4">
        <div>
          <FieldLabel>Ongoing conversation thread</FieldLabel>
          <Textarea
            rows={4}
            value={threadContext}
            onChange={(e) => setThreadContext(e.target.value)}
            placeholder="Paste the previous 2-3 messages..."
          />
        </div>

        <div>
          <FieldLabel>The message you need to reply to</FieldLabel>
          <Input
            type="text"
            value={lastMessage}
            onChange={(e) => setLastMessage(e.target.value)}
            placeholder="e.g. 'haan dekhte hain 😂' or 'I miss you'"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!lastMessage.trim()}
          onClick={handleGenerateReplies}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Generate replies
        </Button>
      </div>
    </Card>
  );

  const resultView = copilotResult ? (
    <div className="space-y-4">
      <SectionHeading
        title="Choose your move"
        description="Click a card to copy it. Your preference is learned automatically."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'best', label: 'Best balanced reply', icon: <Star />, text: copilotResult.bestReply },
          { key: 'playful', label: 'Playful banter', icon: <Laugh />, text: copilotResult.playfulReply },
          { key: 'flirty', label: 'Flirty and confident', icon: <Flame />, text: copilotResult.flirtyReply },
          { key: 'safe', label: 'Safe and low-stakes', icon: <Shield />, text: copilotResult.safeReply },
          { key: 'extender', label: 'Conversation extender', icon: <MessageCircle />, text: copilotResult.conversationExtender },
          { key: 'topic', label: 'Smooth topic change', icon: <RefreshCw />, text: copilotResult.changeTopic },
        ].map((opt) => (
          <Card
            key={opt.key}
            variant="interactive"
            onClick={() => handleCopyOption(opt.key, opt.text)}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-zinc-800">
                <span className="flex items-center gap-1.5 text-rose-600 [&>svg]:w-4 [&>svg]:h-4">
                  {opt.icon}
                  <span className="text-zinc-800">{opt.label}</span>
                </span>
                <span className="text-zinc-400">
                  {copiedKey === opt.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-900 leading-snug">"{opt.text}"</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Hinglish Bonus Callout */}
      <Card variant="accent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Natural Hinglish alternative
            </span>
            <p className="text-sm font-bold text-zinc-900 mt-1">"{copilotResult.hinglishBonus}"</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => handleCopyOption('hinglish', copilotResult.hinglishBonus)}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Copy Hinglish
          </Button>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<MessageSquareText />}
        title="Reply copilot"
        subtitle="Paste the ongoing chat and the message you are stuck on. We read the momentum and draft six replies in your natural voice."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <MessageSquareText />,
          title: 'Your reply options appear here',
          description: 'Add the conversation context on the left and generate six tailored replies.',
        }}
      />
    </PageContainer>
  );
};
