import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Heart,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { isAiLimitError } from '../../utils/aiErrors';
import { AIService } from '../../services/ai';
import { AIMessage, AIPersonality, Language } from '../../types';
import { LoveMateLogo } from '../common/LoveMateLogo';
import { Badge, Button, Card, Chip, Input, PageContainer, PageHeader, Select } from '../common/UIPrimitives';
import { SavedChats, type SavedChat } from '../common/SavedItems';

const CHAT_DRAFT_KEY = 'lovemate_chat_draft_v1';

type FeedbackValue = 'up' | 'down';

interface ChatDraft {
  personality: AIPersonality;
  language: Language;
  messages: AIMessage[];
  feedback: Record<string, FeedbackValue>;
}

function loadChatDraft(): ChatDraft | null {
  try {
    const raw = localStorage.getItem(CHAT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatDraft>;
    if (!parsed || !Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
    return {
      personality: parsed.personality || 'wingman',
      language: parsed.language || 'hinglish',
      messages: parsed.messages,
      feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : {},
    };
  } catch {
    return null;
  }
}

export const AIChatView: React.FC = () => {
  const {
    user,
    aiMemoryEnabled,
    memories,
    saveChatConversation,
    addPoints,
    showToast,
    triggerConfetti,
    submitAiFeedback,
  } = useApp();

  // Restore the live conversation so switching tabs does not lose it
  const [initialDraft] = useState<ChatDraft | null>(() => loadChatDraft());
  const [personality, setPersonality] = useState<AIPersonality>(initialDraft?.personality || 'wingman');
  const [language, setLanguage] = useState<Language>(initialDraft?.language || user?.preferredLanguage || 'hinglish');
  const [messages, setMessages] = useState<AIMessage[]>(
    initialDraft?.messages || [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hey ${user?.name || 'there'}! I'm your private AI wingman ❤️ Whether you're decoding a confusing dry text, planning a confession, or trying to fix an argument, I'm right here with you. What's on your mind?`,
        timestamp: 'Just now',
      },
    ]
  );
  const [feedback, setFeedback] = useState<Record<string, FeedbackValue>>(initialDraft?.feedback || {});
  const skipNextPersist = useRef(false);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    // Only persist once the user has actually said something
    if (!messages.some((m) => m.role === 'user')) return;
    try {
      const draft: ChatDraft = { personality, language, messages, feedback };
      localStorage.setItem(CHAT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage full or unavailable */
    }
  }, [messages, personality, language, feedback]);

  const handleFeedback = (msgId: string, helpful: boolean) => {
    const value: FeedbackValue = helpful ? 'up' : 'down';
    if (feedback[msgId] === value) return; // already recorded
    setFeedback((prev) => ({ ...prev, [msgId]: value }));
    submitAiFeedback('chat', helpful);
  };
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const suggestedPrompts = [
    'Does my crush like me?',
    'Bhai, uska reply dry aa raha hai 😭',
    'What should I text her today?',
    'How do I confess without making it awkward?',
    'We just had an argument.',
    'Give me a cute, witty opener.',
  ];

  const personalities = [
    { id: 'wingman' as AIPersonality, label: 'Wingman', icon: <HeartHandshake />, desc: 'Supportive, witty, high-EQ' },
    { id: 'empath' as AIPersonality, label: 'Warm empath', icon: <Heart />, desc: 'Gentle, validating listener' },
    { id: 'savage' as AIPersonality, label: 'Direct', icon: <Zap />, desc: 'Honest reality check' },
    { id: 'poet' as AIPersonality, label: 'Poetic', icon: <Sparkles />, desc: 'Artistic, thoughtful romantic' },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: AIMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const memoryFacts = aiMemoryEnabled ? memories.map((m) => m.fact) : [];
    const aiId = 'ai_' + Date.now();
    let started = false;

    try {
      const reply = await AIService.generateChatReply(
        text,
        messages.map((m) => ({ role: m.role, content: m.content })),
        personality,
        language,
        memoryFacts,
        // Streamed tokens: create the reply bubble on the first token, then grow it.
        (delta) => {
          if (!started) {
            started = true;
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: aiId, role: 'assistant', content: delta, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), language, personality },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: m.content + delta } : m)));
          }
        },
        { userName: user?.name, partnerName: user?.partnerName }
      );

      const aiMsg: AIMessage = {
        id: aiId,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language,
        personality,
      };

      // Replace the streamed bubble with the final text (or add it when nothing streamed, e.g. demo mode).
      setMessages((prev) => (started ? prev.map((m) => (m.id === aiId ? aiMsg : m)) : [...prev, aiMsg]));
      addPoints(5);
    } catch (err) {
      if (started) setMessages((prev) => prev.filter((m) => m.id !== aiId));
      if (!isAiLimitError(err)) showToast('LoveMate is having trouble right now. Please try again.', 'info');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Copied to clipboard! 📋', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Clear current chat conversation?')) {
      try {
        localStorage.removeItem(CHAT_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      skipNextPersist.current = true;
      setFeedback({});
      setMessages([
        {
          id: 'msg_welcome_' + Date.now(),
          role: 'assistant',
          content: "Conversation cleared. Fresh slate! What's on your mind now?",
          timestamp: 'Just now',
        },
      ]);
      showToast('Chat cleared', 'info');
    }
  };

  const handleSaveChat = () => {
    if (messages.length <= 1) {
      showToast('No conversation to save yet!', 'info');
      return;
    }
    const title = messages.find((m) => m.role === 'user')?.content.slice(0, 32) + '...' || 'AI Chat Session';
    saveChatConversation(title, messages);
    triggerConfetti();
  };

  /** Load a saved chat back into the window so the user can keep talking from where it ended. */
  const handleOpenSavedChat = (chat: SavedChat) => {
    if (isTyping) return;
    setFeedback({});
    setMessages(chat.messages);
    const first = chat.messages.find((m) => m.personality)?.personality;
    if (first) setPersonality(first);
    showToast(`Opened "${chat.title}"`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || isTyping) return;
    setIsTyping(true);
    try {
      const reply = await AIService.generateChatReply(
        lastUserMsg.content,
        [],
        personality,
        language,
        aiMemoryEnabled ? memories.map((m) => m.fact) : []
      );
      const aiMsg: AIMessage = {
        id: 'ai_regen_' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language,
        personality,
      };
      setMessages((prev) => [...prev, aiMsg]);
      showToast('Regenerated fresh perspective ✨', 'info');
    } catch (err) {
      if (!isAiLimitError(err)) showToast('LoveMate is having trouble right now. Please try again.', 'info');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<MessageSquare />}
        title="AI chat"
        subtitle="Your private wingman for love and dating. Decode dry texts, plan a confession or talk through an argument."
        actions={
          <>
            <Badge
              variant={aiMemoryEnabled ? 'purple' : 'zinc'}
              size="md"
              className="hidden sm:inline-flex"
            >
              <Sparkles className="w-3 h-3" />
              {aiMemoryEnabled ? `Memory (${memories.length})` : 'Memory off'}
            </Badge>
            <Button variant="secondary" size="sm" icon={<Bookmark className="w-3.5 h-3.5" />} onClick={handleSaveChat}>
              Save
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleClear}>
              Clear
            </Button>
          </>
        }
      />

      {/* Personality & language */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {personalities.map((p) => (
            <Chip
              key={p.id}
              selected={personality === p.id}
              icon={p.icon}
              onClick={() => {
                setPersonality(p.id);
                showToast(`Switched vibe to: ${p.label}`, 'info');
              }}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        <Select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="sm:w-44 py-1.5 text-xs font-semibold"
          aria-label="Reply language"
        >
          <option value="hinglish">Hinglish</option>
          <option value="english">English</option>
          <option value="roman_hindi">Roman Hindi</option>
          <option value="hindi">Hindi (Devanagari)</option>
        </Select>
      </div>

      {/* Chat */}
      <Card padding="none" className="flex flex-col min-h-[60vh]">
        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[65vh]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}
              >
                {!isUser ? (
                  <div className="mt-0.5">
                    <LoveMateLogo variant="icon" size="sm" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 text-xs font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[76%] space-y-1">
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-rose-600 text-white rounded-tr-md shadow-2xs'
                        : 'bg-zinc-50 text-zinc-900 rounded-tl-md border border-zinc-200/80'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[10px] text-zinc-400 px-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-rose-600 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, true)}
                          className={feedback[msg.id] === 'up' ? 'text-emerald-600' : 'hover:text-zinc-700'}
                          title="Helpful response"
                          aria-label="Mark response as helpful"
                          aria-pressed={feedback[msg.id] === 'up'}
                        >
                          <ThumbsUp className={`w-3 h-3 ${feedback[msg.id] === 'up' ? 'fill-emerald-500' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, false)}
                          className={feedback[msg.id] === 'down' ? 'text-rose-600' : 'hover:text-zinc-700'}
                          title="Unhelpful response"
                          aria-label="Mark response as not helpful"
                          aria-pressed={feedback[msg.id] === 'down'}
                        >
                          <ThumbsDown className={`w-3 h-3 ${feedback[msg.id] === 'down' ? 'fill-rose-500' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5 animate-in fade-in">
              <LoveMateLogo variant="icon" size="sm" />
              <div className="px-4 py-3 bg-zinc-50 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border border-zinc-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
                <span className="text-[11px] text-zinc-500 font-medium ml-1">LoveMate is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        <div className="px-4 sm:px-6 py-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 shrink-0">Try asking:</span>
          {suggestedPrompts.map((prompt) => (
            <Chip key={prompt} onClick={() => handleSend(prompt)}>
              {prompt}
            </Chip>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {messages.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                title="Regenerate last response"
                aria-label="Regenerate last response"
                className="hidden sm:inline-flex h-10 w-10 px-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <Input
              type="text"
              placeholder="Ask anything about your crush, a text reply, or relationship advice..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!inputText.trim() || isTyping}
              className="h-10 w-10 px-0 shrink-0"
              title="Send"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-xs text-center text-zinc-500 mt-2">
            Private and confidential. LoveMate wingman advice does not replace licensed therapy.
          </p>
        </div>
      </Card>

      <SavedChats onOpen={handleOpenSavedChat} />
    </PageContainer>
  );
};
