import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Coffee,
  Copy,
  Flame,
  Heart,
  Laugh,
  MessageCircle,
  MessageSquareText,
  Smile,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { isAiLimitError } from '../../utils/aiErrors';
import { uid } from '../../utils/uid';
import { AIService } from '../../services/ai';
import { ReplySuggestion } from '../../types';
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

export const ReplyGeneratorView: React.FC = () => {
  const { addPoints, showToast, saveReplyItem } = useApp();

  const [inputMessage, setInputMessage] = useState('haha okay 😂');
  const [selectedIntent, setSelectedIntent] = useState('Flirty');
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState<ReplySuggestion['replies']>([
    {
      id: 'rep_1',
      text: `Are you always this charming, or did you practice that line specifically on me? 😏`,
      vibe: 'Playful & Teasing',
      explanation: 'Puts the spotlight on them and playfully hints that you find them attractive.',
    },
    {
      id: 'rep_2',
      text: `Careful, talk like that and you might actually convince me to take you out this weekend.`,
      vibe: 'Bold & Confident',
      explanation: 'High confidence reply that bridges digital banter into a real-life meetup.',
    },
    {
      id: 'rep_3',
      text: `My friends warned me about people like you... apparently you're dangerous to my focus 😂`,
      vibe: 'Cute Banter',
      explanation: 'Lighthearted compliment disguised as a friendly warning.',
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  /** Keys (input + reply text) of replies already saved, so each one is saved once */
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const replyKey = (text: string) => `${inputMessage.trim()}|${text}`;

  const handleSaveReply = (rep: ReplySuggestion['replies'][number]) => {
    const key = replyKey(rep.text);
    if (savedKeys.includes(key)) return;
    saveReplyItem({
      id: uid('reply'),
      inputMessage: inputMessage.trim(),
      intent: selectedIntent,
      replies: [rep],
      createdAt: new Date().toISOString(),
    });
    setSavedKeys((prev) => [...prev, key]);
  };

  const intents = [
    { label: 'Flirty', icon: <Sparkles />, desc: 'Spark playful romantic tension' },
    { label: 'Cute', icon: <Smile />, desc: 'Warm, sweet, and disarming' },
    { label: 'Funny', icon: <Laugh />, desc: 'Humorous banter & meme energy' },
    { label: 'Casual', icon: <Coffee />, desc: 'Cool, low pressure, effortless' },
    { label: 'Romantic', icon: <Heart />, desc: 'Deeper emotional sincerity' },
    { label: 'Savage', icon: <Flame />, desc: 'Playful roasts for dry texters' },
    { label: 'Keep conversation going', icon: <MessageCircle />, desc: 'Revive dying chat topics' },
  ];

  const handleGenerate = async (customIntent?: string) => {
    const intentToUse = customIntent || selectedIntent;
    if (!inputMessage.trim()) {
      showToast('Please paste a received message first!', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const generated = await AIService.generateReplies(inputMessage, intentToUse);
      setReplies(generated);
      addPoints(10, 'Generated Replies');
      showToast('Generated 3 tactical replies! 🔥', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Error generating replies', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Reply copied! Hit send before you overthink 🚀', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const form = (
    <Card className="space-y-5">
      <div>
        <FieldLabel>What did they say?</FieldLabel>
        <Input
          type="text"
          placeholder="e.g. 'haha okay', 'busy today', 'what are you up to?'"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>Reply vibe</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {intents.map((intent) => (
            <Chip
              key={intent.label}
              selected={selectedIntent === intent.label}
              icon={intent.icon}
              onClick={() => {
                setSelectedIntent(intent.label);
                handleGenerate(intent.label);
              }}
            >
              {intent.label}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {intents.find((i) => i.label === selectedIntent)?.desc}
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => handleGenerate()}
        loading={isLoading}
        icon={<Zap className="w-4 h-4" />}
      >
        Generate replies
      </Button>
    </Card>
  );

  const result =
    replies.length > 0 ? (
      <div className="space-y-4">
        <SectionHeading title="Suggested replies" description={`For: "${inputMessage}"`} />

        <div className="grid grid-cols-1 gap-3.5">
          {replies.map((rep, idx) => (
            <Card key={rep.id || idx} padding="sm" className="space-y-3 hover:border-rose-200">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="rose">
                  Option {idx + 1} · {rep.vibe}
                </Badge>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveReply(rep)}
                    disabled={savedKeys.includes(replyKey(rep.text))}
                    icon={
                      savedKeys.includes(replyKey(rep.text)) ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {savedKeys.includes(replyKey(rep.text)) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(rep.id, rep.text)}
                    icon={
                      copiedId === rep.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedId === rep.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <p className="text-sm font-semibold text-zinc-900 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                "{rep.text}"
              </p>

              <p className="text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-700">Why this works:</strong> {rep.explanation}
              </p>
            </Card>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<MessageSquareText />}
        title="What should I reply?"
        subtitle="Paste their message, pick a vibe, and get three replies with a short note on why each one works."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <MessageSquareText />,
          title: 'No replies yet',
          description: 'Paste the message you received and choose a vibe to get three suggestions.',
        }}
      />
    </PageContainer>
  );
};
